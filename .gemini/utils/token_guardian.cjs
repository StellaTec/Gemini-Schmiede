/**
 * @file token_guardian.cjs
 * @description Utility zur Überwachung der Token-Nutzung und Dateigrößen, um Context-Bloat zu vermeiden.
 * @author Gemini CLI
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger.cjs');

/**
 * TokenGuardian Klasse zum Schutz vor übermäßigem Token-Verbrauch.
 */
class TokenGuardian {
  /**
   * Erstellt eine neue TokenGuardian-Instanz.
   */
  constructor() {
    this.logger = logger.withContext('TOKEN-GUARDIAN');
    this.config = {
      max_file_size_kb: 512,
      token_warning_threshold: 100000
    };
    this.loadConfig();
  }

  /**
   * Lädt die Sicherheitskonfiguration aus der gemini.config.json.
   */
  loadConfig() {
    const configPath = path.join(__dirname, '../../gemini.config.json');
    try {
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        const configData = JSON.parse(configFile);
        if (configData.security) {
          this.config = { ...this.config, ...configData.security };
          this.logger.debug('Sicherheitskonfiguration erfolgreich geladen.');
        }
      }
    } catch (error) {
      this.logger.error(`Fehler beim Laden der Konfiguration von ${configPath}: ${error.message}`);
    }
  }

  /**
   * Prüft eine Datei gegen die konfigurierten Sicherheitsrichtlinien.
   * 
   * @param {string} filePath - Der Pfad zur zu prüfenden Datei.
   * @returns {boolean} true, wenn die Datei den Richtlinien entspricht, sonst false.
   */
  checkFile(filePath) {
    return this.validateFileSize(filePath, this.config.max_file_size_kb);
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
   * @param {number} [maxSizeKb=512] - Die maximale Größe in Kilobytes.
   * @returns {boolean} true, wenn die Datei existiert und innerhalb des Limits liegt, sonst false.
   */
  validateFileSize(filePath, maxSizeKb = 512) {
    try {
      if (!fs.existsSync(filePath)) {
        this.logger.error(`Datei nicht gefunden: ${filePath}`);
        return false;
      }

      const stats = fs.statSync(filePath);
      const fileSizeInKb = stats.size / 1024;

      if (fileSizeInKb > maxSizeKb) {
        this.logger.warn(
          `Datei überschreitet Größenbeschränkung: ${filePath} (${fileSizeInKb.toFixed(2)} KB > ${maxSizeKb} KB)`
        );
        return false;
      }

      this.logger.debug(`Datei validiert: ${filePath} (${fileSizeInKb.toFixed(2)} KB)`);
      return true;
    } catch (error) {
      this.logger.error(`Fehler bei der Validierung der Dateigröße für ${filePath}: ${error.message}`);
      return false;
    }
  }
}

// Exportiere eine Instanz der Klasse
module.exports = new TokenGuardian();
