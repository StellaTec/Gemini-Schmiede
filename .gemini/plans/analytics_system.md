# Implementierungsplan: Analytics-System

Das Analytics-System soll die Anzahl der KI-Agenten-Aufrufe während der Audits tracken.

## Implementierungsschritte (Checkliste)

- [x] Schritt 1: Analytics-Modul erstellen. Datei `.gemini/utils/analytics.js` anlegen, die `stats.json` verwaltet.
- [x] Schritt 2: Initialisierung der `stats.json`. Sicherstellen, dass die Datei existiert und valide ist.
- [ ] Schritt 3: Integration in `run_audit.cjs`. Inkrementierung des Zählers bei KI-Audits implementieren.
- [ ] Schritt 4: Abschlussbericht. Anzeige der Statistik am Ende des Audit-Prozesses in `run_audit.cjs`.
- [ ] Schritt 5: Validierung. Testlauf des Audits und Überprüfung der `stats.json`.

## Test-Strategie
1. Manuelle Prüfung: Audit mit Level 2 starten und prüfen, ob die Datei `.gemini/logs/stats.json` erstellt/aktualisiert wird.
2. Konsolen-Output prüfen: 'Statistik: [X] KI-Agenten in dieser Session aufgerufen' muss erscheinen.

## Checkpoint-Info
Plan erstellt. Nächster Schritt: Implementierung des Analytics-Moduls.
