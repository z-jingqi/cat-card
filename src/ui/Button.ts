import Phaser from 'phaser';
import { AudioManager } from '../classes/systems/AudioManager';

/**
 * 通用按钮组件
 * 提供一个可自定义的按钮，带有悬停和点击效果
 */
export class Button extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Rectangle;
  private text!: Phaser.GameObjects.Text;
  private icon?: Phaser.GameObjects.Image;
  private audioManager?: AudioManager;
  private soundKey: string = 'button_click';
  
  // 按钮状态
  private isEnabled: boolean = true;
  
  // 颜色配置
  private normalColor: number = 0x4CAF50;
  private hoverColor: number = 0x5CBF60;
  private pressColor: number = 0x3C9F40;
  private disabledColor: number = 0x888888;
  
  /**
   * 构造函数
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    style: {
      fontSize?: string,
      color?: string,
      fontStyle?: string,
      backgroundColor?: number,
      hoverColor?: number,
      pressColor?: number,
      disabledColor?: number,
      borderColor?: number,
      borderThickness?: number,
      soundKey?: string,
      iconTexture?: string,
      iconScale?: number
    } = {},
    callback?: () => void,
    audioManager?: AudioManager
  ) {
    super(scene, x, y);
    
    // 保存音频管理器
    this.audioManager = audioManager;
    
    // 设置颜色
    if (style.backgroundColor !== undefined) this.normalColor = style.backgroundColor;
    if (style.hoverColor !== undefined) this.hoverColor = style.hoverColor;
    if (style.pressColor !== undefined) this.pressColor = style.pressColor;
    if (style.disabledColor !== undefined) this.disabledColor = style.disabledColor;
    if (style.soundKey !== undefined) this.soundKey = style.soundKey;
    
    // 创建背景
    this.background = scene.add.rectangle(0, 0, width, height, this.normalColor);
    
    // 添加边框（如果指定）
    if (style.borderColor !== undefined) {
      this.background.setStrokeStyle(
        style.borderThickness || 2, 
        style.borderColor
      );
    }
    
    // 添加到容器
    this.add(this.background);
    
    // 创建图标（如果指定）
    if (style.iconTexture) {
      this.icon = scene.add.image(-width / 2 + 20, 0, style.iconTexture);
      this.icon.setScale(style.iconScale || 0.5);
      this.add(this.icon);
    }
    
    // 创建文本
    this.text = scene.add.text(
      this.icon ? -width / 2 + 40 : 0, 
      0, 
      text, 
      {
        fontSize: style.fontSize || '20px',
        color: style.color || '#ffffff',
        fontStyle: style.fontStyle || ''
      }
    ).setOrigin(this.icon ? 0 : 0.5, 0.5);
    
    this.add(this.text);
    
    // 添加到场景
    scene.add.existing(this);
    
    // 设置交互
    this.setInteractive(
      new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    
    // 添加事件监听
    this.on('pointerover', this.onPointerOver, this);
    this.on('pointerout', this.onPointerOut, this);
    this.on('pointerdown', this.onPointerDown, this);
    this.on('pointerup', this.onPointerUp, this);
    
    // 设置回调
    if (callback) {
      this.on('pointerup', callback);
    }
  }
  
  /**
   * 鼠标悬停事件处理
   */
  private onPointerOver(): void {
    if (!this.isEnabled) return;
    
    this.background.setFillStyle(this.hoverColor);
  }
  
  /**
   * 鼠标离开事件处理
   */
  private onPointerOut(): void {
    if (!this.isEnabled) return;
    
    this.background.setFillStyle(this.normalColor);
  }
  
  /**
   * 鼠标按下事件处理
   */
  private onPointerDown(): void {
    if (!this.isEnabled) return;
    
    this.background.setFillStyle(this.pressColor);
    this.y += 2; // 轻微下移，增加按下感
  }
  
  /**
   * 鼠标释放事件处理
   */
  private onPointerUp(): void {
    if (!this.isEnabled) return;
    
    // 播放音效
    if (this.audioManager) {
      this.audioManager.playSfx(this.soundKey);
    }
    
    this.background.setFillStyle(this.hoverColor);
    this.y -= 2; // 恢复位置
  }
  
  /**
   * 设置按钮文本
   */
  public setText(text: string): this {
    this.text.setText(text);
    return this;
  }
  
  /**
   * 获取按钮文本
   */
  public getText(): string {
    return this.text.text;
  }
  
  /**
   * 设置按钮启用状态
   */
  public setEnabled(enabled: boolean): this {
    this.isEnabled = enabled;
    
    if (enabled) {
      this.background.setFillStyle(this.normalColor);
      this.setInteractive();
    } else {
      this.background.setFillStyle(this.disabledColor);
      this.disableInteractive();
    }
    
    return this;
  }
  
  /**
   * 获取按钮启用状态
   */
  public isButtonEnabled(): boolean {
    return this.isEnabled;
  }
  
  /**
   * 设置按钮颜色
   */
  public setColors(
    normalColor?: number,
    hoverColor?: number,
    pressColor?: number,
    disabledColor?: number
  ): this {
    if (normalColor !== undefined) this.normalColor = normalColor;
    if (hoverColor !== undefined) this.hoverColor = hoverColor;
    if (pressColor !== undefined) this.pressColor = pressColor;
    if (disabledColor !== undefined) this.disabledColor = disabledColor;
    
    // 更新当前颜色
    if (this.isEnabled) {
      this.background.setFillStyle(this.normalColor);
    } else {
      this.background.setFillStyle(this.disabledColor);
    }
    
    return this;
  }
  
  /**
   * 设置按钮声音
   */
  public setSoundKey(key: string): this {
    this.soundKey = key;
    return this;
  }
}
