// Enemigos de nivel: blob (camina), jet (vuela en ida/vuelta), turret (dispara), walker (duro, patrulla).
import Phaser from 'phaser';

export type Enemy = Phaser.Physics.Arcade.Sprite & { hp: number; touchDmg: number; kind: string };

export function makeEnemy(scene: Phaser.Scene, type: string, x: number, y: number): Enemy {
  let tex = 'tex_enemy_blob', hp = 2, dmg = 4, w = 16, h = 12, oy = 4;
  if (type === 'jet') { tex = 'tex_enemy_jet'; hp = 2; dmg = 4; w = 18; h = 10; oy = 5; }
  if (type === 'turret') { tex = 'tex_enemy_turret'; hp = 3; dmg = 0; w = 16; h = 16; oy = 2; }
  if (type === 'walker') { tex = 'tex_walker'; hp = 4; dmg = 6; w = 18; h = 22; oy = 4; }
  const e = scene.physics.add.sprite(x, y, tex) as Enemy;
  e.hp = hp; e.touchDmg = dmg; e.kind = type;
  (e.body as Phaser.Physics.Arcade.Body).setSize(w, h).setOffset((e.width - w) / 2, oy);
  e.setDepth(7);
  return e;
}

export function updateEnemies(scene: Phaser.Scene, enemies: Enemy[], player: Phaser.GameObjects.Sprite): void {
  const now = scene.time.now;
  for (const e of enemies) {
    if (!e.active || !e.body || !(e.body as Phaser.Physics.Arcade.Body).enable) continue;
    const b = e.body as Phaser.Physics.Arcade.Body;
    switch (e.kind) {
      case 'blob':
        if (b.velocity.x === 0) b.setVelocityX(-40);
        if (b.blocked.left) b.setVelocityX(40);
        if (b.blocked.right) b.setVelocityX(-40);
        if (b.blocked.down && !edgeAhead(scene, e, b)) b.setVelocityX(-b.velocity.x);
        break;
      case 'jet': {
        if ((e as any).homeX === undefined) (e as any).homeX = e.x;
        if ((e as any).dir === undefined) (e as any).dir = -1;
        const home = (e as any).homeX as number;
        const dir = (e as any).dir as number;
        b.setVelocityX(dir * 55);
        b.setVelocityY(Math.sin(now / 300 + home) * 22);
        if (e.x < home - 90) (e as any).dir = 1;
        if (e.x > home + 90) (e as any).dir = -1;
        e.setFlipX(dir > 0);
        break;
      }
      case 'turret': {
        const cd = ((e as any).fireCd as number) ?? 0;
        if (now > cd && Math.abs(e.x - player.x) < 200 && Math.abs(e.y - player.y) < 120) {
          (e as any).fireCd = now + 1500;
          const dx = player.x - e.x, dy = player.y - e.y;
          const len = Math.hypot(dx, dy) || 1;
          spawnEnemyShot(scene, e.x, e.y - 4, (dx / len) * 110, (dy / len) * 110);
        }
        break;
      }
      case 'walker':
        if (b.velocity.x === 0) b.setVelocityX(30);
        if (b.blocked.left) b.setVelocityX(-35);
        if (b.blocked.right) b.setVelocityX(35);
        if (b.blocked.down && !edgeAhead(scene, e, b)) b.setVelocityX(-b.velocity.x);
        break;
    }
  }
}

// Comprueba si hay suelo justo delante de los pies del enemigo (evita precipicios).
function edgeAhead(scene: Phaser.Scene, e: Phaser.GameObjects.Sprite, b: Phaser.Physics.Arcade.Body): boolean {
  const fx = e.x + (b.velocity.x >= 0 ? 11 : -11);
  const fy = e.bottom + 3;
  const rect = new Phaser.Geom.Rectangle(fx - 3, fy - 3, 6, 6);
  let found = false;
  const statics = scene.physics.world.staticBodies.entries;
  for (const sb of statics) {
    if (!sb || !sb.enable || sb.checkCollision.none) continue;
    if (Phaser.Geom.Intersects.RectangleToRectangle(rect, sb.getBounds())) { found = true; break; }
  }
  return found;
}

export function spawnEnemyShot(scene: Phaser.Scene, x: number, y: number, vx: number, vy: number): Phaser.GameObjects.Image {
  const s = scene.add.image(x, y, 'tex_ebullet').setDepth(9);
  (s as any).isEnemyBullet = true;
  scene.physics.add.existing(s);
  const b = s.body as Phaser.Physics.Arcade.Body;
  b.setVelocity(vx, vy);
  b.setMaxVelocity(300, 300);
  scene.time.delayedCall(3500, () => s.destroy());
  return s;
}
