/**
 * @file setup_gemini.cjs
 * @description Gemini-Schmiede Installer (v2.0.0)
 *              Richtet die vollstaendige Agentic-Workflow-Infrastruktur ein.
 *              Idempotent: sicher mehrfach ausfuehrbar ohne bestehende Dateien zu ueberschreiben.
 *              Kein Abhaengigkeit von internen Modulen - vollstaendig self-contained.
 *
 * @usage
 *   node setup_gemini.cjs
 *
 * @prereq Node.js >= 18.0.0
 */
'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Hilfsfunktionen (self-contained, kein import von logger oder config)
// ---------------------------------------------------------------------------

const ROOT = process.cwd();

/** Formatierte Konsolenausgabe */
const log = {
  info:    msg => process.stdout.write(`  [INFO]  ${msg}\n`),
  ok:      msg => process.stdout.write(`  [OK]    ${msg}\n`),
  skip:    msg => process.stdout.write(`  [SKIP]  ${msg}\n`),
  error:   msg => process.stderr.write(`  [ERROR] ${msg}\n`),
  section: msg => process.stdout.write(`\n--- ${msg} ---\n`),
};

/**
 * Erstellt ein Verzeichnis wenn es nicht existiert. Idempotent.
 * @param {string} relPath - Pfad relativ zu ROOT
 */
function ensureDir(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    fs.mkdirSync(abs, { recursive: true });
    log.ok(`Verzeichnis erstellt: ${relPath}/`);
  } else {
    log.skip(`Verzeichnis vorhanden: ${relPath}/`);
  }
}

/**
 * Erstellt eine Datei NUR wenn sie noch nicht existiert.
 * Verhindert ungewolltes Ueberschreiben von Nutzer-Konfigurationen.
 * @param {string} relPath - Pfad relativ zu ROOT
 * @param {string} content - Datei-Inhalt
 */
function createFile(relPath, content) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    fs.writeFileSync(abs, content, 'utf8');
    log.ok(`Erstellt: ${relPath}`);
  } else {
    log.skip(`Bereits vorhanden: ${relPath}`);
  }
}

/**
 * Prueft die Node.js Mindest-Version.
 * @param {number} major - Mindest-Major-Version
 * @throws {Error} Bei zu alter Version
 */
