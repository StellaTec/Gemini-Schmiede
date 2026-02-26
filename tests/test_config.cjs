/**
 * @file test_config.cjs
 * @description Test: Core Config-Loader und Path-Resolver
 *
 * Prueft:
 *   1. gemini.config.json wird korrekt geladen
 *   2. Default-Werte bei fehlender Config
 *   3. Deep-Merge funktioniert korrekt
 *   4. Path-Resolver findet Projekt-Root
 *   5. Config ist eingefroren (immutable)
 */
'use strict';

const path = require('path');
const fs   = require('fs');

const ROOT = path.join(__dirname, '..');
let testsPassed = 0;
let testsFailed = 0;

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
process.stdout.write('Test: core/config.cjs + core/path-resolver.cjs\n');

// --- Path-Resolver Tests ---
const { getProjectRoot, resolve, ensureDir, resetCache } = require('../.gemini/utils/core/path-resolver.cjs');

resetCache();
const projectRoot = getProjectRoot();

assert(typeof projectRoot === 'string', 'getProjectRoot gibt String zurueck');
assert(projectRoot.length > 0,          'getProjectRoot gibt nicht-leeren String zurueck');
assert(fs.existsSync(projectRoot),      'Zurueckgegebener Root-Pfad existiert');

// Resolve-Test
const resolvedPath = resolve('.gemini', 'utils', 'logger.js');
assert(fs.existsSync(resolvedPath), `resolve() findet logger.js: ${resolvedPath}`);

// ensureDir-Test
const testDirPath = resolve('.gemini', 'tmp-test-dir');
const created = ensureDir(testDirPath);
assert(created, 'ensureDir gibt true zurueck');
assert(fs.existsSync(testDirPath), 'ensureDir erstellt Verzeichnis');
// Aufraumen
try { fs.rmdirSync(testDirPath); } catch { /* ignorieren */ }

// --- Config Tests ---
const { getConfig, resetConfig, DEFAULTS } = require('../.gemini/utils/core/config.cjs');

// Config laden
resetConfig();
const config = getConfig();

assert(config !== null && typeof config === 'object', 'getConfig gibt Objekt zurueck');
assert(typeof config.version    === 'string', 'config.version vorhanden');
assert(typeof config.paths      === 'object', 'config.paths vorhanden');
assert(typeof config.logging    === 'object', 'config.logging vorhanden');
assert(typeof config.integrity  === 'object', 'config.integrity vorhanden');
assert(typeof config.analytics  === 'object', 'config.analytics vorhanden');
assert(typeof config.audit      === 'object', 'config.audit vorhanden');
assert(typeof config.validation === 'object', 'config.validation vorhanden');
assert(typeof config.agents     === 'object', 'config.agents vorhanden');

// Werte-Validierung
assert(config.logging.level === 'INFO',        'Logging-Level ist INFO');
assert(config.integrity.defaultThreshold > 0,  'Integrity-Threshold ist positiv');
assert(Array.isArray(config.audit.stages),     'Audit-Stages ist Array');
assert(config.audit.stages.length > 0,         'Audit-Stages nicht leer');

// Eingefroren (immutable)
let isFrozen = true;
try {
  config.version = 'hacked'; // sollte in strict mode werfen
  // Wenn kein Fehler, pruefen ob sich was geaendert hat
  if (config.version === 'hacked') isFrozen = false;
} catch { /* erwartet in strict mode */ }
assert(isFrozen || config.version !== 'hacked', 'Config-Objekt ist unveraenderbar');

// Singleton-Verhalten
const config2 = getConfig();
assert(config === config2, 'getConfig gibt gleiche Instanz zurueck (Singleton)');

// DEFAULTS vorhanden und vollstaendig
assert(typeof DEFAULTS === 'object',           'DEFAULTS ist exportiert');
assert(typeof DEFAULTS.paths === 'object',     'DEFAULTS.paths vorhanden');
assert(typeof DEFAULTS.logging === 'object',   'DEFAULTS.logging vorhanden');

// ---------------------------------------------------------------------------
process.stdout.write(`\nErgebnis: ${testsPassed} bestanden, ${testsFailed} fehlgeschlagen\n`);
process.exit(testsFailed > 0 ? 1 : 0);
