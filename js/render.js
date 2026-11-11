/* Rei Caído — canvas rendering and effects */

const cv = $('cv'), mainCtx = cv.getContext('2d');
let ctx = mainCtx;
let tile = 60, dpr = 1, hover = null;
const fx = {parts:[], floats:[], flashes:[], rings:[], beams:[], embers:[], amb:[], vfx:[], shake:0};

// a "step here" marker: dashed circle and a bouncing arrow
function stepMarker(x, y, col, time, solid){
  const cx = (x+.5)*tile, bob = reduce ? 0 : Math.sin(time*4)*tile*.05, top = y*tile + tile*.02 + bob;
  ctx.strokeStyle = `rgba(${col},.85)`; ctx.lineWidth = solid ? 3 : 2; if (!solid) ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.arc(cx, (y+.5)*tile, tile*(.44 + (solid && !reduce ? .03*Math.sin(time*5) : 0)), 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = `rgba(${col},.95)`; ctx.strokeStyle = 'rgba(10,6,4,.9)'; ctx.lineWidth = 1.5;
  const s = solid ? 1.3 : 1;
  ctx.beginPath(); ctx.moveTo(cx - tile*.11*s, top - tile*.12*s); ctx.lineTo(cx + tile*.11*s, top - tile*.12*s); ctx.lineTo(cx, top); ctx.closePath(); ctx.fill(); ctx.stroke();
}
// floor clear: a bouncing gold arrow above the stairs points the way down
function stairsArrow(x, y, time){
  const cx = (x+.5)*tile, bob = reduce ? 0 : Math.sin(time*4)*tile*.06, top = y*tile - tile*.06 + bob, w = tile*.21, h = tile*.3;
  ctx.fillStyle = 'rgba(227,180,86,.97)'; ctx.strokeStyle = 'rgba(10,6,4,.92)'; ctx.lineWidth = Math.max(1.5, tile*.03); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(cx - w*.5, top - h); ctx.lineTo(cx + w*.5, top - h); ctx.lineTo(cx + w*.5, top - h*.45); ctx.lineTo(cx + w, top - h*.45);
  ctx.lineTo(cx, top); ctx.lineTo(cx - w, top - h*.45); ctx.lineTo(cx - w*.5, top - h*.45); ctx.closePath(); ctx.fill(); ctx.stroke();
}
// stairs going down: steps that shrink and darken into the hole
function drawStairs(x, y, time){
  const px = x*tile, py = y*tile, m = tile*.1, w = tile - m*2;
  ctx.fillStyle = '#060404'; ctx.fillRect(px+m, py+m, w, w);
  for (let i=0;i<5;i++){
    const sh = w*.17, sy = py + m + w - sh*(i+1), inset = i*w*.06;
    ctx.fillStyle = `rgb(${120-i*20},${98-i*17},${78-i*14})`;
    ctx.fillRect(px+m+inset, sy, w-inset*2, sh*.72);
    ctx.fillStyle = `rgba(255,230,190,${.22-i*.04})`; ctx.fillRect(px+m+inset, sy, w-inset*2, Math.max(1, sh*.12));
  }
  const g = ctx.createLinearGradient(0, py+m, 0, py+m+w*.6); g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(px+m, py+m, w, w*.6);
  ctx.strokeStyle = `rgba(224,122,50,${reduce ? .7 : .45+.35*Math.sin(time*3)})`; ctx.lineWidth = 2; ctx.strokeRect(px+m, py+m, w, w);
}
// burning ground: flickering tongues of fire with rising sparks (gold for yours, red for the enemy's)
// a stunned piece sleeps: three Z's drift up from it, growing and fading, over a soft blue halo
let _zSpr = null;
function drawSleep(x, y, time){
  const T = tile, cx = (x+.5)*T, cy = (y+.5)*T;
  if (!_zSpr){   // one pre-drawn Z, scaled per frame
    _zSpr = document.createElement('canvas'); _zSpr.width = _zSpr.height = 96; const g = _zSpr.getContext('2d');
    g.font = 'italic 800 64px ' + BF; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#141a3a'; g.strokeText('Z', 48, 50); g.fillStyle = '#e4ecff'; g.fillText('Z', 48, 50);
  }
  glow(cx, cy, T*.7, 'rgba(110,150,255,.22)');
  ctx.save();
  for (let i=0;i<3;i++){
    const ph = reduce ? .3 + i*.25 : ((time*.55 + i/3) % 1);
    const size = T*(.2 + .26*ph)*2.2, px = cx + T*(.22 + .3*ph) + (reduce ? 0 : Math.sin(time*2 + i*2)*T*.04), py = cy - T*(.22 + .5*ph);
    ctx.globalAlpha = Math.max(0, ph < .15 ? ph/.15 : 1 - Math.max(0, (ph-.6)/.4));
    ctx.drawImage(_zSpr, px - size/2, py - size/2, size, size);
  }
  ctx.restore();
}
function drawFlames(x, y, time, hostile, k){
  const bx = x*tile, base = y*tile + tile*.84, cx0 = bx + tile/2;
  glow(cx0, base - tile*.2, tile*.75*k, hostile ? 'rgba(255,60,30,.34)' : 'rgba(255,150,50,.3)');
  ctx.fillStyle = hostile ? 'rgba(90,10,4,.55)' : 'rgba(110,40,8,.5)';
  ctx.beginPath(); ctx.ellipse(cx0, base, tile*.36, tile*.08, 0, 0, Math.PI*2); ctx.fill();
  for (let i=0;i<4;i++){
    const t = reduce ? 0 : time, cx = bx + tile*(.24 + .17*i);
    const h = tile*k*(.34 + .2*Math.abs(Math.sin(t*7 + i*2.1 + x*1.7 + y*.9))), w = tile*.1, sway = reduce ? 0 : Math.sin(t*5 + i)*tile*.04;
    const g = ctx.createLinearGradient(0, base, 0, base - h);
    g.addColorStop(0, hostile ? 'rgba(200,30,15,.95)' : 'rgba(235,80,20,.95)'); g.addColorStop(.55, hostile ? 'rgba(255,110,40,.85)' : 'rgba(255,170,50,.9)'); g.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(cx - w, base);
    ctx.quadraticCurveTo(cx - w*1.2, base - h*.55, cx + sway, base - h);
    ctx.quadraticCurveTo(cx + w*1.2, base - h*.55, cx + w, base); ctx.closePath(); ctx.fill();
  }
  if (!reduce) for (let i=0;i<3;i++){
    const f = (time*.9 + i*.33 + x*.17 + y*.29) % 1;
    ctx.fillStyle = `rgba(255,${200-i*30},90,${(1-f)*.9})`;
    ctx.fillRect(bx + tile*(.3 + .2*i) + Math.sin(time*3+i)*tile*.05, base - f*tile*.75, tile*.035, tile*.035);
  }
}
function burst(x,y,color,n){
  if (reduce) n = Math.ceil(n/4);
  for (let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2, s = 1+Math.random()*2.5;
    fx.parts.push({x:x+.5, y:y+.5, vx:Math.cos(a)*s, vy:Math.sin(a)*s-1, life:.35+Math.random()*.45, max:.8, color});
  }
}
// a number or word drawn once: a soft colored glow, a thick dark outline and a fill that is white-hot at the top
const _fltCache = new Map();
function floatSprite(text, color, big){
  const fs = Math.max(14, tile*.3)*(big ? 1.3 : 1), k = text + '|' + color + '|' + (big ? 1 : 0) + '|' + Math.round(fs*dpr);
  let s = _fltCache.get(k); if (s) return s;
  if (_fltCache.size > 260) _fltCache.clear();
  const c0 = document.createElement('canvas'), m = c0.getContext('2d'); m.font = '800 ' + fs + 'px ' + BF;
  const tw = Math.ceil(m.measureText(text).width), w = tw + Math.ceil(fs*.9), h = Math.ceil(fs*1.8);
  c0.width = Math.ceil(w*dpr); c0.height = Math.ceil(h*dpr);
  const g = c0.getContext('2d'); g.scale(dpr, dpr); g.font = '800 ' + fs + 'px ' + BF; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const cx = w/2, cy = h/2;
  g.shadowColor = color; g.shadowBlur = fs*(big ? .7 : .45); g.fillStyle = color; g.fillText(text, cx, cy); g.shadowBlur = 0;
  g.lineWidth = fs*.14; g.strokeStyle = 'rgba(12,7,4,.92)'; g.strokeText(text, cx, cy);
  const gr = g.createLinearGradient(0, cy - fs*.55, 0, cy + fs*.55); gr.addColorStop(0, '#fffdf4'); gr.addColorStop(.42, color); gr.addColorStop(1, color);
  g.fillStyle = gr; g.fillText(text, cx, cy);
  g.globalCompositeOperation = 'source-atop'; const dk = g.createLinearGradient(0, cy, 0, cy + fs*.55); dk.addColorStop(0, 'rgba(0,0,0,0)'); dk.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = dk; g.fillRect(0, 0, w, h);
  s = {cv:c0, w, h}; _fltCache.set(k, s); return s;
}
// A float keeps a fixed vertical offset, chosen when it first appears: it climbs above whatever is already in its way
function floatOffset(f, xx, yy, w, h, placed, size){
  if (f.dy===undefined){
    // try the spot itself, then above, below and to the sides, so a crowd spreads out instead of piling up at the top
    const cand = [[0,0],[0,-1],[0,1],[-.7,-.5],[.7,-.5],[-.7,.5],[.7,.5],[0,-2],[0,2],[-1.2,0],[1.2,0],[-.7,-1.5],[.7,-1.5],[-.7,1.5],[.7,1.5],[0,-3],[0,3]];
    let best = null, bestHit = 1e9;
    for (const [cx, cy] of cand){
      const x2 = Math.min(size - w/2, Math.max(w/2, xx + cx*w)), y2 = Math.min(size - h/2, Math.max(h/2, yy + cy*h*1.05));
      const L = x2-w/2, R = x2+w/2, T = y2-h/2, B = y2+h/2;
      let hit = 0; for (const p of placed) if (L < p.R && R > p.L && T < p.B && B > p.T) hit++;
      if (hit < bestHit){ bestHit = hit; best = [x2 - xx, y2 - yy]; if (!hit) break; }
    }
    f.dx = best[0]; f.dy = best[1];
  }
  const X = xx + f.dx, Y = yy + f.dy;
  placed.push({L:X-w/2, R:X+w/2, T:Y-h/2, B:Y+h/2});
  return [X, Y];
}
// kills this turn: a gauge in the top-right corner of the board, not a text at the hero
function drawChain(){
  const c = S && S.chainShow; if (!c) return;
  const cw = cv.width/dpr, a = Math.max(0, Math.min(1, (2.2 - c.t)/.5)), pop = 1 + .5*Math.max(0, 1 - c.t/.18);
  const fs = Math.max(22, tile*.55)*(1 + Math.min(.6, c.n*.05))*pop;
  ctx.save(); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.globalAlpha = a; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
  ctx.font = `700 ${fs}px ${BF}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,6,4,.9)'; ctx.strokeText('×'+c.n, cw-12, 8); ctx.fillStyle = '#ffcf6a'; ctx.fillText('×'+c.n, cw-12, 8);
  ctx.font = `700 ${Math.max(11, tile*.2)}px ${BF}`; ctx.lineWidth = 3; ctx.strokeText($t('abates', 'kills'), cw-12, 8+fs); ctx.fillStyle = '#e3b456'; ctx.fillText($t('abates', 'kills'), cw-12, 8+fs);
  ctx.restore();
}
function floatText(x,y,text,color,scale){ const n = fx.floats.filter(q => q.t < .3).length; fx.floats.push({x:x+.5+(Math.random()-.5)*.3, y:y+.25, text, color, t:-Math.min(.9, n*.09), scale:scale||1}); }

function resize(){
  const r = cv.parentElement.getBoundingClientRect();
  if (!r.width) return;
  const size = Math.max(200, Math.floor(r.width));
  dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(size*dpr); cv.height = Math.round(size*dpr);
  tile = size/W;
}
new ResizeObserver(resize).observe(cv.parentElement);

const sqCenter = (x,y) => [(x+.5)*tile, (y+.5)*tile];


/* Ascension emblems: every subclass is recognizable on the board by what the piece carries or wears */
function drawAscProp(id, col, cx, cy, sz, down, time){
  const t = tile, pulse = reduce ? .7 : .65 + .25*Math.sin(time*3.2), x0 = cx + sz*.34, y0 = cy + down + sz*.18, top = y0 - sz*.62, head = cy + down - sz*.5;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const line = (x1,y1,x2,y2,c,w) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); };
  const glow = (x,y,r,c,a) => { const g = ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,'rgba(255,255,255,'+a+')'); g.addColorStop(.4,'rgba('+c+','+a+')'); g.addColorStop(1,'rgba('+c+',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); };
  const rod = (c) => { line(x0 - sz*.04, y0, x0, top, '#2a1f18', Math.max(3, t*.07)); line(x0 - sz*.04, y0, x0, top, c, Math.max(1.5, t*.035)); };
  const dot = (x,y,r,fill,stroke) => { ctx.fillStyle = fill; ctx.strokeStyle = stroke || '#e3b456'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); if (stroke!==false) ctx.stroke(); };
  switch (id){
    case 'arcane': { rod('#e3b456'); glow(x0, top, t*.2, col || '190,140,255', pulse); dot(x0, top, t*.065, 'rgb(' + (col || '190,140,255') + ')'); break; }       // scepter, orb in the element's color
    case 'necro': { rod('#cdbb9c'); dot(x0, top, t*.07, '#e8dfc8', '#2a1f18'); glow(x0, top - t*.08, t*.18, '150,60,210', pulse*.8); break; }                    // bone staff, violet flame
    case 'regent': { line(x0, y0, x0, top, '#2a1f18', Math.max(3, t*.06)); ctx.fillStyle = '#c0392b'; ctx.strokeStyle = '#e3b456'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0 + t*.2, top + t*.05 + Math.sin(time*4)*t*.015); ctx.lineTo(x0, top + t*.2); ctx.closePath(); ctx.fill(); ctx.stroke(); break; }   // banner
    case 'duelist': { line(x0 + sz*.05, y0 + sz*.1, x0 - sz*.05, top, '#cfe0f0', Math.max(1.5, t*.03)); line(x0 + sz*.1, y0 - sz*.02, x0 - sz*.02, y0 - sz*.1, '#e3b456', Math.max(2, t*.045)); break; }  // rapier
    case 'lancer': { line(x0 - sz*.2, y0 + sz*.15, x0 + sz*.12, top - sz*.1, '#5a4636', Math.max(3, t*.06)); line(x0 + sz*.08, top - sz*.02, x0 + sz*.16, top - sz*.22, '#cfe0f0', Math.max(2.5, t*.05)); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(x0 + sz*.03, top + sz*.08); ctx.lineTo(x0 - sz*.1, top + sz*.16); ctx.lineTo(x0 + sz*.02, top + sz*.18); ctx.fill(); break; }   // lance with a pennant
    case 'dread': { glow(cx, cy + down - sz*.05, t*.55, '190,30,30', .35*pulse); dot(cx - sz*.12, head + sz*.1, t*.03, '#ff4a3a', false); dot(cx + sz*.12, head + sz*.1, t*.03, '#ff4a3a', false); break; }    // red aura and glowing eyes
    case 'bulwark': { const sx = cx - sz*.42, sy = cy + down + sz*.02; ctx.fillStyle = '#6a7684'; ctx.strokeStyle = '#e3b456'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx - t*.09, sy - t*.14); ctx.lineTo(sx + t*.09, sy - t*.14); ctx.lineTo(sx + t*.09, sy + t*.04); ctx.lineTo(sx, sy + t*.16); ctx.lineTo(sx - t*.09, sy + t*.04); ctx.closePath(); ctx.fill(); ctx.stroke(); break; }  // tower shield
    case 'siege': { line(x0 - sz*.06, y0 + sz*.08, x0 + sz*.04, top + sz*.05, '#5a4636', Math.max(3, t*.06)); ctx.fillStyle = '#3a3f48'; ctx.strokeStyle = '#e3b456'; ctx.lineWidth = 1.5; ctx.fillRect(x0 - t*.06, top - t*.02, t*.18, t*.12); ctx.strokeRect(x0 - t*.06, top - t*.02, t*.18, t*.12); break; }   // mallet
    case 'forge': { glow(cx, cy + down + sz*.1, t*.5, '255,120,40', .4*pulse); if (!reduce && Math.random()<.25) fx.embers.push({x:(cx/t)-.2+Math.random()*.4, y:(cy/t)+.1, vy:-(.5+Math.random()*.6), life:1, c:'255,150,60'}); line(x0 - sz*.05, y0, x0, top + sz*.08, '#2a1f18', Math.max(3, t*.06)); ctx.fillStyle = '#ff8a3c'; ctx.fillRect(x0 - t*.08, top - t*.02, t*.2, t*.09); break; }   // glowing hammer, embers
    case 'inquisitor': { rod('#8a6a1f'); line(x0 - t*.08, top + t*.07, x0 + t*.08, top + t*.07, '#e3b456', Math.max(2, t*.04)); line(x0, top - t*.02, x0, top + t*.18, '#e3b456', Math.max(2, t*.04)); break; }   // cross staff
    case 'saint': { ctx.strokeStyle = 'rgba(240,214,140,' + (.55 + .3*pulse) + ')'; ctx.lineWidth = Math.max(2, t*.04); ctx.beginPath(); ctx.ellipse(cx, head - sz*.08, t*.17, t*.05, 0, 0, Math.PI*2); ctx.stroke(); glow(cx, head - sz*.08, t*.25, '240,214,140', .25*pulse); break; }   // halo
    case 'heretic': { ctx.fillStyle = '#7a1f2a'; ctx.strokeStyle = '#2a1f18'; ctx.lineWidth = 1; for (const s of [-1, 1]){ ctx.beginPath(); ctx.moveTo(cx + s*sz*.1, head); ctx.quadraticCurveTo(cx + s*sz*.3, head - sz*.05, cx + s*sz*.24, head - sz*.25); ctx.quadraticCurveTo(cx + s*sz*.17, head - sz*.1, cx + s*sz*.06, head); ctx.fill(); ctx.stroke(); } break; }   // horns
    case 'blood': { glow(cx, cy + down, t*.5, '200,30,50', .3*pulse); line(x0 + sz*.04, y0 + sz*.1, x0 - sz*.04, top, '#c0392b', Math.max(2, t*.04)); dot(x0 - sz*.03, y0 + sz*.25, t*.02, '#c0392b', false); break; }   // red aura, crimson blade
    case 'frost': { ctx.fillStyle = 'rgba(190,230,255,.95)'; ctx.strokeStyle = '#6a9cc0'; ctx.lineWidth = 1; for (const [dx, h] of [[-.14, .15], [0, .24], [.14, .15]]){ ctx.beginPath(); ctx.moveTo(cx + dx*t - t*.04, head); ctx.lineTo(cx + dx*t, head - h*t); ctx.lineTo(cx + dx*t + t*.04, head); ctx.closePath(); ctx.fill(); ctx.stroke(); } break; }   // crown of ice
    case 'assassin': { line(x0 + sz*.05, y0 + sz*.08, x0 - sz*.02, y0 - sz*.2, '#cfe0f0', Math.max(2, t*.04)); line(x0 + sz*.08, y0 + sz*.02, x0 - sz*.01, y0 - sz*.02, '#2a1f18', Math.max(2.5, t*.05)); glow(cx, cy + down + sz*.2, t*.5, '40,20,70', .5); break; }   // dagger and shadow
  }
  ctx.restore();
}
// lighten (amt>0) or darken (amt<0) a #rrggbb color
function shadeHex(hex, amt){
  const n = parseInt(hex.slice(1), 16), ch = s => { const v = (n >> s) & 255; return Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255-v)*amt : v*(1+amt)))); };
  return 'rgb(' + ch(16) + ',' + ch(8) + ',' + ch(0) + ')';
}
// a piece drawn once into a small canvas with a lit top, a dark base, a soft specular highlight and an outline, then reused every frame
const _pcCache = new Map();
function pieceSprite(ch, sz, fill, stroke, lw){
  const k = ch + '|' + Math.round(sz*dpr) + '|' + fill + '|' + stroke + '|' + Math.round(lw*10);
  let s = _pcCache.get(k); if (s) return s;
  if (_pcCache.size > 200) _pcCache.clear();
  const pad = Math.ceil(sz*.35), w = Math.ceil((sz + pad*2)*dpr), cvs = document.createElement('canvas'); cvs.width = w; cvs.height = w;
  const c = cvs.getContext('2d'); c.scale(dpr, dpr);
  const cx = w/dpr/2, cy = w/dpr/2;
  c.font = sz + 'px ' + GF; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const g = c.createLinearGradient(0, cy - sz*.5, 0, cy + sz*.5); g.addColorStop(0, shadeHex(fill, .07)); g.addColorStop(.55, fill); g.addColorStop(1, shadeHex(fill, -.26));
  c.fillStyle = g; c.fillText(ch, cx, cy);
  c.globalCompositeOperation = 'source-atop';
  const hl = c.createRadialGradient(cx - sz*.22, cy - sz*.28, sz*.02, cx - sz*.08, cy - sz*.1, sz*.55); hl.addColorStop(0, 'rgba(255,255,255,.13)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hl; c.fillRect(0, 0, w, w);
  const sh = c.createLinearGradient(0, cy, 0, cy + sz*.5); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.18)'); c.fillStyle = sh; c.fillRect(0, 0, w, w);
  c.globalCompositeOperation = 'destination-over'; c.strokeStyle = stroke; c.lineWidth = lw; c.strokeText(ch, cx, cy);
  s = {cv:cvs, w:w/dpr, h:w/dpr}; _pcCache.set(k, s); return s;
}
let _shSpr = null, _aoSpr = null;
function softSprite(a0, a1){ const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,' + a0 + ')'); gr.addColorStop(.6, 'rgba(0,0,0,' + a1 + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; }
function drawPiece(type, x, y, side, o){
  const cx=(x+.5)*tile, cy=(y+.5)*tile, time = performance.now()/1000;
  let sz = tile*(o.boss ? 1.15 : o.ally || o.fodder ? 0.58 : 0.72);
  // big pieces on the top row would poke out of the board: measure the glyph and,
  // instead of pushing it down onto its health bar, drop the lift and shrink it to fit
  ctx.font = `${sz}px ${GF}`; ctx.textBaseline = 'middle';
  const asc = (ctx.measureText(GLYPH[type]) || {}).actualBoundingBoxAscent || sz*.62;
  const room = cy - tile*.04 - 3;
  const lift = Math.max(0, Math.min(o.boss ? tile*.12 : 0, room - asc));
  const down = o.boss ? tile*.05 : tile*.13;   // pieces stand on their shadow instead of floating above it
  if (asc > room) sz = Math.min(sz, Math.max(sz*room/asc, tile*.88));
  if (o.boss){
    const pulse = reduce ? .5 : .5+.2*Math.sin(time*3);
    const col = o.holy ? `rgba(240,214,140,${pulse})` : `rgba(200,40,30,${pulse})`;
    const g = ctx.createRadialGradient(cx,cy+tile*.2,0,cx,cy+tile*.2,tile*1.15);
    g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(cx-tile*1.2, cy-tile*1.1, tile*2.4, tile*2.4);
    ctx.strokeStyle = o.holy ? 'rgba(240,214,140,.8)' : 'rgba(227,180,86,.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy+tile*.32, tile*.46, tile*.14, 0, 0, Math.PI*2); ctx.stroke();
  } else if (o.player || o.elite || o.rift || o.spectral || o.horde){
    const g = ctx.createRadialGradient(cx,cy+tile*.15,0,cx,cy+tile*.15,tile*.6);
    g.addColorStop(0, o.horde ? `rgba(255,110,40,${reduce ? .4 : .3+.14*Math.sin(time*5+x*1.7+y)})` : o.player ? 'rgba(224,122,50,.42)' : o.rift ? 'rgba(180,140,255,.45)' : o.spectral ? 'rgba(170,205,240,.35)' : 'rgba(227,180,86,.42)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(cx-tile*.6, cy-tile*.45, tile*1.2, tile*1.2);
  }
  if (o.attacking){
    ctx.strokeStyle = 'rgba(226,78,60,.95)'; ctx.lineWidth = Math.max(1.5,tile*.035);
    ctx.beginPath(); ctx.ellipse(cx, cy+tile*.3, tile*(o.boss?.5:.32), tile*(o.boss?.15:.1), 0, 0, Math.PI*2); ctx.stroke();
  }
  { // a soft contact shadow under the piece
    const sw = tile*(o.boss?.46:.3), sy = cy+tile*.3+down*.6;
    _shSpr = _shSpr || softSprite(.65, .35);
    ctx.drawImage(_shSpr, cx - sw, sy - sw*.32, sw*2, sw*.64);
  }
  if (o.ally){
    ctx.strokeStyle = 'rgba(227,180,86,.85)'; ctx.lineWidth = Math.max(1.5,tile*.03);
    ctx.beginPath(); ctx.ellipse(cx, cy+tile*.3, tile*.26, tile*.08, 0, 0, Math.PI*2); ctx.stroke();
  }
  ctx.font = `${sz}px ${GF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, tile*(o.boss?.06:.035));
  let fill, stroke;
  if (o.boss){ fill = o.holy ? '#efe3bf' : '#7d1414'; stroke = o.holy ? '#8a6a1f' : '#e3b456'; }
  else if (o.frozen){ fill = side==='w' ? '#eef6fc' : '#3a5068'; stroke = '#cfe6f5'; }
  else { const white = side==='w'; fill = o.spectral ? '#dbe8f5' : white ? '#f1e7d3' : '#1b1411'; stroke = o.horde ? '#ff8a4a' : o.herald ? '#ff4a3a' : o.rival ? '#8fd18a' : o.rift ? '#b48cff' : o.elite ? '#e3b456' : o.spectral ? '#5a7a9e' : white ? '#2a1f18' : '#cdbb9c'; }
  if (o.flash) fill = '#fff4e0';   // hit flash
  { const sp = pieceSprite(GLYPH[type], sz, fill, stroke, ctx.lineWidth*1.7), br = reduce ? 0 : Math.sin(time*2.2 + x*1.3 + y*.7);   // it breathes a little
    ctx.save(); ctx.translate(cx, cy - lift + down + sz*.45); ctx.scale(1 + .012*br, 1 + .024*br);
    ctx.drawImage(sp.cv, -sp.w/2, -sp.h/2 - sz*.45, sp.w, sp.h); ctx.restore(); }
  if (o.prop) drawAscProp(o.prop, o.propColor, cx, cy, sz, down, time);   // ascension: each subclass carries its own emblem
  if (o.horde && !reduce && Math.random()<.012) fx.embers.push({x:x+.3+Math.random()*.4, y:y+.6, vy:-(.5+Math.random()*.6), life:.8, c:'255,120,50'});
  if (o.boss && !reduce && Math.random()<.35){
    fx.embers.push({x:x+.2+Math.random()*.6, y:y+.7, vy:-(.6+Math.random()*.8), life:1, c:o.holy ? '240,214,140' : '240,110,50'});
  }
}
// Modifier icons: vector line icons (24x24 paths), one per modifier, drawn in a row above the piece.
// [color, path, filled]. The same paths feed the tooltip chips (modIconSvg in ui.js).
const MOD_ICON = {
  armor:['#a9bfd6','M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',1],
  vamp:['#e0524a','M12 3c3 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-6.5 6-11z',1],
  swift:['#ecd36a','M5 6l6 6-6 6M13 6l6 6-6 6',0],
  explode:['#f08a3c','M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4',0],
  thorns:['#8fd18a','M3 20l3-11 3 7 3-12 3 12 3-7 3 11z',1],
  regen:['#7fb069','M12 4v16M4 12h16',0],
  double:['#ff7a5e','M5 4l8 16M12 4l8 16',0],
  trample:['#cdbb9c','M12 4v12M6 11l6 6 6-6M5 21h14',0],
  fastSummon:['#c9a0ff','M12 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 20c0-4 3-6 6-6s6 2 6 6z',1],
  submerge:['#7fb0a8','M3 9c3-3 6 3 9 0s6 3 9 0M3 16c3-3 6 3 9 0s6 3 9 0',0],
  lavaTrail:['#ff7a2a','M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-7 1-10z',1],
  frost:['#9fd3ff','M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9',0],
  enraged:['#e04a3a','M12 4v11M12 19.5v.5',0]
};
const MOD_PATH = {}; for (const k in MOD_ICON) MOD_PATH[k] = new Path2D(MOD_ICON[k][1]);
// a row of icons centered above the piece, straddling the top edge of its square
function modBadges(u, x, y){
  const list = (u.mods||[]).filter(m => MOD_ICON[m]).slice(0,4); if (!list.length) return;
  const s = Math.max(11, tile*.2), gap = 2, total = list.length*s + (list.length-1)*gap;
  // pieces: a column on the left edge of the square. Bosses are bigger than their square: their row sits under the health bar
  const vert = !u.boss;
  let bx = vert ? x*tile + tile*.04 : (x+.5)*tile - total/2, by = vert ? (y+.5)*tile - total/2 : (y+1)*tile - tile*.05;
  const pw = vert ? s+6 : total+6, ph = vert ? total+6 : s+6;
  ctx.fillStyle = 'rgba(10,6,4,.82)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx-3, by-3, pw, ph, 5) : ctx.rect(bx-3, by-3, pw, ph); ctx.fill();
  for (const m of list){
    const [col, , filled] = MOD_ICON[m];
    ctx.save(); ctx.translate(bx, by); ctx.scale(s/24, s/24);
    ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col;
    if (filled){ ctx.fillStyle = col + '55'; ctx.fill(MOD_PATH[m]); }
    ctx.stroke(MOD_PATH[m]); ctx.restore();
    if (vert) by += s + gap; else bx += s + gap;
  }
}
function hpBar(u, x, y, color, preview, time){
  const w = tile*(u.boss?.9:.56), h = Math.max(3, tile*(u.boss?.08:.055));
  const bx = (x+.5)*tile - w/2, by = (y+1)*tile - h - tile*.11;
  const fill = w*Math.max(0,u.hp)/u.maxHp;
  ctx.fillStyle = 'rgba(8,5,3,.88)'; ctx.fillRect(bx-1.5, by-1.5, w+3, h+3);
  ctx.fillStyle = color; ctx.fillRect(bx, by, fill, h);
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(bx, by, fill, h*.35); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(bx, by + h*.65, fill, h*.35);
  if (u.shield>0){
    const sw = Math.min(w, w*u.shield/u.maxHp), sh = Math.max(2, h*.6);
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(bx-1, by-sh-3, sw+2, sh+2);
    ctx.fillStyle = '#a9bfd6'; ctx.fillRect(bx, by-sh-2, sw, sh);
  }
  if (preview && preview.dmg>0){
    const cut = Math.min(fill, w*preview.dmg/u.maxHp);
    ctx.globalAlpha = reduce ? .85 : .55+.4*Math.sin(time*7);
    ctx.fillStyle = '#ffd9a8'; ctx.fillRect(bx+fill-cut, by, cut, h);
    ctx.globalAlpha = 1;
  }
}
function warnMark(x, y){
  const bx = (x+1)*tile - tile*.2, by = y*tile + tile*.08, s = tile*.16;
  ctx.fillStyle = '#ecd36a'; ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx+s*.6, by+s); ctx.lineTo(bx-s*.6, by+s); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a120c'; ctx.font = `700 ${s*.8}px ${BF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('!', bx, by+s*.62);
}
/* ---------- biome look ---------- */
const hh = (x,y,i) => {
  let n = Math.imul(x|0,374761393) + Math.imul(y|0,668265263) + Math.imul((i|0) + ((S && S.fseed)|0), 1442695041);
  n = Math.imul(n ^ (n>>>13), 1274126177);
  return ((n ^ (n>>>16))>>>0) / 4294967296;
};
const LOOK = {
  crypt:    {a:'#40352b', b:'#2c241d', dark:'8,5,3',  dim:.6,  reach:.68},
  swamp:    {a:'#3b4a32', b:'#2a3624', dark:'5,12,8', dim:.52, reach:.74},
  forge:    {a:'#382821', b:'#241914', dark:'16,3,0', dim:.6,  reach:.72},
  cathedral:{a:'#5b6573', b:'#2c333e', dark:'6,10,22',dim:.42, reach:.95},
  ash:      {a:'#6f5d43', b:'#54452f', dark:'20,11,4', dim:.5, reach:.85},
  sea:      {a:'#2c4a55', b:'#1f3641', dark:'2,10,16', dim:.58, reach:.75},
  storm:    {a:'#3d475b', b:'#283042', dark:'3,7,18',  dim:.6,  reach:.8},
  tar:      {a:'#54483a', b:'#3a3128', dark:'12,7,3', dim:.5,  reach:.78},
  fungal:   {a:'#3d3249', b:'#271f33', dark:'7,3,15', dim:.6,  reach:.7}
};
let floorCv = null, floorKey = '';
function floorLayer(){
  const k = `${S.biome}|${W}|${H}|${tile}|${dpr}|${S.fseed}`;
  if (floorCv && floorKey===k) return floorCv;
  floorKey = k;
  floorCv = floorCv || document.createElement('canvas');
  floorCv.width = Math.max(1, Math.round(W*tile*dpr)); floorCv.height = Math.max(1, Math.round(H*tile*dpr));
  const c = floorCv.getContext('2d');
  c.setTransform(dpr,0,0,dpr,0,0);
  paintFloor(c);
  return floorCv;
}
// a jagged crack inside one tile; r(i) gives stable per-tile randoms
function crackPath(c, px, py, r, n){
  const T = tile, cl = (v,o) => Math.min(o+T-2, Math.max(o+2, v));
  let cx = px+T*(.15+r(0)*.7), cy = py+T*(.15+r(1)*.7);
  c.beginPath(); c.moveTo(cx,cy);
  for (let k=0;k<n;k++){ cx = cl(cx+(r(2+k)-.5)*T*.4, px); cy = cl(cy+(r(6+k)-.5)*T*.4, py); c.lineTo(cx,cy); }
}
function blot(c, x, y, rad, col, a){
  const g = c.createRadialGradient(x,y,0,x,y,rad);
  g.addColorStop(0,`rgba(${col},${a})`); g.addColorStop(1,`rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(x-rad, y-rad, rad*2, rad*2);
}
function paintFloor(c){
  const L = LOOK[S.biome] || LOOK.crypt, b = S.biome, T = tile;
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){
    const px=x*T, py=y*T, r = i => hh(x,y,i), light = (x+y)%2===0;
    c.save(); c.beginPath(); c.rect(px,py,T,T); c.clip();
    c.fillStyle = light ? L.a : L.b; c.fillRect(px,py,T,T);
    const v = r(1)-.5;
    c.fillStyle = v>0 ? `rgba(255,240,220,${v*.08})` : `rgba(0,0,0,${-v*.22})`; c.fillRect(px,py,T,T);
    // a soft light from the upper left on every square (real depth instead of a flat color)
    { const bg = c.createLinearGradient(px, py, px+T, py+T); bg.addColorStop(0, 'rgba(255,248,235,.06)'); bg.addColorStop(1, 'rgba(0,0,0,.14)'); c.fillStyle = bg; c.fillRect(px, py, T, T); }
    // a little grain on everything
    c.fillStyle = 'rgba(255,255,255,.05)'; for (let i=0;i<6;i++) c.fillRect(px + T*r(100+i), py + T*r(110+i), 1.2, 1.2);
    c.fillStyle = 'rgba(0,0,0,.18)'; for (let i=0;i<6;i++) c.fillRect(px + T*r(120+i), py + T*r(130+i), 1.4, 1.4);
    if (b==='crypt'){
      // flagstones: a split slab, chips, cracks, lichen in the joints, damp sheen, rubble, old blood, the odd bone or skull
      if (r(60)<.45){ const sx = px + T*(.3 + r(61)*.4), dx = (r(62)-.5)*T*.1; c.strokeStyle = 'rgba(0,0,0,.42)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(sx, py); c.lineTo(sx+dx, py+T); c.stroke(); c.strokeStyle = 'rgba(255,240,220,.07)'; c.beginPath(); c.moveTo(sx+1.6, py); c.lineTo(sx+1.6+dx, py+T); c.stroke(); }
      if (r(2)<.5){ c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=1; crackPath(c,px,py,i=>r(20+i),3); c.stroke(); }
      for (let i=0;i<2;i++) if (r(140+i)<.5){ const cx0 = px + T*(.1 + r(142+i)*.8), cy0 = py + T*(.1 + r(144+i)*.8), s = T*(.03 + r(146+i)*.04);
        c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.moveTo(cx0, cy0 - s); c.lineTo(cx0 + s*1.2, cy0 + s*.3); c.lineTo(cx0 - s*.6, cy0 + s); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,240,220,.1)'; c.fillRect(cx0 - s*.6, cy0 - s*.6, s*.5, 1); }
      if (r(63)<.3){ const lx = px + T*r(64), ly = py + T*r(65); blot(c, lx, ly, T*(.18 + r(66)*.2), '92,112,72', .3); c.fillStyle = 'rgba(130,160,90,.5)'; for (let i=0;i<5;i++) c.fillRect(lx + (r(150+i)-.5)*T*.3, ly + (r(155+i)-.5)*T*.3, 1.6, 1.6); }
      if (r(67)<.25){ c.fillStyle = 'rgba(170,195,210,.07)'; c.beginPath(); c.ellipse(px + T*(.3 + r(68)*.4), py + T*(.3 + r(69)*.4), T*.22, T*.09, r(70)*3, 0, Math.PI*2); c.fill(); }
      if (r(13)<.12) blot(c, px+T*r(14), py+T*r(15), T*.35, '70,14,8', .4);
      if (r(12)<.14){
        const bx=px+T*(.25+r(16)*.5), by=py+T*(.25+r(17)*.5), a=r(18)*Math.PI, l=T*.11;
        c.strokeStyle='rgba(196,182,156,.55)'; c.lineWidth=Math.max(1.5,T*.035); c.lineCap='round';
        c.beginPath(); c.moveTo(bx-Math.cos(a)*l,by-Math.sin(a)*l); c.lineTo(bx+Math.cos(a)*l,by+Math.sin(a)*l); c.stroke();
        c.fillStyle='rgba(196,182,156,.55)';
        for (const s of [-1,1]){ c.beginPath(); c.arc(bx+s*Math.cos(a)*l, by+s*Math.sin(a)*l, T*.03, 0, Math.PI*2); c.fill(); }
      } else if (r(68)<.035){
        const sx = px + T*(.3 + r(160)*.4), sy = py + T*(.35 + r(161)*.3), s = T*.07;   // a small skull
        c.fillStyle = 'rgba(200,190,168,.6)'; c.beginPath(); c.arc(sx, sy, s, 0, Math.PI*2); c.fill(); c.fillRect(sx - s*.55, sy + s*.5, s*1.1, s*.7);
        c.fillStyle = 'rgba(20,14,10,.8)'; c.beginPath(); c.arc(sx - s*.35, sy, s*.26, 0, Math.PI*2); c.arc(sx + s*.35, sy, s*.26, 0, Math.PI*2); c.fill();
      }
      c.fillStyle='rgba(0,0,0,.25)';
      for (let i=0;i<4;i++) c.fillRect(px+T*r(30+i), py+T*r(40+i), T*.04, T*.04);
    } else if (b==='swamp'){
      if (r(2)<.55) blot(c, px+T*r(3), py+T*r(4), T*(.3+r(5)*.2), '18,16,6', .45);
      if (r(6)<.5) blot(c, px+T*r(7), py+T*r(8), T*.4, '100,140,60', .28);
      if (r(9)<.55){
        const gx=px+T*(.2+r(10)*.6), gy=py+T*(.3+r(11)*.6);
        c.strokeStyle='rgba(120,160,80,.6)'; c.lineWidth=1.2; c.lineCap='round'; c.beginPath();
        for (let k=0;k<5;k++){ const a=-Math.PI/2+(k-2)*.28, l=T*(.08+r(12+k)*.08); c.moveTo(gx+(k-2)*1.5,gy); c.lineTo(gx+(k-2)*1.5+Math.cos(a)*l, gy+Math.sin(a)*l); }
        c.stroke();
      }
      if (r(20)<.25){ c.fillStyle='rgba(120,120,105,.45)'; c.beginPath(); c.ellipse(px+T*r(21),py+T*r(22),T*.035,T*.025,0,0,Math.PI*2); c.fill(); }
    } else if (b==='forge'){
      // basalt plates with beveled edges and rivets, glowing cracks, ash and soot, scattered embers, scratched metal
      c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1.5; c.strokeRect(px + T*.07, py + T*.07, T*.86, T*.86);
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(px + T*.07, py + T*.93); c.lineTo(px + T*.93, py + T*.93); c.lineTo(px + T*.93, py + T*.07); c.stroke();
      if (r(2)<.45) blot(c, px+T*r(3), py+T*r(4), T*.4, '0,0,0', .45);
      if (r(90)<.2) blot(c, px + T*r(91), py + T*r(92), T*.32, '170,160,150', .12);
      if (r(5)<.4){
        c.shadowColor='rgba(255,110,30,.9)'; c.shadowBlur=T*.12;
        c.strokeStyle='rgba(255,110,40,.6)'; c.lineWidth=Math.max(1.2,T*.025); crackPath(c,px,py,i=>r(50+i),4); c.stroke();
        c.shadowBlur=0; c.strokeStyle='rgba(255,220,140,.5)'; c.lineWidth=.8; crackPath(c,px,py,i=>r(50+i),4); c.stroke();
      }
      c.fillStyle='rgba(0,0,0,.5)'; c.strokeStyle='rgba(255,255,255,.1)'; c.lineWidth = 1;
      for (const [ax,ay] of [[.13,.13],[.87,.13],[.13,.87],[.87,.87]]){ c.beginPath(); c.arc(px+T*ax,py+T*ay,T*.028,0,Math.PI*2); c.fill(); c.stroke(); }
      if (r(93)<.3){ c.strokeStyle = 'rgba(200,200,210,.14)'; c.lineWidth = 1; c.beginPath(); for (let i=0;i<3;i++){ const yy = py + T*(.2 + r(94+i)*.6); c.moveTo(px + T*.2, yy); c.lineTo(px + T*(.45 + r(97+i)*.3), yy + (r(100+i)-.5)*T*.1); } c.stroke(); }
      if (r(101)<.3){ c.fillStyle = 'rgba(255,150,50,.7)'; for (let i=0;i<3;i++) c.fillRect(px + T*r(102+i), py + T*r(105+i), 1.6, 1.6); }
      if (r(8)<.07){
        const g=c.createRadialGradient(px+T/2,py+T/2,0,px+T/2,py+T/2,T*.35); g.addColorStop(0,'rgba(255,120,30,.55)'); g.addColorStop(1,'rgba(120,20,0,.2)');
        c.fillStyle=g; c.fillRect(px+T*.2,py+T*.2,T*.6,T*.6);
        c.strokeStyle='#120a08'; c.lineWidth=T*.04; c.strokeRect(px+T*.2,py+T*.2,T*.6,T*.6);
        c.beginPath(); for (let k=1;k<4;k++){ c.moveTo(px+T*(.2+k*.15),py+T*.2); c.lineTo(px+T*(.2+k*.15),py+T*.8); } c.stroke();
      }
    } else if (b==='cathedral'){
      // polished marble: veins, a diagonal sheen, a gold inlay, frost in the corners, the odd carved cross
      c.strokeStyle = light ? 'rgba(255,255,255,.16)' : 'rgba(150,175,210,.12)'; c.lineWidth=1;
      for (let k=0;k<2;k++){ c.beginPath(); c.moveTo(px, py+T*r(2+k)); c.bezierCurveTo(px+T*.3,py+T*r(4+k),px+T*.7,py+T*r(6+k),px+T,py+T*r(8+k)); c.stroke(); }
      if (r(110)<.55){ c.strokeStyle = 'rgba(95,112,140,.22)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(px + T*r(111), py); c.bezierCurveTo(px + T*r(112), py + T*.35, px + T*r(113), py + T*.65, px + T*r(114), py + T); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = .8; c.stroke(); }
      { const sg = c.createLinearGradient(px, py, px + T, py + T); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.45, light ? 'rgba(255,255,255,.12)' : 'rgba(200,220,255,.07)'); sg.addColorStop(.55, 'rgba(255,255,255,0)'); c.fillStyle = sg; c.fillRect(px, py, T, T); }
      if (r(10)<.5) blot(c, px+(r(11)<.5?0:T), py+(r(12)<.5?0:T), T*.65, '225,240,255', .3);
      if (light){ c.strokeStyle='rgba(227,200,140,.15)'; c.lineWidth=1; c.strokeRect(px+T*.1,py+T*.1,T*.8,T*.8); }
      if (r(92)<.06){ c.strokeStyle = 'rgba(227,200,140,.3)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(px + T*.5, py + T*.3); c.lineTo(px + T*.5, py + T*.7); c.moveTo(px + T*.38, py + T*.42); c.lineTo(px + T*.62, py + T*.42); c.stroke(); }
    } else if (b==='ash'){
      // sand rippled by the wind, cracked dry earth, drifts of ash, pebbles, the odd bone and tuft of dry grass
      for (let i=0;i<3;i++){ const yy = py + T*(.2 + i*.3 + r(100+i)*.1); c.strokeStyle = i%2 ? 'rgba(0,0,0,.12)' : 'rgba(255,236,190,.11)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(px, yy + r(103+i)*4); c.bezierCurveTo(px + T*.3, yy - 3 - r(106+i)*4, px + T*.6, yy + 3 + r(109+i)*4, px + T, yy + r(112+i)*4 - 2); c.stroke(); }
      if (r(2)<.22){ c.strokeStyle='rgba(40,28,14,.55)'; c.lineWidth=1; crackPath(c,px,py,i=>r(20+i),4); c.stroke(); }
      if (r(5)<.25) blot(c, px+T*r(6), py+T*r(7), T*.3, '110,106,100', .22);
      c.fillStyle = 'rgba(0,0,0,.2)'; for (let i=0;i<4;i++) c.fillRect(px + T*r(30+i), py + T*r(40+i), T*.03, T*.02);
      c.fillStyle = 'rgba(255,236,190,.14)'; for (let i=0;i<3;i++) c.fillRect(px + T*r(50+i), py + T*r(60+i), T*.025, T*.015);
      if (r(9)<.05){ c.strokeStyle = 'rgba(232,223,198,.7)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(px + T*.3, py + T*.7); c.lineTo(px + T*.5, py + T*.62); c.stroke(); }
      if (r(10)<.1){ c.strokeStyle = 'rgba(168,144,88,.8)'; c.lineWidth = 1; c.beginPath(); const gx = px + T*(.2 + r(11)*.6), gy = py + T*(.6 + r(12)*.3); for (let i=0;i<6;i++){ c.moveTo(gx, gy); c.quadraticCurveTo(gx + (i-3)*1.5, gy - T*.05, gx + (i-3)*3, gy - T*(.08 + r(13+i)*.05)); } c.stroke(); }
      // small scenery that does not block: barrel cacti, rock clusters, a dead branch, a sprig of flowers
      if (r(80)<.16){ const bx = px + T*(.2 + r(81)*.6), by = py + T*(.72 + r(82)*.18), s = T*(.05 + r(83)*.03); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(bx, by + s*.9, s*1.4, s*.4, 0, 0, Math.PI*2); c.fill(); const cg = c.createLinearGradient(bx - s, 0, bx + s, 0); cg.addColorStop(0, '#2c5a32'); cg.addColorStop(.45, '#5f9a44'); cg.addColorStop(1, '#244a28'); c.fillStyle = cg; c.beginPath(); c.ellipse(bx, by, s, s*1.15, 0, 0, Math.PI*2); c.fill(); c.strokeStyle = 'rgba(10,30,12,.45)'; c.lineWidth = 1; c.beginPath(); for (const o of [-.55,-.2,.2,.55]){ c.moveTo(bx + o*s*.4, by - s*1.1); c.quadraticCurveTo(bx + o*s*1.3, by, bx + o*s*.4, by + s*1.1); } c.stroke(); c.fillStyle = '#f0e8c0'; for (let i=0;i<8;i++) c.fillRect(bx + (r(84+i)-.5)*s*1.6, by + (r(90+i)-.5)*s*1.8, 1.2, 1.2); c.fillStyle = '#f07aa8'; c.beginPath(); c.arc(bx, by - s*1.1, s*.3, 0, Math.PI*2); c.fill(); }
      if (r(100)<.12){ const bx = px + T*(.2 + r(101)*.6), by = py + T*(.7 + r(102)*.2); for (let i=0;i<3;i++){ const rx = bx + (i-1)*T*.07, ry = by + (i%2)*T*.03, s = T*(.035 + r(103+i)*.03); const rg = c.createLinearGradient(rx - s, ry - s, rx + s, ry + s); rg.addColorStop(0, '#c8a876'); rg.addColorStop(1, '#6c5030'); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(rx, ry + s*.7, s*1.2, s*.35, 0, 0, Math.PI*2); c.fill(); c.fillStyle = rg; c.beginPath(); c.moveTo(rx - s, ry + s*.6); c.lineTo(rx - s*.7, ry - s*.5); c.lineTo(rx + s*.2, ry - s*.9); c.lineTo(rx + s, ry - s*.1); c.lineTo(rx + s*.9, ry + s*.6); c.closePath(); c.fill(); } }
      if (r(110)<.07){ const bx = px + T*(.15 + r(111)*.5), by = py + T*(.6 + r(112)*.3); c.strokeStyle = '#6a5640'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + T*.12, by - T*.06, bx + T*.26, by - T*.03); c.moveTo(bx + T*.12, by - T*.05); c.lineTo(bx + T*.16, by - T*.13); c.moveTo(bx + T*.2, by - T*.04); c.lineTo(bx + T*.25, by - T*.1); c.stroke(); }
      // dunes with a lit and a shaded flank, cracked clay, scrub, ribs, a pottery shard, pebbles and glints of mica
      if (r(14)<.3){ const dx = px + T*(.25 + r(15)*.5), dy = py + T*(.35 + r(16)*.3), dw = T*(.3 + r(17)*.18), dh = T*(.09 + r(18)*.06);
        const dg = c.createLinearGradient(dx - dw, dy, dx + dw, dy); dg.addColorStop(0, 'rgba(255,230,170,.2)'); dg.addColorStop(.55, 'rgba(255,230,170,.05)'); dg.addColorStop(.56, 'rgba(60,36,14,.22)'); dg.addColorStop(1, 'rgba(60,36,14,0)');
        c.fillStyle = dg; c.beginPath(); c.moveTo(dx - dw, dy + dh); c.quadraticCurveTo(dx - dw*.2, dy - dh*1.6, dx + dw*.1, dy - dh*.9); c.quadraticCurveTo(dx + dw*.6, dy - dh*.2, dx + dw, dy + dh); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,236,190,.22)'; c.lineWidth = 1; c.beginPath(); c.moveTo(dx - dw*.8, dy + dh*.6); c.quadraticCurveTo(dx - dw*.2, dy - dh*1.5, dx + dw*.1, dy - dh*.85); c.stroke(); }
      if (r(19)<.14){ const cx0 = px + T*(.3 + r(21)*.4), cy0 = py + T*(.3 + r(22)*.4); c.fillStyle = 'rgba(120,84,50,.28)'; c.beginPath(); for (let i=0;i<7;i++){ const a = i*.9 + r(23)*2, d = T*(.15 + r(24+i)*.08); c.lineTo(cx0 + Math.cos(a)*d, cy0 + Math.sin(a)*d*.8); } c.closePath(); c.fill();
        c.strokeStyle = 'rgba(40,24,10,.5)'; c.lineWidth = 1; c.beginPath(); for (let i=0;i<6;i++){ const a = i*1.05; c.moveTo(cx0, cy0); c.lineTo(cx0 + Math.cos(a)*T*.2, cy0 + Math.sin(a + r(30+i))*T*.16); } c.stroke(); }
      if (r(32)<.1){ const bx = px + T*(.2 + r(33)*.6), by = py + T*(.55 + r(34)*.3); c.strokeStyle = 'rgba(122,98,52,.9)'; c.lineWidth = 1; c.beginPath(); for (let i=0;i<9;i++){ const a = -1.9 + i*.28; c.moveTo(bx, by); c.quadraticCurveTo(bx + Math.cos(a)*T*.05, by + Math.sin(a)*T*.06, bx + Math.cos(a)*T*.1 + r(35+i)*3 - 1.5, by + Math.sin(a)*T*(.1 + r(40+i)*.05)); } c.stroke();
        c.fillStyle = 'rgba(210,186,120,.9)'; for (let i=0;i<4;i++) c.fillRect(bx + (i-2)*T*.04, by - T*.02, 2, 2); }
      if (r(44)<.045){ const rx = px + T*(.25 + r(45)*.4), ry = py + T*(.35 + r(46)*.4); c.strokeStyle = 'rgba(236,228,204,.85)'; c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(rx, ry); c.quadraticCurveTo(rx + T*.18, ry - T*.04, rx + T*.34, ry + T*.02); for (let i=0;i<5;i++){ const bxx = rx + T*(.04 + i*.06); c.moveTo(bxx, ry - T*.005); c.quadraticCurveTo(bxx + 2, ry + T*.07, bxx - 1, ry + T*.12); } c.stroke(); }
      if (r(47)<.05){ const sx = px + T*(.25 + r(48)*.5), sy = py + T*(.3 + r(49)*.4); c.fillStyle = '#b85a34'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + T*.08, sy - T*.02); c.lineTo(sx + T*.1, sy + T*.05); c.lineTo(sx + T*.02, sy + T*.06); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,200,150,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx + T*.02, sy + T*.01); c.lineTo(sx + T*.08, sy + T*.01); c.stroke(); }
      if (r(50)<.22){ c.fillStyle = 'rgba(96,84,70,.8)'; for (let i=0;i<4;i++){ c.beginPath(); c.ellipse(px + T*(.3 + r(51)*.4) + (r(52+i)-.5)*T*.14, py + T*(.4 + r(56)*.4) + (r(57+i)-.5)*T*.08, T*(.015 + r(61+i)*.015), T*.012, 0, 0, Math.PI*2); c.fill(); } }
      c.fillStyle = 'rgba(255,250,220,.75)'; for (let i=0;i<2;i++) if (r(70+i)<.4) c.fillRect(px + T*r(72+i), py + T*r(74+i), 1.5, 1.5);
    } else if (b==='sea'){
      // dark wet stone with rippling wave light, patches of sand, shells and starfish
      for (let i=0;i<3;i++){ const yy = py + T*(.18 + i*.3 + r(100+i)*.1); c.strokeStyle = 'rgba(140,210,230,' + (.07 + .05*r(103+i)) + ')'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(px, yy); c.bezierCurveTo(px + T*.25, yy - 5, px + T*.5, yy + 5, px + T, yy - 2); c.stroke(); }
      if (r(2)<.4) blot(c, px+T*r(3), py+T*r(4), T*.4, '90,150,170', .16);
      if (r(5)<.25) blot(c, px+T*r(6), py+T*r(7), T*.3, '150,140,110', .13);
      if (r(20)<.18){ const sx = px + T*(.25 + r(21)*.5), sy = py + T*(.3 + r(22)*.4); c.fillStyle = 'rgba(235,225,205,.75)'; c.beginPath(); c.ellipse(sx, sy, T*.045, T*.035, r(23)*3, 0, Math.PI*2); c.fill(); c.strokeStyle = 'rgba(120,100,80,.6)'; c.lineWidth = 1; c.beginPath(); for (let i=0;i<4;i++){ c.moveTo(sx, sy); c.lineTo(sx + Math.cos(r(24)*3 + i*.5 - 1)*T*.04, sy + Math.sin(r(24)*3 + i*.5 - 1)*T*.03); } c.stroke(); }
      if (r(30)<.04){ const sx = px + T*.5, sy = py + T*.5; c.fillStyle = 'rgba(232,120,70,.8)'; c.beginPath(); for (let i=0;i<10;i++){ const a = i*Math.PI/5 - Math.PI/2, rr = i%2 ? T*.04 : T*.11; c.lineTo(sx + Math.cos(a)*rr, sy + Math.sin(a)*rr); } c.closePath(); c.fill(); }
      c.fillStyle = 'rgba(230,245,250,.18)'; for (let i=0;i<5;i++) c.fillRect(px + T*r(40+i), py + T*r(50+i), 1.5, 1.5);
      // small scenery that does not block: anemones, sea fans, urchins, mossy rocks
      if (r(80)<.16){ const bx = px + T*(.2 + r(81)*.6), by = py + T*(.72 + r(82)*.18), col = ['#ff7aa8','#ffb04a','#a87aff','#5ae0c8'][Math.floor(r(83)*4)]; c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); for (let i=0;i<9;i++){ const a = -Math.PI*.5 + (i-4)*.28, L = T*(.08 + r(84+i)*.04); c.moveTo(bx, by); c.quadraticCurveTo(bx + Math.cos(a)*L*.5 + 2, by + Math.sin(a)*L*.6, bx + Math.cos(a)*L, by + Math.sin(a)*L); } c.stroke(); c.fillStyle = 'rgba(40,24,34,.8)'; c.beginPath(); c.ellipse(bx, by + 1, T*.035, T*.02, 0, 0, Math.PI*2); c.fill(); }
      if (r(100)<.12){ const bx = px + T*(.2 + r(101)*.6), by = py + T*(.7 + r(102)*.2); for (let i=0;i<3;i++){ const rx = bx + (i-1)*T*.07, ry = by + (i%2)*T*.03, s = T*(.035 + r(103+i)*.03); const rg = c.createLinearGradient(rx - s, ry - s, rx + s, ry + s); rg.addColorStop(0, '#6a8088'); rg.addColorStop(1, '#2a3a44'); c.fillStyle = 'rgba(0,10,20,.3)'; c.beginPath(); c.ellipse(rx, ry + s*.7, s*1.2, s*.35, 0, 0, Math.PI*2); c.fill(); c.fillStyle = rg; c.beginPath(); c.moveTo(rx - s, ry + s*.6); c.lineTo(rx - s*.7, ry - s*.5); c.lineTo(rx + s*.2, ry - s*.9); c.lineTo(rx + s, ry - s*.1); c.lineTo(rx + s*.9, ry + s*.6); c.closePath(); c.fill(); c.fillStyle = 'rgba(70,150,84,.7)'; c.fillRect(rx - s*.6, ry - s*.7, s*1.1, s*.25); } }
      if (r(110)<.07){ const bx = px + T*(.25 + r(111)*.5), by = py + T*(.65 + r(112)*.25); c.strokeStyle = '#4a2a5a'; c.lineWidth = 1; c.beginPath(); for (let i=0;i<14;i++){ const a = i*.45; c.moveTo(bx + Math.cos(a)*T*.03, by + Math.sin(a)*T*.03); c.lineTo(bx + Math.cos(a)*T*.07, by + Math.sin(a)*T*.07); } c.stroke(); c.fillStyle = '#2a1838'; c.beginPath(); c.arc(bx, by, T*.032, 0, Math.PI*2); c.fill(); }
      // rippled sand, seaweed, small corals, a fish skeleton, shells, pebbles and the odd sunken coin
      if (r(14)<.3){ c.strokeStyle = 'rgba(210,196,150,.2)'; c.lineWidth = 1.1; const sy = py + T*(.3 + r(15)*.4); for (let i=0;i<4;i++){ c.beginPath(); for (let k=0;k<=8;k++){ const xx = px + T*(.1 + k*.1), yy = sy + i*T*.07 + Math.sin(k*1.4 + r(16)*6 + i)*T*.018; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); } }
      if (r(17)<.17){ const bx = px + T*(.2 + r(18)*.6), by = py + T*(.8 + r(19)*.12); c.lineCap = 'round'; for (let i=0;i<5;i++){ c.strokeStyle = i%2 ? 'rgba(40,120,74,.85)' : 'rgba(64,160,92,.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx + (i-2)*3, by); c.bezierCurveTo(bx + (i-2)*5 - 4, by - T*.1, bx + (i-2)*3 + 5, by - T*.18, bx + (i-2)*6 + (r(20+i)-.5)*6, by - T*(.2 + r(25+i)*.12)); c.stroke(); } }
      if (r(30)<.08){ const cx0 = px + T*(.25 + r(31)*.5), cy0 = py + T*(.55 + r(32)*.3), cols = ['#d8527a','#e8803a','#9a5ad8','#3aa8a0']; c.lineCap = 'round'; for (let i=0;i<4;i++){ c.strokeStyle = cols[Math.floor(r(33)*4)]; c.lineWidth = 2.4; c.beginPath(); c.moveTo(cx0 + (i-1.5)*4, cy0); c.lineTo(cx0 + (i-1.5)*5 + (r(34+i)-.5)*4, cy0 - T*(.06 + r(38+i)*.07)); c.stroke(); } }
      if (r(42)<.035){ const fx0 = px + T*.2, fy0 = py + T*(.4 + r(43)*.3); c.strokeStyle = 'rgba(232,230,214,.85)'; c.lineWidth = 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(fx0, fy0); c.lineTo(fx0 + T*.4, fy0); for (let i=0;i<7;i++){ c.moveTo(fx0 + T*(.08 + i*.045), fy0); c.lineTo(fx0 + T*(.09 + i*.045), fy0 - T*.04); c.moveTo(fx0 + T*(.08 + i*.045), fy0); c.lineTo(fx0 + T*(.09 + i*.045), fy0 + T*.04); } c.moveTo(fx0, fy0); c.lineTo(fx0 - T*.07, fy0 - T*.05); c.lineTo(fx0 - T*.07, fy0 + T*.05); c.closePath(); c.stroke(); c.beginPath(); c.arc(fx0 + T*.44, fy0, T*.035, 0, Math.PI*2); c.stroke(); }
      if (r(46)<.07){ const sx = px + T*(.25 + r(47)*.5), sy = py + T*(.3 + r(48)*.4), a0 = r(49)*3; c.save(); c.translate(sx, sy); c.rotate(a0); c.fillStyle = 'rgba(244,226,208,.85)'; c.beginPath(); c.moveTo(0, T*.04); for (let i=0;i<=6;i++){ const a = Math.PI + i*Math.PI/6; c.lineTo(Math.cos(a)*T*.07, Math.sin(a)*T*.06 + T*.02); } c.closePath(); c.fill(); c.strokeStyle = 'rgba(150,100,90,.7)'; c.lineWidth = 1; c.beginPath(); for (let i=0;i<5;i++){ const a = Math.PI + (i + .5)*Math.PI/6; c.moveTo(0, T*.04); c.lineTo(Math.cos(a)*T*.066, Math.sin(a)*T*.056 + T*.02); } c.stroke(); c.restore(); }
      if (r(52)<.03){ c.fillStyle = 'rgba(240,200,80,.9)'; c.beginPath(); c.arc(px + T*(.2 + r(53)*.6), py + T*(.2 + r(54)*.6), T*.02, 0, Math.PI*2); c.fill(); }
      if (r(55)<.24){ c.fillStyle = 'rgba(110,128,128,.75)'; for (let i=0;i<4;i++){ c.beginPath(); c.ellipse(px + T*(.3 + r(56)*.4) + (r(57+i)-.5)*T*.14, py + T*(.4 + r(61)*.4) + (r(62+i)-.5)*T*.08, T*(.015 + r(66+i)*.015), T*.012, 0, 0, Math.PI*2); c.fill(); } }
    } else if (b==='storm'){
      if (r(2)<.35) blot(c, px+T*r(3), py+T*r(4), T*(.25+r(5)*.2), '130,165,220', .2);
      if (r(6)<.45){ c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=1; crackPath(c,px,py,i=>r(20+i),3); c.stroke(); }
      if (r(8)<.3){ const yy=py+T*(.25+r(9)*.5); c.strokeStyle='rgba(190,215,255,.16)'; c.lineWidth=1; c.beginPath(); c.moveTo(px+T*.15,yy); c.lineTo(px+T*.55,yy); c.stroke(); }
      if (r(10)<.07){ blot(c, px+T*r(11), py+T*r(12), T*.3, '14,10,6', .55); c.strokeStyle='rgba(236,211,106,.35)'; c.lineWidth=1; crackPath(c,px,py,i=>r(60+i),4); c.stroke(); }
    } else if (b==='tar'){
      if (r(2)<.6) blot(c, px+T*r(3), py+T*r(4), T*(.3+r(5)*.25), '6,4,2', .5);
      if (r(6)<.4){ c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=1; crackPath(c,px,py,i=>r(20+i),4); c.stroke(); }
      if (r(7)<.18) blot(c, px+T*r(8), py+T*r(9), T*.22, '201,162,74', .16);
      c.fillStyle='rgba(0,0,0,.3)'; for (let i=0;i<3;i++) c.fillRect(px+T*r(30+i), py+T*r(40+i), T*.045, T*.03);
    } else if (b==='fungal'){
      if (r(2)<.5) blot(c, px+T*r(3), py+T*r(4), T*(.3+r(5)*.2), '110,60,150', .28);
      if (r(6)<.35) blot(c, px+T*r(7), py+T*r(8), T*.3, '70,200,180', .16);
      if (r(9)<.3){ const mx=px+T*(.2+r(10)*.6), my=py+T*(.55+r(11)*.3); c.fillStyle='rgba(60,40,80,.9)'; c.fillRect(mx-1, my, 2, T*.07); c.fillStyle='rgba(120,210,190,.7)'; c.beginPath(); c.arc(mx, my, T*.045, Math.PI, 0); c.fill(); }
    }
    c.fillStyle='rgba(255,235,210,.07)'; c.fillRect(px,py,T,1.5); c.fillRect(px,py,1.5,T);
    c.fillStyle='rgba(0,0,0,.4)'; c.fillRect(px,py+T-1.5,T,1.5); c.fillRect(px+T-1.5,py,1.5,T);
    c.restore();
  }
  const g = c.createRadialGradient(W*T/2,H*T/2,W*T*.3,W*T/2,H*T/2,W*T*.75);
  g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.4)'); c.fillStyle=g; c.fillRect(0,0,W*T,H*T);
}
const _glowLin = {};
function glow(cx, cy, r, color){
  const p0 = color.indexOf('('), pr = p0 < 0 ? null : color.slice(p0+1, color.lastIndexOf(')')).split(',');
  if (!pr || pr.length < 3) return;
  const rgb = pr[0].trim() + ',' + pr[1].trim() + ',' + pr[2].trim();
  let s = _glowLin[rgb];
  if (!s){ s = document.createElement('canvas'); s.width = s.height = 64; const g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); _glowLin[rgb] = s; }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = pr.length > 3 ? Math.max(0, Math.min(1, parseFloat(pr[3]))) : 1;
  ctx.drawImage(s, cx - r, cy - r, r*2, r*2); ctx.restore();
}
// one mushroom, drawn with a lit dome, gills under the rim, a textured stalk and a soft ground shadow.
// o: x,y (base, in tiles), h (stalk height), r (cap radius), cap (dome height factor), sw (stalk half-width), st/cap: 3 colors, spots, glow...
function drawShroom(px, py, T, o, time){
  const pulse = reduce ? .6 : .6 + .4*Math.sin(time*2 + (o.ph||0));
  const cx = px + T*o.x, by = py + T*o.y, h = T*o.h, cr = T*o.r, sw = reduce ? 0 : Math.sin(time*1.3 + (o.ph||0))*T*.012;
  const sw0 = T*(o.sw||.05), capH = cr*(o.cap||.85), topY = by - h, cy = topY + capH*.4;
  ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.beginPath(); ctx.ellipse(cx, by+T*.01, cr*.85, cr*.2, 0, 0, Math.PI*2); ctx.fill();
  if (o.glow) glow(cx, cy - capH*.2, T*(o.gr||.8), `rgba(${o.glow},${.1+.1*pulse})`);
  // stalk
  const g = ctx.createLinearGradient(cx-sw0*1.3, 0, cx+sw0*1.3, 0); g.addColorStop(0, o.st[0]); g.addColorStop(.42, o.st[1]); g.addColorStop(1, o.st[2]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - sw0*1.35, by);
  ctx.quadraticCurveTo(cx - sw0*.75, by - h*.5, cx - sw0*.65 + sw*.6, cy); ctx.lineTo(cx + sw0*.65 + sw*.6, cy);
  ctx.quadraticCurveTo(cx + sw0*.75, by - h*.5, cx + sw0*1.35, by); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 1;
  for (const k of [-.4, .1, .5]){ ctx.beginPath(); ctx.moveTo(cx + sw0*k*1.3, by); ctx.quadraticCurveTo(cx + sw0*k, by - h*.5, cx + sw0*k*.6 + sw*.6, cy); ctx.stroke(); }
  if (o.ring){ ctx.fillStyle = o.ring; ctx.beginPath(); ctx.ellipse(cx + sw*.3, by - h*.58, sw0*1.25, sw0*.4, 0, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke(); }
  // underside of the cap: dark with radial gills
  ctx.fillStyle = o.gill || '#2a1a3a'; ctx.beginPath(); ctx.ellipse(cx + sw, cy, cr, cr*.24, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = o.gillLine || 'rgba(255,255,255,.16)'; ctx.lineWidth = 1; ctx.beginPath();
  for (let i=-5;i<=5;i++){ const a = i/5; ctx.moveTo(cx + sw + a*cr*.18, cy + cr*.02); ctx.lineTo(cx + sw + a*cr*.97, cy + cr*.23*Math.sqrt(Math.max(0, 1-a*a))); }
  ctx.stroke();
  // dome
  const dg = ctx.createRadialGradient(cx - cr*.4 + sw, cy - capH*.75, cr*.05, cx + sw, cy - capH*.2, cr*1.15);
  dg.addColorStop(0, o.cap3[0]); dg.addColorStop(.55, o.cap3[1]); dg.addColorStop(1, o.cap3[2]);
  ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(cx - cr + sw, cy);
  ctx.bezierCurveTo(cx - cr*1.02 + sw, cy - capH*1.3, cx + cr*1.02 + sw, cy - capH*1.3, cx + cr + sw, cy);
  ctx.quadraticCurveTo(cx + sw, cy + cr*.3, cx - cr + sw, cy); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = o.rim || 'rgba(255,255,255,.4)'; ctx.lineWidth = Math.max(1.2, T*.022); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - cr*.88 + sw, cy - capH*.3); ctx.bezierCurveTo(cx - cr*.7 + sw, cy - capH*.95, cx - cr*.1 + sw, cy - capH*1.0, cx + cr*.3 + sw, cy - capH*.9); ctx.stroke();
  for (const [sx, sy, sr] of (o.spots || [])){
    ctx.fillStyle = o.spotGlow ? `rgba(${o.spotGlow},${.55+.4*pulse})` : (o.spot || 'rgba(255,250,240,.92)');
    ctx.beginPath(); ctx.ellipse(cx + sw + sx*cr*.72, cy - capH*sy*.78, T*sr, T*sr*.68, sx*.3, 0, Math.PI*2); ctx.fill();
  }
}
// small tufts of moss/grass around the foot of a feature
function tufts(px, py, T, x, y, col, n){
  ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i=0;i<n;i++){ const bx = px + T*(x + (i/(n-1||1)-.5)*.34), l = T*(.05 + hh(px|0, py|0, 170+i)*.05); ctx.moveTo(bx, py + T*y); ctx.lineTo(bx + (i%2 ? 1 : -1)*T*.015, py + T*y - l); }
  ctx.stroke();
}
/* ---------- walls of the four campaign biomes: three looks each, drawn once into a cached sprite ---------- */
const mkRng = seed => () => (seed = (seed*1664525 + 1013904223) >>> 0) / 4294967296;
const _wsCache = new Map();
// a sprite with the tile's top-left corner at (T*.25, T*.6), so tall things (tree crowns) can rise above their square
function wallSpr(key, T, paint){
  const k = key + '|' + Math.round(T*dpr); let s = _wsCache.get(k); if (s) return s;
  if (_wsCache.size > 90) _wsCache.clear();
  const w = Math.ceil(T*1.5*dpr), h = Math.ceil(T*1.7*dpr), cvs = document.createElement('canvas'); cvs.width = w; cvs.height = h;
  const g = cvs.getContext('2d'); g.scale(dpr, dpr); g.translate(T*.25, T*.6); g.lineCap = 'round'; g.lineJoin = 'round';
  paint(g, T); s = {cv:cvs, ox:T*.25, oy:T*.6, w:w/dpr, h:h/dpr}; _wsCache.set(k, s); return s;
}
// a lump of foliage: lit from the upper left, with small leaf marks on it
function leafBlob(g, T, cx, cy, rad, cols, rnd){
  const R = rad*T, X = cx*T, Y = cy*T, gr = g.createRadialGradient(X - R*.3, Y - R*.38, R*.08, X, Y, R);
  gr.addColorStop(0, cols[2]); gr.addColorStop(.55, cols[1]); gr.addColorStop(1, cols[0]);
  g.fillStyle = gr; g.beginPath(); g.ellipse(X, Y, R, R*.82, 0, 0, Math.PI*2); g.fill();
  for (let i=0;i<12;i++){ const a = rnd()*6.28, d = Math.sqrt(rnd())*.85; g.fillStyle = rnd() < .5 ? 'rgba(190,230,120,.35)' : 'rgba(10,30,10,.3)'; g.beginPath(); g.ellipse(X + Math.cos(a)*R*d, Y + Math.sin(a)*R*d*.8, R*.13, R*.07, rnd()*3, 0, Math.PI*2); g.fill(); }
}
function taperTrunk(g, T, x0, y0, x1, y1, w0, w1, cols){
  const gg = g.createLinearGradient((x0-w0)*T, 0, (x0+w0)*T, 0); gg.addColorStop(0, cols[0]); gg.addColorStop(.45, cols[1]); gg.addColorStop(1, cols[2]);
  g.fillStyle = gg; g.beginPath(); g.moveTo((x0-w0)*T, y0*T); g.quadraticCurveTo((x0-w0*.55)*T, (y0+y1)/2*T, (x1-w1)*T, y1*T); g.lineTo((x1+w1)*T, y1*T); g.quadraticCurveTo((x0+w0*.55)*T, (y0+y1)/2*T, (x0+w0)*T, y0*T); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 1; g.beginPath(); for (const k of [-.45,.05,.5]){ g.moveTo((x0 + w0*k)*T, y0*T); g.quadraticCurveTo((x0 + w0*k*.8)*T, (y0+y1)/2*T, (x1 + w1*k)*T, y1*T); } g.stroke();
}
const SW_GREEN = [['#1c3320','#34592c','#7ba64e'], ['#22402a','#3f6d34','#8fbb58'], ['#2a4624','#4a7a36','#a2cc62']];
const WALLPAINT = {
  // Drowned Swamp: a weeping willow, a mangrove on its roots, a gnarled oak with vines
  swamp0(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.36, T*.08, 0, 0, Math.PI*2); g.fill();
    g.strokeStyle = '#2b2016'; g.lineWidth = T*.05; g.beginPath(); for (const s of [-1,1]){ g.moveTo((.5 + s*.05)*T, .8*T); g.quadraticCurveTo((.5 + s*.16)*T, .86*T, (.5 + s*.25)*T, .91*T); } g.stroke();
    taperTrunk(g, T, .5, .9, .5, .34, .11, .07, ['#241a12', '#5e4a32', '#1a120b']);
    for (const [x,y,r,c] of [[.5,.14,.26,0],[.28,.28,.2,0],[.72,.28,.2,0],[.4,.06,.2,1],[.62,.08,.2,1],[.5,.26,.22,1],[.34,.2,.16,2],[.64,.2,.16,2],[.5,.1,.14,2]]) leafBlob(g, T, x, y, r, SW_GREEN[c], rnd);
    for (let i=0;i<20;i++){ const x0 = .5 + (rnd()-.5)*.62, y0 = .2 + rnd()*.18, L = .24 + rnd()*.26, sw = (rnd()-.5)*.08;
      g.strokeStyle = i%3 ? 'rgba(74,120,56,.9)' : 'rgba(120,168,78,.85)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0*T, y0*T); g.quadraticCurveTo((x0 + sw)*T, (y0 + L*.5)*T, (x0 + sw*1.6)*T, (y0 + L)*T); g.stroke();
      g.fillStyle = 'rgba(150,200,90,.8)'; for (let k=1;k<=4;k++){ const q = k/4.4; g.beginPath(); g.ellipse((x0 + sw*1.5*q*q)*T, (y0 + L*q)*T, T*.022, T*.011, .8, 0, Math.PI*2); g.fill(); } }
    g.fillStyle = 'rgba(96,146,64,.8)'; g.beginPath(); g.ellipse(T*.5, T*.88, T*.22, T*.05, 0, 0, Math.PI*2); g.fill();
  },
  swamp1(g, T, rnd){   // bald cypress: a flared trunk with knees, tiers of foliage and short hanging moss
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.36, T*.08, 0, 0, Math.PI*2); g.fill();
    for (const [kx, kh] of [[.28,.08],[.38,.12],[.64,.1],[.74,.07]]){ g.fillStyle = '#4b3a28'; g.beginPath(); g.moveTo((kx-.03)*T, .9*T); g.lineTo(kx*T, (.9-kh)*T); g.lineTo((kx+.03)*T, .9*T); g.closePath(); g.fill(); }
    taperTrunk(g, T, .5, .9, .5, .3, .13, .06, ['#22190f', '#5a4630', '#17100a']);
    for (const [x,y,r,c] of [[.5,.52,.27,0],[.28,.56,.15,0],[.72,.56,.15,0],[.5,.34,.23,1],[.34,.38,.14,1],[.66,.38,.14,1],[.5,.18,.17,1],[.5,.06,.11,2],[.4,.22,.1,2],[.6,.22,.1,2]]) leafBlob(g, T, x, y, r, SW_GREEN[c], rnd);
    g.strokeStyle = 'rgba(150,170,130,.7)'; g.lineWidth = 1.2;
    for (let i=0;i<9;i++){ const x0 = .22 + rnd()*.56, y0 = .5 + rnd()*.12, L = .08 + rnd()*.12; g.beginPath(); g.moveTo(x0*T, y0*T); g.quadraticCurveTo((x0 + .015)*T, (y0 + L*.5)*T, (x0 - .01)*T, (y0 + L)*T); g.stroke(); }
    g.fillStyle = 'rgba(96,146,64,.7)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.18, T*.04, 0, 0, Math.PI*2); g.fill();
  },
  swamp2(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.34, T*.08, 0, 0, Math.PI*2); g.fill();
    taperTrunk(g, T, .5, .9, .46, .4, .13, .08, ['#20170f', '#54402b', '#150e08']);
    g.strokeStyle = '#3a2c1c'; g.lineWidth = T*.045; g.beginPath(); g.moveTo(.46*T, .5*T); g.quadraticCurveTo(.28*T, .44*T, .16*T, .3*T); g.moveTo(.48*T, .46*T); g.quadraticCurveTo(.66*T, .42*T, .84*T, .28*T); g.stroke();
    for (const [x,y,r,c] of [[.5,.16,.24,0],[.22,.24,.18,0],[.78,.22,.18,0],[.38,.08,.18,1],[.64,.1,.18,1],[.18,.26,.12,2],[.8,.22,.12,2],[.5,.18,.16,2]]) leafBlob(g, T, x, y, r, SW_GREEN[c], rnd);
    for (const [mx, my, s] of [[.3,.88,.05],[.68,.89,.04]]){ g.fillStyle = '#d8d0b8'; g.fillRect((mx-.008)*T, my*T, T*.016, T*.04); g.fillStyle = '#c4622e'; g.beginPath(); g.ellipse(mx*T, my*T, T*s, T*s*.7, 0, Math.PI, 0); g.fill(); }
    g.fillStyle = 'rgba(96,146,64,.8)'; g.beginPath(); g.ellipse(T*.5, T*.88, T*.2, T*.045, 0, 0, Math.PI*2); g.fill();
  },
  // Crypt: a broken column with rubble and cobwebs, a sarcophagus
  crypt1(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(T*.5, T*.88, T*.38, T*.09, 0, 0, Math.PI*2); g.fill();
    const sg = g.createLinearGradient(.26*T, 0, .74*T, 0); sg.addColorStop(0, '#2a241f'); sg.addColorStop(.45, '#74685a'); sg.addColorStop(1, '#1d1814');
    g.fillStyle = '#4c4036'; g.fillRect(.18*T, .8*T, .64*T, .1*T); g.fillStyle = sg; g.fillRect(.28*T, .34*T, .44*T, .46*T);
    g.beginPath(); g.moveTo(.28*T, .34*T); g.lineTo(.36*T, .22*T); g.lineTo(.44*T, .3*T); g.lineTo(.52*T, .16*T); g.lineTo(.62*T, .28*T); g.lineTo(.72*T, .2*T); g.lineTo(.72*T, .34*T); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1; g.beginPath(); for (const sy of [.46,.62]){ g.moveTo(.28*T, sy*T); g.lineTo(.72*T, sy*T); } g.moveTo(.5*T, .46*T); g.lineTo(.5*T, .62*T); g.moveTo(.4*T, .34*T); g.lineTo(.46*T, .56*T); g.lineTo(.4*T, .76*T); g.stroke();
    for (let i=0;i<6;i++){ const x = .12 + rnd()*.76, y = .84 + rnd()*.07, s = .03 + rnd()*.04; g.fillStyle = rnd() < .5 ? '#6a5e50' : '#483e34'; g.beginPath(); g.moveTo(x*T, (y-s)*T); g.lineTo((x+s)*T, (y+s*.4)*T); g.lineTo((x-s*.8)*T, (y+s*.6)*T); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(92,120,70,.55)'; g.beginPath(); g.ellipse(.36*T, .78*T, T*.1, T*.03, 0, 0, Math.PI*2); g.ellipse(.66*T, .5*T, T*.05, T*.07, 0, 0, Math.PI*2); g.fill();
    g.strokeStyle = 'rgba(230,224,208,.4)'; g.lineWidth = .8; g.beginPath(); for (const [ex,ey] of [[.2,0],[.17,.1],[.1,.17],[0,.2]]){ g.moveTo(.28*T, .34*T); g.lineTo((.28+ex)*T, (.34+ey)*T); } for (const f of [.5,.85]){ g.moveTo((.28+.2*f)*T, .34*T); g.lineTo((.28+.17*f)*T, (.34+.1*f)*T); g.lineTo((.28+.1*f)*T, (.34+.17*f)*T); g.lineTo(.28*T, (.34+.2*f)*T); } g.stroke();
  },
  crypt2(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(T*.5, T*.88, T*.42, T*.09, 0, 0, Math.PI*2); g.fill();
    const fg = g.createLinearGradient(0, .52*T, 0, .88*T); fg.addColorStop(0, '#6e6254'); fg.addColorStop(1, '#2c251f');
    g.fillStyle = fg; g.fillRect(.1*T, .52*T, .8*T, .36*T);
    g.fillStyle = '#8a7d6c'; g.beginPath(); g.moveTo(.08*T, .52*T); g.lineTo(.2*T, .38*T); g.lineTo(.92*T, .38*T); g.lineTo(.9*T, .52*T); g.closePath(); g.fill();
    g.fillStyle = '#3a322a'; g.beginPath(); g.moveTo(.9*T, .52*T); g.lineTo(.92*T, .38*T); g.lineTo(.98*T, .46*T); g.lineTo(.98*T, .8*T); g.lineTo(.9*T, .88*T); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(20,14,10,.6)'; g.lineWidth = 1.2; g.strokeRect(.1*T, .52*T, .8*T, .36*T);
    g.strokeStyle = 'rgba(30,24,18,.7)'; g.lineWidth = T*.035; g.beginPath(); g.moveTo(.56*T, .42*T); g.lineTo(.56*T, .5*T); g.moveTo(.5*T, .45*T); g.lineTo(.62*T, .45*T); g.stroke();
    g.fillStyle = 'rgba(205,196,176,.75)'; g.beginPath(); g.arc(.5*T, .66*T, T*.085, 0, Math.PI*2); g.fill(); g.fillRect(.46*T, .72*T, .08*T, .06*T);
    g.fillStyle = 'rgba(16,10,6,.9)'; g.beginPath(); g.arc(.47*T, .65*T, T*.022, 0, Math.PI*2); g.arc(.53*T, .65*T, T*.022, 0, Math.PI*2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(.2*T, .52*T); g.lineTo(.26*T, .62*T); g.lineTo(.2*T, .72*T); g.moveTo(.8*T, .56*T); g.lineTo(.74*T, .66*T); g.stroke();
    g.fillStyle = 'rgba(92,120,70,.5)'; g.beginPath(); g.ellipse(.18*T, .86*T, T*.08, T*.025, 0, 0, Math.PI*2); g.fill();
  },
  // Infernal Forge: an anvil with a glowing bar, a furnace with its chimney
  forge1(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.36, T*.08, 0, 0, Math.PI*2); g.fill();
    const pg = g.createLinearGradient(.3*T, 0, .7*T, 0); pg.addColorStop(0, '#2a1f1a'); pg.addColorStop(.5, '#5a4638'); pg.addColorStop(1, '#1a120e'); g.fillStyle = pg; g.fillRect(.3*T, .62*T, .4*T, .28*T);
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(.3*T, .74*T); g.lineTo(.7*T, .74*T); g.stroke();
    const ag = g.createLinearGradient(0, .44*T, 0, .66*T); ag.addColorStop(0, '#8a929c'); ag.addColorStop(.35, '#3e444c'); ag.addColorStop(1, '#16191d');
    g.fillStyle = ag; g.beginPath(); g.moveTo(.1*T, .5*T); g.lineTo(.3*T, .48*T); g.lineTo(.8*T, .48*T); g.lineTo(.74*T, .58*T); g.lineTo(.66*T, .6*T); g.lineTo(.64*T, .66*T); g.lineTo(.36*T, .66*T); g.lineTo(.34*T, .6*T); g.lineTo(.26*T, .57*T); g.closePath(); g.fill();
    g.fillStyle = '#b9c0c9'; g.fillRect(.3*T, .48*T, .5*T, .02*T);
    const hg = g.createLinearGradient(0, .42*T, 0, .48*T); hg.addColorStop(0, '#fff0a0'); hg.addColorStop(.5, '#ff9a30'); hg.addColorStop(1, '#a8300c'); g.fillStyle = hg; g.fillRect(.36*T, .42*T, .3*T, .06*T);
  },
  forge2(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.38, T*.08, 0, 0, Math.PI*2); g.fill();
    const bg = g.createLinearGradient(.24*T, 0, .76*T, 0); bg.addColorStop(0, '#2a1d17'); bg.addColorStop(.45, '#5c4636'); bg.addColorStop(1, '#1a1210');
    g.fillStyle = bg; g.fillRect(.24*T, .3*T, .52*T, .6*T); g.fillRect(.34*T, .1*T, .32*T, .22*T);
    g.fillStyle = '#16100d'; g.fillRect(.3*T, .06*T, .4*T, .06*T);
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.beginPath(); for (let i=0;i<5;i++){ const y = (.36 + i*.1)*T; g.moveTo(.24*T, y); g.lineTo(.76*T, y); } for (let i=0;i<4;i++){ const o = (i%2 ? .08 : .17); for (let k=0;k<4;k++){ g.moveTo((.24 + o + k*.13)*T, (.36 + i*.1)*T); g.lineTo((.24 + o + k*.13)*T, (.46 + i*.1)*T); } } g.stroke();
    g.fillStyle = '#0c0807'; g.beginPath(); g.moveTo(.38*T, .88*T); g.lineTo(.38*T, .66*T); g.quadraticCurveTo(.5*T, .52*T, .62*T, .66*T); g.lineTo(.62*T, .88*T); g.closePath(); g.fill();
    const mg = g.createLinearGradient(0, .55*T, 0, .88*T); mg.addColorStop(0, '#ffd070'); mg.addColorStop(.5, '#ff7a20'); mg.addColorStop(1, '#a8300c');
    g.fillStyle = mg; g.beginPath(); g.moveTo(.41*T, .87*T); g.lineTo(.41*T, .68*T); g.quadraticCurveTo(.5*T, .58*T, .59*T, .68*T); g.lineTo(.59*T, .87*T); g.closePath(); g.fill();
    g.fillStyle = 'rgba(20,10,6,.55)'; g.fillRect(.27*T, .32*T, .04*T, .5*T); g.fillRect(.4*T, .1*T, .03*T, .2*T);
  },
  // Frozen Cathedral: a winged angel on a plinth, a pillar grown over with ice
  cathedral1(g, T, rnd){   // a tall wrought-iron candelabrum on a stone plinth (the flames are drawn live)
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.34, T*.07, 0, 0, Math.PI*2); g.fill();
    const mg = g.createLinearGradient(.3*T, 0, .7*T, 0); mg.addColorStop(0, '#6e7a8a'); mg.addColorStop(.45, '#dfe7f0'); mg.addColorStop(1, '#5a6676');
    g.fillStyle = mg; g.fillRect(.3*T, .8*T, .4*T, .1*T); g.fillStyle = '#b9c4d2'; g.fillRect(.34*T, .74*T, .32*T, .07*T);
    const ig = g.createLinearGradient(.46*T, 0, .54*T, 0); ig.addColorStop(0, '#16191f'); ig.addColorStop(.5, '#56606e'); ig.addColorStop(1, '#101318');
    g.fillStyle = ig; g.fillRect(.465*T, .36*T, .07*T, .4*T);
    g.fillStyle = '#3a424e'; for (const ky of [.46, .6, .7]){ g.beginPath(); g.ellipse(.5*T, ky*T, T*.05, T*.025, 0, 0, Math.PI*2); g.fill(); }
    g.strokeStyle = '#2c333c'; g.lineWidth = T*.035; g.lineCap = 'round';
    g.beginPath(); g.moveTo(.5*T, .52*T); g.bezierCurveTo(.4*T, .56*T, .26*T, .5*T, .22*T, .38*T); g.moveTo(.5*T, .52*T); g.bezierCurveTo(.6*T, .56*T, .74*T, .5*T, .78*T, .38*T); g.moveTo(.5*T, .5*T); g.lineTo(.5*T, .3*T); g.stroke();
    g.strokeStyle = 'rgba(190,205,225,.45)'; g.lineWidth = 1; g.stroke();
    for (const [cx, cy] of [[.22,.38],[.5,.3],[.78,.38]]){
      g.fillStyle = '#3a424e'; g.beginPath(); g.ellipse(cx*T, (cy + .005)*T, T*.055, T*.018, 0, 0, Math.PI*2); g.fill();
      const cg = g.createLinearGradient((cx - .025)*T, 0, (cx + .025)*T, 0); cg.addColorStop(0, '#cfd6de'); cg.addColorStop(.5, '#f4f7fa'); cg.addColorStop(1, '#a4aebb'); g.fillStyle = cg; g.fillRect((cx - .025)*T, (cy - .12)*T, T*.05, T*.12);
      g.fillStyle = 'rgba(200,220,245,.8)'; g.beginPath(); g.ellipse(cx*T, (cy - .12)*T, T*.025, T*.01, 0, 0, Math.PI*2); g.fill();
    }
    g.fillStyle = 'rgba(214,238,255,.9)'; for (const [ix, iy] of [[.34,.84],[.62,.85]]){ g.beginPath(); g.moveTo((ix - .03)*T, iy*T); g.lineTo(ix*T, (iy - .1)*T); g.lineTo((ix + .03)*T, iy*T); g.closePath(); g.fill(); }
  },
  cathedral2(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.34, T*.07, 0, 0, Math.PI*2); g.fill();
    const pg = g.createLinearGradient(.26*T, 0, .74*T, 0); pg.addColorStop(0, '#5d6878'); pg.addColorStop(.45, '#dfe7f0'); pg.addColorStop(1, '#4e5867');
    g.fillStyle = pg; g.fillRect(.28*T, .2*T, .44*T, .64*T); g.fillStyle = '#c8d2de'; g.fillRect(.18*T, .1*T, .64*T, .1*T); g.fillStyle = '#8592a4'; g.fillRect(.18*T, .82*T, .64*T, .08*T);
    g.strokeStyle = 'rgba(50,62,82,.3)'; g.lineWidth = 1; g.beginPath(); for (const fl of [.38,.5,.62]){ g.moveTo(fl*T, .22*T); g.lineTo(fl*T, .8*T); } g.stroke();
    const ice = (x, y, h, w) => { g.fillStyle = 'rgba(214,238,255,.92)'; g.beginPath(); g.moveTo((x-w)*T, y*T); g.lineTo(x*T, (y-h)*T); g.lineTo((x+w)*T, y*T); g.closePath(); g.fill(); g.fillStyle = 'rgba(120,180,226,.8)'; g.beginPath(); g.moveTo(x*T, (y-h)*T); g.lineTo((x+w)*T, y*T); g.lineTo((x+w*.1)*T, y*T); g.closePath(); g.fill(); g.strokeStyle = 'rgba(70,120,170,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo((x-w)*T, y*T); g.lineTo(x*T, (y-h)*T); g.lineTo((x+w)*T, y*T); g.stroke(); };
    ice(.2, .86, .34, .06); ice(.3, .88, .22, .05); ice(.8, .86, .38, .07); ice(.7, .89, .2, .05); ice(.24, .14, -.2, .05); ice(.46, .2, -.26, .045); ice(.68, .2, -.18, .045);
    g.fillStyle = 'rgba(240,248,255,.9)'; g.beginPath(); g.ellipse(.5*T, .1*T, T*.34, T*.04, 0, 0, Math.PI*2); g.fill();
  }
};
/* ---------- Ashen Desert and Dark Sea: walls, floors, terrain, wind ---------- */
Object.assign(WALLPAINT, {
  // Ashen Desert: a saguaro, a barrel cactus among dry grass, a sandstone outcrop with a bleached skull
  ash0(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.3, T*.07, 0, 0, Math.PI*2); g.fill();
    const body = (x0, y0, x1, y1, w) => { const gg = g.createLinearGradient((x0 - w)*T, 0, (x0 + w)*T, 0); gg.addColorStop(0, '#2f5430'); gg.addColorStop(.4, '#5f9440'); gg.addColorStop(1, '#264626');
      g.strokeStyle = gg; g.lineWidth = w*2*T; g.beginPath(); g.moveTo(x0*T, y0*T); g.lineTo(x1*T, y1*T); g.stroke(); g.strokeStyle = 'rgba(10,30,10,.4)'; g.lineWidth = 1; for (const o of [-.45,.05,.5]){ g.beginPath(); g.moveTo((x0 + w*o)*T, y0*T); g.lineTo((x1 + w*o)*T, y1*T); g.stroke(); } };
    body(.5, .9, .5, .18, .075);
    g.lineCap = 'round'; g.strokeStyle = '#4a8038'; g.lineWidth = T*.13; g.beginPath(); g.moveTo(.5*T, .62*T); g.lineTo(.26*T, .62*T); g.lineTo(.26*T, .36*T); g.moveTo(.5*T, .5*T); g.lineTo(.74*T, .5*T); g.lineTo(.74*T, .3*T); g.stroke();
    g.strokeStyle = '#5f9440'; g.lineWidth = T*.05; g.stroke();
    g.fillStyle = 'rgba(240,232,190,.85)'; for (let i=0;i<22;i++){ g.fillRect((.26 + (rnd()-.5)*.6)*T, (.2 + rnd()*.65)*T, 1.2, 1.2); }
    g.fillStyle = '#f08ab4'; g.beginPath(); g.arc(.5*T, .17*T, T*.035, 0, Math.PI*2); g.fill(); g.fillStyle = '#ffd86a'; g.beginPath(); g.arc(.5*T, .17*T, T*.015, 0, Math.PI*2); g.fill();
  },
  ash1(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(T*.5, T*.88, T*.32, T*.07, 0, 0, Math.PI*2); g.fill();
    g.strokeStyle = '#a89058'; g.lineWidth = 1.2; g.beginPath(); for (let i=0;i<9;i++){ const x0 = .2 + rnd()*.6, h = .12 + rnd()*.16; g.moveTo(x0*T, .88*T); g.quadraticCurveTo((x0 + (rnd()-.5)*.1)*T, (.88 - h*.6)*T, (x0 + (rnd()-.5)*.16)*T, (.88 - h)*T); } g.stroke();
    const bg = g.createRadialGradient(.44*T, .52*T, T*.04, .5*T, .62*T, T*.3); bg.addColorStop(0, '#79ab52'); bg.addColorStop(1, '#2a502a');
    g.fillStyle = bg; g.beginPath(); g.ellipse(.5*T, .62*T, T*.26, T*.27, 0, 0, Math.PI*2); g.fill();
    g.strokeStyle = 'rgba(10,36,12,.5)'; g.lineWidth = 1; for (const o of [-.17,-.08,0,.08,.17]){ g.beginPath(); g.moveTo((.5 + o*.2)*T, .37*T); g.quadraticCurveTo((.5 + o)*T, .62*T, (.5 + o*.2)*T, .88*T); g.stroke(); }
    g.fillStyle = 'rgba(244,236,196,.9)'; for (let i=0;i<26;i++){ const a = rnd()*6.28, d = Math.sqrt(rnd())*.24; g.fillRect(.5*T + Math.cos(a)*d*T, .62*T + Math.sin(a)*d*T*1.05, 1.2, 1.2); }
    for (const [fx0, c] of [[.42,'#ffd24a'],[.5,'#ff9a3a'],[.58,'#ffd24a']]){ g.fillStyle = c; g.beginPath(); g.arc(fx0*T, .36*T, T*.035, 0, Math.PI*2); g.fill(); }
  },
  ash2(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.4, T*.08, 0, 0, Math.PI*2); g.fill();
    const strata = ['#c49c66', '#a67c4c', '#d0aa74', '#8e6a40'];
    const slab = (x0, y0, x1, y1, c) => { const sg = g.createLinearGradient(x0*T, 0, x1*T, 0); sg.addColorStop(0, c); sg.addColorStop(1, '#6a4c2c'); g.fillStyle = sg; g.beginPath(); g.moveTo(x0*T, y1*T); g.lineTo((x0 + .02)*T, y0*T); g.lineTo((x1 - .04)*T, (y0 - .02)*T); g.lineTo(x1*T, y1*T); g.closePath(); g.fill(); };
    slab(.16, .62, .84, .9, strata[0]); slab(.22, .42, .76, .64, strata[1]); slab(.3, .22, .68, .44, strata[2]); slab(.4, .1, .6, .24, strata[3]);
    g.strokeStyle = 'rgba(60,38,18,.5)'; g.lineWidth = 1; g.beginPath(); for (const y of [.62,.42,.24]){ g.moveTo(.2*T, y*T); g.lineTo(.8*T, (y - .01)*T); } g.moveTo(.5*T, .24*T); g.lineTo(.46*T, .42*T); g.lineTo(.52*T, .62*T); g.stroke();
    g.fillStyle = 'rgba(255,236,190,.18)'; g.fillRect(.3*T, .22*T, .1*T, .5*T);
    g.fillStyle = '#e8dfc6'; g.beginPath(); g.arc(.3*T, .84*T, T*.06, 0, Math.PI*2); g.fill(); g.fillRect(.27*T, .86*T, .06*T, .04*T);
    g.fillStyle = 'rgba(30,20,10,.85)'; g.beginPath(); g.arc(.28*T, .835*T, T*.014, 0, Math.PI*2); g.arc(.32*T, .835*T, T*.014, 0, Math.PI*2); g.fill();
    g.strokeStyle = '#e8dfc6'; g.lineWidth = 2; g.beginPath(); g.moveTo(.24*T, .78*T); g.quadraticCurveTo(.2*T, .74*T, .22*T, .7*T); g.moveTo(.36*T, .78*T); g.quadraticCurveTo(.4*T, .74*T, .38*T, .7*T); g.stroke();
  },
  // Dark Sea: coral, a rock spire with barnacles and kelp, a shipwreck mast
  sea0(g, T, rnd){
    g.fillStyle = 'rgba(0,10,20,.4)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.38, T*.08, 0, 0, Math.PI*2); g.fill();
    const cols = [['#d8527a', '#ff9ab8'], ['#e8803a', '#ffc27a'], ['#9a5ad8', '#d4a8ff']];
    g.lineCap = 'round';
    for (let b=0;b<7;b++){ const [c0, c1] = cols[b % 3], x0 = .2 + rnd()*.6, h = .28 + rnd()*.34, lean = (rnd()-.5)*.2;
      g.strokeStyle = c0; g.lineWidth = T*(.06 + rnd()*.03); g.beginPath(); g.moveTo(x0*T, .9*T); g.quadraticCurveTo((x0 + lean*.5)*T, (.9 - h*.5)*T, (x0 + lean)*T, (.9 - h)*T);
      g.moveTo((x0 + lean*.5)*T, (.9 - h*.55)*T); g.lineTo((x0 + lean*.5 + (rnd() < .5 ? -.09 : .09))*T, (.9 - h*.8)*T); g.stroke();
      g.strokeStyle = c1; g.lineWidth = T*.025; g.beginPath(); g.moveTo((x0 - .01)*T, .88*T); g.quadraticCurveTo((x0 + lean*.5 - .01)*T, (.9 - h*.5)*T, (x0 + lean - .01)*T, (.9 - h)*T); g.stroke();
      g.fillStyle = c1; g.beginPath(); g.arc((x0 + lean)*T, (.9 - h)*T, T*.035, 0, Math.PI*2); g.fill(); }
    g.fillStyle = 'rgba(60,70,60,.85)'; g.beginPath(); g.ellipse(.5*T, .9*T, T*.32, T*.06, 0, 0, Math.PI*2); g.fill();
  },
  sea1(g, T, rnd){
    g.fillStyle = 'rgba(0,10,20,.4)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.34, T*.08, 0, 0, Math.PI*2); g.fill();
    const rg = g.createLinearGradient(.25*T, 0, .75*T, 0); rg.addColorStop(0, '#2c3a46'); rg.addColorStop(.45, '#6a7e8c'); rg.addColorStop(1, '#1e2a34');
    g.fillStyle = rg; g.beginPath(); g.moveTo(.24*T, .9*T); g.lineTo(.3*T, .5*T); g.lineTo(.4*T, .34*T); g.lineTo(.46*T, .1*T); g.lineTo(.56*T, .3*T); g.lineTo(.66*T, .42*T); g.lineTo(.78*T, .9*T); g.closePath(); g.fill();
    g.fillStyle = 'rgba(225,235,225,.8)'; for (let i=0;i<22;i++){ const t = rnd(), x = .3 + .4*rnd(), y = .3 + .55*rnd(); g.beginPath(); g.arc(x*T, y*T, T*(.008 + rnd()*.014), 0, Math.PI*2); g.fill(); }
    g.lineWidth = 2.2; for (const [x0, c] of [[.28,'#3f8a4a'],[.34,'#2f6a3a'],[.7,'#3f8a4a'],[.76,'#2f6a3a']]){ g.strokeStyle = c; g.beginPath(); g.moveTo(x0*T, .9*T); g.bezierCurveTo((x0 + .05)*T, .74*T, (x0 - .05)*T, .6*T, (x0 + .02)*T, (.44 + rnd()*.1)*T); g.stroke(); }
  },
  sea2(g, T, rnd){
    g.fillStyle = 'rgba(0,10,20,.4)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.4, T*.08, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = '#4a3a2a'; g.fillRect(.2*T, .8*T, .6*T, .08*T); g.fillStyle = '#2a2018'; for (let i=0;i<5;i++) g.fillRect((.2 + i*.12)*T, .8*T, 1.2, .08*T);
    g.save(); g.translate(.46*T, .86*T); g.rotate(-.1);
    const mg = g.createLinearGradient(-.03*T, 0, .03*T, 0); mg.addColorStop(0, '#2a1e14'); mg.addColorStop(.5, '#6a523a'); mg.addColorStop(1, '#1c140c'); g.fillStyle = mg; g.fillRect(-.03*T, -.78*T, .06*T, .78*T);
    g.fillStyle = '#5a4630'; g.fillRect(-.2*T, -.62*T, .4*T, .04*T);
    const sg = g.createLinearGradient(0, -.6*T, 0, -.2*T); sg.addColorStop(0, '#d8d0b8'); sg.addColorStop(1, '#8a826c'); g.fillStyle = sg; g.beginPath(); g.moveTo(-.19*T, -.58*T); g.lineTo(.19*T, -.58*T); g.lineTo(.17*T, -.36*T); g.lineTo(.1*T, -.3*T); g.lineTo(.04*T, -.4*T); g.lineTo(-.05*T, -.26*T); g.lineTo(-.12*T, -.34*T); g.lineTo(-.18*T, -.28*T); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,50,30,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-.1*T, -.58*T); g.lineTo(-.08*T, -.34*T); g.moveTo(.08*T, -.58*T); g.lineTo(.07*T, -.38*T); g.stroke(); g.restore();
    g.strokeStyle = '#7a6a4a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(.3*T, .24*T); g.quadraticCurveTo(.22*T, .5*T, .24*T, .8*T); g.stroke();
    g.fillStyle = 'rgba(225,235,225,.75)'; for (let i=0;i<10;i++){ g.beginPath(); g.arc((.2 + rnd()*.6)*T, (.8 + rnd()*.06)*T, T*.012, 0, Math.PI*2); g.fill(); }
    g.strokeStyle = '#2f6a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(.74*T, .86*T); g.bezierCurveTo(.78*T, .7*T, .7*T, .6*T, .75*T, .5*T); g.stroke();
  }
});
/* more walls for the desert and the sea */
Object.assign(WALLPAINT, {
  // a dead tree with bones hanging from a branch and a vulture perched on top
  ash3(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.28, T*.07, 0, 0, Math.PI*2); g.fill();
    g.lineCap = 'round'; g.lineJoin = 'round';
    const limb = (x0, y0, x1, y1, cx, cy, w) => { g.strokeStyle = '#3a2e24'; g.lineWidth = w; g.beginPath(); g.moveTo(x0*T, y0*T); g.quadraticCurveTo(cx*T, cy*T, x1*T, y1*T); g.stroke(); g.strokeStyle = '#6e5c48'; g.lineWidth = w*.35; g.beginPath(); g.moveTo((x0 - .008)*T, y0*T); g.quadraticCurveTo((cx - .008)*T, cy*T, (x1 - .008)*T, y1*T); g.stroke(); };
    limb(.5, .9, .46, .5, .56, .7, T*.1);
    limb(.47, .56, .22, .3, .34, .5, T*.05); limb(.3, .42, .14, .36, .2, .4, T*.03);
    limb(.48, .5, .78, .26, .64, .4, T*.05); limb(.66, .36, .86, .4, .78, .3, T*.03);
    limb(.46, .5, .5, .12, .42, .3, T*.04);
    g.strokeStyle = '#3a2e24'; g.lineWidth = 1.2; g.beginPath(); for (let i=0;i<5;i++){ const x0 = .2 + rnd()*.6, y0 = .2 + rnd()*.3; g.moveTo(x0*T, y0*T); g.lineTo((x0 + (rnd()-.5)*.1)*T, (y0 - .06 - rnd()*.05)*T); } g.stroke();
    // bones on a string from the left limb
    g.strokeStyle = '#8a7a64'; g.lineWidth = 1; g.beginPath(); g.moveTo(.27*T, .38*T); g.lineTo(.27*T, .52*T); g.moveTo(.2*T, .35*T); g.lineTo(.2*T, .47*T); g.stroke();
    g.fillStyle = '#ece3cc'; g.beginPath(); g.arc(.27*T, .56*T, T*.035, 0, Math.PI*2); g.fill(); g.fillRect(.255*T, .58*T, .03*T, .02*T);
    g.fillStyle = 'rgba(30,20,10,.85)'; g.fillRect(.26*T, .55*T, 1.6, 1.6); g.fillRect(.28*T, .55*T, 1.6, 1.6);
    g.strokeStyle = '#ece3cc'; g.lineWidth = 2; g.beginPath(); g.moveTo(.2*T, .47*T); g.lineTo(.2*T, .6*T); g.stroke(); g.beginPath(); g.arc(.2*T, .475*T, 1.6, 0, Math.PI*2); g.arc(.2*T, .605*T, 1.6, 0, Math.PI*2); g.stroke();
    // a vulture
    g.fillStyle = '#1e1a18'; g.beginPath(); g.ellipse(.52*T, .11*T, T*.06, T*.04, -.3, 0, Math.PI*2); g.fill(); g.beginPath(); g.moveTo(.46*T, .1*T); g.lineTo(.4*T, .13*T); g.lineTo(.47*T, .13*T); g.closePath(); g.fill();
    g.fillStyle = '#c9585a'; g.beginPath(); g.arc(.57*T, .075*T, T*.018, 0, Math.PI*2); g.fill(); g.fillStyle = '#d8b04a'; g.beginPath(); g.moveTo(.585*T, .075*T); g.lineTo(.62*T, .09*T); g.lineTo(.585*T, .09*T); g.closePath(); g.fill();
  },
  // the broken column of an old temple, half buried, a fallen drum beside it
  ash4(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.38, T*.08, 0, 0, Math.PI*2); g.fill();
    const col = g.createLinearGradient(.3*T, 0, .6*T, 0); col.addColorStop(0, '#d9bd86'); col.addColorStop(.5, '#b89a64'); col.addColorStop(1, '#7a5e38');
    g.fillStyle = col; g.beginPath(); g.moveTo(.3*T, .88*T); g.lineTo(.32*T, .3*T); g.lineTo(.4*T, .24*T); g.lineTo(.46*T, .3*T); g.lineTo(.52*T, .2*T); g.lineTo(.6*T, .28*T); g.lineTo(.6*T, .88*T); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(70,46,20,.45)'; g.lineWidth = 1; g.beginPath(); for (const o of [.36,.42,.48,.54]){ g.moveTo(o*T, .88*T); g.lineTo((o + .005)*T, (.3 - (o - .3)*.1)*T); } g.stroke();
    g.fillStyle = '#9a7c4c'; g.fillRect(.27*T, .82*T, .36*T, .07*T); g.fillStyle = '#c4a470'; g.fillRect(.27*T, .82*T, .36*T, .02*T);
    g.strokeStyle = 'rgba(70,46,20,.5)'; g.beginPath(); g.moveTo(.32*T, .55*T); g.lineTo(.5*T, .6*T); g.lineTo(.44*T, .7*T); g.stroke();
    // a fallen drum with a carved glyph, sand banked against it
    g.fillStyle = '#b09060'; g.beginPath(); g.ellipse(.74*T, .8*T, T*.14, T*.09, 0, 0, Math.PI*2); g.fill(); g.fillStyle = '#d4b680'; g.beginPath(); g.ellipse(.74*T, .77*T, T*.14, T*.07, 0, 0, Math.PI*2); g.fill();
    g.strokeStyle = 'rgba(80,52,24,.7)'; g.lineWidth = 1.2; g.beginPath(); g.arc(.74*T, .77*T, T*.04, 0, Math.PI*2); g.moveTo(.74*T, .73*T); g.lineTo(.74*T, .81*T); g.stroke();
    const dune = g.createLinearGradient(0, .78*T, 0, .92*T); dune.addColorStop(0, 'rgba(226,196,140,.9)'); dune.addColorStop(1, 'rgba(170,132,84,.9)'); g.fillStyle = dune; g.beginPath(); g.moveTo(.1*T, .9*T); g.quadraticCurveTo(.3*T, .8*T, .5*T, .88*T); g.quadraticCurveTo(.7*T, .84*T, .9*T, .9*T); g.closePath(); g.fill();
  },
  // an agave, a skull in the sand and a tumbleweed caught against a rock
  ash5(g, T, rnd){
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(T*.5, T*.88, T*.36, T*.07, 0, 0, Math.PI*2); g.fill();
    g.fillStyle = '#8a6c42'; g.beginPath(); g.moveTo(.58*T, .88*T); g.lineTo(.62*T, .56*T); g.lineTo(.74*T, .5*T); g.lineTo(.88*T, .6*T); g.lineTo(.9*T, .88*T); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,236,190,.2)'; g.fillRect(.63*T, .52*T, .06*T, .34*T);
    g.strokeStyle = 'rgba(244,222,170,.75)'; g.lineWidth = 1; g.beginPath(); for (let i=0;i<9;i++){ const x0 = .22 + rnd()*.34, r2 = .06 + rnd()*.08; g.moveTo(x0*T, (.84 + rnd()*.03)*T); g.arc(x0*T, (.84 + rnd()*.03)*T, r2*T, rnd()*6, rnd()*6 + 2.4); } g.stroke();
    const cx = .3, cy = .8;
    for (let i=0;i<11;i++){ const a = -Math.PI*.5 + (i - 5)*.26, len = .3 - Math.abs(i - 5)*.012; const lg = g.createLinearGradient(cx*T, cy*T, (cx + Math.cos(a)*len)*T, (cy + Math.sin(a)*len)*T); lg.addColorStop(0, '#2f5a3e'); lg.addColorStop(1, '#79b48c');
      g.fillStyle = lg; g.beginPath(); g.moveTo((cx + Math.cos(a + 1.57)*.03)*T, (cy + Math.sin(a + 1.57)*.03)*T); g.lineTo((cx + Math.cos(a)*len)*T, (cy + Math.sin(a)*len)*T); g.lineTo((cx + Math.cos(a - 1.57)*.03)*T, (cy + Math.sin(a - 1.57)*.03)*T); g.closePath(); g.fill(); }
    g.strokeStyle = '#a8603a'; g.lineWidth = 1; g.beginPath(); g.moveTo(.3*T, .8*T); g.lineTo(.3*T, .22*T); g.stroke(); g.fillStyle = '#e9b84a'; for (let i=0;i<4;i++){ g.beginPath(); g.arc((.3 + (i%2 ? .02 : -.02))*T, (.22 + i*.03)*T, T*.02, 0, Math.PI*2); g.fill(); }
    g.strokeStyle = '#a98a56'; g.lineWidth = 1; g.beginPath(); for (let i=0;i<9;i++){ g.moveTo(.52*T + Math.cos(i)*T*.02, .82*T); g.arc(.52*T, .8*T, T*(.07 + rnd()*.03), rnd()*6, rnd()*6 + 3.2); } g.stroke();
    g.fillStyle = '#efe6cf'; g.beginPath(); g.arc(.47*T, .86*T, T*.04, 0, Math.PI*2); g.fill(); g.fillStyle = 'rgba(30,20,10,.85)'; g.fillRect(.455*T, .85*T, 1.6, 1.6); g.fillRect(.48*T, .85*T, 1.6, 1.6);
  },
  // a giant clam, open, with a glowing pearl
  sea3(g, T, rnd){
    g.fillStyle = 'rgba(0,10,20,.4)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.36, T*.08, 0, 0, Math.PI*2); g.fill();
    const lower = g.createLinearGradient(0, .62*T, 0, .9*T); lower.addColorStop(0, '#d9c8b0'); lower.addColorStop(1, '#8a7860'); g.fillStyle = lower; g.beginPath(); g.moveTo(.14*T, .66*T); g.quadraticCurveTo(.5*T, .96*T, .86*T, .66*T); g.quadraticCurveTo(.5*T, .74*T, .14*T, .66*T); g.fill();
    const mant = g.createRadialGradient(.5*T, .62*T, 2, .5*T, .62*T, T*.34); mant.addColorStop(0, '#3ac0b0'); mant.addColorStop(.6, '#2a7ab8'); mant.addColorStop(1, '#5a3ab0'); g.fillStyle = mant; g.beginPath(); g.ellipse(.5*T, .64*T, T*.33, T*.1, 0, 0, Math.PI*2); g.fill();
    g.save(); g.translate(.5*T, .66*T); g.rotate(-.06);
    const up = g.createLinearGradient(0, -.5*T, 0, 0); up.addColorStop(0, '#efe3cc'); up.addColorStop(1, '#a8947a'); g.fillStyle = up; g.beginPath(); g.moveTo(-.36*T, 0); g.quadraticCurveTo(-.4*T, -.5*T, 0, -.52*T); g.quadraticCurveTo(.4*T, -.5*T, .36*T, 0); g.quadraticCurveTo(0, -.08*T, -.36*T, 0); g.fill();
    g.strokeStyle = 'rgba(90,72,50,.55)'; g.lineWidth = 1.2; g.beginPath(); for (let i=-4;i<=4;i++){ g.moveTo(i*.04*T, -.06*T); g.quadraticCurveTo(i*.075*T, -.3*T, i*.085*T, -.5*T + Math.abs(i)*.012*T); } g.stroke(); g.restore();
    const pr = g.createRadialGradient(.5*T, .6*T, 1, .5*T, .6*T, T*.07); pr.addColorStop(0, '#ffffff'); pr.addColorStop(.5, '#e6f2ff'); pr.addColorStop(1, '#9ab8d8'); g.fillStyle = pr; g.beginPath(); g.arc(.5*T, .6*T, T*.065, 0, Math.PI*2); g.fill();
    g.fillStyle = 'rgba(210,240,255,.5)'; g.beginPath(); g.arc(.5*T, .6*T, T*.11, 0, Math.PI*2); g.fill();
    g.fillStyle = '#3f8a4a'; g.beginPath(); g.moveTo(.1*T, .9*T); g.bezierCurveTo(.06*T, .7*T, .14*T, .6*T, .1*T, .5*T); g.lineTo(.13*T, .5*T); g.bezierCurveTo(.17*T, .62*T, .1*T, .72*T, .14*T, .9*T); g.fill();
  },
  // a sunken anchor wrapped in chain and kelp, barnacles on its arms
  sea4(g, T, rnd){
    g.fillStyle = 'rgba(0,10,20,.4)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.36, T*.08, 0, 0, Math.PI*2); g.fill();
    g.lineCap = 'round'; g.lineJoin = 'round';
    const ir = (w, f) => { g.strokeStyle = '#1c2630'; g.lineWidth = w + 2; f(); g.strokeStyle = '#6a7c8a'; g.lineWidth = w; f(); g.strokeStyle = 'rgba(190,215,230,.45)'; g.lineWidth = w*.3; f(); };
    ir(T*.06, () => { g.beginPath(); g.moveTo(.5*T, .26*T); g.lineTo(.5*T, .84*T); g.stroke(); });
    ir(T*.05, () => { g.beginPath(); g.moveTo(.36*T, .36*T); g.lineTo(.64*T, .36*T); g.stroke(); });
    ir(T*.055, () => { g.beginPath(); g.moveTo(.2*T, .66*T); g.quadraticCurveTo(.26*T, .86*T, .5*T, .84*T); g.quadraticCurveTo(.74*T, .86*T, .8*T, .66*T); g.stroke(); });
    g.fillStyle = '#6a7c8a'; for (const s of [-1, 1]){ g.beginPath(); g.moveTo(.5*T + s*.3*T, .6*T); g.lineTo(.5*T + s*.36*T, .7*T); g.lineTo(.5*T + s*.22*T, .72*T); g.closePath(); g.fill(); }
    g.strokeStyle = '#6a7c8a'; g.lineWidth = 2; g.beginPath(); g.arc(.5*T, .2*T, T*.06, 0, Math.PI*2); g.stroke();
    g.strokeStyle = '#5b7080'; g.lineWidth = 2; g.beginPath(); g.moveTo(.5*T, .14*T); g.bezierCurveTo(.7*T, .1*T, .9*T, .2*T, .86*T, .4*T); g.stroke();
    g.fillStyle = 'rgba(214,226,214,.8)'; for (let i=0;i<24;i++){ const t = rnd(); g.beginPath(); g.arc((.2 + .6*rnd())*T, (.34 + .52*rnd())*T, T*(.007 + rnd()*.012), 0, Math.PI*2); g.fill(); }
    g.lineWidth = 2.4; for (const [x0, c] of [[.38,'#3a8a4a'],[.44,'#2c6a3a'],[.6,'#3a8a4a']]){ g.strokeStyle = c; g.beginPath(); g.moveTo(x0*T, .86*T); g.bezierCurveTo((x0 + .08)*T, .7*T, (x0 - .08)*T, .55*T, (x0 + .03)*T, (.36 + rnd()*.1)*T); g.stroke(); }
  },
  // a purple sea fan, tube sponges and a fish skeleton on the sand
  sea5(g, T, rnd){
    g.fillStyle = 'rgba(0,10,20,.4)'; g.beginPath(); g.ellipse(T*.5, T*.9, T*.38, T*.08, 0, 0, Math.PI*2); g.fill();
    g.lineCap = 'round';
    const branch = (x, y, a, len, w, depth) => { if (depth > 5 || len < T*.02) return; const x2 = x + Math.cos(a)*len, y2 = y + Math.sin(a)*len; g.strokeStyle = depth < 2 ? '#8a3ab8' : '#b45ae0'; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      branch(x2, y2, a - .45 + (rnd()-.5)*.2, len*.74, w*.75, depth + 1); branch(x2, y2, a + .45 + (rnd()-.5)*.2, len*.74, w*.75, depth + 1); };
    branch(.34*T, .88*T, -Math.PI/2 - .12, T*.2, T*.035, 0);
    g.strokeStyle = 'rgba(240,200,255,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(.34*T, .88*T); g.lineTo(.32*T, .68*T); g.stroke();
    const tubes = [[.62,.3,'#e8802a'],[.7,.22,'#d85a3a'],[.78,.34,'#e8a83a'],[.55,.16,'#d85a3a']];
    for (const [x0, h, c] of tubes){ const tg = g.createLinearGradient((x0 - .04)*T, 0, (x0 + .04)*T, 0); tg.addColorStop(0, c); tg.addColorStop(.5, '#ffd9a0'); tg.addColorStop(1, c); g.fillStyle = tg; g.fillRect((x0 - .035)*T, (.88 - h)*T, .07*T, h*T); g.fillStyle = '#4a1a10'; g.beginPath(); g.ellipse(x0*T, (.88 - h)*T, T*.035, T*.014, 0, 0, Math.PI*2); g.fill(); }
    g.strokeStyle = 'rgba(236,230,210,.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(.14*T, .84*T); g.lineTo(.4*T, .84*T); for (let i=0;i<6;i++){ g.moveTo((.18 + i*.04)*T, .84*T); g.lineTo((.19 + i*.04)*T, (.78 + (i%2)*.02)*T); } g.moveTo(.14*T, .84*T); g.lineTo(.1*T, .8*T); g.lineTo(.1*T, .88*T); g.closePath(); g.stroke();
    g.fillStyle = 'rgba(225,235,225,.75)'; for (let i=0;i<10;i++){ g.beginPath(); g.arc((.1 + rnd()*.8)*T, (.88 + rnd()*.03)*T, T*.01, 0, Math.PI*2); g.fill(); }
  }
});
/* the shipwreck of the Dark Sea: one big hull that takes several squares */
const _wreckSpr = {};
function paintWreck(g, T, w, h){
  const Wp = w*T, Hp = (h + 1.2)*T, base = Hp - .14*T, hh0 = h*T*.78, rnd = mkRng(w*131 + h*17 + 5);
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = 'rgba(0,10,20,.42)'; g.beginPath(); g.ellipse(Wp*.5, base + T*.04, Wp*.5, T*.14, 0, 0, Math.PI*2); g.fill();
  // sand banked against the hull
  const sd = g.createLinearGradient(0, base - T*.3, 0, base + T*.1); sd.addColorStop(0, 'rgba(176,160,120,0)'); sd.addColorStop(1, 'rgba(176,160,120,.8)'); g.fillStyle = sd; g.beginPath(); g.ellipse(Wp*.5, base, Wp*.5, T*.2, 0, 0, Math.PI*2); g.fill();
  const hull = () => {
    g.beginPath(); g.moveTo(.05*Wp, base - hh0*.95); g.lineTo(.05*Wp, base - hh0*.3); g.quadraticCurveTo(.2*Wp, base + T*.04, .52*Wp, base); g.quadraticCurveTo(.86*Wp, base - T*.04, .97*Wp, base - hh0*1.25);
    g.lineTo(.9*Wp, base - hh0*1.1); g.lineTo(.84*Wp, base - hh0*.82); g.lineTo(.76*Wp, base - hh0*1.0); g.lineTo(.68*Wp, base - hh0*.7); g.lineTo(.6*Wp, base - hh0*.92); g.lineTo(.5*Wp, base - hh0*.66); g.lineTo(.4*Wp, base - hh0*.86);
    g.lineTo(.3*Wp, base - hh0*.64); g.lineTo(.2*Wp, base - hh0*.92); g.lineTo(.12*Wp, base - hh0*.78); g.closePath();
  };
  // the dark inside, seen through the broken side
  hull(); const hg = g.createLinearGradient(0, base - hh0*1.2, 0, base); hg.addColorStop(0, '#6c5236'); hg.addColorStop(.5, '#4a3622'); hg.addColorStop(1, '#2a1e12'); g.fillStyle = hg; g.fill();
  g.save(); hull(); g.clip();
  // planks along the hull, with their seams and nails
  for (let i=0;i<9;i++){ const y = base - hh0*1.3 + i*hh0*.2; g.strokeStyle = i%2 ? 'rgba(20,12,6,.55)' : 'rgba(150,118,76,.35)'; g.lineWidth = i%2 ? 1.2 : 1; g.beginPath(); g.moveTo(0, y + Wp*.02); g.quadraticCurveTo(Wp*.5, y + hh0*.12, Wp, y - hh0*.18); g.stroke(); }
  g.fillStyle = 'rgba(20,12,6,.6)'; for (let i=0;i<60;i++){ g.fillRect((.07 + rnd()*.86)*Wp, base - hh0*(.15 + rnd()*.85), 1.6, 1.6); }
  // a rotten gap with ribs showing
  g.fillStyle = '#150e08'; g.beginPath(); g.ellipse(.38*Wp, base - hh0*.42, Wp*.1, hh0*.26, -.1, 0, Math.PI*2); g.fill();
  g.strokeStyle = '#7a5e3a'; g.lineWidth = T*.05; for (let i=-2;i<=2;i++){ g.beginPath(); g.moveTo(.38*Wp + i*Wp*.035, base - hh0*.7); g.quadraticCurveTo(.38*Wp + i*Wp*.04, base - hh0*.42, .38*Wp + i*Wp*.03, base - hh0*.14); g.stroke(); }
  const sh = g.createLinearGradient(0, base - hh0*1.2, 0, base); sh.addColorStop(0, 'rgba(255,230,180,.18)'); sh.addColorStop(.35, 'rgba(255,230,180,0)'); sh.addColorStop(1, 'rgba(0,10,20,.4)'); g.fillStyle = sh; g.fillRect(0, 0, Wp, Hp);
  g.restore();
  g.strokeStyle = 'rgba(15,8,4,.7)'; g.lineWidth = 1.5; hull(); g.stroke();
  // a gilded rail and a row of portholes
  g.strokeStyle = '#b8903c'; g.lineWidth = T*.035; g.beginPath(); g.moveTo(.06*Wp, base - hh0*.5); g.quadraticCurveTo(.5*Wp, base - hh0*.3, .95*Wp, base - hh0*.78); g.stroke();
  for (let i=0;i<4;i++){ const t = .62 + i*.1, px = t*Wp, py = base - hh0*(.55 - (t - .5)*.08) - (t - .62)*hh0*.5; if (i === 1 || i === 2) continue;
    g.fillStyle = '#b8903c'; g.beginPath(); g.arc(px, py, T*.085, 0, Math.PI*2); g.fill(); const pg = g.createRadialGradient(px, py, 1, px, py, T*.065); pg.addColorStop(0, '#9ff0e0'); pg.addColorStop(1, '#14505a'); g.fillStyle = pg; g.beginPath(); g.arc(px, py, T*.065, 0, Math.PI*2); g.fill(); }
  // masts: one tall and leaning, one snapped
  const mast = (x0, y0, x1, y1, wd) => { const mg = g.createLinearGradient(x0 - wd, 0, x0 + wd, 0); mg.addColorStop(0, '#2a1e14'); mg.addColorStop(.5, '#7a6045'); mg.addColorStop(1, '#241a10'); g.strokeStyle = mg; g.lineWidth = wd*2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const mx0 = .46*Wp, my0 = base - hh0*.72, mx1 = .39*Wp, my1 = T*.1;
  mast(mx0, my0, mx1, my1, T*.05);
  mast(.78*Wp, base - hh0*.9, .84*Wp, base - hh0*1.9, T*.045);
  g.strokeStyle = '#5a4430'; g.lineWidth = T*.035; g.beginPath(); g.moveTo(mx1 - Wp*.2, my1 + T*.36); g.lineTo(mx1 + Wp*.22, my1 + T*.3); g.stroke();
  // the torn sail, hanging from the yard
  const sx0 = mx1 - Wp*.19, sx1 = mx1 + Wp*.2, sy0 = my1 + T*.38, sy1 = my1 + T*(h*.95 + .5);
  const sg = g.createLinearGradient(0, sy0, 0, sy1); sg.addColorStop(0, '#e6dec6'); sg.addColorStop(1, '#8e876e'); g.fillStyle = sg;
  g.beginPath(); g.moveTo(sx0, sy0); g.lineTo(sx1, sy0 - T*.04); g.lineTo(sx1 - T*.02, sy0 + (sy1 - sy0)*.5); g.lineTo(sx1 - Wp*.03, sy0 + (sy1 - sy0)*.62); g.lineTo(sx1 - Wp*.06, sy0 + (sy1 - sy0)*.9); g.lineTo(sx1 - Wp*.1, sy0 + (sy1 - sy0)*.62); g.lineTo(sx1 - Wp*.14, sy1); g.lineTo(sx0 + Wp*.17, sy0 + (sy1 - sy0)*.7); g.lineTo(sx0 + Wp*.1, sy0 + (sy1 - sy0)*.95); g.lineTo(sx0 + Wp*.05, sy0 + (sy1 - sy0)*.55); g.lineTo(sx0, sy0 + (sy1 - sy0)*.3); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(90,80,56,.45)'; g.lineWidth = 1; g.beginPath(); for (let i=1;i<5;i++){ const x = sx0 + (sx1 - sx0)*i/5; g.moveTo(x, sy0); g.quadraticCurveTo(x + 3, (sy0 + sy1)*.5, x - 2, sy0 + (sy1 - sy0)*.6); } g.stroke();
  g.fillStyle = 'rgba(30,24,16,.6)'; g.beginPath(); g.ellipse((sx0 + sx1)*.5, sy0 + (sy1 - sy0)*.3, T*.1, T*.14, .3, 0, Math.PI*2); g.fill();
  // a dark flag with a skull on the stump
  g.fillStyle = '#1a1414'; g.beginPath(); g.moveTo(.84*Wp, base - hh0*1.9); g.lineTo(.84*Wp + T*.34, base - hh0*1.9 + T*.04); g.lineTo(.84*Wp + T*.28, base - hh0*1.9 + T*.2); g.lineTo(.84*Wp + T*.34, base - hh0*1.9 + T*.34); g.lineTo(.84*Wp, base - hh0*1.9 + T*.3); g.closePath(); g.fill();
  g.fillStyle = '#ece3cc'; g.beginPath(); g.arc(.84*Wp + T*.14, base - hh0*1.9 + T*.15, T*.04, 0, Math.PI*2); g.fill();
  // rigging
  g.strokeStyle = 'rgba(60,46,30,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(mx1, my1 + T*.1); g.lineTo(.08*Wp, base - hh0*.9); g.moveTo(mx1, my1 + T*.1); g.lineTo(.74*Wp, base - hh0*.95); g.moveTo(mx1, my1 + T*.1); g.lineTo(.24*Wp, base - hh0*.92); g.stroke();
  // life of the sea on the wood: barnacles, coral, kelp
  g.fillStyle = 'rgba(214,226,214,.85)'; for (let i=0;i<46;i++){ g.beginPath(); g.arc((.08 + rnd()*.86)*Wp, base - hh0*(.05 + rnd()*.6), T*(.008 + rnd()*.014), 0, Math.PI*2); g.fill(); }
  const cor = ['#d8527a', '#e8803a', '#9a5ad8']; for (let i=0;i<9;i++){ const x = (.15 + rnd()*.7)*Wp, y = base - hh0*(.05 + rnd()*.3), c = cor[i%3]; g.strokeStyle = c; g.lineWidth = T*.045; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd()-.5)*T*.1, y - T*(.08 + rnd()*.1)); g.stroke(); }
  g.lineWidth = T*.04; for (const [fx0, c] of [[.12,'#3a8a4a'],[.2,'#2c6a3a'],[.58,'#3a8a4a'],[.9,'#2c6a3a'],[.66,'#3a8a4a']]){ g.strokeStyle = c; g.beginPath(); g.moveTo(fx0*Wp, base + T*.02); g.bezierCurveTo((fx0 + .03)*Wp, base - hh0*.5, (fx0 - .03)*Wp, base - hh0*.9, (fx0 + .01)*Wp, base - hh0*(1.0 + rnd()*.35)); g.stroke(); }
}
function drawWreck(wr, time){
  const T = tile, w = wr.w, h = wr.h, key = w + 'x' + h + '@' + Math.round(T*dpr);
  let s = _wreckSpr[key];
  if (!s){ for (const k in _wreckSpr) delete _wreckSpr[k]; s = document.createElement('canvas'); s.width = Math.ceil(w*T*dpr); s.height = Math.ceil((h + 1.2)*T*dpr); const g = s.getContext('2d'); g.scale(dpr, dpr); paintWreck(g, T, w, h); _wreckSpr[key] = s; }
  const px = wr.x*T, py = (wr.y + h)*T - (h + 1.2)*T + T*.16;
  ctx.drawImage(s, px, py, w*T, (h + 1.2)*T);
  if (reduce) return;
  // the portholes glow, bubbles rise from the broken hull and the torn sail stirs
  const Wp = w*T, base = (wr.y + h)*T + T*.02, hh0 = h*T*.78;
  for (let i=0;i<2;i++){ const k = .62 + i*.3; glow(px + Wp*k, base - hh0*.55, T*.5, 'rgba(90,230,200,' + (.13 + .06*Math.sin(time*2 + i*2)) + ')'); }
  for (let i=0;i<5;i++){ const p = (time*.22 + i*.21) % 1; ctx.strokeStyle = 'rgba(200,240,250,' + (.55*(1 - p)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px + Wp*(.3 + .1*i) + Math.sin(time*2 + i)*T*.05, base - hh0*.6 - p*T*1.6, T*(.02 + .018*(i%3)), 0, Math.PI*2); ctx.stroke(); }
}
/* quicksand and whirlpool tiles */
function paintQuicksand(g, T, x, y){
  const r = i => hh(x, y, 340+i);
  const gr = g.createRadialGradient(T*.5, T*.5, T*.05, T*.5, T*.5, T*.62); gr.addColorStop(0, '#1e150b'); gr.addColorStop(.4, '#54401f'); gr.addColorStop(.75, '#8f7444'); gr.addColorStop(1, '#b89a64'); g.fillStyle = gr; g.fillRect(0, 0, T, T);
  // wet sheen and a raised, crumbling lip
  g.strokeStyle = 'rgba(255,236,190,.22)'; g.lineWidth = 1.2; for (let i=1;i<5;i++){ g.beginPath(); g.ellipse(T*.5, T*.5, T*(.08 + i*.09), T*(.06 + i*.07), 0, Math.PI*1.05, Math.PI*1.8); g.stroke(); }
  g.fillStyle = 'rgba(30,20,10,.35)'; for (let i=0;i<14;i++){ const a = r(i)*6.28, d = T*(.36 + r(20+i)*.12); g.beginPath(); g.arc(T*.5 + Math.cos(a)*d, T*.5 + Math.sin(a)*d*.95, T*(.012 + r(40+i)*.02), 0, Math.PI*2); g.fill(); }
  g.fillStyle = 'rgba(255,236,190,.22)'; for (let i=0;i<10;i++){ const a = r(60+i)*6.28, d = T*(.38 + r(80+i)*.1); g.fillRect(T*.5 + Math.cos(a)*d, T*.5 + Math.sin(a)*d, 1.6, 1.2); }
  if (r(0) < .55){ g.strokeStyle = '#e8dfc6'; g.lineWidth = 2; g.lineCap = 'round'; const a = r(1)*6; g.beginPath(); g.moveTo(T*.5 + Math.cos(a)*T*.2, T*.5 + Math.sin(a)*T*.2); g.lineTo(T*.5 + Math.cos(a)*T*.36, T*.5 + Math.sin(a)*T*.36); g.stroke(); g.fillStyle = '#e8dfc6'; g.beginPath(); g.arc(T*.5 + Math.cos(a)*T*.38, T*.5 + Math.sin(a)*T*.38, T*.025, 0, Math.PI*2); g.fill(); }
}
function paintSandSpiral(g, T){
  g.lineCap = 'round';
  for (let a=0;a<4;a++){ g.beginPath(); for (let i=0;i<=26;i++){ const t = i/26, ang = a*1.571 + t*4.4, rad = T*(.05 + t*.42); const px = T*.5 + Math.cos(ang)*rad, py = T*.5 + Math.sin(ang)*rad*.94; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.strokeStyle = 'rgba(24,16,8,.5)'; g.lineWidth = T*.06; g.stroke(); g.strokeStyle = 'rgba(236,208,150,.35)'; g.lineWidth = T*.018; g.stroke(); }
}
function paintWhirl(g, T){
  g.lineCap = 'round';
  const gr = g.createRadialGradient(T*.5, T*.5, T*.02, T*.5, T*.5, T*.5); gr.addColorStop(0, '#01060c'); gr.addColorStop(.4, '#0a2840'); gr.addColorStop(1, 'rgba(29,90,120,0)'); g.fillStyle = gr; g.beginPath(); g.arc(T*.5, T*.5, T*.5, 0, Math.PI*2); g.fill();
  for (let a=0;a<4;a++){ g.beginPath(); for (let i=0;i<=26;i++){ const t = i/26, ang = a*1.571 + t*5.2, rad = T*(.05 + t*.44); const px = T*.5 + Math.cos(ang)*rad, py = T*.5 + Math.sin(ang)*rad; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.strokeStyle = 'rgba(120,200,230,.5)'; g.lineWidth = T*.05; g.stroke(); g.strokeStyle = 'rgba(235,250,255,.85)'; g.lineWidth = T*.018; g.stroke(); }
}
let _dyn = {};
function dynSprite(name, T, paint){
  const key = name + Math.round(T*dpr); let s = _dyn[key];
  if (!s){ for (const k in _dyn) if (k.startsWith(name)) delete _dyn[k]; s = document.createElement('canvas'); s.width = s.height = Math.ceil(T*dpr); const g = s.getContext('2d'); g.scale(dpr, dpr); paint(g, T); _dyn[key] = s; }
  return s;
}
function drawQuicksandTile(x, y, time){
  const T = tile, px = x*T, py = y*T, cx = px + T/2, cy = py + T/2;
  ctx.drawImage(terrSpr('q|' + x + ',' + y, T, (g, TT) => paintQuicksand(g, TT, x, y)), px, py, T, T);
  if (reduce) return;
  const ph0 = hh(x, y, 360)*6.28, sp = dynSprite('qs', T, paintSandSpiral);
  ctx.save(); ctx.beginPath(); ctx.rect(px, py, T, T); ctx.clip();
  // the whole surface turns slowly toward the middle, and the middle breathes
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(time*.55 + ph0); const bs = 1 + .05*Math.sin(time*1.6 + ph0); ctx.scale(bs, bs); ctx.globalAlpha = .9; ctx.drawImage(sp, -T/2, -T/2, T, T); ctx.restore();
  ctx.fillStyle = 'rgba(10,6,2,' + (.35 + .12*Math.sin(time*1.6 + ph0)) + ')'; ctx.beginPath(); ctx.ellipse(cx, cy, T*(.1 + .02*Math.sin(time*1.6 + ph0)), T*.09, 0, 0, Math.PI*2); ctx.fill();
  // rings contract toward the centre
  for (let i=0;i<3;i++){ const p = 1 - ((time*.32 + i/3 + ph0) % 1); ctx.strokeStyle = 'rgba(236,208,150,' + (.4*Math.sin(p*Math.PI)) + ')'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(cx, cy, T*(.06 + p*.42), T*(.05 + p*.38), 0, 0, Math.PI*2); ctx.stroke(); }
  // grains of sand sliding in along the spiral
  for (let i=0;i<14;i++){ const p = 1 - ((time*.28 + i*.0714 + hh(x, y, 370 + i)*.3) % 1), ang = i*.9 + p*5 + time*.4, rad = T*(.06 + p*.4); ctx.fillStyle = 'rgba(' + (i%2 ? '240,214,160' : '60,42,22') + ',' + (.55*Math.sin(p*Math.PI)) + ')'; ctx.fillRect(cx + Math.cos(ang)*rad - 1, cy + Math.sin(ang)*rad*.94 - 1, 2, 2); }
  // gas bubbles rise in the thick mud and pop
  for (let i=0;i<3;i++){ const p = (time*.4 + i*.33 + ph0) % 1, bx = cx + (hh(x, y, 380 + i) - .5)*T*.5, by = cy + (hh(x, y, 383 + i) - .5)*T*.4 - p*T*.08, rr = T*(.025 + .03*p);
    if (p < .8){ ctx.strokeStyle = 'rgba(255,236,190,' + (.7*(1 - p)) + ')'; ctx.fillStyle = 'rgba(90,64,34,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, rr, 0, Math.PI*2); ctx.fill(); ctx.stroke(); }
    else { const q = (p - .8)*5; ctx.strokeStyle = 'rgba(255,236,190,' + (.6*(1 - q)) + ')'; ctx.beginPath(); ctx.arc(bx, by, rr*(1 + q*1.4), 0, Math.PI*2); ctx.stroke(); } }
  ctx.restore();
  glow(cx, cy, T*.9, 'rgba(120,80,30,.1)');
}
function drawWhirlTile(x, y, time){
  const T = tile, px = x*T, py = y*T, cx = px + T/2, cy = py + T/2, s = dynSprite('wh', T*1.5, paintWhirl), S2 = T*1.5;
  glow(cx, cy, T*1.7, 'rgba(60,150,200,.2)');
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(reduce ? 0 : -time*1.8); ctx.drawImage(s, -S2/2, -S2/2, S2, S2); ctx.restore();
  if (reduce) return;
  ctx.save(); ctx.globalAlpha = .55; ctx.translate(cx, cy); ctx.rotate(time*1.2); ctx.scale(.7, .7); ctx.drawImage(s, -S2/2, -S2/2, S2, S2); ctx.restore();
  // the dark throat, foam and the things it is swallowing
  ctx.fillStyle = 'rgba(0,6,12,.7)'; ctx.beginPath(); ctx.arc(cx, cy, T*(.1 + .015*Math.sin(time*5)), 0, Math.PI*2); ctx.fill();
  for (let i=0;i<12;i++){ const p = 1 - ((time*.3 + i/12) % 1), ang = i*1.3 - time*(1.5 + (1 - p)*2.5), rad = T*(.09 + p*.6); ctx.fillStyle = 'rgba(235,250,255,' + (.6*Math.sin(p*Math.PI)) + ')'; ctx.beginPath(); ctx.arc(cx + Math.cos(ang)*rad, cy + Math.sin(ang)*rad, 1 + p*1.6, 0, Math.PI*2); ctx.fill(); }
  { const p = 1 - ((time*.18 + hh(x, y, 390)) % 1), ang = -time*2 + p*5, rad = T*(.1 + p*.55); ctx.save(); ctx.translate(cx + Math.cos(ang)*rad, cy + Math.sin(ang)*rad); ctx.rotate(ang*2); ctx.globalAlpha = Math.sin(p*Math.PI); ctx.fillStyle = '#6a523a'; ctx.fillRect(-T*.07, -T*.015, T*.14, T*.03); ctx.restore(); }
  ctx.strokeStyle = 'rgba(220,245,255,.35)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(cx, cy, T*(.47 + .02*Math.sin(time*3)), 0, Math.PI*2); ctx.stroke();
}
// the wind: streaks across the board and a chevron on every unit it is about to push
function windSheltered(x, y, dx, dy){ return isWall(x - dx, y - dy); }
function drawWind(time){
  const w = S.wind, T = tile, size = T*W, ang = Math.atan2(w.dy, w.dx);
  ctx.save(); ctx.strokeStyle = 'rgba(235,215,170,.22)'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  for (let i=0;i<16;i++){ const u = (hh(i,0,350) * 1.4 + (reduce ? 0 : time*.9)) % 1.4 - .2, v = hh(i,1,350), L = T*(.7 + hh(i,2,350)), a = Math.max(0, Math.min(1, 1 - Math.abs(u - .5)*2.2));
    const sx = w.dx ? (w.dx > 0 ? u : 1 - u)*size : v*size, sy = w.dy ? (w.dy > 0 ? u : 1 - u)*size : v*size;
    ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - w.dx*L, sy - w.dy*L); ctx.stroke(); }
  ctx.restore();
  const units = [S.player, ...S.allies, ...S.enemies.filter(e => !e.boss)];
  for (const u of units){
    if (windSheltered(u.x, u.y, w.dx, w.dy)) continue;
    const nx = u.x + w.dx, ny = u.y + w.dy; if (!inb(nx, ny) || isWall(nx, ny) || isPit(nx, ny)) continue;
    const cx = (u.x + .5)*T, cy = (u.y + .5)*T, bob = reduce ? 0 : Math.sin(time*6)*T*.03;
    ctx.save(); ctx.translate(cx + w.dx*(T*.34 + bob), cy + w.dy*(T*.34 + bob)); ctx.rotate(ang); ctx.strokeStyle = 'rgba(245,225,170,.95)'; ctx.lineWidth = Math.max(2, T*.04); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const o of [-.06, .06]){ ctx.beginPath(); ctx.moveTo(o*T - T*.05, -T*.08); ctx.lineTo(o*T + T*.03, 0); ctx.lineTo(o*T - T*.05, T*.08); ctx.stroke(); } ctx.restore();
  }
}
// bring a revamped wall to life: sway for the trees, firelight for the forge, a halo for the angel
function drawRevampedWall(b, wv, x, y, px, py, T, time){
  const key = b + wv, paint = WALLPAINT[key]; if (!paint) return false;
  const sd = Math.floor(hh(x,y,45)*3), s = wallSpr(key + '#' + sd, T, (g, TT) => paint(g, TT, mkRng(wv*977 + b.length*131 + sd*7919)));
  const sway = (b==='swamp' || b==='sea') && !reduce ? Math.sin(time*1.1 + x*1.7 + y)*.018 : 0, flip = hh(x,y,44) < .5 ? -1 : 1;
  ctx.save(); ctx.translate(px + T*.5, py + T*.9); if (sway) ctx.transform(1, 0, sway, 1, 0, 0); { const zs = b==='swamp' ? 1.12 : 1; ctx.scale(flip*zs, zs); }
  ctx.drawImage(s.cv, -T*.5 - s.ox, -T*.9 - s.oy, s.w, s.h); ctx.restore();
  const fl = reduce ? .6 : .6 + .25*Math.sin(time*9 + x*3) + .15*Math.sin(time*14.3 + y);
  if (key==='forge1'){ glow(px + T*.51, py + T*.44, T*(.7 + .1*fl), `rgba(255,140,40,${.32*fl})`); if (!reduce && Math.random() < .03) fx.embers.push({x:x + .35 + Math.random()*.3, y:y + .42, vy:-(.6 + Math.random()*.6), life:.8, c:'255,170,60'}); }
  else if (key==='forge2'){ glow(px + T*.5, py + T*.76, T*(1 + .12*fl), `rgba(255,120,30,${.4*fl})`); if (!reduce && Math.random() < .05) fx.embers.push({x:x + .4 + Math.random()*.2, y:y + .1, vy:-(.5 + Math.random()*.6), life:1, c:'255,150,50'}); }
  else if (key==='cathedral1'){   // three cold flames that flicker on their own
    for (const [i, cx, cy] of [[0,.22,.26],[1,.5,.18],[2,.78,.26]]){
      const fx0 = px + T*cx, fy0 = py + T*cy, k = reduce ? 1 : .85 + .2*Math.sin(time*11 + i*2.3 + x*3) + .1*Math.sin(time*17.3 + i), h = T*.1*k, w = T*.03;
      glow(fx0, fy0 - h*.4, T*.55, 'rgba(150,205,255,' + (.28*k) + ')');
      const fg = ctx.createLinearGradient(0, fy0, 0, fy0 - h); fg.addColorStop(0, 'rgba(120,180,255,.95)'); fg.addColorStop(.6, 'rgba(200,230,255,.9)'); fg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(fx0 - w, fy0); ctx.quadraticCurveTo(fx0 - w*1.1, fy0 - h*.5, fx0 + (reduce ? 0 : Math.sin(time*9 + i)*w*.6), fy0 - h); ctx.quadraticCurveTo(fx0 + w*1.1, fy0 - h*.5, fx0 + w, fy0); ctx.closePath(); ctx.fill();
    }
  }
  return true;
}
function paintFungalWall(px, py, T, v, time, x, y, pl){
  if (v===0){
    // tall violet mushroom with glowing teal spots, and two babies
    drawShroom(px, py, T, {x:.28, y:.88, h:.18, r:.1, sw:.025, ph:x, st:['#8f84a2','#cfc4de','#7c7290'], cap3:['#a47ad8','#6a3f9e','#3a2266'], gill:'#25153a', spots:[[-.2,.5,.02]], spot:'rgba(200,255,240,.8)'}, time);
    drawShroom(px, py, T, {x:.5, y:.88, h:.6, r:.32, sw:.05, ph:x+1, st:['#8f84a2','#d6cce6','#766b8a'], cap3:['#b58af0','#6d3fb0','#3a2166'], gill:'#25153a', rim:'rgba(230,200,255,.5)', spots:[[-.5,.45,.03],[.1,.8,.035],[.55,.4,.028],[-.1,.3,.022],[.35,.7,.02]], spotGlow:'130,245,215', glow:'90,220,190', gr:.9}, time);
    drawShroom(px, py, T, {x:.76, y:.88, h:.14, r:.08, sw:.02, ph:x+2, st:['#8f84a2','#cfc4de','#7c7290'], cap3:['#9a70d0','#5f3898','#33205a'], gill:'#25153a'}, time);
    tufts(px, py, T, .5, .9, 'rgba(110,200,140,.55)', 6);
  } else if (v===1){
    // toadstool: red cap with white spots, a skirt ring and a small one beside it
    drawShroom(px, py, T, {x:.74, y:.88, h:.14, r:.1, sw:.025, ph:x, st:['#bfb39c','#ece3d0','#a89c85'], cap3:['#e8584a','#b3302a','#6e1a16'], gill:'#3a1a16', spots:[[-.3,.6,.022],[.3,.4,.02]]}, time);
    drawShroom(px, py, T, {x:.46, y:.88, h:.34, r:.38, cap:.95, sw:.09, ph:x+3, st:['#b9ae98','#f0e8d6','#a39882'], ring:'rgba(240,232,214,.95)', cap3:['#ee6050','#bf332b','#6a1814'], gill:'#3a1c18', gillLine:'rgba(255,230,210,.2)', rim:'rgba(255,200,180,.5)', spots:[[-.6,.35,.05],[-.1,.8,.055],[.45,.5,.05],[.7,.25,.035],[-.3,.45,.03],[.15,.4,.03]]}, time);
    tufts(px, py, T, .5, .9, 'rgba(120,170,90,.55)', 5);
  } else if (v===2){
    // cluster of bioluminescent teal mushrooms
    drawShroom(px, py, T, {x:.24, y:.88, h:.26, r:.16, sw:.03, ph:x, st:['#8aa6a8','#cde6e6','#6f8a8c'], cap3:['#a8f6e8','#2fb0a2','#14605a'], gill:'#0f3a38', spotGlow:'210,255,255', spots:[[-.2,.6,.02]], glow:'80,230,200', gr:.5}, time);
    drawShroom(px, py, T, {x:.5, y:.88, h:.5, r:.24, sw:.04, ph:x+1, st:['#8aa6a8','#d6eeee','#6f8a8c'], cap3:['#b8fff0','#35c0b0','#156a64'], gill:'#0f3a38', rim:'rgba(220,255,250,.6)', spots:[[-.4,.5,.028],[.3,.7,.03],[.1,.3,.022]], spotGlow:'220,255,255', glow:'80,230,200', gr:.9}, time);
    drawShroom(px, py, T, {x:.78, y:.88, h:.2, r:.13, sw:.025, ph:x+2, st:['#8aa6a8','#cde6e6','#6f8a8c'], cap3:['#a0f0e0','#2aa496','#125650'], gill:'#0f3a38', glow:'80,230,200', gr:.45}, time);
    tufts(px, py, T, .5, .9, 'rgba(90,200,170,.5)', 6);
  } else {
    // dead log with orange shelf fungi and a glowing top
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.88,T*.3,T*.06,0,0,Math.PI*2); ctx.fill();
    const lg=ctx.createLinearGradient(px+T*.38,0,px+T*.62,0); lg.addColorStop(0,'#2a1f17'); lg.addColorStop(.45,'#4d3a2a'); lg.addColorStop(1,'#1e1610');
    ctx.fillStyle=lg; ctx.beginPath(); ctx.moveTo(px+T*.36,py+T*.88); ctx.lineTo(px+T*.4,py+T*.2); ctx.lineTo(px+T*.5,py+T*.14); ctx.lineTo(px+T*.6,py+T*.22); ctx.lineTo(px+T*.64,py+T*.88); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1; ctx.beginPath(); for (const lx of [.44,.5,.57]){ ctx.moveTo(px+T*lx,py+T*.2); ctx.lineTo(px+T*(lx+.01),py+T*.86); } ctx.stroke();
    for (const [sx,sy,sd,rr] of [[.4,.3,-1,.3],[.6,.46,1,.34],[.4,.62,-1,.28],[.6,.76,1,.2]]){
      const g=ctx.createLinearGradient(0,py+T*(sy-.1),0,py+T*(sy+.06)); g.addColorStop(0,'#ffc070'); g.addColorStop(.6,'#e0802c'); g.addColorStop(1,'#8c3c14');
      ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(px+T*sx,py+T*sy,T*rr,T*.1,0,sd>0?-Math.PI/2:Math.PI/2,sd>0?Math.PI/2:Math.PI*1.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(255,235,180,.75)'; ctx.lineWidth=Math.max(1,T*.02); ctx.stroke();
      ctx.strokeStyle='rgba(120,50,10,.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(px+T*sx,py+T*(sy+.02),T*rr*.7,T*.07,0,sd>0?-Math.PI/2:Math.PI/2,sd>0?Math.PI/2:Math.PI*1.5); ctx.stroke();
    }
    drawShroom(px, py, T, {x:.5, y:.2, h:.1, r:.1, sw:.02, ph:x, st:['#b9a98c','#e6d8bc','#a09078'], cap3:['#ffd07a','#e49a3c','#8a4a18'], gill:'#3a2410'}, time);
    glow(px+T*.5, py+T*.5, T*.7, `rgba(240,150,60,${.08+.06*pl})`);
    tufts(px, py, T, .5, .9, 'rgba(110,160,80,.5)', 5);
  }
}
function drawWall(x, y, env, time){
  const T = tile, b = S.biome, r = i => hh(x,y,40+i);
  const px = x*T + (env && !reduce ? (Math.random()-.5)*T*.05 : 0), py = y*T;
  _aoSpr = _aoSpr || softSprite(.42, .2);
  ctx.drawImage(_aoSpr, px+T*.5 - T*.9, py+T*.74 - T*.9, T*1.8, T*1.8);
  { let wv = Math.floor(hh(x,y,43)*((b==='ash' || b==='sea') ? 6 : 3)); if ((b==='sea' || b==='ash') && wv===2) wv = 5;   // the campaign biomes have three kinds of wall each (the swamp always); an unstable forge pillar keeps its old look
    if (!env && (b==='swamp' || b==='ash' || b==='sea' || ((b==='crypt' || b==='forge' || b==='cathedral') && wv > 0)) && drawRevampedWall(b, wv, x, y, px, py, T, time)) return; }
  ctx.fillStyle='rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(px+T*.52, py+T*.86, T*.4, T*.11, 0, 0, Math.PI*2); ctx.fill();
  ctx.lineCap='round'; ctx.lineJoin='round';
  if (b==='swamp'){
    // dead tree with hanging moss
    ctx.strokeStyle='#2a1f16'; ctx.lineWidth=T*.05;
    ctx.beginPath(); ctx.moveTo(px+T*.5,py+T*.78); ctx.quadraticCurveTo(px+T*.3,py+T*.8,px+T*.18,py+T*.9);
    ctx.moveTo(px+T*.55,py+T*.78); ctx.quadraticCurveTo(px+T*.75,py+T*.8,px+T*.86,py+T*.9); ctx.stroke();
    const g=ctx.createLinearGradient(px+T*.35,0,px+T*.68,0); g.addColorStop(0,'#1a130d'); g.addColorStop(.45,'#4d3c2b'); g.addColorStop(1,'#140f0a');
    ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(px+T*.36,py+T*.86); ctx.lineTo(px+T*.42,py+T*.3); ctx.lineTo(px+T*.47,py+T*.1); ctx.lineTo(px+T*.53,py+T*.2); ctx.lineTo(px+T*.6,py+T*.12); ctx.lineTo(px+T*.6,py+T*.32); ctx.lineTo(px+T*.67,py+T*.86); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#3b2d20'; ctx.lineWidth=T*.045;
    ctx.beginPath(); ctx.moveTo(px+T*.44,py+T*.36); ctx.lineTo(px+T*.2,py+T*.16); ctx.lineTo(px+T*.12,py+T*.2);
    ctx.moveTo(px+T*.6,py+T*.42); ctx.lineTo(px+T*.84,py+T*.22); ctx.moveTo(px+T*.74,py+T*.32); ctx.lineTo(px+T*.8,py+T*.42); ctx.stroke();
    ctx.strokeStyle='rgba(118,156,82,.8)'; ctx.lineWidth=1.4;
    for (const [mx,my,l] of [[.24,.18,.22],[.3,.22,.15],[.8,.24,.2],[.72,.32,.14]]){
      const sw = reduce ? 0 : Math.sin(time*1.3+x+my*9)*T*.03;
      ctx.beginPath(); ctx.moveTo(px+T*mx,py+T*my); ctx.quadraticCurveTo(px+T*mx+sw,py+T*(my+l*.6),px+T*mx+sw*1.5,py+T*(my+l)); ctx.stroke();
    }
    ctx.fillStyle='rgba(100,140,64,.55)'; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.84,T*.2,T*.06,0,0,Math.PI*2); ctx.fill();
  } else if (b==='forge'){
    // basalt obelisk with glowing cracks; the unstable one burns bright and shakes
    const g=ctx.createLinearGradient(px+T*.26,0,px+T*.74,0); g.addColorStop(0,'#150d0a'); g.addColorStop(.42,'#433028'); g.addColorStop(1,'#100907');
    ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(px+T*.26,py+T*.86); ctx.lineTo(px+T*.33,py+T*.18); ctx.lineTo(px+T*.5,py+T*.05); ctx.lineTo(px+T*.67,py+T*.18); ctx.lineTo(px+T*.74,py+T*.86); ctx.closePath(); ctx.fill();
    const a = env ? (reduce ? 1 : .7+.3*Math.sin(time*16)) : (reduce ? .45 : .35+.15*Math.sin(time*2+x*1.7+y));
    ctx.save(); ctx.shadowColor='rgba(255,120,30,1)'; ctx.shadowBlur=T*(env?.3:.15);
    ctx.strokeStyle = env ? `rgba(255,220,120,${a})` : `rgba(255,110,40,${a})`; ctx.lineWidth=Math.max(1.4,T*(env?.04:.028));
    ctx.beginPath(); ctx.moveTo(px+T*.5,py+T*.12); ctx.lineTo(px+T*.45,py+T*.34); ctx.lineTo(px+T*.54,py+T*.5); ctx.lineTo(px+T*.47,py+T*.78);
    ctx.moveTo(px+T*.54,py+T*.5); ctx.lineTo(px+T*.64,py+T*.62);
    if (env){ ctx.moveTo(px+T*.45,py+T*.34); ctx.lineTo(px+T*.36,py+T*.44); ctx.moveTo(px+T*.4,py+T*.66); ctx.lineTo(px+T*.6,py+T*.72); }
    ctx.stroke(); ctx.restore();
    if (env) glow(px+T*.5, py+T*.45, T*(reduce?1:.9+.15*Math.sin(time*16)), 'rgba(255,130,40,.5)');
    else glow(px+T*.5, py+T*.15, T*.35, `rgba(255,110,30,${a*.35})`);
  } else if (b==='storm'){
    const v = Math.floor(r(3)*3);
    if (v===0){
      // slate spire with a lightning rod; the rod's tip crackles
      const g=ctx.createLinearGradient(px+T*.22,0,px+T*.78,0); g.addColorStop(0,'#1a1f2b'); g.addColorStop(.45,'#566178'); g.addColorStop(1,'#141824');
      ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(px+T*.22,py+T*.86); ctx.lineTo(px+T*.3,py+T*.4); ctx.lineTo(px+T*.42,py+T*.32); ctx.lineTo(px+T*.5,py+T*.22); ctx.lineTo(px+T*.62,py+T*.34); ctx.lineTo(px+T*.7,py+T*.42); ctx.lineTo(px+T*.78,py+T*.86); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#7b88a6'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px+T*.42,py+T*.34); ctx.lineTo(px+T*.38,py+T*.6); ctx.lineTo(px+T*.44,py+T*.8); ctx.stroke();
      ctx.strokeStyle='#9aa7c4'; ctx.lineWidth=Math.max(1.5,T*.03); ctx.beginPath(); ctx.moveTo(px+T*.5,py+T*.24); ctx.lineTo(px+T*.5,py+T*.02); ctx.stroke();
      glow(px+T*.5, py+T*.04, T*.5, `rgba(150,190,255,${.18+.3*(reduce ? .3 : Math.max(0, Math.sin(time*6+x*2+y)))})`);
    } else if (v===1){
      // tree split by lightning: two charred halves with a blue glow in the crack
      const pu = reduce ? .7 : .6+.4*Math.sin(time*4+x+y*2);
      const g=ctx.createLinearGradient(px+T*.3,0,px+T*.72,0); g.addColorStop(0,'#0c0a09'); g.addColorStop(.5,'#3a342f'); g.addColorStop(1,'#0a0908');
      ctx.fillStyle=`rgba(110,170,255,${.55*pu})`; ctx.fillRect(px+T*.45,py+T*.18,T*.1,T*.68);
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.moveTo(px+T*.28,py+T*.86); ctx.lineTo(px+T*.33,py+T*.34); ctx.lineTo(px+T*.27,py+T*.14); ctx.lineTo(px+T*.4,py+T*.28); ctx.lineTo(px+T*.45,py+T*.18); ctx.lineTo(px+T*.46,py+T*.86); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px+T*.54,py+T*.86); ctx.lineTo(px+T*.54,py+T*.3); ctx.lineTo(px+T*.62,py+T*.08); ctx.lineTo(px+T*.67,py+T*.34); ctx.lineTo(px+T*.74,py+T*.86); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#26201b'; ctx.lineWidth=T*.04; ctx.beginPath(); ctx.moveTo(px+T*.33,py+T*.4); ctx.lineTo(px+T*.14,py+T*.28); ctx.moveTo(px+T*.67,py+T*.44); ctx.lineTo(px+T*.86,py+T*.34); ctx.stroke();
      glow(px+T*.5, py+T*.5, T*.55, `rgba(100,160,255,${.14*pu})`);
    } else {
      // ancient monolith with glowing blue runes
      const pu = reduce ? .7 : .55+.45*Math.sin(time*2.5+x*1.3+y);
      const g=ctx.createLinearGradient(px+T*.26,0,px+T*.74,0); g.addColorStop(0,'#1b2030'); g.addColorStop(.5,'#4a556b'); g.addColorStop(1,'#151a28');
      ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(px+T*.26,py+T*.86); ctx.lineTo(px+T*.28,py+T*.2); ctx.lineTo(px+T*.5,py+T*.1); ctx.lineTo(px+T*.72,py+T*.2); ctx.lineTo(px+T*.74,py+T*.86); ctx.closePath(); ctx.fill();
      ctx.strokeStyle=`rgba(120,190,255,${.35+.6*pu})`; ctx.lineWidth=Math.max(1.4,T*.03); ctx.beginPath();
      ctx.moveTo(px+T*.4,py+T*.3); ctx.lineTo(px+T*.6,py+T*.3); ctx.lineTo(px+T*.5,py+T*.44); ctx.closePath();
      ctx.moveTo(px+T*.5,py+T*.5); ctx.lineTo(px+T*.5,py+T*.74); ctx.moveTo(px+T*.4,py+T*.62); ctx.lineTo(px+T*.6,py+T*.62); ctx.stroke();
      glow(px+T*.5, py+T*.5, T*.6, `rgba(90,160,255,${.1+.12*pu})`);
    }
  } else if (b==='tar'){
    const v = Math.floor(r(3)*3);
    ctx.fillStyle='rgba(8,6,4,.9)'; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.86,T*.3,T*.07,0,0,Math.PI*2); ctx.fill();
    if (v===0){
      // wooden barrel leaking tar
      const g=ctx.createLinearGradient(px+T*.28,0,px+T*.72,0); g.addColorStop(0,'#2a1c12'); g.addColorStop(.45,'#5c4128'); g.addColorStop(1,'#22160e');
      ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(px+T*.3,py+T*.84); ctx.quadraticCurveTo(px+T*.24,py+T*.62,px+T*.3,py+T*.4); ctx.lineTo(px+T*.7,py+T*.4); ctx.quadraticCurveTo(px+T*.76,py+T*.62,px+T*.7,py+T*.84); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#2b2b30'; ctx.fillRect(px+T*.26,py+T*.48,T*.48,T*.05); ctx.fillRect(px+T*.26,py+T*.72,T*.48,T*.05);
      ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=1; ctx.beginPath(); for (const sx of [.42,.5,.58]){ ctx.moveTo(px+T*sx,py+T*.42); ctx.lineTo(px+T*sx,py+T*.82); } ctx.stroke();
      ctx.fillStyle='#0a0806'; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.4,T*.2,T*.055,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#070504'; ctx.beginPath(); ctx.moveTo(px+T*.36,py+T*.42); ctx.quadraticCurveTo(px+T*.33,py+T*.6,px+T*.37,py+T*.8); ctx.lineTo(px+T*.41,py+T*.8); ctx.quadraticCurveTo(px+T*.4,py+T*.6,px+T*.42,py+T*.42); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(220,170,80,.4)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(px+T*.34,py+T*.38); ctx.lineTo(px+T*.5,py+T*.37); ctx.stroke();
    } else if (v===1){
      // a small ribcage half-sunk in the tar: curved spine, tapering ribs and a skull
      const bone = '#d6cdb0', shade = '#8f8769', P0 = [.28,.8], P1 = [.34,.42], P2 = [.62,.4];
      const at = t => [(1-t)*(1-t)*P0[0] + 2*(1-t)*t*P1[0] + t*t*P2[0], (1-t)*(1-t)*P0[1] + 2*(1-t)*t*P1[1] + t*t*P2[1]];
      ctx.lineCap='round';
      for (let i=0;i<4;i++){
        const [sx,sy] = at(.2+i*.2), ex = sx + .1 + .018*i, ey = sy + .22 - .02*i;
        ctx.strokeStyle=shade; ctx.lineWidth=Math.max(2,T*.04); ctx.beginPath(); ctx.moveTo(px+T*sx,py+T*sy); ctx.quadraticCurveTo(px+T*(sx+.13),py+T*(sy-.03),px+T*ex,py+T*ey); ctx.stroke();
        ctx.strokeStyle=bone; ctx.lineWidth=Math.max(1.4,T*.025); ctx.stroke();
      }
      ctx.strokeStyle=shade; ctx.lineWidth=Math.max(2.5,T*.05); ctx.beginPath(); ctx.moveTo(px+T*P0[0],py+T*P0[1]); ctx.quadraticCurveTo(px+T*P1[0],py+T*P1[1],px+T*P2[0],py+T*P2[1]); ctx.stroke();
      ctx.strokeStyle=bone; ctx.lineWidth=Math.max(1.8,T*.034); ctx.stroke();
      ctx.fillStyle=bone; ctx.beginPath(); ctx.ellipse(px+T*.7,py+T*.4,T*.075,T*.06,.2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#16110c'; ctx.beginPath(); ctx.arc(px+T*.72,py+T*.39,T*.02,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=bone; ctx.beginPath(); ctx.moveTo(px+T*.74,py+T*.42); ctx.lineTo(px+T*.83,py+T*.46); ctx.lineTo(px+T*.74,py+T*.47); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(8,6,4,.94)'; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.82,T*.3,T*.07,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#070504'; for (const dx of [.42,.58]){ ctx.beginPath(); ctx.moveTo(px+T*dx,py+T*.66); ctx.lineTo(px+T*(dx+.022),py+T*.66); ctx.lineTo(px+T*(dx+.011),py+T*.78); ctx.closePath(); ctx.fill(); }
    } else {
      // charred stump with a glossy crust of tar
      const g=ctx.createLinearGradient(px+T*.22,0,px+T*.78,0); g.addColorStop(0,'#150f0a'); g.addColorStop(.45,'#47372a'); g.addColorStop(1,'#0c0806');
      ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(px+T*.2,py+T*.86); ctx.lineTo(px+T*.26,py+T*.44); ctx.lineTo(px+T*.34,py+T*.36); ctx.lineTo(px+T*.48,py+T*.42); ctx.lineTo(px+T*.62,py+T*.32); ctx.lineTo(px+T*.74,py+T*.42); ctx.lineTo(px+T*.8,py+T*.86); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(8,6,4,.9)'; ctx.lineWidth=Math.max(2,T*.045); ctx.lineCap='round';
      for (const dx of [.34,.5,.66]){ ctx.beginPath(); ctx.moveTo(px+T*dx,py+T*.4); ctx.lineTo(px+T*(dx+.01),py+T*(.6+.12*Math.abs(dx-.5)*3)); ctx.stroke(); }
      ctx.strokeStyle='rgba(220,170,80,.35)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(px+T*.3,py+T*.5); ctx.lineTo(px+T*.28,py+T*.76); ctx.stroke();
      ctx.strokeStyle='rgba(0,0,0,.45)'; ctx.beginPath(); ctx.arc(px+T*.5,py+T*.62,T*.1,0,Math.PI*1.6); ctx.stroke();
    }
  } else if (b==='fungal'){
    const v = Math.floor(r(3)*4), pl = reduce ? .85 : .7+.25*Math.sin(time*2+x*1.3+y);
    const spr = wallSpr('fungal' + v, T, (g, TT) => { const keep = ctx; ctx = g; try { paintFungalWall(0, 0, TT, v, 0, 0, 0, .85); } finally { ctx = keep; } });
    ctx.drawImage(spr.cv, px - spr.ox, py - spr.oy, spr.w, spr.h);
    glow(px + T*.5, py + T*.34, T*.8, v===3 ? `rgba(240,150,60,${.07 + .05*pl})` : `rgba(90,225,195,${.08 + .08*pl})`);
  } else if (b==='cathedral'){
    // marble column with frost and icicles
    const g=ctx.createLinearGradient(px+T*.24,0,px+T*.76,0); g.addColorStop(0,'#5d6878'); g.addColorStop(.45,'#e3eaf2'); g.addColorStop(1,'#4e5867');
    ctx.fillStyle=g; ctx.fillRect(px+T*.26,py+T*.18,T*.48,T*.64);
    ctx.strokeStyle='rgba(50,62,82,.35)'; ctx.lineWidth=1;
    ctx.beginPath(); for (const fl of [.36,.46,.56,.66]){ ctx.moveTo(px+T*fl,py+T*.2); ctx.lineTo(px+T*fl,py+T*.8); } ctx.stroke();
    ctx.fillStyle='#c8d2de'; ctx.fillRect(px+T*.16,py+T*.08,T*.68,T*.11);
    ctx.fillStyle='#8592a4'; ctx.fillRect(px+T*.16,py+T*.8,T*.68,T*.1);
    ctx.fillStyle='rgba(240,248,255,.95)'; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.08,T*.34,T*.05,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(215,236,252,.9)';
    for (const [ix,il] of [[.24,.12],[.38,.18],[.55,.1],[.7,.15]]){ ctx.beginPath(); ctx.moveTo(px+T*(ix-.03),py+T*.19); ctx.lineTo(px+T*(ix+.03),py+T*.19); ctx.lineTo(px+T*ix,py+T*(.19+il)); ctx.closePath(); ctx.fill(); }
  } else {
    // crypt: stone pillar, cobwebs, candles
    const g=ctx.createLinearGradient(px+T*.2,0,px+T*.8,0); g.addColorStop(0,'#28221d'); g.addColorStop(.45,'#6c5f52'); g.addColorStop(1,'#1c1714');
    ctx.fillStyle=g; ctx.fillRect(px+T*.22,py+T*.18,T*.56,T*.64);
    ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.lineWidth=1;
    ctx.beginPath(); for (const sy of [.38,.6]){ ctx.moveTo(px+T*.22,py+T*sy); ctx.lineTo(px+T*.78,py+T*sy); } ctx.moveTo(px+T*.5,py+T*.38); ctx.lineTo(px+T*.5,py+T*.6); ctx.stroke();
    ctx.fillStyle='#7a6b5a'; ctx.fillRect(px+T*.13,py+T*.09,T*.74,T*.11);
    ctx.fillStyle='#4c4036'; ctx.fillRect(px+T*.13,py+T*.8,T*.74,T*.1);
    if (r(2)<.4){
      const ox=px+T*.22, oy=py+T*.2;
      ctx.strokeStyle='rgba(225,218,200,.3)'; ctx.lineWidth=.8; ctx.beginPath();
      for (const [ex,ey] of [[.2,0],[.17,.1],[.1,.17],[0,.2]]){ ctx.moveTo(ox,oy); ctx.lineTo(ox+T*ex,oy+T*ey); }
      for (const f of [.45,.8]){ ctx.moveTo(ox+T*.2*f,oy); ctx.lineTo(ox+T*.17*f,oy+T*.1*f); ctx.lineTo(ox+T*.1*f,oy+T*.17*f); ctx.lineTo(ox,oy+T*.2*f); }
      ctx.stroke();
    }
    if (r(1)<.45){
      const cx = px+T*(.35+r(3)*.3), cy = py+T*.09, fl = reduce ? 0 : Math.sin(time*11+x*3)*.15+Math.sin(time*17+y)*.1;
      ctx.fillStyle='#d9cdb2'; ctx.fillRect(cx-T*.03, cy-T*.1, T*.06, T*.1);
      ctx.fillStyle='#ffcf6a'; ctx.beginPath(); ctx.ellipse(cx, cy-T*(.15+fl*.03), T*.025, T*(.05+fl*.01), 0, 0, Math.PI*2); ctx.fill();
      glow(cx, cy-T*.15, T*(.7+fl*.15), 'rgba(255,170,80,.28)');
    }
  }
}
function crackPathCtx(px, py, r){
  const T = tile, cl = (v,o) => Math.min(o+T-2, Math.max(o+2, v));
  let cx = px+T*(.2+r(0)*.6), cy = py+T*(.2+r(1)*.6);
  ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx,cy);
  for (let k=0;k<3;k++){ cx = cl(cx+(r(2+k)-.5)*T*.45, px); cy = cl(cy+(r(6+k)-.5)*T*.45, py); ctx.lineTo(cx,cy); }
  ctx.lineTo(cl(cx+(r(10)-.5)*T*.3,px), cl(cy+(r(11)-.5)*T*.3,py));
}
// where a thunderbolt hit: a charred blot with faint blue cracks
function drawScorch(x, y){
  const T = tile, px = x*T, py = y*T;
  const g = ctx.createRadialGradient(px+T/2, py+T/2, 0, px+T/2, py+T/2, T*.5); g.addColorStop(0, 'rgba(8,10,18,.6)'); g.addColorStop(1, 'rgba(8,10,18,0)');
  ctx.fillStyle = g; ctx.fillRect(px, py, T, T);
  ctx.strokeStyle = 'rgba(120,175,255,.28)'; ctx.lineWidth = 1; crackPathCtx(px, py, i => hh(x,y,160+i)); ctx.stroke();
}
/* ---------- terrain of the campaign biomes: water, lava, ice, pits and graves ----------
   The still part of each square is drawn once into a small cached picture (it depends on the square and on which neighbors are the same terrain);
   only what moves (ripples, glints, bubbles, the glow) is drawn every frame. */
const _terrCache = new Map(); let _terrFloor = '';
function terrSpr(key, T, paint){
  const fk = S.fseed + '|' + W + '|' + Math.round(T*dpr);
  if (fk !== _terrFloor){ _terrFloor = fk; _terrCache.clear(); }
  let s = _terrCache.get(key); if (s) return s;
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = Math.max(1, Math.ceil(T*dpr));
  const g = cvs.getContext('2d'); g.scale(dpr, dpr); g.lineCap = 'round'; g.lineJoin = 'round';
  g.save(); g.beginPath(); g.rect(0, 0, T, T); g.clip(); paint(g, T); g.restore();
  _terrCache.set(key, cvs); return cvs;
}
// which neighbors (up 1, down 2, left 4, right 8) are the same terrain; the edge of the board counts as the same
const sameMask = (x, y, f) => (!inb(x,y-1) || f(x,y-1) ? 1 : 0) | (!inb(x,y+1) || f(x,y+1) ? 2 : 0) | (!inb(x-1,y) || f(x-1,y) ? 4 : 0) | (!inb(x+1,y) || f(x+1,y) ? 8 : 0);
// run a painter once for every side that has no neighbor, with that side turned to the top
function eachOpenSide(g, T, m, fn){
  for (const [k, bit] of [[0,1],[1,8],[2,2],[3,4]]){
    if (m & bit) continue;
    g.save(); g.translate(T/2, T/2); g.rotate(k*Math.PI/2); g.translate(-T/2, -T/2); fn(k); g.restore();
  }
}
const _streak = (() => { let c = null; return () => { if (c) return c; c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(10, 64); g.lineTo(30, 0); g.lineTo(54, 0); g.lineTo(34, 64); g.closePath(); g.fill(); return c; }; })();

function paintWater(g, T, x, y, m){
  const r = i => hh(x, y, 200+i);
  const gr = g.createLinearGradient(0, 0, 0, T); gr.addColorStop(0, '#2b554a'); gr.addColorStop(1, '#14302a'); g.fillStyle = gr; g.fillRect(0, 0, T, T);
  if (m === 15){ const d = g.createRadialGradient(T/2, T/2, T*.1, T/2, T/2, T*.8); d.addColorStop(0, 'rgba(4,16,14,.5)'); d.addColorStop(1, 'rgba(4,16,14,0)'); g.fillStyle = d; g.fillRect(0, 0, T, T); }
  g.strokeStyle = 'rgba(170,220,205,.07)'; g.lineWidth = 1; for (let i=0;i<3;i++){ const yy = T*(.2 + i*.28 + r(i)*.1); g.beginPath(); g.moveTo(T*.1, yy); g.lineTo(T*(.4 + r(3+i)*.4), yy); g.stroke(); }
  // shallows and a bank on every side that has no more water: each side gets its own style (soft scallops, reeds, rocks or roots), width and color
  eachOpenSide(g, T, m, k => {
    const st = Math.floor(r(100 + k)*4), bare = r(300 + k) < .45;
    if (bare){   // no mud on this side: just a clear, soft shoreline
      const sh0 = g.createLinearGradient(0, 0, 0, T*.22); sh0.addColorStop(0, 'rgba(150,205,185,.34)'); sh0.addColorStop(1, 'rgba(150,205,185,0)'); g.fillStyle = sh0; g.fillRect(0, 0, T, T*.22);
      g.strokeStyle = 'rgba(205,235,220,.28)'; g.lineWidth = 1; g.beginPath(); for (let i=0;i<=12;i++){ const yy = T*.035 + Math.sin(i*1.1 + r(310 + k)*6)*T*.012; i ? g.lineTo(T*i/12, yy) : g.moveTo(0, yy); } g.stroke();
      return;
    }
    const base = T*(.025 + .035*r(104 + k)), amp = T*(.012 + .025*r(108 + k)), fq = .6 + 1.6*r(112 + k), ph = r(116 + k)*6.28, jit = T*.012*r(120 + k);
    const edge = i => base + amp*Math.sin(i*fq + ph) + jit*r(10 + i) + (st===3 ? T*.05*Math.sin(i*2.7 + ph*2) : 0);
    const bank = ['#2b2216', '#3b2f1d', '#26291c', '#33281a'][Math.floor(r(124 + k)*4)];
    const sh = g.createLinearGradient(0, 0, 0, T*(.26 + .14*r(128 + k))); sh.addColorStop(0, 'rgba(130,180,138,.7)'); sh.addColorStop(1, 'rgba(130,180,138,0)'); g.fillStyle = sh; g.fillRect(0, 0, T, T*.4);
    g.fillStyle = bank; g.beginPath(); g.moveTo(0, 0); g.lineTo(T, 0);
    if (st===0){ for (let i=10;i>=0;i--) g.lineTo(T*i/10, edge(i)); }          // soft, rounded scallops
    else { for (let i=20;i>=0;i--) g.lineTo(T*i/20, edge(i*.5) + (st===2 ? T*.02*r(60 + i) : 0)); }
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(200,225,200,.35)'; g.lineWidth = 1.1; g.beginPath(); for (let i=0;i<=20;i++){ const yy = edge(i*.5) + 1; i ? g.lineTo(T*i/20, yy) : g.moveTo(0, yy); } g.stroke();
    if (st===1){   // reeds with cattails leaning into the water
      for (let i=0;i<4;i++){ const bx = T*(.1 + .8*r(130 + i + k*4)), h = T*(.16 + .14*r(140 + i)), lean = (r(150 + i) - .5)*T*.12;
        g.strokeStyle = '#6f8c48'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(bx, base); g.quadraticCurveTo(bx + lean*.3, base + h*.5, bx + lean, base + h); g.stroke();
        g.fillStyle = '#4a3320'; g.beginPath(); g.ellipse(bx + lean, base + h, 1.8, T*.035, 0, 0, Math.PI*2); g.fill(); }
    } else if (st===2){   // wet stones on the bank
      for (let i=0;i<5;i++){ const bx = T*(.08 + .84*r(160 + i + k*5)), by = base + T*.01, sr = T*(.025 + .03*r(170 + i));
        const rg = g.createRadialGradient(bx - sr*.3, by - sr*.3, 1, bx, by, sr*1.3); rg.addColorStop(0, '#9a9a8c'); rg.addColorStop(1, '#4a4a42'); g.fillStyle = rg; g.beginPath(); g.ellipse(bx, by, sr*1.2, sr, 0, 0, Math.PI*2); g.fill(); g.fillStyle = 'rgba(210,235,225,.35)'; g.fillRect(bx - sr*.5, by + sr*.5, sr, 1); }
    } else if (st===3){   // roots creeping into the water, with moss
      g.strokeStyle = '#5a4430'; g.lineCap = 'round';
      for (let i=0;i<3;i++){ const bx = T*(.15 + .7*r(180 + i + k*3)), len = T*(.14 + .14*r(190 + i)); g.lineWidth = 2.6 - i*.5; g.beginPath(); g.moveTo(bx, base*.5); g.bezierCurveTo(bx + 4, base + len*.3, bx - 5, base + len*.7, bx + (r(200 + i) - .5)*T*.1, base + len); g.stroke(); }
      g.fillStyle = 'rgba(100,150,70,.7)'; for (let i=0;i<4;i++){ g.beginPath(); g.ellipse(T*(.1 + .8*r(210 + i)), base + T*.02, T*.04, T*.015, 0, 0, Math.PI*2); g.fill(); }
    }
    if (st !== 1){ g.fillStyle = 'rgba(96,132,70,.8)'; for (let i=0;i<3;i++){ const bx = T*(.1 + .8*r(22 + i + k*4)); g.beginPath(); g.moveTo(bx - 2, 0); g.lineTo(bx, T*(.1 + .05*r(40 + i)) + base*.4); g.lineTo(bx + 2, 0); g.closePath(); g.fill(); } }
  });
  if (r(1) < .55){ const cx = T*(.25 + r(2)*.5), cy = T*(.25 + r(3)*.5); g.fillStyle = 'rgba(122,172,66,.8)'; for (let i=0;i<11;i++){ g.beginPath(); g.arc(cx + (r(50+i)-.5)*T*.28, cy + (r(60+i)-.5)*T*.2, T*(.012 + r(70+i)*.012), 0, Math.PI*2); g.fill(); } }
  if (r(4) < .4){   // a lily pad, now and then with a flower
    const lx = T*(.28 + r(5)*.44), ly = T*(.3 + r(7)*.4), R = T*.13;
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(lx + 1.5, ly + 2, R, R*.7, 0, 0, Math.PI*2); g.fill();
    const a0 = r(8)*6, lg = g.createRadialGradient(lx - R*.3, ly - R*.3, 1, lx, ly, R); lg.addColorStop(0, '#6aa848'); lg.addColorStop(1, '#2f6a2c');
    g.fillStyle = lg; g.beginPath(); g.moveTo(lx, ly); g.arc(lx, ly, R, a0 + .3, a0 + Math.PI*2 - .3); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(20,60,20,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + Math.cos(a0 + 1.5)*R*.9, ly + Math.sin(a0 + 1.5)*R*.9); g.moveTo(lx, ly); g.lineTo(lx + Math.cos(a0 + 3)*R*.9, ly + Math.sin(a0 + 3)*R*.9); g.stroke();
    if (r(9) < .45){ g.fillStyle = '#f2b6c8'; for (let i=0;i<5;i++){ const a = i*1.256; g.beginPath(); g.ellipse(lx + Math.cos(a)*R*.28, ly + Math.sin(a)*R*.28, R*.2, R*.1, a, 0, Math.PI*2); g.fill(); } g.fillStyle = '#f6e27a'; g.beginPath(); g.arc(lx, ly, R*.12, 0, Math.PI*2); g.fill(); }
  }
}
function drawWaterTile(x, y, time){
  const T = tile, px = x*T, py = y*T, m = sameMask(x, y, isWater);
  ctx.drawImage(terrSpr('w|' + x + ',' + y + '|' + m, T, (g, TT) => paintWater(g, TT, x, y, m)), px, py, T, T);
  const tt = reduce ? 0 : time;
  ctx.save(); ctx.beginPath(); ctx.rect(px, py, T, T); ctx.clip();
  ctx.strokeStyle = 'rgba(170,225,210,.13)'; ctx.lineWidth = 1.3;
  for (let k=0;k<3;k++){ ctx.beginPath(); for (let i=0;i<=8;i++){ const xx = px + T*i/8, yy = py + T*(.25 + .26*k) + Math.sin(i*.9 + tt*.9 + k*2.1 + x*1.3)*T*.035; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
  const ph = ((reduce ? .3 : time*.45) + hh(x,y,70)) % 1;
  ctx.strokeStyle = `rgba(190,230,215,${.38*(1-ph)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px + T*(.3 + hh(x,y,71)*.4), py + T*(.3 + hh(x,y,72)*.4), T*(.06 + .28*ph), T*(.03 + .13*ph), 0, 0, Math.PI*2); ctx.stroke();
  if (!reduce){
    const tw = Math.pow(Math.max(0, Math.sin(time*2.4 + hh(x,y,75)*30)), 14);
    if (tw > .08){ ctx.fillStyle = `rgba(230,250,240,${tw})`; const sx = px + T*(.2 + hh(x,y,76)*.6), sy = py + T*(.2 + hh(x,y,77)*.6); ctx.fillRect(sx - 1, sy - 1, 2.4, 2.4); }
    const bp = (time*.35 + hh(x,y,78)) % 1; if (bp < .5){ ctx.strokeStyle = `rgba(210,240,230,${.6*(1 - bp*2)})`; ctx.beginPath(); ctx.arc(px + T*(.3 + hh(x,y,79)*.4), py + T*(.7 - bp*.5), T*(.025 + .02*bp), 0, Math.PI*2); ctx.stroke(); }
  }
  ctx.restore();
}

function paintLava(g, T, x, y, m){
  const r = i => hh(x, y, 230+i);
  const bg = g.createLinearGradient(0, 0, T, T); bg.addColorStop(0, '#ffb03a'); bg.addColorStop(.5, '#e5601a'); bg.addColorStop(1, '#a62808'); g.fillStyle = bg; g.fillRect(0, 0, T, T);
  for (let i=0;i<6;i++){   // plates of cooled crust floating on the glowing lava, with a bright seam around each
    const cx = T*(.16 + .68*r(i)), cy = T*(.16 + .68*r(6+i)), rad = T*(.17 + .13*r(12+i)), n = 8, pts = [];
    for (let k=0;k<n;k++){ const a = k/n*Math.PI*2 + r(18+i)*2, rr = rad*(.72 + .45*r(24+i*8+k)); pts.push([cx + Math.cos(a)*rr, cy + Math.sin(a)*rr*.85]); }
    g.beginPath(); pts.forEach(([px, py], k) => k ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath();
    const pg = g.createRadialGradient(cx - rad*.3, cy - rad*.3, 1, cx, cy, rad*1.2); pg.addColorStop(0, '#4a2214'); pg.addColorStop(1, '#1c0b06'); g.fillStyle = pg; g.fill();
    g.strokeStyle = 'rgba(255,170,60,.75)'; g.lineWidth = 1.4; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - rad*.4, cy); g.lineTo(cx + rad*.1, cy - rad*.2); g.lineTo(cx + rad*.4, cy + rad*.1); g.stroke();
  }
  // a rim of dark basalt where the pool ends
  eachOpenSide(g, T, m, k => {
    g.fillStyle = '#190b06'; g.beginPath(); g.moveTo(0, 0); g.lineTo(T, 0);
    for (let i=10;i>=0;i--) g.lineTo(T*i/10, T*(.1 + .06*Math.sin(i*2.3 + r(40+k)*6) + .04*r(44+i)));
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,130,40,.9)'; g.lineWidth = 1.5; g.beginPath(); for (let i=0;i<=10;i++){ const yy = T*(.1 + .06*Math.sin(i*2.3 + r(40+k)*6) + .04*r(44+i)); i ? g.lineTo(T*i/10, yy) : g.moveTo(0, yy); } g.stroke();
    g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(0, 0, T, 1.5);
  });
}
function drawLavaTile(x, y, time){
  const T = tile, px = x*T, py = y*T, m = sameMask(x, y, isLava), tt = reduce ? 0 : time;
  ctx.drawImage(terrSpr('l|' + x + ',' + y + '|' + m, T, (g, TT) => paintLava(g, TT, x, y, m)), px, py, T, T);
  ctx.save(); ctx.beginPath(); ctx.rect(px, py, T, T); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
  const gs = glowSprite('255,150,40');
  for (let k=0;k<3;k++){ const cx = px + T*(.2 + .6*hh(x,y,80+k)) + Math.sin(tt*.7 + k*2 + x)*T*.12, cy = py + T*(.2 + .6*hh(x,y,83+k)) + Math.cos(tt*.6 + k + y)*T*.12, R = T*(.4 + .1*Math.sin(tt*1.3 + k));
    ctx.globalAlpha = .55; ctx.drawImage(gs, cx - R, cy - R, R*2, R*2); }
  const bp = (tt*.5 + hh(x,y,86)) % 1;   // a bubble swells and pops
  if (bp < .6){ const bx = px + T*(.25 + hh(x,y,87)*.5), by = py + T*(.3 + hh(x,y,88)*.4), br = T*(.03 + .09*bp);
    ctx.globalAlpha = 1; ctx.strokeStyle = `rgba(255,230,150,${.9*(1 - bp/.6)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2); ctx.stroke();
    if (bp > .5){ ctx.fillStyle = 'rgba(255,240,180,.9)'; for (let i=0;i<4;i++){ const a = i*1.57 + .6; ctx.fillRect(bx + Math.cos(a)*br*1.4, by + Math.sin(a)*br*1.4, 1.6, 1.6); } } }
  ctx.restore();
  glow(px + T/2, py + T/2, T*1.05, `rgba(255,90,20,${reduce ? .14 : .12 + .04*Math.sin(time*2.5 + x + y)})`);
}

function paintIce(g, T, x, y, m){
  const r = i => hh(x, y, 260+i);
  const gr = g.createLinearGradient(0, 0, T, T); gr.addColorStop(0, 'rgba(180,232,252,.66)'); gr.addColorStop(1, 'rgba(84,156,212,.56)'); g.fillStyle = gr; g.fillRect(0, 0, T, T);
  const dp = g.createRadialGradient(T*.5, T*.55, 1, T*.5, T*.55, T*.6); dp.addColorStop(0, 'rgba(60,120,190,.28)'); dp.addColorStop(1, 'rgba(60,120,190,0)'); g.fillStyle = dp; g.fillRect(0, 0, T, T);
  g.fillStyle = 'rgba(240,252,255,.16)'; g.fillRect(T*.07, T*.07, T*.86, T*.86);
  g.strokeStyle = 'rgba(240,252,255,.85)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(T*.04, T*.96); g.lineTo(T*.04, T*.04); g.lineTo(T*.96, T*.04); g.stroke();
  g.strokeStyle = 'rgba(50,110,170,.6)'; g.beginPath(); g.moveTo(T*.96, T*.04); g.lineTo(T*.96, T*.96); g.lineTo(T*.04, T*.96); g.stroke();
  const ox = T*(.3 + .4*r(0)), oy = T*(.3 + .4*r(1)), nb = 4 + Math.floor(r(2)*3);   // frost cracks fanning out from a point inside
  for (let b=0;b<nb;b++){
    let cx = ox, cy = oy, a = b/nb*Math.PI*2 + r(3+b)*.8; g.beginPath(); g.moveTo(cx, cy);
    for (let s=0;s<4;s++){ a += (r(10+b*4+s) - .5)*.9; cx += Math.cos(a)*T*.16; cy += Math.sin(a)*T*.16; g.lineTo(cx, cy); }
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.2; g.stroke(); g.strokeStyle = 'rgba(80,140,200,.35)'; g.lineWidth = 2.4; g.stroke();
  }
  for (let i=0;i<5;i++){ const bx = T*(.15 + .7*r(40+i)), by = T*(.15 + .7*r(46+i)), br = T*(.015 + .025*r(52+i)); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.beginPath(); g.arc(bx, by, br, 0, Math.PI*2); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(bx - br*.4, by - br*.5, br*.5, br*.4); }
  for (const [cx, cy] of [[0,0],[T,0],[0,T],[T,T]]){ const f = g.createRadialGradient(cx, cy, 0, cx, cy, T*.3); f.addColorStop(0, 'rgba(255,255,255,.55)'); f.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = f; g.fillRect(0, 0, T, T); }
  g.fillStyle = 'rgba(255,255,255,.6)'; for (let i=0;i<8;i++) g.fillRect(T*r(60+i), T*r(70+i), 1.3, 1.3);
}
function drawIceTile(x, y, time){
  const T = tile, px = x*T, py = y*T;
  ctx.drawImage(terrSpr('i|' + x + ',' + y, T, (g, TT) => paintIce(g, TT, x, y, 0)), px, py, T, T);
  if (reduce) return;
  const ph = ((time*.3 + hh(x,y,110)*1.6) % 1.6) - .3;
  if (ph > -.3 && ph < 1.3){ ctx.save(); ctx.beginPath(); ctx.rect(px, py, T, T); ctx.clip(); ctx.globalAlpha = .6; ctx.drawImage(_streak(), px + ph*T*1.2 - T*.5, py, T, T); ctx.restore(); }
  const tw = Math.pow(Math.max(0, Math.sin(time*2.2 + hh(x,y,111)*30)), 12);
  if (tw > .05){ const sx = px + T*(.2 + hh(x,y,112)*.6), sy = py + T*(.2 + hh(x,y,113)*.6), s = T*.08*tw; ctx.strokeStyle = `rgba(255,255,255,${tw})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx - s, sy); ctx.lineTo(sx + s, sy); ctx.moveTo(sx, sy - s); ctx.lineTo(sx, sy + s); ctx.stroke(); }
}

