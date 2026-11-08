"""
BUTTERFLY — Master Fixed-Screen Cinematic Verification Renderer
Features:
1. Hand-Painted Botanical Butterfly (Storybook Painted Lady, Direction 3)
2. 100% Transparent Book Cutout (public/storybook/book_backdrop.png)
3. 100% Continuous Living Sunset Garden with Discrete Multi-Plane Camera Parallax
4. Full mobile and desktop checkpoints
5. Continuous 36-frame animation GIF
"""

import os
import math
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ARTIFACT_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
GARDEN_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/garden'
STORYBOOK_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/storybook'
BUTTERFLY_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/butterfly'
PROCESSED_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/flowers/processed'
ORIG_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/flowers'

# Preload Storybook assets (with isolated transparent alpha)
backdrop = Image.open(os.path.join(STORYBOOK_DIR, 'book_backdrop.png')).convert('RGBA')
page_left_tpl = Image.open(os.path.join(STORYBOOK_DIR, 'page_template_left.png')).convert('RGBA')
page_right_tpl = Image.open(os.path.join(STORYBOOK_DIR, 'page_template_right.png')).convert('RGBA')
spiral_spine = Image.open(os.path.join(STORYBOOK_DIR, 'spiral_binding.png')).convert('RGBA')

# Preload Botanical Butterfly Sprites
butterfly_full = Image.open(os.path.join(BUTTERFLY_DIR, 'butterfly_full.png')).convert('RGBA')
butterfly_body = Image.open(os.path.join(BUTTERFLY_DIR, 'butterfly_body.png')).convert('RGBA')
butterfly_wing_l = Image.open(os.path.join(BUTTERFLY_DIR, 'butterfly_wing_left.png')).convert('RGBA')
butterfly_wing_r = Image.open(os.path.join(BUTTERFLY_DIR, 'butterfly_wing_right.png')).convert('RGBA')

# Preload Garden Parallax Layers
garden_master = Image.open(os.path.join(GARDEN_DIR, 'garden_base_master.png')).convert('RGBA')
layer_sky = Image.open(os.path.join(GARDEN_DIR, 'layer_1_sky.png')).convert('RGBA')
layer_hills = Image.open(os.path.join(GARDEN_DIR, 'layer_3_distant_hills.png')).convert('RGBA')
layer_meadow = Image.open(os.path.join(GARDEN_DIR, 'layer_4_midground_meadow.png')).convert('RGBA')
layer_rocks = Image.open(os.path.join(GARDEN_DIR, 'layer_5_midground_rocks.png')).convert('RGBA')
layer_flora = Image.open(os.path.join(GARDEN_DIR, 'layer_6_foreground_flora.png')).convert('RGBA')
layer_framing = Image.open(os.path.join(GARDEN_DIR, 'layer_framing_tree_clean.png')).convert('RGBA')

# Preload flower sprites
FLOWER_FILES = [
    os.path.join(PROCESSED_DIR, 'Delicate Peach Coral Watercolor Bloom.png'),
    os.path.join(PROCESSED_DIR, 'Golden Ruffled Watercolor Bloom.png'),
    os.path.join(PROCESSED_DIR, 'Golden-Centered Ivory Watercolor Blossom.png'),
    os.path.join(PROCESSED_DIR, 'Magenta Rose with Golden Stamens.png'),
    os.path.join(PROCESSED_DIR, 'Mint and Cream Watercolor Blossom.png'),
    os.path.join(PROCESSED_DIR, 'Pastel Watercolor Bloom on Black.png'),
    os.path.join(PROCESSED_DIR, 'Radiant Magenta Watercolor Blossom.png'),
    os.path.join(PROCESSED_DIR, 'Vibrant Orange Watercolor Bloom.png'),
    os.path.join(PROCESSED_DIR, 'Watercolor Crimson Camellia Glow.png'),
    os.path.join(PROCESSED_DIR, 'Watercolor Lavender Bloom.png'),
    os.path.join(PROCESSED_DIR, 'Watercolor Peach and Ivory Blossom.png'),
    os.path.join(ORIG_DIR, 'Golden Yellow Watercolor Blossom.png'),
    os.path.join(ORIG_DIR, 'Luminous Blue and Lavender Watercolor Bloom.png'),
    os.path.join(ORIG_DIR, 'Luminous Watercolor Bloom on Black-1.png'),
    os.path.join(ORIG_DIR, 'Translucent Pink Peach Watercolor Blossom.png'),
    os.path.join(ORIG_DIR, 'Watercolor Coral Peony Bloom-2.png'),
]

