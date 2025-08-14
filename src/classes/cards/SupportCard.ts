import Phaser from 'phaser';
import { Card, CardConfig } from './Card';
import { CatItemType, SupportEffectType } from '../../constants/types';

// 辅助卡片配置接口
export interface SupportCardConfig extends CardConfig {
  itemType: CatItemType;
  effect: SupportEffectType;
  value: number;
}

/**
 * 辅助卡片类
 * 实现各种辅助道具的效果
 */
export class SupportCard extends Card {
  itemType: CatItemType;
  effect: SupportEffectType;
  value: number;
  
  constructor(scene: Phaser.Scene, x: number, y: number, config: SupportCardConfig) {
    super(scene, x, y, config);
    
    this.itemType = config.itemType;
    this.effect = config.effect;
    this.value = config.value;
    
    // 添加辅助卡片文本信息
    this.addCardText();
  }
  
  /**
   * 添加卡片文本信息
   */
  private addCardText(): void {
    // 添加物品名称
    const nameText = this.scene.add.text(
      this.sprite.x, 
      this.sprite.y - 40, 
      this.getItemName(), 
      { fontSize: '16px', color: '#fff' }
    ).setOrigin(0.5);
    
    // 添加效果文本
    const effectText = this.scene.add.text(
      this.sprite.x, 
      this.sprite.y + 40, 
      this.getEffectDescription(), 
      { fontSize: '12px', color: '#00ffff', wordWrap: { width: 80 } }
    ).setOrigin(0.5);
  }
  
  /**
   * 获取物品的本地化名称
   */
  private getItemName(): string {
    const itemNames = {
      [CatItemType.CATNIP]: '猫薄荷精华',
      [CatItemType.SCRATCH_POST]: '猫抓板',
      [CatItemType.CAT_TOY]: '逗猫棒',
      [CatItemType.BELL]: '猫铃铛',
      [CatItemType.LASER]: '激光笔'
    };
    return itemNames[this.itemType] || '未知物品';
  }
  
  /**
   * 获取效果描述
   */
  private getEffectDescription(): string {
    const effectDescriptions = {
      [SupportEffectType.DAMAGE_BOOST]: `本回合所有猫咪卡片伤害+${this.value}`,
      [SupportEffectType.ABILITY_REPEAT]: `本回合第一张猫咪卡片效果触发两次`,
      [SupportEffectType.EXTRA_PLAY]: `获得额外的一次出牌机会`,
      [SupportEffectType.DRAW_CARDS]: `从牌库中抽取${this.value}张猫咪卡片`,
      [SupportEffectType.CRITICAL_CHANCE]: `本回合所有猫咪卡片有${this.value}%几率造成双倍伤害`
    };
    return effectDescriptions[this.effect] || '未知效果';
  }
  
  /**
   * 使用卡片 - 实现辅助效果
   */
  use(): void {
    // 在实际游戏中，这里需要引用BattleScene进行相应操作
    console.log(`使用辅助卡片: ${this.getItemName()}`);
    
    switch (this.effect) {
      case SupportEffectType.DAMAGE_BOOST:
        console.log(`本回合所有猫咪卡片伤害+${this.value}`);
        // 在实际游戏中，这里需要给所有猫咪卡片加上攻击加成
        break;
        
      case SupportEffectType.ABILITY_REPEAT:
        console.log(`本回合第一张猫咪卡片效果触发两次`);
        // 在实际游戏中，这里需要设置第一张猫咪卡片的能力重复触发
        break;
        
      case SupportEffectType.EXTRA_PLAY:
        console.log(`获得额外的一次出牌机会`);
        // 在实际游戏中，这里需要增加玩家的出牌次数
        break;
        
      case SupportEffectType.DRAW_CARDS:
        console.log(`从牌库中抽取${this.value}张猫咪卡片`);
        // 在实际游戏中，这里需要从牌库中抽取指定数量的卡片
        break;
        
      case SupportEffectType.CRITICAL_CHANCE:
        console.log(`本回合所有猫咪卡片有${this.value}%几率造成双倍伤害`);
        // 在实际游戏中，这里需要给所有猫咪卡片增加暴击几率
        break;
        
      default:
        console.log(`未知效果类型`);
    }
    
    // 卡片使用后的视觉效果
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.8,
      scaleY: 0.8,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.sprite.setVisible(false);
      }
    });
  }
}
