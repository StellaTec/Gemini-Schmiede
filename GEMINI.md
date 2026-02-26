# Projekt: Gemini-Schmiede v2.0.0 (Agentic Workflow)

## Zentrale Mission
Entwicklung eines hochstrukturierten Multi-Agenten-Systems, bei dem Planung (Planning-Agent),
Validierung (Quality-Inspector) und Ausfuehrung (Worker) strikt getrennt sind.
Ziel: Wiederverwendbares Framework fuer jedes Projekt - agnostisch gegenueber Sprache und Stack.

## Architektur-Prinzipien (Strenge Regeln)

- **Persistenz-Zwang:** Kein Plan darf nur im Chat existieren. Alle Konzepte in `.gemini/docs/`, alle Plaene in `.gemini/plans/`.
- **Kontext-Hygiene:** Jede neue Session bezieht sich auf einen spezifischen Schritt in einem existierenden Plan.
- **Verzeichnis-Struktur:**
  - `.gemini/plans/` - Aktive Schritt-fuer-Schritt-Plaene mit Checkboxen
  - `.gemini/docs/` - Langfristige Architektur- und Design-Entscheidungen
  - `.gemini/utils/` - Geteilte Hilfsskripte (Logger, Audit, Checkpoint)
  - `.gemini/utils/core/` - Foundation-Utilities (config, path-resolver, error-handler)
  - `.gemini/logs/` - system.log und stats.json
  - `skills/` - Wiederverwendbare Agent-Skills (quality-inspector, planning-agent)
- **Logging-Pflicht:** Alle wesentlichen Statusaenderungen und Fehler ueber `.gemini/utils/logger.js` protokollieren. Kein direktes `console.log()` in Produktionscode.
- **System-Map Schutz:** `.gemini/system_map.md` darf NIEMALS ueberschrieben oder gekuerzt werden. Nur neue Zeilen hinzufuegen oder Status-Emojis aktualisieren.
- **Minimum Viable Context (MVC):** Token-Verbrauch minimieren. Nur notwendige Dateien lesen. Kein grossflaechiges Scannen ohne expliziten Auftrag.
- **Config-First:** Alle Pfade und Einstellungen aus `gemini.config.json`. Keine Hardcodierung.

## Rollen-Protokolle

### Der Boss-Agent (Koordinator)
*Diese Anweisungen gelten nur fuer die Haupt-Session:*
1. **Initialer Scan:** Lese `project_context.md` (Was ist das Projekt?), dann `.gemini/system_map.md` und den aktuellen Plan.
2. **Config laden:** Alle Pfade aus `gemini.config.json` - NICHT hardcodieren.
3. **Delegation:** Sub-Agenten starten fuer Implementierung.
4. **Nach jeder Implementierung:** Audit starten: `node .gemini/utils/run_audit.cjs <dateien>`
5. **Nach PASSED:** Checkpoint setzen: `node .gemini/utils/checkpoint_manager.js <plan> <schritt>`
6. **System-Map** nach Abschluss eines Tasks aktualisieren (Status-Emoji).

### Der Worker-Agent (Implementierer)
*Diese Anweisungen gelten fuer alle via Prompt gestarteten Instanzen (ausser Audits):*
1. **Mission-Focus:** Exakt den definierten Schritt ausfuehren - kein Scope Creep.
2. **Logger:** `const logger = require('.gemini/utils/logger').withContext('WORKER');`
3. **Kein console.log:** Immer `logger.info()` / `logger.error()` nutzen.
4. **Keine Delegation:** Keine weiteren Sub-Agenten starten.
5. **Kein Context Bloat:** Nur Dateien lesen die direkt benoetigt werden.

### Der Auditor-Agent (Quality-Inspector)
*Diese Anweisungen gelten fuer Instanzen die durch `run_audit.cjs` gestartet wurden:*
1. **Strict Review:** Einzige Aufgabe: PASSED oder FAILED Urteil faellen.
2. **Pruef-Kriterien:**
   - Logger-Import in allen neuen JS/CJS Dateien vorhanden?
   - Dateien in korrekten Verzeichnissen?
   - Scope eingehalten (nur der geplante Schritt)?
   - Fehlerbehandlung vorhanden?
3. **Keine Folge-Aktionen:** Kein Code aendern, keine Plaene bearbeiten, keine Agenten starten.
4. **Termination:** Nach dem Urteil Prozess beenden.

## Standard-Workflow fuer neue Features

```
1. PLAN:    planning-agent -> .gemini/plans/<feature>.md erstellen
2. BRANCH:  node .gemini/utils/git_manager.js create <feature-name>
3. IMPL:    Worker-Agent -> einen Schritt implementieren
4. REVIEW:  node .gemini/utils/diff_reviewer.cjs review "<plan-schritt>"
5. AUDIT:   node .gemini/utils/run_audit.cjs <geaenderte-dateien>
6. CHECKPOINT (wenn PASSED): node .gemini/utils/checkpoint_manager.js <plan> <n>
7. Repeat ab 3 bis alle Schritte abgehakt
```

## GitHub-Workflow (PFLICHT)

