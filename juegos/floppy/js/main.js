// === Fondo animado ===
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const wrap = document.getElementById('menuWrap');

let W, H, scale;
function resizeCanvas() {
  const rect = wrap.getBoundingClientRect();
  W = rect.width;
  H = rect.height;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scale = W / 360;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let offset = 0;
function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#bfe9ff');
  grad.addColorStop(1, '#8ed0f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Colinas
  ctx.fillStyle = '#2e8b57';
  ctx.beginPath();
  for (let i = -1; i < 4; i++) {
    const x = (i * 200 + offset * 0.3) % (W + 200);
    ctx.moveTo(x, H);
    ctx.quadraticCurveTo(x + 100, H - 80 * scale, x + 200, H);
  }
  ctx.closePath();
  ctx.fill();

  // Suelo
  ctx.fillStyle = '#deb887';
  ctx.fillRect(0, H - 30 * scale, W, 30 * scale);
}

function loop() {
  offset -= 1;
  drawBackground();
  requestAnimationFrame(loop);
}
loop();

// === Panel y botones ===
const btnJugar = document.getElementById("btnJugar");
const btnInstrucciones = document.getElementById("btnInstrucciones");
const btnPuntajes = document.getElementById("btnPuntajes");
const btnSalir = document.getElementById("btnSalir");
const panelInstrucciones = document.getElementById("panelInstrucciones");
const panelPuntajes = document.getElementById("panelPuntajes");
const botonesVolver = document.querySelectorAll(".volver");

// === SONIDOS ===
const musicaMenu = new Audio("../../MUSIC/pou1.mp3"); // música de fondo del menú
musicaMenu.loop = true;
musicaMenu.volume = 0.5;

const sonidoBoton = new Audio("../../MUSIC/bubble-pop-389501.mp3");
sonidoBoton.volume = 0.8;

// Iniciar música al cargar el menú
window.addEventListener('load', () => {
  musicaMenu.play().catch(() => {
    document.body.addEventListener('click', () => musicaMenu.play(), { once: true });
  });
});

// === Función auxiliar para reproducir sonido de botón con callback opcional ===
function reproducirSonidoBoton(callback) {
  sonidoBoton.currentTime = 0;
  sonidoBoton.play();
  if (callback) {
    // Redirigir después de 200ms para que el sonido se escuche
    setTimeout(callback, 200);
  }
}

// === Eventos de botones ===
btnJugar.addEventListener("click", () => {
  reproducirSonidoBoton(() => {
    musicaMenu.pause();
    musicaMenu.currentTime = 0;
    window.location.href = "flappy.html";
  });
});

btnInstrucciones.addEventListener("click", () => {
  reproducirSonidoBoton();
  panelInstrucciones.classList.remove("oculto");
});

btnPuntajes.addEventListener("click", () => {
  reproducirSonidoBoton();
  panelPuntajes.classList.remove("oculto");
  const lista = document.getElementById("listaPuntajes");
  const puntajes = JSON.parse(localStorage.getItem("puntajesFlappy")) || [];
  lista.innerHTML = puntajes.length
    ? puntajes.map(p => `<li>🎯 ${p} puntos</li>`).join("")
    : "<li>Aún no hay puntajes.</li>";
});

btnSalir.addEventListener("click", () => {
  reproducirSonidoBoton(() => {
    musicaMenu.pause();
    musicaMenu.currentTime = 0;
    window.location.href = "../../index.html";
  });
});

// Botones volver
botonesVolver.forEach(btn => {
  btn.addEventListener("click", e => {
    reproducirSonidoBoton();
    e.target.parentElement.classList.add("oculto");
  });
});
