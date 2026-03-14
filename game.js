// Game Configuration
const CONFIG = {
  TILE_SIZE: 20,
  PACMAN_SPEED: 1.5, // base pixels per frame (scaled by speedMultiplier)
  GHOST_SPEED: 1.3, // Close to Pac-Man speed for a real threat
  GHOST_SCARED_SPEED: 0.85, // Noticeably slower when scared but still moving
  POWER_DURATION: 10000,
  INVERSE_DURATION: 15000,
  FRUIT_SPAWN_TIME: 10000,
  FRUIT_DURATION: 8000,
  INVERSE_LEVEL_THRESHOLD: 5,
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
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 0, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 1, 0, 0, 0, 5, 0, 0, 0, 1, 2, 1, 1, 1, 1],
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
    this.powerModeId = 0; // Incremented each time a new power pellet is eaten
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
    this.keyPressCounter = 0;
    this.keyPressTick = {
      ArrowUp: 0,
      ArrowDown: 0,
      ArrowLeft: 0,
      ArrowRight: 0,
    };
    this.pendingArrowKey = null;
    this.pendingArrowTimer = 0;
    this.PENDING_ARROW_DURATION = 180; // ms: captures quick taps between frames
    this.lastTime = 0;
    this.soundManager = new SoundManager();

    // Turn buffering: remember desired direction for a short window
    this.bufferedDirection = null;
    this.bufferTimer = 0;
    this.BUFFER_DURATION = 240; // ms to keep trying a buffered turn

    this.restartConfirmOpen = false;
    this.wasPausedBeforeRestartConfirm = false;
    this.restartConfirmSelection = "cancel";

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
    const confirmBtn = document.getElementById("confirmRestartBtn");
    const cancelBtn = document.getElementById("cancelRestartBtn");

    if (confirmBtn) {
      confirmBtn.addEventListener("mouseenter", () =>
        this.setRestartConfirmSelection("confirm"),
      );
      confirmBtn.addEventListener("focus", () =>
        this.setRestartConfirmSelection("confirm"),
      );
      confirmBtn.addEventListener("click", () => {
        this.setRestartConfirmSelection("confirm");
        this.confirmRestart();
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener("mouseenter", () =>
        this.setRestartConfirmSelection("cancel"),
      );
      cancelBtn.addEventListener("focus", () =>
        this.setRestartConfirmSelection("cancel"),
      );
      cancelBtn.addEventListener("click", () => {
        this.setRestartConfirmSelection("cancel");
        this.cancelRestart();
      });
    }

    document.addEventListener("keydown", (e) => {
      // Prevent default behavior for arrow keys to stop page scrolling
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }

      if (this.restartConfirmOpen) {
        if (
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown"
        ) {
          this.toggleRestartConfirmSelection();
        } else if (e.key === "Enter") {
          if (this.restartConfirmSelection === "confirm") {
            this.confirmRestart();
          } else {
            this.cancelRestart();
          }
        }
        return;
      }

      if (!this.gameStarted) {
        this.gameStarted = true;
        this.hideMessage();
        this.soundManager.playGameStart();
      }

      this.keys[e.key] = true;

      if (this.keyPressTick[e.key] !== undefined) {
        this.keyPressCounter += 1;
        this.keyPressTick[e.key] = this.keyPressCounter;
        this.pendingArrowKey = e.key;
        this.pendingArrowTimer = this.PENDING_ARROW_DURATION;
      }

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
        this.requestRestart();
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

      // Pending key tap should still resolve for a short window even after keyup.
    });
  }

  requestRestart() {
    if (this.restartConfirmOpen) return;

    // If the run is already over, restart immediately with no confirmation.
    if (this.gameOver) {
      this.restart();
      return;
    }

    this.restartConfirmOpen = true;
    this.wasPausedBeforeRestartConfirm = this.paused;

    if (this.gameStarted && !this.gameOver && !this.paused) {
      this.paused = true;
    }

    const modal = document.getElementById("restartConfirmModal");
    if (modal) {
      modal.classList.remove("hidden");
    }

    this.setRestartConfirmSelection("cancel");
  }

  cancelRestart() {
    if (!this.restartConfirmOpen) return;

    this.restartConfirmOpen = false;
    const modal = document.getElementById("restartConfirmModal");
    if (modal) {
      modal.classList.add("hidden");
    }

    if (
      this.gameStarted &&
      !this.gameOver &&
      !this.wasPausedBeforeRestartConfirm
    ) {
      this.paused = false;
    }
  }

  confirmRestart() {
    if (!this.restartConfirmOpen) return;

    this.restartConfirmOpen = false;
    const modal = document.getElementById("restartConfirmModal");
    if (modal) {
      modal.classList.add("hidden");
    }

    this.restart();
  }

  setRestartConfirmSelection(selection) {
    this.restartConfirmSelection =
      selection === "confirm" ? "confirm" : "cancel";

    const confirmBtn = document.getElementById("confirmRestartBtn");
    const cancelBtn = document.getElementById("cancelRestartBtn");

    if (confirmBtn) {
      const isSelected = this.restartConfirmSelection === "confirm";
      confirmBtn.classList.toggle("selected", isSelected);
      if (isSelected) {
        confirmBtn.focus();
      }
    }

    if (cancelBtn) {
      const isSelected = this.restartConfirmSelection === "cancel";
      cancelBtn.classList.toggle("selected", isSelected);
      if (isSelected) {
        cancelBtn.focus();
      }
    }
  }

  toggleRestartConfirmSelection() {
    if (!this.restartConfirmOpen) return;

    this.setRestartConfirmSelection(
      this.restartConfirmSelection === "confirm" ? "cancel" : "confirm",
    );
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

    // Set release timers so ghosts exit house quickly in sequence
    this.ghosts[0].releaseTimer = 0; // Red exits immediately
    this.ghosts[1].releaseTimer = 500; // Pink follows quickly
    this.ghosts[2].releaseTimer = 1000; // Cyan right after
    this.ghosts[3].releaseTimer = 1500; // Orange last

    this.fruits = [];
    this.splitPacmans = [];
    this.powerMode = false;
    this.powerTimer = 0;
    this.powerModeId = 0;
    this.inverseMode = false;
    this.inverseModeTimer = 0;
    this.splitPowerActive = false;
    this.fruitSpawnTimer = 0;

    // Ghosts stay in chase mode permanently
    this.ghostMode = "chase";
    this.ghostModeTimer = Infinity;

    this.updateUI();
  }

  restart() {
    this.keys = {};
    this.pendingArrowKey = null;
    this.pendingArrowTimer = 0;
    this.bufferedDirection = null;
    this.bufferTimer = 0;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.paused = false;
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

    // Keep ghosts in permanent chase mode
    this.ghostMode = "chase";

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
        this.endInverseMode();
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
        this.splitPacmans.forEach((sp) =>
          this.updateSplitPacMan(sp, speedMultiplier),
        );
        this.checkCollisions();
      } else {
        // Normal mode: player controls pac-man
        this.updatePacMan(speedMultiplier, deltaTime);

        // If inverse mode was triggered during updatePacMan(),
        // stop normal processing immediately so we don't instantly collide
        if (this.inverseMode) {
          this.updateUI();
          return;
        }

        this.ghosts.forEach((ghost) =>
          this.updateGhost(ghost, speedMultiplier, deltaTime),
        );
        this.checkCollisions();
      }
    } else {
      // Inverse mode: player controls Pac-Man (rendered as ghost), all 4 ghosts chase as Pac-Men
      this.updatePacMan(speedMultiplier, deltaTime);
      this.ghosts.forEach((ghost) =>
        this.updateGhost(ghost, speedMultiplier, deltaTime),
      );
      this.checkInverseCollisions();
    }

    // Check level completion
    if (this.dotsEaten >= this.totalDots) {
      this.nextLevel();
    }

    this.updateUI();
  }

  updatePacMan(speedMultiplier = 1, frameTimeMs = 16.67) {
    if (!this.pacman) return;

    // Pac-Man moves slower while eating dots (like the original game)
    const pacGrid = this.toGrid(this.pacman.x, this.pacman.y);
    const tileUnder = this.map[pacGrid.y]?.[pacGrid.x];
    const isEating = tileUnder === 2 || tileUnder === 3;
    const eatingPenalty = isEating ? 0.85 : 1.0;
    const speed = CONFIG.PACMAN_SPEED * speedMultiplier * eatingPenalty;

    let newX = this.pacman.x;
    let newY = this.pacman.y;
    let newDirection = this.pacman.direction;

    // Get desired direction from input (latest keypress wins).
    let desiredDirection = null;
    const arrowToDirection = (arrowKey) => {
      if (this.inverseMode) {
        if (arrowKey === "ArrowUp") return "down";
        if (arrowKey === "ArrowDown") return "up";
        if (arrowKey === "ArrowLeft") return "right";
        if (arrowKey === "ArrowRight") return "left";
      } else {
        if (arrowKey === "ArrowUp") return "up";
        if (arrowKey === "ArrowDown") return "down";
        if (arrowKey === "ArrowLeft") return "left";
        if (arrowKey === "ArrowRight") return "right";
      }
      return null;
    };

    let selectedArrowKey = null;
    if (this.pendingArrowKey && this.pendingArrowTimer > 0) {
      selectedArrowKey = this.pendingArrowKey;
      this.pendingArrowTimer -= frameTimeMs;
      if (this.pendingArrowTimer <= 0) {
        this.pendingArrowTimer = 0;
        this.pendingArrowKey = null;
      }
    }

    if (!selectedArrowKey) {
      let latestTick = -1;
      const arrows = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      for (const key of arrows) {
        if (this.keys[key] && this.keyPressTick[key] > latestTick) {
          latestTick = this.keyPressTick[key];
          selectedArrowKey = key;
        }
      }
    }

    desiredDirection = arrowToDirection(selectedArrowKey);

    // Turn buffering: preserve queued turns; do not let held forward overwrite them.
    if (desiredDirection && desiredDirection !== this.pacman.direction) {
      this.bufferedDirection = desiredDirection;
      this.bufferTimer = this.BUFFER_DURATION;
    } else if (this.bufferTimer > 0) {
      this.bufferTimer -= frameTimeMs;
      if (this.bufferTimer > 0 && this.bufferedDirection) {
        if (!desiredDirection || desiredDirection === this.pacman.direction) {
          desiredDirection = this.bufferedDirection;
        }
      } else {
        this.bufferTimer = 0;
        this.bufferedDirection = null;
      }
    } else {
      this.bufferedDirection = null;
    }

    // Tile size shorthand
    const T = CONFIG.TILE_SIZE;

    // Helper: snap a coordinate to the nearest grid line if within tolerance
    const snapTo = (val, tolerance) => {
      const snapped = Math.round(val / T) * T;
      return Math.abs(val - snapped) <= tolerance ? snapped : null;
    };

    const directionVector = (dir) => {
      if (dir === "up") return { x: 0, y: -1 };
      if (dir === "down") return { x: 0, y: 1 };
      if (dir === "left") return { x: -1, y: 0 };
      return { x: 1, y: 0 };
    };

    const oppositeDirection = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };

    // Generous perpendicular-axis snap while travelling straight
    const straightSnap = T * 0.45;
    if (this.pacman.direction === "up" || this.pacman.direction === "down") {
      const s = snapTo(this.pacman.x, straightSnap);
      if (s !== null) {
        this.pacman.x = s;
        newX = s;
      }
    } else if (
      this.pacman.direction === "left" ||
      this.pacman.direction === "right"
    ) {
      const s = snapTo(this.pacman.y, straightSnap);
      if (s !== null) {
        this.pacman.y = s;
        newY = s;
      }
    }

    let turned = false;

    // Immediate reversals should feel instant and not depend on intersection snapping.
    if (
      desiredDirection &&
      desiredDirection === oppositeDirection[this.pacman.direction]
    ) {
      const reverseVec = directionVector(desiredDirection);
      const reverseX = this.pacman.x + reverseVec.x * speed;
      const reverseY = this.pacman.y + reverseVec.y * speed;

      if (this.canMove(reverseX, reverseY)) {
        newX = reverseX;
        newY = reverseY;
        newDirection = desiredDirection;
        turned = true;
        this.bufferedDirection = null;
        this.bufferTimer = 0;
      }
    }

    // --- Try desired turn with center-window + forward-crossing guard ---
    if (desiredDirection && desiredDirection !== this.pacman.direction) {
      const alignWindow = Math.max(2.5, speed * 2.2);
      const centerWindow = Math.max(2.5, speed * 2.0);
      const lookAhead = speed * 1.2 + centerWindow;

      const canTurnFromAnchor = (anchorX, anchorY, dir) => {
        const tileX = Math.round(anchorX / T);
        const tileY = Math.round(anchorY / T);
        let nextX = tileX;
        let nextY = tileY;

        if (dir === "up") nextY--;
        if (dir === "down") nextY++;
        if (dir === "left") nextX--;
        if (dir === "right") nextX++;

        const wrapped = this.wrapTile(nextX, nextY);
        return this.isWalkableTile(wrapped.x, wrapped.y);
      };

      const isVerticalTurn =
        desiredDirection === "up" || desiredDirection === "down";
      const posAlongSnap = isVerticalTurn ? this.pacman.x : this.pacman.y;
      const posAlongTravel = isVerticalTurn ? this.pacman.y : this.pacman.x;

      // Only allow a turn if we're well-aligned on the perpendicular axis.
      const snappedPerp = snapTo(posAlongSnap, alignWindow);

      if (snappedPerp !== null) {
        const rounded = Math.round(posAlongTravel / T) * T;
        const forward =
          this.pacman.direction === "right" || this.pacman.direction === "down"
            ? Math.ceil(posAlongTravel / T) * T
            : Math.floor(posAlongTravel / T) * T;

        const candidates = [];
        if (Math.abs(rounded - posAlongTravel) <= centerWindow) {
          candidates.push(rounded);
        }
        if (
          Math.abs(forward - posAlongTravel) <= lookAhead &&
          !candidates.includes(forward)
        ) {
          candidates.push(forward);
        }

        const movingPositive =
          this.pacman.direction === "right" || this.pacman.direction === "down";
        const isAheadOrCurrent = (candidate) =>
          movingPositive
            ? candidate >= posAlongTravel - 0.1
            : candidate <= posAlongTravel + 0.1;

        for (const candidate of candidates.filter(isAheadOrCurrent)) {
          let tryX = isVerticalTurn ? snappedPerp : candidate;
          let tryY = isVerticalTurn ? candidate : snappedPerp;

          // Anchor must be valid first, then one step in the desired direction.
          if (
            !this.canMove(tryX, tryY) ||
            !canTurnFromAnchor(tryX, tryY, desiredDirection)
          ) {
            continue;
          }

          const vec = directionVector(desiredDirection);
          const turnStep = Math.max(speed, 1);
          const testX = tryX + vec.x * turnStep;
          const testY = tryY + vec.y * turnStep;

          if (this.canMove(testX, testY)) {
            this.pacman.x = tryX;
            this.pacman.y = tryY;
            newX = testX;
            newY = testY;
            newDirection = desiredDirection;
            turned = true;
            this.bufferedDirection = null;
            this.bufferTimer = 0;
            break;
          }
        }
      }
    }

    // If we didn't turn, continue in the current direction
    if (!turned) {
      newX = this.pacman.x;
      newY = this.pacman.y;

      // If desired direction is same as current, just keep going
      if (desiredDirection && desiredDirection === this.pacman.direction) {
        this.bufferedDirection = null;
        this.bufferTimer = 0;
      }

      if (this.pacman.direction === "up") newY -= speed;
      if (this.pacman.direction === "down") newY += speed;
      if (this.pacman.direction === "left") newX -= speed;
      if (this.pacman.direction === "right") newX += speed;
    }

    const prevX = this.pacman.x;
    const prevY = this.pacman.y;

    if (this.canMove(newX, newY)) {
      this.pacman.x = newX;
      this.pacman.y = newY;
      this.pacman.direction = newDirection;
    } else if (desiredDirection && desiredDirection !== this.pacman.direction) {
      // Fallback pivot: if forward move is blocked, try committing the buffered turn in-place.
      const alignWindow = Math.max(2.5, speed * 2.2);
      const isVerticalTurn =
        desiredDirection === "up" || desiredDirection === "down";

      const snappedX = Math.round(this.pacman.x / T) * T;
      const snappedY = Math.round(this.pacman.y / T) * T;
      const perpendicularOffset = isVerticalTurn
        ? Math.abs(this.pacman.x - snappedX)
        : Math.abs(this.pacman.y - snappedY);

      if (
        perpendicularOffset <= alignWindow * 1.5 &&
        this.canMove(snappedX, snappedY) &&
        this.isWalkableTile(
          this.wrapTile(
            Math.round(snappedX / T) +
              (desiredDirection === "right"
                ? 1
                : desiredDirection === "left"
                  ? -1
                  : 0),
            Math.round(snappedY / T) +
              (desiredDirection === "down"
                ? 1
                : desiredDirection === "up"
                  ? -1
                  : 0),
          ).x,
          this.wrapTile(
            Math.round(snappedX / T) +
              (desiredDirection === "right"
                ? 1
                : desiredDirection === "left"
                  ? -1
                  : 0),
            Math.round(snappedY / T) +
              (desiredDirection === "down"
                ? 1
                : desiredDirection === "up"
                  ? -1
                  : 0),
          ).y,
        )
      ) {
        const step = Math.max(speed, 1);
        let testX = snappedX;
        let testY = snappedY;
        if (desiredDirection === "up") testY -= step;
        if (desiredDirection === "down") testY += step;
        if (desiredDirection === "left") testX -= step;
        if (desiredDirection === "right") testX += step;

        if (this.canMove(testX, testY)) {
          this.pacman.x = testX;
          this.pacman.y = testY;
          this.pacman.direction = desiredDirection;
          this.bufferedDirection = null;
          this.bufferTimer = 0;
        }
      }
    }

    // Check if Pac-Man is actually moving
    const isMoving = this.pacman.x !== prevX || this.pacman.y !== prevY;

    // Play wakka sound only when moving over dots/pellets
    if (isMoving && isEating) {
      this.soundManager.startWakkaSound();
    } else {
      this.soundManager.stopWakkaSound();
    }

    // Handle screen wrap/teleport
    this.handleTeleport(this.pacman);

    // Only eat dots in normal mode (not when player is controlling the ghost in inverse mode)
    if (!this.inverseMode) {
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
        const dist = Math.hypot(
          this.pacman.x - fruit.x,
          this.pacman.y - fruit.y,
        );
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
  }

  updateSplitPacMan(sp, speedMultiplier = 1) {
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

    const speed = CONFIG.GHOST_SPEED * 1.15 * speedMultiplier;
    const waypoint = sp.path[sp.pathIndex];

    if (!waypoint) {
      this.rebuildSplitPath(sp);
      return;
    }

    const mapW = this.map[0].length * CONFIG.TILE_SIZE;
    const mapH = this.map.length * CONFIG.TILE_SIZE;

    const dx = this.getWrappedDelta(sp.x, waypoint.x, mapW);
    const dy = this.getWrappedDelta(sp.y, waypoint.y, mapH);

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

    const ndx = this.getWrappedDelta(sp.x, next.x, mapW);
    const ndy = this.getWrappedDelta(sp.y, next.y, mapH);

    if (Math.abs(ndx) >= Math.abs(ndy)) {
      sp.direction = ndx > 0 ? "right" : "left";
    } else {
      sp.direction = ndy > 0 ? "down" : "up";
    }

    const moved = this.moveEntityInDirection(sp, speed);

    // If blocked, recover instead of freezing
    if (!moved) {
      this.rebuildSplitPath(sp);
      if (sp.completed) return;

      const retry = sp.path[sp.pathIndex];
      if (!retry) return;

      const rdx = this.getWrappedDelta(sp.x, retry.x, mapW);
      const rdy = this.getWrappedDelta(sp.y, retry.y, mapH);

      if (Math.abs(rdx) >= Math.abs(rdy)) {
        sp.direction = rdx > 0 ? "right" : "left";
      } else {
        sp.direction = rdy > 0 ? "down" : "up";
      }

      this.moveEntityInDirection(sp, speed);
    }

    this.handleTeleport(sp);
  }

  updateGhost(ghost, speedMultiplier = 1, deltaTime = 16.67) {
    if (ghost.eaten) return; // Don't update eaten ghosts while they're waiting to respawn

    let target = null;

    if (!this.inverseMode) {
      if (ghost.mode === "exitingHouse") {
        if (ghost.releaseTimer > 0) {
          ghost.releaseTimer -= deltaTime;
          return;
        }

        const speed =
          (ghost.scared ? CONFIG.GHOST_SCARED_SPEED : CONFIG.GHOST_SPEED) *
          speedMultiplier;

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

      // If scared, use flee behavior instead of chase
      if (ghost.scared) {
        this.moveFrightenedGhost(ghost, speedMultiplier);
        this.handleTeleport(ghost);
        return;
      }

      target = this.getGhostTarget(ghost);
    } else {
      // In inverse mode: let ghosts exit house first, then chase
      if (ghost.mode === "exitingHouse") {
        if (ghost.releaseTimer > 0) {
          ghost.releaseTimer -= deltaTime;
          return;
        }

        const speed = CONFIG.GHOST_SPEED * speedMultiplier;

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

      // All ghosts chase Pac-Man (who looks like a ghost)
      target = { x: this.pacman.x, y: this.pacman.y };
    }

    if (target) {
      this.moveGhostTowards(ghost, target, speedMultiplier);
    }

    this.handleTeleport(ghost);
  }

  moveFrightenedGhost(ghost, speedMultiplier = 1) {
    const speed = CONFIG.GHOST_SCARED_SPEED * speedMultiplier;
    const centerThreshold = Math.max(0.2, speed * 0.45);

    const centered = this.isEntityCentered(ghost, centerThreshold);

    if (centered) {
      ghost.x = this.getTileCenter(ghost.x);
      ghost.y = this.getTileCenter(ghost.y);

      ghost.direction = this.getFleeDirection(ghost);
    }

    const moved = this.moveEntityInDirection(ghost, speed);

    if (!moved) {
      ghost.x = this.getTileCenter(ghost.x);
      ghost.y = this.getTileCenter(ghost.y);

      ghost.direction = this.getFleeDirection(ghost);
      this.moveEntityInDirection(ghost, speed);
    }
  }

  getFleeDirection(ghost) {
    // Choose the available direction that leads farthest from Pac-Man
    const available = this.getAvailableDirections(ghost);
    if (available.length === 0) return ghost.direction;

    const ghostGrid = this.toGrid(ghost.x, ghost.y);
    const pacGrid = this.toGrid(this.pacman.x, this.pacman.y);
    const mapW = this.map[0].length;
    const mapH = this.map.length;

    // For each available direction, look ahead to the next tile and score by distance from Pac-Man
    let bestDir = ghost.direction;
    let bestDist = -1;

    for (const option of available) {
      let nx = ghostGrid.x;
      let ny = ghostGrid.y;
      if (option.dir === "left") nx--;
      if (option.dir === "right") nx++;
      if (option.dir === "up") ny--;
      if (option.dir === "down") ny++;

      // Wrap-aware distance
      const dx = this.getWrappedDelta(pacGrid.x, nx, mapW);
      const dy = this.getWrappedDelta(pacGrid.y, ny, mapH);
      const dist = Math.hypot(dx, dy);
      if (dist > bestDist) {
        bestDist = dist;
        bestDir = option.dir;
      }
    }

    return bestDir;
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
        return { x: this.pacman.x, y: this.pacman.y };
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

  wrapTile(x, y) {
    const w = this.map[0].length;
    const h = this.map.length;
    return {
      x: ((x % w) + w) % w,
      y: ((y % h) + h) % h,
    };
  }

  getWrappedDelta(from, to, mapSize) {
    let d = to - from;
    if (Math.abs(d) > mapSize / 2) {
      d = d > 0 ? d - mapSize : d + mapSize;
    }
    return d;
  }

  getTileNeighbors(tile) {
    const raw = [
      { dir: "up", x: tile.x, y: tile.y - 1 },
      { dir: "down", x: tile.x, y: tile.y + 1 },
      { dir: "left", x: tile.x - 1, y: tile.y },
      { dir: "right", x: tile.x + 1, y: tile.y },
    ];

    return raw
      .map((d) => {
        const wrapped = this.wrapTile(d.x, d.y);
        return { dir: d.dir, x: wrapped.x, y: wrapped.y };
      })
      .filter((d) => this.isWalkableTile(d.x, d.y));
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

  getNearestWalkableTile(tile) {
    if (this.isWalkableTile(tile.x, tile.y)) return tile;
    const queue = [tile];
    const visited = new Set([`${tile.x},${tile.y}`]);
    while (queue.length > 0) {
      const cur = queue.shift();
      const dirs = [
        { x: cur.x, y: cur.y - 1 },
        { x: cur.x, y: cur.y + 1 },
        { x: cur.x - 1, y: cur.y },
        { x: cur.x + 1, y: cur.y },
      ];
      for (const d of dirs) {
        const key = `${d.x},${d.y}`;
        if (visited.has(key)) continue;
        visited.add(key);
        if (
          d.y < 0 ||
          d.y >= this.map.length ||
          d.x < 0 ||
          d.x >= this.map[0].length
        )
          continue;
        if (this.isWalkableTile(d.x, d.y)) return d;
        queue.push(d);
      }
    }
    return tile;
  }

  findPathDirection(startX, startY, targetX, targetY, currentDirection = "up") {
    const start = this.toGrid(startX, startY);
    let target = this.toGrid(targetX, targetY);

    target = this.getNearestWalkableTile(target);

    if (start.x === target.x && start.y === target.y) {
      return currentDirection;
    }

    const opposite = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };

    const runBfs = (avoidReverseAtStart) => {
      const queue = [start];
      const visited = new Set([`${start.x},${start.y}`]);
      const firstDir = new Map();

      while (queue.length > 0) {
        const current = queue.shift();

        if (current.x === target.x && current.y === target.y) {
          break;
        }

        let neighbors = this.getTileNeighbors(current);

        // Prefer not to reverse at the starting tile, but allow it as fallback
        if (
          avoidReverseAtStart &&
          current.x === start.x &&
          current.y === start.y
        ) {
          const nonReverse = neighbors.filter(
            (n) => n.dir !== opposite[currentDirection],
          );
          if (nonReverse.length > 0) {
            neighbors = nonReverse;
          }
        }

        for (const next of neighbors) {
          const key = `${next.x},${next.y}`;
          if (!visited.has(key)) {
            visited.add(key);
            // Propagate the direction of the first step from start
            const dir =
              current.x === start.x && current.y === start.y
                ? next.dir
                : firstDir.get(`${current.x},${current.y}`);
            firstDir.set(key, dir);
            queue.push({ x: next.x, y: next.y });
          }
        }
      }

      const targetKey = `${target.x},${target.y}`;
      if (!visited.has(targetKey)) {
        return null;
      }

      return firstDir.get(targetKey) || currentDirection;
    };

    // First try: avoid reversing
    let direction = runBfs(true);

    // Fallback: allow reversing if that is the only route in
    if (!direction) {
      direction = runBfs(false);
    }

    return direction || currentDirection;
  }

  findNearestFreeTile(startX, startY, blockedPositions) {
    // Use BFS to find the nearest walkable tile that's not in blockedPositions
    const start = this.toGrid(startX, startY);
    const queue = [start];
    const visited = new Set([`${start.x},${start.y}`]);

    // Check if a position is blocked by another entity
    const isBlocked = (px, py) => {
      return blockedPositions.some((pos) => {
        const dist = Math.hypot(px - pos.x, py - pos.y);
        return dist < CONFIG.TILE_SIZE * 1.5;
      });
    };

    while (queue.length > 0) {
      const current = queue.shift();
      const px = current.x * CONFIG.TILE_SIZE;
      const py = current.y * CONFIG.TILE_SIZE;

      // If this tile is walkable and not blocked, return it
      if (this.canMove(px, py) && !isBlocked(px, py)) {
        return { x: px, y: py };
      }

      // Explore neighbors
      const neighbors = [
        { x: current.x, y: current.y - 1 },
        { x: current.x, y: current.y + 1 },
        { x: current.x - 1, y: current.y },
        { x: current.x + 1, y: current.y },
      ];

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }

    // Fallback: return start position
    return { x: startX, y: startY };
  }

  moveGhostTowards(ghost, target, speedMultiplier = 1) {
    const speed =
      (ghost.scared ? CONFIG.GHOST_SCARED_SPEED : CONFIG.GHOST_SPEED) *
      speedMultiplier;

    // Use a threshold that is large enough to catch junctions,
    // but still smaller than the movement step so ghosts don't freeze.
    const centerThreshold = Math.max(0.2, speed * 0.45);

    const centered = this.isEntityCentered(ghost, centerThreshold);

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
      // Snap to grid before recalculating so turns happen cleanly
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
      this.powerModeId++;
      this.ghosts.forEach((ghost) => {
        if (!ghost.eaten) {
          // Ghost is active on the map — scare it immediately
          ghost.scared = true;
        }
        // Eaten ghosts: respawnGhost will check powerModeId when they
        // finish respawning and scare them if a new pellet was eaten.
      });
    }
  }

  activateInverseMode() {
    this.inverseMode = true;
    this.inverseModeTimer = CONFIG.INVERSE_DURATION;
    this.inverseGraceTimer = 1000;

    // All 4 ghosts become Pac-Men chasers at their current positions
    // Pac-Man entity stays where it is but is now rendered as a ghost
    this.ghosts.forEach((ghost) => {
      ghost.scared = false;
      ghost.eaten = false;
      ghost.isPlayer = false;
      ghost.releaseTimer = 0;

      if (ghost.mode === "exitingHouse") {
        ghost.mode = this.ghostMode;
      }
    });

    // Spread out any overlapping ghosts so all 4 Pac-Men are visible
    const occupied = [{ x: this.pacman.x, y: this.pacman.y }];
    this.ghosts.forEach((ghost) => {
      let tooClose = false;
      for (const pos of occupied) {
        if (
          Math.hypot(ghost.x - pos.x, ghost.y - pos.y) <
          CONFIG.TILE_SIZE * 1.5
        ) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) {
        const newPos = this.findNearestFreeTile(ghost.x, ghost.y, occupied);
        ghost.x = newPos.x;
        ghost.y = newPos.y;
      }
      occupied.push({ x: ghost.x, y: ghost.y });
    });
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
      { x: 9, y: 7, delay: 500 },
      { x: 10, y: 7, delay: 1000 },
      { x: 9, y: 7, delay: 1500 },
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

      // Make only non-eaten ghosts scared (don't respawn eaten ghosts)
      this.ghosts.forEach((ghost) => {
        if (!ghost.eaten) {
          ghost.scared = true;
        }
      });

      this.splitPacmans = [];

      // Remember which ghosts were already eaten before split activated
      this.ghostsEatenBeforeSplit = this.ghosts.map((g) => g.eaten);

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

      // Only create split Pac-Men for ghosts that aren't already eaten
      let spawnIndex = 0;
      for (let i = 0; i < this.ghosts.length; i++) {
        const targetGhost = this.ghosts[i];

        // Skip ghosts that are already eaten
        if (targetGhost.eaten) continue;

        const spawnDef = desiredSpawns[spawnIndex % desiredSpawns.length];
        const spawn = this.findSplitSpawnPosition(
          spawnDef.x,
          spawnDef.y,
          spawnDef.direction,
        );
        spawnIndex++;

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

        // Only respawn ghosts that were eaten during split mode,
        // not ones that were already eaten/respawning beforehand.
        this.ghosts.forEach((ghost, i) => {
          const wasEatenBefore =
            this.ghostsEatenBeforeSplit && this.ghostsEatenBeforeSplit[i];
          if (ghost.eaten && !wasEatenBefore) {
            this.respawnGhostInHouse(ghost, i);
          }
        });
        this.ghostsEatenBeforeSplit = null;
      }
    } else {
      this.checkEntityGhostCollision(this.pacman);
    }
  }

  checkEntityGhostCollision(entity) {
    // Skip collisions during grace period (e.g. after inverse mode ends)
    if (this.inverseGraceTimer > 0) return;

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

  endInverseMode() {
    this.inverseMode = false;
    this.inverseModeTimer = 0;

    // Brief grace period so Pac-Man doesn't die instantly from nearby ghosts
    this.inverseGraceTimer = 1500;

    // Spread out any overlapping ghosts so all 4 are visible
    const occupied = [{ x: this.pacman.x, y: this.pacman.y }];
    this.ghosts.forEach((ghost) => {
      let tooClose = false;
      for (const pos of occupied) {
        if (
          Math.hypot(ghost.x - pos.x, ghost.y - pos.y) <
          CONFIG.TILE_SIZE * 1.5
        ) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) {
        const newPos = this.findNearestFreeTile(ghost.x, ghost.y, occupied);
        ghost.x = newPos.x;
        ghost.y = newPos.y;
      }
      occupied.push({ x: ghost.x, y: ghost.y });
    });

    // Reset ghost state
    this.ghosts.forEach((g) => {
      g.isPlayer = false;
      g.scared = false;
      g.eaten = false;
      g.wandering = false;
      g.nextWanderTime = 10000 + Math.random() * 10000;
      g.mode = this.ghostMode;
    });
  }

  checkInverseCollisions() {
    if (this.inverseGraceTimer > 0) return;

    // Check if any of the 4 Pac-Man chasers (ghosts) caught the player (Pac-Man entity)
    for (let ghost of this.ghosts) {
      if (!ghost.eaten) {
        const dist = Math.hypot(
          this.pacman.x - ghost.x,
          this.pacman.y - ghost.y,
        );

        if (dist < CONFIG.TILE_SIZE * 0.8) {
          this.endInverseMode();
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

    // Remember which power mode activation was active when this ghost was eaten
    const powerIdWhenEaten = this.powerModeId;

    // After 2 seconds, allow the ghost to exit and reset eaten status
    setTimeout(() => {
      ghost.eaten = false;
      // If a NEW power pellet was eaten since this ghost was sent to the house,
      // it should come back scared. Otherwise it comes back normal.
      ghost.scared = this.powerMode && this.powerModeId > powerIdWhenEaten;
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
        { x: 9, y: 7, delay: 500 },
        { x: 10, y: 7, delay: 1000 },
        { x: 9, y: 7, delay: 1500 },
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
    if (this.level === 5) {
      this.lives++;
      document.getElementById("lives").textContent = this.lives;
    }
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
    } else {
      // Inverse mode: draw Pac-Man as a red ghost with gold outline
      this.ctx.fillStyle = "#FF0000";
      this.ctx.strokeStyle = "#FFD700";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(
        this.pacman.x + CONFIG.TILE_SIZE / 2,
        this.pacman.y + CONFIG.TILE_SIZE / 2,
        CONFIG.TILE_SIZE / 2,
        Math.PI,
        0,
      );
      this.ctx.lineTo(
        this.pacman.x + CONFIG.TILE_SIZE,
        this.pacman.y + CONFIG.TILE_SIZE,
      );
      this.ctx.lineTo(
        this.pacman.x + CONFIG.TILE_SIZE * 0.75,
        this.pacman.y + CONFIG.TILE_SIZE * 0.75,
      );
      this.ctx.lineTo(
        this.pacman.x + CONFIG.TILE_SIZE / 2,
        this.pacman.y + CONFIG.TILE_SIZE,
      );
      this.ctx.lineTo(
        this.pacman.x + CONFIG.TILE_SIZE * 0.25,
        this.pacman.y + CONFIG.TILE_SIZE * 0.75,
      );
      this.ctx.lineTo(this.pacman.x, this.pacman.y + CONFIG.TILE_SIZE);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      // Ghost eyes
      this.ctx.fillStyle = "white";
      this.ctx.beginPath();
      this.ctx.arc(this.pacman.x + 6, this.pacman.y + 8, 3, 0, Math.PI * 2);
      this.ctx.arc(this.pacman.x + 14, this.pacman.y + 8, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = "#00F";
      this.ctx.beginPath();
      this.ctx.arc(this.pacman.x + 6, this.pacman.y + 8, 1.5, 0, Math.PI * 2);
      this.ctx.arc(this.pacman.x + 14, this.pacman.y + 8, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw ghosts
    this.ghosts.forEach((ghost) => {
      if (!ghost.eaten) {
        if (this.inverseMode) {
          // In inverse mode: all ghosts rendered as Pac-Men
          this.drawPacMan({
            x: ghost.x,
            y: ghost.y,
            direction: ghost.direction || "right",
          });
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
