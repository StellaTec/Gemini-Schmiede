# Plan: RECOVERY - System-Wiederherstellung

## Kontext & Ziel
Nach instabilen Git-Operationen (Stash/Reset) während der Entwicklung von PROD-BRANCH sind Teile von SEC01 verloren gegangen. Ziel ist die saubere Wiederherstellung des stabilen Zustands.

## Schnittstellen & Architektur
- Betrifft: `.gemini/utils/token_guardian.cjs`, `git_integrity.cjs`.
- Validierung: `tests/test_token_guardian.cjs`.

## Implementierungsschritte (Checkliste)
- [ ] **Schritt 1:** Analyse der Git-Historie (`git reflog`, `git stash list`), um evtl. Fragmente zu finden.
- [ ] **Schritt 2:** Neuerstellung von `.gemini/utils/token_guardian.cjs` (Surgical Re-Implementation).
- [ ] **Schritt 3:** Verifizierung der Konfiguration in `gemini.config.json` (Security-Sektion).
- [ ] **Schritt 4:** Durchführung eines Full-Audits über alle Utils, um weitere Verluste auszuschließen.
- [ ] **Schritt 5:** Stabilisierung von `git_integrity.cjs`, um künftige Verluste bei Rollbacks zu verhindern.

## Test-Strategie
- Ausführung von `tests/test_token_guardian.cjs`.
- Manueller Check aller Dateien in `.gemini/utils/`.

## Checkpoint-Info
Recovery-Task gestartet. Dateien werden neu aufgebaut.
