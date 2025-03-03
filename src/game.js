import ResourceLoader from "./systems/resources";

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.resources = new ResourceLoader();
    this.gameMode = "skate"; // 'skate' or 'surf'
    this.onLoadProgress = null;
    this.isRunning = false;
    this.lastFrameTime = 0;

    // Set up canvas
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Game state
    this.playerX = 100;
    this.playerY = 200;
    this.playerWidth = 32;
    this.playerHeight = 32;
    this.moveSpeed = 5;
  }

  loadAssets() {
    // Set up progress callback
    if (this.onLoadProgress) {
      this.resources.onProgress(this.onLoadProgress);
    }

    // For simplicity, let's simulate asset loading without actual assets
    // This fixes the issue if you don't have the actual files yet

    return new Promise((resolve) => {
      // Simulate loading progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.1;
        if (this.onLoadProgress) {
          this.onLoadProgress(Math.min(progress, 1));
        }

        if (progress >= 1) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });

    /* Uncomment this when you have actual assets
    // Define assets to load
    const assets = [
      { id: 'skater', type: 'spritesheet', src: '/assets/images/sprites/skater.png' },
      // Add your assets here as you create them
    ];
    
    // Start loading
    return this.resources.loadAll(assets);
    */
  }

  initialize() {
    // Set up event listeners
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));

    // Start game loop
    this.isRunning = true;
    requestAnimationFrame(this.gameLoop.bind(this));

    console.log("Game initialized and running!");
  }

  handleKeyDown(event) {
    // Handle key presses
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        this.playerX -= this.moveSpeed;
        break;
      case "ArrowRight":
      case "KeyD":
        this.playerX += this.moveSpeed;
        break;
      case "ArrowUp":
      case "KeyW":
        this.playerY -= this.moveSpeed;
        break;
      case "ArrowDown":
      case "KeyS":
        this.playerY += this.moveSpeed;
        break;
    }
  }

  handleKeyUp(event) {
    // Handle key releases
  }

  handleResize(width, height) {
    console.log(`Canvas resized to ${width}x${height}`);
  }

  update(deltaTime) {
    // Simple boundary checks
    if (this.playerX < 0) this.playerX = 0;
    if (this.playerX > this.canvas.width - this.playerWidth)
      this.playerX = this.canvas.width - this.playerWidth;
    if (this.playerY < 0) this.playerY = 0;
    if (this.playerY > this.canvas.height - this.playerHeight)
      this.playerY = this.canvas.height - this.playerHeight;
  }

  render() {
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background
    this.context.fillStyle = "#87CEEB"; // Sky blue
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw ground
    this.context.fillStyle = "#4CAF50"; // Green
    this.context.fillRect(0, this.canvas.height - 100, this.canvas.width, 100);

    // Draw player
    this.context.fillStyle = "#FF5722"; // Orange
    this.context.fillRect(
      this.playerX,
      this.playerY,
      this.playerWidth,
      this.playerHeight
    );

    // Draw instructions
    this.context.fillStyle = "white";
    this.context.font = "24px Arial";
    this.context.textAlign = "center";
    this.context.fillText(
      "Use Arrow Keys or WASD to move",
      this.canvas.width / 2,
      30
    );
    this.context.fillText(
      "Sidewave Rider - Setup Complete!",
      this.canvas.width / 2,
      70
    );
  }

  gameLoop(timestamp) {
    if (!this.isRunning) return;

    // Calculate delta time
    const deltaTime = timestamp - (this.lastFrameTime || timestamp);
    this.lastFrameTime = timestamp;

    // Update game state
    this.update(deltaTime);

    // Render frame
    this.render();

    // Continue loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  pause() {
    this.isRunning = false;
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      requestAnimationFrame(this.gameLoop.bind(this));
    }
  }
}
