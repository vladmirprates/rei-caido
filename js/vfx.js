/* Rei Caído — skill effects drawn by hand, one per ascension skill (no reuse of the generic beam/ring).
   vfx(kind, x1,y1, x2,y2, opts) queues an effect; drawVfx() paints them over the board each frame (render.js). */

const VFX_DUR = {lance:.6, claw:.6, wall:.7, boulder:.85, forgeburst:.9, judgment:.8, holy:1, poison:.8, bloodburst:.7, frost:.9, shadow:.6, xslash:.45, thrust:.45, crown:1, hand:.9};
const VFX_N = {claw:6, wall:16, boulder:14, forgeburst:12, holy:14, poison:16, bloodburst:18, frost:20, shadow:10, crown:8, hand:12};

function vfx(kind, x1, y1, x2, y2, o){
  if (!fx.vfx) fx.vfx = [];
  const v = Object.assign({kind, x1, y1, x2:x2===undefined ? x1 : x2, y2:y2===undefined ? y1 : y2, t:0, dur:VFX_DUR[kind] || .6, p:[]}, o || {});
  for (let i=0; i<(VFX_N[kind]||8); i++) v.p.push({a:Math.random()*Math.PI*2, s:.4 + Math.random()*.9, r:Math.random(), d:Math.random()*.25});
  fx.vfx.push(v);
}
const vfxTick = dt => { if (!fx.vfx) return; for (const v of fx.vfx) v.t += dt; fx.vfx = fx.vfx.filter(v => v.t < v.dur); };

const _out = t => 1 - (1-t)*(1-t), _cl = t => Math.max(0, Math.min(1, t));
function _tri(c, x, y, ang, len, w, fill){ c.save(); c.translate(x,y); c.rotate(ang); c.fillStyle = fill; c.beginPath(); c.moveTo(len, 0); c.lineTo(0, -w); c.lineTo(0, w); c.closePath(); c.fill(); c.restore(); }
function _flame(c, x, y, h, w, t, col){
  const g = c.createLinearGradient(x, y, x, y-h); g.addColorStop(0, `rgba(${col[0]},.95)`); g.addColorStop(.6, `rgba(${col[1]},.8)`); g.addColorStop(1, `rgba(${col[2]},0)`);
  c.fillStyle = g; c.beginPath(); c.moveTo(x-w, y);
  c.quadraticCurveTo(x-w*1.1, y-h*.45, x+Math.sin(t*9)*w*.5, y-h); c.quadraticCurveTo(x+w*1.1, y-h*.45, x+w, y); c.closePath(); c.fill();
}

