import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import crbrApproche from "../assets/crbr_approche.jpg";
import crbrClientele from "../assets/crbr_clientele.jpg";
import crbrSimulateur from "../assets/crbr_simulateur.jpg";
import crbrStructure from "../assets/crbr_structure.jpg";
import logoCrbrGroup from "../assets/logo_crbr_group.png";
import logoCrbrSmall from "../assets/logo_crbr_small.png";
import qrCode from "../assets/qr_code_crbr.png";

export const Route = createFileRoute("/")({
  component: Index,
});

// ─── PALETTE ────────────────────────────────────────────────────────────────
const BG    = "#0d0d0f";
const CARD  = "#14141a";
const OR    = "#C9A84C";
const BLANC = "#FFFFFF";
const GRIS  = "#9898a8";
const GRIS_L = "#c8c8d8";

// ─── COMPOSANTS COMMUNS ──────────────────────────────────────────────────────

function DiagonalAccents() {
  return (
    <>
      {/* Coin bas-gauche */}
      <svg
        style={{ position: "absolute", bottom: 0, left: 0, width: 90, height: 140, pointerEvents: "none" }}
        viewBox="0 0 90 140"
      >
        {[0, 10, 20].map((o) => (
          <line key={o} x1={0} y1={140 - o} x2={90 - o} y2={0} stroke={OR} strokeWidth="0.8" opacity="0.5" />
        ))}
      </svg>
      {/* Coin haut-droit */}
      <svg
        style={{ position: "absolute", top: 0, right: 0, width: 90, height: 140, pointerEvents: "none" }}
        viewBox="0 0 90 140"
      >
        {[0, 10, 20].map((o) => (
          <line key={o} x1={90} y1={o} x2={o} y2={140} stroke={OR} strokeWidth="0.8" opacity="0.5" />
        ))}
      </svg>
    </>
  );
}

function PageHeader({ section, page }: { section: string; page: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: OR, textTransform: "uppercase" }}>
          {section}
        </span>
        <span style={{ fontSize: 11, color: GRIS }}>{page}</span>
      </div>
      <div style={{ height: 1, background: `linear-gradient(to right, ${OR}55, transparent)` }} />
    </div>
  );
}

function PageFooter() {
  return (
    <div style={{ marginTop: "auto", paddingTop: 16 }}>
      <div style={{ height: 1, background: `linear-gradient(to right, ${OR}55, transparent)`, marginBottom: 8 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, color: GRIS, letterSpacing: "0.5px" }}>
          CRBR SOLUTIONS — CONSULTING OPÉRATIONNEL
        </span>
        <span style={{ fontSize: 9, fontWeight: 700, color: OR, letterSpacing: "1px" }}>
          DOCUMENT CONFIDENTIEL
        </span>
        <span style={{ fontSize: 9, color: GRIS, letterSpacing: "0.5px" }}>
          WWW.CRBR-SOLUTION.FR
        </span>
      </div>
    </div>
  );
}

function Page({ children, noPrint = false }: { children: ReactNode; noPrint?: boolean }) {
  return (
    <div
      className={noPrint ? "" : "page"}
      style={{
        position: "relative",
        background: BG,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "28px 44px 20px",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: GRIS_L,
        overflow: "hidden",
        borderBottom: `1px solid rgba(201,168,76,0.08)`,
      }}
    >
      <DiagonalAccents />
      {children}
    </div>
  );
}

function SectionTitle({ label, title, subtitle }: { label: string; title: ReactNode; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: OR, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </p>
      <div style={{ width: 36, height: 2, background: OR, marginBottom: 10 }} />
      <h2 style={{ fontSize: "clamp(26px,3.5vw,38px)", fontWeight: 700, color: BLANC, lineHeight: 1.2, margin: 0 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 14, color: GRIS_L, marginTop: 8, lineHeight: 1.6 }}>{subtitle}</p>
      )}
    </div>
  );
}

