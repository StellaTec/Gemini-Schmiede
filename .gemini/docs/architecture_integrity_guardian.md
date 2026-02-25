# Architektur: PROD00 Integrity-Guardian

## Ziel
Schutz der Codebase vor unbeabsichtigten Löschungen, radikalen Stil-Änderungen und "Gedächtnis-Fehlern" von KI-Agenten.

## Funktionsweise (Diff-Integrität)
Der Guardian wird in den `run_audit.cjs` integriert und führt folgende Prüfungen durch:

1. **Deletion-Threshold:** Wenn mehr als 10% einer Datei oder kritische Blöcke (Funktions-Header) ohne explizite Anweisung im Plan gelöscht werden -> **Alarm**.
2. **Symbol-Persistenz:** Prüfung, ob alle exportierten Funktionen/Klassen, die *vor* dem Edit existierten, auch *nach* dem Edit noch vorhanden sind (außer Löschung war Teil des Plans).
3. **Style-Consistency:** Verhindert, dass der Agent eigenmächtig von z.B. CommonJS auf ESM umstellt oder Einrückungen massiv ändert.

## Komponenten
- `.gemini/utils/integrity_check.js`: Das Kern-Skript für den Datei-Vergleich.
- Integration in `run_audit.cjs` als "Stufe 0" (bevor die KI überhaupt drüberschaut).

## Roadmap
- [ ] Schritt 1: Erstellung von `integrity_check.js` (Diff-Logik).
- [ ] Schritt 2: Integration in den `run_audit.cjs` Workflow.
- [ ] Schritt 3: Testlauf mit einer "Verschlimmbesserung" (Simuliertes Löschen einer Funktion).
