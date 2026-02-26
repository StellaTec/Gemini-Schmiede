/**
 * @file test_analytics.cjs
 * @description Test: Analytics-System (analytics.js)
 *
 * Prueft:
 *   1. incrementAgentCount erhoeht Zaehler korrekt
 *   2. incrementStat mit beliebigem Key
 *   3. getStats gibt korrektes Objekt zurueck
 *   4. Neue Keys werden automatisch erstellt
 *   5. Atomares Schreiben (tmp-File-Pattern)
 *   6. Fehlerbehandlung bei ungueltigem Key
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
process.stdout.write('Test: analytics.js\n');

const analytics = require('../.gemini/utils/analytics');
const STATS_FILE = path.join(ROOT, '.gemini', 'logs', 'stats.json');

// Test 1: getStats gibt Objekt zurueck
const stats1 = analytics.getStats();
assert(typeof stats1 === 'object' && stats1 !== null, 'getStats gibt Objekt zurueck');
assert(typeof stats1.ai_agent_calls === 'number', 'ai_agent_calls ist eine Zahl');

// Test 2: incrementAgentCount erhoeht Zaehler
const countBefore = analytics.getStats().ai_agent_calls || 0;
analytics.incrementAgentCount();
const countAfter = analytics.getStats().ai_agent_calls;
assert(countAfter === countBefore + 1, 'incrementAgentCount erhoeht ai_agent_calls um 1');

// Test 3: incrementStat mit eigenem Key
const testKey = 'test_stat_' + Date.now();
analytics.incrementStat(testKey);
const statsAfterNew = analytics.getStats();
assert(statsAfterNew[testKey] === 1, 'Neuer Key wird erstellt und auf 1 gesetzt');

// Test 4: incrementStat mehrfach aufrufen
analytics.incrementStat(testKey);
analytics.incrementStat(testKey);
const statsAfterMulti = analytics.getStats();
assert(statsAfterMulti[testKey] === 3, 'Mehrfaches increment zaehlt korrekt (1+2=3)');

// Test 5: Stats-Datei existiert nach Operationen
assert(fs.existsSync(STATS_FILE), 'Stats-Datei existiert');

// Test 6: Stats-Datei ist gueltiges JSON
let validJson = true;
try {
  JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
} catch { validJson = false; }
assert(validJson, 'Stats-Datei enthaelt gueltiges JSON');

// Test 7: Kein tmp-File zurueckgelassen
const tmpFile = STATS_FILE + '.tmp';
assert(!fs.existsSync(tmpFile), 'Kein .tmp Rueekstand nach Schreiboperation');

// Test 8: Ungueltige Parameter (kein Crash)
let noException = true;
try {
  analytics.incrementStat('');    // Leerer Key
  analytics.incrementStat(null); // Null-Key
} catch { noException = false; }
assert(noException, 'Ungueltige Keys verursachen keinen Crash');

// Aufraumen: Test-Key loeschen
try {
  const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  delete data[testKey];
  fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), 'utf8');
} catch { /* ignorieren */ }

// ---------------------------------------------------------------------------
process.stdout.write(`\nErgebnis: ${testsPassed} bestanden, ${testsFailed} fehlgeschlagen\n`);
process.exit(testsFailed > 0 ? 1 : 0);
