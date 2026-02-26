/**
 * @file test_logger.cjs
 * @description Test: Zentraler Logger (logger.js)
 *
 * Prueft:
 *   1. Alle Log-Level (debug, info, warn, error)
 *   2. withContext() erstellt neue Instanz mit korrektem Kontext
 *   3. Log-Datei wird erstellt und Eintraege werden geschrieben
 *   4. Singleton-Verhalten (gleiche Instanz bei mehrfachem require)
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT      = path.join(__dirname, '..');
const LOG_FILE  = path.join(ROOT, '.gemini', 'logs', 'system.log');
let testsPassed = 0;
let testsFailed = 0;

/** Prueft eine Bedingung und gibt Ergebnis aus */
function assert(condition, description) {
  if (condition) {
    process.stdout.write(`  [PASS] ${description}\n`);
    testsPassed++;
  } else {
    process.stderr.write(`  [FAIL] ${description}\n`);
    testsFailed++;
  }
}

// ---------------------------------------------------------------------------
process.stdout.write('Test: logger.js\n');

const logSizeBefore = fs.existsSync(LOG_FILE)
  ? fs.statSync(LOG_FILE).size : 0;

const logger = require('../.gemini/utils/logger');

// Test 1: Basis-Methoden vorhanden
assert(typeof logger.info  === 'function', 'logger.info ist eine Funktion');
assert(typeof logger.debug === 'function', 'logger.debug ist eine Funktion');
assert(typeof logger.warn  === 'function', 'logger.warn ist eine Funktion');
assert(typeof logger.error === 'function', 'logger.error ist eine Funktion');
assert(typeof logger.withContext === 'function', 'logger.withContext ist eine Funktion');

// Test 2: Default-Kontext
assert(logger.context === 'SYSTEM', 'Default-Kontext ist SYSTEM');

// Test 3: withContext erstellt neue Instanz
const testLogger = logger.withContext('TEST-UNIT');
assert(testLogger !== logger, 'withContext erstellt neue Instanz');
assert(testLogger.context === 'TEST-UNIT', 'Neue Instanz hat korrekten Kontext');

// Test 4: Singleton
const logger2 = require('../.gemini/utils/logger');
assert(logger === logger2, 'Singleton: gleiche Instanz bei mehrfachem require');

// Test 5: Log-Aufrufe ohne Exceptions
let noException = true;
try {
  testLogger.info('Test INFO vom Unit-Test');
  testLogger.warn('Test WARN vom Unit-Test');
  testLogger.error('Test ERROR vom Unit-Test');
} catch { noException = false; }
assert(noException, 'Log-Aufrufe werfen keine Exceptions');

// Test 6: Log-Datei gewachsen
const logSizeAfter = fs.existsSync(LOG_FILE)
  ? fs.statSync(LOG_FILE).size : 0;
assert(fs.existsSync(LOG_FILE), 'Log-Datei existiert');
assert(logSizeAfter > logSizeBefore, 'Log-Datei hat neue Eintraege erhalten');

// Test 7: Korrektes Format im Log
if (fs.existsSync(LOG_FILE)) {
  const lastLines = fs.readFileSync(LOG_FILE, 'utf8').split('\n').slice(-10).join('\n');
  assert(lastLines.includes('[TEST-UNIT]'), 'Log enthaelt Kontext TEST-UNIT');
  assert(lastLines.includes('[INFO ]'), 'Log enthaelt INFO Level');
}

// ---------------------------------------------------------------------------
process.stdout.write(`\nErgebnis: ${testsPassed} bestanden, ${testsFailed} fehlgeschlagen\n`);
process.exit(testsFailed > 0 ? 1 : 0);
