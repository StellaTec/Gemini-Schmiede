# Architektur: Logger-Integration & Workflow-Automatisierung

## Zielsetzung
Definition eines Standards für die Nutzung des `logger.js`-Moduls durch alle Agenten und Skills. Sicherstellung, dass jede bedeutende Aktion (Planung, Ausführung, Validierung) automatisch in `.gemini/logs/system.log` protokolliert wird.

## Integrations-Strategie
1. **Boss-Logging (Orchestrierung):** Der Haupt-Agent (Boss) nutzt den Logger, um Tool-Aufrufe (`run_shell_command`, `write_file`) zu markieren.
2. **Skill-Logging:** Jeder Skill (wie der `planning-agent`) erhält in seiner `SKILL.md` die Anweisung, bei Start und Abschluss einer Aufgabe einen Log-Eintrag zu erzeugen.
3. **Kontext-Standard:** Nutzung von `logger.withContext('SKILL_NAME')`, um die Herkunft der Log-Meldungen im Multi-Agenten-System sofort identifizierbar zu machen.

## Log-Format-Beispiel (Erwarteter Output)
`[2026-02-25T22:15:00.000Z] [INFO] [PLANNER] - Starte Planung für Feature: Logger-Integration`
`[2026-02-25T22:15:05.000Z] [DEBUG] [BOSS] - Ausführung von write_file in .gemini/docs/integration.md`
`[2026-02-25T22:15:10.000Z] [INFO] [PLANNER] - Planung abgeschlossen. Datei gespeichert in plans/integration_logger.md`

## Regeln für Agenten
- Jede Fehlermeldung (`stderr`) muss als `ERROR` geloggt werden.
- Jede erfolgreiche Datei-Operation muss als `INFO` geloggt werden.
- Komplexe Analysen des `codebase_investigator` sollen als `DEBUG` geloggt werden.
