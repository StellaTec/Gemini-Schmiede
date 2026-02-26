/**
 * @file test_integrity.cjs
 * @description Test: Integritaets-Waechter (integrity_check.js)
 *
 * Prueft:
 *   1. PASSED bei unveraenderter Datei
 *   2. PASSED bei kleinen Aenderungen innerhalb Schwellenwert
 *   3. FAILED bei drastischem Zeilen-Verlust
 *   4. FAILED bei verschwundenen Funktionen (strict symbols)
 *   5. Dynamischer Schwellenwert nach Dateigroesse
 *   6. Fehlende Dateien werden korrekt behandelt
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

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

/** Erstellt eine temporaere Testdatei */
function tmpFile(content, suffix = '.js') {
  const p = path.join(os.tmpdir(), `gschm-test-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

/** Loescht eine temporaere Datei */
function cleanup(p) {
  try { fs.unlinkSync(p); } catch { /* ignorieren */ }
}

// ---------------------------------------------------------------------------
process.stdout.write('Test: integrity_check.js\n');

const { checkIntegritaet, getDynamicThreshold, extractSymbols } = require('../.gemini/utils/integrity_check');

// Test 1: Gleiche Datei = PASSED
const oldFile1 = tmpFile('function foo() { return 1; }\nconst a = 1;\nconst b = 2;\n');
const newFile1 = tmpFile('function foo() { return 1; }\nconst a = 1;\nconst b = 2;\n');
assert(checkIntegritaet(oldFile1, newFile1) === true, 'Gleiche Datei: PASSED');
cleanup(oldFile1); cleanup(newFile1);

// Test 2: Kleine Aenderung = PASSED
const codeBase = Array(50).fill('const x = 1;').join('\n');
const oldFile2 = tmpFile(codeBase);
const newFile2 = tmpFile(codeBase + '\n// neuer Kommentar\nconst y = 2;');
assert(checkIntegritaet(oldFile2, newFile2) === true, 'Kleine Ergaenzung: PASSED');
cleanup(oldFile2); cleanup(newFile2);

// Test 3: Drastischer Zeilen-Verlust = FAILED
const bigCode = Array(100).fill('const line = "important code";').join('\n');
const oldFile3 = tmpFile(bigCode);
const newFile3 = tmpFile(bigCode.split('\n').slice(0, 10).join('\n')); // 90% weg
assert(checkIntegritaet(oldFile3, newFile3) === false, 'Drastischer Verlust (90%): FAILED');
cleanup(oldFile3); cleanup(newFile3);

// Test 4: Verschwundene Funktion = FAILED
const oldFile4 = tmpFile(
  'function alpha() { return 1; }\nfunction beta() { return 2; }\nconst x = 3;\n'
);
const newFile4 = tmpFile(
  'function alpha() { return 1; }\nconst x = 3;\n// beta wurde entfernt\n'
);
assert(checkIntegritaet(oldFile4, newFile4) === false, 'Verschwundene Funktion: FAILED');
cleanup(oldFile4); cleanup(newFile4);

// Test 5: Fehlende Dateien
assert(checkIntegritaet('/nicht/vorhanden.js', '/auch/nicht.js') === false, 'Fehlende Dateien: FAILED');

// Test 6: Dynamischer Schwellenwert
const threshold5   = getDynamicThreshold(5);    // tiny
const threshold50  = getDynamicThreshold(50);   // small
const threshold150 = getDynamicThreshold(150);  // medium
const threshold300 = getDynamicThreshold(300);  // large
assert(threshold5   > threshold50,  'Tiny-Threshold > Small-Threshold');
assert(threshold50  > threshold150, 'Small-Threshold > Medium-Threshold');
assert(threshold150 > threshold300, 'Medium-Threshold > Large-Threshold');
assert(threshold5   === 0.40,       'Tiny-Threshold ist 0.40');
assert(threshold300 === 0.05,       'Large-Threshold ist 0.05');

// Test 7: Symbol-Extraktion
const symbols = extractSymbols(
  'function foo() {}\nconst bar = () => {};\nclass Baz {}\n'
);
assert(symbols.some(s => s.includes('function foo')), 'extractSymbols erkennt function foo');
assert(symbols.some(s => s.includes('class Baz')),    'extractSymbols erkennt class Baz');

// Test 8: Symbol-Erweiterung = PASSED (neue Funktion ist ok)
const oldFile8 = tmpFile('function original() {}\n');
const newFile8 = tmpFile('function original() {}\nfunction newer() {}\n');
assert(checkIntegritaet(oldFile8, newFile8) === true, 'Neue Funktion hinzugefuegt: PASSED');
cleanup(oldFile8); cleanup(newFile8);

// ---------------------------------------------------------------------------
process.stdout.write(`\nErgebnis: ${testsPassed} bestanden, ${testsFailed} fehlgeschlagen\n`);
process.exit(testsFailed > 0 ? 1 : 0);
