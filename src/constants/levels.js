/**
 * Level definitions for skateboarding and surfing modes
 */
import {GAME_MODES} from "./game-modes";

/**
 * Skateboarding level definitions
 */
export const SKATE_LEVELS = [
  // Level 1: Skate Park
  {
    id: "skate_park",
    name: "Skate Park",
    description: "A beginner-friendly skate park with various obstacles",
    difficulty: 1,
    timeLimit: 120, // seconds
    backgroundLayers: ["skate-bg-far", "skate-bg-mid", "skate-bg-near"],
    music: "skate-theme-1",

    // Level objectives
    objectives: {
      scoreTarget: 5000,
      collectiblesTarget: 10,
      specialGoals: [
        {
          type: "PERFORM_TRICK",
          trickId: "ollie",
          count: 5,
          label: "Perform 5 Ollies",
        },
        {type: "COMBO", count: 3, label: "Perform a 3-trick combo"},
      ],
    },

    // Level layout settings
    layout: {
      length: 5000, // Total level length
      groundVariation: "low", // How much the ground height varies
      obstacleFrequency: 0.6, // 0-1, how often obstacles appear
      collectibleFrequency: 0.8, // 0-1, how often collectibles appear
    },

    // Specific obstacles for this level
    obstacles: [
      {type: "ramp", x: 500, height: 40, width: 80},
      {type: "rail", x: 800, length: 150, height: 20},
      {type: "gap", x: 1200, width: 100},
      {type: "bench", x: 1500, width: 120},
      {type: "ramp", x: 1800, height: 60, width: 100},
      {type: "halfpipe", x: 2200, width: 200, height: 80},
      {type: "rail", x: 2600, length: 200, height: 30},
      {type: "gap", x: 3000, width: 120},
      {type: "ramp", x: 3300, height: 50, width: 90},
      {type: "rail", x: 3700, length: 180, height: 25},
      {type: "bench", x: 4100, width: 100},
      {type: "ramp", x: 4500, height: 70, width: 110},
    ],

    // Special zones in this level
    specialZones: [
      {type: "trick_zone", x: 1000, width: 300, multiplier: 2},
      {type: "speed_boost", x: 2000, width: 200},
      {type: "score_multiplier", x: 3500, width: 300, multiplier: 3},
    ],
  },

  // Level 2: Downtown
  {
    id: "downtown",
    name: "Downtown",
    description: "Navigate the urban landscape and find skate spots",
    difficulty: 2,
    timeLimit: 150, // seconds
    backgroundLayers: [
      "downtown-bg-far",
      "downtown-bg-mid",
      "downtown-bg-near",
    ],
    music: "skate-theme-2",

    // Level objectives
    objectives: {
      scoreTarget: 15000,
      collectiblesTarget: 20,
      specialGoals: [
        {
          type: "PERFORM_TRICK",
          trickId: "kickflip",
          count: 5,
          label: "Perform 5 Kickflips",
        },
        {type: "GRIND", duration: 10, label: "Grind for 10 seconds total"},
        {type: "COMBO", count: 5, label: "Perform a 5-trick combo"},
      ],
    },

    // Level layout settings
    layout: {
      length: 7000, // Total level length
      groundVariation: "medium", // How much the ground height varies
      obstacleFrequency: 0.7, // 0-1, how often obstacles appear
      collectibleFrequency: 0.7, // 0-1, how often collectibles appear
    },

    // More complex obstacles for this level
    obstacles: [
      // Will be procedurally generated based on layout settings
      // Plus these specific ones
      {type: "stairs", x: 800, steps: 5},
      {type: "handrail", x: 805, length: 200, height: 40},
      {type: "planter", x: 1200, width: 100, height: 30},
      {type: "bench", x: 1500, width: 120},
      {type: "car", x: 2000, width: 200},
      {type: "stairs", x: 2500, steps: 8},
      {type: "handrail", x: 2505, length: 300, height: 60},
      {type: "gap", x: 3200, width: 150},
      {type: "planter", x: 3500, width: 120, height: 40},
      {type: "bench", x: 4000, width: 150},
      {type: "stairs", x: 4500, steps: 10},
      {type: "handrail", x: 4505, length: 350, height: 70},
      {type: "gap", x: 5200, width: 180},
      {type: "car", x: 5600, width: 220},
      {type: "planter", x: 6200, width: 130, height: 50},
    ],

    // Special zones
    specialZones: [
      {type: "trick_zone", x: 1800, width: 400, multiplier: 2},
      {type: "speed_boost", x: 3800, width: 300},
      {type: "score_multiplier", x: 5000, width: 400, multiplier: 3},
      {type: "trick_zone", x: 6000, width: 500, multiplier: 2.5},
    ],
  },

  // More levels would be defined here...
];

/**
 * Surfing level definitions
 */
