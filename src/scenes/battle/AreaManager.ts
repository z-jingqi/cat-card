import Phaser from 'phaser';

/**
 * 区域管理器
 * 管理游戏各个逻辑区域，不使用物理容器
 */
export class AreaManager {
  private scene: Phaser.Scene;
  private areas: Map<string, Phaser.Geom.Rectangle> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 定义一个区域
   */
  public defineArea(name: string, bounds: Phaser.Geom.Rectangle): void {
    this.areas.set(name, bounds);
    console.log(`AreaManager: 定义区域 ${name}`, bounds);
  }

  /**
   * 获取区域边界
   */
  public getAreaBounds(name: string): Phaser.Geom.Rectangle | undefined {
    return this.areas.get(name);
  }

  /**
   * 检查点是否在指定区域内
   */
  public isPointInArea(x: number, y: number, areaName: string): boolean {
    const area = this.areas.get(areaName);
    return area ? Phaser.Geom.Rectangle.Contains(area, x, y) : false;
  }

  /**
   * 获取点所在的区域名称
   */
  public getAreaAtPoint(x: number, y: number): string | null {
    for (const [name, bounds] of this.areas) {
      if (Phaser.Geom.Rectangle.Contains(bounds, x, y)) {
        return name;
      }
    }
    return null;
  }

  /**
   * 获取区域内的推荐位置 (用于卡牌摆放)
   */
  public getPositionInArea(areaName: string, index: number = 0): { x: number, y: number } | null {
    const area = this.areas.get(areaName);
    if (!area) return null;

    // TODO: 根据区域类型和索引计算具体位置
    return {
      x: area.x + area.width / 2,
      y: area.y + area.height / 2
    };
  }

  /**
   * 获取所有区域名称
   */
  public getAreaNames(): string[] {
    return Array.from(this.areas.keys());
  }
}
