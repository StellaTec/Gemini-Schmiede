/**
 * @file run_tests.cjs
 * @description Test-Runner fuer die Gemini-Schmiede Test-Suite.
 *              Fuehrt alle Test-Dateien sequenziell aus und gibt Gesamtergebnis.
 *              Jede Test-Datei wird als separater Node.js Prozess ausgefuehrt (Isolation).
 *
 * @usage
 *   node tests/run_tests.cjs
 *   node tests/run_tests.cjs --verbose
 *
 * Exit-Codes:
 *   0 = Alle Tests bestanden
 *   1 = Mindestens ein Test fehlgeschlagen
 */
'use strict';

const { spawnSync } = require('child_process');
const path          = require('path');
const fs            = require('fs');

const VERBOSE = process.argv.includes('--verbose');
const ROOT    = path.join(__dirname, '..');

/** Test-Dateien in Ausfuehrungs-Reihenfolge */
const TEST_FILES = [
  'tests/test_logger.cjs',
  'tests/test_config.cjs',
  'tests/test_checkpoint.cjs',
  'tests/test_integrity.cjs',
  'tests/test_analytics.cjs',
  'tests/test_session_state.cjs',
  'tests/test_git_manager.cjs',
];

// ---------------------------------------------------------------------------
// Test-Runner
// ---------------------------------------------------------------------------

process.stdout.write('\n====================================\n');
process.stdout.write('  GEMINI-SCHMIEDE TEST SUITE\n');
process.stdout.write('====================================\n\n');

let passed = 0;
let failed = 0;
const startTime = Date.now();

TEST_FILES.forEach(testFile => {
  const absPath = path.join(ROOT, testFile);

  if (!fs.existsSync(absPath)) {
    process.stdout.write(`  [SKIP] ${testFile} - Datei nicht gefunden\n`);
    return;
  }

  const result = spawnSync('node', [absPath], {
    cwd:     ROOT,
    stdio:   VERBOSE ? 'inherit' : 'pipe',
    shell:   false,
    timeout: 15000,
  });

  if (result.error) {
    process.stdout.write(`  [FAIL] ${testFile}\n`);
    process.stdout.write(`         Spawn-Fehler: ${result.error.message}\n`);
    failed++;
    return;
  }

  if (result.status === 0) {
    process.stdout.write(`  [PASS] ${testFile}\n`);
    passed++;
  } else {
    process.stdout.write(`  [FAIL] ${testFile} (Exit: ${result.status})\n`);
    if (!VERBOSE && result.stderr) {
      const errOut = result.stderr.toString().trim();
      if (errOut) {
        errOut.split('\n').slice(0, 5).forEach(line => {
          process.stdout.write(`         ${line}\n`);
        });
      }
    }
    failed++;
  }
});

// Zusammenfassung
const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
process.stdout.write('\n------------------------------------\n');
process.stdout.write(`  Bestanden: ${passed} | Fehlgeschlagen: ${failed}\n`);
process.stdout.write(`  Gesamt:    ${passed + failed} | Zeit: ${elapsed}s\n`);
process.stdout.write('====================================\n\n');

process.exit(failed > 0 ? 1 : 0);
