/**
 * @file integrity_check.js
 * @description PROD00 Integritaets-Waechter - Schutz vor unbeabsichtigtem Code-Verlust.
 *              Vergleicht eine alte und neue Version einer Datei.
 *              Schlaegt Alarm bei: drastischem Zeilen-Verlust ODER verschwundenen Funktionen.
 *              Konfiguration: gemini.config.json > ENV-Variablen > Hardcoded Defaults.
 *
 * @usage CLI:
 *   node .gemini/utils/integrity_check.js <old_file> <new_file>
 *
 * Exit-Codes:
 *   0 = PASSED (Integritaet gesichert)
 *   1 = FAILED (Integritaets-Verletzung erkannt)
 *
 * @module utils/integrity_check
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const logger = require('./logger').withContext('INTEGRITY');

// ---------------------------------------------------------------------------
// Konfiguration (Prioritaet: config.json > ENV > Defaults)
// ---------------------------------------------------------------------------

/**
 * Laedt Integritaets-Konfiguration aus gemini.config.json.
 * @returns {{ defaultThreshold: number, minAbsoluteLoss: number, strictSymbols: boolean, thresholds: Object }}
 * @private
 */
function _loadIntegrityConfig() {
  const defaults = {
    defaultThreshold: parseFloat(process.env.INTEGRITY_THRESHOLD) || 0.15,
    minAbsoluteLoss:  parseInt(process.env.INTEGRITY_MIN_LOSS, 10) || 3,
    strictSymbols:    process.env.INTEGRITY_STRICT_SYMBOLS !== 'false',
    thresholds: {
      tiny:   { maxLines: 20,   tolerance: 0.40 },
      small:  { maxLines: 100,  tolerance: 0.15 },
      medium: { maxLines: 200,  tolerance: 0.10 },
      large:  { maxLines: null, tolerance: 0.05 },
    },
  };

  try {
    const configPath = path.join(process.cwd(), 'gemini.config.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.integrity) {
        const ci = cfg.integrity;
        return {
          defaultThreshold: ci.defaultThreshold ?? defaults.defaultThreshold,
          minAbsoluteLoss:  ci.minAbsoluteLoss  ?? defaults.minAbsoluteLoss,
          strictSymbols:    ci.strictSymbols     ?? defaults.strictSymbols,
          thresholds:       ci.thresholds        ?? defaults.thresholds,
        };
      }
    }
  } catch {
    // Fallback auf ENV/Defaults
  }
  return defaults;
}

const CONFIG = _loadIntegrityConfig();

// ---------------------------------------------------------------------------
// Schwellenwert-Logik
// ---------------------------------------------------------------------------

/**
 * Berechnet den dynamischen Schwellenwert basierend auf der Dateizeilenzahl.
 * Kleine Dateien sind volatiler -> hoeheres Toleranzlimit.
 * Grosse Dateien sind stabiler -> niedrigeres Toleranzlimit.
 *
 * @param {number} lineCount - Aktuelle Zeilenzahl der alten Datei
 * @returns {number} Toleranz-Schwellenwert (0.0 - 1.0)
 */
function getDynamicThreshold(lineCount) {
  const t = CONFIG.thresholds;
  if (lineCount < t.tiny.maxLines)   return t.tiny.tolerance;
  if (lineCount < t.small.maxLines)  return t.small.tolerance;
  if (lineCount < t.medium.maxLines) return t.medium.tolerance;
  return t.large.tolerance;
}

// ---------------------------------------------------------------------------
// Symbol-Extraktion
// ---------------------------------------------------------------------------

/**
 * Extrahiert Funktions- und Klassen-Definitionen aus einem Code-String.
 * Erkennt: function name(), const name = () =>, class name, sowie moderne Exports.
 *
 * @param {string} content - Roher Datei-Inhalt
 * @returns {string[]} Liste normalisierter Symbol-Strings
 */
function extractSymbols(content) {
  // Erkennt: function foo, const foo = (), class Foo, async function, etc.
  const pattern = /(?:async\s+)?function\s+[\w$]+|(?:const|let|var)\s+[\w$]+\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>|class\s+[\w$]+/g;
  return (content.match(pattern) || []).map(s => s.replace(/\s+/g, ' ').trim());
}

// ---------------------------------------------------------------------------
// Haupt-Prueffunktion
// ---------------------------------------------------------------------------

/**
 * Vergleicht zwei Dateiversionen auf Code-Integritaet.
 * Prueft: (1) Zeilen-Verlust-Schwellenwert, (2) Verschwundene Symbole.
 *
 * @param {string} oldPath - Pfad zur alten Version (Backup/Referenz)
 * @param {string} newPath - Pfad zur neuen Version (aktuelle Datei)
 * @returns {boolean} true = PASSED, false = FAILED
 */
function checkIntegritaet(oldPath, newPath) {
  // Datei-Existenz pruefen
  if (!fs.existsSync(oldPath)) {
    logger.error(`Alte Datei nicht gefunden: ${oldPath}`);
    return false;
  }
  if (!fs.existsSync(newPath)) {
    logger.error(`Neue Datei nicht gefunden: ${newPath}`);
    return false;
  }

  const oldRaw   = fs.readFileSync(oldPath, 'utf8');
  const newRaw   = fs.readFileSync(newPath, 'utf8');
  const oldLines = oldRaw.split('\n').length;
  const newLines = newRaw.split('\n').length;
  const lineDiff = oldLines - newLines;
  const threshold = getDynamicThreshold(oldLines);

  logger.info(
    `Pruefe ${path.basename(newPath)}: ` +
    `${oldLines} -> ${newLines} Zeilen | ` +
    `Diff: ${lineDiff} | Limit: ${(threshold * 100).toFixed(0)}%`
  );

  // Regel 1: Zeilen-Verlust-Check
  const exceedsThreshold = lineDiff >= CONFIG.minAbsoluteLoss &&
    (lineDiff / oldLines) > threshold;

  if (exceedsThreshold) {
    logger.error(
      `KRITISCH: Code-Verlust erkannt! ` +
      `${lineDiff} Zeilen (${((lineDiff / oldLines) * 100).toFixed(1)}%) entfernt. ` +
      `Limit: ${(threshold * 100).toFixed(0)}%`
    );
    return false;
  }

  // Regel 2: Symbol-Check (Funktionen/Klassen)
  if (CONFIG.strictSymbols) {
    const oldSymbols = extractSymbols(oldRaw);
    const newSymbols = extractSymbols(newRaw);
    const missing    = oldSymbols.filter(s => !newSymbols.includes(s));

    if (missing.length > 0) {
      logger.error(
        `KRITISCH: Folgende Symbole sind verschwunden: ${missing.join(', ')}`
      );
      return false;
    }
  }

  logger.info('Integritaets-Check: PASSED');
  return true;
}

// Alias fuer Rueckwaertskompatibilitaet
const checkIntegrität = checkIntegritaet;

// ---------------------------------------------------------------------------
// CLI-Ausfuehrung
// ---------------------------------------------------------------------------

if (require.main === module) {
  const [,, oldF, newF] = process.argv;

  if (!oldF || !newF) {
    logger.error('Usage: node integrity_check.js <old_file> <new_file>');
    process.exit(1);
  }

  const success = checkIntegritaet(oldF, newF);
  process.exit(success ? 0 : 1);
}

module.exports = { checkIntegritaet, checkIntegrität, getDynamicThreshold, extractSymbols };
