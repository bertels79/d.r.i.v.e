# D.R.I.V.E. v1.1

**Donnerfaust Raucherei Inventory & Verwaltung Engine**

## Neu in v0.5.1 – Lieferantenverwaltung

Der Einkaufsbereich besitzt jetzt eigene Lieferanten-Stammdaten.

Gespeichert werden:

- Name / Firma
- Ansprechpartner
- Telegram-Nummer bzw. Telegram-Kennung
- Notiz
- Status Aktiv / Deaktiviert

Über **„Lieferanten verwalten“** können Lieferanten angelegt, bearbeitet, deaktiviert und wieder aktiviert werden.

Beim Einkauf wird der Lieferant jetzt aus einer Liste ausgewählt. Direkt in der Einkaufsmaske gibt es außerdem **„+ Neu“**, um schnell einen neuen Lieferanten anzulegen.

Nur aktive Lieferanten können für neue Einkäufe verwendet werden.

Bei einer Einkaufsbuchung speichert D.R.I.V.E. zusätzlich Name, Ansprechpartner und Telegram-Angabe als Schnappschuss. Alte Einkäufe bleiben dadurch nachvollziehbar, auch wenn Lieferantendaten später geändert werden.

## Versionierung

- v0.1 – Grundgerüst und Design
- v0.2 – Mitarbeiter
- v0.3 – Lager, Rohstoffe, Produkte und Rezepte
- v0.3.1 – Dialogfenster
- v0.4 – Produktion
- v0.5 – Einkauf
- v0.5.1 – Lieferantenverwaltung


## Änderung v0.5.2 – Einkauf

- „Einkauf erfassen“ bleibt die klar hervorgehobene Hauptaktion.
- „Lieferanten verwalten“ bleibt direkt im Einkaufsbereich erreichbar, ist jetzt aber kleiner und optisch dezenter als Nebenaktion.
- Zwischen beiden Aktionen ist mehr Abstand, damit die Gewichtung eindeutig ist.

## Für später vorgemerkt – Einstellungen / Rechteverwaltung

Die eigentliche Rollen- und Rechteverwaltung wird erst im Modul **Einstellungen** umgesetzt. Geplant sind frei benennbare Rollen mit einzelnen Ein-/Aus-Berechtigungen. Diese Rollen sollen anschließend Mitarbeitern zugewiesen werden können. Dadurch kann später z. B. gesteuert werden, ob eine Rolle Mitarbeiter anlegen, Lieferanten verwalten, Rohstoffe hinzufügen oder Produkte bearbeiten darf.

Außerdem bleibt die Frage **Zigarettenpapier: Einkauf oder Herstellung aus 3 × Holz?** bis zur fachlichen Klärung offen. Die bestehende Logik wurde in v0.5.2 deshalb nicht verändert.


## Neu in v0.6 – Verkauf

Das Verkaufsmodul ist jetzt funktionsfähig.

- Mitarbeiter auswählen
- Kunde optional erfassen
- ausschließlich aktive Produkte verkaufen
- Verkaufspreis wird aus den Produkt-Stammdaten übernommen und kann beim Vorgang angepasst werden
- Menge erfassen
- Zahlungsstatus: Bezahlt, Rechnung oder Offen
- bei Rechnung/Offen kann ein Fälligkeitsdatum hinterlegt werden
- Lagerbestand wird beim Verkauf automatisch reduziert
- Verkauf wird verhindert, wenn der Bestand nicht ausreicht
- bezahlte Verkäufe erzeugen einen Kasseneingang
- offene Verkäufe erscheinen als offene Forderungen
- Rechnung/Offen kann später als bezahlt markiert werden; dann entsteht der Kasseneingang
- Verkaufsbuch mit Suche und Statusfilter
- Tageskennzahlen für Vorgänge, Einnahmen und verkaufte Stück

Die Rollen- und Rechteverwaltung bleibt weiterhin für das spätere Einstellungsmodul vorgemerkt.
Die fachliche Frage zu Zigarettenpapier (Kauf oder Herstellung aus Holz) bleibt unverändert offen.


## Korrektur v0.6.1 – Verkaufsansicht

