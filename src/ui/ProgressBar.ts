import Phaser from 'phaser';

/**
 * 进度条组件
 * 提供一个可自定义的进度条，用于显示血量、能量等
 */
export class ProgressBar extends Phaser.GameObjects.Container {
  private background!: Phaser.GameObjects.Rectangle;
  private bar!: Phaser.GameObjects.Rectangle;
  private valueText?: Phaser.GameObjects.Text;
  
  private width: number;
  private height: number;
  private maxValue: number;
  private currentValue: number;
  private showValueText: boolean;
  private valueFormat: (current: number, max: number) => string;
  
  /**
   * 构造函数
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    maxValue: number,
    currentValue: number,
    options: {
      backgroundColor?: number,
      barColor?: number,
      borderColor?: number,
      borderThickness?: number,
      showValueText?: boolean,
      valueTextColor?: string,
      valueTextSize?: string,
      valueFormat?: (current: number, max: number) => string
    } = {}
  ) {
    super(scene, x, y);
    
    this.width = width;
    this.height = height;
    this.maxValue = maxValue;
    this.currentValue = currentValue;
    this.showValueText = options.showValueText !== undefined ? options.showValueText : true;
    this.valueFormat = options.valueFormat || ((current, max) => `${current}/${max}`);
    
    // 创建背景
    this.background = scene.add.rectangle(
      0,
      0,
      width,
      height,
      options.backgroundColor || 0x333333
    );
    
    // 添加边框（如果指定）
    if (options.borderColor !== undefined) {
      this.background.setStrokeStyle(
        options.borderThickness || 2, 
        options.borderColor
      );
    }
    
    // 创建进度条
    this.bar = scene.add.rectangle(
      -width / 2 + (width * (currentValue / maxValue)) / 2,
      0,
      width * (currentValue / maxValue),
      height,
      options.barColor || 0x4CAF50
    );
    this.bar.setOrigin(0, 0.5);
    this.bar.x = -width / 2;
    
    // 创建文本（如果需要）
    if (this.showValueText) {
      this.valueText = scene.add.text(
        0,
        0,
        this.valueFormat(currentValue, maxValue),
        {
          fontSize: options.valueTextSize || '16px',
          color: options.valueTextColor || '#FFFFFF',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5);
    }
    
    // 添加到容器
    this.add([this.background, this.bar]);
    if (this.valueText) this.add(this.valueText);
    
    // 添加到场景
    scene.add.existing(this);
  }
  
  /**
   * 设置当前值
   */
  public setValue(value: number, animate: boolean = true): this {
    // 确保值在有效范围内
    const newValue = Phaser.Math.Clamp(value, 0, this.maxValue);
    const oldValue = this.currentValue;
    this.currentValue = newValue;
    
    // 计算新宽度
    const newWidth = this.width * (newValue / this.maxValue);
    
    // 更新文本
    if (this.valueText) {
      this.valueText.setText(this.valueFormat(newValue, this.maxValue));
    }
    
    // 使用动画或立即更新
    if (animate) {
      this.scene.tweens.add({
        targets: this.bar,
        width: newWidth,
        x: -this.width / 2,
        duration: 300,
        ease: 'Power2'
      });
      
      // 如果是减少，添加闪烁效果
      if (newValue < oldValue) {
        this.scene.tweens.add({
          targets: this.bar,
          alpha: { from: 1, to: 0.6 },
          yoyo: true,
          repeat: 1,
          duration: 100
        });
      }
    } else {
      this.bar.width = newWidth;
    }
    
    return this;
  }
  
  /**
   * 获取当前值
   */
  public getValue(): number {
    return this.currentValue;
  }
  
  /**
   * 设置最大值
   */
  public setMaxValue(maxValue: number): this {
    this.maxValue = maxValue;
    
    // 更新当前值（确保不超过新的最大值）
    this.setValue(this.currentValue, false);
    
    return this;
  }
  
  /**
   * 获取最大值
   */
  public getMaxValue(): number {
    return this.maxValue;
  }
  
  /**
   * 设置进度条颜色
   */
  public setBarColor(color: number): this {
    this.bar.setFillStyle(color);
    return this;
  }
  
  /**
   * 根据百分比设置颜色
   * 例如：血量低于30%变红
   */
  public setBarColorByPercentage(
    lowColor: number = 0xF44336,
    midColor: number = 0xFFC107,
    highColor: number = 0x4CAF50,
    lowThreshold: number = 0.3,
    midThreshold: number = 0.6
  ): this {
    const percentage = this.currentValue / this.maxValue;
    
    if (percentage <= lowThreshold) {
      this.bar.setFillStyle(lowColor);
    } else if (percentage <= midThreshold) {
      this.bar.setFillStyle(midColor);
    } else {
      this.bar.setFillStyle(highColor);
    }
    
    return this;
  }
}
