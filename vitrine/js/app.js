/* ============================================================
   DST-SYSTEM — Application principale
   Routeur SPA, navigation, gestion du header et des alertes
   ============================================================ */

const App = (() => {
  'use strict';

  /* --- État interne --- */
  let currentView = 'dashboard';
  let alertsPanelOpen = false;

  /* --- Routes disponibles --- */
  const routes = {
    dashboard:  { label: 'Dashboard dirigeant', icon: '⬡',    view: () => Views.Dashboard },
    pipeline:   { label: 'Pipeline CRM',        icon: '🔀',   view: () => Views.Pipeline },
    prospects:  { label: 'Prospects',           icon: '🎯',   view: () => Views.Prospects },
    devis:      { label: 'Devis',               icon: '📄',   view: () => Views.Devis },
    factures:   { label: 'Factures',            icon: '🧾',   view: () => Views.Factures },
    clients:    { label: 'Clients',             icon: '👥',   view: () => Views.Clients },
    offers:     { label: 'Offres / Abonnements',icon: '📋',   view: () => Views.Offers },
    sessions:   { label: 'Planning',            icon: '📅',   view: () => Views.Sessions },
    operators:  { label: 'Opérateurs',          icon: '🧑‍💼', view: () => Views.Operators },
    modules:    { label: 'Modules',             icon: '🎓',   view: () => Views.Modules },
    locations:  { label: 'Lieux',               icon: '📍',   view: () => Views.Locations },
    regions:      { label: 'Régions',             icon: '🗺',   view: () => Views.Regions },
    simulateurs:  { label: 'Simulateurs',         icon: '📡',   view: () => Views.Simulateurs },
    settings:     { label: 'Paramètres',          icon: '⚙️',   view: () => Views.Settings },
    analytics:    { label: 'Analytics',           icon: '📊',   view: () => Views.Analytics },
    deplacements: { label: 'Coût des déplacements', icon: '🚗', view: () => Views.Deplacements }
  };

  /* --- Gestion du thème (light / dark) --- */
  function _initTheme() {
    var saved = localStorage.getItem('dst_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    _updateThemeToggle(saved);
  }

  function _updateThemeToggle(theme) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.textContent = theme === 'dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
    btn.title = theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre';
  }

  function _toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dst_theme', next);
    _updateThemeToggle(next);
  }

  /* --- Initialisation des données par défaut --- */
  function _initDefaultData() {
    // Région Nationale (Phase 1) si aucune région n'existe
    if (DB.regions.getAll().length === 0) {
      DB.regions.create({
        nom:          'Nationale',
        code:         'NAT',
        statut:       'nationale',
        departements: [],
        operateurIds: [],
        simulateurIds: [],
        notes:        'Zone par défaut — Phase 1 : déploiement national centralisé.',
        dateCreation: new Date().toISOString().slice(0, 10)
      });
    }

    // Simulateur SIM-001 si aucun simulateur n'existe
    if (DB.simulateurs.getAll().length === 0) {
      const regionId = DB.regions.getAll().length > 0 ? DB.regions.getAll()[0].id : null;
      DB.simulateurs.create({
        nom:                     'SIM-001',
        modele:                  '',
        numeroSerie:             '',
        etat:                    'actif',
        regionId,
        joursMaxParAn:           150,
        dateAcquisition:         null,
        prixAcquisitionHT:       0,
        derniereMaintenance:     null,
        periodeMaintenanceJours: 180,
        prochaineMaintenance:    null,
        notes:                   'Simulateur principal — créé automatiquement au premier démarrage.'
      });
    }
  }

  /* --- Initialisation --- */
  function init() {
    _initTheme();
    _initDefaultData();
    renderSidebar();
    _applyEntrepriseGlobale();
    renderHeader();

    // Écouter le hash pour navigation
    window.addEventListener('hashchange', onHashChange);

    // Navigation initiale
    const hash = window.location.hash.replace('#', '');
    if (hash && routes[hash]) {
      navigate(hash);
    } else {
      navigate('dashboard');
    }
  }

  /* --- Navigation --- */
  function navigate(viewName) {
    if (!routes[viewName]) return;
    currentView = viewName;
    window.location.hash = viewName;

    // Mettre à jour la sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Mettre à jour le titre du header
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
      headerTitle.textContent = routes[viewName].label;
    }

    // Rafraîchir les alertes dans le header
    updateAlertsBadge();

    // Rendre la vue
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = '<div class="text-center text-muted" style="padding:48px">Chargement...</div>';
      try {
        const viewModule = routes[viewName].view();
        if (viewModule && typeof viewModule.render === 'function') {
          viewModule.render(content);
        } else {
          content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠</div><p>Module "${viewName}" non disponible</p></div>`;
        }
      } catch (e) {
        console.error(`Erreur rendu vue ${viewName}:`, e);
        content.innerHTML = `<div class="alert alert-danger"><span class="alert-icon">⚠</span> Erreur lors du chargement : ${e.message}</div>`;
      }
    }

    // Fermer le panneau d'alertes si ouvert
    closeAlertsPanel();
  }

  function onHashChange() {
    const hash = window.location.hash.replace('#', '');
    if (hash && routes[hash] && hash !== currentView) {
      navigate(hash);
    }
  }

  /* --- Sidebar --- */
  function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const navSections = [
      { title: 'Pilotage',       items: ['dashboard', 'analytics'] },
      { title: 'CRM',            items: ['pipeline', 'devis', 'factures'] },
      { title: 'Opérationnel',   items: ['sessions', 'offers'] },
      { title: 'Équipe',         items: ['operators', 'regions', 'simulateurs'] },
      { title: 'Configuration',  items: ['settings'] }
    ];

    let html = `
      <div class="sidebar-brand" id="sidebar-brand">
        <div id="sidebar-logo-container" style="display:flex;align-items:center;gap:10px;padding:4px 0;">
        </div>
      </div>
      <nav class="sidebar-nav">
    `;

    navSections.forEach(section => {
      html += `<div class="nav-section">${section.title}</div>`;
      section.items.forEach(key => {
        const route = routes[key];
        html += `
          <div class="nav-item" data-view="${key}">
            <span class="nav-icon">${route.icon}</span>
            <span>${route.label}</span>
          </div>
        `;
      });
    });

    html += `</nav>
      <div class="sidebar-footer">
        DST System &copy; ${new Date().getFullYear()}<br>
        <span class="text-muted">Outil de pilotage interne</span>
      </div>
    `;

    sidebar.innerHTML = html;

    // Attacher les événements de navigation
    sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        navigate(item.dataset.view);
      });
    });
  }

  /* --- Sidebar brand dynamique (logo texte ou nom entreprise) --- */
  function _initSidebarBrand() {
    const ent = (DB.settings.get().entreprise) || {};
    const container = document.getElementById('sidebar-logo-container');
    if (!container) return;

    if (ent.logoTexteBase64) {
      // Priorité 1 : logo texte uploadé
      container.innerHTML =
        '<img src="' + ent.logoTexteBase64 +
        '" style="max-height:40px;max-width:160px;object-fit:contain;">';
    } else {
      // Priorité 2 : logo statique + fallback texte
      var fallbackDiv =
        '<div style="display:none;flex-direction:column;">' +
          '<span style="font-size:14px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-primary);line-height:1.1;">' +
            (ent.nom || 'DST SYSTEM') +
          '</span>' +
          '<span style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-top:2px;">DRILL &amp; SKILLS TRAINING</span>' +
        '</div>';
      container.innerHTML =
        '<img src="../img/DST-Light.png"' +
        ' onerror="this.style.display=\'none\';this.nextSibling.style.display=\'flex\';"' +
        ' style="max-height:40px;max-width:160px;object-fit:contain;">' +
        fallbackDiv;
    }
  }
  window._initSidebarBrand = _initSidebarBrand;

  /* --- Application globale des paramètres entreprise --- */
  function _applyEntrepriseGlobale() {
    const ent = (DB.settings.get().entreprise) || {};

    // 1. Sidebar (logo texte ou nom)
    _initSidebarBrand();

    // 2. Favicon dynamique
    if (ent.faviconBase64) {
      var link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = ent.faviconBase64;
      link.type = ent.faviconMime || 'image/png';
    }

    // 3. Titre de la page
    if (ent.nom) {
      document.title = ent.nom + ' \u2014 Administration';
    }
  }
  window._applyEntrepriseGlobale = _applyEntrepriseGlobale;

  /* --- Header --- */
  function renderHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    header.innerHTML = `
      <div class="header-title" id="header-title">Dashboard dirigeant</div>
      <div class="header-alerts">
        <span class="header-context" id="header-context"></span>
        <button id="theme-toggle"
          title="Passer en mode clair"
          style="background:none;border:none;cursor:pointer;padding:6px 8px;border-radius:4px;font-size:16px;color:var(--text-muted);">
          🌙
        </button>
        <button class="header-alert-btn" id="alerts-toggle" title="Alertes stratégiques">
          ⚠ Alertes
          <span class="badge hidden" id="alerts-badge">0</span>
        </button>
      </div>
    `;

    // Panneau d'alertes
    const panel = document.createElement('div');
    panel.className = 'alerts-panel';
    panel.id = 'alerts-panel';
    document.body.appendChild(panel);

    // Toggle thème
    document.getElementById('theme-toggle').addEventListener('click', _toggleTheme);
    _updateThemeToggle(localStorage.getItem('dst_theme') || 'dark');

    // Toggle alertes
    document.getElementById('alerts-toggle').addEventListener('click', toggleAlertsPanel);

    // Fermer en cliquant ailleurs
    document.addEventListener('click', (e) => {
      if (alertsPanelOpen &&
          !e.target.closest('#alerts-panel') &&
          !e.target.closest('#alerts-toggle')) {
        closeAlertsPanel();
      }
    });

    updateHeaderContext();
    updateAlertsBadge();
  }

  function updateHeaderContext() {
    const ctx = document.getElementById('header-context');
    if (!ctx) return;
    const now = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    ctx.textContent = now.toLocaleDateString('fr-FR', opts);
  }

  /* --- Alertes --- */
  function updateAlertsBadge() {
    try {
      const alerts = Engine.computeAllAlerts();
      const badge = document.getElementById('alerts-badge');
      if (badge) {
        badge.textContent = alerts.length;
        badge.classList.toggle('hidden', alerts.length === 0);
      }
    } catch (e) {
      // Silencieux si le moteur n'est pas prêt
    }
  }

  function toggleAlertsPanel() {
    alertsPanelOpen = !alertsPanelOpen;
    const panel = document.getElementById('alerts-panel');
    if (panel) {
      panel.classList.toggle('open', alertsPanelOpen);
      if (alertsPanelOpen) {
        renderAlertsPanel();
      }
    }
  }

  function closeAlertsPanel() {
    alertsPanelOpen = false;
    const panel = document.getElementById('alerts-panel');
    if (panel) panel.classList.remove('open');
  }

  function renderAlertsPanel() {
    const panel = document.getElementById('alerts-panel');
    if (!panel) return;

    try {
      const alerts = Engine.computeAllAlerts();

      if (alerts.length === 0) {
        panel.innerHTML = `
          <div class="alert-item" style="justify-content:center; color: var(--color-success);">
            ✓ Aucune alerte active
          </div>
        `;
        return;
      }

      let html = '';
      alerts.forEach(alert => {
        const levelClass = alert.level === 'critical' ? 'level-critical' :
                           alert.level === 'warning' ? 'level-warning' : 'level-info';
        const icon = alert.level === 'critical' ? '⚠' :
                     alert.level === 'warning' ? '⚡' : 'ℹ';
        html += `
          <div class="alert-item ${levelClass}">
            <span>${icon}</span>
            <div>
              <div class="alert-type">${alert.context || alert.level}</div>
              <div>${alert.message}</div>
            </div>
          </div>
        `;
      });

      panel.innerHTML = html;
    } catch (e) {
      panel.innerHTML = `<div class="alert-item">Erreur chargement alertes</div>`;
    }
  }

  /* --- Utilitaire : rafraîchir la vue courante --- */
  function refresh() {
    navigate(currentView);
  }

  /* --- API publique --- */
  return {
    init,
    navigate,
    refresh,
    toggleTheme: _toggleTheme,
    get currentView() { return currentView; }
  };
})();

/* ============================================================
   AMÉLIORATION P6 — Système de toasts (notifications)
   ============================================================ */
const Toast = (() => {
  'use strict';

  let container = null;

  function ensureContainer() {
    if (!container || !document.body.contains(container)) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type, duration) {
    type = type || 'info';
    duration = duration || 3500;
    const c = ensureContainer();
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span class="toast-icon">' + iconForType(type) + '</span><span class="toast-msg">' + escapeHTML(message) + '</span>';
    c.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    setTimeout(() => {
      toast.classList.remove('toast-visible');
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }

  function iconForType(type) {
    switch(type) {
      case 'success': return '\u2713';
      case 'error':   return '\u2717';
      case 'warning': return '\u26A0';
      default:        return '\u2139';
    }
  }

  function escapeHTML(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { show };
})();

/* ============================================================
   AMÉLIORATION P6 — Confirmation suppression renforcée
   ============================================================ */
function confirmDelete(entityName) {
  return confirm('Confirmer la suppression de "' + entityName + '" ?\nCette action est irréversible.');
}

/* ============================================================
   PARCOURS GUIDÉ — Wizard multi-étapes
   Client → Offre → Session → Suivi
   ============================================================ */
window.DST_Wizard = function() {
  'use strict';

  var currentStep = 0;
  var wizardData = {
    clientId: null,
    offerId: null,
    sessionId: null
  };

  function esc(str) {
    if (str == null) return '';
    var d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function renderWizard() {
    // Remove previous wizard
    var prev = document.getElementById('wizard-overlay');
    if (prev) prev.remove();

    var overlay = document.createElement('div');
    overlay.id = 'wizard-overlay';
    overlay.className = 'modal-overlay wizard-overlay';

    var steps = [
      { label: 'Client', icon: '&#128100;' },
      { label: 'Offre', icon: '&#128230;' },
      { label: 'Session', icon: '&#128197;' },
      { label: 'Terminé', icon: '&#10003;' }
    ];

    var stepsHtml = '<div class="wizard-steps">';
    steps.forEach(function(s, i) {
      var cls = i < currentStep ? 'wizard-step completed' : i === currentStep ? 'wizard-step active' : 'wizard-step';
      stepsHtml += '<div class="' + cls + '"><span class="wizard-step-num">' + (i + 1) + '</span><span class="wizard-step-label">' + s.label + '</span></div>';
      if (i < steps.length - 1) stepsHtml += '<div class="wizard-step-line ' + (i < currentStep ? 'completed' : '') + '"></div>';
    });
    stepsHtml += '</div>';

    var bodyHtml = '';
    if (currentStep === 0) bodyHtml = renderStep0();
    else if (currentStep === 1) bodyHtml = renderStep1();
    else if (currentStep === 2) bodyHtml = renderStep2();
    else bodyHtml = renderStep3();

    overlay.innerHTML = '<div class="modal modal-lg wizard-modal">'
      + '<div class="modal-header"><h2>Parcours guidé</h2><button class="btn btn-sm btn-ghost" id="wizard-close">&times;</button></div>'
      + '<div class="modal-body">' + stepsHtml + '<div class="wizard-body">' + bodyHtml + '</div></div>'
      + '<div class="modal-footer">'
      + (currentStep > 0 ? '<button class="btn" id="wizard-prev">Retour</button>' : '')
      + '<button class="btn" id="wizard-cancel">Annuler</button>'
      + (currentStep < 3 ? '<button class="btn btn-primary" id="wizard-next">' + (currentStep === 2 ? 'Créer la session' : 'Suivant') + '</button>' : '<button class="btn btn-primary" id="wizard-finish">Fermer</button>')
      + '</div></div>';

    document.body.appendChild(overlay);
    attachWizardEvents(overlay);
  }

  /* Step 0: Sélectionner ou créer un client */
  function renderStep0() {
    var clients = DB.clients.getAll().filter(function(c) { return c.active !== false; });
    var html = '<h3 style="margin-bottom:12px;">Sélectionner ou créer un client</h3>';

    if (clients.length > 0) {
      html += '<div class="form-group"><label>Client existant</label><select id="wiz-client" class="form-control"><option value="">— Nouveau client —</option>';
      clients.forEach(function(c) {
        var sel = wizardData.clientId === c.id ? 'selected' : '';
        html += '<option value="' + c.id + '" ' + sel + '>' + esc(c.name || c.company || c.id) + ' (' + (c.clientCategory || 'B2B') + ')</option>';
      });
      html += '</select></div>';
    }

    html += '<div id="wiz-new-client"' + (wizardData.clientId ? ' style="display:none;"' : '') + '>';
    html += '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="wiz-client-name" class="form-control" placeholder="Nom du client" /></div>';
    html += '<div class="form-group"><label>Type</label><select id="wiz-client-type" class="form-control"><option value="entreprise">Entreprise</option><option value="administration">Administration</option><option value="association">Association</option><option value="particulier">Particulier</option></select></div></div>';
    html += '<div class="form-group"><label>Catégorie</label><div class="flex gap-16" style="margin-top:4px;"><label class="form-check"><input type="radio" name="wiz-category" value="B2B" checked /><span>B2B (HT)</span></label><label class="form-check"><input type="radio" name="wiz-category" value="B2C" /><span>B2C (TTC)</span></label></div></div>';
    html += '<div class="form-row"><div class="form-group"><label>Email</label><input type="email" id="wiz-client-email" class="form-control" /></div>';
    html += '<div class="form-group"><label>Téléphone</label><input type="tel" id="wiz-client-phone" class="form-control" /></div></div>';
    html += '</div>';

    return html;
  }

  /* Step 1: Créer une offre pour le client */
  function renderStep1() {
    var clientName = '';
    if (wizardData.clientId) {
      var c = DB.clients.getById(wizardData.clientId);
      clientName = c ? (c.name || c.company) : '';
    }

    var modules = DB.modules.getAll();
    var html = '<h3 style="margin-bottom:12px;">Définir l\'offre pour ' + esc(clientName) + '</h3>';

    html += '<div class="form-row"><div class="form-group"><label>Libellé *</label><input type="text" id="wiz-offer-label" class="form-control" placeholder="Ex : Formation Initiale Q1" /></div>';
    html += '<div class="form-group"><label>Type d\'offre</label><select id="wiz-offer-type" class="form-control"><option value="one_shot">Session unique</option><option value="abonnement">Abonnement</option><option value="personnalisee">Personnalisée</option></select></div></div>';
    html += '<div class="form-row"><div class="form-group"><label>Prix HT (€)</label><input type="number" id="wiz-offer-price" class="form-control" min="0" step="any" placeholder="0" /></div>';
    html += '<div class="form-group" id="wiz-abo-sessions" style="display:none;"><label>Nombre de sessions</label><input type="number" id="wiz-offer-nb" class="form-control" min="1" step="any" value="1" /></div></div>';

    if (modules.length > 0) {
      html += '<div class="form-group"><label>Modules inclus</label><div style="max-height:120px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px;">';
      modules.forEach(function(m) {
        html += '<label class="form-check" style="margin-bottom:4px;"><input type="checkbox" name="wiz-modules" value="' + m.id + '" /><span>' + esc(m.name) + '</span></label>';
      });
      html += '</div></div>';
    }

    return html;
  }

  /* Step 2: Planifier la session */
  function renderStep2() {
    var operators = DB.operators.getAll().filter(function(o) { return o.active !== false; });
    var locations = DB.locations.getAll();

    var html = '<h3 style="margin-bottom:12px;">Planifier la session de formation</h3>';
    html += '<div class="form-row"><div class="form-group"><label>Libellé de la session</label><input type="text" id="wiz-sess-label" class="form-control" placeholder="Ex : Session initiale" /></div>';
    html += '<div class="form-group"><label>Date *</label><input type="date" id="wiz-sess-date" class="form-control" /></div>';
    html += '<div class="form-group"><label>Heure</label><input type="time" id="wiz-sess-time" class="form-control" /></div></div>';

    if (locations.length > 0) {
      html += '<div class="form-group"><label>Lieu</label><select id="wiz-sess-location" class="form-control"><option value="">— Aucun —</option>';
      locations.forEach(function(l) { html += '<option value="' + l.id + '">' + esc(l.name) + '</option>'; });
      html += '</select></div>';
    }

    if (operators.length > 0) {
      html += '<div class="form-group"><label>Opérateurs</label><div style="max-height:120px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px;">';
      operators.forEach(function(o) {
        html += '<label class="form-check" style="margin-bottom:4px;"><input type="checkbox" name="wiz-operators" value="' + o.id + '" /><span>' + esc((o.firstName || '') + ' ' + (o.lastName || '')) + ' (' + Engine.statusLabel(o.status) + ')</span></label>';
      });
      html += '</div></div>';
    }

    return html;
  }

  /* Step 3: Récapitulatif */
  function renderStep3() {
    var html = '<div class="text-center" style="padding:24px;">';
    html += '<div style="font-size:3rem;margin-bottom:12px;">&#10003;</div>';
    html += '<h3>Parcours terminé !</h3>';
    html += '<p class="text-muted" style="margin-top:8px;">Le client, l\'offre et la session ont été créés avec succès.</p>';

    if (wizardData.clientId) {
      var c = DB.clients.getById(wizardData.clientId);
      html += '<p style="margin-top:12px;"><strong>Client :</strong> ' + esc(c ? c.name : '—') + '</p>';
    }
    if (wizardData.offerId) {
      var o = DB.offers.getById(wizardData.offerId);
      html += '<p><strong>Offre :</strong> ' + esc(o ? o.label : '—') + ' — ' + Engine.fmt(o ? o.price : 0) + ' HT</p>';
    }
    if (wizardData.sessionId) {
      var s = DB.sessions.getById(wizardData.sessionId);
      html += '<p><strong>Session :</strong> ' + esc(s ? s.label : '—') + ' le ' + (s ? s.date : '—') + '</p>';
    }

    html += '<div style="margin-top:20px;" class="flex gap-8" style="justify-content:center;">';
    html += '<button class="btn" onclick="App.navigate(\'clients\');">Voir les clients</button>';
    html += '<button class="btn" onclick="App.navigate(\'sessions\');">Voir le planning</button>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function attachWizardEvents(overlay) {
    overlay.querySelector('#wizard-close').addEventListener('click', function() { overlay.remove(); });
    overlay.querySelector('#wizard-cancel').addEventListener('click', function() { overlay.remove(); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

    var prevBtn = overlay.querySelector('#wizard-prev');
    if (prevBtn) prevBtn.addEventListener('click', function() { currentStep--; renderWizard(); });

    var nextBtn = overlay.querySelector('#wizard-next');
    if (nextBtn) nextBtn.addEventListener('click', function() { processStep(overlay); });

    var finishBtn = overlay.querySelector('#wizard-finish');
    if (finishBtn) finishBtn.addEventListener('click', function() { overlay.remove(); App.navigate('dashboard'); });

    // Step 0: toggle new client form
    var clientSel = overlay.querySelector('#wiz-client');
    if (clientSel) {
      clientSel.addEventListener('change', function() {
        var newClientDiv = overlay.querySelector('#wiz-new-client');
        if (newClientDiv) newClientDiv.style.display = clientSel.value ? 'none' : '';
      });
    }

    // Step 1: toggle abo fields
    var offerType = overlay.querySelector('#wiz-offer-type');
    if (offerType) {
      offerType.addEventListener('change', function() {
        var aboDiv = overlay.querySelector('#wiz-abo-sessions');
        if (aboDiv) aboDiv.style.display = offerType.value === 'abonnement' ? '' : 'none';
      });
    }
  }

  function processStep(overlay) {
    if (currentStep === 0) {
      // Create or select client
      var clientSel = overlay.querySelector('#wiz-client');
      if (clientSel && clientSel.value) {
        wizardData.clientId = clientSel.value;
      } else {
        var name = (overlay.querySelector('#wiz-client-name') || {}).value;
        if (!name || !name.trim()) { Toast.show('Le nom du client est obligatoire.', 'error'); return; }
        var cat = (overlay.querySelector('input[name="wiz-category"]:checked') || {}).value || 'B2B';
        var type = (overlay.querySelector('#wiz-client-type') || {}).value || 'entreprise';
        var newClient = DB.clients.create({
          name: name.trim(),
          type: type,
          clientCategory: cat,
          contactEmail: (overlay.querySelector('#wiz-client-email') || {}).value || '',
          contactPhone: (overlay.querySelector('#wiz-client-phone') || {}).value || '',
          active: true
        });
        wizardData.clientId = newClient.id;
        Toast.show('Client « ' + name.trim() + ' » créé.', 'success');
      }
      currentStep++;
      renderWizard();
    } else if (currentStep === 1) {
      // Create offer
      var label = (overlay.querySelector('#wiz-offer-label') || {}).value;
      if (!label || !label.trim()) { Toast.show('Le libellé de l\'offre est obligatoire.', 'error'); return; }
      var offerType = (overlay.querySelector('#wiz-offer-type') || {}).value || 'one_shot';
      var price = parseFloat((overlay.querySelector('#wiz-offer-price') || {}).value) || 0;
      var nbSessions = offerType === 'abonnement' ? (parseInt((overlay.querySelector('#wiz-offer-nb') || {}).value) || 1) : 0;
      var moduleIds = [];
      overlay.querySelectorAll('input[name="wiz-modules"]:checked').forEach(function(cb) { moduleIds.push(cb.value); });

      var newOffer = DB.offers.create({
        label: label.trim(),
        type: offerType,
        price: price,
        nbSessions: nbSessions,
        clientIds: [wizardData.clientId],
        moduleIds: moduleIds,
        active: true
      });
      wizardData.offerId = newOffer.id;
      Toast.show('Offre « ' + label.trim() + ' » créée.', 'success');
      currentStep++;
      renderWizard();
    } else if (currentStep === 2) {
      // Create session
      var sessDate = (overlay.querySelector('#wiz-sess-date') || {}).value;
      if (!sessDate) { Toast.show('La date de session est obligatoire.', 'error'); return; }
      var sessLabel = (overlay.querySelector('#wiz-sess-label') || {}).value || 'Session';
      var sessTime = (overlay.querySelector('#wiz-sess-time') || {}).value || '';
      var locationId = (overlay.querySelector('#wiz-sess-location') || {}).value || '';
      var operatorIds = [];
      overlay.querySelectorAll('input[name="wiz-operators"]:checked').forEach(function(cb) { operatorIds.push(cb.value); });

      // Récupérer les modules de l'offre
      var offer = wizardData.offerId ? DB.offers.getById(wizardData.offerId) : null;
      var moduleIds2 = offer ? (offer.moduleIds || []) : [];
      var price2 = offer ? (offer.price || 0) : 0;

      var newSession = DB.sessions.create({
        label: sessLabel.trim(),
        date: sessDate,
        time: sessTime,
        clientIds: [wizardData.clientId],
        moduleIds: moduleIds2,
        operatorIds: operatorIds,
        locationId: locationId,
        offerId: wizardData.offerId || '',
        price: price2,
        status: 'planifiee',
        variableCosts: []
      });
      wizardData.sessionId = newSession.id;
      Toast.show('Session planifiée avec succès.', 'success');
      currentStep++;
      renderWizard();
    }
  }

  renderWizard();
};

/* --- Démarrage --- */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
