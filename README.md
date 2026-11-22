# GHOSTLIGHT — a museum heist in the dark

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/kornztt/stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/kornztt/stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

You are Wren, a thief in the Vane Museum after closing time. Steal all three
artifacts on each floor — the Sun Disk, the Jade Fox, the Clockwork Heart —
then reach the exit without ever being seen.

## How to play

- **Move:** WASD or arrow keys. **Sneak:** hold Shift (slower, quieter, harder to spot).
- **Guards** patrol fixed routes with visible yellow vision cones. Walls and
  crates block their sight; bushes hide you (your outline fades).
- **Detection:** a guard that sees you fills its suspicion ring. At half it
  comes to investigate; at full it chases you. Break line of sight and the
  meter drains — you can recover from a near miss.
- **Noise:** running footsteps carry. Guards within earshot come to listen.
- **Goal:** collect every artifact to unlock the exit, then slip out.
  Coins are worth score. Three floors, each harder than the last.
- **Screens:** title, caught, level clear, and the final getaway. Best total
  time is saved in your browser. Press M to mute.

## Files

- `game/index.html` — the page; `game/src/main.js` — loop and states
- `game/src/levels.js` — the three museum floors
- `game/src/guards.js` — patrols, vision cones, alert states
- `game/src/player.js` — movement, sneaking, hiding, loot
- `game/src/render.js` — everything drawn on the canvas
- `game/src/audio.js` — synthesized WebAudio sounds and music
- `game/src/config.js` — tuning constants
- `main.ts` — hands the game in to make.fun

Run it with any static server, e.g. `node serve.ts` or
`python3 -m http.server`, then open `game/index.html`.
