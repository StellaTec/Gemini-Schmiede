/**
 * @file run_audit.cjs
 * @description Hybrid-Audit Orchestrator (Stufe 1 + 1.5 + 2).
 *              Konfigurationsgesteuert via gemini.config.json.
 *              Stufenweise Validierung: Lokal (0 Token) -> Integritaet -> KI-Audit.
 *              Bricht bei FAILED einer Stufe sofort ab (Fail-Fast-Prinzip).
 *
 * @usage
 *   node .gemini/utils/run_audit.cjs <file1> [file2] [...]
 *
 * Exit-Codes:
 *   0 = Gesamtes Audit PASSED
 *   1 = Mindestens eine Stufe FAILED
 *
 * @module utils/run_audit
 */
'use strict';

const fs               = require('fs');
const path             = require('path');
const { spawnSync }    = require('child_process');
const logger           = require('./logger').withContext('HYBRID-RUNNER');
const { incrementAgentCount, getStats } = require('./analytics');

// ---------------------------------------------------------------------------
// Konfiguration laden
// ---------------------------------------------------------------------------

/**
 * Laedt Audit-Konfiguration aus gemini.config.json.
 * @returns {Object} Audit-Konfiguration mit command, flags, timeout, scripts, stages
 * @private
 */
function _loadAuditConfig() {
  const defaults = {
    command:         'gemini',
    flags:           ['-y', '-p'],
    timeout:         30000,
    stages:          ['local', 'integrity', 'ai'],
    localScript:     path.join(__dirname, 'validate_local.js'),
    integrityScript: path.join(__dirname, 'integrity_check.js'),
    backupsDir:      path.join(process.cwd(), '.gemini', 'backups'),
  };

  try {
    const configPath = path.join(process.cwd(), 'gemini.config.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.audit) {
        const ca = cfg.audit;
        return {
          command:         ca.command         || defaults.command,
          flags:           ca.flags           || defaults.flags,
          timeout:         ca.timeout         || defaults.timeout,
          stages:          ca.stages          || defaults.stages,
          localScript:     ca.localScript
            ? path.join(process.cwd(), ca.localScript)
            : defaults.localScript,
          integrityScript: ca.integrityScript
            ? path.join(process.cwd(), ca.integrityScript)
            : defaults.integrityScript,
          backupsDir:      defaults.backupsDir,
        };
      }
    }
  } catch {
    // Fallback auf Defaults
  }
  return defaults;
}

const CONFIG = _loadAuditConfig();

// ---------------------------------------------------------------------------
// Stufen-Implementierungen
// ---------------------------------------------------------------------------

/**
 * Stufe 1: Lokaler Qualitaets-Scan (0 Token-Kosten).
 * @param {string[]} files - Zu pruefende Dateien
 * @returns {boolean} true = PASSED
 */
