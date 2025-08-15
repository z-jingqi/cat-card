import Phaser from 'phaser';
import { GameStateManager } from './GameStateManager';
import { BattleUI } from './BattleUI';
import { CardRenderer } from './CardRenderer';
import { Boss } from '../../classes/boss/Boss';
import { CardPlaySystem } from '../../classes/systems/CardPlaySystem';
import { DeckSystem } from '../../classes/systems/DeckSystem';
import { ResourceSystem } from '../../classes/systems/ResourceSystem';
import { AudioManager } from '../../classes/systems/AudioManager';
import { AnimationManager } from '../../classes/systems/AnimationManager';
import { CardOrderManager } from '../../classes/systems/CardOrderManager';
import { CatCard } from '../../classes/cards/CatCard';
import { SupportCard } from '../../classes/cards/SupportCard';

/**
 * 战斗事件处理器
 * 负责协调各个组件之间的事件通信
 */
export class BattleEventHandler {
  private scene: Phaser.Scene;
  private gameStateManager: GameStateManager;
  private battleUI: BattleUI;
  private cardRenderer: CardRenderer;
  private cardPlaySystem: CardPlaySystem;
  private deckSystem: DeckSystem;
  private resourceSystem: ResourceSystem;
  private audioManager: AudioManager;
  private animationManager: AnimationManager;
  private cardOrderManager: CardOrderManager;
  private boss: Boss;

  constructor(
    scene: Phaser.Scene,
    gameStateManager: GameStateManager,
    battleUI: BattleUI,
    cardRenderer: CardRenderer,
    cardPlaySystem: CardPlaySystem,
    deckSystem: DeckSystem,
    resourceSystem: ResourceSystem,
    audioManager: AudioManager,
    animationManager: AnimationManager,
    cardOrderManager: CardOrderManager,
    boss: Boss
  ) {
    this.scene = scene;
    this.gameStateManager = gameStateManager;
    this.battleUI = battleUI;
    this.cardRenderer = cardRenderer;
    this.cardPlaySystem = cardPlaySystem;
    this.deckSystem = deckSystem;
    this.resourceSystem = resourceSystem;
    this.audioManager = audioManager;
    this.animationManager = animationManager;
    this.cardOrderManager = cardOrderManager;
    this.boss = boss;

    this.setupEventListeners();
    this.setupButtonListeners();
    this.setupInputListeners();
  }

  /**
   * 设置所有事件监听器
   */
  private setupEventListeners(): void {
    // 游戏状态管理器事件
    this.gameStateManager.on('turnStarted', this.onTurnStart, this);
    this.gameStateManager.on('turnEnded', this.onTurnEnd, this);
    this.gameStateManager.on('cardsPlayed', this.onCardsPlayed, this);
    this.gameStateManager.on('bossDefeated', this.onBossDefeated, this);
    this.gameStateManager.on('gameVictory', this.onGameVictory, this);
    this.gameStateManager.on('gameDefeat', this.onGameDefeat, this);
    this.gameStateManager.on('redrawPhaseStarted', this.onRedrawPhaseStarted, this);
    this.gameStateManager.on('redrawPhaseEnded', this.onRedrawPhaseEnded, this);

    // 出牌系统事件
    this.cardPlaySystem.on('turnStart', this.gameStateManager.onTurnStart, this.gameStateManager);
    this.cardPlaySystem.on('turnEnd', this.gameStateManager.onTurnEnd, this.gameStateManager);
    this.cardPlaySystem.on('cardSelected', this.onCardSelected, this);
    this.cardPlaySystem.on('cardDeselected', this.onCardDeselected, this);
    this.cardPlaySystem.on('cardsPlayed', this.gameStateManager.onCardsPlayed, this.gameStateManager);
    this.cardPlaySystem.on('bossDefeated', this.gameStateManager.onBossDefeated, this.gameStateManager);

    // 牌库系统事件
    this.deckSystem.on('initialHandDrawn', this.onInitialHandDrawn, this);
    this.deckSystem.on('cardsRedrawn', this.onCardsRedrawn, this);
    this.deckSystem.on('handFilled', this.onHandFilled, this);

    // BOSS事件
    this.boss.on('died', this.onBossDied, this);

    // 资源系统事件
    this.resourceSystem.on('catnipChanged', this.onCatnipChanged, this);
  }

  /**
   * 设置按钮事件监听器
   */
  private setupButtonListeners(): void {
    const buttons = this.battleUI.getButtons();

    buttons.playButton.on('pointerdown', () => {
      this.cardPlaySystem.playSelectedCards();
    });

    buttons.endTurnButton.on('pointerdown', () => {
      this.cardPlaySystem.endTurn();
    });

    buttons.redrawButton.on('pointerdown', () => {
      this.executeRedraw();
    });
  }

