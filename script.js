// --- ESTADO DEL JUEGO ---
const gameState = {
  mode: 'keys', // 'keys' o 'colorscape'
  currentLevel: 0,
  player: { 
    x: 0, 
    y: 2, 
    hexColor: '#facc15',
    colorName: 'yellow'
  },
  currentSide: 'blue',
  keys: { blue: false, red: false, yellow: false },
  starsCollected: 0,
  totalStars: 2,
  hasBracelet: false
};

const DIR_MAP = {
  up: 'top', down: 'bottom', top: 'top', bottom: 'bottom', left: 'left', right: 'right'
};

const COLOR_LABELS = { yellow: 'AMARILLO', blue: 'AZUL', red: 'ROJO' };

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
        { x: 2, y: 1, dir: 'right', type: 'door-red' },
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
        { x: 1, y: 1, dir: 'bottom', type: 'door-yellow' }
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

// --- CAMBIO DE MODO DE JUEGO ---
function switchGameMode(newMode) {
  gameState.mode = newMode;

  document.getElementById('btn-mode-keys').classList.toggle('active', newMode === 'keys');
  document.getElementById('btn-mode-colorscape').classList.toggle('active', newMode === 'colorscape');

  const invKeys = document.getElementById('inventory-keys');
  const invColors = document.getElementById('inventory-colorscape');
  const colorLabel = document.getElementById('color-picker-label');

  if (newMode === 'keys') {
    invKeys.classList.remove('hidden');
    invColors.classList.add('hidden');
    colorLabel.innerText = 'Color de Ficha:';
  } else {
    invKeys.classList.add('hidden');
    invColors.classList.remove('hidden');
    colorLabel.innerText = 'Pasaporte / Color:';
  }

  loadLevel(0);
}

// --- RENDERIZADO ---
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
      } else if (item === 'STAR') {
        cell.innerText = '⭐';
      } else if (item === 'SPAWN') {
        cell.innerText = '🚩';
      } else if (gameState.mode === 'keys') {
        // En modo Colorscape ocultamos visualmente las llaves del mapa
        if (item === 'KEY_BLUE') cell.innerHTML = '<img src="assets/blue-key.png" class="item-icon" alt="Llave Azul">';
        if (item === 'KEY_RED') cell.innerHTML = '<img src="assets/red-key.png" class="item-icon" alt="Llave Roja">';
        if (item === 'KEY_YELLOW') cell.innerHTML = '<img src="assets/yellow-key.png" class="item-icon" alt="Llave Amarilla">';
      }

      container.appendChild(cell);
    }
  }

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
    token.style.setProperty('--player-color', gameState.player.hexColor);
  }
}

