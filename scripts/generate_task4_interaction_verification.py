import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ARTIFACT_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
os.makedirs(ARTIFACT_DIR, exist_ok=True)

import sys
sys.path.append('scripts')
from generate_task3_environmental_verification import render_frame

def draw_corner_foils(card_draw, card_w, card_h):
    c_col = (255, 215, 120, 220)
    # TL
    card_draw.line([(14, 14), (28, 14)], fill=c_col, width=2)
    card_draw.line([(14, 14), (14, 28)], fill=c_col, width=2)
    # TR
    card_draw.line([(card_w - 28, 14), (card_w - 14, 14)], fill=c_col, width=2)
    card_draw.line([(card_w - 14, 14), (card_w - 14, 28)], fill=c_col, width=2)
    # BL
    card_draw.line([(14, card_h - 14), (28, card_h - 14)], fill=c_col, width=2)
    card_draw.line([(14, card_h - 28), (14, card_h - 14)], fill=c_col, width=2)
    # BR
    card_draw.line([(card_w - 28, card_h - 14), (card_w - 14, card_h - 14)], fill=c_col, width=2)
    card_draw.line([(card_w - 14, card_h - 28), (card_w - 14, card_h - 14)], fill=c_col, width=2)

def draw_proposal_card(img, no_offset=(0, 0), show_toast=False, vw=1600, vh=900, is_mobile=False):
    card_w = min(560, int(vw * 0.88))
    card_h = 320 if not is_mobile else 270

    if not is_mobile:
        card_x = int(vw * 0.14)
        card_y = int(vh * 0.38)
    else:
        card_x = (vw - card_w) // 2
        card_y = int(vh * 0.58)

    # Fonts
    f_chap = ImageFont.truetype('/usr/share/fonts/liberation-serif-fonts/LiberationSerif-Bold.ttf', 13 if not is_mobile else 11)
    f_title = ImageFont.truetype('/usr/share/fonts/liberation-serif-fonts/LiberationSerif-Bold.ttf', 24 if not is_mobile else 18)
    f_sub = ImageFont.truetype('/usr/share/fonts/liberation-serif-fonts/LiberationSerif-Italic.ttf', 15 if not is_mobile else 12)
    f_btn = ImageFont.truetype('/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf', 15 if not is_mobile else 13)
    f_toast = ImageFont.truetype('/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf', 12)

    # Shadow
    shadow = Image.new('RGBA', (card_w + 40, card_h + 40), (0, 0, 0, 0))
    ds = ImageDraw.Draw(shadow)
    ds.rounded_rectangle([20, 20, card_w + 20, card_h + 20], radius=24, fill=(8, 3, 1, 200))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    img.paste(shadow, (card_x - 20, card_y - 12), shadow)

    # Card base
    card = Image.new('RGBA', (card_w, card_h), (0, 0, 0, 0))
    dc = ImageDraw.Draw(card)
    dc.rounded_rectangle([0, 0, card_w - 1, card_h - 1], radius=24, fill=(28, 12, 6, 238), outline=(255, 215, 120, 180), width=2)
    dc.rounded_rectangle([8, 8, card_w - 9, card_h - 9], radius=18, outline=(215, 165, 80, 80), width=1)
    draw_corner_foils(dc, card_w, card_h)

    # Typography
    dc.text((card_w // 2, 42 if not is_mobile else 34), "—  CHAPTER IV: BEYOND THE HORIZON  —", font=f_chap, fill=(245, 200, 110, 230), anchor="mm")
    dc.text((card_w // 2, 85 if not is_mobile else 68), "Will you join me on this", font=f_title, fill=(255, 245, 225, 255), anchor="mm")
    dc.text((card_w // 2, 118 if not is_mobile else 94), "journey forever?", font=f_title, fill=(255, 215, 120, 255), anchor="mm")
    dc.text((card_w // 2, 162 if not is_mobile else 132), '"To infinity and beyond, through every flower and star."', font=f_sub, fill=(235, 195, 140, 210), anchor="mm")

    # Action buttons
    btn_w = 145 if not is_mobile else 115
    btn_h = 48 if not is_mobile else 40
    btn_y = (card_h - btn_h - 36) if not is_mobile else (card_h - btn_h - 26)

    # YES Button
    yes_x = card_w // 2 - btn_w - (18 if not is_mobile else 10)
    dc.rounded_rectangle([yes_x, btn_y, yes_x + btn_w, btn_y + btn_h], radius=24, fill=(255, 200, 75, 255), outline=(255, 245, 190, 255), width=2)
    dc.text((yes_x + btn_w // 2 - 8, btn_y + btn_h // 2), "YES", font=f_btn, fill=(40, 16, 4, 255), anchor="mm")
    hx = yes_x + btn_w // 2 + 16
    hy = btn_y + btn_h // 2
    dc.polygon([(hx - 5, hy - 1), (hx, hy + 5), (hx + 5, hy - 1)], fill=(40, 16, 4, 255))
    dc.ellipse([hx - 6, hy - 5, hx, hy], fill=(40, 16, 4, 255))
    dc.ellipse([hx, hy - 5, hx + 6, hy], fill=(40, 16, 4, 255))

    # NO Button
    no_base_x = card_w // 2 + (18 if not is_mobile else 10)
    no_x = no_base_x + no_offset[0]
    no_y = btn_y + no_offset[1]

    dc.rounded_rectangle([no_x, no_y, no_x + btn_w, no_y + btn_h], radius=24, fill=(48, 22, 12, 190), outline=(235, 195, 140, 120), width=1)
    dc.text((no_x + btn_w // 2, no_y + btn_h // 2), "NO", font=f_btn, fill=(235, 210, 190, 220), anchor="mm")

    if show_toast:
        toast_w, toast_h = 100, 28
        tx = no_x + (btn_w - toast_w) // 2
        ty = no_y - toast_h - 10
        dc.rounded_rectangle([tx, ty, tx + toast_w, ty + toast_h], radius=12, fill=(255, 227, 153, 255), outline=(255, 245, 200, 240), width=1)
        dc.text((tx + toast_w // 2, ty + toast_h // 2), "Nice try! ;)", font=f_toast, fill=(56, 21, 4, 255), anchor="mm")

    img.paste(card, (card_x, card_y), card)

def draw_celebration_card(img, vw=1600, vh=900, is_mobile=False):
    card_w = min(620, int(vw * 0.90))
    card_h = 340 if not is_mobile else 290
    card_x = int(vw * 0.12) if not is_mobile else (vw - card_w) // 2
    card_y = int(vh * 0.36) if not is_mobile else int(vh * 0.55)

    f_sub = ImageFont.truetype('/usr/share/fonts/liberation-serif-fonts/LiberationSerif-Italic.ttf', 16 if not is_mobile else 13)
    f_title = ImageFont.truetype('/usr/share/fonts/liberation-serif-fonts/LiberationSerif-Bold.ttf', 26 if not is_mobile else 19)
    f_head = ImageFont.truetype('/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf', 15 if not is_mobile else 12)
    f_btn = ImageFont.truetype('/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf', 15 if not is_mobile else 13)

    shadow = Image.new('RGBA', (card_w + 40, card_h + 40), (0, 0, 0, 0))
    ds = ImageDraw.Draw(shadow)
    ds.rounded_rectangle([20, 20, card_w + 20, card_h + 20], radius=28, fill=(10, 4, 2, 220))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    img.paste(shadow, (card_x - 20, card_y - 12), shadow)

    card = Image.new('RGBA', (card_w, card_h), (0, 0, 0, 0))
    dc = ImageDraw.Draw(card)
    dc.rounded_rectangle([0, 0, card_w - 1, card_h - 1], radius=28, fill=(35, 15, 8, 240), outline=(255, 225, 130, 220), width=2)
    dc.rounded_rectangle([8, 8, card_w - 9, card_h - 9], radius=20, outline=(235, 185, 95, 110), width=1)
    draw_corner_foils(dc, card_w, card_h)

    dc.text((card_w // 2, 50 if not is_mobile else 38), "SHE SAID YES!", font=f_head, fill=(255, 225, 120, 255), anchor="mm")
    
    t_text = "Forever Begins Today"
    tw = dc.textlength(t_text, font=f_title)
    tcx = card_w // 2 - 12
    tcy = 105 if not is_mobile else 84
    dc.text((tcx, tcy), t_text, font=f_title, fill=(255, 245, 235, 255), anchor="mm")
    rhx = int(tcx + tw // 2 + 16)
    rhy = tcy
    dc.polygon([(rhx - 6, rhy - 2), (rhx, rhy + 7), (rhx + 6, rhy - 2)], fill=(235, 60, 80, 255))
    dc.ellipse([rhx - 7, rhy - 7, rhx, rhy], fill=(235, 60, 80, 255))
    dc.ellipse([rhx, rhy - 7, rhx + 7, rhy], fill=(235, 60, 80, 255))

    dc.text((card_w // 2, 165 if not is_mobile else 138), '"Across every star and every flower,', font=f_sub, fill=(245, 205, 150, 230), anchor="mm")
    dc.text((card_w // 2, 195 if not is_mobile else 164), 'I will cherish you in every lifetime."', font=f_sub, fill=(245, 205, 150, 230), anchor="mm")

    # Replay button
    rw, rh = 215, 46
    rx = (card_w - rw) // 2
    ry = card_h - rh - 30
    dc.rounded_rectangle([rx, ry, rx + rw, ry + rh], radius=23, fill=(225, 165, 75, 255), outline=(255, 240, 175, 255), width=2)
    rep_text = "REPLAY JOURNEY"
    rtw = dc.textlength(rep_text, font=f_btn)
    dc.text((card_w // 2 - 8, ry + rh // 2), rep_text, font=f_btn, fill=(35, 15, 5, 255), anchor="mm")
    ax = int(card_w // 2 - 8 + rtw // 2 + 14)
    ay = ry + rh // 2
    dc.arc([ax - 6, ay - 6, ax + 6, ay + 6], start=45, end=330, fill=(35, 15, 5, 255), width=2)
    dc.polygon([(ax + 4, ay - 7), (ax + 8, ay - 2), (ax + 2, ay)], fill=(35, 15, 5, 255))

    img.paste(card, (card_x, card_y), card)

    # Falling petals burst
    petals = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
    dp = ImageDraw.Draw(petals)
    import random
    random.seed(77)
    colors = [(244, 114, 182), (251, 113, 133), (251, 191, 36), (245, 158, 11), (255, 215, 120)]
    for _ in range(60):
        px = random.randint(0, vw)
        py = random.randint(0, vh)
        pr = random.randint(6, 12)
        col = random.choice(colors)
        dp.ellipse([px - pr, py - pr * 0.5, px + pr, py + pr * 0.5], fill=col + (random.randint(140, 220),))
    img.paste(petals, (0, 0), petals)

# ---------------------------------------------------------------------------
# Checkpoint 1: Butterfly Landing on Tip during initial pause (No Card yet)
# ---------------------------------------------------------------------------
print('Generating Checkpoint 1: Butterfly landed on tip, pause before card...')
s1 = render_frame(1.00, time_s=8.0, vw=1600, vh=900)
s1.save(os.path.join(ARTIFACT_DIR, 'task4_check1_landing_pause.png'), quality=95)

# ---------------------------------------------------------------------------
# Checkpoint 2: Final Question Card revealed on Desktop
# ---------------------------------------------------------------------------
print('Generating Checkpoint 2: Proposal card revealed on desktop...')
s2 = render_frame(1.00, time_s=9.2, vw=1600, vh=900)
draw_proposal_card(s2, no_offset=(0, 0), show_toast=False, vw=1600, vh=900)
s2.save(os.path.join(ARTIFACT_DIR, 'task4_check2_question_card_desktop.png'), quality=95)

# ---------------------------------------------------------------------------
# Checkpoint 3: NO Button Dodging Pointer with Toast
# ---------------------------------------------------------------------------
print('Generating Checkpoint 3: NO button dodging on pointer approach...')
s3 = render_frame(1.00, time_s=10.5, vw=1600, vh=900)
draw_proposal_card(s3, no_offset=(95, -45), show_toast=True, vw=1600, vh=900)
s3.save(os.path.join(ARTIFACT_DIR, 'task4_check3_no_button_dodging.png'), quality=95)

# ---------------------------------------------------------------------------
# Checkpoint 4: YES Clicked -> Celebration Screen with Falling Petals
# ---------------------------------------------------------------------------
print('Generating Checkpoint 4: YES celebration screen with falling petals...')
s4 = render_frame(1.00, time_s=12.0, vw=1600, vh=900)
draw_celebration_card(s4, vw=1600, vh=900)
s4.save(os.path.join(ARTIFACT_DIR, 'task4_check4_yes_celebration.png'), quality=95)

# ---------------------------------------------------------------------------
# Checkpoint 5: Mobile Layout (390 x 844)
# ---------------------------------------------------------------------------
print('Generating Checkpoint 5: Mobile layout (390 x 844)...')
s5 = render_frame(1.00, time_s=9.5, vw=390, vh=844)
draw_proposal_card(s5, no_offset=(0, 0), show_toast=False, vw=390, vh=844, is_mobile=True)
s5.save(os.path.join(ARTIFACT_DIR, 'task4_check5_mobile_layout.png'), quality=95)

# ---------------------------------------------------------------------------
# Checkpoint 6: Animated Interaction Recording (GIF)
# ---------------------------------------------------------------------------
print('Generating Checkpoint 6: Animated interaction recording...')
os.makedirs('/tmp/task4_frames', exist_ok=True)
frames = []

# Phase 1: Landing pause (frames 0..6)
for i in range(7):
    f = render_frame(1.00, time_s=8.0 + i * 0.15, vw=960, vh=540)
    frames.append(f)

# Phase 2: Card enters (frames 7..14)
for i in range(8):
    f = render_frame(1.00, time_s=9.0 + i * 0.15, vw=960, vh=540)
    draw_proposal_card(f, no_offset=(0, 0), show_toast=False, vw=960, vh=540)
    frames.append(f)

# Phase 3: NO button dodges (frames 15..22)
for i in range(8):
    f = render_frame(1.00, time_s=10.2 + i * 0.15, vw=960, vh=540)
    draw_proposal_card(f, no_offset=(95, -45), show_toast=True, vw=960, vh=540)
    frames.append(f)

# Phase 4: YES clicked -> Celebration burst (frames 23..32)
for i in range(10):
    f = render_frame(1.00, time_s=11.5 + i * 0.15, vw=960, vh=540)
    draw_celebration_card(f, vw=960, vh=540)
    frames.append(f)

for idx, f in enumerate(frames):
    f.save(f'/tmp/task4_frames/f_{idx:03d}.png')

out_gif = os.path.join(ARTIFACT_DIR, 'task4_interaction_recording.gif')
cmd_gif = [
    'ffmpeg', '-y', '-framerate', '8', '-i', '/tmp/task4_frames/f_%03d.png',
    '-vf', 'scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', out_gif
]
subprocess.run(cmd_gif)
print('Generated Task 4 animated interaction recording:', out_gif)
