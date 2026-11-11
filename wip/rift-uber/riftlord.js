/* Rei Caído — the Rift uber boss: the Rift Lord.
   Part 1, the Conveyor: a treadmill floor that carries everything toward you, hordes of weak minions riding it, and you climb against it.
   Part 2, the Arena: the normal board, a network of Rifts (portals that spawn spawn), the Lord (a Bishop) and his three phases. */

BOSSES.rift = {type:'B', hp:32, dmg:3, names:{dark:$t('Senhor da Fenda', 'Lord of the Rift'), holy:$t('Senhor da Fenda', 'Lord of the Rift')},
  p1:$t('Fase 1, Fendas Ancoradas: anda e ataca como Bispo, em diagonais. Cada Fenda aberta tira 15% do dano que você causa a ele (até 45%). Ao ser atingido ele salta para outra Fenda (no máximo a cada 3 turnos) e deixa uma fissura no caminho.', 'Phase 1, Anchored Rifts: moves and attacks like a Bishop, on the diagonals. Each open Rift cuts 15% of the damage you deal him (up to 45%). When hit he leaps to another Rift (at most every 3 turns) and leaves a fissure along the way.'),
  p2:$t('Fase 2, Fendas Convergentes: de 2 em 2 turnos uma linha de dano liga duas Fendas (avisada antes). Atraia o boss para as linhas. As crias passam a vir mais fortes.', 'Phase 2, Converging Rifts: every other turn a line of damage links two Rifts (telegraphed). Lure the boss onto the lines. The spawn come stronger.'),
  p3:$t('Fase 3, com 30%, Colapso: as Fendas se fundem sob ele e ele fica exposto (+50% de dano), mas as ondas dobram e as bordas do tabuleiro desabam, uma fileira a cada 3 turnos.', 'Phase 3, at 30%, Collapse: the Rifts merge beneath him and he is exposed (+50% damage), but the waves double and the edges of the board crumble, one ring every 3 turns.')};
UBERS.rift = {name:$t('Senhor da Fenda', 'Lord of the Rift'), biome:'crypt', corridor:true,
  special:$t('Duas partes: a Esteira (um piso que anda e traz hordas fracas até você, enquanto você sobe contra ele) e a Arena, com uma rede de Fendas que geram crias, teleportam você e protegem o boss. Fissura Suprema: as 4 diagonais a partir dele.', 'Two parts: the Conveyor (a treadmill floor that carries weak hordes to you while you climb against it) and the Arena, with a network of Rifts that spawn minions, teleport you and shield the boss. Supreme Fissure: the 4 diagonals from him.')};
BOSS_SPECIAL.rift = $t('Fissura', 'Fissure');
ARENAS.rift = {walls:[[2,2],[5,2],[0,4],[7,4]], terrain:[], boss:[[3,0]], guards:[], player:[4,7]};
UBER_COSTS.rift = {shards:60, seals:0};
UBER_OWN.rift = [
  {slot:'arma', name:$t('Lâmina da Fissura', 'Fissure Blade'), affixes:[{k:'fissure'},{k:'dmg',v:3},{k:'crit',v:10}]},
  {slot:'anel', name:$t('Anel dos Estilhaços', 'Ring of Shards'), affixes:[{k:'shardMagnet'},{k:'hp',v:10},{k:'mf',v:20}]}
];
Object.assign(AFX, {
  fissure:{t:()=>$t('Fissura: seus golpes contra alvos a 2 ou mais casas de distância causam +3 de dano', 'Fissure: your blows against targets 2 or more squares away deal +3 damage'), rule:true},
  shardMagnet:{t:()=>$t('Ímã de Estilhaços: +1 Estilhaço da Fenda por cria abatida e +25% de Estilhaços', 'Shard Magnet: +1 Rift Shard per spawn killed and +25% Shards'), rule:true}
});
BOSS_ITEM_MAP.fissure = 'double'; BOSS_ITEM_MAP.shardMagnet = 'regen';

/* ---------- Part 1: the Conveyor ---------- */
const CORR_SIZE = 9;
const corrMinionStats = m => { const st = stats(); m.fodder = true; m.horde = true; m.corr = true; m.label = $t('Lacaio da Fenda', 'Rift Minion'); m.mods = [];
  m.hp = m.maxHp = Math.max(1, Math.floor(st.dmg*.8)); m.dmg = Math.max(1, Math.ceil(m.dmg*.5)); return m; };
