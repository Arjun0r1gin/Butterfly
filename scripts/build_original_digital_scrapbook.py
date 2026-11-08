"""
BUTTERFLY — Original Digital Scrapbook Generator & Architecture Demonstrator
Constructs an original, high-quality front-facing digital 3D scrapbook from scratch without using any book photographs:
1. Original dark walnut-brown leather cover with gold botanical tooling, saddle stitching & brass corners
2. Thick cream deckled parchment stacks with physical layered page thickness
3. 13-coil metallic brass double-wire spiral spring with specular highlights and depth
4. 13 precision punched holes on inner page margins aligned with the coil loops
5. Custom botanical watercolor floral corners (wild roses, leaves, golden filigree vines)
6. Subdivided 3D paper bending mesh (0%, 25%, 50%, 75%, 100% intermediate turning states)
7. Full scene integration in the sunset garden on the mossy stone boulder
"""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ART_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
GARDEN_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/garden'
BUTTERFLY_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/butterfly'

W, H = 1024, 576

# =============================================================================
# 1. GENERATE ORIGINAL WALNUT LEATHER COVER
# =============================================================================
def create_original_leather_cover():
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Leather bounding polygon (open book dimensions)
    # Left: 55, Right: 935 (clasp to 965), Top: 110, Bottom: 515
    cover_poly = [
        (65, 115), (490, 138), (512, 142), (534, 138), (925, 115),
        (940, 122), (946, 135), (946, 245),
        # Clasp tab
        (956, 245), (968, 255), (970, 275), (966, 295), (956, 305), (946, 305),
        (946, 495), (938, 508), (925, 515),
        (534, 492), (512, 488), (490, 492), (65, 515),
        (52, 508), (45, 495), (45, 135), (52, 122)
    ]

    # 1. Base drop shadow for cover
    sh_mask = Image.new('L', (W, H), 0)
    sh_d = ImageDraw.Draw(sh_mask)
    sh_d.polygon(cover_poly, fill=180)
    sh_mask = sh_mask.filter(ImageFilter.GaussianBlur(18))
    sh_layer = Image.new('RGBA', (W, H), (15, 8, 4, 0))
    sh_layer.putalpha(sh_mask)
    img.alpha_composite(sh_layer, (0, 12))

    # 2. Rich Walnut Brown Leather Gradient
    cov_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cov_d = ImageDraw.Draw(cov_layer)
    cov_d.polygon(cover_poly, fill=(58, 32, 18, 255))

    # Leather texture noise (fine natural pebble grain)
    random.seed(42)
    noise = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    n_pix = noise.load()
    for y in range(110, 520):
        for x in range(45, 970):
            if random.random() < 0.28:
                v = random.randint(35, 75)
                n_pix[x, y] = (v + 15, v, v - 10, random.randint(18, 40))
    cov_layer.alpha_composite(noise)

    # Leather edge bevel & 3D rim shading
    cov_d.polygon(cover_poly, outline=(35, 18, 8, 255), width=3)

    # 3. Gold Embossed Botanical Tooling Border (Floral vines along leather edge)
    tooling_inset = [
        (85, 132), (485, 152), (512, 155), (538, 152), (905, 132),
        (925, 142), (925, 488), (905, 498),
        (538, 478), (512, 475), (485, 478), (85, 498),
        (65, 488), (65, 142)
    ]
    cov_d.polygon(tooling_inset, outline=(195, 150, 70, 200), width=2)
    # Inner gold border
    tooling_inner = [
        (92, 138), (482, 158), (512, 161), (541, 158), (898, 138),
        (918, 148), (918, 482), (898, 492),
        (541, 472), (512, 469), (482, 472), (92, 492),
        (72, 482), (72, 148)
    ]
    cov_d.polygon(tooling_inner, outline=(160, 115, 45, 160), width=1)

    # 4. Realistic Saddle Stitching (Perimeter dashed thread)
    for i in range(len(tooling_inset)):
        p1 = tooling_inset[i]
        p2 = tooling_inset[(i + 1) % len(tooling_inset)]
        dist = math.hypot(p2[0] - p1[0], p2[1] - p1[1])
        steps = max(1, int(dist / 8))
        for s in range(0, steps, 2):
            t1 = s / steps
            t2 = min(1.0, (s + 0.9) / steps)
            sx1 = int(p1[0] + (p2[0] - p1[0]) * t1)
            sy1 = int(p1[1] + (p2[1] - p1[1]) * t1)
            sx2 = int(p1[0] + (p2[0] - p1[0]) * t2)
            sy2 = int(p1[1] + (p2[1] - p1[1]) * t2)
            cov_d.line([(sx1, sy1), (sx2, sy2)], fill=(225, 195, 130, 230), width=1)

    # 5. Antique Brass Corner Protectors (4 ornate corner brackets)
    def draw_brass_corner(cx, cy, flip_x, flip_y):
        corner = Image.new('RGBA', (70, 70), (0, 0, 0, 0))
        cd = ImageDraw.Draw(corner)
        # Victorian filigree L-shape
        bracket_poly = [(5, 5), (65, 5), (65, 22), (25, 25), (22, 65), (5, 65)]
        cd.polygon(bracket_poly, fill=(210, 165, 75, 255), outline=(120, 85, 30, 255), width=2)
        # Ornate emboss details
        cd.ellipse([(12, 12), (22, 22)], fill=(245, 215, 120, 255), outline=(90, 60, 20, 255))
        cd.ellipse([(35, 9), (43, 17)], fill=(180, 135, 50, 255))
        cd.ellipse([(9, 35), (17, 43)], fill=(180, 135, 50, 255))
        # Highlight rim
        cd.line([(6, 6), (64, 6)], fill=(255, 240, 170, 255), width=1)
        cd.line([(6, 6), (6, 64)], fill=(255, 240, 170, 255), width=1)

        if flip_x:
            corner = corner.transpose(Image.FLIP_LEFT_RIGHT)
        if flip_y:
            corner = corner.transpose(Image.FLIP_TOP_BOTTOM)
        return corner

    # Paste 4 corners
    c_tl = draw_brass_corner(0, 0, False, False)
    c_tr = draw_brass_corner(0, 0, True, False)
    c_bl = draw_brass_corner(0, 0, False, True)
    c_br = draw_brass_corner(0, 0, True, True)

    cov_layer.alpha_composite(c_tl, (45, 115))
    cov_layer.alpha_composite(c_tr, (875, 115))
    cov_layer.alpha_composite(c_bl, (45, 450))
    cov_layer.alpha_composite(c_br, (875, 450))

    # 6. Clasp Tab & Brass Snap Button
    # Clasp fastener button at x=955, y=275
    cov_d.ellipse([(948, 267), (964, 283)], fill=(235, 195, 90, 255), outline=(100, 65, 20, 255), width=2)
    cov_d.ellipse([(952, 271), (960, 279)], fill=(255, 235, 160, 255))

    img.alpha_composite(cov_layer)
    return img

