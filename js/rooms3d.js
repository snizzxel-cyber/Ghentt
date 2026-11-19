/* S7 room viewer: one small three.js scene that shows one room type at a time as a cut-open "dollhouse".
   Every room is built to the size it has in model.html (metres). Furniture follows the furniture of the model,
   with a few extra details (lamps, books, plants) and a person of 1.75 m for scale.
   Local frame of every room: origin at the centre of the floor, x = width, z = depth, back wall at z = -D/2. */
(function () {
  'use strict';
  var T = window.THREE;
  var api = { ready: false, show: function () {}, mount: function () { return false; } };
  window.S7Rooms = api;
  if (!T) return;

  /* ---------- colours and materials ---------- */
  var K = {
    wall: 0xefebe3, wallCut: 0x3a3f44, floorOak: 0xc8a477, ash: 0xdcc9a6, oak: 0xb48a5a, dark: 0x2c3136, black: 0x1d2024,
    steel: 0x9aa3aa, white: 0xf3f3ef, glass: 0xa9cfe0, teal: 0x2f7d82, coral: 0xd0684a, mustard: 0xe0b13a, plum: 0x7a5c9e,
    sky: 0x5aa6d1, sage: 0x8fae7e, rug: 0xc9b8a2, tile: 0xa9523b, tileD: 0x86392a, brick: 0xb08d5e, stone: 0xe4ddcb,
    concrete: 0xc9ccc9, plant: 0x5f9159, pot: 0x6a5642, maroon: 0x6e2a2a, blue: 0x2b3d8f, deck: 0xb08a5a, slab: 0xd9d4c8,
    skin: 0xd9a77e, shirt: 0x2f6f77, jeans: 0x34465e, pipe: 0xcfc8b2, case: 0x6a5642, lockerB: 0x4f78a6
  };
  var matCache = {};
  function mat(c, o) {
    o = o || {};
    var key = c + '|' + (o.glass ? 'g' : '') + (o.op || '') + (o.emis ? 'e' : '') + (o.map ? o.map.uuid : '');
    if (matCache[key]) return matCache[key];
    var m = new T.MeshStandardMaterial({ color: c, roughness: o.glass ? 0.1 : (o.rough != null ? o.rough : 0.85), metalness: o.metal || 0, side: T.DoubleSide });
    if (o.glass) { m.transparent = true; m.opacity = 0.32; m.depthWrite = false; }
    if (o.op) { m.transparent = true; m.opacity = o.op; m.depthWrite = false; }
    if (o.emis) { m.emissive = new T.Color(c); m.emissiveIntensity = 0.6; }
    if (o.map) m.map = o.map;
    matCache[key] = m; return m;
  }
  // box: w (x) × h (y) × d (z), bottom at y
  function box(g, w, h, d, x, y, z, c, o) {
    var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat(c, o));
    m.position.set(x, y + h / 2, z);
    if (!(o && (o.glass || o.op))) { m.castShadow = true; m.receiveShadow = true; }
    g.add(m); return m;
  }
  function cyl(g, r, h, x, y, z, c, seg, o) {
    var m = new T.Mesh(new T.CylinderGeometry(r, r, h, seg || 16), mat(c, o));
    m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
  }
  function sub(g, x, z, rot) { var s = new T.Group(); s.position.set(x, 0, z); s.rotation.y = rot || 0; g.add(s); return s; }
  function quad(g, a, b, c, d, col, o) {
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(a.concat(b, c, a, c, d)), 3));
    geo.computeVertexNormals();
    var m = new T.Mesh(geo, mat(col, o)); m.receiveShadow = true; g.add(m); return m;
  }
  // seeded random so that books and plants look the same every time
  var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  /* ---------- tiled floor texture (the tiled floor of the church) ---------- */
  var tileTex = null;
  function tiles() {
    if (tileTex) return tileTex;
    var N = 512, q = N / 4, cv = document.createElement('canvas'); cv.width = cv.height = N; var x = cv.getContext('2d');
    x.fillStyle = '#d8c7a6'; x.fillRect(0, 0, N, N);
    x.fillStyle = '#9c5a3c'; for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) if ((i + j) % 2 === 0) x.fillRect(i * q, j * q, q, q);
    x.fillStyle = '#e9dcc0'; for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) { x.beginPath(); x.arc(i * q + q / 2, j * q + q / 2, q * 0.16, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(60,40,30,.28)'; x.lineWidth = 3; for (i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * q, 0); x.lineTo(i * q, N); x.stroke(); x.beginPath(); x.moveTo(0, i * q); x.lineTo(N, i * q); x.stroke(); }
    tileTex = new T.CanvasTexture(cv); tileTex.wrapS = tileTex.wrapT = T.RepeatWrapping;
    if (renderer) tileTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tileTex;
  }
  function tiledFloor(g, w, d, x, y, z) {
    var t = tiles().clone(); t.needsUpdate = true; t.repeat.set(w / 1.2, d / 1.2); if (renderer) t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    var m = new T.Mesh(new T.BoxGeometry(w, 0.06, d), new T.MeshStandardMaterial({ map: t, roughness: 0.8 }));
    m.position.set(x || 0, (y || 0) - 0.03, z || 0); m.receiveShadow = true; g.add(m); return m;
  }

  /* ---------- furniture ---------- */
  function bed(g, x, z, rot, w, l, col) {
    var s = sub(g, x, z, rot); w = w || 0.9; l = l || 2.0;
    box(s, w, 0.32, l, 0, 0.08, 0, K.oak);
    [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { box(s, 0.06, 0.08, 0.06, a * (w / 2 - 0.05), 0, b * (l / 2 - 0.05), K.dark); }); });
    box(s, w - 0.04, 0.18, l - 0.04, 0, 0.4, 0, K.white);
    box(s, w - 0.02, 0.06, l * 0.62, 0, 0.56, l * 0.17, col || K.teal);
    box(s, w * 0.7, 0.1, 0.38, 0, 0.58, -l / 2 + 0.28, K.white);
    box(s, w, 0.6, 0.05, 0, 0.4, -l / 2 - 0.02, K.oak);
    return s;
  }
  function desk(g, w, d, x, z, rot, col) {
    var s = sub(g, x, z, rot);
    box(s, w, 0.04, d, 0, 0.71, 0, col || K.ash);
    [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { box(s, 0.04, 0.71, 0.04, a * (w / 2 - 0.05), 0, b * (d / 2 - 0.05), K.dark); }); });
    return s;
  }
  function chair(g, x, z, rot, col, light) {
    var s = sub(g, x, z, rot);
    box(s, 0.44, 0.05, 0.44, 0, 0.44, 0, col || K.teal);
    box(s, 0.44, 0.42, 0.05, 0, 0.49, -0.2, col || K.teal);   // back at -z: the chair faces +z
    [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) { box(s, 0.03, 0.44, 0.03, a * 0.19, 0, b * 0.19, light ? K.oak : K.dark); }); });
    return s;
  }
  function stool(g, x, z, h, col) { cyl(g, 0.18, 0.05, x, h, z, col || K.dark); cyl(g, 0.03, h, x, 0, z, K.steel, 8); cyl(g, 0.16, 0.02, x, 0.25, z, K.steel, 12); }
  function bistro(g, x, z, r, col, h) { h = h || 0.72; cyl(g, r || 0.38, 0.04, x, h, z, col || K.oak, 24); cyl(g, 0.04, h, x, 0, z, K.steel, 8); cyl(g, 0.22, 0.03, x, 0, z, K.steel, 16); }
  function sofa(g, x, z, len, rot, col) {
    var s = sub(g, x, z, rot); col = col || K.plum;
    box(s, len, 0.4, 0.85, 0, 0.05, 0, col); box(s, len, 0.45, 0.2, 0, 0.4, -0.33, col);   // back at -z
    box(s, 0.18, 0.6, 0.85, -len / 2 + 0.09, 0.05, 0, col); box(s, 0.18, 0.6, 0.85, len / 2 - 0.09, 0.05, 0, col);
    return s;
  }
  function armchair(g, x, z, rot, col) {
    var s = sub(g, x, z, rot); col = col || K.mustard;
    box(s, 0.75, 0.4, 0.75, 0, 0.05, 0, col); box(s, 0.75, 0.45, 0.16, 0, 0.42, -0.3, col);   // back at -z
    box(s, 0.14, 0.25, 0.75, -0.3, 0.42, 0, col); box(s, 0.14, 0.25, 0.75, 0.3, 0.42, 0, col);
    return s;
  }
  function plant(g, x, z, h) {
    h = h || 1.1; cyl(g, 0.2, 0.35, x, 0, z, K.pot, 14);
    var f = new T.Mesh(new T.SphereGeometry(0.32, 12, 10), mat(K.plant)); f.scale.set(1, (h - 0.35) / 0.55, 1); f.position.set(x, 0.35 + (h - 0.35) / 2, z); f.castShadow = true; g.add(f);
  }
  function books(g, w, x, y, z, rot, depth) {
    var s = sub(g, x, z, rot), cx = -w / 2, cols = [K.coral, K.teal, K.mustard, K.plum, K.sky, K.sage, K.white, K.dark];
    while (cx < w / 2 - 0.04) { var bw = 0.025 + rnd() * 0.035, bh = 0.2 + rnd() * 0.1; box(s, bw, bh, depth || 0.2, cx + bw / 2, y, 0, cols[Math.floor(rnd() * cols.length)]); cx += bw + 0.004; }
    return s;
  }
  function shelf(g, w, h, d, x, z, rot, rows) {
    var s = sub(g, x, z, rot);
    box(s, w, h, 0.03, 0, 0, -d / 2 + 0.015, K.oak);
    box(s, 0.03, h, d, -w / 2, 0, 0, K.oak); box(s, 0.03, h, d, w / 2, 0, 0, K.oak);
    rows = rows || Math.floor(h / 0.38);
    for (var r = 0; r <= rows; r++) { var yy = r * (h - 0.03) / rows; box(s, w, 0.03, d, 0, yy, 0, K.oak); if (r < rows) books(s, w - 0.06, 0, yy + 0.03, 0.01, 0, d * 0.8); }
    return s;
  }
  function lamp(g, x, y, z, col) { cyl(g, 0.01, 0.6, x, y, z, K.dark, 6); var sh = new T.Mesh(new T.ConeGeometry(0.2, 0.18, 18, 1, true), mat(col || K.mustard)); sh.position.set(x, y - 0.09, z); g.add(sh); var b = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), mat(0xfff3c4, { emis: true })); b.position.set(x, y - 0.14, z); g.add(b); }
  function laptop(g, x, y, z, rot) { var s = sub(g, x, z, rot); box(s, 0.34, 0.02, 0.24, 0, y, 0, K.steel); var sc = box(s, 0.34, 0.22, 0.015, 0, y + 0.02, -0.12, K.dark); return s; }
  function person(g, x, z, rot, shirt) {
    var s = sub(g, x, z, rot);
    cyl(s, 0.09, 0.82, -0.1, 0, 0, K.jeans, 10); cyl(s, 0.09, 0.82, 0.1, 0, 0, K.jeans, 10);
    var b = new T.Mesh(new T.CylinderGeometry(0.2, 0.17, 0.62, 14), mat(shirt || K.shirt)); b.position.set(0, 1.13, 0); b.castShadow = true; s.add(b);
    var h = new T.Mesh(new T.SphereGeometry(0.12, 14, 12), mat(K.skin)); h.position.set(0, 1.6, 0); h.castShadow = true; s.add(h);
    return s;
  }
  function sitter(g, x, z, rot, shirt) {
    var s = sub(g, x, z, rot);
    // faces +z, like the chairs: thighs and lower legs forward, body over the back of the seat
    box(s, 0.34, 0.14, 0.42, 0, 0.45, 0.08, K.jeans); box(s, 0.3, 0.45, 0.12, 0, 0, 0.3, K.jeans);
    var b = new T.Mesh(new T.CylinderGeometry(0.19, 0.16, 0.56, 14), mat(shirt || K.coral)); b.position.set(0, 0.86, -0.08); b.castShadow = true; s.add(b);
    var h = new T.Mesh(new T.SphereGeometry(0.11, 14, 12), mat(K.skin)); h.position.set(0, 1.27, -0.06); s.add(h);
    return s;
  }
  function bike(g, x, z, rot) {
    var s = sub(g, x, z, rot), w = new T.TorusGeometry(0.31, 0.025, 6, 20);
    [-0.52, 0.52].forEach(function (zz) { var m = new T.Mesh(w, mat(K.dark)); m.rotation.y = Math.PI / 2; m.position.set(0, 0.33, zz); s.add(m); });
    box(s, 0.04, 0.04, 0.9, 0, 0.55, 0, [K.teal, K.coral, K.dark, K.sky, K.mustard][Math.floor(rnd() * 5)]);
    box(s, 0.04, 0.42, 0.04, 0, 0.33, -0.12, K.dark); box(s, 0.16, 0.04, 0.22, 0, 0.78, -0.18, K.black); box(s, 0.5, 0.03, 0.03, 0, 0.88, 0.45, K.dark);
    return s;
  }
  function windowPane(g, w, h, x, y, z, rot, frame) {
    var s = sub(g, x, z, rot);
    box(s, w + 0.1, 0.06, 0.12, 0, y - 0.06, 0, frame || K.dark); box(s, w + 0.1, 0.06, 0.12, 0, y + h, 0, frame || K.dark);
    box(s, 0.06, h, 0.12, -w / 2 - 0.02, y, 0, frame || K.dark); box(s, 0.06, h, 0.12, w / 2 + 0.02, y, 0, frame || K.dark);
    box(s, w, h, 0.02, 0, y, 0, K.glass, { glass: true });
    return s;
  }

  /* ---------- room shell: back and left wall full height, front and right wall cut low (dollhouse) ---------- */
  function shell(g, W, D, H, o) {
    o = o || {};
    var th = 0.12, wc = o.wall || K.wall, cut = 0.35;
    if (o.floor !== false) {
      if (o.tiled) tiledFloor(g, W, D);
      else { var f = box(g, W, 0.06, D, 0, -0.06, 0, o.floorCol || K.floorOak); f.castShadow = false; }
    }
    box(g, W + th * 2, 0.25, D + th * 2, 0, -0.31, 0, K.slab);
    if (o.back !== false) box(g, W + th * 2, H, th, 0, 0, -D / 2 - th / 2, o.backCol || wc);
    if (o.left !== false) box(g, th, H, D, -W / 2 - th / 2, 0, 0, o.leftCol || wc);
    if (o.front !== false) { box(g, W + th * 2, cut, th, 0, 0, D / 2 + th / 2, wc); box(g, W + th * 2, 0.02, th + 0.01, 0, cut, D / 2 + th / 2, K.wallCut); }
    if (o.right !== false) { box(g, th, cut, D, W / 2 + th / 2, 0, 0, wc); box(g, th + 0.01, 0.02, D, W / 2 + th / 2, cut, 0, K.wallCut); }
    // thin dark top edge on the full walls (section line)
    if (o.back !== false) box(g, W + th * 2, 0.02, th + 0.01, 0, H, -D / 2 - th / 2, K.wallCut);
    if (o.left !== false) box(g, th + 0.01, 0.02, D, -W / 2 - th / 2, H, 0, K.wallCut);
  }
  // door in a cut wall: threshold, low frame stubs and the swing drawn on the floor, so nothing blocks the view
  function doorGap(g, x, z, rot, fire) {
    var s = sub(g, x, z, rot), c = fire ? 0xa43a33 : K.oak;
    box(s, 0.92, 0.012, 0.18, 0, 0, 0, K.dark);
    box(s, 0.06, 0.37, 0.16, -0.48, 0, 0, K.dark); box(s, 0.06, 0.37, 0.16, 0.48, 0, 0, K.dark);
    var arc = new T.Mesh(new T.RingGeometry(0.86, 0.9, 24, 1, 0, Math.PI / 2), mat(c)); arc.rotation.x = -Math.PI / 2; arc.position.set(-0.45, 0.012, -0.06); s.add(arc);
    box(s, 0.05, 0.02, 0.9, -0.425, 0.004, -0.51, c);
    return s;
  }

  /* ================= the rooms ================= */
  var B = {};

  // student room on level +2: 4.20 × 3.15 m, 3.20 m high, plus an alcove of 2.20 × 2.95 m under the sloping aisle roof
  // (an opening in the old nave wall), lit by a roof window. The alcove ceiling drops from 3.2 m to about 2.3 m.
  B.student = function (g) {
    var W = 4.2, D = 3.15, H = 3.2, AW = 2.2, AD = 2.95, AH = 2.34, th = 0.12;
    shell(g, W, D, H, { back: false, backCol: 0xe9e1d3 });
    // back wall with the opening into the alcove (the old nave wall, drawn thicker)
    // the old nave wall, cut at 1 m in this view so the alcove behind it can be seen
    [[-W / 2 - th, -AW / 2], [AW / 2, W / 2 + th]].forEach(function (q) { box(g, q[1] - q[0], 1.0, 0.5, (q[0] + q[1]) / 2, 0, -D / 2 - 0.25, 0xd9c4a0); box(g, q[1] - q[0], 0.02, 0.51, (q[0] + q[1]) / 2, 1.0, -D / 2 - 0.25, K.wallCut); });
    // alcove: floor, side walls, end wall and the sloping roof with a roof window
    var z0 = -D / 2, z1 = -D / 2 - AD;
    box(g, AW, 0.06, AD, 0, -0.06, (z0 + z1) / 2, K.floorOak).castShadow = false;
    [-1, 1].forEach(function (sd) {
      var x = sd * (AW / 2 + 0.06);
      quad(g, [x, 0, z0], [x, 0, z1], [x, AH, z1], [x, H, z0], 0xefe7da);
    });
    box(g, AW + 0.24, AH, 0.12, 0, 0, z1 - 0.06, 0xefe7da);
    quad(g, [-AW / 2 - 0.12, H, z0], [AW / 2 + 0.12, H, z0], [AW / 2 + 0.12, AH, z1], [-AW / 2 - 0.12, AH, z1], 0xe8e2d6);
    var s = (H - AH) / AD, yAt = function (z) { return H - (z0 - z) * s - 0.02; }, wa = z0 - 0.8, wb = z0 - 2.0;
    quad(g, [-0.55, yAt(wa), wa], [0.55, yAt(wa), wa], [0.55, yAt(wb), wb], [-0.55, yAt(wb), wb], 0xcfe6f2, { emis: true });
    // furniture: bed along the left wall, desk along the right wall, wardrobe by the door, a reading corner in the alcove
    bed(g, -W / 2 + 0.52, -0.5, 0, 0.9, 2.0, K.teal);
    desk(g, 1.2, 0.6, W / 2 - 0.36, -0.75, Math.PI / 2);
    chair(g, W / 2 - 0.98, -0.75, Math.PI / 2, K.coral);
    box(g, 0.25, 0.03, 1.0, W / 2 - 0.14, 1.5, -0.75, K.oak); books(g, 0.9, W / 2 - 0.14, 1.53, -0.75, Math.PI / 2, 0.18);
    laptop(g, W / 2 - 0.4, 0.75, -0.75, -Math.PI / 2); lamp(g, W / 2 - 0.3, 1.35, -1.2, K.mustard);
    box(g, 0.6, 2.0, 0.55, -W / 2 + 0.4, 0, D / 2 - 0.38, K.ash); box(g, 0.01, 1.9, 0.01, -W / 2 + 0.4, 0.05, D / 2 - 0.1, K.dark);
    armchair(g, 0.35, z0 - 1.9, 0.5, K.mustard); plant(g, -0.7, z0 - 2.5, 0.8);
    box(g, 1.6, 0.015, 1.4, 0, 0, z0 - 1.3, K.rug); box(g, 1.4, 0.015, 1.0, 0, 0, 0.3, K.rug);
    doorGap(g, 1.18, D / 2 + 0.06, 0, true);
    person(g, 0.2, 0.7, -0.4, K.plum);
    return { W: W, D: D + AD, H: H, view: [0.55, 1.05, 1.0], fit: 0.66, target: [0, 0.9, -1.4] };
  };

  // small study room, 3.16 × 2.20 m, 2.58 m high (level +1), opens onto the gallery behind the arcade
  B.studysm = function (g) {
    var W = 3.16, D = 2.2, H = 2.58;
    shell(g, W, D, H, { backCol: 0xdfe8e6, floorCol: 0xd8c7aa });
    desk(g, 1.7, 0.65, 0.25, -D / 2 + 0.4, 0, K.oak);
    chair(g, 0.25, -D / 2 + 1.05, Math.PI, K.mustard);
    lamp(g, 0.85, 1.25, -D / 2 + 0.25, K.mustard); laptop(g, 0.2, 0.75, -D / 2 + 0.45, 0);
    shelf(g, 1.0, 1.9, 0.3, -W / 2 + 0.17, -D / 2 + 0.6, Math.PI / 2, 4);
    armchair(g, W / 2 - 0.45, 0.35, -Math.PI / 2 - 0.4, K.teal);
    box(g, 0.9, 0.015, 0.5, 0.25, 0, D / 2 - 0.55, K.rug);
    // gallery railing in front of the room
    box(g, W + 1, 0.04, 0.05, 0, 1.0, D / 2 + 1.1, K.steel); box(g, W + 1, 0.95, 0.02, 0, 0.05, D / 2 + 1.1, K.glass, { glass: true });
    box(g, W + 1, 0.06, 1.1, 0, -0.06, D / 2 + 0.6, K.slab);
    doorGap(g, 0.9, D / 2 + 0.06, 0, false);
    sitter(g, 0.25, -D / 2 + 1.0, Math.PI, K.teal);
    return { W: W, D: D, H: H };
  };

  // community kitchen and dining hall under the ridge, 22 × 6 m (level +4, floor at 12.30 m)
  B.commkitchen = function (g) {
    var W = 22, D = 6, ridge = 5.9, knee = 2.61;   // ridge 18.2 m and roof at z = ±3: 14.91 m, floor 12.3 m
    shell(g, W, D, knee, { back: false, front: false, left: false, floorCol: 0xd8c7aa });
    // knee wall at the back and the north roof slope with roof windows
    box(g, W, knee, 0.12, 0, 0, -D / 2 - 0.06, K.wall);
    quad(g, [-W / 2, knee, -D / 2], [W / 2, knee, -D / 2], [W / 2, ridge, 0], [-W / 2, ridge, 0], 0xe8e2d6);
    var rs = (ridge - knee) / (D / 2), rz = function (z) { return knee + (z + D / 2) * rs - 0.03; };
    for (var i = 0; i < 5; i++) { var xc = -W / 2 + 2.25 + i * 4.5 - 0.3, za = -D / 2 + 0.55, zb = -D / 2 + 1.65; quad(g, [xc - 0.5, rz(za), za], [xc + 0.5, rz(za), za], [xc + 0.5, rz(zb), zb], [xc - 0.5, rz(zb), zb], 0xcfe6f2, { emis: true }); }
    // gable walls: west full, east cut
    var gw = new T.Shape(); gw.moveTo(-D / 2, 0); gw.lineTo(D / 2, 0); gw.lineTo(D / 2, knee); gw.lineTo(0, ridge); gw.lineTo(-D / 2, knee); gw.lineTo(-D / 2, 0);
    var gm = new T.Mesh(new T.ExtrudeGeometry(gw, { depth: 0.14, bevelEnabled: false }), mat(K.brick)); gm.rotation.y = Math.PI / 2; gm.position.set(-W / 2 - 0.14, 0, 0); g.add(gm);
    // front: low knee wall and the glazed front to the small roof terrace (x 14 to 22 in the model = 2.7 to 10.7 here)
    box(g, W, 0.35, 0.12, 0, 0, D / 2 + 0.06, K.wall);
    for (var gx = 2.7; gx <= 10.71; gx += 1.6) box(g, 0.06, knee, 0.08, gx, 0, D / 2 + 0.06, K.maroon);
    box(g, 8.0, knee - 0.35, 0.02, 6.7, 0.35, D / 2 + 0.06, K.glass, { glass: true });
    // ridge beam
    box(g, W, 0.18, 0.16, 0, ridge - 0.32, 0, K.oak);
    // kitchen run along the back
    var w2 = W - 0.3, d2 = D - 0.3, len = 11, x0 = -w2 / 2 + 1.0, cxk = x0 + len / 2, zk = -d2 / 2 + 0.3;
    box(g, len, 0.9, 0.6, cxk, 0, zk, K.white); box(g, len, 0.04, 0.64, cxk, 0.9, zk, K.dark);
    for (var h = 0; h < 4; h++) box(g, 0.8, 0.02, 0.45, x0 + 1.2 + h * 2.6, 0.94, zk, h % 2 ? K.black : K.steel);
    box(g, len, 0.6, 0.35, cxk, 1.5, zk - 0.12, K.ash);
    [0, 1].forEach(function (k) { box(g, 0.7, 1.85, 0.7, x0 + len + 0.5 + k * 0.8, 0, zk + 0.05, K.steel); });
    // two islands with stools
    [-w2 / 2 + 4.2, -w2 / 2 + 9.4].forEach(function (cx) {
      box(g, 3.4, 0.9, 0.9, cx, 0, -0.2, K.white); box(g, 3.4, 0.04, 0.95, cx, 0.9, -0.2, K.oak);
      for (var s = 0; s < 5; s++) stool(g, cx - 1.3 + s * 0.65, 0.75, 0.62, K.dark);
    });
    // five dining tables with six chairs each
    var n = 5;
    for (var t = 0; t < n; t++) {
      var tx = -w2 / 2 + 2.2 + t * (w2 - 4.4) / (n - 1), tz = d2 / 2 - 0.95;
      desk(g, 2.6, 0.9, tx, tz, 0, K.oak);
      for (var j = 0; j < 3; j++) { chair(g, tx - 0.8 + j * 0.8, tz - 0.7, 0, K.teal, true); chair(g, tx - 0.8 + j * 0.8, tz + 0.7, Math.PI, K.coral, true); }
      lamp(g, tx, 2.5, tz, K.mustard);
    }
    sofa(g, w2 / 2 - 1.4, -0.6, 2.2, Math.PI, K.plum); sofa(g, w2 / 2 - 4.2, -0.6, 2.2, Math.PI, K.teal);
    box(g, 3.6, 0.015, 1.8, w2 / 2 - 2.8, 0, -0.2, K.rug);
    person(g, -5.0, -1.4, 0.4, K.coral); person(g, -3.4, 1.0, 2.6, K.teal); sitter(g, -0.2, 1.35, 0, K.plum); sitter(g, 4.3, 1.35, 0, K.mustard);
    plant(g, -w2 / 2 + 0.5, d2 / 2 - 0.4, 1.3);
    return { W: W, D: D, H: ridge, view: [0.5, 0.7, 1.0], fit: 0.44, target: [0, 1.6, 0] };
  };

  // small roof terrace cut into the south roof slope, 8.0 × 1.7 m (level +4)
  B.terraceS = function (g) {
    var W = 8.0, D = 1.7, top = 2.72;   // front wall up to the roof line at z 2.9 (15.02 m), floor 12.3 m
    box(g, W, 0.06, D, 0, -0.06, 0, K.concrete);
    box(g, W + 0.2, 0.25, D + 0.2, 0, -0.31, 0, K.slab);
    // glazed front wall to the kitchen with a door in the middle, dark red frames and a blue steel edge
    box(g, W, top, 0.02, 0, 0, -D / 2, K.glass, { glass: true });
    [-4, -2.5, -1.7, -0.9, 0.9, 1.7, 2.5, 4].forEach(function (x) { box(g, 0.08, top, 0.08, x, 0, -D / 2, K.maroon); });
    box(g, W, 0.06, 0.08, 0, 1.0, -D / 2, K.maroon); box(g, 1.8, 0.06, 0.08, 0, 2.3, -D / 2, K.maroon);
    box(g, W, 0.1, 0.12, 0, top - 0.1, -D / 2, K.blue);
    // glazed sides that follow the roof line
    [-W / 2, W / 2].forEach(function (x) {
      quad(g, [x, 0, -D / 2], [x, 0, D / 2 + 0.5], [x, 0.2, D / 2 + 0.5], [x, top, -D / 2 - 0.1], K.glass, { glass: true });
      quad(g, [x - 0.06, top + 0.05, -D / 2 - 0.1], [x + 0.06, top + 0.05, -D / 2 - 0.1], [x + 0.06, 0.25, D / 2 + 0.5], [x - 0.06, 0.25, D / 2 + 0.5], K.blue);
    });
    // glass guard on the nave wall
    box(g, W, 1.1, 0.03, 0, 0, D / 2, K.glass, { glass: true }); box(g, W, 0.05, 0.08, 0, 1.1, D / 2, K.steel);
    for (var gx = -W / 2; gx <= W / 2 + 0.01; gx += 2.0) box(g, 0.05, 1.15, 0.06, gx, 0, D / 2, K.steel);
    // the red tile roof on both sides of the recess
    [-1, 1].forEach(function (s) {
      var xa = s * (W / 2 + 0.1), xb = s * (W / 2 + 5);
      quad(g, [xa, top + 0.2, -D / 2 - 0.1], [xb, top + 0.2, -D / 2 - 0.1], [xb, 0.2, D / 2 + 0.6], [xa, 0.2, D / 2 + 0.6], K.tile);
      for (var r = 1; r < 6; r++) { var k = r / 6, y = top + 0.2 - k * (top), z = -D / 2 - 0.1 + k * (D + 0.7); quad(g, [xa, y + 0.02, z], [xb, y + 0.02, z], [xb, y - 0.02, z + 0.04], [xa, y - 0.02, z + 0.04], K.tileD); }
    });
    // two bistro tables with yellow cloths, light chairs, planters
    [-2.6, 2.6].forEach(function (x) {
      bistro(g, x, 0.15, 0.38, 0xe6b422);
      chair(g, x - 0.7, 0.15, Math.PI / 2, 0xd9c39a, true); chair(g, x + 0.7, 0.15, -Math.PI / 2, 0xd9c39a, true);
    });
    plant(g, -W / 2 + 0.35, -0.4, 1.0); plant(g, W / 2 - 0.35, -0.4, 1.0);
    sitter(g, -3.3, 0.15, Math.PI / 2, K.teal); person(g, 0.2, 0.2, 0.3, K.coral);
    // a glimpse of the kitchen behind the glass
    box(g, W, 0.06, 2, 0, -0.06, -D / 2 - 1.05, 0xd8c7aa); desk(g, 2.6, 0.9, 1.5, -D / 2 - 1.2, 0, K.oak);
    return { W: W, D: D, H: top, view: [0.45, 0.55, 1.0], fit: 0.85 };
  };

  // roof terrace on the café building, 9.8 × 6.85 m (level +4)
  B.terraceL = function (g) {
    var W = 9.8, D = 6.85;
    box(g, W, 0.08, D, 0, -0.08, 0, K.concrete); box(g, W - 0.2, 0.04, D - 0.2, 0, 0, 0, K.deck);
    for (var s = -W / 2 + 0.3; s < W / 2; s += 0.3) box(g, 0.01, 0.045, D - 0.2, s, 0, 0, 0x8f6c44);
    // glass guard on north, west and east edges
    box(g, W, 1.1, 0.03, 0, 0, -D / 2, K.glass, { glass: true }); box(g, W, 0.06, 0.1, 0, 1.1, -D / 2, K.steel);
    [-W / 2, W / 2].forEach(function (x) { box(g, 0.03, 1.1, D, x, 0, 0, K.glass, { glass: true }); box(g, 0.1, 0.06, D, x, 1.1, 0, K.steel); });
    for (var gx = -W / 2; gx <= W / 2 + 0.01; gx += 1.7) box(g, 0.05, 1.16, 0.08, gx, 0, -D / 2, K.steel);
    // south: wall of the church (brick) with the glazed wing and the fire door
    box(g, W, 0.35, 0.3, 0, 0, D / 2 + 0.15, K.brick); box(g, W, 0.02, 0.31, 0, 0.35, D / 2 + 0.15, K.wallCut);
    doorGap(g, -W / 2 + 1.3, D / 2 + 0.15, 0, true);
    // planters along the north edge
    for (var px = -4.2; px < 4.0; px += 2.6) { box(g, 1.8, 0.45, 0.5, px, 0, -D / 2 + 0.35, K.pot); box(g, 1.6, 0.5, 0.4, px, 0.45, -D / 2 + 0.35, K.plant); }
    // four bistro tables, two parasols
    [-3.8, -1.6, 0.6, 2.8].forEach(function (x, ti) {
      bistro(g, x, -2.0, 0.4, K.oak);
      chair(g, x - 0.7, -2.0, Math.PI / 2, K.mustard, true); chair(g, x + 0.7, -2.0, -Math.PI / 2, K.mustard, true);
      if (ti % 2 === 0) { cyl(g, 0.03, 2.1, x, 0, -1.5, K.steel, 8); var u = new T.Mesh(new T.ConeGeometry(1.15, 0.35, 18), mat(ti ? K.teal : 0xd9a21f)); u.position.set(x, 2.25, -1.5); u.castShadow = true; g.add(u); }
    });
    // long communal table with benches
    desk(g, 4.4, 0.9, -0.5, 1.6, 0, K.oak); [-0.75, 0.75].forEach(function (dz) { box(g, 4.2, 0.05, 0.35, -0.5, 0.42, 1.6 + dz, K.ash); box(g, 0.06, 0.42, 0.3, -2.4, 0, 1.6 + dz, K.dark); box(g, 0.06, 0.42, 0.3, 1.4, 0, 1.6 + dz, K.dark); });
    // two sun loungers by the east edge
    [-0.4, 0.9].forEach(function (zz) { box(g, 0.65, 0.18, 1.9, W / 2 - 1.0, 0.1, zz + 0.6, K.white); var bk = box(g, 0.65, 0.05, 0.65, W / 2 - 1.0, 0.5, zz - 0.15, K.white); bk.rotation.x = -0.6; });
    sitter(g, -0.5, 0.85, 0, K.teal); sitter(g, 0.5, 2.35, Math.PI, K.coral); person(g, 3.4, -1.0, -0.5, K.plum);
    return { W: W, D: D, H: 3.2, view: [0.7, 0.9, 1.0], fit: 0.66 };
  };

  // reading hall, shown with the whole ground floor of the church (without the new building), built from the model data:
  // traced walls (cut low), piers and every ground-floor room of S7. World coordinates of the model, shifted so the church sits at the centre.
  var bookTex = null;
  function books2() {
    if (bookTex) return bookTex;
    var cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; var x = cv.getContext('2d'); x.scale(4, 4);
    var cols = ['#d0684a', '#2f7d82', '#e0b13a', '#7a5c9e', '#5aa6d1', '#8fae7e', '#f3f3ef', '#2c3136'];
    x.fillStyle = '#b48a5a'; x.fillRect(0, 0, 256, 128);
    for (var row = 0; row < 4; row++) { var px = 0; while (px < 256) { var bw = 3 + Math.floor(rnd() * 5); x.fillStyle = cols[Math.floor(rnd() * cols.length)]; x.fillRect(px, row * 32 + 6, bw, 24 - Math.floor(rnd() * 6)); px += bw + 1; } x.fillStyle = '#8a6a44'; x.fillRect(0, row * 32 + 29, 256, 3); }
    bookTex = new T.CanvasTexture(cv); bookTex.wrapS = T.RepeatWrapping;
    return bookTex;
  }
  function shelfUnit(g, len, h, d, x, z, alongZ) {
    var t = books2().clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, len / 1.2), Math.max(1, h / 2));
    var face = new T.MeshStandardMaterial({ map: t, roughness: 0.85 }), side = mat(K.oak);
    var mats = alongZ ? [face, face, side, side, side, side] : [side, side, side, side, face, face];
    var m = new T.Mesh(new T.BoxGeometry(alongZ ? d : len, h, alongZ ? len : d), mats); m.position.set(x, h / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
  }
  function tag(g, text, x, y, z, w) {
    var cv = document.createElement('canvas'), fs = 44; cv.height = 72; var c = cv.getContext('2d'); c.font = '600 ' + fs + 'px Arial, sans-serif';
    cv.width = Math.ceil(c.measureText(text).width) + 40; c = cv.getContext('2d'); c.font = '600 ' + fs + 'px Arial, sans-serif';
    c.fillStyle = 'rgba(17,27,32,0.86)'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#ffffff'; c.textBaseline = 'middle'; c.fillText(text, 20, 38);
    var tx = new T.CanvasTexture(cv), sp = new T.Sprite(new T.SpriteMaterial({ map: tx, depthTest: false, transparent: true }));
    var hgt = (w || 0.62) * 1.6; sp.scale.set(hgt * cv.width / cv.height, hgt, 1); sp.position.set(x, y, z); sp.renderOrder = 10; g.add(sp); return sp;
  }
  function lowWalls(g, r, h, col) {
    var t = 0.1, c = col || K.wall, x0 = r.x0, x1 = r.x1, z0 = r.z0, z1 = r.z1, door = r.door;
    function seg(ax, a0, a1, f) { if (a1 - a0 < 0.05) return; if (ax === 'x') box(g, a1 - a0, h, t, (a0 + a1) / 2, 0, f, c); else box(g, t, h, a1 - a0, f, 0, (a0 + a1) / 2, c); }
    function wallX(f, isDoor) { if (!isDoor) { seg('x', x0, x1, f); return; } var dc = (x0 + x1) / 2; seg('x', x0, dc - 0.45, f); seg('x', dc + 0.45, x1, f); }
    function wallZ(f, isDoor) { if (!isDoor) { seg('z', z0, z1, f); return; } var dc = (z0 + z1) / 2; seg('z', z0, dc - 0.45, f); seg('z', dc + 0.45, z1, f); }
    wallX(z0, door === 'zmin'); wallX(z1, door === 'zmax'); wallZ(x0, door === 'xmin'); wallZ(x1, door === 'xmax');
  }
  B.library = function (g) {
    var CX = 10.75, w = sub(g, -CX, 0, 0), R = (window.S7_ROOMS || []).filter(function (r) { return r.lv === 'Ground floor' && r.x0 > -7.95; });
    var TR = window.S7_TRACE || { classes: [], columns: [] };
    // floors: the tiled floor of nave and aisles, the levelled choir in wood
    tiledFloor(w, 29.1, 17.3, 14.55, 0, 0);
    box(w, 7.6, 0.06, 8.8, -3.8, -0.06, 0, 0xb08d5e).castShadow = false;
    box(w, 37.2, 0.25, 24.4, 10.75, -0.31, 0, K.slab).castShadow = false;
    // existing walls, traced from the study plans, cut at 1.3 m so the rooms can be seen
    TR.classes.forEach(function (c) {
      if (['aisle', 'choir', 'chapel'].indexOf(c.name) < 0) return;
      c.polys.forEach(function (p) {
        var sh = new T.Shape(p.o.map(function (q) { return new T.Vector2(q[0], -q[1]); }));
        var geo = new T.ExtrudeGeometry(sh, { depth: 1.3, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
        var m = new T.Mesh(geo, mat(K.brick)); m.castShadow = true; m.receiveShadow = true; w.add(m);
      });
    });
    // octagonal piers with plinth and capital
    TR.columns.forEach(function (q) {
      var p = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 2.5, 8), mat(0xe8e1d0)); p.rotation.y = Math.PI / 8; p.position.set(q[0], 1.65, q[1]); p.castShadow = true; w.add(p);
      box(w, 1.0, 0.4, 1.0, q[0], 0, q[1], 0x4c4742); box(w, 1.0, 0.35, 1.0, q[0], 2.9, q[1], K.stone);
    });
    var FL = { pub: 0xcfe7e6, learn: 0xf3d5ca, serv: 0xd9e8cf, circ: 0xdfe3e6, cafe: 0xecdcb4 };
    R.forEach(function (r) {
      var cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, W = r.x1 - r.x0, D = r.z1 - r.z0, i, k;
      if (r.type === 'library2') {
        // the reading hall: long tables with lamps, two rows of shelf units, shelf rings around the piers
        var w2 = W - 0.4, pitch = w2 / 4;
        for (i = 0; i < 4; i++) {
          var x = r.x0 + 0.2 + (i + 0.5) * pitch;
          desk(w, 4.0, 1.2, x, 0, 0, K.oak);
          for (k = 0; k < 3; k++) { chair(w, x - 1.2 + k * 1.2, -1.0, 0, K.teal); chair(w, x - 1.2 + k * 1.2, 1.0, Math.PI, K.teal); }
          [-0.9, 0.9].forEach(function (o) { cyl(w, 0.02, 0.3, x + o, 0.75, 0, K.steel, 6); box(w, 0.3, 0.1, 0.16, x + o, 1.03, 0, K.mustard); });
          [-2.35, 2.35].forEach(function (sz) { shelfUnit(w, 3.6, 2.0, 0.6, x, sz, false); });
        }
        TR.columns.forEach(function (q) { var ring = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 1.9, 16, 1, true, q[1] > 0 ? Math.PI * 0.15 : Math.PI * 1.15, Math.PI * 1.7), mat(K.oak)); ring.position.set(q[0], 0.95, q[1]); w.add(ring); });
        tag(w, 'Reading hall · 208 m²', cx, 4.4, 0, 0.8);
      } else if (r.type === 'stacks') {
        for (var sx = r.x0 + 0.7; sx < r.x1 - 0.5; sx += 1.35) shelfUnit(w, D - 0.9, 2.2, 0.5, sx, cz, true);
        tag(w, 'Book stacks', cx, 3.4, cz);
      } else if (r.type === 'lounge') {
        // café in the choir: counter with stools at the north edge, bistro tables, sofas, glass wall to the reading hall
        box(w, 2.6, 1.05, 0.6, -3.7, 0, -2.9, K.oak); box(w, 2.7, 0.04, 0.7, -3.7, 1.05, -2.9, K.dark);
        [-4.8, -4.0, -3.2, -2.4].forEach(function (x) { stool(w, x, -2.2, 0.68, K.coral); });
        [[-6.6, -1.4], [-1.9, -1.4]].forEach(function (q) { bistro(w, q[0], q[1], 0.4); chair(w, q[0] - 0.7, q[1], Math.PI / 2, K.teal, true); chair(w, q[0] + 0.7, q[1], -Math.PI / 2, K.teal, true); });
        sofa(w, -5.85, 2.45, 2.2, Math.PI, K.plum); sofa(w, -2.75, 2.45, 2.2, Math.PI, K.teal);
        box(w, 0.03, 3.0, 9.2, -1.0, 0, 0, K.glass, { glass: true });
        [-4.6, -2.3, -0.55, 0.55, 2.3, 4.6].forEach(function (z) { box(w, 0.06, 3.0, 0.06, -1.0, 0, z, 0x707a84); });
        tag(w, 'Café in the choir', cx, 3.4, cz);
        tag(w, '← entrance wing (new building, not shown)', -6.2, 1.6, 0.0, 0.42);
      } else if (r.type === 'studysm') {
        box(w, W, 0.015, D, cx, 0.005, cz, FL.learn).castShadow = false; lowWalls(w, r, 2.4, 0xf1e6df);
        var farS = r.door === 'zmax' ? -1 : 1, dz = farS > 0 ? r.z1 - 0.45 : r.z0 + 0.45;
        desk(w, 1.6, 0.65, cx, dz, 0, K.oak); chair(w, cx, dz - farS * 0.6, farS > 0 ? 0 : Math.PI, K.mustard);
        if (r.name === 'Study room 0.01') tag(w, 'Study rooms', cx + 1.8, 3.2, cz);
      } else if (r.type === 'wc1') {
        box(w, W, 0.015, D, cx, 0.005, cz, FL.serv).castShadow = false; lowWalls(w, r, 2.4, 0xe6ecef);
        box(w, 0.4, 0.4, 0.55, cx, 0, r.z0 + 0.4, K.white); box(w, 0.5, 0.12, 0.4, cx, 0.85, r.z0 + 1.4, K.white);
        if (r.name === 'Toilet, men') tag(w, 'WC', 6.6, 3.2, cz);
      } else if (r.type === 'locker') {
        box(w, W, 0.015, D, cx, 0.005, cz, FL.serv).castShadow = false; lowWalls(w, r, 2.4, 0xe6ecef);
        box(w, W - 0.4, 1.9, 0.45, cx, 0, r.door === 'zmin' ? r.z1 - 0.3 : r.z0 + 0.3, K.lockerB);
        if (r.name === 'Locker room 1') tag(w, 'Lockers', 13.5, 3.2, cz);
      } else if (r.type === 'core') {
        box(w, W, 0.015, D, cx, 0.005, cz, FL.circ).castShadow = false; lowWalls(w, r, 2.4, 0xe6e9ec);
        var sgn = cz > 0 ? 1 : -1;
        for (k = 0; k < 8; k++) box(w, 0.26, 0.18 * (k + 1), 1.1, r.x0 + 0.5 + k * 0.26, 0, cz - sgn * 0.6, K.ash);
        tag(w, 'Stair to level +1', cx, 3.2, cz);
      }
    });
    // people for scale
    sitter(w, 4.2, 1.0, Math.PI, K.coral); sitter(w, 11.0, -1.0, 0, K.plum); sitter(w, 17.5, 1.0, Math.PI, K.mustard); person(w, 15.2, 3.3, 2.0, K.teal); person(w, -3.7, -2.0, Math.PI, K.coral); person(w, 23.0, 6.5, 1.0, K.plum);
    tag(w, 'N ↑', 31.0, 0.6, -9.0, 0.5);
    return { W: 37.2, D: 24, H: 3, view: [0.42, 0.95, 1.0], fit: 0.43, target: [0, 0, 0.5] };
  };

  // café inside on the choir platform, 6.6 × 7.2 m
  B.cafeIn = function (g) {
    var W = 6.6, D = 7.2, H = 4.6;
    shell(g, W, D, H, { left: false, right: false, wall: K.brick, floorCol: 0xb08d5e });
    // west wall (left) with the 2.2 m opening to the entrance wing
    box(g, 0.4, H, (D - 2.4) / 2, -W / 2 - 0.2, 0, -D / 2 + (D - 2.4) / 4, K.brick); box(g, 0.4, H, (D - 2.4) / 2, -W / 2 - 0.2, 0, D / 2 - (D - 2.4) / 4, K.brick);
    box(g, 0.4, H - 2.6, 2.4, -W / 2 - 0.2, 2.6, 0, K.brick);
    doorGap(g, -W / 2 - 0.2, 0.55, Math.PI / 2, true); doorGap(g, -W / 2 - 0.2, -0.55, Math.PI / 2, true);
    // east: glass wall to the reading hall with a glass door
    box(g, 0.03, H, D, W / 2, 0, 0, K.glass, { glass: true });
    [-3.6, -2.3, -1.15, -0.55, 0.55, 1.15, 2.3, 3.6].forEach(function (z) { box(g, 0.08, H, 0.08, W / 2, 0, z, 0x707a84); });
    box(g, 0.08, 0.06, 1.1, W / 2, 2.3, 0, 0x707a84); box(g, 0.08, 0.08, D, W / 2, H, 0, 0x707a84);
    // pass-through window in the choir wall above the counter
    box(g, 2.8, 0.8, 0.06, 0.6, 1.75, -D / 2 + 0.02, K.glass, { glass: true }); box(g, 3.0, 0.08, 0.1, 0.6, 1.7, -D / 2 + 0.03, K.dark); box(g, 3.0, 0.08, 0.1, 0.6, 2.55, -D / 2 + 0.03, K.dark);
    // counter with bar stools, two bistro tables, sofas
    box(g, 2.6, 1.05, 0.6, 0.6, 0, -3.2 + 0.3, K.oak); box(g, 2.7, 0.04, 0.7, 0.6, 1.05, -2.9, K.dark);
    box(g, 0.6, 0.45, 0.35, 1.3, 1.09, -3.0, K.steel); box(g, 0.8, 0.3, 0.45, -0.1, 1.09, -2.95, K.glass, { glass: true });
    [-0.5, 0.3, 1.1, 1.9].forEach(function (x) { stool(g, x, -2.2, 0.68, K.coral); });
    [[-2.3, -2.1], [2.5, -1.4]].forEach(function (q) { bistro(g, q[0], q[1], 0.4); chair(g, q[0] - 0.7, q[1], Math.PI / 2, K.teal, true); chair(g, q[0] + 0.7, q[1], -Math.PI / 2, K.teal, true); });
    sofa(g, -1.55, 2.45, 2.2, Math.PI, K.plum); sofa(g, 1.55, 2.45, 2.2, Math.PI, K.teal);
    desk(g, 1.2, 0.7, 0, 1.55, 0, K.oak).children.forEach(function (c) { c.position.y -= 0.33; });
    box(g, 3.4, 0.015, 1.6, 0, 0, 1.95, K.rug);
    plant(g, -W / 2 + 0.4, D / 2 - 0.4, 1.2); plant(g, W / 2 - 0.4, D / 2 - 0.4, 1.2);
    person(g, 0.6, -1.6, Math.PI, K.coral); sitter(g, -1.2, 2.3, Math.PI, K.mustard); sitter(g, -2.3 - 0.7, -2.1, Math.PI / 2, K.plum);
    // a glimpse of the reading hall beyond the glass
    tiledFloor(g, 4, D, W / 2 + 2.05, 0, 0); desk(g, 1.2, 3.0, W / 2 + 2.3, 0, 0, K.oak);
    return { W: W + 4, D: D, H: H, view: [0.8, 0.85, 1.0], fit: 0.75 };
  };

  // take-away café on the ground floor of the new building, 9.8 × 6.8 m
  B.takeaway = function (g) {
    var W = 9.8, D = 6.8, H = 2.7;
    shell(g, W, D, H, { back: false, floorCol: 0xcdb48a, wall: 0xe3dccb });
    // north: shop front to the street
    box(g, W, 0.4, 0.15, 0, 0, -D / 2 - 0.07, 0xe3dccb); box(g, W, H - 0.4, 0.02, 0, 0.4, -D / 2, K.glass, { glass: true });
    for (var fx = -W / 2; fx <= W / 2 + 0.01; fx += 1.4) box(g, 0.06, H, 0.1, fx, 0, -D / 2, K.dark);
    // storage room in the north-east corner (about 5 m²)
    box(g, 0.1, H, 2.4, 2.45, 0, -2.2, 0xe3dccb); box(g, 2.4, H, 0.1, 3.65, 0, -1.0, 0xe3dccb); box(g, 2.4, 0.02, 2.4, 3.65, H, -2.2, K.wallCut);
    doorGap(g, 3.2, -1.0, 0, true);
    // counter, back bar, coffee machine, shelves
    box(g, 3.4, 1.05, 0.7, 2.1, 0, 2.05, K.oak); box(g, 3.5, 0.04, 0.8, 2.1, 1.05, 2.05, K.dark); box(g, 0.9, 0.3, 0.5, 1.2, 1.09, 2.05, K.glass, { glass: true });
    box(g, 3.4, 0.9, 0.5, 2.1, 0, 3.1, K.white); box(g, 0.6, 0.45, 0.5, 3.0, 0.9, 3.1, K.steel); box(g, 0.25, 0.4, 0.3, 3.55, 0.9, 3.1, K.black);
    box(g, 3.2, 0.04, 0.3, 2.1, 1.6, 3.25, K.oak); box(g, 3.2, 0.04, 0.3, 2.1, 2.0, 3.25, K.oak);
    for (var c = 0; c < 9; c++) cyl(g, 0.05, 0.12, 0.7 + c * 0.32, 1.64, 3.25, [K.white, K.mustard, K.teal][c % 3], 10);
    // seven bistro tables
    [[1.1, -0.1], [3.3, -0.1], [1.1, -2.3], [-1.2, -0.1], [-3.3, -0.1], [-3.3, -2.3], [-1.2, -2.3]].forEach(function (q) {
      bistro(g, q[0], q[1], 0.4); chair(g, q[0] - 0.7, q[1], Math.PI / 2, K.coral, true); chair(g, q[0] + 0.7, q[1], -Math.PI / 2, K.coral, true);
    });
    plant(g, 4.5, 0.6, 1.2);
    person(g, 2.0, 3.55 - 0.2, Math.PI, K.teal); person(g, 0.6, 1.1, 0.2, K.plum); sitter(g, -3.3 - 0.7, -0.1, Math.PI / 2, K.mustard);
    // sign above the shop front
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; var x = cv.getContext('2d'); x.fillStyle = '#2b6f77'; x.fillRect(0, 0, 512, 96); x.fillStyle = '#fff'; x.font = 'bold 54px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('TAKE-AWAY CAFÉ', 256, 50);
    var sg = new T.Mesh(new T.PlaneGeometry(3.2, 0.6), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), side: T.DoubleSide })); sg.position.set(-1.5, H + 0.4, -D / 2 - 0.1); g.add(sg);
    return { W: W, D: D, H: H + 0.8, view: [0.55, 0.9, 1.0], fit: 0.64 };
  };

  // organ gallery at the east end, used as a reading balcony (level +2)
  B.organ = function (g) {
    var W = 8.0, D = 6.2, H = 5.0;
    shell(g, W, D, H, { front: false, right: false, left: false, wall: K.brick, floorCol: 0xd8c7aa });
    box(g, 0.4, H, D, -W / 2 - 0.2, 0, 0, K.brick); box(g, 0.4, 2.2, D, W / 2 + 0.2, 0, 0, K.brick);
    // tower opening in the back wall with a round-headed window
    box(g, 1.4, 2.6, 0.05, 0, 1.6, -D / 2 + 0.02, K.glass, { glass: true });
    var wd = new T.Mesh(new T.CircleGeometry(0.7, 20, 0, Math.PI), mat(K.glass, { glass: true })); wd.position.set(0, 4.2, -D / 2 + 0.03); g.add(wd);
    // organ cases with pipes on both sides of the tower
    [-1, 1].forEach(function (sd) {
      var z0 = -D / 2 + 0.1, xc = sd * 3.2;
      box(g, 1.7, 0.9, 0.65, xc, 0, z0 + 0.33, K.case);
      box(g, 1.7, 3.9, 0.2, xc, 0.9, z0 + 0.1, K.case);
      for (var k = 0; k < 8; k++) { var h = 2.0 + 1.6 * Math.sin(Math.PI * (k + 0.5) / 8); var p = cyl(g, 0.055, h, xc - 0.7 + k * 0.2, 0.9, z0 + 0.3, K.pipe, 10); p.material = mat(K.pipe, { metal: 0.5, rough: 0.35 }); }
    });
    // balustrade towards the nave
    box(g, W, 1.1, 0.03, 0, 0, D / 2, K.glass, { glass: true }); box(g, W, 0.06, 0.1, 0, 1.1, D / 2, K.oak);
    // reading chairs facing the nave, side tables and lamps
    [-2.6, -0.9, 0.9, 2.6].forEach(function (x, i) { armchair(g, x, 1.6, 0, [K.mustard, K.teal, K.coral, K.plum][i]); });
    [-1.75, 1.75].forEach(function (x) { cyl(g, 0.25, 0.04, x, 0.5, 1.5, K.oak, 18); cyl(g, 0.03, 0.5, x, 0, 1.5, K.dark, 6); });
    shelf(g, 2.4, 2.1, 0.35, -W / 2 + 0.2, -0.3, Math.PI / 2, 5); shelf(g, 2.4, 2.1, 0.35, W / 2 - 0.2, 0.2, -Math.PI / 2, 5);
    sitter(g, -0.9, 1.6, 0, K.sky); person(g, 1.8, -0.5, 0.5, K.coral);
    // the nave 5.6 m below
    var low = new T.Group(); low.position.y = -5.6; g.add(low);
    tiledFloor(low, W + 2, 6, 0, 0, D / 2 + 3); desk(low, 4.0, 1.2, 0, D / 2 + 3.2, 0, K.oak);
    for (var c = 0; c < 3; c++) { chair(low, -1.2 + c * 1.2, D / 2 + 2.2, 0, K.teal); chair(low, -1.2 + c * 1.2, D / 2 + 4.2, Math.PI, K.teal); }
    box(g, W + 0.8, 5.6, 0.3, 0, -5.6, -D / 2 - 0.15, K.brick);
    return { W: W, D: D + 6, H: H, view: [0.55, 0.65, 1.0], fit: 0.75, target: [0, -0.8, 1.5] };
  };

  // women's toilets and showers in the café building (levels +2 and +3), 3.4 × 5.2 m
  B.bath = function (g) {
    var W = 3.4, D = 5.2, H = 2.4;
    shell(g, W, D, H, { floorCol: 0xc3ccd3, backCol: 0xe6ecef, leftCol: 0xe6ecef });
    var pc = 0xd0809f, cd = 1.6, pitch = 1.04, i, k;
    for (i = 0; i < 3; i++) {
      var x = (i - 1) * pitch;
      box(g, 0.38, 0.4, 0.5, x, 0, -D / 2 + 0.4, K.white); box(g, 0.38, 0.4, 0.14, x, 0.4, -D / 2 + 0.16, K.white);
      var dr = box(g, 0.82, 1.8, 0.03, x + 0.2, 0.2, -D / 2 + cd + 0.3, pc); dr.rotation.y = 0.9;
    }
    for (k = 0; k < 4; k++) box(g, 0.04, 2.0, cd, (k - 1.5) * pitch, 0.1, -D / 2 + cd / 2 + 0.05, K.white);
    // washbasins along the right side wall (shown cut low, so the counter sits on its own)
    var bxw = W / 2 - 0.27;
    box(g, 0.5, 0.8, 1.9, bxw, 0, 1.3, K.oak); box(g, 0.52, 0.04, 1.92, bxw, 0.8, 1.3, K.white);
    for (k = 0; k < 3; k++) { box(g, 0.36, 0.05, 0.4, bxw, 0.84, 0.75 + k * 0.55, K.steel); box(g, 0.04, 0.2, 0.04, W / 2 - 0.08, 0.84, 0.75 + k * 0.55, K.steel); }
    // two walk-in showers along the left wall
    var shx = -(W / 2 - 0.5);
    [-0.15, 0.8].forEach(function (zc) { box(g, 0.9, 0.04, 0.9, shx, 0, zc, K.steel); box(g, 0.04, 1.0, 0.04, -(W / 2 - 0.05), 1.0, zc, K.steel); box(g, 0.16, 0.05, 0.16, -(W / 2 - 0.15), 2.0, zc, K.steel); });
    [-0.6, 0.325, 1.25].forEach(function (zd) { box(g, 0.9, 2.0, 0.03, shx, 0, zd, K.glass, { glass: true }); });
    box(g, 0.03, 0.7, 1.8, -W / 2 + 0.02, 1.15, 2.2, K.glass, { glass: true });
    doorGap(g, 0.9, D / 2 + 0.06, 0, false);
    person(g, 0.6, 1.8, -2.4, K.plum);
    return { W: W, D: D, H: H };
  };

  // entrance wing with the lift and stair (ground floor), 8.1 × 2.4 m
  B.lobby = function (g) {
    var W = 8.1, D = 2.4, H = 3.4;
    box(g, W, 0.06, D, 0, -0.06, 0, 0xcfe6ea);
    box(g, W + 0.2, 0.25, D + 0.2, 0, -0.31, 0, K.slab);
    // west facade: glass with frames, the portal with two sliding doors and a canopy outside
    box(g, W, H, 0.02, 0, 0, -D / 2, K.glass, { glass: true });
    for (var fx = -W / 2; fx <= W / 2 + 0.01; fx += 0.8) box(g, 0.06, H, 0.1, fx, 0, -D / 2, K.dark);
    box(g, W, 0.08, 0.12, 0, H - 0.08, -D / 2, K.dark); box(g, 3.3, 0.08, 0.12, 0, 2.5, -D / 2, K.dark);
    box(g, 4.8, 0.2, 1.3, 0, 3.3, -D / 2 - 0.65, K.concrete); cyl(g, 0.04, 3.3, -2.3, 0, -D / 2 - 1.2, K.dark, 8); cyl(g, 0.04, 3.3, 2.3, 0, -D / 2 - 1.2, K.dark, 8);
    box(g, 6, 0.04, 2, 0, -0.04, -D / 2 - 1.1, 0x9aa1a8);
    var cv = document.createElement('canvas'); cv.width = 1024; cv.height = 96; var x = cv.getContext('2d'); x.fillStyle = '#2b6f77'; x.fillRect(0, 0, 1024, 96); x.fillStyle = '#fff'; x.font = 'bold 50px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('LIBRARY · STUDENT HOUSING · ENTRANCE', 512, 50);
    var sg = new T.Mesh(new T.PlaneGeometry(4.4, 0.42), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), side: T.DoubleSide })); sg.position.set(0, 3.12, -D / 2 - 1.31); sg.rotation.y = Math.PI; g.add(sg);
    // bench and notice board beside the portal
    box(g, 1.4, 0.45, 0.4, -2.3, 0, -D / 2 + 0.3, K.oak); box(g, 1.2, 0.8, 0.03, -2.3, 1.3, -D / 2 + 0.06, 0xd8cbb5);
    // lift at the north end (right): glass shaft 1.5 × 1.5 m
    var lx = 3.25, lz = -0.2;
    [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]].forEach(function (p) { box(g, 0.08, H, 0.08, lx + p[0], 0, lz + p[1], K.dark); });
    box(g, 1.5, H, 0.03, lx, 0, lz - 0.75, K.glass, { glass: true }); box(g, 0.03, H, 1.5, lx - 0.75, 0, lz, K.glass, { glass: true }); box(g, 0.03, H, 1.5, lx + 0.75, 0, lz, K.glass, { glass: true });
    box(g, 1.3, 2.3, 1.3, lx, 0.05, lz, 0xb9c0c6, { op: 0.75 }); box(g, 0.72, 2.1, 0.04, lx - 0.37, 0, lz + 0.75, K.steel); box(g, 0.72, 2.1, 0.04, lx + 0.37, 0, lz + 0.75, 0xaab3ba);
    // U-shaped stair at the south end (left), first flight
    var n = 8, tread = 0.26, rise = 0.18;
    for (var k = 0; k < n; k++) box(g, 0.9, rise * (k + 1), tread, -3.5 + k * tread, 0, -0.55, K.ash);
    box(g, 1.0, 0.1, 2.0, -3.5 + n * tread + 0.4, rise * n - 0.1, 0, K.ash);
    for (k = 0; k < 6; k++) box(g, 0.9, 0.07, tread, -3.5 + (n - 1 - k) * tread, rise * n + rise * (k + 1) - 0.07, 0.5, K.oak);
    box(g, 2.2, 0.9, 0.03, -2.6, rise * 4, -0.05, K.glass, { glass: true });
    // east side (front, cut low) with the 2.2 m opening to the choir and the café inside
    box(g, (W - 2.4) / 2, 0.35, 0.3, -W / 2 + (W - 2.4) / 4, 0, D / 2 + 0.15, K.brick); box(g, (W - 2.4) / 2, 0.35, 0.3, W / 2 - (W - 2.4) / 4, 0, D / 2 + 0.15, K.brick);
    box(g, (W - 2.4) / 2, 0.02, 0.31, -W / 2 + (W - 2.4) / 4, 0.35, D / 2 + 0.15, K.wallCut); box(g, (W - 2.4) / 2, 0.02, 0.31, W / 2 - (W - 2.4) / 4, 0.35, D / 2 + 0.15, K.wallCut);
    // north end wall (right) with the fire door to the café building; south end (left) closed
    box(g, 0.12, H, D, -W / 2 - 0.06, 0, 0, K.glass, { glass: true });
    box(g, 0.12, 0.35, D, W / 2 + 0.06, 0, 0, 0xe3dccb);
    person(g, 0.3, 0.35, 2.6, K.coral); person(g, 1.5, -0.3, -1.9, K.teal);
    return { W: W, D: D + 2.6, H: H, view: [0.35, 0.75, 1.0], fit: 0.62, target: [0, 1.0, -0.6] };
  };

  // locker room in the covered passage along the south aisle: 5.0 × 1.3 m, 2.6 m high
  B.locker = function (g) {
    var W = 5.0, D = 1.3, H = 2.6;
    shell(g, W, D, H, { floorCol: 0xc3ccd3 });
    var bw = W - 0.5, n = 12, pw = bw / n, d0 = -D / 2 + 0.27;
    box(g, bw + 0.04, 0.1, 0.5, -0.15, 0, d0, K.dark); box(g, bw + 0.04, 0.06, 0.5, -0.15, 1.9, d0, K.dark); box(g, bw, 1.8, 0.48, -0.15, 0.1, d0, 0x8d979f);
    for (var i = 0; i < n; i++) {
      var x = -0.15 - bw / 2 + (i + 0.5) * pw;
      box(g, pw - 0.04, 0.84, 0.03, x, 0.14, d0 + 0.255, i % 4 === 2 ? K.mustard : K.lockerB); box(g, pw - 0.04, 0.84, 0.03, x, 1.02, d0 + 0.255, i % 3 === 1 ? K.mustard : K.lockerB);
      box(g, 0.08, 0.02, 0.02, x + pw / 2 - 0.1, 0.6, d0 + 0.275, K.white); box(g, 0.08, 0.02, 0.02, x + pw / 2 - 0.1, 1.48, d0 + 0.275, K.white);
    }
    box(g, 0.02, 1.2, 0.5, W / 2 - 0.02, 0.6, 0, K.glass, { glass: true });
    // flat roof of the passage above, with a roof window
    box(g, W + 0.3, 0.12, D + 0.3, 0, H + 0.3, 0, 0x6d737b, { op: 0.35 });
    doorGap(g, 1.7, D / 2 + 0.06, 0, false);
    person(g, 1.6, 0.25, Math.PI + 0.4, K.coral);
    return { W: W, D: D, H: H, view: [0.4, 0.85, 1.0], fit: 0.7 };
  };

  // bicycle store in the one-storey south volume, 9.8 × 6.8 m, about 60 places
  B.bikes = function (g) {
    var W = 9.8, D = 6.8, H = 2.7;
    shell(g, W, D, H, { floorCol: 0x9aa1a8, wall: 0xe3dccb });
    seed = 11;
    // stands for about 60 bikes (five rows of 12); only every third place is taken, so the store reads clearly
    [-2.6, -1.5, -0.4, 0.7, 1.8].forEach(function (z, r) {
      box(g, 8.6, 0.05, 0.05, -0.1, 0.25, z - 0.25, K.steel);
      var k = 0; for (var x = -4.2; x <= 3.95; x += 0.7, k++) { box(g, 0.04, 0.5, 0.04, x, 0, z - 0.25, K.steel); if ((k + r) % 3 === 0) bike(g, x, z + (r % 2 ? 0.08 : 0), 0); }
    });
    box(g, 2.4, 2.3, 0.04, -3.5, 0, D / 2 + 0.02, K.dark);
    person(g, 3.8, 2.7, Math.PI + 0.3, K.teal);
    return { W: W, D: D, H: H, view: [0.6, 1.0, 1.0], fit: 0.62 };
  };

  /* ================= viewer ================= */
  var sun, renderer, scene, camera, controls, root, canvas, wrapEl, visible = true, dirty = true, autoRot = true, curKey = null, lastInteract = 0, frames = 0;
  function mount(cv, wrap) {
    canvas = cv; wrapEl = wrap || cv.parentNode;
    try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, preserveDrawingBuffer: false }); }
    catch (e) { return false; }
    renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1) * 1.5, 3));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(38, 1, 0.1, 400);
    scene.add(new T.HemisphereLight(0xffffff, 0xb8b0a4, 0.75));
    sun = new T.DirectionalLight(0xfff4e6, 0.75); sun.position.set(8, 16, 10); sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096); sun.shadow.camera.left = -24; sun.shadow.camera.right = 24; sun.shadow.camera.top = 24; sun.shadow.camera.bottom = -24; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
    scene.add(sun); scene.add(sun.target);
    var fill = new T.DirectionalLight(0xdfe9ff, 0.25); fill.position.set(-10, 8, -6); scene.add(fill);
    if (T.OrbitControls) {
      controls = new T.OrbitControls(camera, cv);
      controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.49; controls.screenSpacePanning = true;
      controls.addEventListener('change', function () { dirty = true; });
      controls.addEventListener('start', function () { autoRot = false; lastInteract = performance.now(); });
    }
    setBg();
    if (window.matchMedia) { var mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', setBg); }
    new MutationObserver(setBg).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(wrapEl); else window.addEventListener('resize', resize);
    if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) dirty = true; }, { threshold: 0.02 }).observe(wrapEl);
    resize();
    api.ready = true;
    requestAnimationFrame(loop);
    return true;
  }
  function setBg() {
    if (!scene) return;
    var c = getComputedStyle(document.documentElement).getPropertyValue('--viewer-bg').trim() || '#e9eeed';
    scene.background = new T.Color(c); dirty = true;
  }
  function resize() {
    if (!renderer) return;
    var w = Math.max(1, wrapEl.clientWidth), h = Math.max(1, wrapEl.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
  }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function loop(now) {
    requestAnimationFrame(loop);
    if (!renderer) return;
    // visibility checked here as well: the IntersectionObserver alone can miss a change during smooth scrolling
    var vr = wrapEl.getBoundingClientRect(), nowVis = vr.bottom > 0 && vr.top < (window.innerHeight || 800);
    if (nowVis && !visible) dirty = true;
    visible = nowVis;
    if (!visible) return;
    if (controls) {
      if (!autoRot && !reduced && performance.now() - lastInteract > 12000) autoRot = true;
      controls.autoRotate = autoRot && !reduced; controls.autoRotateSpeed = 0.55;
      controls.update();
      if (controls.autoRotate) dirty = true;
    }
    if (!dirty) return;
    dirty = false;
    renderer.render(scene, camera); frames++;
  }
  function clear() {
    if (!root) return;
    // materials can be single or an array (shelf units); only textured materials outside the cache are freed
    root.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      (Array.isArray(o.material) ? o.material : (o.material ? [o.material] : [])).forEach(function (mm) {
        if (mm.map && !matCacheHas(mm)) { mm.map.dispose(); mm.dispose(); }
      });
    });
    scene.remove(root); root = null;
  }
  function matCacheHas(m) { for (var k in matCache) if (matCache[k] === m) return true; return false; }
  function show(key) {
    if (!renderer || !B[key]) return null;
    clear(); seed = 7;
    root = new T.Group(); scene.add(root);
    var info = B[key](root) || {};
    curKey = key;
    // frame the room: look from the front right and above
    var W = info.W || 5, D = info.D || 5, H = info.H || 3, v = info.view || [0.75, 0.85, 1.0];
    var dir = new T.Vector3(v[0], v[1], v[2]).normalize();
    var size = Math.max(W, D * 0.9, H * 1.4), fov = camera.fov * Math.PI / 180;
    var aspectK = Math.max(1, 1.25 / camera.aspect);
    var dist = (size * (info.fit || 0.72)) / Math.tan(fov / 2) * aspectK;
    var tg = info.target ? new T.Vector3(info.target[0], info.target[1], info.target[2]) : new T.Vector3(0, Math.min(H * 0.32, 1.4), 0);
    camera.position.copy(tg).add(dir.multiplyScalar(dist));
    if (controls) { controls.target.copy(tg); controls.minDistance = Math.max(1.5, size * 0.25); controls.maxDistance = dist * 2.2; controls.update(); }
    else camera.lookAt(tg);
    // fit the sun's shadow camera to this room, so shadows stay sharp in small rooms
    var S = Math.max(W, D) * 0.75 + 2, sc = sun.shadow.camera;
    sc.left = -S; sc.right = S; sc.top = S; sc.bottom = -S; sc.near = 1; sc.far = S * 6; sc.updateProjectionMatrix();
    var sd = new T.Vector3(8, 16, 10).normalize().multiplyScalar(S * 2.4); sun.position.copy(tg).add(sd); sun.target.position.copy(tg); sun.target.updateMatrixWorld();
    sun.shadow.bias = -0.0004 * Math.max(1, S / 8);
    autoRot = true; lastInteract = 0; dirty = true;
    return info;
  }
  api.mount = mount; api.show = show; api.keys = Object.keys(B);
  api.stats = function () { return { visible: visible, frames: frames, autoRot: autoRot, dirty: dirty }; };
  api.resetView = function () { if (curKey) show(curKey); };
  api.toggleRotate = function () { autoRot = !autoRot; lastInteract = autoRot ? 0 : performance.now() + 1e9; dirty = true; return autoRot; };
})();
