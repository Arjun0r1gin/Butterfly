import os
import math
import random
import subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ARTIFACT_DIR = '/home/arjun0r1gin/.gemini/antigravity/brain/8f208155-be00-4d2a-ab2b-13f3748176e3'
os.makedirs(ARTIFACT_DIR, exist_ok=True)

import sys
sys.path.append('scripts')
from generate_task3_environmental_verification import render_frame
from generate_task4_refined_ui_verification import render_final_interaction_ui, draw_pill_gradient, get_font, font_serif_bold, font_serif_italic

# Load all 16 original Flower Tunnel watercolor assets
FLOWER_PATHS = [
    'public/flowers/processed/Delicate Peach Coral Watercolor Bloom.png',
    'public/flowers/processed/Golden Ruffled Watercolor Bloom.png',
    'public/flowers/processed/Golden-Centered Ivory Watercolor Blossom.png',
    'public/flowers/processed/Magenta Rose with Golden Stamens.png',
    'public/flowers/processed/Mint and Cream Watercolor Blossom.png',
    'public/flowers/processed/Pastel Watercolor Bloom on Black.png',
    'public/flowers/processed/Radiant Magenta Watercolor Blossom.png',
    'public/flowers/processed/Vibrant Orange Watercolor Bloom.png',
    'public/flowers/processed/Watercolor Crimson Camellia Glow.png',
    'public/flowers/processed/Watercolor Lavender Bloom.png',
    'public/flowers/processed/Watercolor Peach and Ivory Blossom.png',
    'public/flowers/Golden Yellow Watercolor Blossom.png',
    'public/flowers/Luminous Blue and Lavender Watercolor Bloom.png',
    'public/flowers/Luminous Watercolor Bloom on Black-1.png',
    'public/flowers/Translucent Pink Peach Watercolor Blossom.png',
    'public/flowers/Watercolor Coral Peony Bloom-2.png'
]

print("Pre-rendering all 16 watercolor flower sprite buffers at 256px...")
FLOWER_SPRITES = []
for p in FLOWER_PATHS:
    im = Image.open(p).convert('RGBA')
    aspect = im.width / max(1, im.height)
    sw = 256
    sh = int(sw / aspect)
    scaled = im.resize((sw, sh), Image.Resampling.LANCZOS)
    FLOWER_SPRITES.append((scaled, aspect))
print(f"Loaded {len(FLOWER_SPRITES)} verified watercolor flower sprites.")

class RainParticleSim:
    def __init__(self, seed, vw, vh, is_mobile=False):
        self.rng = random.Random(seed)
        self.vw = vw
        self.vh = vh
        self.is_mobile = is_mobile
        
        self.sprite_idx = self.rng.randint(0, len(FLOWER_SPRITES) - 1)
        self.depth = 0.4 + self.rng.random() * 0.95
        scale_mod = 0.65 if is_mobile else 1.0
        self.radius = scale_mod * (32 + self.depth * 58 + self.rng.random() * 14)
        
        self.base_x = self.rng.uniform(-40, vw + 40)
        self.start_y = self.rng.uniform(-450, -60)
        self.vy = 180 + self.depth * 190 + self.rng.random() * 60
        self.sway_amp = 18 + self.depth * 28 + self.rng.random() * 16
        self.sway_freq = 1.0 + self.rng.random() * 1.5
        self.sway_phase = self.rng.random() * math.pi * 2
        
        self.rot_speed = (self.rng.random() - 0.5) * 1.6
        self.initial_rot = self.rng.random() * math.pi * 2
        self.tumble_speed = (1.2 + self.rng.random() * 2.2) * (1 if self.rng.random() > 0.5 else -1)
        self.target_alpha = 0.88 + self.rng.random() * 0.12
        
        self.settle_y = vh - (20 + self.rng.random() * 140)
        self.will_settle = self.rng.random() < 0.40

    def get_state(self, t):
        """
        Calculates position, rotation, 3D tumble, and alpha at elapsed time t (seconds).
        """
        curr_y = self.start_y + self.vy * t
        
        if self.will_settle and curr_y >= self.settle_y:
            t_settle = (self.settle_y - self.start_y) / self.vy
            final_sway = math.sin(self.sway_phase + self.sway_freq * t_settle) * self.sway_amp
            return {
                'x': self.base_x + final_sway,
                'y': self.settle_y,
                'rot': self.initial_rot + self.rot_speed * t_settle,
                'tumble': 0.0,
                'alpha': self.target_alpha,
                'radius': self.radius,
                'sprite_idx': self.sprite_idx,
                'depth': self.depth
            }
            
        sway = math.sin(self.sway_phase + self.sway_freq * t) * self.sway_amp
        curr_x = self.base_x + sway
        curr_rot = self.initial_rot + self.rot_speed * t
        curr_tumble = self.tumble_speed * t
        alpha = min(self.target_alpha, max(0.0, (curr_y + 80) / 100.0) * self.target_alpha)
        
        return {
            'x': curr_x,
            'y': curr_y,
            'rot': curr_rot,
            'tumble': curr_tumble,
            'alpha': alpha,
            'radius': self.radius,
            'sprite_idx': self.sprite_idx,
            'depth': self.depth
        }

