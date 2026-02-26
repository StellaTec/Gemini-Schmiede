# Plan: MERGE - Recovery-System in v2.0 (Claude-Refactor)

## Kontext & Ziel
Integration der Sicherheits- und Wiederherstellungs-Logik (`token_guardian`, `integrity_guardian`) aus v1.0.0 in die modernisierte v2.0-Infrastruktur. Ziel ist ein robustes System mit ESM/modernem CJS, JSDoc und automatisierten Audits.

## Schnittstellen & Architektur
- **Basis:** v2.0-Core (`logger.js`, `error-handler.cjs`).
- **Inputs:** Logik aus `feature/RECOVERY-SYSTEM` (v1.0.0).
- **Standards:** Clean Code (max 500 Zeilen), JSDoc, Modulare Trennung.
- **Rollen:** 
    - **Worker:** Führt die Code-Änderungen aus.
    - **Auditor:** Verifiziert jede Änderung via `run_audit.cjs`.

## Implementierungsschritte (Checkliste)

### Phase 1: Vorbereitung & Konfiguration
- [x] **Schritt 1 (Boss): Branch-Setup:** `feature/RECOVERY-INTEGRATED` erstellt.
- [x] **Schritt 2 (Worker): Konfigurations-Merge:** `security`-Settings in `gemini.config.json` übertragen.
- [ ] **Schritt 3 (Auditor): Verifikation Konfig:** Audit ausführen, um JSON-Validität und Logging zu prüfen.

### Phase 2: Core-Utilities Portierung
- [x] **Schritt 4 (Worker): Token-Guardian:** `.gemini/utils/token_guardian.js` mit JSDoc und v2-Logger implementiert.
- [ ] **Schritt 5 (Auditor): Unit-Test Token-Guardian:** Erstellen und Ausführen von `tests/test_token_guardian.cjs`.
- [ ] **Schritt 6 (Worker): Snapshot-Integration:** Snapshot-Logik (`git stash` / `git restore`) in `.gemini/utils/git_manager.js` oder neues Modul integrieren.
- [ ] **Schritt 7 (Auditor): Verifikation Snapshot:** Manueller Test der Snapshot-Funktion via CLI.

### Phase 3: Integrität & Finalisierung
- [ ] **Schritt 8 (Worker): Integrity-Heuristiken:** Abgleich `integrity_check.js` mit alten Heuristiken und Update der Schwellenwerte.
- [ ] **Schritt 9 (Auditor): Full-Audit:** Gesamtsystem-Check via `node .gemini/utils/run_audit.cjs`.
- [ ] **Schritt 10 (Boss): Kontext-Update:** Aktualisierung der `project_context.md` via `context_updater.js`.

## Test-Strategie
1. **Lokal:** `node tests/test_token_guardian.cjs` (Neu).
2. **Integrität:** Simulation von Datenverlust und Prüfung, ob der Guardian blockt.
3. **Workflow:** Validierung der Branch-Regeln durch den `git_manager`.

## Checkpoint-Info
Schritte 1, 2 und 4 wurden bereits (voreilig) ausgeführt. 
Nächster Fokus: **Schritt 3 & 5** (Verifikation und Tests), um die Integrität des aktuellen Stands zu bestätigen, bevor wir mit der Snapshot-Logik fortfahren.
Autor: Planning-Agent (Strategie-Audit abgeschlossen).
