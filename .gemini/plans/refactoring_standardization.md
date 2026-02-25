# Implementierungsplan: System-Refactoring & Standardisierung

Dieses Modul fokussiert sich auf die interne Qualität der Gemini-Schmiede, um technische Schulden abzubauen und eine saubere Codebasis für die Portabilität zu schaffen.

## Kontext & Ziel
Die Schmiede muss intern die höchsten Standards einhalten (Clean Code, Modul-Trennung, Fehlerbehandlung), bevor sie als Framework skaliert.

## Schnittstellen & Architektur
- **Module:** Konsolidierung von CJS/ESM (Entscheidung für einen Standard).
- **Fehlerbehandlung:** Zentralisierung des Error-Handlings in den Utility-Skripten.
- **Logik-Trennung:** Extraktion von Geschäftslogik aus CLI-Wrappern (z.B. Audit-Logik vs. Audit-CLI).

## Implementierungsschritte (Checkliste)

- [x] Schritt 1: Code-Audit der bestehenden Skripte (`run_audit.cjs`, `logger.js`, `checkpoint_manager.js`) gegen `.gemini/docs/architecture_standards.md`.
- [x] Schritt 2: Vereinheitlichung des Modulsystems. Umstellung aller Skripte auf einen konsistenten Standard (z.B. konsequentes CommonJS für maximale Kompatibilität in Node-Umgebungen).
- [x] Schritt 3: Extraktion von Hilfsfunktionen. Gemeinsame Logik (Pfad-Auflösung, File-Reading) in ein neues Verzeichnis `.gemini/utils/core/` auslagern.
- [x] Schritt 4: Implementierung eines einheitlichen Error-Handling-Patterns. Alle Skripte nutzen den zentralen Logger für Fehlermeldungen und geben korrekte Exit-Codes zurück.
- [x] Schritt 5: Dokumentations-Update. JSDoc-Kommentare für alle Funktionen in den Utility-Skripten hinzufügen.

## Test-Strategie
1. **Regressionstest:** Alle bestehenden Workflows (Plan erstellen -> Audit -> Checkpoint) müssen nach dem Refactoring noch funktionieren.
2. **Linting:** Einführung eines strikten Linting-Regelsatzes für die `.gemini/utils/`.

## Checkpoint-Info
Plan für das interne Refactoring erstellt. Dies ist die Voraussetzung für eine saubere Portabilität.
