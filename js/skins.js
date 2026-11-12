/* Rei Caído — Skins: the piece itself changes (material, glowing veins, sparkle and particles), not what it carries.
   Any piece can wear any skin. Each one is unlocked by a feat of the campaign, not by a class or a skill. */

const SKINS = {
  ember:{name:$t('Brasa', 'Cinder'), glow:'255,120,40', fill:['#8a4226', '#53261a', '#25100a'], stroke:'#ff9a4a', tex:'cracks', vein:'255,140,50', rate:.16,
    d:$t('Corpo carbonizado com veias de lava que pulsam. Solta brasas.', 'A charred body with pulsing lava veins. Sheds embers.'),
    feat:$t('Derrote as Torres Gêmeas', 'Defeat the Twin Towers'), ok:h => (h.bossesKilled||[]).includes('twins'),
    part:{c:'255,200,90', c2:'220,60,20', add:true, z0:.05, z1:.01, l0:.7, l1:1.3, s0:.05, s1:.25, a:-Math.PI/2, spread:.6, g:-.5, r:.18}},
  frost:{name:$t('Geada', 'Rime'), glow:'160,215,255', fill:['#a9d2ea', '#5f97bd', '#25496a'], stroke:'#c4e6fa', tex:'crystals', vein:'210,240,255', rate:.12,
    d:$t('Gelo vivo, com cristais na superfície e neve que cai da peça.', 'Living ice with surface crystals and snow falling off the piece.'),
    feat:$t('Derrote o Peão Eterno', 'Defeat the Eternal Pawn'), ok:h => (h.bossesKilled||[]).includes('pawn'),
    part:{c:'235,248,255', c2:'150,200,255', add:true, z0:.035, z1:.012, l0:.9, l1:1.5, s0:.02, s1:.1, a:Math.PI/2, spread:1.2, g:.12, r:.22, kind:'shard'}},
  bone:{name:$t('Ossada', 'Boneyard'), glow:'176,100,230', fill:['#f3ead2', '#cdbf9c', '#7d6e55'], stroke:'#3a2f22', tex:'cracks', vein:'170,90,240', dark:true, rate:.1,
    d:$t('Osso amarelado e rachado, com chamas violeta nas frestas.', 'Yellowed, cracked bone with violet flames in the gaps.'),
    feat:$t('Derrote a Rainha', 'Defeat the Queen'), ok:h => (h.bossesKilled||[]).includes('queen'),
    part:{c:'200,130,255', c2:'110,40,170', add:true, z0:.06, z1:.01, l0:.6, l1:1.1, s0:.04, s1:.18, a:-Math.PI/2, spread:.5, g:-.35, r:.16}},
  moss:{name:$t('Musgo', 'Mossbound'), glow:'130,190,90', fill:['#a9b88a', '#5f7a48', '#2a3a22'], stroke:'#1c2a16', tex:'moss', vein:'170,230,110', rate:.1,
    d:$t('Pedra velha coberta de musgo, com esporos que flutuam.', 'Old stone covered in moss, with drifting spores.'),
    feat:$t('Derrote o Cavalo de Mil Pernas', 'Defeat the Thousand-Legged Horse'), ok:h => (h.bossesKilled||[]).includes('knight'),
    part:{c:'200,240,130', c2:'90,150,60', add:true, z0:.03, z1:.015, l0:1.1, l1:1.9, s0:.02, s1:.07, spread:3.1, g:-.08, r:.25}},
  blood:{name:$t('Sangue', 'Gore'), glow:'220,30,50', fill:['#e0505a', '#9a1624', '#3a060c'], stroke:'#240306', tex:'gloss', vein:'255,90,100', rate:.09,
    d:$t('Laca carmesim e úmida, que pinga enquanto a peça respira.', 'Wet crimson lacquer that drips as the piece breathes.'),
    feat:$t('Conclua a campanha (Ato 4)', 'Finish the campaign (Act 4)'), ok:h => h.actDone>=4,
    part:{c:'200,20,40', c2:'110,6,16', add:false, z0:.035, z1:.02, l0:.55, l1:.9, s0:.02, s1:.05, a:Math.PI/2, spread:.25, g:1.6, r:.16, al:.85}},
  void:{name:$t('Vazio', 'Voidborn'), glow:'150,90,255', fill:['#3a2a6a', '#1a1238', '#07040f'], stroke:'#b690ff', tex:'stars', vein:'220,200,255', rate:.14,
    d:$t('Um corpo de noite estrelada. Pontos de luz nascem dele e se apagam.', 'A body of starry night. Points of light are born from it and fade.'),
    feat:$t('Derrote o Reflexo', 'Defeat the Reflection'), ok:h => (h.bossesKilled||[]).includes('mirror'),
    part:{c:'225,205,255', c2:'120,70,230', add:true, z0:.04, z1:.005, l0:.6, l1:1.2, s0:.03, s1:.14, spread:3.1, r:.3}},
  gold:{name:$t('Ouro Caído', 'Fallen Gold'), glow:'255,214,110', fill:['#fff0a8', '#e0b24a', '#7a5614'], stroke:'#4a3208', tex:'sheen', vein:'255,245,190', rate:.1,
    d:$t('Metal dourado polido, com faíscas de luz. A peça de um rei derrubado.', 'Polished gilded metal with glints of light. The piece of a fallen king.'),
    feat:$t('Derrote o Rei Caído', 'Defeat the Fallen King'), ok:h => (h.fallenKills||0)>0,
    part:{c:'255,240,170', c2:'255,190,60', add:true, z0:.04, z1:.005, l0:.5, l1:.9, s0:.02, s1:.1, spread:3.1, r:.26}}
};
const SKIN_ORDER = ['ember', 'frost', 'bone', 'moss', 'blood', 'void', 'gold'];
for (const id of SKIN_ORDER) SKINS[id].id = id;
const skinUnlocked = (h, id) => !!SKINS[id] && !!h && SKINS[id].ok(h);
const skinId = () => HERO && HERO.skin && skinUnlocked(HERO, HERO.skin) ? HERO.skin : null;

