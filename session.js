// ===================================================================
// session.js: MÓDULO DE PERSISTENCIA Y CRUD DE GOOGLE
// ===================================================================

// --- VARIABLES GLOBALES DE CONFIGURACIÓN Y ESTADO ---
const CLIENT_ID = window.CLIENT_ID;
const API_HOST = "https://juegos-virus-api.onrender.com";
const LOGIN_API_URL = `${API_HOST}/api/auth/google`;
const SAVE_API_URL = `${API_HOST}/api/juegos/guardar`;
const LEADERBOARD_API_URL = `${API_HOST}/api/leaderboard`;

export let currentUser = null;
export let gameProgress = null;

// ===================================================================
// I. LÓGICA DE PERSISTENCIA (LocalStorage)
// ===================================================================

function loadSessionFromLocalStorage() {
    if (localStorage.getItem('currentUser')) {
        try {
            currentUser = JSON.parse(localStorage.getItem('currentUser'));
            gameProgress = JSON.parse(localStorage.getItem('gameProgress'));
            console.log("Sesión recuperada para:", currentUser.nombre);
        } catch (e) {
            console.error("Error al cargar sesión de LocalStorage", e);
            localStorage.clear();
        }
    }
}

function saveSessionToLocalStorage(usuario, progreso) {
    currentUser = usuario;
    gameProgress = progreso;
    localStorage.setItem('currentUser', JSON.stringify(usuario));
    localStorage.setItem('gameProgress', JSON.stringify(progreso));
}

// ===================================================================
// II. FUNCIONES CRUD (Expuestas para el Frontend)
// ===================================================================

function sendTokenToBackend(token) {
    fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            saveSessionToLocalStorage(data.usuario, data.progreso);
            updateUIAfterLogin();
        } else {
            console.error('Error de login:', data.message);
        }
    })
    .catch(error => console.error('Error al conectar con el Backend:', error));
}

export function saveGameProgress(googleId, gameId, newValue) {
    if (!currentUser) return;

    const datosASalvar = { googleId, gameId, newValue };
    console.log("Enviando datos al backend para guardar:", datosASalvar);

    fetch(SAVE_API_URL, {
        method: 'PATCH',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(datosASalvar)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            saveSessionToLocalStorage(currentUser, data.progreso);
            console.log('¡Récord guardado en la nube!');
        } else {
            console.error('Fallo al guardar progreso:', data.message);
        }
    })
    .catch(error => console.error('Error de red al guardar:', error));
}

export async function getLeaderboardData() {
    try {
        const response = await fetch(LEADERBOARD_API_URL);
        if (!response.ok) throw new Error(`Fallo de red: ${response.status}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Error en la respuesta del servidor.');
        return data.leaderboard;
    } catch (error) {
        console.error('Error al obtener el leaderboard:', error);
        return [];
    }
}

// ===================================================================
// III. INICIALIZACIÓN DE GOOGLE Y UI
// ===================================================================

window.handleCredentialResponse = (response) => sendTokenToBackend(response.credential);

window.addEventListener('load', () => {
    loadSessionFromLocalStorage();

    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: handleCredentialResponse
        });
        const googleButton = document.getElementById("google-login-button");
        if (googleButton) {
             google.accounts.id.renderButton(googleButton, { theme: "outline", size: "large" });
        }
    }

    if (currentUser) {
        updateUIAfterLogin();
    }
});

function updateUIAfterLogin() {
    if (!currentUser) return;

    const authSection = document.querySelector('.auth-section');
    const loginDiv = document.getElementById('google-login-button');

    if (loginDiv && authSection) {
        loginDiv.style.display = 'none';

        let userInfoDiv = document.getElementById('user-info-display');
        if (!userInfoDiv) {
            userInfoDiv = document.createElement('div');
            userInfoDiv.id = 'user-info-display';
            userInfoDiv.className = 'auth-button-style';
            authSection.appendChild(userInfoDiv);
        }
        userInfoDiv.innerHTML = `<span class="user-name fas fa-user"></span> ${currentUser.nombre}`;
    }
}