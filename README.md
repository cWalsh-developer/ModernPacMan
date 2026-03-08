# Modern Pac-Man

A modern twist on the classic Pac-Man game built with vanilla HTML, CSS, and JavaScript.

## Features

### Classic Gameplay

- Navigate Pac-Man through the maze eating dots
- Avoid ghosts or they'll catch you!
- Eat power pellets to turn the tables and chase ghosts
- Collect fruit power-ups for bonus points (strawberry, orange, cherry)
- Collect special power tokens (split power, teleport) to gain ability charges
- Score tracking and high score saving
- Multiple lives system

### Modern Twists

#### 1. **Split Power** (Available from Level 1)

- You start with 1 split power charge
- During power pellet mode, press **SPACE** to split Pac-Man into 4 Pac-Men
- Each split Pac-Man automatically hunts a specific ghost (red, pink, cyan, or orange)
- Split Pac-Men use intelligent pathfinding to chase down their targets
- Once all ghosts are eaten, the Pac-Men merge back into one
- Collect special split power tokens near the ghost house to gain more charges
- Current charge count shown in UI (e.g., "x2")

#### 2. **Teleport Power** (Available from Level 1)

- You start with 1 teleport charge
- Press **SHIFT** to instantly teleport Pac-Man to a random safe location on the map
- Great for escaping dangerous situations or repositioning strategically
- Collect cyan **"T"** tokens to gain more teleport charges (150 points each)
- Current charge count shown in UI (e.g., "x1")
- Use wisely - you might teleport near a ghost!

#### 3. **Inverse Mode** (Starts at Level 5)

- 30% chance to activate when eating a power pellet
- You become a ghost trying to avoid being caught by Pac-Men!
- The other ghosts transform into Pac-Men and chase you
- Earn **DOUBLE POINTS** for every moment you survive
- Successfully evading capture rewards high scores

## Controls

- **Arrow Keys**: Move Pac-Man (or ghost in Inverse Mode)
- **SPACE**: Activate Split Power (when available during power mode)
- **SHIFT**: Activate Teleport Power (when available)
- **P**: Pause/Unpause game
- **R**: Restart game
- **M**: Mute/Unmute sound effects

## Sound Effects

The game features classic Pac-Man style sound effects using the Web Audio API:

- **Wakka Wakka**: Eating dots sound
- **Power Pellet**: Special sound when collecting power pellets
- **Ghost Eaten**: Sound when eating scared ghosts
- **Fruit Collected**: Bonus sound for collecting fruits and power tokens
- **Death**: Pac-Man death sound
- **Level Complete**: Victory fanfare when completing a level
- **Split Power**: Special effect when activating split mode
- **Teleport**: Sound when using teleport power
- **Game Start**: Opening melody when starting the game

All sounds are generated procedurally - no external audio files needed!

## How to Play

1. Open `index.html` in a modern web browser
2. Press any key to start the game (this also initializes audio)
3. Use arrow keys to navigate through the maze
4. Eat all dots to complete a level
5. Collect power pellets to make ghosts vulnerable
6. Collect fruits and power tokens for bonus points and special abilities
7. Press **SPACE** during power mode to activate split power (spawns 4 AI-controlled Pac-Men)
8. Press **SHIFT** anytime to teleport to a random location (uses 1 charge)
9. Try to beat your high score!

## Scoring

- Small Dot: 10 points
- Power Pellet: 50 points
- Ghost: 200 points
- Cherry: 200 points
- Strawberry: 300 points
- Orange: 500 points
- Split Power Token: 100 points
- Teleport Token: 150 points
- Inverse Mode Survival: 2 points per frame (double normal rate)

## Level Progression

- **Level 1+**: All features available from the start (split power, teleport power, fruit power-ups)
- **Level 5+**: Inverse mode can trigger (30% chance on power pellet)
- Each level increases ghost speed and difficulty

## Technical Features

- Smooth canvas-based rendering
- Collision detection system
- Ghost AI with chase/flee behaviors
- Power-up spawn system
- Level progression with increasing difficulty
- Local storage for high score persistence
- Responsive UI with status indicators

## Browser Compatibility

Works best in modern browsers that support:

- HTML5 Canvas
- ES6 JavaScript
- LocalStorage API

Recommended browsers: Chrome, Firefox, Edge, Safari (latest versions)

## Tips

- **Split Power**: Use strategically during power mode when multiple ghosts are scared. Each of the 4 Pac-Men will hunt a specific ghost
- **Teleport Power**: Great for emergency escapes or repositioning, but be careful - you might teleport near danger
- **Collect Tokens**: Look for split power tokens (near ghost house) and cyan teleport tokens to build up charges
- **Power Management**: You start with 1 charge of each power, so use them wisely until you collect more
- **Inverse Mode**: When it triggers (level 5+), survival is key - avoid the pac-men as long as possible for maximum points
- Watch the power-up indicators at the top to track your available charges (x1, x2, etc.)
- Practice moving through tight spaces to evade ghosts effectively

Enjoy the game!