function checkNodeVersion(major) {
  const current = parseInt(process.versions.node.split('.')[0], 10);
  if (current < major) {
    throw new Error(
      `Node.js ${major}.x oder hoeher erforderlich. Aktuell: ${process.versions.node}`
    );
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const GEMINI_CONFIG_TEMPLATE = JSON.stringify({
  version: '2.0.0',
  project: {
    name:        path.basename(ROOT),
    description: 'Agentic Workflow Projekt',
    language:    'de',
  },
  paths: {
    utils:   '.gemini/utils',
    logs:    '.gemini/logs',
    plans:   '.gemini/plans',
    docs:    '.gemini/docs',
    skills:  '.gemini/skills',
    backups: '.gemini/backups',
    tests:   'tests',
  },
  logging: {
    level:            'INFO',
    file:             '.gemini/logs/system.log',
    maxFileSizeBytes: 10485760,
    console:          true,
  },
  integrity: {
    defaultThreshold: 0.15,
    minAbsoluteLoss:  3,
    strictSymbols:    true,
    thresholds: {
      tiny:   { maxLines: 20,   tolerance: 0.40 },
      small:  { maxLines: 100,  tolerance: 0.15 },
      medium: { maxLines: 200,  tolerance: 0.10 },
      large:  { maxLines: null, tolerance: 0.05 },
    },
  },
  analytics: {
    statsFile: '.gemini/logs/stats.json',
  },
  audit: {
    command:         'gemini',
    flags:           ['-y', '-p'],
    timeout:         30000,
    stages:          ['local', 'integrity', 'ai'],
    localScript:     '.gemini/utils/validate_local.js',
    integrityScript: '.gemini/utils/integrity_check.js',
  },
  validation: {
    loggerPatterns: [
      '.gemini/utils/logger',
      "require('./logger'",
      "require('../utils/logger'",
    ],
    excludeFromLoggerCheck: [
      'logger.js',
      'validate_local.js',
      'error-handler.cjs',
      'run_tests.cjs',
    ],
    warnOnConsoleLogs:   true,
    maxFileLinesWarning: 500,
  },
  agents: {
    boss:     { context: 'BOSS' },
    planner:  { context: 'PLANNER' },
    reviewer: { context: 'REVIEWER' },
    worker:   { context: 'WORKER' },
    auditor:  { context: 'HYBRID-RUNNER' },
  },
}, null, 2);

const GEMINI_MD_TEMPLATE = `# Projekt: ${path.basename(ROOT)} (Agentic Workflow)

## Zentrale Mission
Entwicklung eines strukturierten Multi-Agenten-Systems mit strikter Trennung von
Planung (Planning-Agent), Validierung (Quality-Inspector) und Ausfuehrung (Worker).

## Architektur-Prinzipien
- **Persistenz-Zwang:** Alle Plaene in \`.gemini/plans/\`, Konzepte in \`.gemini/docs/\`.
- **Kontext-Hygiene:** Jede Session bezieht sich auf einen spezifischen Plan-Schritt.
- **Logging-Pflicht:** Alle wesentlichen Aktionen ueber \`.gemini/utils/logger.js\` protokollieren.
- **System-Map Schutz:** \`.gemini/system_map.md\` nur erweitern, nie kuerzen oder loeschen.
- **MVC (Minimum Viable Context):** Nur notwendige Dateien lesen - Token sparen.

## Rollen-Protokolle

### Der Boss-Agent (Koordinator)
1. Scanne \`.gemini/system_map.md\` und aktuellen Plan.
2. Delegiere zu Worker-Agenten fuer Implementierung.
3. Starte Audit nach jeder Implementierung: \`node .gemini/utils/run_audit.cjs <dateien>\`
4. Setze Checkpoint nach PASSED: \`node .gemini/utils/checkpoint_manager.js <plan> <schritt>\`

### Der Worker-Agent (Implementierer)
1. Lese NUR die relevanten Dateien fuer deinen Auftrag.
2. Implementiere exakt den definierten Schritt - kein Scope Creep.
3. Nutze \`logger.withContext('WORKER')\` fuer alle Log-Ausgaben.
4. Starte KEINE weiteren Sub-Agenten.

### Der Auditor-Agent (Prufer)
1. Pruefe auf: Logger-Import, Verzeichnis-Konformitaet, Scope-Einhaltung.
2. Antworte NUR mit PASSED oder FAILED + kompakter Fehlerliste.
3. Aendere KEINEN Code, starte KEINE neuen Agenten.
`;

const INITIAL_PLAN_TEMPLATE = `# Plan: Projekt-Initialisierung

## Kontext & Ziel
Erster Plan nach dem Setup. Verifizierung der Grundstruktur.

## Schnittstellen & Architektur
- Logger: \`.gemini/utils/logger.js\`
- Audit: \`.gemini/utils/run_audit.cjs\`
- Checkpoint: \`.gemini/utils/checkpoint_manager.js\`

## Implementierungsschritte (Checkliste)

- [x] Schritt 1: Verzeichnisstruktur und Basis-Infrastruktur einrichten.
- [ ] Schritt 2: Erstes Feature mit dem planning-agent planen.
- [ ] Schritt 3: Implementation durch Worker-Agent ausfuehren.
- [ ] Schritt 4: Hybrid-Audit ausfuehren und Checkpoint setzen.

## Test-Strategie
1. Logger-Test: \`node tests/test_logger.cjs\`
2. Audit-Test: \`node .gemini/utils/run_audit.cjs .gemini/utils/logger.js\`

## Checkpoint-Info
Setup abgeschlossen. Infrastruktur bereit. Naechster Schritt: Feature-Planung starten.
`;

const STATS_TEMPLATE = JSON.stringify({ ai_agent_calls: 0 }, null, 2);

// ---------------------------------------------------------------------------
// Setup-Ausfuehrung
// ---------------------------------------------------------------------------

process.stdout.write('\n=====================================\n');
process.stdout.write('  GEMINI-SCHMIEDE SETUP v2.0.0\n');
process.stdout.write('=====================================\n');

try {
  // Schritt 1: Node.js Version pruefen
  log.section('Schritt 1: Systemvoraussetzungen');
  checkNodeVersion(18);
  log.ok(`Node.js ${process.versions.node} - Anforderung erfuellt.`);

  // Schritt 2: Verzeichnisstruktur erstellen
  log.section('Schritt 2: Verzeichnisstruktur');
  const dirs = [
    '.gemini',
    '.gemini/utils',
    '.gemini/utils/core',
    '.gemini/plans',
    '.gemini/docs',
    '.gemini/logs',
    '.gemini/backups',
    '.gemini/skills',
    'tests',
  ];
  dirs.forEach(ensureDir);

  // Schritt 3: Konfigurationsdateien
  log.section('Schritt 3: Konfigurationsdateien');
  createFile('gemini.config.json', GEMINI_CONFIG_TEMPLATE);
  createFile('GEMINI.md',          GEMINI_MD_TEMPLATE);

  // Schritt 4: Initialen Plan erstellen
  log.section('Schritt 4: Initialer Plan');
  createFile('.gemini/plans/initial_setup.md', INITIAL_PLAN_TEMPLATE);

  // Schritt 5: Stats-Datei initialisieren
  log.section('Schritt 5: Analytics');
  createFile('.gemini/logs/stats.json', STATS_TEMPLATE);

  // Schritt 6: Verifikation
  log.section('Schritt 6: Verifikation');
  const verifyFiles = [
    'gemini.config.json',
    '.gemini/utils/logger.js',
    '.gemini/utils/run_audit.cjs',
    '.gemini/utils/checkpoint_manager.js',
    '.gemini/utils/validate_local.js',
    '.gemini/utils/integrity_check.js',
    '.gemini/utils/analytics.js',
  ];

  let allPresent = true;
  verifyFiles.forEach(f => {
    if (fs.existsSync(path.join(ROOT, f))) {
      log.ok(`Vorhanden: ${f}`);
    } else {
      log.error(`Fehlt:     ${f} - Kopiere .gemini/utils/ aus dem Gemini-Schmiede Repository.`);
      allPresent = false;
    }
  });

  // Abschluss
  process.stdout.write('\n=====================================\n');
  if (allPresent) {
    process.stdout.write('  SETUP ERFOLGREICH ABGESCHLOSSEN\n');
    process.stdout.write('=====================================\n\n');
    process.stdout.write('Naechste Schritte:\n');
    process.stdout.write('  1. Starte Gemini: gemini\n');
    process.stdout.write('  2. Sage: "Lies GEMINI.md und starte Schritt 2 in initial_setup.md"\n');
    process.stdout.write('  3. Teste: node tests/test_logger.cjs\n\n');
  } else {
    process.stdout.write('  SETUP MIT WARNUNGEN ABGESCHLOSSEN\n');
    process.stdout.write('=====================================\n\n');
    process.stdout.write('Fehlende Utils-Dateien kopieren aus dem Gemini-Schmiede Repository.\n\n');
  }

} catch (err) {
  log.error(`Setup fehlgeschlagen: ${err.message}`);
  process.exit(1);
}
