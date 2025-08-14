import Phaser from 'phaser';

/**
 * 动画管理器
 * 管理游戏中的各种动画效果
 */
export class AnimationManager {
  private scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * 创建卡片使用动画
   */
  public playCardAnimation(
    cardSprite: Phaser.GameObjects.Sprite, 
    targetX: number, 
    targetY: number,
    onComplete?: () => void
  ): void {
    // 保存原始位置
    const originalX = cardSprite.x;
    const originalY = cardSprite.y;
    const originalScale = cardSprite.scale;
    
    // 创建动画序列
    (this.scene.tweens as any).timeline({
      targets: cardSprite,
      tweens: [
        {
          x: targetX,
          y: targetY,
          scale: originalScale * 1.2,
          duration: 300,
          ease: 'Power2'
        },
        {
          scale: 0,
          alpha: 0,
          duration: 200,
          ease: 'Power2'
        }
      ],
      onComplete: () => {
        // 恢复原始状态（但保持不可见）
        cardSprite.setPosition(originalX, originalY);
        cardSprite.setScale(originalScale);
        
        if (onComplete) {
          onComplete();
        }
      }
    });
  }
  
  /**
   * 创建攻击动画
   */
  public playAttackAnimation(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    isSpecialAttack: boolean = false,
    onComplete?: () => void
  ): void {
    // 创建攻击特效精灵
    const effectKey = isSpecialAttack ? 'special_attack_effect' : 'attack_effect';
    const attackEffect = this.scene.add.sprite(sourceX, sourceY, effectKey);
    
    // 如果没有纹理，创建一个临时的视觉效果
    if (!this.scene.textures.exists(effectKey)) {
      const graphics = this.scene.add.graphics();
      const color = isSpecialAttack ? 0xff00ff : 0xff0000;
      
      graphics.fillStyle(color, 0.8);
      graphics.fillCircle(0, 0, 20);
      
      // 将图形转换为纹理
      graphics.generateTexture(effectKey, 40, 40);
      graphics.destroy();
      
      // 重新创建精灵
      attackEffect.setTexture(effectKey);
    }
    
    // 设置初始状态
    attackEffect.setScale(0.5);
    attackEffect.setAlpha(0.8);
    
    // 创建动画
    (this.scene.tweens as any).timeline({
      targets: attackEffect,
      tweens: [
        {
          x: targetX,
          y: targetY,
          scale: isSpecialAttack ? 1.5 : 1.0,
          duration: 400,
          ease: 'Power1'
        },
        {
          scale: isSpecialAttack ? 2.0 : 1.5,
          alpha: 0,
          duration: 200,
          ease: 'Power2'
        }
      ],
      onComplete: () => {
        // 销毁特效精灵
        attackEffect.destroy();
        
        if (onComplete) {
          onComplete();
        }
      }
    });
  }
  