export const SURF_LEVELS = [
  // Level 1: Beginner Beach
  {
    id: "beginner_beach",
    name: "Beginner Beach",
    description: "Gentle waves perfect for learning the basics",
    difficulty: 1,
    timeLimit: 120, // seconds
    backgroundLayers: ["surf-bg-far", "surf-bg-mid", "surf-bg-near"],
    music: "surf-theme-1",

    // Level objectives
    objectives: {
      scoreTarget: 5000,
      collectiblesTarget: 10,
      specialGoals: [
        {
          type: "PERFORM_TRICK",
          trickId: "bottom_turn",
          count: 5,
          label: "Perform 5 Bottom Turns",
        },
        {
          type: "PERFORM_TRICK",
          trickId: "top_turn",
          count: 3,
          label: "Perform 3 Top Turns",
        },
      ],
    },

    // Level layout settings
    layout: {
      length: 5000, // Total level length
      waveHeight: "low", // How tall the waves get
      waveFrequency: "medium", // How often waves come
      obstacleFrequency: 0.4, // 0-1, how often obstacles appear
      collectibleFrequency: 0.8, // 0-1, how often collectibles appear
    },

    // Wave sections
    waveSections: [
      {type: "normal", x: 0, length: 1000},
      {type: "breaking", x: 1000, length: 500},
      {type: "normal", x: 1500, length: 1000},
      {type: "breaking", x: 2500, length: 700},
      {type: "choppy", x: 3200, length: 800},
      {type: "normal", x: 4000, length: 1000},
    ],

    // Obstacles
    obstacles: [
      {type: "buoy", x: 800},
      {type: "swimmer", x: 1300},
      {type: "seaweed", x: 1800},
      {type: "buoy", x: 2300},
      {type: "driftwood", x: 2700},
      {type: "swimmer", x: 3200},
      {type: "rock", x: 3600},
      {type: "buoy", x: 4100},
      {type: "seaweed", x: 4500},
    ],

    // Special zones
    specialZones: [
      {type: "tube_zone", x: 1000, width: 500},
      {type: "score_multiplier", x: 2500, width: 400, multiplier: 2},
      {type: "wave_boost", x: 3500, width: 300},
    ],
  },

  // Level 2: Sunset Point
  {
    id: "sunset_point",
    name: "Sunset Point",
    description: "A popular spot with consistent waves and some challenges",
    difficulty: 2,
    timeLimit: 150, // seconds
    backgroundLayers: ["sunset-bg-far", "sunset-bg-mid", "sunset-bg-near"],
    music: "surf-theme-2",

    // Level objectives
    objectives: {
      scoreTarget: 15000,
      collectiblesTarget: 15,
      specialGoals: [
        {
          type: "PERFORM_TRICK",
          trickId: "cutback",
          count: 5,
          label: "Perform 5 Cutbacks",
        },
        {
          type: "PERFORM_TRICK",
          trickId: "floater",
          count: 3,
          label: "Perform 3 Floaters",
        },
        {
          type: "TUBE_RIDE",
          duration: 5,
          label: "Tube ride for 5 seconds total",
        },
      ],
    },

    // Level layout settings
    layout: {
      length: 7000, // Total level length
      waveHeight: "medium", // How tall the waves get
      waveFrequency: "high", // How often waves come
      obstacleFrequency: 0.6, // 0-1, how often obstacles appear
      collectibleFrequency: 0.7, // 0-1, how often collectibles appear
    },

    // Wave sections
    waveSections: [
      {type: "normal", x: 0, length: 800},
      {type: "breaking", x: 800, length: 600},
      {type: "normal", x: 1400, length: 800},
      {type: "choppy", x: 2200, length: 600},
      {type: "normal", x: 2800, length: 700},
      {type: "breaking", x: 3500, length: 800},
      {type: "normal", x: 4300, length: 700},
      {type: "choppy", x: 5000, length: 500},
      {type: "normal", x: 5500, length: 600},
      {type: "breaking", x: 6100, length: 900},
    ],

    // More obstacles
    obstacles: [
      // Will be procedurally generated based on layout settings
      // Plus these specific ones
      {type: "buoy", x: 500},
      {type: "swimmer", x: 900},
      {type: "rock", x: 1500},
      {type: "driftwood", x: 2000},
      {type: "seaweed", x: 2500},
      {type: "buoy", x: 3000},
      {type: "swimmer", x: 3500},
      {type: "rock", x: 4000},
      {type: "swimmer", x: 4500},
      {type: "driftwood", x: 5000},
      {type: "buoy", x: 5500},
      {type: "rock", x: 6000},
      {type: "seaweed", x: 6500},
    ],

    // Special zones
    specialZones: [
      {type: "tube_zone", x: 800, width: 600},
      {type: "score_multiplier", x: 2000, width: 500, multiplier: 2},
      {type: "wave_boost", x: 3000, width: 400},
      {type: "tube_zone", x: 3500, width: 800},
      {type: "score_multiplier", x: 5000, width: 500, multiplier: 3},
      {type: "tube_zone", x: 6100, width: 900},
    ],
  },

  // More levels would be defined here...
];

/**
 * Get all levels for a specific game mode
 * @param {string} mode - Game mode
 * @returns {Array} Array of level definitions
 */
export function getLevelsForMode(mode) {
  switch (mode) {
    case GAME_MODES.SKATE:
      return SKATE_LEVELS;
    case GAME_MODES.SURF:
      return SURF_LEVELS;
    default:
      console.warn(`Invalid game mode: ${mode}. Defaulting to skate mode.`);
      return SKATE_LEVELS;
  }
}

/**
 * Get a specific level by ID
 * @param {string} levelId - Level identifier
 * @param {string} mode - Game mode
 * @returns {Object|null} Level definition or null if not found
 */
export function getLevelById(levelId, mode) {
  const levels = getLevelsForMode(mode);

  for (const level of levels) {
    if (level.id === levelId) {
      return level;
    }
  }

  console.warn(`Level not found: ${levelId} in mode ${mode}`);
  return null;
}

/**
 * Get level by index/number
 * @param {number} index - Level index (0-based)
 * @param {string} mode - Game mode
 * @returns {Object|null} Level definition or null if not found
 */
export function getLevelByIndex(index, mode) {
  const levels = getLevelsForMode(mode);

  if (index >= 0 && index < levels.length) {
    return levels[index];
  }

  console.warn(`Level index out of bounds: ${index} in mode ${mode}`);
  return null;
}

export default {
  SKATE: SKATE_LEVELS,
  SURF: SURF_LEVELS,
  getForMode: getLevelsForMode,
  getById: getLevelById,
  getByIndex: getLevelByIndex,
};
