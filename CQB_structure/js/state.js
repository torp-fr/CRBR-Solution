'use strict';

const AppState = (() => {
  let _nextId = 1;
  let _modules = [];
  let _projectName = 'Nouveau Projet';
  let _settings = null; // initialised in init()

  const _handlers = {};

  function _emit(evt) {
    (_handlers[evt] || []).forEach(fn => fn());
    (_handlers['change'] || []).forEach(fn => fn());
  }

  function _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  return {
    init() {
      _settings = {
        materials:    _deepClone(DEFAULT_MATERIALS),
        compositions: _deepClone(DEFAULT_COMPOSITIONS),
        business:     { ...DEFAULT_BUSINESS },
      };
    },

    // ── Modules ────────────────────────────────────────────────
    get modules() { return _modules; },

    addModule(mod) {
      mod.id = _nextId++;
      _modules.push(mod);
      _emit('modules');
      return mod;
    },

    removeModule(id) {
      _modules = _modules.filter(m => m.id !== id);
      _emit('modules');
    },

    moveModule(id, gx, gy) {
      const m = _modules.find(m => m.id === id);
      if (m) { m.gx = gx; m.gy = gy; _emit('modules'); }
    },

    clearModules() {
      _modules = [];
      _emit('modules');
    },

    hasConflict(gx, gy, rot, excludeId = null) {
      return _modules.some(m =>
        m.id !== excludeId && m.gx === gx && m.gy === gy && m.rot === rot
      );
    },

    // ── Settings ───────────────────────────────────────────────
    get settings() { return _settings; },

    setMaterialPrice(key, price) {
      _settings.materials[key].price = +price;
      _emit('settings');
    },

    setComposition(type, key, qty) {
      _settings.compositions[type][key] = +qty;
      _emit('settings');
    },

    setBusiness(key, val) {
      _settings.business[key] = +val;
      _emit('settings');
    },

    // ── Project ────────────────────────────────────────────────
    get projectName() { return _projectName; },
    set projectName(v) { _projectName = v; },

    // ── Serialisation ──────────────────────────────────────────
    serialize() {
      return JSON.stringify({ name: _projectName, nextId: _nextId, modules: _modules, settings: _settings });
    },

    load(json) {
      const d = JSON.parse(json);
      _projectName = d.name || 'Projet';
      _nextId      = d.nextId || 1;
      _modules     = d.modules || [];
      _settings    = d.settings;
      _emit('modules');
      _emit('settings');
    },

    // ── Events ─────────────────────────────────────────────────
    on(evt, fn) {
      if (!_handlers[evt]) _handlers[evt] = [];
      _handlers[evt].push(fn);
    },
  };
})();
