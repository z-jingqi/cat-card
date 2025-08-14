# 猫咪卡片游戏 - 技术实现文档

## 技术栈

- **游戏引擎**: Phaser 3
- **编程语言**: TypeScript
- **构建工具**: Vite
- **版本控制**: Git

## 项目结构

```
cat-card-game/
├── assets/              # 游戏资源（图片、音频等）
├── src/
│   ├── classes/         # 游戏核心类
│   │   ├── cards/       # 卡片相关类
│   │   │   ├── CatCard.ts
│   │   │   ├── SupportCard.ts
│   │   │   └── CardFactory.ts
│   │   ├── boss/        # BOSS相关类
│   │   │   ├── Boss.ts
│   │   │   └── BossFactory.ts
│   │   ├── systems/     # 游戏系统相关类
│   │   │   ├── CardPlaySystem.ts
│   │   │   ├── DeckSystem.ts
│   │   │   └── ShopSystem.ts
│   │   └── ui/          # UI相关类
│   │       ├── CardUI.ts
│   │       ├── BossUI.ts
│   │       └── StatusUI.ts
│   ├── scenes/          # 游戏场景
│   │   ├── BootScene.ts      # 启动场景
│   │   ├── MenuScene.ts      # 主菜单场景
│   │   ├── BattleScene.ts    # 战斗场景
│   │   ├── ShopScene.ts      # 商店场景
│   │   └── ResultScene.ts    # 结果场景
│   ├── utils/           # 工具函数
│   │   ├── animations.ts
│   │   └── helpers.ts
│   ├── constants/       # 常量定义
│   │   ├── cards.ts
│   │   ├── bosses.ts
│   │   └── upgrades.ts
│   ├── config.ts        # 游戏配置
│   └── main.ts          # 入口文件
├── index.html           # HTML入口
└── tsconfig.json        # TypeScript配置
```

## 核心类设计

### 卡片系统

#### `Card` 基类
```typescript
abstract class Card {
    id: string;
    name: string;
    description: string;
    sprite: Phaser.GameObjects.Sprite;
    
    constructor(scene: Phaser.Scene, x: number, y: number, config: CardConfig) {
        // 初始化卡片
    }
    
    abstract use(): void;  // 使用卡片的效果
    
    // 共用方法
    select(): void {}
    deselect(): void {}
    enableInteraction(): void {}
    disableInteraction(): void {}
}
```

#### `CatCard` 类
```typescript
class CatCard extends Card {
    breed: CatBreed;    // 猫咪品种（缅因猫、暹罗猫、孟加拉猫、布偶猫、美国短毛猫）
    attack: number;   // 固定攻击力
    specialAbility: SpecialAbility;  // 特殊能力
    
    use(): void {
        // 实现攻击逻辑
        // 触发特殊能力（如连击、魔法飓风、暴击、群体增益、穿透攻击等）
    }
}
```

#### `SupportCard` 类
```typescript
class SupportCard extends Card {
    itemType: CatItemType;  // 猫咪物品类型（猫薄荷精华、猫抓板、逗猫棒、猫铃铛、激光笔）
    effect: SupportEffect;  // 辅助效果类型
    value: number;          // 效果值
    
    use(): void {
        // 实现辅助效果逻辑
        // 所有效果只影响当前回合
    }
}
```

### BOSS系统

#### `Boss` 类
```typescript
class Boss extends Phaser.GameObjects.Container {
    hp: number;
    maxHp: number;
    name: string;
    resistance: Map<CatBreed, number>;  // 对不同猫咪品种的抗性
    weakness: Map<CatBreed, number>;    // 对不同猫咪品种的弱点
    passiveAbility?: PassiveAbility;   // 被动能力
    
    constructor(scene: Phaser.Scene, x: number, y: number, config: BossConfig) {
        // 初始化BOSS
    }
    
    takeDamage(damage: number, source: CatBreed): void {
        // 计算实际伤害并应用
    }
    
    update(): void {
        // 更新BOSS状态，触发被动能力等
        // 注意：BOSS不会主动攻击玩家
    }
    
    // 视觉效果方法
    showDamageEffect(): void {}
    playDeathAnimation(): void {}
}
```

### 游戏系统

