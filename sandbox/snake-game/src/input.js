const KEY_TO_DIRECTION = Object.freeze({
  ArrowUp: 'north',
  ArrowRight: 'east',
  ArrowDown: 'south',
  ArrowLeft: 'west',
  w: 'north',
  W: 'north',
  d: 'east',
  D: 'east',
  s: 'south',
  S: 'south',
  a: 'west',
  A: 'west',
});

const RESTART_KEYS = new Set([' ', 'Spacebar', 'Enter', 'r', 'R']);

export function attachInput({ onDirection, onRestart, target = window }) {
  function handleKeyDown(event) {
    const direction = KEY_TO_DIRECTION[event.key];

    if (direction) {
      event.preventDefault();
      onDirection(direction);
      return;
    }

    if (RESTART_KEYS.has(event.key)) {
      event.preventDefault();
      onRestart();
    }
  }

  target.addEventListener('keydown', handleKeyDown);

  return () => {
    target.removeEventListener('keydown', handleKeyDown);
  };
}
