import Phaser from 'phaser';
import BattleScene from './scenes/BattleScene';
import ShopScene from './scenes/ShopScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1000,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    scene: [BattleScene, ShopScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    }
};

new Phaser.Game(config);
