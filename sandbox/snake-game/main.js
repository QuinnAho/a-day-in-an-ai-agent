import { GAME_CONFIG } from './src/config.js';
import { attachInput } from './src/input.js';
import { createRenderer } from './src/rendering.js';
import {
  RUN_STATES,
  createInitialState,
  queueDirection,
  restartGame,
  stepState,
} from './src/simulation.js';
import { createUi } from './src/ui.js';

const root = document.querySelector('#game-root');
const overlay = document.querySelector('#overlay');
const overlayEyebrow = document.querySelector('#overlay-eyebrow');
const overlayTitle = document.querySelector('#overlay-title');
const overlayMessage = document.querySelector('#overlay-message');
const scoreValue = document.querySelector('#score-value');
const lengthValue = document.querySelector('#length-value');
const statusValue = document.querySelector('#status-value');

if (
  !root ||
  !overlay ||
  !overlayEyebrow ||
  !overlayTitle ||
  !overlayMessage ||
  !scoreValue ||
  !lengthValue ||
  !statusValue
) {
  throw new Error('Snake Game prototype is missing required DOM nodes.');
}

const randomOptions = { rng: Math.random };
const renderer = createRenderer({ root, config: GAME_CONFIG });
const ui = createUi({
  overlay,
  overlayEyebrow,
  overlayTitle,
  overlayMessage,
  scoreValue,
  lengthValue,
  statusValue,
});

let state = createInitialState(GAME_CONFIG, randomOptions);
let accumulatorMs = 0;
let lastFrameMs = performance.now();
let needsPaint = true;

function paint() {
  renderer.update(state);
  ui.update(state);
  needsPaint = false;
}

function applyState(nextState, { resetAccumulator = false } = {}) {
  if (nextState === state) {
    return;
  }

  state = nextState;
  if (resetAccumulator) {
    accumulatorMs = 0;
  }
  needsPaint = true;
}

attachInput({
  onDirection(direction) {
    const previousStatus = state.status;
    const nextState = queueDirection(state, direction);
    applyState(nextState, {
      resetAccumulator: previousStatus === RUN_STATES.READY && nextState.status === RUN_STATES.RUNNING,
    });
  },
  onRestart() {
    if (state.status !== RUN_STATES.WON && state.status !== RUN_STATES.LOST) {
      return;
    }

    applyState(restartGame(state, randomOptions), { resetAccumulator: true });
  },
});

window.addEventListener('blur', () => {
  accumulatorMs = 0;
});

function frame(nowMs) {
  const deltaMs = Math.min(nowMs - lastFrameMs, 250);
  lastFrameMs = nowMs;

  if (state.status === RUN_STATES.RUNNING) {
    accumulatorMs += deltaMs;

    while (accumulatorMs >= state.tickMs && state.status === RUN_STATES.RUNNING) {
      state = stepState(state, randomOptions);
      accumulatorMs -= state.tickMs;
      needsPaint = true;
    }
  }

  if (needsPaint) {
    paint();
  }

  window.requestAnimationFrame(frame);
}

paint();
window.requestAnimationFrame(frame);
