/**
 * @file error-handler.cjs
 * @description Zentrales Error-Handling und Utility-Funktionen fuer robuste Ausfuehrung.
 *              Foundation-Level: Keine Abhaengigkeit von anderen internen Modulen.
 *              Akzeptiert optionale Logger-Instanz fuer kontextuelles Logging.
 * @module core/error-handler
 */
'use strict';

/**
 * Behandelt einen Fehler einheitlich:
 * - Loggt ueber den uebergebenen Logger oder direkt auf stderr
 * - Terminiert den Prozess bei fatalen Fehlern
 *
 * @param {Error|string} err       - Fehler-Objekt oder Fehlermeldung
 * @param {string}       context   - Agent/Modul-Kontext fuer Log-Formatierung
 * @param {boolean}      [fatal=false] - Bei true: process.exit(1) nach Logging
 * @param {Object|null}  [logger=null] - Optionale Logger-Instanz mit .error() Methode
 */
function handleError(err, context, fatal = false, logger = null) {
  const message = err instanceof Error ? err.message : String(err);
  const stack   = err instanceof Error && err.stack ? err.stack : null;

  if (logger && typeof logger.error === 'function') {
    logger.error(message);
    if (stack) logger.error(stack);
  } else {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[${timestamp}] [ERROR] [${context}] - ${message}\n`);
    if (stack) process.stderr.write(`[${timestamp}] [ERROR] [${context}] - ${stack}\n`);
  }

  if (fatal) {
    process.exit(1);
  }
}

/**
 * Wiederholt eine synchrone Funktion mit exponentiellem Backoff (blockierend).
 * Geeignet fuer kritische I/O-Operationen (Datei schreiben, Netzwerk).
 *
 * @param {Function} fn              - Synchrone Funktion (muss bei Fehler exception werfen)
 * @param {number}   [maxRetries=3]  - Maximale Wiederholungsversuche
 * @param {number}   [baseDelayMs=200] - Basis-Verzoegerung in ms (verdoppelt sich pro Versuch)
 * @returns {*} Rueckgabewert der Funktion bei Erfolg
 * @throws {Error} Letzter Fehler wenn alle Versuche scheitern
 */
function withRetrySync(fn, maxRetries = 3, baseDelayMs = 200) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        const end   = Date.now() + delay;
        while (Date.now() < end) { /* synchrones Warten */ }
      }
    }
  }
  throw lastError;
}

/**
 * Validiert, dass ein Pflicht-Parameter vorhanden und nicht leer ist.
 *
 * @param {*}      value - Zu pruefender Wert
 * @param {string} name  - Parameter-Name fuer die Fehlermeldung
 * @throws {Error} Wenn Wert null, undefined oder leerer String ist
 */
function validateRequired(value, name) {
  if (value === null || value === undefined || value === '') {
    throw new Error(`Pflicht-Parameter '${name}' fehlt oder ist leer.`);
  }
}

/**
 * Parst einen JSON-String sicher. Gibt Fallback zurueck bei Parse-Fehler.
 *
 * @param {string} jsonString    - Zu parsender JSON-String
 * @param {*}      [fallback=null] - Rueckgabewert bei Parse-Fehler
 * @returns {*} Geparstes Objekt oder Fallback-Wert
 */
function safeJsonParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Fuehrt eine Funktion aus und gibt Fallback zurueck bei beliebigem Fehler.
 * Nuetzlich fuer optionale Operationen die das Programm nicht stoppen sollen.
 *
 * @param {Function} fn             - Auszufuehrende Funktion
 * @param {*}        [fallback=null] - Rueckgabewert bei Fehler
 * @returns {*} Ergebnis der Funktion oder Fallback-Wert
 */
function safeExecute(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

module.exports = {
  handleError,
  withRetrySync,
  validateRequired,
  safeJsonParse,
  safeExecute,
};
