import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { ShopScene } from './scenes/ShopScene';
import { CollectionScene } from './scenes/CollectionScene';
import { SettingsScene } from './scenes/SettingsScene';
import { COLORS, DPR } from './utils/constants';

// Use dvh for true mobile viewport, fallback to innerHeight
const w = window.innerWidth;
const h = window.visualViewport?.height || window.innerHeight;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: COLORS.BG_CREAM,
  width: w * DPR,
  height: h * DPR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: w * DPR,
    height: h * DPR,
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, UIScene, ShopScene, CollectionScene, SettingsScene],
  input: { activePointers: 1 },
  render: { pixelArt: false, antialias: true, roundPixels: true },
  fps: { target: 60, forceSetTimeOut: false },
  disableContextMenu: true,
};

new Phaser.Game(config);
