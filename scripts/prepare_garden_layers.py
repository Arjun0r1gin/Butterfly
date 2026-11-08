"""
BUTTERFLY — Garden Scene Layer Extraction & Processing
Separates the master watercolor reference into 7 distinct living depth layers:
- Layer 1: Background Sky & Glowing Sunset
- Layer 2: Watercolor Clouds (High and Low)
- Layer 3: Distant Hills, Horizon Line & Radiant Pink Tree
- Layer 4: Midground Rolling Meadow & Right Trees
- Layer 5: Midground Mossy Boulders & Coral Shrubs
- Layer 6: Foreground Wildflowers & Mossy Rock
- Layer 7: Left Framing Ancient Tree & Overhanging Blossom Canopy
"""

from PIL import Image, ImageFilter, ImageOps, ImageDraw, ImageEnhance
import os
import math

ref_path = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3/garden_reference.jpg'
out_dir = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/garden'
os.makedirs(out_dir, exist_ok=True)

ref = Image.open(ref_path).convert('RGBA')
w, h = ref.size
print(f"Loaded reference image: {w}x{h}")

# ==============================================================================
# 1. LAYER 7: Framing Ancient Tree & Overhanging Floral Canopy
# ==============================================================================
print("Extracting Layer 7: Framing Tree...")
tree_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
tree_pixels = tree_img.load()
ref_pixels = ref.load()

# Analyze sky color baseline at each y
sky_baseline = {}
for y in range(0, 300):
    samples = []
    for x in range(350, 750):
        if abs(x - 485) < 35 and abs(y - 280) < 35:
            continue
        r, g, b, _ = ref_pixels[x, y]
        # Skip dark leaves, green leaves, and pink blossoms
        is_leaf = (g > r * 0.85 and g > 130 and r < 180) or (r < 110 and g < 110)
        is_pink = (r > 180 and g < 140 and b > 90)
        if not is_leaf and not is_pink:
            samples.append((r, g, b))
    if samples:
        sky_baseline[y] = (
            sum(s[0] for s in samples) / len(samples),
            sum(s[1] for s in samples) / len(samples),
            sum(s[2] for s in samples) / len(samples),
        )
    else:
        sky_baseline[y] = (240, 150, 80)

# Build tree alpha mask
tree_mask = Image.new('L', (w, h), 0)
mask_pixels = tree_mask.load()

for y in range(h):
    for x in range(w):
        # Tree occupies left side and top canopy
        is_trunk_zone = (x < 240 and y < 450)
        is_canopy_zone = (y < 190 and x < 780)
        is_top_right_foliage = (y < 95 and x > 840)

        if is_trunk_zone or is_canopy_zone or is_top_right_foliage:
            r, g, b, _ = ref_pixels[x, y]
            
            # For y < 270, we are against the sky
            if y < 270:
                s_r, s_g, s_b = sky_baseline.get(y, (240, 150, 80))
                # Compute chromatic and luminance distance to sky
                lum = 0.299 * r + 0.587 * g + 0.114 * b
                sky_lum = 0.299 * s_r + 0.587 * s_g + 0.114 * s_b
                
                # Check if it's a green leaf
                is_green = (g > r * 0.8 and g > 70 and r < 210) or (g > 100 and b < 60)
                # Check if it's a pink blossom
                is_pink = (r > 170 and g < 145 and b > 110) or (r > 210 and g < 160 and b > 140)
                # Check if it's bark/branch (darker)
                is_bark = (lum < sky_lum - 35)
                
                if is_green or is_pink or is_bark:
                    diff = math.sqrt((r - s_r)**2 + (g - s_g)**2 + (b - s_b)**2)
                    alpha = min(255, int(diff * 2.8))
                    if lum < 120:
                        alpha = 255
                    elif is_pink and r > 180:
                        alpha = 255
                    mask_pixels[x, y] = alpha
                else:
                    mask_pixels[x, y] = 0
            else:
                # Lower trunk below y=270: definite tree if x < 210 and not foreground flower
                if x < 180 and y < 420:
                    mask_pixels[x, y] = 255
                elif x < 230 and y < 350:
                    mask_pixels[x, y] = int(255 * max(0, 1 - (x - 180) / 50))

# Clean and smooth tree mask
tree_mask = tree_mask.filter(ImageFilter.MedianFilter(3))
tree_mask = tree_mask.filter(ImageFilter.GaussianBlur(0.8))

for y in range(h):
    for x in range(w):
        a = tree_mask.getpixel((x, y))
        if a > 15:
            r, g, b, _ = ref_pixels[x, y]
            tree_pixels[x, y] = (r, g, b, a)

tree_img.save(os.path.join(out_dir, 'layer_7_framing_tree.png'), 'PNG')
print("Saved Layer 7: layer_7_framing_tree.png")

