# Modern Pac-Man

A modern twist on the classic Pac-Man game built with vanilla HTML, CSS, and JavaScript.

## Features

### Classic Gameplay

- Navigate Pac-Man through the maze eating dots
- Avoid ghosts or they'll catch you!
- Eat power pellets to turn the tables and chase ghosts
- Collect fruit power-ups for bonus points (strawberry, orange, cherry)
- Score tracking and high score saving
- Multiple lives system

### Modern Twists

#### 1. **Split Power** (Unlocked at Level 2)

- When a special split power-up appears, collect it to enable the split ability
- During power pellet mode, press **SPACE** to split Pac-Man into multiple Pac-Men
- All split Pac-Men automatically hunt down scared ghosts
- Once all ghosts are eaten, the Pac-Men merge back into one

#### 2. **Random Teleportation** (Starts at Level 3)

- Instead of wrapping to the opposite side of the screen, Pac-Man teleports to a random location
- Adds unpredictability and challenge - you might teleport near a ghost!
- Makes the game more strategic and exciting

#### 3. **Inverse Mode** (Starts at Level 5)

- 30% chance to activate when eating a power pellet
- You become a ghost trying to avoid being caught by Pac-Men!
- The other ghosts transform into Pac-Men and chase you
- Earn **DOUBLE POINTS** for every moment you survive
- Successfully evading capture rewards high scores

## Controls

- **Arrow Keys**: Move Pac-Man (or ghost in Inverse Mode)
- **SPACE**: Activate Split Power (when available during power mode)
- **P**: Pause/Unpause game
- **R**: Restart game
- **M**: Mute/Unmute sound effects

## Sound Effects

The game features classic Pac-Man style sound effects using the Web Audio API:

- **Wakka Wakka**: Eating dots sound
- **Power Pellet**: Special sound when collecting power pellets
- **Ghost Eaten**: Sound when eating scared ghosts
- **Fruit Collected**: Bonus sound for collecting fruits
- **Death**: Pac-Man death sound
- **Level Complete**: Victory fanfare when completing a level
- **Split Power**: Special effect when activating split mode
- **Teleport**: Sound when randomly teleporting (Level 3+)
- **Game Start**: Opening melody when starting the game

All sounds are generated procedurally - no external audio files needed!

## How to Play

1. Open `index.html` in a modern web browser
2. Press any key to start the game (this also initializes audio)
3. Use arrow keys to navigate through the maze
4. Eat all dots to complete a level
5. Collect power-ups for special abilities and bonus points
6. Avoid ghosts or eat them when powered up
7. Try to beat your high score!

## Scoring

- Small Dot: 10 points
- Power Pellet: 50 points
- Ghost: 200 points
- Cherry: 200 points
- Strawberry: 300 points
- Orange: 500 points
- Split Power-Up: 100 points
- Inverse Mode Survival: 2 points per frame (double normal rate)

## Level Progression

- **Level 1-2**: Classic gameplay with fruit power-ups
- **Level 2+**: Split power-up becomes available
- **Level 3+**: Random teleportation activated
- **Level 5+**: Inverse mode can trigger

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

- In Split Power mode, use it strategically when multiple ghosts are scared
- Random teleportation can be risky - be prepared to react quickly
- In Inverse Mode, survival is key - avoid the pac-men as long as possible for maximum points
- Watch the power-up indicators at the top to know what abilities are available
- Practice moving through tight spaces to evade ghosts effectively

Enjoy the game!
