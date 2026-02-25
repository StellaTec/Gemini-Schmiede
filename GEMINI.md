# Projekt: Gemini-Schmiede (Agentic Workflow)

## Zentrale Mission
Entwicklung eines hochstrukturierten Multi-Agenten-Systems, bei dem Planung (Planning-Agent), Validierung (Code-Agent) und Ausführung (Boss/Koordinator) strikt getrennt sind, um fehlerfreie Ergebnisse in isolierten Kontexten zu garantieren.

## Architektur-Prinzipien (Strenge Regeln)
- **Persistenz-Zwang:** Kein Plan darf nur im Chat existieren. Alle Konzepte müssen in `.gemini/docs/` und alle Pläne in `.gemini/plans/` gespeichert werden.
- **Kontext-Hygiene:** Jeder neue Chat-Task muss sich auf einen spezifischen Schritt in einem existierenden Plan beziehen.
- **Verzeichnis-Struktur:**
  - `/.gemini/plans/`: Aktuelle Schritt-für-Schritt-Pläne mit Checkboxen.
  - `/.gemini/docs/`: Langfristige Architektur- und Design-Entscheidungen.
  - `/.gemini/utils/`: Geteilte Hilfsskripte (wie der Logger).
- **Logging-Pflicht:** Alle wesentlichen Statusänderungen und Fehler müssen über `.gemini/utils/logger.js` sowohl in der Konsole als auch in `.gemini/logs/system.log` protokolliert werden.
- **System-Map Schutz:** Die `.gemini/system_map.md` darf von Agenten NIEMALS überschrieben oder gekürzt werden. Es ist nur erlaubt, neue Zeilen hinzuzufügen oder Status-Emojis (z.B. ⏳ -> ✅) zu aktualisieren. Jede unautorisierte Löschung gilt als kritischer Integritätsfehler.

## Aktueller Fokus
- Aufbau der Infrastruktur (Logging-System).
- Etablierung des Multi-Agenten-Protokolls.

## Arbeitsanweisung für den Boss-Agenten
1. **Initialer Scan:** Scanne bei jedem Session-Start zuerst die `.gemini/system_map.md`, um den globalen Status und den nächsten Fahrplan-Punkt zu erfassen, und validiere dies gegen die `GEMINI.md`.
2. Überprüfe den detaillierten Status in `.gemini/plans/`, um den nächsten offenen Task zu identifizieren.
3. Nutze den zentralen Logger (`.gemini/utils/logger.js`), um den Start und Abschluss von Tasks zu dokumentieren.
4. Delegiere Planung an den `planning-agent`.
5. **Qualitätssicherung & Checkpointing:** Nutze nach jedem Implementierungsschritt den Hybrid-Runner (`node .gemini/utils/run_audit.cjs [geänderte_dateien]`). Führe das KI-Audit nur durch, wenn das lokale Audit erfolgreich war. Wenn das Audit "PASSED" meldet, nutze den `.gemini/utils/checkpoint_manager.js`, um den Fortschritt im entsprechenden Plan automatisch zu markieren. Ein Task-Schritt gilt erst als abgeschlossen, wenn das Checkpointing erfolgt ist.
6. **Validierung:** Nutze den `codebase_investigator` für tiefgreifende Architektur-Audits.
