#!/usr/bin/env python3
"""Generador de música y SFX chiptune (WAV) — recursos originales del juego."""
import struct, math, random, os
import numpy as np

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
os.makedirs(OUT, exist_ok=True)

def note_freq(n): return 440.0 * 2 ** ((n - 69) / 12)

class Track:
    def __init__(self): self.rows = []
    def add(self, t, d, f, w='sq', v=0.5):
        if d <= 0 or not f or f <= 0: return
        self.rows.append((t, d, f, w, v))

def render(tracks, length, noise_events=None):
    n = int(SR * length); buf = np.zeros(n)
    for tr in tracks:
        for (t, d, f, w, v) in tr.rows:
            s = max(0, int(t * SR)); e = min(n, int((t + d) * SR))
            m = e - s
            if m < 4: continue
            ph = 0.0
            ts = np.arange(m) / SR
            p = (ph + f * ts) % 1.0
            if w == 'sq': seg = np.where(p < 0.5, 1.0, -1.0)
            elif w == 'sq2': seg = np.where(p < 0.25, 1.0, -1.0)
            elif w == 'tri': seg = np.where(p < 0.5, 4 * p - 1, 3 - 4 * p)
            elif w == 'saw': seg = 2 * p - 1
            else: seg = np.sin(2 * np.pi * p)
            env = np.ones(m)
            atk = max(1, int(0.008 * SR)); rel = max(1, int(0.05 * SR))
            if m > atk + rel:
                env[:atk] = np.linspace(0, 1, atk)
                env[-rel:] *= np.linspace(1, 0, rel)
            buf[s:e] += seg * env * v
    if noise_events:
        rng = random.Random(7)
        for (t, d, v, pitch) in noise_events:
            s = max(0, int(t * SR)); e = min(n, int((t + d) * SR)); m = e - s
            if m < 2: continue
            per = max(1, int(pitch))
            vals = np.array([rng.choice([-1.0, 1.0]) for _ in range(per)])
            seg = vals[np.arange(m) % per]
            env = np.ones(m); rel = max(1, int(0.02 * SR)); env[-rel:] = np.linspace(1, 0, min(rel, m))
            buf[s:e] += seg * env * v
    peak = float(np.max(np.abs(buf))) or 1.0
    buf = buf / peak * 0.85
    pcm = (buf * 32767).astype('<i2').tobytes()
    return b'RIFF' + struct.pack('<I', 36 + len(pcm)) + b'WAVEfmt ' + \
           struct.pack('<IHHIIHH', 16, 1, 1, SR, SR * 2, 2, 16) + b'data' + struct.pack('<I', len(pcm))

N = lambda semi: note_freq(60 + semi)
CHORDS = {'Am': [N(0), N(3), N(7)], 'F': [N(-4), N(0), N(4)], 'C': [N(-2), N(2), N(5)],
          'G': [N(-1), N(2), N(7)], 'Dm': [N(2), N(5), N(9)], 'E': [N(4), N(7), N(11)]}
cl = lambda k: CHORDS[k]

def mel(rows):
    tr = Track(); t = 0.0
    for beats, semi, wave, vol in rows:
        if semi is not None and wave:
            tr.add(t, beats * 0.9, N(semi), wave, vol)
        t += beats
    return tr

def bass(chords, beat):
    tr = Track(); t = 0.0
    for ch in chords:
        for b in (0, 2):
            tr.add(t + b * beat, beat * 0.85, ch[0] / 2, 'tri', 0.5)
        t += 4 * beat
    return tr

def arp(chords, beat):
    tr = Track(); t = 0.0
    for ch in chords:
        for k in range(8):
            f = ch[k % len(ch)] * (2 if k % 4 == 3 else 1)
            tr.add(t + k * 0.5 * beat, 0.4 * beat, f, 'sq2', 0.16)
        t += 4 * beat
    return tr

