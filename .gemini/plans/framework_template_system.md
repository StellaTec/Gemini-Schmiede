# Plan: Framework-Template-System

## Kontext & Ziel
Ziel ist die Bereitstellung eines sauberen "Gemini-Schmiede" Templates, das nur den Framework-Kern (Utils, Skills, Config, GEMINI.md) enthält, ohne projektspezifische Pläne oder Logs. Dies ermöglicht den schnellen Start neuer Projekte.

## Schnittstellen & Architektur
- **Git-Integration:** Nutzung eines `template/v2` Branches.
- **Export-Skript:** Ein neues Utility `.gemini/utils/core/export_template.js`.
- **System-Map:** Zurücksetzen der Roadmap im Template.

## Implementierungsschritte
- [x] Schritt 1: Erstellen des Branches `template/v2` ausgehend vom aktuellen Stand.
- [x] Schritt 2: Bereinigung des Branches (Löschen von `.gemini/plans/*.md`, außer Vorlagen).
- [x] Schritt 3: Leeren der Logs in `.gemini/logs/` und Zurücksetzen der `system_map.md`.
- [ ] Schritt 4: Implementierung von `.gemini/utils/core/export_template.js` zum automatisierten Export des Kerns.
- [x] Schritt 5: Dokumentation des "New Project" Workflows in `docs/template_usage.md`.

## Test-Strategie
- Verifizierung, dass der Branch `template/v2` keine alten Pläne enthält.
- Testlauf des Export-Skripts in ein temporäres Verzeichnis.
- Validierung der `system_map.md` Struktur im Template.

## Checkpoint-Info
Status: Planung abgeschlossen. Bereit für Schritt 1 (Branch-Erstellung).
