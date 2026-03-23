/* ============================================================
   DST-SYSTEM — Vue Simulateurs
   Gestion du parc matériel de simulation
   ============================================================ */

window.Views = window.Views || {};

Views.Simulateurs = (() => {
  'use strict';

  /* --- Utilitaires --- */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('fr-FR');
  }

  const ETATS = {
    actif:        { label: 'Actif',        badge: 'badge-success' },
    maintenance:  { label: 'Maintenance',  badge: 'badge-warning' },
    inactif:      { label: 'Inactif',      badge: 'badge-secondary' }
  };

  /* --- Calculer les jours utilisés par un simulateur cette année --- */
  function _joursUtilises(sim) {
    const year = new Date().getFullYear();
    const sessions = DB.sessions.getAll().filter(s => {
      if (s.statut === 'annulee' || s.statut === 'planifiee') return false;
      if (!s.date) return false;
      const d = new Date(s.date);
      if (d.getFullYear() !== year) return false;
      // Le simulateur est rattaché à une région ; on filtre par région
      if (!sim.regionId) return false;
      const region = DB.regions.getAll().find(r => r.id === sim.regionId);
      if (!region) return false;
      const client = DB.clients.getAll().find(c => c.id === s.clientId);
      if (client && client.zoneLabel === region.nom) return true;
      if (s.locationId) {
        const loc = DB.locations.getAll().find(l => l.id === s.locationId);
        if (loc && loc.departement && (region.departements || []).includes(loc.departement)) return true;
      }
      return false;
    });
    return sessions.reduce((sum, s) => sum + (Number(s.nbJours) || 1), 0);
  }

  /* --- Calculer la date de prochaine maintenance --- */
  function _calcProchaineMaintenance(derniere, periode) {
    if (!derniere || !periode) return null;
    const d = new Date(derniere);
    if (isNaN(d)) return null;
    d.setDate(d.getDate() + Number(periode));
    return d.toISOString().slice(0, 10);
  }

  /* --- Alerte maintenance < 30 jours --- */
  function _joursAvantMaintenance(sim) {
    if (!sim.prochaineMaintenance) return null;
    const diff = Math.round((new Date(sim.prochaineMaintenance) - new Date()) / 86400000);
    return diff;
  }

  /* --- État des filtres liste --- */
  let _simSearch       = '';
  let _simFilterEtat   = '';
  let _simFilterRegion = '';

  /* ============================================================
     RENDER PRINCIPAL
     ============================================================ */
  function render(container) {
    _renderList(container);
  }

  /* ============================================================
     LISTE DES SIMULATEURS
     ============================================================ */
  function _renderList(container) {
    const sims    = DB.simulateurs.getAll();
    const regions = DB.regions.getAll();
    const settings = DB.settings.get();

    // Alertes maintenance
    const alertesMaint = sims.filter(s => {
      const j = _joursAvantMaintenance(s);
      return j !== null && j <= 30 && s.etat === 'actif';
    });

    let alertHTML = '';
    if (alertesMaint.length > 0) {
      alertHTML = `<div class="alert alert-warning" style="margin-bottom:16px">
        <span class="alert-icon">⚠</span>
        <strong>${alertesMaint.length} simulateur(s)</strong> avec maintenance à venir dans &lt;30 jours :
        ${alertesMaint.map(s => `<strong>${escapeHTML(s.nom)}</strong> (${formatDate(s.prochaineMaintenance)})`).join(', ')}
      </div>`;
    }

    function buildRows() {
      const filtered = sims.filter(s => {
        if (_simSearch) {
          const q = _simSearch.toLowerCase();
          if (!((s.nom || '').toLowerCase().includes(q) || (s.modele || '').toLowerCase().includes(q))) return false;
        }
        if (_simFilterEtat && s.etat !== _simFilterEtat) return false;
        if (_simFilterRegion) {
          const region = regions.find(r => r.id === s.regionId);
          if (!region || region.nom !== _simFilterRegion) return false;
        }
        return true;
      });

      if (sims.length === 0) {
        return `<tr><td colspan="8" class="text-center text-muted" style="padding:32px">
          Aucun simulateur enregistré.<br>Cliquez sur <strong>+ Nouveau simulateur</strong> pour commencer.
        </td></tr>`;
      }
      if (filtered.length === 0) {
        return `<tr><td colspan="8" class="text-center text-muted" style="padding:32px">
          Aucun simulateur ne correspond aux filtres.
        </td></tr>`;
      }

      return filtered.map(s => {
        const etat       = ETATS[s.etat] || ETATS.inactif;
        const region     = regions.find(r => r.id === s.regionId);
        const joursMax   = s.joursMaxParAn || 150;
        const joursUtil  = _joursUtilises(s);
        const taux       = Math.round(joursUtil / joursMax * 100);
        const tauxClass  = taux >= 93 ? 'text-danger' : taux >= 80 ? 'text-warning' : 'text-success';
        const jMaint     = _joursAvantMaintenance(s);
        const maintClass = jMaint !== null && jMaint <= 30 ? 'text-danger' : jMaint !== null && jMaint <= 60 ? 'text-warning' : '';
        const maintTxt   = s.prochaineMaintenance ? `${formatDate(s.prochaineMaintenance)}${jMaint !== null ? ` (J-${jMaint})` : ''}` : '—';

        return `
          <tr>
            <td><strong>${escapeHTML(s.nom)}</strong>${s.numeroSerie ? `<br><small class="text-muted">${escapeHTML(s.numeroSerie)}</small>` : ''}</td>
            <td>${escapeHTML(s.modele || '—')}</td>
            <td><span class="badge ${etat.badge}">${etat.label}</span></td>
            <td>${escapeHTML(region ? region.nom : '—')}</td>
            <td class="text-center">${joursMax} j/an</td>
            <td class="text-center ${tauxClass}">${joursUtil} j (${taux}%)</td>
            <td class="${maintClass}">${maintTxt}</td>
            <td>
              <button class="btn btn-sm btn-secondary btn-edit-sim" data-id="${escapeHTML(s.id)}" title="Modifier">✎</button>
              <button class="btn btn-sm btn-danger btn-delete-sim" data-id="${escapeHTML(s.id)}" title="Supprimer">✕</button>
            </td>
          </tr>`;
      }).join('');
    }

    function bindRowEvents() {
      container.querySelectorAll('.btn-edit-sim').forEach(btn =>
        btn.addEventListener('click', () => _openModal(container, btn.dataset.id)));
      container.querySelectorAll('.btn-delete-sim').forEach(btn =>
        btn.addEventListener('click', () => _deleteSim(container, btn.dataset.id)));
    }

    const regionOptions = regions.map(r =>
      `<option value="${escapeHTML(r.nom)}" ${_simFilterRegion === r.nom ? 'selected' : ''}>${escapeHTML(r.nom)}</option>`
    ).join('');

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Simulateurs</h1>
          <p class="view-subtitle">Parc matériel — ${sims.length} simulateur(s) · ${sims.filter(s => s.etat === 'actif').length} actif(s)</p>
        </div>
        <button class="btn btn-primary" id="btn-new-sim">+ Nouveau simulateur</button>
      </div>

      ${alertHTML}

      <div class="card">
        <div style="display:flex;gap:12px;align-items:center;padding:12px 0 16px;flex-wrap:wrap;">
          <div style="flex:2;min-width:180px;">
            <input type="text" class="form-input" id="filter-sim-search"
                   placeholder="Rechercher un simulateur..." value="${escapeHTML(_simSearch)}" style="width:100%;">
          </div>
          <div style="flex:1;min-width:140px;">
            <select class="form-input" id="filter-sim-etat" style="width:100%;">
              <option value="">Tous les états</option>
              <option value="actif"       ${_simFilterEtat === 'actif'       ? 'selected' : ''}>Actif</option>
              <option value="maintenance" ${_simFilterEtat === 'maintenance' ? 'selected' : ''}>En maintenance</option>
              <option value="inactif"     ${_simFilterEtat === 'inactif'     ? 'selected' : ''}>Inactif</option>
            </select>
          </div>
          <div style="flex:1;min-width:140px;">
            <select class="form-input" id="filter-sim-region" style="width:100%;">
              <option value="">Toutes les régions</option>
              ${regionOptions}
            </select>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom / N° série</th>
              <th>Modèle</th>
              <th>État</th>
              <th>Région</th>
              <th class="text-center">Jours max</th>
              <th class="text-center">Utilisés (taux)</th>
              <th>Prochaine maint.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="sims-tbody">${buildRows()}</tbody>
        </table>
      </div>

      <div id="sim-modal-container"></div>`;

    container.querySelector('#btn-new-sim').addEventListener('click', () => _openModal(container));

    // Filtres — re-render tbody uniquement
    const searchInput  = container.querySelector('#filter-sim-search');
    const etatSelect   = container.querySelector('#filter-sim-etat');
    const regionSelect = container.querySelector('#filter-sim-region');

    searchInput.addEventListener('input', () => {
      _simSearch = searchInput.value;
      container.querySelector('#sims-tbody').innerHTML = buildRows();
      bindRowEvents();
    });
    etatSelect.addEventListener('change', () => {
      _simFilterEtat = etatSelect.value;
      container.querySelector('#sims-tbody').innerHTML = buildRows();
      bindRowEvents();
    });
    regionSelect.addEventListener('change', () => {
      _simFilterRegion = regionSelect.value;
      container.querySelector('#sims-tbody').innerHTML = buildRows();
      bindRowEvents();
    });

    bindRowEvents();
  }

  /* ============================================================
     MODAL CRÉATION / ÉDITION
     ============================================================ */
  function _openModal(container, simId) {
    const isEdit = !!simId;
    const sim    = isEdit ? DB.simulateurs.getAll().find(s => s.id === simId) : null;
    const regions = DB.regions.getAll();

    const regionOptions = regions.map(r =>
      `<option value="${escapeHTML(r.id)}" ${sim && sim.regionId === r.id ? 'selected' : ''}>${escapeHTML(r.nom)} (${escapeHTML(r.code || '')})</option>`
    ).join('');

    const modalEl = container.querySelector('#sim-modal-container');
    modalEl.innerHTML = `
      <div class="modal-overlay" id="sim-modal">
        <div class="modal" style="max-width:580px">
          <div class="modal-header">
            <h3 class="modal-title">${isEdit ? 'Modifier le simulateur' : 'Nouveau simulateur'}</h3>
            <button class="modal-close" id="btn-close-sim-modal">✕</button>
          </div>
          <div class="modal-body" style="max-height:70vh;overflow-y:auto">

            <div class="form-row" style="display:grid;grid-template-columns:2fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Nom <span class="text-danger">*</span></label>
                <input type="text" class="form-input" id="sim-nom" value="${escapeHTML(sim ? sim.nom : '')}" placeholder="ex: SIM-IDF-01">
              </div>
              <div class="form-group">
                <label class="form-label">État</label>
                <select class="form-input" id="sim-etat">
                  ${Object.entries(ETATS).map(([k, v]) =>
                    `<option value="${k}" ${sim && sim.etat === k ? 'selected' : ''}>${v.label}</option>`
                  ).join('')}
                </select>
              </div>
            </div>

            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Modèle</label>
                <input type="text" class="form-input" id="sim-modele" value="${escapeHTML(sim ? sim.modele || '' : '')}" placeholder="ex: SimFire Pro 3000">
              </div>
              <div class="form-group">
                <label class="form-label">N° de série</label>
                <input type="text" class="form-input" id="sim-serie" value="${escapeHTML(sim ? sim.numeroSerie || '' : '')}" placeholder="ex: SFP-2024-001">
              </div>
            </div>

            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Région</label>
                <select class="form-input" id="sim-region">
                  <option value="">— Aucune région —</option>
                  ${regionOptions}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Jours max / an</label>
                <input type="number" class="form-input" id="sim-jours-max" value="${sim ? sim.joursMaxParAn || 150 : 150}" min="1" max="365">
              </div>
            </div>

            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Date d'acquisition</label>
                <input type="date" class="form-input" id="sim-acquisition" value="${escapeHTML(sim ? sim.dateAcquisition || '' : '')}">
              </div>
              <div class="form-group">
                <label class="form-label">Prix d'acquisition HT (€)</label>
                <input type="number" class="form-input" id="sim-prix" value="${sim ? sim.prixAcquisitionHT || '' : ''}" min="0" placeholder="40000">
              </div>
            </div>

            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Dernière maintenance</label>
                <input type="date" class="form-input" id="sim-derniere-maint" value="${escapeHTML(sim ? sim.derniereMaintenance || '' : '')}">
              </div>
              <div class="form-group">
                <label class="form-label">Période maintenance (jours)</label>
                <input type="number" class="form-input" id="sim-periode-maint" value="${sim ? sim.periodeMaintenanceJours || 180 : 180}" min="1">
                <div class="form-help">Prochaine maintenance calculée automatiquement</div>
              </div>
            </div>

            <div class="form-group" style="padding:12px;background:#2a2a30;border-radius:4px">
              <div style="font-size:0.85em;color:#a0a0a8">Prochaine maintenance calculée :</div>
              <div id="sim-prochaine-preview" style="font-weight:600;color:#e8e8ec">—</div>
            </div>

            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-input" id="sim-notes" rows="3">${escapeHTML(sim ? sim.notes || '' : '')}</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel-sim">Annuler</button>
            <button class="btn btn-primary" id="btn-save-sim">${isEdit ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </div>
      </div>`;

    const modal = document.getElementById('sim-modal');

    // Preview prochaine maintenance
    function updatePreview() {
      const derniere = document.getElementById('sim-derniere-maint').value;
      const periode  = document.getElementById('sim-periode-maint').value;
      const preview  = document.getElementById('sim-prochaine-preview');
      const calc = _calcProchaineMaintenance(derniere, periode);
      if (calc) {
        const j = Math.round((new Date(calc) - new Date()) / 86400000);
        const cls = j <= 30 ? 'color:#f44336' : j <= 60 ? 'color:#ff9800' : 'color:#4caf50';
        preview.innerHTML = `<span style="${cls}">${formatDate(calc)}</span> <span class="text-muted">(dans ${j} j)</span>`;
      } else {
        preview.textContent = '—';
      }
    }
    document.getElementById('sim-derniere-maint').addEventListener('input', updatePreview);
    document.getElementById('sim-periode-maint').addEventListener('input', updatePreview);
    if (sim && sim.derniereMaintenance) updatePreview();

    const close = () => { modal.remove(); _renderList(container); };
    document.getElementById('btn-close-sim-modal').addEventListener('click', close);
    document.getElementById('btn-cancel-sim').addEventListener('click', close);

    document.getElementById('btn-save-sim').addEventListener('click', () => {
      const nom = document.getElementById('sim-nom').value.trim();
      if (!nom) { alert('Le nom du simulateur est requis.'); return; }

      const derniere = document.getElementById('sim-derniere-maint').value;
      const periode  = Number(document.getElementById('sim-periode-maint').value) || 180;
      const prochaine = _calcProchaineMaintenance(derniere, periode) ||
                        (sim ? sim.prochaineMaintenance : null);

      const payload = {
        nom,
        modele:                  document.getElementById('sim-modele').value.trim(),
        numeroSerie:             document.getElementById('sim-serie').value.trim(),
        etat:                    document.getElementById('sim-etat').value,
        regionId:                document.getElementById('sim-region').value || null,
        joursMaxParAn:           Number(document.getElementById('sim-jours-max').value) || 150,
        dateAcquisition:         document.getElementById('sim-acquisition').value || null,
        prixAcquisitionHT:       Number(document.getElementById('sim-prix').value) || 0,
        derniereMaintenance:     derniere || null,
        periodeMaintenanceJours: periode,
        prochaineMaintenance:    prochaine,
        notes:                   document.getElementById('sim-notes').value.trim()
      };

      if (isEdit) {
        DB.simulateurs.update(simId, payload);
      } else {
        DB.simulateurs.create(payload);
      }
      modal.remove();
      _renderList(container);
    });
  }

  /* ============================================================
     SUPPRESSION
     ============================================================ */
  function _deleteSim(container, simId) {
    const sim = DB.simulateurs.getAll().find(s => s.id === simId);
    if (!sim) return;
    if (!confirm(`Supprimer le simulateur "${sim.nom}" ?\nCette action est irréversible.`)) return;
    DB.simulateurs.delete(simId);
    _renderList(container);
  }

  /* --- API publique --- */
  return { render };
})();
