# Implementierungsplan: Framework-Portabilität & Generalisierung

Dieses Modul zielt darauf ab, die Gemini-Schmiede von einer projektspezifischen Lösung in ein universell einsetzbares Agentic-Workflow-Framework zu verwandeln.

## Kontext & Ziel
Die Schmiede soll in jedem beliebigen Projekt (unabhängig von Sprache oder Stack) durch einfaches Kopieren oder ein Setup-Skript einsatzbereit sein. Alle projektspezifischen Logiken werden in eine zentrale Konfiguration ausgelagert.

## Schnittstellen & Architektur
- **Zentrales Element:** `gemini.config.json` im Projekt-Root.
- **Betroffene Tools:** `run_audit.cjs`, `logger.js`, `setup_gemini.cjs`, `checkpoint_manager.js`.
- **Eingabe:** Projektspezifische Befehle (Lint, Test, Build) via Config.

## Implementierungsschritte (Checkliste)

- [x] Schritt 1: Definition und Erstellung der `gemini.config.json` Struktur.
- [x] Schritt 2: Portabilitäts-Audit der Utility-Skripte. Ersetzen aller hartcodierten Pfade durch dynamische Auflösung (CWD).
- [x] Schritt 3: Refactoring von `run_audit.cjs`. Dynamisches Laden der Test/Lint-Befehle aus der `gemini.config.json`.
- [x] Schritt 4: Upgrade von `setup_gemini.cjs`. Das Skript soll als Installer fungieren (Config anlegen, Ordnerstruktur initialisieren, Templates kopieren).
- [x] Schritt 5: Dokumentations-Templates erstellen. Basis-Standards in `.gemini/docs/` als Vorlage für neue Projekte.

## Test-Strategie
1. **Mock-Integration:** Die Schmiede in einen leeren Test-Ordner kopieren und `setup_gemini.cjs` ausführen.
2. **Config-Test:** Prüfen, ob `run_audit.cjs` korrekt reagiert, wenn in der Config kein Test-Befehl oder ein spezifischer Befehl (z.B. `echo "Success"`) steht.
3. **Pfad-Validierung:** Ausführen der Skripte aus verschiedenen Unterverzeichnissen, um die Robustheit der Pfadauflösung sicherzustellen.

## Checkpoint-Info
Plan erstellt und in Roadmap integriert. Nächster Schritt: Definition der `gemini.config.json`.
