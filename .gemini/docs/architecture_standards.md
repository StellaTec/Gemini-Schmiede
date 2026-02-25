# Architektur-Standards: Die Clean-Code-Regeln

Jedes Projekt in der Gemini-Schmiede MUSS nach folgenden Standards aufgebaut werden:

## 1. Modulare Trennung (Separation of Concerns)
- **API/Controller:** Nur für Request/Response-Handling. Keine Business-Logik.
- **Services:** Beinhaltet die eigentliche Logik. Nutzt Repositories/Clients.
- **Models/Entities:** Reine Datenstrukturen.
- **Utilities:** Geteilte Hilfsfunktionen (wie unser Logger).

## 2. Dateihygiene
- **Single Responsibility:** Eine Datei = Eine Klasse/Ein Hauptmodul.
- **Size-Limit:** Dateien sollten 500 Zeilen nicht überschreiten. Bei Überschreitung -> Refactoring in Sub-Module.
- **Export-Standard:** Klare Schnittstellen. Nur exportieren, was wirklich gebraucht wird.

## 3. Dokumentations-Pflicht
- Jede Datei muss einen Header-Kommentar mit Zweck und Autor (Agent-ID) haben.
- Komplexe Funktionen müssen JSDoc-Kommentare (oder Sprach-Äquivalent) haben.

## 4. Frontend/Backend Trennung
- Strikte Trennung der Verzeichnisse.
- Kommunikation nur über definierte APIs (REST/GraphQL/etc.).
- Keine direkten Dateizugriffe oder DB-Aufrufe vom Frontend aus.
