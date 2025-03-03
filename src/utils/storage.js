/**
 * Storage utilities for saving and loading game data
 */

// Prefix for all storage keys to avoid conflicts
const STORAGE_PREFIX = "sidewave_rider_";

/**
 * Save data to local storage
 * @param {string} key - Storage key
 * @param {*} data - Data to save (will be JSON stringified)
 * @returns {boolean} True if successful
 */
export function saveData(key, data) {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    const serializedData = JSON.stringify(data);
    localStorage.setItem(prefixedKey, serializedData);
    return true;
  } catch (error) {
    console.error("Error saving data to localStorage:", error);
    return false;
  }
}

/**
 * Load data from local storage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Loaded data or default value
 */
export function loadData(key, defaultValue = null) {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    const serializedData = localStorage.getItem(prefixedKey);

    if (serializedData === null) {
      return defaultValue;
    }

    return JSON.parse(serializedData);
  } catch (error) {
    console.error("Error loading data from localStorage:", error);
    return defaultValue;
  }
}

/**
 * Delete data from local storage
 * @param {string} key - Storage key to delete
 * @returns {boolean} True if successful
 */
export function deleteData(key) {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    localStorage.removeItem(prefixedKey);
    return true;
  } catch (error) {
    console.error("Error deleting data from localStorage:", error);
    return false;
  }
}

/**
 * Clear all game data from local storage
 * @returns {boolean} True if successful
 */
export function clearAllData() {
  try {
    // Only clear keys that belong to this game
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error("Error clearing all data from localStorage:", error);
    return false;
  }
}

/**
 * Save game high scores
 * @param {Array} scores - Array of score objects
 * @returns {boolean} True if successful
 */
export function saveHighScores(scores) {
  return saveData("high_scores", scores);
}

/**
 * Load game high scores
 * @returns {Array} Array of score objects or empty array
 */
export function loadHighScores() {
  return loadData("high_scores", []);
}

/**
 * Save game settings
 * @param {Object} settings - Game settings object
 * @returns {boolean} True if successful
 */
export function saveSettings(settings) {
  return saveData("settings", settings);
}

/**
 * Load game settings
 * @param {Object} defaultSettings - Default settings
 * @returns {Object} Game settings
 */
export function loadSettings(defaultSettings = {}) {
  return loadData("settings", defaultSettings);
}

/**
 * Save player progress
 * @param {Object} progress - Player progress data
 * @returns {boolean} True if successful
 */
export function saveProgress(progress) {
  return saveData("progress", progress);
}

/**
 * Load player progress
 * @returns {Object} Player progress data or empty object
 */
export function loadProgress() {
  return loadData("progress", {});
}

/**
 * Check if the browser supports localStorage
 * @returns {boolean} True if localStorage is supported
 */
export function isLocalStorageSupported() {
  try {
    const testKey = STORAGE_PREFIX + "test";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Initialize storage system
const storageSupported = isLocalStorageSupported();
if (!storageSupported) {
  console.warn(
    "localStorage is not supported in this browser. Game progress will not be saved."
  );
}

export default {
  save: saveData,
  load: loadData,
  delete: deleteData,
  clear: clearAllData,
  saveHighScores,
  loadHighScores,
  saveSettings,
  loadSettings,
  saveProgress,
  loadProgress,
  isSupported: storageSupported,
};
