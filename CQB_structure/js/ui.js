'use strict';

const UI = {
  // ── Settings tab ───────────────────────────────────────────
  renderSettings() {
    const { materials, compositions, business } = AppState.settings;
    const matKeys  = Object.keys(materials);
    const compKeys = Object.keys(compositions);

    // ── A. Materials ──────────────────────────────────────────
    const matRows = matKeys.map(k => {
      const m = materials[k];
      return `
      <tr>
        <td>${m.name}</td>
        <td class="td-unit">${m.unit}</td>
        <td><input class="inp-price" type="number" step="0.01" min="0"
            value="${m.price}" data-mat="${k}"></td>
      </tr>`;
    }).join('');

    document.getElementById('table-materials').innerHTML = `
      <thead>
        <tr><th>Matériau</th><th>Unité</th><th>Prix HT (€)</th></tr>
      </thead>
      <tbody>${matRows}</tbody>`;

    document.querySelectorAll('.inp-price').forEach(el => {
      el.addEventListener('input', () => {
        AppState.setMaterialPrice(el.dataset.mat, el.value);
        UI.renderDevis();
      });
    });

    // ── B. Compositions ───────────────────────────────────────
    const compHtml = compKeys.map(type => {
      const comp = compositions[type];
      const rows = matKeys.map(k => `
        <tr>
          <td>${materials[k].name}</td>
          <td class="td-unit">${materials[k].unit}</td>
          <td><input class="inp-comp" type="number" step="0.01" min="0"
              value="${comp[k]}" data-type="${type}" data-key="${k}"></td>
        </tr>`).join('');
      return `
        <div class="comp-block">
          <div class="comp-title">${MODULE_LABELS[type]} <span class="badge-type">${MODULE_ICONS[type]}</span></div>
          <table class="comp-table">
            <thead><tr><th>Composant</th><th>Unité</th><th>Quantité / module</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');

    document.getElementById('compositions-panel').innerHTML = compHtml;

    document.querySelectorAll('.inp-comp').forEach(el => {
      el.addEventListener('input', () => {
        AppState.setComposition(el.dataset.type, el.dataset.key, el.value);
        UI.renderDevis();
      });
    });

    // ── C. Business ───────────────────────────────────────────
    document.getElementById('business-panel').innerHTML = `
      <div class="biz-grid">
        <div class="biz-row">
          <label>Marge commerciale</label>
          <div class="biz-input-wrap">
            <input class="inp-biz" type="number" step="1" min="0" max="200"
                   id="biz-margin" value="${business.margin}">
            <span class="biz-unit">%</span>
          </div>
        </div>
        <div class="biz-row">
          <label>Coût de livraison</label>
          <div class="biz-input-wrap">
            <input class="inp-biz" type="number" step="50" min="0"
                   id="biz-delivery" value="${business.delivery}">
            <span class="biz-unit">€ HT</span>
          </div>
        </div>
        <div class="biz-row">
          <label>Coût de pose / installation</label>
          <div class="biz-input-wrap">
            <input class="inp-biz" type="number" step="50" min="0"
                   id="biz-installation" value="${business.installation}">
            <span class="biz-unit">€ HT</span>
          </div>
        </div>
      </div>`;

    document.getElementById('biz-margin').addEventListener('input', e => {
      AppState.setBusiness('margin', e.target.value); UI.renderDevis();
    });
    document.getElementById('biz-delivery').addEventListener('input', e => {
      AppState.setBusiness('delivery', e.target.value); UI.renderDevis();
    });
    document.getElementById('biz-installation').addEventListener('input', e => {
      AppState.setBusiness('installation', e.target.value); UI.renderDevis();
    });
  },

  // ── Devis tab ──────────────────────────────────────────────
  renderDevis() {
    const res = Calculator.compute();
    const { counts, moduleCosts, totalMat, sellPrice, marginAmount, delivery, installation, totalModules } = res;
    const { materials, compositions } = AppState.settings;
    const matKeys = Object.keys(materials);

    if (totalModules === 0) {
      document.getElementById('devis-content').innerHTML = `
        <div class="devis-empty">
          <div class="devis-empty-icon">⊞</div>
          <div>Aucun module posé.<br>Dessinez votre shooting house dans l'onglet <strong>Plan 2D</strong>.</div>
        </div>`;
      document.getElementById('header-price').textContent = '—';
      return;
    }

    // Module summary table
    const typeRows = Object.keys(counts).filter(t => counts[t] > 0).map(t => {
      const mc = moduleCosts[t];
      return `
        <tr>
          <td>${MODULE_ICONS[t]} ${MODULE_LABELS[t]}</td>
          <td class="td-num">${counts[t]}</td>
          <td class="td-num">${mc.unit.toFixed(2)} €</td>
          <td class="td-num"><strong>${mc.total.toFixed(2)} €</strong></td>
        </tr>`;
    }).join('');

    // Material breakdown per type
    const detailBlocks = Object.keys(counts).filter(t => counts[t] > 0).map(t => {
      const mc = moduleCosts[t];
      const rows = matKeys.filter(k => (compositions[t][k] || 0) > 0).map(k => {
        const bd = mc.breakdown[k];
        return `<tr>
          <td class="td-sm">${materials[k].name}</td>
          <td class="td-sm td-num">${bd.qty} ${materials[k].unit}</td>
          <td class="td-sm td-num">${materials[k].price.toFixed(2)} €/${materials[k].unit}</td>
          <td class="td-sm td-num">${(bd.line * counts[t]).toFixed(2)} €</td>
        </tr>`;
      }).join('');
      return `
        <div class="detail-block">
          <div class="detail-title">${MODULE_ICONS[t]} ${MODULE_LABELS[t]} — ${counts[t]} unité(s)</div>
          <table class="detail-table">
            <thead><tr><th>Composant</th><th>Qté / module</th><th>P.U.</th><th>Total</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');

    const html = `
      <div class="devis-header">
        <div>
          <div class="devis-project-name">${AppState.projectName}</div>
          <div class="devis-date">Édité le ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}</div>
        </div>
        <div class="devis-logo-area">CRBR Solutions</div>
      </div>

      <section class="devis-section">
        <h3 class="devis-section-title">1. Récapitulatif des modules</h3>
        <table class="devis-table">
          <thead>
            <tr><th>Type de module</th><th>Qté</th><th>Coût unitaire</th><th>Coût total</th></tr>
          </thead>
          <tbody>
            ${typeRows}
            <tr class="total-row">
              <td><strong>TOTAL MODULES</strong></td>
              <td class="td-num"><strong>${totalModules}</strong></td>
              <td></td>
              <td class="td-num"><strong>${totalMat.toFixed(2)} €</strong></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="devis-section">
        <h3 class="devis-section-title">2. Détail par module</h3>
        ${detailBlocks}
      </section>

      <section class="devis-section">
        <h3 class="devis-section-title">3. Calcul du prix de vente</h3>
        <div class="price-block">
          <div class="price-row">
            <span>Coût matériaux total</span>
            <span>${totalMat.toFixed(2)} € HT</span>
          </div>
          <div class="price-row">
            <span>Marge commerciale (${AppState.settings.business.margin}%)</span>
            <span>+ ${marginAmount.toFixed(2)} € HT</span>
          </div>
          <div class="price-row">
            <span>Livraison</span>
            <span>+ ${delivery.toFixed(2)} € HT</span>
          </div>
          <div class="price-row">
            <span>Pose / Installation</span>
            <span>+ ${installation.toFixed(2)} € HT</span>
          </div>
          <div class="price-row price-row--total">
            <span>PRIX DE VENTE HT</span>
            <span>${sellPrice.toFixed(2)} € HT</span>
          </div>
          <div class="price-row price-row--tva">
            <span>TVA 20%</span>
            <span>${(sellPrice * 0.2).toFixed(2)} €</span>
          </div>
          <div class="price-row price-row--ttc">
            <span>PRIX TTC</span>
            <span>${(sellPrice * 1.2).toFixed(2)} € TTC</span>
          </div>
        </div>
      </section>`;

    document.getElementById('devis-content').innerHTML = html;
    document.getElementById('header-price').textContent = `${sellPrice.toFixed(0)} € HT`;
  },

  // ── Side panel module counts ───────────────────────────────
  renderModuleCounts() {
    const counts = { wall: 0, window: 0, door: 0, opening: 0 };
    AppState.modules.forEach(m => { if (counts[m.type] !== undefined) counts[m.type]++; });
    const total = Object.values(counts).reduce((s, v) => s + v, 0);

    const el = document.getElementById('module-counts');
    if (!el) return;
    if (total === 0) { el.innerHTML = '<div class="no-modules">Aucun module</div>'; return; }

    el.innerHTML = Object.keys(counts).map(t => counts[t] > 0
      ? `<div class="mod-count-row">
           <span>${MODULE_ICONS[t]}</span>
           <span class="mod-count-label">${MODULE_LABELS[t]}</span>
           <span class="mod-count-val">${counts[t]}</span>
         </div>`
      : '').join('');
  },
};
