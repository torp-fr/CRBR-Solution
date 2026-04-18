"""
CRBR Solutions — Plaquette Marketing 2026 V3
Generateur ReportLab — 13 pages
"""

import sys, os
sys.stdout.reconfigure(encoding='utf-8')

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader, simpleSplit

# ─── CHEMINS ─────────────────────────────────────────────────────────────────
BASE = "C:/Users/Baptiste-/CRBR-Solution"
IMG  = f"{BASE}/vitrine/img"
MKT  = f"{BASE}/marketing"
OUT  = f"{MKT}/CRBR_Solutions_Plaquette_Marketing_2026_V3.pdf"
QR   = f"{MKT}/qr_code_crbr_v2.png"

# ─── DIMENSIONS ──────────────────────────────────────────────────────────────
W, H = A4          # 595.27 x 841.89 pt
ML   = 22 * mm
MR   = 22 * mm
MT   = 18 * mm
MB   = 14 * mm
CW   = W - ML - MR

# zone utile contenu (sous header, au-dessus footer)
CTOP = H - MT - 10 * mm   # ~751 pt
CBOT = MB + 8 * mm        # ~62 pt
CAVAIL = CTOP - CBOT       # ~689 pt ≈ 243 mm

# ─── PALETTE ─────────────────────────────────────────────────────────────────
BG     = HexColor("#0D0D0F")
CARD   = HexColor("#14141A")
OR     = HexColor("#C9A84C")
BLANC  = HexColor("#FFFFFF")
GRIS_L = HexColor("#C8C8D8")
GRIS   = HexColor("#909098")
RED    = HexColor("#C05050")

OR_A15 = Color(0.788, 0.659, 0.298, alpha=0.15)
OR_A30 = Color(0.788, 0.659, 0.298, alpha=0.30)
OR_A50 = Color(0.788, 0.659, 0.298, alpha=0.50)
BG_A70 = Color(0.051, 0.051, 0.059, alpha=0.70)
BG_A85 = Color(0.051, 0.051, 0.059, alpha=0.85)

# ─── HELPERS IMAGES ──────────────────────────────────────────────────────────

def ir(name):
    p = f"{IMG}/{name}"
    return ImageReader(p) if os.path.exists(p) else None

def draw_img(c, name, x, y, w, h, overlay=0.65):
    img = ir(name)
    if img:
        c.drawImage(img, x, y, w, h, preserveAspectRatio=False, mask='auto')
    else:
        c.setFillColor(CARD); c.rect(x, y, w, h, fill=1, stroke=0)
    if overlay > 0:
        c.setFillColor(Color(0.051, 0.051, 0.059, alpha=overlay))
        c.rect(x, y, w, h, fill=1, stroke=0)

# ─── FOND & ACCENTS ──────────────────────────────────────────────────────────

def fill_bg(c):
    c.setFillColor(BG); c.rect(0, 0, W, H, fill=1, stroke=0)

def corner_accents(c):
    c.saveState()
    c.setLineWidth(0.8)
    for i, off in enumerate([0, 8, 16]):
        alpha = 0.50 - i * 0.10
        c.setStrokeColor(Color(0.788, 0.659, 0.298, alpha=alpha))
        c.line(0, (off + 2) * mm, (52 - off) * mm, 0)          # bas-gauche
        c.line(W, H - (off + 2) * mm, W - (52 - off) * mm, H)  # haut-droit
    c.restoreState()

def cover_diagonals(c):
    c.saveState()
    c.setLineWidth(1.2)
    for i in range(7):
        alpha = 0.55 - i * 0.06
        gap = i * 16
        c.setStrokeColor(Color(0.788, 0.659, 0.298, alpha=alpha))
        c.line(W - gap, H, W, H - 180 + gap)    # droite
        c.line(gap, 0, 0, 180 - gap)              # gauche
    c.restoreState()

# ─── HEADER / FOOTER ─────────────────────────────────────────────────────────

def page_header(c, section, num):
    y = H - MT
    c.setStrokeColor(OR_A50); c.setLineWidth(0.5)
    c.line(ML, y + 1, W - MR, y + 1)
    c.setFillColor(OR); c.setFont("Helvetica-Bold", 7)
    c.drawString(ML, y - 4, section.upper())
    c.setFillColor(GRIS); c.setFont("Helvetica", 7)
    c.drawRightString(W - MR, y - 4, num)
    c.setStrokeColor(OR_A30)
    c.line(ML, y - 8, W - MR, y - 8)

def page_footer(c):
    y = MB
    c.setStrokeColor(OR_A30); c.setLineWidth(0.5)
    c.line(ML, y + 4, W - MR, y + 4)
    c.setFont("Helvetica", 6); c.setFillColor(GRIS)
    c.drawString(ML, y - 1, "CRBR SOLUTIONS — CONSULTING OPÉRATIONNEL")
    c.setFillColor(OR); c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(W / 2, y - 1, "DOCUMENT CONFIDENTIEL")
    c.setFillColor(GRIS); c.setFont("Helvetica", 6)
    c.drawRightString(W - MR, y - 1, "WWW.CRBR-SOLUTION.FR")

# ─── TYPOGRAPHIE ─────────────────────────────────────────────────────────────

def slabel(c, text, x, y):
    """Étiquette section or, petite barre dessous."""
    c.setFillColor(OR); c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x, y, text.upper())
    c.rect(x, y - 2 * mm, 18 * mm, 1.5, fill=1, stroke=0)

def btitle(c, text, x, y, size=22):
    """Titre principal — retourne la hauteur occupée."""
    c.setFillColor(BLANC); c.setFont("Helvetica-Bold", size)
    # wrap si nécessaire
    lines = simpleSplit(text, "Helvetica-Bold", size, CW)
    for i, ln in enumerate(lines):
        c.drawString(x, y - i * (size * 1.2), ln)
    return len(lines) * size * 1.2  # hauteur totale

def sub(c, text, x, y, w=None, size=9, color=None):
    """Sous-titre multiligne — retourne hauteur."""
    w = w or CW
    c.setFont("Helvetica", size); c.setFillColor(color or GRIS_L)
    lines = simpleSplit(text, "Helvetica", size, w)
    lh = size * 1.6
    for i, ln in enumerate(lines):
        c.drawString(x, y - i * lh, ln)
    return len(lines) * lh

