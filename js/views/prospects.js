/* ============================================================
   DST-SYSTEM — Vue Prospects / CRM
   Gestion des contacts entrants : CRUD, statuts, conversion client.
   ============================================================ */

window.Views = window.Views || {};

Views.Prospects = (() => {
  'use strict';

  /* ----------------------------------------------------------
     CONSTANTES
     ---------------------------------------------------------- */

  const STATUTS = [
    { value: 'nouveau',     label: 'Nouveau',     tag: 'tag-blue'    },
    { value: 'contacte',    label: 'Contact\u00e9',    tag: 'tag-yellow'  },
    { value: 'negociation', label: 'N\u00e9gociation', tag: 'tag-purple'  },
    { value: 'converti',    label: 'Converti',    tag: 'tag-green'   },
    { value: 'perdu',       label: 'Perdu',       tag: 'tag-neutral' }
  ];

  const SOURCES = [
    { value: 'formulaire_web', label: 'Formulaire web' },
    { value: 'manuel',         label: 'Manuel' },
    { value: 'salon',          label: 'Salon' },
    { value: 'referral',       label: 'R\u00e9f\u00e9rence' }
  ];

  const TYPES_STRUCTURE = [
    'Police municipale', 'Police nationale', 'Gendarmerie',
    'Administration p\u00e9nitentiaire', 'Douanes',
    'Convoyeurs de fonds', 'S\u00e9curit\u00e9 priv\u00e9e arm\u00e9e', 'Autre'
  ];

  const EFFECTIFS = ['Moins de 10', '10 \u00e0 25', '25 \u00e0 50', '50 \u00e0 100', 'Plus de 100'];
  const NB_SITES  = ['1 site', '2 \u00e0 3 sites', '4 \u00e0 6 sites', '7 sites ou plus'];
  const BESOINS   = ["Demande d\u2019info", '\u00c9tude de faisabilit\u00e9', 'Projet de d\u00e9ploiement', 'Demande de devis'];
  const FORMULES  = ['Pr\u00e9sentation dispositif', 'Initier d\u00e9ploiement', '\u00c9valuer d\u00e9ploiement', 'Demander devis', '\u00c9change pr\u00e9alable'];

  /* ----------------------------------------------------------
     ETAT LOCAL
     ---------------------------------------------------------- */

  let _container    = null;
  let _searchTerm   = '';
  let _filterStatus = '';

  /* ----------------------------------------------------------
     POINT D'ENTREE
     ---------------------------------------------------------- */

  function render(container) {
    _container    = container;
    _searchTerm   = '';
    _filterStatus = '';
    _renderPage();
  }

  /* ----------------------------------------------------------
     RENDU PRINCIPAL
     ---------------------------------------------------------- */

  function _renderPage() {
    const all      = DB.prospects.getAll();
    const filtered = _applyFilters(all);

    const counts = {};
    STATUTS.forEach(s => { counts[s.value] = 0; });
    all.forEach(p => { if (counts[p.statut] !== undefined) counts[p.statut]++; });
    const actifs   = all.filter(p => p.statut !== 'converti' && p.statut !== 'perdu').length;
    const nouveaux = counts['nouveau'] || 0;

    /* Pills statut */
    let pillsHTML = '';
    STATUTS.forEach(s => {
      const active = _filterStatus === s.value;
      pillsHTML += '<span class="tag ' + s.tag + '" data-pill="' + s.value + '" style="cursor:pointer;margin-right:4px;' + (active ? 'font-weight:700;outline:2px solid currentColor;outline-offset:2px;' : 'opacity:0.6;') + '">' + _esc(s.label) + ' <strong>' + counts[s.value] + '</strong></span>';
    });
    if (_filterStatus) {
      pillsHTML += '<span class="tag tag-neutral" id="pill-reset" style="cursor:pointer;margin-left:4px;">\u00d7 Tout afficher</span>';
    }

    /* Tableau / vide */
    let bodyHTML;
    if (filtered.length > 0) {
      bodyHTML = _renderTable(filtered);
    } else {
      const msg = all.length === 0 ? 'Aucun prospect enregistr\u00e9.' : 'Aucun prospect pour ces crit\u00e8res.';
      const addBtn = all.length === 0 ? '<button class="btn btn-primary" id="btn-empty-add">Ajouter le premier prospect</button>' : '';
      bodyHTML = '<div class="empty-state"><div class="empty-icon">\uD83C\uDFAF</div><p>' + msg + '</p>' + addBtn + '</div>';
    }

    _container.innerHTML =
      '<div class="page-header">' +
        '<div>' +
          '<h1>Prospects / CRM</h1>' +
          '<span class="text-muted" style="font-size:0.82rem;">' + all.length + ' prospect' + (all.length > 1 ? 's' : '') + ' enregistr\u00e9' + (all.length > 1 ? 's' : '') + '</span>' +
        '</div>' +
        '<div class="actions"><button class="btn btn-primary" id="btn-add-prospect">+ Nouveau prospect</button></div>' +
      '</div>' +

      '<div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-bottom:16px;">' +
        '<div class="kpi-card"><div class="kpi-label">Total</div><div class="kpi-value">' + all.length + '</div></div>' +
        '<div class="kpi-card' + (nouveaux > 0 ? ' kpi-warning' : '') + '"><div class="kpi-label">\u00c0 traiter</div><div class="kpi-value">' + nouveaux + '</div><div class="kpi-detail">statut \u00ab Nouveau \u00bb</div></div>' +
        '<div class="kpi-card"><div class="kpi-label">Pipeline actif</div><div class="kpi-value">' + actifs + '</div><div class="kpi-detail">hors converti / perdu</div></div>' +
        '<div class="kpi-card kpi-success"><div class="kpi-label">Convertis</div><div class="kpi-value">' + (counts['converti'] || 0) + '</div></div>' +
      '</div>' +

      '<div class="card" style="margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
          '<div class="search-bar" style="flex:1;min-width:200px;">' +
            '<span class="search-icon">&#128269;</span>' +
            '<input type="text" id="prospect-search" placeholder="Rechercher par nom, organisation\u2026" value="' + _escAttr(_searchTerm) + '" />' +
          '</div>' +
          '<select class="form-control" id="prospect-filter-status" style="width:160px;">' +
            '<option value="">Tous les statuts</option>' +
            STATUTS.map(s => '<option value="' + s.value + '"' + (_filterStatus === s.value ? ' selected' : '') + '>' + _esc(s.label) + '</option>').join('') +
          '</select>' +
        '</div>' +
        '<div style="margin-top:10px;">' + pillsHTML + '</div>' +
      '</div>' +

      '<div class="card">' + bodyHTML + '</div>';

    _bindEvents();
  }

  /* ----------------------------------------------------------
     FILTRAGE
     ---------------------------------------------------------- */

  function _applyFilters(list) {
    let r = list;
    if (_filterStatus) r = r.filter(p => p.statut === _filterStatus);
    if (_searchTerm) {
      const q = _searchTerm.toLowerCase();
      r = r.filter(p =>
        (p.nom          || '').toLowerCase().includes(q) ||
        (p.prenom       || '').toLowerCase().includes(q) ||
        (p.organisation || '').toLowerCase().includes(q) ||
        (p.email        || '').toLowerCase().includes(q)
      );
    }
    r.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return r;
  }

  /* ----------------------------------------------------------
     TABLEAU
     ---------------------------------------------------------- */

  function _renderTable(list) {
    let rows = '';
    list.forEach(p => {
      const statut  = STATUTS.find(s => s.value === p.statut) || STATUTS[0];
      const source  = SOURCES.find(s => s.value === p.source);
      const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '\u2014';
      const fullName = ((p.prenom || '') + (p.prenom && p.nom ? ' ' : '') + (p.nom || '')).trim() || '\u2014';

      rows +=
        '<tr>' +
          '<td><strong>' + _esc(fullName) + '</strong>' +
            (p.email ? '<br><small class="text-muted">' + _esc(p.email) + '</small>' : '') +
          '</td>' +
          '<td>' + _esc(p.organisation || '\u2014') + '</td>' +
          '<td><small>' + _esc(p.type_structure || '\u2014') + '</small></td>' +
          '<td><span class="tag ' + statut.tag + '">' + statut.label + '</span></td>' +
          '<td><small class="text-muted">' + (source ? _esc(source.label) : _esc(p.source || '\u2014')) + '</small></td>' +
          '<td class="text-mono" style="font-size:0.8rem;">' + dateStr + '</td>' +
          '<td class="actions-cell">' +
            '<button class="btn btn-sm btn-edit-prospect" data-id="' + p.id + '" title="\u00c9diter">&#9998;</button>' +
            (p.statut !== 'converti'
              ? '<button class="btn btn-sm btn-convert-prospect" data-id="' + p.id + '" title="Convertir en client" style="color:var(--color-success);">&#10003;&nbsp;Client</button>'
              : '<span class="tag tag-green" style="font-size:0.7rem;">Converti</span>') +
            '<button class="btn btn-sm btn-delete-prospect" data-id="' + p.id + '" title="Supprimer" style="color:var(--color-danger);">&#128465;</button>' +
          '</td>' +
        '</tr>';
    });

    return '<div class="data-table-wrap"><table class="data-table">' +
      '<thead><tr>' +
        '<th>Nom / Pr\u00e9nom</th>' +
        '<th>Organisation</th>' +
        '<th>Type structure</th>' +
        '<th>Statut</th>' +
        '<th>Source</th>' +
        '<th>Date</th>' +
        '<th class="text-right">Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table></div>';
  }

  /* ----------------------------------------------------------
     EVENEMENTS
     ---------------------------------------------------------- */

  function _bindEvents() {
    const c = _container;

    const btnAdd = c.querySelector('#btn-add-prospect');
    if (btnAdd) btnAdd.addEventListener('click', () => _openModal(null));

    const btnEmptyAdd = c.querySelector('#btn-empty-add');
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => _openModal(null));

    const search = c.querySelector('#prospect-search');
    if (search) {
      search.addEventListener('input', e => { _searchTerm = e.target.value; _renderPage(); });
    }

    const filterSel = c.querySelector('#prospect-filter-status');
    if (filterSel) {
      filterSel.addEventListener('change', e => { _filterStatus = e.target.value; _renderPage(); });
    }

    c.querySelectorAll('[data-pill]').forEach(pill => {
      pill.addEventListener('click', () => {
        _filterStatus = _filterStatus === pill.dataset.pill ? '' : pill.dataset.pill;
        _renderPage();
      });
    });

    const pillReset = c.querySelector('#pill-reset');
    if (pillReset) { pillReset.addEventListener('click', () => { _filterStatus = ''; _renderPage(); }); }

    c.querySelectorAll('.btn-edit-prospect').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _openModal(btn.dataset.id); });
    });

    c.querySelectorAll('.btn-convert-prospect').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _convertToClient(btn.dataset.id); });
    });

    c.querySelectorAll('.btn-delete-prospect').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _deleteProspect(btn.dataset.id); });
    });
  }

  /* ----------------------------------------------------------
     CONVERSION EN CLIENT
     ---------------------------------------------------------- */

  function _convertToClient(id) {
    const p = DB.prospects.getById(id);
    if (!p) return;
    const nom = ((p.prenom || '') + ' ' + (p.nom || '')).trim();
    if (!confirm('Convertir "' + nom + '" (' + (p.organisation || '') + ') en client ?\nCette action cr\u00e9era une fiche client dans l\u2019outil.')) return;

    DB.clients.create({
      name:           (p.organisation || nom).trim(),
      contactName:    nom,
      contactEmail:   p.email     || '',
      contactPhone:   p.telephone || '',
      type:           p.type_structure || '',
      clientCategory: 'B2B',
      active:         true
    });

    DB.prospects.update(id, { statut: 'converti' });

    if (typeof Toast !== 'undefined') Toast.show('Prospect converti en client avec succ\u00e8s.', 'success');
    App.navigate('clients');
  }

  /* ----------------------------------------------------------
     SUPPRESSION
     ---------------------------------------------------------- */

  function _deleteProspect(id) {
    const p = DB.prospects.getById(id);
    if (!p) return;
    const nom = (((p.prenom || '') + ' ' + (p.nom || '')).trim()) || (p.organisation || '');
    if (!confirm('Supprimer le prospect "' + nom + '" ?\nCette action est irr\u00e9versible.')) return;
    DB.prospects.delete(id);
    _renderPage();
  }

  /* ----------------------------------------------------------
     MODAL CREATION / EDITION
     ---------------------------------------------------------- */

  function _openModal(id) {
    const isEdit = !!id;
    const p = isEdit ? DB.prospects.getById(id) : null;

    function v(field, fallback) {
      return (isEdit && p && p[field] != null) ? p[field] : (fallback || '');
    }

    function opts(arr, cur) {
      return arr.map(x => '<option value="' + _escAttr(x) + '"' + (cur === x ? ' selected' : '') + '>' + _esc(x) + '</option>').join('');
    }

    function statutOpts(cur) {
      return STATUTS.map(s => '<option value="' + s.value + '"' + (cur === s.value ? ' selected' : '') + '>' + s.label + '</option>').join('');
    }

    function sourceOpts(cur) {
      return SOURCES.map(s => '<option value="' + s.value + '"' + (cur === s.value ? ' selected' : '') + '>' + s.label + '</option>').join('');
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'prospect-modal-overlay';

    overlay.innerHTML =
      '<div class="modal modal-lg">' +
        '<div class="modal-header">' +
          '<h2>' + (isEdit ? 'Modifier le prospect' : 'Nouveau prospect') + '</h2>' +
          '<button class="btn btn-sm btn-ghost" id="modal-close">&times;</button>' +
        '</div>' +
        '<div class="modal-body" style="max-height:68vh;overflow-y:auto;">' +

          /* Section 1 */
          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Identit\u00e9 &amp; Structure</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Pr\u00e9nom</label><input type="text" id="p-prenom" class="form-control" value="' + _escAttr(v('prenom')) + '" placeholder="Pr\u00e9nom" /></div>' +
            '<div class="form-group"><label>Nom</label><input type="text" id="p-nom" class="form-control" value="' + _escAttr(v('nom')) + '" placeholder="Nom" /></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Organisation</label><input type="text" id="p-organisation" class="form-control" value="' + _escAttr(v('organisation')) + '" placeholder="Ex\u00a0: Police municipale de Lyon" /></div>' +
            '<div class="form-group"><label>Fonction</label><input type="text" id="p-fonction" class="form-control" value="' + _escAttr(v('fonction')) + '" placeholder="Ex\u00a0: Chef de service" /></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Type de structure</label><select id="p-type_structure" class="form-control"><option value="">\u2014 S\u00e9lectionner \u2014</option>' + opts(TYPES_STRUCTURE, v('type_structure')) + '</select></div>' +
            '<div class="form-group"><label>Effectif</label><select id="p-effectif" class="form-control"><option value="">\u2014 S\u00e9lectionner \u2014</option>' + opts(EFFECTIFS, v('effectif')) + '</select></div>' +
            '<div class="form-group"><label>Nombre de sites</label><select id="p-nb_sites" class="form-control"><option value="">\u2014 S\u00e9lectionner \u2014</option>' + opts(NB_SITES, v('nb_sites')) + '</select></div>' +
          '</div>' +

          /* Section 2 */
          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Contact &amp; Besoin</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Email</label><input type="email" id="p-email" class="form-control" value="' + _escAttr(v('email')) + '" placeholder="contact@exemple.fr" /></div>' +
            '<div class="form-group"><label>T\u00e9l\u00e9phone</label><input type="tel" id="p-telephone" class="form-control" value="' + _escAttr(v('telephone')) + '" placeholder="06 00 00 00 00" /></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Nature du besoin</label><select id="p-besoin" class="form-control"><option value="">\u2014 S\u00e9lectionner \u2014</option>' + opts(BESOINS, v('besoin')) + '</select></div>' +
            '<div class="form-group"><label>Objet de la demande</label><select id="p-formule" class="form-control"><option value="">\u2014 S\u00e9lectionner \u2014</option>' + opts(FORMULES, v('formule')) + '</select></div>' +
          '</div>' +

          /* Section 3 */
          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">CRM</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Statut</label><select id="p-statut" class="form-control">' + statutOpts(v('statut', 'nouveau')) + '</select></div>' +
            '<div class="form-group"><label>Source</label><select id="p-source" class="form-control">' + sourceOpts(v('source', 'manuel')) + '</select></div>' +
          '</div>' +
          '<div class="form-group"><label>Notes internes</label><textarea id="p-notes" class="form-control" rows="3" placeholder="Notes de suivi, relances, contexte\u2026">' + _esc(v('notes')) + '</textarea></div>' +
          '<div class="form-group"><label>Message initial <span class="text-muted" style="font-size:0.75rem;">(message d\u2019origine)</span></label><textarea id="p-message" class="form-control" rows="3" placeholder="Copier ici le message re\u00e7u via le formulaire web\u2026">' + _esc(v('message')) + '</textarea></div>' +

        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn" id="modal-cancel">Annuler</button>' +
          '<button class="btn btn-primary" id="modal-save">' + (isEdit ? 'Enregistrer' : 'Cr\u00e9er le prospect') + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelector('#modal-close').addEventListener('click',  () => overlay.remove());
    overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#modal-save').addEventListener('click', () => {
      const get = field => ((overlay.querySelector('#p-' + field) || {}).value || '');
      const data = {
        prenom:         get('prenom').trim(),
        nom:            get('nom').trim(),
        organisation:   get('organisation').trim(),
        fonction:       get('fonction').trim(),
        type_structure: get('type_structure'),
        effectif:       get('effectif'),
        nb_sites:       get('nb_sites'),
        besoin:         get('besoin'),
        email:          get('email').trim(),
        telephone:      get('telephone').trim(),
        formule:        get('formule'),
        message:        get('message').trim(),
        statut:         get('statut') || 'nouveau',
        source:         get('source') || 'manuel',
        notes:          get('notes').trim()
      };

      if (!data.nom && !data.organisation) {
        if (typeof Toast !== 'undefined') Toast.show('Le nom ou l\u2019organisation est obligatoire.', 'error');
        else alert('Le nom ou l\u2019organisation est obligatoire.');
        return;
      }

      if (isEdit) {
        DB.prospects.update(id, data);
        if (typeof Toast !== 'undefined') Toast.show('Prospect mis \u00e0 jour.', 'success');
      } else {
        DB.prospects.create(data);
        if (typeof Toast !== 'undefined') Toast.show('Prospect cr\u00e9\u00e9.', 'success');
      }

      overlay.remove();
      _renderPage();
    });
  }

  /* ----------------------------------------------------------
     HELPERS XSS
     ---------------------------------------------------------- */

  function _esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

  function _escAttr(str) { return _esc(str); }

  /* ----------------------------------------------------------
     API PUBLIQUE
     ---------------------------------------------------------- */

  return { render };
})();
