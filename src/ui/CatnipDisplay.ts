import Phaser from 'phaser';
import { ResourceSystem } from '../classes/systems/ResourceSystem';

/**
 * 猫薄荷显示UI组件
 * 用于在游戏界面上显示当前的猫薄荷数量
 */
export class CatnipDisplay {
  // 场景引用
  private scene: Phaser.Scene;
  
  // 资源系统引用
  private resourceSystem: ResourceSystem;
  
  // UI元素
  private container!: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Rectangle;
  private icon!: Phaser.GameObjects.Sprite;
  private text!: Phaser.GameObjects.Text;
  
  // 显示配置
  private config: {
    x: number;
    y: number;
    width: number;
    height: number;
    iconFrame?: string;
    textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
    backgroundColor?: number;
    borderColor?: number;
  };
  
  /**
   * 构造函数
   */
  constructor(
    scene: Phaser.Scene, 
    resourceSystem: ResourceSystem,
    config: {
      x: number;
      y: number;
      width: number;
      height: number;
      iconFrame?: string;
      textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
      backgroundColor?: number;
      borderColor?: number;
    }
  ) {
    this.scene = scene;
    this.resourceSystem = resourceSystem;
    this.config = {
      ...config,
      iconFrame: config.iconFrame || 'catnip_icon',
      textStyle: config.textStyle || { 
        fontSize: '20px', 
        color: '#fff',
        fontStyle: 'bold'
      },
      backgroundColor: config.backgroundColor || 0x4a6d8c,
      borderColor: config.borderColor || 0x8cb0d9
    };
    
    this.createDisplay();
    this.setupListeners();
    this.updateDisplay();
  }
  
  /**
   * 创建显示UI
   */
  private createDisplay(): void {
    // 创建容器
    this.container = this.scene.add.container(this.config.x, this.config.y);
    
    // 创建背景
    this.background = this.scene.add.rectangle(
      0,
      0,
      this.config.width,
      this.config.height,
      this.config.backgroundColor
    );
    this.background.setStrokeStyle(2, this.config.borderColor);
    this.container.add(this.background);
    
    // 创建图标（如果纹理存在）
    try {
      this.icon = this.scene.add.sprite(-this.config.width/2 + 20, 0, 'ui', this.config.iconFrame);
      this.icon.setScale(0.8);
      this.container.add(this.icon);
    } catch (error) {
      console.warn('无法创建猫薄荷图标，可能是纹理不存在:', error);
      // 创建占位符文本
      const iconText = this.scene.add.text(-this.config.width/2 + 20, 0, '🌿', {
        fontSize: '16px'
      }).setOrigin(0.5);
      this.container.add(iconText);
    }
    
    // 创建文本
    this.text = this.scene.add.text(
      10, 
      0, 
      `${this.resourceSystem.getCatnip()}`,
      this.config.textStyle
    ).setOrigin(0, 0.5);
    this.container.add(this.text);
    
    // 添加交互性和工具提示
    this.background.setInteractive();
    this.background.on('pointerover', this.onPointerOver, this);
    this.background.on('pointerout', this.onPointerOut, this);
  }
  
  /**
   * 设置事件监听
   */
  private setupListeners(): void {
    this.resourceSystem.on('catnipChanged', this.updateDisplay, this);
    this.resourceSystem.on('catnipReset', this.updateDisplay, this);
  }
  
  /**
   * 更新显示
   */
  private updateDisplay(): void {
    const amount = this.resourceSystem.getCatnip();
    this.text.setText(`${amount}`);
    
    // 添加数字变化动画
    this.scene.tweens.add({
      targets: this.text,
      scale: { from: 1.2, to: 1 },
      duration: 200,
      ease: 'Back.easeOut'
    });
  }
  
  /**
   * 鼠标悬停处理
   */
  private onPointerOver(): void {
    this.background.setStrokeStyle(3, 0xffffff);
    
    // 显示工具提示
    const tooltip = this.scene.add.text(
      this.container.x,
      this.container.y + this.config.height/2 + 20,
      '猫薄荷: 用于购买永久增益',
      { fontSize: '16px', color: '#fff', backgroundColor: '#00000088', padding: { x: 8, y: 4 } }
    ).setOrigin(0.5, 0).setDepth(100);
    tooltip.setName('catnip_tooltip');
  }
  
  /**
   * 鼠标离开处理
   */
  private onPointerOut(): void {
    this.background.setStrokeStyle(2, this.config.borderColor);
    
    // 移除工具提示
    const tooltip = this.scene.children.getByName('catnip_tooltip');
    if (tooltip) {
      tooltip.destroy();
    }
  }
  
  /**
   * 显示资源变化效果
   */
  public showChangeEffect(amount: number): void {
    if (amount === 0) return;
    
    // 创建浮动文本显示资源变化
    const sign = amount > 0 ? '+' : '';
    const color = amount > 0 ? '#4CAF50' : '#F44336';
    
    const effectText = this.scene.add.text(
      this.container.x,
      this.container.y - 20,
      `${sign}${amount}`,
      { fontSize: '24px', color: color, fontStyle: 'bold' }
    ).setOrigin(0.5);
    
    // 添加动画
    this.scene.tweens.add({
      targets: effectText,
      y: effectText.y - 50,
      alpha: { from: 1, to: 0 },
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        effectText.destroy();
      }
    });
  }
  
  /**
   * 设置位置
   */
  public setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }
  
  /**
   * 设置可见性
   */
  public setVisible(visible: boolean): this {
    this.container.setVisible(visible);
    return this;
  }
  
  /**
   * 销毁组件
   */
  public destroy(): void {
    // 移除事件监听
    this.resourceSystem.off('catnipChanged', this.updateDisplay, this);
    this.resourceSystem.off('catnipReset', this.updateDisplay, this);
    
    // 销毁UI元素
    this.container.destroy();
  }
}
