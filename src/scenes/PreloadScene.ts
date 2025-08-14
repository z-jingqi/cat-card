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
    try {
      // 创建默认纹理
      this.createDefaultTextures();
      
      // 加载卡片背景
      this.loadImageWithFallback('card_background', 'assets/images/cards/card_background.png');
      this.loadImageWithFallback('cat_card_background', 'assets/images/cards/cat_card_background.png');
      this.loadImageWithFallback('support_card_background', 'assets/images/cards/support_card_background.png');
      
      // 加载猫咪图片
      this.loadImageWithFallback('cat_maine_coon', 'assets/images/cats/maine_coon.png');
      this.loadImageWithFallback('cat_siamese', 'assets/images/cats/siamese.png');
      this.loadImageWithFallback('cat_bengal', 'assets/images/cats/bengal.png');
      this.loadImageWithFallback('cat_ragdoll', 'assets/images/cats/ragdoll.png');
      this.loadImageWithFallback('cat_american_shorthair', 'assets/images/cats/american_shorthair.png');
      
      // 加载辅助卡片图片
      this.loadImageWithFallback('item_catnip_essence', 'assets/images/items/catnip_essence.png');
      this.loadImageWithFallback('item_scratch_post', 'assets/images/items/scratch_post.png');
      this.loadImageWithFallback('item_cat_toy', 'assets/images/items/cat_toy.png');
      this.loadImageWithFallback('item_cat_bell', 'assets/images/items/cat_bell.png');
      this.loadImageWithFallback('item_laser_pointer', 'assets/images/items/laser_pointer.png');
      
      // 加载BOSS图片
      this.loadImageWithFallback('boss_1', 'assets/images/bosses/boss_1.png');
      this.loadImageWithFallback('boss_2', 'assets/images/bosses/boss_2.png');
      this.loadImageWithFallback('boss_3', 'assets/images/bosses/boss_3.png');
      
      // 加载UI元素
      this.loadImageWithFallback('button_background', 'assets/images/ui/button_background.png');
      this.loadImageWithFallback('catnip_icon', 'assets/images/ui/catnip_icon.png');
      this.loadImageWithFallback('hp_bar', 'assets/images/ui/hp_bar.png');
      this.loadImageWithFallback('hp_bar_bg', 'assets/images/ui/hp_bar_bg.png');
      
      // 加载背景
      this.loadImageWithFallback('battle_background', 'assets/images/backgrounds/battle_background.png');
      this.loadImageWithFallback('shop_background', 'assets/images/backgrounds/shop_background.png');
      
      // 加载猫咪剪影
      this.loadImageWithFallback('cat_silhouette', 'assets/images/ui/cat_silhouette.png');
    } catch (error) {
      console.warn('图片资源加载失败，将使用默认纹理:', error);
    }
  }
  
  /**
   * 创建默认纹理
   */
  private createDefaultTextures(): void {
    // 创建默认卡片背景
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x333333, 1);
    cardBg.fillRect(0, 0, 100, 150);
    cardBg.lineStyle(2, 0xffffff);
    cardBg.strokeRect(0, 0, 100, 150);
    cardBg.generateTexture('default_card', 100, 150);
    cardBg.destroy();
    
    // 创建默认猫咪图标
    const catIcon = this.add.graphics();
    catIcon.fillStyle(0x4caf50, 1);
    catIcon.fillCircle(50, 50, 40);
    catIcon.generateTexture('default_cat', 100, 100);
    catIcon.destroy();
    
    // 创建默认物品图标
    const itemIcon = this.add.graphics();
    itemIcon.fillStyle(0x2196f3, 1);
    itemIcon.fillRect(10, 10, 80, 80);
    itemIcon.generateTexture('default_item', 100, 100);
    itemIcon.destroy();
    
    // 创建默认BOSS图标
    const bossIcon = this.add.graphics();
    bossIcon.fillStyle(0xf44336, 1);
    bossIcon.fillRect(0, 0, 120, 120);
    bossIcon.lineStyle(4, 0x000000);
    bossIcon.strokeRect(0, 0, 120, 120);
    bossIcon.generateTexture('default_boss', 120, 120);
    bossIcon.destroy();
    
    // 创建默认UI元素
    const uiElement = this.add.graphics();
    uiElement.fillStyle(0x9c27b0, 1);
    uiElement.fillRect(0, 0, 50, 50);
    uiElement.generateTexture('default_ui', 50, 50);
    uiElement.destroy();
    
    // 创建默认背景
    const background = this.add.graphics();
    background.fillGradientStyle(0x3a7ca5, 0x3a7ca5, 0x2f5d8a, 0x2f5d8a, 1);
    background.fillRect(0, 0, 500, 300);
    background.generateTexture('default_background', 500, 300);
    background.destroy();
    
    // 创建猫咪剪影
    const silhouette = this.add.graphics();
    silhouette.fillStyle(0x000000, 0.7);
    
    // 简单的猫咪剪影形状
    silhouette.beginPath();
    silhouette.moveTo(25, 80); // 左下
    silhouette.lineTo(40, 30); // 左耳
    silhouette.lineTo(50, 50); // 头顶
    silhouette.lineTo(60, 30); // 右耳
    silhouette.lineTo(75, 80); // 右下
    silhouette.lineTo(50, 70); // 尾巴
    silhouette.closePath();
    silhouette.fill();
    
    silhouette.generateTexture('cat_silhouette', 100, 100);
    silhouette.destroy();
  }
  
  /**
   * 加载图片，如果失败则使用默认纹理
   */
  private loadImageWithFallback(key: string, path: string): void {
    try {
      this.load.image(key, path);
      
      // 添加错误处理
      this.load.once(`filecomplete-image-${key}`, () => {
        console.log(`图片加载成功: ${key}`);
      });
      
      this.load.once(`loaderror`, (fileObj: any) => {
        if (fileObj && fileObj.key === key) {
          console.warn(`图片加载失败: ${key}，使用默认纹理`);
          
          // 根据图片类型选择默认纹理
          let defaultKey = 'default_ui';
          
          if (key.includes('cat_')) {
            defaultKey = 'default_cat';
          } else if (key.includes('item_')) {
            defaultKey = 'default_item';
          } else if (key.includes('boss')) {
            defaultKey = 'default_boss';
          } else if (key.includes('card')) {
            defaultKey = 'default_card';
          } else if (key.includes('background')) {
            defaultKey = 'default_background';
          }
          
          // 复制默认纹理
          (this.textures.list as any)[key] = (this.textures.list as any)[defaultKey];
        }
      });
    } catch (error) {
      console.warn(`图片加载失败: ${key}`, error);
    }
  }
  
  /**
   * 加载精灵表
   */
  private loadSpritesheets(): void {
    try {
      // 创建默认精灵表
      this.createDefaultSpritesheets();
      
      // 加载攻击效果
      this.loadSpritesheetWithFallback('attack_effect', 'assets/spritesheets/attack_effect.png', {
        frameWidth: 64,
        frameHeight: 64
      });
      
      // 加载特殊攻击效果
      this.loadSpritesheetWithFallback('special_attack_effect', 'assets/spritesheets/special_attack_effect.png', {
        frameWidth: 128,
        frameHeight: 128
      });
      
      // 加载伤害效果
      this.loadSpritesheetWithFallback('damage_effect', 'assets/spritesheets/damage_effect.png', {
        frameWidth: 64,
        frameHeight: 64
      });
      
      // 加载按钮
      this.loadSpritesheetWithFallback('buttons', 'assets/spritesheets/buttons.png', {
        frameWidth: 192,
        frameHeight: 64
      });
    } catch (error) {
      console.warn('精灵表加载失败，将使用默认精灵表:', error);
    }
  }
  
  /**
   * 创建默认精灵表
   */
  private createDefaultSpritesheets(): void {
    // 创建默认攻击效果
    const attackEffect = this.add.graphics();
    attackEffect.fillStyle(0xff0000, 0.8);
    attackEffect.fillCircle(32, 32, 30);
    attackEffect.generateTexture('default_attack_effect', 64, 64);
    attackEffect.destroy();
    
    // 创建默认特殊攻击效果
    const specialAttackEffect = this.add.graphics();
    specialAttackEffect.fillStyle(0xff00ff, 0.8);
    specialAttackEffect.fillCircle(64, 64, 60);
    specialAttackEffect.generateTexture('default_special_attack_effect', 128, 128);
    specialAttackEffect.destroy();
    
    // 创建默认伤害效果
    const damageEffect = this.add.graphics();
    damageEffect.fillStyle(0xffff00, 0.8);
    damageEffect.fillCircle(32, 32, 30);
    damageEffect.generateTexture('default_damage_effect', 64, 64);
    damageEffect.destroy();
    
    // 创建默认按钮
    const buttons = this.add.graphics();
    buttons.fillStyle(0x4caf50, 1);
    buttons.fillRect(0, 0, 192, 64);
    buttons.lineStyle(2, 0xffffff);
    buttons.strokeRect(0, 0, 192, 64);
    buttons.generateTexture('default_buttons', 192, 64);
    buttons.destroy();
  }
  
  /**
   * 加载精灵表，如果失败则使用默认纹理
   */
  private loadSpritesheetWithFallback(key: string, path: string, config: any): void {
    try {
      this.load.spritesheet(key, path, config);
      
      // 添加错误处理
      this.load.once(`filecomplete-spritesheet-${key}`, () => {
        console.log(`精灵表加载成功: ${key}`);
      });
      
      this.load.once(`loaderror`, (fileObj: any) => {
        if (fileObj && fileObj.key === key) {
          console.warn(`精灵表加载失败: ${key}，使用默认精灵表`);
          
          // 根据精灵表类型选择默认纹理
          let defaultKey = 'default_attack_effect';
          
          if (key.includes('special')) {
            defaultKey = 'default_special_attack_effect';
          } else if (key.includes('damage')) {
            defaultKey = 'default_damage_effect';
          } else if (key.includes('button')) {
            defaultKey = 'default_buttons';
          }
          
          // 复制默认纹理
          (this.textures.list as any)[key] = (this.textures.list as any)[defaultKey];
        }
      });
    } catch (error) {
      console.warn(`精灵表加载失败: ${key}`, error);
    }
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
    try {
      // 创建攻击效果动画
      this.createAnimationWithFallback('attack', 'attack_effect', 0, 5);
      
      // 创建特殊攻击效果动画
      this.createAnimationWithFallback('special_attack', 'special_attack_effect', 0, 7);
      
      // 创建伤害效果动画
      this.createAnimationWithFallback('damage', 'damage_effect', 0, 4);
    } catch (error) {
      console.warn('动画创建失败:', error);
    }
  }
  
  /**
   * 创建动画，如果失败则创建简单的替代动画
   */
  private createAnimationWithFallback(key: string, spritesheet: string, startFrame: number, endFrame: number): void {
    try {
      // 尝试创建正常的动画
      this.anims.create({
        key: key,
        frames: this.anims.generateFrameNumbers(spritesheet, { start: startFrame, end: endFrame }),
        frameRate: 10,
        repeat: 0
      });
      console.log(`动画创建成功: ${key}`);
    } catch (error) {
      console.warn(`动画创建失败: ${key}，创建替代动画`, error);
      
      // 创建简单的替代动画（只有一帧）
      try {
        const defaultKey = 'default_' + spritesheet;
        this.anims.create({
          key: key,
          frames: [{ key: defaultKey, frame: 0 }],
          frameRate: 10,
          repeat: 0
        });
      } catch (fallbackError) {
        console.error(`替代动画创建失败: ${key}`, fallbackError);
      }
    }
  }
}
