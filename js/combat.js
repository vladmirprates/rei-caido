/* Rei Caído — stats, skills, combat, allies, turn flow */

/* ---------- Stats ---------- */
function stats(){ return statsFor(S.cls, S.color, S.equip); }
// stats for any class/faction/equipment set (the camp uses it to preview swaps)
function statsFor(cls, color, equip){
  const c = CLASSES[cls];
  const st = {dmg:c.dmg + Math.floor(HERO.level/10), hp:c.hp + (HERO.level-1), shield:0, cdr:0, chain:0, trample:0, killFury:0, killCdr:0, killStep:0,
              crit:0, eliteDmg:0, block:0, healKill:0, mf:0, gold:0, fireDmg:0, coldDmg:0, lightDmg:0, resFire:0, resCold:0, resLight:0,
              vamp:color==='b' ? 1 : 0, thorns:0, darkQuake:0, pushPower:0, fortify:0, holy:0, bladeStorm:0};
  const add = a => {
    switch (a.k){
      case 'dmg': st.dmg+=a.v; break;
      case 'hp': st.hp+=a.v; break;
      case 'shield': st.shield+=a.v; break;
      case 'cdr': st.cdr+=a.v; break;
      case 'crit': case 'eliteDmg': case 'block': case 'healKill': case 'mf': case 'gold':
      case 'fireDmg': case 'coldDmg': case 'lightDmg': case 'resFire': case 'resCold': case 'resLight': st[a.k]+=a.v; break;
      case 'trample': st.trample+=1; break;
      case 'chain': case 'killFury': case 'killCdr': case 'killStep': st[a.k]+=1; break;   // each source stacks
      case 'vamp': st.vamp+=2; break;
      case 'thorns': st.thorns+=2; break;
      case 'darkQuake': st.darkQuake+=3; break;
      case 'pushPower': st.pushPower+=3; break;
      case 'fortify': st.fortify+=4; break;
      case 'holy': st.holy+=4; break;
      case 'bladeStorm': st.bladeStorm+=3; break;
      default: st[a.k] = true;
    }
  };
  for (const it of Object.values(equip)) if (it) it.affixes.forEach(add);
  const T = treeFor(cls);
  for (const id of (HERO.tree||[])) if (T[id]) T[id].aff.forEach(add);
  for (const id in (HERO.grimoire||{})) st['g_'+id] = true;
  st.cdr = Math.min(st.cdr, 3); st.crit = Math.min(st.crit, 60); st.block = Math.min(st.block, 40);
  for (const k of ['resFire','resCold','resLight']) st[k] = Math.min(st[k], 75);
  return st;
}
// a distinct hit effect for each element on your weapon: fire bursts into flames, cold shatters into frost, lightning arcs
function elemFx(e, st){
  const p = S.player;
  if (st.fireDmg) sfx('fire');
  if (st.coldDmg) sfx('cold');
  if (st.lightDmg) sfx('zap');
  if (st.fireDmg){ burst(e.x, e.y, '#ff7a2a', 14); burst(e.x, e.y, '#ffd27a', 6); fx.rings.push({x:e.x, y:e.y, t:.15, c:'255,120,40'}); }
  if (st.coldDmg){ burst(e.x, e.y, '#bfe4ff', 14); burst(e.x, e.y, '#ffffff', 5); fx.rings.push({x:e.x, y:e.y, t:.15, c:'150,205,255'}); }
  if (st.lightDmg){ fx.beams.push({x1:p.x, y1:p.y, x2:e.x, y2:e.y, t:0, c:'205,225,255', zig:true}); burst(e.x, e.y, '#e8f0ff', 10); }
}
function attackDmg(st, target){
  // in the camp (skill descriptions) there is no expedition: show the base damage
  if (!S) return st.dmg + (st.gambit ? 3 : 0);
  let d = st.dmg + (S.nextBonus||0) + (S.turnBonus||0) + (S.floorBonus||0);
  if (st.fury && S.player.hp*2 < st.hp) d += 2;
  if (st.granite && !S.movedThisTurn) d += 2;
  if (st.gambit) d += 3;
  if (target && S.color==='b' && target.moved) d += 2;
  if (target && st.momentum) d += S.cls==='N' ? 3 : Math.min(3, Math.max(0, cheb(target.x,target.y,S.player.x,S.player.y)-1));
  if (target && S.cls==='B' && S.walls && cheb(target.x,target.y,S.player.x,S.player.y)>=3) d += 1;   // Bishop: reward for keeping distance
  // elemental damage on top; the target's resistance cuts only its own element
  for (const el of ['fire','cold','light']){ const v = st[el+'Dmg']; if (v) d += target && target.res && target.res[el] ? Math.round(v*(1-target.res[el]/100)) : v; }
  if (target && (target.elite || target.boss) && st.eliteDmg) d = Math.ceil(d * (1 + st.eliteDmg/100));
  if (target && S.walls){   // Grimoire: powers learned from the checkmate patterns
    const p = S.player, ax = Math.abs(target.x-p.x), ay = Math.abs(target.y-p.y);
    if (st.g_corredor && (target.y===0 || target.y===H-1)) d += 2;
    if (st.g_anastacia && (target.x===0 || target.x===W-1)) d += 1;
    if (st.g_arabe && ALL.some(([dx,dy]) => isWall(target.x+dx, target.y+dy))) d += 1;
    if (st.g_boden && ax===ay && ax>0) d += 1;
    if (st.g_beijo && Math.max(ax,ay)===1) d += 1;
    if (st.g_greco && (ax===0 || ay===0) && Math.max(ax,ay)>=2) d += 1;
    if (st.g_escada && !S.firstHitDone) d += 3;
    if (st.g_sufocado && ALL.filter(([dx,dy]) => enemyAt(target.x+dx, target.y+dy)).length>=2) d = Math.ceil(d*1.5);
  }
  if (S.terrain && isWater(S.player.x, S.player.y)) d = Math.max(1, d-1);
  return d;
}
// Reaping: 2 actions per turn with one source, +1 per extra source; Regicide alone allows 5 (Reaping adds to it)
const chainCap = st => (st.chain ? 1 + st.chain : 0) + (st.regicide ? (st.chain ? 4 : 5) : 0);
function newRound(){
  Object.assign(S, {chainUsed:0, mirrorUsed:false, freeSwapUsed:false, escapeUsed:false, turnBonus:0, movedThisTurn:false, moveOnly:false, untouchable:false, furyTurn:0, harvestTurn:0, stepTurn:0});
  if (!S.crownReady && S.turn - (S.crownAt||0) >= 4 && stats().shatterCrown){ S.crownReady = true; floatText(S.player.x, S.player.y-0.5, $t('coroa pronta', 'crown ready'), '#e3b456'); }
  for (const e of S.enemies){ e.jumped = false; if (e.exhausted) e.exhausted--; if (e.judged) e.judged--; }
}

