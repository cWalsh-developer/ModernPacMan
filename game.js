// Game Configuration
const CONFIG = {
  TILE_SIZE: 20,
  PACMAN_SPEED: 0.8, // pixels per frame at 60fps (~1.5 tiles/sec - classic feel)
  GHOST_SPEED: 0.6, // Slower than Pac-Man for fair gameplay
  GHOST_SCARED_SPEED: 0.4, // Much slower when scared
  POWER_DURATION: 10000,
  INVERSE_DURATION: 15000,
  FRUIT_SPAWN_TIME: 10000,
  FRUIT_DURATION: 8000,
  INVERSE_LEVEL_THRESHOLD: 5,
  SPLIT_LEVEL_THRESHOLD: 2,
};

// Sound Manager using Web Audio API
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.muted = false;
    this.wakkaSoundPlaying = false;
    this.wakkaInterval = null;

    // Initialize on user interaction (required by browsers)
    document.addEventListener(
      "keydown",
      () => {
        if (!this.audioContext) {
          this.init();
        }
      },
      { once: true },
    );
  }

  init() {
    this.audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
  }

  // Play a tone with specific frequency and duration
  playTone(frequency, duration, type = "square", volume = 0.3) {
    if (!this.audioContext || this.muted) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration,
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Wakka wakka eating sound
  startWakkaSound() {
    if (this.wakkaSoundPlaying) return;
    this.wakkaSoundPlaying = true;

    let toggle = false;
    this.wakkaInterval = setInterval(() => {
      if (!this.muted && this.audioContext) {
        this.playTone(toggle ? 600 : 500, 0.1, "square", 0.15);
        toggle = !toggle;
      }
    }, 150);
  }

  stopWakkaSound() {
    this.wakkaSoundPlaying = false;
    if (this.wakkaInterval) {
      clearInterval(this.wakkaInterval);
      this.wakkaInterval = null;
    }
  }

  // Eat dot sound
  playEatDot() {
    this.playTone(400, 0.05, "square", 0.1);
  }

  // Power pellet sound
  playPowerPellet() {
    if (!this.audioContext || this.muted) return;

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(300 - i * 30, 0.15, "sine", 0.2);
      }, i * 80);
    }
  }

  // Eat ghost sound
  playEatGhost() {
    if (!this.audioContext || this.muted) return;

    const frequencies = [400, 500, 600, 700, 800];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.1, "square", 0.15);
      }, i * 40);
    });
  }

  // Death sound
  playDeath() {
    if (!this.audioContext || this.muted) return;

    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        this.playTone(800 - i * 50, 0.08, "sine", 0.2);
      }, i * 60);
    }
  }

  // Fruit collection sound
  playFruit() {
    if (!this.audioContext || this.muted) return;

    const frequencies = [523, 659, 784, 1047];
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, "sine", 0.15);
      }, i * 50);
    });
  }

  // Level complete sound
  playLevelComplete() {
    if (!this.audioContext || this.muted) return;

    const melody = [523, 587, 659, 784, 880, 988, 1047];
    melody.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, "sine", 0.2);
      }, i * 100);
    });
  }

  // Game start sound
  playGameStart() {
    if (!this.audioContext || this.muted) return;

    const melody = [659, 523, 659, 784, 880, 784, 659];
    melody.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.15, "triangle", 0.15);
      }, i * 120);
    });
  }

  // Split power activation
  playSplitPower() {
    if (!this.audioContext || this.muted) return;

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.playTone(400 + i * 100, 0.1, "sawtooth", 0.15);
      }, i * 50);
    }
  }

  // Teleport sound
  playTeleport() {
    if (!this.audioContext || this.muted) return;

    this.playTone(1200, 0.1, "sine", 0.2);
    setTimeout(() => this.playTone(400, 0.15, "sine", 0.2), 100);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopWakkaSound();
    }
    return this.muted;
  }
}

