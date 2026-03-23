/* ============================================================
   DST-SYSTEM — Vue Analytics vitrine
   Layout dense 5 rows + widget SEO + conseils
   ============================================================ */
window.Views = window.Views || {};

Views.Analytics = (function () {
  'use strict';

  var EDGE_URL   = 'https://uhpvshugtpmxgsztbovi.supabase.co/functions/v1/analytics-read';
  var ADMIN_TOKEN = 'dst-analytics-2026';
  var _currentPeriod = '30d';

  /* ---- Chargement ---- */
  function _loadData(period) {
    return fetch(
      EDGE_URL + '?period=' + period + '&suppress_internal=true',
      { headers: { 'x-admin-token': ADMIN_TOKEN, 'Content-Type': 'application/json' } }
    ).then(function (r) { return r.json(); });
  }

  /* ---- Utilitaires ---- */
  function _esc(str) {
    if (str == null) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function _extractDomain(url) {
    if (!url) return 'Direct';
    var m = url.match(/^https?:\/\/([^\/]+)/);
    return m ? m[1].replace(/^www\./, '') : url;
  }
  function _fmtTime(isoStr) {
    try { return new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return '—'; }
  }
  /* Titre de section unifié */
  function _ct(text) {
    return '<div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;'
      + 'color:var(--text-muted);margin-bottom:12px;">' + text + '</div>';
  }
  /* Séparateur intra-widget */
  var _SEP = '<div style="border-top:1px solid rgba(255,255,255,0.05);margin:12px 0;padding-top:12px;"></div>';

  /* ---- Rendu principal ---- */
  function render(container) {
    container.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:8px;">'
      + '<h2 style="font-size:1.1rem;font-weight:700;color:var(--text-heading);">Analytics — Site vitrine</h2>'
      + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
      + '<div style="display:flex;gap:4px;">'
      + '<button class="btn btn-sm' + (_currentPeriod === '7d'  ? ' btn-primary' : '') + '" data-period="7d">7j</button>'
      + '<button class="btn btn-sm' + (_currentPeriod === '30d' ? ' btn-primary' : '') + '" data-period="30d">30j</button>'
      + '<button class="btn btn-sm' + (_currentPeriod === '90d' ? ' btn-primary' : '') + '" data-period="90d">90j</button>'
      + '</div>'
      + '<button class="btn btn-sm" id="analytics-refresh">Actualiser</button>'
      + '<span class="text-muted" id="analytics-updated" style="font-size:11px;"></span>'
      + '</div></div>'
      + '<div id="analytics-content">'
      + '<div style="text-align:center;padding:48px 0;">'
      + '<div class="spinner" style="margin:0 auto 12px;"></div>'
      + '<p class="text-muted">Chargement des données…</p>'
      + '</div></div>';

    container.querySelectorAll('[data-period]').forEach(function (btn) {
      btn.addEventListener('click', function () { _currentPeriod = btn.dataset.period; render(container); });
    });
    var rb = container.querySelector('#analytics-refresh');
    if (rb) rb.addEventListener('click', function () { _loadAndRender(container); });
    _loadAndRender(container);
  }

  /* ---- Chargement + rendu ---- */
  function _loadAndRender(container) {
    var el = container.querySelector('#analytics-content');
    if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:48px 0;">'
      + '<div class="spinner" style="margin:0 auto 12px;"></div><p class="text-muted">Chargement…</p></div>';

    _loadData(_currentPeriod).then(function (data) {
      if (data.error) {
        el.innerHTML = '<div class="alert" style="border-left:2px solid var(--accent-red);padding:16px;background:rgba(230,57,70,0.06);">'
          + '<strong>Erreur :</strong> ' + _esc(data.error) + '</div>';
        return;
      }

      var upd = container.querySelector('#analytics-updated');
      if (upd) upd.textContent = 'Mis à jour : ' + new Date().toLocaleTimeString('fr-FR');

      if (!data.totalViews && !data.uniqueVisitors) {
        el.innerHTML = '<div class="card" style="text-align:center;padding:48px;">'
          + '<div style="font-size:2rem;margin-bottom:12px;">📊</div>'
          + '<p style="font-weight:600;margin-bottom:6px;">Aucune donnée pour cette période.</p>'
          + '<p class="text-muted">Le tracking est actif sur le site vitrine.</p></div>';
        return;
      }

      var pps = data.pagesPerSession || 0;
      var totalEvents = (data.topEvents || []).reduce(function (s, e) { return s + e.count; }, 0);

      /* ROW 1 — KPIs */
      var row1 = '<div class="kpi-grid">'
        + _kpiCard('PAGES VUES', data.totalViews || 0, '')
        + _kpiCard('VISITEURS UNIQ.', data.uniqueVisitors || 0, '')
        + _kpiCard('PAGES / SESSION', pps.toFixed(1), pps >= 2 ? 'kpi-success' : 'kpi-warning')
        + _kpiCard('EVENTS', totalEvents, '')
        + '</div>';

      /* ROW 2 — Pages | Sources | Score */
      var row2 = '<div class="analytics-grid-3">'
        + _card(_ct('Pages les plus vues') + _buildTopPages(data.topPages || []))
        + _card(_ct('Sources de trafic')   + _buildReferrers(data.topReferrers || []))
        + _card(_ct('Visibilité & Perf.')  + _buildScoreWidget(data))
        + '</div>';

      /* ROW 3 — Devices | Navigateurs | Events */
      var row3 = '<div class="analytics-grid-equal">'
        + _card(_ct('Devices')         + _buildDevices(data.devices || {}))
        + _card(_ct('Navigateurs')     + _buildBrowsers(data.browsers || {}))
        + _card(_ct('Events & Actions') + _buildEvents(data.topEvents || []))
        + '</div>';

      /* ROW 4 — Sparkline | SEO */
      var row4 = '<div class="analytics-grid-split">'
        + _card(_ct('Vues par jour') + _buildSparkline(data.dailyViews || [], _currentPeriod))
        + _card(_buildSeoWidget(data))
        + '</div>';

      /* ROW 5 — Dernières visites */
      var row5 = _card(_buildRecentVisits(data.recentVisits || []));

      el.innerHTML = row1 + row2 + row3 + row4 + row5;

    }).catch(function (e) {
      el.innerHTML = '<div class="alert" style="border-left:2px solid var(--accent-red);padding:16px;background:rgba(230,57,70,0.06);">'
        + '<strong>Erreur de connexion à l\'Edge Function.</strong><br>'
        + '<span class="text-muted">' + _esc(e.message) + '</span></div>';
    });
  }

  /* ---- Helpers rendu ---- */
  function _card(inner) {
    return '<div class="card" style="padding:16px;margin-bottom:0;">' + inner + '</div>';
  }

  function _kpiCard(label, value, css) {
    return '<div class="kpi-card' + (css ? ' ' + css : '') + '">'
      + '<div class="kpi-label">' + _esc(String(label)) + '</div>'
      + '<div class="kpi-value">' + _esc(String(value)) + '</div>'
      + '</div>';
  }

  /* ---- Sparkline compact ---- */
  function _buildSparkline(dailyViews, period) {
    if (!dailyViews || dailyViews.length <= 1) {
      return '<div class="analytics-empty-spark">📈 <span>Données en cours d\'accumulation</span></div>';
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
      var color = d.views >= max * 0.8 ? 'var(--accent-red)'
        : d.views >= max * 0.5 ? 'var(--color-warning,#f59e0b)'
        : 'var(--color-success,#2dd4a0)';
      return '<div class="spark-bar" style="height:' + pct + '%;background:' + color + ';opacity:0.85;"'
        + ' title="' + _esc(d.date) + ' : ' + d.views + ' vues"></div>';
    }).join('');

    var labels = dailyViews.map(function (d, i) {
      var show = showAll || i % 7 === 0 || i === dailyViews.length - 1;
      return '<div style="flex:1;text-align:center;font-size:9px;color:var(--text-muted);overflow:hidden;white-space:nowrap;">'
        + (show ? _esc(d.date.slice(8, 10) + '/' + d.date.slice(5, 7)) : '') + '</div>';
    }).join('');

    return '<div>'
      + '<div class="sparkline-chart" style="position:relative;">'
      + bars
      + '<div style="position:absolute;left:0;right:0;height:1px;background:rgba(255,255,255,0.2);bottom:' + avgPct + '%;pointer-events:none;"></div>'
      + '</div>'
      + '<div style="display:flex;gap:2px;margin-top:4px;">' + labels + '</div>'
      + '<div style="font-size:11px;color:var(--text-muted);margin-top:8px;">'
      + 'Pic : <strong style="color:var(--text-secondary);">' + peak.views + ' vues</strong> le ' + peakDate
      + ' · Moyenne : <strong style="color:var(--text-secondary);">' + avgRounded + '</strong> vues/jour'
      + '</div></div>';
  }

  /* ---- Top pages ---- */
  function _buildTopPages(pages) {
    if (!pages.length) return '<p class="text-muted" style="font-size:12px;">Aucune donnée</p>';
    var max = Math.max.apply(null, pages.map(function (p) { return p.views; }).concat([1]));
    return '<div>' + pages.map(function (p) {
      var pct = Math.round((p.views / max) * 100);
      return '<div class="analytics-bar-row">'
        + '<div class="analytics-bar-label" title="' + _esc(p.page) + '">' + _esc(p.page) + '</div>'
        + '<div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:' + pct + '%;"></div></div>'
        + '<div class="analytics-bar-value">' + p.views + '</div>'
        + '</div>';
    }).join('') + '</div>';
  }

  /* ---- Sources de trafic ---- */
  function _buildReferrers(refs) {
    if (!refs.length) return '<p class="text-muted" style="font-size:12px;">Aucune donnée</p>';
    var total = refs.reduce(function (s, r) { return s + r.views; }, 0) || 1;
    return '<div>' + refs.map(function (r) {
      var pct = Math.round(r.views / total * 100);
      var src = r.referrer || 'Direct';
      return '<div class="analytics-bar-row">'
        + '<div class="analytics-bar-label" title="' + _esc(src) + '">' + _esc(src) + '</div>'
        + '<div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:' + pct + '%;"></div></div>'
        + '<div class="analytics-bar-value">' + pct + '%</div>'
        + '</div>';
    }).join('') + '</div>';
  }

  /* ---- Devices ---- */
  function _buildDeviceOrBrowser(map, types) {
    var total = Object.values(map).reduce(function (s, v) { return s + v; }, 0) || 1;
    return types.map(function (t) {
      var count = map[t.key] || 0;
      var pct = Math.round(count / total * 100);
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-color);">'
        + '<span style="width:20px;text-align:center;">' + t.icon + '</span>'
        + '<div style="flex:1;">'
        + '<div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:12px;">'
        + '<span>' + t.label + '</span><span style="font-weight:600;">' + pct + '%</span></div>'
        + '<div style="height:3px;background:var(--bg-tertiary,#1c2333);border-radius:2px;">'
        + '<div style="height:100%;width:' + pct + '%;background:var(--accent-red);border-radius:2px;opacity:0.7;"></div>'
        + '</div></div>'
        + '<span style="color:var(--text-muted);font-size:11px;min-width:24px;text-align:right;">' + count + '</span>'
        + '</div>';
    }).join('');
  }

  function _buildDevices(devices) {
    return _buildDeviceOrBrowser(devices, [
      { key: 'desktop', icon: '🖥', label: 'Desktop' },
      { key: 'mobile',  icon: '📱', label: 'Mobile' },
      { key: 'tablet',  icon: '⬛', label: 'Tablette' }
    ]);
  }

  function _buildBrowsers(browsers) {
    return _buildDeviceOrBrowser(browsers, [
      { key: 'Chrome',  icon: '🌐', label: 'Chrome' },
      { key: 'Firefox', icon: '🦊', label: 'Firefox' },
      { key: 'Safari',  icon: '🧭', label: 'Safari' },
      { key: 'Edge',    icon: '🔷', label: 'Edge' },
      { key: 'Other',   icon: '❓', label: 'Autre' }
    ]);
  }

  /* ---- Events enrichi ---- */
  function _buildEvents(events) {
    if (!events.length) {
      return '<div style="font-size:12px;color:var(--text-muted);line-height:1.5;">'
        + 'Aucun event enregistré.<br>'
        + '<span style="font-size:11px;">Les clics sur vos CTAs apparaîtront ici.</span>'
        + '</div>';
    }
    var ICONS = { cta_click: '🎯', form_submit: '📨', download: '⬇️' };
    var rows = events.map(function (e) {
      var icon = ICONS[e.type] || '📌';
      return '<tr>'
        + '<td style="padding:5px 0;font-size:13px;">' + icon + '</td>'
        + '<td style="padding:5px 4px;font-size:12px;">' + _esc(e.type) + '</td>'
        + '<td style="padding:5px 4px;color:var(--text-secondary);font-size:12px;">' + _esc(e.label || '—') + '</td>'
        + '<td style="text-align:right;padding:5px 0 5px 4px;font-weight:600;font-size:12px;">' + e.count + '</td>'
        + '</tr>';
    }).join('');
    return '<table style="width:100%;border-collapse:collapse;">'
      + '<thead><tr>'
      + '<th style="width:20px;padding:4px 0;"></th>'
      + '<th style="text-align:left;padding:4px;color:var(--text-muted);font-weight:500;font-size:11px;">Type</th>'
      + '<th style="text-align:left;padding:4px;color:var(--text-muted);font-weight:500;font-size:11px;">Label</th>'
      + '<th style="text-align:right;padding:4px 0;color:var(--text-muted);font-weight:500;font-size:11px;">N</th>'
      + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /* ---- Score Visibilité ---- */
  function _buildScoreWidget(data) {
    var pps = data.pagesPerSession || 0;
    var totalViews = data.totalViews || 0;
    var topPages = data.topPages || [];
    var topReferrers = data.topReferrers || [];
    var hasGoogle = topReferrers.some(function (r) {
      return r.referrer && r.referrer.toLowerCase().indexOf('google') !== -1;
    });

    function ind(label, emoji, text, color) {
      var c = color === 'green' ? 'color:var(--color-success,#2dd4a0)'
        : color === 'yellow' ? 'color:var(--color-warning,#f59e0b)'
        : 'color:var(--accent-red)';
      return '<div class="score-indicator">'
        + '<span class="score-label">' + label + '</span>'
        + '<span class="score-value" style="' + c + '">' + emoji + ' ' + text + '</span>'
        + '</div>';
    }

    return (totalViews >= 50 ? ind('TRAFIC', '🟢', 'Bon', 'green')
        : totalViews >= 10  ? ind('TRAFIC', '🟡', 'En croissance', 'yellow')
        :                     ind('TRAFIC', '🔴', 'Démarrage', 'red'))
      + (topPages.length >= 5 ? ind('PAGES', '🟢', 'Site exploré', 'green')
        : topPages.length >= 2 ? ind('PAGES', '🟡', 'Partielle', 'yellow')
        :                        ind('PAGES', '🔴', 'Page unique', 'red'))
      + (hasGoogle             ? ind('SEO', '🟢', 'SEO actif', 'green')
        : topReferrers.length >= 2 ? ind('SEO', '🟡', 'Multi-source', 'yellow')
        :                        ind('SEO', '🔴', 'Direct only', 'red'))
      + (pps >= 2.5 ? ind('ENGAGEMENT', '🟢', 'Fort', 'green')
        : pps >= 1.5 ? ind('ENGAGEMENT', '🟡', 'Moyen', 'yellow')
        :              ind('ENGAGEMENT', '🔴', 'Faible', 'red'));
  }

  /* ---- SEO & Acquisition (nouveau) ---- */
  function _buildSeoWidget(data) {
    var topReferrers = data.topReferrers || [];
    var hasGoogle = topReferrers.some(function (r) {
      return r.referrer && r.referrer.toLowerCase().indexOf('google') !== -1;
    });

    function checkItem(done, text, link, linkLabel) {
      var icon = done ? '✅' : '⏳';
      var content = link
        ? text + ' — <a href="' + link + '" target="_blank" style="color:var(--accent-red-light,#ff6b74);text-decoration:none;">' + _esc(linkLabel) + '</a>'
        : text;
      return '<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;font-size:12px;">'
        + '<span style="flex-shrink:0;">' + icon + '</span>'
        + '<span style="color:var(--text-secondary);line-height:1.4;">' + content + '</span>'
        + '</div>';
    }

    var CONSEILS = [
      'Publiez le lien de votre site sur les réseaux des polices municipales et associations de maires.',
      'Rédigez une page dédiée par type de public (police municipale, gendarmerie, entreprise) pour améliorer votre référencement.',
      'Ajoutez un lien vers dst-system.fr dans votre signature email pour générer du trafic qualifié.',
      'Demandez à vos premiers clients de mentionner DST System sur leurs sites ou réseaux sociaux.',
      'Soumettez votre site à des annuaires spécialisés sécurité ou formation professionnelle.'
    ];
    var conseil = CONSEILS[new Date().getDate() % 5];

    return _ct('Acquisition organique')
      + checkItem(true,      'Site indexable (public)')
      + checkItem(false,     'Google Search Console', 'https://search.google.com/search-console', 'Connecter GSC')
      + checkItem(hasGoogle, 'Trafic organique détecté')
      + checkItem(false,     'Partages réseaux sociaux')

      + _SEP
      + _ct('Prochaines actions')
      + '<a href="https://search.google.com/search-console" target="_blank" class="seo-action high">'
      + '📌 Soumettre le sitemap à Google</a>'
      + '<a href="https://www.linkedin.com/sharing/share-offsite/?url=https://dst-system.fr" target="_blank" class="seo-action medium">'
      + '📧 Partager le lien sur LinkedIn</a>'
      + '<a href="https://trends.google.fr/trends/explore?q=formation+tir+simulation+police" target="_blank" class="seo-action low">'
      + '📊 Analyser les mots-clés cibles</a>'

      + _SEP
      + _ct('Conseil')
      + '<div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:10px 12px;">'
      + '<span style="font-size:13px;margin-right:6px;">💡</span>'
      + '<span style="font-size:12px;font-style:italic;color:var(--text-muted);line-height:1.5;">' + _esc(conseil) + '</span>'
      + '</div>';
  }

  /* ---- Dernières visites compactes ---- */
  function _buildRecentVisits(visits) {
    var limited = (visits || []).slice(0, 8);

    var header = 'Dernières visites';
    if (limited.length > 0) {
      try {
        var diffMin = Math.round((Date.now() - new Date(limited[0].created_at).getTime()) / 60000);
        var ago = diffMin < 1 ? 'à l\'instant'
          : diffMin < 60 ? 'il y a ' + diffMin + 'm'
          : 'il y a ' + Math.floor(diffMin / 60) + 'h';
        header = 'Dernières visites · <span style="font-weight:400;font-style:italic;">Mis à jour ' + ago + '</span>';
      } catch (e) {}
    }

    if (!limited.length) {
      return _ct(header)
        + '<p class="text-muted" style="font-size:12px;">Aucune visite récente pour cette période.</p>';
    }

    var DICONS = { mobile: '📱', desktop: '💻', tablet: '📟' };
    var rows = limited.map(function (v) {
      return '<tr>'
        + '<td style="padding:4px 8px 4px 0;color:var(--text-muted);font-size:12px;white-space:nowrap;">' + _fmtTime(v.created_at) + '</td>'
        + '<td style="padding:4px;font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _esc(v.page) + '</td>'
        + '<td style="padding:4px;text-align:center;">' + (DICONS[v.device] || '💻') + '</td>'
        + '<td style="padding:4px;color:var(--text-secondary);font-size:12px;">' + _esc(v.browser || '—') + '</td>'
        + '<td style="padding:4px 0 4px 4px;color:var(--text-muted);font-size:11px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + _esc(_extractDomain(v.referrer)) + '</td>'
        + '</tr>';
    }).join('');

    return _ct(header)
      + '<div style="overflow-x:auto;">'
      + '<table style="width:100%;border-collapse:collapse;">'
      + '<thead><tr>'
      + '<th style="text-align:left;padding:4px 8px 4px 0;color:var(--text-muted);font-weight:500;font-size:11px;white-space:nowrap;">Heure</th>'
      + '<th style="text-align:left;padding:4px;color:var(--text-muted);font-weight:500;font-size:11px;">Page</th>'
      + '<th style="text-align:center;padding:4px;color:var(--text-muted);font-weight:500;font-size:11px;">Dev.</th>'
      + '<th style="text-align:left;padding:4px;color:var(--text-muted);font-weight:500;font-size:11px;">Nav.</th>'
      + '<th style="text-align:left;padding:4px 0 4px 4px;color:var(--text-muted);font-weight:500;font-size:11px;">Source</th>'
      + '</tr></thead><tbody>' + rows + '</tbody>'
      + '</table></div>';
  }

  return { render: render };

})();
