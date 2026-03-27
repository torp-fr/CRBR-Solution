/* ============================================================
   DST-SYSTEM — Vue Déplacements
   Calculateur, barème interne, simulation par client.
   ============================================================ */

window.Views = window.Views || {};

Views.Deplacements = {

  render(container) {
    'use strict';

    const settings = DB.settings.get();
    const d = settings.deplacement || DB.settings.getDefaults().deplacement;
    const clients = DB.clients.getAll();

    /* --- Helpers --- */
    function escapeH(s) {
      if (s == null) return '';
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* Distances de référence pour le barème rapide */
    const DISTANCES_REF = [50, 100, 150, 200, 300, 500];

    function calcDepl(km, nbJ, depl) {
      return Engine.calculerCoutDeplacement(km, nbJ, { deplacement: depl });
    }

    function baremeRows(depl) {
      return DISTANCES_REF.map(km => {
        const fiscal  = Engine.calculerCoutDeplacement(km, 1, { deplacement: Object.assign({}, depl, { bareme: 'fiscal'  }) });
        const interne = Engine.calculerCoutDeplacement(km, 1, { deplacement: Object.assign({}, depl, { bareme: 'interne' }) });
        return `<tr>
          <td>${km}&nbsp;km</td>
          <td class="num">${Engine.fmt(fiscal)}</td>
          <td class="num">${Engine.fmt(interne)}</td>
        </tr>`;
      }).join('');
    }

    /* --- Rendu principal --- */
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Co\u00fbt des d\u00e9placements</h1>
          <p class="text-muted" style="margin-top:4px;">Calculateur et bar\u00e8me interne DST\u00a0System</p>
        </div>
        <button class="btn btn-primary" id="btn-save-deplacement">Enregistrer les param\u00e8tres</button>
      </div>

      <!-- Paramètres du barème -->
      <div class="card" style="margin-bottom:16px;">
        <div class="card-header"><h2>Param\u00e8tres du bar\u00e8me</h2></div>
        <div class="form-row">
          <div class="form-group">
            <label for="dep-bareme">Bar\u00e8me par d\u00e9faut</label>
            <select id="dep-bareme" class="form-control">
              <option value="fiscal"  ${d.bareme === 'fiscal'  ? 'selected' : ''}>Bar\u00e8me fiscal</option>
              <option value="interne" ${d.bareme === 'interne' ? 'selected' : ''}>Tarif interne</option>
            </select>
          </div>
          <div class="form-group">
            <label for="dep-taux-fiscal">Taux fiscal (\u20ac/km)</label>
            <input type="number" id="dep-taux-fiscal" class="form-control" min="0" step="0.001"
                   value="${d.tauxFiscalKm || 0.321}" style="max-width:130px;" />
          </div>
          <div class="form-group">
            <label for="dep-taux-interne">Taux interne (\u20ac/km)</label>
            <input type="number" id="dep-taux-interne" class="form-control" min="0" step="0.001"
                   value="${d.tauxInterneKm || 0.35}" style="max-width:130px;" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="dep-forfait">Forfait / d\u00e9placement (\u20ac)</label>
            <input type="number" id="dep-forfait" class="form-control" min="0" step="any"
                   value="${d.forfaitJournee || 0}" style="max-width:130px;" />
            <span class="form-help">Montant fixe ajout\u00e9 par jour de d\u00e9placement (parking, p\u00e9ages&hellip;)</span>
          </div>
          <div class="form-group">
            <label for="dep-zone-gratuite">Zone gratuite (km)</label>
            <input type="number" id="dep-zone-gratuite" class="form-control" min="0" step="1"
                   value="${d.zoneGratuiteKm || 0}" style="max-width:130px;" />
            <span class="form-help">Kilom\u00e8tres inclus dans le tarif de base (non factur\u00e9s)</span>
          </div>
          <div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:4px;">
            <label class="form-check">
              <input type="checkbox" id="dep-inclure-devis" ${d.inclureDansDevis !== false ? 'checked' : ''} />
              <span>Inclure automatiquement dans les devis</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Calculateur + Barème rapide -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">

        <!-- Calculateur ponctuel -->
        <div class="card">
          <div class="card-header"><h2>Calcul ponctuel</h2></div>
          <div class="form-group">
            <label for="calc-km">Distance aller-retour (km)</label>
            <input type="number" id="calc-km" class="form-control" min="0" step="1" value="100" />
          </div>
          <div class="form-group">
            <label for="calc-jours">Nombre de jours</label>
            <input type="number" id="calc-jours" class="form-control" min="1" step="1" value="1" />
          </div>
          <div class="form-group">
            <label for="calc-bareme">Bar\u00e8me utilis\u00e9</label>
            <select id="calc-bareme" class="form-control">
              <option value="fiscal">Bar\u00e8me fiscal</option>
              <option value="interne">Tarif interne</option>
            </select>
          </div>
          <button class="btn btn-primary" id="btn-calculer" style="margin-bottom:16px;">Calculer</button>
          <div id="calc-result" class="calcul-auto" style="display:none;"></div>
        </div>

        <!-- Barème rapide -->
        <div class="card">
          <div class="card-header"><h2>Bar\u00e8me rapide (par jour)</h2></div>
          <table class="table" style="font-size:0.85rem;">
            <thead>
              <tr>
                <th>Distance A/R</th>
                <th class="num">Co\u00fbt fiscal</th>
                <th class="num">Co\u00fbt interne</th>
              </tr>
            </thead>
            <tbody id="bareme-tbody">
              ${baremeRows(d)}
            </tbody>
          </table>
          <p class="form-help" style="margin-top:8px;">Zone gratuite\u00a0: ${d.zoneGratuiteKm || 0}\u00a0km d\u00e9duits avant calcul.</p>
        </div>
      </div>

      <!-- Simulation par client -->
      <div class="card">
        <div class="card-header"><h2>Simulation par client</h2></div>
        <div class="form-row">
          <div class="form-group">
            <label for="sim-client">Client</label>
            <select id="sim-client" class="form-control">
              <option value="">-- S\u00e9lectionner un client --</option>
              ${clients.map(c => `<option value="${escapeH(c.id)}" data-km="${c.distanceKm||0}">${escapeH(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="sim-km">Distance A/R (km)</label>
            <input type="number" id="sim-km" class="form-control" min="0" step="1" value="0" style="max-width:130px;" />
          </div>
          <div class="form-group">
            <label for="sim-freq">Fr\u00e9quence annuelle (d\u00e9placements)</label>
            <input type="number" id="sim-freq" class="form-control" min="0" step="1" value="12" style="max-width:130px;" />
          </div>
          <div class="form-group">
            <label for="sim-sessions">Nombre de sessions/an</label>
            <input type="number" id="sim-sessions" class="form-control" min="1" step="1" value="12" style="max-width:130px;" />
          </div>
        </div>
        <div id="sim-result" class="calcul-auto" style="display:none;margin-top:12px;"></div>
      </div>
    `;

    /* --- Événements --- */

    // Calculer
    function _doCalc() {
      const km     = parseFloat(container.querySelector('#calc-km').value) || 0;
      const nbJ    = Math.max(parseInt(container.querySelector('#calc-jours').value, 10) || 1, 1);
      const bareme = container.querySelector('#calc-bareme').value;
      const depCfg = _readDeplacementFields();
      depCfg.bareme = bareme;
      const total      = Engine.calculerCoutDeplacement(km, nbJ, { deplacement: depCfg });
      const parJour    = Engine.round2(total / nbJ);
      const taux       = bareme === 'interne' ? depCfg.tauxInterneKm : depCfg.tauxFiscalKm;
      const zone       = depCfg.zoneGratuiteKm || 0;
      const distFact   = Math.max(0, km - zone);
      const coutKm     = Engine.round2(distFact * taux);
      const forfait    = Engine.round2((depCfg.forfaitJournee || 0) * nbJ);
      const res = container.querySelector('#calc-result');
      res.style.display = '';
      res.innerHTML = `
        <div class="calcul-row"><span>Distance totale</span><span>${km}\u00a0km</span></div>
        <div class="calcul-row"><span>Zone gratuite</span><span>&minus;\u00a0${zone}\u00a0km</span></div>
        <div class="calcul-row"><span>Distance facturable</span><span>${distFact}\u00a0km</span></div>
        <div class="calcul-row"><span>Co\u00fbt kilom\u00e9trique (${distFact}\u00a0\u00d7\u00a0${taux}\u00a0\u20ac)</span><span>${Engine.fmt(coutKm)}</span></div>
        <div class="calcul-row"><span>Forfait journalier (${nbJ}\u00a0j)</span><span>${Engine.fmt(forfait)}</span></div>
        <div class="calcul-row synthese-total"><span>CO\u00dbT D\u00c9PLACEMENT HT</span><span>${Engine.fmt(total)}</span></div>
        <div class="calcul-row"><span>Par jour</span><span>${Engine.fmt(parJour)}/j</span></div>
      `;
    }
    container.querySelector('#btn-calculer').addEventListener('click', _doCalc);

    // Simulation client
    function _doSim() {
      const km      = parseFloat(container.querySelector('#sim-km').value) || 0;
      const freq    = Math.max(parseInt(container.querySelector('#sim-freq').value, 10) || 0, 0);
      const nbSess  = Math.max(parseInt(container.querySelector('#sim-sessions').value, 10) || 1, 1);
      const depCfg  = _readDeplacementFields();
      const coutDepl = Engine.calculerCoutDeplacement(km, 1, { deplacement: depCfg });
      const annuel   = Engine.round2(coutDepl * freq);
      const parSess  = Engine.round2(annuel / nbSess);
      const impactJ  = Engine.round2(annuel / 220);
      const res = container.querySelector('#sim-result');
      if (km <= 0) { res.style.display = 'none'; return; }
      res.style.display = '';
      res.innerHTML = `
        <div class="calcul-row"><span>Co\u00fbt d\u00e9placement / d\u00e9placement</span><span>${Engine.fmt(coutDepl)}</span></div>
        <div class="calcul-row"><span>Fr\u00e9quence annuelle</span><span>${freq}\u00a0d\u00e9placements</span></div>
        <div class="calcul-row synthese-total"><span>Co\u00fbt annuel d\u00e9placements</span><span>${Engine.fmt(annuel)}</span></div>
        <div class="calcul-row"><span>Co\u00fbt par session (${nbSess}\u00a0sessions)</span><span>${Engine.fmt(parSess)}/session</span></div>
        <div class="calcul-row"><span>Impact sur tarif journalier</span><span>+\u00a0${Engine.fmt(impactJ)}/j</span></div>
      `;
    }

    container.querySelector('#sim-client').addEventListener('change', function() {
      const sel = this.options[this.selectedIndex];
      const km  = parseFloat(sel.dataset.km) || 0;
      container.querySelector('#sim-km').value = km;
      _doSim();
    });
    ['#sim-km','#sim-freq','#sim-sessions'].forEach(id => {
      container.querySelector(id).addEventListener('input', _doSim);
    });

    // Mise à jour du barème rapide en temps réel
    function _refreshBareme() {
      const cfg = _readDeplacementFields();
      container.querySelector('#bareme-tbody').innerHTML = baremeRows(cfg);
      container.querySelector('#dep-zone-gratuite').closest('.card') &&
        container.querySelector('.form-help') &&
        (container.querySelectorAll('.form-help')[container.querySelectorAll('.form-help').length - 1].textContent =
          'Zone gratuite\u00a0: ' + (cfg.zoneGratuiteKm || 0) + '\u00a0km d\u00e9duits avant calcul.');
    }
    ['#dep-taux-fiscal','#dep-taux-interne','#dep-forfait','#dep-zone-gratuite','#dep-bareme'].forEach(id => {
      container.querySelector(id).addEventListener('input', _refreshBareme);
    });

    // Sauvegarde
    container.querySelector('#btn-save-deplacement').addEventListener('click', function() {
      const cfg = _readDeplacementFields();
      const s   = DB.settings.get();
      s.deplacement = cfg;
      DB.settings.set(s);
      if (typeof Toast !== 'undefined') Toast.show('Bar\u00e8me d\u00e9placements enregistr\u00e9', 'success');
    });

    function _readDeplacementFields() {
      return {
        bareme:           container.querySelector('#dep-bareme').value,
        tauxFiscalKm:     parseFloat(container.querySelector('#dep-taux-fiscal').value) || 0.321,
        tauxInterneKm:    parseFloat(container.querySelector('#dep-taux-interne').value) || 0.35,
        forfaitJournee:   parseFloat(container.querySelector('#dep-forfait').value) || 0,
        zoneGratuiteKm:   parseFloat(container.querySelector('#dep-zone-gratuite').value) || 0,
        inclureDansDevis: container.querySelector('#dep-inclure-devis').checked,
        seuilInclusJours: d.seuilInclusJours || 1
      };
    }
  }
};
