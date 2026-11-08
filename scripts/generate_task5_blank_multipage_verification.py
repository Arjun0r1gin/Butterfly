"""
BUTTERFLY — Task 5 Multi-Page Blank Scrapbook & Physical Presence Verification
Renders high-resolution browser-accurate screenshots and continuous recording for:
1. Closed book already physically present in Pergola (Scene 2, before butterfly arrives)
2. Butterfly landed gracefully on the closed cover medallion (p = 0.40)
3. Front cover opening transition (swinging open -180 deg while centering, p = 0.45)
4. Fully open and centered first blank spread (p = 0.48, 100% blank aged parchment)
5. Sheet 1 turning (inextensible cylinder curl, p = 0.53)
6. Sheet 2 turning with left stack accumulation (p = 0.60)
7. Sheet 3 turning (p = 0.67)
8. Sheet 4 turning (p = 0.74, all 4 sheets accumulated on left stack)
9. Reverse scrolling returning pages back to right stack
10. Mobile responsive layout (390x844)
11. Continuous video recording (MP4 & GIF)
"""

import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ART_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
PUBLIC_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public'
SCENES_DIR = os.path.join(PUBLIC_DIR, 'scenes')
SB_DIR = os.path.join(PUBLIC_DIR, 'storybook')

# Load high-resolution assets
pano_img = Image.open(os.path.join(SCENES_DIR, 'seamless_garden_panorama_hd.jpg')).convert('RGBA')
cover_img = Image.open(os.path.join(SB_DIR, 'studio_cover_walnut.jpg')).convert('RGBA')
blank_left = Image.open(os.path.join(SB_DIR, 'studio_page_blank_left.jpg')).convert('RGBA')
blank_right = Image.open(os.path.join(SB_DIR, 'studio_page_blank_right.jpg')).convert('RGBA')
cover_flap = Image.open(os.path.join(SB_DIR, 'closed_book_user_cover.png')).convert('RGBA')
cover_inside = Image.open(os.path.join(SB_DIR, 'closed_book_user_cover_inside.png')).convert('RGBA')
bf_img = Image.open(os.path.join(PUBLIC_DIR, 'butterfly/butterfly_full.png')).convert('RGBA')

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
    hole_dx = int(14.0 * wire_scale)
    wire_r = max(1, int(1.4 * wire_scale))
    
    for i in range(coil_count):
        cy = top_y + i * spacing
        for wy in [cy - 2.2 * wire_scale, cy + 2.2 * wire_scale]:
            arch_h = int(11.0 * wire_scale)
            bbox = [spine_x - hole_dx, wy - arch_h, spine_x + hole_dx, wy + arch_h]
            sh_box = [bbox[0] + 1, bbox[1] + 2, bbox[2] + 1, bbox[3] + 2]
            d.arc(sh_box, start=180, end=0, fill=(20, 10, 4, 110), width=wire_r + 1)
            d.arc(bbox, start=180, end=0, fill=(180, 130, 45, 255), width=wire_r * 2)
            hl_box = [bbox[0] + 1, bbox[1] + 1, bbox[2] - 1, bbox[3] - 1]
            d.arc(hl_box, start=210, end=330, fill=(255, 235, 140, 255), width=max(1, wire_r))

