import Phaser from 'phaser';
import { Boss } from '../../classes/boss/Boss';
import { ResourceSystem } from '../../classes/systems/ResourceSystem';
import { CardPlaySystem } from '../../classes/systems/CardPlaySystem';
import { DeckSystem } from '../../classes/systems/DeckSystem';
import { AudioManager } from '../../classes/systems/AudioManager';
import { CatnipDisplay } from '../../ui/CatnipDisplay';
import { Button } from '../../ui/Button';
import { SettingsMenu } from '../../ui/SettingsMenu';

/**
 * 战斗场景UI管理器
 * 负责创建和管理所有UI元素
 */
export class BattleUI {
  private scene: Phaser.Scene;
  private boss: Boss;
  private cardPlaySystem: CardPlaySystem;
  private deckSystem: DeckSystem;
  private resourceSystem: ResourceSystem;
  private audioManager: AudioManager;

  // UI元素
  private playerHpText!: Phaser.GameObjects.Text;
  private bossHpText!: Phaser.GameObjects.Text;
  private remainingPlaysText!: Phaser.GameObjects.Text;
  private turnText!: Phaser.GameObjects.Text;
  private redrawsText!: Phaser.GameObjects.Text;
  private catnipDisplay!: CatnipDisplay;
  
  // 控制按钮
  private playButton!: Phaser.GameObjects.Text;
  private endTurnButton!: Phaser.GameObjects.Text;
  private redrawButton!: Phaser.GameObjects.Text;
  
  // 设置相关
  private settingsButton!: Button;
  private settingsMenu!: SettingsMenu;

  private playerHp: number = 100;
  private maxPlayerHp: number = 100;

  constructor(
    scene: Phaser.Scene,
    boss: Boss,
    cardPlaySystem: CardPlaySystem,
    deckSystem: DeckSystem,
    resourceSystem: ResourceSystem,
    audioManager: AudioManager
  ) {
    this.scene = scene;
    this.boss = boss;
    this.cardPlaySystem = cardPlaySystem;
    this.deckSystem = deckSystem;
    this.resourceSystem = resourceSystem;
    this.audioManager = audioManager;
  }

  /**
   * 创建所有UI元素
   */
  create(): void {
    this.createStatusTexts();
    this.createCatnipDisplay();
    this.createControlButtons();
    this.createSettingsUI();
    this.createHelpText();
  }

  /**
   * 创建状态文本
   */
  private createStatusTexts(): void {
    this.playerHpText = this.scene.add.text(
      50,
      50,
      `玩家血量: ${this.playerHp}/${this.maxPlayerHp}`,
      {
        fontSize: "24px",
        color: "#000",
      }
    );

    this.bossHpText = this.scene.add.text(
      600,
      50,
      `BOSS血量: ${this.boss.hp}/${this.boss.maxHp}`,
      {
        fontSize: "24px",
        color: "#000",
      }
    );

    this.remainingPlaysText = this.scene.add.text(
      50,
      80,
      `剩余出牌: ${this.cardPlaySystem.getRemainingTotalPlays()}`,
      {
        fontSize: "24px",
        color: "#000",
      }
    );

    this.turnText = this.scene.add.text(
      50,
      110,
      `当前回合: ${this.cardPlaySystem.getCurrentTurn()}`,
      {
        fontSize: "24px",
        color: "#000",
      }
    );

    this.redrawsText = this.scene.add.text(
      50,
      140,
      `剩余重抽: ${this.deckSystem.getRemainingRedraws()}`,
      {
        fontSize: "24px",
        color: "#000",
      }
    );
  }

