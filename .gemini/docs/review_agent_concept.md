# Architektur-Konzept: Quality-Inspector (Review-Agent)

## Zielsetzung
Etablierung eines spezialisierten Skills zur Qualitätssicherung (`quality-inspector`), der Code-Änderungen auf Konformität mit der `GEMINI.md` und technischen Standards (Logging, Struktur) prüft. Der Agent fungiert als "Gatekeeper" vor dem Abschluss eines Plan-Schritts.

## Kern-Funktionalitäten
1. **GEMINI.md Konformität:** Prüft, ob neue Dateien in den richtigen Verzeichnissen liegen (`.gemini/utils/`, `.gemini/plans/`, etc.).
2. **Logging-Check:** Scannt neuen Code auf die Verwendung des zentralen Loggers.
3. **Struktur-Audit:** Validiert, dass neue Funktionen isoliert und modular aufgebaut sind.
4. **Plan-Abgleich:** Stellt sicher, dass die vorgenommenen Änderungen exakt dem Schritt im aktuellen Plan entsprechen (kein Scope-Creep).

## Arbeitsweise
- Der Boss-Agent aktiviert den `quality-inspector` nach jedem "Act"-Schritt.
- Der Inspektor liefert ein "PASSED" oder "FAILED" mit detaillierter Fehlerliste zurück.
- Nur bei "PASSED" wird der Plan-Schritt in der Checkliste auf `[x]` gesetzt.

## Schnittstellen
- **Input:** Die Liste der geänderten Dateien und der aktuelle Plan-Schritt.
- **Output:** Audit-Log in `.gemini/logs/system.log` (Level INFO/ERROR) und ein strukturierter Report im Chat.

## Zukünftige Erweiterbarkeit
- Automatisierte Linting- und Type-Checking-Integration.
- Vorschläge für Performance-Optimierungen.
