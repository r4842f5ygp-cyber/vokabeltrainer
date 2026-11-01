# Vokabeltrainer – Abschlussstand

Stand: 1. November 2026. Umsetzung der Haupt-App und der isolierten Vorschau fertig vorbereitet.

## Enthalten

- Kurze Runden mit bis zu sechs Aufgaben, fünf neue Karten täglich, Pause und Fortsetzen inklusive Antwortentwurf; keine Streak-Strafen oder automatische Endlosschleife.
- Leinen/Petroleum, helle dunkle Darstellung, optionale Eingabe, Audio normal oder langsam, Suche und Themenfilter, Kartenbearbeitung ohne Lernstandsverlust.
- CSV/TSV mit Vorschau, Fehlerprüfung, Dublettenprüfung; automatisches Einfügefenster mit Rückgängig.
- Eigene passende Alternativen direkt beim Lernen, Übernahme der getippten Antwort, Nuance, Audio, Bearbeiten und Entfernen. Antwortprüfung berücksichtigt Alternativen. JSON sowie CSV-Spalte Alternativen unterstützen sie. Zusammenführen bewahrt gleichzeitige Ergänzungen beider Geräte und Löschungen.
- Sechs optionale Originalpakete, 36 Karten mit Begriffen und Gesprächsformulierungen. Sachlich unterschiedliche Begriffe sind getrennte Karten. Die importierten Alt-Karten werden nicht umgeschrieben.
- Service Worker für vollständige lokale App-Dateien, Manifest, Versionshinweis und Update per Klick; getrennte Caches und lokale Speicherschlüssel für Vorschau und Haupt-App. Keine API- oder Zugangsdaten im Cache.
- Geräteweise Gist-Snapshots statt Auswahl nach Kartenanzahl; idempotente Lernereignisse, Löschmarkierungen, sichtbare Speicher-/HTTP-Fehler.
- Unveränderte V1-Daten bleiben als Sicherung erhalten und sind herunterladbar. Zusätzlich Sicherung vor jedem Import und JSON-Export.

## Validierung

55 Node-Tests bestanden. Abgedeckt sind App-Start, Import/Undo, Runden, Neustart, Alternativen einschließlich Bearbeiten und Löschen, deren Backup/CSV-Unterstützung, konkurrierende Ergänzungen, simulierte Geräte-Synchronisation und Netz-/Speicherfehler. Service-Worker-Tests prüfen vollständige Dateien, Navigation ohne Netzwerk im Testmodell, Scope-Trennung, API-Ausschluss und ausdrückliche Update-Aktivierung. Syntax und HTML-Struktur geprüft.

Die veröffentlichte Vorschau wurde zuvor im Browser geöffnet. Die finale Version wird nach Veröffentlichung nochmals geprüft. Ein echter Flugmodus-Neustart und Live-Gist-Abgleich auf den persönlichen Geräten sind aus dieser Umgebung nicht nachgewiesen. Tests mit simulierten Browser-/Netzfunktionen ersetzen keine native Safari-/iPhone-Prüfung.

## Persönlicher Abschlusstest

1. Auf Mac und iPhone neue Hauptversion online öffnen und auf Offline-Bereitschaft warten; bei bestehender Verbindung dieselbe Gist-ID weiterverwenden. Alte App-Version nicht parallel benutzen.
2. Als zusätzliche Sicherung „Sicherung vor dem Umstieg“ bzw. aktuelles JSON-Backup herunterladen.
3. Beim Lernen eine Alternative ergänzen, neu öffnen und ihre Erkennung testen.
4. Im Flugmodus App schließen und neu öffnen; danach wieder online beide Geräte synchronisieren und Änderungen vergleichen.

## Verbleibende Grenzen

- Alt-Daten enthalten keine verlässliche Änderungschronologie. Bei abweichenden alten Basisständen wird der spätere Fälligkeitstermin bevorzugt. Neue Ereignisse bleiben einzeln erhalten.
- Korrekte Geräteuhren sind für chronologische Bewertungen wichtig. Große Gist-Archive benötigen später Aufteilung; unvollständige Antworten stoppen den Sync.
- Browser können lokale Speicher und Offline-Caches löschen. Audio-/Spracherkennung hängt von Browser und vorhandenen Stimmen ab.
- Keine automatische KI-Prüfung selbst eingetragener Synonyme. Die ursprünglichen 41 importierten Karten sind nicht vollständig fachlich redigiert.
- Eigene Hörverständnis- und Rollenspielaufgaben bleiben optionale Erweiterungen, keine Voraussetzung für diesen Abschluss.

Vor weiteren Arbeitspaketen Modell und Denkstärke nennen. Empfehlung für Codeänderungen: GPT-6.1-sol, hoch, sofern verfügbar.
