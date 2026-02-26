/**
 * @file test_git_integrity_flow.cjs
 * @description Testet den Workflow des GitIntegrity-Systems und des IntegrityGuardians.
 */

const fs = require('fs');
const path = require('path');
const guardian = require('../.gemini/utils/integrity_guardian.cjs');

const testFile = 'tests/integrity_test_file.txt';

async function runTest() {
  console.log('--- Starte Git-Integrity Test ---');

  // 1. Vorbereitung: Erstelle eine Testdatei
  fs.writeFileSync(testFile, `Zeile 1
Zeile 2
Zeile 3
Zeile 4
Zeile 5
Zeile 6
Zeile 7
Zeile 8
Zeile 9
Zeile 10
`);
  console.log('Testdatei erstellt.');

  // 2. Snapshot erstellen
  if (!guardian.prepare()) {
    console.error('FAILED: Snapshot konnte nicht erstellt werden.');
    process.exit(1);
  }
  console.log('Snapshot erstellt.');

  // Simulation der Arbeit (mit Code-Verlust)
  fs.writeFileSync(testFile, `Zeile 1
Zeile 2
`); // Drastischer Codeverlust (8 Zeilen weg)
  console.log('Datei wurde "beschädigt" (Code-Verlust).');

  // 3. Validierung
  console.log('Führe Validierung durch...');
  const isOk = guardian.validate(testFile);
  
  if (!isOk) {
    console.log('Validierung schlug wie erwartet fehl (Integritätsfehler erkannt).');
    // 4. Rollback
    console.log('Führe Rollback aus...');
    guardian.rollback();
    
    if (fs.existsSync(testFile)) {
      const content = fs.readFileSync(testFile, 'utf8');
      if (content.includes('Zeile 10')) {
        console.log('SUCCESS: Rollback erfolgreich, Datei wiederhergestellt.');
      } else {
        console.error('FAILED: Rollback hat Datei nicht korrekt wiederhergestellt.');
        console.log('Inhalt:', content);
      }
    } else {
      console.error('FAILED: Datei nach Rollback nicht vorhanden.');
    }
  } else {
    console.error('FAILED: Validierung hätte fehlschlagen müssen!');
    guardian.commit();
  }

  // Cleanup Testdatei
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  console.log('--- Test beendet ---');
}

runTest().catch(console.error);
