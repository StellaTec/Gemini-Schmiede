/**
 * @file checkpoint_manager.js
 * @description Automatisches Fortschritts-Tracking in Markdown-Plan-Dateien.
 *              Markiert Checkbox-Schritte als abgeschlossen: "- [ ] Schritt N:" -> "- [x] Schritt N:"
 *              Unterstuetzt CLI-Nutzung und programmatischen Import.
 *
 * @usage CLI:
 *   node .gemini/utils/checkpoint_manager.js <file_path> <step_number>
 *
 * @usage Modul:
 *   const { markStepComplete } = require('.gemini/utils/checkpoint_manager');
 *   markStepComplete('.gemini/plans/my_plan.md', 3);
 *
 * @module utils/checkpoint_manager
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const logger = require('./logger').withContext('CHECKPOINT');

// ---------------------------------------------------------------------------
// Kern-Logik
// ---------------------------------------------------------------------------

/**
 * Markiert einen Plan-Schritt als abgeschlossen.
 * Aendert "- [ ] Schritt N:" zu "- [x] Schritt N:" in der angegebenen Datei.
 * Idempotent: gibt nur Info aus wenn Schritt bereits markiert ist.
 *
 * @param {string} filePath   - Dateipfad (relativ zu CWD oder absolut)
 * @param {number} stepNumber - Schritt-Nummer (z.B. 1, 2, 3)
 * @returns {boolean} true bei Erfolg, false bei Fehler
 */
function markStepComplete(filePath, stepNumber) {
  if (!filePath || typeof filePath !== 'string') {
    logger.error('markStepComplete: filePath muss ein nicht-leerer String sein.');
    return false;
  }
  if (!Number.isInteger(stepNumber) || stepNumber < 1) {
    logger.error(`markStepComplete: stepNumber muss eine positive Ganzzahl sein (erhalten: ${stepNumber}).`);
    return false;
  }

  const absolutePath    = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  const pendingMarker   = `- [ ] Schritt ${stepNumber}:`;
  const completedMarker = `- [x] Schritt ${stepNumber}:`;

  if (!fs.existsSync(absolutePath)) {
    logger.error(`Datei nicht gefunden: ${filePath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(absolutePath, 'utf8');

    if (content.includes(completedMarker)) {
      logger.info(`Schritt ${stepNumber} in '${filePath}' ist bereits abgeschlossen.`);
      return true;
    }

    if (!content.includes(pendingMarker)) {
      logger.warn(
        `Schritt ${stepNumber} nicht gefunden in '${filePath}'. ` +
        `Erwartet: "${pendingMarker}"`
      );
      return false;
    }

    const updated = content.replace(pendingMarker, completedMarker);
    fs.writeFileSync(absolutePath, updated, 'utf8');
    logger.info(`Schritt ${stepNumber} in '${filePath}' erfolgreich abgehakt.`);
    return true;

  } catch (err) {
    logger.error(`Fehler beim Aktualisieren von '${filePath}': ${err.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// CLI-Ausfuehrung
// ---------------------------------------------------------------------------

if (require.main === module) {
  const [,, fileCli, stepCli] = process.argv;

  if (!fileCli || !stepCli) {
    process.stdout.write(
      'Usage: node checkpoint_manager.js <file_path> <step_number>\n' +
      'Beispiel: node checkpoint_manager.js .gemini/plans/my_plan.md 2\n'
    );
    process.exit(0);
  }

  const stepNum = parseInt(stepCli, 10);
  if (isNaN(stepNum) || stepNum < 1) {
    logger.error(`Ungueltige Schritt-Nummer: "${stepCli}". Muss eine positive Ganzzahl sein.`);
    process.exit(1);
  }

  const success = markStepComplete(fileCli, stepNum);
  process.exit(success ? 0 : 1);
}

module.exports = { markStepComplete };
