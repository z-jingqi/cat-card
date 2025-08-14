import Phaser from 'phaser';
import { CatCard, CatCardConfig } from '../cards/CatCard';
import { SupportCard, SupportCardConfig } from '../cards/SupportCard';
import { Card } from '../cards/Card';

/**
 * 牌库系统
 * 负责管理卡片的抽取、重抽和洗牌
 */
export class DeckSystem {
  // 场景引用
  private scene: Phaser.Scene;
  
  // 牌库
  private catDeck: CatCardConfig[] = [];
  private supportDeck: SupportCardConfig[] = [];
  
  // 手牌
  private catHand: CatCard[] = [];
  private supportHand: SupportCard[] = [];
  
  // 弃牌堆
  private catDiscardPile: CatCardConfig[] = [];
  private supportDiscardPile: SupportCardConfig[] = [];
  
  // 配置
  private initialCatHandSize: number = 5;
  private initialSupportHandSize: number = 3;
  private maxCatHandSize: number = 8;
  private maxSupportHandSize: number = 5;
  
  // 重抽次数限制
  private redrawLimit: number = 3;
  private redrawsUsed: number = 0;
  
  // 事件触发器
  private events: Phaser.Events.EventEmitter;
  
  constructor(
    scene: Phaser.Scene, 
    catCards: CatCardConfig[], 
    supportCards: SupportCardConfig[]
  ) {
    this.scene = scene;
    this.catDeck = [...catCards];
    this.supportDeck = [...supportCards];
    
    // 创建事件发射器
    this.events = new Phaser.Events.EventEmitter();
    
    // 初始化洗牌
    this.shuffleDecks();
  }
  
  /**
   * 洗牌
   */
  public shuffleDecks(): void {
    // 洗猫咪牌库
    this.catDeck = this.shuffleArray([...this.catDeck]);
    
    // 洗辅助牌库
    this.supportDeck = this.shuffleArray([...this.supportDeck]);
    
    console.log('牌库已洗牌');
  }
  
  /**
   * 随机打乱数组
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  /**
   * 抽取初始手牌
   */
  public drawInitialHand(): { catCards: CatCard[], supportCards: SupportCard[] } {
    // 清空现有手牌
    this.catHand = [];
    this.supportHand = [];
    
    // 抽取猫咪卡片
    for (let i = 0; i < this.initialCatHandSize; i++) {
      const catCard = this.drawCatCard();
      if (catCard) {
        this.catHand.push(catCard);
      }
    }
    
    // 抽取辅助卡片
    for (let i = 0; i < this.initialSupportHandSize; i++) {
      const supportCard = this.drawSupportCard();
      if (supportCard) {
        this.supportHand.push(supportCard);
      }
    }
    
    // 触发事件
    this.events.emit('initialHandDrawn', {
      catCards: this.catHand,
      supportCards: this.supportHand
    });
    
    return {
      catCards: [...this.catHand],
      supportCards: [...this.supportHand]
    };
  }
  
  /**
   * 抽取一张猫咪卡片
   */
  private drawCatCard(): CatCard | null {
    // 检查牌库是否为空
    if (this.catDeck.length === 0) {
      // 如果弃牌堆也为空，则无法抽牌
      if (this.catDiscardPile.length === 0) {
        console.warn('猫咪牌库和弃牌堆均为空，无法抽牌');
        return null;
      }
      
      // 将弃牌堆洗入牌库
      console.log('猫咪牌库已空，将弃牌堆洗入牌库');
      this.catDeck = this.shuffleArray([...this.catDiscardPile]);
      this.catDiscardPile = [];
    }
    
    // 抽一张牌
    const cardConfig = this.catDeck.pop();
    if (!cardConfig) return null;
    
    // 创建卡片对象
    const x = 400; // 默认位置，后续会通过重排卡片调整
    const y = 500; // 默认位置，后续会通过重排卡片调整
    const catCard = this.createCatCard(cardConfig, x, y);
    
    // 触发事件
    this.events.emit('catCardDrawn', catCard);
    
    return catCard;
  }
  