const VFX_DRAW = {
  // Lancer: a real spear flies and sticks in the target
  lance(c, v, p, f, s, e){
    const q = _cl(p/.3), ang = Math.atan2(e[1]-s[1], e[0]-s[0]), ox = s[0]+(e[0]-s[0])*q, oy = s[1]+(e[1]-s[1])*q, L = tile*1.2;
    c.save(); c.globalAlpha = f; c.translate(ox, oy); c.rotate(ang);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; for (const k of [-.12, .12]){ c.beginPath(); c.moveTo(-L*1.3, tile*k); c.lineTo(-L*.4, tile*k); c.stroke(); }
    c.strokeStyle = '#2a1a10'; c.lineWidth = Math.max(5, tile*.095); c.lineCap = 'round'; c.beginPath(); c.moveTo(-L, 0); c.lineTo(0, 0); c.stroke();
    c.strokeStyle = '#8a6a44'; c.lineWidth = Math.max(3, tile*.06); c.beginPath(); c.moveTo(-L, 0); c.lineTo(0, 0); c.stroke();
    c.fillStyle = '#d8e2ee'; c.strokeStyle = '#5a6a7a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tile*.34, 0); c.lineTo(0, -tile*.1); c.lineTo(-tile*.04, 0); c.lineTo(0, tile*.1); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#c0392b'; const w = Math.sin(p*30)*tile*.04; c.beginPath(); c.moveTo(-L*.62, 0); c.lineTo(-L*.95, -tile*.13+w); c.lineTo(-L*.8, 0); c.lineTo(-L*.95, tile*.13+w); c.closePath(); c.fill();
    c.restore();
    if (p > .3){ const k = (p-.3)/.7; c.save(); c.strokeStyle = `rgba(255,235,190,${(1-k)*f})`; c.lineWidth = 2;
      for (const a of v.p){ const r = tile*(.15 + k*.55*a.s); c.beginPath(); c.moveTo(e[0]+Math.cos(a.a)*r*.4, e[1]+Math.sin(a.a)*r*.4); c.lineTo(e[0]+Math.cos(a.a)*r, e[1]+Math.sin(a.a)*r); c.stroke(); } c.restore(); }
  },
  // Dread Knight: claw slashes at each target, blood wisps flow back to the knight
  claw(c, v, p, f, s, e){
    c.save(); c.lineCap = 'round';
    const k = _cl(p/.35);
    for (let i=0;i<3;i++){ const ox = (i-1)*tile*.13, len = tile*.55*_out(_cl(k*1.4 - i*.15));
      c.strokeStyle = `rgba(150,10,25,${f})`; c.lineWidth = Math.max(3, tile*.06); c.beginPath(); c.moveTo(e[0]-tile*.25+ox, e[1]-tile*.3); c.lineTo(e[0]-tile*.25+ox+len*.55, e[1]-tile*.3+len); c.stroke();
      c.strokeStyle = `rgba(255,120,110,${f})`; c.lineWidth = 1.2; c.stroke(); }
    if (p > .3){ const m = (p-.3)/.7; for (const a of v.p){ const q = _cl(m*1.2 - a.d), x = e[0]+(s[0]-e[0])*q + Math.sin(q*6+a.a)*tile*.12, y = e[1]+(s[1]-e[1])*q + Math.cos(q*6+a.a)*tile*.12;
      c.fillStyle = `rgba(190,25,40,${(1-q)*.9})`; c.beginPath(); c.arc(x, y, tile*.04*(1+a.r), 0, Math.PI*2); c.fill(); } }
    c.restore();
  },
  // Bulwark: stone blocks thrust up around the tower and push out
  wall(c, v, p, f, s){
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]], rise = _out(_cl(p/.3));
    for (const [dx,dy] of dirs){
      const cx = s[0]+dx*tile*(.85 + _cl((p-.25)/.5)*.15), cy = s[1]+dy*tile*(.85 + _cl((p-.25)/.5)*.15), w = tile*.5, h = tile*.5*rise;
      c.save(); c.globalAlpha = f; c.fillStyle = '#7a8492'; c.strokeStyle = '#2f3640'; c.lineWidth = 1.5;
      c.fillRect(cx-w/2, cy+tile*.2-h, w, h); c.strokeRect(cx-w/2, cy+tile*.2-h, w, h);
      c.strokeStyle = 'rgba(30,35,45,.7)'; c.beginPath(); c.moveTo(cx-w/2, cy+tile*.2-h/2); c.lineTo(cx+w/2, cy+tile*.2-h/2); c.moveTo(cx, cy+tile*.2-h); c.lineTo(cx, cy+tile*.2-h/2); c.stroke();
      c.fillStyle = '#a9b4c4'; c.fillRect(cx-w/2, cy+tile*.2-h, w, Math.max(2, h*.14));
      c.restore();
    }
    for (const a of v.p){ const r = tile*(.5 + p*.9*a.s); c.fillStyle = `rgba(190,175,150,${(1-p)*.4})`; c.beginPath(); c.arc(s[0]+Math.cos(a.a)*r, s[1]+tile*.15+Math.sin(a.a)*r*.5, tile*.09*(1+a.r), 0, Math.PI*2); c.fill(); }
  },
  // Siegebreaker: a boulder lobbed on a high arc with a ground shadow; debris and rubble on impact
  boulder(c, v, p, f, s, e){
    const q = _cl(p/.55), x = s[0]+(e[0]-s[0])*q, gy = s[1]+(e[1]-s[1])*q, hgt = Math.sin(q*Math.PI)*tile*1.7;
    if (p < .55){
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, gy+tile*.15, tile*.2, tile*.07, 0, 0, Math.PI*2); c.fill();
      c.save(); c.translate(x, gy-hgt); c.rotate(q*9); const r = tile*.2; c.fillStyle = '#6d6358'; c.strokeStyle = '#2a251f'; c.lineWidth = 1.5;
      c.beginPath(); for (let i=0;i<7;i++){ const a = i/7*Math.PI*2, rr = r*(.8 + ((i*37)%5)/12); c.lineTo(Math.cos(a)*rr, Math.sin(a)*rr); } c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(-r*.3, -r*.3, r*.3, 0, Math.PI*2); c.fill(); c.restore();
    } else {
      const k = (p-.55)/.45, R = tile*(v.r||1);
      c.fillStyle = `rgba(30,22,16,${.55*f})`; c.beginPath(); c.ellipse(e[0], e[1]+tile*.12, tile*.38, tile*.15, 0, 0, Math.PI*2); c.fill();
      c.strokeStyle = `rgba(190,170,140,${(1-k)*.8})`; c.lineWidth = 3; c.beginPath(); c.ellipse(e[0], e[1]+tile*.12, tile*(.3+k*(.5+R/tile*.5)), tile*(.12+k*.25), 0, 0, Math.PI*2); c.stroke();
      for (const a of v.p){ const px = e[0]+Math.cos(a.a)*tile*.9*a.s*k, py = e[1]-Math.sin(k*Math.PI)*tile*.7*a.s + Math.sin(a.a)*tile*.25*k;
        c.fillStyle = `rgba(110,98,86,${1-k})`; c.fillRect(px, py, tile*.07*(1+a.r), tile*.07*(1+a.r)); }
    }
  },
  // Forgemaster: cracks split the floor and pillars of fire rise from the cells
  forgeburst(c, v, p, f, s){
    const k = _out(_cl(p/.4));
    c.save(); c.lineCap = 'round';
    for (let i=0;i<8;i++){ const a = i/8*Math.PI*2, len = tile*(.4 + k*(v.r||1.3)); let x = s[0], y = s[1]; c.strokeStyle = `rgba(255,130,40,${f})`; c.lineWidth = Math.max(2, tile*.05); c.beginPath(); c.moveTo(x,y);
      for (let j=1;j<=4;j++){ const aa = a + Math.sin(i*7+j*3)*.25; x = s[0]+Math.cos(aa)*len*j/4; y = s[1]+Math.sin(aa)*len*j/4*.8; c.lineTo(x,y); } c.stroke();
      c.strokeStyle = `rgba(255,230,150,${f})`; c.lineWidth = 1; c.stroke(); }
    c.restore();
    const cells = v.cells || [];
    cells.forEach(([x,y], i) => { const [fx0,fy0] = sqCenter(x,y), st = _cl((p - (i%5)*.03)/.3), h = tile*(.35 + .55*st)*(1 - _cl((p-.7)/.3)*.6); if (st>0) _flame(c, fx0, fy0+tile*.25, h, tile*.17, v.t + i, [['255,210,90','255,110,30','200,40,10']][0]); });
    c.fillStyle = `rgba(255,150,50,${.35*(1-p)})`; c.beginPath(); c.ellipse(s[0], s[1]+tile*.2, tile*(.5+k), tile*(.2+k*.4), 0, 0, Math.PI*2); c.fill();
  },
  // Inquisitor: a column of holy light falls on the sinner and a cross is branded on it
  judgment(c, v, p, f, s, e){
    const k = _out(_cl(p/.25)), w = tile*(.55*(1 - _cl((p-.35)/.65)*.8) + .06);
    const g = c.createLinearGradient(e[0], e[1]-tile*5, e[0], e[1]+tile*.2); g.addColorStop(0, 'rgba(255,240,190,0)'); g.addColorStop(.8, `rgba(255,225,140,${.85*f})`); g.addColorStop(1, `rgba(255,255,255,${f})`);
    c.fillStyle = g; c.fillRect(e[0]-w/2, e[1]-tile*5*k, w, tile*5*k+tile*.2);
    c.save(); c.strokeStyle = `rgba(255,236,170,${f})`; c.lineWidth = Math.max(3, tile*.07); c.lineCap = 'round';
    const cr = tile*.3*_out(_cl((p-.2)/.25)), cy = e[1]-tile*.1; c.beginPath(); c.moveTo(e[0], cy-cr); c.lineTo(e[0], cy+cr*1.1); c.moveTo(e[0]-cr*.7, cy-cr*.25); c.lineTo(e[0]+cr*.7, cy-cr*.25); c.stroke(); c.restore();
    c.strokeStyle = `rgba(255,225,140,${f*.8})`; c.lineWidth = 2; c.beginPath(); c.ellipse(e[0], e[1]+tile*.2, tile*(.25+p*.6), tile*(.1+p*.22), 0, 0, Math.PI*2); c.stroke();
    if (v.exec && p > .3){ c.fillStyle = `rgba(20,10,0,${.5*(1-p)})`; c.beginPath(); c.arc(e[0], e[1], tile*.5, 0, Math.PI*2); c.fill(); }
  },
  // Saint: rotating rays, rising feathers, a wide halo on the floor
  holy(c, v, p, f, s){
    const rays = 12; c.save(); c.translate(s[0], s[1]); c.rotate(p*1.2);
    for (let i=0;i<rays;i++){ const a = i/rays*Math.PI*2; _tri(c, 0, 0, a, tile*(.6 + _out(_cl(p/.5))*.9), tile*.06, `rgba(255,232,150,${.45*f})`); }
    c.restore();
    c.strokeStyle = `rgba(255,236,170,${f*.85})`; c.lineWidth = 3; c.beginPath(); c.ellipse(s[0], s[1]+tile*.22, tile*(.35+p*1.6), tile*(.14+p*.6), 0, 0, Math.PI*2); c.stroke();
    c.strokeStyle = `rgba(255,255,255,${f*.6})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(s[0], s[1]+tile*.22, tile*(.25+p*1.2), tile*(.1+p*.45), 0, 0, Math.PI*2); c.stroke();
    for (const a of v.p){ const x = s[0]+Math.cos(a.a)*tile*.7*a.s*_cl(p*1.4), y = s[1]+tile*.25 - p*tile*(.9+a.r*.8) + Math.sin(p*6+a.a)*tile*.05;
      c.fillStyle = `rgba(255,255,245,${f*(1-p*.5)})`; c.beginPath(); c.ellipse(x, y, tile*.03, tile*.075, a.a, 0, Math.PI*2); c.fill(); }
  },
  // Heretic: a sickly cloud rolls toward the target, bubbles pop, a skull of smoke forms
  poison(c, v, p, f, s, e){
    const q = _cl(p/.5);
    for (const a of v.p){ const t0 = _cl(q - a.d), x = s[0]+(e[0]-s[0])*t0 + Math.cos(a.a)*tile*.14*a.s, y = s[1]+(e[1]-s[1])*t0 + Math.sin(a.a)*tile*.14*a.s - Math.sin(p*5+a.a)*tile*.03, r = tile*(.1+a.r*.1)*(1+p);
      c.fillStyle = `rgba(110,190,70,${.5*f})`; c.beginPath(); c.arc(x, y, r, 0, Math.PI*2); c.fill();
      c.fillStyle = `rgba(190,240,120,${.5*f})`; c.beginPath(); c.arc(x-r*.3, y-r*.3, r*.35, 0, Math.PI*2); c.fill(); }
    if (p > .35){ const k = (p-.35)/.65; c.strokeStyle = `rgba(150,220,90,${(1-k)*.8})`; c.lineWidth = 2;
      for (const a of v.p.slice(0,6)){ const bx = e[0]+Math.cos(a.a)*tile*.3*a.s, by = e[1]-k*tile*.6*(.5+a.r); c.beginPath(); c.arc(bx, by, tile*.05*(1+a.r), 0, Math.PI*2); c.stroke(); } }
    if (p > .45){ const k = _cl((p-.45)/.3), sx = e[0], sy = e[1]-tile*.15 - k*tile*.2; c.globalAlpha = f*k*.75; c.fillStyle = '#c9f09a'; c.beginPath(); c.arc(sx, sy, tile*.16, 0, Math.PI*2); c.fill();
      c.fillRect(sx-tile*.08, sy+tile*.1, tile*.16, tile*.09); c.fillStyle = '#233016'; c.beginPath(); c.arc(sx-tile*.06, sy, tile*.04, 0, Math.PI*2); c.arc(sx+tile*.06, sy, tile*.04, 0, Math.PI*2); c.fill(); c.globalAlpha = 1; }
  },
  // Crimson Queen: blood bursts from the queen and crescent slashes whirl around her
  bloodburst(c, v, p, f, s){
    c.fillStyle = `rgba(160,10,30,${.45*(1-p)})`; c.beginPath(); c.ellipse(s[0], s[1]+tile*.2, tile*(.3+p*1.2), tile*(.12+p*.45), 0, 0, Math.PI*2); c.fill();
    for (const a of v.p){ const d = tile*(.2 + _out(p)*1.1*a.s), x = s[0]+Math.cos(a.a)*d, y = s[1]+Math.sin(a.a)*d*.8 + p*p*tile*.4*a.r;
      c.fillStyle = `rgba(${140+a.r*70|0},10,25,${f})`; c.beginPath(); c.ellipse(x, y, tile*.05*(1+a.r), tile*.035*(1+a.r), a.a, 0, Math.PI*2); c.fill(); }
    c.save(); c.translate(s[0], s[1]); c.lineCap = 'round';
    for (let i=0;i<3;i++){ const a0 = p*9 + i*Math.PI*2/3; c.strokeStyle = `rgba(230,40,60,${f*.9})`; c.lineWidth = Math.max(2, tile*.05); c.beginPath(); c.arc(0, 0, tile*(.5 + p*.45), a0, a0+1.05); c.stroke();
      c.strokeStyle = `rgba(255,190,190,${f*.8})`; c.lineWidth = 1; c.stroke(); }
    c.restore();
  },
  // Frost Queen: ice shards shoot out, snow drifts, hexagonal frost spreads on the floor
  frost(c, v, p, f, s){
    const R = tile*((v.r||2) + .4), k = _out(_cl(p/.45));
    c.strokeStyle = `rgba(190,230,255,${f*.8})`; c.lineWidth = 2; c.fillStyle = `rgba(200,235,255,${.15*f})`;
    c.beginPath(); for (let i=0;i<=6;i++){ const a = i/6*Math.PI*2 + .26; const x = s[0]+Math.cos(a)*R*k, y = s[1]+tile*.15+Math.sin(a)*R*k*.5; i ? c.lineTo(x,y) : c.moveTo(x,y); } c.fill(); c.stroke();
    for (const a of v.p){ const d = R*.95*k*a.s, x = s[0]+Math.cos(a.a)*d, y = s[1]+Math.sin(a.a)*d*.75;
      c.save(); c.translate(x, y); c.rotate(a.a); c.fillStyle = `rgba(215,242,255,${f})`; c.strokeStyle = `rgba(110,170,215,${f})`; c.lineWidth = 1;
      c.beginPath(); c.moveTo(tile*.2, 0); c.lineTo(0, -tile*.05); c.lineTo(-tile*.12, 0); c.lineTo(0, tile*.05); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    for (const a of v.p){ const x = s[0]+Math.cos(a.a)*R*a.s*.8 + Math.sin(p*5+a.a)*tile*.1, y = s[1]-tile*.5 + p*tile*(.8+a.r) + Math.sin(a.a)*tile*.3;
      c.fillStyle = `rgba(255,255,255,${f*.9})`; c.beginPath(); c.arc(x, y, tile*.03, 0, Math.PI*2); c.fill(); }
  },
  // Assassin: dark afterimages along the dash, smoke where she left
  shadow(c, v, p, f, s, e){
    const n = 6; for (let i=0;i<n;i++){ const q = i/(n-1), x = s[0]+(e[0]-s[0])*q, y = s[1]+(e[1]-s[1])*q, a = _cl(1 - (p*1.4 - q*.3))*.5*(i/n+.3);
      c.fillStyle = `rgba(60,30,110,${a})`; c.beginPath(); c.ellipse(x, y+tile*.05, tile*.15, tile*.27, 0, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(x, y-tile*.27, tile*.1, 0, Math.PI*2); c.fill(); }
    for (const a of v.p){ const x = s[0]+Math.cos(a.a)*tile*.5*a.s*p, y = s[1]-p*tile*.5*a.r + Math.sin(a.a)*tile*.15; c.fillStyle = `rgba(40,20,70,${.5*(1-p)})`; c.beginPath(); c.arc(x, y, tile*(.08+.1*p), 0, Math.PI*2); c.fill(); }
  },
  // Assassin / Duelist hits: crossed slashes
  xslash(c, v, p, f, s, e){
    const k = _out(_cl(p/.35)); c.save(); c.lineCap = 'round';
    for (const sg of [1,-1]){ const r = tile*.42*k, x0 = e[0]-r, x1 = e[0]+r, y0 = e[1]-sg*r, y1 = e[1]+sg*r;
      c.strokeStyle = `rgba(255,255,255,${f})`; c.lineWidth = Math.max(2.5, tile*.05); c.beginPath(); c.moveTo(x0,y0); c.lineTo(x0+(x1-x0)*k, y0+(y1-y0)*k); c.stroke();
      c.strokeStyle = `rgba(150,110,230,${f*.7})`; c.lineWidth = Math.max(5, tile*.1); c.globalCompositeOperation = 'lighter'; c.stroke(); c.globalCompositeOperation = 'source-over'; }
    c.restore();
  },
  // Duelist: a rapier lunge, a flash on the point, a ring of honor
  thrust(c, v, p, f, s, e){
    const k = _out(_cl(p/.3)), ang = Math.atan2(e[1]-s[1], e[0]-s[0]), ex = s[0]+(e[0]-s[0])*(.45+.55*k), ey = s[1]+(e[1]-s[1])*(.45+.55*k);
    c.save(); c.lineCap = 'round'; c.strokeStyle = `rgba(235,242,250,${f})`; c.lineWidth = Math.max(2, tile*.04); c.beginPath(); c.moveTo(s[0]+(e[0]-s[0])*.3, s[1]+(e[1]-s[1])*.3); c.lineTo(ex, ey); c.stroke();
    c.strokeStyle = `rgba(255,255,255,${.4*f})`; c.lineWidth = Math.max(5, tile*.1); c.stroke(); c.restore();
    if (p > .25){ const m = (p-.25)/.75; c.strokeStyle = `rgba(255,255,255,${(1-m)})`; c.lineWidth = 2; c.beginPath();
      for (let i=0;i<4;i++){ const a = i*Math.PI/2 + Math.PI/4, r = tile*(.1+m*.3); c.moveTo(e[0], e[1]); c.lineTo(e[0]+Math.cos(a)*r, e[1]+Math.sin(a)*r); } c.stroke();
      c.strokeStyle = `rgba(227,180,86,${(1-m)*.9})`; c.beginPath(); c.arc(e[0], e[1], tile*(.2+m*.4), 0, Math.PI*2); c.stroke(); }
  },
  // Regent: a golden crown rises over the king, waves of gold roll out, stars over each ally
  crown(c, v, p, f, s){
    const up = _out(_cl(p/.5)), cy = s[1]-tile*(.75+up*.35), w = tile*.28;
    c.save(); c.globalAlpha = f; c.fillStyle = '#e3b456'; c.strokeStyle = '#7a5a1c'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(s[0]-w, cy+w*.5); c.lineTo(s[0]-w, cy-w*.2); c.lineTo(s[0]-w*.5, cy+w*.1); c.lineTo(s[0], cy-w*.45); c.lineTo(s[0]+w*.5, cy+w*.1); c.lineTo(s[0]+w, cy-w*.2); c.lineTo(s[0]+w, cy+w*.5); c.closePath(); c.fill(); c.stroke();
    for (const dx of [-w, 0, w]){ c.fillStyle = '#c0392b'; c.beginPath(); c.arc(s[0]+dx, cy+w*.2, tile*.025, 0, Math.PI*2); c.fill(); }
    c.restore();
    for (let i=0;i<2;i++){ const k = _cl(p*1.3 - i*.25); c.strokeStyle = `rgba(227,180,86,${(1-k)*.8})`; c.lineWidth = 3; c.beginPath(); c.ellipse(s[0], s[1]+tile*.22, tile*(.3+k*1.7), tile*(.12+k*.7), 0, 0, Math.PI*2); c.stroke(); }
    (v.cells || []).forEach(([x,y], i) => { const [ax,ay] = sqCenter(x,y), k = _cl(p*1.4 - i*.06); c.fillStyle = `rgba(255,225,120,${(1-k)})`;
      for (let j=0;j<3;j++){ const px = ax+(j-1)*tile*.14, py = ay-k*tile*(.5+j*.12); c.beginPath(); c.moveTo(px, py-tile*.06); c.lineTo(px+tile*.03, py); c.lineTo(px, py+tile*.06); c.lineTo(px-tile*.03, py); c.closePath(); c.fill(); } });
  },
  // Necromancer: a skeletal hand claws out of the ground, violet smoke curls up
  hand(c, v, p, f, s, e){
    const up = _out(_cl(p/.45)), x = e[0], y = e[1]+tile*.25, h = tile*.55*up;
    c.save(); c.lineCap = 'round'; c.globalAlpha = f;
    c.fillStyle = 'rgba(15,5,25,.6)'; c.beginPath(); c.ellipse(x, y, tile*.32, tile*.12, 0, 0, Math.PI*2); c.fill();
    c.strokeStyle = '#e6dcc4'; c.lineWidth = Math.max(3, tile*.055); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y-h); c.stroke();
    for (let i=0;i<4;i++){ const sp = (i-1.5)*.14, curl = Math.sin(p*5+i)*.05; c.lineWidth = Math.max(1.8, tile*.03); c.beginPath(); c.moveTo(x, y-h);
      c.quadraticCurveTo(x+sp*tile*1.2, y-h-tile*.16, x+sp*tile*1.7+curl*tile, y-h-tile*(.26 - Math.abs(sp)*.5)); c.stroke(); }
    c.restore();
    for (const a of v.p){ const k = _cl(p - a.d), px = x+Math.cos(a.a)*tile*.3*a.s + Math.sin(k*6+a.a)*tile*.06, py = y-k*tile*(.5+a.r*.9);
      c.fillStyle = `rgba(150,70,215,${(1-k)*.55*f})`; c.beginPath(); c.arc(px, py, tile*(.05+.06*k), 0, Math.PI*2); c.fill(); }
  }
};

function drawVfx(){
  if (!fx.vfx || !fx.vfx.length) return;
  for (const v of fx.vfx){
    const fn = VFX_DRAW[v.kind]; if (!fn) continue;
    const p = _cl(v.t / v.dur), f = p < .72 ? 1 : Math.max(0, 1 - (p-.72)/.28);
    ctx.save(); ctx.lineJoin = 'round';
    try { fn(ctx, v, p, f, sqCenter(v.x1, v.y1), sqCenter(v.x2, v.y2)); } catch (err) { /* a broken effect must never stop the game */ }
    ctx.restore();
  }
}
