"""
BUTTERFLY — Camera Speed Continuity & Boundary Velocity Verification Script
Verifies:
1. C1 continuity of camera displacement X(p) and velocity V(p) across the complete journey [0.0, 1.0].
2. Identical cruising velocity in Meadow and Rocket sections.
3. Hermite cubic smooth ease-in / ease-out around Pergola hold.
4. Numerical delta-X over equal time steps for slow scroll, fast scroll, and reversal.
"""

import math

# Exact mathematical motion curve parameters:
d_start = 0.03
d_end = 0.03
d_ease = 0.04
d_hold = 0.25

eff_time = 1.0 - d_hold - d_ease - 0.5 * (d_start + d_end)
V0 = 1.0 / eff_time

t_cruise1 = (0.52 / V0) - 0.5 * (d_start + d_ease)
t_cruise2 = (0.48 / V0) - 0.5 * (d_ease + d_end)

p0 = 0.0
p1 = p0 + d_start
p2 = p1 + t_cruise1
p3 = p2 + d_ease
p4 = p3 + d_hold
p5 = p4 + d_ease
p6 = p5 + t_cruise2
p7 = 1.0

X0 = 0.0
X1 = 0.5 * V0 * d_start
X2 = X1 + V0 * t_cruise1
X3 = 0.52
X4 = 0.52
X5 = X4 + 0.5 * V0 * d_ease
X6 = X5 + V0 * t_cruise2
X7 = 1.0

def hermite(t, Xa, Xb, Va_s, Vb_s):
    t2 = t * t
    t3 = t2 * t
    return (2*t3 - 3*t2 + 1)*Xa + (t3 - 2*t2 + t)*Va_s + (-2*t3 + 3*t2)*Xb + (t3 - t2)*Vb_s

def hermite_v(t, Xa, Xb, Va_s, Vb_s, dt):
    t2 = t * t
    return ((6*t2 - 6*t)*Xa + (3*t2 - 4*t + 1)*Va_s + (-6*t2 + 6*t)*Xb + (3*t2 - 2*t)*Vb_s) / dt

def get_camera_fraction(p):
    p = max(0.0, min(1.0, p))
    if p <= p1:
        t = (p - p0) / d_start
        return hermite(t, X0, X1, 0.0, V0 * d_start)
    elif p <= p2:
        return X1 + V0 * (p - p1)
    elif p <= p3:
        t = (p - p2) / d_ease
        return hermite(t, X2, X3, V0 * d_ease, 0.0)
    elif p <= p4:
        return X3
    elif p <= p5:
        t = (p - p4) / d_ease
        return hermite(t, X4, X5, 0.0, V0 * d_ease)
    elif p <= p6:
        return X5 + V0 * (p - p5)
    else:
        t = (p - p6) / d_end
        return hermite(t, X6, X7, V0 * d_end, 0.0)

def get_camera_velocity(p):
    p = max(0.0, min(1.0, p))
    if p <= p1:
        t = (p - p0) / d_start
        return hermite_v(t, X0, X1, 0.0, V0 * d_start, d_start)
    elif p <= p2:
        return V0
    elif p <= p3:
        t = (p - p2) / d_ease
        return hermite_v(t, X2, X3, V0 * d_ease, 0.0, d_ease)
    elif p <= p4:
        return 0.0
    elif p <= p5:
        t = (p - p4) / d_ease
        return hermite_v(t, X4, X5, 0.0, V0 * d_ease, d_ease)
    elif p <= p6:
        return V0
    else:
        t = (p - p6) / d_end
        return hermite_v(t, X6, X7, V0 * d_end, 0.0, d_end)

