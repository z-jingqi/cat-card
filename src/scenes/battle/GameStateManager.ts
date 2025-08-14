import Phaser from 'phaser';
import { Boss } from '../../classes/boss/Boss';
import { CardPlaySystem } from '../../classes/systems/CardPlaySystem';
import { CatCard } from '../../classes/cards/CatCard';
import { SupportCard } from '../../classes/cards/SupportCard';

/**
 * 游戏状态管理器
 * 负责游戏流程、回合管理和游戏结束条件检查
 */
export class GameStateManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private boss: Boss;
  private cardPlaySystem: CardPlaySystem;
  
  private playerHp: number = 100;
  private maxPlayerHp: number = 100;
  private currentLevel: number = 1;
  private gameEnded: boolean = false;
  
  // 重抽相关
  private selectedForRedraw: {
    cats: CatCard[];
    supports: SupportCard[];
  } = {
    cats: [],
    supports: [],
  };

  constructor(
    scene: Phaser.Scene, 
    boss: Boss, 
    cardPlaySystem: CardPlaySystem,
    level: number = 1
  ) {
    super();
    this.scene = scene;
    this.boss = boss;
    this.cardPlaySystem = cardPlaySystem;
    this.currentLevel = level;
  }

  /**
   * 开始游戏
   */
  startGame(): void {
    console.log("游戏开始!");
    this.gameEnded = false;
    
    // 开始重抽阶段
    this.enterRedrawPhase();
    
    // 延迟后自动开始第一回合（如果玩家没有重抽）
    this.scene.time.delayedCall(2000, () => {
      if (this.isRedrawMode()) {
        this.exitRedrawPhase();
        this.cardPlaySystem.startNewTurn();
      }
    });
  }

  /**
   * 进入重抽阶段
   */
  enterRedrawPhase(): void {
    this.selectedForRedraw = { cats: [], supports: [] };
    this.emit('redrawPhaseStarted');
  }

  /**
   * 退出重抽阶段
   */
  exitRedrawPhase(): void {
    this.selectedForRedraw = { cats: [], supports: [] };
    this.emit('redrawPhaseEnded');
  }

  /**
   * 检查是否处于重抽模式
   */
  isRedrawMode(): boolean {
    return (
      this.cardPlaySystem.getCurrentTurn() === 0 ||
      (this.cardPlaySystem.getCurrentTurn() > 0 &&
        this.cardPlaySystem.getRemainingCardsThisTurn() ===
          this.cardPlaySystem.getCardsPerTurn())
    );
  }

  /**
   * 选择/取消选择重抽卡片
   */
  toggleCardForRedraw(card: CatCard | SupportCard): void {
    if (card instanceof CatCard) {
      const index = this.selectedForRedraw.cats.indexOf(card);
      if (index === -1) {
        this.selectedForRedraw.cats.push(card);
        card.select();
      } else {
        this.selectedForRedraw.cats.splice(index, 1);
        card.deselect();
      }
    } else {
      const index = this.selectedForRedraw.supports.indexOf(card);
      if (index === -1) {
        this.selectedForRedraw.supports.push(card);
        card.select();
      } else {
        this.selectedForRedraw.supports.splice(index, 1);
        card.deselect();
      }
    }

    console.log(
      `已选择重抽: ${this.selectedForRedraw.cats.length}张猫咪卡, ${this.selectedForRedraw.supports.length}张辅助卡`
    );

    this.emit('redrawSelectionChanged', this.selectedForRedraw);
  }

  /**
   * 获取选中的重抽卡片
   */
  getSelectedForRedraw(): { cats: CatCard[]; supports: SupportCard[] } {
    return this.selectedForRedraw;
  }

  /**
   * 清空重抽选择
   */
  clearRedrawSelection(): void {
    this.selectedForRedraw.cats.forEach(card => card.deselect());
    this.selectedForRedraw.supports.forEach(card => card.deselect());
    this.selectedForRedraw = { cats: [], supports: [] };
  }

  /**
   * 检查游戏结束条件
   */
  checkGameOver(): 'victory' | 'defeat' | 'continue' {
    if (this.gameEnded) {
      return 'continue';
    }

    // 检查胜利条件
    if (this.boss.hp <= 0) {
      this.gameEnded = true;
      this.emit('gameVictory', this.boss);
      return 'victory';
    }

    // 检查失败条件（出牌次数用完）
    if (this.cardPlaySystem.getRemainingTotalPlays() <= 0) {
      this.gameEnded = true;
      this.emit('gameDefeat');
      return 'defeat';
    }

    return 'continue';
  }

  /**
   * 处理玩家受伤
   */
  damagePlayer(damage: number): void {
    this.playerHp = Math.max(0, this.playerHp - damage);
    this.emit('playerDamaged', {
      damage,
      currentHp: this.playerHp,
      maxHp: this.maxPlayerHp
    });

    if (this.playerHp <= 0) {
      this.gameEnded = true;
      this.emit('gameDefeat');
    }
  }

  /**
   * 处理玩家治疗
   */
  healPlayer(amount: number): void {
    this.playerHp = Math.min(this.maxPlayerHp, this.playerHp + amount);
    this.emit('playerHealed', {
      healing: amount,
      currentHp: this.playerHp,
      maxHp: this.maxPlayerHp
    });
  }

  /**
   * 设置玩家最大血量
   */
  setMaxPlayerHp(maxHp: number): void {
    this.maxPlayerHp = maxHp;
    this.playerHp = Math.min(this.playerHp, maxHp);
    this.emit('playerStatsChanged', {
      currentHp: this.playerHp,
      maxHp: this.maxPlayerHp
    });
  }

  /**
   * 处理回合开始
   */
  onTurnStart(turn: number): void {
    console.log(`回合 ${turn} 开始`);
    this.emit('turnStarted', turn);
  }

  /**
   * 处理回合结束
   */
  onTurnEnd(turn: number): void {
    console.log(`回合 ${turn} 结束`);
    this.emit('turnEnded', turn);
  }

  /**
   * 处理卡片使用
   */
  onCardsPlayed(cards: (CatCard | SupportCard)[]): void {
    console.log(`使用了 ${cards.length} 张卡片`);
    this.emit('cardsPlayed', cards);
  }

  /**
   * 处理BOSS被击败
   */
  onBossDefeated(boss: Boss): void {
    console.log(`BOSS ${boss.name} 被击败!`);
    this.gameEnded = true;
    this.emit('bossDefeated', boss);
  }

  /**
   * 重置游戏状态
   */
  reset(): void {
    this.playerHp = this.maxPlayerHp;
    this.gameEnded = false;
    this.selectedForRedraw = { cats: [], supports: [] };
  }

  /**
   * 获取当前关卡
   */
  getCurrentLevel(): number {
    return this.currentLevel;
  }

  /**
   * 设置当前关卡
   */
  setCurrentLevel(level: number): void {
    this.currentLevel = level;
  }

  /**
   * 获取玩家血量
   */
  getPlayerHp(): number {
    return this.playerHp;
  }

  /**
   * 获取玩家最大血量
   */
  getMaxPlayerHp(): number {
    return this.maxPlayerHp;
  }

  /**
   * 检查游戏是否已结束
   */
  isGameEnded(): boolean {
    return this.gameEnded;
  }
}