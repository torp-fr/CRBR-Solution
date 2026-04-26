'use strict';

const Editor2D = (() => {
  let canvas, ctx;
  let panX = 200, panY = 160, zoom = 1;
  let tool = 'select';        // 'select'|'wall'|'window'|'door'|'opening'
  let rotation = 0;           // 0=horizontal, 90=vertical
  let selectedId = null;
  let ghostPos = null;        // {gx,gy,valid}
  let drag = null;            // {id, startGx, startGy, origGx, origGy, offsetWx, offsetWy}
  let isPanning = false;
  let panStart = null;
  let spaceDown = false;

  // ── Coordinate helpers ─────────────────────────────────────
  function screenToWorld(sx, sy) {
    return { x: (sx - panX) / zoom, y: (sy - panY) / zoom };
  }

  function getGhostGrid(worldX, worldY) {
    if (rotation === 0) {
      return { gx: Math.floor(worldX / GRID), gy: Math.round(worldY / GRID) };
    } else {
      return { gx: Math.round(worldX / GRID), gy: Math.floor(worldY / GRID) };
    }
  }

  function worldRect(mod) {
    const v = mod.rot === 90;
    return {
      x: mod.gx * GRID - (v ? WALL_T / 2 : 0),
      y: mod.gy * GRID - (v ? 0 : WALL_T / 2),
      w: v ? WALL_T : GRID,
      h: v ? GRID : WALL_T,
    };
  }

  function hitTest(wx, wy) {
    const pad = 6;
    for (let i = AppState.modules.length - 1; i >= 0; i--) {
      const r = worldRect(AppState.modules[i]);
      if (wx >= r.x - pad && wx <= r.x + r.w + pad &&
          wy >= r.y - pad && wy <= r.y + r.h + pad) {
        return AppState.modules[i];
      }
    }
    return null;
  }

  // ── Drawing helpers ───────────────────────────────────────
  function drawGrid() {
    const startX = Math.floor(-panX / zoom / GRID) * GRID - GRID;
    const startY = Math.floor(-panY / zoom / GRID) * GRID - GRID;
    const endX   = startX + canvas.width  / zoom + GRID * 2;
    const endY   = startY + canvas.height / zoom + GRID * 2;

    ctx.lineWidth = 1 / zoom;
    for (let x = startX; x <= endX; x += GRID) {
      ctx.strokeStyle = (x % (GRID * 5) === 0) ? COLORS.gridMaj : COLORS.grid;
      ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
    }
    for (let y = startY; y <= endY; y += GRID) {
      ctx.strokeStyle = (y % (GRID * 5) === 0) ? COLORS.gridMaj : COLORS.grid;
      ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
    }

    // Scale legend bottom-left
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const legendPx = GRID * zoom;
    const lx = 16, ly = canvas.height - 32;
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lx, ly + 6); ctx.lineTo(lx + legendPx, ly + 6); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + 12); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx + legendPx, ly); ctx.lineTo(lx + legendPx, ly + 12); ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.font = '11px -apple-system, Segoe UI, Helvetica, Arial, sans-serif';
    ctx.fillText('1250 mm', lx + legendPx + 6, ly + 10);
    ctx.restore();
  }

  function drawWallBase(x, y, w, h) {
    ctx.fillStyle   = COLORS.wall;
    ctx.strokeStyle = COLORS.wallStroke;
    ctx.lineWidth   = 0.8 / zoom;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  }

  function drawModule(mod, alpha = 1) {
    const v = mod.rot === 90;
    const r = worldRect(mod);
    const { x, y, w, h } = r;
    const sel = mod.id === selectedId;

    ctx.save();
    ctx.globalAlpha = alpha;

    switch (mod.type) {
      case 'wall': {
        drawWallBase(x, y, w, h);
        // subtle frame lines
        ctx.strokeStyle = 'rgba(201,168,76,0.12)';
        ctx.lineWidth = 0.4 / zoom;
        if (!v) {
          ctx.beginPath(); ctx.moveTo(x + w * 0.33, y); ctx.lineTo(x + w * 0.33, y + h); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + w * 0.66, y); ctx.lineTo(x + w * 0.66, y + h); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(x, y + h * 0.33); ctx.lineTo(x + w, y + h * 0.33); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, y + h * 0.66); ctx.lineTo(x + w, y + h * 0.66); ctx.stroke();
        }
        break;
      }
      case 'window': {
        drawWallBase(x, y, w, h);
        // window opening in center 40%
        const ow = !v ? w * 0.5 : w;
        const oh = !v ? h : h * 0.5;
        const ox = !v ? x + w * 0.25 : x;
        const oy = !v ? y : y + h * 0.25;
        ctx.fillStyle = 'rgba(201,168,76,0.15)';
        ctx.fillRect(ox, oy, ow, oh);
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 0.9 / zoom;
        ctx.strokeRect(ox, oy, ow, oh);
        // window cross
        if (!v) {
          ctx.beginPath(); ctx.moveTo(ox + ow / 2, oy); ctx.lineTo(ox + ow / 2, oy + oh); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(ox, oy + oh / 2); ctx.lineTo(ox + ow, oy + oh / 2); ctx.stroke();
        }
        break;
      }
      case 'door': {
        drawWallBase(x, y, w, h);
        // door gap (clear center 50%)
        const dw = !v ? w * 0.6 : w;
        const dh = !v ? h : h * 0.6;
        const dx = !v ? x + w * 0.2 : x;
        const dy = !v ? y : y + h * 0.2;
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(dx, dy, dw, dh);
        // door swing arc
        ctx.strokeStyle = COLORS.goldD;
        ctx.lineWidth = 0.8 / zoom;
        ctx.setLineDash([3 / zoom, 2 / zoom]);
        ctx.beginPath();
        if (!v) {
          ctx.arc(dx, y + h / 2, dw, -Math.PI / 2, 0);
        } else {
          ctx.arc(x + w / 2, dy, dh, Math.PI, Math.PI * 1.5);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // door leaf
        ctx.strokeStyle = COLORS.gold;
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        if (!v) {
          ctx.moveTo(dx, y + h / 2); ctx.lineTo(dx + dw, y + h / 2);
        } else {
          ctx.moveTo(x + w / 2, dy); ctx.lineTo(x + w / 2, dy + dh);
        }
        ctx.stroke();
        break;
      }
      case 'opening': {
        const ps = !v ? Math.min(w * 0.12, WALL_T) : WALL_T;
        const qs = !v ? WALL_T : Math.min(h * 0.12, WALL_T);
        ctx.fillStyle   = COLORS.wall;
        ctx.strokeStyle = COLORS.wallStroke;
        ctx.lineWidth   = 0.8 / zoom;
        if (!v) {
          ctx.fillRect(x, y, ps, h); ctx.strokeRect(x, y, ps, h);
          ctx.fillRect(x + w - ps, y, ps, h); ctx.strokeRect(x + w - ps, y, ps, h);
          // top beam
          ctx.fillStyle = 'rgba(201,168,76,0.2)';
          ctx.fillRect(x + ps, y, w - ps * 2, h * 0.3);
        } else {
          ctx.fillRect(x, y, w, qs); ctx.strokeRect(x, y, w, qs);
          ctx.fillRect(x, y + h - qs, w, qs); ctx.strokeRect(x, y + h - qs, w, qs);
          ctx.fillStyle = 'rgba(201,168,76,0.2)';
          ctx.fillRect(x, y + qs, w * 0.3, h - qs * 2);
        }
        // dashed center line
        ctx.strokeStyle = 'rgba(201,168,76,0.3)';
        ctx.lineWidth = 0.6 / zoom;
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        ctx.beginPath();
        if (!v) {
          ctx.moveTo(x + ps, y + h / 2); ctx.lineTo(x + w - ps, y + h / 2);
        } else {
          ctx.moveTo(x + w / 2, y + qs); ctx.lineTo(x + w / 2, y + h - qs);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      }
    }

    // Selection highlight
    if (sel) {
      ctx.strokeStyle = COLORS.select;
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(x - 3 / zoom, y - 3 / zoom, w + 6 / zoom, h + 6 / zoom);
      // Label
      ctx.fillStyle = COLORS.select;
      ctx.font = `${10 / zoom}px Helvetica`;
      ctx.fillText(MODULE_LABELS[mod.type], x, y - 5 / zoom);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawGhost() {
    if (!ghostPos || tool === 'select') return;
    const { gx, gy, valid } = ghostPos;
    const v = rotation === 90;
    const wx = gx * GRID - (v ? WALL_T / 2 : 0);
    const wy = gy * GRID - (v ? 0 : WALL_T / 2);
    const ww = v ? WALL_T : GRID;
    const wh = v ? GRID   : WALL_T;

    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle   = valid ? COLORS.ghost : COLORS.ghostErr;
    ctx.strokeStyle = valid ? COLORS.gold  : 'rgba(210,50,50,0.9)';
    ctx.lineWidth   = 1 / zoom;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeRect(wx, wy, ww, wh);
    ctx.restore();
  }

  // ── Main render loop ───────────────────────────────────────
  function render() {
    if (!canvas) return;
    const cw = canvas.clientWidth  || canvas.parentElement.clientWidth  || 800;
    const ch = canvas.clientHeight || canvas.parentElement.clientHeight || 600;
    canvas.width  = cw;
    canvas.height = ch;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, cw, ch);

    ctx.setTransform(zoom, 0, 0, zoom, panX, panY);

    drawGrid();
    AppState.modules.forEach(m => drawModule(m));
    drawGhost();

    // Empty state overlay
    if (AppState.modules.length === 0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px -apple-system, Segoe UI, Helvetica, Arial, sans-serif';
      ctx.fillStyle = 'rgba(77,163,255,0.5)';
      ctx.fillText('Aucun module posé', cw / 2, ch / 2 - 20);
      ctx.font = '12px -apple-system, Segoe UI, Helvetica, Arial, sans-serif';
      ctx.fillStyle = 'rgba(138,148,168,0.5)';
      ctx.fillText('Sélectionnez un outil dans la barre latérale et cliquez sur la grille', cw / 2, ch / 2 + 4);
      ctx.font = '11px -apple-system, Segoe UI, Helvetica, Arial, sans-serif';
      ctx.fillStyle = 'rgba(80,88,106,0.7)';
      ctx.fillText('Ou utilisez un gabarit de pièce pour démarrer rapidement', cw / 2, ch / 2 + 24);
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  // ── Event handlers ─────────────────────────────────────────
  function getEvtPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onMouseMove(e) {
    const { x: sx, y: sy } = getEvtPos(e);
    const { x: wx, y: wy } = screenToWorld(sx, sy);

    // Panning
    if (isPanning) {
      panX += sx - panStart.x;
      panY += sy - panStart.y;
      panStart = { x: sx, y: sy };
      return;
    }

    // Dragging selected module
    if (drag) {
      const newGx = Math.round((wx - drag.offsetWx) / GRID);
      const newGy = Math.round((wy - drag.offsetWy) / GRID);
      AppState.moveModule(drag.id, newGx, newGy);
      return;
    }

    // Ghost preview
    if (tool !== 'select') {
      const { gx, gy } = getGhostGrid(wx, wy);
      const valid = !AppState.hasConflict(gx, gy, rotation);
      ghostPos = { gx, gy, valid };
    } else {
      ghostPos = null;
    }
  }

  function onMouseDown(e) {
    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      isPanning = true;
      panStart  = getEvtPos(e);
      e.preventDefault();
      return;
    }
    if (e.button !== 0) return;

    const { x: sx, y: sy } = getEvtPos(e);
    const { x: wx, y: wy } = screenToWorld(sx, sy);

    if (tool === 'select') {
      const hit = hitTest(wx, wy);
      if (hit) {
        selectedId = hit.id;
        const r = worldRect(hit);
        drag = {
          id: hit.id,
          offsetWx: wx - hit.gx * GRID,
          offsetWy: wy - hit.gy * GRID,
        };
      } else {
        selectedId = null;
      }
      App.updateUI();
      return;
    }

    // Place module
    const { gx, gy } = getGhostGrid(wx, wy);
    if (!AppState.hasConflict(gx, gy, rotation)) {
      AppState.addModule({ type: tool, gx, gy, rot: rotation });
      App.updateUI();
    }
  }

  function onMouseUp(e) {
    isPanning = false;
    drag = null;
    panStart = null;
  }

  function onWheel(e) {
    e.preventDefault();
    const { x: sx, y: sy } = getEvtPos(e);
    const factor = e.deltaY > 0 ? 1 - ZOOM_STEP : 1 + ZOOM_STEP;
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom * factor));
    panX = sx - (sx - panX) * (newZoom / zoom);
    panY = sy - (sy - panY) * (newZoom / zoom);
    zoom = newZoom;
  }

  function onKeyDown(e) {
    if (e.code === 'Space') { spaceDown = true; e.preventDefault(); return; }
    if (e.code === 'Delete' || e.code === 'Backspace') {
      if (selectedId !== null) {
        AppState.removeModule(selectedId);
        selectedId = null;
        App.updateUI();
      }
    }
    if (e.code === 'KeyR') { setRotation(rotation === 0 ? 90 : 0); }
    if (e.code === 'Escape') { setTool('select'); }
    if (e.code === 'KeyV') { setTool('select'); }
    if (e.code === 'KeyW') { setTool('wall'); }
    if (e.code === 'KeyD') { setTool('door'); }
    if (e.code === 'KeyO') { setTool('opening'); }
  }

  function onKeyUp(e) {
    if (e.code === 'Space') spaceDown = false;
  }

  // ── Public API ─────────────────────────────────────────────
  function init(canvasEl) {
    canvas = canvasEl;
    ctx    = canvas.getContext('2d');

    canvas.addEventListener('mousemove',  onMouseMove);
    canvas.addEventListener('mousedown',  onMouseDown);
    canvas.addEventListener('mouseup',    onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('wheel',      onWheel, { passive: false });
    window.addEventListener('keydown',    onKeyDown);
    window.addEventListener('keyup',      onKeyUp);
    // Middle-click
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    render();
  }

  function setTool(t) {
    tool = t;
    ghostPos = null;
    if (t !== 'select') selectedId = null;
    App.syncToolbar();
  }

  function setRotation(r) {
    rotation = r;
    App.syncRotation();
  }

  function deleteSelected() {
    if (selectedId !== null) {
      AppState.removeModule(selectedId);
      selectedId = null;
      App.updateUI();
    }
  }

  function centerView() {
    const mods = AppState.modules;
    if (!mods.length) { panX = 200; panY = 160; zoom = 1; return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    mods.forEach(m => {
      const r = worldRect(m);
      minX = Math.min(minX, r.x); minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h);
    });
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const ww = maxX - minX + GRID, wh = maxY - minY + GRID;
    zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.min(cw / ww, ch / wh) * 0.85));
    panX = cw / 2 - ((minX + maxX) / 2) * zoom;
    panY = ch / 2 - ((minY + maxY) / 2) * zoom;
  }

  function loadTemplate(key) {
    const tpl = TEMPLATES[key];
    if (!tpl) return;
    // Offset to center-ish area
    const offGx = 4, offGy = 4;
    tpl.modules.forEach(m => {
      const gx = m.gx + offGx, gy = m.gy + offGy;
      if (!AppState.hasConflict(gx, gy, m.rot)) {
        AppState.addModule({ type: m.type, gx, gy, rot: m.rot });
      }
    });
    setTimeout(centerView, 50);
    App.updateUI();
  }

  function captureImage() {
    return canvas.toDataURL('image/png');
  }

  return { init, setTool, setRotation, deleteSelected, centerView, loadTemplate, captureImage,
           get tool() { return tool; }, get rotation() { return rotation; }, get selectedId() { return selectedId; } };
})();
