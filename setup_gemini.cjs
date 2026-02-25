const fs = require('fs');
const path = require('path');

/**
 * Gemini-Schmiede: Projekt-Starter-Skript
 * Erstellt die notwendige Infrastruktur für sauberes, agentenbasiertes Programmieren.
 */

const projectRoot = process.cwd();
const geminiDir = path.join(projectRoot, '.gemini');
const dirs = [
  geminiDir,
  path.join(geminiDir, 'plans'),
  path.join(geminiDir, 'docs'),
  path.join(geminiDir, 'logs'),
  path.join(geminiDir, 'utils'),
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

// 2. Logger-Utility erstellen (.gemini/utils/logger.js)
const loggerContent = `const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'system.log');

class Logger {
  constructor(context = 'SYSTEM') {
    this.context = context;
    this.levels = { DEBUG: 'DEBUG', INFO: 'INFO', WARN: 'WARN', ERROR: 'ERROR' };
  }

  _log(level, message, context = this.context) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[\${timestamp}] [\${level}] [\${context}] - \${message}`;
    if (level === 'ERROR') console.error(formattedMessage);
    else if (level === 'WARN') console.warn(formattedMessage);
    else console.log(formattedMessage);

    try {
      fs.appendFileSync(LOG_FILE, formattedMessage + '
', 'utf8');
    } catch (err) {
      console.error(`Logger Error: \${err.message}`);
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

fs.writeFileSync(path.join(geminiDir, 'utils', 'logger.js'), loggerContent);
console.log('✅ Logger-Utility installiert.');

// 3. GEMINI.md (Das Projekt-Gesetz) erstellen
const geminiMdContent = `# Projekt: [PROJEKTNAME] (Agentic Workflow)

## Zentrale Mission
Entwicklung eines hochstrukturierten Multi-Agenten-Systems mit strikter Trennung von Planung, Validierung und Ausführung.

## Architektur-Prinzipien
- **Persistenz-Zwang:** Pläne in /.gemini/plans/, Konzepte in /.gemini/docs/.
- **Kontext-Hygiene:** Jede Session basiert auf einem spezifischen Plan-Schritt.
- **Logging-Pflicht:** Nutzung von /.gemini/utils/logger.js für alle Aktionen.

## Arbeitsanweisung für den Boss-Agenten
1. Scanne GEMINI.md und /.gemini/plans/.
2. Nutze den Logger mit Kontext [BOSS].
3. Delegiere Planung an den planning-agent.
`;

fs.writeFileSync(path.join(projectRoot, 'GEMINI.md'), geminiMdContent);
console.log('✅ GEMINI.md erstellt.');

// 4. Initialer Willkommens-Plan
const initialPlanContent = `# Plan: Projekt-Initialisierung

## Kontext & Ziel
Erster Plan nach dem Setup, um die Grundstruktur zu verifizieren.

## Implementierungsschritte
- [x] Schritt 1: Verzeichnisstruktur und Logger-Basis bereitstellen.
- [ ] Schritt 2: Erste Feature-Planung mit dem planning-agent starten.

## Checkpoint-Info
Das Projekt-Skelett steht. Der Logger ist bereit unter /.gemini/utils/logger.js.
`;

fs.writeFileSync(path.join(geminiDir, 'plans', 'initial_setup.md'), initialPlanContent);
console.log('✅ Initialer Setup-Plan erstellt.');

console.log('--- SETUP ERFOLGREICH ABGESCHLOSSEN ---');
console.log('Nächster Schritt: Starte Gemini und sage: "Lies GEMINI.md und fange mit Schritt 2 im initial_setup.md Plan an."');
