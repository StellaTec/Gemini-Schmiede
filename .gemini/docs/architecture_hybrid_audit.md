# Architektur: Token-Effizientes Hybrid-Audit-System

## Zielsetzung
Maximale Reduzierung der Token-Kosten bei gleichbleibend hoher Qualitätssicherung durch ein zweistufiges Audit-Verfahren.

## Das Hybrid-Modell
### Stufe 1: Lokales Audit (Kosten: 0 Token)
- **Tool:** `.gemini/utils/validate_changes.cjs` (lokales Node.js Skript).
- **Prüfung:** Harte Fakten (Syntax-Check, Existenz von Dateien, Vorhandensein des Logger-Imports via Regex).
- **Verhalten:** Wenn Stufe 1 fehlschlägt, wird der Prozess sofort abgebrochen. Keine KI-Kosten.

### Stufe 2: KI-Audit (Kosten: Gering/Zielgerichtet)
- **Tool:** `quality-inspector` Skill via isolierter Gemini-Instanz.
- **Prüfung:** Logik, Architektur-Konformität, "Sinnhaftigkeit" der Änderungen.
- **Trigger:** Startet nur, wenn Stufe 1 "PASSED" meldet.

## Orchestrierung (`run_audit.cjs`)
Der `run_audit.cjs` Runner übernimmt die Logik:
1. Ruft Stufe 1 auf.
2. Prüft Exit-Code.
3. Startet bei Erfolg Stufe 2.
4. Schreibt das finale Ergebnis ("Hybrid-Audit PASSED") in die Logs.

## Token-Sparpotenzial
Durch das Abfangen von "Flüchtigkeitsfehlern" (vergessener Logger, falscher Pfad) in Stufe 1 werden ca. 30-50% der unnötigen KI-Aufrufe während der Entwicklung eingespart.
