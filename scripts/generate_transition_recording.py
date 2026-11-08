"""
BUTTERFLY — Full Flower Tunnel-to-Garden Transition Renderer
Generates flower_tunnel_to_garden_transition.gif showing:
1. Gift box entry & dissolve
2. Swirl & center bloom
3. Viewport saturation
4. Full coverage hold
5. All flowers cascading downward like a waterfall curtain, unveiling the sunset Garden underneath!
6. Living Garden revealed
"""

import os
import math
from PIL import Image, ImageDraw

ARTIFACT_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/src/../..//home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
# Clean path
ARTIFACT_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
GARDEN_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/garden'
PROCESSED_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/flowers/processed'
ORIG_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/flowers'

# Preload verified flower sprites
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
    img = Image.open(p).convert('RGBA')
    SPRITES.append(img)

# Import the render_garden_frame function from generate_garden_previews
import sys
sys.path.append('/home/arjun0r1gin/Desktop/BUTTERFLY/scripts')
from generate_garden_previews import render_organic_garden_frame

# Generate 320 particles matching tunnelMath.ts
RING_COUNT = 16
FLOWERS_PER_RING = 20
particles = []
pid = 0
for ring in range(RING_COUNT):
    r_ratio = (ring / (RING_COUNT - 1)) ** 0.72
    ring_flowers = 6 if ring == 0 else FLOWERS_PER_RING
    for f in range(ring_flowers):
        base_angle = (f / ring_flowers) * math.pi * 2 + ring * 2.39996
        # Fall delay staggered from top to bottom
        fall_delay = (math.sin(pid * 13.7) * 0.5 + 0.5) * 0.35
        fall_speed = 0.85 + (math.cos(pid * 19.3) * 0.5 + 0.5) * 0.3
        sway_amp = 18.0 + (math.sin(pid * 7.1) * 0.5 + 0.5) * 22.0
        sway_freq = 3.0 + (math.cos(pid * 11.2) * 0.5 + 0.5) * 3.5

        particles.append({
            'id': pid,
            'ring': ring,
            'r_ratio': r_ratio,
            'base_angle': base_angle,
            'variety': (pid * 7 + ring * 3) % len(SPRITES),
            'fall_delay': fall_delay,
            'fall_speed': fall_speed,
            'sway_amp': sway_amp,
            'sway_freq': sway_freq,
            'scale': 0.88 + ((math.sin(pid * 43.1) + 1) / 2) * 0.28
        })
        pid += 1

