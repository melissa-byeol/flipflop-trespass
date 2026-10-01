// --- ESTADO DEL JUEGO ---
const gameState = {
  currentLevel: 0,
  player: { 
    x: 0, 
    y: 2, 
    color: '#facc15'
  },
  currentSide: 'blue',
  keys: { blue: false, red: false, yellow: false },
  starsCollected: 0,
  totalStars: 2,
  hasBracelet: false
};

const DIR_MAP = {
  up: 'top',
  down: 'bottom',
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right'
};

// --- CONFIGURACIÓN DE NIVELES ---
const levels = [
  // NIVEL 1
  {
    hasBracelet: false,
    totalStars: 2,
    blueMap: {
      grid: [
        [{ item: null },       { item: 'FLIP' },     { item: 'STAR' }],
        [{ item: null },       { item: 'KEY_BLUE' }, { item: null }],
        [{ item: 'SPAWN' },    { item: 'STAR' },     { item: null }]
      ],
      borders: [
        { x: 1, y: 0, dir: 'right', type: 'wall' },
        { x: 1, y: 1, dir: 'right', type: 'wall' },
        { x: 2, y: 1, dir: 'right', type: 'door-red' }, // Pasillo / Puerta de salida al Nivel 2
        { x: 1, y: 2, dir: 'right', type: 'door-blue' },
        { x: 1, y: 2, dir: 'top', type: 'wall' },
        { x: 1, y: 2, dir: 'left', type: 'wall' }
      ]
    },
    redMap: {
      grid: [
        [{ item: null }, { item: null },       { item: 'FLIP' }],
        [{ item: null }, { item: null },       { item: null }],
        [{ item: null }, { item: 'KEY_RED' },  { item: null }]
      ],
      borders: [
        { x: 1, y: 1, dir: 'right', type: 'wall' },
        { x: 1, y: 1, dir: 'left', type: 'wall' },
        { x: 1, y: 1, dir: 'top', type: 'wall' },
        { x: 1, y: 1, dir: 'bottom', type: 'door-blue' }
      ]
    }
  },

  // NIVEL 2
  {
    hasBracelet: true,
    totalStars: 3,
    blueMap: {
      grid: [
        [{ item: 'SPAWN' },    { item: null },       { item: 'STAR' }],
        [{ item: null },       { item: 'KEY_BLUE' }, { item: null }],
        [{ item: 'STAR' },     { item: null },       { item: 'KEY_YELLOW' }]
      ],
      borders: [
        { x: 0, y: 0, dir: 'right', type: 'wall' },
        { x: 1, y: 1, dir: 'bottom', type: 'door-blue' },
        { x: 2, y: 1, dir: 'left', type: 'door-yellow' }
      ]
    },
    redMap: {
      grid: [
        [{ item: null },       { item: 'STAR' },     { item: null }],
        [{ item: 'KEY_RED' },  { item: null },       { item: null }],
        [{ item: null },       { item: null },       { item: null }]
      ],
      borders: [
        { x: 1, y: 0, dir: 'bottom', type: 'wall' },
        { x: 2, y: 0, dir: 'left', type: 'wall' },
        { x: 0, y: 1, dir: 'right', type: 'door-red' }
      ]
    }
  }
];

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
      if (item === 'FLIP') {
        cell.innerText = '🔄';
      } else if (item === 'KEY_BLUE') {
        cell.innerHTML = '<img src="assets/blue-key.png" class="item-icon" alt="Llave Azul">';
      } else if (item === 'KEY_RED') {
        cell.innerHTML = '<img src="assets/red-key.png" class="item-icon" alt="Llave Roja">';
      } else if (item === 'KEY_YELLOW') {
        cell.innerHTML = '<img src="assets/yellow-key.png" class="item-icon" alt="Llave Amarilla">';
      } else if (item === 'STAR') {
        cell.innerText = '⭐';
      } else if (item === 'SPAWN') {
        cell.innerText = '🚩';
      }

      container.appendChild(cell);
    }
  }

  // Aplicar Bordes
  config.borders.forEach(b => {
    const selector = `#${containerId} .cell[data-x="${b.x}"][data-y="${b.y}"]`;
    const cell = document.querySelector(selector);
    const cssDir = DIR_MAP[b.dir] || b.dir;
    if (cell && b.type) cell.classList.add(`border-${b.type}-${cssDir}`);
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
    token.style.setProperty('--player-color', gameState.player.color);
  }
}

