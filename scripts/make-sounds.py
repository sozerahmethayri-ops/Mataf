# Kullanım: python3 scripts/make-sounds.py assets/sounds   (numpy gerekir)
# Bildirim sesleri: tamamen sentezlenmiş, telifsiz. 22.05 kHz, 16-bit, mono WAV (iOS ve Android uyumlu, < 30 sn).
import numpy as np, wave, sys, os
SR = 22050
def bell(f, dur, amp=1.0, partials=((1, 1.0, 1.0), (2.0, 0.5, 1.6), (2.76, 0.35, 2.2), (5.4, 0.15, 3.5), (8.93, 0.08, 5.0)), decay=1.6):
    t = np.arange(int(SR * dur)) / SR
    y = np.zeros_like(t)
    for r, a, dk in partials:
        y += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * decay * dk)
    att = np.minimum(1, t / 0.004)
    return amp * y * att
def soft(f, dur, amp=1.0, vib=4.5, depth=0.004):
    t = np.arange(int(SR * dur)) / SR
    ph = 2 * np.pi * f * (t + depth / (2 * np.pi * vib) * np.sin(2 * np.pi * vib * t)) if vib else 2 * np.pi * f * t
    env = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.25)
    y = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    return amp * y * env
def drop(dur=0.22, f0=520, f1=1500, amp=1.0):
    t = np.arange(int(SR * dur)) / SR
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.03))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return amp * np.sin(ph) * np.exp(-t / 0.05) * np.minimum(1, t / 0.002)
def place(total, parts):
    y = np.zeros(int(SR * total))
    for at, sig in parts:
        i = int(SR * at); n = min(len(sig), len(y) - i); y[i:i + n] += sig[:n]
    return y
def reverb(y, taps=((0.031, 0.35), (0.053, 0.25), (0.089, 0.18), (0.13, 0.1))):
    out = y.copy()
    for d, g in taps:
        k = int(SR * d); out[k:] += g * y[:-k]
    return out
def save(name, y):
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.7
    fade = int(SR * 0.05); y[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(os.path.join(sys.argv[1], name), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((y * 32767).astype('<i2').tobytes())
# zil: iki tonlu kapı zili (Mi5 → Do5)
save('zil.wav', reverb(place(3.2, [(0, bell(659.25, 2.0)), (0.45, bell(523.25, 2.7))])))
# can: derin, tek tek vurulan çan (La3), üç vuruş
save('can_sesi.wav', reverb(place(5.0, [(0, bell(220, 2.4, decay=0.9)), (1.3, bell(220, 2.4, 0.8, decay=0.9)), (2.6, bell(220, 2.4, 0.7, decay=0.9))])))
# nagme: Hicaz dizisinde yumuşak, kısa ezgi (Re–Mi♭–Fa♯–Sol–Fa♯–Mi♭–Re); ezan taklidi değildir
notes = [293.66, 311.13, 369.99, 392.0, 369.99, 311.13, 293.66]
durs = [0.55, 0.45, 0.55, 0.9, 0.45, 0.45, 1.3]
parts = []; t0 = 0.0
for f, d in zip(notes, durs):
    parts.append((t0, soft(f, d + 0.12))); t0 += d
save('nagme.wav', reverb(place(t0 + 0.4, parts)))
# damla: üç su damlası
save('damla.wav', reverb(place(1.6, [(0, drop()), (0.38, drop(f0=600, f1=1700, amp=0.8)), (0.7, drop(f0=480, f1=1350, amp=0.9))])))
