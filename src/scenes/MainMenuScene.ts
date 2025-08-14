import Phaser from 'phaser';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { AudioManager } from '../classes/systems/AudioManager';
import { SettingsMenu } from '../ui/SettingsMenu';

/**
 * 主菜单场景
 * 游戏的起始场景，提供开始游戏、设置等选项
 */
export default class MainMenuScene extends Phaser.Scene {
  // 音频管理器
  private audioManager!: AudioManager;
  
  // UI元素
  private title!: Phaser.GameObjects.Text;
  private startButton!: Button;
  private settingsButton!: Button;
  private aboutButton!: Button;
  private settingsMenu!: SettingsMenu;
  
  constructor() {
    super({ key: 'MainMenuScene' });
  }
  
  /**
   * 初始化场景数据
   */
  init(data: any): void {
    // 从预加载场景获取音频管理器
    if (data && data.audioManager) {
      this.audioManager = data.audioManager;
    }
  }
  
  create(): void {
    // 创建背景
    this.createBackground();
    
    // 初始化音频管理器（如果没有从预加载场景传递过来）
    if (!this.audioManager) {
      this.audioManager = new AudioManager(this);
      this.audioManager.init();
    }
    
    // 播放背景音乐
    this.audioManager.playMusic('battle_music');
    
    // 创建标题
    this.createTitle();
    
    // 创建按钮
    this.createButtons();
    
    // 创建设置菜单
    this.settingsMenu = new SettingsMenu(this, this.audioManager);
    
    // 创建版本信息
    this.createVersionInfo();
  }
  
  /**
   * 创建背景
   */
  private createBackground(): void {
    // 创建渐变背景
    const background = this.add.graphics();
    background.fillGradientStyle(
      0x3a7ca5, 0x3a7ca5, 0x2f5d8a, 0x2f5d8a, 1
    );
    background.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    
    // 添加一些装饰元素
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const size = Phaser.Math.Between(2, 5);
      
      const star = this.add.circle(x, y, size, 0xffffff, 0.5);
      
      // 添加闪烁动画
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1
      });
    }
    
    // 添加猫咪剪影
    try {
      const catSilhouette = this.add.image(
        this.cameras.main.width - 100,
        this.cameras.main.height - 100,
        'cat_silhouette'
      ).setScale(0.3).setAlpha(0.7);
      
      // 添加轻微摇摆动画
      this.tweens.add({
        targets: catSilhouette,
        angle: { from: -2, to: 2 },
        duration: 2000,
        yoyo: true,
        repeat: -1
      });
    } catch (error) {
      console.warn('无法加载猫咪剪影图片:', error);
    }
  }
  
  /**
   * 创建标题
   */
  private createTitle(): void {
    // 主标题
    this.title = this.add.text(
      this.cameras.main.width / 2,
      150,
      '猫咪卡片对决',
      {
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: '#000000',
          blur: 5,
          stroke: true,
          fill: true
        }
      }
    ).setOrigin(0.5);
    
    // 添加动画效果
    this.tweens.add({
      targets: this.title,
      y: { from: 130, to: 150 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 副标题
    this.add.text(
      this.cameras.main.width / 2,
      220,
      '- 战胜强大的BOSS，收集猫薄荷 -',
      {
        fontSize: '24px',
        fontStyle: 'italic',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
  }
  
  /**
   * 创建按钮
   */
  private createButtons(): void {
    // 开始游戏按钮
    this.startButton = new Button(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      200,
      60,
      '开始游戏',
      {
        backgroundColor: 0x4CAF50,
        fontSize: '24px',
        fontStyle: 'bold'
      },
      () => {
        this.startGame();
      },
      this.audioManager
    );
    
    // 设置按钮
    this.settingsButton = new Button(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 80,
      200,
      50,
      '设置',
      {
        backgroundColor: 0x2196F3,
        fontSize: '22px'
      },
      () => {
        // 播放按钮点击动画
        this.settingsButton.y += 2;
        this.time.delayedCall(100, () => {
          this.settingsButton.y -= 2;
          this.settingsMenu.open();
        });
      },
      this.audioManager
    );
    
    // 关于按钮
    this.aboutButton = new Button(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 150,
      200,
      50,
      '关于',
      {
        backgroundColor: 0x9C27B0,
        fontSize: '22px'
      },
      () => {
        this.showAboutDialog();
      },
      this.audioManager
    );
  }
  
  /**
   * 创建版本信息
   */
  private createVersionInfo(): void {
    this.add.text(
      10,
      this.cameras.main.height - 30,
      'v1.0.0',
      {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'italic'
      }
    );
  }
  
  /**
   * 开始游戏
   */
  private startGame(): void {
    // 播放按钮点击动画
    this.startButton.y += 2;
    this.time.delayedCall(100, () => {
      this.startButton.y -= 2;
    });
    
    // 创建过渡动画
    const overlay = this.add.rectangle(
      0,
      0,
      this.cameras.main.width * 2,
      this.cameras.main.height * 2,
      0x000000,
      0
    );
    
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 500,
      onComplete: () => {
        // 切换到战斗场景
        this.scene.start('BattleScene', {
          audioManager: this.audioManager
        });
      }
    });
  }
  
  /**
   * 显示关于对话框
   */
  private showAboutDialog(): void {
    // 播放按钮点击动画
    this.aboutButton.y += 2;
    this.time.delayedCall(100, () => {
      this.aboutButton.y -= 2;
    });
    
    const dialog = Dialog.createAlertDialog(
      this,
      '关于游戏',
      '猫咪卡片对决\n\n一款基于回合制的卡牌游戏，使用猫咪卡片和辅助卡片击败强大的BOSS，收集猫薄荷资源，购买永久增益。\n\n© 2023 猫咪游戏工作室',
      undefined,
      { audioManager: this.audioManager }
    );
    
    dialog.open();
  }
}