# =============================================================================
# 2. GENERATE ORIGINAL LAYERED PAPER STACK
# =============================================================================
def create_original_paper_stack():
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Left Page Bounds: x=105..492, y=135..485
    # Right Page Bounds: x=532..918, y=135..485
    # Render 4 layered page tiers beneath top surface to create authentic paper thickness
    tiers = [
        # (offset_x, offset_y, fill_color, alpha)
        (7, 6, (215, 195, 160), 220),
        (5, 4, (225, 208, 175), 230),
        (3, 2, (235, 220, 190), 240),
        (1, 1, (245, 232, 205), 255),
    ]

    for ox, oy, col, alpha in tiers:
        # Left stack rim
        d.rounded_rectangle([105 - ox, 135 - oy, 492, 485 + oy], radius=4, fill=(*col, alpha), outline=(160, 135, 100, 180))
        # Right stack rim
        d.rounded_rectangle([532, 135 - oy, 918 + ox, 485 + oy], radius=4, fill=(*col, alpha), outline=(160, 135, 100, 180))

    # Deckled paper edge noise for natural organic paper rim
    random.seed(99)
    edge_noise = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    en_d = ImageDraw.Draw(edge_noise)
    for y in range(130, 490, 3):
        # Left outer deckle
        off_l = random.randint(-2, 3)
        en_d.rectangle([(102 + off_l, y), (106, y + 2)], fill=(180, 155, 120, 150))
        # Right outer deckle
        off_r = random.randint(-3, 2)
        en_d.rectangle([(918, y), (922 + off_r, y + 2)], fill=(180, 155, 120, 150))

    img.alpha_composite(edge_noise)

    # Top paper surface: Warm Cotton Cream Parchment
    # Left Page Top Surface
    d.rounded_rectangle([110, 138, 492, 480], radius=4, fill=(250, 242, 224, 255))
    # Right Page Top Surface
    d.rounded_rectangle([532, 138, 914, 480], radius=4, fill=(250, 242, 224, 255))

    # Inner spine shadow (depth where pages meet the spiral binding)
    spine_sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    s_d = ImageDraw.Draw(spine_sh)
    # Left page inner shadow
    for sx in range(450, 495):
        fade = (sx - 450) / 45.0
        s_d.line([(sx, 138), (sx, 480)], fill=(80, 45, 15, int(45 * fade)))
    # Right page inner shadow
    for sx in range(532, 577):
        fade = (577 - sx) / 45.0
        s_d.line([(sx, 138), (sx, 480)], fill=(80, 45, 15, int(45 * fade)))
    img.alpha_composite(spine_sh)

    # 13 Precision Punched Oval Perforations
    # Holes along left page at x=482..490, right page at x=534..542
    hole_y_start = 152
    hole_spacing = 25.5
    for i in range(13):
        hy = int(hole_y_start + i * hole_spacing)
        # Left page hole
        d.ellipse([(482, hy - 4), (490, hy + 4)], fill=(45, 25, 12, 255), outline=(130, 95, 60, 200), width=1)
        # Right page hole
        d.ellipse([(534, hy - 4), (542, hy + 4)], fill=(45, 25, 12, 255), outline=(130, 95, 60, 200), width=1)

    return img