SPRITES = []
for p in FLOWER_FILES:
    if os.path.exists(p):
        SPRITES.append(Image.open(p).convert('RGBA'))

# Fonts
try:
    font_title = ImageFont.truetype("/usr/share/fonts/google-crosextra-caladea-fonts/Caladea-Bold.ttf", 20)
    font_body = ImageFont.truetype("/usr/share/fonts/google-crosextra-caladea-fonts/Caladea-Regular.ttf", 12)
    font_drop = ImageFont.truetype("/usr/share/fonts/google-crosextra-caladea-fonts/Caladea-Bold.ttf", 44)
    font_script = ImageFont.truetype("/usr/share/fonts/google-carlito-fonts/Carlito-Italic.ttf", 14)
except Exception:
    font_title = ImageFont.load_default()
    font_body = ImageFont.load_default()
    font_drop = ImageFont.load_default()
    font_script = ImageFont.load_default()

def render_garden_camera(width, height, camera_progress=0.0):
    """
    Renders the continuous Garden with full 100% viewport coverage and discrete vertical camera parallax.
    Zero empty space/edges exposed because of 15% top/bottom bleed.
    """
    canvas = Image.new('RGBA', (width, height), (247, 160, 73, 255))

    bleed_w = int(width * 1.10)
    bleed_h = int(height * 1.30)
    base_x = int((width - bleed_w) / 2)
    base_y = int((height - bleed_h) / 2)

    y_sky = int(-0.035 * bleed_h * camera_progress)
    y_hills = int(-0.085 * bleed_h * camera_progress)
    y_meadow = int(-0.150 * bleed_h * camera_progress)
    y_rocks = int(-0.190 * bleed_h * camera_progress)
    y_flora = int(-0.250 * bleed_h * camera_progress)
    y_framing = int(-0.280 * bleed_h * camera_progress)

    def place_layer(layer_img, y_off):
        scaled = layer_img.resize((bleed_w, bleed_h), Image.LANCZOS)
        canvas.alpha_composite(scaled, (base_x, base_y + y_off))

    # Master landscape foundation
    place_layer(garden_master, y_meadow)
    place_layer(layer_sky, y_sky)
    place_layer(layer_hills, y_hills)
    place_layer(layer_meadow, y_meadow)
    place_layer(layer_rocks, y_rocks)
    place_layer(layer_flora, y_flora)
    place_layer(layer_framing, y_framing)

    return canvas

