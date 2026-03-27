/* ============================================================
   DST-SYSTEM — Vue Opérateurs (Vivier RH)
   Gestion complète du pool d'opérateurs : CRUD, calcul de coûts
   bidirectionnel, arbitrage RH multi-statuts.
   ============================================================ */

window.Views = window.Views || {};

Views.Operators = (() => {
  'use strict';

  /* ----------------------------------------------------------
     CONSTANTES
     ---------------------------------------------------------- */

  /** Correspondance statut → classe CSS du tag */
  const STATUS_TAG_CLASS = {
    freelance:          'tag-blue',
    interim:            'tag-yellow',
    cdd:                'tag-yellow',
    cdi:                'tag-green',
    contrat_journalier: 'tag-neutral',
    fondateur:          'tag-red'
  };

  /** Liste ordonnée des statuts pour les selects */
  const STATUS_OPTIONS = [
    'freelance',
    'interim',
    'contrat_journalier',
    'cdd',
    'cdi',
    'fondateur'
  ];

  /* ----------------------------------------------------------
     ÉTAT LOCAL DE LA VUE
     ---------------------------------------------------------- */

  /** Référence vers le conteneur DOM principal */
  let _container = null;

  /** Filtre de recherche courant (nom ou statut) */
  let _searchQuery = '';

  /** Filtre par statut ('' = tous) */
  let _statusFilter = '';

  /** Filtre par segment ('' = tous) */
  let _segmentFilter = '';

  /** Filtre par disponibilité ('' = tous) */
  let _dispoFilter = '';

  /** Périodes d'indisponibilité en cours d'édition dans le modal */
  let _modalIndispo = [];

  /* ----------------------------------------------------------
     POINT D'ENTRÉE — RENDER
     ---------------------------------------------------------- */

  /**
   * Rendu principal de la vue opérateurs.
   * @param {HTMLElement} container — élément DOM cible
   */
  function render(container) {
    _container = container;
    _searchQuery = '';
    _statusFilter = '';
    _segmentFilter = '';
    _dispoFilter = '';
    _renderPage();
  }

  /* ----------------------------------------------------------
     RENDU DE LA PAGE COMPLÈTE
     ---------------------------------------------------------- */

  /** Construit et injecte le HTML complet de la page */
  function _renderPage() {
    const operators = _getFilteredOperators();
    const allOperators = DB.operators.getAll();

    // KPI rapides
    const totalActive = allOperators.filter(op => op.active !== false).length;
    const totalPool = allOperators.length;
    const avgCost = _computeAverageCost(allOperators.filter(op => op.active !== false));

    _container.innerHTML = `
      <!-- En-tête de page -->
      <div class="page-header">
        <h1>Vivier RH — Opérateurs</h1>
        <div class="actions">
          <button class="btn btn-primary" id="btn-add-operator">+ Nouvel opérateur</button>
        </div>
      </div>

      <!-- KPI résumé -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Pool total</span>
          <span class="kpi-value">${totalPool}</span>
          <span class="kpi-detail">${totalActive} actif${totalActive > 1 ? 's' : ''}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Coût moyen / jour</span>
          <span class="kpi-value">${avgCost !== null ? Engine.fmt(avgCost) : '—'}</span>
          <span class="kpi-detail">Coût entreprise (actifs)</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Freelances</span>
          <span class="kpi-value">${allOperators.filter(o => o.status === 'freelance').length}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">CDI / Fondateurs</span>
          <span class="kpi-value">${allOperators.filter(o => o.status === 'cdi' || o.status === 'fondateur').length}</span>
        </div>
      </div>

      <!-- Barre de recherche et filtre -->
      <div class="card">
        <div class="flex-between gap-12" style="flex-wrap:wrap;">
          <div class="search-bar">
            <span class="search-icon">&#128269;</span>
            <input type="text" id="search-operators" placeholder="Rechercher par nom, spécialité…"
                   value="${_escapeAttr(_searchQuery)}" />
          </div>
          <div class="flex gap-8" style="align-items:center;">
            <label style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">Statut :</label>
            <select id="filter-status" class="form-control" style="width:auto;min-width:140px;">
              <option value="">Tous les statuts</option>
              ${STATUS_OPTIONS.map(s => `
                <option value="${s}" ${_statusFilter === s ? 'selected' : ''}>${Engine.statusLabel(s)}</option>
              `).join('')}
            </select>
          </div>
          <div class="flex gap-8" style="align-items:center;">
            <label style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">Segment :</label>
            <select id="filter-segment" class="form-control" style="width:auto;min-width:140px;">
              <option value="">Tous</option>
              <option value="institutionnel" ${_segmentFilter === 'institutionnel' ? 'selected' : ''}>Institutionnel</option>
              <option value="grand_compte"   ${_segmentFilter === 'grand_compte'   ? 'selected' : ''}>Grand Compte</option>
              <option value="b2b"            ${_segmentFilter === 'b2b'            ? 'selected' : ''}>B2B</option>
              <option value="b2c"            ${_segmentFilter === 'b2c'            ? 'selected' : ''}>B2C</option>
            </select>
          </div>
          <div class="flex gap-8" style="align-items:center;">
            <label style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">Dispo :</label>
            <select id="filter-dispo" class="form-control" style="width:auto;min-width:140px;">
              <option value="">Toutes</option>
              <option value="ponctuelle"  ${_dispoFilter === 'ponctuelle'  ? 'selected' : ''}>Ponctuelle</option>
              <option value="reguliere"   ${_dispoFilter === 'reguliere'   ? 'selected' : ''}>Régulière</option>
              <option value="temps_plein" ${_dispoFilter === 'temps_plein' ? 'selected' : ''}>Temps plein</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tableau des opérateurs -->
      <div class="card">
        ${operators.length === 0 ? _renderEmptyState() : _renderTable(operators)}
      </div>
    `;

    // Attacher les événements
    _bindPageEvents();
  }

  /* ----------------------------------------------------------
     RENDU DU TABLEAU
     ---------------------------------------------------------- */

  /**
   * Génère le HTML du tableau d'opérateurs.
   * @param {Array} operators — liste filtrée
   * @returns {string} HTML
   */
  function _renderTable(operators) {
    const settings = DB.settings.get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function _dispoBadge(op) {
      // Vérifier si en période d'indispo aujourd'hui
      const indispos = op.periodeIndispo || [];
      const estIndispo = indispos.some(function(p) {
        if (!p.debut || !p.fin) return false;
        const debut = new Date(p.debut);
        const fin   = new Date(p.fin);
        return today >= debut && today <= fin;
      });
      if (estIndispo) return '<span class="tag tag-red" style="font-size:0.7rem;">Indisponible</span>';
      const dt = op.disponibiliteType || 'ponctuelle';
      if (dt === 'temps_plein') return '<span class="tag tag-green" style="font-size:0.7rem;">Temps plein</span>';
      if (dt === 'reguliere')   return '<span class="tag tag-blue" style="font-size:0.7rem;">' + (op.joursDispoParMois || 0) + '\u00a0j/mois</span>';
      return '<span class="tag tag-neutral" style="font-size:0.7rem;">Ponctuel</span>';
    }

    const seuilPlancher = (settings.coutJournee && settings.coutJournee.coutOperateurJour) || 0;

    const rows = operators.map(op => {
      const coutJourOp = op.coutJournalierEntreprise || _getDisplayCost(op, settings) || null;
      const tagClass = STATUS_TAG_CLASS[op.status] || 'tag-neutral';
      const specialties = (op.specialites || op.specialties || []).join(', ') || '—';
      const activeLabel = op.active !== false
        ? '<span class="tag tag-green">Actif</span>'
        : '<span class="tag tag-neutral">Inactif</span>';

      const alertIcon = (coutJourOp && seuilPlancher > 0 && coutJourOp > seuilPlancher)
        ? ' <span title="Coût supérieur au seuil plancher" style="color:var(--color-warning);">⚠</span>'
        : '';
      const typeBadge = _typeContratBadge(op.typeContrat || op.status);
      const zoneDisplay = _escape(op.zoneLabel || op.villeBase || '—');

      return `
        <tr>
          <td><strong>${_escape(op.firstName)} ${_escape(op.lastName)}</strong></td>
          <td><span class="tag ${tagClass}">${Engine.statusLabel(op.status)}</span></td>
          <td class="num">${typeBadge} ${coutJourOp !== null ? Engine.fmt(coutJourOp) + alertIcon : '—'}</td>
          <td>${_escape(specialties)}</td>
          <td>${zoneDisplay}</td>
          <td>${activeLabel} ${_dispoBadge(op)}</td>
          <td class="actions-cell">
            <button class="btn btn-sm" data-action="view" data-id="${op.id}" title="Voir détails & arbitrage">Détails</button>
            <button class="btn btn-sm" data-action="edit" data-id="${op.id}" title="Modifier">Modifier</button>
            <button class="btn btn-sm" data-action="delete" data-id="${op.id}" title="Supprimer" style="color:var(--accent-red-light);">Supprimer</button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Statut</th>
              <th>Coût / jour</th>
              <th>Spécialités</th>
              <th>Zone</th>
              <th>Actif / Dispo</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Rendu de l'état vide (aucun opérateur trouvé) */
  function _renderEmptyState() {
    if (DB.operators.getAll().length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">&#128100;</div>
          <p>Aucun opérateur dans le vivier RH.</p>
          <button class="btn btn-primary" id="btn-add-operator-empty">+ Ajouter un opérateur</button>
        </div>
      `;
    }
    return `
      <div class="empty-state">
        <div class="empty-icon">&#128269;</div>
        <p>Aucun opérateur ne correspond aux critères de recherche.</p>
      </div>
    `;
  }

  /* ----------------------------------------------------------
     HELPER — TABLE PÉRIODES D'INDISPONIBILITÉ
     ---------------------------------------------------------- */

  function _renderIndispoTable(container) {
    if (!container) return;
    if (_modalIndispo.length === 0) {
      container.innerHTML = '<span class="text-muted" style="font-size:0.8rem;">Aucune période saisie.</span>';
      return;
    }
    let html = '<table style="width:100%;font-size:0.82rem;border-collapse:collapse;margin-bottom:4px;">';
    html += '<thead><tr>';
    html += '<th style="text-align:left;padding:3px 4px;font-weight:600;font-size:0.75rem;">Début</th>';
    html += '<th style="text-align:left;padding:3px 4px;font-weight:600;font-size:0.75rem;">Fin</th>';
    html += '<th style="text-align:left;padding:3px 4px;font-weight:600;font-size:0.75rem;">Motif</th>';
    html += '<th></th>';
    html += '</tr></thead><tbody>';
    _modalIndispo.forEach(function(p, i) {
      html += '<tr>';
      html += '<td style="padding:3px;"><input type="date" data-idx="' + i + '" data-field="debut" class="form-control indispo-field" style="font-size:0.8rem;padding:3px 6px;" value="' + _escapeAttr(p.debut || '') + '" /></td>';
      html += '<td style="padding:3px;"><input type="date" data-idx="' + i + '" data-field="fin" class="form-control indispo-field" style="font-size:0.8rem;padding:3px 6px;" value="' + _escapeAttr(p.fin || '') + '" /></td>';
      html += '<td style="padding:3px;"><input type="text" data-idx="' + i + '" data-field="motif" class="form-control indispo-field" style="font-size:0.8rem;padding:3px 6px;" value="' + _escapeAttr(p.motif || '') + '" placeholder="Motif" /></td>';
      html += '<td style="padding:3px;"><button type="button" class="btn btn-sm btn-remove-indispo" data-idx="' + i + '" style="color:var(--accent-red-light);">&times;</button></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;

    container.querySelectorAll('.indispo-field').forEach(function(input) {
      input.addEventListener('change', function() {
        var idx = parseInt(input.dataset.idx, 10);
        var field = input.dataset.field;
        if (_modalIndispo[idx]) _modalIndispo[idx][field] = input.value;
      });
    });
    container.querySelectorAll('.btn-remove-indispo').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.dataset.idx, 10);
        _modalIndispo.splice(idx, 1);
        _renderIndispoTable(container);
      });
    });
  }

  /* ----------------------------------------------------------
     MODALE — FORMULAIRE CRÉATION / ÉDITION
     ---------------------------------------------------------- */

  /**
   * Ouvre la modale de création ou d'édition d'un opérateur.
   * @param {object|null} operator — opérateur existant (null = création)
   */
  function _openFormModal(operator) {
    const isEdit = !!operator;
    const op = operator || _defaultOperator();

    /* Migration douce : copier specialties → specialites si nécessaire */
    if (op.specialties && op.specialties.length > 0 && (!op.specialites || op.specialites.length === 0)) {
      op.specialites = op.specialties.slice();
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'operator-modal-overlay';

    overlay.innerHTML = `
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2>${isEdit ? 'Modifier l\'opérateur' : 'Nouvel opérateur'}</h2>
          <button class="btn btn-sm btn-ghost" id="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="operator-form" autocomplete="off">

            <!-- Identité -->
            <div class="form-row">
              <div class="form-group">
                <label for="op-firstName">Prénom *</label>
                <input type="text" id="op-firstName" class="form-control" required
                       value="${_escapeAttr(op.firstName)}" placeholder="Prénom" />
              </div>
              <div class="form-group">
                <label for="op-lastName">Nom *</label>
                <input type="text" id="op-lastName" class="form-control" required
                       value="${_escapeAttr(op.lastName)}" placeholder="Nom" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="op-email">Email</label>
                <input type="email" id="op-email" class="form-control"
                       value="${_escapeAttr(op.email)}" placeholder="email@exemple.fr" />
              </div>
              <div class="form-group">
                <label for="op-phone">Téléphone</label>
                <input type="text" id="op-phone" class="form-control"
                       value="${_escapeAttr(op.phone)}" placeholder="06 xx xx xx xx" />
              </div>
            </div>

            <!-- Statut et activité -->
            <div class="form-row">
              <div class="form-group">
                <label for="op-status">Statut *</label>
                <select id="op-status" class="form-control" required>
                  ${STATUS_OPTIONS.map(s => `
                    <option value="${s}" ${op.status === s ? 'selected' : ''}>${Engine.statusLabel(s)}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group" style="display:flex;align-items:flex-end;">
                <label class="form-check">
                  <input type="checkbox" id="op-active" ${op.active !== false ? 'checked' : ''} />
                  <span>Opérateur actif</span>
                </label>
              </div>
            </div>

            <!-- SECTION : Tarification -->
            <div class="card" style="margin-top:8px;" id="tarif-card">
              <div class="card-header"><h3>Tarification</h3></div>

              <!-- Part A : Type de tarification -->
              <div class="form-group">
                <label>Type de tarification</label>
                <div class="flex gap-12" style="margin-top:6px;flex-wrap:wrap;">
                  ${[['freelance','Freelance'],['portage','Portage salarial'],['cdi','CDI'],['cdd','CDD'],['vacation','Vacation']].map(([v,l]) =>
                    `<label class="form-check"><input type="radio" name="tarifType" value="${v}" ${(op.typeContrat||'freelance')===v?'checked':''}><span>${l}</span></label>`
                  ).join('')}
                </div>
              </div>

              <!-- Part B : Blocs conditionnels -->

              <!-- BLOC FREELANCE -->
              <div id="bloc-tarifType-freelance" style="${(op.typeContrat||'freelance')==='freelance'?'':'display:none;'}">
                <div class="form-group">
                  <label for="op-freelance-tjh">Tarif journalier HT (&euro;)</label>
                  <input type="number" id="op-freelance-tjh" class="form-control" min="0" step="any"
                         value="${op.tarifsFreelance ? (op.tarifsFreelance.tarifJournalierHT||'') : (op.coutJournalierEntreprise||op.netDaily||'')}" placeholder="Ex : 450" />
                  <span class="form-help">Montant facturé HT — coût direct pour DST (aucune charge patronale).</span>
                </div>
              </div>

              <!-- BLOC PORTAGE SALARIAL -->
              <div id="bloc-tarifType-portage" style="${op.typeContrat==='portage'?'':'display:none;'}">
                <div class="form-group">
                  <label for="op-portage-tjh">Tarif journalier HT — facture société de portage (&euro;)</label>
                  <input type="number" id="op-portage-tjh" class="form-control" min="0" step="any"
                         value="${op.tarifsPortage ? (op.tarifsPortage.tarifJournalierHT||'') : ''}" placeholder="Ex : 500" />
                  <span class="form-help">Facture de la société de portage — coût direct pour DST.</span>
                </div>
              </div>

              <!-- BLOC CDI -->
              <div id="bloc-tarifType-cdi" style="${op.typeContrat==='cdi'?'':'display:none;'}">
                <div class="form-row">
                  <div class="form-group">
                    <label for="op-cdi-saisieMode">Mode de saisie</label>
                    <select id="op-cdi-saisieMode" class="form-control">
                      ${[['brut_mensuel','Brut mensuel'],['net_mensuel','Net mensuel'],['brut_horaire','Brut horaire'],['net_horaire','Net horaire']].map(([v,l]) =>
                        `<option value="${v}" ${((op.tarifsSalarie&&op.tarifsSalarie.saisieMode===v)||(v==='brut_mensuel'&&!op.tarifsSalarie))?'selected':''}>${l}</option>`
                      ).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="op-cdi-valeur">Valeur (&euro;)</label>
                    <input type="number" id="op-cdi-valeur" class="form-control" min="0" step="any"
                           value="${op.tarifsSalarie ? (op.tarifsSalarie.valeur||'') : ''}" placeholder="Ex : 2\u202f800" />
                  </div>
                </div>
                <div class="calcul-auto" id="calcul-auto-cdi" style="display:none;"></div>
              </div>

              <!-- BLOC CDD -->
              <div id="bloc-tarifType-cdd" style="${op.typeContrat==='cdd'?'':'display:none;'}">
                <div class="form-row">
                  <div class="form-group">
                    <label for="op-cdd-saisieMode">Mode de saisie</label>
                    <select id="op-cdd-saisieMode" class="form-control">
                      ${[['brut_mensuel','Brut mensuel'],['net_mensuel','Net mensuel'],['brut_horaire','Brut horaire'],['net_horaire','Net horaire']].map(([v,l]) =>
                        `<option value="${v}" ${((op.tarifsSalarie&&op.tarifsSalarie.saisieMode===v)||(v==='brut_mensuel'&&!op.tarifsSalarie))?'selected':''}>${l}</option>`
                      ).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="op-cdd-valeur">Valeur (&euro;)</label>
                    <input type="number" id="op-cdd-valeur" class="form-control" min="0" step="any"
                           value="${op.tarifsSalarie ? (op.tarifsSalarie.valeur||'') : ''}" placeholder="Ex : 2\u202f800" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="op-cdd-debut">Date début CDD</label>
                    <input type="date" id="op-cdd-debut" class="form-control"
                           value="${op.tarifsSalarie ? (op.tarifsSalarie.dateDebutCDD||'') : ''}" />
                  </div>
                  <div class="form-group">
                    <label for="op-cdd-fin">Date fin CDD</label>
                    <input type="date" id="op-cdd-fin" class="form-control"
                           value="${op.tarifsSalarie ? (op.tarifsSalarie.dateFinCDD||'') : ''}" />
                  </div>
                </div>
                <div class="calcul-auto" id="calcul-auto-cdd" style="display:none;"></div>
              </div>

              <!-- BLOC VACATION -->
              <div id="bloc-tarifType-vacation" style="${op.typeContrat==='vacation'?'':'display:none;'}">
                <div class="form-group">
                  <label for="op-vacation-net">Tarif net journalier versé (&euro;)</label>
                  <input type="number" id="op-vacation-net" class="form-control" min="0" step="any"
                         value="${op.tarifsVacation ? (op.tarifsVacation.tarifNetJournalier||'') : ''}" placeholder="Ex : 200" />
                  <span class="form-help">Net perçu par le vacataire / jour d'intervention.</span>
                </div>
                <div class="calcul-auto" id="calcul-auto-vacation" style="display:none;"></div>
              </div>

              <!-- Part C : Synthèse tarifaire -->
              <div class="tarif-synthese" id="tarif-synthese" style="margin-top:16px;">
                <div style="font-size:0.75rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Synthèse tarifaire</div>
                <div class="synthese-row">
                  <span>Coût journalier entreprise</span>
                  <span id="syn-cout-jour" style="font-weight:600;font-family:var(--font-mono);">—</span>
                </div>
                <div class="synthese-row">
                  <span>Seuil plancher DST</span>
                  <span id="syn-seuil" style="font-family:var(--font-mono);">—</span>
                </div>
                <div class="synthese-row">
                  <span>Statut tarifaire</span>
                  <span id="syn-statut">—</span>
                </div>
                <div class="synthese-row">
                  <span>Sessions assignées cette année</span>
                  <span id="syn-sessions">—</span>
                </div>
                <div class="synthese-row synthese-total">
                  <span>Coût annuel projeté</span>
                  <span id="syn-annuel" style="font-family:var(--font-mono);">—</span>
                </div>
              </div>
            </div>

            <!-- Spécialités (tags) -->
            <div class="form-group mt-16">
              <label for="op-specialites">Spécialités</label>
              <input type="text" id="op-specialites" class="form-control"
                     value="${_escapeAttr((op.specialites || []).join(', '))}"
                     placeholder="Tir tactique, CQB, médical… (séparées par des virgules)" />
              <span class="form-help">Séparez chaque spécialité par une virgule.</span>
            </div>

            <!-- Notes -->
            <div class="form-group">
              <label for="op-notes">Notes</label>
              <textarea id="op-notes" class="form-control" rows="3"
                        placeholder="Informations complémentaires…">${_escape(op.notes || '')}</textarea>
            </div>

            <!-- SECTION : Zone d'intervention -->
            <div class="card" style="margin-top:16px;">
              <div class="card-header"><h3>Zone d'intervention</h3></div>
              <div class="form-row">
                <div class="form-group">
                  <label for="op-zoneLabel">Zone / Territoire</label>
                  <input type="text" id="op-zoneLabel" class="form-control"
                         value="${_escapeAttr(op.zoneLabel || '')}" placeholder="ex: Normandie, Île-de-France" />
                </div>
                <div class="form-group">
                  <label for="op-villeBase">Ville de base</label>
                  <input type="text" id="op-villeBase" class="form-control"
                         value="${_escapeAttr(op.villeBase || '')}" placeholder="ex: Le Mans" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="op-codePostalBase">Code postal</label>
                  <input type="text" id="op-codePostalBase" class="form-control" maxlength="5"
                         value="${_escapeAttr(op.codePostalBase || '')}" placeholder="72000" />
                </div>
                <div class="form-group">
                  <label for="op-rayonKm">Rayon d'intervention</label>
                  <div class="flex gap-8" style="align-items:center;">
                    <input type="number" id="op-rayonKm" class="form-control" min="0"
                           value="${op.rayonKm != null ? op.rayonKm : 150}" style="max-width:120px;" />
                    <span class="text-muted" style="font-size:0.85rem;">km</span>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label for="op-departements">Départements couverts</label>
                <input type="text" id="op-departements" class="form-control"
                       value="${_escapeAttr((op.departements || []).join(', '))}"
                       placeholder="ex: 72, 61, 53, 14" />
                <span class="form-help">Codes séparés par virgule (ex: 72,61,53,14)</span>
              </div>
            </div>

            <!-- SECTION : Compétences & Segments -->
            <div class="card" style="margin-top:8px;">
              <div class="card-header"><h3>Compétences &amp; Segments</h3></div>
              <div class="form-group">
                <label>Segments maîtrisés</label>
                <div class="flex gap-16" style="flex-wrap:wrap;margin-top:6px;">
                  ${[['institutionnel','Institutionnel'],['grand_compte','Grand Compte'],['b2b','B2B'],['b2c','B2C']].map(([v,l]) =>
                    `<label class="form-check"><input type="checkbox" name="op-segments" value="${v}" ${(op.segments || []).includes(v) ? 'checked' : ''} /><span>${l}</span></label>`
                  ).join('')}
                </div>
              </div>
              <div class="form-group">
                <label>Niveaux maîtrisés</label>
                <div class="flex gap-12" style="flex-wrap:wrap;margin-top:6px;">
                  ${[['ponctuel','Ponctuel'],['essentiel','Essentiel'],['renforce','Renforcé'],['territorial','Territorial'],
                     ['gc_standard','GC Standard'],['gc_volume','GC Volume'],['gc_partenaire','GC Partenaire']].map(([v,l]) =>
                    `<label class="form-check"><input type="checkbox" name="op-niveaux" value="${v}" ${(op.niveauxMax || []).includes(v) ? 'checked' : ''} /><span>${l}</span></label>`
                  ).join('')}
                </div>
              </div>
              <div class="form-group">
                <label for="op-specialites">Spécialités avancées</label>
                <input type="text" id="op-specialites" class="form-control"
                       value="${_escapeAttr((op.specialites || []).join(', '))}"
                       placeholder="CQB, stress, tir dynamique…" />
                <span class="form-help">Séparées par virgule</span>
              </div>
              <div class="form-group">
                <label for="op-certifications">Certifications</label>
                <textarea id="op-certifications" class="form-control" rows="2"
                          placeholder="Certifications, habilitations…">${_escape(op.certifications || '')}</textarea>
              </div>
            </div>

            <!-- SECTION : Disponibilités -->
            <div class="card" style="margin-top:8px;">
              <div class="card-header"><h3>Disponibilités</h3></div>
              <div class="form-row">
                <div class="form-group">
                  <label for="op-dispoType">Type de disponibilité</label>
                  <select id="op-dispoType" class="form-control">
                    <option value="ponctuelle" ${(op.disponibiliteType || 'ponctuelle') === 'ponctuelle' ? 'selected' : ''}>Ponctuelle (missions à la demande)</option>
                    <option value="reguliere"  ${op.disponibiliteType === 'reguliere'  ? 'selected' : ''}>Régulière (volume mensuel estimé)</option>
                    <option value="temps_plein" ${op.disponibiliteType === 'temps_plein' ? 'selected' : ''}>Temps plein (opérateur dédié)</option>
                  </select>
                </div>
                <div class="form-group" id="group-jours-dispo"
                     style="${['reguliere','temps_plein'].includes(op.disponibiliteType) ? '' : 'display:none;'}">
                  <label for="op-joursDispoMois">Jours disponibles / mois</label>
                  <input type="number" id="op-joursDispoMois" class="form-control" min="0" max="23"
                         value="${op.joursDispoParMois || 0}" />
                </div>
              </div>
              <div class="form-group">
                <label>Périodes d'indisponibilité <span class="text-muted" style="font-size:0.75rem;">(max 12)</span></label>
                <div id="indispo-table" style="margin-bottom:6px;"></div>
                <button type="button" class="btn btn-sm" id="btn-add-indispo">+ Ajouter une période</button>
              </div>
            </div>

            <!-- SECTION : Contrat -->
            <div class="card" style="margin-top:8px;">
              <div class="card-header"><h3>Contrat</h3></div>
              <div class="form-group" id="group-siret">
                <label for="op-siret">SIRET <span class="text-muted" style="font-size:0.75rem;">(freelance / portage)</span></label>
                <input type="text" id="op-siret" class="form-control"
                       value="${_escapeAttr(op.siretFreelance || '')}" placeholder="12345678900012" />
              </div>
              <div class="form-group">
                <label for="op-noteInterne">Note interne
                  <span class="text-muted" style="font-size:0.75rem;">(non visible par l'opérateur)</span>
                </label>
                <textarea id="op-noteInterne" class="form-control" rows="2"
                          placeholder="Notes confidentielles…">${_escape(op.noteInterne || '')}</textarea>
              </div>
            </div>

          </form>
        </div>
        <div class="modal-footer">
          <button class="btn" id="modal-cancel">Annuler</button>
          <button class="btn btn-primary" id="modal-save">${isEdit ? 'Enregistrer' : 'Créer'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Initialiser la tarification
    var _currentTarifType = op.typeContrat || 'freelance';
    _showTarifBloc(_currentTarifType, overlay);
    _updateTarifSynthese(overlay, isEdit ? op.id : null);

    // --- Événements de la modale ---

    // Fermeture
    const closeModal = () => overlay.remove();
    overlay.querySelector('#modal-close').addEventListener('click', closeModal);
    overlay.querySelector('#modal-cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // Basculer entre types de tarification
    overlay.querySelectorAll('input[name="tarifType"]').forEach(function(radio) {
      radio.addEventListener('change', function() {
        _showTarifBloc(this.value, overlay);
        _updateTarifSynthese(overlay, isEdit ? op.id : null);
        var gs = overlay.querySelector('#group-siret');
        if (gs) gs.style.display = (this.value === 'freelance' || this.value === 'portage') ? '' : 'none';
      });
    });

    // Écouter les inputs tarif pour mise à jour en temps réel
    ['#op-freelance-tjh','#op-portage-tjh','#op-cdi-valeur','#op-cdd-valeur','#op-vacation-net'].forEach(function(id) {
      var el = overlay.querySelector(id);
      if (el) el.addEventListener('input', function() { _updateTarifSynthese(overlay, isEdit ? op.id : null); });
    });
    ['#op-cdi-saisieMode','#op-cdd-saisieMode'].forEach(function(id) {
      var el = overlay.querySelector(id);
      if (el) el.addEventListener('change', function() { _updateTarifSynthese(overlay, isEdit ? op.id : null); });
    });
    ['#op-cdd-debut','#op-cdd-fin'].forEach(function(id) {
      var el = overlay.querySelector(id);
      if (el) el.addEventListener('change', function() { _updateTarifSynthese(overlay, isEdit ? op.id : null); });
    });

    // Visibilité initiale SIRET
    var groupSiretInit = overlay.querySelector('#group-siret');
    if (groupSiretInit) groupSiretInit.style.display = (_currentTarifType === 'freelance' || _currentTarifType === 'portage') ? '' : 'none';

    // Initialiser periodeIndispo
    _modalIndispo = JSON.parse(JSON.stringify(op.periodeIndispo || []));
    _renderIndispoTable(overlay.querySelector('#indispo-table'));

    // Bouton ajout période indispo
    var btnAddIndispo = overlay.querySelector('#btn-add-indispo');
    if (btnAddIndispo) {
      btnAddIndispo.addEventListener('click', function() {
        if (_modalIndispo.length >= 12) return;
        _modalIndispo.push({ debut: '', fin: '', motif: '' });
        _renderIndispoTable(overlay.querySelector('#indispo-table'));
      });
    }

    // Affichage conditionnel jours dispo
    var dispoTypeEl = overlay.querySelector('#op-dispoType');
    var groupJoursDispo = overlay.querySelector('#group-jours-dispo');
    if (dispoTypeEl && groupJoursDispo) {
      dispoTypeEl.addEventListener('change', function() {
        var v = dispoTypeEl.value;
        groupJoursDispo.style.display = (v === 'reguliere' || v === 'temps_plein') ? '' : 'none';
      });
    }

    // Sauvegarde
    overlay.querySelector('#modal-save').addEventListener('click', () => {
      const form = overlay.querySelector('#operator-form');
      if (!form.reportValidity()) return;
      _saveOperator(isEdit ? op.id : null, overlay);
    });
  }

  /** Affiche le bloc tarifaire correspondant au type, masque les autres */
  function _showTarifBloc(typeVal, overlay) {
    var ov = overlay || document.getElementById('operator-modal-overlay');
    if (!ov) return;
    ['freelance','portage','cdi','cdd','vacation'].forEach(function(t) {
      var bloc = ov.querySelector('#bloc-tarifType-' + t);
      if (bloc) bloc.style.display = (t === typeVal) ? '' : 'none';
    });
  }

  /** Calcule les données tarifaires CDI/CDD depuis le mode de saisie et la valeur */
  function _calcSalarieTarif(saisieMode, valeur, typeContrat, settings) {
    if (!valeur || valeur <= 0) return null;
    var cc = Engine.getChargesConfig(settings);
    var joursAn = (cc && cc.joursOuvresAn) || 218;
    var brutMensuel = 0;

    if (saisieMode === 'brut_mensuel') {
      brutMensuel = valeur;
    } else if (saisieMode === 'brut_horaire') {
      brutMensuel = Engine.round2(valeur * 151.67);
    } else if (saisieMode === 'net_mensuel') {
      var netAn1 = valeur * 12;
      brutMensuel = Engine.round2(Engine.netToBrutIteratif(netAn1, cc) / 12);
    } else if (saisieMode === 'net_horaire') {
      var netMensHoraire = Engine.round2(valeur * 151.67);
      brutMensuel = Engine.round2(Engine.netToBrutIteratif(netMensHoraire * 12, cc) / 12);
    } else {
      return null;
    }

    if (brutMensuel <= 0) return null;

    var brutAnnuel = brutMensuel * 12;
    var details = Engine.computeChargesDetaillees(brutAnnuel, cc);
    var netMensuel      = Engine.round2(details.totaux.netAnnuel / 12);
    var chargesSalMens  = Engine.round2(details.totaux.chargesSalariales / 12);
    var chargesPatMens  = Engine.round2(details.totaux.chargesPatronales / 12);
    var coutAnnuel      = details.totaux.coutEntreprise;

    // CDD : ajouter prime précarité + indemnité CP sur le brut
    if (typeContrat === 'cdd') {
      var txPrec = (cc.cdd && cc.cdd.primePrecarite) || 10;
      var txCP   = (cc.cdd && cc.cdd.indemniteCP)    || 10;
      var primePrec = Engine.round2(brutAnnuel * txPrec / 100);
      var indemCP   = Engine.round2((brutAnnuel + primePrec) * txCP / 100);
      var brutTotCDD = brutAnnuel + primePrec + indemCP;
      var detailsCDD = Engine.computeChargesDetaillees(brutTotCDD, cc);
      coutAnnuel     = detailsCDD.totaux.coutEntreprise;
      chargesPatMens = Engine.round2(detailsCDD.totaux.chargesPatronales / 12);
    }

    var coutJour    = Engine.round2(coutAnnuel / joursAn);
    var coutMoisEnt = Engine.round2(coutAnnuel / 12);
    return { brutMensuel, netMensuel, chargesSalMens, chargesPatMens, coutMoisEnt, coutAnnuel: Engine.round2(coutAnnuel), coutJour, joursAn };
  }

  /** Calcule les données tarifaires Vacation */
  function _calcVacationTarif(tarifNet, settings) {
    if (!tarifNet || tarifNet <= 0) return null;
    var cc = Engine.getChargesConfig(settings);
    var tauxPat = 42;
    if (cc && cc.patronales) {
      tauxPat = Engine.round2(cc.patronales.reduce(function(s, l) { return s + (l.taux || 0); }, 0));
    }
    var chargesPatronales = Engine.round2(tarifNet * tauxPat / 100);
    var coutJour = Engine.round2(tarifNet + chargesPatronales);
    return { tarifNet, tauxPat, chargesPatronales, coutJour };
  }

  /** Met à jour la synthèse tarifaire et les blocs de calcul auto dans la modale */
  function _updateTarifSynthese(overlay, opId) {
    var ov = overlay || document.getElementById('operator-modal-overlay');
    if (!ov) return;

    var tarifTypeEl = ov.querySelector('input[name="tarifType"]:checked');
    var tarifType = tarifTypeEl ? tarifTypeEl.value : 'freelance';
    var settings = DB.settings.get();
    var seuilPlancher = (settings.coutJournee && settings.coutJournee.coutOperateurJour) || 0;
    var coutJour = 0;

    switch (tarifType) {
      case 'freelance':
        coutJour = parseFloat((ov.querySelector('#op-freelance-tjh') || {}).value) || 0;
        break;
      case 'portage':
        coutJour = parseFloat((ov.querySelector('#op-portage-tjh') || {}).value) || 0;
        break;
      case 'cdi': {
        var sm1 = (ov.querySelector('#op-cdi-saisieMode') || {}).value || 'brut_mensuel';
        var v1  = parseFloat((ov.querySelector('#op-cdi-valeur') || {}).value) || 0;
        var c1  = _calcSalarieTarif(sm1, v1, 'cdi', settings);
        var autoDiv1 = ov.querySelector('#calcul-auto-cdi');
        if (c1) {
          coutJour = c1.coutJour;
          if (autoDiv1) {
            autoDiv1.style.display = '';
            autoDiv1.innerHTML =
              '<div class="calcul-row"><span>Salaire net employ\u00e9</span><span>' + Engine.fmt(c1.netMensuel) + '\u00a0/ mois</span></div>' +
              '<div class="calcul-row"><span>Salaire brut (converti)</span><span>' + Engine.fmt(c1.brutMensuel) + '\u00a0/ mois</span></div>' +
              '<div class="calcul-row"><span>Charges salariales</span><span>' + Engine.fmt(c1.chargesSalMens) + '\u00a0/ mois</span></div>' +
              '<div class="calcul-row"><span>Charges patronales</span><span>' + Engine.fmt(c1.chargesPatMens) + '\u00a0/ mois</span></div>' +
              '<div class="calcul-row"><span>Co\u00fbt total entreprise\u00a0/ mois</span><span>' + Engine.fmt(c1.coutMoisEnt) + '</span></div>' +
              '<div class="calcul-row synthese-total"><span>Co\u00fbt journalier (\u00f7\u00a0' + c1.joursAn + '\u00a0j)</span><span>' + Engine.fmt(c1.coutJour) + '</span></div>';
          }
        } else if (autoDiv1) { autoDiv1.style.display = 'none'; }
        break;
      }
      case 'cdd': {
        var sm2   = (ov.querySelector('#op-cdd-saisieMode') || {}).value || 'brut_mensuel';
        var v2    = parseFloat((ov.querySelector('#op-cdd-valeur') || {}).value) || 0;
        var deb   = (ov.querySelector('#op-cdd-debut') || {}).value || '';
        var fin   = (ov.querySelector('#op-cdd-fin') || {}).value || '';
        var c2    = _calcSalarieTarif(sm2, v2, 'cdd', settings);
        var autoDiv2 = ov.querySelector('#calcul-auto-cdd');
        if (c2) {
          coutJour = c2.coutJour;
          if (autoDiv2) {
            autoDiv2.style.display = '';
            var html2 =
              '<div class="calcul-row"><span>Salaire net employ\u00e9</span><span>' + Engine.fmt(c2.netMensuel) + '\u00a0/ mois</span></div>' +
              '<div class="calcul-row"><span>Salaire brut (converti)</span><span>' + Engine.fmt(c2.brutMensuel) + '\u00a0/ mois</span></div>' +
              '<div class="calcul-row"><span>Charges salariales</span><span>' + Engine.fmt(c2.chargesSalMens) + '\u00a0/ mois</span></div>' +
              '<div class="calcul-row"><span>Charges patronales\u00a0(+ pr\u00e9carit\u00e9)</span><span>' + Engine.fmt(c2.chargesPatMens) + '\u00a0/ mois</span></div>' +
              '<div class="calcul-row"><span>Co\u00fbt total entreprise\u00a0/ mois</span><span>' + Engine.fmt(c2.coutMoisEnt) + '</span></div>' +
              '<div class="calcul-row synthese-total"><span>Co\u00fbt journalier (\u00f7\u00a0' + c2.joursAn + '\u00a0j)</span><span>' + Engine.fmt(c2.coutJour) + '</span></div>';
            if (deb && fin) {
              var d1 = new Date(deb), d2f = new Date(fin);
              var joursCDD = Math.max(0, Math.round((d2f - d1) / 86400000));
              var moisCDD  = Engine.round2(joursCDD / 30.44);
              html2 +=
                '<div class="calcul-row"><span>Durée CDD</span><span>' + moisCDD.toFixed(1) + '\u00a0mois (' + joursCDD + '\u00a0j)</span></div>' +
                '<div class="calcul-row"><span>Coût total CDD estimé</span><span>' + Engine.fmt(Engine.round2(c2.coutJour * joursCDD)) + '</span></div>';
            }
            autoDiv2.innerHTML = html2;
          }
        } else if (autoDiv2) { autoDiv2.style.display = 'none'; }
        break;
      }
      case 'vacation': {
        var vn = parseFloat((ov.querySelector('#op-vacation-net') || {}).value) || 0;
        var cv = _calcVacationTarif(vn, settings);
        var autoDiv3 = ov.querySelector('#calcul-auto-vacation');
        if (cv) {
          coutJour = cv.coutJour;
          if (autoDiv3) {
            autoDiv3.style.display = '';
            autoDiv3.innerHTML =
              '<div class="calcul-row"><span>Net versé / jour</span><span>' + Engine.fmt(cv.tarifNet) + '</span></div>' +
              '<div class="calcul-row"><span>Charges patronales (\u2248' + cv.tauxPat + '\u00a0%)</span><span>' + Engine.fmt(cv.chargesPatronales) + '</span></div>' +
              '<div class="calcul-row synthese-total"><span>Coût entreprise / jour</span><span>' + Engine.fmt(cv.coutJour) + '</span></div>';
          }
        } else if (autoDiv3) { autoDiv3.style.display = 'none'; }
        break;
      }
    }

    // Compter sessions cette année pour cet opérateur
    var nbSessions = 0;
    if (opId) {
      var currentYear = new Date().getFullYear().toString();
      nbSessions = DB.sessions.getAll().filter(function(s) {
        return (s.operatorIds || []).includes(opId) &&
          s.date && s.date.startsWith(currentYear) &&
          s.statut !== 'annulee' && s.statut !== 'soldee';
      }).length;
    }

    var coutAnnuelProj = Engine.round2(coutJour * nbSessions);

    // Mettre à jour la synthèse
    var synCoutJour = ov.querySelector('#syn-cout-jour');
    var synSeuil    = ov.querySelector('#syn-seuil');
    var synStatut   = ov.querySelector('#syn-statut');
    var synSessions = ov.querySelector('#syn-sessions');
    var synAnnuel   = ov.querySelector('#syn-annuel');

    if (synCoutJour) synCoutJour.textContent = coutJour > 0 ? Engine.fmt(coutJour) : '—';
    if (synSeuil)    synSeuil.textContent    = seuilPlancher > 0 ? Engine.fmt(seuilPlancher) : '—';

    if (synStatut) {
      if (coutJour <= 0) {
        synStatut.innerHTML = '<span class="tag tag-neutral">Non renseigné</span>';
      } else if (seuilPlancher <= 0) {
        synStatut.innerHTML = '<span class="tag tag-neutral">Seuil non configuré</span>';
      } else if (coutJour > seuilPlancher * 1.10) {
        synStatut.innerHTML = '<span class="tag tag-success">OK (+' + Engine.fmt(Engine.round2(coutJour - seuilPlancher)) + ')</span>';
      } else if (coutJour >= seuilPlancher) {
        synStatut.innerHTML = '<span class="tag tag-warning">Proche seuil (+' + Engine.fmt(Engine.round2(coutJour - seuilPlancher)) + ')</span>';
      } else {
        synStatut.innerHTML = '<span class="tag tag-danger">Sous seuil (\u2212' + Engine.fmt(Engine.round2(seuilPlancher - coutJour)) + ')</span>';
      }
    }

    if (synSessions) synSessions.textContent = nbSessions;
    if (synAnnuel)   synAnnuel.textContent   = nbSessions === 0 ? '0 session assignée' : Engine.fmt(coutAnnuelProj);
  }

  /* ----------------------------------------------------------
     RENDU DÉTAIL CHARGES SOCIALES (dans modale détails)
     ---------------------------------------------------------- */

  /**
   * Génère le HTML de ventilation des charges pour un calcul donné.
   * Utilise le detailComplet retourné par computeCoutComplet.
   */
  function _renderDetailChargesHTML(calc, status) {
    const dc = calc.detailComplet;
    if (!dc || !dc.details) {
      // Freelance ou fondateur : pas de charges détaillées côté entreprise
      if (status === 'freelance' && dc) {
        return `<div style="margin-top:12px;font-size:0.8rem;color:var(--text-secondary);">
          Facture HT : ${Engine.fmt(dc.factureHT_Jour)} / jour — Charges auto-entrepreneur (${dc.tauxChargesAE}%) à la charge du freelance.
          <br>Coût pour l'entreprise = facture HT uniquement (aucune charge patronale).
        </div>`;
      }
      if (status === 'fondateur' && dc) {
        const regime = dc.regime === 'assimileSalarie' ? 'Assimilé salarié' : 'TNS';
        return `<div style="margin-top:12px;font-size:0.8rem;color:var(--text-secondary);">
          Régime : ${_escape(regime)} — Coût réel estimé : ${Engine.fmt(dc.coutReelJour || 0)} / jour
          (cotisations ${regime} : ${dc.tauxTNS || 0}%).
          <br>Non imputé aux sessions (charge fixe de structure).
        </div>`;
      }
      return '';
    }

    const details = dc.details;
    const cc = Engine.getChargesConfig();
    const joursAn = cc.joursOuvresAn || 218;

    // Filtrer les lignes à montant > 0 pour lisibilité
    const patronalesNonNulles = details.patronales.filter(l => l.montant > 0);
    const salarialesNonNulles = details.salariales.filter(l => l.montant > 0);

    let html = '<details style="margin-top:12px;"><summary style="cursor:pointer;font-size:0.82rem;font-weight:600;color:var(--text-heading);padding:6px 0;">Ventilation détaillée des charges</summary>';
    html += '<div style="margin-top:8px;">';

    // CDD specifics
    if (status === 'cdd' && dc.primePrecariteJour) {
      html += '<div style="font-size:0.78rem;padding:6px 0;color:var(--color-warning);">Prime précarité : +' + Engine.fmt(dc.primePrecariteJour) + '/jour — Indemnité CP : +' + Engine.fmt(dc.indemniteCP_Jour) + '/jour</div>';
    }

    // Patronales table
    html += '<table style="width:100%;font-size:0.75rem;border-collapse:collapse;margin-top:4px;">';
    html += '<tr style="border-bottom:1px solid var(--border-color);"><td colspan="3" style="font-weight:700;padding:4px 0;color:var(--accent-red-light);">Charges patronales (' + details.totaux.tauxPatronalesEffectif + '% effectif)</td></tr>';
    patronalesNonNulles.forEach(l => {
      html += '<tr style="border-bottom:1px solid var(--border-color);">';
      html += '<td style="padding:3px 0;color:var(--text-secondary);">' + _escape(l.label) + '</td>';
      html += '<td style="text-align:right;width:55px;color:var(--text-muted);">' + l.taux.toFixed(2) + '%</td>';
      html += '<td style="text-align:right;width:80px;font-family:var(--font-mono);color:var(--text-primary);">' + Engine.fmt(Engine.round2(l.montant / joursAn)) + '</td>';
      html += '</tr>';
    });
    html += '<tr style="font-weight:700;"><td style="padding:4px 0;">Total patronales</td><td></td><td style="text-align:right;font-family:var(--font-mono);">' + Engine.fmt(dc.chargesPatronalesJour || Engine.round2(details.totaux.chargesPatronales / joursAn)) + '/j</td></tr>';
    html += '</table>';

    // Salariales table
    html += '<table style="width:100%;font-size:0.75rem;border-collapse:collapse;margin-top:12px;">';
    html += '<tr style="border-bottom:1px solid var(--border-color);"><td colspan="3" style="font-weight:700;padding:4px 0;color:var(--color-info);">Charges salariales (' + details.totaux.tauxSalarialesEffectif + '% effectif)</td></tr>';
    salarialesNonNulles.forEach(l => {
      html += '<tr style="border-bottom:1px solid var(--border-color);">';
      html += '<td style="padding:3px 0;color:var(--text-secondary);">' + _escape(l.label) + '</td>';
      html += '<td style="text-align:right;width:55px;color:var(--text-muted);">' + l.taux.toFixed(2) + '%</td>';
      html += '<td style="text-align:right;width:80px;font-family:var(--font-mono);color:var(--text-primary);">' + Engine.fmt(Engine.round2(l.montant / joursAn)) + '</td>';
      html += '</tr>';
    });
    html += '<tr style="font-weight:700;"><td style="padding:4px 0;">Total salariales</td><td></td><td style="text-align:right;font-family:var(--font-mono);">' + Engine.fmt(dc.chargesSalarialesJour || Engine.round2(details.totaux.chargesSalariales / joursAn)) + '/j</td></tr>';
    html += '</table>';

    // Annuel summary
    html += '<div style="margin-top:12px;padding:8px;background:var(--bg-input);border-radius:6px;font-size:0.78rem;">';
    html += '<strong>Projection annuelle (' + joursAn + ' jours)</strong><br>';
    html += 'Brut : ' + Engine.fmt(details.totaux.brutAnnuel) + ' — ';
    html += 'Ch. patronales : ' + Engine.fmt(details.totaux.chargesPatronales) + ' — ';
    html += 'Ch. salariales : ' + Engine.fmt(details.totaux.chargesSalariales) + '<br>';
    html += '<strong>Coût entreprise annuel : ' + Engine.fmt(details.totaux.coutEntreprise) + '</strong> — ';
    html += 'Net annuel salarié : ' + Engine.fmt(details.totaux.netAnnuel);
    html += '</div>';

    html += '</div></details>';
    return html;
  }

  /* ----------------------------------------------------------
     MODALE — VUE DÉTAILS + ARBITRAGE RH
     ---------------------------------------------------------- */

  /* ----------------------------------------------------------
     PORTAIL OPÉRATEUR — SYNCHRONISATION SUPABASE
     ---------------------------------------------------------- */

  async function _syncOperateurPortail(opId) {
    const op = DB.operators.getById(opId);
    if (!op || !op.portailToken) {
      if (typeof Toast !== 'undefined') Toast.show('Générez d\'abord un accès portail.', 'error');
      return;
    }
    const token = op.portailToken;
    const btn = document.getElementById('btn-sync-portail-op');
    if (btn) { btn.disabled = true; btn.textContent = '☁ Sync…'; }

    try {
      // 1. Upsert profil opérateur
      const r1 = await fetch(
        SUPABASE_URL + '/rest/v1/operateurs_portail',
        {
          method: 'POST',
          headers: { ...sbHeaders(), 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({
            dst_operateur_id: op.id,
            token,
            prenom:      op.firstName  || '',
            nom:         op.lastName   || '',
            email:       op.email      || '',
            telephone:   op.phone      || '',
            ville_base:  op.villeBase  || '',
            zone_label:  op.zoneLabel  || '',
            statut:      op.active !== false ? 'actif' : 'inactif',
            portail_actif: op.portailActif !== false,
            updated_at:  new Date().toISOString()
          })
        }
      );
      if (!r1.ok) throw new Error('Erreur profil: ' + r1.status);

      // 2. Supprimer anciennes sessions de cet opérateur
      await fetch(
        SUPABASE_URL + '/rest/v1/sessions_operateur_portail'
          + '?dst_operateur_id=eq.' + encodeURIComponent(op.id),
        { method: 'DELETE', headers: sbHeaders() }
      );

      // 3. Insérer les sessions assignées à cet opérateur
      const sessions = DB.sessions.getAll().filter(s =>
        (s.operatorIds || []).includes(opId)
      );
      const now = new Date();

      if (sessions.length > 0) {
        const payload = sessions.map(s => {
          const clientId = (s.clientIds && s.clientIds[0]) || s.clientId;
          const client   = clientId ? DB.clients.getById(clientId) : null;
          const location = s.locationId ? DB.locations.getById(s.locationId) : null;
          return {
            dst_session_id:     s.id,
            dst_operateur_id:   op.id,
            token_operateur:    token,
            label:              s.label || '',
            date:               s.date  || null,
            heure:              s.time  || '',
            lieu:               location ? (location.name || location.label || '') : '',
            lieu_ville:         location ? (location.city || location.ville || '') : '',
            client_nom:         client  ? (client.name  || client.label  || '') : '',
            statut:             s.statut || s.status || 'planifiee',
            est_future:         s.date ? new Date(s.date) >= now : true,
            notes_instructeur:  s.notes || ''
          };
        });
        const r3 = await fetch(
          SUPABASE_URL + '/rest/v1/sessions_operateur_portail',
          {
            method: 'POST',
            headers: sbHeaders(),
            body: JSON.stringify(payload)
          }
        );
        if (!r3.ok) throw new Error('Erreur sessions: ' + r3.status);
      }

      // 4. Mettre à jour la date de sync locale
      DB.operators.update(opId, { portailDerniereSync: new Date().toISOString() });

      if (typeof Toast !== 'undefined') {
        Toast.show('✓ Portail synchronisé — ' + sessions.length + ' session(s)', 'success');
      }

    } catch (err) {
      console.error('[Sync portail opérateur]', err);
      if (typeof Toast !== 'undefined') Toast.show('Erreur : ' + err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '☁ Synchroniser le portail'; }
    }
  }

  /**
   * Ouvre la modale de détails d'un opérateur avec l'arbitrage multi-statuts.
   * @param {object} op — opérateur
   */
  function _openDetailModal(op) {
    const settings = DB.settings.get();

    // Calcul du coût actuel
    const currentCost = _computeOperatorCost(op, settings);

    // Net de référence pour l'arbitrage
    const referenceNet = currentCost ? currentCost.net : (op.netDaily || 0);

    // Comparaison de tous les statuts
    const comparison = referenceNet > 0
      ? Engine.compareAllStatuses(referenceNet, settings)
      : [];

    // Identifier le plus cher pour la couleur rouge
    const maxCost = comparison.length > 0
      ? comparison[comparison.length - 1].companyCost
      : 0;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
      <div class="modal modal-lg">
        <div class="modal-header">
          <h2>${_escape(op.firstName)} ${_escape(op.lastName)}</h2>
          <button class="btn btn-sm btn-ghost" id="detail-close">&times;</button>
        </div>
        <div class="modal-body">

          <!-- Informations de base -->
          <div class="card">
            <div class="card-header">
              <h3>Informations</h3>
              <span class="tag ${STATUS_TAG_CLASS[op.status] || 'tag-neutral'}">${Engine.statusLabel(op.status)}</span>
            </div>
            <div class="form-row">
              <div>
                <span class="kpi-label">Email</span><br/>
                <span>${_escape(op.email || '—')}</span>
              </div>
              <div>
                <span class="kpi-label">Téléphone</span><br/>
                <span>${_escape(op.phone || '—')}</span>
              </div>
              <div>
                <span class="kpi-label">Actif</span><br/>
                <span>${op.active !== false ? '<span class="tag tag-green">Oui</span>' : '<span class="tag tag-neutral">Non</span>'}</span>
              </div>
            </div>
            ${((op.specialites && op.specialites.length > 0) || (op.specialties && op.specialties.length > 0)) ? `
              <div class="mt-16">
                <span class="kpi-label">Spécialités</span><br/>
                <div class="flex gap-8" style="flex-wrap:wrap;margin-top:4px;">
                  ${(op.specialites && op.specialites.length > 0 ? op.specialites : op.specialties).map(s => `<span class="tag tag-blue">${_escape(s)}</span>`).join('')}
                </div>
              </div>
            ` : ''}
            ${op.notes ? `
              <div class="mt-16">
                <span class="kpi-label">Notes</span><br/>
                <span style="white-space:pre-line;">${_escape(op.notes)}</span>
              </div>
            ` : ''}
          </div>

          <!-- Accès portail opérateur -->
          <div class="card" id="portail-op-card">
            <div class="card-header">
              <h3>Accès portail opérateur</h3>
              ${op.portailActif
                ? '<span class="tag tag-green">Actif</span>'
                : '<span class="tag tag-neutral">Inactif</span>'}
            </div>
            ${op.portailActif && op.portailToken ? `
              <div style="margin-bottom:12px;">
                <span class="kpi-label">Token généré le</span><br/>
                <span>${op.portailGenereeLe ? new Date(op.portailGenereeLe).toLocaleDateString('fr-FR') : '—'}</span>
              </div>
              <div style="background:var(--bg-secondary,#2a2a32);border-radius:6px;padding:10px 14px;font-family:monospace;font-size:0.82rem;word-break:break-all;margin-bottom:12px;" id="portail-link-display">
                https://dst-system.fr/operateur/?token=${_escape(op.portailToken)}
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <button class="btn btn-sm btn-primary" id="btn-sync-portail-op">☁ Synchroniser le portail</button>
                <button class="btn btn-sm btn-secondary" id="btn-copy-portail-op">📋 Copier le lien</button>
                <button class="btn btn-sm btn-danger" id="btn-desactiver-portail-op">Désactiver l'accès</button>
              </div>
              ${op.portailDerniereSync
                ? `<div style="font-size:0.78rem;color:var(--text-secondary,#a0a0a8);">Dernière sync : ${new Date(op.portailDerniereSync).toLocaleString('fr-FR')}</div>`
                : '<div style="font-size:0.78rem;color:var(--text-secondary,#a0a0a8);">Non synchronisé</div>'
              }
            ` : `
              <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">
                Aucun accès portail configuré pour cet opérateur.
              </p>
              <button class="btn btn-sm btn-primary" id="btn-generer-portail-op">🔐 Générer accès portail</button>
            `}
          </div>

          <!-- Coût actuel -->
          ${currentCost ? `
          <div class="card">
            <div class="card-header">
              <h3>Coût actuel — ${Engine.statusLabel(op.status)}</h3>
              <span class="tag tag-neutral">${op.costMode === 'company_max' ? 'Mode : coût max entreprise' : 'Mode : net souhaité'}</span>
            </div>
            <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
              <div class="kpi-card">
                <span class="kpi-label">Net / jour</span>
                <span class="kpi-value" style="font-size:1.3rem;">${Engine.fmt(currentCost.net)}</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Brut / jour</span>
                <span class="kpi-value" style="font-size:1.3rem;">${Engine.fmt(currentCost.gross)}</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Charges patronales</span>
                <span class="kpi-value" style="font-size:1.3rem;">${Engine.fmt(currentCost.charges)}</span>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Coût entreprise</span>
                <span class="kpi-value" style="font-size:1.3rem;">${Engine.fmt(currentCost.companyCost)}</span>
              </div>
            </div>
            ${_renderDetailChargesHTML(currentCost, op.status)}
          </div>
          ` : ''}

          <!-- Arbitrage RH — Comparaison de tous les statuts -->
          ${referenceNet > 0 ? `
          <div class="card">
            <div class="card-header">
              <h3>Arbitrage RH — Comparaison pour ${Engine.fmt(referenceNet)} net/jour</h3>
            </div>
            <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">
              Pour un même net journalier de <strong>${Engine.fmt(referenceNet)}</strong>,
              voici le coût entreprise selon chaque statut contractuel.
            </p>
            <div class="comparison-grid">
              ${comparison.map((item, idx) => {
                // Premier = recommandé (le moins cher), dernier = plus cher
                let cardClass = '';
                if (item.companyCost === 0) {
                  cardClass = 'recommended'; // Fondateur = coût 0
                } else if (idx === 0) {
                  cardClass = 'recommended';
                } else if (item.companyCost === maxCost && maxCost > 0) {
                  cardClass = 'not-recommended';
                }
                const isCurrent = item.status === op.status;
                const dc = item.detailComplet;
                let detailLine = 'Brut : ' + Engine.fmt(item.gross) + '<br/>Charges patron. : ' + Engine.fmt(item.charges);
                if (dc && dc.tauxPatronalesEffectif) {
                  detailLine += '<br/><span style="font-size:0.7rem;">Taux effectif : ' + dc.tauxPatronalesEffectif + '%</span>';
                }
                if (dc && item.status === 'cdd' && dc.majorationCDD) {
                  detailLine += '<br/><span style="font-size:0.7rem;color:var(--color-warning);">dont CDD : +' + Engine.fmt(dc.majorationCDD) + '</span>';
                }
                if (dc && item.status === 'interim' && dc.coefficientAgence) {
                  detailLine += '<br/><span style="font-size:0.7rem;">Coeff. agence : ×' + dc.coefficientAgence + '</span>';
                }
                if (dc && item.status === 'freelance') {
                  detailLine = 'Facture HT : ' + Engine.fmt(dc.factureHT_Jour) + '<br/><span style="font-size:0.7rem;">Charges AE (' + dc.tauxChargesAE + '%) : à sa charge</span>';
                }
                return `
                  <div class="comparison-card ${cardClass}" ${isCurrent ? 'style="outline:2px solid var(--color-info);"' : ''}>
                    <div class="comp-label">${item.label}${isCurrent ? ' (actuel)' : ''}</div>
                    <div class="comp-value">${Engine.fmt(item.companyCost)}</div>
                    <div class="comp-detail">${detailLine}</div>
                    ${idx === 0 && item.companyCost > 0 ? '<div class="comp-detail" style="margin-top:4px;"><strong style="color:var(--color-success);">Recommandé</strong></div>' : ''}
                    ${item.companyCost === maxCost && maxCost > 0 && idx === comparison.length - 1 ? '<div class="comp-detail" style="margin-top:4px;"><strong style="color:var(--accent-red-light);">Plus coûteux</strong></div>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
            ${comparison.length >= 2 && comparison[0].companyCost > 0 ? `
              <div class="mt-16" style="font-size:0.82rem;color:var(--text-secondary);">
                Écart entre le moins cher (<strong>${comparison[0].label}</strong>) et le plus cher
                (<strong>${comparison[comparison.length - 1].label}</strong>) :
                <strong style="color:var(--accent-red-light);">${Engine.fmt(comparison[comparison.length - 1].companyCost - comparison[0].companyCost)}</strong> / jour
                (${Engine.fmtPercent(((comparison[comparison.length - 1].companyCost - comparison[0].companyCost) / comparison[0].companyCost) * 100)})
              </div>
            ` : ''}
          </div>
          ` : `
          <div class="card">
            <div class="card-header"><h3>Arbitrage RH</h3></div>
            <p style="font-size:0.85rem;color:var(--text-muted);">
              Renseignez un tarif journalier pour cet opérateur afin d'afficher la comparaison multi-statuts.
            </p>
          </div>
          `}

        </div>
        <div class="modal-footer">
          <button class="btn" id="detail-close-footer">Fermer</button>
          <button class="btn btn-primary" id="detail-edit">Modifier</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Fermeture
    const closeDetail = () => overlay.remove();
    overlay.querySelector('#detail-close').addEventListener('click', closeDetail);
    overlay.querySelector('#detail-close-footer').addEventListener('click', closeDetail);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeDetail();
    });

    // Bouton modifier → ouvre le formulaire
    overlay.querySelector('#detail-edit').addEventListener('click', () => {
      closeDetail();
      _openFormModal(op);
    });

    // Portail opérateur — synchroniser
    const btnSync = overlay.querySelector('#btn-sync-portail-op');
    if (btnSync) {
      btnSync.addEventListener('click', () => _syncOperateurPortail(op.id));
    }

    // Portail opérateur — générer
    const btnGenerer = overlay.querySelector('#btn-generer-portail-op');
    if (btnGenerer) {
      btnGenerer.addEventListener('click', () => {
        const token = DB.generateOperateurToken();
        DB.operators.update(op.id, {
          portailToken:     token,
          portailActif:     true,
          portailGenereeLe: new Date().toISOString()
        });
        if (typeof Toast !== 'undefined') {
          Toast.success('Accès portail généré pour ' + (op.firstName || '') + ' ' + (op.lastName || ''));
        }
        closeDetail();
        _openDetailModal(DB.operators.getById(op.id));
      });
    }

    // Portail opérateur — copier le lien
    const btnCopier = overlay.querySelector('#btn-copy-portail-op');
    if (btnCopier) {
      btnCopier.addEventListener('click', () => {
        const link = 'https://dst-system.fr/operateur/?token=' + op.portailToken;
        navigator.clipboard.writeText(link).then(() => {
          if (typeof Toast !== 'undefined') Toast.success('Lien copié dans le presse-papiers.');
          btnCopier.textContent = '✓ Copié';
          setTimeout(() => { btnCopier.textContent = '📋 Copier le lien'; }, 2000);
        }).catch(() => {
          prompt('Copiez ce lien :', link);
        });
      });
    }

    // Portail opérateur — désactiver
    const btnDesactiver = overlay.querySelector('#btn-desactiver-portail-op');
    if (btnDesactiver) {
      btnDesactiver.addEventListener('click', () => {
        if (!confirm('Désactiver l\'accès portail de ' + (op.firstName || '') + ' ' + (op.lastName || '') + ' ?')) return;
        DB.operators.update(op.id, { portailActif: false });
        if (typeof Toast !== 'undefined') Toast.info('Accès portail désactivé.');
        closeDetail();
        _openDetailModal(DB.operators.getById(op.id));
      });
    }
  }

  /* ----------------------------------------------------------
     MODALE — CONFIRMATION DE SUPPRESSION
     ---------------------------------------------------------- */

  /**
   * Demande confirmation avant de supprimer un opérateur.
   * @param {object} op — opérateur à supprimer
   */
  function _confirmDelete(op) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
      <div class="modal" style="max-width:480px;">
        <div class="modal-header">
          <h2>Confirmer la suppression</h2>
          <button class="btn btn-sm btn-ghost" id="del-close">&times;</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom:8px;">
            Voulez-vous vraiment supprimer l'opérateur
            <strong>${_escape(op.firstName)} ${_escape(op.lastName)}</strong> ?
          </p>
          <p style="font-size:0.82rem;color:var(--text-muted);">
            Cette action est irréversible. L'opérateur sera retiré du vivier RH.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn" id="del-cancel">Annuler</button>
          <button class="btn btn-primary" id="del-confirm" style="background:var(--accent-red);border-color:var(--accent-red);">Supprimer</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeConfirm = () => overlay.remove();
    overlay.querySelector('#del-close').addEventListener('click', closeConfirm);
    overlay.querySelector('#del-cancel').addEventListener('click', closeConfirm);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeConfirm();
    });

    overlay.querySelector('#del-confirm').addEventListener('click', () => {
      const name = (op.firstName || '') + ' ' + (op.lastName || '');
      DB.operators.delete(op.id);
      closeConfirm();
      _renderPage();
      Toast.show('Opérateur « ' + name.trim() + ' » supprimé.', 'warning');
    });
  }

  /* ----------------------------------------------------------
     SAUVEGARDE D'UN OPÉRATEUR (CRÉATION OU MISE À JOUR)
     ---------------------------------------------------------- */

  /**
   * Collecte les données du formulaire et crée ou met à jour l'opérateur.
   * @param {string|null} operatorId — ID existant ou null pour création
   * @param {HTMLElement} overlay — élément modale à fermer après sauvegarde
   */
  function _saveOperator(operatorId, overlay) {
    var tarifTypeEl = overlay.querySelector('input[name="tarifType"]:checked');
    var tarifType   = tarifTypeEl ? tarifTypeEl.value : 'freelance';
    var status      = overlay.querySelector('#op-status').value;
    var settings    = DB.settings.get();

    // Spécialités
    var rawSpecialties = overlay.querySelector('#op-specialites').value;
    var specialites = rawSpecialties.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });

    // Lire et calculer les tarifs selon le type
    var tarifsFreelance = { tarifJournalierHT: 0 };
    var tarifsPortage   = { tarifJournalierHT: 0 };
    var tarifsSalarie   = { saisieMode: 'brut_mensuel', valeur: 0, brutMensuelCalc: 0, netMensuelCalc: 0, coutJournalierEntreprise: 0, dateDebutCDD: '', dateFinCDD: '' };
    var tarifsVacation  = { tarifNetJournalier: 0, coutJournalierEntreprise: 0 };
    var coutJour        = 0;

    switch (tarifType) {
      case 'freelance': {
        var tjhF = parseFloat((overlay.querySelector('#op-freelance-tjh') || {}).value) || 0;
        tarifsFreelance = { tarifJournalierHT: tjhF };
        coutJour = tjhF;
        break;
      }
      case 'portage': {
        var tjhP = parseFloat((overlay.querySelector('#op-portage-tjh') || {}).value) || 0;
        tarifsPortage = { tarifJournalierHT: tjhP };
        coutJour = tjhP;
        break;
      }
      case 'cdi':
      case 'cdd': {
        var smS  = (overlay.querySelector('#op-' + tarifType + '-saisieMode') || {}).value || 'brut_mensuel';
        var valS = parseFloat((overlay.querySelector('#op-' + tarifType + '-valeur') || {}).value) || 0;
        var debS = tarifType === 'cdd' ? ((overlay.querySelector('#op-cdd-debut') || {}).value || '') : '';
        var finS = tarifType === 'cdd' ? ((overlay.querySelector('#op-cdd-fin')   || {}).value || '') : '';
        var cS   = _calcSalarieTarif(smS, valS, tarifType, settings);
        tarifsSalarie = {
          saisieMode: smS,
          valeur:     valS,
          brutMensuelCalc:          cS ? cS.brutMensuel : 0,
          netMensuelCalc:           cS ? cS.netMensuel  : 0,
          coutJournalierEntreprise: cS ? cS.coutJour    : 0,
          dateDebutCDD: debS,
          dateFinCDD:   finS
        };
        coutJour = cS ? cS.coutJour : 0;
        break;
      }
      case 'vacation': {
        var vn2 = parseFloat((overlay.querySelector('#op-vacation-net') || {}).value) || 0;
        var cv2 = _calcVacationTarif(vn2, settings);
        tarifsVacation = {
          tarifNetJournalier:       vn2,
          coutJournalierEntreprise: cv2 ? cv2.coutJour : 0
        };
        coutJour = cv2 ? cv2.coutJour : 0;
        break;
      }
    }

    // Sessions cette année pour coût annuel projeté
    var nbSess = 0;
    if (operatorId) {
      var yr = new Date().getFullYear().toString();
      nbSess = DB.sessions.getAll().filter(function(s) {
        return (s.operatorIds || []).includes(operatorId) &&
          s.date && s.date.startsWith(yr) &&
          s.statut !== 'annulee' && s.statut !== 'soldee';
      }).length;
    }
    var coutAnnuelProjecte = Engine.round2(coutJour * nbSess);

    // Champs zone
    var zoneLabel      = (overlay.querySelector('#op-zoneLabel')     || {}).value?.trim() || '';
    var villeBase      = (overlay.querySelector('#op-villeBase')      || {}).value?.trim() || '';
    var codePostalBase = (overlay.querySelector('#op-codePostalBase') || {}).value?.trim() || '';
    var rayonKm        = parseFloat((overlay.querySelector('#op-rayonKm') || {}).value) || 150;
    var rawDepts       = (overlay.querySelector('#op-departements')   || {}).value || '';
    var departements   = rawDepts.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });

    var segments     = Array.from(overlay.querySelectorAll('input[name="op-segments"]:checked')).map(function(cb) { return cb.value; });
    var niveauxMax   = Array.from(overlay.querySelectorAll('input[name="op-niveaux"]:checked')).map(function(cb) { return cb.value; });
    var certifications = (overlay.querySelector('#op-certifications') || {}).value?.trim() || '';

    var disponibiliteType = (overlay.querySelector('#op-dispoType')       || {}).value || 'ponctuelle';
    var joursDispoParMois = parseInt((overlay.querySelector('#op-joursDispoMois') || {}).value) || 0;

    var siretFreelance = (overlay.querySelector('#op-siret')       || {}).value?.trim() || '';
    var noteInterne    = (overlay.querySelector('#op-noteInterne') || {}).value?.trim() || '';

    var data = {
      firstName:        overlay.querySelector('#op-firstName').value.trim(),
      lastName:         overlay.querySelector('#op-lastName').value.trim(),
      email:            overlay.querySelector('#op-email').value.trim(),
      phone:            overlay.querySelector('#op-phone').value.trim(),
      status:           status,
      active:           overlay.querySelector('#op-active').checked,
      // Tarification — nouveaux champs
      typeContrat:              tarifType,
      tarifsFreelance,
      tarifsPortage,
      tarifsSalarie,
      tarifsVacation,
      coutJournalierEntreprise: Engine.round2(coutJour),
      coutAnnuelProjecte,
      // Rétrocompat
      netDaily:         Engine.round2(coutJour),
      companyCostDaily: Engine.round2(coutJour),
      costMode:         'daily_rate',
      specialites,
      notes:            overlay.querySelector('#op-notes').value.trim(),
      // Zone
      zoneLabel, villeBase, codePostalBase, rayonKm, departements,
      // Compétences
      segments, niveauxMax, certifications,
      // Disponibilités
      disponibiliteType, joursDispoParMois, periodeIndispo: JSON.parse(JSON.stringify(_modalIndispo)),
      // Contrat
      siretFreelance, noteInterne
    };

    if (!data.firstName || !data.lastName) return;

    if (operatorId) {
      DB.operators.update(operatorId, data);
      Toast.show('Opérateur « ' + data.firstName + ' ' + data.lastName + ' » mis à jour.', 'success');
    } else {
      DB.operators.create(data);
      Toast.show('Opérateur « ' + data.firstName + ' ' + data.lastName + ' » créé.', 'success');
    }

    overlay.remove();
    _renderPage();
  }

  /* ----------------------------------------------------------
     ÉVÉNEMENTS DE LA PAGE
     ---------------------------------------------------------- */

  /** Attache tous les écouteurs d'événements de la page principale */
  function _bindPageEvents() {
    // Bouton ajout (en-tête)
    const btnAdd = _container.querySelector('#btn-add-operator');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => _openFormModal(null));
    }

    // Bouton ajout (état vide)
    const btnAddEmpty = _container.querySelector('#btn-add-operator-empty');
    if (btnAddEmpty) {
      btnAddEmpty.addEventListener('click', () => _openFormModal(null));
    }

    // Recherche textuelle
    const searchInput = _container.querySelector('#search-operators');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        _searchQuery = e.target.value;
        _renderPage();
        // Remettre le focus et la position du curseur
        const newInput = _container.querySelector('#search-operators');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      });
    }

    // Filtre par statut
    const filterSelect = _container.querySelector('#filter-status');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        _statusFilter = e.target.value;
        _renderPage();
      });
    }

    // Filtre par segment
    const filterSegment = _container.querySelector('#filter-segment');
    if (filterSegment) {
      filterSegment.addEventListener('change', (e) => {
        _segmentFilter = e.target.value;
        _renderPage();
      });
    }

    // Filtre par disponibilité
    const filterDispo = _container.querySelector('#filter-dispo');
    if (filterDispo) {
      filterDispo.addEventListener('change', (e) => {
        _dispoFilter = e.target.value;
        _renderPage();
      });
    }

    // Actions sur les lignes du tableau (délégation d'événements)
    _container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const op = DB.operators.getById(id);
        if (!op) return;

        switch (action) {
          case 'view':
            _openDetailModal(op);
            break;
          case 'edit':
            _openFormModal(op);
            break;
          case 'delete':
            _confirmDelete(op);
            break;
        }
      });
    });
  }

  /* ----------------------------------------------------------
     UTILITAIRES INTERNES
     ---------------------------------------------------------- */

  /**
   * Retourne les opérateurs filtrés selon la recherche et le statut.
   * @returns {Array}
   */
  function _getFilteredOperators() {
    let operators = DB.operators.getAll();

    // Filtre par statut
    if (_statusFilter) {
      operators = operators.filter(op => op.status === _statusFilter);
    }

    // Filtre par segment
    if (_segmentFilter) {
      operators = operators.filter(op => (op.segments || []).includes(_segmentFilter));
    }

    // Filtre par disponibilité
    if (_dispoFilter) {
      operators = operators.filter(op => (op.disponibiliteType || 'ponctuelle') === _dispoFilter);
    }

    // Filtre par recherche textuelle (nom, prénom, spécialités, zone)
    if (_searchQuery.trim()) {
      const q = _searchQuery.toLowerCase().trim();
      operators = operators.filter(op => {
        const fullName = `${op.firstName} ${op.lastName}`.toLowerCase();
        const specs = (op.specialites || op.specialties || []).join(' ').toLowerCase();
        const statusText = Engine.statusLabel(op.status).toLowerCase();
        const zone = (op.zoneLabel || op.villeBase || '').toLowerCase();
        return fullName.includes(q) || specs.includes(q) || statusText.includes(q) || zone.includes(q);
      });
    }

    // Tri : actifs en premier, puis par nom
    operators.sort((a, b) => {
      const activeA = a.active !== false ? 0 : 1;
      const activeB = b.active !== false ? 0 : 1;
      if (activeA !== activeB) return activeA - activeB;
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'fr');
    });

    return operators;
  }

  /**
   * Retourne le coût entreprise journalier d'un opérateur pour l'affichage.
   * @param {object} op — opérateur
   * @param {object} settings — paramètres économiques
   * @returns {number|null}
   */
  /** Retourne le badge HTML pour le type de tarification/contrat */
  function _typeContratBadge(typeContrat) {
    var map = {
      freelance:          ['tag-blue',    'Freelance'],
      portage:            ['tag-neutral', 'Portage'],
      cdi:                ['tag-green',   'CDI'],
      cdd:                ['tag-yellow',  'CDD'],
      vacation:           ['tag-neutral', 'Vacation'],
      auto_entrepreneur:  ['tag-blue',    'AE'],
      interim:            ['tag-yellow',  'Intérim'],
      contrat_journalier: ['tag-neutral', 'Journalier'],
      fondateur:          ['tag-red',     'Fondateur'],
    };
    if (!typeContrat) return '';
    var entry = map[typeContrat] || ['tag-neutral', typeContrat];
    return '<span class="tag ' + entry[0] + '" style="font-size:0.7rem;">' + entry[1] + '</span>';
  }

  function _getDisplayCost(op, settings) {
    if (op.status === 'fondateur') return 0;
    if (op.coutJournalierEntreprise > 0) return op.coutJournalierEntreprise;
    if (op.costMode === 'company_max') return op.companyCostDaily || null;
    if (op.netDaily && op.netDaily > 0) {
      const calc = Engine.netToCompanyCost(op.netDaily, op.status, settings);
      return calc.companyCost;
    }
    return null;
  }

  /**
   * Calcule le détail complet du coût pour un opérateur.
   * @param {object} op — opérateur
   * @param {object} settings — paramètres économiques
   * @returns {object|null}
   */
  function _computeOperatorCost(op, settings) {
    var tc = op.typeContrat;
    // CDI/CDD — recalcul depuis les données salariales
    if ((tc === 'cdi' || tc === 'cdd') && op.tarifsSalarie && op.tarifsSalarie.netMensuelCalc > 0) {
      var cc = Engine.getChargesConfig(settings);
      var joursAn = (cc && cc.joursOuvresAn) || 218;
      var netJour = Engine.round2(op.tarifsSalarie.netMensuelCalc * 12 / joursAn);
      return Engine.netToCompanyCost(netJour, tc, settings);
    }
    // Freelance / Portage — TJM direct
    if (tc === 'freelance' || tc === 'portage') {
      var tjh = tc === 'freelance'
        ? (op.tarifsFreelance && op.tarifsFreelance.tarifJournalierHT) || op.coutJournalierEntreprise || 0
        : (op.tarifsPortage  && op.tarifsPortage.tarifJournalierHT)   || op.coutJournalierEntreprise || 0;
      if (tjh > 0) return { net: tjh, gross: tjh, charges: 0, companyCost: tjh, detailComplet: null };
    }
    // Champ unifié
    if (op.coutJournalierEntreprise > 0) {
      return { net: op.coutJournalierEntreprise, gross: op.coutJournalierEntreprise, charges: 0, companyCost: op.coutJournalierEntreprise, detailComplet: null };
    }
    // Rétrocompat
    if (op.costMode === 'company_max' && op.companyCostDaily > 0) {
      return Engine.companyCostToNet(op.companyCostDaily, op.status, settings);
    }
    if (op.netDaily && op.netDaily > 0) {
      return Engine.netToCompanyCost(op.netDaily, op.status, settings);
    }
    return null;
  }

  /**
   * Calcule le coût entreprise moyen des opérateurs actifs.
   * @param {Array} operators — liste d'opérateurs actifs
   * @returns {number|null}
   */
  function _computeAverageCost(operators) {
    if (operators.length === 0) return null;
    const settings = DB.settings.get();
    let total = 0;
    let count = 0;

    operators.forEach(op => {
      const cost = _getDisplayCost(op, settings);
      if (cost !== null && cost > 0) {
        total += cost;
        count++;
      }
    });

    return count > 0 ? Engine.round2(total / count) : null;
  }

  /**
   * Retourne un objet opérateur par défaut pour le formulaire de création.
   * @returns {object}
   */
  function _defaultOperator() {
    return Object.assign({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      status: 'freelance',
      active: true,
      costMode: 'net_desired',
      netDaily: 0,
      companyCostDaily: 0,
      specialites: [],
      notes: ''
    }, DB.DEFAULT_OPERATOR);
  }

  /**
   * Échappe le HTML pour éviter les injections XSS.
   * @param {string} str
   * @returns {string}
   */
  function _escape(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Échappe une chaîne pour utilisation dans un attribut HTML.
   * @param {string} str
   * @returns {string}
   */
  function _escapeAttr(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ----------------------------------------------------------
     API PUBLIQUE
     ---------------------------------------------------------- */

  return { render };

})();
