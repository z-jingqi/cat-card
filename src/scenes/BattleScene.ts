import Phaser from "phaser";
import { Boss } from "../classes/boss/Boss";
import { CardOrderManager } from "../classes/systems/CardOrderManager";
import { CardPlaySystem } from "../classes/systems/CardPlaySystem";
import { DeckSystem } from "../classes/systems/DeckSystem";
import { ResourceSystem } from "../classes/systems/ResourceSystem";
import { AudioManager } from "../classes/systems/AudioManager";
import { AnimationManager } from "../classes/systems/AnimationManager";
import { BOSSES } from "../constants/bosses";
import { CAT_CARDS, SUPPORT_CARDS } from "../constants/cards";
import { BattleUI } from "./battle/BattleUI";
import { CardRenderer } from "./battle/CardRenderer";
import { GameStateManager } from "./battle/GameStateManager";
import { BattleEventHandler } from "./battle/BattleEventHandler";

/**
 * 战斗场景 - 重构版本
 * 作为主要协调器，委托具体功能给专门的组件
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
  
  // 新的组件管理器
  private battleUI!: BattleUI;
  private cardRenderer!: CardRenderer;
  private gameStateManager!: GameStateManager;
  private eventHandler!: BattleEventHandler;

  // 当前关卡
  private currentLevel: number = 1;

  constructor() {
    super({ key: "BattleScene" });
  }

  /**
   * 初始化场景数据
   */
  init(data: any): void {
    if (data) {
      if (data.level) {
        this.currentLevel = data.level;
      }
      
      if (data.resourceSystem) {
        this.resourceSystem = data.resourceSystem;
      }
      
      if (data.audioManager) {
        this.audioManager = data.audioManager;
      }
      
      if (data.purchasedUpgrades) {
        console.log(`接收到 ${data.purchasedUpgrades.length} 个已购买的永久增益`);
      }
    }
  }

  create(): void {
    // 创建背景
    this.createBackground();
    
    // 初始化核心系统
    this.initializeSystems();
    
    // 初始化组件管理器
    this.initializeComponents();
    
    // 设置事件处理
    this.initializeEventHandler();
    
    // 开始游戏
    this.startGame();
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
   * 初始化核心系统
   */
  private initializeSystems(): void {
    // 初始化音频管理器
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
    
    // 初始化出牌系统
    this.cardPlaySystem = new CardPlaySystem(
      this,
      2, // 每回合可出牌数
      15, // 总出牌次数限制
      this.cardOrderManager,
      this.boss
    );
    
    // 初始化资源系统
    if (!this.resourceSystem) {
      this.resourceSystem = new ResourceSystem(this, 10);
    }
  }

  /**
   * 初始化组件管理器
   */
  private initializeComponents(): void {
    // 初始化游戏状态管理器
    this.gameStateManager = new GameStateManager(
      this,
      this.boss,
      this.cardPlaySystem,
      this.currentLevel
    );
    
    // 初始化UI管理器
    this.battleUI = new BattleUI(
      this,
      this.boss,
      this.cardPlaySystem,
      this.deckSystem,
      this.resourceSystem,
      this.audioManager
    );
    
    // 创建UI
    this.battleUI.create();
    
    // 初始化卡片渲染器
    this.cardRenderer = new CardRenderer(this, this.cardOrderManager);
  }

  /**
   * 初始化事件处理器
   */
  private initializeEventHandler(): void {
    this.eventHandler = new BattleEventHandler(
      this,
      this.gameStateManager,
      this.battleUI,
      this.cardRenderer,
      this.cardPlaySystem,
      this.deckSystem,
      this.resourceSystem,
      this.audioManager,
      this.animationManager,
      this.cardOrderManager,
      this.boss
    );
  }

  /**
   * 开始游戏
   */
  private startGame(): void {
    // 抽取初始手牌
    const initialHand = this.deckSystem.drawInitialHand();
    
    // 设置卡片到排序管理器
    this.cardOrderManager.setCatCards(initialHand.catCards);
    this.cardOrderManager.setSupportCards(initialHand.supportCards);
    
    // 开始游戏状态管理
    this.gameStateManager.startGame();
  }

  /**
   * 创建BOSS
   */
  private createBoss(): void {
    const bossConfig = BOSSES[this.currentLevel - 1] || BOSSES[0];
    this.boss = new Boss(this, 750, 200, bossConfig);
  }

  /**
   * 更新函数，每帧调用
   */
  update(): void {
    // 检查游戏结束条件
    this.gameStateManager.checkGameOver();
  }
}