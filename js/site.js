/* S7 website: plans and section drawn from the model data, room types, living, renting and investor tools. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var ROOMS = window.S7_ROOMS || [], TRACE = window.S7_TRACE || { classes: [], columns: [] };
  var nf = new Intl.NumberFormat('de-DE'), nf1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }), nf2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function eur(v) { return nf.format(Math.round(v)) + ' €'; }
  function m(v, d) { return (d === 2 ? nf2 : nf1).format(v); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function svg(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  /* ================= categories ================= */
  var CAT = {
    pub: { name: 'Bibliothek und öffentlich', v: '--c-pub' },
    cafe: { name: 'Café', v: '--c-cafe' },
    live: { name: 'Wohnen', v: '--c-live' },
    learn: { name: 'Lernen', v: '--c-learn' },
    comm: { name: 'Gemeinschaft', v: '--c-comm' },
    serv: { name: 'Sanitär und Service', v: '--c-serv' },
    circ: { name: 'Treppen und Aufzug', v: '--c-circ' }
  };
  function catOf(r) {
    if (/^Café|Take-away/.test(r.name)) return 'cafe';
    if (/Organ gallery/.test(r.name)) return 'pub';
    return { library2: 'pub', stacks: 'pub', lobby: 'pub', studysm: 'learn', student: 'live', commkitchen: 'comm', terrace7: 'comm', wc1: 'serv', wc3: 'serv', wc3w: 'serv', locker: 'serv', bikes: 'serv', core: 'circ', storage: 'cafe', lounge: 'pub' }[r.type] || 'circ';
  }
  function cv(cat) { return 'var(' + CAT[cat].v + ')'; }

  /* ================= German names and texts ================= */
  function de(n) {
    var r;
    if ((r = n.match(/^Student room (\d\.\d\d)/))) return 'Zimmer ' + r[1];
    if ((r = n.match(/^Study room (\d\.\d\d)/))) return 'Lernraum ' + r[1];
    if ((r = n.match(/^Locker room (\d)/))) return 'Schließfachraum ' + r[1];
    if ((r = n.match(/^Toilets and showers, (men|women), level \+(\d)/))) return (r[1] === 'men' ? 'Bad Herren' : 'Bad Damen') + ', Ebene +' + r[2];
    if (/^Lift/.test(n)) return 'Aufzug';
    if (/^Stair, (ground floor|level \+\d)$/.test(n)) return 'Treppe Glasflügel';
    if (/^Stair, south aisle/.test(n)) return 'Treppe Südschiff';
    if (/^Stair, north aisle/.test(n)) return 'Treppe Nordschiff';
    return {
      'Entrance and book return': 'Eingang und Buchrückgabe',
      'Café inside: second order point and seating': 'Café im Chor',
      'Library reading hall': 'Lesesaal',
      'Book stacks, south aisle west': 'Büchermagazin Süd, West',
      'Book stacks, south aisle east': 'Büchermagazin Süd, Ost',
      'Book stacks, north aisle': 'Büchermagazin Nord',
      'Toilet, men': 'WC Herren', 'Toilet, women': 'WC Damen',
      'Community kitchen and dining hall': 'Gemeinschaftsküche',
      'Organ gallery, reading balcony': 'Orgelempore, Lesebalkon',
      'Roof terrace, about 14 m²': 'Dachterrasse an der Küche',
      'Café storage, whole level +1 (transponder access)': 'Café-Lager (nur Personal)',
      'Roof terrace on the café building, about 67 m²': 'Dachterrasse Cafégebäude',
      'Take-away café': 'Take-away-Café', 'Café storage': 'Lager Café', 'Bicycle parking': 'Fahrradraum'
    }[n] || n;
  }
  function shortLbl(r) {
    var n = de(r.name), k;
    if ((k = n.match(/^(Zimmer|Lernraum) (\d\.\d\d)/))) return k[2];
    if (/^Schließfachraum/.test(n)) return 'Fächer';
    if (/^Bad (Herren|Damen)/.test(n)) return n.indexOf('Herren') > 0 ? 'Bad H' : 'Bad D';
    if (/^Treppe/.test(n)) return 'Treppe';
    if (/^Büchermagazin/.test(n)) return 'Magazin';
    if (n === 'Eingang und Buchrückgabe') return 'Eingang';
    if (n === 'Café-Lager (nur Personal)') return 'Café-Lager';
    if (n === 'Dachterrasse an der Küche') return 'Terrasse';
    if (n === 'Orgelempore, Lesebalkon') return 'Lesebalkon';
    if (n === 'WC Herren') return 'WC H'; if (n === 'WC Damen') return 'WC D';
    return n;
  }
  var TYPE_DE = {
    student: 'Einzelzimmer zum Wohnen: Bett, Schreibtisch, Regal und Schrank. Die Tür ist eine Brandschutztür EI30. Bäder und Küche werden geteilt.',
    studysm: 'Kleiner Raum zum Lernen, nicht zum Wohnen: Schreibtisch, Stuhl, Regal und Sessel. Buchbar für Bewohner und Nutzer der Bibliothek.',
    library2: 'Der offene Lesesaal im Hauptschiff mit langen Tischen, Regalen um die Pfeiler und zwei Reihen freistehender Regale. Der Fliesenboden bleibt sichtbar.',
    stacks: 'Regale der Bibliothek im Seitenschiff, unter der Galerie der Lernräume.',
    lobby: 'Haupteingang im Glasflügel: Portal mit zwei Schiebetüren, Vordach, Buchrückgabe, Aufzug und Treppe. Eine 2,2 m breite Öffnung führt in den Chor.',
    commkitchen: 'Die einzige Küche des Hauses, für alle 20 Bewohner: 11 m Küchenzeile mit Kochfeldern und Spülen, zwei Inseln mit Hockern, fünf Esstische und Sofas unter dem First.',
    terrace7: 'Dachterrasse für die Bewohner, mit Glasbrüstung, Tischen und Pflanzen. Erreichbar mit Aufzug ohne Stufe.',
    wc1: 'Einzel-WC mit Waschbecken für Besucher der Bibliothek.',
    wc3: 'Drei WCs, drei Waschbecken und zwei bodengleiche Duschen für die Bewohner dieser Ebene.',
    wc3w: 'Drei WCs, drei Waschbecken und zwei bodengleiche Duschen für die Bewohnerinnen dieser Ebene.',
    locker: 'Schließfächer, Bank und Spiegel für Besucher der Bibliothek, als Raum im Raum im Nordschiff.',
    bikes: 'Fahrradraum mit etwa 60 Plätzen im eingeschossigen Neubau an der Südwestecke.',
    core: 'Treppe oder Aufzug. Die Treppen in den Seitenschiffen führen nur bis Ebene +1; Aufzug und Treppe im Glasflügel erreichen alle Ebenen.',
    takeaway: 'Take-away-Café im Erdgeschoss des Neubaus: Theke, Kaffeemaschine, Bistrotische und ein Lager. Für Studierende, Nachbarn und Pendler.',
    storage: 'Lager des Cafés. Die ganze Ebene +1 des Cafégebäudes ist eine Lagerhalle, nur mit Transponder durch eine Brandschutztür erreichbar.',
    lounge: 'Aufenthaltsbereich.'
  };
  function descOf(r) {
    if (/^Café inside/.test(r.name)) return 'Zweiter Bestellpunkt des Cafés auf dem ehemaligen Chorpodium. Eine Glaswand mit Glastür trennt ihn vom Lesesaal, damit es dort ruhig bleibt. Der Chorboden ist ohne Stufe gezeichnet.';
    if (/^Organ gallery/.test(r.name)) return 'Die Orgelempore bleibt erhalten und wird ein ruhiger Lesebalkon mit Blick in das Kirchenschiff. Der Flur der Ebene +2 endet hier.';
    return TYPE_DE[r.type] || '';
  }
  var LVS = [
    { key: 'Ground floor', tab: 'EG', y: 0, name: 'Erdgeschoss', text: 'Öffentlich: Lesesaal, Büchermagazine, Café im Chor, Take-away-Café, Eingang, Fahrradraum.' },
    { key: 'Level +1', tab: '+1', y: 2.9, name: 'Ebene +1', text: 'Lernen: 14 Lernräume auf den Galerien der Seitenschiffe, das Café-Lager im Neubau.' },
    { key: 'Level +2', tab: '+2', y: 5.6, name: 'Ebene +2', text: 'Wohnen: 10 Zimmer am Mittelflur, der Lesebalkon auf der Orgelempore, Bäder im Cafégebäude.' },
    { key: 'Level +3', tab: '+3', y: 9.0, name: 'Ebene +3', text: 'Wohnen: 10 Zimmer am Mittelflur, das letzte Joch bleibt offen, Bäder im Cafégebäude.' },
    { key: 'Level +4', tab: '+4', y: 12.3, name: 'Ebene +4', text: 'Gemeinsam: Gemeinschaftsküche unter dem First, zwei Dachterrassen.' }
  ];
  function lvOf(key) { for (var i = 0; i < LVS.length; i++) if (LVS[i].key === key) return LVS[i]; return LVS[0]; }

  /* ================= model iframe ================= */
  var frame = $('#model'), modelReady = false, queue = [];
  function send(cmd) {
    if (!frame || !frame.contentWindow) return;
    if (!modelReady) { queue.push(cmd); return; }
    try { frame.contentWindow.postMessage({ s7: cmd }, '*'); } catch (e) {}
  }
  function onReady() {
    if (modelReady) return; modelReady = true; $('#modelLoad').hidden = true;
    var q = queue; queue = []; q.forEach(send);
  }
  window.addEventListener('message', function (e) { if (e.source === (frame && frame.contentWindow) && e.data && e.data.s7ready) onReady(); });
  if (frame) {
    frame.addEventListener('load', function () { setTimeout(function () { if (!modelReady) { try { if (frame.contentWindow.S7API) onReady(); } catch (x) {} } }, 1500); });
    setTimeout(function () { if (!modelReady) { var l = $('#modelLoad'); l.innerHTML = '<span style="max-width:40ch;text-align:center;padding:16px">Das 3D-Modell braucht WebGL und eine Internetverbindung (three.js). <a href="model.html#scen=s7" target="_blank" rel="noopener">Modell direkt öffnen ↗</a></span>'; } }, 25000);
  }
  // the transparent cover keeps the page scrolling over the model until the visitor clicks into it
  var cover = $('#modelCover'), stage = $('#modelStage');
  function uncover() { if (cover) cover.hidden = true; }
  if (cover) {
    cover.addEventListener('click', uncover);
    stage.addEventListener('mouseleave', function () { if (window.matchMedia('(hover:hover)').matches) cover.hidden = false; });
  }
  function toModel(cmd) {
    var t = $('#modell .model-box');
    if (t) t.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    uncover(); send(cmd);
  }
  function press(group, btn) { $$('button', group).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); }); }
  $$('#segView button').forEach(function (b) {
    b.addEventListener('click', function () {
      press($('#segView'), b);
      if (b.dataset.view === 'explode') send({ cmd: 'explode', v: 1 });
      else send({ cmd: 'view', v: b.dataset.view, ex: 0, cam: b.dataset.view === 'section' ? null : 'sw' });
      if (b.dataset.view !== 'section') press($('#segCam'), $('#segCam button[data-cam="sw"]'));
    });
  });
  $$('#segCam button').forEach(function (b) { b.addEventListener('click', function () { press($('#segCam'), b); send({ cmd: 'cam', v: b.dataset.cam }); }); });
  $$('[data-tour]').forEach(function (b) { b.addEventListener('click', function () { toModel({ cmd: 'tour', v: 's7' }); }); });

  /* ================= nav highlight ================= */
  (function () {
    var links = $$('.nav a'), map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if (!window.IntersectionObserver) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting && map[e.target.id]) { links.forEach(function (a) { a.classList.remove('on'); }); map[e.target.id].classList.add('on'); } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { io.observe(s); });
  })();

  /* ================= tooltip ================= */
  var tip = $('#tip');
  function showTip(e, html) { tip.innerHTML = html; tip.hidden = false; moveTip(e); }
  function moveTip(e) { var x = e.clientX + 14, y = e.clientY + 14, w = tip.offsetWidth, h = tip.offsetHeight; if (x + w > innerWidth - 8) x = e.clientX - w - 14; if (y + h > innerHeight - 8) y = e.clientY - h - 14; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
  function hideTip() { tip.hidden = true; }
  function bindTip(el, html) { el.addEventListener('pointerenter', function (e) { showTip(e, html); }); el.addEventListener('pointermove', moveTip); el.addEventListener('pointerleave', hideTip); }

  /* ================= section drawing ================= */
  var SLOPE = (18.2 - 12.5) / 5.2;
  function ry(z) { return 18.2 - Math.abs(z) * SLOPE; }
  var LAYERS = [
    { id: 4, lv: '+4', h: '12,30 m', cat: 'comm', t: 'Gemeinsam', p: 'Gemeinschaftsküche etwa 130 m² unter dem First, Dachterrasse 14 m² in der Südseite des Dachs und 67 m² auf dem Cafégebäude.', key: 'Level +4' },
    { id: 3, lv: '+3', h: '9,00 m', cat: 'live', t: 'Wohnen', p: '10 Zimmer am Mittelflur, Gauben im Dach. Das letzte Joch bleibt offen, mit Blick auf die Orgel.', key: 'Level +3' },
    { id: 2, lv: '+2', h: '5,60 m', cat: 'live', t: 'Wohnen', p: '10 Zimmer am Mittelflur, auf den Bögen der Arkaden. Der Flur endet am Lesebalkon auf der Orgelempore.', key: 'Level +2' },
    { id: 1, lv: '+1', h: '2,90 m', cat: 'learn', t: 'Lernen', p: '14 Lernräume auf den Galerien der Seitenschiffe, erreichbar über je eine Treppe am Westende.', key: 'Level +1' },
    { id: 0, lv: 'EG', h: '±0,00 m', cat: 'pub', t: 'Öffentlich', p: 'Lesesaal unter den Wohnebenen, Büchermagazine in den Seitenschiffen, Café im Chor und Take-away-Café im Neubau.', key: 'Ground floor' }
  ];
  function drawSection() {
    var s = $('#sectionSvg'); if (!s) return;
    var Y = function (y) { return 18.8 - y; };   // svg y from height
    var g0 = svg('g', {}, s);
    function poly(pts, attrs, par) { return svg('polygon', Object.assign({ points: pts.map(function (p) { return p[0] + ',' + Y(p[1]); }).join(' ') }, attrs), par || g0); }
    function rect(z0, z1, y0, y1, attrs, par) { return svg('rect', Object.assign({ x: Math.min(z0, z1), y: Y(Math.max(y0, y1)), width: Math.abs(z1 - z0), height: Math.abs(y1 - y0) }, attrs), par || g0); }
    function text(z, y, t, cls, size, anchor, par) { var e = svg('text', { x: z, y: Y(y), 'class': cls, 'font-size': size, 'text-anchor': anchor || 'middle' }, par || g0); e.textContent = t; return e; }
    // ground and sky
    rect(-10.6, 15.4, -0.9, 0, { fill: 'var(--surface-2)' });
    svg('line', { x1: -10.6, x2: 15.4, y1: Y(0), y2: Y(0), stroke: 'var(--ink)', 'stroke-width': 0.06 }, g0);
    // layers (rooms), each in its own group
    var LG = {};
    LAYERS.forEach(function (L) { LG[L.id] = svg('g', { 'class': 'lyr', 'data-layer': L.id }, s); });
    var F = function (cat, op) { return { fill: cv(cat), 'fill-opacity': op || 0.35, stroke: cv(cat), 'stroke-width': 0.05 }; };
    // EG
    rect(-4.0, 4.0, 0, 5.4, F('pub', 0.22), LG[0]);
    rect(-8.6, -4.9, 0, 3.2, F('pub', 0.3), LG[0]);
    rect(6.3, 8.5, 0.06, 2.64, F('learn', 0.35), LG[0]);
    rect(4.9, 6.25, 0, 2.7, F('pub', 0.15), LG[0]);
    // +1 study rooms and galleries
    [[-8.5, -6.3], [6.3, 8.5]].forEach(function (q) { rect(q[0], q[1], 2.92, 5.5, F('learn'), LG[1]); });
    [[-6.3, -4.72], [4.72, 6.3]].forEach(function (q) { rect(q[0], q[1], 2.9, 4.0, { fill: cv('circ'), 'fill-opacity': 0.12 }, LG[1]); });
    // +2 and +3 rooms and corridors
    [[5.6, 8.8, 2], [9.0, 12.1, 3]].forEach(function (q) {
      rect(-4.05, -0.9, q[0], q[1], F('live'), LG[q[2]]); rect(0.9, 4.05, q[0], q[1], F('live'), LG[q[2]]);
      rect(-0.9, 0.9, q[0], q[0] + 2.6, { fill: cv('circ'), 'fill-opacity': 0.14 }, LG[q[2]]);
    });
    // +4 kitchen under the ridge, terrace in the south slope
    poly([[-3, 12.3], [-3, ry(3)], [-2.37, 15.6], [2.37, 15.6], [3, ry(3)], [3, 12.3]], F('comm'), LG[4]);
    rect(3.0, 4.7, 12.3, 14.3, Object.assign(F('comm', 0.18), { 'stroke-dasharray': '.15 .1' }), LG[4]);
    // shell: cut walls (dark) and existing church (brick)
    var W = { fill: 'var(--brick)', stroke: 'none' };
    rect(-9.25, -8.65, 0, 6.8, W); rect(8.65, 9.25, 0, 6.8, W);
    poly([[-9.45, 6.75], [-4.7, 9.05], [-4.7, 9.35], [-9.45, 7.05]], W); poly([[9.45, 6.75], [4.7, 9.05], [4.7, 9.35], [9.45, 7.05]], W);
    [-1, 1].forEach(function (sd) {
      var a = sd * 4.45, b = sd * 4.95;
      rect(a, b, 5.6, 9.2, W); rect(a, b, 11.5, 12.5, W);
      rect(a, b, 9.2, 11.5, { fill: 'var(--c-comm)', 'fill-opacity': 0.25 });
      rect(sd * 3.93, sd * 4.73, 0, 3.25, { fill: 'var(--brick)', 'fill-opacity': 0.35 });
      rect(sd * 3.83, sd * 4.83, 2.9, 3.25, { fill: 'var(--brick)', 'fill-opacity': 0.5 });
    });
    // roof: north slope full, south slope with the terrace recess
    poly([[-5.3, 12.45], [0, 18.2], [0, 18.55], [-5.3, 12.8]], W);
    poly([[0, 18.2], [2.9, ry(2.9)], [2.9, ry(2.9) + 0.35], [0, 18.55]], W);
    poly([[4.7, 12.5], [5.3, 12.45], [5.3, 12.8], [4.7, 13.0]], W);
    // glazed front of the terrace and the glass guard
    svg('line', { x1: 3.0, x2: 3.0, y1: Y(12.3), y2: Y(ry(2.9)), stroke: 'var(--c-comm)', 'stroke-width': 0.08 }, g0);
    svg('line', { x1: 4.7, x2: 4.7, y1: Y(12.5), y2: Y(13.4), stroke: 'var(--c-comm)', 'stroke-width': 0.06 }, g0);
    // slabs
    var SL = { fill: 'var(--ink)' };
    rect(-8.65, -4.72, 2.7, 2.9, SL); rect(4.72, 8.65, 2.7, 2.9, SL);
    rect(-4.6, 4.6, 5.4, 5.6, SL); rect(-4.6, 4.6, 8.8, 9.0, SL); rect(-3.0, 4.7, 12.1, 12.3, SL);
    // room walls (thin)
    [5.6, 9.0].forEach(function (y0) { [-4.05, -0.9, 0.9, 4.05].forEach(function (z) { rect(z - 0.05, z + 0.05, y0, y0 + (y0 > 6 ? 3.1 : 3.2), { fill: 'var(--ink)', 'fill-opacity': 0.7 }); }); });
    [-6.3, 6.3].forEach(function (z) { rect(z - 0.05, z + 0.05, 2.9, 5.5, { fill: 'var(--ink)', 'fill-opacity': 0.7 }); });
    // labels inside the rooms
    var LS = 0.42;
    var rl = function (z, y, t, par) { text(z, y, t, 'sec-txt sec-roomlabel', LS, 'middle', par); };
    rl(0, 2.4, 'Lesesaal', LG[0]); rl(-6.75, 1.4, 'Magazin', LG[0]); rl(7.4, 1.2, 'Lernraum', LG[0]);
    rl(-7.4, 4.1, 'Lernraum', LG[1]); rl(7.4, 4.1, 'Lernraum', LG[1]);
    rl(-2.47, 7.0, 'Zimmer', LG[2]); rl(2.47, 7.0, 'Zimmer', LG[2]); rl(-2.47, 10.4, 'Zimmer', LG[3]); rl(2.47, 10.4, 'Zimmer', LG[3]);
    rl(0, 7.7, 'Flur', LG[2]); rl(0, 11.1, 'Flur', LG[3]);
    rl(0, 13.6, 'Küche', LG[4]); rl(3.85, 13.6, 'Terr.', LG[4]);
    // level lines and level tags on the right
    LAYERS.forEach(function (L) {
      var y = [0, 2.9, 5.6, 9.0, 12.3][L.id];
      svg('line', { x1: 9.5, x2: 10.6, y1: Y(y), y2: Y(y), stroke: 'var(--muted)', 'stroke-width': 0.04, 'stroke-dasharray': '.12 .1' }, g0);
      svg('polygon', { points: (10.6) + ',' + Y(y) + ' ' + (10.95) + ',' + (Y(y) - 0.3) + ' ' + (10.25) + ',' + (Y(y) - 0.3), fill: 'var(--ink)' }, g0);
      text(11.2, y + 0.16, L.lv, 'sec-txt', 0.62, 'start');
      text(12.5, y + 0.16, L.h, 'sec-sub', 0.46, 'start');
    });
    text(11.2, 18.2 + 0.16, 'First 18,20 m', 'sec-sub', 0.46, 'start');
    svg('line', { x1: 0.3, x2: 10.6, y1: Y(18.2), y2: Y(18.2), stroke: 'var(--muted)', 'stroke-width': 0.04, 'stroke-dasharray': '.12 .1' }, g0);
    text(-7.0, 6.15, 'Seitenschiff', 'sec-sub', 0.38); text(7.0, 6.15, 'Seitenschiff', 'sec-sub', 0.38);
    text(-9.2, -0.6, 'Nord', 'sec-sub', 0.42, 'start'); text(9.2, -0.6, 'Süd', 'sec-sub', 0.42, 'end');
    // scale bar 5 m
    svg('rect', { x: -10.2, y: Y(17.2), width: 5, height: 0.14, fill: 'var(--ink)' }, g0); svg('rect', { x: -10.2, y: Y(17.2), width: 2.5, height: 0.14, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 0.03 }, g0);
    text(-10.2, 17.5, '0', 'sec-sub', 0.4, 'start'); text(-5.2, 17.5, '5 m', 'sec-sub', 0.4, 'middle');
    // interaction with the list
    var list = $('#layerList');
    LAYERS.forEach(function (L) {
      var li = document.createElement('li');
      li.innerHTML = '<button type="button" aria-pressed="false" style="--c:' + cv(L.cat) + '"><span class="lv"><b>' + L.lv + '</b>' + L.h + '</span><span><h4><span class="sw" style="--c:' + cv(L.cat) + '"></span>' + L.t + '</h4><p>' + L.p + '</p><span class="linkbtn" data-go>Grundriss zeigen</span></span></button>';
      var b = li.firstChild;
      function hot(on) { s.classList.toggle('dim', on); $$('.lyr', s).forEach(function (g) { g.classList.toggle('hot', on && +g.dataset.layer === L.id); }); }
      b.addEventListener('mouseenter', function () { hot(true); }); b.addEventListener('mouseleave', function () { if (b.getAttribute('aria-pressed') !== 'true') hot(false); });
      b.addEventListener('focus', function () { hot(true); }); b.addEventListener('blur', function () { if (b.getAttribute('aria-pressed') !== 'true') hot(false); });
      b.addEventListener('click', function (e) {
        var was = b.getAttribute('aria-pressed') === 'true';
        $$('button', list).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        if (e.target.hasAttribute('data-go')) { setLevel(L.key); $('#etagen').scrollIntoView({ behavior: 'smooth' }); return; }
        b.setAttribute('aria-pressed', String(!was)); hot(!was);
      });
      list.appendChild(li);
      $$('.lyr', s).forEach(function (g) { if (+g.dataset.layer === L.id) { g.style.cursor = 'pointer'; g.addEventListener('click', function () { b.click(); }); } });
    });
  }

  /* ================= plans ================= */
  var curLevel = 'Ground floor', selRoom = null;
  function drawPlan() {
    var s = $('#planSvg'); if (!s) return;
    while (s.firstChild) s.removeChild(s.firstChild);
    var li = LVS.map(function (l) { return l.key; }).indexOf(curLevel);
    var defs = svg('defs', {}, s);
    var pat = svg('pattern', { id: 'hatch', width: 0.5, height: 0.5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    svg('line', { x1: 0, y1: 0, x2: 0, y2: 0.5, stroke: 'var(--line-2)', 'stroke-width': 0.08 }, pat);
    var gBg = svg('g', {}, s), gRooms = svg('g', {}, s), gWalls = svg('g', {}, s), gTxt = svg('g', {}, s);
    function rect(x0, x1, z0, z1, a, p) { return svg('rect', Object.assign({ x: Math.min(x0, x1), y: Math.min(z0, z1), width: Math.abs(x1 - x0), height: Math.abs(z1 - z0) }, a), p || gBg); }
    function text(x, z, t, cls, size, a, p) { var e = svg('text', Object.assign({ x: x, y: z, 'class': cls, 'font-size': size, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, a || {}), p || gTxt); e.textContent = t; return e; }
    var WALL = { fill: 'var(--brick)' }, NEW = { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 0.18 };
    // context: street names and north arrow
    text(29.9, 0, 'Voskenslaan', 'plan-note', 0.62, { transform: 'rotate(90 29.9 0)' });
    text(-12.4, 0, 'Clemenspoort', 'plan-note', 0.62, { transform: 'rotate(-90 -12.4 0)' });
    var na = svg('g', { transform: 'translate(27.6 -11.4)' }, gTxt);
    svg('polygon', { points: '0,-1 0.55,0.6 0,0.25 -0.55,0.6', fill: 'var(--ink)' }, na);
    text(0, 1.25, 'N', 'plan-lbl', 0.6, {}, na);
    // scale bar
    svg('rect', { x: 18, y: 12.25, width: 5, height: 0.18, fill: 'var(--ink)' }, gTxt); svg('rect', { x: 18, y: 12.25, width: 2.5, height: 0.18, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 0.04 }, gTxt);
    text(18, 12.95, '0', 'plan-note', 0.5); text(23, 12.95, '5 m', 'plan-note', 0.5);
    // existing church
    var heights = { passage: 3.2, choir: 12.5, chapel: 7.6, alley: 4.2, aisle: 6.8 };
    var y0 = LVS[li].y;
    if (li <= 1) {
      // floor outline of nave and aisles
      rect(0, 29.1, -8.65, 8.65, { fill: 'var(--surface-2)' });
      rect(-7.6, 0, -4.4, 4.4, { fill: 'var(--surface-2)' });
    } else {
      rect(0, 29.1, -4.7, 4.7, { fill: 'var(--surface-2)' });
      [-1, 1].forEach(function (sd) { rect(0.2, 28.8, sd * 4.95, sd * 8.9, { fill: 'url(#hatch)' }); });
      text(14.5, -6.9, li === 2 ? 'Pultdach Seitenschiff (bis 9,10 m)' : 'Dach Seitenschiff unterhalb', 'plan-note', 0.5); text(14.5, 6.9, li === 2 ? 'Pultdach Seitenschiff (bis 9,10 m)' : 'Dach Seitenschiff unterhalb', 'plan-note', 0.5);
    }
    TRACE.classes.forEach(function (c) {
      if (heights[c.name] <= y0 + 0.1) return;
      if (c.name === 'passage' && li > 0) return;
      c.polys.forEach(function (p) { svg('polygon', Object.assign({ points: p.o.map(function (q) { return q[0] + ',' + q[1]; }).join(' ') }, WALL), gWalls); });
    });
    if (li >= 2) {
      // nave walls above the arcade, west gable with the bridge opening, east wall with the tower
      [-1, 1].forEach(function (sd) { rect(-0.1, 29.1, sd * 4.45, sd * 4.95, WALL, gWalls); });
      rect(-0.45, 0.05, -4.95, -1.05, WALL, gWalls); rect(-0.45, 0.05, 1.05, 4.95, WALL, gWalls);
      rect(28.55, 29.1, -4.95, 4.95, WALL, gWalls);
    }
    if (li <= 1) TRACE.columns.forEach(function (q) { svg('circle', { cx: q[0], cy: q[1], r: 0.42, fill: 'var(--brick)' }, gWalls); });
    // new building: north volume on all levels, south volume on the ground floor only, glazed wing on all levels
    rect(-10.5, -0.3, -11.85, -4.6, li === 4 ? Object.assign({}, NEW, { 'stroke-dasharray': '.5 .3', 'stroke-width': 0.1 }) : NEW, gWalls);
    if (li === 0) rect(-10.5, -0.3, 4.6, 11.85, NEW, gWalls);
    rect(-10.42, -7.9, -4.8, 4.8, { fill: 'none', stroke: 'var(--c-comm)', 'stroke-width': 0.1 }, gWalls);
    // circulation areas that are not rooms
    var CI = { fill: cv('circ'), 'fill-opacity': 0.12 };
    if (li === 1) { rect(4.35, 27, -6.3, -4.72, CI); rect(4.35, 27, 4.72, 6.3, CI); text(15.7, -5.5, 'Galerie', 'plan-note', 0.5); text(15.7, 5.5, 'Galerie', 'plan-note', 0.5); }
    if (li === 2 || li === 3) { rect(0, 22.35, -0.9, 0.9, CI); text(11, 0, 'Flur 1,80 m', 'plan-note', 0.5); rect(-10.3, -5.7, -11.65, -4.8, CI); text(-8.0, -8.2, 'Flur', 'plan-note', 0.5); }
    if (li >= 2) { rect(-8.6, 0.8, -1.0, 1.0, CI); text(-4.0, 0, 'Brücke', 'plan-note', 0.5); }
    if (li === 3 || li === 4) { rect(22.5, 28.5, -4.4, 4.4, { fill: 'none', stroke: 'var(--muted)', 'stroke-width': 0.05, 'stroke-dasharray': '.3 .2' }); text(25.5, 0, 'Luftraum über der Orgelempore', 'plan-note', 0.45, { transform: 'rotate(90 25.5 0)' }); }
    if (li === 0) { text(-5.4, 8.2 + 3.0, '', 'plan-note', 0.5); }
    // rooms
    var rooms = ROOMS.filter(function (r) { return r.lv === curLevel; });
    var chips = $('#roomChips'); chips.innerHTML = '';
    rooms.forEach(function (r) {
      var cat = catOf(r), g = svg('g', { 'class': 'plan-room' + (selRoom === r ? ' sel' : ''), tabindex: 0, role: 'button', 'aria-label': de(r.name) + ', ' + m(r.m2) + ' m²' }, gRooms);
      var big = r.area && r.type !== 'core';
      svg('rect', { x: r.x0, y: r.z0, width: r.x1 - r.x0, height: r.z1 - r.z0, fill: cv(cat), 'fill-opacity': big ? 0.14 : 0.3, stroke: cv(cat), 'stroke-width': big ? 0.08 : 0.12, rx: 0.05 }, g);
      var w = r.x1 - r.x0, h = r.z1 - r.z0, lbl = shortLbl(r), fs = Math.min(0.62, w / (lbl.length * 0.62 + 0.4), h / 1.6);
      if (r.type === 'core' && w < 2) lbl = /Aufzug/.test(de(r.name)) ? 'Lift' : lbl;
      if (fs > 0.28) {
        text((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2 - (h > 2.2 && !big ? 0.3 : 0), lbl, 'plan-lbl', fs, {}, g);
        if (h > 2.2 && !big && r.type !== 'core') text((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2 + 0.45, m(r.m2) + ' m²', 'plan-note', Math.min(0.42, fs * 0.8), {}, g);
        if (big && r.m2 > 20) text((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2 + 0.8, m(r.m2, 0).replace(',0', '') + ' m²', 'plan-note', 0.45, {}, g);
      }
      g.addEventListener('click', function () { selectRoom(r); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRoom(r); } });
      bindTip(g, '<b>' + esc(de(r.name)) + '</b><br>' + m(r.m2) + ' m² · ' + CAT[cat].name);
      r._g = g;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', String(selRoom === r));
      b.innerHTML = '<span class="sw" style="--c:' + cv(cat) + '"></span>' + esc(de(r.name)); b.addEventListener('click', function () { selectRoom(r); }); chips.appendChild(b); r._chip = b;
    });
    // legend
    var used = {}; rooms.forEach(function (r) { used[catOf(r)] = 1; });
    $('#planLegend').innerHTML = Object.keys(CAT).filter(function (k) { return used[k]; }).map(function (k) { return '<span><span class="sw" style="--c:' + cv(k) + '"></span>' + CAT[k].name + '</span>'; }).join('') + '<span><span class="sw" style="--c:var(--brick)"></span>Bestand (Kirche)</span><span><span class="sw" style="--c:transparent;border:2px solid var(--ink)"></span>Neubau</span>';
    var n = { live: 0, learn: 0 }; rooms.forEach(function (r) { if (r.type === 'student') n.live++; if (r.type === 'studysm') n.learn++; });
    var sum = rooms.filter(function (r) { return r.type !== 'core'; }).reduce(function (a, r) { return a + r.m2; }, 0);
    $('#levelSum').textContent = LVS[li].name + ' · Fußboden ' + (LVS[li].y ? '+' + m(LVS[li].y, 2) : '±0,00') + ' m · ' + rooms.length + ' Räume und Bereiche · ' + nf.format(Math.round(sum)) + ' m² Nettofläche';
    if (!selRoom || selRoom.lv !== curLevel) panelLevel();
  }
  function setLevel(key) {
    curLevel = key; if (selRoom && selRoom.lv !== key) selRoom = null;
    $$('#levelTabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.lv === key)); b.setAttribute('aria-pressed', String(b.dataset.lv === key)); });
    drawPlan();
  }
  function panelLevel() {
    var L = lvOf(curLevel), rooms = ROOMS.filter(function (r) { return r.lv === curLevel; }), by = {};
    rooms.forEach(function (r) { var c = catOf(r); by[c] = (by[c] || 0) + r.m2; });
    $('#roomPanel').innerHTML = '<p class="eyebrow">' + L.name + '</p><h3>' + L.text.split(':')[0] + '</h3><p class="muted small">' + esc(L.text.split(':').slice(1).join(':').trim()) + '</p>' +
      '<dl>' + Object.keys(CAT).filter(function (k) { return by[k] && k !== 'circ'; }).map(function (k) { return '<dt><span class="sw" style="--c:' + cv(k) + '"></span> ' + CAT[k].name + '</dt><dd>' + nf.format(Math.round(by[k])) + ' m²</dd>'; }).join('') + '</dl>' +
      '<p class="small muted">Einen Raum im Plan oder in der Liste darunter anklicken, um Details zu sehen und ihn im 3D-Modell zu betreten.</p>';
  }
  var TYPEKEY = { student: 'student', studysm: 'studysm', commkitchen: 'commkitchen', library2: 'library', takeaway: 'takeaway', wc3: 'bath', wc3w: 'bath', lobby: 'lobby', locker: 'locker', bikes: 'bikes' };
  function rtKeyOf(r) {
    if (/^Café inside/.test(r.name)) return 'cafeIn'; if (/^Organ/.test(r.name)) return 'organ';
    if (/^Roof terrace, about 14/.test(r.name)) return 'terraceS'; if (/^Roof terrace on the café/.test(r.name)) return 'terraceL';
    return TYPEKEY[r.type] || null;
  }
  function selectRoom(r) {
    selRoom = r;
    ROOMS.forEach(function (x) { if (x._g) x._g.classList.toggle('sel', x === r); if (x._chip) x._chip.setAttribute('aria-pressed', String(x === r)); });
    var cat = catOf(r), w = r.x1 - r.x0, d = r.z1 - r.z0, L = lvOf(r.lv), rk = rtKeyOf(r);
    var dims = m(Math.max(w, d), 2) + ' × ' + m(Math.min(w, d), 2) + ' m';
    var h = r.type === 'core' && r.y1 - r.y0 < 1 ? '–' : m(r.y1 - r.y0, 2) + ' m';
    if (r.type === 'terrace7') h = 'offen';
    $('#roomPanel').innerHTML = '<p class="eyebrow">' + L.name + ' · Fußboden ' + (r.y0 > 0.1 ? '+' + m(r.y0, 2) : '±0,00') + ' m</p><h3>' + esc(de(r.name)) + '</h3>' +
      '<p><span class="tag"><span class="sw" style="--c:' + cv(cat) + '"></span>' + CAT[cat].name + '</span></p>' +
      '<dl><dt>Fläche</dt><dd>' + m(r.m2) + ' m²' + (r.area ? '' : ' netto') + '</dd><dt>Maße</dt><dd>' + dims + '</dd><dt>Raumhöhe</dt><dd>' + h + '</dd>' + (r.door ? '<dt>Tür</dt><dd>' + (r.type === 'student' || r.type === 'core' ? 'Brandschutztür EI30' : 'Tür') + '</dd>' : '') + '</dl>' +
      '<p class="small">' + esc(descOf(r)) + '</p>' +
      '<div class="acts"><button class="btn small primary" type="button" data-act="enter">Im 3D-Modell betreten</button><button class="btn small" type="button" data-act="roam">Von hier frei gehen</button>' + (rk ? '<button class="btn small" type="button" data-act="type">Raumtyp-Modell</button>' : '') + '</div>';
    var p = $('#roomPanel');
    $('[data-act="enter"]', p).addEventListener('click', function () { toModel({ cmd: 'room', name: r.name }); });
    $('[data-act="roam"]', p).addEventListener('click', function () { toModel({ cmd: 'room', name: r.name, roam: true }); });
    if (rk) $('[data-act="type"]', p).addEventListener('click', function () { selectType(rk); $('#raeume').scrollIntoView({ behavior: 'smooth' }); });
  }
  function initPlans() {
    var tabs = $('#levelTabs');
    LVS.forEach(function (L) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.lv = L.key; b.textContent = L.tab; b.title = L.name;
      b.addEventListener('click', function () { setLevel(L.key); }); tabs.appendChild(b);
    });
    setLevel('Ground floor');
  }

  /* ================= room types ================= */
  var RT = [
    { key: 'student', cat: 'live', name: 'Studentenzimmer', count: '20×', lv: 'Ebene +2 und +3', dims: ['4,20 × 3,15', 'm'], area: ['12,5', 'm² netto'], h: ['3,2 / 3,1', 'm hoch'], model: 'Student room 2.03',
      p: 'Das eigene Reich: kompakt, ruhig und möbliert. Fünf Zimmer liegen auf jeder Seite des 1,80 m breiten Mittelflurs, auf Ebene +2 und +3.',
      f: ['Bett 90 × 200 cm, Schreibtisch 120 × 60 cm mit Stuhl', 'Wandregal über dem Schreibtisch, Kleiderschrank, Teppich', 'Fenster 1,50 × 1,10 m in der Außenwand', 'Brandschutztür EI30, Zugang mit Transponder'], who: 'Für Studierende, die gemeinsam wohnen und trotzdem einen eigenen Rückzugsort brauchen.' },
    { key: 'studysm', cat: 'learn', name: 'Lernraum', count: '16×', lv: 'Ebene +1 (14), EG (2)', dims: ['3,16 × 2,20', 'm'], area: ['6,4', 'm² (EG 7,4)'], h: ['2,58', 'm hoch'], model: 'Study room 1.03',
      p: 'Kleine Räume zum Lernen auf den Galerien über den Seitenschiffen, mit Blick durch die Arkaden in den Lesesaal. Sie sind zum Arbeiten da, nicht zum Wohnen.',
      f: ['Schreibtisch 170 × 65 cm, Stuhl, Leselampe', 'Regal und Sessel', 'Tür zur Galerie entlang der Arkade', 'Buchbar für Bewohner und Nutzer der Bibliothek'], who: 'Für Prüfungsphasen, Gruppenarbeit zu zweit oder ruhige Stunden außerhalb des Zimmers.' },
    { key: 'commkitchen', cat: 'comm', name: 'Gemeinschaftsküche', count: '1×', lv: 'Ebene +4', dims: ['22,0 × 6,0', 'm'], area: ['132', 'm²'], h: ['2,6 – 5,9', 'm unter dem Dach'], model: 'Community kitchen and dining hall',
      p: 'Das Wohnzimmer des Hauses unter dem First. Hier kochen, essen und treffen sich alle 20 Bewohner. Eine Glastür führt auf die kleine Dachterrasse.',
      f: ['Küchenzeile 11 m mit Kochfeldern, Spülen, Oberschränken und zwei Kühlschränken', 'Zwei Kochinseln mit je fünf Hockern', 'Fünf Esstische für zusammen 30 Personen', 'Sofaecke, Dachfenster in der Nordseite'], who: 'Für alle Bewohner. Die einzige Küche im Haus; die Bewohner der Ebenen +2 und +3 fahren mit dem Aufzug hinauf.' },
    { key: 'terraceS', cat: 'comm', name: 'Dachterrasse an der Küche', count: '1×', lv: 'Ebene +4', dims: ['8,0 × 1,7', 'm'], area: ['≈ 14', 'm²'], h: ['offen', ''], model: 'Roof terrace, about 14 m²',
      p: 'Eine schmale Terrasse, in die Südseite des roten Ziegeldachs eingeschnitten. Fensterrahmen in Dunkelrot, eine blaue Stahlkante, Glas an den Seiten.',
      f: ['Glaswand zur Küche mit Tür in der Mitte', 'Seitliche Verglasung entlang der Dachlinie', 'Glasbrüstung 1,10 m auf der Kirchenwand', 'Zwei Bistrotische mit gelben Decken, Pflanzkübel'], who: 'Für den Kaffee nach dem Frühstück und den Blick über Gent.' },
    { key: 'terraceL', cat: 'comm', name: 'Dachterrasse Cafégebäude', count: '1×', lv: 'Ebene +4', dims: ['9,8 × 6,85', 'm'], area: ['≈ 67', 'm²'], h: ['offen', ''], model: 'Roof terrace on the café building, about 67 m²',
      p: 'Das Dach des Neubaus ist die große Terrasse des Hauses. Sie liegt auf Höhe der Küche und wird über den Glasflügel mit Aufzug und Treppe erreicht.',
      f: ['Holzdeck, Glasbrüstung mit Stahlhandlauf auf drei Seiten', 'Pflanzkübel entlang der Nordkante', 'Vier Bistrotische, zwei Sonnenschirme', 'Lange Tafel mit Bänken, zwei Liegen'], who: 'Für Sommerabende, gemeinsames Essen und Feste der Bewohner.' },
    { key: 'library', cat: 'pub', name: 'Lesesaal', count: '1×', lv: 'Erdgeschoss', dims: ['26,0 × 8,0', 'm'], area: ['208', 'm²'], h: ['5,4', 'm (letztes Joch 12 m)'], model: 'Library reading hall',
      p: 'Das Herz des Projekts: das Hauptschiff als offener, öffentlicher Lesesaal zwischen den achteckigen Pfeilern, mit dem originalen Fliesenboden.',
      f: ['Vier lange Tische mit je sechs Plätzen und Leselampen', 'Regalringe um die zehn Pfeiler', 'Zwei Reihen freistehender Regale', 'Büchermagazine in beiden Seitenschiffen'], who: 'Für alle: Studierende, Schüler der Nachbarschaft, Anwohner und Besucher.' },
    { key: 'cafeIn', cat: 'cafe', name: 'Café im Chor', count: '1×', lv: 'Erdgeschoss', dims: ['7,2 × 6,6', 'm'], area: ['47,5', 'm²'], h: ['4,6', 'm'], model: 'Café inside: second order point and seating',
      p: 'Auf dem ehemaligen Chorpodium liegt ein zweiter Bestellpunkt des Cafés. Eine Glaswand mit Glastür hält Geräusche und Tassen aus dem Lesesaal.',
      f: ['Theke mit vier Barhockern, Durchreiche in der Chorwand', 'Zwei Bistrotische, zwei Sofas, Couchtisch', 'Glaswand mit Glastür zum Lesesaal', 'Boden ohne Stufe gezeichnet (heute 0,6 m Podest)'], who: 'Für Pausen beim Lernen und Gäste, die nur auf einen Kaffee kommen.' },
    { key: 'takeaway', cat: 'cafe', name: 'Take-away-Café', count: '1×', lv: 'Erdgeschoss Neubau', dims: ['9,8 × 6,8', 'm'], area: ['58', 'm² + Lager 5,3'], h: ['2,7', 'm'], model: 'Take-away café',
      p: 'Das Café im Erdgeschoss des Neubaus öffnet sich zur Straße. Es ist die kleine, zahlende Gewerbemieterin im Haus.',
      f: ['Theke 3,4 m mit Vitrine, Rückbuffet, Kaffeemaschine', 'Sieben Bistrotische mit 14 Plätzen', 'Lager von etwa 5 m², Brandschutztür EI60', 'Schaufenster zur Straße'], who: 'Für Studierende, Nachbarn und Pendler auf dem Weg zum Bahnhof.' },
    { key: 'organ', cat: 'pub', name: 'Orgelempore, Lesebalkon', count: '1×', lv: 'Ebene +2', dims: ['8,0 × 4,2', 'm'], area: ['33,6', 'm²'], h: ['offen', 'bis unter das Dach'], model: 'Organ gallery, reading balcony',
      p: 'Die Orgelempore über dem alten Haupteingang bleibt erhalten. Sie wird ein Lesebalkon mit Sesseln und Blick über den ganzen Lesesaal.',
      f: ['Orgelgehäuse mit Pfeifen links und rechts des Turms', 'Vier Lesesessel, kleine Tische, Bücherregale', 'Glasbrüstung zum Kirchenschiff', 'Erreichbar über den Flur der Ebene +2'], who: 'Für ruhiges Lesen mit dem schönsten Blick im Haus.' },
    { key: 'bath', cat: 'serv', name: 'Bad (Damen und Herren)', count: '4×', lv: 'Ebene +2 und +3', dims: ['5,2 × 3,35', 'm'], area: ['≈ 16,7', 'm²'], h: ['2,4', 'm'], model: 'Toilets and showers, women, level +2',
      p: 'Die Bäder liegen im Cafégebäude, über die Brücke und den Glasflügel erreichbar. Je Ebene gibt es einen Damen- und einen Herrenraum.',
      f: ['Drei WC-Kabinen', 'Drei Waschbecken mit Spiegel', 'Zwei bodengleiche Duschen mit Glaswänden', 'Pro Ebene 4 Duschen für 10 Zimmer'], who: 'Für die Bewohner der Ebene. Auf Ebene +4 gibt es keine WCs; die nächsten sind eine Aufzugsstation tiefer.' },
    { key: 'lobby', cat: 'pub', name: 'Eingang und Buchrückgabe', count: '1×', lv: 'Erdgeschoss Glasflügel', dims: ['8,1 × 2,4', 'm'], area: ['≈ 9,8', 'm² frei'], h: ['3,4', 'm'], model: 'Entrance and book return',
      p: 'Der verglaste Flügel zur Clemenspoort ist der Haupteingang für alle: Bibliothek, Café und Bewohner. Hier stehen auch Aufzug und Treppe für alle Ebenen.',
      f: ['3 m breites Portal mit zwei Schiebetüren und Vordach', 'Buchrückgabe neben dem Portal', 'Aufzug 1,5 × 1,5 m mit Halt auf allen Ebenen', 'U-Treppe; 2,2 m breite Öffnung in den Chor'], who: 'Für alle Besucher; Bewohner fahren mit Transponder nach oben.' },
    { key: 'locker', cat: 'serv', name: 'Schließfachraum', count: '2×', lv: 'Erdgeschoss Nordschiff', dims: ['3,8 × 3,6', 'm'], area: ['12,9', 'm²'], h: ['2,8', 'm'], model: 'Locker room 1',
      p: 'Ein Raum im Raum im Nordschiff, damit Taschen und Jacken nicht im Lesesaal liegen.',
      f: ['16 Schließfächer in zwei Reihen', 'Bank in der Mitte', 'Spiegel und Schuhregal'], who: 'Für Besucher der Bibliothek.' },
    { key: 'bikes', cat: 'serv', name: 'Fahrradraum', count: '1×', lv: 'Erdgeschoss Neubau Süd', dims: ['9,8 × 6,8', 'm'], area: ['66,6', 'm²'], h: ['2,7', 'm'], model: 'Bicycle parking',
      p: 'Gent ist eine Fahrradstadt. Der eingeschossige Neubau an der Südwestecke nimmt etwa 60 Räder auf.',
      f: ['Fünf Reihen mit Anlehnbügeln', 'Etwa 60 Plätze', 'Direkt neben dem Haupteingang', 'Ob das für Bewohner und Besucher reicht, ist noch zu rechnen'], who: 'Für Bewohner und Besucher der Bibliothek.' }
  ];
  var rtCur = null, rtMounted = false;
  function selectType(key) {
    var t = null; RT.forEach(function (x) { if (x.key === key) t = x; }); if (!t) return;
    rtCur = t;
    $$('#rtList button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.k === key)); });
    var c = $('#rtCard');
    c.innerHTML = '<p class="eyebrow">' + t.lv + ' · ' + t.count + '</p><h3>' + t.name + '</h3>' +
      '<div class="dims"><div><b>' + t.dims[0] + '</b><span>' + t.dims[1] + '</span></div><div><b>' + t.area[0] + '</b><span>' + t.area[1] + '</span></div><div><b>' + t.h[0] + '</b><span>' + (t.h[1] || 'Höhe') + '</span></div></div>' +
      '<p>' + t.p + '</p><ul>' + t.f.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><p class="who">' + t.who + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn small primary" type="button" id="rtWalk">Im Gesamtmodell betreten</button></div>';
    $('#rtWalk').addEventListener('click', function () { toModel({ cmd: 'room', name: t.model }); });
    $('#rtTag').textContent = t.name + ' · ' + t.dims[0] + ' ' + t.dims[1];
    if (rtMounted) window.S7Rooms.show(key);
  }
  function initTypes() {
    var ul = $('#rtList');
    RT.forEach(function (t) {
      var li = document.createElement('li');
      li.innerHTML = '<button type="button" data-k="' + t.key + '" aria-pressed="false" style="--c:' + cv(t.cat) + '"><span class="sw" style="--c:' + cv(t.cat) + '"></span><span>' + t.name + '</span><small>' + t.count + '</small></button>';
      li.firstChild.addEventListener('click', function () { selectType(t.key); });
      ul.appendChild(li);
    });
    var canvas = $('#rtCanvas'), viewer = $('#rtViewer');
    function mountNow() {
      if (rtMounted) return;
      rtMounted = !!(window.S7Rooms && window.S7Rooms.mount(canvas, viewer));
      if (!rtMounted) { var f = document.createElement('div'); f.className = 'vfail'; f.textContent = '3D-Ansicht nicht verfügbar: Dieser Browser unterstützt kein WebGL oder three.js wurde nicht geladen.'; viewer.appendChild(f); return; }
      if (rtCur) window.S7Rooms.show(rtCur.key);
    }
    // build the WebGL scene only when the section comes near the screen
    if (window.IntersectionObserver) { var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { mountNow(); io.disconnect(); } }, { rootMargin: '400px' }); io.observe(viewer); } else mountNow();
    $('#rtReset').addEventListener('click', function () { if (rtMounted) window.S7Rooms.resetView(); });
    $('#rtRot').addEventListener('click', function () { if (!rtMounted) return; var on = window.S7Rooms.toggleRotate(); this.textContent = 'Drehen: ' + (on ? 'an' : 'aus'); });
    selectType('student');
  }

  /* ================= student room plan (1:50) ================= */
  function drawRoomPlan() {
    var s = $('#roomPlan'); if (!s) return;
    var W = 4.2, D = 3.15, t = 0.1;
    var g = svg('g', {}, s);
    function r(x, y, w, h, a) { return svg('rect', Object.assign({ x: x, y: y, width: w, height: h }, a), g); }
    function tx(x, y, s2, c, a) { var e = svg('text', Object.assign({ x: x, y: y, 'font-size': s2, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'class': c || 'plan-note' }, a || {}), g); e.textContent = arguments[5] || ''; return e; }
    function T(x, y, size, text, cls) { var e = svg('text', { x: x, y: y, 'font-size': size, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'class': cls || 'plan-note' }, g); e.textContent = text; return e; }
    r(0, 0, W, D, { fill: 'var(--c-live)', 'fill-opacity': 0.08 });
    var WL = { fill: 'var(--ink)' };
    r(-t, -t, W + 2 * t, t, WL); r(-t, 0, t, D, WL); r(W, 0, t, D, WL);
    r(-t, D, 2.83 + t, t, WL); r(3.73, D, W - 3.73 + t, t, WL);
    // window
    r(1.35, -t, 1.5, t, { fill: 'var(--c-comm)', 'fill-opacity': 0.6 });
    // door swing
    svg('path', { d: 'M3.73 ' + D + ' L3.73 ' + (D - 0.9) + ' A0.9 0.9 0 0 0 2.83 ' + D, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 0.02 }, g);
    r(3.71, D - 0.9, 0.04, 0.9, { fill: 'var(--brick)' });
    var FU = { fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 0.025 };
    r(0.1, 0.1, 2.0, 0.9, FU); r(0.15, 0.15, 0.4, 0.8, { fill: 'none', stroke: 'var(--muted)', 'stroke-width': 0.02 }); T(1.2, 0.55, 0.2, 'Bett 90 × 200', 'plan-lbl');
    r(2.6, 0.1, 1.2, 0.6, FU); T(3.2, 0.4, 0.17, 'Schreibtisch', 'plan-lbl');
    svg('circle', { cx: 3.2, cy: 1.05, r: 0.22, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 0.025 }, g);
    r(0.1, 2.48, 0.6, 0.55, FU); T(0.4, 2.755, 0.15, 'Schrank', 'plan-lbl');
    r(1.2, 1.18, 1.8, 1.2, { fill: 'var(--c-live)', 'fill-opacity': 0.12, stroke: 'var(--c-live)', 'stroke-width': 0.02, 'stroke-dasharray': '.06 .05' }); T(2.1, 1.78, 0.16, 'Teppich');
    T(2.1, -0.28, 0.15, 'Fenster 1,50 m'); T(3.28, D + 0.33, 0.17, 'Tür EI30 · Flur');
    // dimension lines
    var DL = { stroke: 'var(--muted)', 'stroke-width': 0.015 };
    svg('line', Object.assign({ x1: 0, x2: W, y1: -0.6, y2: -0.6 }, DL), g); svg('line', Object.assign({ x1: 0, x2: 0, y1: -0.68, y2: -0.52 }, DL), g); svg('line', Object.assign({ x1: W, x2: W, y1: -0.68, y2: -0.52 }, DL), g);
    T(W / 2, -0.6, 0.19, '4,20 m', 'plan-lbl').setAttribute('y', -0.6 - 0.16);
    svg('line', Object.assign({ x1: W + 0.45, x2: W + 0.45, y1: 0, y2: D }, DL), g); svg('line', Object.assign({ x1: W + 0.37, x2: W + 0.53, y1: 0, y2: 0 }, DL), g); svg('line', Object.assign({ x1: W + 0.37, x2: W + 0.53, y1: D, y2: D }, DL), g);
    var v = T(W + 0.62, D / 2, 0.19, '3,15 m', 'plan-lbl'); v.setAttribute('transform', 'rotate(90 ' + (W + 0.62) + ' ' + D / 2 + ')');
  }

  /* ================= a day in S7 ================= */
  var DAY = [
    ['07:30', 'live', 'Aufwachen', 'Zimmer 2.06, Ebene +2, Südseite.', 'Student room 2.06'],
    ['07:45', 'serv', 'Duschen', 'Über den Flur und die Brücke ins Cafégebäude, rund 25 m Weg.', 'Toilets and showers, women, level +2'],
    ['08:15', 'comm', 'Frühstück', 'Mit dem Aufzug zwei Ebenen hoch in die Gemeinschaftsküche.', 'Community kitchen and dining hall'],
    ['08:40', 'comm', 'Kaffee draußen', 'Durch die Glastür auf die kleine Dachterrasse im Süddach.', 'Roof terrace, about 14 m²'],
    ['09:10', 'serv', 'Losfahren', 'Rad aus dem Fahrradraum, zu den Hochschulen in der Nähe.', 'Bicycle parking'],
    ['13:00', 'cafe', 'Mittagspause', 'Ein Sandwich aus dem Take-away-Café im Erdgeschoss.', 'Take-away café'],
    ['14:00', 'learn', 'Lernen', 'Lernraum 1.05 ist für den Nachmittag gebucht.', 'Study room 1.05'],
    ['17:30', 'pub', 'Bücher holen', 'Im Lesesaal unter dem Gewölbe, zwischen Nachbarn und Schülern.', 'Library reading hall'],
    ['19:30', 'comm', 'Gemeinsam kochen', 'Mittwochs kocht eine Ebene für alle.', 'Community kitchen and dining hall'],
    ['21:30', 'comm', 'Abend auf dem Dach', 'Auf der großen Terrasse über dem Café.', 'Roof terrace on the café building, about 67 m²'],
    ['23:00', 'live', 'Zurück im Zimmer', 'Unten ist der Lesesaal geschlossen, das Haus wird ruhig.', 'Student room 2.06']
  ];
  function initDay() {
    var ol = $('#dayList');
    DAY.forEach(function (d) {
      var li = document.createElement('li');
      li.innerHTML = '<time>' + d[0] + '</time><span class="dot" style="--c:' + cv(d[1]) + '"></span><div><h4>' + d[2] + '</h4><p>' + d[3] + '</p><button class="linkbtn go" type="button">Im 3D-Modell ansehen</button></div>';
      $('button', li).addEventListener('click', function () { toModel({ cmd: 'room', name: d[4] }); });
      ol.appendChild(li);
    });
  }

  /* ================= horizontal bar chart ================= */
  function barChart(el, rows, max, ticks, fmt, unit) {
    el.innerHTML = '';
    rows.forEach(function (r) {
      var row = document.createElement('div'); row.className = 'bar-row' + (r.ref ? ' ref' : '');
      var w = r.v == null ? 100 : Math.max(0.5, r.v / max * 100);
      row.innerHTML = '<span class="lbl"><span class="sw" style="--c:' + (r.ref ? 'var(--c-circ)' : r.c) + '"></span><span>' + esc(r.l) + '</span></span><span class="bar-track"><span class="bar-fill' + (r.v == null ? ' muted' : '') + '" style="width:' + w + '%;--c:' + r.c + '"></span></span><span class="val">' + (r.v == null ? (r.na || '–') : fmt(r.v)) + '</span>';
      bindTip(row, '<b>' + esc(r.l) + '</b><br>' + (r.v == null ? (r.na || '') : fmt(r.v)) + (r.tip ? '<br>' + r.tip : ''));
      el.appendChild(row);
    });
    if (ticks) {
      var ax = document.createElement('div'); ax.className = 'chart-axis';
      ax.innerHTML = '<span></span><span class="ticks">' + ticks.map(function (t) { return '<span>' + nf.format(t) + '</span>'; }).join('') + '</span><span>' + (unit || '') + '</span>';
      el.appendChild(ax);
    }
  }
  function initCharts() {
    // market comparison
    barChart($('#marketChart'), [
      { l: 'S7 Sozialtarif', v: 395, c: cv('live') },
      { l: 'S7 Standard', v: 540, c: cv('live') },
      { l: 'Gent, Zimmer Ø (UGent 25–26)', v: 542, ref: 1, c: 'var(--c-circ)', tip: 'Durchschnittliche All-in-Miete für ein Zimmer' },
      { l: 'Gent, Zimmer Ø (Stadt, 2024)', v: 544, ref: 1, c: 'var(--c-circ)', tip: '544,11 € inklusive Kosten' },
      { l: 'Gent, Studio Ø (UGent 25–26)', v: 701, ref: 1, c: 'var(--c-circ)', tip: 'Studio mit eigenem Bad und Küche' }
    ], 750, [0, 250, 500, 750], eur, '€/Monat');
    // area by use, from the model
    var by = {}; ROOMS.forEach(function (r) { var c = catOf(r); if (c !== 'circ') by[c] = (by[c] || 0) + r.m2; });
    var order = ['pub', 'cafe', 'live', 'learn', 'comm', 'serv'], total = 0; order.forEach(function (k) { total += by[k] || 0; });
    barChart($('#areaChart'), order.map(function (k) { return { l: CAT[k].name, v: by[k] || 0, c: cv(k), tip: Math.round((by[k] || 0) / total * 100) + ' % der gezeichneten Nettofläche' }; }), 400, [0, 100, 200, 300, 400], function (v) { return nf.format(Math.round(v)) + ' m²'; }, 'm²');
    $('#areaTable').innerHTML = '<thead><tr><th>Nutzung</th><th class="r">m²</th><th class="r">Anteil</th></tr></thead><tbody>' + order.map(function (k) { return '<tr><td>' + CAT[k].name + '</td><td class="r">' + nf.format(Math.round(by[k] || 0)) + '</td><td class="r">' + Math.round((by[k] || 0) / total * 100) + ' %</td></tr>'; }).join('') + '<tr><th>Summe</th><td class="r"><b>' + nf.format(Math.round(total)) + '</b></td><td class="r">100 %</td></tr></tbody>';
    // study scores
    var SC = [
      { l: 'S1 Campus Church', v: 3.45, t: 'Studie, Rang 1', rows: [5, 3, 4, 3, 3, 3, 2] },
      { l: 'S2 Clemens Hub', v: 2.55, t: 'Studie, Rang 3', rows: [3, 2, 3, 2, 2, 2, 4] },
      { l: 'S3 Overwale Office', v: 2.15, t: 'Studie, Rang 4', rows: [1, 2, 2, 3, 4, 3, 1] },
      { l: 'S4 Studentenwohnheim', v: 3.35, t: 'Studie, Rang 2', rows: [3, 3, 2, 5, 3, 4, 4] },
      { l: 'S5 Layered Church', v: 3.60, t: 'vorläufig, eigene Einschätzung', rows: [4, 3, 4, 4, 3, 3, 4] },
      { l: 'S6 Library Church', v: null, na: 'offen' },
      { l: 'S6+ Library Church Plus', v: null, na: 'offen' },
      { l: 'S7 Bibliothekskirche', v: null, na: 'offen' }
    ];
    barChart($('#scoreChart'), SC.map(function (s, i) { return { l: s.l, v: s.v, na: 'offen', c: i === 4 ? 'color-mix(in srgb, var(--c-pub) 50%, var(--surface))' : 'var(--c-pub)', tip: s.t || 'noch nicht bewertet' }; }), 5, [0, 1, 2, 3, 4, 5], function (v) { return nf2.format(v); }, 'Punkte');
    var CR = ['Zonierung und Recht', 'Wirtschaftlichkeit', 'Denkmal', 'Nachfrage', 'Energie und Technik', 'Umsetzungsrisiko', 'Sozialer Nutzen'], WT = [20, 20, 15, 15, 10, 10, 10];
    $('#scoreTable').innerHTML = '<thead><tr><th>Kriterium</th><th class="r">Gewicht</th>' + SC.slice(0, 5).map(function (s) { return '<th class="r">' + s.l.split(' ')[0] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      CR.map(function (c, i) { return '<tr><td>' + c + '</td><td class="r">' + WT[i] + ' %</td>' + SC.slice(0, 5).map(function (s) { return '<td class="r">' + s.rows[i] + '</td>'; }).join('') + '</tr>'; }).join('') +
      '<tr><th>Gesamt</th><td></td>' + SC.slice(0, 5).map(function (s) { return '<td class="r"><b>' + nf2.format(s.v) + '</b></td>'; }).join('') + '</tr></tbody>';
  }

  /* ================= evolution and open points ================= */
  function initLists() {
    var EVO = [
      ['S1', 'Campus Church', 'Räume für die Hochschulen als Boxen im Schiff, neuer Westeingang.', 'Studie'],
      ['S2', 'Clemens Hub', 'Sozialrestaurant, Kurzzeitzimmer in einem Turm, Vereine im Dach.', 'Studie'],
      ['S3', 'Overwale Office', 'Büros und Coworking mit etwa 90 Arbeitsplätzen.', 'Studie'],
      ['S4', 'Studentenwohnheim Voskenslaan', '42 Zimmer auf vier Ebenen, Studentenrestaurant im Schiff.', 'Studie'],
      ['S5', 'Layered Church', 'Öffentliches Erdgeschoss, nur 12 Zimmer in den Seitenschiffen.', 'eigener Vorschlag'],
      ['S6', 'Library Church', 'Bibliothek im Schiff, Lernräume, 29 Zimmer mit dem Aufbau von S4.', 'eigener Vorschlag'],
      ['S6+', 'Library Church Plus', 'Dichtere Bibliothek, Zimmer und vier Zwei-Zimmer-Wohnungen.', 'eigener Vorschlag'],
      ['S7', 'Bibliothekskirche', 'S6+ nach den Fotos neu gezeichnet: volle Erschließung, Orgelempore frei, Küche unter dem First, 20 Zimmer.', 'diese Seite']
    ];
    $('#evo').innerHTML = EVO.map(function (e) { return '<li' + (e[0] === 'S7' ? ' class="now"' : '') + '><b>' + e[0] + '</b><div><h4>' + e[1] + '</h4><p>' + e[2] + '</p></div><span class="tag">' + e[3] + '</span></li>'; }).join('');
    var H = [
      'Dürfen die oberen Seitenschiffe entlang des Pfeilerrasters in Räume geteilt werden?',
      'Darf das Hauptschiff teilweise in Geschosse mit einem Mittelflur geteilt werden?',
      'Dürfen drei Öffnungen in den Westgiebel geschnitten werden? <span>Die oberen zwei liegen in den Blendnischen, die unterste im weißen unteren Teil.</span>',
      'Darf die Orgelempore als Lesebalkon genutzt werden?',
      'Darf eine Aussparung von etwa 8 × 2 m in die südliche Dachfläche geschnitten werden?',
      'Dürfen Gauben und Dachfenster in beide Dachflächen? <span>Mit den roten Ziegeln wären sie gut sichtbar.</span>',
      'Dürfen am Westende jedes Seitenschiffs Treppen eingebaut werden?',
      'Darf die Westfassade als Eingang geöffnet und eine 2,2 m breite Öffnung in die Westwand des Chors geschnitten werden?',
      'Darf der Chorboden auf das Niveau des Schiffs gebracht werden (heute 0,6 m Podest)?',
      'Dürfen neben dem Chor neue Baukörper an die Westfassade gebaut werden?'
    ];
    var P = [
      'Ist Studentenwohnen in der Zone für Gemeinschaftseinrichtungen zulässig?',
      'Kann die Stellplatzpflicht wegen der Nähe zum Bahnhof gesenkt werden?',
      'Welcher zweite Fluchtweg dient den Ebenen im Schiff?',
      'Reichen etwa 60 Fahrradplätze? <span>Der Bedarf ist noch nicht berechnet.</span>'
    ];
    var X = [
      'Zweiter Fluchtweg: <span>Die Ebenen +2 bis +4 haben nur die Treppe und den Aufzug im Glasflügel.</span>',
      'Barrierefreiheit: <span>Die Lernräume auf Ebene +1 sind nur über Treppen erreichbar; die kleinen Aufzüge aus S6+ sind entfallen.</span>',
      'Tageslicht auf Ebene +2: <span>Die Außenwand dieser Zimmer liegt unter dem Pultdach der Seitenschiffe (bis 9,10 m). Die Belichtung muss nachgewiesen werden, zum Beispiel mit Oberlichtern im Seitenschiffdach. Eigene Prüfung am Modell.</span>',
      'Küchen: <span>Eine Küche für 20 Zimmer. Für S4 wird eine Vorgabe von einer Küche je zehn Einheiten genannt; ob die große Küche mit mehreren Kochzeilen genügt, ist zu klären.</span>',
      'Wege zu den Bädern: <span>Vom östlichsten Zimmer bis zum Bad im Cafégebäude sind es rund 40 m; auf Ebene +4 gibt es keine WCs.</span>',
      'Schallschutz zwischen Lesesaal, Lernräumen und Zimmern.',
      'Brandschutz: <span>Die Türen EI30 und EI60 sind ein erster Vorschlag und nicht geprüft.</span>',
      'Tragwerk: <span>neue Decken im Schiff und Lasten der Regale.</span>',
      'Bauzustand: <span>Dach, Feuchtigkeit, Asbest in der Dachschalung.</span>',
      'Raumhöhe Lesesaal: <span>Unter der Ebene +2 bleiben 5,4 m; die volle Höhe des Schiffs erlebt man nur im letzten Joch.</span>'
    ];
    $('#openHeritage').innerHTML = H.map(function (x) { return '<li>' + x + '</li>'; }).join('');
    $('#openPlanning').innerHTML = P.map(function (x) { return '<li>' + x + '</li>'; }).join('');
    $('#openTech').innerHTML = X.map(function (x) { return '<li>' + x + '</li>'; }).join('');
  }

  /* ================= calculators ================= */
  function initCalc() {
    var tarif = 'std';
    function upd() {
      var mon = +$('#mon').value, rent = tarif === 'std' ? 465 : 320, fee = 75, per = rent + fee;
      $('#monOut').textContent = mon + (mon === 1 ? ' Monat' : ' Monate');
      $('#yearOut').textContent = eur(per * mon);
      $('#perOut').textContent = eur(per) + ' pro Monat, alles inklusive';
      $('#calcRows').innerHTML = '<div><span>Miete (' + mon + ' × ' + eur(rent) + ')</span><span>' + eur(rent * mon) + '</span></div><div><span>Pauschale (' + mon + ' × ' + eur(fee) + ')</span><span>' + eur(fee * mon) + '</span></div><div><span>Kaution, zurück bei Auszug</span><span>bis ' + eur(rent * 2) + '</span></div><div><span>Fahrradplatz, Lernräume, Terrassen</span><span>inklusive</span></div>';
    }
    $$('#tarifSeg button').forEach(function (b) { b.addEventListener('click', function () { tarif = b.dataset.t; press($('#tarifSeg'), b); upd(); }); });
    $('#mon').addEventListener('input', upd); upd();

    function inv() {
      var rent = +$('#iRent').value, soc = +$('#iSoc').value, occ = +$('#iOcc').value / 100, cafe = +$('#iCafe').value, lib = +$('#iLib').value, ev = +$('#iEv').value;
      $('#iRentO').textContent = eur(rent); $('#iSocO').textContent = soc; $('#iOccO').textContent = Math.round(occ * 100) + ' %'; $('#iCafeO').textContent = eur(cafe); $('#iLibO').textContent = eur(lib); $('#iEvO').textContent = ev;
      var parts = [
        { k: 'live', l: 'Studentenwohnen', d: (20 - soc) + ' × ' + eur(rent) + ' + ' + soc + ' × 320 €, ' + Math.round(occ * 100) + ' % belegt', v: ((20 - soc) * rent + soc * 320) * 12 * occ },
        { k: 'pub', l: 'Bibliothek', d: '≈ 600 m² × ' + eur(lib), v: lib * 600 },
        { k: 'cafe', l: 'Café', d: '12 × ' + eur(cafe), v: cafe * 12 },
        { k: 'comm', l: 'Veranstaltungen', d: ev + ' × 250 €', v: ev * 250 }
      ];
      var tot = parts.reduce(function (a, p) { return a + p.v; }, 0);
      $('#iTot').textContent = eur(tot);
      $('#iSub').textContent = tot ? Math.round(parts[0].v / tot * 100) + ' % davon aus dem Wohnen · ' + eur(parts[0].v / 250) + ' je m² Zimmerfläche und Jahr' : '';
      $('#iStack').innerHTML = parts.filter(function (p) { return p.v > 0; }).map(function (p) { return '<i style="--c:' + cv(p.k) + ';flex:' + p.v + '" title="' + p.l + '"></i>'; }).join('');
      $('#iRows').innerHTML = parts.map(function (p) { return '<div><span><span class="sw" style="--c:' + cv(p.k) + '"></span> ' + p.l + ' <span class="muted small">(' + p.d + ')</span></span><span>' + eur(p.v) + '</span></div>'; }).join('');
    }
    ['iRent', 'iSoc', 'iOcc', 'iCafe', 'iLib', 'iEv'].forEach(function (id) { $('#' + id).addEventListener('input', inv); }); inv();
  }

  /* ================= start ================= */
  drawSection();
  initPlans();
  initTypes();
  drawRoomPlan();
  initDay();
  initCharts();
  initLists();
  initCalc();
})();