def run_tests():
    print("=" * 70)
    print("1. KEY MILESTONES & SPEED VERIFICATION")
    print("=" * 70)
    print(f"Cruising Speed V0: {V0:.6f} (fraction of maxPanX per unit progress)")
    print(f"Meadow Start: p={p0:.4f} -> X={get_camera_fraction(p0):.4f}")
    print(f"Cruise Meadow: p={p1:.4f} to p={p2:.4f} -> V={V0:.6f}")
    print(f"Pergola Arrive: p={p3:.4f} -> X={get_camera_fraction(p3):.4f}, V={get_camera_velocity(p3):.6f}")
    print(f"Pergola Book Hold: p={p3:.4f} to p={p4:.4f} -> X={X3:.4f}, V=0.000000")
    print(f"Pergola Depart: p={p4:.4f} to p={p5:.4f} -> accelerates smoothly from 0 to V0")
    print(f"Cruise Rocket: p={p5:.4f} to p={p6:.4f} -> V={V0:.6f}")
    print(f"Rocket Settle: p={p7:.4f} -> X={get_camera_fraction(p7):.4f}, V={get_camera_velocity(p7):.6f}")

    print("\n" + "=" * 70)
    print("2. BOUNDARY C1 CONTINUITY CHECK (Left vs Right Limits at Epsilon=1e-6)")
    print("=" * 70)
    eps = 1e-6
    boundaries = [
        ("p1: Meadow Ease-in -> Meadow Cruise", p1),
        ("p2: Meadow Cruise -> Pergola Decel", p2),
        ("p3: Pergola Decel -> Pergola Hold", p3),
        ("p4: Pergola Hold -> Pergola Accel", p4),
        ("p5: Pergola Accel -> Rocket Cruise", p5),
        ("p6: Rocket Cruise -> Rocket Decel", p6),
    ]
    max_jump = 0.0
    for label, b in boundaries:
        vl = get_camera_velocity(b - eps)
        vr = get_camera_velocity(b + eps)
        jump = abs(vr - vl)
        max_jump = max(max_jump, jump)
        print(f"{label} (p={b:.4f}): V_left={vl:.6f}, V_right={vr:.6f}, Jump={jump:.8f}")

    assert max_jump < 1e-4, f"Velocity jump detected: {max_jump}"
    print(f"\nAll boundaries verified: C1 continuous with max jump {max_jump:.8f} (floating-point precision limit)")

    print("\n" + "=" * 70)
    print("3. DISPLACEMENT OVER EQUAL PROGRESS INTERVALS (Delta p = 0.01)")
    print("=" * 70)
    print(f"{'p_start':<10} {'p_end':<10} {'Delta X':<15} {'Speed (Delta X / Delta p)':<25} {'Phase':<20}")
    print("-" * 75)
    for p in [0.05, 0.15, 0.25, 0.32, 0.35, 0.37, 0.45, 0.55, 0.64, 0.66, 0.75, 0.85, 0.95]:
        p_next = p + 0.01
        x1 = get_camera_fraction(p)
        x2 = get_camera_fraction(p_next)
        dx = x2 - x1
        sp = dx / 0.01
        phase = ""
        if p < p2: phase = "Meadow Cruise"
        elif p < p3: phase = "Ease into Pergola"
        elif p < p4: phase = "Pergola Hold (Pages)"
        elif p < p5: phase = "Ease out of Pergola"
        elif p < p6: phase = "Rocket Cruise"
        else: phase = "Ease into Rocket"
        print(f"{p:<10.3f} {p_next:<10.3f} {dx:<15.6f} {sp:<25.6f} {phase:<20}")

    print("\n" + "=" * 70)
    print("4. REVERSAL AND DIRECTION CHANGE TEST")
    print("=" * 70)
    # Simulate moving forward into pergola, reversing back to meadow, then forward again
    test_trajectory = [0.30, 0.33, 0.36, 0.39, 0.36, 0.33, 0.30, 0.34, 0.38, 0.42, 0.48]
    prev_x = None
    for curr_p in test_trajectory:
        curr_x = get_camera_fraction(curr_p)
        curr_v = get_camera_velocity(curr_p)
        delta_str = f"{curr_x - prev_x:+.4f}" if prev_x is not None else "0.0000"
        print(f"p = {curr_p:.2f} -> Camera Pan = {curr_x:.4f} (Delta: {delta_str}), Slope = {curr_v:.4f}")
        prev_x = curr_x

    print("\nVerification successful! Zero speed jumps, uniform cruising speed, C1 continuity confirmed.")

if __name__ == "__main__":
    run_tests()

