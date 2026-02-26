/**
 * @file integrity_guardian.cjs
 * @description Koordiniert Git-Snapshots und Integritätsprüfungen.
 * @author WORKER-V1
 */

const path = require('path');
const fs = require('fs');
const gitIntegrity = require('./git_integrity.cjs');
const { checkIntegrität } = require('./integrity_check.cjs');
const logger = require('./logger.cjs').withContext('GUARDIAN');

/**
 * Der Guardian schützt den Code vor destruktiven Änderungen.
 */
class IntegrityGuardian {
  /**
   * Bereitet eine Änderung vor.
   * @returns {boolean}
   */
  prepare() {
    logger.info('Bereite Schutz-Snapshot vor...');
    return gitIntegrity.createSnapshot();
  }

  /**
   * Prüft die Integrität einer Datei nach einer Änderung.
   * @param {string} relativeFilePath - Pfad zur Datei relativ zum Root.
   * @returns {boolean}
   */
  validate(relativeFilePath) {
    const tempBackupPath = path.join(process.cwd(), '.gemini/tmp/backups', `${path.basename(relativeFilePath)}.bak`);
    
    logger.info(`Validierung von ${relativeFilePath} gestartet...`);

    // 1. Exportiere den stabilen Zustand aus dem Snapshot
    if (!gitIntegrity.exportFromSnapshot(relativeFilePath, tempBackupPath)) {
      logger.warn(`Kein Snapshot-Backup für ${relativeFilePath} verfügbar. Überspringe Integritätsprüfung.`);
      return true; // Falls kein Backup da war, können wir nicht prüfen
    }

    // 2. Führe den Vergleich durch
    const currentPath = path.join(process.cwd(), relativeFilePath);
    const isOk = checkIntegrität(tempBackupPath, currentPath);

    // 3. Cleanup temporäres Backup
    if (fs.existsSync(tempBackupPath)) {
      fs.unlinkSync(tempBackupPath);
    }

    if (!isOk) {
      logger.error(`INTEGRITÄTSFEHLER in ${relativeFilePath} erkannt!`);
    }

    return isOk;
  }

  /**
   * Schließt die Operation erfolgreich ab.
   */
  commit() {
    logger.info('Änderungen akzeptiert. Cleanup gestartet.');
    return gitIntegrity.cleanup();
  }

  /**
   * Rollt Änderungen bei Fehlern zurück.
   */
  rollback() {
    logger.warn('KRITISCHER FEHLER: Rollback auf letzten Snapshot wird ausgeführt!');
    return gitIntegrity.restoreSnapshot();
  }
}

module.exports = new IntegrityGuardian();
