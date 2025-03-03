/**
 * Scoring system
 * Handles points, combos, multipliers, and level goals
 */

import {GAME_MODES} from "../constants/game-modes";
import {saveHighScores, loadHighScores} from "../utils/storage";

export default class ScoringSystem {
  /**
   * Create a scoring system
   * @param {string} mode - Game mode ('skate' or 'surf')
   * @param {Object} levelData - Current level data
   */
  constructor(mode = GAME_MODES.SKATE, levelData = null) {
    this.gameMode = mode;
    this.levelData = levelData;

    // Core scoring
    this.score = 0;
    this.highScore = 0;
    this.multiplier = 1.0;
    this.comboPoints = 0;

    // Combo tracking
    this.currentCombo = [];
    this.comboTimer = 0;
    this.maxComboTimer = 120; // 2 seconds at 60fps
    this.longestCombo = 0;

    // Special scoring modes
    this.specialModeActive = false;
    this.specialModeTimer = 0;
    this.specialModeMultiplier = 1.0;

    // Level progression
    this.levelProgress = 0;
    this.levelComplete = false;
    this.objectivesComplete = false;

    // Tracking
    this.totalTricks = 0;
    this.uniqueTricks = {};
    this.collectiblesGathered = 0;
    this.specialGoalsProgress = {};

    // Achievement system
    this.achievements = {};
    this.unlockedAchievements = [];

    // Score history
    this.scoreHistory = [];
    this.pointsBreakdown = {
      tricks: 0,
      collectibles: 0,
      combos: 0,
      special: 0,
    };

    // Initialize
    this.loadHighScore();
    this.initializeSpecialGoals();
  }

  /**
   * Load high score from storage
   */
  loadHighScore() {
    const highScores = loadHighScores();
    if (highScores && highScores[this.gameMode]) {
      this.highScore = highScores[this.gameMode];
    }
  }

  /**
   * Save high score to storage
   */
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;

      const highScores = loadHighScores() || {};
      highScores[this.gameMode] = this.highScore;