function CardBox({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid rgba(201,168,76,0.12)`,
        borderRadius: 3,
        padding: "20px 22px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <>
      <p style={{ fontSize: 12, fontWeight: 700, color: BLANC, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>
        {children}
      </p>
      <div style={{ width: 28, height: 2, background: OR, marginBottom: 10 }} />
    </>
  );
}

function GoldCardSubtitle({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, color: OR, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
      {children}
    </p>
  );
}

function Check({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: GRIS_L, display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
      <span style={{ color: OR, fontWeight: 700, flexShrink: 0 }}>✓</span>
      {children}
    </p>
  );
}

function HighlightBox({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div style={{ background: CARD, border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 3, padding: "16px 20px", marginTop: 20 }}>
      {label && (
        <p style={{ fontSize: 10, fontWeight: 700, color: OR, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

function Body({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 13, color: GRIS_L, lineHeight: 1.65, ...style }}>
      {children}
    </p>
  );
}

// ─── PAGE 1 : COUVERTURE ──────────────────────────────────────────────────────

function Page01_Cover() {
  return (
    <div
      className="page"
      style={{
        position: "relative",
        minHeight: "100vh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Photo haut */}
      <div style={{ position: "relative", height: "38vh", overflow: "hidden" }}>
        <img
          src={crbrSimulateur}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: "brightness(0.55)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(13,13,15,0.95))" }} />
      </div>

      {/* Diagonales gauche & droite */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: 80, height: "100%", pointerEvents: "none" }} viewBox="0 0 80 800" preserveAspectRatio="none">
        {[0, 15, 30].map((o) => (
          <line key={o} x1={80 - o} y1={0} x2={o} y2={800} stroke={OR} strokeWidth="1.2" opacity="0.55" />
        ))}
      </svg>
      <svg style={{ position: "absolute", top: 0, right: 0, width: 80, height: "100%", pointerEvents: "none" }} viewBox="0 0 80 800" preserveAspectRatio="none">
        {[0, 15, 30].map((o) => (
          <line key={o} x1={o} y1={0} x2={80 - o} y2={800} stroke={OR} strokeWidth="1.2" opacity="0.55" />
        ))}
      </svg>

      {/* Logo */}
      <div style={{ position: "absolute", top: 32, left: "50%", transform: "translateX(-50%)", zIndex: 2 }}>
        <img src={logoCrbrGroup} alt="CRBR Group" style={{ height: 80, objectFit: "contain" }} />
      </div>

      {/* Centre : titre */}
      <div style={{ position: "absolute", top: "35%", left: "50%", transform: "translateX(-50%)", width: "80%", textAlign: "center", zIndex: 2 }}>
        <h1 style={{ fontSize: "clamp(42px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.0, margin: 0, letterSpacing: "-1px" }}>
          <span style={{ color: GRIS_L }}>STRUCTURER</span>
          <br />
          <span style={{ color: OR }}>LA RÉPONSE</span>
          <br />
          <span style={{ color: OR }}>OPÉRATIONNELLE</span>
        </h1>
        <div style={{ width: "60%", height: 1, background: `linear-gradient(to right, transparent, ${OR}, transparent)`, margin: "20px auto" }} />
        <p style={{ fontSize: 13, color: GRIS_L, letterSpacing: "4px", textTransform: "uppercase" }}>
          RÉPONSES CONÇUES À PARTIR DU <span style={{ color: OR, fontWeight: 700 }}>RÉEL.</span>
        </p>
      </div>

      {/* Photo bas */}
      <div style={{ position: "relative", height: "35vh", overflow: "hidden" }}>
        <img
          src={crbrApproche}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.5) sepia(0.2)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,13,15,0.95) 10%, transparent 60%)" }} />
      </div>

      {/* URL bas */}
      <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 2 }}>
        <p style={{ fontSize: 10, color: GRIS, letterSpacing: "4px", textTransform: "uppercase" }}>
          W W W . C R B R - S O L U T I O N . F R
        </p>
      </div>
    </div>
  );
}

// ─── PAGE 2 : CONSTATS TERRAIN ────────────────────────────────────────────────

function Page02_ConstatsTerrain() {
  const obstacles = [
    {
      num: "01",
      titre: "DISTANCE",
      texte: "Les centres d'entraînement sont trop loin. La logistique seule coûte autant que la formation. Le temps de déplacement impacte les opérations.",
    },
    {
      num: "02",
      titre: "CRÉNEAUX",
      texte: "Les plages disponibles sont rares, imposées, rarement compatibles avec le rythme opérationnel de votre unité. Vous prenez ce qu'il reste.",
    },
    {
      num: "03",
      titre: "BUDGET MUNITIONS",
      texte: "Chaque séance de tir réel consomme un budget significatif. Impossible de multiplier les entraînements sans dépasser les enveloppes annuelles.",
    },
    {
      num: "04",
      titre: "EFFECTIFS",
      texte: "Libérer du personnel pour l'entraînement reste un défi permanent. La pression opérationnelle fait passer la formation au second plan.",
    },
  ];

  return (
    <Page>
      <PageHeader section="Constats terrain" page="02 / 13" />
      <SectionTitle
        label="Constats terrain"
        title="CRBR résout les freins à l'entraînement."
        subtitle="L'entraînement régulier, c'est la base. Mais sur le terrain, quatre obstacles bloquent vos unités."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {obstacles.map((o) => (
          <CardBox key={o.num}>
            <p style={{ fontSize: 28, fontWeight: 800, color: OR, lineHeight: 1, marginBottom: 6 }}>{o.num}</p>
            <div style={{ width: 28, height: 2, background: OR, marginBottom: 10 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: BLANC, marginBottom: 8, letterSpacing: "0.5px" }}>{o.titre}</p>
            <Body>{o.texte}</Body>
          </CardBox>
        ))}
      </div>

      <HighlightBox label="LA RÉPONSE CRBR">
        <Body>
          On apporte l'entraînement chez vous. Disponible quand vous en avez besoin. Sans logistique complexe. Sans coûts qui explosent. Adapté à votre réalité.
        </Body>
      </HighlightBox>

      <PageFooter />
    </Page>
  );
}

// ─── PAGE 3 : IDENTITÉ ───────────────────────────────────────────────────────

function Page03_Identite() {
  const valeurs = [
    { titre: "APPROCHE TERRAIN", texte: "Nos consultants viennent du secteur. Pas de commercial — des praticiens. On parle votre langue, on connaît vos contraintes." },
    { titre: "SOLUTION COMPLÈTE", texte: "De l'audit initial à la maintenance annuelle. Un seul point de contact. Pas de multi-fournisseurs à coordonner." },
    { titre: "FLEXIBILITÉ RÉELLE", texte: "Abonnement mensuel ajustable. Évolue avec votre budget et vos besoins. Formule modifiable en cours de contrat." },
    { titre: "RÉSEAU QUALIFIÉ", texte: "Partenaires techniques certifiés, sélectionnés sur références opérationnelles. Pas de sous-traitance inconnue." },
    { titre: "SUPPORT RÉACTIF", texte: "Problème technique = réponse sous 24h, intervention sous 72h. Maintenance préventive incluse dans chaque contrat." },
    { titre: "DISCRÉTION TOTALE", texte: "Environnements sensibles par nature. Protocoles de confidentialité stricts. Aucune communication externe sans accord." },
  ];

  return (
    <Page>
      <PageHeader section="Identité" page="03 / 13" />
      <SectionTitle
        label="Identité"
        title="Pourquoi CRBR Solutions ?"
        subtitle="Un cabinet de consulting spécialisé dans les solutions opérationnelles d'entraînement. Notre mission : rendre l'entraînement de haute qualité accessible à chaque unité — quelle que soit sa taille ou son budget."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, flex: 1 }}>
        {valeurs.map((v) => (
          <CardBox key={v.titre}>
            <CardTitle>{v.titre}</CardTitle>
            <Body style={{ fontSize: 12 }}>{v.texte}</Body>
          </CardBox>
        ))}
      </div>

      <div style={{ marginTop: 20, borderTop: `1px dashed rgba(201,168,76,0.25)`, paddingTop: 16 }}>
        <p style={{ fontSize: 13, fontStyle: "italic", color: GRIS_L, textAlign: "center" }}>
          Un partenaire opérationnel sur la durée — pas un fournisseur qui disparaît après la livraison.
        </p>
      </div>

      <PageFooter />
    </Page>
  );
}

// ─── PAGE 4 : NOTRE APPROCHE ─────────────────────────────────────────────────

function Page04_Approche() {
  const etapes = [
    {
      num: "1",
      titre: "On comprend votre contexte",
      texte: "Vos missions. Vos menaces. Vos effectifs. Ce que vous avez déjà. Pas de grille standard — on écoute avant de proposer. Un entretien, 48h max, puis une analyse écrite de votre situation.",
    },
    {
      num: "2",
      titre: "On conçoit votre solution",
      texte: "Pas de catalogue imposé. On assemble ce qui répond à vos besoins réels, dans votre budget, avec vos contraintes terrain et vos procédures internes. Chaque devis est unique. Rien n'est standard.",
    },
    {
      num: "3",
      titre: "On la met en place et on la maintient",
      texte: "Installation sur site. Formation des référents. Support permanent inclus. On reste partenaire — on ne livre pas et on disparaît. Maintenance préventive, mises à jour, support réactif : tout est inclus.",
    },
  ];

  return (
    <Page>
      <PageHeader section="Notre approche" page="04 / 13" />
      <SectionTitle
        label="Notre approche"
        title="Trois étapes. Une solution intégrée."
        subtitle="Simple, clair, sans engagement caché."
      />

      {/* Photo strip */}
      <div style={{ borderRadius: 3, overflow: "hidden", border: `1px solid rgba(201,168,76,0.2)`, marginBottom: 20, height: 130 }}>
        <img src={crbrApproche} alt="Approche CRBR" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
        {etapes.map((e) => (
          <CardBox key={e.num}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: OR,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, color: BG, flexShrink: 0,
              }}>
                {e.num}
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: BLANC, lineHeight: 1.3 }}>{e.titre}</p>
            </div>
            <div style={{ width: 28, height: 2, background: OR, marginBottom: 10 }} />
            <Body style={{ fontSize: 12 }}>{e.texte}</Body>
          </CardBox>
        ))}
      </div>

      <HighlightBox label="CE QUI NE CHANGE JAMAIS">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 32px" }}>
          <Check>Interlocuteur unique tout au long du contrat</Check>
          <Check>Délais contractualisés et respectés</Check>
          <Check>Adaptation possible en cours de contrat</Check>
          <Check>Aucun engagement caché — tout est écrit avant signature</Check>
        </div>
      </HighlightBox>

      <PageFooter />
    </Page>
  );
}

// ─── PAGE 5 : VALEURS ────────────────────────────────────────────────────────

function Page05_Valeurs() {
  const principes = [
    { num: "01", titre: "PRÉCISION", texte: "Chaque solution répond à un besoin précis, dans un contexte précis. Pas de réponse générique. Pas de sur-dimensionnement. Exactement ce qu'il faut, là où il faut." },
    { num: "02", titre: "PROGRESSION", texte: "Amélioration durable, pas événementielle. Votre niveau monte sur le long terme — pas uniquement les jours de stage. L'entraînement s'intègre dans la routine opérationnelle." },
    { num: "03", titre: "FIABILITÉ", texte: "Ça fonctionne quand vous en avez besoin. La maintenance est incluse, pas en option. Un équipement en panne le jour J n'est pas une option — ni pour vous, ni pour nous." },
    { num: "04", titre: "PRAGMATISME", texte: "On intègre vos contraintes réelles : budgets annuels, procédures marchés publics, infrastructure existante, restrictions opérationnelles. On s'adapte à vous, pas l'inverse." },
    { num: "05", titre: "ENGAGEMENT", texte: "Partenaire opérationnel sur la durée. On reste. On évolue avec vous. On connaît votre contexte après 6 mois de contrat mieux que n'importe quel fournisseur de passage." },
    { num: "06", titre: "DISCRÉTION", texte: "Environnements sensibles par nature. Protocoles de confidentialité stricts. Interventions discrètes. Aucune communication externe sans votre accord explicite." },
  ];

  return (
    <Page>
      <PageHeader section="Identité — Valeurs" page="05 / 13" />
      <SectionTitle
        label="Ce qui nous guide"
        title="Six principes. Aucune posture."
        subtitle="Des engagements concrets, vérifiables sur le terrain."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
        {principes.map((p) => (
          <CardBox key={p.num}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <p style={{ fontSize: 26, fontWeight: 800, color: OR, lineHeight: 1, flexShrink: 0 }}>{p.num}</p>
              <div>
                <div style={{ width: 28, height: 2, background: OR, marginBottom: 6 }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: BLANC, letterSpacing: "1px", marginBottom: 8 }}>{p.titre}</p>
                <Body style={{ fontSize: 12 }}>{p.texte}</Body>
              </div>
            </div>
          </CardBox>
        ))}
      </div>

      <PageFooter />
    </Page>
  );
}

// ─── PAGE 6 : NOTRE OFFRE ────────────────────────────────────────────────────

function Page06_Offre() {
  const domaines = [
    {
      titre: "SYSTÈMES DE TIR AVANCÉS",
      sub: "SIMULATION & TIR",
      texte: "Simulation laser haute-fidélité. Travail technique et décisionnel sans contrainte de munitions réelles. Scénarios réalistes configurables. Analyse de performance par tireur en temps réel. Compatible armes réelles modifiées — aucune munition.",
    },
    {
      titre: "ARMEMENT D'ENTRAÎNEMENT",
      sub: "MANIEMENT & SÉCURITÉ",
      texte: "Réalisme complet de maniement et de gestuelle. Sécurité totale. Compatibilité avec vos protocoles existants. Conçu pour un usage intensif en conditions réelles d'entraînement. Entretien inclus.",
    },
    {
      titre: "STRUCTURES DYNAMIQUES",
      sub: "CQB & PROGRESSION",
      texte: "Escalade, rappel, corde lisse, CQB, progression tactique. Reconfigurable selon vos scénarios en moins d'une heure. Montage / démontage rapide, transportable, sans travaux permanents.",
    },
    {
      titre: "ÉQUIPEMENTS COMPLÉMENTAIRES",
      sub: "ÉQUIPEMENTS TERRAIN",
      texte: "Outils d'effraction, équipement tactique, pyrotechnie d'entraînement, protection balistique. Tout ce qui complète votre dispositif de formation. Sélectionné sur spécifications opérationnelles, pas sur catalogue.",
    },
  ];

  return (
    <Page>
      <PageHeader section="Notre offre" page="06 / 13" />
      <SectionTitle
        label="Quatre domaines"
        title="Une réponse adaptée à vos besoins."
        subtitle="Quatre domaines. Un écosystème complètement intégré."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
        {domaines.map((d) => (
          <CardBox key={d.titre}>
            <CardTitle>{d.titre}</CardTitle>
            <GoldCardSubtitle>{d.sub}</GoldCardSubtitle>
            <Body style={{ fontSize: 12 }}>{d.texte}</Body>
          </CardBox>
        ))}
      </div>

      <div style={{ marginTop: 20, borderTop: `1px dashed rgba(201,168,76,0.25)`, paddingTop: 14 }}>
        <p style={{ fontSize: 13, fontStyle: "italic", color: GRIS_L, textAlign: "center" }}>
          Tout ça fonctionne ensemble. Une solution intégrée. Un seul interlocuteur.
        </p>
      </div>

      <PageFooter />
    </Page>
  );
}

// ─── PAGE 7 : TECHNOLOGIES ───────────────────────────────────────────────────

function Page07_Technologies() {
  const bottom3 = [
    {
      titre: "EFFRACTION & ACCÈS",
      items: ["Battering rams certifiés", "Coupe-verrou hydraulique", "Portes reconfigurables", "Multi-scénarios intérieur / extérieur"],
    },
    {
      titre: "ARMEMENT DÉDIÉ",
      items: ["Réalisme maniement total", "Recul électrique ou gaz", "Entretien & pièces inclus", "Pistolet, carabine, SMG"],
    },
    {
      titre: "DÉPLOIEMENT MOBILE",
      items: ["Remorque tout-terrain", "Autonome (générateur)", "Installation < 2 heures", "Session complète sur site"],
    },
  ];

  return (
    <Page>
      <PageHeader section="Technologies" page="07 / 13" />
      <SectionTitle
        label="Technologies"
        title="Les technologies qui font la différence."
        subtitle="Sélection internationale. Intégration par des professionnels du secteur."
      />

      {/* Top : liste + image */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: BLANC, marginBottom: 10 }}>Capacités principales du système</p>
          <div style={{ width: 28, height: 2, background: OR, marginBottom: 12 }} />
          {[
            "Retour balistique réaliste (recul, son, chaleur)",
            "Analyse comportementale par tireur en temps réel",
            "Scénarios personnalisés (hostiles, neutres, civils)",
            "Compatible armes réelles modifiées — zéro munition",
            "Débriefing vidéo intégré, export possible",
            "Multi-postes : jusqu'à 8 tireurs simultanément",
          ].map((item) => <Check key={item}>{item}</Check>)}
        </div>
        <div style={{ borderRadius: 3, overflow: "hidden", border: `1px solid rgba(201,168,76,0.2)`, position: "relative" }}>
          <img src={crbrSimulateur} alt="Simulation laser" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(13,13,15,0.75)", padding: "8px 12px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: OR, letterSpacing: "1px" }}>SIMULATION LASER HAUTE-FIDÉLITÉ</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {bottom3.map((b) => (
          <CardBox key={b.titre}>
            <CardTitle>{b.titre}</CardTitle>
            {b.items.map((item) => <Check key={item}>{item}</Check>)}
          </CardBox>
        ))}
      </div>

      <HighlightBox>
        <p style={{ fontSize: 12, color: GRIS_L }}>
          <strong style={{ color: OR }}>INTÉGRATION COMPLÈTE</strong>{" "}
          Tous les équipements fonctionnent ensemble — un écosystème cohérent, pas une somme de produits indépendants.
        </p>
      </HighlightBox>

      <PageFooter />
    </Page>
  );
}

// ─── PAGE 8 : SHOOTING HOUSE ─────────────────────────────────────────────────

function Page08_ShootingHouse() {
  const tiers = [
    {
      label: "BASIC",
      surface: "~ 40 m²",
      panneaux: "29 à 36", portes: "4 à 6", ouvertures: "2 à 4",
      desc: "Solution compacte et économique. Idéale pour l'entraînement de base en CQB, dégagements, interventions et prises de décisions.",
      items: ["Progression simple", "CQB basique", "Fondamentaux", "1 à 4 opérateurs"],
      highlight: false,
    },
    {
      label: "PRO",
      badge: "★ RECOMMANDÉ",
      surface: "~ 70 – 85 m²",
      panneaux: "20 à 30", portes: "6 à 10", ouvertures: "4 à 8",
      desc: "Parfait pour des scénarios complexes et réalistes, adapté aux entraînements d'équipes et aux interventions coordonnées.",
      items: ["Scénarios complexes", "Zones multiples", "Équipes ≤ 8 op.", "Recommandé"],
      highlight: true,
    },
    {
      label: "PREMIUM",
      surface: "~ 110 – 120 m²",
      panneaux: "20 à 30", portes: "8 à 12", ouvertures: "6 à 12",
      desc: "La solution haut de gamme pour situations réalistes et complexes. Maximum d'espace et de flexibilité pour entraînements avancés.",
      items: ["Haute complexité", "Situations avancées", "Grande ampleur", "Unités spécialisées"],
      highlight: false,
    },
  ];

  return (
    <Page>
      <PageHeader section="Structure phare" page="08 / 13" />
      <SectionTitle
        label="Structure phare"
        title="La Shooting House modulaire."
        subtitle="Scalable. Reconfigurable. Prête à l'usage. Trois niveaux pour s'adapter à toutes les unités."
      />

      {/* Photo + desc */}
      <div style={{ border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 3, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ background: CARD, padding: "8px 16px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: BLANC }}>Entraînement Police, Gendarmerie, Armée — Paintball / Simulation</p>
        </div>
        <div style={{ height: 100, overflow: "hidden" }}>
          <img src={crbrStructure} alt="Shooting House" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6) sepia(0.3)" }} />
        </div>
        <div style={{ background: CARD, padding: "6px 16px" }}>
          <p style={{ fontSize: 11, color: GRIS }}>Panneau modulaire 80 × 250 × 10 cm — roulettes verrouillables — sans outils spécifiques</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
        {tiers.map((t) => (
          <div
            key={t.label}
            style={{
              background: t.highlight ? OR : CARD,
              border: t.highlight ? "none" : `1px solid rgba(201,168,76,0.2)`,
              borderRadius: 3,
              padding: "18px 16px",
            }}
          >
            {t.badge && (
              <p style={{ fontSize: 9, fontWeight: 700, color: t.highlight ? BG : OR, letterSpacing: "1.5px", marginBottom: 4 }}>
                {t.badge}
              </p>
            )}
            <p style={{ fontSize: 20, fontWeight: 800, color: t.highlight ? BG : OR }}>{t.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: t.highlight ? BG : BLANC }}>{t.surface}</p>
            <p style={{ fontSize: 9, color: t.highlight ? "rgba(13,13,15,0.7)" : GRIS, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>
              SURFACE HABITABLE
            </p>
            {[["Panneaux", t.panneaux], ["Portes", t.portes], ["Ouvertures", t.ouvertures]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${t.highlight ? "rgba(13,13,15,0.15)" : "rgba(201,168,76,0.1)"}`, padding: "4px 0" }}>
                <span style={{ fontSize: 11, color: t.highlight ? BG : GRIS }}>{k}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.highlight ? BG : BLANC }}>{v}</span>
              </div>
            ))}
            <p style={{ fontSize: 11, color: t.highlight ? "rgba(13,13,15,0.8)" : GRIS_L, lineHeight: 1.5, margin: "10px 0 8px" }}>{t.desc}</p>
            {t.items.map((item) => (
              <p key={item} style={{ fontSize: 11, color: t.highlight ? BG : OR, display: "flex", gap: 6, marginBottom: 2 }}>
                <span>✓</span>{item}
              </p>
            ))}
          </div>
        ))}
      </div>

      <HighlightBox label="AVANTAGES COMMUNS À TOUS LES NIVEAUX">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 32px" }}>
          <Check>Montage / démontage rapide — aucun travaux permanents</Check>
          <Check>Transportable — roues intégrées, remorque standard</Check>
          <Check>Reconfigurable à volonté — scénarios illimités</Check>
          <Check>Compatible avec tous les systèmes CRBR</Check>
        </div>
      </HighlightBox>

      <PageFooter />
    </Page>
  );
}

