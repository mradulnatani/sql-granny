# The SQL Sanctuary

A Next.js App Router project containing the original Three.js survival-horror game.

## Requirements

- Node.js 20.9 or later
- npm

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production build

```bash
npm run build
npm start
```

## Project structure

```text
app/
  globals.css       Global styles and Tailwind directives
  layout.tsx        Root Next.js layout and metadata
  page.tsx          App Router entry point
components/
  game/
    Game.tsx        Main interactive game UI and runtime orchestration
lib/
  game/
    config.ts       Story chapters, SQL clue data, map and gameplay configuration
    granny.ts       Three.js Granny character mesh builder
    audio.ts        Web Audio horror audio engine
    textures.ts     Procedural chapter texture generation
```

## Refactoring notes

The supplied single-file game has been organized into a standard Next.js project. The campaign data, SQL prompts/validators, map configuration, character mesh builder, audio engine, texture generation, and main game component have been moved into separate modules. Gameplay expressions and event handlers in the original component were retained rather than redesigned.

No asset files were supplied separately; the game continues to generate its procedural textures and geometry at runtime.
