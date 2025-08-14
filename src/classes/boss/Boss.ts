import Phaser from 'phaser';

// BOSS配置接口
export interface BossConfig {
  id: string;
  name: string;
  hp: number;
  spriteKey: string;
}

/**
 * BOSS类
 * 实现BOSS的行为和状态
 */
export class Boss extends Phaser.GameObjects.Container {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  
  private spriteKey: string;
  private bodySprite!: Phaser.GameObjects.Sprite;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  
  constructor(scene: Phaser.Scene, x: number, y: number, config: BossConfig) {
    super(scene, x, y);
    
    this.id = config.id;
    this.name = config.name;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.spriteKey = config.spriteKey;
    
    // 创建BOSS视觉元素
    this.createVisuals();
    
    // 将自身添加到场景中
    scene.add.existing(this);
  }
  
  /**
   * 创建BOSS的视觉元素
   */
  private createVisuals(): void {
    // 创建BOSS主体精灵
    this.bodySprite = this.scene.add.sprite(0, 0, this.spriteKey);
    this.add(this.bodySprite);
    
    // 创建血条背景
    this.hpBarBg = this.scene.add.rectangle(0, 80, 150, 15, 0x333333);
    this.add(this.hpBarBg);
    
    // 创建血条
    this.hpBar = this.scene.add.rectangle(0, 80, 150, 15, 0x4CAF50);
    this.hpBar.setOrigin(0, 0.5);
    this.hpBar.x = -75; // 居中显示
    this.add(this.hpBar);
    
    // 创建血量文字
    this.hpText = this.scene.add.text(0, 80, `${this.hp}/${this.maxHp}`, {
      fontSize: '14px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    this.add(this.hpText);
    
    // 创建名称文字
    this.nameText = this.scene.add.text(0, -100, this.name, {
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.nameText);
    
    // 添加互动性
    this.setSize(this.bodySprite.width, this.bodySprite.height);
    this.setInteractive();
    
    this.on('pointerover', () => {
      this.bodySprite.setTint(0xdddddd);
    });
    
    this.on('pointerout', () => {
      this.bodySprite.clearTint();
    });
  }
  
  /**
   * 更新血条显示
   */
  private updateHpBar(): void {
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    this.hpBar.width = 150 * hpRatio;
    this.hpText.setText(`${this.hp}/${this.maxHp}`);
    
    // 根据血量比例改变血条颜色
    if (hpRatio > 0.6) {
      this.hpBar.fillColor = 0x4CAF50; // 绿色
    } else if (hpRatio > 0.3) {
      this.hpBar.fillColor = 0xFF9800; // 橙色
    } else {
      this.hpBar.fillColor = 0xF44336; // 红色
    }
  }
  
  /**
   * 受到伤害
   * @param damage 伤害值
   * @returns 实际造成的伤害
   */
  takeDamage(damage: number): number {
    let actualDamage = damage;
    
    // 减少血量
    this.hp = Math.max(0, this.hp - actualDamage);
    
    // 更新血条
    this.updateHpBar();
    
    // 显示伤害效果
    this.showDamageEffect(actualDamage);
    
    // 检查是否死亡
    if (this.hp <= 0) {
      this.playDeathAnimation();
    }
    
    return actualDamage;
  }
  
  /**
   * 显示受伤效果
   */
  showDamageEffect(damage: number): void {
    // 闪烁效果
    this.scene.tweens.add({
      targets: this.bodySprite,
      alpha: 0.5,
      duration: 50,
      yoyo: true,
      repeat: 3
    });
    
    // 显示伤害数字
    const damageText = this.scene.add.text(
      this.x, 
      this.y - 30, 
      `-${damage}`, 
      { fontSize: '24px', color: '#ff0000', fontStyle: 'bold' }
    ).setOrigin(0.5);
    
    // 伤害数字动画
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      }
    });
  }
  
  /**
   * 播放死亡动画
   */
  playDeathAnimation(): void {
    console.log(`${this.name} 被击败了！`);
    
    // 播放死亡动画
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y + 30,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        // 触发死亡事件
        this.emit('died');
      }
    });
  }
  
  /**
   * 更新BOSS状态
   */
  update(): void {
    // BOSS不需要任何特殊逻辑，只保留基础血量
  }
  
  /**
   * 重置BOSS状态
   */
  reset(): void {
    this.hp = this.maxHp;
    this.updateHpBar();
    this.alpha = 1;
    this.y = this.y - 30; // 重置可能的死亡动画位移
  }
}