function selectPlayerColor(colorHex, colorName, buttonElement) {
  gameState.player.hexColor = colorHex;
  gameState.player.colorName = colorName;
  
  const token = document.getElementById('player-token');
  if (token) token.style.setProperty('--player-color', colorHex);

  const indicator = document.getElementById('color-indicator');
  if (indicator) {
    indicator.innerText = COLOR_LABELS[colorName];
    indicator.style.color = colorHex;
  }

  const buttons = document.querySelectorAll('.color-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  if (buttonElement) buttonElement.classList.add('active');

  if (gameState.mode === 'colorscape') {
    showMessage(`🎨 Cambiaste a fase ${COLOR_LABELS[colorName]}. Ahora solo puedes pasar por puertas de este color.`);
  } else {
    showMessage(`🎨 Cambiaste la estética de tu ficha.`);
  }
}

// --- MOVIMIENTO ---
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

  currentConfig.borders.forEach(b => {
    const bDir = DIR_MAP[b.dir] || b.dir;
    const isExitBorder = (b.x === currentX && b.y === currentY && bDir === dirOut);
    const isEntryBorder = (b.x === targetX && b.y === targetY && bDir === dirIn);

    if (isExitBorder || isEntryBorder) {
      if (b.type === 'wall') {
        blocked = true;
      } else if (gameState.mode === 'keys') {
        // LÓGICA MODO LLAVES
        if (b.type === 'door-blue') {
          if (!gameState.keys.blue) { blocked = true; showMessage('🚪 Necesitas la Llave Azul.'); } 
          else { b.type = 'unlocked'; showMessage('🔓 Abriste la puerta azul.'); }
        } else if (b.type === 'door-red') {
          if (!gameState.keys.red) { blocked = true; showMessage('🚪 Necesitas la Llave Roja.'); } 
          else { 
            b.type = 'unlocked'; 
            if (gameState.currentLevel === 0) exitToNextLevel = true; 
            else showMessage('🔓 Abriste la puerta roja.');
          }
        } else if (b.type === 'door-yellow') {
          if (!gameState.keys.yellow) { blocked = true; showMessage('🚪 Necesitas la Llave Amarilla.'); } 
          else { b.type = 'unlocked'; showMessage('🔓 Abriste la puerta amarilla.'); }
        }
      } else if (gameState.mode === 'colorscape') {
        // LÓGICA MODO COLORSCAPE
        if (b.type === 'door-blue' && gameState.player.colorName !== 'blue') {
          blocked = true; showMessage('⛔ Puerta AZUL: Cambia a ficha Azul para cruzar.');
        } else if (b.type === 'door-red' && gameState.player.colorName !== 'red') {
          blocked = true; showMessage('⛔ Puerta ROJA: Cambia a ficha Roja para cruzar.');
        } else if (b.type === 'door-red' && gameState.player.colorName === 'red' && gameState.currentLevel === 0) {
          exitToNextLevel = true;
        } else if (b.type === 'door-yellow' && gameState.player.colorName !== 'yellow') {
          blocked = true; showMessage('⛔ Puerta AMARILLA: Cambia a ficha Amarilla para cruzar.');
        }
      }
    }
  });

  if (blocked) return;

  if (exitToNextLevel) {
    showMessage('🚪 ¡Puerta completada! Entrando al Nivel 2...');
    setTimeout(() => { loadLevel(1); }, 500);
    return;
  }

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

  if (gameState.mode === 'keys') {
    if (cellData.item === 'KEY_BLUE') {
      gameState.keys.blue = true; cellData.item = null;
      document.getElementById('badge-blue').classList.add('acquired');
      showMessage('🔑 ¡Conseguiste la Llave Azul!');
    } else if (cellData.item === 'KEY_RED') {
      gameState.keys.red = true; cellData.item = null;
      document.getElementById('badge-red').classList.add('acquired');
      showMessage('🔑 ¡Conseguiste la Llave Roja!');
    } else if (cellData.item === 'KEY_YELLOW') {
      gameState.keys.yellow = true; cellData.item = null;
      document.getElementById('badge-yellow').classList.add('acquired');
      showMessage('🔑 ¡Conseguiste la Llave Amarilla!');
    }
  }

  if (cellData.item === 'STAR') {
    gameState.starsCollected++;
    cellData.item = null;
    const starLabel = gameState.mode === 'keys' ? 'badge-stars-keys' : 'badge-stars-colors';
    document.getElementById(starLabel).innerText = `⭐ ${gameState.starsCollected}/${gameState.totalStars}`;
    showMessage('⭐ ¡Recogiste una estrella!');
  } else if (cellData.item === 'FLIP') {
    showMessage('🔄 Máquina Flip-Flop. Presiona ESPACIO o 🔄 para voltear el mapa.');
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

function triggerFlipManual() { tryFlip(); }

function showMessage(msg) {
  document.getElementById('message').innerText = msg;
}

function loadLevel(levelIndex) {
  if (levelIndex >= levels.length) {
    showMessage('🎉 ¡FELICIDADES! Has completado el modo actual.');
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
  
  document.getElementById('badge-stars-keys').innerText = `⭐ 0/${gameState.totalStars}`;
  document.getElementById('badge-stars-colors').innerText = `⭐ 0/${gameState.totalStars}`;

  const card = document.getElementById('card');
  card.classList.remove('flipped');

  renderGrid('blue-grid', levelData.blueMap);
  renderGrid('red-grid', levelData.redMap);
  updatePlayerPosition();

  const modeName = gameState.mode === 'keys' ? 'Modo Llaves' : 'Colorscape';
  showMessage(`🚪 Carga completada: ${modeName} - Nivel ${levelIndex + 1}.`);
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
switchGameMode('keys');
