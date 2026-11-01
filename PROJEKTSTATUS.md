# Vokabeltrainer – Projektstatus

Stand: 1. November 2026. Pakete 1 und 2: Speicherung, Sync, Import und kurze Lernrunden.

## Umgesetzt auf dem Arbeitsbranch

- CSV-/TSV-Dateien und Text mit Semikolon, Komma oder Tabulator; Kopfzeilen, BOM, mehrzeilige Felder und doppelte Anführungszeichen.
- Vorschau vor Datei-/Backup-Import, Dublettenprüfung und nachvollziehbare Zeilenfehler.
- Dialog „Vokabeln einfügen“: Einfügen speichert automatisch; Rückgängig entfernt nur die zuletzt dadurch erstellten Karten. Fehlerhafte Tabellen werden nicht teilweise übernommen.
- V2-Datenformat mit unveränderter V1-Kopie im bisherigen localStorage-Schlüssel, Sicherung vor Import und JSON-Export ohne Zugangsdaten.
- Geräteweise Gist-Dateien, Zusammenführung nach ID, Lernereignisse mit eigenen IDs, dauerhafte Löschmarkierungen und sichtbare HTTP-Fehler.
- Fachlogik, Speicherung und Oberfläche in drei kleinen JavaScript-Dateien; keine externen Laufzeitabhängigkeiten.
- Antwortsätze werden nicht mehr an Kommas zerlegt; auf Touch-Geräten wird die Tastatur beim Kartenwechsel nicht automatisch geöffnet.

## Validierung

47 Node-Tests bestanden, einschließlich vollständiger Script-Ladereihenfolge mit einer DOM-Testumgebung, Lernbewertung, Import/Undo und simuliertem gleichzeitigen Zwei-Geräte-Sync. JavaScript-Syntax geprüft.

Die separate Vorschau wurde mit ausdrücklicher Freigabe veröffentlicht und ihre Startseite im Browser aufgerufen. Die vollständige Safari-/iPhone-Bedienprüfung und ein Live-Test mit GitHub Gists stehen aus. Die DOM-Testumgebung ersetzt keine native Zwischenablage-, Audio- oder Geräteprüfung.

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

## Paket 2 umgesetzt

- Leinenfarbener Hintergrund, Petroleum-Akzente und hellere dunkle Darstellung; responsive Bedienelemente, reduzierte Bewegung und kontrastreiche Schriftfarben.
- Startseite mit Themenwahl; abgeschlossene Runden mit bis zu sechs Aufgaben. Wiederholungen haben Vorrang. Neue Karten sind auf fünf am lokalen Kalendertag begrenzt.
- Fortschrittsbalken, Pause und Fortsetzen nach Neustart mit Entwurf der Antwort. Eine laufende Runde wird bei Verlassen der App pausiert. Bewertungen haben pro Rundenposition eine feste ID, sodass nach einem Absturz dieselbe Position nicht nochmals bewertet wird.
- Antwort zunächst selbst überlegen, Eingabe optional aufklappen. Audio startet ausschließlich auf Wunsch und kann langsamer abgespielt werden.
- Abschluss zeigt die Zahl der Aufgaben und die eigenen Bewertungen; kein Countdown, keine Streak-Strafe und kein automatischer Start der nächsten Runde.
- Drei optionale Originalpakete mit insgesamt 18 Karten: Körper wahrnehmen, Kontakt halten, Wünsche klären. Kein Import ohne Klick. Mischung aus Begriffen und Gesprächsformulierungen; noch keine separate Hörverständnis- oder Rollenspielprüfung.
- Suche, Themenfilter und Bearbeitung erhalten Lernstände. Alte Modulangaben in eckigen Klammern werden für die Themenwahl erkannt.
- Die laufende Runde ist gerätelokal; Karten und Bewertungen synchronisieren weiterhin. Die zuletzt angezeigte Karte wird beim Cloud-Abruf während einer Antwort nicht ersetzt.

Zusätzlich manuell prüfen: Darstellung bei 320/390/800 Pixeln, Hell/Dunkel, iPhone-Tastatur, Dialogfokus, Audio und langsame Wiedergabe, Hintergrundpause, Paketwahl und neue Themenfilter.

## Veröffentlichungsstand

Die separate Vorschau unter https://r4842f5ygp-cyber.github.io/vokabeltrainer/vorschau/ ist veröffentlicht (PR 2). Ihre Speicherschlüssel sind getrennt; Cloud-Sync ist abgeschaltet. Das neue Hauptprogramm einschließlich Sync liegt weiterhin in PR 1 als Entwurf vor. Die vorhandene Haupt-App wurde nicht durch die neue Fassung ersetzt.

## Nächstes Arbeitspaket: passende Alternativen

Vom Nutzer verbindlich aufgenommen:

- Pro Karte mehrere kontextuell passende vollständige englische Formulierungen speichern, optional mit Bedeutungsnuance.
- Beim Üben nach Aufdecken unter „Auch passend“ anzeigen; Alternativen einzeln anhören, bearbeiten und entfernen.
- „Alternative ergänzen“ direkt auf der Lernkarte; alternativ die bereits getippte Antwort übernehmen.
- Alle gespeicherten passenden Alternativen bei der Antwortprüfung akzeptieren. Synonyme nicht ungeprüft gleichsetzen.
- Lernhistorie und aktuelle Runde erhalten; Alternativen in Sicherungen, CSV-Konzept und späterem Geräte-Sync berücksichtigen.
- Beispiel: „to long for connection“ / „to yearn for connection“; yearn oft intensiver und gehobener.
- Oberfläche zunächst kompakt; Ergänzungsformular bei Bedarf aufklappen.
- Zunächst in der separaten Vorschau testen, anschließend in das Hauptprogramm übernehmen.

## Weitere offene Arbeiten, in Reihenfolge

1. Bedienungsfeedback aus der Vorschau sammeln und Fehler beheben.
2. Offline-Neustart mit Service Worker, Manifest und nachvollziehbaren Versionsupdates umsetzen und im Flugmodus prüfen.
3. Live-Sync auf Mac und iPhone mit getrennten Offline-Änderungen, Bewertungen und Löschungen prüfen; vorher je Gerät sichern.
4. Bestehendes Vokabelmaterial sprachlich prüfen, mehrdeutige Sammelkarten aufteilen und Pakete gezielt erweitern.
5. Nach erfolgreicher Prüfung die neue Fassung in die Haupt-App übernehmen.
6. Optional danach: eigene Hörverständnis- und freie Formulierungsaufgaben.

Vor jedem neuen Arbeitspaket Modell und Denkstärke nennen. Empfehlung für die nächste technische Prüfung: GPT-6.1-sol, hoch, sofern auswählbar.
