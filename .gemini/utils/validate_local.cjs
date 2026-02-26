/**
 * @file validate_local.cjs
 * @description Lokaler Qualitäts-Scan für Dateien ohne KI-Einsatz. Prüft auf Architektur-Vorgaben.
 * @author WORKER-V1
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger.cjs').withContext('LOCAL-AUDIT');
const { resolveAbsolutePath } = require('./core/fs_utils.cjs');

/**
 * Führt ein lokales Audit für eine Liste von Dateien durch.
 * @param {string[]} filesToScan - Liste der Dateipfade.
 * @returns {boolean} true wenn Audit PASSED, false wenn FAILED.
 */
function runLocalAudit(filesToScan) {
  let hasErrors = false;

  if (filesToScan.length === 0) {
    logger.info('Keine Dateien zum Scannen angegeben.');
    return true;
  }

  logger.info(`Starte lokales Audit für ${filesToScan.length} Dateien...`);

  filesToScan.forEach(filePath => {
    try {
      const absolutePath = resolveAbsolutePath(filePath);

      if (!fs.existsSync(absolutePath)) {
        logger.error(`Datei nicht gefunden: ${filePath}`);
        hasErrors = true;
        return;
      }

      const content = fs.readFileSync(absolutePath, 'utf8');
      const fileName = path.basename(filePath);

      // Regel 1: Logging-Import in JS/CJS Dateien
      if (filePath.endsWith('.js') || filePath.endsWith('.cjs')) {
        const isExcluded = fileName === 'logger.cjs' || fileName === 'fs_utils.cjs';

        if (isExcluded) {
          logger.info(`[SKIP] ${fileName}: Logger-Pflicht übersprungen.`);
        } else {
          const hasLogger = content.includes('logger');

          if (!hasLogger) {
            logger.error(`[FEHLER] ${fileName}: Kein Import des zentralen Loggers gefunden!`);
            hasErrors = true;
          } else {
            logger.info(`[OK] ${fileName}: Logger-Import gefunden.`);
          }
        }
      }

      // Regel 2: Keine console.log Direktaufrufe (sollten über den Logger laufen)
      if (content.includes('console.log(') && !filePath.includes('logger.cjs') && !filePath.includes('validate_local.cjs')) {
          logger.warn(`[WARNUNG] ${fileName}: Direkter console.log Aufruf gefunden. Bitte logger.info() nutzen.`);
      }
    } catch (err) {
      logger.error(`Fehler beim Scannen von ${filePath}: ${err.message}`);
      hasErrors = true;
    }
  });

  return !hasErrors;
}

// CLI-Einstiegspunkt
if (require.main === module) {
  const files = process.argv.slice(2);
  const success = runLocalAudit(files);
  
  if (!success) {
    logger.error('Lokales Audit FAILED.');
    process.exit(1);
  } else {
    logger.info('Lokales Audit PASSED.');
    process.exit(0);
  }
}

module.exports = { runLocalAudit };
