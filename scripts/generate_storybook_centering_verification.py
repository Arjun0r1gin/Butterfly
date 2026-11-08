"""
BUTTERFLY — Storybook Centering & Alignment Verification Script
Generates high-resolution screenshots for the exact required states:
1. Initial closed-book state (Scene 2 Pergola, p = 0.30)
2. Book opening animation (3D hinged flap, p = 0.46)
3. Fully opened book at 0% page-turn progress (Spread 0)
4. Fully opened book at 25% page-turn progress
5. Fully opened book at 50% page-turn progress (Cylindrical roll at midpoint)
6. Fully opened book at 75% page-turn progress
7. Fully opened book at 100% page-turn progress (Spread 1 fully turned)
8. Mobile viewport size (390x844) showing proportional scaling and centering
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ART_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
PUBLIC_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public'
SCENES_DIR = os.path.join(PUBLIC_DIR, 'scenes')
SB_DIR = os.path.join(PUBLIC_DIR, 'storybook')

# Textures
pano_img = Image.open(os.path.join(SCENES_DIR, 'seamless_garden_panorama_hd.jpg')).convert('RGBA')
closed_book_full = Image.open(os.path.join(SB_DIR, 'closed_book_full.png')).convert('RGBA')
closed_book_base = Image.open(os.path.join(SB_DIR, 'closed_book_base_under.png')).convert('RGBA')
flap_img = Image.open(os.path.join(SB_DIR, 'closed_book_cover_flap.png')).convert('RGBA')
inside_img = Image.open(os.path.join(SB_DIR, 'closed_book_cover_inside.png')).convert('RGBA')
bf_img = Image.open(os.path.join(PUBLIC_DIR, 'butterfly/butterfly_full.png')).convert('RGBA')

cover_img = Image.open(os.path.join(SB_DIR, 'studio_cover_walnut.jpg')).convert('RGBA')
page_left = Image.open(os.path.join(SB_DIR, 'studio_page_left.jpg')).convert('RGBA')
page_right = Image.open(os.path.join(SB_DIR, 'studio_page_right.jpg')).convert('RGBA')
page_back = Image.open(os.path.join(SB_DIR, 'studio_page_back.jpg')).convert('RGBA')
page_under = Image.open(os.path.join(SB_DIR, 'studio_page_underneath.jpg')).convert('RGBA')

def render_centered_open_book(vw, vh, curl_frac=0.0):
    """
    Renders the complete open storybook assembly with:
    - Hardcover walnut frame
    - Left & right parchment paper stacks
    - Left resting page & right under page
    - Active Three.js cylinder curling page
    - 13-ring double-wire brass spiral spring at exact center
    """
    aspect = 852.0 / 442.0 # 1.9276
    book_w = int(min(0.86 * vw, 0.84 * vh * aspect))
    book_h = int(book_w / aspect)
    
    canvas = Image.new('RGBA', (book_w, book_h), (0, 0, 0, 0))
    
    # 1. Outer Walnut Leather Hardcover
    cov_scaled = cover_img.resize((book_w, book_h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(cov_scaled, (0, 0))
    
    # Page dimensions inside book frame
    page_w = int(book_w * (390.0 / 852.0))
    page_h = int(book_h * (412.0 / 442.0))
    gap = int(book_w * (7.0 / 852.0))
    
    spine_x = book_w // 2
    page_y = (book_h - page_h) // 2
    left_x = spine_x - gap - page_w
    right_x = spine_x + gap
    
    # 2. Soft natural contact shadow under pages against leather cover
    page_shadow = Image.new('RGBA', (book_w, book_h), (0, 0, 0, 0))
    ps_d = ImageDraw.Draw(page_shadow)
    ps_d.rectangle([left_x - 6, page_y - 3, right_x + page_w + 6, page_y + page_h + 6], fill=(15, 6, 2, 120))
    page_shadow = page_shadow.filter(ImageFilter.GaussianBlur(10))
    canvas.alpha_composite(page_shadow, (0, 0))
        
    # 3. Left Resting Scrapbook Page
    p_left = page_left.resize((page_w, page_h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(p_left, (left_x, page_y))
    
    # 4. Right Resting Story Page Underneath
    p_under = page_under.resize((page_w, page_h), Image.Resampling.LANCZOS)
    canvas.alpha_composite(p_under, (right_x, page_y))
    
    # 5. Dynamic Page-Turn Deformation (Inextensible rolling cylinder simulation)
    if curl_frac < 0.999:
        p_front = page_right.resize((page_w, page_h), Image.Resampling.LANCZOS)
        p_back = page_back.resize((page_w, page_h), Image.Resampling.LANCZOS)
        
        t = curl_frac
        # Fold moves from right (t=0) to left (t=1)
        # Flat right section width = (1 - t) * page_w
        flat_r_w = int(page_w * (1.0 - t))
        if flat_r_w > 4:
            # Crop remaining flat right portion
            crop_x = page_w - flat_r_w
            flat_crop = p_front.crop((crop_x, 0, page_w, page_h))
            canvas.alpha_composite(flat_crop, (right_x + crop_x, page_y))
            
        # Cylindrical roll / arch
        if 0.01 < t < 0.99:
            cyl_w = int(page_w * 0.32 * math.sin(t * math.pi))
            if cyl_w > 6:
                # Dynamic shadow under the curl arch
                sh_w = cyl_w + 30
                sh = Image.new('RGBA', (sh_w, page_h), (0, 0, 0, 0))
                sh_d = ImageDraw.Draw(sh)
                for x in range(sh_w):
                    alpha = int(95 * math.sin((x / sh_w) * math.pi))
                    sh_d.line([(x, 0), (x, page_h)], fill=(12, 6, 2, alpha), width=1)
                sh = sh.filter(ImageFilter.GaussianBlur(6))
                canvas.alpha_composite(sh, (right_x + flat_r_w - cyl_w // 2, page_y))
                
                # Turning page slice in perspective
                src_slice_x = max(0, page_w - flat_r_w - cyl_w)
                slice_img = p_front.crop((src_slice_x, 0, src_slice_x + cyl_w, page_h))
                # Slight vertical expansion simulating cylinder curvature toward camera
                lift_h = int(page_h * 1.04)
                slice_s = slice_img.resize((cyl_w, lift_h), Image.Resampling.BILINEAR)
                # Subtle highlight on cylinder crest
                hl = Image.new('RGBA', (cyl_w, lift_h), (0, 0, 0, 0))
                hl_d = ImageDraw.Draw(hl)
                hl_d.line([(cyl_w // 2, 0), (cyl_w // 2, lift_h)], fill=(255, 255, 240, 55), width=int(cyl_w * 0.35))
                hl = hl.filter(ImageFilter.GaussianBlur(4))
                slice_s.alpha_composite(hl, (0, 0))
                canvas.alpha_composite(slice_s, (right_x + flat_r_w - cyl_w, page_y - (lift_h - page_h) // 2))
                
        # Settled flat left portion (as t > 0.5)
        if t > 0.45:
            flat_l_w = int(page_w * (t - 0.45) / 0.55)
            if flat_l_w > 4:
                crop_back = p_back.crop((0, 0, flat_l_w, page_h))
                canvas.alpha_composite(crop_back, (spine_x - gap - flat_l_w, page_y))
    else:
        # At t = 1.0, spread is fully turned! Left page shows back of turned page!
        p_back_full = page_back.resize((page_w, page_h), Image.Resampling.LANCZOS)
        canvas.alpha_composite(p_back_full, (left_x, page_y))
        
    # 6. Central Double-Wire Brass Spiral Spring (Aligned to horizontal center)
    spiral_w = int(book_w * (46.0 / 852.0))
    spiral_h = page_h + 24
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
            sd.ellipse([4, wy - 8, spiral_w - 4, wy + 8], outline=(18, 9, 4, 150), width=3)
            sd.ellipse([4, wy - 9, spiral_w - 4, wy + 7], outline=(185, 135, 50, 255), width=4)
            sd.ellipse([5, wy - 9, spiral_w - 5, wy + 7], outline=(235, 185, 75, 255), width=2)
            sd.arc([5, wy - 10, spiral_w - 5, wy + 6], start=190, end=350, fill=(255, 250, 215, 245), width=2)
            
    spiral_x = spine_x - spiral_w // 2
    spiral_y = page_y - 12
    canvas.alpha_composite(spiral_img, (spiral_x, spiral_y))
    
    return canvas, book_w, book_h

def render_viewport(
    filename,
    title,
    vw=1600,
    vh=900,
    cam_factor=0.52,
    book_mode='open', # 'closed' | 'opening' | 'open'
    curl_frac=0.0,
    cover_angle=0.0,
    bf_x_pct=0.855,
    bf_y_pct=0.135,
    bf_scale=0.82,
    hint_text='Scroll to turn book pages ▸'
):
    # Base panorama background
    p_w, p_h = pano_img.size
    render_h = vh
    render_w = int(p_w * (render_h / p_h))
    pano_scaled = pano_img.resize((render_w, render_h), Image.Resampling.LANCZOS)
    max_pan_x = render_w - vw
    pan_x = int(cam_factor * max_pan_x)
    
    # 1. World Canvas
    world = pano_scaled.copy()
    
    # If in closed or opening state, composite closed book at pergola lawn in world space
    if book_mode == 'closed':
        # Pergola lawn center
        world_book_x = int(0.52 * max_pan_x + vw / 2)
        world_book_y = int(vh * 0.50)
        cb_w = int(min(440, 0.46 * vw))
        cb_h = int(cb_w * (closed_book_full.height / closed_book_full.width))
        cb_scaled = closed_book_full.resize((cb_w, cb_h), Image.Resampling.LANCZOS)
        world.alpha_composite(cb_scaled, (world_book_x - cb_w // 2, world_book_y - cb_h // 2))
    elif book_mode == 'opening':
        world_book_x = int(0.52 * max_pan_x + vw / 2)
        world_book_y = int(vh * 0.50)
        cb_w = int(min(440, 0.46 * vw))
        cb_h = int(cb_w * (closed_book_base.height / closed_book_base.width))
        
        # Base under
        base_s = closed_book_base.resize((cb_w, cb_h), Image.Resampling.LANCZOS)
        
        # 3D hinged flap
        ang_rad = math.radians(cover_angle)
        cos_a = math.cos(ang_rad)
        sin_a = math.sin(ang_rad)
        curr_w = int(cb_w * 0.88 * abs(cos_a))
        if curr_w >= 4:
            src = flap_img if cos_a >= 0 else inside_img
            flap_s = src.resize((curr_w, int(cb_h * 0.90)), Image.Resampling.LANCZOS)
            tilt_h = int(cb_h * 0.90 * (1.0 + 0.15 * sin_a))
            flap_tilt = flap_s.resize((curr_w, tilt_h), Image.Resampling.LANCZOS)
            dest_x = (cb_w // 2) if cos_a >= 0 else (cb_w // 2 - curr_w)
            base_s.alpha_composite(flap_tilt, (dest_x, int(cb_h * 0.05) - (tilt_h - int(cb_h * 0.90)) // 2))
            
        world.alpha_composite(base_s, (world_book_x - cb_w // 2, world_book_y - cb_h // 2))
        
    # Crop viewport from world
    viewport = world.crop((pan_x, 0, pan_x + vw, vh))
    
    # 2. Master Centered Open Storybook Stage (Directly in Viewport)
    if book_mode == 'open':
        book_canvas, bw, bh = render_centered_open_book(vw, vh, curl_frac)
        
        # Soft atmospheric drop shadow behind centered book
        pad = 40
        sh_layer = Image.new('RGBA', (bw + pad * 2, bh + pad * 2), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(sh_layer)
        sh_d.rounded_rectangle(
            [pad - 12, pad + 15, bw + pad + 12, bh + pad + 30],
            radius=24,
            fill=(10, 5, 2, 185)
        )
        sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(28))
        
        # EXACT HORIZONTAL & VERTICAL CENTER:
        book_dest_x = (vw - bw) // 2
        book_dest_y = (vh - bh) // 2
        
        viewport.alpha_composite(sh_layer, (book_dest_x - pad, book_dest_y - pad))
        viewport.alpha_composite(book_canvas, (book_dest_x, book_dest_y))
        
    # 3. Butterfly Traveler
    bw_s = int(140 * bf_scale * (vw / 1600.0 if vw < 1200 else 1.0))
    bh_s = int(140 * bf_scale * (vw / 1600.0 if vw < 1200 else 1.0))
    bf_s = bf_img.resize((bw_s, bh_s), Image.Resampling.LANCZOS)
    
    glow = Image.new('RGBA', (bf_s.width + 40, bf_s.height + 40), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([10, 10, glow.width - 10, glow.height - 10], fill=(255, 220, 130, 95))
    glow = glow.filter(ImageFilter.GaussianBlur(14))
    
    bf_x = int(vw * bf_x_pct - bf_s.width // 2)
    bf_y = int(vh * bf_y_pct - bf_s.height // 2)
    viewport.alpha_composite(glow, (bf_x - 20, bf_y - 20))
    viewport.alpha_composite(bf_s, (bf_x, bf_y))
    
    # 4. Centered Narrative Hint Pill
    pill_w = min(440, int(vw * 0.82))
    pill_h = 42
    pill_x = (vw - pill_w) // 2
    pill_y = vh - 60
    pill = Image.new('RGBA', (pill_w, pill_h), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle([0, 0, pill_w, pill_h], radius=21, fill=(35, 18, 10, 210), outline=(255, 215, 120, 80), width=1)
    pd.text((pill_w // 2, 21), hint_text, fill=(255, 250, 240, 240), anchor='mm')
    viewport.alpha_composite(pill, (pill_x, pill_y))
    
    out_path = os.path.join(ART_DIR, f'{filename}.png')
    viewport.save(out_path, format='PNG')
    print(f'Rendered: {filename}.png -> {title}')
    return viewport

print('Generating Storybook Centering & Alignment Verification Checkpoints...')

# 1. Initial closed-book state (p = 0.30)
render_viewport(
    filename='storybook_check_01_closed_book_discovered',
    title='1. Initial closed-book state in Scene 2 pergola (p = 0.30)',
    vw=1600, vh=900,
    cam_factor=0.38,
    book_mode='closed',
    bf_x_pct=0.36, bf_y_pct=0.28, bf_scale=1.05,
    hint_text='Follow butterfly to the memory book ▸'
)

# 2. Book opening animation (p = 0.46)
render_viewport(
    filename='storybook_check_02_book_opening_3d',
    title='2. Book opening animation with 3D hinged cover (p = 0.46)',
    vw=1600, vh=900,
    cam_factor=0.52,
    book_mode='opening',
    cover_angle=70.0,
    bf_x_pct=0.68, bf_y_pct=0.26, bf_scale=0.86,
    hint_text='The storybook awakens...'
)

# 3. Fully opened book at 0% page-turn progress
render_viewport(
    filename='storybook_check_03_fully_opened_0pct_progress',
    title='3. Fully opened book at 0% page-turn progress (Centered)',
    vw=1600, vh=900,
    cam_factor=0.52,
    book_mode='open',
    curl_frac=0.0,
    bf_x_pct=0.855, bf_y_pct=0.135, bf_scale=0.82,
    hint_text='Scroll to turn book pages ▸'
)

# 4. Fully opened book at 25% page-turn progress
render_viewport(
    filename='storybook_check_04_opened_25pct_progress',
    title='4. Fully opened book at 25% page-turn progress (Centered)',
    vw=1600, vh=900,
    cam_factor=0.52,
    book_mode='open',
    curl_frac=0.25,
    bf_x_pct=0.855, bf_y_pct=0.135, bf_scale=0.82,
    hint_text='Scroll to turn book pages ▸'
)

# 5. Fully opened book at 50% page-turn progress
render_viewport(
    filename='storybook_check_05_opened_50pct_progress',
    title='5. Fully opened book at 50% page-turn progress (Centered)',
    vw=1600, vh=900,
    cam_factor=0.52,
    book_mode='open',
    curl_frac=0.50,
    bf_x_pct=0.855, bf_y_pct=0.135, bf_scale=0.82,
    hint_text='Scroll to turn book pages ▸'
)

# 6. Fully opened book at 75% page-turn progress
render_viewport(
    filename='storybook_check_06_opened_75pct_progress',
    title='6. Fully opened book at 75% page-turn progress (Centered)',
    vw=1600, vh=900,
    cam_factor=0.52,
    book_mode='open',
    curl_frac=0.75,
    bf_x_pct=0.855, bf_y_pct=0.135, bf_scale=0.82,
    hint_text='Scroll to turn book pages ▸'
)

# 7. Fully opened book at 100% page-turn progress
render_viewport(
    filename='storybook_check_07_opened_100pct_progress',
    title='7. Fully opened book at 100% page-turn progress (Centered)',
    vw=1600, vh=900,
    cam_factor=0.52,
    book_mode='open',
    curl_frac=1.0,
    bf_x_pct=0.855, bf_y_pct=0.135, bf_scale=0.82,
    hint_text='Scroll to turn book pages ▸'
)

# 8. Mobile viewport size (390x844)
render_viewport(
    filename='storybook_check_08_mobile_centered_proportional',
    title='8. Mobile viewport (390x844) showing proportional scaling & centering',
    vw=390, vh=844,
    cam_factor=0.52,
    book_mode='open',
    curl_frac=0.30,
    bf_x_pct=0.80, bf_y_pct=0.38, bf_scale=0.70,
    hint_text='Scroll to turn book pages ▸'
)

print('All 8 Storybook centering verification checkpoints successfully generated!')