/* ---------- Skills ---------- */
function nearestEnemyDist(x,y){ let d=99; for (const e of S.enemies) d = Math.min(d, cheb(x,y,e.x,e.y)); return d; }
function hitAround(x, y, amt, stunIt){
  for (const [dx,dy] of ALL){ const e = enemyAt(x+dx,y+dy); if (e){ skillHit(e, amt); if (stunIt) stun(e); } }
}
// returns true when the enemy hit something (bonus damage); a pit swallows non-boss enemies
/* ---------- Skill bar and runes ---------- */
// skills on the bar: chosen in the camp (max 3, unlocked by level); the Bishop always has Color Shift
function barSkills(){
  const pool = CLASSES[HERO.cls].skills, ok = id => { const i = pool.indexOf(id); return i>=0 && HERO.level >= SKILL_UNLOCK[i]; };
  if (!Array.isArray(HERO.skills)) HERO.skills = pool.filter(ok).slice(0, BAR_MAX);
  const bar = HERO.skills.filter(ok).slice(0, BAR_MAX);
  return HERO.cls==='B' ? [...bar, 'shift'] : bar;
}
const runeOf = id => (HERO.skillRunes || {})[id] || null;
function skillHit(e, amt){
  if (!S.enemies.includes(e)) return;
  elemFx(e, stats());
  const r = runeOf(S.curSkill);
  if (r==='forca') amt += 2;
  damageEnemy(e, amt, 'player');
  if (r==='sangue') heal(1);
  if (r==='brasas') S.fire.set(key(e.x,e.y), 2);
  if (!S.enemies.includes(e)) return;
  if (r==='carrasco' && !e.boss && e.hp*4 <= e.maxHp){ floatText(e.x, e.y-0.4, $t('carrasco', 'executed'), '#f08a3c'); damageEnemy(e, e.hp + e.shield + 99, 'player'); return; }
  if (r==='trovao') stun(e);
}
function startCd(id){
  sfx('skill');
  if (S.tut) S.tut.skillUsed = true;
  S.cds[id] = skillCd(id);
  if (runeOf(id)==='eco' && rnd()<.3){ S.cds[id] = 0; floatText(S.player.x, S.player.y-0.4, $t('eco', 'echo'), '#c9a0ff'); }
}
function runSkill(id, ...args){ S.curSkill = id; try { return SKILLS[id].run(...args); } finally { S.curSkill = null; } }
function pushEnemy(e, dx, dy){
  const fallsAt = (x,y) => inb(x,y) && isPit(x,y) && !e.boss;
  if (fallsAt(e.x+dx, e.y+dy)){ fallInPit(e, e.x+dx, e.y+dy); return false; }
  if (!inb(e.x+dx,e.y+dy) || occupied(e.x+dx,e.y+dy)) return true;
  e.x += dx; e.y += dy;
  while (isIce(e.x,e.y)){
    if (fallsAt(e.x+dx, e.y+dy)){ fallInPit(e, e.x+dx, e.y+dy); return false; }
    if (!inb(e.x+dx,e.y+dy) || occupied(e.x+dx,e.y+dy)) break;
    e.x += dx; e.y += dy;
  }
  return false;
}
function fallInPit(e, px, py){
  floatText(px, py, $t('caiu no fosso', 'fell into the pit'), '#cdbb9c'); burst(px, py, '#4a3b30', 18);
  fx.rings.push({x:px, y:py, t:0, c:'90,70,55'}); fx.shake = Math.max(fx.shake, 6);
  log($t(`${enemyName(e)} caiu no fosso.`, `${enemyName(e)} fell into the pit.`));
  damageEnemy(e, 9999, 'player');
}
// player movement that respects ice
function moveTo(x, y){
  const p = S.player, dx = x-p.x, dy = y-p.y;
  sfx(S.cls==='N' ? 'jump' : 'move');
  landOn(x, y);
  if (!isIce(x,y) || stats().forgeWalk) return;
  const [sx,sy] = slideEnd(x, y, dx, dy);
  if (sx!==x || sy!==y){ sfx('slide'); floatText(x, y-0.2, $t('escorrega', 'slides'), '#cfe6f5'); burst(x, y, '#dff0fa', 8); landOn(sx, sy); }
}
const SKILLS = {
  quake:{name:$t('Salto Sísmico', 'Seismic Leap'), cd:4, target:true, hits:true,
    desc:st=>$t(`Salta em L e causa ${st.dmg+st.darkQuake} a todos ao redor${st.quakeStun?', atordoando':''}`, `Leaps in an L and deals ${st.dmg+st.darkQuake} to everything around${st.quakeStun?', stunning':''}`),
    targets(){
      const st = stats(); let offs = KN.slice(); if (st.longJump) offs = offs.concat(KN3);
      return offs.map(([dx,dy])=>[S.player.x+dx,S.player.y+dy]).filter(([x,y]) => inb(x,y) && !occupied(x,y));
    },
    run(x,y){
      const st = stats();
      landOn(x,y);
      fx.shake = Math.max(fx.shake, 9); fx.rings.push({x, y, t:0});
      hitAround(x, y, st.dmg+st.darkQuake, st.quakeStun);
      log($t('Salto Sísmico.', 'Seismic Leap.'));
    }},
  gallop:{name:$t('Galope', 'Gallop'), cd:5, free:true, desc:st=>$t(`Ganha +1 ação neste turno${st.cavalry?' e o próximo golpe causa +2':''}. Não gasta ação.`, `Gain +1 action this turn${st.cavalry?' and the next blow deals +2':''}. Costs no action.`),
    run(){ S.actions++; floatText(S.player.x, S.player.y, $t('+1 ação', '+1 action'), '#e3b456'); if (stats().cavalry) S.nextBonus = 2; log($t('Galope.', 'Gallop.')); }},
  shove:{name:$t('Empurrão', 'Shove'), cd:3, hits:true,
    desc:st=>$t(`Fere em cruz (${st.dmg}), empurra e atordoa. +${2+st.pushPower} se baterem em algo`, `Hits in a cross (${st.dmg}), pushes and stuns. +${2+st.pushPower} if they hit something`),
    run(){
      const st = stats(), p = S.player;
      fx.rings.push({x:p.x, y:p.y, t:0}); fx.shake = Math.max(fx.shake, 6);
      for (const [dx,dy] of ORTH){
        const e = enemyAt(p.x+dx, p.y+dy); if (!e) continue;
        const blocked = pushEnemy(e, dx, dy);
        if (!S.enemies.includes(e)) continue;
        e.intent = {kind:'wait', stunned:true};
        skillHit(e, st.dmg + (blocked ? 2+st.pushPower : 0));
      }
      log($t('Empurrão.', 'Shove.'));
    }},
  fortress:{name:$t('Muralha', 'Wall'), cd:5, free:true, desc:st=>$t(`Ganha ${6+st.fortify} de escudo. Não gasta ação.`, `Gain ${6+st.fortify} shield. Costs no action.`),
    run(){ const n = 6+stats().fortify; S.shield += n; floatText(S.player.x, S.player.y, '+'+n+$t(' escudo', ' shield'), '#a9bfd6'); log($t('Muralha.', 'Wall.')); }},
  beam:{name:$t('Raio Diagonal', 'Diagonal Ray'), cd:3, hits:true,
    desc:st=>$t(`Atravessa as diagonais${st.crossBeam?' e retas':''} causando ${st.dmg+1}${st.beamStun?', atordoando':''}`, `Pierces the diagonals${st.crossBeam?' and straight lines':''} dealing ${st.dmg+1}${st.beamStun?', stunning':''}`),
    run(){
      const st = stats(), p = S.player;
      for (const [dx,dy] of (st.crossBeam ? ALL : DIAG)){
        let x=p.x+dx, y=p.y+dy, ex=p.x, ey=p.y; const hits=[];
        while (inb(x,y) && !isWall(x,y)){ const e = enemyAt(x,y); if (e) hits.push(e); ex=x; ey=y; x+=dx; y+=dy; }
        if (ex!==p.x || ey!==p.y) fx.beams.push({x1:p.x, y1:p.y, x2:ex, y2:ey, t:0, c:'224,122,50'});
        for (const e of hits){
          skillHit(e, st.dmg+1);
          if (st.beamStun) stun(e);
          if (st.rosary && !S.enemies.includes(e)) S.cds.beam = Math.max(0, (S.cds.beam||0)-1);
        }
      }
      log($t('Raio Diagonal.', 'Diagonal Ray.'));
    }},
  storm:{name:$t('Tempestade de Lâminas', 'Blade Storm'), cd:3, hits:true, desc:st=>$t(`Causa ${attackDmg(st)+st.bladeStorm} a todos ao redor`, `Deals ${attackDmg(st)+st.bladeStorm} to everything around`),
    run(){ const st = stats(); fx.rings.push({x:S.player.x, y:S.player.y, t:0}); fx.shake = Math.max(fx.shake,6); hitAround(S.player.x, S.player.y, attackDmg(st)+st.bladeStorm); log($t('Tempestade de Lâminas.', 'Blade Storm.')); }},
  sacrifice:{name:$t('Sacrifício', 'Sacrifice'), cd:3, free:true,
    desc:st=>st.redSacrifice ? $t('Perde 1 de vida, ganha +1 ação e +1 de dano no turno. Não gasta ação.', 'Lose 1 health, gain +1 action and +1 damage this turn. Costs no action.') : $t('Perde 3 de vida e ganha +1 ação. Não gasta ação.', 'Lose 3 health and gain +1 action. Costs no action.'),
    can:()=>S.player.hp > (stats().redSacrifice ? 1 : 3),
    run(){
      const red = stats().redSacrifice, cost = red ? 1 : 3;
      S.player.hp -= cost; S.actions++; if (red) S.turnBonus += 1;
      floatText(S.player.x, S.player.y, $t(`-${cost} / +1 ação`, `-${cost} / +1 action`), '#ff6b5e'); burst(S.player.x, S.player.y, '#b8332b', 10); log($t('Sacrifício.', 'Sacrifice.'));
    }},
  summon:{name:$t('Convocar Peão', 'Summon Pawn'), cd:2,
    desc:st=>$t(`${st.twinSummon?'Dois peões aliados surgem':'Um peão aliado surge'} ao seu lado (máx. ${MAX_ALLIES})`, `${st.twinSummon?'Two allied pawns appear':'An allied pawn appears'} next to you (max. ${MAX_ALLIES})`),
    can:()=>S.allies.length < MAX_ALLIES && freeAdj().length > 0,
    run(){
      const n = stats().twinSummon ? 2 : 1;
      for (let i=0; i<n && S.allies.length<MAX_ALLIES; i++){
        const f = freeAdj(); if (!f.length) break;
        f.sort((a,b)=>nearestEnemyDist(a[0],a[1])-nearestEnemyDist(b[0],b[1]));
        const [x,y] = f[0];
        S.allies.push(makeAlly('P', x, y, S.player.x, S.player.y));
        burst(x, y, '#e3b456', 10);
      }
      log(n>1 ? $t('Dois peões atendem ao chamado.', 'Two pawns answer the call.') : $t('Um peão atende ao chamado.', 'A pawn answers the call.'));
    }},
  shift:{name:$t('Troca de Cor', 'Color Shift'), cd:3, target:true,
    desc:st=>$t(`Dá 1 passo reto para uma casa vazia e passa para a outra cor${st.holy?`, curando ${st.holy}`:''}${st.stainedGlass?' e ganhando 4 de escudo':''}`, `Takes 1 straight step to an empty square and switches to the other color${st.holy?`, healing ${st.holy}`:''}${st.stainedGlass?' and gaining 4 shield':''}`),
    targets(){ return ORTH.map(([dx,dy])=>[S.player.x+dx,S.player.y+dy]).filter(([x,y]) => inb(x,y) && !occupied(x,y)); },
    run(x,y){
      const ox = S.player.x, oy = S.player.y;
      moveTo(x,y);
      const st = stats();
      if (st.holy) heal(st.holy);
      if (st.stainedGlass){ S.shield += 4; floatText(S.player.x, S.player.y-0.3, $t('+4 escudo', '+4 shield'), '#a9bfd6'); }
      fx.rings.push({x:S.player.x, y:S.player.y, t:0, c:'227,180,86'}); burst(ox, oy, '#e3b456', 8);
      log($t('Troca de Cor.', 'Color Shift.'));
    }},
  kick:{name:$t('Coice', 'Kick'), cd:3, hits:true, desc:st=>$t(`Atinge todos os inimigos a um salto em L de você com ${st.dmg+1}, sem se mover`, `Hits every enemy one L-leap from you for ${st.dmg+1}, without moving`),
    can:()=>KN.some(([dx,dy]) => enemyAt(S.player.x+dx, S.player.y+dy)),
    run(){ const st = stats(), p = S.player;
      for (const [dx,dy] of KN){ const e = enemyAt(p.x+dx,p.y+dy); if (e){ fx.beams.push({x1:p.x, y1:p.y, x2:e.x, y2:e.y, t:0, c:'227,180,86'}); skillHit(e, st.dmg+1); } }
      fx.shake = Math.max(fx.shake, 6); log($t('Coice.', 'Kick.')); }},
  neigh:{name:$t('Relincho', 'Neigh'), cd:5, hits:true, desc:()=>$t('Causa 1 a todos os vizinhos, empurra cada um 1 casa para longe e os atordoa', 'Deals 1 to every neighbor, pushes each one 1 square away and stuns them'),
    can:()=>ALL.some(([dx,dy]) => enemyAt(S.player.x+dx, S.player.y+dy)),
    run(){ const p = S.player; fx.rings.push({x:p.x, y:p.y, t:0, c:'227,180,86'});
      for (const [dx,dy] of ALL){ const e = enemyAt(p.x+dx,p.y+dy); if (!e) continue; skillHit(e, 1); if (S.enemies.includes(e) && !e.boss) pushEnemy(e, dx, dy); stun(e); }
      log($t('Relincho.', 'Neigh.')); }},
  charge:{name:$t('Aríete', 'Battering Ram'), cd:4, target:true, hits:true, desc:st=>$t(`Avança em linha reta até a parede, atravessando inimigos e causando ${st.dmg} a cada um`, `Charges in a straight line to the wall, passing through enemies and dealing ${st.dmg} to each`),
    targets(){ const p = S.player, out = [];
      for (const [dx,dy] of ORTH){ let x=p.x+dx, y=p.y+dy, last=null;
        while (inb(x,y) && !isWall(x,y) && !isPit(x,y)){ if (!occupied(x,y)) last = [x,y]; x+=dx; y+=dy; }
        if (last && cheb(last[0],last[1],p.x,p.y)>=2) out.push(last); }
      return out; },
    run(x,y){ const st = stats(), p = S.player, dx = Math.sign(x-p.x), dy = Math.sign(y-p.y);
      for (let cx=p.x+dx, cy=p.y+dy; cx!==x || cy!==y; cx+=dx, cy+=dy){ const e = enemyAt(cx,cy); if (e) skillHit(e, st.dmg); }
      fx.beams.push({x1:p.x, y1:p.y, x2:x, y2:y, t:0, c:'224,122,50'}); fx.shake = Math.max(fx.shake, 7);
      moveTo(x,y); log($t('Aríete.', 'Battering Ram.')); }},
  tremor:{name:$t('Tremor', 'Tremor'), cd:4, hits:true, desc:st=>$t(`Causa ${Math.max(1,st.dmg-1)} a todos os inimigos na sua fileira e coluna, até os pilares`, `Deals ${Math.max(1,st.dmg-1)} to every enemy in your row and column, up to the pillars`),
    run(){ const st = stats(), p = S.player;
      for (const [dx,dy] of ORTH){ let x=p.x+dx, y=p.y+dy, ex=p.x, ey=p.y;
        while (inb(x,y) && !isWall(x,y)){ const e = enemyAt(x,y); if (e) skillHit(e, Math.max(1, st.dmg-1)); ex=x; ey=y; x+=dx; y+=dy; }
        if (ex!==p.x || ey!==p.y) fx.beams.push({x1:p.x, y1:p.y, x2:ex, y2:ey, t:0, c:'200,170,130'}); }
      fx.shake = Math.max(fx.shake, 9); log($t('Tremor.', 'Tremor.')); }},
  judge:{name:$t('Julgamento', 'Judgment'), cd:4, target:true, hits:true, desc:st=>$t(`Atinge um inimigo nas suas diagonais com ${st.dmg} e o marca: recebe +50% de dano por 2 turnos`, `Hits an enemy on your diagonals for ${st.dmg} and marks it: takes +50% damage for 2 turns`),
    targets(){ const p = S.player, out = [];
      for (const [dx,dy] of DIAG){ let x=p.x+dx, y=p.y+dy; while (inb(x,y) && !isWall(x,y)){ if (enemyAt(x,y)){ out.push([x,y]); break; } x+=dx; y+=dy; } }
      return out; },
    run(x,y){ const e = enemyAt(x,y); if (!e) return;
      fx.beams.push({x1:S.player.x, y1:S.player.y, x2:x, y2:y, t:0, c:'240,214,140'});
      skillHit(e, stats().dmg);
      if (S.enemies.includes(e)){ e.judged = 3; floatText(e.x, e.y-0.4, $t('julgado', 'judged'), '#f0d68c'); }
      log($t('Julgamento.', 'Judgment.')); }},
  radiance:{name:$t('Clarão', 'Flash'), cd:5, hits:true, desc:()=>$t('Causa 1 e atordoa todos os inimigos nas suas diagonais, até 3 casas', 'Deals 1 and stuns every enemy on your diagonals, up to 3 squares'),
    run(){ const p = S.player; fx.rings.push({x:p.x, y:p.y, t:0, c:'240,214,140'});
      for (const [dx,dy] of DIAG){ let x=p.x+dx, y=p.y+dy;
        for (let i=0; i<3 && inb(x,y) && !isWall(x,y); i++, x+=dx, y+=dy){ const e = enemyAt(x,y); if (e){ skillHit(e, 1); stun(e); } } }
      log($t('Clarão.', 'Flash.')); }},
  lunge:{name:$t('Investida Real', 'Royal Charge'), cd:4, target:true, hits:true, desc:st=>$t(`Avança até 3 casas em qualquer linha e causa ${st.dmg} a todos ao redor de onde pousar`, `Charges up to 3 squares in any line and deals ${st.dmg} to everything around where you land`),
    targets(){ const p = S.player, out = [];
      for (const [dx,dy] of ALL) for (let i=1;i<=3;i++){ const x=p.x+dx*i, y=p.y+dy*i; if (!inb(x,y) || isWall(x,y) || isPit(x,y) || occupied(x,y)) break; out.push([x,y]); }
      return out; },
    run(x,y){ const st = stats(); moveTo(x,y); fx.rings.push({x:S.player.x, y:S.player.y, t:0}); fx.shake = Math.max(fx.shake, 7);
      hitAround(S.player.x, S.player.y, st.dmg); log($t('Investida Real.', 'Royal Charge.')); }},
  finisher:{name:$t('Golpe Final', 'Final Blow'), cd:3, target:true, hits:true, desc:st=>$t(`Golpeia um vizinho com o dobro do dano (${attackDmg(st)*2}). Se matar, ganha +1 ação`, `Strikes a neighbor for double damage (${attackDmg(st)*2}). If it kills, gain +1 action`),
    targets(){ return ALL.map(([dx,dy]) => [S.player.x+dx, S.player.y+dy]).filter(([x,y]) => enemyAt(x,y)); },
    run(x,y){ const e = enemyAt(x,y); if (!e) return;
      S.player.lx = Math.sign(x-S.player.x)*.35; S.player.ly = Math.sign(y-S.player.y)*.35;
      skillHit(e, attackDmg(stats(), e)*2);
      if (!S.enemies.includes(e)){ S.actions++; floatText(S.player.x, S.player.y-0.4, $t('+1 ação', '+1 action'), '#e3b456'); }
      log($t('Golpe Final.', 'Final Blow.')); }},
  rally:{name:$t('Grito de Guerra', 'War Cry'), cd:5, desc:()=>$t('Cura todos os aliados por completo e dá +1 de dano a cada um (até +3)', 'Fully heals every ally and gives each +1 damage (up to +3)'),
    can:()=>S.allies.length > 0,
    run(){ for (const a of S.allies){ a.hp = a.maxHp; if ((a.rally||0)<3){ a.rally = (a.rally||0)+1; a.dmg++; } burst(a.x, a.y, '#e3b456', 8); }
      fx.rings.push({x:S.player.x, y:S.player.y, t:0, c:'227,180,86'}); log($t('Grito de Guerra.', 'War Cry.')); }},
  promote:{name:$t('Promoção', 'Promotion'), cd:6, target:true, desc:()=>$t('Promove um peão aliado vizinho a rainha, com vida cheia', 'Promotes a neighboring allied pawn to queen, at full health'),
    targets(){ return ALL.map(([dx,dy]) => [S.player.x+dx, S.player.y+dy]).filter(([x,y]) => { const a = allyAt(x,y); return a && a.type==='P'; }); },
    run(x,y){ const a = allyAt(x,y); if (!a) return;
      a.type = 'Q'; a.maxHp = Math.max(a.maxHp+4, 9); a.hp = a.maxHp; a.dmg = Math.max(a.dmg+1, 3);
      burst(x, y, '#e3b456', 20); floatText(x, y-0.4, $t('Promoção', 'Promotion'), '#e3b456'); log($t('Um peão foi promovido a rainha.', 'A pawn was promoted to queen.')); }},
  command:{name:$t('Ordem Real', 'Royal Order'), cd:4, free:true, desc:()=>$t('Seus aliados agem agora, além do turno normal. Não gasta ação.', 'Your allies act now, on top of the normal turn. Costs no action.'),
    can:()=>S.allies.length > 0,
    async run(){ log($t('Ordem Real.', 'Royal Order.')); await allyPhase(); }}
};
function skillCd(id){
  const sk = SKILLS[id], st = stats();
  const extra = id==='gallop' && st.cavalry ? 2 : 0;
  return Math.max(sk.free ? 2 : 1, sk.cd - st.cdr - extra - (runeOf(id)==='pressa' ? 1 : 0));
}

