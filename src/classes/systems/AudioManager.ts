import Phaser from 'phaser';

/**
 * 音效管理器
 * 管理游戏中的所有音效和背景音乐
 */
export class AudioManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private isMuted: boolean = false;
  
  // 音效配置
  private soundConfig = {
    music: {
      battle: { key: 'battle_music', loop: true },
      shop: { key: 'shop_music', loop: true }
    },
    sfx: {
      cardSelect: { key: 'card_select' },
      cardPlay: { key: 'card_play' },
      cardDraw: { key: 'card_draw' },
      attack: { key: 'attack' },
      specialAttack: { key: 'special_attack' },
      bossDamage: { key: 'boss_damage' },
      bossDefeat: { key: 'boss_defeat' },
      buttonClick: { key: 'button_click' },
      purchase: { key: 'purchase' },
      catnipGain: { key: 'catnip_gain' },
      catnipSpend: { key: 'catnip_spend' },
      victory: { key: 'victory' },
      defeat: { key: 'defeat' },
      cardSort: { key: 'card_sort' }
    }
  };
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  /**
   * 预加载所有音效
   */
  public preload(): void {
    try {
      // 加载背景音乐
      this.scene.load.audio(
        this.soundConfig.music.battle.key, 
        'assets/audio/music/battle_music.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.music.shop.key, 
        'assets/audio/music/shop_music.mp3'
      );
      
      // 加载音效
      this.scene.load.audio(
        this.soundConfig.sfx.cardSelect.key, 
        'assets/audio/sfx/card_select.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.cardPlay.key, 
        'assets/audio/sfx/card_play.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.cardDraw.key, 
        'assets/audio/sfx/card_draw.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.attack.key, 
        'assets/audio/sfx/attack.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.specialAttack.key, 
        'assets/audio/sfx/special_attack.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.bossDamage.key, 
        'assets/audio/sfx/boss_damage.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.bossDefeat.key, 
        'assets/audio/sfx/boss_defeat.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.buttonClick.key, 
        'assets/audio/sfx/button_click.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.purchase.key, 
        'assets/audio/sfx/purchase.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.catnipGain.key, 
        'assets/audio/sfx/catnip_gain.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.catnipSpend.key, 
        'assets/audio/sfx/catnip_spend.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.victory.key, 
        'assets/audio/sfx/victory.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.defeat.key, 
        'assets/audio/sfx/defeat.mp3'
      );
      this.scene.load.audio(
        this.soundConfig.sfx.cardSort.key, 
        'assets/audio/sfx/card_sort.mp3'
      );
    } catch (error) {
      console.warn('音频资源加载失败，游戏将在无声模式下运行:', error);
    }
  }
  
  /**
   * 初始化音效管理器
   */
  public init(): void {
    try {
      // 初始化所有音效
      Object.values(this.soundConfig.music).forEach(config => {
        try {
          const sound = this.scene.sound.add(config.key, {
            volume: this.musicVolume,
            loop: config.loop
          });
          this.sounds.set(config.key, sound);
        } catch (error) {
          console.warn(`无法加载音乐: ${config.key}`, error);
        }
      });
      
      Object.values(this.soundConfig.sfx).forEach(config => {
        try {
          const sound = this.scene.sound.add(config.key, {
            volume: this.sfxVolume,
            loop: false
          });
          this.sounds.set(config.key, sound);
        } catch (error) {
          console.warn(`无法加载音效: ${config.key}`, error);
        }
      });
    } catch (error) {
      console.warn('音效系统初始化失败:', error);
    }
  }
  
  /**
   * 播放背景音乐
   */
  public playMusic(key: string): void {
    if (this.isMuted) return;
    
    try {
      // 停止所有其他音乐
      Object.values(this.soundConfig.music).forEach(config => {
        try {
          const sound = this.sounds.get(config.key);
          if (sound && sound.isPlaying && config.key !== key) {
            sound.stop();
          }
        } catch (error) {
          console.warn(`停止音乐失败: ${config.key}`, error);
        }
      });
      
      // 播放指定音乐
      const music = this.sounds.get(key);
      if (music && !music.isPlaying) {
        music.play();
      } else if (!music) {
        console.warn(`音乐资源不存在: ${key}`);
      }
    } catch (error) {
      console.warn(`播放音乐失败: ${key}`, error);
    }
  }
  
  /**
   * 播放音效
   */
  public playSfx(key: string): void {
    if (this.isMuted) return;
    
    try {
      const sfx = this.sounds.get(key);
      if (sfx) {
        sfx.play();
      } else {
        console.warn(`音效资源不存在: ${key}`);
      }
    } catch (error) {
      console.warn(`播放音效失败: ${key}`, error);
    }
  }
  
  /**
   * 停止所有声音
   */
  public stopAll(): void {
    this.sounds.forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
    });
  }
  
  /**
   * 设置音乐音量
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    
    Object.values(this.soundConfig.music).forEach(config => {
      const sound = this.sounds.get(config.key);
      if (sound) {
        (sound as any).setVolume(this.musicVolume);
      }
    });
  }
  
  /**
   * 设置音效音量
   */
  public setSfxVolume(volume: number): void {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    
    Object.values(this.soundConfig.sfx).forEach(config => {
      const sound = this.sounds.get(config.key);
      if (sound) {
        (sound as any).setVolume(this.sfxVolume);
      }
    });
  }
  
  /**
   * 静音/取消静音
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.scene.sound.mute = true;
    } else {
      this.scene.sound.mute = false;
    }
    
    return this.isMuted;
  }
  
  /**
   * 获取音乐音量
   */
  public getMusicVolume(): number {
    return this.musicVolume;
  }
  
  /**
   * 获取音效音量
   */
  public getSfxVolume(): number {
    return this.sfxVolume;
  }
  
  /**
   * 获取是否静音
   */
  public isMutedState(): boolean {
    return this.isMuted;
  }
  
  /**
   * 销毁音效管理器
   */
  public destroy(): void {
    this.stopAll();
    this.sounds.clear();
  }
}
