import Phaser from "phaser";
import { Boss } from "../classes/boss/Boss";
import { CardOrderManager } from "../classes/systems/CardOrderManager";
import { CardPlaySystem } from "../classes/systems/CardPlaySystem";
import { DeckSystem } from "../classes/systems/DeckSystem";
import { ResourceSystem } from "../classes/systems/ResourceSystem";
import { AudioManager } from "../classes/systems/AudioManager";
import { AnimationManager } from "../classes/systems/AnimationManager";
import { CatCard } from "../classes/cards/CatCard";
import { SupportCard } from "../classes/cards/SupportCard";
import { BOSSES } from "../constants/bosses";
import { CAT_CARDS, SUPPORT_CARDS } from "../constants/cards";
import { CatnipDisplay } from "../ui/CatnipDisplay";
import { Button } from "../ui/Button";
import { SettingsMenu } from "../ui/SettingsMenu";

/**
 * 战斗场景
 * 整合各系统，实现完整的战斗流程
 */
export default class BattleScene extends Phaser.Scene {
      // 系统组件
  private boss!: Boss;
  private cardOrderManager!: CardOrderManager;
  private cardPlaySystem!: CardPlaySystem;
  private deckSystem!: DeckSystem;
  private resourceSystem!: ResourceSystem;
  private audioManager!: AudioManager;
  private animationManager!: AnimationManager;
  
  // 玩家状态
    private playerHp: number = 100;
  private maxPlayerHp: number = 100;
  
  // 资源UI
  private catnipDisplay!: CatnipDisplay;

  // UI元素
  private playerHpText!: Phaser.GameObjects.Text;
  private bossHpText!: Phaser.GameObjects.Text;
  private remainingPlaysText!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;
  private redrawsText!: Phaser.GameObjects.Text;
  
  // 设置菜单
  private settingsMenu!: SettingsMenu;
  private settingsButton!: Button;

  // 控制按钮
  private playButton!: Phaser.GameObjects.Text;
  private endTurnButton!: Phaser.GameObjects.Text;
  private redrawButton!: Phaser.GameObjects.Text;

  // 当前关卡
  private currentLevel: number = 1;

  // 选中的卡片（用于重抽）
  private selectedForRedraw: {
    cats: CatCard[];
    supports: SupportCard[];
  } = {
    cats: [],
    supports: [],
  };

    constructor() {
        super({ key: "BattleScene" });
    }
    
    /**
     * 初始化场景数据
     */
    init(data: any): void {
        // 从上一个场景获取数据
        if (data) {
            if (data.level) {
                this.currentLevel = data.level;
            }
            
            // 如果有资源系统，使用它
            if (data.resourceSystem) {
                this.resourceSystem = data.resourceSystem;
            }
            
            // 如果有音频管理器，使用它
            if (data.audioManager) {
                this.audioManager = data.audioManager;
            }
            
            // 如果有已购买的升级，保存它们
            if (data.purchasedUpgrades) {
                // 这里会在后续实现永久增益系统时使用
                console.log(`接收到 ${data.purchasedUpgrades.length} 个已购买的永久增益`);
            }
        }
    }

