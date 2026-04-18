"""
CRBR Solutions - Generation Plaquette Marketing 2026
Script Python : QR code + PDF 13 pages via ReportLab
"""

import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import qrcode
import io

# ─── CHEMINS ────────────────────────────────────────────────────────────────
BASE_DIR   = "C:/Users/Baptiste-/CRBR-Solution"
IMG_DIR    = f"{BASE_DIR}/vitrine/img"
MKT_DIR    = f"{BASE_DIR}/marketing"
OUTPUT_PDF = f"{MKT_DIR}/CRBR_Solutions_Plaquette_Marketing_2026.pdf"
QR_PATH    = f"{MKT_DIR}/qr_code_crbr.png"

# ─── CHARTE GRAPHIQUE ───────────────────────────────────────────────────────
C_BG        = HexColor("#111114")   # fond principal
C_BG2       = HexColor("#1a1a1e")   # fond secondaire
C_CARD      = HexColor("#1f1f26")   # cartes
C_GOLD      = HexColor("#C9A84C")   # or principal
C_GOLD_LIGHT= HexColor("#E2C068")   # or clair
C_GOLD_DARK = HexColor("#9C7A2E")   # or foncé
C_WHITE     = HexColor("#F0EFE9")   # blanc chaud
C_GREY      = HexColor("#8A8A96")   # gris
C_GREY_LIGHT= HexColor("#C0C0CA")   # gris clair
C_ACCENT    = HexColor("#2A2A35")   # accent sombre

W, H = A4   # 595.27 x 841.89 pt

def img_path(name):
    return f"{IMG_DIR}/{name}"

def load_img(name):
    p = img_path(name)
    if os.path.exists(p):
        return ImageReader(p)
    return None

# ─── HELPERS CANVAS ─────────────────────────────────────────────────────────

def fill_bg(c, color=None):
    color = color or C_BG
    c.setFillColor(color)
    c.rect(0, 0, W, H, fill=1, stroke=0)

def draw_gold_bar(c, y, height=2, x=0, width=None):
    c.setFillColor(C_GOLD)
    c.rect(x, y, width or W, height, fill=1, stroke=0)

def draw_image_full(c, name, x=0, y=0, w=None, h=None, alpha=0.4):
    ir = load_img(name)
    if ir is None:
        return
    w = w or W
    h = h or H
    c.saveState()
    c.setFillAlpha(alpha)
    c.drawImage(ir, x, y, w, h, preserveAspectRatio=False, mask='auto')
    c.restoreState()

def draw_image_fit(c, name, x, y, w, h, anchor='c'):
    ir = load_img(name)
    if ir is None:
        return
    c.drawImage(ir, x, y, w, h, preserveAspectRatio=True, anchor=anchor, mask='auto')

def overlay(c, color, alpha=0.65, x=0, y=0, w=None, h=None):
    c.saveState()
    c.setFillColor(color)
    c.setFillAlpha(alpha)
    c.rect(x or 0, y or 0, w or W, h or H, fill=1, stroke=0)
    c.restoreState()

def set_font(c, size, bold=False, color=None):
    font = "Helvetica-Bold" if bold else "Helvetica"
    c.setFont(font, size)
    c.setFillColor(color or C_WHITE)

def label(c, text, x, y, size=10, bold=False, color=None, align="left"):
    set_font(c, size, bold=bold, color=color or C_WHITE)
    if align == "center":
        c.drawCentredString(x, y, text)
    elif align == "right":
        c.drawRightString(x, y, text)
    else:
        c.drawString(x, y, text)

def multiline(c, text, x, y, width, size=10, bold=False, color=None, line_height=None):
    from reportlab.lib.utils import simpleSplit
    color = color or C_WHITE
    lh = line_height or size * 1.5
    font = "Helvetica-Bold" if bold else "Helvetica"
    c.setFont(font, size)
    c.setFillColor(color)
    lines = simpleSplit(text, font, size, width)
    for i, line in enumerate(lines):
        c.drawString(x, y - i * lh, line)
    return y - len(lines) * lh

def gold_rule(c, x, y, w):
    c.setStrokeColor(C_GOLD)
    c.setLineWidth(1)
    c.line(x, y, x + w, y)

def page_footer(c, page_num):
    c.saveState()
    c.setFillColor(C_ACCENT)
    c.rect(0, 0, W, 22, fill=1, stroke=0)
    gold_rule(c, 0, 22, W)
    set_font(c, 7, color=C_GREY)
    c.drawString(20, 8, "CRBR Solutions — Consulting Opérationnel — Confidentiel")
    c.drawRightString(W - 20, 8, f"www.crbr-solution.fr     {page_num} / 13")
    c.restoreState()

