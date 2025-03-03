/**
 * Level system
 * Handles level generation, obstacles, collectibles, and collision detection
 */

import {GAME_MODES, ENVIRONMENT_CONFIG} from "../constants/game-modes";
import {getLevelsForMode} from "../constants/levels";
import {checkRectCollision, getRectOverlap} from "../utils/collision";
import {randomInt, randomFloat} from "../utils/math";

export default class LevelSystem {
  /**
   * Create a level system
   * @param {string} mode - Game mode ('skate' or 'surf')
   * @param {number} levelIndex - Level index to load
   */
  constructor(mode = GAME_MODES.SKATE, levelIndex = 0) {
    this.gameMode = mode;
    this.levelIndex = levelIndex;

    // Get environment config for this mode
    this.envConfig =
      ENVIRONMENT_CONFIG[mode] || ENVIRONMENT_CONFIG[GAME_MODES.SKATE];

    // Get level data
    const levels = getLevelsForMode(mode);
    this.levelData = levels[levelIndex] || levels[0];

    // Level state
    this.obstacles = [];
    this.collectibles = [];
    this.specialZones = [];
    this.camera = {x: 0, y: 0};
    this.width = this.levelData.layout?.length || 5000; // Level length
    this.groundY = 300; // Base ground level

    // For surfing mode
    this.waveSegments = [];

    // Background layers for parallax
    this.backgroundLayers = [];

    // Level events
    this.onCollectibleCollected = null;
    this.onSpecialZoneEntered = null;
    this.onSpecialZoneExited = null;
  }

  /**
   * Initialize the level
   */
  initializeLevel() {
    // Create background layers
    this.createBackgroundLayers();

    if (this.gameMode === GAME_MODES.SKATE) {
      this.initializeSkateLevel();
    } else {
      this.initializeSurfLevel();
    }
  }

  /**
   * Initialize skateboarding level
   */
  initializeSkateLevel() {
    // Create ground terrain with variations
    this.createGroundTerrain();

    // Add predefined obstacles from level data
    if (this.levelData.obstacles) {
      this.obstacles.push(...this.levelData.obstacles);
    }

    // Add procedurally generated obstacles
    this.addSkateObstacles();

    // Add collectibles
    this.addCollectibles();

    // Add special zones
    this.addSpecialZones();
  }

  /**
   * Initialize surfing level
   */
  initializeSurfLevel() {
    // Create wave segments
    this.createWaveSegments();

    // Add predefined obstacles from level data
    if (this.levelData.obstacles) {
      this.obstacles.push(...this.levelData.obstacles);
    }

    // Add procedurally generated obstacles
    this.addSurfObstacles();

    // Add collectibles
    this.addCollectibles();

    // Add special zones
    this.addSpecialZones();
  }

  /**
   * Create background layers for parallax scrolling
   */
  createBackgroundLayers() {
    // Use background layers from level data if available
    if (this.levelData.backgroundLayers) {
      this.backgroundLayers = this.levelData.backgroundLayers.map(
        (layer, index) => {
          return {
            image: layer,
            scrollFactor: 0.1 * (index + 1),
            y: index * 50,
          };
        }
      );
    } else {
      // Use default background layers from environment config
      this.backgroundLayers = this.envConfig.bgLayers || [];
    }
  }

  /**
   * Create ground terrain for skateboarding level
   */
  createGroundTerrain() {
    // Create varied ground height
    const segments = Math.ceil(this.width / 200);
    let lastY = this.groundY;
    const variationAmount = this.getGroundVariationAmount();

    for (let i = 0; i < segments; i++) {
      const x = i * 200;
      const segmentType = Math.random();

      if (segmentType < 0.7) {
        // Flat segment
        this.addGroundSegment(x, lastY, 200, "flat");
      } else if (segmentType < 0.85) {
        // Ramp up
        const newY = lastY - Math.floor(Math.random() * variationAmount) - 20;
        this.addGroundSegment(x, lastY, 200, "ramp", newY);
        lastY = newY;
      } else {
        // Ramp down
        const newY = lastY + Math.floor(Math.random() * variationAmount) + 20;
        this.addGroundSegment(x, lastY, 200, "ramp", newY);
        lastY = newY;
      }
    }
  }

