const fs = require('fs');
const path = require('path');
const logger = require('./logger.js').withContext('CHECKPOINT');

function markStepComplete(filePath, stepNumber) {
  const absolutePath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    logger.error(`Datei nicht gefunden: ${filePath}`);
    process.exit(1);
  }

  try {
    let content = fs.readFileSync(absolutePath, 'utf8');
    
    // Wir suchen nach "- [ ] Schritt N:"
    // Doppelte Backslashes für den String-Konstruktor, damit im Regex ein einfacher Backslash landet.
    const stepSearchString = "- [ ] Schritt " + stepNumber + ":";
    
    if (!content.includes(stepSearchString)) {
      const completedString = "- [x] Schritt " + stepNumber + ":";
      if (content.includes(completedString)) {
        logger.info(`Schritt ${stepNumber} in ${filePath} ist bereits als abgeschlossen markiert.`);
        return;
      }
      logger.warn(`Schritt ${stepNumber} konnte in ${filePath} nicht gefunden werden (Erwartet: "${stepSearchString}").`);
      return;
    }

    const newContent = content.replace(stepSearchString, "- [x] Schritt " + stepNumber + ":");
    fs.writeFileSync(absolutePath, newContent, 'utf8');
    
    logger.info(`Schritt ${stepNumber} in ${filePath} erfolgreich auf [x] gesetzt.`);
  } catch (err) {
    logger.error(`Fehler beim Aktualisieren von ${filePath}: ${err.message}`);
    process.exit(1);
  }
}

const [,, file, step] = process.argv;
if (file && step) {
  markStepComplete(file, parseInt(step, 10));
} else {
  console.log('Usage: node checkpoint_manager.js <file_path> <step_number>');
}

module.exports = { markStepComplete };
