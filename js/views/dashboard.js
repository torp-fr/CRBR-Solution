/* ============================================================
   DST-SYSTEM — Vue Tableau de Bord (Dashboard)
   Poste de commandement stratégique pour le dirigeant.
   Synthèse économique, alertes, sessions, charge opérateurs.
   ============================================================ */

window.Views = window.Views || {};

Views.Dashboard = {

  /**
   * Rendu complet du tableau de bord exécutif.
   * @param {HTMLElement} container — élément DOM cible
   */
  render(container) {
    'use strict';

    const settings  = DB.settings.get();
    const kpis      = Engine.computeDashboardKPIs();
    const alerts    = Engine.computeAllAlerts();
    const sessions  = DB.sessions.getAll();

    /* Alerte sessions créées depuis un devis mais sans date planifiée */
    const _sessionsSansDate = sessions.filter(s => s.statut === 'planifiee' && s.devisRef && (!s.date || s.date === ''));
    if (_sessionsSansDate.length > 0) {
      alerts.push({
        level:   'warning',
        message: _sessionsSansDate.length + ' session(s) cr\u00e9\u00e9e(s) depuis un devis n\u2019ont pas encore de date planifi\u00e9e.',
        context: 'Planning'
      });
    }
    const now       = new Date();

    /* Devis KPI */
    const _allDevis = DB.devis.getAll();
    const _devisEnvoyes = _allDevis.filter(d => d.statut === 'envoye');
    const _sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const _devisSansReponse = _devisEnvoyes.filter(d => d.dateEnvoi && new Date(d.dateEnvoi) < _sevenDaysAgo).length;
    const _devisAccetesMois = _allDevis.filter(d => {
      if (d.statut !== 'accepte') return false;
      const ref = d.updatedAt || d.createdAt;
      if (!ref) return false;
      const u = new Date(ref);
      return u.getFullYear() === now.getFullYear() && u.getMonth() === now.getMonth();
    }).length;

    /* Prospects KPI */
    const _allProspects = DB.prospects.getAll();
    const _prospectsActifs  = _allProspects.filter(p => p.statut !== 'converti' && p.statut !== 'perdu').length;
    const _prospectsNouveaux = _allProspects.filter(p => p.statut === 'nouveau').length;

    /* Facturation KPI */
    const _allFactures = DB.factures ? DB.factures.getAll() : [];
    let _totalAEncaisser = 0;
    let _totalEnRetard   = 0;
    let _nbEnRetard      = 0;
    _allFactures.forEach(f => {
      if (f.statut === 'soldee' || f.statut === 'annulee') return;
      const ttc     = parseFloat(f.totalTTC) || 0;
      const encaisse = (f.encaissements || []).reduce((s, e) => s + (parseFloat(e.montant) || 0), 0);
      const solde   = Math.round((ttc - encaisse) * 100) / 100;
      if (solde > 0) {
        _totalAEncaisser += solde;
        if (f.dateLimitePaiement && new Date(f.dateLimitePaiement) < now) {
          _totalEnRetard += solde;
          _nbEnRetard++;
        }
      }
    });

    /* Alertes facturation */
    if (_nbEnRetard > 0) {
      alerts.push({
        level:   'critical',
        message: _nbEnRetard + ' facture' + (_nbEnRetard > 1 ? 's' : '') + ' en retard de paiement — solde impayé\u00a0: ' + _totalEnRetard.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0€',
        context: 'Facturation'
      });
    }
    if (_totalAEncaisser > 0 && _nbEnRetard === 0) {
      alerts.push({
        level:   'info',
        message: 'Solde à encaisser\u00a0: ' + _totalAEncaisser.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '\u00a0€ sur ' + _allFactures.filter(f => f.statut === 'emise' || f.statut === 'partiellement_payee').length + ' facture(s) émise(s).',
        context: 'Facturation'
      });
    }

    /* ----------------------------------------------------------
       1. CONSTRUCTION DES CARTES KPI
       ---------------------------------------------------------- */

    /** Détermine la classe CSS de la marge en fonction des seuils */
    function marginClass(avgMargin) {
      if (avgMargin >= settings.targetMarginPercent) return 'kpi-success';
      if (avgMargin >= settings.marginAlertThreshold) return 'kpi-warning';
      return 'kpi-alert';
    }

    /** Détermine la classe CSS du résultat net */
    function netResultClass(val) {
      return val >= 0 ? 'kpi-success' : 'kpi-alert';
    }

    /** Détermine la classe CSS de la charge opérateur */
    function loadClass(maxLoad, threshold) {
      const ratio = threshold > 0 ? maxLoad / threshold : 0;
      if (ratio >= 1)   return 'kpi-alert';
      if (ratio >= 0.7) return 'kpi-warning';
      return '';
    }

    /* CAPACITÉ OPÉRATIONNELLE */
    const _util   = Engine.calculateTauxUtilisation(settings);
    const _invest = Engine.calculateBesoinsInvestissement(settings);
    const _cap    = (settings.capacite || {});

    /* Alertes capacité — ajoutées en tête */
    if (_invest.investissementNecessaire && _util.estEnCritique) {
      alerts.unshift({
        level:   'critical',
        message: '\u26a0 Capacit\u00e9 critique atteinte \u2014 investissement n\u00e9cessaire d\u00e8s maintenant. Projection\u00a0: ' + _invest.projectionAnnuelle + '\u00a0j/an. D\u00e9lai d\u00e9ploiement\u00a0: ' + _invest.delaiDeploiement + '\u00a0jours. Co\u00fbt estim\u00e9\u00a0: ' + _invest.coutInvestissement.toLocaleString('fr-FR') + '\u00a0\u20ac.',
        context: 'Capacit\u00e9'
      });
    } else if (_invest.investissementNecessaire && _util.estEnAlerte) {
      alerts.unshift({
        level:   'warning',
        message: 'Capacit\u00e9 en approche du seuil \u2014 investissement \u00e0 anticiper dans ~' + _invest.moisAvantSaturation + '\u00a0mois. Projection\u00a0: ' + _invest.projectionAnnuelle + '\u00a0j/an. Co\u00fbt nouvelle unit\u00e9\u00a0: ' + _invest.coutInvestissement.toLocaleString('fr-FR') + '\u00a0\u20ac.',
        context: 'Capacit\u00e9'
      });
    }
    /* Alerte rythme mensuel dépassé */
    const _joursMoisMax = (_cap.joursMoisMax || 15) * (_cap.nbUnites || 1);
    const _nbJoursMois = sessions.filter(s => {
      const d = new Date(s.date);
      return d.getFullYear() === now.getFullYear()
        && d.getMonth() === now.getMonth()
        && s.statut !== 'annulee';
    }).reduce((sum, s) => sum + (Number(s.nbJours) || 1), 0);
    if (_nbJoursMois > _joursMoisMax) {
      alerts.push({
        level:   'warning',
        message: 'Rythme mensuel d\u00e9pass\u00e9 ce mois\u00a0: ' + _nbJoursMois + '\u00a0jours planifi\u00e9s sur ' + _joursMoisMax + '\u00a0max.',
        context: 'Planning'
      });
    }

    /* Alertes maintenance simulateur */
    const _simulateurs = DB.simulateurs.getAll();
    const _dans30j = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    _simulateurs.forEach(function(sim) {
      if (sim.etat === 'actif' && sim.prochaineMaintenance) {
        const dateMaint = new Date(sim.prochaineMaintenance);
        if (dateMaint <= _dans30j) {
          alerts.push({
            level:   dateMaint < now ? 'critical' : 'warning',
            context: 'Mat\u00e9riel',
            message: sim.nom + ' \u2014 maintenance ' + (
              dateMaint < now
                ? 'en retard depuis le '
                : 'pr\u00e9vue le '
            ) + dateMaint.toLocaleDateString('fr-FR')
          });
        }
      }
    });

    /* AMÉLIORATION P1 — Seuil plancher auto-calculé */
    const seuilPlancher = Engine.calculateSeuilPlancher(settings);

    /* AMÉLIORATION P5 — Point mort + Trésorerie */
    const pointMort = Engine.calculatePointMort();
    const tresorerie = Engine.calculateTresorerie();

    function tresorerieClass(val) {
      if (val > 10000) return 'kpi-success';
      if (val >= 0) return 'kpi-warning';
      return 'kpi-alert';
    }

    function pointMortClass(pm) {
      if (pm.statut === 'Atteint') return 'kpi-success';
      if (pm.statut === 'Impossible') return 'kpi-alert';
      return '';
    }

    /* ----------------------------------------------------------
       1B. WIDGET PIPELINE PAR SEGMENT (déclaré avant kpiCardsHTML)
       ---------------------------------------------------------- */
    const _allClients  = DB.clients.getAll();
    const _segDefs = [
      { id: 'institutionnel', label: 'Institutionnel', tagCls: 'tag-blue'   },
      { id: 'grand_compte',   label: 'Grand Compte',   tagCls: 'tag-purple' },
      { id: 'b2b',            label: 'B2B',            tagCls: 'tag-green'  },
      { id: 'b2c',            label: 'B2C',            tagCls: 'tag-yellow' }
    ];
    const _segRows = _segDefs.map(sd => {
      const segClients = _allClients.filter(c => (c.segment || 'institutionnel') === sd.id);
      const segCA = segClients.reduce((sum, c) => {
        return sum + sessions
          .filter(s => ((s.clientIds || []).includes(c.id) || s.clientId === c.id) && s.statut === 'terminee')
          .reduce((ss, s) => ss + (s.price || 0), 0);
      }, 0);
      return `<tr>
        <td><span class="tag ${sd.tagCls}" style="font-size:0.72rem;">${sd.label}</span></td>
        <td style="text-align:center;">${segClients.length}</td>
        <td style="text-align:right;" class="text-mono" style="font-size:0.82rem;">${Engine.fmt(segCA)}</td>
      </tr>`;
    }).join('');
    const pipelineHTML = `
      <div class="kpi-card" style="grid-column:span 2;">
        <div class="kpi-label">Pipeline par segment</div>
        <table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:0.82rem;">
          <thead><tr>
            <th style="text-align:left;font-weight:600;padding-bottom:4px;color:var(--text-muted);">Segment</th>
            <th style="text-align:center;font-weight:600;padding-bottom:4px;color:var(--text-muted);">Clients</th>
            <th style="text-align:right;font-weight:600;padding-bottom:4px;color:var(--text-muted);">CA r\u00e9alis\u00e9</th>
          </tr></thead>
          <tbody>${_segRows}</tbody>
        </table>
      </div>
    `;

    const kpiCardsHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Clients actifs</div>
          <div class="kpi-value">${kpis.activeClients}</div>
          <div class="kpi-detail">sur ${kpis.totalClients} au total</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Sessions à venir</div>
          <div class="kpi-value">${kpis.upcomingSessions}</div>
          <div class="kpi-detail">${kpis.totalSessions} sessions au total</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Sessions ce mois</div>
          <div class="kpi-value">${kpis.monthSessions}</div>
          <div class="kpi-detail">${kpis.activeOperators} opérateur(s) mobilisé(s)</div>
        </div>
        <div class="kpi-card ${marginClass(kpis.avgMargin)}">
          <div class="kpi-label">Marge moyenne</div>
          <div class="kpi-value">${Engine.fmtPercent(kpis.avgMargin)}</div>
          <div class="kpi-detail">Cible : ${Engine.fmtPercent(settings.targetMarginPercent)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">CA réalisé</div>
          <div class="kpi-value text-mono">${Engine.fmt(kpis.totalRevenue)}</div>
          <div class="kpi-detail">${kpis.pastSessions} session(s) facturée(s)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">CA prévisionnel</div>
          <div class="kpi-value text-mono">${Engine.fmt(kpis.forecastRevenue)}</div>
          <div class="kpi-detail">${kpis.upcomingSessions} session(s) planifiée(s)</div>
        </div>
        <div class="kpi-card ${netResultClass(kpis.netResult)}">
          <div class="kpi-label">Résultat net</div>
          <div class="kpi-value text-mono">${Engine.fmt(kpis.netResult)}</div>
          <div class="kpi-detail">Coûts totaux : ${Engine.fmt(kpis.totalCosts)}</div>
        </div>
        <div class="kpi-card ${loadClass(kpis.maxOperatorLoad, kpis.operatorLoadThreshold)}">
          <div class="kpi-label">Charge opérateur max</div>
          <div class="kpi-value">${kpis.maxOperatorLoad} <span style="font-size:0.9rem;font-weight:400;">sess/mois</span></div>
          <div class="kpi-detail">Seuil : ${kpis.operatorLoadThreshold} sessions/mois</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Seuil plancher / session <span class="tag tag-blue" style="margin-left:4px;font-size:0.6rem;">Auto</span></div>
          <div class="kpi-value text-mono">${Engine.fmt(seuilPlancher)}</div>
          <div class="kpi-detail">Charges fixes + amort. / ${settings.nbJoursObjectifAnnuel || 50}j + variables</div>
        </div>
        <div class="kpi-card ${pointMortClass(pointMort)}">
          <div class="kpi-label">Point mort annuel</div>
          <div class="kpi-value">${pointMort.realisees} / ${pointMort.nbSessions || '—'}</div>
          <div class="kpi-detail">${pointMort.statut === 'Impossible' ? 'Données insuffisantes' : pointMort.restantes + ' session(s) restante(s) — ' + pointMort.statut}</div>
        </div>
        <div class="kpi-card ${tresorerieClass(tresorerie.tresorerie)}">
          <div class="kpi-label">Trésorerie théorique</div>
          <div class="kpi-value text-mono">${Engine.fmt(tresorerie.tresorerie)}</div>
          <div class="kpi-detail">CA ${Engine.fmt(tresorerie.caRealise)} — Charges ${Engine.fmt(tresorerie.chargesProrata)}</div>
        </div>
        <div class="kpi-card ${_prospectsNouveaux > 0 ? 'kpi-warning' : ''}" style="cursor:pointer;" onclick="App.navigate('prospects')">
          <div class="kpi-label">Prospects actifs <span class="tag tag-blue" style="margin-left:4px;font-size:0.6rem;">CRM</span></div>
          <div class="kpi-value">${_prospectsActifs}</div>
          <div class="kpi-detail">${_prospectsNouveaux > 0 ? _prospectsNouveaux + ' \u00e0 traiter' : 'Aucun nouveau'}</div>
        </div>
        <div class="kpi-card ${_devisSansReponse > 0 ? 'kpi-warning' : ''}" style="cursor:pointer;" onclick="App.navigate('devis')">
          <div class="kpi-label">Devis en attente <span class="tag tag-blue" style="margin-left:4px;font-size:0.6rem;">CRM</span></div>
          <div class="kpi-value">${_devisEnvoyes.length}</div>
          <div class="kpi-detail">${_devisSansReponse > 0 ? _devisSansReponse + ' sans r\u00e9ponse > 7j' : _devisAccetesMois + ' accept\u00e9(s) ce mois'}</div>
        </div>
        <div class="kpi-card ${_totalAEncaisser > 0 ? 'kpi-warning' : ''}" style="cursor:pointer;" onclick="App.navigate('factures')">
          <div class="kpi-label">\u00c0 encaisser <span class="tag tag-blue" style="margin-left:4px;font-size:0.6rem;">Facturation</span></div>
          <div class="kpi-value" style="font-size:1.05rem;">${_totalAEncaisser.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\u00a0\u20ac</div>
          <div class="kpi-detail">${_allFactures.filter(f => f.statut === 'emise' || f.statut === 'partiellement_payee').length} facture(s) \u00e9mise(s)</div>
        </div>
        <div class="kpi-card ${_nbEnRetard > 0 ? 'kpi-alert' : ''}" style="cursor:pointer;" onclick="App.navigate('factures')">
          <div class="kpi-label">En retard <span class="tag tag-blue" style="margin-left:4px;font-size:0.6rem;">Facturation</span></div>
          <div class="kpi-value" style="font-size:1.05rem;${_nbEnRetard > 0 ? 'color:#d32f2f;' : ''}">${_totalEnRetard.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\u00a0\u20ac</div>
          <div class="kpi-detail">${_nbEnRetard > 0 ? _nbEnRetard + ' facture(s) \u00e9ch\u00e9es' : 'Aucun retard'}</div>
        </div>
        <div class="kpi-card ${_util.tauxUtilisation >= 93 ? 'kpi-alert' : _util.tauxUtilisation >= 80 ? 'kpi-warning' : 'kpi-success'}" style="cursor:pointer;" onclick="App.navigate('settings')">
          <div class="kpi-label">Taux d'utilisation <span class="tag tag-blue" style="margin-left:4px;font-size:0.6rem;">Capacit\u00e9</span></div>
          <div class="kpi-value">${Engine.fmtPercent(_util.tauxUtilisation)}</div>
          <div class="kpi-detail">${_util.joursFacturesAn}\u00a0j / ${_util.capaciteTotale}\u00a0j max</div>
        </div>
        <div class="kpi-card ${_util.joursRestants <= 10 ? 'kpi-alert' : _util.joursRestants <= 30 ? 'kpi-warning' : ''}" style="cursor:pointer;" onclick="App.navigate('settings')">
          <div class="kpi-label">Capacit\u00e9 restante <span class="tag tag-blue" style="margin-left:4px;font-size:0.6rem;">Capacit\u00e9</span></div>
          <div class="kpi-value">${_util.joursRestants}\u00a0<span style="font-size:0.9rem;font-weight:400;">jours</span></div>
          <div class="kpi-detail">disponibles cette ann\u00e9e</div>
        </div>
        ${pipelineHTML}
      </div>
    `;

    /* ----------------------------------------------------------
       1C. SECTION RENTABILITÉ GLOBALE
       ---------------------------------------------------------- */

    function profitabilityStatus(profitPercent) {
      if (profitPercent >= settings.targetMarginPercent) return { status: '✓ Très rentable', cls: 'kpi-success' };
      if (profitPercent >= settings.marginAlertThreshold) return { status: '⚠ Acceptable', cls: 'kpi-warning' };
      if (profitPercent >= 0) return { status: '⚠ À surveiller', cls: 'kpi-warning' };
      return { status: '✗ Déficitaire', cls: 'kpi-alert' };
    }

    /* Calcul rentabilité À DATE */
    const rentabiliteADate = kpis.totalRevenue > 0
      ? round2((kpis.netResult / kpis.totalRevenue) * 100)
      : 0;
    const statusADate = profitabilityStatus(rentabiliteADate);

    /* Calcul rentabilité PRÉVISIONNELLE */
    const revenuePrevisionnelle = kpis.totalRevenue + kpis.forecastRevenue;
    const forecastTotalCosts = kpis.totalCosts + (kpis.forecastRevenue * (kpis.totalCosts / Math.max(kpis.totalRevenue, 1)));
    const netResultForecast = revenuePrevisionnelle - forecastTotalCosts;
    const rentabilitePrevisionnel = revenuePrevisionnelle > 0
      ? round2((netResultForecast / revenuePrevisionnelle) * 100)
      : 0;
    const statusPrevisionnel = profitabilityStatus(rentabilitePrevisionnel);

    function round2(n) {
      return Math.round(n * 100) / 100;
    }

    const rentabilityHTML = `
      <div class="card">
        <div class="card-header"><h2>📊 Rentabilité globale</h2></div>
        <div class="kpi-grid">
          <div class="kpi-card ${statusADate.cls}">
            <div class="kpi-label">Rentabilité à date</div>
            <div class="kpi-value">${Engine.fmtPercent(rentabiliteADate)}</div>
            <div class="kpi-detail">${statusADate.status}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">
              CA: ${Engine.fmt(kpis.totalRevenue)} | Coûts: ${Engine.fmt(kpis.totalCosts)}
            </div>
          </div>
          <div class="kpi-card ${statusPrevisionnel.cls}">
            <div class="kpi-label">Rentabilité prévisionnelle</div>
            <div class="kpi-value">${Engine.fmtPercent(rentabilitePrevisionnel)}</div>
            <div class="kpi-detail">${statusPrevisionnel.status}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">
              CA prévu: ${Engine.fmt(revenuePrevisionnelle)} | Coûts est.: ${Engine.fmt(round2(forecastTotalCosts))}
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Break-even</div>
            <div class="kpi-value">${Engine.fmtPercent(Math.max(0, 100 - rentabiliteADate))}</div>
            <div class="kpi-detail">Marge de sécurité</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">
              ${rentabiliteADate >= 100 ? 'Bien au-dessus du seuil' : (100 - rentabiliteADate) + '% de réduction possible'}
            </div>
          </div>
        </div>
      </div>
    `;

    function buildAlertsHTML() {
      if (alerts.length === 0) {
        return `
          <div class="card">
            <div class="card-header"><h2>Alertes intelligentes</h2></div>
            <div class="alert alert-success">
              <span class="alert-icon">&#10003;</span>
              <span>Aucune alerte — tous les indicateurs sont nominaux.</span>
            </div>
          </div>
        `;
      }

      /* Regrouper les alertes par contexte */
      const grouped = {};
      alerts.forEach(a => {
        const ctx = a.context || 'Général';
        if (!grouped[ctx]) grouped[ctx] = [];
        grouped[ctx].push(a);
      });

      /** Icône et classe selon le niveau d'alerte */
      function alertStyle(level) {
        switch (level) {
          case 'critical': return { cls: 'alert-danger',  icon: '\u26A0' };  // ⚠
          case 'warning':  return { cls: 'alert-warning', icon: '\u26A1' };  // ⚡
          case 'info':     return { cls: 'alert-info',    icon: '\u2139' };  // ℹ
          default:         return { cls: 'alert-info',    icon: '\u2139' };
        }
      }

      let alertsInner = '';
      Object.keys(grouped).forEach(ctx => {
        alertsInner += `<div class="mb-8" style="font-size:0.78rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;">${escapeHTML(ctx)}</div>`;
        grouped[ctx].forEach(a => {
          const style = alertStyle(a.level);
          alertsInner += `
            <div class="alert ${style.cls}">
              <span class="alert-icon">${style.icon}</span>
              <span>${escapeHTML(a.message)}</span>
            </div>
          `;
        });
      });

      return `
        <div class="card">
          <div class="card-header">
            <h2>Alertes intelligentes</h2>
            <span class="tag tag-red">${alerts.length} alerte${alerts.length > 1 ? 's' : ''}</span>
          </div>
          ${alertsInner}
        </div>
      `;
    }

    /* ----------------------------------------------------------
       3. TABLEAU DES PROCHAINES SESSIONS
       ---------------------------------------------------------- */

    function buildUpcomingSessionsHTML() {
      /* Filtrer les sessions futures, trier par date, limiter à 10 */
      const upcoming = sessions
        .filter(s => new Date(s.date) >= now && s.statut !== 'annulee')
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 10);

      if (upcoming.length === 0) {
        return `
          <div class="card">
            <div class="card-header"><h2>Prochaines sessions</h2></div>
            <div class="empty-state">
              <div class="empty-icon">&#128197;</div>
              <p>Aucune session à venir.</p>
            </div>
          </div>
        `;
      }

      /** Classe CSS pour le tag de statut */
      function statusTagClass(status) {
        switch (status) {
          case 'confirmee': return 'tag-green';
          case 'planifiee': return 'tag-blue';
          case 'en_cours':  return 'tag-yellow';
          case 'terminee':  return 'tag-neutral';
          case 'annulee':   return 'tag-red';
          default:          return 'tag-neutral';
        }
      }

      /** Formater la date en français court */
      function fmtDate(isoDate) {
        const d = new Date(isoDate);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }

      /** Récupérer les noms des clients liés à une session */
      function getClientNames(session) {
        const ids = session.clientIds || (session.clientId ? [session.clientId] : []);
        if (ids.length === 0) return '<span class="text-muted">—</span>';
        return ids.map(id => {
          const client = DB.clients.getById(id);
          return client ? escapeHTML(client.name || client.label || client.company || id) : escapeHTML(id);
        }).join(', ');
      }

      /** Récupérer le nom du lieu */
      function getLocationName(session) {
        if (!session.locationId) return '<span class="text-muted">—</span>';
        const loc = DB.locations.getById(session.locationId);
        return loc ? escapeHTML(loc.name || loc.label || session.locationId) : escapeHTML(session.locationId);
      }

      let rowsHTML = '';
      upcoming.forEach(sess => {
        const cost = Engine.computeSessionCost(sess);
        const marginDisplay = sess.price > 0
          ? `<span class="${cost.marginPercent < settings.marginAlertThreshold ? 'text-red' : cost.marginPercent < settings.targetMarginPercent ? 'text-yellow' : 'text-green'} font-bold">${Engine.fmtPercent(cost.marginPercent)}</span>`
          : '<span class="text-muted">—</span>';

        rowsHTML += `
          <tr>
            <td class="text-mono">${fmtDate(sess.date)}</td>
            <td>${escapeHTML(sess.label || sess.name || '—')}</td>
            <td>${getClientNames(sess)}</td>
            <td>${getLocationName(sess)}</td>
            <td><span class="tag ${statusTagClass(sess.statut)}">${Engine.sessionStatusLabel(sess.statut)}</span></td>
            <td class="num">${marginDisplay}</td>
          </tr>
        `;
      });

      return `
        <div class="card">
          <div class="card-header">
            <h2>Prochaines sessions</h2>
            <span class="text-muted" style="font-size:0.82rem;">${upcoming.length} session${upcoming.length > 1 ? 's' : ''} affichée${upcoming.length > 1 ? 's' : ''}</span>
          </div>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Libellé</th>
                  <th>Client(s)</th>
                  <th>Lieu</th>
                  <th>Statut</th>
                  <th class="text-right">Marge %</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHTML}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    /* ----------------------------------------------------------
       4. SYNTHÈSE ÉCONOMIQUE
       ---------------------------------------------------------- */

    function buildEconomicSummaryHTML() {
      /* Calcul des coûts fixes annuels totaux */
      const totalFixedAnnual = settings.fixedCosts.reduce((sum, c) => sum + (c.amount || 0), 0);

      /* Calcul des amortissements annuels totaux */
      const totalAmortAnnual = settings.equipmentAmortization.reduce((sum, a) => {
        const years = Math.max(a.durationYears || 1, 1);
        return sum + ((a.amount || 0) / years);
      }, 0);

      /* Quote-part par session */
      const estSessions = Math.max(settings.estimatedAnnualSessions, 1);
      const fixedPerSession = totalFixedAnnual / estSessions;
      const amortPerSession = totalAmortAnnual / estSessions;
      const costPerSession  = Engine.round2(fixedPerSession + amortPerSession);

      /* Comparaison visuelle marge cible vs marge réelle */
      const targetMargin = settings.targetMarginPercent;
      const actualMargin = kpis.avgMargin;
      const maxMarginScale = Math.max(targetMargin, actualMargin, 1);

      const targetBarWidth = Math.min((targetMargin / maxMarginScale) * 100, 100);
      const actualBarWidth = Math.min((actualMargin / maxMarginScale) * 100, 100);
      const actualBarColor = actualMargin >= targetMargin ? 'fill-green' : actualMargin >= settings.marginAlertThreshold ? 'fill-yellow' : 'fill-red';

      return `
        <div class="card">
          <div class="card-header"><h2>Synthèse économique</h2></div>

          <div class="grid-2 mb-16">
            <div>
              <div style="font-size:0.78rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Charges fixes / an</div>
              <div class="text-mono font-bold" style="font-size:1.2rem;">${Engine.fmt(totalFixedAnnual)}</div>
            </div>
            <div>
              <div style="font-size:0.78rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Amortissements / an</div>
              <div class="text-mono font-bold" style="font-size:1.2rem;">${Engine.fmt(Engine.round2(totalAmortAnnual))}</div>
            </div>
          </div>

          <div class="mb-16">
            <div style="font-size:0.78rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Coût fixe par session (quote-part)</div>
            <div class="text-mono font-bold" style="font-size:1.2rem;">${Engine.fmt(costPerSession)}</div>
            <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:2px;">
              Basé sur ${estSessions} sessions estimées/an (fixes : ${Engine.fmt(Engine.round2(fixedPerSession))} + amort. : ${Engine.fmt(Engine.round2(amortPerSession))})
            </div>
          </div>

          <div>
            <div style="font-size:0.78rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Marge cible vs marge réelle</div>

            <div class="flex-between mb-8">
              <span style="font-size:0.82rem;">Cible</span>
              <span class="text-mono font-bold">${Engine.fmtPercent(targetMargin)}</span>
            </div>
            <div class="progress-bar mb-16" style="height:10px;">
              <div class="progress-fill fill-blue" style="width:${targetBarWidth}%;"></div>
            </div>

            <div class="flex-between mb-8">
              <span style="font-size:0.82rem;">Réelle</span>
              <span class="text-mono font-bold ${actualMargin >= targetMargin ? 'text-green' : actualMargin >= settings.marginAlertThreshold ? 'text-yellow' : 'text-red'}">${Engine.fmtPercent(actualMargin)}</span>
            </div>
            <div class="progress-bar" style="height:10px;">
              <div class="progress-fill ${actualBarColor}" style="width:${actualBarWidth}%;"></div>
            </div>

            ${actualMargin < targetMargin
              ? `<div style="font-size:0.78rem;color:var(--color-warning);margin-top:8px;">Écart : ${Engine.fmtPercent(Engine.round2(targetMargin - actualMargin))} sous la cible</div>`
              : `<div style="font-size:0.78rem;color:var(--color-success);margin-top:8px;">Marge supérieure à la cible de ${Engine.fmtPercent(Engine.round2(actualMargin - targetMargin))}</div>`
            }
          </div>
        </div>
      `;
    }

    /* ----------------------------------------------------------
       5. CHARGE OPÉRATEURS
       ---------------------------------------------------------- */

    function buildOperatorLoadHTML() {
      const allOperators = DB.operators.getAll();
      const threshold    = settings.operatorOverloadThreshold;
      const currentMonth = now.getMonth();
      const currentYear  = now.getFullYear();
      const todayDate    = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      /* Compter les sessions par opérateur ce mois-ci + CA total toutes sessions terminées */
      const opSessionCount = {};
      const opCaTotal      = {};
      const opPrices       = {};  // array of prices for moyenne

      sessions.forEach(sess => {
        if (sess.statut === 'annulee') return;
        const d = new Date(sess.date);
        (sess.operatorIds || []).forEach(opId => {
          // Charge ce mois
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            opSessionCount[opId] = (opSessionCount[opId] || 0) + 1;
          }
          // CA sessions terminées
          if (sess.statut === 'terminee' && sess.price) {
            opCaTotal[opId] = (opCaTotal[opId] || 0) + (sess.price || 0);
            if (!opPrices[opId]) opPrices[opId] = [];
            opPrices[opId].push(sess.price);
          }
        });
      });

      /* Badge disponibilité */
      function dispoBadge(op) {
        const indispos = op.periodeIndispo || [];
        const estIndispo = indispos.some(function(p) {
          if (!p.debut || !p.fin) return false;
          return todayDate >= new Date(p.debut) && todayDate <= new Date(p.fin);
        });
        if (estIndispo) return '<span class="tag tag-red" style="font-size:0.65rem;">Indispo</span>';
        const dt = op.disponibiliteType || 'ponctuelle';
        if (dt === 'temps_plein') return '<span class="tag tag-green" style="font-size:0.65rem;">T. plein</span>';
        if (dt === 'reguliere')   return '<span class="tag tag-blue"  style="font-size:0.65rem;">' + (op.joursDispoParMois || 0) + '\u00a0j/mois</span>';
        return '<span class="tag tag-neutral" style="font-size:0.65rem;">Ponctuel</span>';
      }

      /* Trier par charge décroissante (mois en cours), top 5 */
      const ranked = Object.entries(opSessionCount)
        .map(([opId, count]) => {
          const op = DB.operators.getById(opId);
          return {
            id: opId,
            op: op,
            name: op ? (op.firstName || '') + ' ' + (op.lastName || '') : opId,
            zone: op ? (op.zoneLabel || op.villeBase || '—') : '—',
            count,
            ca: opCaTotal[opId] || 0,
            nbTerminees: (opPrices[opId] || []).length
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      /* Top 5 par CA (toutes sessions terminées, tous opérateurs actifs) */
      const topCa = allOperators
        .filter(op => op.active !== false && opCaTotal[op.id])
        .map(op => ({
          op,
          name: ((op.firstName || '') + ' ' + (op.lastName || '')).trim(),
          zone: op.zoneLabel || op.villeBase || '—',
          nbSess: (opPrices[op.id] || []).length,
          ca: opCaTotal[op.id] || 0
        }))
        .sort((a, b) => b.ca - a.ca)
        .slice(0, 5);

      if (ranked.length === 0 && topCa.length === 0) {
        return `
          <div class="card">
            <div class="card-header"><h2>Charge opérateurs — ce mois</h2></div>
            <div class="empty-state">
              <div class="empty-icon">&#128100;</div>
              <p>Aucun opérateur planifié ce mois-ci.</p>
            </div>
          </div>
        `;
      }

      /** Couleur de la barre selon le ratio charge/seuil */
      function barColor(count) {
        if (threshold <= 0) return 'fill-green';
        const ratio = count / threshold;
        if (ratio >= 1)   return 'fill-red';
        if (ratio >= 0.7) return 'fill-yellow';
        return 'fill-green';
      }

      let barsHTML = '';
      ranked.forEach(op => {
        const percent = threshold > 0 ? Math.min((op.count / threshold) * 100, 100) : 100;
        const colorClass = barColor(op.count);

        barsHTML += `
          <div class="mb-16">
            <div class="flex-between mb-8">
              <span style="font-size:0.88rem;">${escapeHTML(op.name.trim())}</span>
              <span class="text-mono font-bold">${op.count} / ${threshold}</span>
            </div>
            <div class="progress-bar" style="height:10px;">
              <div class="progress-fill ${colorClass}" style="width:${percent}%;"></div>
            </div>
          </div>
        `;
      });

      /* Tableau Top opérateurs par CA */
      let topCaRows = '';
      topCa.forEach(function(item) {
        topCaRows += '<tr>' +
          '<td style="padding:5px 8px;">' + escapeHTML(item.name) + '</td>' +
          '<td style="padding:5px 8px;font-size:0.78rem;color:var(--text-secondary);">' + escapeHTML(item.zone) + '</td>' +
          '<td style="padding:5px 8px;text-align:right;">' + item.nbSess + '</td>' +
          '<td style="padding:5px 8px;text-align:right;font-family:var(--font-mono);font-weight:600;">' + Engine.fmt(item.ca) + '</td>' +
          '<td style="padding:5px 8px;text-align:center;">' + (item.op ? dispoBadge(item.op) : '—') + '</td>' +
          '</tr>';
      });

      const topCaHTML = topCa.length > 0 ? `
        <div style="margin-top:20px;">
          <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Top opérateurs — CA généré (sessions terminées)</div>
          <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-color);">
                <th style="text-align:left;padding:4px 8px;font-size:0.75rem;color:var(--text-muted);">Nom</th>
                <th style="text-align:left;padding:4px 8px;font-size:0.75rem;color:var(--text-muted);">Zone</th>
                <th style="text-align:right;padding:4px 8px;font-size:0.75rem;color:var(--text-muted);">Sessions</th>
                <th style="text-align:right;padding:4px 8px;font-size:0.75rem;color:var(--text-muted);">CA généré</th>
                <th style="text-align:center;padding:4px 8px;font-size:0.75rem;color:var(--text-muted);">Dispo</th>
              </tr>
            </thead>
            <tbody>${topCaRows}</tbody>
          </table>
        </div>
      ` : '';

      return `
        <div class="card">
          <div class="card-header">
            <h2>Charge opérateurs — ce mois</h2>
            <span class="text-muted" style="font-size:0.82rem;">Top 5 — seuil : ${threshold} sess/mois</span>
          </div>
          ${barsHTML || '<p class="text-muted" style="font-size:0.82rem;">Aucune session ce mois-ci.</p>'}
          ${topCaHTML}
        </div>
      `;
    }

    /* ----------------------------------------------------------
       5B-BIS. WIDGET CAPACITÉ OPÉRATIONNELLE
       ---------------------------------------------------------- */

    function buildCapaciteHTML() {
      const util   = _util;
      const invest = _invest;
      const cap    = _cap;
      const taux   = util.tauxUtilisation;

      /* Couleur de la barre selon le taux */
      const barColor = taux >= 93 ? '#d32f2f' : taux >= 80 ? '#e65100' : '#2e7d32';

      /* Largeur des segments de couleur — 3 zones empilées */
      const pctVert    = Math.min(taux, 80);
      const pctOrange  = taux > 80 ? Math.min(taux - 80, 13) : 0;
      const pctRouge   = taux > 93 ? Math.min(taux - 93, 7) : 0;

      /* Rythme mensuel actuel */
      const nowW = new Date();
      const rythmeMoisActuel = sessions.filter(s => {
        if (!s.date) return false;
        const d = new Date(s.date);
        return d.getFullYear() === nowW.getFullYear()
          && d.getMonth() === nowW.getMonth()
          && s.statut !== 'annulee';
      }).reduce((sum, s) => sum + (Number(s.nbJours) || 1), 0);

      const investBox = invest.investissementNecessaire ? `
        <div style="margin-top:16px;padding:12px 14px;border-radius:6px;border:1px solid ${util.estEnCritique ? '#d32f2f' : '#e65100'};background:${util.estEnCritique ? 'rgba(211,47,47,0.08)' : 'rgba(230,81,0,0.08)'};">
          <div style="font-weight:700;font-size:0.88rem;color:${util.estEnCritique ? '#d32f2f' : '#e65100'};margin-bottom:6px;">${util.estEnCritique ? '\u26a0 Nouvelle unit\u00e9 recommand\u00e9e — Urgent' : '\u26a1 Nouvelle unit\u00e9 \u00e0 anticiper'}</div>
          <div style="font-size:0.82rem;color:var(--text-muted);line-height:1.6;">
            Co\u00fbt estim\u00e9\u00a0: <strong>${invest.coutInvestissement.toLocaleString('fr-FR')}\u00a0\u20ac</strong><br>
            D\u00e9lai de d\u00e9ploiement\u00a0: <strong>${invest.delaiDeploiement}\u00a0jours</strong><br>
            Projection annuelle\u00a0: <strong>${invest.projectionAnnuelle}\u00a0j/an</strong>
          </div>
          <a href="#settings" onclick="App.navigate('settings')" style="display:inline-block;margin-top:8px;font-size:0.78rem;color:var(--accent-blue);">\u2192 Voir les param\u00e8tres capacit\u00e9</a>
        </div>
      ` : '';

      return `
        <div class="card">
          <div class="card-header">
            <h2>Capacit\u00e9 op\u00e9rationnelle</h2>
            <span class="tag ${taux >= 93 ? 'tag-red' : taux >= 80 ? 'tag-yellow' : 'tag-green'}" style="font-size:0.72rem;">${Engine.fmtPercent(taux)} utilis\u00e9</span>
          </div>

          <!-- Barre de progression tricolore -->
          <div style="margin-bottom:8px;position:relative;">
            <div style="height:16px;background:var(--bg-input);border-radius:8px;overflow:hidden;display:flex;">
              <div style="width:${pctVert}%;background:#2e7d32;transition:width 0.3s;"></div>
              <div style="width:${pctOrange}%;background:#e65100;transition:width 0.3s;"></div>
              <div style="width:${pctRouge}%;background:#d32f2f;transition:width 0.3s;"></div>
            </div>
            <!-- Marqueurs -->
            <div style="position:relative;height:16px;margin-top:2px;font-size:0.66rem;color:var(--text-muted);">
              <span style="position:absolute;left:80%;transform:translateX(-50%);">\u25b2 Alerte</span>
              <span style="position:absolute;left:93%;transform:translateX(-50%);">\u25b2 Critique</span>
            </div>
          </div>

          <!-- Tableau synthèse -->
          <table style="width:100%;border-collapse:collapse;font-size:0.84rem;margin-top:12px;">
            <tbody>
              <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 4px;color:var(--text-muted);">Jours r\u00e9alis\u00e9s (ann\u00e9e)</td>
                <td style="padding:6px 4px;text-align:right;font-weight:600;">${util.joursFacturesAn} / ${util.capaciteTotale}</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 4px;color:var(--text-muted);">Projection annuelle</td>
                <td style="padding:6px 4px;text-align:right;font-weight:600;">${invest.projectionAnnuelle}\u00a0j/an</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 4px;color:var(--text-muted);">Jours restants</td>
                <td style="padding:6px 4px;text-align:right;font-weight:600;color:${util.joursRestants <= 10 ? '#d32f2f' : 'inherit'};">${util.joursRestants}\u00a0j</td>
              </tr>
              <tr>
                <td style="padding:6px 4px;color:var(--text-muted);">Rythme actuel (ce mois)</td>
                <td style="padding:6px 4px;text-align:right;font-weight:600;">${rythmeMoisActuel}\u00a0j/mois</td>
              </tr>
            </tbody>
          </table>

          ${investBox}
          ${_buildRegionsSubTable(util)}
        </div>
      `;
    }

    /* ----------------------------------------------------------
       5B-TER. SOUS-TABLEAU PAR RÉGION
       ---------------------------------------------------------- */
    function _buildRegionsSubTable(util) {
      const regions = DB.regions.getAll();
      if (regions.length < 2) {
        // Phase 1 : une seule zone nationale — lien vers la config régions
        const allNationale = regions.every(r => !r.statut || r.statut === 'nationale');
        if (allNationale) {
          return `
            <div style="margin-top:14px;padding:10px 12px;border-radius:5px;background:rgba(255,255,255,0.03);border:1px dashed var(--border-color);font-size:0.78rem;color:var(--text-muted);">
              Phase 1 — Déploiement national centralisé. Pour activer le suivi multi-régions, configurez vos zones dans
              <a href="#regions" onclick="App.navigate('regions')" style="color:var(--accent-blue);">Régions</a>.
            </div>`;
        }
        return '';
      }

      const rows = (util.parRegion || []).map(r => {
        const pct       = r.capacite > 0 ? r.tauxUtilisation : null;
        const pctClass  = pct === null ? '' : pct >= 93 ? 'color:#d32f2f' : pct >= 80 ? 'color:#e65100' : 'color:#4caf50';
        const statutBadge = r.regionStatut === 'renforcee' ? 'tag-green'
                          : r.regionStatut === 'attribuee' ? 'tag-yellow'
                          : 'tag-blue';
        return `
          <tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:5px 4px;"><a href="#regions" onclick="App.navigate('regions')" style="color:var(--text-primary);text-decoration:none;">${escapeHTML(r.regionNom)}</a></td>
            <td style="padding:5px 4px;"><span class="tag ${statutBadge}" style="font-size:0.65rem;">${escapeHTML(r.regionCode)}</span></td>
            <td style="padding:5px 4px;text-align:right;">${r.joursFactures} j</td>
            <td style="padding:5px 4px;text-align:right;">${r.capacite > 0 ? r.capacite + ' j' : '—'}</td>
            <td style="padding:5px 4px;text-align:right;font-weight:600;${pctClass}">${pct !== null ? pct + '%' : '—'}</td>
          </tr>`;
      }).join('');

      return `
        <div style="margin-top:16px;">
          <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Par région</div>
          <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
            <thead>
              <tr style="border-bottom:1px solid var(--border-color);">
                <th style="text-align:left;padding:4px;font-size:0.72rem;color:var(--text-muted);">Région</th>
                <th style="text-align:left;padding:4px;font-size:0.72rem;color:var(--text-muted);">Phase</th>
                <th style="text-align:right;padding:4px;font-size:0.72rem;color:var(--text-muted);">Réalisés</th>
                <th style="text-align:right;padding:4px;font-size:0.72rem;color:var(--text-muted);">Capacité</th>
                <th style="text-align:right;padding:4px;font-size:0.72rem;color:var(--text-muted);">Taux</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }

    /* ----------------------------------------------------------
       5B. TABLEAU ABONNEMENTS CLIENTS
       ---------------------------------------------------------- */

    function buildClientSubscriptionsHTML() {
      const subscriptions = DB.clientSubscriptions.getAll();
      if (subscriptions.length === 0) {
        return `
          <div class="card">
            <div class="card-header"><h2>Suivi des abonnements personnalisés</h2></div>
            <div class="empty-state">
              <div class="empty-icon">📋</div>
              <p>Aucun abonnement client personnalisé pour le moment.</p>
            </div>
          </div>
        `;
      }

      let rows = subscriptions.map(sub => {
        const client = DB.clients.getById(sub.clientId);
        const offer = DB.offers.getById(sub.offerId);
        const clientName = client ? (client.name || '(sans nom)') : '(client supprimé)';
        const offerName = offer ? (offer.label || '(sans nom)') : '(offre supprimée)';
        const rhythms = { 'mensuel': 'Mensuel', 'bimensuel': 'Bimensuel', 'hebdomadaire': 'Hebdo.', 'trimestriel': 'Trim.' };
        const rhythm = rhythms[sub.rythme] || sub.rythme || '—';

        return `
          <tr>
            <td><strong>${escapeHTML(clientName)}</strong></td>
            <td>${escapeHTML(offerName)}</td>
            <td class="num">${sub.participants || 1}</td>
            <td><small>${rhythm}</small></td>
            <td class="num">${Engine.fmt(sub.prixPersonnalise || 0)}</td>
            <td class="num">${sub.volumeJours || '—'}</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="card">
          <div class="card-header">
            <h2>Suivi des abonnements personnalisés</h2>
            <span class="text-muted" style="font-size:0.82rem;">${subscriptions.length} abonnement(s)</span>
          </div>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Offre</th>
                  <th>Participants</th>
                  <th>Rythme</th>
                  <th class="text-right">Prix HT/an</th>
                  <th class="text-right">Sessions/an</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    /* ----------------------------------------------------------
       6. UTILITAIRE — Échappement HTML
       ---------------------------------------------------------- */

    function escapeHTML(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    /* ----------------------------------------------------------
       7. ASSEMBLAGE FINAL
       ---------------------------------------------------------- */

    const today = now.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    /* ----------------------------------------------------------
       8. ACTIONS RAPIDES — Raccourcis de navigation
       ---------------------------------------------------------- */

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <span class="text-muted" style="font-size:0.82rem;">${escapeHTML(today)} — Poste de commandement stratégique</span>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="if(window.DST_Wizard) DST_Wizard(); else alert('Wizard non disponible');">
            ＋ Parcours guidé — Nouveau client
          </button>
        </div>
      </div>

      <!-- Indicateurs clés -->
      ${kpiCardsHTML}

      <!-- Rentabilité globale -->
      ${rentabilityHTML}

      <!-- Alertes intelligentes -->
      ${buildAlertsHTML()}

      <!-- Tableau suivi abonnements clients -->
      ${buildClientSubscriptionsHTML()}

      <!-- Prochaines sessions + Synthèse économique -->
      <div class="grid-2">
        <div>
          ${buildUpcomingSessionsHTML()}
        </div>
        <div>
          ${buildCapaciteHTML()}
          ${buildEconomicSummaryHTML()}
          ${buildOperatorLoadHTML()}
        </div>
      </div>
    `;

  }
};
