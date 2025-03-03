/**
 * Animation system
 * Manages sprite animations and transitions
 */

export default class AnimationSystem {
  /**
   * Create an animation system
   * @param {ResourceLoader} resources - Resource loader
   */
  constructor(resources) {
    this.resources = resources;
    this.animations = {};
    this.activeAnimations = {};
    this.lastFrameTime = 0;
  }

  /**
   * Define a new animation
   * @param {string} name - Animation name
   * @param {string} spritesheet - Spritesheet resource ID
   * @param {Array} frames - Animation frames
   * @param {number} frameRate - Frames per second
   * @param {Object} options - Additional options
   */
  define(name, spritesheet, frames, frameRate, options = {}) {
    const frameTime = 1000 / frameRate;

    // Process frames if they are just indices
    const processedFrames = frames.map((frame) => {
      if (typeof frame === "number") {
        // If frame is just a number, calculate x and y based on options
        const frameWidth = options.frameWidth || 32;
        const frameHeight = options.frameHeight || 32;
        const framesPerRow = options.framesPerRow || 10;

        const x = (frame % framesPerRow) * frameWidth;
        const y = Math.floor(frame / framesPerRow) * frameHeight;

        return {
          x,
          y,
          width: frameWidth,
          height: frameHeight,
        };
      }
      return frame;
    });

    this.animations[name] = {
      spritesheet,
      frames: processedFrames,
      frameTime,
      loop: options.loop !== undefined ? options.loop : true,
      scale: options.scale || 1,
      offsetX: options.offsetX || 0,
      offsetY: options.offsetY || 0,
      flippable: options.flippable !== undefined ? options.flippable : true,
      onComplete: options.onComplete || null,
    };
  }

  /**
   * Start playing an animation
   * @param {string} id - Instance ID
   * @param {string} name - Animation name
   * @param {Object} options - Playback options
   * @returns {boolean} Whether animation was successfully started
   */
  play(id, name, options = {}) {
    if (!this.animations[name]) {
      console.warn(`Animation not found: ${name}`);
      return false;
    }

    const animation = this.animations[name];
    const flipped = options.flipped || false;

    // Don't restart if already playing this animation with same flip state
    if (
      this.activeAnimations[id] &&
      this.activeAnimations[id].name === name &&
      this.activeAnimations[id].flipped === flipped &&
      !options.restart
    ) {
      return true;
    }

    this.activeAnimations[id] = {
      name,
      flipped: animation.flippable ? flipped : false,
      currentFrame: 0,
      frameTime: animation.frameTime,
      lastUpdateTime: performance.now(),
      finished: false,
      options,
    };

    return true;
  }

  /**
   * Stop an animation
   * @param {string} id - Animation instance ID
   */
  stop(id) {
    if (this.activeAnimations[id]) {
      delete this.activeAnimations[id];
    }
  }

  /**
   * Update all active animations
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime = 1 / 60) {
    const currentTime = performance.now();

    for (const id in this.activeAnimations) {
      const instance = this.activeAnimations[id];
      const animation = this.animations[instance.name];

      if (!animation) continue;

      // Check if enough time has passed to advance the frame
      if (currentTime - instance.lastUpdateTime >= animation.frameTime) {
        instance.currentFrame++;
        instance.lastUpdateTime = currentTime;

        // Handle end of animation
        if (instance.currentFrame >= animation.frames.length) {
          if (animation.loop) {
            instance.currentFrame = 0;
          } else {
            instance.currentFrame = animation.frames.length - 1;
            instance.finished = true;

            // Call completion callback
            if (animation.onComplete) {
              animation.onComplete(id, instance.name);
            }

            // Call instance completion callback
            if (instance.options.onComplete) {
              instance.options.onComplete(id, instance.name);
            }

            // Stop animation if not looping
            if (instance.options.autoRemove !== false) {
              this.stop(id);
            }
          }
        }
      }
    }

    this.lastFrameTime = currentTime;
  }

  /**
   * Draw an animation
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} id - Animation instance ID
   */
  draw(context, x, y, id) {
    const instance = this.activeAnimations[id];
    if (!instance) return;

    const animation = this.animations[instance.name];
    if (!animation) return;

    const frame = animation.frames[instance.currentFrame];
    if (!frame) return;

    const spritesheet = this.resources.get(animation.spritesheet);
    if (!spritesheet) return;

    // Save context for transformations
    context.save();

    // Apply options
    const scale = instance.options.scale || animation.scale;
    const offsetX = instance.options.offsetX || animation.offsetX;
    const offsetY = instance.options.offsetY || animation.offsetY;

    // Handle flipping
    if (instance.flipped) {
      context.translate(x + frame.width * scale, y);
      context.scale(-1, 1);
      x = 0;
    }

    // Draw the frame
    context.drawImage(
      spritesheet,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      x + offsetX,
      y + offsetY,
      frame.width * scale,
      frame.height * scale
    );

    // Restore context
    context.restore();
  }

  /**
   * Get current frame for an animation
   * @param {string} id - Animation instance ID
   * @returns {Object|null} Current frame or null
   */
  getCurrentFrame(id) {
    const instance = this.activeAnimations[id];
    if (!instance) return null;

    const animation = this.animations[instance.name];
    if (!animation) return null;

    return animation.frames[instance.currentFrame];
  }

  /**
   * Check if an animation has finished
   * @param {string} id - Animation instance ID
   * @returns {boolean} Whether animation is finished
   */
  isFinished(id) {
    return this.activeAnimations[id] && this.activeAnimations[id].finished;
  }

  /**
   * Check if an animation is currently playing
   * @param {string} id - Animation instance ID
   * @returns {boolean} Whether animation is playing
   */
  isPlaying(id) {
    return !!this.activeAnimations[id];
  }

  /**
   * Get animation instance state
   * @param {string} id - Animation instance ID
   * @returns {Object|null} Animation state or null
   */
  getState(id) {
    if (!this.activeAnimations[id]) return null;

    const instance = this.activeAnimations[id];
    const animation = this.animations[instance.name];

    return {
      name: instance.name,
      currentFrame: instance.currentFrame,
      totalFrames: animation ? animation.frames.length : 0,
      progress: animation ? instance.currentFrame / animation.frames.length : 0,
      flipped: instance.flipped,
      finished: instance.finished,
    };
  }

  /**
   * Create a sprite animation from a sprite sheet
   * @param {string} name - Animation name
   * @param {string} spritesheet - Spritesheet resource ID
   * @param {number} startFrame - Starting frame
   * @param {number} endFrame - Ending frame
   * @param {number} frameRate - Frames per second
   * @param {Object} options - Additional options
   */
  createFromRange(
    name,
    spritesheet,
    startFrame,
    endFrame,
    frameRate,
    options = {}
  ) {
    const frames = [];

    for (let i = startFrame; i <= endFrame; i++) {
      frames.push(i);
    }

    this.define(name, spritesheet, frames, frameRate, options);
  }

  /**
   * Create animations from a JSON definition
   * @param {Object} animationData - Animation definitions
   */
  createFromJSON(animationData) {
    for (const name in animationData) {
      const def = animationData[name];

      this.define(
        name,
        def.spritesheet,
        def.frames,
        def.frameRate,
        def.options || {}
      );
    }
  }

  /**
   * Load and create animations from a JSON file
   * @param {string} url - JSON file URL
   * @returns {Promise} Promise that resolves when animations are loaded
   */
  loadFromJSON(url) {
    return fetch(url)
      .then((response) => response.json())
      .then((data) => {
        this.createFromJSON(data);
        return data;
      });
  }
}
