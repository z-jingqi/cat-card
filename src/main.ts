import Phaser from "phaser";
import PreloadScene from "./scenes/PreloadScene";
import MainMenuScene from "./scenes/MainMenuScene";
import BattleScene from "./scenes/BattleScene";
import ShopScene from "./scenes/ShopScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  backgroundColor: "#87CEEB",
  pixelArt: true, // 关键设置：启用像素艺术模式，防止图片模糊
  scene: [PreloadScene, MainMenuScene, BattleScene, ShopScene],
};

new Phaser.Game(config);