Die Verkaufslogik aus v0.6 wurde nicht verändert.

Korrigiert wurden ausschließlich Darstellung und Layout:

- Verkaufsseite verwendet jetzt dieselbe Seitenstruktur wie Einkauf und Produktion.
- Kennzahlen werden wieder als vier saubere Karten dargestellt.
- Verkaufsbuch besitzt wieder normale Höhe, Abstände und Filterdarstellung.
- Das Verkaufsfenster nutzt dieselben historischen Formularfelder wie die übrigen D.R.I.V.E.-Dialoge.
- Vorschau für Bestand, Gesamterlös und Kassenwirkung wird wieder als Kartenblock dargestellt.
- Mobile Darstellung wurde ebenfalls angepasst.


## Neu in v0.7 – Kasse

Das Kassenmodul ist jetzt funktionsfähig.

### Automatische Buchungen

Bereits vorhandene bezahlte Geschäftsvorgänge werden übernommen:

- bezahlter Verkauf → Kasseneinnahme
- bezahlter Einkauf → Kassenausgabe
- offene Rechnung / offene Zahlung → noch keine Kassenbewegung
- wird eine offene Zahlung später als bezahlt markiert, entsteht erst dann die Kassenbewegung

### Kassenstart

Über **„Kassenstart festlegen“** kann ein Anfangsbestand eingetragen werden.

Der Startbestand zählt nicht als Einnahme oder Ausgabe, sondern bildet die Grundlage für den laufenden Kassenstand.

### Manuelle Buchungen

Über **„Buchung erfassen“** können zusätzliche Vorgänge eingetragen werden:

- manuelle Einnahme
- manuelle Ausgabe
- Betrag
- Beschreibung
- optionale Notiz

### Kassenbuch

Das Kassenbuch zeigt:

- Datum / Uhrzeit
- Art des Vorgangs
- Beschreibung
- Einnahme
- Ausgabe
- laufenden Kassenstand nach jeder Buchung
- Suche
- Filter Einnahmen / Ausgaben

### Tagesübersicht

- aktueller Kassenstand
- Einnahmen heute
- Ausgaben heute
- Anzahl Kassenbewegungen heute


## Korrektur v0.7.1 – Übersicht & Kassenbeschreibung

Die Startseite verwendet jetzt echte Live-Daten statt Demo-Werte.

### Übersicht

Jetzt live verbunden:

- aktueller Kassenstand
- Einnahmen heute
- Ausgaben heute
- offene Forderungen aus Verkäufen
- offene Verbindlichkeiten aus Einkäufen
- offene Provisionen
- heutige Produktionsmenge
- bis zu drei heute produzierte Produkte
- echte Lagerwarnungen anhand Mindestbestand

### Kassenbuch

Der Fehler **[object Object]** bei Lieferantenbezeichnungen wurde korrigiert. Bei Einkaufsbuchungen wird jetzt der Lieferantenname sauber angezeigt.


## Neu in v0.8 – Provisionen

Das Provisionsmodul ist jetzt funktionsfähig.

- Provisionssatz pro aktivem Mitarbeiter einstellbar
- Provisionen werden aus Verkäufen berechnet
- bereits entstandene Provisionen behalten den zum Zeitpunkt der Berechnung gültigen Satz
- Übersicht je Mitarbeiter mit Verkaufsumsatz, offenen und ausgezahlten Provisionen
- Provisionsbuch mit Suche und Statusfilter
- offene Provisionen können je Mitarbeiter gesammelt ausgezahlt werden
- eine Provisionsauszahlung erzeugt automatisch eine Kassenausgabe
- die Übersicht zeigt weiterhin die Summe der offenen Provisionen live an

Die spätere Rollen- und Rechteverwaltung bleibt für das Einstellungsmodul vorgemerkt.


## Neu in v0.9 – Journal

Das Journal ist jetzt als zentrale Chronik eingebaut.

Es fasst automatisch zusammen:

- Einkäufe
- Verkäufe
- Produktionen
- manuelle Kassenbewegungen
- Lagerkorrekturen
- ausgezahlte Provisionen