#### `CardOrderManager` 类
```typescript
class CardOrderManager {
    private catCards: CatCard[];
    private supportCards: SupportCard[];
    private upgrades: Upgrade[];
    
    constructor() {
        this.catCards = [];
        this.supportCards = [];
        this.upgrades = [];
    }
    
    setCards(catCards: CatCard[], supportCards: SupportCard[]): void {
        this.catCards = [...catCards];
        this.supportCards = [...supportCards];
    }
    
    setUpgrades(upgrades: Upgrade[]): void {
        this.upgrades = [...upgrades];
    }
    
    reorderCatCards(indices: number[]): void {
        // 根据提供的索引重新排序猫咪卡片
        if (indices.length !== this.catCards.length) return;
        const newOrder = indices.map(i => this.catCards[i]);
        this.catCards = newOrder;
    }
    
    reorderSupportCards(indices: number[]): void {
        // 根据提供的索引重新排序辅助卡片
        if (indices.length !== this.supportCards.length) return;
        const newOrder = indices.map(i => this.supportCards[i]);
        this.supportCards = newOrder;
    }
    
    reorderUpgrades(indices: number[]): void {
        // 根据提供的索引重新排序永久增益
        if (indices.length !== this.upgrades.length) return;
        const newOrder = indices.map(i => this.upgrades[i]);
        this.upgrades = newOrder;
    }
    
    getOrderedCatCards(): CatCard[] {
        return this.catCards;
    }
    
    getOrderedSupportCards(): SupportCard[] {
        return this.supportCards;
    }
    
    getOrderedUpgrades(): Upgrade[] {
        return this.upgrades;
    }
    
    // 处理卡片和增益效果，按照规定顺序
    processEffects(battle: BattleScene): void {
        // 1. 先处理辅助卡片效果（从左到右）
        this.supportCards.forEach(card => {
            if (card.isSelected()) {
                card.use();
            }
        });
        
        // 2. 处理永久增益效果
        this.upgrades.forEach(upgrade => {
            upgrade.applyEffect(battle);
        });
        
        // 3. 处理猫咪卡片攻击（从左到右）
        this.catCards.forEach(card => {
            if (card.isSelected()) {
                card.use();
            }
        });
    }
}
```

#### `CardPlaySystem` 类
```typescript
class CardPlaySystem {
    private cardsPerTurn: number;
    private cardsPlayedThisTurn: number;
    private totalPlaysAllowed: number;
    private totalPlaysUsed: number;
    
    constructor(cardsPerTurn: number = 1, totalPlaysAllowed: number = 15) {
        this.cardsPerTurn = cardsPerTurn;
        this.totalPlaysAllowed = totalPlaysAllowed;
        this.resetTurn();
    }
    
    resetTurn(): void {
        this.cardsPlayedThisTurn = 0;
    }
    
    playCard(): boolean {
        // 尝试出牌，检查回合限制和总限制
        if (this.cardsPlayedThisTurn < this.cardsPerTurn && this.totalPlaysUsed < this.totalPlaysAllowed) {
            this.cardsPlayedThisTurn++;
            this.totalPlaysUsed++;
            return true;
        }
        return false;
    }
    
    increaseCardsPerTurn(amount: number): void {
        // 增加每回合可出牌数
        this.cardsPerTurn += amount;
    }
    
    increaseTotalPlays(amount: number): void {
        // 增加总出牌次数
        this.totalPlaysAllowed += amount;
    }
    
    isTurnComplete(): boolean {
        // 检查当前回合是否结束
        return this.cardsPlayedThisTurn >= this.cardsPerTurn;
    }
    
    getRemainingTotalPlays(): number {
        // 获取剩余总出牌次数
        return this.totalPlaysAllowed - this.totalPlaysUsed;
    }
}
```

#### `DeckSystem` 类
```typescript
class DeckSystem {
    catDeck: CatCard[];
    supportDeck: SupportCard[];
    catHand: CatCard[];
    supportHand: SupportCard[];
    
    constructor(catCards: CatCardConfig[], supportCards: SupportCardConfig[]) {
        // 初始化牌组
    }
    
    shuffleDecks(): void {
        // 洗牌算法
    }
    
    drawInitialHand(): { cats: CatCard[], supports: SupportCard[] } {
        // 抽取初始手牌
    }
    
    redrawCards(discardedCats: CatCard[], discardedSupports: SupportCard[]): { cats: CatCard[], supports: SupportCard[] } {
        // 实现重抽机制
    }
    
    drawCard(isCatCard: boolean): Card | null {
        // 抽一张卡
    }
}
```

#### `ShopSystem` 类
```typescript
class ShopSystem {
    private catnipAmount: number;
    private availableUpgrades: Upgrade[];
    private purchasedUpgrades: Upgrade[];
    private scene: ShopScene;
    
    constructor(scene: ShopScene, initialCatnip: number) {
        // 初始化商店系统
    }
    
    generateShopItems(playerLevel: number): Upgrade[] {
        // 根据玩家等级生成商店物品
    }
    
    purchaseUpgrade(upgrade: Upgrade): boolean {
        // 购买升级
    }
    
    sellUpgrade(upgrade: Upgrade): void {
        // 出售升级
    }
    
    refreshShop(): void {
        // 刷新商店物品
    }
}
```

## 场景设计

