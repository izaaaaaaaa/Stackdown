
const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const gameArea = document.querySelector('.game-area');
const gamePlayerNameElement = document.getElementById('gamePlayerName');
const gameHighScoreNameElement = document.getElementById('gameHighScoreName');
const gameHighScoreElement = document.getElementById('gameHighScore');
const startScreen = document.getElementById('startScreen');
const startScreenNameInput = document.getElementById('startScreenNameInput');
const startScreenButton = document.getElementById('startScreenButton');
const startScreenHighScoreName = document.getElementById('startScreenHighScoreName');
const startScreenHighScore = document.getElementById('startScreenHighScore');
const instructionsModal = document.getElementById('instructionsModal');
const closeModalButton = document.getElementById('closeModalButton');
const pauseButton = document.getElementById('pauseButton');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeButton = document.getElementById('resumeButton');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverPlayerName = document.getElementById('gameOverPlayerName');
const gameOverScore = document.getElementById('gameOverScore');
const gameOverHighScoreName = document.getElementById('gameOverHighScoreName');
const gameOverHighScore = document.getElementById('gameOverHighScore');
const gameOverButton = document.getElementById('gameOverButton');
const backgroundMusic = document.getElementById('backgroundMusic');
backgroundMusic.volume = 0.3;
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const volumeSlider = document.getElementById('volumeSlider');
const muteButton = document.getElementById('muteButton');
// --- Constantes Chave (Storage Keys) ---
const HIGH_SCORE_KEY = 'meuTetrisHighScore';
const HIGH_SCORE_NAME_KEY = 'meuTetrisHighScoreName';
const LAST_PLAYER_NAME_KEY = 'meuTetrisLastPlayer';
const VOLUME_KEY = 'stackDownVolume';
const MUTE_KEY = 'stackDownMuted'; // Agora só existe uma

// --- Variáveis do Easter Egg ---
let tSpinCounter = 0;
const T_SPIN_LIMIT = 7; // Quantos giros para ativar
let easterEggTriggeredThisPiece = false;

// --- Constantes do Jogo (Grid) ---
const COLS = 10; // Agora só existe uma
const ROWS = 20;
const BLOCK_SIZE = 30;

// Cores
const COLORS = [null, '#FF007F', '#00E5FF', '#FFD600', '#AD00FF', '#00FF9E', '#FF5733', '#FFFFFF'];
// Peças
const SHAPES = {'O1':{rotations:[[[1]]],colorIndex:1},'I2':{rotations:[[[2,2]],[[2],[2]]],colorIndex:2},'L3':{rotations:[[[3,0],[3,0],[3,3]],[[3,3,3],[3,0,0]],[[3,3],[0,3],[0,3]],[[0,0,3],[3,3,3]]],colorIndex:3},'T4':{rotations:[[[0,7,0],[7,7,7]],[[7,0],[7,7],[7,0]],[[7,7,7],[0,7,0]],[[0,7],[7,7],[0,7]]],colorIndex:7},'L5':{rotations:[[[5,0,0,0],[5,5,5,5]],[[5,5],[5,0],[5,0],[5,0]],[[5,5,5,5],[0,0,0,5]],[[0,5],[0,5],[0,5],[5,5]]],colorIndex:5},'I6':{rotations:[[[6,6,6,6,6,6]],[[6],[6],[6],[6],[6],[6]]],colorIndex:6}};
const PIECE_NAMES = Object.keys(SHAPES);

// --- Variáveis de Estado do Jogo ---
let grid;
let currentPiece;
let score;
let isGameOver;
let dropCounter;
let dropInterval;
let gameTimerInterval;
let startTime;
let lastTime = 0; // Movido para escopo global para o gameLoop

// Variáveis de Pausa
let isPaused = false;
let animationFrameId; // Guarda o ID do requestAnimationFrame

// Variáveis de Recorde e Jogador
let currentHighScore = 0;
let currentHighScoreName = 'Ninguém';
let currentPlayerName = '';

// --- Funções Principais do Jogo ---
// --- FUNÇÕES DE ÁUDIO E CONFIGURAÇÕES ADICIONADAS ---

/** Carrega as configurações de áudio do localStorage */
function loadSettings() {
    const savedVolume = localStorage.getItem(VOLUME_KEY);
    const savedMuted = localStorage.getItem(MUTE_KEY);

    // Carrega o volume salvo ou usa o padrão
    if (savedVolume !== null) {
        backgroundMusic.volume = savedVolume;
        volumeSlider.value = savedVolume;
    } else {
        backgroundMusic.volume = 0.3; // Padrão (você já tinha isso, mas agora está aqui)
        volumeSlider.value = 0.3;
    }
    
    // Atualiza o volume no seu elemento de áudio (caso o padrão seja usado)
    backgroundMusic.volume = volumeSlider.value;

    // Carrega o estado mudo salvo
    if (savedMuted === 'true') {
        backgroundMusic.muted = true;
        muteButton.textContent = 'Ligar Som';
        muteButton.classList.add('muted');
    } else {
        backgroundMusic.muted = false;
        muteButton.textContent = 'Desligar Som';
        muteButton.classList.remove('muted');
    }
}