### Funktionen

- chronologische Sortierung nach Datum und Uhrzeit
- Bereichskennzeichnung je Vorgang
- Mitarbeiter wird angezeigt, sofern vorhanden
- Beträge werden als Einnahme oder Ausgabe gekennzeichnet
- Suche über Titel, Beschreibung und Mitarbeiter
- Filter nach Einkauf, Verkauf, Produktion, Kasse, Lager und Provisionen
- Schaltfläche „Heute“
- Tageskennzahlen für alle Vorgänge, Einkäufe, Verkäufe und Produktionen

Das Journal erzeugt keine eigenen Geschäftsdaten, sondern liest die bereits vorhandenen Module zusammen.


## Neu in v0.10 – Einstellungen / Rollen & Rechte

Die besprochene Rollenverwaltung ist jetzt eingebaut.

### Rollen

- frei benennbare Rollen
- Beschreibung pro Rolle
- Standardrolle **Geschäftsinhaber** mit Vollzugriff
- eigene Rollen anlegen, bearbeiten und löschen
- Rechte werden einzeln über Ein-/Aus-Schieberegler gesetzt

### Berechtigungen

Unter anderem getrennt steuerbar:

- Mitarbeiter verwalten
- Lager sehen
- Rohstoffe verwalten
- Produkte und Rezepturen verwalten
- Lager korrigieren
- Produktion sehen / erfassen
- Einkauf sehen / erfassen
- Lieferanten verwalten
- Verkauf sehen / erfassen
- Kasse sehen / verwalten
- Provisionen sehen / verwalten
- Journal sehen
- Einstellungen und Rollen verwalten

### Mitarbeiterzuweisung

Jeder Mitarbeiter kann in den Einstellungen einer gespeicherten Rolle zugeordnet werden.

### Wichtig zum aktuellen lokalen Prototyp

Die Rollen und Berechtigungen werden vollständig gespeichert. Da die aktuelle HTML-Testversion noch kein echtes Login besitzt, wird noch kein Mitarbeiter automatisch als aktuell angemeldeter Benutzer angenommen. Deshalb sperrt v0.10 beim bloßen Öffnen der lokalen Datei nicht versehentlich Bereiche aus.

Die Rechteprüfung ist bereits vorbereitet: Sobald später ein echter Benutzer-/Login-Kontext vorhanden ist, können Menüpunkte und Aktionsknöpfe anhand der zugewiesenen Rolle automatisch ausgeblendet werden.


## Korrektur v0.10.1 – Mitarbeiterrollen

Diese Version basiert wieder vollständig auf der funktionierenden **v0.10**.

Geändert wurden ausschließlich:

- „Provisionssatz in %“ aus der Mitarbeiter-Maske entfernt
- „Rolle“ direkt beim Anlegen/Bearbeiten eines Mitarbeiters hinzugefügt
- Mitarbeiterliste zeigt nun die zugewiesene Rolle statt des alten Provisionssatzes
- Rollen werden aus der bestehenden Rollenverwaltung geladen
- Rollenzuweisung wird beim Speichern des Mitarbeiters gespeichert
- bestehende übrige Module und deren JavaScript-Initialisierung wurden nicht verändert

Wichtig: Beim Laden der Seite greift die Mitarbeiterverwaltung nicht mehr auf später deklarierte Rollen-Variablen zu. Dadurch bleibt die komplette Anwendung startfähig.


## Änderungen v0.10.2

### Mitarbeiter kündigen

- In der Mitarbeiterverwaltung gibt es jetzt **„Kündigen“**.
- Nach der Kündigung wird der Mitarbeiter auf **inaktiv** gesetzt.
- Gekündigte Mitarbeiter erscheinen nicht mehr in der Mitarbeiterliste.
- Sie erscheinen nicht mehr in Produktion, Einkauf, Verkauf oder Rollen-Zuweisungen.
- Historische Buchungen behalten den bereits gespeicherten Namen, damit alte Vorgänge nachvollziehbar bleiben.
- Die Rollenzuweisung des gekündigten Mitarbeiters wird entfernt.

### Übersicht

