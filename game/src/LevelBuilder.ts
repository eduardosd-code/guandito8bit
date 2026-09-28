// Construcción de niveles a partir de un mapa ASCII compacto.
import Phaser from 'phaser';
import { TILE, GH } from './Const';

export interface BuiltLevel {
  solids: Phaser.Physics.Arcade.StaticGroup;      // terreno sólido (tile)
  blocks: Phaser.Physics.Arcade.StaticGroup;      // bloques destructibles-ish (solo visual distinto)
  plats: Phaser.Physics.Arcade.StaticGroup;       // plataformas one-way
  spikes: Phaser.Physics.Arcade.StaticGroup;      // daño de contacto
  ladders: Phaser.GameObjects.Image[];            // zonas de escalera (sensores)
  checkpoints: Phaser.Physics.Arcade.StaticImage[];
  doors: Phaser.Physics.Arcade.StaticImage[];     // puerta al jefe
  spawns: { x: number; y: number }[];             // posición inicial del jugador
  enemySpots: { x: number; y: number; type: string }[];
  hazardSpots: { x: number; y: number; type: string }[]; // vapor/lava/gelatina etc.
  width: number; height: number;
}

// Leyenda:
// # tile sólido   B bloque   - plataforma one-way   ^ púas   L escalera
// C checkpoint     D puerta   P player spawn        . vacío
// a blob-enemigo   j jet (vuela horizontal)   t torreta (dispara)   w walker (camina, más duro)
// v vapor (bacon)  l lava que sube por tramos (burrito)  g gelatina trampolín (gummy)  i suelo hielo (frosty)
// ~ agua decorativa   X púa en techo

const ROW_H = 12; // altura de fila lógica -> se multiplica para dar px

export function buildFromMap(scene: Phaser.Scene, rows: string[], opts?: { scale?: number }): BuiltLevel {
  const cell = opts?.scale ?? 16;
  const W = rows[0].length * cell;
  const H = rows.length * cell;
  const out: BuiltLevel = {
    solids: scene.physics.add.staticGroup(),
    blocks: scene.physics.add.staticGroup(),
    plats: scene.physics.add.staticGroup(),
    spikes: scene.physics.add.staticGroup(),
    ladders: [], checkpoints: [], doors: [], spawns: [], enemySpots: [], hazardSpots: [],
    width: W, height: H,
  };
  const addStatic = (grp: Phaser.Physics.Arcade.StaticGroup, tex: string, cx: number, cy: number, sw = cell, sh = cell) => {
    const im = grp.create(cx * cell + sw / 2, cy * cell + sh / 2, tex) as Phaser.Physics.Arcade.StaticImage;
    im.setSize(sw, sh).refreshBody();
    return im;
  };
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const px = x * cell, py = y * cell;
      switch (ch) {
        case '#': addStatic(out.solids, 't_16', x, y); break;
        case 'B': addStatic(out.blocks, 't_block16', x, y); break;
        case '-': { const p = addStatic(out.plats, 'tex_plat16', x, y, cell, 8); (p.body as Phaser.Physics.Arcade.StaticBody).updateFromBounds(); break; }
        case '^': addStatic(out.spikes, 'tex_spikes16', x, y, cell, 8); break;
        case 'X': { const s = addStatic(out.spikes, 'tex_spikes16', x, y, cell, 8); s.setFlipY(true); break; }
        case 'L': {
          const im = scene.add.image(px + 8, py + 8, 'tex_ladder').setDepth(2);
          out.ladders.push(im);
          break;
        }
        case 'C': {
          const c = out.checkpoints.length;
          const im = out.checkpoints.push(scene.physics.add.staticImage(px + 6, py + 11, 'tex_checkpoint') as Phaser.Physics.Arcade.StaticImage) === undefined ? null : null;
          (out.checkpoints[out.checkpoints.length - 1] as any).cpIndex = c;
          break;
        }
        case 'D': {
          const d = addStatic(out.doors, 'tex_door', 0, 0, 0, 0); // placeholder replaced below
          d.destroy();
          out.doors.pop();
          const door = scene.physics.add.staticImage(px + 16, py + 24, 'tex_door') as Phaser.Physics.Arcade.StaticImage;
          (door.body as Phaser.Physics.Arcade.StaticBody).setSize(30, 46).updateFromBounds();
          out.doors.push(door);
          break;
        }
        case 'P': out.spawns.push({ x: px + 8, y: py + 8 }); break;
        case 'a': out.enemySpots.push({ x: px + 9, y: py + 8, type: 'blob' }); break;
        case 'j': out.enemySpots.push({ x: px + 10, y: py + 8, type: 'jet' }); break;
        case 't': out.enemySpots.push({ x: px + 9, y: py + 9, type: 'turret' }); break;
        case 'w': out.enemySpots.push({ x: px + 11, y: py + 13, type: 'walker' }); break;
        case 'v': out.hazardSpots.push({ x: px + 10, y: py + 8, type: 'steam' }); break;
        case 'l': out.hazardSpots.push({ x: px + 8, y: py + 8, type: 'lava' }); break;
        case 'g': out.hazardSpots.push({ x: px + 12, y: py + 11, type: 'tramp' }); break;
        case 'i': out.hazardSpots.push({ x: px + 8, y: py + 8, type: 'ice' }); break;
        case '~': scene.add.image(px + 8, py + 8, 'tex_puddle').setDepth(1).setAlpha(0.5); break;
      }
    });
  });
  void ROW_H; void GH;
  return out;
}

// Helper: piso continuo con huecos indicados como [inicio,fin) en celdas
export function floorRows(rows: string[], rowIdx: number, gaps: [number, number][]): void {
  const r = rows[rowIdx].split('');
  for (let i = 0; i < r.length; i++) {
    if (r[i] === '.') {
      const inGap = gaps.some(([a, b]) => i >= a && i < b);
      if (!inGap) r[i] = '#';
    }
  }
  rows[rowIdx] = r.join('');
}
