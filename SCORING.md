# Cat Rush! — Scoring & Game States

This document describes exactly how the score is calculated and what counts as
**Game Clear** vs **Game Over**. All values reflect the logic in `game.js`.

---

## Levels at a glance

| Level | Time limit | Treats to open portal | Speed | Obstacles |
|:-----:|:----------:|:---------------------:|:-----:|-----------|
| 1     | **60s**    | 5                     | 1.0×  | small only |
| 2     | **60s**    | 8                     | 1.3×  | small only |
| 3     | **60s**    | 10                    | 1.6×  | small + medium |

You start with **3 lives**, shared across all levels. Score carries over from
level to level — there is **one running score** for the whole run.

---

## How score is earned

Score comes from four sources: collectibles, the combo multiplier, the
level-completion bonus, and the time bonus.

### 1. Collectibles

| Item   | Base points | Also does |
|--------|:-----------:|-----------|
| 🪙 Coin  | **10**      | +1 to coin counter (used for rewards) |
| 🐟 Treat | **5**       | +1 toward the treats needed to open the portal |
| 🛡️ Shield | **0**       | Grants a 10s shield (no points) |

Collectible points are multiplied by the current **combo multiplier** (below):

```
points awarded = floor(basePoints × comboMultiplier)
```

### 2. Combo multiplier

Picking up items in quick succession builds a combo:

- Each collectible picked up increments the **combo count** and refreshes a
  **2-second combo window**. If you go 2s without collecting anything, the
  combo count resets to 0.
- Once the combo count reaches **3 within the window**, the multiplier jumps to
  **1.5×** for **3 seconds**.
- The multiplier is capped at **1.5×** — it does not stack higher.

So a coin grabbed during an active combo is worth `floor(10 × 1.5) = 15`, and a
treat is worth `floor(5 × 1.5) = 7`.

### 3. Level-completion bonus

Reaching the portal to finish a level awards a flat **+100**.

### 4. Time bonus

Awarded on level completion, based on how much of the 60-second limit you used.
`timeRatio = timeElapsed ÷ 60s`:

| Finished within | Time bonus |
|-----------------|:----------:|
| 30s (≤ 50% of limit) | **+50** |
| 45s (≤ 75% of limit) | **+25** |
| slower than 45s | +0 |

> Note: because all levels now share a 60s limit, the fast/medium thresholds are
> the same 30s / 45s marks on every level.

### Worked example

Finish Level 1 in 28 seconds having collected 6 coins and 5 treats, with the
combo multiplier active for half of them:

```
3 coins  @ 10  = 30
3 coins  @ 15  = 45   (combo active)
3 treats @ 5   = 15
2 treats @ 7   = 14   (combo active)
Level complete  +100
Time bonus      +50   (28s ≤ 30s)
------------------------------
Total          254
```

---

## Game states

The game moves through these states (`this.state`):

| State            | Meaning |
|------------------|---------|
| `playing`        | Active gameplay |
| `paused`         | Paused via the pause button |
| `levelComplete`  | Brief moment after touching the portal, before the next level loads |
| `levelTransition`| Short interstitial between levels |
| `tryAgain`       | A life was lost but lives remain — resume the same level |
| `gameOver`       | Out of lives — run ends |
| `gameClear`      | All 3 levels finished — run ends successfully |

---

## Level Complete

A level is completed when the cat **reaches the open portal**.

1. Collect the required number of treats for the level (5 / 8 / 10).
2. Collecting the last needed treat **opens the portal** ("Portal opened!").
3. Touching the open portal completes the level, awards the **+100 completion
   bonus** and any **time bonus**, then advances to the next level.

---

## Game Clear (Game Complete)

**Game Clear** = completing **all 3 levels** — i.e. reaching the portal on
Level 3 (the final level).

- Shows the **Game Clear** screen with your final score and coins.
- This is the **only** screen where you can submit your score to the
  leaderboard (you must finish the whole game to make the board).

---

## Game Over

**Game Over** = running out of lives (lives reach **0**). You start with 3.

A life is lost in two ways:

1. **Hitting an obstacle without a shield.** If you have a shield, it absorbs
   the hit (shield consumed, no life lost). Without one, you lose a life.
2. **Running out of time.** If the 60-second level timer reaches 0 before you
   reach the portal, you lose a life.

When a life is lost and lives remain, you go to the **Try Again** screen and
restart the current level. When the last life is lost, you reach **Game Over**.

- The Game Over screen shows your final score, coins, and the Top 10
  leaderboard **read-only** — scores are **not** submitted from Game Over.
- To get on the leaderboard you must reach **Game Clear**.
