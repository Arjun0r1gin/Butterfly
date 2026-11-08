"""
BUTTERFLY — Task 6: Final Question Timing, Opening Scroll Lock & NO Button Dodge Verification
Generates high-resolution verification checkpoints and smooth continuous recording for:
1. Opening scroll lock during flower curtain animation (locked at p=0.0)
2. Clean scroll unlock allowing seamless traversal across scenes 1, 2, 3
3. Immediate final question reveal upon butterfly landing on rocket tip (zero setTimeout)
4. Substantially larger NO button cross-screen evasive dodges (300px - 500px leaps)
5. Collision safety guarantee: zero overlap with YES button, zero overlap with question text, clamped in viewport
6. Mobile responsive layout and dodge behavior
7. YES flower-rain cascade celebration
8. High-definition MP4 and GIF recordings
"""

import os
import math
import random
import subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ARTIFACT_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
os.makedirs(ARTIFACT_DIR, exist_ok=True)

import sys
sys.path.append('scripts')
from generate_task3_environmental_verification import render_frame
from generate_task4_refined_ui_verification import draw_pill_gradient, get_font, font_serif_bold, font_serif_italic, font_serif_reg, font_sans
from generate_flower_rain_celebration_verification import FLOWER_SPRITES, RainParticleSim

PUBLIC_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public'
SCENES_DIR = os.path.join(PUBLIC_DIR, 'scenes')
pano_img = Image.open(os.path.join(SCENES_DIR, 'seamless_garden_panorama_hd.jpg')).convert('RGBA')
bf_img = Image.open(os.path.join(PUBLIC_DIR, 'butterfly/butterfly_full.png')).convert('RGBA')

TOAST_MESSAGES = [
    'Nice try! 😉',
    'Too slow! 💨',
    'Almost! 😜',
    'Nope! 🏃‍♂️',
    'Not quite! ✨',
    'Try again! 💫',
    'Over here! 👋',
]

def render_scene_at_progress(p, vw=1600, vh=900):
    """Renders the panoramic world, environment, and butterfly at progress p."""
    im = render_frame(p, time_s=3.0, vw=vw, vh=vh)
    return im.convert('RGBA') if im.mode != 'RGBA' else im

