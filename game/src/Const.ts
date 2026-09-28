// Constantes globales, tipos y utilidades compartidas.
import Phaser from 'phaser';

export const GW = 432;
export const GH = 243;
export const TILE = 16;
export const GROUND_Y = GH - 40; // borde superior del suelo estándar

export type BossKey = 'frosty' | 'bacon' | 'burrito' | 'gummy';
export const BOSS_KEYS: BossKey[] = ['frosty', 'bacon', 'burrito', 'gummy'];

export interface StageDef {
  key: BossKey;
  name: string;
  theme: string;      // música
  bg: number;         // color de fondo
  mechanic: string;   // descripción corta para la UI
}

export const STAGES: Record<BossKey, StageDef> = {
  frosty:  { key: 'frosty',  name: 'CUMBRE HELADA', theme: 'stage_frost', bg: 0x1b2a4a,
             mechanic: 'Plataformas que se congelan y resbalan' },
  bacon:   { key: 'bacon',   name: 'FABRICA HUMEA', theme: 'stage_blast', bg: 0x3a1d12,
             mechanic: 'Vapor y cintas que empujan' },
  burrito: { key: 'burrito', name: 'CAÑON ARDIENTE', theme: 'stage_burn', bg: 0x4a2c10,
             mechanic: 'Lava ascendente y bloques que caen' },
  gummy:   { key: 'gummy',   name: 'MUNDOS GOMITA', theme: 'stage_gum', bg: 0x2a1240,
             mechanic: 'Trampolines de gelatina' },
};

export interface SaveData {
  unlocked: boolean;              // intro superada
  defeated: BossKey[];            // jefes vencidos
  powers: BossKey[];              // poderes obtenidos (mismo orden que defeated)
  finalDone: boolean;
}

const SAVE_KEY = 'mega-guandito-save-v1';

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return {
        unlocked: !!d.unlocked,
        defeated: Array.isArray(d.defeated) ? d.defeated.filter((k: string) => k in STAGES) : [],
        powers: Array.isArray(d.powers) ? d.powers.filter((k: string) => k in STAGES) : [],
        finalDone: !!d.finalDone,
      };
    }
  } catch { /* ignore */ }
  return { unlocked: false, defeated: [], powers: [], finalDone: false };
}

export function writeSave(s: SaveData): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function clearSave(): void {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}

// ---- Opciones de audio persistidas ----
export interface AudioOpts { music: number; sfx: number }
const OPT_KEY = 'mega-guandito-opts-v1';
export function loadOpts(): AudioOpts {
  try {
    const raw = localStorage.getItem(OPT_KEY);
    if (raw) { const o = JSON.parse(raw); return { music: o.music ?? 0.7, sfx: o.sfx ?? 0.8 }; }
  } catch { /* ignore */ }
  return { music: 0.7, sfx: 0.8 };
}
export function writeOpts(o: AudioOpts): void {
  try { localStorage.setItem(OPT_KEY, JSON.stringify(o)); } catch { /* ignore */ }
}

// ---- Paleta oficial Guandito (de ELGUANDITO.png) ----
export const PAL = {
  green: 0x7ac943,
  cream: 0xf7e7b3,
  red: 0xd53b2e,
  yellow: 0xffd23f,
  dark: 0x1c1c1c,
  white: 0xffffff,
  blue: 0x3f7dd6,
  cyan: 0x8fd8ff,
};

// Texto con "sombra" estilo NES
export function uiText(scene: Phaser.Scene, x: number, y: number, text: string, size = 8, color = '#ffffff'): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, text, {
    fontFamily: 'monospace', fontSize: size + 'px', color, align: 'center',
  }).setOrigin(0.5).setResolution(3);
  return t;
}

export function allBossesDead(s: SaveData): boolean {
  return BOSS_KEYS.every((k) => s.defeated.includes(k));
}
