'use strict';

const Renderer3D = (() => {
  let renderer, scene, camera, controls, animId;
  let osbTex = null;
  let isInit = false;

  // ── OSB procedural texture ─────────────────────────────────
  function makeOSBTexture() {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#C4956A';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 350; i++) {
      const x     = Math.random() * size;
      const y     = Math.random() * size;
      const len   = 12 + Math.random() * 80;
      const angle = Math.random() < 0.65
        ? Math.random() * 0.5 - 0.25
        : Math.PI / 2 + Math.random() * 0.5 - 0.25;
      const thick = 1 + Math.random() * 3;
      const r = 60  + Math.floor(Math.random() * 90);
      const g = 30  + Math.floor(Math.random() * 60);
      const b = 10  + Math.floor(Math.random() * 35);
      const a = 0.18 + Math.random() * 0.52;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fillRect(-len / 2, -thick / 2, len, thick);
      ctx.restore();
    }
    // Vignette press marks
    const grd = ctx.createRadialGradient(size/2,size/2,size*0.3,size/2,size/2,size*0.75);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  function makeFrameTex() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#A07040';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(${60 + Math.random()*80|0},${30+Math.random()*50|0},${10+Math.random()*20|0},0.3)`;
      ctx.fillRect(0, Math.random()*size, size, 1 + Math.random()*2);
    }
    return new THREE.CanvasTexture(c);
  }

  // ── Scene rebuild ──────────────────────────────────────────
  function buildScene() {
    while (scene.children.length > 0) scene.remove(scene.children[0]);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff8e8, 0.9);
    sun.position.set(30, 60, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.width  = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8899ff, 0.2);
    fill.position.set(-20, 20, -30);
    scene.add(fill);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(500, 500);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1e });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const osbMat   = new THREE.MeshLambertMaterial({ map: osbTex });
    const frameMat = new THREE.MeshLambertMaterial({ map: makeFrameTex() });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.3 });

    AppState.modules.forEach(mod => buildModuleMesh(mod, osbMat, frameMat, glassMat));

    // Grid helper (floor)
    const gridHelper = new THREE.GridHelper(500, 40, 0x2a2a2a, 0x222222);
    scene.add(gridHelper);
  }

  function buildModuleMesh(mod, osbMat, frameMat, glassMat) {
    const v = mod.rot === 90;
    // Converts grid position to 3D world
    const wx = mod.gx * U3 + (v ? 0 : U3 / 2);
    const wz = mod.gy * U3 + (v ? U3 / 2 : 0);
    const wy = H3 / 2;

    const w = v ? T3 : U3;
    const d = v ? U3 : T3;

    switch (mod.type) {
      case 'wall': {
        const geo  = new THREE.BoxGeometry(w, H3, d);
        const mesh = new THREE.Mesh(geo, osbMat);
        mesh.position.set(wx, wy, wz);
        mesh.castShadow = mesh.receiveShadow = true;
        scene.add(mesh);
        // Wood frame visible edges
        addFrame(wx, wz, w, H3, d, v, frameMat);
        break;
      }
      case 'window': {
        const sH = H3 * 0.28;  // sill + header height
        const wH = H3 - sH * 2; // window opening height
        // Sill
        const sillGeo = new THREE.BoxGeometry(w, sH, d);
        addMesh(sillGeo, osbMat, wx, sH / 2, wz);
        // Header
        addMesh(sillGeo, osbMat, wx, H3 - sH / 2, wz);
        // Left jamb
        const jw = !v ? w * 0.25 : w;
        const jd = !v ? d        : d * 0.25;
        const jGeo = new THREE.BoxGeometry(jw, wH, jd);
        if (!v) {
          addMesh(jGeo, osbMat, wx - (w - jw) / 2, sH + wH / 2, wz);
          addMesh(jGeo, osbMat, wx + (w - jw) / 2, sH + wH / 2, wz);
        } else {
          addMesh(jGeo, osbMat, wx, sH + wH / 2, wz - (d - jd) / 2);
          addMesh(jGeo, osbMat, wx, sH + wH / 2, wz + (d - jd) / 2);
        }
        // Window glass pane
        const gw = !v ? w * 0.5 : w;
        const gd = !v ? d       : d * 0.5;
        const gGeo = new THREE.BoxGeometry(gw, wH, gd);
        addMesh(gGeo, glassMat, wx, sH + wH / 2, wz);
        break;
      }
      case 'door': {
        const dH = H3 * 0.88; // door opening height
        const linH = H3 - dH; // lintel height
        // Lintel
        addMesh(new THREE.BoxGeometry(w, linH, d), osbMat, wx, H3 - linH / 2, wz);
        // Left jamb
        const jw = !v ? w * 0.2 : w;
        const jd = !v ? d       : d * 0.2;
        const jGeo = new THREE.BoxGeometry(jw, dH, jd);
        if (!v) {
          addMesh(jGeo, osbMat, wx - (w - jw) / 2, dH / 2, wz);
          addMesh(jGeo, osbMat, wx + (w - jw) / 2, dH / 2, wz);
        } else {
          addMesh(jGeo, osbMat, wx, dH / 2, wz - (d - jd) / 2);
          addMesh(jGeo, osbMat, wx, dH / 2, wz + (d - jd) / 2);
        }
        // Door leaf (slightly open)
        const leafW = !v ? w * 0.6 : T3 * 0.3;
        const leafD = !v ? T3 * 0.3 : d * 0.6;
        const leaf  = new THREE.BoxGeometry(leafW, dH * 0.98, leafD);
        const leafMesh = new THREE.Mesh(leaf, frameMat);
        leafMesh.position.set(wx - (!v ? w * 0.1 : 0), dH / 2, wz - (!v ? 0 : d * 0.1));
        leafMesh.rotation.y = !v ? 0.35 : 0.35;
        leafMesh.castShadow = true;
        scene.add(leafMesh);
        break;
      }
      case 'opening': {
        const postW = !v ? T3 * 1.2 : w;
        const postD = !v ? d        : T3 * 1.2;
        const postGeo = new THREE.BoxGeometry(postW, H3, postD);
        if (!v) {
          addMesh(postGeo, frameMat, wx - w / 2 + postW / 2, wy, wz);
          addMesh(postGeo, frameMat, wx + w / 2 - postW / 2, wy, wz);
        } else {
          addMesh(postGeo, frameMat, wx, wy, wz - d / 2 + postD / 2);
          addMesh(postGeo, frameMat, wx, wy, wz + d / 2 - postD / 2);
        }
        // Top beam
        const beamGeo = new THREE.BoxGeometry(!v ? w : T3, T3, !v ? T3 : d);
        addMesh(beamGeo, frameMat, wx, H3 - T3 / 2, wz);
        break;
      }
    }
  }

  function addMesh(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }

  function addFrame(cx, cz, w, h, d, v, mat) {
    const t = 0.5;
    const posts = v
      ? [[-w / 2 + t / 2, 0, 0], [w / 2 - t / 2, 0, 0]]
      : [[0, 0, -d / 2 + t / 2], [0, 0, d / 2 - t / 2]];
    posts.forEach(([dx, , dz]) => {
      const g = new THREE.BoxGeometry(v ? t : w, h, v ? d : t);
      addMesh(g, mat, cx + dx, h / 2, cz + dz);
    });
  }

  // ── Init & camera presets ─────────────────────────────────
  function init(canvasEl) {
    if (isInit) return;
    isInit = true;

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x0f0f12);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f0f12, 0.006);

    const w = canvasEl.clientWidth, h = canvasEl.clientHeight;
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    camera.position.set(80, 60, 80);
    camera.lookAt(0, 12, 0);

    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, canvasEl);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(0, 10, 0);
    }

    osbTex = makeOSBTexture();

    function loop() {
      animId = requestAnimationFrame(loop);
      const cw = canvasEl.clientWidth, ch = canvasEl.clientHeight;
      if (renderer.domElement.width !== cw || renderer.domElement.height !== ch) {
        renderer.setSize(cw, ch, false);
        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
      }
      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    loop();
    buildScene();
  }

  function refresh() {
    if (!isInit) return;
    buildScene();
    // Auto-centre camera on modules
    const mods = AppState.modules;
    if (!mods.length) return;
    let cx = 0, cz = 0;
    mods.forEach(m => { cx += m.gx; cz += m.gy; });
    cx = (cx / mods.length) * U3;
    cz = (cz / mods.length) * U3;
    if (controls) {
      controls.target.set(cx, 10, cz);
      camera.position.set(cx + 70, 55, cz + 70);
      controls.update();
    }
  }

  function setCameraPreset(preset) {
    const mods = AppState.modules;
    let cx = 0, cz = 0;
    if (mods.length) {
      mods.forEach(m => { cx += m.gx; cz += m.gy; });
      cx = (cx / mods.length) * U3;
      cz = (cz / mods.length) * U3;
    }
    if (preset === 'iso')   camera.position.set(cx + 70, 55, cz + 70);
    if (preset === 'top')   camera.position.set(cx, 120, cz + 0.01);
    if (preset === 'front') camera.position.set(cx, 15, cz + 80);
    if (controls) { controls.target.set(cx, 10, cz); controls.update(); }
  }

  function captureImage() {
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  }

  return { init, refresh, setCameraPreset, captureImage };
})();
