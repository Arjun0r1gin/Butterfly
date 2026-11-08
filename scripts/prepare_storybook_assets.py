"""
BUTTERFLY — Storybook Asset Extraction & Preparation
Extracts high-resolution components from the approved reference:
- book_backdrop.png: Leather cover, brass corners, layered deckled page stack, lawn
- page_template_left.png: Aged cream parchment with left floral border
- page_template_right.png: Aged cream parchment with right floral border
- spiral_binding.png: Golden double spiral rings with transparent background
"""

import os
from PIL import Image, ImageFilter, ImageOps, ImageDraw

REF_PATH = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3/storybook_reference.jpg'
OUT_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/storybook'
os.makedirs(OUT_DIR, exist_ok=True)

ref = Image.open(REF_PATH).convert('RGBA')
w, h = ref.size
print(f"Loaded storybook reference: {w}x{h}")

# 1. Base Book Backdrop: Save full reference as high-fidelity backdrop
ref.save(os.path.join(OUT_DIR, 'book_backdrop.png'), 'PNG')
print("Saved: book_backdrop.png")

# 2. Extract Left Page Template (x: 68..508, y: 72..588)
left_box = (68, 72, 508, 588)
left_page = ref.crop(left_box)
left_page.save(os.path.join(OUT_DIR, 'page_template_left.png'), 'PNG')
print("Saved: page_template_left.png", left_page.size)

# 3. Extract Right Page Template (x: 516..956, y: 72..588)
right_box = (516, 72, 956, 588)
right_page = ref.crop(right_box)
right_page.save(os.path.join(OUT_DIR, 'page_template_right.png'), 'PNG')
print("Saved: page_template_right.png", right_page.size)

# 4. Extract Golden Spiral Spine Rings (x: 470..554, y: 80..580)
# Isolate rings with alpha transparency
spine_box = (470, 80, 554, 580)
spine_crop = ref.crop(spine_box)
sw, sh = spine_crop.size

spine_alpha = Image.new('RGBA', (sw, sh), (0, 0, 0, 0))
sp_pixels = spine_crop.load()
sa_pixels = spine_alpha.load()

for y in range(sh):
    for x in range(sw):
        r, g, b, _ = sp_pixels[x, y]
        # Rings are golden/brass: high red & green, low blue (r > 140, g > 80, b < 60) or dark metallic shadows (r < 80, g < 50, b < 40)
        # Paper background is cream (r > 230, g > 200, b > 150)
        is_paper = (r > 215 and g > 185 and b > 135)
        if not is_paper:
            # Golden metallic highlight or dark hole/shadow
            lum = 0.299*r + 0.587*g + 0.114*b
            if lum < 190 or (r > 160 and b < 80):
                sa_pixels[x, y] = (r, g, b, 255)

spine_alpha = spine_alpha.filter(ImageFilter.GaussianBlur(0.5))
spine_alpha.save(os.path.join(OUT_DIR, 'spiral_binding.png'), 'PNG')
print("Saved: spiral_binding.png", spine_alpha.size)
print("Storybook asset preparation complete!")