// ─── PAGE 9 : SPECTRE COMPLET ─────────────────────────────────────────────────

function Page09_Spectre() {
  const domaines = [
    {
      titre: "CQB & PROGRESSION",
      texte: "Entrée dynamique. Progression en espace confiné. Techniques avancées d'intervention. Scénarios multi-zones reconfigurables.",
    },
    {
      titre: "SCÉNARIOS IA ADAPTATIFS",
      texte: "Opérateurs virtuels réactifs. Conditions de stress, nuit, contrainte, prise de décision en environnement dégradé.",
    },
    {
      titre: "ÉQUIPEMENT TACTIQUE",
      texte: "Analyse balistique. Progressivité et sécurité garanties. Tir précision, stress, mouvement, multi-cibles.",
    },
    {
      titre: "DÉPLOIEMENT MOBILE",
      texte: "Sessions sur votre site, selon votre planning. Nos consultants viennent avec le matériel. Logistique entièrement gérée par CRBR.",
    },
  ];

  return (
    <Page>
      <PageHeader section="Spectre complet" page="09 / 13" />
      <SectionTitle
        label="Spectre complet"
        title="Au-delà du tir."
        subtitle="Couvrir tous les domaines de vos besoins opérationnels — sans exception."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, flex: 1 }}>
        {domaines.map((d) => (
          <CardBox key={d.titre}>
            <CardTitle>{d.titre}</CardTitle>
            <Body style={{ fontSize: 13 }}>{d.texte}</Body>
          </CardBox>
        ))}
      </div>

      <HighlightBox label="TERRE — AIR — EAU">
        <Body>
          Unité généraliste ou spécialisée. GIGN, RAID, groupement d'intervention, Police Municipale — on s'adapte à chaque contexte. Logistique entièrement gérée par CRBR.
        </Body>
      </HighlightBox>

      <PageFooter />
    </Page>
  );
}

