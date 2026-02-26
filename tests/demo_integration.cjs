/**
 * @file demo_integration.cjs
 * @description Demo: Logger-System Integration.
 *              Referenz-Implementierung fuer korrekte Logger-Nutzung.
 *              Kein direktes console.log - alles ueber den zentralen Logger.
 */
'use strict';

const logger = require('../.gemini/utils/logger');

logger.info('STARTE LOGGER DEMO');

// 1. Standard-Logging (Singleton mit SYSTEM-Kontext)
logger.info('Standard-Informationsmeldung.');
logger.warn('Achtung: Das ist eine Warnmeldung.');

// 2. Kontext-spezifisches Logging via withContext()
const plannerLogger = logger.withContext('PLANNER');
plannerLogger.info('Startet strategische Analyse...');
plannerLogger.debug('Analysiere Abhaengigkeiten in GEMINI.md...');

// 3. Fehler-Logging
const workerLogger = logger.withContext('WORKER');
workerLogger.error('Beispiel: Datei konnte nicht gelesen werden.');

logger.info('DEMO BEENDET - Pruefen: .gemini/logs/system.log');
