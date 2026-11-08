"""
BUTTERFLY — High-Fidelity Living Garden Preview Generator (Seamless Edition)
Generates:
1. Static garden preview (Desktop 1920x1080)
2. Static garden preview (Mobile 390x844)
3. Animated living garden preview (GIF)
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter

ARTIFACT_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
GARDEN_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/garden'
PROCESSED_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/flowers/processed'

# Load master base and organic layers
base_master = Image.open(os.path.join(GARDEN_DIR, 'garden_base_master.png')).convert('RGBA')
clouds_loop = Image.open(os.path.join(GARDEN_DIR, 'layer_clouds_loop.png')).convert('RGBA')
framing_tree = Image.open(os.path.join(GARDEN_DIR, 'layer_framing_tree_clean.png')).convert('RGBA')

# Preload pink petal sprite for delicate breeze flutter
petal_sprite = Image.open(os.path.join(PROCESSED_DIR, 'Delicate Peach Coral Watercolor Bloom.png')).convert('RGBA')

def render_organic_garden_frame(w, h, time_sec=0.0):
    # Responsive cover: compute target dimensions
    aspect_target = w / h
    aspect_src = 1024 / 576
    if aspect_target > aspect_src:
        nw = w
        nh = int(w / aspect_src)
    else:
        nh = h
        nw = int(h * aspect_src)
    
    ox = (w - nw) // 2
    oy = (h - nh) // 2

    # 1. Base Master Environment (100% reference fidelity, zero seams)
    frame = base_master.resize((nw, nh), Image.LANCZOS)
    if ox != 0 or oy != 0:
        crop_x = max(0, -ox)
        crop_y = max(0, -oy)
        frame = frame.crop((crop_x, crop_y, crop_x + w, crop_y + h))
    else:
        frame = frame.crop((0, 0, w, h))

    # 2. Atmospheric Sun Corona Breathing Glow
    pulse = 0.5 + 0.5 * math.sin(time_sec * 0.8)
    sun_px = ox + int(nw * 0.47)
    sun_py = oy + int(nh * 0.48)
    glow_r = int(min(w, h) * 0.40 * (0.97 + 0.06 * pulse))
    glow_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    for r in range(glow_r, 0, -8):
        f = (1.0 - r / glow_r) ** 2.2
        alpha = int(f * 48 * pulse)
        glow_draw.ellipse(
            [sun_px - r, sun_py - r, sun_px + r, sun_py + r],
            fill=(255, 215, 120, alpha)
        )
    frame = Image.alpha_composite(frame, glow_img)

    # 3. Drifting Watercolor Clouds (Feathered seamlessly)
    drift = int((time_sec * 16) % nw)
    ch_resized = clouds_loop.resize((nw * 2, nh), Image.LANCZOS)
    crop_x = drift + max(0, -ox)
    crop_y = max(0, -oy)
    ch_crop = ch_resized.crop((crop_x, crop_y, crop_x + w, crop_y + h))
    # Blend clouds subtly over the sky
    frame = Image.alpha_composite(frame, ch_crop)

    # 4. Delicate Floating Fallen Petals in the Sunset Breeze
    for i in range(7):
        speed_x = 28 + (i * 10)
        px = int((time_sec * speed_x + i * 190) % (w + 80)) - 40
        py = int(h * 0.48 + (i * 38) + math.sin(time_sec * 2.2 + i * 1.5) * 14)
        pet_sz = int(min(w, h) * 0.025)
        pet_res = petal_sprite.resize((pet_sz, pet_sz), Image.BILINEAR)
        pet_rot = pet_res.rotate(time_sec * 45 + i * 50, expand=True)
        # Gentle opacity
        alpha_mask = pet_rot.split()[3].point(lambda a: int(a * 0.75))
        frame.paste(pet_rot, (px, py), alpha_mask)

    # 5. Left Framing Tree subtle organic sway
    tree_sway_deg = 0.45 * math.sin(time_sec * 0.45)
    if abs(tree_sway_deg) > 0.05:
        tree_res = framing_tree.resize((nw, nh), Image.LANCZOS)
        tree_rot = tree_res.rotate(tree_sway_deg, resample=Image.BICUBIC, center=(int(nw * 0.05), int(nh * 0.15)))
        if ox != 0 or oy != 0:
            cx_ = max(0, -ox)
            cy_ = max(0, -oy)
            tree_crop = tree_rot.crop((cx_, cy_, cx_ + w, cy_ + h))
        else:
            tree_crop = tree_rot.crop((0, 0, w, h))
        frame = Image.alpha_composite(frame, tree_crop)

    return frame

if __name__ == '__main__':
    print("Rendering clean Desktop static preview (1920x1080)...")
    desktop_frame = render_organic_garden_frame(1920, 1080, time_sec=1.5)
    desktop_frame.save(os.path.join(ARTIFACT_DIR, 'garden_static_preview_1920x1080.png'), 'PNG')
    print("Saved: garden_static_preview_1920x1080.png")

    print("Rendering clean Mobile static preview (390x844)...")
    mobile_frame = render_organic_garden_frame(390, 844, time_sec=1.5)
    mobile_frame.save(os.path.join(ARTIFACT_DIR, 'garden_static_preview_390x844.png'), 'PNG')
    print("Saved: garden_static_preview_390x844.png")

    print("Rendering animated living garden GIF (16 frames)...")
    gif_frames = []
    for f in range(16):
        t = f * 0.35
        fr = render_organic_garden_frame(960, 540, time_sec=t)
        gif_frames.append(fr.convert('RGB'))

    gif_frames[0].save(
        os.path.join(ARTIFACT_DIR, 'garden_living_animation.gif'),
        save_all=True,
        append_images=gif_frames[1:],
        duration=100,
        loop=0,
        optimize=True
    )
    print("Saved: garden_living_animation.gif")
