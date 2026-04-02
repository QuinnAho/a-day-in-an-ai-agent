import { DIRECTION_ORDER, DIRECTION_VECTORS, GAME_CONFIG } from './config.js';

export { GAME_CONFIG };

export const RUN_STATES = Object.freeze({
  READY: 'ready',
  RUNNING: 'running',
  WON: 'won',
  LOST: 'lost',
});

function cloneCell(cell) {
  return { x: cell.x, y: cell.y };
}

function normalizeConfig(config = GAME_CONFIG) {
  return { ...GAME_CONFIG, ...config };
}

function getCenteredStartingSnake(config) {
  if (Array.isArray(config.startingSnake) && config.startingSnake.length > 0) {
    return config.startingSnake.map(cloneCell);
  }

  const centerX = Math.floor(config.width / 2);
  const centerY = Math.floor(config.height / 2);
  const snake = [];

  for (let index = 0; index < config.initialLength; index += 1) {
    snake.push({ x: centerX - index, y: centerY });
  }

  return snake;
}

export function buildOccupiedLookup(snake) {
  const occupied = new Set();

  for (const cell of snake) {
    occupied.add(toCellKey(cell));
  }

  return occupied;
}

export function toCellKey(cell) {
  return `${cell.x},${cell.y}`;
}

export function isDirection(direction) {
  return DIRECTION_ORDER.includes(direction);
}

export function isOppositeDirection(fromDirection, toDirection) {
  if (!isDirection(fromDirection) || !isDirection(toDirection)) {
    return false;
  }

  const from = DIRECTION_VECTORS[fromDirection];
  const to = DIRECTION_VECTORS[toDirection];
  return from.x + to.x === 0 && from.y + to.y === 0;
}

export function getNextCell(cell, direction) {
  const vector = DIRECTION_VECTORS[direction];
  return {
    x: cell.x + vector.x,
    y: cell.y + vector.y,
  };
}

export function isOutOfBounds(cell, state) {
  return cell.x < 0 || cell.y < 0 || cell.x >= state.width || cell.y >= state.height;
}

export function listEmptyCells(state) {
  const emptyCells = [];

  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      const candidate = { x, y };
      if (!state.occupied.has(toCellKey(candidate))) {
        emptyCells.push(candidate);
      }
    }
  }

  return emptyCells;
}

export function pickFoodCell(state, { rng = Math.random, candidateIndex } = {}) {
  const emptyCells = listEmptyCells(state);

  if (emptyCells.length === 0) {
    return null;
  }

  let index = candidateIndex;
  if (!Number.isInteger(index)) {
    index = Math.floor(rng() * emptyCells.length);
  }

  index = Math.max(0, Math.min(index, emptyCells.length - 1));
  return cloneCell(emptyCells[index]);
}

export function createInitialState(config = GAME_CONFIG, foodOptions) {
  const resolvedConfig = normalizeConfig(config);
  const snake = getCenteredStartingSnake(resolvedConfig);
  const baseState = {
    config: resolvedConfig,
    width: resolvedConfig.width,
    height: resolvedConfig.height,
    snake,
    occupied: buildOccupiedLookup(snake),
    currentDirection: resolvedConfig.startDirection,
    queuedDirection: null,
    food: null,
    score: 0,
    foodEaten: 0,
    moveCount: 0,
    status: RUN_STATES.READY,
    tickMs: resolvedConfig.tickMs,
    lastOutcome: null,
  };

  return {
    ...baseState,
    food: pickFoodCell(baseState, foodOptions),
  };
}

export function restartGame(state, foodOptions) {
  return createInitialState(state.config ?? GAME_CONFIG, foodOptions);
}

export function queueDirection(state, direction) {
  if (!isDirection(direction)) {
    return state;
  }

  if (state.status === RUN_STATES.WON || state.status === RUN_STATES.LOST) {
    return state;
  }

  if (state.snake.length > 1 && isOppositeDirection(state.currentDirection, direction)) {
    return state;
  }

  if (state.status === RUN_STATES.READY) {
    return {
      ...state,
      currentDirection: direction,
      queuedDirection: null,
      status: RUN_STATES.RUNNING,
    };
  }

  if (state.status !== RUN_STATES.RUNNING) {
    return state;
  }

  if (direction === state.currentDirection || state.queuedDirection) {
    return state;
  }

  return {
    ...state,
    queuedDirection: direction,
  };
}

function getResolvedDirection(state) {
  if (state.moveCount === 0) {
    return state.currentDirection;
  }

  if (
    state.queuedDirection &&
    !(state.snake.length > 1 && isOppositeDirection(state.currentDirection, state.queuedDirection))
  ) {
    return state.queuedDirection;
  }

  return state.currentDirection;
}

export function stepState(state, foodOptions) {
  if (state.status !== RUN_STATES.RUNNING) {
    return state;
  }

  const currentDirection = getResolvedDirection(state);
  const consumedQueuedDirection =
    state.moveCount > 0 && state.queuedDirection === currentDirection;
  const nextHead = getNextCell(state.snake[0], currentDirection);

  if (isOutOfBounds(nextHead, state)) {
    return {
      ...state,
      currentDirection,
      queuedDirection: null,
      status: RUN_STATES.LOST,
      lastOutcome: 'wall',
    };
  }

  const isGrowthStep = Boolean(state.food && toCellKey(state.food) === toCellKey(nextHead));
  const vacatingTail = isGrowthStep ? null : state.snake[state.snake.length - 1];
  const nextHeadKey = toCellKey(nextHead);
  const canUseVacatingTail =
    vacatingTail !== null && nextHeadKey === toCellKey(vacatingTail);

  if (state.occupied.has(nextHeadKey) && !canUseVacatingTail) {
    return {
      ...state,
      currentDirection,
      queuedDirection: null,
      status: RUN_STATES.LOST,
      lastOutcome: 'self',
    };
  }

  const nextSnake = [nextHead, ...state.snake.map(cloneCell)];
  if (!isGrowthStep) {
    nextSnake.pop();
  }

  const nextState = {
    ...state,
    snake: nextSnake,
    occupied: buildOccupiedLookup(nextSnake),
    currentDirection,
    queuedDirection: consumedQueuedDirection ? null : state.queuedDirection,
    moveCount: state.moveCount + 1,
    lastOutcome: isGrowthStep ? 'food' : 'move',
  };

  if (!isGrowthStep) {
    return nextState;
  }

  const grownState = {
    ...nextState,
    score: state.score + 1,
    foodEaten: state.foodEaten + 1,
    food: null,
  };
  const nextFood = pickFoodCell(grownState, foodOptions);

  if (!nextFood) {
    return {
      ...grownState,
      status: RUN_STATES.WON,
      lastOutcome: 'board-cleared',
    };
  }

  return {
    ...grownState,
    food: nextFood,
  };
}