  /**
   * Get ground variation amount based on level settings
   * @returns {number} Variation amount
   */
  getGroundVariationAmount() {
    const variation = this.levelData.layout?.groundVariation || "low";

    switch (variation) {
      case "high":
        return 60;
      case "medium":
        return 40;
      case "low":
      default:
        return 20;
    }
  }

  /**
   * Add a ground segment
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Segment width
   * @param {string} type - Segment type ('flat' or 'ramp')
   * @param {number} endY - End Y position for ramps
   */
  addGroundSegment(x, y, width, type, endY = y) {
    this.obstacles.push({
      type: "ground",
      subType: type,
      x: x,
      y: y,
      width: width,
      height: 20,
      endY: endY,
    });
  }

  /**
   * Create wave segments for surfing level
   */
  createWaveSegments() {
    // Use wave segments from level data if available
    if (this.levelData.waveSections) {
      this.waveSegments = this.levelData.waveSections;
    } else {
      // Create procedural wave segments
      const segments = Math.ceil(this.width / 300);

      for (let i = 0; i < segments; i++) {
        const x = i * 300;
        const waveType = Math.random();

        if (waveType < 0.6) {
          // Normal wave section
          this.addWaveSegment(x, "normal", 300);
        } else if (waveType < 0.8) {
          // Breaking wave section (for tube riding)
          this.addWaveSegment(x, "breaking", 300);
        } else {
          // Choppy section (harder to navigate)
          this.addWaveSegment(x, "choppy", 300);
        }
      }
    }
  }

  /**
   * Add a wave segment
   * @param {number} x - X position
   * @param {string} type - Wave type
   * @param {number} width - Segment width
   */
  addWaveSegment(x, type, width) {
    this.waveSegments.push({
      x: x,
      width: width,
      type: type,
      height: type === "breaking" ? 120 : 80,
      amplitude: type === "choppy" ? 30 : 15,
      frequency: type === "choppy" ? 0.05 : 0.02,
    });
  }

  /**
   * Add skateboarding obstacles
   */
  addSkateObstacles() {
    // Don't add procedural obstacles if frequency is 0
    const obstacleFrequency = this.levelData.layout?.obstacleFrequency || 0.6;
    if (obstacleFrequency <= 0) return;

    const obstacleTypes = this.envConfig.obstacleTypes || [
      "rail",
      "bench",
      "ramp",
      "gap",
      "halfpipe",
    ];

    // Place obstacles at semi-random intervals
    const obstacleSpacing = Math.floor(500 / obstacleFrequency);

    for (
      let x = 400;
      x < this.width - 400;
      x += Math.random() * obstacleSpacing + obstacleSpacing / 2
    ) {
      // Skip if too close to an existing obstacle
      if (this.isNearObstacle(x, 150)) continue;

      const type =
        obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      this.addObstacle(x, type);
    }
  }

  /**
   * Add surfing obstacles
   */
  addSurfObstacles() {
    // Don't add procedural obstacles if frequency is 0
    const obstacleFrequency = this.levelData.layout?.obstacleFrequency || 0.4;
    if (obstacleFrequency <= 0) return;

    const obstacleTypes = this.envConfig.obstacleTypes || [
      "buoy",
      "swimmer",
      "rock",
      "driftwood",
      "seaweed",
    ];

    // Place obstacles at semi-random intervals
    const obstacleSpacing = Math.floor(600 / obstacleFrequency);

    for (
      let x = 400;
      x < this.width - 400;
      x += Math.random() * obstacleSpacing + obstacleSpacing / 2
    ) {
      // Skip if too close to an existing obstacle
      if (this.isNearObstacle(x, 200)) continue;

      const type =
        obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      this.addObstacle(x, type);
    }
  }