function selectPlayerColor(colorHex, buttonElement) {
  gameState.player.color = colorHex;
  
  const token = document.getElementById('player-token');
  if (token) {
    token.style.setProperty('--player-color', colorHex);
  }

  const buttons = document.querySelectorAll('.color-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  if (buttonElement) {
    buttonElement.classList.add('active');
  }
}

// --- LÓGICA DE MOVIMIENTO Y COLISIONES CORREGIDA ---
function movePlayer(dx, dy) {
  const currentX = gameState.player.x;
  const currentY = gameState.player.y;
  const targetX = currentX + dx;
  const targetY = currentY + dy;

  const currentLevelData = levels[gameState.currentLevel];
  const currentConfig = gameState.currentSide === 'blue' ? currentLevelData.blueMap : currentLevelData.redMap;

  const dirOut = dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'bottom' : 'top';
  const dirIn  = dx === 1 ? 'left'  : dx === -1 ? 'right': dy === 1 ? 'top'    : 'bottom';

  let blocked = false;
  let exitToNextLevel = false;

  // Verificar si hay una puerta o pared en la casilla actual hacia la dirección de movimiento
  currentConfig.borders.forEach(b => {
    const bDir = DIR_MAP[b.dir] || b.dir;

    const isExitBorder = (b.x === currentX && b.y === currentY && bDir === dirOut);
    const isEntryBorder = (b.x === targetX && b.y === targetY && bDir === dirIn);

    if (isExitBorder || isEntryBorder) {
      if (b.type === 'wall') {
        blocked = true;
      } else if (b.type === 'door-blue') {
        if (!gameState.keys.blue) {
          blocked = true;
          showMessage('🚪 Necesitas la Llave Azul para pasar por aquí.');
        } else {
          b.type = 'unlocked';
          showMessage('🔓 Abriste la puerta azul.');
        }
      } else if (b.type === 'door-red') {
        if (!gameState.keys.red) {
          blocked = true;
          showMessage('🚪 Necesitas la Llave Roja para abrir el pasillo.');
        } else {
          b.type = 'unlocked';
          if (gameState.currentLevel === 0) {
            exitToNextLevel = true; // Permite el paso y activa la transición
          } else {
            showMessage('🔓 Abriste la puerta roja.');
          }
        }
      } else if (b.type === 'door-yellow') {
        if (!gameState.keys.yellow) {
          blocked = true;
          showMessage('🚪 Necesitas la Llave Amarilla para pasar por aquí.');
        } else {
          b.type = 'unlocked';
          showMessage('🔓 Abriste la puerta amarilla.');
        }
      }
    }
  });

  if (blocked) return;

  // Transición especial al Nivel 2 al salir por la Puerta Roja en el borde del Nivel 1
  if (exitToNextLevel) {
    showMessage('🚪 ¡Puerta Roja abierta! Entrando al pasillo hacia el Nivel 2...');
    setTimeout(() => {
      loadLevel(1);
    }, 500);
    return;
  }

  // Verificar límites del mapa normal
  if (targetX < 0 || targetX > 2 || targetY < 0 || targetY > 2) return;

  gameState.player.x = targetX;
  gameState.player.y = targetY;
  updatePlayerPosition();
  checkCellInteractions();
}

