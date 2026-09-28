// Jefes con patrones telegrafiados: cada ataque se anuncia (parpadeo + sonido) antes de ejecutarse.
import Phaser from 'phaser';

export interface BossSpec { hp: number; w: number; h: number; ox: number; oy: number; }

export class Boss extends Phaser.Physics.Arcade.Sprite {
  hp: number; maxHp: number;
  phase = 0;            // fase actual del patrón
  busy = false;         // ejecutando un ataque (no inicia otro)
  warnUntil = 0;        // ventana de aviso visual activo
  defeated = false;
  onProjectile?: (kind: string, x: number, y: number, vx: number, vy: number) => void;
  onWarn?: () => void;
  onDieFx?: (x: number, y: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, key: string, spec: BossSpec) {
    super(scene, x, y, 'b_' + key);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.maxHp = spec.hp; this.hp = spec.hp;
    const b = this.body as Phaser.Physics.Arcade.Body;
    b.setSize(spec.w, spec.h).setOffset(spec.ox, spec.oy);
    this.setDepth(8);
  }

  // Anuncio visual: parpadeo amarillo durante `ms` antes del ataque
  protected async warn(ms: number): Promise<void> {
    this.warnUntil = this.scene.time.now + ms;
    this.onWarn?.();
    const tw = this.scene.tweens.add({
      targets: this, tint: { start: 0xffff88, end: 0xffffff },
      duration: 120, yoyo: true, repeat: Math.floor(ms / 240),
    });
    await tw.promise;
    this.setTintFill(0xffffff);
  }

  protected flashRed(ms = 150): void {
    this.setTintFill(0xff5555);
    this.scene.time.delayedCall(ms, () => this.setTintFill(0xffffff));
  }

  hurt(dmg: number): boolean { // devuelve true si muere
    if (this.defeated) return false;
    this.hp -= dmg;
    this.flashRed(120);
    if (this.hp <= 0) {
      this.defeated = true;
      const b = this.body as Phaser.Physics.Arcade.Body;
      b.enable = false;
      this.onDieFx?.(this.x, this.y);
      return true;
    }
    return false;
  }

  get halfHp(): boolean { return this.hp <= this.maxHp / 2; }

  protected shot(kind: string, x: number, y: number, vx: number, vy: number): void {
    this.onProjectile?.(kind, x, y, vx, vy);
  }

  protected wait(ms: number): Promise<void> {
    return new Promise((r) => this.scene.time.delayedCall(ms, r));
  }
}

// ---- Frosty (hielo): lanza 3 cuchillos en abanico y salta dejando charcos congelados ----
export class BossFrosty extends Boss {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'frosty', { hp: 28, w: 60, h: 40, ox: 10, oy: 32 });
  }
  async run(): Promise<void> {
    while (!this.defeated) {
      const fast = this.halfHp;
      await this.warn(700);
      if (this.defeated) break;
      // abanico de cuchillos de hielo
      for (let i = -1; i <= 1; i++) {
        const dir = this.facingDir();
        this.shot('ice', this.x, this.y - 6, dir * 150, i * 70);
        await this.wait(fast ? 90 : 160);
      }
      await this.wait(fast ? 700 : 1100);
      if (this.defeated) break;
      await this.warn(500);
      // salto y caída con onda de escarcha
      const b = this.body as Phaser.Physics.Arcade.Body;
      b.setVelocityY(-260); b.setVelocityX(this.facingDir() * 90);
      await this.wait(700);
      b.setVelocityX(0);
      this.shot('shockwave', this.x, this.y + 18, this.facingDir() * 120, 0);
      await this.wait(fast ? 600 : 900);
    }
  }
  private facingDir(): number {
    const p = (this.scene as any).player as Phaser.GameObjects.Sprite | undefined;
    return p && p.x < this.x ? -1 : 1;
  }
}

// ---- Bacon (fábrica): corre como torpe y escupe bolas de grasa en arco ----
export class BossBacon extends Boss {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bacon', { hp: 28, w: 38, h: 38, ox: 21, oy: 36 });
  }
  async run(): Promise<void> {
    while (!this.defeated) {
      const fast = this.halfHp;
      await this.warn(600);
      // invest: carga hacia el jugador
      const b = this.body as Phaser.Physics.Arcade.Body;
      const dir = this.facingDir();
      for (let t = 0; t < 10; t++) {
        if (this.defeated) break;
        b.setVelocityX(dir * (fast ? 190 : 150));
        await this.wait(60);
      }
      b.setVelocityX(0);
      await this.wait(fast ? 500 : 800);
      if (this.defeated) break;
      await this.warn(500);
      // escupir 2 grasa en arco
      for (let i = 0; i < 2; i++) {
        this.shot('grease', this.x, this.y - 14, this.facingDir() * (90 + i * 50), -170);
        await this.wait(220);
      }
      await this.wait(fast ? 600 : 900);
    }
  }
  private facingDir(): number {
    const p = (this.scene as any).player as Phaser.GameObjects.Sprite | undefined;
    return p && p.x < this.x ? -1 : 1;
  }
}

