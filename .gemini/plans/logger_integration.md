# Plan: Logger-Integration in alle Agenten-Workflows

## Kontext & Ziel
Etablierung des Loggers als verbindliches Werkzeug für alle Agenten-Interaktionen, um die Nachvollziehbarkeit im Multi-Agenten-System sicherzustellen und Fehlersuche zu vereinfachen.

## Schnittstellen & Architektur
- **Logger Utility:** `.gemini/utils/logger.js`.
- **Anpassungsbereiche:** `GEMINI.md` (Regelwerk) und die `SKILL.md` des `planning-agent`.

## Implementierungsschritte (Checkliste)
- [x] Schritt 1: `GEMINI.md` aktualisieren und die Nutzung des Loggers als Pflicht-Standard festlegen.
- [x] Schritt 2: Den `planning-agent` in seiner `SKILL.md` anweisen, bei jeder Plan-Erstellung einen Log-Eintrag zu schreiben.
- [x] Schritt 3: Ein "Logger-Beispiel-Skript" (`tests/demo_integration.cjs`) erstellen, das zeigt, wie man den Logger in einem Skill importiert und nutzt.
- [x] Schritt 4: Die `system.log` auslesen, um zu verifizieren, dass der neue Standard funktioniert.

## Test-Strategie
- **Verifikation:** Manueller Check der `.gemini/logs/system.log` nach Durchführung von Schritt 3.
- **Validierung:** Sicherstellen, dass die Log-Einträge den Kontext des jeweiligen Agenten (z.B. `[PLANNER]`, `[BOSS]`) korrekt anzeigen.

## Checkpoint-Info
Architektur-Konzept unter `.gemini/docs/logger_integration.md` erstellt. Nächster Schritt: Verbindliche Festlegung des Standards in der `GEMINI.md`.
