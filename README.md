# S7 Bibliothekskirche Gent

Website für Investoren und alle, die das Szenario S7 für die Redemptoristenkirche (Voskenslaan, Gent) verstehen wollen.

## Inhalt

| Datei | Zweck |
|---|---|
| `index.html` | Die Website: 3D-Modell, Schnitt, Grundrisse, Raumtypen, Wohnkonzept, Preise, Investoren, offene Punkte, FAQ |
| `model.html` | Das vollständige 3D-Modell (alle Szenarien) mit Einbettungsmodus für S7 |
| `js/rooms-data.js` | Die 72 Räume von S7 und die Wandumrisse der Kirche, aus dem Modell ausgelesen |
| `js/rooms3d.js` | 13 eigene Raummodelle im Maßstab (Puppenhaus-Ansicht) |
| `js/site.js` | Grundrisse, Schnitt, Diagramme, Rechner, Steuerung des Modells |

## Ansehen

Die Seite braucht einen Webserver (wegen des eingebetteten Modells), zum Beispiel:

```
python3 -m http.server 8000
```

und dann `http://localhost:8000` öffnen. Auf GitHub Pages läuft sie direkt aus dem Hauptverzeichnis.

## Steuerung des Modells

`model.html#embed=1&scen=s7` blendet die Seitenleiste aus und startet in S7. Die Website steuert das Modell per `postMessage({ s7: { cmd: ... } })`:

- `{ cmd: 'view', v: 'exterior' | 'xray' | 'section' }`
- `{ cmd: 'cam', v: 'sw' | 'ne' | 'west' | 'top' }`
- `{ cmd: 'explode', v: 0..1 }`
- `{ cmd: 'room', name: 'Student room 2.06', roam: false }`
- `{ cmd: 'tour', v: 's7' }` (deutscher Rundgang mit 12 Stationen)

Ohne `embed=1` verhält sich `model.html` wie das Original. Behoben wurde dabei ein Fehler im Original: Die Rundgang-Buttons suchten ein Element `tourRoot`, das es nicht gibt.

## Hinweise

Preise, Einnahmen und Betreiber sind Annahmen und nicht Teil der Studie. Maße und Flächen stammen aus dem 3D-Modell, das Grundriss und Schnitte der Studie (Miss Miyagi, 2026) nachzeichnet; es ist keine Vermessung.