  /**
   * 抽取一张辅助卡片
   */
  private drawSupportCard(): SupportCard | null {
    // 检查牌库是否为空
    if (this.supportDeck.length === 0) {
      // 如果弃牌堆也为空，则无法抽牌
      if (this.supportDiscardPile.length === 0) {
        console.warn('辅助牌库和弃牌堆均为空，无法抽牌');
        return null;
      }
      
      // 将弃牌堆洗入牌库
      console.log('辅助牌库已空，将弃牌堆洗入牌库');
      this.supportDeck = this.shuffleArray([...this.supportDiscardPile]);
      this.supportDiscardPile = [];
    }
    
    // 抽一张牌
    const cardConfig = this.supportDeck.pop();
    if (!cardConfig) return null;
    
    // 创建卡片对象
    const x = 400; // 默认位置，后续会通过重排卡片调整
    const y = 400; // 默认位置，后续会通过重排卡片调整
    const supportCard = this.createSupportCard(cardConfig, x, y);
    
    // 触发事件
    this.events.emit('supportCardDrawn', supportCard);
    
    return supportCard;
  }
  
  /**
   * 创建猫咪卡片对象
   */
  private createCatCard(config: CatCardConfig, x: number, y: number): CatCard {
    return new CatCard(this.scene, x, y, config);
  }
  
  /**
   * 创建辅助卡片对象
   */
  private createSupportCard(config: SupportCardConfig, x: number, y: number): SupportCard {
    return new SupportCard(this.scene, x, y, config);
  }
  
  /**
   * 重抽选中的卡片
   */
  public redrawCards(discardedCats: CatCard[], discardedSupports: SupportCard[]): boolean {
    // 检查是否还有重抽次数
    if (this.redrawsUsed >= this.redrawLimit) {
      console.warn(`已达到重抽次数限制 (${this.redrawLimit}次)`);
      return false;
    }
    
    // 检查是否有选中的卡片
    if (discardedCats.length === 0 && discardedSupports.length === 0) {
      console.warn('没有选中要重抽的卡片');
      return false;
    }
    
    // 消耗一次重抽机会
    this.redrawsUsed++;
    
    // 处理猫咪卡片
    for (const card of discardedCats) {
      // 从手牌中移除
      const index = this.catHand.indexOf(card);
      if (index !== -1) {
        this.catHand.splice(index, 1);
        
        // 将卡片配置添加到弃牌堆
        const cardConfig: CatCardConfig = {
          id: card.id,
          name: card.name,
          description: card.description,
          spriteKey: card.sprite.texture.key,
          breed: card.breed,
          attack: card.attack,
          specialAbility: card.specialAbility
        };
        this.catDiscardPile.push(cardConfig);
        
        // 销毁卡片对象
        card.destroy();
        
        // 抽一张新卡
        const newCard = this.drawCatCard();
        if (newCard) {
          this.catHand.push(newCard);
        }
      }
    }
    
    // 处理辅助卡片
    for (const card of discardedSupports) {
      // 从手牌中移除
      const index = this.supportHand.indexOf(card);
      if (index !== -1) {
        this.supportHand.splice(index, 1);
        
        // 将卡片配置添加到弃牌堆
        const cardConfig: SupportCardConfig = {
          id: card.id,
          name: card.name,
          description: card.description,
          spriteKey: card.sprite.texture.key,
          itemType: card.itemType,
          effect: card.effect,
          value: card.value
        };
        this.supportDiscardPile.push(cardConfig);
        
        // 销毁卡片对象
        card.destroy();
        
        // 抽一张新卡
        const newCard = this.drawSupportCard();
        if (newCard) {
          this.supportHand.push(newCard);
        }
      }
    }
    
    // 触发重抽完成事件
    this.events.emit('cardsRedrawn', {
      catCards: this.catHand,
      supportCards: this.supportHand,
      redrawsRemaining: this.redrawLimit - this.redrawsUsed
    });
    
    console.log(`重抽完成，剩余重抽次数: ${this.redrawLimit - this.redrawsUsed}`);
    
    return true;
  }
  
