// 桌腳和框的接法：每張轉角卡片的 3D（可拖曳旋轉）。資料由 gen_joints.py 寫在 .v3d 的 data-scene。
// 座標：頁面用 mm，x 往右、y 往後、z 往上；three.js 是 y 往上、z 朝向看的人，所以 (x, y, z) → (x, z, -y)。
(function () {
  if (!window.THREE || !THREE.OrbitControls) return;
  var T = THREE;
  function hasGL() {
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }
    catch (e) { return false; }
  }
  if (!hasGL()) return;
  document.documentElement.classList.add('gl');

  function cssv(n, d) { var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || d; }
  function V(p) { return new T.Vector3(p[0], p[2], -p[1]); }

  var MAT = {};
  function mats() {
    MAT.metal = new T.MeshStandardMaterial({ color: 0xc9ced3, metalness: 0.65, roughness: 0.32 });
    MAT.zinc = new T.MeshStandardMaterial({ color: 0xb2b8bf, metalness: 0.7, roughness: 0.36 });
    MAT.brass = new T.MeshStandardMaterial({ color: 0xc9a447, metalness: 0.7, roughness: 0.3 });
    MAT.dark = new T.MeshStandardMaterial({ color: 0x24282b, metalness: 0.3, roughness: 0.6 });
    MAT.plate = new T.MeshStandardMaterial({ color: 0x9aa4aa, metalness: 0.55, roughness: 0.4 });
  }

  // 螺紋：繞著 Y 軸的螺旋細管
  function helix(r0, y0, y1, pitch, tube) {
    var pts = [], turns = (y1 - y0) / pitch, n = Math.max(8, Math.round(turns * 14));
    for (var i = 0; i <= n; i++) {
      var t = i / n, a = t * turns * Math.PI * 2;
      pts.push(new T.Vector3(Math.cos(a) * r0, y0 + t * (y1 - y0), Math.sin(a) * r0));
    }
    return new T.TubeGeometry(new T.CatmullRomCurve3(pts), n, tube, 5, false);
  }
  function star(r1, r2, n) {
    var s = new T.Shape();
    for (var i = 0; i < n * 2; i++) {
      var r = i % 2 ? r2 : r1, a = i * Math.PI / n, x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i) s.lineTo(x, y); else s.moveTo(x, y);
    }
    s.closePath(); return s;
  }
  // 木螺絲（Ø4 左右）：沿 +Y，尖端在 0，頭頂在 len。喇叭頭、頭上星型凹槽、螺紋、尖尾
  function woodScrew(len) {
    var g = new T.Group(), r = 2.1, hh = 3.6, tip = 4.5;
    var c = new T.Mesh(new T.ConeGeometry(r * 0.8, tip, 16), MAT.metal); c.rotation.x = Math.PI; c.position.y = tip / 2; g.add(c);
    var L = len - tip - hh;
    var sh = new T.Mesh(new T.CylinderGeometry(r * 0.8, r * 0.8, L, 16), MAT.metal); sh.position.y = tip + L / 2; g.add(sh);
    g.add(new T.Mesh(helix(r * 0.86, tip * 0.5, Math.min(len - hh - 3, len * 0.68 + 4), 1.9, 0.55), MAT.metal));
    var hd = new T.Mesh(new T.CylinderGeometry(4.1, r * 0.8, hh, 28), MAT.metal); hd.position.y = len - hh / 2; g.add(hd);
    var rc = new T.Mesh(new T.ExtrudeGeometry(star(1.75, 1.05, 6), { depth: 0.9, bevelEnabled: false }), MAT.dark);
    rc.rotation.x = -Math.PI / 2; rc.position.y = len - 0.8; g.add(rc);
    return g;
  }
  function hexm(d, h) { return new T.Mesh(new T.CylinderGeometry(d * 0.92, d * 0.92, h, 6), MAT.zinc); }
  function washer(d) { return new T.Mesh(new T.CylinderGeometry(d * 1.05, d * 1.05, 1.6, 32), MAT.zinc); }
  // 螺栓：沿 +Y，尾端在 0，頭那面在 len。六角頭、華司、螺紋；nut=true 尾端加華司和螺帽
  function bolt(len, d, nut) {
    var g = new T.Group(), r = d / 2, ext = nut ? d * 1.1 : 0;
    var sh = new T.Mesh(new T.CylinderGeometry(r * 0.9, r * 0.9, len + ext, 20), MAT.zinc); sh.position.y = (len - ext) / 2; g.add(sh);
    g.add(new T.Mesh(helix(r * 0.94, -ext + 0.5, Math.min(len * 0.45, len - 2), d * 0.15, d * 0.085), MAT.zinc));
    var w = washer(d); w.position.y = len + 0.8; g.add(w);
    var hd = hexm(d, d * 0.65); hd.position.y = len + 1.6 + d * 0.33; g.add(hd);
    if (nut) {
      var w2 = washer(d); w2.position.y = -0.8; g.add(w2);
      var n = hexm(d, d * 0.8); n.position.y = -1.6 - d * 0.4; g.add(n);
    }
    return g;
  }
  // 預埋螺帽：外面有粗牙的銅色短管
  function insert(h, r) {
    var g = new T.Group();
    var c = new T.Mesh(new T.CylinderGeometry(r * 0.82, r * 0.82, h, 24, 1, true), MAT.brass); c.position.y = -h / 2; g.add(c);
    g.add(new T.Mesh(helix(r * 0.86, -h + 1, -1, 2.6, 0.75), MAT.brass));
    var top = new T.Mesh(new T.CylinderGeometry(r, r, 1.2, 24), MAT.brass); top.position.y = -0.6; g.add(top);
    return g;
  }

  function build(el) {
    var data = JSON.parse(el.getAttribute('data-scene'));
    var W = el.clientWidth || 400, H = el.clientHeight || 300;
    var renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(new T.Color(cssv('--panel', '#f8faf9')));
    el.insertBefore(renderer.domElement, el.firstChild);
    var scene = new T.Scene();
    scene.add(new T.HemisphereLight(0xffffff, 0x556070, 0.85));
    var dl = new T.DirectionalLight(0xffffff, 0.85); dl.position.set(-250, 420, 380); scene.add(dl);
    var dl2 = new T.DirectionalLight(0xffffff, 0.3); dl2.position.set(300, 150, -200); scene.add(dl2);

    var woodCol = { leg: cssv('--leg', '#c79a5e'), rail: cssv('--rail', '#e0cf8c'), rail2: cssv('--rail2', '#cdb86e') };
    var woods = [], box3 = new T.Box3();
    var edgeMat = new T.LineBasicMaterial({ color: new T.Color(cssv('--ink', '#1c2523')), transparent: true, opacity: 0.55 });
    data.boxes.forEach(function (b) {
      var k = b[0], x0 = b[1], x1 = b[2], y0 = b[3], y1 = b[4], z0 = b[5], z1 = b[6];
      var geo = new T.BoxGeometry(x1 - x0, z1 - z0, y1 - y0);
      var m;
      if (k === 'metal') m = MAT.plate.clone();
      else { m = new T.MeshStandardMaterial({ color: new T.Color(woodCol[k] || woodCol.rail), roughness: 0.85, metalness: 0 }); woods.push(m); }
      var mesh = new T.Mesh(geo, m);
      mesh.position.set((x0 + x1) / 2, (z0 + z1) / 2, -(y0 + y1) / 2);
      scene.add(mesh);
      var e = new T.LineSegments(new T.EdgesGeometry(geo), edgeMat); e.position.copy(mesh.position); scene.add(e);
      box3.expandByObject(mesh);
    });

    var up = new T.Vector3(0, 1, 0), movers = [];
    data.screws.forEach(function (s) {
      var a = V(s.a), b = V(s.b), dir = a.clone().sub(b), len = dir.length(); dir.normalize();
      var g = s.bolt ? bolt(len, s.d || 10, s.nut) : woodScrew(len);
      g.quaternion.setFromUnitVectors(up, dir);
      g.position.copy(b);
      scene.add(g);
      movers.push({ g: g, b: b, dir: dir });
    });
    (data.inserts || []).forEach(function (s) {
      var g = insert(s.h, s.r); g.position.copy(V(s.p)); scene.add(g);
    });

    // 鏡頭對著轉角：螺絲的中心和整體中心之間
    var c = box3.getCenter(new T.Vector3()), R = box3.getSize(new T.Vector3()).length() / 2;
    if (movers.length) {
      var sc = new T.Vector3(); movers.forEach(function (m) { sc.add(m.b); }); sc.divideScalar(movers.length);
      c.lerp(sc, 0.6);
    }
    var cam = new T.PerspectiveCamera(30, W / H, 1, 8000);
    cam.position.copy(c.clone().add(new T.Vector3(-0.62, 0.55, 0.85).normalize().multiplyScalar(R * 2.6)));
    var controls = new T.OrbitControls(cam, renderer.domElement);
    controls.target.copy(c); controls.update();

    // 標籤：3D 點投影到畫面上
    var labs = (data.labels || []).map(function (l) {
      var d = document.createElement('div'); d.className = 'lab' + (l.side ? ' ' + l.side : '');
      d.innerHTML = l.t + (l.sub ? '<small>' + l.sub + '</small>' : '');
      el.appendChild(d);
      return { el: d, p: V(l.p) };
    });
    function render() {
      renderer.render(scene, cam);
      var w = el.clientWidth, h = el.clientHeight;
      labs.forEach(function (l) {
        var q = l.p.clone().project(cam);
        var vis = q.z < 1 && q.x > -1.1 && q.x < 1.1 && q.y > -1.1 && q.y < 1.1;
        l.el.style.display = vis ? '' : 'none';
        l.el.style.left = ((q.x + 1) / 2 * w) + 'px';
        l.el.style.top = ((1 - q.y) / 2 * h) + 'px';
      });
    }
    controls.addEventListener('change', render);

    var see = true;
    function setSee(v) {
      see = v;
      woods.forEach(function (m) { m.transparent = v; m.opacity = v ? 0.42 : 1; m.depthWrite = !v; m.needsUpdate = true; });
      render();
    }
    var pulled = 0, anim = null;
    function pull(to) {
      var from = pulled, t0 = performance.now();
      cancelAnimationFrame(anim);
      (function step(t) {
        var k = Math.min(1, (t - t0) / 450), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        pulled = from + (to - from) * e;
        movers.forEach(function (m) { m.g.position.copy(m.b).addScaledVector(m.dir, pulled * 55); });
        render();
        if (k < 1) anim = requestAnimationFrame(step);
      })(t0);
    }
    el.querySelectorAll('button[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.act === 'solid') { setSee(!see); btn.textContent = see ? '實心' : '透明'; }
        else { var to = pulled > 0.5 ? 0 : 1; pull(to); btn.textContent = to ? '裝回去' : '拉開螺絲'; }
      });
    });
    window.addEventListener('resize', function () {
      var w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); render();
    });
    setSee(true);
  }

  function boot() {
    mats();
    var els = [].slice.call(document.querySelectorAll('.v3d[data-scene]'));
    if (!('IntersectionObserver' in window)) { els.forEach(build); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); build(e.target); } });
    }, { rootMargin: '300px' });
    els.forEach(function (el) { io.observe(el); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
