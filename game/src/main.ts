import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Title } from './scenes/Title';
import { Intro } from './scenes/Intro';
import { Select } from './scenes/Select';
import { Stage } from './scenes/Stage';
import { BossRoom } from './scenes/BossRoom';
import { FinalStage } from './scenes/FinalStage';
import { Victory } from './scenes/Victory';
import { GameOver } from './scenes/GameOver';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 432,
  height: 243,
  backgroundColor: '#0a0a12',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 900 }, debug: false },
  },
  scene: [Boot, Title, Intro, Select, Stage, BossRoom, FinalStage, Victory, GameOver],
};

export default new Phaser.Game(config);
