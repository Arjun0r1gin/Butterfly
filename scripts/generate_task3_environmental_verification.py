import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter

ARTIFACT_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
os.makedirs(ARTIFACT_DIR, exist_ok=True)

# Load base visual assets
pano_img = Image.open('public/scenes/seamless_garden_panorama_hd.jpg')
wing_l = Image.open('public/butterfly/butterfly_wing_left.png').convert('RGBA')
wing_r = Image.open('public/butterfly/butterfly_wing_right.png').convert('RGBA')
body = Image.open('public/butterfly/butterfly_body.png').convert('RGBA')
closed_base = Image.open('public/storybook/closed_book_base_under.png').convert('RGBA')
closed_cover = Image.open('public/storybook/closed_book_cover_flap.png').convert('RGBA')

# ---------------------------------------------------------------------------
# C1-Continuous Camera Pan Function
# ---------------------------------------------------------------------------
D_START = 0.03
D_END = 0.03
D_EASE = 0.04
D_HOLD = 0.25
EFF_TIME = 1.0 - D_HOLD - D_EASE - 0.5 * (D_START + D_END)
V0 = 1.0 / EFF_TIME

T_CRUISE1 = 0.52 / V0 - 0.5 * (D_START + D_EASE)
T_CRUISE2 = 0.48 / V0 - 0.5 * (D_EASE + D_END)

P0 = 0.0
P1 = P0 + D_START
P2 = P1 + T_CRUISE1
P3 = P2 + D_EASE
P4 = P3 + D_HOLD
P5 = P4 + D_EASE
P6 = P5 + T_CRUISE2
P7 = 1.0

X0 = 0.0
X1 = 0.5 * V0 * D_START
X2 = X1 + V0 * T_CRUISE1
X3 = 0.52
X4 = 0.52
X5 = X4 + 0.5 * V0 * D_EASE
X6 = X5 + V0 * T_CRUISE2
X7 = 1.0

def hermite(t, Xa, Xb, Va_s, Vb_s):
    t2 = t * t
    t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * Xa + (t3 - 2 * t2 + t) * Va_s + (-2 * t3 + 3 * t2) * Xb + (t3 - t2) * Vb_s

def get_cam_fraction(p):
    cp = max(0.0, min(1.0, p))
    if cp <= P1:
        t = (cp - P0) / D_START
        return hermite(t, X0, X1, 0.0, V0 * D_START)
    elif cp <= P2:
        return X1 + V0 * (cp - P1)
    elif cp <= P3:
        t = (cp - P2) / D_EASE
        return hermite(t, X2, X3, V0 * D_EASE, 0.0)
    elif cp <= P4:
        return X3
    elif cp <= P5:
        t = (cp - P4) / D_EASE
        return hermite(t, X4, X5, 0.0, V0 * D_EASE)
    elif cp <= P6:
        return X5 + V0 * (cp - P5)
    else:
        t = (cp - P6) / D_END
        return hermite(t, X6, X7, V0 * D_END, 0.0)

def smoothstep(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3.0 - 2.0 * t)