  /**
   * Check if there's an obstacle near the specified position
   * @param {number} x - X position
   * @param {number} distance - Minimum distance
   * @returns {boolean} True if there's an obstacle nearby
   */
  isNearObstacle(x, distance) {
    for (const obstacle of this.obstacles) {
      if (obstacle.type === "ground") continue;

      const centerX = obstacle.x + (obstacle.width || 0) / 2;
      if (Math.abs(x - centerX) < distance) {
        return true;
      }
    }
    return false;
  }

  /**
   * Add an obstacle
   * @param {number} x - X position
   * @param {string} type - Obstacle type
   */
  addObstacle(x, type) {
    let obstacle = {
      type: type,
      x: x,
      y: 0,
      width: 0,
      height: 0,
      properties: {},
    };

    // Set properties based on obstacle type
    if (this.gameMode === GAME_MODES.SKATE) {
      switch (type) {
        case "rail":
          obstacle.width = 150;
          obstacle.height = 10;
          obstacle.y = this.getGroundYAt(x) - 20;
          obstacle.properties = {grindable: true, trickBonus: 1.5};
          break;
        case "bench":
          obstacle.width = 100;
          obstacle.height = 30;
          obstacle.y = this.getGroundYAt(x) - 30;
          obstacle.properties = {grindable: true, jumpable: true};
          break;
        case "ramp":
          obstacle.width = 80;
          obstacle.height = 60;
          obstacle.y = this.getGroundYAt(x) - 60;
          obstacle.properties = {launchVelocity: 15, angle: 45};
          break;
        case "gap":
          obstacle.width = 120;
          obstacle.height = 0;
          obstacle.y = this.getGroundYAt(x);
          obstacle.properties = {gap: true, scoreBonus: 200};
          break;
        case "halfpipe":
          obstacle.width = 200;
          obstacle.height = 80;
          obstacle.y = this.getGroundYAt(x) - 80;
          obstacle.properties = {halfpipe: true, scoreMultiplier: 2};
          break;
      }
    } else {
      // Surfing obstacles
      switch (type) {
        case "buoy":
          obstacle.width = 20;
          obstacle.height = 20;
          obstacle.y = 250;
          obstacle.properties = {damageOnHit: true};
          break;
        case "swimmer":
          obstacle.width = 40;
          obstacle.height = 30;
          obstacle.y = 260;
          obstacle.properties = {avoidable: true, scoreBonus: 100};
          break;
        case "rock":
          obstacle.width = 50;
          obstacle.height = 40;
          obstacle.y = 280;
          obstacle.properties = {damageOnHit: true, stationary: true};
          break;
        case "driftwood":
          obstacle.width = 60;
          obstacle.height = 15;
          obstacle.y = 270;
          obstacle.properties = {movable: true};
          break;
        case "seaweed":
          obstacle.width = 30;
          obstacle.height = 50;
          obstacle.y = 270;
          obstacle.properties = {slowdown: true};
          break;
      }
    }

    this.obstacles.push(obstacle);
  }

  /**
   * Add collectibles
   */
  addCollectibles() {
    // Don't add collectibles if frequency is 0
    const collectibleFrequency =
      this.levelData.layout?.collectibleFrequency || 0.7;
    if (collectibleFrequency <= 0) return;

    const collectibleTypes = this.envConfig.collectibleTypes || [
      "coin",
      "powerup",
    ];

    // Place items at semi-random intervals
    const spacing = Math.floor(150 / collectibleFrequency);

    for (
      let x = 300;
      x < this.width - 300;
      x += randomInt(spacing - 50, spacing + 50)
    ) {
      const type =
        Math.random() < 0.8
          ? "coin"
          : collectibleTypes[randomInt(0, collectibleTypes.length - 1)];
      const y =
        this.gameMode === GAME_MODES.SKATE
          ? this.getGroundYAt(x) - randomInt(50, 150)
          : 220 - randomInt(0, 80);

      this.collectibles.push({
        type: "collectible",
        subType: type,
        x: x,
        y: y,
        width: 20,
        height: 20,
        value: type === "coin" ? 10 : 50,
        collected: false,
      });
    }
  }

