"""
CRBR Solutions - Plaquette Marketing V2 - 2026
Generateur ReportLab - 13 pages
"""

import sys, os
sys.stdout.reconfigure(encoding='utf-8')

from PIL import Image as PILImage
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader, simpleSplit
import qrcode

# ─── CHEMINS ─────────────────────────────────────────────────────────────────
BASE = "C:/Users/Baptiste-/CRBR-Solution"
IMG  = f"{BASE}/vitrine/img"
MKT  = f"{BASE}/marketing"
OUT  = f"{MKT}/CRBR_Solutions_Plaquette_Marketing_2026_V2.pdf"
QR_PATH = f"{MKT}/qr_code_crbr_v2.png"

# ─── DIMENSIONS A4 ───────────────────────────────────────────────────────────
W, H = A4   # 595.27 x 841.89 pt

# Marges (mm -> pt)
ML = 25 * mm   # left  ~71pt
MR = 25 * mm   # right
MT = 28 * mm   # top   ~79pt
MB = 20 * mm   # bottom ~57pt
CW = W - ML - MR   # content width ~453pt

# ─── PALETTE STRICTE or/noir/gris/blanc ──────────────────────────────────────
C_BG     = HexColor("#111114")
C_BG2    = HexColor("#191920")
C_CARD   = HexColor("#1E1E26")
C_CARD2  = HexColor("#16161B")
C_GOLD   = HexColor("#C9A84C")
C_GOLDL  = HexColor("#E2C56A")
C_GOLDD  = HexColor("#9C7A2E")
C_WHITE  = HexColor("#FFFFFF")
C_OFF    = HexColor("#F0EFE9")
C_GREY   = HexColor("#D1D1D1")
C_GREYD  = HexColor("#8A8A96")
C_ACCENT = HexColor("#26262F")

# Couleurs avec alpha (Color RGBA — supporté par ReportLab)
GOLD_A10 = Color(0.788, 0.659, 0.298, alpha=0.10)
GOLD_A20 = Color(0.788, 0.659, 0.298, alpha=0.20)
GOLD_A35 = Color(0.788, 0.659, 0.298, alpha=0.35)
GOLD_A50 = Color(0.788, 0.659, 0.298, alpha=0.50)
BG_A75   = Color(0.067, 0.067, 0.078, alpha=0.75)
BG_A88   = Color(0.067, 0.067, 0.078, alpha=0.88)
BG_A60   = Color(0.067, 0.067, 0.078, alpha=0.60)
CARD_A85 = Color(0.118, 0.118, 0.149, alpha=0.85)

# ─── HELPERS IMAGES ──────────────────────────────────────────────────────────

def ip(name):
    return f"{IMG}/{name}"

def get_ir(name):
    p = ip(name)
    return ImageReader(p) if os.path.exists(p) else None

