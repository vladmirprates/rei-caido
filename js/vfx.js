/* Rei Caído — skill effects drawn by hand, one per ascension skill (no reuse of the generic beam/ring).
   vfx(kind, x1,y1, x2,y2, opts) queues an effect; drawVfx() paints them over the board each frame (render.js). */

const VFX_DUR = {geyser:.9, beam:.5, hit:.45, slam:.8, shockline:.6, bladestorm:.7, shout:.8, nova:.6, summon:.9, shield:.8, shift:.6, gallop:.7, arcane:.7, shove:.5, thunder:.9, lance:.9, claw:.8, wall:.9, boulder:1.05, forgeburst:.9, judgment:1, holy:1.3, poison:1.1, bloodburst:.9, frost:1.2, shadow:.8, xslash:.5, thrust:.6, crown:1.2, hand:1.1};
const VFX_N = {thunder:8, claw:6, wall:16, boulder:14, forgeburst:12, holy:14, poison:16, bloodburst:18, frost:20, shadow:10, crown:8, hand:12};

const _line = (c, pts, w, col, a) => { c.save(); c.strokeStyle = col; c.globalAlpha = Math.max(0, Math.min(1, a)); c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.stroke(); c.restore(); };
const _glowDisk = (c, x, y, r, rgb, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); c.drawImage(glowSprite(rgb), x-r, y-r, r*2, r*2); c.restore(); };
const _ringE = (c, x, y, rx, ry, w, col) => { c.save(); c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI*2); c.stroke(); c.restore(); };
function vfx(kind, x1, y1, x2, y2, o){
  if (!fx.vfx) fx.vfx = [];
  const v = Object.assign({kind, x1, y1, x2:x2===undefined ? x1 : x2, y2:y2===undefined ? y1 : y2, t:0, dur:VFX_DUR[kind] || .6, p:[]}, o || {});
  for (let i=0; i<(VFX_N[kind]||8); i++) v.p.push({a:Math.random()*Math.PI*2, s:.4 + Math.random()*.9, r:Math.random(), d:Math.random()*.25});
  fx.vfx.push(v);
}
const vfxTick = dt => { spTick(dt); if (!fx.vfx) return; for (const v of fx.vfx) v.t += dt; fx.vfx = fx.vfx.filter(v => v.t < v.dur); };

const _out = t => 1 - (1-t)*(1-t), _cl = t => Math.max(0, Math.min(1, t));
function _tri(c, x, y, ang, len, w, fill){ c.save(); c.translate(x,y); c.rotate(ang); c.fillStyle = fill; c.beginPath(); c.moveTo(len, 0); c.lineTo(0, -w); c.lineTo(0, w); c.closePath(); c.fill(); c.restore(); }
function _flame(c, x, y, h, w, t, col){
  const g = c.createLinearGradient(x, y, x, y-h); g.addColorStop(0, `rgba(${col[0]},.95)`); g.addColorStop(.6, `rgba(${col[1]},.8)`); g.addColorStop(1, `rgba(${col[2]},0)`);
  c.fillStyle = g; c.beginPath(); c.moveTo(x-w, y);
  c.quadraticCurveTo(x-w*1.1, y-h*.45, x+Math.sin(t*9)*w*.5, y-h); c.quadraticCurveTo(x+w*1.1, y-h*.45, x+w, y); c.closePath(); c.fill();
}

// a heavy stone pillar seen from the front: a lit top, a shaded side, cracks
function _pillar(c, cx, by, w, h, a){
  const d = w*.3, x0 = cx - w/2;
  c.save(); c.globalAlpha = a;
  const g = c.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#8c8576'); g.addColorStop(1, '#4e493f');
  c.fillStyle = g; c.fillRect(x0, by - h, w, h);
  c.fillStyle = '#35312a'; c.beginPath(); c.moveTo(x0 + w, by - h); c.lineTo(x0 + w + d, by - h - d*.6); c.lineTo(x0 + w + d, by - d*.6); c.lineTo(x0 + w, by); c.closePath(); c.fill();
  c.fillStyle = '#b3ab99'; c.beginPath(); c.moveTo(x0, by - h); c.lineTo(x0 + d, by - h - d*.6); c.lineTo(x0 + w + d, by - h - d*.6); c.lineTo(x0 + w, by - h); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(20,24,32,.65)'; c.lineWidth = 1; c.strokeRect(x0, by - h, w, h);
  c.beginPath(); c.moveTo(x0 + w*.3, by - h); c.lineTo(x0 + w*.4, by - h*.62); c.lineTo(x0 + w*.27, by - h*.36); c.moveTo(x0 + w*.7, by - h*.55); c.lineTo(x0 + w*.82, by - h*.3); c.stroke();
  c.restore();
}