def stxt(c, text, x, y, size=8.5, bold=False, color=None, align="left", w=None):
    font = "Helvetica-Bold" if bold else "Helvetica"
    c.setFont(font, size); c.setFillColor(color or GRIS_L)
    if align == "center":   c.drawCentredString(x, y, text)
    elif align == "right":  c.drawRightString(x, y, text)
    else:                   c.drawString(x, y, text)

def mltxt(c, text, x, y, w, size=8, bold=False, color=None, lh=None):
    """Multiligne, retourne hauteur consommée."""
    font = "Helvetica-Bold" if bold else "Helvetica"
    c.setFont(font, size); c.setFillColor(color or GRIS_L)
    lh = lh or size * 1.6
    lines = simpleSplit(text, font, size, w)
    for i, ln in enumerate(lines):
        c.drawString(x, y - i * lh, ln)
    return len(lines) * lh

# ─── COMPOSANTS ──────────────────────────────────────────────────────────────

def card(c, x, y, w, h, fill=None, border=True):
    c.setFillColor(fill or CARD)
    c.roundRect(x, y, w, h, 2, fill=1, stroke=0)
    if border:
        c.saveState(); c.setStrokeColor(OR_A15); c.setLineWidth(0.5)
        c.roundRect(x, y, w, h, 2, fill=0, stroke=1); c.restoreState()

def ctitle(c, text, x, y):
    c.setFont("Helvetica-Bold", 8); c.setFillColor(BLANC)
    c.drawString(x, y, text.upper())
    c.setFillColor(OR); c.rect(x, y - 2 * mm, 14 * mm, 1.2, fill=1, stroke=0)

def gsub(c, text, x, y):
    c.setFont("Helvetica-Bold", 7); c.setFillColor(OR); c.drawString(x, y, text.upper())

def check(c, text, x, y, w, size=7.5):
    c.setFillColor(OR); c.setFont("Helvetica-Bold", size); c.drawString(x, y, "✓")
    c.setFont("Helvetica", size); c.setFillColor(GRIS_L)
    for i, ln in enumerate(simpleSplit(text, "Helvetica", size, w - 8)):
        c.drawString(x + 8, y - i * (size * 1.5), ln)

def hbox(c, x, y, w, h, label=None):
    c.setFillColor(CARD); c.roundRect(x, y, w, h, 2, fill=1, stroke=0)
    c.saveState(); c.setStrokeColor(OR_A30); c.setLineWidth(0.6)
    c.roundRect(x, y, w, h, 2, fill=0, stroke=1); c.restoreState()
    if label:
        c.setFont("Helvetica-Bold", 7); c.setFillColor(OR)
        c.drawString(x + 4 * mm, y + h - 5.5 * mm, label.upper())
        c.setFillColor(OR); c.rect(x + 4 * mm, y + h - 7 * mm, 18 * mm, 1.2, fill=1, stroke=0)

def num_circle(c, num, cx, cy, r=6):
    c.setFillColor(OR); c.circle(cx, cy, r, fill=1, stroke=0)
    c.setFillColor(BG); c.setFont("Helvetica-Bold", 8.5)
    c.drawCentredString(cx, cy - 3, str(num))

# ─── PAGE 1 : COUVERTURE ─────────────────────────────────────────────────────

def page_cover(c):
    fill_bg(c)
    # Photo plein fond (un seul visuel)
    draw_img(c, "CRBR.Couverture.png", 0, 0, W, H, overlay=0.72)
    cover_diagonals(c)

    # Nom en haut (texte pur — pas d'image logo pour éviter superposition)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(OR)
    c.drawCentredString(W / 2, H - 28 * mm, "CRBR  GROUP")
    c.setStrokeColor(OR_A50); c.setLineWidth(0.6)
    tw = c.stringWidth("CRBR  GROUP", "Helvetica-Bold", 11)
    c.line(W/2 - tw/2 - 15, H - 30.5*mm, W/2 - tw/2 - 2, H - 30.5*mm)
    c.line(W/2 + tw/2 + 2,  H - 30.5*mm, W/2 + tw/2 + 15, H - 30.5*mm)

    # Titre central
    ty = H * 0.52
    c.setFont("Helvetica-Bold", 58)
    c.setFillColor(GRIS_L)
    c.drawCentredString(W / 2, ty, "STRUCTURER")
    c.setFillColor(OR)
    c.drawCentredString(W / 2, ty - 62, "LA RÉPONSE")
    c.drawCentredString(W / 2, ty - 124, "OPÉRATIONNELLE")

    # Filet
    c.setStrokeColor(OR_A50); c.setLineWidth(0.8)
    c.line(ML + 18*mm, ty - 143, W - MR - 18*mm, ty - 143)

    # Sous-titre
    c.setFont("Helvetica", 10); c.setFillColor(GRIS_L)
    c.drawCentredString(W / 2, ty - 158, "RÉPONSES CONÇUES À PARTIR DU")
    c.setFont("Helvetica-Bold", 10); c.setFillColor(OR)
    c.drawCentredString(W / 2, ty - 170, "RÉEL.")

    # URL bas
    c.setFont("Helvetica", 7.5); c.setFillColor(GRIS)
    c.drawCentredString(W / 2, 18 * mm, "W W W . C R B R - S O L U T I O N . F R")

# ─── HELPER : DÉBUT DE PAGE ──────────────────────────────────────────────────

def page_start(c, section, num, label, title, subtitle_text, size=20):
    """Dessine le fond, header, footer, étiquette, titre et sous-titre.
    Retourne y (curseur) après le sous-titre."""
    fill_bg(c); corner_accents(c)
    page_header(c, section, num); page_footer(c)

    y = CTOP
    slabel(c, label, ML, y)
    y -= 7 * mm

    h_title = btitle(c, title, ML, y, size=size)
    y -= h_title + 5 * mm

    if subtitle_text:
        h_sub = sub(c, subtitle_text, ML, y)
        y -= h_sub + 5 * mm

    return y

# ─── PAGE 2 : CONSTATS TERRAIN ───────────────────────────────────────────────

