/**
 * Demo-Skript zur Verifikation des Logging-Systems.
 * Zeigt die Nutzung verschiedener Log-Level und Kontexte.
 */
const logger = require('../.gemini/utils/logger');

console.log('--- STARTE LOGGER DEMO ---');

// 1. Standard-Logging (Singleton)
logger.info('Dies ist eine Standard-Informationsmeldung.');
logger.warn('Achtung: Dies ist eine Warnmeldung.');

// 2. Logging mit spezifischem Kontext
const plannerLogger = logger.withContext('PLANNER');
plannerLogger.info('Startet die strategische Analyse...');
plannerLogger.debug('Analysiere Abhängigkeiten in GEMINI.md...');

// 3. Fehler-Logging
const errorLogger = logger.withContext('CODE-AGENT');
errorLogger.error('Kritischer Fehler: Datei konnte nicht gelesen werden!');

console.log('--- DEMO BEENDET ---');
console.log('Prüfe jetzt die Datei: .gemini/logs/system.log');
