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
- **Logging-Pflicht:** Alle wesentlichen Statusänderungen und Fehler müssen über `.gemini/utils/logger.cjs` sowohl in der Konsole als auch in `.gemini/logs/system.log` protokolliert werden.
- **System-Map Schutz:** Die `.gemini/system_map.md` darf von Agenten NIEMALS überschrieben oder gekürzt werden. Es ist nur erlaubt, neue Zeilen hinzuzufügen oder Status-Emojis (z.B. ⏳ -> ✅) zu aktualisieren. Jede unautorisierte Löschung gilt als kritischer Integritätsfehler.
- **Minimum Viable Context (MVC):** Agenten müssen den Token-Verbrauch minimieren. Lese nur Dateien, die für deine spezifische Mission zwingend erforderlich sind. Vermeide großflächiges Scannen des Projekts ohne expliziten Auftrag.

## Aktueller Fokus
- Aufbau der Infrastruktur (Logging-System).
- Etablierung des Multi-Agenten-Protokolls.

## Rollen-Protokolle

### 👑 Der Boss-Agent (Koordinator)
*Diese Anweisungen gelten nur für die Haupt-Session:*
1. **Initialer Scan:** Scanne zuerst die `.gemini/system_map.md`.
2. **Delegation:** Nutze Sub-Agenten für Code-Änderungen.
3. **Qualität:** Fordere Audits an und setze Checkpoints.

### 🛠️ Der Worker-Agent (Sub-Agent)
*Diese Anweisungen gelten für alle via `-p` gestarteten Instanzen (außer Audits):*
1. **Mission-Focus:** Deine einzige Aufgabe ist die Ausführung des übergebenen Prompts.
2. **Keine Delegation:** Du darfst keine weiteren Sub-Agenten starten (außer den automatischen Audit-Runner).

### 🔍 Der Auditor-Agent (Review-Instanz)
*Diese Anweisungen gelten für Instanzen, die durch `run_audit.cjs` gestartet wurden:*
1. **Strict Review:** Deine einzige Aufgabe ist das PASSED/FAILED Urteil.
2. **Keine Folge-Aktionen:** Du darfst unter keinen Umständen Code ändern, Pläne bearbeiten oder neue Agenten starten.
3. **Termination:** Nach der Urteilsverkündung musst du den Prozess beenden.
