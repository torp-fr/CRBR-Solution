'use strict';

const App = {
  currentTab: 'plan',

  init() {
    AppState.init();

    // 2D editor
    Editor2D.init(document.getElementById('canvas-2d'));

    // Project name
    const nameEl = document.getElementById('project-name');
    nameEl.addEventListener('input', () => { AppState.projectName = nameEl.value; });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Toolbar — tools
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => Editor2D.setTool(btn.dataset.tool));
    });

    // Toolbar — rotation
    document.querySelectorAll('.rot-btn').forEach(btn => {
      btn.addEventListener('click', () => Editor2D.setRotation(+btn.dataset.rot));
    });

    // Delete / clear / center
    document.getElementById('btn-delete').addEventListener('click', () => Editor2D.deleteSelected());
    document.getElementById('btn-clear').addEventListener('click', () => {
      if (confirm('Effacer tous les modules ?')) { AppState.clearModules(); this.updateUI(); }
    });
    document.getElementById('btn-center').addEventListener('click', () => Editor2D.centerView());

    // Templates
    document.querySelectorAll('[data-template]').forEach(btn => {
      btn.addEventListener('click', () => Editor2D.loadTemplate(btn.dataset.template));
    });

    // Save / load
    document.getElementById('btn-save-json').addEventListener('click', () => Export.saveJSON());
    document.getElementById('btn-load-json').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });
    document.getElementById('file-input').addEventListener('change', e => {
      if (e.target.files[0]) Export.loadJSON(e.target.files[0]);
      e.target.value = '';
    });

    // PDF export
    document.getElementById('btn-export-pdf').addEventListener('click', () => Export.exportPDF());

    // 3D camera presets
    document.getElementById('btn-3d-iso').addEventListener('click',   () => Renderer3D.setCameraPreset('iso'));
    document.getElementById('btn-3d-top').addEventListener('click',   () => Renderer3D.setCameraPreset('top'));
    document.getElementById('btn-3d-front').addEventListener('click', () => Renderer3D.setCameraPreset('front'));

    // State listeners
    AppState.on('modules',  () => this.updateUI());
    AppState.on('settings', () => this.updateUI());

    this.updateUI();
    this.syncToolbar();
    this.syncRotation();
    this.updateStatusBar();
  },

  switchTab(tab) {
    this.currentTab = tab;

    // Activate tab button
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab));

    // Activate tab panel
    document.querySelectorAll('.tab-panel').forEach(p =>
      p.classList.toggle('active', p.id === 'tab-' + tab));

    // Show / hide sidebar and right panel
    const sidebar    = document.getElementById('left-sidebar');
    const rightPanel = document.getElementById('right-panel');
    const showSidebar = tab === 'plan';
    const showRight   = tab === 'plan' || tab === '3d';

    if (sidebar)    sidebar.classList.toggle('sidebar-hidden', !showSidebar);
    if (rightPanel) rightPanel.classList.toggle('panel-hidden', !showRight);

    // Tab-specific init
    if (tab === '3d') {
      Renderer3D.init(document.getElementById('canvas-3d'));
      Renderer3D.refresh();
    }
    if (tab === 'settings') UI.renderSettings();
    if (tab === 'devis')    UI.renderDevis();
  },

  updateUI() {
    UI.renderRightPanel();
    UI.renderModuleCounts();
    UI.renderDevis();
    if (this.currentTab === 'settings') UI.renderSettings();
  },

  syncToolbar() {
    const t = Editor2D.tool;
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.tool === t));

    const deleteable = Editor2D.selectedId !== null;
    document.getElementById('btn-delete').disabled = !deleteable;
    this.updateStatusBar();
  },

  syncRotation() {
    const r = Editor2D.rotation;
    document.querySelectorAll('.rot-btn').forEach(btn =>
      btn.classList.toggle('active', +btn.dataset.rot === r));
    this.updateStatusBar();
  },

  updateStatusBar() {
    const toolEl   = document.getElementById('status-tool');
    const rotEl    = document.getElementById('status-rot');
    const hintEl   = document.getElementById('status-hint');
    const sepRot   = document.getElementById('st-sep-rot');
    if (!toolEl) return;

    const t = Editor2D.tool;
    const r = Editor2D.rotation;

    const toolNames = {
      select:  'Sélection',
      wall:    'Mur plein',
      window:  'Mur fenêtre',
      door:    'Module porte',
      opening: 'Passage libre',
    };
    const hints = {
      select:  'Cliquer pour sélectionner · Glisser pour déplacer · Suppr pour supprimer',
      wall:    'Cliquer sur la grille pour placer · R pour changer l\'orientation',
      window:  'Cliquer sur la grille pour placer · R pour changer l\'orientation',
      door:    'Cliquer sur la grille pour placer · R pour changer l\'orientation',
      opening: 'Cliquer sur la grille pour placer · R pour changer l\'orientation',
    };

    toolEl.textContent = toolNames[t] || t;

    const isPlacing = t !== 'select';
    if (rotEl) {
      rotEl.textContent  = isPlacing ? (r === 0 ? '— Horizontal' : '| Vertical') : '';
      rotEl.style.display   = isPlacing ? '' : 'none';
    }
    if (sepRot) sepRot.style.display = isPlacing ? '' : 'none';
    if (hintEl) hintEl.textContent = hints[t] || '';
  },
};

window.addEventListener('DOMContentLoaded', () => App.init());
