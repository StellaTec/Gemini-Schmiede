/**
 * @file token_guardian.js
 * @description Utility zur Überwachung der Token-Nutzung und Dateigrößen, um Context-Bloat zu vermeiden.
 *              Portiert von v1.0.0 (CJS) auf v2.0.0 (Modern JS/CJS).
 *              Nutzt den zentralen v2-Logger und die gemini.config.json.
 *
 * @module utils/token_guardian
 */
'use strict';

const fs     = require('fs');
const path   = require('path');
const logger = require('./logger').withContext('TOKEN-GUARDIAN');

/**
 * TokenGuardian Klasse zum Schutz vor übermäßigem Token-Verbrauch.
 */
class TokenGuardian {
  /**
   * Erstellt eine neue TokenGuardian-Instanz.
   */
  constructor() {
    this.config = this._loadConfig();
  }

  /**
   * Lädt die Sicherheitskonfiguration aus der gemini.config.json.
   * @private
   * @returns {Object} Die geladene oder Standard-Konfiguration.
   */
  _loadConfig() {
    const defaults = {
      maxFileSizeKb:        512,
      tokenWarningThreshold: 100000
    };

    try {
      const configPath = path.join(process.cwd(), 'gemini.config.json');
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const configData = JSON.parse(configFile);
        if (configData.security) {
          logger.debug('Sicherheitskonfiguration erfolgreich geladen.');
          return {
            maxFileSizeKb:         configData.security.maxFileSizeKb         ?? defaults.maxFileSizeKb,
            tokenWarningThreshold: configData.security.tokenWarningThreshold ?? defaults.tokenWarningThreshold
          };
        }
      }
    } catch (error) {
      logger.error(`Fehler beim Laden der Konfiguration: ${error.message}`);
    }

    return defaults;
  }

  /**
   * Prüft eine Datei gegen die konfigurierten Sicherheitsrichtlinien.
   * 
   * @param {string} filePath - Der Pfad zur zu prüfenden Datei.
   * @returns {boolean} true, wenn die Datei den Richtlinien entspricht, sonst false.
   */
  checkFile(filePath) {
    return this.validateFileSize(filePath, this.config.maxFileSizeKb);
  }

  /**
   * Schätzt die Anzahl der Token für einen gegebenen Text.
   * Heuristik: 1 Token entspricht etwa 4 Zeichen.
   * 
   * @param {string} text - Der zu schätzende Text.
   * @returns {number} Die geschätzte Anzahl der Token.
   */
  estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Prüft, ob eine Datei die maximale erlaubte Größe überschreitet.
   * 
   * @param {string} filePath - Der Pfad zur zu prüfenden Datei.
   * @param {number} [maxSizeKb] - Die maximale Größe in Kilobytes (optional, nutzt sonst Config).
   * @returns {boolean} true, wenn die Datei existiert und innerhalb des Limits liegt, sonst false.
   */
  validateFileSize(filePath, maxSizeKb) {
    const limit = maxSizeKb || this.config.maxFileSizeKb;
    
    try {
      if (!fs.existsSync(filePath)) {
        logger.error(`Datei nicht gefunden: ${filePath}`);
        return false;
      }

      const stats = fs.statSync(filePath);
      const fileSizeInKb = stats.size / 1024;

      if (fileSizeInKb > limit) {
        logger.warn(
          `Datei überschreitet Größenbeschränkung: ${path.basename(filePath)} ` +
          `(${fileSizeInKb.toFixed(2)} KB > ${limit} KB)`
        );
        return false;
      }

      logger.debug(`Datei validiert: ${path.basename(filePath)} (${fileSizeInKb.toFixed(2)} KB)`);
      return true;
    } catch (error) {
      logger.error(`Fehler bei der Validierung der Dateigröße für ${filePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Prüft den geschätzten Token-Verbrauch eines Textes gegen den Schwellenwert.
   * 
   * @param {string} text - Der zu prüfende Text.
   * @returns {boolean} true, wenn unter dem Schwellenwert, sonst false.
   */
  checkTokenLimit(text) {
    const tokens = this.estimateTokens(text);
    if (tokens > this.config.tokenWarningThreshold) {
      logger.warn(`Token-Warnschwelle überschritten: ${tokens} > ${this.config.tokenWarningThreshold}`);
      return false;
    }
    return true;
  }
}

// Singleton-Export
module.exports = new TokenGuardian();
