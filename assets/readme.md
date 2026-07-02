# Assets Folder

Place your image assets here:

## Cat Character
- `cat.png` or `cat.jpg` - The chibi cat character (top-down view)
- **For animation**: Use a sprite sheet (horizontal strip) named `cat_sprite.png` with multiple frames side-by-side
  - OR use numbered frames: `cat_frame1.png`, `cat_frame2.png`, etc. (up to 8 frames)
  - Recommended: Sprite sheet with 4-8 frames for running animation
- `cat-after-portal-opens/Cat_Dash_Cat-gotta_Poo-1.png` through `-4.png` - Replaces the running animation once the portal opens, on every level

## Obstacles (SVG recommended for clarity)
- `obstacle_small.png`, `obstacle_small.jpg`, or `obstacle_small.svg` - Small obstacle (basket/box)
- `obstacle_medium.png`, `obstacle_medium.jpg`, or `obstacle_medium.svg` - Medium obstacle (basket/box)
- `obstacle_big.png`, `obstacle_big.jpg`, or `obstacle_big.svg` - Big obstacle (basket/box)

## Level Destinations
- `litterbox_bathroom.png` or `litterbox_bathroom.svg` - Bathroom litter box (Level 1)
- `litterbox_livingroom.png` or `litterbox_livingroom.svg` - Living room litter box (Level 2+)
- `litterbox_balcony.png` or `litterbox_balcony.svg` - Balcony destination (Level 3)

## Collectibles
- `coin/coin-1.png` through `coin/coin-6.png` - Spinning coin animation frames
- `fish/fish-1.png` through `fish/fish-4.png` - Swimming fish (treat) animation frames
- `shield/shield-1.png` through `shield/shield-8.png` - Spinning shield animation frames

The game will automatically load these images when they are placed in this folder.
SVG format is recommended for obstacles as they scale better and remain clear.

