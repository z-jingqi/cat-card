import Card from '../classes/Card';
import Boss from '../classes/Boss';

export default class BattleScene extends Phaser.Scene {
    private cardsRemaining: number = 8;
    private playerHp: number = 100;
    private boss!: Boss;
    private cards: Card[] = [];

    constructor() {
        super({ key: 'BattleScene' });
    }

    create(): void {
        
        this.boss = new Boss(this, 750, 200, 150);
        
        this.cards = [
            new Card(this, 100, 450, '攻击猫', 15, 0x4CAF50),
            new Card(this, 200, 450, '强击猫', 25, 0xFF9800),
            new Card(this, 300, 450, '治疗猫', -10, 0x9C27B0),
            new Card(this, 400, 450, '连击猫', 8, 0x2196F3),
            new Card(this, 500, 450, '暴击猫', 35, 0xF44336)
        ];

        this.setupUI();
        this.setupCardEvents();
    }

    private setupUI(): void {
        this.add.text(50, 50, '玩家血量: 100', { 
            fontSize: '24px', 
            color: '#000' 
        }).setName('playerHpText');

        this.add.text(50, 80, '剩余出牌: 8', { 
            fontSize: '24px', 
            color: '#000' 
        }).setName('cardsRemainingText');

        this.add.text(600, 50, 'BOSS血量: 150', { 
            fontSize: '24px', 
            color: '#000' 
        }).setName('bossHpText');

        this.add.text(50, 520, '点击卡片进行攻击', { 
            fontSize: '18px', 
            color: '#333' 
        });
    }

    private setupCardEvents(): void {
        this.cards.forEach(card => {
            card.on('pointerdown', () => this.useCard(card));
        });
    }

    private useCard(card: Card): void {
        if (this.cardsRemaining <= 0) {
            this.showMessage('没有出牌机会了！');
            return;
        }

        this.cardsRemaining--;

        if (card.name === '治疗猫') {
            this.playerHp = Math.min(100, this.playerHp + Math.abs(card.attack));
            this.showMessage(`治疗了 ${Math.abs(card.attack)} 点血量`);
        } else if (card.name === '连击猫') {
            this.boss.takeDamage(card.attack);
            this.boss.takeDamage(card.attack);
            this.showMessage(`连击造成 ${card.attack * 2} 点伤害`);
        } else {
            this.boss.takeDamage(card.attack);
            this.showMessage(`造成 ${card.attack} 点伤害`);
        }

        this.updateUI();
        this.checkGameOver();
    }

    private updateUI(): void {
        (this.children.getByName('playerHpText') as Phaser.GameObjects.Text).setText(`玩家血量: ${this.playerHp}`);
        (this.children.getByName('cardsRemainingText') as Phaser.GameObjects.Text).setText(`剩余出牌: ${this.cardsRemaining}`);
        (this.children.getByName('bossHpText') as Phaser.GameObjects.Text).setText(`BOSS血量: ${this.boss.hp}`);
    }

    private checkGameOver(): void {
        if (this.boss.hp <= 0) {
            this.showMessage('胜利！击败了BOSS！', '#4CAF50');
        } else if (this.cardsRemaining <= 0) {
            this.showMessage('失败！出牌机会用完了！', '#F44336');
        }
    }

    private showMessage(text: string, color: string = '#FF9800'): void {
        const message = this.add.text(500, 300, text, { 
            fontSize: '32px', 
            color: color,
            backgroundColor: '#000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        this.time.delayedCall(2000, () => message.destroy());
    }
}