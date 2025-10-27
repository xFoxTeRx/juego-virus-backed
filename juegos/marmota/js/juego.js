// === Variables del juego ===
let puntaje = 0;
let fallas = 0;
let tiempo = 0;
let limiteFallas = 3;
let tiempoLimite = 60;
let velocidadInicial = 1500;
let velocidadMinima = 400;
let puntajeObjetivo = 40;
let marmotaObjetivo = "";
let intervaloJuego;
let intervaloTiempo;

const agujeros = document.querySelectorAll(".agujero img");
const lblPuntaje = document.getElementById("puntaje");
const lblFallas = document.getElementById("fallas");
const lblTiempo = document.getElementById("tiempo");

// === Menú de pausa ===
const menuPausa = document.querySelector(".menu-pausa");
const btnContinuar = document.getElementById("btn-continuar");
const btnReiniciar = document.getElementById("btn-reiniciar");
const btnMenu = document.getElementById("btn-menu");

// === Marmotas disponibles ===
const imagenesMarmotas = [
  "img/m1.png",
  "img/m2.png",
  "img/m3.png",
  "img/m4.png"
];

// === SONIDOS ===
const musicaFondo = new Audio("../../MUSIC/juego-marmota.mp3");
musicaFondo.loop = true;
musicaFondo.volume = 0.5;

const sonidoBoton = new Audio("../../MUSIC/bubble-pop-389501.mp3");
sonidoBoton.volume = 0.8;

const sonidoMarmotaNormal = new Audio("../../MUSIC/bu.mp3");
const sonidoMarmotaObjetivo = new Audio("../../MUSIC/tutu.mp3");
sonidoMarmotaObjetivo.volume = 0.3; // 🔉 volumen reducido
const sonidoAcierto = new Audio("../../MUSIC/pew.mp3");
const sonidoFallo = new Audio("../../MUSIC/fallaste.mp3");

// === Seleccionar marmota objetivo al inicio ===
function seleccionarMarmotaObjetivo() {
  marmotaObjetivo = imagenesMarmotas[Math.floor(Math.random() * imagenesMarmotas.length)];
  document.querySelector(".objetivo img").src = marmotaObjetivo;
}

// === Mostrar una marmota aleatoriamente ===
function mostrarMarmota() {
  // limpiar marmotas anteriores
  agujeros.forEach(a => {
    a.src = "img/agujero.png";
    a.dataset.tipo = "agujero";
  });

  // seleccionar posición aleatoria
  const index = Math.floor(Math.random() * agujeros.length);
  const marmota = imagenesMarmotas[Math.floor(Math.random() * imagenesMarmotas.length)];

  // reproducir sonido de aparición según tipo
  if (marmota === marmotaObjetivo) {
    sonidoMarmotaObjetivo.currentTime = 0;
    sonidoMarmotaObjetivo.play();
  } else {
    sonidoMarmotaNormal.currentTime = 0;
    sonidoMarmotaNormal.play();
  }

  // mostrar marmota
  agujeros[index].src = marmota;
  agujeros[index].dataset.tipo = marmota;

  // desaparecer marmota después de 800ms
  setTimeout(() => {
    if (agujeros[index].dataset.tipo !== "golpeada") {
      agujeros[index].src = "img/agujero.png";
      agujeros[index].dataset.tipo = "agujero";
    }
  }, 800);
}

// === Golpear una marmota ===
agujeros.forEach(a => {
  a.addEventListener("click", () => {
    if (a.dataset.tipo === "agujero") return;

    if (a.dataset.tipo === marmotaObjetivo) {
      puntaje++;
      a.dataset.tipo = "golpeada";
      a.src = "img/agujero.png";
      sonidoAcierto.currentTime = 0;
      sonidoAcierto.play();
    } else {
      fallas++;
      sonidoFallo.currentTime = 0;
      sonidoFallo.play();
    }

    ajustarVelocidad();
    actualizarDatos();
  });
});

