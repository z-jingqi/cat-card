import Phaser from 'phaser';
import { Button } from './Button';
import { AudioManager } from '../classes/systems/AudioManager';

/**
 * 对话框组件
 * 提供一个可自定义的对话框，用于显示消息、确认和选择
 */
export class Dialog extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Rectangle;
  private panel!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private contentText!: Phaser.GameObjects.Text;
  private buttons: Button[] = [];
  private audioManager?: AudioManager;
  
  // 对话框状态
  private isOpen: boolean = false;
  
  /**
   * 构造函数
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    content: string,
    options: {
      backgroundColor?: number,
      panelColor?: number,
      titleColor?: string,
      contentColor?: string,
      closeOnBackgroundClick?: boolean,
      audioManager?: AudioManager
    } = {}
  ) {
    super(scene, x, y);
    
    // 保存音频管理器
    this.audioManager = options.audioManager;
    
    // 创建背景（半透明遮罩）
    this.background = scene.add.rectangle(
      0, 
      0, 
      scene.cameras.main.width * 2, 
      scene.cameras.main.height * 2, 
      0x000000, 
      0.6
    );
    
    // 创建面板
    this.panel = scene.add.rectangle(
      0,
      0,
      width,
      height,
      options.panelColor || 0x2A3B4C,
      1
    ).setStrokeStyle(2, 0xFFFFFF);
    
    // 创建标题
    this.titleText = scene.add.text(
      0,
      -height / 2 + 30,
      title,
      {
        fontSize: '28px',
        color: options.titleColor || '#FFFFFF',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // 创建内容
    this.contentText = scene.add.text(
      0,
      0,
      content,
      {
        fontSize: '20px',
        color: options.contentColor || '#FFFFFF',
        align: 'center',
        wordWrap: { width: width - 50 }
      }
    ).setOrigin(0.5);
    
    // 添加到容器
    this.add([this.background, this.panel, this.titleText, this.contentText]);
    
    // 添加到场景
    scene.add.existing(this);
    
    // 设置可交互
    if (options.closeOnBackgroundClick) {
      this.background.setInteractive();
      this.background.on('pointerdown', () => {
        this.close();
      });
    }
    
    // 默认隐藏
    this.setVisible(false);
    this.isOpen = false;
  }
  
  /**
   * 添加按钮
   */
  public addButton(
    text: string,
    callback: () => void,
    options: {
      width?: number,
      height?: number,
      backgroundColor?: number,
      textColor?: string,
      fontSize?: string
    } = {}
  ): this {
    const buttonWidth = options.width || 120;
    const buttonHeight = options.height || 40;
    const buttonCount = this.buttons.length;
    const totalWidth = buttonCount * buttonWidth + (buttonCount - 1) * 20;
    const startX = -totalWidth / 2;
    
    const button = new Button(
      this.scene,
      startX + buttonCount * (buttonWidth + 20),
      this.panel.height / 2 - 40,
      buttonWidth,
      buttonHeight,
      text,
      {
        backgroundColor: options.backgroundColor,
        color: options.textColor || '#FFFFFF',
        fontSize: options.fontSize || '18px'
      },
      () => {
        if (this.audioManager) {
          this.audioManager.playSfx('button_click');
        }
        callback();
      },
      this.audioManager
    );
    
    this.add(button);
    this.buttons.push(button);
    
    // 重新排列按钮
    this.rearrangeButtons();
    
    return this;
  }
  
  /**
   * 重新排列按钮
   */
  private rearrangeButtons(): void {
    const buttonCount = this.buttons.length;
    if (buttonCount === 0) return;
    
    const buttonWidth = 120;
    const spacing = 20;
    const totalWidth = buttonCount * buttonWidth + (buttonCount - 1) * spacing;
    const startX = -totalWidth / 2;
    
    this.buttons.forEach((button, index) => {
      button.x = startX + index * (buttonWidth + spacing) + buttonWidth / 2;
    });
  }
  
  /**
   * 打开对话框
   */
  public open(): this {
    this.setVisible(true);
    this.isOpen = true;
    
    // 添加动画效果
    this.scene.tweens.add({
      targets: this.panel,
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 200,
      ease: 'Back.easeOut'
    });
    
    // 添加背景动画
    this.scene.tweens.add({
      targets: this.background,
      alpha: { from: 0, to: 0.6 },
      duration: 200
    });
    
    return this;
  }
  
  /**
   * 关闭对话框
   */
  public close(): this {
    // 添加动画效果
    this.scene.tweens.add({
      targets: this.panel,
      scaleX: { from: 1, to: 0.8 },
      scaleY: { from: 1, to: 0.8 },
      alpha: { from: 1, to: 0 },
      duration: 200,
      ease: 'Back.easeIn'
    });
    
    // 添加背景动画
    this.scene.tweens.add({
      targets: this.background,
      alpha: { from: 0.6, to: 0 },
      duration: 200,
      onComplete: () => {
        this.setVisible(false);
        this.isOpen = false;
      }
    });
    
    return this;
  }
  
  /**
   * 设置标题
   */
  public setTitle(title: string): this {
    this.titleText.setText(title);
    return this;
  }
  
  /**
   * 设置内容
   */
  public setContent(content: string): this {
    this.contentText.setText(content);
    return this;
  }
  
  /**
   * 检查对话框是否打开
   */
  public isDialogOpen(): boolean {
    return this.isOpen;
  }
  
  /**
   * 创建确认对话框
   */
  public static createConfirmDialog(
    scene: Phaser.Scene,
    title: string,
    content: string,
    onConfirm: () => void,
    onCancel?: () => void,
    options: {
      width?: number,
      height?: number,
      confirmText?: string,
      cancelText?: string,
      audioManager?: AudioManager
    } = {}
  ): Dialog {
    const width = options.width || 400;
    const height = options.height || 250;
    
    const dialog = new Dialog(
      scene,
      scene.cameras.main.width / 2,
      scene.cameras.main.height / 2,
      width,
      height,
      title,
      content,
      { audioManager: options.audioManager }
    );
    
    // 添加确认按钮
    dialog.addButton(
      options.confirmText || '确认',
      () => {
        dialog.close();
        onConfirm();
      },
      { backgroundColor: 0x4CAF50 }
    );
    
    // 添加取消按钮（如果提供了回调）
    if (onCancel) {
      dialog.addButton(
        options.cancelText || '取消',
        () => {
          dialog.close();
          onCancel();
        },
        { backgroundColor: 0xF44336 }
      );
    }
    
    return dialog;
  }
  
  /**
   * 创建警告对话框
   */
  public static createAlertDialog(
    scene: Phaser.Scene,
    title: string,
    content: string,
    onClose?: () => void,
    options: {
      width?: number,
      height?: number,
      closeText?: string,
      audioManager?: AudioManager
    } = {}
  ): Dialog {
    const width = options.width || 400;
    const height = options.height || 250;
    
    const dialog = new Dialog(
      scene,
      scene.cameras.main.width / 2,
      scene.cameras.main.height / 2,
      width,
      height,
      title,
      content,
      { audioManager: options.audioManager }
    );
    
    // 添加关闭按钮
    dialog.addButton(
      options.closeText || '关闭',
      () => {
        dialog.close();
        if (onClose) onClose();
      }
    );
    
    return dialog;
  }
}