# =============================================================================
# 3. GENERATE ORIGINAL 3D METALLIC BRASS SPIRAL BINDING
# =============================================================================
def create_original_brass_spiral():
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    hole_y_start = 152
    hole_spacing = 25.5

    for i in range(13):
        cy = int(hole_y_start + i * hole_spacing)
        # Twin-wire spiral: 2 wire passes per hole
        for offset_wire in [-2.5, 2.5]:
            wy = cy + offset_wire

            # Drop shadow behind wire loop
            d.arc([(480, wy - 9), (544, wy + 9)], start=160, end=380, fill=(20, 10, 5, 140), width=4)

            # Outer metallic brass body
            d.arc([(482, wy - 8), (542, wy + 8)], start=170, end=370, fill=(185, 140, 55, 255), width=3)
            # Specular light gleam on crest of loop (sunset light catch)
            d.arc([(496, wy - 8), (528, wy + 6)], start=210, end=330, fill=(255, 245, 180, 255), width=2)
            # White highlight peak
            d.arc([(506, wy - 8), (518, wy + 4)], start=240, end=300, fill=(255, 255, 240, 255), width=1)

    return img

# =============================================================================
# 4. GENERATE ORIGINAL BOTANICAL FLORAL CORNER DECORATIONS
# =============================================================================
def draw_botanical_corner(size=(110, 110), flip_h=False, flip_v=False):
    canvas = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(canvas)

    # Delicate golden filigree vine
    d.arc([(-10, -10), (85, 85)], start=0, end=90, fill=(190, 150, 70, 220), width=1)
    d.arc([(10, 10), (75, 75)], start=15, end=75, fill=(170, 130, 55, 180), width=1)

    # Wildflower rose petals (Hand-painted watercolor aesthetic)
    petal_colors = [
        (248, 160, 175, 240), # Soft pink
        (242, 135, 155, 240), # Deep pink
        (255, 190, 205, 220), # Rose highlight
        (230, 110, 135, 255), # Core shadow
    ]

    center_x, center_y = 42, 42
    # 5 wild rose petals around blossom center
    for a in range(5):
        angle = a * (math.pi * 2 / 5) - math.pi / 2
        px = center_x + math.cos(angle) * 16
        py = center_y + math.sin(angle) * 16
        # Heart-shaped round petal
        d.ellipse([(px - 10, py - 10), (px + 10, py + 10)], fill=petal_colors[a % len(petal_colors)], outline=(210, 95, 120, 160))

    # Golden stamen center
    d.ellipse([(center_x - 6, center_y - 6), (center_x + 6, center_y + 6)], fill=(245, 205, 70, 255), outline=(160, 110, 30, 255))

    # Watercolor green leaves & sprigs
    leaf_color = (115, 155, 75, 230)
    leaf_dark = (85, 125, 50, 240)

    # Leaf 1 extending outward
    d.polygon([(center_x + 18, center_y + 8), (center_x + 36, center_y + 12), (center_x + 24, center_y + 24)], fill=leaf_color, outline=leaf_dark)
    # Leaf 2 extending upward
    d.polygon([(center_x + 8, center_y + 18), (center_x + 12, center_y + 36), (center_x + 24, center_y + 24)], fill=leaf_color, outline=leaf_dark)
    # Leaf 3 extending inward
    d.polygon([(center_x - 14, center_y + 12), (center_x - 28, center_y + 22), (center_x - 12, center_y + 26)], fill=leaf_color, outline=leaf_dark)

    # Soft watercolor bleed blur
    canvas = canvas.filter(ImageFilter.GaussianBlur(0.4))

    if flip_h:
        canvas = canvas.transpose(Image.FLIP_LEFT_RIGHT)
    if flip_v:
        canvas = canvas.transpose(Image.FLIP_TOP_BOTTOM)
    return canvas