// ─── PAGE 10 : MODÈLE ÉCONOMIQUE ─────────────────────────────────────────────

function Page10_ModeleEco() {
  const plans = [
    { label: "ESSENTIEL", desc: "Les bases de l'entraînement, maintenance incluse. Idéal pour démarrer.", highlight: false },
    { label: "OPÉRATIONNEL", badge: "★ RECOMMANDÉE", desc: "Spectre élargi, CQB avancé. Formule recommandée pour unités opérationnelles.", highlight: true },
    { label: "PREMIUM", desc: "Complet, personnalisé, toutes options. Solution haute intensité.", highlight: false },
    { label: "MOBILE", desc: "Sessions régulières sur votre site. On vient avec l'équipement.", highlight: false },
  ];

  return (
    <Page>
      <PageHeader section="Modèle économique" page="10 / 13" />
      <SectionTitle
        label="Modèle économique"
        title="Une solution adaptée à vos réalités budgétaires."
        subtitle="Abonnement mensuel. Budget prévisible. Tout inclus."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <CardBox>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#e05050", letterSpacing: "1px", marginBottom: 6 }}>PROBLÈME HABITUEL</p>
          <Body style={{ fontSize: 12 }}>
            Achat unique : 150 000 – 300 000 €. Budget bloqué. Procédures marchés publics incompatibles. Maintenance = contrat supplémentaire. Surprises.
          </Body>
        </CardBox>
        <CardBox style={{ border: `1px solid rgba(201,168,76,0.35)` }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: OR, letterSpacing: "1px", marginBottom: 6 }}>APPROCHE CRBR</p>
          <Body style={{ fontSize: 12 }}>
            Abonnement mensuel. Budget annuel prévisible. Compatible marchés publics (fournisseur récurrent). Maintenance, support et mises à jour : tout inclus.
          </Body>
        </CardBox>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {plans.map((p) => (
          <div
            key={p.label}
            style={{
              background: p.highlight ? OR : CARD,
              border: p.highlight ? "none" : `1px solid rgba(201,168,76,0.15)`,
              borderRadius: 3,
              padding: "16px 14px",
            }}
          >
            {p.badge && (
              <p style={{ fontSize: 9, fontWeight: 700, color: p.highlight ? BG : OR, letterSpacing: "1.5px", marginBottom: 4 }}>
                {p.badge}
              </p>
            )}
            <p style={{ fontSize: 14, fontWeight: 800, color: p.highlight ? BG : OR, marginBottom: 8 }}>{p.label}</p>
            <p style={{ fontSize: 11, color: p.highlight ? "rgba(13,13,15,0.8)" : GRIS_L, lineHeight: 1.5 }}>{p.desc}</p>
          </div>
        ))}
      </div>

      <HighlightBox label="INCLUS DANS TOUS LES CONTRATS CRBR">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 32px" }}>
          <Check>Installation sur site (zéro travaux permanents)</Check>
          <Check>Mises à jour logicielles et nouveaux scénarios</Check>
          <Check>Support technique réactif — interlocuteur unique</Check>
          <Check>Maintenance préventive et corrective</Check>
          <Check>Consommables (munitions simulées, CO₂, etc.)</Check>
        </div>
      </HighlightBox>

      <PageFooter />
    </Page>
  );
}

