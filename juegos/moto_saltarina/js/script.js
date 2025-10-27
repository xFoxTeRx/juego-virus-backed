document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM (Completos y en un solo lugar) ---
    const suelo = document.getElementById('suelo');
    const moto = document.getElementById('moto');
    const obstaculo = document.getElementById('obstaculo');
    const obstaculo2 = document.getElementById('obstaculo2');
    const scoreSpan = document.querySelector('#score span');
    const finalScoreSpan = document.getElementById('final-score');
    
    // Pantallas
    const startScreen = document.getElementById('start-screen');
    const pauseScreen = document.getElementById('pause-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const highScoresScreen = document.getElementById('high-scores-screen');

    // Botones
    const pauseButton = document.getElementById('pause-button');
    const newGameButton = document.getElementById('new-game-button');
    const highScoresButton = document.getElementById('high-scores-button');
    const resumeButton = document.getElementById('resume-button');
    const restartButton = document.getElementById('restart-button');
    const restartFromPauseButton = document.getElementById('restart-from-pause-button');
    const backToMenuButton = document.getElementById('back-to-menu-button');
    const backFromScoresButton = document.getElementById('back-from-scores-button');

    // --- CONSTANTES Y VARIABLES DE JUEGO ---
    const GAME_WIDTH = 800;
    const GRAVITY = 0.6;
    const JUMP_STRENGTH = -15;
    const INITIAL_SPEED = 300;
    const HITBOX_PADDING_X = 15;
    const HITBOX_PADDING_Y = 10;

    let score, motoY, motoVelocityY, obstaculoX, obstaculo2X, gameSpeed;
    let sueloX = 0;
    let isPaused = false;
    let animationFrameId;
    let highScores = JSON.parse(localStorage.getItem('motoHighScores')) || [];
    let lastTime = 0;

    // --- BUCLE PRINCIPAL DEL JUEGO ---
    function gameLoop(timestamp) {
        if (isPaused) return;

        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        if (deltaTime > 50) { // Limita el delta time para evitar saltos bruscos
            requestAnimationFrame(gameLoop);
            return;
        }

        update(deltaTime);
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- LÓGICA DE ACTUALIZACIÓN ---
    function update(deltaTime) {
        const scale = deltaTime / 16.67;

        // Mover moto
        motoVelocityY += GRAVITY * scale;
        motoY += motoVelocityY * scale;
        if (motoY > 0) { motoY = 0; motoVelocityY = 0; }

        // Mover el suelo
        sueloX -= gameSpeed * (deltaTime / 1000);
        if (sueloX <= -GAME_WIDTH) { sueloX = 0; }

        // Mover obstáculos
        obstaculoX -= gameSpeed * (deltaTime / 1000);
        if (obstaculoX < -80) {
            obstaculoX = GAME_WIDTH + Math.random() * 200;
            score++;
        }
        
        if (score >= 15) {
            obstaculo2.classList.remove('hidden');
            obstaculo2X -= gameSpeed * (deltaTime / 1000);
            if (obstaculo2X < -80) {
                obstaculo2X = GAME_WIDTH + Math.random() * 300;
                score++;
            }
        }
        
        scoreSpan.textContent = score;

        // Aumentar dificultad
        if (score > 0 && score % 10 === 0) {
            gameSpeed += 0.2;
        }

        // Detección de colisiones
        if (checkCollision(moto, obstaculo) || (score >= 15 && checkCollision(moto, obstaculo2))) {
            endGame();
        }
    }

    function checkCollision(a, b) {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();

        return !(
            (rectA.right - HITBOX_PADDING_X) < (rectB.left + HITBOX_PADDING_X) || 
            (rectA.left + HITBOX_PADDING_X) > (rectB.right - HITBOX_PADDING_X) || 
            (rectA.bottom - HITBOX_PADDING_Y) < (rectB.top + HITBOX_PADDING_Y) || 
            (rectA.top + HITBOX_PADDING_Y) > (rectB.bottom - HITBOX_PADDING_Y)
        );
    }

    // --- LÓGICA DE DIBUJADO ---
    function draw() {
        suelo.style.transform = `translateX(${sueloX}px)`;
        moto.style.transform = `translateY(${motoY}px)`;
        obstaculo.style.transform = `translateX(${obstaculoX}px)`;
        if (score >= 15) {
            obstaculo2.style.transform = `translateX(${obstaculo2X}px)`;
        }
    }
    
    // --- FUNCIONES DE ESTADO DEL JUEGO (SOLO UNA VERSIÓN DE CADA UNA) ---
    function initGame() {
        score = 0;
        motoY = 0;
        motoVelocityY = 0;
        obstaculoX = GAME_WIDTH;
        obstaculo2X = GAME_WIDTH + 400;
        gameSpeed = INITIAL_SPEED;
        isPaused = false;
        sueloX = 0;
        
        scoreSpan.textContent = score;
        obstaculo2.classList.add('hidden');
        
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        pauseScreen.classList.add('hidden');
        highScoresScreen.classList.add('hidden');

        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    function endGame() {
        isPaused = true; // Pausamos el juego para detener todo
        cancelAnimationFrame(animationFrameId);
        saveHighScore();
        finalScoreSpan.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }

    function pauseGame() {
        if (isPaused || !startScreen.classList.contains('hidden') || !gameOverScreen.classList.contains('hidden')) return;
        isPaused = true;
        cancelAnimationFrame(animationFrameId);
        pauseScreen.classList.remove('hidden');
    }

    function resumeGame() {
        if (!isPaused) return;
        isPaused = false;
        pauseScreen.classList.add('hidden');
        
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }

    function jump() {
        if (!isPaused && motoY === 0) {
            motoVelocityY = JUMP_STRENGTH;
        }
    }

    function showHighScores() {
        const list = document.getElementById('high-scores-list');
        list.innerHTML = '';
        highScores.slice(0, 5).forEach(score => {
            const li = document.createElement('li');
            li.textContent = score;
            list.appendChild(li);
        });
        startScreen.classList.add('hidden');
        highScoresScreen.classList.remove('hidden');
    }
    
    function saveHighScore() {
        highScores.push(score);
        highScores.sort((a, b) => b - a);
        highScores = highScores.slice(0, 5);
        localStorage.setItem('motoHighScores', JSON.stringify(highScores));
    }

    // --- EVENT LISTENERS ---
    newGameButton.addEventListener('click', initGame);
    restartButton.addEventListener('click', initGame);
    restartFromPauseButton.addEventListener('click', initGame);

    pauseButton.addEventListener('click', pauseGame);
    resumeButton.addEventListener('click', resumeGame);

    highScoresButton.addEventListener('click', showHighScores);
    backFromScoresButton.addEventListener('click', () => {
        highScoresScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });
    backToMenuButton.addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });

    document.addEventListener('keydown', (e) => {
        if(e.code === 'Space') jump();
        if(e.code === 'Escape') {
            isPaused ? resumeGame() : pauseGame();
        }
    });
    document.body.addEventListener('click', (e) => {
        if (!e.target.closest('.overlay') && !e.target.closest('button')) {
            jump();
        }
    });
});