/* ---------- Player movement ---------- */
function classMoves(px, py, ignoreUnits){
  const st = stats(), out = [], seen = new Set([key(px,py)]);
  const kindAt = (x,y) => ignoreUnits ? 'move' : enemyAt(x,y) ? 'attack' : allyAt(x,y) ? 'swap' : 'move';
  const add = (x,y,kind,stop) => {
    const k = key(x,y); if (seen.has(k)) return; seen.add(k);
    const o = {x,y,kind,stop};
    if (kind==='move' && !ignoreUnits && isIce(x,y) && !st.forgeWalk){ const e = slideEnd(x, y, x-px, y-py); if (e[0]!==x || e[1]!==y) o.slide = e; }
    out.push(o);
  };
  const landable = (x,y) => inb(x,y) && !isWall(x,y) && !isPit(x,y);
  const stopOk = (x,y,dx,dy) => {
    if (!isIce(x,y) || st.forgeWalk) return true;
    const nx=x+dx, ny=y+dy;
    return !inb(nx,ny) || isWall(nx,ny) || isPit(nx,ny) || (!ignoreUnits && (enemyAt(nx,ny) || allyAt(nx,ny)));
  };
  const jump = offs => { for (const [dx,dy] of offs){ const x=px+dx, y=py+dy; if (landable(x,y)) add(x,y,kindAt(x,y),null); } };
  const slide = dirs => {
    for (const [dx,dy] of dirs){
      let x=px+dx, y=py+dy, lx=px, ly=py;
      while (inb(x,y) && !isWall(x,y) && !isPit(x,y)){
        const k = kindAt(x,y);
        if (k!=='move'){ add(x,y,k,k==='attack'?[lx,ly]:null); break; }
        // you can step onto ice: you then slide on (the preview arrow shows where); path/reach checks still use the real stop
        if (!ignoreUnits || stopOk(x,y,dx,dy)) add(x,y,'move',null);
        if (isWater(x,y)) break;
        lx=x; ly=y; x+=dx; y+=dy;
      }
    }
  };
  switch (S.cls){
    case 'N': jump(KN); if (st.longJump) jump(KN3); break;
    case 'R': slide(ORTH); break;
    case 'B': slide(DIAG); break;
    case 'Q': slide(ALL); break;
    case 'K': jump(ALL); break;
  }
  if (st.kingStep) jump(ALL);
  if (st.pilgrim) jump([[2,0],[-2,0],[0,2],[0,-2]]);
  return out;
}
const playerTargets = () => {
  const list = classMoves(S.player.x, S.player.y, false);
  return S.moveOnly ? list.filter(t => t.kind!=='attack') : list;
};

