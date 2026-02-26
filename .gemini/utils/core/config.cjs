/**
 * @file config.cjs
 * @description Singleton-Config-Loader fuer gemini.config.json.
 *              Mergt Benutzer-Config mit internen Defaults (Deep-Merge).
 *              Gibt ein eingefrorenes, unveraenderbares Config-Objekt zurueck.
 *              Faellt lautlos auf Defaults zurueck wenn Config-Datei fehlt oder ungueltiges JSON enthaelt.
 * @module core/config
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { getProjectRoot } = require('./path-resolver.cjs');

/** @type {Readonly<Object>|null} Gecachte Config-Instanz */
let _config = null;

/**
 * Standard-Konfiguration.
 * Alle Werte koennen durch gemini.config.json ueberschrieben werden.
 * @type {Object}
 */
const DEFAULTS = Object.freeze({
  version: '2.0.0',
  project: {
    name:        'gemini-project',
    description: '',
    language:    'de',
  },
  paths: {
    utils:   '.gemini/utils',
    logs:    '.gemini/logs',
    plans:   '.gemini/plans',
    docs:    '.gemini/docs',
    skills:  '.gemini/skills',
    backups: '.gemini/backups',
    tests:   'tests',
  },
  logging: {
    level:            'INFO',
    file:             '.gemini/logs/system.log',
    maxFileSizeBytes: 10485760,
    console:          true,
  },
  integrity: {
    defaultThreshold: 0.15,
    minAbsoluteLoss:  3,
    strictSymbols:    true,
    thresholds: {
      tiny:   { maxLines: 20,   tolerance: 0.40 },
      small:  { maxLines: 100,  tolerance: 0.15 },
      medium: { maxLines: 200,  tolerance: 0.10 },
      large:  { maxLines: null, tolerance: 0.05 },
    },
  },
  analytics: {
    statsFile: '.gemini/logs/stats.json',
  },
  audit: {
    command:         'gemini',
    flags:           ['-y', '-p'],
    timeout:         30000,
    stages:          ['local', 'integrity', 'ai'],
    localScript:     '.gemini/utils/validate_local.js',
    integrityScript: '.gemini/utils/integrity_check.js',
  },
  validation: {
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
    warnOnConsoleLogs:   true,
    maxFileLinesWarning: 500,
  },
  agents: {
    boss:     { context: 'BOSS' },
    planner:  { context: 'PLANNER' },
    reviewer: { context: 'REVIEWER' },
    worker:   { context: 'WORKER' },
    auditor:  { context: 'HYBRID-RUNNER' },
  },
});

/**
 * Fuehrt einen rekursiven Deep-Merge durch.
 * Arrays werden NICHT zusammengefuehrt sondern direkt ersetzt (source gewinnt).
 * @param {Object} target - Basis-Objekt (wird nicht veraendert)
 * @param {Object} source - Ueberschreibende Werte
 * @returns {Object} Neu erstelltes gemergtes Objekt
 * @private
 */
function _deepMerge(target, source) {
  const result = Object.assign({}, target);
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    const bothObjects = (
      sv !== null && typeof sv === 'object' && !Array.isArray(sv) &&
      tv !== null && typeof tv === 'object' && !Array.isArray(tv)
    );
    result[key] = bothObjects ? _deepMerge(tv, sv) : sv;
  }
  return result;
}

/**
 * Laedt und gibt die Projekt-Konfiguration zurueck.
 * Ergebnis wird gecacht - mehrfache Aufrufe geben dieselbe Instanz zurueck.
 * @returns {Readonly<Object>} Eingefrorenes Config-Objekt
 */
function getConfig() {
  if (_config) return _config;

  const configPath = path.join(getProjectRoot(), 'gemini.config.json');
  let merged = _deepMerge({}, DEFAULTS);

  try {
    if (fs.existsSync(configPath)) {
      const raw    = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      merged = _deepMerge(DEFAULTS, parsed);
    }
  } catch {
    // Lautlos auf Defaults zurueckfallen - Logger nicht verfuegbar hier
  }

  _config = Object.freeze(merged);
  return _config;
}

/**
 * Resettet den Config-Cache.
 * Primaer fuer Unit-Tests gedacht.
 */
function resetConfig() {
  _config = null;
}

module.exports = { getConfig, resetConfig, DEFAULTS };