# ==============================================================================
# 2. LAYER 6: Foreground Wildflower Meadow & Mossy Rock
# ==============================================================================
print("Extracting Layer 6: Foreground Flora...")
fg_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
fg_pixels = fg_img.load()
fg_mask = Image.new('L', (w, h), 0)
fg_mask_pixels = fg_mask.load()

# The foreground meadow begins around y=360 on left, dips to y=430 in center, rises to y=380 on right
for y in range(h):
    for x in range(w):
        # Calculate meadow boundary baseline
        # Left has tall flowers up to y=350
        # Center meadow path is open, foreground flowers sit below y=440
        # Right has flowers up to y=370
        if x < 350:
            top_y = 350 + (x / 350.0) * 80
        elif x > 650:
            top_y = 430 - ((x - 650) / (w - 650.0)) * 60
        else:
            top_y = 430 + math.sin((x - 350) / 300.0 * math.pi) * 20

        if y >= top_y:
            blend_dist = 25.0
            factor = min(1.0, (y - top_y) / blend_dist)
            fg_mask_pixels[x, y] = int(factor * 255)

fg_mask = fg_mask.filter(ImageFilter.GaussianBlur(1.5))
for y in range(h):
    for x in range(w):
        a = fg_mask.getpixel((x, y))
        if a > 0:
            r, g, b, _ = ref_pixels[x, y]
            fg_pixels[x, y] = (r, g, b, a)

fg_img.save(os.path.join(out_dir, 'layer_6_foreground_flora.png'), 'PNG')
print("Saved Layer 6: layer_6_foreground_flora.png")

# ==============================================================================
# 3. LAYER 5: Midground Rocks & Shrubs
# ==============================================================================
print("Extracting Layer 5: Midground Rocks & Shrubs...")
rocks_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
rocks_pixels = rocks_img.load()
rocks_mask = Image.new('L', (w, h), 0)
rm_pixels = rocks_mask.load()

# Boulders and coral shrubs on right slope: x in [720, 930], y in [260, 380]
for y in range(250, 400):
    for x in range(710, 940):
        # Elliptical bounds around the two boulders
        cx1, cy1, r1 = 800, 305, 55
        cx2, cy2, r2 = 880, 290, 45
        d1 = math.sqrt(((x - cx1)/1.4)**2 + (y - cy1)**2)
        d2 = math.sqrt(((x - cx2)/1.3)**2 + (y - cy2)**2)
        if d1 < r1 or d2 < r2:
            rm_pixels[x, y] = 255

rocks_mask = rocks_mask.filter(ImageFilter.GaussianBlur(3.0))
for y in range(h):
    for x in range(w):
        a = rocks_mask.getpixel((x, y))
        if a > 0:
            r, g, b, _ = ref_pixels[x, y]
            rocks_pixels[x, y] = (r, g, b, a)

rocks_img.save(os.path.join(out_dir, 'layer_5_midground_rocks.png'), 'PNG')
print("Saved Layer 5: layer_5_midground_rocks.png")

# ==============================================================================
# 4. LAYER 4: Midground Meadow Pasture & Right Trees
# ==============================================================================
print("Extracting Layer 4: Midground Meadow...")
mid_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
mid_pixels = mid_img.load()
mid_mask = Image.new('L', (w, h), 0)
mm_pixels = mid_mask.load()

# Horizon baseline across x: y from ~260 to 320
for y in range(h):
    for x in range(w):
        # Horizon contour
        if x < 400:
            horizon_y = 295
        elif x < 550:
            horizon_y = 285 # dip near sun
        elif x < 700:
            horizon_y = 280
        else:
            # Rises up on the right hill and canopy trees
            horizon_y = 200 + (1.0 - (x - 700) / (w - 700.0)) * 60

        if y >= horizon_y:
            blend_dist = 12.0
            factor = min(1.0, (y - horizon_y) / blend_dist)
            mm_pixels[x, y] = int(factor * 255)

mid_mask = mid_mask.filter(ImageFilter.GaussianBlur(2.0))
for y in range(h):
    for x in range(w):
        a = mid_mask.getpixel((x, y))
        if a > 0:
            r, g, b, _ = ref_pixels[x, y]
            mid_pixels[x, y] = (r, g, b, a)

mid_img.save(os.path.join(out_dir, 'layer_4_midground_meadow.png'), 'PNG')
print("Saved Layer 4: layer_4_midground_meadow.png")

# ==============================================================================
# 5. LAYER 3: Distant Hills & Radiant Pink Tree
# ==============================================================================
print("Extracting Layer 3: Distant Hills & Pink Tree...")
hills_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
hills_pixels = hills_img.load()
hills_mask = Image.new('L', (w, h), 0)
hm_pixels = hills_mask.load()

for y in range(240, 360):
    for x in range(150, 750):
        # Distant purple hills and pink tree at x=550, y=290
        d_pink = math.sqrt(((x - 565)/1.6)**2 + (y - 290)**2)
        if d_pink < 35: # Pink tree
            hm_pixels[x, y] = 255
        elif y >= 270 and y <= 330:
            # Distant ridge silhouette
            hm_pixels[x, y] = 220

