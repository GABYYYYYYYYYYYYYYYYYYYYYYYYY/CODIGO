export const GRID_SIZE = 16;

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OPPOSITE = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

export function createInitialState(size = GRID_SIZE) {
  const center = Math.floor(size / 2);
  const snake = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center }
  ];

  return {
    size,
    snake,
    direction: "right",
    pendingDirection: "right",
    food: spawnFood(size, snake),
    score: 0,
    isOver: false,
    isPaused: false
  };
}

export function setDirection(state, nextDirection) {
  if (!DIRECTIONS[nextDirection] || state.isOver || state.isPaused) {
    return state;
  }

  if (OPPOSITE[state.direction] === nextDirection) {
    return state;
  }

  return {
    ...state,
    pendingDirection: nextDirection
  };
}

export function togglePause(state) {
  if (state.isOver) {
    return state;
  }

  return {
    ...state,
    isPaused: !state.isPaused
  };
}

export function step(state, randomFn = Math.random) {
  if (state.isOver || state.isPaused) {
    return state;
  }

  const direction = state.pendingDirection;
  const head = state.snake[0];
  const delta = DIRECTIONS[direction];
  const nextHead = {
    x: head.x + delta.x,
    y: head.y + delta.y
  };

  if (isOutOfBounds(nextHead, state.size) || hitsSnake(nextHead, state.snake)) {
    return {
      ...state,
      isOver: true,
      direction
    };
  }

  const ateFood = nextHead.x === state.food.x && nextHead.y === state.food.y;
  const nextSnake = [nextHead, ...state.snake];

  if (!ateFood) {
    nextSnake.pop();
  }

  return {
    ...state,
    direction,
    snake: nextSnake,
    food: ateFood ? spawnFood(state.size, nextSnake, randomFn) : state.food,
    score: ateFood ? state.score + 1 : state.score
  };
}

export function spawnFood(size, snake, randomFn = Math.random) {
  const occupied = new Set(snake.map((part) => `${part.x},${part.y}`));
  const available = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        available.push({ x, y });
      }
    }
  }

  if (available.length === 0) {
    return snake[0];
  }

  const index = Math.floor(randomFn() * available.length);
  return available[index];
}

function isOutOfBounds(point, size) {
  return point.x < 0 || point.y < 0 || point.x >= size || point.y >= size;
}

function hitsSnake(head, snake) {
  return snake.some((part) => part.x === head.x && part.y === head.y);
}
