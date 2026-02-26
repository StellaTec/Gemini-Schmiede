# Plan: MERGE - Recovery-System in v2.0 (Claude-Refactor)

## Kontext & Ziel
Integration der verloren gegangenen Sicherheits- und Wiederherstellungs-Logik (`token_guardian`, `integrity_guardian`) aus dem `feature/RECOVERY-SYSTEM` (v1.0.0) in die neue, modernisierte Infrastruktur von `origin/claude/refactor-project-tasks-2ePG6` (v2.0.0).

Ziel ist ein stabiles v2.0-System mit voll funktionsfähigem Token- und Integritäts-Schutz, das dem neuen Modul- und Agenten-Standard entspricht.

## Schnittstellen & Architektur
- **Basis:** Claude-Refactor (v2.0.0) mit `project_context.md` und neuem `run_audit.cjs`.
- **Eingang:** Logik aus `feature/RECOVERY-SYSTEM` (`token_guardian.cjs`, `integrity_guardian.cjs`).
- **Ziel-Dateien:** `.gemini/utils/token_guardian.js` (ESM/modern), `gemini.config.json` (Update).
- **Validierung:** `tests/test_checkpoint.cjs`, `tests/test_integrity.cjs`, `run_audit.cjs`.

## Implementierungsschritte (Checkliste)
- [ ] **Schritt 1: Branch-Setup:** Erstellen von `feature/RECOVERY-INTEGRATED` basierend auf `origin/claude/refactor-project-tasks-2ePG6`.
- [ ] **Schritt 2: Konfigurations-Merge:** Übertragung der `security`-Settings aus dem alten Branch in die neue `gemini.config.json`.
- [ ] **Schritt 3: Token-Guardian Portierung:** Neuerstellung von `.gemini/utils/token_guardian.js` unter Nutzung des neuen Loggers (`logger.js`) und ESM-Syntax.
- [ ] **Schritt 4: Integrity-Check Integration:** Abgleich des alten `integrity_guardian.cjs` mit dem neuen `integrity_check.js`. Zusammenführung der besten Heuristiken.
- [ ] **Schritt 5: Test-Migration:** Anpassung der Tests in `tests/` an die neuen Modul-Pfade und die v2.0-Struktur.
- [ ] **Schritt 6: Full-Audit:** Ausführung von `node .gemini/utils/run_audit.cjs` zur finalen Abnahme.
- [ ] **Schritt 7: Kontext-Update:** Aktualisierung der `project_context.md` via `context_updater.js`.

## Test-Strategie
1. Unit-Tests für den neuen `token_guardian.js`.
2. Integration-Test des `run_audit.cjs` mit simuliertem Code-Verlust (Integritäts-Check).
3. Validierung der Agenten-Berechtigungen in `gemini.config.json`.

## Checkpoint-Info
Plan erstellt. Nächster Schritt: Branch-Wechsel und initialer Konfigurations-Merge.
Autor: Planning-Agent via Boss-Agent.
