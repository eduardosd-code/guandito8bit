import Phaser from 'phaser';
import { GW, GH, PAL, loadOpts, writeOpts, AudioOpts, uiText } from '../Const';

// Botón simple estilo NES
export function makeButton(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, cb: () => void): Phaser.GameObjects.Container {
  const bg = scene.add.rectangle(0, 0, w, h, 0x1c1c1c).setStrokeStyle(1, PAL.green);
  const txt = scene.add.text(0, 0, label, { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' }).setOrigin(0.5).setResolution(3);
  const c = scene.add.container(x, y, [bg, txt]);
  c.setSize(w, h);
  (c as any).interactive = true;
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => { bg.setFillStyle(PAL.green); txt.setColor('#1c1c1c'); });
  c.on('pointerout', () => { bg.setFillStyle(0x1c1c1c); txt.setColor('#ffffff'); });
  c.on('pointerdown', () => { scene.sound.play('sfx_select'); cb(); });
  return c;
}

export class Title extends Phaser.Scene {
  private opts!: AudioOpts;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private sel = 0;

  constructor() { super('Title'); }

  create(): void {
    this.opts = loadOpts();
    this.cameras.main.setBackgroundColor(0x0d1226);
    // fondo decorativo: bloques de referencia Mega.bmp
    for (let i = 0; i < 14; i++) {
      this.add.image(20 + (i * 37) % GW, GH - 14 - ((i * 53) % 40), 't_16').setAlpha(0.25).setScale(16 / 34);
    }

    // Logo oficial: recorte "MEGA GUANDITO" de ELGUANDITO.png (no se redibuja)
    if (!this.textures.exists('logo_mg')) {
      this.textures.addSprite('logo_mg', this.textures.get('logo_g').getSourceImage() as HTMLImageElement,
        { x: 10, y: 8, width: 185, height: 34 });
    }
    this.add.image(GW / 2, 62, 'logo_mg').setScale(1.9);
    uiText(this, GW / 2, 108, 'UN JUEGO DE PLATAFORMAS Y ACCION', 8, '#8fd8ff');

    const labels = ['JUGAR', 'CONTROLES', 'OPCIONES DE AUDIO'];
    labels.forEach((l, i) => {
      const t = uiText(this, GW / 2, 140 + i * 16, l, 10);
      this.menuItems.push(t);
    });
    this.updateMenu();

    uiText(this, GW / 2, 226, 'Z/X/C o ENTER   ·   Flechas/WASD   ·   Mando conectado', 7, '#8a8fa8');

    // teclado
    this.input.keyboard!.on('keydown-UP', () => this.move(-1));
    this.input.keyboard!.on('keydown-W', () => this.move(-1));
    this.input.keyboard!.on('keydown-DOWN', () => this.move(1));
    this.input.keyboard!.on('keydown-S', () => this.move(1));
    this.input.keyboard!.on('keydown-ENTER', () => this.activate());
    this.input.keyboard!.on('keydown-SPACE', () => this.activate());
    this.input.keyboard!.on('keydown-Z', () => this.activate());

    // mando
    this.padLoop();
  }

  private padLoop(): void {
    this.time.addEvent({ delay: 150, loop: true, callback: () => {
      const pads = this.input.gamepad?.getGamepads();
      const p = pads && (pads[0] || pads[1]);
      if (!p) return;
      if (Phaser.Input.JustDown(p, 12)) this.move(-1);
      if (Phaser.Input.JustDown(p, 13)) this.move(1);
      if (Phaser.Input.JustDown(p, 0)) this.activate();
    }});
  }

  private move(d: number): void {
    this.sel = (this.sel + d + this.menuItems.length) % this.menuItems.length;
    this.sound.play('sfx_select');
    this.updateMenu();
  }

  private updateMenu(): void {
    this.menuItems.forEach((t, i) => {
      t.setText((i === this.sel ? '> ' : '  ') + t.text.replace(/^>\s/, ''));
      t.setColor(i === this.sel ? '#ffd23f' : '#ffffff');
    });
  }

  private activate(): void {
    this.sound.play('sfx_select');
    if (this.sel === 0) this.scene.start('Intro');
    else if (this.sel === 1) this.showControls();
    else this.showOptions();
  }

  private showControls(): void {
    const lines = [
      'FLECHAS / WASD .... MOVERTE',
      'Z / ESPACIO ....... SALTAR',
      'X / J ............. DISPARAR',
      'C / K ............. DASH (esquiva rapida)',
      'ABAJO + Z ......... DESLIZAMIENTO',
      'ARRIBA + ESCALERA . SUBIR',
      'V / L ............. PODER ESPECIAL (si lo tienes)',
      'P / ESC ........... PAUSA',
      '',
      'GAMEPAD: D-pad mueve, A salta, X dispara,',
      'Y dash, B poder, Start pausa.',
    ];
    this.clearSub();
    this.sub = this.add.container(0, 0);
    this.sub.add(this.add.rectangle(GW / 2, GH / 2, 380, 170, 0x000000, 0.85).setStrokeStyle(1, PAL.cyan));
    lines.forEach((l, i) => this.sub.add(uiText(this, GW / 2, 60 + i * 13, l, 8)));
    this.sub.add(uiText(this, GW / 2, 210, 'PULSA CUALQUIER TECLA PARA VOLVER', 8, '#ffd23f'));
    const back = () => { this.clearSub(); this.input.keyboard!.off('keydown', back); };
    this.input.keyboard!.once('keydown', back);
  }

  private showOptions(): void {
    this.clearSub();
    this.sub = this.add.container(0, 0);
    this.sub.add(this.add.rectangle(GW / 2, GH / 2, 300, 120, 0x000000, 0.85).setStrokeStyle(1, PAL.cyan));
    this.sub.add(uiText(this, GW / 2, 70, 'OPCIONES DE AUDIO', 10, '#ffd23f'));
    const mkBar = (label: string, y: number, key: keyof AudioOpts) => {
      const val = uiText(this, GW / 2 + 90, y, '', 8);
      const draw = () => val.setText(('I'.repeat(Math.round(this.opts[key] * 10))).padEnd(10, '-') );
      draw();
      this.sub.add(uiText(this, GW / 2 - 100, y, label, 8));
      this.sub.add(val);
      makeButton(this, GW / 2 - 10, y, 16, 12, '-', () => { this.opts[key] = Math.max(0, this.opts[key] - 0.1); draw(); this.apply(); });
      makeButton(this, GW / 2 + 45, y, 16, 12, '+', () => { this.opts[key] = Math.min(1, this.opts[key] + 0.1); draw(); this.apply(); });
    };
    mkBar('MUSICA', 100, 'music');
    mkBar('EFECTOS', 125, 'sfx');
    this.sub.add(uiText(this, GW / 2, 160, 'CLIC FUERA O PULSA ESC PARA SALIR', 7, '#8a8fa8'));
    const close = () => { this.clearSub(); };
    this.input.once('pointerdown', (p: Phaser.Input.Pointer) => { if (Math.abs(p.x - GW / 2) > 150 || Math.abs(p.y - GH / 2) > 60) close(); });
    this.input.keyboard!.once('keydown-ESC', close);
  }

  private sub?: Phaser.GameObjects.Container;
  private clearSub(): void { this.sub?.destroy(); this.sub = undefined; }
  private apply(): void {
    writeOpts(this.opts);
    this.sound.setVolume(this.opts.music);
    const m = this.sound.get('m_title') as Phaser.Sound.BaseSound | null;
    if (m && 'setVolume' in m) (m as Phaser.Sound.WebAudioSound).setVolume(this.opts.music);
  }
}
