# SQL-Granny

SQL-Granny is a customizable multimedia survival-horror game built with Next.js, React, TypeScript, and Three.js. The project follows the Lab Test 2 brief by creating a playable, interactive game with a start screen, gameplay loop, score system, collision logic, animation, audio, and a unique SQL-based customization mechanic.

## Project summary

The game is a first-person stealth survival experience in which the player explores a haunted manor, avoids an enemy pursuer, hides in safe spots, and solves SQL-based clue puzzles to unlock tools and escape each chapter. The project includes a main menu, chapter progression, score tracking, state management, 3D scene rendering, and sound/visual effects.

The gameplay is not a generic clone; it is customized around a unique lab theme:

- Visual theme: horror manor / survival thriller aesthetic
- Character style: first-person stealth escape gameplay
- Collectibles: clue dossiers and escape tools
- Hazard: Granny stalker enemy, bear traps, and floor hazards
- Unique mechanic: SQL decryption puzzles unlock progression and power-ups
- Difficulty progression: chapter-based enemy speed scaling and increasing threat level

## Why this satisfies the lab requirements

This implementation covers the required multimedia, event handling, and interaction requirements of the assignment:

- Start screen and title screen: implemented as the intro cinematic and main menu
- Gameplay screen: active 3D world with HUD, minimap, and live objectives
- Score display and timer/lives style indicators: top HUD, chapter-day counter, score, clue/tool counters, and win/lose flow
- Game-over and restart: retry and menu actions after capture or win
- Player movement: WASD + mouse-look + sprint + crouch + crawl controls
- Animation: continuous 60fps Three.js update loop, ambient effects, object rotation, dust particles, enemy animation
- Collision detection: wall collision, trap collision, object proximity checks, line-of-sight detection against the stalker
- Scoring and penalties: clue gains, tool unlock rewards, exit bonuses, SQL failure penalties
- Difficulty progression: 4 chapters with escalating enemy speed and survival pressure
- Game states: intro, menu, chapter intro, playing, SQL decoder, chapter clear, day transition, game over, victory
- Multimedia integration: procedural environment textures, fog, lights, particle effects, and Web Audio sound design
- Customization: SQL-based unlocking replaces a standard collect-and-escape theme with database query puzzles and unique story progression
- Restart without reloading: menu and retry buttons restart chapter state cleanly

## Gameplay overview

The player begins in a haunted manor and must survive a pursuit while collecting clues, solving SQL queries, unlocking escape tools, and reaching the exit before the enemy catches them.

Each chapter introduces a new environment and a unique objective structure:

- Chapter I: Awakening
- Chapter II: Beneath the Floorboards
- Chapter III: The Matriarch's Crypt
- Chapter IV: Blood Moon Exodus

The game uses a stealth-first design where moving loudly can betray the player, crawling in low-clearance spaces can hide the player from detection, and SQL clue solving temporarily freezes the enemy and reveals useful tools.

## Controls

- W / A / S / D: move
- Mouse movement: look around
- Shift: sprint
- C: crouch
- Z: crawl / prone stealth movement
- E: interact, inspect clues, hide in objects, step out of hiding
- Q: open SQL decoder or jump to the next unresolved clue
- Space: escape bear traps or perform an emergency action when trapped
- Escape: close decryption modal

## Game rules

1. Explore the map and locate hidden clue objects.
2. Press E near a clue to collect it.
3. Solve the matching SQL prompt to unlock the associated tool.
4. Retrieve the spawned tool in the environment.
5. Gather all required tools for that chapter.
6. Reach the chapter exit to advance.
7. Avoid detection by the stalker enemy.
8. Stay out of danger zones like bear traps and loud creaking floors.
9. If the enemy catches the player, the chapter ends in a game-over state.
10. Completing all chapters triggers the final victory screen.

## Customization details

The project includes a distinct customization that goes beyond changing colors or title text.

Unique customization implemented in SQL-Granny:

- The core progression system is built around SQL clue decoding rather than a generic collectible loop.
- Each clue includes its own database table, query prompt, canonical SQL answer, and validation logic.
- Solving a puzzle reveals a physical escape tool in the 3D map and triggers a temporary safe ward that freezes the enemy.
- The stealth system is customized with three stances (stand, crouch, crawl), low-clearance hiding spaces, and chapter-specific level design.
- Enemy behavior is adaptive based on stealth state, noise level, and chapter difficulty progression.

This is a functional customization because it changes both the mechanics and progression of the game, not just the visual theme.

## Technical implementation

### Stack

- Next.js App Router
- React + TypeScript
- Three.js for rendering the 3D scene and gameplay world
- Tailwind CSS for HUD and UI styling
- Web Audio API for sound and audio feedback

### Core systems

