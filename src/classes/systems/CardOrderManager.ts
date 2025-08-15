import Phaser from 'phaser';
import { Card } from '../cards/Card';
import { CatCard } from '../cards/CatCard';
import { SupportCard } from '../cards/SupportCard';
import { Upgrade } from '../upgrades/Upgrade';

/**
 * 卡片排序管理系统
 * 负责管理卡片和增益的顺序，以及处理效果触发
 */
export class CardOrderManager {
  private scene: Phaser.Scene;
  private catCards: CatCard[] = [];
  private supportCards: SupportCard[] = [];
  private upgrades: Upgrade[] = [];
  
  // 拖拽相关
  private isDragging: boolean = false;
  private draggedCard: Card | null = null;
  private draggedUpgrade: Upgrade | null = null;
  private originalPosition: { x: number, y: number } = { x: 0, y: 0 };
  private dropZones: Map<string, Phaser.GameObjects.Zone> = new Map();
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // 监听场景的指针事件
    this.setupDragSystem();
  }
  
  /**
   * 设置卡片拖拽系统
   */
  private setupDragSystem(): void {
    // 监听场景的指针事件
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
  }
  
  /**
   * 指针按下事件处理
   */
  private onPointerDown(pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]): void {
    // 检查是否点击了卡片或增益
    if (gameObjects.length > 0) {
      // 寻找点击的是卡片还是增益
      const clickedObject = gameObjects[0];
      
      // 猫咪卡片或辅助卡片
      const cardComponent = this.findCardComponent(clickedObject);
      if (cardComponent) {
        this.startDraggingCard(cardComponent as Card, pointer);
        return;
      }
      
      // 增益
      const upgradeComponent = this.findUpgradeComponent(clickedObject);
      if (upgradeComponent) {
        this.startDraggingUpgrade(upgradeComponent, pointer);
        return;
      }
    }
  }
  
  /**
   * 指针移动事件处理
   */
  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging) return;
    
    // 移动被拖拽的对象
    if (this.draggedCard) {
      this.draggedCard.sprite.x = pointer.x;
      this.draggedCard.sprite.y = pointer.y;
    } else if (this.draggedUpgrade && this.draggedUpgrade.sprite) {
      this.draggedUpgrade.sprite.x = pointer.x;
      this.draggedUpgrade.sprite.y = pointer.y;
    }
  }
  
  /**
   * 指针松开事件处理
   */
  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging) return;
    
    const dropZone = this.findDropZone(pointer);
    
    if (dropZone) {
      // 处理放置在合适区域的情况
      this.handleValidDrop(dropZone, pointer);
    } else {
      // 处理无效放置，返回原位
      this.resetDraggedItemPosition();
    }
    
    // 重置拖拽状态
    this.endDragging();
  }
  
  /**
   * 开始拖拽卡片
   */
  private startDraggingCard(card: Card, _pointer: Phaser.Input.Pointer): void {
    this.isDragging = true;
    this.draggedCard = card;
    this.originalPosition = { x: card.sprite.x, y: card.sprite.y };
    
    // 视觉反馈
    this.scene.tweens.add({
      targets: card.sprite,
      scale: 1.1,
      duration: 100
    });
    
    // 确保拖拽的卡片在最上层显示
    card.sprite.setDepth(1000);
  }
  
  /**
   * 开始拖拽增益
   */
  private startDraggingUpgrade(upgrade: Upgrade, _pointer: Phaser.Input.Pointer): void {
    if (!upgrade.sprite) return;
    
    this.isDragging = true;
    this.draggedUpgrade = upgrade;
    this.originalPosition = { x: upgrade.sprite.x, y: upgrade.sprite.y };
    
    // 视觉反馈
    this.scene.tweens.add({
      targets: upgrade.sprite,
      scale: 1.1,
      duration: 100
    });
    
    // 确保拖拽的增益在最上层显示
    upgrade.sprite.setDepth(1000);
  }
  
  /**
   * 结束拖拽状态
   */
  private endDragging(): void {
    this.isDragging = false;
    
    // 恢复正常大小
    if (this.draggedCard) {
      this.scene.tweens.add({
        targets: this.draggedCard.sprite,
        scale: 1.0,
        duration: 100
      });
      this.draggedCard.sprite.setDepth(0);
      this.draggedCard = null;
    }
    
    if (this.draggedUpgrade && this.draggedUpgrade.sprite) {
      this.scene.tweens.add({
        targets: this.draggedUpgrade.sprite,
        scale: 1.0,
        duration: 100
      });
      this.draggedUpgrade.sprite.setDepth(0);
      this.draggedUpgrade = null;
    }
    
    this.originalPosition = { x: 0, y: 0 };
  }
  
  /**
   * 重置拖拽项到原位置
   */
  private resetDraggedItemPosition(): void {
    if (this.draggedCard) {
      this.scene.tweens.add({
        targets: this.draggedCard.sprite,
        x: this.originalPosition.x,
        y: this.originalPosition.y,
        duration: 200,
        ease: 'Power2'
      });
    } else if (this.draggedUpgrade && this.draggedUpgrade.sprite) {
      this.scene.tweens.add({
        targets: this.draggedUpgrade.sprite,
        x: this.originalPosition.x,
        y: this.originalPosition.y,
        duration: 200,
        ease: 'Power2'
      });
    }
  }
  
  /**
   * 查找指针下方的放置区域
   */
  private findDropZone(pointer: Phaser.Input.Pointer): Phaser.GameObjects.Zone | null {
    for (const [_name, zone] of this.dropZones.entries()) {
      if (Phaser.Geom.Rectangle.Contains(zone.getBounds(), pointer.x, pointer.y)) {
        return zone;
      }
    }
    return null;
  }
  
  /**
   * 处理有效的放置
   */
  private handleValidDrop(dropZone: Phaser.GameObjects.Zone, pointer: Phaser.Input.Pointer): void {
    const zoneName = dropZone.name;
    
    // 根据放置区域的不同，执行不同的处理逻辑
    if (zoneName.startsWith('cat_zone_')) {
      this.handleCatCardDrop(zoneName, pointer);
    } else if (zoneName.startsWith('support_zone_')) {
      this.handleSupportCardDrop(zoneName, pointer);
    } else if (zoneName.startsWith('upgrade_zone_')) {
      this.handleUpgradeDrop(zoneName, pointer);
    }
    
    // 重新排列所有卡片
    this.rearrangeCards();
  }
  
  /**
   * 处理猫咪卡片放置
   */
  private handleCatCardDrop(zoneName: string, _pointer: Phaser.Input.Pointer): void {
    if (!this.draggedCard || !(this.draggedCard instanceof CatCard)) return;
    
    // 获取目标索引
    const targetIndex = Number(zoneName.split('_').pop());
    if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= this.catCards.length) return;
    
    // 获取当前卡片的索引
    const currentIndex = this.catCards.findIndex(card => card === this.draggedCard);
    if (currentIndex === -1) return;
    
    // 移动卡片到新位置
    this.moveCardToNewPosition(this.catCards, currentIndex, targetIndex);
  }
  
  /**
   * 处理辅助卡片放置
   */
  private handleSupportCardDrop(zoneName: string, _pointer: Phaser.Input.Pointer): void {
    if (!this.draggedCard || !(this.draggedCard instanceof SupportCard)) return;
    
    // 获取目标索引
    const targetIndex = Number(zoneName.split('_').pop());
    if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= this.supportCards.length) return;
    
    // 获取当前卡片的索引
    const currentIndex = this.supportCards.findIndex(card => card === this.draggedCard);
    if (currentIndex === -1) return;
    
    // 移动卡片到新位置
    this.moveCardToNewPosition(this.supportCards, currentIndex, targetIndex);
  }
  
  /**
   * 处理增益放置
   */
  private handleUpgradeDrop(zoneName: string, _pointer: Phaser.Input.Pointer): void {
    if (!this.draggedUpgrade) return;
    
    // 获取目标索引
    const targetIndex = Number(zoneName.split('_').pop());
    if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= this.upgrades.length) return;
    
    // 获取当前增益的索引
    const currentIndex = this.upgrades.findIndex(upgrade => upgrade === this.draggedUpgrade);
    if (currentIndex === -1) return;
    
    // 移动增益到新位置
    this.moveItemToNewPosition(this.upgrades, currentIndex, targetIndex);
  }
  
  /**
   * 移动数组中的项到新位置
   */
  private moveItemToNewPosition<T>(array: T[], fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    
    const item = array[fromIndex];
    
    // 从数组中移除
    array.splice(fromIndex, 1);
    
    // 插入到新位置
    array.splice(toIndex, 0, item);
  }
  
  /**
   * 在数组中移动卡片到新位置
   */
  private moveCardToNewPosition<T extends Card>(array: T[], fromIndex: number, toIndex: number): void {
    this.moveItemToNewPosition(array, fromIndex, toIndex);
    
    // 播放音效（在实际游戏中添加）
    // this.scene.sound.play('card_move');
  }
  
  /**
   * 重新排列所有卡片
   */
  private rearrangeCards(): void {
    // 与CardRenderer保持一致的布局常量
    const CARDS_Y = 420;
    const CARD_SPACING = 105;
    const CAT_CARDS_START_X = 80;
    const SUPPORT_CARDS_START_X = 520;
    
    // 重新排列猫咪卡片
    this.catCards.forEach((card, index) => {
      const x = CAT_CARDS_START_X + index * CARD_SPACING;
      const y = CARDS_Y;
      
      this.scene.tweens.add({
        targets: card.sprite,
        x: x,
        y: y,
        duration: 200,
        ease: 'Power2'
      });
    });
    
    // 重新排列辅助卡片
    this.supportCards.forEach((card, index) => {
      const x = SUPPORT_CARDS_START_X + index * CARD_SPACING;
      const y = CARDS_Y;
      
      this.scene.tweens.add({
        targets: card.sprite,
        x: x,
        y: y,
        duration: 200,
        ease: 'Power2'
      });
    });
    
    // 重新排列增益
    this.upgrades.forEach((upgrade, index) => {
      if (!upgrade.sprite) return;
      
      const x = 150 + index * 80;
      const y = 100;
      
      this.scene.tweens.add({
        targets: upgrade.sprite,
        x: x,
        y: y,
        duration: 200,
        ease: 'Power2'
      });
    });
  }
  
  /**
   * 查找卡片组件
   */
  private findCardComponent(gameObject: Phaser.GameObjects.GameObject): Card | null {
    // 在猫咪卡片中查找
    for (const card of this.catCards) {
      if (card.sprite === gameObject) {
        return card;
      }
    }
    
    // 在辅助卡片中查找
    for (const card of this.supportCards) {
      if (card.sprite === gameObject) {
        return card;
      }
    }
    
    return null;
  }
  
  /**
   * 查找增益组件
   */
  private findUpgradeComponent(gameObject: Phaser.GameObjects.GameObject): Upgrade | null {
    for (const upgrade of this.upgrades) {
      if (upgrade.sprite === gameObject) {
        return upgrade;
      }
    }
    
    return null;
  }
  
  /**
   * 创建放置区域
   */
  public createDropZones(): void {
    // 清除现有的区域
    this.dropZones.forEach(zone => zone.destroy());
    this.dropZones.clear();
    
    // 与CardRenderer保持一致的布局常量
    const CARDS_Y = 420;
    const CARD_SPACING = 105;
    const CAT_CARDS_START_X = 80;
    const SUPPORT_CARDS_START_X = 520;
    
    // 为猫咪卡片创建放置区域
    this.catCards.forEach((_, index) => {
      const x = CAT_CARDS_START_X + index * CARD_SPACING;
      const y = CARDS_Y;
      
      const zone = this.scene.add.zone(x, y, 90, 130);
      zone.setName(`cat_zone_${index}`);
      zone.setRectangleDropZone(90, 130);
      
      // 可视化放置区域（在调试模式下）
      this.visualizeDropZone(zone);
      
      this.dropZones.set(`cat_zone_${index}`, zone);
    });
    
    // 为辅助卡片创建放置区域
    this.supportCards.forEach((_, index) => {
      const x = SUPPORT_CARDS_START_X + index * CARD_SPACING;
      const y = CARDS_Y;
      
      const zone = this.scene.add.zone(x, y, 90, 130);
      zone.setName(`support_zone_${index}`);
      zone.setRectangleDropZone(90, 130);
      
      // 可视化放置区域（在调试模式下）
      this.visualizeDropZone(zone);
      
      this.dropZones.set(`support_zone_${index}`, zone);
    });
    
    // 为增益创建放置区域
    this.upgrades.forEach((_, index) => {
      const x = 150 + index * 80;
      const y = 100;
      
      const zone = this.scene.add.zone(x, y, 70, 70);
      zone.setName(`upgrade_zone_${index}`);
      zone.setRectangleDropZone(70, 70);
      
      // 可视化放置区域（在调试模式下）
      this.visualizeDropZone(zone);
      
      this.dropZones.set(`upgrade_zone_${index}`, zone);
    });
  }
  
  /**
   * 可视化放置区域（调试用）
   */
  private visualizeDropZone(zone: Phaser.GameObjects.Zone): void {
    // 跳过可视化，只在拖拽模式或调试模式下显示
    if (!(this.isDragging)) {
      return;
    }
    
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(2, 0xffff00, 0.5);
    
    // 确保 zone.input 不为空
    if (zone.input && zone.input.hitArea) {
      graphics.strokeRect(
        zone.x - zone.input.hitArea.width / 2,
        zone.y - zone.input.hitArea.height / 2,
        zone.input.hitArea.width,
        zone.input.hitArea.height
      );
    } else {
      // 如果 input 不可用，使用默认大小
      const width = 90;
      const height = 130;
      graphics.strokeRect(
        zone.x - width / 2,
        zone.y - height / 2,
        width,
        height
      );
    }
    
    // 延迟后移除可视化效果
    this.scene.time.delayedCall(3000, () => {
      graphics.destroy();
    });
  }
  
  /**
   * 设置猫咪卡片
   */
  public setCatCards(cards: CatCard[]): void {
    this.catCards = [...cards];
    this.createDropZones();
  }
  
  /**
   * 设置辅助卡片
   */
  public setSupportCards(cards: SupportCard[]): void {
    this.supportCards = [...cards];
    this.createDropZones();
  }
  
  /**
   * 设置永久增益
   */
  public setUpgrades(upgrades: Upgrade[]): void {
    this.upgrades = [...upgrades];
    this.createDropZones();
  }
  
  /**
   * 获取排序后的猫咪卡片
   */
  public getOrderedCatCards(): CatCard[] {
    return [...this.catCards];
  }
  
  /**
   * 获取排序后的辅助卡片
   */
  public getOrderedSupportCards(): SupportCard[] {
    return [...this.supportCards];
  }
  
  /**
   * 获取排序后的永久增益
   */
  public getOrderedUpgrades(): Upgrade[] {
    return [...this.upgrades];
  }
  
  /**
   * 获取猫咪卡片的顺序索引
   */
  public getCatCardIndices(): number[] {
    return this.catCards.map((_, index) => index);
  }
  
  /**
   * 获取辅助卡片的顺序索引
   */
  public getSupportCardIndices(): number[] {
    return this.supportCards.map((_, index) => index);
  }
  
  /**
   * 获取永久增益的顺序索引
   */
  public getUpgradeIndices(): number[] {
    return this.upgrades.map((_, index) => index);
  }
  
  /**
   * 处理卡片和增益效果（按照规定顺序）
   * @param battleScene 战斗场景实例
   */
  public processEffects(battleScene: any): void {
    // 1. 先处理辅助卡片效果（从左到右）
    this.supportCards.forEach(card => {
      if (card.isSelected()) {
        card.use();
      }
    });
    
    // 2. 处理永久增益效果
    this.upgrades.forEach(upgrade => {
      upgrade.applyEffect(battleScene);
    });
    
    // 3. 处理猫咪卡片攻击（从左到右）
    this.catCards.forEach(card => {
      if (card.isSelected()) {
        card.use();
      }
    });
  }
  
  /**
   * 清理资源
   */
  public destroy(): void {
    // 移除事件监听
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    
    // 清理放置区域
    this.dropZones.forEach(zone => zone.destroy());
    this.dropZones.clear();
  }
}
