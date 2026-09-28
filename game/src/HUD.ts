// HUD compartido: barra de vida, puntuación, nombre de fase y aviso "¡PELIGRO!".
import Phaser from 'phaser';
import { GW, PAL } from './Const';

export class HUD {
  private hpBar: Phaser.GameObjects.Graphics;
  private hpText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private warnGfx: Phaser.GameObjects.Graphics;
  scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, stageName: string) {
    this.scene = scene;
    this.hpBar = scene.add.graphics().setScrollFactor(0).setDepth(100);
    this.hpText = scene.add.text(8, 4, '', { fontFamily: 'monospace', fontSize: '7px', color: '#ffffff' }).setScrollFactor(0).setDepth(100).setResolution(3);
    this.nameText = scene.add.text(GW / 2, 8, stageName, { fontFamily: 'monospace', fontSize: '8px', color: '#ffd23f' }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setResolution(3);
    this.warnGfx = scene.add.graphics().setScrollFactor(0).setDepth(99);
    scene.cameras.main.setBackgroundColor('#0a0a12');
    // marco superior sutil
    const frame = scene.add.rectangle(GW / 2, 0, GW, 2, PAL.dark).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
    void frame;
  }

  update(hp: number, maxHp: number): void {
    this.hpBar.clear();
    this.hpBar.fillStyle(0x1c1c1c).fillRect(6, 6, 84, 10);
    const ratio = Math.max(0, hp / maxHp);
    this.hpBar.fillStyle(ratio > 0.5 ? 0x7ac943 : ratio > 0.25 ? 0xffd23f : 0xd53b2e).fillRect(8, 8, 80 * ratio, 6);
    this.hpBar.lineStyle(1, 0xffffff, 0.6).strokeRect(6, 6, 84, 10);
    this.hpText.setText('HP ' + Math.max(0, Math.ceil(hp)) + '/' + maxHp);
  }

  showDanger(on: boolean): void {
    this.warnGfx.clear();
    if (!on) return;
    const t = this.scene.time.now;
    if (Math.floor(t / 200) % 2 === 0) {
      this.warnGfx.fillStyle(0xd53b2e, 0.18).fillRect(0, 0, GW, 243);
      this.warnGfx.fillStyle(0xffd23f).fillRect(GW / 2 - 60, 30, 120, 16);
      this.warnGfx.fillStyle(0x1c1c1c).fillRect(GW / 2 - 58, 32, 116, 12);
    }
  }

  dangerLabel(): string { return Math.floor(this.scene.time.now / 200) % 2 === 0 ? '! PELIGRO !' : ''; }
}