def render_flower_rain_frame(base_img, t_elapsed, vw=1600, vh=900, is_mobile=False, show_card=False):
    """
    Renders a single frame of the Flower Rain celebration over base_img at time t_elapsed.
    """
    canvas = base_img.convert('RGBA')
    flower_layer = Image.new('RGBA', (vw, vh), (0, 0, 0, 0))
    
    # Simulation pool: 180 particles on desktop, 90 on mobile
    particle_count = 90 if is_mobile else 180
    
    # Generate particles staggered over time
    particles_to_render = []
    for i in range(particle_count):
        # Stagger emission: each particle is spawned at i * 0.035s
        t_spawn = i * (0.045 if is_mobile else 0.025)
        if t_elapsed >= t_spawn:
            t_loc = t_elapsed - t_spawn
            sim = RainParticleSim(i * 101 + 7, vw, vh, is_mobile)
            state = sim.get_state(t_loc)
            if state['y'] < vh + state['radius'] * 2 + 50 and state['y'] > -state['radius'] * 2 - 10:
                particles_to_render.append(state)
                
    # Sort by depth so far flowers render behind foreground flowers
    particles_to_render.sort(key=lambda p: p['depth'])
    
    for p in particles_to_render:
        sprite_orig, aspect = FLOWER_SPRITES[p['sprite_idx']]
        rw = max(12, int(p['radius'] * 2))
        
        # 3D Tumble foreshortening (scale height along local axis)
        tumble_factor = 0.38 + 0.62 * abs(math.cos(p['tumble']))
        rh = max(8, int((rw / aspect) * tumble_factor))
        
        flower_scaled = sprite_orig.resize((rw, rh), Image.Resampling.BILINEAR)
        
        # Apply alpha
        if p['alpha'] < 0.99:
            r, g, b, a = flower_scaled.split()
            a = a.point(lambda v: int(v * p['alpha']))
            flower_scaled.putalpha(a)
            
        # Rotate in plane
        flower_rot = flower_scaled.rotate(math.degrees(p['rot']), resample=Image.Resampling.BILINEAR, expand=True)
        
        fx = int(p['x'] - flower_rot.width // 2)
        fy = int(p['y'] - flower_rot.height // 2)
        flower_layer.alpha_composite(flower_rot, (fx, fy))
        
    canvas.alpha_composite(flower_layer, (0, 0))
    
    # Render Celebration Card when show_card is True
    if show_card:
        card_w = min(580, int(vw * 0.88))
        card_h = 320 if not is_mobile else 260
        card_x = (vw - card_w) // 2
        card_y = (vh - card_h) // 2
        
        # Drop shadow
        c_sh = Image.new('RGBA', (card_w + 40, card_h + 40), (0, 0, 0, 0))
        dcs = ImageDraw.Draw(c_sh)
        dcs.rounded_rectangle([20, 20, card_w + 20, card_h + 20], radius=24, fill=(0, 0, 0, 180))
        c_sh = c_sh.filter(ImageFilter.GaussianBlur(16))
        canvas.alpha_composite(c_sh, (card_x - 20, card_y - 20))
        
        card = Image.new('RGBA', (card_w, card_h), (0, 0, 0, 0))
        dc = ImageDraw.Draw(card)
        dc.rounded_rectangle([0, 0, card_w - 1, card_h - 1], radius=24, fill=(35, 14, 6, 232), outline=(255, 215, 120, 200), width=2)
        
        f_cel_title = get_font(font_serif_bold, 30 if not is_mobile else 22)
        f_cel_sub = get_font(font_serif_bold, 18 if not is_mobile else 14)
        f_cel_quote = get_font(font_serif_italic, 15 if not is_mobile else 12)
        f_btn = get_font(font_serif_bold, 15 if not is_mobile else 13)
        
        dc.text((card_w // 2, 54 if not is_mobile else 42), "SHE SAID YES! ✨", font=f_cel_title, fill=(255, 215, 120, 255), anchor="mm")
        dc.text((card_w // 2, 98 if not is_mobile else 78), "Forever Begins Today ❤️", font=f_cel_sub, fill=(255, 246, 232, 240), anchor="mm")
        dc.text((card_w // 2, 144 if not is_mobile else 118), "“Across every star and every flower,\nI will cherish you in every lifetime.”", font=f_cel_quote, fill=(235, 210, 190, 220), anchor="mm", align="center")
        
        rbtn_w = 210 if not is_mobile else 165
        rbtn_h = 46 if not is_mobile else 38
        rx0 = (card_w - rbtn_w) // 2
        ry0 = card_h - rbtn_h - (36 if not is_mobile else 26)
        
        grad_stops = [(254, 220, 124, 255), (246, 179, 62, 255), (224, 139, 28, 255)]
        draw_pill_gradient(card, [rx0, ry0, rx0 + rbtn_w, ry0 + rbtn_h], radius=rbtn_h // 2, grad_stops=grad_stops, outline_col=(255, 245, 180, 220), outline_w=1)
        dc.text((card_w // 2, ry0 + rbtn_h // 2), "REPLAY JOURNEY  ↺", font=f_btn, fill=(43, 21, 4, 255), anchor="mm")
        
        canvas.alpha_composite(card, (card_x, card_y))

    return canvas.convert('RGB')

def main():
    print("Generating Flower Rain Celebration Verification Deliverables...")
    
    # Base Rocket Scene Frame (Scene 3, progress 1.0, butterfly resting on tip)
    base_desktop = render_frame(1.00, time_s=8.0, vw=1600, vh=900)
    
    # 1. Checkpoint 1: Final Question State (Before YES is clicked)
    print("Saving Checkpoint 1: Final Question Screen...")
    cp1 = render_final_interaction_ui(base_desktop, no_offset=(0, 0), show_toast=False, vw=1600, vh=900)
    cp1.save(os.path.join(ARTIFACT_DIR, 'flower_rain_check1_question_screen.png'), quality=95)
    
    # 2. Checkpoint 2: Initial Cascade (t = 1.2s, flowers shower down from top)
    print("Saving Checkpoint 2: Initial Cascade (original 16 watercolor blooms entering from top)...")
    cp2 = render_flower_rain_frame(base_desktop, t_elapsed=1.2, vw=1600, vh=900, is_mobile=False, show_card=False)
    cp2.save(os.path.join(ARTIFACT_DIR, 'flower_rain_check2_initial_cascade.png'), quality=95)
    
    # 3. Checkpoint 3: Dense Flower Rain Shower (t = 2.8s, cascading across screen)
    print("Saving Checkpoint 3: Dense Flower Rain Shower across entire viewport...")
    cp3 = render_flower_rain_frame(base_desktop, t_elapsed=2.8, vw=1600, vh=900, is_mobile=False, show_card=False)
    cp3.save(os.path.join(ARTIFACT_DIR, 'flower_rain_check3_dense_flower_shower.png'), quality=95)
    
    # 4. Checkpoint 4: Full Floral Blanket (t = 5.2s, viewport covered in flowers, corners included)
    print("Saving Checkpoint 4: Full-Screen Floral Blanket Coverage...")
    cp4 = render_flower_rain_frame(base_desktop, t_elapsed=5.2, vw=1600, vh=900, is_mobile=False, show_card=False)
    cp4.save(os.path.join(ARTIFACT_DIR, 'flower_rain_check4_full_screen_blanket.png'), quality=95)
    
    # 5. Checkpoint 5: Celebration Climax (t = 6.8s, celebration card over lush flower rain)
    print("Saving Checkpoint 5: Celebration Card over lush raining flowers...")
    cp5 = render_flower_rain_frame(base_desktop, t_elapsed=6.8, vw=1600, vh=900, is_mobile=False, show_card=True)
    cp5.save(os.path.join(ARTIFACT_DIR, 'flower_rain_check5_celebration_climax.png'), quality=95)
    
    # 6. Checkpoint 6: Mobile Flower Rain Celebration (480x854)
    print("Saving Checkpoint 6: Mobile Flower Rain Celebration...")
    base_mobile = render_frame(1.00, time_s=8.0, vw=480, vh=854)
    cp6 = render_flower_rain_frame(base_mobile, t_elapsed=3.8, vw=480, vh=854, is_mobile=True, show_card=True)
    cp6.save(os.path.join(ARTIFACT_DIR, 'flower_rain_check6_mobile_flower_rain.png'), quality=95)

    # 7. Continuous Video Recording (60 frames capturing Question -> Click YES -> Flower Rain -> Blanket -> Card)
    print("Generating continuous video recording for Flower Rain Celebration...")
    frames_dir = os.path.join(ARTIFACT_DIR, 'flower_rain_frames')
    os.makedirs(frames_dir, exist_ok=True)
    
    total_frames = 60
    for f in range(total_frames):
        # f = 0..11 (0.0s - 1.0s): Question is visible
        if f < 12:
            frame_img = render_final_interaction_ui(base_desktop, no_offset=(0, 0), show_toast=False)
        else:
            # f = 12..59: Flower Rain in motion
            t_sim = (f - 12) * 0.12 # 0.0s to 5.76s
            show_card = f >= 42
            frame_img = render_flower_rain_frame(base_desktop, t_elapsed=t_sim, vw=1600, vh=900, is_mobile=False, show_card=show_card)
            
        frame_img.save(os.path.join(frames_dir, f'frame_{f:03d}.png'))
        
    mp4_path = os.path.join(ARTIFACT_DIR, 'flower_rain_celebration.mp4')
    gif_path = os.path.join(ARTIFACT_DIR, 'flower_rain_celebration.gif')
    
    try:
        subprocess.run([
            'ffmpeg', '-y', '-framerate', '12',
            '-i', os.path.join(frames_dir, 'frame_%03d.png'),
            '-c:v', 'libopenh264', '-pix_fmt', 'yuv420p',
            mp4_path
        ], check=True)
    except Exception as e:
        print("MP4 note:", e)
        
    subprocess.run([
        'ffmpeg', '-y', '-framerate', '12',
        '-i', os.path.join(frames_dir, 'frame_%03d.png'),
        '-vf', 'fps=12,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer',
        gif_path
    ], check=True)
    
    print("Flower Rain Celebration Verification Complete!")

if __name__ == '__main__':
    main()

