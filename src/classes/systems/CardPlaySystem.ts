import Phaser from "phaser";
import { Card } from "../cards/Card";
import { CatCard } from "../cards/CatCard";
import { SupportCard } from "../cards/SupportCard";
import { Boss } from "../boss/Boss";
import { CardOrderManager } from "./CardOrderManager";

/**
 * 出牌系统
 * 负责管理出牌限制和回合流程
 */
export class CardPlaySystem {
  // 场景引用
  private scene: Phaser.Scene;

  // 出牌限制
  private cardsPerTurn: number;
  private cardsPlayedThisTurn: number = 0;
  private totalPlaysAllowed: number;
  private totalPlaysUsed: number = 0;

  // 当前回合数
  private currentTurn: number = 0;

  // 卡片选择状态
  private selectedCards: Card[] = [];
  private maxSelectableCards: number = 2; // 默认每回合最多选择2张卡

  // 引用其他系统
  private cardOrderManager: CardOrderManager;
  private boss: Boss;

  // 回合状态
  private _isTurnActive: boolean = false;

  // 事件触发器
  private events: Phaser.Events.EventEmitter;

  constructor(
    scene: Phaser.Scene,
    cardsPerTurn: number = 1,
    totalPlaysAllowed: number = 15,
    cardOrderManager: CardOrderManager,
    boss: Boss
  ) {
    this.scene = scene;
    this.cardsPerTurn = cardsPerTurn;
    this.totalPlaysAllowed = totalPlaysAllowed;
    this.cardOrderManager = cardOrderManager;
    this.boss = boss;

    // 创建事件发射器
    this.events = new Phaser.Events.EventEmitter();
  }

  /**
   * 开始新的回合
   */
  public startNewTurn(): void {
    if (this._isTurnActive) {
      console.warn("尝试开始一个新回合，但当前回合尚未结束");
      return;
    }

    this.currentTurn++;
    this.cardsPlayedThisTurn = 0;
    this.selectedCards = [];
    this._isTurnActive = true;

    console.log(`开始第 ${this.currentTurn} 回合`);

    // 触发回合开始事件
    this.events.emit("turnStart", this.currentTurn);

    // 启用所有卡片的交互
    this.enableCardInteraction();
  }

  /**
   * 结束当前回合
   */
  public endTurn(): void {
    if (!this._isTurnActive) {
      console.warn("尝试结束回合，但当前没有活跃的回合");
      return;
    }

    // 处理选中卡片的效果
    this.processSelectedCards();

    // 重置回合状态
    this._isTurnActive = false;

    // 触发回合结束事件
    this.events.emit("turnEnd", this.currentTurn);

    console.log(`结束第 ${this.currentTurn} 回合`);

    // 禁用所有卡片交互
    this.disableCardInteraction();
  }

  /**
   * 选择一张卡片
   */
  public selectCard(card: Card): boolean {
    // 检查是否能选择更多卡片
    if (this.selectedCards.length >= this.maxSelectableCards) {
      console.warn("已达到最大可选卡片数量");
      return false;
    }

    // 检查卡片是否已被选择
    if (this.selectedCards.includes(card)) {
      console.warn("该卡片已被选择");
      return false;
    }

    // 添加到选中列表
    this.selectedCards.push(card);

    // 视觉反馈
    card.select();

    console.log(`选择了卡片: ${card.name}`);

    // 触发卡片选择事件
    this.events.emit("cardSelected", card);

    return true;
  }

  /**
   * 取消选择一张卡片
   */
  public deselectCard(card: Card): boolean {
    const index = this.selectedCards.indexOf(card);

    if (index === -1) {
      console.warn("尝试取消选择一张未被选择的卡片");
      return false;
    }

    // 从选中列表移除
    this.selectedCards.splice(index, 1);

    // 视觉反馈
    card.deselect();

    console.log(`取消选择卡片: ${card.name}`);

    // 触发卡片取消选择事件
    this.events.emit("cardDeselected", card);

    return true;
  }

