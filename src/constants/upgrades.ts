import { UpgradeConfig } from '../classes/upgrades/Upgrade';
import { UpgradeType } from './types';

/**
 * 永久增益配置
 */
export const UPGRADES: UpgradeConfig[] = [
  // ===== 猫咪强化 =====
  // 锋利爪牙 - 一级
  {
    id: 'sharp_claws_1',
    name: '锋利爪牙 I',
    description: '所有猫咪卡片攻击力+2',
    cost: 50,
    sellValue: 25,
    type: UpgradeType.CAT,
    effect: {
      target: 'attack',
      value: 2
    },
    tier: 1,
    iconKey: 'upgrade_claw_1'
  },
  
  // 锋利爪牙 - 二级
  {
    id: 'sharp_claws_2',
    name: '锋利爪牙 II',
    description: '所有猫咪卡片攻击力+4',
    cost: 100,
    sellValue: 50,
    type: UpgradeType.CAT,
    effect: {
      target: 'attack',
      value: 4
    },
    tier: 2,
    iconKey: 'upgrade_claw_2'
  },
  
  // 锋利爪牙 - 三级
  {
    id: 'sharp_claws_3',
    name: '锋利爪牙 III',
    description: '所有猫咪卡片攻击力+6',
    cost: 150,
    sellValue: 75,
    type: UpgradeType.CAT,
    effect: {
      target: 'attack',
      value: 6
    },
    tier: 3,
    iconKey: 'upgrade_claw_3'
  },
  
  // 灵敏反应 - 一级
  {
    id: 'quick_reflex_1',
    name: '灵敏反应 I',
    description: '10%几率猫咪卡片造成额外伤害',
    cost: 60,
    sellValue: 30,
    type: UpgradeType.CAT,
    effect: {
      target: 'extra_damage_chance',
      value: 10
    },
    tier: 1,
    iconKey: 'upgrade_reflex_1'
  },
  
  // 灵敏反应 - 二级
  {
    id: 'quick_reflex_2',
    name: '灵敏反应 II',
    description: '20%几率猫咪卡片造成额外伤害',
    cost: 120,
    sellValue: 60,
    type: UpgradeType.CAT,
    effect: {
      target: 'extra_damage_chance',
      value: 20
    },
    tier: 2,
    iconKey: 'upgrade_reflex_2'
  },
  
  // 灵敏反应 - 三级
  {
    id: 'quick_reflex_3',
    name: '灵敏反应 III',
    description: '30%几率猫咪卡片造成额外伤害',
    cost: 180,
    sellValue: 90,
    type: UpgradeType.CAT,
    effect: {
      target: 'extra_damage_chance',
      value: 30
    },
    tier: 3,
    iconKey: 'upgrade_reflex_3'
  },
  
  // 战斗天赋 - 一级
  {
    id: 'battle_talent_1',
    name: '战斗天赋 I',
    description: '每回合首次出牌造成15%额外伤害',
    cost: 70,
    sellValue: 35,
    type: UpgradeType.CAT,
    effect: {
      target: 'first_card_bonus',
      value: 15
    },
    tier: 1,
    iconKey: 'upgrade_talent_1'
  },
  
  // 战斗天赋 - 二级
  {
    id: 'battle_talent_2',
    name: '战斗天赋 II',
    description: '每回合首次出牌造成25%额外伤害',
    cost: 140,
    sellValue: 70,
    type: UpgradeType.CAT,
    effect: {
      target: 'first_card_bonus',
      value: 25
    },
    tier: 2,
    iconKey: 'upgrade_talent_2'
  },
  
  // 战斗天赋 - 三级
  {
    id: 'battle_talent_3',
    name: '战斗天赋 III',
    description: '每回合首次出牌造成35%额外伤害',
    cost: 210,
    sellValue: 105,
    type: UpgradeType.CAT,
    effect: {
      target: 'first_card_bonus',
      value: 35
    },
    tier: 3,
    iconKey: 'upgrade_talent_3'
  },
  
  // ===== 出牌系统增益 =====
  // 额外行动 - 一级
  {
    id: 'extra_action_1',
    name: '额外行动 I',
    description: '每回合可多出1张卡片',
    cost: 100,
    sellValue: 50,
    type: UpgradeType.CARD_PLAY,
    effect: {
      target: 'cards_per_turn',
      value: 1
    },
    tier: 1,
    iconKey: 'upgrade_action_1'
  },
  
  // 连续出击 - 一级
  {
    id: 'continuous_play_1',
    name: '连续出击 I',
    description: '10%几率出牌后不消耗出牌次数',
    cost: 80,
    sellValue: 40,
    type: UpgradeType.CARD_PLAY,
    effect: {
      target: 'free_card_chance',
      value: 10
    },
    tier: 1,
    iconKey: 'upgrade_continuous_1'
  },
  
  // 战术调整 - 一级
  {
    id: 'tactical_adjust_1',
    name: '战术调整 I',
    description: '每场战斗可以额外重抽一次手牌',
    cost: 60,
    sellValue: 30,
    type: UpgradeType.CARD_PLAY,
    effect: {
      target: 'extra_redraw',
      value: 1
    },
    tier: 1,
    iconKey: 'upgrade_tactical_1'
  },
  
  // ===== 卡片系统增益 =====
  // 额外抽牌 - 一级
  {
    id: 'extra_draw_1',
    name: '额外抽牌 I',
    description: '每回合多抽1张卡',
    cost: 75,
    sellValue: 37,
    type: UpgradeType.CARD,
    effect: {
      target: 'draw_per_turn',
      value: 1
    },
    tier: 1,
    iconKey: 'upgrade_draw_1'
  },
  
  // 精选手牌 - 一级
  {
    id: 'selected_hand_1',
    name: '精选手牌 I',
    description: '每场战斗开始时可以选择更换1张初始手牌',
    cost: 65,
    sellValue: 32,
    type: UpgradeType.CARD,
    effect: {
      target: 'mulligan_count',
      value: 1
    },
    tier: 1,
    iconKey: 'upgrade_hand_1'
  },
  
  // 扩展容量 - 一级
  {
    id: 'expanded_capacity_1',
    name: '扩展容量 I',
    description: '手牌上限+1',
    cost: 70,
    sellValue: 35,
    type: UpgradeType.CARD,
    effect: {
      target: 'hand_limit',
      value: 1
    },
    tier: 1,
    iconKey: 'upgrade_capacity_1'
  },
  
  // ===== 战斗增益 =====
  // 生命源泉 - 一级
  {
    id: 'life_source_1',
    name: '生命源泉 I',
    description: '最大生命值+10',
    cost: 50,
    sellValue: 25,
    type: UpgradeType.BATTLE,
    effect: {
      target: 'max_hp',
      value: 10
    },
    tier: 1,
    iconKey: 'upgrade_life_1'
  },
  
  // 战斗激励 - 一级
  {
    id: 'battle_encouragement_1',
    name: '战斗激励 I',
    description: '连续使用同类型卡片时，效果提升10%',
    cost: 85,
    sellValue: 42,
    type: UpgradeType.BATTLE,
    effect: {
      target: 'combo_bonus',
      value: 10
    },
    tier: 1,
    iconKey: 'upgrade_encourage_1'
  },
  
  // 爆发力量 - 一级
  {
    id: 'burst_power_1',
    name: '爆发力量 I',
    description: '每场战斗的第一张攻击卡牌伤害+20%',
    cost: 90,
    sellValue: 45,
    type: UpgradeType.BATTLE,
    effect: {
      target: 'first_attack_bonus',
      value: 20
    },
    tier: 1,
    iconKey: 'upgrade_burst_1'
  }
];
