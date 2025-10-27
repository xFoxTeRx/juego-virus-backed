// === Referencias a elementos ===
const btnJugar = document.getElementById('btnJugar');
const btnInstrucciones = document.getElementById('btnInstrucciones');
const btnPuntajes = document.getElementById('btnPuntajes');
const btnSalir = document.getElementById('btnSalir');
const modal = document.getElementById('modal');
const modalTitulo = document.getElementById('modalTitulo');
const modalTexto = document.getElementById('modalTexto');
const btnCerrar = document.getElementById('btnCerrar');

// === Función para mostrar el modal ===
function mostrarModal(titulo, texto) {
  modalTitulo.textContent = titulo;
  modalTexto.textContent = texto;
  modal.style.display = 'flex';
}

// === Cerrar el modal ===
btnCerrar.addEventListener('click', () => {
  modal.style.display = 'none';
});

// === SONIDOS DEL MENÚ ===

// Música de fondo del menú
const musicaMenu = new Audio('../../MUSIC/menu.mp3');
musicaMenu.loop = true;
musicaMenu.volume = 0.5;

// Sonido al presionar botones
const sonidoBoton = new Audio('../../MUSIC/bubble-pop-389501.mp3');
sonidoBoton.volume = 0.8;

// Iniciar música al cargar el menú
window.addEventListener('load', () => {
  musicaMenu.play().catch(() => {
    // Si el navegador bloquea el autoplay, se activará al primer clic
    document.body.addEventListener('click', () => musicaMenu.play(), { once: true });
  });
});

// Reproducir sonido al presionar cualquier botón
document.querySelectorAll('button').forEach(boton => {
  boton.addEventListener('click', () => {
    sonidoBoton.currentTime = 0;
    sonidoBoton.play();
  });
});

// === Botón Jugar ===
btnJugar.addEventListener('click', () => {
  // Detener música con un pequeño retraso para que suene el clic
  setTimeout(() => {
    musicaMenu.pause();
    musicaMenu.currentTime = 0;
    window.location.href = 'juego.html';
  }, 300);
});

// === Botón Instrucciones ===
btnInstrucciones.addEventListener('click', () => {
  const texto = `
  ¡Bienvenido a Aplasta la Marmota! 
  
  Objetivo:
  Aplasta las marmotas que aparecen en los agujeros antes de que desaparezcan.

   Controles:
  - Haz clic en las marmotas para sumar puntos.
  - Evita fallar, porque podrías perder tiempo o puntos.
  - Puedes pausar el juego en cualquier momento.

   Meta:
  ¡Logra el mayor puntaje posible antes de que el tiempo acabe!
  `;
  mostrarModal('Instrucciones', texto);
});

// === Botón Puntajes ===
btnPuntajes.addEventListener('click', () => {
  const puntajesGuardados = JSON.parse(localStorage.getItem('puntajes')) || [];

  if (puntajesGuardados.length === 0) {
    mostrarModal('Puntajes', 'No hay puntajes registrados aún.');
    return;
  }

  puntajesGuardados.sort((a, b) => b.puntaje - a.puntaje);

  let texto = "🏆 Mejores Puntajes:\n\n";
  puntajesGuardados.forEach((p, i) => {
    texto += `${i + 1}. ${p.nombre} - ${p.puntaje} pts (${p.tiempo}s)\n`;
  });

  mostrarModal('⭐ Ranking de Puntajes', texto);
});

// === Botón Salir ===
btnSalir.addEventListener('click', () => {
  setTimeout(() => {
    window.location.href = '../../index.html';
  }, 300);
});

// === Guardar Puntaje (usado desde juego.html) ===
function guardarPuntaje(nombre, puntaje, tiempo) {
  let puntajes = JSON.parse(localStorage.getItem('puntajes')) || [];
  puntajes.push({ nombre, puntaje, tiempo });
  localStorage.setItem('puntajes', JSON.stringify(puntajes));
}
