import Phaser from 'phaser';
import { Card, CardConfig } from './Card';
import { CatBreed, SpecialAbilityType } from '../../constants/types';

// 特殊能力接口
export interface SpecialAbility {
  type: SpecialAbilityType;
  value: number;
}

// 猫咪卡片配置接口
export interface CatCardConfig extends CardConfig {
  breed: CatBreed;
  attack: number;
  specialAbility: SpecialAbility;
}

/**
 * 猫咪卡片类
 * 实现各种猫咪的攻击和特殊能力
 */
export class CatCard extends Card {
  breed: CatBreed;
  attack: number;
  specialAbility: SpecialAbility;
  
  // 在当前回合应用的攻击力加成
  private attackBonus: number = 0;
  // 暴击概率加成
  private criticalChanceBonus: number = 0;
  // 特殊能力重复触发次数
  private abilityRepeatCount: number = 1;
  
  constructor(scene: Phaser.Scene, x: number, y: number, config: CatCardConfig) {
    super(scene, x, y, config);
    
    this.breed = config.breed;
    this.attack = config.attack;
    this.specialAbility = config.specialAbility;
    
    // 添加猫咪名称和攻击力文本
    this.addCardText();
  }
  
  /**
   * 添加卡片文本信息
   */
  private addCardText(): void {
    // 添加猫咪品种名称
    const nameText = this.scene.add.text(
      this.sprite.x, 
      this.sprite.y - 40, 
      this.getBreedName(), 
      { fontSize: '16px', color: '#fff' }
    ).setOrigin(0.5);
    
    // 添加攻击力文本
    const attackText = this.scene.add.text(
      this.sprite.x, 
      this.sprite.y + 40, 
      `攻击: ${this.attack}`, 
      { fontSize: '14px', color: '#ff0000' }
    ).setOrigin(0.5);
    
    // 添加特殊能力文本
    const abilityText = this.scene.add.text(
      this.sprite.x, 
      this.sprite.y + 60, 
      this.getAbilityDescription(), 
      { fontSize: '12px', color: '#ffff00', wordWrap: { width: 80 } }
    ).setOrigin(0.5);
  }
  
  /**
   * 获取猫咪品种的本地化名称
   */
  private getBreedName(): string {
    const breedNames = {
      [CatBreed.MAINE_COON]: '缅因猫',
      [CatBreed.SIAMESE]: '暹罗猫',
      [CatBreed.BENGAL]: '孟加拉猫',
      [CatBreed.RAGDOLL]: '布偶猫',
      [CatBreed.AMERICAN_SHORTHAIR]: '美国短毛猫'
    };
    return breedNames[this.breed] || '未知猫咪';
  }
  
  /**
   * 获取特殊能力描述
   */
  private getAbilityDescription(): string {
    const abilityDescriptions = {
      [SpecialAbilityType.DOUBLE_ATTACK]: `连击：攻击两次，每次造成50%伤害`,
      [SpecialAbilityType.MAGIC_WIND]: `魔法飓风：额外造成${this.specialAbility.value}点伤害`,
      [SpecialAbilityType.CRITICAL_HIT]: `暴击：${this.specialAbility.value}%几率造成双倍伤害`,
      [SpecialAbilityType.GROUP_BUFF]: `群体增益：本回合其他猫咪攻击+${this.specialAbility.value}`,
      [SpecialAbilityType.PIERCE]: `穿透攻击：造成额外20%伤害`
    };
    return abilityDescriptions[this.specialAbility.type] || '未知能力';
  }
  
  /**
   * 设置临时攻击力加成
   */
  setAttackBonus(bonus: number): void {
    this.attackBonus = bonus;
  }
  
  /**
   * 设置暴击几率加成
   */
  setCriticalChanceBonus(bonus: number): void {
    this.criticalChanceBonus = bonus;
  }
  
  /**
   * 设置能力重复触发次数
   */
  setAbilityRepeatCount(count: number): void {
    this.abilityRepeatCount = count;
  }
  
  /**
   * 重置临时属性，每回合末调用
   */
  resetTurnEffects(): void {
    this.attackBonus = 0;
    this.criticalChanceBonus = 0;
    this.abilityRepeatCount = 1;
  }
  
  /**
   * 获取实际攻击力（包含加成）
   */
  getEffectiveAttack(): number {
    return this.attack + this.attackBonus;
  }
  
  /**
   * 使用卡片 - 实现攻击和特殊能力
   */
  use(): void {
    // 这里实际游戏中需要引用BattleScene和Boss实例
    // 简单实现，后续需调整
    console.log(`使用猫咪卡片: ${this.getBreedName()}`);
    
    // 重复执行特殊能力指定次数
    for (let i = 0; i < this.abilityRepeatCount; i++) {
      this.activateSpecialAbility();
    }
    
    // 卡片使用后的视觉效果
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }
  
  /**
   * 激活特殊能力
   */
  private activateSpecialAbility(): void {
    const abilityType = this.specialAbility.type;
    const value = this.specialAbility.value;
    
    switch (abilityType) {
      case SpecialAbilityType.DOUBLE_ATTACK:
        console.log(`${this.getBreedName()} 发动连击，攻击两次`);
        // 在实际游戏中，这里需要对BOSS造成两次伤害
        break;
        
      case SpecialAbilityType.MAGIC_WIND:
        console.log(`${this.getBreedName()} 发动魔法飓风，额外造成${value}点伤害`);
        // 在实际游戏中，这里需要对BOSS造成额外伤害
        break;
        
      case SpecialAbilityType.CRITICAL_HIT:
        const critChance = value + this.criticalChanceBonus;
        const isCritical = Math.random() * 100 < critChance;
        if (isCritical) {
          console.log(`${this.getBreedName()} 触发暴击，造成双倍伤害`);
          // 在实际游戏中，这里需要对BOSS造成双倍伤害
        } else {
          console.log(`${this.getBreedName()} 未触发暴击`);
          // 正常伤害
        }
        break;
        
      case SpecialAbilityType.GROUP_BUFF:
        console.log(`${this.getBreedName()} 发动群体增益，其他猫咪攻击+${value}`);
        // 在实际游戏中，这里需要给其他猫咪卡片加上攻击加成
        break;
        
      case SpecialAbilityType.PIERCE:
        console.log(`${this.getBreedName()} 发动穿透攻击，造成额外伤害`);
        // 改为造成额外伤害，因为没有抗性可以穿透
        break;
        
      default:
        console.log(`${this.getBreedName()} 未知能力类型`);
    }
  }
}
