/**
 * @file test_git_manager.cjs
 * @description Test: Git-Manager (git_manager.js)
 *
 * Prueft:
 *   1. getCurrentBranch gibt nicht-leeren String zurueck
 *   2. getStatus gibt { branch, clean, staged, unstaged } Struktur zurueck
 *   3. hasUncommittedChanges gibt boolean zurueck
 *   4. getBranchPrefix liest Wert aus gemini.config.json
 *   5. sanitizeName bereinigt Namen korrekt (Sonderzeichen, Grossbuchstaben, Leerzeichen)
 */
'use strict';

const path = require('path');

const ROOT = path.join(__dirname, '..');
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, description) {
  if (condition) {
    process.stdout.write(`  [PASS] ${description}\n`);
    testsPassed++;
  } else {
    process.stderr.write(`  [FAIL] ${description}\n`);
    testsFailed++;
  }
}

// ---------------------------------------------------------------------------
process.stdout.write('Test: git_manager.js\n');

const git = require('../.gemini/utils/git_manager');

// Test 1: getCurrentBranch gibt nicht-leeren String zurueck
const branch = git.getCurrentBranch();
assert(typeof branch === 'string' && branch.length > 0, `getCurrentBranch gibt String zurueck: "${branch}"`);

// Test 2: getStatus gibt korrekte Struktur zurueck
const status = git.getStatus();
assert(typeof status === 'object' && status !== null,         'getStatus gibt Objekt zurueck');
assert(typeof status.branch  === 'string',                   'getStatus.branch ist String');
assert(typeof status.clean   === 'boolean',                  'getStatus.clean ist Boolean');
assert(typeof status.staged  === 'number',                   'getStatus.staged ist Number');
assert(typeof status.unstaged === 'number',                  'getStatus.unstaged ist Number');

// Test 3: hasUncommittedChanges gibt boolean zurueck
const dirty = git.hasUncommittedChanges();
assert(typeof dirty === 'boolean', 'hasUncommittedChanges gibt boolean zurueck');

// Test 4: getBranchPrefix liest aus gemini.config.json
const prefix = git.getBranchPrefix();
assert(typeof prefix === 'string' && prefix.length > 0, `getBranchPrefix gibt String zurueck: "${prefix}"`);
assert(prefix === 'feature/', 'getBranchPrefix stimmt mit gemini.config.json ueberein (feature/)');

// Test 5: sanitizeName bereinigt Namen korrekt
const tests = [
  { input: 'My New Feature',     expected: 'my-new-feature'    },
  { input: 'TASK 123',           expected: 'task-123'          },
  { input: '  --hello world--',  expected: 'hello-world'       },
  { input: 'Auth & Login!',      expected: 'auth-login'        },
  { input: 'a'.repeat(60),       expected: 'a'.repeat(50)      },
];

let sanitizeAllPassed = true;
for (const t of tests) {
  const result = git.sanitizeName(t.input);
  if (result !== t.expected) {
    process.stderr.write(`  [FAIL] sanitizeName("${t.input}") => "${result}" (erwartet: "${t.expected}")\n`);
    sanitizeAllPassed = false;
    testsFailed++;
  } else {
    testsPassed++;
    process.stdout.write(`  [PASS] sanitizeName("${t.input}") => "${result}"\n`);
  }
}

// ---------------------------------------------------------------------------
process.stdout.write(`\nErgebnis: ${testsPassed} bestanden, ${testsFailed} fehlgeschlagen\n`);
process.exit(testsFailed > 0 ? 1 : 0);