  /**
   * 创建伤害动画
   */
  public playDamageAnimation(
    target: Phaser.GameObjects.GameObject,
    damage: number,
    isCritical: boolean = false,
    onComplete?: () => void
  ): void {
    // 创建伤害文本
    const targetX = (target as any).x || 0;
    const targetY = (target as any).y || 0;
    const damageText = this.scene.add.text(
      targetX, 
      targetY - 50, 
      `-${damage}`, 
      { 
        fontSize: isCritical ? '36px' : '28px',
        fontStyle: isCritical ? 'bold' : 'normal',
        color: isCritical ? '#ff0000' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    // 闪烁目标
    if ('setTint' in target) {
      (this.scene.tweens as any).timeline({
        targets: target,
        tweens: [
          {
            alpha: 0.6,
            duration: 100,
            onStart: () => {
              (target as any).setTint(0xff0000);
            }
          },
          {
            alpha: 1,
            duration: 100,
            onComplete: () => {
              (target as any).clearTint();
            }
          }
        ],
        repeat: 2
      });
    }
    
    // 伤害数字动画
    (this.scene.tweens as any).timeline({
      targets: damageText,
      tweens: [
        {
          y: damageText.y - 30,
          scale: isCritical ? 1.5 : 1.2,
          duration: 300,
          ease: 'Back.easeOut'
        },
        {
          y: damageText.y - 50,
          alpha: 0,
          scale: 0.8,
          duration: 500,
          ease: 'Power2'
        }
      ],
      onComplete: () => {
        // 销毁伤害文本
        damageText.destroy();
        
        if (onComplete) {
          onComplete();
        }
      }
    });
    
    // 如果是暴击，添加额外的特效
    if (isCritical) {
      // 创建暴击特效
      const criticalEffect = this.scene.add.sprite(
        targetX, 
        targetY, 
        'critical_effect'
      );
      
      // 如果没有纹理，创建一个临时的视觉效果
      if (!this.scene.textures.exists('critical_effect')) {
        const graphics = this.scene.add.graphics();
        
        graphics.fillStyle(0xffff00, 0.8);
        // 创建一个星形
        const points = [];
        const outerRadius = 60;
        const innerRadius = 30;
        const spikes = 8;
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI * 2 * i) / (spikes * 2);
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          });
        }
        
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
          graphics.lineTo(points[i].x, points[i].y);
        }
        
        graphics.closePath();
        graphics.fillPath();
        
        // 将图形转换为纹理
        graphics.generateTexture('critical_effect', 120, 120);
        graphics.destroy();
        
