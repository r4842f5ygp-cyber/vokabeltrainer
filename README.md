# Vokabeltrainer

Persönlicher Deutsch–Englisch-Vokabeltrainer für Mac und iPhone. Statische Dateien, GitHub Pages und optionaler GitHub-Gist-Sync; keine Installation von Laufzeitpaketen nötig.

## Entwicklung

Tests mit Node.js 20 oder neuer:

```sh
npm test
```

Lokale Vorschau mit Python 3:

```sh
npm run serve
```

Danach `http://127.0.0.1:8765` öffnen. Die statischen Dateien müssen über dieselbe Origin bereitgestellt werden.

## Vokabeln hinzufügen

Unter **Karten → Vokabeln einfügen** Tabellen mit zwei oder drei Spalten einfügen. Der Dialog übernimmt gültige Karten automatisch. Dubletten werden anhand von Vorder- und Rückseite übersprungen; Großschreibung und zusätzliche Leerzeichen spielen dabei keine Rolle. Bei uneindeutigem Trennzeichen dieses im Dialog auswählen und „Inhalt hinzufügen“ drücken. „Letztes Einfügen rückgängig“ entfernt ausschließlich die Karten der letzten erfolgreichen Einfügeaktion.

CSV-/TSV-Dateien haben eine Vorschau vor der Übernahme. Erkannt werden Semikolon, Komma, Tabulator und übliche Kopfzeilen wie `Deutsch;Englisch;Notiz;Modul`. Mit Kopfzeilen kann auch die Reihenfolge variieren. Ohne Kopfzeile sind die ersten beiden Spalten Deutsch und Englisch; der Rest wird zur Notiz. UTF-8 sowie UTF-16 mit BOM werden gelesen. Bei anderen Kodierungen zuerst als UTF-8 exportieren.

## Daten und Sync

`core.js` enthält Validierung, CSV-Parser, Zusammenführung und Lernplanung. `data.js` speichert Daten und implementiert Importe sowie GitHub-Sync. `app.js` enthält die Lernoberfläche und Kartenverwaltung.

V2 speichert je Karte einen anfänglichen Lernstand und einzelne Bewertungsereignisse. Zusammenführen erhält alle Ereignis-IDs. Löschmarkierungen verhindern das Wiederauftauchen durch alte Snapshots. Pro Geräteinstallation wird ausschließlich die eigene Gist-Datei aktualisiert. Andere Geräte schreiben in andere Dateien. Beim Lesen werden alle Snapshots zusammengeführt. Parallel geöffnete Tabs verwenden, soweit verfügbar, Web Locks zur Serialisierung der Uploads.

Die alte Datei `wesentlich_vocab.json` wird gelesen, aber vom neuen Code nicht verändert. Token und Gist-ID bleiben lokal und sind nicht Teil des exportierten Backups. Ein Secret Gist ist für jeden mit der URL lesbar: ausschließlich Lernmaterial speichern.

JSON-Backups werden nach Karten-ID zusammengeführt; Löschmarkierungen eines V2-Backups werden dabei ebenfalls übernommen. Vor jedem Import wird eine lokale Sicherung angelegt, die über „Sicherung vor letztem Import“ heruntergeladen werden kann. Die V1-Kopie bleibt beim Umstieg unverändert erhalten. Ein V2-Backup ist nicht für die alte App-Version geeignet.

Aktuelle Prüfergebnisse, Migrationshinweise und noch ausstehende Arbeiten stehen in [PROJEKTSTATUS.md](PROJEKTSTATUS.md).
