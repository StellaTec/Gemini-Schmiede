<!-- Zweck: Zentrale Uebersicht ueber den Systemstatus und Fahrplan, Agent-ID: BOSS-V2 -->

# Gemini-Schmiede: System-Map & Fahrplan (v2.0.0)

## System-Status (Infrastruktur)

| Komponente | Status | Beschreibung |
| :--- | :--- | :--- |
| **Logging** | ✅ Aktiv | Zentraler Logger: `.gemini/utils/logger.js` |
| **Config-System** | ✅ Aktiv | `gemini.config.json` + `.gemini/utils/core/config.cjs` |
| **Path-Resolver** | ✅ Aktiv | Dynamische Pfade: `.gemini/utils/core/path-resolver.cjs` |
| **Error-Handler** | ✅ Aktiv | Zentrales Error-Handling: `.gemini/utils/core/error-handler.cjs` |
| **Integrity-Guardian** | ✅ Aktiv | Code-Verlust-Schutz: `.gemini/utils/integrity_check.js` |
| **Checkpoint-Manager** | ✅ Aktiv | Fortschritts-Tracking: `.gemini/utils/checkpoint_manager.js` |
| **Validate-Local** | ✅ Aktiv | 0-Token Audit: `.gemini/utils/validate_local.js` |
| **Hybrid-Audit** | ✅ Aktiv | 3-Stufen Audit: `.gemini/utils/run_audit.cjs` |
| **Analytics** | ✅ Aktiv | Call-Tracking: `.gemini/utils/analytics.js` |
| **Git-Integration** | ✅ Aktiv | Lokale & Remote Versionierung |
| **Quality-Inspector** | ✅ Aktiv | Skill + Audit-Runner: `skills/quality-inspector/` |
| **Test-Suite** | ✅ Aktiv | 7 Tests: `tests/run_tests.cjs` |
| **Session-State** | ✅ Aktiv | Crash-Recovery: `.gemini/utils/session_state.js` |
| **Git-Manager** | ✅ Aktiv | Branch-Automation: `.gemini/utils/git_manager.js` |
| **Diff-Reviewer** | ✅ Aktiv | Scope-Enforcement: `.gemini/utils/diff_reviewer.cjs` |
| **Architecture-Analyst** | ✅ Aktiv | READ-ONLY Analyse-Skill: `skills/architecture-analyst/` |
| **Context-Updater** | ✅ Aktiv | Projekt-Gedächtnis: `project_context.md` + `.gemini/utils/context_updater.js` |
| **Refactoring-Agent** | ✅ Aktiv | Chirurgisches Refactoring: `skills/refactoring-agent/` |
| **TDD-Agent** | ✅ Aktiv | Test-First-Workflow: `skills/tdd-agent/` |
| **Frontend-Agent** | ✅ Aktiv | UI-Spezialist: `skills/frontend-agent/` |
| **Backend-Agent** | ✅ Aktiv | Server-Spezialist: `skills/backend-agent/` |

## Projekt-Fahrplan (Roadmap)

| ID | Feature / Modul | Status | Fokus | Plan-Datei |
| :--- | :--- | :--- | :--- | :--- |

## Wichtige Ressourcen

- **Vision:** `.gemini/docs/vision.md`
- **Standards:** `.gemini/docs/architecture_standards.md`
- **Zentrale Regeln:** `GEMINI.md`
- **Konfiguration:** `gemini.config.json`
- **Test-Suite:** `tests/run_tests.cjs`
