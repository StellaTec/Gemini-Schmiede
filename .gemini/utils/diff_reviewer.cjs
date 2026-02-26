/**
 * @file diff_reviewer.cjs
 * @description Diff-basierte Code-Review: vergleicht aktuelle Aenderungen mit dem
 *              geplanten Scope und gibt ein strukturiertes Review-Ergebnis zurueck.
 *              Verhindert Scope-Creep durch automatische Diff-Analyse.
 *
 * @usage
 *   const reviewer = require('.gemini/utils/diff_reviewer.cjs');
 *   const diff     = reviewer.getDiff('HEAD~1', 'HEAD');
 *   const result   = reviewer.reviewDiff(diff, 'Schritt 3: session_state.js erstellen');
 *   // result => { passed: true, warnings: [], outOfScope: [] }
 *
 *   // Convenience: aktuelle Aenderungen gegen Plan-Schritt pruefen
 *   const result2 = reviewer.reviewCurrentChanges('Schritt 1: config aktualisieren');
 *
 * CLI:
 *   node .gemini/utils/diff_reviewer.cjs review [planStepDescription]
 *   node .gemini/utils/diff_reviewer.cjs diff [fromRef] [toRef]
 */
'use strict';

const { spawnSync } = require('child_process');

const { getProjectRoot }         = require('./core/path-resolver.cjs');
const { handleError }            = require('./core/error-handler.cjs');
const logger                     = require('./logger').withContext('DIFF-REVIEWER');

// ---------------------------------------------------------------------------
// Geschuetzte Dateien (ausserhalb des Plan-Scopes)
// ---------------------------------------------------------------------------