# ---------------------------------------------------------------------------
# Butterfly Trajectory
# ---------------------------------------------------------------------------
def get_bf_state(p, vw=1600, vh=900):
    contW = max(vh * 3.656, 2.2 * vw)
    contH = vh
    scale = contW / 3868 if (contW / contH) >= (3868 / 1058) else contH / 1058
    offsetY = (contH - 1058 * scale) / 2.0 if (contW / contH) >= (3868 / 1058) else 0

    tipContX = 3535 * scale
    tipContY = offsetY + 234 * scale
    maxPanX = max(0, contW - vw)
    tipScreenX = tipContX - maxPanX
    tipScreenY = tipContY
    landingX = (tipScreenX / vw) * 100
    landingY = ((tipScreenY - 28) / vh) * 100

    kfs = [
        (0.00, 48.0, 48.0, 0.85, 4.0),
        (0.12, 38.0, 38.0, 1.05, -8.0),
        (0.24, 34.0, 32.0, 1.10, 6.0),
        (0.30, 36.0, 28.0, 1.05, 10.0),
        (0.35, 45.0, 35.0, 0.94, 8.0),
        (0.3886, 50.0, 46.0, 0.80, 0.0),
        (0.43, 50.0, 46.0, 0.80, 0.0),
        (0.46, 68.0, 26.0, 0.86, 8.0),
        (0.49, 86.0, 13.0, 0.82, 2.0),
        (0.66, 86.0, 13.0, 0.82, 2.0),
        (0.69, 72.0, 20.0, 0.98, 12.0),
        (0.78, 68.0, 25.0, 1.08, 10.0),
        (0.88, 76.0, 21.0, 1.18, 7.0),
        (0.94, landingX - 1.5, landingY - 2.8, 1.25, 4.0),
        (0.97, landingX, landingY, 1.28, 2.0),
        (1.00, landingX, landingY, 1.28, 2.0),
    ]

    cp = max(0.0, min(1.0, p))
    for i in range(len(kfs) - 1):
        p0, x0, y0, s0, r0 = kfs[i]
        p1, x1, y1, s1, r1 = kfs[i + 1]
        if cp <= p1:
            sm = smoothstep(p0, p1, cp)
            return {
                'x': x0 + (x1 - x0) * sm,
                'y': y0 + (y1 - y0) * sm,
                'scale': s0 + (s1 - s0) * sm,
                'rot': r0 + (r1 - r0) * sm,
            }
    last = kfs[-1]
    return {'x': last[1], 'y': last[2], 'scale': last[3], 'rot': last[4]}

# ---------------------------------------------------------------------------
# Procedural Environmental Engine
# ---------------------------------------------------------------------------
# Cache puff patches by (rx, ry, color, alpha)
_puff_cache = {}
def get_smooth_puff(rx, ry, r, g, b, alpha):
    key = (rx, ry, r, g, b, alpha)
    if key in _puff_cache:
        return _puff_cache[key]
    w = int(rx * 2.5)
    h = int(ry * 2.5)
    cx, cy = w / 2.0, h / 2.0
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    pixels = img.load()
    for y in range(h):
        dy = (y - cy) / ry
        for x in range(w):
            dx = (x - cx) / rx
            d2 = dx * dx + dy * dy
            if d2 < 1.0:
                dist = math.sqrt(d2)
                falloff = math.cos(dist * (math.pi / 2.0))
                falloff = falloff * falloff
                a = int(alpha * falloff)
                if a > 0:
                    pixels[x, y] = (r, g, b, a)
    _puff_cache[key] = img
    return img

