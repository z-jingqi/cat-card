import { _decorator, Component, Node, Button, director, Label } from 'cc';
import { DataManager } from './DataManager';
import { PermanentUpgrades } from '../data/PermanentUpgrades';
import { PlayerData } from '../data/PlayerData';

const { ccclass, property } = _decorator;

@ccclass('MenuManager')
export class MenuManager extends Component {

    @property(Button)
    public startButton: Button = null;

    @property(Label)
    public goldLabel: Label = null;

    // --- Upgrade UI ---
    @property(Label)
    public speedUpgradeLevelLabel: Label = null;

    @property(Button)
    public speedUpgradeBuyButton: Button = null;
    
    @property(Button)
    public addGoldButton: Button = null; // For debug purposes

    private _speedUpgradeCostLabel: Label = null;
    // --------------------

    onLoad() {
        if (this.startButton) {
            this.startButton.node.on('click', this.onStartGame, this);
        } else {
            console.error("StartButton is not assigned in the MenuManager inspector!");
        }

        if (this.speedUpgradeBuyButton) {
            this._speedUpgradeCostLabel = this.speedUpgradeBuyButton.getComponentInChildren(Label);
            this.speedUpgradeBuyButton.node.on('click', this.onBuySpeedUpgrade, this);
        }

        if (this.addGoldButton) {
            this.addGoldButton.node.on('click', this.onAddGold, this);
        }

        this.updateGoldDisplay();
        this.setupSpeedUpgradeUI();
    }

    onDestroy() {
        if (this.startButton) {
            this.startButton.node.off('click', this.onStartGame, this);
        }
        if (this.speedUpgradeBuyButton) {
            this.speedUpgradeBuyButton.node.off('click', this.onBuySpeedUpgrade, this);
        }
    }

    private onAddGold() {
        const dataManager = DataManager.instance;
        dataManager.data.totalGold += 500;
        dataManager.save();
        
        // Refresh all relevant UI
        this.updateGoldDisplay();
        this.setupSpeedUpgradeUI();
        console.log(`Added 500 gold. Total gold is now: ${dataManager.data.totalGold}`);
    }

    private updateGoldDisplay() {
        if (this.goldLabel) {
            this.goldLabel.string = `Gold: ${DataManager.instance.data.totalGold}`;
        }
    }

    private setupSpeedUpgradeUI() {
        const upgradeId = 'BASE_MOVE_SPEED';
        const blueprint = PermanentUpgrades[upgradeId];
        if (!blueprint) return;

        const savedUpgrades = DataManager.instance.data.permanentUpgrades;
        const currentLevel = savedUpgrades[upgradeId] ? savedUpgrades[upgradeId].level : 0;

        if (this.speedUpgradeLevelLabel) {
            this.speedUpgradeLevelLabel.string = `Lvl: ${currentLevel} / ${blueprint.maxLevel}`;
        }

        if (this._speedUpgradeCostLabel) {
            if (currentLevel >= blueprint.maxLevel) {
                this._speedUpgradeCostLabel.string = "MAX";
                this.speedUpgradeBuyButton.interactable = false;
            } else {
                const cost = blueprint.getCost(currentLevel + 1);
                this._speedUpgradeCostLabel.string = `Cost: ${cost}`;
                this.speedUpgradeBuyButton.interactable = DataManager.instance.data.totalGold >= cost;
            }
        }
    }

    private onBuySpeedUpgrade() {
        const upgradeId = 'BASE_MOVE_SPEED';
        const blueprint = PermanentUpgrades[upgradeId];
        const dataManager = DataManager.instance;
        const savedUpgrades = dataManager.data.permanentUpgrades;
        
        const currentLevel = savedUpgrades[upgradeId] ? savedUpgrades[upgradeId].level : 0;

        if (currentLevel >= blueprint.maxLevel) {
            console.log("Upgrade is already at max level.");
            return;
        }

        const cost = blueprint.getCost(currentLevel + 1);
        if (dataManager.data.totalGold < cost) {
            console.log("Not enough gold to purchase upgrade.");
            return;
        }

        // Deduct cost and increase level
        dataManager.data.totalGold -= cost;
        if (savedUpgrades[upgradeId]) {
            savedUpgrades[upgradeId].level++;
        } else {
            savedUpgrades[upgradeId] = { id: upgradeId, level: 1 };
        }

        // Save data and refresh UI
        dataManager.save();
        this.updateGoldDisplay();
        this.setupSpeedUpgradeUI();
        console.log(`Successfully purchased ${blueprint.name}. New level: ${savedUpgrades[upgradeId].level}`);
    }

    private onStartGame() {
        director.loadScene('game');
    }
}
