import Phaser from 'phaser';
import { AudioManager } from '../classes/systems/AudioManager';

/**
 * 预加载场景
 * 用于加载游戏所需的所有资源
 */
export default class PreloadScene extends Phaser.Scene {
  // 音频管理器
  private audioManager!: AudioManager;
  
  // 加载进度条
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'PreloadScene' });
  }
  
  preload(): void {
    // 创建加载界面
    this.createLoadingUI();
    
    // 设置加载事件监听器
    this.setupLoadingEvents();
    
    // 创建音频管理器
    this.audioManager = new AudioManager(this);
    
    // 加载音频资源
    this.audioManager.preload();
    
    // 加载图片资源
    this.loadImages();
    
    // 加载精灵表
    this.loadSpritesheets();
    
    // 加载字体
    this.loadFonts();
  }
  
  create(): void {
    // 初始化音频管理器
    this.audioManager.init();
    
    // 创建动画
    this.createAnimations();
    
    // 延迟一下，确保所有资源都已加载完成
    this.time.delayedCall(500, () => {
      // 开始游戏，跳转到主菜单场景
      this.scene.start('MainMenuScene', { audioManager: this.audioManager });
    });
  }
  
  /**
   * 创建加载界面
   */
  private createLoadingUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // 创建进度条背景
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    // 创建进度条
    this.progressBar = this.add.graphics();
    
    // 创建加载文本
    this.loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 创建百分比文本
    this.percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 创建资源文本
    this.assetText = this.add.text(width / 2, height / 2 + 50, '', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // 添加标题
    this.add.text(width / 2, height / 3, '猫咪卡片游戏', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }
  
  /**
   * 设置加载事件监听器
   */
  private setupLoadingEvents(): void {
    // 更新进度条
    this.load.on('progress', (value: number) => {
      this.percentText.setText(`${Math.floor(value * 100)}%`);
      this.progressBar.clear();
      this.progressBar.fillStyle(0x4caf50, 1);
      this.progressBar.fillRect(this.cameras.main.width / 2 - 150, this.cameras.main.height / 2 - 15, 300 * value, 30);
    });
    
    // 更新正在加载的资源文本
    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      this.assetText.setText(`正在加载: ${file.key}`);
    });
    
    // 加载完成
    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressBox.destroy();
      this.loadingText.destroy();
      this.percentText.destroy();
      this.assetText.destroy();
    });
  }
  
  /**
   * 加载图片资源
   */
  private loadImages(): void {
    // 加载卡片背景
    this.load.image('card_background', 'assets/images/cards/card_background.png');
    this.load.image('cat_card_background', 'assets/images/cards/cat_card_background.png');
    this.load.image('support_card_background', 'assets/images/cards/support_card_background.png');
    
    // 加载猫咪图片
    this.load.image('cat_maine_coon', 'assets/images/cats/maine_coon.png');
    this.load.image('cat_siamese', 'assets/images/cats/siamese.png');
    this.load.image('cat_bengal', 'assets/images/cats/bengal.png');
    this.load.image('cat_ragdoll', 'assets/images/cats/ragdoll.png');
    this.load.image('cat_american_shorthair', 'assets/images/cats/american_shorthair.png');
    
    // 加载辅助卡片图片
    this.load.image('item_catnip_essence', 'assets/images/items/catnip_essence.png');
    this.load.image('item_scratch_post', 'assets/images/items/scratch_post.png');
    this.load.image('item_cat_toy', 'assets/images/items/cat_toy.png');
    this.load.image('item_cat_bell', 'assets/images/items/cat_bell.png');
    this.load.image('item_laser_pointer', 'assets/images/items/laser_pointer.png');
    
    // 加载BOSS图片
    this.load.image('boss_1', 'assets/images/bosses/boss_1.png');
    this.load.image('boss_2', 'assets/images/bosses/boss_2.png');
    this.load.image('boss_3', 'assets/images/bosses/boss_3.png');
    
    // 加载UI元素
    this.load.image('button_background', 'assets/images/ui/button_background.png');
    this.load.image('catnip_icon', 'assets/images/ui/catnip_icon.png');
    this.load.image('hp_bar', 'assets/images/ui/hp_bar.png');
    this.load.image('hp_bar_bg', 'assets/images/ui/hp_bar_bg.png');
    
    // 加载背景
    this.load.image('battle_background', 'assets/images/backgrounds/battle_background.png');
    this.load.image('shop_background', 'assets/images/backgrounds/shop_background.png');
  }
  
  /**
   * 加载精灵表
   */
  private loadSpritesheets(): void {
    // 加载攻击效果
    this.load.spritesheet('attack_effect', 'assets/spritesheets/attack_effect.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    
    // 加载特殊攻击效果
    this.load.spritesheet('special_attack_effect', 'assets/spritesheets/special_attack_effect.png', {
      frameWidth: 128,
      frameHeight: 128
    });
    
    // 加载伤害效果
    this.load.spritesheet('damage_effect', 'assets/spritesheets/damage_effect.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    
    // 加载按钮
    this.load.spritesheet('buttons', 'assets/spritesheets/buttons.png', {
      frameWidth: 192,
      frameHeight: 64
    });
  }
  
  /**
   * 加载字体
   */
  private loadFonts(): void {
    // 这里可以加载自定义字体
    // 例如使用 WebFont 加载 Google Fonts
  }
  
  /**
   * 创建动画
   */
  private createAnimations(): void {
    // 创建攻击效果动画
    this.anims.create({
      key: 'attack',
      frames: this.anims.generateFrameNumbers('attack_effect', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: 0
    });
    
    // 创建特殊攻击效果动画
    this.anims.create({
      key: 'special_attack',
      frames: this.anims.generateFrameNumbers('special_attack_effect', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: 0
    });
    
    // 创建伤害效果动画
    this.anims.create({
      key: 'damage',
      frames: this.anims.generateFrameNumbers('damage_effect', { start: 0, end: 4 }),
      frameRate: 10,
      repeat: 0
    });
  }
}