def section_tag(c, text, x, y):
    c.saveState()
    c.setFillColor(C_GOLD)
    c.rect(x, y - 2, len(text) * 5.5 + 16, 18, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(C_BG)
    c.drawString(x + 8, y + 3, text.upper())
    c.restoreState()

def value_card(c, x, y, w, h, icon, title, body, body_size=9):
    c.saveState()
    c.setFillColor(C_CARD)
    c.roundRect(x, y, w, h, 4, fill=1, stroke=0)
    # gold left border
    c.setFillColor(C_GOLD)
    c.rect(x, y, 3, h, fill=1, stroke=0)
    # icon
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(C_GOLD)
    c.drawString(x + 12, y + h - 28, icon)
    # title
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(C_WHITE)
    c.drawString(x + 12, y + h - 44, title)
    # body
    from reportlab.lib.utils import simpleSplit
    c.setFont("Helvetica", body_size)
    c.setFillColor(C_GREY_LIGHT)
    lines = simpleSplit(body, "Helvetica", body_size, w - 20)
    for i, line in enumerate(lines):
        c.drawString(x + 12, y + h - 62 - i * (body_size * 1.4), line)
    c.restoreState()

def step_block(c, x, y, w, num, title, body):
    c.saveState()
    # circle numéro
    cx, cy = x + 24, y + 14
    c.setFillColor(C_GOLD)
    c.circle(cx, cy, 16, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(C_BG)
    c.drawCentredString(cx, cy - 5, str(num))
    # titre
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(C_WHITE)
    c.drawString(x + 50, y + 18, title)
    # body
    from reportlab.lib.utils import simpleSplit
    c.setFont("Helvetica", 9.5)
    c.setFillColor(C_GREY_LIGHT)
    lines = simpleSplit(body, "Helvetica", 9.5, w - 60)
    for i, line in enumerate(lines):
        c.drawString(x + 50, y + 2 - i * 14, line)
    c.restoreState()

# ─── GÉNÉRATION QR CODE ─────────────────────────────────────────────────────

def generate_qr():
    print("Génération QR code...")
    qr = qrcode.QRCode(
        version=2,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=3,
    )
    qr.add_data("https://www.crbr-solution.fr/")
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#111114", back_color="white").convert("RGBA")

    # Intégrer le logo Cerbère au centre
    logo_path = img_path("logo-cerbere-or-metallique.png")
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        qr_size = qr_img.size[0]
        logo_size = int(qr_size * 0.22)
        logo = logo.resize((logo_size, logo_size), Image.LANCZOS)
        # fond blanc autour du logo
        bg = Image.new("RGBA", (logo_size + 10, logo_size + 10), (255, 255, 255, 255))
        bg.paste(logo, (5, 5), logo)
        pos = ((qr_size - bg.size[0]) // 2, (qr_size - bg.size[1]) // 2)
        qr_img.paste(bg, pos, bg)

    qr_img.save(QR_PATH)
    print(f"  ✓ QR code sauvegardé : {QR_PATH}")

# ─── PAGE 1 : COUVERTURE ────────────────────────────────────────────────────

def page_cover(c):
    fill_bg(c)
    # Image de fond (hero-simulator)
    ir = load_img("hero-simulator.jpg")
    if ir:
        c.saveState()
        c.setFillAlpha(0.25)
        c.drawImage(ir, 0, 0, W, H, preserveAspectRatio=False, mask='auto')
        c.restoreState()
    # Overlay gradient sombre
    overlay(c, C_BG, alpha=0.70)

    # Bandeau doré haut
    c.setFillColor(C_GOLD)
    c.rect(0, H - 5, W, 5, fill=1, stroke=0)

    # Logo Cerbère (grand, centré, haut)
    logo_ir = load_img("logo-cerbere-or-metallique.png")
    if logo_ir:
        logo_w = 200
        logo_h = 134
        c.drawImage(logo_ir, (W - logo_w) / 2, H - 80 - logo_h, logo_w, logo_h,
                    preserveAspectRatio=True, mask='auto')

    # Ligne décorative
    gold_rule(c, H - 240, 80, (W - 80))

    # Titre principal
    c.setFont("Helvetica-Bold", 42)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, H - 280, "CRBR SOLUTIONS")

    # Sous-titre
    c.setFont("Helvetica", 16)
    c.setFillColor(C_GREY_LIGHT)
    c.drawCentredString(W / 2, H - 308, "Consulting Opérationnel")

    # Ligne déco
    gold_rule(c, H - 320, 80, W - 80)

    # Accroche
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(C_WHITE)
    c.drawCentredString(W / 2, H - 360, "L'entraînement opérationnel,")
    c.setFont("Helvetica", 15)
    c.setFillColor(C_GOLD_LIGHT)
    c.drawCentredString(W / 2, H - 380, "enfin à portée de votre unité.")

    # Image shooting house en bas (illustrative)
    sh_ir = load_img("shooting-house.jpg")
    if sh_ir:
        c.saveState()
        c.setFillAlpha(0.15)
        c.drawImage(sh_ir, 0, 0, W, H * 0.45, preserveAspectRatio=False, mask='auto')
        c.restoreState()

    # Overlay bas
    overlay(c, C_BG, alpha=0.75, y=0, h=H * 0.45)

    # Tagline bas
    c.setFont("Helvetica", 10)
    c.setFillColor(C_GREY)
    c.drawCentredString(W / 2, 120, "Systèmes de tir avancés  •  Structures d'entraînement  •  Armement dédié  •  Équipements opérationnels")

    gold_rule(c, 110, 60, W - 60)

    # Infos contact bas
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, 90, "info@crbr-solution.fr")
    c.setFont("Helvetica", 8)
    c.setFillColor(C_GREY)
    c.drawCentredString(W / 2, 76, "06 65 44 52 26  •  www.crbr-solution.fr")
    c.drawCentredString(W / 2, 62, "France métropolitaine, outre-mer, worldwide")

    # Bandeau bas doré
    c.setFillColor(C_GOLD)
    c.rect(0, 0, W, 4, fill=1, stroke=0)

    # Pas de footer numéro sur la couverture

# ─── PAGE 2-3 : LES FREINS ──────────────────────────────────────────────────

def page_freins(c):
    fill_bg(c, C_BG2)
    # Fond image très atténuée
    draw_image_full(c, "problem-training-gap.jpg", alpha=0.08)
    overlay(c, C_BG2, alpha=0.88)

    # Header
    c.setFillColor(C_ACCENT)
    c.rect(0, H - 80, W, 80, fill=1, stroke=0)
    gold_rule(c, H - 80, 0, W)

    section_tag(c, "CONSTATS TERRAIN", 20, H - 35)
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(C_WHITE)
    c.drawString(20, H - 66, "CRBR résout les freins à l'entraînement")

    # Texte narratif
    corps = (
        "L'entraînement régulier, c'est la base. Mais sur le terrain ?\n\n"
        "Distance des centres d'entraînement. Créneaux quasi-inexistants. "
        "Budgets de munitions qui explosent. Effectifs impossibles à libérer. "
        "Infrastructure inadaptée ou inexistante.\n\n"
        "Résultat : L'entraînement devient sporadique. Les compétences s'érodent. "
        "Le stress opérationnel augmente.\n\n"
        "On ne refait pas le système. On apporte l'entraînement chez vous. "
        "Disponible quand vous en avez besoin. Sans logistique complexe. "
        "Sans coûts qui explosent. Adapté à votre réalité."
    )
    y = H - 110
    from reportlab.lib.utils import simpleSplit
    c.setFont("Helvetica", 10.5)
    c.setFillColor(C_GREY_LIGHT)
    for line in corps.split('\n'):
        if line.strip() == "":
            y -= 8
        else:
            parts = simpleSplit(line, "Helvetica", 10.5, W - 40)
            for p in parts:
                c.drawString(20, y, p)
                y -= 15

    # 4 cartes freins
    freins = [
        ("problem-training-gap.jpg", "DISTANCE", "Les centres d'entraînement\nsont trop loin. La logistique\ncoûte autant que la formation."),
        ("contact-briefing.jpg", "CRÉNEAUX", "Les plages disponibles sont\nrares, imposées, rarement\ncompatibles avec vos opérations."),
        ("airsoft-equipment.jpg", "BUDGET MUNITIONS", "Chaque séance de tir réel\ncoûte cher. Impossible de\nmultiplier les entraînements."),
        ("operator-training.jpg", "EFFECTIFS", "Libérer du personnel\npour l'entraînement reste\nun défi permanent."),
    ]

    card_w = (W - 50) / 4
    card_h = 200
    base_y = 35

    for i, (img_name, titre, body) in enumerate(freins):
        cx = 20 + i * (card_w + 3)
        cy = base_y + 22

        # Carte de fond
        ir = load_img(img_name)
        c.saveState()
        c.setFillColor(C_CARD)
        c.roundRect(cx, cy, card_w - 3, card_h, 4, fill=1, stroke=0)
        if ir:
            c.setFillAlpha(0.30)
            c.drawImage(ir, cx, cy, card_w - 3, card_h,
                        preserveAspectRatio=False, mask='auto')
        c.setFillAlpha(0.65)
        c.setFillColor(C_CARD)
        c.roundRect(cx, cy, card_w - 3, card_h, 4, fill=1, stroke=0)
        c.restoreState()

        # Numéro
        c.setFont("Helvetica-Bold", 32)
        c.setFillColor(C_GOLD)
        c.setFillAlpha(0.18)
        c.drawString(cx + 8, cy + card_h - 44, str(i + 1))
        c.setFillAlpha(1)

        # Ligne dorée
        c.setFillColor(C_GOLD)
        c.rect(cx, cy + card_h - 4, card_w - 3, 4, fill=1, stroke=0)

        # Titre
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(C_GOLD_LIGHT)
        c.drawString(cx + 8, cy + card_h - 22, titre)

        # Corps
        from reportlab.lib.utils import simpleSplit
        c.setFont("Helvetica", 8.5)
        c.setFillColor(C_GREY_LIGHT)
        lines = simpleSplit(body, "Helvetica", 8.5, card_w - 18)
        for j, line in enumerate(lines):
            c.drawString(cx + 8, cy + card_h - 38 - j * 12, line)

    page_footer(c, 2)

# ─── PAGE 4 : COMMENT ON FONCTIONNE ─────────────────────────────────────────

def page_process(c):
    fill_bg(c)

    # Header
    c.setFillColor(C_ACCENT)
    c.rect(0, H - 75, W, 75, fill=1, stroke=0)
    gold_rule(c, H - 75, 0, W)
    section_tag(c, "NOTRE APPROCHE", 20, H - 30)
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(C_WHITE)
    c.drawString(20, H - 62, "Trois étapes. Une solution intégrée.")

    # Images illustratives (3 colonnes)
    steps_imgs = ["contact-briefing.jpg", "custom-analysis.jpg", "maintenance-support.jpg"]
    steps_titles = [
        "On comprend votre contexte",
        "On conçoit votre solution",
        "On la met en place",
    ]
    steps_bodies = [
        "Vos missions. Vos menaces. Vos effectifs. Ce que vous avez déjà. "
        "Pas de grille standard — on écoute avant de proposer.",
        "Pas de catalogue imposé. On assemble ce qui répond à vos besoins réels, "
        "dans votre budget, avec vos contraintes terrain.",
        "Installation chez vous. Formation. Support permanent inclus. "
        "On reste partenaire, on ne livre pas et on part.",
    ]

    col_w = (W - 50) / 3
    img_h = 180
    base_img_y = H - 270

    for i, (img_name, titre, body) in enumerate(zip(steps_imgs, steps_titles, steps_bodies)):
        x = 20 + i * (col_w + 5)
        ir = load_img(img_name)

        # Image
        c.saveState()
        c.setFillColor(C_CARD)
        c.roundRect(x, base_img_y, col_w, img_h, 4, fill=1, stroke=0)
        if ir:
            c.setFillAlpha(0.85)
            c.drawImage(ir, x, base_img_y, col_w, img_h,
                        preserveAspectRatio=False, mask='auto')
        c.restoreState()

        # Bandeau doré bas de l'image
        c.setFillColor(C_GOLD)
        c.rect(x, base_img_y, col_w, 3, fill=1, stroke=0)

        # Numéro cercle
        c.setFillColor(C_GOLD)
        c.circle(x + col_w / 2, base_img_y + img_h - 20, 18, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(C_BG)
        c.drawCentredString(x + col_w / 2, base_img_y + img_h - 25, str(i + 1))

        # Titre
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(C_WHITE)
        c.drawCentredString(x + col_w / 2, base_img_y - 20, titre)

        # Corps
        from reportlab.lib.utils import simpleSplit
        c.setFont("Helvetica", 9)
        c.setFillColor(C_GREY_LIGHT)
        lines = simpleSplit(body, "Helvetica", 9, col_w - 10)
        for j, line in enumerate(lines):
            c.drawString(x + 5, base_img_y - 36 - j * 13, line)

    # Timeline visuelle centrale
    y_tl = H - 290
    c.setStrokeColor(C_GOLD_DARK)
    c.setLineWidth(2)
    c.setDash([6, 4])
    c.line(55, y_tl + img_h / 2, W - 55, y_tl + img_h / 2)
    c.setDash([])

    # Bloc "Inclus dans chaque étape"
    iy = 60
    c.setFillColor(C_CARD)
    c.roundRect(20, iy, W - 40, 95, 4, fill=1, stroke=0)
    gold_rule(c, iy + 95, 20, W - 40)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(C_GOLD)
    c.drawString(35, iy + 75, "Ce qui ne change jamais")

    inclus = [
        "Interlocuteur unique, disponible",
        "Délais respectés",
        "Adaptation en cours de contrat si vos besoins évoluent",
        "Aucun engagement caché — tout est contractualisé au départ",
    ]
    c.setFont("Helvetica", 9.5)
    c.setFillColor(C_GREY_LIGHT)
    for i, txt in enumerate(inclus):
        bx = 35 + (i % 2) * (W / 2 - 30)
        by = iy + 55 - (i // 2) * 18
        c.setFillColor(C_GOLD)
        c.circle(bx, by + 3, 3, fill=1, stroke=0)
        c.setFillColor(C_GREY_LIGHT)
        c.drawString(bx + 8, by, txt)

    page_footer(c, 4)

# ─── PAGE 5 : VALEURS ───────────────────────────────────────────────────────

def page_values(c):
    fill_bg(c)
    ir = load_img("operator-training.jpg")
    if ir:
        c.saveState()
        c.setFillAlpha(0.12)
        c.drawImage(ir, 0, H // 2 - 100, W, H // 2 + 100, preserveAspectRatio=False, mask='auto')
        c.restoreState()
        overlay(c, C_BG, alpha=0.82, y=H // 2 - 100, h=H // 2 + 100)

    # Header
    c.setFillColor(C_ACCENT)
    c.rect(0, H - 75, W, 75, fill=1, stroke=0)
    gold_rule(c, H - 75, 0, W)
    section_tag(c, "IDENTITÉ", 20, H - 30)
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(C_WHITE)
    c.drawString(20, H - 62, "Ce qui guide chaque décision")

    valeurs = [
        ("⬡", "Précision",    "Chaque solution répond à un besoin précis, dans un contexte précis. Pas de réponse générique."),
        ("⬡", "Progression",  "Amélioration durable, pas événementielle. Vos compétences progressent sur le long terme."),
        ("⬡", "Fiabilité",    "Ça fonctionne quand vous en avez besoin. Maintenance incluse, réactivité garantie."),
        ("⬡", "Pragmatisme",  "On intègre vos contraintes réelles : budgets, procédures marchés publics, infrastructure."),
        ("⬡", "Engagement",   "Partenaire opérationnel sur la durée. Pas un fournisseur qui disparaît après la livraison."),
        ("⬡", "Discrétion",   "Environnements sensibles. Protocoles respectés. Confidentialité par défaut."),
    ]

    col_w = (W - 50) / 3
    card_h = 130
    margin_top = H - 110

    for i, (icon, titre, body) in enumerate(valeurs):
        row, col = divmod(i, 3)
        x = 20 + col * (col_w + 5)
        y = margin_top - row * (card_h + 8)

        c.setFillColor(C_CARD)
        c.roundRect(x, y - card_h, col_w, card_h, 4, fill=1, stroke=0)
        c.setFillColor(C_GOLD)
        c.rect(x, y - card_h, 3, card_h, fill=1, stroke=0)

        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(C_GOLD)
        c.drawString(x + 12, y - 20, titre.upper())
        gold_rule(c, y - 26, x + 12, col_w - 20)

        from reportlab.lib.utils import simpleSplit
        c.setFont("Helvetica", 9)
        c.setFillColor(C_GREY_LIGHT)
        lines = simpleSplit(body, "Helvetica", 9, col_w - 22)
        for j, line in enumerate(lines):
            c.drawString(x + 12, y - 40 - j * 13, line)

    # Logo discret bas
    logo_ir = load_img("logo-cerbere-or-metallique.png")
    if logo_ir:
        c.saveState()
        c.setFillAlpha(0.15)
        c.drawImage(logo_ir, W - 90, 30, 65, 44, preserveAspectRatio=True, mask='auto')
        c.restoreState()

    page_footer(c, 5)

# ─── PAGE 6-7 : SOLUTIONS ────────────────────────────────────────────────────

def page_solutions(c):
    fill_bg(c)

    # Header
    c.setFillColor(C_ACCENT)
    c.rect(0, H - 75, W, 75, fill=1, stroke=0)
    gold_rule(c, H - 75, 0, W)
    section_tag(c, "OFFRE", 20, H - 30)
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(C_WHITE)
    c.drawString(20, H - 62, "Une réponse adaptée à vos besoins opérationnels")

    # 4 domaines (layout 2x2)
    domaines = [
        ("solution-simulator-room.jpg", "SYSTÈMES DE TIR AVANCÉS",
         "Simulation laser haute-fidélité. Travail technique et décisionnel "
         "sans contrainte de munitions réelles. Scénarios réalistes, "
         "analyse de performance en temps réel."),
        ("airsoft-equipment.jpg", "ARMEMENT DÉDIÉ À L'ENTRAÎNEMENT",
         "Réalisme complet de maniement et gestuelle. Sécurité totale. "
         "Compatibilité avec vos protocoles existants. "
         "Conçu pour un usage intensif en conditions réelles."),
        ("breach-door.jpg", "STRUCTURES D'ENTRAÎNEMENT DYNAMIQUE",
         "Escalade, rappel, corde lisse, CQB, progression tactique. "
         "Reconfigurable selon vos scénarios. Montage/démontage rapide. "
         "Transportable, sans travaux."),
        ("operator-training.jpg", "ÉQUIPEMENTS OPÉRATIONNELS COMPLÉMENTAIRES",
         "Outils d'effraction, équipement tactique, pyrotechnie "
         "d'entraînement, protection. Tout ce qui complète votre "
         "dispositif de formation opérationnel."),
    ]

    card_w = (W - 50) / 2
    card_h = 230
    base_y = H - 340

    for i, (img_name, titre, body) in enumerate(domaines):
        col = i % 2
        row = i // 2
        x = 20 + col * (card_w + 10)
        y = base_y - row * (card_h + 8)

        ir = load_img(img_name)

        # Image fond
        c.saveState()
        c.setFillColor(C_CARD)
        c.roundRect(x, y - card_h, card_w, card_h, 4, fill=1, stroke=0)
        if ir:
            c.setFillAlpha(0.35)
            c.drawImage(ir, x, y - card_h, card_w, card_h,
                        preserveAspectRatio=False, mask='auto')
        c.restoreState()

        # Overlay sombre sur l'image
        overlay(c, C_BG2, alpha=0.72, x=x, y=y - card_h, w=card_w, h=card_h)
        c.roundRect(x, y - card_h, card_w, card_h, 4, fill=0, stroke=0)

        # Bandeau titre doré
        c.setFillColor(C_GOLD)
        c.rect(x, y - 3, card_w, 3, fill=1, stroke=0)
        c.setFillColor(HexColor("#1a1510"))
        c.roundRect(x, y - 28, card_w, 25, 0, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 9.5)
        c.setFillColor(C_GOLD_LIGHT)
        c.drawString(x + 10, y - 20, titre)

        # Corps
        from reportlab.lib.utils import simpleSplit
        c.setFont("Helvetica", 9)
        c.setFillColor(C_GREY_LIGHT)
        lines = simpleSplit(body, "Helvetica", 9, card_w - 20)
        for j, line in enumerate(lines[:6]):
            c.drawString(x + 10, y - 45 - j * 13, line)

    # Phrase clé bas
    ky = 55
    c.setFillColor(C_CARD)
    c.roundRect(20, ky, W - 40, 30, 4, fill=1, stroke=0)
    gold_rule(c, ky + 30, 20, W - 40)
    gold_rule(c, ky, 20, W - 40)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, ky + 10, "Tout ça fonctionne ensemble. Une solution intégrée. Un seul interlocuteur.")

    page_footer(c, 6)

# ─── PAGE 7 : ÉQUIPEMENTS DÉTAIL ─────────────────────────────────────────────

def page_equipment_detail(c):
    fill_bg(c)
    ir_bg = load_img("solution-simulator-room.jpg")
    if ir_bg:
        c.saveState()
        c.setFillAlpha(0.10)
        c.drawImage(ir_bg, 0, 0, W, H, preserveAspectRatio=False, mask='auto')
        c.restoreState()
        overlay(c, C_BG, alpha=0.88)

    # Header
    c.setFillColor(C_ACCENT)
    c.rect(0, H - 75, W, 75, fill=1, stroke=0)
    gold_rule(c, H - 75, 0, W)
    section_tag(c, "TECHNOLOGIES", 20, H - 30)
    c.setFont("Helvetica-Bold", 21)
    c.setFillColor(C_WHITE)
    c.drawString(20, H - 62, "Les technologies qui font la différence")

    # Systèmes de tir — détail
    c.setFillColor(C_CARD)
    c.roundRect(20, H - 260, W - 40, 165, 4, fill=1, stroke=0)
    c.setFillColor(C_GOLD)
    c.rect(20, H - 260, 4, 165, fill=1, stroke=0)

    ir_sim = load_img("solution-simulator-room.jpg")
    if ir_sim:
        c.saveState()
        c.setFillAlpha(0.40)
        c.drawImage(ir_sim, W - 220, H - 258, 198, 161, preserveAspectRatio=False, mask='auto')
        c.setFillAlpha(0.70)
        c.setFillColor(C_CARD)
        c.rect(W - 220, H - 258, 198, 161, fill=1, stroke=0)
        c.restoreState()

    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(C_GOLD_LIGHT)
    c.drawString(35, H - 105, "Simulation laser haute-fidelite")
    gold_rule(c, H - 112, 35, W - 280)

    items_sim = [
        "Retour balistique realiste (recul, son, chaleur)",
        "Analyse comportementale en temps reel",
        "Scenarios personnalises (hostiles, neutres, civils)",
        "Compatible armes reelles modifiees — aucune munition",
        "Debriefing video integre par tireur",
        "Multi-postes : jusqu'a 8 tireurs simultanement",
    ]
    c.setFont("Helvetica", 9)
    c.setFillColor(C_GREY_LIGHT)
    for i, item in enumerate(items_sim):
        col = i % 2
        row = i // 2
        bx = 35 + col * ((W - 280) / 2)
        by = H - 128 - row * 18
        c.setFillColor(C_GOLD)
        c.circle(bx, by + 4, 2.5, fill=1, stroke=0)
        c.setFillColor(C_GREY_LIGHT)
        c.drawString(bx + 7, by, item)

    # 3 blocs technos en bas
    techs = [
        ("breach-door.jpg", "EFFRACTION & ACCES",
         ["Battering rams professionnels",
          "Outils coupe-verrou hydrauliques",
          "Portes d'entree reconfigurables",
          "Scenarios multiples (interne/externe)"]),
        ("airsoft-equipment.jpg", "ARMEMENT DEDIE",
         ["Repliques certifiees realisme total",
          "Recoil electrique/gaz haute fidelite",
          "Entretien et pieces inclus",
          "Gamme complete (pistolet, carbine, SMG)"]),
        ("programme-mobile.jpg", "DEPLOIEMENT MOBILE",
         ["Remorque equipee tout-terrain",
          "Autonome en energie (generateur)",
          "Installation en moins de 2h",
          "Tout le materiel pour une session complete"]),
    ]

    tw = (W - 50) / 3
    th = 200
    ty = H - 510

    for i, (img, titre, items) in enumerate(techs):
        x = 20 + i * (tw + 5)

        ir = load_img(img)
        c.saveState()
        c.setFillColor(C_CARD)
        c.roundRect(x, ty - th, tw, th, 3, fill=1, stroke=0)
        if ir:
            c.setFillAlpha(0.30)
            c.drawImage(ir, x, ty - 60, tw, 60, preserveAspectRatio=False, mask='auto')
        c.setFillAlpha(0.80)
        c.setFillColor(C_CARD)
        c.roundRect(x, ty - th, tw, th, 3, fill=1, stroke=0)
        c.restoreState()

        c.setFillColor(C_GOLD)
        c.rect(x, ty - 4, tw, 4, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(C_GOLD_LIGHT)
        c.drawCentredString(x + tw / 2, ty - 18, titre)
        gold_rule(c, ty - 24, x + 8, tw - 16)

        c.setFont("Helvetica", 8.5)
        c.setFillColor(C_GREY_LIGHT)
        for j, item in enumerate(items):
            c.setFillColor(C_GOLD_DARK)
            c.circle(x + 12, ty - 36 - j * 16 + 4, 2, fill=1, stroke=0)
            c.setFillColor(C_GREY_LIGHT)
            c.drawString(x + 18, ty - 36 - j * 16, item)

    # Note intégration
    ny = 62
    c.setFillColor(C_CARD)
    c.roundRect(20, ny, W - 40, 30, 4, fill=1, stroke=0)
    gold_rule(c, ny + 30, 20, W - 40)
    c.setFont("Helvetica", 9.5)
    c.setFillColor(C_GOLD)
    c.drawString(35, ny + 18, "Integration complete :")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(C_GREY_LIGHT)
    c.drawString(140, ny + 18,
        "Tous les equipements sont selectionnes pour fonctionner ensemble. "
        "Un ecosysteme coherent, pas une somme de produits.")

    page_footer(c, 7)


# ─── PAGE 8 : SHOOTING HOUSE ─────────────────────────────────────────────────

def page_shooting_house(c):
    fill_bg(c)

    # Header
    c.setFillColor(C_ACCENT)
    c.rect(0, H - 80, W, 80, fill=1, stroke=0)
    gold_rule(c, H - 80, 0, W)
    section_tag(c, "STRUCTURE PHARE", 20, H - 30)
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(C_WHITE)
    c.drawString(20, H - 58, "La structure d'entraînement modulaire")
    c.setFont("Helvetica", 10)
    c.setFillColor(C_GREY)
    c.drawString(20, H - 72, "Scalable. Reconfigurable. Prête à l'usage.")

    # 3 cartes shooting house
    niveaux = [
        ("shooting_house_1.png", "BASIC", "40 m²",
         "Progression simple\nCQB basique\nIdéal : introduction, révision des fondamentaux",
         C_GOLD_DARK),
        ("shooting_house_2.png", "PRO", "70 – 85 m²",
         "Scénarios complexes\nZones multiples\nIdéal : unités opérationnelles régulières",
         C_GOLD),
        ("shooting_house_3.png", "PREMIUM", "110 – 120 m²",
         "Haute complexité\nSituations avancées\nIdéal : unités spécialisées, exercices majeurs",
         C_GOLD_LIGHT),
    ]

    card_w = (W - 50) / 3
    img_h = 200
    base_y = H - 310

    for i, (img_name, niveau, surface, desc, color) in enumerate(niveaux):
        x = 20 + i * (card_w + 5)

        # Bandeau niveau
        c.setFillColor(color)
        c.roundRect(x, base_y, card_w, 22, 2, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(C_BG)
        c.drawCentredString(x + card_w / 2, base_y + 7, f"NIVEAU {niveau}")

        # Image
        ir = load_img(img_name)
        if ir:
            c.drawImage(ir, x, base_y - img_h, card_w, img_h,
                        preserveAspectRatio=False, mask='auto')
        else:
            c.setFillColor(C_CARD)
            c.rect(x, base_y - img_h, card_w, img_h, fill=1, stroke=0)

        # Info surface
        c.setFillColor(color)
        c.rect(x, base_y - img_h - 25, card_w, 25, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 13)
        c.setFillColor(C_BG)
        c.drawCentredString(x + card_w / 2, base_y - img_h - 18, surface)

        # Description
        from reportlab.lib.utils import simpleSplit
        c.setFont("Helvetica", 8.5)
        c.setFillColor(C_GREY_LIGHT)
        for j, line in enumerate(desc.split('\n')):
            if line.startswith("Idéal"):
                c.setFont("Helvetica", 8)
                c.setFillColor(color)
            c.drawString(x + 8, base_y - img_h - 45 - j * 13, line)
            c.setFont("Helvetica", 8.5)
            c.setFillColor(C_GREY_LIGHT)

    # Avantages communs
    ay = H - 570
    c.setFillColor(C_CARD)
    c.roundRect(20, ay - 80, W - 40, 90, 4, fill=1, stroke=0)
    gold_rule(c, ay + 10, 20, W - 40)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(C_GOLD)
    c.drawString(35, ay - 6, "Avantages communs à tous les niveaux")

    avantages = [
        "✓ Montage / démontage rapide (aucun travaux)",
        "✓ Transportable (roues intégrées)",
        "✓ Reconfigurable à volonté (infinité de scénarios)",
        "✓ Compatible avec tous systèmes d'entraînement CRBR",
    ]
    c.setFont("Helvetica", 9.5)
    c.setFillColor(C_WHITE)
    for i, av in enumerate(avantages):
        col = i % 2
        row = i // 2
        bx = 35 + col * (W / 2 - 20)
        by = ay - 28 - row * 20
        c.setFillColor(C_GOLD)
        c.drawString(bx, by, av[:1])
        c.setFillColor(C_GREY_LIGHT)
        c.drawString(bx + 8, by, av[1:])

    page_footer(c, 8)

# ─── PAGE 9 : MULTI-DOMAINES ─────────────────────────────────────────────────

def page_multidomaines(c):
    fill_bg(c)
    ir = load_img("hero-simulator.jpg")
    if ir:
        c.saveState()
        c.setFillAlpha(0.15)
        c.drawImage(ir, 0, 0, W, H, preserveAspectRatio=False, mask='auto')
        c.restoreState()
        overlay(c, C_BG, alpha=0.82)

    # Header
    c.setFillColor(C_ACCENT)
    c.rect(0, H - 80, W, 80, fill=1, stroke=0)
    gold_rule(c, H - 80, 0, W)
    section_tag(c, "SPECTRE COMPLET", 20, H - 30)
    c.setFont("Helvetica-Bold", 19)
    c.setFillColor(C_WHITE)
    c.drawString(20, H - 56, "Au-delà du tir. L'entraînement opérationnel complet.")
    c.setFont("Helvetica", 10)
    c.setFillColor(C_GREY)
    c.drawString(20, H - 70, "Votre entraînement ne se limite pas au tir. On couvre le spectre complet de vos besoins opérationnels.")

    # Images 2x3
    imgs_grid = [
        ("breach-door.jpg",         "CQB & PROGRESSION",       "Entraînement dynamique en espace confiné.\nTechniques d'entrée et de progression."),
        ("airsoft-equipment.jpg",   "ÉQUIPEMENT TACTIQUE",     "Armement dédié, protection, outillage.\nTout pour l'entraînement réel."),
        ("programme-mobile.jpg",    "DÉPLOIEMENT MOBILE",      "On vient chez vous avec l'équipement.\nSessions régulières sur votre site."),
        ("maintenance-support.jpg", "MAINTENANCE & SUPPORT",   "Équipe technique réactive.\nMaintenance préventive et corrective."),
        ("shooting-house.jpg",      "PYROTECHNIE D'ENTRAÎN.", "Charges d'effraction, fumigènes,\npyrotechnie dédiée à la formation."),
        ("operator-training.jpg",   "MULTI-DOMAINES",          "Terre, air, eau. Spécialisé\nou généraliste — on s'adapte."),
    ]

    cell_w = (W - 50) / 3
    cell_h = 160
    base_y = H - 320

    for i, (img_name, titre, desc) in enumerate(imgs_grid):
        col = i % 3
        row = i // 3
        x = 20 + col * (cell_w + 5)
        y = base_y - row * (cell_h + 5)

        ir = load_img(img_name)
        c.saveState()
        c.setFillColor(C_CARD)
        c.roundRect(x, y - cell_h, cell_w, cell_h, 3, fill=1, stroke=0)
        if ir:
            c.setFillAlpha(0.55)
            c.drawImage(ir, x, y - cell_h, cell_w, cell_h,
                        preserveAspectRatio=False, mask='auto')
        c.restoreState()

        overlay(c, C_BG, alpha=0.55, x=x, y=y - cell_h, w=cell_w, h=cell_h)

        # Titre sur fond doré
        c.setFillColor(C_GOLD)
        c.rect(x, y - 22, cell_w, 22, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(C_BG)
        c.drawCentredString(x + cell_w / 2, y - 14, titre)

        # Description
        from reportlab.lib.utils import simpleSplit
        c.setFont("Helvetica", 8)
        c.setFillColor(C_GREY_LIGHT)
        lines = simpleSplit(desc, "Helvetica", 8, cell_w - 12)
        for j, line in enumerate(lines):
            c.drawString(x + 6, y - 36 - j * 12, line)

    page_footer(c, 9)

# ─── PAGE 10 : BUDGET & FORMULES ─────────────────────────────────────────────

def page_budget(c):
    fill_bg(c, C_BG2)

    # Header
    c.setFillColor(C_ACCENT)
    c.rect(0, H - 80, W, 80, fill=1, stroke=0)
    gold_rule(c, H - 80, 0, W)
    section_tag(c, "MODÈLE ÉCONOMIQUE", 20, H - 30)
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(C_WHITE)
    c.drawString(20, H - 62, "Enfin une solution qui s'adapte à vos réalités budgétaires")

    # Problème vs solution
    pv_y = H - 130
    c.setFillColor(HexColor("#2a1a1a"))
    c.roundRect(20, pv_y - 60, (W - 50) / 2, 70, 4, fill=1, stroke=0)
    c.setFillColor(HexColor("#d32f2f"))
    c.rect(20, pv_y - 60, 3, 70, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(HexColor("#ff6b6b"))
    c.drawString(30, pv_y - 10, "PROBLÈME HABITUEL")
    c.setFont("Helvetica", 8.5)
    c.setFillColor(C_GREY_LIGHT)
    c.drawString(30, pv_y - 25, "Achat unique à 150 000 – 300 000€.")
    c.drawString(30, pv_y - 39, "Budget annuel bloqué. Procédures marchés")
    c.drawString(30, pv_y - 53, "publics incompatibles. Maintenance en sus.")

    sx = 20 + (W - 50) / 2 + 15
    c.setFillColor(HexColor("#1a2a1a"))
    c.roundRect(sx, pv_y - 60, (W - 50) / 2, 70, 4, fill=1, stroke=0)
    c.setFillColor(C_GOLD)
    c.rect(sx, pv_y - 60, 3, 70, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(C_GOLD_LIGHT)
    c.drawString(sx + 10, pv_y - 10, "APPROCHE CRBR")
    c.setFont("Helvetica", 8.5)
    c.setFillColor(C_GREY_LIGHT)
    c.drawString(sx + 10, pv_y - 25, "Abonnement mensuel. Budget annuel prévisible.")
    c.drawString(sx + 10, pv_y - 39, "Maintenance, support, mises à jour inclus.")
    c.drawString(sx + 10, pv_y - 53, "Compatible marchés publics.")

    # 4 formules
    formules = [
        (C_GREY,      "ESSENTIEL",      "Les bases de l'entraînement,\nmaintenance incluse.\nIdéal pour débuter."),
        (C_GOLD_DARK, "OPÉRATIONNEL",   "Spectre élargi, CQB avancé.\nFormule recommandée pour\nles unités opérationnelles."),
        (C_GOLD,      "PREMIUM",        "Complet, personnalisé,\ntoutes options. Solution\nhaute intensité."),
        (C_GOLD_LIGHT,"MOBILE",         "On vient chez vous avec\nl'équipement. Sessions\nrégulières sur site."),
    ]

    card_w = (W - 50) / 4
    card_h = 160
    fy = H - 345

    for i, (color, nom, desc) in enumerate(formules):
        x = 20 + i * (card_w + 3)

        c.setFillColor(C_CARD)
        c.roundRect(x, fy - card_h, card_w - 2, card_h, 4, fill=1, stroke=0)

        # Header carte
        c.setFillColor(color)
        c.roundRect(x, fy - 30, card_w - 2, 30, 4, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(C_BG)
        c.drawCentredString(x + card_w / 2, fy - 18, nom)

        if i == 1:  # recommandée
            c.setFillColor(C_WHITE)
            c.setFont("Helvetica", 6)
            c.drawCentredString(x + card_w / 2, fy - 26, "⭐ RECOMMANDÉE")

        from reportlab.lib.utils import simpleSplit
        c.setFont("Helvetica", 8.5)
        c.setFillColor(C_GREY_LIGHT)
        lines = simpleSplit(desc, "Helvetica", 8.5, card_w - 16)
        for j, line in enumerate(lines):
            c.drawString(x + 8, fy - 48 - j * 13, line)

    # Inclus dans TOUS les contrats
    iy = H - 545
    c.setFillColor(C_CARD)
    c.roundRect(20, iy - 90, W - 40, 100, 4, fill=1, stroke=0)
    gold_rule(c, iy + 10, 20, W - 40)

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(C_GOLD)
    c.drawString(35, iy - 6, "Inclus dans TOUS les contrats CRBR")

    inclus = [
        "✓ Installation chez vous (zéro travaux permanents)",
        "✓ Maintenance préventive & corrective",
        "✓ Mises à jour logicielles & nouveaux scénarios",
        "✓ Consommables inclus (munitions simulées, CO2, etc.)",
        "✓ Support technique réactif — interlocuteur unique",
    ]
    c.setFont("Helvetica", 9)
    c.setFillColor(C_GREY_LIGHT)
    for i, inc in enumerate(inclus):
        col = i % 2 if i < 4 else 0
        row = i // 2
        bx = 35 + col * (W / 2 - 20)
        by = iy - 25 - row * 18
        if i == 4:
            bx = 35
        c.setFillColor(C_GOLD)
        c.drawString(bx, by, "✓")
        c.setFillColor(C_GREY_LIGHT)
        c.drawString(bx + 10, by, inc[2:])

    page_footer(c, 10)

# ─── PAGE 11 : CLIENTS ───────────────────────────────────────────────────────

def page_clients(c):
    fill_bg(c)
    ir_bg = load_img("operator-training.jpg")
    if ir_bg:
        c.saveState()
        c.setFillAlpha(0.12)
        c.drawImage(ir_bg, 0, 0, W, H, preserveAspectRatio=False, mask='auto')
        c.restoreState()
        overlay(c, C_BG, alpha=0.85)

    # Header
    c.setFillColor(C_ACCENT)
    c.rect(0, H - 80, W, 80, fill=1, stroke=0)
    gold_rule(c, H - 80, 0, W)
    section_tag(c, "CLIENTÈLE", 20, H - 30)
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(C_WHITE)
    c.drawString(20, H - 58, "Du niveau local aux unités spécialisées.")
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(C_GOLD)
    c.drawString(20, H - 75, "Tous nos clients.")

    # Texte central
    c.setFont("Helvetica", 10.5)
    c.setFillColor(C_GREY_LIGHT)
    txt = ("Police Municipale. Gendarmerie. Police Nationale. Armée. "
           "Sécurité privée. Administration pénitentiaire. Douanes.\n\n"
           "Chacun choisit la formule qui convient à son contexte. "
           "Pas de solution standard — tout est adaptable.")
    y = H - 115
    from reportlab.lib.utils import simpleSplit
    for para in txt.split('\n\n'):
        lines = simpleSplit(para, "Helvetica", 10.5, W - 40)
        for line in lines:
            c.drawString(20, y, line)
            y -= 16
        y -= 6

    # Grille clients
    clients = [
        ("Police Municipale",       "PM", C_GREY),
        ("Gendarmerie Nationale",   "GN", HexColor("#2244AA")),
        ("Police Nationale",        "PN", HexColor("#003399")),
        ("Armée de Terre",          "AT", HexColor("#4a6741")),
        ("Marine Nationale",        "MN", HexColor("#1a3a6a")),
        ("Armée de l'Air",          "AA", HexColor("#2a4a7a")),
        ("Sécurité Privée",         "SP", C_GREY),
        ("Administration Pénitent.","AP", HexColor("#5a4a2a")),
        ("Douanes",                 "DO", HexColor("#8a6a2a")),
        ("Forces Spéciales",        "FS", HexColor("#3a4a2a")),
    ]

    cell_w = (W - 50) / 5
    cell_h = 55
    base_y = H - 350

    for i, (nom, abbr, color) in enumerate(clients):
        col = i % 5
        row = i // 5
        x = 20 + col * (cell_w + 2)
        y = base_y - row * (cell_h + 4)

        c.setFillColor(C_CARD)
        c.roundRect(x, y - cell_h, cell_w, cell_h, 3, fill=1, stroke=0)
        c.setFillColor(color)
        c.rect(x, y - 4, cell_w, 4, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(color)
        c.drawCentredString(x + cell_w / 2, y - 26, abbr)
        c.setFont("Helvetica", 7)
        c.setFillColor(C_GREY_LIGHT)
        c.drawCentredString(x + cell_w / 2, y - 40, nom)

    # Message clé
    ky = 65
    c.setFillColor(C_CARD)
    c.roundRect(20, ky, W - 40, 40, 4, fill=1, stroke=0)
    gold_rule(c, ky + 40, 20, W - 40)
    gold_rule(c, ky, 20, W - 40)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, ky + 22, "Peu importe votre taille, budget, spécialité —")
    c.setFont("Helvetica", 10)
    c.setFillColor(C_WHITE)
    c.drawCentredString(W / 2, ky + 8, "on a une réponse adaptée à votre contexte.")

    page_footer(c, 11)

# ─── PAGE 12 : CONTACT PROCESS ───────────────────────────────────────────────

def page_contact_process(c):
    fill_bg(c)

    # Header
    c.setFillColor(C_ACCENT)
    c.rect(0, H - 75, W, 75, fill=1, stroke=0)
    gold_rule(c, H - 75, 0, W)
    section_tag(c, "DÉMARRER", 20, H - 30)
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(C_WHITE)
    c.drawString(20, H - 62, "Trois étapes simples. Aucun engagement caché.")

    # Timeline étapes
    steps = [
        ("Vous nous contactez",
         "Mail, téléphone, formulaire. Pas de RDV commercial imposé. "
         "Dites-nous simplement votre situation et vos besoins. "
         "On lit, on comprend, on répond."),
        ("On échange",
         "Dans les 48h, on vous rappelle. On comprend votre contexte réel : "
         "unité, effectifs, infrastructure existante, budget. "
         "Pas de présentation PowerPoint — une vraie discussion terrain."),
        ("On vous propose",
         "Devis sur-mesure, adapté à votre réalité. "
         "Pas de contrat piège, pas de surprise. "
         "Déploiement rapide, accompagnement complet dès le départ."),
    ]

    sy = H - 200

    for i, (titre, body) in enumerate(steps):
        # Ligne de connexion
        if i < len(steps) - 1:
            c.setStrokeColor(C_GOLD_DARK)
            c.setLineWidth(2)
            c.setDash([5, 5])
            c.line(50, sy - 50, 50, sy - 110)
            c.setDash([])

        # Cercle
        c.setFillColor(C_GOLD)
        c.circle(50, sy, 18, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(C_BG)
        c.drawCentredString(50, sy - 5, str(i + 1))

        # Titre
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(C_WHITE)
        c.drawString(80, sy + 4, titre)
        gold_rule(c, sy - 3, 80, W - 100)

        # Corps
        from reportlab.lib.utils import simpleSplit
        c.setFont("Helvetica", 9.5)
        c.setFillColor(C_GREY_LIGHT)
        lines = simpleSplit(body, "Helvetica", 9.5, W - 100)
        for j, line in enumerate(lines):
            c.drawString(80, sy - 18 - j * 14, line)

        sy -= 130

    # Garantie 48h
    gy = 80
    c.setFillColor(C_CARD)
    c.roundRect(20, gy, W - 40, 45, 4, fill=1, stroke=0)
    c.setFillColor(C_GOLD)
    c.roundRect(20, gy + 32, W - 40, 13, 4, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(C_BG)
    c.drawCentredString(W / 2, gy + 35, "ENGAGEMENT CRBR : RÉPONSE GARANTIE SOUS 48H OUVRÉES")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(C_GREY_LIGHT)
    c.drawCentredString(W / 2, gy + 16, "Vous ne serez jamais noyé dans un CRM. Une personne, une réponse, un suivi.")

    page_footer(c, 12)

# ─── PAGE 13 : CONTACT FINAL ─────────────────────────────────────────────────

def page_contact_final(c):
    fill_bg(c)

    # Fond image atténuée
    ir = load_img("contact-briefing.jpg")
    if ir:
        c.saveState()
        c.setFillAlpha(0.12)
        c.drawImage(ir, 0, 0, W, H, preserveAspectRatio=False, mask='auto')
        c.restoreState()
        overlay(c, C_BG, alpha=0.85)

    # Bandeau doré haut
    c.setFillColor(C_GOLD)
    c.rect(0, H - 6, W, 6, fill=1, stroke=0)

    # Logo Cerbère haut centré
    logo_ir = load_img("logo-cerbere-or-metallique.png")
    if logo_ir:
        lw, lh = 130, 87
        c.drawImage(logo_ir, (W - lw) / 2, H - 105, lw, lh,
                    preserveAspectRatio=True, mask='auto')

    # Titre
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(C_WHITE)
    c.drawCentredString(W / 2, H - 135, "Parlons de votre")
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, H - 160, "entraînement opérationnel")

    gold_rule(c, H - 175, 60, W - 120)

    # Infos contact (cartes)
    contacts = [
        ("✉", "EMAIL", "info@crbr-solution.fr"),
        ("☎", "TÉLÉPHONE", "06 65 44 52 26"),
        ("◷", "RÉPONSE", "48h ouvrées garanties"),
        ("◉", "ZONE", "France & worldwide"),
    ]

    cw = (W - 50) / 2
    ch = 55
    cy_start = H - 310

    for i, (icon, label_txt, val) in enumerate(contacts):
        col = i % 2
        row = i // 2
        x = 20 + col * (cw + 10)
        y = cy_start - row * (ch + 6)

        c.setFillColor(C_CARD)
        c.roundRect(x, y - ch, cw, ch, 4, fill=1, stroke=0)
        c.setFillColor(C_GOLD)
        c.rect(x, y - ch, 3, ch, fill=1, stroke=0)

        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(C_GOLD)
        c.drawString(x + 12, y - 20, icon)

        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(C_GREY)
        c.drawString(x + 32, y - 14, label_txt)

        c.setFont("Helvetica-Bold", 10.5)
        c.setFillColor(C_WHITE)
        c.drawString(x + 32, y - 30, val)

    # Horaires
    c.setFont("Helvetica", 8.5)
    c.setFillColor(C_GREY)
    c.drawCentredString(W / 2, H - 445, "Disponible du lundi au vendredi, 9h – 18h")

    # QR Code
    if os.path.exists(QR_PATH):
        qr_size = 130
        qx = (W - qr_size) / 2
        qy = H - 600
        c.setFillColor(C_CARD)
        c.roundRect(qx - 10, qy - 10, qr_size + 20, qr_size + 35, 4, fill=1, stroke=0)
        c.drawImage(ImageReader(QR_PATH), qx, qy, qr_size, qr_size,
                    preserveAspectRatio=True, mask='auto')
        c.setFont("Helvetica", 7.5)
        c.setFillColor(C_GREY)
        c.drawCentredString(W / 2, qy - 6, "www.crbr-solution.fr")

    # Tagline finale
    tgy = H - 640
    gold_rule(c, tgy + 16, 40, W - 80)
    c.setFont("Helvetica", 10)
    c.setFillColor(C_GOLD)
    c.drawCentredString(W / 2, tgy, "Réseau de professionnels qualifiés. Discrétion garantie.")

    # Logo discret bas-droite
    if logo_ir:
        c.saveState()
        c.setFillAlpha(0.25)
        c.drawImage(logo_ir, W - 75, 32, 52, 35, preserveAspectRatio=True, mask='auto')
        c.restoreState()

    # Bandeau doré bas
    c.setFillColor(C_GOLD)
    c.rect(0, 0, W, 5, fill=1, stroke=0)

    # Footer simplifié
    c.setFillColor(C_ACCENT)
    c.rect(0, 5, W, 22, fill=1, stroke=0)
    gold_rule(c, 27, 0, W)
    c.setFont("Helvetica", 7)
    c.setFillColor(C_GREY)
    c.drawString(20, 12, "CRBR Solutions — Document confidentiel — 2026")
    c.drawRightString(W - 20, 12, "13 / 13")

# ─── PAGE INTERMÉDIAIRE : POURQUOI CRBR ──────────────────────────────────────

def page_why_crbr(c):
    fill_bg(c)
    ir = load_img("solution-simulator-room.jpg")
    if ir:
        c.saveState()
        c.setFillAlpha(0.20)
        c.drawImage(ir, 0, 0, W, H, preserveAspectRatio=False, mask='auto')
        c.restoreState()
        overlay(c, C_BG, alpha=0.80)

    # Header
    c.setFillColor(C_ACCENT)
    c.rect(0, H - 75, W, 75, fill=1, stroke=0)
    gold_rule(c, H - 75, 0, W)
    section_tag(c, "À PROPOS", 20, H - 30)
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(C_WHITE)
    c.drawString(20, H - 62, "Pourquoi CRBR Solutions ?")

    # Corps texte principal
    corps = [
        "CRBR Solutions est un cabinet de consulting spécialisé dans les solutions "
        "opérationnelles d'entraînement. Notre mission : rendre l'entraînement de "
        "haute qualité accessible à chaque unité, quelle que soit sa taille ou son budget.",
        "",
        "On ne fabrique pas. On sélectionne, on intègre, on déploie.",
        "Les meilleures technologies disponibles sur le marché international, "
        "assemblées et maintenues par un réseau de professionnels qualifiés.",
        "",
        "Ce qui nous distingue :",
    ]

    y = H - 115
    from reportlab.lib.utils import simpleSplit
    for para in corps:
        if para == "":
            y -= 8
            continue
        if para == "Ce qui nous distingue :":
            c.setFont("Helvetica-Bold", 11)
            c.setFillColor(C_GOLD)
            c.drawString(20, y, para)
            y -= 20
            continue
        lines = simpleSplit(para, "Helvetica", 10.5, W - 40)
        c.setFont("Helvetica", 10.5)
        c.setFillColor(C_GREY_LIGHT)
        for line in lines:
            c.drawString(20, y, line)
            y -= 15

    # Différenciateurs
    diffs = [
        ("Approche terrain",
         "Nos consultants viennent du secteur. On parle votre langue."),
        ("Solution complète",
         "De la conception à la maintenance. Un seul point de contact."),
        ("Flexibilité réelle",
         "Abonnement ajustable. Évolue avec vos besoins et budgets."),
        ("Discrétion totale",
         "Environnements sensibles. Protocoles de confidentialité stricts."),
        ("Réseau qualifié",
         "Partenaires techniques certifiés, sélectionnés sur références."),
        ("Support réactif",
         "Problème technique = réponse sous 24h, intervention sous 72h."),
    ]

    col_w = (W - 50) / 2
    dy = y - 20

    for i, (titre, corps_d) in enumerate(diffs):
        col = i % 2
        row = i // 2
        x = 20 + col * (col_w + 10)
        yd = dy - row * 65

        c.setFillColor(C_CARD)
        c.roundRect(x, yd - 52, col_w, 58, 3, fill=1, stroke=0)
        c.setFillColor(C_GOLD)
        c.rect(x, yd - 52, 3, 58, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(C_GOLD_LIGHT)
        c.drawString(x + 10, yd - 12, titre)
        c.setFont("Helvetica", 9)
        c.setFillColor(C_GREY_LIGHT)
        lines = simpleSplit(corps_d, "Helvetica", 9, col_w - 18)
        for j, line in enumerate(lines):
            c.drawString(x + 10, yd - 28 - j * 13, line)

    page_footer(c, 3)

# ─── GÉNÉRATION COMPLÈTE DU PDF ──────────────────────────────────────────────

def generate_pdf():
    print("Génération du PDF...")
    c = canvas.Canvas(OUTPUT_PDF, pagesize=A4)
    c.setTitle("CRBR Solutions — Plaquette Marketing")
    c.setAuthor("CRBR Solutions")
    c.setSubject("Consulting Opérationnel — Entraînement Opérationnel")
    c.setCreator("CRBR Solutions — 2026")

    pages = [
        ("Page 1 — Couverture",         page_cover),
        ("Page 2 — Freins",             page_freins),
        ("Page 3 — Pourquoi CRBR",      page_why_crbr),
        ("Page 4 — Process",            page_process),
        ("Page 5 — Valeurs",            page_values),
        ("Page 6 — Solutions",          page_solutions),
        ("Page 7 — Équipements détail",  page_equipment_detail),
        ("Page 8 — Shooting House",     page_shooting_house),
        ("Page 9 — Multi-domaines",     page_multidomaines),
        ("Page 10 — Budget",            page_budget),
        ("Page 11 — Clients",           page_clients),
        ("Page 12 — Processus contact", page_contact_process),
        ("Page 13 — Contact final",     page_contact_final),
    ]

    for label_txt, fn in pages:
        print(f"  → {label_txt}")
        fn(c)
        c.showPage()

    c.save()
    size_mb = os.path.getsize(OUTPUT_PDF) / (1024 * 1024)
    print(f"\n✓ PDF généré : {OUTPUT_PDF}")
    print(f"  Taille : {size_mb:.1f} MB")
    print(f"  Pages  : {len(pages)}")

# ─── MAIN ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("CRBR Solutions — Générateur de Plaquette Marketing 2026")
    print("=" * 60)
    generate_qr()
    generate_pdf()
    print("\n✓ Génération complète.")
