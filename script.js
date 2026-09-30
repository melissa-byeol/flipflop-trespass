// --- ESTADO DEL JUEGO ---
const gameState = {
  player: { x: 0, y: 2 },
  currentSide: 'blue', // 'blue' o 'red'
  keys: { blue: false, red: false },
  starsCollected: 0,
  totalStars: 3
};

// Mapeo de direcciones estandarizadas para CSS
const DIR_MAP = {
  up: 'top',
  down: 'bottom',
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right'
};

// --- CONFIGURACIÓN DE LOS MAPAS ---
const blueMapConfig = {
  grid: [
    [{ item: null },       { item: 'FLIP' },     { item: 'STAR' }], // Fila 0
    [{ item: null },       { item: 'KEY_BLUE' }, { item: null }],   // Fila 1
    [{ item: 'SPAWN' },    { item: 'STAR' },     { item: null }]    // Fila 2
  ],
  borders: [
    { x: 1, y: 0, dir: 'right', type: 'wall' },
    { x: 1, y: 1, dir: 'right', type: 'wall'},
    { x: 2, y: 1, dir: 'right', type: 'door-red' },
    { x: 1, y: 2, dir: 'right', type: 'door-blue' },
    { x: 1, y: 2, dir: 'top', type: 'wall' },
    { x: 1, y: 2, dir: 'left', type: 'wall' }
  ]
};

const redMapConfig = {
  grid: [
    [{ item: null }, { item: null },       { item: 'FLIP' }],   // Fila 0
    [{ item: null }, { item: 'STAR' },     { item: null }],     // Fila 1
    [{ item: null }, { item: 'KEY_RED' },  { item: null }]      // Fila 2
  ],
  borders: [
    { x: 1, y: 1, dir: 'right', type: 'wall' },
    { x: 1, y: 1, dir: 'left', type: 'wall' },
    { x: 1, y: 1, dir: 'top', type: 'wall' },
    { x: 1, y: 1, dir: 'bottom', type: 'door-blue' }
  ]
};

// --- RENDERIZADO DEL MAPA ---
function renderGrid(containerId, config) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;

      const item = config.grid[y][x].item;
      if (item === 'FLIP') cell.innerText = '🔄';
      else if (item === 'KEY_BLUE') cell.innerText = '🔑';
      else if (item === 'KEY_RED') cell.innerText = '🔑';
      else if (item === 'STAR') cell.innerText = '⭐';
      else if (item === 'SPAWN') cell.innerText = '🚩';

      container.appendChild(cell);
    }
  }

  // Aplicar Bordes con direcciones estandarizadas
  config.borders.forEach(b => {
    const selector = `#${containerId} .cell[data-x="${b.x}"][data-y="${b.y}"]`;
    const cell = document.querySelector(selector);
    const cssDir = DIR_MAP[b.dir] || b.dir;
    if (cell) cell.classList.add(`border-${b.type}-${cssDir}`);
  });
}

function createPlayerToken() {
  const token = document.createElement('div');
  token.className = 'player';
  token.id = 'player-token';
  document.body.appendChild(token);
  updatePlayerPosition();
}

function updatePlayerPosition() {
  const side = gameState.currentSide;
  const cell = document.querySelector(`#${side}-grid .cell[data-x="${gameState.player.x}"][data-y="${gameState.player.y}"]`);
  const token = document.getElementById('player-token');

  if (cell && token) {
    const rect = cell.getBoundingClientRect();
    token.style.left = `${rect.left + rect.width / 2 - 16}px`;
    token.style.top = `${rect.top + rect.height / 2 - 16}px`;
  }
}