// Map Layout (0 = path, 1 = wall, 2 = dot, 3 = power pellet, 4 = ghost spawn, 5 = fruit spawn)
const MAP_LAYOUT = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 3, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 0, 0, 4, 0, 0, 0, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 5, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 3, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 3, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Game State
class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = MAP_LAYOUT[0].length * CONFIG.TILE_SIZE;
    this.canvas.height = MAP_LAYOUT.length * CONFIG.TILE_SIZE;

    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.highScore = parseInt(localStorage.getItem("pacmanHighScore")) || 0;
    this.paused = false;
    this.gameOver = false;
    this.gameStarted = false;

    this.map = JSON.parse(JSON.stringify(MAP_LAYOUT));
    this.pacman = null;
    this.ghosts = [];
    this.fruits = [];
    this.splitPacmans = [];

    this.powerMode = false;
    this.powerTimer = 0;
    this.inverseMode = false;
    this.inverseModeTimer = 0;
    this.inverseGraceTimer = 0;
    this.splitPowerCount = 1; // Start with 1 power-up by default
    this.splitPowerActive = false;
    this.teleportPowerCount = 1; // Start with 1 teleport by default
    this.randomTeleport = false;

    this.fruitSpawnTimer = 0;
    this.totalDots = 0;
    this.dotsEaten = 0;

    this.keys = {};
    this.lastTime = 0;
    this.soundManager = new SoundManager();

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.resetLevel();
    this.showMessage("READY!", "Press any key to start");
    this.updateUI();
    // Start the game loop immediately (it will just render until gameStarted is true)
    this.gameLoop();
  }

  setupEventListeners() {
    document.addEventListener("keydown", (e) => {
      // Prevent default behavior for arrow keys to stop page scrolling
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }

      if (!this.gameStarted) {
        this.gameStarted = true;
        this.hideMessage();
        this.soundManager.playGameStart();
      }

      this.keys[e.key] = true;

      if (
        e.key === " " &&
        this.splitPowerCount > 0 &&
        this.powerMode &&
        !this.inverseMode
      ) {
        this.activateSplitPower();
        e.preventDefault();
      }

      if (e.key === "Shift" && this.teleportPowerCount > 0) {
        this.activateTeleportPower();
        e.preventDefault();
      }

      if (e.key === "p" || e.key === "P") {
        this.togglePause();
      }

      if (e.key === "r" || e.key === "R") {
        this.restart();
      }

      if (e.key === "m" || e.key === "M") {
        this.soundManager.toggleMute();
      }
    });

    document.addEventListener("keyup", (e) => {
      // Prevent default behavior for arrow keys to stop page scrolling
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      this.keys[e.key] = false;
    });
  }

  resetLevel() {
    this.map = JSON.parse(JSON.stringify(MAP_LAYOUT));
    this.totalDots = 0;
    this.dotsEaten = 0;

    // Count dots
    for (let row of this.map) {
      for (let cell of row) {
        if (cell === 2 || cell === 3) {
          this.totalDots++;
        }
      }
    }

    // Create Pac-Man
    this.pacman = new PacMan(9, 15);

    // Create Ghosts - start in ghost house with scatter targets (corners for patrol)
    this.ghosts = [
      new Ghost(8, 7, "#FF0000", "red", { x: 17, y: 1 }), // Blinky - scatter to top right
      new Ghost(9, 7, "#FFB8FF", "pink", { x: 1, y: 1 }), // Pinky - scatter to top left
      new Ghost(10, 7, "#00FFFF", "cyan", { x: 17, y: 19 }), // Inky - scatter to bottom right
      new Ghost(9, 7, "#FFB852", "orange", { x: 1, y: 19 }), // Clyde - scatter to bottom left
    ];

    // Set release timers so ghosts exit house one by one
    this.ghosts[0].releaseTimer = 0; // Red exits immediately
    this.ghosts[1].releaseTimer = 3000; // Pink waits 3 seconds
    this.ghosts[2].releaseTimer = 6000; // Cyan waits 6 seconds
    this.ghosts[3].releaseTimer = 9000; // Orange waits 9 seconds

    this.fruits = [];
    this.splitPacmans = [];
    this.powerMode = false;
    this.powerTimer = 0;
    this.inverseMode = false;
    this.inverseModeTimer = 0;
    this.splitPowerActive = false;
    this.fruitSpawnTimer = 0;

    // Ghost mode system
    this.ghostMode = "scatter";
    this.ghostModeTimer = 7000;

    this.updateUI();
  }

  restart() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.gameStarted = false;
    this.splitPowerCount = 1;
    this.teleportPowerCount = 1;
    this.resetLevel();
    this.showMessage("READY!", "Press any key to start");
  }

  togglePause() {
    if (!this.gameOver && this.gameStarted) {
      this.paused = !this.paused;
      if (this.paused) {
        this.showMessage("PAUSED", "Press P to continue");
      } else {
        this.hideMessage();
      }
    }
  }

  showMessage(title, text) {
    document.getElementById("messageTitle").textContent = title;
    document.getElementById("messageText").textContent = text;
    document.getElementById("gameMessage").classList.remove("hidden");
  }

  hideMessage() {
    document.getElementById("gameMessage").classList.add("hidden");
  }

  updateUI() {
    document.getElementById("score").textContent = this.score;
    document.getElementById("level").textContent = this.level;
    document.getElementById("lives").textContent = this.lives;
    document.getElementById("highscore").textContent = this.highScore;

    // Update power-up status
    const splitStatus = document.getElementById("splitPowerStatus");
    splitStatus.classList.toggle("active", this.splitPowerCount > 0);
    splitStatus.querySelector(".power-value").textContent =
      this.splitPowerCount > 0
        ? this.powerMode
          ? `x${this.splitPowerCount}`
          : `x${this.splitPowerCount}`
        : "x0";

    const inverseStatus = document.getElementById("inverseModeStatus");
    inverseStatus.classList.toggle("active", this.inverseMode);
    inverseStatus.querySelector(".power-value").textContent = this.inverseMode
      ? "ACTIVE"
      : "OFF";

    const teleportStatus = document.getElementById("teleportMode");
    teleportStatus.classList.toggle("active", this.teleportPowerCount > 0);
    teleportStatus.querySelector(".power-value").textContent =
      `x${this.teleportPowerCount}`;
  }

  getLevelSpeedMultiplier() {
    // Increase speed by 8% per level, capped at level 10
    // Level 1: 1.0x, Level 2: 1.08x, Level 3: 1.16x ... Level 10+: 1.72x
    const levelForSpeed = Math.min(this.level, 10);
    return 1 + (levelForSpeed - 1) * 0.08;
  }

  gameLoop(currentTime = 0) {
    // CRITICAL: Always schedule next frame first to keep loop running
    requestAnimationFrame((time) => this.gameLoop(time));

    // Initialize lastTime on first frame
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
    }

    // Calculate delta time in milliseconds
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Cap deltaTime to prevent huge jumps (e.g., when tab loses focus)
    // Max 100ms (equivalent to 10 FPS minimum)
    if (deltaTime > 100 || deltaTime <= 0) {
      deltaTime = 16.67; // Reset to ~60fps frame time
    }

    // Always render, but only update if game has started
    if (this.gameStarted && !this.paused && !this.gameOver) {
      this.update(deltaTime);
    }

    this.render();
  }

  update(deltaTime) {
    // Calculate speed multiplier for frame-rate independence (60fps baseline)
    // Also apply level-based speed increase (capped at level 10)
    const baseSpeedMultiplier = deltaTime / 16.67;
    const levelSpeedMultiplier = this.getLevelSpeedMultiplier();
    const speedMultiplier = baseSpeedMultiplier * levelSpeedMultiplier;

    // Ghost mode alternation
    if (!this.powerMode && !this.inverseMode && !this.splitPowerActive) {
      this.ghostModeTimer -= deltaTime;

      if (this.ghostModeTimer <= 0) {
        if (this.ghostMode === "scatter") {
          this.ghostMode = "chase";
          this.ghostModeTimer = 20000;
        } else {
          this.ghostMode = "scatter";
          this.ghostModeTimer = 7000;
        }
      }
    }

    if (this.powerMode && !this.splitPowerActive) {
      this.powerTimer -= deltaTime;

      if (this.powerTimer <= 0) {
        this.powerMode = false;
        this.ghosts.forEach((ghost) => {
          ghost.scared = false;
          ghost.eaten = false;
        });
      }
    }

    if (this.inverseMode) {
      this.inverseModeTimer -= deltaTime;
      if (this.inverseModeTimer <= 0) {
        this.inverseMode = false;
        this.inverseGraceTimer = 0;
        this.ghosts.forEach((g) => {
          g.scared = false;
          g.isPlayer = false;
        });
      }
    }

    if (this.inverseGraceTimer > 0) {
      this.inverseGraceTimer -= deltaTime;
      if (this.inverseGraceTimer < 0) {
        this.inverseGraceTimer = 0;
      }
    }

    // Fruit spawning
    this.fruitSpawnTimer += deltaTime;
    if (
      this.fruitSpawnTimer >= CONFIG.FRUIT_SPAWN_TIME &&
      this.fruits.length === 0
    ) {
      this.spawnFruit();
      this.fruitSpawnTimer = 0;
    }

    // Update fruits
    this.fruits = this.fruits.filter((fruit) => {
      fruit.timer -= deltaTime;
      return fruit.timer > 0;
    });

    // Update Pac-Man or Ghost (inverse mode)
    if (!this.inverseMode) {
      if (this.splitPowerActive) {
        // In split mode: all 4 pac-men are AI-controlled, ghosts are frozen
        this.splitPacmans.forEach((sp) => this.updateSplitPacMan(sp, speedMultiplier));
        this.checkCollisions();
      } else {
        // Normal mode: player controls pac-man
        this.updatePacMan(speedMultiplier);

        // If inverse mode was triggered during updatePacMan(),
        // stop normal processing immediately so we don't instantly collide
        if (this.inverseMode) {
          this.updateUI();
          return;
        }

        this.ghosts.forEach((ghost) => this.updateGhost(ghost, speedMultiplier, deltaTime));
        this.checkCollisions();
      }
    } else {
      // Inverse mode: control ghost, pac-mans chase
      this.updatePlayerGhost(speedMultiplier);
      this.ghosts
        .filter((g) => !g.isPlayer)
        .forEach((ghost) => this.updateGhost(ghost, speedMultiplier, deltaTime));
      this.checkInverseCollisions();
    }

    // Check level completion
    if (this.dotsEaten >= this.totalDots) {
      this.nextLevel();
    }

    this.updateUI();
  }

  updatePacMan() {
    if (!this.pacman) return;

    let newX = this.pacman.x;
    let newY = this.pacman.y;
    let newDirection = this.pacman.direction;

    // Get desired direction from input
    let desiredDirection = null;
    if (this.inverseMode) {
      // Invert controls during inverse mode for extra challenge
      if (this.keys["ArrowUp"]) desiredDirection = "down";
      if (this.keys["ArrowDown"]) desiredDirection = "up";
      if (this.keys["ArrowLeft"]) desiredDirection = "right";
      if (this.keys["ArrowRight"]) desiredDirection = "left";
    } else {
      // Normal controls
      if (this.keys["ArrowUp"]) desiredDirection = "up";
      if (this.keys["ArrowDown"]) desiredDirection = "down";
      if (this.keys["ArrowLeft"]) desiredDirection = "left";
      if (this.keys["ArrowRight"]) desiredDirection = "right";
    }

    // Always keep Pac-Man aligned on the perpendicular axis to prevent getting stuck
    const alignThreshold = 5; // Increased threshold for better alignment

    if (this.pacman.direction === "up" || this.pacman.direction === "down") {
      // Moving vertically - keep aligned horizontally
      const targetX =
        Math.round(this.pacman.x / CONFIG.TILE_SIZE) * CONFIG.TILE_SIZE;
      const diffX = Math.abs(this.pacman.x - targetX);
      if (diffX < alignThreshold) {
        this.pacman.x = targetX;
        newX = targetX;
      }
    } else if (
      this.pacman.direction === "left" ||
      this.pacman.direction === "right"
    ) {
      // Moving horizontally - keep aligned vertically
      const targetY =
        Math.round(this.pacman.y / CONFIG.TILE_SIZE) * CONFIG.TILE_SIZE;
      const diffY = Math.abs(this.pacman.y - targetY);
      if (diffY < alignThreshold) {
        this.pacman.y = targetY;
        newY = targetY;
      }
    }

    // If changing direction, align on the NEW perpendicular axis
    if (desiredDirection && desiredDirection !== this.pacman.direction) {
      if (desiredDirection === "up" || desiredDirection === "down") {
        // Turning vertically - align horizontally
        const targetX =
          Math.round(this.pacman.x / CONFIG.TILE_SIZE) * CONFIG.TILE_SIZE;
        const diffX = Math.abs(this.pacman.x - targetX);
        if (diffX <= alignThreshold) {
          this.pacman.x = targetX;
          newX = targetX;
        }
      } else {
        // Turning horizontally - align vertically
        const targetY =
          Math.round(this.pacman.y / CONFIG.TILE_SIZE) * CONFIG.TILE_SIZE;
        const diffY = Math.abs(this.pacman.y - targetY);
        if (diffY <= alignThreshold) {
          this.pacman.y = targetY;
          newY = targetY;
        }
      }
    }

    // Apply movement based on current direction or desired direction
    if (desiredDirection) {
      const testX = newX;
      const testY = newY;

      // Calculate new position based on desired direction
      if (desiredDirection === "up") newY -= CONFIG.PACMAN_SPEED;
      if (desiredDirection === "down") newY += CONFIG.PACMAN_SPEED;
      if (desiredDirection === "left") newX -= CONFIG.PACMAN_SPEED;
      if (desiredDirection === "right") newX += CONFIG.PACMAN_SPEED;

      // If we can move in desired direction, update direction
      if (this.canMove(newX, newY)) {
        newDirection = desiredDirection;
      } else {
        // Can't move in desired direction, try current direction
        newX = testX;
        newY = testY;
        if (this.pacman.direction === "up") newY -= CONFIG.PACMAN_SPEED;
        if (this.pacman.direction === "down") newY += CONFIG.PACMAN_SPEED;
        if (this.pacman.direction === "left") newX -= CONFIG.PACMAN_SPEED;
        if (this.pacman.direction === "right") newX += CONFIG.PACMAN_SPEED;
      }
    }

    // Check if Pac-Man is actually moving
    const isMoving = newX !== this.pacman.x || newY !== this.pacman.y;

    if (this.canMove(newX, newY)) {
      this.pacman.x = newX;
      this.pacman.y = newY;
      this.pacman.direction = newDirection;
    }

    // Play wakka sound only when actually moving
    if (isMoving && this.canMove(this.pacman.x, this.pacman.y)) {
      this.soundManager.startWakkaSound();
    } else {
      this.soundManager.stopWakkaSound();
    }

    // Handle screen wrap/teleport
    this.handleTeleport(this.pacman);

    // Eat dots - check based on Pac-Man's center point
    const centerX = this.pacman.x + CONFIG.TILE_SIZE / 2;
    const centerY = this.pacman.y + CONFIG.TILE_SIZE / 2;
    const gridX = Math.floor(centerX / CONFIG.TILE_SIZE);
    const gridY = Math.floor(centerY / CONFIG.TILE_SIZE);

    // Make sure we're within bounds
    if (
      gridY >= 0 &&
      gridY < this.map.length &&
      gridX >= 0 &&
      gridX < this.map[0].length
    ) {
      const cell = this.map[gridY]?.[gridX];

      if (cell === 2) {
        this.map[gridY][gridX] = 0;
        this.score += 10;
        this.dotsEaten++;
        this.soundManager.playEatDot();
      } else if (cell === 3) {
        this.map[gridY][gridX] = 0;
        this.score += 50;
        this.dotsEaten++;
        this.soundManager.playPowerPellet();
        this.activatePowerMode();
      }
    }

    // Eat fruits
    this.fruits = this.fruits.filter((fruit) => {
      const dist = Math.hypot(this.pacman.x - fruit.x, this.pacman.y - fruit.y);
      if (dist < CONFIG.TILE_SIZE) {
        if (fruit.type === "split") {
          this.splitPowerCount++; // Add a power-up to the counter
          this.score += 100;
        } else if (fruit.type === "teleport") {
          this.teleportPowerCount++; // Add a teleport to the counter
          this.score += 150;
        } else {
          this.score += fruit.points;
        }
        this.soundManager.playFruit();
        return false;
      }
      return true;
    });
  }

  findNearestTargetGhost(x, y) {
    let nearest = null;
    let minDist = Infinity;

    for (const ghost of this.ghosts) {
      if (!ghost.eaten) {
        const dist = Math.hypot(ghost.x - x, ghost.y - y);
        if (dist < minDist) {
          minDist = dist;
          nearest = ghost;
        }
      }
    }

    return nearest;
  }

  updateSplitPacMan(sp) {
    if (sp.completed) return;

    const targetGhost = this.ghosts[sp.targetGhostIndex];
    if (!targetGhost || targetGhost.eaten) {
      sp.completed = true;
      return;
    }

    if (!sp.path || sp.path.length === 0 || sp.pathIndex >= sp.path.length) {
      this.rebuildSplitPath(sp);
      if (sp.completed) return;
    }

    const speed = CONFIG.PACMAN_SPEED * 1.1;
    const waypoint = sp.path[sp.pathIndex];

    if (!waypoint) {
      this.rebuildSplitPath(sp);
      return;
    }

    const dx = waypoint.x - sp.x;
    const dy = waypoint.y - sp.y;

    if (Math.abs(dx) <= speed && Math.abs(dy) <= speed) {
      sp.x = waypoint.x;
      sp.y = waypoint.y;
      sp.pathIndex++;

      if (sp.pathIndex >= sp.path.length) {
        return;
      }
    }

    const next = sp.path[sp.pathIndex];
    if (!next) return;

    if (next.x > sp.x) sp.direction = "right";
    else if (next.x < sp.x) sp.direction = "left";
    else if (next.y > sp.y) sp.direction = "down";
    else if (next.y < sp.y) sp.direction = "up";

    const moved = this.moveEntityInDirection(sp, speed);

    // If blocked, recover instead of freezing
    if (!moved) {
      this.rebuildSplitPath(sp);
      if (sp.completed) return;

      const retry = sp.path[sp.pathIndex];
      if (!retry) return;

      if (retry.x > sp.x) sp.direction = "right";
      else if (retry.x < sp.x) sp.direction = "left";
      else if (retry.y > sp.y) sp.direction = "down";
      else if (retry.y < sp.y) sp.direction = "up";

      this.moveEntityInDirection(sp, speed);
    }

    this.handleTeleport(sp);
  }

  updateGhost(ghost) {
    if (ghost.isPlayer) return;
    if (ghost.eaten) return; // Don't update eaten ghosts while they're waiting to respawn

    let target = null;

    if (!this.inverseMode) {
      if (ghost.mode === "exitingHouse") {
        if (ghost.releaseTimer > 0) {
          ghost.releaseTimer -= 16.67;
          return;
        }

        const speed = ghost.scared
          ? CONFIG.GHOST_SCARED_SPEED
          : CONFIG.GHOST_SPEED;

        const leftExit = { x: 8 * CONFIG.TILE_SIZE, y: 6 * CONFIG.TILE_SIZE };
        const rightExit = { x: 10 * CONFIG.TILE_SIZE, y: 6 * CONFIG.TILE_SIZE };

        const distLeft = Math.abs(ghost.x - leftExit.x);
        const distRight = Math.abs(ghost.x - rightExit.x);
        const targetExit = distLeft <= distRight ? leftExit : rightExit;

        if (Math.abs(ghost.x - targetExit.x) > 1) {
          ghost.direction = ghost.x < targetExit.x ? "right" : "left";
          this.moveEntityInDirection(ghost, speed);
          return;
        }

        ghost.x = targetExit.x;
        ghost.direction = "up";

        if (ghost.y > targetExit.y) {
          this.moveEntityInDirection(ghost, speed);
          return;
        }

        ghost.y = targetExit.y;
        ghost.mode = this.ghostMode;
      }

      // IMPORTANT:
      // Blue ghosts should still move using the same roaming/chase logic.
      // The only difference is that Pac-Man can now eat them.
      ghost.mode = this.ghostMode;
      target = this.getGhostTarget(ghost);
    } else {
      const playerGhost = this.ghosts.find((g) => g.isPlayer);
      if (playerGhost) {
        target = { x: playerGhost.x, y: playerGhost.y };
      }
    }

    if (target) {
      this.moveGhostTowards(ghost, target);
    }

    this.handleTeleport(ghost);
  }

  updatePlayerGhost() {
    const ghost = this.ghosts.find((g) => g.isPlayer);
    if (!ghost) return;

    let newX = ghost.x;
    let newY = ghost.y;

    if (this.keys["ArrowUp"]) newY -= CONFIG.GHOST_SPEED;
    if (this.keys["ArrowDown"]) newY += CONFIG.GHOST_SPEED;
    if (this.keys["ArrowLeft"]) newX -= CONFIG.GHOST_SPEED;
    if (this.keys["ArrowRight"]) newX += CONFIG.GHOST_SPEED;

    if (this.canMove(newX, newY)) {
      ghost.x = newX;
      ghost.y = newY;
    }

    this.handleTeleport(ghost);

    // Gain points for survival in inverse mode
    this.score += 2; // Double points as specified
  }

  getTileCenter(value) {
    return Math.round(value / CONFIG.TILE_SIZE) * CONFIG.TILE_SIZE;
  }

  isEntityCentered(entity, threshold = 2) {
    const centerX = this.getTileCenter(entity.x);
    const centerY = this.getTileCenter(entity.y);
    return (
      Math.abs(entity.x - centerX) <= threshold &&
      Math.abs(entity.y - centerY) <= threshold
    );
  }

  getAvailableDirections(ghost) {
    const step = CONFIG.TILE_SIZE;
    const directions = [
      { dir: "up", x: ghost.x, y: ghost.y - step },
      { dir: "down", x: ghost.x, y: ghost.y + step },
      { dir: "left", x: ghost.x - step, y: ghost.y },
      { dir: "right", x: ghost.x + step, y: ghost.y },
    ];

    return directions.filter((d) => this.canMove(d.x, d.y));
  }

  chooseGhostDirection(ghost, target) {
    const oppositeDir = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };

    let options = this.getAvailableDirections(ghost);

    // Avoid reversing unless there is no other option
    const nonReverse = options.filter(
      (opt) => opt.dir !== oppositeDir[ghost.direction],
    );

    if (nonReverse.length > 0) {
      options = nonReverse;
    }

    if (options.length === 0) return ghost.direction;

    // Pick option whose next tile is closest to target
    let best = options[0];
    let bestDist = Math.hypot(best.x - target.x, best.y - target.y);

    for (const opt of options) {
      const dist = Math.hypot(opt.x - target.x, opt.y - target.y);
      if (dist < bestDist) {
        best = opt;
        bestDist = dist;
      }
    }

    return best.dir;
  }

  getRandomDirection(ghost) {
    const oppositeDir = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };

    let options = this.getAvailableDirections(ghost);

    // avoid immediate reversal unless forced
    const nonReverse = options.filter(
      (opt) => opt.dir !== oppositeDir[ghost.direction],
    );

    if (nonReverse.length > 0) {
      options = nonReverse;
    }

    if (options.length === 0) return ghost.direction;

    const choice = options[Math.floor(Math.random() * options.length)];
    return choice.dir;
  }

  moveFrightenedGhost(ghost) {
    const speed = CONFIG.GHOST_SCARED_SPEED;
    const centered = this.isEntityCentered(ghost, 0.5);

    if (centered) {
      ghost.x = this.getTileCenter(ghost.x);
      ghost.y = this.getTileCenter(ghost.y);

      const available = this.getAvailableDirections(ghost);
      const canContinue = available.some((d) => d.dir === ghost.direction);

      // At junctions, dead ends, or if blocked, pick a random valid direction
      if (available.length >= 3 || available.length === 1 || !canContinue) {
        ghost.direction = this.getRandomDirection(ghost);
      }
    }

    const moved = this.moveEntityInDirection(ghost, speed);

    if (!moved) {
      ghost.direction = this.getRandomDirection(ghost);
      this.moveEntityInDirection(ghost, speed);
    }
  }

  moveEntityInDirection(entity, speed) {
    let newX = entity.x;
    let newY = entity.y;

    if (entity.direction === "up") newY -= speed;
    if (entity.direction === "down") newY += speed;
    if (entity.direction === "left") newX -= speed;
    if (entity.direction === "right") newX += speed;

    if (this.canMove(newX, newY)) {
      entity.x = newX;
      entity.y = newY;
      return true;
    }

    return false;
  }

  getPacmanTile() {
    return {
      x: this.toGrid(this.pacman.x, this.pacman.y).x,
      y: this.toGrid(this.pacman.x, this.pacman.y).y,
    };
  }

  getGhostByName(name) {
    return this.ghosts.find((g) => g.name === name);
  }

  getTileInFrontOfPacman(tilesAhead = 4) {
    const pac = this.getPacmanTile();
    let x = pac.x;
    let y = pac.y;

    if (this.pacman.direction === "up") y -= tilesAhead;
    if (this.pacman.direction === "down") y += tilesAhead;
    if (this.pacman.direction === "left") x -= tilesAhead;
    if (this.pacman.direction === "right") x += tilesAhead;

    return { x, y };
  }

  clampTargetToMap(tile) {
    return {
      x: Math.max(0, Math.min(this.map[0].length - 1, tile.x)),
      y: Math.max(0, Math.min(this.map.length - 1, tile.y)),
    };
  }

  tileToPixels(tile) {
    return {
      x: tile.x * CONFIG.TILE_SIZE,
      y: tile.y * CONFIG.TILE_SIZE,
    };
  }

  getGhostTarget(ghost) {
    const pacTile = this.getPacmanTile();

    // scatter mode = corner patrol
    if (this.ghostMode === "scatter") {
      return this.tileToPixels(ghost.scatterTarget);
    }

    // frightened/scared handled elsewhere, so this is chase logic
    switch (ghost.name) {
      case "red": {
        // Blinky: direct chase
        return { x: this.pacman.x, y: this.pacman.y };
      }

      case "pink": {
        // Pinky: ambush 4 tiles ahead
        const targetTile = this.clampTargetToMap(
          this.getTileInFrontOfPacman(4),
        );
        return this.tileToPixels(targetTile);
      }

      case "cyan": {
        // Inky-inspired: vector from Blinky to 2 tiles ahead of Pac-Man, doubled
        const blinky = this.getGhostByName("red");
        const front = this.getTileInFrontOfPacman(2);

        if (!blinky) {
          return this.tileToPixels(this.clampTargetToMap(front));
        }

        const blinkyTile = this.toGrid(blinky.x, blinky.y);
        const vx = front.x - blinkyTile.x;
        const vy = front.y - blinkyTile.y;

        const targetTile = this.clampTargetToMap({
          x: front.x + vx,
          y: front.y + vy,
        });

        return this.tileToPixels(targetTile);
      }

      case "orange": {
        // Chase Pac-Man, but only aim 2 tiles ahead for a looser feel
        const targetTile = this.clampTargetToMap(
          this.getTileInFrontOfPacman(2),
        );
        return this.tileToPixels(targetTile);
      }

      default:
        return { x: this.pacman.x, y: this.pacman.y };
    }
  }

  getFrightenedTarget(ghost) {
    // Safety check
    if (!this.pacman) {
      return { x: ghost.x, y: ghost.y - 100 }; // Just move up as fallback
    }

    const corners = [
      { x: 1, y: 1 },
      { x: this.map[0].length - 2, y: 1 },
      { x: 1, y: this.map.length - 2 },
      { x: this.map[0].length - 2, y: this.map.length - 2 },
    ];

    let bestCorner = corners[0];
    let bestDist = -1;

    for (const corner of corners) {
      const px = corner.x * CONFIG.TILE_SIZE;
      const py = corner.y * CONFIG.TILE_SIZE;
      const dist = Math.hypot(px - this.pacman.x, py - this.pacman.y);

      if (dist > bestDist) {
        bestDist = dist;
        bestCorner = corner;
      }
    }

    return this.tileToPixels(bestCorner);
  }

  toGrid(x, y) {
    return {
      x: Math.floor((x + CONFIG.TILE_SIZE / 2) / CONFIG.TILE_SIZE),
      y: Math.floor((y + CONFIG.TILE_SIZE / 2) / CONFIG.TILE_SIZE),
    };
  }

  isWalkableTile(x, y) {
    if (y < 0 || y >= this.map.length || x < 0 || x >= this.map[0].length) {
      return false;
    }
    return this.map[y][x] !== 1;
  }

  getTileNeighbors(tile) {
    const dirs = [
      { dir: "up", x: tile.x, y: tile.y - 1 },
      { dir: "down", x: tile.x, y: tile.y + 1 },
      { dir: "left", x: tile.x - 1, y: tile.y },
      { dir: "right", x: tile.x + 1, y: tile.y },
    ];

    return dirs.filter((d) => this.isWalkableTile(d.x, d.y));
  }

  findPath(startX, startY, targetX, targetY) {
    const start = this.toGrid(startX, startY);
    const target = this.toGrid(targetX, targetY);

    const queue = [start];
    const visited = new Set([`${start.x},${start.y}`]);
    const parent = new Map();

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.x === target.x && current.y === target.y) {
        break;
      }

      for (const next of this.getTileNeighbors(current)) {
        const key = `${next.x},${next.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          parent.set(key, current);
          queue.push({ x: next.x, y: next.y });
        }
      }
    }

    const targetKey = `${target.x},${target.y}`;
    if (!visited.has(targetKey)) {
      return [];
    }

    const path = [];
    let step = target;

    while (!(step.x === start.x && step.y === start.y)) {
      path.push({
        x: step.x * CONFIG.TILE_SIZE,
        y: step.y * CONFIG.TILE_SIZE,
      });
      step = parent.get(`${step.x},${step.y}`);
      if (!step) return [];
    }

    path.reverse();
    return path;
  }

  findPathDirection(startX, startY, targetX, targetY, currentDirection = "up") {
    const start = this.toGrid(startX, startY);
    const target = this.toGrid(targetX, targetY);

    if (start.x === target.x && start.y === target.y) {
      return currentDirection;
    }

    const queue = [start];
    const visited = new Set([`${start.x},${start.y}`]);
    const parent = new Map();

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.x === target.x && current.y === target.y) {
        break;
      }

      for (const next of this.getTileNeighbors(current)) {
        const key = `${next.x},${next.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          parent.set(key, current);
          queue.push({ x: next.x, y: next.y, dir: next.dir });
        }
      }
    }

    const targetKey = `${target.x},${target.y}`;
    if (!visited.has(targetKey)) {
      return currentDirection;
    }

    let step = { x: target.x, y: target.y };
    let prev = parent.get(`${step.x},${step.y}`);

    while (prev && !(prev.x === start.x && prev.y === start.y)) {
      step = prev;
      prev = parent.get(`${step.x},${step.y}`);
    }

    if (step.x > start.x) return "right";
    if (step.x < start.x) return "left";
    if (step.y > start.y) return "down";
    if (step.y < start.y) return "up";

    return currentDirection;
  }

  moveGhostTowards(ghost, target) {
    const speed = ghost.scared ? CONFIG.GHOST_SCARED_SPEED : CONFIG.GHOST_SPEED;

    const centered = this.isEntityCentered(ghost, 0.1);

    if (centered) {
      ghost.x = this.getTileCenter(ghost.x);
      ghost.y = this.getTileCenter(ghost.y);

      const available = this.getAvailableDirections(ghost);
      const canContinue = available.some((d) => d.dir === ghost.direction);

      if (available.length >= 3 || available.length === 1 || !canContinue) {
        ghost.direction = this.chooseGhostDirection(ghost, target);
      }
    }

    const moved = this.moveEntityInDirection(ghost, speed);

    if (!moved) {
      const available = this.getAvailableDirections(ghost);
      if (available.length > 0) {
        ghost.direction = this.chooseGhostDirection(ghost, target);
        this.moveEntityInDirection(ghost, speed);
      }
    }
  }

  getOppositePoint(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return {
      x: x2 + dx * 2,
      y: y2 + dy * 2,
    };
  }

  findNearestScaredGhost(x, y) {
    let nearest = null;
    let minDist = Infinity;

    for (let ghost of this.ghosts) {
      if (ghost.scared && !ghost.eaten) {
        const dist = Math.hypot(ghost.x - x, ghost.y - y);
        if (dist < minDist) {
          minDist = dist;
          nearest = ghost;
        }
      }
    }

    return nearest;
  }

  canMove(x, y) {
    // Check all four corners of the entity's bounding box
    const padding = 2; // Small padding to prevent getting stuck in corners
    const size = CONFIG.TILE_SIZE - padding;

    const corners = [
      { x: x + padding, y: y + padding }, // Top-left
      { x: x + size, y: y + padding }, // Top-right
      { x: x + padding, y: y + size }, // Bottom-left
      { x: x + size, y: y + size }, // Bottom-right
    ];

    for (let corner of corners) {
      const gridX = Math.floor(corner.x / CONFIG.TILE_SIZE);
      const gridY = Math.floor(corner.y / CONFIG.TILE_SIZE);

      // Check bounds - allow teleport at edges
      if (
        gridY < 0 ||
        gridY >= this.map.length ||
        gridX < 0 ||
        gridX >= this.map[0].length
      ) {
        continue; // Allow for teleport
      }

      const cell = this.map[gridY]?.[gridX];
      if (cell === 1) {
        return false; // Wall collision detected
      }
    }

    return true; // No collisions
  }

  handleTeleport(entity) {
    const mapWidth = this.map[0].length * CONFIG.TILE_SIZE;
    const mapHeight = this.map.length * CONFIG.TILE_SIZE;

    if (entity.x < 0) {
      if (this.randomTeleport) {
        this.teleportToRandom(entity);
      } else {
        entity.x = mapWidth - CONFIG.TILE_SIZE;
      }
    } else if (entity.x >= mapWidth) {
      if (this.randomTeleport) {
        this.teleportToRandom(entity);
      } else {
        entity.x = 0;
      }
    }

    if (entity.y < 0) {
      if (this.randomTeleport) {
        this.teleportToRandom(entity);
      } else {
        entity.y = mapHeight - CONFIG.TILE_SIZE;
      }
    } else if (entity.y >= mapHeight) {
      if (this.randomTeleport) {
        this.teleportToRandom(entity);
      } else {
        entity.y = 0;
      }
    }
  }

  teleportToRandom(entity) {
    let validPositions = [];

    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        if (this.map[y][x] !== 1) {
          validPositions.push({
            x: x * CONFIG.TILE_SIZE,
            y: y * CONFIG.TILE_SIZE,
          });
        }
      }
    }

    if (validPositions.length > 0) {
      const pos =
        validPositions[Math.floor(Math.random() * validPositions.length)];
      entity.x = pos.x;
      entity.y = pos.y;
      this.soundManager.playTeleport();
    }
  }

  activatePowerMode() {
    if (this.level >= CONFIG.INVERSE_LEVEL_THRESHOLD && Math.random() < 0.3) {
      // Activate inverse mode
      this.activateInverseMode();
    } else {
      // Normal power mode
      this.powerMode = true;
      this.powerTimer = CONFIG.POWER_DURATION;
      this.ghosts.forEach((ghost) => {
        ghost.scared = true;
        ghost.eaten = false;
      });
    }
  }

  activateInverseMode() {
    this.inverseMode = true;
    this.inverseModeTimer = CONFIG.INVERSE_DURATION;

    // brief grace period so transformation cannot instantly kill the player
    this.inverseGraceTimer = 1000;

    // Store Pac-Man's exact current position/direction
    const pacmanX = this.pacman.x;
    const pacmanY = this.pacman.y;
    const pacmanDir = this.pacman.direction;

    // Clear any previous player flags
    this.ghosts.forEach((ghost) => {
      ghost.isPlayer = false;
      ghost.scared = false;
      ghost.eaten = false;
    });

    // Use the first ghost object as the player avatar, but place it exactly
    // where Pac-Man currently is so control continues from that location
    const playerGhost = this.ghosts[0];
    playerGhost.isPlayer = true;
    playerGhost.x = pacmanX;
    playerGhost.y = pacmanY;
    playerGhost.direction = pacmanDir;
  }

  findSplitSpawnPosition(baseX, baseY, preferredDirection) {
    const start = this.toGrid(baseX, baseY);
    const queue = [start];
    const visited = new Set([`${start.x},${start.y}`]);

    while (queue.length > 0) {
      const current = queue.shift();

      const px = current.x * CONFIG.TILE_SIZE;
      const py = current.y * CONFIG.TILE_SIZE;

      const occupied = this.splitPacmans.some(
        (sp) => Math.abs(sp.x - px) < 1 && Math.abs(sp.y - py) < 1,
      );

      if (this.isWalkableTile(current.x, current.y) && !occupied) {
        let direction = preferredDirection;

        if (current.x < start.x) direction = "left";
        else if (current.x > start.x) direction = "right";
        else if (current.y < start.y) direction = "up";
        else if (current.y > start.y) direction = "down";

        return { x: px, y: py, direction };
      }

      const neighbors = [
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
      ];

      for (const n of neighbors) {
        const key = `${n.x},${n.y}`;
        if (
          !visited.has(key) &&
          n.x >= 0 &&
          n.x < this.map[0].length &&
          n.y >= 0 &&
          n.y < this.map.length
        ) {
          visited.add(key);
          queue.push(n);
        }
      }
    }

    return {
      x: this.pacman.x,
      y: this.pacman.y,
      direction: preferredDirection,
    };
  }

  rebuildSplitPath(sp) {
    const ghost = this.ghosts[sp.targetGhostIndex];
    if (!ghost || ghost.eaten) {
      sp.completed = true;
      return;
    }

    // Snap to nearest grid center before rebuilding
    sp.x = this.getTileCenter(sp.x);
    sp.y = this.getTileCenter(sp.y);

    sp.path = this.findPath(sp.x, sp.y, ghost.x, ghost.y);
    sp.pathIndex = 0;

    if (!sp.path || sp.path.length === 0) {
      // Last resort: relocate to a nearby valid tile and try again
      const spawn = this.findSplitSpawnPosition(sp.x, sp.y, sp.direction);
      sp.x = spawn.x;
      sp.y = spawn.y;
      sp.direction = spawn.direction;
      sp.path = this.findPath(sp.x, sp.y, ghost.x, ghost.y);
      sp.pathIndex = 0;
    }

    if (!sp.path || sp.path.length === 0) {
      sp.completed = true;
    }
  }

  activateTeleportPower() {
    if (this.teleportPowerCount > 0 && !this.splitPowerActive) {
      this.teleportPowerCount--;
      this.soundManager.playTeleport();

      // Find all valid walkable positions
      let validPositions = [];
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          if (this.map[y][x] !== 1) {
            validPositions.push({
              x: x * CONFIG.TILE_SIZE,
              y: y * CONFIG.TILE_SIZE,
            });
          }
        }
      }

      if (validPositions.length > 0) {
        const pos =
          validPositions[Math.floor(Math.random() * validPositions.length)];
        this.pacman.x = pos.x;
        this.pacman.y = pos.y;
      }
    }
  }

  respawnGhostInHouse(ghost, index) {
    const ghostPositions = [
      { x: 8, y: 7, delay: 0 },
      { x: 9, y: 7, delay: 3000 },
      { x: 10, y: 7, delay: 6000 },
      { x: 9, y: 7, delay: 9000 },
    ];

    ghost.x = ghostPositions[index].x * CONFIG.TILE_SIZE;
    ghost.y = ghostPositions[index].y * CONFIG.TILE_SIZE;
    ghost.scared = false;
    ghost.eaten = false;
    ghost.mode = "exitingHouse";
    ghost.releaseTimer = ghostPositions[index].delay;
    ghost.direction = "up";
  }

  activateSplitPower() {
    if (!this.splitPowerActive && this.splitPowerCount > 0 && this.powerMode) {
      this.splitPowerActive = true;
      this.splitPowerCount--;
      this.soundManager.playSplitPower();

      // Freeze ghosts in place and make them edible
      this.ghosts.forEach((ghost) => {
        ghost.scared = true;
        ghost.eaten = false;
      });

      this.splitPacmans = [];

      const desiredSpawns = [
        {
          x: this.pacman.x,
          y: this.pacman.y,
          direction: this.pacman.direction,
        },
        {
          x: this.pacman.x - CONFIG.TILE_SIZE,
          y: this.pacman.y,
          direction: "left",
        },
        {
          x: this.pacman.x + CONFIG.TILE_SIZE,
          y: this.pacman.y,
          direction: "right",
        },
        {
          x: this.pacman.x,
          y: this.pacman.y - CONFIG.TILE_SIZE,
          direction: "up",
        },
      ];

      for (let i = 0; i < this.ghosts.length; i++) {
        const spawn = this.findSplitSpawnPosition(
          desiredSpawns[i].x,
          desiredSpawns[i].y,
          desiredSpawns[i].direction,
        );

        const targetGhost = this.ghosts[i];
        const path = this.findPath(
          spawn.x,
          spawn.y,
          targetGhost.x,
          targetGhost.y,
        );

        this.splitPacmans.push({
          x: this.getTileCenter(spawn.x),
          y: this.getTileCenter(spawn.y),
          direction: spawn.direction,
          targetGhostIndex: i,
          path,
          pathIndex: 0,
          completed: false,
        });
      }
    }
  }

  checkCollisions() {
    if (this.splitPowerActive) {
      for (const sp of this.splitPacmans) {
        if (sp.completed) continue;

        const ghost = this.ghosts[sp.targetGhostIndex];
        if (!ghost || ghost.eaten) continue;

        const dist = Math.hypot(sp.x - ghost.x, sp.y - ghost.y);
        if (dist < CONFIG.TILE_SIZE * 0.8) {
          ghost.eaten = true;
          sp.completed = true;
          this.score += 200;
          this.soundManager.playEatGhost();
        }
      }

      const allCompleted = this.splitPacmans.every((sp) => sp.completed);

      if (allCompleted) {
        this.splitPowerActive = false;
        this.splitPacmans = [];
        this.powerMode = false;

        this.ghosts.forEach((ghost, i) => {
          this.respawnGhostInHouse(ghost, i);
        });
      }
    } else {
      this.checkEntityGhostCollision(this.pacman);
    }
  }

  checkEntityGhostCollision(entity) {
    for (let ghost of this.ghosts) {
      if (ghost.eaten) continue; // Skip collision with eaten ghosts

      const dist = Math.hypot(entity.x - ghost.x, entity.y - ghost.y);
      if (dist < CONFIG.TILE_SIZE * 0.8) {
        if (ghost.scared && !ghost.eaten) {
          ghost.eaten = true;
          this.score += 200;
          this.soundManager.playEatGhost();
          this.respawnGhost(ghost);
        } else if (!ghost.scared && entity === this.pacman) {
          this.loseLife();
        }
      }
    }
  }

  checkInverseCollisions() {
    if (this.inverseGraceTimer > 0) return;

    const playerGhost = this.ghosts.find((g) => g.isPlayer);
    if (!playerGhost) return;

    for (let ghost of this.ghosts) {
      if (!ghost.isPlayer && !ghost.eaten) {
        const dist = Math.hypot(
          playerGhost.x - ghost.x,
          playerGhost.y - ghost.y,
        );

        if (dist < CONFIG.TILE_SIZE * 0.8) {
          this.inverseMode = false;
          this.inverseModeTimer = 0;
          this.inverseGraceTimer = 0;
          this.ghosts.forEach((g) => {
            g.isPlayer = false;
            g.scared = false;
          });
          return;
        }
      }
    }
  }

  respawnGhost(ghost) {
    if (this.splitPowerActive) return;

    // Immediately move ghost to house and mark as eaten
    const index = this.ghosts.indexOf(ghost);
    const ghostPositions = [
      { x: 8, y: 7 },
      { x: 9, y: 7 },
      { x: 10, y: 7 },
      { x: 9, y: 7 },
    ];

    ghost.x = ghostPositions[index >= 0 ? index : 0].x * CONFIG.TILE_SIZE;
    ghost.y = ghostPositions[index >= 0 ? index : 0].y * CONFIG.TILE_SIZE;
    ghost.mode = "exitingHouse";
    ghost.direction = "up";

    // After 2 seconds, allow the ghost to exit and reset eaten status
    setTimeout(() => {
      ghost.eaten = false;
      ghost.scared = false;
      ghost.releaseTimer = 0;
    }, 2000);
  }

  loseLife() {
    this.lives--;
    this.soundManager.playDeath();

    if (this.lives <= 0) {
      this.endGame();
    } else {
      this.pacman.x = 9 * CONFIG.TILE_SIZE;
      this.pacman.y = 15 * CONFIG.TILE_SIZE;

      // Reset ghost positions to ghost house
      const ghostPositions = [
        { x: 8, y: 7, delay: 0 },
        { x: 9, y: 7, delay: 3000 },
        { x: 10, y: 7, delay: 6000 },
        { x: 9, y: 7, delay: 9000 },
      ];

      this.ghosts.forEach((ghost, i) => {
        ghost.x = ghostPositions[i].x * CONFIG.TILE_SIZE;
        ghost.y = ghostPositions[i].y * CONFIG.TILE_SIZE;
        ghost.scared = false;
        ghost.eaten = false;
        ghost.mode = "exitingHouse";
        ghost.releaseTimer = ghostPositions[i].delay;
        ghost.direction = "up";
      });

      this.powerMode = false;
      this.splitPowerActive = false;
      this.splitPacmans = [];

      this.paused = true;
      this.showMessage("LIFE LOST", "Press any key to continue");
      setTimeout(() => {
        this.paused = false;
        this.hideMessage();
      }, 2000);
    }
  }

  spawnFruit() {
    // Find fruit spawn location
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        if (this.map[y][x] === 5) {
          const fruitTypes = [
            { type: "strawberry", points: 300, color: "#FF0000" },
            { type: "orange", points: 500, color: "#FFA500" },
            { type: "cherry", points: 200, color: "#FF1493" },
            { type: "split", points: 100, color: "#00FF00" },
            { type: "teleport", points: 150, color: "#00FFFF" },
          ];

          let fruit = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];

          // Split power is now available on all levels, no restriction needed

          this.fruits.push({
            x: x * CONFIG.TILE_SIZE,
            y: y * CONFIG.TILE_SIZE,
            type: fruit.type,
            points: fruit.points,
            color: fruit.color,
            timer: CONFIG.FRUIT_DURATION,
          });
          return;
        }
      }
    }
  }

  nextLevel() {
    this.level++;
    this.paused = true;
    this.soundManager.playLevelComplete();
    this.showMessage("LEVEL COMPLETE!", `Starting Level ${this.level}...`);

    setTimeout(() => {
      this.resetLevel();
      this.paused = false;
      this.hideMessage();
    }, 3000);
  }

  endGame() {
    this.gameOver = true;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("pacmanHighScore", this.highScore);
      this.showMessage(
        "NEW HIGH SCORE!",
        `${this.score} points! Press R to restart`,
      );
    } else {
      this.showMessage(
        "GAME OVER",
        `Final Score: ${this.score}. Press R to restart`,
      );
    }
  }

  render() {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw map
    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        const cell = this.map[y][x];
        const px = x * CONFIG.TILE_SIZE;
        const py = y * CONFIG.TILE_SIZE;

        if (cell === 1) {
          // Wall
          this.ctx.fillStyle = "#2196F3";
          this.ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.strokeStyle = "#1976D2";
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
        } else if (cell === 2) {
          // Dot
          this.ctx.fillStyle = "#FFE4B5";
          this.ctx.beginPath();
          this.ctx.arc(
            px + CONFIG.TILE_SIZE / 2,
            py + CONFIG.TILE_SIZE / 2,
            2,
            0,
            Math.PI * 2,
          );
          this.ctx.fill();
        } else if (cell === 3) {
          // Power pellet
          this.ctx.fillStyle = "#FFD700";
          this.ctx.beginPath();
          this.ctx.arc(
            px + CONFIG.TILE_SIZE / 2,
            py + CONFIG.TILE_SIZE / 2,
            5,
            0,
            Math.PI * 2,
          );
          this.ctx.fill();
        }
      }
    }

    // Draw fruits
    this.fruits.forEach((fruit) => {
      this.ctx.fillStyle = fruit.color;
      this.ctx.beginPath();
      this.ctx.arc(
        fruit.x + CONFIG.TILE_SIZE / 2,
        fruit.y + CONFIG.TILE_SIZE / 2,
        8,
        0,
        Math.PI * 2,
      );
      this.ctx.fill();

      if (fruit.type === "split") {
        this.ctx.fillStyle = "#000";
        this.ctx.font = "10px Arial";
        this.ctx.fillText("S", fruit.x + 6, fruit.y + 13);
      }

      if (fruit.type === "teleport") {
        this.ctx.fillStyle = "#000";
        this.ctx.font = "10px Arial";
        this.ctx.fillText("T", fruit.x + 6, fruit.y + 13);
      }
    });

    // Draw Pac-Man or Player Ghost (inverse mode)
    if (!this.inverseMode) {
      if (this.splitPowerActive) {
        // In split mode: draw all 4 AI-controlled pac-mens
        this.splitPacmans.forEach((sp) => {
          this.drawPacMan(sp);
        });
      } else {
        // Normal mode: draw player-controlled pac-man
        this.drawPacMan(this.pacman);
      }
    }

    // Draw ghosts
    this.ghosts.forEach((ghost) => {
      if (!ghost.eaten) {
        if (this.inverseMode && ghost.isPlayer) {
          // Draw player-controlled ghost
          this.ctx.fillStyle = ghost.color;
          this.ctx.strokeStyle = "#FFD700";
          this.ctx.lineWidth = 2;
        } else if (this.inverseMode) {
          // Draw pac-man shaped ghost
          this.drawPacMan({ x: ghost.x, y: ghost.y, direction: "right" });
          return;
        } else if (ghost.scared) {
          this.ctx.fillStyle = "#0000FF";
          this.ctx.strokeStyle = "#FFF";
          this.ctx.lineWidth = 1;
        } else {
          this.ctx.fillStyle = ghost.color;
          this.ctx.strokeStyle = "#000";
          this.ctx.lineWidth = 1;
        }

        // Ghost body
        this.ctx.beginPath();
        this.ctx.arc(
          ghost.x + CONFIG.TILE_SIZE / 2,
          ghost.y + CONFIG.TILE_SIZE / 2,
          CONFIG.TILE_SIZE / 2,
          Math.PI,
          0,
        );
        this.ctx.lineTo(ghost.x + CONFIG.TILE_SIZE, ghost.y + CONFIG.TILE_SIZE);
        this.ctx.lineTo(
          ghost.x + CONFIG.TILE_SIZE * 0.75,
          ghost.y + CONFIG.TILE_SIZE * 0.75,
        );
        this.ctx.lineTo(
          ghost.x + CONFIG.TILE_SIZE / 2,
          ghost.y + CONFIG.TILE_SIZE,
        );
        this.ctx.lineTo(
          ghost.x + CONFIG.TILE_SIZE * 0.25,
          ghost.y + CONFIG.TILE_SIZE * 0.75,
        );
        this.ctx.lineTo(ghost.x, ghost.y + CONFIG.TILE_SIZE);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Ghost eyes
        this.ctx.fillStyle = "#FFF";
        this.ctx.beginPath();
        this.ctx.arc(ghost.x + 6, ghost.y + 8, 3, 0, Math.PI * 2);
        this.ctx.arc(ghost.x + 14, ghost.y + 8, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = "#000";
        this.ctx.beginPath();
        this.ctx.arc(ghost.x + 6, ghost.y + 8, 1.5, 0, Math.PI * 2);
        this.ctx.arc(ghost.x + 14, ghost.y + 8, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  drawPacMan(pacman) {
    this.ctx.fillStyle = "#FFFF00";
    this.ctx.beginPath();

    let startAngle, endAngle;
    switch (pacman.direction) {
      case "right":
        startAngle = 0.2;
        endAngle = 1.8;
        break;
      case "left":
        startAngle = 1.2;
        endAngle = 2.8;
        break;
      case "up":
        startAngle = 1.7;
        endAngle = 3.3;
        break;
      case "down":
        startAngle = 0.7;
        endAngle = 2.3;
        break;
      default:
        startAngle = 0.2;
        endAngle = 1.8;
    }

    this.ctx.arc(
      pacman.x + CONFIG.TILE_SIZE / 2,
      pacman.y + CONFIG.TILE_SIZE / 2,
      CONFIG.TILE_SIZE / 2,
      startAngle * Math.PI,
      endAngle * Math.PI,
    );
    this.ctx.lineTo(
      pacman.x + CONFIG.TILE_SIZE / 2,
      pacman.y + CONFIG.TILE_SIZE / 2,
    );
    this.ctx.fill();
  }
}

// Pac-Man Class
class PacMan {
  constructor(x, y) {
    this.x = x * CONFIG.TILE_SIZE;
    this.y = y * CONFIG.TILE_SIZE;
    this.direction = "right";
  }
}

// Ghost Class
class Ghost {
  constructor(x, y, color, name, scatterTarget) {
    this.x = x * CONFIG.TILE_SIZE;
    this.y = y * CONFIG.TILE_SIZE;
    this.color = color;
    this.name = name;
    this.scared = false;
    this.eaten = false;
    this.isPlayer = false;
    this.mode = "exitingHouse"; // exitingHouse, scatter, chase
    this.scatterTarget = scatterTarget; // Corner to patrol toward in scatter mode
    this.releaseTimer = 0; // Timer before ghost can leave house
    this.direction = "up"; // Current movement direction
    this.lastDirection = "up"; // Track last successful direction
  }
}

// Start the game
const game = new Game();
