/* ============================================================
   DST-SYSTEM — Vue Paramètres
   Gestion complète des paramètres économiques, RH, types
   extensibles, et import/export des données.
   ============================================================ */

window.Views = window.Views || {};

Views.Settings = {

  render(container) {
    'use strict';

    const settings = DB.settings.get();

    /* ----------------------------------------------------------
       État local mutable — copie de travail des paramètres
       ---------------------------------------------------------- */
    const state = {
      clientTypes:     [...(settings.clientTypes || [])],
      operatorStatuses: [...(settings.operatorStatuses || [])],
      offerTypes:      [...(settings.offerTypes || [])],
      employerChargeRate:       settings.employerChargeRate ?? 45,
      interimCoefficient:       settings.interimCoefficient ?? 2.0,
      freelanceChargeRate:      settings.freelanceChargeRate ?? 25,
      estimatedOperatorsPerSession: settings.estimatedOperatorsPerSession ?? 1,
      operatorOverloadThreshold: settings.operatorOverloadThreshold ?? 15,
      cdiThreshold:             settings.cdiThreshold ?? 80,
      targetMarginPercent:      settings.targetMarginPercent ?? 30,
      marginAlertThreshold:     settings.marginAlertThreshold ?? 15,
      vatRate:                  settings.vatRate ?? 20,
      hoursPerDay:              settings.hoursPerDay ?? 7,
      estimatedAnnualSessions:  settings.estimatedAnnualSessions ?? 100,
      nbJoursObjectifAnnuel:    settings.nbJoursObjectifAnnuel ?? 50,
      floorPriceMargin:         settings.floorPriceMargin ?? 5,
      operatorDependencyRiskThreshold: settings.operatorDependencyRiskThreshold ?? 40,
      urssafRequalificationDays: settings.urssafRequalificationDays ?? 45,
      chargesConfig:            JSON.parse(JSON.stringify(settings.chargesConfig || DB.settings.getDefaults().chargesConfig)),
      pricingCatalog: (() => {
        const _stored  = settings.pricingCatalog || {};
        const _default = DB.settings.getDefaults().pricingCatalog;
        const _base    = Array.isArray(_stored.paliers) ? _stored : _default;
        // Fusionner les nouveaux segments (GC/B2B/B2C) depuis les défauts si absents
        const _merged  = Object.assign({}, _base);
        if (!Array.isArray(_merged.paliersGrandCompte)) _merged.paliersGrandCompte = _default.paliersGrandCompte;
        if (!_merged.b2b) _merged.b2b = Object.assign({}, _default.b2b);
        if (!_merged.b2c) _merged.b2c = Object.assign({}, _default.b2c);
        return JSON.parse(JSON.stringify(_merged));
      })(),
      coutJournee: JSON.parse(JSON.stringify(
        settings.coutJournee || DB.settings.getDefaults().coutJournee || {}
      )),
      capacite: JSON.parse(JSON.stringify(
        settings.capacite || DB.settings.getDefaults().capacite || {}
      )),
      entreprise: JSON.parse(JSON.stringify(
        settings.entreprise || DB.settings.getDefaults().entreprise || {}
      )),
      paiement: JSON.parse(JSON.stringify(
        settings.paiement || DB.settings.getDefaults().paiement || {}
      )),
      rh: JSON.parse(JSON.stringify(
        settings.rh || DB.settings.getDefaults().rh || {}
      ))
    };

    /* ----------------------------------------------------------
       Génération du HTML
       ---------------------------------------------------------- */

    /** Section Identité & Documents */
    function renderEntreprise() {
      const e = state.entreprise || {};

      function logoZone(opts) {
        const hasImg = !!opts.base64;
        const imgHtml = hasImg
          ? `<img src="${escapeAttr(opts.base64)}" style="${opts.imgStyle}">`
          : opts.defaultSrc
            ? `<img src="${opts.defaultSrc}" style="${opts.imgStyle}" onerror="this.outerHTML='<span style=\\'color:var(--text-muted);font-size:0.82rem;\\'>Aucun logo</span>'">`
            : `<span style="color:var(--text-muted);font-size:0.82rem;">Aucun logo</span>`;
        return `
          <div style="margin-bottom:20px;">
            <div style="font-weight:600;font-size:0.86rem;margin-bottom:8px;color:var(--text-heading);">${opts.label}</div>
            <div class="logo-upload-zone" style="border:2px dashed var(--border-color);border-radius:6px;padding:14px;max-width:420px;">
              <div id="${opts.previewId}" style="margin-bottom:10px;min-height:36px;">${imgHtml}</div>
              <input type="file" id="${opts.inputId}" accept="image/png,image/jpeg,image/svg+xml" style="display:none">
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px;">
                <button type="button" class="btn btn-ghost btn-sm logo-choose-btn" data-input="${opts.inputId}">\uD83D\uDCC1 Choisir</button>
                <button type="button" class="logo-remove-btn btn btn-ghost btn-sm" data-preview="${opts.previewId}" data-key-b64="${opts.keyB64}" data-key-mime="${opts.keyMime}" style="${hasImg ? '' : 'display:none;'}">\uD83D\uDDD1 Supprimer</button>
              </div>
              <small style="color:var(--text-muted);">${opts.info}</small>
            </div>
          </div>`;
      }

      return `
        <div class="card" id="section-entreprise">
          <div class="card-header"><h2>Identit\u00e9 &amp; Documents</h2></div>

          <h3 style="margin:0 0 14px;font-size:0.88rem;color:var(--text-heading);">A. Informations entreprise</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="ent-nom">Nom de la soci\u00e9t\u00e9</label>
              <input type="text" id="ent-nom" class="form-control" value="${escapeAttr(e.nom || 'CRBR Solutions')}">
            </div>
            <div class="form-group">
              <label for="ent-forme">Forme juridique</label>
              <input type="text" id="ent-forme" class="form-control" value="${escapeAttr(e.formeJuridique || 'SASU')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="ent-siren">SIREN</label>
              <input type="text" id="ent-siren" class="form-control" value="${escapeAttr(e.siren || '')}">
            </div>
            <div class="form-group">
              <label for="ent-siret">SIRET</label>
              <input type="text" id="ent-siret" class="form-control" value="${escapeAttr(e.siret || '')}">
            </div>
            <div class="form-group">
              <label for="ent-rcs">RCS</label>
              <input type="text" id="ent-rcs" class="form-control" value="${escapeAttr(e.rcs || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1 1 100%;">
              <label for="ent-adresse">Adresse</label>
              <input type="text" id="ent-adresse" class="form-control" value="${escapeAttr(e.adresse || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="ent-cp">Code postal</label>
              <input type="text" id="ent-cp" class="form-control" value="${escapeAttr(e.codePostal || '')}">
            </div>
            <div class="form-group">
              <label for="ent-ville">Ville</label>
              <input type="text" id="ent-ville" class="form-control" value="${escapeAttr(e.ville || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="ent-tel">T\u00e9l\u00e9phone</label>
              <input type="text" id="ent-tel" class="form-control" value="${escapeAttr(e.telephone || '06 65 44 52 26')}">
            </div>
            <div class="form-group">
              <label for="ent-email">Email</label>
              <input type="email" id="ent-email" class="form-control" value="${escapeAttr(e.email || 'info@crbr-solution.fr')}">
            </div>
            <div class="form-group">
              <label for="ent-web">Site web</label>
              <input type="text" id="ent-web" class="form-control" value="${escapeAttr(e.siteWeb || 'www.crbr-solution.fr')}">
            </div>
          </div>

          <h3 style="margin:20px 0 14px;font-size:0.88rem;color:var(--text-heading);">B. Logos &amp; Identit\u00e9 visuelle</h3>
          ${logoZone({
            label:     'Logo principal \u2014 Documents officiels',
            info:      'Utilis\u00e9 sur les devis, factures et plaquette. Format PNG fond transparent recommand\u00e9. Dimensions\u00a0: 400\u00d7400\u00a0px max, 500\u00a0Ko.',
            previewId: 'logo-principal-preview',
            inputId:   'logo-principal-input',
            imgStyle:  'max-height:80px;max-width:200px;',
            base64:    e.logoPrincipalBase64 || '',
            keyB64:    'logoPrincipalBase64',
            keyMime:   'logoPrincipalMime',
            defaultSrc: '../img/logo%20principal%20DST.png'
          })}
          ${logoZone({
            label:     'Logo texte \u2014 Header et communications',
            info:      'Utilis\u00e9 dans les headers du site, portails et emails. Format PNG ou SVG recommand\u00e9. Dimensions\u00a0: 400\u00d7120\u00a0px max, 300\u00a0Ko.',
            previewId: 'logo-texte-preview',
            inputId:   'logo-texte-input',
            imgStyle:  'max-height:60px;max-width:300px;',
            base64:    e.logoTexteBase64 || '',
            keyB64:    'logoTexteBase64',
            keyMime:   'logoTexteMime',
            defaultSrc: '../img/logo-cerbere-or.png'
          })}
          ${logoZone({
            label:     'Favicon \u2014 Ic\u00f4ne onglet navigateur',
            info:      'Affich\u00e9 dans l\u2019onglet du navigateur. Format PNG 32\u00d732 ou 64\u00d764\u00a0px recommand\u00e9.',
            previewId: 'favicon-preview',
            inputId:   'favicon-input',
            imgStyle:  'width:32px;height:32px;image-rendering:pixelated;',
            base64:    e.faviconBase64 || '',
            keyB64:    'faviconBase64',
            keyMime:   'faviconMime',
            defaultSrc: '../img/logo-cerbere-or.png'
          })}

          <h3 style="margin:20px 0 14px;font-size:0.88rem;color:var(--text-heading);">C. Mentions l\u00e9gales documents</h3>
          <div class="form-row">
            <div class="form-group" style="flex:1 1 100%;">
              <label for="ent-mention-devis">Mention bas de page \u2014 Devis</label>
              <textarea id="ent-mention-devis" class="form-control" rows="2">${escapeHTML(e.mentionLegaleDevis || '')}</textarea>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1 1 100%;">
              <label for="ent-mention-facture">Mention bas de page \u2014 Factures</label>
              <textarea id="ent-mention-facture" class="form-control" rows="2">${escapeHTML(e.mentionLegaleFacture || '')}</textarea>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1 1 100%;">
              <label for="ent-rgpd">Mention RGPD</label>
              <input type="text" id="ent-rgpd" class="form-control" value="${escapeAttr(e.mentionRGPD || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" style="flex:1 1 100%;">
              <label for="ent-annulation">Conditions d\u2019annulation</label>
              <textarea id="ent-annulation" class="form-control" rows="2">${escapeHTML(e.conditionsAnnulation || '')}</textarea>
            </div>
          </div>
          <p class="form-help" style="margin-top:6px;">Ces mentions s\u2019appliquent automatiquement sur tous vos devis et factures g\u00e9n\u00e9r\u00e9s.</p>
        </div>`;
    }

    /** Carte récapitulative KPI en haut de page */
    function renderSummary() {
      const seuilPlancher = Engine.calculateSeuilPlancher(state);
      const tarifBase     = state.pricingCatalog.tarifJourneeBase || 0;
      const ok            = tarifBase > 0 && tarifBase >= seuilPlancher;
      const capaciteTotale = (state.capacite.nbUnites || 1) * (state.capacite.joursMaxParUniteParAn || 150);
      return `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Seuil plancher</div>
            <div class="kpi-value text-mono">${Engine.fmt(seuilPlancher)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Tarif journée</div>
            <div class="kpi-value text-mono">${Engine.fmt(tarifBase)}</div>
            <div class="kpi-detail">${ok ? 'Couvert ✓' : '⚠ Insuffisant'}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Marge cible</div>
            <div class="kpi-value">${state.targetMarginPercent} %</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Capacité</div>
            <div class="kpi-value">${capaciteTotale} j/an</div>
            <div class="kpi-detail">${state.capacite.nbUnites || 1} simulateur(s)</div>
          </div>
        </div>`;
    }

    /** Section — Paramètres RH */
    function renderHR() {
      return `
        <div class="card" id="section-rh">
          <div class="card-header">
            <h2>Paramètres RH</h2>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="rh-employer-charge">Charges patronales (%)</label>
              <input type="number" id="rh-employer-charge" class="form-control" value="${state.employerChargeRate}" min="0" max="100" step="any">
              <span class="form-help">Taux appliqué sur le brut pour les salariés</span>
            </div>
            <div class="form-group">
              <label for="rh-interim-coeff">Coefficient intérim</label>
              <input type="number" id="rh-interim-coeff" class="form-control" value="${state.interimCoefficient}" min="0" step="any">
              <span class="form-help">Multiplicateur appliqué au coût de base intérim</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="rh-freelance-charge">Charges freelance estimées (%)</label>
              <input type="number" id="rh-freelance-charge" class="form-control" value="${state.freelanceChargeRate}" min="0" max="100" step="any">
              <span class="form-help">Estimation des charges sociales freelance</span>
            </div>
            <div class="form-group">
              <label for="rh-operators-per-session">Opérateurs par session (défaut)</label>
              <input type="number" id="rh-operators-per-session" class="form-control" value="${state.estimatedOperatorsPerSession}" min="1" max="10" step="1"
                     title="Nombre d'opérateurs mobilisés par défaut par session. Utilisé dans le calcul du prix plancher des offres.">
              <span class="form-help">Utilisé dans le calcul du prix plancher des offres</span>
            </div>
            <div class="form-group">
              <label for="rh-overload">Seuil surcharge (sessions/mois)</label>
              <input type="number" id="rh-overload" class="form-control" value="${state.operatorOverloadThreshold}" min="0" step="any">
              <span class="form-help">Alerte si un opérateur dépasse ce seuil mensuel</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="rh-cdi-threshold">Seuil bascule CDI (sessions/an)</label>
              <input type="number" id="rh-cdi-threshold" class="form-control" value="${state.cdiThreshold}" min="0" step="any">
              <span class="form-help">Suggestion de CDI si un opérateur atteint ce nombre annuel</span>
            </div>
          </div>
        </div>`;
    }

    /** Section RH — Stratégie CDI vs Freelance */
    function renderRHStrategy() {
      const rh  = state.rh || {};
      const cdi = rh.cdi || {};

      // Volume actuel depuis les sessions de l'année
      const currentYear = new Date().getFullYear();
      const sessionsAnnee = DB.sessions.filter(s =>
        s.statut !== 'annulee' && new Date(s.date).getFullYear() === currentYear
      );
      const nbJoursDefault = Math.max(
        sessionsAnnee.reduce((sum, s) => sum + (s.nbJours || 1), 0),
        1
      );

      // Calcul initial
      const simInit = Engine.calculateComparaisonRH(state, nbJoursDefault);
      const bgColor = simInit.recommandation === 'CDI'
        ? 'rgba(45,212,160,0.08)' : 'rgba(59,130,246,0.08)';
      const recoClass = simInit.recommandation === 'CDI' ? 'tag-green' : 'tag-blue';

      function numF(id, val, step) {
        return `<input type="number" id="${id}" class="form-control rh-cdi-field" value="${val}" min="0" step="${step || 'any'}" style="max-width:160px;padding:4px 8px;text-align:right;">`;
      }

      return `
        <div class="card" id="section-rh-strategy">
          <div class="card-header">
            <h2>Stratégie RH — CDI vs Freelance</h2>
            <span class="tag tag-blue" style="font-size:0.65rem;">Simulateur temps réel</span>
          </div>
          <p class="form-help" style="margin-bottom:16px;">
            Calculez le point de bascule à partir duquel embaucher en CDI devient moins coûteux que de travailler en freelance/vacation.
          </p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;">

            <!-- Colonne gauche : paramètres CDI -->
            <div>
              <h3 style="margin:0 0 12px;font-size:0.88rem;color:var(--text-heading);">Paramètres CDI cible</h3>
              <div class="form-group">
                <label for="rh-cdi-salaire-brut">Salaire brut mensuel cible (€)</label>
                ${numF('rh-cdi-salaire-brut', cdi.salaireBrutMensuel || 2800)}
              </div>
              <div class="form-group">
                <label for="rh-cdi-charges-patron">Charges patronales (%)</label>
                ${numF('rh-cdi-charges-patron', cdi.chargesPatronalesPercent || 42)}
              </div>
              <div class="form-group">
                <label for="rh-cdi-primes">Primes annuelles (€)</label>
                ${numF('rh-cdi-primes', cdi.primesAnnuelles || 1000)}
              </div>
              <div class="form-group">
                <label for="rh-cdi-recrutement">Coût recrutement (€)</label>
                ${numF('rh-cdi-recrutement', cdi.coutRecrutement || 3000)}
                <span class="form-help">Amorti sur 3 ans</span>
              </div>
              <div class="form-group">
                <label for="rh-cdi-avantages">Avantages en nature (€/an)</label>
                ${numF('rh-cdi-avantages', cdi.avantagesNature || 0)}
              </div>
              <button class="btn btn-primary btn-sm" id="btn-save-rh-cdi" style="margin-top:8px;">Sauvegarder les paramètres CDI</button>
            </div>

            <!-- Colonne droite : simulateur -->
            <div>
              <h3 style="margin:0 0 12px;font-size:0.88rem;color:var(--text-heading);">Simulateur</h3>
              <div class="form-group">
                <label for="rh-sim-jours">Volume annuel simulé (jours)</label>
                <input type="range" id="rh-sim-jours" min="1" max="220" step="1" value="${nbJoursDefault}"
                       style="width:100%;accent-color:var(--color-primary);">
                <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);">
                  <span>1j</span>
                  <span id="rh-sim-jours-display" style="font-weight:700;font-size:0.9rem;color:var(--text-heading);">${nbJoursDefault}j</span>
                  <span>220j</span>
                </div>
              </div>

              <div id="rh-sim-result" style="margin-top:12px;padding:16px;border-radius:6px;background:${bgColor};border:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
                  Pour <span id="rh-r-jours">${nbJoursDefault}</span> jours/an
                </div>
                <table style="width:100%;font-size:0.84rem;border-collapse:collapse;">
                  <tr>
                    <td style="padding:3px 0;color:var(--text-muted);">FREELANCE</td>
                    <td style="padding:3px 0;text-align:right;">
                      <span class="text-mono" id="rh-r-freelance-j">${Engine.fmt(simInit.coutJourFreelance)}/j</span>
                      × <span id="rh-r-freelance-nb">${nbJoursDefault}</span>j
                      = <strong class="text-mono" id="rh-r-freelance-total">${Engine.fmt(simInit.totalFreelance)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:3px 0;color:var(--text-muted);">CDI (pro-rata)</td>
                    <td style="padding:3px 0;text-align:right;">
                      <span class="text-mono" id="rh-r-cdi-annuel">${Engine.fmt(simInit.coutCDIAnnuel)}/an</span>
                      → <strong class="text-mono" id="rh-r-cdi-total">${Engine.fmt(simInit.coutCDIPourNbJours)}</strong>
                    </td>
                  </tr>
                </table>
                <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:10px 0;">
                <div style="font-size:0.82rem;margin-bottom:6px;">
                  Point de bascule : <strong id="rh-r-bascule">${simInit.pointBasculejours}</strong> jours/an
                </div>
                <div style="display:flex;align-items:center;gap:10px;margin-top:6px;">
                  <span style="font-weight:700;font-size:0.88rem;">RECOMMANDATION :</span>
                  <span class="tag ${recoClass}" id="rh-r-reco">${simInit.recommandation}</span>
                </div>
                <div style="font-size:0.82rem;margin-top:6px;color:var(--text-muted);">
                  Économie estimée : <strong class="text-mono" id="rh-r-economie">${Engine.fmt(simInit.economie)}</strong>/an
                </div>
              </div>
            </div>

          </div>
        </div>`;
    }

    /** Section 5 — Paramètres économiques */
    function renderEconomic() {
      return `
        <div class="card" id="section-eco">
          <div class="card-header">
            <h2>Paramètres économiques</h2>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="eco-target-margin">Marge cible (%)</label>
              <input type="number" id="eco-target-margin" class="form-control" value="${state.targetMarginPercent}" min="0" max="100" step="any">
              <span class="form-help">Objectif de marge sur chaque session</span>
            </div>
            <div class="form-group">
              <label for="eco-margin-alert">Seuil alerte marge (%)</label>
              <input type="number" id="eco-margin-alert" class="form-control" value="${state.marginAlertThreshold}" min="0" max="100" step="any">
              <span class="form-help">Alerte si la marge tombe sous ce seuil</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="eco-vat">Taux TVA (%)</label>
              <input type="number" id="eco-vat" class="form-control" value="${state.vatRate}" min="0" max="100" step="any">
            </div>
            <div class="form-group">
              <label for="eco-hours-day">Heures de travail / jour</label>
              <input type="number" id="eco-hours-day" class="form-control" value="${state.hoursPerDay || 7}" min="1" max="24" step="any">
              <span class="form-help">Pour la conversion taux horaire → journalier</span>
            </div>
            <div class="form-group">
              <label for="eco-est-sessions">Sessions estimées / an</label>
              <input type="number" id="eco-est-sessions" class="form-control" value="${state.estimatedAnnualSessions}" min="0" step="any">
              <span class="form-help">Base de répartition des coûts fixes par session</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="eco-floor-margin">Marge de sécurité prix plancher (%)</label>
              <input type="number" id="eco-floor-margin" class="form-control" value="${state.floorPriceMargin}" min="0" max="100" step="any">
              <span class="form-help">Surcoût appliqué au coût total pour déterminer le prix plancher</span>
            </div>
            <div class="form-group">
              <label for="eco-dep-risk">Seuil risque dépendance opérateur (%)</label>
              <input type="number" id="eco-dep-risk" class="form-control" value="${state.operatorDependencyRiskThreshold}" min="0" max="100" step="any">
              <span class="form-help">Alerte si un opérateur représente plus de ce % du CA</span>
            </div>
            <div class="form-group">
              <label for="eco-urssaf-days">Seuil requalification URSSAF (jours)</label>
              <input type="number" id="eco-urssaf-days" class="form-control" value="${state.urssafRequalificationDays}" min="1" max="365" step="1">
              <span class="form-help">Nombre de jours avant requalification en CDI (France)</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="eco-nb-jours">Jours objectif / an</label>
              <input type="number" id="eco-nb-jours" class="form-control" value="${state.nbJoursObjectifAnnuel || 50}" min="0" step="any">
              <span class="form-help">Nombre de jours d'activité objectif annuel (calcul seuil plancher)</span>
            </div>
            <div class="form-group">
              <label>Seuil plancher auto-calculé <span class="tag tag-blue" style="font-size:0.6rem;margin-left:4px;">Auto</span></label>
              <div class="form-control" style="background:transparent;border-color:var(--color-info);font-weight:700;color:var(--text-heading);font-family:var(--font-mono);" id="eco-seuil-plancher">${Engine.fmt(Engine.calculateSeuilPlancher(state))}</div>
              <span class="form-help">(Charges fixes + Amort.) / Jours objectif + Variables défaut</span>
            </div>
          </div>
        </div>`;
    }

    /** Section 6 — Barème des charges sociales (détail réel) */
    function renderChargesSociales() {
      const cc = state.chargesConfig;
      if (!cc) return '';

      function renderChargeTable(charges, idPrefix) {
        return charges.map((c, i) => `
          <tr>
            <td style="font-size:0.78rem;max-width:250px;">${escapeHTML(c.label)}</td>
            <td style="width:90px;">
              <input type="number" class="form-control text-mono ${idPrefix}-taux"
                     data-index="${i}" value="${c.taux}" min="0" step="any"
                     style="padding:4px 6px;font-size:0.82rem;text-align:right;">
            </td>
            <td style="font-size:0.72rem;color:var(--text-muted);max-width:150px;">
              ${c.plafonnee ? 'Plaf. PASS' : c.tranche2 ? 'T2 (>PASS)' : c.assiette9825 ? '×98,25%' : 'Déplaf.'}
            </td>
          </tr>`).join('');
      }

      // Total taux patronales (approx pour info)
      const totalTxPatro = cc.patronales.reduce((s, c) => s + (c.taux || 0), 0);
      const totalTxSal = cc.salariales.reduce((s, c) => s + (c.taux || 0), 0);

      return `
        <div class="card" id="section-charges">
          <div class="card-header">
            <h2>Barème des charges sociales</h2>
            <span class="tag tag-red" style="font-size:0.65rem;">Taux officiels France</span>
          </div>
          <p class="form-help mb-16">Ces taux sont utilisés pour le calcul réel du coût entreprise de chaque opérateur. Modifiez-les si les taux évoluent.</p>

          <!-- Paramètres généraux -->
          <div class="form-row">
            <div class="form-group">
              <label for="cc-pass">PASS annuel (€)</label>
              <input type="number" id="cc-pass" class="form-control text-mono" value="${cc.passAnnuel || 47100}" min="0" step="any">
              <span class="form-help">Plafond Annuel Sécurité Sociale</span>
            </div>
            <div class="form-group">
              <label for="cc-smic">SMIC mensuel brut (€)</label>
              <input type="number" id="cc-smic" class="form-control text-mono" value="${cc.smicMensuelBrut || 1801.80}" min="0" step="any">
              <span class="form-help">Pour calcul des taux réduits</span>
            </div>
            <div class="form-group">
              <label for="cc-jours">Jours ouvrés / an</label>
              <input type="number" id="cc-jours" class="form-control" value="${cc.joursOuvresAn || 218}" min="1" step="any">
            </div>
            <div class="form-group">
              <label for="cc-effectif">Effectif entreprise</label>
              <select id="cc-effectif" class="form-control">
                <option value="moins11" ${cc.effectif === 'moins11' ? 'selected' : ''}>Moins de 11 salariés</option>
                <option value="de11a49" ${cc.effectif === 'de11a49' ? 'selected' : ''}>De 11 à 49 salariés</option>
                <option value="50etplus" ${cc.effectif === '50etplus' ? 'selected' : ''}>50 salariés et plus</option>
              </select>
            </div>
          </div>

          <!-- Charges patronales -->
          <h3 style="margin:16px 0 8px;font-size:0.88rem;color:var(--text-heading);">
            Charges patronales
            <span class="text-muted" style="font-weight:400;font-size:0.75rem;margin-left:8px;">
              Somme taux : ${totalTxPatro.toFixed(2)} %
            </span>
          </h3>
          <div class="data-table-wrap">
            <table class="data-table" style="font-size:0.82rem;">
              <thead>
                <tr><th>Cotisation</th><th>Taux (%)</th><th>Base</th></tr>
              </thead>
              <tbody>${renderChargeTable(cc.patronales, 'cp')}</tbody>
            </table>
          </div>

          <!-- Charges salariales -->
          <h3 style="margin:20px 0 8px;font-size:0.88rem;color:var(--text-heading);">
            Charges salariales (prélevées sur le brut)
            <span class="text-muted" style="font-weight:400;font-size:0.75rem;margin-left:8px;">
              Somme taux : ${totalTxSal.toFixed(2)} %
            </span>
          </h3>
          <div class="data-table-wrap">
            <table class="data-table" style="font-size:0.82rem;">
              <thead>
                <tr><th>Cotisation</th><th>Taux (%)</th><th>Base</th></tr>
              </thead>
              <tbody>${renderChargeTable(cc.salariales, 'cs')}</tbody>
            </table>
          </div>

          <!-- Spécificités par statut -->
          <h3 style="margin:20px 0 8px;font-size:0.88rem;color:var(--text-heading);">Spécificités par type de contrat</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="cc-cdd-precarite">CDD — Prime précarité (%)</label>
              <input type="number" id="cc-cdd-precarite" class="form-control" value="${cc.cdd ? cc.cdd.primePrecarite : 10}" min="0" step="any">
            </div>
            <div class="form-group">
              <label for="cc-cdd-cp">CDD — Indemnité congés payés (%)</label>
              <input type="number" id="cc-cdd-cp" class="form-control" value="${cc.cdd ? cc.cdd.indemniteCP : 10}" min="0" step="any">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="cc-interim-coeff">Intérim — Coefficient agence</label>
              <input type="number" id="cc-interim-coeff" class="form-control" value="${cc.interim ? cc.interim.coefficientAgence : 2.0}" min="0" step="any">
              <span class="form-help">Multiplicateur facture agence sur le brut</span>
            </div>
            <div class="form-group">
              <label for="cc-freelance-taux">Freelance — Taux charges AE (%)</label>
              <input type="number" id="cc-freelance-taux" class="form-control" value="${cc.freelance ? cc.freelance.tauxCharges : 21.1}" min="0" step="any">
              <span class="form-help">Auto-entrepreneur BNC prestations de services</span>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="cc-fondateur-regime">Fondateur — Régime</label>
              <select id="cc-fondateur-regime" class="form-control">
                <option value="tns" ${(!cc.fondateur || cc.fondateur.regime === 'tns') ? 'selected' : ''}>TNS (Travailleur Non Salarié)</option>
                <option value="assimileSalarie" ${(cc.fondateur && cc.fondateur.regime === 'assimileSalarie') ? 'selected' : ''}>Assimilé salarié (SAS/SASU)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="cc-fondateur-tns">Fondateur — Taux cotisations TNS (%)</label>
              <input type="number" id="cc-fondateur-tns" class="form-control" value="${cc.fondateur ? cc.fondateur.tauxTNS : 45}" min="0" step="any">
              <span class="form-help">Approximation globale des cotisations TNS</span>
            </div>
          </div>
        </div>`;
    }

    /** Section 7 — Types extensibles */
    function renderTypes() {
      /* Types clients — éditable */
      const clientTags = state.clientTypes.map((t, i) => `
        <span class="tag tag-blue" style="gap:6px">
          ${escapeHTML(t)}
          <span class="ct-remove" data-index="${i}" style="cursor:pointer;opacity:0.7" title="Supprimer">&times;</span>
        </span>`).join('');

      /* Statuts opérateurs — lecture seule */
      const opTags = state.operatorStatuses.map(s =>
        `<span class="tag tag-neutral">${Engine.statusLabel ? Engine.statusLabel(s) : escapeHTML(s)}</span>`
      ).join('');

      /* Types d'offres — lecture seule */
      const offerTags = state.offerTypes.map(t =>
        `<span class="tag tag-neutral">${Engine.offerTypeLabel ? Engine.offerTypeLabel(t) : escapeHTML(t)}</span>`
      ).join('');

      return `
        <div class="card" id="section-types">
          <div class="card-header">
            <h2>Types extensibles</h2>
          </div>

          <div class="form-group">
            <label>Types de clients</label>
            <div class="flex gap-8 mb-8" style="flex-wrap:wrap" id="client-types-list">
              ${clientTags}
            </div>
            <div class="form-inline">
              <input type="text" id="input-new-client-type" class="form-control" placeholder="Nouveau type client" style="max-width:260px">
              <button class="btn btn-sm" id="btn-add-client-type">+ Ajouter</button>
            </div>
          </div>

          <div class="form-group mt-16">
            <label>Statuts opérateurs <span class="text-muted" style="text-transform:none;font-weight:400">(définis par le système)</span></label>
            <div class="flex gap-8" style="flex-wrap:wrap">
              ${opTags}
            </div>
          </div>

          <div class="form-group mt-16">
            <label>Types d'offres <span class="text-muted" style="text-transform:none;font-weight:400">(définis par le système)</span></label>
            <div class="flex gap-8" style="flex-wrap:wrap">
              ${offerTags}
            </div>
          </div>

          <div style="margin-top:20px;padding:12px;background:var(--bg-secondary);border-radius:6px;">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">RÉFÉRENTIELS</div>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('modules')">&#127891; Gérer le catalogue de compétences</button>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('locations')" style="margin-left:8px;">&#128205; Gérer les lieux enregistrés</button>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('deplacements')" style="margin-left:8px;">&#128664; Bar\u00e8me d\u00e9placements</button>
            <small style="display:block;margin-top:8px;color:var(--text-muted);">Ces référentiels sont utilisés dans les sessions et les offres mais n'apparaissent pas dans la navigation principale.</small>
          </div>
        </div>`;
    }

    /** Génère le HTML du tableau récapitulatif coût journée (réutilisé par refresh) */
    function _buildCjRecapHTML(cj, tarifBase, targetMargin, alertThreshold) {
      const nb      = Math.max(cj.nbJoursFacturesAn || 100, 1);
      const coutOp  = Engine.round2(cj.coutOperateurJour || 0);
      const amortSimu = cj.prixSimulateur
        ? Engine.round2((cj.prixSimulateur / (cj.dureeAmortissementAns || 7)) / nb) : 0;
      const conso      = Engine.round2(cj.consommablesJour || 0);
      const assurances = Engine.round2(((cj.rcProAnnuelle || 0) + (cj.assurancesMaterielAnnuelle || 0)) / nb);
      const fraisKm    = (cj.deplacementMoyenKm || 0) * (cj.tarifKm || 0.53);
      const deplacement = Engine.round2(fraisKm + (cj.peagesAllerRetour || 0) + (cj.fraisStationnement || 0));
      const admin      = Engine.round2(((cj.expertComptableAnnuel || 0)
        + (cj.fraisBancairesAnnuels || 0) + (cj.autresFraisAdminAnnuels || 0)) / nb);
      const coutDirect = Engine.round2(coutOp + amortSimu + conso + assurances + deplacement + admin);
      const ratioTNF   = Math.min((cj.ratioTempsNonFacturable || 40) / 100, 0.95);
      const coutAvecTNF = Engine.round2(coutDirect / (1 - ratioTNF));
      const majTNF     = Engine.round2(coutAvecTNF - coutDirect);
      const margeSec   = (cj.margeSecuritePourcent || 5) / 100;
      const coutFinal  = Math.round(coutAvecTNF * (1 + margeSec));
      const majSecurite = Engine.round2(coutFinal - coutAvecTNF);
      const margeBrute = tarifBase > 0 ? Engine.round2((tarifBase - coutFinal) / tarifBase * 100) : 0;
      const margeClass = margeBrute >= targetMargin ? 'tag-green'
        : margeBrute >= alertThreshold ? 'tag-yellow' : 'tag-red';

      return `<table class="data-table" style="font-size:0.85rem;max-width:480px;">
        <thead><tr><th>Poste</th><th style="text-align:right;">\u20ac/jour</th></tr></thead>
        <tbody>
          <tr><td>Op\u00e9rateur</td><td style="text-align:right;" class="text-mono">${Engine.fmt(coutOp)}</td></tr>
          <tr><td>Amortissement</td><td style="text-align:right;" class="text-mono">${Engine.fmt(amortSimu)}</td></tr>
          <tr><td>Consommables</td><td style="text-align:right;" class="text-mono">${Engine.fmt(conso)}</td></tr>
          <tr><td>Assurances</td><td style="text-align:right;" class="text-mono">${Engine.fmt(assurances)}</td></tr>
          <tr><td>D\u00e9placements</td><td style="text-align:right;" class="text-mono">${Engine.fmt(deplacement)}</td></tr>
          <tr><td>Administratif</td><td style="text-align:right;" class="text-mono">${Engine.fmt(admin)}</td></tr>
          <tr style="border-top:1px solid var(--border-color);">
            <td style="font-weight:600;">Sous-total direct</td>
            <td style="text-align:right;font-weight:600;" class="text-mono">${Engine.fmt(coutDirect)}</td>
          </tr>
          <tr>
            <td style="color:var(--text-muted);">Majoration TNF (+${cj.ratioTempsNonFacturable || 40}\u00a0%)</td>
            <td style="text-align:right;" class="text-mono">+\u00a0${Engine.fmt(majTNF)}</td>
          </tr>
          <tr>
            <td style="color:var(--text-muted);">Marge s\u00e9curit\u00e9 (+${cj.margeSecuritePourcent || 5}\u00a0%)</td>
            <td style="text-align:right;" class="text-mono">+\u00a0${Engine.fmt(majSecurite)}</td>
          </tr>
          <tr style="border-top:2px solid var(--border-color);">
            <td style="font-weight:700;font-size:0.9rem;">SEUIL PLANCHER</td>
            <td style="text-align:right;font-weight:700;font-size:0.9rem;" class="text-mono">${Engine.fmt(coutFinal)}\u00a0\u20ac</td>
          </tr>
          <tr>
            <td style="padding-top:10px;color:var(--text-muted);">Tarif journ\u00e9e r\u00e9f.</td>
            <td style="text-align:right;padding-top:10px;" class="text-mono">${Engine.fmt(tarifBase)}\u00a0\u20ac</td>
          </tr>
          <tr>
            <td style="font-weight:600;">Marge brute estim\u00e9e</td>
            <td style="text-align:right;"><span class="tag ${margeClass}">${margeBrute}\u00a0%</span></td>
          </tr>
        </tbody>
      </table>`;
    }

    /** Section 6b — Coût journée réel */
    function renderCoutJournee() {
      const cj = state.coutJournee;
      const nb = Math.max(cj.nbJoursFacturesAn || 100, 1);
      const amortSimuInit   = cj.prixSimulateur
        ? Engine.round2((cj.prixSimulateur / (cj.dureeAmortissementAns || 7)) / nb) : 0;
      const fraisKmInit     = (cj.deplacementMoyenKm || 0) * (cj.tarifKm || 0.53);
      const deplacementInit = Engine.round2(fraisKmInit + (cj.peagesAllerRetour || 0) + (cj.fraisStationnement || 0));
      const tarifBase       = state.pricingCatalog.tarifJourneeBase || 0;
      const targetMargin    = state.targetMarginPercent || 30;
      const alertThreshold  = state.marginAlertThreshold || 15;

      function numF(id, val, step, max) {
        return `<input type="number" id="${id}" class="form-control cj-field" value="${val}" min="0"
          step="${step || 'any'}" ${max ? `max="${max}"` : ''} style="max-width:130px;padding:4px 8px;text-align:right;">`;
      }

      return `
        <div class="card" id="section-cout-journee">
          <div class="card-header"><h2>Co\u00fbt journ\u00e9e r\u00e9el</h2></div>
          <p class="form-help" style="margin-bottom:16px;">Ces param\u00e8tres alimentent le calcul automatique du seuil plancher journalier.</p>

          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">A. Op\u00e9rateur</h3>
          <div class="form-row" style="margin-bottom:16px;">
            <div class="form-group">
              <label for="cj-cout-operateur">Co\u00fbt op\u00e9rateur par jour (\u20ac)</label>
              ${numF('cj-cout-operateur', cj.coutOperateurJour || 0)}
              <span class="form-help">TJM freelance ou co\u00fbt charg\u00e9 salari\u00e9 tout compris</span>
            </div>
          </div>

          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">B. Mat\u00e9riel</h3>
          <div class="form-row" style="margin-bottom:8px;">
            <div class="form-group">
              <label for="cj-prix-simu">Prix d\u2019achat simulateur (\u20ac\u00a0HT)</label>
              ${numF('cj-prix-simu', cj.prixSimulateur || 0)}
            </div>
            <div class="form-group">
              <label for="cj-duree-amort">Dur\u00e9e d\u2019amortissement (ans)</label>
              ${numF('cj-duree-amort', cj.dureeAmortissementAns || 7, 1)}
            </div>
            <div class="form-group">
              <label for="cj-consommables">Consommables par jour (\u20ac)</label>
              ${numF('cj-consommables', cj.consommablesJour || 0)}
            </div>
          </div>
          <p class="form-help" style="margin-bottom:16px;">
            Amortissement/jour (base <strong id="cj-nb-jours-display">${nb}</strong>\u00a0j/an)\u00a0:
            <strong id="cj-amort-display">${Engine.fmt(amortSimuInit)}</strong>\u00a0\u20ac
          </p>

          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">C. Assurances</h3>
          <div class="form-row" style="margin-bottom:16px;">
            <div class="form-group">
              <label for="cj-rc-pro">RC Pro annuelle (\u20ac)</label>
              ${numF('cj-rc-pro', cj.rcProAnnuelle || 0)}
            </div>
            <div class="form-group">
              <label for="cj-assur-materiel">Assurance mat\u00e9riel annuelle (\u20ac)</label>
              ${numF('cj-assur-materiel', cj.assurancesMaterielAnnuelle || 0)}
            </div>
          </div>

          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">D. D\u00e9placements (zone incluse)</h3>
          <div class="form-row" style="margin-bottom:8px;">
            <div class="form-group">
              <label for="cj-km">Distance moyenne AR par mission (km)</label>
              ${numF('cj-km', cj.deplacementMoyenKm || 0, 1)}
            </div>
            <div class="form-group">
              <label for="cj-tarif-km">Tarif kilom\u00e9trique (\u20ac/km)</label>
              ${numF('cj-tarif-km', cj.tarifKm || 0.53, 0.01)}
            </div>
            <div class="form-group">
              <label for="cj-peages">P\u00e9ages moyens AR (\u20ac)</label>
              ${numF('cj-peages', cj.peagesAllerRetour || 0)}
            </div>
            <div class="form-group">
              <label for="cj-parking">Stationnement moyen (\u20ac)</label>
              ${numF('cj-parking', cj.fraisStationnement || 0)}
            </div>
          </div>
          <p class="form-help" style="margin-bottom:16px;">
            Co\u00fbt d\u00e9placement estim\u00e9/mission\u00a0:
            <strong id="cj-deplacement-display">${Engine.fmt(deplacementInit)}</strong>\u00a0\u20ac
          </p>

          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">E. Administratif &amp; Structure</h3>
          <div class="form-row" style="margin-bottom:16px;">
            <div class="form-group">
              <label for="cj-expert-comptable">Expert-comptable (\u20ac/an)</label>
              ${numF('cj-expert-comptable', cj.expertComptableAnnuel || 0)}
            </div>
            <div class="form-group">
              <label for="cj-frais-bancaires">Frais bancaires (\u20ac/an)</label>
              ${numF('cj-frais-bancaires', cj.fraisBancairesAnnuels || 0)}
            </div>
            <div class="form-group">
              <label for="cj-autres-admin">Autres frais administratifs (\u20ac/an)</label>
              ${numF('cj-autres-admin', cj.autresFraisAdminAnnuels || 0)}
            </div>
            <div class="form-group">
              <label for="cj-nb-jours">Jours factur\u00e9s objectif (an)</label>
              ${numF('cj-nb-jours', cj.nbJoursFacturesAn || 100, 1)}
            </div>
          </div>

          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">F. Coefficients</h3>
          <div class="form-row" style="margin-bottom:16px;">
            <div class="form-group">
              <label for="cj-tnf">Temps non facturable (%)</label>
              ${numF('cj-tnf', cj.ratioTempsNonFacturable || 40, 1, 95)}
              <span class="form-help">Prospection, pr\u00e9paration, comptes-rendus, admin.<br>
              Un ratio de 40\u00a0% signifie que pour 10 jours factur\u00e9s, vous travaillez 16,7 jours au total.</span>
            </div>
            <div class="form-group">
              <label for="cj-marge-secu">Marge de s\u00e9curit\u00e9 tr\u00e9sorerie (%)</label>
              ${numF('cj-marge-secu', cj.margeSecuritePourcent || 5, 1)}
            </div>
          </div>

          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">R\u00e9capitulatif</h3>
          <div id="cj-recap">
            ${_buildCjRecapHTML(cj, tarifBase, targetMargin, alertThreshold)}
          </div>
        </div>`;
    }

    /** Section 6c — Capacité opérationnelle */
    function renderCapacite() {
      const cap = state.capacite;
      const nbU   = cap.nbUnites || 1;
      const jMax  = cap.joursMaxParUniteParAn || 150;
      const sMois = cap.joursMoisCible || 13;
      const capaciteTotale = nbU * jMax;
      const moyMois        = nbU * sMois;
      const seuilAlertePct  = jMax > 0 ? Math.round((cap.seuilAlerteJours || 120) / jMax * 100) : 80;
      const seuilCritPct    = jMax > 0 ? Math.round((cap.seuilCritiqueJours || 140) / jMax * 100) : 93;
      const coutUniteSup    = (cap.coutSimulateurNouveauHT || 40000) + (cap.coutRecrutementOperateur || 2000);

      function numC(id, val, step) {
        return `<input type="number" id="${id}" class="form-control cap-field" value="${val}" min="0" step="${step || 1}" style="max-width:130px;padding:4px 8px;text-align:right;">`;
      }

      return `
        <div class="card" id="section-capacite">
          <div class="card-header"><h2>Capacit\u00e9 op\u00e9rationnelle</h2></div>
          <p class="form-help" style="margin-bottom:16px;">
            1 unit\u00e9 = 1 simulateur + 1 op\u00e9rateur d\u00e9di\u00e9.
            Ces param\u00e8tres pilotent les alertes d\u2019investissement et le taux d\u2019utilisation du tableau de bord.
          </p>

          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">A. Unit\u00e9s actives</h3>
          <div class="form-row" style="margin-bottom:8px;">
            <div class="form-group">
              <label for="cap-nb-unites">Nombre de simulateurs actifs</label>
              ${numC('cap-nb-unites', nbU, 1)}
              <span class="form-help">Chaque unit\u00e9 = 1 simulateur + 1 op\u00e9rateur d\u00e9di\u00e9</span>
            </div>
          </div>
          <div class="alert alert-info" style="margin-bottom:16px;font-size:0.84rem;">
            Capacit\u00e9 totale actuelle\u00a0:
            <strong id="cap-total-display">${capaciteTotale}</strong>\u00a0jours/an,
            soit <strong id="cap-mois-display">${moyMois}</strong>\u00a0jours/mois en moyenne.
          </div>

          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">B. Param\u00e8tres de capacit\u00e9</h3>
          <div class="form-row" style="margin-bottom:8px;">
            <div class="form-group">
              <label for="cap-jours-max">Jours max par unit\u00e9 / an</label>
              ${numC('cap-jours-max', jMax, 1)}
            </div>
            <div class="form-group">
              <label for="cap-seuil-alerte-pct">Seuil d\u2019alerte (%)</label>
              ${numC('cap-seuil-alerte-pct', seuilAlertePct, 1)}
              <span class="form-help">=\u00a0<strong id="cap-seuil-alerte-display">${cap.seuilAlerteJours || 120}</strong>\u00a0j/an</span>
            </div>
            <div class="form-group">
              <label for="cap-seuil-critique-pct">Seuil critique (%)</label>
              ${numC('cap-seuil-critique-pct', seuilCritPct, 1)}
              <span class="form-help">=\u00a0<strong id="cap-seuil-critique-display">${cap.seuilCritiqueJours || 140}</strong>\u00a0j/an</span>
            </div>
          </div>
          <div class="form-row" style="margin-bottom:16px;">
            <div class="form-group">
              <label for="cap-jours-mois-cible">Objectif mensuel (jours)</label>
              ${numC('cap-jours-mois-cible', cap.joursMoisCible || 13, 1)}
            </div>
            <div class="form-group">
              <label for="cap-jours-mois-max">Plafond mensuel absolu (jours)</label>
              ${numC('cap-jours-mois-max', cap.joursMoisMax || 15, 1)}
            </div>
          </div>

          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">C. Investissement</h3>
          <div class="form-row" style="margin-bottom:8px;">
            <div class="form-group">
              <label for="cap-cout-simu">Co\u00fbt nouveau simulateur + \u00e9quip. (\u20ac\u00a0HT)</label>
              ${numC('cap-cout-simu', cap.coutSimulateurNouveauHT || 40000)}
            </div>
            <div class="form-group">
              <label for="cap-cout-recrutement">Frais recrutement / formation (\u20ac)</label>
              ${numC('cap-cout-recrutement', cap.coutRecrutementOperateur || 2000)}
            </div>
          </div>
          <div class="form-row" style="margin-bottom:16px;">
            <div class="form-group">
              <label for="cap-delai-dispo">D\u00e9lai d\u00e9ploiement nouvelle unit\u00e9 (jours)</label>
              ${numC('cap-delai-dispo', cap.delaiDispoNouvelleUnite || 90, 1)}
            </div>
            <div class="form-group">
              <label for="cap-mois-anticip">D\u00e9lai d\u2019anticipation (mois)</label>
              ${numC('cap-mois-anticip', cap.moisAnticipationInvestissement || 3, 1)}
              <span class="form-help">L\u2019alerte d\u2019investissement se d\u00e9clenche <strong>${cap.moisAnticipationInvestissement || 3}</strong> mois avant d\u2019atteindre le seuil critique.</span>
            </div>
          </div>

          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">D. R\u00e9capitulatif capacit\u00e9</h3>
          <table style="width:100%;border-collapse:collapse;font-size:0.84rem;" id="cap-recap-table">
            <tbody>
              <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 4px;color:var(--text-muted);">Capacit\u00e9 totale (jours/an)</td>
                <td id="cap-recap-total" style="padding:6px 4px;text-align:right;font-weight:600;">${capaciteTotale}</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 4px;color:var(--text-muted);">Objectif mensuel</td>
                <td id="cap-recap-mois" style="padding:6px 4px;text-align:right;font-weight:600;">${moyMois}</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 4px;color:var(--text-muted);">Plafond mensuel</td>
                <td id="cap-recap-plafond" style="padding:6px 4px;text-align:right;font-weight:600;">${(cap.joursMoisMax || 15) * nbU}</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 4px;color:var(--text-muted);">Seuil alerte <span class="tag tag-yellow" style="font-size:0.65rem;vertical-align:middle;">Attention</span></td>
                <td id="cap-recap-alerte" style="padding:6px 4px;text-align:right;font-weight:600;">${cap.seuilAlerteJours || 120}\u00a0j/an</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 4px;color:var(--text-muted);">Seuil critique <span class="tag tag-red" style="font-size:0.65rem;vertical-align:middle;">Investir</span></td>
                <td id="cap-recap-critique" style="padding:6px 4px;text-align:right;font-weight:600;color:#d32f2f;">${cap.seuilCritiqueJours || 140}\u00a0j/an</td>
              </tr>
              <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:6px 4px;color:var(--text-muted);">Co\u00fbt 1 unit\u00e9 suppl\u00e9mentaire</td>
                <td id="cap-recap-cout" style="padding:6px 4px;text-align:right;font-weight:600;">${coutUniteSup.toLocaleString('fr-FR')}\u00a0\u20ac</td>
              </tr>
              <tr>
                <td style="padding:6px 4px;color:var(--text-muted);">D\u00e9lai avant dispo</td>
                <td style="padding:6px 4px;text-align:right;font-weight:600;">${cap.delaiDispoNouvelleUnite || 90}\u00a0j</td>
              </tr>
            </tbody>
          </table>
        </div>`;
    }

    /** Section 7 — Catalogue tarifaire */
    function renderPricingCatalog() {
      const pc = state.pricingCatalog;
      const seuilPlancher = Engine.calculateSeuilPlancher(state);
      const tarifBase     = pc.tarifJourneeBase || 0;
      const demiCoeff     = pc.tarifDemiJourneeCoeff || 0.70;
      const seuilOk       = tarifBase > 0 && tarifBase >= seuilPlancher;

      const paliers = (Array.isArray(pc.paliers) && pc.paliers.length === 4)
        ? pc.paliers : DB.settings.getDefaults().pricingCatalog.paliers;
      const zones = (Array.isArray(pc.zones) && pc.zones.length >= 4)
        ? pc.zones : DB.settings.getDefaults().pricingCatalog.zones;
      const gcPaliers = Array.isArray(pc.paliersGrandCompte) ? pc.paliersGrandCompte : DB.settings.getDefaults().pricingCatalog.paliersGrandCompte;
      const b2bCfg    = pc.b2b || DB.settings.getDefaults().pricingCatalog.b2b;
      const b2cCfg    = pc.b2c || DB.settings.getDefaults().pricingCatalog.b2c;

      const palierRows = paliers.map((p, i) => {
        const prixJour   = p.prixBase != null ? p.prixBase : Engine.round2(tarifBase * p.coeff);
        const nextPalier = paliers[i + 1];
        const overlap    = nextPalier && (p.volumeMax >= nextPalier.volumeMin);
        return `<tr>
          <td style="font-weight:600;">${escapeHTML(p.label)}</td>
          <td style="text-align:center;">
            <input type="number" min="1" max="999"
                   class="input-sm palier-minj"
                   data-palier="${i}" data-field="volumeMin"
                   value="${p.volumeMin}">
          </td>
          <td style="text-align:center;">
            <input type="number" min="1" max="999"
                   class="input-sm palier-maxj"
                   data-palier="${i}" data-field="volumeMax"
                   value="${p.volumeMax === 9999 ? 9999 : p.volumeMax}">
            ${overlap ? `<div class="palier-overlap-warn" style="color:#d32f2f;font-size:0.75rem;white-space:nowrap;">⚠ Chevauchement</div>` : ''}
          </td>
          <td style="text-align:right;">
            <input type="number" class="form-control palier-coeff" data-index="${i}"
              value="${Math.round(p.coeff * 100)}" min="0" max="100" step="1"
              style="max-width:75px;padding:4px 6px;text-align:right;display:inline-block;">&nbsp;%
          </td>
          <td style="text-align:right;">
            <input type="number" class="input-sm palier-prixbase" data-palier="${i}"
              value="${p.prixBase != null ? p.prixBase : ''}" min="0" step="1"
              placeholder="${Engine.fmt(Engine.round2(tarifBase * p.coeff))}"
              title="Prix/jour fixe (vide = tarif × coeff)">
          </td>
          <td style="text-align:right;font-weight:600;" class="palier-prix-jour" data-idx="${i}">${Engine.fmt(prixJour)}</td>
        </tr>`;
      }).join('');

      const ponctuelCoeff  = paliers[0] ? paliers[0].coeff : 1;
      const demiPrixPonctuel = Engine.round2(tarifBase * ponctuelCoeff * demiCoeff);

      const zoneRows = zones.map((z, i) => `<tr>
        <td style="color:var(--text-muted);font-size:0.82rem;font-weight:600;">${escapeHTML(z.id.toUpperCase())}</td>
        <td>${escapeHTML(z.label)}</td>
        <td style="text-align:right;">
          ${z.surplusParJour === null
            ? '<span class="tag tag-neutral" style="font-size:0.75rem;">Sur devis</span>'
            : `<input type="number" class="form-control zone-surplus" data-index="${i}"
                 value="${z.surplusParJour}" min="0" step="any"
                 style="max-width:110px;padding:4px 6px;text-align:right;display:inline-block;">&nbsp;\u20ac/j`
          }
        </td>
      </tr>`).join('');

      function numFieldD(id, val, step) {
        return `<input type="number" id="${id}" class="form-control" value="${val}" min="0" step="${step || 'any'}" style="max-width:130px;padding:4px 8px;text-align:right;">`;
      }

      return `
        <div class="card" id="section-pricing-catalog">
          <div class="card-header">
            <h2>Catalogue tarifaire</h2>
          </div>

          <!-- A. Tarif de référence -->
          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">A. Tarif de r\u00e9f\u00e9rence</h3>
          <div class="form-row" style="margin-bottom:8px;">
            <div class="form-group">
              <label for="pc-tarif-journee-base">Tarif journ\u00e9e plein tarif (\u20ac\u00a0HT)</label>
              <input type="number" id="pc-tarif-journee-base" class="form-control" value="${tarifBase}" min="0" step="any" style="max-width:180px;">
            </div>
            <div class="form-group">
              <label for="pc-demi-coeff">Coefficient demi-journ\u00e9e</label>
              <input type="number" id="pc-demi-coeff" class="form-control" value="${demiCoeff}" min="0" max="1" step="0.01" style="max-width:120px;">
              <span class="form-help">Ex\u00a0: 0.70 = 70\u00a0% du tarif journ\u00e9e</span>
            </div>
          </div>
          <div class="flex gap-12 mb-16" style="flex-wrap:wrap;align-items:center;">
            <span class="text-muted" style="font-size:0.83rem;">
              Demi-journ\u00e9e\u00a0=\u00a0<strong id="pc-demi-journee-display">${Engine.fmt(Engine.round2(tarifBase * demiCoeff))}</strong>\u00a0\u20ac\u00a0HT
            </span>
            <span class="tag ${seuilOk ? 'tag-green' : 'tag-red'}" id="pc-seuil-tag" style="font-size:0.77rem;">
              Seuil plancher\u00a0: ${Engine.fmt(seuilPlancher)}\u00a0\u2014\u00a0${seuilOk ? 'Couvert' : '\u26a0\u00a0Insuffisant'}
            </span>
          </div>

          <!-- B. Paliers tarifaires -->
          <h3 style="margin:0 0 8px;font-size:0.88rem;color:var(--text-heading);">B. Paliers tarifaires</h3>
          <div class="data-table-wrap" style="margin-bottom:8px;">
            <table class="data-table" style="font-size:0.85rem;">
              <thead>
                <tr>
                  <th>Palier</th>
                  <th style="text-align:center;">Min\u00a0j</th>
                  <th style="text-align:center;">Max\u00a0j</th>
                  <th style="text-align:right;">Coeff\u00a0(%)</th>
                  <th style="text-align:right;" title="Prix fixe optionnel — remplace tarif\u00a0×\u00a0coeff">Prix fixe\u00a0\u20ac</th>
                  <th style="text-align:right;">Prix/jour\u00a0\u20ac</th>
                </tr>
              </thead>
              <tbody>${palierRows}</tbody>
            </table>
          </div>
          <p class="form-help" style="margin-bottom:20px;">
            Prix demi-journ\u00e9e Ponctuel\u00a0:
            <strong id="pc-ponctuel-demi-prix">${Engine.fmt(demiPrixPonctuel)}</strong>\u00a0\u20ac\u00a0HT
          </p>

          <!-- C. Zones géographiques -->
          <h3 style="margin:0 0 8px;font-size:0.88rem;color:var(--text-heading);">C. Zones g\u00e9ographiques</h3>
          <p class="form-help" style="margin-bottom:8px;">Surco\u00fbt fixe par jour d\u2019intervention au-del\u00e0 de la zone incluse.</p>
          <div class="data-table-wrap" style="margin-bottom:20px;">
            <table class="data-table" style="font-size:0.85rem;">
              <thead><tr><th>Zone</th><th>Libell\u00e9</th><th style="text-align:right;">Surco\u00fbt/jour</th></tr></thead>
              <tbody>${zoneRows}</tbody>
            </table>
          </div>

          <!-- D. Conditions commerciales -->
          <h3 style="margin:0 0 8px;font-size:0.88rem;color:var(--text-heading);">D. Conditions commerciales</h3>
          <div class="data-table-wrap">
            <table class="data-table" style="font-size:0.85rem;">
              <thead><tr><th>Param\u00e8tre</th><th style="width:160px;text-align:right;">Valeur</th></tr></thead>
              <tbody>
                <tr><td>Remise fid\u00e9lit\u00e9 reconduction (%)</td><td style="text-align:right;">${numFieldD('pc-remise-fidelite', pc.remiseFidelitePourcent || 5)}</td></tr>
                <tr><td>Remise max autoris\u00e9e (%)</td><td style="text-align:right;">${numFieldD('pc-remise-max', pc.remiseMaxAutorisee || 20)}</td></tr>
                <tr><td>Validit\u00e9 devis (jours)</td><td style="text-align:right;">${numFieldD('pc-validite-devis', pc.validiteDevisJours || 30, 1)}</td></tr>
                <tr><td>Acompte \u00e0 la commande (%)</td><td style="text-align:right;">${numFieldD('pc-acompte', pc.acomptePercent || 30)}</td></tr>
                <tr><td>D\u00e9lai de paiement (jours)</td><td style="text-align:right;">${numFieldD('pc-paiement-delai', pc.paiementDelaiJours || 30, 1)}</td></tr>
              </tbody>
            </table>
          </div>

          <!-- F. Segments complémentaires -->
          <h3 style="margin:20px 0 8px;font-size:0.88rem;color:var(--text-heading);">F. Segments compl\u00e9mentaires</h3>

          <!-- F1. Grand Compte Itinérant -->
          <h4 style="margin:0 0 6px;font-size:0.83rem;color:var(--text-muted);font-weight:600;">F1. Grand Compte Itin\u00e9rant</h4>
          <div class="data-table-wrap" style="margin-bottom:8px;">
            <table class="data-table" style="font-size:0.85rem;">
              <thead><tr><th>Palier</th><th>Volume (jours/an)</th><th style="text-align:right;">Tarif/jour&nbsp;\u20ac</th></tr></thead>
              <tbody>${gcPaliers.map((p, i) => `<tr>
                <td style="font-weight:600;">${escapeHTML(p.label)}</td>
                <td style="color:var(--text-muted);">${p.volumeMin}\u2013${p.volumeMax === 9999 ? '150+' : p.volumeMax}</td>
                <td style="text-align:right;"><input type="number" class="form-control gc-tarif-jour" data-index="${i}" value="${p.tarifJour}" min="0" step="any" style="max-width:110px;padding:4px 6px;text-align:right;display:inline-block;">&nbsp;\u20ac</td>
              </tr>`).join('')}</tbody>
            </table>
          </div>
          <div style="margin-bottom:16px;font-size:0.82rem;">
            <div style="color:var(--text-muted);margin-bottom:4px;">\u00c0 titre indicatif \u2014 marge estim\u00e9e par palier (vs seuil plancher\u00a0: ${Engine.fmt(seuilPlancher)})\u00a0:</div>
            ${gcPaliers.map(p => {
              const mg  = Engine.round2(p.tarifJour - seuilPlancher);
              const pct = p.tarifJour > 0 ? Engine.round2((mg / p.tarifJour) * 100) : 0;
              const col = mg < 0 ? '#d32f2f' : (pct < (state.targetMarginPercent || 30) ? '#f57c00' : '#2e7d32');
              return `<div style="color:${col};">${escapeHTML(p.label)}\u00a0: ${Engine.fmt(p.tarifJour)} &minus; ${Engine.fmt(seuilPlancher)} = <strong>${Engine.fmt(mg)}</strong> (${pct}\u00a0%)</div>`;
            }).join('')}
          </div>

          <!-- F2. B2B -->
          <h4 style="margin:0 0 8px;font-size:0.83rem;color:var(--text-muted);font-weight:600;">F2. B2B \u2014 Entreprise / Team Building</h4>
          <div class="form-row" style="margin-bottom:16px;">
            <div class="form-group">
              <label for="pc-b2b-journee">Journ\u00e9e compl\u00e8te B2B (\u20ac&nbsp;HT)</label>
              <input type="number" id="pc-b2b-journee" class="form-control" value="${b2bCfg.tarifJourneeComplete || 2400}" min="0" step="any" style="max-width:160px;">
            </div>
            <div class="form-group">
              <label for="pc-b2b-demi">Demi-journ\u00e9e B2B (\u20ac&nbsp;HT)</label>
              <input type="number" id="pc-b2b-demi" class="form-control" value="${b2bCfg.tarifDemiJournee || 1500}" min="0" step="any" style="max-width:160px;">
            </div>
          </div>

          <!-- F3. B2C / Événementiel -->
          <h4 style="margin:0 0 8px;font-size:0.83rem;color:var(--text-muted);font-weight:600;">F3. B2C / \u00c9v\u00e9nementiel</h4>
          <div class="form-row" style="flex-wrap:wrap;margin-bottom:8px;">
            <div class="form-group">
              <label for="pc-b2c-2h">Forfait 2h \u2014 groupe (\u20ac&nbsp;HT)</label>
              <input type="number" id="pc-b2c-2h" class="form-control" value="${b2cCfg.forfait2h || 800}" min="0" step="any" style="max-width:140px;">
            </div>
            <div class="form-group">
              <label for="pc-b2c-3h">Forfait 3h \u2014 groupe (\u20ac&nbsp;HT)</label>
              <input type="number" id="pc-b2c-3h" class="form-control" value="${b2cCfg.forfait3h || 1100}" min="0" step="any" style="max-width:140px;">
            </div>
            <div class="form-group">
              <label for="pc-b2c-4h">Forfait 4h \u2014 groupe (\u20ac&nbsp;HT)</label>
              <input type="number" id="pc-b2c-4h" class="form-control" value="${b2cCfg.forfait4h || 1400}" min="0" step="any" style="max-width:140px;">
            </div>
            <div class="form-group">
              <label for="pc-b2c-groupe">Capacit\u00e9 groupe max (pers.)</label>
              <input type="number" id="pc-b2c-groupe" class="form-control" value="${b2cCfg.capaciteGroupe || 10}" min="1" step="1" style="max-width:120px;">
            </div>
          </div>
        </div>`;
    }

    /** Section 7b — Conditions de règlement */
    function renderPaiement() {
      const p = state.paiement || {};
      const schemasActifs = Array.isArray(p.schemasActifs) ? p.schemasActifs : ['ponctuel', 'trimestriel', 'semestriel', 'annuel', 'b2c'];
      const schemaParSegment = p.schemaParSegment || { institutionnel: 'trimestriel', grand_compte: 'semestriel', b2b: 'ponctuel', b2c: 'b2c' };

      const ALL_SCHEMAS = [
        { id: 'ponctuel',     label: 'Ponctuel (acompte + solde)' },
        { id: 'trimestriel',  label: 'Trimestriel (4 \u00d7 25\u00a0%)' },
        { id: 'semestriel',   label: 'Semestriel (2 \u00d7 50\u00a0%)' },
        { id: 'annuel',       label: 'Annuel (100\u00a0%)' },
        { id: 'b2c',          label: 'B2C (100\u00a0% avant prestation)' }
      ];

      const SEGMENTS = [
        { id: 'institutionnel', label: 'Institutionnel' },
        { id: 'grand_compte',   label: 'Grand Compte' },
        { id: 'b2b',            label: 'B2B' },
        { id: 'b2c',            label: 'B2C' }
      ];

      function chk(id, val) {
        return `<input type="checkbox" id="${id}" ${val ? 'checked' : ''}>`;
      }

      const schemaCheckboxes = ALL_SCHEMAS.map(s => `
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin-bottom:6px;">
          <input type="checkbox" class="pai-schema-chk" data-schema="${s.id}" ${schemasActifs.includes(s.id) ? 'checked' : ''}>
          <span>${s.label}</span>
        </label>`).join('');

      const segmentSelects = SEGMENTS.map(seg => {
        const opts = ALL_SCHEMAS.map(s => `<option value="${s.id}" ${schemaParSegment[seg.id] === s.id ? 'selected' : ''}>${s.label}</option>`).join('');
        return `<div class="form-group">
          <label>Schéma par défaut — ${seg.label}</label>
          <select id="pai-seg-${seg.id}" class="form-control pai-seg-select" data-segment="${seg.id}" style="max-width:280px;">${opts}</select>
        </div>`;
      }).join('');

      return `
        <div class="card" id="section-paiement">
          <div class="card-header">
            <h2>Conditions de r\u00e8glement</h2>
          </div>
          <p class="form-help" style="margin-bottom:16px;">
            Ces param\u00e8tres s'appliquent automatiquement dans vos devis, factures et le planning.
          </p>

          <!-- A. Sch\u00e9mas actifs -->
          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">A. Sch\u00e9mas d'\u00e9ch\u00e9ancier disponibles</h3>
          <p class="form-help" style="margin-bottom:10px;">Cochez les sch\u00e9mas propos\u00e9s lors de la cr\u00e9ation d'un devis.</p>
          <div style="margin-bottom:16px;">
            ${schemaCheckboxes}
          </div>

          <!-- B. Sch\u00e9ma par d\u00e9faut selon le segment -->
          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">B. Sch\u00e9ma par d\u00e9faut par segment</h3>
          <div class="form-row" style="flex-wrap:wrap;margin-bottom:16px;">
            ${segmentSelects}
          </div>

          <!-- C. Acompte &amp; D\u00e9lais -->
          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">C. Acompte &amp; D\u00e9lais</h3>
          <div class="form-row" style="flex-wrap:wrap;margin-bottom:8px;">
            <div class="form-group">
              <label for="pai-acompte-pct">Acompte demand\u00e9 (%)</label>
              <input type="number" id="pai-acompte-pct" class="form-control" value="${p.acomptePercent ?? 30}" min="0" max="100" step="1" style="max-width:130px;">
            </div>
            <div class="form-group" style="align-self:flex-end;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                ${chk('pai-acompte-oblig', p.acompteObligatoire ?? true)}
                <span>Acompte obligatoire</span>
              </label>
            </div>
            <div class="form-group">
              <label for="pai-delai-solde">D\u00e9lai de paiement solde (jours)</label>
              <input type="number" id="pai-delai-solde" class="form-control" value="${p.delaiSoldeJours ?? p.delaiSoldJours ?? 30}" min="1" step="1" style="max-width:130px;">
            </div>
            <div class="form-group">
              <label for="pai-penalite-pct">Taux p\u00e9nalit\u00e9s retard (%)</label>
              <input type="number" id="pai-penalite-pct" class="form-control" value="${p.penaliteRetardPercent ?? 3}" min="0" step="0.01" style="max-width:130px;">
            </div>
            <div class="form-group">
              <label for="pai-indemnite">Indemnit\u00e9 forfaitaire (\u20ac)</label>
              <input type="number" id="pai-indemnite" class="form-control" value="${p.indemniteForfaitaire ?? 40}" min="0" step="1" style="max-width:130px;">
            </div>
          </div>

          <!-- D. Blocage automatique -->
          <h3 style="margin:16px 0 10px;font-size:0.88rem;color:var(--text-heading);">D. Blocage automatique</h3>
          <div class="form-group" style="margin-bottom:16px;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
              ${chk('pai-blocage-impaye', p.blocageSessionSiImpaye ?? true)}
              <span>Bloquer les sessions si impay\u00e9</span>
            </label>
            <span class="form-help" style="margin-top:4px;">Si activ\u00e9, toute session planifi\u00e9e pour un client avec facture en retard affiche une alerte rouge dans le planning.</span>
          </div>

          <!-- E. Messages contractuels -->
          <h3 style="margin:0 0 10px;font-size:0.88rem;color:var(--text-heading);">E. Messages contractuels</h3>
          <p class="form-help" style="margin-bottom:12px;">Ces messages s'affichent automatiquement en bas de vos devis et factures.</p>
          <div class="form-group" style="margin-bottom:12px;">
            <label for="pai-msg-acompte">Message acompte (institutionnel / B2B)</label>
            <textarea id="pai-msg-acompte" class="form-control" rows="3">${escapeHTML(p.messageAcompte || '')}</textarea>
          </div>
          <div class="form-group" style="margin-bottom:12px;">
            <label for="pai-msg-solde">Message conditions solde</label>
            <textarea id="pai-msg-solde" class="form-control" rows="3">${escapeHTML(p.messageSolde || '')}</textarea>
          </div>
          <div class="form-group">
            <label for="pai-msg-b2c">Message paiement B2C</label>
            <textarea id="pai-msg-b2c" class="form-control" rows="2">${escapeHTML(p.messageB2C || '')}</textarea>
          </div>
        </div>`;
    }

    /** Section 8 — Données (export / import / reset) */
    function renderData() {
      return `
        <div class="card" id="section-data">
          <div class="card-header">
            <h2>Données</h2>
          </div>
          <div class="alert alert-info mb-16">
            <span class="alert-icon">&#9432;</span>
            <span>L'export génère un fichier JSON contenant toutes les données de l'application (paramètres, clients, opérateurs, sessions, etc.).</span>
          </div>
          <div class="flex gap-12" style="flex-wrap:wrap">
            <button class="btn" id="btn-export">Exporter toutes les données (JSON)</button>
            <label class="btn" style="cursor:pointer">
              Importer des données (JSON)
              <input type="file" id="input-import" accept=".json,application/json" style="display:none">
            </label>
            <button class="btn btn-warning" id="btn-reset">Réinitialiser toutes les données</button>
          </div>
          <div id="data-feedback" class="mt-16"></div>
        </div>`;
    }

    /* ----------------------------------------------------------
       Assemblage de la page
       ---------------------------------------------------------- */
    container.innerHTML = `
      <div class="page-header">
        <h1>Paramètres</h1>
        <div class="actions">
          <span id="settings-dirty-badge" class="tag tag-yellow" style="display:none;">&#9888; Modifications non sauvegardées</span>
          <button class="btn btn-primary" id="btn-save-settings">Enregistrer les paramètres</button>
        </div>
      </div>

      ${renderEntreprise()}

      ${renderSummary()}

      <div class="alert alert-warning mb-16">
        <span class="alert-icon">&#9888;</span>
        <span>Les modifications ne sont prises en compte qu'après avoir cliqué sur <strong>Enregistrer</strong>.</span>
      </div>

      ${renderCoutJournee()}

      ${renderPricingCatalog()}

      ${renderPaiement()}

      ${renderCapacite()}

      ${renderHR()}

      ${renderRHStrategy()}

      ${renderEconomic()}

      ${renderChargesSociales()}

      ${renderTypes()}

      ${renderData()}

      <!-- Modale de confirmation de réinitialisation -->
      <div id="modal-reset-overlay" class="modal-overlay hidden">
        <div class="modal" style="max-width:480px">
          <div class="modal-header">
            <h2>Confirmer la réinitialisation</h2>
            <button class="btn btn-sm btn-ghost" id="modal-reset-close">&times;</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom:12px">Cette action va <strong>supprimer définitivement toutes les données</strong> de l'application :</p>
            <ul style="margin-left:18px;margin-bottom:16px;color:var(--text-secondary)">
              <li>Clients, opérateurs, sessions, offres, modules, lieux</li>
              <li>Tous les paramètres seront restaurés aux valeurs par défaut</li>
            </ul>
            <div class="form-group">
              <label for="reset-confirm-input">Tapez <strong style="color:var(--accent-red-light)">SUPPRIMER</strong> pour confirmer</label>
              <input type="text" id="reset-confirm-input" class="form-control" placeholder="SUPPRIMER" autocomplete="off">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn" id="modal-reset-cancel">Annuler</button>
            <button class="btn btn-warning" id="modal-reset-confirm" disabled>Réinitialiser</button>
          </div>
        </div>
      </div>
    `;

    /* ----------------------------------------------------------
       Raccourcis vers les éléments du DOM
       ---------------------------------------------------------- */
    const $  = (sel) => container.querySelector(sel);
    const $$ = (sel) => container.querySelectorAll(sel);

    /* ----------------------------------------------------------
       Fonctions de mise à jour partielle (sans re-render complet)
       ---------------------------------------------------------- */

    /** Met à jour les KPI du résumé */
    function refreshTotals() {
      const kpis = $$('.kpi-card .kpi-value');
      if (kpis.length >= 3) {
        kpis[2].textContent = state.targetMarginPercent + ' %';
      }
    }

    /** Recharge une section de liste éditable et réattache les listeners */
    function reRenderSection(sectionId, renderFn) {
      const wrapper = $('#section-' + sectionId);
      if (!wrapper) return;
      const tmp = document.createElement('div');
      tmp.innerHTML = renderFn();
      const newCard = tmp.firstElementChild;
      wrapper.replaceWith(newCard);
      attachListEditListeners();
      refreshTotals();
    }

    /* ----------------------------------------------------------
       Collecte des valeurs depuis le DOM → state
       ---------------------------------------------------------- */

    function syncScalarsFromDOM() {
      state.employerChargeRate       = parseFloat($('#rh-employer-charge').value) || 0;
      state.interimCoefficient       = parseFloat($('#rh-interim-coeff').value) || 1;
      state.freelanceChargeRate      = parseFloat($('#rh-freelance-charge').value) || 0;
      state.estimatedOperatorsPerSession = parseInt($('#rh-operators-per-session').value, 10) || 1;
      state.operatorOverloadThreshold = parseInt($('#rh-overload').value, 10) || 1;
      state.cdiThreshold             = parseInt($('#rh-cdi-threshold').value, 10) || 1;
      state.targetMarginPercent      = parseFloat($('#eco-target-margin').value) || 0;
      state.marginAlertThreshold     = parseFloat($('#eco-margin-alert').value) || 0;
      state.vatRate                  = parseFloat($('#eco-vat').value) || 0;
      state.hoursPerDay              = parseFloat($('#eco-hours-day').value) || 7;
      state.estimatedAnnualSessions  = parseInt($('#eco-est-sessions').value, 10) || 1;
      state.nbJoursObjectifAnnuel    = parseInt($('#eco-nb-jours').value, 10) || 50;
      state.floorPriceMargin         = parseFloat($('#eco-floor-margin').value) || 5;
      state.operatorDependencyRiskThreshold = parseFloat($('#eco-dep-risk').value) || 40;
      state.urssafRequalificationDays = parseInt($('#eco-urssaf-days').value, 10) || 45;

      // Mettre à jour l'affichage du seuil plancher auto-calculé
      const seuilEl = $('#eco-seuil-plancher');
      if (seuilEl) seuilEl.textContent = Engine.fmt(Engine.calculateSeuilPlancher(state));

      // Synchroniser chargesConfig depuis le DOM
      syncChargesConfigFromDOM();
    }

    function syncChargesConfigFromDOM() {
      const cc = state.chargesConfig;
      if (!cc) return;

      // Paramètres généraux
      const elPass = $('#cc-pass');
      const elSmic = $('#cc-smic');
      const elJours = $('#cc-jours');
      const elEffectif = $('#cc-effectif');
      if (elPass) cc.passAnnuel = parseFloat(elPass.value) || 47100;
      if (elSmic) cc.smicMensuelBrut = parseFloat(elSmic.value) || 1801.80;
      if (elJours) cc.joursOuvresAn = parseInt(elJours.value, 10) || 218;
      if (elEffectif) cc.effectif = elEffectif.value;

      // Taux patronales
      $$('.cp-taux').forEach(input => {
        const idx = parseInt(input.dataset.index, 10);
        if (cc.patronales[idx]) cc.patronales[idx].taux = parseFloat(input.value) || 0;
      });

      // Taux salariales
      $$('.cs-taux').forEach(input => {
        const idx = parseInt(input.dataset.index, 10);
        if (cc.salariales[idx]) cc.salariales[idx].taux = parseFloat(input.value) || 0;
      });

      // Spécificités par statut
      const elCddPrec = $('#cc-cdd-precarite');
      const elCddCp = $('#cc-cdd-cp');
      const elIntCoeff = $('#cc-interim-coeff');
      const elFreelTaux = $('#cc-freelance-taux');
      const elFondRegime = $('#cc-fondateur-regime');
      const elFondTNS = $('#cc-fondateur-tns');

      if (elCddPrec && cc.cdd) cc.cdd.primePrecarite = parseFloat(elCddPrec.value) || 10;
      if (elCddCp && cc.cdd) cc.cdd.indemniteCP = parseFloat(elCddCp.value) || 10;
      if (elIntCoeff && cc.interim) cc.interim.coefficientAgence = parseFloat(elIntCoeff.value) || 2.0;
      if (elFreelTaux && cc.freelance) cc.freelance.tauxCharges = parseFloat(elFreelTaux.value) || 21.1;
      if (elFondRegime && cc.fondateur) cc.fondateur.regime = elFondRegime.value;
      if (elFondTNS && cc.fondateur) cc.fondateur.tauxTNS = parseFloat(elFondTNS.value) || 45;
    }

    function syncPricingCatalogFromDOM() {
      const pc = state.pricingCatalog;

      // Scalaires
      const elBase = $('#pc-tarif-journee-base');
      if (elBase) pc.tarifJourneeBase = parseFloat(elBase.value) || 0;
      const elDemiCoeff = $('#pc-demi-coeff');
      if (elDemiCoeff) pc.tarifDemiJourneeCoeff = parseFloat(elDemiCoeff.value) || 0.70;

      // Paliers : coeff (en % → ratio) + volumeMin/volumeMax éditables
      if (Array.isArray(pc.paliers)) {
        $$('.palier-coeff').forEach(input => {
          const i = parseInt(input.dataset.index, 10);
          if (pc.paliers[i] !== undefined) {
            pc.paliers[i].coeff = (parseFloat(input.value) || 0) / 100;
          }
        });
        $$('.palier-minj').forEach(input => {
          const i = parseInt(input.dataset.palier, 10);
          if (pc.paliers[i] !== undefined) {
            pc.paliers[i].volumeMin = parseInt(input.value, 10) || 1;
          }
        });
        $$('.palier-maxj').forEach(input => {
          const i = parseInt(input.dataset.palier, 10);
          if (pc.paliers[i] !== undefined) {
            pc.paliers[i].volumeMax = parseInt(input.value, 10) || 9999;
          }
        });
        $$('.palier-prixbase').forEach(input => {
          const i = parseInt(input.dataset.palier, 10);
          if (pc.paliers[i] !== undefined) {
            const v = input.value.trim();
            pc.paliers[i].prixBase = v !== '' ? (parseFloat(v) || 0) : null;
          }
        });
      }

      // Zones : surplusParJour (zone4 reste null — pas d'input)
      if (Array.isArray(pc.zones)) {
        $$('.zone-surplus').forEach(input => {
          const i = parseInt(input.dataset.index, 10);
          if (pc.zones[i] !== undefined) {
            pc.zones[i].surplusParJour = parseFloat(input.value) || 0;
          }
        });
      }

      // Conditions commerciales
      [
        ['pc-remise-fidelite', 'remiseFidelitePourcent'],
        ['pc-remise-max',      'remiseMaxAutorisee'],
        ['pc-validite-devis',  'validiteDevisJours'],
        ['pc-acompte',         'acomptePercent'],
        ['pc-paiement-delai',  'paiementDelaiJours']
      ].forEach(([id, key]) => {
        const el = $('#' + id);
        if (el) pc[key] = parseFloat(el.value) || 0;
      });

      // GC paliers tarif/jour
      if (Array.isArray(pc.paliersGrandCompte)) {
        $$('.gc-tarif-jour').forEach(input => {
          const i = parseInt(input.dataset.index, 10);
          if (pc.paliersGrandCompte[i]) pc.paliersGrandCompte[i].tarifJour = parseFloat(input.value) || 0;
        });
      }
      // B2B
      if (!pc.b2b) pc.b2b = {};
      const _b2bJ = $('#pc-b2b-journee'); if (_b2bJ) pc.b2b.tarifJourneeComplete = parseFloat(_b2bJ.value) || 0;
      const _b2bD = $('#pc-b2b-demi');    if (_b2bD) pc.b2b.tarifDemiJournee     = parseFloat(_b2bD.value) || 0;
      // B2C
      if (!pc.b2c) pc.b2c = {};
      [['pc-b2c-2h','forfait2h'],['pc-b2c-3h','forfait3h'],['pc-b2c-4h','forfait4h'],['pc-b2c-groupe','capaciteGroupe']].forEach(([id, key]) => {
        const el = $('#' + id); if (el) pc.b2c[key] = parseFloat(el.value) || 0;
      });
    }

    function syncCoutJourneeFromDOM() {
      const cj = state.coutJournee;
      const f  = (id, fallback) => {
        const el = $('#' + id);
        return el ? (parseFloat(el.value) || fallback) : fallback;
      };
      cj.coutOperateurJour         = f('cj-cout-operateur',   0);
      cj.prixSimulateur             = f('cj-prix-simu',        0);
      cj.dureeAmortissementAns      = Math.max(f('cj-duree-amort', 7), 1);
      cj.consommablesJour           = f('cj-consommables',     0);
      cj.rcProAnnuelle              = f('cj-rc-pro',           0);
      cj.assurancesMaterielAnnuelle = f('cj-assur-materiel',   0);
      cj.deplacementMoyenKm         = f('cj-km',               0);
      cj.tarifKm                    = f('cj-tarif-km',         0.53);
      cj.peagesAllerRetour          = f('cj-peages',           0);
      cj.fraisStationnement         = f('cj-parking',          0);
      cj.expertComptableAnnuel      = f('cj-expert-comptable', 0);
      cj.fraisBancairesAnnuels      = f('cj-frais-bancaires',  0);
      cj.autresFraisAdminAnnuels    = f('cj-autres-admin',     0);
      cj.nbJoursFacturesAn          = Math.max(f('cj-nb-jours', 100), 1);
      cj.ratioTempsNonFacturable    = f('cj-tnf',              40);
      cj.margeSecuritePourcent      = f('cj-marge-secu',       5);
    }

    /** Recalcule et met à jour le récapitulatif coût journée en temps réel */
    function refreshCoutJourneeRecap() {
      syncCoutJourneeFromDOM();
      const cj = state.coutJournee;
      const nb = Math.max(cj.nbJoursFacturesAn || 100, 1);

      // Mettre à jour les affichages intermédiaires
      const amortSimu   = cj.prixSimulateur
        ? Engine.round2((cj.prixSimulateur / (cj.dureeAmortissementAns || 7)) / nb) : 0;
      const fraisKm     = (cj.deplacementMoyenKm || 0) * (cj.tarifKm || 0.53);
      const deplacement = Engine.round2(fraisKm + (cj.peagesAllerRetour || 0) + (cj.fraisStationnement || 0));

      const nbDispEl = $('#cj-nb-jours-display');
      if (nbDispEl) nbDispEl.textContent = nb;
      const amortEl = $('#cj-amort-display');
      if (amortEl) amortEl.textContent = Engine.fmt(amortSimu);
      const deplEl  = $('#cj-deplacement-display');
      if (deplEl) deplEl.textContent = Engine.fmt(deplacement);

      // Mettre à jour le tableau récapitulatif
      const recapDiv = $('#cj-recap');
      if (recapDiv) {
        const elBase     = $('#pc-tarif-journee-base');
        const tarifBase  = elBase ? (parseFloat(elBase.value) || 0) : (state.pricingCatalog.tarifJourneeBase || 0);
        const targetM    = parseFloat(($('#eco-target-margin') || {}).value) || state.targetMarginPercent || 30;
        const alertM     = parseFloat(($('#eco-margin-alert')  || {}).value) || state.marginAlertThreshold || 15;
        recapDiv.innerHTML = _buildCjRecapHTML(cj, tarifBase, targetM, alertM);
      }

      // Mettre à jour le tag seuil plancher dans le catalogue tarifaire
      const seuilTag = $('#pc-seuil-tag');
      if (seuilTag) {
        const seuil   = Engine.calculateSeuilPlancher(state);
        const elBase  = $('#pc-tarif-journee-base');
        const tarifPC = elBase ? (parseFloat(elBase.value) || 0) : 0;
        const ok      = tarifPC > 0 && tarifPC >= seuil;
        seuilTag.className   = 'tag ' + (ok ? 'tag-green' : 'tag-red');
        seuilTag.textContent = 'Seuil plancher\u00a0: ' + Engine.fmt(seuil) + '\u00a0\u2014\u00a0' + (ok ? 'Couvert' : '\u26a0\u00a0Insuffisant');
      }
    }

    function syncCapaciteFromDOM() {
      const cap = state.capacite;
      function fi(id, def) {
        const el = $('#' + id);
        return el ? (parseFloat(el.value) || def) : def;
      }
      function ii(id, def) {
        const el = $('#' + id);
        return el ? (parseInt(el.value, 10) || def) : def;
      }
      const nbU  = Math.max(ii('cap-nb-unites', 1), 1);
      const jMax = Math.max(ii('cap-jours-max', 150), 1);
      const alertPct = fi('cap-seuil-alerte-pct', 80);
      const critPct  = fi('cap-seuil-critique-pct', 93);
      cap.nbUnites                    = nbU;
      cap.joursMaxParUniteParAn       = jMax;
      cap.seuilAlerteJours            = Math.round(jMax * alertPct / 100);
      cap.seuilCritiqueJours          = Math.round(jMax * critPct / 100);
      cap.joursMoisCible              = ii('cap-jours-mois-cible', 13);
      cap.joursMoisMax                = ii('cap-jours-mois-max', 15);
      cap.coutSimulateurNouveauHT     = fi('cap-cout-simu', 40000);
      cap.coutRecrutementOperateur    = fi('cap-cout-recrutement', 2000);
      cap.delaiDispoNouvelleUnite     = ii('cap-delai-dispo', 90);
      cap.moisAnticipationInvestissement = ii('cap-mois-anticip', 3);

      /* Mise à jour affichages temps réel */
      const tot = $('#cap-total-display');
      if (tot) tot.textContent = nbU * jMax;
      const moy = $('#cap-mois-display');
      if (moy) moy.textContent = nbU * cap.joursMoisCible;
      const sa = $('#cap-seuil-alerte-display');
      if (sa) sa.textContent = cap.seuilAlerteJours;
      const sc = $('#cap-seuil-critique-display');
      if (sc) sc.textContent = cap.seuilCritiqueJours;
      const rt = $('#cap-recap-total');
      if (rt) rt.textContent = nbU * jMax;
      const rm = $('#cap-recap-mois');
      if (rm) rm.textContent = nbU * cap.joursMoisCible;
      const rp = $('#cap-recap-plafond');
      if (rp) rp.textContent = cap.joursMoisMax * nbU;
      const ra = $('#cap-recap-alerte');
      if (ra) ra.textContent = cap.seuilAlerteJours + '\u00a0j/an';
      const rc = $('#cap-recap-critique');
      if (rc) rc.textContent = cap.seuilCritiqueJours + '\u00a0j/an';
      const rco = $('#cap-recap-cout');
      if (rco) rco.textContent = (cap.coutSimulateurNouveauHT + cap.coutRecrutementOperateur).toLocaleString('fr-FR') + '\u00a0€';
    }

    function syncEntrepriseFromDOM() {
      const e   = state.entreprise;
      const fstr = (id) => { const el = $('#' + id); return el ? el.value.trim() : ''; };
      e.nom                  = fstr('ent-nom');
      e.formeJuridique       = fstr('ent-forme');
      e.siren                = fstr('ent-siren');
      e.siret                = fstr('ent-siret');
      e.rcs                  = fstr('ent-rcs');
      e.adresse              = fstr('ent-adresse');
      e.codePostal           = fstr('ent-cp');
      e.ville                = fstr('ent-ville');
      e.telephone            = fstr('ent-tel');
      e.email                = fstr('ent-email');
      e.siteWeb              = fstr('ent-web');
      e.mentionLegaleDevis   = fstr('ent-mention-devis');
      e.mentionLegaleFacture = fstr('ent-mention-facture');
      e.mentionRGPD          = fstr('ent-rgpd');
      e.conditionsAnnulation = fstr('ent-annulation');
      // logoPrincipalBase64/Mime, logoTexteBase64/Mime, faviconBase64/Mime
      // mis à jour directement par les FileReaders
    }

    function syncPaiementFromDOM() {
      const p = state.paiement;
      const fnum = (id, def) => { const el = $('#' + id); return el ? (parseFloat(el.value) ?? def) : def; };
      const fchk = (id, def) => { const el = $('#' + id); return el ? el.checked : def; };
      const fstr = (id) => { const el = $('#' + id); return el ? el.value.trim() : ''; };

      // A. Schémas actifs
      p.schemasActifs = [];
      $$('.pai-schema-chk').forEach(chk => { if (chk.checked) p.schemasActifs.push(chk.dataset.schema); });

      // B. Schéma par segment
      if (!p.schemaParSegment) p.schemaParSegment = {};
      $$('.pai-seg-select').forEach(sel => { p.schemaParSegment[sel.dataset.segment] = sel.value; });

      // C. Acompte & délais
      p.acomptePercent          = fnum('pai-acompte-pct', 30);
      p.acompteObligatoire      = fchk('pai-acompte-oblig', true);
      p.delaiSoldeJours         = fnum('pai-delai-solde', 30);
      p.penaliteRetardPercent   = fnum('pai-penalite-pct', 3);
      p.indemniteForfaitaire    = fnum('pai-indemnite', 40);

      // D. Blocage
      p.blocageSessionSiImpaye  = fchk('pai-blocage-impaye', true);

      // E. Messages
      p.messageAcompte          = fstr('pai-msg-acompte');
      p.messageSolde            = fstr('pai-msg-solde');
      p.messageB2C              = fstr('pai-msg-b2c');
    }

    function syncRHFromDOM() {
      const rh = state.rh;
      if (!rh.cdi) rh.cdi = {};
      const fnum = (id, def) => { const el = $('#' + id); return el ? (parseFloat(el.value) || def) : def; };
      rh.cdi.salaireBrutMensuel       = fnum('rh-cdi-salaire-brut', 2800);
      rh.cdi.chargesPatronalesPercent = fnum('rh-cdi-charges-patron', 42);
      rh.cdi.primesAnnuelles          = fnum('rh-cdi-primes', 1000);
      rh.cdi.coutRecrutement          = fnum('rh-cdi-recrutement', 3000);
      rh.cdi.avantagesNature          = fnum('rh-cdi-avantages', 0);
    }

    /** Synchronise l'intégralité du state depuis les valeurs DOM */
    function syncAllFromDOM() {
      syncScalarsFromDOM();
      syncPricingCatalogFromDOM();
      syncCoutJourneeFromDOM();
      syncCapaciteFromDOM();
      syncEntrepriseFromDOM();
      syncPaiementFromDOM();
      syncRHFromDOM();
    }

    /* ----------------------------------------------------------
       Listeners — Listes éditables (ajout, suppression, édition)
       ---------------------------------------------------------- */

    function attachListEditListeners() {

      /* --- Capacité : mise à jour temps réel --- */
      $$('.cap-field').forEach(input => {
        input.addEventListener('input', () => syncCapaciteFromDOM());
      });

      /* --- Types clients : suppression --- */
      $$('.ct-remove').forEach(span => {
        span.addEventListener('click', () => {
          const idx = parseInt(span.dataset.index, 10);
          state.clientTypes.splice(idx, 1);
          reRenderSection('types', renderTypes);
        });
      });

      /* --- Catalogue tarifaire : recalcul en temps réel --- */
      function refreshPricingCatalogCalcs() {
        const elBase     = $('#pc-tarif-journee-base');
        const elDemiCoeff = $('#pc-demi-coeff');
        if (!elBase) return;
        const tarifBase = parseFloat(elBase.value) || 0;
        const demiCoeff = elDemiCoeff ? (parseFloat(elDemiCoeff.value) || 0.70) : 0.70;
        const seuilPlancher = Engine.calculateSeuilPlancher(state);

        // Demi-journée display
        const demiEl = $('#pc-demi-journee-display');
        if (demiEl) demiEl.textContent = Engine.fmt(Engine.round2(tarifBase * demiCoeff));

        // Seuil tag
        const seuilTag = $('#pc-seuil-tag');
        if (seuilTag) {
          const ok = tarifBase > 0 && tarifBase >= seuilPlancher;
          seuilTag.className = 'tag ' + (ok ? 'tag-green' : 'tag-red');
          seuilTag.textContent = 'Seuil plancher\u00a0: ' + Engine.fmt(seuilPlancher) + '\u00a0\u2014\u00a0' + (ok ? 'Couvert' : '\u26a0\u00a0Insuffisant');
        }

        // Prix/jour par palier (prixBase fixe prioritaire, sinon tarif × coeff)
        $$('.palier-coeff').forEach(input => {
          const i = parseInt(input.dataset.index, 10);
          const coeff = (parseFloat(input.value) || 0) / 100;
          const pbEl  = container.querySelector('.palier-prixbase[data-palier="' + i + '"]');
          const pbVal = pbEl && pbEl.value.trim() !== '' ? parseFloat(pbEl.value) : null;
          const prix  = pbVal != null ? pbVal : Engine.round2(tarifBase * coeff);
          const prixEl = container.querySelector('.palier-prix-jour[data-idx="' + i + '"]');
          if (prixEl) prixEl.textContent = Engine.fmt(prix);
          if (pbEl) pbEl.placeholder = Engine.fmt(Engine.round2(tarifBase * coeff));
        });

        // Prix demi ponctuel
        const firstCoeffEl = container.querySelector('.palier-coeff[data-index="0"]');
        const firstCoeff   = firstCoeffEl ? ((parseFloat(firstCoeffEl.value) || 100) / 100) : 1;
        const demiPoncEl   = $('#pc-ponctuel-demi-prix');
        if (demiPoncEl) demiPoncEl.textContent = Engine.fmt(Engine.round2(tarifBase * firstCoeff * demiCoeff));

        // Validation overlap paliers min/max
        const maxjInputs = Array.from($$('.palier-maxj'));
        const minjInputs = Array.from($$('.palier-minj'));
        maxjInputs.forEach((maxEl, idx) => {
          const nextMinEl = minjInputs[idx + 1];
          const warnEl    = maxEl.parentElement.querySelector('.palier-overlap-warn');
          if (nextMinEl) {
            const maxV  = parseInt(maxEl.value, 10) || 0;
            const minV  = parseInt(nextMinEl.value, 10) || 0;
            const clash = maxV >= minV;
            maxEl.style.borderColor = clash ? '#d32f2f' : '';
            if (warnEl) {
              warnEl.style.display = clash ? '' : 'none';
            } else if (clash) {
              const div = document.createElement('div');
              div.className = 'palier-overlap-warn';
              div.style.cssText = 'color:#d32f2f;font-size:0.75rem;white-space:nowrap;';
              div.textContent = '⚠ Chevauchement';
              maxEl.parentElement.appendChild(div);
            }
          }
        });

        // Mettre à jour la marge brute dans le récapitulatif coût journée
        refreshCoutJourneeRecap();
      }

      const pcBaseEl = $('#pc-tarif-journee-base');
      const pcDemiEl = $('#pc-demi-coeff');
      if (pcBaseEl) pcBaseEl.addEventListener('input', refreshPricingCatalogCalcs);
      if (pcDemiEl) pcDemiEl.addEventListener('input', refreshPricingCatalogCalcs);
      $$('.palier-coeff').forEach(inp => inp.addEventListener('input', refreshPricingCatalogCalcs));
      $$('.palier-minj, .palier-maxj, .palier-prixbase').forEach(inp => inp.addEventListener('input', refreshPricingCatalogCalcs));

      // Segment F : GC / B2B / B2C
      $$('.gc-tarif-jour, #pc-b2b-journee, #pc-b2b-demi, #pc-b2c-2h, #pc-b2c-3h, #pc-b2c-4h, #pc-b2c-groupe').forEach(inp => {
        if (inp) inp.addEventListener('input', () => syncPricingCatalogFromDOM());
      });

      /* --- Coût journée réel : recalcul en temps réel --- */
      $$('.cj-field').forEach(inp => {
        inp.addEventListener('input', refreshCoutJourneeRecap);
      });

      /* --- Simulateur CDI/Freelance : recalcul en temps réel --- */
      function refreshRHSimulator() {
        syncRHFromDOM();
        const sliderEl = $('#rh-sim-jours');
        const nbJours  = sliderEl ? parseInt(sliderEl.value, 10) || 1 : 1;

        const dispEl = $('#rh-sim-jours-display');
        if (dispEl) dispEl.textContent = nbJours + 'j';

        const sim = Engine.calculateComparaisonRH(state, nbJours);
        const bgC = sim.recommandation === 'CDI' ? 'rgba(45,212,160,0.08)' : 'rgba(59,130,246,0.08)';
        const recoClass = sim.recommandation === 'CDI' ? 'tag-green' : 'tag-blue';

        const resDiv = $('#rh-sim-result');
        if (resDiv) resDiv.style.background = bgC;

        function setText(id, val) { const el = $('#' + id); if (el) el.textContent = val; }
        setText('rh-r-jours',          nbJours);
        setText('rh-r-freelance-j',    Engine.fmt(sim.coutJourFreelance) + '/j');
        setText('rh-r-freelance-nb',   nbJours);
        setText('rh-r-freelance-total',Engine.fmt(sim.totalFreelance));
        setText('rh-r-cdi-annuel',     Engine.fmt(sim.coutCDIAnnuel) + '/an');
        setText('rh-r-cdi-total',      Engine.fmt(sim.coutCDIPourNbJours));
        setText('rh-r-bascule',        sim.pointBasculejours);
        setText('rh-r-economie',       Engine.fmt(sim.economie));

        const recoEl = $('#rh-r-reco');
        if (recoEl) { recoEl.textContent = sim.recommandation; recoEl.className = 'tag ' + recoClass; }
      }

      const sliderRH = $('#rh-sim-jours');
      if (sliderRH) sliderRH.addEventListener('input', refreshRHSimulator);
      $$('.rh-cdi-field').forEach(inp => inp.addEventListener('input', refreshRHSimulator));

      /* --- Bouton sauvegarde CDI --- */
      const btnSaveRHCdi = $('#btn-save-rh-cdi');
      if (btnSaveRHCdi) {
        btnSaveRHCdi.addEventListener('click', () => {
          syncRHFromDOM();
          const current = DB.settings.get();
          current.rh = state.rh;
          DB.settings.set(current);
          Toast.show('Paramètres CDI sauvegardés.', 'success');
        });
      }
    }

    /* ----------------------------------------------------------
       Listeners — Boutons d'ajout de lignes
       ---------------------------------------------------------- */

    function attachAddButtons() {

      /* Ajout type client */
      const btnAddCT = $('#btn-add-client-type');
      if (btnAddCT) {
        btnAddCT.addEventListener('click', addClientType);
      }
      const inputCT = $('#input-new-client-type');
      if (inputCT) {
        inputCT.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); addClientType(); }
        });
      }
    }

    function addClientType() {
      const input = $('#input-new-client-type');
      if (!input) return;
      const val = input.value.trim();
      if (!val) return;
      if (state.clientTypes.includes(val)) {
        input.value = '';
        return;
      }
      state.clientTypes.push(val);
      input.value = '';
      reRenderSection('types', renderTypes);
      attachAddButtons();
    }

    /* ----------------------------------------------------------
       Listeners — Logo et identité entreprise
       ---------------------------------------------------------- */

    function attachEntrepriseListeners() {
      // Délégation générique pour les 3 zones de logo
      const logoConfigs = [
        {
          inputId:    'logo-principal-input',
          previewId:  'logo-principal-preview',
          keyB64:     'logoPrincipalBase64',
          keyMime:    'logoPrincipalMime',
          maxSize:    512000,
          imgStyle:   'max-height:80px;max-width:200px;',
          defaultSrc: '../img/logo%20principal%20DST.png'
        },
        {
          inputId:    'logo-texte-input',
          previewId:  'logo-texte-preview',
          keyB64:     'logoTexteBase64',
          keyMime:    'logoTexteMime',
          maxSize:    307200,
          imgStyle:   'max-height:60px;max-width:300px;',
          defaultSrc: '../img/logo-cerbere-or.png'
        },
        {
          inputId:    'favicon-input',
          previewId:  'favicon-preview',
          keyB64:     'faviconBase64',
          keyMime:    'faviconMime',
          maxSize:    204800,
          imgStyle:   'width:32px;height:32px;image-rendering:pixelated;',
          defaultSrc: '../img/logo-cerbere-or.png'
        }
      ];

      logoConfigs.forEach(function(cfg) {
        const fileInput = $('#' + cfg.inputId);
        const preview   = $('#' + cfg.previewId);
        if (!fileInput) return;

        fileInput.addEventListener('change', function(ev) {
          const file = ev.target.files && ev.target.files[0];
          if (!file) return;
          if (file.size > cfg.maxSize) {
            alert('Fichier trop lourd (max ' + Math.round(cfg.maxSize / 1024) + '\u00a0Ko)');
            return;
          }
          const reader = new FileReader();
          reader.onload = function(re) {
            const base64 = re.target.result;
            if (preview) preview.innerHTML = '<img src="' + base64 + '" style="' + cfg.imgStyle + '">';
            state.entreprise[cfg.keyB64]  = base64;
            state.entreprise[cfg.keyMime] = file.type;
            // Afficher le bouton Supprimer correspondant
            const removeBtn = container.querySelector('.logo-remove-btn[data-key-b64="' + cfg.keyB64 + '"]');
            if (removeBtn) removeBtn.style.display = 'inline-block';
          };
          reader.readAsDataURL(file);
        });
      });

      // Boutons "Choisir" — délégation par data-input
      $$('.logo-choose-btn').forEach(function(btn) {
        const inputEl = $('#' + btn.dataset.input);
        if (inputEl) btn.addEventListener('click', () => inputEl.click());
      });

      // Boutons "Supprimer" — délégation par data-key-b64
      $$('.logo-remove-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const keyB64  = btn.dataset.keyB64;
          const keyMime = btn.dataset.keyMime;
          const preview = $('#' + btn.dataset.preview);
          state.entreprise[keyB64]  = '';
          state.entreprise[keyMime] = '';
          const cfg = logoConfigs.find(c => c.keyB64 === keyB64);
          if (preview) {
            if (cfg && cfg.defaultSrc) {
              var fbImg = document.createElement('img');
              fbImg.src = cfg.defaultSrc;
              fbImg.style.cssText = cfg.imgStyle;
              fbImg.onerror = function() {
                preview.innerHTML = '<span style="color:var(--text-muted);font-size:0.82rem;">Aucun logo</span>';
              };
              preview.innerHTML = '';
              preview.appendChild(fbImg);
            } else {
              preview.innerHTML = '<span style="color:var(--text-muted);font-size:0.82rem;">Aucun logo</span>';
            }
          }
          btn.style.display = 'none';
          // Réinitialiser l'input file correspondant
          if (cfg) { const inp = $('#' + cfg.inputId); if (inp) inp.value = ''; }
          // Sauvegarder immédiatement et appliquer globalement
          DB.settings.update({ entreprise: state.entreprise });
          if (window._applyEntrepriseGlobale) _applyEntrepriseGlobale();
        });
      });
    }

    /* ----------------------------------------------------------
       Listeners — Paramètres scalaires (RH + éco) : rafraîchir KPI
       ---------------------------------------------------------- */

    function attachScalarListeners() {
      const scalarIds = [
        'rh-employer-charge', 'rh-interim-coeff', 'rh-freelance-charge',
        'rh-overload', 'rh-cdi-threshold',
        'eco-target-margin', 'eco-margin-alert', 'eco-vat', 'eco-est-sessions'
      ];
      scalarIds.forEach(id => {
        const el = $('#' + id);
        if (el) {
          el.addEventListener('input', () => {
            syncScalarsFromDOM();
            refreshTotals();
          });
        }
      });
    }

    /* ----------------------------------------------------------
       Listeners — Sauvegarde
       ---------------------------------------------------------- */

    function attachSaveButton() {
      const btnSave = $('#btn-save-settings');
      if (!btnSave) return;

      btnSave.addEventListener('click', () => {
        /* Synchroniser toutes les valeurs depuis le DOM */
        syncAllFromDOM();

        /* Construire l'objet de mise à jour */
        const update = {
          clientTypes:                 state.clientTypes,
          employerChargeRate:          state.employerChargeRate,
          interimCoefficient:          state.interimCoefficient,
          freelanceChargeRate:         state.freelanceChargeRate,
          estimatedOperatorsPerSession: state.estimatedOperatorsPerSession,
          operatorOverloadThreshold:   state.operatorOverloadThreshold,
          cdiThreshold:                state.cdiThreshold,
          targetMarginPercent:         state.targetMarginPercent,
          marginAlertThreshold:        state.marginAlertThreshold,
          vatRate:                     state.vatRate,
          hoursPerDay:                 state.hoursPerDay,
          estimatedAnnualSessions:     state.estimatedAnnualSessions,
          nbJoursObjectifAnnuel:       state.nbJoursObjectifAnnuel,
          floorPriceMargin:            state.floorPriceMargin,
          operatorDependencyRiskThreshold: state.operatorDependencyRiskThreshold,
          urssafRequalificationDays:   state.urssafRequalificationDays,
          chargesConfig:               state.chargesConfig,
          pricingCatalog:              state.pricingCatalog,
          coutJournee:                 state.coutJournee,
          capacite:                    state.capacite,
          entreprise:                  state.entreprise,
          paiement:                    state.paiement,
          rh:                          state.rh
        };

        DB.settings.update(update);
        if (window._applyEntrepriseGlobale) _applyEntrepriseGlobale();

        /* Confirmation visuelle */
        showFeedback('Paramètres enregistrés avec succès.', 'success');
        Toast.show('Paramètres enregistrés.', 'success');
      });
    }

    /* ----------------------------------------------------------
       Listeners — Export / Import / Reset
       ---------------------------------------------------------- */

    function attachDataActions() {

      /* --- Export JSON --- */
      const btnExport = $('#btn-export');
      if (btnExport) {
        btnExport.addEventListener('click', () => {
          try {
            const data = DB.exportAll();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href = url;
            a.download = 'dst-system-export-' + new Date().toISOString().slice(0, 10) + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showFeedback('Export terminé.', 'success');
          } catch (err) {
            showFeedback('Erreur lors de l\'export : ' + err.message, 'error');
          }
        });
      }

      /* --- Import JSON --- */
      const inputImport = $('#input-import');
      if (inputImport) {
        inputImport.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const data = JSON.parse(evt.target.result);
              DB.importAll(data);
              showFeedback('Import réussi. Rechargement des paramètres...', 'success');
              /* Recharger la vue avec les nouvelles données */
              setTimeout(() => Views.Settings.render(container), 600);
            } catch (err) {
              showFeedback('Erreur lors de l\'import : ' + err.message, 'error');
            }
          };
          reader.onerror = () => {
            showFeedback('Impossible de lire le fichier.', 'error');
          };
          reader.readAsText(file);

          /* Réinitialiser l'input pour permettre un nouveau choix du même fichier */
          inputImport.value = '';
        });
      }

      /* --- Réinitialisation — ouvrir la modale --- */
      const btnReset = $('#btn-reset');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          const overlay = $('#modal-reset-overlay');
          if (overlay) overlay.classList.remove('hidden');
          const confirmInput = $('#reset-confirm-input');
          if (confirmInput) { confirmInput.value = ''; confirmInput.focus(); }
          const btnConfirm = $('#modal-reset-confirm');
          if (btnConfirm) btnConfirm.disabled = true;
        });
      }

      /* --- Modale : vérification du mot de confirmation --- */
      const confirmInput = $('#reset-confirm-input');
      const btnConfirm   = $('#modal-reset-confirm');
      if (confirmInput && btnConfirm) {
        confirmInput.addEventListener('input', () => {
          btnConfirm.disabled = confirmInput.value.trim() !== 'SUPPRIMER';
        });
      }

      /* --- Modale : confirmer la réinitialisation --- */
      if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
          try {
            DB.clearAll();
            showFeedback('Toutes les données ont été réinitialisées.', 'success');
            closeResetModal();
            /* Recharger la vue avec les paramètres par défaut */
            setTimeout(() => Views.Settings.render(container), 600);
          } catch (err) {
            showFeedback('Erreur lors de la réinitialisation : ' + err.message, 'error');
          }
        });
      }

      /* --- Modale : annuler / fermer --- */
      const btnCancel    = $('#modal-reset-cancel');
      const btnCloseModal = $('#modal-reset-close');
      [btnCancel, btnCloseModal].forEach(btn => {
        if (btn) btn.addEventListener('click', closeResetModal);
      });

      /* Fermer la modale en cliquant sur l'overlay */
      const overlay = $('#modal-reset-overlay');
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) closeResetModal();
        });
      }
    }

    function closeResetModal() {
      const overlay = $('#modal-reset-overlay');
      if (overlay) overlay.classList.add('hidden');
    }

    /* ----------------------------------------------------------
       Feedback utilisateur (messages temporaires)
       ---------------------------------------------------------- */

    function showFeedback(message, type) {
      const zone = $('#data-feedback');
      if (!zone) return;
      const cssClass = type === 'success' ? 'alert-success' :
                       type === 'error'   ? 'alert-danger'  : 'alert-info';
      const icon = type === 'success' ? '&#10003;' :
                   type === 'error'   ? '&#10007;' : '&#9432;';
      zone.innerHTML = `
        <div class="alert ${cssClass}">
          <span class="alert-icon">${icon}</span>
          <span>${escapeHTML(message)}</span>
        </div>`;
      /* Disparition automatique après 5 secondes */
      setTimeout(() => { if (zone) zone.innerHTML = ''; }, 5000);
    }

    /* ----------------------------------------------------------
       Échappement HTML / attributs
       ---------------------------------------------------------- */

    function escapeHTML(str) {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    function escapeAttr(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    /* ----------------------------------------------------------
       Initialisation de tous les listeners
       ---------------------------------------------------------- */
    attachListEditListeners();
    attachAddButtons();
    attachScalarListeners();
    attachSaveButton();
    attachDataActions();
    attachEntrepriseListeners();

    /* ----------------------------------------------------------
       Badge "Modifications non sauvegardées"
       ---------------------------------------------------------- */
    const _dirtyBadge = container.querySelector('#settings-dirty-badge');
    function _showDirty() { if (_dirtyBadge) _dirtyBadge.style.display = ''; }
    function _hideDirty() { if (_dirtyBadge) _dirtyBadge.style.display = 'none'; }

    container.addEventListener('input',  _showDirty);
    container.addEventListener('change', _showDirty);

    /* Masquer le badge après sauvegarde réussie */
    const _btnSave = container.querySelector('#btn-save-settings');
    if (_btnSave) {
      _btnSave.addEventListener('click', function onSaved() {
        /* Exécuté après le handler principal (même tick, ordre d'ajout) */
        setTimeout(_hideDirty, 0);
      });
    }
  }
};