// ─── PAGE 11 : CLIENTÈLE ──────────────────────────────────────────────────────

function Page11_Clientele() {
  const clients = [
    { sig: "PM", label: "POLICE MUNICIPALE" },
    { sig: "GN", label: "GENDARMERIE NATIONALE" },
    { sig: "PN", label: "POLICE NATIONALE" },
    { sig: "AT", label: "ARMÉE DE TERRE" },
    { sig: "AAE", label: "ARMÉE AIR & ESPACE" },
    { sig: "SP", label: "SÉCURITÉ PRIVÉE" },
    { sig: "AP", label: "ADMIN. PÉNITENTIAIRE" },
    { sig: "FS", label: "FORCES SPÉCIALISÉES" },
  ];

  return (
    <Page>
      <PageHeader section="Clientèle" page="11 / 13" />
      <SectionTitle
        label="Clientèle"
        title="Du niveau local aux unités spécialisées."
        subtitle="Chacun choisit la formule qui convient à son contexte. Pas de solution standard — tout est adaptable à votre réalité budgétaire et opérationnelle."
      />

      {/* Photo */}
      <div style={{ borderRadius: 3, overflow: "hidden", border: `1px solid rgba(201,168,76,0.2)`, marginBottom: 20, height: 120 }}>
        <img src={crbrClientele} alt="Clientèle" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.5)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {clients.map((c) => (
          <CardBox key={c.sig} style={{ textAlign: "center", padding: "18px 12px" }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: OR, lineHeight: 1 }}>{c.sig}</p>
            <div style={{ width: 24, height: 2, background: OR, margin: "8px auto" }} />
            <p style={{ fontSize: 9, fontWeight: 700, color: GRIS_L, letterSpacing: "1px" }}>{c.label}</p>
          </CardBox>
        ))}
      </div>

      <HighlightBox label="PEU IMPORTE VOTRE TAILLE, BUDGET, SPÉCIALITÉ">
        <Body>
          On ne vend pas à tout le monde le même produit. On construit une solution qui correspond exactement à votre unité, votre budget annuel, vos contraintes opérationnelles. PM ou Forces Spéciales — le traitement est le même :{" "}
          <em>sérieux, précis, efficace.</em>
        </Body>
      </HighlightBox>

      <PageFooter />
    </Page>
  );
}