/* ---------- Damage ---------- */
function gainXp(n){
  if (!n) return;
  HERO.xp += n; S.xpFound += n;
  while (HERO.xp >= xpNeed(HERO.level) && HERO.level<50){
    HERO.xp -= xpNeed(HERO.level); HERO.level++; S.player.hp += 1; sfx('level');
    floatText(S.player.x, S.player.y-0.4, $t(`Nível ${HERO.level}`, `Level ${HERO.level}`), '#e3b456');
    burst(S.player.x, S.player.y, '#e3b456', 20);
    log($t(`Você chegou ao nível ${HERO.level}. Um ponto de talento novo espera no acampamento.`, `You reached level ${HERO.level}. A new talent point awaits at camp.`));
  }
}
function rewardKill(e){
  const f = (1 + .1*(S.lvl-1)) * (1 + .25*(S.torment||0));
  gainXp(Math.round((e.boss ? 40 : EDEF[e.type].xp*(e.elite?3:1)) * f * (e.fodder ? .5 : 1)));
  const g = Math.round((e.boss ? 30*(1 + .2*atlasRank('aBossGold')) : e.elite ? 10 : EDEF[e.type].gold) * f * (1 + stats().gold/100 + (S.mapAff.has('rGold') ? .4 : 0)) * (e.fodder ? .5 : 1));
  HERO.gold += g; S.goldFound += g;
}
function checkPhase(e){
  if (e.bossId==='fallen'){ fallenPhase(e); return; }
  if (!e.boss || e.phase!==1 || e.bossId==='twins' || e.hp > e.maxHp*(e.uber ? .6 : .5)) return;
  e.phase = 2;
  if (e.bossId==='mirror' && !e.mods.includes('double')){ e.mods.push('double'); spawnShards(e); }
  fx.shake = Math.max(fx.shake, 14); burst(e.x, e.y, '#f08a3c', 30);
  showBanner($t('Segunda fase', 'Second phase'), BOSSES[e.bossId].p2);
  log($t(`${e.name} entra na segunda fase.`, `${e.name} enters the second phase.`));
}
const queenGuards = () => S.enemies.filter(o => !o.boss && o.type==='P').length;
const mirrorShards = () => S.enemies.filter(o => o.shard).length;
function bossObjective(e, amt, src){
  if (e.bossId==='queen' && e.origId==='queen' && queenGuards() >= (e.uber ? 2 : 3)){
    floatText(e.x, e.y-0.35, $t('guarda real', 'royal guard'), '#e3b456');
    return Math.max(1, Math.ceil(amt/2));
  }
  if (e.bossId==='knight' && e.exhausted){ floatText(e.x, e.y-0.35, $t('exausto', 'exhausted'), '#ecd36a'); return Math.ceil(amt*1.5); }
  if (e.bossId==='mirror' && src==='player' && mirrorShards()>0){
    const back = Math.floor(amt/2);
    if (back>0) hurtPlayer(back, $t(`Os estilhaços devolvem ${back} de dano.`, `The shards reflect ${back} damage.`));
  }
  return amt;
}
function spawnShards(e){
  const spots = shuffle(ALL.map(([dx,dy])=>[e.x+dx,e.y+dy]).filter(([x,y]) => inb(x,y) && !occupied(x,y) && !isLava(x,y)));
  for (const [x,y] of spots.slice(0,2)){
    const p = makeEnemy('P', x, y, {rx:e.x, ry:e.y});
    p.mods = []; p.shard = true; p.label = $t('Estilhaço', 'Shard'); p.hp = p.maxHp = Math.round(p.maxHp*1.5);
    S.enemies.push(p); burst(x, y, '#cfe0f0', 14);
  }
  log($t('O Reflexo se parte: 2 estilhaços surgem.', 'The Reflection breaks: 2 shards appear.'));
}
function knightEscape(e){
  const opts = KN.map(([dx,dy])=>[e.x+dx,e.y+dy]).filter(([x,y]) => inb(x,y) && !occupied(x,y));
  if (!opts.length) return;
  opts.sort((a,b)=>cheb(b[0],b[1],S.player.x,S.player.y)-cheb(a[0],a[1],S.player.x,S.player.y));
  S.burn.set(key(e.x,e.y), 2);
  e.x = opts[0][0]; e.y = opts[0][1]; e.jumped = true;
  // what was telegraphed still happens: only a planned move is dropped
  if (!e.intent || e.intent.kind!=='attack') e.intent = {kind:'wait'};
  burst(e.x, e.y, '#f08a3c', 14);
  log($t(`${e.name} salta para longe e deixa brasas.`, `${e.name} leaps away and leaves embers.`));
  e.escapes = (e.escapes||0) + 1;
  if (e.escapes >= (e.uber ? 4 : 3)){
    e.escapes = 0; e.exhausted = 3;
    floatText(e.x, e.y-0.3, $t('exausto', 'exhausted'), '#ecd36a'); burst(e.x, e.y, '#ecd36a', 18);
    log($t(`${e.name} está exausto: não foge e recebe +50% de dano por 2 turnos.`, `${e.name} is exhausted: it does not flee and takes +50% damage for 2 turns.`));
  }
}
function damageEnemy(e, amt, src){
  if (!S.enemies.includes(e)) return;
  if (e.mods.includes('armor')) amt = Math.max(1, amt-1);
  if (e.mods.includes('submerge') && isWater(e.x,e.y)) amt = Math.max(1, Math.ceil(amt/2));
  if (e.boss && e.intent && e.intent.recover && src!=='enemy'){ amt = Math.ceil(amt*1.5); floatText(e.x, e.y-0.35, $t('exposto', 'exposed'), '#ecd36a'); }
  if (e.boss && e.phase===2) amt = bossObjective(e, amt, src);
  if (e.bossId==='fallen' && e.fphase===3 && src!=='enemy') amt = fallenGuard(e, amt);
  if (e.judged) amt = Math.ceil(amt*1.5);
  if (e.frozenPiece && S.timeStop>0){ if (src==='enemy') return; amt = Math.ceil(amt * (atlasRank('kWinter') ? 1.25 : 1.5)); }   // only you can break the ice
  if (src==='player' && !S.blasting && e.mods.includes('thorns')){ const t = contentLvl()>=7 ? 2 : 1; hurtPlayer(t, $t(`Os espinhos de ${enemyName(e)} te ferem (${t}).`, `The thorns of ${enemyName(e)} hurt you (${t}).`)); }
  if (e.shield>0){
    const a = Math.min(e.shield, amt); e.shield -= a; amt -= a;
    floatText(e.x, e.y, $t('escudo -', 'shield -')+a, '#a9bfd6');
    if (amt<=0) return;
  }
  e.hp -= amt; e.hurtTurn = S.turn;
  if (src!=='enemy') sfx('hit');
  floatText(e.x, e.y, '-'+amt, src==='enemy' ? '#d9a066' : '#ffd9a8');
  burst(e.x, e.y, src==='enemy' ? '#d9a066' : '#e07a32', 8);
  if (src==='player' && e.hp>0 && e.hp<3 && !e.boss && stats().execute){ e.hp = 0; floatText(e.x, e.y-0.3, $t('Xeque-mate', 'Checkmate'), '#f08a3c'); }
  if (e.hp<=0 && e.frozenPiece && S.timeStop>0){ shatterPiece(e); return; }
  if (e.hp>0){
    checkPhase(e);
    if (e.bossId==='knight' && e.phase===2 && src!=='enemy' && !e.jumped && !e.exhausted) knightEscape(e);
    if (e.bossId==='fallen' && src==='player') fallenCastle(e);
    return;
  }
  S.enemies = S.enemies.filter(o => o!==e);
  sfx(e.boss ? 'boss' : 'kill');
  riftKill(e);
  hordeKill(e);
  currencyDrop(e);
  tideKill(e);
  rivalKill(e);
  burst(e.x, e.y, '#b8332b', e.boss ? 50 : 20);
  fx.shake = Math.max(fx.shake, e.boss ? 18 : e.elite ? 8 : 4);
  log($t(`${enemyName(e)} caiu${src==='enemy' ? ' por fogo amigo' : src==='ally' ? ' para seus aliados' : ''}.`, `${enemyName(e)} fell${src==='enemy' ? ' to friendly fire' : src==='ally' ? ' to your allies' : ''}.`));
  rewardKill(e);
  if (e.boss){
    if (!HERO.bossesKilled.includes(e.origId)) HERO.bossesKilled.push(e.origId);
    const others = S.enemies.filter(o => o.boss);
    if (others.length){
      for (const o of others) o.enrageAt = S.turn;
      log($t('Uma torre caiu. A outra enlouquece se sobreviver a este turno.', 'One rook fell. The other goes berserk if it survives this turn.'));
    } else {
      S.bossKilledThisFloor = true;
      if (e.uber){ HERO.ubersKilled = (HERO.ubersKilled||0)+1; HERO.gold += 200; S.goldFound += 200; dropRune(e); dropRune(e); log($t(`${e.name} caiu. +200 de ouro e duas runas.`, `${e.name} fell. +200 gold and two runes.`));
        const id = S.exp.boss || 'queen'; HERO.crownFrags = HERO.crownFrags || {}; HERO.crownFrags[id] = (HERO.crownFrags[id]||0) + 1;
        HERO.ubersBeaten = [...new Set([...(HERO.ubersBeaten||[]), id])];
        log($t(`${fragName(id)} obtido. Um de cada abre a sala do trono do Rei Caído.`, `${fragName(id)} obtained. One of each opens the Fallen King's throne room.`)); }
      if (e.bossId==='fallen'){ HERO.fallenKills = (HERO.fallenKills||0)+1; HERO.gold += 500; S.goldFound += 500; for (let i=0;i<3;i++) dropRune(e);
        showBanner($t('O Rei Caído tombou', 'The Fallen King has toppled'), $t('A coroa está vazia. Por enquanto.', 'The crown is empty. For now.'));
        log($t('O Rei Caído caiu. +500 de ouro e três runas.', 'The Fallen King fell. +500 gold and three runes.')); }
      S.items.push({x:e.x, y:e.y, relics:S.bossRelics});
      log($t('O chefe deixou duas relíquias.', 'The boss left two relics.'));
      dropMaps(e);
      dropRune(e);
      if (atlasRank('kDuel')){ dropRune(e); dropRune(e); }
    }
  } else if (e.armyPiece){
    armyLoot(e);
  } else if (e.elite){
    S.items.push({x:e.x, y:e.y, item:genItem(true)});
    if (S.mapAff.has('rRunes') || rnd()<.2) dropRune(e);
  } else {
    const mult = (S.exp.kind==='map' ? (1 + .25*S.exp.map.affixes.filter(a => !isRewardAffix(a)).length + .1*S.exp.map.tier) * (1 + .1*atlasRank('aQuant')) : 1) * (1 + .25*(S.torment||0));
    if (rnd() < EDEF[e.type].drop * mult * (1 + stats().mf/100) * (e.fodder ? .25 : 1) * (e.rift ? .3 : 1)) S.items.push({x:e.x, y:e.y, item:genItem(false)});
  }
  if (!S.mapAff.has('mNoPotions')){
    const chance = e.boss ? 1 : e.armyPiece && !e.marked ? 0 : e.elite ? .5 : e.fodder ? .03 : .1;
    if (rnd() < chance){
      const spot = [[e.x,e.y], ...ALL.map(([dx,dy])=>[e.x+dx,e.y+dy])].find(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !S.items.some(i=>i.x===x&&i.y===y&&i.potion));
      if (spot) S.items.push({x:spot[0], y:spot[1], potion:true});
    }
  }
  if (e.mods.includes('explode')) explode(e);
  if (src==='player' && stats().deathBurst && amt>0) exileBurst(e, amt);
  if (src==='player' || src==='ally') S.kills++;
  if (src==='player'){
    S.killsThisAction++;
    const st = stats();
    if (st.vamp) heal(st.vamp);
    if (st.healKill) heal(st.healKill);
    if (st.g_damiano && rnd()<.25){ for (const id in S.cds) S.cds[id] = Math.max(0, S.cds[id]-1); floatText(S.player.x, S.player.y-0.4, $t('Damiano', 'Damiano'), '#c9a0ff'); }
    if (st.killFury && S.furyTurn < 5){ const n = Math.min(st.killFury, 5 - S.furyTurn); S.furyTurn += n; S.turnBonus += n; floatText(S.player.x, S.player.y-0.6, $t(`+${n} matança`, `+${n} slaughter`), '#f08a3c'); }
    if (st.killCdr && S.harvestTurn < 2*st.killCdr){ S.harvestTurn++; for (const id in S.cds) S.cds[id] = Math.max(0, S.cds[id]-1); }
    if (st.killStep && S.stepTurn < st.killStep && S.enemies.length){ S.stepTurn++; S.moveOnly = true; S.actions++; floatText(S.player.x, S.player.y-0.45, $t('passo leve', 'light step'), '#cfe0f0'); }
    if (st.bloodRush && S.floorBonus<5){ S.floorBonus++; floatText(S.player.x, S.player.y-0.3, $t('+1 dano', '+1 damage'), '#f08a3c'); }
  }
}
function dropRune(e){
  const spot = [[e.x,e.y], ...ALL.map(([dx,dy])=>[e.x+dx,e.y+dy])].find(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !S.items.some(i=>i.x===x&&i.y===y));
  if (spot) S.items.push({x:spot[0], y:spot[1], rune:pick(Object.keys(RUNES))});
}
function dropMaps(e){
  const spots = ALL.map(([dx,dy])=>[e.x+dx,e.y+dy]).filter(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y));
  const put = m => { const s = spots.shift() || [e.x,e.y]; S.items.push({x:s[0], y:s[1], mapItem:m}); };
  if (S.exp.kind==='map'){
    put(makeMap(S.exp.map.tier + (rnd() < .5 + .1*atlasRank('aTierUp') ? 1 : 0)));
    if (rnd() < .4 + .15*atlasRank('aMapDrop')) put(makeMap(S.exp.map.tier));
  } else if (S.exp.kind==='campaign' && S.act===3){
    put(makeMap(1)); if (HERO.actDone<4) put(makeMap(1));
  } else if (S.exp.kind==='abyss' && HERO.actDone>=4){
    put(makeMap(1 + Math.floor(S.floor/6)));
  }
}
function damageAlly(a, amt){
  if (!S.allies.includes(a)) return;
  if (stats().banner && cheb(a.x,a.y,S.player.x,S.player.y)<=1) amt = Math.max(0, amt-1);
  if (amt<=0){ floatText(a.x, a.y, $t('bloqueado', 'blocked'), '#a9bfd6'); return; }
  a.hp -= amt;
  floatText(a.x, a.y, '-'+amt, '#ff6b5e'); burst(a.x, a.y, '#b8332b', 8);
  if (a.hp<=0){
    S.allies = S.allies.filter(o=>o!==a);
    log(a.type==='P' ? $t('Um peão aliado caiu.', 'An allied pawn fell.') : $t('Uma rainha aliada caiu.', 'An allied queen fell.'));
    if (stats().martyr){ heal(3); S.shield += 2; floatText(S.player.x, S.player.y, $t('+2 escudo', '+2 shield'), '#a9bfd6'); }
  }
}
function heal(n){
  const mx = stats().hp, before = S.player.hp;
  S.player.hp = Math.min(mx, S.player.hp+n);
  if (S.player.hp>before) floatText(S.player.x, S.player.y, '+'+(S.player.hp-before), '#8fd18a');
}
// raw damage to the player (shield first); returns false if the player died
function hurtPlayer(dmg, msg){
  if (S.dead) return false;
  if (dmg>0) sfx('hurt');
  if (dmg>0 && S.untouchable){ floatText(S.player.x, S.player.y, $t('intocável', 'untouchable'), '#cfe0f0'); return true; }
  if (dmg>0 && S.nullHit){ S.nullHit = false; floatText(S.player.x, S.player.y, $t('anulado', 'nullified'), '#a9bfd6'); log($t('A Barda de Obsidiana anulou o golpe.', 'The Obsidian Barding nullified the blow.')); return true; }
  let d = dmg, absorbed = 0;
  const hpBefore = S.player.hp;
  if (S.shield>0){ const a=Math.min(S.shield,d); S.shield-=a; d-=a; absorbed = a; floatText(S.player.x, S.player.y, $t('escudo -', 'shield -')+a, '#a9bfd6'); }
  if (d>0){ S.player.hp -= d; floatText(S.player.x, S.player.y, '-'+d, '#ff6b5e'); burst(S.player.x, S.player.y, '#b8332b', 14); }
  // death recap: remember every hit of this floor
  (S.hits = S.hits || []).push({turn:S.turn, msg:msg || $t('Dano', 'Damage'), raw:dmg, absorbed, taken:Math.max(0,d), hpBefore, hpAfter:S.player.hp,
    danger:S.dangerSeen && S.dangerSeen.has(key(S.player.x,S.player.y))});
  if (S.hits.length>40) S.hits.shift();
  fx.shake = Math.max(fx.shake, 7);
  if (msg) log(msg);
  if (S.player.hp<=0){
    if (stats().lastStand && !S.lastStandUsed){
      S.lastStandUsed = true; S.player.hp = 1;
      floatText(S.player.x, S.player.y-0.3, $t('Última Resistência', 'Last Stand'), '#e3b456'); log($t('Última Resistência: você sobrevive com 1 de vida.', 'Last Stand: you survive with 1 health.'));
      return true;
    }
    gameOver(); return false;
  }
  const st = stats();
  if (st.flee && !S.fleeUsed && S.player.hp < st.hp*.3) fleeLeap();
  return true;
}
// Horseshoes of Escape: leap to the free square farthest from every enemy and stay untouchable until your turn
function fleeLeap(){
  let best = null, bs = -99;
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){
    if (occupied(x,y) || isLava(x,y) || S.items.some(i => i.x===x && i.y===y) || (S.stairs && S.stairs.x===x && S.stairs.y===y)) continue;
    const s = nearestEnemyDist(x,y) - (S.danger.has(key(x,y)) ? 5 : 0);
    if (s>bs){ bs = s; best = [x,y]; }
  }
  if (!best) return;
  S.fleeUsed = true; S.untouchable = true;
  burst(S.player.x, S.player.y, '#cfe0f0', 14);
  S.player.x = best[0]; S.player.y = best[1];
  floatText(best[0], best[1]-0.4, $t('Fuga', 'Escape'), '#cfe0f0'); sfx('jump');
  log($t('Ferraduras da Fuga: você salta para longe e fica intocável até o seu turno.', 'Horseshoes of Escape: you leap away and are untouchable until your turn.'));
}
// Mantle of Exile: a kill explodes, half the blow to every neighbor (kills chain)
function exileBurst(e, amt){
  const d = Math.max(1, Math.ceil(amt/2));
  fx.rings.push({x:e.x, y:e.y, t:0, c:'180,60,200'}); burst(e.x, e.y, '#b048c8', 16);
  const was = S.blasting; S.blasting = true;
  for (const [dx,dy] of ALL){ const o = enemyAt(e.x+dx, e.y+dy); if (o) damageEnemy(o, d, 'player'); }
  S.blasting = was;
}
// half damage to a list of enemies with a beam from the player (crown, link, cleave); spikes do not answer it
function splash(list, dmg, color, word){
  const was = S.blasting; S.blasting = true;
  for (const o of list){ if (!S.enemies.includes(o)) continue;
    fx.beams.push({x1:S.player.x, y1:S.player.y, x2:o.x, y2:o.y, t:0, c:color});
    if (word) floatText(o.x, o.y-0.3, word, 'rgb('+color+')');
    damageEnemy(o, Math.max(1, Math.floor(dmg/2)), 'player'); }
  S.blasting = was;
}
/* The Fallen King: phase 2 at 60% (he takes the four uber forms in turn), phase 3 at 25% (the last king).
   Each change leaves him exposed for this turn and the next and calls two pawn guards. */
