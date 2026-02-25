# Plan: Implementierung des Hybrid-Audit-Systems

## Kontext & Ziel
Umstellung des Qualitätssicherungsprozesses auf ein token-sparendes Hybrid-Modell (Lokal + KI).

## Schnittstellen & Architektur
- **Runner:** `.gemini/utils/run_audit.cjs` (mit Hybrid-Logik).
- **Lokal-Prüfer:** `skills/quality-inspector/scripts/validate_changes.cjs` (wird nach `.gemini/utils/` verschoben/verlinkt).
- **KI-Prüfer:** `quality-inspector` Skill.

## Implementierungsschritte (Checkliste)
- [x] Schritt 1: Lokales Validierungs-Skript nach `.gemini/utils/validate_local.js` verschieben und optimieren.
- [x] Schritt 2: Den Hybrid-Runner `.gemini/utils/run_audit.cjs` implementieren (Kaskadierung Lokal -> KI).
- [x] Schritt 3: `GEMINI.md` aktualisieren: Audit-Pflicht auf Hybrid-Modell umstellen.
- [x] Schritt 4: Testlauf: Eine Datei ohne Logger erstellen und prüfen, ob die KI (teuer) richtigerweise NICHT gestartet wird.

## Test-Strategie
- **Erfolgskriterium:** Wenn `validate_local.js` einen Fehler findet, darf im Task-Manager/Prozess-Log keine neue `gemini` Instanz erscheinen.
- **Validierung:** End-to-End Test mit einer korrekten Datei: Lokal OK -> KI OK -> Checkpoint gesetzt.

## Checkpoint-Info
Implementierung des Hybrid-Audit-Systems erfolgreich abgeschlossen. Hybrid-Runner (`run_audit.cjs`) orchestriert nun Stufe 1 (lokal) und Stufe 2 (KI). GEMINI.md aktualisiert.