const PROTECTED_FILES = [
  'GEMINI.md',
  '.gemini/system_map.md',
  'gemini.config.json',
  'package.json',
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Fuehrt einen Git-Befehl aus.
 * @param   {string[]} args
 * @returns {{ stdout: string, stderr: string, status: number }}
 */
function _git(args) {
  const cwd    = getProjectRoot();
  const result = spawnSync('git', args, {
    cwd,
    shell:    false,
    encoding: 'utf8',
    timeout:  15000,
  });
  return {
    stdout: result.stdout  || '',
    stderr: result.stderr  || '',
    status: result.status  || 0,
    error:  result.error   || null,
  };
}

/**
 * Zaehlt Plus/Minus-Zeilen in einem Diff-String.
 * @param   {string} diff
 * @returns {{ added: number, removed: number }}
 */
function _countChanges(diff) {
  const lines   = diff.split('\n');
  const added   = lines.filter(l => l.startsWith('+') && !l.startsWith('+++')).length;
  const removed = lines.filter(l => l.startsWith('-') && !l.startsWith('---')).length;
  return { added, removed };
}

/**
 * Extrahiert alle geaenderten Dateinamen aus einem Diff.
 * @param   {string} diff
 * @returns {string[]}
 */
function _extractChangedFiles(diff) {
  const files = new Set();
  const regex = /^(?:\+\+\+|---) b?\/(.+)$/gm;
  let match;
  while ((match = regex.exec(diff)) !== null) {
    const file = match[1];
    if (file !== '/dev/null') files.add(file);
  }
  return Array.from(files);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Gibt den Git-Diff zwischen zwei Refs zurueck.
 * @param   {string} [fromRef='HEAD~1'] - Start-Referenz
 * @param   {string} [toRef='HEAD']     - End-Referenz
 * @returns {string} Raw diff output
 */
function getDiff(fromRef, toRef) {
  const from   = fromRef || 'HEAD~1';
  const to     = toRef   || 'HEAD';
  const result = _git(['diff', `${from}`, `${to}`]);
  if (result.error) {
    handleError(result.error, 'DIFF-REVIEWER.getDiff', false, logger);
    return '';
  }
  return result.stdout;
}

/**
 * Gibt den Diff aller uncommitteten Aenderungen (git diff HEAD) zurueck.
 * @returns {string}
 */
function getWorkingTreeDiff() {
  // Staged + Unstaged
  const staged   = _git(['diff', '--cached']).stdout || '';
  const unstaged = _git(['diff']).stdout || '';
  return staged + unstaged;
}

/**
 * Analysiert einen Diff-String und prueft auf Scope-Verletzungen.
 * @param   {string} diff                  - Raw git diff
 * @param   {string} [planStepDescription] - Beschreibung des aktuellen Plan-Schritts
 * @returns {{ passed: boolean, warnings: string[], outOfScope: string[] }}
 */
function reviewDiff(diff, planStepDescription) {
  const warnings   = [];
  const outOfScope = [];

  if (!diff || diff.trim().length === 0) {
    return { passed: true, warnings: ['Kein Diff vorhanden - keine Aenderungen'], outOfScope: [] };
  }

  const changedFiles = _extractChangedFiles(diff);
  const { added, removed } = _countChanges(diff);

  // Check 1: Keine neuen console.log Statements im Diff
  const consoleLogPattern = /^\+[^+].*console\.log\s*\(/m;
  if (consoleLogPattern.test(diff)) {
    warnings.push('console.log gefunden: Bitte logger.js verwenden statt console.log');
  }

  // Check 2: Geschuetzte Dateien veraendert?
  for (const file of changedFiles) {
    const isProtected = PROTECTED_FILES.some(p => file.endsWith(p));
    if (isProtected && planStepDescription) {
      const descLower = planStepDescription.toLowerCase();
      const fileLower = file.toLowerCase().replace(/[^a-z0-9]/g, '');
      // Pruefe ob Datei im Plan-Schritt erwaehnt wird
      const mentioned = descLower.includes(file.split('/').pop().replace('.', '')) ||
                        descLower.includes(fileLower);
      if (!mentioned) {
        outOfScope.push(`Geschuetzte Datei ohne Plan-Erwaehnung: ${file}`);
      }
    }
  }

  // Check 3: Integrity-Sanity (massiver Loeschungsanteil)
  const totalChanges = added + removed;
  if (totalChanges > 0 && removed > 0) {
    const deletionRatio = removed / totalChanges;
    if (deletionRatio > 0.8 && removed > 20) {
      warnings.push(
        `Hoher Loeschungsanteil: ${removed} Zeilen entfernt (${Math.round(deletionRatio * 100)}%)` +
        ` - Integrity-Check empfohlen`
      );
    }
  }

  // Check 4: Groesse des Diffs (Scope-Indikator)
  if (added > 500) {
    warnings.push(
      `Grosser Diff: +${added} Zeilen in einem Schritt - erwaege Aufsplitten in Teilschritte`
    );
  }

  const passed = outOfScope.length === 0;

  logger.info(
    `Diff-Review: ${passed ? 'PASSED' : 'FAILED'} | ` +
    `+${added}/-${removed} Zeilen | ` +
    `${changedFiles.length} Datei(en) | ` +
    `Warnungen: ${warnings.length} | Scope-Verst.: ${outOfScope.length}`
  );

  return { passed, warnings, outOfScope };
}

/**
 * Convenience: Prueft aktuelle uncommittete Aenderungen gegen Plan-Schritt.
 * @param   {string} [planStepDescription]
 * @returns {{ passed: boolean, warnings: string[], outOfScope: string[] }}
 */
function reviewCurrentChanges(planStepDescription) {
  const diff = getWorkingTreeDiff();
  return reviewDiff(diff, planStepDescription);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const cmd  = process.argv[2] || 'review';
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  if (cmd === 'diff') {
    const d = getDiff(arg1, arg2);
    if (d) {
      process.stdout.write(d);
    } else {
      process.stdout.write('(Kein Diff)\n');
    }
  } else if (cmd === 'review') {
    const planStep = arg1 || '';
    const diff     = getWorkingTreeDiff();
    const result   = reviewDiff(diff, planStep);

    process.stdout.write('\n=== Diff-Review ===\n');
    process.stdout.write(`Status: ${result.passed ? 'PASSED ✓' : 'FAILED ✗'}\n`);

    if (result.warnings.length > 0) {
      process.stdout.write('\nWarnungen:\n');
      result.warnings.forEach(w => process.stdout.write(`  - ${w}\n`));
    }
    if (result.outOfScope.length > 0) {
      process.stdout.write('\nScope-Verletzungen:\n');
      result.outOfScope.forEach(s => process.stdout.write(`  ! ${s}\n`));
    }
    if (result.warnings.length === 0 && result.outOfScope.length === 0) {
      process.stdout.write('Keine Auffaelligkeiten.\n');
    }
    process.stdout.write('\n');

    process.exit(result.passed ? 0 : 1);
  } else {
    process.stdout.write(
      'Usage: node .gemini/utils/diff_reviewer.cjs [review [planStep]|diff [from] [to]]\n'
    );
  }
}

module.exports = { getDiff, getWorkingTreeDiff, reviewDiff, reviewCurrentChanges };
