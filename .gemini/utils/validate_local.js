/**
 * @file validate_local.js
 * @description Lokaler Qualitaets-Scanner (Stufe 1 des Hybrid-Audits).
 *              Prueft Architektur-Vorgaben OHNE KI-Einsatz (0 Token-Kosten).
 *              Laedt Regeln aus gemini.config.json wenn vorhanden.
 *
 * @usage CLI:
 *   node .gemini/utils/validate_local.js <file1> [file2] [...]
 *
 * Exit-Codes:
 *   0 = PASSED (alle Pruefungen bestanden)
 *   1 = FAILED (mindestens ein Fehler gefunden)
 *
 * @module utils/validate_local
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const logger = require('./logger').withContext('LOCAL-AUDIT');

// ---------------------------------------------------------------------------
// Konfiguration laden
// ---------------------------------------------------------------------------

/**
 * Laedt Validierungsregeln aus gemini.config.json.
 * @returns {{ loggerPatterns: string[], excludeFromLoggerCheck: string[], warnOnConsoleLogs: boolean }}
 * @private
 */
function _loadValidationConfig() {
  const defaults = {
    loggerPatterns: [
      '.gemini/utils/logger',
      "require('./logger'",
      "require('../utils/logger'",
    ],
    excludeFromLoggerCheck: [
      'logger.js',
      'validate_local.js',
      'error-handler.cjs',
      'run_tests.cjs',
    ],
    warnOnConsoleLogs: true,
  };

  try {
    const configPath = path.join(process.cwd(), 'gemini.config.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.validation) {
        return {
          loggerPatterns:           cfg.validation.loggerPatterns           || defaults.loggerPatterns,
          excludeFromLoggerCheck:   cfg.validation.excludeFromLoggerCheck   || defaults.excludeFromLoggerCheck,
          warnOnConsoleLogs:        cfg.validation.warnOnConsoleLogs        !== undefined
            ? cfg.validation.warnOnConsoleLogs : defaults.warnOnConsoleLogs,
        };
      }
    }
  } catch {
    // Lautlos auf Defaults zurueckfallen
  }
  return defaults;
}

// ---------------------------------------------------------------------------
// Pruef-Logik
// ---------------------------------------------------------------------------

/**
 * Prueft eine einzelne Datei auf Konformitaet mit den Architektur-Standards.
 *
 * @param {string} filePath - Pfad zur zu pruefenden Datei
 * @param {Object} config   - Validierungs-Konfiguration
 * @returns {{ passed: boolean, warnings: string[], errors: string[] }}
 */
function auditFile(filePath, config) {
  const result     = { passed: true, warnings: [], errors: [] };
  const fileName   = path.basename(filePath);
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  // Datei-Existenz
  if (!fs.existsSync(absolutePath)) {
    result.errors.push(`Datei nicht gefunden: ${filePath}`);
    result.passed = false;
    return result;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  const lines   = content.split('\n');

  // Regel 1: Logger-Import in JS/CJS Dateien
  if (filePath.endsWith('.js') || filePath.endsWith('.cjs')) {
    const isExcluded = config.excludeFromLoggerCheck.some(excl => fileName === excl);

    if (!isExcluded) {
      const hasLogger = config.loggerPatterns.some(p => content.includes(p));
      if (!hasLogger) {
        result.errors.push(
          `[FEHLER] ${fileName}: Kein Import des zentralen Loggers gefunden! ` +
          `Erwartet eines von: ${config.loggerPatterns.join(', ')}`
        );
        result.passed = false;
      } else {
        result.warnings.push(`[OK] ${fileName}: Logger-Import verifiziert.`);
      }
    }
  }

  // Regel 2: Direkter console.log Aufruf (Warnung)
  if (config.warnOnConsoleLogs) {
    const isExcluded = config.excludeFromLoggerCheck.some(excl => fileName === excl);
    if (!isExcluded) {
      const consoleLogLines = lines
        .map((l, i) => ({ line: i + 1, text: l }))
        .filter(l => l.text.includes('console.log('));

      if (consoleLogLines.length > 0) {
        consoleLogLines.forEach(l => {
          result.warnings.push(
            `[WARN] ${fileName}:${l.line}: console.log() gefunden - bitte logger.info() nutzen.`
          );
        });
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// CLI-Ausfuehrung
// ---------------------------------------------------------------------------

const filesToScan = process.argv.slice(2);

if (filesToScan.length === 0) {
  logger.info('Keine Dateien zum Scannen angegeben. Beende mit PASSED.');
  process.exit(0);
}

const config    = _loadValidationConfig();
let hasErrors   = false;
let totalFiles  = 0;
let passedFiles = 0;

logger.info(`Lokales Audit: ${filesToScan.length} Datei(en) werden geprueft...`);

filesToScan.forEach(filePath => {
  totalFiles++;
  const result = auditFile(filePath, config);

  // Warnungen ausgeben
  result.warnings.forEach(w => logger.info(w));

  if (result.passed) {
    passedFiles++;
  } else {
    result.errors.forEach(e => logger.error(e));
    hasErrors = true;
  }
});

logger.info(`Ergebnis: ${passedFiles}/${totalFiles} Dateien bestanden.`);

if (hasErrors) {
  logger.error('Lokales Audit: FAILED');
  process.exit(1);
} else {
  logger.info('Lokales Audit: PASSED');
  process.exit(0);
}

module.exports = { auditFile };
