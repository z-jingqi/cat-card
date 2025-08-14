import Phaser from 'phaser';

// 基础卡片配置接口
export interface CardConfig {
  id: string;
  name: string;
  description: string;
  spriteKey: string;
}

/**
 * 卡片基类
 * 所有类型的卡片都继承自此基类
 */
export abstract class Card {
  id: string;
  name: string;
  description: string;
  sprite: Phaser.GameObjects.Sprite;
  
  protected scene: Phaser.Scene;
  protected selected: boolean = false;
  protected interactive: boolean = true;
  
  constructor(scene: Phaser.Scene, x: number, y: number, config: CardConfig) {
    this.scene = scene;
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    
    // 创建卡片精灵
    this.sprite = scene.add.sprite(x, y, config.spriteKey);
    
    // 设置交互
    this.sprite.setInteractive();
    
    // 事件监听
    this.setupEvents();
  }
  
  /**
   * 设置卡片事件
   * 默认添加鼠标悬停和点击效果
   */
  private setupEvents(): void {
    this.sprite.on('pointerover', () => {
      if (this.interactive) {
        this.sprite.setScale(1.1);
      }
    });
    
    this.sprite.on('pointerout', () => {
      if (this.interactive) {
        this.sprite.setScale(1);
      }
    });
    
    this.sprite.on('pointerdown', () => {
      if (this.interactive) {
        this.toggleSelected();
      }
    });
  }
  
  /**
   * 切换卡片选中状态
   */
  toggleSelected(): void {
    this.selected = !this.selected;
    if (this.selected) {
      this.select();
    } else {
      this.deselect();
    }
  }
  
  /**
   * 选中卡片
   */
  select(): void {
    this.selected = true;
    this.sprite.setTint(0x00ff00);
  }
  
  /**
   * 取消选中卡片
   */
  deselect(): void {
    this.selected = false;
    this.sprite.clearTint();
  }
  
  /**
   * 启用卡片交互
   */
  enableInteraction(): void {
    this.interactive = true;
    this.sprite.setAlpha(1);
  }
  
  /**
   * 禁用卡片交互
   */
  disableInteraction(): void {
    this.interactive = false;
    this.sprite.setAlpha(0.7);
  }
  
  /**
   * 获取卡片是否被选中
   */
  isSelected(): boolean {
    return this.selected;
  }
  
  /**
   * 使用卡片 - 抽象方法，子类必须实现
   */
  abstract use(): void;
  
  /**
   * 销毁卡片
   */
  destroy(): void {
    this.sprite.destroy();
  }
}
