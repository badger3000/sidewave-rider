/**
 * Trick definitions for skateboarding and surfing modes
 */
import {GAME_MODES} from "./game-modes";

/**
 * Skateboarding trick definitions
 */
export const SKATE_TRICKS = {
  // Basic tricks
  OLLIE: {
    id: "ollie",
    name: "Ollie",
    baseScore: 50,
    difficulty: 1,
    frames: [0, 1, 2, 3],
    frameRate: 12,
    duration: 15,
    airOnly: true,
    animationName: "ollie",
    description: "Basic jump trick",
    input: {
      keys: ["SPACE"],
      buttons: ["A"],
    },
  },

  KICKFLIP: {
    id: "kickflip",
    name: "Kickflip",
    baseScore: 100,
    difficulty: 2,
    frames: [4, 5, 6, 7],
    frameRate: 12,
    duration: 20,
    airOnly: true,
    animationName: "kickflip",
    description: "Flip the board along its length",
    input: {
      keys: ["Z"],
      buttons: ["X"],
    },
  },

  HEELFLIP: {
    id: "heelflip",
    name: "Heelflip",
    baseScore: 120,
    difficulty: 2,
    frames: [8, 9, 10, 11],
    frameRate: 12,
    duration: 20,
    airOnly: true,
    animationName: "heelflip",
    description: "Opposite of a kickflip",
    input: {
      keys: ["X"],
      buttons: ["Y"],
    },
  },

  // Advanced tricks
  POP_SHUVIT: {
    id: "pop_shuvit",
    name: "Pop Shuvit",
    baseScore: 150,
    difficulty: 3,
    frames: [12, 13, 14, 15],
    frameRate: 12,
    duration: 25,
    airOnly: true,
    animationName: "pop_shuvit",
    description: "Board rotates 180° without the body rotating",
    input: {
      keys: ["C"],
      buttons: ["B"],
    },
  },

  IMPOSSIBLE: {
    id: "impossible",
    name: "Impossible",
    baseScore: 200,
    difficulty: 4,
    frames: [16, 17, 18, 19, 20],
    frameRate: 15,
    duration: 30,
    airOnly: true,
    animationName: "impossible",
    description: "Board wraps around your foot",
    input: {
      combo: ["X", "C"],
      buttons: ["Y", "B"],
    },
  },

  // Grinding tricks
  BOARDSLIDE: {
    id: "boardslide",
    name: "Boardslide",
    baseScore: 150,
    difficulty: 3,
    frames: [21, 22, 23],
    frameRate: 10,
    duration: 0, // Duration is determined by grind length
    airOnly: false,
    grindTrick: true,
    animationName: "boardslide",
    description: "Slide with the board perpendicular to the rail",
    input: {
      keys: ["SPACE"],
      buttons: ["A"],
    },
    scorePerSecond: 50,
  },

  NOSEGRIND: {
    id: "nosegrind",
    name: "Nosegrind",
    baseScore: 180,
    difficulty: 3,
    frames: [24, 25, 26],
    frameRate: 10,
    duration: 0, // Duration is determined by grind length
    airOnly: false,
    grindTrick: true,
    animationName: "nosegrind",
    description: "Grind using the front trucks",
    input: {
      keys: ["Z"],
      buttons: ["X"],
    },
    scorePerSecond: 60,
  },
};

/**
 * Surfing trick definitions
 */
export const SURF_TRICKS = {
  // Basic tricks
  BOTTOM_TURN: {
    id: "bottom_turn",
    name: "Bottom Turn",
    baseScore: 50,
    difficulty: 1,
    frames: [0, 1, 2],
    frameRate: 10,
    duration: 15,
    waveRequired: true,
    animationName: "bottom_turn",
    description: "Turn at the bottom of the wave",
    input: {
      keys: ["DOWN", "RIGHT"],
      buttons: ["DOWN", "RIGHT"],
    },
  },

  TOP_TURN: {
    id: "top_turn",
    name: "Top Turn",
    baseScore: 80,
    difficulty: 2,
    frames: [3, 4, 5],
    frameRate: 10,
    duration: 15,
    waveRequired: true,
    animationName: "top_turn",
    description: "Turn at the top of the wave",
    input: {
      keys: ["UP", "LEFT"],
      buttons: ["UP", "LEFT"],
    },
  },

  CUTBACK: {
    id: "cutback",
    name: "Cutback",
    baseScore: 100,
    difficulty: 2,
    frames: [6, 7, 8, 9],
    frameRate: 12,
    duration: 30,
    waveRequired: true,
    animationName: "cutback",
    description: "Change direction by 180 degrees",
    input: {
      keys: ["LEFT", "RIGHT"],
      buttons: ["LEFT", "RIGHT"],
    },
  },

  // Advanced tricks
  FLOATER: {
    id: "floater",
    name: "Floater",
    baseScore: 120,
    difficulty: 3,
    frames: [10, 11, 12, 13],
    frameRate: 12,
    duration: 25,
    waveRequired: true,
    animationName: "floater",
    description: "Float over the breaking section of a wave",
    input: {
      keys: ["UP"],
      buttons: ["UP"],
    },
  },

  OFF_THE_LIP: {
    id: "off_the_lip",
    name: "Off The Lip",
    baseScore: 150,
    difficulty: 3,
    frames: [14, 15, 16, 17],
    frameRate: 12,
    duration: 25,
    waveRequired: true,
    animationName: "off_the_lip",
    description: "Hit the lip of the wave",
    input: {
      keys: ["UP", "Z"],
      buttons: ["UP", "X"],
    },
  },

  // Special tricks
  TUBE_RIDE: {
    id: "tube_ride",
    name: "Tube Ride",
    baseScore: 200,
    difficulty: 4,
    frames: [18, 19, 20],
    frameRate: 10,
    duration: 0, // Duration is determined by tube length
    waveRequired: true,
    tubeTrick: true,
    animationName: "tube_ride",
    description: "Ride inside the barrel of the wave",
    input: {
      keys: ["DOWN"],
      buttons: ["DOWN"],
    },
    scorePerSecond: 100,
  },

  AERIAL: {
    id: "aerial",
    name: "Aerial",
    baseScore: 250,
    difficulty: 5,
    frames: [21, 22, 23, 24, 25],
    frameRate: 15,
    duration: 40,
    waveRequired: true,
    airTrick: true,
    animationName: "aerial",
    description: "Launch off the wave into the air",
    input: {
      keys: ["X", "UP"],
      buttons: ["Y", "UP"],
    },
  },
};

/**
 * Get all tricks for a specific game mode
 * @param {string} mode - Game mode
 * @returns {Object} Tricks for the specified mode
 */
export function getTricksForMode(mode) {
  switch (mode) {
    case GAME_MODES.SKATE:
      return SKATE_TRICKS;
    case GAME_MODES.SURF:
      return SURF_TRICKS;
    default:
      console.warn(`Invalid game mode: ${mode}. Defaulting to skate mode.`);
      return SKATE_TRICKS;
  }
}

/**
 * Get a specific trick by ID
 * @param {string} trickId - Trick identifier
 * @param {string} mode - Game mode
 * @returns {Object|null} Trick definition or null if not found
 */
export function getTrickById(trickId, mode) {
  const tricks = getTricksForMode(mode);

  for (const key in tricks) {
    if (tricks[key].id === trickId) {
      return tricks[key];
    }
  }

  console.warn(`Trick not found: ${trickId} in mode ${mode}`);
  return null;
}

export default {
  SKATE: SKATE_TRICKS,
  SURF: SURF_TRICKS,
  getForMode: getTricksForMode,
  getById: getTrickById,
};