  /**
   * 设置输入事件监听器
   */
  private setupInputListeners(): void {
    this.scene.input.on('gameobjectdown', this.onCardClicked, this);
  }

  /**
   * 卡片点击事件处理
   */
  private onCardClicked(
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject
  ): void {
    const catCards = this.cardOrderManager.getOrderedCatCards();
    const supportCards = this.cardOrderManager.getOrderedSupportCards();

    for (const card of [...catCards, ...supportCards]) {
      // 检查是否点击了卡片的容器或其子元素
      if (card.sprite === gameObject || 
          (card.sprite && (card.sprite as any).list && 
           (card.sprite as any).list.includes(gameObject))) {
        if (this.gameStateManager.isRedrawMode()) {
          this.gameStateManager.toggleCardForRedraw(card);
        } else {
          this.toggleCardForPlay(card);
        }
        break;
      }
    }
  }

  /**
   * 切换卡片的出牌选择状态
   */
  private toggleCardForPlay(card: CatCard | SupportCard): void {
    if (card.isSelected()) {
      this.cardPlaySystem.deselectCard(card);
    } else {
      this.cardPlaySystem.selectCard(card);
    }
  }

  /**
   * 执行重抽操作
   */
  private executeRedraw(): void {
    const selected = this.gameStateManager.getSelectedForRedraw();
    
    if (selected.cats.length === 0 && selected.supports.length === 0) {
      console.warn("没有选择要重抽的卡片");
      return;
    }

    this.deckSystem.redrawCards(selected.cats, selected.supports);
    this.gameStateManager.clearRedrawSelection();
  }

  /**
   * 回合开始事件处理
   */
  private onTurnStart(turn: number): void {
    this.battleUI.showMessage(`回合 ${turn} 开始`, "#4CAF50");
    this.updateUI();
  }

  /**
   * 回合结束事件处理
   */
  private onTurnEnd(turn: number): void {
    this.deckSystem.drawToFillHand();
    this.battleUI.showMessage(`回合 ${turn} 结束`, "#FF9800");
    this.updateUI();

    // 延迟后开始下一回合
    this.scene.time.delayedCall(1000, () => {
      this.cardPlaySystem.startNewTurn();
    });
  }

  /**
   * 卡片选择事件处理
   */
  private onCardSelected(card: CatCard | SupportCard): void {
    console.log(`选择卡片: ${card.name}`);
    this.cardRenderer.updateCardVisuals(card);
  }

  /**
   * 卡片取消选择事件处理
   */
  private onCardDeselected(card: CatCard | SupportCard): void {
    console.log(`取消选择卡片: ${card.name}`);
    this.cardRenderer.updateCardVisuals(card);
  }

  /**
   * 卡片使用事件处理
   */
  private onCardsPlayed(cards: (CatCard | SupportCard)[]): void {
    console.log(`使用了 ${cards.length} 张卡片`);
    
    // 播放卡片使用音效
    this.audioManager.playSfx('card_play');
    
    // 播放卡片使用动画
    cards.forEach(card => {
      if (card.sprite) {
        this.animationManager.playCardAnimation(
          card.sprite as Phaser.GameObjects.Sprite,
          this.scene.cameras.main.width / 2,
          this.scene.cameras.main.height / 2
        );
      }
    });
    
    this.updateUI();
  }

  /**
   * BOSS被击败事件处理
   */
  private onBossDefeated(boss: Boss): void {
    console.log(`BOSS ${boss.name} 被击败!`);
    
    this.audioManager.playSfx('victory');
    this.animationManager.playVictoryAnimation(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 3
    );
    
    // 计算奖励
    const turnsUsed = this.cardPlaySystem.getCurrentTurn();
    const totalTurns = 15;
    const reward = this.resourceSystem.calculateBattleReward(
      turnsUsed,
      totalTurns,
      boss.maxHp
    );
    
    // 延迟添加奖励
    this.scene.time.delayedCall(1000, () => {
      this.resourceSystem.addCatnip(reward, `击败BOSS: ${boss.name}`);
      this.audioManager.playSfx('catnip_gain');
      this.battleUI.showMessage(`获得猫薄荷: ${reward}`, "#4CAF50");
      
      this.animationManager.playCatnipGainAnimation(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
        reward,
        this.scene.cameras.main.width - 120,
        50
      );
    });
  }

