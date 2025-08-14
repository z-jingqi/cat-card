import Phaser from 'phaser';
import { CatCard } from '../../classes/cards/CatCard';
import { SupportCard } from '../../classes/cards/SupportCard';
import { CardOrderManager } from '../../classes/systems/CardOrderManager';

/**
 * 卡片渲染器
 * 负责卡片的显示、定位和基本交互
 */
export class CardRenderer {
  private scene: Phaser.Scene;
  private cardOrderManager: CardOrderManager;
  
  // 卡片布局配置
  private readonly CAT_CARDS_Y = 420;
  private readonly SUPPORT_CARDS_Y = 480;
  private readonly CARD_SPACING = 120;
  private readonly CARD_START_X = 100;
  
  constructor(scene: Phaser.Scene, cardOrderManager: CardOrderManager) {
    this.scene = scene;
    this.cardOrderManager = cardOrderManager;
  }

  /**
   * 初始化渲染所有卡片
   */
  initRender(): void {
    this.renderCatCards(this.cardOrderManager.getOrderedCatCards());
    this.renderSupportCards(this.cardOrderManager.getOrderedSupportCards());
  }

  /**
   * 渲染猫咪卡片
   */
  private renderCatCards(cards: CatCard[]): void {
    cards.forEach((card, index) => {
      this.renderCard(card, index, this.CAT_CARDS_Y, 'cat');
    });
  }

  /**
   * 渲染辅助卡片
   */
  private renderSupportCards(cards: SupportCard[]): void {
    cards.forEach((card, index) => {
      this.renderCard(card, index, this.SUPPORT_CARDS_Y, 'support');
    });
  }

  /**
   * 渲染单张卡片
   */
  private renderCard(
    card: CatCard | SupportCard, 
    index: number, 
    y: number, 
    type: 'cat' | 'support'
  ): void {
    // 如果卡片已经有sprite，更新位置
    if (card.sprite) {
      this.updateCardPosition(card, index, y);
      return;
    }

    // 创建新的卡片显示
    const x = this.CARD_START_X + index * this.CARD_SPACING;
    
    // 创建卡片背景
    const cardBg = this.scene.add.rectangle(x, y, 100, 140, 0xffffff, 0.9);
    cardBg.setStrokeStyle(2, 0x333333);
    
    // 创建卡片图像占位符
    const cardImage = this.scene.add.rectangle(x, y - 30, 80, 60, 
      type === 'cat' ? 0xffcc99 : 0x99ccff, 0.8);
    
    // 创建卡片名称文本
    const nameText = this.scene.add.text(x, y + 20, card.name, {
      fontSize: '12px',
      color: '#000',
      align: 'center'
    }).setOrigin(0.5);
    
    // 创建卡片统计文本
    let statsText: Phaser.GameObjects.Text;
    if (card instanceof CatCard) {
      statsText = this.scene.add.text(x, y + 40, `攻击: ${card.attack}`, {
        fontSize: '10px',
        color: '#000',
        align: 'center'
      }).setOrigin(0.5);
    } else {
      statsText = this.scene.add.text(x, y + 40, '辅助', {
        fontSize: '10px',
        color: '#000',
        align: 'center'
      }).setOrigin(0.5);
    }
    
    // 创建卡片容器
    const cardContainer = this.scene.add.container(x, y, [
      cardBg, cardImage, nameText, statsText
    ]);
    
    // 设置为交互对象
    cardContainer.setInteractive(
      new Phaser.Geom.Rectangle(-50, -70, 100, 140),
      Phaser.Geom.Rectangle.Contains
    );
    
    // 添加悬停效果
    cardContainer.on('pointerover', () => {
      this.scene.tweens.add({
        targets: cardContainer,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Power2'
      });
    });
    
    cardContainer.on('pointerout', () => {
      if (!card.isSelected()) {
        this.scene.tweens.add({
          targets: cardContainer,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2'
        });
      }
    });
    
    // 将容器设置为卡片的sprite（临时解决方案）
    (card as any).sprite = cardContainer;
  }

  /**
   * 更新单张卡片位置
   */
  private updateCardPosition(
    card: CatCard | SupportCard, 
    index: number, 
    y: number
  ): void {
    if (card.sprite) {
      const targetX = this.CARD_START_X + index * this.CARD_SPACING;
      
      this.scene.tweens.add({
        targets: card.sprite,
        x: targetX,
        y: y,
        duration: 300,
        ease: 'Power2'
      });
    }
  }

  /**
   * 更新所有卡片位置
   */
  updateAllCardPositions(): void {
    const catCards = this.cardOrderManager.getOrderedCatCards();
    const supportCards = this.cardOrderManager.getOrderedSupportCards();
    
    catCards.forEach((card, index) => {
      this.updateCardPosition(card, index, this.CAT_CARDS_Y);
    });
    
    supportCards.forEach((card, index) => {
      this.updateCardPosition(card, index, this.SUPPORT_CARDS_Y);
    });
  }

  /**
   * 更新卡片选中状态的视觉效果
   */
  updateCardVisuals(card: CatCard | SupportCard): void {
    if (!card.sprite) return;
    
    // 尝试将sprite作为容器处理
    const container = card.sprite as unknown as Phaser.GameObjects.Container;
    
    if (container.list && container.list.length > 0) {
      const background = container.list[0] as Phaser.GameObjects.Rectangle;
      
      if (card.isSelected()) {
        // 选中状态 - 高亮边框和缩放
        background.setStrokeStyle(3, 0xffff00);
        this.scene.tweens.add({
          targets: container,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          ease: 'Power2'
        });
      } else {
        // 未选中状态 - 恢复正常
        background.setStrokeStyle(2, 0x333333);
        this.scene.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2'
        });
      }
    }
  }

  /**
   * 禁用所有卡片交互
   */
  disableAllCardInteractions(): void {
    const allCards = [
      ...this.cardOrderManager.getOrderedCatCards(),
      ...this.cardOrderManager.getOrderedSupportCards()
    ];
    
    allCards.forEach(card => {
      if (card.sprite) {
        card.sprite.disableInteractive();
      }
    });
  }

  /**
   * 启用所有卡片交互
   */
  enableAllCardInteractions(): void {
    const allCards = [
      ...this.cardOrderManager.getOrderedCatCards(),
      ...this.cardOrderManager.getOrderedSupportCards()
    ];
    
    allCards.forEach(card => {
      if (card.sprite) {
        card.sprite.setInteractive();
      }
    });
  }

  /**
   * 销毁所有卡片精灵
   */
  destroy(): void {
    const allCards = [
      ...this.cardOrderManager.getOrderedCatCards(),
      ...this.cardOrderManager.getOrderedSupportCards()
    ];
    
    allCards.forEach(card => {
      if (card.sprite) {
        card.sprite.destroy();
        (card as any).sprite = null;
      }
    });
  }
}