def fill_bg(c, col=None):
    c.setFillColor(col or C_BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

def draw_img_full(c, name, alpha=0.18):
    """Image plein fond avec overlay sombre."""
    ir = get_ir(name)
    if not ir:
        return
    c.drawImage(ir, 0, 0, W, H, preserveAspectRatio=False, mask='auto')
    c.setFillColor(BG_A75 if alpha < 0.25 else BG_A88)
    c.rect(0, 0, W, H, fill=1, stroke=0)

def draw_img_box(c, name, x, y, w, h, overlay_alpha=0.50):
    """Image dans une boite rectangulaire avec overlay sombre."""
    ir = get_ir(name)
    if not ir:
        c.setFillColor(C_CARD)
        c.rect(x, y, w, h, fill=1, stroke=0)
        return
    c.drawImage(ir, x, y, w, h, preserveAspectRatio=False, mask='auto')
    bg = Color(0.067, 0.067, 0.078, alpha=overlay_alpha)
    c.setFillColor(bg)
    c.rect(x, y, w, h, fill=1, stroke=0)

# ─── HELPERS DESIGN ──────────────────────────────────────────────────────────

def diagonal_accent(c, x0=None, y0=None, n=5, alpha=0.22):
    """Lignes diagonales or — signature couverture."""
    x0 = x0 or W - 30
    y0 = y0 or H - 20
    col = Color(0.788, 0.659, 0.298, alpha=alpha)
    c.saveState()
    c.setStrokeColor(col)
    c.setLineWidth(1.0)
    for i in range(n):
        gap = i * 22
        x1 = x0 - 140 + gap
        x2 = x0 + 15
        y1 = y0
        y2 = y0 - 140 + gap
        c.line(x1, y1, x2, y2)
    c.restoreState()

def gold_rule(c, x, y, w, alpha=0.6, thick=1):
    col = Color(0.788, 0.659, 0.298, alpha=alpha)
    c.setStrokeColor(col)
    c.setLineWidth(thick)
    c.line(x, y, x + w, y)

def gold_bar(c, x, y, w, h=2, alpha=1.0):
    if alpha < 1.0:
        c.setFillColor(Color(0.788, 0.659, 0.298, alpha=alpha))
    else:
        c.setFillColor(C_GOLD)
    c.rect(x, y, w, h, fill=1, stroke=0)

def section_tag(c, text, x, y, w=None):
    """Etiquette section — texte doré, petite caps."""
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(C_GOLD)
    c.drawString(x, y, text.upper())

def page_header(c, section, title, subtitle=None, img_bg=None):
    """Header uniforme toutes pages — bande sombre + titre."""
    h_bar = 72
    # Background bar
    c.setFillColor(C_ACCENT)
    c.rect(0, H - h_bar, W, h_bar, fill=1, stroke=0)
    # Image fond très attenué si fournie
    if img_bg:
        ir = get_ir(img_bg)
        if ir:
            c.drawImage(ir, 0, H - h_bar, W, h_bar, preserveAspectRatio=False, mask='auto')
            c.setFillColor(Color(0.149, 0.149, 0.184, alpha=0.88))
            c.rect(0, H - h_bar, W, h_bar, fill=1, stroke=0)
    # Gold bottom border (2px)
    gold_bar(c, 0, H - h_bar - 2, W, 2)
    # Thin top accent
    gold_bar(c, 0, H - 4, W, 4)
    # Diagonal accent top-right
    diagonal_accent(c, x0=W - 10, y0=H - 5, n=5, alpha=0.18)
    # Section label
    section_tag(c, section, ML, H - 18)
    # Title
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(C_WHITE)
    c.drawString(ML, H - 46, title)
    # Subtitle
    if subtitle:
        c.setFont("Helvetica", 11)
        c.setFillColor(C_GREY)
        c.drawString(ML, H - 62, subtitle)

def page_footer(c, n, total=13):
    """Footer uniforme."""
    gold_rule(c, ML, MB - 4, CW, alpha=0.35, thick=0.8)
    c.setFont("Helvetica", 7)
    c.setFillColor(C_GREYD)
    c.drawString(ML, MB - 16, "CRBR Solutions — Consulting Operationnel — Document confidentiel")
    c.drawRightString(W - MR, MB - 16, f"www.crbr-solution.fr     {n} / {total}")

def card_bg(c, x, y, w, h, border_left=True, radius=3):
    """Carte fond tinte + bordure gauche or."""
    c.setFillColor(C_CARD)
    c.roundRect(x, y - h, w, h, radius, fill=1, stroke=0)
    if border_left:
        c.setFillColor(C_GOLD)
        c.rect(x, y - h, 4, h, fill=1, stroke=0)

def card_with_image(c, name, x, y, w, h, overlay=0.55):
    """Carte avec image de fond."""
    c.setFillColor(C_CARD2)
    c.rect(x, y - h, w, h, fill=1, stroke=0)
    draw_img_box(c, name, x, y - h, w, h, overlay_alpha=overlay)

def txt(c, text, x, y, size=10, bold=False, color=None, align="left"):
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.setFillColor(color or C_WHITE)
    if align == "center":
        c.drawCentredString(x, y, text)
    elif align == "right":
        c.drawRightString(x, y, text)
    else:
        c.drawString(x, y, text)

def mltxt(c, text, x, y, w, size=10, bold=False, color=None, lh=None, align="left"):
    """Texte multiligne — retourne y final."""
    font = "Helvetica-Bold" if bold else "Helvetica"
    c.setFont(font, size)
    c.setFillColor(color or C_OFF)
    lh = lh or size * 1.65
    lines = simpleSplit(text, font, size, w)
    for i, line in enumerate(lines):
        yd = y - i * lh
        if align == "center":
            c.drawCentredString(x + w / 2, yd, line)
        elif align == "right":
            c.drawRightString(x + w, yd, line)
        else:
            c.drawString(x, yd, line)
    return y - len(lines) * lh

def bullet_check(c, x, y, text, size=9.5, color_check=None, color_text=None):
    """Ligne avec checkmark doré."""
    c.setFont("Helvetica-Bold", size)
    c.setFillColor(color_check or C_GOLD)
    c.drawString(x, y, "✓")
    c.setFont("Helvetica", size)
    c.setFillColor(color_text or C_GREY)
    c.drawString(x + 14, y, text)

def step_circle(c, cx, cy, num, r=18):
    """Cercle numéroté doré."""
    c.setFillColor(C_GOLD)
    c.circle(cx, cy, r, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(C_BG)
    c.drawCentredString(cx, cy - 6, str(num))

# ─── QR CODE V2 ──────────────────────────────────────────────────────────────

def generate_qr():
    """
    QR code scannable : modules SOMBRES (#111114) sur fond OR (#C9A84C).

    Regle QR (ISO 18004) : les modules de donnees doivent etre plus SOMBRES
    que le fond. V2 precedente avait l'inverse (or clair sur noir fonce) ->
    le scanner lisait les donnees a l'envers -> echec.

    Solution : fill_color=noir (modules sombres), back_color=or (fond clair).
    Meme esthetique CRBR (couleur or dominante), orientation correcte.
    Logo Cerbere noir au centre sur cercle or.
    URL : https://www.crbr-solution.fr/
    """
    print("Generation QR code (modules sombres/fond or — scannable)...")
    from PIL import ImageDraw

    NOIR = (17, 17, 20, 255)
    OR   = (201, 168, 76, 255)

    # ── 1. QR direct : modules noirs sur fond or ─────────────────────────────
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=16,
        border=4,
    )
    qr.add_data("https://www.crbr-solution.fr/")
    qr.make(fit=True)

    # fill_color = couleur des modules (sombre) / back_color = fond (clair)
    qr_img = qr.make_image(
        fill_color="#111114",   # modules : noir/sombre  -> LU comme "data" ✓
        back_color="#C9A84C",   # fond    : or clair     -> LU comme "vide"  ✓
    ).convert("RGBA")

    W_qr, H_qr = qr_img.size

    # ── 2. Logo Cerbere : fond or, Cerbere sombre au centre ─────────────────
    logo_path = ip("CRBR.logo_qr_code.png")
    if os.path.exists(logo_path):
        logo_orig = PILImage.open(logo_path).convert("RGBA")

        # Logo original est sombre sur fond transparent -> parfait sur fond or
        # On garde le logo tel quel (sombre sur or = lisible et contraste)
        _, _, _, a_ch = logo_orig.split()
        dark_logo = PILImage.merge("RGBA", (
            PILImage.new("L", logo_orig.size, 17),   # R = #111114
            PILImage.new("L", logo_orig.size, 17),   # G
            PILImage.new("L", logo_orig.size, 20),   # B
            a_ch,                                     # alpha original
        ))

        # Logo 22% du QR (limite safe avec ERROR_CORRECT_H)
        logo_size = int(W_qr * 0.22)
        dark_logo = dark_logo.resize((logo_size, logo_size), PILImage.LANCZOS)

        # Cercle fond or (harmonieux avec le fond QR) + anneau sombre
        pad      = 18
        circle_d = logo_size + pad * 2
        bg       = PILImage.new("RGBA", (circle_d, circle_d), (0, 0, 0, 0))
        dc       = ImageDraw.Draw(bg)
        dc.ellipse([0, 0, circle_d - 1, circle_d - 1], fill=OR)
        dc.ellipse([2, 2, circle_d - 3, circle_d - 3],
                   outline=(17, 17, 20, 200), width=3)

        lx = (circle_d - logo_size) // 2
        ly = (circle_d - logo_size) // 2
        bg.paste(dark_logo, (lx, ly), dark_logo)

        cx = (W_qr - circle_d) // 2
        cy = (H_qr - circle_d) // 2
        qr_img.paste(bg, (cx, cy), bg)

    qr_img.save(QR_PATH)
    print(f"  OK: {QR_PATH}  ({W_qr}x{H_qr}px | modules sombres/fond or | logo 22%)")

# ─── PAGE 1 — COUVERTURE (image directe) ─────────────────────────────────────

def page_cover(c):
    """Page 1 : CRBR.Couverture.png pleine page."""
    cover_ir = get_ir("CRBR.Couverture.png")
    if cover_ir:
        # Image 1024x1536, quasi A4 portrait — etirer sur toute la page
        c.drawImage(cover_ir, 0, 0, W, H, preserveAspectRatio=False, mask='auto')
    else:
        # Fallback
        fill_bg(c)
        txt(c, "CRBR SOLUTIONS", W/2, H/2, size=36, bold=True, color=C_GOLD, align="center")

# ─── PAGE 2 — CONSTATS TERRAIN ───────────────────────────────────────────────

def page_freins(c):
    fill_bg(c)
    draw_img_full(c, "problem-training-gap.jpg", alpha=0.15)
    page_header(c, "CONSTATS TERRAIN",
                "CRBR resout les freins a l'entrainement",
                "L'entrainement regulier, c'est la base. Mais sur le terrain ?")

    # Intro encadree
    intro_y = H - 100
    card_bg(c, ML, intro_y, CW, 52, border_left=True, radius=2)
    corps = ("Distance des centres. Creneaux rares. Budgets de munitions qui explosent. "
             "Effectifs impossibles a liberer. Infrastructure inadaptee. "
             "Resultat : l'entrainement devient sporadique, les competences s'erodent.")
    mltxt(c, corps, ML + 14, intro_y - 12, CW - 24, size=9.5, color=C_GREY, lh=14)

    # 4 cartes freins (2x2)
    freins = [
        ("Shooting-1.jpg",           "DISTANCE",        "Les centres d'entrainement sont trop loin. La logistique seule coute autant que la formation. Le temps de deplacement impacte les operations."),
        ("contact-briefing.jpg",     "CRENEAUX",        "Les plages disponibles sont rares, imposees, rarement compatibles avec le rythme operationnel de votre unite. Vous prenez ce qu'il reste."),
        ("airsoft-equipment.jpg",    "BUDGET MUNITIONS","Chaque seance de tir reel consomme un budget significatif. Impossible de multiplier les entrainements sans depasser les enveloppes annuelles."),
        ("operator-training.jpg",    "EFFECTIFS",       "Liberer du personnel pour l'entrainement reste un defi permanent. La pression operationnelle fait passer la formation au second plan."),
    ]

    cw2 = (CW - 12) / 2
    ch2 = 178
    base_y = H - 182

    for i, (img, titre, body) in enumerate(freins):
        col = i % 2
        row = i // 2
        x = ML + col * (cw2 + 12)
        y = base_y - row * (ch2 + 10)

        # Fond avec image
        c.setFillColor(C_CARD2)
        c.rect(x, y - ch2, cw2, ch2, fill=1, stroke=0)
        ir = get_ir(img)
        if ir:
            c.drawImage(ir, x, y - ch2, cw2, ch2, preserveAspectRatio=False, mask='auto')
        c.setFillColor(CARD_A85)
        c.rect(x, y - ch2, cw2, ch2, fill=1, stroke=0)
        # Bordure gauche or
        c.setFillColor(C_GOLD)
        c.rect(x, y - ch2, 4, ch2, fill=1, stroke=0)
        # Numero
        c.setFont("Helvetica-Bold", 38)
        c.setFillColor(GOLD_A10)
        c.drawString(x + cw2 - 42, y - ch2 + 6, str(i + 1))
        # Titre
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(C_GOLD)
        c.drawString(x + 14, y - 16, titre)
        gold_rule(c, x + 14, y - 22, cw2 - 24, alpha=0.3, thick=0.8)
        # Corps
        mltxt(c, body, x + 14, y - 34, cw2 - 20, size=8.5, color=C_GREY, lh=13)

    # Conclusion
    conc_y = H - 568
    card_bg(c, ML, conc_y, CW, 48, border_left=True, radius=2)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(C_GOLDL)
    c.drawString(ML + 14, conc_y - 14, "La reponse CRBR :")
    mltxt(c, "On apporte l'entrainement chez vous. Disponible quand vous en avez besoin. "
             "Sans logistique complexe. Sans couts qui explosent. Adapte a votre realite.",
          ML + 14, conc_y - 28, CW - 28, size=9.5, color=C_OFF, lh=14)

    page_footer(c, 2)

# ─── PAGE 3 — POURQUOI CRBR SOLUTIONS ───────────────────────────────────────

def page_pourquoi(c):
    fill_bg(c)
    page_header(c, "IDENTITE", "Pourquoi CRBR Solutions ?",
                "Un cabinet de consulting specialise dans les solutions operationnelles d'entrainement.")

    intro_y = H - 100
    mltxt(c, "Notre mission : rendre l'entrainement de haute qualite accessible a chaque unite, "
             "quelle que soit sa taille ou son budget. On ne fabrique pas. On selectionne, integre, deploie. "
             "Les meilleures technologies du marche international, assemblees et maintenues par un reseau "
             "de professionnels qualifies — avec un seul interlocuteur pour vous.",
          ML, intro_y, CW, size=10.5, color=C_GREY, lh=15.5)

    # Separateur
    gold_rule(c, ML, H - 168, CW, alpha=0.35)

    # 6 differenciateurs 2x3
    diffs = [
        ("Approche terrain",     "Nos consultants viennent du secteur. Pas de commercial — des praticiens. On parle votre langue, on connait vos contraintes."),
        ("Solution complete",    "De l'audit initial a la maintenance annuelle. Un seul point de contact. Pas de multi-fournisseurs a coordonner."),
        ("Flexibilite reelle",   "Abonnement mensuel ajustable. Evolue avec votre budget et vos besoins. Formule modifiable en cours de contrat."),
        ("Discretion totale",    "Environnements sensibles par nature. Protocoles de confidentialite stricts. Aucune communication externe sans accord."),
        ("Reseau qualifie",      "Partenaires techniques certifies, selectionnes sur references operationnelles. Pas de sous-traitance inconnue."),
        ("Support reactif",      "Probleme technique = reponse sous 24h, intervention sous 72h. Maintenance preventive incluse dans chaque contrat."),
    ]

    cw2 = (CW - 12) / 2
    ch_card = 110
    base_y = H - 195

    for i, (titre, body) in enumerate(diffs):
        col = i % 2
        row = i // 2
        x = ML + col * (cw2 + 12)
        y = base_y - row * (ch_card + 8)

        card_bg(c, x, y, cw2, ch_card, border_left=True, radius=3)
        txt(c, titre.upper(), x + 14, y - 16, size=9.5, bold=True, color=C_GOLD)
        gold_rule(c, x + 14, y - 22, cw2 - 24, alpha=0.25)
        mltxt(c, body, x + 14, y - 34, cw2 - 22, size=8.5, color=C_GREY, lh=12.5)

    # Tagline finale
    tg_y = H - 572
    c.setFillColor(GOLD_A10)
    c.roundRect(ML, tg_y - 32, CW, 38, 3, fill=1, stroke=0)
    gold_bar(c, ML, tg_y + 6, CW, 2)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, tg_y - 16, "Un partenaire operationnel sur la duree. Pas un fournisseur qui disparait apres la livraison.")

    page_footer(c, 3)

