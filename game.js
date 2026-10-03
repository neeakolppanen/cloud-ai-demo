// Game state & DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreText = document.getElementById('scoreText');
const finalScoreText = document.getElementById('finalScoreText');

// Colors for falling balls
const BALL_COLORS = [
    '#ff007f', '#00f5d4', '#ffe600', '#7b2cbf',
    '#ff5722', '#00e676', '#3f51b5', '#e91e63'
];

let animationFrameId = null;
let isGameRunning = false;
let score = 0;
let lastSpawnTime = 0;
let baseSpawnInterval = 600; // milliseconds
let minSpawnInterval = 150;
let baseBallSpeed = 2.5;
let maxBallSpeed = 8;
let gameTime = 0;

// Player definition
const player = {
    width: 40,
    height: 40,
    x: canvas.width / 2 - 20,
    y: canvas.height - 50,
    speed: 7,
    color: '#00f5d4',
    dx: 0
};

// Key controls tracking
const keys = {
    ArrowLeft: false,
    ArrowRight: false
};

// Balls array
let balls = [];

// Event listeners for keyboard
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'Left') {
        keys.ArrowLeft = true;
    } else if (e.key === 'ArrowRight' || e.key === 'Right') {
        keys.ArrowRight = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'Left') {
        keys.ArrowLeft = false;
    } else if (e.key === 'ArrowRight' || e.key === 'Right') {
        keys.ArrowRight = false;
    }
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

function resetGame() {
    score = 0;
    gameTime = 0;
    scoreText.textContent = '0';
    balls = [];
    player.x = canvas.width / 2 - player.width / 2;
    player.dx = 0;
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
}

function startGame() {
    resetGame();
    isGameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    lastSpawnTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function spawnBall(currentSpeed) {
    const radius = Math.floor(Math.random() * 12) + 12; // 12 to 24px
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const color = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
    const speedVariation = (Math.random() - 0.5) * 1.5;

    balls.push({
        x: x,
        y: -radius,
        radius: radius,
        color: color,
        speed: Math.max(1.5, currentSpeed + speedVariation)
    });
}

function updatePlayer() {
    if (keys.ArrowLeft && !keys.ArrowRight) {
        player.dx = -player.speed;
    } else if (keys.ArrowRight && !keys.ArrowLeft) {
        player.dx = player.speed;
    } else {
        player.dx = 0;
    }

    player.x += player.dx;

    // Boundaries check
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

function checkCollision(player, ball) {
    // Circle-to-box collision check
    let nearestX = Math.max(player.x, Math.min(ball.x, player.x + player.width));
    let nearestY = Math.max(player.y, Math.min(ball.y, player.y + player.height));

    let deltaX = ball.x - nearestX;
    let deltaY = ball.y - nearestY;

    return (deltaX * deltaX + deltaY * deltaY) < (ball.radius * ball.radius);
}

function updateGame(timestamp) {
    gameTime += 0.016; // approx 60fps delta
    score = Math.floor(gameTime * 10);
    scoreText.textContent = score;

    // Gradual difficulty increase over time
    const difficultyFactor = Math.min(1, gameTime / 60); // Max difficulty reached at 60s
    const currentSpeed = baseBallSpeed + (maxBallSpeed - baseBallSpeed) * difficultyFactor;
    const currentSpawnInterval = Math.max(
        minSpawnInterval,
        baseSpawnInterval - difficultyFactor * (baseSpawnInterval - minSpawnInterval)
    );

    // Spawn ball if interval passed
    if (timestamp - lastSpawnTime > currentSpawnInterval) {
        spawnBall(currentSpeed);
        lastSpawnTime = timestamp;
    }

    updatePlayer();

    // Update balls positions and collisions
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
        ball.y += ball.speed;

        // Check collision with player
        if (checkCollision(player, ball)) {
            gameOver();
            return;
        }

        // Remove off-screen balls
        if (ball.y - ball.radius > canvas.height) {
            balls.splice(i, 1);
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    // Draw rounded rectangle for player
    const r = 8; // border radius
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.width - r, player.y);
    ctx.quadraticCurveTo(player.x + player.width, player.y, player.x + player.width, player.y + r);
    ctx.lineTo(player.x + player.width, player.y + player.height - r);
    ctx.quadraticCurveTo(player.x + player.width, player.y + player.height, player.x + player.width - r, player.y + player.height);
    ctx.lineTo(player.x + r, player.y + player.height);
    ctx.quadraticCurveTo(player.x, player.y + player.height, player.x, player.y + player.height - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();

    // Inner glow / detail for player
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 6, 0, Math.PI * 2);
    ctx.fill();
}

function drawBalls() {
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow
        ctx.closePath();
    });
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid / background lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    drawPlayer();
    drawBalls();
}

function gameLoop(timestamp) {
    if (!isGameRunning) return;

    updateGame(timestamp);
    render();

    if (isGameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function gameOver() {
    isGameRunning = false;
    finalScoreText.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Initial draw on canvas
render();