      saveHighScores(highScores);
    }
  }

  /**
   * Initialize special goals tracking based on level data
   */
  initializeSpecialGoals() {
    if (
      !this.levelData ||
      !this.levelData.objectives ||
      !this.levelData.objectives.specialGoals
    ) {
      return;
    }

    for (const goal of this.levelData.objectives.specialGoals) {
      this.specialGoalsProgress[goal.type] = {
        current: 0,
        target: goal.count || goal.duration || 1,
        complete: false,
        label: goal.label,
        trickId: goal.trickId,
      };
    }
  }

  /**
   * Add points to the score
   * @param {number} points - Base points to add
   * @param {string} source - Source of points
   * @returns {Object} Points info
   */
  addPoints(points, source = "generic") {
    // Calculate total points with multipliers
    const totalPoints = Math.floor(
      points * this.multiplier * this.specialModeMultiplier
    );

    // Add to current score
    this.score += totalPoints;

    // Update level progress if we have level data
    if (
      this.levelData &&
      this.levelData.objectives &&
      this.levelData.objectives.scoreTarget
    ) {
      this.levelProgress = Math.min(
        1.0,
        this.score / this.levelData.objectives.scoreTarget
      );

      // Check if level score goal is met
      if (this.score >= this.levelData.objectives.scoreTarget) {
        this.checkLevelComplete();
      }
    }

    // Track score breakdown
    switch (source) {
      case "trick":
        this.pointsBreakdown.tricks += totalPoints;
        break;
      case "collectible":
        this.pointsBreakdown.collectibles += totalPoints;
        break;
      case "combo":
        this.pointsBreakdown.combos += totalPoints;
        break;
      case "special":
        this.pointsBreakdown.special += totalPoints;
        break;
    }

    // Add to score history
    this.scoreHistory.push({
      points: totalPoints,
      basePoints: points,
      multiplier: this.multiplier,
      specialMultiplier: this.specialModeMultiplier,
      source: source,
      timestamp: Date.now(),
    });

    // Trim history if it gets too long
    if (this.scoreHistory.length > 50) {
      this.scoreHistory = this.scoreHistory.slice(-50);
    }

    // Return the total points awarded (for UI feedback)
    return {
      basePoints: points,
      multiplier: this.multiplier,
      specialMultiplier: this.specialModeMultiplier,
      totalPoints: totalPoints,
      source: source,
    };
  }

  /**
   * Record a performed trick
   * @param {Object} trick - Trick definition
   * @param {number} trickScore - Score earned for the trick
   * @returns {Object} Combo info
   */
  recordTrick(trick, trickScore) {
    // Add to trick counters
    this.totalTricks++;
    this.uniqueTricks[trick.id] = true;

    // Add to current combo
    this.currentCombo.push({
      name: trick.name,
      id: trick.id,
      score: trickScore,
      time: Date.now(),
    });

    // Reset combo timer
    this.comboTimer = this.maxComboTimer;

    // Update multiplier based on combo length
    this.multiplier = Math.min(
      10.0,
      1.0 + (this.currentCombo.length - 1) * 0.5
    );

    // Add combo points based on trick score
    this.comboPoints += trickScore;

    // Update longest combo
    if (this.currentCombo.length > this.longestCombo) {
      this.longestCombo = this.currentCombo.length;
    }

    // Update special goals progress
    this.updateSpecialGoals("PERFORM_TRICK", 1, trick.id);

    if (this.currentCombo.length >= 3) {
      this.updateSpecialGoals("COMBO", this.currentCombo.length);
    }

    // Return current combo info for UI
    return {
      comboLength: this.currentCombo.length,
      multiplier: this.multiplier,
      comboPoints: this.comboPoints,
      lastTrick: trick.name,
      lastScore: trickScore,
    };
  }

  /**
   * Update special goals progress
   * @param {string} type - Goal type
   * @param {number} value - Progress value
   * @param {string} id - Optional ID (e.g., trick ID)
   */
  updateSpecialGoals(type, value = 1, id = null) {
    // Special handling for trick-specific goals
    if (type === "PERFORM_TRICK" && id) {
      // Check for goals that match this specific trick
      const trickGoalKey = `${type}_${id}`;
      if (this.specialGoalsProgress[trickGoalKey]) {
        this.specialGoalsProgress[trickGoalKey].current += value;

        if (
          this.specialGoalsProgress[trickGoalKey].current >=
          this.specialGoalsProgress[trickGoalKey].target
        ) {
          this.specialGoalsProgress[trickGoalKey].complete = true;
        }
      }
    }

    // General goal progress
    if (this.specialGoalsProgress[type]) {
      // Handle combo goals (only update if better than current)
      if (type === "COMBO") {
        this.specialGoalsProgress[type].current = Math.max(
          this.specialGoalsProgress[type].current,
          value
        );
      } else {
        this.specialGoalsProgress[type].current += value;
      }

      if (
        this.specialGoalsProgress[type].current >=
        this.specialGoalsProgress[type].target
      ) {
        this.specialGoalsProgress[type].complete = true;
      }
    }

    // Check if all special goals are complete
    this.checkSpecialGoalsComplete();
  }

  /**
   * Check if all special goals are complete
   */
  checkSpecialGoalsComplete() {
    if (
      !this.levelData ||
      !this.levelData.objectives ||
      !this.levelData.objectives.specialGoals
    ) {
      return;
    }

    let allComplete = true;

    for (const key in this.specialGoalsProgress) {
      if (!this.specialGoalsProgress[key].complete) {
        allComplete = false;
        break;
      }
    }

    this.objectivesComplete = allComplete;

    // Check overall level completion
    this.checkLevelComplete();
  }

  /**
   * Update system state
   */
  update() {
    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer--;

      // If combo timer expires, finalize combo
      if (this.comboTimer === 0) {
        this.finalizeCombo();
      }
    }

    // Update special mode timer
    if (this.specialModeActive && this.specialModeTimer > 0) {
      this.specialModeTimer--;

      if (this.specialModeTimer === 0) {
        this.endSpecialMode();
      }
    }
  }

  /**
   * Finalize the current combo
   */
  finalizeCombo() {
    // Add combo points to score if combo has more than 1 trick
    if (this.currentCombo.length > 1) {
      // Bonus for longer combos
      const comboLengthBonus = this.currentCombo.length * 100;

      // Add combo points to score
      this.addPoints(this.comboPoints + comboLengthBonus, "combo");

      // Reset combo data
      this.comboPoints = 0;
    }

    // Reset combo
    this.currentCombo = [];
    this.multiplier = 1.0;
  }

  /**
   * Start special scoring mode
   * @param {number} duration - Duration in seconds
   * @param {number} multiplier - Score multiplier
   * @returns {Object} Special mode info
   */
  startSpecialMode(duration, multiplier) {
    this.specialModeActive = true;
    this.specialModeTimer = duration * 60; // Convert seconds to frames
    this.specialModeMultiplier = multiplier;

    return {
      active: true,
      duration: duration,
      multiplier: multiplier,
    };
  }

  /**
   * End special scoring mode
   * @returns {Object} Special mode info
   */
  endSpecialMode() {
    this.specialModeActive = false;
    this.specialModeMultiplier = 1.0;

    return {
      active: false,
    };
  }

  /**
   * Record collectible collection
   * @param {Object} collectible - Collectible data
   * @returns {Object} Collectible info
   */
  recordCollectible(collectible) {
    // Add points for the collectible
    this.addPoints(collectible.value, "collectible");

    // Increment collectibles counter
    this.collectiblesGathered++;

    // Check collectibles objective
    if (
      this.levelData &&
      this.levelData.objectives &&
      this.levelData.objectives.collectiblesTarget
    ) {
      // Update collectibles progress
      this.updateSpecialGoals("COLLECTIBLES");

      // Check if collectibles target is met
      if (
        this.collectiblesGathered >=
        this.levelData.objectives.collectiblesTarget
      ) {
        this.checkLevelComplete();
      }
    }

    return {
      value: collectible.value,
      type: collectible.subType,
      totalCollected: this.collectiblesGathered,
    };
  }

  /**
   * Check if level is complete
   * @returns {Object} Level completion status
   */
  checkLevelComplete() {
    if (!this.levelData || !this.levelData.objectives) {
      return {complete: false};
    }

    // Check score target
    const scoreComplete =
      !this.levelData.objectives.scoreTarget ||
      this.score >= this.levelData.objectives.scoreTarget;

    // Check collectibles target
    const collectiblesComplete =
      !this.levelData.objectives.collectiblesTarget ||
      this.collectiblesGathered >= this.levelData.objectives.collectiblesTarget;

    // Level is complete if all objectives are met
    this.levelComplete =
      scoreComplete && collectiblesComplete && this.objectivesComplete;

    // Save high score if level is complete
    if (this.levelComplete) {
      this.saveHighScore();
    }

    return {
      complete: this.levelComplete,
      scoreComplete,
      collectiblesComplete,
      objectivesComplete: this.objectivesComplete,
    };
  }

  /**
   * Get current game score state
   * @returns {Object} Game score state
   */
  getScoreState() {
    return {
      score: this.score,
      highScore: this.highScore,
      multiplier: this.multiplier,
      specialMode: {
        active: this.specialModeActive,
        multiplier: this.specialModeMultiplier,
        timeRemaining: this.specialModeTimer / 60, // Convert to seconds
      },
      combo: {
        length: this.currentCombo.length,
        points: this.comboPoints,
        timeRemaining: this.comboTimer / 60, // Convert to seconds
        longestCombo: this.longestCombo,
      },
      level: {
        progress: this.levelProgress,
        complete: this.levelComplete,
      },
      stats: {
        totalTricks: this.totalTricks,
        uniqueTricks: Object.keys(this.uniqueTricks).length,
        collectiblesGathered: this.collectiblesGathered,
      },
      breakdown: this.pointsBreakdown,
    };
  }

  /**
   * Get special goals progress
   * @returns {Object} Special goals progress
   */
  getSpecialGoalsProgress() {
    return this.specialGoalsProgress;
  }

  /**
   * Reset scoring system
   */
  reset() {
    this.score = 0;
    this.multiplier = 1.0;
    this.comboPoints = 0;
    this.currentCombo = [];
    this.comboTimer = 0;
    this.specialModeActive = false;
    this.specialModeTimer = 0;
    this.specialModeMultiplier = 1.0;
    this.levelProgress = 0;
    this.levelComplete = false;
    this.objectivesComplete = false;
    this.totalTricks = 0;
    this.uniqueTricks = {};
    this.collectiblesGathered = 0;
    this.scoreHistory = [];
    this.pointsBreakdown = {
      tricks: 0,
      collectibles: 0,
      combos: 0,
      special: 0,
    };

    // Reset special goals progress
    this.initializeSpecialGoals();
  }
}
