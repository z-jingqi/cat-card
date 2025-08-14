import Phaser from 'phaser';
import { ShopSystem } from '../classes/systems/ShopSystem';
import { ResourceSystem } from '../classes/systems/ResourceSystem';
import { CatnipDisplay } from '../ui/CatnipDisplay';
import { Upgrade } from '../classes/upgrades/Upgrade';

/**
 * 商店场景
 * 玩家可以在这里购买永久增益
 */
export default class ShopScene extends Phaser.Scene {
  // 系统组件
  private shopSystem!: ShopSystem;
  private resourceSystem!: ResourceSystem;
  
  // UI组件
  private catnipDisplay!: CatnipDisplay;
  
  // 商店UI元素
  private shopItemsContainer!: Phaser.GameObjects.Container;
  private purchasedItemsContainer!: Phaser.GameObjects.Container;
  private refreshButton!: Phaser.GameObjects.Container;
  private continueButton!: Phaser.GameObjects.Container;
  
  // 当前关卡
  private currentLevel: number = 1;
  private nextLevel: number = 2;
  
  // 商店项目的UI配置
  private shopItemConfig = {
    width: 200,
    height: 250,
    padding: 10,
    spacing: 20,
    columns: 3,
    itemsPerPage: 6
  };
  
  constructor() {
    super({ key: 'ShopScene' });
  }
  
  /**
   * 初始化场景数据
   */
  init(data: any): void {
    // 从上一个场景获取数据
    if (data) {
      this.currentLevel = data.currentLevel || 1;
      this.nextLevel = data.nextLevel || this.currentLevel + 1;
      
      // 如果有资源系统，使用它
      if (data.resourceSystem) {
        this.resourceSystem = data.resourceSystem;
      }
    }
  }
  
  create(): void {
    // 创建背景
    this.createBackground();
    
    // 初始化资源系统（如果没有从上一个场景传递过来）
    if (!this.resourceSystem) {
      this.resourceSystem = new ResourceSystem(this, 50); // 默认给予50猫薄荷
    }
    
    // 初始化商店系统
    this.shopSystem = new ShopSystem(this, this.resourceSystem);
    
    // 创建UI
    this.createUI();
    
    // 设置事件监听
    this.setupEventListeners();
    
    // 显示欢迎消息
    this.showWelcomeMessage();
  }
  
  /**
   * 创建背景
   */
  private createBackground(): void {
    // 创建渐变背景
    const background = this.add.graphics();
    background.fillGradientStyle(
      0x3a7ca5, 0x3a7ca5, 0x2f5d8a, 0x2f5d8a, 1
    );
    background.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    
    // 添加一些装饰元素
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, this.cameras.main.width);
      const y = Phaser.Math.Between(0, this.cameras.main.height);
      const size = Phaser.Math.Between(2, 5);
      
      const star = this.add.circle(x, y, size, 0xffffff, 0.5);
      
