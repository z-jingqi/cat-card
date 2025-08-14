import Phaser from 'phaser';
import { ResourceSystem } from './ResourceSystem';
import { Upgrade } from '../upgrades/Upgrade';
import { UPGRADES } from '../../constants/upgrades';

/**
 * 商店系统
 * 管理游戏中的商店功能，包括商品展示、购买和刷新
 */
export class ShopSystem {
  // 场景引用
  private scene: Phaser.Scene;
  
  // 资源系统引用
  private resourceSystem: ResourceSystem;
  
  // 事件发射器
  private events: Phaser.Events.EventEmitter;
  
  // 商店商品
  private availableUpgrades: any[] = [];
  
  // 已购买的永久增益
  private purchasedUpgrades: Upgrade[] = [];
  
  // 商店配置
  private config = {
    shopSize: 3, // 商店一次展示的商品数量
    refreshCost: 5, // 刷新商店的猫薄荷消耗
    maxRefreshes: 3, // 每次商店访问的最大刷新次数
  };
  
  // 当前刷新次数
  private refreshCount: number = 0;
  
  /**
   * 构造函数
   */
  constructor(scene: Phaser.Scene, resourceSystem: ResourceSystem) {
    this.scene = scene;
    this.resourceSystem = resourceSystem;
    this.events = new Phaser.Events.EventEmitter();
    
    // 初始化商店商品
    this.refreshShop();
  }
  
  /**
   * 刷新商店商品
   * @returns 是否成功刷新
   */
  public refreshShop(isInitial: boolean = false): boolean {
    // 如果不是初始刷新，需要消耗猫薄荷
    if (!isInitial) {
      if (this.refreshCount >= this.config.maxRefreshes) {
        console.warn('已达到最大刷新次数');
        this.events.emit('refreshFailed', { reason: 'maxRefreshesReached' });
        return false;
      }
      
      if (!this.resourceSystem.spendCatnip(this.config.refreshCost, '刷新商店')) {
        console.warn('猫薄荷不足，无法刷新商店');
        this.events.emit('refreshFailed', { reason: 'insufficientCatnip' });
        return false;
      }
      
      this.refreshCount++;
    }
    
    // 清空当前商品
    this.availableUpgrades = [];
    
    // 获取所有可用的升级
    const allUpgrades = [...UPGRADES];
    
    // 过滤掉已购买的升级
    const availableUpgrades = allUpgrades.filter(upgrade => 
      !this.purchasedUpgrades.some(purchased => purchased.id === upgrade.id)
    );
    
    // 如果可用升级不足，直接全部展示
    if (availableUpgrades.length <= this.config.shopSize) {
      this.availableUpgrades = availableUpgrades;
    } else {
      // 随机选择指定数量的升级
      while (this.availableUpgrades.length < this.config.shopSize && availableUpgrades.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableUpgrades.length);
        this.availableUpgrades.push(availableUpgrades[randomIndex]);
        availableUpgrades.splice(randomIndex, 1);
      }
    }
    
    // 触发刷新事件
    this.events.emit('shopRefreshed', {
      items: this.availableUpgrades,
      refreshesRemaining: this.config.maxRefreshes - this.refreshCount
    });
    
    return true;
  }
  
  /**
   * 购买升级
   * @param upgradeId 要购买的升级ID
   * @returns 是否购买成功
   */
  public purchaseUpgrade(upgradeId: string): boolean {
    // 查找要购买的升级
    const upgradeConfig = this.availableUpgrades.find(u => u.id === upgradeId);
    if (!upgradeConfig) {
      console.warn(`商店中不存在ID为${upgradeId}的升级`);
      return false;
    }
    
    // 检查是否有足够的猫薄荷
    if (!this.resourceSystem.hasSufficientCatnip(upgradeConfig.cost)) {
      console.warn(`猫薄荷不足，无法购买升级: ${upgradeConfig.name}`);
      this.events.emit('purchaseFailed', { 
        reason: 'insufficientCatnip',
        upgrade: upgradeConfig
      });
      return false;
    }
    
    // 消费猫薄荷
    this.resourceSystem.spendCatnip(upgradeConfig.cost, `购买升级: ${upgradeConfig.name}`);
    
    // 创建升级实例
    const upgrade = new Upgrade(upgradeConfig);
    
    // 添加到已购买列表
    this.purchasedUpgrades.push(upgrade);
    
    // 从商店中移除
    this.availableUpgrades = this.availableUpgrades.filter(u => u.id !== upgradeId);
    
    // 触发购买事件
    this.events.emit('upgradePurchased', {
      upgrade: upgrade,
      remainingItems: this.availableUpgrades
    });
    
    return true;
  }
  
  /**
   * 获取当前商店商品
   */
  public getAvailableUpgrades(): any[] {
    return this.availableUpgrades;
  }
  
  /**
   * 获取已购买的升级
   */
  public getPurchasedUpgrades(): Upgrade[] {
    return this.purchasedUpgrades;
  }
  
  /**
   * 获取剩余刷新次数
   */
  public getRemainingRefreshes(): number {
    return this.config.maxRefreshes - this.refreshCount;
  }
  
  /**
   * 获取刷新成本
   */
  public getRefreshCost(): number {
    return this.config.refreshCost;
  }
  
  /**
   * 重置商店
   */
  public reset(): void {
    this.refreshCount = 0;
    this.availableUpgrades = [];
    this.refreshShop(true);
  }
  
  /**
   * 添加事件监听器
   */
  public on(event: string, fn: Function, context?: any): void {
    this.events.on(event, fn, context);
  }
  
  /**
   * 移除事件监听器
   */
  public off(event: string, fn?: Function, context?: any): void {
    this.events.off(event, fn, context);
  }
  
  /**
   * 销毁商店系统
   */
  public destroy(): void {
    this.events.removeAllListeners();
    this.purchasedUpgrades.forEach(upgrade => upgrade.destroy());
  }
}
