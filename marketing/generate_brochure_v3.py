"""
CRBR Solutions — Plaquette Marketing 2026 V3
Generateur ReportLab — 13 pages
Contenu : PDF V3 (Structurer la réponse opérationnelle)
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

# ─── PAGE A4 ─────────────────────────────────────────────────────────────────
W, H = A4          # 595.27 x 841.89 pt
ML   = 22 * mm     # marge gauche
MR   = 22 * mm     # marge droite
MT   = 20 * mm     # marge haut
MB   = 16 * mm     # marge bas
CW   = W - ML - MR # largeur contenu

# ─── PALETTE ─────────────────────────────────────────────────────────────────
BG     = HexColor("#0D0D0F")
CARD   = HexColor("#14141A")
CARD2  = HexColor("#1A1A22")
OR     = HexColor("#C9A84C")
BLANC  = HexColor("#FFFFFF")
GRIS_L = HexColor("#C8C8D8")
GRIS   = HexColor("#909098")
RED    = HexColor("#C05050")

OR_A15 = Color(0.788, 0.659, 0.298, alpha=0.15)
OR_A30 = Color(0.788, 0.659, 0.298, alpha=0.30)
OR_A45 = Color(0.788, 0.659, 0.298, alpha=0.45)
BG_A70 = Color(0.051, 0.051, 0.059, alpha=0.70)
BG_A85 = Color(0.051, 0.051, 0.059, alpha=0.85)
BG_A92 = Color(0.051, 0.051, 0.059, alpha=0.92)

# ─── IMAGES ──────────────────────────────────────────────────────────────────

def ip(name):
    return f"{IMG}/{name}"

def ir(name):
    p = ip(name)
    return ImageReader(p) if os.path.exists(p) else None

def draw_img(c, name, x, y, w, h, overlay=0.70):
    img = ir(name)
    if img:
        c.drawImage(img, x, y, w, h, preserveAspectRatio=False, mask='auto')
    else:
        c.setFillColor(CARD)
        c.rect(x, y, w, h, fill=1, stroke=0)
    if overlay > 0:
        c.setFillColor(Color(0.051, 0.051, 0.059, alpha=overlay))
        c.rect(x, y, w, h, fill=1, stroke=0)

# ─── FOND & ACCENTS ──────────────────────────────────────────────────────────

def fill_bg(c):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

def corner_accents(c):
    """Lignes diagonales or dans les coins bas-gauche et haut-droit."""
    c.saveState()
    c.setLineWidth(0.8)
    for i, offset in enumerate([0, 8, 16]):
        alpha = 0.50 - i * 0.10
        c.setStrokeColor(Color(0.788, 0.659, 0.298, alpha=alpha))
        # Coin bas-gauche
        c.line(0, (offset + 2) * mm, (55 - offset) * mm, 0)
        # Coin haut-droit
        c.line(W, H - (offset + 2) * mm, W - (55 - offset) * mm, H)
    c.restoreState()

def cover_diagonals(c, side="right"):
    """Diagonales pleines pour la couverture (gauche et droite)."""
    c.saveState()
    c.setLineWidth(1.2)
    n = 7
    for i in range(n):
        alpha = 0.55 - i * 0.06
        gap = i * 18
        c.setStrokeColor(Color(0.788, 0.659, 0.298, alpha=alpha))
        if side == "right":
            c.line(W - gap, H, W, H - 200 + gap * 1.5)
        else:
            c.line(gap, 0, 0, 200 - gap * 1.5)
    c.restoreState()

# ─── HEADER / FOOTER ─────────────────────────────────────────────────────────

def page_header(c, section, num):
    y = H - MT
    # Ligne or fine au-dessus
    c.setStrokeColor(OR_A45)
    c.setLineWidth(0.5)
    c.line(ML, y + 2, W - MR, y + 2)
    # Section (gauche)
    c.setFillColor(OR)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(ML, y - 3, section.upper())
    # Numéro (droite)
    c.setFillColor(GRIS)
    c.setFont("Helvetica", 7)
    c.drawRightString(W - MR, y - 3, num)
    # Ligne or sous le header
    c.setStrokeColor(OR_A30)
    c.line(ML, y - 7, W - MR, y - 7)

def page_footer(c):
    y = MB
    c.setStrokeColor(OR_A30)
    c.setLineWidth(0.5)
    c.line(ML, y + 4, W - MR, y + 4)
    c.setFont("Helvetica", 6)
    c.setFillColor(GRIS)
    c.drawString(ML, y - 1, "CRBR SOLUTIONS — CONSULTING OPÉRATIONNEL")
    c.setFillColor(OR)
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(W / 2, y - 1, "DOCUMENT CONFIDENTIEL")
    c.setFillColor(GRIS)
    c.setFont("Helvetica", 6)
    c.drawRightString(W - MR, y - 1, "WWW.CRBR-SOLUTION.FR")

# Contenu Y de départ (sous le header)
CONTENT_TOP = H - MT - 12 * mm

# ─── HELPERS TYPOGRAPHIE ─────────────────────────────────────────────────────

def section_label(c, text, x, y):
    c.setFillColor(OR)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x, y, text.upper())
    c.setFillColor(OR)
    c.rect(x, y - 2.5 * mm, 18 * mm, 1.5, fill=1, stroke=0)

def big_title(c, lines, x, y, size=24, gap=None):
    gap = gap or size * 1.25
    c.setFont("Helvetica-Bold", size)
    for i, line in enumerate(lines):
        if line.startswith("~"):
            c.setFillColor(OR)
            line = line[1:]
        else:
            c.setFillColor(BLANC)
        c.drawString(x, y - i * gap, line)
    return y - (len(lines) - 1) * gap

def subtitle(c, text, x, y, w, size=9.5, color=None):
    color = color or GRIS_L
    c.setFont("Helvetica", size)
    c.setFillColor(color)
    lines = simpleSplit(text, "Helvetica", size, w)
    for i, ln in enumerate(lines):
        c.drawString(x, y - i * (size * 1.55), ln)
    return y - (len(lines) - 1) * (size * 1.55) - size * 1.55

def mltxt(c, text, x, y, w, size=8.5, bold=False, color=None, lh=None):
    font = "Helvetica-Bold" if bold else "Helvetica"
    c.setFont(font, size)
    c.setFillColor(color or GRIS_L)
    lh = lh or size * 1.6
    lines = simpleSplit(text, font, size, w)
    for i, ln in enumerate(lines):
        c.drawString(x, y - i * lh, ln)
    return y - len(lines) * lh

def stxt(c, text, x, y, size=8.5, bold=False, color=None, align="left"):
    font = "Helvetica-Bold" if bold else "Helvetica"
    c.setFont(font, size)
    c.setFillColor(color or GRIS_L)
    if align == "center":
        c.drawCentredString(x, y, text)
    elif align == "right":
        c.drawRightString(x, y, text)
    else:
        c.drawString(x, y, text)

# ─── COMPOSANTS UI ───────────────────────────────────────────────────────────

def card(c, x, y, w, h, fill=None, border_gold=True):
    """Carte foncée avec bordure or subtile."""
    c.setFillColor(fill or CARD)
    c.roundRect(x, y, w, h, 2, fill=1, stroke=0)
    if border_gold:
        c.saveState()
        c.setStrokeColor(OR_A15)
        c.setLineWidth(0.5)
        c.roundRect(x, y, w, h, 2, fill=0, stroke=1)
        c.restoreState()

def card_title(c, text, x, y):
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(BLANC)
    c.drawString(x, y, text.upper())
    c.setFillColor(OR)
    c.rect(x, y - 2 * mm, 14 * mm, 1.2, fill=1, stroke=0)

def gold_sub(c, text, x, y):
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(OR)
    c.drawString(x, y, text.upper())

def check_item(c, text, x, y, w, size=8):
    c.setFillColor(OR)
    c.setFont("Helvetica-Bold", size)
    c.drawString(x, y, "✓")
    c.setFont("Helvetica", size)
    c.setFillColor(GRIS_L)
    lines = simpleSplit(text, "Helvetica", size, w - 10)
    for i, ln in enumerate(lines):
        c.drawString(x + 9, y - i * (size * 1.5), ln)
    return y - len(lines) * (size * 1.5)

def gold_rule(c, x, y, w, alpha=0.35):
    c.setStrokeColor(Color(0.788, 0.659, 0.298, alpha=alpha))
    c.setLineWidth(0.5)
    c.line(x, y, x + w, y)

def highlight_box(c, x, y, w, h, label=None, label_y_offset=None):
    """Boite mise en valeur avec bordure or."""
    c.setFillColor(CARD)
    c.roundRect(x, y, w, h, 2, fill=1, stroke=0)
    c.setStrokeColor(OR_A30)
    c.setLineWidth(0.6)
    c.roundRect(x, y, w, h, 2, fill=0, stroke=1)
    if label:
        ly = y + h - (label_y_offset or 5 * mm)
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(OR)
        c.drawString(x + 4 * mm, ly, label.upper())
        c.setFillColor(OR)
        c.rect(x + 4 * mm, ly - 2 * mm, 22 * mm, 1, fill=1, stroke=0)

def num_circle(c, num, cx, cy, r=7):
    c.setFillColor(OR)
    c.circle(cx, cy, r, fill=1, stroke=0)
    c.setFillColor(BG)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(cx, cy - 3.5, str(num))

# ─── PAGE 1 : COUVERTURE ──────────────────────────────────────────────────────

def page_cover(c):
    fill_bg(c)

    # Photo plein fond (couverture)
    img = ir("CRBR.Couverture.png")
    if img:
        c.drawImage(img, 0, 0, W, H, preserveAspectRatio=False, mask='auto')
        c.setFillColor(BG_A85)
        c.rect(0, 0, W, H, fill=1, stroke=0)

    # Diagonales dorées gauche et droite
    cover_diagonals(c, "right")
    cover_diagonals(c, "left")

    # Logo CRBR GROUP (centré en haut)
    logo = ir("CRBR.Logo Cerberus doré avec _CRBR GROUP_.png")
    if logo:
        lw, lh = 160, 90
        c.drawImage(logo, (W - lw) / 2, H - 30 * mm - lh, lw, lh,
                    preserveAspectRatio=True, mask='auto')

    # Titre principal
    ty = H * 0.52
    c.setFont("Helvetica-Bold", 56)
    c.setFillColor(GRIS_L)
    c.drawCentredString(W / 2, ty, "STRUCTURER")
    c.setFillColor(OR)
    c.drawCentredString(W / 2, ty - 56, "LA RÉPONSE")
    c.drawCentredString(W / 2, ty - 112, "OPÉRATIONNELLE")

    # Filet
    c.setStrokeColor(Color(0.788, 0.659, 0.298, alpha=0.6))
    c.setLineWidth(0.8)
    c.line(ML + 20 * mm, ty - 130, W - MR - 20 * mm, ty - 130)

    # Sous-titre
    c.setFont("Helvetica", 10)
    c.setFillColor(GRIS_L)
    c.drawCentredString(W / 2, ty - 148,
                        "RÉPONSES CONÇUES À PARTIR DU ")
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(OR)
    tw = c.stringWidth("RÉPONSES CONÇUES À PARTIR DU ", "Helvetica", 10)
    c.drawString(W / 2 - c.stringWidth("RÉPONSES CONÇUES À PARTIR DU ", "Helvetica", 10) / 2 + tw, ty - 148, "RÉEL.")

    # URL bas
    c.setFont("Helvetica", 8)
    c.setFillColor(GRIS)
    c.drawCentredString(W / 2, 18 * mm, "W W W . C R B R - S O L U T I O N . F R")

# ─── PAGE 2 : CONSTATS TERRAIN ───────────────────────────────────────────────

def page_constats(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Constats terrain", "02 / 13")
    page_footer(c)

    y = CONTENT_TOP
    section_label(c, "Constats terrain", ML, y)
    y -= 7 * mm

    big_title(c, ["CRBR résout les freins à l'entraînement."], ML, y, size=20)
    y -= 8 * mm
    y = subtitle(c, "L'entraînement régulier, c'est la base. Mais sur le terrain, quatre obstacles bloquent vos unités.", ML, y, CW)
    y -= 8 * mm

    # 4 cartes 2x2
    cw = (CW - 6 * mm) / 2
    ch = 76 * mm
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
    rows = [(obstacles[0], obstacles[1]), (obstacles[2], obstacles[3])]
    for ri, row in enumerate(rows):
        row_y = y - ri * (ch + 4 * mm) - ch
        for ci, (num, titre, texte) in enumerate(row):
            cx = ML + ci * (cw + 6 * mm)
            card(c, cx, row_y, cw, ch)
            c.setFont("Helvetica-Bold", 20)
            c.setFillColor(OR)
            c.drawString(cx + 4 * mm, row_y + ch - 8 * mm, num)
            c.setFillColor(OR)
            c.rect(cx + 4 * mm, row_y + ch - 11 * mm, 14 * mm, 1.2, fill=1, stroke=0)
            stxt(c, titre, cx + 4 * mm, row_y + ch - 17 * mm, bold=True, color=BLANC)
            mltxt(c, texte, cx + 4 * mm, row_y + ch - 24 * mm, cw - 8 * mm, size=8)

    # Boite réponse
    bh = 22 * mm
    by = y - 2 * (ch + 4 * mm) - ch - 5 * mm
    highlight_box(c, ML, by, CW, bh, label="LA RÉPONSE CRBR", label_y_offset=5 * mm)
    mltxt(c, "On apporte l'entraînement chez vous. Disponible quand vous en avez besoin. Sans logistique complexe. Sans coûts qui explosent. Adapté à votre réalité.",
          ML + 4 * mm, by + bh - 13 * mm, CW - 8 * mm, size=9)

# ─── PAGE 3 : IDENTITÉ ───────────────────────────────────────────────────────

def page_identite(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Identité", "03 / 13")
    page_footer(c)

    y = CONTENT_TOP
    section_label(c, "Identité", ML, y)
    y -= 7 * mm
    big_title(c, ["Pourquoi CRBR Solutions ?"], ML, y, size=22)
    y -= 8 * mm
    y = subtitle(c, "Un cabinet de consulting spécialisé dans les solutions opérationnelles d'entraînement. Notre mission : rendre l'entraînement de haute qualité accessible à chaque unité — quelle que soit sa taille ou son budget.", ML, y, CW)
    y -= 8 * mm

    valeurs = [
        ("APPROCHE TERRAIN", "Nos consultants viennent du secteur. Pas de commercial — des praticiens. On parle votre langue, on connaît vos contraintes."),
        ("SOLUTION COMPLÈTE", "De l'audit initial à la maintenance annuelle. Un seul point de contact. Pas de multi-fournisseurs à coordonner."),
        ("FLEXIBILITÉ RÉELLE", "Abonnement mensuel ajustable. Évolue avec votre budget et vos besoins. Formule modifiable en cours de contrat."),
        ("RÉSEAU QUALIFIÉ", "Partenaires techniques certifiés, sélectionnés sur références opérationnelles. Pas de sous-traitance inconnue."),
        ("SUPPORT RÉACTIF", "Problème technique = réponse sous 24h, intervention sous 72h. Maintenance préventive incluse dans chaque contrat."),
        ("DISCRÉTION TOTALE", "Environnements sensibles par nature. Protocoles de confidentialité stricts. Aucune communication externe sans accord."),
    ]

    cw = (CW - 6 * mm) / 3
    ch = 58 * mm
    for i, (titre, texte) in enumerate(valeurs):
        col = i % 3
        row = i // 3
        cx = ML + col * (cw + 3 * mm)
        cy = y - row * (ch + 4 * mm) - ch
        card(c, cx, cy, cw, ch)
        card_title(c, titre, cx + 3.5 * mm, cy + ch - 7 * mm)
        mltxt(c, texte, cx + 3.5 * mm, cy + ch - 14 * mm, cw - 7 * mm, size=7.5)

    # Quote finale
    qy = y - 2 * (ch + 4 * mm) - ch - 6 * mm
    gold_rule(c, ML, qy + 3, CW, alpha=0.2)
    c.setFont("Helvetica-Oblique", 8.5)
    c.setFillColor(GRIS_L)
    c.drawCentredString(W / 2, qy - 4,
                        "Un partenaire opérationnel sur la durée — pas un fournisseur qui disparaît après la livraison.")
    gold_rule(c, ML, qy - 9, CW, alpha=0.2)

# ─── PAGE 4 : NOTRE APPROCHE ─────────────────────────────────────────────────

def page_approche(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Notre approche", "04 / 13")
    page_footer(c)

    y = CONTENT_TOP
    section_label(c, "Notre approche", ML, y)
    y -= 7 * mm
    big_title(c, ["Trois étapes. Une solution intégrée."], ML, y, size=20)
    y -= 6 * mm
    subtitle(c, "Simple, clair, sans engagement caché.", ML, y, CW)
    y -= 10 * mm

    # Photo bande
    ph = 32 * mm
    c.setStrokeColor(OR_A15)
    c.setLineWidth(0.5)
    c.rect(ML, y - ph, CW, ph, stroke=1, fill=0)
    draw_img(c, "CRBR.Couverture.png", ML, y - ph, CW, ph, overlay=0.55)
    y -= ph + 6 * mm

    # 3 cartes étapes
    cw = (CW - 8 * mm) / 3
    ch = 75 * mm
    etapes = [
        (1, "On comprend votre contexte",
         "Vos missions. Vos menaces. Vos effectifs. Ce que vous avez déjà. Pas de grille standard — on écoute avant de proposer. Un entretien, 48h max, puis une analyse écrite de votre situation."),
        (2, "On conçoit votre solution",
         "Pas de catalogue imposé. On assemble ce qui répond à vos besoins réels, dans votre budget, avec vos contraintes terrain et vos procédures internes. Chaque devis est unique. Rien n'est standard."),
        (3, "On la met en place et on la maintient",
         "Installation sur site. Formation des référents. Support permanent inclus. On reste partenaire — on ne livre pas et on disparaît. Maintenance préventive, mises à jour, support réactif : tout est inclus."),
    ]
    for i, (num, titre, texte) in enumerate(etapes):
        cx = ML + i * (cw + 4 * mm)
        cy = y - ch
        card(c, cx, cy, cw, ch)
        num_circle(c, num, cx + 8 * mm, cy + ch - 8 * mm)
        stxt(c, titre, cx + 18 * mm, cy + ch - 5 * mm, bold=True, color=BLANC, size=8)
        c.setFillColor(OR)
        c.rect(cx + 3.5 * mm, cy + ch - 12 * mm, 14 * mm, 1.2, fill=1, stroke=0)
        mltxt(c, texte, cx + 3.5 * mm, cy + ch - 18 * mm, cw - 7 * mm, size=7.5)

    # Garanties
    bh = 24 * mm
    by = y - ch - 5 * mm - bh
    highlight_box(c, ML, by, CW, bh, label="CE QUI NE CHANGE JAMAIS")
    hw = (CW - 8 * mm) / 2
    items = ["Interlocuteur unique tout au long du contrat",
             "Délais contractualisés et respectés",
             "Adaptation possible en cours de contrat",
             "Aucun engagement caché — tout est écrit avant signature"]
    for i, item in enumerate(items):
        col = i % 2
        row = i // 2
        ix = ML + 4 * mm + col * (hw + 4 * mm)
        iy = by + bh - 12 * mm - row * 8 * mm
        check_item(c, item, ix, iy, hw, size=7.5)

# ─── PAGE 5 : VALEURS ────────────────────────────────────────────────────────

def page_valeurs(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Identité — Valeurs", "05 / 13")
    page_footer(c)

    y = CONTENT_TOP
    section_label(c, "Ce qui nous guide", ML, y)
    y -= 7 * mm
    big_title(c, ["Six principes. Aucune posture."], ML, y, size=22)
    y -= 8 * mm
    subtitle(c, "Des engagements concrets, vérifiables sur le terrain.", ML, y, CW)
    y -= 10 * mm

    principes = [
        ("01", "PRÉCISION", "Chaque solution répond à un besoin précis, dans un contexte précis. Pas de réponse générique. Pas de sur-dimensionnement. Exactement ce qu'il faut, là où il faut."),
        ("02", "PROGRESSION", "Amélioration durable, pas événementielle. Votre niveau monte sur le long terme — pas uniquement les jours de stage. L'entraînement s'intègre dans la routine opérationnelle."),
        ("03", "FIABILITÉ", "Ça fonctionne quand vous en avez besoin. La maintenance est incluse, pas en option. Un équipement en panne le jour J n'est pas une option — ni pour vous, ni pour nous."),
        ("04", "PRAGMATISME", "On intègre vos contraintes réelles : budgets annuels, procédures marchés publics, infrastructure existante, restrictions opérationnelles. On s'adapte à vous, pas l'inverse."),
        ("05", "ENGAGEMENT", "Partenaire opérationnel sur la durée. On reste. On évolue avec vous. On connaît votre contexte après 6 mois de contrat mieux que n'importe quel fournisseur de passage."),
        ("06", "DISCRÉTION", "Environnements sensibles par nature. Protocoles de confidentialité stricts. Interventions discrètes. Aucune communication externe sans votre accord explicite."),
    ]

    cw = (CW - 6 * mm) / 2
    ch = 68 * mm
    for i, (num, titre, texte) in enumerate(principes):
        col = i % 2
        row = i // 2
        cx = ML + col * (cw + 6 * mm)
        cy = y - row * (ch + 4 * mm) - ch
        card(c, cx, cy, cw, ch)
        c.setFont("Helvetica-Bold", 22)
        c.setFillColor(Color(0.788, 0.659, 0.298, alpha=0.25))
        c.drawString(cx + 3.5 * mm, cy + ch - 9 * mm, num)
        c.setFillColor(OR)
        c.rect(cx + 3.5 * mm + 14 * mm, cy + ch - 9.5 * mm, 14 * mm, 1.5, fill=1, stroke=0)
        stxt(c, titre, cx + 3.5 * mm + 14 * mm, cy + ch - 6 * mm, bold=True, color=BLANC, size=8)
        mltxt(c, texte, cx + 3.5 * mm, cy + ch - 17 * mm, cw - 7 * mm, size=7.5)

# ─── PAGE 6 : NOTRE OFFRE ────────────────────────────────────────────────────

def page_offre(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Notre offre", "06 / 13")
    page_footer(c)

    y = CONTENT_TOP
    section_label(c, "Quatre domaines", ML, y)
    y -= 7 * mm
    big_title(c, ["Une réponse adaptée à vos besoins."], ML, y, size=22)
    y -= 8 * mm
    subtitle(c, "Quatre domaines. Un écosystème complètement intégré.", ML, y, CW)
    y -= 10 * mm

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

    cw = (CW - 6 * mm) / 2
    ch = 82 * mm
    for i, (titre, sub, texte) in enumerate(domaines):
        col = i % 2
        row = i // 2
        cx = ML + col * (cw + 6 * mm)
        cy = y - row * (ch + 5 * mm) - ch
        card(c, cx, cy, cw, ch)
        card_title(c, titre, cx + 3.5 * mm, cy + ch - 7 * mm)
        gold_sub(c, sub, cx + 3.5 * mm, cy + ch - 15 * mm)
        mltxt(c, texte, cx + 3.5 * mm, cy + ch - 21 * mm, cw - 7 * mm, size=7.5)

    # Quote
    qy = y - 2 * (ch + 5 * mm) - ch - 6 * mm
    gold_rule(c, ML, qy + 3, CW, alpha=0.2)
    c.setFont("Helvetica-Oblique", 8.5)
    c.setFillColor(GRIS_L)
    c.drawCentredString(W / 2, qy - 4,
                        "Tout ça fonctionne ensemble. Une solution intégrée. Un seul interlocuteur.")

# ─── PAGE 7 : TECHNOLOGIES ───────────────────────────────────────────────────

def page_technologies(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Technologies", "07 / 13")
    page_footer(c)

    y = CONTENT_TOP
    section_label(c, "Technologies", ML, y)
    y -= 7 * mm
    big_title(c, ["Les technologies qui font la différence."], ML, y, size=20)
    y -= 8 * mm
    subtitle(c, "Sélection internationale. Intégration par des professionnels du secteur.", ML, y, CW)
    y -= 10 * mm

    # Liste + image côte à côte
    lw = CW * 0.52
    iw = CW * 0.44
    ih = 58 * mm
    ix = ML + lw + 4 * mm

    stxt(c, "Capacités principales du système", ML, y, bold=True, color=BLANC, size=9)
    c.setFillColor(OR)
    c.rect(ML, y - 2 * mm, 16 * mm, 1.2, fill=1, stroke=0)
    y -= 7 * mm

    capacites = [
        "Retour balistique réaliste (recul, son, chaleur)",
        "Analyse comportementale par tireur en temps réel",
        "Scénarios personnalisés (hostiles, neutres, civils)",
        "Compatible armes réelles modifiées — zéro munition",
        "Débriefing vidéo intégré, export possible",
        "Multi-postes : jusqu'à 8 tireurs simultanément",
    ]
    item_y = y
    for cap in capacites:
        check_item(c, cap, ML, item_y, lw - 4 * mm, size=7.5)
        item_y -= 8 * mm

    # Image simulateur
    img_y = y + 2 * mm
    c.setStrokeColor(OR_A15)
    c.setLineWidth(0.5)
    c.rect(ix, img_y - ih, iw, ih, stroke=1, fill=0)
    draw_img(c, "CRBR.Couverture.png", ix, img_y - ih, iw, ih, overlay=0.5)
    c.setFillColor(BG_A85)
    c.rect(ix, img_y - ih, iw, 12, fill=1, stroke=0)
    stxt(c, "SIMULATION LASER HAUTE-FIDÉLITÉ", ix + 3 * mm, img_y - ih + 4, bold=True, color=OR, size=7)

    y = min(item_y, img_y - ih) - 6 * mm

    # 3 cartes bas
    cw3 = (CW - 8 * mm) / 3
    ch3 = 52 * mm
    modules = [
        ("EFFRACTION & ACCÈS", ["Battering rams certifiés", "Coupe-verrou hydraulique", "Portes reconfigurables", "Multi-scénarios int. / ext."]),
        ("ARMEMENT DÉDIÉ", ["Réalisme maniement total", "Recul électrique ou gaz", "Entretien & pièces inclus", "Pistolet, carabine, SMG"]),
        ("DÉPLOIEMENT MOBILE", ["Remorque tout-terrain", "Autonome (générateur)", "Installation < 2 heures", "Session complète sur site"]),
    ]
    for i, (titre, items) in enumerate(modules):
        cx = ML + i * (cw3 + 4 * mm)
        cy = y - ch3
        card(c, cx, cy, cw3, ch3)
        card_title(c, titre, cx + 3.5 * mm, cy + ch3 - 7 * mm)
        for j, item in enumerate(items):
            check_item(c, item, cx + 3.5 * mm, cy + ch3 - 15 * mm - j * 8 * mm, cw3 - 7 * mm, size=7.5)

    # Intégration complète
    bh = 14 * mm
    by = y - ch3 - 5 * mm - bh
    c.setFillColor(CARD)
    c.roundRect(ML, by, CW, bh, 2, fill=1, stroke=0)
    c.setStrokeColor(OR_A30)
    c.setLineWidth(0.6)
    c.roundRect(ML, by, CW, bh, 2, fill=0, stroke=1)
    stxt(c, "INTÉGRATION COMPLÈTE", ML + 4 * mm, by + bh - 6 * mm, bold=True, color=OR, size=7.5)
    mltxt(c, "Tous les équipements fonctionnent ensemble — un écosystème cohérent, pas une somme de produits indépendants.",
          ML + 50 * mm, by + bh - 6 * mm, CW - 54 * mm, size=7.5)

# ─── PAGE 8 : SHOOTING HOUSE ─────────────────────────────────────────────────

def page_shooting_house(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Structure phare", "08 / 13")
    page_footer(c)

    y = CONTENT_TOP
    section_label(c, "Structure phare", ML, y)
    y -= 7 * mm
    big_title(c, ["La Shooting House modulaire."], ML, y, size=22)
    y -= 8 * mm
    subtitle(c, "Scalable. Reconfigurable. Prête à l'usage. Trois niveaux pour s'adapter à toutes les unités.", ML, y, CW)
    y -= 10 * mm

    # Photo bande avec légende
    ph = 30 * mm
    c.setFillColor(CARD2)
    c.rect(ML, y - ph - 8, CW, 8, fill=1, stroke=0)
    stxt(c, "Entraînement Police, Gendarmerie, Armée — Paintball / Simulation", ML + 3 * mm, y - 5, bold=True, color=BLANC, size=8)
    draw_img(c, "CRBR.Couverture.png", ML, y - ph - 8, CW, ph, overlay=0.55)
    c.setFillColor(CARD2)
    c.rect(ML, y - ph - 8 - 10, CW, 10, fill=1, stroke=0)
    stxt(c, "Panneau modulaire 80 × 250 × 10 cm — roulettes verrouillables — sans outils spécifiques",
         ML + 3 * mm, y - ph - 8 - 6, color=GRIS, size=7.5)
    y -= ph + 18 + 6 * mm

    # 3 colonnes BASIC / PRO / PREMIUM
    cw = (CW - 8 * mm) / 3
    ch = 120 * mm
    tiers = [
        ("BASIC", None, "~ 40 m²", "29 à 36", "4 à 6", "2 à 4",
         "Solution compacte et économique. Idéale pour l'entraînement de base en CQB.",
         ["Progression simple", "CQB basique", "Fondamentaux", "1 à 4 opérateurs"], False),
        ("PRO", "★ RECOMMANDÉ", "~ 70 – 85 m²", "20 à 30", "6 à 10", "4 à 8",
         "Parfait pour des scénarios complexes et réalistes, adapté aux équipes.",
         ["Scénarios complexes", "Zones multiples", "Équipes ≤ 8 op.", "Recommandé"], True),
        ("PREMIUM", None, "~ 110 – 120 m²", "20 à 30", "8 à 12", "6 à 12",
         "La solution haut de gamme pour situations réalistes et complexes.",
         ["Haute complexité", "Situations avancées", "Grande ampleur", "Unités spécialisées"], False),
    ]

    for i, (label, badge, surf, pan, por, ouv, desc, items, highlight) in enumerate(tiers):
        cx = ML + i * (cw + 4 * mm)
        cy = y - ch
        if highlight:
            c.setFillColor(OR)
            c.roundRect(cx, cy, cw, ch, 2, fill=1, stroke=0)
            tc = BG
            sc = Color(0.051, 0.051, 0.059, alpha=0.7)
        else:
            card(c, cx, cy, cw, ch)
            tc = OR
            sc = GRIS

        iy = cy + ch - 5 * mm
        if badge:
            stxt(c, badge, cx + cw / 2, iy, size=7, color=tc if not highlight else BG, align="center")
            iy -= 6 * mm
        stxt(c, label, cx + cw / 2, iy, bold=True, size=16, color=tc if not highlight else BG, align="center")
        iy -= 8 * mm
        stxt(c, surf, cx + cw / 2, iy, bold=True, size=14, color=BLANC if not highlight else BG, align="center")
        iy -= 5 * mm
        stxt(c, "SURFACE HABITABLE", cx + cw / 2, iy, size=6, color=sc, align="center")
        iy -= 8 * mm

        for k, v in [("Panneaux", pan), ("Portes", por), ("Ouvertures", ouv)]:
            c.setStrokeColor(Color(0.051, 0.051, 0.059, 0.2) if highlight else OR_A15)
            c.setLineWidth(0.4)
            c.line(cx + 3 * mm, iy - 1.5, cx + cw - 3 * mm, iy - 1.5)
            stxt(c, k, cx + 3 * mm, iy, size=7, color=sc)
            stxt(c, v, cx + cw - 3 * mm, iy, size=7, bold=True, color=BLANC if not highlight else BG, align="right")
            iy -= 6 * mm

        iy -= 2 * mm
        mltxt(c, desc, cx + 3.5 * mm, iy, cw - 7 * mm, size=7, color=sc if highlight else GRIS_L)
        iy -= 18 * mm
        for item in items:
            stxt(c, "✓  " + item, cx + 3.5 * mm, iy, size=7, color=tc if not highlight else BG)
            iy -= 5.5 * mm

    # Avantages communs
    bh = 22 * mm
    by = y - ch - 5 * mm - bh
    highlight_box(c, ML, by, CW, bh, label="AVANTAGES COMMUNS À TOUS LES NIVEAUX")
    avs = ["Montage / démontage rapide — aucun travaux permanents",
           "Transportable — roues intégrées, remorque standard",
           "Reconfigurable à volonté — scénarios illimités",
           "Compatible avec tous les systèmes CRBR"]
    hw = (CW - 8 * mm) / 2
    for i, av in enumerate(avs):
        col = i % 2
        row = i // 2
        ix = ML + 4 * mm + col * (hw + 4 * mm)
        iy = by + bh - 11 * mm - row * 7 * mm
        check_item(c, av, ix, iy, hw, size=7.5)

# ─── PAGE 9 : SPECTRE COMPLET ─────────────────────────────────────────────────

def page_spectre(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Spectre complet", "09 / 13")
    page_footer(c)

    y = CONTENT_TOP
    section_label(c, "Spectre complet", ML, y)
    y -= 7 * mm
    big_title(c, ["Au-delà du tir."], ML, y, size=24)
    y -= 8 * mm
    subtitle(c, "Couvrir tous les domaines de vos besoins opérationnels — sans exception.", ML, y, CW)
    y -= 10 * mm

    domaines = [
        ("CQB & PROGRESSION", "Entrée dynamique. Progression en espace confiné. Techniques avancées d'intervention. Scénarios multi-zones reconfigurables."),
        ("SCÉNARIOS IA ADAPTATIFS", "Opérateurs virtuels réactifs. Conditions de stress, nuit, contrainte, prise de décision en environnement dégradé."),
        ("ÉQUIPEMENT TACTIQUE", "Analyse balistique. Progressivité et sécurité garanties. Tir précision, stress, mouvement, multi-cibles."),
        ("DÉPLOIEMENT MOBILE", "Sessions sur votre site, selon votre planning. Nos consultants viennent avec le matériel. Logistique entièrement gérée par CRBR."),
    ]

    cw = (CW - 6 * mm) / 2
    ch = 70 * mm
    for i, (titre, texte) in enumerate(domaines):
        col = i % 2
        row = i // 2
        cx = ML + col * (cw + 6 * mm)
        cy = y - row * (ch + 5 * mm) - ch
        card(c, cx, cy, cw, ch)
        card_title(c, titre, cx + 3.5 * mm, cy + ch - 7 * mm)
        mltxt(c, texte, cx + 3.5 * mm, cy + ch - 15 * mm, cw - 7 * mm, size=8.5)

    # Bannière bas
    bh = 22 * mm
    by = y - 2 * (ch + 5 * mm) - ch - 5 * mm - bh
    highlight_box(c, ML, by, CW, bh, label="TERRE — AIR — EAU")
    mltxt(c, "Unité généraliste ou spécialisée. GIGN, RAID, groupement d'intervention, Police Municipale — on s'adapte à chaque contexte. Logistique entièrement gérée par CRBR.",
          ML + 4 * mm, by + bh - 12 * mm, CW - 8 * mm, size=8.5)

# ─── PAGE 10 : MODÈLE ÉCONOMIQUE ─────────────────────────────────────────────

def page_modele_eco(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Modèle économique", "10 / 13")
    page_footer(c)

    y = CONTENT_TOP
    section_label(c, "Modèle économique", ML, y)
    y -= 7 * mm
    big_title(c, ["Une solution adaptée à vos réalités budgétaires."], ML, y, size=18)
    y -= 8 * mm
    subtitle(c, "Abonnement mensuel. Budget prévisible. Tout inclus.", ML, y, CW)
    y -= 10 * mm

    # Comparaison problème / approche
    cw2 = (CW - 5 * mm) / 2
    ch2 = 50 * mm
    card(c, ML, y - ch2, cw2, ch2)
    stxt(c, "PROBLÈME HABITUEL", ML + 3.5 * mm, y - 7 * mm, bold=True, color=RED, size=7.5)
    c.setFillColor(RED)
    c.rect(ML + 3.5 * mm, y - 9 * mm, 14 * mm, 1.2, fill=1, stroke=0)
    mltxt(c, "Achat unique : 150 000 – 300 000 €. Budget bloqué. Procédures marchés publics incompatibles. Maintenance = contrat supplémentaire. Surprises.",
          ML + 3.5 * mm, y - 14 * mm, cw2 - 7 * mm, size=8)

    cx2 = ML + cw2 + 5 * mm
    card(c, cx2, y - ch2, cw2, ch2, border_gold=False)
    c.setStrokeColor(OR_A30)
    c.setLineWidth(0.7)
    c.roundRect(cx2, y - ch2, cw2, ch2, 2, fill=0, stroke=1)
    stxt(c, "APPROCHE CRBR", cx2 + 3.5 * mm, y - 7 * mm, bold=True, color=OR, size=7.5)
    c.setFillColor(OR)
    c.rect(cx2 + 3.5 * mm, y - 9 * mm, 14 * mm, 1.2, fill=1, stroke=0)
    mltxt(c, "Abonnement mensuel. Budget annuel prévisible. Compatible marchés publics (fournisseur récurrent). Maintenance, support et mises à jour : tout inclus.",
          cx2 + 3.5 * mm, y - 14 * mm, cw2 - 7 * mm, size=8)

    y -= ch2 + 7 * mm

    # 4 formules
    cw4 = (CW - 9 * mm) / 4
    ch4 = 55 * mm
    plans = [
        ("ESSENTIEL", None, "Les bases de l'entraînement, maintenance incluse. Idéal pour démarrer.", False),
        ("OPÉRATIONNEL", "★ RECOMMANDÉE", "Spectre élargi, CQB avancé. Formule recommandée pour unités opérationnelles.", True),
        ("PREMIUM", None, "Complet, personnalisé, toutes options. Solution haute intensité.", False),
        ("MOBILE", None, "Sessions régulières sur votre site. On vient avec l'équipement.", False),
    ]
    for i, (label, badge, desc, highlight) in enumerate(plans):
        cx = ML + i * (cw4 + 3 * mm)
        cy = y - ch4
        if highlight:
            c.setFillColor(OR)
            c.roundRect(cx, cy, cw4, ch4, 2, fill=1, stroke=0)
            lc, dc = BG, Color(0.051, 0.051, 0.059, alpha=0.75)
        else:
            card(c, cx, cy, cw4, ch4)
            lc, dc = OR, GRIS_L

        iy = cy + ch4 - 5 * mm
        if badge:
            stxt(c, badge, cx + cw4 / 2, iy, size=6, color=lc, align="center")
            iy -= 5 * mm
        stxt(c, label, cx + cw4 / 2, iy, bold=True, size=10, color=lc, align="center")
        iy -= 8 * mm
        mltxt(c, desc, cx + 3.5 * mm, iy, cw4 - 7 * mm, size=7.5, color=dc)

    # INCLUS
    bh = 30 * mm
    by = y - ch4 - 5 * mm - bh
    highlight_box(c, ML, by, CW, bh, label="INCLUS DANS TOUS LES CONTRATS CRBR")
    inclus = [
        "Installation sur site (zéro travaux permanents)",
        "Mises à jour logicielles et nouveaux scénarios",
        "Support technique réactif — interlocuteur unique",
        "Maintenance préventive et corrective",
        "Consommables (munitions simulées, CO₂, etc.)",
    ]
    hw = (CW - 8 * mm) / 2
    for i, item in enumerate(inclus):
        col = i % 2
        row = i // 2
        ix = ML + 4 * mm + col * (hw + 4 * mm)
        iy = by + bh - 12 * mm - row * 8 * mm
        check_item(c, item, ix, iy, hw, size=7.5)

# ─── PAGE 11 : CLIENTÈLE ─────────────────────────────────────────────────────

def page_clientele(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Clientèle", "11 / 13")
    page_footer(c)

    y = CONTENT_TOP
    section_label(c, "Clientèle", ML, y)
    y -= 7 * mm
    big_title(c, ["Du niveau local aux unités spécialisées."], ML, y, size=20)
    y -= 8 * mm
    subtitle(c, "Chacun choisit la formule qui convient à son contexte. Pas de solution standard — tout est adaptable à votre réalité budgétaire et opérationnelle.", ML, y, CW)
    y -= 10 * mm

    # Photo bande
    ph = 36 * mm
    c.setStrokeColor(OR_A15)
    c.setLineWidth(0.5)
    c.rect(ML, y - ph, CW, ph, stroke=1, fill=0)
    draw_img(c, "CRBR.Couverture.png", ML, y - ph, CW, ph, overlay=0.6)
    y -= ph + 7 * mm

    # 8 badges 4x2
    clients = [
        ("PM", "POLICE MUNICIPALE"), ("GN", "GENDARMERIE NATIONALE"),
        ("PN", "POLICE NATIONALE"), ("AT", "ARMÉE DE TERRE"),
        ("AAE", "ARMÉE AIR & ESPACE"), ("SP", "SÉCURITÉ PRIVÉE"),
        ("AP", "ADMIN. PÉNITENTIAIRE"), ("FS", "FORCES SPÉCIALISÉES"),
    ]
    cw = (CW - 9 * mm) / 4
    ch = 36 * mm
    for i, (sig, label) in enumerate(clients):
        col = i % 4
        row = i // 4
        cx = ML + col * (cw + 3 * mm)
        cy = y - row * (ch + 3 * mm) - ch
        card(c, cx, cy, cw, ch)
        stxt(c, sig, cx + cw / 2, cy + ch - 10 * mm, bold=True, size=20, color=OR, align="center")
        c.setFillColor(OR)
        c.rect(cx + cw / 2 - 8 * mm, cy + ch - 14 * mm, 16 * mm, 1.2, fill=1, stroke=0)
        stxt(c, label, cx + cw / 2, cy + ch - 19 * mm, size=6, bold=True, color=GRIS_L, align="center")

    # Bannière bas
    bh = 24 * mm
    by = y - 2 * (ch + 3 * mm) - ch - 5 * mm - bh
    highlight_box(c, ML, by, CW, bh, label="PEU IMPORTE VOTRE TAILLE, BUDGET, SPÉCIALITÉ")
    mltxt(c, "On ne vend pas à tout le monde le même produit. On construit une solution qui correspond exactement à votre unité, votre budget annuel, vos contraintes opérationnelles. PM ou Forces Spéciales — le traitement est le même : sérieux, précis, efficace.",
          ML + 4 * mm, by + bh - 12 * mm, CW - 8 * mm, size=8.5)

# ─── PAGE 12 : DÉMARRER ──────────────────────────────────────────────────────

def page_demarrer(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Démarrer", "12 / 13")
    page_footer(c)

    y = CONTENT_TOP
    section_label(c, "Démarrer", ML, y)
    y -= 7 * mm
    big_title(c, ["Trois étapes simples."], ML, y, size=24)
    y -= 8 * mm
    subtitle(c, "Du premier contact au déploiement — sans friction, sans engagement caché.", ML, y, CW)
    y -= 10 * mm

    etapes = [
        (1, "Vous nous contactez",
         "Mail, téléphone, formulaire. Pas de RDV commercial forcé. Dites-nous simplement votre situation et vos besoins. On lit, on comprend, on répond — en moins de 48h."),
        (2, "On échange",
         "Un entretien (pas une présentation commerciale). On comprend votre contexte réel : unité, effectifs, infrastructure, budget annuel. On pose des questions opérationnelles. On écoute avant de proposer."),
        (3, "On vous propose",
         "Devis sur-mesure, adapté à votre réalité. Pas de contrat piège, pas de frais cachés, pas de surprise. Déploiement rapide. Accompagnement complet depuis le premier jour."),
    ]

    cw = (CW - 8 * mm) / 3
    ch = 110 * mm
    for i, (num, titre, texte) in enumerate(etapes):
        cx = ML + i * (cw + 4 * mm)
        cy = y - ch
        card(c, cx, cy, cw, ch)
        c.setFont("Helvetica-Bold", 48)
        c.setFillColor(Color(0.788, 0.659, 0.298, alpha=0.20))
        c.drawString(cx + 3.5 * mm, cy + ch - 18 * mm, str(num))
        c.setFillColor(OR)
        c.rect(cx + 3.5 * mm, cy + ch - 21 * mm, 14 * mm, 1.5, fill=1, stroke=0)
        stxt(c, titre, cx + 3.5 * mm, cy + ch - 28 * mm, bold=True, color=BLANC, size=9.5)
        mltxt(c, texte, cx + 3.5 * mm, cy + ch - 38 * mm, cw - 7 * mm, size=8)

    # Engagement
    bh = 28 * mm
    by = y - ch - 5 * mm - bh
    c.setFillColor(CARD)
    c.roundRect(ML, by, CW, bh, 2, fill=1, stroke=0)
    c.setStrokeColor(OR_A30)
    c.setLineWidth(0.8)
    c.roundRect(ML, by, CW, bh, 2, fill=0, stroke=1)
    stxt(c, "ENGAGEMENT CRBR — RÉPONSE GARANTIE SOUS 48H OUVRÉES", W / 2, by + bh - 8 * mm, bold=True, color=OR, size=8, align="center")
    stxt(c, "Vous ne serez jamais noyé dans un CRM.", W / 2, by + bh - 16 * mm, color=GRIS_L, size=8.5, align="center")
    c.setFont("Helvetica-Oblique", 8.5)
    c.setFillColor(GRIS_L)
    c.drawCentredString(W / 2, by + bh - 23 * mm, "Une personne. Une réponse. Un suivi clair.")

# ─── PAGE 13 : CONTACT ───────────────────────────────────────────────────────

def page_contact(c):
    fill_bg(c)
    corner_accents(c)
    page_header(c, "Contact", "13 / 13")
    page_footer(c)

    y = CONTENT_TOP

    # Hero photo avec texte overlay
    ph = 55 * mm
    draw_img(c, "CRBR.Couverture.png", ML, y - ph, CW, ph, overlay=0.62)
    c.setStrokeColor(OR_A30)
    c.setLineWidth(0.5)
    c.rect(ML, y - ph, CW, ph, stroke=1, fill=0)

    stxt(c, "PROCHAINE ÉTAPE", ML + 4 * mm, y - 7 * mm, bold=True, color=OR, size=7)
    c.setFillColor(OR)
    c.rect(ML + 4 * mm, y - 9 * mm, 14 * mm, 1.2, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(BLANC)
    c.drawString(ML + 4 * mm, y - 18 * mm, "Parlons de votre")
    c.setFillColor(OR)
    c.drawString(ML + 4 * mm, y - 30 * mm, "entraînement opérationnel.")
    c.setStrokeColor(Color(0.788, 0.659, 0.298, alpha=0.55))
    c.setLineWidth(0.6)
    c.line(ML + 4 * mm, y - 34 * mm, ML + CW - 4 * mm, y - 34 * mm)
    c.setFont("Helvetica-Oblique", 8.5)
    c.setFillColor(GRIS_L)
    c.drawString(ML + 4 * mm, y - 41 * mm, "Envoyez-nous votre situation. Ensemble, on construit votre solution.")

    y -= ph + 7 * mm

    # 3 cartes contact
    cw3 = (CW - 8 * mm) / 3
    ch3 = 40 * mm
    contacts = [
        ("EMAIL", "info@crbr-solution.fr", "Réponse sous 48h ouvrées"),
        ("TÉLÉPHONE", "06 65 44 52 26", "Lundi au vendredi · 9h – 18h"),
        ("ZONE", "France & International", "Métropole, outre-mer, sur demande"),
    ]
    for i, (label, value, detail) in enumerate(contacts):
        cx = ML + i * (cw3 + 4 * mm)
        cy = y - ch3
        card(c, cx, cy, cw3, ch3)
        card_title(c, label, cx + 3.5 * mm, cy + ch3 - 7 * mm)
        stxt(c, value, cx + 3.5 * mm, cy + ch3 - 17 * mm, bold=True, color=BLANC, size=9)
        c.setFillColor(OR)
        c.rect(cx + 3.5 * mm, cy + ch3 - 20 * mm, 14 * mm, 1.2, fill=1, stroke=0)
        stxt(c, detail, cx + 3.5 * mm, cy + ch3 - 25 * mm, color=GRIS, size=7.5)

    y -= ch3 + 6 * mm

    # QR code + site + logo
    qrh = 50 * mm
    c.setFillColor(CARD)
    c.roundRect(ML, y - qrh, CW, qrh, 2, fill=1, stroke=0)
    c.setStrokeColor(OR_A30)
    c.setLineWidth(0.6)
    c.roundRect(ML, y - qrh, CW, qrh, 2, fill=0, stroke=1)

    # QR image (fond or + code)
    qr_img = ImageReader(QR) if os.path.exists(QR) else None
    qsz = 38 * mm
    qx = ML + 4 * mm
    qy = y - qrh + (qrh - qsz) / 2
    if qr_img:
        c.setFillColor(OR)
        c.rect(qx - 2, qy - 2, qsz + 4, qsz + 4, fill=1, stroke=0)
        c.drawImage(qr_img, qx, qy, qsz, qsz, preserveAspectRatio=True, mask='auto')

    # Texte à droite du QR
    tx = qx + qsz + 7 * mm
    stxt(c, "WWW.CRBR-SOLUTION.FR", tx, y - 8 * mm, bold=True, color=OR, size=10)
    c.setFillColor(OR)
    c.rect(tx, y - 10.5 * mm, 20 * mm, 1.2, fill=1, stroke=0)
    stxt(c, "Scannez pour accéder au site complet :", tx, y - 15 * mm, color=GRIS_L, size=8)
    for j, line in enumerate(["Catalogue détaillé · Études de cas · Demande de présentation",
                               "Réseau de professionnels qualifiés · Discrétion garantie"]):
        stxt(c, line, tx, y - 22 * mm - j * 7 * mm, color=GRIS, size=7.5)

    # Logo CRBR (droite)
    logo = ir("CRBR.Logo Cerberus doré avec _CRBR GROUP_.png")
    if logo:
        lsz = 38 * mm
        lx = ML + CW - lsz - 3 * mm
        ly = y - qrh + (qrh - lsz) / 2
        c.drawImage(logo, lx, ly, lsz, lsz, preserveAspectRatio=True, mask='auto')

# ─── GÉNÉRATION ──────────────────────────────────────────────────────────────

def main():
    print("Génération CRBR Solutions — Plaquette V3...")

    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("CRBR Solutions — Plaquette Marketing 2026")
    c.setAuthor("CRBR Solutions")
    c.setSubject("Consulting Opérationnel — Document Confidentiel")

    pages = [
        (page_cover,         "Couverture"),
        (page_constats,      "Constats terrain"),
        (page_identite,      "Identité"),
        (page_approche,      "Notre approche"),
        (page_valeurs,       "Valeurs"),
        (page_offre,         "Notre offre"),
        (page_technologies,  "Technologies"),
        (page_shooting_house,"Shooting House"),
        (page_spectre,       "Spectre complet"),
        (page_modele_eco,    "Modèle économique"),
        (page_clientele,     "Clientèle"),
        (page_demarrer,      "Démarrer"),
        (page_contact,       "Contact"),
    ]

    for fn, name in pages:
        fn(c)
        c.showPage()
        print(f"  ✓ {name}")

    c.save()
    size_mb = os.path.getsize(OUT) / 1024 / 1024
    print(f"\nFichier : {OUT}")
    print(f"Taille  : {size_mb:.1f} MB — {len(pages)} pages")

if __name__ == "__main__":
    main()