# ─── PAGE 4 — NOTRE APPROCHE ─────────────────────────────────────────────────

def page_process(c):
    fill_bg(c)
    page_header(c, "NOTRE APPROCHE", "Trois etapes. Une solution integree.",
                "Simple, clair, sans engagement cache.")

    # 3 etapes (layout vertical avec images laterales)
    steps = [
        ("contact-briefing.jpg",  "On comprend votre contexte",
         "Vos missions. Vos menaces. Vos effectifs. Ce que vous avez deja. "
         "Pas de grille standard — on ecoute avant de proposer. "
         "Un entretien, 48h max, puis une analyse ecrite de votre situation."),
        ("custom-analysis.jpg",   "On concoit votre solution",
         "Pas de catalogue impose. On assemble ce qui repond a vos besoins reels, "
         "dans votre budget, avec vos contraintes terrain et vos procedures internes. "
         "Chaque devis est unique. Rien n'est standard."),
        ("programme-mobile.jpg",  "On la met en place et on la maintient",
         "Installation sur site. Formation des referents. Support permanent inclus. "
         "On reste partenaire — on ne livre pas et on disparait. "
         "Maintenance preventive, mises a jour, support reactif : tout est inclus."),
    ]

    img_w = 185
    txt_w = CW - img_w - 24
    base_y = H - 100
    step_h = 142

    for i, (img, titre, body) in enumerate(steps):
        y = base_y - i * (step_h + 10)

        # Fond carte
        card_bg(c, ML, y, CW, step_h, border_left=False, radius=3)
        c.setFillColor(C_CARD)
        c.roundRect(ML, y - step_h, CW, step_h, 3, fill=1, stroke=0)

        # Image droite
        img_x = ML + CW - img_w
        c.setFillColor(C_CARD2)
        c.rect(img_x, y - step_h, img_w, step_h, fill=1, stroke=0)
        ir = get_ir(img)
        if ir:
            c.drawImage(ir, img_x, y - step_h, img_w, step_h,
                        preserveAspectRatio=False, mask='auto')
        c.setFillColor(BG_A60)
        c.rect(img_x, y - step_h, img_w, step_h, fill=1, stroke=0)

        # Bordure gauche or (4px)
        c.setFillColor(C_GOLD)
        c.rect(ML, y - step_h, 4, step_h, fill=1, stroke=0)

        # Cercle numero
        step_circle(c, ML + 30, y - step_h / 2, i + 1, r=17)

        # Titre
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(C_WHITE)
        c.drawString(ML + 58, y - 18, titre)
        gold_rule(c, ML + 58, y - 26, txt_w - 10, alpha=0.25)

        # Corps
        mltxt(c, body, ML + 58, y - 40, txt_w - 10, size=9, color=C_GREY, lh=14)

        # Fleche entre etapes
        if i < 2:
            ay = y - step_h - 4
            c.setStrokeColor(GOLD_A35)
            c.setLineWidth(1.2)
            c.line(ML + 30, ay, ML + 30, ay - 6)
            c.setFillColor(GOLD_A35)
            p = c.beginPath()
            p.moveTo(ML + 24, ay - 6)
            p.lineTo(ML + 36, ay - 6)
            p.lineTo(ML + 30, ay - 12)
            p.close()
            c.drawPath(p, fill=1, stroke=0)

    # Bloc "Ce qui ne change jamais"
    nc_y = H - 576
    c.setFillColor(GOLD_A10)
    c.roundRect(ML, nc_y - 72, CW, 78, 3, fill=1, stroke=0)
    gold_bar(c, ML, nc_y + 6, CW, 2)
    gold_bar(c, ML, nc_y - 66, CW, 2)

    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(C_GOLD)
    c.drawString(ML + 14, nc_y - 10, "Ce qui ne change jamais :")

    garants = ["Interlocuteur unique, disponible tout au long du contrat",
               "Delais contractualises et respectes",
               "Adaptation possible en cours de contrat si besoin",
               "Aucun engagement cache — tout est ecrit avant signature"]
    col_w = (CW - 28) / 2
    for i, g in enumerate(garants):
        bx = ML + 14 + (i % 2) * (col_w + 10)
        by = nc_y - 30 - (i // 2) * 20
        bullet_check(c, bx, by, g, size=9)

    page_footer(c, 4)

# ─── PAGE 5 — NOS VALEURS ────────────────────────────────────────────────────

def page_valeurs(c):
    fill_bg(c)
    page_header(c, "IDENTITE", "Ce qui guide chaque decision",
                "Six principes. Pas de posture — des engagements concrets.")

    valeurs = [
        ("PRECISION",    "Chaque solution repond a un besoin precis, dans un contexte precis. Pas de reponse generique. Pas de sur-dimensionnement. Exactement ce qu'il faut, la ou il faut."),
        ("PROGRESSION",  "Amelioration durable, pas evenementielle. Votre niveau monte sur le long terme — pas uniquement les jours de stage. L'entrainement s'integre dans votre routine operationnelle."),
        ("FIABILITE",    "Ca fonctionne quand vous en avez besoin. La maintenance est incluse, pas en option. Un equipement en panne le jour J n'est pas une option — ni pour vous, ni pour nous."),
        ("PRAGMATISME",  "On integre vos contraintes reelles : budgets annuels, procedures marches publics, infrastructure existante, restrictions operationnelles. On s'adapte a vous, pas l'inverse."),
        ("ENGAGEMENT",   "Partenaire operationnel sur la duree. On reste. On evolue avec vous. On connait votre contexte apres 6 mois de contrat mieux que n'importe quel fournisseur de passage."),
        ("DISCRETION",   "Environnements sensibles par nature. Protocoles de confidentialite stricts. Interventions discretes. Aucune communication externe sans votre accord explicite."),
    ]

    cw2 = (CW - 14) / 2
    ch_v = 130
    base_y = H - 100

    for i, (titre, body) in enumerate(valeurs):
        col = i % 2
        row = i // 2
        x = ML + col * (cw2 + 14)
        y = base_y - row * (ch_v + 10)

        # Fond carte
        c.setFillColor(C_CARD)
        c.roundRect(x, y - ch_v, cw2, ch_v, 3, fill=1, stroke=0)
        # Bordure gauche or
        c.setFillColor(C_GOLD)
        c.rect(x, y - ch_v, 4, ch_v, fill=1, stroke=0)
        # Accent numero subtle
        c.setFont("Helvetica-Bold", 44)
        c.setFillColor(GOLD_A10)
        c.drawString(x + cw2 - 44, y - ch_v + 4, str(i + 1))
        # Titre
        txt(c, titre, x + 14, y - 17, size=10.5, bold=True, color=C_GOLD)
        gold_rule(c, x + 14, y - 25, cw2 - 24, alpha=0.25)
        # Corps
        mltxt(c, body, x + 14, y - 38, cw2 - 22, size=8.8, color=C_GREY, lh=13)

    # Logo discret bas-droite
    logo_ir = get_ir("logo-cerbere-or-metallique.png")
    if logo_ir:
        c.saveState()
        c.setFillColor(Color(1, 1, 1, alpha=0.08))
        c.drawImage(logo_ir, W - MR - 70, MB, 65, 44, preserveAspectRatio=True, mask='auto')
        c.restoreState()

    page_footer(c, 5)

# ─── PAGE 6 — OFFRE SOLUTIONS ────────────────────────────────────────────────

def page_solutions(c):
    fill_bg(c)
    page_header(c, "OFFRE", "Une reponse adaptee a vos besoins operationnels",
                "Quatre domaines. Un ecosysteme completement integre.")

    domaines = [
        ("solution-simulator-room.jpg", "SYSTEMES DE TIR AVANCES",
         "Simulation laser haute-fidelite. Travail technique et decisionnel sans contrainte de munitions reelles. "
         "Scenarios realistes configurables. Analyse de performance par tireur en temps reel. "
         "Compatible armes reelles modifiees — aucune munition."),
        ("airsoft-equipment.jpg", "ARMEMENT DEDIE A L'ENTRAINEMENT",
         "Realisme complet de maniement et de gestuelle. Securite totale. "
         "Compatibilite avec vos protocoles existants. "
         "Concu pour un usage intensif en conditions reelles d'entrainement. Entretien inclus."),
        ("breach-door.jpg", "STRUCTURES D'ENTRAINEMENT DYNAMIQUE",
         "Escalade, rappel, corde lisse, CQB, progression tactique. "
         "Reconfigurable selon vos scenarios en moins d'une heure. "
         "Montage/demontage rapide, transportable, sans travaux permanents."),
        ("operator-training.jpg", "EQUIPEMENTS OPERATIONNELS COMPLEMENTAIRES",
         "Outils d'effraction, equipement tactique, pyrotechnie d'entrainement, protection balistique. "
         "Tout ce qui complete votre dispositif de formation. "
         "Selectionne sur specifications operationnelles, pas sur catalogue."),
    ]

    cw2 = (CW - 14) / 2
    ch_d = 185
    base_y = H - 100

    for i, (img, titre, body) in enumerate(domaines):
        col = i % 2
        row = i // 2
        x = ML + col * (cw2 + 14)
        y = base_y - row * (ch_d + 10)

        # Image de fond
        c.setFillColor(C_CARD2)
        c.rect(x, y - ch_d, cw2, ch_d, fill=1, stroke=0)
        ir = get_ir(img)
        if ir:
            c.drawImage(ir, x, y - ch_d, cw2, ch_d, preserveAspectRatio=False, mask='auto')
        c.setFillColor(CARD_A85)
        c.rect(x, y - ch_d, cw2, ch_d, fill=1, stroke=0)

        # Border top or
        gold_bar(c, x, y, cw2, 2)
        # Titre sur fond sombre
        c.setFillColor(C_ACCENT)
        c.rect(x, y - 26, cw2, 26, fill=1, stroke=0)
        gold_bar(c, x, y - 26, cw2, 1, alpha=0.3)
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(C_GOLDL)
        c.drawString(x + 10, y - 17, titre)

        # Corps
        mltxt(c, body, x + 10, y - 40, cw2 - 18, size=8.5, color=C_GREY, lh=12.5)

        # Legend subtile
        c.setFont("Helvetica", 7)
        c.setFillColor(C_GREYD)
        legend = ["Simulation & tir", "Maniement & securite", "CQB & progression", "Equipements terrain"][i]
        c.drawRightString(x + cw2 - 8, y - ch_d + 6, legend)

    # Phrase cle bas
    pk_y = H - 584
    c.setFillColor(GOLD_A10)
    c.roundRect(ML, pk_y - 28, CW, 34, 3, fill=1, stroke=0)
    gold_bar(c, ML, pk_y + 6, CW, 2)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, pk_y - 12, "Tout ca fonctionne ensemble. Une solution integree. Un seul interlocuteur.")

    page_footer(c, 6)

