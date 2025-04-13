/**
 * UI Manager
 * Handles game UI elements, menus, HUD, etc.
 */

export default class UIManager {
  /**
   * Create a UI manager
   * @param {HTMLCanvasElement} canvas - Game canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");

    // UI state
    this.currentScreen = "title"; // Start at title screen
    this.fadeAlpha = 0;
    this.fadeDirection = "none"; // 'in', 'out', 'none'
    this.fadeCallback = null;

    // Score display
    this.score = 0;
    this.multiplier = 1;
    this.comboCounter = 0;

    // Trick display
    this.currentTrick = null;
    this.trickTimer = 0;

    // Message display
    this.message = null;
    this.messageTimer = 0;

    // Popup notifications
    this.notifications = [];

    // UI components
    this.components = {
      modeSelector: {
        selectedMode: "skate", // Default to skate mode
        visible: true
      }
    };

    // Events
    this.onMenuAction = null;
    this.onModeSelect = null;
  }

  /**
   * Update UI state
   * @param {Object} gameState - Current game state
   */
  update(gameState) {
    // Update score display
    if (gameState && gameState.score !== undefined) {
      this.score = gameState.score;
    }

    if (gameState && gameState.multiplier !== undefined) {
      this.multiplier = gameState.multiplier;
    }

    if (gameState && gameState.combo && gameState.combo.length !== undefined) {
      this.comboCounter = gameState.combo.length;
    }

    // Update trick display
    if (this.trickTimer > 0) {
      this.trickTimer--;
      if (this.trickTimer <= 0) {
        this.currentTrick = null;
      }
    }

    // Update message display
    if (this.messageTimer > 0) {
      this.messageTimer--;
      if (this.messageTimer <= 0) {
        this.message = null;
      }
    }

    // Update notifications
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      this.notifications[i].timer--;

      if (this.notifications[i].timer <= 0) {
        this.notifications.splice(i, 1);
      }
    }

    // Update fade effect
    if (this.fadeDirection === "in") {
      this.fadeAlpha += 0.05;
      if (this.fadeAlpha >= 1) {
        this.fadeAlpha = 1;
        this.fadeDirection = "none";
        if (this.fadeCallback) {
          this.fadeCallback();
          this.fadeCallback = null;
        }
      }
    } else if (this.fadeDirection === "out") {
      this.fadeAlpha -= 0.05;
      if (this.fadeAlpha <= 0) {
        this.fadeAlpha = 0;
        this.fadeDirection = "none";
        if (this.fadeCallback) {
          this.fadeCallback();
          this.fadeCallback = null;
        }
      }
    }

