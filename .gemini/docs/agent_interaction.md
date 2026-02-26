# Standard: Agent-Reporting-Protokoll (ARP)

## Zweck
Erhöhung der Transparenz im Multi-Agenten-System durch explizite Kennzeichnung der handelnden Rollen in der Chat-Ausgabe.

## Rollen-Definitionen
- **[BOSS]**: Koordination, Delegation, Kommunikation mit dem Benutzer, Finales Urteil.
- **[PLANNER]**: Strategie-Entwicklung, Erstellung von `.md` Plänen, Architektur-Reviews.
- **[WORKER]**: Code-Erstellung, Refactoring, Datei-Operationen.
- **[AUDITOR]**: Test-Ausführung, Validierung (`run_audit.cjs`), Qualitäts-Checks.

## Kommunikations-Regeln
1. Jede substanzielle Antwort im Chat muss mit dem Tag des aktuell handelnden Agenten beginnen.
2. Bei Delegationen muss der Wechsel der Rolle explizit markiert werden.
3. Der **Boss** bleibt der Haupt-Ansprechpartner, fasst aber die Berichte der Sub-Agenten unter deren jeweiligen Tags zusammen.

## Beispiel-Workflow
> **[BOSS]** Ich delegiere die Test-Erstellung an den Worker.
> **[WORKER]** Ich habe `tests/new_test.cjs` mit folgendem Inhalt erstellt...
> **[AUDITOR]** Ich habe den Test ausgeführt: PASSED.