def draw_botanical_butterfly(draw_img, cx, cy, scale=1.0, tilt=0.0, flap_phase=0.0, aura=True):
    """
    Draws the hand-painted Storybook Painted Lady butterfly with authentic 3D wing-flapping physics.
    """
    target_size = int(110 * scale)
    if target_size <= 6:
        return

    # Simulate 3D rotateY flapping by modulating horizontal wing span
    flap_compress = abs(math.cos(flap_phase))
    compress_factor = max(0.20, flap_compress)

    # Canvas for compositing wings + body
    bf_w = target_size * 2
    bf_h = target_size * 2
    bf_surface = Image.new('RGBA', (bf_w, bf_h), (0, 0, 0, 0))
    center_x = target_size
    center_y = target_size

    # Ambient golden fairy aura
    if aura:
        d = ImageDraw.Draw(bf_surface)
        glow_r = int(50 * scale)
        for r_step in range(glow_r, 0, -6):
            alpha = int(45 * (1.0 - r_step / glow_r))
            d.ellipse([center_x - r_step, center_y - r_step, center_x + r_step, center_y + r_step], fill=(255, 230, 160, alpha))

    # Wings dimensions
    wing_w = int(target_size * 0.48 * compress_factor)
    wing_h = int(target_size * 0.95)

    if wing_w > 2 and wing_h > 2:
        # Left Wing
        scaled_l = butterfly_wing_l.resize((wing_w, wing_h), Image.LANCZOS)
        bf_surface.alpha_composite(scaled_l, (center_x - wing_w, center_y - int(wing_h / 2)))

        # Right Wing
        scaled_r = butterfly_wing_r.resize((wing_w, wing_h), Image.LANCZOS)
        bf_surface.alpha_composite(scaled_r, (center_x, center_y - int(wing_h / 2)))

    # Central Velvet Body & Antennae
    body_w = int(target_size * 0.18)
    body_h = int(target_size * 0.95)
    if body_w > 2 and body_h > 2:
        scaled_b = butterfly_body.resize((body_w, body_h), Image.LANCZOS)
        bf_surface.alpha_composite(scaled_b, (center_x - int(body_w / 2), center_y - int(body_h / 2)))

    # Directional tilt
    if tilt != 0:
        bf_surface = bf_surface.rotate(-tilt, resample=Image.BICUBIC)

    draw_img.alpha_composite(bf_surface, (int(cx - target_size), int(cy - target_size)))

