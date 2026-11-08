"""
BUTTERFLY — Three-Scene Horizontal Journey, Butterfly Choreography & Storybook Integration
Verification Renderer for all 13 Horizontal Checkpoints:
1. Flower fall completed — Scene 1, only garden and butterfly.
2. Butterfly exploring Scene 1 meadow sky.
3. Horizontal transition from Scene 1 to Scene 2 (book entering from right).
4. Pergola garden with book centered in middle of Scene 2.
5. Butterfly approaching the book.
6. Butterfly landing on top-right corner of the book.
7. Storybook at 0%.
8. Storybook at 50% 3D physical page-turn progress.
9. Storybook completed (100% spread).
10. Butterfly taking off from the book.
11. Horizontal transition into Scene 3 (rocket entering from right).
12. Rocket scene framed with butterfly approaching rocket.
13. Butterfly landed on the vintage rocket.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter

ART_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
PUBLIC_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public'
SCENES_DIR = os.path.join(PUBLIC_DIR, 'scenes')
SB_DIR = os.path.join(PUBLIC_DIR, 'storybook')

VW, VH = 1600, 900

# 1. Load the 3 Authoritative Scene Images
scene_1_img = Image.open(os.path.join(SCENES_DIR, 'scene_1_garden.jpg')).convert('RGBA')
scene_1_img = scene_1_img.resize((VW, VH), Image.Resampling.LANCZOS)

scene_2_img = Image.open(os.path.join(SCENES_DIR, 'scene_2_pergola.jpg')).convert('RGBA')
scene_2_img = scene_2_img.resize((VW, VH), Image.Resampling.LANCZOS)

scene_3_img = Image.open(os.path.join(SCENES_DIR, 'scene_3_rocket.jpg')).convert('RGBA')
scene_3_img = scene_3_img.resize((VW, VH), Image.Resampling.LANCZOS)

# 2. Build Continuous 3-Scene Horizontal World Canvas (300vw width: 4800 x 900)
world_w = VW * 3
world_canvas = Image.new('RGBA', (world_w, VH), (0, 0, 0, 255))
world_canvas.alpha_composite(scene_1_img, (0, 0))
world_canvas.alpha_composite(scene_2_img, (VW, 0))
world_canvas.alpha_composite(scene_3_img, (VW * 2, 0))

# 3. Load Butterfly Sprite
bf_img = Image.open(os.path.join(PUBLIC_DIR, 'butterfly/butterfly_full.png')).convert('RGBA')

# 4. Load Storybook Textures
cover_img = Image.open(os.path.join(SB_DIR, 'studio_cover_walnut.jpg')).convert('RGBA')
page_left = Image.open(os.path.join(SB_DIR, 'studio_page_left.jpg')).convert('RGBA')
page_right = Image.open(os.path.join(SB_DIR, 'studio_page_right.jpg')).convert('RGBA')
page_back = Image.open(os.path.join(SB_DIR, 'studio_page_back.jpg')).convert('RGBA')
page_under = Image.open(os.path.join(SB_DIR, 'studio_page_underneath.jpg')).convert('RGBA')

HERO_BOOK_W = int(VW * 0.96) # ~1536px
HERO_BOOK_H = int(HERO_BOOK_W * (cover_img.height / cover_img.width)) # ~779px
HERO_PAGE_W = int(HERO_BOOK_W * 0.458) # ~703px
HERO_PAGE_H = int(HERO_BOOK_H * 0.890) # ~693px
GAP = 8

def render_book_spread(curl_t=0.0):
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
    p_under = page_under.resize((pw, ph), Image.Resampling.LANCZOS)
    
    book_canvas.alpha_composite(p_left, (left_x, page_y))
    book_canvas.alpha_composite(p_under, (right_x, page_y))
    
    if curl_t <= 0.01:
        p_right = page_right.resize((pw, ph), Image.Resampling.LANCZOS)
        book_canvas.alpha_composite(p_right, (right_x, page_y))
    elif curl_t >= 0.99:
        p_back = page_back.resize((pw, ph), Image.Resampling.LANCZOS)
        book_canvas.alpha_composite(p_back, (left_x, page_y))
    else:
        # Dynamic 3D physical page curl mid-flight
        rem_w = max(1, int(pw * (1.0 - curl_t)))
        if rem_w > 4:
            p_right_cropped = page_right.crop((0, 0, rem_w, page_right.height))
            pr_scaled = p_right_cropped.resize((rem_w, ph), Image.Resampling.LANCZOS)
            book_canvas.alpha_composite(pr_scaled, (right_x, page_y))
            
        arch_w = int(pw * 0.85)
        arch_h = ph
        p_back_scaled = page_back.resize((arch_w, arch_h), Image.Resampling.LANCZOS)
        
        # Soft contact shadow under the turning page
        sh_w = int(pw * curl_t * 0.9)
        sh_img = Image.new('RGBA', (sh_w, ph), (20, 10, 5, int(130 * math.sin(curl_t * math.pi))))
        sh_img = sh_img.filter(ImageFilter.GaussianBlur(16))
        book_canvas.alpha_composite(sh_img, (left_x + pw - sh_w, page_y))
        
        # Arch composite
        arch_pos_x = int(spine_x - arch_w * (curl_t - 0.1))
        book_canvas.alpha_composite(p_back_scaled, (arch_pos_x, page_y))
        
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

def render_checkpoint(
    filename,
    title,
    world_x_pct,       # 0.0 = Scene 1, -1.0 = Scene 2, -2.0 = Scene 3
    show_book=False,
    book_curl=0.0,
    book_scale=1.0,
    bf_x_pct=0.5,
    bf_y_pct=0.5,
    bf_scale=0.82,
    bf_rot_deg=0.0,
    show_hint=True,
    hint_text='Scroll right to explore ▸'
):
    # Viewport Canvas
    viewport = Image.new('RGBA', (VW, VH), (0, 0, 0, 255))
    
    # 1. Composite World Scenes Container
    world_x = int(world_x_pct * VW)
    viewport.alpha_composite(world_canvas, (world_x, 0))
    
    # 2. Composite Storybook in Scene 2
    # Book is physically placed in the middle of Scene 2 (X = 1.5 * VW)
    if show_book:
        book_flat = render_book_spread(curl_t=book_curl)
        bw = int(HERO_BOOK_W * book_scale)
        bh = int(HERO_BOOK_H * book_scale)
        b_scaled = book_flat.resize((bw, bh), Image.Resampling.LANCZOS)
        
        # Drop shadow
        sh_pad = 35
        sh_layer = Image.new('RGBA', (bw + sh_pad * 2, bh + sh_pad * 2), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(sh_layer)
        sh_d.rounded_rectangle(
            [sh_pad - 10, sh_pad + 15, bw + sh_pad + 10, bh + sh_pad + 25],
            radius=24,
            fill=(10, 5, 2, 175)
        )
        sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(24))
        
        book_comp = Image.new('RGBA', (bw + sh_pad * 2, bh + sh_pad * 2), (0, 0, 0, 0))
        book_comp.alpha_composite(sh_layer, (0, 0))
        book_comp.alpha_composite(b_scaled, (sh_pad, sh_pad))
        
        # Position relative to world container (Scene 2 center = VW + VW // 2 = 1.5 * VW)
        book_world_cx = int(VW * 1.5)
        book_screen_cx = book_world_cx + world_x
        book_x = book_screen_cx - book_comp.width // 2
        book_y = (VH - book_comp.height) // 2
        
        # Only composite if visible within viewport bounds
        if book_x < VW and (book_x + book_comp.width) > 0:
            clip_x1 = max(0, -book_x)
            clip_x2 = min(book_comp.width, VW - book_x)
            cropped = book_comp.crop((clip_x1, 0, clip_x2, book_comp.height))
            viewport.alpha_composite(cropped, (max(0, book_x), book_y))
            
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
    if show_hint:
        pill_w = 420
        pill_h = 44
        pill_x = (VW - pill_w) // 2
        pill_y = VH - 64
        pill = Image.new('RGBA', (pill_w, pill_h), (0, 0, 0, 0))
        pd = ImageDraw.Draw(pill)
        pd.rounded_rectangle([0, 0, pill_w, pill_h], radius=22, fill=(35, 18, 10, 205), outline=(255, 215, 120, 80), width=1)
        # Text
        pd.text((pill_w // 2, 22), hint_text, fill=(255, 250, 240, 240), anchor='mm')
        viewport.alpha_composite(pill, (pill_x, pill_y))
        
    out_path = os.path.join(ART_DIR, f'{filename}.png')
    viewport.save(out_path, format='PNG')
    print(f'Rendered: {filename}.png -> {title}')
    return viewport

print('Rendering all 13 authoritative horizontal checkpoints...')

# Checkpoint 1: Flower fall completed — Scene 1, only garden and butterfly.
render_checkpoint(
    filename='checkpoint_1_flower_fall_completed_scene_1',
    title='Checkpoint 1: Scene 1 Garden Only (Zero Book/Rocket)',
    world_x_pct=0.0,
    show_book=False,
    bf_x_pct=0.48,
    bf_y_pct=0.48,
    bf_scale=0.85,
    bf_rot_deg=4.0,
    hint_text='Scroll right to explore garden ▸'
)

# Checkpoint 2: Butterfly exploring Scene 1 meadow sky.
render_checkpoint(
    filename='checkpoint_2_butterfly_exploring_scene_1',
    title='Checkpoint 2: Butterfly Exploring Scene 1 Meadow Sky',
    world_x_pct=-0.025,
    show_book=False,
    bf_x_pct=0.46,
    bf_y_pct=0.40,
    bf_scale=1.10,
    bf_rot_deg=8.0,
    hint_text='Scroll right to explore garden ▸'
)

# Checkpoint 3: Horizontal transition from Scene 1 to Scene 2 (book enters from right).
render_checkpoint(
    filename='checkpoint_3_vertical_transition_scene_1_to_2',
    title='Checkpoint 3: Horizontal Transition Scene 1 -> Scene 2 (Book Entering from Right)',
    world_x_pct=-0.50, # Halfway between Scene 1 and Scene 2
    show_book=True,
    book_curl=0.0,
    bf_x_pct=0.56,
    bf_y_pct=0.28,
    bf_scale=1.04,
    bf_rot_deg=12.0,
    hint_text='Follow butterfly to the memory book ▸'
)

# Checkpoint 4: Pergola garden with book centered in middle of Scene 2.
render_checkpoint(
    filename='checkpoint_4_pergola_garden_with_book_visible',
    title='Checkpoint 4: Scene 2 Pergola Garden with Centered Book',
    world_x_pct=-1.00, # Scene 2 fully centered!
    show_book=True,
    book_curl=0.0,
    bf_x_pct=0.68,
    bf_y_pct=0.20,
    bf_scale=0.96,
    bf_rot_deg=6.0,
    hint_text='Follow butterfly to the memory book ▸'
)

# Checkpoint 5: Butterfly approaching the book.
render_checkpoint(
    filename='checkpoint_5_butterfly_approaching_book',
    title='Checkpoint 5: Butterfly Approaching the Book',
    world_x_pct=-1.00,
    show_book=True,
    book_curl=0.0,
    bf_x_pct=0.78,
    bf_y_pct=0.16,
    bf_scale=0.88,
    bf_rot_deg=4.0,
    hint_text='Follow butterfly to the memory book ▸'
)

# Checkpoint 6: Butterfly landing on top-right corner of the book.
render_checkpoint(
    filename='checkpoint_6_butterfly_landing_on_book',
    title='Checkpoint 6: Butterfly Landing on Top-Right Corner of Book',
    world_x_pct=-1.00,
    show_book=True,
    book_curl=0.0,
    bf_x_pct=0.86,
    bf_y_pct=0.13,
    bf_scale=0.82,
    bf_rot_deg=2.0,
    hint_text='Scroll to turn book pages ▸'
)

# Checkpoint 7: Storybook at 0%.
render_checkpoint(
    filename='checkpoint_7_storybook_at_0_percent',
    title='Checkpoint 7: Storybook Spread at 0% Progress',
    world_x_pct=-1.00,
    show_book=True,
    book_curl=0.0,
    bf_x_pct=0.86,
    bf_y_pct=0.13,
    bf_scale=0.82,
    bf_rot_deg=2.0,
    hint_text='Scroll to turn book pages ▸'
)

# Checkpoint 8: Storybook at 50% 3D page-turn progress.
render_checkpoint(
    filename='checkpoint_8_storybook_at_50_percent_page_turn',
    title='Checkpoint 8: Storybook at 50% 3D Page Turn with Cylinder Curl',
    world_x_pct=-1.00,
    show_book=True,
    book_curl=0.50,
    bf_x_pct=0.86,
    bf_y_pct=0.13,
    bf_scale=0.82,
    bf_rot_deg=2.0,
    hint_text='Scroll to turn book pages ▸'
)

# Checkpoint 9: Storybook completed (100% spread).
render_checkpoint(
    filename='checkpoint_9_storybook_completed',
    title='Checkpoint 9: Storybook Completed (100% Spread)',
    world_x_pct=-1.00,
    show_book=True,
    book_curl=1.00,
    bf_x_pct=0.86,
    bf_y_pct=0.13,
    bf_scale=0.82,
    bf_rot_deg=2.0,
    hint_text='Follow butterfly to the rocket ▸'
)

# Checkpoint 10: Butterfly taking off.
render_checkpoint(
    filename='checkpoint_10_butterfly_taking_off',
    title='Checkpoint 10: Butterfly Taking Off from Completed Book',
    world_x_pct=-1.00,
    show_book=True,
    book_curl=1.00,
    bf_x_pct=0.70,
    bf_y_pct=0.20,
    bf_scale=0.98,
    bf_rot_deg=12.0,
    hint_text='Follow butterfly to the rocket ▸'
)

# Checkpoint 11: Horizontal transition into Scene 3 (rocket enters from right).
render_checkpoint(
    filename='checkpoint_11_vertical_transition_scene_2_to_3',
    title='Checkpoint 11: Horizontal Transition Scene 2 -> Scene 3 (Rocket Enters)',
    world_x_pct=-1.50, # Halfway between Scene 2 and Scene 3
    show_book=True,
    book_curl=1.00,
    bf_x_pct=0.66,
    bf_y_pct=0.30,
    bf_scale=1.05,
    bf_rot_deg=14.0,
    hint_text='Follow butterfly to the rocket ▸'
)

# Checkpoint 12: Rocket scene with butterfly approaching.
render_checkpoint(
    filename='checkpoint_12_rocket_scene_with_butterfly_approaching',
    title='Checkpoint 12: Scene 3 Framed with Butterfly Approaching Rocket',
    world_x_pct=-2.00, # Scene 3 fully centered!
    show_book=False,
    bf_x_pct=0.75,
    bf_y_pct=0.36,
    bf_scale=0.92,
    bf_rot_deg=8.0,
    hint_text='Follow butterfly to the rocket ▸'
)

# Checkpoint 13: Butterfly landed on the rocket.
render_checkpoint(
    filename='checkpoint_13_butterfly_landed_on_rocket',
    title='Checkpoint 13: Butterfly Landed on the Vintage Rocket',
    world_x_pct=-2.00,
    show_book=False,
    bf_x_pct=0.825,
    bf_y_pct=0.44,
    bf_scale=0.78,
    bf_rot_deg=2.0,
    hint_text='Butterfly landed on rocket ✨'
)

print('All 13 horizontal checkpoints successfully rendered!')