// --- LÓGICA DE MOVIMIENTO Y COLISIONES ---
function movePlayer(dx, dy) {
  const currentX = gameState.player.x;
  const currentY = gameState.player.y;
  const targetX = currentX + dx;
  const targetY = currentY + dy;

  if (targetX < 0 || targetX > 2 || targetY < 0 || targetY > 2) return;

  const currentConfig = gameState.currentSide === 'blue' ? blueMapConfig : redMapConfig;

  // Direcciones de salida (origen) y entrada (destino)
  const dirOut = dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'bottom' : 'top';
  const dirIn  = dx === 1 ? 'left'  : dx === -1 ? 'right': dy === 1 ? 'top'    : 'bottom';

  let blocked = false;

  currentConfig.borders.forEach(b => {
    const bDir = DIR_MAP[b.dir] || b.dir;

    // Validación bidireccional
    const isExitBorder = (b.x === currentX && b.y === currentY && bDir === dirOut);
    const isEntryBorder = (b.x === targetX && b.y === targetY && bDir === dirIn);

    if (isExitBorder || isEntryBorder) {
      if (b.type === 'wall') blocked = true;
      if (b.type === 'door-blue' && !gameState.keys.blue) {
        blocked = true;
        showMessage('🚪 Necesitas la Llave Azul para pasar por aquí.');
      }
      if (b.type === 'door-red' && !gameState.keys.red) {
        blocked = true;
        showMessage('🚪 Necesitas la Llave Roja para pasar por aquí.');
      }
    }
  });

  if (blocked) return;

  // Actualizar posición
  gameState.player.x = targetX;
  gameState.player.y = targetY;
  updatePlayerPosition();
  checkCellInteractions();
}

function checkCellInteractions() {
  const side = gameState.currentSide;
  const config = side === 'blue' ? blueMapConfig : redMapConfig;
  const cellData = config.grid[gameState.player.y][gameState.player.x];

  if (!cellData.item) return;

  if (cellData.item === 'KEY_BLUE') {
    gameState.keys.blue = true;
    cellData.item = null;
    document.getElementById('badge-blue').classList.add('acquired');
    showMessage('🔑 ¡Conseguiste la Llave Azul!');
  } else if (cellData.item === 'KEY_RED') {
    gameState.keys.red = true;
    cellData.item = null;
    document.getElementById('badge-red').classList.add('acquired');
    showMessage('🔑 ¡Conseguiste la Llave Roja!');
  } else if (cellData.item === 'STAR') {
    gameState.starsCollected++;
    cellData.item = null;
    document.getElementById('badge-stars').innerText = `⭐ ${gameState.starsCollected}/${gameState.totalStars}`;
    showMessage('⭐ ¡Recogiste una estrella!');
    if (gameState.starsCollected === gameState.totalStars) {
      showMessage('🎉 ¡FELICIDADES! ¡Has recolectado todas las estrellas y escapado!');
    }
  } else if (cellData.item === 'FLIP') {
    triggerFlip();
  }

  renderGrid(`${side}-grid`, config);
}

function triggerFlip() {
  const card = document.getElementById('card');
  const newSide = gameState.currentSide === 'blue' ? 'red' : 'blue';

  gameState.currentSide = newSide;
  card.classList.toggle('flipped');

  const indicator = document.getElementById('map-indicator');
  indicator.innerText = newSide.toUpperCase();
  indicator.style.color = newSide === 'blue' ? 'var(--accent-blue)' : 'var(--accent-red)';

  showMessage(`🔄 ¡FLIP! Ahora estás en el Mapa ${newSide.toUpperCase()}`);
  setTimeout(updatePlayerPosition, 300);
}

function triggerFlipManual() {
  const config = gameState.currentSide === 'blue' ? blueMapConfig : redMapConfig;
  const currentItem = config.grid[gameState.player.y][gameState.player.x].item;

  if (currentItem === 'FLIP') {
    triggerFlip();
  } else {
    showMessage('⚠️ Debes estar sobre una casilla 🔄 para cambiar de dimensión.');
  }
}

function showMessage(msg) {
  document.getElementById('message').innerText = msg;
}

// --- CONTROLES TECLADO ---
window.addEventListener('keydown', (e) => {
  switch (e.key.toLowerCase()) {
    case 'w': case 'arrowup': movePlayer(0, -1); break;
    case 's': case 'arrowdown': movePlayer(0, 1); break;
    case 'a': case 'arrowleft': movePlayer(-1, 0); break;
    case 'd': case 'arrowright': movePlayer(1, 0); break;
  }
});

window.addEventListener('resize', updatePlayerPosition);

// --- INICIALIZACIÓN ---
renderGrid('blue-grid', blueMapConfig);
renderGrid('red-grid', redMapConfig);
createPlayerToken();