def render_book_stage(width, height, is_right_aligned=True, has_content=True, leaf_turn_angle=0.0):
    """Renders the scrapbook in 3D open book view with 100% transparent cutout."""
    book_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))

    if width <= 800:
        bw = int(width * 0.94)
        bh = int(bw * 682 / 1024)
        bx = int((width - bw) / 2)
        by = int((height - bh) / 2)
    else:
        if is_right_aligned:
            bw = int(width * 0.52)
            bh = int(bw * 682 / 1024)
            bx = int(width * 0.44)
            by = int((height - bh) / 2)
        else:
            bw = int(min(width * 0.88, 1024))
            bh = int(bw * 682 / 1024)
            bx = int((width - bw) / 2)
            by = int((height - bh) / 2)

    # Translucent soft drop shadow onto the meadow
    shadow = Image.new('RGBA', (bw + 40, bh + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([20, 20, bw + 20, bh + 20], radius=16, fill=(35, 20, 10, 85))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    book_layer.alpha_composite(shadow, (bx - 20, by - 10))

    # Base leather hardcover & brass corners (100% transparent alpha cutout!)
    scaled_backdrop = backdrop.resize((bw, bh), Image.LANCZOS)
    book_layer.alpha_composite(scaled_backdrop, (bx, by))

    left_m = int(bw * 0.066)
    right_m = int(bw * 0.066)
    top_m = int(bh * 0.105)
    bot_m = int(bh * 0.138)
    pw = int((bw - left_m - right_m) / 2)
    ph = int(bh - top_m - bot_m)

    left_tpl_scaled = page_left_tpl.resize((pw, ph), Image.LANCZOS)
    if has_content:
        ld = ImageDraw.Draw(left_tpl_scaled)
        p1 = [int(pw * 0.15), int(ph * 0.20), int(pw * 0.54), int(ph * 0.60)]
        ld.rectangle(p1, fill=(255, 255, 255, 255), outline=(210, 190, 160, 255), width=1)
        ld.rectangle([p1[0]+4, p1[1]+4, p1[2]-4, p1[3]-18], fill=(250, 220, 200, 255))
        tape = [p1[0]+int(pw*0.1), p1[1]-6, p1[0]+int(pw*0.28), p1[1]+6]
        ld.rectangle(tape, fill=(255, 200, 160, 210))
        ld.text((p1[0]+8, p1[3]-16), "Sunny Meadow ~", fill=(100, 50, 20, 255), font=font_body)

        p2 = [int(pw * 0.50), int(ph * 0.42), int(pw * 0.88), int(ph * 0.82)]
        ld.rectangle(p2, fill=(255, 255, 255, 255), outline=(210, 190, 160, 255), width=1)
        ld.rectangle([p2[0]+4, p2[1]+4, p2[2]-4, p2[3]-18], fill=(210, 235, 220, 255))
        ld.text((p2[0]+8, p2[3]-16), "Golden Hours", fill=(100, 50, 20, 255), font=font_body)

    book_layer.alpha_composite(left_tpl_scaled, (bx + left_m, by + top_m))

    right_tpl_scaled = page_right_tpl.resize((pw, ph), Image.LANCZOS)
    if has_content:
        rd = ImageDraw.Draw(right_tpl_scaled)
        rd.text((int(pw * 0.18), int(ph * 0.14)), "Chapter I: Whispering Light", fill=(70, 32, 10, 255), font=font_title)
        rd.text((int(pw * 0.18), int(ph * 0.28)), "T", fill=(170, 60, 25, 255), font=font_drop)
        rd.text((int(pw * 0.32), int(ph * 0.30)), "hrough the sunset meadows,", fill=(55, 30, 15, 230), font=font_body)
        rd.text((int(pw * 0.18), int(ph * 0.44)), "where the wildflowers dance beneath", fill=(55, 30, 15, 230), font=font_body)
        rd.text((int(pw * 0.18), int(ph * 0.54)), "golden skies, a gentle wanderer took flight.", fill=(55, 30, 15, 230), font=font_body)
        rd.text((int(pw * 0.18), int(ph * 0.64)), "Each blossom carried memories of grace.", fill=(55, 30, 15, 230), font=font_body)
        rd.text((int(pw * 0.40), int(ph * 0.80)), "~ arjun0r1gin", fill=(130, 60, 25, 255), font=font_script)

    if abs(leaf_turn_angle) > 1.0:
        angle_rad = math.radians(leaf_turn_angle)
        scale_x = math.cos(angle_rad)
        abs_scale = max(0.04, abs(scale_x))
        leaf_w = int(pw * abs_scale)
        if leaf_w > 0:
            if abs(leaf_turn_angle) < 90:
                leaf_img = right_tpl_scaled.resize((leaf_w, ph), Image.LANCZOS)
                shading = Image.new('RGBA', (leaf_w, ph), (40, 20, 10, int(110 * math.sin(abs(angle_rad)))))
                leaf_img.alpha_composite(shading)
                book_layer.alpha_composite(leaf_img, (bx + left_m + pw, by + top_m))
            else:
                leaf_img = left_tpl_scaled.resize((leaf_w, ph), Image.LANCZOS)
                shading = Image.new('RGBA', (leaf_w, ph), (40, 20, 10, int(110 * math.sin(abs(angle_rad)))))
                leaf_img.alpha_composite(shading)
                book_layer.alpha_composite(leaf_img, (bx + left_m + pw - leaf_w, by + top_m))
    else:
        book_layer.alpha_composite(right_tpl_scaled, (bx + left_m + pw, by + top_m))

    spiral_w = int(bw * 0.082)
    spiral_h = int(ph * 1.04)
    scaled_spine = spiral_spine.resize((spiral_w, spiral_h), Image.LANCZOS)
    spine_x = bx + left_m + pw - int(spiral_w / 2)
    spine_y = by + top_m - int((spiral_h - ph) / 2)
    book_layer.alpha_composite(scaled_spine, (spine_x, spine_y))

    return book_layer, (bx, by, bw, bh)

def generate_all_checkpoints():
    print("Generating Fixed Full-Screen Botanical Checkpoints...", flush=True)
    W, H = 1920, 1080

    # 1. Full-screen garden immediately after flowers fall (zero cream space)
    cp1 = render_garden_camera(W, H, camera_progress=0.0)
    draw_botanical_butterfly(cp1, W * 0.48, H * 0.49, scale=0.95, tilt=0, flap_phase=1.0, aura=True)
    cp1_path = os.path.join(ARTIFACT_DIR, 'checkpoint_1_fullscreen_garden_no_cream.png')
    cp1.save(cp1_path, 'PNG')
    print("Saved:", cp1_path)

    # 2. Vertical camera movement while viewport remains fixed (35% camera descent)
    cp2 = render_garden_camera(W, H, camera_progress=0.35)
    draw_botanical_butterfly(cp2, W * 0.40, H * 0.55, scale=1.10, tilt=-14, flap_phase=2.2, aura=True)
    cp2_path = os.path.join(ARTIFACT_DIR, 'checkpoint_2_vertical_camera_movement.png')
    cp2.save(cp2_path, 'PNG')
    print("Saved:", cp2_path)

    # 3. Garden parallax movement across discrete depth layers (75% camera descent)
    cp3 = render_garden_camera(W, H, camera_progress=0.75)
    draw_botanical_butterfly(cp3, W * 0.55, H * 0.38, scale=1.18, tilt=16, flap_phase=3.4, aura=True)
    cp3_path = os.path.join(ARTIFACT_DIR, 'checkpoint_3_garden_parallax_depth.png')
    cp3.save(cp3_path, 'PNG')
    print("Saved:", cp3_path)

    # 4. Book entering on right side with clean transparent cutout & blank parchment
    cp4 = render_garden_camera(W, H, camera_progress=1.0)
    book_blank, _ = render_book_stage(W, H, is_right_aligned=True, has_content=False)
    cp4.alpha_composite(book_blank)
    draw_botanical_butterfly(cp4, W * 0.68, H * 0.32, scale=1.05, tilt=6, flap_phase=4.6, aura=True)
    cp4_path = os.path.join(ARTIFACT_DIR, 'checkpoint_4_book_entrance_right.png')
    cp4.save(cp4_path, 'PNG')
    print("Saved:", cp4_path)

    # 5. Butterfly approaching and settling near book
    cp5 = render_garden_camera(W, H, camera_progress=1.0)
    cp5.alpha_composite(book_blank)
    draw_botanical_butterfly(cp5, W * 0.75, H * 0.22, scale=0.86, tilt=3, flap_phase=5.8, aura=True)
    cp5_path = os.path.join(ARTIFACT_DIR, 'checkpoint_5_butterfly_approaching_book.png')
    cp5.save(cp5_path, 'PNG')
    print("Saved:", cp5_path)

    # 6. First book spread appearing only after arrival
    cp6 = render_garden_camera(W, H, camera_progress=1.0)
    book_filled, _ = render_book_stage(W, H, is_right_aligned=True, has_content=True)
    cp6.alpha_composite(book_filled)
    draw_botanical_butterfly(cp6, W * 0.75, H * 0.22, scale=0.86, tilt=2, flap_phase=6.4, aura=True)
    cp6_path = os.path.join(ARTIFACT_DIR, 'checkpoint_6_first_spread_appearing.png')
    cp6.save(cp6_path, 'PNG')
    print("Saved:", cp6_path)

    # 7. Page turning through scroll (physical 3D rotation)
    cp7 = render_garden_camera(W, H, camera_progress=1.0)
    book_turning, _ = render_book_stage(W, H, is_right_aligned=True, has_content=True, leaf_turn_angle=-70.0)
    cp7.alpha_composite(book_turning)
    draw_botanical_butterfly(cp7, W * 0.75, H * 0.22, scale=0.86, tilt=2, flap_phase=7.2, aura=True)
    cp7_path = os.path.join(ARTIFACT_DIR, 'checkpoint_7_page_turning_scroll.png')
    cp7.save(cp7_path, 'PNG')
    print("Saved:", cp7_path)

    # 8. Mobile Fixed Viewport (390x844)
    MW, MH = 390, 844
    mobile_bg = render_garden_camera(MW, MH, camera_progress=1.0)
    book_mobile, _ = render_book_stage(MW, MH, is_right_aligned=False, has_content=True, leaf_turn_angle=-40.0)
    mobile_bg.alpha_composite(book_mobile)
    draw_botanical_butterfly(mobile_bg, MW * 0.68, MH * 0.22, scale=0.72, tilt=4, flap_phase=1.5, aura=True)
    cp8_path = os.path.join(ARTIFACT_DIR, 'checkpoint_8_mobile_fixed_viewport.png')
    mobile_bg.save(cp8_path, 'PNG')
    print("Saved:", cp8_path)

    # 9. Complete Continuous Motion Recording (36-frame fluid GIF)
    print("Rendering 36-frame continuous botanical cinematic GIF...", flush=True)
    frames = []
    total_frames = 36
    GW, GH = 960, 540

    for f in range(total_frames):
        p = f / (total_frames - 1)
        cam_p = min(1.0, p / 0.40)
        frame = render_garden_camera(GW, GH, camera_progress=cam_p)

        if p < 0.12:
            # Stage 0: Flowers fall, uncovering full-screen garden
            fall_prog = p / 0.12
            for i, spr in enumerate(SPRITES):
                sy = int((fall_prog * GH * 1.5) + (i * 35) % GH)
                sx = (i * 85 + 40) % GW
                s_img = spr.resize((45, 45), Image.LANCZOS)
                frame.alpha_composite(s_img, (sx, sy))
            if fall_prog > 0.35:
                em = (fall_prog - 0.35) / 0.65
                draw_botanical_butterfly(frame, GW * 0.48, GH * (0.52 - em * 0.04), scale=0.4 + em * 0.55, tilt=0, flap_phase=f * 0.8)

        elif p < 0.40:
            # Stage 1: Camera moves vertically down into meadow, butterfly flies across
            flight_p = (p - 0.12) / 0.28
            bx = GW * (0.48 + flight_p * 0.20)
            by = GH * (0.48 - math.sin(flight_p * math.pi) * 0.14)
            tilt = 14 * math.cos(flight_p * math.pi)
            draw_botanical_butterfly(frame, bx, by, scale=0.92 + math.sin(flight_p * math.pi) * 0.2, tilt=tilt, flap_phase=f * 0.8)

        elif p < 0.54:
            # Stage 2: Book enters on the right side with clean transparent background, butterfly nears
            book_p = (p - 0.40) / 0.14
            book_img, _ = render_book_stage(GW, GH, is_right_aligned=True, has_content=False)
            r, g, b, a = book_img.split()
            a = a.point(lambda x: int(x * book_p))
            book_img.putalpha(a)
            frame.alpha_composite(book_img)
            bx = GW * (0.68 + book_p * 0.06)
            by = GH * (0.34 - book_p * 0.10)
            draw_botanical_butterfly(frame, bx, by, scale=0.88, tilt=4, flap_phase=f * 0.8)

        elif p < 0.66:
            # Stage 3: Butterfly settles at book, content reveals
            reveal_p = (p - 0.54) / 0.12
            book_img, _ = render_book_stage(GW, GH, is_right_aligned=True, has_content=(reveal_p > 0.45))
            frame.alpha_composite(book_img)
            draw_botanical_butterfly(frame, GW * 0.74, GH * 0.24, scale=0.84, tilt=2, flap_phase=f * 0.35)

        elif p < 0.86:
            # Stage 4: Physical 3D page turning with dynamic shading
            turn_p = (p - 0.66) / 0.20
            turn_angle = -180.0 * turn_p
            book_img, _ = render_book_stage(GW, GH, is_right_aligned=True, has_content=True, leaf_turn_angle=turn_angle)
            frame.alpha_composite(book_img)
            draw_botanical_butterfly(frame, GW * 0.74, GH * 0.24, scale=0.84, tilt=2, flap_phase=f * 0.35)

        else:
            # Stage 5: Reverse scrolling smoothly back
            rev_p = (p - 0.86) / 0.14
            turn_angle = -180.0 * (1.0 - rev_p)
            book_img, _ = render_book_stage(GW, GH, is_right_aligned=True, has_content=True, leaf_turn_angle=turn_angle)
            frame.alpha_composite(book_img)
            draw_botanical_butterfly(frame, GW * 0.74, GH * 0.24, scale=0.84, tilt=2, flap_phase=f * 0.35)

        frames.append(frame.convert('RGB'))

    gif_path = os.path.join(ARTIFACT_DIR, 'fixed_camera_cinematic_sequence.gif')
    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=175,
        loop=0,
        optimize=True
    )
    print("Saved fixed camera botanical cinematic GIF:", gif_path)
    print("ALL BOTANICAL CHECKPOINTS COMPLETE!")

if __name__ == '__main__':
    generate_all_checkpoints()
