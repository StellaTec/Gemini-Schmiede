/**
 * @file test_checkpoint.cjs
 * @description Test: Checkpoint Manager (checkpoint_manager.js)
 *              Schliessst TEST-CHKPT Schritt 2 ab.
 *
 * Prueft:
 *   1. Normaler Schritt wird korrekt abgehakt
 *   2. Bereits erledigter Schritt ist idempotent
 *   3. Nicht-existenter Schritt gibt Warnung (kein Crash)
 *   4. Fehlende Datei gibt Fehler zurueck
 *   5. CLI-Interface funktioniert korrekt
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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

/** Erstellt eine temporaere Test-Plan-Datei */
function createTestPlan(content) {
  const tmpPath = path.join(ROOT, '.gemini', 'tmp-test-plan.md');
  fs.writeFileSync(tmpPath, content, 'utf8');
  return tmpPath;
}

/** Liest und entfernt eine temporaere Datei */
function readAndClean(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  try { fs.unlinkSync(filePath); } catch { /* ignorieren */ }
  return content;
}

// ---------------------------------------------------------------------------
process.stdout.write('Test: checkpoint_manager.js\n');

const { markStepComplete } = require('../.gemini/utils/checkpoint_manager');

// Test 1: Schritt wird korrekt abgehakt
const plan1 = createTestPlan(
  '# Test Plan\n- [x] Schritt 1: Erledigt.\n- [ ] Schritt 2: Offen.\n- [ ] Schritt 3: Offen.\n'
);
const result1 = markStepComplete(plan1, 2);
const content1 = readAndClean(plan1);
assert(result1 === true, 'markStepComplete gibt true zurueck bei Erfolg');
assert(content1.includes('- [x] Schritt 2:'), 'Schritt 2 wurde auf [x] gesetzt');
assert(content1.includes('- [ ] Schritt 3:'), 'Schritt 3 wurde NICHT veraendert');
assert(content1.includes('- [x] Schritt 1:'), 'Schritt 1 blieb [x]');

// Test 2: Bereits erledigter Schritt (Idempotenz)
const plan2 = createTestPlan('# Plan\n- [x] Schritt 1: Bereits fertig.\n');
const result2 = markStepComplete(plan2, 1);
const content2 = readAndClean(plan2);
assert(result2 === true, 'Idempotent: true bei bereits erledigtem Schritt');
assert(content2.includes('- [x] Schritt 1:'), 'Bereits erledigter Schritt bleibt [x]');

// Test 3: Nicht-existenter Schritt (Warnung, kein Crash)
const plan3 = createTestPlan('# Plan\n- [ ] Schritt 1: Vorhanden.\n');
const result3 = markStepComplete(plan3, 99);
readAndClean(plan3);
assert(result3 === false, 'false zurueck wenn Schritt nicht gefunden');

// Test 4: Fehlende Datei
const result4 = markStepComplete('/tmp/nicht-existiert-xyz-12345.md', 1);
assert(result4 === false, 'false zurueck bei fehlender Datei');

// Test 5: Ungueltige Parameter
const result5a = markStepComplete('', 1);
assert(result5a === false, 'false bei leerem Dateipfad');

const result5b = markStepComplete('.gemini/plans/initial_setup.md', 0);
assert(result5b === false, 'false bei Schritt-Nummer 0');

const result5c = markStepComplete('.gemini/plans/initial_setup.md', -1);
assert(result5c === false, 'false bei negativer Schritt-Nummer');

// Test 6: CLI-Interface
const cliResult = spawnSync('node', [
  path.join(ROOT, '.gemini', 'utils', 'checkpoint_manager.js')
], {
  cwd:   ROOT,
  stdio: 'pipe',
});
// Ohne Argumente sollte es mit Code 0 enden und Usage ausgeben
assert(cliResult.status === 0, 'CLI ohne Argumente endet mit Exit 0');
const cliOutput = (cliResult.stdout || Buffer.from('')).toString();
assert(cliOutput.includes('Usage:') || cliOutput.includes('node'), 'CLI gibt Usage-Hinweis aus');

// Test 7: Vollstaendiger Workflow (Integration)
const integrationPlan = createTestPlan(
  '# Integration Test\n- [ ] Schritt 1: A.\n- [ ] Schritt 2: B.\n- [ ] Schritt 3: C.\n'
);
markStepComplete(integrationPlan, 1);
markStepComplete(integrationPlan, 3);
const integContent = readAndClean(integrationPlan);
assert(integContent.includes('- [x] Schritt 1:'), 'Integration: Schritt 1 erledigt');
assert(integContent.includes('- [ ] Schritt 2:'), 'Integration: Schritt 2 unveraendert');
assert(integContent.includes('- [x] Schritt 3:'), 'Integration: Schritt 3 erledigt');

// ---------------------------------------------------------------------------
process.stdout.write(`\nErgebnis: ${testsPassed} bestanden, ${testsFailed} fehlgeschlagen\n`);
process.exit(testsFailed > 0 ? 1 : 0);
