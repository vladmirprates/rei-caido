/* Rei Caído — effects engine.
   A particle system (soft additive glows, streaks, smoke and shards) and a bloom pass for the effects in vfx.js.
   Effects emit particles with emitP(); everything is painted into a layer of its own, which is then blurred
   twice (a quarter and an eighth of its size) and added back on top, so bright effects really glow. */

fx.sp = fx.sp || [];
const _spr = {};
// a soft round sprite of one color, cached: drawing it scaled is much cheaper than a gradient per particle
function glowSprite(rgb){
  let s = _spr[rgb]; if (s) return s;
  s = document.createElement('canvas'); s.width = s.height = 64;
  const g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.35, `rgba(${rgb},.55)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return _spr[rgb] = s;
}
const _rnd = (a, b) => a + Math.random()*(b-a);
const _back = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3*Math.pow(t-1, 3) + c1*Math.pow(t-1, 2); };   // overshoots, then settles
// run something once, the first frame the condition holds
const _once = (v, id, cond, fn) => { if (cond && !v['_o'+id]){ v['_o'+id] = 1; fn(); } };
// how many particles to emit this frame for a rate per second (frame-rate independent)
const _rate = (v, id, per) => { const dt = v.t - (v['_l'+id]===undefined ? v.t : v['_l'+id]); v['_l'+id] = v.t; v['_a'+id] = (v['_a'+id]||0) + dt*per; const n = Math.floor(v['_a'+id]); v['_a'+id] -= n; return n; };

/* emitP(n, o): x,y in board pixels. a = direction (radians) with +-spread, or any direction when a is not given.
   s0..s1 speed (tiles/s), l0..l1 life (s), z0..z1 size (tiles) over its life, c / c2 = 'r,g,b' (start / end color),
   al = alpha, g = gravity (tiles/s2, negative rises), drag, add = additive, kind = dot | streak | shard, r = scatter radius (tiles) */
function emitP(n, o){
  if (typeof reduce !== 'undefined' && reduce) n = Math.ceil(n/4);
  else if (fx.lowq) n = Math.ceil(n/2);
  const T = tile, cap = fx.lowq ? 160 : 400;
  for (let i=0;i<n;i++){
    if (fx.sp.length > cap) return;
    const ang = o.a !== undefined ? o.a + _rnd(-(o.spread||0), (o.spread||0)) : _rnd(0, Math.PI*2);
    const sp = _rnd(o.s0||0, o.s1===undefined ? (o.s0||0) : o.s1) * T;
    const ox = o.r ? _rnd(-o.r, o.r)*T : 0, oy = o.r ? _rnd(-o.r, o.r)*T*.6 : 0;
    fx.sp.push({x:o.x+ox, y:o.y+oy, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp, t:-(o.delay ? _rnd(0, o.delay) : 0), life:_rnd(o.l0||.5, o.l1||o.l0||.5),
      s0:o.z0===undefined ? .1 : o.z0, s1:o.z1===undefined ? .02 : o.z1, c:o.c||'255,255,255', c2:o.c2||null, al:o.al===undefined ? 1 : o.al,
      g:(o.g||0)*T, drag:o.drag||0, add:!!o.add, kind:o.kind||'dot', rot:Math.random()*6.28, vr:_rnd(-6, 6), len:o.len||.25});
  }
}
function spTick(dt){
  if (fx.ghosts && fx.ghosts.length){ for (const g of fx.ghosts) g.t += dt; fx.ghosts = fx.ghosts.filter(g => g.t < g.life); }
  if (!fx.sp.length) return;
  for (const p of fx.sp){
    p.t += dt; if (p.t < 0) continue;
    const dr = Math.max(0, 1 - p.drag*dt); p.vx *= dr; p.vy = p.vy*dr + p.g*dt; p.x += p.vx*dt; p.y += p.vy*dt;
  }
  fx.sp = fx.sp.filter(p => p.t < p.life);
}
// a piece that dies: its shape lifts off as a fading ghost while it crumbles into dust and sparks
function deathFx(e){
  if (typeof sqCenter === 'undefined' || !S) return;
  const [x, y] = sqCenter(e.rx !== undefined ? e.rx : e.x, e.ry !== undefined ? e.ry : e.y), T = tile, big = e.boss ? 1.5 : e.elite ? 1.3 : 1;
  const light = (S.color==='w' ? 'b' : 'w') === 'w', body = e.holy || e.side==='holy' ? '240,226,190' : light ? '236,226,206' : '70,52,44', glow = e.elite || e.boss ? '255,200,100' : (e.horde ? '255,120,50' : '200,200,230');
  (fx.ghosts = fx.ghosts || []).push({type:e.type, x, y, sz:T*(e.boss ? 1.1 : .72), life:1.1, t:0, c:e.elite || e.boss ? '255,236,190' : '214,226,248', glow: e.elite || e.boss ? '255,200,100' : '150,185,255'});
  emitP(Math.round(16*big), {x, y:y + T*.05, r:.18, s0:.3, s1:1.8, a:-Math.PI/2, spread:1.7, l0:.6, l1:1.3, z0:.1, z1:.03, c:body, g:-.2, drag:1.2, al:.85});
  emitP(Math.round(10*big), {x, y, r:.15, s0:1, s1:4, l0:.3, l1:.7, z0:.05, z1:.01, c:glow, add:true, kind:'streak', g:3});
  emitP(Math.round(6*big), {x, y, s0:.2, s1:.9, l0:.7, l1:1.3, z0:.14, z1:.36, c:'60,50,50', al:.3, drag:1.5});
  fx.shake = Math.max(fx.shake, e.boss ? 10 : e.elite ? 4 : 2);
  if (e.boss) fx.hitstop = Math.max(fx.hitstop || 0, .06);
}
// the ghost is a cached picture of the piece (drawing text at a new size every frame is slow: the glyph is rasterized again each time)
function drawGhosts(c){
  for (const g of (fx.ghosts || [])){
    const k = g.t/g.life, gold = g.glow === '255,200,100', sp = pieceSprite(GLYPH[g.type], g.sz, gold ? '#ffecbe' : '#d6e2f8', gold ? '#a0762a' : '#5a7aa0', Math.max(2, tile*.06)), gy = g.y - k*tile*.55, s = 1 - k*.25;
    c.save(); c.globalAlpha = Math.max(0, (1-k)*.8);
    c.drawImage(glowSprite(g.glow), g.x - tile*.5, gy - tile*.5, tile, tile);
    c.drawImage(sp.cv, g.x - sp.w*s/2, gy - sp.h*s/2, sp.w*s, sp.h*s);
    c.restore();
  }
}
function drawSp(c){
  drawGhosts(c);
  for (const p of fx.sp){
    if (p.t < 0) continue;
    const k = p.t/p.life, fade = k < .12 ? k/.12 : 1 - (k-.12)/.88, a = Math.max(0, p.al*fade), z = tile*(p.s0 + (p.s1-p.s0)*k);
    const col = p.c2 && k > .5 ? p.c2 : p.c;
    c.globalAlpha = a; c.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
    if (p.kind==='streak'){
      const sp = Math.hypot(p.vx, p.vy) || 1, L = Math.min(tile*p.len*2.5, sp*.06 + tile*.04), ux = p.vx/sp, uy = p.vy/sp;
      c.strokeStyle = `rgba(${col},1)`; c.lineWidth = Math.max(1, z*1.2); c.lineCap = 'round';
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - ux*L, p.y - uy*L); c.stroke();
      c.drawImage(glowSprite(col), p.x - z*1.5, p.y - z*1.5, z*3, z*3);
    } else if (p.kind==='shard'){
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot + p.vr*p.t); c.fillStyle = `rgb(${col})`; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(z, 0); c.lineTo(-z*.4, -z*.55); c.lineTo(-z*.7, z*.3); c.closePath(); c.fill(); c.stroke(); c.restore();
    } else c.drawImage(glowSprite(col), p.x - z, p.y - z, z*2, z*2);
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}

/* the effects layer and the bloom */
let _fxCv = null, _bl1 = null, _bl2 = null;
function fxLayers(){
  const sc = Math.min(1, 1.2/dpr), w = Math.max(1, Math.round(cv.width*sc)), h = Math.max(1, Math.round(cv.height*sc));
  if (!_fxCv){ _fxCv = document.createElement('canvas'); _bl1 = document.createElement('canvas'); _bl2 = document.createElement('canvas'); }
  if (_fxCv.width !== w || _fxCv.height !== h){
    _fxCv.width = w; _fxCv.height = h;
    _bl1.width = Math.max(1, w>>2); _bl1.height = Math.max(1, h>>2); _bl2.width = Math.max(1, w>>3); _bl2.height = Math.max(1, h>>3);
  }
  return _fxCv;
}
function bloomOnto(main, L){
  const b1 = _bl1.getContext('2d'), b2 = _bl2.getContext('2d');
  b1.clearRect(0, 0, _bl1.width, _bl1.height); b1.imageSmoothingEnabled = true; b1.drawImage(L, 0, 0, _bl1.width, _bl1.height);
  b2.clearRect(0, 0, _bl2.width, _bl2.height); b2.imageSmoothingEnabled = true; b2.drawImage(_bl1, 0, 0, _bl2.width, _bl2.height);
  const cw = cv.width/dpr, ch = cv.height/dpr;
  main.save(); main.globalCompositeOperation = 'lighter'; main.imageSmoothingEnabled = true; main.imageSmoothingQuality = 'low';
  main.globalAlpha = .34; main.drawImage(_bl1, 0, 0, cw, ch);
  main.globalAlpha = .28; main.drawImage(_bl2, 0, 0, cw, ch);
  main.restore();
}
