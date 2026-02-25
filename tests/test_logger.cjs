const logger = require('../.gemini/utils/logger.js');
const fs = require('fs');
const path = require('path');

console.log('--- Logger Test Start ---');

logger.info('Dies ist eine Info-Nachricht');
logger.debug('Dies ist eine Debug-Nachricht');
logger.warn('Dies ist eine Warnung');
logger.error('Dies ist eine Fehlermeldung');

const scopedLogger = logger.withContext('TEST-SKILL');
scopedLogger.info('Nachricht mit speziellem Kontext');

console.log('--- Logger Test Ende ---');

// Kurze Verzögerung zur Sicherheit (obwohl appendFileSync synchron ist)
const logPath = path.join(__dirname, '..', '.gemini', 'logs', 'system.log');
if (fs.existsSync(logPath)) {
    console.log('Erfolg: Log-Datei wurde erstellt.');
    const content = fs.readFileSync(logPath, 'utf8');
    console.log('Inhalt der Log-Datei:');
    console.log(content);
} else {
    console.error('Fehler: Log-Datei wurde nicht gefunden.');
    process.exit(1);
}
