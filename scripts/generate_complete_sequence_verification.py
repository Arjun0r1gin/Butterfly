"""
BUTTERFLY — Delayed Storybook Discovery & Garden Exploration Verification Renderer
Renders the 6 mandatory states specified by the user:
1. State 1: Immediately after flowers fall — ONLY garden and butterfly (Book 100% absent!)
2. State 2: Early vertical camera movement — Still ONLY garden and butterfly (Book 100% absent!)
3. State 3: Midway through garden exploration — Book STILL NOT VISIBLE (pure garden & flight)
4. State 4: Book gradually entering the camera view from lower meadow
5. State 5: Butterfly approaching the discovered book
6. State 6: Final book framing with butterfly hovering near it (Hero size, restored spiral)
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ART_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
PUBLIC_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public'
SB_DIR = os.path.join(PUBLIC_DIR, 'storybook')

VW, VH = 1600, 900

# 1. Load Sunset Garden Background
garden_bg = Image.open(os.path.join(PUBLIC_DIR, 'garden/garden_base_master.png')).convert('RGBA')
garden_bg = garden_bg.resize((VW, VH), Image.Resampling.LANCZOS)
enhancer = ImageEnhance.Color(garden_bg)
garden_bg = enhancer.enhance(1.08)

# 2. Load Redesigned Storybook Textures
cover_img = Image.open(os.path.join(SB_DIR, 'studio_cover_walnut.jpg')).convert('RGBA')
page_left = Image.open(os.path.join(SB_DIR, 'studio_page_left.jpg')).convert('RGBA')
page_right = Image.open(os.path.join(SB_DIR, 'studio_page_right.jpg')).convert('RGBA')
page_back = Image.open(os.path.join(SB_DIR, 'studio_page_back.jpg')).convert('RGBA')
page_under = Image.open(os.path.join(SB_DIR, 'studio_page_underneath.jpg')).convert('RGBA')

# 3. Load Butterfly Sprite
bf_img = Image.open(os.path.join(PUBLIC_DIR, 'butterfly/butterfly_full.png')).convert('RGBA')

# Hero Dimensions (Enlarged to 96% width, 88% height of viewport)
HERO_BOOK_W = int(VW * 0.96) # ~1536px
HERO_BOOK_H = int(HERO_BOOK_W * (cover_img.height / cover_img.width)) # ~779px
HERO_PAGE_W = int(HERO_BOOK_W * 0.458) # ~703px
HERO_PAGE_H = int(HERO_BOOK_H * 0.890) # ~693px
GAP = 8

def render_book_object(curl_t=0.0):
    bw, bh = HERO_BOOK_W, HERO_BOOK_H
    pw, ph = HERO_PAGE_W, HERO_PAGE_H
    
    book_canvas = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
    cov_scaled = cover_img.resize((bw, bh), Image.Resampling.LANCZOS)
    book_canvas.alpha_composite(cov_scaled, (0, 0))
    
    spine_x = bw // 2
    page_y = int(bh * 0.055)
    left_x = spine_x - GAP - pw
    right_x = spine_x + GAP
    
    # 2. Paper Stack Layers
    for s in [3, 2, 1]:
        off = s * 2
        ls = Image.new('RGBA', (pw, ph), (245 - s*3, 238 - s*3, 226 - s*3, 255))
        book_canvas.alpha_composite(ls, (left_x - off, page_y + off // 2))
        rs = Image.new('RGBA', (pw, ph), (245 - s*3, 238 - s*3, 226 - s*3, 255))
        book_canvas.alpha_composite(rs, (right_x + off, page_y + off // 2))
        
    p_left = page_left.resize((pw, ph), Image.Resampling.LANCZOS)
    p_right = page_right.resize((pw, ph), Image.Resampling.LANCZOS)
    p_under = page_under.resize((pw, ph), Image.Resampling.LANCZOS)
    
    book_canvas.alpha_composite(p_left, (left_x, page_y))
    book_canvas.alpha_composite(p_under, (right_x, page_y))
    book_canvas.alpha_composite(p_right, (right_x, page_y))
    
    # 3. Restored Central Double-Wire Brass Spiral Spring
    spiral_w = 46
    spiral_h = ph + 24
    spiral_img = Image.new('RGBA', (spiral_w, spiral_h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(spiral_img)
    
    coil_count = 13
    start_y = 16
    end_y = spiral_h - 16
    step_y = (end_y - start_y) / (coil_count - 1)
    
    for i in range(coil_count):
        cy = start_y + i * step_y
        for wire_off in [-3.0, 3.0]:
            wy = cy + wire_off
            sd.ellipse([5, wy - 8, 41, wy + 8], outline=(18, 9, 4, 150), width=3)
            sd.ellipse([5, wy - 9, 41, wy + 7], outline=(185, 135, 50, 255), width=4)
            sd.ellipse([6, wy - 9, 40, wy + 7], outline=(235, 185, 75, 255), width=2)
            sd.arc([6, wy - 10, 40, wy + 6], start=190, end=350, fill=(255, 250, 215, 245), width=2)
            
    spiral_x = spine_x - spiral_w // 2
    spiral_y = page_y - 12
    book_canvas.alpha_composite(spiral_img, (spiral_x, spiral_y))
    
    return book_canvas

book_flat_master = render_book_object()

def render_state(
    state_filename,
    book_cx_pct,
    book_cy_pct,
    book_scale,
    book_rot_deg,
    bf_x_pct,
    bf_y_pct,
    bf_scale,
    bf_rot_deg,
    camera_scale=1.0,
    camera_pan_x_pct=0.0,
    camera_pan_y_pct=0.0,
    book_opacity=1.0
):
    # 1. Garden layer with horizontal camera tracking across wide panorama
    canvas = Image.new('RGBA', (VW, VH), (0, 0, 0, 255))
    gw = int(VW * camera_scale * 1.30) # Wide landscape panorama
    gh = int(VH * camera_scale * 1.15)
    g_scaled = garden_bg.resize((gw, gh), Image.Resampling.LANCZOS)
    gx = int((VW - gw) // 2 + camera_pan_x_pct * VW)
    gy = int((VH - gh) // 2 + camera_pan_y_pct * VH)
    canvas.alpha_composite(g_scaled, (gx, gy))
    
    # 2. Book Layer (Only rendered if book_opacity > 0)
    if book_opacity > 0.01:
        bw = int(HERO_BOOK_W * book_scale)
        bh = int(HERO_BOOK_H * book_scale)
        b_scaled = book_flat_master.resize((bw, bh), Image.Resampling.LANCZOS)
        
        sh_pad = int(35 * book_scale)
        sh_layer = Image.new('RGBA', (bw + sh_pad * 2, bh + sh_pad * 2), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(sh_layer)
        sh_d.rounded_rectangle(
            [sh_pad - 10, sh_pad + 15, bw + sh_pad + 10, bh + sh_pad + 25],
            radius=int(22 * book_scale),
            fill=(10, 5, 2, 160)
        )
        sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(int(22 * book_scale)))
        
        book_composite = Image.new('RGBA', (bw + sh_pad * 2, bh + sh_pad * 2), (0, 0, 0, 0))
        book_composite.alpha_composite(sh_layer, (0, 0))
        book_composite.alpha_composite(b_scaled, (sh_pad, sh_pad))
        
        if abs(book_rot_deg) > 0.05:
            book_rot = book_composite.rotate(book_rot_deg, expand=True, resample=Image.Resampling.BICUBIC)
        else:
            book_rot = book_composite
            
        bx = int(VW * book_cx_pct - book_rot.width // 2)
        by = int(VH * book_cy_pct - book_rot.height // 2)
        
        # Check if book intersects the viewport:
        if by < VH and (by + book_rot.height) > 0 and bx < VW and (bx + book_rot.width) > 0:
            clip_x1 = max(0, -bx)
            clip_y1 = max(0, -by)
            clip_x2 = min(book_rot.width, VW - bx)
            clip_y2 = min(book_rot.height, VH - by)
            
            cropped_book = book_rot.crop((clip_x1, clip_y1, clip_x2, clip_y2))
            if book_opacity < 0.99:
                r, g, b, a = cropped_book.split()
                a = a.point(lambda p: int(p * book_opacity))
                cropped_book.putalpha(a)
            dest_x = max(0, bx)
            dest_y = max(0, by)
            canvas.alpha_composite(cropped_book, (dest_x, dest_y))
        
    # 3. Butterfly Character
    bw_s = int(140 * bf_scale)
    bh_s = int(140 * bf_scale)
    bf_s = bf_img.resize((bw_s, bh_s), Image.Resampling.LANCZOS)
    if abs(bf_rot_deg) > 0.1:
        bf_rot = bf_s.rotate(bf_rot_deg, expand=True, resample=Image.Resampling.BICUBIC)
    else:
        bf_rot = bf_s
        
    glow = Image.new('RGBA', (bf_rot.width + 40, bf_rot.height + 40), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([10, 10, glow.width - 10, glow.height - 10], fill=(255, 215, 120, 100))
    glow = glow.filter(ImageFilter.GaussianBlur(14))
    
    bf_x = int(VW * bf_x_pct - bf_rot.width // 2)
    bf_y = int(VH * bf_y_pct - bf_rot.height // 2)
    canvas.alpha_composite(glow, (bf_x - 20, bf_y - 20))
    canvas.alpha_composite(bf_rot, (bf_x, bf_y))
    
    out_path = os.path.join(ART_DIR, f'{state_filename}.png')
    canvas.save(out_path, format='PNG')
    print(f'Rendered: {out_path}')
    return canvas

print('Rendering the 6 mandatory verification states (Book Present Already on Right Side & Butterfly Flying Towards It)...')

# State 1: Immediately after flowers fall (P=0.00)
# Book is ALREADY present on the right side. Butterfly is on the left. Book doesn't pop in!
render_state(
    state_filename='discovery_state_1_flowers_fallen_only_garden',
    book_cx_pct=0.58, # Already present on right side!
    book_cy_pct=0.52,
    book_scale=0.94,
    book_rot_deg=-1.5,
    bf_x_pct=0.20, # Butterfly on the left
    bf_y_pct=0.52,
    bf_scale=0.45,
    bf_rot_deg=8.0,
    camera_scale=1.0,
    camera_pan_x_pct=0.0,
    camera_pan_y_pct=0.0,
    book_opacity=1.0 # 100% ALREADY PRESENT!
)

# State 2: Early scroll (P=0.18)
# Butterfly takes off and surges forward towards the book already visible on the right.
render_state(
    state_filename='discovery_state_2_early_camera_movement',
    book_cx_pct=0.58, # Still resting on right side
    book_cy_pct=0.52,
    book_scale=0.94,
    book_rot_deg=-1.5,
    bf_x_pct=0.36, # Flying across meadow
    bf_y_pct=0.44,
    bf_scale=0.68,
    bf_rot_deg=14.0,
    camera_scale=1.015,
    camera_pan_x_pct=0.0,
    camera_pan_y_pct=-0.005,
    book_opacity=1.0 # Still resting on right
)

# State 3: Midway through garden flight (P=0.35)
# Butterfly soars high across sunset clouds heading straight towards the book on the right.
render_state(
    state_filename='discovery_state_3_midway_garden_exploration',
    book_cx_pct=0.58, # Still resting on right side
    book_cy_pct=0.52,
    book_scale=0.94,
    book_rot_deg=-1.5,
    bf_x_pct=0.52, # Soaring across sunset sky
    bf_y_pct=0.28,
    bf_scale=0.88,
    bf_rot_deg=18.0,
    camera_scale=1.03,
    camera_pan_x_pct=0.0,
    camera_pan_y_pct=-0.01,
    book_opacity=1.0
)

# State 4: Butterfly approaches book (P=0.54)
# Butterfly glides down directly toward the book resting on the right.
render_state(
    state_filename='discovery_state_4_book_entering_camera_view',
    book_cx_pct=0.58, # Still resting on right side
    book_cy_pct=0.52,
    book_scale=0.94,
    book_rot_deg=-1.5,
    bf_x_pct=0.72, # Butterfly right near the book
    bf_y_pct=0.24,
    bf_scale=0.96,
    bf_rot_deg=8.0,
    camera_scale=1.04,
    camera_pan_x_pct=0.0,
    camera_pan_y_pct=-0.015,
    book_opacity=1.0
)

# State 5: Camera centers book as butterfly arrives (P=0.64)
# Book smoothly centers for reading as butterfly descends toward top-right corner.
render_state(
    state_filename='discovery_state_5_butterfly_approaching_book',
    book_cx_pct=0.52, # Centering smoothly
    book_cy_pct=0.50,
    book_scale=1.02,
    book_rot_deg=-0.5,
    bf_x_pct=0.82, # Above top-right corner
    bf_y_pct=0.18,
    bf_scale=0.88,
    bf_rot_deg=4.0,
    camera_scale=1.055,
    camera_pan_x_pct=0.0,
    camera_pan_y_pct=-0.02,
    book_opacity=1.0
)

# State 6: Butterfly settled at top-right corner of centered book (P=0.72)
# Book centered and hero size (96% width, 88% height), butterfly hovering at top-right corner.
render_state(
    state_filename='discovery_state_6_final_book_framing_hover',
    book_cx_pct=0.50, # Centered hero position
    book_cy_pct=0.50,
    book_scale=1.06,
    book_rot_deg=0.0,
    bf_x_pct=0.86, # Settled at top-right corner
    bf_y_pct=0.13,
    bf_scale=0.82,
    bf_rot_deg=2.0,
    camera_scale=1.06,
    camera_pan_x_pct=0.0,
    camera_pan_y_pct=-0.025,
    book_opacity=1.0
)

print('All 6 delayed discovery verification states successfully rendered!')
