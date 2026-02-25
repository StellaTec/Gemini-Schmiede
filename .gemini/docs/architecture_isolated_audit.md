# Architektur: Isolierter Audit-Prozess (run_audit.cjs)

## Zielsetzung
Trennung der Implementierungs-Session von der Qualitätskontrolle. Jedes Audit soll in einer frischen, isolierten Instanz (`gemini --yes`) stattfinden, um den Kontext des Arbeits-Chats sauber zu halten.

## Komponenten-Design
1. **Audit-Runner (`.gemini/utils/run_audit.cjs`):**
   - Ein Node.js-Skript, das eine neue `gemini` Session per Shell-Command startet.
   - Übergibt den Befehl: `"Führe ein Qualitäts-Audit mit dem quality-inspector für die geänderten Dateien aus"`.
   - Überwacht den Exit-Code der neuen Instanz (0 = PASSED, 1 = FAILED).

2. **Isolierte Session:**
   - Lädt nur den `quality-inspector` Skill.
   - Scannt die Architektur-Konformität und das Logging.
   - Protokolliert das Ergebnis in `.gemini/logs/system.log`.

## Workflow-Integration (Der "Boss"-Ablauf)
1. **Act:** Boss schließt Implementierung ab.
2. **Audit:** Boss startet `node .gemini/utils/run_audit.cjs <dateien>`.
3. **Checkpoint:** Nur bei Erfolg (Exit Code 0) wird der `checkpoint_manager.js` aufgerufen.

## Vorteile
- **Kontext-Hygiene:** Der Arbeits-Chat wird nicht durch hunderte Zeilen Analyse-Logs des Inspektors belastet.
- **Fehler-Präzision:** Die neue Instanz hat einen völlig frischen "Geist" und wird nicht durch vorherige Chat-Verläufe beeinflusst.
