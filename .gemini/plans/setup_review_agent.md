# Plan: Implementierung des Quality-Inspectors (Review-Agent)

## Kontext & Ziel
Erstellung eines neuen spezialisierten Skills `quality-inspector`, der die Code-Qualität und Architektur-Konformität in jedem isolierten Schritt sicherstellt.

## Schnittstellen & Architektur
- **Skill-Name:** `quality-inspector`.
- **Einstiegspunkt:** `skills/quality-inspector/SKILL.md`.
- **Abhängigkeiten:** `GEMINI.md`, `.gemini/utils/logger.js`.
- **Input:** Code-Änderungen der aktuellen Session.
- **Output:** Audit-Report (PASSED/FAILED).

## Implementierungsschritte (Checkliste)
- [x] Schritt 1: Initialisierung des Skills `quality-inspector` unter `skills/quality-inspector/`.
- [x] Schritt 2: Definition der Prüfregeln in `SKILL.md` (Logging-Pflicht, Verzeichnis-Konformität).
- [x] Schritt 3: Implementierung eines Hilfsskripts `scripts/validate_changes.cjs`, das Code-Änderungen automatisch scannt.
- [x] Schritt 4: Den Boss-Agenten in `GEMINI.md` anweisen, den Quality-Inspector nach jedem Implementierungsschritt aufzurufen.
- [x] Schritt 5: Testlauf des Inspectors an einer absichtlich fehlerhaften Änderung (z.B. fehlendes Logging).

## Test-Strategie
- **Verifikation:** Manueller Aufruf des Skills nach einer Code-Änderung.
- **Validierung:** Der Skill muss bei fehlendem Logging in neuen Dateien ein FAILED zurückgeben und den Fehler im Log persistieren.

## Checkpoint-Info
Konzept unter `.gemini/docs/review_agent_concept.md` gespeichert. Die Planung für den neuen Skill ist abgeschlossen. Nächster Schritt: Initialisierung des Skills.