    create(): void {
    // 创建背景
    this.createBackground();
    
    // 初始化音频管理器（如果没有从上一个场景传递过来）
    if (!this.audioManager) {
      this.audioManager = new AudioManager(this);
      this.audioManager.init();
    }
    
    // 初始化动画管理器
    this.animationManager = new AnimationManager(this);
    
    // 播放背景音乐
    this.audioManager.playMusic('battle_music');
    
    // 初始化BOSS
    this.createBoss();
    
    // 初始化卡片排序管理系统
    this.cardOrderManager = new CardOrderManager(this);
    
    // 初始化牌库系统
    this.deckSystem = new DeckSystem(this, CAT_CARDS, SUPPORT_CARDS);
    
    // 抽取初始手牌
    const initialHand = this.deckSystem.drawInitialHand();
    
    // 设置卡片到排序管理器
    this.cardOrderManager.setCatCards(initialHand.catCards);
    this.cardOrderManager.setSupportCards(initialHand.supportCards);
    
    // 初始化出牌系统
    this.cardPlaySystem = new CardPlaySystem(
      this,
      2, // 每回合可出牌数
      15, // 总出牌次数限制
      this.cardOrderManager,
      this.boss
    );
    
    // 初始化资源系统（如果没有从上一个场景传递过来）
    if (!this.resourceSystem) {
      this.resourceSystem = new ResourceSystem(this, 10); // 初始10个猫薄荷
    }
    
    // 创建UI元素
    this.createUI();
    
    // 设置事件监听
    this.setupEventListeners();
    
    // 开始第一回合
    this.startBattle();
  }

  /**
   * 创建背景
   */
  private createBackground(): void {
    this.add
      .rectangle(
        0,
        0,
        this.cameras.main.width,
        this.cameras.main.height,
        0x87ceeb
      )
      .setOrigin(0, 0);
  }

  /**
   * 创建BOSS
   */
  private createBoss(): void {
    const bossConfig = BOSSES[this.currentLevel - 1] || BOSSES[0];
    this.boss = new Boss(this, 750, 200, bossConfig);
  }

  /**
   * 创建UI元素
   */
  private createUI(): void {
    // 玩家生命值
    this.playerHpText = this.add.text(
      50,
      50,
      `玩家血量: ${this.playerHp}/${this.maxPlayerHp}`,
      {
        fontSize: "24px",
        color: "#000",
      }
    );

    // BOSS生命值
    this.bossHpText = this.add.text(
      600,
      50,
      `BOSS血量: ${this.boss.hp}/${this.boss.maxHp}`,
      {
        fontSize: "24px",
        color: "#000",
      }
    );

    // 剩余出牌次数
    this.remainingPlaysText = this.add.text(
      50,
      80,
      `剩余出牌: ${this.cardPlaySystem.getRemainingTotalPlays()}`,
      {
        fontSize: "24px",
        color: "#000",
      }
    );

    // 当前回合
    this.turnText = this.add.text(
      50,
      110,
      `当前回合: ${this.cardPlaySystem.getCurrentTurn()}`,
      {
        fontSize: "24px",
        color: "#000",
      }
    );

    // 剩余重抽次数
    this.redrawsText = this.add.text(
      50,
      140,
      `剩余重抽: ${this.deckSystem.getRemainingRedraws()}`,
      {
        fontSize: "24px",
        color: "#000",
      }
    );
    
    // 创建猫薄荷资源显示
    this.catnipDisplay = new CatnipDisplay(this, this.resourceSystem, {
      x: this.cameras.main.width - 120,
      y: 50,
      width: 120,
      height: 40,
      backgroundColor: 0x4a9c59,
      borderColor: 0x6bdf81,
      textStyle: {
        fontSize: '20px',
        color: '#fff',
        fontStyle: 'bold'
      }
    });

    // 出牌按钮
    this.playButton = this.add
      .text(500, 550, "出牌", {
        fontSize: "24px",
        color: "#fff",
        backgroundColor: "#4CAF50",
        padding: { x: 20, y: 10 },
      })
      .setInteractive()
      .on("pointerdown", () => {
        this.cardPlaySystem.playSelectedCards();
      });

    // 结束回合按钮
    this.endTurnButton = this.add
      .text(650, 550, "结束回合", {
        fontSize: "24px",
        color: "#fff",
        backgroundColor: "#2196F3",
        padding: { x: 20, y: 10 },
      })
      .setInteractive()
      .on("pointerdown", () => {
        this.cardPlaySystem.endTurn();
      });

    // 重抽按钮
    this.redrawButton = this.add
      .text(350, 550, "重抽", {
        fontSize: "24px",
        color: "#fff",
        backgroundColor: "#FF9800",
        padding: { x: 20, y: 10 },
      })
      .setInteractive()
      .on("pointerdown", () => {
        this.redrawSelectedCards();
      });

    // 帮助提示
    this.add.text(50, 520, "提示: 点击卡片选择，拖拽卡片调整顺序", {
      fontSize: "18px",
      color: "#333",
    });
    
    // 创建设置按钮
    this.settingsButton = new Button(
      this,
      this.cameras.main.width - 50,
      50,
      40,
      40,
      '⚙️',
      {
        backgroundColor: 0x2196F3,
        fontSize: '20px'
      },
      () => {
        this.openSettings();
      },
      this.audioManager
    );
    
    // 创建设置菜单
    this.settingsMenu = new SettingsMenu(this, this.audioManager);
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 监听出牌系统事件
    this.cardPlaySystem.on("turnStart", this.onTurnStart, this);
    this.cardPlaySystem.on("turnEnd", this.onTurnEnd, this);
    this.cardPlaySystem.on("cardSelected", this.onCardSelected, this);
    this.cardPlaySystem.on("cardDeselected", this.onCardDeselected, this);
    this.cardPlaySystem.on("cardsPlayed", this.onCardsPlayed, this);
    this.cardPlaySystem.on("bossDefeated", this.onBossDefeated, this);

    // 监听牌库系统事件
    this.deckSystem.on("initialHandDrawn", this.onInitialHandDrawn, this);
    this.deckSystem.on("cardsRedrawn", this.onCardsRedrawn, this);
    this.deckSystem.on("handFilled", this.onHandFilled, this);

    // 监听BOSS事件
    this.boss.on("died", this.onBossDied, this);
    
    // 监听资源系统事件
    this.resourceSystem.on("catnipChanged", this.onCatnipChanged, this);

    // 为卡片添加选择/重抽点击事件
    this.input.on("gameobjectdown", this.onCardClicked, this);
  }

