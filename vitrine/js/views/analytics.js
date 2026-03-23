/* ============================================================
   DST-SYSTEM — Vue Analytics vitrine
   Lit les données depuis l'Edge Function analytics-read.
   ============================================================ */
window.Views = window.Views || {};

Views.Analytics = (function () {
  'use strict';

  var EDGE_URL = 'https://uhpvshugtpmxgsztbovi.supabase.co/functions/v1/analytics-read';
  var ADMIN_TOKEN = 'dst-analytics-2026';

  var _currentPeriod = '30d';

  /* --- Chargement des données --- */
  function _loadData(period) {
    return fetch(
      EDGE_URL + '?period=' + period + '&suppress_internal=true',
      {
        headers: {
          'x-admin-token': ADMIN_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    ).then(function (r) { return r.json(); });
  }

  /* --- Utilitaires --- */
  function _esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _extractDomain(url) {
    if (!url) return 'Direct';
    var m = url.match(/^https?:\/\/([^\/]+)/);
    return m ? m[1].replace(/^www\./, '') : url;
  }

  function _fmtTime(isoStr) {
    try {
      var d = new Date(isoStr);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '—'; }
  }

  /* --- Rendu principal --- */
  function render(container) {
    container.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:8px;">'
      + '<h2 style="font-size:1.1rem;font-weight:700;color:var(--text-heading);">Analytics — Site vitrine</h2>'
      + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
      + '<div style="display:flex;gap:4px;">'
      + '<button class="btn btn-sm' + (_currentPeriod === '7d' ? ' btn-primary' : '') + '" data-period="7d">7j</button>'
      + '<button class="btn btn-sm' + (_currentPeriod === '30d' ? ' btn-primary' : '') + '" data-period="30d">30j</button>'
      + '<button class="btn btn-sm' + (_currentPeriod === '90d' ? ' btn-primary' : '') + '" data-period="90d">90j</button>'
      + '</div>'
      + '<button class="btn btn-sm" id="analytics-refresh">Actualiser</button>'
      + '<span class="text-muted" id="analytics-updated" style="font-size:11px;"></span>'
      + '</div>'
      + '</div>'
      + '<div id="analytics-content">'
      + '<div style="text-align:center;padding:48px 0;">'
      + '<div class="spinner" style="margin:0 auto 12px;"></div>'
      + '<p class="text-muted">Chargement des données…</p>'
      + '</div>'
      + '</div>';

    container.querySelectorAll('[data-period]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        _currentPeriod = btn.dataset.period;
        render(container);
      });
    });

    var refreshBtn = container.querySelector('#analytics-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        _loadAndRender(container);
      });
    }

    _loadAndRender(container);
  }

  /* --- Chargement + rendu --- */
  function _loadAndRender(container) {
    var contentEl = container.querySelector('#analytics-content');
    if (!contentEl) return;

    contentEl.innerHTML =
      '<div style="text-align:center;padding:48px 0;">'
      + '<div class="spinner" style="margin:0 auto 12px;"></div>'
      + '<p class="text-muted">Chargement…</p>'
      + '</div>';

    _loadData(_currentPeriod).then(function (data) {

      if (data.error) {
        contentEl.innerHTML =
          '<div class="alert" style="border-left:2px solid var(--accent-red);padding:16px;background:rgba(230,57,70,0.06);">'
          + '<strong>Erreur :</strong> ' + _esc(data.error)
          + '</div>';
        return;
      }

      var updEl = container.querySelector('#analytics-updated');
      if (updEl) updEl.textContent = 'Mis à jour : ' + new Date().toLocaleTimeString('fr-FR');

      if (!data.totalViews && !data.uniqueVisitors) {
        contentEl.innerHTML =
          '<div class="card" style="text-align:center;padding:48px;">'
          + '<div style="font-size:2rem;margin-bottom:12px;">📊</div>'
          + '<p style="font-weight:600;margin-bottom:6px;">Aucune donnée pour cette période.</p>'
          + '<p class="text-muted">Le tracking est actif sur le site vitrine.</p>'
          + '</div>';
        return;
      }

      var totalEvents = (data.topEvents || []).reduce(function (s, e) { return s + e.count; }, 0);
      var pps = data.pagesPerSession || 0;
      var ppsClass = pps >= 2 ? 'kpi-success' : 'kpi-warning';

      /* KPI Cards */
      var kpiHtml =
        '<div class="kpi-grid">'
        + _kpiCard('PAGES VUES', data.totalViews || 0, '')
        + _kpiCard('VISITEURS UNIQ.', data.uniqueVisitors || 0, '')
        + _kpiCard('PAGES / SESSION', pps.toFixed(1), ppsClass)
        + _kpiCard('EVENTS', totalEvents, '')
        + '</div>';

      /* Sparkline */
      var sparkHtml =
        '<div class="card" style="margin-bottom:16px;">'
        + '<div class="card-header"><h3>Vues par jour</h3></div>'
        + _buildSparkline(data.dailyViews || [], _currentPeriod)
        + '</div>';

      /* Pages + Score */
      var colPagesScore =
        '<div class="grid-2" style="margin-bottom:16px;">'
        + '<div class="card"><div class="card-header"><h3>Pages les plus vues</h3></div>'
        + _buildTopPages(data.topPages || []) + '</div>'
        + '<div class="card"><div class="card-header"><h3>Visibilité &amp; Performance</h3></div>'
        + _buildScoreWidget(data) + '</div>'
        + '</div>';

      /* Sources + Events */
      var colSourcesEvents =
        '<div class="grid-2" style="margin-bottom:16px;">'
        + '<div class="card"><div class="card-header"><h3>Sources de trafic</h3></div>'
        + _buildReferrers(data.topReferrers || []) + '</div>'
        + '<div class="card"><div class="card-header"><h3>Actions &amp; Events</h3></div>'
        + _buildEvents(data.topEvents || []) + '</div>'
        + '</div>';

      /* Devices + Navigateurs */
      var colDevicesBrowsers =
        '<div class="grid-2" style="margin-bottom:16px;">'
        + '<div class="card"><div class="card-header"><h3>Devices</h3></div>'
        + _buildDevices(data.devices || {}) + '</div>'
        + '<div class="card"><div class="card-header"><h3>Navigateurs</h3></div>'
        + _buildBrowsers(data.browsers || {}) + '</div>'
        + '</div>';

      /* Dernières visites */
      var recentHtml =
        '<div class="card">'
        + '<div class="card-header"><h3>Dernières visites</h3></div>'
        + _buildRecentVisits(data.recentVisits || [])
        + '</div>';

      contentEl.innerHTML = kpiHtml + sparkHtml + colPagesScore + colSourcesEvents + colDevicesBrowsers + recentHtml;

    }).catch(function (e) {
      contentEl.innerHTML =
        '<div class="alert" style="border-left:2px solid var(--accent-red);padding:16px;background:rgba(230,57,70,0.06);">'
        + '<strong>Erreur de connexion à l\'Edge Function.</strong><br>'
        + '<span class="text-muted">' + _esc(e.message) + '</span>'
        + '</div>';
    });
  }

  /* --- KPI Card --- */
  function _kpiCard(label, value, cssClass) {
    return '<div class="kpi-card' + (cssClass ? ' ' + cssClass : '') + '">'
      + '<div class="kpi-label">' + _esc(String(label)) + '</div>'
      + '<div class="kpi-value">' + _esc(String(value)) + '</div>'
      + '</div>';
  }

  /* --- Sparkline amélioré --- */
  function _buildSparkline(dailyViews, period) {
    if (!dailyViews || dailyViews.length <= 1) {
      return '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">'
        + '📈 Les données s\'afficheront au fil des visites.<br>'
        + '<span style="font-size:11px;">Revenez demain pour voir l\'évolution.</span>'
        + '</div>';
    }

    var max = Math.max.apply(null, dailyViews.map(function (d) { return d.views; }).concat([1]));
    var total = dailyViews.reduce(function (s, d) { return s + d.views; }, 0);
    var avg = total / dailyViews.length;
    var avgPct = Math.round((avg / max) * 100);
    var avgRounded = Math.round(avg);
    var peak = dailyViews.reduce(function (m, d) { return d.views > m.views ? d : m; }, dailyViews[0]);
    var peakDate = peak.date.slice(8, 10) + '/' + peak.date.slice(5, 7);

    var showAll = period === '7d' || dailyViews.length <= 7;

    var bars = dailyViews.map(function (d) {
      var pct = Math.round((d.views / max) * 100);
      var color = d.views >= max * 0.8
        ? 'var(--accent-red)'
        : d.views >= max * 0.5
          ? 'var(--color-warning, #f59e0b)'
          : 'var(--color-success, #2dd4a0)';
      return '<div class="spark-bar" style="height:' + pct + '%;background:' + color + ';opacity:0.85;"'
        + ' title="' + _esc(d.date) + ' : ' + d.views + ' vues"></div>';
    }).join('');

    var labels = dailyViews.map(function (d, i) {
      var show = showAll || i % 7 === 0 || i === dailyViews.length - 1;
      var lbl = show ? (d.date.slice(8, 10) + '/' + d.date.slice(5, 7)) : '';
      return '<div style="flex:1;text-align:center;font-size:9px;color:var(--text-muted);overflow:hidden;white-space:nowrap;">'
        + _esc(lbl) + '</div>';
    }).join('');

    return '<div>'
      + '<div class="sparkline-chart" style="position:relative;">'
      + bars
      + '<div style="position:absolute;left:0;right:0;height:1px;background:rgba(255,255,255,0.2);bottom:' + avgPct + '%;pointer-events:none;" title="Moyenne : ' + avgRounded + ' vues/jour"></div>'
      + '</div>'
      + '<div style="display:flex;gap:2px;margin-top:4px;">' + labels + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-top:8px;padding-bottom:4px;">'
      + 'Pic : <strong style="color:var(--text-secondary);">' + peak.views + ' vues</strong> le ' + peakDate
      + ' · Moyenne : <strong style="color:var(--text-secondary);">' + avgRounded + '</strong> vues/jour'
      + '</div>'
      + '</div>';
  }

  /* --- Top pages --- */
  function _buildTopPages(pages) {
    if (!pages.length) return '<p class="text-muted">Aucune donnée</p>';
    var max = Math.max.apply(null, pages.map(function (p) { return p.views; }).concat([1]));
    var rows = pages.map(function (p) {
      var pct = Math.round((p.views / max) * 100);
      return '<div class="analytics-bar-row">'
        + '<div class="analytics-bar-label" title="' + _esc(p.page) + '">' + _esc(p.page) + '</div>'
        + '<div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:' + pct + '%;"></div></div>'
        + '<div class="analytics-bar-value">' + p.views + '</div>'
        + '</div>';
    }).join('');
    return '<div>' + rows + '</div>';
  }

  /* --- Sources de trafic --- */
  function _buildReferrers(refs) {
    if (!refs.length) return '<p class="text-muted">Aucune donnée</p>';
    var total = refs.reduce(function (s, r) { return s + r.views; }, 0) || 1;
    var rows = refs.map(function (r) {
      var pct = Math.round(r.views / total * 100);
      var src = r.referrer || 'Direct';
      return '<div class="analytics-bar-row">'
        + '<div class="analytics-bar-label" title="' + _esc(src) + '">' + _esc(src) + '</div>'
        + '<div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:' + pct + '%;"></div></div>'
        + '<div class="analytics-bar-value">' + pct + '%</div>'
        + '</div>';
    }).join('');
    return '<div>' + rows + '</div>';
  }

  /* --- Devices --- */
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

  /* --- Navigateurs --- */
  function _buildBrowsers(browsers) {
    var total = Object.values(browsers).reduce(function (s, v) { return s + v; }, 0) || 1;
    var types = [
      { key: 'Chrome',  icon: '🌐', label: 'Chrome' },
      { key: 'Firefox', icon: '🦊', label: 'Firefox' },
      { key: 'Safari',  icon: '🧭', label: 'Safari' },
      { key: 'Edge',    icon: '🔷', label: 'Edge' },
      { key: 'Other',   icon: '❓', label: 'Other' }
    ];
    return types.map(function (t) {
      var count = browsers[t.key] || 0;
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

  /* --- Events --- */
  function _buildEvents(events) {
    if (!events.length) return '<p class="text-muted">Aucun event enregistré</p>';
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

  /* --- Score Visibilité & Performance --- */
  function _buildScoreWidget(data) {
    var pps = data.pagesPerSession || 0;
    var totalViews = data.totalViews || 0;
    var topPages = data.topPages || [];
    var topReferrers = data.topReferrers || [];

    var hasGoogle = topReferrers.some(function (r) {
      return r.referrer && r.referrer.toLowerCase().indexOf('google') !== -1;
    });

    function indicator(label, emoji, text, color) {
      var c = color === 'green'
        ? 'color:var(--color-success,#2dd4a0)'
        : color === 'yellow'
          ? 'color:var(--color-warning,#f59e0b)'
          : 'color:var(--accent-red)';
      return '<div class="score-indicator">'
        + '<span class="score-label">' + label + '</span>'
        + '<span class="score-value" style="' + c + '">' + emoji + ' ' + text + '</span>'
        + '</div>';
    }

    var trafic = totalViews >= 50
      ? indicator('TRAFIC DIRECT', '🟢', 'Bon', 'green')
      : totalViews >= 10
        ? indicator('TRAFIC DIRECT', '🟡', 'En croissance', 'yellow')
        : indicator('TRAFIC DIRECT', '🔴', 'Démarrage', 'red');

    var pages = topPages.length >= 5
      ? indicator('PAGES EXPLORÉES', '🟢', 'Site exploré', 'green')
      : topPages.length >= 2
        ? indicator('PAGES EXPLORÉES', '🟡', 'Navigation partielle', 'yellow')
        : indicator('PAGES EXPLORÉES', '🔴', 'Page unique', 'red');

    var seo = hasGoogle
      ? indicator('TRAFIC ORGANIQUE', '🟢', 'SEO actif', 'green')
      : topReferrers.length >= 2
        ? indicator('TRAFIC ORGANIQUE', '🟡', 'Multi-source', 'yellow')
        : indicator('TRAFIC ORGANIQUE', '🔴', 'Direct uniquement', 'red');

    var eng = pps >= 2.5
      ? indicator('ENGAGEMENT', '🟢', 'Fort', 'green')
      : pps >= 1.5
        ? indicator('ENGAGEMENT', '🟡', 'Moyen', 'yellow')
        : indicator('ENGAGEMENT', '🔴', 'Faible', 'red');

    return trafic + pages + seo + eng
      + '<p style="font-size:11px;color:var(--text-muted);margin-top:12px;line-height:1.6;">'
      + '💡 Pour le trafic organique, connectez Google Search Console à dst-system.fr — '
      + '<a href="https://search.google.com/search-console" target="_blank" '
      + 'style="color:var(--accent-red-light,#ff6b74);text-decoration:none;">search.google.com/search-console</a>'
      + '</p>';
  }

  /* --- Dernières visites --- */
  function _buildRecentVisits(visits) {
    if (!visits || !visits.length) {
      return '<p class="text-muted">Aucune visite récente pour cette période.</p>';
    }
    var deviceIcons = { mobile: '📱', desktop: '💻', tablet: '📟' };
    var rows = visits.map(function (v) {
      var icon = deviceIcons[v.device] || '💻';
      var source = _extractDomain(v.referrer);
      return '<tr>'
        + '<td style="padding:6px 8px 6px 0;color:var(--text-muted);font-size:0.78rem;white-space:nowrap;">'
        + _fmtTime(v.created_at) + '</td>'
        + '<td style="padding:6px 4px;font-size:0.8rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
        + _esc(v.page) + '</td>'
        + '<td style="padding:6px 4px;text-align:center;font-size:1rem;">' + icon + '</td>'
        + '<td style="padding:6px 4px;color:var(--text-secondary);font-size:0.78rem;">'
        + _esc(v.browser || '—') + '</td>'
        + '<td style="padding:6px 0 6px 4px;color:var(--text-muted);font-size:0.78rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
        + _esc(source) + '</td>'
        + '</tr>';
    }).join('');
    return '<div style="overflow-x:auto;">'
      + '<table style="width:100%;font-size:0.82rem;border-collapse:collapse;">'
      + '<thead><tr>'
      + '<th style="text-align:left;padding:4px 8px 4px 0;color:var(--text-muted);font-weight:500;font-size:0.72rem;white-space:nowrap;">Heure</th>'
      + '<th style="text-align:left;padding:4px;color:var(--text-muted);font-weight:500;font-size:0.72rem;">Page</th>'
      + '<th style="text-align:center;padding:4px;color:var(--text-muted);font-weight:500;font-size:0.72rem;">Device</th>'
      + '<th style="text-align:left;padding:4px;color:var(--text-muted);font-weight:500;font-size:0.72rem;">Navigateur</th>'
      + '<th style="text-align:left;padding:4px 0 4px 4px;color:var(--text-muted);font-weight:500;font-size:0.72rem;">Source</th>'
      + '</tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table>'
      + '</div>';
  }

  return { render: render };

})();
