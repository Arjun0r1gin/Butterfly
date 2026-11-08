"""
BUTTERFLY — High-Resolution Editorial Reference Book Asset Builder (Refined Master Pass)
Constructs pixel-perfect, modular visual assets matching the approved reference design:
- Subtle, real-paper punched holes (reduced diameter, fiber edges, leather undertone)
- Generous breathing room for Polaroids (no clutter, clear readable captions)
- Right page text spacing with zero decorative overlap
- 100% UNIQUE photographs for Spread 2 (zero duplicate photos, zero duplicate text)
- Integrated physical depth, beveling, and consistent lighting
"""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

DEST_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/storybook'
ELEM_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/src/scenes/Storybook/elements'
PUBLIC_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public'
os.makedirs(DEST_DIR, exist_ok=True)

# Fonts
FONT_SERIF_ROMAN = '/usr/share/fonts/urw-base35/P052-Roman.otf'
FONT_SERIF_ITALIC = '/usr/share/fonts/urw-base35/P052-Italic.otf'
FONT_SERIF_BOLD = '/usr/share/fonts/urw-base35/P052-Bold.otf'
FONT_SCRIPT = '/usr/share/fonts/urw-base35/Z003-MediumItalic.otf'

# =============================================================================
# Helper: Extract Clean Transparent PNG against parchment background
# =============================================================================
def extract_transparent(img, parchment_rgb=(248, 238, 220), threshold=16):
    im_rgba = img.convert('RGBA')
    pix = im_rgba.load()
    w, h = im_rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            dist = math.hypot(r - parchment_rgb[0], g - parchment_rgb[1], b - parchment_rgb[2])
            if dist < threshold:
                pix[x, y] = (r, g, b, 0)
            elif dist < threshold + 24:
                alpha = int(255 * (dist - threshold) / 24)
                pix[x, y] = (r, g, b, alpha)
    return im_rgba

# =============================================================================
# Helper: Create Warm Aged Ivory Deckled Parchment Base
# =============================================================================
def create_parchment_base(w=1200, h=1270):
    base = Image.new('RGBA', (w, h), (249, 244, 235, 255))

    # Soft aged gradient vignette
    vignette = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vignette)
    cx, cy = w / 2, h / 2
    max_r = math.hypot(cx, cy)
    for r in range(int(max_r * 0.5), int(max_r), 8):
        ratio = max(0.0, (r - max_r * 0.5) / (max_r * 0.5))
        alpha = int(24 * (ratio ** 1.5))
        vd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(200, 170, 130, alpha), width=9)
    vignette = vignette.filter(ImageFilter.GaussianBlur(18))
    base.alpha_composite(vignette)

    # Subtle paper texture grain
    random.seed(101)
    noise = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    n_pix = noise.load()
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if random.random() < 0.16:
                v = random.randint(195, 225)
                n_pix[x, y] = (v, v - 15, v - 30, random.randint(8, 22))
    base.alpha_composite(noise)

    # Soft inner perimeter border
    d = ImageDraw.Draw(base)
    d.rectangle([18, 18, w - 18, h - 18], outline=(218, 196, 162, 90), width=2)
    d.rectangle([25, 25, w - 25, h - 25], outline=(225, 208, 178, 60), width=1)
    return base

# =============================================================================
# Helper: Punch Realistic Small Paper-Fiber Punched Holes
# =============================================================================
def punch_holes(img, side='right'):
    """
    Subtle, realistic punched holes:
    - Reduced diameter: rx=7, ry=10
    - Warm leather undertone (not pure black)
    - Paper-fiber deckled rim highlight on outer curve
    - Inner top cast shadow
    """
    w, h = img.size
    coil_count = 13
    start_y = int(h * 0.075)
    end_y = int(h * 0.925)
    step_y = (end_y - start_y) / (coil_count - 1)

    hole_x = w - 30 if side == 'right' else 30
    rx = 7
    ry = 10

    d = ImageDraw.Draw(img)
    for i in range(coil_count):
        cy = int(start_y + i * step_y)
        # Soft shadow behind hole onto leather
        d.ellipse([hole_x - rx - 1, cy - ry, hole_x + rx + 2, cy + ry + 2], fill=(38, 22, 14, 110))
        # Warm dark walnut leather inside hole
        d.ellipse([hole_x - rx, cy - ry, hole_x + rx, cy + ry], fill=(52, 32, 20, 255))
        # Inner top shadow
        d.arc([hole_x - rx + 1, cy - ry + 1, hole_x + rx - 1, cy + ry - 1], start=180, end=350, fill=(22, 12, 6, 220), width=2)
        # Paper-fiber deckled rim highlight on outer curve
        d.arc([hole_x - rx, cy - ry, hole_x + rx, cy + ry], start=20, end=160, fill=(255, 252, 246, 230), width=1)

    return img

