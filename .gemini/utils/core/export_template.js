/**
 * @file export_template.js
 * @description Exportiert den "Gemini-Schmiede" Kern in ein Zielverzeichnis.
 *              Nützlich zum Initialisieren neuer Projekte mit dem Framework-Kern.
 *
 * @usage node .gemini/utils/core/export_template.js <ziel_pfad>
 */
'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('../logger').withContext('EXPORT'); // Pattern: .gemini/utils/logger

const [,, targetPath] = process.argv;

if (!targetPath) {
  logger.error('Kein Zielpfad angegeben.');
  process.stdout.write('Usage: node export_template.js <ziel_pfad>
');
  process.exit(1);
}

const absTarget = path.isAbsolute(targetPath) ? targetPath : path.resolve(process.cwd(), targetPath);

// Framework-Komponenten
const components = [
  '.gemini',
  'GEMINI.md',
  'setup_gemini.cjs',
  'gemini.config.json'
];

/**
 * Kopiert Verzeichnisse oder Dateien rekursiv.
 */
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(child => {
      // .git und node_modules innerhalb von Verzeichnissen ausschließen
      if (child === '.git' || child === 'node_modules') return;
      copyRecursive(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  if (!fs.existsSync(absTarget)) {
    fs.mkdirSync(absTarget, { recursive: true });
  }

  logger.info(`Starte Export nach: ${absTarget}`);

  components.forEach(item => {
    const src = path.join(process.cwd(), item);
    const dest = path.join(absTarget, item);

    if (fs.existsSync(src)) {
      logger.info(`Kopiere: ${item}...`);
      copyRecursive(src, dest);
    } else {
      logger.warn(`Überspringe (nicht gefunden): ${item}`);
    }
  });

  logger.info('Framework-Template erfolgreich exportiert.');
  process.exit(0);

} catch (err) {
  logger.error(`Fehler beim Export: ${err.message}`);
  process.exit(1);
}
