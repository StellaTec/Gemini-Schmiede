/**
 * @file test_session_state.cjs
 * @description Test: Session-State-Manager (session_state.js)
 *
 * Prueft:
 *   1. setState/getState Roundtrip
 *   2. Atomares Schreiben (State-Datei existiert nach setState)
 *   3. getFullState gibt alle Keys zurueck
 *   4. clearState setzt State auf leeres Objekt zurueck
 *   5. Kein .tmp-Rueekstand nach Schreiboperation
 */
'use strict';

const fs   = require('fs');
const path = require('path');

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
process.stdout.write('Test: session_state.js\n');

const session    = require('../.gemini/utils/session_state');
const STATE_FILE = path.join(ROOT, '.gemini', 'logs', 'session_state.json');

// Sauberer Start: State leeren und Cache zuruecksetzen
session.clearState();
session._resetCache();

// Test 1: setState/getState Roundtrip
session.setState('current_plan', '.gemini/plans/test_plan.md');
session.setState('current_step', 42);
assert(session.getState('current_plan') === '.gemini/plans/test_plan.md', 'setState/getState: String-Wert korrekt');
assert(session.getState('current_step') === 42,                            'setState/getState: Numerischer Wert korrekt');

// Test 2: Atomares Schreiben - State-Datei muss existieren
assert(fs.existsSync(STATE_FILE), 'State-Datei wurde atomar geschrieben');

// Test 3: getFullState gibt alle gesetzten Keys zurueck
const full = session.getFullState();
assert(typeof full === 'object' && full !== null,                    'getFullState gibt Objekt zurueck');
assert(full.current_plan === '.gemini/plans/test_plan.md',           'getFullState enthaelt current_plan');
assert(full.current_step === 42,                                     'getFullState enthaelt current_step');
assert(typeof full.timestamp === 'string' && full.timestamp.length > 0, 'getFullState enthaelt timestamp');

// Test 4: clearState setzt State auf leeres Objekt zurueck
session.clearState();
session._resetCache();
const afterClear = session.getFullState();
assert(Object.keys(afterClear).length === 0, 'clearState leert den State vollstaendig');

// Test 5: Kein .tmp-Rueekstand nach Schreiboperation
const tmpFile = STATE_FILE + '.tmp';
session.setState('test_key', 'test_value');
assert(!fs.existsSync(tmpFile), 'Kein .tmp-Rueckstand nach atomarem Schreiben');

// Aufraumen: State loeschen
session.clearState();

// ---------------------------------------------------------------------------
process.stdout.write(`\nErgebnis: ${testsPassed} bestanden, ${testsFailed} fehlgeschlagen\n`);
process.exit(testsFailed > 0 ? 1 : 0);