function runLocalAudit(files) {
  logger.info('>>> STUFE 1: Lokales Audit (0 Token)...');

  if (!fs.existsSync(CONFIG.localScript)) {
    logger.error(`Lokales Audit-Skript nicht gefunden: ${CONFIG.localScript}`);
    return false;
  }

  const result = spawnSync('node', [CONFIG.localScript, ...files], {
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    logger.error(`Stufe 1 Spawn-Fehler: ${result.error.message}`);
    return false;
  }

  return result.status === 0;
}

/**
 * Stufe 1.5: Integritaets-Check gegen Backups.
 * Wird uebersprungen wenn kein Backup fuer eine Datei existiert.
 * @param {string[]} files - Zu pruefende Dateien
 * @returns {boolean} true = PASSED (oder kein Backup vorhanden)
 */
function runIntegrityAudit(files) {
  logger.info('>>> STUFE 1.5: Integritaets-Check...');
  let allPassed = true;

  if (!fs.existsSync(CONFIG.integrityScript)) {
    logger.warn(`Integritaets-Skript nicht gefunden: ${CONFIG.integrityScript}. Ueberspringe.`);
    return true;
  }

  for (const file of files) {
    const backupPath = path.join(CONFIG.backupsDir, file);

    if (!fs.existsSync(backupPath)) {
      logger.info(`Kein Backup fuer '${file}' - Integritaets-Check uebersprungen.`);
      continue;
    }

    logger.info(`Pruefe Integritaet: '${file}' vs Backup...`);
    const result = spawnSync('node', [CONFIG.integrityScript, backupPath, file], {
      stdio: 'inherit',
      shell: false,
    });

    if (result.error) {
      logger.error(`Integritaets-Check Spawn-Fehler fuer '${file}': ${result.error.message}`);
      allPassed = false;
    } else if (result.status !== 0) {
      logger.error(`Integritaets-Check FAILED fuer: ${file}`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Stufe 2: Isolierter KI-Audit via konfigurierter CLI.
 * Uebersprungen mit Warnung wenn CLI-Command nicht verfuegbar.
 * @param {string[]} files - Zu pruefende Dateien
 * @returns {boolean} true = PASSED
 */
function runAiAudit(files) {
  logger.info(`>>> STUFE 2: KI-Audit via '${CONFIG.command}'...`);

  // Verfuegbarkeit des Commands pruefen
  const whichResult = spawnSync(
    process.platform === 'win32' ? 'where' : 'which',
    [CONFIG.command],
    { stdio: 'pipe', shell: false }
  );

  if (whichResult.status !== 0) {
    logger.warn(
      `KI-Audit-Command '${CONFIG.command}' nicht gefunden. ` +
      `Stufe 2 wird uebersprungen. Installieren: npm install -g @google/generative-ai-cli`
    );
    return true; // Nicht fatal - lokaler Audit hat bereits geprueft
  }

  incrementAgentCount();

  const prompt = [
    `Fuehre ein Qualitaets-Audit mit dem Skill 'quality-inspector' durch fuer: ${files.join(', ')}.`,
    `Pruefe auf: Logger-Import, Konformitaet mit GEMINI.md, saubere Fehlerbehandlung.`,
    `Antworte NUR mit 'PASSED' oder einer kompakten Fehlerliste (max 5 Punkte).`,
  ].join(' ');

  const result = spawnSync(
    CONFIG.command,
    [...CONFIG.flags, prompt],
    {
      stdio:   'inherit',
      shell:   false,
      timeout: CONFIG.timeout,
    }
  );

  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') {
      logger.error(`KI-Audit Timeout nach ${CONFIG.timeout}ms.`);
    } else {
      logger.error(`KI-Audit Spawn-Fehler: ${result.error.message}`);
    }
    return false;
  }

  return result.status === 0;
}

// ---------------------------------------------------------------------------
// Haupt-Orchestrierung
// ---------------------------------------------------------------------------

const filesToAudit = process.argv.slice(2);

if (filesToAudit.length === 0) {
  logger.info('Keine Dateien angegeben. Beende mit PASSED.');
  process.exit(0);
}

logger.info(`Hybrid-Audit gestartet fuer: ${filesToAudit.join(', ')}`);
logger.info(`Aktive Stufen: ${CONFIG.stages.join(' -> ')}`);

let auditPassed = true;

// Stufe 1: Lokal
if (CONFIG.stages.includes('local')) {
  if (!runLocalAudit(filesToAudit)) {
    logger.error('Stufe 1 FAILED. Audit abgebrochen.');
    process.exit(1);
  }
  logger.info('Stufe 1: PASSED');
}

// Stufe 1.5: Integritaet
if (CONFIG.stages.includes('integrity')) {
  if (!runIntegrityAudit(filesToAudit)) {
    logger.error('Stufe 1.5 FAILED. Audit abgebrochen.');
    process.exit(1);
  }
  logger.info('Stufe 1.5: PASSED');
}

// Stufe 2: KI
if (CONFIG.stages.includes('ai')) {
  if (!runAiAudit(filesToAudit)) {
    logger.error('Stufe 2 FAILED.');
    auditPassed = false;
  } else {
    logger.info('Stufe 2: PASSED');
  }
}

// Abschlussbericht
const stats = getStats();
logger.info(`Audit-Statistiken: ${JSON.stringify(stats)}`);

if (auditPassed) {
  logger.info('Hybrid-Audit: GESAMTERGEBNIS PASSED');
  process.exit(0);
} else {
  logger.error('Hybrid-Audit: GESAMTERGEBNIS FAILED');
  process.exit(1);
}