      // 添加闪烁动画
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 0.8 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1
      });
    }
  }
  
  /**
   * 创建UI元素
   */
  private createUI(): void {
    // 创建标题
    this.add.text(this.cameras.main.width / 2, 50, '猫薄荷商店', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // 创建猫薄荷显示
    this.catnipDisplay = new CatnipDisplay(this, this.resourceSystem, {
      x: this.cameras.main.width - 120,
      y: 50,
      width: 120,
      height: 40,
      backgroundColor: 0x4a9c59,
      borderColor: 0x6bdf81,
      textStyle: {
        fontSize: '20px',
        color: '#fff',
        fontStyle: 'bold'
      }
    });
    
    // 创建商店物品容器
    this.shopItemsContainer = this.add.container(0, 120);
    
    // 创建已购买物品容器
    this.purchasedItemsContainer = this.add.container(0, this.cameras.main.height - 150);
    
    // 添加已购买物品标题
    this.add.text(20, this.cameras.main.height - 180, '已购买的增益:', {
      fontSize: '24px',
      color: '#ffffff'
    });
    
    // 创建刷新按钮
    this.createRefreshButton();
    
    // 创建继续按钮
    this.createContinueButton();
    
    // 显示商店物品
    this.displayShopItems();
    
    // 显示已购买物品
    this.displayPurchasedItems();
  }
  
  /**
   * 创建刷新按钮
   */
  private createRefreshButton(): void {
    const buttonWidth = 150;
    const buttonHeight = 50;
    const x = this.cameras.main.width / 2 - buttonWidth - 10;
    const y = this.cameras.main.height - 60;
    
    // 创建按钮容器
    this.refreshButton = this.add.container(x, y);
    
    // 创建按钮背景
    const background = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x4a6d8c)
      .setStrokeStyle(2, 0x8cb0d9);
    this.refreshButton.add(background);
    
    // 创建按钮文本
    const remainingRefreshes = this.shopSystem.getRemainingRefreshes();
    const refreshCost = this.shopSystem.getRefreshCost();
    const text = this.add.text(0, 0, `刷新 (${refreshCost}猫薄荷)\n剩余: ${remainingRefreshes}`, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    this.refreshButton.add(text);
    
    // 添加交互性
    background.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        background.setFillStyle(0x5a7d9c);
      })
      .on('pointerout', () => {
        background.setFillStyle(0x4a6d8c);
      })
      .on('pointerdown', () => {
        background.setFillStyle(0x3a5d7c);
      })
      .on('pointerup', () => {
        background.setFillStyle(0x5a7d9c);
        this.refreshShop();
      });
  }
  
  /**
   * 创建继续按钮
   */
  private createContinueButton(): void {
    const buttonWidth = 150;
    const buttonHeight = 50;
    const x = this.cameras.main.width / 2 + buttonWidth - 140;
    const y = this.cameras.main.height - 60;
    
    // 创建按钮容器
    this.continueButton = this.add.container(x, y);
    
    // 创建按钮背景
    const background = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x4caf50)
      .setStrokeStyle(2, 0x8aea92);
    this.continueButton.add(background);
    
    // 创建按钮文本
    const text = this.add.text(0, 0, `继续游戏`, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.continueButton.add(text);
    
    // 添加交互性
    background.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        background.setFillStyle(0x5cbf60);
      })
      .on('pointerout', () => {
        background.setFillStyle(0x4caf50);
      })
      .on('pointerdown', () => {
        background.setFillStyle(0x3c9f40);
      })
      .on('pointerup', () => {
        background.setFillStyle(0x5cbf60);
        this.continueToNextLevel();
      });
  }
  
  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听商店系统事件
    this.shopSystem.on('shopRefreshed', this.onShopRefreshed, this);
    this.shopSystem.on('upgradePurchased', this.onUpgradePurchased, this);
    this.shopSystem.on('refreshFailed', this.onRefreshFailed, this);
    this.shopSystem.on('purchaseFailed', this.onPurchaseFailed, this);
    
    // 监听资源系统事件
    this.resourceSystem.on('catnipChanged', this.onCatnipChanged, this);
  }
  
  /**
   * 显示商店物品
   */
  private displayShopItems(): void {
    // 清空容器
    this.shopItemsContainer.removeAll(true);
    
    // 获取可用升级
    const availableUpgrades = this.shopSystem.getAvailableUpgrades();
    
    if (availableUpgrades.length === 0) {
      // 如果没有可用升级，显示提示
      const noItemsText = this.add.text(this.cameras.main.width / 2, 200, '商店中没有可用的增益', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'italic'
      }).setOrigin(0.5);
      this.shopItemsContainer.add(noItemsText);
      return;
    }
    
    // 计算布局
    const startX = (this.cameras.main.width - 
      (this.shopItemConfig.width * Math.min(this.shopItemConfig.columns, availableUpgrades.length) + 
       this.shopItemConfig.spacing * (Math.min(this.shopItemConfig.columns, availableUpgrades.length) - 1))) / 2;
    
    // 创建每个商品的UI
    availableUpgrades.forEach((upgrade, index) => {
      const column = index % this.shopItemConfig.columns;
      const row = Math.floor(index / this.shopItemConfig.columns);
      
      const x = startX + column * (this.shopItemConfig.width + this.shopItemConfig.spacing);
      const y = row * (this.shopItemConfig.height + this.shopItemConfig.spacing);
      
      // 创建商品UI
      const itemContainer = this.createShopItemUI(upgrade, x, y);
      this.shopItemsContainer.add(itemContainer);
    });
  }
  
  /**
   * 创建单个商店物品UI
   */
  private createShopItemUI(upgrade: any, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    // 创建背景
    const background = this.add.rectangle(
      this.shopItemConfig.width / 2,
      this.shopItemConfig.height / 2,
      this.shopItemConfig.width,
      this.shopItemConfig.height,
      0x2a4d6a
    ).setStrokeStyle(2, 0x4a8dca);
    container.add(background);
    
    // 创建标题
    const title = this.add.text(
      this.shopItemConfig.width / 2,
      this.shopItemConfig.padding + 10,
      upgrade.name,
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0);
    container.add(title);
    
    // 创建图标（如果有）
    if (upgrade.spriteKey) {
      try {
        const icon = this.add.sprite(
          this.shopItemConfig.width / 2,
          this.shopItemConfig.padding + 50,
          upgrade.spriteKey
        ).setScale(0.5);
        container.add(icon);
      } catch (error) {
        console.warn(`无法加载升级图标: ${upgrade.spriteKey}`, error);
      }
    }
    
    // 创建描述
    const description = this.add.text(
      this.shopItemConfig.padding + 10,
      this.shopItemConfig.padding + 80,
      upgrade.description,
      {
        fontSize: '14px',
        color: '#cccccc',
        wordWrap: { width: this.shopItemConfig.width - this.shopItemConfig.padding * 2 - 20 }
      }
    );
    container.add(description);
    
    // 创建价格
    const priceText = this.add.text(
      this.shopItemConfig.width / 2,
      this.shopItemConfig.height - this.shopItemConfig.padding - 30,
      `价格: ${upgrade.cost} 猫薄荷`,
      {
        fontSize: '16px',
        color: this.resourceSystem.hasSufficientCatnip(upgrade.cost) ? '#4caf50' : '#f44336'
      }
    ).setOrigin(0.5);
    container.add(priceText);
    
    // 创建购买按钮
    const buttonWidth = 120;
    const buttonHeight = 30;
    const buttonBackground = this.add.rectangle(
      this.shopItemConfig.width / 2,
      this.shopItemConfig.height - this.shopItemConfig.padding - 10,
      buttonWidth,
      buttonHeight,
      this.resourceSystem.hasSufficientCatnip(upgrade.cost) ? 0x4caf50 : 0x888888
    ).setStrokeStyle(1, 0xffffff);
    container.add(buttonBackground);
    
    const buttonText = this.add.text(
      this.shopItemConfig.width / 2,
      this.shopItemConfig.height - this.shopItemConfig.padding - 10,
      '购买',
      {
        fontSize: '16px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);
    container.add(buttonText);
    
    // 添加交互性
    if (this.resourceSystem.hasSufficientCatnip(upgrade.cost)) {
      buttonBackground.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          buttonBackground.setFillStyle(0x5cbf60);
        })
        .on('pointerout', () => {
          buttonBackground.setFillStyle(0x4caf50);
        })
        .on('pointerdown', () => {
          buttonBackground.setFillStyle(0x3c9f40);
        })
        .on('pointerup', () => {
          buttonBackground.setFillStyle(0x5cbf60);
          this.purchaseUpgrade(upgrade.id);
        });
    }
    
    return container;
  }
  
  /**
   * 显示已购买物品
   */
  private displayPurchasedItems(): void {
    // 清空容器
    this.purchasedItemsContainer.removeAll(true);
    
    // 获取已购买升级
    const purchasedUpgrades = this.shopSystem.getPurchasedUpgrades();
    
    if (purchasedUpgrades.length === 0) {
      // 如果没有已购买升级，显示提示
      const noItemsText = this.add.text(this.cameras.main.width / 2, 20, '尚未购买任何增益', {
        fontSize: '18px',
        color: '#cccccc',
        fontStyle: 'italic'
      }).setOrigin(0.5);
      this.purchasedItemsContainer.add(noItemsText);
      return;
    }
    
    // 计算布局
    const itemWidth = 150;
    const itemHeight = 80;
    const spacing = 10;
    const startX = 20;
    
    // 创建每个已购买物品的UI
    purchasedUpgrades.forEach((upgrade, index) => {
      const x = startX + index * (itemWidth + spacing);
      
      // 创建已购买物品UI
      const itemContainer = this.createPurchasedItemUI(upgrade, x, 0, itemWidth, itemHeight);
      this.purchasedItemsContainer.add(itemContainer);
    });
  }
  
  /**
   * 创建单个已购买物品UI
   */
  private createPurchasedItemUI(
    upgrade: Upgrade, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    // 创建背景
    const background = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x2a6d4a
    ).setStrokeStyle(1, 0x4caf50);
    container.add(background);
    
    // 创建标题
    const title = this.add.text(
      width / 2,
      10,
      upgrade.name,
      {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0);
    container.add(title);
    
    // 创建描述
    const description = this.add.text(
      width / 2,
      40,
      upgrade.description,
      {
        fontSize: '12px',
        color: '#cccccc',
        align: 'center',
        wordWrap: { width: width - 20 }
      }
    ).setOrigin(0.5, 0);
    container.add(description);
    
    return container;
  }
  
  /**
   * 刷新商店
   */
  private refreshShop(): void {
    this.shopSystem.refreshShop();
  }
  
  /**
   * 购买升级
   */
  private purchaseUpgrade(upgradeId: string): void {
    this.shopSystem.purchaseUpgrade(upgradeId);
  }
  
  /**
   * 继续到下一关
   */
  private continueToNextLevel(): void {
    // 传递数据到战斗场景
    this.scene.start('BattleScene', {
      level: this.nextLevel,
      resourceSystem: this.resourceSystem,
      purchasedUpgrades: this.shopSystem.getPurchasedUpgrades()
    });
  }
  
  /**
   * 商店刷新事件处理
   */
  private onShopRefreshed(data: { items: any[], refreshesRemaining: number }): void {
    console.log(`商店刷新成功，剩余刷新次数: ${data.refreshesRemaining}`);
    
    // 更新商店显示
    this.displayShopItems();
    
    // 更新刷新按钮
    this.updateRefreshButton();
    
    // 显示刷新消息
    this.showMessage('商店已刷新！', '#4caf50');
  }
  
  /**
   * 升级购买事件处理
   */
  private onUpgradePurchased(data: { upgrade: Upgrade, remainingItems: any[] }): void {
    console.log(`成功购买升级: ${data.upgrade.name}`);
    
    // 更新商店显示
    this.displayShopItems();
    
    // 更新已购买物品显示
    this.displayPurchasedItems();
    
    // 显示购买成功消息
    this.showMessage(`成功购买: ${data.upgrade.name}`, '#4caf50');
  }
  
  /**
   * 刷新失败事件处理
   */
  private onRefreshFailed(data: { reason: string }): void {
    let message = '刷新失败';
    
    if (data.reason === 'insufficientCatnip') {
      message = '猫薄荷不足，无法刷新商店';
    } else if (data.reason === 'maxRefreshesReached') {
      message = '已达到最大刷新次数';
    }
    
    console.warn(message);
    this.showMessage(message, '#f44336');
  }
  
  /**
   * 购买失败事件处理
   */
  private onPurchaseFailed(data: { reason: string, upgrade: any }): void {
    let message = '购买失败';
    
    if (data.reason === 'insufficientCatnip') {
      message = `猫薄荷不足，无法购买: ${data.upgrade.name}`;
    }
    
    console.warn(message);
    this.showMessage(message, '#f44336');
  }
  
  /**
   * 猫薄荷变化事件处理
   */
  private onCatnipChanged(data: any): void {
    // 更新商店显示（价格颜色可能需要更新）
    this.displayShopItems();
    
    // 更新刷新按钮状态
    this.updateRefreshButton();
    
    // 显示资源变化效果
    if (data && data.delta) {
      this.catnipDisplay.showChangeEffect(data.isGain ? data.delta : -data.delta);
    }
  }
  
  /**
   * 更新刷新按钮
   */
  private updateRefreshButton(): void {
    // 清空容器
    this.refreshButton.removeAll(true);
    
    const buttonWidth = 150;
    const buttonHeight = 50;
    
    // 获取最新数据
    const remainingRefreshes = this.shopSystem.getRemainingRefreshes();
    const refreshCost = this.shopSystem.getRefreshCost();
    const canRefresh = remainingRefreshes > 0 && this.resourceSystem.hasSufficientCatnip(refreshCost);
    
    // 创建按钮背景
    const background = this.add.rectangle(
      0, 0, buttonWidth, buttonHeight,
      canRefresh ? 0x4a6d8c : 0x888888
    ).setStrokeStyle(2, canRefresh ? 0x8cb0d9 : 0xaaaaaa);
    this.refreshButton.add(background);
    
    // 创建按钮文本
    const text = this.add.text(0, 0, `刷新 (${refreshCost}猫薄荷)\n剩余: ${remainingRefreshes}`, {
      fontSize: '16px',
      color: canRefresh ? '#ffffff' : '#cccccc',
      align: 'center'
    }).setOrigin(0.5);
    this.refreshButton.add(text);
    
    // 添加交互性
    if (canRefresh) {
      background.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          background.setFillStyle(0x5a7d9c);
        })
        .on('pointerout', () => {
          background.setFillStyle(0x4a6d8c);
        })
        .on('pointerdown', () => {
          background.setFillStyle(0x3a5d7c);
        })
        .on('pointerup', () => {
          background.setFillStyle(0x5a7d9c);
          this.refreshShop();
        });
    }
  }
  
  /**
   * 显示欢迎消息
   */
  private showWelcomeMessage(): void {
    this.showMessage(`欢迎来到猫薄荷商店！\n使用猫薄荷购买永久增益`, '#4caf50', 3000);
  }
  
  /**
   * 显示消息
   */
  private showMessage(text: string, color: string = '#000', duration: number = 2000): void {
    const message = this.add.text(this.cameras.main.width / 2, 350, text, { 
      fontSize: '24px', 
      color: color,
      backgroundColor: '#ffffff80',
      padding: { x: 20, y: 10 },
      align: 'center'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: message,
      alpha: 0,
      y: message.y - 50,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        message.destroy();
      }
    });
  }
}
