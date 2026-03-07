// Game Configuration
const CONFIG = {
  TILE_SIZE: 20,
  PACMAN_SPEED: 0.8, // pixels per frame at 60fps (~1.5 tiles/sec - classic feel)
  GHOST_SPEED: 0.7, // slightly slower than Pac-Man
  GHOST_SCARED_SPEED: 0.5, // much slower when scared
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

    // Create Ghosts - spread out in the ghost house
    this.ghosts = [
      new Ghost(8, 7, "#FF0000", "red"), // Blinky (red) - top left
      new Ghost(10, 7, "#FFB8FF", "pink"), // Pinky (pink) - top right
      new Ghost(8, 9, "#00FFFF", "cyan"), // Inky (cyan) - bottom left
      new Ghost(10, 9, "#FFB852", "orange"), // Clyde (orange) - bottom right
    ];

    this.fruits = [];
    this.splitPacmans = [];
    this.powerMode = false;
    this.powerTimer = 0;
    this.inverseMode = false;
    this.inverseModeTimer = 0;
    this.splitPowerActive = false;
    this.fruitSpawnTimer = 0;

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

    // Don't update/render until game has started
    if (!this.gameStarted) return;

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

    if (!this.paused && !this.gameOver) {
      this.update();
    }

    this.render();
  }

  update() {
    // Update timers (using milliseconds for timers)
    const msPerFrame = 16.67; // ~60fps
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

      // Update split pac-mans
      if (this.splitPowerActive) {
        this.splitPacmans.forEach((sp) => this.updateSplitPacMan(sp));
      }

      // Update ghosts
      this.ghosts.forEach((ghost) => this.updateGhost(ghost));

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

    // Auto-align Pac-Man to grid when moving straight to prevent drift
    if (this.pacman.direction === "left" || this.pacman.direction === "right") {
      // Moving horizontally - keep aligned vertically
      const targetY =
        Math.round(this.pacman.y / CONFIG.TILE_SIZE) * CONFIG.TILE_SIZE;
      const diffY = Math.abs(this.pacman.y - targetY);
      if (diffY < 5) {
        this.pacman.y = targetY;
        newY = targetY;
      }
    } else if (
      this.pacman.direction === "up" ||
      this.pacman.direction === "down"
    ) {
      // Moving vertically - keep aligned horizontally
      const targetX =
        Math.round(this.pacman.x / CONFIG.TILE_SIZE) * CONFIG.TILE_SIZE;
      const diffX = Math.abs(this.pacman.x - targetX);
      if (diffX < 5) {
        this.pacman.x = targetX;
        newX = targetX;
      }
    }

    // If trying to change direction, snap to grid more aggressively
    if (desiredDirection && desiredDirection !== this.pacman.direction) {
      const alignThreshold = CONFIG.TILE_SIZE / 2; // Much more forgiving - half a tile

      if (desiredDirection === "up" || desiredDirection === "down") {
        // Turning vertically - align horizontally
        const targetX =
          Math.round(this.pacman.x / CONFIG.TILE_SIZE) * CONFIG.TILE_SIZE;
        const diffX = Math.abs(this.pacman.x - targetX);

        if (diffX < alignThreshold) {
          this.pacman.x = targetX; // Snap to grid
          newX = targetX;
        }
      } else {
        // Turning horizontally - align vertically
        const targetY =
          Math.round(this.pacman.y / CONFIG.TILE_SIZE) * CONFIG.TILE_SIZE;
        const diffY = Math.abs(this.pacman.y - targetY);

        if (diffY < alignThreshold) {
          this.pacman.y = targetY; // Snap to grid
          newY = targetY;
        }
      }
    }

    // Apply movement based on desired direction, or continue in current direction
    if (desiredDirection) {
      // Try desired direction first
      let tryX = newX;
      let tryY = newY;

      if (desiredDirection === "up") tryY -= CONFIG.PACMAN_SPEED;
      if (desiredDirection === "down") tryY += CONFIG.PACMAN_SPEED;
      if (desiredDirection === "left") tryX -= CONFIG.PACMAN_SPEED;
      if (desiredDirection === "right") tryX += CONFIG.PACMAN_SPEED;

      if (this.canMove(tryX, tryY)) {
        // Can move in desired direction
        newX = tryX;
        newY = tryY;
        newDirection = desiredDirection;
      } else {
        // Can't turn yet, continue in current direction
        if (this.pacman.direction === "up") newY -= CONFIG.PACMAN_SPEED;
        if (this.pacman.direction === "down") newY += CONFIG.PACMAN_SPEED;
        if (this.pacman.direction === "left") newX -= CONFIG.PACMAN_SPEED;
        if (this.pacman.direction === "right") newX += CONFIG.PACMAN_SPEED;
      }
    } else {
      // No input, continue in current direction
      if (this.pacman.direction === "up") newY -= CONFIG.PACMAN_SPEED;
      if (this.pacman.direction === "down") newY += CONFIG.PACMAN_SPEED;
      if (this.pacman.direction === "left") newX -= CONFIG.PACMAN_SPEED;
      if (this.pacman.direction === "right") newX += CONFIG.PACMAN_SPEED;
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

  updateSplitPacMan(sp) {
    let newX = sp.x;
    let newY = sp.y;

    // Simple AI: move towards nearest scared ghost
    const target = this.findNearestScaredGhost(sp.x, sp.y);
    if (target) {
      const dx = target.x - sp.x;
      const dy = target.y - sp.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        newX += dx > 0 ? CONFIG.PACMAN_SPEED : -CONFIG.PACMAN_SPEED;
      } else {
        newY += dy > 0 ? CONFIG.PACMAN_SPEED : -CONFIG.PACMAN_SPEED;
      }
    }

    if (this.canMove(newX, newY)) {
      sp.x = newX;
      sp.y = newY;
    }

    this.handleTeleport(sp);
  }

  updateGhost(ghost) {
    if (ghost.isPlayer) return; // Don't update player-controlled ghost in normal mode

    let target;

    if (!this.inverseMode) {
      // Normal mode
      if (ghost.scared) {
        // Run away from pac-man
        target = this.getOppositePoint(
          this.pacman.x,
          this.pacman.y,
          ghost.x,
          ghost.y,
        );
      } else {
        // Chase pac-man
        target = { x: this.pacman.x, y: this.pacman.y };
      }
    } else {
      // Inverse mode: ghosts become pac-men chasing the player ghost
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

  moveGhostTowards(ghost, target) {
    const speed = ghost.scared ? CONFIG.GHOST_SCARED_SPEED : CONFIG.GHOST_SPEED;
    const dx = target.x - ghost.x;
    const dy = target.y - ghost.y;

    let newX = ghost.x;
    let newY = ghost.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      newX += dx > 0 ? speed : -speed;
    } else {
      newY += dy > 0 ? speed : -speed;
    }

    if (this.canMove(newX, newY)) {
      ghost.x = newX;
      ghost.y = newY;
    } else {
      // Try alternate direction
      if (Math.abs(dx) > Math.abs(dy)) {
        newY = ghost.y + (dy > 0 ? speed : -speed);
      } else {
        newX = ghost.x + (dx > 0 ? speed : -speed);
      }

      if (this.canMove(newX, newY)) {
        ghost.x = newX;
        ghost.y = newY;
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

      // Create 3 additional pac-mans
      for (let i = 0; i < 3; i++) {
        this.splitPacmans.push({
          x: this.pacman.x + (i + 1) * 20,
          y: this.pacman.y,
          direction: "right",
        });
      }
    }
  }

  checkCollisions() {
    // Check pac-man collision with ghosts
    this.checkEntityGhostCollision(this.pacman);

    // Check split pac-mans collision with ghosts
    this.splitPacmans.forEach((sp) => this.checkEntityGhostCollision(sp));

    // Check if all ghosts are eaten in split mode
    if (this.splitPowerActive) {
      const allEaten = this.ghosts.every((g) => g.eaten || !g.scared);
      if (allEaten) {
        this.splitPowerActive = false;
        this.splitPacmans = [];
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
      ghost.x = 9 * CONFIG.TILE_SIZE;
      ghost.y = 9 * CONFIG.TILE_SIZE;
      ghost.scared = false;
      ghost.eaten = false;
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

      // Reset ghost positions to match initial setup
      const ghostPositions = [
        { x: 8, y: 7 }, // Blinky
        { x: 10, y: 7 }, // Pinky
        { x: 8, y: 9 }, // Inky
        { x: 10, y: 9 }, // Clyde
      ];

      this.ghosts.forEach((ghost, i) => {
        ghost.x = ghostPositions[i].x * CONFIG.TILE_SIZE;
        ghost.y = ghostPositions[i].y * CONFIG.TILE_SIZE;
        ghost.scared = false;
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
  constructor(x, y, color, name) {
    this.x = x * CONFIG.TILE_SIZE;
    this.y = y * CONFIG.TILE_SIZE;
    this.color = color;
    this.name = name;
    this.scared = false;
    this.eaten = false;
    this.isPlayer = false;
  }
}

// Start the game
const game = new Game();
