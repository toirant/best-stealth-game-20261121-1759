// input.js — keyboard and mouse, kept in one place so the game loop never
// touches the DOM directly. WASD or arrows move, Shift sneaks, click tosses a coin.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    // The last place the player clicked inside the canvas, in canvas pixels,
    // or null once the game has consumed it.
    click: null,
    // True on the frame a key is first pressed (used for menus).
    pressed: new Set(),
  };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    if (!e.repeat) state.pressed.add(e.key.toLowerCase());
    keys.add(e.key.toLowerCase());
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    state.click = {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
    };
  });

  return state;
}

// moveVector reads the held keys into a unit direction and whether to sneak.
export function moveVector(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('a') || input.keys.has('arrowleft')) x -= 1;
  if (input.keys.has('d') || input.keys.has('arrowright')) x += 1;
  if (input.keys.has('w') || input.keys.has('arrowup')) y -= 1;
  if (input.keys.has('s') || input.keys.has('arrowdown')) y += 1;
  const len = Math.hypot(x, y);
  if (len > 0) { x /= len; y /= len; }
  return { x, y, sneak: input.keys.has('shift') };
}

export function wasPressed(input, key) {
  return input.pressed.has(key.toLowerCase());
}

export function endFrame(input) {
  input.pressed.clear();
}