const FALLEN_PHASE_NAME = {1:$t('O Rei e a Corte', 'The King and his Court'), 2:$t('A Coroa Estilhaçada', 'The Shattered Crown'), 3:$t('O Último Rei', 'The Last King')};
const FALLEN_FORM_NAME = {R:$t('a Torre', 'the Rook'), B:$t('o Bispo', 'the Bishop'), N:$t('o Cavalo', 'the Knight'), Q:$t('a Rainha', 'the Queen'), K:$t('o Rei', 'the King')};
function fallenStage(e){
  const f = e.hp / e.maxHp;
  if (f > .6) return [1, 'K'];
  if (f <= .25) return [3, 'K'];
  const step = (.6 - .25) / 4, i = Math.min(3, Math.floor((.6 - f) / step));
  return [2, ['R','B','N','Q'][i]];
}
function fallenPhase(e){
  const [ph, type] = fallenStage(e);
  if (ph < (e.fphase||1) || (ph===e.fphase && type===e.type)) return;
  const newPhase = ph !== e.fphase;
  e.fphase = ph; e.type = type;
  e.intent = {kind:'wait', recover:true}; e.recover = 1;
  fx.shake = Math.max(fx.shake, 16); burst(e.x, e.y, '#e3b456', 40); fx.rings.push({x:e.x, y:e.y, t:0, c:'227,180,86'});
  const spots = shuffle(ALL.map(([dx,dy])=>[e.x+dx,e.y+dy]).filter(([x,y]) => inb(x,y) && !occupied(x,y) && !isLava(x,y)));
  for (const [x,y] of spots.slice(0,2)){ const p = makeEnemy('P', x, y, {rx:e.x, ry:e.y}); p.mods = []; S.enemies.push(p); }
  if (ph===2) showBanner(newPhase ? FALLEN_PHASE_NAME[2] : $t(`O Rei Caído assume ${FALLEN_FORM_NAME[type]}`, `The Fallen King takes the form of ${FALLEN_FORM_NAME[type]}`),
    $t(`Agora ele é ${FALLEN_FORM_NAME[type]}: move, ataca e decreta como essa peça. Exposto por 2 turnos.`, `He is now ${FALLEN_FORM_NAME[type]}: he moves, attacks and decrees like that piece. Exposed for 2 turns.`));
  else showBanner(FALLEN_PHASE_NAME[3], $t('A corte inteira se ergue. Limpe os guardas e encurrale o rei.', 'The whole court rises. Clear the guards and corner the king.'));
  log(ph===2 ? $t(`O Rei Caído muda de forma: agora é ${FALLEN_FORM_NAME[type]}.`, `The Fallen King changes form: he is now ${FALLEN_FORM_NAME[type]}.`)
    : $t('O Último Rei: com 3 ou mais peças da corte vivas ele recebe metade do dano; encurralado (2 fugas ou menos), recebe +50%.', 'The Last King: with 3 or more court pieces alive he takes half damage; cornered (2 escapes or fewer), he takes +50%.'));
  refreshDanger();
}
// phase 3: his court shields him, being cornered exposes him
function fallenGuard(e, amt){
  const court = S.enemies.filter(o => !o.boss).length, esc = fallenEscapes(e).length;
  if (court >= 3){ amt = Math.max(1, Math.ceil(amt/2)); floatText(e.x, e.y-0.35, $t('guarda real', 'royal guard'), '#e3b456'); }
  if (esc <= 2){ amt = Math.ceil(amt*1.5); floatText(e.x, e.y-0.6, $t('encurralado', 'cornered'), '#ecd36a'); }
  return amt;
}
// Castling: struck up close (phases 1 and 2), he swaps places with his farthest pawn, at most every 4 turns
function fallenCastle(e){
  if (e.fphase===2 || cheb(e.x,e.y,S.player.x,S.player.y)>1 || S.turn - (e.castleAt ?? -9) < 4) return;
  const rook = S.enemies.filter(o => !o.boss && cheb(o.x,o.y,S.player.x,S.player.y)>=3).sort((a,b) => cheb(b.x,b.y,S.player.x,S.player.y) - cheb(a.x,a.y,S.player.x,S.player.y))[0];
  if (!rook) return;
  const [x,y] = [e.x,e.y]; e.x = rook.x; e.y = rook.y; rook.x = x; rook.y = y;
  e.castleAt = S.turn; e.intent = {kind:'wait', recover: !!(e.intent && e.intent.recover)}; rook.intent = {kind:'wait'};
  burst(x, y, '#e3b456', 12); burst(e.x, e.y, '#e3b456', 12); floatText(e.x, e.y-0.5, $t('Roque', 'Castling'), '#e3b456');
  log($t('O Rei faz Roque: troca de lugar com um peão distante.', 'The King castles: he swaps places with a distant pawn.'));
  refreshDanger();
}
// your resistance to an element cuts that damage (never below 1)
function resist(d, t){ const k = RES_KEY[t]; if (!k || d<=0) return d; const r = stats()[k]; return r ? Math.max(1, Math.round(d*(1-r/100))) : d; }
const dmgWord = t => t && t!=='phys' ? $t(` com ${DTYPES[t].n}`, ` with ${DTYPES[t].n}`) : '';
function hitPlayer(dmg, src){
  const st = stats();
  let d = resist(dmg, src.dtype);
  if (st.lineGuard && src.type!=='P' && src.type!=='K' && src.type!=='N') d = Math.ceil(d/2);
  if (st.granite && !S.movedThisTurn) d = Math.max(0, d-1);
  if (st.block && d>1 && rnd()*100 < st.block){ d = Math.ceil(d/2); sfx('block'); floatText(S.player.x, S.player.y-0.35, $t('bloqueio', 'block'), '#a9bfd6'); }
  if (!hurtPlayer(d, $t(`${enemyName(src)} te acertou${dmgWord(src.dtype)} (${d}).`, `${enemyName(src)} hit you${dmgWord(src.dtype)} (${d}).`))) return;
  if (st.reprisal) S.nextBonus = Math.max(S.nextBonus||0, 3);
  if (st.mirror && !S.mirrorUsed && d>0 && S.enemies.includes(src)){
    S.mirrorUsed = true; floatText(S.player.x, S.player.y-0.3, $t('reflexo', 'reflect'), '#cfe0f0');
    damageEnemy(src, d, 'player');
  }
  if (st.thorns && S.enemies.includes(src)) damageEnemy(src, st.thorns, 'player');
}
function explode(e){
  fx.rings.push({x:e.x, y:e.y, t:0, c:'240,138,60'}); burst(e.x, e.y, '#f08a3c', 26);
  fx.shake = Math.max(fx.shake, 10);
  log($t(`${enemyName(e)} explodiu.`, `${enemyName(e)} exploded.`));
  for (const [dx,dy] of ALL){
    const x=e.x+dx, y=e.y+dy;
    if (isPlayer(x,y)){ const v = resist(3,'fire'); hurtPlayer(v, $t(`A explosão te atingiu (${v}).`, `The explosion hit you (${v}).`)); }
    const a = allyAt(x,y); if (a) damageAlly(a, 3);
    const o = enemyAt(x,y); if (o) damageEnemy(o, 3, 'enemy');
  }
}
function healEnemy(e, n){
  const before = e.hp; e.hp = Math.min(e.maxHp, e.hp+n);
  if (e.hp>before) floatText(e.x, e.y, '+'+(e.hp-before), '#8fd18a');
}
function stun(e){
  if (!S.enemies.includes(e)) return;
  e.intent = {kind:'wait', stunned:true};
  floatText(e.x, e.y-0.3, $t('atordoado', 'stunned'), '#ecd36a');
}

