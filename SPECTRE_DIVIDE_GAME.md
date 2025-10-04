# Spectre Divide Game - Documentation

## Overview

A tactical 2D shooter game inspired by Spectre Divide's unique "duality" mechanic, integrated into the GST Pro application as an easter egg feature.

## Game Concept

The game implements Spectre Divide's signature mechanic where players control two characters simultaneously, requiring strategic positioning and multitasking to defend both characters from waves of enemies.

## How to Access

1. Log in to the GST Pro application
2. Navigate to the "Spectre Divide" option in the sidebar menu
3. Click "Start Game" to begin

## Controls

- **WASD / Arrow Keys**: Move the active character
- **Tab**: Switch between Character 1 (blue) and Character 2 (purple)
- **Mouse Click**: Shoot in the direction of the cursor
- **Pause Button**: Pause/resume the game
- **Restart Button**: Reset the game

## Gameplay

### Objective
Defend both characters and eliminate as many enemies as possible to increase your score.

### Characters
- **Character 1 (Blue)**: Starts on the left side
- **Character 2 (Purple)**: Starts on the right side
- Only one character is active at a time (indicated by a golden ring)
- Both characters have 100 health points
- Game ends when both characters reach 0 health

### Enemies
- Spawn from the left and right edges of the arena
- Move toward the nearest character
- Deal damage on contact (5 damage per collision)
- Have 50 health points each
- Defeated by 2 bullet hits (25 damage per bullet)

### Scoring
- +10 points for each enemy eliminated

### Strategy Tips
1. **Switch Frequently**: Use Tab to switch between characters and defend multiple positions
2. **Create Distance**: Keep enemies away from both characters
3. **Crossfire**: Position characters to create overlapping fields of fire
4. **Prioritize Threats**: Focus on enemies closest to your characters
5. **Health Management**: If one character is low on health, focus on defending that character

## Technical Implementation

### Technology Stack
- **React**: Component-based UI
- **TypeScript**: Type-safe game logic
- **Canvas API**: 2D rendering
- **Custom Hooks**: Game state management

### Game Loop
- Runs at 30 FPS (frames per second)
- Handles:
  - Character movement
  - Bullet physics
  - Enemy AI and pathfinding
  - Collision detection
  - Health updates
  - Score tracking

### Features
- Real-time character health bars
- Active character highlighting
- Enemy spawn system (every 2 seconds)
- Bullet trajectory system
- Collision detection for bullets, enemies, and characters
- Pause/resume functionality
- Game over detection

## UI Components

### Game Arena
- 800x600 pixel canvas
- Dark tactical grid background
- Real-time entity rendering

### Sidebar Panels
1. **Score Card**: Current game score
2. **Characters Panel**: Shows both characters with health bars and active indicator
3. **Stats Panel**: Real-time enemy and bullet counts
4. **Instructions Panel**: Control reference

### Visual Design
- Dark theme matching tactical shooter aesthetics
- Color-coded characters (blue and purple)
- Health bar color transitions (green → yellow → red)
- Gradient accents inspired by Spectre Divide's visual style

## Integration with GST Pro

The game is seamlessly integrated into the existing application:
- Uses the same UI component library (shadcn/ui)
- Follows the app's design language
- Accessible through the standard navigation system
- Requires authentication like other app features

## Future Enhancements (Potential)

- Additional character abilities
- Power-ups and upgrades
- Different enemy types
- Multiplayer mode
- Leaderboard system
- Sound effects and music
- More maps/arenas
- Difficulty settings

## Credits

Inspired by **Spectre Divide**, a tactical FPS game by Mountaintop Studios featuring the innovative duality mechanic.
