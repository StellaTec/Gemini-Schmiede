/**
 * @file test_branch_flow.cjs
 * @description Testet den Branch-Manager Workflow in einer isolierten Umgebung.
 * @author WORKER-V1
 */

const branchManager = require('../.gemini/utils/branch_manager.cjs');
const { execSync } = require('child_process');
const logger = require('../.gemini/utils/logger.cjs').withContext('TEST-BRANCH');

/**
 * Simulierter Test-Lauf.
 */
function runTest() {
  const taskId = 'TEST-' + Math.floor(Math.random() * 1000);
  const branchName = `feat/${taskId}`;

  logger.info(`Starte Test für Task: ${taskId}...`);

  try {
    // 1. Feature Branch erstellen
    const created = branchManager.createFeatureBranch(taskId);
    if (!created) throw new Error('Branch konnte nicht erstellt werden.');
    
    // Prüfen ob wir auf dem richtigen Branch sind
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== branchName) throw new Error(`Falscher Branch: Erwartet ${branchName}, ist ${currentBranch}`);
    
    logger.info(`1. Schritt (Erstellung): ERFOLGREICH (Aktuell: ${currentBranch})`);

    // 1b. Dummy-Änderung für den Merge
    const fs = require('fs');
    const dummyPath = `tests/dummy_${taskId}.txt`;
    fs.writeFileSync(dummyPath, `Feature ${taskId} implementation.`);
    execSync(`git add ${dummyPath}`, { stdio: 'pipe' });
    execSync(`git commit -m "feat: dummy change for ${taskId}"`, { stdio: 'pipe' });
    logger.info(`1b. Schritt (Commit): ERFOLGREICH`);

    // 2. Mergen in Main (da wir nichts geändert haben, sollte es klappen oder 'Already up to date' sein)
    const merged = branchManager.mergeToMain(taskId);
    if (!merged) throw new Error('Merge in Main fehlgeschlagen.');
    
    const mainBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    logger.info(`2. Schritt (Merge): ERFOLGREICH (Aktuell: ${mainBranch})`);

    // 3. Branch löschen
    const deleted = branchManager.deleteBranch(taskId);
    if (!deleted) throw new Error('Löschen des Branches fehlgeschlagen.');
    
    // Prüfen ob Branch wirklich weg ist
    const exists = execSync(`git branch --list ${branchName}`, { encoding: 'utf8' }).trim();
    if (exists) throw new Error(`Branch ${branchName} existiert noch immer!`);
    
    logger.info(`3. Schritt (Löschen): ERFOLGREICH`);

    logger.info(`Gesamter Test für ${taskId} PASSED.`);
  } catch (err) {
    logger.error(`Test fehlgeschlagen: ${err.message}`);
    // Cleanup versuchen (zurück zum ursprünglichen Hauptzweig)
    try {
      const branches = execSync('git branch --list', { encoding: 'utf8' });
      const main = branches.includes('main') ? 'main' : 'master';
      execSync(`git checkout ${main}`, { stdio: 'pipe' });
    } catch (e) {}
    process.exit(1);
  }
}

runTest();
