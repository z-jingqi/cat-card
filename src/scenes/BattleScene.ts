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

    // 初始化区域管理器
    this.areaManager = new AreaManager(this);
    this.setupAreas();

    // TODO: 初始化拖拽系统
    // TODO: 初始化游戏对象
    // TODO: 初始化UI
    // TODO: 初始化事件系统

    // 临时：绘制区域边界用于调试
    this.drawAreaBounds();
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

    // 绘制所有区域
    for (const areaName of this.areaManager.getAreaNames()) {
      const bounds = this.areaManager.getAreaBounds(areaName);
      const config = areaColors[areaName as keyof typeof areaColors];
      
      if (bounds && config) {
        graphics.lineStyle(2, config.color, 0.5);
        graphics.strokeRectShape(bounds);
        
        this.add.text(bounds.x + 10, bounds.y + 10, config.label, {
          fontSize: '16px',
          color: `#${config.color.toString(16).padStart(6, '0')}`
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
}