  /**
   * 使用选中的卡片
   */
  public playSelectedCards(): boolean {
    // 检查是否有卡片被选中
    if (this.selectedCards.length === 0) {
      console.warn("没有选中的卡片可以使用");
      return false;
    }

    // 检查是否还有出牌机会
    if (this.cardsPlayedThisTurn >= this.cardsPerTurn) {
      console.warn("本回合已没有出牌机会");
      return false;
    }

    // 检查是否超过总出牌次数
    if (this.totalPlaysUsed >= this.totalPlaysAllowed) {
      console.warn("已达到总出牌次数限制");
      return false;
    }

    // 增加出牌计数
    this.cardsPlayedThisTurn++;
    this.totalPlaysUsed++;

    // 通过排序管理器处理卡片效果
    this.cardOrderManager.processEffects(this.scene);

    // 触发出牌事件
    this.events.emit("cardsPlayed", this.selectedCards);

    console.log(`使用了 ${this.selectedCards.length} 张卡片`);

    // 清除选中状态
    this.clearCardSelection();

    // 检查回合是否结束
    if (this.cardsPlayedThisTurn >= this.cardsPerTurn) {
      this.endTurn();
    }

    // 检查BOSS是否被击败
    if (this.boss.hp <= 0) {
      this.events.emit("bossDefeated", this.boss);
    }

    return true;
  }

  /**
   * 启用所有卡片的交互
   */
  private enableCardInteraction(): void {
    // 这需要与DeckSystem集成，获取当前手牌中的卡片
    // 示例逻辑，后续需要修改
    const catCards = this.cardOrderManager.getOrderedCatCards();
    const supportCards = this.cardOrderManager.getOrderedSupportCards();

    [...catCards, ...supportCards].forEach((card) => {
      card.enableInteraction();
    });
  }

  /**
   * 禁用所有卡片的交互
   */
  private disableCardInteraction(): void {
    // 这需要与DeckSystem集成，获取当前手牌中的卡片
    // 示例逻辑，后续需要修改
    const catCards = this.cardOrderManager.getOrderedCatCards();
    const supportCards = this.cardOrderManager.getOrderedSupportCards();

    [...catCards, ...supportCards].forEach((card) => {
      card.disableInteraction();
    });
  }

  /**
   * 处理选中卡片的效果
   */
  private processSelectedCards(): void {
    // 将选中的卡片分类
    const selectedCatCards: CatCard[] = [];
    const selectedSupportCards: SupportCard[] = [];

    this.selectedCards.forEach((card) => {
      if (card instanceof CatCard) {
        selectedCatCards.push(card);
      } else if (card instanceof SupportCard) {
        selectedSupportCards.push(card);
      }
    });

    console.log(
      `处理选中的卡片: ${selectedCatCards.length} 张猫咪卡片, ${selectedSupportCards.length} 张辅助卡片`
    );

    // 设置卡片选中状态到排序管理器
    // 在实际游戏中，需要更新卡片排序管理器中的选中状态
  }

  /**
   * 清除卡片选中状态
   */
  private clearCardSelection(): void {
    this.selectedCards.forEach((card) => {
      card.deselect();
    });
    this.selectedCards = [];
  }

  /**
   * 增加每回合可出牌数
   */
  public increaseCardsPerTurn(amount: number): void {
    this.cardsPerTurn += amount;
    console.log(`每回合可出牌数增加至 ${this.cardsPerTurn}`);
  }

  /**
   * 增加总出牌次数限制
   */
  public increaseTotalPlays(amount: number): void {
    this.totalPlaysAllowed += amount;
    console.log(`总出牌次数增加至 ${this.totalPlaysAllowed}`);
  }

  /**
   * 设置每回合最大可选卡片数
   */
  public setMaxSelectableCards(count: number): void {
    this.maxSelectableCards = count;
  }

  /**
   * 检查回合是否已结束
   */
  public isTurnComplete(): boolean {
    return !this._isTurnActive || this.cardsPlayedThisTurn >= this.cardsPerTurn;
  }

  /**
   * 检查回合是否处于活跃状态
   */
  public isTurnActive(): boolean {
    return this._isTurnActive;
  }

  /**
   * 获取剩余出牌次数
   */
  public getRemainingTotalPlays(): number {
    return this.totalPlaysAllowed - this.totalPlaysUsed;
  }

  /**
   * 获取当前回合剩余可出牌数
   */
  public getRemainingCardsThisTurn(): number {
    return Math.max(0, this.cardsPerTurn - this.cardsPlayedThisTurn);
  }

  /**
   * 获取每回合可出牌数
   */
  public getCardsPerTurn(): number {
    return this.cardsPerTurn;
  }

  /**
   * 获取当前回合数
   */
  public getCurrentTurn(): number {
    return this.currentTurn;
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
   * 重置系统状态
   */
  public reset(): void {
    this.currentTurn = 0;
    this.cardsPlayedThisTurn = 0;
    this.totalPlaysUsed = 0;
    this.selectedCards = [];
    this._isTurnActive = false;
  }

  /**
   * 销毁系统资源
   */
  public destroy(): void {
    this.events.removeAllListeners();
    this.selectedCards = [];
  }
}
