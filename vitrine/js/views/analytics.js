/* ============================================================
   DST-SYSTEM — Vue Analytics vitrine
   Lit les données depuis l'Edge Function analytics-read.
   ============================================================ */
window.Views = window.Views || {};

Views.Analytics = (function () {
  'use strict';

  const EDGE_URL = 'https://uhpvshugtpmxgsztbovi.supabase.co/functions/v1/analytics-read';
  const ADMIN_TOKEN = 'dst-analytics-2026';

  let _currentPeriod = '30d';

  /* --- A. Chargement des données --- */
  async function _loadData(period) {
    const res = await fetch(EDGE_URL + '?period=' + period, {
      headers: {
        'x-admin-token': ADMIN_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    return res.json();
  }

  /* --- Utilitaires --- */
  function _fmtDuration(s) {
    if (!s && s !== 0) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + 'm ' + sec + 's';
  }

  function _esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* --- B. Rendu principal --- */
  function render(container) {
    container.innerHTML = `
      <div class="view-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h2 style="font-size:1.1rem;font-weight:700;color:var(--text-heading);">Analytics — Site vitrine</h2>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;gap:4px;" id="analytics-pills">
            <button class="btn btn-sm${_currentPeriod === '7d' ? ' btn-primary' : ''}" data-period="7d">7j</button>
            <button class="btn btn-sm${_currentPeriod === '30d' ? ' btn-primary' : ''}" data-period="30d">30j</button>
            <button class="btn btn-sm${_currentPeriod === '90d' ? ' btn-primary' : ''}" data-period="90d">90j</button>
          </div>
          <button class="btn btn-sm" id="analytics-refresh">Actualiser</button>
          <span class="text-muted" id="analytics-updated" style="font-size:11px;"></span>
        </div>
      </div>
      <div id="analytics-content">
        <div style="text-align:center;padding:48px 0;">
          <div class="spinner" style="margin:0 auto 12px;"></div>
          <p class="text-muted">Chargement des données…</p>
        </div>
      </div>
    `;

    /* Période pills */
    container.querySelectorAll('[data-period]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _currentPeriod = btn.dataset.period;
        render(container);
      });
    });

    /* Actualiser */
    var refreshBtn = container.querySelector('#analytics-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        _loadAndRender(container);
      });
    }

    _loadAndRender(container);
  }

  /* --- Chargement + rendu du contenu --- */
  async function _loadAndRender(container) {
    var contentEl = container.querySelector('#analytics-content');
    if (!contentEl) return;

    contentEl.innerHTML = `
      <div style="text-align:center;padding:48px 0;">
        <div class="spinner" style="margin:0 auto 12px;"></div>
        <p class="text-muted">Chargement…</p>
      </div>
    `;

    try {
      var data = await _loadData(_currentPeriod);

      if (data.error) {
        contentEl.innerHTML = `
          <div class="alert" style="border-left:2px solid var(--accent-red);padding:16px;background:rgba(230,57,70,0.06);">
            <strong>Erreur :</strong> ${_esc(data.error)}
          </div>
        `;
        return;
      }

      /* Timestamp mise à jour */
      var updEl = container.querySelector('#analytics-updated');
      if (updEl) {
        updEl.textContent = 'Mis à jour : ' + new Date().toLocaleTimeString('fr-FR');
      }

      /* Vérification données vides */
      if (!data.totalViews && !data.uniqueVisitors) {
        contentEl.innerHTML = `
          <div class="card" style="text-align:center;padding:48px;">
            <div style="font-size:2rem;margin-bottom:12px;">📊</div>
            <p style="font-weight:600;margin-bottom:6px;">Aucune donnée pour cette période.</p>
            <p class="text-muted">Le tracking est actif sur le site vitrine.</p>
          </div>
        `;
        return;
      }

      var totalEvents = (data.topEvents || []).reduce(function (s, e) {
        return s + e.count;
      }, 0);

      /* C. KPI Cards */
      var kpiHtml = `
        <div class="kpi-grid">
          ${_kpiCard('PAGES VUES', data.totalViews || 0)}
          ${_kpiCard('VISITEURS UNIQ.', data.uniqueVisitors || 0)}
          ${_kpiCard('DURÉE MOY.', _fmtDuration(data.avgDuration))}
          ${_kpiCard('EVENTS', totalEvents)}
        </div>
      `;

      /* D. Sparkline */
      var sparkHtml = `
        <div class="card" style="margin-bottom:16px;">
          <div class="card-header"><h3>Vues par jour</h3></div>
          ${_buildSparkline(data.dailyViews || [])}
        </div>
      `;

      /* E. Pages + Sources */
      var col1Html = `
        <div class="grid-2" style="margin-bottom:16px;">
          <div class="card">
            <div class="card-header"><h3>Pages les plus vues</h3></div>
            ${_buildTopPages(data.topPages || [])}
          </div>
          <div class="card">
            <div class="card-header"><h3>Sources de trafic</h3></div>
            ${_buildReferrers(data.topReferrers || [])}
          </div>
        </div>
      `;

      /* F. Devices + Events */
      var col2Html = `
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><h3>Devices</h3></div>
            ${_buildDevices(data.devices || {})}
          </div>
          <div class="card">
            <div class="card-header"><h3>Actions &amp; Events</h3></div>
            ${_buildEvents(data.topEvents || [])}
          </div>
        </div>
      `;

      contentEl.innerHTML = kpiHtml + sparkHtml + col1Html + col2Html;

    } catch (e) {
      contentEl.innerHTML = `
        <div class="alert" style="border-left:2px solid var(--accent-red);padding:16px;background:rgba(230,57,70,0.06);">
          <strong>Erreur de connexion à l'Edge Function.</strong><br>
          <span class="text-muted">${_esc(e.message)}</span>
        </div>
      `;
    }
  }

  /* --- C. KPI Card --- */
  function _kpiCard(label, value) {
    return `
      <div class="kpi-card">
        <div class="kpi-label">${_esc(String(label))}</div>
        <div class="kpi-value">${_esc(String(value))}</div>
      </div>
    `;
  }

  /* --- D. Sparkline --- */
  function _buildSparkline(dailyViews) {
    if (!dailyViews.length) {
      return '<p class="text-muted" style="padding:8px 0;">Aucune donnée</p>';
    }
    var max = Math.max.apply(null, dailyViews.map(function (d) { return d.views; }).concat([1]));
    var bars = dailyViews.map(function (d) {
      var pct = Math.round((d.views / max) * 100);
      return '<div class="spark-bar" style="height:' + pct + '%"'
        + ' title="' + _esc(d.date) + ' : ' + d.views + ' vues"></div>';
    }).join('');
    return '<div class="sparkline-chart">' + bars + '</div>';
  }

  /* --- E. Top pages --- */
  function _buildTopPages(pages) {
    if (!pages.length) {
      return '<p class="text-muted">Aucune donnée</p>';
    }
    var max = Math.max.apply(null, pages.map(function (p) { return p.views; }).concat([1]));
    var rows = pages.map(function (p) {
      var pct = Math.round((p.views / max) * 100);
      return '<tr>'
        + '<td style="padding:5px 0;">'
        + '<div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:3px;">' + _esc(p.page) + '</div>'
        + '<div style="height:3px;background:var(--accent-red);border-radius:2px;width:' + pct + '%;opacity:0.5;"></div>'
        + '</td>'
        + '<td style="text-align:right;padding:5px 0 5px 12px;font-weight:600;white-space:nowrap;">' + p.views + '</td>'
        + '</tr>';
    }).join('');
    return '<table style="width:100%;font-size:0.85rem;border-collapse:collapse;">'
      + '<thead><tr>'
      + '<th style="text-align:left;padding:4px 0;color:var(--text-muted);font-weight:500;font-size:0.75rem;">Page</th>'
      + '<th style="text-align:right;padding:4px 0;color:var(--text-muted);font-weight:500;font-size:0.75rem;">Vues</th>'
      + '</tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table>';
  }

  /* --- E. Sources de trafic --- */
  function _buildReferrers(refs) {
    if (!refs.length) {
      return '<p class="text-muted">Aucune donnée</p>';
    }
    var total = refs.reduce(function (s, r) { return s + r.views; }, 0) || 1;
    var rows = refs.map(function (r) {
      var pct = Math.round(r.views / total * 100);
      var src = r.referrer || 'Direct';
      return '<tr>'
        + '<td style="padding:5px 0;word-break:break-all;">' + _esc(src) + '</td>'
        + '<td style="text-align:right;padding:5px 0 5px 8px;font-weight:600;">' + r.views + '</td>'
        + '<td style="text-align:right;padding:5px 0 5px 8px;color:var(--text-muted);">' + pct + '%</td>'
        + '</tr>';
    }).join('');
    return '<table style="width:100%;font-size:0.85rem;border-collapse:collapse;">'
      + '<thead><tr>'
      + '<th style="text-align:left;padding:4px 0;color:var(--text-muted);font-weight:500;font-size:0.75rem;">Source</th>'
      + '<th style="text-align:right;padding:4px 0;color:var(--text-muted);font-weight:500;font-size:0.75rem;">Vues</th>'
      + '<th style="text-align:right;padding:4px 0;color:var(--text-muted);font-weight:500;font-size:0.75rem;">%</th>'
      + '</tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table>';
  }

  /* --- F. Devices --- */
  function _buildDevices(devices) {
    var total = Object.values(devices).reduce(function (s, v) { return s + v; }, 0) || 1;
    var types = [
      { key: 'desktop', icon: '🖥', label: 'Desktop' },
      { key: 'mobile',  icon: '📱', label: 'Mobile' },
      { key: 'tablet',  icon: '⬛', label: 'Tablette' }
    ];
    return types.map(function (t) {
      var count = devices[t.key] || 0;
      var pct = Math.round(count / total * 100);
      return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-color);">'
        + '<span style="font-size:1.1rem;width:22px;text-align:center;">' + t.icon + '</span>'
        + '<div style="flex:1;">'
        + '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'
        + '<span>' + t.label + '</span>'
        + '<span style="font-weight:600;">' + pct + '%</span>'
        + '</div>'
        + '<div style="height:4px;background:var(--bg-tertiary,#1c2333);border-radius:2px;">'
        + '<div style="height:100%;width:' + pct + '%;background:var(--accent-red);border-radius:2px;opacity:0.7;"></div>'
        + '</div>'
        + '</div>'
        + '<span style="color:var(--text-muted);font-size:0.78rem;min-width:28px;text-align:right;">' + count + '</span>'
        + '</div>';
    }).join('');
  }

  /* --- F. Events --- */
  function _buildEvents(events) {
    if (!events.length) {
      return '<p class="text-muted">Aucun event enregistré</p>';
    }
    var rows = events.map(function (e) {
      return '<tr>'
        + '<td style="padding:5px 0;">' + _esc(e.type) + '</td>'
        + '<td style="padding:5px 0 5px 8px;color:var(--text-secondary);">' + _esc(e.label || '—') + '</td>'
        + '<td style="text-align:right;padding:5px 0 5px 8px;font-weight:600;">' + e.count + '</td>'
        + '</tr>';
    }).join('');
    return '<table style="width:100%;font-size:0.85rem;border-collapse:collapse;">'
      + '<thead><tr>'
      + '<th style="text-align:left;padding:4px 0;color:var(--text-muted);font-weight:500;font-size:0.75rem;">Type</th>'
      + '<th style="text-align:left;padding:4px 0;color:var(--text-muted);font-weight:500;font-size:0.75rem;">Label</th>'
      + '<th style="text-align:right;padding:4px 0;color:var(--text-muted);font-weight:500;font-size:0.75rem;">N</th>'
      + '</tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table>';
  }

  return { render: render };

})();
