# Plan: Implementierung des Auto-Checkpointing Features

## Kontext & Ziel
Entwicklung eines automatisierten Systems, das den Fortschritt in den Markdown-Plänen eigenständig markiert. Dies stellt sicher, dass der Projektstatus jederzeit im Dateisystem aktuell ist.

## Schnittstellen & Architektur
- **Zentrales Werkzeug:** `.gemini/utils/checkpoint_manager.js`.
- **Abhängigkeiten:** Node.js `fs`, `path`, `.gemini/utils/logger.js`.
- **Input:** Plan-Datei-Pfad, Schritt-Nummer oder Textfragment.
- **Output:** Aktualisierte Markdown-Datei und Log-Eintrag.

## Implementierungsschritte (Checkliste)
- [x] Schritt 1: Erstellung des Hilfsskripts `.gemini/utils/checkpoint_manager.js` zur Markdown-Manipulation.
- [x] Schritt 2: Den Boss-Agenten in `GEMINI.md` anweisen, den `checkpoint_manager` nach einem erfolgreichen `quality-inspector` Audit aufzurufen.
- [x] Schritt 3: Den `planning-agent` in seiner `SKILL.md` anweisen, die Nutzung des Auto-Checkpointing im Planungs-Workflow zu erwähnen.
- [x] Schritt 4: Testlauf des Features: Ein Test-Schritt in einem Plan wird erstellt, vom Inspektor geprüft und automatisch abgehakt.

## Test-Strategie
- **Unit-Test:** `node .gemini/utils/checkpoint_manager.js test_plan.md 1` muss die erste Checkbox in `test_plan.md` auf `[x]` setzen.
- **End-to-End:** Durchführung eines kompletten Zyklus (Act -> Review -> Checkpoint) in einem Test-Szenario.

## Checkpoint-Info
Konzept unter `.gemini/docs/architecture_auto_checkpointing.md` gespeichert. Die Planung für das Auto-Checkpointing ist abgeschlossen. Nächster Schritt: Implementierung des Checkpoint-Managers.
