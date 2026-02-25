/**
 * @file fs_utils.cjs
 * @description Gemeinsame Dateisystem-Hilfsfunktionen für die Gemini-Schmiede.
 * @author WORKER-V1
 */

const fs = require('fs');
const path = require('path');

/**
 * Stellt sicher, dass ein Verzeichnis existiert. Erstellt es rekursiv, falls nicht.
 * @param {string} dirPath - Der Pfad zum Verzeichnis.
 */
function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Liest eine JSON-Datei sicher ein.
 * @param {string} filePath - Pfad zur JSON-Datei.
 * @param {Object} [defaultData={}] - Standarddaten, falls die Datei nicht existiert oder fehlerhaft ist.
 * @returns {Object} Die eingelesenen Daten.
 */
function readJson(filePath, defaultData = {}) {
  try {
    if (!fs.existsSync(filePath)) return defaultData;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return defaultData;
  }
}

/**
 * Schreibt Daten in eine JSON-Datei.
 * @param {string} filePath - Pfad zur JSON-Datei.
 * @param {Object} data - Die zu schreibenden Daten.
 */
function writeJson(filePath, data) {
  const dir = path.dirname(filePath);
  ensureDirExists(dir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Löst einen Pfad zu einem absoluten Pfad auf, relativ zum aktuellen Arbeitsverzeichnis.
 * @param {string} filePath - Der aufzulösende Pfad.
 * @returns {string} Der absolute Pfad.
 */
function resolveAbsolutePath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

module.exports = {
  ensureDirExists,
  readJson,
  writeJson,
  resolveAbsolutePath
};
