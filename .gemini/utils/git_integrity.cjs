/**
 * @file git_integrity.cjs
 * @description Git-basiertes Snapshot-System zur Revisionssicherung vor Code-Änderungen.
 * @author WORKER-V1
 */

const { execSync } = require('child_process');
const logger = require('./logger.cjs').withContext('GIT-INTEGRITY');

/**
 * GitIntegrity Klasse zur Verwaltung von Git-Snapshots.
 */
class GitIntegrity {
  constructor() {
    this.isGitAvailable = this._checkGit();
    this.lastSnapshotTag = null;
  }

  /**
   * Prüft ob Git verfügbar ist und ob wir uns in einem Repository befinden.
   * @private
   * @returns {boolean}
   */
  _checkGit() {
    try {
      execSync('git --version', { stdio: 'ignore' });
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
      return true;
    } catch (err) {
      logger.warn('Git ist nicht verfügbar oder dies ist kein Git-Repository. GIS deaktiviert.');
      return false;
    }
  }

  /**
   * Erstellt einen Snapshot des aktuellen Arbeitsverzeichnisses.
   * Führt 'git add .' und 'git stash push' aus.
   * @returns {boolean} true wenn erfolgreich, false sonst.
   */
  createSnapshot() {
    if (!this.isGitAvailable) {
      logger.error('Snapshot konnte nicht erstellt werden: Git nicht verfügbar.');
      return false;
    }

    try {
      logger.info('Starte Snapshot-Erstellung (git add . && git stash)...');
      
      // Alle Änderungen stagen (auch neue Dateien)
      execSync('git add .', { stdio: 'pipe' });
      
      // Snapshot via Stash erstellen
      const timestamp = new Date().getTime();
      const message = `gemini-integrity-snapshot-${timestamp}`;
      const output = execSync(`git stash push -m "${message}"`, { encoding: 'utf8' });
      
      if (output.includes('No local changes to save')) {
        logger.info('Keine Änderungen vorhanden. Kein Snapshot erforderlich.');
        this.lastSnapshotTag = 'CLEAN';
      } else {
        logger.info(`Snapshot erfolgreich erstellt: ${message}`);
        this.lastSnapshotTag = message;
      }
      return true;
    } catch (err) {
      logger.error(`Fehler bei der Snapshot-Erstellung: ${err.message}`);
      return false;
    }
  }

  /**
   * Stelle den letzten Snapshot wieder her.
   * @returns {boolean}
   */
  restoreSnapshot() {
    if (!this.isGitAvailable) return false;
    if (this.lastSnapshotTag === 'CLEAN') {
      logger.info('Arbeitsverzeichnis war sauber, kein Restore nötig.');
      return true;
    }

    try {
      logger.info('Führe Hard-Rollback durch (reset, clean, stash pop)...');
      
      // 1. Alle getrackten Änderungen verwerfen
      execSync('git reset --hard', { stdio: 'pipe' });
      
      // 2. Alle neuen/untrackten Dateien löschen, die Konflikte verursachen könnten
      // WICHTIG: Wir schließen .gemini/ aus, um keine Pläne oder Utils zu verlieren!
      execSync('git clean -fd -e .gemini/', { stdio: 'pipe' });
      
      // 3. Den Snapshot zurückholen
      execSync('git stash pop', { stdio: 'pipe' });
      
      logger.info('Rollback erfolgreich abgeschlossen.');
      return true;
    } catch (err) {
      logger.error(`Fehler beim Wiederherstellen: ${err.message}`);
      return false;
    }
  }

  /**
   * Löscht den letzten Snapshot, falls er erfolgreich war.
   * @returns {boolean}
   */
  cleanup() {
    if (!this.isGitAvailable) return false;
    if (this.lastSnapshotTag === 'CLEAN') return true;

    try {
      logger.info('Lösche temporären Snapshot (git stash drop)...');
      execSync('git stash drop', { stdio: 'pipe' });
      return true;
    } catch (err) {
      logger.error(`Fehler beim Cleanup: ${err.message}`);
      return false;
    }
  }

  /**
   * Exportiert eine Datei aus dem Snapshot in einen temporären Pfad.
   * Nützlich für den Integritäts-Check.
   * @param {string} filePath - Relativer Pfad zur Datei.
   * @param {string} targetPath - Zielpfad für den Export.
   * @returns {boolean}
   */
  exportFromSnapshot(filePath, targetPath) {
    if (!this.isGitAvailable || !this.lastSnapshotTag || this.lastSnapshotTag === 'CLEAN') {
      return false;
    }

    try {
      // Inhalt aus dem Stash extrahieren
      const content = execSync(`git show stash@{0}:"${filePath}"`, { encoding: 'utf8' });
      const fs = require('fs');
      const path = require('path');
      
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      fs.writeFileSync(targetPath, content);
      return true;
    } catch (err) {
      logger.error(`Konnte Datei ${filePath} nicht aus Snapshot exportieren: ${err.message}`);
      return false;
    }
  }
}

// Exportiere Singleton-Instanz
module.exports = new GitIntegrity();
