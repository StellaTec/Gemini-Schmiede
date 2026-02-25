/**
 * @file logger.cjs
 * @description Zentrales Logging-Modul für die Gemini-Schmiede. Unterstützt Konsole und Datei-Ausgabe.
 * @author WORKER-V1
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'system.log');

/**
 * Logger Klasse für strukturiertes Logging.
 */
class Logger {
  /**
   * Erstellt eine neue Logger-Instanz.
   * @param {string} [context='SYSTEM'] - Der Kontext des Loggers.
   */
  constructor(context = 'SYSTEM') {
    this.context = context;
    this.levels = {
      DEBUG: 'DEBUG',
      INFO: 'INFO',
      WARN: 'WARN',
      ERROR: 'ERROR'
    };
  }

  /**
   * Kern-Methode zum Schreiben von Logs.
   * @param {string} level - Log-Level (DEBUG, INFO, WARN, ERROR).
   * @param {string} message - Die zu loggende Nachricht.
   * @param {string} [context] - Optionaler Kontext-String, überschreibt den Instanz-Kontext.
   * @private
   */
  _log(level, message, context = this.context) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] [${context}] - ${message}`;

    // Konsole-Ausgabe
    if (level === this.levels.ERROR) {
      console.error(formattedMessage);
    } else if (level === this.levels.WARN) {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }

    // Datei-Ausgabe (Synchron, um Datenverlust bei Abstürzen zu minimieren)
    try {
      const logsDir = path.dirname(LOG_FILE);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      fs.appendFileSync(LOG_FILE, formattedMessage + '\n', 'utf8');
    } catch (err) {
      console.error(`Logger Error: Konnte nicht in Datei schreiben: ${err.message}`);
    }
  }

  /**
   * Loggt eine Debug-Nachricht.
   * @param {string} message 
   * @param {string} [context] 
   */
  debug(message, context) { this._log(this.levels.DEBUG, message, context); }

  /**
   * Loggt eine Info-Nachricht.
   * @param {string} message 
   * @param {string} [context] 
   */
  info(message, context) { this._log(this.levels.INFO, message, context); }

  /**
   * Loggt eine Warnung.
   * @param {string} message 
   * @param {string} [context] 
   */
  warn(message, context) { this._log(this.levels.WARN, message, context); }

  /**
   * Loggt einen Fehler.
   * @param {string} message 
   * @param {string} [context] 
   */
  error(message, context) { this._log(this.levels.ERROR, message, context); }

  /**
   * Erstellt eine neue Logger-Instanz mit einem spezifischen Kontext.
   * @param {string} context - Der neue Kontext.
   * @returns {Logger} Eine neue Logger-Instanz.
   */
  withContext(context) {
    return new Logger(context);
  }
}

// Export als Singleton für den Standard-Gebrauch
module.exports = new Logger();
module.exports.Logger = Logger; // Export der Klasse für Typprüfungen oder Subklassen
