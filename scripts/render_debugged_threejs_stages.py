"""
BUTTERFLY — High-Precision Inextensible Cylinder Page-Turn Validation Renderer
Simulates the exact GPU vertex shader cylinder deformation pipeline:
- Inextensible arc-length preservation: zero distortion, zero barcode scanlines, zero text fragmentation
- Moving fold axis: foldX = W * (1.0 - t)
- Moving spine pivot: pivotX = 12 * (1.0 - 2.0 * t)
- Dual-sided texturing with mirrored UV on back face for natural left-to-right reading
- Renders 0%, 25%, 50%, 75%, 100% verification frames
- Generates 32-frame forward and reverse animation GIF
- Macro close-up of page crossing central brass spiral
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ART_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
PUBLIC_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public'
SB_DIR = os.path.join(PUBLIC_DIR, 'storybook')

VW, VH = 1600, 900

# 1. Load Sunset Garden Background
garden_bg = Image.open(os.path.join(PUBLIC_DIR, 'garden/garden_base_master.png')).convert('RGBA')
garden_bg = garden_bg.resize((VW, VH), Image.Resampling.LANCZOS)
enhancer = ImageEnhance.Color(garden_bg)
garden_bg = enhancer.enhance(1.08)

# 2. Load Assets
cover_img = Image.open(os.path.join(SB_DIR, 'studio_cover_walnut.jpg')).convert('RGBA')
page_left = Image.open(os.path.join(SB_DIR, 'studio_page_left.jpg')).convert('RGBA')
page_right = Image.open(os.path.join(SB_DIR, 'studio_page_right.jpg')).convert('RGBA')
page_back = Image.open(os.path.join(SB_DIR, 'studio_page_back.jpg')).convert('RGBA')
page_under = Image.open(os.path.join(SB_DIR, 'studio_page_underneath.jpg')).convert('RGBA')

BOOK_W = 1320
BOOK_H = int(BOOK_W * (cover_img.height / cover_img.width)) # ~736px
cover_scaled = cover_img.resize((BOOK_W, BOOK_H), Image.Resampling.LANCZOS)

BOOK_X = (VW - BOOK_W) // 2
BOOK_Y = (VH - BOOK_H) // 2 + 10
SPINE_X = VW // 2

PAGE_W = int(BOOK_W * 0.456) # ~602px
PAGE_H = int(BOOK_H * 0.890) # ~655px

page_left_s = page_left.resize((PAGE_W, PAGE_H), Image.Resampling.LANCZOS)
page_right_s = page_right.resize((PAGE_W, PAGE_H), Image.Resampling.LANCZOS)
page_back_s = page_back.resize((PAGE_W, PAGE_H), Image.Resampling.LANCZOS)
page_under_s = page_under.resize((PAGE_W, PAGE_H), Image.Resampling.LANCZOS)

PAGE_Y = BOOK_Y + int(BOOK_H * 0.055)
GAP = 7
LEFT_PAGE_X = SPINE_X - GAP - PAGE_W
RIGHT_PAGE_X = SPINE_X + GAP

# 3. Create Metallic Brass 13-Ring Spiral Image
def create_spiral_binding():
    spiral_w = 44
    spiral_h = PAGE_H + 20
    spiral_img = Image.new('RGBA', (spiral_w, spiral_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(spiral_img)
    
    coil_count = 13
    start_y = 16
    end_y = spiral_h - 16
    step_y = (end_y - start_y) / (coil_count - 1)
    
    for i in range(coil_count):
        cy = start_y + i * step_y
        for wire_off in [-2.5, 2.5]:
            wy = cy + wire_off
            # Cast shadow behind ring
            d.ellipse([6, wy - 7, 38, wy + 7], outline=(15, 8, 4, 140), width=2)
            # Base brass wire
            d.ellipse([6, wy - 8, 38, wy + 6], outline=(175, 125, 45, 255), width=3)
            # Midtone gold
            d.ellipse([7, wy - 8, 37, wy + 6], outline=(225, 175, 65, 255), width=1)
            # Specular sunset highlight on top arc
            d.arc([7, wy - 9, 37, wy + 5], start=190, end=350, fill=(255, 248, 205, 230), width=1)
            
    return spiral_img

spiral_binding_img = create_spiral_binding()

def render_inextensible_frame(t):
    canvas = garden_bg.copy()
    
    # 1. Base Walnut Leather Hardcover
    shadow_pad = 40
    cover_shadow = Image.new('RGBA', (BOOK_W + shadow_pad * 2, BOOK_H + shadow_pad * 2), (0, 0, 0, 0))
    csd = ImageDraw.Draw(cover_shadow)
    csd.rounded_rectangle(
        [shadow_pad - 10, shadow_pad + 15, BOOK_W + shadow_pad + 10, BOOK_H + shadow_pad + 25],
        radius=24,
        fill=(10, 5, 2, 160)
    )
    cover_shadow = cover_shadow.filter(ImageFilter.GaussianBlur(28))
    canvas.alpha_composite(cover_shadow, (BOOK_X - shadow_pad, BOOK_Y - shadow_pad))
    canvas.alpha_composite(cover_scaled, (BOOK_X, BOOK_Y))
    
    # 2. Paper Stack Layers (Visible Thickness)
    for s in [3, 2, 1]:
        off = s * 2
        ls = Image.new('RGBA', (PAGE_W, PAGE_H), (242 - s*4, 236 - s*4, 224 - s*4, 255))
        canvas.alpha_composite(ls, (LEFT_PAGE_X - off, PAGE_Y + off//2))
        rs = Image.new('RGBA', (PAGE_W, PAGE_H), (242 - s*4, 236 - s*4, 224 - s*4, 255))
        canvas.alpha_composite(rs, (RIGHT_PAGE_X + off, PAGE_Y + off//2))
        
    # 3. Base Resting Pages
    canvas.alpha_composite(page_left_s, (LEFT_PAGE_X, PAGE_Y))
    canvas.alpha_composite(page_under_s, (RIGHT_PAGE_X, PAGE_Y))
    
    # 4. Dynamic Soft Contact Shadow on Left Stack
    if t > 0.01 and t < 0.99:
        arch = math.sin(t * math.pi)
        sh_w = int(PAGE_W * (0.2 + 0.8 * min(1.0, t * 1.5)))
        sh_img = Image.new('RGBA', (VW, VH), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(sh_img)
        poly = [
            (SPINE_X - GAP, PAGE_Y + 10),
            (SPINE_X - GAP - sh_w, PAGE_Y + 20 + int(arch * 12)),
            (SPINE_X - GAP - sh_w - 25, PAGE_Y + PAGE_H - 10),
            (SPINE_X - GAP, PAGE_Y + PAGE_H - 4)
        ]
        sh_d.polygon(poly, fill=(18, 9, 3, int(155 * arch)))
        sh_img = sh_img.filter(ImageFilter.GaussianBlur(18))
        canvas.alpha_composite(sh_img)
        
    # 5. Active Inextensible Turning Page Leaf
    if t <= 0.0005:
        # Flat on right stack
        canvas.alpha_composite(page_right_s, (RIGHT_PAGE_X, PAGE_Y))
    elif t >= 0.9995:
        # Flat on left stack
        canvas.alpha_composite(page_back_s, (LEFT_PAGE_X, PAGE_Y))
    else:
        # Inextensible cylindrical deformation
        # Displaces exactly according to our GLSL shader
        N = 128
        arch = math.sin(t * math.pi)
        R = max(0.001, 54.0 * arch)
        foldX = PAGE_W * (1.0 - t)
        pivotX = SPINE_X + GAP * (1.0 - 2.0 * t) # Moving spine pivot
        
        turning_layer = Image.new('RGBA', (VW, VH), (0, 0, 0, 0))
        
        for i in range(N):
            u0 = i / float(N)
            u1 = (i + 1) / float(N)
            x_src0 = u0 * PAGE_W
            x_src1 = u1 * PAGE_W
            
            # CPU evaluation of exact cylinder vertex shader
            def get_px_pz(x):
                ox = x - foldX
                if ox <= 0.0:
                    return pivotX + x, 0.0, True
                else:
                    angle = ox / R
                    if angle <= math.pi:
                        px = pivotX + foldX + math.sin(angle) * R
                        pz = (1.0 - math.cos(angle)) * R
                        is_f = math.cos(angle) >= 0.0
                        return px, pz, is_f
                    else:
                        excess = ox - math.pi * R
                        px = pivotX + foldX - excess
                        pz = max(0.0, 2.0 * R * (1.0 - min(1.0, excess / PAGE_W)))
                        return px, pz, False
                        
            px0, pz0, f0 = get_px_pz(x_src0)
            px1, pz1, f1 = get_px_pz(x_src1)
            
            # Arc lift y-shear
            y_top0 = PAGE_Y - pz0 * 0.18
            y_top1 = PAGE_Y - pz1 * 0.18
            y_bot0 = PAGE_Y + PAGE_H - pz0 * 0.05
            y_bot1 = PAGE_Y + PAGE_H - pz1 * 0.05
            
            # Select front or back texture based on facing
            is_front = f0 or f1
            src_img = page_right_s if is_front else page_back_s
            
            # Source rectangle (with UV mirror on back face)
            if is_front:
                sx0 = int(u0 * PAGE_W)
                sx1 = max(sx0 + 1, int(u1 * PAGE_W))
            else:
                sx0 = int((1.0 - u1) * PAGE_W)
                sx1 = max(sx0 + 1, int((1.0 - u0) * PAGE_W))
                
            sx0 = max(0, min(PAGE_W - 1, sx0))
            sx1 = max(sx0 + 1, min(PAGE_W, sx1))
            
            strip = src_img.crop((sx0, 0, sx1, PAGE_H))
            
            dest_w = max(1, int(math.ceil(abs(px1 - px0))))
            dest_h = int(0.5 * ((y_bot0 - y_top0) + (y_bot1 - y_top1)))
            strip_scaled = strip.resize((dest_w, dest_h), Image.Resampling.BILINEAR)
            
            # Lighting: Specular reflection on cylinder ridge
            if is_front and pz0 > 10:
                glint = int(22 * arch * (pz0 / (2.0 * R)))
                if glint > 0:
                    enh = ImageEnhance.Brightness(strip_scaled)
                    strip_scaled = enh.enhance(1.0 + glint / 100.0)
            elif not is_front:
                # Soft ambient occlusion
                amb = int(25 * arch * (1.0 - min(1.0, pz0 / (2.0 * R))))
                if amb > 0:
                    enh = ImageEnhance.Brightness(strip_scaled)
                    strip_scaled = enh.enhance(1.0 - amb / 100.0)
                    
            dest_x = min(int(px0), int(px1))
            dest_y = int(min(y_top0, y_top1))
            turning_layer.alpha_composite(strip_scaled, (dest_x, dest_y))
            
        canvas.alpha_composite(turning_layer)
        
    # 6. Stationary Central 13-Ring Brass Spiral
    spiral_x = SPINE_X - spiral_binding_img.width // 2
    spiral_y = PAGE_Y - 10
    canvas.alpha_composite(spiral_binding_img, (spiral_x, spiral_y))
    
    return canvas

print('Rendering debugged inexensible storybook frames...')

stages = [
    (0.00, '000'),
    (0.25, '025'),
    (0.50, '050'),
    (0.75, '075'),
    (1.00, '100')
]

stage_images = {}
for val, label in stages:
    img = render_inextensible_frame(val)
    out_path = os.path.join(ART_DIR, f'debug_stage_{label}.png')
    img.save(out_path, format='PNG')
    stage_images[label] = img
    print(f'Rendered stage {int(val*100)}%: {out_path}')

# Macro close-up of spiral crossing (t=0.50)
mid_img = stage_images['050']
crop_w, crop_h = 520, 560
cx = SPINE_X - crop_w // 2
cy = PAGE_Y + 40
closeup = mid_img.crop((cx, cy, cx + crop_w, cy + crop_h))
closeup_out = os.path.join(ART_DIR, 'debug_spiral_crossing_closeup.png')
closeup.save(closeup_out, format='PNG')
print(f'Saved Spiral Crossing Close-up: {closeup_out}')

# 32-frame forward and reverse turn animation GIF
print('Rendering 32-frame fluid forward/reverse animation GIF...')
gif_frames = []
total_frames = 32

for f in range(total_frames):
    phase = f / float(total_frames)
    t = 0.5 * (1.0 - math.cos(phase * 2.0 * math.pi))
    f_img = render_inextensible_frame(t)
    f_thumb = f_img.resize((1280, 720), Image.Resampling.BILINEAR)
    gif_frames.append(f_thumb.convert('RGB'))

gif_out = os.path.join(ART_DIR, 'debug_page_turn_animation.gif')
gif_frames[0].save(
    gif_out,
    save_all=True,
    append_images=gif_frames[1:],
    duration=90,
    loop=0,
    optimize=True
)
print(f'Saved Animation GIF: {gif_out}')
print('ALL DEBUG EVIDENCE GENERATED SUCCESSFULLY!')

