/**
 * @file session_state.js
 * @description Singleton fuer Session-Crash-Recovery. Persistiert den aktuellen
 *              Arbeitsstand (Plan, Schritt, Branch, letzter Agent) in einer JSON-Datei,
 *              damit nach einem Absturz oder Neustart exakt dort weitergemacht werden kann.
 *
 * @usage
 *   const session = require('.gemini/utils/session_state');
 *   session.setState('current_plan', '.gemini/plans/my_plan.md');
 *   session.setState('current_step', 3);
 *   const plan = session.getState('current_plan');
 *   const full = session.getFullState();
 *   session.clearState();
 *
 * CLI:
 *   node .gemini/utils/session_state.js status
 *   node .gemini/utils/session_state.js clear
 *
 * State-Schema:
 *   {
 *     current_plan:   ".gemini/plans/example.md",
 *     current_step:   3,
 *     current_branch: "feature/TASK-NAME",
 *     last_agent:     "WORKER",
 *     last_action:    "checkpoint_marked",
 *     timestamp:      "2026-02-26T12:00:00.000Z"
 *   }
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const { getConfig }                      = require('./core/config.cjs');
const { resolve, ensureDir }             = require('./core/path-resolver.cjs');
const { handleError, safeJsonParse }     = require('./core/error-handler.cjs');
const logger                             = require('./logger').withContext('SESSION');

// ---------------------------------------------------------------------------
// Internal state cache
// ---------------------------------------------------------------------------

let _state = null;

function _getStateFile() {
  const cfg = getConfig();
  const stateFile = (cfg.session && cfg.session.stateFile)
    ? cfg.session.stateFile
    : '.gemini/logs/session_state.json';
  return resolve(stateFile);
}

function _loadState() {
  if (_state !== null) return _state;
  const stateFile = _getStateFile();
  if (!fs.existsSync(stateFile)) {
    _state = {};
    return _state;
  }
  try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    _state = safeJsonParse(raw, {});
  } catch (err) {
    handleError(err, 'SESSION._loadState');
    _state = {};
  }
  return _state;
}

function _saveState() {
  const stateFile = _getStateFile();
  ensureDir(path.dirname(stateFile));
  const tmpFile = stateFile + '.tmp';
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(_state, null, 2), 'utf8');
    fs.renameSync(tmpFile, stateFile);
  } catch (err) {
    handleError(err, 'SESSION._saveState');
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Setzt einen State-Schluessel und persistiert sofort (atomar).
 * @param {string} key   - Schluessel (z.B. 'current_plan')
 * @param {*}      value - Wert (string, number, boolean, object)
 */
function setState(key, value) {
  if (typeof key !== 'string' || !key) return;
  const state = _loadState();
  state[key]       = value;
  state.timestamp  = new Date().toISOString();
  _saveState();
  logger.debug(`State: ${key} = ${JSON.stringify(value)}`);
}

/**
 * Liest einen State-Schluessel.
 * @param  {string} key
 * @returns {*} Wert oder undefined
 */
function getState(key) {
  return _loadState()[key];
}

/**
 * Gibt den gesamten State als flache Kopie zurueck.
 * @returns {object}
 */
function getFullState() {
  return Object.assign({}, _loadState());
}

/**
 * Loescht den gesamten State und persistiert den leeren Zustand.
 */
function clearState() {
  _state = {};
  _saveState();
  logger.info('Session state geleert');
}

/**
 * Setzt den Cache zurueck (nur fuer Tests).
 */
function _resetCache() {
  _state = null;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const cmd = process.argv[2] || 'status';

  if (cmd === 'status') {
    const state = getFullState();
    if (Object.keys(state).length === 0) {
      process.stdout.write('Session state: (leer - kein aktiver Zustand)\n');
      process.stdout.write('Tipp: Starte eine neue Session und setze den Plan:\n');
      process.stdout.write('  node .gemini/utils/session_state.js set current_plan .gemini/plans/dein_plan.md\n');
    } else {
      process.stdout.write('=== Session State ===\n');
      Object.entries(state).forEach(([k, v]) => {
        process.stdout.write(`  ${k.padEnd(16)}: ${JSON.stringify(v)}\n`);
      });
    }
  } else if (cmd === 'clear') {
    clearState();
    process.stdout.write('Session state wurde geleert.\n');
  } else if (cmd === 'set') {
    const key = process.argv[3];
    const val = process.argv[4];
    if (!key || val === undefined) {
      process.stderr.write('Usage: session_state.js set <key> <value>\n');
      process.exit(1);
    }
    // Versuche numerischen Wert zu parsen
    const parsed = isNaN(val) ? val : Number(val);
    setState(key, parsed);
    process.stdout.write(`State gesetzt: ${key} = ${JSON.stringify(parsed)}\n`);
  } else {
    process.stdout.write('Usage: node .gemini/utils/session_state.js [status|clear|set <key> <value>]\n');
    process.exit(1);
  }
}

module.exports = { setState, getState, getFullState, clearState, _resetCache };
