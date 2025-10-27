// ===================================================================
// IMPORTACIONES DE SESIÓN Y CRUD (PRIMERAS LÍNEAS)
// ===================================================================
import { currentUser, gameProgress, saveGameProgress } from '../../session.js';

// ===========================================
// CONFIGURACIÓN DE AUDIO (Web Audio API)
// ===========================================
const AudioContext = window.AudioContext || window['webkitAudioContext'];
const audioCtx = new AudioContext();
const audioBuffers = {};
let musicaAmbienteSource = null;

async function cargarAudio(nombre, url) {
    try {
        const respuesta = await fetch(url);
        if (!respuesta.ok) throw new Error(`HTTP error! status: ${respuesta.status}`);
        const arrayBuffer = await respuesta.arrayBuffer();
        audioBuffers[nombre] = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (e) {
        console.error(`Error al cargar el audio: ${url}.`, e);
        // Crea un buffer silencioso para evitar que el juego se rompa si un audio falla
        audioBuffers[nombre] = audioCtx.createBuffer(1, 1, 44100);
    }
}

function reproducirSonido(nombre, volumen = 1.0) {
    const buffer = audioBuffers[nombre];
    if (!buffer) return;
    const source = audioCtx.createBufferSource();
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volumen;
    source.buffer = buffer;
    source.connect(gainNode).connect(audioCtx.destination);
    source.start(0);
}

function iniciarMusica() {
    if (musicaAmbienteSource) return;
    const buffer = audioBuffers['ambiente'];
    if (!buffer) return;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.3;
    musicaAmbienteSource = audioCtx.createBufferSource();
    musicaAmbienteSource.buffer = buffer;
    musicaAmbienteSource.loop = true;
    musicaAmbienteSource.connect(gainNode).connect(audioCtx.destination);
    musicaAmbienteSource.start(0);
}

function detenerMusica() {
    if (musicaAmbienteSource) {
        musicaAmbienteSource.stop();
        musicaAmbienteSource = null;
    }
}


// ===========================================
// VARIABLES GLOBALES (DOM y ESTADO)
// ===========================================
const THIS_GAME_ID = 'selector_max_level';
const INTENTOS_MAXIMOS = 3;

// Variables DOM (se asignarán después de que la página cargue)
let celdas, nivelInfo, contenedorJuego, jumpscareOverlay, mensajeJuego, maxNivelSpan, fondoGlitch;
let btnPausa, menuPausaOverlay, btnContinuar, btnReiniciarJuego, btnSalirMenuPrincipal, jumpscareImg;

// Variables de estado del juego
let secuenciaJuego = [];
let secuenciaJugador = [];
let enEspera = false;
let enPausa = false;
let nivel = 1;
let fallosConsecutivos = 0;
let maxNivelAlcanzado = 0;
let esPartidaGuardada = false;


// ===========================================
// LÓGICA DE PUNTAJE Y CLICS
// ===========================================

function cargarPuntuacion() {
    if (currentUser && gameProgress && gameProgress.datos_guardados) {
        maxNivelAlcanzado = gameProgress.datos_guardados[THIS_GAME_ID] || 0;
    } else {
        maxNivelAlcanzado = parseInt(localStorage.getItem(THIS_GAME_ID)) || 0;
    }
    if (maxNivelSpan) maxNivelSpan.textContent = maxNivelAlcanzado;
}

function guardarPuntuacion() {
    const nivelFinalizado = nivel - 1;

    // *** PROTECCIÓN CRÍTICA: SOLO ACTUALIZA EL RÉCORD SI ES MAYOR ***
    // Esta función ahora solo actualiza el estado visual y la variable en memoria.
    if (nivelFinalizado <= maxNivelAlcanzado) {
        return; // No es un nuevo récord, no hace nada.
    }
    
    // Si es un nuevo récord, actualiza la variable y la pantalla
    maxNivelAlcanzado = nivelFinalizado;
    if (maxNivelSpan) maxNivelSpan.textContent = maxNivelAlcanzado;
    if (mensajeJuego) mensajeJuego.textContent = `¡NUEVA PUNTUACIÓN MÁXIMA: Nivel ${nivelFinalizado}!`;
    
    // IMPORTANTE: Ya no llama a saveGameProgress() desde aquí.
}

function activarCeldas() {
    if (celdas) celdas.forEach(celda => {
        celda.addEventListener('click', manejarClicCelda);
        celda.style.cursor = 'pointer';
    });
}

function desactivarCeldas() {
    if (celdas) celdas.forEach(celda => {
        celda.removeEventListener('click', manejarClicCelda);
        celda.style.cursor = 'default';
    });
}

function alternarPausa() {
    if (enEspera && !enPausa) return;
    enPausa = !enPausa;

    if (enPausa) {
        if (menuPausaOverlay) menuPausaOverlay.style.display = 'flex';
        detenerMusica();
        desactivarCeldas();
        contenedorJuego?.classList.add('paused');
        fondoGlitch?.classList.add('paused');
    } else {
        if (menuPausaOverlay) menuPausaOverlay.style.display = 'none';
        iniciarMusica();
        contenedorJuego?.classList.remove('paused');
        fondoGlitch?.classList.remove('paused');
        if (!enEspera) activarCeldas();
    }
}

// ===========================================
// FUNCIONES CLAVE DE JUEGO
// ===========================================

function generarSecuencia() {
    if (!celdas || celdas.length === 0) return;
    const idAleatorio = Math.floor(Math.random() * celdas.length);
    secuenciaJuego.push(idAleatorio);
    secuenciaJugador = [];
    desactivarCeldas();
    if (nivelInfo) nivelInfo.textContent = `NIVEL: ${nivel} | OBSERVANDO...`;
    if (mensajeJuego) mensajeJuego.textContent = "Memoriza el patrón.";
    mostrarSecuencia();
}

async function mostrarSecuencia() {
    enEspera = true;
    const tiempoPorPaso = Math.max(600 - nivel * 50, 100);

    for (const idCelda of secuenciaJuego) {
        const celdaElemento = celdas[idCelda];
        if (enPausa) await new Promise(resolve => { /* Lógica de espera de pausa */ });

        celdaElemento?.classList.add('celda-activa');
        reproducirSonido('celda', 0.5);
        await new Promise(r => setTimeout(r, tiempoPorPaso));
        celdaElemento?.classList.remove('celda-activa');
        await new Promise(r => setTimeout(r, tiempoPorPaso / 2));
    }

    enEspera = false;
    if (nivelInfo) nivelInfo.textContent = `NIVEL: ${nivel} | ¡TU TURNO!`;
    if (mensajeJuego) mensajeJuego.textContent = "¡Repite la secuencia!";
    if (!enPausa) activarCeldas();
}

function manejarClicCelda(event) {
    if (enEspera) return;
    const celdaClicada = event.currentTarget;
    const idClicado = parseInt(celdaClicada.dataset.id, 10);
    celdaClicada.classList.add('celda-activa');
    reproducirSonido('celda', 0.6);
    setTimeout(() => celdaClicada.classList.remove('celda-activa'), 100);
    secuenciaJugador.push(idClicado);
    comprobarSecuencia();
}

function comprobarSecuencia() {
    const ultimoIndex = secuenciaJugador.length - 1;
    if (secuenciaJugador[ultimoIndex] !== secuenciaJuego[ultimoIndex]) {
        manejarFallo();
        return;
    }
    if (secuenciaJugador.length === secuenciaJuego.length) {
        enEspera = true;
        if (mensajeJuego) mensajeJuego.textContent = "¡Correcto! Preparando siguiente nivel...";
        setTimeout(() => {
            nivel++;
            generarSecuencia();
        }, 1000);
    }
}

function repetirSecuencia() {
    secuenciaJugador = [];
    enEspera = true;
    if (nivelInfo) nivelInfo.textContent = `NIVEL: ${nivel} | ¡VUELVE A INTENTARLO! (${INTENTOS_MAXIMOS - fallosConsecutivos} restantes)`;
    if (mensajeJuego) mensajeJuego.textContent = "¡Concéntrate! Repite la secuencia anterior.";
    desactivarCeldas();
    mostrarSecuencia();
}


function manejarFallo() {
    enEspera = true; 
    fallosConsecutivos++; 
    
    // Primero, llama a la función para ver si se rompió un récord y actualizar la UI.
    guardarPuntuacion(); 
    
    desactivarCeldas(); 

    if (nivel >= 5 || fallosConsecutivos >= INTENTOS_MAXIMOS) { 
        // --- GAME OVER: AQUÍ SE GUARDA EN LA BASE DE DATOS ---
        console.log("Juego terminado. Enviando puntuación final a la base de datos.");
        
        if (currentUser) {
            // Llama a la función de guardado en la nube con el récord final.
            saveGameProgress(currentUser.google_id, THIS_GAME_ID, maxNivelAlcanzado); 
        } else {
            // Guarda en localStorage como fallback si no hay login.
            localStorage.setItem(THIS_GAME_ID, maxNivelAlcanzado);
        }
        
        // Finalmente, activa el jumpscare.
        activarJumpscare();

    } else {
        // Fallo suave (no es el último intento)
        if (nivelInfo) nivelInfo.textContent = `¡FALLO! Te quedan ${INTENTOS_MAXIMOS - fallosConsecutivos} intentos.`;
        reproducirSonido('fallo', 0.8); 
        
        contenedorJuego?.classList.add('shake');
        fondoGlitch?.classList.add('fondo-agresivo'); 
        
        setTimeout(() => {
            contenedorJuego?.classList.remove('shake');
            fondoGlitch?.classList.remove('fondo-agresivo'); 
            repetirSecuencia();
        }, 1000); 
    }
}

function activarJumpscare() {
    if (nivelInfo) nivelInfo.textContent = "¡¡¡ERROR CRÍTICO!!!";
    if (mensajeJuego) mensajeJuego.textContent = "¡¡¡SISTEMA ANULADO!!!";
    detenerMusica();
    if (jumpscareOverlay) {
        jumpscareOverlay.style.opacity = 1;
        jumpscareOverlay.style.visibility = 'visible';
    }
    jumpscareImg?.classList.add('jumpscare-activo');
    reproducirSonido('susto', 1.5);
    setTimeout(() => {
        window.location.href = 'menu.html';
    }, 2000);
}


// ===========================================
// SETUP, INICIO Y EVENTOS
// ===========================================

function reiniciarJuego() {
    nivel = 1;
    secuenciaJuego = [];
    secuenciaJugador = [];
    fallosConsecutivos = 0;
    enEspera = false;
    enPausa = false;
    detenerMusica();
    desactivarCeldas();
    if (menuPausaOverlay) menuPausaOverlay.style.display = 'none';
    if (btnPausa) btnPausa.style.display = 'none';
    if (nivelInfo) nivelInfo.textContent = `NIVEL: 1 | LISTO`;
    if (mensajeJuego) mensajeJuego.textContent = "Iniciando...";
}

function arrancarJuego() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // 1. CARGA PUNTUACIÓN PRIMERO
    cargarPuntuacion();
    // 2. REINICIA ESTADO
    reiniciarJuego();
    // 3. INICIA JUEGO
    generarSecuencia();
    iniciarMusica();
    if (btnPausa) btnPausa.style.display = 'block';
}


