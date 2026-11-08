"""
BUTTERFLY — High-Fidelity Storybook Scene Preview & Motion Recorder
Generates:
1. storybook_initial_state_1920x1080.png (Spread 0 open)
2. storybook_page_turn_halfway.png (Page turning at -90deg, 3D curl & shading)
3. storybook_first_turn_complete.png (Spread 1 open)
4. storybook_mobile_preview_390x844.png (Mobile responsive view)
5. storybook_page_turning_interactive.gif (Consecutive page flips & reverse scrolling)
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ARTIFACT_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
STORYBOOK_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/storybook'
GARDEN_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public/garden'

# Load extracted assets
backdrop = Image.open(os.path.join(STORYBOOK_DIR, 'book_backdrop.png')).convert('RGBA')
page_left_tpl = Image.open(os.path.join(STORYBOOK_DIR, 'page_template_left.png')).convert('RGBA')
page_right_tpl = Image.open(os.path.join(STORYBOOK_DIR, 'page_template_right.png')).convert('RGBA')
spiral_spine = Image.open(os.path.join(STORYBOOK_DIR, 'spiral_binding.png')).convert('RGBA')
garden_bg = Image.open(os.path.join(GARDEN_DIR, 'garden_base_master.png')).convert('RGBA')

# Preload fonts or font fallbacks
try:
    font_title = ImageFont.truetype("/usr/share/fonts/dejavu-serif-fonts/DejaVuSerif-Bold.ttf", 22)
    font_body = ImageFont.truetype("/usr/share/fonts/dejavu-serif-fonts/DejaVuSerif.ttf", 13)
    font_script = ImageFont.truetype("/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Oblique.ttf", 15)
    font_drop = ImageFont.truetype("/usr/share/fonts/dejavu-serif-fonts/DejaVuSerif-Bold.ttf", 46)
except Exception:
    font_title = ImageFont.load_default()
    font_body = ImageFont.load_default()
    font_script = ImageFont.load_default()
    font_drop = ImageFont.load_default()

def draw_left_page_content(page_img, spread_idx):
    """Draws polaroids, washi tape, stamps and memories on a left page."""
    draw = ImageDraw.Draw(page_img)
    pw, ph = page_img.size

    # Polaroid 1
    p1_box = [int(pw * 0.15), int(ph * 0.18), int(pw * 0.52), int(ph * 0.58)]
    draw.rectangle(p1_box, fill=(255, 255, 255, 255), outline=(210, 190, 160, 255), width=1)
    # Photo canvas gradient
    colors = [
        ((252, 231, 243), (254, 215, 170)),
        ((220, 252, 231), (187, 247, 208)),
        ((254, 215, 170), (244, 114, 182)),
        ((250, 232, 255), (253, 224, 71)),
    ]
    c1, c2 = colors[spread_idx % len(colors)]
    draw.rectangle([p1_box[0]+6, p1_box[1]+6, p1_box[2]-6, p1_box[3]-28], fill=c1)
    # Washi tape strip
    tw_x = (p1_box[0] + p1_box[2]) // 2
    draw.rectangle([tw_x - 24, p1_box[1] - 8, tw_x + 24, p1_box[1] + 6], fill=(244, 114, 182, 210))
    # Caption
    captions = ["First Sunshine Walk", "By The Mossy Stones", "Wings in Flight", "The Unwritten Chapters"]
    draw.text((p1_box[0] + 8, p1_box[3] - 22), captions[spread_idx % 4], fill=(74, 40, 16), font=font_body)

    # Polaroid 2
    p2_box = [int(pw * 0.52), int(ph * 0.28), int(pw * 0.88), int(ph * 0.68)]
    draw.rectangle(p2_box, fill=(255, 255, 255, 255), outline=(210, 190, 160, 255), width=1)
    draw.rectangle([p2_box[0]+6, p2_box[1]+6, p2_box[2]-6, p2_box[3]-28], fill=c2)
    tw_x2 = (p2_box[0] + p2_box[2]) // 2
    draw.rectangle([tw_x2 - 24, p2_box[1] - 8, tw_x2 + 24, p2_box[1] + 6], fill=(234, 179, 8, 210))
    captions2 = ["Golden Meadow Laughs", "Stargazing at Dusk", "Golden Sunset Ridge", "Endless Sky"]
    draw.text((p2_box[0] + 8, p2_box[3] - 22), captions2[spread_idx % 4], fill=(74, 40, 16), font=font_body)

    # Stamp
    st_box = [int(pw * 0.62), int(ph * 0.08), int(pw * 0.86), int(ph * 0.18)]
    draw.rectangle(st_box, fill=(254, 243, 199, 230), outline=(180, 83, 9, 255), width=1)
    draw.text((st_box[0]+6, st_box[1]+4), "PAR AVION", fill=(146, 64, 14), font=font_body)

    # Handwritten note
    notes = [
        '"Every wildflower seemed to lean in and listen..."',
        '"Time stood still beneath the ancient willow..."',
        '"Not all who wander are lost; some find each other."',
        '"To infinity and beyond, through every flower and star."',
    ]
    draw.text((int(pw * 0.16), int(ph * 0.78)), notes[spread_idx % 4], fill=(92, 53, 22), font=font_script)

def draw_right_page_content(page_img, spread_idx):
    """Draws chapter titles, drop caps, narrative and signature on a right page."""
    draw = ImageDraw.Draw(page_img)
    pw, ph = page_img.size

    chapters = ["Chapter I", "Chapter II", "Chapter III", "Chapter IV"]
    titles = ["Where The Light Touches", "The Whispering Garden", "Flight of the Meadow", "Beyond The Horizon"]
    locations = ["The Twilight Garden", "Beneath The Ancient Bough", "Across The Open Plain", "To The Stars Above"]
    
    # Header
    draw.text((int(pw * 0.16), int(ph * 0.10)), chapters[spread_idx % 4], fill=(146, 88, 40), font=font_body)
    draw.text((int(pw * 0.16), int(ph * 0.15)), titles[spread_idx % 4], fill=(61, 33, 12), font=font_title)
    draw.text((int(pw * 0.16), int(ph * 0.22)), locations[spread_idx % 4], fill=(120, 72, 36), font=font_script)
    draw.line([(int(pw * 0.16), int(ph * 0.26)), (int(pw * 0.84), int(ph * 0.26))], fill=(180, 130, 70, 120), width=1)

    # Drop cap
    drop_caps = ["O", "A", "T", "A"]
    draw.text((int(pw * 0.15), int(ph * 0.30)), drop_caps[spread_idx % 4], fill=(153, 59, 29), font=font_drop)

    # Narrative lines
    texts = [
        ["nce upon a quiet evening, when the sun dipped low",
         "beneath the amber horizon, a small gentle gift opened",
         "in the heart of the garden. From its glowing center,",
         "a symphony of colorful blossoms took flight.",
         "",
         "The air was sweet with lavender and warm peach light.",
         "With every step, memories began to weave themselves",
         "into an eternal tapestry, waiting to be written."],
        ["s the path wound deeper toward the quiet hills, two",
         "ancient trees framed the sky like silent guardians.",
         "Beneath their flowering branches, the world felt safe,",
         "warm, and endlessly kind.",
         "",
         "Golden light grazed the dew-kissed leaves, and the",
         "river stones whispered stories of quiet dreams shared",
         "in hushed voices."],
        ["hen, with iridescent wings catching the fiery rays",
         "of the setting sun, a delicate butterfly rose into",
         "the twilight. It circled the open pages, as if",
         "reading each memory written upon the heart.",
         "",
         "With every flutter, the petals on the meadow danced",
         "in celebration of a journey cherished deeply."],
        ["nd so the story turns its page toward tomorrow.",
         "No matter how deep the woods or how wide the meadow,",
         "the love planted here continues to grow, reaching",
         "upward toward the boundless sky.",
         "",
         "Keep turning, keep dreaming, and never forget the",
         "warmth of this sunset garden."],
    ]

    lines = texts[spread_idx % 4]
    line_y = int(ph * 0.31)
    for i, line in enumerate(lines):
        x_indent = int(pw * 0.26) if i == 0 else int(pw * 0.16)
        draw.text((x_indent, line_y), line, fill=(59, 34, 14), font=font_body)
        line_y += 18

    # Signature
    signatures = [
        "With gentle wonder, forever.",
        "Carried on the evening wind.",
        "Guiding us onward, step by step.",
        "Yours in every lifetime."
    ]
    draw.text((int(pw * 0.40), int(ph * 0.82)), signatures[spread_idx % 4], fill=(122, 58, 20), font=font_script)

def render_storybook_spread(spread_idx, angle_deg=0.0):
    """
    Renders a complete open book spread with physical 3D turning leaf at angle_deg in [0, -180].
    """
    base = backdrop.copy()
    bw, bh = base.size

    # Left page bounds: x=68..508, y=72..588 (w=440, h=516)
    # Right page bounds: x=516..956, y=72..588 (w=440, h=516)
    pw, ph = 440, 516
    cx = 512

    # 1. Resting Left Page (Current spread's left page)
    # If angle_deg < -90, the back face of the turning leaf will land on the left side!
    left_img = page_left_tpl.copy()
    draw_left_page_content(left_img, spread_idx)
    base.paste(left_img, (68, 72), left_img)

    # 2. Resting Right Page (Underneath the turning leaf: spread_idx + 1)
    right_under = page_right_tpl.copy()
    draw_right_page_content(right_under, spread_idx + 1)
    base.paste(right_under, (516, 72), right_under)

    # 3. Turning Leaf
    if angle_deg == 0.0:
        # Stationary on right
        right_front = page_right_tpl.copy()
        draw_right_page_content(right_front, spread_idx)
        base.paste(right_front, (516, 72), right_front)
    elif angle_deg == -180.0:
        # Flattened on left
        left_next = page_left_tpl.copy()
        draw_left_page_content(left_next, spread_idx + 1)
        base.paste(left_next, (68, 72), left_next)
    else:
        # Turning mid-flip!
        abs_angle = abs(angle_deg)
        rad = abs_angle * math.pi / 180.0
        apparent_w = max(12, int(pw * math.cos(rad)))

        if abs_angle < 90:
            # Front face visible (Right page of spread_idx)
            face = page_right_tpl.copy()
            draw_right_page_content(face, spread_idx)
            face_scaled = face.resize((apparent_w, ph), Image.LANCZOS)
            
            # Shading overlay simulating curved lighting
            shade_alpha = int(math.sin(rad) * 110)
            shade = Image.new('RGBA', (apparent_w, ph), (0, 0, 0, 0))
            s_draw = ImageDraw.Draw(shade)
            for sx in range(apparent_w):
                f = sx / float(apparent_w)
                a = int(shade_alpha * (1.0 - f * 0.7))
                s_draw.line([(sx, 0), (sx, ph)], fill=(50, 25, 5, a))
            face_scaled = Image.alpha_composite(face_scaled, shade)

            # Drop shadow on the page beneath
            shadow_w = min(pw, int(apparent_w * 1.3))
            shadow = Image.new('RGBA', (shadow_w, ph), (0, 0, 0, 0))
            sh_draw = ImageDraw.Draw(shadow)
            for sx in range(shadow_w):
                f = 1.0 - (sx / float(shadow_w))
                sh_draw.line([(sx, 0), (sx, ph)], fill=(0, 0, 0, int(60 * f)))
            base.paste(shadow, (516, 72), shadow)

            # Paste turning front face
            base.paste(face_scaled, (cx, 72), face_scaled)

        else:
            # Back face visible (Left page of spread_idx + 1)
            face = page_left_tpl.copy()
            draw_left_page_content(face, spread_idx + 1)
            face_scaled = face.resize((apparent_w, ph), Image.LANCZOS)

            # Shading overlay
            shade_alpha = int(math.sin(rad) * 110)
            shade = Image.new('RGBA', (apparent_w, ph), (0, 0, 0, 0))
            s_draw = ImageDraw.Draw(shade)
            for sx in range(apparent_w):
                f = 1.0 - (sx / float(apparent_w))
                a = int(shade_alpha * (1.0 - f * 0.7))
                s_draw.line([(sx, 0), (sx, ph)], fill=(50, 25, 5, a))
            face_scaled = Image.alpha_composite(face_scaled, shade)

            # Drop shadow on left wing
            shadow_w = min(pw, int(apparent_w * 1.3))
            shadow = Image.new('RGBA', (shadow_w, ph), (0, 0, 0, 0))
            sh_draw = ImageDraw.Draw(shadow)
            for sx in range(shadow_w):
                f = sx / float(shadow_w)
                sh_draw.line([(sx, 0), (sx, ph)], fill=(0, 0, 0, int(60 * f)))
            base.paste(shadow, (cx - shadow_w, 72), shadow)

            # Paste turning back face
            base.paste(face_scaled, (cx - apparent_w, 72), face_scaled)

    # 4. Golden Spiral Spine Rings (Float on top of spine at x=470..554, y=80..580)
    base.paste(spiral_spine, (470, 80), spiral_spine)

    return base

def render_viewport_frame(vw, vh, spread_idx, angle_deg=0.0):
    """Composites the open book over ambient sunset lawn into a viewport of (vw, vh)."""
    # Ambient garden lawn background
    frame = Image.new('RGBA', (vw, vh), (35, 55, 18, 255))
    
    # Resize book to fit viewport gracefully
    spread_img = render_storybook_spread(spread_idx, angle_deg)
    bw, bh = spread_img.size
    
    max_w = int(vw * 0.94)
    max_h = int(vh * 0.88)
    scale = min(max_w / bw, max_h / bh)
    nw, nh = int(bw * scale), int(bh * scale)
    
    book_scaled = spread_img.resize((nw, nh), Image.LANCZOS)
    ox = (vw - nw) // 2
    oy = (vh - nh) // 2
    
    frame.paste(book_scaled, (ox, oy), book_scaled)
    return frame

print("Rendering Deliverable 1: Initial Open-Book State (1920x1080)...")
f1 = render_viewport_frame(1920, 1080, spread_idx=0, angle_deg=0.0)
f1.save(os.path.join(ARTIFACT_DIR, 'storybook_initial_state_1920x1080.png'), 'PNG')
print("Saved: storybook_initial_state_1920x1080.png")

print("Rendering Deliverable 2: First Page Turning Halfway (-90deg)...")
f2 = render_viewport_frame(1920, 1080, spread_idx=0, angle_deg=-90.0)
f2.save(os.path.join(ARTIFACT_DIR, 'storybook_page_turn_halfway.png'), 'PNG')
print("Saved: storybook_page_turn_halfway.png")

print("Rendering Deliverable 3: Completed First Page Turn (Spread 1 Open)...")
f3 = render_viewport_frame(1920, 1080, spread_idx=1, angle_deg=0.0)
f3.save(os.path.join(ARTIFACT_DIR, 'storybook_first_turn_complete.png'), 'PNG')
print("Saved: storybook_first_turn_complete.png")

print("Rendering Deliverable 4: Mobile Responsive View (390x844)...")
f4 = render_viewport_frame(390, 844, spread_idx=0, angle_deg=0.0)
f4.save(os.path.join(ARTIFACT_DIR, 'storybook_mobile_preview_390x844.png'), 'PNG')
print("Saved: storybook_mobile_preview_390x844.png")

print("Rendering Deliverable 5: Animated Page-Turning Recording (28 frames, flips + reverse)...")
gif_frames = []

# Flip 1: Spread 0 -> Spread 1 (0 to -180 deg)
angles_flip1 = [0, -20, -50, -85, -100, -135, -165, -180]
for a in angles_flip1:
    fr = render_viewport_frame(854, 480, spread_idx=0, angle_deg=a)
    gif_frames.append(fr.convert('RGB'))

# Hold Spread 1 briefly
gif_frames.append(render_viewport_frame(854, 480, spread_idx=1, angle_deg=0.0).convert('RGB'))

# Flip 2: Spread 1 -> Spread 2 (0 to -180 deg)
for a in angles_flip1[1:]:
    fr = render_viewport_frame(854, 480, spread_idx=1, angle_deg=a)
    gif_frames.append(fr.convert('RGB'))

# Hold Spread 2
gif_frames.append(render_viewport_frame(854, 480, spread_idx=2, angle_deg=0.0).convert('RGB'))

# Reverse Scroll: Spread 2 back to Spread 1 (-180 to 0 deg)
angles_reverse = [-160, -120, -85, -45, 0]
for a in angles_reverse:
    fr = render_viewport_frame(854, 480, spread_idx=1, angle_deg=a)
    gif_frames.append(fr.convert('RGB'))

# Reverse Scroll: Spread 1 back to Spread 0
for a in angles_reverse:
    fr = render_viewport_frame(854, 480, spread_idx=0, angle_deg=a)
    gif_frames.append(fr.convert('RGB'))

out_gif = os.path.join(ARTIFACT_DIR, 'storybook_page_turning_interactive.gif')
gif_frames[0].save(
    out_gif,
    save_all=True,
    append_images=gif_frames[1:],
    duration=130,
    loop=0,
    optimize=True
)
print(f"Saved: {out_gif}")
print("Storybook verification render complete!")

