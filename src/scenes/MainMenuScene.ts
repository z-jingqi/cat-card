import Phaser from 'phaser';

/**
 * 主菜单场景
 * 游戏的主菜单界面
 */
export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    console.log('MainMenuScene: 主菜单创建');

    // TODO: 创建主菜单UI
    // TODO: 添加开始游戏按钮
    // TODO: 添加设置按钮
    // TODO: 添加其他菜单选项

    // 临时：直接跳转到战斗场景
    this.input.once('pointerdown', () => {
      this.scene.start('BattleScene');
    });

    // 临时显示提示
    this.add.text(400, 300, '点击屏幕开始游戏', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);
  }
}