// ─── PAGE 12 : DÉMARRER ──────────────────────────────────────────────────────

function Page12_Demarrer() {
  const etapes = [
    {
      num: "1",
      titre: "Vous nous contactez",
      texte: "Mail, téléphone, formulaire. Pas de RDV commercial forcé. Dites-nous simplement votre situation et vos besoins. On lit, on comprend, on répond — en moins de 48h.",
    },
    {
      num: "2",
      titre: "On échange",
      texte: "Un entretien (pas une présentation commerciale). On comprend votre contexte réel : unité, effectifs, infrastructure, budget annuel. On pose des questions opérationnelles. On écoute avant de proposer.",
    },
    {
      num: "3",
      titre: "On vous propose",
      texte: "Devis sur-mesure, adapté à votre réalité. Pas de contrat piège, pas de frais cachés, pas de surprise. Déploiement rapide. Accompagnement complet depuis le premier jour.",
    },
  ];

  return (
    <Page>
      <PageHeader section="Démarrer" page="12 / 13" />
      <SectionTitle
        label="Démarrer"
        title="Trois étapes simples."
        subtitle="Du premier contact au déploiement — sans friction, sans engagement caché."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, flex: 1 }}>
        {etapes.map((e) => (
          <CardBox key={e.num}>
            <p style={{ fontSize: 56, fontWeight: 900, color: OR, opacity: 0.2, lineHeight: 1, marginBottom: 8 }}>{e.num}</p>
            <div style={{ width: 28, height: 2, background: OR, marginBottom: 10 }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: BLANC, marginBottom: 10 }}>{e.titre}</p>
            <Body style={{ fontSize: 12 }}>{e.texte}</Body>
          </CardBox>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          background: CARD,
          border: `1px solid rgba(201,168,76,0.3)`,
          borderRadius: 3,
          padding: "16px 20px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, color: OR, letterSpacing: "2px", marginBottom: 12 }}>
          ENGAGEMENT CRBR — RÉPONSE GARANTIE SOUS 48H OUVRÉES
        </p>
        <p style={{ fontSize: 13, color: GRIS_L, marginBottom: 4 }}>Vous ne serez jamais noyé dans un CRM.</p>
        <p style={{ fontSize: 13, fontStyle: "italic", color: GRIS_L }}>Une personne. Une réponse. Un suivi clair.</p>
      </div>

      <PageFooter />
    </Page>
  );
}