def page_constats(c):
    y = page_start(c, "Constats terrain", "02 / 13",
                   "Constats terrain",
                   "CRBR résout les freins à l'entraînement.",
                   "L'entraînement régulier, c'est la base. Mais sur le terrain, quatre obstacles bloquent vos unités.")

    obstacles = [
        ("01", "DISTANCE",
         "Les centres d'entraînement sont trop loin. La logistique seule coûte autant que la formation. Le temps de déplacement impacte les opérations."),
        ("02", "CRÉNEAUX",
         "Les plages disponibles sont rares, imposées, rarement compatibles avec le rythme opérationnel de votre unité. Vous prenez ce qu'il reste."),
        ("03", "BUDGET MUNITIONS",
         "Chaque séance de tir réel consomme un budget significatif. Impossible de multiplier les entraînements sans dépasser les enveloppes annuelles."),
        ("04", "EFFECTIFS",
         "Libérer du personnel pour l'entraînement reste un défi permanent. La pression opérationnelle fait passer la formation au second plan."),
    ]

    bh = 20 * mm   # highlight box
    gap_row = 4 * mm
    gap_box = 5 * mm
    # espace dispo pour 2 rangées + box
    ch = (y - CBOT - gap_row - gap_box - bh) / 2

    cw = (CW - 5 * mm) / 2
    last_row_y = y
    for i, (num, titre, texte) in enumerate(obstacles):
        col = i % 2; row = i // 2
        cx = ML + col * (cw + 5 * mm)
        cy = y - row * (ch + gap_row) - ch
        last_row_y = cy
        card(c, cx, cy, cw, ch)
        pad = 3.5 * mm
        c.setFont("Helvetica-Bold", 18); c.setFillColor(OR)
        c.drawString(cx + pad, cy + ch - 7 * mm, num)
        c.setFillColor(OR); c.rect(cx + pad, cy + ch - 9.5 * mm, 12 * mm, 1.2, fill=1, stroke=0)
        stxt(c, titre, cx + pad, cy + ch - 14 * mm, bold=True, color=BLANC)
        mltxt(c, texte, cx + pad, cy + ch - 20 * mm, cw - 7 * mm, size=8)

    by = last_row_y - gap_box - bh
    hbox(c, ML, by, CW, bh, label="LA RÉPONSE CRBR")
    mltxt(c, "On apporte l'entraînement chez vous. Disponible quand vous en avez besoin. Sans logistique complexe. Sans coûts qui explosent. Adapté à votre réalité.",
          ML + 4 * mm, by + bh - 10 * mm, CW - 8 * mm, size=8.5)

# ─── PAGE 3 : IDENTITÉ ───────────────────────────────────────────────────────

def page_identite(c):
    y = page_start(c, "Identité", "03 / 13", "Identité",
                   "Pourquoi CRBR Solutions ?",
                   "Un cabinet de consulting spécialisé dans les solutions opérationnelles d'entraînement. Notre mission : rendre l'entraînement de haute qualité accessible à chaque unité — quelle que soit sa taille ou son budget.")

    valeurs = [
        ("APPROCHE TERRAIN", "Nos consultants viennent du secteur. Pas de commercial — des praticiens. On parle votre langue, on connaît vos contraintes."),
        ("SOLUTION COMPLÈTE", "De l'audit initial à la maintenance annuelle. Un seul point de contact. Pas de multi-fournisseurs à coordonner."),
        ("FLEXIBILITÉ RÉELLE", "Abonnement mensuel ajustable. Évolue avec votre budget et vos besoins. Formule modifiable en cours de contrat."),
        ("RÉSEAU QUALIFIÉ", "Partenaires techniques certifiés, sélectionnés sur références opérationnelles. Pas de sous-traitance inconnue."),
        ("SUPPORT RÉACTIF", "Problème technique = réponse sous 24h, intervention sous 72h. Maintenance préventive incluse dans chaque contrat."),
        ("DISCRÉTION TOTALE", "Environnements sensibles par nature. Protocoles de confidentialité stricts. Aucune communication externe sans accord."),
    ]

    quote_h = 12 * mm
    gap_row = 4 * mm
    ch = (y - CBOT - gap_row - quote_h - 5 * mm) / 2
    cw = (CW - 8 * mm) / 3

    last_cy = y
    for i, (titre, texte) in enumerate(valeurs):
        col = i % 3; row = i // 2
        cx = ML + col * (cw + 4 * mm)
        cy = y - row * (ch + gap_row) - ch
        last_cy = cy
        card(c, cx, cy, cw, ch)
        pad = 3.5 * mm
        ctitle(c, titre, cx + pad, cy + ch - 7 * mm)
        mltxt(c, texte, cx + pad, cy + ch - 14 * mm, cw - 7 * mm, size=7.5)

    qy = last_cy - 6 * mm
    c.setStrokeColor(OR_A15); c.setLineWidth(0.4)
    c.line(ML, qy + 3, W - MR, qy + 3)
    c.setFont("Helvetica-Oblique", 8.5); c.setFillColor(GRIS_L)
    c.drawCentredString(W / 2, qy - 4,
        "Un partenaire opérationnel sur la durée — pas un fournisseur qui disparaît après la livraison.")
    c.line(ML, qy - 9, W - MR, qy - 9)

# ─── PAGE 4 : NOTRE APPROCHE ─────────────────────────────────────────────────

def page_approche(c):
    y = page_start(c, "Notre approche", "04 / 13", "Notre approche",
                   "Trois étapes. Une solution intégrée.",
                   "Simple, clair, sans engagement caché.")

    # Photo bande
    ph = 28 * mm
    c.setStrokeColor(OR_A15); c.setLineWidth(0.5)
    c.rect(ML, y - ph, CW, ph, stroke=1, fill=0)
    draw_img(c, "CRBR.Couverture.png", ML, y - ph, CW, ph, overlay=0.55)
    y -= ph + 5 * mm

    etapes = [
        (1, "On comprend votre contexte",
         "Vos missions. Vos menaces. Vos effectifs. Ce que vous avez déjà. Pas de grille standard — on écoute avant de proposer. Un entretien, 48h max, puis une analyse écrite de votre situation."),
        (2, "On conçoit votre solution",
         "Pas de catalogue imposé. On assemble ce qui répond à vos besoins réels, dans votre budget, avec vos contraintes terrain et vos procédures internes. Chaque devis est unique. Rien n'est standard."),
        (3, "On la met en place et on la maintient",
         "Installation sur site. Formation des référents. Support permanent inclus. On reste partenaire — on ne livre pas et on disparaît. Maintenance préventive, mises à jour, support réactif : tout est inclus."),
    ]

    bh = 22 * mm
    gap = 4 * mm
    ch = y - CBOT - gap - bh

    cw = (CW - 8 * mm) / 3
    for i, (num, titre, texte) in enumerate(etapes):
        cx = ML + i * (cw + 4 * mm)
        cy = y - ch
        card(c, cx, cy, cw, ch)
        pad = 3.5 * mm
        num_circle(c, num, cx + 8 * mm, cy + ch - 7 * mm)
        stxt(c, titre, cx + 18 * mm, cy + ch - 5 * mm, bold=True, color=BLANC, size=8.5)
        c.setFillColor(OR); c.rect(cx + pad, cy + ch - 10 * mm, 14 * mm, 1.2, fill=1, stroke=0)
        mltxt(c, texte, cx + pad, cy + ch - 16 * mm, cw - 7 * mm, size=7.5)

    by = y - ch - gap - bh
    hbox(c, ML, by, CW, bh, label="CE QUI NE CHANGE JAMAIS")
    hw = (CW - 8 * mm) / 2
    items = ["Interlocuteur unique tout au long du contrat",
             "Délais contractualisés et respectés",
             "Adaptation possible en cours de contrat",
             "Aucun engagement caché — tout est écrit avant signature"]
    for i, item in enumerate(items):
        col = i % 2; row = i // 2
        check(c, item, ML + 4*mm + col*(hw+4*mm), by + bh - 11*mm - row*8*mm, hw)

