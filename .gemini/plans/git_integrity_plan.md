# Plan: INFRA-GIT - Git-Integrity-System

## Kontext & Ziel
Ablösung der ordnerbasierten Backups durch Git-Snapshots zur Steigerung der System-Performance und Revisionssicherheit.

## Schnittstellen & Architektur
- Betrifft: `integrity_guardian.cjs`, Git-CLI.
- Tools: `run_shell_command` für `git`.

## Implementierungsschritte (Checkliste)
- [x] **Schritt 1:** Git-Utility erstellen (`.gemini/utils/git_integrity.cjs`).
- [x] **Schritt 2:** Methode `createSnapshot()` implementieren (nutzt `git add .` und `git stash` oder `git commit -m "pre-task"`).
- [x] **Schritt 3:** Methode `restoreSnapshot()` implementieren (nutzt `git reset --hard` oder `git stash pop`).
- [x] **Schritt 4:** Integration in den `integrity_guardian.cjs`: Ersetze `copyFile` Backups durch GIS-Aufrufe.
- [x] **Schritt 5:** Cleanup-Funktion zum Entfernen temporärer Git-Zustände nach Erfolg.
- [x] **Schritt 6:** Validierung mit einem Test-Skript `tests/test_git_integrity_flow.cjs`.

## Test-Strategie
- Manuelle Änderung an einer Datei -> GIS Snapshot -> Weitere Änderung -> Restore -> Prüfung ob erster Zustand wiederhergestellt wurde.
- Prüfung der Fehlerbehandlung bei fehlendem Git-Repository.

## Checkpoint-Info
Alle Schritte abgeschlossen. Git-Integrity-System (GIS) ist voll einsatzbereit. Ersetzt manuelle Backups durch Git-Snapshots. Integrationstest erfolgreich durchgeführt.