/** Salva as configurações de áudio no localStorage */
function saveSettings() {
    localStorage.setItem(VOLUME_KEY, backgroundMusic.volume);
    localStorage.setItem(MUTE_KEY, backgroundMusic.muted);
}

/** Atualiza o volume quando o slider é movido */
function handleVolumeChange() {
    backgroundMusic.volume = volumeSlider.value;
    // Se o usuário mexer no volume, assume que ele quer ouvir
    if (backgroundMusic.volume > 0) {
        backgroundMusic.muted = false; 
        muteButton.textContent = 'Desligar Som';
        muteButton.classList.remove('muted');
    }
}

/** Liga ou desliga o som */
function toggleMute() {
    backgroundMusic.muted = !backgroundMusic.muted;
    if (backgroundMusic.muted) {
        muteButton.textContent = 'Ligar Som';
        muteButton.classList.add('muted');
    } else {
        muteButton.textContent = 'Desligar Som';
        muteButton.classList.remove('muted');
    }
}

/** Mostra a mensagem do Easter Egg por 3 segundos.
 * Usa o elemento #easterEggMessage do seu HTML.*/
function showEasterEgg(message) {
    const messageElement = document.getElementById('easterEggMessage');
    if (!messageElement) return; // Segurança

    messageElement.innerText = message;
    messageElement.classList.remove('hidden'); // Mostra a mensagem

    // Esconde a mensagem automaticamente após 3 segundos
    setTimeout(() => {
        messageElement.classList.add('hidden');
    }, 3000);
}

/** Carrega o recorde salvo no localStorage e atualiza a tela inicial */
function loadHighScore() {
    currentHighScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    currentHighScoreName = localStorage.getItem(HIGH_SCORE_NAME_KEY) || 'Ninguém';
    startScreenHighScore.textContent = currentHighScore;
    startScreenHighScoreName.textContent = currentHighScoreName;
    const lastPlayerName = localStorage.getItem(LAST_PLAYER_NAME_KEY) || '';
    startScreenNameInput.value = lastPlayerName;
}

/** Verifica e salva o novo recorde (chamado no Fim de Jogo) */
function checkAndSaveHighScore() {
    const playerName = currentPlayerName;
    let newRecord = false;
    backgroundMusic.pause();
    // 1. Verifica se a pontuação atual é maior que o recorde salvo
    if (score > currentHighScore) {
        currentHighScore = score;
        currentHighScoreName = playerName;
        localStorage.setItem(HIGH_SCORE_KEY, currentHighScore);
        localStorage.setItem(HIGH_SCORE_NAME_KEY, currentHighScoreName);
        newRecord = true;
    }
    
    // 2. Preenche o modal de Fim de Jogo com os dados
    
    // Mostra o nome do jogador e sua pontuação
    gameOverPlayerName.textContent = playerName;
    gameOverScore.textContent = score;
    
    // Mostra o recorde atual (que pode ter acabado de ser atualizado)
    gameOverHighScoreName.textContent = currentHighScoreName;
    gameOverHighScore.textContent = currentHighScore;
    
    // Muda o título se for um novo recorde
    if (newRecord) {
        gameOverTitle.textContent = "Novo Recorde!";
        gameOverTitle.classList.add('new-record'); // Adiciona classe para o CSS (cor dourada)
    } else {
        gameOverTitle.textContent = "Fim de Jogo!";
        gameOverTitle.classList.remove('new-record'); // Garante que a classe não esteja lá
    }

    // 3. Esconde a área de jogo e mostra o modal de Fim de Jogo
    gameArea.classList.add('hidden');
    pauseButton.disabled = true;
    pauseButton.textContent = 'Pausar';
    
    gameOverOverlay.classList.remove('hidden'); // MOSTRA O MODAL DE GAME OVER

    // 4. A função loadHighScore() agora será chamada quando o modal for fechado
}

/** Cria um grid (matriz) vazio */
function createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

