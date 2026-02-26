/**
 * @file analytics.js
 * @description System-Metriken-Tracker fuer Agenten-Aufrufe und benutzerdefinierte Statistiken.
 *              Liest Pfad-Konfiguration aus gemini.config.json (Fallback auf Default).
 *              Singleton-Export mit atomaren Schreiboperationen.
 *
 * @usage
 *   const analytics = require('.gemini/utils/analytics');
 *   analytics.incrementAgentCount();
 *   const stats = analytics.getStats();
 *
 * @module utils/analytics
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const logger = require('./logger').withContext('ANALYTICS');

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

/** Pfad zur Stats-Datei (konfigurierbar via gemini.config.json) */
const STATS_FILE = _resolveStatsFile();
const LOGS_DIR   = path.dirname(STATS_FILE);

/**
 * Loest den absoluten Pfad zur stats.json auf.
 * Liest aus gemini.config.json wenn vorhanden, sonst Default.
 * @returns {string}
 * @private
 */
function _resolveStatsFile() {
  try {
    const configPath = path.join(process.cwd(), 'gemini.config.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.analytics && cfg.analytics.statsFile) {
        return path.join(process.cwd(), cfg.analytics.statsFile);
      }
    }
  } catch {
    // Fallback
  }
  return path.join(__dirname, '..', 'logs', 'stats.json');
}

// ---------------------------------------------------------------------------
// Analytics-Klasse
// ---------------------------------------------------------------------------

/**
 * Analytics-Modul zum Tracking von System-Metriken.
 * Alle Operationen sind idempotent und fehlerbehandelt.
 */
class Analytics {
  constructor() {
    this._ensureFileExists();
  }

  /**
   * Stellt sicher, dass Logs-Verzeichnis und stats.json existieren.
   * Idempotent: sicher mehrfach aufrufbar.
   * @private
   */
  _ensureFileExists() {
    try {
      if (!fs.existsSync(LOGS_DIR)) {
        logger.info(`Erstelle Logs-Verzeichnis: ${LOGS_DIR}`);
        fs.mkdirSync(LOGS_DIR, { recursive: true });
      }
      if (!fs.existsSync(STATS_FILE)) {
        logger.info(`Initialisiere stats.json: ${STATS_FILE}`);
        fs.writeFileSync(
          STATS_FILE,
          JSON.stringify({ ai_agent_calls: 0 }, null, 2),
          'utf8'
        );
      }
    } catch (err) {
      logger.error(`Fehler bei Datei-Initialisierung: ${err.message}`);
    }
  }

  /**
   * Liest die aktuellen Stats sicher aus der Datei.
   * @returns {Object} Stats-Objekt (leer bei Fehler)
   * @private
   */
  _readStats() {
    try {
      this._ensureFileExists();
      return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    } catch (err) {
      logger.error(`Fehler beim Lesen der Stats: ${err.message}`);
      return {};
    }
  }

  /**
   * Schreibt Stats-Objekt in die Datei (atomare Operation via tmpfile).
   * @param {Object} data - Zu schreibendes Stats-Objekt
   * @private
   */
  _writeStats(data) {
    const tmpFile = STATS_FILE + '.tmp';
    try {
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmpFile, STATS_FILE);
    } catch (err) {
      logger.error(`Fehler beim Schreiben der Stats: ${err.message}`);
      // Aufraumen falls tmp-Datei existiert
      try { fs.unlinkSync(tmpFile); } catch { /* ignorieren */ }
    }
  }

  /**
   * Erhoeht den Wert eines beliebigen Schluessels in der stats.json um 1.
   * Erstellt den Schluessel automatisch wenn er nicht existiert.
   *
   * @param {string} key - Schluessel (z.B. 'ai_agent_calls', 'test_runs')
   */
  incrementStat(key) {
    if (!key || typeof key !== 'string') {
      logger.error('incrementStat: key muss ein nicht-leerer String sein.');
      return;
    }
    const data    = this._readStats();
    data[key]     = (typeof data[key] === 'number' ? data[key] : 0) + 1;
    this._writeStats(data);
    logger.debug(`Statistik '${key}' erhoeht auf ${data[key]}.`);
  }

  /**
   * Erhoeht den KI-Agenten-Aufrufzaehler.
   * Shorthand fuer incrementStat('ai_agent_calls').
   */
  incrementAgentCount() {
    this.incrementStat('ai_agent_calls');
  }

  /**
   * Gibt alle aktuellen Statistiken zurueck.
   * @returns {Object} Stats-Objekt aus stats.json
   */
  getStats() {
    return this._readStats();
  }
}

// Singleton-Instanz
const _instance = new Analytics();

module.exports = {
  incrementAgentCount: ()      => _instance.incrementAgentCount(),
  incrementStat:       (key)   => _instance.incrementStat(key),
  getStats:            ()      => _instance.getStats(),
};
