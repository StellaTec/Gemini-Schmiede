/**
 * @file branch_manager.cjs
 * @description Utility zur Verwaltung von Git-Branches für Feature-basierte Entwicklung.
 * @author WORKER-V1
 */

const { execSync } = require('child_process');
const logger = require('./logger.cjs').withContext('BRANCH-MANAGER');

/**
 * BranchManager Klasse zur Steuerung des Branch-Workflows.
 */
class BranchManager {
  constructor() {
    this.isGitAvailable = this._checkGit();
  }

  /**
   * Prüft ob Git verfügbar ist.
   * @private
   * @returns {boolean}
   */
  _checkGit() {
    try {
      execSync('git --version', { stdio: 'ignore' });
      return true;
    } catch (err) {
      logger.error('Git ist nicht verfügbar. BranchManager deaktiviert.');
      return false;
    }
  }

  /**
   * Ermittelt dynamisch den Namen des Hauptzweigs (main oder master).
   * @private
   * @returns {string} 'main' oder 'master'. Standardmäßig 'main'.
   */
  _getMainBranch() {
    try {
      const branches = execSync('git branch --list', { encoding: 'utf8' });
      if (branches.includes('main')) return 'main';
      if (branches.includes('master')) return 'master';
      
      // Fallback: Versuche remote zu prüfen, falls lokal nichts gefunden wurde (unwahrscheinlich in aktivem Repo)
      const remoteMain = execSync('git remote show origin', { encoding: 'utf8', stdio: 'pipe' })
        .split('\n')
        .find(line => line.includes('HEAD branch'))
        ?.split(':')?.[1]
        ?.trim();

      return remoteMain || 'main';
    } catch (err) {
      logger.warn(`Konnte Hauptzweig nicht sicher bestimmen, verwende Standard 'main': ${err.message}`);
      return 'main';
    }
  }

  /**
   * Erstellt einen neuen Feature-Branch für eine spezifische Task-ID.
   * @param {string} taskId - Die ID des Tasks (z.B. 'PROD-123').
   * @returns {boolean} true wenn erfolgreich.
   */
  createFeatureBranch(taskId) {
    if (!this.isGitAvailable) return false;
    const branchName = `feat/${taskId}`;

    try {
      logger.info(`Erstelle Feature-Branch: ${branchName}...`);
      
      // Prüfen ob Branch bereits existiert
      const existing = execSync(`git branch --list ${branchName}`, { encoding: 'utf8' }).trim();
      if (existing) {
        logger.info(`Branch ${branchName} existiert bereits. Wechsle zu diesem Branch.`);
        execSync(`git checkout ${branchName}`, { stdio: 'pipe' });
      } else {
        execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' });
        logger.info(`Branch ${branchName} erfolgreich erstellt und gewechselt.`);
      }
      return true;
    } catch (err) {
      logger.error(`Fehler beim Erstellen des Branches ${branchName}: ${err.message}`);
      return false;
    }
  }

  /**
   * Merged den Feature-Branch zurück in den Hauptzweig.
   * @param {string} taskId - Die ID des Tasks.
   * @returns {boolean} true wenn erfolgreich.
   */
  mergeToMain(taskId) {
    if (!this.isGitAvailable) return false;
    const branchName = `feat/${taskId}`;
    const mainBranch = this._getMainBranch();

    try {
      logger.info(`Starte Merge von ${branchName} in ${mainBranch}...`);
      
      // 1. Zum Hauptzweig wechseln
      execSync(`git checkout ${mainBranch}`, { stdio: 'pipe' });
      
      // 2. Mergen (no-ff für saubere Historie)
      execSync(`git merge --no-ff ${branchName} -m "Merge feature ${taskId}"`, { stdio: 'pipe' });
      
      logger.info(`Merge von ${branchName} erfolgreich abgeschlossen.`);
      return true;
    } catch (err) {
      logger.error(`Fehler beim Mergen von ${branchName}: ${err.message}`);
      // Bei Fehlern (z.B. Konflikten) zurück zum Feature-Branch, um den Zustand zu sichern
      try { execSync(`git checkout feat/${taskId}`, { stdio: 'pipe' }); } catch (e) {}
      return false;
    }
  }

  /**
   * Löscht den Feature-Branch lokal.
   * @param {string} taskId - Die ID des Tasks.
   * @returns {boolean} true wenn erfolgreich.
   */
  deleteBranch(taskId) {
    if (!this.isGitAvailable) return false;
    const branchName = `feat/${taskId}`;
    const mainBranch = this._getMainBranch();

    try {
      logger.info(`Lösche Feature-Branch: ${branchName}...`);
      
      // Sicherstellen, dass wir nicht auf dem zu löschenden Branch sind
      execSync(`git checkout ${mainBranch}`, { stdio: 'pipe' });
      
      // Löschen (erfordert oft -D wenn nicht gemerged wurde, wir nutzen hier -d für Sicherheit)
      execSync(`git branch -d ${branchName}`, { stdio: 'pipe' });
      
      logger.info(`Branch ${branchName} erfolgreich gelöscht.`);
      return true;
    } catch (err) {
      logger.warn(`Fehler beim Löschen des Branches ${branchName} (eventuell nicht voll gemerged): ${err.message}`);
      // Optionaler Force-Delete bei Bedarf hier möglich
      return false;
    }
  }
}

// Exportiere Singleton-Instanz
module.exports = new BranchManager();
