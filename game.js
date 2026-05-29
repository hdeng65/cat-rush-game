// Cat Dash! - Game Engine
class CatDashGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Game state - always start in 'start' state
        this.state = 'start'; // start, playing, paused, gameOver, levelComplete, tryAgain, gameClear
        this.score = 0;
        this.happyBar = 0;
        this.happyBarMax = 100;
        this.baseSpeed = 1.2;
        this.currentSpeed = 1.2;
        this.speedMultiplier = 1.0;
        this.gameTime = 0;
        this.lives = 3; // Player has 3 lives
        this.coins = 0; // Coins collected (for leaderboard)
        
        // Ensure initial state is correct
        console.log('Game state initialized:', this.state);
        
        // Level system
        this.currentLevel = 1;
        this.maxLevel = 3;
        this.levelTime = 0;
        this.levelTimeLimit = 30000; // 30 seconds for level 1
        this.levelConfig = {
            1: {
                timeLimit: 30000, // 30 seconds
                baseSpeed: 1.0,
                obstacleSizes: ['small'], // Only small
                obstacleDensity: 0.3, // Not dense (lowest)
                spawnInterval: 400, // Increased for more distance
                collectibleSpawnInterval: 350, // Decreased density (increased interval)
                shieldSpawnRate: 0.4, // Increased shields (was ~0.25)
                snackSpawnRate: 0.5, // Increased fish spawn rate for level 1
                destination: 'bathroom'
            },
            2: {
                timeLimit: 45000, // 45 seconds
                baseSpeed: 1.3, // Faster than level 1 (harder)
                obstacleSizes: ['small'], // Still small
                obstacleDensity: 0.4, // Decreased density, but still harder than level 1 (0.3)
                spawnInterval: 350, // Slightly increased interval for less density
                collectibleSpawnInterval: 300, // Decreased density (increased interval)
                shieldSpawnRate: 0.4, // Keep same as level 1
                snackSpawnRate: 0.5, // Increased fish spawn rate for level 2
                destination: 'livingroom', // Living room icon
                destinationPosition: 'topRight' // Top-right corner
            },
            3: {
                timeLimit: 60000, // 60 seconds
                baseSpeed: 1.6, // Keep faster for difficulty
                obstacleSizes: ['small', 'medium'], // Small and medium obstacles only
                obstacleDensity: 0.7, // Most dense (highest)
                spawnInterval: 350, // Increased for more distance, but still challenging
                collectibleSpawnInterval: 250, // Decreased density of bonuses
                shieldSpawnRate: 0.3, // Slightly fewer shields for difficulty
                destination: 'balcony', // Balcony icon
                destinationPosition: 'bottomLeft' // Bottom-left corner
            }
        };
        
        // Image assets
        this.images = {
            cat: null,
            catGif: null, // GIF animation (primary)
            catSprite: null, // Sprite sheet for animation (fallback)
            catFrames: [], // Individual frame images
            obstacleSmall: null,
            obstacleMedium: null,
            obstacleBig: null,
            litterboxBathroom: null,
            litterboxLivingroom: null,
            litterboxBalcony: null,
            coinImage: null,
            shieldImage: null,
            sparkleFrames: [], // Sparkle animation frames
            roombaFrames: [] // Roomba animation frames
        };
        this.imagesLoaded = false;
        
        // Audio assets
        this.audio = {
            coin: null,
            fish: null,
            shield: null,
            levelComplete: null,
            gameClear: null,
            lostLife: null,
            obstacleHit: null,
            roombaHit: null
        };
        this.loadAudio();
        this.catAnimationFrame = 0;
        this.catAnimationTimer = 0;
        this.catIsMoving = false;
        
        // Initialize catFrames array
        this.images.catFrames = [];
        
        // Player (positioned at top now)
        this.player = {
            x: this.canvas.width / 2,
            y: 100, // Top of screen
            width: 100, // Doubled from 50 to 100
            height: 100,
            targetLane: 2, // 0, 1, 2, 3, 4 (5 lanes)
            currentLane: 2,
            laneWidth: this.canvas.width / 5,
            hasShield: false,
            shieldTime: 0,
            isHappy: false,
            happyTime: 0
        };
        
        // Game objects
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        this.feedbackTexts = [];
        this.sparkleAnimations = []; // Sparkle animations for coin collection
        this.destination = null; // Litter box at bottom
        
        // Spawning
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        this.obstacleSpawnInterval = 200;
        this.collectibleSpawnInterval = 100;
        
        // Input
        this.keys = {};
        this.setupInput();
        
        // UI elements
        this.setupUI();
        
        // Load images
        this.loadImages();
        
        // Start game loop
        this.lastTime = 0;
        this.animate(0);
    }
    
    loadImages() {
        const imagePaths = {
            cat: ['assets/cat.png', 'assets/cat.jpg', 'assets/cat.PNG', 'assets/cat.JPG'],
            catGif: [
                'assets/cat.gif',
                'assets/cat.GIF',
                './assets/cat.gif'
            ],
            catSprite: [
                'assets/cat_spritesheet.webp',
                'assets/cat_spritesheet.WEBP',
                'assets/cat_spritesheet.PNG',
                './assets/cat_spritesheet.PNG',
                'cat_spritesheet.PNG',
                'assets/cat_spritesheet.png',
                './assets/cat_spritesheet.png',
                'assets/cat_sprite.png',
                'assets/cat_sprite.jpg',
                'assets/cat_spritesheet.jpg'
            ],
            obstacleSmall: ['assets/obstacle_small.png', 'assets/obstacle_small.PNG', 'assets/obstacle_small.svg', 'assets/obstacle_small.jpg'],
            obstacleMedium: ['assets/obstacle_medium.png', 'assets/obstacle_medium.PNG', 'assets/obstacle_medium.svg', 'assets/obstacle_medium.jpg'],
            obstacleBig: ['assets/obstacle_big.png', 'assets/obstacle_big.PNG', 'assets/obstacle_big.svg', 'assets/obstacle_big.jpg'],
            litterboxBathroom: ['assets/bathroom.png', 'assets/bathroom.PNG', 'assets/litterbox_bathroom.png', 'assets/litterbox_bathroom.PNG', 'assets/litterbox_bathroom.svg', 'assets/litterbox_bathroom.jpg'],
            litterboxLivingroom: ['assets/litterbox_livingroom.png', 'assets/litterbox_livingroom.PNG', 'assets/litterbox_livingroom.svg', 'assets/litterbox_livingroom.jpg', 'assets/livingroom.png', 'assets/livingroom.PNG', 'assets/living_room.png', 'assets/living_room.PNG'],
            litterboxBalcony: ['assets/litterbox_balcony.png', 'assets/litterbox_balcony.PNG', 'assets/litterbox_balcony.svg', 'assets/litterbox_balcony.jpg', 'assets/balcony.png', 'assets/balcony.PNG'],
            coinImage: ['assets/coin.png', 'assets/coin.PNG', 'assets/coin.svg', 'assets/coin.jpg', 'assets/golden_coin.png', 'assets/golden_coin.PNG'],
            shieldImage: ['assets/shield.png', 'assets/shield.PNG', 'assets/shield.svg', 'assets/shield.jpg', 'assets/shield_icon.png', 'assets/shield_icon.PNG'],
            sparkleFrames: [] // Sparkle animation frames
        };
        
        // Load numbered frames (cat_frame_01.PNG, cat_frame_02.PNG, etc.)
        for (let i = 1; i <= 4; i++) {
            const frameNum = i.toString().padStart(2, '0'); // 01, 02, 03, 04
            imagePaths[`catFrame${i}`] = [
                `assets/cat_frame_${frameNum}.PNG`, // New format: cat_frame_01.PNG
                `assets/cat_frame_${frameNum}.png`,
                `assets/cat_frame_${i}.PNG`, // Fallback: cat_frame_1.PNG
                `assets/cat_frame_${i}.png`,
                `assets/cat_frame${i}.PNG`,
                `assets/cat_frame${i}.png`,
                `assets/cat_frame_${i}.jpg`
            ];
        }
        
        // Load sparkle frames (sparkle1.PNG, sparkle2.PNG, etc.)
        for (let i = 1; i <= 4; i++) {
            imagePaths[`sparkleFrame${i}`] = [
                `assets/sparkles/sparkle${i}.PNG`,
                `assets/sparkles/sparkle${i}.png`,
                `assets/sparkles/sparkle_${i}.PNG`,
                `assets/sparkles/sparkle_${i}.png`
            ];
        }
        
        // Load roomba frames (roomba1.PNG, roomba2.PNG, etc.)
        for (let i = 1; i <= 4; i++) {
            imagePaths[`roombaFrame${i}`] = [
                `assets/roomba/roomba${i}.PNG`,
                `assets/roomba/roomba${i}.png`,
                `assets/roomba/roomba_${i}.PNG`,
                `assets/roomba/roomba_${i}.png`
            ];
        }
        
        // Initialize catFrames array
        this.images.catFrames = [];
        this.images.roombaFrames = [];
        
        let loadedCount = 0;
        const totalImages = Object.keys(imagePaths).length;
        
        const tryLoadImage = (key, paths, index = 0) => {
            if (index >= paths.length) {
                // All paths failed, mark as loaded anyway so game can start
                console.warn(`Failed to load image: ${key} (tried paths: ${paths.join(', ')})`);
                loadedCount++;
                if (loadedCount === totalImages) {
                    this.imagesLoaded = true;
                    console.log('All images loaded (some may have failed)');
                }
                return;
            }
            
            const img = new Image();
            const currentPath = paths[index];
            
            img.onload = () => {
                if (key.startsWith('catFrame')) {
                    const frameNum = parseInt(key.replace('catFrame', ''));
                    if (!this.images.catFrames) this.images.catFrames = [];
                    this.images.catFrames[frameNum - 1] = img;
                    console.log(`✅ Loaded frame ${frameNum}: ${currentPath}`);
                } else if (key.startsWith('sparkleFrame')) {
                    const frameNum = parseInt(key.replace('sparkleFrame', ''));
                    if (!this.images.sparkleFrames) this.images.sparkleFrames = [];
                    this.images.sparkleFrames[frameNum - 1] = img;
                    console.log(`✅ Loaded sparkle frame ${frameNum}: ${currentPath}`);
                } else if (key.startsWith('roombaFrame')) {
                    const frameNum = parseInt(key.replace('roombaFrame', ''));
                    if (!this.images.roombaFrames) this.images.roombaFrames = [];
                    this.images.roombaFrames[frameNum - 1] = img;
                    console.log(`✅ Loaded roomba frame ${frameNum}: ${currentPath}`);
                } else {
                    this.images[key] = img;
                    if (key === 'catGif') {
                        console.log(`✅ Cat GIF loaded successfully: ${currentPath}`);
                        console.log(`   Dimensions: ${img.width}x${img.height} pixels`);
                        console.log(`   GIF will animate automatically`);
                    } else if (key === 'catSprite') {
                        console.log(`✅ Sprite sheet loaded successfully: ${currentPath}`);
                        console.log(`   Dimensions: ${img.width}x${img.height} pixels`);
                        // Calculate and log frame count
                        const frameCount = Math.round(img.width / img.height);
                        console.log(`   Detected ${frameCount} frames (${img.width / frameCount}x${img.height} per frame)`);
                    } else {
                        console.log(`Loaded image: ${key} from ${currentPath}`);
                    }
                }
                loadedCount++;
                if (loadedCount === totalImages) {
                    this.imagesLoaded = true;
                    console.log('All images loaded successfully');
                }
            };
            
            img.onerror = (error) => {
                console.warn(`❌ Failed to load ${currentPath} for ${key}`);
                console.warn(`   Error details:`, error);
                tryLoadImage(key, paths, index + 1);
            };
            
            // Set src after setting up handlers
            console.log(`Attempting to load ${key} from: ${currentPath}`);
            img.src = currentPath;
            
            // Additional check: verify the file is actually an image after a short delay
            if (key === 'catSprite') {
                setTimeout(() => {
                    if (!img.complete || img.naturalWidth === 0) {
                        console.error(`⚠️ WARNING: cat_spritesheet.PNG may not be a valid image file!`);
                        console.error(`   The file might be corrupted or in the wrong format.`);
                        console.error(`   Please ensure it's a valid PNG image file.`);
                    }
                }, 1000);
            }
        };
        
        Object.keys(imagePaths).forEach(key => {
            tryLoadImage(key, imagePaths[key]);
        });
        
        // Set a timeout to mark images as loaded even if some fail (don't block game start)
        setTimeout(() => {
            if (!this.imagesLoaded) {
                console.log('Image loading timeout - starting game anyway');
                this.imagesLoaded = true;
            }
            // Log which images loaded successfully
            console.log('Image loading status:');
            const loadedFrames = this.images.catFrames ? this.images.catFrames.filter(f => f).length : 0;
            console.log(`  catFrames: ${loadedFrames}/4 loaded`);
            console.log('  catGif:', this.images.catGif ? '✅ Loaded' : '❌ Failed');
            console.log('  catSprite:', this.images.catSprite ? '✅ Loaded' : '❌ Failed');
            console.log('  cat:', this.images.cat ? '✅ Loaded' : '❌ Failed');
            if (loadedFrames > 0) {
                console.log(`  Using individual frame files for animation (${loadedFrames} frames)`);
            }
            if (this.images.catGif) {
                console.log(`  catGif dimensions: ${this.images.catGif.width}x${this.images.catGif.height}`);
            }
            if (this.images.catSprite) {
                console.log(`  catSprite dimensions: ${this.images.catSprite.width}x${this.images.catSprite.height}`);
            }
        }, 3000);
    }
    
    loadAudio() {
        // Load all audio files
        const audioPaths = {
            coin: ['audio/collecting coin.wav', 'audio/coin-recieved-230517.mp3', 'audio/mixkit-winning-a-coin-video-game-2069.wav'],
            fish: ['audio/eating fish.wav'],
            shield: ['audio/mixkit-fairy-arcade-sparkle-866.wav'],
            levelComplete: ['audio/level complete mewo sound.wav'],
            gameClear: ['audio/game clear sound.wav'],
            lostLife: ['audio/lost life try again.wav'],
            obstacleHit: ['audio/hit obstacle.wav'],
            roombaHit: ['audio/roomba-bumping-things-68882.mp3']
        };
        
        const loadAudioFile = (key, paths, index = 0) => {
            if (index >= paths.length) {
                console.warn(`Failed to load audio for ${key}`);
                return;
            }
            
            const audio = new Audio();
            const currentPath = paths[index];
            
            audio.oncanplaythrough = () => {
                this.audio[key] = audio;
                console.log(`✅ Loaded audio: ${key} from ${currentPath}`);
            };
            
            audio.onerror = () => {
                console.warn(`❌ Failed to load ${currentPath} for ${key}, trying next...`);
                loadAudioFile(key, paths, index + 1);
            };
            
            audio.src = currentPath;
            audio.preload = 'auto';
        };
        
        Object.keys(audioPaths).forEach(key => {
            loadAudioFile(key, audioPaths[key]);
        });
    }
    
    playSound(soundName, volume = 0.7) {
        const sound = this.audio[soundName];
        if (sound) {
            try {
                const audioClone = sound.cloneNode();
                audioClone.volume = volume;
                audioClone.play().catch(e => {
                    console.warn(`Could not play sound ${soundName}:`, e);
                });
            } catch (e) {
                console.warn(`Error playing sound ${soundName}:`, e);
            }
        }
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleInput(e.key.toLowerCase());
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    handleInput(key) {
        if (this.state === 'start' && (key === 'enter' || key === ' ')) {
            this.startGame();
        } else if (this.state === 'tryAgain' && (key === 'enter' || key === ' ')) {
            this.tryAgain();
        } else if (this.state === 'gameOver' && (key === 'enter' || key === ' ')) {
            this.restart();
        } else if (this.state === 'gameClear' && (key === 'enter' || key === ' ')) {
            this.restart();
        } else if (this.state === 'playing') {
            if (key === 'p' || key === 'escape') {
                this.togglePause();
            } else if (key === 'arrowleft' || key === 'a') {
                this.movePlayer(-1);
            } else if (key === 'arrowright' || key === 'd') {
                this.movePlayer(1);
            } else if (key === 'arrowup' || key === 'w') {
                this.movePlayerVertical(-1);
            } else if (key === 'arrowdown' || key === 's') {
                this.movePlayerVertical(1);
            }
        }
    }
    
    movePlayer(direction) {
        if (this.state !== 'playing') return;
        this.player.targetLane = Math.max(0, Math.min(4, this.player.targetLane + direction));
    }
    
    movePlayerVertical(direction) {
        if (this.state !== 'playing') return;
        // Vertical movement - allow cat to move down to reach destination
        const maxY = this.canvas.height - 100; // Allow moving down
        const minY = 50; // Top limit
        this.player.y = Math.max(minY, Math.min(maxY, this.player.y + direction * 20));
    }
    
    setupUI() {
        // Immediately ensure start screen is visible and all other screens are hidden
        const startScreen = document.getElementById('start-screen');
        const tryAgainScreen = document.getElementById('try-again-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const gameClearScreen = document.getElementById('game-clear-screen');
        const pauseButton = document.getElementById('pause-button');
        
        // Force hide all screens except start screen
        if (startScreen) {
            startScreen.classList.remove('hidden');
            startScreen.style.display = 'flex';
        }
        if (tryAgainScreen) {
            tryAgainScreen.classList.add('hidden');
            tryAgainScreen.style.display = 'none';
        }
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
            gameOverScreen.style.display = 'none';
        }
        if (gameClearScreen) {
            gameClearScreen.classList.add('hidden');
            gameClearScreen.style.display = 'none';
        }
        if (pauseButton) {
            pauseButton.classList.add('hidden');
            pauseButton.style.display = 'none';
        }
        
        console.log('UI initialized - Start screen visible, all others hidden');
        console.log('Start screen display:', startScreen ? startScreen.style.display : 'not found');
        console.log('Try again screen display:', tryAgainScreen ? tryAgainScreen.style.display : 'not found');
        
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('yes-button').addEventListener('click', () => this.tryAgain());
        document.getElementById('exit-button').addEventListener('click', () => {
            this.goToStartScreen();
        });
        document.getElementById('restart-button').addEventListener('click', () => this.restart());
        document.getElementById('clear-restart-button').addEventListener('click', () => this.restart());
        document.getElementById('pause-button').addEventListener('click', () => this.togglePause());
    }
    
    startGame() {
        try {
            console.log('Starting game...');
            this.state = 'playing';
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('pause-button').classList.remove('hidden');
            this.resetGame();
            console.log('Game started successfully');
        } catch (error) {
            console.error('Error starting game:', error);
            alert('Error starting game: ' + error.message);
        }
    }
    
    restart() {
        this.state = 'playing';
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('game-clear-screen').classList.add('hidden');
        document.getElementById('try-again-screen').classList.add('hidden');
        document.getElementById('pause-button').classList.remove('hidden');
        this.resetGame();
    }
    
    resetGame() {
        this.state = 'playing';
        this.score = 0;
        this.happyBar = 0;
        this.currentLevel = 1;
        this.gameTime = 0;
        this.levelTime = 0;
        this.lives = 3; // Reset lives
        this.coins = 0; // Reset coins
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        this.feedbackTexts = [];
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        this.destination = null;
        
        this.player.x = this.canvas.width / 2;
        this.player.y = 100; // Top of screen
        this.player.targetLane = 2;
        this.player.currentLane = 2;
        this.player.hasShield = false;
        this.player.shieldTime = 0;
        this.player.isHappy = false;
        this.player.happyTime = 0;
        
        this.initializeLevel(this.currentLevel);
    }
    
    initializeLevel(level) {
        const config = this.levelConfig[level];
        if (!config) return;
        
        this.baseSpeed = config.baseSpeed;
        this.currentSpeed = config.baseSpeed;
        this.speedMultiplier = 1.0;
        this.levelTimeLimit = config.timeLimit;
        this.levelTime = 0;
        this.obstacleSpawnInterval = config.spawnInterval;
        
        // Create destination (litter box) - use bathroom.PNG for all levels
        let destImage = this.images.litterboxBathroom; // Use bathroom for all levels
        
        // Determine destination position based on level
        let destX, destY;
        if (level === 1) {
            // Level 1: bottom center
            destX = this.canvas.width / 2;
            destY = this.canvas.height - 80;
        } else if (level === 2) {
            // Level 2: top-right corner
            destX = this.canvas.width - 60;
            destY = 60;
        } else if (level === 3) {
            // Level 3: bottom-left corner
            destX = 60;
            destY = this.canvas.height - 80;
        } else {
            // Default: bottom center
            destX = this.canvas.width / 2;
            destY = this.canvas.height - 80;
        }
        
        this.destination = {
            x: destX,
            y: destY,
            width: 150,
            height: 150,
            image: destImage,
            type: config.destination,
            visible: false // Hidden until happy bar is full
        };
        
        // Debug logging
        console.log(`Level ${level} destination:`, {
            position: `(${destX}, ${destY})`,
            type: config.destination,
            image: destImage ? 'Loaded' : 'Not loaded',
            visible: false
        });
    }
    
    nextLevel() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            console.log(`Advancing to level ${this.currentLevel}`);
            // Reset happy bar and player state for new level
            this.happyBar = 0;
            this.player.isHappy = false;
            this.initializeLevel(this.currentLevel);
            this.obstacles = [];
            this.collectibles = [];
            this.obstacleSpawnTimer = 0;
            this.collectibleSpawnTimer = 0;
            this.levelTime = 0; // Reset level timer
            this.state = 'playing'; // Make sure state is playing
            this.createFeedback(`Level ${this.currentLevel}!`, this.canvas.width / 2, this.canvas.height / 2, '#00b894');
        } else {
            // Game complete - all levels finished!
            console.log('All levels completed!');
            this.gameClear();
        }
    }
    
    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pause-button').textContent = 'Resume';
        } else if (this.state === 'paused') {
            this.state = 'playing';
            document.getElementById('pause-button').textContent = 'Pause';
        }
    }
    
    loseLife() {
        // Pause the game immediately
        this.state = 'tryAgain';
        
        // Clear all game objects
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        this.feedbacks = [];
        
        // Decrease lives
        this.lives--;
        
        if (this.lives <= 0) {
            // No lives left - game over
            this.gameOver();
        } else {
            // Still have lives - show try again screen
            this.playSound('lostLife', 0.7);
            const tryAgainScreen = document.getElementById('try-again-screen');
            const livesLeft = document.getElementById('lives-left');
            
            if (livesLeft) livesLeft.textContent = this.lives;
            
            // Show the try again screen
            if (tryAgainScreen) {
                tryAgainScreen.classList.remove('hidden');
                tryAgainScreen.style.display = 'flex';
            }
            document.getElementById('pause-button').classList.add('hidden');
            
            console.log(`Life lost! Lives remaining: ${this.lives}`);
        }
    }
    
    goToStartScreen() {
        // Return to start screen
        this.state = 'start';
        
        // Hide all game screens
        const tryAgainScreen = document.getElementById('try-again-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const gameClearScreen = document.getElementById('game-clear-screen');
        const startScreen = document.getElementById('start-screen');
        
        if (tryAgainScreen) {
            tryAgainScreen.classList.add('hidden');
            tryAgainScreen.style.display = 'none';
        }
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
            gameOverScreen.style.display = 'none';
        }
        if (gameClearScreen) {
            gameClearScreen.classList.add('hidden');
            gameClearScreen.style.display = 'none';
        }
        if (startScreen) {
            startScreen.classList.remove('hidden');
            startScreen.style.display = 'flex';
        }
        document.getElementById('pause-button').classList.add('hidden');
        
        // Reset game state
        this.resetGame();
    }
    
    tryAgain() {
        // Reset current level but keep lives and score
        this.state = 'playing';
        this.happyBar = 0;
        this.destination.visible = false;
        this.levelTime = 0;
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        this.player.x = this.canvas.width / 2;
        this.player.y = 100;
        this.player.targetLane = 2;
        this.player.currentLane = 2;
        this.player.hasShield = false;
        this.player.shieldTime = 0;
        this.player.isHappy = false;
        this.player.happyTime = 0;
        this.initializeLevel(this.currentLevel);
        
        // Hide try again screen
        const tryAgainScreen = document.getElementById('try-again-screen');
        if (tryAgainScreen) {
            tryAgainScreen.classList.add('hidden');
            tryAgainScreen.style.display = 'none';
        }
        document.getElementById('pause-button').classList.remove('hidden');
    }
    
    gameOver() {
        this.state = 'gameOver';
        
        // Hide try again screen if it's showing
        const tryAgainScreen = document.getElementById('try-again-screen');
        if (tryAgainScreen) {
            tryAgainScreen.classList.add('hidden');
            tryAgainScreen.style.display = 'none';
        }
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-coins').textContent = this.coins;
        const messages = [
            "Meow! That was fun!",
            "Purr-fect try!",
            "You're a star!",
            "Amazing run!"
        ];
        document.getElementById('feedback-message').textContent = 
            messages[Math.floor(Math.random() * messages.length)];
        
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
            gameOverScreen.style.display = 'flex';
        }
        document.getElementById('pause-button').classList.add('hidden');
    }
    
    gameClear() {
        this.state = 'gameClear';
        
        // Play game clear sound
        this.playSound('gameClear', 0.8);
        
        // Hide try again screen if showing
        const tryAgainScreen = document.getElementById('try-again-screen');
        if (tryAgainScreen) {
            tryAgainScreen.classList.add('hidden');
            tryAgainScreen.style.display = 'none';
        }
        
        document.getElementById('clear-score').textContent = this.score;
        document.getElementById('clear-coins').textContent = this.coins;
        
        const gameClearScreen = document.getElementById('game-clear-screen');
        if (gameClearScreen) {
            gameClearScreen.classList.remove('hidden');
            gameClearScreen.style.display = 'flex';
        }
        document.getElementById('pause-button').classList.add('hidden');
        
        console.log('Game Clear! Score:', this.score, 'Coins:', this.coins);
    }
    
    update(deltaTime) {
        // Don't update if game is paused, trying again, or game over
        if (this.state !== 'playing') return;
        
        this.gameTime += deltaTime;
        this.levelTime += deltaTime;
        
        // Check level time limit
        if (this.levelTime >= this.levelTimeLimit) {
            this.loseLife();
            return;
        }
        
        // Update cat animation - using individual frame files at 70ms per frame
        // Prioritize individual frames (cat_frame_1, cat_frame_2, etc.)
        if (this.images.catFrames && this.images.catFrames.length > 0) {
            this.catAnimationTimer += deltaTime;
            const animationSpeed = 70; // 70ms per frame
            
            if (this.catAnimationTimer > animationSpeed) {
                this.catAnimationTimer = 0;
                const maxFrames = this.images.catFrames.filter(f => f && f.complete).length;
                if (maxFrames > 0) {
                    // Update animation frame - cycles through frames 1-4 continuously at 70ms per frame
                    this.catAnimationFrame = (this.catAnimationFrame + 1) % maxFrames;
                }
            }
        }
        // Fallback to sprite sheet if individual frames not available
        else if (this.images.catSprite && this.images.catSprite.complete && this.images.catSprite.width > 0) {
            this.catAnimationTimer += deltaTime;
            const animationSpeed = 70; // 70ms per frame
            
            if (this.catAnimationTimer > animationSpeed) {
                this.catAnimationTimer = 0;
                
                // Calculate max frames from sprite sheet
                const spriteWidth = this.images.catSprite.width;
                const spriteHeight = this.images.catSprite.height;
                
                let maxFrames = 4; // Default
                if (spriteWidth > spriteHeight) {
                    // Horizontal strip - frames are side by side
                    maxFrames = Math.round(spriteWidth / spriteHeight);
                } else if (spriteHeight > spriteWidth) {
                    // Vertical strip - frames are stacked
                    maxFrames = Math.round(spriteHeight / spriteWidth);
                }
                
                // Ensure reasonable frame count (between 1 and 16)
                maxFrames = Math.max(1, Math.min(maxFrames, 16));
                
                // Update animation frame - cycles through all frames continuously at 70ms per frame
                this.catAnimationFrame = (this.catAnimationFrame + 1) % maxFrames;
            }
        }
        
        // Update speed and difficulty (level-based, not time-based)
        const config = this.levelConfig[this.currentLevel];
        this.speedMultiplier = 1.0;
        
        // No speed boosters - just base speed
        this.currentSpeed = this.baseSpeed * this.speedMultiplier;
        
        // Use level-based spawn intervals
        this.obstacleSpawnInterval = config.spawnInterval;
        this.collectibleSpawnInterval = config.collectibleSpawnInterval || 200;
        
        // Update player lane position
        const targetX = this.player.targetLane * this.player.laneWidth + this.player.laneWidth / 2;
        this.player.x += (targetX - this.player.x) * 0.2; // Smooth lane transition (increased responsiveness)
        
        // Check if player is moving
        this.catIsMoving = Math.abs(targetX - this.player.x) > 1;
        this.player.currentLane = Math.round(this.player.x / this.player.laneWidth);
        
        // Update player effects
        if (this.player.hasShield) {
            this.player.shieldTime -= deltaTime;
            if (this.player.shieldTime <= 0) {
                this.player.hasShield = false;
            }
        }
        
        if (this.player.isHappy) {
            this.player.happyTime -= deltaTime;
            if (this.player.happyTime <= 0) {
                this.player.isHappy = false;
            }
        }
        
        // Spawn obstacles
        this.obstacleSpawnTimer += deltaTime;
        if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
        
        // Spawn collectibles
        this.collectibleSpawnTimer += deltaTime;
        if (this.collectibleSpawnTimer >= this.collectibleSpawnInterval) {
            this.spawnCollectible();
            this.collectibleSpawnTimer = 0;
        }
        
        // Update obstacles (move from bottom to top)
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y -= this.currentSpeed * (obstacle.speed || 1);
            
            // Update Roomba movement (lane-based in level 3) and animation
            if (obstacle.type === 'roomba') {
                // Update roomba animation
                if (!obstacle.animationTimer) obstacle.animationTimer = 0;
                if (!obstacle.animationFrame) obstacle.animationFrame = 0;
                obstacle.animationTimer += deltaTime;
                const animationSpeed = 100; // 100ms per frame
                if (obstacle.animationTimer >= animationSpeed) {
                    obstacle.animationTimer = 0;
                    if (this.images.roombaFrames && this.images.roombaFrames.length > 0) {
                        obstacle.animationFrame = (obstacle.animationFrame + 1) % this.images.roombaFrames.length;
                    }
                }
                
                if (this.currentLevel === 3 && obstacle.startLane !== undefined) {
                    // Level 3: Move across lanes (up to 3 lanes from start)
                    if (obstacle.targetLane === undefined) {
                        // Initialize target lane (within 3 lanes of start)
                        const maxOffsetLeft = Math.min(obstacle.maxLanes, obstacle.startLane);
                        const maxOffsetRight = Math.min(obstacle.maxLanes, 4 - obstacle.startLane);
                        const maxOffset = Math.min(maxOffsetLeft, maxOffsetRight);
                        const laneOffset = (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * maxOffset + 1);
                        obstacle.targetLane = Math.max(0, Math.min(4, obstacle.startLane + laneOffset));
                    }
                    
                    const targetX = obstacle.targetLane * this.player.laneWidth + this.player.laneWidth / 2;
                    const distance = targetX - obstacle.x;
                    
                    if (Math.abs(distance) > 3) {
                        // Move towards target lane
                        obstacle.x += Math.sign(distance) * 0.8;
                    } else {
                        // Reached target, pick new target within 3 lanes of start
                        const maxOffsetLeft = Math.min(obstacle.maxLanes, obstacle.startLane);
                        const maxOffsetRight = Math.min(obstacle.maxLanes, 4 - obstacle.startLane);
                        const maxOffset = Math.min(maxOffsetLeft, maxOffsetRight);
                        const laneOffset = (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * maxOffset + 1);
                        obstacle.targetLane = Math.max(0, Math.min(4, obstacle.startLane + laneOffset));
                        
                        // Ensure we don't go beyond 3 lanes from start
                        if (Math.abs(obstacle.targetLane - obstacle.startLane) > obstacle.maxLanes) {
                            obstacle.targetLane = obstacle.startLane + (obstacle.targetLane > obstacle.startLane ? obstacle.maxLanes : -obstacle.maxLanes);
                        }
                    }
                    
                    // Keep in bounds and within 3 lanes of start
                    const currentLaneNum = Math.floor(obstacle.x / this.player.laneWidth);
                    const minLane = Math.max(0, obstacle.startLane - obstacle.maxLanes);
                    const maxLane = Math.min(4, obstacle.startLane + obstacle.maxLanes);
                    
                    if (currentLaneNum < minLane) {
                        obstacle.x = minLane * this.player.laneWidth + this.player.laneWidth / 2;
                    } else if (currentLaneNum > maxLane) {
                        obstacle.x = maxLane * this.player.laneWidth + this.player.laneWidth / 2;
                    }
                } else {
                    // Level 2: Original horizontal movement
                    obstacle.moveTimer += 0.1;
                    obstacle.x += Math.sin(obstacle.moveTimer) * obstacle.direction * obstacle.speed;
                    
                    // Keep in bounds
                    if (obstacle.x < 0 || obstacle.x > this.canvas.width) {
                        obstacle.direction *= -1;
                    }
                }
            }
            
            // Remove off-screen obstacles (above top of screen)
            if (obstacle.y < -50) {
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Check collision
            if (this.checkCollision(this.player, obstacle)) {
                if (this.player.hasShield) {
                    this.player.hasShield = false;
                    this.player.shieldTime = 0;
                    // Play appropriate sound based on obstacle type
                    if (obstacle.type === 'roomba') {
                        this.playSound('roombaHit', 0.4);
                    } else {
                        this.playSound('obstacleHit', 0.4);
                    }
                    this.createFeedback("Shield Used!", obstacle.x, obstacle.y);
                    this.createParticles(obstacle.x, obstacle.y, '#00b894');
                    this.obstacles.splice(i, 1);
                } else {
                    // Play appropriate sound based on obstacle type
                    if (obstacle.type === 'roomba') {
                        this.playSound('roombaHit', 0.6);
                    } else {
                        this.playSound('obstacleHit', 0.6);
                    }
                    this.loseLife();
                    return;
                }
            }
        }
        
        // Update collectibles (move from bottom to top)
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            collectible.y -= this.currentSpeed;
            // Removed rotation - collectibles don't rotate
            
            // Update sparkle animation for coins
            if (collectible.type === 'coin' && collectible.sparkleFrame !== undefined) {
                collectible.sparkleTimer += deltaTime;
                if (collectible.sparkleTimer >= collectible.sparkleFrameDuration) {
                    collectible.sparkleTimer = 0;
                    if (this.images.sparkleFrames && this.images.sparkleFrames.length > 0) {
                        collectible.sparkleFrame = (collectible.sparkleFrame + 1) % this.images.sparkleFrames.length;
                    }
                }
            }
            
            // Remove off-screen collectibles (above top of screen)
            if (collectible.y < -50) {
                this.collectibles.splice(i, 1);
                continue;
            }
            
            // Check collection
            if (this.checkCollision(this.player, collectible)) {
                this.collectItem(collectible);
                this.collectibles.splice(i, 1);
            }
        }
        
        // Check destination collision (litter box)
        // Cat reaches destination when it's close to the top center
        if (this.destination && this.destination.visible && this.checkCollision(this.player, this.destination)) {
            // Prevent multiple triggers
            if (this.state === 'playing') {
                this.state = 'levelComplete';
                
                // Create success effect with particles
                this.createParticles(this.destination.x, this.destination.y, '#00b894', 'success');
                this.createFeedback("Level Complete!", this.canvas.width / 2, this.canvas.height / 2, '#00b894');
                
                // Play level complete sound
                this.playSound('levelComplete', 0.7);
                
                setTimeout(() => {
                    this.nextLevel();
                }, 1500);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= deltaTime;
            particle.alpha = Math.max(0, particle.life / particle.maxLife);
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update feedback texts (float up)
        for (let i = this.feedbackTexts.length - 1; i >= 0; i--) {
            const text = this.feedbackTexts[i];
            text.y -= 2;
            text.life -= deltaTime;
            text.alpha = Math.max(0, text.life / text.maxLife);
            
            if (text.life <= 0) {
                this.feedbackTexts.splice(i, 1);
            }
        }
        
        // Update sparkle animations
        for (let i = this.sparkleAnimations.length - 1; i >= 0; i--) {
            const sparkle = this.sparkleAnimations[i];
            sparkle.frameTimer += deltaTime;
            if (sparkle.frameTimer >= sparkle.frameDuration) {
                sparkle.frameTimer = 0;
                sparkle.currentFrame = (sparkle.currentFrame + 1) % sparkle.frameCount;
            }
            sparkle.life -= deltaTime;
            sparkle.alpha = Math.max(0, sparkle.life / sparkle.maxLife);
            sparkle.scale += 0.02; // Grow slightly
            sparkle.rotation += 0.1; // Rotate
            
            if (sparkle.life <= 0) {
                this.sparkleAnimations.splice(i, 1);
            }
        }
        
        // Update UI
        this.updateUI();
    }
    
    // Check if a new object would overlap with existing objects
    checkOverlap(newX, newY, newWidth, newHeight, minDistance = 60) {
        // Check against obstacles
        for (const obstacle of this.obstacles) {
            const dx = Math.abs(obstacle.x - newX);
            const dy = Math.abs(obstacle.y - newY);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = minDistance + (obstacle.width + obstacle.height) / 4 + (newWidth + newHeight) / 4;
            if (distance < minDist) {
                return true;
            }
        }
        
        // Check against collectibles
        for (const collectible of this.collectibles) {
            const dx = Math.abs(collectible.x - newX);
            const dy = Math.abs(collectible.y - newY);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = minDistance + (collectible.width + collectible.height) / 4 + (newWidth + newHeight) / 4;
            if (distance < minDist) {
                return true;
            }
        }
        
        return false;
    }
    
    spawnObstacle() {
        const config = this.levelConfig[this.currentLevel];
        if (!config) return;
        
        // Check density - skip spawn if random check fails
        if (Math.random() > config.obstacleDensity) {
            return;
        }
        
        const types = ['box', 'basket', 'furniture'];
        
        // Define size types (all obstacles stay within one lane)
        const laneWidth = this.player.laneWidth; // 160 pixels (800 / 5)
        const sizeTypes = {
            small: { width: laneWidth * 0.4, height: laneWidth * 0.4 }, // 64x64 - 40% of lane width
            medium: { width: laneWidth * 0.6, height: laneWidth * 0.6 }, // 96x96 - 60% of lane width, guaranteed to stay within one lane (160px)
            big: { width: laneWidth * 0.95, height: laneWidth * 0.95 } // 152x152 - fits in one lane
        };
        
        // Try to spawn an obstacle, checking for overlaps
        let attempts = 0;
        let spawned = false;
        
        while (attempts < 10 && !spawned) {
            const lane = Math.floor(Math.random() * 5);
            const x = lane * this.player.laneWidth + this.player.laneWidth / 2;
            const y = this.canvas.height + 50; // Spawn from bottom
            
            // Spawn moving hazards (Roombas) only in later levels, less frequently
            if (this.currentLevel >= 2 && Math.random() < 0.2) {
                // Roombas are smaller than medium obstacles
                const size = { width: 100, height: 100 }; // Smaller than medium (200x200)
                if (!this.checkOverlap(x, y, size.width, size.height, 80)) {
                    const startLane = lane;
                    const maxLanes = this.currentLevel === 3 ? 3 : 1; // Move across 3 lanes in level 3, 1 lane in others
                    this.obstacles.push({
                        x: x,
                        y: y,
                        width: size.width,
                        height: size.height,
                        type: 'roomba',
                        size: 'medium',
                        speed: 0.5 + Math.random() * 0.5,
                        direction: Math.random() < 0.5 ? -1 : 1,
                        moveTimer: 0,
                        startLane: startLane,
                        maxLanes: maxLanes,
                        targetLane: startLane + (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * maxLanes + 1),
                        animationTimer: 0,
                        animationFrame: 0
                    });
                    spawned = true;
                }
            } else {
                // Select size from allowed sizes for this level
                const allowedSizes = config.obstacleSizes;
                const sizeType = allowedSizes[Math.floor(Math.random() * allowedSizes.length)];
                const size = sizeTypes[sizeType];
                
                // For all obstacles: ensure they stay within one lane
                let obstacleX = x;
                let obstacleY = y;
                
                // Explicitly center the obstacle in its lane to prevent spanning multiple lanes
                const currentLane = Math.floor(x / this.player.laneWidth);
                obstacleX = currentLane * this.player.laneWidth + this.player.laneWidth / 2;
                
                // Double-check: ensure obstacle width doesn't exceed lane width
                // This should never happen for small (40%) or medium (60%), but safety check
                if (size.width > this.player.laneWidth) {
                    // If somehow obstacle is too wide, reduce it (shouldn't happen)
                    console.warn(`Obstacle ${sizeType} is too wide for one lane!`);
                }
                
                if (!this.checkOverlap(obstacleX, obstacleY, size.width, size.height, 80)) {
                    this.obstacles.push({
                        x: obstacleX,
                        y: obstacleY,
                        width: size.width,
                        height: size.height,
                        type: types[Math.floor(Math.random() * types.length)],
                        size: sizeType
                    });
                    spawned = true;
                }
            }
            attempts++;
        }
    }
    
    spawnCollectible() {
        const config = this.levelConfig[this.currentLevel];
        if (!config) return;
        
        const rand = Math.random();
        
        // Determine type based on level-specific shield spawn rate and snack rate
        const shieldRate = config.shieldSpawnRate || 0.25;
        const snackRate = config.snackSpawnRate || 0.25; // Level-specific snack rate
        let type;
        
        // All levels: Ensure coins are included
        if (this.currentLevel === 1 || this.currentLevel === 2) {
            // Level 1 and 2: Increased fish (snack) spawn rate, but include coins
            // Distribution: 40% snack, 30% coin, 30% shield
            if (rand < snackRate) {
                type = 'snack'; // 50% chance (snackRate = 0.5)
            } else if (rand < snackRate + 0.3) {
                type = 'coin'; // 30% chance
            } else {
                type = 'shield'; // 20% chance (remaining)
            }
        } else {
            // Level 3: Balanced distribution with coins
            if (rand < 0.4) {
                type = 'coin'; // 40% coins
            } else if (rand < 0.4 + 0.3) {
                type = 'snack'; // 30% snacks
            } else {
                type = 'shield'; // 30% shields
            }
        }
        
        // Try to spawn a collectible, checking for overlaps
        let attempts = 0;
        let spawned = false;
        
        while (attempts < 10 && !spawned) {
            const lane = Math.floor(Math.random() * 5);
            const x = lane * this.player.laneWidth + this.player.laneWidth / 2;
            const y = this.canvas.height + 30; // Spawn from bottom
            
            const collectibleSize = 35; // Increased from 25
            if (!this.checkOverlap(x, y, collectibleSize, collectibleSize, 60)) {
                const collectible = {
                    x: x,
                    y: y,
                    width: collectibleSize,
                    height: collectibleSize,
                    type: type
                    // Removed rotation property
                };
                
                // Add sparkle animation properties for coins
                if (type === 'coin') {
                    collectible.sparkleFrame = 0;
                    collectible.sparkleTimer = 0;
                    collectible.sparkleFrameDuration = 100; // 100ms per frame
                }
                
                this.collectibles.push(collectible);
                spawned = true;
            }
            attempts++;
        }
    }
    
    collectItem(item) {
        switch (item.type) {
            case 'coin':
                this.score += 10;
                this.coins += 1; // Track coins for leaderboard
                this.playSound('coin', 0.6);
                this.createFeedback("+10", item.x, item.y, '#fdcb6e');
                this.createParticles(item.x, item.y, '#fdcb6e', 'coin'); // Golden sparks
                this.createSparkleAnimation(item.x, item.y); // Sparkle animation
                break;
                
            case 'snack':
                this.happyBar = Math.min(this.happyBarMax, this.happyBar + 20);
                this.playSound('fish', 0.5);
                this.createFeedback("Yum!", item.x, item.y, '#00b894');
                this.createParticles(item.x, item.y, '#00b894', 'snack'); // Green/teal sparkles
                
                if (this.happyBar >= this.happyBarMax && !this.player.isHappy) {
                    this.player.isHappy = true;
                    this.player.happyTime = 5000; // 5 seconds
                    this.createFeedback("Purr-fect!", this.player.x, this.player.y - 30, '#55efc4');
                    
                    // Show destination when happy bar is full
                    if (this.destination) {
                        this.destination.visible = true;
                        this.createFeedback("Destination Appeared!", this.canvas.width / 2, this.canvas.height / 2, '#0984e3');
                        console.log('Destination is now visible!');
                    }
                }
                break;
                
            case 'shield':
                this.player.hasShield = true;
                this.player.shieldTime = 10000; // 10 seconds
                this.playSound('shield', 0.5);
                this.createFeedback("Shield!", item.x, item.y, '#0984e3');
                this.createParticles(item.x, item.y, '#0984e3', 'shield'); // Silver sparks
                break;
        }
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    
    createParticles(x, y, color, type = 'default') {
        let particleCount = 8;
        let particleSize = 3 + Math.random() * 3;
        let velocity = 4;
        
        // Customize particles based on type
        if (type === 'coin') {
            // Golden sparks for coins
            particleCount = 12;
            velocity = 5;
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
                const speed = 2 + Math.random() * 3;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 4,
                    color: ['#fdcb6e', '#f39c12', '#e67e22', '#d35400'][Math.floor(Math.random() * 4)], // Golden colors
                    life: 400 + Math.random() * 200,
                    maxLife: 600,
                    alpha: 1,
                    type: 'spark'
                });
            }
        } else if (type === 'shield') {
            // Silver sparks for shield
            particleCount = 10;
            velocity = 4.5;
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
                const speed = 2 + Math.random() * 2.5;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 3,
                    color: ['#bdc3c7', '#ecf0f1', '#95a5a6', '#7f8c8d', '#0984e3'][Math.floor(Math.random() * 5)], // Silver/blue colors
                    life: 450 + Math.random() * 150,
                    maxLife: 600,
                    alpha: 1,
                    type: 'spark'
                });
            }
        } else if (type === 'snack') {
            // Green/teal sparkles for fish/snack
            particleCount = 10;
            for (let i = 0; i < particleCount; i++) {
                this.particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * velocity,
                    vy: (Math.random() - 0.5) * velocity,
                    size: 2 + Math.random() * 3,
                    color: ['#00b894', '#55efc4', '#00cec9', '#81ecec'][Math.floor(Math.random() * 4)], // Teal/green colors
                    life: 400 + Math.random() * 200,
                    maxLife: 600,
                    alpha: 1,
                    type: 'sparkle'
                });
            }
        } else if (type === 'success') {
            // Success effect for reaching destination
            particleCount = 20;
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = 3 + Math.random() * 4;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 4,
                    color: ['#00b894', '#55efc4', '#00cec9', '#81ecec', '#ffffff'][Math.floor(Math.random() * 5)],
                    life: 600 + Math.random() * 400,
                    maxLife: 1000,
                    alpha: 1,
                    type: 'spark'
                });
            }
        } else {
            // Default particles
            for (let i = 0; i < particleCount; i++) {
                this.particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * velocity,
                    vy: (Math.random() - 0.5) * velocity,
                    size: particleSize,
                    color: color,
                    life: 500,
                    maxLife: 500,
                    alpha: 1
                });
            }
        }
    }
    
    createFeedback(text, x, y, color = '#00b894') {
        this.feedbackTexts.push({
            text: text,
            x: x,
            y: y,
            color: color,
            life: 1000,
            maxLife: 1000,
            alpha: 1
        });
    }
    
    createSparkleAnimation(x, y) {
        // Create sparkle animation using sparkle frames
        if (this.images.sparkleFrames && this.images.sparkleFrames.length > 0) {
            this.sparkleAnimations.push({
                x: x,
                y: y,
                currentFrame: 0,
                frameCount: this.images.sparkleFrames.length,
                frameTimer: 0,
                frameDuration: 100, // 100ms per frame
                size: 60,
                scale: 0.8,
                rotation: 0,
                life: 400, // 400ms total animation
                maxLife: 400,
                alpha: 1
            });
        }
    }
    
    updateUI() {
        document.getElementById('score-value').textContent = this.score;
        document.getElementById('coins-value').textContent = this.coins;
        document.getElementById('lives-value').textContent = this.lives;
        document.getElementById('level-value').textContent = this.currentLevel;
        
        const happyPercent = (this.happyBar / this.happyBarMax) * 100;
        document.getElementById('happy-bar-fill').style.width = happyPercent + '%';
    }
    
    render() {
        // Clear canvas with background color
        this.ctx.fillStyle = '#2f394a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw floor pattern (subtle, hand-drawn style)
        this.drawFloor();
        
        // Draw collectibles
        this.collectibles.forEach(item => {
            this.drawCollectible(item);
        });
        
        // Draw obstacles
        this.obstacles.forEach(obstacle => {
            this.drawObstacle(obstacle);
        });
        
        // Draw destination (litter box)
        if (this.destination) {
            this.drawDestination();
        }
        
        // Draw player
        this.drawPlayer();
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            
            if (particle.type === 'spark' || particle.type === 'sparkle') {
                // Draw sparkles/sparks with glow effect
                this.ctx.shadowBlur = 5;
                this.ctx.shadowColor = particle.color;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add a smaller bright center
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Default particle
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
        
        // Draw feedback texts
        this.feedbackTexts.forEach(text => {
            this.ctx.save();
            this.ctx.globalAlpha = text.alpha;
            this.ctx.font = 'bold 24px Comic Sans MS';
            this.ctx.fillStyle = text.color;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(text.text, text.x, text.y);
            this.ctx.restore();
        });
        
        // Draw sparkle animations
        this.sparkleAnimations.forEach(sparkle => {
            if (this.images.sparkleFrames && this.images.sparkleFrames.length > 0) {
                const frame = this.images.sparkleFrames[sparkle.currentFrame];
                if (frame && frame.complete) {
                    this.ctx.save();
                    this.ctx.globalAlpha = sparkle.alpha;
                    this.ctx.translate(sparkle.x, sparkle.y);
                    this.ctx.rotate(sparkle.rotation);
                    this.ctx.scale(sparkle.scale, sparkle.scale);
                    this.ctx.drawImage(
                        frame,
                        -sparkle.size / 2,
                        -sparkle.size / 2,
                        sparkle.size,
                        sparkle.size
                    );
                    this.ctx.restore();
                }
            }
        });
    }
    
    drawFloor() {
        // Draw subtle floor pattern (hand-drawn style)
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 3]);
        
        // Draw lane dividers (subtle)
        for (let i = 1; i < 5; i++) {
            const x = i * this.player.laneWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines for depth (subtle)
        for (let y = 0; y < this.canvas.height; y += 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawPlayer() {
        const p = this.player;
        this.ctx.save();
        
        // Draw shield bubble - centered on player
        if (p.hasShield) {
            this.ctx.strokeStyle = '#0984e3';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.width / 2 + 10, 0, Math.PI * 2); // Center on player position
            this.ctx.stroke();
        }
        
        // Draw happy glow
        if (p.isHappy) {
            this.ctx.shadowColor = '#55efc4';
            this.ctx.shadowBlur = 20;
        }
        
        // Draw cat using individual frame files (cat_frame_1, cat_frame_2, etc.) at 70ms per frame
        // Animation cycles through frames to show body/legs/tail movement ONLY
        // NO horizontal flipping, NO scaling, NO rotation - cat stays in same position and orientation
        if (this.images.catFrames && this.images.catFrames.length > 0) {
            // Use individual frame files (primary method)
            const frame = this.images.catFrames[this.catAnimationFrame % this.images.catFrames.length];
            if (frame && frame.complete && frame.width > 0 && frame.height > 0) {
                // Draw the current frame at 70ms per frame
                // NO transformation, NO flipping - just cycle through frames to show body/legs/tail animation
                // Cat stays in same position, only the frame changes to show movement
                this.ctx.save(); // Save context to ensure no transformations leak in
                this.ctx.drawImage(
                    frame,
                    p.x - p.width / 2,  // Center horizontally
                    p.y - p.height / 2,  // Center vertically
                    p.width,
                    p.height  // Destination: screen position (stays same, just frame changes)
                );
                this.ctx.restore(); // Restore context
            } else if (this.images.cat && this.images.cat.complete) {
                // Fallback to static cat if frames not ready
                this.ctx.drawImage(
                    this.images.cat,
                    p.x - p.width / 2,  // Center horizontally
                    p.y - p.height / 2,  // Center vertically
                    p.width,
                    p.height
                );
            } else {
                this.drawCatPlaceholder(p);
            }
        }
        // Fallback to sprite sheet if individual frames not available
        else if (this.images.catSprite && this.images.catSprite.complete && this.images.catSprite.width > 0 && this.images.catSprite.height > 0) {
            // Use sprite sheet animation
            const spriteHeight = this.images.catSprite.height;
            const spriteWidth = this.images.catSprite.width;
            
            // Detect frame count - assume horizontal strip (frames side by side)
            let frameCount = 4; // Default fallback
            if (spriteWidth > spriteHeight) {
                // Horizontal strip - frames are side by side
                frameCount = Math.round(spriteWidth / spriteHeight);
            } else if (spriteHeight > spriteWidth) {
                // Vertical strip - frames are stacked
                frameCount = Math.round(spriteHeight / spriteWidth);
            }
            
            // Ensure reasonable frame count
            frameCount = Math.max(1, Math.min(frameCount, 16)); // Between 1 and 16 frames
            
            const frameWidth = spriteWidth / frameCount;
            const currentFrame = this.catAnimationFrame % frameCount;
            const frameX = currentFrame * frameWidth;
            
            // Draw the current frame from sprite sheet
            this.ctx.save();
            this.ctx.drawImage(
                this.images.catSprite,
                frameX, 0, frameWidth, spriteHeight,  // Source: sprite sheet region (current frame)
                p.x - p.width / 2,
                p.y - p.height / 2,
                p.width,
                p.height
            );
            this.ctx.restore();
        }
        // Try individual frames
        else if (this.images.catFrames && this.images.catFrames.length > 0) {
            const frame = this.images.catFrames[this.catAnimationFrame % this.images.catFrames.length];
            if (frame && frame.complete) {
                this.ctx.drawImage(
                    frame,
                    p.x - p.width / 2,
                    p.y - p.height / 2,
                    p.width,
                    p.height
                );
            } else if (this.images.cat && this.images.cat.complete) {
                // Fallback to static cat
                this.ctx.drawImage(
                    this.images.cat,
                    p.x - p.width / 2,
                    p.y - p.height / 2,
                    p.width,
                    p.height
                );
            } else {
                this.drawCatPlaceholder(p);
            }
        }
        // Fallback to static cat image
        else if (this.images.cat && this.images.cat.complete) {
            this.ctx.drawImage(
                this.images.cat,
                p.x - p.width / 2,
                p.y - p.height / 2,
                p.width,
                p.height
            );
        } else {
            // Draw fallback placeholder
            this.drawCatPlaceholder(p);
        }
        
        this.ctx.restore();
    }
    
    drawCatPlaceholder(p) {
            // Fallback placeholder (hand-drawn style)
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.fillStyle = '#ffffff';
            
            // Draw head (circle)
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.width / 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw ears
            this.ctx.beginPath();
            this.ctx.moveTo(p.x - p.width * 0.2, p.y - p.height * 0.3);
            this.ctx.lineTo(p.x - p.width * 0.1, p.y - p.height * 0.5);
            this.ctx.lineTo(p.x, p.y - p.height * 0.3);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y - p.height * 0.3);
            this.ctx.lineTo(p.x + p.width * 0.1, p.y - p.height * 0.5);
            this.ctx.lineTo(p.x + p.width * 0.2, p.y - p.height * 0.3);
            this.ctx.stroke();
            
            // Draw eyes
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(p.x - p.width * 0.15, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(p.x + p.width * 0.15, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
    }
    
    drawDestination() {
        if (!this.destination || !this.destination.visible) return; // Only draw if visible
        
        const dest = this.destination;
        this.ctx.save();
        
        // Add pulsing glow effect when destination appears
        const pulse = Math.sin(this.gameTime / 200) * 0.3 + 0.7;
        this.ctx.globalAlpha = pulse;
        
        // Draw destination using image if available
        if (dest.image && this.imagesLoaded) {
            this.ctx.drawImage(
                dest.image,
                dest.x - dest.width / 2,
                dest.y - dest.height / 2,
                dest.width,
                dest.height
            );
        } else {
            // Fallback placeholder (litter box)
            this.ctx.strokeStyle = '#0984e3';
            this.ctx.lineWidth = 4;
            this.ctx.fillStyle = '#ffffff';
            
            // Draw box shape with glow
            this.ctx.shadowColor = '#0984e3';
            this.ctx.shadowBlur = 15;
            this.ctx.fillRect(
                dest.x - dest.width / 2,
                dest.y - dest.height / 2,
                dest.width,
                dest.height
            );
            this.ctx.shadowBlur = 0;
            this.ctx.strokeRect(
                dest.x - dest.width / 2,
                dest.y - dest.height / 2,
                dest.width,
                dest.height
            );
            
            // Draw label
            this.ctx.fillStyle = '#0984e3';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🚽', dest.x, dest.y + 5);
        }
        
        this.ctx.restore();
    }
    
    drawObstacle(obstacle) {
        this.ctx.save();
        
        if (obstacle.type === 'roomba') {
            // Draw Roomba with animation frames
            if (this.images.roombaFrames && this.images.roombaFrames.length > 0 && obstacle.animationFrame !== undefined) {
                const frame = this.images.roombaFrames[obstacle.animationFrame];
                if (frame && frame.complete) {
                    // Draw roomba frame
                    const drawX = obstacle.x - obstacle.width / 2;
                    const drawY = obstacle.y - obstacle.height / 2;
                    this.ctx.drawImage(frame, drawX, drawY, obstacle.width, obstacle.height);
                } else {
                    // Fallback: draw simple circle if frame not loaded
                    this.ctx.fillStyle = '#636e72';
                    this.ctx.beginPath();
                    this.ctx.arc(obstacle.x, obstacle.y, obstacle.width / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else {
                // Fallback: draw simple circle if no frames loaded
                this.ctx.fillStyle = '#636e72';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x, obstacle.y, obstacle.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw Roomba details
                this.ctx.fillStyle = '#2d3436';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x, obstacle.y, obstacle.width / 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else {
            // Draw static obstacles using image assets
            const size = obstacle.size || 'medium';
            let imageKey;
            
            if (size === 'small') {
                imageKey = 'obstacleSmall';
            } else if (size === 'big') {
                imageKey = 'obstacleBig';
            } else {
                imageKey = 'obstacleMedium';
            }
            
            // Use image if available
            if (this.images[imageKey] && this.imagesLoaded) {
                // Add shake animation for small and medium obstacles
                let shakeX = 0;
                let shakeY = 0;
                if (size === 'small' || size === 'medium') {
                    // Shake left and right
                    const shakeAmount = 2;
                    shakeX = Math.sin(this.gameTime / 50 + obstacle.x * 0.1) * shakeAmount;
                    shakeY = Math.cos(this.gameTime / 60 + obstacle.y * 0.1) * shakeAmount * 0.5;
                }
                
                this.ctx.drawImage(
                    this.images[imageKey],
                    obstacle.x - obstacle.width / 2 + shakeX,
                    obstacle.y - obstacle.height / 2 + shakeY,
                    obstacle.width,
                    obstacle.height
                );
            } else {
                // Fallback placeholder (hand-drawn style)
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = size === 'big' ? 4 : size === 'medium' ? 3 : 2;
                this.ctx.fillStyle = '#ffffff';
                
                // Draw rectangle (basket/box shape)
                this.ctx.fillRect(
                    obstacle.x - obstacle.width / 2,
                    obstacle.y - obstacle.height / 2,
                    obstacle.width,
                    obstacle.height
                );
                this.ctx.strokeRect(
                    obstacle.x - obstacle.width / 2,
                    obstacle.y - obstacle.height / 2,
                    obstacle.width,
                    obstacle.height
                );
                
                // Draw grid pattern (like basket weave)
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 1;
                const gridSpacing = size === 'big' ? 12 : size === 'medium' ? 8 : 5;
                
                // Horizontal lines
                for (let y = obstacle.y - obstacle.height / 2 + gridSpacing; 
                     y < obstacle.y + obstacle.height / 2; 
                     y += gridSpacing) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(obstacle.x - obstacle.width / 2, y);
                    this.ctx.lineTo(obstacle.x + obstacle.width / 2, y);
                    this.ctx.stroke();
                }
                
                // Vertical lines
                for (let x = obstacle.x - obstacle.width / 2 + gridSpacing; 
                     x < obstacle.x + obstacle.width / 2; 
                     x += gridSpacing) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, obstacle.y - obstacle.height / 2);
                    this.ctx.lineTo(x, obstacle.y + obstacle.height / 2);
                    this.ctx.stroke();
                }
            }
        }
        
        this.ctx.restore();
    }
    
    drawCollectible(item) {
        this.ctx.save();
        this.ctx.translate(item.x, item.y);
        // Removed rotation - collectibles don't rotate
        
        switch (item.type) {
            case 'coin':
                // Draw sparkle animation on coin first (behind coin)
                if (this.images.sparkleFrames && this.images.sparkleFrames.length > 0 && item.sparkleFrame !== undefined) {
                    const sparkleFrame = this.images.sparkleFrames[item.sparkleFrame];
                    if (sparkleFrame && sparkleFrame.complete && sparkleFrame.width > 0) {
                        const sparkleSize = item.width * 1.3; // Slightly larger than coin
                        this.ctx.globalAlpha = 0.9;
                        this.ctx.drawImage(
                            sparkleFrame,
                            -sparkleSize / 2,
                            -sparkleSize / 2,
                            sparkleSize,
                            sparkleSize
                        );
                        this.ctx.globalAlpha = 1.0;
                    }
                }
                
                // Try to use coin image if available
                if (this.images.coinImage && this.imagesLoaded) {
                    this.ctx.drawImage(
                        this.images.coinImage,
                        -item.width / 2,
                        -item.height / 2,
                        item.width,
                        item.height
                    );
                } else {
                    // Fallback: draw coin shape
                    this.ctx.fillStyle = '#fdcb6e';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, item.width / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#e17055';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    this.ctx.fillStyle = '#e17055';
                    this.ctx.font = 'bold 18px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('$', 0, 6);
                }
                break;
                
            case 'snack':
                this.ctx.fillStyle = '#00b894';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, item.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🐟', 0, 6); // Fish emoji
                break;
                
            case 'shield':
                // Try to use shield image if available
                if (this.images.shieldImage && this.imagesLoaded) {
                    this.ctx.drawImage(
                        this.images.shieldImage,
                        -item.width / 2,
                        -item.height / 2,
                        item.width,
                        item.height
                    );
                } else {
                    // Fallback: draw shield shape
                    this.ctx.strokeStyle = '#0984e3';
                    this.ctx.fillStyle = '#0984e3';
                    this.ctx.lineWidth = 3;
                    
                    // Draw shield shape (rounded top, pointed bottom)
                    const shieldWidth = item.width * 0.8;
                    const shieldHeight = item.height * 0.9;
                    this.ctx.beginPath();
                    // Top curve (rounded)
                    this.ctx.arc(0, -shieldHeight / 4, shieldWidth / 2, Math.PI, 0, false);
                    // Right side
                    this.ctx.lineTo(shieldWidth / 2, shieldHeight / 2);
                    // Bottom point
                    this.ctx.lineTo(0, shieldHeight / 2 + 5);
                    // Left side
                    this.ctx.lineTo(-shieldWidth / 2, shieldHeight / 2);
                    // Close path
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // Add a cross or decorative element
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    // Vertical line
                    this.ctx.moveTo(0, -shieldHeight / 4);
                    this.ctx.lineTo(0, shieldHeight / 3);
                    // Horizontal line
                    this.ctx.moveTo(-shieldWidth / 4, shieldHeight / 8);
                    this.ctx.lineTo(shieldWidth / 4, shieldHeight / 8);
                    this.ctx.stroke();
                }
                break;
                
        }
        
        this.ctx.restore();
    }
    
    // Color utility functions
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - Math.floor(255 * amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - Math.floor(255 * amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - Math.floor(255 * amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + Math.floor(255 * amount));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + Math.floor(255 * amount));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + Math.floor(255 * amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    animate(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.state === 'playing') {
            this.update(deltaTime);
        }
        
        this.render();
        requestAnimationFrame((time) => this.animate(time));
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    try {
        console.log('Initializing Cat Dash game...');
        const game = new CatDashGame();
        console.log('Game initialized successfully');
        window.game = game; // Make game accessible in console for debugging
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Error starting game. Please check the console for details.');
    }
});