/* ---------- Player actions ---------- */
function landOn(x,y){
  const st = stats(), p = S.player;
  if (p.x!==x || p.y!==y) S.movedThisTurn = true;
  p.x = x; p.y = y;
  if (st.trample) for (const [dx,dy] of ALL){ const e=enemyAt(x+dx,y+dy); if (e) damageEnemy(e, st.trample, 'player'); }
  for (let i=S.items.length-1; i>=0; i--){
    const en = S.items[i];
    if (en.x!==x || en.y!==y) continue;
    if (en.merchant){ S.pendingLoot.push(en); continue; }
    S.items.splice(i,1);
    if (en.potion){ heal(POTION_HEAL); log($t(`Frasco de vida: +${POTION_HEAL}.`, `Health flask: +${POTION_HEAL}.`)); burst(x, y, '#8fd18a', 10); }
    else if (en.shrine) applyShrine(en.shrine);
    else if (en.chest){ const g = Math.round(15*(1+.1*(S.lvl-1)) * (1 + stats().gold/100)); HERO.gold += g; S.goldFound += g; log($t(`Baú aberto: +${g} de ouro.`, `Chest opened: +${g} gold.`)); S.pendingLoot.push({item:genItem(true)});
      if (rnd()<.3){ const r = pick(Object.keys(RUNES)); HERO.runes = HERO.runes || {}; HERO.runes[r] = (HERO.runes[r]||0) + 1; log($t(`O baú tinha uma ${RUNES[r].name}.`, `The chest held a ${RUNES[r].name}.`)); } }
    else if (en.mapItem){ HERO.maps.push(en.mapItem); log($t(`Mapa obtido: ${mapName(en.mapItem)}.`, `Map found: ${mapName(en.mapItem)}.`)); }
    else if (en.rune){ HERO.runes = HERO.runes || {}; HERO.runes[en.rune] = (HERO.runes[en.rune]||0) + 1; log($t(`${RUNES[en.rune].name} obtida. Encaixe-a numa habilidade no acampamento.`, `${RUNES[en.rune].name} found. Socket it into a skill at camp.`)); floatText(x, y-0.4, RUNES[en.rune].name, '#c9a0ff'); burst(x, y, '#c9a0ff', 14); }
    else if (en.riftGate) openRift(en);
    else if (en.frozenArmy) startFrozenArmy(en);
    else if (en.currency){ HERO.currency = HERO.currency || {}; HERO.currency[en.currency] = (HERO.currency[en.currency]||0) + 1; log($t(`${CURRENCY[en.currency].name} obtido. Use no acampamento, num mapa.`, `${CURRENCY[en.currency].name} found. Use it on a map at camp.`)); floatText(x, y-0.4, CURRENCY[en.currency].short, CURRENCY[en.currency].c); }
    else if (en.tideChest){ if (!openTideChest(en)) S.items.push(en); }
    else S.pendingLoot.push(en);
  }
  if (S.color==='w' && y===0 && !S.promoted && S.enemies.length){
    S.promoted = true; S.actions++; heal(4);
    floatText(x, y-0.3, $t('Promoção', 'Promotion'), '#e3b456'); log($t('Promoção: +1 ação e +4 de vida.', 'Promotion: +1 action and +4 health.'));
  }
  if (st.supremePromo && y===0 && !S.supPromoUsed && S.enemies.length){
    S.supPromoUsed = true; S.player.hp = st.hp; S.floorBonus += 2; burst(x, y, '#e3b456', 24);
    floatText(x, y-0.3, $t('Promoção Suprema', 'Supreme Promotion'), '#e3b456'); log($t('Promoção Suprema: vida cheia e +2 de dano até o fim do andar.', 'Supreme Promotion: full health and +2 damage until the end of the floor.'));
  }
  if (S.stairs && S.stairs.x===x && S.stairs.y===y) S.goDown = true;
}
function applyShrine(sh){
  const st = stats();
  if (sh.id==='fury') S.floorBonus += 2;
  else if (sh.id==='life') S.player.hp = st.hp;
  else if (sh.id==='ward') S.shield += 8;
  else if (sh.id==='haste') for (const id in S.cds) S.cds[id] = 0;
  fx.rings.push({x:S.player.x, y:S.player.y, t:0, c:'227,180,86'});
  log(`${sh.name}: ${sh.desc.toLowerCase()}.`);
}
function forkHit(main, dmg){
  const p = S.player;
  const cands = KN.map(([dx,dy])=>enemyAt(p.x+dx,p.y+dy)).filter(o => o && o!==main);
  if (!cands.length) return;
  const o = cands.sort((a,b)=>a.hp-b.hp)[0];
  fx.beams.push({x1:p.x, y1:p.y, x2:o.x, y2:o.y, t:0, c:'227,180,86'});
  floatText(o.x, o.y-0.3, $t('garfo', 'fork'), '#e3b456');
  damageEnemy(o, Math.max(1, Math.floor(dmg/2)), 'player');
}
function doAttack(t){
  const e = enemyAt(t.x,t.y), st = stats(), p = S.player;
  let dmg = attackDmg(st, e); S.nextBonus = 0; S.firstHitDone = true;
  if (e) elemFx(e, st);
  if (st.crit && rnd()*100 < st.crit){ sfx('crit'); dmg = Math.ceil(dmg*1.5); floatText(e.x, e.y-0.45, $t('crítico', 'critical'), '#ffcf6a'); fx.shake = Math.max(fx.shake, 5); }
  const dx = Math.sign(t.x-p.x), dy = Math.sign(t.y-p.y);
  const straight = t.x===p.x || t.y===p.y || Math.abs(t.x-p.x)===Math.abs(t.y-p.y);
  if (S.cls==='B'){
    fx.beams.push({x1:p.x, y1:p.y, x2:t.x, y2:t.y, t:0, c:'224,122,50'});
    damageEnemy(e, dmg, 'player');
    if (st.pierceShot && straight){
      let x=t.x+dx, y=t.y+dy;
      while (inb(x,y) && !isWall(x,y)){
        const o = enemyAt(x,y);
        if (o){ fx.beams.push({x1:t.x, y1:t.y, x2:x, y2:y, t:0, c:'224,122,50'}); damageEnemy(o, dmg, 'player'); break; }
        x+=dx; y+=dy;
      }
    }
  } else {
    p.lx = dx*0.3; p.ly = dy*0.3;
    damageEnemy(e, dmg, 'player');
    if (st.pierce && straight){
      let x=t.x+dx, y=t.y+dy;
      while (inb(x,y) && !isWall(x,y)){ const o = enemyAt(x,y); if (o) damageEnemy(o, dmg, 'player'); x+=dx; y+=dy; }
    }
  }
  const alive = S.enemies.includes(e);
  if (!alive){ if (!occupied(t.x,t.y)) moveTo(t.x, t.y); }
  else if (st.castle && !e.boss){ const ox=p.x, oy=p.y; e.x = ox; e.y = oy; landOn(t.x, t.y); stun(e); }
  else {
    if (S.cls!=='B' && t.stop && (t.stop[0]!==p.x || t.stop[1]!==p.y)) landOn(t.stop[0], t.stop[1]);
    if (st.ram && !e.boss){ pushEnemy(e, dx, dy); stun(e); }
    if (st.check) stun(e);
  }
  if (st.fork) forkHit(e, dmg);
  if (st.cleave) splash(ALL.map(([dx,dy]) => enemyAt(t.x+dx, t.y+dy)).filter(o => o && o!==e), dmg, '200,120,230');
  if (st.shatterCrown && S.crownReady){
    S.crownReady = false; S.crownAt = S.turn;
    const hits = [];
    for (const [dx,dy] of ALL){ let x=p.x+dx, y=p.y+dy; while (inb(x,y) && !isWall(x,y)){ const o = enemyAt(x,y); if (o){ if (o!==e) hits.push(o); break; } x+=dx; y+=dy; } }
    fx.rings.push({x:p.x, y:p.y, t:0, c:'227,180,86'}); splash(hits, dmg, '227,180,86');
  }
  if (st.link){
    if (S.linked && S.linked!==e && S.enemies.includes(S.linked)) splash([S.linked], dmg, '240,160,80', $t('elo', 'link'));
    S.linked = S.enemies.includes(e) ? e : null;
  }
  if (!alive && st.escape && !S.escapeUsed && S.enemies.length){
    S.escapeUsed = true; S.moveOnly = true; S.actions++;
    floatText(p.x, p.y-0.3, $t('Fuga Real', 'Royal Escape'), '#e3b456');
  }
}
function doSwap(t){
  const a = allyAt(t.x,t.y), p = S.player;
  a.x = p.x; a.y = p.y;
  landOn(t.x, t.y);
}
function burnTrail(x0, y0, tx, ty){
  const dx = Math.sign(tx-x0), dy = Math.sign(ty-y0);
  const straight = tx===x0 || ty===y0 || Math.abs(tx-x0)===Math.abs(ty-y0);
  if (!straight || cheb(x0,y0,tx,ty)<2) return;
  let x = x0, y = y0;
  while (x!==tx || y!==ty){ S.fire.set(key(x,y), 2); x+=dx; y+=dy; }
}

/* ---------- Allies ---------- */
function allyDmg(a){ const st = stats(); return a.dmg + (st.veterans ? 2 : 0) + (st.banner && cheb(a.x,a.y,S.player.x,S.player.y)<=1 ? 1 : 0); }
function allyLineTarget(a){
  let best = null;
  for (const [dx,dy] of ALL){
    let x=a.x+dx, y=a.y+dy;
    while (inb(x,y) && !isWall(x,y)){
      const e = enemyAt(x,y);
      if (e){ if (!best || e.hp<best.hp) best = e; break; }
      if (allyAt(x,y) || isPlayer(x,y)) break;
      x+=dx; y+=dy;
    }
  }
  return best;
}
function allyStepScore(x,y,type){
  let s = nearestEnemyDist(x,y);
  if (type==='P' && S.enemies.some(e=>Math.abs(e.x-x)===1&&Math.abs(e.y-y)===1)) s -= 2;
  if (S.danger.has(key(x,y))) s += 1.5;
  if (isLava(x,y)) s += 3;
  if (type==='P') s += y*0.05;
  return s + rnd()*0.2;
}
async function allyPhase(){
  const run = S;
  for (const a of [...S.allies]){
    if (S!==run || S.dead) return;
    if (!S.allies.includes(a) || !S.enemies.length) continue;
    if (a.type==='P'){
      const near = DIAG.map(([dx,dy])=>enemyAt(a.x+dx,a.y+dy)).filter(Boolean);
      if (near.length){
        const e = near.sort((p,q)=>p.hp-q.hp)[0];
        a.lx = Math.sign(e.x-a.x)*.3; a.ly = Math.sign(e.y-a.y)*.3;
        damageEnemy(e, allyDmg(a), 'ally');
        if (!S.enemies.includes(e) && !occupied(e.x,e.y)){ a.x = e.x; a.y = e.y; }
      } else {
        // nothing to strike: march to the top rank to promote; sidestep only when blocked or the square is dangerous
        const up = [a.x, a.y-1];
        if (inb(up[0],up[1]) && !occupied(up[0],up[1]) && !S.danger.has(key(up[0],up[1])) && !isLava(up[0],up[1])){ a.x = up[0]; a.y = up[1]; }
        else {
          const opts = [[a.x,a.y], ...ORTH.map(([dx,dy])=>[a.x+dx,a.y+dy]).filter(([x,y])=>inb(x,y)&&!occupied(x,y))];
          let best = opts[0], bs = Infinity;
          for (const o of opts){ const s = allyStepScore(o[0],o[1],'P') + o[1]*.6; if (s<bs){ bs=s; best=o; } }
          a.x = best[0]; a.y = best[1];
        }
      }
      if (a.type==='P' && a.y <= (stats().earlyPromo ? Math.floor(H/2)-1 : 0)){
        a.type = 'Q'; a.maxHp = Math.max(a.maxHp+4, 9); a.hp = a.maxHp; a.dmg = Math.max(a.dmg+1, 3 + (stats().sturdyPawns?1:0));
        floatText(a.x, a.y, $t('Promoção', 'Promotion'), '#e3b456'); burst(a.x, a.y, '#e3b456', 18);
        log($t('Um peão aliado foi promovido a rainha.', 'An allied pawn was promoted to queen.'));
      }
    } else {
      const e = allyLineTarget(a);
      if (e){ fx.beams.push({x1:a.x, y1:a.y, x2:e.x, y2:e.y, t:0, c:'227,180,86'}); damageEnemy(e, allyDmg(a), 'ally'); }
      else {
        const opts = [[a.x,a.y]];
        for (const [dx,dy] of ALL) for (let i=1;i<=2;i++){ const x=a.x+dx*i, y=a.y+dy*i; if (!inb(x,y)||occupied(x,y)) break; opts.push([x,y]); }
        let best = opts[0], bs = Infinity;
        for (const o of opts){ const s = allyStepScore(o[0],o[1],'Q'); if (s<bs){ bs=s; best=o; } }
        a.x = best[0]; a.y = best[1];
      }
    }
    updateUI();
    await sleep(190);
  }
  if (S===run) refreshDanger();
}

