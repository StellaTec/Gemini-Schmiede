const fs = require('fs');
const path = require('path');
const logger = require('./logger').withContext('ANALYTICS');

const LOGS_DIR = path.join(__dirname, '..', 'logs');
const STATS_FILE = path.join(LOGS_DIR, 'stats.json');

/**
 * Analytics-Modul zum Tracking von System-Metriken.
 * Exportiert als Singleton.
 */
class Analytics {
  constructor() {
    this._ensureFileExists();
  }

  /**
   * Stellt sicher, dass das Verzeichnis und die stats.json Datei existieren.
   * @private
   */
  _ensureFileExists() {
    try {
      if (!fs.existsSync(LOGS_DIR)) {
        logger.info(`Erstelle Logs-Verzeichnis: ${LOGS_DIR}`);
        fs.mkdirSync(LOGS_DIR, { recursive: true });
      }

      if (!fs.existsSync(STATS_FILE)) {
        const initialData = { 'ai_agent_calls': 0 };
        logger.info(`Initialisiere stats.json: ${STATS_FILE}`);
        fs.writeFileSync(STATS_FILE, JSON.stringify(initialData, null, 2), 'utf8');
      }
    } catch (err) {
      logger.error(`Fehler bei Verzeichnis-/Datei-Prüfung: ${err.message}`);
    }
  }

  /**
   * Erhöht den Wert eines Schlüssels in der stats.json um 1.
   * @param {string} key - Der zu erhöhende Schlüssel (z.B. 'ai_agent_calls')
   */
  incrementStat(key) {
    try {
      this._ensureFileExists();
      const content = fs.readFileSync(STATS_FILE, 'utf8');
      const data = JSON.parse(content);
      
      if (typeof data[key] === 'undefined') {
        data[key] = 0;
      }
      
      data[key]++;
      fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), 'utf8');
      logger.debug(`Statistik '${key}' auf ${data[key]} erhöht.`);
    } catch (err) {
      logger.error(`Fehler beim Erhöhen der Statistik '${key}': ${err.message}`);
    }
  }

  /**
   * Erhöht speziell den Zähler für KI-Agenten-Aufrufe.
   */
  incrementAgentCount() {
    this.incrementStat('ai_agent_calls');
  }

  /**
   * Gibt die aktuellen Statistiken zurück.
   * @returns {Object} Die aktuellen Metriken aus der stats.json
   */
  getStats() {
    try {
      this._ensureFileExists();
      const content = fs.readFileSync(STATS_FILE, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      logger.error(`Fehler beim Abrufen der Statistiken: ${err.message}`);
      return {};
    }
  }
}

const analytics = new Analytics();

module.exports = {
  incrementAgentCount: () => analytics.incrementAgentCount(),
  incrementStat: (key) => analytics.incrementStat(key),
  getStats: () => analytics.getStats()
};
