import ResourceLoader from "./systems/resources";
import PhysicsController from "./systems/physics";
import CharacterController from "./systems/character";
import LevelSystem from "./systems/level";
import ScoringSystem from "./systems/scoring";
import InputHandler from "./systems/input";
import AnimationSystem from "./systems/animation";
import UIManager from "./systems/ui";
import AudioManager from "./systems/audio";

import {GAME_MODES} from "./constants/game-modes";
import {getLevelByIndex} from "./constants/levels";

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");

    // Game state
    this.gameMode = GAME_MODES.SKATE; // Default game mode
    this.isRunning = false;
    this.isPaused = false;
    this.currentLevel = 0;
    this.levelData = null;

    // Timing variables
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.fpsCounter = 0;
    this.fpsTimer = 0;
    this.fps = 0;

    // Initialize systems
    this.resources = new ResourceLoader();
    this.onLoadProgress = null;

    // Systems to be initialized after assets are loaded
    this.physics = null;
    this.character = null;
    this.level = null;
    this.scoring = null;
    this.input = null;
    this.animations = null;
    this.ui = null;
    this.audio = null;
  }

  /**
   * Load game assets
   * @returns {Promise} Promise that resolves when assets are loaded
   */
  loadAssets() {
    // Set up progress callback
    if (this.onLoadProgress) {
      this.resources.onProgress(this.onLoadProgress);
    }

    // For development, we can simulate loading to test the UI
    if (
      process.env.NODE_ENV === "development" &&
      !this.resources.get("skater")
    ) {
      return new Promise((resolve) => {
        // Simulate loading progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 0.1;
          if (this.onLoadProgress) {
            this.onLoadProgress(Math.min(progress, 1));
          }

          if (progress >= 1) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    }

    // Define assets to load
    const assets = [
      // Core assets
      {
        id: "skater",
        type: "spritesheet",
        src: "/assets/images/sprites/skater.png",
      },
      {
        id: "surfer",
        type: "spritesheet",
        src: "/assets/images/sprites/surfer.png",
      },
      // Add more assets as they become available
    ];

    // Start loading
    return this.resources.loadAll(assets);
  }

  /**
   * Initialize game systems
   */
  initialize() {
    // Get level data
    this.levelData = getLevelByIndex(this.currentLevel, this.gameMode);

    // Initialize physics system
    this.physics = new PhysicsController(this.gameMode);

    // Initialize animation system
    this.animations = new AnimationSystem(this.resources);
    this.setupAnimations();

    // Initialize character controller
    this.character = new CharacterController(
      this.physics,
      this.animations,
      this.gameMode
    );

    // Initialize level system
    this.level = new LevelSystem(this.gameMode, this.currentLevel);
    this.level.initializeLevel();

    // Initialize scoring system
    this.scoring = new ScoringSystem(this.gameMode, this.levelData);

    // Initialize input system
    this.input = new InputHandler();
    this.input.onKeyChange = this.handleInputChange.bind(this);

    // Initialize UI system
    this.ui = new UIManager(this.canvas);
    this.ui.onMenuAction = this.handleMenuAction.bind(this);
    this.ui.showTitleScreen();

    // Initialize audio system
    this.audio = new AudioManager();
    this.setupAudio();

    // Connect systems
    this.connectSystems();

    // Set up collision handlers
    this.setupCollisionHandlers();

    // Set up game state change handlers
    this.setupStateHandlers();

    // Start game loop
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));

    console.log("Game initialized and running!");
  }

  /**
   * Set up animations
   */
  setupAnimations() {
    // Skater animations
    this.animations.define("idle", "skater", [0, 1], 4, {
      frameWidth: 32,
      frameHeight: 48,
    });

    this.animations.define("move", "skater", [2, 3, 4, 5], 8, {
      frameWidth: 32,
      frameHeight: 48,
    });

    this.animations.define("jump", "skater", [6, 7], 4, {
      frameWidth: 32,
      frameHeight: 48,
    });

    this.animations.define("kickflip", "skater", [8, 9, 10, 11], 12, {
      frameWidth: 32,
      frameHeight: 48,
    });

    // Define more animations as needed
  }

  /**
   * Set up audio
   */
  setupAudio() {
    // Load sound effects
    /* Placeholder for when assets are available
    this.audio.loadSound('jump', 'assets/audio/sfx/jump.wav', 'sfx');
    this.audio.loadSound('trick', 'assets/audio/sfx/trick.wav', 'sfx');
    this.audio.loadSound('land', 'assets/audio/sfx/land.wav', 'sfx');
    this.audio.loadSound('collect', 'assets/audio/sfx/collect.wav', 'sfx');
    this.audio.loadSound('crash', 'assets/audio/sfx/crash.wav', 'sfx');
    
    // Load music
    this.audio.loadSound('title_music', 'assets/audio/music/title.mp3', 'music', { loop: true });
    this.audio.loadSound('game_music', 'assets/audio/music/game.mp3', 'music', { loop: true });
    
    // Play title music
    this.audio.playMusic('title_music');
    */
  }

  /**
   * Connect systems together
   */
  connectSystems() {
    // Connect character and scoring system
    this.character.onTrickPerformed = (trick, score, combo) => {
      this.scoring.recordTrick(trick, score);
      this.ui.showTrick(trick, score);
      //this.audio.play('trick');

      if (combo > 1) {
        this.ui.addNotification(`Combo x${combo}!`, 60);
      }
    };

    this.character.onComboEnd = (comboCount) => {
      if (comboCount > 1) {
        this.ui.addNotification(`Combo ended: ${comboCount} tricks!`, 120);
      }
    };

    // Connect level system with scoring
    this.level.onCollectibleCollected = (collectible) => {
      this.scoring.recordCollectible(collectible);
      //this.audio.play('collect');
      this.ui.addNotification(`+${collectible.value} points`, 60);
    };

    this.level.onSpecialZoneEntered = (zone) => {
      if (zone.subType === "score_multiplier") {
        this.scoring.startSpecialMode(
          zone.properties.duration,
          zone.properties.scoreMultiplier
        );
        this.ui.addNotification(
          `Score x${zone.properties.scoreMultiplier} for ${zone.properties.duration}s!`,
          120
        );
      } else if (zone.subType === "speed_boost") {
        this.physics.velocity.x *= zone.properties.velocityBoost;
        this.ui.addNotification(`Speed Boost!`, 60);
      }
    };
  }

  /**
   * Set up collision handlers
   */
  setupCollisionHandlers() {
    // These will be called during the update method
  }

  /**
   * Set up state change handlers
   */
  setupStateHandlers() {
    // Scoring system level complete handler
    this.scoring.onLevelComplete = () => {
      this.ui.showLevelComplete(
        {score: this.scoring.score},
        this.nextLevel.bind(this),
        this.restartLevel.bind(this),
        this.returnToTitle.bind(this)
      );
    };
  }

  /**
   * Game loop
   * @param {number} timestamp - Current timestamp
   */
  gameLoop(timestamp) {
    // Calculate delta time
    this.deltaTime = (timestamp - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = timestamp;

    // Cap delta time to prevent large jumps
    if (this.deltaTime > 0.1) this.deltaTime = 0.1;

    // Calculate FPS
    this.fpsCounter++;
    this.fpsTimer += this.deltaTime;
    if (this.fpsTimer >= 1) {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsTimer = 0;
    }

    // Update and render based on game state
    if (this.isRunning) {
      if (!this.isPaused) {
        this.update();
      }
      this.render();
    }

    // Continue game loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  /**
   * Update game state
   */
  update() {
    // Update input system
    this.input.update();

    // Handle UI input if not in game screen
    if (this.ui.getCurrentScreen() !== "game") {
      this.handleMenuInputs();
      this.ui.update();
      return;
    }

    // Update character physics and controls
    this.physics.update(this.deltaTime);
    this.character.update(this.deltaTime);

    // Check collisions with level
    const collisions = this.level.checkCollisions({
      x: this.physics.position.x,
      y: this.physics.position.y,
      width: this.character.getDimensions().width,
      height: this.character.getDimensions().height,
    });

    // Handle ground collision
    if (collisions.ground) {
      this.physics.handleGroundCollision(collisions.groundY);
    }

    // Handle obstacle collisions
    for (const collision of collisions.obstacles) {
      this.physics.handleObstacleCollision(
        collision.obstacle,
        collision.overlap
      );
    }

    // Update level
    this.level.update(this.physics.position.x, performance.now());

    // Update scoring system
    this.scoring.update();

    // Update animations
    this.animations.update(this.deltaTime);

    // Update UI with current game state
    this.ui.update(this.scoring.getScoreState());

    // Update audio
    //this.audio.update();
  }

  /**
   * Handle menu inputs
   */
  handleMenuInputs() {
    const currentScreen = this.ui.getCurrentScreen();

    if (currentScreen === "title") {
      if (this.input.isActionActive("jump")) {
        this.startGame(this.ui.components.modeSelector.selectedMode);
      } else if (this.input.isKeyDown("KeyS")) {
        this.ui.components.modeSelector.selectedMode = "skate";
      } else if (this.input.isKeyDown("KeyD")) {
        this.ui.components.modeSelector.selectedMode = "surf";
      }
    } else if (
      currentScreen === "pause" ||
      currentScreen === "gameover" ||
      currentScreen === "levelcomplete"
    ) {
      const actions = ["up", "down", "jump"];

      for (const action of actions) {
        if (this.input.isActionActive(action)) {
          this.ui.handleMenuInput(action);
        }
      }
    }
  }

  /**
   * Render game graphics
   */
  render() {
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // If on title screen or other UI screen, only render UI
    if (this.ui.getCurrentScreen() !== "game") {
      this.ui.render(this.context);
      return;
    }

    // Render level (background, obstacles, etc.)
    this.level.render(this.context, this.resources);

    // Render player character
    this.renderPlayer();

    // Render UI
    this.ui.render(this.context);

    // Render FPS counter (debug)
    if (process.env.NODE_ENV === "development") {
      this.context.fillStyle = "white";
      this.context.font = "12px Arial";
      this.context.textAlign = "right";
      this.context.fillText(`FPS: ${this.fps}`, this.canvas.width - 10, 20);
    }
  }

  /**
   * Render player character
   */
  renderPlayer() {
    // Calculate player screen position
    const screenX = this.physics.position.x - this.level.camera.x;
    const screenY = this.physics.position.y;

    // Draw player animation
    this.animations.draw(this.context, screenX, screenY, "character");

    // Fallback rendering if animation fails
    if (
      process.env.NODE_ENV === "development" &&
      !this.animations.isPlaying("character")
    ) {
      this.context.fillStyle = "#FF5722"; // Orange
      this.context.fillRect(
        screenX,
        screenY,
        this.character.getDimensions().width,
        this.character.getDimensions().height
      );
    }
  }

  /**
   * Handle input change
   * @param {string} action - Input action
   * @param {boolean} active - Whether action is active
   */
  handleInputChange(action, active) {
    // Skip if game is paused
    if (this.isPaused && action !== "pause") return;

    // Handle game control actions
    switch (action) {
      case "left":
      case "right":
      case "up":
      case "down":
      case "jump":
      case "trick1":
      case "trick2":
      case "trick3":
        // Pass input to character controller
        this.character.setKey(action, active);
        break;
      case "pause":
        if (active) this.togglePause();
        break;
      case "menu":
        if (active) this.showMenu();
        break;
    }
  }

  /**
   * Handle menu action
   * @param {string} action - Menu action
   * @param {Object} data - Action data
   */
  handleMenuAction(action, data) {
    switch (action) {
      case "start":
        this.startGame(data.mode);
        break;
      case "resume":
        this.resumeGame();
        break;
      case "restart":
        this.restartLevel();
        break;
      case "quit":
        this.returnToTitle();
        break;
      case "next":
        this.nextLevel();
        break;
    }
  }

  /**
   * Start game
   * @param {string} mode - Game mode
   */
  startGame(mode) {
    this.gameMode = mode;
    this.currentLevel = 0;

    // Reload level data
    this.levelData = getLevelByIndex(this.currentLevel, this.gameMode);

    // Reset game systems
    this.resetGameSystems();

    // Show game UI
    this.ui.showGameHUD();

    // Unpause game
    this.isPaused = false;

    // Switch music
    //this.audio.stopMusic(true);
    //this.audio.playMusic('game_music', true);
  }

  /**
   * Reset game systems
   */
  resetGameSystems() {
    // Reset physics
    this.physics = new PhysicsController(this.gameMode);

    // Reset character controller
    this.character = new CharacterController(
      this.physics,
      this.animations,
      this.gameMode
    );

    // Reset level
    this.level = new LevelSystem(this.gameMode, this.currentLevel);
    this.level.initializeLevel();

    // Reset scoring
    this.scoring = new ScoringSystem(this.gameMode, this.levelData);

    // Reconnect systems
    this.connectSystems();

    // Reset input
    this.input.resetAllInputs();
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.ui.getCurrentScreen() !== "game") return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.ui.showPauseMenu(
        this.resumeGame.bind(this),
        this.restartLevel.bind(this),
        this.returnToTitle.bind(this)
      );

      //this.audio.pauseMusic();
    } else {
      this.ui.showGameHUD();

      //this.audio.resumeMusic();
    }
  }

  /**
   * Resume game
   */
  resumeGame() {
    this.isPaused = false;
    this.ui.showGameHUD();

    //this.audio.resumeMusic();
  }

  /**
   * Show menu
   */
  showMenu() {
    if (this.ui.getCurrentScreen() === "game") {
      this.togglePause();
    }
  }

  /**
   * Restart current level
   */
  restartLevel() {
    this.resetGameSystems();
    this.ui.showGameHUD();
    this.isPaused = false;
  }

  /**
   * Go to next level
   */
  nextLevel() {
    this.currentLevel++;

    // Reload level data
    this.levelData = getLevelByIndex(this.currentLevel, this.gameMode);

    // Reset game systems
    this.resetGameSystems();

    // Show game UI
    this.ui.showGameHUD();

    // Unpause game
    this.isPaused = false;
  }

  /**
   * Return to title screen
   */
  returnToTitle() {
    //this.audio.stopMusic(true);
    //this.audio.playMusic('title_music', true);

    this.ui.showTitleScreen();
    this.isPaused = false;
  }

  /**
   * Handle window resize
   * @param {number} width - New width
   * @param {number} height - New height
   */
  handleResize(width, height) {
    if (this.ui) {
      this.ui.handleResize(width, height);
    }
  }

  /**
   * Pause game
   */
  pause() {
    if (!this.isPaused) {
      this.togglePause();
    }
  }

  /**
   * Resume game
   */
  resume() {
    if (this.isPaused) {
      this.togglePause();
    }
  }
}