  /**
   * 游戏胜利事件处理
   */
  private onGameVictory(boss: Boss): void {
    this.battleUI.disableAllButtons();
    this.cardRenderer.disableAllCardInteractions();
    
    this.battleUI.showVictoryScreen(() => {
      // 跳转到商店场景
      this.scene.scene.start('ShopScene', {
        currentLevel: this.gameStateManager.getCurrentLevel(),
        nextLevel: this.gameStateManager.getCurrentLevel() + 1,
        resourceSystem: this.resourceSystem,
        audioManager: this.audioManager
      });
    });
  }

  /**
   * 游戏失败事件处理
   */
  private onGameDefeat(): void {
    this.battleUI.disableAllButtons();
    this.cardRenderer.disableAllCardInteractions();
    
    this.battleUI.showDefeatScreen(() => {
      this.scene.scene.restart();
    });
  }

  /**
   * BOSS死亡事件处理
   */
  private onBossDied(): void {
    console.log("BOSS已死亡");
  }

  /**
   * 初始手牌抽取事件处理
   */
  private onInitialHandDrawn(result: {
    catCards: CatCard[];
    supportCards: SupportCard[];
  }): void {
    console.log(
      `初始手牌: ${result.catCards.length}张猫咪卡, ${result.supportCards.length}张辅助卡`
    );

    // 先清除可能已存在的卡片渲染
    this.cardRenderer.destroy();

    // 先设置卡片到排序管理器
    this.cardOrderManager.setCatCards(result.catCards);
    this.cardOrderManager.setSupportCards(result.supportCards);
    
    // 延迟一帧渲染卡片，确保位置正确
    this.scene.time.delayedCall(10, () => {
      this.cardRenderer.initRender();
    });
  }

  /**
   * 卡片重抽事件处理
   */
  private onCardsRedrawn(result: {
    catCards: CatCard[];
    supportCards: SupportCard[];
    redrawsRemaining: number;
  }): void {
    console.log(`重抽完成，剩余重抽次数: ${result.redrawsRemaining}`);

    // 清理旧的卡片
    this.cardRenderer.destroy();
    
    // 先设置卡片到排序管理器
    this.cardOrderManager.setCatCards(result.catCards);
    this.cardOrderManager.setSupportCards(result.supportCards);
    
    // 延迟一帧渲染卡片，确保位置正确
    this.scene.time.delayedCall(10, () => {
      // 重新渲染新卡片
      this.cardRenderer.initRender();
      this.updateUI();

      if (this.cardPlaySystem.getCurrentTurn() === 0) {
        this.gameStateManager.exitRedrawPhase();
        this.cardPlaySystem.startNewTurn();
      }
    });
  }

  /**
   * 手牌补充事件处理
   */
  private onHandFilled(result: {
    catCards: CatCard[];
    supportCards: SupportCard[];
  }): void {
    console.log(
      `手牌补充: ${result.catCards.length}张猫咪卡, ${result.supportCards.length}张辅助卡`
    );

    // 清理旧卡片
    this.cardRenderer.destroy();
    
    // 先设置卡片到排序管理器
    this.cardOrderManager.setCatCards(result.catCards);
    this.cardOrderManager.setSupportCards(result.supportCards);
    
    // 延迟一帧渲染卡片，确保位置正确
    this.scene.time.delayedCall(10, () => {
      // 重新渲染新卡片
      this.cardRenderer.initRender();
    });
  }

  /**
   * 重抽阶段开始事件处理
   */
  private onRedrawPhaseStarted(): void {
    this.updateUI();
  }

  /**
   * 重抽阶段结束事件处理
   */
  private onRedrawPhaseEnded(): void {
    this.gameStateManager.clearRedrawSelection();
    this.updateUI();
  }

  /**
   * 猫薄荷资源变化事件处理
   */
  private onCatnipChanged(data: { 
    oldAmount: number; 
    newAmount: number; 
    delta: number;
    isGain: boolean;
    source?: string;
    reason?: string;
  }): void {
    console.log(`猫薄荷变化: ${data.isGain ? '+' : '-'}${data.delta}, 当前总数: ${data.newAmount}`);
    
    const changeAmount = data.isGain ? data.delta : -data.delta;
    this.battleUI.getCatnipDisplay().showChangeEffect(changeAmount);
  }

  /**
   * 更新UI
   */
  private updateUI(): void {
    this.battleUI.update();
    this.battleUI.updateButtonStates(
      this.gameStateManager.isRedrawMode(),
      this.cardPlaySystem.isTurnActive(),
      this.cardPlaySystem.isTurnComplete()
    );
  }
}
