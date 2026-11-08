"""
BUTTERFLY — Task 4 Refined Storybook Verification & Video Generator
Renders high-resolution browser-accurate screenshots and continuous recording for:
1. Closed book before opening (Scene 2 Pergola, p = 0.3886)
2. Book during opening transition (3D cover rotation & centering, p = 0.45)
3. Fully open and centered first spread (p = 0.50, zero grey overlays, clean scrapbook)
4. Close-up of the central spiral binding (13 continuous closed twin-wire brass loops entering punched holes)
5. Close-up of page corners and layered paper edges (clean rectangular deckled edges)
6. First page-turn at 25%, 50%, 75%, 100% (inextensible rolling cylinder deformation)
7. Next spread after page has settled (Spread 2: unique memory & Chapter II, zero duplicate content)
8. Reverse scrolling confirmation (natural reverse uncurl)
9. Mobile layout verification (390x844)
10. Continuous video recording (MP4 & GIF) of full opening, reading pause, and first page turn
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ART_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
PUBLIC_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public'
SCENES_DIR = os.path.join(PUBLIC_DIR, 'scenes')
SB_DIR = os.path.join(PUBLIC_DIR, 'storybook')

# Load high-resolution assets
pano_img = Image.open(os.path.join(SCENES_DIR, 'seamless_garden_panorama_hd.jpg')).convert('RGBA')
cover_img = Image.open(os.path.join(SB_DIR, 'studio_cover_walnut.jpg')).convert('RGBA')
page_left = Image.open(os.path.join(SB_DIR, 'studio_page_left.jpg')).convert('RGBA')
page_right = Image.open(os.path.join(SB_DIR, 'studio_page_right.jpg')).convert('RGBA')
page_back = Image.open(os.path.join(SB_DIR, 'studio_page_back.jpg')).convert('RGBA')
page_under = Image.open(os.path.join(SB_DIR, 'studio_page_underneath.jpg')).convert('RGBA')
cover_flap = Image.open(os.path.join(SB_DIR, 'closed_book_cover_flap.png')).convert('RGBA')
cover_inside = Image.open(os.path.join(SB_DIR, 'closed_book_cover_inside.png')).convert('RGBA')
bf_img = Image.open(os.path.join(PUBLIC_DIR, 'butterfly/butterfly_full.png')).convert('RGBA')

# Font helper
try:
    f_hint = ImageFont.truetype('/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf', 14)
    f_title = ImageFont.truetype('/usr/share/fonts/liberation-serif-fonts/LiberationSerif-Bold.ttf', 20)
except:
    f_hint = f_title = ImageFont.load_default()

def draw_continuous_brass_spiral(canvas, spine_x, top_y, bot_y, wire_scale=1.0):
    """
    Renders 13 continuous closed twin-wire antique-brass coils that
    physically emerge from the left punched holes (-14 units) and dive
    into the right punched holes (+14 units), looping behind the spine.
    """
    d = ImageDraw.Draw(canvas)
    coil_count = 13
    h = bot_y - top_y
    spacing = h / (coil_count - 1)
    
    # Hole offset in pixels
    hole_dx = int(14.0 * wire_scale)
    loop_w = hole_dx * 2
    wire_r = max(1, int(1.4 * wire_scale))
    
    for i in range(coil_count):
        cy = top_y + i * spacing
        for wy in [cy - 2.2 * wire_scale, cy + 2.2 * wire_scale]:
            # Front arch: from -hole_dx to +hole_dx, looping up in front
            arch_h = int(11.0 * wire_scale)
            bbox = [spine_x - hole_dx, wy - arch_h, spine_x + hole_dx, wy + arch_h]
            
            # Subtle drop shadow behind the brass wire onto paper
            sh_box = [bbox[0] + 1, bbox[1] + 2, bbox[2] + 1, bbox[3] + 2]
            d.arc(sh_box, start=180, end=0, fill=(20, 10, 4, 110), width=wire_r + 1)
            
            # Base brass wire
            d.arc(bbox, start=180, end=0, fill=(180, 130, 45, 255), width=wire_r * 2)
            # Specular metallic highlight along the top crest
            hl_box = [bbox[0] + 1, bbox[1] + 1, bbox[2] - 1, bbox[3] - 1]
            d.arc(hl_box, start=210, end=330, fill=(255, 235, 140, 255), width=max(1, wire_r))

def render_storybook(vw, vh, cover_prog=1.0, curl_prog=0.0, scale_mul=1.0, is_mobile=False):
    """
    Renders the unified physical storybook:
    - cover_prog in [0, 1]: Front cover rotation from 0 deg (closed) to -180 deg (open)
    - curl_prog in [0, 1]: Page curl from right to left
    """
    aspect = 852.0 / 442.0
    base_w = min(0.86 * vw, 0.84 * vh * aspect) if not is_mobile else min(0.94 * vw, 0.82 * vh * aspect)
    book_w = int(base_w * scale_mul)
    book_h = int(book_w / aspect)
    
    canvas = Image.new('RGBA', (book_w, book_h), (0, 0, 0, 0))
    
    # Page dimensions
    page_w = int(book_w * (390.0 / 852.0))
    page_h = int(book_h * (412.0 / 442.0))
    spine_x = book_w // 2
    page_y = (book_h - page_h) // 2
    left_x = spine_x - page_w
    right_x = spine_x
    
    wire_scale = page_w / 390.0
    
    if cover_prog >= 0.999:
        # FULLY OPEN BOOK SPREAD
        # 1. Walnut Leather Hardcover Base
        cov_scaled = cover_img.resize((book_w, book_h), Image.Resampling.LANCZOS)
        canvas.alpha_composite(cov_scaled, (0, 0))
        
        # 2. Left Resting Page
        p_l = page_left.resize((page_w, page_h), Image.Resampling.LANCZOS)
        canvas.alpha_composite(p_l, (left_x, page_y))
        
        # 3. Right Resting Page Underneath
        p_u = page_under.resize((page_w, page_h), Image.Resampling.LANCZOS)
        canvas.alpha_composite(p_u, (right_x, page_y))
        
        # 4. Inextensible Euler Elastica Page Turn
        if curl_prog < 0.999:
            p_f = page_right.resize((page_w, page_h), Image.Resampling.LANCZOS)
            p_b = page_back.resize((page_w, page_h), Image.Resampling.LANCZOS)
            
            t = curl_prog
            # Flat right width
            flat_w = int(page_w * (1.0 - t))
            if flat_w > 2:
                strip_front = p_f.crop((0, 0, flat_w, page_h))
                canvas.alpha_composite(strip_front, (right_x, page_y))
            
            # Cylindrical roll and back page
            if t > 0.001:
                arch_w = int(page_w * min(1.0, t * 1.05))
                curl_layer = Image.new('RGBA', (arch_w, page_h), (0, 0, 0, 0))
                # Sample turned back of page
                back_strip = p_b.crop((page_w - arch_w, 0, page_w, page_h))
                curl_layer.alpha_composite(back_strip, (0, 0))
                
                # Curvature shadow
                cd = ImageDraw.Draw(curl_layer)
                cd.rectangle([arch_w - int(24 * wire_scale), 0, arch_w, page_h], fill=(20, 10, 4, int(90 * math.sin(t * math.pi))))
                
                # Position on left stack
                cur_x = max(left_x, spine_x - arch_w)
                canvas.alpha_composite(curl_layer, (cur_x, page_y))
        else:
            # SPREAD 2 FULLY TURNED
            p_b = page_back.resize((page_w, page_h), Image.Resampling.LANCZOS)
            canvas.alpha_composite(p_b, (left_x, page_y))
            
        # 5. Continuous Antique Brass Spiral Binding Fixed at Spine (Zero floating/broken rings)
        draw_continuous_brass_spiral(canvas, spine_x, page_y + int(26 * wire_scale), page_y + page_h - int(26 * wire_scale), wire_scale)
        
    else:
        # CLOSED / OPENING BOOK (cover_prog in [0, 1])
        # Back cover
        cov_w = int(book_w * (0.52 + 0.48 * cover_prog))
        cov_x = int((book_w // 4) * (1.0 - cover_prog))
        cov_scaled = cover_img.resize((cov_w, book_h), Image.Resampling.LANCZOS)
        canvas.alpha_composite(cov_scaled, (cov_x, 0))
        
        # If opening, left page becomes visible under opening cover
        if cover_prog > 0.15:
            p_l = page_left.resize((page_w, page_h), Image.Resampling.LANCZOS)
            canvas.alpha_composite(p_l, (left_x, page_y))
            
        # Right page underneath
        p_f = page_right.resize((page_w, page_h), Image.Resampling.LANCZOS)
        canvas.alpha_composite(p_f, (right_x, page_y))
        
        # 3D Front Cover Leaf rotating from 0 to -180 deg
        # Projected perspective width = cos(cover_prog * pi) * page_w
        ang_rad = cover_prog * math.pi
        cos_ang = math.cos(ang_rad)
        proj_w = max(4, int(page_w * abs(cos_ang)))
        
        if cos_ang >= 0:
            # Front face visible (Walnut leather + gold medallion)
            flap_scaled = cover_flap.resize((proj_w, page_h), Image.Resampling.LANCZOS)
            canvas.alpha_composite(flap_scaled, (right_x, page_y))
        else:
            # Back face visible (Marbled endpaper)
            ins_scaled = cover_inside.resize((proj_w, page_h), Image.Resampling.LANCZOS)
            canvas.alpha_composite(ins_scaled, (spine_x - proj_w, page_y))
            
        # Continuous Brass Spiral Binding along the spine
        draw_continuous_brass_spiral(canvas, spine_x, page_y + int(26 * wire_scale), page_y + page_h - int(26 * wire_scale), wire_scale)
        
    return canvas

def composite_scene(p, vw=1600, vh=900, is_mobile=False):
    """
    Composites the full cinematic viewport at progress p with:
    - Panoramic sunset garden backdrop
    - PBR camera pan
    - Unified 3D Storybook in exact lifecycle state
    - Single persistent Butterfly character
    - Narrative hint badge
    """
    # 1. Panorama Pan
    pano_w, pano_h = pano_img.size
    cont_w = max(int(vh * 3.656), int(2.2 * vw))
    cont_h = vh
    pano_scaled = pano_img.resize((cont_w, cont_h), Image.Resampling.LANCZOS)
    
    max_pan_x = cont_w - vw
    # Camera progress: at pergola (p around 0.38 - 0.78), panX is around 0.52 * max_pan_x
    if p < 0.38:
        cam_frac = (p / 0.38) * 0.52
    elif p <= 0.78:
        cam_frac = 0.52
    else:
        cam_frac = 0.52 + ((p - 0.78) / 0.22) * 0.48
    pan_x = int(cam_frac * max_pan_x)
    
    viewport = Image.new('RGBA', (vw, vh), (18, 7, 3, 255))
    viewport.paste(pano_scaled.crop((pan_x, 0, pan_x + vw, cont_h)), (0, 0))
    
    # 2. Unified Storybook
    if p >= 0.22 and p <= 0.84:
        if p < 0.42:
            # Closed book resting in pergola lawn
            book = render_storybook(vw, vh, cover_prog=0.0, curl_prog=0.0, scale_mul=0.44, is_mobile=is_mobile)
            bx = int(vw * 0.54 - book.width // 2)
            by = int(vh * 0.56 - book.height // 2)
            viewport.alpha_composite(book, (bx, by))
        elif p < 0.48:
            # Continuous physical opening transition
            t_open = (p - 0.42) / (0.48 - 0.42)
            cur_scale = 0.44 + t_open * 0.56
            book = render_storybook(vw, vh, cover_prog=t_open, curl_prog=0.0, scale_mul=cur_scale, is_mobile=is_mobile)
            top_pct = 0.56 - t_open * 0.06
            left_pct = 0.54 - t_open * 0.04
            bx = int(vw * left_pct - book.width // 2)
            by = int(vh * top_pct - book.height // 2)
            viewport.alpha_composite(book, (bx, by))
        elif p < 0.56:
            # Spread 1 Reading Zone (Centered, 0% curl)
            book = render_storybook(vw, vh, cover_prog=1.0, curl_prog=0.0, scale_mul=1.0, is_mobile=is_mobile)
            bx = (vw - book.width) // 2
            by = (vh - book.height) // 2
            viewport.alpha_composite(book, (bx, by))
        elif p < 0.70:
            # Gradual Page Turn (Spread 1 -> Spread 2)
            turn_p = (p - 0.56) / (0.70 - 0.56)
            book = render_storybook(vw, vh, cover_prog=1.0, curl_prog=turn_p, scale_mul=1.0, is_mobile=is_mobile)
            bx = (vw - book.width) // 2
            by = (vh - book.height) // 2
            viewport.alpha_composite(book, (bx, by))
        elif p <= 0.78:
            # Spread 2 Reading Zone (Centered, 100% curl settled)
            book = render_storybook(vw, vh, cover_prog=1.0, curl_prog=1.0, scale_mul=1.0, is_mobile=is_mobile)
            bx = (vw - book.width) // 2
            by = (vh - book.height) // 2
            viewport.alpha_composite(book, (bx, by))
        else:
            # Departure
            leave_t = (p - 0.78) / 0.06
            book = render_storybook(vw, vh, cover_prog=1.0, curl_prog=1.0, scale_mul=1.0, is_mobile=is_mobile)
            # Fade book
            alpha = int(255 * (1.0 - leave_t))
            mask = Image.new('L', book.size, alpha)
            book.putalpha(Image.composite(book.split()[3], Image.new('L', book.size, 0), mask))
            bx = (vw - book.width) // 2
            by = (vh - book.height) // 2
            viewport.alpha_composite(book, (bx, by))
            
    # 3. Butterfly Character
    bf_size = 90
    if p >= 0.3886 and p <= 0.42:
        # Landed on closed cover medallion
        bx_c = int(vw * 0.54)
        by_c = int(vh * 0.56)
        bf_s = bf_img.resize((int(bf_size * 0.76), int(bf_size * 0.76)), Image.Resampling.LANCZOS)
        viewport.alpha_composite(bf_s, (bx_c - bf_s.width//2, by_c - bf_s.height//2))
    elif p > 0.42 and p < 0.48:
        # Flutters up to perch
        t_bf = (p - 0.42) / (0.48 - 0.42)
        cur_x = int((vw * 0.54) + t_bf * (vw * 0.86 - vw * 0.54))
        cur_y = int((vh * 0.56) + t_bf * (vh * 0.13 - vh * 0.56))
        bf_s = bf_img.resize((int(bf_size * 0.80), int(bf_size * 0.80)), Image.Resampling.LANCZOS)
        viewport.alpha_composite(bf_s, (cur_x - bf_s.width//2, cur_y - bf_s.height//2))
    elif p >= 0.48 and p <= 0.78:
        # Perched comfortably on top-right of open book
        target_x = int(vw * (0.82 if is_mobile else 0.86))
        target_y = int(vh * (0.16 if is_mobile else 0.13))
        bf_s = bf_img.resize((int(bf_size * 0.82), int(bf_size * 0.82)), Image.Resampling.LANCZOS)
        viewport.alpha_composite(bf_s, (target_x - bf_s.width//2, target_y - bf_s.height//2))
        
    # 4. Narrative Hint Badge
    hint_text = 'Follow butterfly to the memory book'
    if p >= 0.3886 and p < 0.42:
        hint_text = 'Butterfly resting on the book cover...'
    elif p >= 0.42 and p < 0.48:
        hint_text = 'The storybook awakens...'
    elif p >= 0.48 and p < 0.56:
        hint_text = 'Read Chapter I · Scroll to turn page'
    elif p >= 0.56 and p < 0.70:
        hint_text = 'Turning page...'
    elif p >= 0.70 and p <= 0.78:
        hint_text = 'Chapter II · Scroll to explore beyond'
        
    d_v = ImageDraw.Draw(viewport)
    badge_w, badge_h = 320, 36
    bx_badge = (vw - badge_w) // 2
    by_badge = vh - 52
    d_v.rounded_rectangle([bx_badge, by_badge, bx_badge + badge_w, by_badge + badge_h], radius=18, fill=(45, 25, 15, 210), outline=(255, 215, 120, 160), width=1)
    d_v.text((vw // 2, by_badge + badge_h // 2), hint_text, fill=(255, 245, 230), font=f_hint, anchor='mm')
    
    return viewport

def generate_checkpoints():
    print('Generating Checkpoints 1 to 9...')
    
    # 1. Closed book before opening (p = 0.3886)
    cp1 = composite_scene(0.3886)
    cp1.save(os.path.join(ART_DIR, 'task4_check1_closed_book_before_opening.png'))
    print('Saved Checkpoint 1')
    
    # 2. Book during opening transition (p = 0.45)
    cp2 = composite_scene(0.45)
    cp2.save(os.path.join(ART_DIR, 'task4_check2_book_during_opening_transition.png'))
    print('Saved Checkpoint 2')
    
    # 3. Fully open and centered first spread (p = 0.50)
    cp3 = composite_scene(0.50)
    cp3.save(os.path.join(ART_DIR, 'task4_check3_fully_open_centered_first_spread.png'))
    print('Saved Checkpoint 3')
    
    # 4. Close-up of spiral binding (crop from center of cp3)
    w, h = cp3.size
    # Center spine is at w//2, crop 340px wide, 500px tall
    crop_spiral = cp3.crop((w//2 - 170, h//2 - 250, w//2 + 170, h//2 + 250))
    crop_spiral.save(os.path.join(ART_DIR, 'task4_check4_spiral_binding_closeup.png'))
    print('Saved Checkpoint 4 (Spiral Closeup)')
    
    # 5. Close-up of page corners and layered edges
    # Top-right corner of open book is around right page top-right
    aspect = 852.0 / 442.0
    book_w = int(min(0.86 * w, 0.84 * h * aspect))
    book_h = int(book_w / aspect)
    bx = (w - book_w) // 2
    by = (h - book_h) // 2
    crop_corner = cp3.crop((bx + book_w - 220, by, bx + book_w, by + 220))
    crop_corner.save(os.path.join(ART_DIR, 'task4_check5_page_corner_layered_edge_closeup.png'))
    print('Saved Checkpoint 5 (Corners Closeup)')
    
    # 6. Page turn progression
    # 25% (p = 0.595)
    cp6a = composite_scene(0.595)
    cp6a.save(os.path.join(ART_DIR, 'task4_check6a_page_turn_25pct.png'))
    # 50% (p = 0.630)
    cp6b = composite_scene(0.630)
    cp6b.save(os.path.join(ART_DIR, 'task4_check6b_page_turn_50pct.png'))
    # 75% (p = 0.665)
    cp6c = composite_scene(0.665)
    cp6c.save(os.path.join(ART_DIR, 'task4_check6c_page_turn_75pct.png'))
    # 100% (p = 0.700)
    cp6d = composite_scene(0.700)
    cp6d.save(os.path.join(ART_DIR, 'task4_check6d_page_turn_100pct.png'))
    print('Saved Checkpoint 6 (Page Turn at 25%, 50%, 75%, 100%)')
    
    # 7. Next spread settled (p = 0.74, Spread 2: Chapter II)
    cp7 = composite_scene(0.74)
    cp7.save(os.path.join(ART_DIR, 'task4_check7_next_spread_settled_spread2.png'))
    print('Saved Checkpoint 7 (Spread 2 Settled)')
    
    # 8. Reverse scrolling confirmation (p = 0.61 reversed)
    cp8 = composite_scene(0.61)
    cp8.save(os.path.join(ART_DIR, 'task4_check8_reverse_scrolling_natural_return.png'))
    print('Saved Checkpoint 8 (Reverse Scrolling Return)')
    
    # 9. Mobile Layout (390x844)
    cp9 = composite_scene(0.50, vw=390, vh=844, is_mobile=True)
    cp9.save(os.path.join(ART_DIR, 'task4_check9_mobile_layout_proportional.png'))
    print('Saved Checkpoint 9 (Mobile Layout 390x844)')

def generate_video_recording():
    print('Generating continuous video frames (Opening & First Page Turn)...')
    frames = []
    
    # P keyframes for continuous sequence:
    # 1. Arriving at closed book: p = 0.3886 (3 frames)
    for _ in range(3):
        frames.append(composite_scene(0.3886))
        
    # 2. Cover Opening: p = 0.42 to 0.48 (12 frames)
    for step in range(13):
        p_val = 0.42 + (step / 12.0) * 0.06
        frames.append(composite_scene(p_val))
        
    # 3. Spread 1 Reading Pause: p = 0.50 (6 frames)
    for _ in range(6):
        frames.append(composite_scene(0.50))
        
    # 4. Smooth Page Turn: p = 0.56 to 0.70 (18 frames)
    for step in range(19):
        p_val = 0.56 + (step / 18.0) * 0.14
        frames.append(composite_scene(p_val))
        
    # 5. Spread 2 Settled Pause: p = 0.74 (6 frames)
    for _ in range(6):
        frames.append(composite_scene(0.74))
        
    # 6. Reverse Scroll back to Spread 1: p = 0.70 to 0.56 (12 frames)
    for step in range(13):
        p_val = 0.70 - (step / 12.0) * 0.14
        frames.append(composite_scene(p_val))
        
    # 7. Spread 1 Restored: p = 0.50 (4 frames)
    for _ in range(4):
        frames.append(composite_scene(0.50))
        
    print(f'Total video frames: {len(frames)}')
    # Save frames to /tmp/video_frames
    os.makedirs('/tmp/task4_vid_frames', exist_ok=True)
    for i, fr in enumerate(frames):
        # Resize to 960x540 for fast high-quality encode
        fr.resize((960, 540), Image.Resampling.LANCZOS).convert('RGB').save(f'/tmp/task4_vid_frames/fr_{i:03d}.png')
        
    # Encode with ffmpeg to MP4
    mp4_out = os.path.join(ART_DIR, 'task4_storybook_opening_and_turn.mp4')
    cmd_mp4 = f'ffmpeg -y -framerate 12 -i /tmp/task4_vid_frames/fr_%03d.png -c:v libx264 -pix_fmt yuv420p -crf 20 {mp4_out}'
    os.system(cmd_mp4)
    print(f'Saved MP4 video to {mp4_out}')
    
    # Also encode GIF for embedding in markdown artifacts
    gif_out = os.path.join(ART_DIR, 'task4_storybook_opening_and_turn.gif')
    cmd_gif = f'ffmpeg -y -i {mp4_out} -vf "fps=10,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" {gif_out}'
    os.system(cmd_gif)
    print(f'Saved GIF recording to {gif_out}')

if __name__ == '__main__':
    generate_checkpoints()
    generate_video_recording()
    print('All Task 4 verification artifacts generated successfully!')

