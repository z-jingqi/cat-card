# Cat Puzzle - Development Roadmap

This document outlines the development tasks for the Cat Puzzle game, broken down into phased milestones. This approach allows us to build the game iteratively, focusing on a solid foundation before expanding on content and polish.

---

## Phase 1: Core Mechanics & Foundation (The "Gray Box" Prototype)

**Goal:** A playable vertical slice with basic gameplay. All assets will be placeholder primitives (squares, circles). We will focus entirely on pure mechanics.

### 1.1: Project & Core Systems Setup
- [ ] [Code] Initialize project directory structure as defined in `architecture.md`.
- [ ] [Code] Implement `EventManager.ts`: A simple, global event bus for decoupled communication.
- [ ] [Code] Implement `GameManager.ts`:
    - [ ] [Code] Basic game state machine (e.g., `Playing`, `Paused`, `GameOver`).
    - [ ] [Code] Manages core gameplay values: `score`, `chaosValue`, `experience`.
- [ ] [Code] Implement `ObjectPool.ts` for recycling game objects.

### 1.2: Player Board Implementation
- [ ] [Editor] Create a `Board` Prefab with a primitive sprite and a collider.
- [ ] [Code] Create `PlayerCtrl.ts` to handle keyboard and/or touch input for horizontal movement.
- [ ] [Code] Create `Board.ts` to hold basic stats (e.g., `moveSpeed`).
- [ ] [Code & Editor] Create an `Interactor` component and attach it to the Board (`type: BOARD`).

### 1.3: Basic Item & Spawning
- [ ] [Editor] Create a basic `Item` Prefab with a primitive sprite and a collider.
- [ ] [Code] Create `data/ItemBlueprints.ts` and define one simple "apple" blueprint.
- [ ] [Code] Create `ItemSpawner.ts`:
    - [ ] [Code] Uses the `ObjectPool` to get/release items.
    - [ ] [Code] Spawns a single item type from the top of the screen at a regular interval.
- [ ] [Code] Create `behaviors/trajectories/VerticalTrajectory.ts`.
- [ ] [Code & Editor] Create `entities/Item.ts` and attach it to the Item prefab:
    - [ ] [Code] Implements `IInteractable`.
    - [ ] [Code] Hosts and calls the `update` method of its behavior components.

### 1.4: Core Gameplay Loop
- [ ] [Editor] Set up physics collision groups for `Board` and `Item`.
- [ ] [Code] Implement the `onInteract` method in `Item.ts`:
    - [ ] When it collides with an `Interactor` of type `BOARD`, it fires an `ITEM_CAUGHT` event via the `EventManager` and returns itself to the object pool.
- [ ] [Editor] Create a `Floor` trigger at the bottom of the screen.
    - [ ] [Code] When an item collides with the floor, it fires an `ITEM_MISSED` event and is returned to the pool.
- [ ] [Code] `GameManager` listens for events:
    - [ ] On `ITEM_CAUGHT`, increase score and experience.
    - [ ] On `ITEM_MISSED`, increase `chaosValue`.
    - [ ] Check if `chaosValue` has reached the maximum, and if so, change game state to `GameOver`.

### 1.5: Basic UI
- [ ] [Code] Create `UIManager.ts` to manage UI updates.
- [ ] [Editor] Create a basic in-game HUD to display `Score` and `Chaos Value`.
- [ ] [Code] `UIManager` listens for events from `GameManager` (or polls its state) to update the display.

---

## Phase 2: The Roguelite Core Loop

**Goal:** Implement the systems for in-run upgrades (buffs) and between-run progression (meta).

### 2.1: In-Run Buff System
- [ ] [Code] `GameManager` checks `experience` after each gain and fires `EXP_FULL` event when a threshold is met.
- [ ] [Code] Create `data/BuffLibrary.ts` with definitions for 3-5 simple, stat-based buffs.
- [ ] [Code] Create `buffs/BuffManager.ts` that listens for `EXP_FULL`.
- [ ] [Code] When triggered, `BuffManager` should:
    - [ ] Pause the game (`GameManager.state = Paused`).
    - [ ] Select 3 random, unique buffs from the `BuffLibrary`.
    - [ ] Fire a `SHOW_BUFF_SELECTION` event with the buff data.
- [ ] [Code & Editor] `UIManager` listens for `SHOW_BUFF_SELECTION` and displays a simple UI panel with 3 buttons.
- [ ] [Code] When a buff is chosen, `UIManager` fires a `BUFF_SELECTED` event.
- [ ] [Code] `BuffManager` listens for `BUFF_SELECTED`, applies the buff's effect, and unpauses the game.

### 2.2: Stat & Modifier System
- [ ] [Code] Create `entities/StatSheet.ts` component.
- [ ] [Code] Refactor `Board.ts` to use a `StatSheet` for its stats (`moveSpeed`, etc.).
- [ ] [Code] Refactor `BuffManager` to apply `Modifiers` to the `Board`'s `StatSheet` upon buff selection, instead of directly changing values. The effect should be immediate.

