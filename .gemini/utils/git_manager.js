/**
 * @file git_manager.js
 * @description Git-Automatisierung und Branch-per-Feature-Erzwingung.
 *              Kapselt alle Git-Operationen (kein shell: true) und stellt sicher,
 *              dass Features immer auf isolierten Branches entwickelt werden.
 *
 * @usage
 *   const git = require('.gemini/utils/git_manager');
 *   const status = git.getStatus();           // { branch, clean, staged, unstaged }
 *   const branch = git.getCurrentBranch();    // 'feature/my-feature'
 *   const dirty  = git.hasUncommittedChanges();
 *   git.createFeatureBranch('my new feature'); // erstellt 'feature/my-new-feature'
 *   git.commitWithMessage('Add feature X', ['src/foo.js']);
 *   git.validateBranchForFeature();           // wirft Error wenn auf main
 *
 * CLI:
 *   node .gemini/utils/git_manager.js status
 *   node .gemini/utils/git_manager.js branch
 *   node .gemini/utils/git_manager.js create <name>
 *   node .gemini/utils/git_manager.js check
 */
'use strict';

const { spawnSync } = require('child_process');

const { getConfig }                  = require('./core/config.cjs');
const { getProjectRoot }             = require('./core/path-resolver.cjs');
const { handleError, validateRequired } = require('./core/error-handler.cjs');
const logger                         = require('./logger').withContext('GIT');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Fuehrt einen Git-Befehl aus (shell: false fuer Sicherheit).
 * @param   {string[]} args  - Git-Argumente
 * @returns {{ stdout: string, stderr: string, status: number, error: Error|null }}
 */
