/**
 * Physics system for the game
 * Handles movement, gravity, collision response, etc.
 */

import {GAME_MODES, PHYSICS_CONFIG} from "../constants/game-modes";
import {clamp} from "../utils/math";

export default class PhysicsController {
  /**
   * Create a physics controller
   * @param {string} mode - Game mode ('skate' or 'surf')
   */
  constructor(mode = GAME_MODES.SKATE) {
    // Set game mode
    this.gameMode = mode;

    // Load physics config based on game mode
    const config = PHYSICS_CONFIG[mode] || PHYSICS_CONFIG[GAME_MODES.SKATE];

    // Physics constants
    this.gravity = config.gravity;
    this.friction = config.friction;
    this.maxSpeed = config.maxSpeed;
    this.acceleration = config.acceleration;
    this.jumpForce = config.jumpForce;

    // Dynamic state
    this.position = {x: 100, y: 200};
    this.velocity = {x: 0, y: 0};
    this.grounded = false;

    // Terrain factors - for surfing mode
    this.waveHeight = 0;
    this.waveSlope = 0;

    // Collision state
    this.collisionResponse = null;
  }

  /**
   * Update physics simulation
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime = 1 / 60) {
    // Apply gravity if not grounded
    if (!this.grounded) {
      this.velocity.y += this.gravity;
    }

    // Apply friction
    this.velocity.x *= this.friction;

    // Special surfing mechanics
    if (this.gameMode === GAME_MODES.SURF) {
      this.updateWavePhysics(deltaTime);
    }

    // Update position based on velocity
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Reset collision response
    this.collisionResponse = null;
  }

  /**
   * Move character left
   */
  moveLeft() {
    if (this.velocity.x > -this.maxSpeed) {
      this.velocity.x -= this.acceleration;
      // Cap the speed
      this.velocity.x = Math.max(this.velocity.x, -this.maxSpeed);
    }
  }

  /**
   * Move character right
   */
  moveRight() {
    if (this.velocity.x < this.maxSpeed) {
      this.velocity.x += this.acceleration;
      // Cap the speed
      this.velocity.x = Math.min(this.velocity.x, this.maxSpeed);
    }
  }

  /**
   * Make character jump
   * @returns {boolean} Whether jump was successful
   */
  jump() {
    if (this.grounded) {
      this.velocity.y = -this.jumpForce;
      this.grounded = false;
      return true;
    }
    return false;
  }

  /**
   * Set character position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * Set character velocity
   * @param {number} x - X velocity
   * @param {number} y - Y velocity
   */
  setVelocity(x, y) {
    this.velocity.x = x;
    this.velocity.y = y;
  }

  /**
   * Handle collision with ground
   * @param {number} groundY - Y position of ground
   */
  handleGroundCollision(groundY) {
    this.position.y = groundY;
    this.velocity.y = 0;
    this.grounded = true;
  }

  /**
   * Handle collision with obstacle
   * @param {Object} obstacle - Obstacle object
   * @param {Object} overlap - Overlap rectangle
   */
  handleObstacleCollision(obstacle, overlap) {
    // Store collision response for gameplay systems
    this.collisionResponse = {
      obstacle,
      overlap,
    };

    // Basic collision resolution - push out in direction of smallest overlap
    if (overlap.width < overlap.height) {
      // Horizontal collision
      if (this.position.x < obstacle.x) {
        this.position.x -= overlap.width;
        this.velocity.x = Math.min(0, this.velocity.x);
      } else {
        this.position.x += overlap.width;
        this.velocity.x = Math.max(0, this.velocity.x);
      }
    } else {
      // Vertical collision
      if (this.position.y < obstacle.y) {
        this.position.y -= overlap.height;
        this.velocity.y = Math.min(0, this.velocity.y);
      } else {
        this.position.y += overlap.height;
        this.velocity.y = Math.max(0, this.velocity.y);
        this.grounded = true;
      }
    }
  }

  /**
   * Apply a force to the character
   * @param {number} forceX - X component of force
   * @param {number} forceY - Y component of force
   */
  applyForce(forceX, forceY) {
    this.velocity.x += forceX;
    this.velocity.y += forceY;
  }

  /**
   * Apply bounce physics
   * @param {Object} surfaceNormal - Normal vector of surface {x, y}
   * @param {number} bounciness - Bounciness factor (0-1)
   */
  bounce(surfaceNormal, bounciness = 0.5) {
    // Normalize the surface normal
    const magnitude = Math.sqrt(
      surfaceNormal.x * surfaceNormal.x + surfaceNormal.y * surfaceNormal.y
    );

    const nx = surfaceNormal.x / magnitude;
    const ny = surfaceNormal.y / magnitude;

    // Calculate dot product of velocity and normal
    const dot = this.velocity.x * nx + this.velocity.y * ny;

    // Calculate reflection vector
    this.velocity.x -= 2 * dot * nx * bounciness;
    this.velocity.y -= 2 * dot * ny * bounciness;
  }

  /**
   * Update wave physics for surf mode
   * @param {number} deltaTime - Time since last update
   */
  updateWavePhysics(deltaTime) {
    if (this.gameMode !== GAME_MODES.SURF) return;

    // Update wave parameters based on time
    const config = PHYSICS_CONFIG[GAME_MODES.SURF];

    this.waveHeight =
      config.waterLevel + Math.sin(Date.now() / 1000) * config.waveAmplitude;

    this.waveSlope = Math.cos(Date.now() / 1000) * 0.5;

    // Apply wave forces
    this.velocity.x += this.waveSlope * 0.2;

    // If on steep part of wave, accelerate
    if (this.onWaveFace() && this.waveSlope > 0.2) {
      this.velocity.x += 0.1;
    }
  }

  /**
   * Get current wave Y position at character's X position
   * @returns {number} Y position of wave
   */
  getWaveY() {
    if (this.gameMode !== GAME_MODES.SURF) return 0;

    const config = PHYSICS_CONFIG[GAME_MODES.SURF];

    return (
      config.waterLevel +
      Math.sin(this.position.x * config.waveFrequency) * config.waveAmplitude
    );
  }

  /**
   * Check if character is on the face of a wave
   * @returns {boolean} Whether character is on wave face
   */
  onWaveFace() {
    if (this.gameMode !== GAME_MODES.SURF) return false;

    const waveY = this.getWaveY();
    return Math.abs(this.position.y - waveY) < 20;
  }

  /**
   * Calculate score for a trick based on current physics state
   * @returns {number} Trick score modifier
   */
  calculateTrickScore() {
    // Score based on height/speed
    let score = 0;

    if (this.gameMode === GAME_MODES.SKATE) {
      // For skateboarding, height is important
      const heightFactor = Math.max(0, 300 - this.position.y) / 10;
      score += heightFactor;
    } else {
      // For surfing, wave steepness is important
      const waveFactor = Math.abs(this.waveSlope) * 100;
      score += waveFactor;
    }

    // Speed factor for both modes
    const speedFactor = Math.abs(this.velocity.x) * 5;
    score += speedFactor;

    return Math.floor(score);
  }

  /**
   * Get character dimensions
   * @returns {Object} Character dimensions {width, height}
   */
  getDimensions() {
    // This would be based on character config in a full implementation
    return {
      width: 32,
      height: 48,
    };
  }
}
