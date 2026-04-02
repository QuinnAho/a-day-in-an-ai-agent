function createLayerElement(className) {
  const element = document.createElement('div');
  element.className = className;
  return element;
}

function createSegmentElement() {
  const segment = document.createElement('div');
  segment.className = 'segment';
  return segment;
}

function positionCell(element, cell, state, insetPercent) {
  const cellWidth = 100 / state.width;
  const cellHeight = 100 / state.height;
  const insetX = cellWidth * insetPercent;
  const insetY = cellHeight * insetPercent;

  element.style.left = `${cell.x * cellWidth + insetX}%`;
  element.style.top = `${cell.y * cellHeight + insetY}%`;
  element.style.width = `${cellWidth - insetX * 2}%`;
  element.style.height = `${cellHeight - insetY * 2}%`;
}

export function createRenderer({ root, config }) {
  const scene = createLayerElement('board-scene');
  const shadow = createLayerElement('board-shadow');
  const plane = createLayerElement('board-plane');
  const frame = createLayerElement('board-frame');
  const segmentLayer = createLayerElement('segment-layer');
  const foodLayer = createLayerElement('food-layer');
  const food = createLayerElement('food');
  const segmentElements = [];

  food.hidden = true;
  foodLayer.append(food);
  scene.append(shadow, plane, segmentLayer, foodLayer, frame);
  root.replaceChildren(scene);

  function ensureSegmentPool(length) {
    while (segmentElements.length < length) {
      const segment = createSegmentElement();
      segmentLayer.append(segment);
      segmentElements.push(segment);
    }

    for (let index = 0; index < segmentElements.length; index += 1) {
      const segment = segmentElements[index];
      segment.hidden = index >= length;
      segment.classList.toggle('is-head', index === 0);
    }
  }

  return {
    update(state) {
      root.style.setProperty('--board-width', String(state.width));
      root.style.setProperty('--board-height', String(state.height));
      ensureSegmentPool(state.snake.length);

      for (let index = 0; index < state.snake.length; index += 1) {
        positionCell(segmentElements[index], state.snake[index], state, config.visuals.boardPaddingPercent / 100);
      }

      if (state.food) {
        positionCell(food, state.food, state, config.visuals.boardPaddingPercent / 100);
        food.hidden = false;
      } else {
        food.hidden = true;
      }
    },
  };
}
