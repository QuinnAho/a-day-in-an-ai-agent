import { RUN_STATES } from './simulation.js';

const STATUS_LABELS = Object.freeze({
  [RUN_STATES.READY]: 'Ready',
  [RUN_STATES.RUNNING]: 'Running',
  [RUN_STATES.WON]: 'Board Cleared',
  [RUN_STATES.LOST]: 'Game Over',
});

const OVERLAY_CONTENT = Object.freeze({
  [RUN_STATES.READY]: () => ({
    eyebrow: 'Snake 3D',
    title: 'Ready To Run',
    message: 'Press W A S D or the arrow keys to begin. One turn can be buffered between ticks.',
  }),
  [RUN_STATES.WON]: (state) => ({
    eyebrow: 'Victory',
    title: 'Board Cleared',
    message: `Final score ${state.score}. Final length ${state.snake.length}. Press Space, Enter, or R to play again.`,
  }),
  [RUN_STATES.LOST]: (state) => ({
    eyebrow: 'Run Ended',
    title: 'Game Over',
    message: `${
      state.lastOutcome === 'wall' ? 'You hit the arena wall.' : 'You collided with your body.'
    } Final score ${state.score}. Final length ${state.snake.length}. Press Space, Enter, or R to restart.`,
  }),
});

export function createUi({
  overlay,
  overlayEyebrow,
  overlayTitle,
  overlayMessage,
  scoreValue,
  lengthValue,
  statusValue,
}) {
  return {
    update(state) {
      scoreValue.textContent = String(state.score);
      lengthValue.textContent = String(state.snake.length);
      statusValue.textContent = STATUS_LABELS[state.status] ?? state.status;

      if (state.status === RUN_STATES.RUNNING) {
        overlay.classList.add('is-hidden');
        return;
      }

      const contentFactory = OVERLAY_CONTENT[state.status] ?? OVERLAY_CONTENT[RUN_STATES.READY];
      const content = contentFactory(state);
      overlayEyebrow.textContent = content.eyebrow;
      overlayTitle.textContent = content.title;
      overlayMessage.textContent = content.message;
      overlay.classList.remove('is-hidden');
    },
  };
}