// === Ajustar velocidad según puntaje ===
function ajustarVelocidad() {
  if (puntaje >= 2) {
    let nuevaVelocidad = velocidadInicial - ((puntaje - 2) * 80);
    if (nuevaVelocidad < velocidadMinima) nuevaVelocidad = velocidadMinima;
    clearInterval(intervaloJuego);
    intervaloJuego = setInterval(mostrarMarmota, nuevaVelocidad);
  }
}

// === Actualizar los textos ===
function actualizarDatos() {
  lblPuntaje.textContent = `Puntaje: ${puntaje}`;
  lblFallas.textContent = `Fallas: ${fallas}`;

  if (puntaje >= puntajeObjetivo) {
    finalizarJuego("¡Felicidades! ¡Ganaste el juego!");
  }

  if (fallas >= limiteFallas) {
    finalizarJuego(`Juego terminado. Puntos: ${puntaje}`);
  }
}

// === Temporizador ===
function iniciarTiempo() {
  intervaloTiempo = setInterval(() => {
    tiempo++;
    lblTiempo.textContent = `Tiempo: ${tiempo}s`;
    if (tiempo >= tiempoLimite) {
      finalizarJuego(`Tiempo agotado. Puntos: ${puntaje}`);
    }
  }, 1000);
}

// === Reiniciar el juego ===
function reiniciarJuego() {
  puntaje = 0;
  fallas = 0;
  tiempo = 0;
  velocidadInicial = 1500;

  clearInterval(intervaloJuego);
  clearInterval(intervaloTiempo);

  actualizarDatos();
  lblTiempo.textContent = "Tiempo: 0s";
  seleccionarMarmotaObjetivo();

  // 🔁 Reiniciar música de fondo
  musicaFondo.currentTime = 0;
  musicaFondo.play();

  intervaloJuego = setInterval(mostrarMarmota, velocidadInicial);
  iniciarTiempo();
}

// === Guardar puntaje en localStorage ===
function guardarPuntaje() {
  let nombre = prompt("Ingresa tu nombre para guardar tu puntaje:");
  if (!nombre || nombre.trim() === "") nombre = "Jugador";

  let puntajes = JSON.parse(localStorage.getItem("puntajes")) || [];
  puntajes.push({ nombre: nombre.trim(), puntaje, tiempo });
  localStorage.setItem("puntajes", JSON.stringify(puntajes));
}

// === Finalizar juego ===
function finalizarJuego(mensaje) {
  clearInterval(intervaloJuego);
  clearInterval(intervaloTiempo);
  alert(mensaje);

  guardarPuntaje();
  reiniciarJuego();
}

// === Botón pausa ===
document.querySelector(".btn-pausa").addEventListener("click", () => {
  sonidoBoton.currentTime = 0;  // 🔊 Sonido de clic agregado
  sonidoBoton.play();

  clearInterval(intervaloJuego);
  clearInterval(intervaloTiempo);
  musicaFondo.pause();
  menuPausa.style.display = "flex";
});

// === Botones del menú de pausa ===
[btnContinuar, btnReiniciar, btnMenu].forEach(btn => {
  btn.addEventListener("click", () => {
    sonidoBoton.currentTime = 0;
    sonidoBoton.play();
  });
});

btnContinuar.addEventListener("click", () => {
  menuPausa.style.display = "none";
  musicaFondo.play();
  intervaloJuego = setInterval(mostrarMarmota, velocidadInicial);
  iniciarTiempo();
});

btnReiniciar.addEventListener("click", () => {
  menuPausa.style.display = "none";
  reiniciarJuego(); // 🔁 Esto ya reinicia la música también
});

btnMenu.addEventListener("click", () => {
  musicaFondo.pause();
  musicaFondo.currentTime = 0;
  setTimeout(() => {
    window.location.href = "index.html";
  }, 300);
});

// === Iniciar el juego ===
window.onload = () => {
  seleccionarMarmotaObjetivo();
  reiniciarJuego();

  // iniciar música de fondo
  musicaFondo.play().catch(() => {
    document.body.addEventListener("click", () => musicaFondo.play(), { once: true });
  });
};