/* ---------- Turn flow ---------- */
async function playerAct(fn){
  const run = S;
  S.phase = 'busy'; S.killsThisAction = 0; S.actions--; S.moveOnly = false;
  fn();
  if (S.tut) tutCheck('action');
  if (S!==run || S.dead) return;
  refreshDanger();
  const cst = stats();
  if ((cst.chain || cst.regicide) && S.killsThisAction>0 && S.enemies.length && S.chainUsed < chainCap(cst)){
    S.chainUsed++; S.actions++; floatText(S.player.x, S.player.y, $t('Ceifa: +1 ação', 'Reaping: +1 action'), '#e3b456');
  }
  updateUI();
  await sleep(140);
  await afterAction();
}
async function afterAction(){
  const run = S;
  while (S.pendingLoot.length){
    S.phase = 'modal';
    await openEntry(S.pendingLoot.shift());
    if (S!==run) return;
  }
  if (S.dead) return;
  if (S.rift && !S.enemies.length) riftSpawn(Math.min(3, riftMaxAlive()));
  // everything left was shattered: the ice melts right away so the army comes back
  if (!S.enemies.length && S.timeStop>0 && (S.shattered||[]).length){ S.timeStop = 1; frozenTick(); planIntents(false); }
  if (!S.enemies.length && !S.floorCleared && !S.tut){
    S.floorCleared = true;
    if (S.exp.kind==='campaign' && S.bossKilledThisFloor){
      // each world difficulty keeps its own campaign progress; finishing Act 4 at the highest one opens the next
      const t = S.torment||0;
      if (t===0) HERO.actDone = Math.max(HERO.actDone, S.act+1);
      else { HERO.actsByT = HERO.actsByT || {}; HERO.actsByT[t] = Math.max(HERO.actsByT[t]||0, S.act+1); }
      log(S.act===3 ? (t ? $t(`Campanha concluída no Tormento ${t}.`, `Campaign completed on Torment ${t}.`) : $t('A campanha terminou. O fim de jogo foi desbloqueado no acampamento.', 'The campaign is over. The endgame is now unlocked at camp.')) : $t(`Ato ${S.act+1} concluído.`, `Act ${S.act+1} completed.`));
      if (S.act===3 && t >= (HERO.tormentMax||0) && (HERO.tormentMax||0) < 10){ HERO.tormentMax = t+1; log($t(`Tormento ${HERO.tormentMax} liberado no acampamento.`, `Torment ${HERO.tormentMax} unlocked at camp.`)); }
    }
    if (S.exp.kind==='map' && S.bossKilledThisFloor) atlasComplete(S.exp.map);
    if (S.exp.kind==='daily'){ await dailyWin(); return; }
    if (S.stairs) log($t('O andar está limpo.', 'The floor is clear.')); else spawnStairs();
  }
  // a single straggler can't stall the floor: the stairs open early
  // a single straggler that can't be reached (say, on the other colour) can't stall the floor: after 4 turns alone the stairs open
  if (S.enemies.length===1){ if (S.loneSince==null) S.loneSince = S.turn; } else S.loneSince = null;
  if (S.enemies.length===1 && S.turn - S.loneSince >= 4 && !S.bossId && !S.stairs && S.exp.kind!=='daily' && !S.tut) spawnStairs(true);
  // training: a skill that moves you can land right on the stairs
  if (S.tut && S.stairs && S.player.x===S.stairs.x && S.player.y===S.stairs.y) S.goDown = true;
  if (S.goDown){ S.goDown = false; await stairsChoice(); return; }
  if (!S.enemies.length){ for (const id in S.cds) S.cds[id] = 0; S.actions = Math.max(1,S.actions); S.phase = 'player'; updateUI(); return; }
  if (S.actions>0){ S.phase = 'player'; updateUI(); return; }
  if (S.allies.length){
    S.phase = 'allies'; updateUI();
    await allyPhase();
    if (S!==run || S.dead) return;
    if (!S.enemies.length){ S.actions = 1; S.phase = 'player'; await afterAction(); return; }
  }
  await enemyPhase();
}
async function enemyPhase(){
  const run = S;
  const alive = () => S===run && !S.dead;
  S.phase = 'enemy'; S.mode = 'move'; updateUI();
  await sleep(160);
  if (!alive()) return;
  for (const e of S.enemies){
    e.moved = false;
    if (e.boss && e.enrageAt===S.turn && !e.mods.includes('enraged')){
      e.mods.push('enraged'); e.dmg *= 2;
      showBanner($t(`${e.name.split(' ')[0]} enlouquecida`, `${e.name} goes berserk`), $t('Dano dobrado e mais movimento.', 'Double damage and more movement.'));
      fx.shake = Math.max(fx.shake, 14); log($t('A torre restante enlouqueceu.', 'The remaining rook went berserk.'));
    }
  }
  // environment first (forge pillar)
  if (S.env){
    const {wall, sq} = S.env;
    fx.flashes.push({sq, t:1}); fx.rings.push({x:wall[0], y:wall[1], t:0, c:'240,138,60'}); fx.shake = Math.max(fx.shake, 10);
    S.walls.delete(key(wall[0],wall[1])); S.terrain.set(key(wall[0],wall[1]), 'lava');
    log($t('Um pilar instável explodiu.', 'An unstable pillar exploded.'));
    for (const [x,y] of sq){
      if (isPlayer(x,y)){ const v = resist(3,'fire'); hurtPlayer(v, $t(`A explosão do pilar te atingiu (${v}).`, `The pillar's explosion hit you (${v}).`)); }
      const a = allyAt(x,y); if (a) damageAlly(a, 3);
      const o = enemyAt(x,y); if (o) damageEnemy(o, 3, 'enemy');
    }
    S.env = null;
    if (!alive()) return;
    await sleep(300);
  }
  resolveTide();
  if (!alive()) return;
  // boss arena clock
  if (S.clock){
    const {kind, sq} = S.clock; S.clock = null; S.clocks = (S.clocks||0) + 1;
    const ringC = {collapse:'170,150,120', flood:'120,190,180', lava:'255,130,50', frost:'215,240,255'}[kind];
    for (const [x,y] of sq) fx.rings.push({x, y, t:0, c:ringC});
    showBanner({collapse:$t('O teto desaba', 'The ceiling collapses'), flood:$t('A água sobe', 'The water rises'), lava:$t('A lava transborda', 'The lava overflows'), frost:$t('O gelo avança', 'The ice advances')}[kind], $t('A arena mudou.', 'The arena changed.'));
    // only the farthest collapsed square becomes a pit, never next to you, so the arena can't wall you in
    const far = kind==='collapse' ? sq.slice().sort((a,b) => cheb(b[0],b[1],S.player.x,S.player.y) - cheb(a[0],a[1],S.player.x,S.player.y))[0] : null;
    fx.shake = Math.max(fx.shake, 12);
    for (const [x,y] of sq){
      if (kind==='collapse'){
        burst(x, y, '#8a7a68', 30); fx.flashes.push({sq:[[x,y]], t:1});
        if (isPlayer(x,y)) hurtPlayer(4, $t('O teto desabou em você (4).', 'The ceiling collapsed on you (4).'));
        const a = allyAt(x,y); if (a) damageAlly(a, 4);
        const o = enemyAt(x,y); if (o && !o.boss) damageEnemy(o, 4, 'enemy');
        if (far && far[0]===x && far[1]===y && cheb(x,y,S.player.x,S.player.y)>1 && !occupied(x,y) && !S.items.some(i=>i.x===x&&i.y===y)) S.terrain.set(key(x,y), 'pit');
      } else if (kind==='flood'){ if (!isLava(x,y)) S.terrain.set(key(x,y), 'water'); burst(x, y, '#7fb0a8', 22); }
      else if (kind==='lava'){ S.terrain.set(key(x,y), 'lava'); burst(x, y, '#f08a3c', 26); }
      else if (kind==='frost'){ if (!isLava(x,y) && !isWater(x,y)) S.terrain.set(key(x,y), 'ice'); burst(x, y, '#dff0fa', 22); }
    }
    if (kind==='flood') S.sight = Math.max(2.4, sight() - .4);
    log({collapse:$t('O teto desabou.', 'The ceiling collapsed.'), flood:$t('A água subiu e a névoa fechou.', 'The water rose and the fog closed in.'), lava:$t('A lava se espalhou.', 'The lava spread.'), frost:$t('O gelo avançou.', 'The ice advanced.')}[kind]);
    if (!alive()) return;
    await sleep(300);
  }
  // crypt: a skeleton rises from a grave
  if (S.rise){
    const [x,y] = S.rise; S.rise = null;
    if (!occupied(x,y)){
      const p = makeEnemy('P', x, y); p.mods = p.mods.filter(m => m!=='submerge'); p.risen = true;
      S.enemies.push(p); S.risen = (S.risen||0)+1;
      burst(x, y, '#b9c9a6', 22); fx.rings.push({x, y, t:0, c:'170,200,150'}); fx.shake = Math.max(fx.shake, 5);
      log($t('Um esqueleto se ergue do túmulo.', 'A skeleton rises from the grave.'));
      await sleep(260);
      if (!alive()) return;
    }
  }
  const order = [...S.enemies];
  // attacks resolve first, then movement: what is telegraphed is exactly what gets hit
  for (const e of order){
    if (!alive()) return;
    if (!S.enemies.includes(e) || !e.intent || e.intent.kind!=='attack') continue;
    const sq = e.intent.sq, [tx,ty] = sq[0];
    e.lx = Math.sign(tx-e.x)*0.35; e.ly = Math.sign(ty-e.y)*0.35;
    fx.flashes.push({sq, t:1});
    const on = o => sq.some(([x,y]) => x===o.x && y===o.y);
    const strikes = e.mods.includes('double') ? 2 : 1;
    let landed = false;
    for (let s=0; s<strikes; s++){
      if (S.dead || !S.enemies.includes(e)) break;
      if (s>0){ fx.flashes.push({sq, t:1}); await sleep(200); if (!alive()) return; }
      const hit = enemyHit(e);
      // friendly fire from common line pieces; a boss never hits its own minions (its guards spawn right next to it)
      if (!e.boss && e.type!=='P' && e.type!=='K') for (const o of [...S.enemies]) if (o!==e && on(o)) damageEnemy(o, hit, 'enemy');
      for (const a of [...S.allies]) if (on(a)){ damageAlly(a, hit); landed = true; }
      if (on(S.player)){ hitPlayer(hit, e); landed = true; }
    }
    if (!alive()) return;
    if (e.intent.star){
      for (const [dx,dy] of ALL){
        let x=e.x+dx, y=e.y+dy;
        while (inb(x,y) && !isWall(x,y)){ x+=dx; y+=dy; }
        if (inb(x,y) && isWall(x,y)){ S.walls.delete(key(x,y)); burst(x, y, '#a89b87', 14); }
      }
    }
    if (e.mods.includes('frost')) for (const [x,y] of sq) if (!isPit(x,y) && !isLava(x,y)) S.terrain.set(key(x,y), 'ice');
    if (!landed) floatText(e.x, e.y, $t('errou', 'missed'), '#a89b87');
    else if (e.mods.includes('vamp') && S.enemies.includes(e)) healEnemy(e, e.boss ? 4 : 3);
    updateUI();
    await sleep(330);
  }
  let moves = 0;
  for (const e of order){
    if (!alive()) return;
    if (!S.enemies.includes(e) || !e.intent) continue;
    const it = e.intent;
    if (it.kind==='move'){
      if (moves<5) sfx('emove', {delay: .06*moves++});
      let [x,y] = it.to;
      if (!occupied(x,y)){
        const ox = e.x, oy = e.y;
        e.x = x; e.y = y; e.moved = true;
        if (isIce(x,y)){ [x,y] = slideEnd(x, y, x-ox, y-oy); e.x = x; e.y = y; }
        if (e.mods.includes('lavaTrail') && !isPit(ox,oy)) S.terrain.set(key(ox,oy), 'lava');
        if (e.mods.includes('trample')){
          await sleep(120);
          for (const [dx,dy] of ALL){
            if (isPlayer(x+dx,y+dy)) hurtPlayer(1, $t(`${enemyName(e)} pisoteou você (1).`, `${enemyName(e)} trampled you (1).`));
            const a = allyAt(x+dx,y+dy); if (a) damageAlly(a, 1);
          }
          if (!alive()) return;
        }
        if (stats().enPassant && cheb(x,y,S.player.x,S.player.y)===1){
          floatText(x, y-0.4, $t('en passant', 'en passant'), '#e3b456');
          const was = S.blasting; S.blasting = true; damageEnemy(e, Math.max(1, Math.ceil(attackDmg(stats(), e)/2)), 'player'); S.blasting = was;
          if (!alive()) return;
          if (!S.enemies.includes(e)){ await sleep(120); continue; }
        }
        if (e.bossId==='pawn' && e.y===H-1) promotePawnBoss(e);
        else if (e.type==='P' && !e.boss && !e.horde && e.y===H-1) promoteEnemyPawn(e);
      }
      await sleep(120);
    } else if (it.kind==='royal'){
      if (it.order==='promote'){
        const p = S.enemies.find(o => o.id===it.id);
        if (p){ const d = EDEF.Q; p.type = 'Q'; p.hp = p.maxHp = Math.round(d.hp*enemyScale()); p.dmg = d.dmg + Math.floor((S.lvl-1)/3) + (S.torment||0);
          floatText(p.x, p.y-0.4, $t('Promoção', 'Promotion'), '#e3b456'); burst(p.x, p.y, '#e3b456', 20);
          log($t('Ordem Real: um peão da corte foi promovido a rainha.', 'Royal Order: a pawn of the court was promoted to queen.')); }
      } else {
        for (const o of S.enemies) if (!o.boss){ o.hp = o.maxHp; if ((o.rally||0) < 3){ o.rally = (o.rally||0)+1; o.dmg++; } burst(o.x, o.y, '#e3b456', 8); }
        const sh = Math.round(e.maxHp*.06); e.shield += sh; fx.rings.push({x:e.x, y:e.y, t:0, c:'227,180,86'});
        floatText(e.x, e.y-0.5, $t('Grito de Guerra', 'War Cry'), '#e3b456');
        log($t(`Ordem Real: Grito de Guerra. A corte se cura e o Rei ganha ${sh} de escudo.`, `Royal Order: War Cry. The court heals and the King gains ${sh} shield.`));
      }
      updateUI(); await sleep(260);
    } else if (it.kind==='summon'){
      for (const [x,y] of it.to){
        if (occupied(x,y)) continue;
        const p = makeEnemy('P', x, y, {rx:e.x, ry:e.y});
        p.mods = p.mods.filter(m => m!=='submerge');
        S.enemies.push(p); burst(x, y, '#b8332b', 12);
      }
      log($t(`${e.name} invoca reforços.`, `${e.name} summons reinforcements.`));
      await sleep(240);
    }
  }
  if (!alive()) return;
  // end of round hazards
  for (const [k,t] of [...S.terrain]) if (t==='lava'){
    const [x,y] = unkey(k);
    if (isPlayer(x,y)){ if (stats().forgeWalk){ S.nextBonus = Math.max(S.nextBonus||0, 2); floatText(x, y-0.4, $t('forja +2', 'forge +2'), '#f08a3c'); }
      else { const v = resist(2,'fire'); hurtPlayer(v, $t(`A lava te queima (${v}).`, `The lava burns you (${v}).`)); } }
    const a = allyAt(x,y); if (a) damageAlly(a, 2);
    const o = enemyAt(x,y); if (o && !o.mods.includes('lavaTrail')) damageEnemy(o, 2, 'enemy');
  }
  if (!alive()) return;
  for (const [k,t] of [...S.burn]){
    const [x,y] = unkey(k);
    if (isPlayer(x,y) && !stats().forgeWalk){ const v = resist(2,'fire'); hurtPlayer(v, $t(`As brasas te queimam (${v}).`, `The embers burn you (${v}).`)); }
    const a = allyAt(x,y); if (a) damageAlly(a, 2);
    if (t<=1) S.burn.delete(k); else S.burn.set(k, t-1);
  }
  if (!alive()) return;
  for (const [k,t] of [...S.fire]){
    const [x,y] = unkey(k), o = enemyAt(x,y);
    if (o) damageEnemy(o, 1, 'player');
    if (t<=1) S.fire.delete(k); else S.fire.set(k, t-1);
  }
  if (!alive()) return;
  // regeneration only works on a turn the unit was not hit
  for (const e of S.enemies) if (e.mods.includes('regen') && e.hurtTurn!==S.turn) healEnemy(e, 2);
  riftTick();
  frozenTick();
  protectorTick();
  if (S.tide) bloodRegen();
  for (const id in S.cds) S.cds[id] = Math.max(0, S.cds[id]-1);
  S.turn++; S.actions = 1;
  newRound();
  if (S.exp.kind==='daily' && S.enemies.length && S.turn > S.turnLimit){ dailyFail(); return; }
  planIntents(false);
  if (S.tut) tutCheck('enemy');
  if (!S.enemies.length){ await afterAction(); return; }
  S.phase = 'player';
  updateUI();
}
// a common enemy pawn reaching the last rank becomes a random piece (never a pawn)
function promoteEnemyPawn(e){
  const t = pick(['N','B','R','Q']), d = EDEF[t];
  e.type = t;
  e.hp = e.maxHp = Math.max(1, Math.round(d.hp*enemyScale() * (e.elite ? 2 : 1) * (e.fodder ? .4 : 1)));
  e.dmg = Math.max(1, d.dmg + Math.floor((S.lvl-1)/3) + (S.torment||0) + (e.elite ? 1 : 0) - (e.fodder ? 1 : 0));
  floatText(e.x, e.y-0.4, $t('Promoção', 'Promotion'), '#e3b456'); burst(e.x, e.y, '#e3b456', 18);
  log($t(`Um peão inimigo chegou ao fim do tabuleiro e virou ${EDEF[t].name}.`, `An enemy pawn reached the end of the board and became a ${EDEF[t].name}.`));
}
function promotePawnBoss(e){
  e.bossId = 'queen'; e.type = 'Q'; e.phase = 2;
  e.name = e.side==='dark' ? $t('Rainha Promovida', 'Promoted Queen') : $t('Rainha Ascendida', 'Ascended Queen');
  e.hp = e.maxHp = Math.round(BOSSES.queen.hp*enemyScale());
  fx.shake = Math.max(fx.shake, 18); burst(e.x, e.y, '#e3b456', 40);
  showBanner($t('Promoção', 'Promotion'), $t(`${e.name} renasce com vida cheia.`, `${e.name} is reborn at full health.`));
  log($t('O peão chegou ao fim do tabuleiro e virou rainha.', 'The pawn reached the end of the board and became a queen.'));
}