# ─── PAGE 7 — EQUIPEMENTS DETAIL ─────────────────────────────────────────────

def page_equipment(c):
    fill_bg(c)
    page_header(c, "TECHNOLOGIES", "Les technologies qui font la difference",
                "Selection internationale. Integration par des professionnels du secteur.")

    # Simulation — grande carte haut
    sim_y = H - 100
    sim_h = 150
    c.setFillColor(C_CARD2)
    c.roundRect(ML, sim_y - sim_h, CW, sim_h, 3, fill=1, stroke=0)
    ir_sim = get_ir("solution-simulator-room.jpg")
    if ir_sim:
        c.drawImage(ir_sim, ML + CW - 195, sim_y - sim_h, 195, sim_h, preserveAspectRatio=False, mask='auto')
        c.setFillColor(BG_A60)
        c.rect(ML + CW - 195, sim_y - sim_h, 195, sim_h, fill=1, stroke=0)
    gold_bar(c, ML, sim_y, CW, 2)
    c.setFillColor(C_GOLD)
    c.rect(ML, sim_y - sim_h, 4, sim_h, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(C_GOLDL)
    c.drawString(ML + 14, sim_y - 18, "SIMULATION LASER HAUTE-FIDELITE")
    gold_rule(c, ML + 14, sim_y - 26, CW - 220, alpha=0.3)
    items_sim = [
        "Retour balistique realiste (recul, son, chaleur)",
        "Analyse comportementale par tireur en temps reel",
        "Scenarios personnalises (hostiles, neutres, civils)",
        "Compatible armes reelles modifiees — zero munition",
        "Debriefing video integre, export possible",
        "Multi-postes : jusqu'a 8 tireurs simultanement",
    ]
    c.setFont("Helvetica", 9)
    c.setFillColor(C_GREY)
    for i, item in enumerate(items_sim):
        col2 = i % 2
        row2 = i // 2
        bx = ML + 14 + col2 * ((CW - 220) / 2)
        by = sim_y - 42 - row2 * 16
        c.setFillColor(C_GOLD)
        c.circle(bx, by + 4, 2.5, fill=1, stroke=0)
        c.setFillColor(C_GREY)
        c.drawString(bx + 8, by, item)

    # 3 blocs technos
    techs = [
        ("breach-door.jpg", "EFFRACTION & ACCES",
         ["Battering rams certifies", "Coupe-verrou hydraulique", "Portes reconfigurables", "Multi-scenarios interieur/ext"]),
        ("airsoft-equipment.jpg", "ARMEMENT DEDIE",
         ["Realisme maniement total", "Recoil electrique ou gaz", "Entretien & pieces inclus", "Pistolet, carbine, SMG"]),
        ("programme-mobile.jpg", "DEPLOIEMENT MOBILE",
         ["Remorque tout-terrain", "Autonome (generateur)", "Installation < 2 heures", "Session complete sur site"]),
    ]
    tw = (CW - 20) / 3
    th = 165
    ty = H - 272

    for i, (img, titre, items) in enumerate(techs):
        x = ML + i * (tw + 10)
        c.setFillColor(C_CARD2)
        c.roundRect(x, ty - th, tw, th, 3, fill=1, stroke=0)
        ir = get_ir(img)
        if ir:
            c.drawImage(ir, x, ty - 55, tw, 55, preserveAspectRatio=False, mask='auto')
            c.setFillColor(BG_A75)
            c.rect(x, ty - 55, tw, 55, fill=1, stroke=0)
        gold_bar(c, x, ty, tw, 2)
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(C_GOLDL)
        c.drawCentredString(x + tw / 2, ty - 14, titre)
        gold_rule(c, x + 8, ty - 20, tw - 16, alpha=0.25)
        c.setFont("Helvetica", 8.5)
        c.setFillColor(C_GREY)
        for j, item in enumerate(items):
            c.setFillColor(C_GOLDD)
            c.circle(x + 14, ty - 32 - j * 16 + 3, 2.2, fill=1, stroke=0)
            c.setFillColor(C_GREY)
            c.drawString(x + 22, ty - 32 - j * 16, item)

    # Note integration
    ni_y = H - 468
    c.setFillColor(GOLD_A10)
    c.roundRect(ML, ni_y - 30, CW, 36, 3, fill=1, stroke=0)
    gold_bar(c, ML, ni_y + 6, CW, 2)
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(C_GOLD)
    c.drawString(ML + 14, ni_y - 12, "Integration complete :")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(C_GREY)
    c.drawString(ML + 140, ni_y - 12,
                 "Tous les equipements fonctionnent ensemble. Un ecosysteme coherent, "
                 "pas une somme de produits.")

    page_footer(c, 7)

# ─── PAGE 8 — SHOOTING HOUSE ─────────────────────────────────────────────────

def page_shooting_house(c):
    fill_bg(c)
    page_header(c, "STRUCTURE PHARE", "La structure d'entrainement modulaire",
                "Scalable. Reconfigurable. Prete a l'usage.")

    niveaux = [
        ("shooting_house_1.png", "BASIC",   "40 m²",
         ["Progression simple", "CQB basique", "Introduction & fondamentaux", "1 a 4 operateurs"],
         GOLD_A20, C_GOLDD),
        ("shooting_house_2.png", "PRO",     "70 – 85 m²",
         ["Scenarios complexes", "Zones multiples", "Equipes jusqu'a 8 op.", "Recommande (polyvalent)"],
         GOLD_A35, C_GOLD),
        ("shooting_house_3.png", "PREMIUM", "110 – 120 m²",
         ["Haute complexite", "Situations avancees", "Exercises de grande ampleur", "Unites specialisees"],
         GOLD_A50, C_GOLDL),
    ]

    tw = (CW - 20) / 3
    img_h = 195
    desc_h = 140
    base_y = H - 100

    for i, (img, niveau, surface, items, bg_alpha, col_accent) in enumerate(niveaux):
        x = ML + i * (tw + 10)

        # Header niveau
        c.setFillColor(bg_alpha)
        c.roundRect(x, base_y - 28, tw, 28, 3, fill=1, stroke=0)
        gold_bar(c, x, base_y, tw, 2)
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(col_accent)
        c.drawCentredString(x + tw / 2, base_y - 18, f"NIVEAU {niveau}")

        # Image
        ir = get_ir(img)
        img_y = base_y - 28 - img_h
        c.setFillColor(C_CARD2)
        c.rect(x, img_y, tw, img_h, fill=1, stroke=0)
        if ir:
            c.drawImage(ir, x, img_y, tw, img_h, preserveAspectRatio=False, mask='auto')

        # Surface badge
        c.setFillColor(bg_alpha)
        c.rect(x, img_y, tw, 28, fill=1, stroke=0)
        gold_bar(c, x, img_y + 28, tw, 1, alpha=0.4)
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(col_accent)
        c.drawCentredString(x + tw / 2, img_y + 9, surface)

        # Description
        desc_y = img_y - 8
        c.setFillColor(C_CARD)
        c.rect(x, desc_y - desc_h, tw, desc_h, fill=1, stroke=0)
        c.setFillColor(C_GOLD)
        c.rect(x, desc_y - desc_h, 4, desc_h, fill=1, stroke=0)
        c.setFont("Helvetica", 9)
        c.setFillColor(C_GREY)
        for j, item in enumerate(items):
            by = desc_y - 16 - j * 17
            c.setFillColor(col_accent)
            c.circle(x + 13, by + 4, 2.5, fill=1, stroke=0)
            c.setFillColor(C_GREY)
            c.drawString(x + 21, by, item)

    # Avantages communs
    av_y = H - 576
    c.setFillColor(GOLD_A10)
    c.roundRect(ML, av_y - 78, CW, 84, 3, fill=1, stroke=0)
    gold_bar(c, ML, av_y + 6, CW, 2)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(C_GOLD)
    c.drawString(ML + 14, av_y - 12, "Avantages communs a tous les niveaux :")

    avantages = [
        "Montage / demontage rapide (aucun travaux permanents)",
        "Transportable — roues integrees, remorque standard",
        "Reconfigurable a volonte — scenarios illimites",
        "Compatible avec tous les systemes d'entrainement CRBR",
    ]
    col_av = (CW - 28) / 2
    for i, av in enumerate(avantages):
        bx = ML + 14 + (i % 2) * (col_av + 8)
        by = av_y - 32 - (i // 2) * 22
        bullet_check(c, bx, by, av, size=9.5)

    page_footer(c, 8)

# ─── PAGE 9 — SPECTRE COMPLET ────────────────────────────────────────────────

def page_spectre(c):
    fill_bg(c)
    page_header(c, "SPECTRE COMPLET", "Au-dela du tir. L'entrainement operationnel complet.",
                "Couvrir tous les domaines de vos besoins operationnels — sans exception.")

    domaines = [
        ("breach-door.jpg",       "CQB & PROGRESSION",        "Entree dynamique. Progression en espace confine. Techniques avancees d'intervention. Scenarios multi-zones reconfigurables."),
        ("airsoft-equipment.jpg", "EQUIPEMENT TACTIQUE",      "Armement dedie, protection balistique, outillage d'effraction. Tout le materiel pour un entrainement complet et sur."),
        ("programme-mobile.jpg",  "DEPLOIEMENT MOBILE",       "Sessions sur votre site, selon votre planning. Nos consultants viennent avec le materiel. Logistique entierement geree par CRBR."),
        ("hero-simulator.jpg",    "SIMULATION AVANCEE",       "Scenarios IA adaptatifs. Operateurs virtuels reactifs. Conditions stress, nuit, contrainte, prise de decision en environnement degrade."),
        ("Shooting-1.jpg",        "TIR OPERATIONNEL",         "Tir a distance, CQB, mouvement et tir. Munitions reelles ou simulation. Analyse balistique. Progressivite et securite garanties."),
        ("contact-briefing.jpg",  "MULTI-DOMAINES & SPECS",   "Terre, air, eau. Unite generaliste ou specialisee. GIGN, RAID, groupement d'intervention, PM — on s'adapte a chaque contexte."),
    ]

    tw = (CW - 20) / 3
    th = 175
    base_y = H - 100

    for i, (img, titre, body) in enumerate(domaines):
        col = i % 3
        row = i // 3
        x = ML + col * (tw + 10)
        y = base_y - row * (th + 10)

        c.setFillColor(C_CARD2)
        c.rect(x, y - th, tw, th, fill=1, stroke=0)
        ir = get_ir(img)
        if ir:
            c.drawImage(ir, x, y - th, tw, th, preserveAspectRatio=False, mask='auto')
        c.setFillColor(CARD_A85)
        c.rect(x, y - th, tw, th, fill=1, stroke=0)
        # Border top or
        gold_bar(c, x, y, tw, 2)
        # Titre bande sombre
        c.setFillColor(C_ACCENT)
        c.rect(x, y - 24, tw, 24, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(C_GOLDL)
        c.drawString(x + 8, y - 15, titre)
        # Corps
        mltxt(c, body, x + 8, y - 36, tw - 14, size=8, color=C_GREY, lh=12)

    page_footer(c, 9)

# ─── PAGE 10 — MODELE ECONOMIQUE ─────────────────────────────────────────────

def page_budget(c):
    fill_bg(c, C_BG2)
    page_header(c, "MODELE ECONOMIQUE",
                "Enfin une solution qui s'adapte a vos realites budgetaires",
                "Abonnement mensuel. Budget previsible. Tout inclus.")

    # Avant / Apres
    col2 = (CW - 14) / 2
    av_y = H - 100
    av_h = 80

    # AVANT
    c.setFillColor(Color(0.18, 0.06, 0.06, alpha=1))
    c.roundRect(ML, av_y - av_h, col2, av_h, 3, fill=1, stroke=0)
    c.setFillColor(HexColor("#992222"))
    c.rect(ML, av_y - av_h, 4, av_h, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(HexColor("#FF6B6B"))
    c.drawString(ML + 14, av_y - 14, "PROBLEME HABITUEL")
    c.setFont("Helvetica", 8.5)
    c.setFillColor(C_GREY)
    lignes_av = ["Achat unique : 150 000 – 300 000EUR. Budget bloque.",
                 "Procedures marches publics incompatibles.",
                 "Maintenance = contrat supplementaire. Surprise."]
    for i, l in enumerate(lignes_av):
        c.drawString(ML + 14, av_y - 32 - i * 15, l)

    # APRES
    x_ap = ML + col2 + 14
    c.setFillColor(Color(0.06, 0.15, 0.06, alpha=1))
    c.roundRect(x_ap, av_y - av_h, col2, av_h, 3, fill=1, stroke=0)
    c.setFillColor(C_GOLD)
    c.rect(x_ap, av_y - av_h, 4, av_h, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(C_GOLDL)
    c.drawString(x_ap + 14, av_y - 14, "APPROCHE CRBR")
    c.setFont("Helvetica", 8.5)
    c.setFillColor(C_GREY)
    lignes_ap = ["Abonnement mensuel. Budget annuel previsible.",
                 "Compatible marches publics (fournisseur recurrent).",
                 "Maintenance + support + mises a jour : tout inclus."]
    for i, l in enumerate(lignes_ap):
        c.drawString(x_ap + 14, av_y - 32 - i * 15, l)

    # 4 Formules
    formules = [
        (C_GREYD,  "ESSENTIEL",     "Les bases de l'entrainement,\nmaintenance incluse.\nIdeal pour demarrer."),
        (C_GOLD,   "OPERATIONNEL",  "Spectre elargi, CQB avance.\nFormule recommandee\npour unites operationnelles."),
        (C_GOLDL,  "PREMIUM",       "Complet, personnalise,\ntoutes options. Solution\nhaute intensite."),
        (C_GREYD,  "MOBILE",        "On vient chez vous\navec l'equipement.\nSessions regulieres sur site."),
    ]

    fw = (CW - 30) / 4
    fh = 138
    f_y = H - 205

    for i, (col_f, nom, desc) in enumerate(formules):
        x = ML + i * (fw + 10)
        c.setFillColor(C_CARD)
        c.roundRect(x, f_y - fh, fw, fh, 3, fill=1, stroke=0)
        # Header carte
        c.setFillColor(col_f)
        c.roundRect(x, f_y - 32, fw, 32, 3, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(C_BG)
        c.drawCentredString(x + fw / 2, f_y - 18, nom)
        if i == 1:  # recommandee
            c.setFont("Helvetica", 7)
            c.setFillColor(C_BG)
            c.drawCentredString(x + fw / 2, f_y - 28, "* RECOMMANDEE")
        # Corps
        mltxt(c, desc, x + 8, f_y - 44, fw - 14, size=8.5, color=C_GREY, lh=13)

    # Inclus dans tous les contrats
    ic_y = H - 368
    c.setFillColor(GOLD_A10)
    c.roundRect(ML, ic_y - 100, CW, 106, 3, fill=1, stroke=0)
    gold_bar(c, ML, ic_y + 6, CW, 2)
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(C_GOLD)
    c.drawString(ML + 14, ic_y - 12, "Inclus dans TOUS les contrats CRBR :")

    inclus = [
        "Installation sur site (zero travaux permanents)",
        "Maintenance preventive et corrective",
        "Mises a jour logicielles et nouveaux scenarios",
        "Consommables (munitions simulees, CO2, etc.)",
        "Support technique reactif — interlocuteur unique",
    ]
    col_ic = (CW - 30) / 2
    for i, inc in enumerate(inclus):
        bx = ML + 14 + (i % 2) * (col_ic + 10)
        by = ic_y - 32 - (i // 2) * 22
        if i == 4:
            bx = ML + 14
        bullet_check(c, bx, by, inc, size=9.5)

    page_footer(c, 10)

# ─── PAGE 11 — CLIENTELE ─────────────────────────────────────────────────────

def page_clients(c):
    fill_bg(c)
    page_header(c, "CLIENTELE",
                "Du niveau local aux unites specialisees.",
                "Tous nos clients.")

    # Intro
    intro_y = H - 100
    mltxt(c, "Police Municipale. Gendarmerie. Police Nationale. Armee. "
             "Securite privee. Administration penitentiaire. Douanes. Forces Speciales.\n"
             "Chacun choisit la formule qui convient a son contexte. "
             "Pas de solution standard — tout est adaptable a votre realite budgetaire et operationnelle.",
          ML, intro_y, CW, size=10.5, color=C_GREY, lh=15)

    gold_rule(c, ML, H - 170, CW, alpha=0.3)

    # Grille 10 unites
    clients = [
        ("PM",  "Police Municipale",         C_GREYD),
        ("GN",  "Gendarmerie Nationale",     HexColor("#2255AA")),
        ("PN",  "Police Nationale",          HexColor("#1133AA")),
        ("AT",  "Armee de Terre",            HexColor("#4A6741")),
        ("MN",  "Marine Nationale",          HexColor("#1A3A6A")),
        ("AA",  "Armee de l'Air & Espace",   HexColor("#2A4A8A")),
        ("SP",  "Securite Privee",           C_GREYD),
        ("AP",  "Admin. Penitentiaire",      HexColor("#6A5022")),
        ("DO",  "Douanes",                   HexColor("#8A6A22")),
        ("FS",  "Forces Specialisees",       HexColor("#3A5A2A")),
    ]

    cw5 = (CW - 40) / 5
    ch_cl = 68
    base_y = H - 192

    for i, (abbr, nom, col_cl) in enumerate(clients):
        col = i % 5
        row = i // 5
        x = ML + col * (cw5 + 10)
        y = base_y - row * (ch_cl + 8)

        c.setFillColor(C_CARD)
        c.roundRect(x, y - ch_cl, cw5, ch_cl, 3, fill=1, stroke=0)
        # Border top couleur unite
        c.setFillColor(col_cl)
        c.roundRect(x, y - 4, cw5, 4, 2, fill=1, stroke=0)
        # Abreviation
        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(col_cl)
        c.drawCentredString(x + cw5 / 2, y - 32, abbr)
        # Nom
        c.setFont("Helvetica", 7.5)
        c.setFillColor(C_GREY)
        lines = simpleSplit(nom, "Helvetica", 7.5, cw5 - 8)
        for j, line in enumerate(lines):
            c.drawCentredString(x + cw5 / 2, y - 48 - j * 10, line)

    # Image de fond subtile
    ir_bg = get_ir("operator-training.jpg")
    if ir_bg:
        msg_y = H - 360
        c.drawImage(ir_bg, ML, msg_y - 90, CW, 90, preserveAspectRatio=False, mask='auto')
        c.setFillColor(BG_A88)
        c.rect(ML, msg_y - 90, CW, 90, fill=1, stroke=0)

    # Message cle
    mk_y = H - 380
    c.setFillColor(GOLD_A10)
    c.roundRect(ML, mk_y - 58, CW, 64, 3, fill=1, stroke=0)
    gold_bar(c, ML, mk_y + 6, CW, 2)
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, mk_y - 20, "Peu importe votre taille, budget, specialite —")
    c.setFont("Helvetica", 12)
    c.setFillColor(C_OFF)
    c.drawCentredString(W / 2, mk_y - 38, "on a une reponse adaptee a votre contexte.")

    # Discours terrain
    dt_y = H - 468
    mltxt(c, "On ne vend pas a tout le monde le meme produit. On construit une solution qui correspond "
             "exactement a votre unite, votre budget annuel, vos contraintes operationnelles. "
             "PM ou forces specialisees — le traitement est le meme : serieux, precis, efficace.",
          ML, dt_y, CW, size=9.5, color=C_GREYD, lh=14)

    page_footer(c, 11)

# ─── PAGE 12 — PROCESSUS DEMARRAGE ───────────────────────────────────────────

def page_demarrer(c):
    fill_bg(c)
    page_header(c, "DEMARRER", "Trois etapes simples. Aucun engagement cache.",
                "Du premier contact au deploiement — sans friction.")

    steps_txt = [
        ("Vous nous contactez",
         "Mail, telephone, formulaire. Pas de RDV commercial force. "
         "Dites-nous simplement votre situation et vos besoins. "
         "On lit, on comprend, on repond — en moins de 48h."),
        ("On echange",
         "Un entretien (pas une presentation commerciale). "
         "On comprend votre contexte reel : unite, effectifs, infrastructure, budget annuel. "
         "On pose des questions operationnelles. On ecoute avant de proposer."),
        ("On vous propose",
         "Devis sur-mesure, adapte a votre realite. "
         "Pas de contrat piege, pas de frais caches, pas de surprise. "
         "Deploiement rapide. Accompagnement complet depuis le premier jour."),
    ]

    step_h = 125
    base_y = H - 100

    for i, (titre, body) in enumerate(steps_txt):
        y = base_y - i * (step_h + 14)

        # Fond carte
        c.setFillColor(C_CARD)
        c.roundRect(ML, y - step_h, CW, step_h, 3, fill=1, stroke=0)
        gold_bar(c, ML, y, CW, 2)

        # Cercle numero
        step_circle(c, ML + 30, y - step_h / 2, i + 1, r=18)

        # Ligne connecteur
        if i < 2:
            conn_y = y - step_h - 7
            c.setStrokeColor(GOLD_A35)
            c.setLineWidth(1.5)
            c.line(ML + 30, conn_y, ML + 30, conn_y - 7)
            c.setFillColor(GOLD_A35)
            # Triangle fleche
            p2 = c.beginPath()
            p2.moveTo(ML + 24, conn_y - 7)
            p2.lineTo(ML + 36, conn_y - 7)
            p2.lineTo(ML + 30, conn_y - 13)
            p2.close()
            c.drawPath(p2, fill=1, stroke=0)

        # Titre
        c.setFont("Helvetica-Bold", 13)
        c.setFillColor(C_WHITE)
        c.drawString(ML + 62, y - 18, titre)
        gold_rule(c, ML + 62, y - 26, CW - 72, alpha=0.25)

        # Corps
        mltxt(c, body, ML + 62, y - 42, CW - 72, size=9.5, color=C_GREY, lh=14)

    # Engagement 48h
    eg_y = H - 510
    c.setFillColor(GOLD_A10)
    c.roundRect(ML, eg_y - 52, CW, 58, 3, fill=1, stroke=0)
    gold_bar(c, ML, eg_y + 6, CW, 2)
    gold_bar(c, ML, eg_y - 46, CW, 2)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, eg_y - 14, "ENGAGEMENT CRBR : REPONSE GARANTIE SOUS 48H OUVEREES")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(C_GREY)
    c.drawCentredString(W / 2, eg_y - 32, "Vous ne serez jamais noye dans un CRM. Une personne, une reponse, un suivi clair.")

    page_footer(c, 12)

# ─── PAGE 13 — CONTACT FINAL ─────────────────────────────────────────────────

def page_contact(c):
    fill_bg(c)
    # Fond atmospherique
    ir_bg = get_ir("contact-briefing.jpg")
    if ir_bg:
        c.drawImage(ir_bg, 0, 0, W, H, preserveAspectRatio=False, mask='auto')
    c.setFillColor(BG_A88)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # Gold top bar + diagonal
    gold_bar(c, 0, H - 5, W, 5)
    diagonal_accent(c, x0=W - 10, y0=H - 8, n=6, alpha=0.22)

    # Logo Cerbere haut centre
    logo_ir = get_ir("logo-cerbere-or-metallique.png")
    if logo_ir:
        lw, lh = 110, 74
        c.drawImage(logo_ir, (W - lw) / 2, H - 80 - lh, lw, lh,
                    preserveAspectRatio=True, mask='auto')

    # Titre
    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(C_WHITE)
    c.drawCentredString(W / 2, H - 175, "Parlons de votre")
    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, H - 205, "entrainement operationnel")
    gold_rule(c, ML + 40, H - 218, CW - 80, alpha=0.4)

    # Infos contact (2x2)
    contacts = [
        ("✉", "EMAIL",     "info@crbr-solution.fr",    "Reponse sous 48h ouverees"),
        ("☎", "TELEPHONE", "06 65 44 52 26",           "Lundi au vendredi, 9h – 18h"),
        ("◎", "REPONSE",   "48h garanties",             "Engagement contractuel"),
        ("◉", "ZONE",      "France & worldwide",        "Metro, outre-mer, sur demande"),
    ]
    cw2 = (CW - 14) / 2
    ch_c = 58
    base_cy = H - 244

    for i, (icon, label_c, val, note) in enumerate(contacts):
        col = i % 2
        row = i // 2
        x = ML + col * (cw2 + 14)
        y = base_cy - row * (ch_c + 8)

        card_bg(c, x, y, cw2, ch_c, border_left=True, radius=3)
        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(C_GOLD)
        c.drawString(x + 14, y - 20, icon)
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(C_GREYD)
        c.drawString(x + 38, y - 14, label_c)
        c.setFont("Helvetica-Bold", 10.5)
        c.setFillColor(C_WHITE)
        c.drawString(x + 38, y - 28, val)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(C_GREYD)
        c.drawString(x + 38, y - 40, note)

    # Boite "Prochaines etapes"
    pe_y = H - 392
    c.setFillColor(GOLD_A10)
    c.roundRect(ML, pe_y - 68, CW, 74, 3, fill=1, stroke=0)
    gold_bar(c, ML, pe_y + 6, CW, 2)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, pe_y - 12, "Prochaines etapes")
    gold_rule(c, ML + 40, pe_y - 20, CW - 80, alpha=0.25)

    next_steps = [
        ("✉", "Envoyez-nous votre situation"),
        ("☎", "Nous repondons sous 48h"),
        ("◎", "Ensemble, on construit votre solution"),
    ]
    nw = (CW - 20) / 3
    for i, (ic, ns_txt) in enumerate(next_steps):
        nx = ML + 10 + i * (nw + 5)
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(C_GOLD)
        c.drawCentredString(nx + nw / 2, pe_y - 38, ic)
        c.setFont("Helvetica", 8)
        c.setFillColor(C_GREY)
        c.drawCentredString(nx + nw / 2, pe_y - 52, ns_txt)

    # QR Code
    qr_size = 140
    qr_x = (W - qr_size) / 2
    qr_y = H - 568
    if os.path.exists(QR_PATH):
        # Fond blanc pour QR
        c.setFillColor(C_WHITE)
        c.roundRect(qr_x - 8, qr_y - 8, qr_size + 16, qr_size + 36, 4, fill=1, stroke=0)
        gold_bar(c, qr_x - 8, qr_y + qr_size + 28, qr_size + 16, 3)
        c.drawImage(ImageReader(QR_PATH), qr_x, qr_y, qr_size, qr_size,
                    preserveAspectRatio=True, mask='auto')
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(C_BG)
        c.drawCentredString(W / 2, qr_y + 11, "www.crbr-solution.fr")

    # Tagline
    tg_y = H - 610
    c.setFont("Helvetica", 10)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, tg_y, "Reseau de professionnels qualifies. Discretion garantie.")

    # Logo discret bas-droit
    if logo_ir:
        c.saveState()
        c.setFillColor(Color(1, 1, 1, alpha=0.12))
        c.drawImage(logo_ir, W - MR - 55, MB + 5, 48, 32, preserveAspectRatio=True, mask='auto')
        c.restoreState()

    gold_bar(c, 0, 0, W, 5)

    # Footer simplifie
    c.setFillColor(C_ACCENT)
    c.rect(0, 5, W, 22, fill=1, stroke=0)
    c.setFont("Helvetica", 7)
    c.setFillColor(C_GREYD)
    c.drawString(ML, 13, "CRBR Solutions — Document confidentiel — 2026")
    c.drawRightString(W - MR, 13, "13 / 13")

# ─── GENERATION PDF ──────────────────────────────────────────────────────────

def generate_pdf():
    print("Generation PDF V2...")
    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("CRBR Solutions — Plaquette Marketing 2026")
    c.setAuthor("CRBR Solutions")
    c.setSubject("Consulting Operationnel — Entrainement Operationnel")
    c.setCreator("CRBR Solutions — 2026")

    pages = [
        ("01 — Couverture",          page_cover),
        ("02 — Constats terrain",    page_freins),
        ("03 — Pourquoi CRBR",       page_pourquoi),
        ("04 — Notre approche",      page_process),
        ("05 — Nos valeurs",         page_valeurs),
        ("06 — Solutions",           page_solutions),
        ("07 — Technologies",        page_equipment),
        ("08 — Shooting House",      page_shooting_house),
        ("09 — Spectre complet",     page_spectre),
        ("10 — Modele economique",   page_budget),
        ("11 — Clientele",           page_clients),
        ("12 — Demarrer",            page_demarrer),
        ("13 — Contact final",       page_contact),
    ]

    for label, fn in pages:
        print(f"  -> Page {label}")
        fn(c)
        c.showPage()

    c.save()
    size = os.path.getsize(OUT) / (1024 * 1024)
    print(f"\n  OK PDF : {OUT}")
    print(f"  Taille : {size:.1f} MB | Pages : {len(pages)}")

# ─── MAIN ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("CRBR Solutions — Plaquette Marketing V2 — 2026")
    print("=" * 60)
    generate_qr()
    generate_pdf()
    print("\nGeneration complete.")