# =============================================================================
# 5. ASSEMBLE COMPLETE ORIGINAL OPEN SCRAPBOOK (PROPOSAL DELIVERABLE 1)
# =============================================================================
print("Constructing Original Open Scrapbook Design...")
cover_img = create_original_leather_cover()
stack_img = create_original_paper_stack()
spiral_img = create_original_brass_spiral()

# Corners
c_tl = draw_botanical_corner((100, 100), False, False)
c_bl = draw_botanical_corner((100, 100), False, True)
c_tr = draw_botanical_corner((100, 100), True, False)
c_br = draw_botanical_corner((100, 100), True, True)

full_book = Image.new('RGBA', (W, H), (0, 0, 0, 0))
full_book.alpha_composite(cover_img)
full_book.alpha_composite(stack_img)

# Paste original botanical corners on pages
full_book.alpha_composite(c_tl, (115, 142))
full_book.alpha_composite(c_bl, (115, 385))
full_book.alpha_composite(c_tr, (815, 142))
full_book.alpha_composite(c_br, (815, 385))

# Top layer: 3D brass spiral
full_book.alpha_composite(spiral_img)

out_book = os.path.join(ART_DIR, 'original_complete_open_book_design.png')
full_book.save(out_book, 'PNG')
print("Saved:", out_book)

# =============================================================================
# 6. DETAILS ZOOM (PROPOSAL DELIVERABLES 2 & 3)
# =============================================================================
# Leather cover construction detail (Corner filigree, stitching, gold tooling, walnut leather grain)
leather_detail = cover_img.crop((35, 105, 300, 320)).resize((530, 430), Image.LANCZOS)
out_l_detail = os.path.join(ART_DIR, 'original_leather_cover_detail.png')
leather_detail.save(out_l_detail, 'PNG')
print("Saved:", out_l_detail)

