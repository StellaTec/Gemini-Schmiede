# Plan: Implementierung des isolierten Audit-Prozesses (run_audit.cjs)

## Kontext & Ziel
Vermeidung von Kontext-Bloat durch die Auslagerung des Qualitäts-Audits in eine separate Gemini-Instanz.

## Schnittstellen & Architektur
- **Neues Tool:** `.gemini/utils/run_audit.cjs`.
- **Abhängigkeiten:** `gemini-cli`, `.gemini/utils/logger.js`, `.gemini/utils/checkpoint_manager.js`.
- **Input:** Die Liste der in diesem Schritt geänderten Dateien.
- **Output:** Audit-Report in `system.log` und Exit-Code für den Boss.

## Implementierungsschritte (Checkliste)
- [x] Schritt 1: Erstellung des Audit-Runners `.gemini/utils/run_audit.cjs`.
- [x] Schritt 2: Den Boss-Agenten in `GEMINI.md` anweisen, dieses Tool nach jedem Implementierungsschritt zu triggern.
- [x] Schritt 3: Aktualisierung der `SKILL.md` des `quality-inspector`, um die Rückgabe des korrekten Exit-Codes sicherzustellen.
- [x] Schritt 4: Testlauf: Der Boss startet ein Audit in einem neuen Fenster, um die Trennung zu verifizieren.

## Test-Strategie
- **Verifikation:** Manueller Check, ob nach einem `node .gemini/utils/run_audit.cjs tests/good_code_demo.js` eine neue Gemini-Instanz im Terminal (oder Hintergrund) gestartet wird.
- **Validierung:** Prüfung, ob das Ergebnis (PASSED/FAILED) korrekt vom Haupt-Agenten erkannt und im Log persistiert wird.

## Checkpoint-Info
Architektur unter `.gemini/docs/architecture_isolated_audit.md` erstellt. Nächster Schritt: Implementierung des Audit-Runners.
