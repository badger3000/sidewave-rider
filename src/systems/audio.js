/**
 * Audio Manager
 * Handles game sound effects and music
 */

export default class AudioManager {
  /**
   * Create an audio manager
   */
  constructor() {
    // Audio settings
    this.masterVolume = 1.0;
    this.musicVolume = 0.7;
    this.sfxVolume = 1.0;
    this.muted = false;

    // Audio resources
    this.sounds = {};
    this.music = null;
    this.currentMusicId = null;

    // Sound groups
    this.groups = {
      music: [],
      sfx: [],
      ui: [],
    };

    // Sound cooldowns (to prevent spamming)
    this.cooldowns = {};

    // Check audio support
    this.audioSupported = typeof Audio !== "undefined";
    if (!this.audioSupported) {
      console.warn("Audio is not supported in this browser");
    }
  }

  /**
   * Load a sound
   * @param {string} id - Sound identifier
   * @param {string} src - Sound file path
   * @param {string} group - Sound group
   * @param {Object} options - Additional options
   * @returns {boolean} Whether sound was loaded
   */
  loadSound(id, src, group = "sfx", options = {}) {
    if (!this.audioSupported) return false;

    if (this.sounds[id]) {
      console.warn(`Sound with ID "${id}" already exists`);
      return false;
    }

    try {
      const audio = new Audio(src);

      // Set options
      if (options.loop) audio.loop = true;
      if (options.volume !== undefined) audio.volume = options.volume;

      // Set initial volume based on group
      if (group === "music") {
        audio.volume = this.musicVolume * this.masterVolume;
      } else {
        audio.volume = this.sfxVolume * this.masterVolume;
      }

      // Store sound
      this.sounds[id] = {
        audio: audio,
        group: group,
        options: options,
        playing: false,
        loaded: false,
      };

      // Add to group
      if (this.groups[group]) {
        this.groups[group].push(id);
      } else {
        this.groups[group] = [id];
      }

      // Set loaded callback
      audio.addEventListener("canplaythrough", () => {
        this.sounds[id].loaded = true;
      });

      // Set ended callback
      audio.addEventListener("ended", () => {
        this.sounds[id].playing = false;

        // Call onEnd callback if provided
        if (options.onEnd) {
          options.onEnd();
        }
      });

      return true;
    } catch (error) {
      console.error(`Failed to load sound "${id}":`, error);
      return false;
    }
  }

  /**
   * Load multiple sounds
   * @param {Array} sounds - Array of sound objects
   * @returns {number} Number of successfully loaded sounds
   */
  loadSounds(sounds) {
    if (!this.audioSupported) return 0;

    let loadedCount = 0;

    for (const sound of sounds) {
      if (this.loadSound(sound.id, sound.src, sound.group, sound.options)) {
        loadedCount++;
      }
    }

    return loadedCount;
  }