# Spiral & punched holes construction detail
spiral_detail = full_book.crop((460, 140, 560, 480)).resize((400, 680), Image.LANCZOS)
out_sp_detail = os.path.join(ART_DIR, 'original_paper_stack_and_spiral_detail.png')
spiral_detail.save(out_sp_detail, 'PNG')
print("Saved:", out_sp_detail)

# Botanical watercolor flower detail
flower_detail = c_tl.resize((350, 350), Image.LANCZOS)
out_fl_detail = os.path.join(ART_DIR, 'original_botanical_corner_ornaments.png')
flower_detail.save(out_fl_detail, 'PNG')
print("Saved:", out_fl_detail)

# =============================================================================
# 7. SUBDIVIDED 3D MESH PAGE-TURN SIMULATION (PROPOSAL DELIVERABLE 4)
# =============================================================================
print("Generating Subdivided 3D Mesh Page-Turn Demonstration States...")

# Create crisp front and back pages
pw, ph = 380, 340
front_page = Image.new('RGBA', (pw, ph), (250, 242, 224, 255))
fd = ImageDraw.Draw(front_page)
# Right floral corners
front_page.alpha_composite(c_tr, (pw - 100, 4))
front_page.alpha_composite(c_br, (pw - 100, ph - 100))
# Right narrative text (safe-area margins clearing floral borders)
fd.text((45, 52), 'CHAPTER I', fill=(120, 55, 20))
fd.text((45, 78), 'Where The Light Touches', fill=(40, 20, 10))
fd.text((45, 104), 'The Twilight Garden', fill=(145, 70, 25))
fd.text((45, 138), 'O', fill=(160, 30, 30))
fd.text((68, 142), 'nce upon a quiet evening, when the sun dipped low', fill=(55, 30, 15))
fd.text((45, 168), 'beneath the amber horizon, a small gentle gift opened in', fill=(55, 30, 15))
fd.text((45, 192), 'the heart of the garden. From its glowing center, a symphony', fill=(55, 30, 15))
fd.text((45, 216), 'of colorful blossoms took flight.', fill=(55, 30, 15))
fd.text((45, 252), 'With gentle wonder, forever.', fill=(120, 55, 20))

back_page = Image.new('RGBA', (pw, ph), (250, 242, 224, 255))
bd = ImageDraw.Draw(back_page)
# Left floral corners
back_page.alpha_composite(c_tl, (4, 4))
back_page.alpha_composite(c_bl, (4, ph - 100))
# Polaroid frame
bd.rectangle([(45, 60), (170, 195)], fill=(255, 255, 255, 245), outline=(210, 190, 165, 255))
bd.rectangle([(55, 70), (160, 160)], fill=(254, 215, 170, 255))
bd.text((58, 170), 'Sunshine Walk', fill=(80, 45, 20))
# Washi tape
bd.rectangle([(80, 52), (135, 66)], fill=(244, 165, 185, 220))
bd.text((45, 230), '"Every wildflower seemed to lean in..."', fill=(75, 45, 20))

