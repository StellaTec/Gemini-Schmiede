# Architektur-Konzept: Analytics-System

## Zielsetzung
Das Analytics-System dient der Erfassung und Persistierung von Metriken innerhalb der Agenten-Infrastruktur. Der Fokus liegt zunächst auf der Zählung von KI-Agenten-Aufrufen, um die Nutzung und Kosten/Effizienz der hybriden Audits zu überwachen.

## Komponenten

### 1. Analytics-Dienst (`.gemini/utils/analytics.js`)
Ein leichtgewichtiges Modul zum Lesen und Schreiben von Statistiken.
- **Funktion:** `incrementStat(key)`
- **Speicherort:** `.gemini/logs/stats.json`
- **Format:** JSON-Objekt mit Schlüsseln und numerischen Werten.

### 2. Integration: Quality-Inspector (`.gemini/utils/run_audit.cjs`)
Der `run_audit.cjs` führt lokale Audits und KI-basierte Audits (Level 2) durch.
- **Trigger:** Bei erfolgreicher Auslösung eines KI-Audits wird der Zähler `ai_agent_calls` inkrementiert.
- **Anzeige:** Am Ende des Audit-Prozesses wird die aktuelle Statistik ausgegeben.

## Datenstruktur (`stats.json`)
```json
{
  "ai_agent_calls": 0,
  "last_reset": "2026-02-25T00:00:00.000Z"
}
```

## Sicherheits- & Fehlerbehandlung
- Das Analytics-Modul muss robust gegenüber fehlenden Dateien oder korruptem JSON sein (Fallback auf Standardwerte).
- Dateizugriffe erfolgen synchron, um Konsistenz während schneller Audit-Zyklen zu wahren.
