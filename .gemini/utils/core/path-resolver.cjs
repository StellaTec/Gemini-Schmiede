/**
 * @file path-resolver.cjs
 * @description Dynamische Pfadaufloesung relativ zum Projekt-Root.
 *              Findet das Projekt-Root durch Traversierung des Dateisystems.
 *              Kein Abhaengigkeit von anderen internen Modulen (Foundation-Level).
 * @module core/path-resolver
 */
'use strict';

const fs   = require('fs');
const path = require('path');

/** @type {string|null} Gecachter Projekt-Root-Pfad */
let _projectRoot = null;

/**
 * Dateien, die das Projekt-Root eindeutig identifizieren.
 * Reihenfolge: spezifischste Datei zuerst.
 * @type {string[]}
 */
const ROOT_ANCHORS = ['gemini.config.json', 'GEMINI.md', 'package.json'];

/**
 * Findet den Projekt-Root durch Traversierung nach oben vom CWD.
 * Gibt CWD zurueck als sicheren Fallback wenn kein Anker gefunden.
 * @returns {string} Absoluter Pfad zum Projekt-Root
 */
function getProjectRoot() {
  if (_projectRoot) return _projectRoot;

  let dir = process.cwd();
  const MAX_DEPTH = 15;

  for (let i = 0; i < MAX_DEPTH; i++) {
    const hasAnchor = ROOT_ANCHORS.some(f => fs.existsSync(path.join(dir, f)));
    if (hasAnchor) {
      _projectRoot = dir;
      return _projectRoot;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // Filesystem-Root erreicht
    dir = parent;
  }

  // Sicherer Fallback: aktuelles Arbeitsverzeichnis
  _projectRoot = process.cwd();
  return _projectRoot;
}

/**
 * Loest einen Pfad relativ zum Projekt-Root auf.
 * @param {...string} segments - Pfad-Segmente die verbunden werden
 * @returns {string} Absoluter Pfad
 */
function resolve(...segments) {
  return path.join(getProjectRoot(), ...segments);
}

/**
 * Stellt sicher, dass ein Verzeichnis existiert. Erstellt es rekursiv wenn noetig.
 * @param {string} dirPath - Absoluter Pfad zum Verzeichnis
 * @returns {boolean} true wenn Verzeichnis nach dem Aufruf existiert
 */
function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Resettet den gecachten Root-Pfad.
 * Primaer fuer Unit-Tests gedacht.
 */
function resetCache() {
  _projectRoot = null;
}

module.exports = { getProjectRoot, resolve, ensureDir, resetCache };