  /**
   * 回合结束时补充手牌
   */
  public drawToFillHand(): { catCards: CatCard[], supportCards: SupportCard[] } {
    // 抽猫咪卡片直到达到上限
    while (this.catHand.length < this.maxCatHandSize) {
      const catCard = this.drawCatCard();
      if (catCard) {
        this.catHand.push(catCard);
      } else {
        break; // 无法再抽牌
      }
    }
    
    // 抽辅助卡片直到达到上限
    while (this.supportHand.length < this.maxSupportHandSize) {
      const supportCard = this.drawSupportCard();
      if (supportCard) {
        this.supportHand.push(supportCard);
      } else {
        break; // 无法再抽牌
      }
    }
    
    // 触发事件
    this.events.emit('handFilled', {
      catCards: this.catHand,
      supportCards: this.supportHand
    });
    
    return {
      catCards: [...this.catHand],
      supportCards: [...this.supportHand]
    };
  }
  
  /**
   * 弃置卡片
   */
  public discardCard(card: Card): boolean {
    if (card instanceof CatCard) {
      const index = this.catHand.indexOf(card);
      if (index === -1) return false;
      
      // 从手牌中移除
      this.catHand.splice(index, 1);
      
      // 将卡片配置添加到弃牌堆
      const cardConfig: CatCardConfig = {
        id: card.id,
        name: card.name,
        description: card.description,
        spriteKey: card.sprite.texture.key,
        breed: card.breed,
        attack: card.attack,
        specialAbility: card.specialAbility
      };
      this.catDiscardPile.push(cardConfig);
      
      // 销毁卡片对象
      card.destroy();
      
      this.events.emit('cardDiscarded', card);
      return true;
    } 
    else if (card instanceof SupportCard) {
      const index = this.supportHand.indexOf(card);
      if (index === -1) return false;
      
      // 从手牌中移除
      this.supportHand.splice(index, 1);
      
      // 将卡片配置添加到弃牌堆
      const cardConfig: SupportCardConfig = {
        id: card.id,
        name: card.name,
        description: card.description,
        spriteKey: card.sprite.texture.key,
        itemType: card.itemType,
        effect: card.effect,
        value: card.value
      };
      this.supportDiscardPile.push(cardConfig);
      
      // 销毁卡片对象
      card.destroy();
      
      this.events.emit('cardDiscarded', card);
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取当前猫咪手牌
   */
  public getCatHand(): CatCard[] {
    return [...this.catHand];
  }
  
  /**
   * 获取当前辅助手牌
   */
  public getSupportHand(): SupportCard[] {
    return [...this.supportHand];
  }
  
  /**
   * 设置手牌上限
   */
  public setHandSizeLimits(maxCatHandSize: number, maxSupportHandSize: number): void {
    this.maxCatHandSize = maxCatHandSize;
    this.maxSupportHandSize = maxSupportHandSize;
  }
  
  /**
   * 设置重抽次数限制
   */
  public setRedrawLimit(limit: number): void {
    this.redrawLimit = limit;
  }
  
  /**
   * 重置重抽次数
   */
  public resetRedrawCount(): void {
    this.redrawsUsed = 0;
  }
  
  /**
   * 获取剩余重抽次数
   */
  public getRemainingRedraws(): number {
    return Math.max(0, this.redrawLimit - this.redrawsUsed);
  }
  
  /**
   * 增加重抽次数上限
   */
  public increaseRedrawLimit(amount: number): void {
    this.redrawLimit += amount;
  }
  
  /**
   * 添加事件监听器
   */
  public on(event: string, fn: Function, context?: any): void {
    this.events.on(event, fn, context);
  }
  
  /**
   * 移除事件监听器
   */
  public off(event: string, fn?: Function, context?: any): void {
    this.events.off(event, fn, context);
  }
  
  /**
   * 重置整个系统
   */
  public reset(): void {
    // 清理手牌
    this.catHand.forEach(card => card.destroy());
    this.supportHand.forEach(card => card.destroy());
    
    this.catHand = [];
    this.supportHand = [];
    this.catDiscardPile = [];
    this.supportDiscardPile = [];
    this.redrawsUsed = 0;
    
    // 重新洗牌
    this.shuffleDecks();
  }
  
  /**
   * 销毁系统资源
   */
  public destroy(): void {
    // 清理手牌
    this.catHand.forEach(card => card.destroy());
    this.supportHand.forEach(card => card.destroy());
    
    // 清理事件监听
    this.events.removeAllListeners();
    
    // 清理数据
    this.catHand = [];
    this.supportHand = [];
    this.catDeck = [];
    this.supportDeck = [];
    this.catDiscardPile = [];
    this.supportDiscardPile = [];
  }
}
