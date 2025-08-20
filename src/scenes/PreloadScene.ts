import Phaser from 'phaser';

/**
 * 预加载场景
 * 负责加载游戏所需的所有资源
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // TODO: 加载游戏资源
    console.log('PreloadScene: 开始加载资源');
    this.load.image('cat_ragdoll', 'assets/images/cats/ragdoll.jpg');
  }

  create(): void {
    // TODO: 资源加载完成后的处理
    console.log('PreloadScene: 资源加载完成');
    
    // 跳转到主菜单
    this.scene.start('MainMenuScene');
  }
}
