# Gemini-Schmiede: Die Autonome Software-Fabrik 🚀

Die **Gemini-Schmiede** ist ein hochstrukturiertes Multi-Agenten-System zur autonomen Softwareentwicklung. Unser Ziel ist die Erschaffung einer Software-Fabrik, die qualitativ hochwertige, fehlerfreie und perfekt dokumentierte Anwendungen mit minimaler menschlicher Intervention produziert.

## 🤖 Multi-Agenten-Architektur

Das System basiert auf einer strikten Trennung von Planung, Ausführung und Validierung:

*   **Boss-Agent (Koordinator):** Steuert den gesamten Workflow, delegiert Aufgaben an isolierte Sub-Agenten und überwacht den Fortschritt anhand der System-Map.
*   **Planning-Agent (Stratege):** Verantwortlich für die Erstellung detaillierter technischer Konzepte und Schritt-für-Schritt-Pläne. Kein Code wird ohne vorherige Planung geschrieben.
*   **Quality-Inspector (Auditor):** Validiert jede Änderung durch einen hybriden Audit-Prozess (lokale Tests + KI-Review), um die Systemintegrität sicherzustellen.

## 🛠️ Workflow: Neue Features starten

Die Entwicklung folgt einem unumstößlichen Protokoll:

1.  **Initialer Scan:** Der Boss-Agent prüft die `.gemini/system_map.md` und `GEMINI.md`, um den aktuellen Status und die nächsten Schritte zu identifizieren.
2.  **Planung:** Der `planning-agent` erstellt ein Architektur-Konzept in `.gemini/docs/` und einen detaillierten Implementierungsplan in `.gemini/plans/`.
3.  **Implementierung:** Aufgaben werden in isolierten Kontexten abgearbeitet. Jede wesentliche Änderung wird über den zentralen Logger (`.gemini/utils/logger.js`) protokolliert.
4.  **Validierung & Checkpoint:** Nach jeder Änderung führt der `Quality-Inspector` das Audit-Skript (`node .gemini/utils/run_audit.cjs`) aus. Erst nach einem erfolgreichen "PASSED" markiert der `checkpoint_manager.js` den Fortschritt im Plan.

## 🏗️ Architektur-Standards

Wir folgen den Prinzipien von Clean Code und modularer Trennung:

*   **Modulare Struktur:** Klare Trennung zwischen API/Controllern, Services, Models und Utilities.
*   **Dateihygiene:** Single Responsibility Prinzip, maximal 500 Zeilen pro Datei.
*   **Dokumentationspflicht:** Jede Datei und komplexe Funktion muss dokumentiert sein (Zweck, Autor, JSDoc).
*   **Zero Regression:** Neue Features dürfen niemals bestehende Funktionen brechen. TDD (Test-Driven Development) ist der angestrebte Standard.

## 📂 Projektstruktur

*   `.gemini/plans/`: Aktuelle Schritt-für-Schritt-Pläne.
*   `.gemini/docs/`: Langfristige Architektur- und Design-Entscheidungen.
*   `.gemini/utils/`: Zentrale Hilfsskripte (Logger, Auditor, Checkpoint-Manager).
*   `.gemini/logs/`: Systemweite Protokollierung der Agenten-Aktivitäten.
*   `skills/`: Spezialisierte Agenten-Fähigkeiten (z.B. Quality-Inspector).

---
*Status: Infrastruktur bereit. Fokus auf Autonomie und fehlerfreie Feature-Entwicklung.*