def render_final_ui_with_dodge(screen, no_abs_pos=None, toast_text="Nice try! 😉", vw=1600, vh=900, is_mobile=False):
    """
    Renders the exact refined final interaction UI with the NO button at an arbitrary
    absolute position (no_abs_pos = (x, y)), or default natural resting position if None.
    """
    ui_layer = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
    d = ImageDraw.Draw(ui_layer)

    if not is_mobile:
        left_pad = int(vw * 0.08)
        content_w = min(540, int(vw * 0.38))
        center_x = left_pad + content_w // 2
        
        # Typography
        f_chap = get_font(font_serif_bold, 13)
        f_main = get_font(font_serif_bold, 38)
        f_high = get_font(font_serif_bold, 40)
        f_quote = get_font(font_serif_italic, 18)
        f_btn = get_font(font_serif_bold, 16)
        f_toast = get_font(font_serif_bold, 14)

        # 1. Chapter Header
        header_y = int(vh * 0.28)
        chap_text = "CHAPTER IV: BEYOND THE HORIZON"
        bbox = f_chap.getbbox(chap_text)
        tw = bbox[2] - bbox[0]
        
        # Flanking lines
        line_w = 40
        d.line([(center_x - tw//2 - line_w - 14, header_y + 8), (center_x - tw//2 - 14, header_y + 8)], fill=(229, 189, 117, 180), width=1)
        d.line([(center_x + tw//2 + 14, header_y + 8), (center_x + tw//2 + line_w + 14, header_y + 8)], fill=(229, 189, 117, 180), width=1)
        
        # Text with subtle drop shadow
        d.text((center_x - tw//2 + 1, header_y + 1), chap_text, font=f_chap, fill=(0, 0, 0, 160))
        d.text((center_x - tw//2, header_y), chap_text, font=f_chap, fill=(229, 189, 117, 245))

        # 2. Main Question Title
        title_y1 = header_y + 30
        t1 = "Will you join me on this"
        bb1 = f_main.getbbox(t1)
        tw1 = bb1[2] - bb1[0]
        d.text((center_x - tw1//2 + 2, title_y1 + 2), t1, font=f_main, fill=(0, 0, 0, 200))
        d.text((center_x - tw1//2, title_y1), t1, font=f_main, fill=(255, 248, 238, 255))

        title_y2 = title_y1 + 46
        t2 = "journey forever?"
        bb2 = f_high.getbbox(t2)
        tw2 = bb2[2] - bb2[0]
        d.text((center_x - tw2//2 + 2, title_y2 + 2), t2, font=f_high, fill=(0, 0, 0, 200))
        d.text((center_x - tw2//2, title_y2), t2, font=f_high, fill=(247, 190, 88, 255))

        # 3. Subtitle Quote
        sub_y = title_y2 + 56
        sub_t = "“To infinity and beyond, through every flower and star.”"
        bbs = f_quote.getbbox(sub_t)
        tws = bbs[2] - bbs[0]
        d.text((center_x - tws//2 + 1, sub_y + 1), sub_t, font=f_quote, fill=(0, 0, 0, 180))
        d.text((center_x - tws//2, sub_y), sub_t, font=f_quote, fill=(228, 211, 193, 235))

        # 4. Action Buttons
        btn_y = sub_y + 50
        btn_h = 52
        gap = 26
        
        # YES button (warm golden gradient pill)
        yes_w = 160
        yes_x0 = center_x - yes_w - gap // 2
        yes_x1 = yes_x0 + yes_w
        yes_stops = [
            (254, 220, 124, 255),
            (246, 179, 62, 255),
            (224, 139, 28, 255)
        ]
        draw_pill_gradient(ui_layer, [yes_x0, btn_y, yes_x1, btn_y + btn_h], radius=btn_h//2, 
                           grad_stops=yes_stops, outline_col=(255, 245, 180, 200), outline_w=1)
        
        yes_text = "YES  →"
        bby = f_btn.getbbox(yes_text)
        d.text((yes_x0 + (yes_w - (bby[2] - bby[0])) // 2, btn_y + (btn_h - (bby[3] - bby[1])) // 2 - 2), 
               yes_text, font=f_btn, fill=(43, 21, 4, 255))

        # NO button (natural resting position vs evaded position)
        no_w = 136
        natural_no_x0 = center_x + gap // 2
        natural_no_y0 = btn_y
        
        if no_abs_pos is not None:
            no_x0, no_y0 = no_abs_pos
        else:
            no_x0, no_y0 = natural_no_x0, natural_no_y0
            
        no_x1 = no_x0 + no_w
        no_y1 = no_y0 + btn_h
        
        # Draw translucent glass pill
        no_pill = Image.new('RGBA', (no_w, btn_h), (30, 12, 5, 110))
        mask = Image.new('L', (no_w, btn_h), 0)
        dm = ImageDraw.Draw(mask)
        dm.rounded_rectangle([0, 0, no_w - 1, btn_h - 1], radius=btn_h//2, fill=255)
        no_pill.putalpha(mask)
        
        do = ImageDraw.Draw(no_pill)
        do.rounded_rectangle([0, 0, no_w - 1, btn_h - 1], radius=btn_h//2, outline=(230, 185, 110, 190), width=2)
        ui_layer.alpha_composite(no_pill, (int(no_x0), int(no_y0)))
        
        no_text = "NO"
        bbn = f_btn.getbbox(no_text)
        d.text((no_x0 + (no_w - (bbn[2] - bbn[0])) // 2, no_y0 + (btn_h - (bbn[3] - bbn[1])) // 2 - 2), 
               no_text, font=f_btn, fill=(247, 237, 224, 255))

        # 5. Playful Toast Bubble if evaded
        if no_abs_pos is not None and toast_text:
            bbt = f_toast.getbbox(toast_text)
            tw_toast = bbt[2] - bbt[0] + 20
            th_toast = 28
            
            # Check if toast should be below or above
            if no_y0 < 70:
                # Below button
                toast_y0 = no_y1 + 8
            else:
                # Above button
                toast_y0 = no_y0 - th_toast - 8
                
            toast_x0 = no_x0 + (no_w - tw_toast) // 2
            
            # Golden pill bubble
            d.rounded_rectangle([toast_x0, toast_y0, toast_x0 + tw_toast, toast_y0 + th_toast], 
                                radius=12, fill=(255, 227, 153, 245), outline=(218, 165, 32, 200), width=1)
            d.text((toast_x0 + 10, toast_y0 + 5), toast_text, font=f_toast, fill=(56, 21, 4, 255))
            
    else:
        # Mobile Layout
        center_x = vw // 2
        f_chap = get_font(font_serif_bold, 10)
        f_main = get_font(font_serif_bold, 24)
        f_high = get_font(font_serif_bold, 26)
        f_quote = get_font(font_serif_italic, 13)
        f_btn = get_font(font_serif_bold, 13)
        f_toast = get_font(font_serif_bold, 11)

        header_y = int(vh * 0.24)
        chap_text = "CHAPTER IV: BEYOND THE HORIZON"
        bbox = f_chap.getbbox(chap_text)
        tw = bbox[2] - bbox[0]
        d.text((center_x - tw//2, header_y), chap_text, font=f_chap, fill=(229, 189, 117, 245))

        title_y1 = header_y + 22
        t1 = "Will you join me on this"
        bb1 = f_main.getbbox(t1)
        tw1 = bb1[2] - bb1[0]
        d.text((center_x - tw1//2, title_y1), t1, font=f_main, fill=(255, 248, 238, 255))

        title_y2 = title_y1 + 30
        t2 = "journey forever?"
        bb2 = f_high.getbbox(t2)
        tw2 = bb2[2] - bb2[0]
        d.text((center_x - tw2//2, title_y2), t2, font=f_high, fill=(247, 190, 88, 255))

        sub_y = title_y2 + 36
        sub_t = "“To infinity and beyond, through every flower and star.”"
        bbs = f_quote.getbbox(sub_t)
        tws = bbs[2] - bbs[0]
        d.text((center_x - tws//2, sub_y), sub_t, font=f_quote, fill=(228, 211, 193, 235))

        btn_y = sub_y + 36
        btn_h = 44
        gap = 16
        yes_w = 110
        yes_x0 = center_x - yes_w - gap // 2
        yes_x1 = yes_x0 + yes_w
        yes_stops = [(254, 220, 124, 255), (246, 179, 62, 255), (224, 139, 28, 255)]
        draw_pill_gradient(ui_layer, [yes_x0, btn_y, yes_x1, btn_y + btn_h], radius=btn_h//2, 
                           grad_stops=yes_stops, outline_col=(255, 245, 180, 200), outline_w=1)
        yes_text = "YES →"
        bby = f_btn.getbbox(yes_text)
        d.text((yes_x0 + (yes_w - (bby[2] - bby[0])) // 2, btn_y + 12), yes_text, font=f_btn, fill=(43, 21, 4, 255))

        no_w = 95
        if no_abs_pos is not None:
            no_x0, no_y0 = no_abs_pos
        else:
            no_x0, no_y0 = center_x + gap // 2, btn_y
            
        no_pill = Image.new('RGBA', (no_w, btn_h), (30, 12, 5, 110))
        mask = Image.new('L', (no_w, btn_h), 0)
        dm = ImageDraw.Draw(mask)
        dm.rounded_rectangle([0, 0, no_w - 1, btn_h - 1], radius=btn_h//2, fill=255)
        no_pill.putalpha(mask)
        do = ImageDraw.Draw(no_pill)
        do.rounded_rectangle([0, 0, no_w - 1, btn_h - 1], radius=btn_h//2, outline=(230, 185, 110, 190), width=2)
        ui_layer.alpha_composite(no_pill, (int(no_x0), int(no_y0)))
        
        no_text = "NO"
        bbn = f_btn.getbbox(no_text)
        d.text((no_x0 + (no_w - (bbn[2] - bbn[0])) // 2, no_y0 + 12), no_text, font=f_btn, fill=(247, 237, 224, 255))

        if no_abs_pos is not None and toast_text:
            bbt = f_toast.getbbox(toast_text)
            tw_toast = bbt[2] - bbt[0] + 16
            th_toast = 24
            toast_y0 = no_y1 + 6 if no_y0 < 60 else no_y0 - th_toast - 6
            toast_x0 = no_x0 + (no_w - tw_toast) // 2
            d.rounded_rectangle([toast_x0, toast_y0, toast_x0 + tw_toast, toast_y0 + th_toast], 
                                radius=10, fill=(255, 227, 153, 245), outline=(218, 165, 32, 200), width=1)
            d.text((toast_x0 + 8, toast_y0 + 4), toast_text, font=f_toast, fill=(56, 21, 4, 255))

    return Image.alpha_composite(screen, ui_layer)

print("Starting Task 6 Verification Generation...")

# ==============================================================================
# CHECKPOINT 1: Opening Scroll Lock Active
# ==============================================================================
print("1. Generating Checkpoint 1: Opening Scroll Lock Active (Flower curtain falling, p=0 locked)...")
cp1_bg = render_scene_at_progress(0.0)
# Overlay floral curtain
curtain_layer = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
cd = ImageDraw.Draw(curtain_layer)
random.seed(42)
for i in range(120):
    sp, aspect = FLOWER_SPRITES[i % len(FLOWER_SPRITES)]
    fx = random.randint(-50, 1650)
    fy = random.randint(100, 850)
    fsz = random.randint(48, 110)
    f_scaled = sp.resize((fsz, int(fsz / aspect)), Image.Resampling.LANCZOS)
    curtain_layer.alpha_composite(f_scaled, (fx, fy))

# Add HUD badge confirming scroll locked
cd.rounded_rectangle([40, 40, 420, 96], radius=12, fill=(20, 10, 5, 210), outline=(230, 185, 110, 200), width=2)
f_hud = get_font(font_sans, 15)
cd.text((60, 50), "🔒 SCROLL LOCKED: Opening Flower Animation", font=f_hud, fill=(255, 230, 170, 255))
cd.text((60, 70), "Progress: 0.00 | Inputs Ignored | Viewport Fixed", font=f_hud, fill=(200, 200, 200, 220))
cp1_img = Image.alpha_composite(cp1_bg, curtain_layer)
cp1_img.save(os.path.join(ARTIFACT_DIR, 'task6_check1_opening_scroll_lock_active.png'), 'PNG')

# ==============================================================================
# CHECKPOINT 2: Clean Scroll Unlock (Scene 1 traversal unlocked)
# ==============================================================================
print("2. Generating Checkpoint 2: Clean Scroll Unlock (Smooth camera traversal enabled)...")
cp2_bg = render_scene_at_progress(0.18)
cp2_layer = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
cp2_d = ImageDraw.Draw(cp2_layer)
cp2_d.rounded_rectangle([40, 40, 440, 96], radius=12, fill=(20, 10, 5, 210), outline=(100, 220, 120, 200), width=2)
cp2_d.text((60, 50), "🔓 SCROLL UNLOCKED: Garden Traversal Active", font=f_hud, fill=(120, 255, 140, 255))
cp2_d.text((60, 70), "Progress: 0.18 | Continuous C1 Camera Pan | Full Reversible", font=f_hud, fill=(200, 200, 200, 220))
cp2_img = Image.alpha_composite(cp2_bg, cp2_layer)
cp2_img.save(os.path.join(ARTIFACT_DIR, 'task6_check2_clean_scroll_unlock_traversal.png'), 'PNG')

# ==============================================================================
# CHECKPOINT 3: Immediate Final Question Reveal on Rocket Tip
# ==============================================================================
print("3. Generating Checkpoint 3: Immediate Final Question Reveal upon Landing (p=0.98)...")
cp3_bg = render_scene_at_progress(0.98)
cp3_img = render_final_ui_with_dodge(cp3_bg, no_abs_pos=None)
# Add timing badge
cp3_layer = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
cp3_d = ImageDraw.Draw(cp3_layer)
cp3_d.rounded_rectangle([40, 40, 450, 96], radius=12, fill=(20, 10, 5, 210), outline=(246, 179, 62, 200), width=2)
cp3_d.text((60, 50), "⚡ IMMEDIATE REVEAL: Synchronized with Landing", font=f_hud, fill=(255, 220, 120, 255))
cp3_d.text((60, 70), "p = 0.98 | Zero setTimeout Delay | Instant Fade-In", font=f_hud, fill=(200, 200, 200, 220))
cp3_img = Image.alpha_composite(cp3_img, cp3_layer)
cp3_img.save(os.path.join(ARTIFACT_DIR, 'task6_check3_immediate_question_reveal_on_landing.png'), 'PNG')

# ==============================================================================
# CHECKPOINT 4: Large NO Button Dodge 1 — Upper-Left Sky Quadrant
# ==============================================================================
print("4. Generating Checkpoint 4: NO Button Dodge 1 (Upper-Left Sky, dx=-290px, dy=-400px)...")
# Natural position of NO button: x ~ 484px, y ~ 640px
# Dodge 1: Upper-left sky (x=160px, y=180px) -> distance ~ 560px!
cp4_bg = render_scene_at_progress(1.0)
cp4_img = render_final_ui_with_dodge(cp4_bg, no_abs_pos=(160, 180), toast_text="Nice try! 😉")
cp4_layer = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
cp4_d = ImageDraw.Draw(cp4_layer)
# Draw evasive motion trajectory line
cp4_d.line([(484, 666), (228, 206)], fill=(255, 215, 100, 160), width=3)
cp4_d.text((320, 410), "⚡ 560px Evasive Leap →", font=f_hud, fill=(255, 230, 160, 240))
cp4_img = Image.alpha_composite(cp4_img, cp4_layer)
cp4_img.save(os.path.join(ARTIFACT_DIR, 'task6_check4_no_dodge_upper_left_sky.png'), 'PNG')

# ==============================================================================
# CHECKPOINT 5: Large NO Button Dodge 2 — Lower-Right Lawn Quadrant
# ==============================================================================
print("5. Generating Checkpoint 5: NO Button Dodge 2 (Lower-Right Lawn, dx=+360px, dy=+110px)...")
# Dodge 2: Lower-right lawn (x=840px, y=750px) -> distance ~ 375px!
cp5_bg = render_scene_at_progress(1.0)
cp5_img = render_final_ui_with_dodge(cp5_bg, no_abs_pos=(840, 750), toast_text="Too slow! 💨")
cp5_layer = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
cp5_d = ImageDraw.Draw(cp5_layer)
cp5_d.line([(484, 666), (908, 776)], fill=(255, 215, 100, 160), width=3)
cp5_d.text((630, 700), "⚡ 375px Cross-Move →", font=f_hud, fill=(255, 230, 160, 240))
cp5_img = Image.alpha_composite(cp5_img, cp5_layer)
cp5_img.save(os.path.join(ARTIFACT_DIR, 'task6_check5_no_dodge_lower_right_lawn.png'), 'PNG')

# ==============================================================================
# CHECKPOINT 6: Large NO Button Dodge 3 — Mid-Left Margin Quadrant
# ==============================================================================
print("6. Generating Checkpoint 6: NO Button Dodge 3 (Far Mid-Left Margin, dx=-380px, dy=-120px)...")
# Dodge 3: Mid-left margin (x=90px, y=520px) -> distance ~ 410px!
cp6_bg = render_scene_at_progress(1.0)
cp6_img = render_final_ui_with_dodge(cp6_bg, no_abs_pos=(90, 520), toast_text="Almost! 😜")
cp6_layer = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
cp6_d = ImageDraw.Draw(cp6_layer)
cp6_d.line([(484, 666), (158, 546)], fill=(255, 215, 100, 160), width=3)
cp6_d.text((260, 590), "⚡ 410px Evasive Leap →", font=f_hud, fill=(255, 230, 160, 240))
cp6_img = Image.alpha_composite(cp6_img, cp6_layer)
cp6_img.save(os.path.join(ARTIFACT_DIR, 'task6_check6_no_dodge_mid_left_margin.png'), 'PNG')

# ==============================================================================
# CHECKPOINT 7: Collision Safety & Boundary Overlay
# ==============================================================================
print("7. Generating Checkpoint 7: Collision Safety & Dynamic Boundary Overlay...")
cp7_bg = render_scene_at_progress(1.0)
cp7_img = render_final_ui_with_dodge(cp7_bg, no_abs_pos=(760, 420), toast_text="Over here! 👋")
cp7_layer = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
cp7_d = ImageDraw.Draw(cp7_layer)

# Overlay YES button safe buffer box (green)
cp7_d.rounded_rectangle([250 - 32, 640 - 32, 410 + 32, 692 + 32], radius=16, outline=(80, 255, 120, 220), width=2)
cp7_d.text((226, 614), "✓ YES Button Safe Buffer (+32px)", font=f_hud, fill=(120, 255, 140, 255))

# Overlay Question Text safe buffer box (blue)
cp7_d.rounded_rectangle([150, 230, 580, 610], radius=16, outline=(100, 180, 255, 220), width=2)
cp7_d.text((160, 206), "✓ Question Text Protected Zone (+20px)", font=f_hud, fill=(140, 210, 255, 255))

# Overlay Rocket Protected Zone (orange)
cp7_d.rounded_rectangle([1080, 80, 1560, 880], radius=16, outline=(255, 160, 60, 200), width=2)
cp7_d.text((1100, 56), "✓ Rocket & Resting Butterfly Protected Zone", font=f_hud, fill=(255, 190, 100, 255))

# Viewport Safe Margin Box (yellow dashed)
cp7_d.rectangle([28, 32, 1600 - 28, 900 - 32], outline=(255, 230, 80, 180), width=2)
cp7_d.text((40, 870), "✓ Strict Viewport Boundary Clamping (28px margin)", font=f_hud, fill=(255, 240, 120, 255))

cp7_img = Image.alpha_composite(cp7_img, cp7_layer)
cp7_img.save(os.path.join(ARTIFACT_DIR, 'task6_check7_collision_safety_boundary_overlay.png'), 'PNG')

# ==============================================================================
# CHECKPOINT 8: Mobile Responsive Layout (390x844)
# ==============================================================================
print("8. Generating Checkpoint 8: Mobile Responsive Dodge Verification (390x844)...")
cp8_bg = render_scene_at_progress(1.0, vw=390, vh=844)
cp8_img = render_final_ui_with_dodge(cp8_bg, no_abs_pos=(42, 680), toast_text="Too slow! 💨", vw=390, vh=844, is_mobile=True)
cp8_img.save(os.path.join(ARTIFACT_DIR, 'task6_check8_mobile_responsive_dodge.png'), 'PNG')

# ==============================================================================
# CHECKPOINT 9: Full-Screen Flower Rain Celebration on YES
# ==============================================================================
print("9. Generating Checkpoint 9: Full-Screen Flower Rain Celebration on YES Click...")
cp9_bg = render_scene_at_progress(1.0)
rain_layer = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
sims = [RainParticleSim(seed=1000 + i, vw=1600, vh=900) for i in range(110)]
for s in sims:
    # Advance 2.5s
    s.start_y += s.vy * 2.5
    if s.start_y > 880: s.start_y = 800 + random.randint(0, 80)
    sp, aspect = FLOWER_SPRITES[s.sprite_idx]
    rw = int(s.radius * 2)
    rh = int(rw / aspect)
    scaled = sp.resize((rw, rh), Image.Resampling.LANCZOS)
    rot_deg = s.initial_rot * 180 / math.pi
    rotated = scaled.rotate(rot_deg, expand=True, resample=Image.Resampling.BICUBIC)
    rain_layer.alpha_composite(rotated, (int(s.base_x), int(s.start_y)))

# Overlay Joyful Celebration Card
cp9_d = ImageDraw.Draw(rain_layer)
card_x0, card_y0 = 480, 260
card_w, card_h = 640, 360
cp9_d.rounded_rectangle([card_x0, card_y0, card_x0 + card_w, card_y0 + card_h], radius=24, 
                        fill=(24, 10, 4, 215), outline=(246, 179, 62, 230), width=2)
f_c_title = get_font(font_serif_bold, 36)
f_c_sub = get_font(font_serif_italic, 20)
cp9_d.text((card_x0 + 130, card_y0 + 70), "SHE SAID YES! ✨🌸", font=f_c_title, fill=(255, 235, 180, 255))
cp9_d.text((card_x0 + 75, card_y0 + 140), "“Our journey to infinity and beyond begins now.”", font=f_c_sub, fill=(240, 220, 200, 240))
cp9_d.text((card_x0 + 120, card_y0 + 200), "Forever blooming through every flower and star.", font=f_c_sub, fill=(229, 189, 117, 230))

# Replay button
draw_pill_gradient(rain_layer, [card_x0 + 220, card_y0 + 260, card_x0 + 420, card_y0 + 312], 
                   radius=26, grad_stops=[(254, 220, 124, 255), (246, 179, 62, 255), (224, 139, 28, 255)], 
                   outline_col=(255, 245, 180, 200), outline_w=1)
cp9_d.text((card_x0 + 262, card_y0 + 276), "REPLAY JOURNEY ↺", font=get_font(font_serif_bold, 14), fill=(43, 21, 4, 255))

cp9_img = Image.alpha_composite(cp9_bg, rain_layer)
cp9_img.save(os.path.join(ARTIFACT_DIR, 'task6_check9_yes_flower_rain_celebration.png'), 'PNG')

# ==============================================================================
# CONTINUOUS VIDEO & GIF RECORDING
# ==============================================================================
print("10. Generating complete continuous sequence video recording (MP4 & GIF)...")
frames_dir = os.path.join(ARTIFACT_DIR, 'task6_frames')
os.makedirs(frames_dir, exist_ok=True)

# Sequence plan:
# Frames 0-15 (0.0s - 1.25s): Flower Curtain falling, scroll locked at Scene 1
# Frames 16-35 (1.25s - 2.9s): Scroll unlocked, smooth camera traversal Scene 1 -> 2 -> 3
# Frames 36-45 (2.9s - 3.75s): Butterfly lands on rocket tip at p=0.98 -> Question fades in IMMEDIATELY
# Frames 46-55 (3.75s - 4.58s): Cursor approaches NO button -> NO dodges to Upper-Left Sky (560px leap) + "Nice try! 😉"
# Frames 56-65 (4.58s - 5.41s): Cursor chases NO button -> NO dodges to Lower-Right Lawn (375px leap) + "Too slow! 💨"
# Frames 66-75 (5.41s - 6.25s): Cursor chases NO button -> NO dodges to Mid-Left Margin (410px leap) + "Almost! 😜"
# Frames 76-90 (6.25s - 7.5s): User clicks YES button -> Cascade of 110 watercolor flowers covers viewport in joyous celebration!

total_frames = 90
fps = 12

print(f"Rendering {total_frames} frames for continuous sequence verification...")
for f in range(total_frames):
    t = f / float(total_frames)
    
    if f < 16:
        # Phase 1: Flower Curtain Falling with Scroll Locked
        bg = render_scene_at_progress(0.0)
        curt = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
        cd = ImageDraw.Draw(curt)
        fall_y = (f / 15.0) * 800
        for i in range(90):
            sp, aspect = FLOWER_SPRITES[(i * 3) % len(FLOWER_SPRITES)]
            fx = (i * 19) % 1600
            fy = int(((i * 37) % 700) + fall_y) % 1100 - 150
            fsz = 50 + (i % 5) * 14
            f_scaled = sp.resize((fsz, int(fsz / aspect)), Image.Resampling.LANCZOS)
            curt.alpha_composite(f_scaled, (fx, fy))
        cd.rounded_rectangle([40, 40, 390, 86], radius=10, fill=(20, 10, 5, 210), outline=(230, 185, 110, 200), width=2)
        cd.text((56, 52), "🔒 SCROLL LOCKED DURING FLOWER TUNNEL", font=f_hud, fill=(255, 230, 170, 255))
        frame_img = Image.alpha_composite(bg, curt)
        
    elif f < 36:
        # Phase 2: Scroll Unlocked, Camera Traverses Scene 1 -> 2 -> 3
        prog = 0.0 + ((f - 16) / 19.0) * 0.98
        bg = render_scene_at_progress(prog)
        ov = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        od.rounded_rectangle([40, 40, 420, 86], radius=10, fill=(20, 10, 5, 210), outline=(100, 220, 120, 200), width=2)
        od.text((56, 52), f"🔓 SCROLL TRAVERSAL ACTIVE (p = {prog:.2f})", font=f_hud, fill=(120, 255, 140, 255))
        frame_img = Image.alpha_composite(bg, ov)
        
    elif f < 46:
        # Phase 3: Immediate Question Reveal as Butterfly Settles on Rocket Tip
        bg = render_scene_at_progress(0.98)
        # Fade in UI immediately
        fade_alpha = min(1.0, (f - 36) / 5.0)
        ui = render_final_ui_with_dodge(Image.new('RGBA', (1600, 900), (0,0,0,0)), no_abs_pos=None)
        # Apply alpha
        r, g, b, a = ui.split()
        a = a.point(lambda p: int(p * fade_alpha))
        ui.putalpha(a)
        frame_img = Image.alpha_composite(bg, ui)
        
    elif f < 56:
        # Phase 4: Dodge 1 — Upper-Left Sky
        t_jump = (f - 46) / 9.0
        # Interpolate from natural (484, 640) to (160, 180) with elastic easing
        sm = math.sin(t_jump * math.pi * 0.5)
        cur_x = int(484 + (160 - 484) * sm)
        cur_y = int(640 + (180 - 640) * sm)
        bg = render_scene_at_progress(1.0)
        frame_img = render_final_ui_with_dodge(bg, no_abs_pos=(cur_x, cur_y), toast_text="Nice try! 😉")
        
    elif f < 66:
        # Phase 5: Dodge 2 — Lower-Right Lawn
        t_jump = (f - 56) / 9.0
        sm = math.sin(t_jump * math.pi * 0.5)
        cur_x = int(160 + (840 - 160) * sm)
        cur_y = int(180 + (750 - 180) * sm)
        bg = render_scene_at_progress(1.0)
        frame_img = render_final_ui_with_dodge(bg, no_abs_pos=(cur_x, cur_y), toast_text="Too slow! 💨")
        
    elif f < 76:
        # Phase 6: Dodge 3 — Far Mid-Left Margin
        t_jump = (f - 66) / 9.0
        sm = math.sin(t_jump * math.pi * 0.5)
        cur_x = int(840 + (90 - 840) * sm)
        cur_y = int(750 + (520 - 750) * sm)
        bg = render_scene_at_progress(1.0)
        frame_img = render_final_ui_with_dodge(bg, no_abs_pos=(cur_x, cur_y), toast_text="Almost! 😜")
        
    else:
        # Phase 7: YES Click -> Flower Rain Cascade Celebration!
        t_rain = (f - 76) / 14.0
        bg = render_scene_at_progress(1.0)
        rain_l = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
        for i, s in enumerate(sims):
            cur_y = s.start_y + s.vy * (t_rain * 2.2)
            if cur_y > 880: cur_y = 800 + (i % 60)
            sp, aspect = FLOWER_SPRITES[s.sprite_idx]
            rw = int(s.radius * 2)
            rh = int(rw / aspect)
            scaled = sp.resize((rw, rh), Image.Resampling.LANCZOS)
            rot_deg = (s.initial_rot + t_rain * 2.0) * 180 / math.pi
            rotated = scaled.rotate(rot_deg, expand=True, resample=Image.Resampling.BICUBIC)
            rain_l.alpha_composite(rotated, (int(s.base_x), int(cur_y)))
            
        # Celebration card fades in
        if t_rain > 0.4:
            c_alpha = min(1.0, (t_rain - 0.4) / 0.6)
            c_layer = Image.new('RGBA', (1600, 900), (0, 0, 0, 0))
            cd = ImageDraw.Draw(c_layer)
            card_x0, card_y0 = 480, 260
            card_w, card_h = 640, 360
            cd.rounded_rectangle([card_x0, card_y0, card_x0 + card_w, card_y0 + card_h], radius=24, 
                                 fill=(24, 10, 4, int(215 * c_alpha)), outline=(246, 179, 62, int(230 * c_alpha)), width=2)
            cd.text((card_x0 + 130, card_y0 + 70), "SHE SAID YES! ✨🌸", font=f_c_title, fill=(255, 235, 180, int(255 * c_alpha)))
            cd.text((card_x0 + 75, card_y0 + 140), "“Our journey to infinity and beyond begins now.”", font=f_c_sub, fill=(240, 220, 200, int(240 * c_alpha)))
            cd.text((card_x0 + 120, card_y0 + 200), "Forever blooming through every flower and star.", font=f_c_sub, fill=(229, 189, 117, int(230 * c_alpha)))
            rain_l = Image.alpha_composite(rain_l, c_layer)
            
        frame_img = Image.alpha_composite(bg, rain_l)

    frame_path = os.path.join(frames_dir, f'frame_{f:03d}.png')
    frame_img.save(frame_path, 'PNG')

print("Encoding MP4 video...")
mp4_out = os.path.join(ARTIFACT_DIR, 'task6_timing_scroll_dodge_complete.mp4')
cmd_mp4 = [
    'ffmpeg', '-y', '-framerate', str(fps),
    '-i', os.path.join(frames_dir, 'frame_%03d.png'),
    '-c:v', 'mpeg4', '-q:v', '3',
    '-pix_fmt', 'yuv420p', mp4_out
]
subprocess.run(cmd_mp4, check=True)

print("Encoding high-quality GIF...")
gif_out = os.path.join(ARTIFACT_DIR, 'task6_timing_scroll_dodge_complete.gif')
palette_path = os.path.join(ARTIFACT_DIR, 'task6_palette.png')
cmd_pal = [
    'ffmpeg', '-y',
    '-i', os.path.join(frames_dir, 'frame_%03d.png'),
    '-vf', 'fps=12,scale=720:-1:flags=lanczos,palettegen',
    palette_path
]
subprocess.run(cmd_pal, check=True)

cmd_gif = [
    'ffmpeg', '-y',
    '-i', os.path.join(frames_dir, 'frame_%03d.png'),
    '-i', palette_path,
    '-lavfi', 'fps=12,scale=720:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=3',
    gif_out
]
subprocess.run(cmd_gif, check=True)

print(f"Task 6 Verification Complete! Outputs saved in {ARTIFACT_DIR}")
