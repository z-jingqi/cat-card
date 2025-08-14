import Phaser from 'phaser';

/**
 * 资源系统
 * 管理游戏中的猫薄荷资源
 */
export class ResourceSystem {
  // 资源数量
  private catnip: number = 0;
  
  // 事件发射器
  private events: Phaser.Events.EventEmitter;
  
  // 场景引用
  private scene: Phaser.Scene;
  
  /**
   * 构造函数
   */
  constructor(scene: Phaser.Scene, initialCatnip: number = 0) {
    this.scene = scene;
    this.catnip = initialCatnip;
    this.events = new Phaser.Events.EventEmitter();
  }
  
  /**
   * 获取当前猫薄荷数量
   */
  public getCatnip(): number {
    return this.catnip;
  }
  
  /**
   * 添加猫薄荷
   * @param amount 要添加的数量
   * @param source 来源（用于记录和展示）
   */
  public addCatnip(amount: number, source: string = 'unknown'): void {
    if (amount <= 0) {
      console.warn(`尝试添加非正数量的猫薄荷: ${amount}`);
      return;
    }
    
    const oldAmount = this.catnip;
    this.catnip += amount;
    
    console.log(`获得猫薄荷: +${amount} (来源: ${source}), 当前总数: ${this.catnip}`);
    
    // 触发资源变化事件
    this.events.emit('catnipChanged', {
      oldAmount,
      newAmount: this.catnip,
      delta: amount,
      isGain: true,
      source
    });
  }
  
  /**
   * 消费猫薄荷
   * @param amount 要消费的数量
   * @param reason 消费原因（用于记录和展示）
   * @returns 是否消费成功
   */
  public spendCatnip(amount: number, reason: string = 'unknown'): boolean {
    if (amount <= 0) {
      console.warn(`尝试消费非正数量的猫薄荷: ${amount}`);
      return false;
    }
    
    if (this.catnip < amount) {
      console.warn(`猫薄荷不足，无法消费: 需要${amount}, 当前${this.catnip}`);
      return false;
    }
    
    const oldAmount = this.catnip;
    this.catnip -= amount;
    
    console.log(`消费猫薄荷: -${amount} (原因: ${reason}), 剩余: ${this.catnip}`);
    
    // 触发资源变化事件
    this.events.emit('catnipChanged', {
      oldAmount,
      newAmount: this.catnip,
      delta: amount,
      isGain: false,
      reason
    });
    
    return true;
  }
  
  /**
   * 检查是否有足够的猫薄荷
   */
  public hasSufficientCatnip(amount: number): boolean {
    return this.catnip >= amount;
  }
  
  /**
   * 重置资源系统
   */
  public reset(amount: number = 0): void {
    this.catnip = amount;
    this.events.emit('catnipReset', this.catnip);
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
   * 销毁资源系统
   */
  public destroy(): void {
    this.events.removeAllListeners();
  }
  
  /**
   * 在战斗结束后根据表现计算获得的猫薄荷
   * @param turnsUsed 使用的回合数
   * @param totalTurns 总回合数限制
   * @param bossMaxHp BOSS的最大生命值
   * @returns 获得的猫薄荷数量
   */
  public calculateBattleReward(turnsUsed: number, totalTurns: number, bossMaxHp: number): number {
    // 基础奖励
    let reward = 10;
    
    // 回合数奖励 (越快通关奖励越多)
    const turnBonus = Math.floor((totalTurns - turnsUsed) * 2);
    reward += Math.max(0, turnBonus);
    
    // BOSS难度奖励 (BOSS血量越高奖励越多)
    const bossBonus = Math.floor(bossMaxHp / 100);
    reward += bossBonus;
    
    // 确保至少有最小奖励
    return Math.max(5, reward);
  }
}
