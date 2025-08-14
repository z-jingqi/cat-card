// 猫咪品种枚举
export enum CatBreed {
  MAINE_COON = 'maine_coon',       // 缅因猫
  SIAMESE = 'siamese',             // 暹罗猫
  BENGAL = 'bengal',               // 孟加拉猫
  RAGDOLL = 'ragdoll',             // 布偶猫
  AMERICAN_SHORTHAIR = 'american'  // 美国短毛猫
}

// 猫咪特殊能力类型
export enum SpecialAbilityType {
  DOUBLE_ATTACK = 'double_attack',   // 连击 - 攻击两次
  MAGIC_WIND = 'magic_wind',         // 魔法飓风 - 造成额外固定伤害
  CRITICAL_HIT = 'critical_hit',     // 暴击 - 几率双倍伤害
  GROUP_BUFF = 'group_buff',         // 群体增益 - 增加其他猫咪攻击力
  PIERCE = 'pierce'                  // 穿透攻击 - 造成额外伤害
}

// 猫咪物品类型
export enum CatItemType {
  CATNIP = 'catnip',             // 猫薄荷精华
  SCRATCH_POST = 'scratch_post', // 猫抓板
  CAT_TOY = 'cat_toy',           // 逗猫棒
  BELL = 'bell',                 // 猫铃铛
  LASER = 'laser'                // 激光笔
}

// 辅助效果类型
export enum SupportEffectType {
  DAMAGE_BOOST = 'damage_boost',       // 伤害提升
  ABILITY_REPEAT = 'ability_repeat',   // 能力重复触发
  EXTRA_PLAY = 'extra_play',           // 额外出牌机会
  DRAW_CARDS = 'draw_cards',           // 抽取卡片
  CRITICAL_CHANCE = 'critical_chance'  // 暴击几率提升
}

// 永久增益类型
export enum UpgradeType {
  CAT = 'cat',           // 猫咪强化
  CARD_PLAY = 'card_play', // 出牌系统增益
  CARD = 'card',         // 卡片系统增益
  BATTLE = 'battle'      // 战斗增益
}

// 增益效果条件
export interface EffectCondition {
  type: string;
  value: number;
}

// BOSS被动技能类型
export enum PassiveAbilityType {
  HEAL = 'heal',             // 治疗
  IMMUNITY = 'immunity',     // 免疫
  RESISTANCE = 'resistance'  // 抗性
}

// BOSS技能触发条件
export enum TriggerCondition {
  EVERY_X_TURNS = 'every_x_turns',  // 每X回合
  HP_BELOW = 'hp_below'             // 生命值低于X%
}
