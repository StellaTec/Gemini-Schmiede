/**
 * @file checkpoint_manager.cjs
 * @description Modul zum Markieren von Schritten in Implementierungsplänen als abgeschlossen.
 * @author WORKER-V1
 */

const fs = require('fs');
const logger = require('./logger.cjs').withContext('CHECKPOINT');
const { resolveAbsolutePath } = require('./core/fs_utils.cjs');

/**
 * Markiert einen spezifischen Schritt in einer Plan-Datei als abgeschlossen.
 * @param {string} filePath - Pfad zur Plan-Datei (.md).
 * @param {number|string} stepNumber - Die Nummer des Schritts.
 */
function markStepComplete(filePath, stepNumber) {
  const absolutePath = resolveAbsolutePath(filePath);

  if (!fs.existsSync(absolutePath)) {
    logger.error(`Datei nicht gefunden: ${filePath}`);
    process.exit(1);
  }

  try {
    let content = fs.readFileSync(absolutePath, 'utf8');

    // Wir suchen nach "- [ ] Schritt N:"
    const stepSearchString = `- [ ] Schritt ${stepNumber}:`;

    if (!content.includes(stepSearchString)) {
      const completedString = `- [x] Schritt ${stepNumber}:`;
      if (content.includes(completedString)) {
        logger.info(`Schritt ${stepNumber} in ${filePath} ist bereits als abgeschlossen markiert.`);
        return;
      }
      logger.warn(`Schritt ${stepNumber} konnte in ${filePath} nicht gefunden werden (Erwartet: "${stepSearchString}").`);
      return;
    }

    const newContent = content.replace(stepSearchString, `- [x] Schritt ${stepNumber}:`);
    fs.writeFileSync(absolutePath, newContent, 'utf8');

    logger.info(`Schritt ${stepNumber} in ${filePath} erfolgreich auf [x] gesetzt.`);
  } catch (err) {
    logger.error(`Fehler beim Aktualisieren von ${filePath}: ${err.message}`);
    process.exit(1);
  }
}

// CLI-Einstiegspunkt
if (require.main === module) {
  const [,, file, step] = process.argv;
  if (file && step) {
    markStepComplete(file, step);
  } else {
    logger.info('Usage: node checkpoint_manager.cjs <file_path> <step_number>');
  }
}

module.exports = { markStepComplete };