// ─── PAGE 13 : CONTACT ───────────────────────────────────────────────────────

function Page13_Contact() {
  return (
    <Page>
      <PageHeader section="Contact" page="13 / 13" />

      {/* Hero */}
      <div style={{ position: "relative", marginBottom: 28, borderRadius: 3, overflow: "hidden", height: 140 }}>
        <img src={crbrClientele} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.4)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: OR, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>
            PROCHAINE ÉTAPE
          </p>
          <h2 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 700, color: BLANC, lineHeight: 1.2, margin: 0 }}>
            Parlons de votre<br />
            <span style={{ color: OR }}>entraînement opérationnel.</span>
          </h2>
          <div style={{ height: 1, background: `linear-gradient(to right, ${OR}80, transparent)`, marginTop: 12 }} />
          <p style={{ fontSize: 12, fontStyle: "italic", color: GRIS_L, marginTop: 8 }}>
            Envoyez-nous votre situation. Ensemble, on construit votre solution.
          </p>
        </div>
      </div>

      {/* 3 contact cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <CardBox>
          <CardTitle>EMAIL</CardTitle>
          <p style={{ fontSize: 15, fontWeight: 700, color: BLANC, marginBottom: 8 }}>info@crbr-solution.fr</p>
          <div style={{ width: 28, height: 2, background: OR, marginBottom: 8 }} />
          <p style={{ fontSize: 11, color: GRIS }}>Réponse sous 48h ouvrées</p>
        </CardBox>
        <CardBox>
          <CardTitle>TÉLÉPHONE</CardTitle>
          <p style={{ fontSize: 15, fontWeight: 700, color: BLANC, marginBottom: 8 }}>06 65 44 52 26</p>
          <div style={{ width: 28, height: 2, background: OR, marginBottom: 8 }} />
          <p style={{ fontSize: 11, color: GRIS }}>Lundi au vendredi · 9h – 18h</p>
        </CardBox>
        <CardBox>
          <CardTitle>ZONE</CardTitle>
          <p style={{ fontSize: 15, fontWeight: 700, color: BLANC, marginBottom: 8 }}>France &amp; International</p>
          <div style={{ width: 28, height: 2, background: OR, marginBottom: 8 }} />
          <p style={{ fontSize: 11, color: GRIS }}>Métropole, outre-mer, sur demande</p>
        </CardBox>
      </div>

      {/* QR + site */}
      <CardBox style={{ border: `1px solid rgba(201,168,76,0.3)` }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {/* QR Code */}
          <div style={{ flexShrink: 0, background: OR, padding: 10, borderRadius: 4 }}>
            <img src={qrCode} alt="QR Code CRBR" style={{ width: 100, height: 100, display: "block" }} />
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: OR, letterSpacing: "1px", marginBottom: 8 }}>
              WWW.CRBR-SOLUTION.FR
            </p>
            <div style={{ width: 32, height: 2, background: OR, marginBottom: 10 }} />
            <p style={{ fontSize: 12, color: GRIS_L, marginBottom: 4 }}>Scannez pour accéder au site complet :</p>
            <p style={{ fontSize: 12, color: GRIS }}>
              Catalogue détaillé · Études de cas · Demande de présentation
            </p>
            <p style={{ fontSize: 12, color: GRIS }}>
              Réseau de professionnels qualifiés · Discrétion garantie
            </p>
          </div>

          {/* Logo CRBR */}
          <div style={{ flexShrink: 0 }}>
            <img src={logoCrbrSmall} alt="CRBR" style={{ height: 80, objectFit: "contain" }} />
          </div>
        </div>
      </CardBox>

      <PageFooter />
    </Page>
  );
}

// ─── PRINT STYLES ─────────────────────────────────────────────────────────────

function PrintStyles() {
  return (
    <style>{`
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body { margin: 0; }
        .page {
          page-break-after: always;
          break-after: page;
          min-height: 100vh !important;
          height: 100vh;
          overflow: hidden;
          box-sizing: border-box;
        }
        @page {
          margin: 0;
          size: A4 portrait;
        }
      }
      @media (max-width: 768px) {
        .page { padding: 20px 22px 16px !important; }
      }
    `}</style>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

function Index() {
  return (
    <div style={{ background: BG }}>
      <PrintStyles />
      <Page01_Cover />
      <Page02_ConstatsTerrain />
      <Page03_Identite />
      <Page04_Approche />
      <Page05_Valeurs />
      <Page06_Offre />
      <Page07_Technologies />
      <Page08_ShootingHouse />
      <Page09_Spectre />
      <Page10_ModeleEco />
      <Page11_Clientele />
      <Page12_Demarrer />
      <Page13_Contact />
    </div>
  );
}
