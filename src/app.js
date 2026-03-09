import { createInitialState, setDirection, step, togglePause } from "./gameLogic.js";

const TICK_MS = 140;
const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const pauseEl = document.getElementById("pause");
const restartEl = document.getElementById("restart");
const controlsEl = document.querySelector(".controls");

let state = createInitialState();

function render() {
  const size = state.size;
  boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  boardEl.innerHTML = "";

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (state.food.x === x && state.food.y === y) {
        cell.classList.add("food");
      }

      if (state.snake.some((part) => part.x === x && part.y === y)) {
        cell.classList.add("snake");
      }

      if (state.snake[0].x === x && state.snake[0].y === y) {
        cell.classList.add("head");
      }

      boardEl.appendChild(cell);
    }
  }

  scoreEl.textContent = String(state.score);

  if (state.isOver) {
    statusEl.textContent = "Game over. Press restart to play again.";
  } else if (state.isPaused) {
    statusEl.textContent = "Paused. Press pause again to continue.";
  } else {
    statusEl.textContent = "Use arrow keys or WASD to move.";
  }
}

function tick() {
  state = step(state);
  render();
}

const timer = setInterval(tick, TICK_MS);

window.addEventListener("beforeunload", () => {
  clearInterval(timer);
});

document.addEventListener("keydown", (event) => {
  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right"
  };

  const mapped = keyMap[event.key];
  if (mapped) {
    event.preventDefault();
    state = setDirection(state, mapped);
  }

  if (event.key === " ") {
    event.preventDefault();
    state = togglePause(state);
    render();
  }
});

controlsEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-dir]");
  if (!button) {
    return;
  }

  state = setDirection(state, button.dataset.dir);
});

pauseEl.addEventListener("click", () => {
  state = togglePause(state);
  render();
});

restartEl.addEventListener("click", () => {
  state = createInitialState(state.size);
  render();
});

render();