function paintPit(g, T, x, y){
  const r = i => hh(x, y, 290+i);
  g.fillStyle = '#5b4c3e'; g.fillRect(T*.02, T*.02, T*.96, T*.96);   // the stone lip
  g.fillStyle = 'rgba(255,240,220,.18)'; g.fillRect(T*.02, T*.02, T*.96, T*.03); g.fillRect(T*.02, T*.02, T*.03, T*.96);
  g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(T*.02, T*.95, T*.96, T*.03); g.fillRect(T*.95, T*.02, T*.03, T*.96);
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(T*.5, T*.02); g.lineTo(T*.5, T*.1); g.moveTo(T*.02, T*.5); g.lineTo(T*.1, T*.5); g.moveTo(T*.98, T*.5); g.lineTo(T*.9, T*.5); g.moveTo(T*.5, T*.98); g.lineTo(T*.5, T*.9); g.stroke();
  const hole = g.createRadialGradient(T*.5, T*.55, T*.05, T*.5, T*.5, T*.5); hole.addColorStop(0, '#000'); hole.addColorStop(1, '#0d0907');
  g.fillStyle = hole; g.beginPath(); g.moveTo(T*.1, T*.12);   // a ragged opening
  for (let i=0;i<=12;i++){ const a = i/12; g.lineTo(T*(.1 + .8*a), T*(.1 + .03*Math.sin(i*2.1 + r(0)*6) + .02*r(1+i))); }
  for (let i=0;i<=12;i++){ g.lineTo(T*(.9 - .02*r(14+i) - .02*Math.sin(i + r(2)*3)), T*(.1 + .8*i/12)); }
  for (let i=0;i<=12;i++){ g.lineTo(T*(.9 - .8*i/12), T*(.9 - .03*Math.sin(i*1.7 + r(3)*6) - .02*r(28+i))); }
  for (let i=0;i<=12;i++){ g.lineTo(T*(.1 + .02*r(42+i) + .02*Math.sin(i*1.3 + r(4)*3)), T*(.9 - .8*i/12)); }
  g.closePath(); g.fill();
  for (let i=1;i<4;i++){ const ins = T*(.1 + i*.07); g.strokeStyle = `rgba(60,48,38,${.4 - i*.09})`; g.lineWidth = 1; g.strokeRect(ins, ins, T - ins*2, T - ins*2); }
  const sg = g.createLinearGradient(0, T*.1, 0, T*.45); sg.addColorStop(0, 'rgba(0,0,0,.85)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(T*.1, T*.1, T*.8, T*.35);
  if (r(60) < .45){ g.fillStyle = 'rgba(200,190,168,.22)'; g.beginPath(); g.arc(T*(.4 + r(61)*.2), T*(.7 + r(62)*.1), T*.045, 0, Math.PI*2); g.fill(); g.fillRect(T*(.4 + r(61)*.2) - T*.02, T*(.7 + r(62)*.1) + T*.03, T*.04, T*.03); }   // something glints at the bottom
  for (let i=0;i<4;i++){ g.fillStyle = 'rgba(40,32,26,.9)'; const cx = T*(.08 + .84*r(70+i)), cy = T*(.05 + .9*(i%2 ? .95 : .02)); g.beginPath(); g.moveTo(cx, cy - 3); g.lineTo(cx + 4, cy + 2); g.lineTo(cx - 3, cy + 3); g.closePath(); g.fill(); }
}
function drawPitTile(x, y, time){
  const T = tile, px = x*T, py = y*T;
  ctx.drawImage(terrSpr('p|' + x + ',' + y, T, (g, TT) => paintPit(g, TT, x, y)), px, py, T, T);
  if (S.biome==='crypt') glow(px + T/2, py + T*.58, T*.38, `rgba(120,170,110,${reduce ? .09 : .07 + .05*Math.sin(time*1.5 + x)})`);
}

function paintGrave(g, T, x, y, v){
  const r = i => hh(x, y, 320+i);
  g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(T*.5, T*.84, T*.4, T*.1, 0, 0, Math.PI*2); g.fill();
  const mg = g.createRadialGradient(T*.45, T*.74, 2, T*.5, T*.8, T*.42); mg.addColorStop(0, '#4a382a'); mg.addColorStop(1, '#241a12');
  g.fillStyle = mg; g.beginPath(); g.ellipse(T*.5, T*.8, T*.38, T*.13, 0, 0, Math.PI*2); g.fill();
  g.strokeStyle = 'rgba(100,140,70,.8)'; g.lineWidth = 1.1; g.beginPath(); for (let i=0;i<9;i++){ const bx = T*(.18 + .64*r(i)), by = T*(.76 + .08*r(10+i)); g.moveTo(bx, by); g.quadraticCurveTo(bx + 1, by - T*.04, bx + (r(20+i)-.5)*4, by - T*(.05 + .04*r(30+i))); } g.stroke();
  const sg = g.createLinearGradient(T*.3, 0, T*.7, 0); sg.addColorStop(0, '#4e473f'); sg.addColorStop(.5, '#7d7466'); sg.addColorStop(1, '#3a342e');
  g.fillStyle = sg; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1;
  if (v === 0){   // a stone cross
    g.fillRect(T*.45, T*.24, T*.1, T*.56); g.strokeRect(T*.45, T*.24, T*.1, T*.56); g.fillRect(T*.33, T*.34, T*.34, T*.09); g.strokeRect(T*.33, T*.34, T*.34, T*.09);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(T*.45, T*.24, T*.03, T*.56);
  } else if (v === 1){   // an arched headstone with an engraved cross
    g.beginPath(); g.moveTo(T*.3, T*.8); g.lineTo(T*.3, T*.44); g.arc(T*.5, T*.44, T*.2, Math.PI, 0); g.lineTo(T*.7, T*.8); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(20,16,12,.7)'; g.lineWidth = T*.03; g.beginPath(); g.moveTo(T*.5, T*.38); g.lineTo(T*.5, T*.6); g.moveTo(T*.42, T*.45); g.lineTo(T*.58, T*.45); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(T*.36, T*.76); g.lineTo(T*.4, T*.66); g.lineTo(T*.34, T*.58); g.stroke();
  } else {   // a slab with a skull
    g.fillRect(T*.28, T*.3, T*.44, T*.5); g.strokeRect(T*.28, T*.3, T*.44, T*.5);
    g.fillStyle = 'rgba(205,196,176,.8)'; g.beginPath(); g.arc(T*.5, T*.5, T*.09, 0, Math.PI*2); g.fill(); g.fillRect(T*.46, T*.56, T*.08, T*.07);
    g.fillStyle = 'rgba(16,10,6,.9)'; g.beginPath(); g.arc(T*.47, T*.49, T*.022, 0, Math.PI*2); g.arc(T*.53, T*.49, T*.022, 0, Math.PI*2); g.fill();
    g.strokeStyle = 'rgba(30,24,18,.7)'; g.lineWidth = T*.025; g.beginPath(); g.moveTo(T*.36, T*.7); g.lineTo(T*.64, T*.7); g.stroke();
  }
  g.fillStyle = 'rgba(96,126,70,.55)'; g.beginPath(); g.ellipse(T*.38, T*.78, T*.08, T*.03, 0, 0, Math.PI*2); g.fill();
  if (r(40) < .4){ g.strokeStyle = 'rgba(205,196,176,.7)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(T*.64, T*.82); g.lineTo(T*.76, T*.78); g.stroke(); }   // a stray bone
}
function drawGraveTile(x, y, time){
  const T = tile, px = x*T, py = y*T, rising = S.rise && S.rise[0]===x && S.rise[1]===y, v = Math.floor(hh(x,y,330)*3);
  const sx = px + (rising && !reduce ? (Math.random()-.5)*T*.035 : 0);
  ctx.drawImage(terrSpr('g|' + x + ',' + y + '|' + v, T, (g, TT) => paintGrave(g, TT, x, y, v)), sx, py, T, T);
  if (rising){
    ctx.strokeStyle = `rgba(180,240,160,${reduce ? .8 : .5 + .4*Math.sin(time*7)})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(sx + T*.2, py + T*.84); ctx.lineTo(sx + T*.36, py + T*.78); ctx.lineTo(sx + T*.5, py + T*.88); ctx.lineTo(sx + T*.66, py + T*.8); ctx.lineTo(sx + T*.8, py + T*.86); ctx.stroke();
    glow(px + T/2, py + T/2, T*(reduce ? .9 : .8 + .15*Math.sin(time*6)), 'rgba(150,230,140,.4)');
    if (!reduce && Math.random() < .3) fx.embers.push({x:x + .3 + Math.random()*.4, y:y + .8, vy:-(.4 + Math.random()*.5), life:.9, c:'160,235,140'});
  }
}
function drawTerrainRev(x, y, t, time){
  if (t==='water') drawWaterTile(x, y, time); else if (t==='lava') drawLavaTile(x, y, time); else if (t==='ice') drawIceTile(x, y, time);
  else if (t==='pit') drawPitTile(x, y, time); else if (t==='quicksand') drawQuicksandTile(x, y, time); else if (t==='whirl') drawWhirlTile(x, y, time); else drawGraveTile(x, y, time);
}
function drawTerrain(x, y, t, time){
  const px=x*tile, py=y*tile, T=tile;
  if (t==='pit' || t==='water' || t==='lava' || t==='ice' || t==='grave' || t==='quicksand' || t==='whirl'){ drawTerrainRev(x, y, t, time); return; }
  if (t==='tar'){
    const g=ctx.createLinearGradient(px,py,px+T,py+T); g.addColorStop(0,'#08090c'); g.addColorStop(1,'#14120f');
    ctx.fillStyle=g; ctx.fillRect(px,py,T,T);
    // gloss: every square has its own spot, size, angle and slow flicker (nothing slides across the pool)
    const gl = reduce ? .2 : .13+.09*Math.sin(time*.8+hh(x,y,129)*6.28), ga = (hh(x,y,127)-.5)*1.6, gs = .1+.12*hh(x,y,128);
    ctx.fillStyle=`rgba(230,180,90,${gl})`; ctx.beginPath(); ctx.ellipse(px+T*(.22+.5*hh(x,y,120)), py+T*(.2+.4*hh(x,y,126)), T*gs, T*gs*.32, ga, 0, Math.PI*2); ctx.fill();
    if (hh(x,y,124)<.5){ ctx.fillStyle=`rgba(200,225,255,${gl*.5})`; ctx.beginPath(); ctx.ellipse(px+T*(.3+.4*hh(x,y,136)), py+T*(.6+.25*hh(x,y,137)), T*.06, T*.02, -ga, 0, Math.PI*2); ctx.fill(); }
    const ph = ((reduce?.4:time*.4)+hh(x,y,121))%1, bx=px+T*(.25+hh(x,y,122)*.5), by=py+T*(.35+hh(x,y,123)*.4);
    ctx.strokeStyle=`rgba(230,190,100,${.5*(1-ph)})`; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(bx,by,T*(.02+.07*ph),0,Math.PI*2); ctx.stroke();
    const vr = hh(x,y,125);
    if (vr<.22){ ctx.strokeStyle='#cfc6a8'; ctx.lineWidth=Math.max(2,T*.04); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(px+T*.3,py+T*.62); ctx.lineTo(px+T*.58,py+T*.46); ctx.stroke(); ctx.fillStyle='#cfc6a8'; ctx.beginPath(); ctx.arc(px+T*.6,py+T*.45,T*.03,0,Math.PI*2); ctx.fill(); }
    else if (vr<.5){ ctx.strokeStyle='rgba(130,80,210,.22)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.5,T*.28,T*.14,.3,0,Math.PI*1.3); ctx.stroke(); ctx.strokeStyle='rgba(60,190,160,.2)'; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.5,T*.2,T*.09,.3,.4,Math.PI*1.5); ctx.stroke(); }
    ctx.strokeStyle='rgba(201,162,74,.35)'; ctx.lineWidth=1.5; ctx.strokeRect(px+1.5,py+1.5,T-3,T-3);
    ctx.fillStyle='#050403'; const tr = (a,b) => terrainAt(a,b)==='tar';
    if (!tr(x,y-1)) ctx.fillRect(px,py,T,T*.05);
    if (!tr(x,y+1)) ctx.fillRect(px,py+T*.95,T,T*.05);
    if (!tr(x-1,y)) ctx.fillRect(px,py,T*.05,T);
    if (!tr(x+1,y)) ctx.fillRect(px+T*.95,py,T*.05,T);
  } else if (t==='puddle'){
    // a shallow puddle that conducts lightning: it shimmers with sparks when a bolt is about to run through it
    const live = S.storm && S.storm.chain && S.storm.chain.some(([a,b]) => a===x && b===y);
    const pu = reduce ? .5 : .5+.5*Math.sin(time*14+x*3+y);
    const rx = T*(.38+.1*hh(x,y,130)), ry = T*(.26+.1*hh(x,y,131)), rot = (hh(x,y,132)-.5)*.8;
    const g = ctx.createRadialGradient(px+T*.5,py+T*.55,T*.03,px+T*.5,py+T*.55,rx);
    g.addColorStop(0,'rgba(95,140,195,.8)'); g.addColorStop(.8,'rgba(55,90,140,.65)'); g.addColorStop(1,'rgba(40,65,110,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.55,rx,ry,rot,0,Math.PI*2); ctx.fill();
    const ph = ((reduce?.3:time*.5)+hh(x,y,133))%1;
    ctx.strokeStyle=`rgba(200,225,255,${.4*(1-ph)})`; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(px+T*(.35+hh(x,y,134)*.3),py+T*(.45+hh(x,y,135)*.25),T*(.04+.16*ph),T*(.02+.07*ph),0,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(px+T*.4,py+T*.45,T*.1,T*.025,-.3,0,Math.PI*2); ctx.fill();
    if (live){
      glow(px+T*.5, py+T*.55, T*.95, `rgba(110,170,255,${.22+.3*pu})`);
      ctx.strokeStyle=`rgba(230,242,255,${.5+.5*pu})`; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(px+T*.2,py+T*.6); ctx.lineTo(px+T*.38,py+T*.48); ctx.lineTo(px+T*.5,py+T*.62); ctx.lineTo(px+T*.66,py+T*.46); ctx.lineTo(px+T*.82,py+T*.58); ctx.stroke();
    }
  } else if (t==='vent'){
    // tar geyser: a cracked crater with a bubbling mound; it shakes and glows just before it erupts
    const VT = S.vents && S.vents.find(q => q.at[0]===x && q.at[1]===y), er = !!VT, fv = er && VT.fire;
    const sh = er && !reduce ? (Math.random()-.5)*T*.04 : 0;
    ctx.fillStyle='rgba(0,0,0,.65)'; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.62,T*.42,T*.27,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#4a3e2e'; ctx.lineWidth=T*.07; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.62,T*.4,T*.25,0,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle='rgba(0,0,0,.6)'; ctx.lineWidth=1; for (let i=0;i<4;i++){ const a=i*1.57+.5; ctx.beginPath(); ctx.moveTo(px+T*(.5+Math.cos(a)*.4),py+T*(.62+Math.sin(a)*.25)); ctx.lineTo(px+T*(.5+Math.cos(a)*.52),py+T*(.62+Math.sin(a)*.34)); ctx.stroke(); }
    const mg=ctx.createRadialGradient(px+T*.46+sh,py+T*.5,T*.01,px+T*.5+sh,py+T*.58,T*.24); mg.addColorStop(0,fv?'#ff9a3a':'#8a6a2c'); mg.addColorStop(.35,'#14100b'); mg.addColorStop(1,'#050403');
    ctx.fillStyle=mg; ctx.beginPath(); ctx.ellipse(px+T*.5+sh,py+T*.58,T*.22,T*.16,0,0,Math.PI*2); ctx.fill();
    for (let k=0;k<2;k++){ const ph = ((reduce?.4:time*(er?1.4:.5))+hh(x,y,140+k)*2)%1; ctx.strokeStyle=`rgba(${fv?'255,170,70':'230,190,100'},${.6*(1-ph)})`; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(px+T*(.42+k*.16),py+T*(.6-ph*.12),T*(.02+.05*ph),0,Math.PI*2); ctx.stroke(); }
    { const sw = reduce ? .5 : Math.sin(time*2.2 + x*3)*.5 + .5;   // always alive: a warm glow, a swelling dome and wisps of steam
      glow(px+T*.5, py+T*.55, T*.85, 'rgba(201,150,60,' + (.18 + .12*sw) + ')');
      ctx.fillStyle = '#0b0906'; ctx.beginPath(); ctx.ellipse(px+T*.5, py+T*(.5 - .03*sw), T*(.17 + .02*sw), T*(.13 + .04*sw), 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(230,190,100,.55)'; ctx.beginPath(); ctx.ellipse(px+T*.45, py+T*.45, T*.05, T*.025, -.4, 0, Math.PI*2); ctx.fill();
      if (!reduce) for (let i=0;i<3;i++){ const f = (time*.35 + i/3 + hh(x,y,141)) % 1; ctx.fillStyle = 'rgba(170,160,140,' + (.32*(1-f)) + ')'; ctx.beginPath(); ctx.arc(px + T*(.5 + Math.sin(time + i*2)*.06), py + T*(.4 - f*.38), T*(.04 + .06*f), 0, Math.PI*2); ctx.fill(); } }
    if (er){
      glow(px+T*.5, py+T*.55, T*1.05, fv ? 'rgba(255,110,30,.5)' : 'rgba(201,162,74,.4)');
      ctx.strokeStyle=fv?'rgba(255,190,90,.8)':'rgba(120,96,50,.9)'; ctx.lineWidth=Math.max(2,T*.04); ctx.lineCap='round'; ctx.beginPath(); for (const dx of [-.12,0,.12]){ ctx.moveTo(px+T*(.5+dx),py+T*.52); ctx.lineTo(px+T*(.5+dx*1.6),py+T*(.3-(reduce?0:.06*Math.abs(Math.sin(time*9+dx*20))))); } ctx.stroke();
    }
  } else if (t==='m_heal'){
    // healing mushrooms: a trio of green caps with white spots, a pulsing ring on the ground and a glowing cross
    const pl = reduce ? .8 : .65+.3*Math.sin(time*2.4+x+y);
    ctx.strokeStyle=`rgba(120,235,140,${.25+.25*pl})`; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(px+T*.5,py+T*.84,T*(.3+.08*pl),T*(.1+.03*pl),0,0,Math.PI*2); ctx.stroke();
    glow(px+T*.5, py+T*.55, T*.85, `rgba(90,225,120,${.14+.12*pl})`);
    const G = {st:['#a9c4a0','#e2f0d8','#8aa882'], cap3:['#b4f5a4','#4cc464','#1f7a3c'], gill:'#164a26', rim:'rgba(230,255,220,.55)'};
    drawShroom(px, py, T, Object.assign({}, G, {x:.28, y:.86, h:.2, r:.15, sw:.025, ph:x, spots:[[-.3,.5,.022]]}), time);
    drawShroom(px, py, T, Object.assign({}, G, {x:.74, y:.86, h:.17, r:.13, sw:.022, ph:x+2, spots:[[.2,.6,.02]]}), time);
    drawShroom(px, py, T, Object.assign({}, G, {x:.5, y:.9, h:.34, r:.23, sw:.04, ph:x+1, spots:[[-.45,.5,.03],[.2,.8,.032],[.5,.4,.024]]}), time);
    ctx.strokeStyle=`rgba(210,255,215,${.55+.4*pl})`; ctx.lineWidth=Math.max(2,T*.04); ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(px+T*.5,py+T*.06); ctx.lineTo(px+T*.5,py+T*.22); ctx.moveTo(px+T*.42,py+T*.14); ctx.lineTo(px+T*.58,py+T*.14); ctx.stroke();
    if (!reduce) for (let i=0;i<4;i++){ const f=(time*.45+i*.25+hh(x,y,152))%1; ctx.fillStyle=`rgba(170,255,180,${(1-f)*.85})`; ctx.fillRect(px+T*(.22+.18*i)+Math.sin(time*2+i*2)*T*.03,py+T*(.5-f*.4),2,2); }
  } else if (t==='m_glow'){
    // luminous mushroom: a tall cyan cap that lights the whole square, with rays and drifting motes
    const pl = reduce ? .8 : .6+.4*Math.sin(time*2+x*1.7+y);
    glow(px+T*.5, py+T*.4, T*(1+.12*pl), `rgba(80,190,255,${.24+.2*pl})`);
    ctx.save(); ctx.globalCompositeOperation='lighter';
    for (let i=0;i<5;i++){ const a=-Math.PI/2+(i-2)*.42+(reduce?0:Math.sin(time*.8+i)*.05), L=T*(.34+.1*pl); ctx.fillStyle=`rgba(150,225,255,${.1+.08*pl})`; ctx.beginPath(); ctx.moveTo(px+T*.5,py+T*.4); ctx.lineTo(px+T*.5+Math.cos(a-.07)*L,py+T*.4+Math.sin(a-.07)*L); ctx.lineTo(px+T*.5+Math.cos(a+.07)*L,py+T*.4+Math.sin(a+.07)*L); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    drawShroom(px, py, T, {x:.5, y:.88, h:.5, r:.27, cap:1.05, sw:.04, ph:x, st:['#8fb6d0','#d8f0fa','#6f94ae'], cap3:['#f2feff','#6fd4ff','#1e5eaa'], gill:'#10305a', gillLine:'rgba(180,230,255,.25)', rim:'rgba(255,255,255,.6)', spots:[[-.4,.5,.03],[.3,.75,.026]], spotGlow:'230,250,255', glow:'80,190,255', gr:.7}, time);
    if (!reduce) for (let i=0;i<4;i++){ const f=(time*.5+i*.25+hh(x,y,153))%1; ctx.fillStyle=`rgba(190,240,255,${(1-f)*.9})`; ctx.fillRect(px+T*(.25+.17*i)+Math.sin(time*2+i)*T*.04,py+T*(.4-f*.34),2,2); }
  } else if (t==='m_puff'){
    // puffball: a big warty ball with cracks at its feet; it swells and lets out dust, and bursts when stepped on
    const pl = reduce ? 0 : Math.sin(time*3+x*2+y);
    const rr = T*.28*(1+.05*pl), cx = px+T*.5, cy = py+T*.6;
    ctx.fillStyle='rgba(0,0,0,.38)'; ctx.beginPath(); ctx.ellipse(cx,py+T*.88,T*.26,T*.06,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1; ctx.beginPath(); for (const a of [.2,1.2,2.2,3.0]){ ctx.moveTo(cx+Math.cos(a)*rr*.9,py+T*.86); ctx.lineTo(cx+Math.cos(a)*rr*1.4,py+T*.9); } ctx.stroke();
    const g=ctx.createRadialGradient(cx-rr*.35,cy-rr*.4,rr*.05,cx,cy,rr*1.2); g.addColorStop(0,'#f6ead0'); g.addColorStop(.5,'#c6a468'); g.addColorStop(1,'#6a4826');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,rr,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.3)'; ctx.lineWidth=1; ctx.stroke();
    for (let i=0;i<14;i++){ const a=hh(x,y,160+i)*6.28, d=Math.sqrt(hh(x,y,180+i))*rr*.85, wr=T*(.012+hh(x,y,200+i)*.016); ctx.fillStyle='rgba(80,52,26,.5)'; ctx.beginPath(); ctx.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,wr,0,Math.PI*2); ctx.fill(); ctx.fillStyle='rgba(255,240,205,.3)'; ctx.beginPath(); ctx.arc(cx+Math.cos(a)*d-wr*.3,cy+Math.sin(a)*d-wr*.3,wr*.45,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle='#2e1c0c'; ctx.beginPath(); ctx.ellipse(cx,cy-rr*.82,T*.05,T*.022,0,0,Math.PI*2); ctx.fill();
    if (!reduce) for (let i=0;i<2;i++){ const f=(time*.4+i*.5+hh(x,y,151))%1; ctx.fillStyle=`rgba(220,200,150,${(1-f)*.4})`; ctx.beginPath(); ctx.arc(cx+Math.sin(time+x+i*3)*T*.06,cy-rr-f*T*.3,T*(.03+.07*f),0,Math.PI*2); ctx.fill(); }
  } else if (t==='blood'){  } else if (t==='blood'){
    const g = ctx.createRadialGradient(px+T*.5, py+T*.55, T*.05, px+T*.5, py+T*.55, T*.55);
    g.addColorStop(0, '#7a0d08'); g.addColorStop(.75, 'rgba(90,8,5,.92)'); g.addColorStop(1, 'rgba(60,5,3,.25)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px+T*.5, py+T*.55, T*.46, T*.4, 0, 0, Math.PI*2); ctx.fill();
    const ph = ((reduce ? .3 : time*.6) + hh(x,y,300)) % 1;
    ctx.strokeStyle = `rgba(255,90,70,${.45*(1-ph)})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(px+T*.5, py+T*.55, T*(.08+.3*ph), T*(.06+.24*ph), 0, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,140,120,.35)'; ctx.beginPath(); ctx.ellipse(px+T*.38, py+T*.42, T*.08, T*.03, -.4, 0, Math.PI*2); ctx.fill();
  }
}
/* ambient particles per biome */
function spawnAmb(initial){
  const b = S.biome, R = Math.random;
  if (b==='crypt') return {k:'dust', x:R()*W, y:R()*H, vx:(R()-.5)*.08, vy:(R()-.6)*.06, life:3+R()*5, max:8};
  if (b==='swamp') return {k:'fly', x:R()*W, y:R()*H, ph:R()*7, life:4+R()*6, max:10};
  if (b==='forge'){
    const lava = [...S.terrain].filter(([,t]) => t==='lava');
    const src = lava.length && R()<.7 ? unkey(lava[Math.floor(R()*lava.length)][0]) : [R()*W, H-.5];
    return {k:'ember', x:src[0]+R(), y:initial ? R()*H : src[1]+.5+R()*.4, vx:(R()-.5)*.25, vy:-(.35+R()*.6), life:1.5+R()*2.5, max:4};
  }
  if (b==='cathedral') return {k:'snow', x:R()*W*1.1-W*.1, y:initial ? R()*H : -.2, vx:.1+R()*.12, vy:.22+R()*.25, s:R(), life:30, max:30};
  if (b==='storm') return {k:'rain', x:R()*W*1.2, y:initial ? R()*H : -.3, vx:-.5, vy:4.2+R()*1.2, life:30, max:30};
  if (b==='tar') return {k:'smoke', x:R()*W, y:initial ? R()*H : H+.1, vx:(R()-.5)*.1, vy:-(.15+R()*.2), life:3+R()*3, max:6};
  if (b==='ash' && R()<.07) return {k:'tumble', x:initial ? R()*W : -.4, y:.5 + R()*(H-1), vx:1.1 + R()*.8, vy:0, ph:R()*7, life:40, max:40};
  if (b==='sea' && R()<.1) { const l2r = R()<.5; return {k:'fish', x:initial ? R()*W : (l2r ? -.5 : W + .5), y:.5 + R()*(H-1), vx:(l2r ? 1 : -1)*(.5 + R()*.5), vy:(R()-.5)*.05, ph:R()*7, n:3 + Math.floor(R()*4), life:40, max:40}; }
  if (b==='sea' && R()<.08) return {k:'jelly', x:R()*W, y:initial ? R()*H : H + .3, vx:(R()-.5)*.08, vy:-(.08 + R()*.08), ph:R()*7, life:16 + R()*8, max:24};
  if (b==='ash') return {k:'sand', x:initial ? R()*W : -.3, y:R()*H, vx:(S.wind ? 1.6 : .5) + R()*.6, vy:.02 + R()*.06, life:40, max:40};
  if (b==='sea') return {k:'bubble', x:R()*W, y:initial ? R()*H : H + .1, vx:(R()-.5)*.05, vy:-(.18 + R()*.25), ph:R()*7, life:6 + R()*6, max:12};
  if (b==='fungal') return {k:'spore', x:R()*W, y:initial ? R()*H : H+.1, ph:R()*7, vx:0, vy:-(.08+R()*.1), life:5+R()*6, max:11};
  return null;
}
const AMB_COUNT = {crypt:16, swamp:14, forge:26, cathedral:45, storm:46, tar:10, fungal:24, ash:40, sea:26};
function updateAmb(dt){
  if (!S || !S.walls || reduce){ fx.amb = []; return; }
  if (fx.ambFloor!==S.fseed){
    fx.amb = []; fx.ambFloor = S.fseed;
    for (let i=0;i<(AMB_COUNT[S.biome]||0);i++){ const a = spawnAmb(true); if (a) fx.amb.push(a); }
  }
  const t = performance.now()/1000;
  for (const a of fx.amb){
    if (a.k==='fly'){ a.x += Math.sin(t*.9+a.ph)*.35*dt; a.y += Math.cos(t*.7+a.ph*1.3)*.3*dt; }
    else { a.x += a.vx*dt; a.y += a.vy*dt; if (a.k==='snow') a.x += Math.sin(t+a.s*9)*.05*dt; if (a.k==='spore') a.x += Math.sin(t*.8+a.ph)*.18*dt; }
    a.life -= dt;
  }
  fx.amb = fx.amb.filter(a => a.life>0 && a.y<H+.3 && a.y>-.5 && a.x>-.5 && a.x<W+.5);
  for (let n=0; fx.amb.length < (AMB_COUNT[S.biome]||0) && n<10; n++){ const a = spawnAmb(false); if (!a) break; fx.amb.push(a); }
}
function drawAmb(time){
  for (const a of fx.amb){
    const fade = Math.max(0, Math.min(1, a.life, (a.max-a.life)*2));
    const x = a.x*tile, y = a.y*tile;
    if (a.k==='dust'){ ctx.fillStyle=`rgba(225,205,175,${.3*fade})`; ctx.fillRect(x,y,1.6,1.6); }
    else if (a.k==='fly'){
      const bl = Math.max(0, Math.sin(time*3+a.ph*5)); if (bl<.05) continue;
      glow(x, y, tile*.16, `rgba(200,245,120,${.45*bl*fade})`);
      ctx.fillStyle=`rgba(235,255,170,${bl*fade})`; ctx.fillRect(x-1,y-1,2,2);
    } else if (a.k==='ember'){
      const s = Math.max(1.5, tile*.035);
      ctx.fillStyle=`rgba(255,${140+Math.floor(80*fade)},60,${Math.min(1,a.life)})`; ctx.fillRect(x,y,s,s);
    } else if (a.k==='snow'){
      ctx.fillStyle=`rgba(240,248,255,${.55+.3*a.s})`; ctx.beginPath(); ctx.arc(x,y,.8+a.s*1.6,0,Math.PI*2); ctx.fill();
    } else if (a.k==='rain'){
      ctx.strokeStyle='rgba(180,205,255,.28)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+tile*.05, y-tile*.2); ctx.stroke();
    } else if (a.k==='smoke'){
      ctx.fillStyle=`rgba(70,58,46,${.14*fade})`; ctx.beginPath(); ctx.arc(x,y,tile*(.06+.07*(1-a.life/a.max)),0,Math.PI*2); ctx.fill();
    } else if (a.k==='spore'){
      glow(x, y, tile*.13, `rgba(120,240,210,${.42*fade})`);
      ctx.fillStyle=`rgba(200,255,240,${.8*fade})`; ctx.fillRect(x-1,y-1,2,2);
    } else if (a.k==='tumble'){
      const bn = Math.abs(Math.sin(a.x*3 + a.ph))*tile*.12, R0 = tile*.15; ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x, y + R0*.9, R0*.8, R0*.25, 0, 0, Math.PI*2); ctx.fill();
      ctx.save(); ctx.translate(x, y - bn); ctx.rotate(a.x*4); ctx.strokeStyle = 'rgba(160,126,76,.9)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i=0;i<9;i++){ const s = i*.7 + a.ph; ctx.moveTo(0, 0); ctx.bezierCurveTo(Math.cos(s)*R0*.5, Math.sin(s)*R0*1.2, Math.cos(s+1)*R0*1.1, Math.sin(s+1)*R0*.6, Math.cos(s+.4)*R0, Math.sin(s+.4)*R0); } ctx.stroke(); ctx.restore();
    } else if (a.k==='fish'){
      const dir = a.vx > 0 ? 1 : -1, sz = tile*.07; ctx.fillStyle = 'rgba(14,44,60,.6)';
      for (let i=0;i<a.n;i++){ const fx0 = x - dir*(i%3)*sz*2.6 + Math.sin(i*2.3)*sz, fy0 = y + (i - a.n/2)*sz*1.1 + Math.sin(time*2 + i + a.ph)*sz*.5, wag = Math.sin(time*9 + i*1.7)*sz*.5;
        ctx.beginPath(); ctx.ellipse(fx0, fy0, sz*1.3, sz*.6, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx0 - dir*sz*1.1, fy0); ctx.lineTo(fx0 - dir*sz*2.1, fy0 - sz*.8 + wag); ctx.lineTo(fx0 - dir*sz*2.1, fy0 + sz*.8 + wag); ctx.closePath(); ctx.fill(); }
    } else if (a.k==='jelly'){
      const pu = Math.sin(time*2 + a.ph), rr = tile*(.1 + .015*pu); glow(x, y, tile*.55, 'rgba(120,220,255,' + (.2*fade) + ')');
      ctx.fillStyle = 'rgba(170,230,255,' + (.32*fade) + ')'; ctx.strokeStyle = 'rgba(210,245,255,' + (.6*fade) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, rr, rr*(.8 - .12*pu), 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(x + i*rr*.4, y); for (let k=1;k<=4;k++) ctx.lineTo(x + i*rr*.4 + Math.sin(time*3 + k + i)*rr*.18, y + k*rr*.5); ctx.stroke(); }
    } else if (a.k==='sand'){
      ctx.strokeStyle='rgba(222,196,140,.4)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x - a.vx*tile*.06, y - a.vy*tile*.06); ctx.stroke();
    } else if (a.k==='bubble'){
      ctx.strokeStyle=`rgba(190,235,250,${.5*fade})`; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x + Math.sin(a.ph + a.life)*tile*.03, y, tile*(.02 + .02*(a.ph%1)), 0, Math.PI*2); ctx.stroke();
    }
  }
}
let _caus = null;
function causticPat(){
  if (_caus) return _caus;
  const N = 128, c0 = document.createElement('canvas'); c0.width = c0.height = N; const g = c0.getContext('2d'), im = g.createImageData(N, N), TP = Math.PI*2;
  for (let j=0;j<N;j++) for (let i=0;i<N;i++){ const u = i/N, v = j/N, s = Math.sin(u*TP*3 + 1.7*Math.sin(v*TP*2)) + Math.sin(v*TP*3 + 1.7*Math.sin(u*TP*2)), a = Math.max(0, 1 - Math.abs(s)*1.9), o = (j*N + i)*4; im.data[o] = 190; im.data[o+1] = 240; im.data[o+2] = 255; im.data[o+3] = Math.floor(255*a*a); }
  g.putImageData(im, 0, 0); _caus = ctx.createPattern(c0, 'repeat'); return _caus;
}
function drawCaustics(time, size){
  const pat = causticPat(); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, size, size); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = pat;
  for (const [k, al, dx, dy] of [[2.2, .12, 9, 5], [3.1, .09, -7, 8]]){ ctx.save(); ctx.globalAlpha = al; ctx.translate((time*dx) % 128*k, (time*dy) % 128*k); ctx.scale(k, k); ctx.fillRect(-256, -256, size/k + 512, size/k + 512); ctx.restore(); }
  ctx.restore();
}
function drawBiomeLight(time, size){
  const b = S.biome;
  if (b==='cathedral'){
    // stained-glass light shafts
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const cols = ['120,160,255','255,200,120','210,130,220'];
    for (let i=0;i<3;i++){
      const a = reduce ? .06 : .05+.025*Math.sin(time*.4+i*2);
      const x0 = size*(.08+i*.3), w = size*.12;
      const g=ctx.createLinearGradient(0,0,0,size); g.addColorStop(0,`rgba(${cols[i]},${a*1.6})`); g.addColorStop(1,`rgba(${cols[i]},0)`);
      ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(x0,0); ctx.lineTo(x0+w,0); ctx.lineTo(x0+w+size*.35,size); ctx.lineTo(x0+size*.3,size); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    for (let i=0;i<3;i++){ const a = reduce ? .06 : .06+.03*Math.sin(time*.4+i*2); glow(size*(.08+i*.3+.12/2+.3*.8), size*(.78+.05*Math.sin(time*.2+i)), size*.2, `rgba(${cols[i]},${a*2.2})`); }   // pools of colored light where the shafts land
  } else if (b==='forge'){
    ctx.fillStyle=`rgba(255,70,10,${reduce?.035:.03+.02*Math.sin(time*1.3)})`; ctx.fillRect(0,0,size,size);
    for (const [k,t] of S.terrain) if (t==='lava'){ const [x,y] = unkey(k); glow((x+.5)*tile, (y+.5)*tile, tile*2.4, `rgba(255,95,25,${reduce ? .11 : .1 + .045*Math.sin(time*2.5 + x + y)})`); }
    for (const k of S.burn.keys()){ const [x,y] = unkey(k); glow((x+.5)*tile, (y+.5)*tile, tile*1.6, `rgba(255,120,40,${reduce ? .1 : .09 + .04*Math.sin(time*7 + x)})`); }
  } else if (b==='storm'){
    // now and then the whole sky flashes
    const q = reduce ? 9 : time % 8.7, fl = q<.3 ? (1-q/.3)*(.55+.45*Math.sin(q*50)) : 0;
    if (fl>.02){ ctx.fillStyle=`rgba(200,220,255,${fl*.1})`; ctx.fillRect(0,0,size,size); }
  } else if (b==='ash'){
    // a low hot sun: a warm wash that is strongest at the top, and a haze that deepens when the wind is up
    const g = ctx.createLinearGradient(0,0,0,size); g.addColorStop(0, 'rgba(255,190,90,.09)'); g.addColorStop(1, 'rgba(255,140,50,.02)'); ctx.fillStyle = g; ctx.fillRect(0,0,size,size);
    if (S.wind){ ctx.fillStyle = 'rgba(190,160,110,.08)'; ctx.fillRect(0,0,size,size); }
    if (!reduce) for (let i=0;i<3;i++){ const y0 = ((time*.02*(1 + i*.3) + i*.37) % 1.3 - .15)*size, hg = ctx.createLinearGradient(0, y0, 0, y0 + size*.22); hg.addColorStop(0, 'rgba(230,190,130,0)'); hg.addColorStop(.5, 'rgba(230,190,130,.05)'); hg.addColorStop(1, 'rgba(230,190,130,0)'); ctx.fillStyle = hg; ctx.fillRect(0, y0, size, size*.22); }
  } else if (b==='sea'){
    // light from the surface: slow diagonal bands of caustic light, and a blue-green tint
    ctx.fillStyle='rgba(20,90,120,.06)'; ctx.fillRect(0,0,size,size); if (!reduce) drawCaustics(time, size);
    if (!reduce){ ctx.save(); ctx.globalCompositeOperation='lighter'; for (let i=0;i<4;i++){ const x0 = ((time*.012 + i*.27) % 1.4 - .2)*size, g = ctx.createLinearGradient(x0, 0, x0 + size*.12, 0); g.addColorStop(0,'rgba(140,220,240,0)'); g.addColorStop(.5,'rgba(140,220,240,.05)'); g.addColorStop(1,'rgba(140,220,240,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0,0); ctx.lineTo(x0 + size*.12,0); ctx.lineTo(x0 + size*.42,size); ctx.lineTo(x0 + size*.3,size); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  } else if (b==='fungal'){
    ctx.fillStyle=`rgba(90,40,150,${reduce?.04:.04+.015*Math.sin(time*.9)})`; ctx.fillRect(0,0,size,size);
    // bioluminescence everywhere: soft patches of light scattered over the floor, each pulsing at its own pace,
    // and every glowing mushroom (on the floor or a wall) lights up its surroundings
    for (let y=0;y<H;y++) for (let x=0;x<W;x++){
      if (hh(x,y,210) >= .22) continue;
      const teal = hh(x,y,211) < .6, a = reduce ? .5 : .5+.5*Math.sin(time*(.7+hh(x,y,213)*.6) + hh(x,y,212)*6.28);
      glow((x+.25+hh(x,y,214)*.5)*tile, (y+.25+hh(x,y,215)*.5)*tile, tile*(1+.7*hh(x,y,216)), teal ? `rgba(70,220,190,${.1+.13*a})` : `rgba(150,90,240,${.1+.13*a})`);
    }
    for (const [k,t] of S.terrain) if (t==='m_glow' || t==='m_heal'){ const [x,y] = unkey(k); glow((x+.5)*tile, (y+.5)*tile, tile*2.4, t==='m_glow' ? 'rgba(80,190,255,.17)' : 'rgba(90,225,120,.14)'); }
    for (const k of S.walls){ const [x,y] = unkey(k), v = Math.floor(hh(x,y,43)*4); if (v===1) continue; glow((x+.5)*tile, (y+.45)*tile, tile*1.7, v===3 ? 'rgba(240,150,60,.11)' : v===2 ? 'rgba(80,230,200,.14)' : 'rgba(110,210,200,.11)'); }
  }
}
let fogCv = null;
function drawSwampFog(time, size){
  const w = Math.max(1, Math.round(size*dpr));
  fogCv = fogCv || document.createElement('canvas');
  if (fogCv.width!==w){ fogCv.width = w; fogCv.height = w; }
  const c = fogCv.getContext('2d');
  c.setTransform(dpr,0,0,dpr,0,0);
  c.globalCompositeOperation = 'source-over';
  c.clearRect(0,0,size,size);
  c.fillStyle = 'rgb(46,58,52)'; c.fillRect(0,0,size,size);
  // drifting smoke so the fog is never flat
  for (let k=0;k<10;k++){
    const sp = .1*(1+(k%3)*.4), span = W+6;
    const cx = (((hh(k,0,500)*span + (reduce?0:time)*sp) % span) - 3)*tile;
    const cy = (hh(k,1,500)*H + (reduce?0:Math.sin(time*.18+k))*.6)*tile, rad = tile*(1.6+hh(k,2,500)*1.6);
    const g = c.createRadialGradient(cx,cy,0,cx,cy,rad);
    const light = k%2 ? '120,140,130' : '20,28,24';
    g.addColorStop(0,`rgba(${light},.35)`); g.addColorStop(1,`rgba(${light},0)`);
    c.fillStyle = g; c.fillRect(cx-rad,cy-rad,rad*2,rad*2);
  }
  // carve the sight radius: clear in the middle, thickening smoothly with distance
  const p = S.player, [px,py] = sqCenter(p.rx, p.ry), R = sight()*tile;
  const breathe = reduce ? 0 : Math.sin(time*.8)*.06*tile;
  c.globalCompositeOperation = 'destination-out';
  const g = c.createRadialGradient(px,py,0,px,py,R*1.75+breathe);
  g.addColorStop(0,'rgba(0,0,0,1)');
  g.addColorStop(.42,'rgba(0,0,0,1)');
  g.addColorStop(.58,'rgba(0,0,0,.6)');
  g.addColorStop(.75,'rgba(0,0,0,.25)');
  g.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0,0,size,size);
  c.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalAlpha = .93;
  ctx.drawImage(fogCv, 0, 0, size, size);
  ctx.restore();
}
// arena clock telegraph: tinted, pulsing square with an icon for what is coming
function drawClockMark(x, y, kind, time){
  const col = {collapse:'200,170,130', flood:'120,200,190', lava:'255,130,50', frost:'215,240,255', storm:'120,180,255', tar:'201,162,74', grow:'160,110,220'}[kind];
  const px = x*tile, py = y*tile, cx = px+tile/2, cy = py+tile/2, pul = reduce ? .5 : .5+.5*Math.sin(time*5);
  ctx.fillStyle = `rgba(${col},${.14+.14*pul})`; ctx.fillRect(px, py, tile, tile);
  ctx.strokeStyle = `rgba(${col},${.7+.3*pul})`; ctx.lineWidth = 2.5; ctx.strokeRect(px+2.5, py+2.5, tile-5, tile-5);
  const s = tile*.17;
  ctx.strokeStyle = `rgba(${col},.95)`; ctx.fillStyle = `rgba(${col},.95)`; ctx.lineWidth = Math.max(1.6, tile*.03); ctx.lineCap = 'round';
  ctx.beginPath();
  if (kind==='collapse'){
    for (const [ox,oy,r] of [[-.6,-.7,.32],[.5,-.2,.38],[-.2,.55,.3]]){ ctx.rect(cx+ox*s-r*s, cy+oy*s-r*s + (reduce?0:((time*1.6+ox)%1)*s*.5), r*s*2, r*s*2); }
    ctx.fill();
  } else if (kind==='flood'){
    for (const oy of [-.45,.35]){ ctx.moveTo(cx-s, cy+oy*s); ctx.quadraticCurveTo(cx-s*.5, cy+(oy-.5)*s, cx, cy+oy*s); ctx.quadraticCurveTo(cx+s*.5, cy+(oy+.5)*s, cx+s, cy+oy*s); }
    ctx.stroke();
  } else if (kind==='lava'){
    ctx.moveTo(cx, cy-s*1.1); ctx.quadraticCurveTo(cx+s*.9, cy, cx+s*.55, cy+s*.8); ctx.lineTo(cx-s*.55, cy+s*.8); ctx.quadraticCurveTo(cx-s*.9, cy, cx, cy-s*1.1);
    ctx.fill();
  } else if (kind==='storm'){
    ctx.moveTo(cx+s*.2, cy-s*1.2); ctx.lineTo(cx-s*.5, cy+s*.1); ctx.lineTo(cx+s*.1, cy+s*.1); ctx.lineTo(cx-s*.3, cy+s*1.2); ctx.lineTo(cx+s*.7, cy-s*.3); ctx.lineTo(cx+s*.05, cy-s*.3); ctx.closePath(); ctx.fill();
  } else if (kind==='tar'){
    for (const [ox,oy] of [[-.6,-.3],[.6,-.3],[0,.5]]){ ctx.moveTo(cx+ox*s, cy+oy*s-s*.5); ctx.quadraticCurveTo(cx+ox*s+s*.4, cy+oy*s+s*.2, cx+ox*s, cy+oy*s+s*.4); ctx.quadraticCurveTo(cx+ox*s-s*.4, cy+oy*s+s*.2, cx+ox*s, cy+oy*s-s*.5); }
    ctx.fill();
  } else if (kind==='grow'){
    ctx.arc(cx, cy-s*.2, s*.9, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx, cy-s*.2); ctx.lineTo(cx, cy+s); ctx.stroke();
  } else {
    for (let i=0;i<3;i++){ const a = i*Math.PI/3; ctx.moveTo(cx-Math.cos(a)*s, cy-Math.sin(a)*s); ctx.lineTo(cx+Math.cos(a)*s, cy+Math.sin(a)*s); }
    ctx.stroke();
  }
}
// the Rift open: a round dark well that fades into violet light (nothing is cut off at the edge of the square), with turning ellipses and a bright core
function riftSwirl(x, y, time){
  const T = tile, cx = (x+.5)*T, cy = (y+.5)*T, tt = reduce ? 0 : time;
  glow(cx, cy, T*3.2, 'rgba(150,90,255,'+(reduce?.34:.32+.08*Math.sin(time*2.2+x+y))+')');
  glow(cx, cy, T*1.4, 'rgba(200,150,255,'+(reduce?.3:.28+.08*Math.sin(time*3+x))+')');
  const well = ctx.createRadialGradient(cx, cy, 0, cx, cy, T*.62); well.addColorStop(0, 'rgba(14,6,26,.92)'); well.addColorStop(.55, 'rgba(24,10,44,.6)'); well.addColorStop(1, 'rgba(24,10,44,0)');
  ctx.fillStyle = well; ctx.beginPath(); ctx.arc(cx, cy, T*.62, 0, Math.PI*2); ctx.fill();   // (drawn over the wide glow, so the well stays dark)
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k=0;k<4;k++){
    const a = tt*(.9+k*.35) + k*1.7, r = T*(.12+.08*k);
    ctx.strokeStyle = 'rgba('+(150+k*25)+','+(90+k*15)+',255,'+(.6-k*.1)+')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, r*1.5, r, a, 0, Math.PI*1.5); ctx.stroke();
  }
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, T*.45); g.addColorStop(0, 'rgba(255,240,255,.7)'); g.addColorStop(.4, 'rgba(160,90,255,.4)'); g.addColorStop(1, 'rgba(90,30,170,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, T*.45, 0, Math.PI*2); ctx.fill(); ctx.restore();
}
// the Rift still closed (the gate you step on to open it): slowly turning arcs in a violet glow
function riftArcs(cx, cy, time){
  glow(cx, cy, tile*1.4, `rgba(170,120,255,${reduce?.4:.35+.12*Math.sin(time*3)})`);
  ctx.save(); ctx.translate(cx, cy);
  for (let i=0;i<3;i++){
    ctx.rotate((reduce?0:time)*(i%2?-1:1)*.8 + i);
    ctx.strokeStyle = `rgba(${200-i*30},${160-i*30},255,.8)`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, tile*(.18+i*.09), 0, Math.PI*1.3); ctx.stroke();
  }
  ctx.restore();
}
function drawRift(time){
  const r = S.rift, [cx,cy] = sqCenter(r.x, r.y);
  glow(cx, cy, tile*4.6, 'rgba(150,100,255,.2)');   // the zone where kills count: a soft round halo, no squares
  riftSwirl(r.x, r.y, time);
  ctx.fillStyle = '#e6d6ff'; ctx.font = `700 ${tile*.22}px ${BF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(10,6,4,.9)'; ctx.lineWidth = 3; ctx.strokeText(r.turns, cx, cy-tile*.42); ctx.fillText(r.turns, cx, cy-tile*.42);
}
// the frozen match is drawn on its own 8x8 board
function drawChess(time){
  const c = S.chess, size = cv.width/dpr, saved = tile;
  tile = size/8;
  const T = tile, check = chInCheck(c.board,'b'), targets = chessTargets(), hint = c.hintMove;
  for (let y=0;y<8;y++) for (let x=0;x<8;x++){
    const sq = y*8+x, light = (x+y)%2===0;
    ctx.fillStyle = light ? '#c7d3df' : '#6c7f93'; ctx.fillRect(x*T, y*T, T, T);
    const v = hh(x, y, 900) - .5; ctx.fillStyle = v>0 ? `rgba(255,255,255,${v*.12})` : `rgba(0,20,40,${-v*.15})`; ctx.fillRect(x*T, y*T, T, T);
    if (c.last && (c.last.from===sq || c.last.to===sq)){ ctx.fillStyle = 'rgba(227,180,86,.32)'; ctx.fillRect(x*T, y*T, T, T); }
    if (c.sel===sq){ ctx.fillStyle = 'rgba(224,122,50,.38)'; ctx.fillRect(x*T, y*T, T, T); }
    if (hint && (hint.from===sq || hint.to===sq)){ ctx.strokeStyle = '#8fd18a'; ctx.lineWidth = 3; ctx.strokeRect(x*T+3, y*T+3, T-6, T-6); }
    const p = c.board[sq];
    if (p && p.t==='K' && p.c==='b' && check) glow((x+.5)*T, (y+.5)*T, T*.7, 'rgba(255,60,40,.6)');
  }
  ctx.fillStyle = 'rgba(20,30,45,.7)'; ctx.font = `600 ${T*.16}px ${BF}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  for (let i=0;i<8;i++){ ctx.fillText(8-i, 3, i*T+3); ctx.fillText('abcdefgh'[i], i*T+T-T*.16, 8*T-T*.2); }
  for (const m of targets){
    const x = m.to%8, y = (m.to/8)|0;
    ctx.fillStyle = 'rgba(30,40,55,.45)';
    if (c.board[m.to]){ ctx.strokeStyle = 'rgba(224,80,50,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc((x+.5)*T, (y+.5)*T, T*.44, 0, Math.PI*2); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc((x+.5)*T, (y+.5)*T, T*.13, 0, Math.PI*2); ctx.fill(); }
  }
  for (let sq=0; sq<64; sq++){
    const p = c.board[sq]; if (!p) continue;
    const x = sq%8, y = (sq/8)|0;
    if (p.c==='w' && !p.hero) ctx.globalAlpha = .82;
    drawPiece(p.t, x, y, p.c, {player:!!p.hero, spectral:p.c==='w' && !p.hero});
    ctx.globalAlpha = 1;
  }
  const g = ctx.createRadialGradient(size/2, size/2, size*.35, size/2, size/2, size*.75);
  g.addColorStop(0, 'rgba(200,225,245,0)'); g.addColorStop(1, 'rgba(200,225,245,.22)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  tile = saved;
}
function drawSpecial(it, time){
  const [cx,cy] = sqCenter(it.x,it.y), r = tile*(.13+.02*Math.sin(time*4+it.x));
  ctx.save();
  if (it.potion){
    ctx.shadowColor = '#8fd18a'; ctx.shadowBlur = tile*.4; ctx.fillStyle = '#c2402f';
    ctx.beginPath(); ctx.arc(cx, cy+r*.3, r*1.05, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#d8cbb2'; ctx.fillRect(cx-r*.35, cy-r*1.25, r*.7, r*.7);
  } else if (it.chest){
    ctx.shadowColor = '#e3b456'; ctx.shadowBlur = tile*.3;
    ctx.fillStyle = '#5a3a1e'; ctx.fillRect(cx-tile*.24, cy-tile*.14, tile*.48, tile*.3);
    ctx.fillStyle = '#e3b456'; ctx.fillRect(cx-tile*.24, cy-tile*.02, tile*.48, tile*.05); ctx.fillRect(cx-tile*.04, cy-tile*.08, tile*.08, tile*.12);
  } else if (it.shrine){
    const g = ctx.createLinearGradient(cx, cy-tile*.5, cx, cy+tile*.3);
    g.addColorStop(0,'rgba(240,214,140,0)'); g.addColorStop(1,`rgba(240,214,140,${.5+.2*Math.sin(time*3)})`);
    ctx.fillStyle = g; ctx.fillRect(cx-tile*.16, cy-tile*.5, tile*.32, tile*.8);
    ctx.fillStyle = '#d8cbb2'; ctx.fillRect(cx-tile*.2, cy+tile*.18, tile*.4, tile*.1);
  } else if (it.merchant){
    ctx.shadowColor = '#e3b456'; ctx.shadowBlur = tile*.3;
    ctx.fillStyle = '#e3b456'; ctx.beginPath(); ctx.arc(cx, cy, tile*.2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#5a3a1e'; ctx.font = `700 ${tile*.24}px ${BF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', cx, cy+1);
  } else if (it.currency){
    const c = CURRENCY[it.currency].c; ctx.shadowColor = c; ctx.shadowBlur = tile*.35;
    ctx.fillStyle = '#1a1512'; ctx.strokeStyle = c; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, tile*.15, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, tile*.06, 0, Math.PI*2); ctx.fill();
  } else if (it.tideChest){
    ctx.shadowColor = '#ff4a3a'; ctx.shadowBlur = tile*.45;
    ctx.fillStyle = '#4a0f0a'; ctx.fillRect(cx-tile*.24, cy-tile*.14, tile*.48, tile*.3);
    ctx.fillStyle = '#ff4a3a'; ctx.fillRect(cx-tile*.24, cy-tile*.02, tile*.48, tile*.05); ctx.fillRect(cx-tile*.04, cy-tile*.08, tile*.08, tile*.12);
  } else if (it.frozen || it.frozenArmy){
    ctx.shadowColor = '#cfe6f5'; ctx.shadowBlur = tile*.45;
    const s = tile*.14;
    for (let j=0;j<3;j++) for (let i=0;i<3;i++){ ctx.fillStyle = (i+j)%2 ? '#6c7f93' : '#dfeaf5'; ctx.fillRect(cx-s*1.5+i*s, cy-s*1.5+j*s, s, s); }
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(223,234,245,.9)'; ctx.lineWidth = 1.5; ctx.strokeRect(cx-s*1.5, cy-s*1.5, s*3, s*3);
  } else if (it.riftGate){
    riftArcs(cx, cy, time);
  } else if (it.rune){
    ctx.shadowColor = '#c9a0ff'; ctx.shadowBlur = tile*.4;
    ctx.fillStyle = '#3a2758'; ctx.strokeStyle = '#c9a0ff'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let i=0;i<6;i++){ const a = Math.PI/6 + i*Math.PI/3; ctx.lineTo(cx+Math.cos(a)*tile*.2, cy+Math.sin(a)*tile*.2); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e6d6ff'; ctx.font = `700 ${tile*.18}px ${BF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ᚱ', cx, cy+1);
  } else if (it.mapItem){
    ctx.shadowColor = '#f08a3c'; ctx.shadowBlur = tile*.3;
    ctx.fillStyle = '#d8c39a'; ctx.fillRect(cx-tile*.2, cy-tile*.14, tile*.4, tile*.28);
    ctx.strokeStyle = '#7a5a2a'; ctx.lineWidth = 1.5; ctx.strokeRect(cx-tile*.2, cy-tile*.14, tile*.4, tile*.28);
  } else {
    const rar = it.relics ? 'legend' : it.item.rar, rc = RAR[rar].c;
    // loot beam: taller and brighter with rarity
    const bh = tile*({common:.45, magic:.9, rare:1.35, legend:2.1})[rar], bw = tile*(rar==='legend' ? .26 : .18);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const bg = ctx.createLinearGradient(0, cy, 0, cy-bh);
    const pulse = reduce ? .5 : .5 + .25*Math.sin(time*3 + it.x);
    bg.addColorStop(0, rc + (rar==='common' ? '55' : 'aa')); bg.addColorStop(1, rc + '00');
    ctx.globalAlpha = .55 + pulse*.45; ctx.fillStyle = bg; ctx.fillRect(cx-bw/2, cy-bh, bw, bh);
    if (rar==='legend' || rar==='rare'){ const gg = ctx.createRadialGradient(cx,cy,0,cx,cy,tile*.55); gg.addColorStop(0, rc+'66'); gg.addColorStop(1, rc+'00'); ctx.fillStyle = gg; ctx.fillRect(cx-tile*.55, cy-tile*.55, tile*1.1, tile*1.1); }
    ctx.restore();
    ctx.shadowColor = rc; ctx.shadowBlur = tile*(it.relics ? .7 : .35); ctx.fillStyle = rc;
    ctx.beginPath(); ctx.moveTo(cx,cy-r*1.3); ctx.lineTo(cx+r,cy); ctx.lineTo(cx,cy+r*1.3); ctx.lineTo(cx-r,cy); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// pointer position (client px) -> board square
function screenToTile(ex, ey){
  const rc = cv.getBoundingClientRect();
  return [Math.floor((ex-rc.left)/rc.width*W), Math.floor((ey-rc.top)/rc.height*H)];
}
const defer = (px, py, order, fn) => fn();
function lootBeam(it, time){
  const rar = it.relics ? 'legend' : it.item ? it.item.rar : null;
  const col = {magic:'138,164,255', rare:'236,211,106', legend:'240,138,60'}[rar]; if (!col) return;
  const [cx,cy] = sqCenter(it.x, it.y), h = tile*(rar==='legend' ? 1.9 : rar==='rare' ? 1.4 : 1), w = tile*.3, pul = reduce ? .7 : .7+.3*Math.sin(time*3+it.x);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, cy, 0, cy-h); g.addColorStop(0, `rgba(${col},${.5*pul})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(cx-w/2, cy-h, w, h); glow(cx, cy, tile*.45, `rgba(${col},${.35*pul})`); ctx.restore();
}
// the hero's build, made visible: element-colored glow and one orbiting spark per unique or pair of rules
function buildProfile(){
  const sig = Object.values(S.equip).map(i => i ? i.id : 0).join(',') + '|' + S.color + '|' + (HERO.tree||[]).length;
  if (buildProfile.sig===sig) return buildProfile.v;
  const st = stats(), items = Object.values(S.equip).filter(Boolean); let rules = 0, legends = 0, rares = 0;
  for (const it of items){ if (it.rar==='legend') legends++; else if (it.rar==='rare') rares++; for (const a of it.affixes) if (AFX[a.k] && AFX[a.k].rule) rules++; }
  const cols = [];
  if (st.fireDmg) cols.push('255,130,50'); if (st.coldDmg) cols.push('140,205,255'); if (st.lightDmg) cols.push('236,222,110');
  if (st.vamp > (S.color==='b' ? 1 : 0)) cols.push('210,60,60'); if (st.thorns) cols.push('130,210,120'); if (st.chain || st.regicide) cols.push('227,180,86');
  if (st.deathBurst) cols.push('180,70,210'); if (st.execute) cols.push('240,138,60'); if (!cols.length) cols.push('227,180,86');
  buildProfile.sig = sig; return (buildProfile.v = {cols, power: rules + legends*1.5 + rares*.5, orbs: Math.min(9, legends + Math.ceil(rules/2))});
}
function playerAura(x, y, time){
  const P = buildProfile(), cx = (x+.5)*tile, cy = (y+.5)*tile;
  if (P.power < 1 && !P.orbs) return;
  glow(cx, cy+tile*.05, tile*(.5 + Math.min(.55, P.power*.035)), `rgba(${P.cols[0]},${Math.min(.34, .1 + P.power*.012)})`);
  const n = P.orbs, t = reduce ? 0 : time;
  for (let i=0; i<n; i++){
    const a = t*1.6 + i*Math.PI*2/n, col = P.cols[i % P.cols.length];
    const ox = cx + Math.cos(a)*tile*.42, oy = cy + tile*.2 + Math.sin(a)*tile*.13;
    ctx.globalAlpha = Math.sin(a) < 0 ? .55 : 1;
    glow(ox, oy, tile*.12, `rgba(${col},.55)`); ctx.fillStyle = `rgb(${col})`; ctx.beginPath(); ctx.arc(ox, oy, tile*.035, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function draw(time){
  const size = tile*W;
  ctx = mainCtx;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle = '#120e0c'; ctx.fillRect(0,0,cv.width/dpr,cv.height/dpr);
  if (S && S.chess){ drawChess(time); return; }
  if (!S || !S.walls){ for (let y=0;y<8;y++) for (let x=0;x<8;x++){ ctx.fillStyle = (x+y)%2===0 ? '#2b241e' : '#1f1a16'; ctx.fillRect(x*cv.width/dpr/8, y*cv.height/dpr/8, cv.width/dpr/8, cv.height/dpr/8); } return; }
  if (fx.shake>0 && !reduce) ctx.translate((Math.random()-.5)*fx.shake, (Math.random()-.5)*fx.shake);
  ctx.drawImage(floorLayer(), 0, 0, W*tile, H*tile);
  for (const [k,t] of S.terrain){ const [x,y] = unkey(k); drawTerrain(x, y, t, time); }
  if (S.scorch) for (const k of S.scorch){ const [x,y] = unkey(k); drawScorch(x, y); }
  drawBiomeLight(time, size);
  if (S.rift) drawRift(time);
  if (S.tut && S.tut.target && S.phase==='player'){ const [tx,ty] = S.tut.target, [cx,cy] = sqCenter(tx,ty), r = tile*(.36 + (reduce?0:.05*Math.sin(time*5))); ctx.strokeStyle = '#e3b456'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke(); glow(cx, cy, tile*.7, 'rgba(227,180,86,.25)'); }
  if (S.tideRise) for (const [x,y] of S.tideRise){ const pul = reduce ? .5 : .5+.5*Math.sin(time*5); ctx.fillStyle = `rgba(160,20,10,${.15+.15*pul})`; ctx.fillRect(x*tile, y*tile, tile, tile); ctx.strokeStyle = `rgba(255,80,60,${.6+.3*pul})`; ctx.setLineDash([4,3]); ctx.lineWidth = 2; ctx.strokeRect(x*tile+3, y*tile+3, tile-6, tile-6); ctx.setLineDash([]); }
  if (S.tide){ ctx.fillStyle = `rgba(140,10,0,${reduce?.09:.07+.03*Math.sin(time*.9)})`; ctx.fillRect(0, 0, size, size); }
  for (const [k,t] of S.fire){ const [x,y] = unkey(k); drawFlames(x, y, time, false, t>1 ? 1 : .65); }
  for (const [k,t] of S.burn){ const [x,y] = unkey(k); drawFlames(x, y, time, true, t>1 ? 1 : .65); }
  if (S.tarFire) for (const [k,t] of S.tarFire){ const [x,y] = unkey(k); drawFlames(x, y, time, true, t>1 ? 1.15 : .75); }
  if (S.stairs) drawStairs(S.stairs.x, S.stairs.y, time);
  const fade = (x,y) => S.biome==='swamp' && S.enemies.length ? Math.max(.18, 1 - Math.max(0, sightDist(x,y)-sight())/1.6) : 1;
  const wr = S.wreck, inWreck = (x,y) => wr && x>=wr.x && x<wr.x+wr.w && y>=wr.y && y<wr.y+wr.h;
  if (wr) defer((wr.x + wr.w/2)*tile, (wr.y + wr.h - .5)*tile, wr.y + wr.h - .5, () => drawWreck(wr, time));
  for (const k of S.walls){ const [x,y] = unkey(k); if (inWreck(x,y)) continue; const env = !!(S.env && S.env.wall[0]===x && S.env.wall[1]===y); defer((x+.5)*tile, (y+.5)*tile, y+.5, () => { ctx.globalAlpha = fade(x,y); drawWall(x, y, env, time); ctx.globalAlpha = 1; }); }
  // torchlight, tinted per biome
  {
    const L = LOOK[S.biome] || LOOK.crypt, p = S.player, [cx,cy] = sqCenter(p.rx, p.ry);
    const flick = reduce ? 0 : Math.sin(time*7)*.05 + Math.sin(time*13.3)*.03;
    const g = ctx.createRadialGradient(cx,cy,tile*1.1,cx,cy,tile*Math.max(2.5, W*L.reach+flick*5));
    g.addColorStop(0,`rgba(${L.dark},0)`); g.addColorStop(1,`rgba(${L.dark},${L.dim})`);
    ctx.fillStyle = g; ctx.fillRect(0,0,size,size);
    glow(cx, cy, tile*1.7, `rgba(255,170,90,${.07+flick*.3})`);
  }
  for (const c of (S.corpses||[])) defer((c.x+.5)*tile, (c.y+.5)*tile, c.y+.4, () => { glow((c.x+.5)*tile, (c.y+.6)*tile, tile*.5, 'rgba(176,72,200,.28)'); ctx.globalAlpha = .45; drawPiece(c.type, c.x, c.y, 'w', {spectral:true}); ctx.globalAlpha = 1; });
  for (const it of S.items) defer((it.x+.5)*tile, (it.y+.5)*tile, it.y+.5, () => { ctx.globalAlpha = fade(it.x,it.y); lootBeam(it, time); drawSpecial(it, time); ctx.globalAlpha = 1; });
  if (S.biome==='swamp' && S.enemies.length) drawSwampFog(time, size);
  if (S.phase!=='over'){
    if (S.threatNext && S.phase==='player'){
      ctx.setLineDash([3,4]); ctx.strokeStyle = 'rgba(226,120,90,.38)'; ctx.lineWidth = 1;
      for (const k of S.threatNext){ if (S.dangerSeen.has(k)) continue; const [x,y] = unkey(k); ctx.strokeRect(x*tile+5, y*tile+5, tile-10, tile-10); }
      ctx.setLineDash([]);
    }
    for (const k of S.dangerSeen){
      const [x,y] = unkey(k);
      const env = S.env && S.env.sq.some(([a,b])=>a===x&&b===y), stm = S.storm && (S.storm.sq.some(([a,b])=>a===x&&b===y) || S.storm.chain.some(([a,b])=>a===x&&b===y));
      ctx.fillStyle = stm ? 'rgba(70,130,255,.26)' : env ? 'rgba(230,120,40,.3)' : 'rgba(184,51,43,.3)'; ctx.fillRect(x*tile, y*tile, tile, tile);
      ctx.strokeStyle = stm ? 'rgba(140,190,255,.85)' : env ? 'rgba(240,140,60,.8)' : 'rgba(226,78,60,.75)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(x*tile+2, y*tile+2, tile-4, tile-4);
    }
    if (S.clock) for (const [x,y] of S.clock.sq) drawClockMark(x, y, S.clock.kind, time);
    if (S.storm) for (const [x,y] of S.storm.sq) drawClockMark(x, y, 'storm', time);
    if (S.vents) for (const V of S.vents) for (const [x,y] of V.sq) drawClockMark(x, y, V.fire ? 'lava' : 'tar', time);
    if (S.wind) drawWind(time);
    if (S.grow) for (const [x,y] of S.grow.sq) drawClockMark(x, y, 'grow', time);
    for (const e of S.enemies) if (e.intent && e.intent.mark && intentVisible(e)){
      const [cx,cy] = sqCenter(e.intent.mark[0], e.intent.mark[1]), r = tile*(.34 + (reduce?0:.03*Math.sin(time*6)));
      ctx.strokeStyle = 'rgba(255,90,70,.95)'; ctx.lineWidth = Math.max(2, tile*.035);
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); for (const [dx,dy] of ORTH){ ctx.moveTo(cx+dx*r*.6, cy+dy*r*.6); ctx.lineTo(cx+dx*r*1.25, cy+dy*r*1.25); } ctx.stroke();
    }
    if (S.rise){
      const [x,y] = S.rise;
      ctx.strokeStyle = 'rgba(170,235,150,.85)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
      ctx.strokeRect(x*tile+3, y*tile+3, tile-6, tile-6); ctx.setLineDash([]);
    }
  }
  for (const f of fx.flashes) for (const [x,y] of f.sq){ ctx.fillStyle = `rgba(255,120,80,${f.t*.55})`; ctx.fillRect(x*tile, y*tile, tile, tile); }
  if (S.phase==='player' || S.phase==='modal' || S.phase==='allies') for (const e of S.enemies){
    const it = e.intent; if (!it || !intentVisible(e)) continue;
    if (it.kind==='move'){
      const [ax,ay] = sqCenter(e.rx,e.ry), [bx,by] = sqCenter(it.to[0],it.to[1]);
      ctx.strokeStyle = 'rgba(168,155,135,.65)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(bx,by,tile*.11,0,Math.PI*2); ctx.stroke();
    } else if (it.kind==='summon'){
      for (const [x,y] of it.to){
        const [bx,by] = sqCenter(x,y), s = tile*.16;
        ctx.strokeStyle = 'rgba(226,78,60,.85)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx-s,by); ctx.lineTo(bx+s,by); ctx.moveTo(bx,by-s); ctx.lineTo(bx,by+s); ctx.stroke();
      }
    }
  }
  if (S.phase==='player'){
    const skillMode = S.mode!=='move';
    const list = skillMode ? SKILLS[S.mode].targets().map(([x,y])=>({x,y,kind:'move'})) : playerTargets();
    const roam = !skillMode && freeRoam();   // floor clear: every square is walkable, so no dot on each one (the hovered square is still outlined)
    for (const t of list){
      const fin = t.slide || [t.x,t.y], [cx,cy] = sqCenter(t.x,t.y), danger = S.dangerSeen.has(key(fin[0],fin[1])) || isLava(fin[0],fin[1]);
      const isHover = hover && hover[0]===t.x && hover[1]===t.y;
      if (t.slide && !roam){
        const [ex,ey] = sqCenter(fin[0],fin[1]), an = Math.atan2(ey-cy, ex-cx), hd = tile*.13;
        ctx.strokeStyle = `rgba(207,230,245,${isHover?.9:.35})`; ctx.lineWidth = isHover ? 2 : 1.2; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(ex,ey); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(ex-Math.cos(an-.5)*hd, ey-Math.sin(an-.5)*hd);
        ctx.moveTo(ex,ey); ctx.lineTo(ex-Math.cos(an+.5)*hd, ey-Math.sin(an+.5)*hd); ctx.stroke();
      }
      if (t.kind==='attack' && !inSight(t.x,t.y)){ /* hidden in fog */ }
      else if (t.kind==='attack'){
        const s=tile*.42, l=tile*.16;
        ctx.strokeStyle = isHover ? '#ffb27a' : '#e07a32'; ctx.lineWidth = Math.max(2, tile*.04);
        ctx.beginPath();
        for (const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ ctx.moveTo(cx+sx*s, cy+sy*(s-l)); ctx.lineTo(cx+sx*s, cy+sy*s); ctx.lineTo(cx+sx*(s-l), cy+sy*s); }
        ctx.stroke();
      } else if (t.kind==='swap'){
        ctx.strokeStyle = isHover ? '#ffe2a0' : 'rgba(227,180,86,.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.arc(cx,cy,tile*.4,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      } else if (!roam){
        if (skillMode){ ctx.strokeStyle='rgba(224,122,50,.7)'; ctx.lineWidth=1.5; ctx.strokeRect(t.x*tile+4,t.y*tile+4,tile-8,tile-8); }
        ctx.fillStyle = danger ? '#d0473a' : skillMode ? '#e07a32' : '#e3b456';
        ctx.globalAlpha = isHover ? 1 : .8;
        ctx.beginPath(); ctx.arc(cx,cy,tile*(isHover?.12:.085),0,Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (isHover){
        ctx.strokeStyle = 'rgba(231,220,198,.8)'; ctx.lineWidth = 1.5;
        ctx.strokeRect(t.x*tile+1.5, t.y*tile+1.5, tile-3, tile-3);
        if (S.mode==='quake') for (const [dx,dy] of ALL){
          const nx=t.x+dx, ny=t.y+dy; if (!inb(nx,ny)) continue;
          ctx.fillStyle = 'rgba(224,122,50,.22)'; ctx.fillRect(nx*tile, ny*tile, tile, tile);
        }
      }
    }
  }
  const foe = S.color==='w' ? 'b' : 'w';
  const units = [...S.enemies.map(u=>({u,k:'e'})), ...S.allies.map(u=>({u,k:'a'}))].sort((a,b)=>a.u.ry-b.u.ry);
  const showWarn = S.phase!=='enemy' && S.phase!=='over';
  const drawUnit = ({u,k}, x, y) => {
    if (k==='e'){
      const vis = intentVisible(u);
      if (!vis){
        const ghost = Math.max(0, 1 - (sightDist(u.x,u.y)-sight())/1.1) * .22;
        if (ghost>.02){ ctx.globalAlpha = ghost; drawPiece(u.type, x, y, foe, {}); ctx.globalAlpha = 1; }
        return;
      }
      const attacking = u.intent && u.intent.kind==='attack' && S.phase!=='enemy';
      drawPiece(u.type, x, y, foe, {boss:u.boss, horde:u.horde, holy:u.side==='holy', elite:u.elite, fodder:u.fodder, rift:u.rift, herald:u.herald, rival:u.rival, frozen:u.frozenPiece && S.timeStop>0, attacking, flash:u.flash>0});
      hpBar(u, x, y, u.boss ? '#e04a3a' : u.elite ? '#e3b456' : '#c2402f', attackPreview(u), time);
      if (u.role==='protector'){
        for (const [dx,dy] of ALL){ const o = S.enemies.find(q => q.x===u.x+dx && q.y===u.y+dy && !q.boss); if (!o) continue;
          ctx.strokeStyle = 'rgba(150,190,240,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo((x+.5)*tile, (y+.5)*tile); ctx.lineTo((o.rx+o.lx+.5)*tile, (o.ry+o.ly+.5)*tile); ctx.stroke(); }
        const sx = (x+.16)*tile, sy = y*tile+tile*.12, ss = tile*.09;
        ctx.fillStyle = '#a9bfd6'; ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(sx-ss, sy-ss); ctx.lineTo(sx+ss, sy-ss); ctx.lineTo(sx+ss, sy+ss*.2); ctx.lineTo(sx, sy+ss*1.2); ctx.lineTo(sx-ss, sy+ss*.2); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      if (u.marked && !u.frozenPiece){ const mx = (x+.82)*tile, my = y*tile+tile*.16, ms = tile*.08; ctx.fillStyle = '#e3b456'; ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mx, my-ms); ctx.lineTo(mx+ms, my); ctx.lineTo(mx, my+ms); ctx.lineTo(mx-ms, my); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      if (u===S.linked){ ctx.strokeStyle = 'rgba(240,160,80,.95)'; ctx.setLineDash([4,3]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc((x+.5)*tile, (y+.5)*tile, tile*.47, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]); }
      if (u.judged){ ctx.strokeStyle = 'rgba(240,214,140,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc((x+.5)*tile, (y+.5)*tile, tile*.44, 0, Math.PI*2); ctx.stroke(); }
      if (u.intent && u.intent.stunned) drawSleep(x, y, time);
    } else {
      drawPiece(u.type, x, y, S.color, {ally:true, spectral:u.spectral, flash:u.flash>0});
      hpBar(u, x, y, '#7fb069');
    }
    if (showWarn && S.dangerSeen.has(key(u.x,u.y))) warnMark(x, y);
  };
  for (const e of units){
    const u = e.u, x = u.rx+u.lx, y = u.ry+u.ly;
    defer((x+.5)*tile, (y+.5)*tile, y+.5, () => drawUnit(e, x, y));
    if (e.k==='e' && (u.mods||[]).length && intentVisible(u)) defer((x+.5)*tile, (y+.5)*tile, 99+y, () => modBadges(u, x, y));   // icons last: no piece covers them
  }
  // Fallen King, checkmate phase: his escape squares, marked in gold
  if (S.kingEscapes && S.phase!=='enemy') for (const [x,y] of S.kingEscapes){
    const cx = (x+.5)*tile, cy = (y+.5)*tile, r = tile*.16;
    ctx.strokeStyle = 'rgba(236,211,106,.9)'; ctx.lineWidth = 2; ctx.setLineDash([3,3]);
    ctx.strokeRect(x*tile+tile*.12, y*tile+tile*.12, tile*.76, tile*.76); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(cx-r, cy); ctx.lineTo(cx+r, cy); ctx.moveTo(cx, cy-r); ctx.lineTo(cx, cy+r); ctx.stroke();
  }
  if (!S.dead){ const px = S.player.rx+S.player.lx, py = S.player.ry+S.player.ly;
    defer((px+.5)*tile, (py+.5)*tile, py+.5, () => { playerAura(px, py, time); drawPiece(S.cls, px, py, S.color, {player:true, prop: skinId(), propColor: skinId()==="arcane" ? scepterColor() : null}); }); }
  // interactive events: a bouncing marker says "step here"
  for (const it of S.items) if (it.frozen || it.riftGate || it.tideChest) stepMarker(it.x, it.y, it.frozen ? '207,230,245' : it.riftGate ? '200,170,255' : '255,110,90', time);
  if (S.stairs && !S.enemies.length && !S.tut && !isPlayer(S.stairs.x, S.stairs.y)) stairsArrow(S.stairs.x, S.stairs.y, time);
  // training: a gold arrow points at the thing the current step is about
  if (S.tut && S.phase==='player'){
    const st = S.tut.step, pts = st===0 && S.tut.target ? [S.tut.target] : st===5 && S.stairs ? [[S.stairs.x,S.stairs.y]] : [1,3,4].includes(st) ? S.enemies.map(e => [e.x,e.y]) : [];
    for (const [x,y] of pts){
      const cx = (x+.5)*tile, top = y*tile + tile*.04 + (reduce ? 0 : Math.sin(time*4)*tile*.06);
      ctx.fillStyle = '#e3b456'; ctx.strokeStyle = 'rgba(10,6,4,.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - tile*.14, top - tile*.16); ctx.lineTo(cx + tile*.14, top - tile*.16); ctx.lineTo(cx, top); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  drawAmb(time);
  if (S.tide && !reduce) for (const d of fx.rain || []){ ctx.strokeStyle = `rgba(200,30,20,${.55*Math.min(1,d.life)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(d.x*tile, d.y*tile); ctx.lineTo((d.x-.04)*tile, (d.y-.28)*tile); ctx.stroke(); }
  for (const b of fx.beams){
    const [ax,ay] = sqCenter(b.x1,b.y1), [bx,by] = sqCenter(b.x2,b.y2), a = Math.max(0, 1-b.t*3);
    if (b.orb){   // arcane bolt: a glowing orb that flies to the target, trailing sparks, with a violet halo around the element's core
      const p = Math.min(1, b.t/.2), fade = b.t<.2 ? 1 : Math.max(0, 1-(b.t-.2)/.15), r = tile*.16;
      for (let i=0;i<6;i++){
        const q = Math.max(0, p - i*.07), qx = ax+(bx-ax)*q, qy = ay+(by-ay)*q - Math.sin(q*Math.PI)*tile*.25;
        ctx.fillStyle = `rgba(${b.c},${fade*(.5-i*.07)})`; ctx.beginPath(); ctx.arc(qx, qy, r*(1-i*.12), 0, Math.PI*2); ctx.fill();
      }
      const ox = ax+(bx-ax)*p, oy = ay+(by-ay)*p - Math.sin(p*Math.PI)*tile*.25;
      const g = ctx.createRadialGradient(ox,oy,0,ox,oy,r*2.2); g.addColorStop(0,`rgba(255,255,255,${fade})`); g.addColorStop(.35,`rgba(${b.c},${fade*.9})`); g.addColorStop(1,'rgba(150,80,230,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, r*2.2, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = `rgba(190,130,255,${fade*.8})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ox, oy, r*1.5, b.t*14, b.t*14 + Math.PI*1.4); ctx.stroke();
      continue;
    }
    ctx.strokeStyle = `rgba(${b.c},${a})`; ctx.lineWidth = Math.max(2, tile*.06);
    ctx.beginPath(); ctx.moveTo(ax,ay);
    if (b.zig){   // lightning: a jagged arc that re-forks every frame
      const n = 7, nx = -(by-ay), ny = bx-ax, len = Math.hypot(nx,ny) || 1;
      for (let i=1;i<n;i++){ const j = (Math.random()-.5)*tile*.35; ctx.lineTo(ax+(bx-ax)*i/n + nx/len*j, ay+(by-ay)*i/n + ny/len*j); }
    }
    ctx.lineTo(bx,by); ctx.stroke();
    if (b.zig){ ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1; ctx.stroke(); }
  }
  drawVfx();
  for (const r of fx.rings){
    const [cx,cy] = sqCenter(r.x,r.y);
    ctx.strokeStyle = `rgba(${r.c||'224,122,50'},${Math.max(0,1-r.t*2)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx,cy,tile*(.3+r.t*2.6),0,Math.PI*2); ctx.stroke();
  }
  for (const m of fx.embers){ ctx.fillStyle = `rgba(${m.c},${Math.max(0,m.life)})`; ctx.fillRect(m.x*tile, m.y*tile, Math.max(2,tile*.04), Math.max(2,tile*.04)); }
  for (const p of fx.parts){
    ctx.globalAlpha = Math.max(0, p.life/p.max); ctx.fillStyle = p.color;
    const s = Math.max(2, tile*.05); ctx.fillRect(p.x*tile-s/2, p.y*tile-s/2, s, s);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const placed = [];
  for (const f of fx.floats){
    if (f.t < 0) continue;
    const a = f.t < 1.2 ? 1 : Math.max(0, 1-(f.t-1.2)/.6);
    const big = (f.scale||1) >= 1.5, sp = floatSprite(f.text, f.color, big);
    // it arrives big, settles with a small bounce, drifts up and sideways and fades
    const pop = f.t < .16 ? 1 + .9*Math.pow(1 - f.t/.16, 2) + .1*Math.sin(f.t*40) : 1, sc = (f.scale||1)*pop*(big ? .86 : 1);
    if (f.rot === undefined) f.rot = (Math.random()-.5)*.28;
    const hw = sp.w*sc/2, hh2 = sp.h*sc/2, ft = Math.min(f.t, 1.2)/1.2;
    const xx = Math.min(size - hw, Math.max(hw, f.x*tile + Math.sin(f.t*6 + f.rot*9)*tile*.03)), y0 = Math.min(size - hh2, Math.max(hh2, (f.y - (1 - Math.pow(1 - ft, 2))*.55)*tile));
    const [fx2, yy] = floatOffset(f, xx, y0, sp.w*sc, sp.h*sc*.7, placed, size);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(fx2, yy); ctx.rotate(f.rot*(1 - Math.min(1, f.t/.3))); ctx.scale(sc, sc);
    ctx.drawImage(sp.cv, -sp.w/2, -sp.h/2, sp.w, sp.h); ctx.restore();
  }
  ctx.globalAlpha = 1;
  drawChain();
}
function updateFx(dt){
  if (S && S.chainShow){ S.chainShow.t += dt; if (S.chainShow.t > 2.2) S.chainShow = null; }
  if (fx.hitstop>0){ fx.hitstop -= dt; return; }   // a short freeze on heavy hits
  if (S && S.player){
    const k = Math.min(1, dt*14), dec = Math.max(0, 1-dt*10);
    for (const o of [S.player, ...(S.enemies||[]), ...(S.allies||[])]){ o.rx += (o.x-o.rx)*k; o.ry += (o.y-o.ry)*k; o.lx *= dec; o.ly *= dec; if (o.flash>0) o.flash -= dt; }
  }
  for (const p of fx.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=dt*3; p.life-=dt; }
  fx.parts = fx.parts.filter(p => p.life>0);
  for (const m of fx.embers){ m.y += m.vy*dt; m.life -= dt*.9; }
  fx.embers = fx.embers.filter(m => m.life>0).slice(-120);
  for (const f of fx.floats) f.t += dt; fx.floats = fx.floats.filter(f => f.t<1.8);
  for (const f of fx.flashes) f.t -= dt*2.2; fx.flashes = fx.flashes.filter(f => f.t>0);
  for (const r of fx.rings) r.t += dt; fx.rings = fx.rings.filter(r => r.t<.5);
  vfxTick(dt);
  for (const b of fx.beams) b.t += dt; fx.beams = fx.beams.filter(b => b.t<.35);
  fx.shake = Math.max(0, fx.shake-dt*40);
  updateAmb(dt);
  if (S && S.tide && !reduce){
    fx.rain = (fx.rain || []).filter(d => (d.y += dt*6, d.x -= dt*.8, d.life -= dt, d.life>0 && d.y < H+.5));
    while (fx.rain.length < 22) fx.rain.push({x: Math.random()*(W+2), y: -Math.random()*2, life: 1.5 + Math.random()});
  } else fx.rain = [];
}