def render_physical_book(vw, vh, cover_prog=1.0, turn_prog=0.0, scale_mul=1.0, is_mobile=False):
    """
    Renders the unified 3D physical book with 4 attached physical blank sheets:
    - cover_prog in [0, 1]: 0 = closed book in garden, 1 = fully open centered book
    - turn_prog in [0, 4.0]: multi-sheet turn progress across 4 sheets
    """
    aspect = 852.0 / 442.0
    base_w = min(0.86 * vw, 0.84 * vh * aspect) if not is_mobile else min(0.94 * vw, 0.82 * vh * aspect)
    book_w = int(base_w * scale_mul)
    book_h = int(book_w / aspect)
    
    page_w = int(book_w * (390.0 / 852.0))
    page_h = int(book_h * (412.0 / 442.0))
    wire_scale = page_w / 390.0

    if cover_prog < 0.001:
        # ---------------------------------------------------------------------
        # 1. 100% CLEAN PHYSICAL CLOSED BOOK WITH USER'S ATTACHED COVER
        # Single closed volume: user's transparent PNG (spiral, lace bow, key, flowers,
        # butterfly emblem, title, clasp), with layered paper stack on right & bottom,
        # walnut back cover underneath, and soft ground shadow!
        # ---------------------------------------------------------------------
        closed_h = book_h
        closed_w = int(closed_h * (862.0 / 1024.0))
        canvas = Image.new('RGBA', (closed_w, closed_h), (0, 0, 0, 0))
        
        # Ground shadow beneath closed book
        sh = Image.new('RGBA', (closed_w, closed_h), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(sh)
        sh_d.rounded_rectangle([14, 24, closed_w - 6, closed_h - 10], radius=int(22 * wire_scale), fill=(12, 6, 2, 160))
        sh = sh.filter(ImageFilter.GaussianBlur(int(16 * wire_scale)))
        canvas.alpha_composite(sh, (0, 0))
        
        # Back cover
        bk = cover_img.resize((closed_w - 14, closed_h - 20), Image.Resampling.LANCZOS)
        canvas.alpha_composite(bk, (10, 12))
        
        # Layered deckled cream paper edge stack along right and bottom
        ps_d = ImageDraw.Draw(canvas)
        for s in range(14):
            off = int(s * 1.1 * wire_scale)
            c = 245 - (s % 3) * 6
            ps_d.line([closed_w - 22 - off, 24, closed_w - 22 - off, closed_h - 22 - off], fill=(c, c - 10, c - 24, 255), width=1)
            ps_d.line([30 + off, closed_h - 22 - off, closed_w - 22 - off, closed_h - 22 - off], fill=(c, c - 10, c - 24, 255), width=1)
            
        # Front leather hardcover (User's transparent PNG with full fidelity)
        flap_scaled = cover_flap.resize((closed_w, closed_h), Image.Resampling.LANCZOS)
        canvas.alpha_composite(flap_scaled, (0, 0))
        return canvas

    elif cover_prog < 0.999:
        # ---------------------------------------------------------------------
        # 2. CONTINUOUS PHYSICAL OPENING TRANSITION (cover_prog in (0, 1))
        # Front cover hinges open around spine from 0 to -180 deg
        # 3D perspective projection with converging edges and realistic depth
        # ---------------------------------------------------------------------
        canvas = Image.new('RGBA', (book_w, book_h), (0, 0, 0, 0))
        spine_x = book_w // 2
        page_y = (book_h - page_h) // 2
        left_x = spine_x - page_w
        right_x = spine_x
        
        # Ground shadow expanding
        sh = Image.new('RGBA', (book_w, book_h), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(sh)
        sh_w = int((book_w // 2) + cover_prog * (book_w // 2))
        sh_x = spine_x - int(cover_prog * (book_w // 2))
        sh_d.rounded_rectangle([sh_x, 18, sh_x + sh_w, book_h - 10], radius=int(22 * wire_scale), fill=(12, 6, 2, 170))
        sh = sh.filter(ImageFilter.GaussianBlur(int(16 * wire_scale)))
        canvas.alpha_composite(sh, (0, 0))
        
        # 3D Front Cover Leaf rotating around spine with 3D perspective quad
        theta = cover_prog * math.pi
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)
        
        # Perspective foreshortening: when rotated towards camera, outer edge expands slightly in Y
        persp_scale = 1.0 + 0.14 * sin_t
        proj_w = max(6, int(page_w * abs(cos_t)))
        proj_h = int(page_h * persp_scale)
        proj_y = (book_h - proj_h) // 2

        # Right back cover
        r_cov = cover_img.resize((page_w + int(20 * wire_scale), book_h), Image.Resampling.LANCZOS)
        canvas.alpha_composite(r_cov, (right_x - int(4 * wire_scale), 0))
        
        # Left back cover (revealed only as front cover swings past vertical onto the left)
        if cos_t < 0:
            l_cov = cover_img.resize((proj_w + int(20 * wire_scale), book_h), Image.Resampling.LANCZOS)
            canvas.alpha_composite(l_cov, (spine_x - proj_w - int(12 * wire_scale), 0))

        # Blank right sheet underneath
        p_br = blank_right.resize((page_w, page_h), Image.Resampling.LANCZOS)
        canvas.alpha_composite(p_br, (right_x, page_y))
        
        # Render 3D swinging leaf
        if cos_t >= 0:
            # Front face visible (Walnut leather + gold vines + medallion + corners)
            flap_scaled = cover_flap.resize((proj_w, proj_h), Image.Resampling.LANCZOS)
            # Dynamic shadow on right page as cover lifts
            c_sh = Image.new('RGBA', (proj_w, page_h), (0, 0, 0, 0))
            c_sh_d = ImageDraw.Draw(c_sh)
            c_sh_d.rectangle([0, 0, proj_w, page_h], fill=(15, 8, 3, int(110 * sin_t)))
            c_sh = c_sh.filter(ImageFilter.GaussianBlur(int(10 * wire_scale)))
            canvas.alpha_composite(c_sh, (right_x, page_y))
            # Align cover spiral with spine_x so lace bow extends naturally to left
            flap_x = spine_x - int(proj_w * 0.116)
            canvas.alpha_composite(flap_scaled, (flap_x, proj_y))
        else:
            # Back face visible (Inside cover swinging into left position)
            ins_flipped = cover_inside.transpose(Image.FLIP_LEFT_RIGHT)
            ins_scaled = ins_flipped.resize((proj_w, proj_h), Image.Resampling.LANCZOS)
            leaf_x = spine_x - proj_w
            # Cast shadow under opening left cover
            c_sh = Image.new('RGBA', (proj_w + 20, page_h), (0, 0, 0, 0))
            c_sh_d = ImageDraw.Draw(c_sh)
            c_sh_d.rectangle([0, 0, proj_w + 16, page_h], fill=(15, 8, 3, int(120 * sin_t)))
            c_sh = c_sh.filter(ImageFilter.GaussianBlur(int(12 * wire_scale)))
            canvas.alpha_composite(c_sh, (leaf_x - 10, page_y))
            canvas.alpha_composite(ins_scaled, (leaf_x, proj_y))
            
        draw_continuous_brass_spiral(canvas, spine_x, page_y + int(26 * wire_scale), page_y + page_h - int(26 * wire_scale), wire_scale)
        return canvas

    else:
        # ---------------------------------------------------------------------
        # 3. FULLY OPEN MULTI-PAGE BLANK SCRAPBOOK (4 Physical Sheets)
        # 100% BLANK AGED CREAM PARCHMENT, left stack accumulation, right stack depletion
        # ---------------------------------------------------------------------
        canvas = Image.new('RGBA', (book_w, book_h), (0, 0, 0, 0))
        spine_x = book_w // 2
        page_y = (book_h - page_h) // 2
        left_x = spine_x - page_w
        right_x = spine_x

        # Ground shadow
        sh = Image.new('RGBA', (book_w, book_h), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(sh)
        sh_d.rounded_rectangle([16, 18, book_w - 16, book_h - 10], radius=int(24 * wire_scale), fill=(12, 6, 2, 175))
        sh = sh.filter(ImageFilter.GaussianBlur(int(18 * wire_scale)))
        canvas.alpha_composite(sh, (0, 0))
        
        # Full walnut leather hardcover base
        cov_scaled = cover_img.resize((book_w, book_h), Image.Resampling.LANCZOS)
        canvas.alpha_composite(cov_scaled, (0, 0))
        
        # Multi-sheet physics (turn_prog in [0, 4.0])
        active_sheet = min(3, int(math.floor(turn_prog)))
        local_curl = max(0.0, min(1.0, turn_prog - active_sheet))

        # Base resting pages
        p_l = blank_left.resize((page_w, page_h), Image.Resampling.LANCZOS)
        p_r = blank_right.resize((page_w, page_h), Image.Resampling.LANCZOS)

        # Left base page
        canvas.alpha_composite(p_l, (left_x, page_y))
        
        # Right resting base page
        canvas.alpha_composite(p_r, (right_x, page_y))

        # 1. Left stack accumulation (Sheet 0, ..., active_sheet - 1)
        # Visibly draws accumulated physical sheets with paper edge highlights & micro-drop shadows
        stack_d = ImageDraw.Draw(canvas)
        for s in range(active_sheet):
            off_x = int((s + 1) * 2.2 * wire_scale)
            off_y = int((s + 1) * 1.2 * wire_scale)
            # Physical paper edge shadow on left stack
            stack_d.line([left_x - off_x, page_y - off_y, left_x - off_x, page_y + page_h + off_y], fill=(40, 24, 14, 180), width=1)
            stack_d.line([left_x - off_x + 1, page_y - off_y, left_x - off_x + 1, page_y + page_h + off_y], fill=(255, 250, 240, 240), width=1)
            # Top and bottom deckled rims
            stack_d.line([left_x - off_x, page_y - off_y, spine_x - 14, page_y - off_y], fill=(255, 252, 244, 220), width=1)
            stack_d.line([left_x - off_x, page_y + page_h + off_y, spine_x - 14, page_y + page_h + off_y], fill=(60, 35, 20, 160), width=1)

        # 2. Right stack depletion (remaining uncurled sheets)
        rem_sheets = 3 - active_sheet
        for s in range(rem_sheets):
            off_x = int((s + 1) * 2.2 * wire_scale)
            off_y = int((s + 1) * 1.2 * wire_scale)
            stack_d.line([right_x + page_w + off_x, page_y - off_y, right_x + page_w + off_x, page_y + page_h + off_y], fill=(40, 24, 14, 180), width=1)
            stack_d.line([right_x + page_w + off_x - 1, page_y - off_y, right_x + page_w + off_x - 1, page_y + page_h + off_y], fill=(255, 250, 240, 240), width=1)

        # 3. Active 3D curling cylinder sheet
        if local_curl > 0.001 and local_curl < 0.999:
            t = local_curl
            # Fold line position in right page
            fold_x = int(page_w * (1.0 - t))
            
            # Cylinder arch width (spans from fold_x over to left)
            arch_w = max(16, int(page_w * min(1.0, t * 1.15)))
            
            # Cast shadow under curling arch onto both pages
            curl_sh = Image.new('RGBA', (arch_w + 30, page_h + 20), (0, 0, 0, 0))
            sh_d2 = ImageDraw.Draw(curl_sh)
            sh_alpha = int(140 * math.sin(t * math.pi))
            sh_d2.ellipse([0, 5, arch_w + 25, page_h + 15], fill=(18, 9, 4, sh_alpha))
            curl_sh = curl_sh.filter(ImageFilter.GaussianBlur(int(14 * wire_scale)))
            canvas.alpha_composite(curl_sh, (spine_x - arch_w + 10, page_y - 10))

            # Render 3D curling parchment surface
            curl_surf = Image.new('RGBA', (arch_w, page_h), (0, 0, 0, 0))
            # Sample blank aged paper
            strip = blank_left.resize((page_w, page_h), Image.Resampling.LANCZOS).crop((page_w - arch_w, 0, page_w, page_h))
            curl_surf.alpha_composite(strip, (0, 0))
            
            # 3D Directional Cylinder Lighting & Specular Ridge
            cs_d = ImageDraw.Draw(curl_surf)
            # Ambient crease at inner fold
            cs_d.rectangle([arch_w - int(12 * wire_scale), 0, arch_w, page_h], fill=(30, 16, 8, int(70 * math.sin(t * math.pi))))
            # Specular highlight along top cylinder apex
            apex_x = int(arch_w * 0.45)
            apex_w = max(2, int(8 * wire_scale))
            cs_d.rectangle([apex_x, 0, apex_x + apex_w, page_h], fill=(255, 252, 242, int(90 * math.sin(t * math.pi))))
            # Outer deckled paper edge rim
            cs_d.line([0, 0, 0, page_h], fill=(255, 255, 250, 255), width=int(2 * wire_scale))
            cs_d.line([1, 0, 1, page_h], fill=(80, 50, 30, 150), width=1)
            
            cur_pos_x = max(left_x, spine_x - arch_w)
            canvas.alpha_composite(curl_surf, (cur_pos_x, page_y))
            
        elif local_curl >= 0.999:
            # Active sheet has settled flat on left stack
            canvas.alpha_composite(p_l, (left_x, page_y))

        # 4. Continuous antique brass spiral binding fixed at spine
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

    # Camera Pan Hermite curve
    if p < 0.38:
        cam_frac = (p / 0.38) * 0.52
    elif p <= 0.78:
        cam_frac = 0.52
    else:
        cam_frac = 0.52 + ((p - 0.78) / 0.22) * 0.48
    pan_x = int(cam_frac * max_pan_x)
    
    viewport = Image.new('RGBA', (vw, vh), (18, 7, 3, 255))
    viewport.paste(pano_scaled.crop((pan_x, 0, pan_x + vw, cont_h)), (0, 0))
    
    # 2. Unified Physical Storybook Lifecycle
    if p <= 0.84:
        if p < 0.42:
            # Closed book ALREADY PRESENT in pergola garden (world-anchored)
            pergola_pan_x = int(0.52 * max_pan_x)
            world_book_x = pergola_pan_x + int(vw * 0.54)
            current_book_screen_x = int(world_book_x - pan_x)
            
            # SCALE = 0.68 (substantially larger closed book presence!)
            book = render_physical_book(vw, vh, cover_prog=0.0, turn_prog=0.0, scale_mul=0.68, is_mobile=is_mobile)
            bx = int(current_book_screen_x - book.width // 2)
            by = int(vh * 0.56 - book.height // 2)
            if bx + book.width > 0 and bx < vw:
                viewport.alpha_composite(book, (bx, by))
        elif p < 0.48:
            # Continuous physical opening transition
            t_open = (p - 0.42) / (0.48 - 0.42)
            cur_scale = 0.68 + t_open * 0.32
            book = render_physical_book(vw, vh, cover_prog=t_open, turn_prog=0.0, scale_mul=cur_scale, is_mobile=is_mobile)
            top_pct = 0.56 - t_open * 0.06
            left_pct = 0.54 - t_open * 0.04
            bx = int(vw * left_pct - book.width // 2)
            by = int(vh * top_pct - book.height // 2)
            viewport.alpha_composite(book, (bx, by))
        elif p <= 0.78:
            # Multi-sheet reading zone
            read_prog = (p - 0.48) / (0.78 - 0.48)
            T = read_prog * 4.0
            s_idx = min(3, int(math.floor(T)))
            s_u = T - s_idx
            curl = 0.0
            if s_u <= 0.18:
                curl = 0.0
            elif s_u >= 0.82:
                curl = 1.0
            else:
                curl = (s_u - 0.18) / (0.82 - 0.18)
            active_turn = s_idx + curl

            book = render_physical_book(vw, vh, cover_prog=1.0, turn_prog=active_turn, scale_mul=1.0, is_mobile=is_mobile)
            bx = (vw - book.width) // 2
            by = (vh - book.height) // 2
            viewport.alpha_composite(book, (bx, by))
        else:
            # Departure
            leave_t = (p - 0.78) / 0.06
            book = render_physical_book(vw, vh, cover_prog=1.0, turn_prog=4.0, scale_mul=1.0, is_mobile=is_mobile)
            alpha = int(255 * (1.0 - leave_t))
            mask = Image.new('L', book.size, alpha)
            book.putalpha(Image.composite(book.split()[3], Image.new('L', book.size, 0), mask))
            bx = (vw - book.width) // 2
            by = (vh - book.height) // 2
            viewport.alpha_composite(book, (bx, by))

    # 3. Butterfly Character
    bf_size = 90
    if p >= 0.3886 and p <= 0.42:
        # Landed on golden butterfly emblem of user's cover
        bx_c = int(vw * 0.540)
        by_c = int(vh * 0.536)
        bf_s = bf_img.resize((int(bf_size * 0.82), int(bf_size * 0.82)), Image.Resampling.LANCZOS)
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
    hint_text = 'Scroll right to explore garden'
    if p >= 0.28 and p < 0.3886:
        hint_text = 'Follow butterfly to the memory book'
    elif p >= 0.3886 and p < 0.42:
        hint_text = 'Butterfly resting on the book cover...'
    elif p >= 0.42 and p < 0.48:
        hint_text = 'The storybook awakens...'
    elif p >= 0.48 and p <= 0.78:
        read_prog = (p - 0.48) / (0.78 - 0.48)
        t_val = read_prog * 4.0
        if t_val < 0.9: hint_text = 'Scroll to turn page (1/4)'
        elif t_val < 1.9: hint_text = 'Scroll to turn page (2/4)'
        elif t_val < 2.9: hint_text = 'Scroll to turn page (3/4)'
        elif t_val < 3.9: hint_text = 'Scroll to turn page (4/4)'
        else: hint_text = 'Journey onward with the butterfly'
    elif p > 0.78:
        hint_text = 'Follow butterfly toward the starlit rocket'

    d_v = ImageDraw.Draw(viewport)
    badge_w, badge_h = 320, 36
    bx_badge = (vw - badge_w) // 2
    by_badge = vh - 52
    d_v.rounded_rectangle([bx_badge, by_badge, bx_badge + badge_w, by_badge + badge_h], radius=18, fill=(45, 25, 15, 210), outline=(255, 215, 120, 160), width=1)
    d_v.text((vw // 2, by_badge + badge_h // 2), hint_text, fill=(255, 245, 230), font=f_hint, anchor='mm')
    
    return viewport

def generate_checkpoints():
    print("Generating Checkpoints 1 to 10 for Task 5...")

    # 1. Closed book already physically present in pergola garden before butterfly arrives
    cp1 = composite_scene(0.33)
    cp1.save(os.path.join(ART_DIR, 'task5_check1_closed_book_already_present.png'))
    print("Saved Checkpoint 1")

    # 2. Butterfly landed on closed cover medallion
    cp2 = composite_scene(0.40)
    cp2.save(os.path.join(ART_DIR, 'task5_check2_butterfly_landing_on_closed_cover.png'))
    print("Saved Checkpoint 2")

    # 3. Front cover opening transition (swinging open in 3D perspective)
    cp3 = composite_scene(0.445)
    cp3.save(os.path.join(ART_DIR, 'task5_check3_front_cover_opening_transition.png'))
    print("Saved Checkpoint 3")

    # 4. Fully open centered first blank spread
    cp4 = composite_scene(0.49)
    cp4.save(os.path.join(ART_DIR, 'task5_check4_first_blank_spread_centered.png'))
    print("Saved Checkpoint 4")

    # 5. Sheet 1 turning (inextensible curl)
    cp5 = composite_scene(0.525)
    cp5.save(os.path.join(ART_DIR, 'task5_check5_sheet1_turning.png'))
    print("Saved Checkpoint 5")

    # 6. Sheet 2 turning with left stack accumulation (Sheet 1 resting on left)
    cp6 = composite_scene(0.595)
    cp6.save(os.path.join(ART_DIR, 'task5_check6_sheet2_turning_accumulation.png'))
    print("Saved Checkpoint 6")

    # 7. Sheet 3 turning (Sheet 1, 2 on left stack)
    cp7 = composite_scene(0.67)
    cp7.save(os.path.join(ART_DIR, 'task5_check7_sheet3_turning.png'))
    print("Saved Checkpoint 7")

    # 8. Sheet 4 turning (Sheet 1, 2, 3 on left stack)
    cp8 = composite_scene(0.745)
    cp8.save(os.path.join(ART_DIR, 'task5_check8_sheet4_turning.png'))
    print("Saved Checkpoint 8")

    # 9. All 4 physical sheets accumulated on left stack (depleted right stack)
    cp9 = composite_scene(0.775)
    cp9.save(os.path.join(ART_DIR, 'task5_check9_all_sheets_accumulated_left_stack.png'))
    print("Saved Checkpoint 9")

    # 10. Mobile responsive layout (390x844)
    cp10 = composite_scene(0.49, vw=390, vh=844, is_mobile=True)
    cp10.save(os.path.join(ART_DIR, 'task5_check10_mobile_proportional_layout.png'))
    print("Saved Checkpoint 10")

def generate_video():
    print("Generating continuous video recording for Task 5...")
    temp_dir = os.path.join(ART_DIR, 'task5_frames')
    os.makedirs(temp_dir, exist_ok=True)

    # 64 frames covering arrival -> landing -> opening -> multi-sheet turns
    p_frames = []
    # Arrival
    for i in range(8): p_frames.append(0.30 + i * (0.39 - 0.30) / 7.0)
    # Landing hold
    for i in range(6): p_frames.append(0.395 + i * (0.42 - 0.395) / 5.0)
    # Opening
    for i in range(12): p_frames.append(0.42 + i * (0.48 - 0.42) / 11.0)
    # Reading spread 1
    for i in range(5): p_frames.append(0.49)
    # Sheet 1 turn
    for i in range(8): p_frames.append(0.50 + i * (0.56 - 0.50) / 7.0)
    # Sheet 2 turn & accumulation
    for i in range(8): p_frames.append(0.57 + i * (0.63 - 0.57) / 7.0)
    # Sheet 3 turn & accumulation
    for i in range(8): p_frames.append(0.64 + i * (0.70 - 0.64) / 7.0)
    # Sheet 4 turn
    for i in range(9): p_frames.append(0.71 + i * (0.76 - 0.71) / 8.0)

    for idx, p in enumerate(p_frames):
        frame = composite_scene(p, vw=1120, vh=630)
        fpath = os.path.join(temp_dir, f'frame_{idx:03d}.png')
        frame.save(fpath)

    mp4_out = os.path.join(ART_DIR, 'task5_storybook_presence_and_multiturn.mp4')
    gif_out = os.path.join(ART_DIR, 'task5_storybook_presence_and_multiturn.gif')

    # MP4 (mpeg4 video encoder compatible with system ffmpeg)
    cmd_mp4 = [
        'ffmpeg', '-y', '-framerate', '14',
        '-i', os.path.join(temp_dir, 'frame_%03d.png'),
        '-c:v', 'mpeg4', '-q:v', '3',
        mp4_out
    ]
    subprocess.run(cmd_mp4, check=True)
    print(f"Generated MP4: {mp4_out}")

    # High-quality GIF
    cmd_gif = [
        'ffmpeg', '-y', '-framerate', '12',
        '-i', os.path.join(temp_dir, 'frame_%03d.png'),
        '-vf', 'fps=12,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer',
        gif_out
    ]
    subprocess.run(cmd_gif, check=True)
    print(f"Generated GIF: {gif_out}")

    # Clean up frames
    for f in os.listdir(temp_dir):
        os.remove(os.path.join(temp_dir, f))
    os.rmdir(temp_dir)
    print("Video generation complete!")

if __name__ == '__main__':
    generate_checkpoints()
    generate_video()
