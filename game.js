// Cat Dash! - Game Engine
class CatDashGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;

        this.state = 'start';
        this.score = 0;
        this.baseSpeed = 1.2;
        this.currentSpeed = 1.2;
        this.speedMultiplier = 1.0;
        this.gameTime = 0;
        this.lives = 3;
        this.coins = 0;

        // Treats system (replaces happy bar)
        this.treatsCollected = 0;
        this.treatsNeeded = 5;

        // Combo system
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboWindow = 2000;
        this.comboMultiplier = 1.0;
        this.comboMultiplierTimer = 0;
        this.comboMultiplierDuration = 3000;

        // Level system
        this.currentLevel = 1;
        this.maxLevel = 3;
        this.levelTime = 0;
        this.levelTimeLimit = 60000;
        this.levelTransitionTimer = 0;
        this.levelTransitionDuration = 2000;

        this.levelConfig = {
            1: {
                timeLimit: 60000,
                baseSpeed: 1.0,
                obstacleSizes: ['small'],
                obstacleDensity: 0.3,
                jumpingCatDensity: 0.1,
                spawnInterval: 400,
                collectibleSpawnInterval: 350,
                shieldSpawnRate: 0.4,
                treatSpawnRate: 0.5,
                treatsNeeded: 5,
                description: 'Collect 5 treats to open the portal!'
            },
            2: {
                timeLimit: 60000,
                baseSpeed: 1.3,
                obstacleSizes: ['small'],
                obstacleDensity: 0.4,
                jumpingCatDensity: 0.2,
                spawnInterval: 350,
                collectibleSpawnInterval: 300,
                shieldSpawnRate: 0.4,
                treatSpawnRate: 0.5,
                treatsNeeded: 8,
                description: 'Watch out for Roombas! Collect 8 treats to open the portal.',
                destinationPosition: 'topRight'
            },
            3: {
                timeLimit: 60000,
                baseSpeed: 1.9,
                obstacleSizes: ['small', 'medium'],
                obstacleDensity: 0.7,
                jumpingCatDensity: 0.3,
                spawnInterval: 350,
                collectibleSpawnInterval: 250,
                shieldSpawnRate: 0.3,
                treatSpawnRate: 0.4,
                treatsNeeded: 10,
                description: 'Roombas move across lanes! Collect 10 treats to open the portal.',
                destinationPosition: 'bottomLeft'
            }
        };

        // Image assets
        this.images = {
            cat: null,
            catGif: null,
            catSprite: null,
            catFrames: [],
            catAfterPortalFrames: [],
            obstacleSmall: null,
            obstacleMedium: null,
            obstacleBig: null,
            shieldEffect: null,
            portalFrames: [],
            sparkleFrames: [],
            roombaFrames: [],
            jumpingCatFrames: [],
            coinFrames: [],
            fishFrames: [],
            shieldFrames: [],
            failFrames: [],
            successFrames: []
        };
        this.imagesLoaded = false;
        this.screenAnimInterval = null;

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
        this.audioPool = {};
        this.muted = localStorage.getItem('catRushMuted') === 'true';
        this.loadAudio();

        // Background music: two tracks, switched only at musical phrase boundaries
        this.music = {};
        this.currentMusicName = null;
        this.desiredMusicName = 'main';
        this.musicVolume = 0.35;
        // Both tracks are built of fixed-length phrases; switches land on these
        this.musicPhraseSeconds = { main: 3.2, portal: 10.6667 / 4 };
        this.musicSwitchWatcher = null;
        this.initMusic();
        this.catAnimationFrame = 0;
        this.catAnimationTimer = 0;
        this.catIsMoving = false;

        // Player (positioned at top)
        this.player = {
            x: this.canvas.width / 2,
            y: 100,
            width: 100,
            height: 100,
            // Hitbox is shrunk to match the cat's visible pixels (PNG has transparent padding)
            hitScaleX: 0.6,
            hitScaleY: 0.55,
            targetLane: 2,
            currentLane: 2,
            laneWidth: this.canvas.width / 5,
            hasShield: false,
            shieldTime: 0
        };

        // Game objects
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        this.feedbackTexts = [];
        this.sparkleAnimations = [];
        this.destination = null;

        // Spawning
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        this.obstacleSpawnInterval = 200;
        this.collectibleSpawnInterval = 100;

        // Input
        this.keys = {};
        this.joystick = {
            active: false,
            dx: 0,
            dy: 0,
            touchId: null,
            hStepCooldown: 0,
            wasPastHThreshold: 0
        };
        this.setupInput();
        this.setupJoystick();
        this.setupUI();
        this.loadImages();

        // Tile background
        this.tileScrollPos = 0;
        this.tileImgs = {};
        for (let lvl = 1; lvl <= this.maxLevel; lvl++) {
            const img = new Image();
            img.src = `assets/tile-level${lvl}.png`;
            this.tileImgs[lvl] = img;
        }

        // Start game loop
        this.lastTime = 0;
        this.animate(0);
    }

    loadImages() {
        const imagePaths = {
            cat: ['assets/cat.png', 'assets/cat.PNG'],
            catGif: ['assets/cat.gif', 'assets/cat.GIF'],
            catSprite: ['assets/cat_spritesheet.webp', 'assets/cat_spritesheet.PNG', 'assets/cat_spritesheet.png'],
            obstacleSmall: ['assets/obstacle_small.png', 'assets/obstacle_small.PNG'],
            obstacleMedium: ['assets/obstacle_medium.png', 'assets/obstacle_medium.PNG'],
            obstacleBig: ['assets/obstacle_big.png', 'assets/obstacle_big.PNG'],
            shieldEffect: ['assets/shield effect.png', 'assets/shield effect.PNG']
        };

        for (let i = 1; i <= 4; i++) {
            const frameNum = i.toString().padStart(2, '0');
            imagePaths[`catFrame${i}`] = [
                `assets/cat_frame_${frameNum}.PNG`,
                `assets/cat_frame_${frameNum}.png`,
                `assets/cat_frame_${i}.png`
            ];
        }

        for (let i = 1; i <= 4; i++) {
            imagePaths[`catAfterPortalFrame${i}`] = [
                `assets/cat-after-portal-opens/Cat_Dash_Cat-gotta_Poo-${i}.png`,
                `assets/cat-after-portal-opens/Cat_Dash_Cat-gotta_Poo-${i}.PNG`
            ];
        }

        for (let i = 1; i <= 4; i++) {
            imagePaths[`sparkleFrame${i}`] = [
                `assets/sparkles/sparkle${i}.PNG`,
                `assets/sparkles/sparkle${i}.png`
            ];
        }

        for (let i = 1; i <= 4; i++) {
            imagePaths[`roombaFrame${i}`] = [
                `assets/roomba/roomba${i}.PNG`,
                `assets/roomba/roomba${i}.png`
            ];
        }

        for (let i = 1; i <= 5; i++) {
            imagePaths[`jumpingCatFrame${i}`] = [
                `assets/jumping cat/Hopping_Cat-${i}.png`,
                `assets/jumping cat/Hopping_Cat-${i}.PNG`
            ];
        }

        for (let i = 1; i <= 4; i++) {
            imagePaths[`portalFrame${i}`] = [
                `assets/portal/Portal-${i}.png`,
                `assets/portal/Portal-${i}.PNG`,
                `assets/portal/portal-${i}.png`
            ];
        }

        for (let i = 1; i <= 4; i++) {
            imagePaths[`fishFrame${i}`] = [
                `assets/fish/fish-${i}.png`,
                `assets/fish/fish-${i}.PNG`
            ];
        }

        for (let i = 1; i <= 6; i++) {
            imagePaths[`coinFrame${i}`] = [
                `assets/coin/coin-${i}.png`,
                `assets/coin/coin-${i}.PNG`
            ];
        }

        for (let i = 1; i <= 8; i++) {
            imagePaths[`shieldFrame${i}`] = [
                `assets/shield/shield-${i}.png`,
                `assets/shield/shield-${i}.PNG`
            ];
        }

        this.images.catFrames = [];
        this.images.catAfterPortalFrames = [];
        this.images.roombaFrames = [];
        this.images.jumpingCatFrames = [];
        this.images.sparkleFrames = [];
        this.images.portalFrames = [];
        this.images.coinFrames = [];
        this.images.fishFrames = [];
        this.images.shieldFrames = [];
        this.images.failFrames = [];
        this.images.successFrames = [];

        for (let i = 1; i <= 12; i++) {
            const img = new Image();
            img.src = `assets/level-animations/cat_dash_fail/Cat_Dash_Fail-${i}.png`;
            if (img.decode) img.decode().catch(() => {});
            this.images.failFrames[i - 1] = img;
        }
        for (let i = 1; i <= 21; i++) {
            const img = new Image();
            img.src = `assets/level-animations/cat_dash_success/Cat_Dash_Cat-${i}.png`;
            if (img.decode) img.decode().catch(() => {});
            this.images.successFrames[i - 1] = img;
        }

        let loadedCount = 0;
        const totalImages = Object.keys(imagePaths).length;

        const tryLoadImage = (key, paths, index = 0) => {
            if (index >= paths.length) {
                loadedCount++;
                if (loadedCount === totalImages) this.imagesLoaded = true;
                return;
            }

            const img = new Image();
            img.onload = () => {
                if (key.startsWith('catAfterPortalFrame')) {
                    const frameNum = parseInt(key.replace('catAfterPortalFrame', ''));
                    this.images.catAfterPortalFrames[frameNum - 1] = img;
                } else if (key.startsWith('catFrame')) {
                    const frameNum = parseInt(key.replace('catFrame', ''));
                    this.images.catFrames[frameNum - 1] = img;
                } else if (key.startsWith('sparkleFrame')) {
                    const frameNum = parseInt(key.replace('sparkleFrame', ''));
                    this.images.sparkleFrames[frameNum - 1] = img;
                } else if (key.startsWith('roombaFrame')) {
                    const frameNum = parseInt(key.replace('roombaFrame', ''));
                    this.images.roombaFrames[frameNum - 1] = img;
                } else if (key.startsWith('jumpingCatFrame')) {
                    const frameNum = parseInt(key.replace('jumpingCatFrame', ''));
                    this.images.jumpingCatFrames[frameNum - 1] = img;
                } else if (key.startsWith('portalFrame')) {
                    const frameNum = parseInt(key.replace('portalFrame', ''));
                    this.images.portalFrames[frameNum - 1] = img;
                } else if (key.startsWith('fishFrame')) {
                    const frameNum = parseInt(key.replace('fishFrame', ''));
                    this.images.fishFrames[frameNum - 1] = img;
                } else if (key.startsWith('coinFrame')) {
                    const frameNum = parseInt(key.replace('coinFrame', ''));
                    this.images.coinFrames[frameNum - 1] = img;
                } else if (key.startsWith('shieldFrame')) {
                    const frameNum = parseInt(key.replace('shieldFrame', ''));
                    this.images.shieldFrames[frameNum - 1] = img;
                } else {
                    this.images[key] = img;
                }
                loadedCount++;
                if (loadedCount === totalImages) this.imagesLoaded = true;
            };

            img.onerror = () => tryLoadImage(key, paths, index + 1);
            img.src = paths[index];
        };

        Object.keys(imagePaths).forEach(key => tryLoadImage(key, imagePaths[key]));

        setTimeout(() => {
            if (!this.imagesLoaded) this.imagesLoaded = true;
        }, 3000);
    }

    loadAudio() {
        const audioPaths = {
            coin: ['audio/coin sound.mp3'],
            fish: ['audio/eating fish.wav'],
            shield: ['audio/mixkit-fairy-arcade-sparkle-866.wav'],
            levelComplete: ['audio/level complete mewo sound.wav'],
            gameClear: ['audio/game clear sound.wav'],
            lostLife: ['audio/lost life try again.wav'],
            obstacleHit: ['audio/hit obstacle.wav'],
            roombaHit: ['audio/roomba-bumping-things-68882.mp3']
        };

        const loadAudioFile = (key, paths, index = 0) => {
            if (index >= paths.length) return;
            const audio = new Audio();
            audio.oncanplaythrough = () => { this.audio[key] = audio; };
            audio.onerror = () => loadAudioFile(key, paths, index + 1);
            audio.src = paths[index];
            audio.preload = 'auto';
        };

        Object.keys(audioPaths).forEach(key => loadAudioFile(key, audioPaths[key]));
    }

    playSound(soundName, volume = 0.7, maxDuration = null) {
        if (this.muted) return;
        const sound = this.audio[soundName];
        if (!sound) return;

        if (!this.audioPool[soundName]) this.audioPool[soundName] = [];
        const pool = this.audioPool[soundName];

        let clone = pool.find(a => a.ended || a.paused);
        if (!clone && pool.length < 3) {
            clone = sound.cloneNode();
            pool.push(clone);
        }
        if (!clone) clone = pool[0];

        if (clone._stopTimer) { clearTimeout(clone._stopTimer); clone._stopTimer = null; }

        clone.currentTime = 0;
        clone.volume = volume;
        clone.play().catch(() => {});

        if (maxDuration) {
            clone._stopTimer = setTimeout(() => {
                clone.pause();
                clone.currentTime = 0;
            }, maxDuration * 1000);
        }
    }

    initMusic() {
        const tracks = {
            main: 'audio/cat-dash-song.wav',
            portal: 'audio/cat-dash-after-portal-opens.wav'
        };

        Object.keys(tracks).forEach(name => {
            const audio = new Audio(tracks[name]);
            audio.preload = 'auto';
            audio.volume = this.musicVolume;
            audio.muted = this.muted;
            // Loop manually via 'ended' so a pending track switch takes
            // effect exactly at the end of a loop.
            audio.loop = false;
            audio.addEventListener('ended', () => {
                if (this.currentMusicName === name) {
                    this.playMusicTrack(this.desiredMusicName);
                }
            });
            this.music[name] = audio;
        });

        // Autoplay is usually blocked until the first user gesture,
        // so retry on the first interaction.
        const startMusic = () => {
            if (!this.currentMusicName) this.playMusicTrack(this.desiredMusicName);
        };
        startMusic();
        const onFirstGesture = () => {
            document.removeEventListener('pointerdown', onFirstGesture);
            document.removeEventListener('keydown', onFirstGesture);
            startMusic();
        };
        document.addEventListener('pointerdown', onFirstGesture);
        document.addEventListener('keydown', onFirstGesture);
    }

    playMusicTrack(name) {
        const track = this.music[name];
        if (!track) return;
        this.cancelMusicSwitchWatcher();
        Object.keys(this.music).forEach(other => {
            if (other !== name) this.music[other].pause();
        });
        this.currentMusicName = name;
        track.currentTime = 0;
        track.play().catch(() => {
            // Autoplay blocked; the first-gesture handler will retry.
            if (this.currentMusicName === name) this.currentMusicName = null;
        });
    }

    // Request a track change; it takes effect at the end of the current
    // musical phrase so the connector lands on a loop boundary.
    setMusic(name) {
        this.desiredMusicName = name;
        if (!this.currentMusicName) {
            this.playMusicTrack(name);
        } else if (name === this.currentMusicName) {
            this.cancelMusicSwitchWatcher();
        } else {
            this.startMusicSwitchWatcher();
        }
    }

    startMusicSwitchWatcher() {
        if (this.musicSwitchWatcher) return;
        const track = this.music[this.currentMusicName];
        const phrase = this.musicPhraseSeconds[this.currentMusicName];
        if (!track || !phrase) return;

        const boundary = Math.ceil((track.currentTime + 0.05) / phrase) * phrase;
        this.musicSwitchWatcher = setInterval(() => {
            // Switch already happened (e.g. via 'ended') or was cancelled
            if (this.desiredMusicName === this.currentMusicName) {
                this.cancelMusicSwitchWatcher();
                return;
            }
            const cur = this.music[this.currentMusicName];
            if (cur && cur.currentTime >= boundary) {
                this.playMusicTrack(this.desiredMusicName);
            }
        }, 25);
    }

    cancelMusicSwitchWatcher() {
        if (this.musicSwitchWatcher) {
            clearInterval(this.musicSwitchWatcher);
            this.musicSwitchWatcher = null;
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
        } else if (this.state === 'levelClear' && (key === 'enter' || key === ' ')) {
            this.advanceFromLevelClear();
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
        const maxY = this.canvas.height - 100;
        const minY = 50;
        this.player.y = Math.max(minY, Math.min(maxY, this.player.y + direction * 20));
    }

    setupJoystick() {
        const base = document.getElementById('joystick');
        const knob = document.getElementById('joystick-knob');
        if (!base || !knob) return;

        const radius = 50; // max knob travel from center, px

        const getRect = () => base.getBoundingClientRect();

        const update = (clientX, clientY) => {
            const rect = getRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            let dx = clientX - cx;
            let dy = clientY - cy;
            const dist = Math.hypot(dx, dy);
            if (dist > radius) {
                dx = (dx / dist) * radius;
                dy = (dy / dist) * radius;
            }
            knob.style.transform = `translate(${dx}px, ${dy}px)`;
            this.joystick.dx = dx / radius;
            this.joystick.dy = dy / radius;
        };

        const reset = () => {
            this.joystick.active = false;
            this.joystick.touchId = null;
            this.joystick.dx = 0;
            this.joystick.dy = 0;
            this.joystick.wasPastHThreshold = 0;
            this.joystick.hStepCooldown = 0;
            knob.style.transform = 'translate(0px, 0px)';
        };

        base.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.joystick.active) return;
            const t = e.changedTouches[0];
            this.joystick.active = true;
            this.joystick.touchId = t.identifier;
            update(t.clientX, t.clientY);
        }, { passive: false });

        base.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystick.active) return;
            for (const t of e.changedTouches) {
                if (t.identifier === this.joystick.touchId) {
                    update(t.clientX, t.clientY);
                    break;
                }
            }
        }, { passive: false });

        const endHandler = (e) => {
            if (!this.joystick.active) return;
            for (const t of e.changedTouches) {
                if (t.identifier === this.joystick.touchId) {
                    reset();
                    break;
                }
            }
        };
        base.addEventListener('touchend', endHandler);
        base.addEventListener('touchcancel', endHandler);

        // Prevent default touch on canvas to stop scroll/zoom, but let buttons/inputs through
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
    }

    processJoystickInput(deltaTime) {
        if (this.state !== 'playing' || !this.joystick.active) {
            this.joystick.wasPastHThreshold = 0;
            this.joystick.hStepCooldown = 0;
            return;
        }

        const hThreshold = 0.5;
        const dx = this.joystick.dx;
        const sign = dx > hThreshold ? 1 : (dx < -hThreshold ? -1 : 0);

        if (sign !== 0) {
            if (this.joystick.wasPastHThreshold !== sign) {
                this.movePlayer(sign);
                this.joystick.hStepCooldown = 350;
                this.joystick.wasPastHThreshold = sign;
            } else {
                this.joystick.hStepCooldown -= deltaTime;
                if (this.joystick.hStepCooldown <= 0) {
                    this.movePlayer(sign);
                    this.joystick.hStepCooldown = 350;
                }
            }
        } else {
            this.joystick.wasPastHThreshold = 0;
            this.joystick.hStepCooldown = 0;
        }

        const dy = this.joystick.dy;
        if (Math.abs(dy) > 0.15) {
            const vSpeed = 0.35; // px per ms at full deflection
            const maxY = this.canvas.height - 100;
            const minY = 50;
            this.player.y = Math.max(minY, Math.min(maxY, this.player.y + dy * vSpeed * deltaTime));
        }
    }

    setupUI() {
        const startScreen = document.getElementById('start-screen');
        const tryAgainScreen = document.getElementById('try-again-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const gameClearScreen = document.getElementById('game-clear-screen');
        const pauseButton = document.getElementById('pause-button');

        if (startScreen) { startScreen.classList.remove('hidden'); startScreen.style.display = 'flex'; }
        if (tryAgainScreen) { tryAgainScreen.classList.add('hidden'); tryAgainScreen.style.display = 'none'; }
        if (gameOverScreen) { gameOverScreen.classList.add('hidden'); gameOverScreen.style.display = 'none'; }
        if (gameClearScreen) { gameClearScreen.classList.add('hidden'); gameClearScreen.style.display = 'none'; }
        if (pauseButton) { pauseButton.classList.add('hidden'); pauseButton.style.display = 'none'; }
        document.getElementById('ui-container').style.display = 'none';

        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('yes-button').addEventListener('click', () => this.tryAgain());
        document.getElementById('exit-button').addEventListener('click', () => this.goToStartScreen());
        document.getElementById('restart-button').addEventListener('click', () => this.restart());
        document.getElementById('clear-restart-button').addEventListener('click', () => this.restart());
        document.getElementById('next-level-button').addEventListener('click', () => this.advanceFromLevelClear());
        // Score submission only happens on Game Clear (finishing all levels), not Game Over
        document.getElementById('clear-submit-score-button').addEventListener('click', () => this.handleScoreSubmit());
        document.getElementById('pause-button').addEventListener('click', () => this.togglePause());

        const muteButton = document.getElementById('mute-button');
        if (muteButton) {
            this.updateMuteButton();
            muteButton.addEventListener('click', () => this.toggleMute());
        }

        // Home-screen modals (leaderboard + help)
        const openLeaderboard = document.getElementById('open-leaderboard');
        if (openLeaderboard) {
            openLeaderboard.addEventListener('click', () => {
                this.openModal('leaderboard-modal');
                this.loadStartScreenLeaderboard();
            });
        }
        const openHelp = document.getElementById('open-help');
        if (openHelp) {
            openHelp.addEventListener('click', () => this.openModal('help-modal'));
        }
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay || e.target.hasAttribute('data-close-modal')) {
                    overlay.classList.add('hidden');
                }
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay').forEach(o => o.classList.add('hidden'));
            }
        });

        // Pre-fill name input from localStorage (Game Clear screen only)
        const storedName = getStoredPlayerName();
        if (storedName) {
            const clearNameInput = document.getElementById('clear-player-name-input');
            if (clearNameInput) clearNameInput.value = storedName;
        }

        // Load leaderboard on start screen
        this.loadStartScreenLeaderboard();
    }

    showUI(visible) {
        document.getElementById('ui-container').style.display = visible ? '' : 'none';
    }

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('hidden');
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('catRushMuted', this.muted);
        // Keep background music tracks in sync with the mute state
        Object.values(this.music).forEach(track => { if (track) track.muted = this.muted; });
        this.updateMuteButton();
    }

    updateMuteButton() {
        const muteButton = document.getElementById('mute-button');
        if (!muteButton) return;
        const icon = document.getElementById('mute-button-img');
        if (icon) {
            icon.src = this.muted
                ? 'assets/UI/UI_Elements_sound_off.png'
                : 'assets/UI/UI_Elements_sound_on.png';
        }
        muteButton.classList.toggle('muted', this.muted);
        muteButton.title = this.muted ? 'Unmute music' : 'Mute music';
        muteButton.setAttribute('aria-label', this.muted ? 'Unmute music' : 'Mute music');
    }

    startGame() {
        this.resetGame();
        this.state = 'levelTransition';
        this.levelTransitionTimer = this.levelTransitionDuration;
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('pause-button').classList.remove('hidden');
        document.getElementById('pause-button').style.display = '';
        this.showUI(true);
        this.loadPersonalBest();
    }

    restart() {
        this.stopScreenAnim();
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('game-clear-screen').classList.add('hidden');
        document.getElementById('game-clear-screen').style.display = 'none';
        document.getElementById('level-clear-screen').classList.add('hidden');
        document.getElementById('level-clear-screen').style.display = 'none';
        document.getElementById('try-again-screen').classList.add('hidden');
        document.getElementById('try-again-screen').style.display = 'none';
        document.getElementById('pause-button').classList.remove('hidden');
        document.getElementById('pause-button').style.display = '';
        this.showUI(true);
        this.resetGame();
        this.state = 'levelTransition';
        this.levelTransitionTimer = this.levelTransitionDuration;
    }

    resetGame() {
        this.setMusic('main');
        this.score = 0;
        this.currentLevel = 1;
        this.gameTime = 0;
        this.levelTime = 0;
        this.lives = 3;
        this.coins = 0;
        this.treatsCollected = 0;
        this.treatsNeeded = this.levelConfig[1].treatsNeeded;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1.0;
        this.comboMultiplierTimer = 0;
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        this.feedbackTexts = [];
        this.sparkleAnimations = [];
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        this.destination = null;

        this.player.x = this.canvas.width / 2;
        this.player.y = 100;
        this.player.targetLane = 2;
        this.player.currentLane = 2;
        this.player.hasShield = false;
        this.player.shieldTime = 0;

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
        this.treatsNeeded = config.treatsNeeded;

        let destX, destY;
        if (level === 1) {
            destX = this.canvas.width / 2;
            destY = this.canvas.height - 80;
        } else if (level === 2) {
            destX = this.canvas.width - 60;
            destY = 60;
        } else if (level === 3) {
            destX = 60;
            destY = this.canvas.height - 80;
        } else {
            destX = this.canvas.width / 2;
            destY = this.canvas.height - 80;
        }

        this.destination = {
            x: destX,
            y: destY,
            width: 150,
            height: 150,
            visible: false,
            animationFrame: 0,
            animationTimer: 0
        };
    }

    nextLevel() {
        // Award time bonus
        const timeRatio = this.levelTime / this.levelTimeLimit;
        if (timeRatio <= 0.5) {
            this.score += 50;
            this.createFeedback("Time Bonus +50!", this.canvas.width / 2, this.canvas.height / 2 + 40, '#f39c12');
        } else if (timeRatio <= 0.75) {
            this.score += 25;
            this.createFeedback("Time Bonus +25!", this.canvas.width / 2, this.canvas.height / 2 + 40, '#f39c12');
        }

        // Award level completion bonus
        this.score += 100;
        this.createFeedback("Level Complete +100!", this.canvas.width / 2, this.canvas.height / 2, '#00b894');

        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.treatsCollected = 0;
            this.comboCount = 0;
            this.comboTimer = 0;
            this.comboMultiplier = 1.0;
            this.comboMultiplierTimer = 0;
            this.initializeLevel(this.currentLevel);
            this.obstacles = [];
            this.collectibles = [];
            this.obstacleSpawnTimer = 0;
            this.collectibleSpawnTimer = 0;
            this.player.x = this.canvas.width / 2;
            this.player.y = 100;
            this.player.targetLane = 2;
            this.player.currentLane = 2;
            this.state = 'levelTransition';
            this.levelTransitionTimer = this.levelTransitionDuration;
        } else {
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

    loseLife(obstacle = null) {
        this.state = 'tryAgain';
        this.setMusic('main');
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        this.feedbackTexts = [];
        this.lives--;
        // Grey out the lost head right away; the update loop is not
        // running updateUI in this state
        this.updateUI();

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.playSound('lostLife', 0.7);
            const tryAgainScreen = document.getElementById('try-again-screen');
            const livesLeft = document.getElementById('lives-left');
            if (livesLeft) livesLeft.textContent = this.lives;
            if (tryAgainScreen) { tryAgainScreen.classList.remove('hidden'); tryAgainScreen.style.display = 'flex'; }
            this.startScreenAnim('fail-anim-try-again', this.images.failFrames, 8);
            this.showFailObstacle(obstacle);
            document.getElementById('pause-button').classList.add('hidden');
        }
    }

    showFailObstacle(obstacle) {
        const obstacleImg = document.getElementById('fail-obstacle-try-again');
        if (!obstacleImg) return;
        if (!obstacle) { obstacleImg.style.display = 'none'; return; }

        let src = null;
        if (obstacle.type === 'roomba') {
            const frame = this.images.roombaFrames && this.images.roombaFrames[0];
            if (frame) src = frame.src;
        } else if (obstacle.type === 'jumpingCat') {
            const frame = this.images.jumpingCatFrames && this.images.jumpingCatFrames[0];
            if (frame) src = frame.src;
        } else {
            const size = obstacle.size || 'medium';
            const key = size === 'small' ? 'obstacleSmall' : size === 'big' ? 'obstacleBig' : 'obstacleMedium';
            if (this.images[key]) src = this.images[key].src;
        }

        if (src) {
            obstacleImg.src = src;
            obstacleImg.style.display = 'block';
        } else {
            obstacleImg.style.display = 'none';
        }
    }

    startScreenAnim(imgId, frames, fps = 20) {
        this.stopScreenAnim();
        const img = document.getElementById(imgId);
        if (!img || !frames || frames.length === 0) return;

        let frame = 0;
        img.src = frames[0].src;

        const frameDuration = 1000 / fps;
        let lastTime = performance.now();
        let acc = 0;

        const tick = (now) => {
            acc += now - lastTime;
            lastTime = now;
            // Advance as many frames as elapsed time calls for (stable cadence,
            // no drift / coalescing like setInterval).
            while (acc >= frameDuration) {
                acc -= frameDuration;
                frame = (frame + 1) % frames.length;
            }
            img.src = frames[frame].src;
            this.screenAnimRAF = requestAnimationFrame(tick);
        };
        this.screenAnimRAF = requestAnimationFrame(tick);
    }

    stopScreenAnim() {
        if (this.screenAnimRAF) {
            cancelAnimationFrame(this.screenAnimRAF);
            this.screenAnimRAF = null;
        }
        if (this.screenAnimInterval) {
            clearInterval(this.screenAnimInterval);
            this.screenAnimInterval = null;
        }
    }

    advanceFromLevelClear() {
        this.stopScreenAnim();
        const levelClearScreen = document.getElementById('level-clear-screen');
        if (levelClearScreen) { levelClearScreen.classList.add('hidden'); levelClearScreen.style.display = 'none'; }
        document.getElementById('pause-button').classList.remove('hidden');
        document.getElementById('pause-button').style.display = '';
        this.nextLevel();
    }

    showLevelClear() {
        this.state = 'levelClear';
        this.setMusic('main');
        const levelClearScreen = document.getElementById('level-clear-screen');
        const levelClearNumber = document.getElementById('level-clear-number');
        if (levelClearNumber) levelClearNumber.textContent = this.currentLevel;
        if (levelClearScreen) { levelClearScreen.classList.remove('hidden'); levelClearScreen.style.removeProperty('display'); levelClearScreen.style.display = 'flex'; }
        document.getElementById('pause-button').classList.add('hidden');
        this.startScreenAnim('success-anim-level-clear', this.images.successFrames, 8);
    }

    goToStartScreen() {
        this.state = 'start';

        this.stopScreenAnim();
        ['try-again-screen', 'game-over-screen', 'game-clear-screen', 'level-clear-screen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.add('hidden'); el.style.display = 'none'; }
        });

        const startScreen = document.getElementById('start-screen');
        if (startScreen) { startScreen.classList.remove('hidden'); startScreen.style.display = 'flex'; }
        document.getElementById('pause-button').classList.add('hidden');
        document.getElementById('personal-best-display').style.display = 'none';
        this.showUI(false);
        this.loadStartScreenLeaderboard();
    }

    tryAgain() {
        this.stopScreenAnim();
        this.state = 'playing';
        this.treatsCollected = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1.0;
        this.comboMultiplierTimer = 0;
        this.levelTime = 0;
        this.obstacleSpawnTimer = 0;
        this.collectibleSpawnTimer = 0;
        this.obstacles = [];
        this.collectibles = [];
        this.player.x = this.canvas.width / 2;
        this.player.y = 100;
        this.player.targetLane = 2;
        this.player.currentLane = 2;
        this.player.hasShield = false;
        this.player.shieldTime = 0;
        this.initializeLevel(this.currentLevel);

        const tryAgainScreen = document.getElementById('try-again-screen');
        if (tryAgainScreen) { tryAgainScreen.classList.add('hidden'); tryAgainScreen.style.display = 'none'; }
        document.getElementById('pause-button').classList.remove('hidden');
        document.getElementById('pause-button').style.display = '';
    }

    gameOver() {
        this.state = 'gameOver';
        this.scoreSubmitted = false;
        const tryAgainScreen = document.getElementById('try-again-screen');
        if (tryAgainScreen) { tryAgainScreen.classList.add('hidden'); tryAgainScreen.style.display = 'none'; }

        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-coins').textContent = this.coins;
        const messages = ["Meow! That was fun!", "Purr-fect try!", "You're a star!", "Amazing run!"];
        document.getElementById('feedback-message').textContent = messages[Math.floor(Math.random() * messages.length)];

        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) { gameOverScreen.classList.remove('hidden'); gameOverScreen.style.display = 'flex'; }
        this.startScreenAnim('fail-anim-game-over', this.images.failFrames, 8);
        document.getElementById('pause-button').classList.add('hidden');
        document.getElementById('personal-best-display').style.display = 'none';
        this.showUI(false);

        // Load leaderboard into end screen
        this.loadEndScreenLeaderboard('end-leaderboard-body');
    }

    gameClear() {
        this.state = 'gameClear';
        this.scoreSubmitted = false;
        this.playSound('gameClear', 0.8);

        const tryAgainScreen = document.getElementById('try-again-screen');
        if (tryAgainScreen) { tryAgainScreen.classList.add('hidden'); tryAgainScreen.style.display = 'none'; }

        document.getElementById('clear-score').textContent = this.score.toLocaleString();
        document.getElementById('clear-coins').textContent = this.coins;

        // Pre-fill name
        const storedName = getStoredPlayerName();
        const clearNameInput = document.getElementById('clear-player-name-input');
        if (storedName && clearNameInput) clearNameInput.value = storedName;
        document.getElementById('clear-name-error').textContent = '';

        const gameClearScreen = document.getElementById('game-clear-screen');
        if (gameClearScreen) { gameClearScreen.classList.remove('hidden'); gameClearScreen.style.display = 'flex'; }
        document.getElementById('pause-button').classList.add('hidden');
        document.getElementById('personal-best-display').style.display = 'none';
        this.showUI(false);

        // Load leaderboard into end screen
        this.loadEndScreenLeaderboard('clear-leaderboard-body');
    }

    update(deltaTime) {
        if (this.state === 'levelTransition') {
            this.levelTransitionTimer -= deltaTime;
            if (this.levelTransitionTimer <= 0) {
                this.state = 'playing';
            }
            return;
        }

        if (this.state !== 'playing') return;

        this.tileScrollPos = ((this.tileScrollPos - this.currentSpeed * deltaTime / 16) % 160 + 160) % 160;

        this.gameTime += deltaTime;
        this.levelTime += deltaTime;

        if (this.levelTime >= this.levelTimeLimit) {
            this.loseLife();
            return;
        }

        // Update combo
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }
        if (this.comboMultiplierTimer > 0) {
            this.comboMultiplierTimer -= deltaTime;
            if (this.comboMultiplierTimer <= 0) {
                this.comboMultiplier = 1.0;
            }
        }

        // Update cat animation
        const activeCatFrames = this.getActiveCatFrames();
        if (activeCatFrames && activeCatFrames.length > 0) {
            this.catAnimationTimer += deltaTime;
            if (this.catAnimationTimer > 70) {
                this.catAnimationTimer = 0;
                const maxFrames = activeCatFrames.filter(f => f && f.complete).length;
                if (maxFrames > 0) {
                    this.catAnimationFrame = (this.catAnimationFrame + 1) % maxFrames;
                }
            }
        } else if (this.images.catSprite && this.images.catSprite.complete && this.images.catSprite.width > 0) {
            this.catAnimationTimer += deltaTime;
            if (this.catAnimationTimer > 70) {
                this.catAnimationTimer = 0;
                const spriteWidth = this.images.catSprite.width;
                const spriteHeight = this.images.catSprite.height;
                let maxFrames = spriteWidth > spriteHeight
                    ? Math.round(spriteWidth / spriteHeight)
                    : spriteHeight > spriteWidth
                        ? Math.round(spriteHeight / spriteWidth)
                        : 4;
                maxFrames = Math.max(1, Math.min(maxFrames, 16));
                this.catAnimationFrame = (this.catAnimationFrame + 1) % maxFrames;
            }
        }

        const config = this.levelConfig[this.currentLevel];
        this.speedMultiplier = 1.0;
        this.currentSpeed = this.baseSpeed * this.speedMultiplier;
        this.obstacleSpawnInterval = config.spawnInterval;
        this.collectibleSpawnInterval = config.collectibleSpawnInterval || 200;

        this.processJoystickInput(deltaTime);

        // Update player lane position
        const targetX = this.player.targetLane * this.player.laneWidth + this.player.laneWidth / 2;
        this.player.x += (targetX - this.player.x) * 0.2;
        this.catIsMoving = Math.abs(targetX - this.player.x) > 1;
        this.player.currentLane = Math.round(this.player.x / this.player.laneWidth);

        if (this.player.hasShield) {
            this.player.shieldTime -= deltaTime;
            if (this.player.shieldTime <= 0) {
                this.player.hasShield = false;
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

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y -= this.currentSpeed * (obstacle.speed || 1);

            if (obstacle.type === 'roomba') {
                if (!obstacle.animationTimer) obstacle.animationTimer = 0;
                if (!obstacle.animationFrame) obstacle.animationFrame = 0;
                obstacle.animationTimer += deltaTime;
                if (obstacle.animationTimer >= 100) {
                    obstacle.animationTimer = 0;
                    if (this.images.roombaFrames && this.images.roombaFrames.length > 0) {
                        obstacle.animationFrame = (obstacle.animationFrame + 1) % this.images.roombaFrames.length;
                    }
                }

                if (this.currentLevel === 3 && obstacle.startLane !== undefined) {
                    if (obstacle.targetLane === undefined) {
                        const maxOffsetLeft = Math.min(obstacle.maxLanes, obstacle.startLane);
                        const maxOffsetRight = Math.min(obstacle.maxLanes, 4 - obstacle.startLane);
                        const maxOffset = Math.min(maxOffsetLeft, maxOffsetRight);
                        const laneOffset = (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * maxOffset + 1);
                        obstacle.targetLane = Math.max(0, Math.min(4, obstacle.startLane + laneOffset));
                    }

                    const roombaTargetX = obstacle.targetLane * this.player.laneWidth + this.player.laneWidth / 2;
                    const distance = roombaTargetX - obstacle.x;

                    if (Math.abs(distance) > 3) {
                        obstacle.x += Math.sign(distance) * 0.8;
                    } else {
                        const maxOffsetLeft = Math.min(obstacle.maxLanes, obstacle.startLane);
                        const maxOffsetRight = Math.min(obstacle.maxLanes, 4 - obstacle.startLane);
                        const maxOffset = Math.min(maxOffsetLeft, maxOffsetRight);
                        const laneOffset = (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * maxOffset + 1);
                        obstacle.targetLane = Math.max(0, Math.min(4, obstacle.startLane + laneOffset));
                        if (Math.abs(obstacle.targetLane - obstacle.startLane) > obstacle.maxLanes) {
                            obstacle.targetLane = obstacle.startLane + (obstacle.targetLane > obstacle.startLane ? obstacle.maxLanes : -obstacle.maxLanes);
                        }
                    }

                    const currentLaneNum = Math.floor(obstacle.x / this.player.laneWidth);
                    const minLane = Math.max(0, obstacle.startLane - obstacle.maxLanes);
                    const maxLane = Math.min(4, obstacle.startLane + obstacle.maxLanes);
                    if (currentLaneNum < minLane) {
                        obstacle.x = minLane * this.player.laneWidth + this.player.laneWidth / 2;
                    } else if (currentLaneNum > maxLane) {
                        obstacle.x = maxLane * this.player.laneWidth + this.player.laneWidth / 2;
                    }
                } else {
                    obstacle.moveTimer += 0.1;
                    obstacle.x += Math.sin(obstacle.moveTimer) * obstacle.direction * obstacle.speed;
                    if (obstacle.x < 0 || obstacle.x > this.canvas.width) {
                        obstacle.direction *= -1;
                    }
                }
            } else if (obstacle.type === 'jumpingCat') {
                const frames = this.images.jumpingCatFrames;
                const frameCount = (frames && frames.length) || 5;
                const frameMs = 90;
                obstacle.animationTimer += deltaTime;
                if (obstacle.animationTimer >= frameMs) {
                    obstacle.animationTimer -= frameMs;
                    if (frames && frames.length > 0) {
                        obstacle.animationFrame = (obstacle.animationFrame + 1) % frames.length;
                    }
                }
                // Vertical bob synced to one full animation loop (one arc per cycle)
                const period = frameCount * frameMs;
                obstacle.hopTimer = (obstacle.hopTimer + deltaTime) % period;
                obstacle.hopOffset = -Math.sin((obstacle.hopTimer / period) * Math.PI) * 18;
            }

            if (obstacle.y < -50) {
                this.obstacles.splice(i, 1);
                continue;
            }

            if (this.checkCollision(this.player, obstacle)) {
                if (this.player.hasShield) {
                    this.player.hasShield = false;
                    this.player.shieldTime = 0;
                    this.playSound('obstacleHit', 0.4);
                    this.createFeedback("Shield Used!", obstacle.x, obstacle.y);
                    this.createParticles(obstacle.x, obstacle.y, '#00b894');
                    this.obstacles.splice(i, 1);
                } else {
                    this.playSound('obstacleHit', 0.6);
                    this.loseLife(obstacle);
                    return;
                }
            }
        }

        // Update collectibles
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            collectible.y -= this.currentSpeed;

            if (collectible.type === 'coin' && collectible.sparkleFrame !== undefined) {
                collectible.sparkleTimer += deltaTime;
                if (collectible.sparkleTimer >= collectible.sparkleFrameDuration) {
                    collectible.sparkleTimer = 0;
                    if (this.images.sparkleFrames && this.images.sparkleFrames.length > 0) {
                        collectible.sparkleFrame = (collectible.sparkleFrame + 1) % this.images.sparkleFrames.length;
                    }
                }
            }

            if (collectible.type === 'coin' && collectible.coinFrame !== undefined) {
                collectible.coinTimer += deltaTime;
                if (collectible.coinTimer >= collectible.coinFrameDuration) {
                    collectible.coinTimer = 0;
                    if (this.images.coinFrames && this.images.coinFrames.length > 0) {
                        collectible.coinFrame = (collectible.coinFrame + 1) % this.images.coinFrames.length;
                    }
                }
            }

            if (collectible.type === 'treat' && collectible.fishFrame !== undefined) {
                collectible.fishTimer += deltaTime;
                if (collectible.fishTimer >= collectible.fishFrameDuration) {
                    collectible.fishTimer = 0;
                    if (this.images.fishFrames && this.images.fishFrames.length > 0) {
                        collectible.fishFrame = (collectible.fishFrame + 1) % this.images.fishFrames.length;
                    }
                }
            }

            if (collectible.type === 'shield' && collectible.shieldFrame !== undefined) {
                collectible.shieldTimer += deltaTime;
                if (collectible.shieldTimer >= collectible.shieldFrameDuration) {
                    collectible.shieldTimer = 0;
                    if (this.images.shieldFrames && this.images.shieldFrames.length > 0) {
                        collectible.shieldFrame = (collectible.shieldFrame + 1) % this.images.shieldFrames.length;
                    }
                }
            }

            if (collectible.y < -50) {
                this.collectibles.splice(i, 1);
                continue;
            }

            if (this.checkCollision(this.player, collectible)) {
                this.collectItem(collectible);
                this.collectibles.splice(i, 1);
            }
        }

        // Update portal animation
        if (this.destination && this.destination.visible) {
            this.destination.animationTimer += deltaTime;
            if (this.destination.animationTimer > 150) {
                this.destination.animationTimer = 0;
                const maxFrames = this.images.portalFrames.filter(f => f && f.complete).length;
                if (maxFrames > 0) {
                    this.destination.animationFrame = (this.destination.animationFrame + 1) % maxFrames;
                }
            }
        }

        // Check destination collision - require the cat to get close to the portal's
        // center rather than just touching its edge, so it visibly enters the portal
        if (this.destination && this.destination.visible && this.checkProximity(this.player, this.destination)) {
            if (this.state === 'playing') {
                this.state = 'levelComplete';
                this.createParticles(this.destination.x, this.destination.y, '#00b894', 'success');
                this.playSound('levelComplete', 0.7);
                setTimeout(() => this.showLevelClear(), 800);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= deltaTime;
            particle.alpha = Math.max(0, particle.life / particle.maxLife);
            if (particle.life <= 0) this.particles.splice(i, 1);
        }

        // Update feedback texts
        for (let i = this.feedbackTexts.length - 1; i >= 0; i--) {
            const text = this.feedbackTexts[i];
            text.y -= 2;
            text.life -= deltaTime;
            text.alpha = Math.max(0, text.life / text.maxLife);
            if (text.life <= 0) this.feedbackTexts.splice(i, 1);
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
            sparkle.scale += 0.02;
            sparkle.rotation += 0.1;
            if (sparkle.life <= 0) this.sparkleAnimations.splice(i, 1);
        }

        this.updateUI();
    }

    checkOverlap(newX, newY, newWidth, newHeight, minDistance = 60) {
        for (const obstacle of this.obstacles) {
            const dx = Math.abs(obstacle.x - newX);
            const dy = Math.abs(obstacle.y - newY);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = minDistance + (obstacle.width + obstacle.height) / 4 + (newWidth + newHeight) / 4;
            if (distance < minDist) return true;
        }
        for (const collectible of this.collectibles) {
            const dx = Math.abs(collectible.x - newX);
            const dy = Math.abs(collectible.y - newY);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = minDistance + (collectible.width + collectible.height) / 4 + (newWidth + newHeight) / 4;
            if (distance < minDist) return true;
        }
        return false;
    }

    spawnObstacle() {
        const config = this.levelConfig[this.currentLevel];
        if (!config) return;
        if (Math.random() > config.obstacleDensity) return;

        const types = ['box', 'basket', 'furniture'];
        const laneWidth = this.player.laneWidth;
        const sizeTypes = {
            small: { width: laneWidth * 0.4, height: laneWidth * 0.4 },
            medium: { width: laneWidth * 0.6, height: laneWidth * 0.6 },
            big: { width: laneWidth * 0.95, height: laneWidth * 0.95 }
        };

        let attempts = 0;
        let spawned = false;

        while (attempts < 10 && !spawned) {
            const lane = Math.floor(Math.random() * 5);
            const x = lane * this.player.laneWidth + this.player.laneWidth / 2;
            const y = this.canvas.height + 50;

            const jumpingCatDensity = config.jumpingCatDensity || 0;
            if (Math.random() < jumpingCatDensity) {
                const jSize = { width: laneWidth * 0.7, height: laneWidth * 0.7 };
                const jx = lane * this.player.laneWidth + this.player.laneWidth / 2;
                if (!this.checkOverlap(jx, y, jSize.width, jSize.height, 80)) {
                    this.obstacles.push({
                        x: jx, y,
                        width: jSize.width, height: jSize.height,
                        hitScale: 0.7,
                        type: 'jumpingCat', size: 'medium',
                        animationTimer: 0, animationFrame: 0,
                        hopTimer: 0, hopOffset: 0
                    });
                    spawned = true;
                }
            } else if (this.currentLevel >= 2 && Math.random() < 0.2) {
                const size = { width: 100, height: 100 };
                if (!this.checkOverlap(x, y, size.width, size.height, 80)) {
                    const startLane = lane;
                    const maxLanes = this.currentLevel === 3 ? 3 : 1;
                    this.obstacles.push({
                        x, y,
                        width: size.width, height: size.height,
                        hitScale: 0.85,
                        type: 'roomba', size: 'medium',
                        speed: 0.5 + Math.random() * 0.5,
                        direction: Math.random() < 0.5 ? -1 : 1,
                        moveTimer: 0, startLane, maxLanes,
                        targetLane: startLane + (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * maxLanes + 1),
                        animationTimer: 0, animationFrame: 0
                    });
                    spawned = true;
                }
            } else {
                const allowedSizes = config.obstacleSizes;
                const sizeType = allowedSizes[Math.floor(Math.random() * allowedSizes.length)];
                const size = sizeTypes[sizeType];
                const obstacleX = lane * this.player.laneWidth + this.player.laneWidth / 2;

                if (!this.checkOverlap(obstacleX, y, size.width, size.height, 80)) {
                    this.obstacles.push({
                        x: obstacleX, y,
                        width: size.width, height: size.height,
                        hitScale: 0.8,
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
        const treatRate = config.treatSpawnRate || 0.4;
        let type;

        if (rand < treatRate) {
            type = 'treat';
        } else if (rand < treatRate + 0.3) {
            type = 'coin';
        } else {
            type = 'shield';
        }

        let attempts = 0;
        let spawned = false;

        while (attempts < 10 && !spawned) {
            const lane = Math.floor(Math.random() * 5);
            const x = lane * this.player.laneWidth + this.player.laneWidth / 2;
            const y = this.canvas.height + 30;
            const collectibleSize = 35;

            if (!this.checkOverlap(x, y, collectibleSize, collectibleSize, 60)) {
                const collectible = { x, y, width: collectibleSize, height: collectibleSize, hitScale: 1.2, type };
                if (type === 'coin') {
                    collectible.sparkleFrame = 0;
                    collectible.sparkleTimer = 0;
                    collectible.sparkleFrameDuration = 100;
                    collectible.coinFrame = 0;
                    collectible.coinTimer = 0;
                    collectible.coinFrameDuration = 90;
                } else if (type === 'treat') {
                    collectible.fishFrame = 0;
                    collectible.fishTimer = 0;
                    collectible.fishFrameDuration = 120;
                } else if (type === 'shield') {
                    collectible.shieldFrame = 0;
                    collectible.shieldTimer = 0;
                    collectible.shieldFrameDuration = 90;
                }
                this.collectibles.push(collectible);
                spawned = true;
            }
            attempts++;
        }
    }

    registerComboHit() {
        this.comboCount++;
        this.comboTimer = this.comboWindow;
        if (this.comboCount >= 3 && this.comboMultiplier < 1.5) {
            this.comboMultiplier = 1.5;
            this.comboMultiplierTimer = this.comboMultiplierDuration;
            this.createFeedback("COMBO x1.5!", this.player.x, this.player.y - 50, '#e17055');
        }
    }

    collectItem(item) {
        this.registerComboHit();

        switch (item.type) {
            case 'coin': {
                const points = Math.floor(10 * this.comboMultiplier);
                this.score += points;
                this.coins += 1;
                this.playSound('coin', 0.5);
                this.createFeedback(`+${points}`, item.x, item.y, '#fdcb6e');
                this.createParticles(item.x, item.y, '#fdcb6e', 'coin');
                this.createSparkleAnimation(item.x, item.y);
                break;
            }
            case 'treat': {
                const points = Math.floor(5 * this.comboMultiplier);
                this.score += points;
                if (this.treatsCollected < this.treatsNeeded) {
                    this.treatsCollected++;
                }
                this.playSound('fish', 0.5);
                this.createFeedback(`+${points}`, item.x, item.y, '#00b894');
                this.createParticles(item.x, item.y, '#00b894', 'snack');

                if (this.treatsCollected >= this.treatsNeeded && this.destination && !this.destination.visible) {
                    this.destination.visible = true;
                    this.createFeedback("Portal opened!", this.canvas.width / 2, this.canvas.height / 2, '#0984e3');
                    this.setMusic('portal');
                }
                break;
            }
            case 'shield':
                this.player.hasShield = true;
                this.player.shieldTime = 10000;
                this.playSound('shield', 0.5);
                this.createFeedback("Shield!", item.x, item.y, '#0984e3');
                this.createParticles(item.x, item.y, '#0984e3', 'shield');
                break;
        }
    }

    checkCollision(obj1, obj2) {
        // Center-based AABB collision using effective (scaled) hitboxes.
        // PNG sprites include transparent padding, so we shrink each object's box
        // to match its visible art (hitScaleX/hitScaleY, or a uniform hitScale).
        const s1x = obj1.hitScaleX ?? obj1.hitScale ?? 1;
        const s1y = obj1.hitScaleY ?? obj1.hitScale ?? 1;
        const s2x = obj2.hitScaleX ?? obj2.hitScale ?? 1;
        const s2y = obj2.hitScaleY ?? obj2.hitScale ?? 1;

        const o1hw = (obj1.width * s1x) / 2;
        const o1hh = (obj1.height * s1y) / 2;
        const o2hw = (obj2.width * s2x) / 2;
        const o2hh = (obj2.height * s2y) / 2;

        const o1Left = obj1.x - o1hw;
        const o1Right = obj1.x + o1hw;
        const o1Top = obj1.y - o1hh;
        const o1Bottom = obj1.y + o1hh;
        const o2Left = obj2.x - o2hw;
        const o2Right = obj2.x + o2hw;
        const o2Top = obj2.y - o2hh;
        const o2Bottom = obj2.y + o2hh;
        return o1Left < o2Right && o1Right > o2Left && o1Top < o2Bottom && o1Bottom > o2Top;
    }

    checkProximity(obj1, obj2) {
        // Distance-based check between object centers - used where we want objects
        // to get near each other's center (not just overlap edges) before triggering
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const threshold = (Math.min(obj1.width, obj1.height) / 2 + Math.min(obj2.width, obj2.height) / 2) * 0.4;
        return distance < threshold;
    }

    createParticles(x, y, color, type = 'default') {
        if (type === 'coin') {
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
                const speed = 2 + Math.random() * 3;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 4,
                    color: ['#fdcb6e', '#f39c12', '#e67e22', '#d35400'][Math.floor(Math.random() * 4)],
                    life: 400 + Math.random() * 200, maxLife: 600, alpha: 1, type: 'spark'
                });
            }
        } else if (type === 'shield') {
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
                const speed = 2 + Math.random() * 2.5;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 3,
                    color: ['#bdc3c7', '#ecf0f1', '#95a5a6', '#0984e3'][Math.floor(Math.random() * 4)],
                    life: 450 + Math.random() * 150, maxLife: 600, alpha: 1, type: 'spark'
                });
            }
        } else if (type === 'snack') {
            for (let i = 0; i < 10; i++) {
                this.particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                    size: 2 + Math.random() * 3,
                    color: ['#00b894', '#55efc4', '#00cec9', '#81ecec'][Math.floor(Math.random() * 4)],
                    life: 400 + Math.random() * 200, maxLife: 600, alpha: 1, type: 'sparkle'
                });
            }
        } else if (type === 'success') {
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                const speed = 3 + Math.random() * 4;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 4,
                    color: ['#00b894', '#55efc4', '#00cec9', '#81ecec', '#ffffff'][Math.floor(Math.random() * 5)],
                    life: 600 + Math.random() * 400, maxLife: 1000, alpha: 1, type: 'spark'
                });
            }
        } else {
            for (let i = 0; i < 8; i++) {
                this.particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                    size: 3 + Math.random() * 3, color, life: 500, maxLife: 500, alpha: 1
                });
            }
        }
    }

    createFeedback(text, x, y, color = '#00b894') {
        this.feedbackTexts.push({ text, x, y, color, life: 1000, maxLife: 1000, alpha: 1 });
    }

    createSparkleAnimation(x, y) {
        if (this.images.sparkleFrames && this.images.sparkleFrames.length > 0) {
            this.sparkleAnimations.push({
                x, y, currentFrame: 0,
                frameCount: this.images.sparkleFrames.length,
                frameTimer: 0, frameDuration: 100, size: 60,
                scale: 0.8, rotation: 0,
                life: 400, maxLife: 400, alpha: 1
            });
        }
    }

    updateUI() {
        document.getElementById('score-value').textContent = this.score;
        document.querySelectorAll('#lives-heads .life-head').forEach((head, i) => {
            head.classList.toggle('lost', i >= this.lives);
        });
        document.getElementById('level-value').textContent = this.currentLevel;

        // Treats progress: one fish slot per treat needed, filled as collected
        const slots = document.getElementById('treats-slots');
        if (slots) {
            if (slots.childElementCount !== this.treatsNeeded) {
                slots.innerHTML = '';
                for (let i = 0; i < this.treatsNeeded; i++) {
                    const fish = document.createElement('img');
                    fish.src = 'assets/fish/fish-1.png';
                    fish.alt = '';
                    fish.className = 'treat-slot';
                    slots.appendChild(fish);
                }
            }
            Array.from(slots.children).forEach((fish, i) => {
                fish.classList.toggle('filled', i < this.treatsCollected);
            });
        }

        const remainingTime = Math.max(0, Math.ceil((this.levelTimeLimit - this.levelTime) / 1000));
        const timerEl = document.getElementById('timer-value');
        const timerContainer = document.getElementById('timer-display');
        timerEl.textContent = remainingTime;

        if (remainingTime <= 10) {
            timerContainer.classList.add('warning');
        } else {
            timerContainer.classList.remove('warning');
        }

        const treatsContainer = document.getElementById('treats-display');
        if (this.treatsCollected >= this.treatsNeeded) {
            treatsContainer.classList.add('complete');
        } else {
            treatsContainer.classList.remove('complete');
        }
    }

    render() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawFloor();

        this.collectibles.forEach(item => this.drawCollectible(item));
        this.obstacles.forEach(obstacle => this.drawObstacle(obstacle));

        if (this.destination) this.drawDestination();
        this.drawPlayer();

        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            if (particle.type === 'spark' || particle.type === 'sparkle') {
                this.ctx.shadowBlur = 5;
                this.ctx.shadowColor = particle.color;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
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
                    this.ctx.drawImage(frame, -sparkle.size / 2, -sparkle.size / 2, sparkle.size, sparkle.size);
                    this.ctx.restore();
                }
            }
        });

        // Draw combo indicator
        if (this.comboMultiplier > 1.0) {
            this.ctx.save();
            this.ctx.font = 'bold 20px Comic Sans MS';
            this.ctx.fillStyle = '#e17055';
            this.ctx.textAlign = 'center';
            const pulse = Math.sin(this.gameTime / 100) * 2;
            this.ctx.fillText('COMBO x1.5!', this.canvas.width / 2, 30 + pulse);
            this.ctx.restore();
        }

        // Draw level transition overlay
        if (this.state === 'levelTransition') {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const config = this.levelConfig[this.currentLevel];
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';

            this.ctx.font = 'bold 48px Comic Sans MS';
            this.ctx.fillText(`Level ${this.currentLevel}`, this.canvas.width / 2, this.canvas.height / 2 - 30);

            this.ctx.font = '24px Comic Sans MS';
            this.ctx.fillStyle = '#55efc4';
            this.ctx.fillText(config.description, this.canvas.width / 2, this.canvas.height / 2 + 20);

            this.ctx.font = '18px Comic Sans MS';
            this.ctx.fillStyle = '#b2bec3';
            const timeLimit = Math.round(config.timeLimit / 1000);
            this.ctx.fillText(`Time limit: ${timeLimit}s`, this.canvas.width / 2, this.canvas.height / 2 + 60);

            this.ctx.restore();
        }
    }

    drawFloor() {
        const ctx = this.ctx;
        const lw = this.player.laneWidth;     // 160
        // Per-level lane colors, alternating odd/even lanes
        const laneColorsByLevel = {
            1: ['#F4F2FF', '#FFFDE4', '#F4F2FF', '#FFFDE4', '#F4F2FF'],
            2: ['#717D92', '#D4D4CC', '#717D92', '#D4D4CC', '#717D92'],
            3: ['#ECE8E2', '#ECE8E2', '#ECE8E2', '#ECE8E2', '#ECE8E2']
        };
        const laneColors = laneColorsByLevel[this.currentLevel] || laneColorsByLevel[1];
        for (let lane = 0; lane < 5; lane++) {
            ctx.fillStyle = laneColors[lane];
            ctx.fillRect(lane * lw, 0, lw, this.canvas.height);
        }

        const tile = this.tileImgs[this.currentLevel] || this.tileImgs[1];
        if (!tile || !tile.complete || tile.naturalWidth === 0) return;

        const s = 160;                        // tile size = lane width, one tile per column
        const startY = -s + (this.tileScrollPos % s);
        const rows = Math.ceil(this.canvas.height / s) + 2;

        // All 5 lanes, rows aligned (no stagger offset)
        for (let r = 0; r < rows; r++) {
            const y = startY + r * s;
            for (let lane = 0; lane < 5; lane++) {
                ctx.drawImage(tile, lane * lw, y, s, s);
            }
        }
    }

    getActiveCatFrames() {
        if (this.destination && this.destination.visible &&
            this.images.catAfterPortalFrames && this.images.catAfterPortalFrames.length > 0) {
            return this.images.catAfterPortalFrames;
        }
        return this.images.catFrames;
    }

    drawPlayer() {
        const p = this.player;
        this.ctx.save();

        // Try individual frame files first, then sprite sheet, then static, then placeholder
        const activeCatFrames = this.getActiveCatFrames();
        if (activeCatFrames && activeCatFrames.length > 0) {
            const frame = activeCatFrames[this.catAnimationFrame % activeCatFrames.length];
            if (frame && frame.complete && frame.width > 0) {
                this.ctx.drawImage(frame, p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
            } else {
                this.drawCatFallback(p);
            }
        } else if (this.images.catSprite && this.images.catSprite.complete && this.images.catSprite.width > 0) {
            const spriteWidth = this.images.catSprite.width;
            const spriteHeight = this.images.catSprite.height;
            let frameCount = spriteWidth > spriteHeight
                ? Math.round(spriteWidth / spriteHeight)
                : spriteHeight > spriteWidth
                    ? Math.round(spriteHeight / spriteWidth)
                    : 4;
            frameCount = Math.max(1, Math.min(frameCount, 16));
            const frameWidth = spriteWidth / frameCount;
            const currentFrame = this.catAnimationFrame % frameCount;
            this.ctx.drawImage(
                this.images.catSprite,
                currentFrame * frameWidth, 0, frameWidth, spriteHeight,
                p.x - p.width / 2, p.y - p.height / 2, p.width, p.height
            );
        } else {
            this.drawCatFallback(p);
        }

        // Bubble drawn over the cat: its interior is transparent, so the
        // cat shows through and the rim wraps around it
        if (p.hasShield) {
            const effect = this.images.shieldEffect;
            if (effect && effect.complete && effect.width > 0) {
                const size = p.width * 1.5;
                this.ctx.drawImage(effect, p.x - size / 2, p.y - size / 2, size, size);
            } else {
                this.ctx.strokeStyle = '#0984e3';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.width / 2 + 10, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    drawCatFallback(p) {
        if (this.images.cat && this.images.cat.complete) {
            this.ctx.drawImage(this.images.cat, p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
        } else {
            this.drawCatPlaceholder(p);
        }
    }

    drawCatPlaceholder(p) {
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 3;
        this.ctx.fillStyle = '#ffffff';

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

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

        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(p.x - p.width * 0.15, p.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width * 0.15, p.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawDestination() {
        if (!this.destination || !this.destination.visible) return;
        const dest = this.destination;
        this.ctx.save();

        // Draw portal using animated frames (same pattern as cat frames)
        if (this.images.portalFrames && this.images.portalFrames.length > 0) {
            const frame = this.images.portalFrames[dest.animationFrame % this.images.portalFrames.length];
            if (frame && frame.complete && frame.width > 0) {
                this.ctx.drawImage(frame, dest.x - dest.width / 2, dest.y - dest.height / 2, dest.width, dest.height);
            } else {
                this.drawPortalPlaceholder(dest);
            }
        } else {
            this.drawPortalPlaceholder(dest);
        }

        this.ctx.restore();
    }

    drawPortalPlaceholder(dest) {
        this.ctx.strokeStyle = '#8e44ad';
        this.ctx.lineWidth = 4;
        this.ctx.fillStyle = 'rgba(142, 68, 173, 0.3)';
        this.ctx.shadowColor = '#8e44ad';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(dest.x, dest.y, dest.width / 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('\u{1F300}', dest.x, dest.y + 10);
    }

    drawObstacle(obstacle) {
        this.ctx.save();

        if (obstacle.type === 'roomba') {
            if (this.images.roombaFrames && this.images.roombaFrames.length > 0 && obstacle.animationFrame !== undefined) {
                const frame = this.images.roombaFrames[obstacle.animationFrame];
                if (frame && frame.complete) {
                    this.ctx.drawImage(frame, obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
                } else {
                    this.ctx.fillStyle = '#636e72';
                    this.ctx.beginPath();
                    this.ctx.arc(obstacle.x, obstacle.y, obstacle.width / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else {
                this.ctx.fillStyle = '#636e72';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x, obstacle.y, obstacle.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#2d3436';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x, obstacle.y, obstacle.width / 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else if (obstacle.type === 'jumpingCat') {
            const frames = this.images.jumpingCatFrames;
            const hop = obstacle.hopOffset || 0;
            const frame = frames && frames[obstacle.animationFrame];
            if (frame && frame.complete) {
                this.ctx.drawImage(frame,
                    obstacle.x - obstacle.width / 2,
                    obstacle.y - obstacle.height / 2 + hop,
                    obstacle.width, obstacle.height);
            } else {
                this.ctx.fillStyle = '#e17055';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x, obstacle.y + hop, obstacle.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else {
            const size = obstacle.size || 'medium';
            const imageKey = size === 'small' ? 'obstacleSmall' : size === 'big' ? 'obstacleBig' : 'obstacleMedium';

            if (this.images[imageKey] && this.imagesLoaded) {
                let shakeX = 0, shakeY = 0;
                if (size === 'small' || size === 'medium') {
                    shakeX = Math.sin(this.gameTime / 50 + obstacle.x * 0.1) * 2;
                    shakeY = Math.cos(this.gameTime / 60 + obstacle.y * 0.1) * 1;
                }
                this.ctx.drawImage(
                    this.images[imageKey],
                    obstacle.x - obstacle.width / 2 + shakeX,
                    obstacle.y - obstacle.height / 2 + shakeY,
                    obstacle.width, obstacle.height
                );
            } else {
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = size === 'big' ? 4 : size === 'medium' ? 3 : 2;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);
                this.ctx.strokeRect(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height);

                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 1;
                const gridSpacing = size === 'big' ? 12 : size === 'medium' ? 8 : 5;
                for (let y = obstacle.y - obstacle.height / 2 + gridSpacing; y < obstacle.y + obstacle.height / 2; y += gridSpacing) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(obstacle.x - obstacle.width / 2, y);
                    this.ctx.lineTo(obstacle.x + obstacle.width / 2, y);
                    this.ctx.stroke();
                }
                for (let x = obstacle.x - obstacle.width / 2 + gridSpacing; x < obstacle.x + obstacle.width / 2; x += gridSpacing) {
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

        switch (item.type) {
            case 'coin':
                if (this.images.sparkleFrames && this.images.sparkleFrames.length > 0 && item.sparkleFrame !== undefined) {
                    const sparkleFrame = this.images.sparkleFrames[item.sparkleFrame];
                    if (sparkleFrame && sparkleFrame.complete && sparkleFrame.width > 0) {
                        const sparkleSize = item.width * 1.3;
                        this.ctx.globalAlpha = 0.9;
                        this.ctx.drawImage(sparkleFrame, -sparkleSize / 2, -sparkleSize / 2, sparkleSize, sparkleSize);
                        this.ctx.globalAlpha = 1.0;
                    }
                }
                {
                    const coinFrame = this.images.coinFrames && this.images.coinFrames[item.coinFrame || 0];
                    if (coinFrame && coinFrame.complete && coinFrame.width > 0) {
                        this.ctx.drawImage(coinFrame, -item.width / 2, -item.height / 2, item.width, item.height);
                    } else {
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
                }
                break;

            case 'treat': {
                const fishFrame = this.images.fishFrames && this.images.fishFrames[item.fishFrame || 0];
                if (fishFrame && fishFrame.complete && fishFrame.width > 0) {
                    this.ctx.drawImage(fishFrame, -item.width / 2, -item.height / 2, item.width, item.height);
                } else {
                    this.ctx.fillStyle = '#00b894';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, item.width / 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = 'bold 20px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('\u{1F41F}', 0, 6);
                }
                break;
            }

            case 'shield': {
                const shieldFrame = this.images.shieldFrames && this.images.shieldFrames[item.shieldFrame || 0];
                if (shieldFrame && shieldFrame.complete && shieldFrame.width > 0) {
                    this.ctx.drawImage(shieldFrame, -item.width / 2, -item.height / 2, item.width, item.height);
                } else {
                    this.ctx.strokeStyle = '#0984e3';
                    this.ctx.fillStyle = '#0984e3';
                    this.ctx.lineWidth = 3;
                    const shieldWidth = item.width * 0.8;
                    const shieldHeight = item.height * 0.9;
                    this.ctx.beginPath();
                    this.ctx.arc(0, -shieldHeight / 4, shieldWidth / 2, Math.PI, 0, false);
                    this.ctx.lineTo(shieldWidth / 2, shieldHeight / 2);
                    this.ctx.lineTo(0, shieldHeight / 2 + 5);
                    this.ctx.lineTo(-shieldWidth / 2, shieldHeight / 2);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -shieldHeight / 4);
                    this.ctx.lineTo(0, shieldHeight / 3);
                    this.ctx.moveTo(-shieldWidth / 4, shieldHeight / 8);
                    this.ctx.lineTo(shieldWidth / 4, shieldHeight / 8);
                    this.ctx.stroke();
                }
                break;
            }
        }

        this.ctx.restore();
    }

    // --- Supabase / leaderboard wiring ---

    async loadStartScreenLeaderboard() {
        try {
            const data = await getLeaderboard();
            this.renderLeaderboard('leaderboard-body', data);
        } catch (e) {
            this.renderLeaderboard('leaderboard-body', null);
        }
    }

    async loadEndScreenLeaderboard(tbodyId) {
        try {
            const data = await getLeaderboard();
            this.renderLeaderboard(tbodyId, data);
        } catch (e) {
            this.renderLeaderboard(tbodyId, null);
        }
    }

    renderLeaderboard(tbodyId, data) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="lb-loading">No scores yet</td></tr>';
            return;
        }

        tbody.innerHTML = data.map((row, i) =>
            `<tr>
                <td>${i + 1}</td>
                <td>${this.escapeHtml(row.player_name)}</td>
                <td>${row.score.toLocaleString()}</td>
                <td>${row.coins_total}</td>
            </tr>`
        ).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async loadPersonalBest() {
        try {
            const best = await getPersonalBest();
            const el = document.getElementById('personal-best-display');
            const val = document.getElementById('personal-best-value');
            if (best && best.score > 0) {
                val.textContent = best.score.toLocaleString();
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        } catch (e) {
            document.getElementById('personal-best-display').style.display = 'none';
        }
    }

    async handleScoreSubmit() {
        // Scores are only submitted from the Game Clear screen (all levels finished).
        // Hard guard: never save on Game Over or any other state.
        if (this.state !== 'gameClear') {
            return;
        }

        const nameInput = document.getElementById('clear-player-name-input');
        const errorEl = document.getElementById('clear-name-error');
        const successEl = document.getElementById('clear-name-success');
        const submitBtn = document.getElementById('clear-submit-score-button');
        const playerName = nameInput ? nameInput.value : '';

        if (this.scoreSubmitted) {
            successEl.textContent = 'Already saved!';
            return;
        }

        if (!playerName.trim()) {
            errorEl.textContent = 'Please enter a name';
            successEl.textContent = '';
            return;
        }

        if (!isValidPlayerName(playerName)) {
            errorEl.textContent = 'Letters, numbers, spaces & emoji only';
            successEl.textContent = '';
            return;
        }

        errorEl.textContent = '';
        successEl.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        const cleanName = sanitizePlayerName(playerName);
        setStoredPlayerName(cleanName);

        try {
            await submitScore({
                playerName: cleanName,
                score: this.score,
                coinsEarned: this.coins,
                levelReached: this.currentLevel
            });
            this.scoreSubmitted = true;
            successEl.textContent = 'Score saved!';
            submitBtn.textContent = 'Saved';
            nameInput.disabled = true;

            // Refresh the leaderboard on this screen
            this.loadEndScreenLeaderboard('clear-leaderboard-body');
        } catch (e) {
            console.error('Score submit error:', e);
            errorEl.textContent = 'Save failed: ' + (e.message || 'unknown error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save';
        }
    }

    animate(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.state === 'playing' || this.state === 'levelTransition') {
            this.update(deltaTime);
        }

        this.render();
        requestAnimationFrame((time) => this.animate(time));
    }
}

window.addEventListener('load', () => {
    const game = new CatDashGame();
    window.game = game;
});
