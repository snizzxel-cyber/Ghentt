# S7 Library Church Ghent

A website for investors and anyone who wants to understand scenario S7 for the Redemptorist Church (Voskenslaan, Ghent).

## Contents

| File | Purpose |
|---|---|
| `index.html` | The website: 3D model, section, floor plans, room types, living concept, prices, investors, open points, FAQ |
| `model.html` | The full 3D model (every scenario) with an embed mode for S7 |
| `js/rooms-data.js` | The 72 rooms of S7 and the wall outlines of the church, read out of the model |
| `js/rooms3d.js` | 13 room models to scale (dollhouse view) |
| `js/site.js` | Floor plans, section, charts, calculators, model controls |
| `js/usp3d.js` | The "Why S7" band: the building as coloured layers that come apart on scroll |
| `plans/` | The five drawing sheets A-101 to A-105 (PNG, 150 dpi) and the PDF |

## Viewing

The page needs a web server (because of the embedded model), for example:

```
python3 -m http.server 8000
```

then open `http://localhost:8000`.

## Controlling the model

`model.html#embed=1&scen=s7` hides the side rail and starts in S7. The website controls the model with `postMessage({ s7: { cmd: ... } })`:

- `{ cmd: 'view', v: 'exterior' | 'xray' | 'section' }`
- `{ cmd: 'cam', v: 'sw' | 'ne' | 'west' | 'top' }`
- `{ cmd: 'explode', v: 0..1 }`
- `{ cmd: 'labels', v: true | false }`
- `{ cmd: 'room', name: 'Student room 2.06', roam: false }`
- `{ cmd: 'tour', v: 's7' }` (the cinematic fly-through with sun, shadows and sky)
- `{ cmd: 'tour', v: 's7walk' }` (a 12-stop walk through the building, room by room)
- `{ cmd: 'rotate', v: true | false }` (slow turn of the model, on at the start)

Without `embed=1`, `model.html` behaves like the original. One bug in the original was fixed: the tour buttons looked for an element `tourRoot` that does not exist.

## Notes

Prices, income and operators are assumptions and not part of the study. Sizes and areas come from the 3D model, which traces the plans and sections of the study (Miss Miyagi, 2026); it is not a survey.