### `BattleScene` 类
```typescript
class BattleScene extends Phaser.Scene {
    private boss: Boss;
    private cardPlaySystem: CardPlaySystem;
    private deckSystem: DeckSystem;
    private catCards: CatCard[];
    private supportCards: SupportCard[];
    private playerHp: number;
    private currentRound: number;
    private maxRounds: number;
    private activeUpgrades: Upgrade[];
    private cardOrderManager: CardOrderManager;  // 管理卡片顺序
    
    create(): void {
        // 初始化战斗场景
        // 创建BOSS、卡片、UI等
    }
    
    update(): void {
        // 更新游戏状态
    }
    
    startPlayerTurn(): void {
        // 开始玩家回合
    }
    
    endPlayerTurn(): void {
        // 结束玩家回合
    }
    
    useCard(card: Card): void {
        // 使用卡片
    }
    
    reorderCards(catCardIndices: number[], supportCardIndices: number[]): void {
        // 重新排序猫咪卡片和辅助卡片
    }
    
    reorderUpgrades(upgradeIndices: number[]): void {
        // 重新排序永久增益
    }
    
    processCardEffects(): void {
        // 按顺序处理辅助卡片效果，然后是永久增益，最后是猫咪卡片攻击
    }
    
    checkWinCondition(): boolean {
        // 检查胜利条件
    }
    
    checkLoseCondition(): boolean {
        // 检查失败条件
    }
    
    finishBattle(isVictory: boolean): void {
        // 结束战斗，计算奖励
    }
}
```

### `ShopScene` 类
```typescript
class ShopScene extends Phaser.Scene {
    private shopSystem: ShopSystem;
    private activeUpgrades: Upgrade[];
    private availableUpgradeSlots: number;
    
    create(): void {
        // 初始化商店场景
        // 显示可购买的升级
    }
    
    buyUpgrade(upgrade: Upgrade): void {
        // 购买升级
    }
    
    sellUpgrade(upgrade: Upgrade): void {
        // 出售升级
    }
    
    equipUpgrade(upgrade: Upgrade): void {
        // 装备升级
    }
    
    continueToNextBattle(): void {
        // 继续到下一个战斗
    }
}
```

## 数据结构

### 卡片配置
```typescript
interface CardConfig {
    id: string;
    name: string;
    description: string;
    spriteKey: string;
}

interface CatCardConfig extends CardConfig {
    breed: CatBreed;
    attack: number;
    specialAbility: {
        type: SpecialAbilityType;
        value: number;
    };
}

interface SupportCardConfig extends CardConfig {
    itemType: CatItemType;
    effect: SupportEffectType;
    value: number;
}
```

### 增益配置
```typescript
interface Upgrade {
    id: string;
    name: string;
    description: string;
    cost: number;
    sellValue: number;
    type: UpgradeType;
    effect: UpgradeEffect;
    tier: 1 | 2 | 3;  // 增益等级
    iconKey: string;
}

type UpgradeType = 'cat' | 'cardPlay' | 'card' | 'battle';

interface UpgradeEffect {
    target: string;
    value: number;
    condition?: EffectCondition;
}
```

### BOSS配置
```typescript
interface BossConfig {
    id: string;
    name: string;
    hp: number;
    spriteKey: string;
    resistance?: {
        breed: CatBreed;
        value: number;
    }[];
    weakness?: {
        breed: CatBreed;
        value: number;
    }[];
    passiveAbility?: {
        type: PassiveAbilityType;  // 如: 生命恢复, 免疫特定卡片等
        value: number;
        trigger: TriggerCondition;  // 如: 每X回合, 当生命值低于X%等
    };
}
```

## 状态管理

游戏状态将使用简单的状态管理模式，通过场景间传递参数来保存和更新游戏进度。

```typescript
interface GameState {
    playerHp: number;
    maxPlayerHp: number;
    currentBossId: string;
    defeatedBosses: string[];
    catnipAmount: number;
    activeUpgrades: Upgrade[];
    unlockedUpgrades: Upgrade[];
    availableUpgradeSlots: number;
    currentAdventureDifficulty: number;
}
```

## 动画系统

使用Phaser的动画系统创建卡片效果和战斗动画：

```typescript
// 示例：设置卡片使用动画
function setupCardAnimations(scene: Phaser.Scene): void {
    scene.anims.create({
        key: 'card-play',
        frames: scene.anims.generateFrameNumbers('card-effect', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
    });
    
    scene.anims.create({
        key: 'boss-damage',
        frames: scene.anims.generateFrameNumbers('boss-damage-effect', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0
    });
}
```

## 响应式设计

为适应不同屏幕尺寸，UI布局将根据屏幕大小自动调整：

```typescript
function resizeGameUI(scene: Phaser.Scene): void {
    const { width, height } = scene.scale;
    
    // 调整卡片区域
    const cardArea = scene.children.getByName('card-area');
    cardArea.setPosition(width / 2, height - 100);
    cardArea.setSize(width * 0.9, 200);
    
    // 调整BOSS位置
    const boss = scene.children.getByName('boss');
    boss.setPosition(width / 2, height / 3);
    
    // 调整状态UI
    const statusUI = scene.children.getByName('status-ui');
    statusUI.setPosition(100, 50);
}
```

## 性能优化

- 使用对象池减少对象创建和销毁
- 合理管理纹理资源
- 使用帧率限制和优化动画

## 扩展性

设计考虑未来扩展：

- 卡片和BOSS通过配置文件定义，便于添加新内容
- 使用工厂模式创建对象，便于扩展
- 模块化设计使新功能可以独立开发