The project is organized into several key files:

- app/page.tsx: entry point for the app
- components/game/Game.tsx: main game loop, UI, states, rendering, and player logic
- lib/game/config.ts: chapters, clue data, SQL prompts, map walls, traps, and level configuration
- lib/game/granny.ts: 3D granny character model builder
- lib/game/audio.ts: sound effects and audio system
- lib/game/textures.ts: procedural texture generation for chapter-specific materials

## How the main functional requirements are implemented

### 1. Game interface

The game includes:

- Intro cinematic sequence with animated slides
- Main menu with chapter selection and settings
- Gameplay HUD with score, day count, clue count, tool count, stance, and enemy distance
- Chapter briefings and transition screens
- Game-over and victory overlays

### 2. Player controls

Movement and interaction are handled in the keyboard and mouse listeners in the main game component.

- WASD movement
- sprint via Shift
- crouch via C
- crawl via Z
- interact via E
- access SQL terminal via Q
- pointer lock and mouse look for first-person viewing

### 3. Animation and continuous gameplay

A requestAnimationFrame loop updates the 3D scene every frame. The engine handles:

- camera movement
- enemy motion and AI state transitions
- rotating clue meshes and glowing tool objects
- dust particle drift
- environment flicker and lights
- chapter transitions and overlays

### 4. Collision detection

Collision logic is implemented through custom geometric checks:

- checkCircleAABB for bounding-box collision tests
- canEntityOccupy for wall and vent collision rules
- moveWithStanceCollision for movement blocking
- has3DLineOfSight to determine whether the enemy can see the player

These rules are used for walls, crawl zones, hiding spots, exits, and traps.

### 5. Scoring and penalties

The player accumulates points through:

- discovering clues
- solving SQL queries
- collecting tools
- escaping a chapter successfully

Points are reduced for wrong SQL queries and other failures, and score values are persisted in localStorage as a high score.

### 6. Difficulty progression

The game adds difficulty by:

- increasing enemy movement speed across chapters
- adding more dangerous conditions in later chapters
- increasing the challenge of clue solving and stealth management
- scaling the day/chapter progression logic

### 7. Game states

The app explicitly manages several game states:

- INTRO
- MAIN_MENU
- CHAPTER_INTRO
- PLAYING
- SQL_DECODER
- CHAPTER_CLEAR
- DAY_TRANSITION
- GAMEOVER
- VICTORY_CAMPAIGN

### 8. Multimedia integration

The game integrates multiple multimedia elements:

- 3D environment with lighting and fog
- procedural textures for walls and floors
- animated particles and emissive objects
- audio for ambience, clues, alarms, and jumpscares
- cinematic intro overlays and stylized UI panels

### 9. Restart and replay loop

The game supports replay without needing to restart the app:

- retry buttons from game-over state
- restart from chapter clear or main menu
- reset of game state variables and chapter progression logic

## Algorithm explanation

The game uses a simple but effective real-time game loop:

1. Update player input.
2. Resolve movement based on stance and collision maps.
3. Evaluate enemy AI state (patrolling, chasing, investigating, frozen).
4. Check interactions with clues, tools, traps, and exits.
5. Update score, UI, and HUD values.
6. Render the updated scene frame-by-frame.

Collision detection works by approximating the player and enemy as circles and testing them against rectangular walls and low-clearance zones. This reduces complexity while still allowing realistic movement restrictions and environmental interaction.

## Execution instructions

### Requirements

- Node.js 20 or later
- npm

### Install dependencies

```bash
npm install
```

### Run the app locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Production build

```bash
npm run build
npm start
```

## Project structure

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  game/
    Game.tsx
lib/
  game/
    audio.ts
    config.ts
    granny.ts
    textures.ts
README.md
package.json
```

## Screenshots

This repository does not currently include committed gameplay screenshots, but the game is designed to support a full screenshot workflow. Recommended screenshots to add are:

- title intro screen
- main menu and chapter selection
- gameplay capture during stealth traversal
- SQL decoder modal
- game-over screen
- victory screen

Suggested folder:

```text
docs/screenshots/
```

## Lab deliverable checklist

This project includes the required deliverables for the assignment:

- Working interactive game application
- Full source code in the repository
- README describing rules, controls, customization, execution, and requirements mapping
- Custom game logic and unique mechanics beyond a simple template
- Replay and restart flow
- Visual and audio game elements

## Notes

The project is implemented as a web-based multimedia game using modern browser technologies rather than Python/Pygame. This fits the assignment's flexibility of using either Python with Pygame or HTML/CSS/JavaScript. The implemented version uses a richer 3D browser-based experience while still satisfying the functional requirements of the lab.

## License

This project is intended for educational use as part of a multimedia lab assignment.
