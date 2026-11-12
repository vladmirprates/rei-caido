/* Rei Caído — living effects on the ground and on the pieces.
   Everything here is a pure function of the clock (no state to keep), drawn from cached sprites and soft additive glows:
   burning ground, the hero's build made visible (a rune on the floor, element effects on the body, a halo, a trail),
   frozen pieces, and the auras of elites, bosses, the horde, rift pieces and spectral allies. */

const hexRgb = (() => { const m = {}; return c => m[c] || (m[c] = c[0]==='#' ? [16,8,0].map(s => (parseInt(c.slice(1), 16) >> s) & 255).join(',') : c); })();
const _tau = Math.PI*2, _lowq = () => !!fx.lowq;

/* ---------- flames: one teardrop sprite per palette ---------- */
const _flSpr = {};
function flameSpr(kind){
  if (_flSpr[kind]) return _flSpr[kind];
  const P = {gold:[[255,92,22],[255,178,58],[255,246,196]], red:[[196,26,12],[255,102,34],[255,206,128]], cold:[[60,130,230],[150,215,255],[245,252,255]],
             soul:[[110,40,170],[180,100,240],[245,220,255]], tar:[[70,20,90],[210,76,42],[255,176,96]]}[kind];
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; c._pal = P; const g = c.getContext('2d');
  const body = (hw, ht, y0) => {
    g.beginPath(); g.moveTo(32-hw, y0);
    g.bezierCurveTo(32-hw*1.3, y0-ht*.42, 32-hw*.3, y0-ht*.64, 32+hw*.14, y0-ht);
    g.bezierCurveTo(32+hw*.55, y0-ht*.62, 32+hw*1.3, y0-ht*.4, 32+hw, y0);
    g.quadraticCurveTo(32, y0+hw*.95, 32-hw, y0); g.closePath();
  };
  let gr = g.createLinearGradient(0, 118, 0, 6);
  gr.addColorStop(0, `rgba(${P[0]},.96)`); gr.addColorStop(.5, `rgba(${P[1]},.9)`); gr.addColorStop(1, `rgba(${P[1]},0)`);
  g.fillStyle = gr; body(19, 112, 116); g.fill();
  gr = g.createLinearGradient(0, 118, 0, 40);
  gr.addColorStop(0, `rgba(${P[2]},.95)`); gr.addColorStop(.6, `rgba(${P[2]},.55)`); gr.addColorStop(1, `rgba(${P[1]},0)`);
  g.fillStyle = gr; body(9, 62, 114); g.fill();
  return _flSpr[kind] = c;
}
// a tongue of fire standing on (px, py). Three layers (dark edge, body, white-hot core) whose outline undulates up its length, so it licks and wavers like a real flame
const c0 = (L, R) => (L[0][0] + R[0][0])/2;
function flameAt(spr, px, py, hgt, wid, lean, alpha, tt, ph){
  const P = spr._pal, t = tt === undefined ? (reduce ? 0 : performance.now()/1000) : tt, p0 = ph === undefined ? px*.37 : ph, N = 7;
  ctx.save(); ctx.translate(px, py);
  for (const [col, ws, hs, al] of [[P[0], 1, .92, .92], [P[1], .78, .8, .96], [P[2], .5, .52, 1]]){
    const h = hgt*hs, w = wid*.3*ws, L = [], R = [];
    for (let i=0;i<=N;i++){
      const u = i/N, c = lean*h*u*u + Math.sin(t*6.2 + u*4.4 + p0)*w*.75*u + Math.sin(t*9 + u*6 + p0*1.7)*w*.15*u*u,
            hw = w*Math.pow(1 - u, .8)*(1 + .2*Math.sin(t*8.1 + u*6 + p0*.7))*(i===0 ? .85 : 1);
      L.push([c - hw, -h*u]); R.push([c + hw, -h*u]);
    }
    ctx.fillStyle = `rgba(${col},${Math.min(1, alpha*al*1.22)})`; ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
    for (let i=1;i<N;i++) ctx.quadraticCurveTo(L[i][0], L[i][1], (L[i][0] + L[i+1][0])/2, (L[i][1] + L[i+1][1])/2);   // smooth edges: no jagged teeth
    ctx.lineTo(L[N][0], L[N][1]);
    for (let i=N-1;i>0;i--) ctx.quadraticCurveTo(R[i][0], R[i][1], (R[i][0] + R[i-1][0])/2, (R[i][1] + R[i-1][1])/2);
    ctx.lineTo(R[0][0], R[0][1]); ctx.quadraticCurveTo(c0(L, R), w*.9, L[0][0], L[0][1]);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
const _flick = (t, ph) => Math.sin(t*7.3 + ph)*.5 + Math.sin(t*12.7 + ph*1.7)*.35 + Math.sin(t*3.1 + ph*.6)*.15;   // roughly -1..1, never periodic to the eye
let _smokeSpr = null;

// burning ground: a charred bed with hot coals, tongues of fire that sway and flare, rising sparks and a little smoke
function drawFlames(x, y, time, hostile, k){
  const T = tile, bx = x*T, base = y*T + T*.84, cx0 = bx + T/2, t = reduce ? 0 : time, low = _lowq();
  const spr = flameSpr(hostile ? 'red' : 'gold'), ph0 = x*1.7 + y*2.9;
  ctx.save();
  _shSpr = _shSpr || softSprite(.65, .35);
  ctx.globalAlpha = hostile ? .55 : .42; ctx.drawImage(_shSpr, cx0 - T*.46, base - T*.11, T*.92, T*.2);
  ctx.globalCompositeOperation = 'lighter';
  const fl = .85 + .15*_flick(t, ph0);
  ctx.globalAlpha = .55*fl*k; const gs = glowSprite(hostile ? '255,64,30' : '255,140,40');
  ctx.drawImage(gs, cx0 - T*.85*k, base - T*.6*k, T*1.7*k, T*1.2*k);
  for (let i=0;i<4;i++){   // coals on the ground pulse out of step
    const a = .5 + .5*Math.sin(t*2.4 + i*1.9 + ph0), ex = cx0 + (i-1.5)*T*.2, ey = base + (i%2 ? .01 : -.02)*T;
    ctx.globalAlpha = (.35 + .4*a)*k; ctx.drawImage(glowSprite('255,120,40'), ex - T*.1, ey - T*.06, T*.2, T*.12);
  }
  const n = low ? 3 : 5;
  ctx.globalCompositeOperation = 'source-over';
  for (let i=0;i<n;i++){
    const u = n === 1 ? .5 : i/(n-1), ph = ph0 + i*2.3, fk = _flick(t*(1 + .2*hh(x,y,300+i)), ph), mid = 1 - Math.abs(u-.5)*1.1;
    const hgt = T*k*(.34 + .4*mid)*(1 + .26*fk), wid = T*(.3 + .08*mid)*(1 - .14*fk), lean = Math.sin(t*2.6 + ph)*.2 + fk*.14;
    const py = base + T*((i%2) ? .045 : -.03);
    flameAt(spr, bx + T*(.14 + .72*u) + Math.sin(t*3 + ph)*T*.012, py, hgt, wid*1.25, lean, .95, t, ph);
  }
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = .75*k; ctx.drawImage(glowSprite(hostile ? '255,90,40' : '255,170,60'), cx0 - T*.44, base - T*.08, T*.88, T*.17);   // a bed of embers hides where the tongues meet the ground
  for (let j=0, m = low ? 2 : 5; j<m; j++){   // sparks climb, wobble and cool from yellow to red
    const hj = hh(x,y,320+j), p = (t*(.5 + .35*hj) + hj*3) % 1, sx = cx0 + (hh(x,y,330+j)-.5)*T*.55 + Math.sin(t*3 + j*2)*T*.08*p, sy = base - T*.12 - p*T*(.6 + .5*hj), r = T*(.05*(1-p) + .01);
    ctx.globalAlpha = (1-p)*.95; ctx.drawImage(glowSprite(p < .45 ? '255,224,130' : '255,110,40'), sx - r*2, sy - r*2, r*4, r*4);
  }
  if (!low){
    ctx.globalCompositeOperation = 'source-over'; _smokeSpr = _smokeSpr || (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(70,62,58,.7)'); gr.addColorStop(1,'rgba(70,62,58,0)'); g.fillStyle = gr; g.fillRect(0,0,64,64); return c; })();
    for (let j=0;j<2;j++){
      const p = (t*.22 + j*.5 + hh(x,y,340)) % 1, r = T*(.12 + .22*p);
      ctx.globalAlpha = (hostile ? .3 : .2)*Math.sin(p*Math.PI)*k; ctx.drawImage(_smokeSpr, cx0 + Math.sin(t*1.3 + j*3 + ph0)*T*.12 - r, base - T*(.55 + p*.75) - r, r*2, r*2);
    }
  }
  ctx.restore();
}

/* ---------- small building blocks ---------- */
// a twinkling four-point star
function twinkle(sx, sy, s, rgb, a){
  if (a < .04) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
  ctx.drawImage(glowSprite(rgb), sx - s*1.3, sy - s*1.3, s*2.6, s*2.6);
  ctx.strokeStyle = `rgba(255,255,255,${.9})`; ctx.lineWidth = Math.max(1, s*.18); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx - s, sy); ctx.lineTo(sx + s, sy); ctx.moveTo(sx, sy - s*1.3); ctx.lineTo(sx, sy + s*1.3); ctx.stroke(); ctx.restore();
}
// sparkles scattered around a body, each one flaring on its own schedule
function sparkles(cx, cy, n, rgb, t, seed, spread){
  const T = tile;
  for (let i=0;i<n;i++){
    const per = 1.6 + hh(seed,i,7)*1.6, p = ((t + hh(seed,i,8)*per) % per)/per, a = Math.pow(Math.sin(Math.min(1, p*3)*Math.PI), 2) * (p < .33 ? 1 : 0);
    const ang = hh(seed,i,9)*_tau + Math.floor((t + hh(seed,i,8)*per)/per)*2.4, r = T*(spread||.4)*(.45 + .55*hh(seed,i,10));
    twinkle(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r*.9 - T*.05, T*(.05 + .04*hh(seed,i,11)), rgb, a);
  }
}
// embers that rise from a piece's feet, cooling as they go
function risingEmbers(cx, fy, n, t, seed, hot, cool, height){
  const T = tile;
  for (let i=0;i<n;i++){
    const hj = hh(seed,i,20), p = (t*(.42 + .3*hj) + hj*5) % 1, sx = cx + (hh(seed,i,21)-.5)*T*.5 + Math.sin(t*2.6 + i*2.1)*T*.07*p, sy = fy - p*T*(height||.8), r = T*(.06*(1-p*.8) + .012);
    ctx.globalAlpha = (1 - p*p)*.95; ctx.drawImage(glowSprite(p < .5 ? hot : cool), sx - r*2.2, sy - r*2.2, r*4.4, r*4.4);
  }
  ctx.globalAlpha = 1;
}
// a wisp: a bright head with a tail that curls behind it
function wisps(cx, fy, n, t, seed, head, tailc, height){
  const T = tile, low = _lowq();
  for (let i=0;i<n;i++){
    const sp = .26 + .12*hh(seed,i,30), p0 = (t*sp + hh(seed,i,31)*3) % 1, sw = .5 + hh(seed,i,32)*.8, ph = i*2.7, sg = hh(seed,i,33) < .5 ? -1 : 1;
    const pos = u => [cx + Math.sin(u*5*sw + ph + t*.8)*T*(.08 + .2*u)*sg, fy - u*T*(height||1)];
    const m = low ? 3 : 6;
    for (let s=m; s>=0; s--){
      const u = p0 - s*.028; if (u < 0) continue;
      const [qx, qy] = pos(u), f = 1 - s/(m+1), life = Math.sin(Math.min(1, u*1.05)*Math.PI), r = T*(.055*f + .01);
      ctx.globalAlpha = Math.max(0, f*life)*.7; ctx.drawImage(glowSprite(s ? tailc : head), qx - r*2, qy - r*2, r*4, r*4);
    }
  }
  ctx.globalAlpha = 1;
}
// one tall ice shard drawn once: a gradient body, a dark facet, a bright edge and a long highlight
let _shardSpr = null;
function shardSpr(){
  if (_shardSpr) return _shardSpr;
  const c = _shardSpr = document.createElement('canvas'); c.width = 48; c.height = 128; const g = c.getContext('2d');
  const body = () => { g.beginPath(); g.moveTo(8, 124); g.lineTo(11, 54); g.lineTo(24, 6); g.lineTo(37, 54); g.lineTo(40, 124); g.closePath(); };
  let gr = g.createLinearGradient(0, 124, 0, 6); gr.addColorStop(0, 'rgba(60,130,210,.9)'); gr.addColorStop(.5, 'rgba(140,210,250,.9)'); gr.addColorStop(1, 'rgba(240,252,255,.96)');
  g.fillStyle = gr; body(); g.fill();
  g.fillStyle = 'rgba(25,70,150,.4)'; g.beginPath(); g.moveTo(24, 124); g.lineTo(24, 6); g.lineTo(37, 54); g.lineTo(40, 124); g.closePath(); g.fill();   // the shaded facet
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(13, 112); g.lineTo(15, 62); g.lineTo(21, 34); g.lineTo(20, 70); g.lineTo(18, 112); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(15,50,110,.75)'; g.lineWidth = 1.6; g.lineJoin = 'round'; body(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(24, 6); g.lineTo(24, 124); g.moveTo(11, 54); g.lineTo(37, 54); g.stroke();
  return c;
}
// a cluster of ice shards growing from one point: a tall one in the middle and shorter ones leaning away, with a flash that sweeps the tip
function iceCrystal(px, py, h, w, t, seed){
  const spr = shardSpr();
  const part = (dx, hh2, ww, lean) => {
    const hs = hh2/118, ws = ww/16;
    ctx.save(); ctx.translate(px + dx, py); ctx.transform(1, 0, lean, 1, 0, 0); ctx.drawImage(spr, -24*ws, -124*hs, 48*ws, 128*hs); ctx.restore();
  };
  part(-w*1.9, h*.55, w*.75, -.22); part(w*1.8, h*.45, w*.7, .26); part(0, h, w, 0);
  const g = Math.pow(Math.max(0, Math.sin(t*1.7 + seed*5.3)), 14);
  if (g > .05){ ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = g; ctx.drawImage(glowSprite('225,246,255'), px - h*.35, py - h*1.05 - h*.3, h*.7, h*.7); ctx.restore(); }
}
// a spike that grows out of the ground: two tones, a dark outline
function thornSpike(px, py, h, w, lean){
  ctx.save(); ctx.translate(px, py); ctx.lineJoin = 'round';
  ctx.fillStyle = '#8fd47c'; ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(lean, -h); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3d7f43'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lean, -h); ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(14,34,16,.85)'; ctx.lineWidth = Math.max(1, w*.28); ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(lean, -h); ctx.lineTo(w, 0); ctx.stroke(); ctx.restore();
}
// a lightning arc between two points, jagged from a seed so it holds steady for a few frames and then forks anew
function arcBolt(ax, ay, bx, by, seed, jit, a, ws){
  ws = ws || 1;
  const n = 6, nx = -(by-ay), ny = bx-ax, len = Math.hypot(nx, ny) || 1, pts = [[ax, ay]];
  for (let i=1;i<n;i++){ const j = (hh(seed,i,40)-.5)*2*jit*Math.sin(i/n*Math.PI); pts.push([ax + (bx-ax)*i/n + nx/len*j, ay + (by-ay)*i/n + ny/len*j]); }
  pts.push([bx, by]);
  const line = (w, col, al) => { ctx.globalAlpha = al*a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke(); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  line(tile*.09*ws, 'rgb(70,120,255)', .3); line(tile*.034*ws, 'rgb(150,200,255)', .85); line(Math.max(1, tile*.014*ws), '#fff', 1);
  ctx.globalAlpha = a*.8; ctx.drawImage(glowSprite('190,225,255'), bx - tile*.05*ws, by - tile*.05*ws, tile*.1*ws, tile*.1*ws);
}

/* ---------- the hero's build, made visible ---------- */
const _tier = v => v <= 0 ? 0 : v <= 2 ? 1 : v <= 5 ? 2 : 3;
function buildProfile(){
  const now = performance.now(), sig = Object.values(S.equip).map(i => i ? i.id : 0).join(',') + '|' + S.color + '|' + (HERO.tree||[]).length + '|' + S.cls;
  if (buildProfile.sig===sig && now - buildProfile.at < 600) return buildProfile.v;
  const st = stats(), items = Object.values(S.equip).filter(Boolean); let rules = 0, legends = 0, rares = 0;
  for (const it of items){ if (it.rar==='legend') legends++; else if (it.rar==='rare') rares++; for (const a of it.affixes) if (AFX[a.k] && AFX[a.k].rule) rules++; }
  const lv = {fire:_tier(st.fireDmg), cold:_tier(st.coldDmg), light:_tier(st.lightDmg), vamp:st.vamp > (S.color==='b' ? 1 : 0) ? (st.vamp >= 4 ? 2 : 1) : 0, thorns:st.thorns ? (st.thorns >= 4 ? 2 : 1) : 0, death:st.deathBurst ? 1 : 0, gold:(st.chain || st.regicide || st.execute) ? 1 : 0};
  const RGB = {fire:'255,130,50', cold:'140,205,255', light:'160,200,255', vamp:'210,40,50', thorns:'130,210,120', death:'180,70,210', gold:'227,180,86'};
  const raw = {fire:st.fireDmg||0, cold:st.coldDmg||0, light:st.lightDmg||0}, power = rules + legends*1.5 + rares*.5;
  // the strongest element wins; with no element, the strongest of the others
  let kind = ['fire','cold','light'].sort((a,b) => raw[b] - raw[a])[0]; if (!raw[kind]) kind = ['vamp','thorns','death','gold'].find(k => lv[k] > 0) || 'gold';
  const any = raw[kind] > 0 || lv[kind] > 0 || power >= 1, cols = [RGB[kind]];
  const sec = ['vamp','thorns','death'].find(k => k !== kind && lv[k] > 0) || null;   // blood, thorns or necro ride along with the element, lighter
  buildProfile.sig = sig; buildProfile.at = now;
  return (buildProfile.v = Object.assign({cols, power, legends, kind, any, tier:lv[kind] || 1}, {fire:0, cold:0, light:0, vamp:0, thorns:0, death:0, gold:0}, {[kind]:lv[kind] || 1}, sec ? {[sec]:1, sec} : {}));
}
// the rune on the floor: rings that turn against each other, ticks, and a figure in the middle that says what the build is
function auraGlyph(P, cx, fy, t){
  const T = tile, col = P.cols[0], a = (.26 + .34*Math.min(1, P.power/8))*(1 + .12*Math.sin(t*2)), R = T*(.47 + .02*Math.min(3, P.tier));
  ctx.save(); ctx.translate(cx, fy + T*.03); ctx.scale(1, .34); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a*.7; ctx.drawImage(glowSprite(col), -R*1.25, -R*1.25, R*2.5, R*2.5);
  ctx.lineWidth = T*.05; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = `rgba(${col},${a})`; ctx.fillStyle = `rgba(${col},${a*.25})`;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, _tau); ctx.stroke();
  ctx.save(); ctx.rotate(-t*.45); ctx.setLineDash([R*.14, R*.1]); ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(0, 0, R*.8, 0, _tau); ctx.stroke(); ctx.restore();
  const nt = 6 + P.tier*2; ctx.beginPath();
  for (let i=0;i<nt;i++){ const an = i/nt*_tau + t*.3; ctx.moveTo(Math.cos(an)*R*.88, Math.sin(an)*R*.88); ctx.lineTo(Math.cos(an)*R*1.04, Math.sin(an)*R*1.04); }
  ctx.stroke();
  ctx.save(); ctx.rotate(t*.7); ctx.beginPath();
  const poly = (n, r0, r1, off) => { for (let i=0;i<n*(r1 ? 2 : 1);i++){ const an = (r1 ? i/(n*2) : i/n)*_tau + (off||0), r = r1 && i%2 ? r1 : r0; i ? ctx.lineTo(Math.cos(an)*r, Math.sin(an)*r) : ctx.moveTo(Math.cos(an)*r, Math.sin(an)*r); } ctx.closePath(); };
  const k = P.kind;
  if (k==='fire') poly(3, R*.62, 0, -Math.PI/2);
  else if (k==='cold'){ poly(3, R*.62, 0, -Math.PI/2); ctx.stroke(); ctx.beginPath(); poly(3, R*.62, 0, Math.PI/2); }
  else if (k==='light') poly(4, R*.66, R*.22, 0);
  else if (k==='thorns') poly(6, R*.66, R*.3, 0);
  else if (k==='vamp'){ ctx.arc(0, 0, R*.5, 0, _tau); ctx.moveTo(0, R*.5); poly(3, R*.5, 0, Math.PI/2); }
  else if (k==='death'){ for (let i=0;i<5;i++){ const an = i*2/5*_tau - Math.PI/2; i ? ctx.lineTo(Math.cos(an)*R*.64, Math.sin(an)*R*.64) : ctx.moveTo(Math.cos(an)*R*.64, Math.sin(an)*R*.64); } ctx.closePath(); }
  else { poly(4, R*.62, 0, 0); ctx.stroke(); ctx.beginPath(); ctx.rotate(Math.PI/4); poly(4, R*.62, 0, 0); }
  ctx.stroke(); ctx.fill(); ctx.restore();
  ctx.restore();
}
/* ---------- element effects on the body; pass 0 = behind the piece, pass 1 = in front ---------- */
// fire: a wall of flames rises behind the body, small ones lick at the front of the feet, embers climb. The level makes them taller and more numerous.
function auraFire(P, cx, cy, fy, t, pass){
  const T = tile, F = P.fire, spr = flameSpr('gold');
  ctx.save();
  if (pass===0){
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .13 + .05*F; ctx.drawImage(glowSprite('255,110,30'), cx - T*.6, cy - T*.5, T*1.2, T*1.2);
    ctx.globalCompositeOperation = 'source-over';
    const n = 3 + F;
    for (let i=0;i<n;i++){   // behind the piece: tall tongues fanned out from the feet
      const u = (i + .5)/n, fk = _flick(t, i*2.4 + 1), lean = (u - .5)*.5 + fk*.1;
      flameAt(spr, cx + (u - .5)*T*.78, fy - T*.02 + (i%2 ? .02 : -.01)*T, T*(.38 + .1*F)*(1 + .22*fk)*(1 - Math.abs(u - .5)*.5), T*.38, lean, .95, t, i*2.1);
    }
  } else {
    ctx.globalCompositeOperation = 'source-over';
    const n = 2 + F;
    for (let i=0;i<n;i++){   // in front: low flames at the toes
      const u = (i + .5)/n, fk = _flick(t, i*1.7 + 5);
      flameAt(spr, cx + (u - .5)*T*.62, fy + T*.07, T*(.15 + .04*F)*(1 + .25*fk), T*.26, fk*.12 + (u - .5)*.2, .95, t, i*3.3 + 1);
    }
    ctx.globalCompositeOperation = 'lighter';
    risingEmbers(cx, fy - T*.05, 3 + F*2, t, 11, '255,214,120', '255,100,36', .95);
  }
  ctx.restore();
}
function auraCold(P, cx, cy, fy, t, pass){
  const T = tile, n = 3 + P.cold;
  ctx.save();
  if (pass===0){   // frost spreads over the floor: a pale patch with cracks running out of it
    ctx.save(); ctx.translate(cx, fy + T*.03); ctx.scale(1, .34); ctx.globalAlpha = .35; ctx.drawImage(glowSprite('200,235,255'), -T*.55, -T*.55, T*1.1, T*1.1);
    ctx.strokeStyle = 'rgba(235,250,255,.5)'; ctx.lineWidth = T*.025; ctx.lineCap = 'round'; ctx.beginPath();
    for (let i=0;i<9;i++){ const an = i/9*_tau + .3, r0 = T*.1, r1 = T*(.34 + .14*hh(6,i,57)), mid = r1*.55, bend = (hh(6,i,58)-.5)*.5; ctx.moveTo(Math.cos(an)*r0, Math.sin(an)*r0); ctx.lineTo(Math.cos(an+bend)*mid, Math.sin(an+bend)*mid); ctx.lineTo(Math.cos(an)*r1, Math.sin(an)*r1); }
    ctx.stroke(); ctx.restore();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite('120,190,255'), cx - T*.55, cy - T*.5, T*1.1, T*1.1);
    for (let i=0;i<3+P.cold;i++){   // cold air spills over the floor around the feet
      const p = (t*.13 + hh(1,i,50)) % 1, an = hh(1,i,51)*_tau + t*.15, r = T*(.12 + .3*p), mx = cx + Math.cos(an)*r, my = fy + Math.sin(an)*r*.3 + T*.02, s = T*(.2 + .16*p);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .17*Math.sin(p*Math.PI); ctx.drawImage(glowSprite('205,232,255'), mx - s, my - s*.4, s*2, s*.8);
    }
  }
  ctx.globalAlpha = 1;
  for (let i=0;i<n;i++){
    const an = i/n*_tau + .35 + hh(2,i,52)*.3, sy = Math.sin(an), front = sy >= 0;
    if (front !== (pass===1)) continue;
    const sz = .75 + .5*hh(2,i,53);
    iceCrystal(cx + Math.cos(an)*T*.36, fy + sy*T*.1, T*(.2 + .08*P.cold)*sz, T*.032*sz, t, i);
  }
  if (pass===1){
    for (let i=0;i<2+P.cold;i++){   // frost dust drifts down past the body
      const p = (t*.22 + hh(3,i,54)) % 1, sx = cx + (hh(3,i,55)-.5)*T*.7 + Math.sin(t*1.6 + i)*T*.04, sy = cy - T*.55 + p*T*.85, r = T*.03;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.sin(p*Math.PI)*.85; ctx.drawImage(glowSprite('225,245,255'), sx - r*2, sy - r*2, r*4, r*4);
    }
    sparkles(cx, cy, 2 + P.cold, '200,235,255', t, 61, .38);
  }
  ctx.restore();
}
// an electric ring of jagged line: every few frames it jumps to a new shape. half = 0 draws the back half, 1 the front
function elecRing(cx, cy, rx, ry, bucket, seed, half, ws){
  const n = 20, pts = [];
  for (let i=0;i<=n;i++){ const an = i/n*_tau + (seed%7), j = (hh(bucket + seed, i, 70) - .5)*tile*.075*ws*2; pts.push([cx + Math.cos(an)*(rx + j), cy + Math.sin(an)*(ry + j*.3), Math.sin(an) >= 0]); }
  const run = (w, col, al) => {
    ctx.strokeStyle = col; ctx.globalAlpha = al; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); let pen = false;
    for (const [x, y, fr] of pts){ if ((fr?1:0) !== half){ pen = false; continue; } pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; }
    ctx.stroke();
  };
  run(tile*.07*ws, 'rgb(70,120,255)', .22); run(tile*.026*ws, 'rgb(150,205,255)', .8); run(Math.max(1, tile*.01*ws), '#fff', .95);
}
// one thin bolt from the sky onto the head
function skyBolt(cx, cy, seed, k, fl){
  const T = tile, sx = cx + (hh(seed,1,71)-.5)*T*.3, top = cy - T*1.0, bot = cy - T*.3, pts = [[sx + (hh(seed,2,71)-.5)*T*.3, top]];
  for (let i=1;i<6;i++){ const u = i/6; pts.push([sx + (cx - sx)*u + (hh(seed + i, i, 72)-.5)*T*.22*(1-u*.4), top + (bot - top)*u]); }
  pts.push([cx, bot]);
  const line = (w, col, al) => { ctx.strokeStyle = col; ctx.globalAlpha = al*fl*(1 - k*.5); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke(); };
  line(T*.05, 'rgb(70,120,255)', .28); line(T*.02, 'rgb(160,210,255)', .8); line(Math.max(1, T*.008), '#fff', .95);
}
// the level (1-3, from the lightning damage): more rings, a brighter field, more sparks and a bolt that falls more often. Nothing flies out to the sides.
function auraLight(P, cx, cy, fy, t, pass){
  const T = tile, L = P.light, bucket = Math.floor(t*16), per = [0, 4.4, 3.2, 2.3][L], ph = t % per, strike = ph < .22, sIdx = Math.floor(t/per), ws = [0, .7, .85, 1][L];
  const k = ph/.22, fl = Math.sin(k*40) > -.3 ? 1 : .45;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (pass===0){
    ctx.globalAlpha = (.08 + .06*L + .05*Math.max(0, _flick(t, 3)))*(strike ? 1.6 : 1); ctx.drawImage(glowSprite('110,160,255'), cx - T*(.42 + .06*L), cy - T*(.38 + .06*L), T*(.84 + .12*L), T*(.84 + .12*L));
    elecRing(cx, fy, T*(.3 + .02*L), T*.09, bucket, 1, 0, ws);
    if (L >= 2) elecRing(cx, cy - T*.02, T*.28, T*.08, bucket + 5, 3, 0, ws*.85);
    if (L >= 3) elecRing(cx, cy - T*.2, T*.22, T*.065, bucket + 9, 5, 0, ws*.8);
    if (strike){   // where the bolt lands: a small flash and a ring of shock
      ctx.globalAlpha = (1-k)*.5; ctx.drawImage(glowSprite('200,230,255'), cx - T*.4, fy - T*.14, T*.8, T*.28);
      ctx.strokeStyle = `rgba(170,210,255,${(1-k)*.6})`; ctx.lineWidth = Math.max(1.2, T*.022); ctx.beginPath(); ctx.ellipse(cx, fy, T*(.18 + .3*k), T*(.05 + .1*k), 0, 0, _tau); ctx.stroke();
    }
  } else {
    elecRing(cx, fy, T*(.3 + .02*L), T*.09, bucket, 1, 1, ws);
    if (L >= 2) elecRing(cx, cy - T*.02, T*.28, T*.08, bucket + 5, 3, 1, ws*.85);
    if (L >= 3) elecRing(cx, cy - T*.2, T*.22, T*.065, bucket + 9, 5, 1, ws*.8);
    const nc = [0, 1, 2, 3][L];
    for (let j=0;j<nc;j++){   // a few tiny crackles that flick over the body and go out at once
      const sd = bucket*9 + j*5; if (hh(sd,j,44) > .5) continue;
      const an = hh(sd,j,45)*_tau, r0 = T*(.14 + .1*hh(sd,j,46)), r1 = r0 + T*(.1 + .06*hh(sd,j,47));
      arcBolt(cx + Math.cos(an)*r0, cy + Math.sin(an)*r0*.9, cx + Math.cos(an+.5)*r1, cy + Math.sin(an+.5)*r1*.9, sd, T*.025, .9, .38);
    }
    const ns = [0, 2, 4, 7][L];
    for (let j=0;j<ns;j++){   // small sparks lift off the body and burn out close by
      const p = (t*1.6 + j/ns + hh(7,j,53)) % 1, an = hh(7,j,54)*_tau + Math.floor(t*1.6 + j/ns + hh(7,j,53))*2, r = T*(.22 + .16*p);
      ctx.globalAlpha = (1-p)*.85; ctx.fillStyle = '#e6f4ff'; ctx.beginPath(); ctx.arc(cx + Math.cos(an)*r, cy + Math.sin(an)*r*.8 - p*T*.05, T*.018*(1-p) + .8, 0, _tau); ctx.fill();
    }
    if (strike){ skyBolt(cx, cy, sIdx, k, fl); ctx.globalAlpha = (1-k)*.25; ctx.drawImage(glowSprite('220,240,255'), cx - T*.3, cy - T*.55, T*.6, T*.6); }
  }
  ctx.restore();
}
function auraVamp(P, cx, cy, fy, t, pass){
  const T = tile, m = 3 + P.vamp*2;
  ctx.save();
  if (pass===0){   // a heartbeat: two pulses that spread over the floor
    const ph = t % 1.5;
    for (const [o, w] of [[0, 1], [.26, .7]]){
      const p = (ph - o)/.75; if (p < 0 || p > 1) continue;
      const rx = T*(.2 + .34*p); ctx.strokeStyle = `rgba(190,28,40,${(1-p)*.55*w})`; ctx.lineWidth = Math.max(1.5, T*.03*(1-p) + 1);
      ctx.beginPath(); ctx.ellipse(cx, fy + T*.03, rx, rx*.32, 0, 0, _tau); ctx.stroke();
    }
  }
  for (let i=0;i<m;i++){
    const p = (t*.42 + i/m) % 1;
    for (let s=0;s<3;s++){   // each drop drags a short trail
      const u = p - s*.03; if (u < 0) continue;
      const an = u*_tau*1.4 + i*2.1, r = T*(.22 + .06*Math.sin(u*9 + i)), front = Math.sin(an) >= 0;
      if (front !== (pass===1)) continue;
      const dx = cx + Math.cos(an)*r, dy = fy - u*T*.82, sz = T*(.034 - s*.008)*(1 - u*.4), al = Math.sin(Math.min(1, u*1.2)*Math.PI)*(1 - s*.28);
      ctx.globalAlpha = al; ctx.fillStyle = s ? '#8a1220' : '#d4283a'; ctx.beginPath(); ctx.arc(dx, dy, sz, 0, _tau); ctx.fill();
      if (!s){ ctx.fillStyle = 'rgba(255,170,170,.8)'; ctx.beginPath(); ctx.arc(dx - sz*.3, dy - sz*.3, sz*.35, 0, _tau); ctx.fill(); }
    }
  }
  ctx.restore();
}
function auraThorns(P, cx, cy, fy, t, pass){
  const T = tile, n = 7 + P.thorns*3;
  ctx.save();
  for (let i=0;i<n;i++){
    const an = i/n*_tau + .2, sy = Math.sin(an), front = sy >= 0;
    if (front !== (pass===1)) continue;
    const pulse = .88 + .12*Math.sin(t*2.2 + i*1.7), h = T*(.13 + .05*P.thorns)*(.7 + .5*hh(4,i,56))*pulse;
    thornSpike(cx + Math.cos(an)*T*.35, fy + sy*T*.1, h, T*.034, Math.cos(an)*T*.05);
  }
  ctx.restore();
}
function auraDeath(P, cx, cy, fy, t, pass){
  if (pass===0){
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .17; ctx.drawImage(glowSprite('170,70,220'), cx - tile*.6, cy - tile*.5, tile*1.2, tile*1.2); ctx.restore(); return;
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; wisps(cx, fy, 3, t, 71, '236,200,255', '170,80,230', 1); ctx.restore();
}
function auraGold(P, cx, cy, fy, t, pass){
  if (pass===1) sparkles(cx, cy, 3, '255,214,120', t, 81, .4);
}
/* ---------- Penitent Aura: the real area on the ground (a square, like the damage), with its element living along the edge ---------- */
function auraView(){
  const now = performance.now();
  if (auraView.at && now - auraView.at < 500) return auraView.v;
  auraView.at = now; return (auraView.v = auraInfo(stats()));
}
function auraRing(A, cx, cy, t, pass){
  const T = tile, R = (A.r + .5)*T, low = _lowq(), pulse = .5 + .5*Math.sin(t*2.2);
  const rgb = {fire:'255,120,40', cold:'150,205,255', light:'190,215,255'}[A.el];
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  // a spot inside the disc that changes every cycle, so the effect travels across the whole area instead of hugging the edge
  const spot = (i, cyc, k) => { const a = hh(i*13 + cyc, k, 71)*_tau, d = Math.sqrt(hh(i*7 + cyc, k, 72))*R*.9; return [cx + Math.cos(a)*d, cy + Math.sin(a)*d*.9 + T*.1, d]; };
  if (pass===0){
    ctx.globalAlpha = .2 + .07*pulse; ctx.drawImage(glowSprite(rgb), cx - R*1.08, cy - R*1.08, R*2.16, R*2.16);
    ctx.globalAlpha = .15 + .06*pulse; ctx.drawImage(glowSprite(rgb), cx - R*.55, cy - R*.55, R*1.1, R*1.1);
    for (let k=0;k<2;k++){ const p = (t*.45 + k*.5) % 1; ctx.globalAlpha = (1-p)*.38; ctx.strokeStyle = 'rgb('+rgb+')'; ctx.lineWidth = Math.max(1.5, T*.04*(1-p)); ctx.beginPath(); ctx.arc(cx, cy, R*(.3 + .7*p), 0, _tau); ctx.stroke(); }
    ctx.globalAlpha = .3 + .12*pulse; ctx.strokeStyle = 'rgb('+rgb+')'; ctx.lineWidth = Math.max(1.5, T*.045); ctx.beginPath(); ctx.arc(cx, cy, R*.97, 0, _tau); ctx.stroke();
  }
  if (A.el==='fire'){
    const n = Math.min(low ? 18 : 46, 8 + 6*A.r*A.r), spr = flameSpr('gold'), list = [];
    for (let i=0;i<n;i++){ const ph = t*.4 + hh(i,3,73), cyc = Math.floor(ph), p = ph - cyc, [px, py, d] = spot(i, cyc, 1); list.push([px, py, d, Math.sin(p*Math.PI), i]); }
    list.sort((a,b) => a[1] - b[1]);
    ctx.globalAlpha = 1;
    for (const [px, py, d, life, i] of list){
      if ((py > cy + T*.1) !== (pass===1)) continue;
      const fk = _flick(t, i*2.3), hgt = T*(.2 + .3*(1 - d/R*.5))*life*(1 + .25*fk), wid = T*.2*(.6 + .4*life);
      if (hgt > 2) flameAt(spr, px, py, hgt, wid, fk*.12, .9);
    }
    if (pass===1) for (let i=0, m = low ? 6 : 16; i<m; i++){   // sparks climb from all over the disc
      const ph = t*.3 + hh(i,4,74), cyc = Math.floor(ph), p = ph - cyc, [px, py] = spot(i, cyc, 2), r = T*.028;
      ctx.globalAlpha = Math.sin(p*Math.PI)*.9; ctx.drawImage(glowSprite(p < .5 ? '255,215,120' : '255,100,40'), px + Math.sin(t*2 + i)*T*.05 - r*2, py - p*T*1.1 - r*2, r*4, r*4);
    }
  } else if (A.el==='cold'){
    const n = Math.min(low ? 8 : 22, 4 + 4*A.r*A.r), list = [];
    for (let i=0;i<n;i++){ const [px, py] = spot(i, 0, 3); list.push([px, py, i]); }
    list.sort((a,b) => a[1] - b[1]);
    if (pass===0) for (let k=0, m = low ? 3 : 4 + 2*A.r; k<m; k++){   // cold mist drifts over the floor
      const [mx, my] = spot(k, Math.floor(t*.12 + hh(k,5,75)), 4), s = T*(.5 + .3*hh(k,6,76));
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .1 + .05*Math.sin(t + k); ctx.drawImage(glowSprite('205,232,255'), mx - s, my - s*.45, s*2, s*.9);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    for (const [px, py, i] of list){ if ((py > cy + T*.1) !== (pass===1)) continue; iceCrystal(px, py, T*(.12 + .1*hh(i,7,77)), T*.05, t, i); }
    ctx.globalCompositeOperation = 'lighter';
    if (pass===1){ sparkles(cx, cy, low ? 3 : 4 + 2*A.r, '200,235,255', t, 61, A.r + .5);
      for (let i=0, m = low ? 4 : 10; i<m; i++){ const p = (t*.2 + hh(i,8,78)) % 1, [px, py] = spot(i, 0, 5), r = T*.028; ctx.globalAlpha = Math.sin(p*Math.PI)*.8; ctx.drawImage(glowSprite('225,245,255'), px - r*2, py - T*.8 + p*T*.9 - r*2, r*4, r*4); } }
  } else {
    const bucket = Math.floor(t*9);
    for (let j=0, k = 2 + 2*A.r; j<k; j++){
      const sd = bucket*11 + j; if (hh(sd,j,76) > .6) continue;
      const a0 = hh(sd,j,77)*_tau, d0 = Math.sqrt(hh(sd,j,78))*R*.75, x0 = cx + Math.cos(a0)*d0, y0 = cy + Math.sin(a0)*d0*.9 + T*.1;
      const a1 = a0 + (hh(sd,j,79) - .5)*2, d1 = Math.min(R*.95, d0 + R*.35), x1 = cx + Math.cos(a1)*d1, y1 = cy + Math.sin(a1)*d1*.9 + T*.1;
      if ((j%2)===pass) arcBolt(x0, y0, x1, y1, sd, T*.1, .9);
      if (pass===0){ ctx.globalAlpha = .5; ctx.drawImage(glowSprite('190,220,255'), x1 - T*.12, y1 - T*.12, T*.24, T*.24); }
    }
  }
  ctx.restore();
}
function playerAura(x, y, time, pass){
  const P = buildProfile(); if (!P.any) return;
  const T = tile, cx = (x+.5)*T, cy = (y+.5)*T, fy = cy + T*.31, t = reduce ? 0 : time;
  ctx.save();
  { const A = auraView(); if (A && S.enemies.length) auraRing(A, cx, cy, t, pass); }
  if (S.stone > 0) stoneSkinFx(cx, cy, t, S.stone, pass);
  if (pass===0) auraGlyph(P, cx, fy, t);
  if (P.fire) auraFire(P, cx, cy, fy, t, pass);
  if (P.cold) auraCold(P, cx, cy, fy, t, pass);
  if (P.light) auraLight(P, cx, cy, fy, t, pass);
  if (P.vamp) auraVamp(P, cx, cy, fy, t, pass);
  if (P.thorns) auraThorns(P, cx, cy, fy, t, pass);
  if (P.death) auraDeath(P, cx, cy, fy, t, pass);
  if (P.gold || P.kind==='gold') auraGold(P, cx, cy, fy, t, pass);
  ctx.restore();
}
// while the hero moves, the build leaves a trail behind it
function playerTrail(dt){
  if (!S || !S.player || S.dead || !S.equip) return;
  const p = S.player, d = Math.hypot(p.x - p.rx, p.y - p.ry); if (d < .25) return;
  const P = buildProfile(); if (!P.any) return;
  const T = tile, x = (p.rx + .5)*T, y = (p.ry + .5)*T + T*.2, n = Math.max(1, Math.round(dt*60*Math.min(1, d)));
  const o = {
    fire:{c:'255,190,70', c2:'220,60,24', add:true, z0:.08, z1:.01, l0:.25, l1:.6, g:-1.1, s0:.1, s1:.5},
    cold:{c:'215,240,255', c2:'140,200,255', add:true, z0:.06, z1:.01, l0:.3, l1:.7, g:.5, s0:.1, s1:.5, kind:'shard', z0s:.03},
    light:{c:'190,220,255', add:true, z0:.04, z1:.01, l0:.12, l1:.3, s0:1, s1:3, kind:'streak'},
    vamp:{c:'176,22,36', z0:.05, z1:.01, l0:.4, l1:.8, g:1.2, s0:.1, s1:.5, al:.8},
    thorns:{c:'130,210,120', add:true, z0:.05, z1:.01, l0:.3, l1:.6, g:-.4, s0:.1, s1:.6},
    death:{c:'190,110,240', c2:'120,50,180', add:true, z0:.07, z1:.02, l0:.5, l1:1, g:-.9, s0:.05, s1:.4},
    gold:{c:'240,205,120', add:true, z0:.05, z1:.01, l0:.3, l1:.6, g:-.4, s0:.1, s1:.5}
  }[P.kind];
  emitP(n, Object.assign({x, y, r:.14}, o, o.kind==='shard' ? {z0:.03, z1:.01} : {}));
}

/* ---------- other pieces ---------- */
// frozen in time: ice grows up around the piece
function drawFrozenFx(x, y, time){
  const T = tile, cx = (x+.5)*T, cy = (y+.5)*T, fy = cy + T*.3, t = reduce ? 0 : time;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .3; ctx.drawImage(glowSprite('140,205,255'), cx - T*.6, cy - T*.55, T*1.2, T*1.2); ctx.restore();
  ctx.save();
  const spots = [[-.34,.03,.34,.06],[-.18,.1,.24,.045],[.1,.12,.3,.05],[.3,.04,.4,.065],[.4,.09,.22,.04],[-.42,.1,.2,.04]];
  spots.forEach(([dx, dy, h, w], i) => iceCrystal(cx + dx*T, fy + dy*T, h*T, w*T*1.1, t, i + x*3 + y));
  ctx.restore();
  ctx.save(); sparkles(cx, cy, 3, '210,238,255', t, 91 + x*7 + y, .38); ctx.restore();
}
// elites, bosses, the horde, rift pieces and spectral allies each carry a living aura (drawn over the piece)
function pieceAura(o, x, y, time){
  const T = tile, cx = (x+.5)*T, cy = (y+.5)*T, fy = cy + T*.3, t = reduce ? 0 : time, seed = (x*5 + y*11)|0;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (o.boss){
    const holy = o.holy, hot = holy ? '255,240,190' : '255,200,110', cool = holy ? '230,190,90' : '230,50,30';
    risingEmbers(cx, fy, _lowq() ? 4 : 8, t, seed + 1, hot, cool, 1.25);
    if (!holy && !_lowq()){ const spr = flameSpr('red'); for (let i=0;i<4;i++){ const an = i/4*_tau + .6, fk = _flick(t, i*1.9 + seed); flameAt(spr, cx + Math.cos(an)*T*.46, fy + Math.sin(an)*T*.12, T*(.3 + .08*fk), T*.24, fk*.14, .8); } }
    else if (holy) wisps(cx, fy, 3, t, seed + 2, '255,248,210', '240,200,110', 1.2);
  } else if (o.horde) risingEmbers(cx, fy, _lowq() ? 2 : 4, t, seed + 3, '255,214,120', '255,90,34', .85);
  else if (o.elite) sparkles(cx, cy, 3, '255,214,120', t, seed + 4, .4);
  else if (o.rift) wisps(cx, fy, 2, t, seed + 5, '230,205,255', '150,100,230', .9);
  else if (o.spectral) wisps(cx, fy, 2, t, seed + 6, '235,246,255', '150,190,240', .9);
  ctx.restore();
}
// marked for loot: a gold gem turns above the piece, shedding glints, with a warm pool of light at its feet
function markGlyph(x, y, time){
  const T = tile, cx = (x+.5)*T, fy = (y+.5)*T + T*.3, t = reduce ? 0 : time, s = T*.125, hy = y*T + T*.16 + (reduce ? 0 : Math.sin(t*2.4 + x)*T*.02), sx = Math.cos(t*2.2 + x);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = .3 + .1*Math.sin(t*3); ctx.drawImage(glowSprite('255,200,90'), cx - T*.45, fy - T*.12, T*.9, T*.24);
  ctx.globalAlpha = .6 + .2*Math.sin(t*4); ctx.drawImage(glowSprite('255,210,100'), cx - s*3.2, hy - s*3.2, s*6.4, s*6.4);
  risingEmbers(cx, fy, 3, t, (x*7 + y*3)|0, '255,236,170', '255,190,70', .8);
  ctx.restore();
  ctx.save(); ctx.translate(cx, hy); ctx.scale(sx, 1); ctx.lineJoin = 'round';
  const P = [[0, -s*1.25], [s*.95, -s*.2], [0, s*1.15], [-s*.95, -s*.2]];
  const fac = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.fill(); };
  fac([P[0], P[3], P[2]], '#ffe9a6'); fac([P[0], P[1], P[2]], '#d8962a'); fac([P[0], P[3], [0, -s*.2], P[1]], 'rgba(255,255,255,.35)');
  ctx.strokeStyle = '#4a2d08'; ctx.lineWidth = Math.max(1, s*.18); ctx.beginPath(); P.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[2][0], P[2][1]); ctx.stroke();
  ctx.restore();
  const g = Math.pow(Math.max(0, Math.sin(t*1.9 + x*2)), 12); if (g > .05) twinkle(cx + s*.3, hy - s*.5, s*1.2, '255,240,190', g);
}
// judged: a golden sentence falls on the piece: a column of light from above, a seal turning at its feet, a sword hanging over its head and one pip for each turn left
function judgedRing(x, y, time, n){
  const T = tile, cx = (x+.5)*T, fy = (y+.5)*T + T*.3, t = reduce ? 0 : time, pu = .5 + .5*Math.sin(t*2.6);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const top = y*T - T*.3, bw = T*.5, g = ctx.createLinearGradient(0, top, 0, fy);
  g.addColorStop(0, 'rgba(255,230,150,0)'); g.addColorStop(.5, `rgba(255,226,140,${.05 + .025*pu})`); g.addColorStop(1, 'rgba(255,238,175,.13)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - bw*.2, top); ctx.lineTo(cx + bw*.2, top); ctx.lineTo(cx + bw*.5, fy); ctx.lineTo(cx - bw*.5, fy); ctx.closePath(); ctx.fill();
  risingEmbers(cx, fy, 2, t, (x*5 + y*9)|0, '255,244,190', '255,200,90', .9);
  ctx.save(); ctx.translate(cx, fy + T*.02); ctx.scale(1, .34);
  const R = T*.46; ctx.globalAlpha = .22 + .08*pu; ctx.drawImage(glowSprite('255,214,120'), -R*1.2, -R*1.2, R*2.4, R*2.4);
  ctx.strokeStyle = 'rgba(255,226,150,.9)'; ctx.lineWidth = T*.035; ctx.lineCap = 'round'; ctx.globalAlpha = .5;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, _tau); ctx.stroke();
  ctx.save(); ctx.rotate(t*.8); ctx.setLineDash([R*.16, R*.1]); ctx.beginPath(); ctx.arc(0, 0, R*.74, 0, _tau); ctx.stroke(); ctx.restore();
  ctx.beginPath(); for (let i=0;i<8;i++){ const an = i/8*_tau - t*.4; ctx.moveTo(Math.cos(an)*R*.9, Math.sin(an)*R*.9); ctx.lineTo(Math.cos(an)*R*1.06, Math.sin(an)*R*1.06); } ctx.stroke();
  ctx.save(); ctx.rotate(-t*.9); ctx.beginPath(); for (let i=0;i<4;i++){ const an = i/4*_tau; i ? ctx.lineTo(Math.cos(an)*R*.55, Math.sin(an)*R*.55) : ctx.moveTo(Math.cos(an)*R*.55, Math.sin(an)*R*.55); } ctx.closePath(); ctx.stroke(); ctx.restore();
  ctx.restore();
  ctx.restore();
  // the sword hangs point-down over the head
  const s = T*.105, hy = y*T + T*.2 + (reduce ? 0 : Math.sin(t*2.2)*T*.02);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .25 + .1*pu; ctx.drawImage(glowSprite('255,220,130'), cx - s*2.2, hy - s*1.9, s*4.4, s*4.4); ctx.restore();
  ctx.save(); ctx.translate(cx, hy); ctx.lineJoin = 'round'; ctx.strokeStyle = '#3a2408'; ctx.lineWidth = Math.max(1, s*.2);
  const bl = ctx.createLinearGradient(0, -s*.2, 0, s*1.7); bl.addColorStop(0, '#fff6d0'); bl.addColorStop(1, '#e8b84a');
  ctx.fillStyle = bl; ctx.beginPath(); ctx.moveTo(0, s*1.7); ctx.lineTo(-s*.3, -s*.2); ctx.lineTo(s*.3, -s*.2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8b84a'; ctx.fillRect(-s*.75, -s*.42, s*1.5, s*.22); ctx.strokeRect(-s*.75, -s*.42, s*1.5, s*.22);
  ctx.fillRect(-s*.1, -s*1.0, s*.2, s*.6); ctx.strokeRect(-s*.1, -s*1.0, s*.2, s*.6);
  ctx.beginPath(); ctx.arc(0, -s*1.12, s*.17, 0, _tau); ctx.fill(); ctx.stroke();
  ctx.restore();
  for (let i=0;i<(n||0);i++){ const px = (x+.9)*T, py = y*T + T*.12 + i*T*.075; ctx.fillStyle = '#ffe08a'; ctx.strokeStyle = '#3a2408'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, T*.025, 0, _tau); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

/* ---------- unique-item powers on the board: banner, mines, shadows, deathmark ---------- */
function areaView(){
  const now = performance.now();
  if (areaView.at && now - areaView.at < 500) return areaView.v;
  areaView.at = now; return (areaView.v = areaOf(stats()));
}
// the Standard: a pole with cloth that waves, and the square it covers
function drawStandardFx(sx, sy, r, time){
  const T = tile, t = reduce ? 0 : time, mx = (sx+.5)*T, my = (sy+.5)*T, R = (r+.5)*T, base = my + T*.36, top = base - T*.64;
  ctx.save();
  const pu = .5 + .5*Math.sin(t*2);
  for (let dy=-r; dy<=r; dy++) for (let dx=-r; dx<=r; dx++){   // every covered square is tinted
    const tx = sx + dx, ty = sy + dy; if (!inb(tx,ty) || isWall(tx,ty)) continue;
    ctx.globalAlpha = .1 + .05*pu + (dx||dy ? 0 : .08); ctx.fillStyle = 'rgb(255,200,100)'; ctx.fillRect(tx*T + T*.04, ty*T + T*.04, T*.92, T*.92);
  }
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .1 + .04*pu; ctx.drawImage(glowSprite('255,205,110'), mx - R*1.1, my - R*1.1, R*2.2, R*2.2);
  ctx.globalCompositeOperation = 'source-over';
  ctx.setLineDash([T*.16, T*.12]); ctx.lineDashOffset = -t*T*.2; ctx.strokeStyle = 'rgba(255,215,130,.75)'; ctx.lineWidth = Math.max(1.5, T*.045);
  ctx.strokeRect(mx - R + T*.05, my - R + T*.05, R*2 - T*.1, R*2 - T*.1); ctx.setLineDash([]);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .5; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(mx, base, T*.13, T*.045, 0, 0, _tau); ctx.fill();
  ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.strokeStyle = '#5a4630'; ctx.lineWidth = Math.max(2, T*.05); ctx.beginPath(); ctx.moveTo(mx, base); ctx.lineTo(mx, top); ctx.stroke();
  const w = T*.36, h = T*.24, wave = u => Math.sin(t*4 + u*4)*T*.035*u;
  ctx.fillStyle = '#b3261e'; ctx.strokeStyle = '#e3b456'; ctx.lineWidth = Math.max(1, T*.02); ctx.beginPath(); ctx.moveTo(mx, top + T*.02);
  for (let i=0;i<=6;i++){ const u = i/6; ctx.lineTo(mx + u*w, top + T*.02 + wave(u)); }
  for (let i=6;i>=0;i--){ const u = i/6; ctx.lineTo(mx + u*w*.94, top + h*(1 - .18*u) + wave(u)); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e3b456'; ctx.beginPath(); ctx.arc(mx, top - T*.01, T*.035, 0, _tau); ctx.fill();
  ctx.restore();
}
// a mine: a dark disc with a blinking red light
function drawMineFx(x, y, time){
  const T = tile, t = reduce ? 0 : time, cx = (x+.5)*T, cy = (y+.5)*T + T*.2, blink = Math.sin(t*5 + x*2 + y) > .35;
  ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(cx, cy + T*.03, T*.2, T*.08, 0, 0, _tau); ctx.fill();
  ctx.globalAlpha = 1; ctx.fillStyle = '#2b2622'; ctx.strokeStyle = '#6b5f52'; ctx.lineWidth = Math.max(1, T*.025); ctx.beginPath(); ctx.ellipse(cx, cy, T*.18, T*.075, 0, 0, _tau); ctx.fill(); ctx.stroke();
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = blink ? .95 : .35; ctx.drawImage(glowSprite('255,70,40'), cx - T*.1, cy - T*.1, T*.2, T*.2);
  ctx.restore();
}
// a shadow: the hero's trace waiting on the square it left
function drawShadowFx(x, y, time){
  const T = tile, t = reduce ? 0 : time, cx = (x+.5)*T, cy = (y+.5)*T, fy = cy + T*.3;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = .4 + .12*Math.sin(t*3); ctx.drawImage(glowSprite('110,50,170'), cx - T*.4, cy - T*.4, T*.8, T*.8);
  wisps(cx, fy, 4, t, (x*5 + y)|0, '200,150,255', '110,60,190', .8);
  sparkles(cx, cy, 2, '190,140,255', t, 91, .3);
  ctx.restore();
}
// the Deathmark: a red crosshair turning around the marked piece
function deathMarkGlyph(x, y, time){
  const T = tile, t = reduce ? 0 : time, cx = (x+.5)*T, cy = (y+.5)*T, R = T*.46;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  ctx.globalAlpha = .75 + .2*Math.sin(t*5); ctx.strokeStyle = 'rgb(255,80,60)'; ctx.lineWidth = Math.max(1.5, T*.035);
  ctx.setLineDash([T*.2, T*.12]); ctx.lineDashOffset = -t*T*.4; ctx.beginPath(); ctx.arc(cx, cy, R, 0, _tau); ctx.stroke(); ctx.setLineDash([]);
  for (let i=0;i<4;i++){ const an = i*Math.PI/2 + t*.6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an)*R*.78, cy + Math.sin(an)*R*.78); ctx.lineTo(cx + Math.cos(an)*R*1.18, cy + Math.sin(an)*R*1.18); ctx.stroke(); }
  ctx.globalAlpha = .3; ctx.drawImage(glowSprite('255,70,50'), cx - R*1.3, cy - R*1.3, R*2.6, R*2.6);
  ctx.restore();
}

// Stone Skin: rock plates grow around the hero, one for each charge
function rockAt(px, py, s, seed, a){
  ctx.save(); ctx.translate(px, py); ctx.rotate(hh(seed,1,81)*_tau); ctx.globalAlpha = a;
  const pts = [], m = 6; for (let k=0;k<m;k++){ const an = k/m*_tau, rr = s*(.75 + .4*hh(seed,k,82)); pts.push([Math.cos(an)*rr, Math.sin(an)*rr*.85]); }
  const g = ctx.createLinearGradient(-s, -s, s, s); g.addColorStop(0, '#a79d8e'); g.addColorStop(1, '#4b453e');
  ctx.fillStyle = g; ctx.strokeStyle = '#25211d'; ctx.lineWidth = Math.max(1, s*.18); ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(235,225,205,.55)'; ctx.lineWidth = Math.max(1, s*.1); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[2][0], pts[2][1]); ctx.stroke();
  ctx.restore();
}
function stoneSkinFx(cx, cy, t, n, pass){
  const T = tile, fy = cy + T*.3;
  ctx.save();
  if (pass===0){ ctx.globalAlpha = .12*n; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite('190,175,150'), cx - T*.5, fy - T*.2, T, T*.4); }
  const total = 2 + n*2;   // 4, 6, 8 rocks: the more charges, the thicker the shell
  for (let i=0;i<total;i++){
    const an = i/total*_tau + t*(.35 + .1*n), sy = Math.sin(an), front = sy >= 0;
    if (front !== (pass===1)) continue;
    const rad = T*(.3 + .03*n), px = cx + Math.cos(an)*rad, py = cy + T*.05 + sy*T*.12 + Math.sin(t*1.6 + i)*T*.02;
    rockAt(px, py, T*(.07 + .018*n + .02*hh(i,n,83)), i + n*10, 1);
  }
  ctx.restore();
}
