# Plan: Project-Context-System (CTXT01)

## Kontext & Ziel

Ein autonomes Entwicklerteam braucht auf einen Blick: Was ist das Projekt, wo liegen
die Daten, welche Features sind live, was ist offen? Aktuell gibt es kein lebendes
Dokument das das **gebaute Projekt** (nicht das Framework) beschreibt.

**Ziel:** `project_context.md` + `context_updater.js` — ein selbstaktualisierendes
Projektgedächtnis das Agenten sofort orientiert.

## Schnittstellen & Architektur

- `project_context.md` — Root-Dokument, 8 benannte Sektionen (## Header)
- `.gemini/utils/context_updater.js` — Lese/Schreib-Utility (CLI + require)
- `.gemini/logs/context_meta.json` — Timestamp-Tracking pro Sektion
- `gemini.config.json` — `paths.projectContext` + `contextUpdater` Sektion
- `GEMINI.md` — BOSS Context-Budget + Befehls-Tabelle ergänzt
- `system_map.md` — Neue Zeile + Roadmap-Eintrag CTXT01

## Implementierungsschritte (Checkliste)

- [x] Schritt 1: `project_context.md` Template erstellen (Projekt-Root)
- [x] Schritt 2: `.gemini/utils/context_updater.js` implementieren
- [x] Schritt 3: `gemini.config.json` aktualisieren (Pfade + Sektion)
- [x] Schritt 4: `GEMINI.md` aktualisieren (BOSS-Budget + Befehle)
- [x] Schritt 5: `system_map.md` aktualisieren (Status-Zeile + Roadmap)

## Test-Strategie

```bash
# CLI-Tests
node .gemini/utils/context_updater.js status
node .gemini/utils/context_updater.js read "Projekt"
node .gemini/utils/context_updater.js append "Letzte Aenderungen" "- Test-Eintrag"
node .gemini/utils/context_updater.js update "Umgebung" "NODE_ENV=development"
```

## Checkpoint-Info

Branch: claude/refactor-project-tasks-2ePG6
Aktiver Plan: .gemini/plans/project_context_system.md
Letzter Schritt: 0 (bereit)
