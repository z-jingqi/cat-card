import Phaser from 'phaser';

/**
 * 商店场景
 * 用于购买卡片、升级等
 */
export default class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create(): void {
    console.log('ShopScene: 商店场景创建');

    // TODO: 创建商店UI
    // TODO: 显示可购买的卡片
    // TODO: 显示玩家资源
    // TODO: 添加购买逻辑

    // 临时：返回战斗的按钮
    this.add.text(400, 300, '商店场景 (开发中)', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(400, 350, '点击返回战斗', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.start('BattleScene');
    });
  }
}