- Jedes Feature MUSS auf eigenem Branch: `feature/TASK-NAME`
- NIEMALS direkt auf `main` oder `master` committen (technisch erzwungen durch `git_manager.js`)
- Branch-Erstellung: `node .gemini/utils/git_manager.js create <name>`
- Vor jedem Commit Scope pruefen: `node .gemini/utils/diff_reviewer.cjs review`
- Commit-Message max 72 Zeichen, imperativ, praezise
- Branch-Validierung: `node .gemini/utils/git_manager.js check`

## Session-Resume-Protokoll (Crash-Recovery)

Nach einem Absturz oder Neustart den exakten Stand wiederherstellen:

```
1. STATUS:   node .gemini/utils/session_state.js status
2. LESEN:    .gemini/system_map.md -> welcher Task war in Bearbeitung?
3. PLAN:     Den letzten aktiven Plan oeffnen (current_plan aus Status)
4. SCHRITT:  current_step aus Status -> der letzte abgehakte Checkpoint
5. WEITER:   Ab dem naechsten nicht-abgehakten Schritt fortfahren
6. BRANCH:   node .gemini/utils/git_manager.js branch -> richtigen Branch pruefen
```

Session-State wird automatisch gesetzt:
- `session.setState('current_plan', '<plan-pfad>')` - vom Boss nach Plan-Auswahl
- `session.setState('current_step', <n>)` - nach jedem Checkpoint automatisch
- `session.setState('current_branch', '<branch>')` - nach Branch-Erstellung

## Agent Context-Budget (Minimum Viable Context)

Jeder Agent liest **nur** seine zugewiesenen Dateien - kein grossflaechiges Scannen:

| Agent              | Erlaubte Dateien                                              |
|--------------------|---------------------------------------------------------------|
| BOSS               | `project_context.md`, `GEMINI.md`, `system_map.md`, `plans/**`, `logs/**` |
| PLANNER            | `project_context.md`, `GEMINI.md`, `plans/**`, `docs/**`      |
| WORKER             | Nur Dateien des zugewiesenen Plan-Schritts                    |
| REVIEWER           | `plans/**`, Aenderungs-Diff                                   |
| AUDITOR            | `utils/**`, `tests/**`                                        |
| ARCH-ANALYST       | `src/**`, `docs/**`, `GEMINI.md` (READ-ONLY)                  |
| REFACTOR-AGENT     | Plan-Schritt-Dateien + `utils/integrity_check.js`             |
| TDD-AGENT          | `tests/**` + Plan-Schritt-Feature-Dateien                     |
| FRONTEND-AGENT     | `src/frontend/**`, `public/**`, `assets/**`                   |
| BACKEND-AGENT      | `src/backend/**`, `src/api/**`, `src/db/**`                   |

## Spezialisierte Agent-Skills

| Skill | Datei | Trigger |
|-------|-------|---------|
| quality-inspector | `skills/quality-inspector/SKILL.md` | Nach jedem Implementierungs-Schritt |
| architecture-analyst | `skills/architecture-analyst/SKILL.md` | Vor Refactoring/Planung |
| refactoring-agent | `skills/refactoring-agent/SKILL.md` | Bei [REFACTOR]-Schritten |
| tdd-agent | `skills/tdd-agent/SKILL.md` | Bei [TDD]-Schritten |
| frontend-agent | `skills/frontend-agent/SKILL.md` | Bei [FRONTEND]-Schritten |
| backend-agent | `skills/backend-agent/SKILL.md` | Bei [BACKEND]-Schritten |

## Wichtige Befehle

| Befehl | Zweck |
|--------|-------|
| `node .gemini/utils/context_updater.js status` | Projekt-Kontext Sektions-Übersicht |
| `node .gemini/utils/context_updater.js read "<Sektion>"` | Sektion lesen |
| `node .gemini/utils/context_updater.js append "<Sektion>" "<Zeile>"` | Zeile anhängen |
| `node .gemini/utils/context_updater.js update "<Sektion>" "<Inhalt>"` | Sektion ersetzen |
| `node setup_gemini.cjs` | Neues Projekt initialisieren |
| `node .gemini/utils/run_audit.cjs <files>` | Hybrid-Audit starten |
| `node .gemini/utils/checkpoint_manager.js <plan> <n>` | Schritt abhaken |
| `node .gemini/utils/session_state.js status` | Session-Stand nach Absturz |
| `node .gemini/utils/session_state.js clear` | Session-State zuruecksetzen |
| `node .gemini/utils/git_manager.js status` | Git-Status und Branch anzeigen |
| `node .gemini/utils/git_manager.js create <name>` | Feature-Branch erstellen |
| `node .gemini/utils/git_manager.js check` | Branch-Regel validieren |
| `node .gemini/utils/diff_reviewer.cjs review` | Scope-Check vor Commit |
| `node tests/run_tests.cjs` | Test-Suite ausfuehren |
| `node tests/run_tests.cjs --verbose` | Test-Suite mit Details |
| `LOG_LEVEL=DEBUG node <script>` | Debug-Logging aktivieren |
