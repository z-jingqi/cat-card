import Phaser from 'phaser';
import { UpgradeType, EffectCondition } from '../../constants/types';

// 增益效果接口
export interface UpgradeEffect {
  target: string;
  value: number;
  condition?: EffectCondition;
}

// 增益配置接口
export interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  cost: number;
  sellValue: number;
  type: UpgradeType;
  effect: UpgradeEffect;
  tier: 1 | 2 | 3;  // 增益等级
  iconKey: string;
}

/**
 * 永久增益类
 * 实现游戏中的永久增益效果
 */
export class Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  sellValue: number;
  type: UpgradeType;
  effect: UpgradeEffect;
  tier: 1 | 2 | 3;
  iconKey: string;
  
  public sprite: Phaser.GameObjects.Sprite | null = null;
  private isActive: boolean = false;
  private isEquipped: boolean = false;
  
  constructor(config: UpgradeConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.cost = config.cost;
    this.sellValue = config.sellValue;
    this.type = config.type;
    this.effect = config.effect;
    this.tier = config.tier;
    this.iconKey = config.iconKey;
  }
  
  /**
   * 创建增益的视觉表示
   */
  createSprite(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Sprite {
    this.sprite = scene.add.sprite(x, y, this.iconKey);
    
    // 根据等级添加边框效果
    const borderColors = {
      1: 0xcccccc, // 灰色 - 一级
      2: 0x4CAF50, // 绿色 - 二级
      3: 0x9C27B0  // 紫色 - 三级
    };
    
    // 创建边框
    const border = scene.add.rectangle(x, y, this.sprite.width + 10, this.sprite.height + 10, borderColors[this.tier], 0.5);
    border.setDepth(this.sprite.depth - 1);
    
    // 添加名称和描述文本
    const nameText = scene.add.text(x, y - 30, this.name, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // 添加描述文本并将它们关联到精灵，以便后续可以一起销毁
    const descText = scene.add.text(x, y + 30, this.getShortDescription(), {
      fontSize: '10px',
      color: '#eeeeee',
      wordWrap: { width: 100 }
    }).setOrigin(0.5);
    
    // 保存文本引用到精灵
    this.sprite.setData('nameText', nameText);
    this.sprite.setData('descText', descText);
    
    // 添加交互
    this.sprite.setInteractive();
    
    this.sprite.on('pointerover', () => {
      border.setAlpha(1);
      nameText.setScale(1.1);
      
      // 显示详细描述
      const detailText = scene.add.text(x, y + 60, this.description, {
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 5, y: 5 },
        wordWrap: { width: 150 }
      }).setOrigin(0.5);
      
      // 存储引用，以便在pointerout时移除
      this.sprite!.setData('detailText', detailText);
    });
    
    this.sprite.on('pointerout', () => {
      border.setAlpha(0.5);
      nameText.setScale(1);
      
      // 移除详细描述
      const detailText = this.sprite!.getData('detailText');
      if (detailText) {
        detailText.destroy();
      }
    });
    
    return this.sprite;
  }
  
  /**
   * 获取简短描述
   */
  private getShortDescription(): string {
    switch (this.type) {
      case UpgradeType.CAT:
        return `猫咪强化 Lv.${this.tier}`;
      case UpgradeType.CARD_PLAY:
        return `出牌强化 Lv.${this.tier}`;
      case UpgradeType.CARD:
        return `卡片强化 Lv.${this.tier}`;
      case UpgradeType.BATTLE:
        return `战斗强化 Lv.${this.tier}`;
      default:
        return `增益 Lv.${this.tier}`;
    }
  }
  
  /**
   * 设置增益是否装备
   */
  setEquipped(equipped: boolean): void {
    this.isEquipped = equipped;
    
    if (this.sprite) {
      if (equipped) {
        this.sprite.setTint(0xFFFF99);
      } else {
        this.sprite.clearTint();
      }
    }
  }
  
  /**
   * 获取增益是否装备
   */
  isUpgradeEquipped(): boolean {
    return this.isEquipped;
  }
  
  /**
   * 设置增益是否激活
   */
  setActive(active: boolean): void {
    this.isActive = active;
    
    if (this.sprite) {
      this.sprite.setAlpha(active ? 1 : 0.7);
    }
  }
  
  /**
   * 应用增益效果
   * @param battleScene 战斗场景实例，用于获取需要修改的对象
   */
  applyEffect(_battleScene: any): void {
    if (!this.isEquipped || !this.isActive) return;
    
    const { target, value } = this.effect;
    
    // 这里的实现会依赖于完整的游戏系统
    // 简单示例，后续需要根据实际场景进行调整
    console.log(`应用增益 ${this.name} - ${this.description}`);
    
    // 在实际游戏中，根据增益类型和目标应用不同的效果
    switch (this.type) {
      case UpgradeType.CAT:
        // 猫咪相关增益
        console.log(`应用猫咪增益: ${target} +${value}`);
        break;
        
      case UpgradeType.CARD_PLAY:
        // 出牌系统相关增益
        console.log(`应用出牌系统增益: ${target} +${value}`);
        break;
        
      case UpgradeType.CARD:
        // 卡片系统相关增益
        console.log(`应用卡片系统增益: ${target} +${value}`);
        break;
        
      case UpgradeType.BATTLE:
        // 战斗相关增益
        console.log(`应用战斗增益: ${target} +${value}`);
        break;
        
      default:
        console.log(`未知增益类型`);
    }
  }
  
  /**
   * 销毁增益的视觉元素
   */
  destroy(): void {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
  }
}
