/**
 * @file logger.js
 * @description Zentraler Logger fuer alle Agenten und Utilities.
 *              Schreibt synchron in Konsole UND Logfile (Crash-sicher).
 *              Unterstuetzt Log-Level-Filterung via LOG_LEVEL Umgebungsvariable.
 *              Singleton-Export mit withContext() fuer kontextuelles Logging.
 *
 * @usage
 *   const logger = require('.gemini/utils/logger').withContext('MEIN-AGENT');
 *   logger.info('Starte Verarbeitung...');
 *   logger.error('Kritischer Fehler: ' + err.message);
 *
 * @module utils/logger
 */
'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

/**
 * Log-Level Definitionen (aufsteigend nach Schwere).
 * @type {Readonly<Object>}
 */
const LOG_LEVELS = Object.freeze({
  DEBUG: 0,
  INFO:  1,
  WARN:  2,
  ERROR: 3,
});

/** Aktiver Mindest-Level (ENV: LOG_LEVEL=DEBUG|INFO|WARN|ERROR) */
const ACTIVE_LEVEL = _resolveActiveLevel(process.env.LOG_LEVEL || 'INFO');

/** Absoluter Pfad zur Log-Datei (relativ zu diesem Modul: .gemini/utils -> .gemini/logs) */
const LOG_FILE = path.join(__dirname, '..', 'logs', 'system.log');

// ---------------------------------------------------------------------------
// Private Hilfsfunktionen
// ---------------------------------------------------------------------------

/**
 * Loest den numerischen Level-Wert aus einem Level-String auf.
 * @param {string} levelStr
 * @returns {number} Numerischer Wert (Fallback: INFO)
 * @private
 */
function _resolveActiveLevel(levelStr) {
  const val = LOG_LEVELS[String(levelStr).toUpperCase()];
  return typeof val === 'number' ? val : LOG_LEVELS.INFO;
}

/**
 * Stellt sicher, dass das Log-Verzeichnis existiert.
 * Wird einmalig beim Modulstart ausgefuehrt.
 * @private
 */
function _ensureLogDir() {
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Nicht loggbar - Logger ist noch nicht bereit
  }
}

_ensureLogDir();

// ---------------------------------------------------------------------------
// Logger-Klasse
// ---------------------------------------------------------------------------

/**
 * Logger mit Kontext-Unterstuetzung.
 * Instanzen werden via withContext() erstellt.
 */
class Logger {
  /**
   * @param {string} [context='SYSTEM'] - Kontext-Label fuer alle Log-Eintraege
   */
  constructor(context = 'SYSTEM') {
    this.context = context;
  }

  /**
   * Kern-Methode: Formatiert und schreibt einen Log-Eintrag.
   * Schreibt auf stderr (WARN/ERROR) oder stdout (DEBUG/INFO).
   * Appended synchron in die Log-Datei fuer Crash-Sicherheit.
   *
   * @param {string} level   - Log-Level (DEBUG|INFO|WARN|ERROR)
   * @param {string} message - Log-Nachricht
   * @private
   */
  _log(level, message) {
    const levelValue = LOG_LEVELS[level];
    if (levelValue === undefined || levelValue < ACTIVE_LEVEL) return;

    const timestamp = new Date().toISOString();
    const line      = `[${timestamp}] [${level.padEnd(5)}] [${this.context}] - ${message}`;

    // Konsole: WARN/ERROR auf stderr, DEBUG/INFO auf stdout
    if (level === 'ERROR' || level === 'WARN') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }

    // Datei: synchron fuer Crash-Sicherheit
    try {
      fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
    } catch {
      // Stumm: verhindert rekursive Fehler im Logger selbst
    }
  }

  /**
   * Loggt eine Debug-Nachricht (nur bei LOG_LEVEL=DEBUG sichtbar).
   * @param {string} message
   */
  debug(message) { this._log('DEBUG', message); }

  /**
   * Loggt eine Informations-Nachricht.
   * @param {string} message
   */
  info(message)  { this._log('INFO',  message); }

  /**
   * Loggt eine Warnmeldung.
   * @param {string} message
   */
  warn(message)  { this._log('WARN',  message); }

  /**
   * Loggt eine Fehlermeldung.
   * @param {string} message
   */
  error(message) { this._log('ERROR', message); }

  /**
   * Erstellt eine neue Logger-Instanz mit eigenem Kontext.
   * Der urspruengliche Singleton bleibt unveraendert.
   *
   * @param {string} context - Neuer Kontext-Label
   * @returns {Logger}
   */
  withContext(context) {
    return new Logger(context);
  }
}

// Singleton-Export: Standard-Kontext 'SYSTEM'
module.exports = new Logger();
