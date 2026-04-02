import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GAME_CONFIG,
  RUN_STATES,
  buildOccupiedLookup,
  createInitialState,
  pickFoodCell,
  queueDirection,
  restartGame,
  stepState,
} from '../src/simulation.js';

function cloneCell(cell) {
  return { x: cell.x, y: cell.y };
}

function makeState({
  config = GAME_CONFIG,
  snake,
  currentDirection = GAME_CONFIG.startDirection,
  queuedDirection = null,
  food = null,
  score = 0,
  foodEaten = 0,
  moveCount = 0,
  status = RUN_STATES.RUNNING,
  lastOutcome = null,
} = {}) {
  const resolvedConfig = { ...GAME_CONFIG, ...config };
  const resolvedSnake = (
    snake ?? createInitialState(resolvedConfig, { candidateIndex: 0 }).snake
  ).map(cloneCell);

  return {
    config: resolvedConfig,
    width: resolvedConfig.width,
    height: resolvedConfig.height,
    snake: resolvedSnake,
    occupied: buildOccupiedLookup(resolvedSnake),
    currentDirection,
    queuedDirection,
    food: food ? cloneCell(food) : null,
    score,
    foodEaten,
    moveCount,
    status,
    tickMs: resolvedConfig.tickMs,
    lastOutcome,
  };
}

test('createInitialState builds the default ready-state board', () => {
  const state = createInitialState();

  assert.equal(state.status, RUN_STATES.READY);
  assert.equal(state.score, 0);
  assert.equal(state.moveCount, 0);
  assert.equal(state.snake.length, GAME_CONFIG.initialLength);
  assert.deepEqual(state.snake, [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  assert.ok(state.food, 'Expected a spawned food cell');
  assert.equal(state.occupied.has(`${state.food.x},${state.food.y}`), false);
});

test('queueDirection rejects immediate opposite turns', () => {
  const readyState = createInitialState();
  const rejectedReadyState = queueDirection(readyState, 'west');

  assert.equal(rejectedReadyState.status, RUN_STATES.READY);
  assert.equal(rejectedReadyState.currentDirection, 'east');

  const runningState = makeState({
    snake: [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ],
  });
  const rejectedRunningState = queueDirection(runningState, 'west');

  assert.equal(rejectedRunningState.queuedDirection, null);
  assert.equal(rejectedRunningState.currentDirection, 'east');
});

test('queueDirection buffers only one turn and stepState applies it on the next tick', () => {
  let state = makeState({
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ],
    currentDirection: 'east',
  });
  state = queueDirection(state, 'north');
  state = queueDirection(state, 'south');

  assert.equal(state.currentDirection, 'east');
  assert.equal(state.queuedDirection, 'north');

  state = stepState(state);

  assert.equal(state.currentDirection, 'north');
  assert.equal(state.moveCount, 1);
  assert.equal(state.queuedDirection, null);
  assert.deepEqual(state.snake[0], { x: 10, y: 9 });
});

test('stepState grows the snake and increments score when food is eaten', () => {
  const state = makeState({
    snake: [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ],
    food: { x: 11, y: 10 },
  });
  const nextState = stepState(state, { candidateIndex: 0 });

  assert.equal(nextState.status, RUN_STATES.RUNNING);
  assert.equal(nextState.score, 1);
  assert.equal(nextState.foodEaten, 1);
  assert.equal(nextState.snake.length, 4);
  assert.deepEqual(nextState.snake[0], { x: 11, y: 10 });
  assert.equal(nextState.occupied.has(`${nextState.food.x},${nextState.food.y}`), false);
});

test('stepState ends the run on wall collision', () => {
  const state = makeState({
    config: { width: 4, height: 4 },
    snake: [
      { x: 3, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 1 },
    ],
    currentDirection: 'east',
  });
  const nextState = stepState(state);

  assert.equal(nextState.status, RUN_STATES.LOST);
  assert.equal(nextState.lastOutcome, 'wall');
  assert.deepEqual(nextState.snake, state.snake);
});

test('stepState allows moving into the vacating tail on a non-growth step', () => {
  const state = makeState({
    config: { width: 4, height: 4 },
    snake: [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
    ],
    currentDirection: 'west',
  });
  const nextState = stepState(state);

  assert.equal(nextState.status, RUN_STATES.RUNNING);
  assert.deepEqual(nextState.snake, [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 1, y: 2 },
  ]);
});

test('stepState ends the run on self collision with a non-vacating body segment', () => {
  const state = makeState({
    config: { width: 4, height: 4 },
    snake: [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
    ],
    currentDirection: 'south',
  });
  const nextState = stepState(state);

  assert.equal(nextState.status, RUN_STATES.LOST);
  assert.equal(nextState.lastOutcome, 'self');
});

test('pickFoodCell excludes occupied cells', () => {
  const state = makeState({
    config: { width: 3, height: 2 },
    snake: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  });
  const food = pickFoodCell(state, { candidateIndex: 0 });

  assert.deepEqual(food, { x: 2, y: 1 });
});

test('stepState transitions to won when growth fills the board', () => {
  const state = makeState({
    config: { width: 2, height: 2 },
    snake: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
    currentDirection: 'south',
    food: { x: 0, y: 1 },
  });
  const nextState = stepState(state);

  assert.equal(nextState.status, RUN_STATES.WON);
  assert.equal(nextState.score, 1);
  assert.equal(nextState.snake.length, 4);
  assert.equal(nextState.food, null);
  assert.equal(nextState.lastOutcome, 'board-cleared');
});

test('restartGame returns a clean ready state from a finished run', () => {
  const finishedState = makeState({
    score: 4,
    foodEaten: 4,
    moveCount: 18,
    status: RUN_STATES.LOST,
    lastOutcome: 'wall',
  });
  const restartedState = restartGame(finishedState, { candidateIndex: 0 });

  assert.notEqual(restartedState, finishedState);
  assert.equal(restartedState.status, RUN_STATES.READY);
  assert.equal(restartedState.score, 0);
  assert.equal(restartedState.foodEaten, 0);
  assert.equal(restartedState.moveCount, 0);
  assert.equal(restartedState.currentDirection, GAME_CONFIG.startDirection);
  assert.equal(restartedState.snake.length, GAME_CONFIG.initialLength);
  assert.deepEqual(restartedState.snake, [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
});