# =============================================================================
# 1. BUILD STUDIO WALNUT LEATHER COVER (1600x811)
# =============================================================================
def build_cover():
    w, h = 1600, 811
    cov = Image.new('RGBA', (w, h), (46, 26, 15, 255))

    # Fine leather pebble grain
    random.seed(77)
    noise = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    n_pix = noise.load()
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if random.random() < 0.26:
                v = random.randint(32, 68)
                n_pix[x, y] = (v + 15, v, v - 10, random.randint(14, 32))
    cov.alpha_composite(noise)

    # Soft ambient vignette / leather depth
    vig = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vig)
    vd.rectangle([0, 0, w, h], outline=(18, 9, 4, 210), width=32)
    vig = vig.filter(ImageFilter.GaussianBlur(24))
    cov.alpha_composite(vig)

    d = ImageDraw.Draw(cov)
    # Embossed Antique Gold Botanical Tooling Perimeter
    d.rectangle([32, 32, w - 32, h - 32], outline=(185, 140, 60, 210), width=3)
    d.rectangle([42, 42, w - 42, h - 42], outline=(150, 105, 45, 170), width=2)

    # Saddle stitching thread
    stitch_pad = 24
    for sx in range(stitch_pad, w - stitch_pad, 14):
        d.line([sx, stitch_pad, sx + 7, stitch_pad], fill=(215, 180, 120, 190), width=2)
        d.line([sx, h - stitch_pad, sx + 7, h - stitch_pad], fill=(215, 180, 120, 190), width=2)
    for sy in range(stitch_pad, h - stitch_pad, 14):
        d.line([stitch_pad, sy, stitch_pad, sy + 7], fill=(215, 180, 120, 190), width=2)
        d.line([w - stitch_pad, sy, w - stitch_pad, sy + 7], fill=(215, 180, 120, 190), width=2)

    # 4 Antique Brass Filigree Corner Protectors
    corner_path = os.path.join(ELEM_DIR, 'brass_corner_filigree.png')
    if os.path.exists(corner_path):
        corner = extract_transparent(Image.open(corner_path), threshold=20)
        cw, ch = 105, 105
        corner = corner.resize((cw, ch), Image.Resampling.LANCZOS)
        cov.alpha_composite(corner, (15, 15))
        cov.alpha_composite(corner.transpose(Image.Transpose.FLIP_TOP_BOTTOM), (15, h - 15 - ch))
        cov.alpha_composite(corner.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (w - 15 - cw, 15))
        cov.alpha_composite(corner.transpose(Image.Transpose.ROTATE_180), (w - 15 - cw, h - 15 - ch))

    # Right Leather Closure Clasp Strap
    clasp_path = os.path.join(ELEM_DIR, 'leather_closure_clasp.png')
    if os.path.exists(clasp_path):
        clasp = extract_transparent(Image.open(clasp_path), threshold=18)
        clasp = clasp.resize((92, 116), Image.Resampling.LANCZOS)
        cov.alpha_composite(clasp, (w - 92, (h - 116) // 2))

    out_path = os.path.join(DEST_DIR, 'studio_cover_walnut.jpg')
    cov.convert('RGB').save(out_path, quality=96)
    print(f'Saved refined cover to {out_path} ({w}x{h})')

# =============================================================================
# 2. BUILD STUDIO LEFT PAGE — SCRAPBOOK MEMORIES (1200x1270)
# =============================================================================
def build_left_page():
    w, h = 1200, 1270
    page = create_parchment_base(w, h)

    # 1. Top-Left Watercolor Wild Rose Blossom (outside polaroid)
    rose_path = os.path.join(ELEM_DIR, 'left_corner_rose.png')
    if os.path.exists(rose_path):
        rose = extract_transparent(Image.open(rose_path), threshold=18)
        rose = rose.resize((260, 210), Image.Resampling.LANCZOS)
        page.alpha_composite(rose, (35, 30))

    # 2. Main Polaroid 1: Sunset Golden Meadow with Breathing Room
    pol1_path = os.path.join(ELEM_DIR, 'polaroid_large_meadow.png')
    if os.path.exists(pol1_path):
        pol1 = Image.open(pol1_path).convert('RGBA')
        pol1 = pol1.resize((450, 530), Image.Resampling.LANCZOS)
        pol1_rot = pol1.rotate(4.5, expand=True, resample=Image.Resampling.BICUBIC)
        # Drop shadow
        sh1 = Image.new('RGBA', pol1_rot.size, (15, 8, 4, 0))
        sh1.putalpha(pol1_rot.split()[3].filter(ImageFilter.GaussianBlur(10)))
        page.alpha_composite(sh1, (145, 165))
        page.alpha_composite(pol1_rot, (140, 160))

    # 3. Polaroid 2: Monarch Butterfly (clean overlapping, breathing room)
    pol2_path = os.path.join(ELEM_DIR, 'polaroid_small_butterfly.png')
    if os.path.exists(pol2_path):
        pol2 = Image.open(pol2_path).convert('RGBA')
        pol2 = pol2.resize((330, 400), Image.Resampling.LANCZOS)
        pol2_rot = pol2.rotate(-6.0, expand=True, resample=Image.Resampling.BICUBIC)
        sh2 = Image.new('RGBA', pol2_rot.size, (15, 8, 4, 0))
        sh2.putalpha(pol2_rot.split()[3].filter(ImageFilter.GaussianBlur(9)))
        page.alpha_composite(sh2, (555, 385))
        page.alpha_composite(pol2_rot, (550, 380))

    # 4. Upper-Right Dried Baby's Breath Botanical Sprig
    bb_path = os.path.join(ELEM_DIR, 'babys_breath.png')
    if os.path.exists(bb_path):
        bb = extract_transparent(Image.open(bb_path), threshold=16)
        bb = bb.resize((150, 190), Image.Resampling.LANCZOS)
        page.alpha_composite(bb, (850, 130))

    # 5. Lower-Left Dried Lavender Sprig Tied with Twine Bow
    lav_path = os.path.join(ELEM_DIR, 'lavender_twine_bow.png')
    if os.path.exists(lav_path):
        lav = extract_transparent(Image.open(lav_path), threshold=16)
        lav = lav.resize((230, 460), Image.Resampling.LANCZOS)
        sh_lav = Image.new('RGBA', lav.size, (15, 8, 4, 0))
        sh_lav.putalpha(lav.split()[3].filter(ImageFilter.GaussianBlur(8)))
        page.alpha_composite(sh_lav, (95, 745))
        page.alpha_composite(lav, (90, 740))

    # 6. Lower-Center Torn Parchment Quote Note
    note_path = os.path.join(ELEM_DIR, 'torn_parchment_note.png')
    if os.path.exists(note_path):
        note = extract_transparent(Image.open(note_path), threshold=16)
        note = note.resize((350, 180), Image.Resampling.LANCZOS)
        sh_note = Image.new('RGBA', note.size, (15, 8, 4, 0))
        sh_note.putalpha(note.split()[3].filter(ImageFilter.GaussianBlur(6)))
        page.alpha_composite(sh_note, (335, 885))
        page.alpha_composite(note, (330, 880))

    # 7. Lower-Right Real Pressed Pink Cosmos Flower Blossom
    flower_path = os.path.join(ELEM_DIR, 'pressed_flower_stamp.png')
    if os.path.exists(flower_path):
        flower = extract_transparent(Image.open(flower_path), threshold=16)
        flower = flower.resize((260, 220), Image.Resampling.LANCZOS)
        page.alpha_composite(flower, (720, 850))

    # Punch 13 Precision Paper-Fiber Holes along the Right Spine Edge
    punch_holes(page, side='right')

    out_path = os.path.join(DEST_DIR, 'studio_page_left.jpg')
    page.convert('RGB').save(out_path, quality=96)
    print(f'Saved refined left page to {out_path} ({w}x{h})')

# =============================================================================
# 3. BUILD STUDIO RIGHT PAGE — CHAPTER I STORY LETTER (1200x1270)
# =============================================================================
def build_right_page():
    w, h = 1200, 1270
    page = create_parchment_base(w, h)
    d = ImageDraw.Draw(page)

    # 1. Watercolor Wild Roses in Corners (POSITIONED WITH ZERO TEXT OVERLAP)
    top_rose_path = os.path.join(ELEM_DIR, 'right_top_roses.png')
    if os.path.exists(top_rose_path):
        r_top = extract_transparent(Image.open(top_rose_path), threshold=16)
        r_top = r_top.resize((250, 185), Image.Resampling.LANCZOS)
        # Positioned strictly in upper-right corner outside text boundaries
        page.alpha_composite(r_top, (w - 275, 25))

    bot_rose_path = os.path.join(ELEM_DIR, 'right_bottom_roses.png')
    if os.path.exists(bot_rose_path):
        r_bot = extract_transparent(Image.open(bot_rose_path), threshold=16)
        r_bot = r_bot.resize((290, 250), Image.Resampling.LANCZOS)
        # Positioned strictly in lower-right corner below signature
        page.alpha_composite(r_bot, (w - 315, h - 280))

    # 2. Typography Setup
    font_chap = ImageFont.truetype(FONT_SERIF_ROMAN, 28)
    font_title = ImageFont.truetype(FONT_SERIF_ITALIC, 52)
    font_sub = ImageFont.truetype(FONT_SERIF_ITALIC, 32)
    font_drop = ImageFont.truetype(FONT_SERIF_BOLD, 102)
    font_body = ImageFont.truetype(FONT_SERIF_ROMAN, 28)
    font_sig = ImageFont.truetype(FONT_SCRIPT, 44)

    # Header: "CHAPTER I" with diamond separator
    chap_text = "C H A P T E R   I"
    bbox_chap = d.textbbox((0, 0), chap_text, font=font_chap)
    chap_w = bbox_chap[2] - bbox_chap[0]
    cx = 590
    d.text((cx - chap_w // 2, 150), chap_text, fill=(78, 54, 38), font=font_chap)

    # Diamond Divider bar
    div_y = 198
    d.line([cx - 150, div_y, cx - 18, div_y], fill=(185, 140, 75, 200), width=2)
    d.polygon([(cx, div_y - 6), (cx + 7, div_y), (cx, div_y + 6), (cx - 7, div_y)], fill=(185, 140, 75, 240))
    d.line([cx + 18, div_y, cx + 150, div_y], fill=(185, 140, 75, 200), width=2)

    # Title: "Where The Light Touches"
    title_text = "Where The Light Touches"
    bbox_title = d.textbbox((0, 0), title_text, font=font_title)
    title_w = bbox_title[2] - bbox_title[0]
    d.text((cx - title_w // 2, 245), title_text, fill=(44, 26, 16), font=font_title)

    # Subtitle: "The Twilight Garden"
    sub_text = "The Twilight Garden"
    bbox_sub = d.textbbox((0, 0), sub_text, font=font_sub)
    sub_w = bbox_sub[2] - bbox_sub[0]
    d.text((cx - sub_w // 2, 322), sub_text, fill=(172, 112, 44), font=font_sub)

    # Hairline divider under title
    d.line([cx - 180, 375, cx + 180, 375], fill=(215, 182, 134, 150), width=1)

    # 3. Story Paragraphs with Drop-Cap 'O'
    text_x = 175
    body_y = 440
    line_h = 44

    # Drop cap 'O'
    drop_x = text_x
    drop_y = body_y - 10
    d.text((drop_x, drop_y), "O", fill=(138, 38, 38), font=font_drop)

    # Lines 1-3 beside drop cap
    indent_x = text_x + 92
    p1_lines = [
        "nce upon a quiet evening, when the sun",
        "dipped low beneath the amber horizon, a",
        "small gentle gift opened in the heart of the",
        "garden. From its glowing center, a symphony of",
        "colorful blossoms took flight.",
    ]
    for i, line in enumerate(p1_lines):
        lx = indent_x if i < 3 else text_x
        ly = body_y + i * line_h
        d.text((lx, ly), line, fill=(48, 34, 22), font=font_body)

    # Paragraph 2
    p2_y = body_y + len(p1_lines) * line_h + 38
    p2_lines = [
        "The air was sweet with lavender and warm peach light.",
        "With every step through the tall grass, memories began to",
        "weave themselves into a story of their own.",
    ]
    for i, line in enumerate(p2_lines):
        ly = p2_y + i * line_h
        d.text((text_x, ly), line, fill=(48, 34, 22), font=font_body)

    # 4. Closing Cursive Signature: "With gentle wonder, forever..."
    sig_text = "With gentle wonder, forever..."
    sig_y = p2_y + len(p2_lines) * line_h + 55
    d.text((text_x + 25, sig_y), sig_text, fill=(100, 55, 35), font=font_sig)

    # 5. Antique botanical flourish at bottom
    d.line([text_x, h - 130, text_x + 460, h - 130], fill=(215, 185, 140, 150), width=1)
    d.polygon([(cx - 90, h - 130), (cx - 85, h - 134), (cx - 80, h - 130), (cx - 85, h - 126)], fill=(185, 145, 90, 190))

    # Punch 13 Precision Paper-Fiber Holes along the Left Spine Edge
    punch_holes(page, side='left')

    out_path = os.path.join(DEST_DIR, 'studio_page_right.jpg')
    page.convert('RGB').save(out_path, quality=96)
    print(f'Saved refined right page to {out_path} ({w}x{h})')

# =============================================================================
# 4. BUILD STUDIO BACK PAGE — SPREAD 2 LEFT (100% UNIQUE MEMORIES)
# =============================================================================
def build_back_page():
    w, h = 1200, 1270
    page = create_parchment_base(w, h)

    # 1. Watercolor Corner Roses
    rose_path = os.path.join(ELEM_DIR, 'left_corner_rose.png')
    if os.path.exists(rose_path):
        rose = extract_transparent(Image.open(rose_path), threshold=18)
        rose = rose.resize((240, 195), Image.Resampling.LANCZOS)
        page.alpha_composite(rose, (35, 30))

    # 2. UNIQUE Polaroid 1: "By The Mossy Stones"
    # Create an authentic garden stone boulder crop from garden_base_master
    garden_bg = Image.open(os.path.join(PUBLIC_DIR, 'garden/garden_base_master.png'))
    # Crop mossy stone region (bottom left boulder)
    stone_crop = garden_bg.crop((60, 480, 460, 880)).resize((370, 370), Image.Resampling.LANCZOS)

    # Polaroid frame
    pol1_w, pol1_h = 430, 510
    pol1 = Image.new('RGBA', (pol1_w, pol1_h), (252, 250, 245, 255))
    pol1.alpha_composite(stone_crop, (30, 30))
    d1 = ImageDraw.Draw(pol1)
    d1.rectangle([0, 0, pol1_w - 1, pol1_h - 1], outline=(225, 215, 198, 220), width=1)
    font_cap = ImageFont.truetype(FONT_SCRIPT, 30)
    d1.text((pol1_w // 2 - 145, pol1_h - 75), "By The Mossy Stones \u2661", fill=(65, 42, 28), font=font_cap)
    d1.text((pol1_w // 2 - 40, pol1_h - 40), "July 19", fill=(150, 120, 95), font=ImageFont.truetype(FONT_SERIF_ROMAN, 18))

    # Washi tape at top
    d1.rectangle([pol1_w // 2 - 50, 10, pol1_w // 2 + 50, 32], fill=(225, 195, 145, 180))

    pol1_rot = pol1.rotate(4.0, expand=True, resample=Image.Resampling.BICUBIC)
    sh1 = Image.new('RGBA', pol1_rot.size, (15, 8, 4, 0))
    sh1.putalpha(pol1_rot.split()[3].filter(ImageFilter.GaussianBlur(10)))
    page.alpha_composite(sh1, (155, 175))
    page.alpha_composite(pol1_rot, (150, 170))

    # 3. UNIQUE Polaroid 2: "Stargazing at Dusk"
    # Crop twilight horizon region
    sky_crop = garden_bg.crop((500, 120, 880, 500)).resize((280, 270), Image.Resampling.LANCZOS)
    pol2_w, pol2_h = 330, 390
    pol2 = Image.new('RGBA', (pol2_w, pol2_h), (252, 250, 245, 255))
    pol2.alpha_composite(sky_crop, (25, 25))
    d2 = ImageDraw.Draw(pol2)
    d2.rectangle([0, 0, pol2_w - 1, pol2_h - 1], outline=(225, 215, 198, 220), width=1)
    d2.text((pol2_w // 2 - 110, pol2_h - 65), "Stargazing at Dusk", fill=(65, 42, 28), font=font_cap)
    d2.text((pol2_w // 2 - 45, pol2_h - 35), "August 04", fill=(150, 120, 95), font=ImageFont.truetype(FONT_SERIF_ROMAN, 17))
    d2.rectangle([pol2_w // 2 - 45, 8, pol2_w // 2 + 45, 28], fill=(215, 185, 135, 180))

    pol2_rot = pol2.rotate(-5.5, expand=True, resample=Image.Resampling.BICUBIC)
    sh2 = Image.new('RGBA', pol2_rot.size, (15, 8, 4, 0))
    sh2.putalpha(pol2_rot.split()[3].filter(ImageFilter.GaussianBlur(9)))
    page.alpha_composite(sh2, (565, 395))
    page.alpha_composite(pol2_rot, (560, 390))

    # 4. Dried Botanical Lavender and Twine
    lav_path = os.path.join(ELEM_DIR, 'lavender_twine_bow.png')
    if os.path.exists(lav_path):
        lav = extract_transparent(Image.open(lav_path), threshold=16)
        lav = lav.resize((210, 430), Image.Resampling.LANCZOS)
        sh_lav = Image.new('RGBA', lav.size, (15, 8, 4, 0))
        sh_lav.putalpha(lav.split()[3].filter(ImageFilter.GaussianBlur(8)))
        page.alpha_composite(sh_lav, (105, 755))
        page.alpha_composite(lav, (100, 750))

    # 5. Lower Unique Torn Note
    note_w, note_h = 360, 175
    note = Image.new('RGBA', (note_w, note_h), (245, 238, 222, 255))
    nd = ImageDraw.Draw(note)
    nd.rectangle([0, 0, note_w - 1, note_h - 1], outline=(215, 195, 160), width=1)
    font_note = ImageFont.truetype(FONT_SERIF_ITALIC, 22)
    nd.text((25, 40), '"Time stood still beneath the old', fill=(62, 42, 26), font=font_note)
    nd.text((45, 78), 'willow tree..."', fill=(62, 42, 26), font=font_note)
    nd.text((160, 120), '\u2014 Evening journal', fill=(140, 105, 75), font=ImageFont.truetype(FONT_SCRIPT, 26))

    note_rot = note.rotate(-2.0, expand=True, resample=Image.Resampling.BICUBIC)
    sh_n = Image.new('RGBA', note_rot.size, (15, 8, 4, 0))
    sh_n.putalpha(note_rot.split()[3].filter(ImageFilter.GaussianBlur(7)))
    page.alpha_composite(sh_n, (335, 885))
    page.alpha_composite(note_rot, (330, 880))

    # 6. Pressed Daisy Blossom
    flower_path = os.path.join(ELEM_DIR, 'pressed_flower_stamp.png')
    if os.path.exists(flower_path):
        flower = extract_transparent(Image.open(flower_path), threshold=16)
        flower = flower.resize((240, 205), Image.Resampling.LANCZOS)
        page.alpha_composite(flower, (720, 850))

    # Punch 13 Precision Paper-Fiber Holes along the Right Spine Edge (for back face)
    punch_holes(page, side='right')

    out_path = os.path.join(DEST_DIR, 'studio_page_back.jpg')
    page.convert('RGB').save(out_path, quality=96)
    print(f'Saved refined back page to {out_path} ({w}x{h})')

# =============================================================================
# 5. BUILD STUDIO UNDERNEATH PAGE — CHAPTER II STORY (1200x1270)
# =============================================================================
def build_underneath_page():
    w, h = 1200, 1270
    page = create_parchment_base(w, h)
    d = ImageDraw.Draw(page)

    # 1. Watercolor Roses in Corners
    top_rose_path = os.path.join(ELEM_DIR, 'right_top_roses.png')
    if os.path.exists(top_rose_path):
        r_top = extract_transparent(Image.open(top_rose_path), threshold=16)
        r_top = r_top.resize((250, 185), Image.Resampling.LANCZOS)
        page.alpha_composite(r_top, (w - 275, 25))

    bot_rose_path = os.path.join(ELEM_DIR, 'right_bottom_roses.png')
    if os.path.exists(bot_rose_path):
        r_bot = extract_transparent(Image.open(bot_rose_path), threshold=16)
        r_bot = r_bot.resize((290, 250), Image.Resampling.LANCZOS)
        page.alpha_composite(r_bot, (w - 315, h - 280))

    # 2. Typography Setup
    font_chap = ImageFont.truetype(FONT_SERIF_ROMAN, 28)
    font_title = ImageFont.truetype(FONT_SERIF_ITALIC, 52)
    font_sub = ImageFont.truetype(FONT_SERIF_ITALIC, 32)
    font_drop = ImageFont.truetype(FONT_SERIF_BOLD, 102)
    font_body = ImageFont.truetype(FONT_SERIF_ROMAN, 28)
    font_sig = ImageFont.truetype(FONT_SCRIPT, 44)

    # Header: "CHAPTER II" with diamond separator
    chap_text = "C H A P T E R   I I"
    bbox_chap = d.textbbox((0, 0), chap_text, font=font_chap)
    chap_w = bbox_chap[2] - bbox_chap[0]
    cx = 590
    d.text((cx - chap_w // 2, 150), chap_text, fill=(78, 54, 38), font=font_chap)

    # Diamond Divider bar
    div_y = 198
    d.line([cx - 150, div_y, cx - 18, div_y], fill=(185, 140, 75, 200), width=2)
    d.polygon([(cx, div_y - 6), (cx + 7, div_y), (cx, div_y + 6), (cx - 7, div_y)], fill=(185, 140, 75, 240))
    d.line([cx + 18, div_y, cx + 150, div_y], fill=(185, 140, 75, 200), width=2)

    # Title: "The Whispering Garden"
    title_text = "The Whispering Garden"
    bbox_title = d.textbbox((0, 0), title_text, font=font_title)
    title_w = bbox_title[2] - bbox_title[0]
    d.text((cx - title_w // 2, 245), title_text, fill=(44, 26, 16), font=font_title)

    # Subtitle: "Beneath The Ancient Oak"
    sub_text = "Beneath The Ancient Oak"
    bbox_sub = d.textbbox((0, 0), sub_text, font=font_sub)
    sub_w = bbox_sub[2] - bbox_sub[0]
    d.text((cx - sub_w // 2, 322), sub_text, fill=(172, 112, 44), font=font_sub)

    # Hairline divider
    d.line([cx - 180, 375, cx + 180, 375], fill=(215, 182, 134, 150), width=1)

    # 3. Story Paragraphs with Drop-Cap 'A'
    text_x = 175
    body_y = 440
    line_h = 44

    # Drop cap 'A'
    drop_x = text_x
    drop_y = body_y - 10
    d.text((drop_x, drop_y), "A", fill=(138, 38, 38), font=font_drop)

    indent_x = text_x + 92
    p1_lines = [
        "s the twilight deepened into a quiet indigo,",
        "two ancient oak trees leaned together like",
        "lifelong companions. In their sheltering leaves,",
        "the evening breeze carried echoes of forgotten",
        "and tender lullabies.",
    ]
    for i, line in enumerate(p1_lines):
        lx = indent_x if i < 3 else text_x
        ly = body_y + i * line_h
        d.text((lx, ly), line, fill=(48, 34, 22), font=font_body)

    # Paragraph 2
    p2_y = body_y + len(p1_lines) * line_h + 38
    p2_lines = [
        "Each fallen acorn held a seed of quiet dreams,",
        "and every rustling leaf was a soft whisper of the",
        "earth, gently reminding us: you have found your",
        "way home.",
    ]
    for i, line in enumerate(p2_lines):
        ly = p2_y + i * line_h
        d.text((text_x, ly), line, fill=(48, 34, 22), font=font_body)

    # Signature: "Forever in bloom..."
    sig_text = "Forever in bloom..."
    sig_y = p2_y + len(p2_lines) * line_h + 55
    d.text((text_x + 25, sig_y), sig_text, fill=(100, 55, 35), font=font_sig)

    # Punch 13 Precision Paper-Fiber Holes along the Left Spine Edge
    punch_holes(page, side='left')

    out_path = os.path.join(DEST_DIR, 'studio_page_underneath.jpg')
    page.convert('RGB').save(out_path, quality=96)
    print(f'Saved refined underneath page to {out_path} ({w}x{h})')

if __name__ == '__main__':
    build_cover()
    build_left_page()
    build_right_page()
    build_back_page()
    build_underneath_page()
    print('All refined editorial assets successfully built!')