  /**
   * Play a sound
   * @param {string} id - Sound identifier
   * @param {Object} options - Playback options
   * @returns {HTMLAudioElement|null} Audio element or null if failed
   */
  play(id, options = {}) {
    if (!this.audioSupported || this.muted) return null;

    const sound = this.sounds[id];
    if (!sound) {
      console.warn(`Sound "${id}" not found`);
      return null;
    }

    // Check cooldown
    const now = Date.now();
    if (this.cooldowns[id] && now < this.cooldowns[id]) {
      return null;
    }

    try {
      // For short sounds, it's better to create a new Audio instance
      // to allow overlapping playback
      let audioToPlay;

      if (options.overlap || sound.options.overlap) {
        // Create new audio instance for overlapping playback
        audioToPlay = new Audio(sound.audio.src);
        audioToPlay.volume = sound.audio.volume;
      } else {
        // Use existing audio instance
        audioToPlay = sound.audio;

        // Reset audio to beginning if it's already playing
        if (sound.playing) {
          audioToPlay.currentTime = 0;
        }
      }

      // Apply volume
      if (sound.group === "music") {
        audioToPlay.volume = this.musicVolume * this.masterVolume;
      } else {
        audioToPlay.volume = this.sfxVolume * this.masterVolume;
      }

      // Apply options
      if (options.volume !== undefined) {
        audioToPlay.volume *= options.volume;
      }

      if (options.loop !== undefined) {
        audioToPlay.loop = options.loop;
      }

      // Set cooldown if specified
      if (options.cooldown || sound.options.cooldown) {
        const cooldownTime = options.cooldown || sound.options.cooldown;
        this.cooldowns[id] = now + cooldownTime;
      }

      // Play the sound
      const playPromise = audioToPlay.play();

      // Handle promise (needed for modern browsers)
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error(`Error playing sound "${id}":`, error);
        });
      }

      // Update playing state
      sound.playing = true;

      // If this is music, pause any other music
      if (sound.group === "music" && !options.overlap) {
        this.pauseOtherMusic(id);
        this.currentMusicId = id;
      }

      return audioToPlay;
    } catch (error) {
      console.error(`Failed to play sound "${id}":`, error);
      return null;
    }
  }

  /**
   * Pause a sound
   * @param {string} id - Sound identifier
   * @returns {boolean} Whether sound was paused
   */
  pause(id) {
    if (!this.audioSupported) return false;

    const sound = this.sounds[id];
    if (!sound || !sound.playing) return false;

    try {
      sound.audio.pause();
      sound.playing = false;
      return true;
    } catch (error) {
      console.error(`Failed to pause sound "${id}":`, error);
      return false;
    }
  }

  /**
   * Stop a sound
   * @param {string} id - Sound identifier
   * @returns {boolean} Whether sound was stopped
   */
  stop(id) {
    if (!this.audioSupported) return false;

    const sound = this.sounds[id];
    if (!sound) return false;

    try {
      sound.audio.pause();
      sound.audio.currentTime = 0;
      sound.playing = false;
      return true;
    } catch (error) {
      console.error(`Failed to stop sound "${id}":`, error);
      return false;
    }
  }

  /**
   * Play music
   * @param {string} id - Music identifier
   * @param {boolean} fadeIn - Whether to fade in
   * @param {number} fadeTime - Fade time in milliseconds
   * @returns {HTMLAudioElement|null} Audio element or null if failed
   */
  playMusic(id, fadeIn = false, fadeTime = 1000) {
    if (!this.audioSupported) return null;

    const music = this.sounds[id];
    if (!music) {
      console.warn(`Music "${id}" not found`);
      return null;
    }

    // Stop current music
    if (this.currentMusicId && this.currentMusicId !== id) {
      this.stopMusic(fadeIn);
    }

    // Set as current music
    this.currentMusicId = id;

    // Start at zero volume if fading in
    if (fadeIn) {
      music.audio.volume = 0;
    }

    // Play the music
    const audioElement = this.play(id, {loop: true});

    // Fade in if requested
    if (fadeIn && audioElement) {
      this.fadeVolume(
        audioElement,
        0,
        this.musicVolume * this.masterVolume,
        fadeTime
      );
    }

    return audioElement;
  }

  /**
   * Stop music
   * @param {boolean} fadeOut - Whether to fade out
   * @param {number} fadeTime - Fade time in milliseconds
   * @returns {boolean} Whether music was stopped
   */
  stopMusic(fadeOut = false, fadeTime = 1000) {
    if (!this.audioSupported || !this.currentMusicId) return false;

    const music = this.sounds[this.currentMusicId];
    if (!music || !music.playing) return false;

    if (fadeOut) {
      // Fade out and then stop
      this.fadeVolume(music.audio, music.audio.volume, 0, fadeTime, () => {
        this.stop(this.currentMusicId);
        this.currentMusicId = null;
      });
      return true;
    } else {
      // Stop immediately
      this.stop(this.currentMusicId);
      this.currentMusicId = null;
      return true;
    }
  }

  /**
   * Pause music
   * @returns {boolean} Whether music was paused
   */
  pauseMusic() {
    if (!this.audioSupported || !this.currentMusicId) return false;

    return this.pause(this.currentMusicId);
  }

  /**
   * Resume music
   * @returns {boolean} Whether music was resumed
   */
  resumeMusic() {
    if (!this.audioSupported || !this.currentMusicId) return false;

    const music = this.sounds[this.currentMusicId];
    if (!music || music.playing) return false;

    try {
      music.audio.play();
      music.playing = true;
      return true;
    } catch (error) {
      console.error(`Failed to resume music "${this.currentMusicId}":`, error);
      return false;
    }
  }

  /**
   * Pause other music
   * @param {string} exceptId - Music ID to except
   */
  pauseOtherMusic(exceptId) {
    if (!this.audioSupported) return;

    for (const id of this.groups.music) {
      if (id !== exceptId) {
        this.pause(id);
      }
    }
  }

  /**
   * Fade sound volume
   * @param {HTMLAudioElement} audio - Audio element
   * @param {number} startVolume - Start volume
   * @param {number} endVolume - End volume
   * @param {number} duration - Fade duration in milliseconds
   * @param {Function} callback - Callback function
   */
  fadeVolume(audio, startVolume, endVolume, duration, callback) {
    if (!this.audioSupported || !audio) return;

    const startTime = Date.now();
    const volumeDiff = endVolume - startVolume;

    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      audio.volume = startVolume + volumeDiff * progress;

      if (progress >= 1) {
        clearInterval(fadeInterval);
        if (callback) callback();
      }
    }, 16);
  }

  /**
   * Set master volume
   * @param {number} volume - Volume (0-1)
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  /**
   * Set music volume
   * @param {number} volume - Volume (0-1)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateGroupVolume("music");
  }

  /**
   * Set SFX volume
   * @param {number} volume - Volume (0-1)
   */
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateGroupVolume("sfx");
    this.updateGroupVolume("ui");
  }

  /**
   * Mute all audio
   */
  mute() {
    this.muted = true;

    // Pause all playing sounds
    for (const id in this.sounds) {
      if (this.sounds[id].playing) {
        this.sounds[id].audio.pause();
      }
    }
  }

  /**
   * Unmute all audio
   */
  unmute() {
    this.muted = false;

    // Resume current music if any
    if (this.currentMusicId) {
      this.resumeMusic();
    }
  }

  /**
   * Toggle mute state
   * @returns {boolean} New mute state
   */
  toggleMute() {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }

    return this.muted;
  }

  /**
   * Update all sound volumes
   */
  updateAllVolumes() {
    for (const group in this.groups) {
      this.updateGroupVolume(group);
    }
  }

  /**
   * Update volume for a sound group
   * @param {string} group - Sound group
   */
  updateGroupVolume(group) {
    if (!this.audioSupported) return;

    const groupVolume = group === "music" ? this.musicVolume : this.sfxVolume;

    for (const id of this.groups[group] || []) {
      const sound = this.sounds[id];
      if (sound) {
        sound.audio.volume = groupVolume * this.masterVolume;
      }
    }
  }

  /**
   * Check if a sound is playing
   * @param {string} id - Sound identifier
   * @returns {boolean} Whether sound is playing
   */
  isPlaying(id) {
    if (!this.audioSupported) return false;

    const sound = this.sounds[id];
    return sound ? sound.playing : false;
  }

  /**
   * Get all playing sounds
   * @returns {Array} Array of playing sound IDs
   */
  getPlayingSounds() {
    if (!this.audioSupported) return [];

    const playingSounds = [];

    for (const id in this.sounds) {
      if (this.sounds[id].playing) {
        playingSounds.push(id);
      }
    }

    return playingSounds;
  }

  /**
   * Stop all sounds
   */
  stopAll() {
    if (!this.audioSupported) return;

    for (const id in this.sounds) {
      this.stop(id);
    }

    this.currentMusicId = null;
  }

  /**
   * Set position in current music
   * @param {number} position - Position in seconds
   * @returns {boolean} Whether position was set
   */
  setMusicPosition(position) {
    if (!this.audioSupported || !this.currentMusicId) return false;

    const music = this.sounds[this.currentMusicId];
    if (!music) return false;

    try {
      music.audio.currentTime = position;
      return true;
    } catch (error) {
      console.error(
        `Failed to set position for music "${this.currentMusicId}":`,
        error
      );
      return false;
    }
  }

  /**
   * Get current music position
   * @returns {number} Current position in seconds
   */
  getMusicPosition() {
    if (!this.audioSupported || !this.currentMusicId) return 0;

    const music = this.sounds[this.currentMusicId];
    if (!music) return 0;

    return music.audio.currentTime;
  }

  /**
   * Get current music duration
   * @returns {number} Music duration in seconds
   */
  getMusicDuration() {
    if (!this.audioSupported || !this.currentMusicId) return 0;

    const music = this.sounds[this.currentMusicId];
    if (!music) return 0;

    return music.audio.duration;
  }

  /**
   * Play a random sound from a group
   * @param {Array} group - Array of sound IDs
   * @param {Object} options - Playback options
   * @returns {string|null} Played sound ID or null
   */
  playRandom(group, options = {}) {
    if (!this.audioSupported || !group || group.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * group.length);
    const id = group[randomIndex];

    this.play(id, options);
    return id;
  }
}