// ---- Burrito (desierto): hace temblar el suelo tirando rocas y rueda ----
export class BossBurrito extends Boss {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'burrito', { hp: 28, w: 30, h: 34, ox: 25, oy: 40 });
  }
  async run(): Promise<void> {
    while (!this.defeated) {
      const fast = this.halfHp;
      await this.warn(650);
      // temblor: 3 rocas caen en posiciones fijas sobre plataformas
      for (let i = 0; i < 3; i++) {
        this.shot('rockdrop', this.x - 90 + i * 90, this.y - 150, 0, 0);
        await this.wait(fast ? 180 : 260);
      }
      await this.wait(500);
      if (this.defeated) break;
      await this.warn(500);
      // rodada: se convierte en bolita y rueda
      const b = this.body as Phaser.Physics.Arcade.Body;
      const dir = this.facingDir();
      this.setScale(0.85, 0.85);
      for (let t = 0; t < 16; t++) {
        if (this.defeated) break;
        b.setVelocityX(dir * (fast ? 210 : 170));
        this.setAngle(this.angle + 18 * dir);
        await this.wait(55);
      }
      this.setScale(1, 1); this.setAngle(0);
      b.setVelocityX(0);
      await this.wait(fast ? 500 : 800);
    }
  }
  private facingDir(): number {
    const p = (this.scene as any).player as Phaser.GameObjects.Sprite | undefined;
    return p && p.x < this.x ? -1 : 1;
  }
}

// ---- Gummy (gomita): rebota por la sala y dispara burbujas que rebotan ----
export class BossGummy extends Boss {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'gummy', { hp: 28, w: 32, h: 24, ox: 24, oy: 52 });
  }
  async run(): Promise<void> {
    while (!this.defeated) {
      const fast = this.halfHp;
      await this.warn(500);
      // triple salto con dirección cambiante
      const b = this.body as Phaser.Physics.Arcade.Body;
      for (let i = 0; i < 3; i++) {
        if (this.defeated) break;
        b.setVelocityY(-300);
        b.setVelocityX(this.facingDir() * (fast ? 130 : 100));
        await this.wait(650);
      }
      b.setVelocityX(0);
      await this.wait(300);
      if (this.defeated) break;
      await this.warn(600);
      // 4 burbujas en cruz (rebotan una vez contra el suelo)
      const s = 130;
      this.shot('bubble', this.x, this.y, s, -s);
      this.shot('bubble', this.x, this.y, -s, -s);
      this.shot('bubble', this.x, this.y, s * 0.6, -s * 1.4);
      this.shot('bubble', this.x, this.y, -s * 0.6, -s * 1.4);
      await this.wait(fast ? 700 : 1000);
    }
  }
  private facingDir(): number {
    const p = (this.scene as any).player as Phaser.GameObjects.Sprite | undefined;
    return p && p.x < this.x ? -1 : 1;
  }
}

// ---- Mega Flan (final): 3 fases. Pudding saltarín, fragmentos y lluvia final ----
export class BossFlan extends Boss {
  stage = 1;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'flan', { hp: 60, w: 60, h: 40, ox: 10, oy: 32 });
  }
  checkStage(): void {
    const ratio = this.hp / this.maxHp;
    const ns = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
    if (ns !== this.stage) {
      this.stage = ns;
      (this.scene as any).onFlanStage?.(ns);
    }
  }
  async run(): Promise<void> {
    while (!this.defeated) {
      this.checkStage();
      const st = this.stage;
      await this.warn(st === 3 ? 400 : 600);
      if (this.defeated) break;
      const b = this.body as Phaser.Physics.Arcade.Body;
      // salto grande hacia el jugador
      const dir = this.facingDir();
      b.setVelocityY(-320); b.setVelocityX(dir * (st >= 2 ? 120 : 80));
      await this.wait(650);
      b.setVelocityX(0);
      if (this.defeated) break;
      if (st === 1) {
        this.shot('frag', this.x, this.y - 10, dir * 140, -60);
      } else if (st === 2) {
        for (let i = -1; i <= 1; i++) this.shot('frag', this.x, this.y - 10, dir * 130 + i * 40, -80 + i * 30);
        // láser cargado desde arriba
        await this.warn(800);
        (this.scene as any).fireLaser?.(this.x);
      } else {
        for (let i = 0; i < 4; i++) {
          if (this.defeated) break;
          this.shot('frag', this.x, this.y - 10, dir * 150, -120 + i * 40);
          await this.wait(120);
        }
        (this.scene as any).rainCaramel?.();
      }
      await this.wait(st === 3 ? 500 : 800);
    }
  }
  private facingDir(): number {
    const p = (this.scene as any).player as Phaser.GameObjects.Sprite | undefined;
    return p && p.x < this.x ? -1 : 1;
  }
}