hills_mask = hills_mask.filter(ImageFilter.GaussianBlur(2.0))
for y in range(h):
    for x in range(w):
        a = hills_mask.getpixel((x, y))
        if a > 0:
            r, g, b, _ = ref_pixels[x, y]
            hills_pixels[x, y] = (r, g, b, a)

hills_img.save(os.path.join(out_dir, 'layer_3_distant_hills.png'), 'PNG')
print("Saved Layer 3: layer_3_distant_hills.png")

# ==============================================================================
# 6. LAYER 2: Watercolor Clouds (High and Low)
# ==============================================================================
print("Extracting Layer 2: Watercolor Clouds...")
clouds_high = Image.new('RGBA', (w, h), (0, 0, 0, 0))
ch_pixels = clouds_high.load()
clouds_low = Image.new('RGBA', (w, h), (0, 0, 0, 0))
cl_pixels = clouds_low.load()

for y in range(20, 230):
    for x in range(150, 950):
        r, g, b, _ = ref_pixels[x, y]
        # Clouds have soft peach/white/lavender tones different from smooth orange sky
        s_r, s_g, s_b = sky_baseline.get(y, (240, 150, 80))
        lum_diff = abs((r + g + b) - (s_r + s_g + s_b))
        
        # High cirrus clouds (y < 120, x in 550..950)
        if y < 120 and x > 500:
            if lum_diff > 30 and (r > 200 or b > 140):
                alpha = min(200, int(lum_diff * 1.5))
                ch_pixels[x, y] = (r, g, b, alpha)
        
        # Low warm clouds (y in 120..220, x in 250..850)
        elif y >= 120:
            if lum_diff > 25:
                alpha = min(220, int(lum_diff * 1.8))
                cl_pixels[x, y] = (r, g, b, alpha)

clouds_high = clouds_high.filter(ImageFilter.GaussianBlur(1.0))
clouds_low = clouds_low.filter(ImageFilter.GaussianBlur(1.2))
clouds_high.save(os.path.join(out_dir, 'layer_2_clouds_high.png'), 'PNG')
clouds_low.save(os.path.join(out_dir, 'layer_2_clouds_low.png'), 'PNG')
print("Saved Layer 2 clouds")

# ==============================================================================
# 7. LAYER 1: Background Sky & Glowing Sunset
# ==============================================================================
print("Creating Layer 1: Sky & Glowing Sunset...")
sky_img = Image.new('RGBA', (w, h), (0, 0, 0, 255))
sky_pixels = sky_img.load()

# Create clean seamless sunset gradient with warm glowing sun at (485, 280)
sun_x, sun_y = 485, 280

for y in range(h):
    for x in range(w):
        # Vertical gradient
        t = y / float(h)
        # Gradient colors:
        # Top (t=0): soft coral/lavender (215, 160, 165)
        # Mid-high (t=0.25): peach/amber (250, 175, 115)
        # Mid-low (t=0.45): fiery orange (255, 135, 45)
        # Horizon (t=0.55): golden yellow (255, 195, 75)
        # Lower ground fill (t > 0.6): warm earth undertone (80, 95, 30)
        if t < 0.25:
            f = t / 0.25
            r = 215 + f * (250 - 215)
            g = 160 + f * (175 - 160)
            b = 165 + f * (115 - 165)
        elif t < 0.48:
            f = (t - 0.25) / (0.48 - 0.25)
            r = 250 + f * (255 - 250)
            g = 175 + f * (135 - 175)
            b = 115 + f * (45 - 115)
        elif t < 0.60:
            f = (t - 0.48) / (0.60 - 0.48)
            r = 255 + f * (255 - 255)
            g = 135 + f * (195 - 135)
            b = 45 + f * (75 - 45)
        else:
            f = (t - 0.60) / 0.40
            r = 255 - f * 175
            g = 195 - f * 100
            b = 75 - f * 45

        # Radial Sun Glow at (485, 280)
        dist_sun = math.sqrt((x - sun_x)**2 + (y - sun_y)**2)
        if dist_sun < 240:
            # Exponential glow falloff
            glow = math.exp(-dist_sun / 55.0)
            r = min(255, r + glow * 80)
            g = min(255, g + glow * 70)
            b = min(255, b + glow * 40)
            
            # Sun disk
            if dist_sun < 18:
                r = 255
                g = 250
                b = 225

        sky_pixels[x, y] = (int(r), int(g), int(b), 255)

sky_img = sky_img.filter(ImageFilter.GaussianBlur(1.0))
sky_img.save(os.path.join(out_dir, 'layer_1_sky.png'), 'PNG')
print("Saved Layer 1: layer_1_sky.png")
print("All layers extracted successfully!")