### 2.3: Meta-Progression
- [ ] [Code] On `GameOver`, `GameManager` calculates and awards `gold`.
- [ ] [Code] Create `data/PlayerData.ts` to define the structure for saved data (e.g., `totalGold`, `permanentUpgrades`).
- [ ] [Code] Create `core/DataManager.ts` to save and load the `PlayerData` object to/from `sys.localStorage`.
- [ ] [Editor] Create a simple "Main Menu" scene.
- [ ] [Code & Editor] Create a basic "Store" UI in the menu to spend gold on permanent upgrades (e.g., permanent +5% base move speed).
- [ ] [Code] At the start of a run, `GameManager` loads permanent upgrades from `DataManager` and applies them as initial `Modifiers` to the player's `StatSheet`.

---

## Phase 3: Content Expansion

**Goal:** Add variety to items, behaviors, and buffs to increase replayability.

### 3.1: Expand Item Behaviors & Blueprints
- [ ] [Code] Implement more `Trajectory` components (e.g., `FeatherTrajectory`, `SineWaveTrajectory`).
- [ ] [Code] Implement `Self-Motion` components (e.g., `SpinMotion`, `PulseMotion`).
- [ ] [Code] Add new stat types to the `StatSheet` to support these new behaviors (e.g., `horizontalAmplitude`, `rotationSpeed`).
- [ ] [Code] Create at least 5-10 new, unique item blueprints in `ItemBlueprints.ts` by combining different behaviors and stats.

### 3.2: Enhance Spawning & Difficulty
- [ ] [Code] Update `ItemSpawner` to spawn a variety of items from the blueprints.
- [ ] [Code] Implement difficulty scaling in `GameManager`: as time progresses, `ItemSpawner` should be told to spawn items faster and/or spawn more difficult item types.
- [ ] [Code] Centralize difficulty variables in `data/GameConfig.ts`.

### 3.3: Expand Buff Library
- [ ] [Code] Add at least 10 more buffs to `BuffLibrary.ts`.
- [ ] [Code] Implement `GlobalModifierManager` to hold modifiers that affect all items.
- [ ] [Code] Create buffs that add modifiers to `GlobalModifierManager` (e.g., "all items fall 10% slower").
- [ ] [Code] `ItemSpawner` must read from `GlobalModifierManager` and apply these global modifiers to each new item it assembles.
- [ ] [Code] Create buffs that grant new abilities (e.g., a passive item attraction aura). This will involve creating new "ability" components.

### 3.4: (Optional) Prepare for Shooting Mode
- [ ] [Code] Implement `PlayerCtrl` ability to shoot (e.g., on spacebar press).
- [ ] [Editor] Create a `Bullet` prefab with an `Interactor` of type `BULLET`.
- [ ] [Code] Create 1-2 new item blueprints with `interaction.type: "SHOOT"`.
- [ ] [Code] Update `Item.onInteract` to handle being hit by a `BULLET` (e.g., take damage, check for destruction).

---

## Phase 4: Polishing, Juice & Finalization

**Goal:** Transform the functional prototype into a visually and audibly appealing game.

### 4.1: Art & Visuals
- [ ] [Editor] Create final sprite art for all items, the player board, and the background. Replace all placeholders.
- [ ] [Editor] Add visual effects (VFX) for key game events:
    - [ ] Item caught / missed / destroyed.
    - [ ] Player level-up.
    - [ ] Buff selection confirmation.
    - [ ] UI feedback (button clicks).

### 4.2: UI/UX Overhaul
- [ ] [Editor] Design and implement a polished Main Menu, including the Store.
- [ ] [Editor] Design and implement a polished in-game HUD.
- [ ] [Editor] Design and implement a polished Buff Selection screen, including icons and clear descriptions.
- [ ] [Editor] Design and implement a polished Game Over screen summarizing the run's performance.
- [ ] [Editor] Add smooth scene transitions.

### 4.3: Audio
- [ ] [Code] Implement `SoundManager.ts`.
- [ ] [Editor] Integrate background music (BGM) for the menu and gameplay.
- [ ] [Editor] Integrate sound effects (SFX) for all significant events (catching items, UI clicks, game over, etc.).
- [ ] [Code & Editor] Ensure all audio assets are properly licensed and credited if necessary.

### 4.4: Final Touches
- [ ] [Editor] Add a simple tutorial or "How to Play" screen.
- [ ] [Code & Editor] Conduct extensive playtesting to fine-tune game balance (scoring, difficulty, buff effectiveness).
- [ ] [Code] Perform final bug-fixing and optimization passes.
- [ ] [Code] Prepare builds for the target platform(s).