def build(name, length, bpm, melody, chords, drums=True, arp_on=True):
    beat = 60 / bpm
    tracks = []
    if melody: tracks.append(mel(melody))
    if chords:
        tracks.append(bass(chords, beat))
        if arp_on: tracks.append(arp(chords, beat))
    noise = []
    if drums:
        nt = 0.0
        while nt < length:
            noise.append((nt, 0.045, 0.3, 6)); noise.append((nt + 2 * beat, 0.06, 0.35, 3))
            nt += 4 * beat
    data = render(tracks, length, noise)
    open(os.path.join(OUT, name + '.wav'), 'wb').write(data)
    print(name, len(data) // 1024, 'kb')

build('title', 16.0, 112, [
 (1,12,'sq',0.3),(1,12,'sq',0.3),(1,14,'sq',0.3),(1,12,'sq',0.3),
 (1,10,'sq',0.3),(1,12,'sq',0.3),(2,7,'sq',0.3),
 (1,12,'sq',0.3),(1,14,'sq',0.3),(1,15,'sq',0.3),(1,14,'sq',0.3),
 (1,12,'sq',0.3),(1,10,'sq',0.3),(2,9,'sq',0.3),
 (1,7,'sq',0.3),(1,9,'sq',0.3),(1,12,'sq',0.3),(1,14,'sq',0.3),
 (2,12,'sq',0.3),(2,None,None,0)],
 [cl('Am'),cl('F'),cl('C'),cl('G'),cl('Am'),cl('F'),cl('C'),cl('G')])

build('stage_frost', 14.6, 132, [
 (0.5,16,'sq',0.28),(0.5,16,'sq',0.28),(0.5,14,'sq',0.28),(0.5,12,'sq',0.28),(1,12,'sq',0.28),(1,14,'sq',0.28),
 (0.5,15,'sq',0.28),(0.5,15,'sq',0.28),(0.5,12,'sq',0.28),(0.5,10,'sq',0.28),(1,9,'sq',0.28),(1,12,'sq',0.28),
 (0.5,14,'sq',0.28),(0.5,16,'sq',0.28),(0.5,17,'sq',0.28),(0.5,16,'sq',0.28),(1,14,'sq',0.28),(1,12,'sq',0.28),
 (0.5,10,'sq',0.28),(0.5,12,'sq',0.28),(0.5,14,'sq',0.28),(0.5,12,'sq',0.28),(1,10,'sq',0.28),(1,7,'sq',0.28)],
 [cl('Am'),cl('F'),cl('C'),cl('G'),cl('Am'),cl('F'),cl('Dm'),cl('E')])

build('stage_blast', 13.7, 140, [
 (0.5,7,'sq',0.3),(0.5,7,'sq',0.3),(0.5,12,'sq',0.3),(0.5,12,'sq',0.3),(0.5,14,'sq',0.3),(0.5,14,'sq',0.3),(0.5,12,'sq',0.3),(0.5,7,'sq',0.3),
 (0.5,5,'sq',0.3),(0.5,5,'sq',0.3),(0.5,10,'sq',0.3),(0.5,10,'sq',0.3),(0.5,12,'sq',0.3),(0.5,12,'sq',0.3),(0.5,10,'sq',0.3),(0.5,5,'sq',0.3),
 (0.5,7,'sq',0.3),(0.5,7,'sq',0.3),(0.5,12,'sq',0.3),(0.5,12,'sq',0.3),(0.5,14,'sq',0.3),(0.5,16,'sq',0.3),(0.5,17,'sq',0.3),(0.5,16,'sq',0.3),
 (1,14,'sq',0.3),(1,12,'sq',0.3),(1,10,'sq',0.3),(1,7,'sq',0.3)],
 [cl('Dm'),cl('Dm'),cl('C'),cl('C'),cl('G'),cl('G'),cl('Am'),cl('Am'),cl('Dm'),cl('Dm'),cl('F'),cl('C'),cl('Dm'),cl('E')])

build('stage_burn', 13.3, 144, [
 (0.25,19,'sq',0.26),(0.25,19,'sq',0.26),(0.5,17,'sq',0.26),(0.5,16,'sq',0.26),(0.5,14,'sq',0.26),(0.5,12,'sq',0.26),
 (0.25,14,'sq',0.26),(0.25,14,'sq',0.26),(0.5,12,'sq',0.26),(0.5,10,'sq',0.26),(0.5,9,'sq',0.26),(0.5,7,'sq',0.26),
 (0.25,12,'sq',0.26),(0.25,14,'sq',0.26),(0.25,16,'sq',0.26),(0.25,17,'sq',0.26),(0.5,19,'sq',0.26),(0.5,17,'sq',0.26),
 (0.5,16,'sq',0.26),(0.5,14,'sq',0.26),(0.5,12,'sq',0.26),(0.5,10,'sq',0.26),(1,9,'sq',0.26),(1,7,'sq',0.26)],
 [cl('Am'),cl('E'),cl('Am'),cl('G'),cl('C'),cl('E'),cl('Am'),cl('Am')])

build('stage_gum', 15.2, 126, [
 (1,12,'tri',0.4),(0.5,14,'tri',0.4),(0.5,15,'tri',0.4),(1,16,'tri',0.4),(1,15,'tri',0.4),(1,14,'tri',0.4),(1,12,'tri',0.4),
 (1,10,'tri',0.4),(0.5,12,'tri',0.4),(0.5,14,'tri',0.4),(1,12,'tri',0.4),(1,10,'tri',0.4),(1,9,'tri',0.4),(1,7,'tri',0.4),
 (0.5,7,'tri',0.4),(0.5,9,'tri',0.4),(0.5,10,'tri',0.4),(0.5,12,'tri',0.4),(1,14,'tri',0.4),(1,12,'tri',0.4),
 (1,10,'tri',0.4),(1,9,'tri',0.4),(2,7,'tri',0.4)],
 [cl('C'),cl('Am'),cl('F'),cl('G'),cl('C'),cl('Am'),cl('Dm'),cl('G')])

build('intro', 19.2, 100, [
 (2,12,'tri',0.35),(1,14,'tri',0.35),(1,15,'tri',0.35),(2,16,'tri',0.35),(2,15,'tri',0.35),
 (2,14,'tri',0.35),(1,12,'tri',0.35),(1,10,'tri',0.35),(2,9,'tri',0.35),(2,12,'tri',0.35),
 (2,14,'tri',0.35),(2,12,'tri',0.35),(2,10,'tri',0.35),(2,9,'tri',0.35),
 (2,7,'tri',0.35),(4,None,None,0)],
 [cl('Am'),cl('C'),cl('F'),cl('G'),cl('Am'),cl('C'),cl('Dm'),cl('E')], drums=False)

build('boss', 12.0, 160, [
 (0.5,0,'sq',0.3),(0.5,0,'sq',0.3),(0.5,1,'sq',0.3),(0.5,0,'sq',0.3),(0.5,-1,'sq',0.3),(0.5,0,'sq',0.3),(0.5,3,'sq',0.3),(0.5,1,'sq',0.3),
 (0.5,0,'sq',0.3),(0.5,0,'sq',0.3),(0.5,-2,'sq',0.3),(0.5,0,'sq',0.3),(0.5,-1,'sq',0.3),(0.5,-2,'sq',0.3),(0.5,0,'sq',0.3),(0.5,4,'sq',0.3),
 (0.5,5,'sq',0.3),(0.5,4,'sq',0.3),(0.5,3,'sq',0.3),(0.5,2,'sq',0.3),(0.5,1,'sq',0.3),(0.5,0,'sq',0.3),(0.5,-1,'sq',0.3),(0.5,-2,'sq',0.3),
 (1,0,'sq',0.3),(1,3,'sq',0.3),(1,7,'sq',0.3),(1,12,'sq',0.3)],
 [cl('Am'),cl('Am'),cl('E'),cl('E'),cl('Am'),cl('Am'),cl('G'),cl('G'),cl('Dm'),cl('Dm'),cl('E'),cl('E')])

build('final', 11.4, 168, [
 (0.5,0,'sq',0.32),(0.25,1,'sq',0.32),(0.25,0,'sq',0.32),(0.5,-1,'sq',0.32),(0.5,0,'sq',0.32),(0.5,3,'sq',0.32),(0.25,4,'sq',0.32),(0.25,3,'sq',0.32),(0.5,1,'sq',0.32),
 (0.5,0,'saw',0.18),(0.5,-2,'saw',0.18),(0.5,-1,'saw',0.18),(0.5,0,'saw',0.18),(0.5,4,'saw',0.18),(0.5,3,'saw',0.18),(0.5,1,'saw',0.18),(0.5,0,'saw',0.18)],
 [cl('Am'),cl('E'),cl('Am'),cl('E'),cl('Dm'),cl('E'),cl('Am'),cl('E')])

build('victory', 6.0, 120, [
 (0.5,12,'sq',0.3),(0.5,12,'sq',0.3),(0.5,12,'sq',0.3),(1,7,'sq',0.3),(1,12,'sq',0.3),(1,14,'sq',0.3),(1,16,'sq',0.3),(2,12,'sq',0.3)],
 [cl('C'),cl('G'),cl('C')], drums=False)

build('gameover', 5.0, 90, [
 (1,12,'tri',0.4),(1,11,'tri',0.4),(1,10,'tri',0.4),(1,9,'tri',0.4),(2,7,'tri',0.4),(2,0,'tri',0.35)],
 [cl('Am'),cl('E'),cl('Am')], drums=False, arp_on=False)

def tone_seq(name, notes):
    tr = Track(); t = 0.0; total = 0
    for d, f, w, v in notes:
        fr = f if f > 100 else N(f)
        tr.add(t, d, fr, w, v); t += d; total += d
    data = render([tr], total + 0.05)
    open(os.path.join(OUT, 'sfx_' + name + '.wav'), 'wb').write(data)
    print('sfx', name, len(data) // 1024, 'kb')

tone_seq('shoot', [(0.08,N(24),'sq2',0.35),(0.06,N(19),'sq2',0.3)])
tone_seq('jump', [(0.1,N(12),'sq',0.3),(0.08,N(17),'sq',0.3)])
tone_seq('land', [(0.05,N(5),'tri',0.4)])
tone_seq('hit', [(0.06,N(0),'saw',0.4),(0.05,N(-5),'saw',0.35)])
tone_seq('hurt', [(0.12,N(-2),'saw',0.45),(0.1,N(-7),'saw',0.4)])
tone_seq('explode', [(0.25,N(0),'saw',0.4),(0.2,N(-12),'saw',0.35),(0.15,N(-24),'saw',0.3)])
tone_seq('pickup', [(0.06,N(12),'sq',0.35),(0.06,N(16),'sq',0.35),(0.1,N(19),'sq',0.35)])
tone_seq('dash', [(0.12,N(7),'sq2',0.3),(0.08,N(14),'sq2',0.25)])
tone_seq('select', [(0.05,N(12),'sq',0.3)])
tone_seq('freeze', [(0.15,N(24),'tri',0.3),(0.15,N(23),'tri',0.25),(0.15,N(22),'tri',0.2)])
tone_seq('checkpoint', [(0.1,N(7),'sq',0.3),(0.1,N(12),'sq',0.3),(0.15,N(16),'sq',0.3)])
tone_seq('boss_warn', [(0.2,N(-5),'saw',0.4),(0.2,N(-5),'saw',0.4),(0.3,N(-7),'saw',0.4)])
tone_seq('powerup', [(0.07,N(12),'sq',0.35),(0.07,N(16),'sq',0.35),(0.07,N(19),'sq',0.35),(0.14,N(24),'sq',0.4)])
tone_seq('laser', [(0.1,N(-8),'saw',0.4),(0.08,N(-4),'saw',0.35)])
tone_seq('splash', [(0.1,N(2),'tri',0.3),(0.08,N(-3),'tri',0.25)])
print('OK')