// the whole floor is a belt: every 2 turns it carries every unit one square toward the bottom; the exit is at the top
function genCorridor(){
  W = H = CORR_SIZE;
  const px = W>>1, py = H-2;
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) S.terrain.set(key(x,y), 'belt');
  // a few pillars that break the flow (never on the start or the exit)
  for (let g=0, n=0; g<80 && n<7; g++){
    const x = rint(W), y = 2 + rint(H-5);
    if (isWall(x,y) || (Math.abs(x-px)<=1 && y>=py-1) || (x===px && y<=2)) continue;
    S.walls.add(key(x,y)); S.terrain.delete(key(x,y)); n++;
  }
  placePlayer(px, py);
  S.corr = {belt:true, open:false, t:0, need:34 + Math.min(16, Math.floor(S.lvl/2)), spawned:0, killed:0, end:[px,0], exit:false, warn:null};
  for (let i=0; i<2; i++) corridorWave(true, true);
  S.eventNote = [$t('A Esteira', 'The Conveyor'), $t(`O piso anda e empurra tudo para baixo a cada 2 turnos, trazendo as hordas até você. Suba contra ele: ${S.corr.need} lacaios caem e a saída, no topo, se abre.`, `The floor moves and pushes everything down every 2 turns, bringing the hordes to you. Climb against it: ${S.corr.need} minions fall and the exit, at the top, opens.`)];
  log($t('A Esteira da Fenda: o piso anda e as hordas vêm nele.', 'The Rift Conveyor: the floor moves and the hordes ride it.'));
}
// a pack of minions at the top (and a first batch spread over the upper half)
function corridorWave(force, initial){
  const c = S.corr; if (!c || c.open) return;
  const alive = S.enemies.filter(e => e.corr).length;
  if (!force && alive >= 24) return;
  if (c.spawned >= c.need + 14 && !force) return;
  const p = S.player, cand = [], top = initial ? Math.floor(H/2) : 2;
  for (let y=0; y<=top; y++) for (let x=0;x<W;x++){
    if (isWall(x,y) || occupied(x,y) || cheb(x,y,p.x,p.y)<3) continue;
    cand.push([x,y]);
  }
  if (!cand.length){ if (!S.enemies.some(e => e.corr) && c.spawned>=c.need) corridorExit(); return; }
  shuffle(cand);
  const n = initial ? 8 : 4 + rint(3);
  let made = 0;
  for (const [x,y] of cand){ if (made>=n) break; if (occupied(x,y)) continue; S.enemies.push(corrMinionStats(makeEnemy('P', x, y))); made++; c.spawned++; }
}
function corridorExit(){
  const c = S.corr; if (!c || c.exit) return;
  c.exit = true; c.open = true;
  S.stairs = {x:c.end[0], y:c.end[1]};
  showBanner($t('A saída se abriu', 'The exit opened'), $t('A arena do Senhor da Fenda espera no topo da Esteira.', 'The Lord of the Rift\'s arena waits at the top of the Conveyor.'));
  log($t('A saída da Esteira se abriu.', 'The Conveyor\'s exit opened.'));
}
function corridorKill(e){
  const c = S.corr; if (!c || !e.corr) return;
  c.killed++;
  if (!c.open && c.killed >= c.need) corridorExit();
}
// the belt moves: units are carried one square down (bottom first so chains shift); minions that reach the edge fall off
function beltShift(){
  const units = [{u:S.player, who:'p'}, ...S.allies.map(a => ({u:a, who:'a'})), ...S.enemies.map(e => ({u:e, who:'e'}))].sort((a,b) => b.u.y - a.u.y);
  let moved = 0;
  for (const {u, who} of units){
    const ny = u.y + 1;
    if (ny >= H){ if (who==='e' && !u.boss){ floatText(u.x, u.y-0.3, $t('caiu da esteira', 'fell off the belt'), '#cdbb9c'); damageEnemy(u, 9999, 'enemy'); } continue; }
    if (isWall(u.x,ny) || isPit(u.x,ny) || terrainAt(u.x,ny)!=='belt' || occupied(u.x,ny)) continue;
    u.rx = u.x; u.ry = u.y; u.y = ny; moved++;
  }
  if (moved){ fx.shake = Math.max(fx.shake, 3); sfx('slide'); floatText(S.player.x, S.player.y-0.8, $t('a esteira anda', 'the belt moves'), '#cdbb9c'); }
}
function corridorTick(){
  const c = S.corr; if (!c) return;
  c.t++;
  if (!c.open && c.t % 2===0) corridorWave(false);
  if (c.t % 2===0) beltShift();
  if (!c.open && c.spawned >= c.need && !S.enemies.some(e => e.corr)) corridorExit();
}
function planCorridor(){ if (S.corr) S.corr.warn = null; }

