const fs = require('fs');
const path = require('path');
const logger = require('./logger').withContext('LOCAL-AUDIT');

/**
 * Lokaler Qualitäts-Scan für Dateien.
 * Prüft auf Architektur-Vorgaben ohne KI-Einsatz.
 */

const filesToScan = process.argv.slice(2);
let hasErrors = false;

if (filesToScan.length === 0) {
  logger.info('Keine Dateien zum Scannen angegeben.');
  process.exit(0);
}

logger.info(`Starte lokales Audit für ${filesToScan.length} Dateien...`);

filesToScan.forEach(filePath => {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(absolutePath)) {
    logger.error(`Datei nicht gefunden: ${filePath}`);
    hasErrors = true;
    return;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  const fileName = path.basename(filePath);

  // Regel 1: Logging-Import in JS/CJS Dateien
  if (filePath.endsWith('.js') || filePath.endsWith('.cjs')) {
    const hasLogger = content.includes('.gemini/utils/logger') || 
                      (filePath.includes('utils') && content.includes("require('./logger'"));
    
    if (!hasLogger) {
      logger.error(`[FEHLER] ${fileName}: Kein Import des zentralen Loggers gefunden!`);
      hasErrors = true;
    } else {
      logger.info(`[OK] ${fileName}: Logger-Import gefunden.`);
    }
  }

  // Regel 2: Keine console.log Direktaufrufe (sollten über den Logger laufen)
  if (content.includes('console.log(') && !filePath.includes('logger.js') && !filePath.includes('validate_local.js')) {
      logger.warn(`[WARNUNG] ${fileName}: Direkter console.log Aufruf gefunden. Bitte logger.info() nutzen.`);
  }
});

if (hasErrors) {
  logger.error('Lokales Audit FAILED.');
  process.exit(1);
} else {
  logger.info('Lokales Audit PASSED.');
  process.exit(0);
}