def render_frame(p, time_s=3.0, vw=1600, vh=900, clouds_only=False, particles_only=False):
    contW = int(max(vh * 3.656, 2.2 * vw))
    contH = vh
    scale = contW / 3868 if (contW / contH) >= (3868 / 1058) else contH / 1058
    renderedW = contW if (contW / contH) >= (3868 / 1058) else int(3868 * scale)
    renderedH = int(1058 * scale) if (contW / contH) >= (3868 / 1058) else contH
    offsetY = int((contH - renderedH) / 2.0) if (contW / contH) >= (3868 / 1058) else 0

    pano_scaled = pano_img.resize((renderedW, renderedH), Image.Resampling.LANCZOS)
    world_canvas = Image.new('RGB', (contW, contH), (18, 7, 3))
    world_canvas.paste(pano_scaled, (0, offsetY))

    # Master Camera Pan
    maxPanX = max(0, contW - vw)
    camFrac = get_cam_fraction(p)
    panX = camFrac * maxPanX

    # Closed Book in Pergola (Scene 2)
    bookX_world = 0.52 * maxPanX + (vw * 0.5)
    bookY_world = contH * 0.5
    bookW = min(440, int(vw * 0.46))
    bookH = int(bookW * (860 / 760))

    if p >= 0.20 and p <= 0.68:
        # Paste closed book base
        base_scaled = closed_base.resize((bookW, bookH), Image.Resampling.LANCZOS)
        cover_scaled = closed_cover.resize((bookW, bookH), Image.Resampling.LANCZOS)
        bx = int(bookX_world - bookW / 2)
        by = int(bookY_world - bookH / 2)
        world_canvas.paste(base_scaled, (bx, by), base_scaled)
        if p < 0.43:
            world_canvas.paste(cover_scaled, (bx, by), cover_scaled)

    # Crop to camera viewport
    screen = world_canvas.crop((int(panX), 0, int(panX + vw), vh)).convert('RGBA')

    # Draw Procedural Environmental Layer on Screen
    env_overlay = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))

    # 1. Subtle warm sunset atmospheric haze
    if not particles_only:
        haze = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
        d_haze = ImageDraw.Draw(haze)
        for y in range(int(vh * 0.45), vh, 4):
            frac = (y - vh * 0.45) / (vh * 0.55)
            alpha = int(35 * frac * frac)
            d_haze.line([(0, y), (vw, y)], fill=(255, 140, 50, alpha))
        env_overlay.alpha_composite(haze)

    # 2. Procedural Clouds (Multi-depth drifting clusters)
    if not particles_only:
        cloud_canvas = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
        # 16 procedural cloud clusters across world
        random.seed(42)
        for c_idx in range(16):
            depth = c_idx % 3
            parallax = 0.25 if depth == 0 else 0.45 if depth == 1 else 0.65
            speed = 12 if depth == 0 else 20 if depth == 1 else 28
            scale_c = 1.0 if depth == 0 else 1.3 if depth == 1 else 0.85
            baseX = (c_idx / 16.0) * contW + (math.sin(c_idx * 3.7) * 90)
            worldX = (baseX + time_s * speed) % (contW + 400) - 200
            worldY = (0.05 + (math.sin(c_idx * 5.1) * 0.5 + 0.5) * 0.35) * vh

            screenX = worldX - panX * parallax
            screenY = worldY

            if screenX < -300 or screenX > vw + 300:
                continue

            # Draw soft smooth bell puffs
            puff_count = 6 + (c_idx % 4)
            for puff in range(puff_count):
                ang = (puff / puff_count) * math.pi * 2 + c_idx * 0.5
                dist = (math.sin(puff * 2.3 + c_idx) * 0.4 + 0.6) * (65 * scale_c)
                px = screenX + math.cos(ang) * dist * 1.5
                py = screenY + math.sin(ang) * dist * 0.55
                rx = int((55 + math.sin(puff * 1.7) * 20) * scale_c)
                ry = int((35 + math.cos(puff * 2.1) * 12) * scale_c)

                # Sunset peach highlight top, amber core, dark-red shaded base
                r_c = 255 if puff < 2 else 240 if puff < 4 else 210
                g_c = 175 if puff < 2 else 140 if puff < 4 else 95
                b_c = 110 if puff < 2 else 80 if puff < 4 else 60
                alpha_c = 36 if depth == 0 else 46 if depth == 1 else 32

                puff_img = get_smooth_puff(rx, ry, r_c, g_c, b_c, alpha_c)
                pw, ph = puff_img.size
                cloud_canvas.alpha_composite(puff_img, (int(px - pw / 2), int(py - ph / 2)))

        env_overlay.alpha_composite(cloud_canvas)

    # 3. Floating Atmospheric Particles (Dust, Golden Pollen, Fireflies)
    if not clouds_only:
        particle_canvas = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
        dp = ImageDraw.Draw(particle_canvas)
        random.seed(101)
        particle_count = 120
        for p_idx in range(particle_count):
            species_roll = p_idx % 10
            is_firefly = species_roll == 9
            is_pollen = 6 <= species_roll < 9
            is_dust = species_roll < 6

            depth = 0.35 + (p_idx % 7) * 0.12
            baseX = (p_idx / particle_count) * contW + math.sin(p_idx * 13.7) * 120
            worldX = (baseX + time_s * (14 * depth + 5)) % contW
            worldY = (0.15 + (p_idx % 17) / 22.0) * vh + math.sin(time_s * 1.5 + p_idx) * 15

            screenX = worldX - panX * depth
            screenY = worldY

            if screenX < -20 or screenX > vw + 20:
                continue

            if is_firefly:
                # Glowing firefly with pulsating halo
                pulse = math.sin(time_s * 2.5 + p_idx * 2) * 0.5 + 0.5
                alpha = int(140 + 100 * pulse)
                r_halo = 8
                dp.ellipse([screenX - r_halo, screenY - r_halo, screenX + r_halo, screenY + r_halo], fill=(235, 255, 140, int(alpha * 0.3)))
                dp.ellipse([screenX - 2.5, screenY - 2.5, screenX + 2.5, screenY + 2.5], fill=(255, 255, 200, alpha))
            elif is_pollen:
                alpha = 130
                dp.ellipse([screenX - 5, screenY - 5, screenX + 5, screenY + 5], fill=(255, 220, 100, 45))
                dp.ellipse([screenX - 2, screenY - 2, screenX + 2, screenY + 2], fill=(255, 230, 110, alpha))
            else:
                alpha = 90
                dp.ellipse([screenX - 1.5, screenY - 1.5, screenX + 1.5, screenY + 1.5], fill=(255, 205, 140, alpha))

        env_overlay.alpha_composite(particle_canvas)

    # 4. Procedural Wind & Swaying Foreground Vegetation (Bottom border)
    if not clouds_only:
        veg_canvas = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
        dv = ImageDraw.Draw(veg_canvas)
        plant_count = 180
        for i in range(plant_count):
            worldX = (i / plant_count) * contW + math.sin(i * 4.3) * 15
            screenBaseX = worldX - panX
            if screenBaseX < -30 or screenBaseX > vw + 30:
                continue

            baseY = vh * (0.95 + (i % 5) * 0.01)
            h_blade = 32 + (i % 9) * 5
            is_flower = i % 5 == 0

            # Harmonic wind sway
            sway = math.sin(time_s * 2.0 + worldX * 0.004 + i * 0.3) * 14
            tipX = screenBaseX + sway
            tipY = baseY - h_blade
            ctrlX = screenBaseX + sway * 0.5
            ctrlY = baseY - h_blade * 0.5

            color = (92, 107, 36) if (i % 3 == 0) else (120, 130, 45) if (i % 3 == 1) else (140, 122, 43)
            dv.line([(screenBaseX, baseY), (ctrlX, ctrlY), (tipX, tipY)], fill=color + (210,), width=2)

            if is_flower:
                flw_color = (245, 158, 11) if (i % 4 == 0) else (239, 68, 68) if (i % 4 == 1) else (168, 85, 247) if (i % 4 == 2) else (251, 191, 36)
                dv.ellipse([tipX - 4, tipY - 4, tipX + 4, tipY + 4], fill=flw_color + (230,))
                dv.ellipse([tipX - 1.5, tipY - 1.5, tipX + 1.5, tipY + 1.5], fill=(255, 237, 213, 255))

        env_overlay.alpha_composite(veg_canvas)

    # Composite environmental overlay onto screen
    screen.alpha_composite(env_overlay)

    # 5. Composite Butterfly Character
    bf = get_bf_state(p, vw, vh)
    bf_screenX = (bf['x'] / 100.0) * vw
    bf_screenY = (bf['y'] / 100.0) * vh
    bf_scale = bf['scale']
    bf_rot = bf['rot']

    # 90x90 base butterfly
    bf_canvas = Image.new('RGBA', (90, 90), (0, 0, 0, 0))
    wl_scaled = wing_l.resize((46, 90), Image.Resampling.LANCZOS)
    wr_scaled = wing_r.resize((46, 90), Image.Resampling.LANCZOS)
    body_scaled = body.resize((16, 90), Image.Resampling.LANCZOS)

    bf_canvas.paste(wl_scaled, (45 - 46, 0), wl_scaled)
    bf_canvas.paste(wr_scaled, (45, 0), wr_scaled)
    bf_canvas.paste(body_scaled, (45 - 8, 0), body_scaled)

    final_w = int(90 * bf_scale)
    final_h = int(90 * bf_scale)
    bf_final = bf_canvas.resize((final_w, final_h), Image.Resampling.LANCZOS).rotate(bf_rot, resample=Image.Resampling.BICUBIC, expand=True)

    # Subtle fairy glow
    glow = Image.new('RGBA', (int(140 * bf_scale), int(140 * bf_scale)), (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow)
    gr = int(60 * bf_scale)
    gc = int(70 * bf_scale)
    dg.ellipse([gc - gr, gc - gr, gc + gr, gc + gr], fill=(255, 215, 120, 38))
    glow = glow.filter(ImageFilter.GaussianBlur(10))

    screen.paste(glow, (int(bf_screenX - glow.width / 2), int(bf_screenY - glow.height / 2)), glow)
    screen.paste(bf_final, (int(bf_screenX - bf_final.width / 2), int(bf_screenY - bf_final.height / 2)), bf_final)

    # Scroll hint at bottom
    hint_w = min(300, int(vw * 0.7))
    hint_h = 36
    hint_x = (vw - hint_w) // 2
    hint_y = vh - 54
    hint_box = Image.new('RGBA', (hint_w, hint_h), (25, 12, 6, 210))
    dh = ImageDraw.Draw(hint_box)
    dh.rectangle([0, 0, hint_w - 1, hint_h - 1], outline=(255, 215, 120, 90), width=1)
    screen.paste(hint_box, (hint_x, hint_y), hint_box)

    return screen.convert('RGB')

# ---------------------------------------------------------------------------
# Generate Mandatory Checkpoints 1 to 8
# ---------------------------------------------------------------------------
print('Generating Checkpoint 1: Scene 1 with original background and procedural clouds...')
cp1 = render_frame(0.05, time_s=2.0, clouds_only=True)
cp1.save(os.path.join(ARTIFACT_DIR, 'task3_cp1_scene1_procedural_clouds.png'), quality=95)

print('Generating Checkpoint 2: Scene 1 with particles and wind...')
cp2 = render_frame(0.15, time_s=3.5)
cp2.save(os.path.join(ARTIFACT_DIR, 'task3_cp2_scene1_particles_and_wind.png'), quality=95)

print('Generating Checkpoint 3: Scene 2 with all environmental effects...')
cp3 = render_frame(0.30, time_s=5.0)
cp3.save(os.path.join(ARTIFACT_DIR, 'task3_cp3_scene2_environmental_effects.png'), quality=95)

print('Generating Checkpoint 4: Scene 2 while butterfly lands on memory book...')
cp4 = render_frame(0.40, time_s=6.5)
cp4.save(os.path.join(ARTIFACT_DIR, 'task3_cp4_scene2_book_landing.png'), quality=95)

print('Generating Checkpoint 5: Scene 3 with all environmental effects...')
cp5 = render_frame(1.00, time_s=8.0)
cp5.save(os.path.join(ARTIFACT_DIR, 'task3_cp5_scene3_rocket_environment.png'), quality=95)

print('Generating Checkpoint 6: Camera transition Scene 1 to Scene 2...')
cp6 = render_frame(0.28, time_s=4.2)
cp6.save(os.path.join(ARTIFACT_DIR, 'task3_cp6_transition_scene1_to_scene2.png'), quality=95)

print('Generating Checkpoint 7: Camera transition Scene 2 to Scene 3...')
cp7 = render_frame(0.72, time_s=7.0)
cp7.save(os.path.join(ARTIFACT_DIR, 'task3_cp7_transition_scene2_to_scene3.png'), quality=95)

print('Generating Checkpoint 8: Continuous sequence collage across all three scenes...')
# Create 3-panel collage showing Meadow -> Pergola -> Rocket
w_thumb = 533
h_thumb = 300
strip = Image.new('RGB', (w_thumb * 3, h_thumb), (18, 7, 3))
strip.paste(cp2.resize((w_thumb, h_thumb), Image.Resampling.LANCZOS), (0, 0))
strip.paste(cp4.resize((w_thumb, h_thumb), Image.Resampling.LANCZOS), (w_thumb, 0))
strip.paste(cp5.resize((w_thumb, h_thumb), Image.Resampling.LANCZOS), (w_thumb * 2, 0))

d_strip = ImageDraw.Draw(strip)
d_strip.line([(w_thumb, 0), (w_thumb, h_thumb)], fill=(255, 215, 120, 180), width=2)
d_strip.line([(w_thumb * 2, 0), (w_thumb * 2, h_thumb)], fill=(255, 215, 120, 180), width=2)
strip.save(os.path.join(ARTIFACT_DIR, 'task3_cp8_continuous_journey_environmental_strip.png'), quality=95)

print('All 8 mandatory verification checkpoints generated successfully!')
