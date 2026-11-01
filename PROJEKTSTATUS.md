# Vokabeltrainer – Projektstatus

Stand: 1. November 2026. Paket 1: Speicherung, Sync und Import.

## Umgesetzt auf dem Arbeitsbranch

- CSV-/TSV-Dateien und Text mit Semikolon, Komma oder Tabulator; Kopfzeilen, BOM, mehrzeilige Felder und doppelte Anführungszeichen.
- Vorschau vor Datei-/Backup-Import, Dublettenprüfung und nachvollziehbare Zeilenfehler.
- Dialog „Vokabeln einfügen“: Einfügen speichert automatisch; Rückgängig entfernt nur die zuletzt dadurch erstellten Karten. Fehlerhafte Tabellen werden nicht teilweise übernommen.
- V2-Datenformat mit unveränderter V1-Kopie im bisherigen localStorage-Schlüssel, Sicherung vor Import und JSON-Export ohne Zugangsdaten.
- Geräteweise Gist-Dateien, Zusammenführung nach ID, Lernereignisse mit eigenen IDs, dauerhafte Löschmarkierungen und sichtbare HTTP-Fehler.
- Fachlogik, Speicherung und Oberfläche in drei kleinen JavaScript-Dateien; keine externen Laufzeitabhängigkeiten.
- Antwortsätze werden nicht mehr an Kommas zerlegt; auf Touch-Geräten wird die Tastatur beim Kartenwechsel nicht automatisch geöffnet.

## Validierung

37 Node-Tests bestanden, einschließlich vollständiger Script-Ladereihenfolge mit einer DOM-Testumgebung, Lernbewertung, Import/Undo und simuliertem gleichzeitigen Zwei-Geräte-Sync. JavaScript-Syntax geprüft.

Eine echte Browser-/Safari-/iPhone-Prüfung sowie ein Live-Test mit GitHub Gists stehen aus. Hier ließ sich kein lokaler HTTP-Server starten; die Browserrichtlinie verbietet file:-Vorschauen. Die DOM-Testumgebung ersetzt keine visuelle oder native Zwischenablage-Prüfung.

## Vor produktiver Übernahme prüfen

1. Auf Mac und iPhone je ein vorhandenes JSON-Backup sichern.
2. Neue Version auf beiden Geräten öffnen; dieselbe vorhandene Gist-ID verwenden. Alte App-Version nicht parallel zum neuen Sync benutzen.
3. Eine Karte auf jedem Gerät offline hinzufügen und bewerten, danach beide verbinden und erneut synchronisieren. Beide Karten und Lernereignisse müssen erhalten sein.
4. Auf iPhone und Mac Tabellen in den Dialog einfügen; einmal Rückgängig testen. CSV-Dateiauswahl, mehrzeilige Notizen, JSON-Download und Neustart prüfen.
5. Prüfen, dass ein fehlgeschlagener Upload als Fehler sichtbar bleibt.

## Grenzen

- V1-Karten enthalten keine zuverlässigen Änderungszeitpunkte. Unterschiedliche Alt-Lernstände lassen sich deshalb nicht historisch exakt rekonstruieren. Die Migration wählt bei gleichem Basiszeitpunkt den späteren Fälligkeitstermin; neue Lernereignisse bleiben einzeln erhalten.
- Bei V2 werden gleichzeitige Bewertungen beider Geräte chronologisch angewendet. Geräteuhren sollten stimmen.
- Geräte-Snapshots wachsen mit dem Lernverlauf. Unvollständige Gist-Antworten stoppen den Sync mit Fehlermeldung; große Archive benötigen später eine Aufteilung.
- LocalStorage bleibt durch Browser-/Gerätelöschung verlierbar. JSON-Backups ergänzen den Sync.
- Zuverlässiger Offline-Neustart mit Service Worker und Manifest ist noch nicht umgesetzt.

## Nächstes Paket

Warme, übersichtliche Oberfläche; kurze Runden mit etwa sechs Aufgaben, sichtbarem Ende, Pause/Wiedereinstieg; situationsbezogene Aufgaben; Modulfilter und Kartenbearbeitung. Dafür zunächst keine neue Datenbank oder Framework-Migration.

Vor jedem neuen Arbeitspaket Modell und Denkstärke nennen. Empfehlung für Paket 2: GPT-6.1-sol, hoch, sofern auswählbar.