/* ---------- Part 2: the Arena ---------- */
function riftArenaSetup(){
  const lord = S.enemies.find(e => e.bossId==='rift'); if (lord) lord.dmg = Math.max(2, Math.round(lord.dmg*.75));   // the Lord hits softer than the other ubers
  S.rb = {rifts:[], turn:0, blinkAt:-9, phase:1, ring:0, danger:[], beam:null, edge:null, fissure:null, empty:0};
  for (const [x,y] of [[1,3],[6,3],[3,5]]) if (!occupied(x,y)) openBossRift(x,y);
  S.eventNote = [$t('A Arena da Fenda', 'The Rift Arena'), $t('Pisar numa Fenda leva você a outra. Cada Fenda aberta protege o Senhor; abata as crias ao redor dela para fechá-la.', 'Stepping on a Rift sends you to another. Each open Rift shields the Lord; kill the spawn around it to close it.')];
}
function openBossRift(x,y){
  S.terrain.set(key(x,y), 'rift'); S.rb.rifts.push({x, y, kills:0});
  burst(x, y, '#b48cff', 16); fx.rings.push({x, y, t:0, c:'180,140,255'});
}
function closeBossRift(r){
  const rb = S.rb; if (!rb) return;
  rb.rifts = rb.rifts.filter(o => o!==r); S.terrain.delete(key(r.x,r.y));
  burst(r.x, r.y, '#e6d6ff', 26); fx.shake = Math.max(fx.shake, 8); fx.rings.push({x:r.x, y:r.y, t:0, c:'230,214,255'});
  floatText(r.x, r.y-0.5, $t('Fenda selada', 'Rift sealed'), '#e6d6ff');
  for (const [dx,dy] of ALL){ const o = enemyAt(r.x+dx, r.y+dy); if (o) damageEnemy(o, o.boss ? 8 + Math.floor(S.lvl/3) : 6, 'player'); }
  log($t('Uma Fenda foi selada.', 'A Rift was sealed.'));
}
// a straight or diagonal line of squares between two rifts (Bresenham)
function riftLine(a, b){
  const out = []; let x = a.x, y = a.y; const dx = Math.abs(b.x-a.x), dy = Math.abs(b.y-a.y), sx = a.x<b.x ? 1 : -1, sy = a.y<b.y ? 1 : -1; let err = dx-dy;
  for (let g=0; g<40; g++){ out.push([x,y]); if (x===b.x && y===b.y) break; const e2 = 2*err; if (e2 > -dy){ err -= dy; x += sx; } if (e2 < dx){ err += dx; y += sy; } }
  return out;
}
function riftBossSpawn(r, n){
  const alive = S.enemies.filter(e => e.rift).length;
  const spots = shuffle(ALL.map(([dx,dy]) => [r.x+dx, r.y+dy]).filter(([x,y]) => inb(x,y) && !occupied(x,y) && !isLava(x,y)));
  n = Math.min(n, 5 - alive);
  for (const [x,y] of spots.slice(0, Math.max(0, n))){
    const strong = S.rb.phase>=2, pool = strong ? ['P','N','B','B','R'] : ['P','P','N','B'];
    const e = makeEnemy(pick(pool), x, y, {rx:r.x, ry:r.y});
    e.rift = true; e.label = $t('Cria da Fenda', 'Rift Spawn'); e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp*(strong ? .9 : .7)));
    e.mods = e.mods.filter(m => m!=='submerge'); S.enemies.push(e); burst(x, y, '#b48cff', 10);
  }
}
// called every turn end: spawn, phase 3 trigger, reopen rifts
function riftBossTick(){
  const rb = S.rb, b = S.enemies.find(e => e.bossId==='rift'); if (!rb || !b) return;
  rb.turn++;
  const every = rb.phase===1 ? 3 : 2;
  if (rb.turn % every===0) for (const r of rb.rifts) riftBossSpawn(r, rb.phase===3 ? 2 : 1);
  if (rb.phase<3 && b.hp <= b.maxHp*.3){
    rb.phase = 3;
    for (const r of [...rb.rifts]) { S.terrain.delete(key(r.x,r.y)); }
    rb.rifts = [];
    if (!occupied(b.x,b.y) || true){ S.terrain.set(key(b.x,b.y), 'rift'); rb.rifts.push({x:b.x, y:b.y, kills:0, core:true}); }
    fx.shake = Math.max(fx.shake, 16); burst(b.x, b.y, '#b48cff', 40);
    showBanner($t('Colapso', 'Collapse'), BOSSES.rift.p3);
    log($t('As Fendas se fundiram sob o Senhor. O tabuleiro começa a desabar.', 'The Rifts merged beneath the Lord. The board starts to crumble.'));
  } else if (rb.phase===1 && b.phase===2){ rb.phase = 2; }
  if (rb.phase<3){
    if (!rb.rifts.length){ rb.empty++; if (rb.empty>=3){ const free = []; for (let y=1;y<H-1;y++) for (let x=0;x<W;x++) if (!occupied(x,y) && !S.terrain.has(key(x,y)) && cheb(x,y,S.player.x,S.player.y)>1) free.push([x,y]); if (free.length){ const [x,y] = pick(free); openBossRift(x,y); log($t('O Senhor reabriu uma Fenda.', 'The Lord reopened a Rift.')); } rb.empty = 0; } }
    else rb.empty = 0;
  }
}
// telegraph for next enemy phase: the beam between two rifts, the crumbling ring, the fissure left by a leap
function planRiftBoss(){
  const rb = S.rb; if (!rb) return;
  rb.beam = null; rb.edge = null;
  if (rb.phase===2 && rb.rifts.length>=2 && rb.turn%2===1){ const [a,b] = shuffle(rb.rifts.slice()).slice(0,2); rb.beam = riftLine(a, b); }
  if (rb.phase===3 && rb.turn%3===2 && rb.ring < 3){
    const cells = []; for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (Math.min(x, y, W-1-x, H-1-y)===rb.ring && !isWall(x,y) && !isPit(x,y)) cells.push([x,y]);
    rb.edge = cells;
  }
  rb.danger = [...(rb.beam||[]), ...(rb.edge||[]), ...(rb.fissure||[])];
}
function resolveRiftBoss(){
  const rb = S.rb; if (!rb) return;
  const hit = (sq, dmg, msg) => {
    for (const [x,y] of sq){
      burst(x, y, '#b48cff', 8); fx.flashes.push({sq:[[x,y]], t:1});
      if (isPlayer(x,y)) hurtPlayer(dmg, msg);
      const a = allyAt(x,y); if (a) damageAlly(a, dmg);
      const o = enemyAt(x,y); if (o && !o.rift) damageEnemy(o, dmg + 2, 'enemy');
    }
  };
  const dmg = 2 + Math.floor(S.lvl/8) + (S.torment||0);
  if (rb.beam){ hit(rb.beam, dmg, $t(`A linha da Fenda te atingiu (${dmg}).`, `The Rift line hit you (${dmg}).`)); fx.shake = Math.max(fx.shake, 6); rb.beam = null; }
  if (rb.fissure){ hit(rb.fissure, dmg, $t(`A fissura te atingiu (${dmg}).`, `The fissure hit you (${dmg}).`)); rb.fissure = null; }
  if (rb.edge){
    for (const [x,y] of rb.edge){
      const e = enemyAt(x,y); if (e && !e.boss) damageEnemy(e, 9999, 'enemy');
      if (isPlayer(x,y)) hurtPlayer(4, $t('O chão desabou em você (4).', 'The floor collapsed on you (4).'));
      const a = allyAt(x,y); if (a) damageAlly(a, 99);
      if (!isPlayer(x,y) && !(e && e.boss) && !S.terrain.has(key(x,y))){ S.items = S.items.filter(i => !(i.x===x && i.y===y)); S.terrain.set(key(x,y), 'pit'); burst(x, y, '#4a3a2c', 10); }
    }
    fx.shake = Math.max(fx.shake, 10); rb.ring++; rb.edge = null;
    showBanner($t('O tabuleiro desaba', 'The board collapses'), $t('A borda de fora virou abismo.', 'The outer ring became an abyss.'));
  }
  rb.danger = [];
}
// player stepped on a rift: sent to another one
function riftPortal(x, y){
  const rb = S.rb; if (!rb || rb.rifts.length<2) return;
  const dests = rb.rifts.filter(r => !(r.x===x && r.y===y) && !occupied(r.x, r.y));
  if (!dests.length) return;
  const to = pick(dests), p = S.player;
  burst(x, y, '#b48cff', 14); p.x = to.x; p.y = to.y;
  burst(to.x, to.y, '#e6d6ff', 18); fx.rings.push({x:to.x, y:to.y, t:0, c:'180,140,255'});
  floatText(to.x, to.y-0.5, $t('Fenda', 'Rift'), '#e6d6ff'); sfx('jump');
  log($t('A Fenda te levou para outra Fenda.', 'The Rift carried you to another Rift.'));
}
// damage the Lord takes: the rifts shield him, collapse exposes him
function riftBossArmor(e, amt, src){
  const rb = S.rb; if (!rb || src==='enemy') return amt;
  if (rb.phase===3){ floatText(e.x, e.y-0.35, $t('exposto', 'exposed'), '#ecd36a'); return Math.ceil(amt*1.5); }
  const n = Math.min(3, rb.rifts.length); if (!n) return amt;
  floatText(e.x, e.y-0.35, $t('armadura da Fenda', 'Rift armor'), '#b48cff');
  return Math.max(1, Math.ceil(amt*(1 - .15*n)));
}
// hit while rifts are open: he leaps to another one and leaves a fissure on the way
function riftBossHit(e){
  const rb = S.rb; if (!rb || rb.phase>=3 || S.turn - rb.blinkAt < 3 || rb.rifts.length<2) return;
  const dests = rb.rifts.filter(r => !(r.x===e.x && r.y===e.y) && !occupied(r.x, r.y));
  if (!dests.length) return;
  const to = pick(dests), path = riftLine({x:e.x, y:e.y}, to).filter(([x,y]) => !(x===e.x && y===e.y) && !(x===to.x && y===to.y));
  rb.blinkAt = S.turn; rb.fissure = path;
  burst(e.x, e.y, '#b48cff', 26); fx.rings.push({x:e.x, y:e.y, t:0, c:'180,140,255'});
  e.x = to.x; e.y = to.y; e.intent = {kind:'wait'}; e.recover = 1;
  burst(e.x, e.y, '#e6d6ff', 22);
  floatText(e.x, e.y-0.5, $t('salto da Fenda', 'Rift leap'), '#e6d6ff');
  log($t('O Senhor saltou para outra Fenda e deixou uma fissura.', 'The Lord leaped to another Rift and left a fissure.'));
  planRiftBoss(); refreshDanger();
}
// kills near a rift seal it; every spawn killed pays Shards
function riftBossKill(e){
  const rb = S.rb; if (!rb || e.boss) return;
  if (e.rift){
    const n = Math.max(1, Math.round((1 + (stats().shardMagnet ? 1 : 0)) * (stats().shardMagnet ? 1.25 : 1)));
    HERO.riftShards = (HERO.riftShards||0) + n; S.riftShardsRun = (S.riftShardsRun||0) + n;
    floatText(e.x, e.y-0.5, $t(`+${n} estilhaço${n>1?'s':''}`, `+${n} shard${n>1?'s':''}`), '#b48cff');
  }
  if (rb.phase===3) return;
  for (const r of [...rb.rifts]) if (cheb(e.x,e.y,r.x,r.y)<=2){ r.kills++; floatText(r.x, r.y-0.3, `${r.kills}/4`, '#e6d6ff'); if (r.kills>=4) closeBossRift(r); }
}
