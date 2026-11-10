/* Rei Caído — canvas rendering and effects */

const cv = $('cv'), ctx = cv.getContext('2d');
let tile = 60, dpr = 1, hover = null;
const fx = {parts:[], floats:[], flashes:[], rings:[], beams:[], embers:[], amb:[], shake:0};

function burst(x,y,color,n){
  if (reduce) n = Math.ceil(n/4);
  for (let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2, s = 1+Math.random()*2.5;
    fx.parts.push({x:x+.5, y:y+.5, vx:Math.cos(a)*s, vy:Math.sin(a)*s-1, life:.35+Math.random()*.45, max:.8, color});
  }
}
function floatText(x,y,text,color){ fx.floats.push({x:x+.5+(Math.random()-.5)*.3, y:y+.25, text, color, t:0}); }

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

function drawPiece(type, x, y, side, o){
  const cx=(x+.5)*tile, cy=(y+.5)*tile, time = performance.now()/1000;
  let sz = tile*(o.boss ? 1.15 : o.ally || o.fodder ? 0.58 : 0.72);
  // big pieces on the top row would poke out of the board: measure the glyph and,
  // instead of pushing it down onto its health bar, drop the lift and shrink it to fit
  ctx.font = `${sz}px ${GF}`; ctx.textBaseline = 'middle';
  const asc = (ctx.measureText(GLYPH[type]) || {}).actualBoundingBoxAscent || sz*.62;
  const room = cy - tile*.04 - 3;
  const lift = Math.max(0, Math.min(o.boss ? tile*.12 : 0, room - asc));
  if (asc > room) sz = Math.min(sz, Math.max(sz*room/asc, tile*.88));
  if (o.boss){
    const pulse = reduce ? .5 : .5+.2*Math.sin(time*3);
    const col = o.holy ? `rgba(240,214,140,${pulse})` : `rgba(200,40,30,${pulse})`;
    const g = ctx.createRadialGradient(cx,cy+tile*.2,0,cx,cy+tile*.2,tile*1.15);
    g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(cx-tile*1.2, cy-tile*1.1, tile*2.4, tile*2.4);
    ctx.strokeStyle = o.holy ? 'rgba(240,214,140,.8)' : 'rgba(227,180,86,.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy+tile*.32, tile*.46, tile*.14, 0, 0, Math.PI*2); ctx.stroke();
  } else if (o.player || o.elite || o.rift || o.spectral){
    const g = ctx.createRadialGradient(cx,cy+tile*.15,0,cx,cy+tile*.15,tile*.6);
    g.addColorStop(0, o.player ? 'rgba(224,122,50,.42)' : o.rift ? 'rgba(180,140,255,.45)' : o.spectral ? 'rgba(170,205,240,.35)' : 'rgba(227,180,86,.42)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(cx-tile*.6, cy-tile*.45, tile*1.2, tile*1.2);
  }
  if (o.attacking){
    ctx.strokeStyle = 'rgba(226,78,60,.95)'; ctx.lineWidth = Math.max(1.5,tile*.035);
    ctx.beginPath(); ctx.ellipse(cx, cy+tile*.3, tile*(o.boss?.5:.32), tile*(o.boss?.15:.1), 0, 0, Math.PI*2); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,.5)';
  ctx.beginPath(); ctx.ellipse(cx, cy+tile*.3, tile*(o.boss?.4:.26), tile*(o.boss?.12:.08), 0, 0, Math.PI*2); ctx.fill();
  if (o.ally){
    ctx.strokeStyle = 'rgba(227,180,86,.85)'; ctx.lineWidth = Math.max(1.5,tile*.03);
    ctx.beginPath(); ctx.ellipse(cx, cy+tile*.3, tile*.26, tile*.08, 0, 0, Math.PI*2); ctx.stroke();
  }
  ctx.font = `${sz}px ${GF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, tile*(o.boss?.06:.035));
  let fill, stroke;
  if (o.boss){ fill = o.holy ? '#efe3bf' : '#7d1414'; stroke = o.holy ? '#8a6a1f' : '#e3b456'; }
  else if (o.frozen){ fill = side==='w' ? '#eef6fc' : '#3a5068'; stroke = '#cfe6f5'; }
  else { const white = side==='w'; fill = o.spectral ? '#dbe8f5' : white ? '#f1e7d3' : '#1b1411'; stroke = o.herald ? '#ff4a3a' : o.rival ? '#8fd18a' : o.rift ? '#b48cff' : o.elite ? '#e3b456' : o.spectral ? '#5a7a9e' : white ? '#2a1f18' : '#cdbb9c'; }
  ctx.strokeStyle = stroke; ctx.strokeText(GLYPH[type], cx, cy-lift);
  ctx.fillStyle = fill; ctx.fillText(GLYPH[type], cx, cy-lift);
  if (o.boss && !reduce && Math.random()<.35){
    fx.embers.push({x:x+.2+Math.random()*.6, y:y+.7, vy:-(.6+Math.random()*.8), life:1, c:o.holy ? '240,214,140' : '240,110,50'});
  }
}
function hpBar(u, x, y, color, preview, time){
  const w = tile*(u.boss?.9:.56), h = Math.max(3, tile*(u.boss?.08:.055));
  const bx = (x+.5)*tile - w/2, by = (y+1)*tile - h - tile*.04;
  const fill = w*Math.max(0,u.hp)/u.maxHp;
  ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(bx-1, by-1, w+2, h+2);
  ctx.fillStyle = color; ctx.fillRect(bx, by, fill, h);
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
  swamp:    {a:'#323d2b', b:'#222b1e', dark:'4,10,7', dim:.66, reach:.62},
  forge:    {a:'#382821', b:'#241914', dark:'16,3,0', dim:.6,  reach:.72},
  cathedral:{a:'#5b6573', b:'#2c333e', dark:'6,10,22',dim:.42, reach:.95}
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
    if (b==='crypt'){
      if (r(2)<.5){ c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=1; crackPath(c,px,py,i=>r(20+i),3); c.stroke(); }
      if (r(13)<.12) blot(c, px+T*r(14), py+T*r(15), T*.35, '70,14,8', .4);
      if (r(12)<.14){
        const bx=px+T*(.25+r(16)*.5), by=py+T*(.25+r(17)*.5), a=r(18)*Math.PI, l=T*.11;
        c.strokeStyle='rgba(196,182,156,.55)'; c.lineWidth=Math.max(1.5,T*.035); c.lineCap='round';
        c.beginPath(); c.moveTo(bx-Math.cos(a)*l,by-Math.sin(a)*l); c.lineTo(bx+Math.cos(a)*l,by+Math.sin(a)*l); c.stroke();
        c.fillStyle='rgba(196,182,156,.55)';
        for (const s of [-1,1]){ c.beginPath(); c.arc(bx+s*Math.cos(a)*l, by+s*Math.sin(a)*l, T*.03, 0, Math.PI*2); c.fill(); }
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
      if (r(2)<.45) blot(c, px+T*r(3), py+T*r(4), T*.4, '0,0,0', .45);
      if (r(5)<.4){
        c.shadowColor='rgba(255,110,30,.9)'; c.shadowBlur=T*.12;
        c.strokeStyle='rgba(255,110,40,.6)'; c.lineWidth=Math.max(1.2,T*.025); crackPath(c,px,py,i=>r(50+i),4); c.stroke();
        c.shadowBlur=0; c.strokeStyle='rgba(255,220,140,.5)'; c.lineWidth=.8; crackPath(c,px,py,i=>r(50+i),4); c.stroke();
      }
      if (light){ c.fillStyle='rgba(0,0,0,.45)'; for (const [ax,ay] of [[.1,.1],[.9,.1],[.1,.9],[.9,.9]]){ c.beginPath(); c.arc(px+T*ax,py+T*ay,T*.025,0,Math.PI*2); c.fill(); } }
      if (r(8)<.07){
        const g=c.createRadialGradient(px+T/2,py+T/2,0,px+T/2,py+T/2,T*.35); g.addColorStop(0,'rgba(255,120,30,.55)'); g.addColorStop(1,'rgba(120,20,0,.2)');
        c.fillStyle=g; c.fillRect(px+T*.2,py+T*.2,T*.6,T*.6);
        c.strokeStyle='#120a08'; c.lineWidth=T*.04; c.strokeRect(px+T*.2,py+T*.2,T*.6,T*.6);
        c.beginPath(); for (let k=1;k<4;k++){ c.moveTo(px+T*(.2+k*.15),py+T*.2); c.lineTo(px+T*(.2+k*.15),py+T*.8); } c.stroke();
      }
    } else if (b==='cathedral'){
      c.strokeStyle = light ? 'rgba(255,255,255,.16)' : 'rgba(150,175,210,.12)'; c.lineWidth=1;
      for (let k=0;k<2;k++){ c.beginPath(); c.moveTo(px, py+T*r(2+k)); c.bezierCurveTo(px+T*.3,py+T*r(4+k),px+T*.7,py+T*r(6+k),px+T,py+T*r(8+k)); c.stroke(); }
      if (r(10)<.5) blot(c, px+(r(11)<.5?0:T), py+(r(12)<.5?0:T), T*.65, '225,240,255', .3);
      if (light){ c.strokeStyle='rgba(227,200,140,.13)'; c.lineWidth=1; c.strokeRect(px+T*.1,py+T*.1,T*.8,T*.8); }
    }
    c.fillStyle='rgba(255,235,210,.07)'; c.fillRect(px,py,T,1.5); c.fillRect(px,py,1.5,T);
    c.fillStyle='rgba(0,0,0,.4)'; c.fillRect(px,py+T-1.5,T,1.5); c.fillRect(px+T-1.5,py,1.5,T);
    c.restore();
  }
  const g = c.createRadialGradient(W*T/2,H*T/2,W*T*.3,W*T/2,H*T/2,W*T*.75);
  g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.4)'); c.fillStyle=g; c.fillRect(0,0,W*T,H*T);
}
function glow(cx, cy, r, color){
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,color); g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g; ctx.fillRect(cx-r,cy-r,r*2,r*2); ctx.restore();
}
function drawWall(x, y, env, time){
  const T = tile, b = S.biome, r = i => hh(x,y,40+i);
  const px = x*T + (env && !reduce ? (Math.random()-.5)*T*.05 : 0), py = y*T;
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
function drawTerrain(x, y, t, time){
  const px=x*tile, py=y*tile, T=tile;
  if (t==='pit'){
    ctx.fillStyle='#6a5a4a'; ctx.fillRect(px+T*.03, py+T*.03, T*.94, T*.94);
    ctx.fillStyle='#030202'; ctx.fillRect(px+T*.08, py+T*.08, T*.84, T*.84);
    for (let i=1;i<4;i++){ const ins=T*(.08+i*.07); ctx.strokeStyle=`rgba(60,48,38,${.35-i*.08})`; ctx.lineWidth=1; ctx.strokeRect(px+ins,py+ins,T-ins*2,T-ins*2); }
    const g=ctx.createLinearGradient(0,py+T*.08,0,py+T*.4); g.addColorStop(0,'rgba(0,0,0,.9)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(px+T*.08, py+T*.08, T*.84, T*.32);
    if (S.biome==='crypt') glow(px+T/2, py+T*.55, T*.3, `rgba(120,160,110,${reduce?.08:.06+.04*Math.sin(time*1.5+x)})`);
  } else if (t==='water'){
    const g=ctx.createLinearGradient(px,py,px,py+T); g.addColorStop(0,'#21403b'); g.addColorStop(1,'#163029');
    ctx.fillStyle=g; ctx.fillRect(px,py,T,T);
    for (let k=0;k<3;k++){
      const ph = ((reduce?0:time*.35)+hh(x,y,60+k))%1, a=.22*(1-Math.abs(ph-.5)*2);
      ctx.strokeStyle=`rgba(175,220,205,${a})`; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(px+T*(.1+.55*ph), py+T*(.22+.28*k)); ctx.lineTo(px+T*(.28+.55*ph), py+T*(.22+.28*k)); ctx.stroke();
    }
    const ph = ((reduce?.3:time*.45)+hh(x,y,70))%1;
    ctx.strokeStyle=`rgba(190,230,215,${.35*(1-ph)})`; ctx.lineWidth=1;
    ctx.beginPath(); ctx.ellipse(px+T*(.3+hh(x,y,71)*.4), py+T*(.3+hh(x,y,72)*.4), T*(.06+.28*ph), T*(.03+.13*ph), 0, 0, Math.PI*2); ctx.stroke();
    if (hh(x,y,73)<.3){
      const lx=px+T*(.25+hh(x,y,74)*.5), ly=py+T*(.25+hh(x,y,75)*.5), a0=hh(x,y,76)*6;
      ctx.fillStyle='#3e6a35'; ctx.beginPath(); ctx.moveTo(lx,ly); ctx.arc(lx,ly,T*.1,a0+.35,a0+Math.PI*2-.35); ctx.closePath(); ctx.fill();
      if (hh(x,y,77)<.4){ ctx.fillStyle='#d9a0b8'; ctx.beginPath(); ctx.arc(lx+T*.03,ly-T*.02,T*.03,0,Math.PI*2); ctx.fill(); }
    }
    ctx.fillStyle='rgba(42,33,20,.85)';
    if (!isWater(x,y-1)) ctx.fillRect(px,py,T,T*.06);
    if (!isWater(x,y+1)) ctx.fillRect(px,py+T*.94,T,T*.06);
    if (!isWater(x-1,y)) ctx.fillRect(px,py,T*.06,T);
    if (!isWater(x+1,y)) ctx.fillRect(px+T*.94,py,T*.06,T);
  } else if (t==='lava'){
    ctx.fillStyle='#5c1307'; ctx.fillRect(px,py,T,T);
    ctx.save(); ctx.beginPath(); ctx.rect(px,py,T,T); ctx.clip(); ctx.globalCompositeOperation='lighter';
    const tt = reduce ? 0 : time;
    for (let k=0;k<3;k++){
      const cx = px+T*(.2+.6*hh(x,y,80+k)) + Math.sin(tt*.7+k*2+x)*T*.1, cy = py+T*(.2+.6*hh(x,y,83+k)) + Math.cos(tt*.6+k+y)*T*.1;
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,T*.42); g.addColorStop(0,'rgba(255,210,90,.7)'); g.addColorStop(.5,'rgba(255,100,20,.35)'); g.addColorStop(1,'rgba(255,60,10,0)');
      ctx.fillStyle=g; ctx.fillRect(px,py,T,T);
    }
    ctx.restore();
    ctx.fillStyle='rgba(35,10,4,.65)';
    for (let k=0;k<2;k++){ const cx=px+T*(.15+hh(x,y,90+k)*.6)+Math.sin(tt*.3+k)*T*.04, cy=py+T*(.15+hh(x,y,92+k)*.6); ctx.beginPath(); ctx.ellipse(cx,cy,T*.09,T*.05,hh(x,y,94+k)*3,0,Math.PI*2); ctx.fill(); }
    ctx.fillStyle='#2a0b04';
    if (!isLava(x,y-1)) ctx.fillRect(px,py,T,T*.05);
    if (!isLava(x,y+1)) ctx.fillRect(px,py+T*.95,T,T*.05);
    if (!isLava(x-1,y)) ctx.fillRect(px,py,T*.05,T);
    if (!isLava(x+1,y)) ctx.fillRect(px+T*.95,py,T*.05,T);
    glow(px+T/2, py+T/2, T*1.05, `rgba(255,90,20,${reduce?.14:.12+.04*Math.sin(time*2.5+x+y)})`);
  } else if (t==='ice'){
    const g=ctx.createLinearGradient(px,py,px+T,py+T); g.addColorStop(0,'rgba(170,225,250,.62)'); g.addColorStop(1,'rgba(90,160,210,.5)');
    ctx.fillStyle=g; ctx.fillRect(px,py,T,T);
    ctx.strokeStyle='rgba(225,248,255,.75)'; ctx.lineWidth=2; ctx.strokeRect(px+2,py+2,T-4,T-4);
    ctx.strokeStyle='rgba(255,255,255,.55)'; crackPathCtx(px,py,i=>hh(x,y,100+i)); ctx.stroke();
    if (!reduce){
      const ph = ((time*.3 + hh(x,y,110)*1.6) % 1.6) - .3;
      if (ph>-.3 && ph<1.3){
        ctx.save(); ctx.beginPath(); ctx.rect(px,py,T,T); ctx.clip();
        const sx = px + ph*T*1.6 - T*.3;
        const sg=ctx.createLinearGradient(sx-T*.2,py,sx+T*.4,py); sg.addColorStop(0,'rgba(255,255,255,0)'); sg.addColorStop(.5,'rgba(255,255,255,.3)'); sg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=sg; ctx.beginPath(); ctx.moveTo(sx-T*.2,py+T); ctx.lineTo(sx+T*.1,py); ctx.lineTo(sx+T*.4,py); ctx.lineTo(sx+T*.1,py+T); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      const tw = Math.pow(Math.max(0, Math.sin(time*2.2 + hh(x,y,111)*30)), 12);
      if (tw>.05){
        const sx=px+T*(.2+hh(x,y,112)*.6), sy=py+T*(.2+hh(x,y,113)*.6), s=T*.07*tw;
        ctx.strokeStyle=`rgba(255,255,255,${tw})`; ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(sx-s,sy); ctx.lineTo(sx+s,sy); ctx.moveTo(sx,sy-s); ctx.lineTo(sx,sy+s); ctx.stroke();
      }
    }
  } else if (t==='blood'){
    const g = ctx.createRadialGradient(px+T*.5, py+T*.55, T*.05, px+T*.5, py+T*.55, T*.55);
    g.addColorStop(0, '#7a0d08'); g.addColorStop(.75, 'rgba(90,8,5,.92)'); g.addColorStop(1, 'rgba(60,5,3,.25)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px+T*.5, py+T*.55, T*.46, T*.4, 0, 0, Math.PI*2); ctx.fill();
    const ph = ((reduce ? .3 : time*.6) + hh(x,y,300)) % 1;
    ctx.strokeStyle = `rgba(255,90,70,${.45*(1-ph)})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(px+T*.5, py+T*.55, T*(.08+.3*ph), T*(.06+.24*ph), 0, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,140,120,.35)'; ctx.beginPath(); ctx.ellipse(px+T*.38, py+T*.42, T*.08, T*.03, -.4, 0, Math.PI*2); ctx.fill();
  } else if (t==='grave'){
    const rising = S.rise && S.rise[0]===x && S.rise[1]===y;
    const sx = px + (rising && !reduce ? (Math.random()-.5)*T*.035 : 0);
    ctx.fillStyle='rgba(28,20,14,.65)'; ctx.beginPath(); ctx.ellipse(px+T/2,py+T*.52,T*.36,T*.42,0,0,Math.PI*2); ctx.fill();
    const g=ctx.createLinearGradient(sx+T*.28,0,sx+T*.72,0); g.addColorStop(0,'#4a433b'); g.addColorStop(.5,'#6f665a'); g.addColorStop(1,'#3e3832');
    ctx.fillStyle=g; ctx.fillRect(sx+T*.28,py+T*.16,T*.44,T*.68);
    ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.lineWidth=1; ctx.strokeRect(sx+T*.28,py+T*.16,T*.44,T*.68);
    ctx.strokeStyle = rising ? `rgba(180,240,160,${reduce?.9:.6+.4*Math.sin(time*9)})` : '#2f2a24'; ctx.lineWidth=Math.max(1.5,T*.035);
    ctx.beginPath(); ctx.moveTo(sx+T*.5,py+T*.26); ctx.lineTo(sx+T*.5,py+T*.6); ctx.moveTo(sx+T*.4,py+T*.36); ctx.lineTo(sx+T*.6,py+T*.36); ctx.stroke();
    ctx.fillStyle='rgba(100,130,70,.5)'; ctx.beginPath(); ctx.ellipse(sx+T*.34,py+T*.78,T*.07,T*.04,0,0,Math.PI*2); ctx.fill();
    if (rising){
      ctx.strokeStyle=`rgba(180,240,160,${reduce?.8:.5+.4*Math.sin(time*7)})`; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(sx+T*.3,py+T*.7); ctx.lineTo(sx+T*.42,py+T*.66); ctx.lineTo(sx+T*.5,py+T*.74); ctx.lineTo(sx+T*.62,py+T*.68); ctx.lineTo(sx+T*.7,py+T*.72); ctx.stroke();
      glow(px+T/2, py+T/2, T*(reduce?.9:.8+.15*Math.sin(time*6)), 'rgba(150,230,140,.35)');
    }
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
  return null;
}
const AMB_COUNT = {crypt:16, swamp:14, forge:26, cathedral:45};
function updateAmb(dt){
  if (!S || !S.walls || reduce){ fx.amb = []; return; }
  if (fx.ambFloor!==S.fseed){
    fx.amb = []; fx.ambFloor = S.fseed;
    for (let i=0;i<(AMB_COUNT[S.biome]||0);i++){ const a = spawnAmb(true); if (a) fx.amb.push(a); }
  }
  const t = performance.now()/1000;
  for (const a of fx.amb){
    if (a.k==='fly'){ a.x += Math.sin(t*.9+a.ph)*.35*dt; a.y += Math.cos(t*.7+a.ph*1.3)*.3*dt; }
    else { a.x += a.vx*dt; a.y += a.vy*dt; if (a.k==='snow') a.x += Math.sin(t+a.s*9)*.05*dt; }
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
    }
  }
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
  } else if (b==='forge'){
    ctx.fillStyle=`rgba(255,70,10,${reduce?.035:.03+.02*Math.sin(time*1.3)})`; ctx.fillRect(0,0,size,size);
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
  const col = {collapse:'200,170,130', flood:'120,200,190', lava:'255,130,50', frost:'215,240,255'}[kind];
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
  } else {
    for (let i=0;i<3;i++){ const a = i*Math.PI/3; ctx.moveTo(cx-Math.cos(a)*s, cy-Math.sin(a)*s); ctx.lineTo(cx+Math.cos(a)*s, cy+Math.sin(a)*s); }
    ctx.stroke();
  }
}
function drawRift(time){
  const r = S.rift, [cx,cy] = sqCenter(r.x, r.y);
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (cheb(x,y,r.x,r.y)<=3){ ctx.fillStyle = 'rgba(150,100,255,.07)'; ctx.fillRect(x*tile, y*tile, tile, tile); }
  glow(cx, cy, tile*1.4, `rgba(170,120,255,${reduce?.4:.35+.12*Math.sin(time*3)})`);
  ctx.save(); ctx.translate(cx, cy);
  for (let i=0;i<3;i++){
    ctx.rotate((reduce?0:time)*(i%2?-1:1)*.8 + i);
    ctx.strokeStyle = `rgba(${200-i*30},${160-i*30},255,.8)`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, tile*(.18+i*.09), 0, Math.PI*1.3); ctx.stroke();
  }
  ctx.restore();
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
    ctx.shadowColor = '#b48cff'; ctx.shadowBlur = tile*.5;
    ctx.strokeStyle = `rgba(200,170,255,${.6+.3*Math.sin(time*4)})`; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx-tile*.05, cy-tile*.28); ctx.lineTo(cx+tile*.07, cy-tile*.05); ctx.lineTo(cx-tile*.06, cy+tile*.05); ctx.lineTo(cx+tile*.04, cy+tile*.28); ctx.stroke();
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

