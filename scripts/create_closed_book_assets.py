"""
Generates the photorealistic closed book textures for BUTTERFLY with:
- Walnut leather texture
- Real botanical gold vines
- Clean brass ornamental corner brackets
- Stitched leather strap & brass button
- Deckled parchment paper stack edges
- Antique brass double-loop spiral with punched holes
- Natural drop shadow
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

PUBLIC_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public'
SB_DIR = os.path.join(PUBLIC_DIR, 'storybook')

cov_img = Image.open(os.path.join(SB_DIR, 'studio_cover_walnut.jpg')).convert('RGBA')
bb_img = Image.open(os.path.join(SB_DIR, 'book_backdrop.png')).convert('RGBA')

# Target closed book dimensions
BW, BH = 760, 860
SH_PAD = 40
CANVAS_W = BW + SH_PAD * 2
CANVAS_H = BH + SH_PAD * 2

def draw_brass_corner(img, x, y, size=85, rotation=0):
    corner = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cd = ImageDraw.Draw(corner)
    
    # Golden brass triangular bracket with filigree
    pts = [(0, 0), (size, 0), (size, int(size*0.25)), (int(size*0.4), int(size*0.4)), (int(size*0.25), size), (0, size)]
    cd.polygon(pts, fill=(195, 145, 55, 255), outline=(90, 50, 18, 255))
    
    # Inner gold border
    pts_in = [(4, 4), (size - 8, 4), (size - 8, int(size*0.20)), (int(size*0.35), int(size*0.35)), (int(size*0.20), size - 8), (4, size - 8)]
    cd.polygon(pts_in, outline=(245, 205, 95, 255), width=2)
    
    # Bevel highlight on outer edge
    cd.line([(2, 2), (size - 4, 2)], fill=(255, 240, 180, 240), width=2)
    cd.line([(2, 2), (2, size - 4)], fill=(255, 240, 180, 240), width=2)
    
    # Rivet pins
    for rx, ry in [(int(size*0.2), int(size*0.2)), (int(size*0.65), 14), (14, int(size*0.65))]:
        cd.ellipse([rx - 4, ry - 4, rx + 4, ry + 4], fill=(130, 85, 30, 255))
        cd.ellipse([rx - 3, ry - 3, rx + 3, ry + 3], fill=(235, 195, 95, 255))
        cd.arc([rx - 3, ry - 3, rx + 3, ry + 3], start=200, end=340, fill=(255, 255, 220, 255), width=1)
        
    # Rotate if needed
    if rotation != 0:
        corner = corner.rotate(rotation, expand=True, resample=Image.Resampling.BICUBIC)
        
    img.alpha_composite(corner, (x, y))

def build_closed_book():
    comp = Image.new('RGBA', (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    
    # 1. Ground Drop Shadow
    shadow = Image.new('RGBA', (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [SH_PAD + 25, SH_PAD + 40, CANVAS_W - SH_PAD + 20, CANVAS_H - SH_PAD + 25],
        radius=32,
        fill=(10, 5, 2, 190)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(30))
    comp.alpha_composite(shadow, (0, 0))
    
    # 2. Back Cover Leather
    back = Image.new('RGBA', (BW, BH), (0, 0, 0, 0))
    bd = ImageDraw.Draw(back)
    bd.rounded_rectangle([25, 10, BW - 30, BH - 8], radius=20, fill=(42, 20, 11, 255), outline=(22, 10, 5, 255), width=2)
    comp.alpha_composite(back, (SH_PAD + 6, SH_PAD + 6))
    
    # 3. Stacked Deckled Parchment Block (bottom and right edges)
    stack = Image.new('RGBA', (BW, BH), (0, 0, 0, 0))
    std = ImageDraw.Draw(stack)
    rx = BW - 52
    by = BH - 24
    for i in range(22):
        off = i * 1.1
        c = 244 - (i % 4) * 8
        std.line([rx - off, 30 + i, rx - off, by - off], fill=(c, c - 10, c - 24, 255), width=1)
        std.line([50 + off, by - off, rx - off, by - off], fill=(c, c - 10, c - 24, 255), width=1)
    stack = stack.filter(ImageFilter.GaussianBlur(0.8))
    comp.alpha_composite(stack, (SH_PAD, SH_PAD))
    
    # 4. Front Leather Hardcover
    cover = Image.new('RGBA', (BW, BH), (0, 0, 0, 0))
    mask = Image.new('L', (BW, BH), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([25, 10, BW - 40, BH - 12], radius=18, fill=255)
    
    leather = cov_img.crop((300, 200, 1300, 700)).resize((BW, BH), Image.Resampling.LANCZOS)
    cover.paste(leather, (0, 0), mask)
    
    cd = ImageDraw.Draw(cover)
    # Subtle 3D leather rim lighting
    cd.rounded_rectangle([25, 10, BW - 40, BH - 12], radius=18, outline=(255, 230, 180, 50), width=2)
    cd.rounded_rectangle([27, 12, BW - 42, BH - 14], radius=16, outline=(20, 10, 5, 110), width=2)
    
    # Gold foil perimeter border
    cd.rounded_rectangle([44, 28, BW - 56, BH - 28], radius=12, outline=(210, 165, 80, 190), width=2)
    cd.rounded_rectangle([50, 34, BW - 62, BH - 34], radius=8, outline=(245, 205, 110, 140), width=1)
    
    # Composite Real Botanical Gold Vines along left and right margins
    # Left vine:
    vine_l = bb_img.crop((92, 120, 126, 450)).resize((30, BH - 140), Image.Resampling.LANCZOS)
    cover.alpha_composite(vine_l, (58, 65))
    # Right vine:
    vine_r = bb_img.crop((896, 120, 930, 450)).resize((30, BH - 140), Image.Resampling.LANCZOS)
    cover.alpha_composite(vine_r, (BW - 88, 65))
    
    # Brass Filigree Corners (4 corners, perfectly styled)
    draw_brass_corner(cover, 24, 9, size=85, rotation=0)         # Top-Left
    draw_brass_corner(cover, BW - 126, 9, size=85, rotation=270) # Top-Right
    draw_brass_corner(cover, 24, BH - 98, size=85, rotation=90)  # Bottom-Left
    draw_brass_corner(cover, BW - 126, BH - 98, size=85, rotation=180) # Bottom-Right
    
    # Central Embossed Gold Vignette & Medallion
    cx, cy = BW // 2 - 8, BH // 2 - 15
    cd.ellipse([cx - 165, cy - 205, cx + 165, cy + 205], outline=(225, 185, 95, 190), width=2)
    cd.ellipse([cx - 157, cy - 197, cx + 157, cy + 197], outline=(175, 130, 55, 140), width=1)
    
    # Laurel Leaves around oval
    for a in range(0, 360, 20):
        rad = math.radians(a)
        rx = cx + int(161 * math.cos(rad))
        ry = cy + int(201 * math.sin(rad))
        cd.ellipse([rx - 4, ry - 6, rx + 4, ry + 6], fill=(235, 195, 105, 180), outline=(150, 105, 40, 200))
        
    # Central Butterfly Silhouette Emblem
    cd.ellipse([cx - 16, cy - 48, cx + 16, cy - 16], fill=(245, 205, 115, 230), outline=(175, 130, 55, 240))
    cd.polygon([(cx - 36, cy - 62), (cx - 10, cy - 38), (cx - 22, cy - 20)], fill=(235, 190, 95, 210))
    cd.polygon([(cx + 36, cy - 62), (cx + 12, cy - 38), (cx + 22, cy - 20)], fill=(235, 190, 95, 210))
    cd.polygon([(cx - 28, cy - 12), (cx - 8, cy - 28), (cx - 16, cy - 38)], fill=(215, 170, 75, 190))
    cd.polygon([(cx + 28, cy - 12), (cx + 8, cy - 28), (cx + 16, cy - 38)], fill=(215, 170, 75, 190))
    
    # Elegant Serif Title Typography
    try:
        font_lg = ImageFont.truetype("/usr/share/fonts/dejavu/DejaVuSerif.ttf", 26)
        font_sm = ImageFont.truetype("/usr/share/fonts/dejavu/DejaVuSerif-Italic.ttf", 16)
        font_ch = ImageFont.truetype("/usr/share/fonts/dejavu/DejaVuSerif.ttf", 13)
    except:
        font_lg = ImageFont.load_default()
        font_sm = ImageFont.load_default()
        font_ch = ImageFont.load_default()
        
    cd.text((cx, cy + 30), "THE MEMORY BOOK", font=font_lg, fill=(18, 9, 4, 220), anchor="mm")
    cd.text((cx, cy + 28), "THE MEMORY BOOK", font=font_lg, fill=(255, 225, 140, 250), anchor="mm")
    
    cd.text((cx, cy + 68), "Where The Light Touches", font=font_sm, fill=(18, 9, 4, 200), anchor="mm")
    cd.text((cx, cy + 67), "Where The Light Touches", font=font_sm, fill=(235, 195, 115, 230), anchor="mm")
    
    cd.text((cx, cy + 115), "— VINTAGE BOTANICAL ALBUM —", font=font_ch, fill=(195, 150, 70, 190), anchor="mm")
    
    # 5. Stitched Leather Strap Clasp with Polished Brass Dome Rivet
    clasp_x = BW - 60
    clasp_y = BH // 2 - 40
    # Clasp shadow onto cover
    cs = Image.new('RGBA', (70, 90), (0, 0, 0, 0))
    csd = ImageDraw.Draw(cs)
    csd.rounded_rectangle([0, 5, 65, 85], radius=16, fill=(10, 5, 2, 140))
    cs = cs.filter(ImageFilter.GaussianBlur(6))
    cover.alpha_composite(cs, (clasp_x - 5, clasp_y))
    
    # Strap itself
    strap = Image.new('RGBA', (70, 80), (0, 0, 0, 0))
    std = ImageDraw.Draw(strap)
    std.rounded_rectangle([0, 0, 68, 78], radius=16, fill=(110, 55, 30, 255), outline=(55, 25, 12, 255), width=2)
    std.rounded_rectangle([4, 4, 64, 74], radius=12, outline=(235, 195, 110, 180), width=1) # stitching
    
    # Golden brass dome rivet button
    std.ellipse([22, 22, 54, 54], fill=(225, 175, 75, 255), outline=(125, 80, 28, 255), width=2)
    std.ellipse([24, 24, 52, 52], fill=(255, 220, 120, 255))
    std.arc([25, 25, 51, 51], start=200, end=340, fill=(255, 255, 230, 255), width=2) # highlight
    
    cover.alpha_composite(strap, (clasp_x, clasp_y))
    
    # Composite front cover onto canvas
    comp.alpha_composite(cover, (SH_PAD, SH_PAD))
    
    # 6. Antique-Brass Spiral Binding along the Left Spine
    spiral_w = 56
    spiral_h = BH - 60
    spiral_img = Image.new('RGBA', (spiral_w, spiral_h), (0, 0, 0, 0))
    spd = ImageDraw.Draw(spiral_img)
    
    coil_count = 14
    start_y = 15
    end_y = spiral_h - 15
    step_y = (end_y - start_y) / (coil_count - 1)
    
    for i in range(coil_count):
        cy = start_y + i * step_y
        for wire_off in [-3.5, 3.5]:
            wy = cy + wire_off
            # Punched hole shadow
            spd.ellipse([16, wy - 5, 28, wy + 5], fill=(12, 6, 3, 220))
            # Ring shadow
            spd.ellipse([4, wy - 9, 50, wy + 9], outline=(15, 8, 4, 160), width=3)
            # Brass metallic base
            spd.ellipse([4, wy - 10, 50, wy + 8], outline=(185, 135, 50, 255), width=4)
            # Gold bright rim
            spd.ellipse([5, wy - 10, 49, wy + 8], outline=(245, 195, 80, 255), width=2)
            # Specular reflection
            spd.arc([5, wy - 11, 49, wy + 7], start=190, end=350, fill=(255, 250, 220, 240), width=2)
            
    spiral_x = SH_PAD + 10
    spiral_y = SH_PAD + 30
    comp.alpha_composite(spiral_img, (spiral_x, spiral_y))
    
    return comp, cover

closed_book_full, front_cover_flap = build_closed_book()
full_path = os.path.join(SB_DIR, 'closed_book_full.png')
closed_book_full.save(full_path, 'PNG')
print(f"Refined closed book saved to {full_path}")

flap_path = os.path.join(SB_DIR, 'closed_book_cover_flap.png')
front_cover_flap.save(flap_path, 'PNG')
print(f"Refined front cover flap saved to {flap_path}")