function _git(args) {
  const cwd    = getProjectRoot();
  const result = spawnSync('git', args, {
    cwd,
    shell:    false,
    encoding: 'utf8',
    timeout:  10000,
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status || 0,
    error:  result.error  || null,
  };
}

/**
 * Bereinigt einen Branch-Namen: Kleinbuchstaben, nur Bindestriche, max 50 Zeichen.
 * @param   {string} name
 * @returns {string}
 */
function sanitizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Gibt den Namen des aktuellen Branches zurueck.
 * @returns {string}
 */
function getCurrentBranch() {
  const result = _git(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (result.error || result.status !== 0) {
    handleError(
      result.error || new Error(result.stderr),
      'GIT.getCurrentBranch',
      false,
      logger
    );
    return 'unknown';
  }
  return result.stdout.trim();
}

/**
 * Prueft ob es uncommittete Aenderungen gibt.
 * @returns {boolean}
 */
function hasUncommittedChanges() {
  const result = _git(['status', '--porcelain']);
  if (result.error || result.status !== 0) return false;
  return result.stdout.trim().length > 0;
}

/**
 * Gibt einen zusammenfassenden Status-Report zurueck.
 * @returns {{ branch: string, clean: boolean, staged: number, unstaged: number }}
 */
function getStatus() {
  const branch    = getCurrentBranch();
  const clean     = !hasUncommittedChanges();
  const porcelain = _git(['status', '--porcelain']).stdout || '';
  const lines     = porcelain.trim().split('\n').filter(Boolean);
  const staged    = lines.filter(l => l[0] !== ' ' && l[0] !== '?').length;
  const unstaged  = lines.filter(l => l[1] === 'M' || l[0] === '?').length;
  return { branch, clean, staged, unstaged };
}

/**
 * Liest den Branch-Praefix aus gemini.config.json.
 * @returns {string} z.B. 'feature/'
 */
function getBranchPrefix() {
  const cfg = getConfig();
  return (cfg.github && cfg.github.branchPrefix) || 'feature/';
}

/**
 * Erstellt einen neuen Feature-Branch (mit Praefix) und wechselt darauf.
 * Branch-Name wird automatisch bereinigt.
 * @param   {string} name - Rohname z.B. "My New Feature"
 * @returns {string|null}  - Vollstaendiger Branch-Name oder null bei Fehler
 */
function createFeatureBranch(name) {
  validateRequired(name, 'branch name');
  const prefix    = getBranchPrefix();
  const safeName  = sanitizeName(name);
  const branch    = `${prefix}${safeName}`;

  logger.info(`Erstelle Branch: ${branch}`);
  const result = _git(['checkout', '-b', branch]);
  if (result.error || result.status !== 0) {
    handleError(
      result.error || new Error(result.stderr),
      'GIT.createFeatureBranch',
      false,
      logger
    );
    return null;
  }
  logger.info(`Branch erstellt und ausgecheckt: ${branch}`);
  return branch;
}

/**
 * Staged die angegebenen Dateien und erstellt einen Commit.
 * @param   {string}          msg   - Commit-Message (max. commitMsgMaxLen Zeichen)
 * @param   {string|string[]} files - Dateien oder '.' fuer alle
 * @returns {boolean} true bei Erfolg
 */
function commitWithMessage(msg, files) {
  validateRequired(msg, 'commit message');
  const cfg    = getConfig();
  const maxLen = (cfg.github && cfg.github.commitMsgMaxLen) || 72;

  if (msg.length > maxLen) {
    logger.warn(`Commit-Message zu lang: ${msg.length}/${maxLen} Zeichen`);
  }

  const filesToStage = Array.isArray(files) ? files : [files || '.'];
  const addResult    = _git(['add', ...filesToStage]);
  if (addResult.error || addResult.status !== 0) {
    handleError(
      addResult.error || new Error(addResult.stderr),
      'GIT.commitWithMessage.add',
      false,
      logger
    );
    return false;
  }

  const commitResult = _git(['commit', '-m', msg]);
  if (commitResult.error || commitResult.status !== 0) {
    const stderr = commitResult.stderr || '';
    if (stderr.includes('nothing to commit')) {
      logger.info('Nichts zu committen - uebersprungen');
      return true;
    }
    handleError(
      commitResult.error || new Error(stderr),
      'GIT.commitWithMessage.commit',
      false,
      logger
    );
    return false;
  }

  logger.info(`Commit: ${msg}`);
  return true;
}

/**
 * Wirft einen Fehler, wenn direkt auf dem Main-Branch gearbeitet wird
 * und branchPerFeatureRequired in der Config aktiviert ist.
 * @throws {Error}
 */
function validateBranchForFeature() {
  const cfg      = getConfig();
  const required = cfg.github && cfg.github.branchPerFeatureRequired;
  if (!required) return;

  const mainBranch = (cfg.github && cfg.github.mainBranch) || 'main';
  const current    = getCurrentBranch();
  if (current === mainBranch || current === 'master') {
    throw new Error(
      `Branch-per-Feature-Regel verletzt: Direkte Arbeit auf '${current}' verboten.\n` +
      `Erstelle einen Feature-Branch mit:\n` +
      `  node .gemini/utils/git_manager.js create <name>`
    );
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const cmd = process.argv[2] || 'status';
  const arg = process.argv[3];

  if (cmd === 'status') {
    const s = getStatus();
    process.stdout.write(JSON.stringify(s, null, 2) + '\n');
  } else if (cmd === 'branch') {
    process.stdout.write(getCurrentBranch() + '\n');
  } else if (cmd === 'create') {
    if (!arg) {
      process.stderr.write('Usage: git_manager.js create <name>\n');
      process.exit(1);
    }
    const branch = createFeatureBranch(arg);
    if (branch) process.stdout.write(`Branch erstellt: ${branch}\n`);
    else process.exit(1);
  } else if (cmd === 'check') {
    try {
      validateBranchForFeature();
      process.stdout.write('OK: Branch-Regel eingehalten\n');
    } catch (e) {
      process.stderr.write(e.message + '\n');
      process.exit(1);
    }
  } else {
    process.stdout.write(
      'Usage: node .gemini/utils/git_manager.js [status|branch|create <name>|check]\n'
    );
  }
}

module.exports = {
  getStatus,
  getCurrentBranch,
  hasUncommittedChanges,
  createFeatureBranch,
  commitWithMessage,
  getBranchPrefix,
  validateBranchForFeature,
  sanitizeName,
};