def render_transition_frame(w, h, stage_idx, total_stages):
    prog = stage_idx / (total_stages - 1)
    # Timeline mapping:
    # 0.00 - 0.18: Gift box
    # 0.18 - 0.40: Swirl & center bloom
    # 0.40 - 0.65: Expanding saturation
    # 0.65 - 0.75: Full coverage hold
    # 0.75 - 0.95: Cascading fall
    # 0.95 - 1.00: Living garden
    cx, cy = w / 2.0, h / 2.0
    r_corner = math.sqrt(cx**2 + cy**2) * 1.15

    # 1. Garden Background: appears ONLY once the flowers drop down (prog >= 0.75)
    # Zero black screen: smooth alpha crossfade from warm pastel to sunset garden
    if prog < 0.75:
        garden_alpha = 0.0
    else:
        # Fades in smoothly as flowers drop down
        garden_alpha = min(1.0, (prog - 0.75) / 0.18)

    # Base background is always clean warm pastel (#faf5ec), so there is NEVER a black screen
    final = Image.new('RGBA', (w, h), (250, 245, 236, 255))

    # Composite Garden if active (only once flowers drop down)
    if garden_alpha > 0.01:
        garden_frame = render_organic_garden_frame(w, h, time_sec=prog * 8.0)
        if garden_alpha < 0.99:
            # Apply alpha
            g_alpha_mask = Image.new('L', (w, h), int(255 * garden_alpha))
            final.paste(garden_frame, (0, 0), g_alpha_mask)
        else:
            final.paste(garden_frame, (0, 0))

    frame = Image.new('RGBA', (w, h), (0, 0, 0, 0))

    # Gift Box (0.0 to 0.20)
    if prog < 0.20:
        draw = ImageDraw.Draw(frame)
        gb_op = 1.0 if prog < 0.14 else (1.0 - (prog - 0.14) / 0.06)
        sc = 1.0 + (prog / 0.20) * 0.3
        bw, bh = int(100 * sc), int(90 * sc)
        bx, by = int(cx - bw/2), int(cy - bh/2)
        draw.rectangle([bx, by + int(bh*0.2), bx + bw, by + bh], fill=(244, 114, 182, int(255 * gb_op)), outline=(219, 39, 119, int(255 * gb_op)), width=2)
        draw.rectangle([bx - 5, by, bx + bw + 5, by + int(bh*0.25)], fill=(251, 207, 232, int(255 * gb_op)), outline=(219, 39, 119, int(255 * gb_op)), width=2)
        draw.rectangle([int(cx - 7), by, int(cx + 7), by + bh], fill=(251, 191, 36, int(255 * gb_op)))

    # Flowers (prog >= 0.15)
    if prog >= 0.15:
        # Radial expansion
        if prog < 0.40:
            cov = (prog - 0.15) / 0.25 * 0.45
            swirl = (prog - 0.15) * 1.5
            active_ratio = (prog - 0.15) / 0.25 * 0.5
        elif prog < 0.65:
            f = (prog - 0.40) / 0.25
            cov = 0.45 + f * 0.55
            swirl = 0.45 * 1.5 + f * 1.8
            active_ratio = 0.5 + f * 0.5
        elif prog < 0.75:
            cov = 1.0
            swirl = 0.45 * 1.5 + 1.8 + (prog - 0.65) * 0.8
            active_ratio = 1.0
        else:
            cov = 1.0
            swirl = 3.0
            active_ratio = 1.0

        fall_prog = max(0.0, min(1.0, (prog - 0.75) / 0.20)) if prog >= 0.75 else 0.0

        for p in particles:
            if p['r_ratio'] > active_ratio * 1.1 and prog < 0.65:
                continue

            r = p['r_ratio'] * r_corner * cov
            theta = p['base_angle'] + swirl * (1.0 + 0.35 * (1.0 - p['r_ratio']))
            
            x = cx + r * math.cos(theta)
            y = cy + r * math.sin(theta)

            # Apply gravity-driven fall if fall_prog > 0
            if fall_prog > 0:
                dt = max(0.0, fall_prog - p['fall_delay'])
                if dt > 0:
                    y += 1800 * (dt ** 2) * p['fall_speed'] + dt * 250
                    x += math.sin(dt * p['sway_freq']) * p['sway_amp']

            # Check if offscreen
            if y > h + 180 or y < -180 or x < -180 or x > w + 180:
                continue

            sz = int(120 * p['scale'] * min(1.0, cov * 1.4))
            if sz < 15:
                continue

            sp = SPRITES[p['variety']]
            sp_res = sp.resize((sz, sz), Image.BILINEAR)
            frame.paste(sp_res, (int(x - sz/2), int(y - sz/2)), sp_res)

    # Composite flower frame over final
    final.alpha_composite(frame)
    return final

print("Generating 24-frame full Flower Tunnel-to-Garden transition GIF...")
frames = []
TOTAL_FRAMES = 24
for i in range(TOTAL_FRAMES):
    fr = render_transition_frame(854, 480, i, TOTAL_FRAMES)
    frames.append(fr.convert('RGB'))
    print(f"  Frame {i+1}/{TOTAL_FRAMES} rendered")

out_gif = os.path.join(ARTIFACT_DIR, 'flower_tunnel_to_garden_transition.gif')
frames[0].save(
    out_gif,
    save_all=True,
    append_images=frames[1:],
    duration=140,
    loop=0,
    optimize=True
)
print(f"Saved: {out_gif}")