/* ---------- Input actions ---------- */
function onClick(tx,ty){
  if (!S || S.phase!=='player') return;
  if (S.mode!=='move'){
    const id = S.mode, sk = SKILLS[id];
    const ok = sk.targets().some(([x,y]) => x===tx && y===ty);
    if (!ok){ S.mode = 'move'; updateUI(); return; }
    playerAct(() => { startCd(id); S.mode = 'move'; runSkill(id, tx, ty); });
    return;
  }
  const t = playerTargets().find(o => o.x===tx && o.y===ty);
  if (!t) return;
  const st = stats();
  if (t.kind==='attack') playerAct(() => doAttack(t));
  else if (t.kind==='swap'){
    if (st.freeSwap && !S.freeSwapUsed){ S.freeSwapUsed = true; S.actions++; floatText(S.player.x, S.player.y-0.3, $t('roque', 'castling'), '#e3b456'); }
    playerAct(() => doSwap(t));
  } else playerAct(() => { if (st.censer) burnTrail(S.player.x, S.player.y, t.x, t.y); moveTo(t.x, t.y); });
}
async function useSkill(i){
  if (!S || S.phase!=='player' || S.moveOnly) return;
  const id = barSkills()[i], sk = SKILLS[id];
  if (!id || (!S.enemies.length && id!=='shift')) return;
  if (S.cds[id]>0 || (sk.can && !sk.can())) return;
  if (sk.target){ S.mode = S.mode===id ? 'move' : id; updateUI(); return; }
  if (sk.free){
    const run = S;
    startCd(id); S.phase = 'busy'; S.killsThisAction = 0;
    S.curSkill = id; await sk.run(); S.curSkill = null;
    if (S.tut) tutCheck('action');
    if (S!==run || S.dead) return;
    refreshDanger();
    if (!S.enemies.length || S.pendingLoot.length) await afterAction();
    else { S.phase = 'player'; updateUI(); }
    return;
  }
  playerAct(() => { startCd(id); runSkill(id); });
}
function usePact(){
  if (!S || S.phase!=='player' || S.color!=='b' || S.pactUsed || S.player.hp<=4 || !S.enemies.length) return;
  S.pactUsed = true; S.player.hp -= 4;
  for (const id in S.cds) S.cds[id] = 0;
  floatText(S.player.x, S.player.y, $t('-4 / recargas zeradas', '-4 / cooldowns reset'), '#ff6b5e'); burst(S.player.x, S.player.y, '#b8332b', 14);
  log($t('Pacto de Sangue.', 'Blood Pact.'));
  updateUI();
}
function waitTurn(){
  if (!S || S.phase!=='player' || !S.enemies.length) return;
  S.actions = 0; S.mode = 'move'; S.phase = 'busy';
  afterAction();
}