// a deterministic random stream, so the same piece always gets the same veins
function _skinRng(seed){ let s = 0; for (let i=0;i<seed.length;i++) s = (s*31 + seed.charCodeAt(i)) | 0; return () => { s = (s*1664525 + 1013904223) | 0; return ((s >>> 8) & 0xffff)/0xffff; }; }

// the body: the glyph filled with the skin's gradient, a texture clipped to its shape, a rim light and an outline
const _skCache = new Map();
function skinSprite(ch, sz, skin, dpr_){
  const D = dpr_ || 1, k = ch + '|' + skin.id + '|' + Math.round(sz*D);
  let s = _skCache.get(k); if (s) return s;
  if (_skCache.size > 60) _skCache.clear();
  const pad = Math.ceil(sz*.35), w = Math.ceil((sz + pad*2)*D), body = document.createElement('canvas'), glow = document.createElement('canvas');
  body.width = body.height = glow.width = glow.height = w;
  const c = body.getContext('2d'), g = glow.getContext('2d'), L = w/D, cx = L/2, cy = L/2, rnd = _skRng(k);
  for (const q of [c, g]){ q.scale(D, D); q.font = sz + 'px ' + GF; q.textAlign = 'center'; q.textBaseline = 'middle'; q.lineJoin = 'round'; }
  const gr = c.createLinearGradient(0, cy - sz*.5, 0, cy + sz*.5); gr.addColorStop(0, skin.fill[0]); gr.addColorStop(.5, skin.fill[1]); gr.addColorStop(1, skin.fill[2]);
  c.fillStyle = gr; c.fillText(ch, cx, cy);
  const x0 = cx - sz*.4, y0 = cy - sz*.45, bw = sz*.8, bh = sz*.9;
  const inside = () => [x0 + rnd()*bw, y0 + rnd()*bh];
  c.globalCompositeOperation = 'source-atop'; g.globalCompositeOperation = 'source-over';
  const vein = (q, x, y, len, ang, w0, col, depth, r) => {   // a branching crack, drawn from the stream r so it can be replayed
    r = r || rnd; q.strokeStyle = col; q.lineWidth = w0; q.lineCap = 'round'; q.beginPath(); q.moveTo(x, y);
    let px = x, py = y, a = ang;
    for (let i=0;i<4;i++){ a += (r()-.5)*1.1; px += Math.cos(a)*len/4; py += Math.sin(a)*len/4; q.lineTo(px, py); if (depth>0 && r()<.45) vein(q, px, py, len*.55, a + (r()<.5?-1:1)*.9, w0*.7, col, depth-1, r); q.moveTo(px, py); }
    q.stroke();
  };
  const t = skin.tex;
  if (t==='cracks'){
    // the dark cracks and the glowing veins share one random stream, so the light sits exactly in the cracks
    for (const [q, col, lw] of [[c, skin.dark ? 'rgba(40,24,14,.85)' : 'rgba(0,0,0,.75)', Math.max(1, sz*.03)], [g, 'rgba(' + skin.vein + ',1)', Math.max(1.4, sz*.04)]]){
      const r2 = _skRng(k + 'v');
      for (let i=0;i<5;i++){ const x = x0 + r2()*bw, y = y0 + r2()*bh; vein(q, x, y, sz*.38, r2()*6.28, lw, col, 1, r2); }
    }
  } else if (t==='crystals'){
    for (let i=0;i<14;i++){ const [x, y] = inside(), a = rnd()*6.28, l = sz*(.05 + rnd()*.09);
      c.fillStyle = 'rgba(225,245,255,' + (.14 + rnd()*.3) + ')'; c.beginPath(); c.moveTo(x + Math.cos(a)*l, y + Math.sin(a)*l); c.lineTo(x + Math.cos(a+2.4)*l*.35, y + Math.sin(a+2.4)*l*.35); c.lineTo(x + Math.cos(a+3.9)*l*.35, y + Math.sin(a+3.9)*l*.35); c.closePath(); c.fill(); }
    for (let i=0;i<4;i++){ const [x, y] = inside(); vein(c, x, y, sz*.3, rnd()*6.28, Math.max(.8, sz*.018), 'rgba(225,245,255,.4)', 1); }
  } else if (t==='moss'){
    for (let i=0;i<26;i++){ const [x, y] = inside(), r = sz*(.04 + rnd()*.09); const lo = y > cy - sz*.1 ? 1 : .5;   // thicker toward the base
      c.fillStyle = 'rgba(' + (60 + (rnd()*50|0)) + ',' + (120 + (rnd()*60|0)) + ',50,' + (.5*lo + rnd()*.3) + ')'; c.beginPath(); c.arc(x, y, r, 0, 6.28); c.fill(); }
    for (let i=0;i<3;i++){ const [x, y] = inside(); vein(c, x, y, sz*.3, rnd()*6.28, Math.max(1, sz*.025), 'rgba(20,30,14,.6)', 1); }
  } else if (t==='gloss'){
    const hl = c.createLinearGradient(cx - sz*.4, cy - sz*.4, cx + sz*.1, cy + sz*.1); hl.addColorStop(0, 'rgba(255,230,230,.55)'); hl.addColorStop(.4, 'rgba(255,200,200,.12)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = hl; c.fillRect(0, 0, L, L);
    for (let i=0;i<3;i++){ const x = x0 + bw*(.2 + rnd()*.6), y = y0 + bh*(.45 + rnd()*.3); c.fillStyle = 'rgba(30,0,4,.55)'; c.beginPath(); c.ellipse(x, y + sz*.08, sz*.018, sz*.1, 0, 0, 6.28); c.fill(); }
  } else if (t==='stars'){
    const nb = c.createRadialGradient(cx - sz*.1, cy, sz*.05, cx, cy, sz*.6); nb.addColorStop(0, 'rgba(110,70,210,.5)'); nb.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = nb; c.fillRect(0, 0, L, L);
    for (let i=0;i<30;i++){ const [x, y] = inside(); c.fillStyle = 'rgba(255,255,255,' + (.3 + rnd()*.6) + ')'; c.beginPath(); c.arc(x, y, Math.max(.5, sz*(.006 + rnd()*.012)), 0, 6.28); c.fill(); }
  } else if (t==='sheen'){
    const bd = c.createLinearGradient(cx - sz*.5, cy - sz*.5, cx + sz*.5, cy + sz*.5); bd.addColorStop(0, 'rgba(255,255,255,0)'); bd.addColorStop(.3, 'rgba(255,255,255,.5)'); bd.addColorStop(.38, 'rgba(255,255,255,0)'); bd.addColorStop(.7, 'rgba(255,255,255,.28)'); bd.addColorStop(.78, 'rgba(255,255,255,0)');
    c.fillStyle = bd; c.fillRect(0, 0, L, L);
    c.fillStyle = 'rgba(80,50,6,.28)'; for (let i=0;i<4;i++){ const [x, y] = inside(); c.fillRect(x, y, sz*.14, Math.max(1, sz*.012)); }   // engraved lines
  }
  // rim light along the lit edge, shade at the base
  const sh = c.createLinearGradient(0, cy, 0, cy + sz*.5); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = sh; c.fillRect(0, 0, L, L);
  c.globalCompositeOperation = 'destination-over'; c.strokeStyle = skin.stroke; c.lineWidth = Math.max(1.5, sz*.05); c.strokeText(ch, cx, cy);
  // the emissive layer is clipped to the glyph and sampled for twinkle points
  g.globalCompositeOperation = 'destination-in'; g.fillStyle = '#000'; g.fillText(ch, cx, cy);
  const pts = [];
  if (t==='stars' || t==='sheen' || t==='crystals' || t==='moss'){
    const m = document.createElement('canvas'); m.width = m.height = 48; const mc = m.getContext('2d'); mc.font = (sz*48/L) + 'px ' + GF; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillText(ch, 24, 24 + 0);
    const dta = mc.getImageData(0, 0, 48, 48).data, r3 = _skRng(k + 'p');
    for (let tries=0; tries<400 && pts.length<7; tries++){ const px = (r3()*48)|0, py = (r3()*48)|0; if (dta[(py*48 + px)*4 + 3] > 140) pts.push([(px/48 - .5)*L, (py/48 - .5)*L, r3()*6.28]); }
  }
  s = {body, glow, L, pts};
  _skCache.set(k, s); return s;
}
const _skRng = _skinRng;

// the piece in a skin, drawn at (cx, cy) with its feet at the baseline: body, then the pulsing glow layer on top of it
function drawSkinBody(c, ch, sz, skin, cx, cy, time, dpr_){
  const sp = skinSprite(ch, sz, skin, dpr_), pulse = reduce ? .75 : .65 + .35*Math.sin(time*2.6);
  c.drawImage(sp.body, cx - sp.L/2, cy - sp.L/2, sp.L, sp.L);
  if (skin.tex==='cracks' || skin.tex==='stars' || skin.tex==='crystals' || skin.tex==='moss' || skin.tex==='sheen'){
    const pr = skin.tex==='cracks' ? pulse : .9;
    if (skin.tex==='cracks'){ c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = pr; c.drawImage(sp.glow, cx - sp.L/2, cy - sp.L/2, sp.L, sp.L); c.restore(); }
    if (sp.pts.length){
      c.save(); c.globalCompositeOperation = 'lighter';
      const gs = typeof glowSprite==='function' ? glowSprite(skin.vein) : null;
      for (const [px, py, ph] of sp.pts){ const a = reduce ? .5 : Math.max(0, Math.sin(time*(skin.tex==='sheen' ? 2.4 : 1.7) + ph)); if (a < .05 || !gs) continue; const r = sz*(.045 + .07*a); c.globalAlpha = a*.9; c.drawImage(gs, cx + px - r, cy + py - r, r*2, r*2); }
      c.restore();
    }
  }
}

// board: the particles and the glow that go with the skin, around the piece at (px, py)
function skinFx(skin, px, py, time){
  const T = tile, cx = (px+.5)*T, cy = (py+.5)*T;
  ctx.save();
  const pulse = reduce ? .6 : .6 + .25*Math.sin(time*2.2), gs = glowSprite(skin.glow), r = T*.62;
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .28*pulse; ctx.drawImage(gs, cx - r, cy - r*.8 + T*.12, r*2, r*2);
  ctx.restore();
  if (!reduce && Math.random() < skin.rate && typeof emitP==='function') emitP(1, Object.assign({x:cx, y:cy + T*.1}, skin.part));
}

// a small preview of a piece wearing a skin (camp cards): paints into a canvas of its own
function skinPreview(cv_, ch, skin){
  const d = window.devicePixelRatio || 1, w = 96, h = 112; cv_.width = w*d; cv_.height = h*d; cv_.style.width = w+'px'; cv_.style.height = h+'px';
  const c = cv_.getContext('2d'); c.scale(d, d);
  const g = c.createRadialGradient(w/2, h*.62, 2, w/2, h*.62, w*.55); g.addColorStop(0, 'rgba(' + skin.glow + ',.32)'); g.addColorStop(1, 'rgba(' + skin.glow + ',0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(w/2, h*.84, 24, 7, 0, 0, 6.28); c.fill();
  drawSkinBody(c, ch, 72, skin, w/2, h*.5, 0, d);
}
function drawSkinPreviews(){
  const h = HERO; if (!h) return;
  document.querySelectorAll('canvas[data-skinprev]').forEach(cv_ => { const id = cv_.dataset.skinprev; if (SKINS[id]) skinPreview(cv_, GLYPH[h.cls], SKINS[id]); });
}