# ─── PAGE 5 : VALEURS ────────────────────────────────────────────────────────

def page_valeurs(c):
    y = page_start(c, "Identité — Valeurs", "05 / 13", "Ce qui nous guide",
                   "Six principes. Aucune posture.",
                   "Des engagements concrets, vérifiables sur le terrain.")

    principes = [
        ("01", "PRÉCISION", "Chaque solution répond à un besoin précis, dans un contexte précis. Pas de réponse générique. Pas de sur-dimensionnement. Exactement ce qu'il faut, là où il faut."),
        ("02", "PROGRESSION", "Amélioration durable, pas événementielle. Votre niveau monte sur le long terme — pas uniquement les jours de stage. L'entraînement s'intègre dans la routine opérationnelle."),
        ("03", "FIABILITÉ", "Ça fonctionne quand vous en avez besoin. La maintenance est incluse, pas en option. Un équipement en panne le jour J n'est pas une option — ni pour vous, ni pour nous."),
        ("04", "PRAGMATISME", "On intègre vos contraintes réelles : budgets annuels, procédures marchés publics, infrastructure existante, restrictions opérationnelles. On s'adapte à vous, pas l'inverse."),
        ("05", "ENGAGEMENT", "Partenaire opérationnel sur la durée. On reste. On évolue avec vous. On connaît votre contexte après 6 mois de contrat mieux que n'importe quel fournisseur de passage."),
        ("06", "DISCRÉTION", "Environnements sensibles par nature. Protocoles de confidentialité stricts. Interventions discrètes. Aucune communication externe sans votre accord explicite."),
    ]

    gap = 4 * mm
    ch = (y - CBOT - gap) / 2
    cw = (CW - 5 * mm) / 2

    for i, (num, titre, texte) in enumerate(principes):
        col = i % 2; row = i // 2
        cx = ML + col * (cw + 5 * mm)
        cy = y - row * (ch + gap) - ch
        card(c, cx, cy, cw, ch)
        pad = 3.5 * mm
        c.setFont("Helvetica-Bold", 20)
        c.setFillColor(Color(0.788, 0.659, 0.298, alpha=0.22))
        c.drawString(cx + pad, cy + ch - 9 * mm, num)
        c.setFillColor(OR); c.rect(cx + pad + 14*mm, cy + ch - 9*mm, 14*mm, 1.5, fill=1, stroke=0)
        stxt(c, titre, cx + pad + 14*mm, cy + ch - 6*mm, bold=True, color=BLANC, size=8.5)
        mltxt(c, texte, cx + pad, cy + ch - 15*mm, cw - 7*mm, size=8)

# ─── PAGE 6 : NOTRE OFFRE ────────────────────────────────────────────────────

def page_offre(c):
    y = page_start(c, "Notre offre", "06 / 13", "Quatre domaines",
                   "Une réponse adaptée à vos besoins.",
                   "Quatre domaines. Un écosystème complètement intégré.")

    domaines = [
        ("SYSTÈMES DE TIR AVANCÉS", "SIMULATION & TIR",
         "Simulation laser haute-fidélité. Travail technique et décisionnel sans contrainte de munitions réelles. Scénarios réalistes configurables. Analyse de performance par tireur en temps réel. Compatible armes réelles modifiées — aucune munition."),
        ("ARMEMENT D'ENTRAÎNEMENT", "MANIEMENT & SÉCURITÉ",
         "Réalisme complet de maniement et de gestuelle. Sécurité totale. Compatibilité avec vos protocoles existants. Conçu pour un usage intensif en conditions réelles d'entraînement. Entretien inclus."),
        ("STRUCTURES DYNAMIQUES", "CQB & PROGRESSION",
         "Escalade, rappel, corde lisse, CQB, progression tactique. Reconfigurable selon vos scénarios en moins d'une heure. Montage / démontage rapide, transportable, sans travaux permanents."),
        ("ÉQUIPEMENTS COMPLÉMENTAIRES", "ÉQUIPEMENTS TERRAIN",
         "Outils d'effraction, équipement tactique, pyrotechnie d'entraînement, protection balistique. Sélectionné sur spécifications opérationnelles, pas sur catalogue."),
    ]

    quote_h = 12 * mm
    gap = 4 * mm
    ch = (y - CBOT - gap - quote_h - 6*mm) / 2
    cw = (CW - 5 * mm) / 2

    last_cy = y
    for i, (titre, sous, texte) in enumerate(domaines):
        col = i % 2; row = i // 2
        cx = ML + col * (cw + 5 * mm)
        cy = y - row * (ch + gap) - ch
        last_cy = cy
        card(c, cx, cy, cw, ch)
        pad = 3.5 * mm
        ctitle(c, titre, cx + pad, cy + ch - 7*mm)
        gsub(c, sous, cx + pad, cy + ch - 14*mm)
        mltxt(c, texte, cx + pad, cy + ch - 20*mm, cw - 7*mm, size=8)

    qy = last_cy - 7 * mm
    c.setStrokeColor(OR_A15); c.setLineWidth(0.4)
    c.line(ML, qy + 3, W - MR, qy + 3)
    c.setFont("Helvetica-Oblique", 8.5); c.setFillColor(GRIS_L)
    c.drawCentredString(W / 2, qy - 4,
        "Tout ça fonctionne ensemble. Une solution intégrée. Un seul interlocuteur.")

