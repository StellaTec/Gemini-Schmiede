#!/usr/bin/env node
/**
 * @file audit_runner.cjs
 * @description Quality-Inspector Hilfsskript fuer lokale Code-Pruefungen.
 *              Fuehrt schnelle strukturelle Checks ohne KI aus.
 *              Ausgabe: kompaktes PASSED/FAILED Format fuer Agenten-Konsum.
 *
 * @usage
 *   node audit_runner.cjs <file1> [file2] [...]
 *   node audit_runner.cjs --json <file1>   (JSON-Ausgabe fuer maschinelle Verarbeitung)
 *
 * Agentic Ergonomics:
 *   - Keine Stack-Traces in der Ausgabe
 *   - Saubere PASSED/FAILED Strings
 *   - Ausgabe auf max. 20 Zeilen begrenzt
 */
'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

const JSON_MODE  = process.argv.includes('--json');
const filesToCheck = process.argv.slice(2).filter(a => !a.startsWith('--'));

/** Logger-Import Muster die als valide gelten */
const VALID_LOGGER_PATTERNS = [
  '.gemini/utils/logger',
  "require('./logger'",
  "require('../utils/logger'",
  "require('../../.gemini/utils/logger'",
];

/** Dateien die vom Logger-Check ausgenommen sind */
const LOGGER_EXEMPT = ['logger.js', 'validate_local.js', 'error-handler.cjs'];

// ---------------------------------------------------------------------------
// Pruef-Funktionen
// ---------------------------------------------------------------------------

/**
 * Prueft ob eine JS/CJS Datei den Logger korrekt importiert.
 * @param {string} fileName - Dateiname (nur Basename)
 * @param {string} content  - Dateiinhalt
 * @returns {{ ok: boolean, reason: string }}
 */
function checkLoggerImport(fileName, content) {
  if (LOGGER_EXEMPT.includes(fileName)) {
    return { ok: true, reason: 'ausgenommen' };
  }
  const hasLogger = VALID_LOGGER_PATTERNS.some(p => content.includes(p));
  return hasLogger
    ? { ok: true,  reason: 'Logger-Import vorhanden' }
    : { ok: false, reason: `Kein Logger-Import. Erwartet: ${VALID_LOGGER_PATTERNS[0]}` };
}

/**
 * Zaehlt direkte console.log Aufrufe.
 * @param {string} content - Dateiinhalt
 * @returns {number} Anzahl console.log Aufrufe
 */
function countConsoleLogs(content) {
  return (content.match(/console\.log\(/g) || []).length;
}

/**
 * Prueft Dateigroesse gegen 500-Zeilen-Regel.
 * @param {string} content - Dateiinhalt
 * @returns {{ ok: boolean, lines: number }}
 */
function checkFileSize(content) {
  const lines = content.split('\n').length;
  return { ok: lines <= 500, lines };
}

/**
 * Prueft eine einzelne Datei auf alle Kriterien.
 * @param {string} filePath - Dateipfad
 * @returns {{ file: string, passed: boolean, issues: string[], info: string[] }}
 */
function auditSingleFile(filePath) {
  const result   = { file: filePath, passed: true, issues: [], info: [] };
  const fileName = path.basename(filePath);
  const absPath  = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  if (!fs.existsSync(absPath)) {
    result.issues.push(`Datei nicht gefunden: ${filePath}`);
    result.passed = false;
    return result;
  }

  const content = fs.readFileSync(absPath, 'utf8');
  const isJsFile = filePath.endsWith('.js') || filePath.endsWith('.cjs');

  // Check 1: Logger-Import
  if (isJsFile) {
    const loggerCheck = checkLoggerImport(fileName, content);
    if (!loggerCheck.ok) {
      result.issues.push(`[FEHLER] Logger: ${loggerCheck.reason}`);
      result.passed = false;
    } else {
      result.info.push(`[OK] Logger: ${loggerCheck.reason}`);
    }
  }

  // Check 2: console.log Direktaufrufe (Warnung, kein FAIL)
  if (isJsFile && !LOGGER_EXEMPT.includes(fileName)) {
    const count = countConsoleLogs(content);
    if (count > 0) {
      result.info.push(`[WARN] ${count}x console.log() - bitte logger.info() nutzen`);
    }
  }

  // Check 3: Dateigroesse
  const sizeCheck = checkFileSize(content);
  if (!sizeCheck.ok) {
    result.info.push(`[WARN] ${sizeCheck.lines} Zeilen - ueberschreitet 500-Zeilen-Empfehlung`);
  } else {
    result.info.push(`[OK] ${sizeCheck.lines} Zeilen - konform`);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Ausfuehrung
// ---------------------------------------------------------------------------

try {
  if (filesToCheck.length === 0) {
    process.stdout.write('FAILED: Keine Dateien angegeben.\n');
    process.stdout.write('Usage: node audit_runner.cjs <file1> [file2]\n');
    process.exit(1);
  }

  const results  = filesToCheck.map(auditSingleFile);
  const allPassed = results.every(r => r.passed);
  const failCount = results.filter(r => !r.passed).length;

  if (JSON_MODE) {
    // Maschinell lesbare JSON-Ausgabe
    process.stdout.write(JSON.stringify({
      passed:     allPassed,
      total:      results.length,
      failed:     failCount,
      results,
    }, null, 2) + '\n');
  } else {
    // Mensch-lesbare kompakte Ausgabe
    results.forEach(r => {
      const status = r.passed ? 'PASSED' : 'FAILED';
      process.stdout.write(`${status}: ${r.file}\n`);
      r.issues.forEach(i => process.stdout.write(`  ${i}\n`));
      // Nur Info ausgeben wenn Fehler vorhanden (weniger Rauschen)
      if (!r.passed) {
        r.info.forEach(i => process.stdout.write(`  ${i}\n`));
      }
    });

    process.stdout.write(`\nGESAMT: ${allPassed ? 'PASSED' : 'FAILED'} `);
    process.stdout.write(`(${results.length - failCount}/${results.length} bestanden)\n`);
  }

  process.exit(allPassed ? 0 : 1);

} catch (err) {
  process.stderr.write(`Failure: ${err.message}\n`);
  process.exit(1);
}
