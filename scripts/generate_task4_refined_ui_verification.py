import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ARTIFACT_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
os.makedirs(ARTIFACT_DIR, exist_ok=True)

import sys
sys.path.append('scripts')
from generate_task3_environmental_verification import render_frame

# Load high quality fonts
try:
    font_serif_bold = '/usr/share/fonts/liberation-serif-fonts/LiberationSerif-Bold.ttf'
    font_serif_italic = '/usr/share/fonts/liberation-serif-fonts/LiberationSerif-Italic.ttf'
    font_serif_reg = '/usr/share/fonts/liberation-serif-fonts/LiberationSerif-Regular.ttf'
    font_sans = '/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf'
except:
    font_serif_bold = font_serif_italic = font_serif_reg = font_sans = None

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def draw_pill_gradient(img, xy, radius, grad_stops, outline_col=None, outline_w=1):
    """
    Renders a smooth gradient pill-shaped button.
    xy: [x0, y0, x1, y1]
    """
    x0, y0, x1, y1 = xy
    w = int(x1 - x0)
    h = int(y1 - y0)
    pill = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(pill)
    
    # Draw linear gradient vertical/diagonal
    for y in range(h):
        t = y / max(1, h - 1)
        # Interpolate between stops
        if t <= 0.5:
            t_loc = t / 0.5
            c0, c1 = grad_stops[0], grad_stops[1]
        else:
            t_loc = (t - 0.5) / 0.5
            c0, c1 = grad_stops[1], grad_stops[2]
        r = int(c0[0] + (c1[0] - c0[0]) * t_loc)
        g = int(c0[1] + (c1[1] - c0[1]) * t_loc)
        b = int(c0[2] + (c1[2] - c0[2]) * t_loc)
        a = int(c0[3] + (c1[3] - c0[3]) * t_loc)
        d.line([(0, y), (w, y)], fill=(r, g, b, a))
        
    # Mask to rounded pill
    mask = Image.new('L', (w, h), 0)
    dm = ImageDraw.Draw(mask)
    dm.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)
    pill.putalpha(Image.composite(pill.split()[3], Image.new('L', (w, h), 0), mask))
    
    if outline_col:
        do = ImageDraw.Draw(pill)
        do.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, outline=outline_col, width=outline_w)
        
    img.alpha_composite(pill, (int(x0), int(y0)))

