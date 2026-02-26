# Dokumentation: Gemini-Schmiede Template v2.0

## Überblick
Dieses Template stellt den Framework-Kern der "Gemini-Schmiede" bereit. Es enthält alle notwendigen Tools, Agent-Skills und Konfigurationsdateien, um ein neues Projekt mit dem agentischen Workflow zu starten.

## Infrastruktur-Komponenten
- **Utils:** Core-Funktionalitäten wie Logger, Git-Manager, Audit-Runner und Checkpoint-System.
- **Skills:** Vordefinierte Experten-Agenten (Quality-Inspector, Architecture-Analyst, etc.).
- **Standards:** Architektur-Vorgaben in `GEMINI.md` und `.gemini/docs/`.

## Export in ein neues Projekt
Um das Framework in ein neues Verzeichnis zu exportieren, nutze das Export-Skript:

```bash
node .gemini/utils/core/export_template.js <ziel_pfad>
```

Das Skript kopiert:
- `.gemini/` (Infrastruktur & Skills)
- `GEMINI.md` (Zentrale Regeln)
- `setup_gemini.cjs` (Initialisierungsskript)
- `gemini.config.json` (Konfiguration)

## Erste Schritte in einem neuen Projekt

1. **Initialisierung:**
   Führe im Zielverzeichnis `node setup_gemini.cjs` aus, um die Umgebung zu validieren.

2. **Planung:**
   Nutze den `planning-agent`, um ein neues Feature in `.gemini/plans/` zu definieren.

3. **Roadmap:**
   Trage das erste Ziel in die `system_map.md` unter "Projekt-Fahrplan" ein.

4. **Entwicklung:**
   Folge dem Standard-Workflow (Plan -> Branch -> Implement -> Audit -> Checkpoint).

---
*Version: 2.0.0-Template*