/** Gera uma nova peça aleatória */
function spawnNewPiece() {
    // Reseta o contador do Easter Egg para esta nova peça
    tSpinCounter = 0;
    easterEggTriggeredThisPiece = false;
    const randomName = PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
    const definition = SHAPES[randomName];
    const shape = definition.rotations[0];
    
    currentPiece = {
        name: randomName,
        definition: definition,
        rotationIndex: 0,
        shape: shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };

    // Verifica se o jogo acabou
    if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        isGameOver = true;
        cancelAnimationFrame(animationFrameId); // Para o loop do jogo
        clearInterval(gameTimerInterval);
        checkAndSaveHighScore(); 
    }
}

/** Verifica colisão da peça com as bordas ou outras peças */
function checkCollision(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                let newX = x + col;
                let newY = y + row;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (grid[newY] && grid[newY][newX] !== 0)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/** "Trava" a peça no lugar no grid */
function lockPiece() {
    const { x, y, shape } = currentPiece;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                grid[y + row][x + col] = shape[row][col];
            }
        }
    }
}

/** Verifica e limpa linhas completas */
function clearLines() {
    let linesCleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
        if (grid[row].every(cell => cell !== 0)) {
            grid.splice(row, 1);
            grid.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100 * (linesCleared > 1 ? linesCleared : 1);
        scoreElement.textContent = score;
    }
}

/** Move a peça (se não houver colisão) */
function movePiece(dx, dy) {
    if (!checkCollision(currentPiece.x + dx, currentPiece.y + dy, currentPiece.shape)) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        return true;
    }
    return false;
}

/** Gira a peça */
function rotatePiece() {
    const { definition } = currentPiece;
    let nextRotationIndex = (currentPiece.rotationIndex + 1) % definition.rotations.length;
    let nextShape = definition.rotations[nextRotationIndex];
    if (!checkCollision(currentPiece.x, currentPiece.y, nextShape)) {
        currentPiece.rotationIndex = nextRotationIndex;
        currentPiece.shape = nextShape;
    } else if (!checkCollision(currentPiece.x + 1, currentPiece.y, nextShape)) {
        currentPiece.x++;
        currentPiece.rotationIndex = nextRotationIndex;
        currentPiece.shape = nextShape;
    } else if (!checkCollision(currentPiece.x - 1, currentPiece.y, nextShape)) {
        currentPiece.x--;
        currentPiece.rotationIndex = nextRotationIndex;
        currentPiece.shape = nextShape;
    }
}

/** Faz a peça cair */
function drop() {
    if (!movePiece(0, 1)) {
        lockPiece();
        clearLines();
        spawnNewPiece();
    }
}

// --- Funções de Desenho ---
function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    if (currentPiece) { drawPiece(currentPiece); }
}
function drawGrid() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col] !== 0) {
                drawBlock(col, row, grid[row][col]);
            }
        }
    }
}
function drawPiece(piece) {
    const { x, y, shape } = piece;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col] !== 0) {
                drawBlock(x + col, y + row, shape[row][col]);
            }
        }
    }
}
function drawBlock(x, y, colorIndex) {
    context.fillStyle = COLORS[colorIndex];
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}
// --- Fim Funções de Desenho ---

// --- Loop Principal e Controles ---

function gameLoop(timestamp = 0) {
    if (isGameOver) { return; }

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        drop();
        dropCounter = 0;
    }
    draw();
    animationFrameId = requestAnimationFrame(gameLoop); // Guarda o ID
}

