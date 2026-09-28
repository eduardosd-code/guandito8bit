import Phaser from 'phaser';
import { GW, GH, TILE } from '../Const';

interface FrameDef { x: number; y: number; w: number; h: number }

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload(): void {
    this.load.image('logo_g', 'assets/ELGUANDITO.png');
    this.load.image('guandito_sheet', 'assets/guandito.png');
    this.load.json('guandito_json', 'assets/sprites.json');
    this.load.image('bosses_sheet', 'assets/bosses.png');
    this.load.json('bosses_json', 'assets/bosses.json');
    this.load.image('tiles_sheet', 'assets/tiles.png');
    this.load.json('tiles_json', 'assets/tiles.json');
    const mus = ['title', 'intro', 'stage_frost', 'stage_blast', 'stage_burn', 'stage_gum', 'boss', 'final', 'victory', 'gameover'];
    const sfx = ['shoot', 'jump', 'land', 'hit', 'hurt', 'explode', 'pickup', 'dash', 'select', 'freeze', 'checkpoint', 'boss_warn', 'powerup', 'laser', 'splash'];
    mus.forEach((m) => this.load.audio('m_' + m, 'assets/' + m + '.wav'));
    sfx.forEach((s) => this.load.audio('sfx_' + s, 'assets/sfx_' + s + '.wav'));
  }

  create(): void {
    // ---- Sprites de Guandito (diseños oficiales recortados, celdas 22x30 base-aligned) ----
    const gd = this.cache.json.get('guandito_json') as Record<string, FrameDef>;
    for (const k of Object.keys(gd)) {
      if (k === 'frosty' || k === 'bacon' || k === 'burrito' || k === 'gummy' || k === 'flan') continue;
      const f = gd[k];
      this.textures.addSprite('g_' + k,
        this.textures.get('guandito_sheet').getSourceImage() as HTMLImageElement,
        { x: f.x, y: f.y, width: f.w, height: f.h });
    }

    // ---- Jefes (celdas 80x80) ----
    const bj = this.cache.json.get('bosses_json') as Record<string, { frame: number }>;
    let idx = 0;
    for (const k of Object.keys(bj)) {
      const cell = bj[k].frame;
      this.textures.addSprite('b_' + k,
        this.textures.get('bosses_sheet').getSourceImage() as HTMLImageElement,
        { x: cell * 80, y: 0, width: 80, height: 80 });
      idx++;
    }

    // ---- Tiles ----
    const tj = this.cache.json.get('tiles_json') as Record<string, FrameDef>;
    for (const k of Object.keys(tj)) {
      const f = tj[k];
      this.textures.addSprite('t_' + k,
        this.textures.get('tiles_sheet').getSourceImage() as HTMLImageElement,
        { x: f.x, y: f.y, width: f.w, height: f.h });
    }
    // Recorte del tile de 16x16 a partir del bloque 34x34 oficial (esquina superior-izq)
    this.textures.addSprite('t_16',
      this.textures.get('tiles_sheet').getSourceImage() as HTMLImageElement,
      { x: tj.tile.x, y: tj.tile.y, width: 16, height: 16 });
    this.textures.addSprite('t_block16',
      this.textures.get('tiles_sheet').getSourceImage() as HTMLImageElement,
      { x: tj.block.x, y: tj.block.y, width: 16, height: 16 });

    // Texturas generadas por código (sustitutos originales provisionales)
    this.makeGraphicsTex('tex_bullet', 10, 6, (g) => { g.fillStyle(0xffd23f); g.fillRect(0, 0, 10, 6); g.fillStyle(0xffffff); g.fillRect(2, 1, 6, 4); });
    this.makeGraphicsTex('tex_ebullet', 8, 8, (g) => { g.fillStyle(0xd53b2e); g.fillCircle(4, 4, 4); g.fillStyle(0xffd23f); g.fillCircle(3, 3, 2); });
    this.makeGraphicsTex('tex_ice', 10, 10, (g) => { g.fillStyle(0x8fd8ff); g.fillTriangle(5, 0, 10, 10, 0, 10); g.fillStyle(0xffffff); g.fillTriangle(5, 2, 8, 9, 2, 9); });
    this.makeGraphicsTex('tex_fire', 10, 10, (g) => { g.fillStyle(0xd53b2e); g.fillCircle(5, 5, 5); g.fillStyle(0xffd23f); g.fillCircle(5, 5, 2); });
    this.makeGraphicsTex('tex_gumball', 12, 12, (g) => { g.fillStyle(0xb04ad8); g.fillCircle(6, 6, 6); g.fillStyle(0xf7e7b3); g.fillCircle(4, 4, 2); });
    this.makeGraphicsTex('tex_flanfrag', 12, 10, (g) => { g.fillStyle(0xffd23f); g.fillRect(0, 2, 12, 8); g.fillStyle(0xd53b2e); g.fillRect(2, 0, 8, 3); });
    this.makeGraphicsTex('tex_checkpoint', 12, 22, (g) => { g.fillStyle(0x8a8a8a); g.fillRect(5, 4, 2, 18); g.fillStyle(0x7ac943); g.fillRect(7, 4, 8, 6); });
    this.makeGraphicsTex('tex_health', 12, 10, (g) => { g.fillStyle(0xffffff); g.fillRect(0, 3, 12, 4); g.fillRect(4, 0, 4, 10); g.fillStyle(0xd53b2e); g.fillRect(1, 4, 10, 2); });
    this.makeGraphicsTex('tex_door', 32, 48, (g) => { g.fillStyle(0x1c1c1c); g.fillRect(0, 0, 32, 48); g.fillStyle(0x7ac943); g.fillRect(3, 3, 26, 42); g.fillStyle(0xf7e7b3); g.fillRect(22, 22, 3, 6); });
    this.makeGraphicsTex('tex_plat16', 16, 8, (g) => { g.fillStyle(0x555a6e); g.fillRect(0, 0, 16, 8); g.fillStyle(0x8a8fa8); g.fillRect(0, 0, 16, 2); });
    this.makeGraphicsTex('tex_platfrost', 16, 8, (g) => { g.fillStyle(0x6fa8dc); g.fillRect(0, 0, 16, 8); g.fillStyle(0x8fd8ff); g.fillRect(0, 0, 16, 3); });
    this.makeGraphicsTex('tex_tramp', 24, 10, (g) => { g.fillStyle(0xb04ad8); g.fillRect(0, 2, 24, 8); g.fillStyle(0xe07af0); g.fillRect(0, 0, 24, 3); });
    this.makeGraphicsTex('tex_conveyor', 32, 10, (g) => { g.fillStyle(0x3a3a4a); g.fillRect(0, 0, 32, 10); g.fillStyle(0xffd23f); for (let i = 0; i < 4; i++) g.fillRect(i * 8 + 2, 4, 4, 2); });
    this.makeGraphicsTex('tex_pipe', 20, 16, (g) => { g.fillStyle(0x8a2be2); g.fillRect(2, 0, 16, 16); g.fillStyle(0x3a1d5a); g.fillRect(4, 2, 12, 12); });
    this.makeGraphicsTex('tex_ladder', 16, 16, (g) => { g.fillStyle(0xc8a25a); g.fillRect(1, 0, 3, 16); g.fillRect(12, 0, 3, 16); g.fillRect(1, 3, 14, 2); g.fillRect(1, 11, 14, 2); });
    this.makeGraphicsTex('tex_spikes16', 16, 8, (g) => { g.fillStyle(0xb8bcc8); for (let i = 0; i < 4; i++) g.fillTriangle(i * 4, 8, i * 4 + 2, 0, i * 4 + 4, 8); });
    this.makeGraphicsTex('tex_enemy_blob', 18, 16, (g) => { g.fillStyle(0x3f7dd6); g.fillRoundedRect(0, 4, 18, 12, 5); g.fillStyle(0xffffff); g.fillCircle(6, 9, 2); g.fillCircle(12, 9, 2); g.fillStyle(0x1c1c1c); g.fillCircle(6, 9, 1); g.fillCircle(12, 9, 1); });
    this.makeGraphicsTex('tex_enemy_jet', 20, 16, (g) => { g.fillStyle(0xd53b2e); g.fillRoundedRect(2, 4, 16, 10, 3); g.fillStyle(0x8fd8ff); g.fillRect(6, 6, 8, 4); g.fillStyle(0xffd23f); g.fillRect(0, 8, 3, 3); g.fillRect(17, 8, 3, 3); });
    this.makeGraphicsTex('tex_enemy_turret', 18, 18, (g) => { g.fillStyle(0x555a6e); g.fillRect(0, 8, 18, 10); g.fillStyle(0xd53b2e); g.fillRect(4, 2, 10, 8); g.fillStyle(0x1c1c1c); g.fillRect(7, 4, 4, 4); });
    this.makeGraphicsTex('tex_walker', 22, 26, (g) => { g.fillStyle(0x7ac943); g.fillRoundedRect(2, 0, 18, 18, 4); g.fillStyle(0xf7e7b3); g.fillRect(6, 4, 4, 4); g.fillRect(13, 4, 4, 4); g.fillStyle(0x1c1c1c); g.fillRect(7, 5, 2, 2); g.fillRect(14, 5, 2, 2); g.fillStyle(0x5a9a30); g.fillRect(3, 18, 6, 8); g.fillRect(13, 18, 6, 8); });
    this.makeGraphicsTex('tex_puddle', 26, 10, (g) => { g.fillStyle(0xb04ad8); g.fillEllipse(13, 5, 26, 10); g.fillStyle(0xe07af0); g.fillEllipse(10, 4, 10, 4); });
    this.makeGraphicsTex('tex_rock', 16, 14, (g) => { g.fillStyle(0x8a6a3a); g.fillCircle(8, 7, 7); g.fillStyle(0x6a4a2a); g.fillCircle(5, 5, 2); });
    this.makeGraphicsTex('tex_bgblock', 32, 32, (g) => { g.fillStyle(0x22283a); g.fillRect(0, 0, 32, 32); g.fillStyle(0x2c3348); g.fillRect(2, 2, 28, 28); });

    // Animaciones simples de 1 frame no hacen falta; la carrera se alterna por código.
    this.scene.start('Title');
  }

  private makeGraphicsTex(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}

export function fitCam(cam: Phaser.Cameras.Scene2D.Camera, worldW: number): void {
  cam.setBounds(0, 0, Math.max(worldW, GW), GH);
}
