import Game from './game';

document.addEventListener('DOMContentLoaded', () => {
  // Get the canvas element
  const canvas = document.getElementById('game-canvas');
  
  // Create a loading screen handler
  const loadingScreen = document.getElementById('loading-screen');
  const loadingBar = document.getElementById('loading-bar');
  
  // Create the game instance
  const game = new Game(canvas);
  
  // Show loading screen
  loadingScreen.style.display = 'flex';
  loadingBar.style.width = '0%';
  
  // Setup loading progress callback
  game.onLoadProgress = (progress) => {
    loadingBar.style.width = `${progress * 100}%`;
  };

  // Load assets first, then initialize
  game.loadAssets()
    .then(() => {
      // Hide loading screen with fade
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        loadingScreen.style.opacity = '1';
      }, 500);
      
      // Initialize and start the game
      game.initialize();
    })
    .catch(error => {
      console.error('Error loading game assets:', error);
      // Show error on loading screen
      const loadingText = loadingScreen.querySelector('p');
      if (loadingText) {
        loadingText.textContent = 'Error loading game assets. Please refresh the page.';
        loadingText.style.color = 'red';
      }
    });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    // Resize canvas to fill browser window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Notify game of resize
    if (game.handleResize) {
      game.handleResize(canvas.width, canvas.height);
    }
  });
  
  // Trigger initial resize
  window.dispatchEvent(new Event('resize'));
});
