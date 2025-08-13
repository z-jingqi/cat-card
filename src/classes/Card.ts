export default class Card extends Phaser.GameObjects.Container {
    public name: string;
    public attack: number;
    private bg: Phaser.GameObjects.Rectangle;
    private nameText: Phaser.GameObjects.Text;
    private attackText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, name: string, attack: number, color: number) {
        super(scene, x, y);
        
        this.scene = scene;
        this.name = name;
        this.attack = attack;
        
        this.bg = scene.add.rectangle(0, 0, 80, 120, color);
        this.nameText = scene.add.text(0, -30, name, { 
            fontSize: '12px', 
            color: '#fff',
            align: 'center'
        }).setOrigin(0.5);
        
        const attackText = attack > 0 ? `攻击: ${attack}` : `治疗: ${Math.abs(attack)}`;
        this.attackText = scene.add.text(0, 10, attackText, { 
            fontSize: '14px', 
            color: '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add([this.bg, this.nameText, this.attackText]);
        
        this.setSize(80, 120);
        this.setInteractive();
        
        this.on('pointerover', () => this.setScale(1.1));
        this.on('pointerout', () => this.setScale(1));
        
        scene.add.existing(this);
    }
}