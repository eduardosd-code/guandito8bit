// Guandito: jugador con física estilo Mega Man clásico (movimiento, salto, disparo, dash, deslizamiento, escalada)
import Phaser from 'phaser';
import { InputMap } from './Input';

const SPEED = 92;
const AIR_SPEED = 88;
const JUMP_V = -305;
const DASH_V = 240;
const DASH_TIME = 170;      // ms
const DASH_CD = 520;        // ms
const SLIDE_TIME = 380;     // ms
const SHOOT_CD = 260;       // ms entre disparos
const COYOTE = 90;          // ms de tolerancia tras salir de plataforma
const FALL_TAIL = 0.55;     // corte de salto al soltar

export interface PlayerEvents {
  onHurt?: () => void;
  onDie?: () => void;
  onLand?: () => void;
  onJump?: () => void;
  onDash?: () => void;
  onShoot?: (b: Phaser.GameObjects.Image) => void;
  onPower?: (p: Phaser.GameObjects.Image[]) => void;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp = 28; maxHp = 28;
  facing = 1;
  invUntil = 0;
  dashing = false;
  sliding = false;
  climbing = false;
  onLadder: Phaser.GameObjects.Rectangle | null = null;
  powerKey: string | null = null;   // poder robado al último jefe vencido
  private lastDir = 1;
  private coyoteT = 0;
  private dashT = 0; private dashCd = 0;
  private slideT = 0;
  private shootCd = 0;
  private animT = 0;
  private events: PlayerEvents;
  private inputMap: InputMap;
  dead = false;