def render_mesh_turn_state(t):
    """
    Renders 3D subdivided mesh page turning at progress t in [0.0, 1.0]:
    - Outer edge lifts first
    - Euler elastica cylindrical paper arch
    - Dynamic cast contact shadow on left stack
    - Reverse side exposure
    - Underlying page revealed
    """
    canvas = full_book.copy()
    spine_x = 512
    page_y = 138

    if t < 0.005:
        return canvas

    # Draw underlying next right page
    canvas.alpha_composite(front_page, (532, page_y))

    # Dynamic contact cast shadow on left page stack
    if t > 0.01 and t < 0.99:
        arch = math.sin(t * math.pi)
        sh_w = int(360 * (0.24 + 0.76 * min(1.0, t * 1.4)))
        sh_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(sh_img)
        poly = [
            (spine_x - 15, page_y + 12),
            (spine_x - 15 - sh_w, page_y + 25 + int(arch * 10)),
            (spine_x - 15 - sh_w - 20, page_y + ph - 15),
            (spine_x - 15, page_y + ph - 5)
        ]
        sh_d.polygon(poly, fill=(20, 10, 5, int(135 * arch)))
        sh_img = sh_img.filter(ImageFilter.GaussianBlur(15))
        canvas.alpha_composite(sh_img)

    if t > 0.995:
        # Settled on left stack
        canvas.alpha_composite(back_page, (112, page_y))
        canvas.alpha_composite(spiral_img)
        return canvas

    # Subdivided Mesh Deformation (64 vertical vertex columns)
    N = 64
    arch = math.sin(t * math.pi)
    mesh_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))

    for i in range(N):
        u0 = i / N
        # Cylindrical curvature angle
        phi = math.pi * t * (1.0 - math.pow(1.0 - u0, 1.35))
        cos_p = math.cos(phi)

        # 3D Arch displacement
        arch_h = 36 * arch * math.sin(u0 * math.pi)
        px = int(spine_x + 20 + (1.0 - u0) * pw * cos_p * (1.0 - 0.12 * arch))
        py = int(page_y - arch_h)

        sw = max(2, int((pw / N) * abs(cos_p) + 1.2))
        sh = int(ph + arch_h * 0.45)

        src_x = int(u0 * pw)
        src_w = max(1, int(pw / N))

        # Select front face or reverse face
        if cos_p >= 0:
            slice_img = front_page.crop((src_x, 0, min(pw, src_x + src_w), ph))
        else:
            # Reverse face flipped horizontally
            rev_x = pw - (src_x + src_w)
            slice_img = back_page.crop((max(0, rev_x), 0, min(pw, rev_x + src_w), ph)).transpose(Image.FLIP_LEFT_RIGHT)

        slice_img = slice_img.resize((sw, sh), Image.LANCZOS)

        # Dynamic lighting: specular ridge highlight & ambient curl shadow
        shading = Image.new('RGBA', (sw, sh), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(shading)
        if abs(cos_p) < 0.28 and arch > 0.15:
            hl_alpha = int(95 * (1.0 - abs(cos_p) / 0.28) * arch)
            sh_d.rectangle([(0, 0), (sw, sh)], fill=(255, 245, 220, hl_alpha))
        elif cos_p < 0:
            amb_alpha = int(55 * arch)
            sh_d.rectangle([(0, 0), (sw, sh)], fill=(40, 20, 10, amb_alpha))

        slice_img.alpha_composite(shading)
        mesh_layer.alpha_composite(slice_img, (px, py))

    canvas.alpha_composite(mesh_layer)
    # Metallic spiral remains on top
    canvas.alpha_composite(spiral_img)
    return canvas

# Save intermediate turn states
for pct in [0, 25, 50, 75, 100]:
    st_img = render_mesh_turn_state(pct / 100.0)
    out_st = os.path.join(ART_DIR, f'original_mesh_turn_stage_{pct:03d}.png')
    st_img.save(out_st, 'PNG')
    print(f"Saved: {out_st}")

# Create combined 5-stage turn sequence sheet
turn_sheet = Image.new('RGBA', (W * 2, H * 3), (240, 235, 225, 255))
st0 = render_mesh_turn_state(0.0).resize((W, H))
st25 = render_mesh_turn_state(0.25).resize((W, H))
st50 = render_mesh_turn_state(0.50).resize((W, H))
st75 = render_mesh_turn_state(0.75).resize((W, H))
st100 = render_mesh_turn_state(1.0).resize((W, H))

turn_sheet.alpha_composite(st0, (0, 0))
turn_sheet.alpha_composite(st25, (W, 0))
turn_sheet.alpha_composite(st50, (0, H))
turn_sheet.alpha_composite(st75, (W, H))
turn_sheet.alpha_composite(st100, (W // 2, H * 2))

out_sheet = os.path.join(ART_DIR, 'original_subdivided_mesh_page_turn.png')
turn_sheet.save(out_sheet, 'PNG')
print("Saved:", out_sheet)

# =============================================================================
# 8. FULL SCENE IN SUNSET GARDEN ON MOSSY BOULDER (PROPOSAL DELIVERABLE 5)
# =============================================================================
print("Compositing Original Book in Sunset Garden on Mossy Boulder...")
garden_master = Image.open(os.path.join(GARDEN_DIR, 'garden_base_master.png')).convert('RGBA')
bf_full = Image.open(os.path.join(BUTTERFLY_DIR, 'butterfly_full.png')).convert('RGBA')

# Grounded Mossy Boulder underneath the book
scene = garden_master.copy()
# Create grounded mossy boulder foundation at bottom center
boulder = Image.new('RGBA', (W, H), (0, 0, 0, 0))
b_d = ImageDraw.Draw(boulder)
boulder_poly = [
    (140, 520), (220, 480), (512, 470), (810, 480), (890, 520),
    (960, 576), (60, 576)
]
b_d.polygon(boulder_poly, fill=(90, 80, 65, 255))
# Moss green texture on stone
b_d.polygon([(180, 510), (320, 485), (512, 478), (720, 485), (840, 510)], fill=(95, 115, 60, 210))
boulder = boulder.filter(ImageFilter.GaussianBlur(3.5))

# Composite boulder, then book, then butterfly
scene.alpha_composite(boulder)

# Scale book to occupy ~82% width of viewport (commanding focal point)
book_scale = 0.88
bw = int(W * book_scale)
bh = int(H * book_scale)
book_scaled = full_book.resize((bw, bh), Image.LANCZOS)
bx = (W - bw) // 2
by = int(H * 0.14)
scene.alpha_composite(book_scaled, (bx, by))

# Storybook Painted Lady Butterfly hovering gracefully near top-right corner
bf_scale = 0.58
bf_w = int(bf_full.width * bf_scale)
bf_h = int(bf_full.height * bf_scale)
bf_res = bf_full.resize((bf_w, bf_h), Image.LANCZOS).rotate(8, expand=True)
scene.alpha_composite(bf_res, (bx + int(bw * 0.76), by - 35))

out_scene = os.path.join(ART_DIR, 'original_book_in_sunset_garden.png')
scene.save(out_scene, 'PNG')
print("Saved:", out_scene)

# =============================================================================
# 9. 32-FRAME ANIMATED MOTION RECORDING (PROPOSAL DELIVERABLE 6)
# =============================================================================
print("Rendering 32-Frame Fluid Animated GIF Recording of Original Page Turn...")
anim_frames = []
# Forward turn (0 to 1) in 18 frames
for f in range(19):
    t = f / 18.0
    f_img = render_mesh_turn_state(t).resize((640, 360), Image.LANCZOS)
    anim_frames.append(f_img.convert('RGB'))
# Pause on settled left stack
for _ in range(4):
    anim_frames.append(anim_frames[-1])
# Reverse scrub turn (1 to 0) in 10 frames
for f in range(11):
    t = 1.0 - (f / 10.0)
    f_img = render_mesh_turn_state(t).resize((640, 360), Image.LANCZOS)
    anim_frames.append(f_img.convert('RGB'))

out_gif = os.path.join(ART_DIR, 'original_page_turn_animation.gif')
anim_frames[0].save(
    out_gif,
    save_all=True,
    append_images=anim_frames[1:],
    duration=90,
    loop=0
)
print("Saved:", out_gif)
print("ALL ORIGINAL DIGITAL SCRAPBOOK DELIVERABLES COMPLETE!")

