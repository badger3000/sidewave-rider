/**
 * Character controller
 * Handles character state, input processing, animations, and tricks
 */

import {GAME_MODES, CHARACTER_CONFIG} from "../constants/game-modes";
import {getTricksForMode} from "../constants/tricks";

export default class CharacterController {
  /**
   * Create a character controller
   * @param {PhysicsController} physics - Physics system
   * @param {AnimationSystem} animations - Animation system
   * @param {string} mode - Game mode ('skate' or 'surf')
   */
  constructor(physics, animations, mode = GAME_MODES.SKATE) {
    this.physics = physics;
    this.animations = animations;
    this.gameMode = mode;

    // Load character config based on game mode
    this.config = CHARACTER_CONFIG[mode] || CHARACTER_CONFIG[GAME_MODES.SKATE];

    // Load tricks based on game mode
    this.tricks = getTricksForMode(mode);

    // Character state
    this.state = "idle"; // idle, moving, jumping, trick1, trick2, etc.
    this.facing = "right";
    this.trickInProgress = false;
    this.trickTimer = 0;
    this.currentTrick = null;
    this.comboCounter = 0;
    this.comboTimer = 0;
    this.comboMaxTime = 90; // 1.5 seconds at 60fps

    // Control flags
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      trick1: false,
      trick2: false,
      trick3: false,
    };