const VFX_DRAW = {
  // Stormcrag: a blue thunderbolt falls from the sky onto the square, the ground crackles and puddles arc
  thunder(c, v, p, f, s, e){
    if (v.t < 0) return;
    if (!v.pts){
      const sx = e[0] + (Math.random()-.5)*tile*1.6, sy = -tile*.4, n = 9, pts = [[sx, sy]];
      for (let i=1;i<n;i++){ const q = i/n, amp = tile*.34*(1-q*.45); pts.push([sx + (e[0]-sx)*q + (Math.random()-.5)*2*amp, sy + (e[1]-sy)*q]); }
      pts.push([e[0], e[1]]); v.pts = pts; v.br = [];
      for (let b=0;b<3;b++){
        const i = 2 + Math.floor(Math.random()*(n-4)), dir = Math.random()<.5 ? -1 : 1, br = [pts[i]];
        let cx = pts[i][0], cy = pts[i][1];
        for (let k=0;k<4;k++){ cx += dir*tile*(.1+Math.random()*.2); cy += tile*(.1+Math.random()*.2); br.push([cx, cy]); }
        v.br.push(br);
      }
    }
    const line = (pts, w, col, a) => { c.strokeStyle = col; c.globalAlpha = a; c.lineWidth = w; c.beginPath(); pts.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.stroke(); };
    _once(v, 's', p > .1, () => {
      emitP(18, {x:e[0], y:e[1], s0:2, s1:6.5, a:-Math.PI/2, spread:1.7, l0:.3, l1:.75, z0:.05, z1:.01, c:'185,220,255', add:true, kind:'streak', g:8});
      emitP(7, {x:e[0], y:e[1], s0:.3, s1:1.1, a:-Math.PI/2, spread:.9, l0:.7, l1:1.3, z0:.14, z1:.34, c:'60,72,96', al:.4, drag:1.4});
    });
    c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
    const fa = p < .3 ? 1 - p/.3 : 0;
    if (fa > 0){ c.globalAlpha = 1; c.fillStyle = `rgba(150,190,255,${.2*fa})`; c.fillRect(0, 0, tile*W, tile*H); }
    if (p < .55){
      const fl = Math.sin(p*95) > -.25 ? 1 : .35;
      line(v.pts, tile*.28, 'rgba(60,110,255,.3)', fl); line(v.pts, tile*.11, 'rgba(120,180,255,.8)', fl); line(v.pts, tile*.04, 'rgba(240,248,255,1)', fl);
      for (const br of v.br){ line(br, tile*.09, 'rgba(90,150,255,.5)', fl); line(br, tile*.03, 'rgba(225,240,255,.95)', fl); }
    }
    const k = _cl((p-.08)/.92);
    const g = c.createRadialGradient(e[0], e[1], 0, e[0], e[1], tile*(.45 + k*.8));
    g.addColorStop(0, `rgba(225,238,255,${.85*(1-k)})`); g.addColorStop(.4, `rgba(90,150,255,${.45*(1-k)})`); g.addColorStop(1, 'rgba(40,80,255,0)');
    c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.arc(e[0], e[1], tile*(.45 + k*.8), 0, Math.PI*2); c.fill();
    c.strokeStyle = `rgba(150,200,255,${(1-k)*.8})`; c.lineWidth = 2.5; c.beginPath(); c.ellipse(e[0], e[1] + tile*.1, tile*(.2 + k*.7), tile*(.08 + k*.28), 0, 0, Math.PI*2); c.stroke();
    // short arcs crawl on the ground around the impact
    if (p > .1){
      const arcA = (1-k) * (Math.random() < .75 ? 1 : .3);
      for (let i=0;i<5;i++){
        const a = v.p[i % v.p.length].a, r = tile*(.3 + .25*v.p[i % v.p.length].s), pts = [[e[0], e[1]]];
        for (let j=1;j<4;j++){ const u = j/4; pts.push([e[0] + Math.cos(a)*r*u + (Math.random()-.5)*tile*.14, e[1] + Math.sin(a)*r*.7*u + (Math.random()-.5)*tile*.14]); }
        line(pts, 1.6, 'rgba(170,215,255,1)', arcA);
      }
    }
    // the shock jumps from puddle to puddle: a bright arc runs along each link (nearest first) and lights the puddle it reaches
    for (const sg of (v.segs || [])){
      const q = (p - (.1 + sg.d*.055)) / .34;
      if (q < 0 || q > 1) continue;
      const aa = (1-q) * (Math.random() < .8 ? 1 : .35), [ax, ay] = sqCenter(sg.a[0], sg.a[1]), [bx, by] = sqCenter(sg.b[0], sg.b[1]), oy = tile*.06;
      const pts = [[ax, ay + oy]];
      for (let i=1;i<6;i++){ const u = i/6; pts.push([ax + (bx-ax)*u + (Math.random()-.5)*tile*.2, ay + (by-ay)*u + oy + (Math.random()-.5)*tile*.16]); }
      pts.push([bx, by + oy]);
      line(pts, tile*.16, 'rgba(70,120,255,.35)', aa); line(pts, tile*.065, 'rgba(150,200,255,.9)', aa); line(pts, tile*.024, 'rgba(255,255,255,1)', aa);
      const lg = c.createRadialGradient(bx, by + oy, 0, bx, by + oy, tile*.5); lg.addColorStop(0, `rgba(215,238,255,${.8*aa})`); lg.addColorStop(.5, `rgba(90,150,255,${.4*aa})`); lg.addColorStop(1, 'rgba(60,100,255,0)');
      c.globalAlpha = 1; c.fillStyle = lg; c.beginPath(); c.ellipse(bx, by + oy, tile*.5, tile*.3, 0, 0, Math.PI*2); c.fill();
      for (let i=0;i<3;i++){ const sx = bx + (Math.random()-.5)*tile*.5, sy = by + oy + (Math.random()-.5)*tile*.2; line([[sx, sy], [sx + (Math.random()-.5)*tile*.12, sy - tile*(.08 + Math.random()*.14)]], 1.3, 'rgba(235,246,255,1)', aa); }
    }
  },
  // Bulwark: a ring of heavy stone pillars bursts out of the ground, throwing dust and debris, with a shockwave and cracks
  wall(c, v, p, f, s){
    const T = tile, base = s[1] + T*.22;
    _once(v, 'a', true, () => {
      emitP(26, {x:s[0], y:base, s0:.8, s1:2.4, l0:.6, l1:1.1, z0:.16, z1:.45, c:'150,138,120', al:.5, drag:2.2, r:.35});
      emitP(18, {x:s[0], y:base, s0:2, s1:5, a:-Math.PI/2, spread:1.3, l0:.5, l1:.95, z0:.07, z1:.04, c:'122,126,136', kind:'shard', g:9, drag:.3});
      emitP(12, {x:s[0], y:base, s0:1.5, s1:4, a:-Math.PI/2, spread:1.5, l0:.3, l1:.55, z0:.05, z1:0, c:'255,226,170', add:true, kind:'streak', g:5});
    });
    const k = _out(_cl(p/.5));
    // shockwave of dust
    c.strokeStyle = `rgba(205,195,175,${.6*(1-k)})`; c.lineWidth = Math.max(1, T*.14*(1-k)); c.beginPath(); c.ellipse(s[0], base, T*(.4 + k*1.6), T*(.16 + k*.65), 0, 0, Math.PI*2); c.stroke();
    // cracks in the floor
    c.strokeStyle = `rgba(20,16,12,${.7*f})`; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath();
    for (let i=0;i<9;i++){ const a = i/9*Math.PI*2 + .2, L = T*(.5 + .6*((i*53)%7)/7)*_cl(p/.25); let x = s[0], y = base; c.moveTo(x, y);
      for (let j=1;j<=3;j++){ const aa = a + Math.sin(i*5+j*2.3)*.3; x = s[0] + Math.cos(aa)*L*j/3; y = base + Math.sin(aa)*L*j/3*.5; c.lineTo(x, y); } }
    c.stroke();
    // the pillars, back ones first
    const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].sort((a,b) => a[1]-b[1]);
    dirs.forEach(([dx,dy], i) => {
      const t0 = _cl((p - i*.012)/.3), rise = _back(t0), sink = 1 - _cl((p-.82)/.18);
      const cx = s[0] + dx*T*.9, by = s[1] + dy*T*.7 + T*.3, h = T*.62*Math.max(0, rise)*sink + 1, w = T*.34;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(cx + w*.15, by, w*.75, w*.22, 0, 0, Math.PI*2); c.fill();
      _pillar(c, cx, by, w, h, Math.min(1, f*1.2));
    });
  },
  // Siegebreaker: a boulder lobbed on a high arc, with a dust trail; it lands with a flash, a shockwave, a crater, flying rubble and a dust cloud
  boulder(c, v, p, f, s, e){
    const T = tile, R = v.r || 1, q = _cl(p/.55), x = s[0] + (e[0]-s[0])*q, gy = s[1] + (e[1]-s[1])*q, hgt = Math.sin(q*Math.PI)*T*1.7;
    if (p < .55){
      const sh = 1 - hgt/(T*2.4);
      c.fillStyle = `rgba(0,0,0,${.4*sh})`; c.beginPath(); c.ellipse(x, gy + T*.15, T*.22*sh, T*.08*sh, 0, 0, Math.PI*2); c.fill();
      for (let n = _rate(v, 'a', 50); n>0; n--) emitP(1, {x, y:gy - hgt, r:.05, s0:.1, s1:.5, l0:.35, l1:.7, z0:.08, z1:.18, c:'140,128,112', al:.45, drag:2});
      c.save(); c.translate(x, gy - hgt); c.rotate(q*10);
      const r = T*.22, g = c.createRadialGradient(-r*.4, -r*.4, r*.1, 0, 0, r*1.2); g.addColorStop(0, '#a69a8a'); g.addColorStop(.6, '#6d6358'); g.addColorStop(1, '#2f2a24');
      c.fillStyle = g; c.strokeStyle = '#1c1814'; c.lineWidth = 1.5; c.beginPath();
      for (let i=0;i<9;i++){ const a = i/9*Math.PI*2, rr = r*(.82 + ((i*37)%5)/13); c.lineTo(Math.cos(a)*rr, Math.sin(a)*rr); }
      c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(20,16,12,.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-r*.5, -r*.1); c.lineTo(-r*.1, r*.15); c.lineTo(r*.3, r*.05); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(-r*.35, -r*.4, r*.28, 0, Math.PI*2); c.fill();
      c.restore();
    } else {
      const k = (p-.55)/.45;
      _once(v, 'b', true, () => {
        emitP(30, {x:e[0], y:e[1] + T*.1, s0:1, s1:3, l0:.7, l1:1.3, z0:.18*R, z1:.5*R, c:'150,138,120', al:.5, drag:2, r:.35*R});
        emitP(24, {x:e[0], y:e[1], s0:2.5, s1:6.5, a:-Math.PI/2, spread:1.5, l0:.5, l1:1, z0:.08, z1:.04, c:'110,100,88', kind:'shard', g:10, drag:.3});
        emitP(14, {x:e[0], y:e[1], s0:2, s1:5, a:-Math.PI/2, spread:1.6, l0:.3, l1:.6, z0:.05, z1:0, c:'255,200,120', add:true, kind:'streak', g:6});
      });
      const fl = _cl(1 - k*4);
      if (fl > 0){ c.fillStyle = `rgba(255,240,210,${.6*fl})`; c.beginPath(); c.arc(e[0], e[1], T*(.5 + k*2)*R, 0, Math.PI*2); c.fill(); }
      c.fillStyle = `rgba(22,16,10,${.6*f})`; c.beginPath(); c.ellipse(e[0], e[1] + T*.12, T*.4*R, T*.16*R, 0, 0, Math.PI*2); c.fill();
      c.strokeStyle = `rgba(14,10,6,${.7*f})`; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath();
      for (let i=0;i<8;i++){ const a = i/8*Math.PI*2 + .3, L = T*(.4 + .5*((i*31)%6)/6)*R*_cl(k*3); c.moveTo(e[0], e[1] + T*.12); c.lineTo(e[0] + Math.cos(a)*L*.5 + Math.sin(i*4)*T*.05, e[1] + T*.12 + Math.sin(a)*L*.25); c.lineTo(e[0] + Math.cos(a+.15)*L, e[1] + T*.12 + Math.sin(a+.15)*L*.5); }
      c.stroke();
      c.strokeStyle = `rgba(200,185,160,${(1-k)*.8})`; c.lineWidth = Math.max(1, T*.12*(1-k)); c.beginPath(); c.ellipse(e[0], e[1] + T*.12, T*(.3 + k*(.7 + R*.7)), T*(.12 + k*.3), 0, 0, Math.PI*2); c.stroke();
    }
  },
  // Forgemaster: the floor cracks open with glowing lava, columns of real fire with smoke and a shower of embers rise from the cells
  forgeburst(c, v, p, f, s){
    const T = tile, k = _out(_cl(p/.4)), cells = v.cells || [];
    glow(s[0], s[1] + T*.2, T*(.9 + k*1.5), `rgba(255,120,30,${.4*(1-p)})`);
    c.save(); c.lineCap = 'round';
    for (let i=0;i<8;i++){
      const a = i/8*Math.PI*2, len = T*(.4 + k*(v.r||1.3)); const pts = [[s[0], s[1]]];
      for (let j=1;j<=4;j++){ const aa = a + Math.sin(i*7+j*3)*.12; pts.push([s[0] + Math.cos(aa)*len*j/4, s[1] + Math.sin(aa)*len*j/4*.8]); }
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = `rgba(255,70,10,${.55*f})`; c.lineWidth = Math.max(7, T*.15); c.beginPath(); pts.forEach(([x,y], n) => n ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
      c.strokeStyle = `rgba(255,190,80,${.9*f})`; c.lineWidth = Math.max(2, T*.04); c.stroke();
      c.strokeStyle = `rgba(255,250,220,${f})`; c.lineWidth = 1; c.stroke();
    }
    c.restore();
    _once(v, 'a', true, () => {
      emitP(28, {x:s[0], y:s[1], s0:2, s1:6, a:-Math.PI/2, spread:1.5, l0:.7, l1:1.4, z0:.05, z1:.01, c:'255,200,90', add:true, kind:'streak', g:6});
      emitP(14, {x:s[0], y:s[1], s0:.6, s1:2, l0:.8, l1:1.4, z0:.2, z1:.5, c:'50,38,34', al:.4, drag:1.2, r:.4});
    });
    if (p < .72) for (let n = _rate(v, 'f', 80 + cells.length*14); n>0 && cells.length; n--){
      const [cx, cy] = cells[Math.floor(Math.random()*cells.length)], [ax, ay] = sqCenter(cx, cy);
      emitP(1, {x:ax, y:ay + T*.25, r:.12, a:-Math.PI/2, spread:.3, s0:.8, s1:2.1, l0:.45, l1:.85, z0:.3, z1:.06, c:'255,190,70', c2:'255,70,20', add:true});
      if (Math.random() < .3) emitP(1, {x:ax, y:ay, r:.1, a:-Math.PI/2, spread:.4, s0:.5, s1:1.1, l0:.9, l1:1.5, z0:.12, z1:.38, c:'40,32,30', al:.4});
    }
    cells.forEach(([x,y]) => { const [ax, ay] = sqCenter(x, y); glow(ax, ay + T*.2, T*.6, `rgba(255,140,40,${.5*f})`); });
  },
  // Heretic: a toxic cloud rolls to the target, then a bubbling pool spreads there, bubbles rise and pop, droplets spatter
  poison(c, v, p, f, s, e){
    const T = tile, q = _cl(p/.5);
    if (p < .55){
      const hx = s[0] + (e[0]-s[0])*q, hy = s[1] + (e[1]-s[1])*q;
      for (let n = _rate(v, 'a', 60); n>0; n--) emitP(1, {x:hx, y:hy, r:.1, s0:.1, s1:.5, l0:.5, l1:.95, z0:.14, z1:.32, c:'96,178,62', al:.45, drag:1.2});
      for (let n = _rate(v, 'b', 45); n>0; n--) emitP(1, {x:hx, y:hy, r:.06, s0:.1, s1:.6, l0:.3, l1:.5, z0:.1, z1:.02, c:'190,255,120', add:true, drag:2});
    }
    _once(v, 'c', p > .5, () => {
      emitP(26, {x:e[0], y:e[1], s0:.2, s1:1.3, l0:.8, l1:1.5, z0:.2, z1:.46, c:'96,170,56', al:.5, drag:1, r:.3});
      emitP(12, {x:e[0], y:e[1], s0:.4, s1:1.3, a:-Math.PI/2, spread:.9, l0:.6, l1:1.1, z0:.05, z1:.08, c:'200,255,140', add:true, drag:.8, g:-.4});
      emitP(14, {x:e[0], y:e[1], s0:1, s1:3, a:-Math.PI/2, spread:1.4, l0:.4, l1:.8, z0:.04, z1:.02, c:'150,230,80', add:true, kind:'streak', g:6});
    });
    if (p > .45){
      const k = _cl((p-.45)/.55);
      const pg = c.createRadialGradient(e[0], e[1] + T*.12, 0, e[0], e[1] + T*.12, T*.6*_out(k));
      pg.addColorStop(0, `rgba(40,70,20,${.75*f})`); pg.addColorStop(.7, `rgba(70,120,40,${.5*f})`); pg.addColorStop(1, 'rgba(70,120,40,0)');
      c.save(); c.translate(e[0], e[1] + T*.12); c.scale(1, .5); c.fillStyle = pg; c.beginPath(); c.arc(0, 0, T*.62*_out(k), 0, Math.PI*2); c.fill(); c.restore();
      glow(e[0], e[1], T*(.6 + .5*k), `rgba(130,230,70,${.3*f})`);
      c.lineWidth = 1.5;
      for (const a of v.p){ const ph = (k*1.4 + a.r) % 1, bx = e[0] + Math.cos(a.a)*T*.28*a.s, by = e[1] + T*.1 - ph*T*.55;
        c.strokeStyle = `rgba(190,250,130,${(1-ph)*.9*f})`; c.beginPath(); c.arc(bx, by, T*(.03 + .035*(1+a.r)*ph + .02), 0, Math.PI*2); c.stroke();
        if (ph > .85){ c.strokeStyle = `rgba(220,255,170,${(1-ph)*6*f})`; c.beginPath(); c.arc(bx, by, T*.09, 0, Math.PI*2); c.stroke(); } }
    }
  },
  // Frost Queen: a frost bloom spreads over the floor, ice crystals erupt from it and shatter, snow and cold mist swirl
  frost(c, v, p, f, s){
    const T = tile, R = T*((v.r||2) + .4), k = _out(_cl(p/.4)), cx = s[0], cy = s[1] + T*.15;
    _once(v, 'a', true, () => {
      emitP(34, {x:cx, y:cy, s0:1, s1:4.2, l0:.6, l1:1.3, z0:.05, z1:.01, c:'205,238,255', add:true, drag:1.5, kind:'streak', g:1.5, len:.2});
      emitP(20, {x:cx, y:cy, r:R/T*.6, s0:.2, s1:.8, a:-Math.PI/2, spread:1.2, l0:1, l1:1.8, z0:.22, z1:.5, c:'160,205,235', al:.28, drag:.5});
    });
    if (p < .8) for (let n = _rate(v, 's', 40); n>0; n--) emitP(1, {x:cx + _rnd(-R, R), y:cy - T*1.2 + _rnd(0, T*.4), s0:.2, s1:.8, a:Math.PI/2, spread:.7, l0:.8, l1:1.4, z0:.03, z1:.02, c:'255,255,255', add:true, g:.3});
    if (!v.cr){ v.cr = []; const N = 9 + Math.round(R/T*3); for (let i=0;i<N;i++) v.cr.push({a:Math.random()*Math.PI*2, r:.28 + .72*Math.random(), h:.45 + .55*Math.random(), d:Math.random()*.12, w:.8 + .5*Math.random()}); v.cr.sort((a,b) => Math.sin(a.a)*a.r - Math.sin(b.a)*b.r); }
    // the frost on the floor, with a snowflake pattern
    const dg = c.createRadialGradient(cx, cy, 0, cx, cy, R*k); dg.addColorStop(0, `rgba(215,242,255,${.55*f})`); dg.addColorStop(.7, `rgba(120,190,235,${.26*f})`); dg.addColorStop(1, 'rgba(120,190,235,0)');
    c.save(); c.translate(cx, cy); c.scale(1, .5); c.fillStyle = dg; c.beginPath(); c.arc(0, 0, R*k, 0, Math.PI*2); c.fill();
    c.strokeStyle = `rgba(235,250,255,${.75*f})`; c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath();
    for (let i=0;i<6;i++){ const a = i*Math.PI/3 + .2, L = R*k*.92; c.moveTo(0, 0); c.lineTo(Math.cos(a)*L, Math.sin(a)*L);
      for (const b of [.4, .65]){ const bx = Math.cos(a)*L*b, by = Math.sin(a)*L*b, bl = L*.18; c.moveTo(bx, by); c.lineTo(bx + Math.cos(a+.8)*bl, by + Math.sin(a+.8)*bl); c.moveTo(bx, by); c.lineTo(bx + Math.cos(a-.8)*bl, by + Math.sin(a-.8)*bl); } }
    c.stroke(); c.restore();
    // crystals
    const gone = _cl((p-.74)/.2);
    for (const cr of v.cr){
      const grow = _back(_cl((p - .03 - cr.d)/.3));
      if (grow <= 0 || gone >= 1) continue;
      const bx = cx + Math.cos(cr.a)*R*cr.r*k, by = cy + Math.sin(cr.a)*R*cr.r*k*.5, h = T*(.3 + .55*cr.h)*grow*(1-gone), w = T*.11*cr.w*(1-gone*.5);
      glow(bx, by - h*.3, T*.5, `rgba(120,200,255,${.22*(1-gone)})`);
      c.fillStyle = '#e4f6ff'; c.beginPath(); c.moveTo(bx - w, by); c.lineTo(bx - w*.2, by - h*.4); c.lineTo(bx, by - h); c.lineTo(bx + w*.1, by - h*.4); c.lineTo(bx, by); c.closePath(); c.fill();
      c.fillStyle = '#7fb8e2'; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + w*.1, by - h*.4); c.lineTo(bx, by - h); c.lineTo(bx + w*.2, by - h*.35); c.lineTo(bx + w, by); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(70,120,170,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx - w, by); c.lineTo(bx - w*.2, by - h*.4); c.lineTo(bx, by - h); c.lineTo(bx + w*.2, by - h*.35); c.lineTo(bx + w, by); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.moveTo(bx - w*.35, by - h*.1); c.lineTo(bx - w*.05, by - h*.75); c.stroke();
    }
    _once(v, 'b', p > .76, () => emitP(30, {x:cx, y:cy, r:R/T*.9, s0:.5, s1:2.6, a:-Math.PI/2, spread:1.4, l0:.5, l1:1, z0:.07, z1:.03, c:'205,236,255', kind:'shard', g:5}));
  },
  // Regent: a shaft of golden light, a jeweled crown rises over the king, rings of gold roll out and sparks lift off each ally
  crown(c, v, p, f, s){
    const T = tile, up = _out(_cl(p/.5)), cy = s[1] - T*(.8 + up*.3), w = T*.3;
    _once(v, 'a', true, () => {
      emitP(30, {x:s[0], y:s[1] - T*.2, s0:1, s1:3.6, a:-Math.PI/2, spread:1.6, l0:.7, l1:1.3, z0:.06, z1:.01, c:'255,225,120', add:true, kind:'streak', g:-.6});
      (v.cells || []).forEach(([x,y]) => { const [ax, ay] = sqCenter(x, y); emitP(12, {x:ax, y:ay, r:.2, s0:.6, s1:1.8, a:-Math.PI/2, spread:.6, l0:.8, l1:1.5, z0:.07, z1:.01, c:'255,232,150', add:true, kind:'streak', g:-.4, delay:.15}); });
    });
    // light shaft
    c.save(); c.globalCompositeOperation = 'lighter';
    const sg = c.createLinearGradient(0, s[1] - T*2.4, 0, s[1] + T*.3); sg.addColorStop(0, 'rgba(255,225,140,0)'); sg.addColorStop(1, `rgba(255,225,140,${.2*f})`);
    c.fillStyle = sg; c.beginPath(); c.moveTo(s[0] - T*.12, s[1] - T*2.4); c.lineTo(s[0] + T*.12, s[1] - T*2.4); c.lineTo(s[0] + T*.5, s[1] + T*.3); c.lineTo(s[0] - T*.5, s[1] + T*.3); c.closePath(); c.fill(); c.restore();
    glow(s[0], cy, T*1.1, `rgba(255,215,110,${.4*f})`);
    // the crown: gold gradient, jeweled points, a band, and a shine that sweeps across
    c.save(); c.globalAlpha = f;
    const gg = c.createLinearGradient(s[0] - w, 0, s[0] + w, 0); gg.addColorStop(0, '#a87a24'); gg.addColorStop(.35, '#ffe08a'); gg.addColorStop(.6, '#e3b456'); gg.addColorStop(1, '#8a5f18');
    c.fillStyle = gg; c.strokeStyle = '#5a3d0c'; c.lineWidth = 1.5; c.beginPath();
    c.moveTo(s[0] - w, cy + w*.55); c.lineTo(s[0] - w*1.05, cy - w*.35); c.lineTo(s[0] - w*.5, cy + w*.05); c.lineTo(s[0], cy - w*.7); c.lineTo(s[0] + w*.5, cy + w*.05); c.lineTo(s[0] + w*1.05, cy - w*.35); c.lineTo(s[0] + w, cy + w*.55); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#c8962e'; c.fillRect(s[0] - w, cy + w*.3, w*2, w*.25); c.strokeRect(s[0] - w, cy + w*.3, w*2, w*.25);
    for (const [dx, col] of [[-w*.85, '#e0463a'], [0, '#3a7ad8'], [w*.85, '#e0463a']]){ glow(s[0] + dx, cy + w*.02, T*.22, col==='#3a7ad8' ? 'rgba(100,160,255,.7)' : 'rgba(255,100,80,.7)'); c.fillStyle = col; c.beginPath(); c.arc(s[0] + dx, cy + w*.02, T*.035, 0, Math.PI*2); c.fill(); }
    const sh = _cl((p - .2)/.35); if (sh > 0 && sh < 1){ c.save(); c.beginPath(); c.rect(s[0] - w, cy - w*.7, w*2, w*1.3); c.clip(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); const sx = s[0] - w + sh*w*2.4; c.moveTo(sx, cy - w*.8); c.lineTo(sx + w*.25, cy - w*.8); c.lineTo(sx + w*.05, cy + w*.7); c.lineTo(sx - w*.2, cy + w*.7); c.closePath(); c.fill(); c.restore(); }
    c.restore();
    // rings of gold on the floor
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i=0;i<2;i++){ const k = _cl(p*1.3 - i*.22); c.strokeStyle = `rgba(255,215,110,${(1-k)*.85})`; c.lineWidth = Math.max(1, T*.1*(1-k)); c.beginPath(); c.ellipse(s[0], s[1] + T*.22, T*(.3 + k*1.7), T*(.12 + k*.7), 0, 0, Math.PI*2); c.stroke(); }
    c.restore();
    // a glint and a ring on every ally
    (v.cells || []).forEach(([x,y], i) => {
      const [ax, ay] = sqCenter(x, y), k = _cl(p*1.4 - i*.06);
      if (k <= 0 || k >= 1) return;
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,225,130,${(1-k)*.9})`; c.lineWidth = 2; c.beginPath(); c.ellipse(ax, ay + T*.2, T*(.15 + k*.4), T*(.06 + k*.16), 0, 0, Math.PI*2); c.stroke();
      const gs = T*.3*Math.sin(k*Math.PI); c.fillStyle = `rgba(255,245,200,${1-k})`; c.beginPath(); c.moveTo(ax, ay - T*.2 - gs); c.lineTo(ax + gs*.2, ay - T*.2); c.lineTo(ax, ay - T*.2 + gs); c.lineTo(ax - gs*.2, ay - T*.2); c.closePath(); c.moveTo(ax - gs, ay - T*.2); c.lineTo(ax, ay - T*.2 + gs*.2); c.lineTo(ax + gs, ay - T*.2); c.lineTo(ax, ay - T*.2 - gs*.2); c.closePath(); c.fill(); c.restore();
    });
  },
  // a tar geyser erupting: a column of black tar (or fire) shoots up, droplets arc out and fall back, steam rolls off, a splash spreads on the ground
  geyser(c, v, p, f, s){
    const T = tile, fire = !!v.fire, base = s[1] + T*.1, k = _out(_cl(p/.28)), rise = T*(1.5*k)*(1 - _cl((p-.45)/.5)*.7);
    _once(v, 'a', true, () => {
      emitP(26, {x:s[0], y:base - T*.2, s0:2.5, s1:6.5, a:-Math.PI/2, spread:.55, l0:.6, l1:1.15, z0:.07, z1:.04, c:fire ? '255,160,60' : '96,70,38', add:false, g:9});
      emitP(10, {x:s[0], y:base - T*.2, s0:2, s1:6, a:-Math.PI/2, spread:.5, l0:.4, l1:.9, z0:.04, z1:.01, c:fire ? '255,220,140' : '235,190,100', add:true, kind:'streak', g:8});
      emitP(12, {x:s[0], y:base - T*.4, s0:.4, s1:1.6, a:-Math.PI/2, spread:.7, l0:.8, l1:1.5, z0:.14, z1:.4, c:fire ? '255,140,50' : '120,112,96', al:.35, drag:1.2, add:fire});
      if (fire) emitP(16, {x:s[0], y:base - T*.3, s0:2, s1:5, a:-Math.PI/2, spread:.8, l0:.4, l1:.9, z0:.05, z1:.01, c:'255,220,120', add:true, kind:'streak', g:3});
    });
    const w = T*(.3 - .1*p), cg = c.createLinearGradient(0, base, 0, base - rise);
    if (fire){ cg.addColorStop(0, 'rgba(255,120,30,.95)'); cg.addColorStop(.6, 'rgba(255,190,70,.8)'); cg.addColorStop(1, 'rgba(255,240,170,0)'); } else { cg.addColorStop(0, 'rgba(14,10,6,.95)'); cg.addColorStop(.7, 'rgba(34,24,14,.85)'); cg.addColorStop(1, 'rgba(60,44,26,0)'); }
    c.save(); if (fire) c.globalCompositeOperation = 'lighter';
    c.fillStyle = cg; c.beginPath(); c.moveTo(s[0] - w, base); c.quadraticCurveTo(s[0] - w*.5 + Math.sin(p*20)*T*.02, base - rise*.5, s[0], base - rise); c.quadraticCurveTo(s[0] + w*.5 - Math.sin(p*20)*T*.02, base - rise*.5, s[0] + w, base); c.closePath(); c.fill(); c.restore();
    if (fire) _glowDisk(c, s[0], base - rise*.4, T*1.1, '255,120,40', .5*f);
    else _glowDisk(c, s[0], base - rise*.5, T*.9, '201,150,60', .28*f);
    if (!fire){ c.save(); c.globalCompositeOperation = 'lighter'; _line(c, [[s[0] - w*.45, base], [s[0] - w*.1, base - rise*.9]], T*.05, 'rgba(230,190,100,.55)', f); c.restore(); }
    c.save(); c.strokeStyle = fire ? 'rgba(255,170,70,' + (.7*(1-p)) + ')' : 'rgba(80,60,34,' + (.8*(1-p)) + ')'; c.lineWidth = Math.max(2, T*.1*(1-p)); c.beginPath(); c.ellipse(s[0], base, T*(.2 + p*.6), T*(.08 + p*.22), 0, 0, Math.PI*2); c.stroke(); c.restore();
  },
  /* ----- generic building blocks, reused by many skills ----- */
  // energy beam: it shoots out to the target, a hot white core inside a colored glow, sparks along it and a flash at the end
  beam(c, v, p, f, s, e){
    const T = tile, col = v.c || '255,170,80', g = _cl(p/.22), ex = s[0] + (e[0]-s[0])*g, ey = s[1] + (e[1]-s[1])*g, pul = Math.sin(p*70) > -.3 ? 1 : .6;
    _once(v, 'a', true, () => { const n = Math.max(6, Math.round(Math.hypot(e[0]-s[0], e[1]-s[1])/T*5)); for (let i=0;i<n;i++){ const q = Math.random(); emitP(1, {x:s[0] + (e[0]-s[0])*q, y:s[1] + (e[1]-s[1])*q, s0:.3, s1:1.6, l0:.3, l1:.7, z0:.05, z1:.01, c:col, add:true, kind:'streak', drag:2, delay:.2}); } });
    c.save(); c.globalCompositeOperation = 'lighter';
    _line(c, [s, [ex, ey]], T*.34, `rgba(${col},.25)`, f*pul); _line(c, [s, [ex, ey]], T*.14, `rgba(${col},.7)`, f*pul); _line(c, [s, [ex, ey]], T*.05, 'rgba(255,255,255,1)', f);
    c.restore();
    _once(v, 'b', g >= 1, () => emitP(14, {x:e[0], y:e[1], s0:1, s1:4, l0:.3, l1:.6, z0:.05, z1:.01, c:col, add:true, kind:'streak'}));
    if (g >= 1) _glowDisk(c, e[0], e[1], T*(.5 + .4*(1-f)), col, .8*f);
  },
  // impact: a flash, a starburst, a ring and sparks (v.c color, v.big for heavier blows)
  hit(c, v, p, f, s){
    const T = tile, col = v.c || '255,230,170', B = v.big ? 1.5 : 1, k = _out(_cl(p/.5));
    _once(v, 'a', true, () => { emitP(Math.round(14*B), {x:s[0], y:s[1], s0:2, s1:5.5*B, l0:.25, l1:.6, z0:.05, z1:.01, c:col, add:true, kind:'streak', g:3}); emitP(5, {x:s[0], y:s[1], s0:.2, s1:.8, l0:.5, l1:.9, z0:.12, z1:.3, c:'90,80,80', al:.3, drag:2}); });
    c.save(); c.globalCompositeOperation = 'lighter';
    _glowDisk(c, s[0], s[1], T*(.3 + k*.5)*B, col, (1-p)*.9);
    c.strokeStyle = `rgba(255,255,255,${(1-p)*.9})`; c.lineWidth = Math.max(1.5, T*.03); c.lineCap = 'round'; c.beginPath();
    for (let i=0;i<8;i++){ const a = i*Math.PI/4 + .2, r0 = T*.08, r1 = T*(.2 + k*.55)*B*(i%2 ? .7 : 1); c.moveTo(s[0] + Math.cos(a)*r0, s[1] + Math.sin(a)*r0); c.lineTo(s[0] + Math.cos(a)*r1, s[1] + Math.sin(a)*r1); }
    c.stroke(); _ringE(c, s[0], s[1], T*(.15 + k*.5)*B, T*(.15 + k*.5)*B, 2, `rgba(${col},${(1-p)*.8})`);
    c.restore();
  },
  // a heavy landing: flash, shockwave, cracks, dust and flying rubble
  slam(c, v, p, f, s){
    const T = tile, R = v.r || 1, k = _out(_cl(p/.6)), by = s[1] + T*.12;
    _once(v, 'a', true, () => {
      emitP(26, {x:s[0], y:by, s0:1, s1:3, l0:.7, l1:1.3, z0:.18*R, z1:.5*R, c:'150,138,120', al:.5, drag:2, r:.35*R});
      emitP(20, {x:s[0], y:by, s0:2.5, s1:6, a:-Math.PI/2, spread:1.5, l0:.5, l1:1, z0:.07, z1:.04, c:'118,106,92', kind:'shard', g:10, drag:.3});
      emitP(10, {x:s[0], y:by, s0:2, s1:5, a:-Math.PI/2, spread:1.6, l0:.3, l1:.6, z0:.05, z1:0, c:'255,210,130', add:true, kind:'streak', g:6});
    });
    const fl = _cl(1 - p*5); if (fl > 0) _glowDisk(c, s[0], by, T*(.6 + p*2)*R, '255,235,200', .7*fl);
    c.fillStyle = `rgba(22,16,10,${.5*f})`; c.beginPath(); c.ellipse(s[0], by, T*.42*R, T*.17*R, 0, 0, Math.PI*2); c.fill();
    c.strokeStyle = `rgba(14,10,6,${.7*f})`; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath();
    for (let i=0;i<8;i++){ const a = i/8*Math.PI*2 + .3, L = T*(.4 + .5*((i*31)%6)/6)*R*_cl(p/.3); c.moveTo(s[0], by); c.lineTo(s[0] + Math.cos(a)*L*.5 + Math.sin(i*4)*T*.05, by + Math.sin(a)*L*.25); c.lineTo(s[0] + Math.cos(a+.15)*L, by + Math.sin(a+.15)*L*.5); }
    c.stroke(); _ringE(c, s[0], by, T*(.3 + k*(.7 + R*.7)), T*(.12 + k*.3), Math.max(1, T*.11*(1-k)), `rgba(205,190,165,${(1-k)*.8})`);
  },
  // along a line: 'fissure' = the ground splits open from one end to the other; 'dash' = a rush of speed lines and dust
  shockline(c, v, p, f, s, e){
    const T = tile, g = _cl(p/.35), col = v.c || '200,170,130', len = Math.hypot(e[0]-s[0], e[1]-s[1]) || 1, ux = (e[0]-s[0])/len, uy = (e[1]-s[1])/len, nx = -uy, ny = ux;
    const hx = s[0] + (e[0]-s[0])*g, hy = s[1] + (e[1]-s[1])*g;
    if (v.style==='dash'){
      for (let n = _rate(v, 'a', 90); n>0 && g < 1; n--) emitP(1, {x:hx, y:hy + T*.2, r:.1, s0:.2, s1:.9, l0:.4, l1:.8, z0:.12, z1:.3, c:'170,150,120', al:.4, drag:2});
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let i=-2;i<=2;i++){ const off = i*T*.13, a0 = Math.max(0, g - .55), x0 = s[0] + (e[0]-s[0])*a0 + nx*off, y0 = s[1] + (e[1]-s[1])*a0 + ny*off; _line(c, [[x0, y0], [hx + nx*off, hy + ny*off]], Math.max(1, T*(.05 - Math.abs(i)*.01)), `rgba(${col},.9)`, f*(1 - Math.abs(i)*.2)); }
      _glowDisk(c, hx, hy, T*.5, col, .5*f); c.restore();
    } else {
      _once(v, 'f', true, () => emitP(10, {x:s[0], y:s[1], s0:1, s1:3, l0:.5, l1:1, z0:.15, z1:.4, c:'150,138,120', al:.4, drag:2}));
      for (let n = _rate(v, 'a', 70); n>0 && g < 1; n--){ emitP(1, {x:hx + _rnd(-.2, .2)*T, y:hy + _rnd(-.2, .2)*T*.6, s0:.5, s1:2, a:-Math.PI/2, spread:1.2, l0:.4, l1:.9, z0:.14, z1:.34, c:'150,138,120', al:.5, drag:1.8}); if (Math.random() < .5) emitP(1, {x:hx, y:hy, s0:1.5, s1:4, a:-Math.PI/2, spread:1.3, l0:.4, l1:.8, z0:.05, z1:.03, c:'112,100,86', kind:'shard', g:9}); }
      const pts = [[s[0], s[1]]]; for (let i=1;i<=10;i++){ const q = i/10*g; pts.push([s[0] + (e[0]-s[0])*q + nx*Math.sin(i*2.7)*T*.09, s[1] + (e[1]-s[1])*q + ny*Math.sin(i*2.7)*T*.09]); }
      _line(c, pts, T*.2, `rgba(12,8,5,${.85*f})`, 1);
      c.save(); c.globalCompositeOperation = 'lighter'; _line(c, pts, T*.07, `rgba(255,150,60,${.9*f})`, 1); _line(c, pts, T*.025, `rgba(255,230,160,${f})`, 1); _glowDisk(c, hx, hy, T*.6, '255,160,70', .5*f*(1-g*.5)); c.restore();
    }
  },
  // Blade Storm: three silver blades whirl around the hero leaving trails, sparks fly off
  bladestorm(c, v, p, f, s){
    const T = tile, k = _out(_cl(p/.3)), R = T*(.35 + .6*k);
    _once(v, 'a', true, () => emitP(16, {x:s[0], y:s[1], s0:2, s1:5, l0:.3, l1:.6, z0:.05, z1:.01, c:'225,235,255', add:true, kind:'streak'}));
    c.save(); c.translate(s[0], s[1] + T*.05); c.scale(1, .85); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
    for (let b=0;b<3;b++) for (let e=0;e<4;e++){
      const a0 = p*16 + b*Math.PI*2/3 - e*.28, al = f*(1 - e*.26);
      c.strokeStyle = `rgba(170,200,255,${al*.35})`; c.lineWidth = T*(.16 - e*.025); c.beginPath(); c.arc(0, 0, R, a0, a0 + .9); c.stroke();
      c.strokeStyle = `rgba(255,255,255,${al})`; c.lineWidth = Math.max(1.4, T*(.05 - e*.008)); c.beginPath(); c.arc(0, 0, R, a0, a0 + .9); c.stroke();
    }
    c.restore();
    for (let n = _rate(v, 'b', 50); n>0; n--){ const a = Math.random()*Math.PI*2; emitP(1, {x:s[0] + Math.cos(a)*R, y:s[1] + Math.sin(a)*R*.85, s0:1, s1:3, a:a + Math.PI/2, spread:.4, l0:.2, l1:.4, z0:.04, z1:.01, c:'220,235,255', add:true, kind:'streak'}); }
  },
  // sound waves: rings that roll out from the caller, gold by default (War Cry, Neigh, Royal Order)
  shout(c, v, p, f, s){
    const T = tile, col = v.c || '227,180,86';
    _once(v, 'a', true, () => emitP(14, {x:s[0], y:s[1], s0:1, s1:3, l0:.5, l1:1, z0:.05, z1:.01, c:col, add:true, kind:'streak', g:-.5}));
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i=0;i<4;i++){ const k = _cl(p*1.3 - i*.13); if (k <= 0 || k >= 1) continue; _ringE(c, s[0], s[1], T*(.25 + k*1.9), T*(.25 + k*1.9)*.85, Math.max(1, T*.12*(1-k)), `rgba(${col},${(1-k)*.8})`); _ringE(c, s[0], s[1], T*(.22 + k*1.9), T*(.22 + k*1.9)*.85, 1.2, `rgba(255,255,255,${(1-k)*.7})`); }
    _glowDisk(c, s[0], s[1], T*.7, col, .45*(1-p)); c.restore();
  },
  // Flash: a burst of light with long rays along the diagonals
  nova(c, v, p, f, s){
    const T = tile, col = v.c || '255,236,170', k = _out(_cl(p/.35)), L = T*(v.len || 3.2)*k;
    _once(v, 'a', true, () => emitP(24, {x:s[0], y:s[1], s0:2, s1:6, l0:.4, l1:.9, z0:.05, z1:.01, c:col, add:true, kind:'streak'}));
    c.save(); c.globalCompositeOperation = 'lighter';
    _glowDisk(c, s[0], s[1], T*(.6 + k*1.2), col, .8*f);
    for (let i=0;i<4;i++){ const a = Math.PI/4 + i*Math.PI/2; _tri(c, s[0], s[1], a, L, T*.07*(1 - p*.6), `rgba(${col},${.9*f})`); _tri(c, s[0], s[1], a, L*.7, T*.03, `rgba(255,255,255,${f})`); }
    _ringE(c, s[0], s[1], T*(.2 + k*1.2), T*(.2 + k*1.2)*.8, Math.max(1, T*.08*(1-p)), `rgba(${col},${(1-p)*.9})`);
    c.restore();
  },
  // a summoning circle: runes spin, a pillar of light rises and sparks lift off
  summon(c, v, p, f, s){
    const T = tile, col = v.c || '227,180,86', k = _out(_cl(p/.4)), cy = s[1] + T*.22;
    _once(v, 'a', p > .25, () => emitP(22, {x:s[0], y:cy, r:.25, s0:.8, s1:2.6, a:-Math.PI/2, spread:.5, l0:.6, l1:1.2, z0:.06, z1:.01, c:col, add:true, kind:'streak', g:-.5}));
    c.save(); c.globalCompositeOperation = 'lighter';
    _ringE(c, s[0], cy, T*.55*k, T*.22*k, 2.6, `rgba(${col},${.9*f})`); _ringE(c, s[0], cy, T*.4*k, T*.16*k, 1.4, `rgba(255,255,255,${.7*f})`);
    c.fillStyle = `rgba(${col},${.95*f})`; for (let i=0;i<8;i++){ const a = p*3 + i*Math.PI/4, rx = Math.cos(a)*T*.48*k, ry = Math.sin(a)*T*.19*k; c.fillRect(s[0] + rx - 1.5, cy + ry - 1.5, 3, 3); }
    const pg = c.createLinearGradient(0, cy - T*1.3, 0, cy); pg.addColorStop(0, `rgba(${col},0)`); pg.addColorStop(1, `rgba(${col},${.45*f*_cl((p-.1)/.2)})`);
    c.fillStyle = pg; c.fillRect(s[0] - T*.22*k, cy - T*1.3, T*.44*k, T*1.3);
    _glowDisk(c, s[0], cy, T*.6, col, .5*f); c.restore();
  },
  // Wall (the shield skill): a hexagonal barrier flickers into being around the hero
  shield(c, v, p, f, s){
    const T = tile, col = v.c || '150,195,240', k = _out(_cl(p/.35)), R = T*.82*k, cy = s[1] - T*.05;
    _once(v, 'a', true, () => emitP(14, {x:s[0], y:cy, s0:1, s1:3, l0:.4, l1:.9, z0:.05, z1:.01, c:'210,230,255', add:true, kind:'streak'}));
    const hex = (r, rot) => { c.beginPath(); for (let i=0;i<=6;i++){ const a = rot + i*Math.PI/3; const x = s[0] + Math.cos(a)*r, y = cy + Math.sin(a)*r*.9; i ? c.lineTo(x, y) : c.moveTo(x, y); } };
    c.save(); c.globalCompositeOperation = 'lighter';
    const fg = c.createRadialGradient(s[0], cy, R*.2, s[0], cy, R); fg.addColorStop(0, `rgba(${col},0)`); fg.addColorStop(1, `rgba(${col},${.28*f})`); c.fillStyle = fg; hex(R, p*.8); c.fill();
    for (let i=0;i<3;i++){ c.strokeStyle = `rgba(${i ? col : '255,255,255'},${(.9 - i*.25)*f})`; c.lineWidth = Math.max(1.2, T*(.045 - i*.01)); hex(R*(1 - i*.16), p*(.8 + i*.4) + i); c.stroke(); }
    for (let i=0;i<6;i++){ const a = p*.8 + i*Math.PI/3, fl = Math.max(0, Math.sin(p*14 + i*1.7)); if (fl > .3){ c.fillStyle = `rgba(230,244,255,${fl*.5*f})`; c.beginPath(); c.arc(s[0] + Math.cos(a)*R*.75, cy + Math.sin(a)*R*.75*.9, T*.06, 0, Math.PI*2); c.fill(); } }
    _glowDisk(c, s[0], cy, R*1.2, col, .3*f); c.restore();
  },
  // Color Shift: dark and light squares swirl off the hero as it swaps color, a gold ring marks the landing
  shift(c, v, p, f, s, e){
    const T = tile;
    _once(v, 'a', true, () => { for (const [pt, n] of [[s, 10], [e, 10]]){ emitP(n, {x:pt[0], y:pt[1], s0:.8, s1:2.6, l0:.5, l1:1, z0:.06, z1:.03, c:'236,228,210', kind:'shard', g:2}); emitP(n, {x:pt[0], y:pt[1], s0:.8, s1:2.6, l0:.5, l1:1, z0:.06, z1:.03, c:'30,26,24', kind:'shard', g:2}); } emitP(14, {x:e[0], y:e[1], s0:1, s1:3, l0:.4, l1:.9, z0:.05, z1:.01, c:'255,225,140', add:true, kind:'streak'}); });
    c.save(); c.globalCompositeOperation = 'lighter';
    const q = _cl(p/.4); _line(c, [s, [s[0] + (e[0]-s[0])*q, s[1] + (e[1]-s[1])*q]], T*.1, `rgba(255,230,160,${.5*f})`, 1);
    const k = _out(_cl(p/.5)); _ringE(c, e[0], e[1] + T*.2, T*(.2 + k*.7), T*(.08 + k*.28), Math.max(1, T*.08*(1-k)), `rgba(227,180,86,${(1-k)*.9})`);
    c.restore();
  },
  // Gallop: hooves kick up dust, speed lines streak back and a golden aura rises
  gallop(c, v, p, f, s){
    const T = tile;
    _once(v, 'a', true, () => { emitP(18, {x:s[0], y:s[1] + T*.25, s0:.8, s1:2.4, a:Math.PI, spread:.7, l0:.5, l1:1, z0:.14, z1:.36, c:'160,140,110', al:.5, drag:2, r:.2}); emitP(10, {x:s[0], y:s[1], s0:2, s1:4, a:Math.PI, spread:.25, l0:.3, l1:.5, z0:.04, z1:.01, c:'255,225,150', add:true, kind:'streak'}); });
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i=0;i<4;i++){ const y = s[1] + (i-1.5)*T*.16, k = _cl(p*1.6 - i*.05); _line(c, [[s[0] - T*.1 - k*T*.4, y], [s[0] - T*(.9 + k*.5), y]], T*.03, 'rgba(255,235,180,1)', (1-k)*.8); }
    const k = _out(_cl(p/.5)); _ringE(c, s[0], s[1] + T*.22, T*(.2 + k*.6), T*(.08 + k*.24), Math.max(1, T*.07*(1-k)), `rgba(227,180,86,${(1-k)*.9})`);
    _glowDisk(c, s[0], s[1], T*.9, '255,215,120', .3*f); c.restore();
  },
  // Arcane Bolt: a glowing orb with a trail flies to the target and bursts (v.c = the element's color)
  arcane(c, v, p, f, s, e){
    const T = tile, col = v.c || '190,140,255', q = _cl(p/.4), x = s[0] + (e[0]-s[0])*_out(q), y = s[1] + (e[1]-s[1])*_out(q);
    if (p < .45){
      for (let n = _rate(v, 'a', 90); n>0; n--) emitP(1, {x, y, r:.05, s0:.1, s1:.6, l0:.3, l1:.6, z0:.1, z1:.01, c:col, add:true, drag:2});
      c.save(); c.globalCompositeOperation = 'lighter'; _glowDisk(c, x, y, T*.5, col, .9); _glowDisk(c, x, y, T*.2, '255,255,255', 1);
      for (let i=0;i<3;i++){ const a = p*30 + i*2.1; c.fillStyle = `rgba(${col},.9)`; c.beginPath(); c.arc(x + Math.cos(a)*T*.13, y + Math.sin(a)*T*.13, T*.03, 0, Math.PI*2); c.fill(); } c.restore();
    }
    _once(v, 'b', q >= 1, () => { emitP(22, {x:e[0], y:e[1], s0:1.5, s1:5, l0:.3, l1:.7, z0:.05, z1:.01, c:col, add:true, kind:'streak'}); emitP(8, {x:e[0], y:e[1], s0:.2, s1:1, l0:.5, l1:.9, z0:.1, z1:.04, c:'210,190,255', add:true, drag:1}); });
    if (q >= 1){ const k = _cl((p-.4)/.6); c.save(); c.globalCompositeOperation = 'lighter'; _glowDisk(c, e[0], e[1], T*(.4 + k*.7), col, (1-k)*.9); _ringE(c, e[0], e[1], T*(.15 + k*.6), T*(.15 + k*.6), 2, `rgba(${col},${(1-k)*.9})`); _ringE(c, e[0], e[1], T*(.1 + k*.45), T*(.1 + k*.45), 1.2, `rgba(255,255,255,${(1-k)*.8})`); c.restore(); }
  },
  // Shove: four shock arcs burst outward from the hero, throwing dust
  shove(c, v, p, f, s){
    const T = tile, k = _out(_cl(p/.5));
    _once(v, 'a', true, () => { emitP(18, {x:s[0], y:s[1] + T*.2, s0:1, s1:3, l0:.4, l1:.9, z0:.12, z1:.32, c:'160,145,125', al:.5, drag:2}); emitP(10, {x:s[0], y:s[1], s0:2, s1:5, l0:.25, l1:.5, z0:.05, z1:.01, c:'255,225,170', add:true, kind:'streak'}); });
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const a = Math.atan2(dy, dx), r = T*(.3 + k*.75);
      c.strokeStyle = `rgba(255,225,170,${(1-p)*.9})`; c.lineWidth = Math.max(2, T*.1*(1-p)); c.beginPath(); c.arc(s[0], s[1], r, a - .55, a + .55); c.stroke();
      c.strokeStyle = `rgba(255,255,255,${(1-p)})`; c.lineWidth = 1.4; c.stroke(); }
    c.restore();
  },
  /* ----- skills with a look of their own ----- */
  // Lance Thrust: the spear streaks in with a bright trail, bites into the target in a burst of sparks and shivers
  lance(c, v, p, f, s, e){
    const T = tile, q = _cl(p/.26), ang = Math.atan2(e[1]-s[1], e[0]-s[0]), ox = s[0] + (e[0]-s[0])*q, oy = s[1] + (e[1]-s[1])*q, L = T*1.25, shiv = q >= 1 ? Math.sin(p*60)*T*.015*(1-p) : 0;
    c.save(); c.globalCompositeOperation = 'lighter'; _line(c, [[s[0], s[1]], [ox, oy]], T*.12, 'rgba(255,240,210,.35)', f * (q < 1 ? 1 : 1 - _cl((p-.26)/.3))); c.restore();
    _once(v, 'a', q >= 1, () => { emitP(20, {x:e[0], y:e[1], s0:2, s1:6, a:ang, spread:1.4, l0:.25, l1:.6, z0:.05, z1:.01, c:'255,235,190', add:true, kind:'streak', g:3}); emitP(6, {x:e[0], y:e[1], s0:.2, s1:.8, l0:.5, l1:.9, z0:.1, z1:.28, c:'110,100,92', al:.35, drag:2}); });
    c.save(); c.globalAlpha = f; c.translate(ox + Math.cos(ang+1.57)*shiv, oy + Math.sin(ang+1.57)*shiv); c.rotate(ang);
    c.strokeStyle = '#1e130b'; c.lineWidth = Math.max(5, T*.1); c.lineCap = 'round'; c.beginPath(); c.moveTo(-L, 0); c.lineTo(0, 0); c.stroke();
    const sg = c.createLinearGradient(0, -T*.04, 0, T*.04); sg.addColorStop(0, '#b08a58'); sg.addColorStop(.5, '#7a5a34'); sg.addColorStop(1, '#4a3320'); c.strokeStyle = sg; c.lineWidth = Math.max(3, T*.065); c.beginPath(); c.moveTo(-L, 0); c.lineTo(0, 0); c.stroke();
    const hg = c.createLinearGradient(0, -T*.1, 0, T*.1); hg.addColorStop(0, '#f2f6fb'); hg.addColorStop(.5, '#aebccd'); hg.addColorStop(1, '#5d6c7e'); c.fillStyle = hg; c.strokeStyle = '#46546a'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(T*.36, 0); c.lineTo(T*.04, -T*.1); c.lineTo(-T*.05, 0); c.lineTo(T*.04, T*.1); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#c0392b'; const w = Math.sin(p*34)*T*.04; c.beginPath(); c.moveTo(-L*.62, 0); c.lineTo(-L*.96, -T*.14 + w); c.lineTo(-L*.8, 0); c.lineTo(-L*.96, T*.14 + w); c.closePath(); c.fill();
    c.restore();
    if (q >= 1){ const k = _cl((p-.26)/.5); c.save(); c.globalCompositeOperation = 'lighter'; _glowDisk(c, e[0], e[1], T*(.35 + k*.4), '255,235,190', (1-k)*.9); _ringE(c, e[0], e[1], T*(.15 + k*.45), T*(.15 + k*.45), 2, `rgba(255,240,200,${(1-k)*.9})`); c.restore(); }
  },
  // Dread Feast: crimson claws rake the target, blood sprays and dark wisps flow back to the knight
  claw(c, v, p, f, s, e){
    const T = tile, k = _cl(p/.3);
    _once(v, 'a', k >= .5, () => { emitP(14, {x:e[0], y:e[1], s0:1.5, s1:4.5, a:-Math.PI/2.4, spread:1.3, l0:.4, l1:.9, z0:.05, z1:.03, c:'170,12,28', kind:'dot', g:7}); emitP(10, {x:e[0], y:e[1], s0:2, s1:5, l0:.25, l1:.5, z0:.05, z1:.01, c:'255,60,70', add:true, kind:'streak', g:3}); emitP(5, {x:e[0], y:e[1], s0:.2, s1:.8, l0:.6, l1:1.1, z0:.14, z1:.3, c:'70,8,18', al:.4, drag:1.5}); });
    c.save(); c.lineCap = 'round';
    for (let i=0;i<3;i++){ const ox = (i-1)*T*.14, t = _out(_cl(k*1.4 - i*.12)), x0 = e[0] - T*.28 + ox, y0 = e[1] - T*.32, x1 = x0 + T*.34*t, y1 = y0 + T*.64*t;
      c.globalCompositeOperation = 'lighter'; _line(c, [[x0, y0], [x1, y1]], Math.max(5, T*.1), `rgba(200,10,30,${.45*f})`, 1); _line(c, [[x0, y0], [x1, y1]], Math.max(2, T*.04), `rgba(255,150,150,${f})`, 1);
      c.globalCompositeOperation = 'source-over'; _line(c, [[x0, y0], [x1, y1]], Math.max(3, T*.06), `rgba(110,6,20,${.8*f})`, 1); }
    c.restore();
    if (p > .3){ const m = (p-.3)/.7; for (const a of v.p){ const q = _cl(m*1.2 - a.d), x = e[0] + (s[0]-e[0])*q + Math.sin(q*6+a.a)*T*.12, y = e[1] + (s[1]-e[1])*q + Math.cos(q*6+a.a)*T*.12;
      c.save(); c.globalCompositeOperation = 'lighter'; _glowDisk(c, x, y, T*.1*(1+a.r), '210,30,60', (1-q)*.8); c.restore(); } }
  },
  // Sentence / Judgment: a column of holy light falls on the target, a cross is branded on it and the air fills with sparks
  judgment(c, v, p, f, s, e){
    const T = tile, k = _out(_cl(p/.22)), w = T*(.5*(1 - _cl((p-.35)/.65)*.8) + .06);
    _once(v, 'a', p > .2, () => { emitP(22, {x:e[0], y:e[1], s0:1.5, s1:5, a:-Math.PI/2, spread:1.6, l0:.4, l1:.9, z0:.05, z1:.01, c:'255,232,150', add:true, kind:'streak', g:3}); emitP(10, {x:e[0], y:e[1], r:.25, s0:.3, s1:1, a:-Math.PI/2, spread:.4, l0:.8, l1:1.4, z0:.05, z1:.01, c:'255,245,200', add:true, g:-.8}); });
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, e[1] - T*5, 0, e[1] + T*.2); g.addColorStop(0, 'rgba(255,235,170,0)'); g.addColorStop(.75, `rgba(255,225,140,${.7*f})`); g.addColorStop(1, `rgba(255,255,255,${f})`);
    c.fillStyle = g; c.fillRect(e[0] - w/2, e[1] - T*5*k, w, T*5*k + T*.2);
    c.fillStyle = `rgba(255,255,255,${.7*f})`; c.fillRect(e[0] - w*.18, e[1] - T*5*k, w*.36, T*5*k + T*.2);
    _glowDisk(c, e[0], e[1], T*(.7 + .5*Math.sin(p*10)*.1), '255,225,140', .6*f);
    const cr = T*.32*_out(_cl((p-.18)/.25)), cy = e[1] - T*.1;
    if (cr > 0){ _line(c, [[e[0], cy - cr], [e[0], cy + cr*1.15]], Math.max(3, T*.08), `rgba(255,240,180,${f})`, 1); _line(c, [[e[0] - cr*.7, cy - cr*.25], [e[0] + cr*.7, cy - cr*.25]], Math.max(3, T*.08), `rgba(255,240,180,${f})`, 1); }
    _ringE(c, e[0], e[1] + T*.2, T*(.25 + p*.7), T*(.1 + p*.25), 2, `rgba(255,225,140,${f*.8})`);
    c.restore();
    if (v.exec && p > .3){ c.fillStyle = `rgba(20,10,0,${.5*(1-p)})`; c.beginPath(); c.arc(e[0], e[1], T*.5, 0, Math.PI*2); c.fill(); }
  },
  // Benediction: a holy glow blooms, rays turn, a halo ripples out and feathers of light rise
  holy(c, v, p, f, s){
    const T = tile;
    _once(v, 'a', true, () => { emitP(26, {x:s[0], y:s[1] + T*.2, r:.5, s0:.4, s1:1.6, a:-Math.PI/2, spread:.5, l0:.9, l1:1.7, z0:.06, z1:.01, c:'255,244,200', add:true, kind:'streak', g:-.6}); emitP(12, {x:s[0], y:s[1], s0:.3, s1:1.2, l0:1, l1:1.8, z0:.2, z1:.45, c:'255,236,170', add:true, al:.4, drag:.8}); });
    c.save(); c.globalCompositeOperation = 'lighter'; _glowDisk(c, s[0], s[1], T*(.8 + p*.8), '255,232,150', .55*f);
    c.translate(s[0], s[1]); c.rotate(p*1.2);
    for (let i=0;i<12;i++){ const a = i/12*Math.PI*2; _tri(c, 0, 0, a, T*(.6 + _out(_cl(p/.5))*1.1)*(i%2 ? .75 : 1), T*.06, `rgba(255,232,150,${.5*f})`); }
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter';
    _ringE(c, s[0], s[1] + T*.22, T*(.35 + p*1.7), T*(.14 + p*.65), 3, `rgba(255,236,170,${f*.9})`); _ringE(c, s[0], s[1] + T*.22, T*(.25 + p*1.25), T*(.1 + p*.48), 1.5, `rgba(255,255,255,${f*.7})`);
    c.restore();
  },
  // Crimson Frenzy: blood bursts out of the queen and crescents of red light whirl around her
  bloodburst(c, v, p, f, s){
    const T = tile;
    _once(v, 'a', true, () => { emitP(30, {x:s[0], y:s[1], s0:1, s1:4.5, l0:.5, l1:1.1, z0:.05, z1:.03, c:'170,10,28', g:6}); emitP(18, {x:s[0], y:s[1], s0:2, s1:5.5, l0:.3, l1:.7, z0:.05, z1:.01, c:'255,70,80', add:true, kind:'streak', g:3}); emitP(8, {x:s[0], y:s[1], s0:.4, s1:1.4, l0:.8, l1:1.4, z0:.2, z1:.45, c:'90,8,20', al:.4, drag:1.2}); });
    c.save(); c.translate(s[0], s[1]); c.lineCap = 'round'; c.scale(1, .85);
    for (let i=0;i<3;i++) for (let t=0;t<3;t++){ const a0 = p*10 + i*Math.PI*2/3 - t*.3, al = f*(1 - t*.3), r = T*(.5 + p*.45);
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(230,30,60,${al*.45})`; c.lineWidth = Math.max(4, T*(.12 - t*.03)); c.beginPath(); c.arc(0, 0, r, a0, a0 + 1.05); c.stroke();
      c.strokeStyle = `rgba(255,200,200,${al*.9})`; c.lineWidth = Math.max(1.2, T*(.035 - t*.008)); c.stroke(); }
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; _glowDisk(c, s[0], s[1], T*(.6 + p*.8), '220,20,50', .4*(1-p)); c.restore();
  },
  // Shadow Step: dark afterimages along the dash, smoke where she left, an implosion where she lands
  shadow(c, v, p, f, s, e){
    const T = tile;
    _once(v, 'a', true, () => { emitP(16, {x:s[0], y:s[1], s0:.4, s1:1.6, l0:.7, l1:1.3, z0:.14, z1:.4, c:'46,26,84', al:.55, drag:1.3, r:.2}); emitP(10, {x:s[0], y:s[1], s0:1, s1:3, l0:.4, l1:.8, z0:.05, z1:.01, c:'160,120,255', add:true, kind:'streak'}); });
    _once(v, 'b', p > .3, () => { emitP(14, {x:e[0], y:e[1], s0:1, s1:4, l0:.3, l1:.7, z0:.05, z1:.01, c:'190,150,255', add:true, kind:'streak'}); });
    const n = 7; for (let i=0;i<n;i++){ const q = i/(n-1), x = s[0] + (e[0]-s[0])*q, y = s[1] + (e[1]-s[1])*q, a = _cl(1 - (p*1.5 - q*.3))*.5*(i/n + .3);
      c.fillStyle = `rgba(60,30,110,${a})`; c.beginPath(); c.ellipse(x, y + T*.05, T*.15, T*.27, 0, 0, Math.PI*2); c.fill(); c.beginPath(); c.arc(x, y - T*.27, T*.1, 0, Math.PI*2); c.fill(); }
    c.save(); c.globalCompositeOperation = 'lighter'; _line(c, [s, e], T*.07, `rgba(170,130,255,${.5*f*(1-p)})`, 1);
    if (p > .25){ const k = _cl((p-.25)/.5); _ringE(c, e[0], e[1] + T*.15, T*(.7 - k*.6), T*(.28 - k*.2), 2, `rgba(170,120,255,${(1-k)*.9})`); } c.restore();
  },
  // the assassin's hits: crossed slashes of light, sparks flying
  xslash(c, v, p, f, s, e){
    const T = tile, k = _out(_cl(p/.35));
    _once(v, 'a', true, () => emitP(14, {x:e[0], y:e[1], s0:2, s1:5.5, l0:.25, l1:.55, z0:.05, z1:.01, c:'200,170,255', add:true, kind:'streak', g:3}));
    c.save(); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
    for (const sg of [1, -1]){ const r = T*.46*k, x0 = e[0] - r, x1 = e[0] + r, y0 = e[1] - sg*r, y1 = e[1] + sg*r, pts = [[x0, y0], [x0 + (x1-x0)*k, y0 + (y1-y0)*k]];
      _line(c, pts, Math.max(7, T*.14), `rgba(150,110,230,${.5*f})`, 1); _line(c, pts, Math.max(2.5, T*.05), `rgba(255,255,255,${f})`, 1); }
    _glowDisk(c, e[0], e[1], T*(.3 + k*.35), '190,150,255', .6*f); c.restore();
  },
  // Royal Duel: a rapier lunge with a bright blade, a flash on the point and a ring of honor
  thrust(c, v, p, f, s, e){
    const T = tile, k = _out(_cl(p/.28)), ex = s[0] + (e[0]-s[0])*(.45 + .55*k), ey = s[1] + (e[1]-s[1])*(.45 + .55*k), m = _cl((p-.25)/.75);
    _once(v, 'a', p > .22, () => emitP(18, {x:e[0], y:e[1], s0:2, s1:6, l0:.25, l1:.6, z0:.05, z1:.01, c:'255,240,200', add:true, kind:'streak', g:3}));
    c.save(); c.globalCompositeOperation = 'lighter'; const pts = [[s[0] + (e[0]-s[0])*.28, s[1] + (e[1]-s[1])*.28], [ex, ey]];
    _line(c, pts, T*.16, `rgba(255,235,190,${.35*f})`, 1); _line(c, pts, T*.05, `rgba(255,255,255,${f})`, 1);
    if (p > .22){ _glowDisk(c, e[0], e[1], T*(.25 + m*.5), '255,240,200', (1-m)*.9); c.strokeStyle = `rgba(255,255,255,${1-m})`; c.lineWidth = 2; c.beginPath(); for (let i=0;i<4;i++){ const a = i*Math.PI/2 + Math.PI/4, r = T*(.1 + m*.34); c.moveTo(e[0], e[1]); c.lineTo(e[0] + Math.cos(a)*r, e[1] + Math.sin(a)*r); } c.stroke();
      _ringE(c, e[0], e[1], T*(.2 + m*.45), T*(.2 + m*.45), 2, `rgba(227,180,86,${(1-m)*.9})`); }
    c.restore();
  },
  // Raise Dead: a skeletal hand claws out of cracked ground, souls of violet light rise
  hand(c, v, p, f, s, e){
    const T = tile*1.35, up = _out(_cl(p/.45)), x = e[0], y = e[1] + tile*.25, h = T*.5*up;
    _once(v, 'a', true, () => { emitP(14, {x, y, s0:.6, s1:2, a:-Math.PI/2, spread:.9, l0:.5, l1:1, z0:.1, z1:.3, c:'60,40,80', al:.45, drag:1.5, r:.2}); emitP(16, {x, y:y - T*.3, r:.2, s0:.6, s1:2.4, a:-Math.PI/2, spread:.5, l0:.8, l1:1.5, z0:.06, z1:.01, c:'190,120,255', add:true, kind:'streak', g:-.6}); });
    c.save(); c.lineCap = 'round'; c.globalAlpha = f;
    c.fillStyle = 'rgba(15,5,25,.7)'; c.beginPath(); c.ellipse(x, y, T*.34, T*.13, 0, 0, Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(8,2,14,.8)'; c.lineWidth = 1.4; c.beginPath(); for (let i=0;i<6;i++){ const a = i*Math.PI/3 + .3; c.moveTo(x, y); c.lineTo(x + Math.cos(a)*T*.34*up, y + Math.sin(a)*T*.13*up); } c.stroke();
    const bone = '#ece3cc', shade = '#a89e84';
    c.strokeStyle = shade; c.lineWidth = Math.max(4, T*.07); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke(); c.strokeStyle = bone; c.lineWidth = Math.max(2.4, T*.045); c.stroke();
    for (let i=0;i<4;i++){ const sp = (i - 1.5)*.15, curl = Math.sin(p*5 + i)*.04*T, bx = x + sp*T*.3, by = y - h, mx = x + sp*T*1.4, my = by - T*.14, tx = x + sp*T*2.0 + curl, ty = by - T*(.28 - Math.abs(sp)*.5);
      c.strokeStyle = shade; c.lineWidth = Math.max(3, T*.045); c.beginPath(); c.moveTo(bx, by); c.lineTo(mx, my); c.lineTo(tx, ty); c.stroke(); c.strokeStyle = bone; c.lineWidth = Math.max(1.8, T*.028); c.stroke();
      c.fillStyle = bone; for (const [jx, jy] of [[mx, my], [tx, ty]]){ c.beginPath(); c.arc(jx, jy, T*.022, 0, Math.PI*2); c.fill(); } }
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; _glowDisk(c, x, y - h*.6, T*.7, '170,90,255', .35*f); c.restore();
  },
};

