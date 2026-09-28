// Entrada unificada: teclado + mando. Cada escena crea un InputMap.
import Phaser from 'phaser';

export interface FrameInput {
  left: boolean; right: boolean; up: boolean; down: boolean;
  jumpPressed: boolean; shootHeld: boolean; dashPressed: boolean; powerPressed: boolean; pausePressed: boolean;
}

const K = Phaser.Input.Keyboard.KeyCodes;
type Pad = Phaser.Input.Gamepad.Gamepad;

export class InputMap {
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private prevPad: Record<number, boolean> = {};

  constructor(private scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keys = {
      left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT), up: kb.addKey(K.UP), down: kb.addKey(K.DOWN),
      a: kb.addKey(K.A), d: kb.addKey(K.D), w: kb.addKey(K.W), s: kb.addKey(K.S),
      z: kb.addKey(K.Z), x: kb.addKey(K.X), c: kb.addKey(K.C), v: kb.addKey(K.V),
      space: kb.addKey(K.SPACE), j: kb.addKey(K.J), k: kb.addKey(K.K), l: kb.addKey(K.L),
      p: kb.addKey(K.P), esc: kb.addKey(K.ESC), enter: kb.addKey(K.ENTER),
    };
  }

  private isDown(...names: string[]): boolean {
    return names.some((n) => this.keys[n].isDown);
  }

  private pad(): Pad | null {
    const mgr = this.scene.input.gamepad;
    if (!mgr) return null;
    const list = (mgr as any).gamepads as (Pad | undefined)[];
    return (list && (list[0] || list[1])) || null;
  }

  read(): FrameInput {
    const pad = this.pad();
    const pd = (btn: number): boolean => {
      if (!pad) return false;
      const b = pad.buttons[btn];
      const was = this.prevPad[btn] ?? false;
      const now = !!b && b.value > 0.5;
      this.prevPad[btn] = now;
      return now && !was;
    };
    const ph = (btn: number): boolean => {
      if (!pad) return false;
      const b = pad.buttons[btn];
      return !!b && b.value > 0.5;
    };
    // Gamepad estándar: 0 A, 1 B, 2 X, 3 Y, 9 Start; D-pad 12-15
    const ls = pad ? pad.leftStick : null;
    const axL = !!ls && ls.x < -0.3;
    const axR = !!ls && ls.x > 0.3;
    const axU = !!ls && ls.y < -0.4;
    const axD = !!ls && ls.y > 0.4;

    return {
      left: this.isDown('left', 'a') || axL || (pad ? pad.left === 1 : false),
      right: this.isDown('right', 'd') || axR || (pad ? pad.right === 1 : false),
      up: this.isDown('up', 'w') || axU || (pad ? pad.up === 1 : false),
      down: this.isDown('down', 's') || axD || (pad ? pad.down === 1 : false),
      jumpPressed: Phaser.Input.Keyboard.JustDown(this.keys.z) || Phaser.Input.Keyboard.JustDown(this.keys.space) || Phaser.Input.Keyboard.JustDown(this.keys.enter) || pd(0),
      shootHeld: this.isDown('x', 'j') || ph(2),
      dashPressed: Phaser.Input.Keyboard.JustDown(this.keys.c) || Phaser.Input.Keyboard.JustDown(this.keys.k) || pd(3),
      powerPressed: Phaser.Input.Keyboard.JustDown(this.keys.v) || Phaser.Input.Keyboard.JustDown(this.keys.l) || pd(1),
      pausePressed: Phaser.Input.Keyboard.JustDown(this.keys.p) || Phaser.Input.Keyboard.JustDown(this.keys.esc) || pd(9),
    };
  }
}
