/**
 * Input handling system
 * Manages keyboard, touch, and gamepad input
 */

export default class InputHandler {
  constructor() {
    // Key states
    this.keys = {};

    // Touch states
    this.touches = {};

    // Gamepad state
    this.gamepad = null;
    this.gamepadButtons = {};

    // Input mapping
    this.keyMapping = {
      // Default key mapping (can be customized)
      "ArrowLeft": "left",
      "ArrowRight": "right",
      "ArrowUp": "up",
      "ArrowDown": "down",
      "KeyA": "left",
      "KeyD": "d",  // D key for surf mode
      "KeyW": "up",
      "KeyS": "s",  // S key for skate mode
      "Space": "start",  // Space to start game
      "Enter": "start",  // Also allow Enter to start
      "KeyZ": "trick1",
      "KeyX": "trick2",
      "KeyC": "trick3",
      "Escape": "menu",
      "KeyP": "pause",
    };

    // Gamepad button mapping
    this.gamepadMapping = {
      0: "jump", // A button
      1: "trick1", // B button
      2: "trick2", // X button
      3: "trick3", // Y button
      9: "pause", // Start button
      8: "menu", // Select button
    };

    // Touch zones
    this.touchZones = {
      left: {x: 20, y: "bottom", width: 80, height: 80},
      right: {x: 120, y: "bottom", width: 80, height: 80},
      jump: {x: "right", y: "bottom", width: 80, height: 80, offset: 120},
      trick1: {x: "right", y: "bottom", width: 80, height: 80, offset: 20},
    };

    // Key change callbacks
    this.onKeyChange = null;

    // Initial setup
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Keyboard events
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));

    // Touch events (for mobile)
    if ("ontouchstart" in window) {
      this.setupTouchListeners();
    }

    // Gamepad events
    window.addEventListener(
      "gamepadconnected",
      this.handleGamepadConnected.bind(this)
    );
    window.addEventListener(
      "gamepaddisconnected",
      this.handleGamepadDisconnected.bind(this)
    );

    // Window focus/blur events
    window.addEventListener("blur", this.handleWindowBlur.bind(this));
  }

  /**
   * Set up touch listeners
   */
  setupTouchListeners() {
    document.addEventListener("touchstart", this.handleTouchStart.bind(this));
    document.addEventListener("touchmove", this.handleTouchMove.bind(this));
    document.addEventListener("touchend", this.handleTouchEnd.bind(this));
    document.addEventListener("touchcancel", this.handleTouchEnd.bind(this));
  }

  /**
   * Handle key down event
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    const key = event.code;

    // Skip if key is already pressed
    if (this.keys[key]) return;

    // Update key state
    this.keys[key] = true;

    // Map key to game action
    if (this.keyMapping[key]) {
      const action = this.keyMapping[key];

      // Notify of key change
      if (this.onKeyChange) {
        this.onKeyChange(action, true);
      }
    }
  }

  /**
   * Handle key up event
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyUp(event) {
    const key = event.code;

    // Update key state
    this.keys[key] = false;

    // Map key to game action
    if (this.keyMapping[key]) {
      const action = this.keyMapping[key];

      // Notify of key change
      if (this.onKeyChange) {
        this.onKeyChange(action, false);
      }
    }
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
    event.preventDefault();

    // Process each touch point
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];

      // Store touch data
      this.touches[touch.identifier] = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        action: this.getTouchZoneAction(touch.clientX, touch.clientY),
      };

      // Update action state
      if (this.touches[touch.identifier].action) {
        const action = this.touches[touch.identifier].action;

        // Notify of key change
        if (this.onKeyChange) {
          this.onKeyChange(action, true);
        }
      }
    }
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
    event.preventDefault();

    // Process each touch point
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];

      // Skip if touch not tracked
      if (!this.touches[touch.identifier]) continue;

      // Get previous action
      const prevAction = this.touches[touch.identifier].action;

      // Update touch data
      this.touches[touch.identifier].x = touch.clientX;
      this.touches[touch.identifier].y = touch.clientY;
      this.touches[touch.identifier].action = this.getTouchZoneAction(
        touch.clientX,
        touch.clientY
      );

      // Check if action changed
      if (prevAction !== this.touches[touch.identifier].action) {
        // Notify of previous action end
        if (prevAction && this.onKeyChange) {
          this.onKeyChange(prevAction, false);
        }

        // Notify of new action start
        if (this.touches[touch.identifier].action && this.onKeyChange) {
          this.onKeyChange(this.touches[touch.identifier].action, true);
        }
      }
    }
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
    event.preventDefault();

    // Process each touch point
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];

      // Skip if touch not tracked
      if (!this.touches[touch.identifier]) continue;

      // Notify of action end
      if (this.touches[touch.identifier].action && this.onKeyChange) {
        this.onKeyChange(this.touches[touch.identifier].action, false);
      }

      // Remove touch data
      delete this.touches[touch.identifier];
    }
  }

  /**
   * Get action for touch zone
   * @param {number} x - Touch X position
   * @param {number} y - Touch Y position
   * @returns {string|null} Action name or null
   */
  getTouchZoneAction(x, y) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Check each touch zone
    for (const action in this.touchZones) {
      const zone = this.touchZones[action];

      // Calculate zone position
      const zoneX =
        typeof zone.x === "string"
          ? zone.x === "right"
            ? windowWidth - zone.width - (zone.offset || 0)
            : 0
          : zone.x;

      const zoneY =
        typeof zone.y === "string"
          ? zone.y === "bottom"
            ? windowHeight - zone.height - 20
            : 0
          : zone.y;

      // Check if touch is in zone
      if (
        x >= zoneX &&
        x <= zoneX + zone.width &&
        y >= zoneY &&
        y <= zoneY + zone.height
      ) {
        return action;
      }
    }

    return null;
  }

  /**
   * Handle gamepad connected event
   * @param {GamepadEvent} event - Gamepad event
   */
  handleGamepadConnected(event) {
    this.gamepad = event.gamepad;
    console.log(`Gamepad connected: ${this.gamepad.id}`);
  }

  /**
   * Handle gamepad disconnected event
   * @param {GamepadEvent} event - Gamepad event
   */
  handleGamepadDisconnected(event) {
    if (this.gamepad && this.gamepad.index === event.gamepad.index) {
      // Reset gamepad buttons
      for (const button in this.gamepadButtons) {
        if (this.gamepadButtons[button] && this.onKeyChange) {
          const action = this.gamepadMapping[button];
          if (action) {
            this.onKeyChange(action, false);
          }
        }
      }

      // Reset gamepad state
      this.gamepad = null;
      this.gamepadButtons = {};

      console.log("Gamepad disconnected");
    }
  }

  /**
   * Handle window blur event
   */
  handleWindowBlur() {
    // Reset all inputs when window loses focus
    this.resetAllInputs();
  }

  /**
   * Update gamepad state
   */
  updateGamepad() {
    if (!this.gamepad) return;

    // Get fresh gamepad data
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gamepad = gamepads[this.gamepad.index];

    if (!gamepad) return;

    // Update button states
    for (let i = 0; i < gamepad.buttons.length; i++) {
      const pressed = gamepad.buttons[i].pressed;

      // Skip if state hasn't changed
      if (this.gamepadButtons[i] === pressed) continue;

      // Update button state
      this.gamepadButtons[i] = pressed;

      // Map button to game action
      if (this.gamepadMapping[i]) {
        const action = this.gamepadMapping[i];

        // Notify of key change
        if (this.onKeyChange) {
          this.onKeyChange(action, pressed);
        }
      }
    }

    // Handle D-pad as arrow keys
    this.handleGamepadAxes(gamepad);
  }

  /**
   * Handle gamepad axes
   * @param {Gamepad} gamepad - Gamepad object
   */
  handleGamepadAxes(gamepad) {
    // Left stick horizontal
    const leftX = gamepad.axes[0];

    if (leftX < -0.5 && !this.gamepadButtons.leftStickLeft) {
      this.gamepadButtons.leftStickLeft = true;
      if (this.onKeyChange) this.onKeyChange("left", true);
    } else if (leftX >= -0.5 && this.gamepadButtons.leftStickLeft) {
      this.gamepadButtons.leftStickLeft = false;
      if (this.onKeyChange) this.onKeyChange("left", false);
    }

    if (leftX > 0.5 && !this.gamepadButtons.leftStickRight) {
      this.gamepadButtons.leftStickRight = true;
      if (this.onKeyChange) this.onKeyChange("right", true);
    } else if (leftX <= 0.5 && this.gamepadButtons.leftStickRight) {
      this.gamepadButtons.leftStickRight = false;
      if (this.onKeyChange) this.onKeyChange("right", false);
    }

    // Left stick vertical
    const leftY = gamepad.axes[1];

    if (leftY < -0.5 && !this.gamepadButtons.leftStickUp) {
      this.gamepadButtons.leftStickUp = true;
      if (this.onKeyChange) this.onKeyChange("up", true);
    } else if (leftY >= -0.5 && this.gamepadButtons.leftStickUp) {
      this.gamepadButtons.leftStickUp = false;
      if (this.onKeyChange) this.onKeyChange("up", false);
    }

    if (leftY > 0.5 && !this.gamepadButtons.leftStickDown) {
      this.gamepadButtons.leftStickDown = true;
      if (this.onKeyChange) this.onKeyChange("down", true);
    } else if (leftY <= 0.5 && this.gamepadButtons.leftStickDown) {
      this.gamepadButtons.leftStickDown = false;
      if (this.onKeyChange) this.onKeyChange("down", false);
    }
  }

  /**
   * Check if a key is pressed
   * @param {string} key - Key name
   * @returns {boolean} Whether key is pressed
   */
  isKeyDown(key) {
    return !!this.keys[key];
  }

  /**
   * Check if a game action is active
   * @param {string} action - Game action
   * @returns {boolean} Whether action is active
   */
  isActionActive(action) {
    // Check mapped keys
    for (const key in this.keyMapping) {
      if (this.keyMapping[key] === action && this.isKeyDown(key)) {
        return true;
      }
    }

    // Check gamepad buttons
    for (const button in this.gamepadMapping) {
      if (
        this.gamepadMapping[button] === action &&
        this.gamepadButtons[button]
      ) {
        return true;
      }
    }

    // Check gamepad analog sticks
    const stickActions = {
      "left": this.gamepadButtons.leftStickLeft,
      "right": this.gamepadButtons.leftStickRight,
      "up": this.gamepadButtons.leftStickUp,
      "down": this.gamepadButtons.leftStickDown,
    };

    if (stickActions[action]) {
      return true;
    }

    // Check touches
    for (const id in this.touches) {
      if (this.touches[id].action === action) {
        return true;
      }
    }

    return false;
  }

  /**
   * Reset all inputs
   */
  resetAllInputs() {
    // Store previously active actions
    const activeActions = new Set();

    // Check which actions are active
    for (const key in this.keyMapping) {
      const action = this.keyMapping[key];
      if (this.isKeyDown(key) && action) {
        activeActions.add(action);
      }
    }

    // Add active gamepad actions
    for (const button in this.gamepadMapping) {
      const action = this.gamepadMapping[button];
      if (this.gamepadButtons[button] && action) {
        activeActions.add(action);
      }
    }

    // Add active touch actions
    for (const id in this.touches) {
      const action = this.touches[id].action;
      if (action) {
        activeActions.add(action);
      }
    }

    // Reset states
    this.keys = {};
    this.gamepadButtons = {};
    this.touches = {};

    // Notify of all action changes
    if (this.onKeyChange) {
      for (const action of activeActions) {
        this.onKeyChange(action, false);
      }
    }
  }

  /**
   * Update input state
   */
  update() {
    // Update gamepad state
    this.updateGamepad();
  }

  /**
   * Set key mapping
   * @param {Object} mapping - New key mapping
   */
  setKeyMapping(mapping) {
    this.keyMapping = mapping;
  }

  /**
   * Get current key mapping
   * @returns {Object} Current key mapping
   */
  getKeyMapping() {
    return {...this.keyMapping};
  }

  /**
   * Set gamepad mapping
   * @param {Object} mapping - New gamepad mapping
   */
  setGamepadMapping(mapping) {
    this.gamepadMapping = mapping;
  }

  /**
   * Create touch control elements
   * @param {HTMLElement} container - Container element
   */
  createTouchControls(container) {
    // Only create touch controls on touch devices
    if (!("ontouchstart" in window)) return;

    // Create touch controls
    for (const action in this.touchZones) {
      const zone = this.touchZones[action];

      // Calculate position
      const zoneX =
        typeof zone.x === "string"
          ? zone.x === "right"
            ? container.offsetWidth - zone.width - (zone.offset || 0)
            : 0
          : zone.x;

      const zoneY =
        typeof zone.y === "string"
          ? zone.y === "bottom"
            ? container.offsetHeight - zone.height - 20
            : 0
          : zone.y;

      // Create touch control element
      const control = document.createElement("div");
      control.className = `touch-control ${action}`;
      control.style.left = `${zoneX}px`;
      control.style.top = `${zoneY}px`;
      control.style.width = `${zone.width}px`;
      control.style.height = `${zone.height}px`;

      // Add control to container
      container.appendChild(control);
    }
  }
}
