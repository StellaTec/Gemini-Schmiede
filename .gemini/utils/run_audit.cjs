const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');
const logger = require('./logger').withContext('HYBRID-RUNNER');
const { incrementAgentCount, getStats } = require('./analytics');

const filesToAudit = process.argv.slice(2);

if (filesToAudit.length === 0) {
  logger.info('Keine Dateien zum Auditieren angegeben.');
  process.exit(0);
}

logger.info(`Starte Hybrid-Audit für: ${filesToAudit.join(', ')}`);

// --- STUFE 1 ---
logger.info('>>> STUFE 1: Starte lokales Audit...');
const localAudit = spawnSync('node', [path.join(__dirname, 'validate_local.js'), ...filesToAudit], {
  stdio: 'inherit',
  shell: true
});

if (localAudit.status !== 0) {
  process.exit(1);
}

// --- STUFE 1.5: Integritäts-Check ---
logger.info('>>> STUFE 1.5: Starte Integritäts-Check...');
for (const file of filesToAudit) {
  const backupPath = path.join('.gemini', 'backups', file);
  if (fs.existsSync(backupPath)) {
    logger.info(`Prüfe Integrität für ${file} gegen Backup...`);
    const integrityCheck = spawnSync('node', [
      path.join(__dirname, 'integrity_check.js'),
      backupPath,
      file
    ], { stdio: 'inherit', shell: true });

    if (integrityCheck.status !== 0) {
      logger.error(`Integritäts-Check für ${file} fehlgeschlagen!`);
      process.exit(1);
    }
  }
}

// --- STUFE 2 ---
logger.info('>>> STUFE 2: Starte isoliertes KI-Audit via Gemini-CLI...');
incrementAgentCount();

const auditPrompt = `Führe ein Qualitäts-Audit mit dem Skill 'quality-inspector' für folgende Dateien durch: ${filesToAudit.join(', ')}. Antworte nur mit 'PASSED' oder einer Liste von Fehlern.`;

// Wir nutzen die Shell-Variante und quoten den Prompt explizit.
const command = `gemini -y -p "${auditPrompt}"`;

const aiAudit = spawnSync(command, {
  stdio: 'inherit',
  shell: true
});

if (aiAudit.status !== 0) {
  logger.error('STUFE 2 (KI) FEHLGESCHLAGEN.');
  process.exit(1);
}

const currentStats = getStats();
logger.info('Aktuelle Statistiken aus stats.json:');
logger.info(JSON.stringify(currentStats, null, 2));

logger.info('Gesamtes Hybrid-Audit erfolgreich abgeschlossen.');
process.exit(0);
