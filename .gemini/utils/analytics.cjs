/**
 * @file analytics.cjs
 * @description Analytics-Modul zum Tracking von System-Metriken.
 * @author WORKER-V1
 */

const path = require('path');
const logger = require('./logger.cjs').withContext('ANALYTICS');
const { readJson, writeJson } = require('./core/fs_utils.cjs');

const LOGS_DIR = path.join(__dirname, '..', 'logs');
const STATS_FILE = path.join(LOGS_DIR, 'stats.json');

/**
 * Analytics-Modul zum Tracking von System-Metriken.
 */
class Analytics {
  /**
   * Initialisiert die Analytics und stellt sicher, dass die stats.json existiert.
   */
  constructor() {
    this._ensureFileExists();
  }

  /**
   * Stellt sicher, dass das Verzeichnis und die stats.json Datei existieren.
   * @private
   */
  _ensureFileExists() {
    try {
      const data = readJson(STATS_FILE, null);
      if (data === null) {
        logger.info(`Initialisiere stats.json: ${STATS_FILE}`);
        writeJson(STATS_FILE, { 'ai_agent_calls': 0 });
      }
    } catch (err) {
      logger.error(`Fehler bei Verzeichnis-/Datei-Prüfung: ${err.message}`);
    }
  }

  /**
   * Erhöht den Wert eines Schlüssels in der stats.json um 1.
   * @param {string} key - Der zu erhöhende Schlüssel (z.B. 'ai_agent_calls').
   */
  incrementStat(key) {
    try {
      const data = readJson(STATS_FILE, { 'ai_agent_calls': 0 });
      
      if (typeof data[key] === 'undefined') {
        data[key] = 0;
      }

      data[key]++;
      writeJson(STATS_FILE, data);
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
   * @returns {Object} Die aktuellen Metriken aus der stats.json.
   */
  getStats() {
    try {
      return readJson(STATS_FILE, { 'ai_agent_calls': 0 });
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
