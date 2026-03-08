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
  TELEPORT_LEVEL_THRESHOLD: 3,
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
    this.splitPowerAvailable = false;
    this.splitPowerActive = false;
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
      if (!this.gameStarted) {
        this.gameStarted = true;
        this.hideMessage();
        this.soundManager.playGameStart();
      }

      this.keys[e.key] = true;

      if (
        e.key === " " &&
        this.splitPowerAvailable &&
        this.powerMode &&
        !this.inverseMode
      ) {
        this.activateSplitPower();
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
      new Ghost(9, 9, "#FFB852", "orange", { x: 1, y: 19 }), // Clyde - scatter to bottom left
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

    // Determine level features
    this.randomTeleport = this.level >= CONFIG.TELEPORT_LEVEL_THRESHOLD;
    this.splitPowerAvailable = this.level >= CONFIG.SPLIT_LEVEL_THRESHOLD;

    this.updateUI();
  }

  restart() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.gameStarted = false;
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
    splitStatus.classList.toggle(
      "active",
      this.splitPowerAvailable && this.powerMode,
    );
    splitStatus.querySelector(".power-value").textContent = this
      .splitPowerAvailable
      ? this.powerMode
        ? "READY"
        : "OFF"
      : "LOCKED";

    const inverseStatus = document.getElementById("inverseModeStatus");
    inverseStatus.classList.toggle("active", this.inverseMode);
    inverseStatus.querySelector(".power-value").textContent = this.inverseMode
      ? "ACTIVE"
      : "OFF";

    const teleportStatus = document.getElementById("teleportMode");
    teleportStatus.classList.toggle("active", this.randomTeleport);
    teleportStatus.querySelector(".power-value").textContent = this
      .randomTeleport
      ? "RANDOM"
      : "NORMAL";
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
      this.update();
    }

    this.render();
  }

  update() {
    // Update timers (using milliseconds for timers)
    const msPerFrame = 16.67; // ~60fps

    // Ghost mode alternation
    if (!this.powerMode && !this.inverseMode && !this.splitPowerActive) {
      this.ghostModeTimer -= msPerFrame;

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

    if (this.powerMode) {
      this.powerTimer -= msPerFrame;
      if (this.powerTimer <= 0) {
        this.powerMode = false;
        this.splitPowerActive = false;
        this.splitPacmans = [];
      }
    }

    if (this.inverseMode) {
      this.inverseModeTimer -= msPerFrame;
      if (this.inverseModeTimer <= 0) {
        this.inverseMode = false;
        this.ghosts.forEach((g) => (g.scared = false));
      }
    }

    // Fruit spawning
    this.fruitSpawnTimer += msPerFrame;
    if (
      this.fruitSpawnTimer >= CONFIG.FRUIT_SPAWN_TIME &&
      this.fruits.length === 0
    ) {
      this.spawnFruit();
      this.fruitSpawnTimer = 0;
    }

    // Update fruits
    this.fruits = this.fruits.filter((fruit) => {
      fruit.timer -= msPerFrame;
      return fruit.timer > 0;
    });

    // Update Pac-Man or Ghost (inverse mode)
    if (!this.inverseMode) {
      this.updatePacMan();

      if (this.splitPowerActive) {
        // Ghosts frozen in place while split pac-men hunt them
        this.splitPacmans.forEach((sp) => this.updateSplitPacMan(sp));
      } else {
        this.ghosts.forEach((ghost) => this.updateGhost(ghost));
      }

      // Check collisions
      this.checkCollisions();
    } else {
      // Inverse mode: control ghost, pac-mans chase
      this.updatePlayerGhost();
      this.ghosts
        .filter((g) => !g.isPlayer)
        .forEach((ghost) => this.updateGhost(ghost));
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
    if (this.keys["ArrowUp"]) desiredDirection = "up";
    if (this.keys["ArrowDown"]) desiredDirection = "down";
    if (this.keys["ArrowLeft"]) desiredDirection = "left";
    if (this.keys["ArrowRight"]) desiredDirection = "right";

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
          this.splitPowerAvailable = true;
          this.score += 100;
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
    const speed = CONFIG.PACMAN_SPEED * 1.15;
    const target = this.findNearestTargetGhost(sp.x, sp.y);
    if (!target) return;

    const centered = this.isEntityCentered(sp, 0.5);

    if (centered) {
      sp.x = this.getTileCenter(sp.x);
      sp.y = this.getTileCenter(sp.y);

      sp.direction = this.findPathDirection(
        sp.x,
        sp.y,
        target.x,
        target.y,
        sp.direction,
      );
    }

    this.moveEntityInDirection(sp, speed);
    this.handleTeleport(sp);
  }

  updateGhost(ghost) {
    if (ghost.isPlayer) return; // Don't update player-controlled ghost in normal mode

    let target = null;

    if (!this.inverseMode) {
      // Normal mode - handle AI states

      if (ghost.scared) {
        // Scared mode: run away from pac-man
        target = this.getOppositePoint(
          this.pacman.x,
          this.pacman.y,
          ghost.x,
          ghost.y,
        );
      } else {
        // Handle ghost house exit
        if (ghost.mode === "exitingHouse") {
          if (ghost.releaseTimer > 0) {
            ghost.releaseTimer -= 16.67;
            return;
          }

          // The centre tile above the house is a wall in this map,
          // so use a real open lane instead.
          const leftExit = {
            x: 8 * CONFIG.TILE_SIZE,
            y: 6 * CONFIG.TILE_SIZE,
          };

          const rightExit = {
            x: 10 * CONFIG.TILE_SIZE,
            y: 6 * CONFIG.TILE_SIZE,
          };

          // Pick the nearer reachable exit lane
          const distLeft = Math.hypot(
            ghost.x - leftExit.x,
            ghost.y - leftExit.y,
          );
          const distRight = Math.hypot(
            ghost.x - rightExit.x,
            ghost.y - rightExit.y,
          );

          const exitTarget = distLeft <= distRight ? leftExit : rightExit;

          if (Math.hypot(ghost.x - exitTarget.x, ghost.y - exitTarget.y) < 4) {
            ghost.mode = this.ghostMode;
            target = this.getGhostTarget(ghost);
          } else {
            target = exitTarget;
          }
        }

        // Always set a target for scatter or chase mode
        if (ghost.mode === "scatter" || ghost.mode === "chase") {
          ghost.mode = this.ghostMode;
          target = this.getGhostTarget(ghost);
        }
      }
    } else {
      // Inverse mode: ghosts become pac-men chasing the player ghost
      const playerGhost = this.ghosts.find((g) => g.isPlayer);
      if (playerGhost) {
        target = { x: playerGhost.x, y: playerGhost.y };
      }
    }

    // Always move if we have a target
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
        // Clyde: chase when far, scatter when near
        const dist = Math.hypot(
          this.pacman.x - ghost.x,
          this.pacman.y - ghost.y,
        );

        if (dist > CONFIG.TILE_SIZE * 8) {
          return { x: this.pacman.x, y: this.pacman.y };
        } else {
          return this.tileToPixels(ghost.scatterTarget);
        }
      }

      default:
        return { x: this.pacman.x, y: this.pacman.y };
    }
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

    const centered = this.isEntityCentered(ghost, 0.5);

    if (centered) {
      ghost.x = this.getTileCenter(ghost.x);
      ghost.y = this.getTileCenter(ghost.y);

      ghost.direction = this.findPathDirection(
        ghost.x,
        ghost.y,
        target.x,
        target.y,
        ghost.direction,
      );
    }

    const moved = this.moveEntityInDirection(ghost, speed);

    if (!moved) {
      ghost.x = this.getTileCenter(ghost.x);
      ghost.y = this.getTileCenter(ghost.y);

      ghost.direction = this.findPathDirection(
        ghost.x,
        ghost.y,
        target.x,
        target.y,
        ghost.direction,
      );

      this.moveEntityInDirection(ghost, speed);
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

    // Transform pac-man to ghost
    const playerGhost = this.ghosts[0];
    playerGhost.isPlayer = true;
    playerGhost.x = this.pacman.x;
    playerGhost.y = this.pacman.y;
    playerGhost.scared = false;

    // Other ghosts become pac-men chasers
    this.ghosts.forEach((ghost) => {
      if (!ghost.isPlayer) {
        ghost.scared = false;
      }
    });
  }

  activateSplitPower() {
    if (!this.splitPowerActive && this.splitPowerAvailable && this.powerMode) {
      this.splitPowerActive = true;
      this.splitPowerAvailable = false;
      this.soundManager.playSplitPower();

      // Freeze and mark ghosts as edible targets
      this.ghosts.forEach((ghost) => {
        if (!ghost.eaten) {
          ghost.scared = true;
        }
      });

      this.splitPacmans = [];

      // 3 clones + original = 4 total pac-men active
      const spawnOffsets = [
        { x: -CONFIG.TILE_SIZE, y: 0, direction: "left" },
        { x: CONFIG.TILE_SIZE, y: 0, direction: "right" },
        { x: 0, y: -CONFIG.TILE_SIZE, direction: "up" },
      ];

      for (const offset of spawnOffsets) {
        const clone = {
          x: this.pacman.x + offset.x,
          y: this.pacman.y + offset.y,
          direction: offset.direction,
        };

        if (this.canMove(clone.x, clone.y)) {
          this.splitPacmans.push(clone);
        } else {
          this.splitPacmans.push({
            x: this.pacman.x,
            y: this.pacman.y,
            direction: offset.direction,
          });
        }
      }
    }
  }

  checkCollisions() {
    // Check pac-man collision with ghosts
    this.checkEntityGhostCollision(this.pacman);

    // Check split pac-mans collision with ghosts
    this.splitPacmans.forEach((sp) => this.checkEntityGhostCollision(sp));

    // End split mode when all ghosts are eaten
    if (this.splitPowerActive) {
      const remainingGhosts = this.ghosts.filter((g) => !g.eaten);

      if (remainingGhosts.length === 0) {
        this.splitPowerActive = false;
        this.splitPacmans = [];
        this.powerMode = false;
        this.ghosts.forEach((g) => {
          g.scared = false;
        });
      }
    }
  }

  checkEntityGhostCollision(entity) {
    for (let ghost of this.ghosts) {
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
    const playerGhost = this.ghosts.find((g) => g.isPlayer);
    if (!playerGhost) return;

    for (let ghost of this.ghosts) {
      if (!ghost.isPlayer) {
        const dist = Math.hypot(
          playerGhost.x - ghost.x,
          playerGhost.y - ghost.y,
        );
        if (dist < CONFIG.TILE_SIZE * 0.8) {
          this.inverseMode = false;
          this.inverseModeTimer = 0;
          this.ghosts.forEach((g) => (g.isPlayer = false));
          return;
        }
      }
    }
  }

  respawnGhost(ghost) {
    setTimeout(() => {
      // Respawn in ghost house
      ghost.x = 9 * CONFIG.TILE_SIZE;
      ghost.y = 7 * CONFIG.TILE_SIZE;
      ghost.scared = false;
      ghost.eaten = false;
      ghost.mode = "exitingHouse";
      ghost.releaseTimer = 1000; // Wait 1 second before leaving house
      ghost.direction = "up"; // Reset direction
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
        { x: 8, y: 7 }, // Blinky
        { x: 9, y: 7 }, // Pinky
        { x: 10, y: 7 }, // Inky
        { x: 9, y: 9 }, // Clyde
      ];

      this.ghosts.forEach((ghost, i) => {
        ghost.x = ghostPositions[i].x * CONFIG.TILE_SIZE;
        ghost.y = ghostPositions[i].y * CONFIG.TILE_SIZE;
        ghost.scared = false;
        ghost.mode = "scatter"; // Start in scatter mode after respawn
        ghost.releaseTimer = 0; // Release immediately after death
        ghost.direction = "up"; // Reset direction
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
          ];

          let fruit = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];

          // Split power only if available at this level
          if (
            fruit.type === "split" &&
            this.level < CONFIG.SPLIT_LEVEL_THRESHOLD
          ) {
            fruit = fruitTypes[0];
          }

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
    });

    // Draw Pac-Man or Player Ghost (inverse mode)
    if (!this.inverseMode) {
      this.drawPacMan(this.pacman);

      // Draw split pac-mans
      this.splitPacmans.forEach((sp) => {
        this.ctx.save();
        this.ctx.globalAlpha = 0.7;
        this.drawPacMan(sp);
        this.ctx.restore();
      });
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