let _fxCost = 0;   // moving average of what the effects cost per frame (ms): when it is high, the glow pass is skipped
function drawVfx(){
  const hasV = !!(fx.vfx && fx.vfx.length), hasP = !!(fx.sp && fx.sp.length) || !!(fx.ghosts && fx.ghosts.length);
  if (!hasV && !hasP) return;
  // only particles (a hit, a death): paint them straight onto the board, no extra layer and no glow
  if (!hasV){ drawSp(ctx); return; }
  const t0 = performance.now(), main = ctx, L = fxLayers(), c = L.getContext('2d'), sc = L.width / cv.width;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, L.width, L.height); c.setTransform(dpr*sc, 0, 0, dpr*sc, 0, 0);
  ctx = c;   // skill effects draw into a layer of their own
  for (const v of fx.vfx){
    const fn = VFX_DRAW[v.kind]; if (!fn) continue;
    const p = _cl(v.t / v.dur), f = p < .72 ? 1 : Math.max(0, 1 - (p-.72)/.28);
    c.save(); c.lineJoin = 'round';
    try { fn(c, v, p, f, sqCenter(v.x1, v.y1), sqCenter(v.x2, v.y2)); } catch (err) { /* a broken effect must never stop the game */ }
    c.restore();
  }
  drawSp(c);
  ctx = main;
  main.drawImage(L, 0, 0, cv.width/dpr, cv.height/dpr);
  if (_fxCost < 7) bloomOnto(main, L);
  _fxCost = _fxCost*.9 + (performance.now() - t0)*.1;
}
