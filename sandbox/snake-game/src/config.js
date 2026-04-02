export const GAME_CONFIG = Object.freeze({
  width: 20,
  height: 20,
  initialLength: 3,
  tickMs: 140,
  startDirection: 'east',
  startingSnake: null,
  visuals: Object.freeze({
    boardPaddingPercent: 3,
  }),
});

export const DIRECTION_VECTORS = Object.freeze({
  north: Object.freeze({ x: 0, y: -1 }),
  east: Object.freeze({ x: 1, y: 0 }),
  south: Object.freeze({ x: 0, y: 1 }),
  west: Object.freeze({ x: -1, y: 0 }),
});

export const DIRECTION_ORDER = Object.freeze(Object.keys(DIRECTION_VECTORS));
