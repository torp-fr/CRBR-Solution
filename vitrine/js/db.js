/* ============================================================
   DST-SYSTEM — Couche de persistance (localStorage)
   Gère toutes les entités métier avec CRUD complet.
   ============================================================ */

const DB = (() => {
  'use strict';

  const STORAGE_PREFIX = 'dst_';

  /* --- Helpers --- */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  function now() {
    return new Date().toISOString();
  }

  function getStore(key) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error(`DB: erreur lecture ${key}`, e);
      return [];
    }
  }

  function setStore(key, data) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.error(`DB: erreur écriture ${key}`, e);
    }
  }

  function getConfig(key, defaultVal) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + 'config_' + key);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function setConfig(key, val) {
    localStorage.setItem(STORAGE_PREFIX + 'config_' + key, JSON.stringify(val));
  }

  /* --- Generic CRUD Factory --- */
  function createCRUD(storeName) {
    return {
      getAll() {
        return getStore(storeName);
      },
      getById(id) {
        return getStore(storeName).find(item => item.id === id) || null;
      },
      create(data) {
        const items = getStore(storeName);
        const record = {
          ...data,
          id: generateId(),
          createdAt: now(),
          updatedAt: now()
        };
        items.push(record);
        setStore(storeName, items);
        return record;
      },
      update(id, data) {
        const items = getStore(storeName);
        const idx = items.findIndex(item => item.id === id);
        if (idx === -1) return null;
        items[idx] = { ...items[idx], ...data, updatedAt: now() };
        setStore(storeName, items);
        return items[idx];
      },
      delete(id) {
        const items = getStore(storeName);
        const filtered = items.filter(item => item.id !== id);
        setStore(storeName, filtered);
        return filtered.length < items.length;
      },
      count() {
        return getStore(storeName).length;
      },
      filter(predicate) {
        return getStore(storeName).filter(predicate);
      },
      find(predicate) {
        return getStore(storeName).find(predicate) || null;
      },
      clear() {
        setStore(storeName, []);
      }
    };
  }

  /* --- Entités métier --- */
  const operators           = createCRUD('operators');
  const modules             = createCRUD('modules');
  const clients             = createCRUD('clients');
  const offers              = createCRUD('offers');
  const sessions            = createCRUD('sessions');
  const locations           = createCRUD('locations');
  const clientSubscriptions = createCRUD('clientSubscriptions');
  const prospects           = createCRUD('prospects');
  const devis               = createCRUD('devis');
  const factures            = createCRUD('factures');
  const regions             = createCRUD('regions');
  const simulateurs         = createCRUD('simulateurs');

  /* --- Numérotation automatique des devis --- */
  function getNextNumeroDevis() {
    const year = new Date().getFullYear();
    const all  = getStore('devis');
    let max = 0;
    all.forEach(function(d) {
      if (d.numero) {
        const m = d.numero.match(/^DEV-(\d{4})-(\d+)$/);
        if (m && parseInt(m[1]) === year) {
          const n = parseInt(m[2]);
          if (n > max) max = n;
        }
      }
    });
    return 'DEV-' + year + '-' + String(max + 1).padStart(3, '0');
  }

  /* --- Numérotation automatique des factures --- */
  function getNextNumeroFacture() {
    const year = new Date().getFullYear();
    const all  = getStore('factures');
    let max = 0;
    all.forEach(function(f) {
      if (f.numero) {
        const m = f.numero.match(/^FAC-(\d{4})-(\d+)$/);
        if (m && parseInt(m[1]) === year) {
          const n = parseInt(m[2]);
          if (n > max) max = n;
        }
      }
    });
    return 'FAC-' + year + '-' + String(max + 1).padStart(3, '0');
  }

  /* --- Token d'accès portail opérateur --- */
  function generateOperateurToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const prefix = 'ops_';
    let token = prefix;
    for (let i = 0; i < 16; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
  }

  /* --- Token d'accès portail client --- */
  function generatePortailToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = 'tok_';
    for (let i = 0; i < 16; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
  }

  /* --- Paramètres économiques --- */
  const DEFAULT_SETTINGS = {
    // Taux charges patronales global (legacy, conservé pour rétrocompat)
    employerChargeRate: 45,

    /* ============================================================
       BARÈME CHARGES SOCIALES — Taux officiels France 2025
       Chaque ligne est paramétrable par l'utilisateur.
       ============================================================ */
    chargesConfig: {
      // Plafond Annuel de la Sécurité Sociale (2025)
      passAnnuel: 47100,
      // SMIC mensuel brut (2025 — 11,88 €/h × 151,67h)
      smicMensuelBrut: 1801.80,
      // Jours ouvrés moyens par an
      joursOuvresAn: 218,
      // Effectif entreprise : 'moins11' | 'de11a49' | '50etplus'
      effectif: 'moins11',

      /* --- Charges patronales (sur brut) --- */
      patronales: [
        { code: 'maladie',            taux: 13.00, tauxReduit: 7.00,  seuilSmic: 2.5,  label: 'Assurance maladie-maternité-invalidité-décès' },
        { code: 'vieillessePlaf',     taux: 8.55,  plafonnee: true,  label: 'Assurance vieillesse plafonnée' },
        { code: 'vieillesseDeplaf',   taux: 2.02,  label: 'Assurance vieillesse déplafonnée' },
        { code: 'allocFamiliales',    taux: 5.25,  tauxReduit: 3.45, seuilSmic: 3.5,  label: 'Allocations familiales' },
        { code: 'accidentsTravail',   taux: 1.50,  label: 'Accidents du travail / Maladies pro.' },
        { code: 'csa',               taux: 0.30,  label: 'Contribution solidarité autonomie (CSA)' },
        { code: 'assuranceChomage',   taux: 4.05,  label: 'Assurance chômage' },
        { code: 'ags',               taux: 0.15,  label: 'AGS (garantie des salaires)' },
        { code: 'retraiteT1',        taux: 4.72,  plafonnee: true,  label: 'Retraite complémentaire AGIRC-ARRCO T1' },
        { code: 'retraiteT2',        taux: 12.95, tranche2: true,   label: 'Retraite complémentaire AGIRC-ARRCO T2' },
        { code: 'cegT1',             taux: 1.29,  plafonnee: true,  label: 'CEG (Contribution Équilibre Général) T1' },
        { code: 'cegT2',             taux: 1.62,  tranche2: true,   label: 'CEG T2' },
        { code: 'cet',               taux: 0.21,  tranche2: true,   label: 'CET (Contribution Équilibre Technique)' },
        { code: 'fnal',              taux: 0.10,  plafonnee: true,  label: 'FNAL (Fonds National Aide au Logement)' },
        { code: 'formationPro',      taux: 0.55,  label: 'Formation professionnelle' },
        { code: 'taxeApprentissage', taux: 0.68,  label: 'Taxe d\'apprentissage' },
        { code: 'dialogueSocial',    taux: 0.016, label: 'Contribution au dialogue social' },
        { code: 'versementMobilite', taux: 0,     label: 'Versement mobilité (transport)' },
        { code: 'prevoyanceMutuelle',taux: 0,     label: 'Prévoyance / Mutuelle patronale' }
      ],

      /* --- Charges salariales (prélevées sur brut) --- */
      salariales: [
        { code: 'vieillessePlaf',     taux: 6.90,  plafonnee: true,   label: 'Assurance vieillesse plafonnée' },
        { code: 'vieillesseDeplaf',   taux: 0.40,  label: 'Assurance vieillesse déplafonnée' },
        { code: 'csgDeductible',      taux: 6.80,  assiette9825: true, label: 'CSG déductible' },
        { code: 'csgNonDeductible',   taux: 2.40,  assiette9825: true, label: 'CSG non déductible' },
        { code: 'crds',              taux: 0.50,  assiette9825: true, label: 'CRDS' },
        { code: 'retraiteT1',        taux: 3.15,  plafonnee: true,   label: 'Retraite complémentaire AGIRC-ARRCO T1' },
        { code: 'retraiteT2',        taux: 8.64,  tranche2: true,    label: 'Retraite complémentaire AGIRC-ARRCO T2' },
        { code: 'cegT1',             taux: 0.86,  plafonnee: true,   label: 'CEG T1' },
        { code: 'cegT2',             taux: 1.08,  tranche2: true,    label: 'CEG T2' },
        { code: 'cet',               taux: 0.14,  tranche2: true,    label: 'CET' }
      ],

      /* --- Spécificités CDD --- */
      cdd: {
        primePrecarite: 10,    // % du brut total
        indemniteCP: 10        // % du brut (+ prime précarité)
      },

      /* --- Spécificités Intérim --- */
      interim: {
        coefficientAgence: 2.0 // Coefficient facturé par l'agence
      },

      /* --- Spécificités Freelance / Auto-entrepreneur --- */
      freelance: {
        tauxCharges: 21.1      // % (BNC services libérales 2025)
      },

      /* --- Spécificités Fondateur --- */
      fondateur: {
        regime: 'tns',         // 'tns' | 'assimileSalarie'
        tauxTNS: 45            // % cotisations TNS approximatif
      }
    },
    // Marge cible (%)
    targetMarginPercent: 30,
    // Taux TVA (%)
    vatRate: 20,
    // Heures de travail par jour (pour calcul taux horaire → journalier)
    hoursPerDay: 7,
    // Nombre estimé de sessions annuelles (pour répartition coûts fixes)
    estimatedAnnualSessions: 100,
    // Nombre de jours objectif annuels (pour seuil plancher)
    nbJoursObjectifAnnuel: 50,
    // Nombre d'opérateurs estimés par session (pour calcul seuil plancher)
    estimatedOperatorsPerSession: 1,
    // Types de clients (extensible)
    clientTypes: ['Collectivité', 'Police / Gendarmerie', 'Armée', 'Entreprise privée', 'Sécurité privée', 'Particulier', 'Association', 'Autre'],
    // Statuts opérateurs (extensible)
    operatorStatuses: ['freelance', 'interim', 'contrat_journalier', 'cdd', 'cdi', 'fondateur'],
    // Types d'offres
    offerTypes: ['one_shot', 'abonnement', 'personnalisee'],
    // Coefficients intérim
    interimCoefficient: 2.0,
    // Charges freelance estimées (%)
    freelanceChargeRate: 25,
    // Seuil alerte marge (%)
    marginAlertThreshold: 15,
    // Seuil alerte surcharge opérateur (sessions/mois)
    operatorOverloadThreshold: 15,
    // Seuil bascule CDI (sessions/an par opérateur)
    cdiThreshold: 80,
    // Marge de sécurité prix plancher (%)
    floorPriceMargin: 5,
    // Seuil risque dépendance opérateur (%)
    operatorDependencyRiskThreshold: 40,
    // Seuil requalification URSSAF (jours)
    urssafRequalificationDays: 45,
    // Catalogue tarifaire de référence
    pricingCatalog: {

      // === TARIF DE BASE (plein tarif journée, palier Ponctuel) ===
      tarifJourneeBase: 2000,         // € HT tout inclus, zone ≤ 150 km
      tarifDemiJourneeCoeff: 0.70,    // demi-journée = 70% du tarif journée
                                      // (disponible uniquement palier Ponctuel)

      // === PALIERS TARIFAIRES ===
      paliers: [
        {
          id: 'ponctuel',
          label: 'Ponctuel',
          volumeMin: 1,
          volumeMax: 5,
          coeff: 1.00,
          prixBase: null,
          demiJourneeDisponible: true,
          livrables: []
        },
        {
          id: 'essentiel',
          label: 'Essentiel',
          volumeMin: 6,
          volumeMax: 14,
          coeff: 0.90,
          prixBase: null,
          demiJourneeDisponible: false,
          livrables: ['bilan_trimestriel', 'rapport_annuel']
        },
        {
          id: 'renforce',
          label: 'Renforcé',
          volumeMin: 15,
          volumeMax: 24,
          coeff: 0.82,
          prixBase: null,
          demiJourneeDisponible: false,
          livrables: ['bilan_trimestriel', 'rapport_annuel']
        },
        {
          id: 'territorial',
          label: 'Territorial',
          volumeMin: 25,
          volumeMax: 9999,
          coeff: 0.75,
          prixBase: null,
          demiJourneeDisponible: false,
          livrables: ['bilan_trimestriel', 'rapport_annuel', 'rapport_territorial']
        }
      ],

      // === ZONES GÉOGRAPHIQUES (surcoût/jour en € HT) ===
      zones: [
        { id: 'zone1', label: 'Zone incluse (0\u2013150\u00a0km)',  surplusParJour: 0    },
        { id: 'zone2', label: 'Zone 2 (151\u2013300\u00a0km)',      surplusParJour: 250  },
        { id: 'zone3', label: 'Zone 3 (301\u2013500\u00a0km)',      surplusParJour: 450  },
        { id: 'zone4', label: 'Zone 4 (500+\u00a0km)',              surplusParJour: null }
      ],

      // === REMISE FIDÉLITÉ (reconduction N+1) ===
      remiseFidelitePourcent: 5,

      // === REMISE MAX AUTORISÉE SANS ALERTE ===
      remiseMaxAutorisee: 20,

      // === CONDITIONS DE VENTE ===
      validiteDevisJours: 30,
      acomptePercent: 30,
      paiementDelaiJours: 30,

      // === PALIERS GRAND COMPTE ITINÉRANT ===
      paliersGrandCompte: [
        { id: 'gc_standard',  label: 'Grand Compte Standard',  volumeMin: 50,  volumeMax: 99,   tarifJour: 1300, livrables: ['rapport_unite', 'synthese_territoriale'] },
        { id: 'gc_volume',    label: 'Grand Compte Volume',    volumeMin: 100, volumeMax: 149,  tarifJour: 1150, livrables: ['rapport_unite', 'synthese_territoriale'] },
        { id: 'gc_partenaire',label: 'Grand Compte Partenaire',volumeMin: 150, volumeMax: 9999, tarifJour: 1050, livrables: ['rapport_unite', 'synthese_territoriale', 'rapport_annuel_national'] }
      ],

      // === TARIFS B2B ===
      b2b: {
        tarifJourneeComplete: 2400,
        tarifDemiJournee:     1500,
        livrables: []
      },

      // === TARIFS B2C / ÉVÉNEMENTIEL ===
      b2c: {
        forfait2h:      800,
        forfait3h:      1100,
        forfait4h:      1400,
        capaciteGroupe: 10,
        livrables: []
      }
    },

    // Coûts journée réels — alimentent calculateSeuilPlancher
    coutJournee: {
      // === OPÉRATEUR ===
      coutOperateurJour:          500,   // € coût total opérateur/jour (TJM ou coût chargé)

      // === MATÉRIEL ===
      prixSimulateur:             40000, // € HT prix d'achat simulateur
      dureeAmortissementAns:      7,     // années d'amortissement
      consommablesJour:           15,    // € consommables par jour

      // === ASSURANCES ===
      rcProAnnuelle:              2000,  // € RC Pro par an
      assurancesMaterielAnnuelle: 650,   // € assurance matériel par an

      // === DÉPLACEMENTS (base zone incluse) ===
      deplacementMoyenKm:         100,   // km aller-retour moyen par mission
      tarifKm:                    0.53,  // € / km (barème fiscal 2025)
      prixCarburantL:             1.85,  // € / litre (référence)
      consommationVhlL100:        7,     // litres / 100 km
      peagesAllerRetour:          20,    // € péages moyens AR par mission
      fraisStationnement:         5,     // € stationnement moyen

      // === ADMINISTRATIF ===
      expertComptableAnnuel:      1800,  // € / an
      fraisBancairesAnnuels:      500,   // € / an
      autresFraisAdminAnnuels:    400,   // € / an (cotisations, divers)

      // === TEMPS NON FACTURABLE ===
      ratioTempsNonFacturable:    40,    // % du temps passé non facturé
                                         // (prospection, admin, prépa, CR)

      // === TRÉSORERIE DE SÉCURITÉ ===
      margeSecuritePourcent:      5,     // % ajouté au coût pour trésorerie

      // === VOLUME DE RÉFÉRENCE ===
      nbJoursFacturesAn:          100    // jours facturés par an (objectif)
    },

    // Identité entreprise et mentions légales documents
    entreprise: {
      nom:              'DST System',
      formeJuridique:   'SASU',
      siren:            '',
      siret:            '',
      rcs:              '',
      adresse:          '',
      codePostal:       '',
      ville:            '',
      telephone:        '06 65 44 52 26',
      email:            'dst-system@hotmail.com',
      siteWeb:          'www.dst-system.fr',
      logoPrincipalBase64:  '',   // Emblème/blason — devis, factures, docs
      logoPrincipalMime:    '',
      logoTexteBase64:      '',   // Logo texte — headers digitaux, portails
      logoTexteMime:        '',
      faviconBase64:        '',   // Favicon onglet navigateur (32×32 min)
      faviconMime:          '',
      mentionLegaleDevis:    'Devis valable 30 jours. TVA applicable selon taux en vigueur. En cas d\'acceptation, retourner signé avec la mention "Bon pour accord".',
      mentionLegaleFacture:  'Paiement à 30 jours. Tout retard entraîne des pénalités au taux légal + indemnité forfaitaire de 40 €. SASU au capital de [compléter] €.',
      mentionRGPD:           'Données traitées conformément au RGPD. Contact : dst-system@hotmail.com',
      conditionsAnnulation:  'Annulation >72h : sans frais. <72h : 50%. Jour J : 100%.'
    },

    // Règles de paiement et conditions contractuelles
    paiement: {
      acomptePercent:            30,
      acompteObligatoire:        true,
      delaiSoldeJours:           30,
      penaliteRetardPercent:     3,
      indemniteForfaitaire:      40,
      blocageSessionSiImpaye:    true,
      schemasActifs:             ['ponctuel', 'trimestriel', 'semestriel', 'annuel', 'b2c'],
      schemaParSegment: {
        institutionnel: 'trimestriel',
        grand_compte:   'semestriel',
        b2b:            'ponctuel',
        b2c:            'b2c'
      },
      messageAcompte:            'Un acompte de 30\u00a0% est exigible à la commande. Aucune session ne sera réalisée avant réception de l\'acompte.',
      messageSolde:              'Solde payable à 30 jours date de facture. Tout retard entraîne des pénalités au taux légal en vigueur + indemnité forfaitaire de 40\u00a0€ pour frais de recouvrement.',
      messageB2C:                'Paiement int\u00e9gral exigible avant le d\u00e9but de la prestation.'
    },

    // Paramètres RH avancés (CDI vs Freelance)
    rh: {
      cdi: {
        salaireBrutMensuel:        2800,   // € brut/mois cible
        chargesPatronalesPercent:  42,     // % charges patronales
        primesAnnuelles:           1000,   // € primes/an
        coutRecrutement:           3000,   // € one-shot (amorti sur 3 ans)
        avantagesNature:           0       // € avantages en nature/an
      }
    },

    // Capacité opérationnelle — 1 unité = 1 simulateur + 1 opérateur
    capacite: {
      // === PAR UNITÉ OPÉRATIONNELLE ===
      nbUnites:                      1,    // nombre de simulateurs actifs
      joursMaxParUniteParAn:         150,  // capacité max réaliste par unité
      seuilAlerteJours:              120,  // seuil d'alerte jaune (anticiper)
      seuilCritiqueJours:            140,  // seuil rouge (investir maintenant)
      joursMoisCible:                13,   // objectif mensuel par unité
      joursMoisMax:                  15,   // plafond mensuel absolu par unité

      // === COÛT D'UNE UNITÉ SUPPLÉMENTAIRE ===
      coutSimulateurNouveauHT:       40000, // € HT simulateur + équipements
      coutRecrutementOperateur:      2000,  // € frais recrutement/formation
      delaiDispoNouvelleUnite:       90,    // jours entre décision et déploiement

      // === DÉLAI D'ANTICIPATION ===
      moisAnticipationInvestissement: 3     // mois avant saturation pour déclencher l'alerte
    }
  };

  const settings = {
    get() {
      return getConfig('settings', DEFAULT_SETTINGS);
    },
    set(data) {
      setConfig('settings', data);
    },
    update(partial) {
      const current = this.get();
      const merged = { ...current, ...partial };
      this.set(merged);
      return merged;
    },
    reset() {
      this.set(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    },
    getDefaults() {
      return { ...DEFAULT_SETTINGS };
    }
  };

  /* --- Export / Import complet --- */
  function exportAll() {
    return {
      version: 1,
      exportedAt: now(),
      data: {
        operators: operators.getAll(),
        modules: modules.getAll(),
        clients: clients.getAll(),
        offers: offers.getAll(),
        sessions: sessions.getAll(),
        locations: locations.getAll(),
        clientSubscriptions: clientSubscriptions.getAll(),
        prospects: prospects.getAll(),
        devis: devis.getAll(),
        factures: factures.getAll(),
        regions: regions.getAll(),
        simulateurs: simulateurs.getAll(),
        settings: settings.get()
      }
    };
  }

  function importAll(dump) {
    if (!dump || !dump.data) throw new Error('Format d\'import invalide');
    const d = dump.data;
    if (d.operators) setStore('operators', d.operators);
    if (d.modules) setStore('modules', d.modules);
    if (d.clients) setStore('clients', d.clients);
    if (d.offers) setStore('offers', d.offers);
    if (d.sessions) setStore('sessions', d.sessions);
    if (d.locations) setStore('locations', d.locations);
    if (d.clientSubscriptions) setStore('clientSubscriptions', d.clientSubscriptions);
    if (d.prospects) setStore('prospects', d.prospects);
    if (d.devis) setStore('devis', d.devis);
    if (d.factures) setStore('factures', d.factures);
    if (d.regions) setStore('regions', d.regions);
    if (d.simulateurs) setStore('simulateurs', d.simulateurs);
    if (d.settings) settings.set(d.settings);
  }

  function clearAll() {
    ['operators','modules','clients','offers','sessions','locations','clientSubscriptions','prospects','devis','factures','regions','simulateurs'].forEach(k => setStore(k, []));
    settings.reset();
  }

  /* --- Modèle par défaut opérateur (migration douce des enregistrements existants) --- */
  const DEFAULT_OPERATOR = {
    // === IDENTITÉ ===
    firstName:        '',
    lastName:         '',
    email:            '',
    phone:            '',
    // === STATUT / ACTIVITÉ ===
    status:           'freelance',
    active:           true,
    // === TARIFICATION ===
    netDaily:         0,
    companyCostDaily: 0,
    costMode:         'daily_rate',
    dailyRate:        0,
    // === NOTES ===
    notes:            '',
    // === ZONE GÉOGRAPHIQUE ===
    zoneLabel:        '',
    departements:     [],
    villeBase:        '',
    codePostalBase:   '',
    rayonKm:          150,
    // === COMPÉTENCES ===
    segments:         [],
    niveauxMax:       [],
    specialites:      [],
    certifications:   '',
    // === DISPONIBILITÉS ===
    disponibiliteType:    'ponctuelle',
    joursDispoParMois:    0,
    periodeIndispo:       [],
    // === CONTRAT ===
    typeContrat:      'freelance',
    siretFreelance:   '',
    noteInterne:      '',
    // === PORTAIL OPÉRATEUR ===
    portailToken:        '',
    portailActif:        false,
    portailGenereeLe:    '',
    portailDerniereSync: ''
  };

  /* --- Modèle par défaut client --- */
  const DEFAULT_CLIENT = {
    name:               '',
    contactName:        '',
    contactEmail:       '',
    contactPhone:       '',
    type:               '',
    clientCategory:     'B2B',
    segment:            'institutionnel',
    sector:             '',
    website:            '',
    address:            '',
    city:               '',
    postalCode:         '',
    siret:              '',
    priority:           'normal',
    active:             true,
    notes:              '',
    portailToken:       '',
    portailActif:       false,
    portailGenereeLe:   '',
    portailDerniereSync: ''
  };

  /* --- Modèle par défaut session --- */
  const DEFAULT_SESSION = {
    label:        '',
    date:         '',
    time:         '',
    statut:       'planifiee',
    clientIds:    [],
    moduleIds:    [],
    operatorIds:  [],
    locationId:   '',
    offerId:      '',
    segment:      '',
    price:        0,
    nbJours:      1,
    notes:        '',
    devisRef:     '',
    adresseIntervention: '',
    variableCosts: []
  };

  /* --- API publique --- */
  return {
    operators,
    modules,
    clients,
    offers,
    sessions,
    locations,
    clientSubscriptions,
    prospects,
    devis,
    factures,
    regions,
    simulateurs,
    settings,
    exportAll,
    importAll,
    clearAll,
    generateId,
    getNextNumeroDevis,
    getNextNumeroFacture,
    generatePortailToken,
    generateOperateurToken,
    DEFAULT_OPERATOR,
    DEFAULT_CLIENT,
    DEFAULT_SESSION
  };
})();