        // 重新创建精灵
        criticalEffect.setTexture('critical_effect');
      }
      
      // 设置初始状态
      criticalEffect.setScale(0.5);
      criticalEffect.setAlpha(0.8);
      
      // 创建动画
      this.scene.tweens.add({
        targets: criticalEffect,
        scale: 1.5,
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          criticalEffect.destroy();
        }
      });
    }
  }
  
  /**
   * 创建卡片抽取动画
   */
  public playCardDrawAnimation(
    cardSprite: Phaser.GameObjects.Sprite,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    // 设置初始位置和状态
    cardSprite.setPosition(startX, startY);
    cardSprite.setScale(0.5);
    cardSprite.setAlpha(0);
    
    // 创建动画
    (this.scene.tweens as any).timeline({
      targets: cardSprite,
      tweens: [
        {
          alpha: 1,
          scale: 0.8,
          duration: 200,
          ease: 'Power1'
        },
        {
          x: targetX,
          y: targetY,
          scale: 1,
          duration: 400,
          ease: 'Back.easeOut'
        }
      ],
      onComplete: () => {
        if (onComplete) {
          onComplete();
        }
      }
    });
  }
  
  /**
   * 创建资源获取动画
   */
  public playCatnipGainAnimation(
    x: number,
    y: number,
    amount: number,
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    // 创建资源图标
    const catnipIcon = this.scene.add.sprite(x, y, 'catnip_icon');
    
    // 如果没有纹理，创建一个临时的视觉效果
    if (!this.scene.textures.exists('catnip_icon')) {
      const graphics = this.scene.add.graphics();
      
      graphics.fillStyle(0x4a9c59, 1);
      graphics.fillCircle(0, 0, 15);
      graphics.lineStyle(2, 0x6bdf81);
      graphics.strokeCircle(0, 0, 15);
      
      // 将图形转换为纹理
      graphics.generateTexture('catnip_icon', 30, 30);
      graphics.destroy();
      
      // 重新创建精灵
      catnipIcon.setTexture('catnip_icon');
    }
    
    // 创建资源数量文本
    const amountText = this.scene.add.text(
      x + 20, 
      y, 
      `+${amount}`, 
      { 
        fontSize: '24px',
        color: '#4caf50',
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0.5);
    
    // 创建容器
    const container = this.scene.add.container(0, 0, [catnipIcon, amountText]);
    
    // 创建动画
    (this.scene.tweens as any).timeline({
      targets: container,
      tweens: [
        {
          y: container.y - 30,
          duration: 300,
          ease: 'Power1'
        },
        {
          x: targetX - x,
          y: targetY - y,
          scale: 0.5,
          alpha: 0,
          duration: 500,
          ease: 'Power2'
        }
      ],
      onComplete: () => {
        container.destroy();
        
        if (onComplete) {
          onComplete();
        }
      }
    });
  }
  
  /**
   * 创建按钮点击动画
   */
  public playButtonClickAnimation(
    button: Phaser.GameObjects.GameObject,
    onComplete?: () => void
  ): void {
    (this.scene.tweens as any).timeline({
      targets: button,
      tweens: [
        {
          scale: 0.95,
          duration: 100,
          ease: 'Power1'
        },
        {
          scale: 1,
          duration: 100,
          ease: 'Power1'
        }
      ],
      onComplete: () => {
        if (onComplete) {
          onComplete();
        }
      }
    });
  }
  
  /**
   * 创建胜利动画
   */
  public playVictoryAnimation(
    x: number,
    y: number,
    onComplete?: () => void
  ): void {
    // 创建胜利文本
    const victoryText = this.scene.add.text(
      x, 
      y, 
      '胜利!', 
      { 
        fontSize: '64px',
        color: '#4caf50',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      }
    ).setOrigin(0.5);
    
    // 创建粒子效果
    try {
      const particles = this.scene.add.particles(0, 0, 'particle', {
        x: x,
        y: y,
        speed: { min: 100, max: 200 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        lifespan: 1000,
        blendMode: 'ADD',
        quantity: 50
      });
      
      // 如果没有纹理，创建一个临时的视觉效果
      if (!this.scene.textures.exists('particle')) {
        const graphics = this.scene.add.graphics();
        
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(0, 0, 8);
        
        // 将图形转换为纹理
        graphics.generateTexture('particle', 16, 16);
        graphics.destroy();
      }
      
      // 延迟销毁粒子
      this.scene.time.delayedCall(2000, () => {
        particles.destroy();
      });
    } catch (error) {
      console.warn('无法创建粒子效果:', error);
    }
    
    // 创建动画
    (this.scene.tweens as any).timeline({
      targets: victoryText,
      tweens: [
        {
          scale: 1.2,
          duration: 300,
          ease: 'Back.easeOut'
        },
        {
          scale: 1,
          duration: 200,
          ease: 'Power1'
        }
      ],
      repeat: 2,
      onComplete: () => {
        // 淡出文本
        this.scene.tweens.add({
          targets: victoryText,
          alpha: 0,
          delay: 1000,
          duration: 500,
          onComplete: () => {
            victoryText.destroy();
            
            if (onComplete) {
              onComplete();
            }
          }
        });
      }
    });
  }
  
  /**
   * 创建失败动画
   */
  public playDefeatAnimation(
    x: number,
    y: number,
    onComplete?: () => void
  ): void {
    // 创建失败文本
    const defeatText = this.scene.add.text(
      x, 
      y, 
      '失败!', 
      { 
        fontSize: '64px',
        color: '#f44336',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      }
    ).setOrigin(0.5);
    
    // 创建动画
    (this.scene.tweens as any).timeline({
      targets: defeatText,
      tweens: [
        {
          scale: 1.2,
          duration: 300,
          ease: 'Back.easeOut'
        },
        {
          scale: 1,
          duration: 200,
          ease: 'Power1'
        }
      ],
      repeat: 1,
      onComplete: () => {
        // 淡出文本
        this.scene.tweens.add({
          targets: defeatText,
          alpha: 0,
          delay: 1000,
          duration: 500,
          onComplete: () => {
            defeatText.destroy();
            
            if (onComplete) {
              onComplete();
            }
          }
        });
      }
    });
  }
  
  /**
   * 创建卡片排序动画
   */
  public playCardSortAnimation(
    cardSprite: Phaser.GameObjects.Sprite,
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    // 创建动画
    this.scene.tweens.add({
      targets: cardSprite,
      x: targetX,
      y: targetY,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        if (onComplete) {
          onComplete();
        }
      }
    });
  }
}
