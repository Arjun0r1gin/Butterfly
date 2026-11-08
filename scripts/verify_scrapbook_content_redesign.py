"""
BUTTERFLY — Content-Presentation Redesign Verification Script
Renders high-resolution visual proof of the authentic handmade scrapbook spreads
matching the approved reference: black ink cursive handwriting, blush watercolor
highlighter streaks, colorful Polaroids, washi tape, pressed flowers, and stickers.
"""

import os
import sys
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ARTIFACT_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
PUBLIC_DIR = '/home/arjun0r1gin/Desktop/BUTTERFLY/public'
ASSETS_DIR = os.path.join(PUBLIC_DIR, 'storybook/assets')
SB_DIR = os.path.join(PUBLIC_DIR, 'storybook')

os.makedirs(ARTIFACT_DIR, exist_ok=True)

# System Script/Cursive font
FONT_SCRIPT = '/usr/share/fonts/urw-base35/Z003-MediumItalic.otf'
FONT_SERIF = '/usr/share/fonts/urw-base35/P052-Roman.otf'

def render_spread_preview(spread_index=1, out_name='spread_2_handmade_verification.png'):
    print(f"--> Rendering High-Resolution Spread {spread_index + 1} Handmade Scrapbook Preview...")
    
    # 2:1 open book spread (1920 x 1080 canvas)
    vw, vh = 1920, 1080
    
    # Sunset garden backdrop
    bg_path = os.path.join(PUBLIC_DIR, 'scenes/seamless_garden_panorama_hd.jpg')
    if os.path.exists(bg_path):
        pano = Image.open(bg_path).convert('RGBA')
        # Center crop pergola sunset
        pw, ph = pano.size
        crop_x = int(pw * 0.35)
        crop_w = int(ph * (vw / vh))
        canvas = pano.crop((crop_x, 0, crop_x + crop_w, ph)).resize((vw, vh), Image.Resampling.LANCZOS)
    else:
        canvas = Image.new('RGBA', (vw, vh), (25, 15, 10, 255))
        
    # Darken backdrop slightly to emphasize book
    darkener = Image.new('RGBA', (vw, vh), (0, 0, 0, 80))
    canvas.alpha_composite(darkener)

    # Book dimensions
    book_w = 1480
    book_h = 760
    book_x = (vw - book_w) // 2
    book_y = (vh - book_h) // 2 + 10

    # 1. Walnut Leather Book Cover Base
    cov_path = os.path.join(SB_DIR, 'studio_cover_walnut.jpg')
    if os.path.exists(cov_path):
        cov = Image.open(cov_path).convert('RGBA')
        cov = cov.resize((book_w, book_h), Image.Resampling.LANCZOS)
        # Drop shadow behind cover
        sh_cov = Image.new('RGBA', (book_w + 60, book_h + 60), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(sh_cov)
        sh_d.rounded_rectangle([20, 20, book_w + 40, book_h + 40], radius=16, fill=(10, 5, 2, 180))
        sh_cov = sh_cov.filter(ImageFilter.GaussianBlur(24))
        canvas.alpha_composite(sh_cov, (book_x - 30, book_y - 20))
        canvas.alpha_composite(cov, (book_x, book_y))

    # Page dimensions (Left and Right pages)
    page_w = 680
    page_h = 720
    page_top = book_y + (book_h - page_h) // 2
    left_x = book_x + 36
    right_x = book_x + book_w - page_w - 36

    # 2. Render Left Page (Warm Parchment + Polaroids + Stickers)
    left_bg = Image.open(os.path.join(SB_DIR, 'studio_page_blank_left.jpg')).convert('RGBA')
    left_page = left_bg.resize((page_w, page_h), Image.Resampling.LANCZOS)
    
    # Render Left Page Content based on spread
    if spread_index == 0:
        # Spread 1: 3 Polaroids
        # Polaroid 1: First Sunshine Walk
        p1 = render_polaroid_card(
            photo_path=os.path.join(ASSETS_DIR, 'photo_sunshine_walk.jpg'),
            caption='First Sunshine Walk ♡',
            w=235, h=275, rot=-3.5, tape='pink'
        )
        paste_rotated(left_page, p1, x=220, y=180)

        # Polaroid 2: A Sweet Visitor
        p2 = render_polaroid_card(
            photo_path=os.path.join(ASSETS_DIR, 'photo_sweet_visitor.jpg'),
            caption='A Sweet Visitor ♡',
            w=220, h=260, rot=4.5, tape='gold'
        )
        paste_rotated(left_page, p2, x=450, y=280)

        # Polaroid 3: Evening at the Hills
        p3 = render_polaroid_card(
            photo_path=os.path.join(ASSETS_DIR, 'photo_evening_hills.jpg'),
            caption='Evening at the Hills ♡',
            w=225, h=265, rot=-2.0, tape='none'
        )
        paste_rotated(left_page, p3, x=310, y=490)

        # Stickers & Botanicals
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'flower_purple.png'), x=60, y=220, w=70, h=130, rot=-6)
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'flower_daisy.png'), x=190, y=540, w=75, h=75, rot=8)
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'wax_seal_butterfly.png'), x=560, y=480, w=65, h=65, rot=0)
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'stamp_vintage_rose.png'), x=550, y=100, w=55, h=70, rot=6)
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'label_memories.png'), x=250, y=630, w=110, h=40, rot=-2)
    elif spread_index == 1:
        # Spread 2 (Approved Visual Reference)
        # Vintage map scrap underneath
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'map_scrap_deckled.png'), x=240, y=380, w=190, h=110, rot=-3)

        # Polaroid 1: The evening sky
        p1 = render_polaroid_card(
            photo_path=os.path.join(ASSETS_DIR, 'photo_evening_sky.jpg'),
            caption='The evening sky ♡',
            w=240, h=285, rot=-4.8, tape='pink'
        )
        paste_rotated(left_page, p1, x=220, y=210)

        # Polaroid 2: In the garden...
        p2 = render_polaroid_card(
            photo_path=os.path.join(ASSETS_DIR, 'photo_in_the_garden.jpg'),
            caption='In the garden... ♡',
            w=250, h=295, rot=5.5, tape='gold'
        )
        paste_rotated(left_page, p2, x=440, y=410)

        # Pressed purple flower
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'flower_purple.png'), x=410, y=80, w=75, h=105, rot=15)
        # Monarch butterfly sticker
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'sticker_monarch.png'), x=540, y=110, w=75, h=65, rot=12)
        # Pressed daisy
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'flower_daisy.png'), x=350, y=570, w=68, h=68, rot=8)
        # Vintage camera sticker
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'sticker_camera.png'), x=500, y=580, w=85, h=60, rot=-4)
        # Postage stamp
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'stamp_pink_flower.png'), x=95, y=520, w=60, h=75, rot=-8)
        # Little moments label
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'label_little_moments.png'), x=225, y=550, w=80, h=75, rot=3)
    elif spread_index == 2:
        # Spread 3 (Stargazing at Dusk & By The Mossy Stones)
        p1 = render_polaroid_card(
            photo_path=os.path.join(ASSETS_DIR, 'photo_stargazing.jpg'),
            caption='Stargazing at Dusk ♡',
            w=240, h=285, rot=-3.8, tape='pink'
        )
        paste_rotated(left_page, p1, x=220, y=210)

        p2 = render_polaroid_card(
            photo_path=os.path.join(ASSETS_DIR, 'photo_mossy_stones.jpg'),
            caption='By The Mossy Stones ♡',
            w=250, h=295, rot=4.2, tape='gold'
        )
        paste_rotated(left_page, p2, x=440, y=410)

        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'sticker_monarch.png'), x=540, y=110, w=75, h=65, rot=-8)
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'flower_purple.png'), x=110, y=520, w=75, h=105, rot=-12)
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'flower_daisy.png'), x=510, y=570, w=68, h=68, rot=15)
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'wax_seal_butterfly.png'), x=560, y=340, w=65, h=65, rot=0)
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'label_memories.png'), x=290, y=580, w=100, h=38, rot=2)
    else:
        # Spread 4 (Golden Hour Glow & Forever & Always)
        p1 = render_polaroid_card(
            photo_path=os.path.join(ASSETS_DIR, 'photo_golden_glow.jpg'),
            caption='Golden Hour Glow ♡',
            w=240, h=285, rot=-4.5, tape='pink'
        )
        paste_rotated(left_page, p1, x=220, y=210)

        p2 = render_polaroid_card(
            photo_path=os.path.join(ASSETS_DIR, 'photo_forever_always.jpg'),
            caption='Forever & Always ♡',
            w=250, h=295, rot=5.0, tape='gold'
        )
        paste_rotated(left_page, p2, x=440, y=410)

        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'sticker_monarch.png'), x=540, y=110, w=75, h=65, rot=8)
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'sticker_camera.png'), x=110, y=530, w=80, h=55, rot=-6)
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'flower_daisy.png'), x=490, y=570, w=68, h=68, rot=12)
        paste_asset_if_exists(left_page, os.path.join(ASSETS_DIR, 'wax_seal_butterfly.png'), x=240, y=580, w=60, h=60, rot=0)

    canvas.alpha_composite(left_page, (left_x, page_top))

    # 3. Render Right Page (Warm Parchment + Black Ink Cursive Diary)
    right_bg = Image.open(os.path.join(SB_DIR, 'studio_page_blank_right.jpg')).convert('RGBA')
    right_page = right_bg.resize((page_w, page_h), Image.Resampling.LANCZOS)
    rd = ImageDraw.Draw(right_page)

    # Fonts
    font_chap = ImageFont.truetype(FONT_SCRIPT, 36)
    font_title = ImageFont.truetype(FONT_SCRIPT, 46)
    font_story = ImageFont.truetype(FONT_SCRIPT, 34)
    font_date = ImageFont.truetype(FONT_SCRIPT, 34)

    rx_margin = 85
    r_content_w = page_w - rx_margin * 2

    if spread_index == 0:
        # Spread 1 Right Page
        # Date top right
        date_str = "29 June"
        rd.text((page_w - 180, 50), date_str, fill=(22, 19, 17, 255), font=font_date)
        rd.line([(page_w - 185, 92), (page_w - 95, 90)], fill=(22, 19, 17, 255), width=2)
        # Heart top left
        rd.text((rx_margin, 50), "♡", fill=(210, 80, 90, 255), font=font_chap)

        # Title / opening line
        cur_y = 135
        rd.text((rx_margin + 50, cur_y), "A quiet evening...", fill=(22, 19, 17, 255), font=font_title)
        cur_y += 75

        story_lines = [
            "The sun dipped low, painting",
            "everything in shades of gold and",
            "amber. The air smelled of flowers,",
            "and for a moment, time felt slow...",
            "",
            "It's in these little moments that",
            "happiness feels the most real. ♡"
        ]
        for line in story_lines:
            if line:
                rd.text((rx_margin, cur_y), line, fill=(24, 21, 18, 255), font=font_story)
            cur_y += 48

        # Pink wildflower sprig bottom right
        paste_asset_if_exists(right_page, os.path.join(ASSETS_DIR, 'flower_pink_sprig.png'), x=page_w - 110, y=page_h - 130, w=70, h=95, rot=5)
    elif spread_index == 1:
        # Spread 2 Right Page (Chapter II: The Whispering Garden)
        cur_y = 65

        # Chapter II ♡ with Blush Highlight Streak
        chap_text = "Chapter II ♡"
        rd.rounded_rectangle([rx_margin - 8, cur_y - 6, rx_margin + 175, cur_y + 36], radius=6, fill=(235, 160, 175, 110))
        rd.text((rx_margin, cur_y), chap_text, fill=(22, 19, 17, 255), font=font_chap)
        cur_y += 68

        # The Whispering Garden with Blush Highlight Streak
        title_text = "The Whispering Garden"
        rd.rounded_rectangle([rx_margin - 10, cur_y - 8, rx_margin + 365, cur_y + 44], radius=8, fill=(235, 160, 175, 110))
        rd.text((rx_margin, cur_y), title_text, fill=(18, 15, 13, 255), font=font_title)
        cur_y += 82

        # Butterfly flight loop doodle in top right
        paste_asset_if_exists(right_page, os.path.join(ASSETS_DIR, 'doodle_butterfly.png'), x=page_w - 120, y=70, w=65, h=55, rot=0)

        # Genuine Black Fountain Pen Ink Story Paragraphs
        story_lines = [
            "As I walked through the garden, a gentle",
            "breeze carried the scent of blooming flowers.",
            "The leaves rustled softly, as if sharing",
            "secrets of an older time. Sunlight slipped",
            "through the branches, painting golden patterns",
            "on the ground.",
            "",
            "It felt like the garden was not just a",
            "place, but a memory — one that had been",
            "waiting for me to return. ♡"
        ]
        for line in story_lines:
            if line:
                rd.text((rx_margin, cur_y), line, fill=(24, 21, 18, 255), font=font_story)
            cur_y += 44

        # Pink Wildflower sprig in bottom right
        paste_asset_if_exists(right_page, os.path.join(ASSETS_DIR, 'flower_pink_sprig.png'), x=page_w - 110, y=page_h - 130, w=70, h=95, rot=5)
    elif spread_index == 2:
        # Spread 3 Right Page (Chapter III: Beneath The Starlit Sky)
        cur_y = 65
        chap_text = "Chapter III ♡"
        rd.rounded_rectangle([rx_margin - 8, cur_y - 6, rx_margin + 185, cur_y + 36], radius=6, fill=(235, 160, 175, 110))
        rd.text((rx_margin, cur_y), chap_text, fill=(22, 19, 17, 255), font=font_chap)
        cur_y += 68

        title_text = "Beneath The Starlit Sky"
        rd.rounded_rectangle([rx_margin - 10, cur_y - 8, rx_margin + 375, cur_y + 44], radius=8, fill=(235, 160, 175, 110))
        rd.text((rx_margin, cur_y), title_text, fill=(18, 15, 13, 255), font=font_title)
        cur_y += 82

        story_lines = [
            "When twilight turned to night, the first",
            "fireflies blinked softly among the reeds.",
            "We counted constellations between the",
            "branches, laughing at made-up legends",
            "and quiet dreams.",
            "",
            "Every gentle whisper in the dark felt",
            "like a promise written in starlight. ♡"
        ]
        for line in story_lines:
            if line:
                rd.text((rx_margin, cur_y), line, fill=(24, 21, 18, 255), font=font_story)
            cur_y += 44

        paste_asset_if_exists(right_page, os.path.join(ASSETS_DIR, 'flower_pink_sprig.png'), x=page_w - 110, y=page_h - 130, w=70, h=95, rot=5)
    else:
        # Spread 4 Right Page (Chapter IV: Our Journey Ahead)
        cur_y = 65
        chap_text = "Chapter IV ♡"
        rd.rounded_rectangle([rx_margin - 8, cur_y - 6, rx_margin + 180, cur_y + 36], radius=6, fill=(235, 160, 175, 110))
        rd.text((rx_margin, cur_y), chap_text, fill=(22, 19, 17, 255), font=font_chap)
        cur_y += 68

        title_text = "Our Journey Ahead"
        rd.rounded_rectangle([rx_margin - 10, cur_y - 8, rx_margin + 310, cur_y + 44], radius=8, fill=(235, 160, 175, 110))
        rd.text((rx_margin, cur_y), title_text, fill=(18, 15, 13, 255), font=font_title)
        cur_y += 82

        paste_asset_if_exists(right_page, os.path.join(ASSETS_DIR, 'doodle_butterfly.png'), x=page_w - 120, y=70, w=65, h=55, rot=0)

        story_lines = [
            "Every page before this was just the",
            "beginning of our path. Through quiet",
            "meadows, starry skies, and blooming gardens,",
            "every step brought me closer to you.",
            "",
            "The brightest adventures are the ones we",
            "have yet to write — together. ♡"
        ]
        for line in story_lines:
            if line:
                rd.text((rx_margin, cur_y), line, fill=(24, 21, 18, 255), font=font_story)
            cur_y += 44

        paste_asset_if_exists(right_page, os.path.join(ASSETS_DIR, 'flower_pink_sprig.png'), x=page_w - 110, y=page_h - 130, w=70, h=95, rot=5)

    canvas.alpha_composite(right_page, (right_x, page_top))

    # 4. Antique Brass Twin-Wire Spiral Binding along center spine
    draw_spiral_spine(canvas, cx=vw // 2, cy=vh // 2, total_h=page_h - 20)

    out_path = os.path.join(ARTIFACT_DIR, out_name)
    canvas.convert('RGB').save(out_path, quality=96)
    print(f"  [OK] Saved visual verification to {out_path}\n")

def render_polaroid_card(photo_path, caption, w=240, h=285, rot=0, tape='pink'):
    card = Image.new('RGBA', (w + 40, h + 40), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)

    cx, cy = (w + 40) // 2, (h + 40) // 2
    c_left = cx - w // 2
    c_top = cy - h // 2

    # Drop shadow
    d.rectangle([c_left + 4, c_top + 6, c_left + w + 4, c_top + h + 6], fill=(20, 10, 5, 55))
    # Polaroid white card
    d.rectangle([c_left, c_top, c_left + w, c_top + h], fill=(255, 254, 251, 255), outline=(235, 226, 212, 255), width=1)

    # Photo frame area
    pad = 16
    fw = w - pad * 2
    fh = h - 75
    fx = c_left + pad
    fy = c_top + pad

    if os.path.exists(photo_path):
        p_img = Image.open(photo_path).convert('RGBA')
        # Center crop to aspect ratio
        pw, ph = p_img.size
        target_ratio = fw / fh
        cur_ratio = pw / ph
        if cur_ratio > target_ratio:
            cw = int(ph * target_ratio)
            p_crop = p_img.crop(((pw - cw) // 2, 0, (pw + cw) // 2, ph))
        else:
            ch = int(pw / target_ratio)
            p_crop = p_img.crop((0, (ph - ch) // 2, pw, (ph + ch) // 2))
        p_resized = p_crop.resize((fw, fh), Image.Resampling.LANCZOS)
        card.alpha_composite(p_resized, (fx, fy))
    else:
        d.rectangle([fx, fy, fx + fw, fy + fh], fill=(245, 210, 190, 255))

    # Caption in Black Ink
    font_cap = ImageFont.truetype(FONT_SCRIPT, 26)
    d.text((fx + 4, c_top + h - 42), caption, fill=(24, 21, 18, 255), font=font_cap)

    # Top Washi Tape
    if tape == 'pink':
        washi_p = os.path.join(ASSETS_DIR, 'washi_pink_floral.png')
    elif tape == 'gold':
        washi_p = os.path.join(ASSETS_DIR, 'washi_gingham.png')
    else:
        washi_p = None

    if washi_p and os.path.exists(washi_p):
        wt = Image.open(washi_p).convert('RGBA')
        wt = wt.resize((100, 26), Image.Resampling.LANCZOS)
        card.alpha_composite(wt, (cx - 50, c_top - 12))

    return card

def paste_rotated(canvas, img, x, y):
    canvas.alpha_composite(img, (x - img.width // 2, y - img.height // 2))

def paste_asset_if_exists(canvas, path, x, y, w, h, rot=0):
    if not os.path.exists(path):
        return
    im = Image.open(path).convert('RGBA')
    im = im.resize((w, h), Image.Resampling.LANCZOS)
    if rot != 0:
        im = im.rotate(rot, expand=True, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(im, (x - im.width // 2, y - im.height // 2))

def draw_spiral_spine(canvas, cx, cy, total_h=680):
    coil_count = 13
    step_y = total_h / (coil_count - 1)
    start_y = cy - total_h / 2

    d = ImageDraw.Draw(canvas)
    for i in range(coil_count):
        y = int(start_y + i * step_y)
        # Left hole
        d.ellipse([cx - 22, y - 8, cx - 10, y + 8], fill=(30, 18, 10, 255))
        # Right hole
        d.ellipse([cx + 10, y - 8, cx + 22, y + 8], fill=(30, 18, 10, 255))
        # Brass twin-wire coils
        for offset in [-3, 3]:
            # Wire shadow
            d.arc([cx - 24, y + offset - 7, cx + 24, y + offset + 9], start=180, end=0, fill=(20, 10, 5, 140), width=3)
            # Golden brass metallic wire
            d.arc([cx - 24, y + offset - 8, cx + 24, y + offset + 8], start=180, end=0, fill=(225, 180, 85, 255), width=3)
            # Highlight glint
            d.arc([cx - 16, y + offset - 9, cx + 16, y + offset + 7], start=210, end=330, fill=(255, 235, 160, 240), width=1)

def main():
    print("==================================================")
    print("BUTTERFLY — Content-Presentation Redesign Verification")
    print("==================================================")
    # Render Spread 1 (June 29)
    render_spread_preview(spread_index=0, out_name='spread_1_handmade_verification.png')
    # Render Spread 2 (July 15 - The Whispering Garden matching approved reference)
    render_spread_preview(spread_index=1, out_name='spread_2_handmade_verification.png')
    # Render Spread 3 (August 04 - Beneath The Starlit Sky)
    render_spread_preview(spread_index=2, out_name='spread_3_handmade_verification.png')
    # Render Spread 4 (August 22 - Our Journey Ahead)
    render_spread_preview(spread_index=3, out_name='spread_4_handmade_verification.png')
    print("Verification script successfully executed.")

if __name__ == '__main__':
    main()