# ─── PAGE 7 : TECHNOLOGIES ───────────────────────────────────────────────────

def page_technologies(c):
    y = page_start(c, "Technologies", "07 / 13", "Technologies",
                   "Les technologies qui font la différence.",
                   "Sélection internationale. Intégration par des professionnels du secteur.")

    # Titre liste capacités
    stxt(c, "Capacités principales du système", ML, y, bold=True, color=BLANC, size=9)
    c.setFillColor(OR); c.rect(ML, y - 2*mm, 16*mm, 1.2, fill=1, stroke=0)
    y -= 6 * mm

    caps = [
        "Retour balistique réaliste (recul, son, chaleur)",
        "Analyse comportementale par tireur en temps réel",
        "Scénarios personnalisés (hostiles, neutres, civils)",
        "Compatible armes réelles modifiées — zéro munition",
        "Débriefing vidéo intégré, export possible",
        "Multi-postes : jusqu'à 8 tireurs simultanément",
    ]

    lw = CW * 0.53
    iw = CW - lw - 4 * mm
    ih = len(caps) * 7.5 * mm + 2 * mm

    # Liste gauche
    cy_list = y
    for cap in caps:
        check(c, cap, ML, cy_list, lw - 4*mm, size=7.5)
        cy_list -= 7.5 * mm

    # Image droite
    ix = ML + lw + 4 * mm
    draw_img(c, "CRBR.Couverture.png", ix, y - ih, iw, ih, overlay=0.50)
    c.setStrokeColor(OR_A15); c.setLineWidth(0.5)
    c.rect(ix, y - ih, iw, ih, stroke=1, fill=0)
    c.setFillColor(BG_A85); c.rect(ix, y - ih, iw, 11, fill=1, stroke=0)
    stxt(c, "SIMULATION LASER HAUTE-FIDÉLITÉ", ix + 3*mm, y - ih + 4, bold=True, color=OR, size=6.5)

    y = min(cy_list, y - ih) - 5 * mm

    # 3 cartes bas
    modules = [
        ("EFFRACTION & ACCÈS", ["Battering rams certifiés", "Coupe-verrou hydraulique", "Portes reconfigurables", "Multi-scénarios int. / ext."]),
        ("ARMEMENT DÉDIÉ",     ["Réalisme maniement total", "Recul électrique ou gaz", "Entretien & pièces inclus", "Pistolet, carabine, SMG"]),
        ("DÉPLOIEMENT MOBILE", ["Remorque tout-terrain", "Autonome (générateur)", "Installation < 2 heures", "Session complète sur site"]),
    ]
    integ_h = 14 * mm
    gap = 4 * mm
    ch3 = y - CBOT - gap - integ_h
    cw3 = (CW - 8 * mm) / 3

    for i, (titre, items) in enumerate(modules):
        cx = ML + i * (cw3 + 4 * mm)
        cy = y - ch3
        card(c, cx, cy, cw3, ch3)
        ctitle(c, titre, cx + 3.5*mm, cy + ch3 - 7*mm)
        for j, item in enumerate(items):
            check(c, item, cx + 3.5*mm, cy + ch3 - 14*mm - j*7.5*mm, cw3 - 7*mm, size=7.5)

    # Intégration complète
    by = y - ch3 - gap - integ_h
    c.setFillColor(CARD); c.roundRect(ML, by, CW, integ_h, 2, fill=1, stroke=0)
    c.setStrokeColor(OR_A30); c.setLineWidth(0.5)
    c.roundRect(ML, by, CW, integ_h, 2, fill=0, stroke=1)
    stxt(c, "INTÉGRATION COMPLÈTE", ML + 4*mm, by + integ_h - 5.5*mm, bold=True, color=OR, size=7.5)
    mltxt(c, "Tous les équipements fonctionnent ensemble — un écosystème cohérent, pas une somme de produits indépendants.",
          ML + 48*mm, by + integ_h - 5.5*mm, CW - 52*mm, size=7.5)

# ─── PAGE 8 : SHOOTING HOUSE ─────────────────────────────────────────────────