  /**
   * Add special zones
   */
  addSpecialZones() {
    // Use special zones from level data if available
    if (this.levelData.specialZones) {
      this.specialZones = this.levelData.specialZones;
      return;
    }

    // Add procedurally generated special zones
    const zoneTypes =
      this.gameMode === GAME_MODES.SKATE
        ? ["trick_zone", "speed_boost", "score_multiplier"]
        : ["tube_zone", "wave_boost", "score_multiplier"];

    // Add a few special zones
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * (this.width - 1000) + 500;
      const width = Math.random() * 300 + 200;
      const type = zoneTypes[Math.floor(Math.random() * zoneTypes.length)];

      this.specialZones.push({
        type: "zone",
        subType: type,
        x: x,
        y: 0, // y doesn't matter for zones, they span the height
        width: width,
        active: true,
        properties: this.getZoneProperties(type),
      });
    }
  }

  /**
   * Get properties for a special zone
   * @param {string} type - Zone type
   * @returns {Object} Zone properties
   */
  getZoneProperties(type) {
    switch (type) {
      case "trick_zone":
        return {scoreMultiplier: 2, duration: 5};
      case "speed_boost":
        return {velocityBoost: 1.5, duration: 3};
      case "score_multiplier":
        return {scoreMultiplier: 3, duration: 5};
      case "tube_zone":
        return {scorePerSecond: 100, maxDuration: 8};
      case "wave_boost":
        return {velocityBoost: 2, duration: 4};
      default:
        return {};
    }
  }

  /**
   * Get ground Y position at a specific X position
   * @param {number} x - X position
   * @returns {number} Ground Y position
   */
  getGroundYAt(x) {
    // Find the ground segment at position x
    for (const obstacle of this.obstacles) {
      if (
        obstacle.type === "ground" &&
        x >= obstacle.x &&
        x < obstacle.x + obstacle.width
      ) {
        if (obstacle.subType === "flat") {
          return obstacle.y;
        } else if (obstacle.subType === "ramp") {
          // Calculate Y on a slope
          const progress = (x - obstacle.x) / obstacle.width;
          return obstacle.y + (obstacle.endY - obstacle.y) * progress;
        }
      }
    }
    return this.groundY; // Default
  }

  /**
   * Get wave Y position at a specific X position
   * @param {number} x - X position
   * @param {number} time - Current time (for wave animation)
   * @returns {number} Wave Y position
   */
  getWaveYAt(x, time) {
    // Find the wave segment at position x
    for (const segment of this.waveSegments) {
      if (x >= segment.x && x < segment.x + segment.width) {
        // Calculate wave height using sine wave
        const waveX = (x - segment.x) / segment.width;
        const timeOffset = time * 0.001; // Time factor for wave movement

        return (
          250 +
          Math.sin(waveX * Math.PI * 2 * segment.frequency + timeOffset) *
            segment.amplitude
        );
      }
    }
    return 250; // Default water level
  }

  /**
   * Update level state
   * @param {number} playerX - Player X position
   * @param {number} time - Current time
   */
  update(playerX, time) {
    // Update camera position
    this.camera.x = playerX - 200; // Keep player on left side of screen

    // Update any dynamic elements (moving obstacles, etc.)
    this.updateObstacles(time);

    // Remove collected items
    this.collectibles = this.collectibles.filter((item) => !item.collected);
  }

  /**
   * Update obstacles
   * @param {number} time - Current time
   */
  updateObstacles(time) {
    // Update any moving obstacles
    for (const obstacle of this.obstacles) {
      if (obstacle.properties && obstacle.properties.moving) {
        // Update position for moving obstacles
        obstacle.x += Math.sin(time * 0.001) * 2;
      }
    }
  }

  /**
   * Check collisions with player
   * @param {Object} player - Player object with position and dimensions
   * @returns {Object} Collision results
   */
  checkCollisions(player) {
    const results = {
      ground: false,
      groundY: 0,
      obstacles: [],
      collectibles: [],
      zones: [],
    };

    // Check ground collision for skate mode
    if (this.gameMode === GAME_MODES.SKATE) {
      const groundY = this.getGroundYAt(player.x);
      if (player.y + player.height >= groundY) {
        results.ground = true;
        results.groundY = groundY;
      }
    } else {
      // For surf mode, check wave collision
      const waveY = this.getWaveYAt(player.x, Date.now());
      if (player.y + player.height >= waveY) {
        results.ground = true;
        results.groundY = waveY;
      }
    }

    // Check obstacle collisions
    for (const obstacle of this.obstacles) {
      if (
        obstacle.type !== "ground" &&
        this.checkObjectCollision(player, obstacle)
      ) {
        const overlap = this.getCollisionOverlap(player, obstacle);
        results.obstacles.push({
          obstacle,
          overlap,
        });
      }
    }

    // Check collectible collisions
    for (const collectible of this.collectibles) {
      if (
        !collectible.collected &&
        this.checkObjectCollision(player, collectible)
      ) {
        collectible.collected = true;
        results.collectibles.push(collectible);

        // Trigger collectible collection event
        if (this.onCollectibleCollected) {
          this.onCollectibleCollected(collectible);
        }
      }
    }

    // Check special zone collisions
    for (const zone of this.specialZones) {
      if (
        zone.active &&
        player.x >= zone.x &&
        player.x <= zone.x + zone.width
      ) {
        results.zones.push(zone);
      }
    }

    return results;
  }

  /**
   * Check collision between player and object
   * @param {Object} player - Player object
   * @param {Object} object - Object to check collision with
   * @returns {boolean} Whether collision occurred
   */
  checkObjectCollision(player, object) {
    return checkRectCollision(player, object);
  }

  /**
   * Get collision overlap between player and object
   * @param {Object} player - Player object
   * @param {Object} object - Object to check collision with
   * @returns {Object} Overlap rectangle
   */
  getCollisionOverlap(player, object) {
    return getRectOverlap(player, object);
  }

  /**
   * Render the level
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {ResourceLoader} resources - Resource loader
   */
  render(context, resources) {
    // This would be replaced with your game engine's rendering system
    // Here's a simple implementation:

    // Render background layers (parallax)
    this.renderBackgroundLayers(context, resources);

    // Render ground or waves
    this.renderGround(context, resources);

    // Render obstacles
    this.renderObstacles(context, resources);

    // Render collectibles
    this.renderCollectibles(context, resources);

    // Render special zones
    this.renderSpecialZones(context, resources);
  }

  /**
   * Render background layers
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {ResourceLoader} resources - Resource loader
   */
  renderBackgroundLayers(context, resources) {
    // Simple placeholder implementation
    context.fillStyle = "#87CEEB"; // Sky blue
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  }

  /**
   * Render ground
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {ResourceLoader} resources - Resource loader
   */
  renderGround(context, resources) {
    if (this.gameMode === GAME_MODES.SKATE) {
      // Render ground segments
      context.fillStyle = "#4CAF50"; // Green

      for (const obstacle of this.obstacles) {
        if (obstacle.type === "ground") {
          const screenX = obstacle.x - this.camera.x;

          // Skip if off screen
          if (screenX + obstacle.width < 0 || screenX > context.canvas.width) {
            continue;
          }

          if (obstacle.subType === "flat") {
            // Flat ground
            context.fillRect(
              screenX,
              obstacle.y,
              obstacle.width,
              context.canvas.height - obstacle.y
            );
          } else if (obstacle.subType === "ramp") {
            // Ramp
            context.beginPath();
            context.moveTo(screenX, obstacle.y);
            context.lineTo(screenX + obstacle.width, obstacle.endY);
            context.lineTo(screenX + obstacle.width, context.canvas.height);
            context.lineTo(screenX, context.canvas.height);
            context.closePath();
            context.fill();
          }
        }
      }
    } else {
      // Render waves for surf mode
      context.fillStyle = "#4682B4"; // Steel blue for water
      context.fillRect(
        0,
        250,
        context.canvas.width,
        context.canvas.height - 250
      );

      // Render wave surface
      context.strokeStyle = "white";
      context.lineWidth = 2;
      context.beginPath();

      for (let x = 0; x < context.canvas.width; x += 5) {
        const worldX = x + this.camera.x;
        const y = this.getWaveYAt(worldX, Date.now());

        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.stroke();
    }
  }

  /**
   * Render obstacles
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {ResourceLoader} resources - Resource loader
   */
  renderObstacles(context, resources) {
    // Simple placeholder implementation
    for (const obstacle of this.obstacles) {
      if (obstacle.type === "ground") continue;

      const screenX = obstacle.x - this.camera.x;

      // Skip if off screen
      if (screenX + obstacle.width < 0 || screenX > context.canvas.width) {
        continue;
      }

      // Set color based on obstacle type
      switch (obstacle.type) {
        case "rail":
          context.fillStyle = "#A9A9A9"; // Dark gray
          break;
        case "bench":
          context.fillStyle = "#8B4513"; // Brown
          break;
        case "ramp":
          context.fillStyle = "#D2B48C"; // Tan
          break;
        case "buoy":
          context.fillStyle = "#FF0000"; // Red
          break;
        case "swimmer":
          context.fillStyle = "#FFA500"; // Orange
          break;
        case "rock":
          context.fillStyle = "#696969"; // Dim gray
          break;
        default:
          context.fillStyle = "#888888"; // Gray
      }

      context.fillRect(screenX, obstacle.y, obstacle.width, obstacle.height);
    }
  }

  /**
   * Render collectibles
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {ResourceLoader} resources - Resource loader
   */
  renderCollectibles(context, resources) {
    // Simple placeholder implementation
    for (const collectible of this.collectibles) {
      const screenX = collectible.x - this.camera.x;

      // Skip if off screen or collected
      if (
        collectible.collected ||
        screenX + collectible.width < 0 ||
        screenX > context.canvas.width
      ) {
        continue;
      }

      // Set color based on collectible type
      switch (collectible.subType) {
        case "coin":
          context.fillStyle = "#FFD700"; // Gold
          break;
        case "powerup":
          context.fillStyle = "#00FF00"; // Green
          break;
        case "score_boost":
          context.fillStyle = "#FF00FF"; // Magenta
          break;
        default:
          context.fillStyle = "#FFFFFF"; // White
      }

      // Draw as a circle
      context.beginPath();
      context.arc(
        screenX + collectible.width / 2,
        collectible.y + collectible.height / 2,
        collectible.width / 2,
        0,
        Math.PI * 2
      );
      context.fill();
    }
  }

  /**
   * Render special zones
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {ResourceLoader} resources - Resource loader
   */
  renderSpecialZones(context, resources) {
    // Simple placeholder implementation
    for (const zone of this.specialZones) {
      const screenX = zone.x - this.camera.x;

      // Skip if off screen
      if (screenX + zone.width < 0 || screenX > context.canvas.width) {
        continue;
      }

      // Set color based on zone type
      switch (zone.subType) {
        case "trick_zone":
          context.fillStyle = "rgba(255, 0, 0, 0.2)"; // Red with alpha
          break;
        case "speed_boost":
          context.fillStyle = "rgba(0, 255, 0, 0.2)"; // Green with alpha
          break;
        case "score_multiplier":
          context.fillStyle = "rgba(255, 255, 0, 0.2)"; // Yellow with alpha
          break;
        case "tube_zone":
          context.fillStyle = "rgba(0, 0, 255, 0.2)"; // Blue with alpha
          break;
        default:
          context.fillStyle = "rgba(255, 255, 255, 0.2)"; // White with alpha
      }

      // Draw zone as a semi-transparent rectangle
      context.fillRect(screenX, 0, zone.width, context.canvas.height);

      // Draw zone label
      context.fillStyle = "#FFFFFF";
      context.font = "16px Arial";
      context.textAlign = "center";
      context.fillText(
        zone.subType.replace("_", " ").toUpperCase(),
        screenX + zone.width / 2,
        50
      );
    }
  }
}
