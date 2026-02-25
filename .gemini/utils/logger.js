const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'system.log');

class Logger {
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
   * @param {string} level - Log-Level (DEBUG, INFO, etc.)
   * @param {string} message - Die zu loggende Nachricht
   * @param {string} [context] - Optionaler Kontext-String
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
      fs.appendFileSync(LOG_FILE, formattedMessage + '\n', 'utf8');
    } catch (err) {
      console.error(`Logger Error: Konnte nicht in Datei schreiben: ${err.message}`);
    }
  }

  debug(message, context) { this._log(this.levels.DEBUG, message, context); }
  info(message, context) { this._log(this.levels.INFO, message, context); }
  warn(message, context) { this._log(this.levels.WARN, message, context); }
  error(message, context) { this._log(this.levels.ERROR, message, context); }

  /**
   * Erstellt eine neue Logger-Instanz mit einem spezifischen Kontext.
   * @param {string} context 
   * @returns {Logger}
   */
  withContext(context) {
    return new Logger(context);
  }
}

// Export als Singleton für den Standard-Gebrauch
module.exports = new Logger();
