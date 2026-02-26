/**
 * @file setup_gemini.cjs
 * @description Projekt-Starter-Skript für die Gemini-Schmiede.
 * Initialisiert die Ordnerstruktur und erstellt die Basis-Konfiguration.
 * @author WORKER-V1
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

const defaultConfig = {
  project_name: "Gemini-Schmiede",
  version: "1.0.0",
  paths: {
    plans: ".gemini/plans",
    docs: ".gemini/docs",
    logs: ".gemini/logs",
    utils: ".gemini/utils",
    backups: ".gemini/backups",
    tests: "tests"
  },
  commands: {
    test: "echo 'Run your tests here'",
    lint: "echo 'Run your linter here'"
  }
};

const dirs = [
  '.gemini',
  '.gemini/plans',
  '.gemini/docs',
  '.gemini/logs',
  '.gemini/utils',
  '.gemini/utils/core',
  '.gemini/backups',
  'tests'
];

console.log('--- STARTE GEMINI-PROJEKT SETUP ---');

// 1. Verzeichnisse erstellen
dirs.forEach(dir => {
  const dirPath = path.join(projectRoot, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Verzeichnis erstellt: ${dir}`);
  }
});

// 2. gemini.config.json erstellen
const configPath = path.join(projectRoot, 'gemini.config.json');
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
  console.log('✅ gemini.config.json erstellt.');
} else {
  console.log('ℹ️ gemini.config.json existiert bereits.');
}

// 3. FS-Utils erstellen
const fsUtilsContent = `/**
 * @file fs_utils.cjs
 * @description Gemeinsame Dateisystem-Hilfsfunktionen.
 * @author WORKER-V1
 */
const fs = require('fs');
const path = require('path');

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson(filePath, defaultData = {}) {
  try {
    if (!fs.existsSync(filePath)) return defaultData;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return defaultData;
  }
}

function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  ensureDirExists(dir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function resolveAbsolutePath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

function getGeminiConfig() {
  const configPath = resolveAbsolutePath('gemini.config.json');
  return readJson(configPath, {
    project_name: 'Gemini-Schmiede',
    version: '1.0.0',
    paths: {},
    commands: {}
  });
}

module.exports = { ensureDirExists, readJson, writeJson, resolveAbsolutePath, getGeminiConfig };
`;

fs.writeFileSync(path.join(projectRoot, '.gemini/utils/core/fs_utils.cjs'), fsUtilsContent);
console.log('✅ Core FS-Utils installiert.');

// 4. Logger-Utility erstellen
const loggerContent = `/**
 * @file logger.cjs
 * @description Zentrales Logging-Modul.
 * @author WORKER-V1
 */
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'system.log');

class Logger {
  constructor(context = 'SYSTEM') {
    this.context = context;
    this.levels = { DEBUG: 'DEBUG', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' };
  }

  _log(level, message, context = this.context) {
    const timestamp = new Date().toISOString();
    const formattedMessage = \`[\${timestamp}] [\${level}] [\${context}] - \${message}\`;
    if (level === 'ERROR') console.error(formattedMessage);
    else if (level === 'WARN') console.warn(formattedMessage);
    else console.log(formattedMessage);

    try {
      const logsDir = path.dirname(LOG_FILE);
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
      fs.appendFileSync(LOG_FILE, formattedMessage + '\\n', 'utf8');
    } catch (err) {
      console.error(\`Logger Error: \${err.message}\`);
    }
  }

  debug(msg, ctx) { this._log('DEBUG', msg, ctx); }
  info(msg, ctx) { this._log('INFO', msg, ctx); }
  warn(msg, ctx) { this._log('WARN', msg, ctx); }
  error(msg, ctx) { this._log('ERROR', msg, ctx); }

  withContext(context) { return new Logger(context); }
}

module.exports = new Logger();
`;

fs.writeFileSync(path.join(projectRoot, '.gemini/utils/logger.cjs'), loggerContent);
console.log('✅ Logger-Utility installiert.');

// 5. Template Standards erstellen
const templateContent = `# Gemini Schmiede: Projekt Standards

Dieses Dokument dient als Vorlage für neue Projekte in der Gemini Schmiede.

## Code-Qualität
- Alle Dateien müssen ein JSDoc Header haben.
- Funktionen müssen dokumentiert werden.

## Workflow
1. Plane in /.gemini/plans/
2. Führe Änderungen über Worker-Agenten aus.
3. Validiere mit run_audit.cjs
`;

fs.writeFileSync(path.join(projectRoot, '.gemini/docs/template_standards.md'), templateContent);
console.log('✅ Template Standards erstellt.');

console.log('--- SETUP ERFOLGREICH ABGESCHLOSSEN ---');