Die großen Kennzahlen auf der Übersichtsseite wurden deutlich vergrößert und an die übrigen Kennzahlenkarten der App angepasst.

### Kundenverwaltung im Verkauf

- **Kunden verwalten** direkt im Verkaufsbereich
- Kunde anlegen, bearbeiten, deaktivieren und wieder aktivieren
- Name
- Telegram-Nummer
- Notiz
- Kunde beim Verkauf aus einer Liste auswählen
- **+ Neu** direkt im Verkaufsformular
- Laufkundschaft / kein Kunde bleibt weiterhin möglich
- Verkaufsbuchungen speichern zusätzlich einen Schnappschuss des Kundennamens und der Telegram-Angabe


## Änderung v0.10.3

Die Maske **Kunde anlegen / Kunden verwalten** verwendet jetzt dieselbe Modal-, Raster- und Formularstruktur wie **Lieferant anlegen / Lieferanten verwalten**. Die Kundenfelder und die Kundenlogik bleiben erhalten.

## Änderung v0.10.4

Die Kundenverwaltung entspricht jetzt auch **inhaltlich** der Lieferantenverwaltung:
Name/Firma, Ansprechpartner, Telegram-Nummer und Notiz. Auch die Kundentabelle enthält die Ansprechpartner-Spalte.


# D.R.I.V.E. v1.0 – Erster vollständiger Stand

v1.0 basiert auf dem stabilen Stand v0.10.4.

Enthalten sind:

- Übersicht mit Live-Kennzahlen und echten letzten Journal-Einträgen
- Mitarbeiterverwaltung mit Rollen und Kündigen
- Lager, Rohstoffe, Produkte, Rezepturen und Korrekturen
- Produktion mit Rezeptprüfung und automatischer Lagerbewegung
- Einkauf mit Lieferantenverwaltung, Rechnungen und offenen Zahlungen
- Verkauf mit Kundenverwaltung, Rechnungen und offenen Forderungen
- Kasse mit Startbestand, automatischen und manuellen Buchungen
- Provisionen mit Mitarbeiter-Sätzen und Auszahlungen
- zentrales Journal
- Einstellungen mit Rollen- und Rechteverwaltung

## Abschlusskorrekturen für v1.0

- die letzten verbliebenen Demo-Journalzeilen auf der Übersicht wurden entfernt
- „Letzte Einträge“ verwendet nun echte Journal-Daten
- vorbereitete Rechteprüfung für den Menüpunkt Einkauf wurde auf `purchases` korrigiert
- Kundenverwaltung besitzt nun eine eigene Berechtigung
- die gesperrte Systemrolle Geschäftsinhaber erhält bei neuen Berechtigungen automatisch Vollzugriff

Die lokale Test-/Desktopversion speichert weiterhin im Browser. Die vorbereitete Supabase-Konfiguration ist noch nicht verbunden.


# D.R.I.V.E. v1.1 – Supabase

v1.1 verbindet die bisherige Browser-App mit der zentralen Supabase-Datenbank.

## Verhalten

- vorhandene lokale Daten werden bei einer noch leeren Supabase-Tabelle als Startbestand übernommen
- danach werden Mitarbeiter, Lager, Produkte, Produktion, Lieferanten, Einkäufe, Kunden, Verkäufe, Kasse, Provisionen und Rollen zentral gespeichert
- beim Öffnen der App werden die zentralen Daten geladen
- alle 10 Sekunden sowie beim erneuten Aktivieren des Browserfensters wird der gemeinsame Stand aktualisiert
- lokale Browser-Speicherung bleibt als Ausfallsicherung erhalten
- es gibt keinen zusätzlichen D.R.I.V.E.-Login

## Sicherheit

Im Frontend befindet sich ausschließlich der Supabase Publishable Key. Kein Secret Key und kein Service-Role-Key wird verwendet.

Da D.R.I.V.E. bewusst ohne Benutzeranmeldung betrieben wird, erlauben die für v1.1 angelegten RLS-Regeln dem anonymen Client Lesen und Schreiben. Die Webadresse sollte deshalb nur an die vorgesehenen Nutzer weitergegeben werden.