function draw(time){
  const size = tile*W;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle = '#120e0c'; ctx.fillRect(0,0,cv.width/dpr,cv.height/dpr);
  if (S && S.chess){ drawChess(time); return; }
  if (!S || !S.walls){ for (let y=0;y<8;y++) for (let x=0;x<8;x++){ ctx.fillStyle = (x+y)%2===0 ? '#2b241e' : '#1f1a16'; ctx.fillRect(x*cv.width/dpr/8, y*cv.height/dpr/8, cv.width/dpr/8, cv.height/dpr/8); } return; }
  if (fx.shake>0 && !reduce) ctx.translate((Math.random()-.5)*fx.shake, (Math.random()-.5)*fx.shake);
  ctx.drawImage(floorLayer(), 0, 0, W*tile, H*tile);
  for (const [k,t] of S.terrain){ const [x,y] = unkey(k); drawTerrain(x, y, t, time); }
  drawBiomeLight(time, size);
  if (S.rift) drawRift(time);
  if (S.tut && S.tut.target && S.phase==='player'){ const [tx,ty] = S.tut.target, [cx,cy] = sqCenter(tx,ty), r = tile*(.36 + (reduce?0:.05*Math.sin(time*5))); ctx.strokeStyle = '#e3b456'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke(); glow(cx, cy, tile*.7, 'rgba(227,180,86,.25)'); }
  if (S.tideRise) for (const [x,y] of S.tideRise){ const pul = reduce ? .5 : .5+.5*Math.sin(time*5); ctx.fillStyle = `rgba(160,20,10,${.15+.15*pul})`; ctx.fillRect(x*tile, y*tile, tile, tile); ctx.strokeStyle = `rgba(255,80,60,${.6+.3*pul})`; ctx.setLineDash([4,3]); ctx.lineWidth = 2; ctx.strokeRect(x*tile+3, y*tile+3, tile-6, tile-6); ctx.setLineDash([]); }
  if (S.tide){ ctx.fillStyle = `rgba(140,10,0,${reduce?.09:.07+.03*Math.sin(time*.9)})`; ctx.fillRect(0, 0, size, size); }
  for (const [k,t] of S.fire){ const [x,y] = unkey(k); ctx.fillStyle = `rgba(240,138,60,${(t>1?.22:.13)+(reduce?0:.06*Math.sin(time*9+x*3+y))})`; ctx.fillRect(x*tile, y*tile, tile, tile); }
  for (const k of S.burn.keys()){
    const [x,y] = unkey(k);
    for (let i=0;i<4;i++){ ctx.fillStyle = `rgba(255,${120+i*20},40,${.5+.3*Math.sin(time*8+i)})`; ctx.fillRect(x*tile+tile*(.2+i*.15), y*tile+tile*(.55+.1*Math.sin(time*5+i)), tile*.07, tile*.07); }
  }
  if (S.stairs){
    const px=S.stairs.x*tile, py=S.stairs.y*tile;
    for (let i=0;i<5;i++){ const ins=tile*(.08+i*.075); ctx.fillStyle=`rgba(0,0,0,${.3+i*.14})`; ctx.fillRect(px+ins,py+ins,tile-ins*2,tile-ins*2); }
    ctx.strokeStyle = `rgba(224,122,50,${.45+.35*Math.sin(time*3)})`; ctx.lineWidth = 2;
    ctx.strokeRect(px+tile*.08, py+tile*.08, tile*.84, tile*.84);
  }
  for (const k of S.walls){ const [x,y] = unkey(k); drawWall(x, y, !!(S.env && S.env.wall[0]===x && S.env.wall[1]===y), time); }
  // torchlight, tinted per biome
  {
    const L = LOOK[S.biome] || LOOK.crypt, p = S.player, [cx,cy] = sqCenter(p.rx, p.ry);
    const flick = reduce ? 0 : Math.sin(time*7)*.05 + Math.sin(time*13.3)*.03;
    const g = ctx.createRadialGradient(cx,cy,tile*1.1,cx,cy,tile*Math.max(2.5, W*L.reach+flick*5));
    g.addColorStop(0,`rgba(${L.dark},0)`); g.addColorStop(1,`rgba(${L.dark},${L.dim})`);
    ctx.fillStyle = g; ctx.fillRect(0,0,size,size);
    glow(cx, cy, tile*1.7, `rgba(255,170,90,${.07+flick*.3})`);
  }
  for (const it of S.items) drawSpecial(it, time);
  if (S.biome==='swamp') drawSwampFog(time, size);
  if (S.phase!=='over'){
    if (S.threatNext && S.phase==='player'){
      ctx.setLineDash([3,4]); ctx.strokeStyle = 'rgba(226,120,90,.38)'; ctx.lineWidth = 1;
      for (const k of S.threatNext){ if (S.dangerSeen.has(k)) continue; const [x,y] = unkey(k); ctx.strokeRect(x*tile+5, y*tile+5, tile-10, tile-10); }
      ctx.setLineDash([]);
    }
    for (const k of S.dangerSeen){
      const [x,y] = unkey(k);
      const env = S.env && S.env.sq.some(([a,b])=>a===x&&b===y);
      ctx.fillStyle = env ? 'rgba(230,120,40,.3)' : 'rgba(184,51,43,.3)'; ctx.fillRect(x*tile, y*tile, tile, tile);
      ctx.strokeStyle = env ? 'rgba(240,140,60,.8)' : 'rgba(226,78,60,.75)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(x*tile+2, y*tile+2, tile-4, tile-4);
    }
    if (S.clock) for (const [x,y] of S.clock.sq) drawClockMark(x, y, S.clock.kind, time);
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
    for (const t of list){
      const fin = t.slide || [t.x,t.y], [cx,cy] = sqCenter(t.x,t.y), danger = S.dangerSeen.has(key(fin[0],fin[1])) || isLava(fin[0],fin[1]);
      const isHover = hover && hover[0]===t.x && hover[1]===t.y;
      if (t.slide){
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
      } else {
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
  for (const {u,k} of units){
    const x = u.rx+u.lx, y = u.ry+u.ly;
    if (k==='e'){
      const vis = intentVisible(u);
      if (!vis){
        const ghost = Math.max(0, 1 - (sightDist(u.x,u.y)-sight())/1.1) * .22;
        if (ghost>.02){ ctx.globalAlpha = ghost; drawPiece(u.type, x, y, foe, {}); ctx.globalAlpha = 1; }
        continue;
      }
      const attacking = u.intent && u.intent.kind==='attack' && S.phase!=='enemy';
      drawPiece(u.type, x, y, foe, {boss:u.boss, holy:u.side==='holy', elite:u.elite, fodder:u.fodder, rift:u.rift, herald:u.herald, rival:u.rival, frozen:u.frozenPiece && S.timeStop>0, attacking});
      hpBar(u, x, y, u.boss ? '#e04a3a' : u.elite ? '#e3b456' : '#c2402f', attackPreview(u), time);
      if (u.role==='protector'){
        for (const [dx,dy] of ALL){ const o = S.enemies.find(q => q.x===u.x+dx && q.y===u.y+dy && !q.boss); if (!o) continue;
          ctx.strokeStyle = 'rgba(150,190,240,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo((x+.5)*tile, (y+.5)*tile); ctx.lineTo((o.rx+o.lx+.5)*tile, (o.ry+o.ly+.5)*tile); ctx.stroke(); }
        const sx = (x+.16)*tile, sy = y*tile+tile*.12, ss = tile*.09;
        ctx.fillStyle = '#a9bfd6'; ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(sx-ss, sy-ss); ctx.lineTo(sx+ss, sy-ss); ctx.lineTo(sx+ss, sy+ss*.2); ctx.lineTo(sx, sy+ss*1.2); ctx.lineTo(sx-ss, sy+ss*.2); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      if (u.marked && !u.frozenPiece){ const mx = (x+.82)*tile, my = y*tile+tile*.16, ms = tile*.08; ctx.fillStyle = '#e3b456'; ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mx, my-ms); ctx.lineTo(mx+ms, my); ctx.lineTo(mx, my+ms); ctx.lineTo(mx-ms, my); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      if (u.judged){ ctx.strokeStyle = 'rgba(240,214,140,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc((x+.5)*tile, (y+.5)*tile, tile*.44, 0, Math.PI*2); ctx.stroke(); }
      if (u.intent && u.intent.stunned){ ctx.fillStyle='#ecd36a'; ctx.font=`700 ${tile*.22}px ${BF}`; ctx.textAlign='center'; ctx.fillText('zz', (x+.2)*tile, y*tile+tile*.2); }
    } else {
      drawPiece(u.type, x, y, S.color, {ally:true});
      hpBar(u, x, y, '#7fb069');
    }
    if (showWarn && S.dangerSeen.has(key(u.x,u.y))) warnMark(x, y);
  }
  if (!S.dead) drawPiece(S.cls, S.player.rx+S.player.lx, S.player.ry+S.player.ly, S.color, {player:true});
  // interactive events: a bouncing marker says "step here"
  for (const it of S.items) if (it.frozen || it.riftGate || it.tideChest){
    const cx = (it.x+.5)*tile, bob = reduce ? 0 : Math.sin(time*4)*tile*.05, top = it.y*tile + tile*.02 + bob;
    const col = it.frozen ? '207,230,245' : it.riftGate ? '200,170,255' : '255,110,90';
    ctx.strokeStyle = `rgba(${col},.85)`; ctx.lineWidth = 2; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.arc(cx, (it.y+.5)*tile, tile*.44, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = `rgba(${col},.95)`; ctx.strokeStyle = 'rgba(10,6,4,.9)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - tile*.11, top - tile*.12); ctx.lineTo(cx + tile*.11, top - tile*.12); ctx.lineTo(cx, top); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
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
    ctx.strokeStyle = `rgba(${b.c},${a})`; ctx.lineWidth = Math.max(2, tile*.06);
    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
  }
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
  ctx.font = `700 ${Math.max(12, tile*.26)}px ${BF}`;
  for (const f of fx.floats){
    const a = Math.max(0, 1-f.t/1.1);
    // keep the text inside the board, even for squares on the edges
    const half = ((ctx.measureText(f.text) || {}).width || 0)/2 + 4, fs = Math.max(12, tile*.26);
    const xx = Math.min(size - half, Math.max(half, f.x*tile)), yy = Math.min(size - fs*.6, Math.max(fs*.6, (f.y - f.t*.6)*tile));
    ctx.globalAlpha = a; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,6,4,.9)';
    ctx.strokeText(f.text, xx, yy); ctx.fillStyle = f.color; ctx.fillText(f.text, xx, yy);
  }
  ctx.globalAlpha = 1;
}
function updateFx(dt){
  if (S && S.player){
    const k = Math.min(1, dt*14), dec = Math.max(0, 1-dt*10);
    for (const o of [S.player, ...(S.enemies||[]), ...(S.allies||[])]){ o.rx += (o.x-o.rx)*k; o.ry += (o.y-o.ry)*k; o.lx *= dec; o.ly *= dec; }
  }
  for (const p of fx.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=dt*3; p.life-=dt; }
  fx.parts = fx.parts.filter(p => p.life>0);
  for (const m of fx.embers){ m.y += m.vy*dt; m.life -= dt*.9; }
  fx.embers = fx.embers.filter(m => m.life>0).slice(-120);
  for (const f of fx.floats) f.t += dt; fx.floats = fx.floats.filter(f => f.t<1.1);
  for (const f of fx.flashes) f.t -= dt*2.2; fx.flashes = fx.flashes.filter(f => f.t>0);
  for (const r of fx.rings) r.t += dt; fx.rings = fx.rings.filter(r => r.t<.5);
  for (const b of fx.beams) b.t += dt; fx.beams = fx.beams.filter(b => b.t<.35);
  fx.shake = Math.max(0, fx.shake-dt*40);
  updateAmb(dt);
  if (S && S.tide && !reduce){
    fx.rain = (fx.rain || []).filter(d => (d.y += dt*6, d.x -= dt*.8, d.life -= dt, d.life>0 && d.y < H+.5));
    while (fx.rain.length < 22) fx.rain.push({x: Math.random()*(W+2), y: -Math.random()*2, life: 1.5 + Math.random()});
  } else fx.rain = [];
}
