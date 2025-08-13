export default class Boss extends Phaser.GameObjects.Container {
    public hp: number;
    private maxHp: number;
    private bodyRect: Phaser.GameObjects.Rectangle;
    private face: Phaser.GameObjects.Arc;
    private eyes: Phaser.GameObjects.Arc;
    private eyes2: Phaser.GameObjects.Arc;
    private mouth: Phaser.GameObjects.Arc;
    private hpBar: Phaser.GameObjects.Rectangle;
    private hpBarBg: Phaser.GameObjects.Rectangle;
    private nameText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, hp: number) {
        super(scene, x, y);
        
        this.scene = scene;
        this.maxHp = hp;
        this.hp = hp;
        
        this.bodyRect = scene.add.rectangle(0, 0, 120, 150, 0x8B4513);
        this.face = scene.add.circle(0, -40, 30, 0xFF6347);
        this.eyes = scene.add.circle(-10, -50, 5, 0x000000);
        this.eyes2 = scene.add.circle(10, -50, 5, 0x000000);
        this.mouth = scene.add.arc(0, -30, 15, 0, Math.PI, false, 0x000000);
        
        this.hpBar = scene.add.rectangle(0, 80, 100, 10, 0x4CAF50);
        this.hpBarBg = scene.add.rectangle(0, 80, 100, 10, 0x333333);
        
        this.nameText = scene.add.text(0, 100, 'BOSS', { 
            fontSize: '16px', 
            color: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add([this.hpBarBg, this.hpBar, this.bodyRect, this.face, this.eyes, this.eyes2, this.mouth, this.nameText]);
        
        scene.add.existing(this);
    }

    takeDamage(damage: number): void {
        this.hp = Math.max(0, this.hp - damage);
        this.updateHpBar();
        
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
        
        if (this.hp <= 0) {
            this.bodyRect.setFillStyle(0x666666);
            this.face.setFillStyle(0x999999);
        }
    }

    private updateHpBar(): void {
        const hpPercent = this.hp / this.maxHp;
        this.hpBar.setScale(hpPercent, 1);
        
        if (hpPercent > 0.6) {
            this.hpBar.setFillStyle(0x4CAF50);
        } else if (hpPercent > 0.3) {
            this.hpBar.setFillStyle(0xFF9800);
        } else {
            this.hpBar.setFillStyle(0xF44336);
        }
    }
}