// ===================================================================
// VARIABLES GLOBALES DE CONFIGURACIÓN Y ESTADO
// ===================================================================

// --- Configuración de Conexión ---
// Reemplaza con tu CLIENT_ID real de Google
const CLIENT_ID = window.CLIENT_ID;
// La URL base de tu Servidor Backend (debe estar corriendo en tu terminal)
const API_HOST = "https://juegos-virus-api.onrender.com"; 
const LOGIN_API_URL = `${API_HOST}/api/auth/google`; 
const SAVE_API_URL = `${API_HOST}/api/juegos/guardar`; 

// --- Estado del Usuario ---
let currentUser = null; // Almacena { google_id, nombre, email, ... }
let gameProgress = null; // Almacena { nivel_actual, puntuacion_alta, ... }

// --- Variables de Favoritos ---
const gameGrid = document.getElementById('gameGrid');
const titulo = document.getElementById('titulo-seccion');
const btnTodos = document.getElementById('btnTodos');
const btnFavoritos = document.getElementById('btnFavoritos');
let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];


// ===================================================================
// CÓDIGO EJECUTADO CUANDO LA PÁGINA CARGA (DOMContentLoaded)
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------------------
    // A. INICIALIZACIÓN DE GOOGLE SIGN-IN
    // -------------------------------------------------------------------
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: handleCredentialResponse // Función que maneja el token
        });
        
        // Renderiza el botón en el div con id="google-login-button"
        google.accounts.id.renderButton(
            document.getElementById("google-login-button"),
            { theme: "outline", size: "large", type: "standard" }
        );
    } else {
        console.error("Librería de Google Sign-In no cargada. Revisa tu index.html.");
    }

    
    // -------------------------------------------------------------------
    // B. LÓGICA DE SIMULACIÓN DEL FORMULARIO DE CONTACTO (Original)
    // -------------------------------------------------------------------
    const form = document.getElementById('contactForm');
    
    form.addEventListener('submit', (event) => {
        event.preventDefault(); 
        const sendButton = form.querySelector('.btn-send');
        sendButton.textContent = 'SENDING...';
        sendButton.disabled = true;

        setTimeout(() => {
            alert('¡Mensaje enviado a la cripta! Gracias por tu contacto.');
            form.reset(); 
            sendButton.textContent = 'SEND';
            sendButton.disabled = false;
        }, 2000);
    });

    // -------------------------------------------------------------------
    // C. CÓDIGO DE FAVORITOS (Original)
    // -------------------------------------------------------------------

    // Escucha clics en el grid para botones de favoritos
    gameGrid.addEventListener('click', (e) => {
      if (e.target.classList.contains('fav-btn')) {
        e.preventDefault();
        e.stopPropagation();

        const card = e.target.closest('.game-card');
        const enFavoritos = btnFavoritos.classList.contains('active');
        const title = card.dataset.title;

        if (enFavoritos) {
          // Si estamos en la vista de favoritos → quitar y ocultar
          favoritos = favoritos.filter(f => f.title !== title);
          guardarFavoritos();
          card.style.display = 'none';
        } else {
          // Si estamos en “Todos los juegos” → alternar favorito
          toggleFavorito(card);
        }

        actualizarBotones();
      }
    });

    // Botones de filtro
    btnTodos.addEventListener('click', mostrarTodos);
    btnFavoritos.addEventListener('click', mostrarFavoritos);

    // Iniciar con la actualización de botones
    actualizarBotones();
}); 
// Fin de DOMContentLoaded


// ===================================================================
// FUNCIONES DE FAVORITOS (Original)
// ===================================================================