def render_final_interaction_ui(screen, no_offset=(0, 0), show_toast=False, vw=1600, vh=900, is_mobile=False):
    """
    Renders the exact refined Final Question UI matching the user's reference image:
    - 100% TRANSPARENT background (NO card, NO box, NO border).
    - Chapter IV header with subtle flanking gold lines.
    - Large warm ivory title + golden amber highlight.
    - Italic serif supporting quote.
    - Horizontal pill buttons: Warm golden YES -> and thin outlined NO.
    - Playful NO dodge physics and toast bubble.
    """
    ui_layer = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
    d = ImageDraw.Draw(ui_layer)
    
    if not is_mobile:
        # Desktop layout: Centered within open sky quadrant on left (x: 8vw to 46vw)
        center_x = int(vw * 0.33)
        start_y = int(vh * 0.28)
        
        f_chap = get_font(font_serif_bold, 14)
        f_title = get_font(font_serif_bold, 36)
        f_sub = get_font(font_serif_italic, 18)
        f_btn_yes = get_font(font_serif_bold, 17)
        f_btn_no = get_font(font_serif_bold, 16)
        f_toast = get_font(font_sans, 13)
        
        line_w = 42
        btn_w_yes = 168
        btn_w_no = 142
        btn_h = 52
        btn_gap = 26
    else:
        # Mobile layout: Upper center quadrant (clear of rocket tip at y=188)
        center_x = vw // 2
        start_y = 14
        
        f_chap = get_font(font_serif_bold, 10)
        f_title = get_font(font_serif_bold, 17)
        f_sub = get_font(font_serif_italic, 11)
        f_btn_yes = get_font(font_serif_bold, 12)
        f_btn_no = get_font(font_serif_bold, 11)
        f_toast = get_font(font_sans, 10)
        
        line_w = 22
        btn_w_yes = 108
        btn_w_no = 92
        btn_h = 34
        btn_gap = 14

    # 1. CHAPTER HEADER WITH SUBTLE GOLD HORIZONTAL LINES
    chap_text = "CHAPTER IV: BEYOND THE HORIZON"
    # Measure text bounding box
    bbox = d.textbbox((0, 0), chap_text, font=f_chap)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    chap_y = start_y
    # Left flanking line with gradient
    for lx in range(line_w):
        alpha = int(180 * (lx / line_w))
        d.line([(center_x - tw // 2 - 16 - (line_w - lx), chap_y), 
                (center_x - tw // 2 - 16 - (line_w - lx) + 1, chap_y)], fill=(229, 189, 117, alpha), width=1)
    # Right flanking line with gradient
    for rx in range(line_w):
        alpha = int(180 * (1.0 - rx / line_w))
        d.line([(center_x + tw // 2 + 16 + rx, chap_y), 
                (center_x + tw // 2 + 16 + rx + 1, chap_y)], fill=(229, 189, 117, alpha), width=1)
        
    # Header text with delicate shadow
    d.text((center_x + 1, chap_y + 1), chap_text, font=f_chap, fill=(0, 0, 0, 180), anchor="mm")
    d.text((center_x, chap_y), chap_text, font=f_chap, fill=(229, 189, 117, 240), anchor="mm")
    
    # 2. MAIN QUESTION TITLE (Line 1: Ivory, Line 2: Golden Amber)
    q1_text = "Will you join me on this"
    q2_text = "journey forever?"
    
    q1_y = chap_y + (38 if not is_mobile else 20)
    q2_y = q1_y + (46 if not is_mobile else 22)
    
    # Text shadow for pristine readability against sunset clouds
    for dx, dy, col, op in [(0, 3, (0, 0, 0), 200), (0, 1, (0, 0, 0), 230), (0, 0, (0, 0, 0), 140)]:
        d.text((center_x + dx, q1_y + dy), q1_text, font=f_title, fill=(col[0], col[1], col[2], op), anchor="mm")
        d.text((center_x + dx, q2_y + dy), q2_text, font=f_title, fill=(col[0], col[1], col[2], op), anchor="mm")
        
    d.text((center_x, q1_y), q1_text, font=f_title, fill=(255, 248, 238, 255), anchor="mm")
    d.text((center_x, q2_y), q2_text, font=f_title, fill=(247, 190, 88, 255), anchor="mm")
    
    # 3. SUPPORTING QUOTE (Italic Serif in muted parchment cream)
    quote_text = '“To infinity and beyond, through every flower and star.”'
    quote_y = q2_y + (42 if not is_mobile else 20)
    d.text((center_x + 1, quote_y + 2), quote_text, font=f_sub, fill=(0, 0, 0, 210), anchor="mm")
    d.text((center_x, quote_y), quote_text, font=f_sub, fill=(228, 211, 193, 240), anchor="mm")
    
    # 4. HORIZONTAL ACTION BUTTONS ROW
    btns_y = quote_y + (48 if not is_mobile else 24)
    total_btns_w = btn_w_yes + btn_gap + btn_w_no
    yes_x0 = center_x - total_btns_w // 2
    yes_y0 = btns_y
    yes_x1 = yes_x0 + btn_w_yes
    yes_y1 = yes_y0 + btn_h
    
    # YES Button Glow (Soft restrained golden glow)
    glow = Image.new('RGBA', (btn_w_yes + 40, btn_h + 40), (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow)
    dg.rounded_rectangle([15, 15, btn_w_yes + 25, btn_h + 25], radius=btn_h // 2 + 5, fill=(246, 179, 62, 95))
    glow = glow.filter(ImageFilter.GaussianBlur(12))
    ui_layer.alpha_composite(glow, (yes_x0 - 20, yes_y0 - 20))
    
    # YES Button Pill Gradient (#fedc7c -> #f6b33e -> #e08b1c)
    grad_stops_yes = [
        (254, 220, 124, 255),
        (246, 179, 62, 255),
        (224, 139, 28, 255),
    ]
    draw_pill_gradient(ui_layer, [yes_x0, yes_y0, yes_x1, yes_y1], radius=btn_h // 2, grad_stops=grad_stops_yes, outline_col=(255, 245, 180, 200), outline_w=1)
    
    # YES Text with arrow (Dark espresso text #2b1504)
    d_btn = ImageDraw.Draw(ui_layer)
    d_btn.text((yes_x0 + btn_w_yes // 2 - (6 if not is_mobile else 4), yes_y0 + btn_h // 2), "YES  →", font=f_btn_yes, fill=(43, 21, 4, 255), anchor="mm")
    
    # NO Button Base Position (to the right of YES button)
    no_base_x = yes_x1 + btn_gap
    no_x0 = no_base_x + no_offset[0]
    no_y0 = yes_y0 + no_offset[1]
    no_x1 = no_x0 + btn_w_no
    no_y1 = no_y0 + btn_h
    
    # NO Button Shadow
    no_sh = Image.new('RGBA', (btn_w_no + 20, btn_h + 20), (0, 0, 0, 0))
    dns = ImageDraw.Draw(no_sh)
    dns.rounded_rectangle([10, 10, btn_w_no + 10, btn_h + 10], radius=btn_h // 2, fill=(0, 0, 0, 120))
    no_sh = no_sh.filter(ImageFilter.GaussianBlur(6))
    ui_layer.alpha_composite(no_sh, (int(no_x0 - 10), int(no_y0 - 10)))
    
    # NO Button Pill: Subtle dark-tinted background with thin golden outline
    grad_stops_no = [
        (35, 15, 6, 120),
        (25, 10, 4, 150),
        (18, 6, 2, 180),
    ]
    draw_pill_gradient(ui_layer, [no_x0, no_y0, no_x1, no_y1], radius=btn_h // 2, grad_stops=grad_stops_no, outline_col=(230, 185, 110, 190), outline_w=1)
    
    # NO Button Text (Ivory #f7ede0)
    d_btn.text((no_x0 + btn_w_no // 2, no_y0 + btn_h // 2), "NO", font=f_btn_no, fill=(247, 237, 224, 250), anchor="mm")
    
    # Playful Dodge Toast Bubble
    if show_toast:
        toast_w, toast_h = 104, 28
        tx0 = int(no_x0 + (btn_w_no - toast_w) // 2)
        ty0 = int(no_y0 - toast_h - 10)
        
        # Toast shadow
        t_sh = Image.new('RGBA', (toast_w + 16, toast_h + 16), (0, 0, 0, 0))
        dts = ImageDraw.Draw(t_sh)
        dts.rounded_rectangle([8, 8, toast_w + 8, toast_h + 8], radius=12, fill=(0, 0, 0, 130))
        t_sh = t_sh.filter(ImageFilter.GaussianBlur(5))
        ui_layer.alpha_composite(t_sh, (tx0 - 8, ty0 - 8))
        
        # Toast body (Warm golden amber)
        d_btn.rounded_rectangle([tx0, ty0, tx0 + toast_w, ty0 + toast_h], radius=12, fill=(255, 227, 153, 250), outline=(255, 245, 190, 220), width=1)
        # Downward pointer triangle
        d_btn.polygon([(tx0 + toast_w // 2 - 5, ty0 + toast_h), 
                       (tx0 + toast_w // 2 + 5, ty0 + toast_h), 
                       (tx0 + toast_w // 2, ty0 + toast_h + 5)], fill=(255, 227, 153, 250))
        d_btn.text((tx0 + toast_w // 2, ty0 + toast_h // 2), "Nice try! 😉", font=f_toast, fill=(56, 21, 4, 255), anchor="mm")

    # Composite UI directly onto the scene
    result = screen.convert('RGBA')
    result.alpha_composite(ui_layer, (0, 0))
    return result.convert('RGB')

def render_celebration_screen(screen, vw=1600, vh=900, is_mobile=False):
    """
    Renders the celebration view on YES click with joyful petal burst canvas!
    """
    result = screen.convert('RGBA')
    overlay = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    
    # 1. Joyful Falling Petals Burst
    import random
    random.seed(42)
    petal_colors = [(244, 114, 182), (251, 113, 133), (251, 191, 36), (245, 158, 11), (255, 215, 121), (232, 121, 249)]
    for _ in range(75):
        px = random.randint(0, vw)
        py = random.randint(0, vh)
        psize = random.randint(6, 14)
        prot = random.random() * math.pi
        pcol = random.choice(petal_colors)
        palpha = random.randint(140, 230)
        
        # Draw delicate organic petal ellipse
        p_img = Image.new('RGBA', (psize * 3, psize * 3), (0, 0, 0, 0))
        dp = ImageDraw.Draw(p_img)
        dp.ellipse([psize // 2, psize // 2, psize * 2, psize + psize // 2], fill=(pcol[0], pcol[1], pcol[2], palpha))
        p_img = p_img.rotate(math.degrees(prot), resample=Image.Resampling.BILINEAR)
        overlay.alpha_composite(p_img, (px, py))
        
    # 2. Celebration Modal Card
    card_w = min(580, int(vw * 0.88))
    card_h = 320 if not is_mobile else 270
    card_x = (vw - card_w) // 2
    card_y = (vh - card_h) // 2
    
    # Drop shadow
    c_sh = Image.new('RGBA', (card_w + 40, card_h + 40), (0, 0, 0, 0))
    dcs = ImageDraw.Draw(c_sh)
    dcs.rounded_rectangle([20, 20, card_w + 20, card_h + 20], radius=24, fill=(0, 0, 0, 180))
    c_sh = c_sh.filter(ImageFilter.GaussianBlur(16))
    overlay.alpha_composite(c_sh, (card_x - 20, card_y - 20))
    
    # Card surface
    card = Image.new('RGBA', (card_w, card_h), (0, 0, 0, 0))
    dc = ImageDraw.Draw(card)
    dc.rounded_rectangle([0, 0, card_w - 1, card_h - 1], radius=24, fill=(35, 14, 6, 235), outline=(255, 215, 120, 200), width=2)
    
    f_cel_title = get_font(font_serif_bold, 30 if not is_mobile else 22)
    f_cel_sub = get_font(font_serif_bold, 18 if not is_mobile else 14)
    f_cel_quote = get_font(font_serif_italic, 15 if not is_mobile else 12)
    f_btn = get_font(font_serif_bold, 15 if not is_mobile else 13)
    
    dc.text((card_w // 2, 54 if not is_mobile else 42), "SHE SAID YES! ✨", font=f_cel_title, fill=(255, 215, 120, 255), anchor="mm")
    dc.text((card_w // 2, 98 if not is_mobile else 78), "Forever Begins Today", font=f_cel_sub, fill=(255, 246, 232, 240), anchor="mm")
    dc.text((card_w // 2, 144 if not is_mobile else 118), "“Across every star and every flower,\nI will cherish you in every lifetime.”", font=f_cel_quote, fill=(235, 210, 190, 220), anchor="mm", align="center")
    
    # REPLAY JOURNEY Button
    rbtn_w = 210 if not is_mobile else 165
    rbtn_h = 46 if not is_mobile else 38
    rx0 = (card_w - rbtn_w) // 2
    ry0 = card_h - rbtn_h - (36 if not is_mobile else 26)
    
    grad_stops = [(254, 220, 124, 255), (246, 179, 62, 255), (224, 139, 28, 255)]
    draw_pill_gradient(card, [rx0, ry0, rx0 + rbtn_w, ry0 + rbtn_h], radius=rbtn_h // 2, grad_stops=grad_stops, outline_col=(255, 245, 180, 220), outline_w=1)
    dc.text((card_w // 2, ry0 + rbtn_h // 2), "REPLAY JOURNEY  ↺", font=f_btn, fill=(43, 21, 4, 255), anchor="mm")
    
    overlay.alpha_composite(card, (card_x, card_y))
    result.alpha_composite(overlay, (0, 0))
    return result.convert('RGB')

def main():
    print("Generating Refined Final Interaction Verification Checkpoints...")
    
    # Base rocket scene frame (p = 1.0, butterfly landed on pointed tip of rocket)
    base_desktop = render_frame(1.00, time_s=8.0, vw=1600, vh=900)
    
    # Checkpoint 1: Desktop composition matching reference image
    print("Saving Checkpoint 1: Desktop refined UI (transparent background, horizontal buttons, rocket on right)...")
    cp1 = render_final_interaction_ui(base_desktop, no_offset=(0, 0), show_toast=False, vw=1600, vh=900, is_mobile=False)
    cp1.save(os.path.join(ARTIFACT_DIR, 'task4_refined_check1_desktop_composition.png'), quality=95)
    
    # Checkpoint 2: NO button playfully dodging away without overlapping YES
    print("Saving Checkpoint 2: NO button playful dodge (+85px, -38px) with toast bubble...")
    cp2 = render_final_interaction_ui(base_desktop, no_offset=(85, -38), show_toast=True, vw=1600, vh=900, is_mobile=False)
    cp2.save(os.path.join(ARTIFACT_DIR, 'task4_refined_check2_no_button_dodge.png'), quality=95)
    
    # Checkpoint 3: Celebration view on YES click
    print("Saving Checkpoint 3: Celebration screen with joyful falling petal burst...")
    cp3 = render_celebration_screen(base_desktop, vw=1600, vh=900, is_mobile=False)
    cp3.save(os.path.join(ARTIFACT_DIR, 'task4_refined_check3_celebration_screen.png'), quality=95)
    
    # Checkpoint 4: Mobile Responsive Layout
    print("Saving Checkpoint 4: Mobile responsive layout (480x854)...")
    base_mobile = render_frame(1.00, time_s=8.0, vw=480, vh=854)
    cp4 = render_final_interaction_ui(base_mobile, no_offset=(0, 0), show_toast=False, vw=480, vh=854, is_mobile=True)
    cp4.save(os.path.join(ARTIFACT_DIR, 'task4_refined_check4_mobile_composition.png'), quality=95)
    
    # Continuous Video Generation: 60 frames capturing reveal, dodge, and celebration!
    print("Generating continuous video recording for final interaction...")
    frames_dir = os.path.join(ARTIFACT_DIR, 'task4_refined_frames')
    os.makedirs(frames_dir, exist_ok=True)
    
    total_frames = 60
    for f in range(total_frames):
        # f = 0..15: question static, NO button at resting position
        # f = 16..35: NO button dodges smoothly with spring easing
        # f = 36..42: brief hold on dodge + toast
        # f = 43..60: YES clicked, celebration screen with falling petals!
        if f < 16:
            frame_img = render_final_interaction_ui(base_desktop, no_offset=(0, 0), show_toast=False)
        elif f < 42:
            t = (f - 16) / (35 - 16)
            t_clamped = min(1.0, max(0.0, t))
            # Spring overshoot easing
            s = 1.70158
            ease = (t_clamped - 1.0) * (t_clamped - 1.0) * ((s + 1) * (t_clamped - 1.0) + s) + 1.0
            cur_x = int(85 * ease)
            cur_y = int(-38 * ease)
            frame_img = render_final_interaction_ui(base_desktop, no_offset=(cur_x, cur_y), show_toast=(f >= 24))
        else:
            frame_img = render_celebration_screen(base_desktop)
            
        frame_img.save(os.path.join(frames_dir, f'frame_{f:03d}.png'))
        
    mp4_path = os.path.join(ARTIFACT_DIR, 'task4_refined_final_interaction.mp4')
    gif_path = os.path.join(ARTIFACT_DIR, 'task4_refined_final_interaction.gif')
    
    try:
        subprocess.run([
            'ffmpeg', '-y', '-framerate', '12',
            '-i', os.path.join(frames_dir, 'frame_%03d.png'),
            '-c:v', 'libopenh264', '-pix_fmt', 'yuv420p',
            mp4_path
        ], check=True)
    except Exception as e:
        print("MP4 generation note:", e)
    
    subprocess.run([
        'ffmpeg', '-y', '-framerate', '12',
        '-i', os.path.join(frames_dir, 'frame_%03d.png'),
        '-vf', 'fps=12,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer',
        gif_path
    ], check=True)
    
    print("Verification generation complete!")

if __name__ == '__main__':
    main()
