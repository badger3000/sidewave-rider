/**
 * Resource loader for managing game assets
 */
export default class ResourceLoader {
  constructor() {
    this.resources = {};
    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.onProgressCallback = null;
    this.onCompleteCallback = null;
  }
  
  /**
   * Load a collection of assets
   * @param {Array} assetList - List of asset objects
   * @returns {Promise} - Promise that resolves when all assets are loaded
   */
  loadAll(assetList) {
    this.totalAssets = assetList.length;
    this.loadedAssets = 0;
    
    return new Promise((resolve, reject) => {
      if (assetList.length === 0) {
        this._handleComplete();
        resolve();
        return;
      }
      
      // Process each asset in the list
      const promises = assetList.map(asset => this.load(asset));
      
      Promise.all(promises)
        .then(() => {
          this._handleComplete();
          resolve();
        })
        .catch(error => {
          console.error('Error loading assets:', error);
          reject(error);
        });
    });
  }
  
  /**
   * Load a single asset
   * @param {Object} asset - Asset object with id, type, and src
   * @returns {Promise} - Promise that resolves when the asset is loaded
   */
  load(asset) {
    return new Promise((resolve, reject) => {
      if (this.resources[asset.id]) {
        // Asset already loaded or loading
        if (this.resources[asset.id].loaded) {
          resolve();
        } else {
          // Wait for it to finish loading
          this.resources[asset.id].callbacks.push(() => resolve());
        }
        return;
      }
      
      // Initialize resource entry
      this.resources[asset.id] = {
        id: asset.id,
        type: asset.type,
        src: asset.src,
        resource: null,
        loaded: false,
        error: null,
        callbacks: []
      };
      
      // Load based on asset type
      switch (asset.type) {
        case 'image':
        case 'spritesheet':
          this._loadImage(asset, resolve, reject);
          break;
        case 'audio':
          this._loadAudio(asset, resolve, reject);
          break;
        case 'font':
          this._loadFont(asset, resolve, reject);
          break;
        case 'json':
          this._loadJSON(asset, resolve, reject);
          break;
        default:
          const error = new Error(`Unknown asset type: ${asset.type}`);
          this.resources[asset.id].error = error;
          reject(error);
      }
    });
  }
  
  /**
   * Load an image asset
   * @private
   */
  _loadImage(asset, resolve, reject) {
    const img = new Image();
    
    img.onload = () => {
      this.resources[asset.id].resource = img;
      this.resources[asset.id].loaded = true;
      this._assetLoaded(asset.id);
      resolve();
    };
    
    img.onerror = (error) => {
      this.resources[asset.id].error = error;
      console.error(`Failed to load image: ${asset.src}`, error);
      reject(error);
    };
    
    img.src = asset.src;
  }
  
  /**
   * Load an audio asset
   * @private
   */
  _loadAudio(asset, resolve, reject) {
    const audio = new Audio();
    
    audio.oncanplaythrough = () => {
      this.resources[asset.id].resource = audio;
      this.resources[asset.id].loaded = true;
      this._assetLoaded(asset.id);
      resolve();
    };
    
    audio.onerror = (error) => {
      this.resources[asset.id].error = error;
      console.error(`Failed to load audio: ${asset.src}`, error);
      reject(error);
    };
    
    audio.src = asset.src;
    audio.load();
  }
  
  /**
   * Load a font
   * @private
   */
  _loadFont(asset, resolve, reject) {
    // Font loading simplified for this starter
    setTimeout(() => {
      this.resources[asset.id].resource = asset.id;
      this.resources[asset.id].loaded = true;
      this._assetLoaded(asset.id);
      resolve();
    }, 500);
  }
  
  /**
   * Load a JSON file
   * @private
   */
  _loadJSON(asset, resolve, reject) {
    fetch(asset.src)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load JSON: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        this.resources[asset.id].resource = data;
        this.resources[asset.id].loaded = true;
        this._assetLoaded(asset.id);
        resolve();
      })
      .catch(error => {
        this.resources[asset.id].error = error;
        console.error(`Failed to load JSON: ${asset.src}`, error);
        reject(error);
      });
  }
  
  /**
   * Called when an asset finishes loading
   * @private
   */
  _assetLoaded(id) {
    this.loadedAssets++;
    
    // Calculate progress (0 to 1)
    const progress = this.totalAssets > 0 ? this.loadedAssets / this.totalAssets : 1;
    
    // Call the progress callback
    if (this.onProgressCallback) {
      this.onProgressCallback(progress);
    }
    
    // Call any waiting callbacks
    if (this.resources[id].callbacks) {
      this.resources[id].callbacks.forEach(callback => callback());
      this.resources[id].callbacks = [];
    }
    
    // Check if all assets are loaded
    if (this.loadedAssets === this.totalAssets) {
      this._handleComplete();
    }
  }
  
  /**
   * Called when all assets are loaded
   * @private
   */
  _handleComplete() {
    if (this.onCompleteCallback) {
      this.onCompleteCallback();
    }
  }
  
  /**
   * Set a callback to be notified of load progress
   * @param {Function} callback - Function to call with progress (0 to 1)
   */
  onProgress(callback) {
    this.onProgressCallback = callback;
  }
  
  /**
   * Set a callback to be notified when all assets are loaded
   * @param {Function} callback - Function to call when loading completes
   */
  onComplete(callback) {
    this.onCompleteCallback = callback;
  }
  
  /**
   * Check if a specific asset is loaded
   * @param {string} id - Asset ID
   * @returns {boolean} True if the asset is loaded
   */
  isLoaded(id) {
    return this.resources[id] && this.resources[id].loaded;
  }
  
  /**
   * Get a loaded asset by ID
   * @param {string} id - Asset ID
   * @returns {*} The loaded asset or null if not found
   */
  get(id) {
    if (this.isLoaded(id)) {
      return this.resources[id].resource;
    }
    console.warn(`Attempted to get unloaded asset: ${id}`);
    return null;
  }
}
