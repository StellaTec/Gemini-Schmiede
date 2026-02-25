# Plan: PROD00 Integrity-Guardian

## Kontext & Ziel
Einführung einer automatisierten Integritätsprüfung, um Code-Verlust und unerwünschte Refactorings durch Agenten zu verhindern.

## Implementierungsschritte (Checkliste)
- [x] Schritt 1: Implementierung von `.gemini/utils/integrity_check.js`. Das Skript soll zwei Versionen einer Datei vergleichen (Vorher/Nachher).
- [x] Schritt 2: Erweiterung des `run_audit.cjs`. Es muss vor einer Änderung einen Snapshot der Datei erstellen und danach den `integrity_check.js` aufrufen.
- [x] Schritt 3: Definition von Schwellenwerten (z.B. max. 15% Löschung erlaubt).
- [x] Schritt 4: Testlauf: Wir versuchen eine Datei zu "beschädigen" und prüfen, ob der Guardian das Audit abbricht.

## Test-Strategie
- **Unit-Test:** `node integrity_check.js old.js new.js` muss bei signifikantem Codeverlust einen Exit-Code 1 liefern.
- **Integration:** Der Hybrid-Runner muss ein "FAILED" melden, wenn der Integrity-Check fehlschlägt.

## Checkpoint-Info
Architektur unter `.gemini/docs/architecture_integrity_guardian.md` hinterlegt. Start der Implementierung von Schritt 1.
