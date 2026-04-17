(function () {
  'use strict';

  var LANG_KEY = 'crbr_lang';

  var T = {
    fr: {
      /* NAV */
      nav_solutions:     'Nos solutions',
      nav_about:         'À propos',
      nav_contact:       'Contact',
      nav_cta:           'Demander une présentation',
      nav_login:         '🔐 Connexion',
      nav_burger_open:   'Ouvrir le menu',

      /* FOOTER */
      footer_tagline:    '— Conception de Réponse Basées sur les Retex',
      footer_solutions:  'Nos solutions',
      footer_about:      'À propos',
      footer_contact:    'Contact',
      footer_legal:      'Mentions légales',
      footer_cgv:        'CGV',
      footer_privacy:    'Confidentialité',
      footer_copy:       'CRBR Solutions. Tous droits réservés.',

      /* COOKIE */
      cookie_text:       "Ce site utilise des cookies techniques nécessaires à son fonctionnement. Aucune donnée personnelle n'est collectée sans votre consentement.",
      cookie_btn:        'Accepter',

      /* --- INDEX --- */
      idx_badge:         'CRBR — Conception de Réponse Basées sur les Retex',
      idx_h1a:           'Renforcer la capacité',
      idx_h1b:           'opérationnelle de vos unités.',
      idx_subtitle:      "CRBR Solutions conçoit et déploie des réponses opérationnelles sur-mesure — simulateurs, structures modulaires, équipements tactiques — installés dans vos locaux, disponibles en permanence, bâtis à partir des retours d'expérience du terrain.",
      idx_hero_cta1:     'Demander une présentation',
      idx_hero_cta2:     'Découvrir nos solutions',
      idx_trust1:        'Réponse sous 48h',
      idx_trust2:        'Sans engagement',
      idx_trust3:        'Location longue durée',

      idx_sol_label:     'Nos solutions',
      idx_sol_h2a:       'Une réponse opérationnelle',
      idx_sol_h2b:       'pour chaque besoin.',
      idx_sol_intro:     "CRBR Solutions n'est pas un revendeur de matériel. Nous analysons vos missions et construisons la réponse adaptée — en combinant les technologies, équipements et dispositifs qui correspondent exactement à votre réalité terrain.",
      idx_s1_h3:         'Simulateurs de tir',
      idx_s1_p:          'Systèmes de simulation professionnels pour le travail technique et décisionnel. Scénarios CQB, tir de précision, gestion du stress. Zéro munition réelle, usage illimité.',
      idx_s2_h3:         'Munitions marquantes',
      idx_s2_p:          "Solutions à impact physique pour un réalisme maximum, sans danger ni létalité. Idéal pour le travail dynamique et la mise en situation réelle des opérateurs.",
      idx_s3_h3:         'Shooting house modulaire',
      idx_s3_p:          "Structures en panneaux modulaires, reconfigurables selon vos scénarios. CQB, intervention bâtiment, progression tactique — installation à demeure ou déplaçable.",
      idx_s4_h3:         'Équipements sur-mesure',
      idx_s4_p:          "Portes d'effraction, kits spécialisés, structures modulaires et équipements tactiques complémentaires. Chaque besoin opérationnel trouve sa réponse. Vous exprimez le besoin — CRBR Solutions conçoit la solution.",

      idx_app_label:     'Notre approche',
      idx_app_h2a:       'On analyse vos missions.',
      idx_app_h2b:       'On conçoit votre solution.',
      idx_app_intro:     "CRBR Solutions est un consultant en solutions opérationnelles. Nous analysons vos missions, vos contraintes, vos objectifs — puis nous construisons le dispositif adapté, en combinant les meilleures technologies disponibles.",
      idx_step1_h4:      'Analyse de vos missions',
      idx_step1_p:       "Compréhension de votre contexte opérationnel, menaces, effectifs et infrastructure.",
      idx_step2_h4:      'Conception sur-mesure',
      idx_step2_p:       "Sélection et assemblage des technologies adaptées — simulateur, munitions marquantes, CQB, équipements.",
      idx_step3_h4:      'Déploiement & suivi',
      idx_step3_p:       "Installation à demeure, formation de vos référents, maintenance et suivi continu inclus.",
      idx_app_badge1:    'Consultant & intégrateur',
      idx_app_badge2:    "Un expert qui combine les meilleures solutions du marché pour répondre exactement à vos besoins.",

      idx_form_label:    'Notre formule',
      idx_form_h2a:      'Installé chez vous.',
      idx_form_h2b:      'Sans investissement lourd.',
      idx_form_intro:    "Nous déployons les solutions directement dans vos locaux, en formule longue durée. Un dispositif permanent, avec maintenance et suivi inclus — disponible à tout moment, sans logistique.",
      idx_fc1_h3:        'Dispositif permanent',
      idx_fc1_p:         "Un système déployé à demeure dans vos locaux. Un coût maîtrisé et prévisible, adapté aux contraintes des structures publiques et privées.",
      idx_fc2_h3:        'Maintenance & suivi',
      idx_fc2_p:         "Entretien régulier, mises à jour des scénarios, remplacement du matériel si nécessaire. Vous vous concentrez sur l'entraînement.",
      idx_fc3_h3:        'Formation continue',
      idx_fc3_p:         "Accompagnement de vos référents internes, actualisation des programmes selon l'évolution de vos missions et menaces.",
      idx_quote:         '"La préparation opérationnelle est un investissement continu. Notre rôle est de la rendre accessible et permanente."',
      idx_quote_cite:    'CRBR Solutions — Consultant en solutions opérationnelles',

      idx_who_label:     'Pour qui',
      idx_who_h2a:       'Forces armées, sécurité publique',
      idx_who_h2b:       '& opérateurs privés.',
      idx_who_intro:     "Entraînement continu des opérateurs, équipes de visite en navigation, maintien en condition opérationnelle — un dispositif permanent adapté au rythme de chaque structure.",
      idx_who_notlisted: "Votre structure n'est pas listée ?",
      idx_who_contact:   'Contactez-nous',
      idx_who_notlisted2:'— nous adaptons nos solutions à tout besoin opérationnel.',

      idx_cta_h2a:       "Prêt à transformer",
      idx_cta_h2b:       "votre entraînement ?",
      idx_cta_p:         "Présentez-nous vos locaux et vos besoins. Nous vous proposons la formule adaptée — installée chez vous, en location longue durée, avec suivi et maintenance.",
      idx_cta1:          'Demander une présentation',
      idx_cta2:          'Découvrir nos solutions',
      idx_micro1:        'Réponse sous 48h',
      idx_micro2:        'Échange sans engagement',
      idx_micro3:        'Location longue durée avec maintenance',

      /* --- OFFRES --- */
      off_label:         'Nos formules',
      off_h1a:           'Quatre formules.',
      off_h1b:           'Une logique commune.',
      off_hero_p:        "Chaque formule repose sur le même principe — une solution déployée dans vos locaux, adaptée à vos missions. Tout le reste est inclus.",

      off_f1_label:      'Formule 1',
      off_f1_title:      'Essentiel',
      off_f1_p:          "L'entrée en matière pour structurer un entraînement régulier sur armes de poing. Dispositif autonome, zéro contrainte.",
      off_f1_li1:        'Dispositif d\'entraînement livré et installé',
      off_f1_li2:        'Répliques armes de poing',
      off_f1_li3:        'Scénarios tir de précision et réflexe',
      off_f1_li4:        'Aucuns travaux nécessaires',
      off_f1_li5:        'Maintenance préventive et corrective',
      off_f1_li6:        'Mises à jour logicielles et scénarios',
      off_f1_li7:        'Usage illimité, sans contrainte de munitions',
      off_f1_cta:        'Demander un devis',

      off_f2_label:      'Formule 2',
      off_f2_title:      'Opérationnel',
      off_f2_badge:      'Recommandé',
      off_f2_p:          "Le cœur du dispositif : travail dynamique en espace confiné (CQB), cibles et humanoïdes de tir, scénarios de décision sous contrainte.",
      off_f2_li1:        'Tout le contenu de la Formule Essentiel',
      off_f2_li2:        'Cibles individuelles et groupes',
      off_f2_li3:        'Humanoïdes de tir',
      off_f2_li4:        'Module CQB — travail dynamique en espace confiné',
      off_f2_li5:        'Scénarios stress, décision, intervention',
      off_f2_li6:        'Maintenance et assurance incluses',
      off_f2_cta:        'Demander un devis',

      off_f3_label:      'Formule 3',
      off_f3_title:      'Premium',
      off_f3_p:          "L'Opérationnel augmenté avec le module munitions marquantes pour l'entraînement dynamique interactif.",
      off_f3_li1:        'Tout le contenu de la Formule Opérationnel',
      off_f3_li2:        'Module munitions marquantes complet',
      off_f3_li3:        'Équipements de protection associés',
      off_f3_li4:        'Scénarios confrontation dynamique',
      off_f3_li5:        'Entraînement inter-équipes',
      off_f3_li6:        'Maintenance et assurance incluses',
      off_f3_cta:        'Demander un devis',

      off_f4_label:      'Formule 4',
      off_f4_title:      'Déploiement Mobile',
      off_f4_p:          "CRBR Solutions se déplace sur votre site avec l'équipement complet, selon un programme structuré sur l'année.",
      off_f4_li1:        'Déploiement CRBR Solutions sur votre site',
      off_f4_li2:        'Équipement mobile complet apporté',
      off_f4_li3:        'Programme structuré sur cycle annuel',
      off_f4_li4:        '1 à 2 sessions par mois',
      off_f4_li5:        'Organisation en groupes alternés',
      off_f4_li6:        'Aucune infrastructure requise',
      off_f4_cta:        'Demander un devis',

      off_custom_label:  'Sur-mesure',
      off_custom_h2a:    'Nos solutions sont entièrement',
      off_custom_h2b:    'personnalisables.',
      off_custom_p:      "Simulateurs, munitions marquantes, structures modulaires, équipements tactiques — nous concevons le dispositif qui répond exactement à votre contexte opérationnel. Vous exprimez un besoin, CRBR Solutions conçoit la réponse.",
      off_custom_cta:    'Demander une solution sur mesure',
      off_custom_badge1: 'Tout inclus',
      off_custom_badge2: "Installation, maintenance, assurance et mises à jour — un contrat unique, aucune surprise.",

      off_comp_label:    'Comparatif',
      off_comp_h2a:      'Ce que comprend',
      off_comp_h2b:      'chaque formule.',
      off_comp_th0:      'Inclus',
      off_comp_th1:      'Essentiel',
      off_comp_th2:      'Opérationnel',
      off_comp_th3:      'Premium',
      off_comp_th4:      'Mobile',
      off_comp_r1:       'Dispositif livré et installé',
      off_comp_r2:       'Armes de poing (répliques)',
      off_comp_r3:       'Cibles individuelles et groupes',
      off_comp_r4:       'Module CQB',
      off_comp_r5:       'Humanoïdes de tir',
      off_comp_r6:       'Module munitions marquantes',
      off_comp_r7:       'Maintenance et assurance',
      off_comp_r8:       'Mises à jour scénarios et logiciel',
      off_comp_r9:       'Usage illimité 24h/24',
      off_comp_r10:      'Déploiement mobile sur site',

      off_multi_h2a:     'Plusieurs sites',
      off_multi_h2b:     'à équiper ?',
      off_multi_p:       "Des formules multi-postes sont disponibles sur demande. Contactez-nous pour une proposition adaptée à votre organisation.",
      off_multi_cta1:    'Contactez-nous',
      off_multi_cta2:    'Demander une présentation',
      off_multi_m1:      'Réponse sous 48h',
      off_multi_m2:      'Sans engagement',
      off_multi_m3:      'Premier échange gratuit',

      /* --- A-PROPOS --- */
      ap_label:          'À propos',
      ap_h1a:            'Un parcours de terrain.',
      ap_h1b:            'Un programme conçu de l\'intérieur.',
      ap_hero_p:         "CRBR Solutions est né d'une conviction forgée dans les unités opérationnelles : l'entraînement régulier est la condition du maintien des compétences — et les obstacles qui l'empêchent ne sont pas une fatalité.",

      ap_found_label:    'Le fondateur',
      ap_found_h2a:      'Un parcours militaire.',
      ap_found_h2b:      'Une conviction pédagogique.',
      ap_found_p1:       "Fort d'une expérience opérationnelle et d'une expertise reconnue en formation, gestuelle et préparation au combat, notre fondateur a conçu CRBR Solutions pour apporter aux forces de sécurité un outil d'entraînement accessible, permanent et efficace.",
      ap_found_p2:       "Formateur commando, il a exercé dans des unités soumises à des exigences élevées de préparation, puis encadré et conçu des programmes d'entraînement pour forces de sécurité. Cette expérience lui a permis d'identifier avec précision les obstacles structurels qui empêchent la régularité : la distance des centres, la rareté des créneaux, la contrainte de munitions, la difficulté à libérer des effectifs.",
      ap_found_p3:       "CRBR Solutions est la réponse concrète à ce diagnostic : une solution d'entraînement déplaçable, sans contrainte de munitions, conçue pour fonctionner dans les contraintes réelles des services publics armés.",
      ap_found_quote:    '"L\'entraînement opérationnel ne doit pas être réservé aux unités qui ont les moyens de se déplacer. Il doit aller à celles qui n\'en ont pas le temps — et idéalement être là en permanence."',
      ap_profile_name:   'Fondateur & Directeur',
      ap_profile_role:   'CRBR Solutions — Conception de Réponse Basées sur les Retex',
      ap_tl_label:       'Parcours clé',
      ap_tl1_strong:     'Formation commando',
      ap_tl1_span:       'Expérience en unités soumises à de fortes exigences opérationnelles',
      ap_tl2_strong:     'Expertise en mise en situation opérationnelle',
      ap_tl2_span:       'Gestuelle, déplacements, protocoles, gestion du stress',
      ap_tl3_strong:     "Encadrement de programmes d'entraînement",
      ap_tl3_span:       "Forces de l'ordre, sécurité, milieux pénitentiaires",
      ap_tl4_strong:     'Conception de formations continues',
      ap_tl4_span:       'Ingénierie pédagogique, préparation opérationnelle',
      ap_tl5_strong:     'Création de CRBR Solutions',
      ap_tl5_span:       'Solutions opérationnelles à demeure pour forces de sécurité',

      ap_miss_label:     'Notre mission',
      ap_miss_h2a:       "Rendre l'entraînement opérationnel",
      ap_miss_h2b:       'accessible en permanence.',
      ap_miss_p1:        "CRBR Solutions a une conviction fondatrice : l'entraînement régulier est la condition du maintien des compétences opérationnelles — et les obstacles qui l'empêchent ne sont pas une fatalité. Ils se résolvent par le bon équipement au bon endroit.",
      ap_miss_p2:        "Notre mission est de mettre à portée de toutes les unités — quelle que soit leur taille ou leur localisation — un outil d'entraînement professionnel permanent. Un simulateur installé dans vos locaux, disponible à tout moment, sans logistique, sans contrainte.",
      ap_miss_p3:        "Ce n'est pas de la formation à la journée. C'est une infrastructure opérationnelle qui appartient à votre quotidien — et qui produit des résultats mesurables sur la durée.",
      ap_miss_badge1:    'Consultant & intégrateur',
      ap_miss_badge2:    "Nous combinons les meilleures solutions du marché pour répondre exactement à vos besoins.",

      ap_val_label:      'Nos valeurs',
      ap_val_h2a:        'Ce qui guide chacune',
      ap_val_h2b:        'de nos décisions.',
      ap_v1_h4:          'Précision',
      ap_v1_p:           "Chaque solution est conçue avec exactitude. Pas de catalogue générique — une réponse précise à un besoin précis, dans un contexte précis.",
      ap_v2_h4:          'Progression',
      ap_v2_p:           "L'objectif n'est pas l'événement — c'est la courbe. Nous concevons des dispositifs pensés pour produire des résultats mesurables sur la durée.",
      ap_v3_h4:          'Fiabilité',
      ap_v3_p:           "Un dispositif d'entraînement doit être disponible quand on en a besoin. Maintenance incluse, support réactif, zéro dépendance logistique externe.",
      ap_v4_h4:          'Pragmatisme',
      ap_v4_p:           "Nous travaillons avec les contraintes réelles des structures publiques et privées — budgets, procédures, infrastructure. Pas de solutions idéales sur papier.",
      ap_v5_h4:          'Engagement',
      ap_v5_p:           "CRBR Solutions ne livre pas un équipement et disparaît. Nous restons présents sur toute la durée du contrat, comme partenaire opérationnel de vos équipes.",
      ap_v6_h4:          'Discrétion',
      ap_v6_p:           "Nous intervenons dans des environnements sensibles. Confidentialité, sobriété et respect des protocoles de chaque structure sont des standards non-négociables.",

      ap_cta_h2a:        'Parlons de',
      ap_cta_h2b:        'votre structure.',
      ap_cta_p:          "Un premier échange pour comprendre votre contexte et identifier la solution adaptée. Sans engagement, sans déplacement.",
      ap_cta1:           'Prendre contact',
      ap_cta2:           'Voir nos solutions',
      ap_cta_m1:         'Réponse sous 48h',
      ap_cta_m2:         'Sans engagement',
      ap_cta_m3:         'Premier échange gratuit',

      /* --- CONTACT --- */
      con_label:         'Prenons contact',
      con_h1a:           'Un premier échange,',
      con_h1b:           'sans engagement.',
      con_hero_p:        "Décrivez votre structure et vos besoins. Nous revenons vers vous sous 48h avec une analyse de votre situation et une proposition adaptée.",
      con_form_h3:       'Formulaire de contact',
      con_form_sub:      "Tous les champs marqués d'un * sont obligatoires.",
      con_lbl_prenom:    'Prénom',
      con_ph_prenom:     'Votre prénom',
      con_lbl_nom:       'Nom',
      con_ph_nom:        'Votre nom',
      con_lbl_struct:    'Structure / Organisme',
      con_ph_struct:     'Nom de votre structure ou organisme',
      con_lbl_email:     'Email',
      con_ph_email:      'votre@email.fr',
      con_lbl_tel:       'Téléphone',
      con_ph_tel:        '06 XX XX XX XX',
      con_lbl_objet:     'Objet de la demande',
      con_sel_default:   'Sélectionner un objet…',
      con_opt1:          'Demander une présentation',
      con_opt2:          'Offre Base — devis',
      con_opt3:          'Offre Opérationnel — devis',
      con_opt4:          'Offre Premium — devis',
      con_opt5:          'Programme Mobile — devis',
      con_opt6:          'Solution sur mesure',
      con_opt7:          'Demande de devis (général)',
      con_opt8:          'Évaluation des besoins',
      con_opt9:          'Autre / Non déterminé',
      con_lbl_eff:       "Nombre d'effectifs à former (approximatif)",
      con_eff_default:   'Sélectionner une tranche…',
      con_eff1:          'Moins de 10',
      con_eff2:          '10 à 30',
      con_eff3:          '30 à 100',
      con_eff4:          'Plus de 100',
      con_eff5:          'Non communiqué',
      con_lbl_msg:       'Message',
      con_ph_msg:        'Décrivez votre contexte, vos missions, vos contraintes, vos attentes…',
      con_submit:        'Envoyer la demande',
      con_sending:       'Envoi en cours…',
      con_success:       'Votre demande a bien été envoyée. Nous vous répondons sous 48h.',
      con_error_fields:  'Veuillez remplir tous les champs obligatoires.',
      con_error_send:    'Une erreur est survenue. Merci de réessayer ou de nous contacter directement.',

      con_info_label:    'Coordonnées',
      con_info_email:    'E-mail',
      con_info_phone:    'Téléphone',
      con_info_hours:    'Lun.–Ven., 9h–18h',
      con_info_delay:    'Délai de réponse',
      con_info_delay_v:  'Nous répondons sous 48h ouvrées',
      con_info_zone:     "Zone d'intervention",
      con_info_zone_v:   'France métropolitaine et territoires d\'outre-mer',
      con_next_label:    'Ce qui se passe après votre envoi',
      con_next1_strong:  'Lecture de votre demande',
      con_next1_span:    'Nous analysons votre situation et préparons des questions si nécessaire.',
      con_next2_strong:  'Réponse sous 48h',
      con_next2_span:    "Première analyse de votre contexte et proposition d'un premier échange.",
      con_next3_strong:  'Entretien de cadrage',
      con_next3_span:    "Appel ou visioconférence pour affiner votre besoin et construire une proposition adaptée.",
      con_help_label:    'Ce qui nous aide à vous répondre',
      con_help1:         'Le nom et le type de votre structure',
      con_help2:         "Le nombre approximatif d'effectifs",
      con_help3:         'Vos missions et contexte opérationnel',
      con_help4:         "L'infrastructure disponible sur site",
      con_conf_title:    'Échange confidentiel',
      con_conf_p:        "Toutes les informations partagées restent strictement confidentielles. Nous intervenons dans des environnements sensibles et traitons chaque demande avec la discrétion requise.",
    },

    en: {
      /* NAV */
      nav_solutions:     'Our solutions',
      nav_about:         'About',
      nav_contact:       'Contact',
      nav_cta:           'Request a presentation',
      nav_login:         '🔐 Login',
      nav_burger_open:   'Open menu',

      /* FOOTER */
      footer_tagline:    '— Experience-Based Response Design',
      footer_solutions:  'Our solutions',
      footer_about:      'About',
      footer_contact:    'Contact',
      footer_legal:      'Legal notice',
      footer_cgv:        'T&Cs',
      footer_privacy:    'Privacy',
      footer_copy:       'CRBR Solutions. All rights reserved.',

      /* COOKIE */
      cookie_text:       'This site uses technical cookies required for its operation. No personal data is collected without your consent.',
      cookie_btn:        'Accept',

      /* --- INDEX --- */
      idx_badge:         'CRBR — Experience-Based Response Design',
      idx_h1a:           'Strengthening the operational',
      idx_h1b:           'capability of your units.',
      idx_subtitle:      'CRBR Solutions designs and deploys bespoke operational responses — simulators, modular structures, tactical equipment — installed on your premises, permanently available, built from field feedback.',
      idx_hero_cta1:     'Request a presentation',
      idx_hero_cta2:     'Discover our solutions',
      idx_trust1:        'Response within 48h',
      idx_trust2:        'No commitment',
      idx_trust3:        'Long-term rental',

      idx_sol_label:     'Our solutions',
      idx_sol_h2a:       'An operational response',
      idx_sol_h2b:       'for every need.',
      idx_sol_intro:     'CRBR Solutions is not an equipment reseller. We analyse your missions and build the adapted response — combining the technologies, equipment and devices that exactly match your operational reality.',
      idx_s1_h3:         'Shooting simulators',
      idx_s1_p:          'Professional simulation systems for technical and decision-making work. CQB scenarios, precision shooting, stress management. Zero live ammunition, unlimited use.',
      idx_s2_h3:         'Marking ammunition',
      idx_s2_p:          'Physical-impact solutions for maximum realism, without danger or lethality. Ideal for dynamic training and real-scenario immersion for operators.',
      idx_s3_h3:         'Modular shooting house',
      idx_s3_p:          'Panel-based modular structures, reconfigurable to your scenarios. CQB, building entry, tactical progression — permanent installation or relocatable.',
      idx_s4_h3:         'Custom equipment',
      idx_s4_p:          'Breaching doors, specialist kits, modular structures and complementary tactical equipment. Every operational need has an answer. You define the need — CRBR Solutions designs the solution.',

      idx_app_label:     'Our approach',
      idx_app_h2a:       'We analyse your missions.',
      idx_app_h2b:       'We design your solution.',
      idx_app_intro:     'CRBR Solutions is an operational solutions consultant. We analyse your missions, constraints and objectives — then build the adapted system, combining the best available technologies.',
      idx_step1_h4:      'Mission analysis',
      idx_step1_p:       'Understanding your operational context, threats, personnel and infrastructure.',
      idx_step2_h4:      'Custom design',
      idx_step2_p:       'Selection and assembly of adapted technologies — simulator, marking ammunition, CQB, equipment.',
      idx_step3_h4:      'Deployment & follow-up',
      idx_step3_p:       'On-site installation, training of your referents, maintenance and ongoing support included.',
      idx_app_badge1:    'Consultant & integrator',
      idx_app_badge2:    'An expert who combines the best market solutions to meet your exact needs.',

      idx_form_label:    'Our formula',
      idx_form_h2a:      'Installed at your site.',
      idx_form_h2b:      'No heavy investment.',
      idx_form_intro:    'We deploy solutions directly on your premises, under a long-term arrangement. A permanent system, with maintenance and support included — available at any time, no logistics required.',
      idx_fc1_h3:        'Permanent system',
      idx_fc1_p:         'A system deployed on-site at your premises. Controlled and predictable cost, adapted to the constraints of public and private organisations.',
      idx_fc2_h3:        'Maintenance & support',
      idx_fc2_p:         'Regular servicing, scenario updates, equipment replacement when needed. You focus on training.',
      idx_fc3_h3:        'Continuous training support',
      idx_fc3_p:         'Support for your internal referents, programme updates in line with the evolution of your missions and threats.',
      idx_quote:         '"Operational readiness is a continuous investment. Our role is to make it accessible and permanent."',
      idx_quote_cite:    'CRBR Solutions — Operational Solutions Consultant',

      idx_who_label:     'Who it\'s for',
      idx_who_h2a:       'Armed forces, public security',
      idx_who_h2b:       '& private operators.',
      idx_who_intro:     'Continuous operator training, boarding inspection teams, operational readiness maintenance — a permanent system adapted to the pace of every organisation.',
      idx_who_notlisted: 'Your organisation is not listed?',
      idx_who_contact:   'Contact us',
      idx_who_notlisted2:'— we adapt our solutions to any operational need.',

      idx_cta_h2a:       'Ready to transform',
      idx_cta_h2b:       'your training?',
      idx_cta_p:         'Show us your facilities and your needs. We will propose the adapted solution — installed at your site, on a long-term rental basis, with support and maintenance.',
      idx_cta1:          'Request a presentation',
      idx_cta2:          'Discover our solutions',
      idx_micro1:        'Response within 48h',
      idx_micro2:        'No commitment',
      idx_micro3:        'Long-term rental with maintenance',

      /* --- OFFRES --- */
      off_label:         'Our packages',
      off_h1a:           'Four packages.',
      off_h1b:           'One common logic.',
      off_hero_p:        'Each package rests on the same principle — a solution deployed at your premises, adapted to your missions. Everything else is included.',

      off_f1_label:      'Package 1',
      off_f1_title:      'Essential',
      off_f1_p:          'The entry point to structure regular handgun training. Standalone system, zero constraints.',
      off_f1_li1:        'Training device delivered and installed',
      off_f1_li2:        'Handgun replicas',
      off_f1_li3:        'Precision and reflex shooting scenarios',
      off_f1_li4:        'No construction work required',
      off_f1_li5:        'Preventive and corrective maintenance',
      off_f1_li6:        'Software and scenario updates',
      off_f1_li7:        'Unlimited use, no ammunition constraints',
      off_f1_cta:        'Request a quote',

      off_f2_label:      'Package 2',
      off_f2_title:      'Operational',
      off_f2_badge:      'Recommended',
      off_f2_p:          'The core system: dynamic work in confined space (CQB), individual and group targets, shooting humanoids, decision-making scenarios under stress.',
      off_f2_li1:        'All content from the Essential package',
      off_f2_li2:        'Individual and group targets',
      off_f2_li3:        'Shooting humanoids',
      off_f2_li4:        'CQB module — dynamic work in confined space',
      off_f2_li5:        'Stress, decision and intervention scenarios',
      off_f2_li6:        'Maintenance and insurance included',
      off_f2_cta:        'Request a quote',

      off_f3_label:      'Package 3',
      off_f3_title:      'Premium',
      off_f3_p:          'The Operational package enhanced with the marking ammunition module for interactive dynamic training.',
      off_f3_li1:        'All content from the Operational package',
      off_f3_li2:        'Full marking ammunition module',
      off_f3_li3:        'Associated protective equipment',
      off_f3_li4:        'Dynamic confrontation scenarios',
      off_f3_li5:        'Inter-team training',
      off_f3_li6:        'Maintenance and insurance included',
      off_f3_cta:        'Request a quote',

      off_f4_label:      'Package 4',
      off_f4_title:      'Mobile Deployment',
      off_f4_p:          'CRBR Solutions travels to your site with the complete equipment set, following a structured annual programme.',
      off_f4_li1:        'CRBR Solutions deployment at your site',
      off_f4_li2:        'Full mobile equipment brought on-site',
      off_f4_li3:        'Programme structured on an annual cycle',
      off_f4_li4:        '1 to 2 sessions per month',
      off_f4_li5:        'Rotating group organisation',
      off_f4_li6:        'No infrastructure required',
      off_f4_cta:        'Request a quote',

      off_custom_label:  'Custom',
      off_custom_h2a:    'Our solutions are fully',
      off_custom_h2b:    'customisable.',
      off_custom_p:      'Simulators, marking ammunition, modular structures, tactical equipment — we design the system that exactly matches your operational context. You express a need, CRBR Solutions designs the response.',
      off_custom_cta:    'Request a custom solution',
      off_custom_badge1: 'All-inclusive',
      off_custom_badge2: 'Installation, maintenance, insurance and updates — a single contract, no surprises.',

      off_comp_label:    'Comparison',
      off_comp_h2a:      'What each',
      off_comp_h2b:      'package includes.',
      off_comp_th0:      'Included',
      off_comp_th1:      'Essential',
      off_comp_th2:      'Operational',
      off_comp_th3:      'Premium',
      off_comp_th4:      'Mobile',
      off_comp_r1:       'Device delivered and installed',
      off_comp_r2:       'Handguns (replicas)',
      off_comp_r3:       'Individual and group targets',
      off_comp_r4:       'CQB module',
      off_comp_r5:       'Shooting humanoids',
      off_comp_r6:       'Marking ammunition module',
      off_comp_r7:       'Maintenance and insurance',
      off_comp_r8:       'Scenario and software updates',
      off_comp_r9:       'Unlimited use 24/7',
      off_comp_r10:      'Mobile on-site deployment',

      off_multi_h2a:     'Multiple sites',
      off_multi_h2b:     'to equip?',
      off_multi_p:       'Multi-site packages are available on request. Contact us for a proposal tailored to your organisation.',
      off_multi_cta1:    'Contact us',
      off_multi_cta2:    'Request a presentation',
      off_multi_m1:      'Response within 48h',
      off_multi_m2:      'No commitment',
      off_multi_m3:      'First exchange free of charge',

      /* --- A-PROPOS --- */
      ap_label:          'About',
      ap_h1a:            'A field background.',
      ap_h1b:            'A programme designed from the inside.',
      ap_hero_p:         'CRBR Solutions was born from a conviction forged in operational units: regular training is the condition for maintaining competency — and the obstacles that prevent it are not inevitable.',

      ap_found_label:    'The founder',
      ap_found_h2a:      'A military background.',
      ap_found_h2b:      'A pedagogical conviction.',
      ap_found_p1:       'Drawing on operational experience and recognised expertise in training, tactical movement and combat preparation, our founder designed CRBR Solutions to provide security forces with an accessible, permanent and effective training tool.',
      ap_found_p2:       'A commando instructor, he served in units subject to high operational readiness requirements, then led and designed training programmes for security forces. This experience allowed him to identify with precision the structural obstacles that prevent regularity: distance from training centres, scarce time slots, ammunition constraints, difficulty in releasing personnel.',
      ap_found_p3:       'CRBR Solutions is the concrete response to this diagnosis: a relocatable training solution, without ammunition constraints, designed to operate within the real constraints of armed public services.',
      ap_found_quote:    '"Operational training should not be reserved for units with the means to travel. It must reach those who do not have the time — and ideally be there permanently."',
      ap_profile_name:   'Founder & Director',
      ap_profile_role:   'CRBR Solutions — Experience-Based Response Design',
      ap_tl_label:       'Key background',
      ap_tl1_strong:     'Commando training',
      ap_tl1_span:       'Experience in units subject to high operational requirements',
      ap_tl2_strong:     'Expertise in operational scenario work',
      ap_tl2_span:       'Tactical movement, protocols, stress management',
      ap_tl3_strong:     'Leadership of training programmes',
      ap_tl3_span:       'Law enforcement, security, prison environments',
      ap_tl4_strong:     'Design of continuous training programmes',
      ap_tl4_span:       'Instructional engineering, operational readiness',
      ap_tl5_strong:     'Creation of CRBR Solutions',
      ap_tl5_span:       'On-site operational solutions for security forces',

      ap_miss_label:     'Our mission',
      ap_miss_h2a:       'Making operational training',
      ap_miss_h2b:       'permanently accessible.',
      ap_miss_p1:        "CRBR Solutions holds a founding conviction: regular training is the condition for maintaining operational competency — and the obstacles that prevent it are not inevitable. They are solved by the right equipment in the right place.",
      ap_miss_p2:        "Our mission is to put a permanent professional training tool within reach of every unit — regardless of size or location. A simulator installed at your premises, available at any time, no logistics, no constraints.",
      ap_miss_p3:        "This is not day-course training. It is an operational infrastructure that becomes part of your daily life — and produces measurable results over time.",
      ap_miss_badge1:    'Consultant & integrator',
      ap_miss_badge2:    'We combine the best market solutions to meet your exact needs.',

      ap_val_label:      'Our values',
      ap_val_h2a:        'What guides each',
      ap_val_h2b:        'of our decisions.',
      ap_v1_h4:          'Precision',
      ap_v1_p:           'Every solution is designed with exactitude. No generic catalogue — a precise response to a precise need, in a precise context.',
      ap_v2_h4:          'Progression',
      ap_v2_p:           "The goal is not the event — it's the curve. We design systems built to produce measurable results over time.",
      ap_v3_h4:          'Reliability',
      ap_v3_p:           'A training system must be available when needed. Maintenance included, reactive support, zero external logistical dependency.',
      ap_v4_h4:          'Pragmatism',
      ap_v4_p:           'We work within the real constraints of public and private organisations — budgets, procedures, infrastructure. No ideal-on-paper solutions.',
      ap_v5_h4:          'Commitment',
      ap_v5_p:           'CRBR Solutions does not deliver equipment and disappear. We remain present throughout the contract duration, as an operational partner for your teams.',
      ap_v6_h4:          'Discretion',
      ap_v6_p:           'We operate in sensitive environments. Confidentiality, sobriety and respect for each organisation\'s protocols are non-negotiable standards.',

      ap_cta_h2a:        'Let\'s talk about',
      ap_cta_h2b:        'your organisation.',
      ap_cta_p:          'A first exchange to understand your context and identify the right solution. No commitment, no travel required.',
      ap_cta1:           'Get in touch',
      ap_cta2:           'View our solutions',
      ap_cta_m1:         'Response within 48h',
      ap_cta_m2:         'No commitment',
      ap_cta_m3:         'First exchange free of charge',

      /* --- CONTACT --- */
      con_label:         'Get in touch',
      con_h1a:           'A first exchange,',
      con_h1b:           'no commitment.',
      con_hero_p:        'Describe your organisation and your needs. We will get back to you within 48h with an analysis of your situation and an adapted proposal.',
      con_form_h3:       'Contact form',
      con_form_sub:      'Fields marked with * are required.',
      con_lbl_prenom:    'First name',
      con_ph_prenom:     'Your first name',
      con_lbl_nom:       'Last name',
      con_ph_nom:        'Your last name',
      con_lbl_struct:    'Organisation',
      con_ph_struct:     'Name of your organisation',
      con_lbl_email:     'Email',
      con_ph_email:      'your@email.com',
      con_lbl_tel:       'Phone',
      con_ph_tel:        '+33 6 XX XX XX XX',
      con_lbl_objet:     'Subject',
      con_sel_default:   'Select a subject…',
      con_opt1:          'Request a presentation',
      con_opt2:          'Essential package — quote',
      con_opt3:          'Operational package — quote',
      con_opt4:          'Premium package — quote',
      con_opt5:          'Mobile programme — quote',
      con_opt6:          'Custom solution',
      con_opt7:          'General quote request',
      con_opt8:          'Needs assessment',
      con_opt9:          'Other / Undetermined',
      con_lbl_eff:       'Approximate number of personnel to train',
      con_eff_default:   'Select a range…',
      con_eff1:          'Fewer than 10',
      con_eff2:          '10 to 30',
      con_eff3:          '30 to 100',
      con_eff4:          'More than 100',
      con_eff5:          'Not disclosed',
      con_lbl_msg:       'Message',
      con_ph_msg:        'Describe your context, missions, constraints, and expectations…',
      con_submit:        'Send request',
      con_sending:       'Sending…',
      con_success:       'Your request has been sent successfully. We will respond within 48h.',
      con_error_fields:  'Please fill in all required fields.',
      con_error_send:    'An error occurred. Please try again or contact us directly.',

      con_info_label:    'Contact details',
      con_info_email:    'Email',
      con_info_phone:    'Phone',
      con_info_hours:    'Mon.–Fri., 9am–6pm',
      con_info_delay:    'Response time',
      con_info_delay_v:  'We respond within 48 business hours',
      con_info_zone:     'Coverage area',
      con_info_zone_v:   'Metropolitan France and overseas territories',
      con_next_label:    'What happens after you submit',
      con_next1_strong:  'Review of your request',
      con_next1_span:    'We analyse your situation and prepare questions if needed.',
      con_next2_strong:  'Response within 48h',
      con_next2_span:    'Initial analysis of your context and proposal for a first exchange.',
      con_next3_strong:  'Scoping call',
      con_next3_span:    'Phone or video call to refine your need and build an adapted proposal.',
      con_help_label:    'What helps us respond',
      con_help1:         'The name and type of your organisation',
      con_help2:         'Approximate number of personnel',
      con_help3:         'Your missions and operational context',
      con_help4:         'Available on-site infrastructure',
      con_conf_title:    'Confidential exchange',
      con_conf_p:        'All information shared remains strictly confidential. We operate in sensitive environments and handle every request with the required discretion.',
    }
  };

  /* ---- page detection ---- */
  function detectPage() {
    if (document.getElementById('solutions'))     return 'index';
    if (document.querySelector('.formula-2x2'))   return 'offres';
    if (document.querySelector('.about-grid'))    return 'apropos';
    if (document.getElementById('contactForm'))   return 'contact';
    return 'unknown';
  }

  /* ---- helpers ---- */
  function setText(sel, val) {
    var el = document.querySelector(sel);
    if (el) el.textContent = val;
  }
  function setAttr(sel, attr, val) {
    var el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  }
  function setAllText(sel, val) {
    document.querySelectorAll(sel).forEach(function(el){ el.textContent = val; });
  }
  function setAllAttr(sel, attr, val) {
    document.querySelectorAll(sel).forEach(function(el){ el.setAttribute(attr, val); });
  }

  /* ---- apply translations ---- */
  function applyNav(t) {
    setAllText('.nav__link[href="offres.html"], .nav__link[href="offres.html"]', t.nav_solutions);
    document.querySelectorAll('.nav__link').forEach(function(el) {
      var href = el.getAttribute('href');
      if (href === 'offres.html')    el.textContent = t.nav_solutions;
      if (href === 'a-propos.html')  el.textContent = t.nav_about;
      if (href === 'contact.html')   el.textContent = t.nav_contact;
    });
    document.querySelectorAll('.btn--tactical.btn--sm').forEach(function(el) {
      if (el.getAttribute('href') && el.getAttribute('href').indexOf('presentation') !== -1)
        el.textContent = t.nav_cta;
    });
    document.querySelectorAll('.btn--connexion.btn--sm').forEach(function(el) {
      el.textContent = t.nav_login;
    });
    setAttr('#navBurger', 'aria-label', t.nav_burger_open);
  }

  function applyFooter(t) {
    document.querySelectorAll('.footer__links a').forEach(function(el) {
      var href = el.getAttribute('href');
      if (href === 'offres.html')          el.textContent = t.footer_solutions;
      if (href === 'a-propos.html')        el.textContent = t.footer_about;
      if (href === 'contact.html')         el.textContent = t.footer_contact;
      if (href === 'mentions-legales.html') el.textContent = t.footer_legal;
      if (href === 'cgv.html')             el.textContent = t.footer_cgv;
      if (href === 'confidentialite.html') el.textContent = t.footer_privacy;
    });
    var copy = document.querySelector('.footer__copy');
    if (copy) {
      var year = new Date().getFullYear();
      copy.textContent = '\u00a9 ' + year + ' ' + t.footer_copy;
    }
    var tagSpan = document.querySelector('.footer__brand span');
    if (tagSpan) tagSpan.textContent = t.footer_tagline;
  }

  function applyCookie(t) {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return;
    var p = banner.querySelector('p');
    var btn = banner.querySelector('button');
    if (p) p.textContent = t.cookie_text;
    if (btn) btn.textContent = t.cookie_btn;
  }

  function applyIndex(t) {
    setText('.hero__badge', t.idx_badge);
    var h1 = document.querySelector('.hero__title');
    if (h1) {
      var span = h1.querySelector('span');
      var spanText = span ? span.outerHTML.replace(span.textContent, t.idx_h1b) : '';
      h1.innerHTML = t.idx_h1a + '<br>' + spanText.replace(span.textContent, t.idx_h1b);
    }
    setText('.hero__subtitle', t.idx_subtitle);

    var ctaBtns = document.querySelectorAll('.hero__cta .btn');
    if (ctaBtns[0]) ctaBtns[0].childNodes[0].textContent = t.idx_hero_cta1 + ' ';
    if (ctaBtns[1]) ctaBtns[1].textContent = t.idx_hero_cta2;

    var trustItems = document.querySelectorAll('.hero__trust-item');
    if (trustItems[0]) trustItems[0].lastChild.textContent = t.idx_trust1;
    if (trustItems[1]) trustItems[1].lastChild.textContent = t.idx_trust2;
    if (trustItems[2]) trustItems[2].lastChild.textContent = t.idx_trust3;

    /* Solutions section */
    var solSection = document.getElementById('solutions');
    if (solSection) {
      setText('#solutions .section-label', t.idx_sol_label);
      var solH2 = solSection.querySelector('h2');
      if (solH2) solH2.innerHTML = t.idx_sol_h2a + '<br><span style="color:var(--fg-muted);font-weight:800;">' + t.idx_sol_h2b + '</span>';
      var solP = solSection.querySelector('.section-header p');
      if (solP) solP.textContent = t.idx_sol_intro;

      var cards = solSection.querySelectorAll('.solution-card');
      var cardData = [
        [t.idx_s1_h3, t.idx_s1_p],
        [t.idx_s2_h3, t.idx_s2_p],
        [t.idx_s3_h3, t.idx_s3_p],
        [t.idx_s4_h3, t.idx_s4_p],
      ];
      cards.forEach(function(card, i) {
        var h3 = card.querySelector('h3');
        var p  = card.querySelector('p');
        if (h3 && cardData[i]) h3.textContent = cardData[i][0];
        if (p  && cardData[i]) p.textContent  = cardData[i][1];
      });
    }

    /* Approche section */
    var appSection = document.getElementById('approche');
    if (appSection) {
      setText('#approche .section-label', t.idx_app_label);
      var appH2 = appSection.querySelector('h2');
      if (appH2) appH2.innerHTML = t.idx_app_h2a + '<br><span style="color:var(--fg-muted);font-weight:800;">' + t.idx_app_h2b + '</span>';
      var appIntro = appSection.querySelector('.fade-up > .text-muted');
      if (appIntro) appIntro.textContent = t.idx_app_intro;

      var steps = appSection.querySelectorAll('.approach-step');
      var stepData = [
        [t.idx_step1_h4, t.idx_step1_p],
        [t.idx_step2_h4, t.idx_step2_p],
        [t.idx_step3_h4, t.idx_step3_p],
      ];
      steps.forEach(function(step, i) {
        var h4 = step.querySelector('h4');
        var p  = step.querySelector('p');
        if (h4 && stepData[i]) h4.textContent = stepData[i][0];
        if (p  && stepData[i]) p.textContent  = stepData[i][1];
      });

      var badge = appSection.querySelector('.approach-badge');
      if (badge) {
        var bps = badge.querySelectorAll('p');
        if (bps[0]) bps[0].textContent = t.idx_app_badge1;
        if (bps[1]) bps[1].textContent = t.idx_app_badge2;
      }
    }

    /* Formule section */
    var formSection = document.getElementById('formule');
    if (formSection) {
      setText('#formule .section-label', t.idx_form_label);
      var fH2 = formSection.querySelector('h2');
      if (fH2) fH2.innerHTML = t.idx_form_h2a + '<br><span style="color:var(--fg-muted);font-weight:800;">' + t.idx_form_h2b + '</span>';
      var fIntro = formSection.querySelector('.section-header p');
      if (fIntro) fIntro.textContent = t.idx_form_intro;

      var fcards = formSection.querySelectorAll('.formula-card');
      var fcData = [
        [t.idx_fc1_h3, t.idx_fc1_p],
        [t.idx_fc2_h3, t.idx_fc2_p],
        [t.idx_fc3_h3, t.idx_fc3_p],
      ];
      fcards.forEach(function(fc, i) {
        var h3 = fc.querySelector('h3');
        var p  = fc.querySelector('p');
        if (h3 && fcData[i]) h3.textContent = fcData[i][0];
        if (p  && fcData[i]) p.textContent  = fcData[i][1];
      });

      var bq = formSection.querySelector('blockquote');
      var cite = formSection.querySelector('cite');
      if (bq) bq.textContent = t.idx_quote;
      if (cite) cite.textContent = t.idx_quote_cite;
    }

    /* Pour qui */
    var whoSection = document.getElementById('clients');
    if (whoSection) {
      setText('#clients .section-label', t.idx_who_label);
      var wH2 = whoSection.querySelector('h2');
      if (wH2) wH2.innerHTML = t.idx_who_h2a + '<br><span style="color:var(--fg-muted);font-weight:800;">' + t.idx_who_h2b + '</span>';
      var wIntro = whoSection.querySelector('.section-header p');
      if (wIntro) wIntro.textContent = t.idx_who_intro;
      var wNote = whoSection.querySelector('.text-center');
      if (wNote) {
        var wLink = wNote.querySelector('a');
        wNote.childNodes[0].textContent = t.idx_who_notlisted + ' ';
        if (wLink) wLink.textContent = t.idx_who_contact;
        wNote.lastChild.textContent = ' ' + t.idx_who_notlisted2;
      }
    }

    /* CTA block */
    var ctaSection = document.querySelector('#formule ~ .section .cta-block');
    if (!ctaSection) ctaSection = document.querySelector('.section:not(.section--dark) .cta-block');
    if (ctaSection) {
      var ctaH2 = ctaSection.querySelector('h2');
      if (ctaH2) ctaH2.innerHTML = t.idx_cta_h2a + '<br><span class="text-gradient">' + t.idx_cta_h2b + '</span>';
      var ctaP = ctaSection.querySelector('p');
      if (ctaP) ctaP.textContent = t.idx_cta_p;
      var ctaBs = ctaSection.querySelectorAll('.cta-block__btns .btn');
      if (ctaBs[0]) ctaBs[0].childNodes[0].textContent = t.idx_cta1 + ' ';
      if (ctaBs[1]) ctaBs[1].textContent = t.idx_cta2;
      var micros = ctaSection.querySelectorAll('.cta-block__micro span');
      if (micros[0]) micros[0].textContent = t.idx_micro1;
      if (micros[1]) micros[1].textContent = t.idx_micro2;
      if (micros[2]) micros[2].textContent = t.idx_micro3;
    }
  }

  function applyOffres(t) {
    setText('.page-hero .section-label', t.off_label);
    var ph1 = document.querySelector('.page-hero h1');
    if (ph1) ph1.innerHTML = t.off_h1a + '<br><span class="text-gradient">' + t.off_h1b + '</span>';
    var php = document.querySelector('.page-hero p');
    if (php) php.textContent = t.off_hero_p;

    var cards = document.querySelectorAll('.formula-2x2 .solution-card');
    var fData = [
      { label: t.off_f1_label, title: t.off_f1_title, badge: null, p: t.off_f1_p, cta: t.off_f1_cta,
        lis: [t.off_f1_li1,t.off_f1_li2,t.off_f1_li3,t.off_f1_li4,t.off_f1_li5,t.off_f1_li6,t.off_f1_li7] },
      { label: t.off_f2_label, title: t.off_f2_title, badge: t.off_f2_badge, p: t.off_f2_p, cta: t.off_f2_cta,
        lis: [t.off_f2_li1,t.off_f2_li2,t.off_f2_li3,t.off_f2_li4,t.off_f2_li5,t.off_f2_li6] },
      { label: t.off_f3_label, title: t.off_f3_title, badge: null, p: t.off_f3_p, cta: t.off_f3_cta,
        lis: [t.off_f3_li1,t.off_f3_li2,t.off_f3_li3,t.off_f3_li4,t.off_f3_li5,t.off_f3_li6] },
      { label: t.off_f4_label, title: t.off_f4_title, badge: null, p: t.off_f4_p, cta: t.off_f4_cta,
        lis: [t.off_f4_li1,t.off_f4_li2,t.off_f4_li3,t.off_f4_li4,t.off_f4_li5,t.off_f4_li6] },
    ];
    cards.forEach(function(card, i) {
      var fd = fData[i];
      if (!fd) return;
      var labelEl = card.querySelector('.formula-label');
      var titleEl = card.querySelector('.formula-title');
      var badgeEl = card.querySelector('.solution-card__badge');
      var pEl     = card.querySelector('.formula-body p');
      var ctaEl   = card.querySelector('.formula-body .btn');
      var liEls   = card.querySelectorAll('.offer-checklist li');
      if (labelEl) labelEl.textContent = fd.label;
      if (titleEl) titleEl.textContent = fd.title;
      if (badgeEl && fd.badge) badgeEl.textContent = fd.badge;
      if (pEl) pEl.textContent = fd.p;
      if (ctaEl) ctaEl.childNodes[0].textContent = fd.cta + ' ';
      liEls.forEach(function(li, j) { if (fd.lis[j] !== undefined) li.textContent = fd.lis[j]; });
    });

    /* Sur-mesure section */
    var custom = document.querySelector('.section--dark .approach-grid');
    if (custom) {
      var cLabel = custom.querySelector('.section-label');
      var cH2    = custom.querySelector('h2');
      var cP     = custom.querySelector('p.text-muted');
      var cCta   = custom.querySelector('.btn--outline');
      var cBadge = custom.querySelector('.approach-badge');
      if (cLabel) cLabel.textContent = t.off_custom_label;
      if (cH2) cH2.innerHTML = t.off_custom_h2a + '<br><span style="color:var(--fg-muted);font-weight:800;">' + t.off_custom_h2b + '</span>';
      if (cP) cP.textContent = t.off_custom_p;
      if (cCta) cCta.childNodes[0].textContent = t.off_custom_cta + ' ';
      if (cBadge) {
        var bps = cBadge.querySelectorAll('p');
        if (bps[0]) bps[0].textContent = t.off_custom_badge1;
        if (bps[1]) bps[1].textContent = t.off_custom_badge2;
      }
    }

    /* Tableau comparatif */
    var compSection = document.querySelector('.table-wrap');
    if (compSection) {
      var compHeader = compSection.closest('.section');
      if (compHeader) {
        setText('.table-wrap ~ *', ''); // no-op
        var compSLabel = compHeader.querySelector('.section-label');
        var compH2     = compHeader.querySelector('h2');
        if (compSLabel) compSLabel.textContent = t.off_comp_label;
        if (compH2) compH2.innerHTML = t.off_comp_h2a + '<br><span style="color:var(--fg-muted);font-weight:800;">' + t.off_comp_h2b + '</span>';
      }
      var ths = compSection.querySelectorAll('thead th');
      var thData = [t.off_comp_th0,t.off_comp_th1,t.off_comp_th2,t.off_comp_th3,t.off_comp_th4];
      ths.forEach(function(th, i){ if (thData[i]) th.textContent = thData[i]; });
      var rows = compSection.querySelectorAll('tbody tr');
      var rowData = [t.off_comp_r1,t.off_comp_r2,t.off_comp_r3,t.off_comp_r4,t.off_comp_r5,
                     t.off_comp_r6,t.off_comp_r7,t.off_comp_r8,t.off_comp_r9,t.off_comp_r10];
      rows.forEach(function(row, i) {
        var td0 = row.querySelector('td:first-child');
        if (td0 && rowData[i]) td0.textContent = rowData[i];
      });
    }

    /* Multi-sites CTA */
    var multiCta = document.querySelector('.section--dark .cta-block');
    if (multiCta) {
      var mH2 = multiCta.querySelector('h2');
      if (mH2) mH2.innerHTML = t.off_multi_h2a + '<br><span class="text-gradient">' + t.off_multi_h2b + '</span>';
      var mP = multiCta.querySelector('p');
      if (mP) mP.textContent = t.off_multi_p;
      var mBtns = multiCta.querySelectorAll('.cta-block__btns .btn');
      if (mBtns[0]) mBtns[0].childNodes[0].textContent = t.off_multi_cta1 + ' ';
      if (mBtns[1]) mBtns[1].textContent = t.off_multi_cta2;
      var mMicros = multiCta.querySelectorAll('.cta-block__micro span');
      if (mMicros[0]) mMicros[0].textContent = t.off_multi_m1;
      if (mMicros[1]) mMicros[1].textContent = t.off_multi_m2;
      if (mMicros[2]) mMicros[2].textContent = t.off_multi_m3;
    }
  }

  function applyApropos(t) {
    setText('.page-hero .section-label', t.ap_label);
    var ph1 = document.querySelector('.page-hero h1');
    if (ph1) ph1.innerHTML = t.ap_h1a + '<br>' + t.ap_h1b;
    var php = document.querySelector('.page-hero p');
    if (php) php.textContent = t.ap_hero_p;

    /* Fondateur */
    var aboutGrid = document.querySelector('.about-grid');
    if (aboutGrid) {
      var fLabel = aboutGrid.querySelector('.section-label');
      var fH2    = aboutGrid.querySelector('h2');
      var fPs    = aboutGrid.querySelectorAll(':scope > div:first-child > p.text-muted');
      var fQuote = aboutGrid.querySelector('.quote-block p');
      if (fLabel) fLabel.textContent = t.ap_found_label;
      if (fH2) fH2.innerHTML = t.ap_found_h2a + '<br><span style="color:var(--fg-muted);font-weight:800;">' + t.ap_found_h2b + '</span>';
      if (fPs[0]) fPs[0].textContent = t.ap_found_p1;
      if (fPs[1]) fPs[1].textContent = t.ap_found_p2;
      if (fPs[2]) fPs[2].textContent = t.ap_found_p3;
      if (fQuote) fQuote.textContent = t.ap_found_quote;

      var pName = aboutGrid.querySelector('.profile-card__name');
      var pRole = aboutGrid.querySelector('.profile-card__role');
      var tlLabel = aboutGrid.querySelector('.profile-card__body-label');
      if (pName) pName.textContent = t.ap_profile_name;
      if (pRole) pRole.textContent = t.ap_profile_role;
      if (tlLabel) tlLabel.textContent = t.ap_tl_label;

      var tls = aboutGrid.querySelectorAll('.timeline-item');
      var tlData = [
        [t.ap_tl1_strong, t.ap_tl1_span],
        [t.ap_tl2_strong, t.ap_tl2_span],
        [t.ap_tl3_strong, t.ap_tl3_span],
        [t.ap_tl4_strong, t.ap_tl4_span],
        [t.ap_tl5_strong, t.ap_tl5_span],
      ];
      tls.forEach(function(tl, i) {
        var strong = tl.querySelector('strong');
        var span   = tl.querySelector('span');
        if (strong && tlData[i]) strong.textContent = tlData[i][0];
        if (span   && tlData[i]) span.textContent   = tlData[i][1];
      });
    }

    /* Mission */
    var missSection = document.querySelector('.section--dark .approach-grid');
    if (missSection) {
      var mLabel = missSection.querySelector('.section-label');
      var mH2    = missSection.querySelector('h2');
      var mPs    = missSection.querySelectorAll('.fade-up > p.text-muted');
      var mBadge = missSection.querySelector('.approach-badge');
      if (mLabel) mLabel.textContent = t.ap_miss_label;
      if (mH2) mH2.innerHTML = t.ap_miss_h2a + '<br><span style="color:var(--fg-muted);font-weight:800;">' + t.ap_miss_h2b + '</span>';
      if (mPs[0]) mPs[0].textContent = t.ap_miss_p1;
      if (mPs[1]) mPs[1].textContent = t.ap_miss_p2;
      if (mPs[2]) mPs[2].textContent = t.ap_miss_p3;
      if (mBadge) {
        var bps = mBadge.querySelectorAll('p');
        if (bps[0]) bps[0].textContent = t.ap_miss_badge1;
        if (bps[1]) bps[1].textContent = t.ap_miss_badge2;
      }
    }

    /* Valeurs */
    var valSection = document.querySelector('.values-grid');
    if (valSection) {
      var vHeader = valSection.closest('.section');
      if (vHeader) {
        var vLabel = vHeader.querySelector('.section-label');
        var vH2    = vHeader.querySelector('h2');
        if (vLabel) vLabel.textContent = t.ap_val_label;
        if (vH2) vH2.innerHTML = t.ap_val_h2a + '<br><span style="color:var(--fg-muted);font-weight:800;">' + t.ap_val_h2b + '</span>';
      }
      var vcards = valSection.querySelectorAll('.value-card');
      var vData = [
        [t.ap_v1_h4, t.ap_v1_p], [t.ap_v2_h4, t.ap_v2_p], [t.ap_v3_h4, t.ap_v3_p],
        [t.ap_v4_h4, t.ap_v4_p], [t.ap_v5_h4, t.ap_v5_p], [t.ap_v6_h4, t.ap_v6_p],
      ];
      vcards.forEach(function(vc, i) {
        var h4 = vc.querySelector('h4');
        var p  = vc.querySelector('p');
        if (h4 && vData[i]) h4.textContent = vData[i][0];
        if (p  && vData[i]) p.textContent  = vData[i][1];
      });
    }

    /* CTA */
    var ctaBlock = document.querySelector('.cta-block');
    if (ctaBlock) {
      var cH2 = ctaBlock.querySelector('h2');
      if (cH2) cH2.innerHTML = t.ap_cta_h2a + '<br><span class="text-gradient">' + t.ap_cta_h2b + '</span>';
      var cP = ctaBlock.querySelector('p');
      if (cP) cP.textContent = t.ap_cta_p;
      var cBtns = ctaBlock.querySelectorAll('.cta-block__btns .btn');
      if (cBtns[0]) cBtns[0].childNodes[0].textContent = t.ap_cta1 + ' ';
      if (cBtns[1]) cBtns[1].textContent = t.ap_cta2;
      var cMicros = ctaBlock.querySelectorAll('.cta-block__micro span');
      if (cMicros[0]) cMicros[0].textContent = t.ap_cta_m1;
      if (cMicros[1]) cMicros[1].textContent = t.ap_cta_m2;
      if (cMicros[2]) cMicros[2].textContent = t.ap_cta_m3;
    }
  }

  function applyContact(t) {
    setText('.page-hero .section-label', t.con_label);
    var ph1 = document.querySelector('.page-hero h1');
    if (ph1) ph1.innerHTML = t.con_h1a + '<br>' + t.con_h1b;
    var php = document.querySelector('.page-hero p');
    if (php) php.textContent = t.con_hero_p;

    setText('.form-card h3', t.con_form_h3);
    setText('.form-sub', t.con_form_sub);

    /* form labels & placeholders */
    var lbl = document.querySelector('label[for="prenom"]');
    if (lbl) { lbl.childNodes[0].textContent = t.con_lbl_prenom + ' '; }
    setAttr('#prenom', 'placeholder', t.con_ph_prenom);
    var lblNom = document.querySelector('label[for="nom"]');
    if (lblNom) { lblNom.childNodes[0].textContent = t.con_lbl_nom + ' '; }
    setAttr('#nom', 'placeholder', t.con_ph_nom);
    var lblStr = document.querySelector('label[for="structure"]');
    if (lblStr) { lblStr.childNodes[0].textContent = t.con_lbl_struct + ' '; }
    setAttr('#structure', 'placeholder', t.con_ph_struct);
    var lblEmail = document.querySelector('label[for="email"]');
    if (lblEmail) { lblEmail.childNodes[0].textContent = t.con_lbl_email + ' '; }
    setAttr('#email', 'placeholder', t.con_ph_email);
    setText('label[for="telephone"]', t.con_lbl_tel);
    setAttr('#telephone', 'placeholder', t.con_ph_tel);
    var lblFormule = document.querySelector('label[for="formule"]');
    if (lblFormule) { lblFormule.childNodes[0].textContent = t.con_lbl_objet + ' '; }
    setText('label[for="effectifs"]', t.con_lbl_eff);

    /* select options */
    var selFormule = document.getElementById('formule');
    if (selFormule) {
      var opts = selFormule.options;
      var optTexts = [t.con_sel_default,t.con_opt1,t.con_opt2,t.con_opt3,t.con_opt4,
                      t.con_opt5,t.con_opt6,t.con_opt7,t.con_opt8,t.con_opt9];
      for (var i = 0; i < opts.length && i < optTexts.length; i++) opts[i].text = optTexts[i];
    }
    var selEff = document.getElementById('effectifs');
    if (selEff) {
      var eOpts = selEff.options;
      var eTexts = [t.con_eff_default,t.con_eff1,t.con_eff2,t.con_eff3,t.con_eff4,t.con_eff5];
      for (var j = 0; j < eOpts.length && j < eTexts.length; j++) eOpts[j].text = eTexts[j];
    }

    var lblMsg = document.querySelector('label[for="message"]');
    if (lblMsg) { lblMsg.childNodes[0].textContent = t.con_lbl_msg + ' '; }
    setAttr('#message', 'placeholder', t.con_ph_msg);

    var submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.childNodes[0].textContent = t.con_submit + ' ';

    /* Sidebar */
    var infoCards = document.querySelectorAll('.contact-info-card');
    if (infoCards[0]) {
      var iLabel = infoCards[0].querySelector('.contact-info-card__label');
      if (iLabel) iLabel.textContent = t.con_info_label;
      var iItems = infoCards[0].querySelectorAll('.contact-info-item');
      if (iItems[0]) { var s0 = iItems[0].querySelector('strong'); if (s0) s0.textContent = t.con_info_email; }
      if (iItems[1]) {
        var s1 = iItems[1].querySelector('strong'); if (s1) s1.textContent = t.con_info_phone;
        var hoursSpan = iItems[1].querySelector('span[style]'); if (hoursSpan) hoursSpan.textContent = t.con_info_hours;
      }
      if (iItems[2]) {
        var s2 = iItems[2].querySelector('strong'); if (s2) s2.textContent = t.con_info_delay;
        var dSpan = iItems[2].querySelector('span'); if (dSpan) dSpan.textContent = t.con_info_delay_v;
      }
      if (iItems[3]) {
        var s3 = iItems[3].querySelector('strong'); if (s3) s3.textContent = t.con_info_zone;
        var zSpan = iItems[3].querySelector('span'); if (zSpan) zSpan.textContent = t.con_info_zone_v;
      }
    }
    if (infoCards[1]) {
      var n2Label = infoCards[1].querySelector('.contact-info-card__label');
      if (n2Label) n2Label.textContent = t.con_next_label;
      var nItems = infoCards[1].querySelectorAll('.contact-info-item');
      var nData = [
        [t.con_next1_strong, t.con_next1_span],
        [t.con_next2_strong, t.con_next2_span],
        [t.con_next3_strong, t.con_next3_span],
      ];
      nItems.forEach(function(ni, i) {
        var ns = ni.querySelector('strong'); if (ns && nData[i]) ns.textContent = nData[i][0];
        var nsp = ni.querySelector('span');  if (nsp && nData[i]) nsp.textContent = nData[i][1];
      });
    }
    if (infoCards[2]) {
      var h3Label = infoCards[2].querySelector('.contact-info-card__label');
      if (h3Label) h3Label.textContent = t.con_help_label;
      var hItems = infoCards[2].querySelectorAll('.contact-info-item span');
      var hTexts = [t.con_help1, t.con_help2, t.con_help3, t.con_help4];
      hItems.forEach(function(sp, i) { if (hTexts[i]) sp.textContent = hTexts[i]; });
    }
    if (infoCards[3]) {
      var confStrong = infoCards[3].querySelector('strong');
      var confP      = infoCards[3].querySelector('p');
      if (confStrong) confStrong.textContent = t.con_conf_title;
      if (confP) {
        confP.childNodes[confP.childNodes.length - 1].textContent = t.con_conf_p;
      }
    }
  }

  /* ---- main apply ---- */
  function apply(lang) {
    var t = T[lang] || T.fr;
    var page = detectPage();

    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'fr');

    applyNav(t);
    applyFooter(t);
    applyCookie(t);

    if (page === 'index')   applyIndex(t);
    if (page === 'offres')  applyOffres(t);
    if (page === 'apropos') applyApropos(t);
    if (page === 'contact') applyContact(t);

    /* update toggle button labels */
    var label = lang === 'en' ? '🇫🇷 FR' : '🇬🇧 EN';
    var btn = document.getElementById('langToggle');
    if (btn) btn.textContent = label;
    var btnM = document.getElementById('langToggleMobile');
    if (btnM) btnM.textContent = label;
  }

  /* ---- public API ---- */
  var _lang = localStorage.getItem(LANG_KEY) || 'fr';

  window.CRBRi18n = {
    toggle: function () {
      _lang = _lang === 'fr' ? 'en' : 'fr';
      localStorage.setItem(LANG_KEY, _lang);
      apply(_lang);
    },
    get: function () { return _lang; },
    lang: _lang
  };

  /* auto-apply on load */
  document.addEventListener('DOMContentLoaded', function () {
    if (_lang === 'en') apply('en');
    /* always set correct button labels */
    var label = _lang === 'en' ? '🇫🇷 FR' : '🇬🇧 EN';
    var btn = document.getElementById('langToggle');
    if (btn) btn.textContent = label;
    var btnM = document.getElementById('langToggleMobile');
    if (btnM) btnM.textContent = label;
  });

})();
