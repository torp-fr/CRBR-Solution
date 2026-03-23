/* ============================================================
   DST-SYSTEM — Vue Pipeline CRM
   Tableau de bord CRM unifié : prospects + clients
   ============================================================ */

window.Views = window.Views || {};

Views.Pipeline = (() => {
  'use strict';

  let _container  = null;
  let _filterStatut = 'tous';
  let _search     = '';
  let _selectedId   = null;
  let _selectedType = null;

  const STATUT_DEFS = [
    { value: 'tous',        label: 'Tous',        cls: '' },
    { value: 'nouveau',     label: 'Nouveau',     cls: 'tag-blue' },
    { value: 'contacte',    label: 'Contact\u00e9',    cls: 'tag-yellow' },
    { value: 'negociation', label: 'N\u00e9gociation', cls: 'tag-purple' },
    { value: 'client',      label: 'Client',      cls: 'tag-green' },
    { value: 'perdu',       label: 'Perdu',       cls: 'tag-neutral' }
  ];

  function _esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* --- Construction liste unifiée --- */
  function _buildContacts() {
    const prospects = DB.prospects.getAll().filter(p => p.statut !== 'converti');
    const clients   = DB.clients.getAll();

    const pList = prospects.map(p => ({
      _type: 'prospect', _id: p.id,
      nom:          (((p.prenom || '') + ' ' + (p.nom || '')).trim()) || '\u2014',
      organisation: p.organisation || '',
      email:        p.email || '',
      type:         p.typeStructure || '',
      segment:      p.segment || '',
      statut:       p.statut || 'nouveau',
      source:       p.source || 'manuel',
      derniere:     p.updatedAt || p.createdAt || '',
      createdAt:    p.createdAt || '',
      _raw: p
    }));

    const cList = clients.map(c => ({
      _type: 'client', _id: c.id,
      nom:          c.contactName || c.name || '\u2014',
      organisation: c.name || '',
      email:        c.contactEmail || '',
      type:         c.type || '',
      segment:      c.segment || '',
      statut:       'client',
      source:       'client_direct',
      derniere:     c.updatedAt || c.createdAt || '',
      createdAt:    c.createdAt || '',
      _raw: c
    }));

    const order = ['nouveau', 'contacte', 'negociation', 'client', 'perdu'];
    return [...pList, ...cList].sort((a, b) => {
      const oa = order.indexOf(a.statut), ob = order.indexOf(b.statut);
      if (oa !== ob) return oa - ob;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  function _applyFilters(contacts) {
    let r = contacts;
    if (_filterStatut !== 'tous') r = r.filter(c => c.statut === _filterStatut);
    if (_search.trim()) {
      const q = _search.trim().toLowerCase();
      r = r.filter(c =>
        (c.nom || '').toLowerCase().includes(q) ||
        (c.organisation || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    }
    return r;
  }

  function _statutBadge(statut) {
    const cls   = { nouveau: 'tag-blue', contacte: 'tag-yellow', negociation: 'tag-purple', client: 'tag-green', perdu: 'tag-neutral' };
    const label = { nouveau: 'Nouveau', contacte: 'Contact\u00e9', negociation: 'N\u00e9gociation', client: 'Client', perdu: 'Perdu' };
    return `<span class="tag ${cls[statut] || 'tag-neutral'}">${label[statut] || statut}</span>`;
  }

  /* === POINT D'ENTRÉE === */
  function render(container) {
    _container = container;
    _renderPage();
  }

  function _renderPage() {
    const contacts = _buildContacts();
    const filtered = _applyFilters(contacts);

    /* Compteurs */
    const counts = { tous: contacts.length };
    contacts.forEach(c => { counts[c.statut] = (counts[c.statut] || 0) + 1; });

    const pillsHTML = STATUT_DEFS.map(s => {
      const cnt    = counts[s.value] || 0;
      const active = _filterStatut === s.value;
      return `<button class="btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'} filter-pill" data-statut="${s.value}">
        ${_esc(s.label)} <span style="font-size:0.72rem;opacity:0.7;">(${cnt})</span>
      </button>`;
    }).join('');

    const rowsHTML = filtered.length === 0
      ? '<tr><td colspan="8" class="text-center text-muted" style="padding:24px;">Aucun contact trouv\u00e9.</td></tr>'
      : filtered.map(c => {
          const isSel = _selectedId === c._id && _selectedType === c._type;
          const actionBtn = c.statut !== 'client'
            ? `<button class="btn btn-sm btn-ghost btn-crm-devis" data-id="${_esc(c._id)}" data-type="${c._type}" title="Cr\u00e9er un devis" onclick="event.stopPropagation()">📄+</button>`
            : `<button class="btn btn-sm btn-ghost btn-crm-facture" data-id="${_esc(c._id)}" data-type="${c._type}" title="Cr\u00e9er une facture" onclick="event.stopPropagation()">🧾+</button>`;
          return `<tr class="contact-row${isSel ? ' active' : ''}" data-id="${_esc(c._id)}" data-type="${c._type}" style="cursor:pointer;">
            <td>${_esc(c.nom)}</td>
            <td>${_esc(c.organisation)}</td>
            <td>${c.type ? `<span class="tag tag-neutral" style="font-size:0.72rem;">${_esc(c.type)}</span>` : '\u2014'}</td>
            <td>${_statutBadge(c.statut)}</td>
            <td>${c.segment ? `<span class="tag tag-blue" style="font-size:0.72rem;">${_esc(c.segment)}</span>` : '\u2014'}</td>
            <td style="font-size:0.8rem;color:var(--text-muted);">${_esc(c.source || '\u2014')}</td>
            <td style="font-size:0.8rem;color:var(--text-muted);">${c.derniere ? new Date(c.derniere).toLocaleDateString('fr-FR') : '\u2014'}</td>
            <td class="actions-cell">
              <button class="btn btn-sm btn-ghost btn-crm-edit" data-id="${_esc(c._id)}" data-type="${c._type}" title="\u00c9diter" onclick="event.stopPropagation()">&#9998;</button>
              ${actionBtn}
              <button class="btn btn-sm btn-ghost btn-crm-del" data-id="${_esc(c._id)}" data-type="${c._type}" title="Supprimer" onclick="event.stopPropagation()">&#128465;</button>
            </td>
          </tr>`;
        }).join('');

    _container.innerHTML = `
      <div class="page-header">
        <h1>Pipeline CRM</h1>
        <div class="actions">
          <input type="search" id="pipeline-search" class="form-control"
            placeholder="Rechercher nom, organisation, email\u2026"
            value="${_esc(_search)}" style="width:260px;">
          <button class="btn btn-primary" id="btn-new-contact">+ Nouveau contact</button>
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        ${pillsHTML}
      </div>

      <div class="card">
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead><tr>
              <th>Nom</th><th>Organisation</th><th>Type</th><th>Statut</th>
              <th>Segment</th><th>Source</th><th>Derni\u00e8re action</th><th>Actions</th>
            </tr></thead>
            <tbody id="pipeline-tbody">${rowsHTML}</tbody>
          </table>
        </div>
      </div>

      <div id="pipeline-detail"></div>
    `;

    _bindEvents();

    if (_selectedId && _selectedType) {
      _renderDetail(_selectedId, _selectedType);
    }
  }

  /* === FICHE DÉTAIL === */
  function _renderDetail(id, type) {
    const panel = _container.querySelector('#pipeline-detail');
    if (!panel) return;

    if (type === 'client') {
      const client = DB.clients.getById(id);
      if (!client) { panel.innerHTML = ''; return; }

      const sessions = DB.sessions.filter(s =>
        (s.clientIds || []).includes(id) || s.clientId === id
      );
      const totalCA = sessions
        .filter(s => s.statut === 'terminee')
        .reduce((sum, s) => sum + (s.price || 0), 0);

      panel.innerHTML = `
        <div class="card mt-16">
          <div class="card-header">
            <h2>&#127970; ${_esc(client.name)}</h2>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-sm btn-ghost" id="btn-detail-devis">&#128196; Nouveau devis</button>
              <button class="btn btn-sm btn-ghost" id="btn-detail-facture">&#129534; Nouvelle facture</button>
              <button class="btn btn-sm btn-ghost" id="btn-detail-client">Fiche compl\u00e8te \u2192</button>
              <button class="btn btn-sm" id="btn-detail-close">Fermer</button>
            </div>
          </div>
          <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));margin-bottom:16px;">
            <div class="kpi-card"><div class="kpi-label">Sessions</div><div class="kpi-value">${sessions.length}</div></div>
            <div class="kpi-card"><div class="kpi-label">CA factur\u00e9</div><div class="kpi-value" style="font-size:0.9rem;">${Engine.fmt(totalCA)}</div></div>
            <div class="kpi-card"><div class="kpi-label">Segment</div><div class="kpi-value" style="font-size:0.85rem;">${_esc(client.segment || '\u2014')}</div></div>
            <div class="kpi-card"><div class="kpi-label">Type</div><div class="kpi-value" style="font-size:0.85rem;">${_esc(client.type || '\u2014')}</div></div>
          </div>
          <table class="data-table" style="font-size:0.85rem;"><tbody>
            ${client.contactName ? `<tr><td style="color:var(--text-muted);width:160px;">Contact</td><td>${_esc(client.contactName)}</td></tr>` : ''}
            ${client.contactEmail ? `<tr><td style="color:var(--text-muted);">Email</td><td>${_esc(client.contactEmail)}</td></tr>` : ''}
            ${client.phone ? `<tr><td style="color:var(--text-muted);">T\u00e9l\u00e9phone</td><td>${_esc(client.phone)}</td></tr>` : ''}
            ${client.city ? `<tr><td style="color:var(--text-muted);">Ville</td><td>${_esc(client.city)}</td></tr>` : ''}
          </tbody></table>
        </div>`;

      panel.querySelector('#btn-detail-close').addEventListener('click', () => {
        _selectedId = null; _selectedType = null;
        panel.innerHTML = '';
        _container.querySelectorAll('.contact-row').forEach(r => r.classList.remove('active'));
      });
      panel.querySelector('#btn-detail-devis').addEventListener('click', () => {
        App.navigate('devis');
        setTimeout(() => { if (Views.Devis && Views.Devis.openNewModal) Views.Devis.openNewModal(id, null); }, 300);
      });
      panel.querySelector('#btn-detail-facture').addEventListener('click', () => {
        App.navigate('factures');
        setTimeout(() => { if (Views.Factures && Views.Factures.openNewModal) Views.Factures.openNewModal(id); }, 300);
      });
      panel.querySelector('#btn-detail-client').addEventListener('click', () => App.navigate('clients'));

    } else {
      const prospect = DB.prospects.getById(id);
      if (!prospect) { panel.innerHTML = ''; return; }

      const nom = (((prospect.prenom || '') + ' ' + (prospect.nom || '')).trim()) || '\u2014';
      const statutLabels = { nouveau: 'Nouveau', contacte: 'Contact\u00e9', negociation: 'N\u00e9gociation', perdu: 'Perdu' };
      const statutBtns = ['nouveau', 'contacte', 'negociation', 'perdu'].map(s =>
        `<button class="btn btn-sm ${prospect.statut === s ? 'btn-primary' : 'btn-ghost'} btn-change-statut" data-statut="${s}">${statutLabels[s]}</button>`
      ).join('');

      panel.innerHTML = `
        <div class="card mt-16">
          <div class="card-header">
            <h2>&#127919; ${_esc(nom)}${prospect.organisation ? ' \u2014 ' + _esc(prospect.organisation) : ''}</h2>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-sm btn-ghost" id="btn-prospect-devis">&#128196; Cr\u00e9er un devis</button>
              <button class="btn btn-sm btn-ghost" id="btn-prospect-convert">&#128101; Convertir en client</button>
              <button class="btn btn-sm" id="btn-detail-close">Fermer</button>
            </div>
          </div>
          <div style="margin-bottom:16px;">
            <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Changer le statut</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">${statutBtns}</div>
          </div>
          <table class="data-table" style="font-size:0.85rem;"><tbody>
            ${prospect.email      ? `<tr><td style="color:var(--text-muted);width:160px;">Email</td><td>${_esc(prospect.email)}</td></tr>` : ''}
            ${prospect.telephone  ? `<tr><td style="color:var(--text-muted);">T\u00e9l\u00e9phone</td><td>${_esc(prospect.telephone)}</td></tr>` : ''}
            ${prospect.organisation ? `<tr><td style="color:var(--text-muted);">Organisation</td><td>${_esc(prospect.organisation)}</td></tr>` : ''}
            ${prospect.segment    ? `<tr><td style="color:var(--text-muted);">Segment</td><td>${_esc(prospect.segment)}</td></tr>` : ''}
            ${prospect.source     ? `<tr><td style="color:var(--text-muted);">Source</td><td>${_esc(prospect.source)}</td></tr>` : ''}
            ${prospect.notes      ? `<tr><td style="color:var(--text-muted);">Notes</td><td style="white-space:pre-wrap;">${_esc(prospect.notes)}</td></tr>` : ''}
          </tbody></table>
        </div>`;

      panel.querySelector('#btn-detail-close').addEventListener('click', () => {
        _selectedId = null; _selectedType = null;
        panel.innerHTML = '';
        _container.querySelectorAll('.contact-row').forEach(r => r.classList.remove('active'));
      });
      panel.querySelector('#btn-prospect-devis').addEventListener('click', () => {
        App.navigate('devis');
        setTimeout(() => { if (Views.Devis && Views.Devis.openNewModal) Views.Devis.openNewModal(null, prospect.id); }, 300);
      });
      panel.querySelector('#btn-prospect-convert').addEventListener('click', () => {
        const label = nom !== '\u2014' ? nom : (prospect.organisation || '?');
        if (!confirm('Convertir ' + label + ' en client ?')) return;
        const newClient = DB.clients.create({
          name:         prospect.organisation || nom,
          contactName:  nom,
          contactEmail: prospect.email || '',
          phone:        prospect.telephone || '',
          type:         prospect.typeStructure || '',
          segment:      prospect.segment || '',
          active:       true
        });
        DB.prospects.update(prospect.id, { statut: 'converti', clientId: newClient.id });
        Toast.show('Prospect converti en client.', 'success');
        _selectedId = null; _selectedType = null;
        _renderPage();
      });
      panel.querySelectorAll('.btn-change-statut').forEach(btn => {
        btn.addEventListener('click', () => {
          DB.prospects.update(prospect.id, { statut: btn.dataset.statut });
          Toast.show('Statut mis \u00e0 jour.', 'success');
          // Mettre à jour le badge dans la ligne sans re-render complet
          const row = _container.querySelector(`.contact-row[data-id="${_esc(id)}"]`);
          if (row) {
            const cell = row.querySelectorAll('td')[3];
            if (cell) cell.innerHTML = _statutBadge(btn.dataset.statut);
          }
          _renderDetail(id, type);
        });
      });
    }
  }

  /* === MODAL NOUVEAU CONTACT === */
  function _openNewModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'pipeline-modal';

    const typeOptions = (DB.settings.get().clientTypes || [])
      .map(t => `<option value="${_esc(t)}">${_esc(t)}</option>`).join('');
    const segOptions = [
      { v: 'institutionnel', l: 'Institutionnel' },
      { v: 'grand_compte',   l: 'Grand Compte' },
      { v: 'b2b',            l: 'B2B' },
      { v: 'b2c',            l: 'B2C' }
    ].map(s => `<option value="${s.v}">${s.l}</option>`).join('');

    overlay.innerHTML = `
      <div class="modal" style="max-width:560px;">
        <div class="modal-header">
          <h2>Nouveau contact</h2>
          <button class="btn btn-sm btn-ghost" id="nc-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label>Pr\u00e9nom</label><input type="text" id="nc-prenom" class="form-control" placeholder="Pr\u00e9nom"></div>
            <div class="form-group"><label>Nom</label><input type="text" id="nc-nom" class="form-control" placeholder="Nom"></div>
          </div>
          <div class="form-group"><label>Organisation</label><input type="text" id="nc-orga" class="form-control" placeholder="Organisme, entreprise\u2026"></div>
          <div class="form-row">
            <div class="form-group"><label>Email</label><input type="email" id="nc-email" class="form-control"></div>
            <div class="form-group"><label>T\u00e9l\u00e9phone</label><input type="text" id="nc-tel" class="form-control"></div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Type de structure</label>
              <select id="nc-type" class="form-control"><option value="">\u2014 S\u00e9lectionner \u2014</option>${typeOptions}</select>
            </div>
            <div class="form-group">
              <label>Segment</label>
              <select id="nc-segment" class="form-control"><option value="">\u2014 S\u00e9lectionner \u2014</option>${segOptions}</select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Statut initial</label>
              <select id="nc-statut" class="form-control">
                <option value="nouveau">Nouveau</option>
                <option value="contacte">Contact\u00e9</option>
                <option value="client">Client direct</option>
              </select>
            </div>
            <div class="form-group">
              <label>Source</label>
              <select id="nc-source" class="form-control">
                <option value="manuel">Manuel</option>
                <option value="formulaire_web">Formulaire web</option>
                <option value="salon">Salon / \u00c9v\u00e9nement</option>
                <option value="referral">Recommandation</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Notes</label><textarea id="nc-notes" class="form-control" rows="2" placeholder="Contexte, informations compl\u00e9mentaires\u2026"></textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="nc-cancel">Annuler</button>
          <button class="btn btn-primary" id="nc-save">Cr\u00e9er le contact</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#nc-close').addEventListener('click', close);
    overlay.querySelector('#nc-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    overlay.querySelector('#nc-save').addEventListener('click', () => {
      const prenom  = overlay.querySelector('#nc-prenom').value.trim();
      const nom     = overlay.querySelector('#nc-nom').value.trim();
      const orga    = overlay.querySelector('#nc-orga').value.trim();
      const email   = overlay.querySelector('#nc-email').value.trim();
      const tel     = overlay.querySelector('#nc-tel').value.trim();
      const type    = overlay.querySelector('#nc-type').value;
      const segment = overlay.querySelector('#nc-segment').value;
      const statut  = overlay.querySelector('#nc-statut').value;
      const source  = overlay.querySelector('#nc-source').value;
      const notes   = overlay.querySelector('#nc-notes').value.trim();

      if (!nom && !prenom && !orga) {
        alert('Veuillez saisir au moins un nom ou une organisation.');
        return;
      }
      if (statut === 'client') {
        DB.clients.create({
          name: orga || ((prenom + ' ' + nom).trim()),
          contactName: ((prenom + ' ' + nom).trim()) || '',
          contactEmail: email, phone: tel, type, segment, active: true
        });
      } else {
        DB.prospects.create({ prenom, nom, organisation: orga, email, telephone: tel, typeStructure: type, segment, statut, source, notes });
      }
      Toast.show('Contact cr\u00e9\u00e9 avec succ\u00e8s.', 'success');
      close();
      _renderPage();
    });
    overlay.querySelector('#nc-prenom').focus();
  }

  /* === MODAL ÉDITION PROSPECT === */
  function _openEditModal(id, type) {
    if (type === 'client') { App.navigate('clients'); return; }

    const prospect = DB.prospects.getById(id);
    if (!prospect) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const segOptions = [
      { v: 'institutionnel', l: 'Institutionnel' },
      { v: 'grand_compte',   l: 'Grand Compte' },
      { v: 'b2b',            l: 'B2B' },
      { v: 'b2c',            l: 'B2C' }
    ].map(s => `<option value="${s.v}"${prospect.segment === s.v ? ' selected' : ''}>${s.l}</option>`).join('');

    overlay.innerHTML = `
      <div class="modal" style="max-width:560px;">
        <div class="modal-header">
          <h2>Modifier le contact</h2>
          <button class="btn btn-sm btn-ghost" id="ed-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group"><label>Pr\u00e9nom</label><input type="text" id="ed-prenom" class="form-control" value="${_esc(prospect.prenom || '')}"></div>
            <div class="form-group"><label>Nom</label><input type="text" id="ed-nom" class="form-control" value="${_esc(prospect.nom || '')}"></div>
          </div>
          <div class="form-group"><label>Organisation</label><input type="text" id="ed-orga" class="form-control" value="${_esc(prospect.organisation || '')}"></div>
          <div class="form-row">
            <div class="form-group"><label>Email</label><input type="email" id="ed-email" class="form-control" value="${_esc(prospect.email || '')}"></div>
            <div class="form-group"><label>T\u00e9l\u00e9phone</label><input type="text" id="ed-tel" class="form-control" value="${_esc(prospect.telephone || '')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Segment</label>
              <select id="ed-segment" class="form-control"><option value="">\u2014 S\u00e9lectionner \u2014</option>${segOptions}</select>
            </div>
            <div class="form-group">
              <label>Statut</label>
              <select id="ed-statut" class="form-control">
                <option value="nouveau"${prospect.statut === 'nouveau' ? ' selected' : ''}>Nouveau</option>
                <option value="contacte"${prospect.statut === 'contacte' ? ' selected' : ''}>Contact\u00e9</option>
                <option value="negociation"${prospect.statut === 'negociation' ? ' selected' : ''}>N\u00e9gociation</option>
                <option value="perdu"${prospect.statut === 'perdu' ? ' selected' : ''}>Perdu</option>
              </select>
            </div>
          </div>
          <div class="form-group"><label>Notes</label><textarea id="ed-notes" class="form-control" rows="2">${_esc(prospect.notes || '')}</textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="ed-cancel">Annuler</button>
          <button class="btn btn-primary" id="ed-save">Enregistrer</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#ed-close').addEventListener('click', close);
    overlay.querySelector('#ed-cancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    overlay.querySelector('#ed-save').addEventListener('click', () => {
      DB.prospects.update(id, {
        prenom:       overlay.querySelector('#ed-prenom').value.trim(),
        nom:          overlay.querySelector('#ed-nom').value.trim(),
        organisation: overlay.querySelector('#ed-orga').value.trim(),
        email:        overlay.querySelector('#ed-email').value.trim(),
        telephone:    overlay.querySelector('#ed-tel').value.trim(),
        segment:      overlay.querySelector('#ed-segment').value,
        statut:       overlay.querySelector('#ed-statut').value,
        notes:        overlay.querySelector('#ed-notes').value.trim()
      });
      Toast.show('Contact mis \u00e0 jour.', 'success');
      close();
      if (_selectedId === id) { _selectedId = null; _selectedType = null; }
      _renderPage();
    });
  }

  /* === BIND EVENTS === */
  function _bindEvents() {
    const search = _container.querySelector('#pipeline-search');
    if (search) search.addEventListener('input', e => { _search = e.target.value; _renderPage(); });

    _container.querySelectorAll('.filter-pill').forEach(btn =>
      btn.addEventListener('click', () => {
        _filterStatut = btn.dataset.statut;
        _selectedId = null; _selectedType = null;
        _renderPage();
      })
    );

    const btnNew = _container.querySelector('#btn-new-contact');
    if (btnNew) btnNew.addEventListener('click', _openNewModal);

    _container.querySelectorAll('.contact-row').forEach(row =>
      row.addEventListener('click', () => {
        const id = row.dataset.id, type = row.dataset.type;
        if (_selectedId === id && _selectedType === type) {
          _selectedId = null; _selectedType = null;
          const p = _container.querySelector('#pipeline-detail');
          if (p) p.innerHTML = '';
          _container.querySelectorAll('.contact-row').forEach(r => r.classList.remove('active'));
        } else {
          _selectedId = id; _selectedType = type;
          _container.querySelectorAll('.contact-row').forEach(r =>
            r.classList.toggle('active', r.dataset.id === id && r.dataset.type === type)
          );
          _renderDetail(id, type);
        }
      })
    );

    _container.querySelectorAll('.btn-crm-edit').forEach(btn =>
      btn.addEventListener('click', () => _openEditModal(btn.dataset.id, btn.dataset.type))
    );

    _container.querySelectorAll('.btn-crm-devis').forEach(btn =>
      btn.addEventListener('click', () => {
        const id = btn.dataset.id, type = btn.dataset.type;
        App.navigate('devis');
        setTimeout(() => {
          if (Views.Devis && Views.Devis.openNewModal) {
            type === 'client' ? Views.Devis.openNewModal(id, null) : Views.Devis.openNewModal(null, id);
          }
        }, 300);
      })
    );

    _container.querySelectorAll('.btn-crm-facture').forEach(btn =>
      btn.addEventListener('click', () => {
        App.navigate('factures');
        setTimeout(() => { if (Views.Factures && Views.Factures.openNewModal) Views.Factures.openNewModal(btn.dataset.id); }, 300);
      })
    );

    _container.querySelectorAll('.btn-crm-del').forEach(btn =>
      btn.addEventListener('click', () => {
        const id = btn.dataset.id, type = btn.dataset.type;
        if (!confirm('Supprimer ce contact\u00a0? Action irr\u00e9versible.')) return;
        if (type === 'client') DB.clients.delete(id); else DB.prospects.delete(id);
        if (_selectedId === id) { _selectedId = null; _selectedType = null; }
        Toast.show('Contact supprim\u00e9.', 'warning');
        _renderPage();
      })
    );
  }

  return { render };
})();
