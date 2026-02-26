# Implementierungsplan: GEN01 - Framework-Portabilitaet & Generalisierung

## Kontext & Ziel
Die Gemini-Schmiede von einer projektspezifischen Loesung in ein universell
einsetzbares Agentic-Workflow-Framework umwandeln. Einsatzbereit in jedem Projekt
durch einfaches Kopieren und Ausfuehren von `setup_gemini.cjs`.

## Schnittstellen & Architektur
- **Zentrales Element:** `gemini.config.json` im Projekt-Root
- **Betroffene Tools:** `run_audit.cjs`, `logger.js`, `setup_gemini.cjs`, `checkpoint_manager.js`
- **Eingabe:** Projektspezifische Befehle (Test, Lint, Build) via Config

## Implementierungsschritte (Checkliste)

- [x] Schritt 1: Definition und Erstellung der `gemini.config.json` Struktur (Projekt-Root).
- [x] Schritt 2: Portabilitaets-Audit. Alle hartcodierten Pfade durch dynamische Aufloesung ersetzt.
- [x] Schritt 3: Refactoring `run_audit.cjs`. Dynamisches Laden aus `gemini.config.json`.
- [x] Schritt 4: Upgrade `setup_gemini.cjs` als vollstaendiger Installer (idempotent, Node.js Check).
- [x] Schritt 5: Dokumentations-Templates (GEMINI.md Template in setup_gemini.cjs integriert).

## Test-Strategie
1. **Config-Test:** `node tests/test_config.cjs` - PASSED.
2. **Setup-Test:** `node setup_gemini.cjs` - idempotent, keine Fehler.
3. **Pfad-Validierung:** `node tests/run_tests.cjs` - alle Tests bestanden.

## Ergebnis
Alle Schritte abgeschlossen. Neue Dateien:
- `gemini.config.json` - Zentrale Konfiguration im Projekt-Root
- `package.json` - NPM-Metadaten und Scripts
- `.gemini/utils/core/path-resolver.cjs` - Dynamische Root-Erkennung
- `.gemini/utils/core/config.cjs` - Config-Loader mit Deep-Merge

## Checkpoint-Info
GEN01 abgeschlossen. Framework ist portabel. `setup_gemini.cjs` dient als Installer.
