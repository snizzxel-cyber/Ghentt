/* S7 website: plans and section drawn from the model data, room types, living, renting and investor tools. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var ROOMS = window.S7_ROOMS || [], TRACE = window.S7_TRACE || { classes: [], columns: [] };
  var nf = new Intl.NumberFormat('en-GB'), nf1 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 }), nf2 = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function eur(v) { return '€' + nf.format(Math.round(v)); }
  function m(v, d) { return (d === 2 ? nf2 : nf1).format(v); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function svg(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function lvH(y) { return y > 0.1 ? '+' + m(y, 2) : '±0.00'; }

  /* ================= categories ================= */
  var CAT = {
    pub: { name: 'Library and public', v: '--c-pub' },
    cafe: { name: 'Café', v: '--c-cafe' },
    live: { name: 'Living', v: '--c-live' },
    learn: { name: 'Study', v: '--c-learn' },
    comm: { name: 'Shared', v: '--c-comm' },
    serv: { name: 'Sanitary and service', v: '--c-serv' },
    circ: { name: 'Stairs and lift', v: '--c-circ' }
  };
  function catOf(r) {
    if (/^Café|Take-away/.test(r.name)) return 'cafe';
    if (/Organ gallery/.test(r.name)) return 'pub';
    return { library2: 'pub', stacks: 'pub', lobby: 'pub', studysm: 'learn', student: 'live', commkitchen: 'comm', terrace7: 'comm', wc1: 'serv', wc3: 'serv', wc3w: 'serv', locker: 'serv', bikes: 'serv', core: 'circ', storage: 'cafe', lounge: 'pub' }[r.type] || 'circ';
  }
  function cv(cat) { return 'var(' + CAT[cat].v + ')'; }

  /* ================= names and texts ================= */
  function nm(n) {
    var r;
    if ((r = n.match(/^Toilets and showers, (men|women), level \+(\d)/))) return 'Bathroom, ' + r[1] + ', level +' + r[2];
    if (/^Lift/.test(n)) return 'Lift';
    if (/^Stair, (ground floor|level \+\d)$/.test(n)) return 'Stair, glazed wing';
    if (/^Stair, south aisle/.test(n)) return 'Stair, south aisle';
    if (/^Stair, north aisle/.test(n)) return 'Stair, north aisle';
    return {
      'Café inside: second order point and seating': 'Café in the choir',
      'Library reading hall': 'Reading hall',
      'Community kitchen and dining hall': 'Community kitchen',
      'Roof terrace, about 14 m²': 'Roof terrace by the kitchen',
      'Café storage, whole level +1 (transponder access)': 'Café storage (staff only)',
      'Roof terrace on the café building, about 67 m²': 'Roof terrace, café building'
    }[n] || n;
  }
  function shortLbl(r) {
    var n = nm(r.name), k;
    if ((k = n.match(/^(Student room|Study room) (\d\.\d\d)/))) return k[2];
    if (/^Locker room/.test(n)) return 'Lockers';
    if ((k = n.match(/^Bathroom, (men|women)/))) return k[1] === 'men' ? 'Bath M' : 'Bath W';
    if (/^Stair/.test(n)) return 'Stair';
    if (/^Book stacks/.test(n)) return 'Stacks';
    if (n === 'Entrance and book return') return 'Entrance';
    if (n === 'Café storage (staff only)') return 'Café storage';
    if (n === 'Café storage') return 'Storage';
    if (n === 'Roof terrace by the kitchen') return 'Terrace';
    if (n === 'Organ gallery, reading balcony') return 'Reading balcony';
    if (n === 'Toilet, men') return 'WC M'; if (n === 'Toilet, women') return 'WC W';
    return n;
  }
  var TYPE_TXT = {
    student: 'A single room to live in: bed, desk, shelf and wardrobe. The door is an EI30 fire door. Bathrooms and the kitchen are shared.',
    studysm: 'A small room for studying, not for living: desk, chair, shelf and armchair. Bookable for residents and library users.',
    library2: 'The open reading hall in the nave, with long tables, shelving around the piers and two rows of free-standing shelf units. The tiled floor stays visible.',
    stacks: 'Library shelving in the side aisle, below the gallery of study rooms.',
    lobby: 'Main entrance in the glazed wing: a portal with two sliding doors, a canopy, the book return, the lift and the stair. A 2.2 m opening leads into the choir.',
    commkitchen: 'The only kitchen in the building, for all 20 residents: an 11 m kitchen run with hobs and sinks, two islands with stools, five dining tables and sofas under the ridge.',
    terrace7: 'Roof terrace for the residents, with a glass guard, tables and planters. Reached by lift without a step.',
    wc1: 'A single toilet with washbasin for library visitors.',
    wc3: 'Three toilets, three washbasins and two walk-in showers for the men on this level.',
    wc3w: 'Three toilets, three washbasins and two walk-in showers for the women on this level.',
    locker: 'Lockers, a bench and a mirror for library visitors, built as a room inside the north aisle.',
    bikes: 'Bicycle store with about 60 places in the one-storey building at the south-west corner.',
    core: 'Stair or lift. The aisle stairs only go up to level +1; the lift and stair in the glazed wing reach every level.',
    takeaway: 'Take-away café on the ground floor of the new building: counter, coffee machine, bistro tables and a storage room. For students, neighbours and commuters.',
    storage: 'Café storage. The whole of level +1 of the café building is one storage hall, reached only with a transponder through a fire door.',
    lounge: 'Seating area.'
  };
  function descOf(r) {
    if (/^Café inside/.test(r.name)) return 'A second café counter on the former choir platform. A glass wall with a glass door separates it from the reading hall, so the hall stays quiet. The choir floor is drawn without its step.';
    if (/^Organ gallery/.test(r.name)) return 'The organ gallery is kept and becomes a quiet reading balcony overlooking the nave. The level +2 corridor ends here.';
    return TYPE_TXT[r.type] || '';
  }
  var LVS = [
    { key: 'Ground floor', tab: 'Ground', y: 0, name: 'Ground floor', head: 'Public', text: 'Reading hall, book stacks, café in the choir, take-away café, entrance and bicycle store.' },
    { key: 'Level +1', tab: '+1', y: 2.9, name: 'Level +1', head: 'Study', text: '14 study rooms on the aisle galleries; the café storage hall in the new building.' },
    { key: 'Level +2', tab: '+2', y: 5.6, name: 'Level +2', head: 'Living', text: '10 rooms on a central corridor, the reading balcony on the organ gallery, bathrooms in the café building.' },
    { key: 'Level +3', tab: '+3', y: 9.0, name: 'Level +3', head: 'Living', text: '10 rooms on a central corridor; the last bay stays open; bathrooms in the café building.' },
    { key: 'Level +4', tab: '+4', y: 12.3, name: 'Level +4', head: 'Shared', text: 'The community kitchen under the ridge and two roof terraces.' }
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
  window.addEventListener('message', function (e) {
    if (e.source !== (frame && frame.contentWindow) || !e.data) return;
    if (e.data.s7ready) onReady();
    if (e.data.s7rotate === false) { var rb = $('#btnRotate'); if (rb) { rb.setAttribute('aria-pressed', 'false'); rb.textContent = 'Rotate: off'; } }
  });
  if (frame) {
    frame.addEventListener('load', function () { setTimeout(function () { if (!modelReady) { try { if (frame.contentWindow.S7API) onReady(); } catch (x) {} } }, 1500); });
    // Load the model file and hand it to the iframe as srcdoc. Some hosts (such as a claude.ai artifact) do not allow
    // a frame that points at another page, but they do serve the file to fetch(). Opened from disk, fetch() fails,
    // and the iframe falls back to the plain URL.
    var useSrc = function () { frame.src = 'model.html#embed=1&scen=s7'; };
    if (window.fetch && location.protocol !== 'file:') {
      fetch('model.html').then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (html) {
        var tag = '<script>window.__S7Q = "embed=1&scen=s7";<\/script>';
        html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, function (h) { return h + tag; }) : tag + html;
        frame.srcdoc = html;
      }).catch(useSrc);
    } else useSrc();
    setTimeout(function () { if (!modelReady) { var l = $('#modelLoad'); l.innerHTML = '<span style="max-width:44ch;text-align:center;padding:16px">The 3D model could not start here. It needs WebGL and the three.js library from cdn.jsdelivr.net.</span>'; } }, 30000);
  }
  // the transparent cover keeps the page scrolling over the model until the visitor clicks into it
  var cover = $('#modelCover'), stage = $('#modelStage');
  function uncover() { if (cover) cover.hidden = true; }
  if (cover) {
    cover.addEventListener('click', uncover);
    stage.addEventListener('mouseleave', function () { if (window.matchMedia('(hover:hover)').matches) cover.hidden = false; });
  }
  function toModel(cmd) {
    var t = $('#explore .model-box');
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
  // on and off switches for the slow rotation and the labels in the model
  [['#btnRotate', 'rotate', 'Rotate'], ['#btnLabels', 'labels', 'Labels']].forEach(function (q) {
    var b = $(q[0]); if (!b) return;
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on)); b.textContent = q[2] + ': ' + (on ? 'on' : 'off');
      send({ cmd: q[1], v: on });
    });
  });

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
    { id: 4, lv: '+4', h: '12.30 m', cat: 'comm', t: 'Shared', p: 'Community kitchen of about 130 m² under the ridge, a 14 m² roof terrace in the south slope and 67 m² on the café building.', key: 'Level +4' },
    { id: 3, lv: '+3', h: '9.00 m', cat: 'live', t: 'Living', p: '10 rooms on a central corridor, dormers in the roof. The last bay stays open, with a view of the organ.', key: 'Level +3' },
    { id: 2, lv: '+2', h: '5.60 m', cat: 'live', t: 'Living', p: '10 rooms on a central corridor, on top of the arcade arches. The corridor ends at the reading balcony on the organ gallery.', key: 'Level +2' },
    { id: 1, lv: '+1', h: '2.90 m', cat: 'learn', t: 'Study', p: '14 study rooms on the side-aisle galleries, each aisle reached by its own stair at the west end.', key: 'Level +1' },
    { id: 0, lv: 'G', h: '±0.00 m', cat: 'pub', t: 'Public', p: 'Reading hall below the living floors, book stacks in the aisles, café in the choir and the take-away café in the new building.', key: 'Ground floor' }
  ];
  function drawSection() {
    var s = $('#sectionSvg'); if (!s) return;
    var Y = function (y) { return 18.8 - y; };
    var g0 = svg('g', {}, s);
    function poly(pts, attrs, par) { return svg('polygon', Object.assign({ points: pts.map(function (p) { return p[0] + ',' + Y(p[1]); }).join(' ') }, attrs), par || g0); }
    function rect(z0, z1, y0, y1, attrs, par) { return svg('rect', Object.assign({ x: Math.min(z0, z1), y: Y(Math.max(y0, y1)), width: Math.abs(z1 - z0), height: Math.abs(y1 - y0) }, attrs), par || g0); }
    function text(z, y, t, cls, size, anchor, par) { var e = svg('text', { x: z, y: Y(y), 'class': cls, 'font-size': size, 'text-anchor': anchor || 'middle' }, par || g0); e.textContent = t; return e; }
    rect(-10.6, 15.4, -0.9, 0, { fill: 'var(--surface-2)' });
    svg('line', { x1: -10.6, x2: 15.4, y1: Y(0), y2: Y(0), stroke: 'var(--ink)', 'stroke-width': 0.06 }, g0);
    var LG = {};
    LAYERS.forEach(function (L) { LG[L.id] = svg('g', { 'class': 'lyr', 'data-layer': L.id }, s); });
    var F = function (cat, op) { return { fill: cv(cat), 'fill-opacity': op || 0.35, stroke: cv(cat), 'stroke-width': 0.05 }; };
    rect(-4.0, 4.0, 0, 5.4, F('pub', 0.22), LG[0]);
    rect(-8.6, -4.9, 0, 3.2, F('pub', 0.3), LG[0]);
    rect(6.3, 8.5, 0.06, 2.64, F('learn', 0.35), LG[0]);
    rect(4.9, 6.25, 0, 2.7, F('pub', 0.15), LG[0]);
    [[-8.5, -6.3], [6.3, 8.5]].forEach(function (q) { rect(q[0], q[1], 2.92, 5.5, F('learn'), LG[1]); });
    [[-6.3, -4.72], [4.72, 6.3]].forEach(function (q) { rect(q[0], q[1], 2.9, 4.0, { fill: cv('circ'), 'fill-opacity': 0.12 }, LG[1]); });
    [[5.6, 8.8, 2], [9.0, 12.1, 3]].forEach(function (q) {
      rect(-4.05, -0.9, q[0], q[1], F('live'), LG[q[2]]); rect(0.9, 4.05, q[0], q[1], F('live'), LG[q[2]]);
      rect(-0.9, 0.9, q[0], q[0] + 2.6, { fill: cv('circ'), 'fill-opacity': 0.14 }, LG[q[2]]);
    });
    poly([[-3, 12.3], [-3, ry(3)], [-2.37, 15.6], [2.37, 15.6], [3, ry(3)], [3, 12.3]], F('comm'), LG[4]);
    rect(3.0, 4.7, 12.3, 14.3, Object.assign(F('comm', 0.18), { 'stroke-dasharray': '.15 .1' }), LG[4]);
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
    poly([[-5.3, 12.45], [0, 18.2], [0, 18.55], [-5.3, 12.8]], W);
    poly([[0, 18.2], [2.9, ry(2.9)], [2.9, ry(2.9) + 0.35], [0, 18.55]], W);
    poly([[4.7, 12.5], [5.3, 12.45], [5.3, 12.8], [4.7, 13.0]], W);
    svg('line', { x1: 3.0, x2: 3.0, y1: Y(12.3), y2: Y(ry(2.9)), stroke: 'var(--c-comm)', 'stroke-width': 0.08 }, g0);
    svg('line', { x1: 4.7, x2: 4.7, y1: Y(12.5), y2: Y(13.4), stroke: 'var(--c-comm)', 'stroke-width': 0.06 }, g0);
    var SL = { fill: 'var(--ink)' };
    rect(-8.65, -4.72, 2.7, 2.9, SL); rect(4.72, 8.65, 2.7, 2.9, SL);
    rect(-4.6, 4.6, 5.4, 5.6, SL); rect(-4.6, 4.6, 8.8, 9.0, SL); rect(-3.0, 4.7, 12.1, 12.3, SL);
    [5.6, 9.0].forEach(function (y0) { [-4.05, -0.9, 0.9, 4.05].forEach(function (z) { rect(z - 0.05, z + 0.05, y0, y0 + (y0 > 6 ? 3.1 : 3.2), { fill: 'var(--ink)', 'fill-opacity': 0.7 }); }); });
    [-6.3, 6.3].forEach(function (z) { rect(z - 0.05, z + 0.05, 2.9, 5.5, { fill: 'var(--ink)', 'fill-opacity': 0.7 }); });
    var LS = 0.42;
    var rl = function (z, y, t, par) { text(z, y, t, 'sec-txt sec-roomlabel', LS, 'middle', par); };
    rl(0, 2.4, 'Reading hall', LG[0]); rl(-6.75, 1.4, 'Stacks', LG[0]); rl(7.4, 1.2, 'Study', LG[0]);
    rl(-7.4, 4.1, 'Study', LG[1]); rl(7.4, 4.1, 'Study', LG[1]);
    rl(-2.47, 7.0, 'Room', LG[2]); rl(2.47, 7.0, 'Room', LG[2]); rl(-2.47, 10.4, 'Room', LG[3]); rl(2.47, 10.4, 'Room', LG[3]);
    rl(0, 7.7, 'Corr.', LG[2]); rl(0, 11.1, 'Corr.', LG[3]);
    rl(0, 13.6, 'Kitchen', LG[4]); rl(3.85, 13.6, 'Terr.', LG[4]);
    LAYERS.forEach(function (L) {
      var y = [0, 2.9, 5.6, 9.0, 12.3][L.id];
      svg('line', { x1: 9.5, x2: 10.6, y1: Y(y), y2: Y(y), stroke: 'var(--muted)', 'stroke-width': 0.04, 'stroke-dasharray': '.12 .1' }, g0);
      svg('polygon', { points: (10.6) + ',' + Y(y) + ' ' + (10.95) + ',' + (Y(y) - 0.3) + ' ' + (10.25) + ',' + (Y(y) - 0.3), fill: 'var(--ink)' }, g0);
      text(11.2, y + 0.16, L.lv, 'sec-txt', 0.62, 'start');
      text(12.5, y + 0.16, L.h, 'sec-sub', 0.46, 'start');
    });
    text(11.2, 18.2 + 0.16, 'Ridge 18.20 m', 'sec-sub', 0.46, 'start');
    svg('line', { x1: 0.3, x2: 10.6, y1: Y(18.2), y2: Y(18.2), stroke: 'var(--muted)', 'stroke-width': 0.04, 'stroke-dasharray': '.12 .1' }, g0);
    text(-7.0, 6.15, 'Side aisle', 'sec-sub', 0.38); text(7.0, 6.15, 'Side aisle', 'sec-sub', 0.38);
    text(-9.2, -0.6, 'North', 'sec-sub', 0.42, 'start'); text(9.2, -0.6, 'South', 'sec-sub', 0.42, 'end');
    svg('rect', { x: -10.2, y: Y(17.2), width: 5, height: 0.14, fill: 'var(--ink)' }, g0); svg('rect', { x: -10.2, y: Y(17.2), width: 2.5, height: 0.14, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 0.03 }, g0);
    text(-10.2, 17.5, '0', 'sec-sub', 0.4, 'start'); text(-5.2, 17.5, '5 m', 'sec-sub', 0.4, 'middle');
    var list = $('#layerList');
    LAYERS.forEach(function (L) {
      var li = document.createElement('li');
      li.innerHTML = '<button type="button" aria-pressed="false" style="--c:' + cv(L.cat) + '"><span class="lv"><b>' + L.lv + '</b>' + L.h + '</span><span><h4><span class="sw" style="--c:' + cv(L.cat) + '"></span>' + L.t + '</h4><p>' + L.p + '</p><span class="linkbtn" data-go>Show floor plan</span></span></button>';
      var b = li.firstChild;
      function hot(on) { s.classList.toggle('dim', on); $$('.lyr', s).forEach(function (g) { g.classList.toggle('hot', on && +g.dataset.layer === L.id); }); }
      b.addEventListener('mouseenter', function () { hot(true); }); b.addEventListener('mouseleave', function () { if (b.getAttribute('aria-pressed') !== 'true') hot(false); });
      b.addEventListener('focus', function () { hot(true); }); b.addEventListener('blur', function () { if (b.getAttribute('aria-pressed') !== 'true') hot(false); });
      b.addEventListener('click', function (e) {
        var was = b.getAttribute('aria-pressed') === 'true';
        $$('button', list).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        if (e.target.hasAttribute('data-go')) { setLevel(L.key); $('#floors').scrollIntoView({ behavior: 'smooth' }); return; }
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
    text(29.9, 0, 'Voskenslaan', 'plan-note', 0.62, { transform: 'rotate(90 29.9 0)' });
    text(-12.4, 0, 'Clemenspoort', 'plan-note', 0.62, { transform: 'rotate(-90 -12.4 0)' });
    var na = svg('g', { transform: 'translate(27.6 -11.4)' }, gTxt);
    svg('polygon', { points: '0,-1 0.55,0.6 0,0.25 -0.55,0.6', fill: 'var(--ink)' }, na);
    text(0, 1.25, 'N', 'plan-lbl', 0.6, {}, na);
    svg('rect', { x: 18, y: 12.25, width: 5, height: 0.18, fill: 'var(--ink)' }, gTxt); svg('rect', { x: 18, y: 12.25, width: 2.5, height: 0.18, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 0.04 }, gTxt);
    text(18, 12.95, '0', 'plan-note', 0.5); text(23, 12.95, '5 m', 'plan-note', 0.5);
    var heights = { passage: 3.2, choir: 12.5, chapel: 7.6, alley: 4.2, aisle: 6.8 };
    var y0 = LVS[li].y;
    if (li <= 1) {
      rect(0, 29.1, -8.65, 8.65, { fill: 'var(--surface-2)' });
      rect(-7.6, 0, -4.4, 4.4, { fill: 'var(--surface-2)' });
    } else {
      rect(0, 29.1, -4.7, 4.7, { fill: 'var(--surface-2)' });
      [-1, 1].forEach(function (sd) { rect(0.2, 28.8, sd * 4.95, sd * 8.9, { fill: 'url(#hatch)' }); });
      var rl = li === 2 ? 'Lean-to roof of the side aisle (up to 9.10 m)' : 'Side-aisle roof below';
      text(14.5, -6.9, rl, 'plan-note', 0.5); text(14.5, 6.9, rl, 'plan-note', 0.5);
    }
    TRACE.classes.forEach(function (c) {
      if (heights[c.name] <= y0 + 0.1) return;
      if (c.name === 'passage' && li > 0) return;
      c.polys.forEach(function (p) { svg('polygon', Object.assign({ points: p.o.map(function (q) { return q[0] + ',' + q[1]; }).join(' ') }, WALL), gWalls); });
    });
    if (li >= 2) {
      [-1, 1].forEach(function (sd) { rect(-0.1, 29.1, sd * 4.45, sd * 4.95, WALL, gWalls); });
      rect(-0.45, 0.05, -4.95, -1.05, WALL, gWalls); rect(-0.45, 0.05, 1.05, 4.95, WALL, gWalls);
      rect(28.55, 29.1, -4.95, 4.95, WALL, gWalls);
    }
    if (li <= 1) TRACE.columns.forEach(function (q) { svg('circle', { cx: q[0], cy: q[1], r: 0.42, fill: 'var(--brick)' }, gWalls); });
    rect(-10.5, -0.3, -11.85, -4.6, li === 4 ? Object.assign({}, NEW, { 'stroke-dasharray': '.5 .3', 'stroke-width': 0.1 }) : NEW, gWalls);
    if (li === 0) rect(-10.5, -0.3, 4.6, 11.85, NEW, gWalls);
    rect(-10.42, -7.9, -4.8, 4.8, { fill: 'none', stroke: 'var(--c-comm)', 'stroke-width': 0.1 }, gWalls);
    var CI = { fill: cv('circ'), 'fill-opacity': 0.12 };
    if (li === 1) { rect(4.35, 27, -6.3, -4.72, CI); rect(4.35, 27, 4.72, 6.3, CI); text(15.7, -5.5, 'Gallery', 'plan-note', 0.5); text(15.7, 5.5, 'Gallery', 'plan-note', 0.5); }
    if (li === 2 || li === 3) { rect(0, 22.35, -0.9, 0.9, CI); text(11, 0, 'Corridor 1.80 m', 'plan-note', 0.5); rect(-10.3, -5.7, -11.65, -4.8, CI); text(-8.0, -8.2, 'Landing', 'plan-note', 0.5); }
    if (li >= 2) { rect(-8.6, 0.8, -1.0, 1.0, CI); text(-4.0, 0, 'Bridge', 'plan-note', 0.5); }
    if (li === 3 || li === 4) { rect(22.5, 28.5, -4.4, 4.4, { fill: 'none', stroke: 'var(--muted)', 'stroke-width': 0.05, 'stroke-dasharray': '.3 .2' }); text(25.5, 0, 'Open void above the organ gallery', 'plan-note', 0.45, { transform: 'rotate(90 25.5 0)' }); }
    var rooms = ROOMS.filter(function (r) { return r.lv === curLevel; });
    var chips = $('#roomChips'); chips.innerHTML = '';
    rooms.forEach(function (r) {
      var cat = catOf(r), g = svg('g', { 'class': 'plan-room' + (selRoom === r ? ' sel' : ''), tabindex: 0, role: 'button', 'aria-label': nm(r.name) + ', ' + m(r.m2) + ' m²' }, gRooms);
      var big = r.area && r.type !== 'core';
      svg('rect', { x: r.x0, y: r.z0, width: r.x1 - r.x0, height: r.z1 - r.z0, fill: cv(cat), 'fill-opacity': big ? 0.14 : 0.3, stroke: cv(cat), 'stroke-width': big ? 0.08 : 0.12 }, g);
      var w = r.x1 - r.x0, h = r.z1 - r.z0, lbl = shortLbl(r), fs = Math.min(0.62, w / (lbl.length * 0.62 + 0.4), h / 1.6);
      if (fs > 0.28) {
        text((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2 - (h > 2.2 && !big ? 0.3 : 0), lbl, 'plan-lbl', fs, {}, g);
        if (h > 2.2 && !big && r.type !== 'core') text((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2 + 0.45, m(r.m2) + ' m²', 'plan-note', Math.min(0.42, fs * 0.8), {}, g);
        if (big && r.m2 > 20) text((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2 + 0.8, nf.format(Math.round(r.m2)) + ' m²', 'plan-note', 0.45, {}, g);
      }
      g.addEventListener('click', function () { selectRoom(r); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectRoom(r); } });
      bindTip(g, '<b>' + esc(nm(r.name)) + '</b><br>' + m(r.m2) + ' m² · ' + CAT[cat].name);
      r._g = g;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', String(selRoom === r));
      b.innerHTML = '<span class="sw" style="--c:' + cv(cat) + '"></span>' + esc(nm(r.name)); b.addEventListener('click', function () { selectRoom(r); }); chips.appendChild(b); r._chip = b;
    });
    var used = {}; rooms.forEach(function (r) { used[catOf(r)] = 1; });
    $('#planLegend').innerHTML = Object.keys(CAT).filter(function (k) { return used[k]; }).map(function (k) { return '<span><span class="sw" style="--c:' + cv(k) + '"></span>' + CAT[k].name + '</span>'; }).join('') + '<span><span class="sw" style="--c:var(--brick)"></span>Existing church</span><span><span class="sw" style="--c:transparent;border:2px solid var(--ink)"></span>New building</span>';
    var sum = rooms.filter(function (r) { return r.type !== 'core'; }).reduce(function (a, r) { return a + r.m2; }, 0);
    $('#levelSum').textContent = LVS[li].name + ' · floor at ' + lvH(LVS[li].y) + ' m · ' + rooms.length + ' rooms and areas · ' + nf.format(Math.round(sum)) + ' m² net';
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
    $('#roomPanel').innerHTML = '<p class="eyebrow">' + L.name + '</p><h3>' + L.head + '</h3><p class="muted small">' + esc(L.text) + '</p>' +
      '<dl>' + Object.keys(CAT).filter(function (k) { return by[k] && k !== 'circ'; }).map(function (k) { return '<dt><span class="sw" style="--c:' + cv(k) + '"></span> ' + CAT[k].name + '</dt><dd>' + nf.format(Math.round(by[k])) + ' m²</dd>'; }).join('') + '</dl>' +
      '<p class="small muted">Click a room in the plan or in the list below to see its details and walk into it in the 3D model.</p>';
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
    if (r.type === 'terrace7') h = 'open air';
    $('#roomPanel').innerHTML = '<p class="eyebrow">' + L.name + ' · floor at ' + lvH(r.y0) + ' m</p><h3>' + esc(nm(r.name)) + '</h3>' +
      '<p><span class="tag"><span class="sw" style="--c:' + cv(cat) + '"></span>' + CAT[cat].name + '</span></p>' +
      '<dl><dt>Area</dt><dd>' + m(r.m2) + ' m²' + (r.area ? '' : ' net') + '</dd><dt>Size</dt><dd>' + dims + '</dd><dt>Ceiling height</dt><dd>' + h + '</dd>' + (r.door ? '<dt>Door</dt><dd>' + (r.type === 'student' || r.type === 'core' ? 'EI30 fire door' : 'Door') + '</dd>' : '') + '</dl>' +
      '<p class="small">' + esc(descOf(r)) + '</p>' +
      '<div class="acts"><button class="btn small primary" type="button" data-act="enter">Walk into it in 3D</button><button class="btn small" type="button" data-act="roam">Walk freely from here</button>' + (rk ? '<button class="btn small" type="button" data-act="type">Room model</button>' : '') + '</div>';
    var p = $('#roomPanel');
    $('[data-act="enter"]', p).addEventListener('click', function () { toModel({ cmd: 'room', name: r.name }); });
    $('[data-act="roam"]', p).addEventListener('click', function () { toModel({ cmd: 'room', name: r.name, roam: true }); });
    if (rk) $('[data-act="type"]', p).addEventListener('click', function () { selectType(rk); $('#rooms').scrollIntoView({ behavior: 'smooth' }); });
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
    { key: 'student', cat: 'live', name: 'Student room', count: '20×', lv: 'Levels +2 and +3', dims: ['4.20 × 3.15', 'm'], area: ['12.5', 'm² net'], h: ['3.2 / 3.1', 'm high'], model: 'Student room 2.03',
      p: 'A private retreat: compact, quiet and furnished. Five rooms sit on each side of a 1.8 m central corridor on levels +2 and +3.',
      f: ['Bed 90 × 200 cm, desk 120 × 60 cm with chair', 'Wall shelf above the desk, wardrobe, rug', 'Window 1.50 × 1.10 m in the outer wall', 'EI30 fire door, transponder access'], who: 'For students who want to live together and still have a room of their own.' },
    { key: 'studysm', cat: 'learn', name: 'Study room', count: '16×', lv: 'Level +1 (14), ground floor (2)', dims: ['3.16 × 2.20', 'm'], area: ['6.4', 'm² (ground floor 7.4)'], h: ['2.58', 'm high'], model: 'Study room 1.03',
      p: 'Small rooms for studying on the galleries above the side aisles, looking through the arcade into the reading hall. They are for work, not for living.',
      f: ['Desk 170 × 65 cm, chair, reading lamp', 'Shelf and armchair', 'Door onto the gallery along the arcade', 'Bookable for residents and library users'], who: 'For exam weeks, work in pairs or quiet hours outside the bedroom.' },
    { key: 'commkitchen', cat: 'comm', name: 'Community kitchen', count: '1×', lv: 'Level +4', dims: ['22.0 × 6.0', 'm'], area: ['132', 'm²'], h: ['2.6 – 5.9', 'm under the roof'], model: 'Community kitchen and dining hall',
      p: 'The living room of the building, under the ridge. All 20 residents cook, eat and meet here. A glass door opens onto the small roof terrace.',
      f: ['11 m kitchen run with hobs, sinks, wall units and two fridges', 'Two islands with five stools each', 'Five dining tables for 30 people in total', 'Sofa corner, roof windows in the north slope'], who: 'For all residents. It is the only kitchen in the building; residents of levels +2 and +3 take the lift up.' },
    { key: 'terraceS', cat: 'comm', name: 'Roof terrace by the kitchen', count: '1×', lv: 'Level +4', dims: ['8.0 × 1.7', 'm'], area: ['≈ 14', 'm²'], h: ['open air', ''], model: 'Roof terrace, about 14 m²',
      p: 'A narrow terrace cut into the south slope of the red tile roof, with dark red window frames, a blue steel edge and glass at the sides.',
      f: ['Glass wall to the kitchen with a door in the middle', 'Glazed sides that follow the roof line', '1.10 m glass guard on the church wall', 'Two bistro tables with yellow cloths, planters'], who: 'For coffee after breakfast and a view over Ghent.' },
    { key: 'terraceL', cat: 'comm', name: 'Roof terrace, café building', count: '1×', lv: 'Level +4', dims: ['9.8 × 6.85', 'm'], area: ['≈ 67', 'm²'], h: ['open air', ''], model: 'Roof terrace on the café building, about 67 m²',
      p: 'The roof of the new building is the large terrace of the house. It is level with the kitchen and reached through the glazed wing by lift and stair.',
      f: ['Timber deck, glass guard with steel handrail on three sides', 'Planters along the north edge', 'Four bistro tables, two parasols', 'Long table with benches, two loungers'], who: 'For summer evenings, shared dinners and residents’ parties.' },
    { key: 'library', cat: 'pub', name: 'Reading hall', count: '1×', lv: 'Ground floor', dims: ['26.0 × 8.0', 'm'], area: ['208', 'm²'], h: ['5.4', 'm (last bay 12 m)'], model: 'Library reading hall',
      p: 'The heart of the project: the nave as an open public reading hall between the octagonal piers, on the original tiled floor.',
      f: ['Four long tables with six seats and reading lamps each', 'Shelf rings around the ten piers', 'Two rows of free-standing shelf units', 'Book stacks in both side aisles'], who: 'For everyone: students, pupils from the neighbourhood, residents and visitors.' },
    { key: 'cafeIn', cat: 'cafe', name: 'Café in the choir', count: '1×', lv: 'Ground floor', dims: ['7.2 × 6.6', 'm'], area: ['47.5', 'm²'], h: ['4.6', 'm'], model: 'Café inside: second order point and seating',
      p: 'The former choir platform holds a second café counter. A glass wall with a glass door keeps noise and cups out of the reading hall.',
      f: ['Counter with four bar stools, pass-through window in the choir wall', 'Two bistro tables, two sofas, coffee table', 'Glass wall with glass door to the reading hall', 'Floor drawn without a step (today a 0.6 m platform)'], who: 'For study breaks and for guests who only come for a coffee.' },
    { key: 'takeaway', cat: 'cafe', name: 'Take-away café', count: '1×', lv: 'Ground floor, new building', dims: ['9.8 × 6.8', 'm'], area: ['58', 'm² + storage 5.3'], h: ['2.7', 'm'], model: 'Take-away café',
      p: 'The café on the ground floor of the new building opens to the street. It is the small paying commercial tenant of the house.',
      f: ['3.4 m counter with display, back bar, coffee machine', 'Seven bistro tables with 14 seats', 'Storage room of about 5 m², EI60 fire door', 'Shop window to the street'], who: 'For students, neighbours and commuters on their way to the station.' },
    { key: 'organ', cat: 'pub', name: 'Organ gallery, reading balcony', count: '1×', lv: 'Level +2', dims: ['8.0 × 4.2', 'm'], area: ['33.6', 'm²'], h: ['open', 'up to the roof'], model: 'Organ gallery, reading balcony',
      p: 'The organ gallery above the old main entrance is kept. It becomes a reading balcony with armchairs and a view over the whole reading hall.',
      f: ['Organ cases with pipes on both sides of the tower', 'Four reading chairs, side tables, bookshelves', 'Glass balustrade to the nave', 'Reached by the level +2 corridor'], who: 'For quiet reading with the best view in the building.' },
    { key: 'bath', cat: 'serv', name: 'Bathroom (women and men)', count: '4×', lv: 'Levels +2 and +3', dims: ['5.2 × 3.35', 'm'], area: ['≈ 16.7', 'm²'], h: ['2.4', 'm'], model: 'Toilets and showers, women, level +2',
      p: 'The bathrooms are in the café building, reached across the bridge and the glazed wing. Each level has one room for women and one for men.',
      f: ['Three toilet cubicles', 'Three washbasins with mirror', 'Two walk-in showers with glass screens', 'Per level: 4 showers for 10 rooms'], who: 'For the residents of that level. Level +4 has no toilets; the nearest are one lift stop down.' },
    { key: 'lobby', cat: 'pub', name: 'Entrance and book return', count: '1×', lv: 'Ground floor, glazed wing', dims: ['8.1 × 2.4', 'm'], area: ['≈ 9.8', 'm² free'], h: ['3.4', 'm'], model: 'Entrance and book return',
      p: 'The glazed wing facing Clemenspoort is the main entrance for everyone: library, café and residents. The lift and stair to every level stand here too.',
      f: ['3 m portal with two sliding doors and a canopy', 'Book return next to the portal', '1.5 × 1.5 m lift that stops on every level', 'U-shaped stair; 2.2 m opening into the choir'], who: 'For all visitors; residents go upstairs with their transponder.' },
    { key: 'locker', cat: 'serv', name: 'Locker room', count: '2×', lv: 'Ground floor, north aisle', dims: ['3.8 × 3.6', 'm'], area: ['12.9', 'm²'], h: ['2.8', 'm'], model: 'Locker room 1',
      p: 'A room inside the north aisle, so that bags and coats stay out of the reading hall.',
      f: ['16 lockers in two rows', 'Bench in the middle', 'Mirror and shoe rack'], who: 'For library visitors.' },
    { key: 'bikes', cat: 'serv', name: 'Bicycle store', count: '1×', lv: 'Ground floor, new building south', dims: ['9.8 × 6.8', 'm'], area: ['66.6', 'm²'], h: ['2.7', 'm'], model: 'Bicycle parking',
      p: 'Ghent is a cycling city. The one-storey building at the south-west corner holds about 60 bicycles.',
      f: ['Five rows of stands', 'About 60 places', 'Right next to the main entrance', 'Whether this is enough for residents and visitors still has to be calculated'], who: 'For residents and library visitors.' }
  ];
  var rtCur = null, rtMounted = false;
  function selectType(key) {
    var t = null; RT.forEach(function (x) { if (x.key === key) t = x; }); if (!t) return;
    rtCur = t;
    $$('#rtList button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.k === key)); });
    var c = $('#rtCard');
    c.innerHTML = '<p class="eyebrow">' + t.lv + ' · ' + t.count + '</p><h3>' + t.name + '</h3>' +
      '<div class="dims"><div><b>' + t.dims[0] + '</b><span>' + t.dims[1] + '</span></div><div><b>' + t.area[0] + '</b><span>' + t.area[1] + '</span></div><div><b>' + t.h[0] + '</b><span>' + (t.h[1] || 'height') + '</span></div></div>' +
      '<p>' + t.p + '</p><ul>' + t.f.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><p class="who">' + t.who + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px"><button class="btn small primary" type="button" id="rtWalk">Walk into it in the full model</button></div>';
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
      if (!rtMounted) { var f = document.createElement('div'); f.className = 'vfail'; f.textContent = '3D view not available: this browser has no WebGL, or three.js did not load.'; viewer.appendChild(f); return; }
      if (rtCur) window.S7Rooms.show(rtCur.key);
    }
    if (window.IntersectionObserver) { var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { mountNow(); io.disconnect(); } }, { rootMargin: '400px' }); io.observe(viewer); } else mountNow();
    $('#rtReset').addEventListener('click', function () { if (rtMounted) window.S7Rooms.resetView(); });
    $('#rtRot').addEventListener('click', function () { if (!rtMounted) return; var on = window.S7Rooms.toggleRotate(); this.textContent = 'Rotate: ' + (on ? 'on' : 'off'); });
    selectType('student');
  }

  /* ================= student room plan (1:50) ================= */
  function drawRoomPlan() {
    var s = $('#roomPlan'); if (!s) return;
    var W = 4.2, D = 3.15, t = 0.1;
    var g = svg('g', {}, s);
    function r(x, y, w, h, a) { return svg('rect', Object.assign({ x: x, y: y, width: w, height: h }, a), g); }
    function T(x, y, size, text, cls) { var e = svg('text', { x: x, y: y, 'font-size': size, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'class': cls || 'plan-note' }, g); e.textContent = text; return e; }
    r(0, 0, W, D, { fill: 'var(--c-live)', 'fill-opacity': 0.08 });
    var WL = { fill: 'var(--ink)' };
    r(-t, -t, W + 2 * t, t, WL); r(-t, 0, t, D, WL); r(W, 0, t, D, WL);
    r(-t, D, 2.83 + t, t, WL); r(3.73, D, W - 3.73 + t, t, WL);
    r(1.35, -t, 1.5, t, { fill: 'var(--c-comm)', 'fill-opacity': 0.6 });
    svg('path', { d: 'M3.73 ' + D + ' L3.73 ' + (D - 0.9) + ' A0.9 0.9 0 0 0 2.83 ' + D, fill: 'none', stroke: 'var(--muted)', 'stroke-width': 0.02 }, g);
    r(3.71, D - 0.9, 0.04, 0.9, { fill: 'var(--brick)' });
    var FU = { fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 0.025 };
    r(0.1, 0.1, 2.0, 0.9, FU); r(0.15, 0.15, 0.4, 0.8, { fill: 'none', stroke: 'var(--muted)', 'stroke-width': 0.02 }); T(1.2, 0.55, 0.2, 'Bed 90 × 200', 'plan-lbl');
    r(2.6, 0.1, 1.2, 0.6, FU); T(3.2, 0.4, 0.2, 'Desk', 'plan-lbl');
    svg('circle', { cx: 3.2, cy: 1.05, r: 0.22, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 0.025 }, g);
    r(0.1, 2.48, 0.6, 0.55, FU); T(0.4, 2.755, 0.14, 'Wardrobe', 'plan-lbl');
    r(1.2, 1.18, 1.8, 1.2, { fill: 'var(--c-live)', 'fill-opacity': 0.12, stroke: 'var(--c-live)', 'stroke-width': 0.02, 'stroke-dasharray': '.06 .05' }); T(2.1, 1.78, 0.16, 'Rug');
    T(2.1, -0.28, 0.15, 'Window 1.50 m'); T(3.28, D + 0.33, 0.17, 'EI30 door · corridor');
    var DL = { stroke: 'var(--muted)', 'stroke-width': 0.015 };
    svg('line', Object.assign({ x1: 0, x2: W, y1: -0.6, y2: -0.6 }, DL), g); svg('line', Object.assign({ x1: 0, x2: 0, y1: -0.68, y2: -0.52 }, DL), g); svg('line', Object.assign({ x1: W, x2: W, y1: -0.68, y2: -0.52 }, DL), g);
    T(W / 2, -0.76, 0.19, '4.20 m', 'plan-lbl');
    svg('line', Object.assign({ x1: W + 0.45, x2: W + 0.45, y1: 0, y2: D }, DL), g); svg('line', Object.assign({ x1: W + 0.37, x2: W + 0.53, y1: 0, y2: 0 }, DL), g); svg('line', Object.assign({ x1: W + 0.37, x2: W + 0.53, y1: D, y2: D }, DL), g);
    var v = T(W + 0.62, D / 2, 0.19, '3.15 m', 'plan-lbl'); v.setAttribute('transform', 'rotate(90 ' + (W + 0.62) + ' ' + D / 2 + ')');
  }

  /* ================= a day in S7 ================= */
  var DAY = [
    ['07:30', 'live', 'Wake up', 'Room 2.06, level +2, south side.', 'Student room 2.06'],
    ['07:45', 'serv', 'Shower', 'Along the corridor and across the bridge into the café building, about 25 m.', 'Toilets and showers, women, level +2'],
    ['08:15', 'comm', 'Breakfast', 'Two floors up by lift to the community kitchen.', 'Community kitchen and dining hall'],
    ['08:40', 'comm', 'Coffee outside', 'Through the glass door onto the small terrace in the south roof.', 'Roof terrace, about 14 m²'],
    ['09:10', 'serv', 'Off to class', 'Bike out of the bicycle store to the nearby campuses.', 'Bicycle parking'],
    ['13:00', 'cafe', 'Lunch break', 'A sandwich from the take-away café on the ground floor.', 'Take-away café'],
    ['14:00', 'learn', 'Study', 'Study room 1.05 is booked for the afternoon.', 'Study room 1.05'],
    ['17:30', 'pub', 'Fetch books', 'In the reading hall under the vault, among neighbours and pupils.', 'Library reading hall'],
    ['19:30', 'comm', 'Cook together', 'On Wednesdays one floor cooks for everyone.', 'Community kitchen and dining hall'],
    ['21:30', 'comm', 'Evening on the roof', 'On the large terrace above the café.', 'Roof terrace on the café building, about 67 m²'],
    ['23:00', 'live', 'Back in the room', 'The reading hall below has closed and the house goes quiet.', 'Student room 2.06']
  ];
  function initDay() {
    var ol = $('#dayList');
    DAY.forEach(function (d) {
      var li = document.createElement('li');
      li.innerHTML = '<time>' + d[0] + '</time><span class="dot" style="--c:' + cv(d[1]) + '"></span><div><h4>' + d[2] + '</h4><p>' + d[3] + '</p><button class="linkbtn go" type="button">See it in 3D</button></div>';
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
    barChart($('#marketChart'), [
      { l: 'S7 social rate', v: 395, c: cv('live') },
      { l: 'S7 standard', v: 540, c: cv('live') },
      { l: 'Ghent, room avg. (UGent 25–26)', v: 542, ref: 1, c: 'var(--c-circ)', tip: 'Average all-in rent for a room' },
      { l: 'Ghent, room avg. (city, 2024)', v: 544, ref: 1, c: 'var(--c-circ)', tip: '€544.11 including costs' },
      { l: 'Ghent, studio avg. (UGent 25–26)', v: 701, ref: 1, c: 'var(--c-circ)', tip: 'Studio with its own bathroom and kitchen' }
    ], 750, [0, 250, 500, 750], eur, '€/month');
    var by = {}; ROOMS.forEach(function (r) { var c = catOf(r); if (c !== 'circ') by[c] = (by[c] || 0) + r.m2; });
    var order = ['pub', 'cafe', 'live', 'learn', 'comm', 'serv'], total = 0; order.forEach(function (k) { total += by[k] || 0; });
    barChart($('#areaChart'), order.map(function (k) { return { l: CAT[k].name, v: by[k] || 0, c: cv(k), tip: Math.round((by[k] || 0) / total * 100) + '% of the drawn net area' }; }), 400, [0, 100, 200, 300, 400], function (v) { return nf.format(Math.round(v)) + ' m²'; }, 'm²');
    $('#areaTable').innerHTML = '<thead><tr><th>Use</th><th class="r">m²</th><th class="r">Share</th></tr></thead><tbody>' + order.map(function (k) { return '<tr><td>' + CAT[k].name + '</td><td class="r">' + nf.format(Math.round(by[k] || 0)) + '</td><td class="r">' + Math.round((by[k] || 0) / total * 100) + '%</td></tr>'; }).join('') + '<tr><th>Total</th><td class="r"><b>' + nf.format(Math.round(total)) + '</b></td><td class="r">100%</td></tr></tbody>';
    var SC = [
      { l: 'S1 Campus Church', v: 3.45, t: 'Study, rank 1', rows: [5, 3, 4, 3, 3, 3, 2] },
      { l: 'S2 Clemens Hub', v: 2.55, t: 'Study, rank 3', rows: [3, 2, 3, 2, 2, 2, 4] },
      { l: 'S3 Overwale Office', v: 2.15, t: 'Study, rank 4', rows: [1, 2, 2, 3, 4, 3, 1] },
      { l: 'S4 Student Residence', v: 3.35, t: 'Study, rank 2', rows: [3, 3, 2, 5, 3, 4, 4] },
      { l: 'S5 Layered Church', v: 3.60, t: 'preliminary, team estimate', rows: [4, 3, 4, 4, 3, 3, 4] },
      { l: 'S6 Library Church', v: null },
      { l: 'S6+ Library Church Plus', v: null },
      { l: 'S7 Library Church', v: null }
    ];
    barChart($('#scoreChart'), SC.map(function (s, i) { return { l: s.l, v: s.v, na: 'open', c: i === 4 ? 'color-mix(in srgb, var(--c-pub) 50%, var(--surface))' : 'var(--c-pub)', tip: s.t || 'not scored yet' }; }), 5, [0, 1, 2, 3, 4, 5], function (v) { return nf2.format(v); }, 'points');
    var CR = ['Zoning and legal fit', 'Financial viability', 'Heritage fit', 'Market demand', 'Energy and technical', 'Delivery risk', 'Social and affordability'], WT = [20, 20, 15, 15, 10, 10, 10];
    $('#scoreTable').innerHTML = '<thead><tr><th>Criterion</th><th class="r">Weight</th>' + SC.slice(0, 5).map(function (s) { return '<th class="r">' + s.l.split(' ')[0] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      CR.map(function (c, i) { return '<tr><td>' + c + '</td><td class="r">' + WT[i] + '%</td>' + SC.slice(0, 5).map(function (s) { return '<td class="r">' + s.rows[i] + '</td>'; }).join('') + '</tr>'; }).join('') +
      '<tr><th>Total</th><td></td>' + SC.slice(0, 5).map(function (s) { return '<td class="r"><b>' + nf2.format(s.v) + '</b></td>'; }).join('') + '</tr></tbody>';
  }

  /* ================= evolution and open points ================= */
  function initLists() {
    var EVO = [
      ['S1', 'Campus Church', 'Rooms for the colleges as boxes inside the nave, a new west entrance.', 'study'],
      ['S2', 'Clemens Hub', 'Social restaurant, short-stay rooms in a tower, associations in the attic.', 'study'],
      ['S3', 'Overwale Office', 'Offices and coworking with about 90 desks.', 'study'],
      ['S4', 'Voskenslaan Student Residence', '42 rooms on four levels, a student restaurant in the nave.', 'study'],
      ['S5', 'Layered Church', 'Public ground floor, only 12 rooms in the side aisles.', 'own proposal'],
      ['S6', 'Library Church', 'Library in the nave, study rooms, 29 rooms in the S4 layout.', 'own proposal'],
      ['S6+', 'Library Church Plus', 'Denser library, rooms and four two-bedroom flats.', 'own proposal'],
      ['S7', 'Library Church', 'S6+ redrawn from the photos: full access, organ gallery kept free, kitchen under the ridge, 20 rooms.', 'this site']
    ];
    $('#evo').innerHTML = EVO.map(function (e) { return '<li' + (e[0] === 'S7' ? ' class="now"' : '') + '><b>' + e[0] + '</b><div><h4>' + e[1] + '</h4><p>' + e[2] + '</p></div><span class="tag">' + e[3] + '</span></li>'; }).join('');
    var H = [
      'Can the upper side aisles be divided into rooms along the pier grid?',
      'Can the nave be partly divided into floors with a central corridor?',
      'Can three openings be cut into the west gable? <span>The upper two sit in the blind niches, the lowest in the white lower part.</span>',
      'Can the organ gallery be used as a reading balcony?',
      'Can a recess of about 8 × 2 m be cut into the south roof slope?',
      'Are dormers and roof windows allowed on both slopes? <span>With the red tiles they would be clearly visible.</span>',
      'Can a stair be built at the west end of each side aisle?',
      'Can the west facade be opened as an entrance, and a 2.2 m opening be cut into the west wall of the choir?',
      'Can the choir floor be brought down to the level of the nave (today a 0.6 m platform)?',
      'May new volumes be built against the west facade next to the choir?'
    ];
    var P = [
      'Is student housing allowed in the community-facilities zone?',
      'Can the parking requirement be reduced because the station is close by?',
      'Which second escape route serves the nave floors?',
      'Are about 60 bicycle places enough? <span>The requirement has not been calculated yet.</span>'
    ];
    var X = [
      'Second escape route: <span>levels +2 to +4 only have the stair and lift in the glazed wing.</span>',
      'Step-free access: <span>the study rooms on level +1 are reached by stair only; the small lifts of S6+ were removed.</span>',
      'Daylight on level +2: <span>the outer wall of these rooms sits under the lean-to roof of the side aisles (up to 9.10 m). Daylight has to be proven, for example with rooflights in the aisle roof. Our own check in the model.</span>',
      'Kitchens: <span>one kitchen for 20 rooms. The S4 notes mention a rule of one kitchen per ten units; whether one large kitchen with several cooking runs is enough has to be checked.</span>',
      'Distance to the bathrooms: <span>about 40 m from the easternmost room to the bathroom in the café building; level +4 has no toilets.</span>',
      'Sound insulation between the reading hall, study rooms and bedrooms.',
      'Fire safety: <span>the EI30 and EI60 doors are a first proposal and have not been checked.</span>',
      'Structure: <span>new floors in the nave and the load of the shelving.</span>',
      'Condition: <span>roof, damp, asbestos in the roof boarding.</span>',
      'Height of the reading hall: <span>5.4 m remain below level +2; the full height of the nave is only felt in the last bay.</span>'
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
      $('#monOut').textContent = mon + ' months';
      $('#yearOut').textContent = eur(per * mon);
      $('#perOut').textContent = eur(per) + ' a month, all inclusive';
      $('#calcRows').innerHTML = '<div><span>Rent (' + mon + ' × ' + eur(rent) + ')</span><span>' + eur(rent * mon) + '</span></div><div><span>Service charge (' + mon + ' × ' + eur(fee) + ')</span><span>' + eur(fee * mon) + '</span></div><div><span>Deposit, returned when you move out</span><span>up to ' + eur(rent * 2) + '</span></div><div><span>Bike place, study rooms, terraces</span><span>included</span></div>';
    }
    $$('#tarifSeg button').forEach(function (b) { b.addEventListener('click', function () { tarif = b.dataset.t; press($('#tarifSeg'), b); upd(); }); });
    $('#mon').addEventListener('input', upd); upd();

    function inv() {
      var rent = +$('#iRent').value, soc = +$('#iSoc').value, occ = +$('#iOcc').value / 100, cafe = +$('#iCafe').value, lib = +$('#iLib').value, ev = +$('#iEv').value;
      $('#iRentO').textContent = eur(rent); $('#iSocO').textContent = soc; $('#iOccO').textContent = Math.round(occ * 100) + '%'; $('#iCafeO').textContent = eur(cafe); $('#iLibO').textContent = eur(lib); $('#iEvO').textContent = ev;
      var parts = [
        { k: 'live', l: 'Student housing', d: (20 - soc) + ' × ' + eur(rent) + ' + ' + soc + ' × €320, ' + Math.round(occ * 100) + '% occupied', v: ((20 - soc) * rent + soc * 320) * 12 * occ },
        { k: 'pub', l: 'Library', d: '≈ 600 m² × ' + eur(lib), v: lib * 600 },
        { k: 'cafe', l: 'Café', d: '12 × ' + eur(cafe), v: cafe * 12 },
        { k: 'comm', l: 'Events', d: ev + ' × €250', v: ev * 250 }
      ];
      var tot = parts.reduce(function (a, p) { return a + p.v; }, 0);
      $('#iTot').textContent = eur(tot);
      $('#iSub').textContent = tot ? Math.round(parts[0].v / tot * 100) + '% from housing · ' + eur(parts[0].v / 250) + ' per m² of room area a year' : '';
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