  /**
   * 创建猫薄荷资源显示
   */
  private createCatnipDisplay(): void {
    this.catnipDisplay = new CatnipDisplay(this.scene, this.resourceSystem, {
      x: this.scene.cameras.main.width - 120,
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
  }

  /**
   * 创建控制按钮
   */
  private createControlButtons(): void {
    this.playButton = this.scene.add
      .text(500, 550, "出牌", {
        fontSize: "24px",
        color: "#fff",
        backgroundColor: "#4CAF50",
        padding: { x: 20, y: 10 },
      })
      .setInteractive();

    this.endTurnButton = this.scene.add
      .text(650, 550, "结束回合", {
        fontSize: "24px",
        color: "#fff",
        backgroundColor: "#2196F3",
        padding: { x: 20, y: 10 },
      })
      .setInteractive();

    this.redrawButton = this.scene.add
      .text(350, 550, "重抽", {
        fontSize: "24px",
        color: "#fff",
        backgroundColor: "#FF9800",
        padding: { x: 20, y: 10 },
      })
      .setInteractive();
  }

  /**
   * 创建设置UI
   */
  private createSettingsUI(): void {
    this.settingsButton = new Button(
      this.scene,
      this.scene.cameras.main.width - 50,
      50,
      40,
      40,
      '⚙️',
      {
        backgroundColor: 0x2196F3,
        fontSize: '20px'
      },
      () => this.openSettings(),
      this.audioManager
    );
    
    this.settingsMenu = new SettingsMenu(this.scene, this.audioManager);
  }

  /**
   * 创建帮助文本
   */
  private createHelpText(): void {
    this.scene.add.text(50, 520, "提示: 左侧猫咪卡片，右侧辅助卡片，点击选择卡片", {
      fontSize: "18px",
      color: "#333",
    });
  }

  /**
   * 更新所有UI元素
   */
  update(): void {
    this.playerHpText.setText(`玩家血量: ${this.playerHp}/${this.maxPlayerHp}`);
    this.bossHpText.setText(`BOSS血量: ${this.boss.hp}/${this.boss.maxHp}`);
    this.remainingPlaysText.setText(`剩余出牌: ${this.cardPlaySystem.getRemainingTotalPlays()}`);
    this.turnText.setText(`当前回合: ${this.cardPlaySystem.getCurrentTurn()}`);
    this.redrawsText.setText(`剩余重抽: ${this.deckSystem.getRemainingRedraws()}`);
  }

  /**
   * 更新按钮状态
   */
  updateButtonStates(isRedrawMode: boolean, isTurnActive: boolean, isTurnComplete: boolean): void {
    // 出牌按钮
    if (isRedrawMode || isTurnComplete) {
      this.playButton.setAlpha(0.5);
      this.playButton.disableInteractive();
    } else {
      this.playButton.setAlpha(1);
      this.playButton.setInteractive();
    }

    // 结束回合按钮
    if (isRedrawMode || !isTurnActive) {
      this.endTurnButton.setAlpha(0.5);
      this.endTurnButton.disableInteractive();
    } else {
      this.endTurnButton.setAlpha(1);
      this.endTurnButton.setInteractive();
    }

    // 重抽按钮
    if (!isRedrawMode || this.deckSystem.getRemainingRedraws() <= 0) {
      this.redrawButton.setAlpha(0.5);
      this.redrawButton.disableInteractive();
    } else {
      this.redrawButton.setAlpha(1);
      this.redrawButton.setInteractive();
    }
  }

  /**
   * 禁用所有交互按钮
   */
  disableAllButtons(): void {
    this.playButton.disableInteractive();
    this.endTurnButton.disableInteractive();
    this.redrawButton.disableInteractive();
  }

  /**
   * 显示消息
   */
  showMessage(text: string, color: string = "#000"): void {
    const message = this.scene.add
      .text(this.scene.cameras.main.width / 2, 300, text, {
        fontSize: "32px",
        color: color,
        backgroundColor: "#ffffff80",
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5);

    this.scene.tweens.add({
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
  showVictoryScreen(onContinue: () => void): void {
    const victoryText = this.scene.add
      .text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
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

    this.scene.tweens.add({
      targets: victoryText,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 2,
    });

    const continueButton = this.scene.add
      .text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2 + 100,
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
        this.audioManager.playSfx('button_click');
        onContinue();
      });

    this.scene.tweens.add({
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
  showDefeatScreen(onRetry: () => void): void {
    const defeatText = this.scene.add
      .text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2,
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

    this.scene.tweens.add({
      targets: defeatText,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 2,
    });

    const retryButton = this.scene.add
      .text(
        this.scene.cameras.main.width / 2,
        this.scene.cameras.main.height / 2 + 100,
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
      .on("pointerdown", onRetry);

    this.scene.tweens.add({
      targets: retryButton,
      alpha: { from: 0, to: 1 },
      y: { from: retryButton.y + 50, to: retryButton.y },
      duration: 1000,
      ease: "Power2",
      delay: 1000,
    });
  }

  /**
   * 打开设置菜单
   */
  private openSettings(): void {
    this.settingsMenu.open();
  }

  /**
   * 获取控制按钮的引用
   */
  getButtons() {
    return {
      playButton: this.playButton,
      endTurnButton: this.endTurnButton,
      redrawButton: this.redrawButton
    };
  }

  /**
   * 获取猫薄荷显示组件
   */
  getCatnipDisplay(): CatnipDisplay {
    return this.catnipDisplay;
  }
}