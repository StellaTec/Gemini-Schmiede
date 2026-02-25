/**
 * @file integrity_check.cjs
 * @description Prüft die Integrität von Dateien durch Vergleich von Zeilenanzahl und Symbolen.
 * @author WORKER-V1
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger.cjs').withContext('INTEGRITY');

// --- Konfiguration ---
const CONFIG = {
  // Erlaubter prozentualer Zeilenverlust (0.15 = 15%)
  DEFAULT_THRESHOLD: parseFloat(process.env.INTEGRITY_THRESHOLD) || 0.15,
  // Mindestanzahl an Zeilen, die fehlen müssen, bevor der Check überhaupt anschlägt
  MIN_ABS_LOSS: parseInt(process.env.INTEGRITY_MIN_LOSS) || 3,
  // Symbol-Check (Funktionen/Klassen) aktiv?
  STRICT_SYMBOL_CHECK: process.env.INTEGRITY_STRICT_SYMBOLS !== 'false'
};

/**
 * Berechnet den dynamischen Schwellenwert basierend auf der Dateigröße.
 * @param {number} lineCount - Anzahl der Zeilen in der Originaldatei.
 * @returns {number} Der berechnete Schwellenwert.
 */
function getDynamicThreshold(lineCount) {
  if (lineCount < 20) return 0.40;  // Bei Minidateien sehr tolerant
  if (lineCount > 200) return 0.05; // Bei Riesendateien extrem streng (5%)
  if (lineCount > 100) return 0.10; // Bei mittleren Dateien (10%)
  return CONFIG.DEFAULT_THRESHOLD;  // Standard (15%)
}

/**
 * Vergleicht zwei Versionen einer Datei auf Integrität.
 * @param {string} oldPath - Pfad zur Backup-Datei (vor der Änderung).
 * @param {string} newPath - Pfad zur geänderten Datei.
 * @returns {boolean} true wenn okay, false wenn Integrität gefährdet.
 */
function checkIntegrität(oldPath, newPath) {
  try {
    if (!fs.existsSync(oldPath) || !fs.existsSync(newPath)) {
      logger.error('Eine der Dateien zum Vergleich fehlt.');
      return false;
    }

    const oldContentRaw = fs.readFileSync(oldPath, 'utf8');
    const newContentRaw = fs.readFileSync(newPath, 'utf8');

    const oldContent = oldContentRaw.split('\n');
    const newContent = newContentRaw.split('\n');

    const oldLineCount = oldContent.length;
    const newLineCount = newContent.length;

    const threshold = getDynamicThreshold(oldLineCount);
    const lineDiff = oldLineCount - newLineCount;

    logger.info(`Prüfe ${path.basename(newPath)}: ${oldLineCount} -> ${newLineCount} Zeilen (Diff: ${lineDiff}, Limit: ${(threshold * 100).toFixed(0)}%)`);

    // Regel 1: Zeilenverlust
    if (lineDiff >= CONFIG.MIN_ABS_LOSS && (lineDiff / oldLineCount) > threshold) {
      logger.error(`KRITISCH: Drastischer Code-Verlust erkannt! Limit von ${(threshold * 100).toFixed(0)}% überschritten.`);
      return false;
    }

    // Regel 2: Symbol-Check (Funktions-Header)
    if (CONFIG.STRICT_SYMBOL_CHECK) {
      const functionPattern = /(function\s+\w+|const\s+\w+\s*=\s*(\([^)]*\)|[\w$]+)\s*=>|class\s+\w+)/g;

      const extractFunctions = (content) => {
        return (content.match(functionPattern) || []).map(f => f.replace(/\s+/g, ' ').trim());
      };

      const oldFunctions = extractFunctions(oldContentRaw);
      const newFunctions = extractFunctions(newContentRaw);

      const missingFunctions = oldFunctions.filter(f => !newFunctions.includes(f));
      if (missingFunctions.length > 0) {
        logger.error(`KRITISCH: Folgende Funktionen/Klassen sind verschwunden: ${missingFunctions.join(', ')}`);
        return false;
      }
    }

    logger.info('Integritäts-Check PASSED.');
    return true;
  } catch (err) {
    logger.error(`Fehler beim Integritäts-Check: ${err.message}`);
    return false;
  }
}

// CLI-Einstiegspunkt
if (require.main === module) {
  const [,, oldF, newF] = process.argv;
  if (oldF && newF) {
    const success = checkIntegrität(oldF, newF);
    process.exit(success ? 0 : 1);
  } else {
    logger.error('Usage: node integrity_check.cjs <old_file> <new_file>');
    process.exit(1);
  }
}

module.exports = { checkIntegrität };
