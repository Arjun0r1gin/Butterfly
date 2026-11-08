"""
BUTTERFLY — High-Fidelity Sprite Extraction & Storybook Cutout
1. Extracts Storybook Painted Lady (Concept 3) with authentic watercolor de-matting
   into transparent PNGs:
   - butterfly_full.png
   - butterfly_body.png
   - butterfly_wing_left.png
   - butterfly_wing_right.png
2. Isolates the Storybook backdrop in public/storybook/book_backdrop.png with
   clean alpha transparency outside the leather cover and brass corners.
"""

import os
from PIL import Image, ImageDraw, ImageFilter

ART_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
PUBLIC_BF = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/butterfly'
PUBLIC_SB = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/storybook'
os.makedirs(PUBLIC_BF, exist_ok=True)

# -----------------------------------------------------------------------------
# 1. Process Butterfly Concept 3 (Storybook Painted Lady)
# -----------------------------------------------------------------------------
concept_p = os.path.join(ART_DIR, 'butterfly_concept_3_painted_lady.jpg')
src_im = Image.open(concept_p).convert('RGB')
w, h = src_im.size

# High-precision color de-matting against solid white paper (251, 251, 250)
rgba_im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
src_pixels = src_im.load()
out_pixels = rgba_im.load()

# White paper reference
w_r, w_g, w_b = 251.0, 251.0, 250.0

for y in range(h):
    for x in range(w):
        r, g, b = src_pixels[x, y]
        # Distance from paper white
        diff_r = max(0.0, w_r - r)
        diff_g = max(0.0, w_g - g)
        diff_b = max(0.0, w_b - b)
        max_diff = max(diff_r, diff_g, diff_b)

        if max_diff < 7.0:
            # Pure paper white -> completely transparent
            out_pixels[x, y] = (0, 0, 0, 0)
        else:
            # Calculate alpha based on color intensity & luminance
            alpha = min(255, int(max_diff * 2.8 + 25))
            if alpha > 248:
                alpha = 255
            # De-mat color to restore rich pigment saturation
            inv_a = 255.0 / max(1, alpha)
            c_r = max(0, min(255, int(r - (255 - alpha) * 0.95)))
            c_g = max(0, min(255, int(g - (255 - alpha) * 0.95)))
            c_b = max(0, min(255, int(b - (255 - alpha) * 0.95)))
            out_pixels[x, y] = (c_r, c_g, c_b, alpha)

# Crop to tight bounding box with comfortable margin
bbox = rgba_im.getbbox()
print("Butterfly trimmed bbox:", bbox)
cropped_bf = rgba_im.crop(bbox)
cw, ch = cropped_bf.size

# Save full butterfly
full_path = os.path.join(PUBLIC_BF, 'butterfly_full.png')
cropped_bf.save(full_path, 'PNG')
print("Saved:", full_path, cropped_bf.size)

# Center body x coordinate inside cropped image
# Antennae top to abdomen bottom
body_cx = (504 - bbox[0])
body_w = int(cw * 0.09)

# 2. Extract Central Body (Head, thorax, abdomen, antennae)
body_im = Image.new('RGBA', (body_w * 2, ch), (0, 0, 0, 0))
body_crop = cropped_bf.crop((body_cx - body_w, 0, body_cx + body_w, ch))
body_im.alpha_composite(body_crop, (0, 0))
body_path = os.path.join(PUBLIC_BF, 'butterfly_body.png')
body_im.save(body_path, 'PNG')
print("Saved:", body_path, body_im.size)

# 3. Extract Left Wing (pivot at right edge)
# From x=0 to body_cx + 8 (overlapping slightly behind body)
left_wing_crop = cropped_bf.crop((0, 0, body_cx + 8, ch))
left_wing_path = os.path.join(PUBLIC_BF, 'butterfly_wing_left.png')
left_wing_crop.save(left_wing_path, 'PNG')
print("Saved:", left_wing_path, left_wing_crop.size)

# 4. Extract Right Wing (pivot at left edge)
# From body_cx - 8 to cw
right_wing_crop = cropped_bf.crop((body_cx - 8, 0, cw, ch))
right_wing_path = os.path.join(PUBLIC_BF, 'butterfly_wing_right.png')
right_wing_crop.save(right_wing_path, 'PNG')
print("Saved:", right_wing_path, right_wing_crop.size)

# -----------------------------------------------------------------------------
# 2. Isolate Storybook Backdrop with Clean Alpha Transparency
# -----------------------------------------------------------------------------
book_im = Image.open(os.path.join(PUBLIC_SB, 'book_backdrop.png')).convert('RGBA')
bw, bh = book_im.size

mask = Image.new('L', (bw, bh), 0)
d = ImageDraw.Draw(mask)

book_poly = [
    # Top edge
    (54, 76), (490, 84), (512, 90), (534, 84), (968, 76),
    # Top-right corner
    (976, 80), (981, 88), (983, 98),
    # Right edge
    (983, 592),
    # Bottom-right corner
    (981, 602), (976, 608), (966, 610),
    # Bottom edge
    (534, 610), (512, 616), (490, 610), (54, 610),
    # Bottom-left corner
    (44, 608), (38, 600), (36, 590),
    # Left edge
    (38, 98), (40, 88), (46, 80)
]

d.polygon(book_poly, fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(1.2))
book_im.putalpha(mask)

# Save updated book_backdrop.png directly into public/storybook/
book_path = os.path.join(PUBLIC_SB, 'book_backdrop.png')
book_im.save(book_path, 'PNG')
print("Updated book_backdrop.png with alpha transparency:", book_path)
print("All sprite extractions and transparency updates completed successfully!")

