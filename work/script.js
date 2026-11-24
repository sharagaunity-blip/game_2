const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const hpDisplay = document.getElementById('hpDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreEl = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Состояние игры
let gameState = 'start'; // 'start' | 'playing' | 'gameover'
let hp = 100;
let score = 0;
let animationId = null;
let lastSpawnTime = 0;
let spawnInterval = 1100; // мс между появлением предметов

// Размеры стола (нижняя деревянная панель из макета)
const tableHeight = 65;

// Объект игрока (серая кружка с паром)
const player = {
  width: 54,
  height: 68,
  x: 0,
  y: 0,
  speed: 8
};

// Управление клавиатурой
const keys = {
  ArrowLeft: false,
  ArrowRight: false
};

// Массив падающих объектов
let items = [];

// Типы падающих предметов (согласно макету Figma)
const itemTypes = [
  { emoji: '🍫', type: 'good', points: 10 },
  { emoji: '🍙', type: 'good', points: 15 },
  { emoji: '🍛', type: 'good', points: 20 },
  { emoji: '💩', type: 'bad', damage: 25 }
];

// Подстройка размера Canvas под экран (ПК и смартфоны 320-430px)
function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  player.y = canvas.height - tableHeight - player.height;
  if (player.x > canvas.width - player.width) {
    player.x = canvas.width - player.width;
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Сброс и старт новой игры без перезагрузки страницы
function startGame() {
  hp = 100;
  score = 0;
  items = [];
  spawnInterval = 1100;
  lastSpawnTime = performance.now();

  resizeCanvas();
  player.x = (canvas.width - player.width) / 2;

  updateHUD();
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  gameState = 'playing';

  if (animationId) cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
}

function updateHUD() {
  hpDisplay.textContent = `${hp} HP`;
  scoreDisplay.textContent = `${score} SCORE`;
}

// Создание нового падающего предмета
function spawnItem() {
  // 35% шанс на плохой предмет, 65% на еду
  const isBad = Math.random() < 0.35;
  const pool = itemTypes.filter(i => (isBad ? i.type === 'bad' : i.type === 'good'));
  const template = pool[Math.floor(Math.random() * pool.length)];

  const size = canvas.width < 430 ? 36 : 44;
  const padding = 20;
  const x = padding + Math.random() * (canvas.width - size - padding * 2);

  // Скорость растет по мере набора очков
  const speedBoost = Math.min(score * 0.015, 4);
  const speed = 2.8 + Math.random() * 1.8 + speedBoost;

  items.push({
    ...template,
    x,
    y: -size,
    size,
    speed
  });
}

// Отрисовка деревянного стола внизу
function drawTable() {
  const tableY = canvas.height - tableHeight;
  ctx.fillStyle = '#9e470d';
  ctx.fillRect(0, tableY, canvas.width, tableHeight);

  // Текстура дерева (линии как в макете)
  ctx.strokeStyle = '#6e2e05';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, tableY);
  ctx.lineTo(canvas.width, tableY);

  for (let i = 15; i < tableHeight; i += 18) {
    ctx.moveTo(0, tableY + i);
    ctx.bezierCurveTo(
      canvas.width * 0.3, tableY + i - 5,
      canvas.width * 0.7, tableY + i + 5,
      canvas.width, tableY + i
    );
  }
  ctx.stroke();
}

// Отрисовка серой кружки с паром (как в прототипе Figma)
function drawMug() {
  const { x, y, width, height } = player;

  // Пар над кружкой
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1.5;
  const timeOffset = Math.sin(performance.now() / 300) * 4;
  for (let i = 0; i < 3; i++) {
    const steamX = x + 16 + i * 11;
    ctx.beginPath();
    ctx.moveTo(steamX, y - 5);
    ctx.quadraticCurveTo(steamX + timeOffset, y - 22, steamX - 3, y - 38);
    ctx.stroke();
  }

  // Ручка кружки справа
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x + width - 2, y + height * 0.52, 13, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Основной корпус кружки
  ctx.fillStyle = '#bdbdbd';
  ctx.strokeStyle = '#444444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, [4, 4, 10, 10]);
  ctx.fill();
  ctx.stroke();

  // Верхний ободок и кофе внутри
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + 4, width / 2, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#6f4e37';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + 4, width / 2 - 4, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Главный игровой цикл
function gameLoop(timestamp) {
  if (gameState !== 'playing') return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Движение с клавиатуры
  if (keys.ArrowLeft) player.x -= player.speed;
  if (keys.ArrowRight) player.x += player.speed;

  // Ограничение движения краями экрана
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Спавн предметов
  if (timestamp - lastSpawnTime > spawnInterval) {
    spawnItem();
    lastSpawnTime = timestamp;
    spawnInterval = Math.max(450, 1100 - score * 2);
  }

  drawTable();
  drawMug();

  // Обновление и отрисовка падающих объектов
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.y += item.speed;

    ctx.font = `${item.size}px Arial`;
    ctx.fillText(item.emoji, item.x + item.size / 2, item.y + item.size / 2);

    // Проверка столкновения с кружкой
    const hitX = item.x + item.size * 0.8 > player.x && item.x + item.size * 0.2 < player.x + player.width;
    const hitY = item.y + item.size * 0.8 > player.y && item.y + item.size * 0.2 < player.y + player.height;

    if (hitX && hitY) {
      if (item.type === 'good') {
        score += item.points;
      } else {
        hp = Math.max(0, hp - item.damage);
      }
      updateHUD();
      items.splice(i, 1);

      if (hp <= 0) {
        endGame();
        return;
      }
      continue;
    }

    // Удаление предмета, упавшего на стол
    if (item.y > canvas.height - tableHeight) {
      items.splice(i, 1);
    }
  }

  animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameState = 'gameover';
  finalScoreEl.textContent = score;
  gameOverScreen.classList.remove('hidden');
}

// --- События управления ---

// Кнопки интерфейса
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Клавиатура (ПК)
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    keys[e.key] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    keys[e.key] = false;
  }
});

// Мышь (ПК)
canvas.addEventListener('mousemove', (e) => {
  if (gameState !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  player.x = Math.max(0, Math.min(canvas.width - player.width, mouseX - player.width / 2));
});

// Сенсорное управление касаниями (Смартфоны 320-430px)
function handleTouch(e) {
  if (gameState !== 'playing') return;
  const touch = e.touches[0];
  if (!touch) return;
  const rect = canvas.getBoundingClientRect();
  const touchX = touch.clientX - rect.left;
  player.x = Math.max(0, Math.min(canvas.width - player.width, touchX - player.width / 2));
}

canvas.addEventListener('touchstart', handleTouch, { passive: true });
canvas.addEventListener('touchmove', handleTouch, { passive: true });
