import { BossConfig } from '../classes/boss/Boss';

/**
 * BOSS配置
 */
export const BOSSES: BossConfig[] = [
  // 训练假人（教程BOSS）
  {
    id: 'training_dummy',
    name: '训练假人',
    hp: 100,
    spriteKey: 'boss_dummy'
  },
  
  // 愤怒的狗狗
  {
    id: 'angry_dog',
    name: '愤怒的狗狗',
    hp: 150,
    spriteKey: 'boss_dog'
  },
  
  // 机械老鼠
  {
    id: 'mechanic_rat',
    name: '机械老鼠',
    hp: 200,
    spriteKey: 'boss_rat'
  },
  
  // 黑暗猫头鹰
  {
    id: 'dark_owl',
    name: '黑暗猫头鹰',
    hp: 250,
    spriteKey: 'boss_owl'
  },
  
  // 终极BOSS：喵星王
  {
    id: 'cat_king',
    name: '喵星王',
    hp: 300,
    spriteKey: 'boss_cat_king'
  }
];