def page_shooting_house(c):
    y = page_start(c, "Structure phare", "08 / 13", "Structure phare",
                   "La Shooting House modulaire.",
                   "Scalable. Reconfigurable. Prête à l'usage. Trois niveaux pour s'adapter à toutes les unités.")

    # Bande photo
    ph = 24 * mm
    c.setFillColor(CARD); c.rect(ML, y - 8, CW, 8, fill=1, stroke=0)
    stxt(c, "Entraînement Police, Gendarmerie, Armée — Paintball / Simulation",
         ML + 3*mm, y - 5.5, bold=True, color=BLANC, size=7.5)
    draw_img(c, "CRBR.Couverture.png", ML, y - 8 - ph, CW, ph, overlay=0.55)
    c.setFillColor(CARD); c.rect(ML, y - 8 - ph - 9, CW, 9, fill=1, stroke=0)
    stxt(c, "Panneau modulaire 80 × 250 × 10 cm — roulettes verrouillables — sans outils spécifiques",
         ML + 3*mm, y - 8 - ph - 5, color=GRIS, size=7)
    y -= ph + 8 + 9 + 5 * mm

    tiers = [
        ("BASIC", None,           "~ 40 m²",       "29 à 36","4 à 6", "2 à 4",
         "Solution compacte et économique. Idéale pour l'entraînement de base en CQB.",
         ["Progression simple","CQB basique","Fondamentaux","1 à 4 opérateurs"], False),
        ("PRO",   "★ RECOMMANDÉ", "~ 70 – 85 m²",  "20 à 30","6 à 10","4 à 8",
         "Parfait pour des scénarios complexes et réalistes, adapté aux équipes.",
         ["Scénarios complexes","Zones multiples","Équipes ≤ 8 op.","Recommandé"], True),
        ("PREMIUM",None,          "~ 110 – 120 m²","20 à 30","8 à 12","6 à 12",
         "La solution haut de gamme pour situations réalistes et complexes.",
         ["Haute complexité","Situations avancées","Grande ampleur","Unités spécialisées"], False),
    ]

    bh = 20 * mm; gap = 4 * mm
    ch = y - CBOT - gap - bh
    cw = (CW - 8 * mm) / 3

    for i, (label, badge, surf, pan, por, ouv, desc, items, hl) in enumerate(tiers):
        cx = ML + i * (cw + 4 * mm)
        cy = y - ch
        if hl:
            c.setFillColor(OR); c.roundRect(cx, cy, cw, ch, 2, fill=1, stroke=0)
            fc, sc = BG, Color(0.051,0.051,0.059,alpha=0.7)
        else:
            card(c, cx, cy, cw, ch); fc, sc = OR, GRIS_L

        iy = cy + ch - 5*mm
        if badge:
            stxt(c, badge, cx+cw/2, iy, size=6.5, color=BG if hl else OR, align="center"); iy -= 5*mm
        stxt(c, label, cx+cw/2, iy, bold=True, size=13, color=BG if hl else OR, align="center"); iy -= 7*mm
        stxt(c, surf, cx+cw/2, iy, bold=True, size=12, color=BG if hl else BLANC, align="center"); iy -= 4.5*mm
        stxt(c, "SURFACE HABITABLE", cx+cw/2, iy, size=6, color=sc, align="center"); iy -= 7*mm

        for k, v in [("Panneaux",pan),("Portes",por),("Ouvertures",ouv)]:
            c.setStrokeColor(Color(0.051,0.051,0.059,0.2) if hl else OR_A15)
            c.setLineWidth(0.4); c.line(cx+3*mm, iy-1, cx+cw-3*mm, iy-1)
            stxt(c, k, cx+3*mm, iy, size=7, color=sc)
            stxt(c, v, cx+cw-3*mm, iy, size=7, bold=True, color=BG if hl else BLANC, align="right"); iy -= 5.5*mm

        mltxt(c, desc, cx+3.5*mm, iy - 1*mm, cw-7*mm, size=7, color=sc)
        iy -= 14*mm
        for item in items:
            stxt(c, "✓  "+item, cx+3.5*mm, iy, size=7, color=BG if hl else OR); iy -= 5*mm

    by = y - ch - gap - bh
    hbox(c, ML, by, CW, bh, label="AVANTAGES COMMUNS À TOUS LES NIVEAUX")
    hw = (CW - 8*mm) / 2
    avs = ["Montage / démontage rapide — aucun travaux permanents",
           "Transportable — roues intégrées, remorque standard",
           "Reconfigurable à volonté — scénarios illimités",
           "Compatible avec tous les systèmes CRBR"]
    for i, av in enumerate(avs):
        check(c, av, ML+4*mm+i%2*(hw+4*mm), by+bh-10*mm-i//2*7.5*mm, hw)

# ─── PAGE 9 : SPECTRE COMPLET ─────────────────────────────────────────────────

def page_spectre(c):
    y = page_start(c, "Spectre complet", "09 / 13", "Spectre complet",
                   "Au-delà du tir.",
                   "Couvrir tous les domaines de vos besoins opérationnels — sans exception.")

    domaines = [
        ("CQB & PROGRESSION",       "Entrée dynamique. Progression en espace confiné. Techniques avancées d'intervention. Scénarios multi-zones reconfigurables."),
        ("SCÉNARIOS IA ADAPTATIFS", "Opérateurs virtuels réactifs. Conditions de stress, nuit, contrainte, prise de décision en environnement dégradé."),
        ("ÉQUIPEMENT TACTIQUE",     "Analyse balistique. Progressivité et sécurité garanties. Tir précision, stress, mouvement, multi-cibles."),
        ("DÉPLOIEMENT MOBILE",      "Sessions sur votre site, selon votre planning. Nos consultants viennent avec le matériel. Logistique entièrement gérée par CRBR."),
    ]

    bh = 22 * mm; gap = 4 * mm
    ch = (y - CBOT - gap - bh - 5*mm) / 2
    cw = (CW - 5 * mm) / 2

    last_cy = y
    for i, (titre, texte) in enumerate(domaines):
        col = i % 2; row = i // 2
        cx = ML + col * (cw + 5*mm)
        cy = y - row * (ch + gap) - ch
        last_cy = cy
        card(c, cx, cy, cw, ch)
        ctitle(c, titre, cx + 3.5*mm, cy + ch - 7*mm)
        mltxt(c, texte, cx + 3.5*mm, cy + ch - 14*mm, cw - 7*mm, size=8.5)

    by = last_cy - 5*mm - bh
    hbox(c, ML, by, CW, bh, label="TERRE — AIR — EAU")
    mltxt(c, "Unité généraliste ou spécialisée. GIGN, RAID, groupement d'intervention, Police Municipale — on s'adapte à chaque contexte. Logistique entièrement gérée par CRBR.",
          ML + 4*mm, by + bh - 10*mm, CW - 8*mm, size=8.5)

# ─── PAGE 10 : MODÈLE ÉCONOMIQUE ─────────────────────────────────────────────

def page_modele_eco(c):
    y = page_start(c, "Modèle économique", "10 / 13", "Modèle économique",
                   "Une solution adaptée à vos réalités budgétaires.",
                   "Abonnement mensuel. Budget prévisible. Tout inclus.")

    # Comparaison 2 cartes
    cw2 = (CW - 5*mm) / 2
    ch2 = 42 * mm
    # Problème
    card(c, ML, y - ch2, cw2, ch2)
    stxt(c, "PROBLÈME HABITUEL", ML+3.5*mm, y-7*mm, bold=True, color=RED, size=7.5)
    c.setFillColor(RED); c.rect(ML+3.5*mm, y-9*mm, 14*mm, 1.2, fill=1, stroke=0)
    mltxt(c, "Achat unique : 150 000 – 300 000 €. Budget bloqué. Procédures marchés publics incompatibles. Maintenance = contrat supplémentaire. Surprises.",
          ML+3.5*mm, y-14*mm, cw2-7*mm, size=8)
    # Approche CRBR
    cx2 = ML + cw2 + 5*mm
    card(c, cx2, y-ch2, cw2, ch2, border=False)
    c.setStrokeColor(OR_A30); c.setLineWidth(0.7)
    c.roundRect(cx2, y-ch2, cw2, ch2, 2, fill=0, stroke=1)
    stxt(c, "APPROCHE CRBR", cx2+3.5*mm, y-7*mm, bold=True, color=OR, size=7.5)
    c.setFillColor(OR); c.rect(cx2+3.5*mm, y-9*mm, 14*mm, 1.2, fill=1, stroke=0)
    mltxt(c, "Abonnement mensuel. Budget annuel prévisible. Compatible marchés publics (fournisseur récurrent). Maintenance, support et mises à jour : tout inclus.",
          cx2+3.5*mm, y-14*mm, cw2-7*mm, size=8)

    y -= ch2 + 5*mm

    plans = [
        ("ESSENTIEL",    None,           "Les bases de l'entraînement, maintenance incluse. Idéal pour démarrer.", False),
        ("OPÉRATIONNEL", "★ RECOMMANDÉE","Spectre élargi, CQB avancé. Formule recommandée pour unités opérationnelles.", True),
        ("PREMIUM",      None,           "Complet, personnalisé, toutes options. Solution haute intensité.", False),
        ("MOBILE",       None,           "Sessions régulières sur votre site. On vient avec l'équipement.", False),
    ]
    bh = 26 * mm; gap = 3 * mm
    ch4 = y - CBOT - gap - bh
    cw4 = (CW - 9*mm) / 4

    for i, (label, badge, desc, hl) in enumerate(plans):
        cx = ML + i*(cw4+3*mm)
        cy = y - ch4
        if hl:
            c.setFillColor(OR); c.roundRect(cx,cy,cw4,ch4,2,fill=1,stroke=0)
            lc, dc = BG, Color(0.051,0.051,0.059,alpha=0.75)
        else:
            card(c,cx,cy,cw4,ch4); lc,dc = OR,GRIS_L
        iy = cy+ch4-5*mm
        if badge:
            stxt(c,badge,cx+cw4/2,iy,size=6,color=lc,align="center"); iy-=4.5*mm
        stxt(c,label,cx+cw4/2,iy,bold=True,size=10,color=lc,align="center"); iy-=7*mm
        mltxt(c,desc,cx+3.5*mm,iy,cw4-7*mm,size=7.5,color=dc)

    by = y - ch4 - gap - bh
    hbox(c, ML, by, CW, bh, label="INCLUS DANS TOUS LES CONTRATS CRBR")
    inclus = ["Installation sur site (zéro travaux permanents)",
              "Mises à jour logicielles et nouveaux scénarios",
              "Support technique réactif — interlocuteur unique",
              "Maintenance préventive et corrective",
              "Consommables (munitions simulées, CO₂, etc.)"]
    hw = (CW-8*mm)/2
    for i, item in enumerate(inclus):
        check(c,item,ML+4*mm+i%2*(hw+4*mm),by+bh-10*mm-i//2*8*mm,hw)

# ─── PAGE 11 : CLIENTÈLE ─────────────────────────────────────────────────────

def page_clientele(c):
    y = page_start(c, "Clientèle", "11 / 13", "Clientèle",
                   "Du niveau local aux unités spécialisées.",
                   "Chacun choisit la formule qui convient à son contexte. Pas de solution standard — tout est adaptable à votre réalité budgétaire et opérationnelle.")

    # Photo
    ph = 30 * mm
    c.setStrokeColor(OR_A15); c.setLineWidth(0.5)
    c.rect(ML, y-ph, CW, ph, stroke=1, fill=0)
    draw_img(c, "CRBR.Couverture.png", ML, y-ph, CW, ph, overlay=0.65)
    y -= ph + 5*mm

    clients = [
        ("PM","POLICE MUNICIPALE"), ("GN","GENDARMERIE NATIONALE"),
        ("PN","POLICE NATIONALE"),  ("AT","ARMÉE DE TERRE"),
        ("AAE","ARMÉE AIR & ESPACE"),("SP","SÉCURITÉ PRIVÉE"),
        ("AP","ADMIN. PÉNITENTIAIRE"),("FS","FORCES SPÉCIALISÉES"),
    ]
    bh = 22*mm; gap = 3*mm
    ch = (y - CBOT - gap - bh - 5*mm - gap) / 2
    cw = (CW - 9*mm) / 4

    last_cy = y
    for i,(sig,label) in enumerate(clients):
        col=i%4; row=i//4
        cx = ML+col*(cw+3*mm)
        cy = y-row*(ch+gap)-ch
        last_cy = cy
        card(c,cx,cy,cw,ch)
        stxt(c,sig,cx+cw/2,cy+ch-9*mm,bold=True,size=18,color=OR,align="center")
        c.setFillColor(OR); c.rect(cx+cw/2-7*mm,cy+ch-12.5*mm,14*mm,1.2,fill=1,stroke=0)
        stxt(c,label,cx+cw/2,cy+ch-17*mm,size=6,bold=True,color=GRIS_L,align="center")

    by = last_cy - 5*mm - bh
    hbox(c,ML,by,CW,bh,label="PEU IMPORTE VOTRE TAILLE, BUDGET, SPÉCIALITÉ")
    mltxt(c,"On ne vend pas à tout le monde le même produit. On construit une solution qui correspond exactement à votre unité, votre budget annuel, vos contraintes opérationnelles. PM ou Forces Spéciales — le traitement est le même : sérieux, précis, efficace.",
          ML+4*mm,by+bh-10*mm,CW-8*mm,size=8.5)

# ─── PAGE 12 : DÉMARRER ──────────────────────────────────────────────────────

def page_demarrer(c):
    y = page_start(c, "Démarrer", "12 / 13", "Démarrer",
                   "Trois étapes simples.",
                   "Du premier contact au déploiement — sans friction, sans engagement caché.")

    etapes = [
        (1,"Vous nous contactez",
         "Mail, téléphone, formulaire. Pas de RDV commercial forcé. Dites-nous simplement votre situation et vos besoins. On lit, on comprend, on répond — en moins de 48h."),
        (2,"On échange",
         "Un entretien (pas une présentation commerciale). On comprend votre contexte réel : unité, effectifs, infrastructure, budget annuel. On pose des questions opérationnelles. On écoute avant de proposer."),
        (3,"On vous propose",
         "Devis sur-mesure, adapté à votre réalité. Pas de contrat piège, pas de frais cachés, pas de surprise. Déploiement rapide. Accompagnement complet depuis le premier jour."),
    ]

    bh = 26*mm; gap = 4*mm
    ch = y - CBOT - gap - bh
    cw = (CW-8*mm)/3

    for i,(num,titre,texte) in enumerate(etapes):
        cx = ML+i*(cw+4*mm); cy = y-ch
        card(c,cx,cy,cw,ch)
        pad=3.5*mm
        c.setFont("Helvetica-Bold",42)
        c.setFillColor(Color(0.788,0.659,0.298,alpha=0.18))
        c.drawString(cx+pad,cy+ch-17*mm,str(num))
        c.setFillColor(OR); c.rect(cx+pad,cy+ch-20*mm,14*mm,1.5,fill=1,stroke=0)
        stxt(c,titre,cx+pad,cy+ch-26*mm,bold=True,color=BLANC,size=9)
        mltxt(c,texte,cx+pad,cy+ch-35*mm,cw-7*mm,size=8)

    by = y-ch-gap-bh
    c.setFillColor(CARD); c.roundRect(ML,by,CW,bh,2,fill=1,stroke=0)
    c.setStrokeColor(OR_A30); c.setLineWidth(0.8)
    c.roundRect(ML,by,CW,bh,2,fill=0,stroke=1)
    stxt(c,"ENGAGEMENT CRBR — RÉPONSE GARANTIE SOUS 48H OUVRÉES",
         W/2,by+bh-8*mm,bold=True,color=OR,size=8,align="center")
    stxt(c,"Vous ne serez jamais noyé dans un CRM.",W/2,by+bh-15*mm,color=GRIS_L,size=8.5,align="center")
    c.setFont("Helvetica-Oblique",8.5); c.setFillColor(GRIS_L)
    c.drawCentredString(W/2,by+bh-21*mm,"Une personne. Une réponse. Un suivi clair.")

# ─── PAGE 13 : CONTACT ───────────────────────────────────────────────────────

def page_contact(c):
    fill_bg(c); corner_accents(c)
    page_header(c,"Contact","13 / 13"); page_footer(c)

    y = CTOP

    # Photo hero
    ph = 48*mm
    draw_img(c,"CRBR.Couverture.png",ML,y-ph,CW,ph,overlay=0.60)
    c.setStrokeColor(OR_A30); c.setLineWidth(0.5)
    c.rect(ML,y-ph,CW,ph,stroke=1,fill=0)
    slabel(c,"PROCHAINE ÉTAPE",ML+4*mm,y-7*mm)
    c.setFont("Helvetica-Bold",20); c.setFillColor(BLANC)
    c.drawString(ML+4*mm,y-17*mm,"Parlons de votre")
    c.setFillColor(OR)
    c.drawString(ML+4*mm,y-29*mm,"entraînement opérationnel.")
    c.setStrokeColor(OR_A50); c.setLineWidth(0.6)
    c.line(ML+4*mm,y-33*mm,ML+CW-4*mm,y-33*mm)
    c.setFont("Helvetica-Oblique",8.5); c.setFillColor(GRIS_L)
    c.drawString(ML+4*mm,y-39*mm,"Envoyez-nous votre situation. Ensemble, on construit votre solution.")
    y -= ph + 5*mm

    # 3 cartes contact
    cw3=(CW-8*mm)/3; ch3=38*mm
    contacts=[
        ("EMAIL","info@crbr-solution.fr","Réponse sous 48h ouvrées"),
        ("TÉLÉPHONE","06 65 44 52 26","Lundi au vendredi · 9h – 18h"),
        ("ZONE","France & International","Métropole, outre-mer, sur demande"),
    ]
    for i,(label,value,detail) in enumerate(contacts):
        cx=ML+i*(cw3+4*mm); cy=y-ch3
        card(c,cx,cy,cw3,ch3)
        ctitle(c,label,cx+3.5*mm,cy+ch3-7*mm)
        stxt(c,value,cx+3.5*mm,cy+ch3-16*mm,bold=True,color=BLANC,size=9)
        c.setFillColor(OR); c.rect(cx+3.5*mm,cy+ch3-19*mm,14*mm,1.2,fill=1,stroke=0)
        stxt(c,detail,cx+3.5*mm,cy+ch3-24*mm,color=GRIS,size=7.5)
    y -= ch3+5*mm

    # QR + site + logo
    qrh = y - CBOT
    c.setFillColor(CARD); c.roundRect(ML,y-qrh,CW,qrh,2,fill=1,stroke=0)
    c.setStrokeColor(OR_A30); c.setLineWidth(0.6)
    c.roundRect(ML,y-qrh,CW,qrh,2,fill=0,stroke=1)

    qsz = min(qrh - 8*mm, 38*mm)
    qx = ML+4*mm; qy_b = y-qrh+(qrh-qsz)/2
    qr_img = ImageReader(QR) if os.path.exists(QR) else None
    if qr_img:
        c.setFillColor(OR); c.rect(qx-2,qy_b-2,qsz+4,qsz+4,fill=1,stroke=0)
        c.drawImage(qr_img,qx,qy_b,qsz,qsz,preserveAspectRatio=True,mask='auto')

    tx = qx+qsz+7*mm; ty = y-qrh+qrh-8*mm
    stxt(c,"WWW.CRBR-SOLUTION.FR",tx,ty,bold=True,color=OR,size=10)
    c.setFillColor(OR); c.rect(tx,ty-2.5*mm,20*mm,1.2,fill=1,stroke=0)
    stxt(c,"Scannez pour accéder au site complet :",tx,ty-7*mm,color=GRIS_L,size=8)
    stxt(c,"Catalogue détaillé · Études de cas · Demande de présentation",tx,ty-13*mm,color=GRIS,size=7.5)
    stxt(c,"Réseau de professionnels qualifiés · Discrétion garantie",tx,ty-19*mm,color=GRIS,size=7.5)

# ─── GÉNÉRATION ──────────────────────────────────────────────────────────────

def main():
    print("Génération CRBR Solutions — Plaquette V3...")
    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("CRBR Solutions — Plaquette Marketing 2026")
    c.setAuthor("CRBR Solutions")
    c.setSubject("Consulting Opérationnel — Document Confidentiel")

    pages = [
        (page_cover,          "Couverture"),
        (page_constats,       "Constats terrain"),
        (page_identite,       "Identité"),
        (page_approche,       "Notre approche"),
        (page_valeurs,        "Valeurs"),
        (page_offre,          "Notre offre"),
        (page_technologies,   "Technologies"),
        (page_shooting_house, "Shooting House"),
        (page_spectre,        "Spectre complet"),
        (page_modele_eco,     "Modèle économique"),
        (page_clientele,      "Clientèle"),
        (page_demarrer,       "Démarrer"),
        (page_contact,        "Contact"),
    ]

    for fn, name in pages:
        fn(c); c.showPage()
        print(f"  ✓ {name}")

    c.save()
    size_mb = os.path.getsize(OUT) / 1024 / 1024
    print(f"\nFichier : {OUT}")
    print(f"Taille  : {size_mb:.1f} MB — {len(pages)} pages")

if __name__ == "__main__":
    main()
