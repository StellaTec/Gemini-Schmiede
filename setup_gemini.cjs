/**
 * @file setup_gemini.cjs
 * @description Projekt-Starter-Skript für die Gemini-Schmiede.
 * Erstellt die notwendige Infrastruktur für agentenbasiertes Programmieren.
 * @author WORKER-V1
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const geminiDir = path.join(projectRoot, '.gemini');
const dirs = [
  geminiDir,
  path.join(geminiDir, 'plans'),
  path.join(geminiDir, 'docs'),
  path.join(geminiDir, 'logs'),
  path.join(geminiDir, 'utils'),
  path.join(geminiDir, 'utils', 'core'),
  path.join(projectRoot, 'tests')
];

console.log('--- STARTE GEMINI-PROJEKT SETUP ---');

// 1. Verzeichnisse erstellen
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Verzeichnis erstellt: ${path.relative(projectRoot, dir)}`);
  }
});

// 2. FS-Utils erstellen
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

module.exports = { ensureDirExists, readJson, writeJson, resolveAbsolutePath };
`;

fs.writeFileSync(path.join(geminiDir, 'utils', 'core', 'fs_utils.cjs'), fsUtilsContent);
console.log('✅ Core FS-Utils installiert.');

// 3. Logger-Utility erstellen
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

fs.writeFileSync(path.join(geminiDir, 'utils', 'logger.cjs'), loggerContent);
console.log('✅ Logger-Utility installiert.');

// 4. GEMINI.md erstellen
const geminiMdContent = `# Projekt: [PROJEKTNAME] (Agentic Workflow)

## Zentrale Mission
Entwicklung eines hochstrukturierten Multi-Agenten-Systems.

## Architektur-Prinzipien
- **Persistenz-Zwang:** Pläne in /.gemini/plans/, Konzepte in /.gemini/docs/.
- **Logging-Pflicht:** Nutzung von /.gemini/utils/logger.cjs für alle Aktionen.

## Arbeitsanweisung für den Boss-Agenten
1. Scanne GEMINI.md und /.gemini/plans/.
2. Nutze den Logger mit Kontext [BOSS].
`;

fs.writeFileSync(path.join(projectRoot, 'GEMINI.md'), geminiMdContent);
console.log('✅ GEMINI.md erstellt.');

console.log('--- SETUP ERFOLGREICH ABGESCHLOSSEN ---');
