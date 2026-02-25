# Architektur: Auto-Checkpointing & Zustandsverwaltung

## Zielsetzung
Etablierung eines automatisierten Prozesses ("Auto-Checkpointing"), der den Fortschritt in den Plan-Dateien (`.gemini/plans/*.md`) eigenständig verwaltet. Nach erfolgreicher Durchführung und Validierung eines Schritts soll die entsprechende Checkbox von `[ ]` auf `[x]` gesetzt werden.

## Komponenten-Design
1. **Checkpoint-Manager (`.gemini/utils/checkpoint_manager.js`):**
   - Ein spezialisiertes Node.js-Skript, das Markdown-Dateien parst und Checkboxen basierend auf dem Index oder dem Beschreibungstext aktualisiert.
   - Nutzt `fs` für das Lesen/Schreiben und `logger.js` für das Protokollieren der Statusänderung.

2. **Boss-Trigger (Orchestrierung):**
   - Der Boss-Agent ruft den `checkpoint_manager` automatisch auf, sobald der `quality-inspector` ein `PASSED` für den aktuellen Implementierungsschritt meldet.

## Workflow-Integration
1. **Act:** Boss-Agent führt eine Änderung durch.
2. **Review:** `quality-inspector` validiert die Änderung.
3. **Checkpoint (Auto):** Falls Review = `PASSED`, wird `checkpoint_manager.js` aufgerufen, um den Schritt im Plan als erledigt zu markieren.
4. **Log:** Statusmeldung in `system.log`: `[INFO] [BOSS] - Automatisch Checkbox für Schritt N in PLAN.md auf [x] gesetzt.`

## Vorteile
- **Konsistenz:** Die physischen Pläne im Dateisystem entsprechen immer exakt dem Fortschritt der Agenten-Session.
- **Transparenz:** Bei jedem Neustart oder in jedem neuen Chat-Fenster sieht der Boss-Agent sofort den echten Status, ohne dass der User manuell eingreifen muss.
