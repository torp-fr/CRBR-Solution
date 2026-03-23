/* ============================================================
   DST-SYSTEM — Vue Factures
   Gestion de la facturation : CRUD, encaissements, PDF, statuts.
   Pipeline : Devis accepté → Facture → Encaissement
   ============================================================ */

window.Views = window.Views || {};

Views.Factures = (() => {
  'use strict';

  /* ----------------------------------------------------------
     CONSTANTES
     ---------------------------------------------------------- */

  const STATUTS = [
    { value: 'brouillon',           label: 'Brouillon'           },
    { value: 'emise',               label: 'Émise'               },
    { value: 'partiellement_payee', label: 'Part. payée'         },
    { value: 'soldee',              label: 'Soldée'              },
    { value: 'annulee',             label: 'Annulée'             }
  ];

  const STATUT_STYLE = {
    brouillon:           'background:var(--bg-primary);color:var(--text-muted);border:1px solid var(--border-color);',
    emise:               'background:rgba(30,136,229,0.15);color:#1e88e5;',
    partiellement_payee: 'background:rgba(245,124,0,0.15);color:#f57c00;',
    soldee:              'background:rgba(46,125,50,0.15);color:#2e7d32;',
    annulee:             'background:rgba(120,120,120,0.15);color:#777;'
  };

  const MODES_PAIEMENT = [
    { value: 'virement',   label: 'Virement bancaire' },
    { value: 'cheque',     label: 'Chèque'            },
    { value: 'especes',    label: 'Espèces'           },
    { value: 'cb',         label: 'Carte bancaire'    },
    { value: 'autre',      label: 'Autre'             }
  ];

  /* ----------------------------------------------------------
     ETAT LOCAL
     ---------------------------------------------------------- */

  let _container    = null;
  let _searchTerm   = '';
  let _filterStatus = '';
  let _facLignes    = [];

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
    const all      = DB.factures.getAll();
    const filtered = _applyFilters(all);
    const today    = new Date();

    const counts = {};
    STATUTS.forEach(s => { counts[s.value] = 0; });
    all.forEach(f => { if (counts[f.statut] !== undefined) counts[f.statut]++; });

    /* KPIs financiers */
    let totalAEncaisser = 0;
    let totalEnRetard   = 0;
    let totalEncaisse   = 0;
    all.forEach(f => {
      if (f.statut === 'soldee' || f.statut === 'annulee') return;
      const solde = _getSolde(f);
      if (solde > 0) {
        totalAEncaisser += solde;
        if (f.dateLimitePaiement && new Date(f.dateLimitePaiement) < today) {
          totalEnRetard += solde;
        }
      }
    });
    all.forEach(f => {
      (f.encaissements || []).forEach(e => { totalEncaisse += (parseFloat(e.montant) || 0); });
    });

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
      const msg    = all.length === 0 ? 'Aucune facture enregistrée.' : 'Aucune facture pour ces critères.';
      const addBtn = all.length === 0 ? '<button class="btn btn-primary" id="btn-empty-add">Créer la première facture</button>' : '';
      bodyHTML = '<div class="empty-state"><div class="empty-icon">&#128185;</div><p>' + msg + '</p>' + addBtn + '</div>';
    }

    _container.innerHTML =
      '<div class="page-header">' +
        '<div>' +
          '<h1>Factures</h1>' +
          '<span class="text-muted" style="font-size:0.82rem;">' + all.length + ' facture' + (all.length > 1 ? 's' : '') + ' enregistrée' + (all.length > 1 ? 's' : '') + '</span>' +
        '</div>' +
        '<div class="actions"><button class="btn btn-primary" id="btn-add-facture">+ Nouvelle facture</button></div>' +
      '</div>' +

      '<div class="kpi-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-bottom:16px;">' +
        '<div class="kpi-card"><div class="kpi-label">Total</div><div class="kpi-value">' + all.length + '</div></div>' +
        '<div class="kpi-card' + (totalAEncaisser > 0 ? ' kpi-warning' : '') + '"><div class="kpi-label">À encaisser</div><div class="kpi-value" style="font-size:1.1rem;">' + _fmtEur(totalAEncaisser) + '</div><div class="kpi-detail">émises + part. payées</div></div>' +
        '<div class="kpi-card' + (totalEnRetard > 0 ? ' kpi-alert' : '') + '"><div class="kpi-label">En retard</div><div class="kpi-value" style="font-size:1.1rem;">' + _fmtEur(totalEnRetard) + '</div><div class="kpi-detail">échéance dépassée</div></div>' +
        '<div class="kpi-card kpi-success"><div class="kpi-label">Encaissé (total)</div><div class="kpi-value" style="font-size:1.1rem;">' + _fmtEur(totalEncaisse) + '</div></div>' +
        '<div class="kpi-card"><div class="kpi-label">Soldées</div><div class="kpi-value">' + (counts['soldee'] || 0) + '</div></div>' +
      '</div>' +

      '<div class="card" style="margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
          '<div class="search-bar" style="flex:1;min-width:200px;">' +
            '<span class="search-icon">&#128269;</span>' +
            '<input type="text" id="fac-search" placeholder="Rechercher par numéro, titre, destinataire…" value="' + _escAttr(_searchTerm) + '" />' +
          '</div>' +
          '<select class="form-control" id="fac-filter-status" style="width:180px;">' +
            '<option value="">Tous les statuts</option>' +
            STATUTS.map(s => '<option value="' + s.value + '"' + (_filterStatus === s.value ? ' selected' : '') + '>' + _esc(s.label) + '</option>').join('') +
          '</select>' +
        '</div>' +
        '<div style="margin-top:10px;">' + pillsHTML + '</div>' +
      '</div>' +

      '<div class="card">' + bodyHTML + '</div>';

    _bindPageEvents();
  }

  /* ----------------------------------------------------------
     FILTRAGE
     ---------------------------------------------------------- */

  function _applyFilters(list) {
    let r = list;
    if (_filterStatus) r = r.filter(f => f.statut === _filterStatus);
    if (_searchTerm) {
      const q = _searchTerm.toLowerCase();
      r = r.filter(f => {
        const dest = _getDestinataireLabel(f).toLowerCase();
        return (f.numero || '').toLowerCase().includes(q) ||
               (f.titre  || '').toLowerCase().includes(q) ||
               dest.includes(q);
      });
    }
    r.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return r;
  }

  /* ----------------------------------------------------------
     HELPERS METIER
     ---------------------------------------------------------- */

  function _getDestinataireLabel(f) {
    if (f.clientId) {
      const c = DB.clients.getById(f.clientId);
      if (c) return c.name || '\u2014';
    }
    if (f.prospectId) {
      const p = DB.prospects.getById(f.prospectId);
      if (p) return (p.organisation || ((p.prenom || '') + ' ' + (p.nom || '')).trim() || '\u2014');
    }
    return f.destinataireNom || '\u2014';
  }

  function _getSolde(f) {
    const ttc  = parseFloat(f.totalTTC) || 0;
    const encl = (f.encaissements || []).reduce((s, e) => s + (parseFloat(e.montant) || 0), 0);
    return _round2(ttc - encl);
  }

  function _getEncaisse(f) {
    return (f.encaissements || []).reduce((s, e) => s + (parseFloat(e.montant) || 0), 0);
  }

  function _statutTag(statut) {
    const s     = STATUTS.find(st => st.value === statut);
    const label = s ? s.label : statut;
    const style = STATUT_STYLE[statut] || '';
    return '<span class="tag" style="' + style + '">' + label + '</span>';
  }

  function _echeanceTag(f, today) {
    if (!f.dateLimitePaiement) return '\u2014';
    const d   = new Date(f.dateLimitePaiement);
    const str = d.toLocaleDateString('fr-FR');
    if (f.statut === 'soldee' || f.statut === 'annulee') {
      return '<span class="text-muted" style="font-size:0.8rem;">' + str + '</span>';
    }
    if (d < today && _getSolde(f) > 0) {
      const days = Math.ceil((today - d) / 86400000);
      return '<span style="background:rgba(211,47,47,0.15);color:#d32f2f;font-size:0.78rem;padding:2px 6px;border-radius:3px;" title="En retard de ' + days + ' jour(s)">&#9888; ' + str + '</span>';
    }
    return '<span class="text-muted" style="font-size:0.8rem;">' + str + '</span>';
  }

  /* ----------------------------------------------------------
     TABLEAU
     ---------------------------------------------------------- */

  function _renderTable(list, today) {
    let rows = '';
    list.forEach(f => {
      const dest     = _getDestinataireLabel(f);
      const solde    = _getSolde(f);
      const encaisse = _getEncaisse(f);

      /* Actions selon statut */
      let actions = '';
      if (f.statut === 'brouillon') {
        actions += '<button class="btn btn-sm btn-fac-statut" data-id="' + f.id + '" data-next="emise" title="Émettre la facture" style="color:#1e88e5;">&#9993;&nbsp;Émettre</button>';
      }
      if (f.statut === 'emise' || f.statut === 'partiellement_payee') {
        actions += '<button class="btn btn-sm btn-fac-encaissement" data-id="' + f.id + '" title="Enregistrer un encaissement" style="color:#2e7d32;">&#8853;&nbsp;Encaissement</button>';
      }

      rows +=
        '<tr>' +
          '<td><strong class="text-mono" style="font-size:0.85rem;">' + _esc(f.numero || '\u2014') + '</strong>' +
            (f.devisNumero ? '<br><small class="text-muted">Devis\u00a0' + _esc(f.devisNumero) + '</small>' : '') +
          '</td>' +
          '<td>' + _esc(dest) + '</td>' +
          '<td>' +
            _esc(f.titre || '\u2014') +
            (f.objet ? '<br><small class="text-muted">' + _esc(f.objet.length > 50 ? f.objet.substring(0, 50) + '\u2026' : f.objet) + '</small>' : '') +
          '</td>' +
          '<td class="text-mono" style="font-size:0.9rem;"><strong>' + _fmtEur(f.totalTTC || 0) + '</strong><br><small class="text-muted">HT\u00a0' + _fmtEur(f.totalHT || 0) + '</small></td>' +
          '<td class="text-mono" style="font-size:0.85rem;">' + (encaisse > 0 ? '<span style="color:#2e7d32;">' + _fmtEur(encaisse) + '</span>' : '\u2014') + '</td>' +
          '<td class="text-mono" style="font-size:0.85rem;">' + (solde > 0 ? '<strong style="color:' + (f.dateLimitePaiement && new Date(f.dateLimitePaiement) < today ? '#d32f2f' : '#f57c00') + ';">' + _fmtEur(solde) + '</strong>' : (f.statut === 'soldee' ? '<span style="color:#2e7d32;">Soldée</span>' : '\u2014')) + '</td>' +
          '<td>' + _statutTag(f.statut) + '</td>' +
          '<td>' + _echeanceTag(f, today) + '</td>' +
          '<td class="actions-cell">' +
            '<button class="btn btn-sm btn-fac-edit"    data-id="' + f.id + '" title="Éditer">&#9998;</button>' +
            '<button class="btn btn-sm btn-fac-pdf"     data-id="' + f.id + '" title="Aperçu PDF">&#128196;</button>' +
            actions +
            (f.statut === 'brouillon'
              ? '<button class="btn btn-sm btn-fac-delete" data-id="' + f.id + '" title="Supprimer" style="color:var(--color-danger);">&#128465;</button>'
              : '<button class="btn btn-sm btn-fac-dupliquer" data-id="' + f.id + '" title="Dupliquer en brouillon" style="color:var(--text-muted);">&#128203;</button>') +
          '</td>' +
        '</tr>';
    });

    return '<div class="data-table-wrap"><table class="data-table">' +
      '<thead><tr>' +
        '<th>Numéro</th>' +
        '<th>Destinataire</th>' +
        '<th>Titre</th>' +
        '<th>Total TTC</th>' +
        '<th>Encaissé</th>' +
        '<th>Solde</th>' +
        '<th>Statut</th>' +
        '<th>Échéance</th>' +
        '<th class="text-right">Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table></div>';
  }

  /* ----------------------------------------------------------
     EVENEMENTS PAGE
     ---------------------------------------------------------- */

  function _bindPageEvents() {
    const c = _container;

    const btnAdd = c.querySelector('#btn-add-facture');
    if (btnAdd) btnAdd.addEventListener('click', () => _openModal(null));

    const btnEmptyAdd = c.querySelector('#btn-empty-add');
    if (btnEmptyAdd) btnEmptyAdd.addEventListener('click', () => _openModal(null));

    const search = c.querySelector('#fac-search');
    if (search) search.addEventListener('input', e => { _searchTerm = e.target.value; _renderPage(); });

    const filterSel = c.querySelector('#fac-filter-status');
    if (filterSel) filterSel.addEventListener('change', e => { _filterStatus = e.target.value; _renderPage(); });

    c.querySelectorAll('[data-pill]').forEach(pill => {
      pill.addEventListener('click', () => {
        _filterStatus = _filterStatus === pill.dataset.pill ? '' : pill.dataset.pill;
        _renderPage();
      });
    });

    const pillReset = c.querySelector('#pill-reset');
    if (pillReset) pillReset.addEventListener('click', () => { _filterStatus = ''; _renderPage(); });

    _attachTableEvents(c);
  }

  function _attachTableEvents(c) {
    c.querySelectorAll('.btn-fac-edit').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _openModal(btn.dataset.id); });
    });

    c.querySelectorAll('.btn-fac-pdf').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _previewPdf(btn.dataset.id); });
    });

    c.querySelectorAll('.btn-fac-statut').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _changerStatut(btn.dataset.id, btn.dataset.next); });
    });

    c.querySelectorAll('.btn-fac-encaissement').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _openEncaissementModal(btn.dataset.id); });
    });

    c.querySelectorAll('.btn-fac-delete').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _deleteFacture(btn.dataset.id); });
    });

    c.querySelectorAll('.btn-fac-dupliquer').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); _dupliquer(btn.dataset.id); });
    });
  }

  /* ----------------------------------------------------------
     TRANSITIONS DE STATUT
     ---------------------------------------------------------- */

  function _changerStatut(id, nextStatut) {
    const f = DB.factures.getById(id);
    if (!f) return;
    const labels = { emise: 'Émise', annulee: 'Annulée', soldee: 'Soldée' };
    if (!confirm('Passer la facture ' + (f.numero || '') + ' en statut « ' + (labels[nextStatut] || nextStatut) + ' » ?')) return;
    const update = { statut: nextStatut };
    if (nextStatut === 'emise' && !f.dateEmission) {
      update.dateEmission = new Date().toISOString().slice(0, 10);
      const delai = f.paiementDelaiJours || 30;
      const lim   = new Date();
      lim.setDate(lim.getDate() + delai);
      update.dateLimitePaiement = lim.toISOString().slice(0, 10);
    }
    DB.factures.update(id, update);
    if (typeof Toast !== 'undefined') Toast.show('Statut mis à jour.', 'success');
    _renderPage();
  }

  /* ----------------------------------------------------------
     SUPPRESSION
     ---------------------------------------------------------- */

  function _deleteFacture(id) {
    const f = DB.factures.getById(id);
    if (!f) return;
    if (!confirm('Supprimer la facture ' + (f.numero || '') + ' ?\nCette action est irréversible.')) return;
    DB.factures.delete(id);
    _renderPage();
  }

  /* ----------------------------------------------------------
     DUPLICATION
     ---------------------------------------------------------- */

  function _dupliquer(id) {
    const f = DB.factures.getById(id);
    if (!f) return;
    const numero = DB.getNextNumeroFacture();
    const copy   = Object.assign({}, f, {
      id:            DB.generateId ? DB.generateId() : (Date.now() + Math.random()).toString(36),
      numero,
      statut:        'brouillon',
      dateEmission:  '',
      dateLimitePaiement: '',
      encaissements: [],
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString()
    });
    delete copy.id; /* createCRUD will generate a new id */
    DB.factures.create(copy);
    if (typeof Toast !== 'undefined') Toast.show('Facture dupliquée en brouillon : ' + numero, 'success');
    _renderPage();
  }

  /* ----------------------------------------------------------
     APERCU PDF
     ---------------------------------------------------------- */

  function _previewPdf(id) {
    const f = DB.factures.getById(id);
    if (!f) return;

    let dest = { organisation: '', contact: '', email: '', telephone: '' };
    if (f.clientId) {
      const c = DB.clients.getById(f.clientId);
      if (c) {
        dest.organisation = c.name || '';
        dest.contact      = c.contactName || '';
        dest.email        = c.contactEmail || '';
        dest.telephone    = c.contactPhone || '';
      }
    } else if (f.prospectId) {
      const p = DB.prospects.getById(f.prospectId);
      if (p) {
        dest.organisation = p.organisation || '';
        dest.contact      = ((p.prenom || '') + ' ' + (p.nom || '')).trim();
        dest.email        = p.email || '';
        dest.telephone    = p.telephone || '';
      }
    } else if (f.destinataireNom) {
      dest.organisation = f.destinataireNom;
    }

    const ttc        = parseFloat(f.totalTTC) || 0;
    const encaisse   = _getEncaisse(f);
    const solde      = _round2(ttc - encaisse);
    const acomptePct = parseFloat(f.acomptePercent) || 0;
    const acompte    = _round2(ttc * acomptePct / 100);

    const settings = DB.settings.get();
    const payload = {
      numero:              f.numero,
      titre:               f.titre,
      objet:               f.objet,
      dateEmission:        f.dateEmission || f.createdAt,
      dateLimitePaiement:  f.dateLimitePaiement,
      devisNumero:         f.devisNumero || '',
      destinataire:        dest,
      lignes:              f.lignes || [],
      totalHT:             f.totalHT,
      tauxTVA:             f.tauxTVA,
      totalTVA:            f.totalTVA,
      totalTTC:            f.totalTTC,
      acomptePercent:      acomptePct,
      acompteMontant:      acompte,
      soldeRestant:        solde,
      paiementDelaiJours:  f.paiementDelaiJours || 30,
      entreprise:          settings.entreprise || {}
    };

    const encoded = encodeURIComponent(JSON.stringify(payload));
    window.open('vitrine/templates/facture-template.html?data=' + encoded, '_blank');
  }

  /* ----------------------------------------------------------
     LIGNES — GESTION
     ---------------------------------------------------------- */

  function _renderFacLignes(overlay) {
    const wrap = overlay.querySelector('#fac-lignes-wrap');
    if (!wrap) return;

    const settings = DB.settings.get();
    const tva      = parseFloat(overlay.querySelector('#fac-tva') ? overlay.querySelector('#fac-tva').value : (settings.vatRate || 20)) || 20;

    let html = '<table class="data-table" style="margin-bottom:8px;">' +
      '<thead><tr>' +
        '<th style="width:44%;">Description</th>' +
        '<th style="width:14%;">Qté</th>' +
        '<th style="width:18%;">Prix HT</th>' +
        '<th style="width:18%;">Total HT</th>' +
        '<th style="width:6%;"></th>' +
      '</tr></thead><tbody>';

    _facLignes.forEach((l, i) => {
      html +=
        '<tr>' +
          '<td><input type="text"   class="form-control" style="min-width:0;" data-li="' + i + '" data-field="description" value="' + _escAttr(l.description || '') + '" placeholder="Description…" /></td>' +
          '<td><input type="number" class="form-control" style="min-width:0;" data-li="' + i + '" data-field="quantite"    value="' + (l.quantite || 1)     + '" min="0.01" step="0.01" /></td>' +
          '<td><input type="number" class="form-control" style="min-width:0;" data-li="' + i + '" data-field="prix"        value="' + (l.prixUnitaireHT || 0) + '" min="0" step="0.01" /></td>' +
          '<td class="text-mono" style="font-size:0.85rem;text-align:right;vertical-align:middle;">' + _fmtEur(l.totalHT || 0) + '</td>' +
          '<td style="text-align:center;vertical-align:middle;">' +
            (_facLignes.length > 1 ? '<button type="button" class="btn btn-sm btn-fac-rm-ligne" data-li="' + i + '" style="color:var(--color-danger);padding:2px 6px;">×</button>' : '') +
          '</td>' +
        '</tr>';
    });

    html += '</tbody></table>' +
      '<button type="button" class="btn btn-sm" id="btn-fac-add-ligne" style="margin-top:4px;">+ Ajouter une ligne</button>';

    wrap.innerHTML = html;
    _updateFacTotaux(overlay);

    /* Liaisons lignes */
    wrap.querySelectorAll('input[data-li]').forEach(inp => {
      inp.addEventListener('change', () => {
        _syncFacLignesFromDom(overlay);
        _renderFacLignes(overlay);
      });
      inp.addEventListener('input', () => {
        _syncFacLignesFromDom(overlay);
        _updateFacTotaux(overlay);
      });
    });

    wrap.querySelectorAll('.btn-fac-rm-ligne').forEach(btn => {
      btn.addEventListener('click', () => {
        _facLignes.splice(parseInt(btn.dataset.li), 1);
        _renderFacLignes(overlay);
      });
    });

    const btnAdd = wrap.querySelector('#btn-fac-add-ligne');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        _facLignes.push({ description: '', quantite: 1, prixUnitaireHT: 0, totalHT: 0 });
        _renderFacLignes(overlay);
      });
    }
  }

  function _syncFacLignesFromDom(overlay) {
    const wrap = overlay.querySelector('#fac-lignes-wrap');
    if (!wrap) return;
    wrap.querySelectorAll('tr[data-li], tbody tr').forEach((row, i) => {
      if (i >= _facLignes.length) return;
      const desc = row.querySelector('[data-field="description"]');
      const qty  = row.querySelector('[data-field="quantite"]');
      const prix = row.querySelector('[data-field="prix"]');
      if (desc) _facLignes[i].description = desc.value;
      if (qty)  _facLignes[i].quantite     = parseFloat(qty.value) || 1;
      if (prix) _facLignes[i].prixUnitaireHT = parseFloat(prix.value) || 0;
      _facLignes[i].totalHT = _round2(_facLignes[i].quantite * _facLignes[i].prixUnitaireHT);
    });
  }

  function _updateFacTotaux(overlay) {
    const tvaEl = overlay.querySelector('#fac-tva');
    const tva   = parseFloat(tvaEl ? tvaEl.value : 20) || 0;

    let ht = 0;
    _facLignes.forEach(l => { ht += _round2((parseFloat(l.quantite) || 1) * (parseFloat(l.prixUnitaireHT) || 0)); });
    const tvaAmt = _round2(ht * tva / 100);
    const ttc    = _round2(ht + tvaAmt);

    const elHT  = overlay.querySelector('#fac-total-ht');
    const elTVA = overlay.querySelector('#fac-total-tva');
    const elTTC = overlay.querySelector('#fac-total-ttc');
    if (elHT)  elHT.textContent  = _fmtEur(ht);
    if (elTVA) elTVA.textContent = _fmtEur(tvaAmt);
    if (elTTC) elTTC.textContent = _fmtEur(ttc);
  }

  /* ----------------------------------------------------------
     MODAL CREATION / EDITION
     ---------------------------------------------------------- */

  function _openModal(id, prefill) {
    const isEdit   = !!id;
    const existing = isEdit ? DB.factures.getById(id) : null;
    const settings = DB.settings.get();
    const vatRate  = settings.vatRate || 20;

    function v(field, fallback) {
      return (isEdit && existing && existing[field] != null) ? existing[field] : (prefill && prefill[field] != null ? prefill[field] : (fallback !== undefined ? fallback : ''));
    }

    /* Lignes */
    const srcLignes = (isEdit && existing && existing.lignes && existing.lignes.length)
      ? existing.lignes
      : (prefill && prefill.lignes && prefill.lignes.length ? prefill.lignes : []);
    _facLignes = srcLignes.length
      ? srcLignes.map(l => Object.assign({}, l))
      : [{ description: '', quantite: 1, prixUnitaireHT: 0, totalHT: 0 }];

    const clients   = DB.clients.getAll().filter(c => c.active !== false);
    const prospects = DB.prospects ? DB.prospects.getAll().filter(p => p.statut !== 'perdu') : [];

    const destMode  = (v('prospectId')) ? 'prospect' : 'client';

    const clientOptions = '<option value="">\u2014 Sélectionner \u2014</option>' +
      clients.map(c => '<option value="' + _escAttr(c.id) + '"' + (v('clientId') === c.id ? ' selected' : '') + '>' + _esc(c.name || '\u2014') + '</option>').join('');

    const prospectOptions = '<option value="">\u2014 Sélectionner \u2014</option>' +
      prospects.map(p => {
        const label = ((p.prenom || '') + ' ' + (p.nom || '')).trim() + (p.organisation ? ' — ' + p.organisation : '');
        return '<option value="' + _escAttr(p.id) + '"' + (v('prospectId') === p.id ? ' selected' : '') + '>' + _esc(label) + '</option>';
      }).join('');

    /* Devis pour lien optionnel */
    const devisAcceptes = DB.devis ? DB.devis.getAll().filter(d => d.statut === 'accepte') : [];
    const devisOptions  = '<option value="">\u2014 Aucun \u2014</option>' +
      devisAcceptes.map(d => '<option value="' + _escAttr(d.id) + '"' + (v('devisId') === d.id ? ' selected' : '') + '>' + _esc((d.numero || '') + (d.titre ? ' — ' + d.titre : '')) + '</option>').join('');

    const todayStr = new Date().toISOString().slice(0, 10);
    const limDef   = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id        = 'facture-modal-overlay';

    overlay.innerHTML =
      '<div class="modal modal-lg">' +
        '<div class="modal-header">' +
          '<h2>' + (isEdit ? 'Modifier la facture' : 'Nouvelle facture') + '</h2>' +
          '<button class="btn btn-sm btn-ghost" id="fac-modal-close">&times;</button>' +
        '</div>' +
        '<div class="modal-body" style="max-height:74vh;overflow-y:auto;">' +

          /* En-tête */
          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">En-tête</div>' +
          '<div class="form-row">' +
            '<div class="form-group" style="flex:2;"><label>Titre *</label><input type="text" id="fac-titre" class="form-control" value="' + _escAttr(v('titre')) + '" placeholder="Ex : Prestation formation Police Municipale" /></div>' +
            '<div class="form-group"><label>Délai paiement (jours)</label><input type="number" id="fac-delai" class="form-control" min="1" value="' + _escAttr(v('paiementDelaiJours', 30)) + '" /></div>' +
          '</div>' +
          '<div class="form-group"><label>Objet</label><textarea id="fac-objet" class="form-control" rows="2" placeholder="Objet ou référence de la prestation…">' + _esc(v('objet')) + '</textarea></div>' +

          /* Dates */
          '<div class="form-row">' +
            '<div class="form-group"><label>Date d\'émission</label><input type="date" id="fac-date-emission" class="form-control" value="' + _escAttr(v('dateEmission', todayStr)) + '" /></div>' +
            '<div class="form-group"><label>Échéance</label><input type="date" id="fac-date-limite" class="form-control" value="' + _escAttr(v('dateLimitePaiement', limDef)) + '" /></div>' +
          '</div>' +

          /* Devis source */
          '<div class="form-group">' +
            '<label>Devis source <small class="text-muted">(optionnel)</small></label>' +
            '<select id="fac-devis-src" class="form-control">' + devisOptions + '</select>' +
          '</div>' +

          /* Destinataire */
          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Destinataire</div>' +
          '<div class="form-group">' +
            '<div style="display:flex;gap:16px;margin-bottom:8px;">' +
              '<label class="form-check"><input type="radio" name="fac-dest-mode" value="client"' + (destMode === 'client' ? ' checked' : '') + '><span>Client</span></label>' +
              '<label class="form-check"><input type="radio" name="fac-dest-mode" value="prospect"' + (destMode !== 'client' ? ' checked' : '') + '><span>Prospect</span></label>' +
            '</div>' +
            '<div id="fac-dest-client"' + (destMode !== 'client' ? ' style="display:none;"' : '') + '>' +
              (clients.length ? '<select id="fac-client" class="form-control">' + clientOptions + '</select>' : '<p class="text-muted" style="font-size:0.85rem;">Aucun client actif.</p>') +
            '</div>' +
            '<div id="fac-dest-prospect"' + (destMode === 'client' ? ' style="display:none;"' : '') + '>' +
              (prospects.length ? '<select id="fac-prospect" class="form-control">' + prospectOptions + '</select>' : '<p class="text-muted" style="font-size:0.85rem;">Aucun prospect.</p>') +
            '</div>' +
          '</div>' +

          /* TVA */
          '<div class="form-group" style="max-width:200px;">' +
            '<label>Taux TVA (%)</label>' +
            '<input type="number" id="fac-tva" class="form-control" min="0" max="100" step="0.1" value="' + _escAttr(v('tauxTVA', vatRate)) + '" />' +
          '</div>' +

          /* Lignes */
          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Lignes de facturation</div>' +
          '<div id="fac-lignes-wrap"></div>' +

          /* Totaux */
          '<div style="display:flex;justify-content:flex-end;margin-top:12px;">' +
            '<div style="width:260px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:6px;padding:12px 14px;">' +
              '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.9rem;border-bottom:1px solid var(--border-color);">' +
                '<span class="text-muted">Total HT</span><span id="fac-total-ht">\u2014</span>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.9rem;border-bottom:1px solid var(--border-color);">' +
                '<span class="text-muted">TVA</span><span id="fac-total-tva">\u2014</span>' +
              '</div>' +
              '<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:1.05rem;font-weight:700;color:var(--text-primary);">' +
                '<span>Total TTC</span><span id="fac-total-ttc">\u2014</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Conditions paiement */
          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Conditions de paiement</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Acompte demandé (%)</label><input type="number" id="fac-acompte-pct" class="form-control" min="0" max="100" value="' + _escAttr(v('acomptePercent', 0)) + '" /></div>' +
          '</div>' +

        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-ghost" id="fac-modal-cancel">Annuler</button>' +
          '<button class="btn btn-primary" id="fac-modal-save">&#10003;&nbsp;' + (isEdit ? 'Enregistrer' : 'Créer la facture') + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    /* Render lignes après insertion */
    _renderFacLignes(overlay);

    /* Listener TVA → recalc */
    const tvaInput = overlay.querySelector('#fac-tva');
    if (tvaInput) tvaInput.addEventListener('input', () => _updateFacTotaux(overlay));

    /* Délai → calcul date limite */
    const delaiInput = overlay.querySelector('#fac-delai');
    const dateEmInput = overlay.querySelector('#fac-date-emission');
    const dateLimInput = overlay.querySelector('#fac-date-limite');
    function _recomputeLim() {
      const emDate = dateEmInput ? dateEmInput.value : '';
      const delai  = parseInt(delaiInput ? delaiInput.value : 30) || 30;
      if (emDate) {
        const d = new Date(emDate);
        d.setDate(d.getDate() + delai);
        if (dateLimInput) dateLimInput.value = d.toISOString().slice(0, 10);
      }
    }
    if (delaiInput)  delaiInput.addEventListener('change', _recomputeLim);
    if (dateEmInput) dateEmInput.addEventListener('change', _recomputeLim);

    /* Devis source → remplissage auto */
    const devisSrc = overlay.querySelector('#fac-devis-src');
    if (devisSrc) {
      devisSrc.addEventListener('change', () => {
        const dv = DB.devis ? DB.devis.getById(devisSrc.value) : null;
        if (!dv) return;
        const titreEl = overlay.querySelector('#fac-titre');
        const objetEl = overlay.querySelector('#fac-objet');
        if (titreEl && !titreEl.value) titreEl.value = dv.titre || '';
        if (objetEl && !objetEl.value) objetEl.value = dv.objet || '';
        if (dv.lignes && dv.lignes.length) {
          _facLignes = dv.lignes.map(l => Object.assign({}, l));
          _renderFacLignes(overlay);
        }
        /* Destinataire auto */
        if (dv.clientId) {
          const radClient = overlay.querySelector('input[name="fac-dest-mode"][value="client"]');
          if (radClient) { radClient.checked = true; overlay.querySelector('#fac-dest-client').style.display = ''; overlay.querySelector('#fac-dest-prospect').style.display = 'none'; }
          const sel = overlay.querySelector('#fac-client');
          if (sel) sel.value = dv.clientId;
        } else if (dv.prospectId) {
          const radProsp = overlay.querySelector('input[name="fac-dest-mode"][value="prospect"]');
          if (radProsp) { radProsp.checked = true; overlay.querySelector('#fac-dest-prospect').style.display = ''; overlay.querySelector('#fac-dest-client').style.display = 'none'; }
          const sel = overlay.querySelector('#fac-prospect');
          if (sel) sel.value = dv.prospectId;
        }
      });
    }

    /* Mode destinataire */
    overlay.querySelectorAll('input[name="fac-dest-mode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        overlay.querySelector('#fac-dest-client').style.display   = radio.value === 'client' ? '' : 'none';
        overlay.querySelector('#fac-dest-prospect').style.display = radio.value === 'prospect' ? '' : 'none';
      });
    });

    /* Fermeture */
    function _close() { overlay.remove(); }
    overlay.querySelector('#fac-modal-close').addEventListener('click', _close);
    overlay.querySelector('#fac-modal-cancel').addEventListener('click', _close);
    overlay.addEventListener('click', e => { if (e.target === overlay) _close(); });

    /* Sauvegarde */
    overlay.querySelector('#fac-modal-save').addEventListener('click', () => _saveFacture(overlay, id));
  }

  /* ----------------------------------------------------------
     SAUVEGARDE
     ---------------------------------------------------------- */

  function _saveFacture(overlay, id) {
    const isEdit = !!id;

    const titre = (overlay.querySelector('#fac-titre').value || '').trim();
    if (!titre) {
      if (typeof Toast !== 'undefined') Toast.show('Le titre est obligatoire.', 'error');
      overlay.querySelector('#fac-titre').focus();
      return;
    }

    _syncFacLignesFromDom(overlay);

    const tva    = parseFloat(overlay.querySelector('#fac-tva').value) || 0;
    let ht = 0;
    _facLignes.forEach(l => { ht += _round2(l.quantite * l.prixUnitaireHT); });
    const tvaAmt = _round2(ht * tva / 100);
    const ttc    = _round2(ht + tvaAmt);

    const destMode = overlay.querySelector('input[name="fac-dest-mode"]:checked').value;
    const clientId   = destMode === 'client'   ? (overlay.querySelector('#fac-client')   || {}).value || '' : '';
    const prospectId = destMode === 'prospect' ? (overlay.querySelector('#fac-prospect') || {}).value || '' : '';

    const devisSrcEl = overlay.querySelector('#fac-devis-src');
    const devisId    = devisSrcEl ? devisSrcEl.value : '';
    let devisNumero  = '';
    if (devisId) {
      const dv = DB.devis ? DB.devis.getById(devisId) : null;
      if (dv) devisNumero = dv.numero || '';
    }

    const data = {
      titre,
      objet:               (overlay.querySelector('#fac-objet').value || '').trim(),
      dateEmission:        overlay.querySelector('#fac-date-emission').value || '',
      dateLimitePaiement:  overlay.querySelector('#fac-date-limite').value || '',
      paiementDelaiJours:  parseInt(overlay.querySelector('#fac-delai').value) || 30,
      clientId,
      prospectId,
      devisId,
      devisNumero,
      lignes:    _facLignes.map(l => Object.assign({}, l)),
      tauxTVA:   tva,
      totalHT:   ht,
      totalTVA:  tvaAmt,
      totalTTC:  ttc,
      acomptePercent: parseFloat(overlay.querySelector('#fac-acompte-pct').value) || 0
    };

    if (isEdit) {
      DB.factures.update(id, data);
      if (typeof Toast !== 'undefined') Toast.show('Facture mise à jour.', 'success');
    } else {
      data.numero        = DB.getNextNumeroFacture();
      data.statut        = 'brouillon';
      data.encaissements = [];
      DB.factures.create(data);
      if (typeof Toast !== 'undefined') Toast.show('Facture ' + data.numero + ' créée.', 'success');
    }

    overlay.remove();
    _renderPage();
  }

  /* ----------------------------------------------------------
     MODAL ENCAISSEMENT
     ---------------------------------------------------------- */

  function _openEncaissementModal(factureId) {
    const f = DB.factures.getById(factureId);
    if (!f) return;

    const solde     = _getSolde(f);
    const encaisses = f.encaissements || [];

    const todayStr = new Date().toISOString().slice(0, 10);

    let encHist = '';
    if (encaisses.length) {
      encHist = '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Historique des encaissements</div>' +
        '<table class="data-table" style="margin-bottom:16px;"><thead><tr><th>Date</th><th>Montant</th><th>Mode</th><th>Réf.</th><th></th></tr></thead><tbody>' +
        encaisses.map(e =>
          '<tr>' +
            '<td class="text-mono" style="font-size:0.82rem;">' + _esc(e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '\u2014') + '</td>' +
            '<td class="text-mono"><strong>' + _fmtEur(e.montant) + '</strong></td>' +
            '<td>' + _esc(MODES_PAIEMENT.find(m => m.value === e.mode) ? MODES_PAIEMENT.find(m => m.value === e.mode).label : (e.mode || '\u2014')) + '</td>' +
            '<td class="text-muted" style="font-size:0.82rem;">' + _esc(e.reference || '') + '</td>' +
            '<td><button type="button" class="btn btn-sm btn-enc-del" data-eid="' + e.id + '" style="color:var(--color-danger);padding:2px 6px;">×</button></td>' +
          '</tr>'
        ).join('') +
        '</tbody></table>';
    }

    const modesOptions = MODES_PAIEMENT.map(m => '<option value="' + m.value + '">' + m.label + '</option>').join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id        = 'enc-modal-overlay';

    overlay.innerHTML =
      '<div class="modal">' +
        '<div class="modal-header">' +
          '<h2>Encaissement — ' + _esc(f.numero || '') + '</h2>' +
          '<button class="btn btn-sm btn-ghost" id="enc-modal-close">&times;</button>' +
        '</div>' +
        '<div class="modal-body" style="max-height:70vh;overflow-y:auto;">' +

          '<div style="display:flex;gap:16px;margin-bottom:16px;">' +
            '<div style="flex:1;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:6px;padding:10px 14px;text-align:center;">' +
              '<div class="text-muted" style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.8px;">Total TTC</div>' +
              '<div class="text-mono" style="font-size:1.1rem;font-weight:700;">' + _fmtEur(f.totalTTC || 0) + '</div>' +
            '</div>' +
            '<div style="flex:1;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:6px;padding:10px 14px;text-align:center;">' +
              '<div class="text-muted" style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.8px;">Encaissé</div>' +
              '<div class="text-mono" style="font-size:1.1rem;font-weight:700;color:#2e7d32;">' + _fmtEur(_getEncaisse(f)) + '</div>' +
            '</div>' +
            '<div style="flex:1;background:var(--bg-primary);border:1px solid ' + (solde > 0 ? '#f57c00' : 'var(--border-color)') + ';border-radius:6px;padding:10px 14px;text-align:center;">' +
              '<div class="text-muted" style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.8px;">Solde restant</div>' +
              '<div class="text-mono" style="font-size:1.1rem;font-weight:700;color:' + (solde > 0 ? '#f57c00' : '#2e7d32') + ';">' + _fmtEur(solde) + '</div>' +
            '</div>' +
          '</div>' +

          encHist +

          '<div class="section-label" style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Nouvel encaissement</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Date *</label><input type="date" id="enc-date" class="form-control" value="' + todayStr + '" /></div>' +
            '<div class="form-group"><label>Montant (€) *</label><input type="number" id="enc-montant" class="form-control" min="0.01" step="0.01" value="' + (solde > 0 ? solde.toFixed(2) : '') + '" placeholder="0.00" /></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group"><label>Mode de paiement</label><select id="enc-mode" class="form-control">' + modesOptions + '</select></div>' +
            '<div class="form-group"><label>Référence</label><input type="text" id="enc-ref" class="form-control" placeholder="N° chèque, virement…" /></div>' +
          '</div>' +
          '<div class="form-group"><label>Note</label><input type="text" id="enc-note" class="form-control" placeholder="Remarque optionnelle…" /></div>' +

        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-ghost" id="enc-modal-cancel">Fermer</button>' +
          '<button class="btn btn-primary" id="enc-modal-save">&#8853;&nbsp;Enregistrer l\'encaissement</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    /* Suppression d'un encaissement existant */
    overlay.querySelectorAll('.btn-enc-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const facturef = DB.factures.getById(factureId);
        if (!facturef) return;
        const updated = (facturef.encaissements || []).filter(e => e.id !== btn.dataset.eid);
        const newSolde = _round2((parseFloat(facturef.totalTTC) || 0) - updated.reduce((s, e) => s + (parseFloat(e.montant) || 0), 0));
        let newStatut  = facturef.statut;
        if (newSolde <= 0) newStatut = 'soldee';
        else if (updated.length > 0) newStatut = 'partiellement_payee';
        else newStatut = 'emise';
        DB.factures.update(factureId, { encaissements: updated, statut: newStatut });
        overlay.remove();
        _openEncaissementModal(factureId);
      });
    });

    /* Fermeture */
    function _close() { overlay.remove(); _renderPage(); }
    overlay.querySelector('#enc-modal-close').addEventListener('click', _close);
    overlay.querySelector('#enc-modal-cancel').addEventListener('click', _close);
    overlay.addEventListener('click', e => { if (e.target === overlay) _close(); });

    /* Sauvegarde encaissement */
    overlay.querySelector('#enc-modal-save').addEventListener('click', () => {
      const dateVal   = overlay.querySelector('#enc-date').value;
      const montant   = parseFloat(overlay.querySelector('#enc-montant').value);
      if (!dateVal) { if (typeof Toast !== 'undefined') Toast.show('La date est obligatoire.', 'error'); return; }
      if (!montant || montant <= 0) { if (typeof Toast !== 'undefined') Toast.show('Le montant doit être positif.', 'error'); return; }

      const mode      = overlay.querySelector('#enc-mode').value;
      const reference = (overlay.querySelector('#enc-ref').value || '').trim();
      const note      = (overlay.querySelector('#enc-note').value || '').trim();

      const facturef = DB.factures.getById(factureId);
      if (!facturef) return;

      const newEnc = {
        id:        (Date.now().toString(36) + Math.random().toString(36).slice(2)),
        date:      dateVal,
        montant:   _round2(montant),
        mode,
        reference,
        note
      };

      const updatedEncs = [...(facturef.encaissements || []), newEnc];
      const totalEnc    = updatedEncs.reduce((s, e) => s + (parseFloat(e.montant) || 0), 0);
      const newSolde    = _round2((parseFloat(facturef.totalTTC) || 0) - totalEnc);
      let newStatut     = facturef.statut;

      if (newSolde <= 0) {
        newStatut = 'soldee';
      } else if (totalEnc > 0) {
        newStatut = 'partiellement_payee';
      }

      DB.factures.update(factureId, { encaissements: updatedEncs, statut: newStatut });
      if (typeof Toast !== 'undefined') Toast.show('Encaissement de ' + _fmtEur(montant) + ' enregistré.', 'success');
      overlay.remove();
      _renderPage();
    });
  }

  /* ----------------------------------------------------------
     CREER DEPUIS UN DEVIS (appelé depuis devis.js)
     ---------------------------------------------------------- */

  function creerDepuisDevis(devisId) {
    const dv = DB.devis ? DB.devis.getById(devisId) : null;
    if (!dv) { if (typeof Toast !== 'undefined') Toast.show('Devis introuvable.', 'error'); return; }

    const prefill = {
      titre:       dv.titre || '',
      objet:       dv.objet || '',
      clientId:    dv.clientId || '',
      prospectId:  dv.prospectId || '',
      devisId:     dv.id,
      devisNumero: dv.numero || '',
      lignes:      (dv.lignes || []).map(l => Object.assign({}, l)),
      tauxTVA:     dv.tauxTVA,
      totalHT:     dv.totalHT,
      totalTVA:    dv.totalTVA,
      totalTTC:    dv.totalTTC
    };

    if (typeof App !== 'undefined' && App.navigate) App.navigate('factures');
    setTimeout(() => _openModal(null, prefill), 80);
  }

  /* ----------------------------------------------------------
     UTILITAIRES
     ---------------------------------------------------------- */

  function _fmtEur(n) {
    const val = parseFloat(n) || 0;
    return val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0\u20ac';
  }

  function _round2(n) { return Math.round((parseFloat(n) || 0) * 100) / 100; }

  function _esc(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _escAttr(str) { return _esc(str); }

  /* ----------------------------------------------------------
     API PUBLIQUE
     ---------------------------------------------------------- */

  /* --- API publique : ouvre le modal de création avec client pré-sélectionné --- */
  function openNewModal(clientId) {
    _openModal(null, null);
    if (!clientId) return;
    setTimeout(function() {
      var overlay = document.getElementById('facture-modal-overlay');
      if (!overlay) return;
      var radio = overlay.querySelector('[name="fac-dest-mode"][value="client"]');
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        var destClient = overlay.querySelector('#fac-dest-client');
        var destProspect = overlay.querySelector('#fac-dest-prospect');
        if (destClient) destClient.style.display = '';
        if (destProspect) destProspect.style.display = 'none';
      }
      var sel = overlay.querySelector('#fac-client');
      if (sel) sel.value = clientId;
    }, 60);
  }

  return { render, creerDepuisDevis, openNewModal };

})();
