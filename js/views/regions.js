/* ============================================================
   DST-SYSTEM — Vue Régions
   Gestion du déploiement progressif par zone géographique
   ============================================================ */

window.Views = window.Views || {};

Views.Regions = (() => {
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

  const STATUTS = {
    nationale:  { label: 'Phase 1 — Nationale', badge: 'badge-info' },
    attribuee:  { label: 'Phase 2 — Attribuée', badge: 'badge-warning' },
    renforcee:  { label: 'Phase 3 — Renforcée', badge: 'badge-success' }
  };

  /* --- Calculs capacité région --- */
  function _capaciteRegion(region) {
    const sims = DB.simulateurs.getAll().filter(s => s.regionId === region.id && s.etat === 'actif');
    const settings = DB.settings.get();
    const joursMaxDefaut = (settings.capacite && settings.capacite.joursMaxParUniteParAn) || 150;
    return sims.reduce((sum, s) => sum + (s.joursMaxParAn || joursMaxDefaut), 0);
  }

  function _joursUtilisesRegion(region) {
    const now = new Date();
    const year = now.getFullYear();
    const sessions = DB.sessions.getAll().filter(s => {
      if (s.statut === 'annulee' || s.statut === 'planifiee') return false;
      if (!s.date) return false;
      const d = new Date(s.date);
      if (d.getFullYear() !== year) return false;
      // Matching : client.zoneLabel === region.nom OU location.departement dans region.departements
      const client = DB.clients.getAll().find(c => c.id === s.clientId);
      if (client && client.zoneLabel === region.nom) return true;
      if (s.locationId) {
        const loc = DB.locations.getAll().find(l => l.id === s.locationId);
        if (loc && loc.departement && region.departements && region.departements.includes(loc.departement)) return true;
      }
      return false;
    });
    return sessions.reduce((sum, s) => sum + (Number(s.nbJours) || 1), 0);
  }

  /* --- État courant (liste vs fiche) --- */
  let _currentRegionId = null;

  /* ============================================================
     RENDER PRINCIPAL
     ============================================================ */
  function render(container) {
    _currentRegionId = null;
    _renderList(container);
  }

  /* ============================================================
     LISTE DES RÉGIONS
     ============================================================ */
  function _renderList(container) {
    const regions = DB.regions.getAll();
    const settings = DB.settings.get();
    const seuilAlerte   = (settings.capacite && settings.capacite.seuilAlerteJours)   || 120;
    const seuilCritique = (settings.capacite && settings.capacite.seuilCritiqueJours) || 140;

    let rowsHTML = '';
    if (regions.length === 0) {
      rowsHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding:32px">
        Aucune région définie.<br>Cliquez sur <strong>+ Nouvelle région</strong> pour commencer.
      </td></tr>`;
    } else {
      regions.forEach(r => {
        const statut    = STATUTS[r.statut] || STATUTS.nationale;
        const nbOps     = (r.operateurIds || []).length;
        const nbSims    = DB.simulateurs.getAll().filter(s => s.regionId === r.id).length;
        const capacite  = _capaciteRegion(r);
        const utilises  = _joursUtilisesRegion(r);
        const taux      = capacite > 0 ? Math.round(utilises / capacite * 100) : 0;
        const tauxClass = taux >= Math.round(seuilCritique / (settings.capacite && settings.capacite.joursMaxParUniteParAn || 150) * 100)
          ? 'text-danger' : taux >= Math.round(seuilAlerte / (settings.capacite && settings.capacite.joursMaxParUniteParAn || 150) * 100)
          ? 'text-warning' : 'text-success';
        const deps = (r.departements || []).join(', ') || '—';

        rowsHTML += `
          <tr>
            <td><a href="#" class="link-primary region-fiche" data-id="${escapeHTML(r.id)}">${escapeHTML(r.nom)}</a></td>
            <td><strong>${escapeHTML(r.code || '—')}</strong></td>
            <td class="text-muted" style="font-size:0.85em">${escapeHTML(deps)}</td>
            <td><span class="badge ${statut.badge}">${statut.label}</span></td>
            <td class="text-center">${nbOps}</td>
            <td class="text-center">${nbSims}</td>
            <td class="text-center">${capacite > 0 ? capacite + ' j' : '—'}</td>
            <td class="text-center ${tauxClass}">${capacite > 0 ? taux + '%' : '—'}</td>
            <td>
              <button class="btn btn-sm btn-secondary btn-edit-region" data-id="${escapeHTML(r.id)}" title="Modifier">✎</button>
              <button class="btn btn-sm btn-danger btn-delete-region" data-id="${escapeHTML(r.id)}" title="Supprimer">✕</button>
            </td>
          </tr>`;
      });
    }

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Régions</h1>
          <p class="view-subtitle">Déploiement progressif — ${regions.length} région(s) définie(s)</p>
        </div>
        <button class="btn btn-primary" id="btn-new-region">+ Nouvelle région</button>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Région</th>
              <th>Code</th>
              <th>Départements</th>
              <th>Statut</th>
              <th class="text-center">Opérateurs</th>
              <th class="text-center">Simulateurs</th>
              <th class="text-center">Capacité</th>
              <th class="text-center">Taux</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      </div>

      <div id="region-modal-container"></div>`;

    // Events
    container.querySelector('#btn-new-region').addEventListener('click', () => _openModal(container));
    container.querySelectorAll('.btn-edit-region').forEach(btn =>
      btn.addEventListener('click', () => _openModal(container, btn.dataset.id)));
    container.querySelectorAll('.btn-delete-region').forEach(btn =>
      btn.addEventListener('click', () => _deleteRegion(container, btn.dataset.id)));
    container.querySelectorAll('.region-fiche').forEach(a =>
      a.addEventListener('click', (e) => { e.preventDefault(); _renderFiche(container, a.dataset.id); }));
  }

  /* ============================================================
     FICHE RÉGION
     ============================================================ */
  function _renderFiche(container, regionId) {
    const region = DB.regions.getAll().find(r => r.id === regionId);
    if (!region) return _renderList(container);

    const statut   = STATUTS[region.statut] || STATUTS.nationale;
    const capacite = _capaciteRegion(region);
    const utilises = _joursUtilisesRegion(region);
    const taux     = capacite > 0 ? Math.round(utilises / capacite * 100) : 0;

    const allOps  = DB.operators.getAll();
    const allSims = DB.simulateurs.getAll().filter(s => s.regionId === region.id);

    // Opérateurs rattachés
    const opsRows = (region.operateurIds || []).map(oid => {
      const op = allOps.find(o => o.id === oid);
      if (!op) return '';
      return `<tr>
        <td>${escapeHTML(op.prenom || '')} ${escapeHTML(op.nom || '')}</td>
        <td>${escapeHTML(op.typeContrat || '—')}</td>
        <td>${escapeHTML(op.specialites || '—')}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="3" class="text-muted text-center">Aucun opérateur rattaché</td></tr>`;

    // Simulateurs
    const simsRows = allSims.map(s => {
      const etatClass = s.etat === 'actif' ? 'badge-success' : s.etat === 'maintenance' ? 'badge-warning' : 'badge-secondary';
      return `<tr>
        <td>${escapeHTML(s.nom)}</td>
        <td>${escapeHTML(s.modele || '—')}</td>
        <td><span class="badge ${etatClass}">${escapeHTML(s.etat || '—')}</span></td>
        <td class="text-center">${s.joursMaxParAn || 150} j/an</td>
      </tr>`;
    }).join('') || `<tr><td colspan="4" class="text-muted text-center">Aucun simulateur associé</td></tr>`;

    // Sessions récentes
    const year = new Date().getFullYear();
    const sessionsRegion = DB.sessions.getAll().filter(s => {
      if (!s.date) return false;
      if (new Date(s.date).getFullYear() !== year) return false;
      const client = DB.clients.getAll().find(c => c.id === s.clientId);
      if (client && client.zoneLabel === region.nom) return true;
      if (s.locationId) {
        const loc = DB.locations.getAll().find(l => l.id === s.locationId);
        if (loc && loc.departement && (region.departements || []).includes(loc.departement)) return true;
      }
      return false;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 10);

    const sessRows = sessionsRegion.map(s => {
      const client = DB.clients.getAll().find(c => c.id === s.clientId);
      return `<tr>
        <td>${escapeHTML(s.date || '—')}</td>
        <td>${escapeHTML(client ? client.nom : '—')}</td>
        <td>${escapeHTML(s.titre || s.moduleId || '—')}</td>
        <td class="text-center">${s.nbJours || 1} j</td>
        <td><span class="badge badge-${s.statut === 'terminee' ? 'success' : s.statut === 'annulee' ? 'danger' : 'info'}">${escapeHTML(s.statut || '—')}</span></td>
      </tr>`;
    }).join('') || `<tr><td colspan="5" class="text-muted text-center">Aucune session cette année</td></tr>`;

    // Barre de capacité
    const settings     = DB.settings.get();
    const joursMax     = (settings.capacite && settings.capacite.joursMaxParUniteParAn) || 150;
    const pctUtilise   = capacite > 0 ? Math.min(100, Math.round(utilises / capacite * 100)) : 0;
    const pctAlerte    = capacite > 0 ? Math.round((settings.capacite && settings.capacite.seuilAlerteJours || 120) / joursMax * 100) : 80;
    const pctCritique  = capacite > 0 ? Math.round((settings.capacite && settings.capacite.seuilCritiqueJours || 140) / joursMax * 100) : 93;
    const pctVert      = Math.min(pctUtilise, pctAlerte);
    const pctOrange    = pctUtilise > pctAlerte ? Math.min(pctUtilise - pctAlerte, pctCritique - pctAlerte) : 0;
    const pctRouge     = pctUtilise > pctCritique ? pctUtilise - pctCritique : 0;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">
            <a href="#" class="link-secondary" id="btn-back-regions">← Régions</a>
            &nbsp;/&nbsp; ${escapeHTML(region.nom)}
            <span class="badge ${statut.badge}" style="font-size:0.6em;vertical-align:middle;margin-left:8px">${statut.label}</span>
          </h1>
          <p class="view-subtitle">Code : <strong>${escapeHTML(region.code || '—')}</strong>
            — Départements : ${escapeHTML((region.departements || []).join(', ') || '—')}</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" id="btn-edit-fiche">✎ Modifier</button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:24px">
        <div class="kpi-card">
          <div class="kpi-label">Opérateurs</div>
          <div class="kpi-value">${(region.operateurIds || []).length}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Simulateurs actifs</div>
          <div class="kpi-value">${allSims.filter(s => s.etat === 'actif').length}</div>
        </div>
        <div class="kpi-card ${taux >= 93 ? 'kpi-alert' : taux >= 80 ? 'kpi-warning' : 'kpi-success'}">
          <div class="kpi-label">Taux utilisation</div>
          <div class="kpi-value">${capacite > 0 ? taux + '%' : 'N/A'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Jours restants</div>
          <div class="kpi-value">${capacite > 0 ? Math.max(0, capacite - utilises) + ' j' : '—'}</div>
        </div>
      </div>

      <!-- Barre de capacité -->
      ${capacite > 0 ? `
      <div class="card" style="margin-bottom:24px">
        <div class="card-header"><strong>Capacité opérationnelle</strong> — ${utilises} / ${capacite} jours</div>
        <div style="padding:16px">
          <div style="background:#2a2a30;border-radius:4px;height:18px;overflow:hidden;display:flex">
            <div style="width:${pctVert}%;background:#388e3c;height:100%;transition:width 0.3s"></div>
            <div style="width:${pctOrange}%;background:#f57c00;height:100%;transition:width 0.3s"></div>
            <div style="width:${pctRouge}%;background:#d32f2f;height:100%;transition:width 0.3s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.8em;color:#a0a0a8;margin-top:4px">
            <span>0</span><span>Alerte ${pctAlerte}%</span><span>Critique ${pctCritique}%</span><span>100%</span>
          </div>
        </div>
      </div>` : ''}

      <!-- Simulateurs -->
      <div class="card" style="margin-bottom:24px">
        <div class="card-header"><strong>Simulateurs</strong></div>
        <table class="data-table">
          <thead><tr><th>Nom</th><th>Modèle</th><th>État</th><th class="text-center">Capacité</th></tr></thead>
          <tbody>${simsRows}</tbody>
        </table>
      </div>

      <!-- Opérateurs -->
      <div class="card" style="margin-bottom:24px">
        <div class="card-header"><strong>Opérateurs rattachés</strong></div>
        <table class="data-table">
          <thead><tr><th>Nom</th><th>Statut</th><th>Spécialités</th></tr></thead>
          <tbody>${opsRows}</tbody>
        </table>
      </div>

      <!-- Sessions -->
      <div class="card" style="margin-bottom:24px">
        <div class="card-header"><strong>Sessions ${year}</strong> — ${sessionsRegion.length} session(s)</div>
        <table class="data-table">
          <thead><tr><th>Date</th><th>Client</th><th>Objet</th><th class="text-center">Jours</th><th>Statut</th></tr></thead>
          <tbody>${sessRows}</tbody>
        </table>
      </div>

      ${region.notes ? `<div class="card"><div class="card-header"><strong>Notes</strong></div><div style="padding:16px;white-space:pre-wrap">${escapeHTML(region.notes)}</div></div>` : ''}

      <div id="region-modal-container"></div>`;

    container.querySelector('#btn-back-regions').addEventListener('click', e => {
      e.preventDefault(); _renderList(container);
    });
    container.querySelector('#btn-edit-fiche').addEventListener('click', () =>
      _openModal(container, region.id, true));
  }

  /* ============================================================
     MODAL CRÉATION / ÉDITION
     ============================================================ */
  function _openModal(container, regionId, fromFiche) {
    const isEdit = !!regionId;
    const region = isEdit ? DB.regions.getAll().find(r => r.id === regionId) : null;
    const allOps = DB.operators.getAll();

    const opsCheckboxes = allOps.map(op => {
      const checked = (region && (region.operateurIds || []).includes(op.id)) ? 'checked' : '';
      return `<label style="display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer">
        <input type="checkbox" class="op-check" value="${escapeHTML(op.id)}" ${checked}>
        ${escapeHTML((op.prenom || '') + ' ' + (op.nom || '') + (op.typeContrat ? ' — ' + op.typeContrat : ''))}
      </label>`;
    }).join('');

    const modalEl = document.getElementById('region-modal-container') || container.querySelector('#region-modal-container');
    modalEl.innerHTML = `
      <div class="modal-overlay" id="region-modal">
        <div class="modal" style="max-width:560px">
          <div class="modal-header">
            <h3 class="modal-title">${isEdit ? 'Modifier la région' : 'Nouvelle région'}</h3>
            <button class="modal-close" id="btn-close-region-modal">✕</button>
          </div>
          <div class="modal-body" style="max-height:70vh;overflow-y:auto">

            <div class="form-group">
              <label class="form-label">Nom de la région <span class="text-danger">*</span></label>
              <input type="text" class="form-input" id="reg-nom" value="${escapeHTML(region ? region.nom : '')}" placeholder="ex: Île-de-France">
            </div>

            <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Code (3 car.) <span class="text-danger">*</span></label>
                <input type="text" class="form-input" id="reg-code" maxlength="3" value="${escapeHTML(region ? region.code : '')}" placeholder="IDF" style="text-transform:uppercase">
              </div>
              <div class="form-group">
                <label class="form-label">Phase de déploiement</label>
                <select class="form-input" id="reg-statut">
                  ${Object.entries(STATUTS).map(([k, v]) =>
                    `<option value="${k}" ${region && region.statut === k ? 'selected' : ''}>${v.label}</option>`
                  ).join('')}
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Départements couverts</label>
              <input type="text" class="form-input" id="reg-departements" value="${escapeHTML(region ? (region.departements || []).join(', ') : '')}" placeholder="ex: 75, 92, 93, 94">
              <div class="form-help">Codes départements séparés par des virgules</div>
            </div>

            <div class="form-group">
              <label class="form-label">Opérateurs rattachés</label>
              <div style="max-height:160px;overflow-y:auto;border:1px solid #3a3a42;border-radius:4px;padding:8px">
                ${opsCheckboxes || '<span class="text-muted">Aucun opérateur disponible</span>'}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-input" id="reg-notes" rows="3">${escapeHTML(region ? (region.notes || '') : '')}</textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-cancel-region">Annuler</button>
            <button class="btn btn-primary" id="btn-save-region">${isEdit ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </div>
      </div>`;

    const modal = document.getElementById('region-modal');

    // Code uppercase
    document.getElementById('reg-code').addEventListener('input', function() {
      this.value = this.value.toUpperCase();
    });

    const close = () => {
      modal.remove();
      if (fromFiche && region) _renderFiche(container, region.id);
      else _renderList(container);
    };

    document.getElementById('btn-close-region-modal').addEventListener('click', close);
    document.getElementById('btn-cancel-region').addEventListener('click', close);

    document.getElementById('btn-save-region').addEventListener('click', () => {
      const nom  = document.getElementById('reg-nom').value.trim();
      const code = document.getElementById('reg-code').value.trim().toUpperCase();
      if (!nom) { alert('Le nom de la région est requis.'); return; }
      if (!code) { alert('Le code est requis.'); return; }

      const departements = document.getElementById('reg-departements').value
        .split(',').map(d => d.trim()).filter(Boolean);
      const operateurIds = [...document.querySelectorAll('.op-check:checked')].map(cb => cb.value);
      const payload = {
        nom,
        code,
        statut: document.getElementById('reg-statut').value,
        departements,
        operateurIds,
        notes: document.getElementById('reg-notes').value.trim(),
        dateCreation: region ? (region.dateCreation || new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10)
      };

      if (isEdit) {
        DB.regions.update(regionId, payload);
      } else {
        DB.regions.create(payload);
      }
      modal.remove();
      if (fromFiche && regionId) _renderFiche(container, regionId);
      else _renderList(container);
    });
  }

  /* ============================================================
     SUPPRESSION
     ============================================================ */
  function _deleteRegion(container, regionId) {
    const region = DB.regions.getAll().find(r => r.id === regionId);
    if (!region) return;

    // Vérifier si des simulateurs sont rattachés
    const nbSims = DB.simulateurs.getAll().filter(s => s.regionId === regionId).length;
    const warning = nbSims > 0 ? `\n⚠ ${nbSims} simulateur(s) seront dissociés.` : '';

    if (!confirm(`Supprimer la région "${region.nom}" ?${warning}\nCette action est irréversible.`)) return;

    // Dissocier les simulateurs
    DB.simulateurs.getAll()
      .filter(s => s.regionId === regionId)
      .forEach(s => DB.simulateurs.update(s.id, { regionId: null }));

    DB.regions.delete(regionId);
    _renderList(container);
  }

  /* --- API publique --- */
  return { render };
})();
