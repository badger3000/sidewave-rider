/**
 * Game mode definitions and configurations
 */

/**
 * Game mode identifiers
 */
export const GAME_MODES = {
  SKATE: "skate",
  SURF: "surf",
};

/**
 * Physics configuration for each game mode
 */
export const PHYSICS_CONFIG = {
  [GAME_MODES.SKATE]: {
    gravity: 0.5,
    friction: 0.9,
    maxSpeed: 8,
    acceleration: 0.5,
    jumpForce: 12,
    groundLevel: 300, // Default ground level
  },
  [GAME_MODES.SURF]: {
    gravity: 0.3,
    friction: 0.95,
    maxSpeed: 7,
    acceleration: 0.3,
    jumpForce: 8,
    waterLevel: 250, // Default water level
    waveAmplitude: 50, // How high waves can get
    waveFrequency: 0.02, // Wave oscillation frequency
  },
};

/**
 * Player character config for each game mode
 */
export const CHARACTER_CONFIG = {
  [GAME_MODES.SKATE]: {
    width: 32,
    height: 48,
    spritesheet: "skater",
    defaultAnimation: "idle",
    trickDuration: 20, // Frames
    groundCollisionOffset: 5, // Feet position offset
  },
  [GAME_MODES.SURF]: {
    width: 32,
    height: 48,
    spritesheet: "surfer",
    defaultAnimation: "idle",
    trickDuration: 25, // Frames
    boardWidth: 40, // Width of the surfboard
  },
};

/**
 * Environment settings for each game mode
 */
export const ENVIRONMENT_CONFIG = {
  [GAME_MODES.SKATE]: {
    scrollSpeed: 5,
    bgLayers: [
      {id: "skate-bg-far", parallaxFactor: 0.1},
      {id: "skate-bg-mid", parallaxFactor: 0.3},
      {id: "skate-bg-near", parallaxFactor: 0.6},
    ],
    obstacleTypes: ["rail", "bench", "ramp", "gap", "halfpipe"],
    collectibleTypes: ["coin", "powerup", "score_boost"],
  },
  [GAME_MODES.SURF]: {
    scrollSpeed: 4,
    bgLayers: [
      {id: "surf-bg-far", parallaxFactor: 0.1},
      {id: "surf-bg-mid", parallaxFactor: 0.3},
      {id: "surf-bg-near", parallaxFactor: 0.6},
    ],
    obstacleTypes: ["buoy", "swimmer", "rock", "driftwood"],
    collectibleTypes: ["coin", "powerup", "score_boost", "wave_boost"],
  },
};

/**
 * Scoring settings for each game mode
 */
export const SCORING_CONFIG = {
  [GAME_MODES.SKATE]: {
    baseTrickPoints: 100,
    comboMultiplier: 0.5, // Each trick in combo adds 0.5 to multiplier
    collectibleValue: {
      coin: 10,
      powerup: 50,
      score_boost: 200,
    },
    maxMultiplier: 10,
  },
  [GAME_MODES.SURF]: {
    baseTrickPoints: 120,
    comboMultiplier: 0.6,
    collectibleValue: {
      coin: 10,
      powerup: 50,
      score_boost: 200,
      wave_boost: 100,
    },
    tubeRidePointsPerSecond: 50,
    maxMultiplier: 10,
  },
};

/**
 * Get configuration for a specific game mode
 * @param {string} mode - Game mode identifier
 * @returns {Object} Complete configuration for the mode
 */
export function getGameModeConfig(mode) {
  if (!GAME_MODES[mode.toUpperCase()]) {
    console.warn(`Invalid game mode: ${mode}. Defaulting to skate mode.`);
    mode = GAME_MODES.SKATE;
  }

  return {
    physics: PHYSICS_CONFIG[mode],
    character: CHARACTER_CONFIG[mode],
    environment: ENVIRONMENT_CONFIG[mode],
    scoring: SCORING_CONFIG[mode],
  };
}

export default {
  MODES: GAME_MODES,
  PHYSICS: PHYSICS_CONFIG,
  CHARACTER: CHARACTER_CONFIG,
  ENVIRONMENT: ENVIRONMENT_CONFIG,
  SCORING: SCORING_CONFIG,
  getConfig: getGameModeConfig,
};
