/**
 * @file test_token_guardian.cjs
 * @description Unit-Test für den portierten Token-Guardian (v2.0.0).
 */
'use strict';

const path = require('path');
const fs = require('fs');
const tokenGuardian = require('../.gemini/utils/token_guardian');
const logger = require('../.gemini/utils/logger').withContext('TEST-TOKEN');

async function runTest() {
  logger.info('Starte Unit-Test: Token-Guardian...');

  try {
    // 1. Test: Token-Schätzung
    const text = 'Hallo Welt'; // 10 Zeichen -> ca. 3 Token (10/4 aufgerundet)
    const tokens = tokenGuardian.estimateTokens(text);
    if (tokens === 3) {
      logger.info('[PASS] Token-Schätzung korrekt (10 Zeichen -> 3 Token)');
    } else {
      throw new Error(`Token-Schätzung falsch: Erwartet 3, erhalten ${tokens}`);
    }

    // 2. Test: Dateigrößen-Validierung (Existierende Datei)
    const selfCheck = tokenGuardian.checkFile('.gemini/utils/token_guardian.js');
    if (selfCheck) {
      logger.info('[PASS] Selbst-Validierung erfolgreich');
    } else {
      throw new Error('Selbst-Validierung fehlgeschlagen');
    }

    // 3. Test: Token-Limit Check
    const smallText = 'Kurzer Text';
    if (tokenGuardian.checkTokenLimit(smallText)) {
      logger.info('[PASS] Token-Limit Check (unter Limit) erfolgreich');
    } else {
      throw new Error('Token-Limit Check fälschlicherweise negativ');
    }

    // 4. Test: Überdimensionale Datei (Simuliert)
    const giantFilePath = path.join(__dirname, 'giant_test.txt');
    fs.writeFileSync(giantFilePath, 'A'.repeat(1024 * 600)); // 600 KB (> 512 KB Default)
    
    const giantCheck = tokenGuardian.validateFileSize(giantFilePath);
    if (!giantCheck) {
      logger.info('[PASS] Größen-Limit Erkennung korrekt (> 512 KB blockiert)');
    } else {
      fs.unlinkSync(giantFilePath);
      throw new Error('Größen-Limit Erkennung fehlgeschlagen (zu große Datei wurde akzeptiert)');
    }
    fs.unlinkSync(giantFilePath);

    logger.info('====================================');
    logger.info('TOKEN-GUARDIAN TEST: PASSED');
    logger.info('====================================');
    process.exit(0);
  } catch (error) {
    logger.error(`TEST FAILED: ${error.message}`);
    process.exit(1);
  }
}

runTest();
