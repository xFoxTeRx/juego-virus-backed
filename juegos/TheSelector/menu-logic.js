// ===================================================================
// IMPORTACIONES (Asegúrate de que la ruta sea correcta)
// ===================================================================
import { currentUser, gameProgress, getLeaderboardData } from '../../session.js'; 

// ===================================================================
// CONFIGURACIÓN DE AUDIO
// ===================================================================
const AudioContext = window.AudioContext || window['webkitAudioContext']; 
const audioCtx = new AudioContext(); 


// ===================================================================
// INICIO SEGURO (DOMContentLoaded)
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("Menú iniciado. Cargando elementos...");

    // 1. OBTENCIÓN DE ELEMENTOS DOM
    const menuPrincipal = document.getElementById('menu-central-contenido');
    const menuSecundario = document.getElementById('menu-secundario');
    const secTitulo = document.getElementById('sec-titulo');
    const secCuerpo = document.getElementById('sec-cuerpo');
    const fondoGlitch = document.getElementById('fondo-glitch');
    
    // Botones
    const btnJugar = document.getElementById('btn-jugar');
    const btnInstrucciones = document.getElementById('btn-instrucciones');
    const btnPuntajes = document.getElementById('btn-puntajes');
    const btnVolver = document.getElementById('btn-volver');

    if (fondoGlitch) fondoGlitch.style.opacity = '0.15';

    // ===================================================================
    // FUNCIONES DE NAVEGACIÓN INTERNA
    // ===================================================================
    
    function mostrarSubmenu(tipo) {
        if (!menuPrincipal || !menuSecundario) {
            console.error("Error crítico: Falta el contenedor del menú.");
            return;
        }

        menuPrincipal.style.display = 'none';
        menuSecundario.style.display = 'flex';

        if (tipo === 'instrucciones') {
            secTitulo.textContent = 'INSTRUCCIONES';
            secCuerpo.innerHTML = `
                <ul style="text-align: left; margin-top: 20px; font-size: 1.1em;">
                    <li>Memoriza la secuencia de luces.</li>
                    <li>Repítela exactamente igual.</li>
                    <li>Cada nivel es más rápido y largo.</li>
                    <li><strong>3 fallos</strong> = Game Over (y susto).</li>
                </ul>
            `;
        } else if (tipo === 'puntajes') {
            // Lógica del Leaderboard Global
            secTitulo.textContent = 'TABLA DE PUNTUACIONES GLOBALES';
            secCuerpo.innerHTML = '<p>Cargando Top Jugadores...</p><div class="loading-spinner"></div>';

            // Llama a la función asíncrona de session.js
            getLeaderboardData()
                .then(leaderboard => {
                    if (leaderboard.length > 0) {
                        let html = '<table>';
                        html += '<thead><tr><th>#</th><th>Usuario</th><th>Máx. Nivel</th></tr></thead><tbody>';

                        leaderboard.forEach((item, index) => {
                            const nombreUsuario = item.nombre || `Usuario ${index + 1}`;
                            const maxNivel = item.puntuacion_alta || 0;
                            
                            // Resalta la fila del usuario actual
                            const isCurrentUser = currentUser && currentUser.google_id === item.usuario_google_id;
                            
                            html += `<tr class="${isCurrentUser ? 'highlight-user' : ''}">`;
                            html += `<td>${index + 1}</td><td>${nombreUsuario}</td><td>${maxNivel}</td></tr>`;
                        });
                        
                        html += '</tbody></table>';
                        secCuerpo.innerHTML = html; 
                        
                    } else {
                        secCuerpo.innerHTML = '<p>No hay puntuaciones registradas en la nube. ¡Sé el primero!</p>';
                    }
                })
                .catch(error => {
                    secCuerpo.innerHTML = '<p>Error de conexión con el servidor de puntajes.</p>';
                });
        }
    }

    function volverAlPrincipal() {
        if (menuPrincipal && menuSecundario) {
            menuSecundario.style.display = 'none';
            menuPrincipal.style.display = 'flex';
        }
    }

    // ===================================================================
    // CONEXIÓN DE EVENT LISTENERS (GARANTIZADA)
    // ===================================================================

    // 1. Botón JUGAR
    if (btnJugar) {
        btnJugar.addEventListener('click', (e) => {
            e.preventDefault(); 
            const urlDestino = btnJugar.href;

            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => {
                    window.location.href = urlDestino;
                }).catch(() => {
                    window.location.href = urlDestino;
                });
            } else {
                window.location.href = urlDestino;
            }
        });
    }

    // 2. Botones INSTRUCCIONES y PUNTAJES
    if (btnInstrucciones) btnInstrucciones.addEventListener('click', () => mostrarSubmenu('instrucciones'));
    if (btnPuntajes) btnPuntajes.addEventListener('click', () => mostrarSubmenu('puntajes'));
    if (btnVolver) btnVolver.addEventListener('click', volverAlPrincipal);

    console.log("Menú cargado y listo.");
}); // <-- ¡ESTA LLAVE DE CIERRE ERA CRÍTICA Y FALTABA!