  constructor(scene: Phaser.Scene, x: number, y: number, events: PlayerEvents, inputMap: InputMap) {
    super(scene, x, y, 'g_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.events = events;
    this.inputMap = inputMap;
    const b = this.body as Phaser.Physics.Arcade.Body;
    b.setSize(12, 26).setOffset(5, 4);
    b.setMaxVelocity(400, 480);
    this.setDepth(10);
  }

  get alive(): boolean { return !this.dead; }

  heal(n: number): void { this.hp = Math.min(this.maxHp, this.hp + n); }

  hurt(dmg: number, fromX: number): void {
    if (this.dead || this.dashing || this.invUntil > this.scene.time.now) return;
    this.hp -= dmg;
    this.invUntil = this.scene.time.now + 1100;
    const b = this.body as Phaser.Physics.Arcade.Body;
    b.setVelocityX(fromX < this.x ? 60 : -60);
    b.setVelocityY(-90);
    this.playAnim('g_hurt');
    this.events.onHurt?.();
    if (this.hp <= 0) this.die();
  }

  knockbackFreeze(): void { /* reservado */ }

  die(): void {
    if (this.dead) return;
    this.dead = true;
    this.hp = 0;
    const b = this.body as Phaser.Physics.Arcade.Body;
    b.enable = false;
    this.playAnim('g_clone');
    this.setAlpha(0.9);
    this.scene.tweens.add({ targets: this, y: this.y - 60, angle: 360, duration: 700, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this, alpha: 0, delay: 500, duration: 300 });
    this.events.onDie?.();
  }

  respawn(x: number, y: number): void {
    this.dead = false; this.hp = this.maxHp;
    this.setPosition(x, y);
    this.setAngle(0).setScale(1).flipX = false;
    const b = this.body as Phaser.Physics.Arcade.Body;
    b.enable = true; b.reset(x, y); b.setVelocity(0, 0);
    this.invUntil = this.scene.time.now + 800;
    this.playAnim('g_idle');
  }

  playAnim(key: string): void {
    if (this.texture.key !== key) this.setTexture(key);
  }

  update(time: number, _dt: number): void {
    if (this.dead) return;
    const inp = this.inputMap.read();
    const b = this.body as Phaser.Physics.Arcade.Body;
    const grounded = b.blocked.down || b.touching.down;

    if (grounded) this.coyoteT = time + COYOTE; else if (this.coyoteT < time) { /* sin coyote */ }

    // ---- Escalada en escaleras ----
    if (this.onLadder) {
      this.climbing = true;
      b.setAllowGravity(false);
      const vy = (inp.up ? -70 : 0) + (inp.down ? 70 : 0);
      b.setVelocityY(vy);
      b.setVelocityX(inp.left ? -SPEED * 0.5 : inp.right ? SPEED * 0.5 : 0);
      if (inp.left) this.facing = -1; if (inp.right) this.facing = 1;
      this.playAnim('g_climb');
      this.lastDir = inp.left ? -1 : inp.right ? 1 : this.lastDir;
      // salir por arriba: si está bloqueado arriba no pasa nada; saltar suelta
      if (inp.jumpPressed) {
        this.releaseLadder();
        b.setAllowGravity(true);
        b.setVelocityY(JUMP_V);
        this.events.onJump?.();
      }
      if (inp.shootHeld) this.tryShoot(time);
      this.applyFlip();
      return;
    }

    if (!b.allowGravity) b.setAllowGravity(true);

    // ---- Dash (invulnerable durante) ----
    if (this.dashing) {
      this.dashT -= 16;
      if (this.dashT <= 0) { this.dashing = false; this.playAnim(grounded ? 'g_idle' : 'g_fall'); }
      else b.setVelocityX(this.lastDir * DASH_V);
      this.applyFlip();
      return;
    }
    if (inp.dashPressed && time > this.dashCd && grounded) {
      this.dashing = true;
      this.dashT = DASH_TIME;
      this.dashCd = time + DASH_CD;
      this.lastDir = inp.left ? -1 : inp.right ? 1 : this.facing;
      this.playAnim('g_dash');
      this.events.onDash?.();
    }

    // ---- Deslizamiento ----
    if (this.sliding) {
      this.slideT -= 16;
      b.setVelocityX(this.lastDir * (this.slideT > 0 ? SPEED * 1.25 : 0));
      if (this.slideT <= 0) {
        this.sliding = false;
        b.setSize(12, 26).setOffset(5, 4);
        this.playAnim('g_idle');
      }
      this.applyFlip();
      if (inp.shootHeld) this.tryShoot(time);
      return;
    }
    if (inp.down && grounded && (inp.left || inp.right) && Math.abs(b.velocity.x) > 30) {
      this.sliding = true;
      this.slideT = SLIDE_TIME;
      this.lastDir = this.facing;
      b.setSize(16, 14).setOffset(3, 16);
      this.playAnim('g_slide');
      this.applyFlip();
      return;
    }

    // ---- Movimiento horizontal ----
    let vx = 0;
    if (inp.left) { vx = -(grounded ? SPEED : AIR_SPEED); this.facing = -1; }
    if (inp.right) { vx = (grounded ? SPEED : AIR_SPEED); this.facing = 1; }
    if (vx !== 0) this.lastDir = vx > 0 ? 1 : -1;
    // resbalón en hielo lo manejan las plataformas con setFriction; aquí respetamos velocidad objetivo
    b.setVelocityX(vx);

    // ---- Salto (con coyote y corte) ----
    if (inp.jumpPressed && (grounded || this.coyoteT > time)) {
      b.setVelocityY(JUMP_V);
      this.coyoteT = 0;
      this.events.onJump?.();
    } else if (!inp.jumpPressed && b.velocity.y < 0) {
      b.setVelocityY(b.velocity.y * FALL_TAIL);
    }

    // ---- Disparo ----
    if (inp.shootHeld) this.tryShoot(time);

    // ---- Poder especial ----
    if (inp.powerPressed && this.powerKey) this.firePower();

    // ---- Animación ----
    this.animT += 16;
    if (grounded) {
      if (Math.abs(b.velocity.x) > 10) {
        this.playAnim(Math.floor(this.animT / 110) % 2 === 0 ? 'g_run_a' : 'g_run_b');
      } else {
        this.playAnim('g_idle');
      }
    } else {
      this.playAnim(b.velocity.y < 0 ? 'g_jump' : 'g_fall');
    }
    if (time < this.invUntil) {
      this.setAlpha(Math.floor(time / 80) % 2 === 0 ? 0.4 : 1);
    } else this.setAlpha(1);

    this.applyFlip();
  }

  private applyFlip(): void { this.setFlipX(this.facing < 0); }

  releaseLadder(): void {
    this.onLadder = null;
    this.climbing = false;
    const b = this.body as Phaser.Physics.Arcade.Body;
    b.setAllowGravity(true);
  }

  private tryShoot(time: number): void {
    if (time < this.shootCd) return;
    this.shootCd = time + SHOOT_CD;
    this.playAnim('g_shoot');
    const bullet = this.scene.add.image(this.x + this.facing * 10, this.y - 4, 'tex_bullet').setDepth(9);
    (bullet as any).isPlayerBullet = true;
    this.scene.physics.add.existing(bullet);
    const bb = bullet.body as Phaser.Physics.Arcade.Body;
    bb.setVelocityX(this.facing * 260);
    this.events.onShoot?.(bullet);
  }

  firePower(): void {
    if (!this.powerKey) return;
    this.playAnim('g_shoot');
    const shots: Phaser.GameObjects.Image[] = [];
    const mk = (vx: number, vy: number, tex: string) => {
      const im = this.scene.add.image(this.x + this.facing * 10, this.y - 4, tex).setDepth(9);
      (im as any).isPlayerBullet = true;
      (im as any).bigDamage = true;
      this.scene.physics.add.existing(im);
      const bb = im.body as Phaser.Physics.Arcade.Body;
      bb.setVelocity(vx, vy);
      shots.push(im);
      return im;
    };
    switch (this.powerKey) {
      case 'frosty':
        for (let i = -1; i <= 1; i++) mk(this.facing * 210, i * 45, 'tex_ice');
        break;
      case 'bacon':
        for (let i = 0; i < 3; i++) mk(this.facing * (140 + i * 60), -60 - i * 30, 'tex_fire');
        break;
      case 'burrito':
        mk(this.facing * 320, 0, 'tex_rock');
        break;
      case 'gummy':
        mk(this.facing * 120, -260, 'tex_gumball');
        break;
    }
    this.events.onPower?.(shots);
  }

  // Colisión con plataformas heladas: baja fricción
  setSlippery(on: boolean): void {
    const b = this.body as Phaser.Physics.Arcade.Body;
    b.setDrag(on ? 0 : 1200, 0);
  }
}