function guardarFavoritos() {
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

function actualizarBotones() {
  const enFavoritos = btnFavoritos.classList.contains('active');

  document.querySelectorAll('.fav-btn').forEach(btn => {
    const card = btn.closest('.game-card');
    const title = card.dataset.title;
    const esFavorito = favoritos.some(fav => fav.title === title);

    if (enFavoritos) {
      btn.textContent = '❌';
      btn.style.color = 'red';
    } else {
      btn.textContent = esFavorito ? '💛' : '⭐';
      btn.style.color = 'gold';
    }
  });
}

function mostrarFavoritos() {
  titulo.textContent = "⭐ Tus Juegos Favoritos";
  const cards = document.querySelectorAll('.game-card');

  cards.forEach(card => {
    const title = card.dataset.title;
    const esFavorito = favoritos.some(fav => fav.title === title);
    card.style.display = esFavorito ? 'block' : 'none';
  });

  btnFavoritos.classList.add('active');
  btnTodos.classList.remove('active');
  actualizarBotones();
}

function mostrarTodos() {
  titulo.textContent = "Catálogo de Juegos";
  document.querySelectorAll('.game-card').forEach(card => {
    card.style.display = 'block';
  });

  btnTodos.classList.add('active');
  btnFavoritos.classList.remove('active');
  actualizarBotones();
}

function toggleFavorito(card) {
  const juego = {
    title: card.dataset.title,
    img: card.dataset.img,
    link: card.dataset.link
  };

  const index = favoritos.findIndex(f => f.title === juego.title);
  if (index >= 0) {
    favoritos.splice(index, 1); // quitar
  } else {
    favoritos.push(juego); // agregar
  }

  guardarFavoritos();
  actualizarBotones();
}


// ===================================================================
// FUNCIONES DE GOOGLE LOGIN (CRUD: C y R)
// ===================================================================

// FUNCIÓN PRINCIPAL DE CALLBACK DE GOOGLE (Llamada por la librería de Google)
function handleCredentialResponse(response) {
    console.log("Token de Google recibido. Enviando al Backend...");
    sendTokenToBackend(response.credential);
}

// FUNCIÓN PARA ENVIAR EL TOKEN A TU SERVIDOR
function sendTokenToBackend(token) {
    fetch(LOGIN_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: token })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('La verificación del token de Google falló en el servidor.');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Guardar datos globales de la sesión
            currentUser = data.usuario;
            gameProgress = data.progreso;
            
            console.log('Login Exitoso. Progreso Cargado:', gameProgress);
            alert("Bienvenido, " + currentUser.nombre + ". Nivel guardado: " + gameProgress.nivel_actual);
            
            updateUIAfterLogin(); 
        } else {
            alert("Error en el login: " + data.message);
        }
    })
    .catch(error => console.error('Error al conectar con el Backend:', error));
}


// FUNCIÓN PARA ACTUALIZAR LA INTERFAZ DE USUARIO tras el login
function updateUIAfterLogin() {
    const authSection = document.querySelector('.auth-section');
    const loginDiv = document.getElementById('google-login-button');
    
    // 1. Reemplazar el botón de login con el nombre del usuario
    if (currentUser) {
        // Muestra el nombre y añade estilo
        loginDiv.innerHTML = `<span class="user-name fas fa-user"></span> ${currentUser.nombre}`;
        
        // 2. Agregar un botón de "Guardar Partida" (para probar el CRUD U)
        let saveButton = document.querySelector('.btn-save-game');
        if (!saveButton) {
            saveButton = document.createElement('button');
            saveButton.className = 'btn-save-game';
            saveButton.textContent = 'Guardar Partida';
            authSection.appendChild(saveButton);
        }
        
        saveButton.onclick = () => {
            // Llama a la función de guardado con datos de prueba
            saveGameProgress(currentUser.google_id, gameProgress.nivel_actual + 1, gameProgress.puntuacion_alta + 100); 
        };
    }
}


// ===================================================================
// FUNCIÓN PARA GUARDAR EL PROGRESO (CRUD: U)
// ===================================================================
function saveGameProgress(googleId, nuevoNivel, nuevaPuntuacion) {
    
    // Si no estamos logeados, no guardar
    if (!currentUser) {
        alert("Debes iniciar sesión para guardar tu progreso.");
        return;
    }
    
    const datosASalvar = {
        googleId: googleId,
        nuevosDatosDeProgreso: {
            nivel_actual: nuevoNivel,
            puntuacion_alta: nuevaPuntuacion,
        }
    };
    
    fetch(SAVE_API_URL, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosASalvar)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            gameProgress = data.progreso;
            console.log('Progreso guardado:', gameProgress);
            alert('Partida guardada! Nuevo nivel: ' + gameProgress.nivel_actual);
        } else {
            console.error('Fallo al guardar progreso:', data.message);
        }
    })
    .catch(error => console.error('Error de red al guardar:', error));
}