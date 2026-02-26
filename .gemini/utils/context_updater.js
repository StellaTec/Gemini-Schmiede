/**
 * @file context_updater.js
 * @description Utility zum Lesen und Aktualisieren von Sektionen in project_context.md.
 *              Jede Sektion wird durch einen ## Header identifiziert. Timestamps pro
 *              Sektion werden in .gemini/logs/context_meta.json gespeichert.
 *
 * @usage
 *   const ctx = require('.gemini/utils/context_updater');
 *   ctx.appendToSection('Letzte Aenderungen', '- Feature X eingebaut (2026-02-26)');
 *   ctx.updateSection('Projekt', 'Meine App — macht Dinge.');
 *   const text = ctx.readSection('Architektur');
 *   const meta = ctx.getMetadata();
 *
 * CLI:
 *   node .gemini/utils/context_updater.js status
 *   node .gemini/utils/context_updater.js read "<Sektion>"
 *   node .gemini/utils/context_updater.js append "<Sektion>" "<Zeile>"
 *   node .gemini/utils/context_updater.js update "<Sektion>" "<Inhalt>"
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const { getConfig }              = require('./core/config.cjs');
const { resolve, ensureDir }     = require('./core/path-resolver.cjs');
const { handleError, safeJsonParse } = require('./core/error-handler.cjs');
const logger                     = require('./logger').withContext('CONTEXT-UPDATER');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

function _getContextFile() {
  const cfg = getConfig();
  const ctxPath = (cfg.paths && cfg.paths.projectContext)
    ? cfg.paths.projectContext
    : 'project_context.md';
  return resolve(ctxPath);
}

function _getMetaFile() {
  const cfg = getConfig();
  const metaPath = (cfg.contextUpdater && cfg.contextUpdater.metaFile)
    ? cfg.contextUpdater.metaFile
    : '.gemini/logs/context_meta.json';
  return resolve(metaPath);
}

// ---------------------------------------------------------------------------
// Metadata (timestamps per section)
// ---------------------------------------------------------------------------

function _loadMeta() {
  const metaFile = _getMetaFile();
  if (!fs.existsSync(metaFile)) return {};
  const raw = fs.readFileSync(metaFile, 'utf8');
  return safeJsonParse(raw) || {};
}

function _saveMeta(meta) {
  const metaFile = _getMetaFile();
  ensureDir(path.dirname(metaFile));
  const tmp = metaFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(meta, null, 2), 'utf8');
  fs.renameSync(tmp, metaFile);
}

function _touchSection(sectionName) {
  const meta = _loadMeta();
  meta[sectionName] = new Date().toISOString();
  _saveMeta(meta);
}

// ---------------------------------------------------------------------------
// Section parsing
// ---------------------------------------------------------------------------

/**
 * Liest den gesamten Inhalt von project_context.md.
 * @returns {string}
 */
function _readFile() {
  const ctxFile = _getContextFile();
  if (!fs.existsSync(ctxFile)) {
    handleError(new Error(`project_context.md nicht gefunden: ${ctxFile}`), logger);
    return '';
  }
  return fs.readFileSync(ctxFile, 'utf8');
}

/**
 * Gibt den Inhalt einer benannten Sektion zurück (ohne den ## Header).
 * @param {string} sectionName - Exakter Name des ## Headers (z.B. "Projekt")
 * @returns {string|null} Sektions-Inhalt oder null wenn nicht gefunden
 */
function readSection(sectionName) {
  const content = _readFile();
  if (!content) return null;

  const lines = content.split('\n');
  let inSection = false;
  const sectionLines = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (inSection) break; // nächste Sektion beginnt
      if (line.trim() === `## ${sectionName}`) {
        inSection = true;
        continue;
      }
    }
    if (inSection) {
      sectionLines.push(line);
    }
  }

  if (!inSection) {
    logger.warn(`Sektion "${sectionName}" nicht gefunden in project_context.md`);
    return null;
  }

  // Führende/nachfolgende Leerzeilen trimmen
  const trimmed = sectionLines.join('\n').trim();
  return trimmed;
}

/**
 * Ersetzt den gesamten Inhalt einer Sektion mit neuem Inhalt.
 * @param {string} sectionName - Exakter Name des ## Headers
 * @param {string} newContent  - Neuer Inhalt (ohne Header)
 * @returns {boolean} true = Erfolg
 */
function updateSection(sectionName, newContent) {
  const ctxFile = _getContextFile();
  const content = _readFile();
  if (!content) return false;

  const lines = content.split('\n');
  const output = [];
  let inSection = false;
  let sectionFound = false;
  let sectionInserted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      if (inSection && !sectionInserted) {
        // Neuen Inhalt einfügen bevor nächste Sektion beginnt
        output.push('');
        output.push(newContent.trim());
        output.push('');
        sectionInserted = true;
        inSection = false;
      }
      if (line.trim() === `## ${sectionName}`) {
        sectionFound = true;
        inSection = true;
        output.push(line);
        continue;
      } else {
        inSection = false;
      }
    }

    if (!inSection) {
      output.push(line);
    }
  }

  // Letzte Sektion war die gesuchte
  if (inSection && !sectionInserted) {
    output.push('');
    output.push(newContent.trim());
    output.push('');
  }

  if (!sectionFound) {
    logger.warn(`Sektion "${sectionName}" nicht gefunden — kein Update`);
    return false;
  }

  // Header-Kommentar mit Timestamp aktualisieren
  const updatedContent = _updateHeaderTimestamp(output.join('\n'));

  const tmp = ctxFile + '.tmp';
  fs.writeFileSync(tmp, updatedContent, 'utf8');
  fs.renameSync(tmp, ctxFile);

  _touchSection(sectionName);
  logger.info(`Sektion "${sectionName}" aktualisiert`);
  return true;
}

