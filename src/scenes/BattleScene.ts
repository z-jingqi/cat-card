import Phaser from 'phaser';
import { AreaManager } from './battle/AreaManager';

/**
 * 战斗场景
 * 核心的卡牌战斗场景，支持炉石传说式的跨区域交互
 */
export default class BattleScene extends Phaser.Scene {
  private areaManager!: AreaManager;

  constructor() {
    super({ key: 'BattleScene' });
  }

  create(): void {
    console.log('BattleScene: 战斗场景创建');
    
    // 设置全局图片渲染质量
    this.setupHighQualityRendering();

    // 初始化区域管理器
    this.areaManager = new AreaManager(this);
    this.setupAreas();

    // TODO: 初始化拖拽系统
    // TODO: 初始化游戏对象
    // TODO: 初始化UI
    // TODO: 初始化事件系统

    // 临时：绘制区域边界用于调试
    this.drawAreaBounds();
    
    // 临时：渲染一张测试卡片
    this.renderTestCard();
  }

  /**
   * 设置全局高质量渲染，解决图片缩放模糊问题
   */
  private setupHighQualityRendering(): void {
    // 为已加载的纹理设置高质量模式
    this.textures.getTextureKeys().forEach(key => {
        this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    });
    // 为之后加载的纹理也设置高质量模式
    this.textures.on('addtexture', (_key: string, texture: Phaser.Textures.Texture) => {
        texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    });
  }

  /**
   * 设置游戏区域到区域管理器
   */
  private setupAreas(): void {
    const { width, height } = this.cameras.main;
    const leftWidth = width * 0.75;
    const rightWidth = width * 0.25;

    // 定义所有区域
    this.areaManager.defineArea('boss', new Phaser.Geom.Rectangle(0, 0, leftWidth, height * 0.25));
    this.areaManager.defineArea('battlefield', new Phaser.Geom.Rectangle(0, height * 0.25, leftWidth, height * 0.45));
    this.areaManager.defineArea('hand', new Phaser.Geom.Rectangle(0, height * 0.7, leftWidth, height * 0.3));
    this.areaManager.defineArea('status', new Phaser.Geom.Rectangle(leftWidth, 0, rightWidth, height));
  }

  /**
   * 绘制区域边界 (调试用)
   */
  private drawAreaBounds(): void {
    const graphics = this.add.graphics();
    
    const areaColors = {
      boss: { color: 0x00ff00, label: 'BOSS区域' },
      battlefield: { color: 0xff6600, label: '战场区域 (主要)' },
      hand: { color: 0xffff00, label: '手牌区域' },
      status: { color: 0x0080ff, label: '状态区域' }
    };

    for (const areaName of this.areaManager.getAreaNames()) {
      const bounds = this.areaManager.getAreaBounds(areaName);
      const config = areaColors[areaName as keyof typeof areaColors];
      
      if (bounds && config) {
        graphics.lineStyle(2, config.color, 0.5);
        graphics.strokeRectShape(bounds);
        
        this.add.text(bounds.x + 10, bounds.y + 10, config.label, {
          fontSize: '16px',
          color: `#${config.color.toString(16).padStart(6, '0')}`,
          resolution: 2 // 提高文字渲染质量
        });
      }
    }
  }

  /**
   * 检查点是否在指定区域内
   */
  public isPointInArea(x: number, y: number, areaName: string): boolean {
    return this.areaManager.isPointInArea(x, y, areaName);
  }

  /**
   * 获取点所在的区域类型
   */
  public getAreaType(x: number, y: number): string {
    return this.areaManager.getAreaAtPoint(x, y) || 'none';
  }

  /**
   * 获取区域管理器 (供其他组件使用)
   */
  public getAreaManager(): AreaManager {
    return this.areaManager;
  }

  /**
   * 渲染测试卡片 (临时方法)
   */
  private renderTestCard(): void {
    const { width } = this.cameras.main;
    const scaleFactor = width / 1920;
    // 增大基础卡牌宽度
    const cardWidth = 220 * scaleFactor;
    const cardHeight = cardWidth * 1.4;

    const handBounds = this.areaManager.getAreaBounds('hand');
    if (!handBounds) return;
    
    const cardX = handBounds.x + handBounds.width / 2;
    const cardY = handBounds.y + handBounds.height / 2;

    const cardContainer = this.add.container(cardX, cardY);

    const cardBackground = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xffffff, 1)
        .setStrokeStyle(2, 0x333333);
    cardContainer.add(cardBackground);

    const attackRadius = 20 * scaleFactor;
    const attackBg = this.add.circle(-cardWidth / 2 + 25 * scaleFactor, -cardHeight / 2 + 25 * scaleFactor, attackRadius, 0xff4444);
    const attackText = this.add.text(attackBg.x, attackBg.y, '5', {
      fontSize: `${20 * scaleFactor}px`,
      color: '#ffffff',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);
    cardContainer.add([attackBg, attackText]);

    if (this.textures.exists('cat_ragdoll')) {
      const catImage = this.add.image(0, -35 * scaleFactor, 'cat_ragdoll');
      // 再次增大图片显示区域，达到视觉极限
      this.fitImageToArea(catImage, 215 * scaleFactor, 190 * scaleFactor);
      cardContainer.add(catImage);
    }

    const abilityText = this.add.text(0, cardHeight / 2 - 35 * scaleFactor, '温和攻击\n造成5点伤害', {
      fontSize: `${14 * scaleFactor}px`,
      color: '#333333',
      align: 'center',
      wordWrap: { width: cardWidth - 20 * scaleFactor },
      resolution: 2
    }).setOrigin(0.5);
    cardContainer.add(abilityText);
    
    const nameText = this.add.text(0, 80 * scaleFactor, '布偶猫', {
      fontSize: `${18 * scaleFactor}px`,
      color: '#333333',
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);
    cardContainer.add(nameText);
  }

  private fitImageToArea(image: Phaser.GameObjects.Image, maxWidth: number, maxHeight: number): void {
    const originalWidth = image.texture.source[0].width;
    const originalHeight = image.texture.source[0].height;
    
    const scaleX = maxWidth / originalWidth;
    const scaleY = maxHeight / originalHeight;
    
    const scale = Math.min(scaleX, scaleY);
    image.setScale(scale);
  }
}