function checkCellInteractions() {
  const currentLevelData = levels[gameState.currentLevel];
  const sideConfig = gameState.currentSide === 'blue' ? currentLevelData.blueMap : currentLevelData.redMap;
  const cellData = sideConfig.grid[gameState.player.y][gameState.player.x];

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
  } else if (cellData.item === 'KEY_YELLOW') {
    gameState.keys.yellow = true;
    cellData.item = null;
    document.getElementById('badge-yellow').classList.add('acquired');
    showMessage('🔑 ¡Conseguiste la Llave Amarilla!');
  } else if (cellData.item === 'STAR') {
    gameState.starsCollected++;
    cellData.item = null;
    document.getElementById('badge-stars').innerText = `⭐ ${gameState.starsCollected}/${gameState.totalStars}`;
    showMessage('⭐ ¡Recogiste una estrella!');
    
    if (gameState.starsCollected === gameState.totalStars) {
      showMessage('🎉 ¡FELICIDADES! ¡Recolectaste todas las estrellas de este nivel!');
    }
  } else if (cellData.item === 'FLIP') {
    showMessage('🔄 Estás sobre una máquina Flip-Flop. Presiona ESPACIO o 🔄 para cambiar de dimensión.');
  }

  renderGrid(`${gameState.currentSide}-grid`, sideConfig);
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

function tryFlip() {
  const currentLevelData = levels[gameState.currentLevel];
  const currentConfig = gameState.currentSide === 'blue' ? currentLevelData.blueMap : currentLevelData.redMap;
  const currentItem = currentConfig.grid[gameState.player.y][gameState.player.x].item;

  if (gameState.hasBracelet || currentItem === 'FLIP') {
    triggerFlip();
  } else {
    showMessage('⚠️ Debes estar sobre una máquina 🔄 o activar el Brazalete Flip.');
  }
}

function triggerFlipManual() {
  tryFlip();
}

function showMessage(msg) {
  document.getElementById('message').innerText = msg;
}

function loadLevel(levelIndex) {
  if (levelIndex >= levels.length) {
    showMessage('🎉 ¡FELICIDADES! Has completado todos los niveles del juego.');
    return;
  }

  gameState.currentLevel = levelIndex;
  const levelData = levels[levelIndex];

  gameState.hasBracelet = levelData.hasBracelet;
  gameState.totalStars = levelData.totalStars;
  gameState.starsCollected = 0;
  gameState.keys = { blue: false, red: false, yellow: false };
  gameState.currentSide = 'blue';

  let spawnFound = false;
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      if (levelData.blueMap.grid[y][x].item === 'SPAWN') {
        gameState.player.x = x;
        gameState.player.y = y;
        spawnFound = true;
        break;
      }
    }
    if (spawnFound) break;
  }

  document.getElementById('badge-blue').classList.remove('acquired');
  document.getElementById('badge-red').classList.remove('acquired');
  document.getElementById('badge-yellow').classList.remove('acquired');
  document.getElementById('badge-stars').innerText = `⭐ 0/${gameState.totalStars}`;

  const card = document.getElementById('card');
  card.classList.remove('flipped');

  renderGrid('blue-grid', levelData.blueMap);
  renderGrid('red-grid', levelData.redMap);
  updatePlayerPosition();

  const modeText = gameState.hasBracelet 
    ? '⌚ ¡Brazalete Equipado! Presiona ESPACIO en cualquier casilla.' 
    : '🔄 Usa las máquinas Flip-Flop para cambiar de dimensión.';

  showMessage(`🚪 ¡Nivel ${levelIndex + 1} cargado! ${modeText}`);
}

window.addEventListener('keydown', (e) => {
  switch (e.key.toLowerCase()) {
    case 'w': case 'arrowup': movePlayer(0, -1); break;
    case 's': case 'arrowdown': movePlayer(0, 1); break;
    case 'a': case 'arrowleft': movePlayer(-1, 0); break;
    case 'd': case 'arrowright': movePlayer(1, 0); break;
    case ' ':
      e.preventDefault();
      tryFlip();
      break;
  }
});

window.addEventListener('resize', updatePlayerPosition);

createPlayerToken();
loadLevel(0);
