import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  setDirection,
  spawnFood,
  step
} from "../src/gameLogic.js";

test("snake moves one cell each step", () => {
  const state = createInitialState(8);
  const next = step(state);

  assert.equal(next.snake[0].x, state.snake[0].x + 1);
  assert.equal(next.snake[0].y, state.snake[0].y);
  assert.equal(next.snake.length, state.snake.length);
});

test("snake grows and score increases when food is eaten", () => {
  const state = {
    ...createInitialState(8),
    snake: [{ x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }],
    direction: "right",
    pendingDirection: "right",
    food: { x: 4, y: 3 }
  };

  const next = step(state, () => 0);

  assert.equal(next.score, state.score + 1);
  assert.equal(next.snake.length, state.snake.length + 1);
  assert.notDeepEqual(next.food, state.food);
});

test("reversing direction directly is ignored", () => {
  const state = createInitialState(8);
  const next = setDirection(state, "left");

  assert.equal(next.pendingDirection, "right");
});

test("wall collisions end the game", () => {
  const state = {
    ...createInitialState(4),
    snake: [{ x: 3, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 1 }],
    direction: "right",
    pendingDirection: "right"
  };

  const next = step(state);
  assert.equal(next.isOver, true);
});

test("food never spawns on snake body", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 }
  ];

  const food = spawnFood(4, snake, () => 0);
  assert.equal(snake.some((part) => part.x === food.x && part.y === food.y), false);
});
