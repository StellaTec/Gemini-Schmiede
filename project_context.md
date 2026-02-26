<!-- project_context.md — Lebendiges Projektdokument -->
<!-- Dieses Dokument beschreibt das GEBAUTE PROJEKT, nicht das Framework. -->
<!-- Es wird automatisch von Agenten via context_updater.js aktualisiert. -->
<!-- Letzte Aktualisierung: 2026-02-26T16:59:31.414Z -->

# Projekt-Kontext: [PROJEKT-NAME]

> **Pflege-Hinweis:** Dieses Dokument mit `node .gemini/utils/context_updater.js` aktualisieren.
> Niemals manuell überschreiben — Sektions-Timestamps gehen sonst verloren.

---

## Projekt

[Noch nicht definiert]

*Zu befüllen:* Kurzbeschreibung, Zweck, Zielgruppe, Version, Auftraggeber.

---

## Architektur

[Noch nicht definiert]

*Zu befüllen:* Schichten-Modell, eingesetzte Muster (MVC, Event-Driven, etc.),
Haupt-Technologien, Einstiegspunkte, Verzeichnis-Struktur des Projekts.

---

## Datenhaltung

[Noch nicht definiert]

*Zu befüllen:* Wo liegen welche Daten?
- Datenbanken (Typ, Name, Host)
- Dateisystem-Speicherorte (Uploads, Exports, Caches)
- Externe Speicher (S3, Redis, Queues)
- Konfigurationsdateien mit Daten-Relevanz

---

## Aktive Features

[Noch keine Features definiert]

*Format:*
- ✅ Feature-Name — kurze Beschreibung (fertig seit: DATUM)
- 🚧 Feature-Name — in Entwicklung (Plan: .gemini/plans/NAME.md)
- 📋 Feature-Name — geplant

---

## Offene Probleme

[Keine bekannten Probleme]

*Format:*
- 🔴 KRITISCH: Beschreibung (seit: DATUM)
- 🟡 MITTEL: Beschreibung (seit: DATUM)
- 🟢 NIEDRIG: Beschreibung (seit: DATUM)

---

## Letzte Aenderungen

[Noch keine Änderungen protokolliert]

*Wird automatisch via `context_updater.js append "Letzte Aenderungen" "..."` befüllt.*

---
- CTXT01: Project-Context-System eingebaut (2026-02-26)

## Abhaengigkeiten

[Noch nicht definiert]

*Zu befüllen:*
- NPM-Packages (kritische Abhängigkeiten mit Versionen)
- Externe APIs (Name, Endpoint, Auth-Methode)
- Services (Datenbank, Cache, Message-Queue)
- Interne Abhängigkeiten (Micro-Services, Shared-Libs)

---

## Umgebung

[Noch nicht definiert]

*Zu befüllen:*
- Benötigte ENV-Variablen (Name, Zweck, Pflicht/Optional)
- Ports & Endpoints
- Setup-Schritte für neue Entwickler
- Unterschiede: development / staging / production
