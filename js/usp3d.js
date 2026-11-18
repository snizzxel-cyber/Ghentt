/* "Why S7" band: the rooms of S7 as coloured blocks, level by level, inside a line drawing of the church.
   Scrolling through the steps lifts the levels apart and lights up one layer at a time. Built from window.S7_ROOMS. */
(function () {
  'use strict';
  var T = window.THREE, ROOMS = window.S7_ROOMS || [], TR = window.S7_TRACE || { classes: [] };
  var canvas = document.getElementById('uspCanvas'), stage = canvas && canvas.parentNode;
  if (!T || !canvas) return;
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  var scene = new T.Scene(), camera = new T.PerspectiveCamera(34, 1, 0.5, 600);
  scene.add(new T.HemisphereLight(0xffffff, 0x8a9aa0, 0.85));
  var sun = new T.DirectionalLight(0xffffff, 0.65); sun.position.set(-30, 60, 40); scene.add(sun);

  var CAT = { pub: 0x00908f, cafe: 0xb8860b, live: 0x7a5c9e, learn: 0xd0684a, comm: 0x3f8fd0, serv: 0x5e9e3a, circ: 0x4f5b63 };
  function catOf(r) {
    if (/^Café|Take-away/.test(r.name)) return 'cafe';
    if (/Organ gallery/.test(r.name)) return 'pub';
    return { library2: 'pub', stacks: 'pub', lobby: 'pub', studysm: 'learn', student: 'live', commkitchen: 'comm', terrace7: 'comm', wc1: 'serv', wc3: 'serv', wc3w: 'serv', locker: 'serv', bikes: 'serv', core: 'circ', storage: 'cafe', lounge: 'pub' }[r.type] || 'circ';
  }
  var LV = ['Ground floor', 'Level +1', 'Level +2', 'Level +3', 'Level +4'], LVY = [0, 2.9, 5.6, 9.0, 12.3], GAP = 6.5;
  var root = new T.Group(); root.position.set(-9.5, 0, 0); scene.add(root);
  var levels = LV.map(function (k, i) {
    var g = new T.Group(); root.add(g);
    return { g: g, mats: {}, lines: [], k: k };
  });
  function matFor(L, cat) {
    if (!L.mats[cat]) L.mats[cat] = new T.MeshStandardMaterial({ color: CAT[cat], roughness: 0.6, emissive: CAT[cat], emissiveIntensity: 0.06, transparent: true, opacity: 0.94 });
    return L.mats[cat];
  }
  var edgeMat = function () { return new T.LineBasicMaterial({ color: 0x13222a, transparent: true, opacity: 0.3 }); };
  function block(L, x0, x1, y0, h, z0, z1, cat) {
    var w = Math.max(0.1, x1 - x0 - 0.08), d = Math.max(0.1, z1 - z0 - 0.08);
    var geo = new T.BoxGeometry(w, h, d), m = new T.Mesh(geo, matFor(L, cat));
    m.position.set((x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2); L.g.add(m);
    var e = new T.LineSegments(new T.EdgesGeometry(geo), edgeMat()); e.position.copy(m.position); L.g.add(e); L.lines.push(e.material);
  }
  ROOMS.forEach(function (r) {
    var i = LV.indexOf(r.lv); if (i < 0) return;
    var L = levels[i], cat = catOf(r), y0 = LVY[i], h;
    if (r.type === 'terrace7') h = 0.35; else if (r.type === 'core') h = Math.min(2.6, Math.max(0.4, r.y1 - r.y0)); else h = Math.min(2.6, r.y1 - r.y0);
    block(L, r.x0, r.x1, y0, h, r.z0, r.z1, cat);
    if (r.alc) block(L, r.alc.x0, r.alc.x1, y0, 2.1, r.alc.z0, r.alc.z1, cat);
  });
  // floor plates: a faint slab under each level
  var plateMat = [];
  levels.forEach(function (L, i) {
    var pm = new T.MeshBasicMaterial({ color: 0x1d6a71, transparent: true, opacity: 0.05, depthWrite: false }); plateMat.push(pm);
    var p = new T.Mesh(new T.BoxGeometry(40.5, 0.05, i <= 1 ? 24 : 24), pm);
    p.position.set(9.3, LVY[i] - 0.05, 0); L.g.add(p);
    // level tag, to the west of the plate
    var cv = document.createElement('canvas'); cv.width = 160; cv.height = 64; var c = cv.getContext('2d');
    c.font = '600 40px Arial, sans-serif'; c.fillStyle = '#13222a'; c.textBaseline = 'middle'; c.fillText(i ? '+' + i : 'G', 8, 34);
    var sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthTest: false }));
    sp.scale.set(5, 2, 1); sp.position.set(-14, LVY[i] + 0.8, 12.5); L.g.add(sp); L.tag = sp.material;
  });
  // the church as a line drawing: traced footprint, nave walls, aisle roofs, main roof and gables
  var shell = new T.Group(); root.add(shell);
  var shellMat = new T.LineBasicMaterial({ color: 0xa9523b, transparent: true, opacity: 0.7 });
  function line(pts) { var g = new T.BufferGeometry().setFromPoints(pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); })); shell.add(new T.Line(g, shellMat)); }
  TR.classes.forEach(function (c) {
    if (['aisle', 'choir', 'chapel'].indexOf(c.name) < 0) return;
    c.polys.forEach(function (p) { var pts = p.o.map(function (q) { return [q[0], 0.02, q[1]]; }); pts.push(pts[0]); line(pts); });
  });
  var X0 = 0, XE = 29.1;
  [-1, 1].forEach(function (s) {
    line([[X0, 6.8, s * 9.3], [XE, 6.8, s * 9.3]]);           // aisle eaves
    line([[X0, 9.1, s * 4.75], [XE, 9.1, s * 4.75]]);         // top of the aisle roofs at the nave wall
    line([[X0, 12.5, s * 5.2], [XE, 12.5, s * 5.2]]);         // main eaves
    [X0, XE].forEach(function (x) { line([[x, 0, s * 9.3], [x, 6.8, s * 9.3], [x, 9.1, s * 4.75], [x, 12.5, s * 5.2], [x, 18.2, 0]]); });
  });
  line([[X0, 18.2, 0], [XE, 18.2, 0]]);                        // ridge
  line([[-7.9, 12.5, -4.7], [-7.9, 12.5, 4.7], [0, 12.5, 4.7]]); line([[-7.9, 12.5, -4.7], [0, 12.5, -4.7]]); // choir
  line([[26.6, 18.2, -1.6], [26.6, 23.4, 0], [26.6, 18.2, 1.6]]);  // tower roof, roughly

  // key under the drawing
  var key = document.getElementById('uspKey');
  if (key) key.innerHTML = [['pub', 'Library'], ['learn', 'Study'], ['live', 'Living'], ['comm', 'Shared'], ['cafe', 'Café'], ['serv', 'Service'], ['circ', 'Lift and stairs']].map(function (q) { return '<span><i style="display:inline-block;width:10px;height:10px;background:#' + CAT[q[0]].toString(16).padStart(6, '0') + '"></i>' + q[1] + '</span>'; }).join('');

  /* ---------- steps: what each scroll step shows ---------- */
  var STEPS = [
    { ex: 0, hi: null },            // intro: assembled
    { ex: 1, hi: [0] },             // ground floor
    { ex: 1, hi: [1] },             // level +1 (and the ground-floor study rooms belong to the same story)
    { ex: 1, hi: [2, 3] },          // living
    { ex: 1, hi: [4] },             // kitchen and terraces
    { ex: 0, hi: 'circ' }           // zero ramps: assembled, lift and stairs lit
  ];
  var cur = 0, ex = 0, op = levels.map(function () { return 1; }), circOn = 0;
  var steps = Array.prototype.slice.call(document.querySelectorAll('.usp-step'));
  if (window.IntersectionObserver && steps.length) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { cur = +e.target.dataset.step || 0; steps.forEach(function (s) { s.classList.toggle('is-on', s === e.target); }); kick(); } });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }

  /* ---------- camera, size, loop ---------- */
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ang = 0.75, visible = true, running = false, last = 0;
  function resize() {
    var w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); kick();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }, { threshold: 0 }).observe(stage);
  function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  // also restart from scroll and resize, in case the IntersectionObserver misses a change during smooth scrolling
  function onScroll() { var r = stage.getBoundingClientRect(); visible = r.bottom > 0 && r.top < (window.innerHeight || 800); if (visible) kick(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var S = STEPS[cur] || STEPS[0], k = reduced ? 1 : Math.min(1, dt * 3.2), moving = false;
    var tex = S.ex, d = tex - ex; ex += d * k; if (Math.abs(d) > 0.002) moving = true;
    levels.forEach(function (L, i) {
      var target = !S.hi ? 1 : (S.hi === 'circ' ? 0.22 : (S.hi.indexOf(i) >= 0 ? 1 : 0.12));
      var dd = target - op[i]; op[i] += dd * k; if (Math.abs(dd) > 0.004) moving = true;
      L.g.position.y = i * GAP * ex;
      for (var c in L.mats) L.mats[c].opacity = (c === 'circ' && S.hi === 'circ') ? 1 : 0.92 * op[i];
      L.lines.forEach(function (m) { m.opacity = 0.3 * op[i]; });
      plateMat[i].opacity = 0.04 + 0.05 * ex; L.tag.opacity = 0.35 + 0.65 * ex * op[i];
    });
    shellMat.opacity = 0.7 * (1 - ex * 0.75);
    if (!reduced) ang += dt * 0.07;
    var fitK = Math.max(1, 1.25 / camera.aspect), r = (84 + 46 * ex) * fitK, cy = 6 + 14 * ex;
    camera.position.set(Math.cos(ang) * r * 0.82, cy + 30 + 12 * ex, Math.sin(ang) * r);
    camera.lookAt(0, cy, 0);
    renderer.render(scene, camera);
    if (visible && (!reduced || moving)) requestAnimationFrame(frame); else running = false;
  }
  resize();
})();