/** Função para atualizar o cronômetro */
function updateTimer() {
    if (isGameOver || isPaused) return; // Não atualiza se pausado
    const elapsedTime = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timerElement.textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Inicia/Reinicia o jogo */
function startGame() {
    // 1. Pegar e salvar o nome do jogador
    currentPlayerName = startScreenNameInput.value.trim() || 'Anônimo';
    localStorage.setItem(LAST_PLAYER_NAME_KEY, currentPlayerName); 

    // Atualiza o nome do jogador na UI
    gamePlayerNameElement.textContent = currentPlayerName;

    // 2. Esconder a tela inicial e mostrar o jogo
    startScreen.classList.add('hidden');
    gameArea.classList.remove('hidden');

    // 3. Resetar o estado do jogo
    grid = createGrid();
    score = 0;
    scoreElement.textContent = score;
    isGameOver = false;
    dropCounter = 0;
    dropInterval = 1000;
    
    // Atualiza a exibição do recorde na tela de jogo
    // (As variáveis currentHighScore e currentHighScoreName já foram carregadas no loadHighScore())
    gameHighScoreElement.textContent = currentHighScore;
    gameHighScoreNameElement.textContent = currentHighScoreName;
    
    // 4. Resetar estado de pausa
    isPaused = false;
    pauseOverlay.classList.add('hidden');
    pauseButton.disabled = false;
    pauseButton.textContent = 'Pausar';
    
    // 5. Iniciar o Timer
    timerElement.textContent = '00:00';
    if (gameTimerInterval) { clearInterval(gameTimerInterval); }
    startTime = Date.now();
    gameTimerInterval = setInterval(updateTimer, 1000);
    
    // 6. Iniciar o jogo
    lastTime = performance.now(); // Zera o lastTime
    spawnNewPiece();
    animationFrameId = requestAnimationFrame(gameLoop);
    backgroundMusic.currentTime = 0; // Reinicia a música do início
    backgroundMusic.play();
}

// --- Funções de Pausa ---
function pauseGame() {
    if (isGameOver || isPaused) return;
    
    isPaused = true;
    cancelAnimationFrame(animationFrameId); // Para o loop do jogo
    clearInterval(gameTimerInterval); // Para o cronômetro
    pauseOverlay.classList.remove('hidden'); // Mostra o menu de pausa
    pauseButton.textContent = 'Continuar';
    backgroundMusic.pause();
}

function resumeGame() {
    if (isGameOver || !isPaused) return;
    
    isPaused = false;
    pauseOverlay.classList.add('hidden'); // Esconde o menu
    pauseButton.textContent = 'Pausar';
    
    // Reinicia o cronômetro
    gameTimerInterval = setInterval(updateTimer, 1000); 
    
    // Reinicia o loop do jogo
    lastTime = performance.now(); // Reseta o 'lastTime' para evitar pulo
    animationFrameId = requestAnimationFrame(gameLoop);
    backgroundMusic.play();
}
// --- FIM Funções de Pausa ---


// --- Event Listeners ---

// Listener do jogo (controles das peças)
document.addEventListener('keydown', (e) => {
    // IGNORA se pausado, game over, ou sem peça
    if (isGameOver || !currentPiece || isPaused) return; 
    
    switch (e.key) {
        case 'ArrowLeft': movePiece(-1, 0); break;
        case 'ArrowRight': movePiece(1, 0); break;
        case 'ArrowDown': drop(); dropCounter = 0; break;
        case 'ArrowUp': 
            if (currentPiece.name === 'T4' && !easterEggTriggeredThisPiece) { // A peça 'T' no seu objeto SHAPES chama-se 'T4'
                tSpinCounter++;
                
                if (tSpinCounter >= T_SPIN_LIMIT) { // Verifica se atingiu o limite
                    showEasterEgg("Uau, você ama esse T! 🧐"); // Mude a mensagem aqui!
                    easterEggTriggeredThisPiece = true; // Impede que mostre de novo
                }
            }
            
            rotatePiece(); // Chama a função original de giro
            break;
        case ' ':
            e.preventDefault();
            while (movePiece(0, 1)) { /* hard drop */ }
            lockPiece();
            clearLines();
            spawnNewPiece();
            break;
    }
    draw();
});

// Listener Global (para Pausa, 'P')
document.addEventListener('keydown', (e) => {
    // Não pode pausar se o jogo não começou (gameArea está hidden) ou se o modal de instruções está aberto
    if (e.key.toLowerCase() === 'p' && !gameArea.classList.contains('hidden') && instructionsModal.classList.contains('hidden')) {
        if (isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
});


// --- Inicialização da Página ---

/** Função para fechar o modal de instruções */
function closeModal() {
    instructionsModal.classList.add('hidden');
}

// Listeners dos Modais e Tela Inicial
closeModalButton.addEventListener('click', closeModal);
instructionsModal.addEventListener('click', (e) => {
    if (e.target === instructionsModal) { closeModal(); }
});
startScreenButton.addEventListener('click', startGame);
startScreenNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { startGame(); }
});

// Listener para o botão da tela de Fim de Jogo
gameOverButton.addEventListener('click', () => {
    // 1. Esconde o modal de fim de jogo
    gameOverOverlay.classList.add('hidden');
    
    // 2. Recarrega os dados do recorde (para atualizar a tela inicial)
    loadHighScore(); 
    
    // 3. Mostra a tela inicial
    startScreen.classList.remove('hidden');
});

// Listeners dos botões de pausa
pauseButton.addEventListener('click', () => {
    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
});
resumeButton.addEventListener('click', resumeGame);
// --- LISTENERS DE CONFIGURAÇÕES ADICIONADOS ---

// Abre o modal de configurações
settingsButton.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

// Fecha o modal de configurações e SALVA
closeSettingsButton.addEventListener('click', () => {
    saveSettings(); // Salva as mudanças
    settingsModal.classList.add('hidden');
});

// Listener para o slider de volume
volumeSlider.addEventListener('input', handleVolumeChange);

// Listener para o botão de mudo
muteButton.addEventListener('click', toggleMute);
// Configuração inicial
grid = createGrid();
draw(); 
loadHighScore();
loadSettings(); // <-- ADICIONADO: Carrega as configurações de som salvas

