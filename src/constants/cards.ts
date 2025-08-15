import { CatBreed, SpecialAbilityType, CatItemType, SupportEffectType } from './types';
import { CatCardConfig } from '../classes/cards/CatCard';
import { SupportCardConfig } from '../classes/cards/SupportCard';

/**
 * 猫咪卡片配置
 */
export const CAT_CARDS: CatCardConfig[] = [
  // 缅因猫
  {
    id: 'maine_coon_1',
    name: '威武缅因',
    description: '强壮的缅因猫，能够发动连续攻击',
    spriteKey: 'cat_maine_coon',
    breed: CatBreed.MAINE_COON,
    attack: 18,
    specialAbility: {
      type: SpecialAbilityType.DOUBLE_ATTACK,
      value: 50 // 每次攻击造成50%伤害
    }
  },
  
  // 暹罗猫
  {
    id: 'siamese_1',
    name: '高贵暹罗',
    description: '优雅的暹罗猫，能释放魔法飓风',
    spriteKey: 'cat_siamese',
    breed: CatBreed.SIAMESE,
    attack: 14,
    specialAbility: {
      type: SpecialAbilityType.MAGIC_WIND,
      value: 5 // 额外造成5点固定伤害
    }
  },
  
  // 孟加拉猫
  {
    id: 'bengal_1',
    name: '敏捷孟加拉',
    description: '敏捷的孟加拉猫，擅长发动致命一击',
    spriteKey: 'cat_bengal',
    breed: CatBreed.BENGAL,
    attack: 15,
    specialAbility: {
      type: SpecialAbilityType.CRITICAL_HIT,
      value: 30 // 30%几率造成双倍伤害
    }
  },
  
  // 布偶猫
  {
    id: 'ragdoll_1',
    name: '温柔布偶',
    description: '友善的布偶猫，能够增强同伴的力量',
    spriteKey: 'cat_ragdoll',
    breed: CatBreed.RAGDOLL,
    attack: 12,
    specialAbility: {
      type: SpecialAbilityType.GROUP_BUFF,
      value: 3 // 其他猫咪卡片攻击+3
    }
  },
  
  // 美国短毛猫
  {
    id: 'american_1',
    name: '强力短毛',
    description: '强壮的美国短毛猫，攻击能穿透敌人防御',
    spriteKey: 'cat_american',
    breed: CatBreed.AMERICAN_SHORTHAIR,
    attack: 16,
    specialAbility: {
      type: SpecialAbilityType.PIERCE,
      value: 100 // 100%穿透防御
    }
  }
];

/**
 * 辅助卡片配置
 */
export const SUPPORT_CARDS: SupportCardConfig[] = [
  // 猫薄荷精华
  {
    id: 'catnip_1',
    name: '猫薄荷精华',
    description: '用猫薄荷提炼的精华，能临时提升猫咪的攻击力',
    spriteKey: 'item_catnip',
    itemType: CatItemType.CATNIP,
    effect: SupportEffectType.DAMAGE_BOOST,
    value: 5 // 伤害+5
  },
  
  // 猫抓板
  {
    id: 'scratch_post_1',
    name: '猫抓板',
    description: '让猫咪磨爪子的板子，可以激发猫咪的潜能',
    spriteKey: 'item_scratch_post',
    itemType: CatItemType.SCRATCH_POST,
    effect: SupportEffectType.ABILITY_REPEAT,
    value: 1 // 能力重复触发1次
  },
  
  // 逗猫棒
  {
    id: 'cat_toy_1',
    name: '逗猫棒',
    description: '能吸引猫咪注意的玩具，可以刺激猫咪多行动一次',
    spriteKey: 'item_cat_toy',
    itemType: CatItemType.CAT_TOY,
    effect: SupportEffectType.EXTRA_PLAY,
    value: 1 // 额外行动1次
  },
  
  // 猫铃铛
  {
    id: 'bell_1',
    name: '猫铃铛',
    description: '清脆的铃铛声能够吸引更多猫咪加入战斗',
    spriteKey: 'item_bell',
    itemType: CatItemType.BELL,
    effect: SupportEffectType.DRAW_CARDS,
    value: 2 // 抽取2张卡
  },
  
  // 纸箱
  {
    id: 'box_1',
    name: '纸箱',
    description: '猫咪追逐纸箱会变得更加敏捷，提高暴击几率',
    spriteKey: 'item_box',
    itemType: CatItemType.BOX,
    effect: SupportEffectType.CRITICAL_CHANCE,
    value: 20 // 20%暴击几率
  }
];
