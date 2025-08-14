import Phaser from 'phaser';
import { Button } from './Button';
import { AudioManager } from '../classes/systems/AudioManager';

/**
 * 设置菜单组件
 * 提供游戏设置界面，包括音量控制和其他选项
 */
export class SettingsMenu extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Rectangle;
  private panel!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private closeButton!: Button;
  private audioManager: AudioManager;
  
  // 音量滑块
  private musicVolumeSlider!: Phaser.GameObjects.Container;
  private sfxVolumeSlider!: Phaser.GameObjects.Container;
  private musicVolumeText!: Phaser.GameObjects.Text;
  private sfxVolumeText!: Phaser.GameObjects.Text;
  
  // 静音按钮
  private muteButton!: Button;
  
  // 菜单状态
  private isOpen: boolean = false;
  
  /**
   * 构造函数
   */
  constructor(
    scene: Phaser.Scene,
    audioManager: AudioManager
  ) {
    super(scene, scene.cameras.main.width / 2, scene.cameras.main.height / 2);
    
    this.audioManager = audioManager;
    
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
      400,
      350,
      0x2A3B4C,
      1
    ).setStrokeStyle(2, 0xFFFFFF);
    
    // 创建标题
    this.titleText = scene.add.text(
      0,
      -140,
      '设置',
      {
        fontSize: '28px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // 创建关闭按钮
    this.closeButton = new Button(
      scene,
      170,
      -140,
      40,
      40,
      'X',
      {
        backgroundColor: 0xF44336,
        fontSize: '20px'
      },
      () => {
        this.close();
      },
      audioManager
    );
    
    // 创建音量控制
    this.createVolumeControls();
    
    // 创建其他设置
    this.createOtherSettings();
    
    // 添加到容器
    this.add([
      this.background, 
      this.panel, 
      this.titleText, 
      this.closeButton,
      this.musicVolumeSlider,
      this.sfxVolumeSlider,
      this.musicVolumeText,
      this.sfxVolumeText,
      this.muteButton
    ]);
    
    // 添加到场景
    scene.add.existing(this);
    
    // 默认隐藏
    this.setVisible(false);
    this.isOpen = false;
  }
  
  /**
   * 创建音量控制
   */
  private createVolumeControls(): void {
    // 音乐音量文本
    this.musicVolumeText = this.scene.add.text(
      -150,
      -80,
      '音乐音量:',
      {
        fontSize: '20px',
        color: '#FFFFFF'
      }
    ).setOrigin(0, 0.5);
    
    // 音乐音量滑块
    this.musicVolumeSlider = this.createSlider(
      0,
      -80,
      200,
      20,
      this.audioManager.getMusicVolume(),
      (value) => {
        this.audioManager.setMusicVolume(value);
      }
    );
    
    // 音效音量文本
    this.sfxVolumeText = this.scene.add.text(
      -150,
      -30,
      '音效音量:',
      {
        fontSize: '20px',
        color: '#FFFFFF'
      }
    ).setOrigin(0, 0.5);
    
    // 音效音量滑块
    this.sfxVolumeSlider = this.createSlider(
      0,
      -30,
      200,
      20,
      this.audioManager.getSfxVolume(),
      (value) => {
        this.audioManager.setSfxVolume(value);
        // 播放音效示例
        if (value > 0) {
          this.audioManager.playSfx('button_click');
        }
      }
    );
    
    // 静音按钮
    this.muteButton = new Button(
      this.scene,
      0,
      20,
      200,
      40,
      this.audioManager.isMutedState() ? '取消静音' : '静音',
      {
        backgroundColor: this.audioManager.isMutedState() ? 0x4CAF50 : 0xF44336
      },
      () => {
        const isMuted = this.audioManager.toggleMute();
        this.muteButton.setText(isMuted ? '取消静音' : '静音');
        this.muteButton.setColors(isMuted ? 0x4CAF50 : 0xF44336);
      },
      this.audioManager
    );
  }
  
  /**
   * 创建其他设置
   */
  private createOtherSettings(): void {
    // 这里可以添加其他设置选项
    // 例如：全屏模式、语言选择等
  }
  
  /**
   * 创建滑块
   */
  private createSlider(
    x: number,
    y: number,
    width: number,
    height: number,
    initialValue: number,
    onChange: (value: number) => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // 创建背景
    const background = this.scene.add.rectangle(
      0,
      0,
      width,
      height,
      0x333333
    ).setStrokeStyle(1, 0xFFFFFF);
    
    // 创建滑块
    const slider = this.scene.add.rectangle(
      -width / 2 + width * initialValue,
      0,
      20,
      height + 10,
      0x4CAF50
    ).setInteractive({ draggable: true });
    
    // 创建填充条
    const fill = this.scene.add.rectangle(
      -width / 2 + width * initialValue / 2,
      0,
      width * initialValue,
      height,
      0x4CAF50
    );
    fill.setOrigin(0, 0.5);
    fill.x = -width / 2;
    
    // 添加拖动事件
    slider.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
      // 限制滑块在背景范围内
      const minX = -width / 2;
      const maxX = width / 2 - slider.width / 2;
      const newX = Phaser.Math.Clamp(dragX, minX, maxX);
      
      slider.x = newX;
      
      // 计算值（0-1）
      const value = (newX - minX) / (maxX - minX);
      
      // 更新填充条
      fill.width = width * value;
      
      // 调用回调
      onChange(value);
    });
    
    // 添加到容器
    container.add([background, fill, slider]);
    
    return container;
  }
  
  /**
   * 打开设置菜单
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
   * 关闭设置菜单
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
   * 检查菜单是否打开
   */
  public isMenuOpen(): boolean {
    return this.isOpen;
  }
  
  /**
   * 切换菜单状态
   */
  public toggle(): this {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
    
    return this;
  }
}
