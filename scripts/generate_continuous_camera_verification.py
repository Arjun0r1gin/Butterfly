"""
BUTTERFLY — Seamless Continuous Camera Pan & Choreography Verification
Renders exact full-resolution 16:9 camera viewports at the 6 required test stages:
1. Beginning of the meadow (p = 0.00)
2. Middle of the meadow (p = 0.15)
3. Transition from meadow toward pergola (p = 0.35)
4. Middle of pergola area with memory book (p = 0.52)
5. Transition from pergola toward rocket (p = 0.82)
6. Middle of rocket area with landed butterfly (p = 1.00)
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter

ART_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
PUBLIC_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public'
SCENES_DIR = os.path.join(PUBLIC_DIR, 'scenes')
SB_DIR = os.path.join(PUBLIC_DIR, 'storybook')

VW, VH = 1600, 900 # Standard 16:9 cinematic canvas

# 1. Load HD Master Panorama (3868 x 1058)
pano_img = Image.open(os.path.join(SCENES_DIR, 'seamless_garden_panorama_hd.jpg')).convert('RGBA')
P_W, P_H = pano_img.size

# Scale panorama so its height matches the viewport height (VH = 900)
RENDER_H = VH
RENDER_W = int(P_W * (RENDER_H / P_H)) # 900 * (3868 / 1058) ≈ 3290px
pano_scaled = pano_img.resize((RENDER_W, RENDER_H), Image.Resampling.LANCZOS)
MAX_PAN_X = RENDER_W - VW # 3290 - 1600 = 1690px of horizontal camera travel!

# 2. Load Butterfly Sprite
bf_img = Image.open(os.path.join(PUBLIC_DIR, 'butterfly/butterfly_full.png')).convert('RGBA')

# 3. Load Storybook Textures
cover_img = Image.open(os.path.join(SB_DIR, 'studio_cover_walnut.jpg')).convert('RGBA')
page_left = Image.open(os.path.join(SB_DIR, 'studio_page_left.jpg')).convert('RGBA')
page_right = Image.open(os.path.join(SB_DIR, 'studio_page_right.jpg')).convert('RGBA')
page_back = Image.open(os.path.join(SB_DIR, 'studio_page_back.jpg')).convert('RGBA')
page_under = Image.open(os.path.join(SB_DIR, 'studio_page_underneath.jpg')).convert('RGBA')

HERO_BOOK_W = int(VW * 0.94) # ~1504px
HERO_BOOK_H = int(HERO_BOOK_W * (cover_img.height / cover_img.width)) # ~763px
HERO_PAGE_W = int(HERO_BOOK_W * 0.458)
HERO_PAGE_H = int(HERO_BOOK_H * 0.890)
GAP = 8

def render_book():
    bw, bh = HERO_BOOK_W, HERO_BOOK_H
    pw, ph = HERO_PAGE_W, HERO_PAGE_H
    
    book_canvas = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
    cov_scaled = cover_img.resize((bw, bh), Image.Resampling.LANCZOS)
    book_canvas.alpha_composite(cov_scaled, (0, 0))
    
    spine_x = bw // 2
    page_y = int(bh * 0.055)
    left_x = spine_x - GAP - pw
    right_x = spine_x + GAP
    
    # Layered paper stacks
    for s in [3, 2, 1]:
        off = s * 2
        ls = Image.new('RGBA', (pw, ph), (245 - s*3, 238 - s*3, 226 - s*3, 255))
        book_canvas.alpha_composite(ls, (left_x - off, page_y + off // 2))
        rs = Image.new('RGBA', (pw, ph), (245 - s*3, 238 - s*3, 226 - s*3, 255))
        book_canvas.alpha_composite(rs, (right_x + off, page_y + off // 2))
        
    p_left = page_left.resize((pw, ph), Image.Resampling.LANCZOS)
    p_right = page_right.resize((pw, ph), Image.Resampling.LANCZOS)
    book_canvas.alpha_composite(p_left, (left_x, page_y))
    book_canvas.alpha_composite(p_right, (right_x, page_y))
    
    # Restored Central Double-Wire Brass Spiral Spring
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

def render_camera_view(
    filename,
    title,
    camera_pan_factor, # 0.0 (Meadow) -> 0.52 (Pergola) -> 1.0 (Rocket)
    show_book=False,
    bf_x_pct=0.5,
    bf_y_pct=0.5,
    bf_scale=0.82,
    bf_rot_deg=0.0,
    hint_text='Scroll right to explore garden ▸'
):
    viewport = Image.new('RGBA', (VW, VH), (0, 0, 0, 255))
    
    # 1. Continuous camera crop from panorama
    pan_x = int(camera_pan_factor * MAX_PAN_X)
    crop_bg = pano_scaled.crop((pan_x, 0, pan_x + VW, VH))
    viewport.alpha_composite(crop_bg, (0, 0))
    
    # 2. Composite Storybook if in Pergola Area
    if show_book:
        b_raw = render_book()
        sh_pad = 35
        sh_layer = Image.new('RGBA', (HERO_BOOK_W + sh_pad * 2, HERO_BOOK_H + sh_pad * 2), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(sh_layer)
        sh_d.rounded_rectangle(
            [sh_pad - 10, sh_pad + 15, HERO_BOOK_W + sh_pad + 10, HERO_BOOK_H + sh_pad + 25],
            radius=24,
            fill=(10, 5, 2, 175)
        )
        sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(24))
        
        book_comp = Image.new('RGBA', (HERO_BOOK_W + sh_pad * 2, HERO_BOOK_H + sh_pad * 2), (0, 0, 0, 0))
        book_comp.alpha_composite(sh_layer, (0, 0))
        book_comp.alpha_composite(b_raw, (sh_pad, sh_pad))
        
        bx = (VW - book_comp.width) // 2
        by = (VH - book_comp.height) // 2
        viewport.alpha_composite(book_comp, (bx, by))
        
    # 3. Composite Butterfly
    bw_s = int(140 * bf_scale)
    bh_s = int(140 * bf_scale)
    bf_s = bf_img.resize((bw_s, bh_s), Image.Resampling.LANCZOS)
    if abs(bf_rot_deg) > 0.1:
        bf_rot = bf_s.rotate(bf_rot_deg, expand=True, resample=Image.Resampling.BICUBIC)
    else:
        bf_rot = bf_s
        
    glow = Image.new('RGBA', (bf_rot.width + 40, bf_rot.height + 40), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([10, 10, glow.width - 10, glow.height - 10], fill=(255, 220, 130, 95))
    glow = glow.filter(ImageFilter.GaussianBlur(14))
    
    bf_x = int(VW * bf_x_pct - bf_rot.width // 2)
    bf_y = int(VH * bf_y_pct - bf_rot.height // 2)
    viewport.alpha_composite(glow, (bf_x - 20, bf_y - 20))
    viewport.alpha_composite(bf_rot, (bf_x, bf_y))
    
    # 4. Floating Guidance Hint Pill
    pill_w = 420
    pill_h = 44
    pill_x = (VW - pill_w) // 2
    pill_y = VH - 64
    pill = Image.new('RGBA', (pill_w, pill_h), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle([0, 0, pill_w, pill_h], radius=22, fill=(35, 18, 10, 205), outline=(255, 215, 120, 80), width=1)
    pd.text((pill_w // 2, 22), hint_text, fill=(255, 250, 240, 240), anchor='mm')
    viewport.alpha_composite(pill, (pill_x, pill_y))
    
    out_path = os.path.join(ART_DIR, f'{filename}.png')
    viewport.save(out_path, format='PNG')
    print(f'Rendered: {filename}.png -> {title}')
    return viewport

from verify_camera_speed_continuity import get_camera_fraction

def smoothstep(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3.0 - 2.0 * t)

def get_butterfly_state(p):
    keyframes = [
        {'p': 0.00, 'x': 0.48, 'y': 0.48, 'scale': 0.85, 'rot': 4.0},
        {'p': 0.11, 'x': 0.36, 'y': 0.38, 'scale': 1.05, 'rot': -10.0},
        {'p': 0.22, 'x': 0.48, 'y': 0.32, 'scale': 1.12, 'rot': 8.0},
        {'p': 0.31, 'x': 0.58, 'y': 0.26, 'scale': 1.04, 'rot': 12.0},
        {'p': 0.35, 'x': 0.70, 'y': 0.20, 'scale': 0.96, 'rot': 6.0},
        {'p': 0.375, 'x': 0.78, 'y': 0.16, 'scale': 0.88, 'rot': 4.0},
        {'p': 0.3886, 'x': 0.86, 'y': 0.13, 'scale': 0.82, 'rot': 2.0},
        {'p': 0.6386, 'x': 0.86, 'y': 0.13, 'scale': 0.82, 'rot': 2.0},
        {'p': 0.6786, 'x': 0.70, 'y': 0.20, 'scale': 0.98, 'rot': 12.0},
        {'p': 0.77, 'x': 0.66, 'y': 0.28, 'scale': 1.05, 'rot': 14.0},
        {'p': 0.88, 'x': 0.76, 'y': 0.36, 'scale': 0.92, 'rot': 8.0},
        {'p': 0.96, 'x': 0.825, 'y': 0.44, 'scale': 0.80, 'rot': 2.0},
        {'p': 1.00, 'x': 0.825, 'y': 0.44, 'scale': 0.78, 'rot': 2.0},
    ]
    clamped = max(0.0, min(1.0, p))
    for i in range(len(keyframes) - 1):
        k0 = keyframes[i]
        k1 = keyframes[i + 1]
        if clamped <= k1['p']:
            sm = smoothstep(k0['p'], k1['p'], clamped)
            return {
                'x': k0['x'] + (k1['x'] - k0['x']) * sm,
                'y': k0['y'] + (k1['y'] - k0['y']) * sm,
                'scale': k0['scale'] + (k1['scale'] - k0['scale']) * sm,
                'rot': k0['rot'] + (k1['rot'] - k0['rot']) * sm,
            }
    return keyframes[-1]

print('Rendering all 6 mandatory camera inspection stages with C1 motion curve...')

# 1. Beginning of the meadow (p = 0.00)
bf1 = get_butterfly_state(0.00)
render_camera_view(
    filename='camera_test_01_meadow_beginning',
    title='1. Beginning of the Meadow (p = 0.00)',
    camera_pan_factor=get_camera_fraction(0.00),
    show_book=False,
    bf_x_pct=bf1['x'],
    bf_y_pct=bf1['y'],
    bf_scale=bf1['scale'],
    bf_rot_deg=bf1['rot'],
    hint_text='Scroll right to explore garden ▸'
)

# 2. Middle of the meadow (p = 0.15)
bf2 = get_butterfly_state(0.15)
render_camera_view(
    filename='camera_test_02_meadow_middle',
    title='2. Middle of the Meadow (p = 0.15)',
    camera_pan_factor=get_camera_fraction(0.15),
    show_book=False,
    bf_x_pct=bf2['x'],
    bf_y_pct=bf2['y'],
    bf_scale=bf2['scale'],
    bf_rot_deg=bf2['rot'],
    hint_text='Scroll right to explore garden ▸'
)

# 3. Transition from meadow toward pergola (p = 0.35)
bf3 = get_butterfly_state(0.35)
render_camera_view(
    filename='camera_test_03_meadow_to_pergola_transition',
    title='3. Transition from Meadow toward Pergola (p = 0.35)',
    camera_pan_factor=get_camera_fraction(0.35),
    show_book=False,
    bf_x_pct=bf3['x'],
    bf_y_pct=bf3['y'],
    bf_scale=bf3['scale'],
    bf_rot_deg=bf3['rot'],
    hint_text='Follow butterfly to the memory book ▸'
)

# 4. Middle of pergola area (with memory book) (p = 0.50)
bf4 = get_butterfly_state(0.50)
render_camera_view(
    filename='camera_test_04_pergola_middle_book',
    title='4. Middle of Pergola Area with Memory Book (p = 0.50)',
    camera_pan_factor=get_camera_fraction(0.50),
    show_book=True,
    bf_x_pct=bf4['x'],
    bf_y_pct=bf4['y'],
    bf_scale=bf4['scale'],
    bf_rot_deg=bf4['rot'],
    hint_text='Scroll to turn book pages ▸'
)

# 5. Transition from pergola toward rocket (p = 0.82)
bf5 = get_butterfly_state(0.82)
render_camera_view(
    filename='camera_test_05_pergola_to_rocket_transition',
    title='5. Transition from Pergola toward Rocket (p = 0.82)',
    camera_pan_factor=get_camera_fraction(0.82),
    show_book=False,
    bf_x_pct=bf5['x'],
    bf_y_pct=bf5['y'],
    bf_scale=bf5['scale'],
    bf_rot_deg=bf5['rot'],
    hint_text='Follow butterfly to the rocket ▸'
)

# 6. Middle of rocket area (with landed butterfly) (p = 1.00)
bf6 = get_butterfly_state(1.00)
render_camera_view(
    filename='camera_test_06_rocket_middle',
    title='6. Middle of Rocket Area with Butterfly Landed (p = 1.00)',
    camera_pan_factor=get_camera_fraction(1.00),
    show_book=False,
    bf_x_pct=bf6['x'],
    bf_y_pct=bf6['y'],
    bf_scale=bf6['scale'],
    bf_rot_deg=bf6['rot'],
    hint_text='Butterfly landed on rocket ✨'
)

print('All 6 inspection viewports successfully rendered!')

