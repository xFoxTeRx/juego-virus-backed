(() => {
  const canvas = document.getElementById('game');
  const wrap = document.getElementById('gameWrap');
  const ctx = canvas.getContext('2d', { alpha: false });

  const scoreBox = document.getElementById('scoreBox');
  const bestBox = document.getElementById('bestBox');

  const startPanel = document.getElementById('startPanel');
  const pausedPanel = document.getElementById('pausedPanel');
  const gameOverPanel = document.getElementById('gameOverPanel');
  const centerPanel = document.getElementById('centerPanel');

  const startBtn = document.getElementById('startBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const restartBtn = document.getElementById('restartBtn');
  const tryBtn = document.getElementById('tryBtn');
  const menuStartBtn = document.getElementById('menuStartBtn');
  const menuOverBtn = document.getElementById('menuOverBtn');
  const finalScore = document.getElementById('finalScore');

  let W,H,scale;
  function resizeCanvas(){
    const rect = wrap.getBoundingClientRect();
    W = Math.max(320, Math.floor(rect.width));
    H = Math.max(480, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    scale = W / 360;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let running=false, paused=false, bird, pipes=[], spawnTimer=0, gravity, flapPower, pipeSpeed, gapSize, score=0;
  let best = Number(localStorage.getItem('flappy_best') || 0);

  bestBox.textContent = 'Mejor: '+best;

  // === SONIDOS ===
  const musicaFondo = new Audio("../../MUSIC/pou2.mp3");
  musicaFondo.loop = true;
  musicaFondo.volume = 0.5;

  const sonidoBoton = new Audio("../../MUSIC/bubble-pop-389501.mp3");
  sonidoBoton.volume = 0.8;

  const sonidoSalto = new Audio("../../MUSIC/cuak.mp3");
  sonidoSalto.volume = 0.6;

  const sonidoChocar = new Audio("../../MUSIC/po.mp3");
  sonidoChocar.volume = 1;

  function reproducirSonidoBoton(callback){
    sonidoBoton.currentTime = 0;
    sonidoBoton.play();
    if(callback) setTimeout(callback, 200);
  }

  function resetGame(){
    bird = {x: W*0.24, y:H*0.56, r:14*scale, vy:0, angle:0, alive:true, onStart:true};
    pipes = []; spawnTimer=0;
    score=0; gapSize = Math.max(90*scale,120*scale);
    pipeSpeed = 2.6*scale; gravity=0.45*scale; flapPower=-7.8*scale;
    updateHUD();
  }
  resetGame();

  function rand(min,max){return Math.random()*(max-min)+min;}
  function spawnPipe(){
    const margin = 40*scale;
    const top = rand(margin,H-margin-gapSize-80*scale);
    pipes.push({x: W+20, top, width:54*scale, passed:false});
  }

  function flap(){
    if(!running){startGame(); return;}
    if(!bird.alive) return;
    bird.vy = flapPower; bird.onStart=false;

    // Sonido al saltar
    sonidoSalto.currentTime = 0;
    sonidoSalto.play();
  }

  function onPointer(e){e.preventDefault(); flap();}
  canvas.addEventListener('pointerdown', onPointer,{passive:false});
  window.addEventListener('keydown', e=>{
    if(e.code==='Space'){e.preventDefault(); flap();}
    if(e.code==='KeyP') togglePause();
  });

  // === BOTONES ===
  [startBtn,resumeBtn,restartBtn,tryBtn,menuStartBtn,menuOverBtn].forEach(btn=>{
    btn.addEventListener('click', ()=> reproducirSonidoBoton());
  });

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', ()=> restartGame());
  tryBtn.addEventListener('click', ()=> restartGame());
  menuStartBtn.addEventListener('click', ()=> volverMenu());
  menuOverBtn.addEventListener('click', ()=> volverMenu());

  function startGame(){
    running=true; paused=false;
    startPanel.style.display='none';
    pausedPanel.style.display='none';
    gameOverPanel.style.display='none';
    centerPanel.style.pointerEvents='none';
    resetGame();
    lastTs=performance.now();
    musicaFondo.play().catch(()=>{document.body.addEventListener('click',()=>musicaFondo.play(),{once:true});});
    requestAnimationFrame(loop);
  }

  function togglePause(){
    if(!running || !bird.alive) return;
    paused=!paused;
    if(paused){
      pausedPanel.style.display='block';
      centerPanel.style.pointerEvents='auto';
    }else{
      pausedPanel.style.display='none';
      centerPanel.style.pointerEvents='none';
      lastTs=performance.now();
      requestAnimationFrame(loop);
    }
  }

  function restartGame(){
    running=true; paused=false;
    resetGame();
    startPanel.style.display='none';
    pausedPanel.style.display='none';
    gameOverPanel.style.display='none';
    centerPanel.style.pointerEvents='none';
    lastTs=performance.now();
    musicaFondo.currentTime = 0;
    musicaFondo.play();
    requestAnimationFrame(loop);
  }

  function volverMenu(){
    musicaFondo.pause();
    musicaFondo.currentTime = 0;
    setTimeout(()=> window.location.href='index.html', 200);
  }

  function collideCircleRect(cx,cy,r,rx,ry,rw,rh){
    const closestX=Math.max(rx,Math.min(cx,rx+rw));
    const closestY=Math.max(ry,Math.min(cy,ry+rh));
    const dx=cx-closestX, dy=cy-closestY;
    return dx*dx + dy*dy <= r*r;
  }

  function updateHUD(){
    scoreBox.textContent='Puntaje: '+Math.floor(score);
    bestBox.textContent='Mejor: '+best;
  }

  let lastTs=performance.now();
  function loop(ts){
    if(!running) return;
    if(paused){ lastTs=ts; return;}
    const dt=Math.min(40,ts-lastTs)/16.6667;
    lastTs=ts;
    update(dt);
    render();
    if(bird.alive) requestAnimationFrame(loop);
  }

  function update(dt){
    spawnTimer+=dt;
    if(spawnTimer>80){spawnPipe(); spawnTimer=0;}
    for(let i=pipes.length-1;i>=0;i--){
      const p=pipes[i]; p.x-=pipeSpeed*dt;
      if(!p.passed && p.x+p.width < bird.x - bird.r){p.passed=true; score++; if(score>best){best=score; localStorage.setItem('flappy_best',best);} updateHUD();}
      if(p.x+p.width < -40) pipes.splice(i,1);
    }
    if(!bird.onStart){ bird.vy+=gravity*dt; bird.y+=bird.vy*dt; bird.angle=Math.max(-0.6,Math.min(1.2,bird.vy*0.03)); }
    else{ bird.y = H*0.56 + Math.sin(Date.now()/300)*3*scale; bird.angle = Math.sin(Date.now()/400)*0.08;}
    const groundY = H-(28*scale);
    if(bird.y+bird.r>groundY){bird.y=groundY-bird.r; die();}
    if(bird.y-bird.r<8){bird.y=8+bird.r; bird.vy=0; die();}
    for(const p of pipes){
      const px=p.x,pw=p.width;
      const topRect={x:px, y:0, w:pw, h:p.top};
      const bottomRect={x:px, y:p.top+gapSize, w:pw, h:H-(p.top+gapSize)-(28*scale)};
      if(collideCircleRect(bird.x,bird.y,bird.r,topRect.x,topRect.y,topRect.w,topRect.h)||
         collideCircleRect(bird.x,bird.y,bird.r,bottomRect.x,bottomRect.y,bottomRect.w,bottomRect.h)) die();
    }
    pipeSpeed = Math.min(4.0*scale, pipeSpeed + 0.0003*scale*dt);
  }

  function die(){
    if(!bird.alive) return;
    bird.alive=false; running=false;
    finalScore.textContent='Puntaje: '+Math.floor(score);
    gameOverPanel.style.display='block';
    centerPanel.style.pointerEvents='auto';
    updateHUD();

    // Sonido al morir
    sonidoChocar.currentTime = 0;
    sonidoChocar.play();
  }

  // --- Renderizado y funciones de dibujo ---
  function render(){
    ctx.fillStyle= getComputedStyle(document.body).getPropertyValue('--bg') || '#8ed0f0';
    ctx.fillRect(0,0,W,H);
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#bfe9ff'); g.addColorStop(1,'#88d0f0'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    drawHill(W*0.2,H*0.8,1.2); drawHill(W*0.6,H*0.86,1.6);
    for(const p of pipes) drawPipe(p.x,p.top,p.width);
    const groundH=28*scale;
    ctx.fillStyle='#deb887'; ctx.fillRect(0,H-groundH,W,groundH);
    ctx.strokeStyle='rgba(0,0,0,0.06)';
    for(let i=0;i<10;i++){ctx.beginPath(); ctx.moveTo(i*40*scale+((Date.now()/50)%40), H-groundH+6*scale); ctx.lineTo(i*40*scale+((Date.now()/50)%40), H-4*scale); ctx.stroke();}
    drawStartHill(); drawBird();
    ctx.fillStyle='rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(bird.x+6*scale,Math.min(H-groundH+2,bird.y+22*scale),bird.r*0.9,bird.r*0.35,0,0,Math.PI*2); ctx.fill();
  }

  function drawHill(cx,baseY,scaleMul){
    ctx.fillStyle='#2e8b57'; ctx.beginPath();
    const w=280*scaleMul*scale;
    ctx.moveTo(cx-w,baseY); ctx.quadraticCurveTo(cx-w*0.3,baseY-80*scaleMul*scale,cx,baseY-40*scaleMul*scale);
    ctx.quadraticCurveTo(cx+w*0.3,baseY-120*scaleMul*scale,cx+w,baseY); ctx.closePath(); ctx.fill();
  }

  function drawStartHill(){
    const baseY=H-(28*scale);
    ctx.fillStyle='#1f6f3f'; ctx.beginPath();
    const cx=W*0.14; ctx.moveTo(0,baseY); ctx.quadraticCurveTo(cx+10*scale,baseY-60*scale,W*0.28,baseY-10*scale);
    ctx.lineTo(0,baseY); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#165b35'; ctx.beginPath(); ctx.ellipse(W*0.12,baseY-8*scale,10*scale,6*scale,0,0,Math.PI*2); ctx.fill();
  }

  function drawPipe(x,top,width){
    ctx.fillStyle='#2b8a2b'; ctx.fillRect(x,0,width,top); ctx.fillRect(x,top+gapSize,width,H-(top+gapSize)-(28*scale));
    ctx.fillStyle='#1f6b1f'; ctx.fillRect(x-8*scale,top-12*scale,width+16*scale,12*scale);
    ctx.fillRect(x-8*scale,top+gapSize+H-(top+gapSize)-(28*scale),width+16*scale,12*scale);
    ctx.fillStyle='rgba(0,0,0,0.06)'; ctx.fillRect(x,0,8*scale,top); ctx.fillRect(x+width-8*scale,0,8*scale,top);
  }

  function drawBird(){
    ctx.save(); ctx.translate(bird.x,bird.y); ctx.rotate(bird.angle);
    ctx.fillStyle='#ffdd57'; ctx.beginPath(); ctx.ellipse(0,0,bird.r*1.15,bird.r,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f0c34d'; ctx.beginPath(); ctx.ellipse(-bird.r*0.1,2*scale,bird.r*0.5,bird.r*0.28,-0.6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(bird.r*0.35,-bird.r*0.15,bird.r*0.22,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff9f1c'; ctx.beginPath(); ctx.moveTo(bird.r*0.9,0); ctx.lineTo(bird.r*1.6,-6*scale); ctx.lineTo(bird.r*1.6,6*scale); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  render();

})();