  /**
   * 卡片点击事件
   */
  private onCardClicked(
    _pointer: Phaser.Input.Pointer,
    gameObject: Phaser.GameObjects.GameObject
  ): void {
    // 查找点击的是哪张卡片
    const catCards = this.cardOrderManager.getOrderedCatCards();
    const supportCards = this.cardOrderManager.getOrderedSupportCards();

    for (const card of [...catCards, ...supportCards]) {
      if (card.sprite === gameObject) {
        // 根据当前模式决定操作
        if (this.isRedrawMode()) {
          this.toggleCardForRedraw(card);
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
   * 切换卡片的重抽选择状态
   */
  private toggleCardForRedraw(card: CatCard | SupportCard): void {
    if (card instanceof CatCard) {
      const index = this.selectedForRedraw.cats.indexOf(card);
      if (index === -1) {
        this.selectedForRedraw.cats.push(card);
        card.select(); // 视觉反馈
      } else {
        this.selectedForRedraw.cats.splice(index, 1);
        card.deselect(); // 视觉反馈
      }
    } else {
      const index = this.selectedForRedraw.supports.indexOf(card);
      if (index === -1) {
        this.selectedForRedraw.supports.push(card);
        card.select(); // 视觉反馈
      } else {
        this.selectedForRedraw.supports.splice(index, 1);
        card.deselect(); // 视觉反馈
      }
    }

    console.log(
      `已选择重抽: ${this.selectedForRedraw.cats.length}张猫咪卡, ${this.selectedForRedraw.supports.length}张辅助卡`
    );
  }

  /**
   * 执行重抽
   */
  private redrawSelectedCards(): void {
    if (
      this.selectedForRedraw.cats.length === 0 &&
      this.selectedForRedraw.supports.length === 0
    ) {
      console.warn("没有选择要重抽的卡片");
      return;
    }

    // 执行重抽
    this.deckSystem.redrawCards(
      this.selectedForRedraw.cats,
      this.selectedForRedraw.supports
    );

    // 清空选择
    this.selectedForRedraw.cats = [];
    this.selectedForRedraw.supports = [];
  }

  /**
   * 检查是否处于重抽模式
   */
  private isRedrawMode(): boolean {
    // 在游戏开始阶段和回合开始时可以重抽
    return (
      this.cardPlaySystem.getCurrentTurn() === 0 ||
      (this.cardPlaySystem.getCurrentTurn() > 0 &&
        this.cardPlaySystem.getRemainingCardsThisTurn() ===
          this.cardPlaySystem.getCardsPerTurn())
    );
  }

  /**
   * 更新UI元素
   */
    private updateUI(): void {
    // 更新玩家生命值
    this.playerHpText.setText(`玩家血量: ${this.playerHp}/${this.maxPlayerHp}`);

    // 更新BOSS生命值
    this.bossHpText.setText(`BOSS血量: ${this.boss.hp}/${this.boss.maxHp}`);

    // 更新剩余出牌次数
    this.remainingPlaysText.setText(
      `剩余出牌: ${this.cardPlaySystem.getRemainingTotalPlays()}`
    );

    // 更新当前回合
    this.turnText.setText(`当前回合: ${this.cardPlaySystem.getCurrentTurn()}`);

    // 更新重抽次数
    this.redrawsText.setText(
      `剩余重抽: ${this.deckSystem.getRemainingRedraws()}`
    );

    // 根据当前状态启用/禁用按钮
    this.updateButtonStates();
  }

  /**
   * 更新按钮状态
   */
  private updateButtonStates(): void {
    // 出牌按钮
    if (this.isRedrawMode() || this.cardPlaySystem.isTurnComplete()) {
      this.playButton.setAlpha(0.5);
      this.playButton.disableInteractive();
    } else {
      this.playButton.setAlpha(1);
      this.playButton.setInteractive();
    }

    // 结束回合按钮
    if (this.isRedrawMode() || !this.cardPlaySystem.isTurnActive()) {
      this.endTurnButton.setAlpha(0.5);
      this.endTurnButton.disableInteractive();
    } else {
      this.endTurnButton.setAlpha(1);
      this.endTurnButton.setInteractive();
    }

    // 重抽按钮
    if (!this.isRedrawMode() || this.deckSystem.getRemainingRedraws() <= 0) {
      this.redrawButton.setAlpha(0.5);
      this.redrawButton.disableInteractive();
    } else {
      this.redrawButton.setAlpha(1);
      this.redrawButton.setInteractive();
    }
  }

  /**
   * 开始战斗
   */
  private startBattle(): void {
    console.log("开始战斗!");
    this.updateUI();

    // 战斗开始时允许重抽
    this.enableRedrawMode();

    // 延迟后开始第一回合
    this.time.delayedCall(2000, () => {
      if (this.isRedrawMode()) {
        // 如果玩家没有重抽，自动开始第一回合
        this.disableRedrawMode();
        this.cardPlaySystem.startNewTurn();
      }
    });
  }

  /**
   * 启用重抽模式
   */
  private enableRedrawMode(): void {
    this.selectedForRedraw = { cats: [], supports: [] };
    this.updateButtonStates();
  }

  /**
   * 禁用重抽模式
   */
  private disableRedrawMode(): void {
    this.selectedForRedraw = { cats: [], supports: [] };

    // 取消所有卡片的选中状态
    const catCards = this.cardOrderManager.getOrderedCatCards();
    const supportCards = this.cardOrderManager.getOrderedSupportCards();

    for (const card of [...catCards, ...supportCards]) {
      card.deselect();
    }

    this.updateButtonStates();
  }

  /**
   * 回合开始事件处理
   */
  private onTurnStart(turn: number): void {
    console.log(`回合 ${turn} 开始`);
    this.updateUI();

    // 显示回合开始消息
    this.showMessage(`回合 ${turn} 开始`, "#4CAF50");
  }

  /**
   * 回合结束事件处理
   */
  private onTurnEnd(turn: number): void {
    console.log(`回合 ${turn} 结束`);

    // 补充手牌
    this.deckSystem.drawToFillHand();

    // 更新UI
    this.updateUI();

    // 显示回合结束消息
    this.showMessage(`回合 ${turn} 结束`, "#FF9800");

    // 延迟后开始下一回合
    this.time.delayedCall(1000, () => {
      this.cardPlaySystem.startNewTurn();
    });
  }

  /**
   * 卡片选择事件处理
   */
  private onCardSelected(card: CatCard | SupportCard): void {
    console.log(`选择卡片: ${card.name}`);
  }

  /**
   * 卡片取消选择事件处理
   */
  private onCardDeselected(card: CatCard | SupportCard): void {
    console.log(`取消选择卡片: ${card.name}`);
  }

  /**
   * 卡片使用事件处理
   */
  private onCardsPlayed(cards: (CatCard | SupportCard)[]): void {
    console.log(`使用了 ${cards.length} 张卡片`);
    
    // 播放卡片使用音效
    this.audioManager.playSfx('card_play');
    
    // 对于每张卡片，播放使用动画
    cards.forEach(card => {
      if (card.sprite) {
        // 使用动画管理器播放卡片使用动画
        this.animationManager.playCardAnimation(
          card.sprite as Phaser.GameObjects.Sprite,
          this.cameras.main.width / 2,
          this.cameras.main.height / 2
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
    
    // 播放胜利音效
    this.audioManager.playSfx('victory');
    
    // 播放胜利动画
    this.animationManager.playVictoryAnimation(
      this.cameras.main.width / 2,
      this.cameras.main.height / 3
    );
    
    // 计算并添加猫薄荷奖励
    const turnsUsed = this.cardPlaySystem.getCurrentTurn();
    const totalTurns = 15; // 假设总回合数限制是15
    const reward = this.resourceSystem.calculateBattleReward(
      turnsUsed,
      totalTurns,
      boss.maxHp
    );
    
    // 延迟一下添加奖励，让玩家先看到胜利画面
    this.time.delayedCall(1000, () => {
      this.resourceSystem.addCatnip(reward, `击败BOSS: ${boss.name}`);
      this.audioManager.playSfx('catnip_gain');
      this.showMessage(`获得猫薄荷: ${reward}`, "#4CAF50");
      
      // 播放资源获取动画
      this.animationManager.playCatnipGainAnimation(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        reward,
        this.cameras.main.width - 120,
        50
      );
    });
    
    this.showVictoryScreen();
  }

  /**
   * BOSS死亡事件处理
   */
  private onBossDied(): void {
    console.log("BOSS已死亡");
    // 这里可以添加额外的死亡效果
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

    // 更新卡片排序管理器
    this.cardOrderManager.setCatCards(result.catCards);
    this.cardOrderManager.setSupportCards(result.supportCards);
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

    // 更新卡片排序管理器
    this.cardOrderManager.setCatCards(result.catCards);
    this.cardOrderManager.setSupportCards(result.supportCards);

    // 更新UI
    this.updateUI();

    // 如果是战斗开始阶段，自动开始第一回合
    if (this.cardPlaySystem.getCurrentTurn() === 0) {
      this.disableRedrawMode();
      this.cardPlaySystem.startNewTurn();
    }
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

    // 更新卡片排序管理器
    this.cardOrderManager.setCatCards(result.catCards);
    this.cardOrderManager.setSupportCards(result.supportCards);
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
    
    // 显示资源变化效果
    const changeAmount = data.isGain ? data.delta : -data.delta;
    this.catnipDisplay.showChangeEffect(changeAmount);
  }

  /**
   * 显示消息
   */
  private showMessage(text: string, color: string = "#000"): void {
    const message = this.add
      .text(this.cameras.main.width / 2, 300, text, {
        fontSize: "32px",
        color: color,
        backgroundColor: "#ffffff80",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: message,
      alpha: 0,
      y: message.y - 50,
      duration: 2000,
      ease: "Power2",
      onComplete: () => {
        message.destroy();
      },
    });
  }

  /**
   * 显示胜利界面
   */
  private showVictoryScreen(): void {
    // 禁用交互
    this.disableAllInteractions();

    // 创建胜利文本
    const victoryText = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        "胜利!",
        {
          fontSize: "64px",
          color: "#4CAF50",
          fontStyle: "bold",
          backgroundColor: "#00000080",
          padding: { x: 30, y: 20 },
        }
      )
      .setOrigin(0.5);

    // 添加动画效果
    this.tweens.add({
      targets: victoryText,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 2,
    });

    // 添加继续按钮
    const continueButton = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 + 100,
        "继续",
        {
          fontSize: "32px",
          color: "#fff",
          backgroundColor: "#4CAF50",
          padding: { x: 20, y: 10 },
        }
      )
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => {
        // 播放按钮点击音效
        this.audioManager.playSfx('button_click');
        
        // 跳转到商店场景
        this.scene.start('ShopScene', {
          currentLevel: this.currentLevel,
          nextLevel: this.currentLevel + 1,
          resourceSystem: this.resourceSystem,
          audioManager: this.audioManager
        });
      });

    // 添加按钮动画
    this.tweens.add({
      targets: continueButton,
      alpha: { from: 0, to: 1 },
      y: { from: continueButton.y + 50, to: continueButton.y },
      duration: 1000,
      ease: "Power2",
      delay: 1000,
    });
  }

  /**
   * 显示失败界面
   */
  private showDefeatScreen(): void {
    // 禁用交互
    this.disableAllInteractions();

    // 创建失败文本
    const defeatText = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        "失败!",
        {
          fontSize: "64px",
          color: "#F44336",
          fontStyle: "bold",
          backgroundColor: "#00000080",
          padding: { x: 30, y: 20 },
        }
      )
      .setOrigin(0.5);

    // 添加动画效果
    this.tweens.add({
      targets: defeatText,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 2,
    });

    // 添加重试按钮
    const retryButton = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 + 100,
        "重试",
        {
          fontSize: "32px",
          color: "#fff",
          backgroundColor: "#F44336",
          padding: { x: 20, y: 10 },
        }
      )
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => {
        // 重新开始战斗
        this.scene.restart();
      });

    // 添加按钮动画
    this.tweens.add({
      targets: retryButton,
      alpha: { from: 0, to: 1 },
      y: { from: retryButton.y + 50, to: retryButton.y },
      duration: 1000,
      ease: "Power2",
      delay: 1000,
    });
  }

    /**
   * 禁用所有交互
   */
  private disableAllInteractions(): void {
    // 禁用按钮
    this.playButton.disableInteractive();
    this.endTurnButton.disableInteractive();
    this.redrawButton.disableInteractive();
    
    // 禁用卡片交互
    const catCards = this.cardOrderManager.getOrderedCatCards();
    const supportCards = this.cardOrderManager.getOrderedSupportCards();
    
    for (const card of [...catCards, ...supportCards]) {
      card.disableInteraction();
    }
  }
  
  /**
   * 打开设置菜单
   */
  private openSettings(): void {
    this.settingsMenu.open();
  }

  /**
   * 检查游戏结束条件
   */
  private checkGameOver(): void {
    // 检查胜利条件
    if (this.boss.hp <= 0) {
      this.showVictoryScreen();
      return;
    }

    // 检查失败条件（出牌次数用完）
    if (this.cardPlaySystem.getRemainingTotalPlays() <= 0) {
      this.showDefeatScreen();
      return;
    }
  }

  /**
   * 更新函数，每帧调用
   */
  update(): void {
    // 检查游戏结束条件
    this.checkGameOver();
  }
}