// ===================================================================
// BLOQUE FINAL DE EJECUCIÓN (DOMContentLoaded)
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. ASIGNACIÓN DE VARIABLES DOM
    celdas = Array.from(document.querySelectorAll('.celda'));
    nivelInfo = document.getElementById('nivel-info');
    contenedorJuego = document.getElementById('contenedor-juego');
    jumpscareOverlay = document.getElementById('jumpscare-overlay');
    mensajeJuego = document.getElementById('mensaje-juego');
    maxNivelSpan = document.getElementById('max-nivel');
    fondoGlitch = document.getElementById('fondo-glitch');
    btnPausa = document.getElementById('btn-pausa');
    menuPausaOverlay = document.getElementById('menu-pausa-overlay');
    btnContinuar = document.getElementById('btn-continuar');
    btnReiniciarJuego = document.getElementById('btn-reiniciar-juego');
    btnSalirMenuPrincipal = document.getElementById('btn-salir-menu-principal');
    jumpscareImg = document.getElementById('jumpscare-img');

    // 2. INICIO DEL PROGRAMA (Carga de audio asíncrona)
    const promesasAudio = [
        cargarAudio('celda', '../../MUSIC/bubble-pop-389501.mp3'),
        cargarAudio('fallo', '../../MUSIC/error-03-125761.mp3'),
        cargarAudio('susto', '../../MUSIC/videoplayback.mp3'),
        cargarAudio('ambiente', '../../MUSIC/Dragon Ball Z Original Soundtrack - Solid State Scouter.mp3')
    ];

    Promise.all(promesasAudio).then(() => {
        console.log("Audios cargados. Iniciando juego...");
        arrancarJuego();
    }).catch(e => {
        console.error("Error al cargar audios, iniciando sin sonido.", e);
        arrancarJuego();
    });

    // 3. CONEXIÓN DE EVENT LISTENERS
    if (btnPausa) btnPausa.addEventListener('click', alternarPausa);
    if (btnContinuar) btnContinuar.addEventListener('click', alternarPausa);
    if (btnReiniciarJuego) btnReiniciarJuego.addEventListener('click', () => {
        if (enPausa) alternarPausa();
        arrancarJuego();
    });
    if (btnSalirMenuPrincipal) btnSalirMenuPrincipal.addEventListener('click', () => {
        window.location.href = 'menu.html';
    });
    document.addEventListener('keyup', (e) => {
        if (jumpscareOverlay?.style.visibility !== 'visible' && !enEspera) {
            if (['p', 'P', 'Escape'].includes(e.key)) alternarPausa();
        }
    });
    document.addEventListener('keydown', e => {
        if ([32, 13].includes(e.keyCode)) e.preventDefault();
    });
});