    // Update UI components
    for (const id in this.components) {
      if (this.components[id].update) {
        this.components[id].update(gameState);
      }
    }
  }

  /**
   * Render UI
   * @param {CanvasRenderingContext2D} context - Canvas context
   */
  render(context) {
    // Use provided context or default to canvas context
    context = context || this.context;

    // Render based on current screen
    switch (this.currentScreen) {
      case "title":
        this.renderTitleScreen(context);
        break;
      case "game":
        this.renderGameHUD(context);
        break;
      case "pause":
        this.renderPauseMenu(context);
        break;
      case "gameover":
        this.renderGameOver(context);
        break;
      case "levelcomplete":
        this.renderLevelComplete(context);
        break;
    }

    // Render notifications
    this.renderNotifications(context);

    // Render fade effect
    if (this.fadeAlpha > 0) {
      context.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Render title screen
   * @param {CanvasRenderingContext2D} context - Canvas context
   */
  renderTitleScreen(context) {
    // Background
    context.fillStyle = "#000000"; // Black background
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Title
    context.fillStyle = "#ffffff";
    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.fillText(
      "SIDEWAVE RIDER",
      this.canvas.width / 2,
      this.canvas.height / 3
    );

    // Subtitle
    context.font = "24px Arial";
    context.fillText(
      "Press SPACE to start",
      this.canvas.width / 2,
      this.canvas.height / 2
    );

    // Mode selection
    context.font = "20px Arial";
    context.fillText(
      "Select Mode:",
      this.canvas.width / 2,
      this.canvas.height * 0.6
    );

    // Skate mode
    context.fillStyle =
      this.components.modeSelector?.selectedMode === "skate"
        ? "#4CAF50"
        : "#ffffff";
    context.fillText(
      "SKATE (S)",
      this.canvas.width / 2 - 100,
      this.canvas.height * 0.65
    );

    // Surf mode
    context.fillStyle =
      this.components.modeSelector?.selectedMode === "surf"
        ? "#4682B4"
        : "white";
    context.fillText(
      "SURF (D)",
      this.canvas.width / 2 + 100,
      this.canvas.height * 0.65
    );
  }

  /**
   * Render game HUD
   * @param {CanvasRenderingContext2D} context - Canvas context
   */
  renderGameHUD(context) {
    // Score display
    context.fillStyle = "white";
    context.font = "bold 32px Arial";
    context.textAlign = "left";
    context.fillText(`${this.score}`, 20, 40);

    // Multiplier display (if > 1)
    if (this.multiplier > 1) {
      context.font = "20px Arial";
      context.fillText(`x${this.multiplier.toFixed(1)}`, 20, 70);
    }

    // Combo counter (if in combo)
    if (this.comboCounter > 1) {
      context.font = "bold 24px Arial";
      context.fillText(`Combo: ${this.comboCounter}`, 20, 100);
    }

    // Current trick display
    if (this.currentTrick) {
      context.font = "bold 28px Arial";
      context.textAlign = "center";
      context.fillText(this.currentTrick.name, this.canvas.width / 2, 50);

      // Trick score
      context.font = "24px Arial";
      context.fillText(
        `+${this.currentTrick.score}`,
        this.canvas.width / 2,
        80
      );
    }

    // Message display
    if (this.message) {
      context.font = "bold 32px Arial";
      context.textAlign = "center";
      context.fillStyle = this.message.color || "white";
      context.fillText(
        this.message.text,
        this.canvas.width / 2,
        this.canvas.height / 2
      );
    }

    // Render any additional UI components
    for (const id in this.components) {
      if (this.components[id].visible && this.components[id].render) {
        this.components[id].render(context);
      }
    }
  }

  /**
   * Render pause menu
   * @param {CanvasRenderingContext2D} context - Canvas context
   */
  renderPauseMenu(context) {
    // Semi-transparent background
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Pause title
    context.fillStyle = "white";
    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 3);

    // Menu options
    context.font = "24px Arial";

    // Resume option
    context.fillStyle =
      this.components.pauseMenu?.selectedOption === 0 ? "#4CAF50" : "white";
    context.fillText("Resume", this.canvas.width / 2, this.canvas.height / 2);

    // Restart option
    context.fillStyle =
      this.components.pauseMenu?.selectedOption === 1 ? "#4CAF50" : "white";
    context.fillText(
      "Restart",
      this.canvas.width / 2,
      this.canvas.height / 2 + 40
    );

    // Quit option
    context.fillStyle =
      this.components.pauseMenu?.selectedOption === 2 ? "#4CAF50" : "white";
    context.fillText(
      "Quit",
      this.canvas.width / 2,
      this.canvas.height / 2 + 80
    );

    // Instructions
    context.fillStyle = "white";
    context.font = "16px Arial";
    context.fillText(
      "Use Up/Down arrows to select, SPACE to confirm",
      this.canvas.width / 2,
      this.canvas.height - 50
    );
  }

  /**
   * Render game over screen
   * @param {CanvasRenderingContext2D} context - Canvas context
   */
  renderGameOver(context) {
    // Semi-transparent background
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Game over title
    context.fillStyle = "white";
    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.fillText(
      "GAME OVER",
      this.canvas.width / 2,
      this.canvas.height / 3
    );

    // Score display
    context.font = "32px Arial";
    context.fillText(
      `Score: ${this.score}`,
      this.canvas.width / 2,
      this.canvas.height / 2
    );

    // Restart/quit options
    context.font = "24px Arial";

    // Restart option
    context.fillStyle =
      this.components.gameOverMenu?.selectedOption === 0 ? "#4CAF50" : "white";
    context.fillText(
      "Try Again",
      this.canvas.width / 2,
      this.canvas.height / 2 + 60
    );

    // Quit option
    context.fillStyle =
      this.components.gameOverMenu?.selectedOption === 1 ? "#4CAF50" : "white";
    context.fillText(
      "Quit",
      this.canvas.width / 2,
      this.canvas.height / 2 + 100
    );

    // Instructions
    context.fillStyle = "white";
    context.font = "16px Arial";
    context.fillText(
      "Use Up/Down arrows to select, SPACE to confirm",
      this.canvas.width / 2,
      this.canvas.height - 50
    );
  }

  /**
   * Render level complete screen
   * @param {CanvasRenderingContext2D} context - Canvas context
   */
  renderLevelComplete(context) {
    // Semi-transparent background
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Level complete title
    context.fillStyle = "white";
    context.font = "bold 48px Arial";
    context.textAlign = "center";
    context.fillText(
      "LEVEL COMPLETE!",
      this.canvas.width / 2,
      this.canvas.height / 3
    );

    // Score display
    context.font = "32px Arial";
    context.fillText(
      `Score: ${this.score}`,
      this.canvas.width / 2,
      this.canvas.height / 2
    );

    // Next level/quit options
    context.font = "24px Arial";

    // Next level option
    context.fillStyle =
      this.components.levelCompleteMenu?.selectedOption === 0
        ? "#4CAF50"
        : "white";
    context.fillText(
      "Next Level",
      this.canvas.width / 2,
      this.canvas.height / 2 + 60
    );

    // Restart option
    context.fillStyle =
      this.components.levelCompleteMenu?.selectedOption === 1
        ? "#4CAF50"
        : "white";
    context.fillText(
      "Restart Level",
      this.canvas.width / 2,
      this.canvas.height / 2 + 100
    );

    // Quit option
    context.fillStyle =
      this.components.levelCompleteMenu?.selectedOption === 2
        ? "#4CAF50"
        : "white";
    context.fillText(
      "Quit",
      this.canvas.width / 2,
      this.canvas.height / 2 + 140
    );

    // Instructions
    context.fillStyle = "white";
    context.font = "16px Arial";
    context.fillText(
      "Use Up/Down arrows to select, SPACE to confirm",
      this.canvas.width / 2,
      this.canvas.height - 50
    );
  }

  /**
   * Render notifications
   * @param {CanvasRenderingContext2D} context - Canvas context
   */
  renderNotifications(context) {
    // Render notifications from bottom to top
    for (let i = 0; i < this.notifications.length; i++) {
      const notification = this.notifications[i];
      const y = this.canvas.height - 50 - i * 40;

      // Skip if off screen
      if (y < 0) continue;

      // Calculate fade in/out
      let alpha = 1;
      if (notification.timer < 30) {
        alpha = notification.timer / 30;
      } else if (notification.timer > notification.duration - 30) {
        alpha = (notification.duration - notification.timer) / 30;
      }

      // Draw notification background
      context.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
      context.fillRect(this.canvas.width / 2 - 150, y - 15, 300, 30);

      // Draw notification text
      context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      context.font = "16px Arial";
      context.textAlign = "center";
      context.fillText(notification.text, this.canvas.width / 2, y);
    }
  }

  /**
   * Show title screen
   */
  showTitleScreen() {
    this.currentScreen = "title";

    // Create mode selector component
    this.components.modeSelector = {
      selectedMode: "skate",
      visible: true,
      update: (gameState) => {
        // Mode selection handled by game.js
      },
    };
  }

  /**
   * Show game HUD
   */
  showGameHUD() {
    this.currentScreen = "game";
  }

  /**
   * Show pause menu
   * @param {Function} resumeCallback - Resume game callback
   * @param {Function} restartCallback - Restart game callback
   * @param {Function} quitCallback - Quit game callback
   */
  showPauseMenu(resumeCallback, restartCallback, quitCallback) {
    this.currentScreen = "pause";

    // Create pause menu component
    this.components.pauseMenu = {
      selectedOption: 0,
      options: [
        {text: "Resume", action: resumeCallback},
        {text: "Restart", action: restartCallback},
        {text: "Quit", action: quitCallback},
      ],
      visible: true,
      update: (gameState) => {
        // Menu navigation handled by game.js
      },
      selectOption: (index) => {
        if (index >= 0 && index < this.components.pauseMenu.options.length) {
          this.components.pauseMenu.selectedOption = index;
        }
      },
      executeSelected: () => {
        const option =
          this.components.pauseMenu.options[
            this.components.pauseMenu.selectedOption
          ];
        if (option && option.action) {
          option.action();
        }
      },
    };
  }

  /**
   * Show game over screen
   * @param {Object} stats - Game stats
   * @param {Function} restartCallback - Restart game callback
   * @param {Function} quitCallback - Quit game callback
   */
  showGameOver(stats, restartCallback, quitCallback) {
    this.currentScreen = "gameover";

    // Store stats
    this.score = stats.score || 0;

    // Create game over menu component
    this.components.gameOverMenu = {
      selectedOption: 0,
      options: [
        {text: "Try Again", action: restartCallback},
        {text: "Quit", action: quitCallback},
      ],
      visible: true,
      update: (gameState) => {
        // Menu navigation handled by game.js
      },
      selectOption: (index) => {
        if (index >= 0 && index < this.components.gameOverMenu.options.length) {
          this.components.gameOverMenu.selectedOption = index;
        }
      },
      executeSelected: () => {
        const option =
          this.components.gameOverMenu.options[
            this.components.gameOverMenu.selectedOption
          ];
        if (option && option.action) {
          option.action();
        }
      },
    };
  }

  /**
   * Show level complete screen
   * @param {Object} stats - Level stats
   * @param {Function} nextLevelCallback - Next level callback
   * @param {Function} restartCallback - Restart level callback
   * @param {Function} quitCallback - Quit game callback
   */
  showLevelComplete(stats, nextLevelCallback, restartCallback, quitCallback) {
    this.currentScreen = "levelcomplete";

    // Store stats
    this.score = stats.score || 0;

    // Create level complete menu component
    this.components.levelCompleteMenu = {
      selectedOption: 0,
      options: [
        {text: "Next Level", action: nextLevelCallback},
        {text: "Restart Level", action: restartCallback},
        {text: "Quit", action: quitCallback},
      ],
      visible: true,
      update: (gameState) => {
        // Menu navigation handled by game.js
      },
      selectOption: (index) => {
        if (
          index >= 0 &&
          index < this.components.levelCompleteMenu.options.length
        ) {
          this.components.levelCompleteMenu.selectedOption = index;
        }
      },
      executeSelected: () => {
        const option =
          this.components.levelCompleteMenu.options[
            this.components.levelCompleteMenu.selectedOption
          ];
        if (option && option.action) {
          option.action();
        }
      },
    };
  }

  /**
   * Show trick animation
   * @param {Object} trick - Trick data
   * @param {number} score - Trick score
   */
  showTrick(trick, score) {
    this.currentTrick = {
      name: trick.name,
      score: score,
    };
    this.trickTimer = 60; // 1 second at 60fps
  }

  /**
   * Show message
   * @param {string} text - Message text
   * @param {string} color - Message color
   * @param {number} duration - Message duration in frames
   */
  showMessage(text, color = "white", duration = 120) {
    this.message = {
      text: text,
      color: color,
    };
    this.messageTimer = duration;
  }

  /**
   * Add notification
   * @param {string} text - Notification text
   * @param {number} duration - Notification duration in frames
   */
  addNotification(text, duration = 180) {
    this.notifications.push({
      text: text,
      duration: duration,
      timer: duration,
    });
  }

  /**
   * Start screen fade
   * @param {string} direction - Fade direction ('in' or 'out')
   * @param {Function} callback - Callback function when fade completes
   */
  fade(direction, callback) {
    this.fadeDirection = direction;
    this.fadeCallback = callback;

    if (direction === "in") {
      this.fadeAlpha = 0;
    } else if (direction === "out") {
      this.fadeAlpha = 1;
    }
  }

  /**
   * Handle screen resize
   * @param {number} width - New width
   * @param {number} height - New height
   */
  handleResize(width, height) {
    // Update UI components for new size
    for (const id in this.components) {
      if (this.components[id].handleResize) {
        this.components[id].handleResize(width, height);
      }
    }
  }

  /**
   * Get current screen
   * @returns {string} Current screen
   */
  getCurrentScreen() {
    return this.currentScreen;
  }

  /**
   * Handle menu input
   * @param {string} input - Input action
   * @returns {boolean} Whether input was handled
   */
  handleMenuInput(input) {
    switch (this.currentScreen) {
      case "title":
        return this.handleTitleInput(input);
      case "pause":
        return this.handlePauseMenuInput(input);
      case "gameover":
        return this.handleGameOverInput(input);
      case "levelcomplete":
        return this.handleLevelCompleteInput(input);
      default:
        return false;
    }
  }

  /**
   * Handle title screen input
   * @param {string} input - Input action
   * @returns {boolean} Whether input was handled
   */
  handleTitleInput(input) {
    const modeSelector = this.components.modeSelector;
    if (!modeSelector) return false;

    switch (input) {
      case "start":
        if (this.onMenuAction) {
          this.onMenuAction("start", this.components.modeSelector.selectedMode);
        }
        return true;
      case "left":
      case "s":
        this.components.modeSelector.selectedMode = "skate";
        if (this.onModeSelect) {
          this.onModeSelect("skate");
        }
        return true;
      case "right":
      case "d":
        this.components.modeSelector.selectedMode = "surf";
        if (this.onModeSelect) {
          this.onModeSelect("surf");
        }
        return true;
      default:
        return false;
    }
  }

  /**
   * Handle pause menu input
   * @param {string} input - Input action
   * @returns {boolean} Whether input was handled
   */
  handlePauseMenuInput(input) {
    const pauseMenu = this.components.pauseMenu;
    if (!pauseMenu) return false;

    switch (input) {
      case "up":
        pauseMenu.selectOption(Math.max(0, pauseMenu.selectedOption - 1));
        return true;
      case "down":
        pauseMenu.selectOption(
          Math.min(pauseMenu.options.length - 1, pauseMenu.selectedOption + 1)
        );
        return true;
      case "jump":
        pauseMenu.executeSelected();
        return true;
      default:
        return false;
    }
  }

  /**
   * Handle game over input
   * @param {string} input - Input action
   * @returns {boolean} Whether input was handled
   */
  handleGameOverInput(input) {
    const gameOverMenu = this.components.gameOverMenu;
    if (!gameOverMenu) return false;

    switch (input) {
      case "up":
        gameOverMenu.selectOption(Math.max(0, gameOverMenu.selectedOption - 1));
        return true;
      case "down":
        gameOverMenu.selectOption(
          Math.min(
            gameOverMenu.options.length - 1,
            gameOverMenu.selectedOption + 1
          )
        );
        return true;
      case "jump":
        gameOverMenu.executeSelected();
        return true;
      default:
        return false;
    }
  }

  /**
   * Handle level complete input
   * @param {string} input - Input action
   * @returns {boolean} Whether input was handled
   */
  handleLevelCompleteInput(input) {
    const levelCompleteMenu = this.components.levelCompleteMenu;
    if (!levelCompleteMenu) return false;

    switch (input) {
      case "up":
        levelCompleteMenu.selectOption(
          Math.max(0, levelCompleteMenu.selectedOption - 1)
        );
        return true;
      case "down":
        levelCompleteMenu.selectOption(
          Math.min(
            levelCompleteMenu.options.length - 1,
            levelCompleteMenu.selectedOption + 1
          )
        );
        return true;
      case "jump":
        levelCompleteMenu.executeSelected();
        return true;
      default:
        return false;
    }
  }
}