    // State change callbacks
    this.onStateChange = null;
    this.onTrickPerformed = null;
    this.onComboEnd = null;
  }

  /**
   * Update character based on input and physics
   */
  update(deltaTime = 1 / 60) {
    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) {
        this.finalizeCombo();
      }
    }

    // Handle trick timer
    if (this.trickInProgress) {
      this.trickTimer--;
      if (this.trickTimer <= 0) {
        this.endTrick();
      }
    }

    // Process input if no trick is in progress
    if (!this.trickInProgress) {
      this.processInput();
    }

    // Update animation based on state
    this.updateAnimation();

    // Update character state based on physics
    this.updateState();
  }

  /**
   * Process player input
   */
  processInput() {
    // Don't process new inputs if a trick is in progress
    if (this.trickInProgress) return;

    // Apply left/right movement
    if (this.keys.left) {
      this.physics.moveLeft();
      this.facing = "left";
      if (this.physics.grounded) this.state = "moving";
    } else if (this.keys.right) {
      this.physics.moveRight();
      this.facing = "right";
      if (this.physics.grounded) this.state = "moving";
    } else if (this.physics.grounded) {
      this.state = "idle";
    }

    // Handle jumping
    if (this.keys.jump && this.physics.grounded) {
      if (this.physics.jump()) {
        this.state = "jumping";
      }
    }

    // Handle tricks
    if (this.gameMode === GAME_MODES.SKATE) {
      this.processSkateboardTricks();
    } else {
      this.processSurfingTricks();
    }
  }

  /**
   * Process skateboarding tricks
   */
  processSkateboardTricks() {
    // Only allow tricks when in the air (for most tricks)
    if (!this.physics.grounded) {
      if (this.keys.trick1) {
        this.performTrick("kickflip");
      } else if (this.keys.trick2) {
        this.performTrick("heelflip");
      } else if (this.keys.trick3) {
        this.performTrick("pop_shuvit");
      } else if (this.keys.down) {
        this.performTrick("ollie");
      }
    }
    // Grinding tricks can be done on rails when grounded
    else if (
      this.physics.collisionResponse &&
      this.physics.collisionResponse.obstacle &&
      this.physics.collisionResponse.obstacle.type === "rail"
    ) {
      if (this.keys.trick1) {
        this.performTrick("boardslide");
      }
    }
  }

  /**
   * Process surfing tricks
   */
  processSurfingTricks() {
    // Surfing tricks often require specific positioning on the wave
    if (this.physics.onWaveFace()) {
      if (this.keys.up && this.keys.left) {
        this.performTrick("top_turn");
      } else if (this.keys.down && this.keys.right) {
        this.performTrick("bottom_turn");
      } else if (this.keys.left && this.keys.right) {
        this.performTrick("cutback");
      } else if (this.keys.down) {
        this.performTrick("tube_ride");
      }
    }
  }

  /**
   * Perform a trick
   * @param {string} trickId - Trick identifier
   * @returns {Object} Trick result or null if unsuccessful
   */
  performTrick(trickId) {
    // Find the trick definition
    let trick = null;

    for (const key in this.tricks) {
      if (this.tricks[key].id === trickId) {
        trick = this.tricks[key];
        break;
      }
    }

    if (!trick) return null;

    // Check if trick can be performed
    if (trick.airOnly && this.physics.grounded) return null;
    if (
      trick.grindTrick &&
      (!this.physics.collisionResponse ||
        !this.physics.collisionResponse.obstacle ||
        this.physics.collisionResponse.obstacle.type !== "rail")
    ) {
      return null;
    }

    // Start trick
    this.state = trickId;
    this.trickInProgress = true;
    this.trickTimer = trick.duration;
    this.currentTrick = trick;

    // Increment combo
    this.comboCounter++;
    this.comboTimer = this.comboMaxTime;

    // Calculate and return score
    const score = this.calculateTrickScore(trick);

    // Trigger animation
    if (this.animations) {
      this.animations.play("character", trick.animationName, {
        flipped: this.facing === "left",
      });
    }

    // Notify about trick performance
    if (this.onTrickPerformed) {
      this.onTrickPerformed(trick, score, this.comboCounter);
    }

    return {
      trick,
      score,
      combo: this.comboCounter,
    };
  }

  /**
   * End the current trick
   */
  endTrick() {
    this.trickInProgress = false;
    this.currentTrick = null;

    // Reset state based on physics
    if (this.physics.grounded) {
      this.state = this.physics.velocity.x !== 0 ? "moving" : "idle";
    } else {
      this.state = "jumping";
    }
  }

  /**
   * Finalize the current combo
   */
  finalizeCombo() {
    // Only count as combo if more than 1 trick
    if (this.comboCounter > 1) {
      // Notify about combo end
      if (this.onComboEnd) {
        this.onComboEnd(this.comboCounter);
      }
    }

    // Reset combo counter
    this.comboCounter = 0;
  }

  /**
   * Calculate trick score
   * @param {Object} trick - Trick definition
   * @returns {number} Final trick score
   */
  calculateTrickScore(trick) {
    // Base score
    let score = trick.baseScore;

    // Add combo multiplier
    score *= Math.min(4, 1 + (this.comboCounter - 1) * 0.5);

    // Add physics-based bonus (height, speed, etc.)
    score += this.physics.calculateTrickScore();

    return Math.floor(score);
  }

  /**
   * Update animation based on character state
   */
  updateAnimation() {
    if (!this.animations) return;

    // Don't change animation if trick is in progress
    if (this.trickInProgress) return;

    // Set animation based on state
    if (this.state === "idle") {
      this.animations.play("character", "idle", {
        flipped: this.facing === "left",
      });
    } else if (this.state === "moving") {
      this.animations.play("character", "move", {
        flipped: this.facing === "left",
      });
    } else if (this.state === "jumping") {
      this.animations.play("character", "jump", {
        flipped: this.facing === "left",
      });
    }
  }

  /**
   * Update character state based on physics
   */
  updateState() {
    // Update state based on physics conditions
    if (!this.trickInProgress) {
      if (this.physics.grounded) {
        if (Math.abs(this.physics.velocity.x) > 0.1) {
          this.state = "moving";
        } else {
          this.state = "idle";
        }
      } else {
        this.state = "jumping";
      }
    }

    // Update facing direction
    if (this.physics.velocity.x > 0.1) {
      this.facing = "right";
    } else if (this.physics.velocity.x < -0.1) {
      this.facing = "left";
    }
  }

  /**
   * Set a key state
   * @param {string} key - Key name
   * @param {boolean} value - Key state
   */
  setKey(key, value) {
    if (this.keys.hasOwnProperty(key)) {
      this.keys[key] = value;
    }
  }

  /**
   * Reset all key states
   */
  resetKeys() {
    for (const key in this.keys) {
      this.keys[key] = false;
    }
  }

  /**
   * Get character's current position
   * @returns {Object} Position {x, y}
   */
  getPosition() {
    return {...this.physics.position};
  }

  /**
   * Get character's dimensions
   * @returns {Object} Dimensions {width, height}
   */
  getDimensions() {
    return {
      width: this.config.width,
      height: this.config.height,
    };
  }

  /**
   * Get character state info
   * @returns {Object} Character state
   */
  getState() {
    return {
      state: this.state,
      facing: this.facing,
      trickInProgress: this.trickInProgress,
      comboCounter: this.comboCounter,
      comboTimer: this.comboTimer,
      position: this.getPosition(),
      velocity: {...this.physics.velocity},
      grounded: this.physics.grounded,
    };
  }
}
