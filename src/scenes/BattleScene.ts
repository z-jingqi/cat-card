import Phaser from "phaser";

export default class BattleScene extends Phaser.Scene {
  private bossContainer!: Phaser.GameObjects.Container;
  private playedCardsContainer!: Phaser.GameObjects.Container;
  private handContainer!: Phaser.GameObjects.Container;
  private buttonContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "BattleScene" });
  }

  create(): void {
    this.createLayout();
  }

  private createLayout(): void {
    const { width, height } = this.cameras.main;
    const leftWidth = width / 2;

    // Create main containers for the left side
    this.bossContainer = this.add.container(0, 0);
    this.playedCardsContainer = this.add.container(0, height * 0.4);
    const playerActionContainer = this.add.container(0, height * 0.6);
    this.handContainer = this.add.container(0, 0); // Relative to playerActionContainer
    this.buttonContainer = this.add.container(0, (height * 0.4) * 0.6); // Relative to playerActionContainer

    playerActionContainer.add([this.handContainer, this.buttonContainer]);

    // --- Visualization and Labels (for debugging) ---
    this.addDebugGraphics(this.bossContainer, leftWidth, height * 0.4, 0x00ff00, "Boss Area");
    this.addDebugGraphics(this.playedCardsContainer, leftWidth, height * 0.2, 0xffa500, "Played Cards Area");
    this.addDebugGraphics(playerActionContainer, leftWidth, height * 0.4, 0xffff00, "Player Action Area");

    // Sub-containers for cards
    const catCardsContainer = this.add.container(0, 0);
    const supportCardsContainer = this.add.container(leftWidth / 2, 0);
    this.handContainer.add([catCardsContainer, supportCardsContainer]);
    
    this.addDebugGraphics(catCardsContainer, leftWidth / 2, (height * 0.4) * 0.6, 0xff00ff, "Cat Cards");
    this.addDebugGraphics(supportCardsContainer, leftWidth / 2, (height * 0.4) * 0.6, 0x00ffff, "Support Cards");
    this.addDebugGraphics(this.buttonContainer, leftWidth, (height * 0.4) * 0.4, 0xf0f0f0, "Button Area");

  }

  private addDebugGraphics(container: Phaser.GameObjects.Container, width: number, height: number, color: number, label: string): void {
    const debugRect = this.add.rectangle(0, 0, width, height, color, 0.2).setOrigin(0);
    const debugText = this.add.text(10, 10, label, { fontSize: '16px', color: '#ffffff' });
    container.add([debugRect, debugText]);
  }
}
