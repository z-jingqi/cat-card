import { _decorator, Component, director, game } from "cc";
import { Modifier } from "./stats/Modifier";
import { Stat } from "./stats/Stat";

const { ccclass, property } = _decorator;

interface TimedModifier {
  stat: Stat;
  modifier: Modifier;
}

@ccclass("StatManager")
export class StatManager extends Component {
  private static _instance: StatManager;

  private _timedModifiers: TimedModifier[] = [];

  public static get instance(): StatManager {
    if (!StatManager._instance) {
      // This assumes a StatManager node exists in the scene.
      // A more robust solution might create it dynamically.
      StatManager._instance = director
        .getScene()
        .getComponentInChildren(StatManager);
    }
    return StatManager._instance;
  }

  onLoad() {
    if (StatManager._instance && StatManager._instance !== this) {
      this.destroy();
      return;
    }
    StatManager._instance = this;
    director.addPersistRootNode(this.node);
  }

  public addTimedModifier(stat: Stat, modifier: Modifier) {
    if (modifier.duration <= 0) {
      stat.addModifier(modifier);
      return;
    }

    modifier.endTime = game.totalTime / 1000 + modifier.duration;
    stat.addModifier(modifier);
    this._timedModifiers.push({ stat, modifier });
  }

  update(dt: number) {
    if (this._timedModifiers.length === 0) {
      return;
    }

    const currentTime = game.totalTime / 1000;
    const expiredModifiers: TimedModifier[] = [];

    for (const timedMod of this._timedModifiers) {
      if (currentTime >= timedMod.modifier.endTime) {
        expiredModifiers.push(timedMod);
      }
    }

    if (expiredModifiers.length > 0) {
      for (const expired of expiredModifiers) {
        expired.stat.removeModifier(expired.modifier);
      }

      this._timedModifiers = this._timedModifiers.filter(
        (tm) =>
          !expiredModifiers.some((em) => em.modifier.id === tm.modifier.id)
      );
    }
  }
}
