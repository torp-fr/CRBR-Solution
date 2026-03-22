/* ============================================================
   DST-SYSTEM — Vue Devis / Pipeline commercial
   Gestion des devis : CRUD, statuts, template PDF, pipeline CRM.
   ============================================================ */

window.Views = window.Views || {};

Views.Devis = (() => {
  'use strict';

  /* ----------------------------------------------------------
     CONSTANTES
     ---------------------------------------------------------- */

  const STATUTS = [
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'envoye',    label: 'Envoy\u00e9'   },
    { value: 'accepte',   label: 'Accept\u00e9'  },
    { value: 'refuse',    label: 'Refus\u00e9'   },
    { value: 'expire',    label: 'Expir\u00e9'   }
  ];

  const STATUT_STYLE = {
    brouillon: 'background:var(--bg-primary);color:var(--text-muted);border:1px solid var(--border-color);',
    envoye:    'background:rgba(30,136,229,0.15);color:#1e88e5;',
    accepte:   'background:rgba(46,125,50,0.15);color:#2e7d32;',
    refuse:    'background:rgba(211,47,47,0.15);color:#d32f2f;',
    expire:    'background:rgba(245,124,0,0.15);color:#f57c00;'
  };

  const TYPES_LIGNE = [
    { value: 'session',    label: 'Session'    },
    { value: 'abonnement', label: 'Abonnement' },
    { value: 'module',     label: 'Module'     },
    { value: 'forfait',    label: 'Forfait'    },
    { value: 'autre',      label: 'Autre'      }
  ];

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
    const all     = DB.devis.getAll();
    const filtered = _applyFilters(all);
    const today   = new Date();

    const counts = {};
    STATUTS.forEach(s => { counts[s.value] = 0; });
    all.forEach(d => { if (counts[d.statut] !== undefined) counts[d.statut]++; });

    const enAttente = counts['envoye'] || 0;
    const acceptesMois = all.filter(d => {
      if (d.statut !== 'accepte') return false;
      const ref = d.updatedAt || d.createdAt;
      if (!ref) return false;
      const u = new Date(ref);
      return u.getFullYear() === today.getFullYear() && u.getMonth() === today.getMonth();
    }).length;

    /* Pills statut */
    let pillsHTML = '';
    STATUTS.forEach(s => {
      const active = _filterStatus === s.value;
      const style  = STATUT_STYLE[s.value] || '';
      pillsHTML += '<span class="tag" data-pill="' + s.value + '" style="' + style + 'cursor:pointer;margin-right:4px;' + (active ? 'font-weight:700;outline:2px solid currentColor;outline-offset:2px;' : 'opacity:0.7;') + '">' + _esc(s.label) + ' <strong>' + counts[s.value] + '</strong></span>';
    });
    if (_filterStatus) {
      pillsHTML += '<span class="tag" id="pill-reset" style="cursor:pointer;margin-left:4px;background:var(--bg-primary);color:var(--text-muted);border:1px solid var(--border-color);">\u00d7 Tout afficher</span>';
    }

    let bodyHTML;
    if (filtered.length > 0) {
      bodyHTML = _renderTable(filtered, today);
    } else {
      const msg    = all.length === 0 ? 'Aucun devis enregistr\u00e9.' : 'Aucun devis pour ces crit\u00e8res.';
      const addBtn = all.length === 0 ? '<button class="btn btn-primary" id="btn-empty-add">Cr\u00e9er le premier devis</button>' : '';
      bodyHTML = '<div class="empty-state"><div class="empty-icon">&#128196;</div><p>' + msg + '</p>' + addBtn + '</div>';
    }

    _container.innerHTML =
      '<div class="page-header">' +
        '<div>' +
          '<h1>Devis</h1>' +
          '<span class="text-muted" style="font-size:0.82rem;">' + all.length + ' devis enregistr\u00e9' + (all.length > 1 ? 's' : '') + '</span>' +
        '</div>' +
        '<div class="actions"><button class="btn btn-primary" id="btn-add-devis">+ Nouveau devis</button></div>' +
      '</div>' +

      '<div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-bottom:16px;">' +
        '<div class="kpi-card"><div class="kpi-label">Total</div><div class="kpi-value">' + all.length + '</div></div>' +
        '<div class="kpi-card' + (enAttente > 0 ? ' kpi-warning' : '') + '"><div class="kpi-label">En attente</div><div class="kpi-value">' + enAttente + '</div><div class="kpi-detail">statut \u00ab Envoy\u00e9 \u00bb</div></div>' +
        '<div class="kpi-card kpi-success"><div class="kpi-label">Accept\u00e9s ce mois</div><div class="kpi-value">' + acceptesMois + '</div></div>' +
        '<div class="kpi-card"><div class="kpi-label">Brouillons</div><div class="kpi-value">' + (counts['brouillon'] || 0) + '</div></div>' +
      '</div>' +

      '<div class="card" style="margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
          '<div class="search-bar" style="flex:1;min-width:200px;">' +
            '<span class="search-icon">&#128269;</span>' +
            '<input type="text" id="devis-search" placeholder="Rechercher par num\u00e9ro, titre, destinataire\u2026" value="' + _escAttr(_searchTerm) + '" />' +
          '</div>' +
          '<select class="form-control" id="devis-filter-status" style="width:160px;">' +
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
    if (_filterStatus) r = r.filter(d => d.statut === _filterStatus);
    if (_searchTerm) {
      const q = _searchTerm.toLowerCase();
      r = r.filter(d => {
        const dest = _getDestinataireLabel(d).toLowerCase();
        return (d.numero || '').toLowerCase().includes(q) ||
               (d.titre  || '').toLowerCase().includes(q) ||
               dest.includes(q);
      });
    }
    r.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return r;
  }

  /* ----------------------------------------------------------
     HELPERS METIER
     ---------------------------------------------------------- */

  function _getDestinataireLabel(d) {
    if (d.prospectId) {
      const p = DB.prospects.getById(d.prospectId);
      if (p) return (p.organisation || ((p.prenom || '') + ' ' + (p.nom || '')).trim() || '\u2014');
    }
    if (d.clientId) {
      const c = DB.clients.getById(d.clientId);
      if (c) return c.name || '\u2014';
    }
    return '\u2014';
  }

  function _getDestinataireDetail(d) {
    if (d.prospectId) {
      const p = DB.prospects.getById(d.prospectId);
      if (p) return '<small class="text-muted">Prospect</small>';
    }
    if (d.clientId) {
      const c = DB.clients.getById(d.clientId);
      if (c) return '<small class="text-muted">Client</small>';
    }
    return '';
  }

  function _statutTag(statut) {
    const s     = STATUTS.find(st => st.value === statut);
    const label = s ? s.label : statut;
    const style = STATUT_STYLE[statut] || '';
    return '<span class="tag" style="' + style + '">' + label + '</span>';
  }

  /* ----------------------------------------------------------
     TABLEAU
     ---------------------------------------------------------- */

  function _renderTable(list, today) {
    let rows = '';
    list.forEach(d => {
      const dateStr  = d.createdAt ? new Date(d.createdAt).toLocaleDateString('fr-FR') : '\u2014';
      const dest     = _getDestinataireLabel(d);
      const destDetail = _getDestinataireDetail(d);

      /* Validité */
      let validiteHTML = '\u2014';
      if (d.dateExpiration) {
        const exp      = new Date(d.dateExpiration);
        const estExpire = exp < today && d.statut !== 'accepte' && d.statut !== 'refuse';
        const label    = 'Expire le ' + exp.toLocaleDateString('fr-FR');
        validiteHTML   = estExpire
          ? '<span class="tag" style="' + STATUT_STYLE.expire + '">Expir\u00e9</span>'
          : '<span style="font-size:0.8rem;" class="text-muted">' + _esc(label) + '</span>';
      }

      /* Actions de transition de statut */
      let statutActions = '';
      if (d.statut === 'brouillon') {
        statutActions = '<button class="btn btn-sm btn-statut-devis" data-id="' + d.id + '" data-next="envoye" title="Marquer comme envoy\u00e9">&#9993;&nbsp;Envoyer</button>';
      } else if (d.statut === 'envoye') {
        statutActions =
          '<button class="btn btn-sm btn-statut-devis" data-id="' + d.id + '" data-next="accepte" style="color:#2e7d32;" title="Accept\u00e9">&#10003;&nbsp;Accept\u00e9</button>' +
          '<button class="btn btn-sm btn-statut-devis" data-id="' + d.id + '" data-next="refuse"  style="color:#d32f2f;" title="Refus\u00e9">&#10007;&nbsp;Refus\u00e9</button>';
      }

      rows +=
        '<tr>' +
          '<td><strong class="text-mono" style="font-size:0.85rem;">' + _esc(d.numero || '\u2014') + '</strong></td>' +
          '<td>' + _esc(dest) + destDetail + '</td>' +
          '<td>' +
            _esc(d.titre || '\u2014') +
            (d.objet ? '<br><small class="text-muted">' + _esc(d.objet.length > 55 ? d.objet.substring(0, 55) + '\u2026' : d.objet) + '</small>' : '') +
          '</td>' +
          '<td class="text-mono" style="font-size:0.9rem;"><strong>' + _fmtEur(d.totalTTC || 0) + '</strong><br><small class="text-muted">HT\u00a0' + _fmtEur(d.totalHT || 0) + '</small></td>' +
          '<td>' + _statutTag(d.statut) + '</td>' +
          '<td class="text-mono" style="font-size:0.8rem;">' + dateStr + '</td>' +
          '<td>' + validiteHTML + '</td>' +
          '<td class="actions-cell">' +
            '<button class="btn btn-sm btn-edit-devis"   data-id="' + d.id + '" title="\u00c9diter">&#9998;</button>' +
            '<button class="btn btn-sm btn-pdf-devis"    data-id="' + d.id + '" title="Aper\u00e7u PDF">&#128196;</button>' +
            statutActions +
            (d.statut === 'brouillon'
              ? '<button class="btn btn-sm btn-delete-devis" data-id="' + d.id + '" title="Supprimer" style="color:var(--color-danger);">&#128465;</button>'
              : '') +
          '</td>' +
        '</tr>';
    });

    return '<div class="data-table-wrap"><table class="data-table">' +
      '<thead><tr>' +
        '<th>Num\u00e9ro</th>' +
        '<th>Destinataire</th>' +
        '<th>Titre</th>' +
        '<th>Total TTC</th>' +
        '<th>Statut</th>' +
        '<th>Date</th>' +
        '<th>Validit\u00e9</th>' +
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

    const btnAdd = c.querySelector('#btn-add-devis');
    if (btnAdd) btnAdd.addEventListener('click', () => _openModal(null));

    const btnEmptyAdd = c.querySelector('#btn-empty-add');
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => _openModal(null));

    const search = c.querySelector('#devis-search');
    if (search) {
      search.addEventListener('input', e => { _searchTerm = e.target.value; _renderPage(); });
    }

    const filterSel = c.querySelector('#devis-filter-status');
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
    if (pillReset) pillReset.addEventListener('click', () => { _filterStatus = ''; _renderPage(); });

    c.querySelectorAll('.btn-edit-devis').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _openModal(btn.dataset.id); });
    });

    c.querySelectorAll('.btn-pdf-devis').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _previewPdf(btn.dataset.id); });
    });

    c.querySelectorAll('.btn-statut-devis').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _changerStatut(btn.dataset.id, btn.dataset.next); });
    });

    c.querySelectorAll('.btn-delete-devis').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _deleteDevis(btn.dataset.id); });
    });
  }

  /* ----------------------------------------------------------
     TRANSITIONS DE STATUT
     ---------------------------------------------------------- */

  function _changerStatut(id, nextStatut) {
    const d = DB.devis.getById(id);
    if (!d) return;
    const labels = { envoye: 'Envoy\u00e9', accepte: 'Accept\u00e9', refuse: 'Refus\u00e9' };
    if (!confirm('Passer le devis ' + (d.numero || '') + ' en statut \u00ab ' + (labels[nextStatut] || nextStatut) + ' \u00bb ?')) return;

    const update = { statut: nextStatut };
    if (nextStatut === 'envoye') {
      update.dateEnvoi = new Date().toISOString().slice(0, 10);
      const validite  = d.validiteJours || 30;
      const exp       = new Date();
      exp.setDate(exp.getDate() + validite);
      update.dateExpiration = exp.toISOString().slice(0, 10);
    }

    DB.devis.update(id, update);
    if (typeof Toast !== 'undefined') Toast.show('Statut mis \u00e0 jour.', 'success');
    _renderPage();
  }

  /* ----------------------------------------------------------
     SUPPRESSION
     ---------------------------------------------------------- */

  function _deleteDevis(id) {
    const d = DB.devis.getById(id);
    if (!d) return;
    if (!confirm('Supprimer le devis ' + (d.numero || '') + ' ?\nCette action est irr\u00e9versible.')) return;
    DB.devis.delete(id);
    _renderPage();
  }

  /* ----------------------------------------------------------
     APERCU PDF
     ---------------------------------------------------------- */

  function _previewPdf(id) {
    const d = DB.devis.getById(id);
    if (!d) return;

    let dest = { organisation: '', contact: '', type_structure: '', email: '', telephone: '' };

    if (d.prospectId) {
      const p = DB.prospects.getById(d.prospectId);
      if (p) {
        dest.organisation  = p.organisation || '';
        dest.contact       = ((p.prenom || '') + ' ' + (p.nom || '')).trim();
        dest.type_structure = p.type_structure || '';
        dest.email         = p.email || '';
        dest.telephone     = p.telephone || '';
      }
    } else if (d.clientId) {
      const cl = DB.clients.getById(d.clientId);
      if (cl) {
        dest.organisation  = cl.name || '';
        dest.contact       = cl.contactName || '';
        dest.type_structure = cl.type || '';
        dest.email         = cl.contactEmail || '';
        dest.telephone     = cl.contactPhone || '';
      }
    }

    const payload = {
      numero:        d.numero,
      titre:         d.titre,
      objet:         d.objet,
      dateCreation:  d.dateCreation || d.createdAt,
      dateExpiration: d.dateExpiration,
      validiteJours: d.validiteJours,
      destinataire:  dest,
      lignes:        d.lignes || [],
      totalHT:       d.totalHT,
      tauxTVA:       d.tauxTVA,
      totalTVA:      d.totalTVA,
      totalTTC:      d.totalTTC
    };

    const encoded = encodeURIComponent(JSON.stringify(payload));
    window.open('vitrine/templates/devis-template.html?data=' + encoded, '_blank');
  }

  /* ----------------------------------------------------------
     MODAL CREATION / EDITION
     ---------------------------------------------------------- */

  function _openModal(id) {
    const isEdit   = !!id;
    const existing = isEdit ? DB.devis.getById(id) : null;
    const settings = DB.settings.get();
    const vatRate  = settings.vatRate || 20;

    function v(field, fallback) {
      return (isEdit && existing && existing[field] != null) ? existing[field] : (fallback !== undefined ? fallback : '');
    }

    /* Lignes en mémoire locale */
    let lignes = (isEdit && existing && existing.lignes && existing.lignes.length)
      ? existing.lignes.map(l => ({ ...l }))
      : [{ id: DB.generateId(), description: '', type: 'session', quantite: 1, prixUnitaireHT: 0, totalHT: 0 }];

    const prospects = DB.prospects.getAll().filter(p => p.statut !== 'converti' && p.statut !== 'perdu');
    const clients   = DB.clients.getAll().filter(c => c.active !== false);

    const prospectOptions = '<option value="">\u2014 S\u00e9lectionner \u2014</option>' +
      prospects.map(p => {
        const label = ((p.prenom || '') + ' ' + (p.nom || '')).trim() + (p.organisation ? ' \u2014 ' + p.organisation : '');
        return '<option value="' + _escAttr(p.id) + '"' + (v('prospectId') === p.id ? ' selected' : '') + '>' + _esc(label) + '</option>';
      }).join('');

    const clientOptions = '<option value="">\u2014 S\u00e9lectionner \u2014</option>' +
      clients.map(c => {
        return '<option value="' + _escAttr(c.id) + '"' + (v('clientId') === c.id ? ' selected' : '') + '>' + _esc(c.name || '\u2014') + '</option>';
      }).join('');

    const destMode = (isEdit && existing && existing.clientId) ? 'client' : 'prospect';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id        = 'devis-modal-overlay';

    overlay.innerHTML =
      '<div class="modal modal-lg">' +
        '<div class="modal-header">' +
          '<h2>' + (isEdit ? 'Modifier le devis' : 'Nouveau devis') + '</h2>' +
          '<button class="btn btn-sm btn-ghost" id="modal-close">&times;</button>' +
        '</div>' +
        '<div class="modal-body" style="max-height:72vh;overflow-y:auto;">' +

          /* --- Section 1 : En-tête --- */
          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">En-t\u00eate du devis</div>' +
          '<div class="form-row">' +
            '<div class="form-group" style="flex:2;"><label>Titre *</label><input type="text" id="dv-titre" class="form-control" value="' + _escAttr(v('titre')) + '" placeholder="Ex\u00a0: Programme annuel Police Municipale B\u00e9ziers" /></div>' +
            '<div class="form-group"><label>Validit\u00e9 (jours)</label><input type="number" id="dv-validite" class="form-control" min="1" value="' + _escAttr(v('validiteJours', (settings.pricingCatalog && settings.pricingCatalog.validiteDevisJours != null ? settings.pricingCatalog.validiteDevisJours : 30))) + '" /></div>' +
          '</div>' +
          '<div class="form-group"><label>Objet</label><textarea id="dv-objet" class="form-control" rows="2" placeholder="Description g\u00e9n\u00e9rale du devis\u2026">' + _esc(v('objet')) + '</textarea></div>' +

          '<div class="form-group">' +
            '<label>Destinataire</label>' +
            '<div style="display:flex;gap:16px;margin-bottom:8px;">' +
              '<label class="form-check"><input type="radio" name="dv-dest-mode" value="prospect"' + (destMode === 'prospect' ? ' checked' : '') + '><span>Prospect</span></label>' +
              '<label class="form-check"><input type="radio" name="dv-dest-mode" value="client"' + (destMode === 'client' ? ' checked' : '') + '><span>Client existant</span></label>' +
            '</div>' +
            '<div id="dv-dest-prospect"' + (destMode === 'client' ? ' style="display:none;"' : '') + '>' +
              (prospects.length ? '<select id="dv-prospect" class="form-control">' + prospectOptions + '</select>' : '<p class="text-muted" style="font-size:0.85rem;">Aucun prospect actif.</p>') +
            '</div>' +
            '<div id="dv-dest-client"' + (destMode === 'prospect' ? ' style="display:none;"' : '') + '>' +
              (clients.length ? '<select id="dv-client" class="form-control">' + clientOptions + '</select>' : '<p class="text-muted" style="font-size:0.85rem;">Aucun client actif.</p>') +
            '</div>' +
          '</div>' +

          /* --- Section 2 : Lignes --- */
          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Lignes du devis</div>' +
          '<div id="dv-lignes-container"></div>' +
          '<button type="button" class="btn btn-sm" id="dv-add-ligne" style="margin-top:8px;">+ Ajouter une ligne</button>' +

          /* --- Section 3 : Totaux --- */
          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Totaux</div>' +
          '<div id="dv-totaux" style="text-align:right;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:6px;padding:12px 16px;"></div>' +
          '<div id="dv-alerte-plancher" style="margin-top:8px;"></div>' +

          /* --- Section 4 : Notes --- */
          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Notes internes</div>' +
          '<div class="form-group"><textarea id="dv-notes" class="form-control" rows="3" placeholder="Notes de suivi, conditions particuli\u00e8res\u2026 (non affich\u00e9es sur le PDF)">' + _esc(v('notes')) + '</textarea></div>' +

        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn" id="modal-cancel">Annuler</button>' +
          '<button class="btn btn-primary" id="modal-save">' + (isEdit ? 'Enregistrer' : 'Cr\u00e9er le devis') + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    /* Rendu initial des lignes */
    _renderLignes(overlay, lignes, vatRate);

    /* Événements de base */
    overlay.querySelector('#modal-close').addEventListener('click',  () => overlay.remove());
    overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    /* Toggle mode destinataire */
    overlay.querySelectorAll('input[name="dv-dest-mode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const mode = overlay.querySelector('input[name="dv-dest-mode"]:checked').value;
        overlay.querySelector('#dv-dest-prospect').style.display = mode === 'prospect' ? '' : 'none';
        overlay.querySelector('#dv-dest-client').style.display   = mode === 'client'   ? '' : 'none';
      });
    });

    /* Ajouter une ligne */
    overlay.querySelector('#dv-add-ligne').addEventListener('click', () => {
      lignes.push({ id: DB.generateId(), description: '', type: 'session', quantite: 1, prixUnitaireHT: 0, totalHT: 0 });
      _renderLignes(overlay, lignes, vatRate);
    });

    /* Sauvegarde */
    overlay.querySelector('#modal-save').addEventListener('click', () => {
      const titre = ((overlay.querySelector('#dv-titre') || {}).value || '').trim();
      if (!titre) {
        if (typeof Toast !== 'undefined') Toast.show('Le titre est obligatoire.', 'error');
        else alert('Le titre est obligatoire.');
        return;
      }

      const mode       = overlay.querySelector('input[name="dv-dest-mode"]:checked').value;
      const prospectId = mode === 'prospect' ? ((overlay.querySelector('#dv-prospect') || {}).value || '') : '';
      const clientId   = mode === 'client'   ? ((overlay.querySelector('#dv-client')   || {}).value || '') : '';

      if (!prospectId && !clientId) {
        if (typeof Toast !== 'undefined') Toast.show('Veuillez s\u00e9lectionner un destinataire.', 'error');
        else alert('Veuillez s\u00e9lectionner un destinataire.');
        return;
      }

      const lignesDom = _collectLignes(overlay);
      const totaux    = _calculerTotaux(lignesDom, vatRate);
      const seuil     = _getSeuilPlancher();

      const data = {
        titre:         titre,
        objet:         ((overlay.querySelector('#dv-objet') || {}).value || '').trim(),
        prospectId:    prospectId,
        clientId:      clientId,
        validiteJours: parseInt((overlay.querySelector('#dv-validite') || {}).value) || 30,
        lignes:        lignesDom,
        totalHT:       totaux.totalHT,
        tauxTVA:       vatRate,
        totalTVA:      totaux.totalTVA,
        totalTTC:      totaux.totalTTC,
        seuilPlancher: seuil,
        margeEstimee:  _round2(totaux.totalHT - seuil),
        notes:         ((overlay.querySelector('#dv-notes') || {}).value || '').trim(),
        statut:        isEdit ? (existing.statut || 'brouillon') : 'brouillon'
      };

      if (!isEdit) {
        data.numero       = DB.getNextNumeroDevis();
        data.dateCreation = new Date().toISOString().slice(0, 10);
      }

      if (isEdit) {
        DB.devis.update(id, data);
        if (typeof Toast !== 'undefined') Toast.show('Devis mis \u00e0 jour.', 'success');
      } else {
        DB.devis.create(data);
        if (typeof Toast !== 'undefined') Toast.show('Devis ' + data.numero + ' cr\u00e9\u00e9.', 'success');
      }

      overlay.remove();
      _renderPage();
    });
  }

  /* ----------------------------------------------------------
     GESTION DES LIGNES (MODAL)
     ---------------------------------------------------------- */

  function _renderLignes(overlay, lignes, vatRate) {
    const container = overlay.querySelector('#dv-lignes-container');
    if (!container) return;

    const headers =
      '<div style="display:grid;grid-template-columns:2fr 1fr 72px 110px 100px 32px;gap:6px;margin-bottom:4px;padding:0 2px;">' +
        '<span class="text-muted" style="font-size:0.72rem;">Description</span>' +
        '<span class="text-muted" style="font-size:0.72rem;">Type</span>' +
        '<span class="text-muted" style="font-size:0.72rem;">Qté</span>' +
        '<span class="text-muted" style="font-size:0.72rem;">Prix unit. HT (€)</span>' +
        '<span class="text-muted" style="font-size:0.72rem;text-align:right;">Total HT</span>' +
        '<span></span>' +
      '</div>';

    let lignesHTML = '';
    lignes.forEach((l, idx) => {
      lignesHTML +=
        '<div class="dv-ligne" data-idx="' + idx + '" style="display:grid;grid-template-columns:2fr 1fr 72px 110px 100px 32px;gap:6px;align-items:center;margin-bottom:6px;padding:8px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:4px;">' +
          '<input type="text"   class="form-control dv-desc" placeholder="Description de la prestation" value="' + _escAttr(l.description) + '" />' +
          '<select class="form-control dv-type">' + _typeLigneOptions(l.type) + '</select>' +
          '<input type="number" class="form-control dv-qty" min="1" step="1" value="' + (l.quantite || 1) + '" />' +
          '<input type="number" class="form-control dv-pu"  min="0" step="0.01" placeholder="0.00" value="' + (l.prixUnitaireHT || 0) + '" />' +
          '<span class="dv-total text-mono" style="font-size:0.85rem;font-weight:600;text-align:right;padding:0 4px;">' + _fmtEur(l.totalHT || 0) + '</span>' +
          '<button type="button" class="btn btn-sm dv-del-ligne" style="color:var(--color-danger);padding:0 6px;">&times;</button>' +
        '</div>';
    });

    container.innerHTML = headers + lignesHTML;

    /* Recalcul en temps réel */
    container.querySelectorAll('.dv-desc, .dv-type, .dv-qty, .dv-pu').forEach(inp => {
      inp.addEventListener('input', () => {
        _syncLignesFromDom(overlay, lignes);
        _updateTotaux(overlay, lignes, vatRate);
      });
    });

    /* Suppression de ligne */
    container.querySelectorAll('.dv-del-ligne').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        if (lignes.length <= 1) {
          if (typeof Toast !== 'undefined') Toast.show('Le devis doit contenir au moins une ligne.', 'warning');
          return;
        }
        lignes.splice(idx, 1);
        _renderLignes(overlay, lignes, vatRate);
        _updateTotaux(overlay, lignes, vatRate);
      });
    });

    _updateTotaux(overlay, lignes, vatRate);
  }

  function _syncLignesFromDom(overlay, lignes) {
    const container = overlay.querySelector('#dv-lignes-container');
    if (!container) return;
    container.querySelectorAll('.dv-ligne').forEach((row, idx) => {
      if (!lignes[idx]) return;
      const qty = parseFloat((row.querySelector('.dv-qty') || {}).value) || 0;
      const pu  = parseFloat((row.querySelector('.dv-pu')  || {}).value) || 0;
      const tot = _round2(qty * pu);
      lignes[idx].description    = ((row.querySelector('.dv-desc') || {}).value || '');
      lignes[idx].type           = (row.querySelector('.dv-type') || {}).value || 'autre';
      lignes[idx].quantite       = qty;
      lignes[idx].prixUnitaireHT = pu;
      lignes[idx].totalHT        = tot;
      const span = row.querySelector('.dv-total');
      if (span) span.textContent = _fmtEur(tot);
    });
  }

  function _updateTotaux(overlay, lignes, vatRate) {
    _syncLignesFromDom(overlay, lignes);
    const totaux = _calculerTotaux(lignes, vatRate);
    const seuil  = _getSeuilPlancher();

    const totDiv = overlay.querySelector('#dv-totaux');
    if (totDiv) {
      totDiv.innerHTML =
        '<div style="display:flex;justify-content:flex-end;gap:48px;">' +
          '<div>' +
            '<div style="margin-bottom:6px;"><span class="text-muted">Total HT</span></div>' +
            '<div style="margin-bottom:6px;"><span class="text-muted">TVA\u00a0(' + vatRate + '\u00a0%)</span></div>' +
            '<div><span style="font-size:1.05rem;font-weight:700;">Total TTC</span></div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="margin-bottom:6px;" class="text-mono">' + _fmtEur(totaux.totalHT) + '</div>' +
            '<div style="margin-bottom:6px;" class="text-mono">' + _fmtEur(totaux.totalTVA) + '</div>' +
            '<div class="text-mono" style="font-size:1.05rem;font-weight:700;">' + _fmtEur(totaux.totalTTC) + '</div>' +
          '</div>' +
        '</div>';
    }

    const alertDiv = overlay.querySelector('#dv-alerte-plancher');
    if (alertDiv) {
      if (seuil > 0 && totaux.totalHT < seuil) {
        const diff = _fmtEur(seuil - totaux.totalHT);
        alertDiv.innerHTML = '<div style="background:rgba(211,47,47,0.12);border:1px solid #d32f2f;border-radius:4px;padding:8px 12px;color:#d32f2f;font-size:0.85rem;">' +
          '\u26a0\ufe0f Total HT inf\u00e9rieur au seuil plancher estim\u00e9\u00a0(' + _fmtEur(seuil) + ')\u00a0\u2014 manque\u00a0' + diff + '</div>';
      } else if (seuil > 0) {
        const marge    = _round2(totaux.totalHT - seuil);
        const margePct = totaux.totalHT > 0 ? _round2((marge / totaux.totalHT) * 100) : 0;
        alertDiv.innerHTML = '<div style="background:rgba(46,125,50,0.12);border:1px solid #2e7d32;border-radius:4px;padding:8px 12px;color:#2e7d32;font-size:0.85rem;">' +
          '\u2713 Marge estim\u00e9e\u00a0: ' + _fmtEur(marge) + '\u00a0(' + margePct + '\u00a0%)</div>';
      } else {
        alertDiv.innerHTML = '';
      }
    }
  }

  function _collectLignes(overlay) {
    const container = overlay.querySelector('#dv-lignes-container');
    const result = [];
    if (!container) return result;
    container.querySelectorAll('.dv-ligne').forEach(row => {
      const qty = parseFloat((row.querySelector('.dv-qty') || {}).value) || 0;
      const pu  = parseFloat((row.querySelector('.dv-pu')  || {}).value) || 0;
      result.push({
        id:             DB.generateId(),
        description:    ((row.querySelector('.dv-desc') || {}).value || '').trim(),
        type:           (row.querySelector('.dv-type') || {}).value || 'autre',
        quantite:       qty,
        prixUnitaireHT: pu,
        totalHT:        _round2(qty * pu)
      });
    });
    return result;
  }

  function _calculerTotaux(lignes, vatRate) {
    const totalHT  = _round2(lignes.reduce((s, l) => s + (l.totalHT || 0), 0));
    const totalTVA = _round2(totalHT * (vatRate / 100));
    const totalTTC = _round2(totalHT + totalTVA);
    return { totalHT, totalTVA, totalTTC };
  }

  function _getSeuilPlancher() {
    try { return Engine.calculateSeuilPlancher(DB.settings.get()); } catch (e) { return 0; }
  }

  function _typeLigneOptions(current) {
    return TYPES_LIGNE.map(t =>
      '<option value="' + t.value + '"' + (current === t.value ? ' selected' : '') + '>' + t.label + '</option>'
    ).join('');
  }

  /* ----------------------------------------------------------
     HELPERS XSS + FORMAT
     ---------------------------------------------------------- */

  function _round2(n) { return Math.round((n || 0) * 100) / 100; }

  function _fmtEur(n) {
    return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0\u20ac';
  }

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