/**
 * Hängt eine neue Zeile ans Ende einer Sektion an.
 * @param {string} sectionName - Exakter Name des ## Headers
 * @param {string} newLine     - Anzuhängende Zeile
 * @returns {boolean} true = Erfolg
 */
function appendToSection(sectionName, newLine) {
  const ctxFile = _getContextFile();
  const content = _readFile();
  if (!content) return false;

  const lines = content.split('\n');
  const output = [];
  let inSection = false;
  let sectionFound = false;
  let lastContentIdx = -1;

  // Finde die letzte nicht-leere Zeile der Sektion
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      if (inSection) break;
      if (line.trim() === `## ${sectionName}`) {
        sectionFound = true;
        inSection = true;
        continue;
      }
    }
    if (inSection && line.trim() !== '') {
      lastContentIdx = i;
    }
  }

  if (!sectionFound) {
    logger.warn(`Sektion "${sectionName}" nicht gefunden — kein Append`);
    return false;
  }

  // Neu aufbauen mit eingefügter Zeile
  inSection = false;
  let appended = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      if (inSection && !appended) {
        output.push(newLine);
        appended = true;
        inSection = false;
      }
      if (line.trim() === `## ${sectionName}`) {
        inSection = true;
        output.push(line);
        continue;
      } else {
        inSection = false;
      }
    }
    output.push(line);
    if (inSection && i === lastContentIdx && !appended) {
      output.push(newLine);
      appended = true;
    }
  }

  // Sektion war die letzte im Dokument
  if (!appended) {
    output.push(newLine);
  }

  const updatedContent = _updateHeaderTimestamp(output.join('\n'));

  const tmp = ctxFile + '.tmp';
  fs.writeFileSync(tmp, updatedContent, 'utf8');
  fs.renameSync(tmp, ctxFile);

  _touchSection(sectionName);
  logger.info(`Sektion "${sectionName}" ergänzt: ${newLine.substring(0, 60)}`);
  return true;
}

/**
 * Aktualisiert den Timestamp-Kommentar im Datei-Header.
 * @param {string} content
 * @returns {string}
 */
function _updateHeaderTimestamp(content) {
  const ts = new Date().toISOString();
  return content.replace(
    /<!-- Letzte Aktualisierung: .* -->/,
    `<!-- Letzte Aktualisierung: ${ts} -->`
  );
}

/**
 * Gibt die Metadaten (Timestamps pro Sektion) zurück.
 * @returns {Object}
 */
function getMetadata() {
  return _loadMeta();
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function _cliStatus() {
  const meta = _loadMeta();
  const sections = [
    'Projekt', 'Architektur', 'Datenhaltung', 'Aktive Features',
    'Offene Probleme', 'Letzte Aenderungen', 'Abhaengigkeiten', 'Umgebung'
  ];

  console.log('\n📄 project_context.md — Sektions-Status\n');
  console.log('Sektion'.padEnd(25) + 'Zuletzt geändert');
  console.log('-'.repeat(60));

  for (const s of sections) {
    const ts = meta[s] || '(noch nie)';
    console.log(s.padEnd(25) + ts);
  }
  console.log('');
}

function _cliRead(sectionName) {
  if (!sectionName) {
    console.error('Usage: context_updater.js read "<Sektion>"');
    process.exit(1);
  }
  const result = readSection(sectionName);
  if (result === null) {
    console.error(`Sektion "${sectionName}" nicht gefunden.`);
    process.exit(1);
  }
  console.log(`\n## ${sectionName}\n`);
  console.log(result);
  console.log('');
}

function _cliAppend(sectionName, line) {
  if (!sectionName || !line) {
    console.error('Usage: context_updater.js append "<Sektion>" "<Zeile>"');
    process.exit(1);
  }
  const ok = appendToSection(sectionName, line);
  if (!ok) process.exit(1);
  console.log(`✅ Zeile an Sektion "${sectionName}" angehängt.`);
}

function _cliUpdate(sectionName, content) {
  if (!sectionName || !content) {
    console.error('Usage: context_updater.js update "<Sektion>" "<Inhalt>"');
    process.exit(1);
  }
  const ok = updateSection(sectionName, content);
  if (!ok) process.exit(1);
  console.log(`✅ Sektion "${sectionName}" aktualisiert.`);
}

if (require.main === module) {
  const [,, cmd, arg1, arg2] = process.argv;

  switch (cmd) {
    case 'status':
      _cliStatus();
      break;
    case 'read':
      _cliRead(arg1);
      break;
    case 'append':
      _cliAppend(arg1, arg2);
      break;
    case 'update':
      _cliUpdate(arg1, arg2);
      break;
    default:
      console.log('Verwendung:');
      console.log('  node context_updater.js status');
      console.log('  node context_updater.js read "<Sektion>"');
      console.log('  node context_updater.js append "<Sektion>" "<Zeile>"');
      console.log('  node context_updater.js update "<Sektion>" "<Inhalt>"');
      process.exit(0);
  }
}

module.exports = { readSection, updateSection, appendToSection, getMetadata };
