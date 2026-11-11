/* Rei Caído — floors, terrain, specials, boss arenas, enemy intents */

/* ---------- Board queries ---------- */
const enemyAt = (x,y) => S.enemies.find(e => e.x===x && e.y===y);
const allyAt = (x,y) => S.allies.find(a => a.x===x && a.y===y);
const isWall = (x,y) => S.walls.has(key(x,y));
const terrainAt = (x,y) => S.terrain.get(key(x,y));
const isPit = (x,y) => terrainAt(x,y)==='pit';
const isWater = (x,y) => terrainAt(x,y)==='water';
const isLava = (x,y) => terrainAt(x,y)==='lava';
const isIce = (x,y) => terrainAt(x,y)==='ice';
const isPlayer = (x,y) => S.player.x===x && S.player.y===y;
const occupied = (x,y) => isWall(x,y) || isPit(x,y) || !!enemyAt(x,y) || !!allyAt(x,y) || isPlayer(x,y);
function log(msg){ if (!S) return; S.log.unshift(msg); if (S.log.length>8) S.log.length = 8; }
const enemyName = e => e.label ? e.label : e.boss ? e.name : e.elite ? $t(EDEF[e.type].name+' de elite', 'Elite '+EDEF[e.type].name) : EDEF[e.type].name;

/* ---------- Floor plan per expedition kind ---------- */
function floorPlan(){
  const ex = S.exp, f = S.floor;
  if (ex.kind==='campaign'){
    const act = ex.act + Math.floor((f-1)/3), af = (f-1)%3+1, biome = ACTS[act];
    return {biome, boss: af===3 ? BIOMES[biome].boss : null, lvl: act*3+af, act, af};
  }
  if (ex.kind==='abyss'){
    const biome = ACTS[Math.floor((f-1)/3)%4];
    return {biome, boss: f%12===0 ? 'mirror' : f%3===0 ? BIOMES[biome].boss : null, lvl:f};
  }
  if (ex.kind==='map') return {biome:ex.map.biome, boss: f===3 ? ex.map.boss : null, lvl: 12 + ex.map.tier*2 + f};
  if (ex.kind==='tutorial') return {biome:'crypt', boss:null, lvl:1};
  if (ex.kind==='uber'){ const id = ex.boss || 'queen'; return {biome:UBERS[id].biome, boss:id, lvl: Math.max(30, HERO.level+5)}; }
  if (ex.kind==='pinnacle') return {biome:'crypt', boss:'fallen', lvl: Math.max(32, HERO.level+6)};
  if (ex.kind==='hunt'){
    const i = BOSS_ORDER.indexOf(ex.boss);
    return {biome: i<0 ? 'crypt' : ACTS[i], boss:ex.boss, lvl: Math.max((i<0?4:i+1)*3, HERO.level)};
  }
  return {biome:'crypt', boss:null, lvl:4};
}
function isLastFloor(){
  const ex = S.exp;
  if (ex.kind==='campaign') return S.act===3 && S.af===3;
  if (ex.kind==='map') return S.floor>=3;
  if (ex.kind==='tutorial') return true;
  if (ex.kind==='abyss') return false;
  return true;
}
function floorTitle(){ const t = floorTitleBase(); return t + (S.torment ? $t(` · Tormento ${S.torment}`, ` · Torment ${S.torment}`) : '') + (S.tide ? $t(' · Maré de Sangue', ' · Blood Tide') : ''); }
function floorTitleBase(){
  const ex = S.exp, b = BIOMES[S.biome].name;
  if (ex.kind==='campaign') return $t(`Ato ${S.act+1}, andar ${S.af}: ${b}`, `Act ${S.act+1}, floor ${S.af}: ${b}`);
  if (ex.kind==='abyss') return $t(`Abismo infinito, andar ${S.floor}: ${b}`, `Endless Abyss, floor ${S.floor}: ${b}`);
  if (ex.kind==='map') return $t(`Mapa nível ${ex.map.tier}, andar ${S.floor} de 3: ${b}`, `Map tier ${ex.map.tier}, floor ${S.floor} of 3: ${b}`);
  if (ex.kind==='hunt') return $t(`Caça ao chefe: ${b}`, `Boss hunt: ${b}`);
  if (ex.kind==='tutorial') return $t('Pátio de Treino', 'Training Yard');
  if (ex.kind==='uber') return $t(`Chefe supremo: ${UBERS[ex.boss||'queen'].name}`, `Uber boss: ${UBERS[ex.boss||'queen'].name}`);
  if (ex.kind==='pinnacle') return $t('Sala do Trono: o Rei Caído', 'Throne Room: the Fallen King');
  return $t('Desafio do dia', 'Daily Challenge');
}
// what shows up on a floor (packs, elites, formations, events) follows the act in Normal;
// in any Torment and in maps everything is in from the first floor
const contentLvl = () => (S.torment || S.exp.kind==='map') ? Math.max(S.lvl, 12) : S.lvl;
function enemyScale(){ return (1 + 0.15*(S.lvl-1)) * (S.mapAff.has('mHp') ? 1.4 : 1) * (1 + .3*(S.torment||0)); }

/* ---------- Units ---------- */
function makeEnemy(type, x, y, o){
  const d = EDEF[type], hp = Math.round(d.hp*enemyScale());
  const e = {id:++uid, type, x, y, rx:x, ry:y, lx:0, ly:0, hp, maxHp:hp, shield:0, mods:[],
             dmg: d.dmg + Math.floor((S.lvl-1)/3) + (S.mapAff.has('mDmg')?1:0) + (S.torment||0),
             boss:false, elite:false, t:0, intent:null, moved:false};
  e.dtype = BIOME_ELEMENT[S.biome] || 'phys';
  e.res = e.dtype!=='phys' ? {[e.dtype]:50} : {};
  if (S.mapAff.has('mThorns')) e.mods.push('thorns');
  if (S.mapAff.has('mSwift')) e.mods.push('swift');
  if (S.mapAff.has('mExplode')) e.mods.push('explode');
  if (S.biome==='swamp' && type==='P' && rnd()<.5) e.mods.push('submerge');
  if (S.biome==='forge' && type==='R') e.mods.push('lavaTrail');
  if (S.biome==='cathedral' && type==='B') e.mods.push('frost');
  return Object.assign(e, o||{});
}
function makeAlly(type, x, y, fromX, fromY){
  const st = stats(), sturdy = st.sturdyPawns;
  // allies grow with the hero: level (life and damage) and half of the hero's bonus damage from gear and talents
  const lv = HERO ? HERO.level : 1, bonusDmg = Math.floor(Math.max(0, st.dmg-2)/2);
  const hp = (type==='P' ? 4+(sturdy?3:0) : 9) + Math.floor(lv*.6);
  return {id:++uid, type, x, y, rx:fromX??x, ry:fromY??y, lx:0, ly:0, hp, maxHp:hp, dmg: (type==='P' ? 2+(sturdy?1:0) : 3) + Math.floor(lv/6) + bonusDmg};
}
function makeBoss(id, x, y){
  const B = BOSSES[id], side = S.color==='w' ? 'dark' : 'holy';
  const type = id==='mirror' ? S.cls : B.type;
  const e = makeEnemy(type, x, y);
  e.mods = [];
  if (id==='mirror'){
    const st = stats();
    e.hp = e.maxHp = Math.round(st.hp*3.2*(1+.04*(S.lvl-1)));
    e.dmg = st.dmg + 1 + Math.floor((S.lvl-1)/4) + (S.torment||0);
  } else {
    // bosses ramp up through the campaign: the Act 1 boss takes about 10 hits from a new hero, full strength from Act 4 on
    const ramp = Math.min(1, .25 + .06*S.lvl);
    e.hp = e.maxHp = Math.round(B.hp*enemyScale()*ramp);
    e.dmg = B.dmg + Math.floor((S.lvl-1)/3) + (S.mapAff.has('mDmg')?1:0) + (S.torment||0) - (S.lvl<=3 ? 1 : 0);
  }
  Object.assign(e, {boss:true, bossId:id, origId:id, name:B.names[side], phase:1, side});
  const mods = new Set();
  for (const a of S.bossRelics[0].affixes){
    if (a.k==='dmg') e.dmg += a.v;
    else if (a.k==='hp'){ e.maxHp += a.v*3; e.hp += a.v*3; }
    else if (a.k==='shield') e.shield += a.v*3;
    else if (a.k==='cdr') mods.add('fastSummon');
    else if (BOSS_ITEM_MAP[a.k]) mods.add(BOSS_ITEM_MAP[a.k]);
  }
  if (S.mapAff.has('mThorns')) mods.add('thorns');
  if (id==='pawn') mods.delete('swift');
  e.mods = [...mods];
  if (atlasRank('kDuel')){ e.hp = e.maxHp = Math.round(e.maxHp*1.3); }
  if (S.exp.kind==='uber'){ e.uber = true; e.hp = e.maxHp = Math.round(e.maxHp*1.6); e.dmg += 2; e.name = id==='twins' ? $t('Torre Suprema', 'Supreme Rook') : UBERS[id].name; }
  // the pinnacle: half again an uber boss's health
  if (id==='fallen'){ e.uber = true; e.fphase = 1; e.hp = e.maxHp = Math.round(e.maxHp*2.4); e.dmg += 2; }
  return e;
}
function placePlayer(x,y){ Object.assign(S.player, {x, y, rx:x, ry:y, lx:0, ly:0}); }
function placeEnemy(type, maxY){
  for (let g=0; g<300; g++){
    const x = rint(W), y = rint(maxY);
    if (occupied(x,y) || isLava(x,y)) continue;
    const e = makeEnemy(type, x, y); S.enemies.push(e); return e;
  }
  return null;
}
// a pack of weak pawns ("Lacaios"): one hit each, little loot, food for area damage and on-kill effects
function placePack(){
  for (let g=0; g<80; g++){
    const cx = rint(W), cy = rint(Math.ceil(H/2));
    if (occupied(cx,cy) || terrainAt(cx,cy)) continue;
    const spots = [[cx,cy], ...shuffle(ALL.map(([dx,dy]) => [cx+dx,cy+dy]))]
      .filter(([x,y]) => inb(x,y) && !occupied(x,y) && !isLava(x,y) && !isPit(x,y) && cheb(x,y,S.player.x,S.player.y)>2);
    if (spots.length<3) continue;
    for (const [x,y] of spots.slice(0, 3+rint(2))){
      const e = makeEnemy('P', x, y);
      e.fodder = true; e.label = $t('Lacaio', 'Minion'); e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp*.4)); e.dmg = Math.max(1, e.dmg-1);
      e.mods = e.mods.filter(m => m!=='submerge');
      S.enemies.push(e);
    }
    return;
  }
}
/* Formations: a Protector (Rook, or King deeper down) shields whoever touches it every turn; an Artillery
   piece (Bishop, or Queen deeper down) stays behind it and, as in chess, only shoots along a clear line;
   two pawn Guards stand in front. Breaking the Protector first breaks the shields. */
function placeFormation(){
  if (S.exp.kind==='daily' || contentLvl()<5 || rnd()>=.5) return;
  const P = contentLvl()>=8 && rnd()<.4 ? 'K' : 'R', A = contentLvl()>=10 && rnd()<.35 ? 'Q' : 'B';
  for (let g=0; g<80; g++){
    const x = 1+rint(W-2), y = 1+rint(Math.max(1, Math.ceil(H/2)-2));
    const cells = [[x,y,P,'protector'], [x-1,y+1,'P','guard'], [x+1,y+1,'P','guard'], [x+1,y-1,A,'artillery']];
    if (!cells.every(([cx,cy]) => inb(cx,cy) && !occupied(cx,cy) && !isLava(cx,cy) && !isPit(cx,cy) && cheb(cx,cy,S.player.x,S.player.y)>2)) continue;
    const gid = ++uid;
    for (const [cx,cy,t,role] of cells){ const e = makeEnemy(t, cx, cy); e.group = gid; e.role = role; S.enemies.push(e); }
    log($t('Uma formação inimiga guarda este andar: Protetor, Artilheiro e dois Guardas.', 'An enemy formation guards this floor: Protector, Artillery and two Guards.'));
    return;
  }
}
const protectorShield = () => 1 + Math.floor(S.lvl/6);
// end of the enemy turn: each Protector shields its neighbours (up to 3 turns' worth)
function protectorTick(){
  for (const p of S.enemies) if (p.role==='protector' && !(p.intent && p.intent.stunned)){
    const amt = protectorShield();
    for (const [dx,dy] of ALL){ const o = enemyAt(p.x+dx, p.y+dy); if (o && o!==p && !o.boss && o.shield < amt*3) o.shield = Math.min(amt*3, o.shield + amt); }
  }
}
// formation members keep their shape: the Protector stays close to its group, the Artillery stays behind the Protector
function roleBias(e, x, y){
  if (!e.group) return 0;
  const mates = S.enemies.filter(o => o.group===e.group && o!==e);
  if (!mates.length) return 0;
  if (e.role==='protector') return Math.min(...mates.map(o => cheb(x,y,o.x,o.y))) > 1 ? 1.2 : 0;
  if (e.role==='artillery'){ const p = mates.find(o => o.role==='protector'); return p ? Math.max(0, cheb(x,y,p.x,p.y)-2)*2.5 + (y > p.y ? .8 : 0) : 0; }
  return 0;
}
function makeElites(n){
  const cands = shuffle(S.enemies.filter(e => !e.boss && !e.elite && e.type!=='P'));
  for (const e of cands.slice(0,n)){
    e.elite = true; e.hp = e.maxHp = Math.round(e.maxHp*2); e.dmg += 1;
    // early elites only get the simpler modifiers; spikes, regeneration and lifesteal come later
    const pool = contentLvl()>=6 ? ELITE_MODS : ['armor','swift','explode'];
    const extra = shuffle(pool.filter(m => !e.mods.includes(m))).slice(0, contentLvl()>=9 ? 2 : 1);
    e.mods.push(...extra);
  }
}

/* ---------- Floor generation ---------- */
function composition(){
  if (contentLvl()<=1) return ['P','P','P','B'];
  // fewer enemies early on: the count ramps up through Acts 2 and 3 and is full from Act 3 on
  const ramp = Math.min(1, .5 + .06*contentLvl());
  const n = Math.round((3 + Math.min(8, S.lvl*0.6)) * (W*H/64) * ramp * (1 + .12*(S.torment||0)));
  const c = [];
  for (let i=0;i<n;i++){
    const r = rnd();
    if (contentLvl()>=3 && r<.12) c.push('N');
    else if (r<.27) c.push('B');
    else if (r<.4) c.push('R');
    else c.push('P');
  }
  return c;
}
function genRandomFloor(){
  W = H = S.exp.kind==='daily' ? 8 : pick(BIOMES[S.biome].sizes);
  const px = 1+rint(W-2), py = H-1;
  placePlayer(px, py);
  const wc = Math.round(W*H*(.06+rnd()*.04));
  for (let g=0; S.walls.size<wc && g<500; g++){
    const x = rint(W), y = 1+rint(H-2);
    if (cheb(x,y,px,py)>2) S.walls.add(key(x,y));
  }
  const freeSq = minD => {
    for (let t=0;t<200;t++){ const x=rint(W), y=rint(H-1); if (!isWall(x,y) && !S.terrain.has(key(x,y)) && cheb(x,y,px,py)>minD) return [x,y]; }
    return null;
  };
  if (S.biome==='crypt'){
    for (let i=0;i<2+rint(2);i++){ const s = freeSq(2); if (s) S.terrain.set(key(s[0],s[1]), 'pit'); }
    for (let i=0;i<2+rint(2);i++){ const s = freeSq(2); if (s) S.terrain.set(key(s[0],s[1]), 'grave'); }
  }
  if (S.biome==='swamp'){
    for (let b=0;b<3;b++){
      const s = freeSq(1); if (!s) continue;
      S.terrain.set(key(s[0],s[1]), 'water');
      for (const [dx,dy] of shuffle(ORTH).slice(0,2+rint(2))){
        const x=s[0]+dx, y=s[1]+dy;
        if (inb(x,y) && !isWall(x,y) && !(x===px && y===py)) S.terrain.set(key(x,y), 'water');
      }
    }
  }
  if (S.biome==='forge') for (let i=0;i<4+rint(4);i++){ const s = freeSq(2); if (s) S.terrain.set(key(s[0],s[1]), 'lava'); }
  if (S.biome==='cathedral'){
    for (let y=1;y<H-1;y++) for (let x=0;x<W;x++) if (!isWall(x,y) && rnd()<.28 && cheb(x,y,px,py)>1) S.terrain.set(key(x,y), 'ice');
  }
  for (const t of composition()) placeEnemy(t, Math.ceil(H/2));
  // difficulty ramps up: packs and elites from the end of Act 1, a second pack and elite later on
  const cl = contentLvl();
  if (cl>=3) for (let i=0; i<(cl>=7 ? 2 : 1); i++) placePack();
  if (cl>=3) makeElites((S.mapAff.has('mElites') ? 2 : 1) + (cl>=10 ? 1 : 0) + ((S.torment||0)>=3 ? 1 : 0));
  placeSpecial();
  placeEvent();
  placeTide();
  placeRival();
  placeFormation();
}
const ARENAS = {
  queen:{walls:[[2,2],[5,2],[2,5],[5,5]], terrain:[], boss:[[3,0]], guards:[['P',2,1],['P',5,1]], player:[4,7]},
  knight:{walls:[[1,1],[6,1]], terrain:[['water',3,3],['water',4,3],['water',3,4],['water',4,4]], boss:[[4,1]], guards:[['P',2,2],['P',5,2]], player:[3,7]},
  twins:{walls:[[3,3],[4,4]], terrain:[['lava',0,4],['lava',1,4],['lava',6,4],['lava',7,4]], boss:[[1,0],[6,0]], guards:[], player:[4,7]},
  pawn:{walls:[[1,3],[6,3]], terrain:[['ice',2,5],['ice',5,5],['ice',2,2],['ice',5,2]], boss:[[3,0]], guards:[['P',2,1],['P',4,1]], player:[7,7]},
  mirror:{walls:[[2,3],[5,3],[2,4],[5,4]], terrain:[], boss:[[3,0]], guards:[], player:[4,7]},
  fallen:{walls:[[1,2],[6,2],[1,5],[6,5]], terrain:[], boss:[[4,0]], guards:[['P',3,1],['P',5,1]], player:[3,7]}
};
function genArena(id){
  W = H = 8;
  const A = ARENAS[id];
  placePlayer(A.player[0], A.player[1]);
  for (const [x,y] of A.walls) S.walls.add(key(x,y));
  for (const [t,x,y] of A.terrain) S.terrain.set(key(x,y), t);
  S.bossRelics = bossRelics(id);
  for (const [x,y] of A.boss) S.enemies.push(makeBoss(id, x, y));
  for (const [t,x,y] of A.guards) if (!occupied(x,y)) S.enemies.push(makeEnemy(t, x, y));
}
function placeSpecial(){
  if (S.exp.kind==='daily') return;
  const r = rnd();
  const kind = r<.14 ? 'treasure' : r<.28 ? 'shrine' : (r<.38 && S.floor>1) ? 'merchant' : null;
  if (!kind) return;
  let spot = null;
  for (let g=0; g<200 && !spot; g++){
    const x = rint(W), y = 1+rint(H-3);
    if (!occupied(x,y) && !S.terrain.has(key(x,y)) && cheb(x,y,S.player.x,S.player.y)>2) spot = [x,y];
  }
  if (!spot) return;
  const [x,y] = spot;
  if (kind==='treasure'){
    S.items.push({x, y, chest:true});
    for (let i=0;i<2;i++){
      const adj = shuffle(ALL).map(([dx,dy])=>[x+dx,y+dy]).find(([a,b]) => inb(a,b) && !occupied(a,b));
      if (adj) S.enemies.push(makeEnemy(pick(['R','B','N']), adj[0], adj[1]));
    }
    log($t('Um baú guardado espera neste andar.', 'A guarded chest waits on this floor.'));
  } else if (kind==='shrine'){
    S.items.push({x, y, shrine:pick(SHRINES)});
    log($t('Um santuário brilha neste andar.', 'A shrine glows on this floor.'));
  } else {
    S.items.push({x, y, merchant:true, stock:[genItem(false), genItem(false), genItem(true)]});
    log($t('Um mercador montou banca neste andar.', 'A merchant has set up shop on this floor.'));
  }
}
function freeAdj(){
  return ALL.map(([dx,dy])=>[S.player.x+dx,S.player.y+dy]).filter(([x,y]) =>
    inb(x,y) && !occupied(x,y) && !isLava(x,y) && !S.items.some(i=>i.x===x&&i.y===y) && !(S.stairs && S.stairs.x===x && S.stairs.y===y));
}
function placeAllies(list){
  const p = S.player, spots = [];
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (!occupied(x,y) && !isLava(x,y) && cheb(x,y,p.x,p.y)<=2) spots.push([x,y]);
  spots.sort((a,b)=>cheb(a[0],a[1],p.x,p.y)-cheb(b[0],b[1],p.x,p.y) || a[1]-b[1]);
  for (const a of list){
    const s = spots.shift(); if (!s) break;
    Object.assign(a, {x:s[0], y:s[1], rx:s[0], ry:s[1], lx:0, ly:0, hp:Math.min(a.maxHp, a.hp+2)});
    S.allies.push(a);
  }
}

function nextFloor(){
  S.floor++;
  if (S.floor>1) sfx('stairs');
  const plan = floorPlan();
  Object.assign(S, {biome:plan.biome, bossId:plan.boss, lvl:plan.lvl, act:plan.act, af:plan.af,
    walls:new Set(), terrain:new Map(), items:[], stairs:null, enemies:[], linked:null, fleeUsed:false, untouchable:false, supPromoUsed:false, crownReady:true, crownAt:0, fire:new Map(), burn:new Map(),
    env:null, rise:null, clock:null, clocks:0, tide:false, loneSince:null, tideRise:null, bloodRain:null, tideIra:0, tideGoal:8, horde:null, sight:0, risen:0, rift:null, riftShardsRun:0, firstHitDone:false, chess:null, hits:[], timeStop:0, fseed:Math.floor(Math.random()*1e9), bossRelics:null, floorCleared:false, bossKilledThisFloor:false});
  const keep = S.allies.filter(a => !a.spectral); S.allies = [];
  if (plan.boss) genArena(plan.boss); else if (S.exp.kind==='tutorial') genTutorial(); else genRandomFloor();
  placeAllies(keep);
  const st = stats();
  if (S.floor>1) S.player.hp = Math.min(st.hp, S.player.hp+5);
  if (st.gambit) S.player.hp = Math.max(1, Math.min(S.player.hp, Math.ceil(st.hp/2)));
  Object.assign(S, {nullHit:!!st.aegisFirst, nextBonus:0, floorBonus:0, pactUsed:false, promoted:false, lastStandUsed:false});
  S.shield = st.shield + (st.bulwark ? 6 : 0) + (st.g_dragona ? 3 : 0);
  S.cds = {}; for (const id of barSkills()) S.cds[id] = 0;
  S.actions = 1 + (st.firstStrike ? 1 : 0); S.mode = 'move'; S.turn = 1;
  newRound();
  if (st.royalGuard) for (let i=0;i<2 && S.allies.length<MAX_ALLIES;i++){ const f = freeAdj(); if (f.length) S.allies.push(makeAlly('P', f[0][0], f[0][1])); }
  // Veil of the Royal Guard: two spectral pawns that only last this floor
  if (st.spectralGuard) for (let i=0;i<2 && S.allies.length<MAX_ALLIES;i++){ const f = freeAdj(); if (f.length) S.allies.push(Object.assign(makeAlly('P', f[0][0], f[0][1]), {spectral:true})); }
  if (S.exp.kind==='daily') S.turnLimit = S.enemies.length*2 + 3;
  planIntents(S.color==='w');
  S.phase = 'player';
  const boss = S.enemies.find(e=>e.boss);
  // an event on this floor is announced unless an act/boss banner already takes the screen
  const note = S.eventNote; S.eventNote = null;
  if (boss){ showBanner(boss.name, BIOMES[S.biome].name); log($t(`${boss.name} empunha ${S.bossRelics[0].name}.`, `${boss.name} wields ${S.bossRelics[0].name}.`)); }
  else if (S.exp.kind==='campaign' && S.af===1) showBanner($t(`Ato ${S.act+1}`, `Act ${S.act+1}`), BIOMES[S.biome].name);
  else if (S.exp.kind==='abyss' && (S.floor-1)%3===0) showBanner($t(`Abismo, andar ${S.floor}`, `Abyss, floor ${S.floor}`), BIOMES[S.biome].name);
  else if (note) showBanner(note[0], note[1]);
  else if (S.exp.kind==='daily') showBanner($t('Desafio do dia', 'Daily Challenge'), $t(`Vença em ${S.turnLimit} turnos`, `Win within ${S.turnLimit} turns`));
  log(floorTitle()+'.');
  resize(); updateUI();
}

/* ---------- Stairs ---------- */
function reachable(){
  const seen = new Set([key(S.player.x,S.player.y)]), q = [[S.player.x,S.player.y]];
  while (q.length){
    const [x,y] = q.shift();
    for (const t of classMoves(x, y, true)){ const k = key(t.x,t.y); if (!seen.has(k)){ seen.add(k); q.push([t.x,t.y]); } }
  }
  return seen;
}
function spawnStairs(early){
  const reach = reachable(), free = [];
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){
    if (!reach.has(key(x,y)) || occupied(x,y) || isLava(x,y) || S.items.some(i=>i.x===x&&i.y===y)) continue;
    free.push([x,y]);
  }
  if (!free.length){ if (!early) S.goDown = true; return; }
  // prefer plain floor; ice or water under the stairs would make them awkward to stop on
  const plain = free.filter(([x,y]) => !terrainAt(x,y));
  const pool = plain.length ? plain : free;
  const d = p => Math.abs(p[0]-S.player.x)+Math.abs(p[1]-S.player.y);
  pool.sort((a,b)=>d(b)-d(a));
  const c = pick(pool.slice(0,6));
  S.terrain.delete(key(c[0],c[1]));
  S.stairs = {x:c[0], y:c[1]};
  log(early ? $t('O último inimigo não se deixa alcançar. A escada se abriu: termine com ele ou siga adiante.', 'The last enemy will not let itself be reached. The stairs have opened: finish it off or move on.') : $t('O andar está limpo. Uma escada se abriu.', 'The floor is clear. A staircase has opened.'));
}

/* ---------- Enemy intents ---------- */
// Line attacks pass through the player and allies and stop at the first enemy behind them (friendly fire).
// An enemy in front of the target blocks the attack. Pits do not block lines; walls do.
// common line pieces only reach a few squares (bosses reach the whole line): your own range is the edge
const attackReach = e => e.boss ? 99 : ({B:3, R:4, Q:3})[e.type] + (e.mods.includes('swift')?1:0) + (e.mods.includes('enraged')?1:0);
function lineAttack(e, dirs){
  let allyLine = null;
  const reach = attackReach(e);
  for (const [dx,dy] of dirs){
    const sq=[]; let seenP=false, seenA=false, x=e.x+dx, y=e.y+dy;
    for (let i=1; i<=reach && inb(x,y) && !isWall(x,y); i++){
      if (enemyAt(x,y)){ if (seenP||seenA) sq.push([x,y]); break; }
      sq.push([x,y]);
      if (isPlayer(x,y)) seenP = true;
      if (allyAt(x,y)) seenA = true;
      x+=dx; y+=dy;
    }
    if (seenP) return sq;
    if (seenA && !allyLine) allyLine = sq;
  }
  return allyLine;
}
function adjTarget(e, offs){
  let ally = null;
  for (const [dx,dy] of offs){
    const x=e.x+dx, y=e.y+dy;
    if (isPlayer(x,y)) return [[x,y]];
    if (!ally && allyAt(x,y)) ally = [[x,y]];
  }
  return ally;
}
function starSquares(e){
  const sq = [];
  for (const [dx,dy] of ALL){ let x=e.x+dx, y=e.y+dy; while (inb(x,y) && !isWall(x,y)){ sq.push([x,y]); x+=dx; y+=dy; } }
  return sq;
}
function attackPlan(e){
  if (e.boss){
    if (e.bossId==='queen' && e.phase===2) return lineAttack(e, ALL) ? starSquares(e) : null;
    if (e.bossId==='knight' || (e.bossId==='mirror' && e.type==='N')){
      const ks = KN.map(([dx,dy])=>[e.x+dx,e.y+dy]).filter(([x,y]) => inb(x,y) && !isWall(x,y));
      return ks.some(([x,y]) => isPlayer(x,y) || allyAt(x,y)) ? ks : null;
    }
  }
  switch (e.type){
    case 'P': return adjTarget(e, DIAG);
    case 'K': return adjTarget(e, ALL);
    case 'N': return adjTarget(e, KN);
    case 'B': return lineAttack(e, DIAG);
    case 'R': return lineAttack(e, ORTH);
    default: return lineAttack(e, ALL);
  }
}
function enemyRange(e){
  return ({P:1,N:1,B:2,R:3,Q:2,K:1})[e.type] + (e.mods.includes('swift')?1:0) + (e.mods.includes('enraged')?1:0) + (e.bossId==='queen' && e.phase===2 ? 1 : 0);
}
const canStopOn = (x,y,dx,dy) => !isIce(x,y) || !inb(x+dx,y+dy) || occupied(x+dx,y+dy);
// Ice: whoever lands on it keeps sliding in the direction of travel until off the ice or blocked
function slideEnd(x, y, dx, dy){
  const sx = Math.sign(dx), sy = Math.sign(dy);
  if (!sx && !sy) return [x,y];
  while (isIce(x,y)){
    const nx = x+sx, ny = y+sy;
    if (!inb(nx,ny) || occupied(nx,ny)) break;
    x = nx; y = ny;
  }
  return [x,y];
}
// Swamp: attacking from inside water deals 1 less
const enemyHit = e => (isWater(e.x,e.y) ? Math.max(1, e.dmg-1) : e.dmg) + (terrainAt(e.x,e.y)==='blood' ? 1 : 0);
function moveOptions(e, reserved){
  const out = [[e.x,e.y]];
  const ok = (x,y) => inb(x,y) && !occupied(x,y) && !reserved.has(key(x,y));
  if (e.bossId==='pawn'){ if (ok(e.x,e.y+1)) out.push([e.x,e.y+1]); return out; }
  if (e.type==='N' || e.type==='P' || e.type==='K'){
    for (const [dx,dy] of (e.type==='N' ? KN : e.type==='P' ? ORTH : ALL)){
      if (!ok(e.x+dx,e.y+dy)) continue;
      const end = slideEnd(e.x+dx, e.y+dy, dx, dy);
      if (!reserved.has(key(end[0],end[1]))) out.push(end);
    }
    return out;
  }
  const dirs = e.type==='B' ? DIAG : e.type==='R' ? ORTH : ALL, range = enemyRange(e);
  for (const [dx,dy] of dirs) for (let i=1;i<=range;i++){
    const x=e.x+dx*i, y=e.y+dy*i;
    if (!inb(x,y) || occupied(x,y)) break;
    if (!reserved.has(key(x,y)) && canStopOn(x,y,dx,dy)) out.push([x,y]);
    if (isWater(x,y)) break;
  }
  return out;
}
function aligned(type,x,y,tx,ty){
  const dx=tx-x, dy=ty-y;
  if (type==='R') return dx===0||dy===0;
  if (type==='B') return Math.abs(dx)===Math.abs(dy);
  if (type==='Q') return dx===0||dy===0||Math.abs(dx)===Math.abs(dy);
  return false;
}
function score(e,x,y){
  // a common pawn far from you marches towards the last rank (your side) to promote
  if (e.type==='P' && !e.boss && cheb(e.x,e.y,S.player.x,S.player.y)>3) return (H-1-y) + (x!==e.x ? .5 : 0) + rnd()*.1;
  const targets = [[S.player.x,S.player.y,0], ...S.allies.map(a=>[a.x,a.y,.6])];
  let best = Infinity;
  for (const [tx,ty,pen] of targets){
    const ax=Math.abs(tx-x), ay=Math.abs(ty-y), d=Math.max(ax,ay);
    let s = d + pen;
    if (e.type==='P'){ if (ax===1 && ay===1) s -= 2; }
    else if (e.type==='N'){ if ((ax===1&&ay===2)||(ax===2&&ay===1)) s -= 3; }
    else if (e.type==='K'){ if (d===1) s -= 1; }
    else { if (aligned(e.type,x,y,tx,ty) && d<=attackReach(e)) s -= 2.5; if (d<=1 && S.enemies.length>1) s += 1.5; }
    best = Math.min(best, s);
  }
  if (isLava(x,y) && !e.boss && !e.mods.includes('lavaTrail')) best += 3;
  best += roleBias(e, x, y);
  if (S.burn.has(key(x,y))) best += 2;
  return best + rnd()*0.4;
}
function summonEvery(e){
  if (!e.boss) return 0;
  const fast = e.mods.includes('fastSummon') ? 1 : 0;
  if (e.bossId==='queen') return Math.max(1, (e.phase===2 ? 2 : 3) - fast);
  if (e.bossId==='pawn' && e.phase===2) return 2;
  if (e.bossId==='mirror' && e.type==='K') return Math.max(1, 3 - fast);
  return 0;
}
/* Fallen King, phase 1: every other special turn is a Royal Order instead of the Decree.
   Few pawns: summon two. A pawn and no queen: promote the most advanced pawn. Otherwise: War Cry. */
function fallenOrder(e, reserved){
  if (e.fphase===2 || e.t % 4 !== 2) return null;
  const court = S.enemies.filter(o => !o.boss), pawns = court.filter(o => o.type==='P');
  if (pawns.length < 2 && court.length < (e.fphase===3 ? 6 : 5)){
    const free = shuffle(ALL.map(([dx,dy]) => [e.x+dx,e.y+dy]).filter(([x,y]) => inb(x,y) && !occupied(x,y) && !reserved.has(key(x,y)) && !isLava(x,y)));
    if (free.length){ const to = free.slice(0,2); to.forEach(([x,y]) => reserved.add(key(x,y))); return {kind:'summon', to, order:true}; }
  }
  if (pawns.length && !court.some(o => o.type==='Q')) return {kind:'royal', order:'promote', id:pawns.sort((a,b) => b.y-a.y)[0].id};
  return {kind:'royal', order:'rally'};
}
// where the Fallen King can step to escape: free neighbors that you (or your allies) do not reach
function fallenEscapes(e){
  const reach = new Set(), p = S.player;
  for (const t of classMoves(p.x, p.y, true)) reach.add(key(t.x,t.y));
  for (const a of S.allies) for (const [dx,dy] of ALL) reach.add(key(a.x+dx,a.y+dy));
  return ALL.map(([dx,dy]) => [e.x+dx,e.y+dy]).filter(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !occupied(x,y) && !reach.has(key(x,y)));
}
// the best square to move to, or null to stay put; stagger = an exposed boss only shuffles 1 square
function pickMove(e, reserved, stagger){
  const opts = stagger ? [[e.x,e.y], ...ALL.map(([dx,dy]) => [e.x+dx,e.y+dy]).filter(([x,y]) => inb(x,y) && !occupied(x,y) && !reserved.has(key(x,y)) && !isIce(x,y))]
    : moveOptions(e, reserved);
  let best = opts[0], bs = Infinity;
  if (e.bossId==='pawn') best = opts[opts.length-1];
  else for (const o of opts){ const s = score(e,o[0],o[1]); if (s<bs){ bs=s; best=o; } }
  return best[0]===e.x && best[1]===e.y ? null : best;
}
function planIntents(moveOnly){
  const reserved = new Set();
  for (const e of S.enemies){
    if (e.dummy){ e.intent = {kind:'wait'}; reserved.add(key(e.x,e.y)); continue; }
    if (e.frozenPiece && S.timeStop>0){ e.intent = {kind:'wait', frozen:true}; reserved.add(key(e.x,e.y)); continue; }
    e.t++;
    // bosses breathe after each attack: exposed (no attack, +50% damage taken) for 1 turn, or 2 after an attack that covers
    // every line or a big zone (you had to leave all its lines, so you need a turn to line up again and one to hit)
    // exposed does not mean frozen: the boss may reposition towards you (never attack); you act first, so the punish window stays
    if (e.boss && e.recover>0 && !moveOnly){
      e.recover--; floatText(e.x, e.y-0.5, $t('exposto', 'exposed'), '#ecd36a');
      const to = e.bossId!=='pawn' ? pickMove(e, reserved, true) : null;
      if (to){ e.intent = {kind:'move', to, recover:true}; reserved.add(key(to[0],to[1])); }
      else { e.intent = {kind:'wait', recover:true}; reserved.add(key(e.x,e.y)); }
      continue;
    }
    const ro = !moveOnly && e.bossId==='fallen' ? fallenOrder(e, reserved) : null;
    if (ro){ e.intent = ro; reserved.add(key(e.x,e.y)); continue; }
    const sp = !moveOnly && e.boss ? bossSpecial(e) : null;
    if (sp){ e.intent = {kind:'attack', sq:sp.sq, special:sp.name}; e.recover = 2; reserved.add(key(e.x,e.y)); continue; }
    const atk = moveOnly ? null : attackPlan(e);
    if (atk){ e.intent = {kind:'attack', sq:atk, star: e.bossId==='queen' && e.phase===2}; if (e.boss) e.recover = e.intent.star ? 2 : 1; reserved.add(key(e.x,e.y)); continue; }
    const every = summonEvery(e);
    if (every && e.t % every === 0 && S.enemies.filter(o => !o.boss).length < 4){
      const free = shuffle(ALL.map(([dx,dy])=>[e.x+dx,e.y+dy]).filter(([x,y]) => inb(x,y) && !occupied(x,y) && !reserved.has(key(x,y))));
      const n = e.bossId==='pawn' ? 2 : 1;
      if (free.length){
        const to = free.slice(0,n); to.forEach(([x,y]) => reserved.add(key(x,y)));
        reserved.add(key(e.x,e.y)); e.intent = {kind:'summon', to}; continue;
      }
    }
    const best = pickMove(e, reserved);
    if (!best){ e.intent = {kind:'wait'}; reserved.add(key(e.x,e.y)); }
    else { e.intent = {kind:'move', to:best}; reserved.add(key(best[0],best[1])); }
  }
  if (!moveOnly) bossMark();
  planEnvironment();
  refreshDanger();
}
/* ---------- Boss pressure ---------- */
// Every few turns each boss swaps its normal attack for a large zone attack that leaves few safe squares
const BOSS_SPECIAL = {queen:$t('Cruz de Sangue', 'Blood Cross'), knight:$t('Cerco', 'Siege'), twins:$t('Muralha', 'Wall'), pawn:$t('Avanço', 'Advance'), mirror:$t('Reflexo', 'Reflection'), fallen:$t('Decreto', 'Decree')};
const FALLEN_DECREES = ['R','B','N','Q'];
const FALLEN_SPECIAL = {R:$t('Decreto da Torre', 'Decree of the Rook'), B:$t('Decreto do Bispo', 'Decree of the Bishop'), N:$t('Decreto do Cavalo', 'Decree of the Knight'), Q:$t('Decreto da Rainha', 'Decree of the Queen')};
const FALLEN_SPECIAL_DESC = {R:$t('As 4 linhas retas a partir dele, até as paredes.', 'The 4 straight lines from him, up to the walls.'),
  B:$t('As 4 diagonais a partir dele, até as paredes.', 'The 4 diagonals from him, up to the walls.'),
  N:$t('O anel a 2 casas de você e a sua casa.', 'The ring 2 squares from you, and your own square.'),
  Q:$t('As 8 linhas a partir dele, até as paredes.', 'All 8 lines from him, up to the walls.')};
function bossSpecial(e){
  const every = e.uber || e.phase===2 || e.mods.includes('enraged') ? 2 : 3;
  // the twins take turns so their walls never land together
  const offset = e.bossId==='twins' ? S.enemies.filter(o => o.boss).indexOf(e) : 0;
  if ((e.t + offset) % every !== 0) return null;
  const p = S.player, sq = [], seen = new Set();
  const add = (x,y) => { const k = key(x,y); if (inb(x,y) && !isWall(x,y) && !seen.has(k)){ seen.add(k); sq.push([x,y]); } };
  const id = e.bossId==='queen' && e.origId==='pawn' ? 'queen' : e.bossId;
  let name = BOSS_SPECIAL[id];
  if (id==='queen' && e.uber && Math.floor(e.t/2)%2){ name = $t('Coroa Estilhaçada', 'Shattered Crown'); for (const [dx,dy] of ALL){ let x=e.x+dx, y=e.y+dy; while (inb(x,y) && !isWall(x,y)){ add(x,y); x+=dx; y+=dy; } } }
  else if (id==='queen'){ const reach = e.uber ? 4 : 3; add(p.x,p.y); for (const [dx,dy] of ORTH) for (let i=1;i<=reach;i++) add(p.x+dx*i, p.y+dy*i); }
  else if (id==='knight' && e.uber){ name = $t('Cerco Supremo', 'Supreme Siege'); add(p.x,p.y); for (let dx=-2;dx<=2;dx++) for (let dy=-2;dy<=2;dy++) if (Math.max(Math.abs(dx),Math.abs(dy))===2) add(p.x+dx,p.y+dy); }
  else if (id==='knight'){ for (let dx=-1;dx<=1;dx++) for (let dy=-1;dy<=1;dy++) add(p.x+dx,p.y+dy); }
  else if (id==='twins' && e.uber){ name = $t('Muralha Estrelada', 'Starry Wall'); for (const [dx,dy] of ALL){ let x=e.x+dx, y=e.y+dy; while (inb(x,y) && !isWall(x,y)){ add(x,y); x+=dx; y+=dy; } } }
  else if (id==='twins'){ for (const [dx,dy] of ORTH){ let x=e.x+dx, y=e.y+dy; while (inb(x,y) && !isWall(x,y)){ add(x,y); x+=dx; y+=dy; } } }
  else if (id==='pawn'){ if (e.uber) name = $t('Avanço Supremo', 'Supreme Advance'); for (let y=e.y+1; y<=e.y+(e.uber?3:2); y++) for (let x=0;x<W;x++) add(x,y); }
  else if (id==='mirror'){ for (const t of classMoves(p.x, p.y, true)) add(t.x,t.y); }
  else if (id==='fallen'){
    const line = dirs => { for (const [dx,dy] of dirs){ let x=e.x+dx, y=e.y+dy; while (inb(x,y) && !isWall(x,y)){ add(x,y); x+=dx; y+=dy; } } };
    if (e.fphase!==2){
      if (e.t % 4 !== 0) return null;   // the other special turn is a Royal Order (see fallenOrder)
      name = $t('Decreto Real', 'Royal Decree');
      for (let dx=-2;dx<=2;dx++) for (let dy=-2;dy<=2;dy++) if (dx || dy) add(e.x+dx, e.y+dy);
    } else {
      // the shattered crown: the decree of his current form
      const f = e.type; name = FALLEN_SPECIAL[f];
      if (f==='R') line(ORTH);
      else if (f==='B') line(DIAG);
      else if (f==='N'){ add(p.x,p.y); for (let dx=-2;dx<=2;dx++) for (let dy=-2;dy<=2;dy++) if (Math.max(Math.abs(dx),Math.abs(dy))===2) add(p.x+dx,p.y+dy); }
      else line(ALL);
    }
  }
  sq.sort((a,b) => cheb(a[0],a[1],e.x,e.y) - cheb(b[0],b[1],e.x,e.y));
  return sq.length ? {sq, name} : null;
}
// A boss periodically marks the square you stand on: stay there and it hits you
function bossMark(){
  const b = S.enemies.find(e => e.boss);
  if (!b || b.t % 4 !== 1 || (b.intent && (b.intent.special || b.intent.recover || b.intent.kind==='summon'))) return;
  const p = [S.player.x, S.player.y];
  if (b.intent && b.intent.kind==='attack'){ if (!b.intent.sq.some(([x,y]) => x===p[0] && y===p[1])) b.intent.sq.push(p); }
  else b.intent = {kind:'attack', sq:[p]};
  b.intent.mark = p;
}
// Boss arenas get worse every 5 turns, in the biome's own way (telegraphed one turn ahead)
function planClock(){
  const p = S.player, all = [];
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (!isWall(x,y) && !isPit(x,y) && !(S.stairs && S.stairs.x===x && S.stairs.y===y)) all.push([x,y]);
  const near = (x,y,d) => cheb(x,y,p.x,p.y) <= d;
  const nextTo = t => ([x,y]) => terrainAt(x,y)!==t && ORTH.some(([dx,dy]) => terrainAt(x+dx,y+dy)===t);
  let kind, cand, n;
  if (S.biome==='crypt'){ kind = 'collapse'; cand = all.filter(([x,y]) => near(x,y,2)); n = 3; }
  else if (S.biome==='swamp'){ kind = 'flood'; cand = all.filter(nextTo('water')); if (!cand.length) cand = all.filter(([x,y]) => !terrainAt(x,y)); n = 4; }
  else if (S.biome==='forge'){ kind = 'lava'; cand = all.filter(nextTo('lava')); if (!cand.length) cand = all.filter(([x,y]) => !terrainAt(x,y) && !near(x,y,1)); n = 3; }
  else { kind = 'frost'; cand = all.filter(([x,y]) => !terrainAt(x,y) && near(x,y,3)); n = 5; }
  cand = shuffle(cand).slice(0, n);
  if (!cand.length) return;
  S.clock = {kind, sq:cand};
  showBanner({collapse:$t('O teto range', 'The ceiling creaks'), flood:$t('A água vai subir', 'The water will rise'), lava:$t('A lava vai transbordar', 'The lava will overflow'), frost:$t('O gelo vai avançar', 'The ice will advance')}[kind], $t('As casas marcadas mudam no fim do próximo turno.', 'The marked squares change at the end of next turn.'));
  log(CLOCK_TEXT[kind]);
}
const CLOCK_TEXT = {collapse:$t('O teto da cripta vai desabar nas casas marcadas (4 de dano). A mais distante de você vira fosso.', 'The crypt ceiling will collapse on the marked squares (4 damage). The one farthest from you becomes a pit.'),
  flood:$t('A água vai subir nas casas marcadas, e a névoa vai fechar.', 'The water will rise on the marked squares, and the fog will close in.'), lava:$t('A lava vai se espalhar para as casas marcadas.', 'The lava will spread to the marked squares.'),
  frost:$t('O gelo vai se espalhar pelas casas marcadas.', 'The ice will spread across the marked squares.')};
// Forge: an unstable pillar explodes every 4 turns (telegraphed one turn ahead)
function planEnvironment(){
  S.env = null; S.rise = null; S.clock = null;
  planTide();
  const uber = S.exp.kind==='uber' || S.exp.kind==='pinnacle';
  if (S.bossId && S.enemies.some(e => e.boss) && S.turn%(uber?4:5)===(uber?3:4) && (S.clocks||0)<(uber?8:4)) planClock();
  if (S.biome==='crypt' && S.turn%4===3 && (S.risen||0)<3){
    const graves = [...S.terrain].filter(([k,t]) => t==='grave' && !occupied(...unkey(k))).map(([k]) => unkey(k));
    if (graves.length) S.rise = pick(graves);
  }
  if (S.biome!=='forge' || S.turn%4!==3 || !S.walls.size) return;
  const w = unkey(pick([...S.walls]));
  S.env = {wall:w, sq:ALL.map(([dx,dy])=>[w[0]+dx,w[1]+dy]).filter(([x,y]) => inb(x,y) && !isWall(x,y))};
}
// swamp fog: you only see within a circular sight radius
const sight = () => S.sight || 3.6;
const sightDist = (x,y) => Math.hypot(x-S.player.x, y-S.player.y);
const inSight = (x,y) => S.biome!=='swamp' || sightDist(x,y) <= sight();
// frozen army pieces stay visible while time is stopped, so the strike can be planned
const intentVisible = e => inSight(e.x, e.y) || (e.frozenPiece && S.timeStop>0);
function refreshDanger(){
  S.danger = new Set(); S.dangerSeen = new Set();
  for (const e of S.enemies) if (e.intent && e.intent.kind==='attack'){
    const vis = intentVisible(e);
    for (const [x,y] of e.intent.sq){ S.danger.add(key(x,y)); if (vis) S.dangerSeen.add(key(x,y)); }
  }
  if (S.env) for (const [x,y] of S.env.sq){ S.danger.add(key(x,y)); S.dangerSeen.add(key(x,y)); }
  if (S.clock && S.clock.kind==='collapse') for (const [x,y] of S.clock.sq){ S.danger.add(key(x,y)); S.dangerSeen.add(key(x,y)); }
  if (S.bloodRain) for (const [x,y] of S.bloodRain.sq){ S.danger.add(key(x,y)); S.dangerSeen.add(key(x,y)); }
  for (const k of S.burn.keys()){ S.danger.add(k); S.dangerSeen.add(k); }
  const fk = S.enemies.find(e => e.bossId==='fallen' && e.fphase===3);
  S.kingEscapes = fk ? fallenEscapes(fk) : null;
  computeThreatNext();
}
// White faction: squares each enemy will threaten next turn, from where it is going to be
function patternSquares(e, x, y){
  const out = [];
  const offs = e.type==='P' ? DIAG : e.type==='K' ? ALL : e.type==='N' ? KN : null;
  if (offs || e.bossId==='knight'){
    for (const [dx,dy] of (e.bossId==='knight' ? KN : offs)){ const a=x+dx, b=y+dy; if (inb(a,b) && !isWall(a,b)) out.push(key(a,b)); }
    return out;
  }
  const dirs = e.type==='B' ? DIAG : e.type==='R' ? ORTH : ALL, reach = attackReach(e);
  for (const [dx,dy] of dirs){
    let a=x+dx, b=y+dy;
    for (let i=1; i<=reach && inb(a,b) && !isWall(a,b); i++){ out.push(key(a,b)); const o = enemyAt(a,b); if (o && o!==e) break; a+=dx; b+=dy; }
  }
  return out;
}
function computeThreatNext(){
  S.threatNext = new Set();
  if (S.color!=='w') return;
  for (const e of S.enemies){
    if (!e.intent || e.intent.stunned || !intentVisible(e)) continue;
    const [x,y] = e.intent.kind==='move' ? e.intent.to : [e.x,e.y];
    for (const k of patternSquares(e, x, y)) S.threatNext.add(k);
  }
}
function attackersOf(x,y){
  return S.enemies.filter(e => e.intent && e.intent.kind==='attack' && e.intent.sq.some(([sx,sy])=>sx===x&&sy===y));
}
function intentText(e){
  if (!intentVisible(e)) return $t('Escondido na névoa', 'Hidden in the fog');
  const it = e.intent; if (!it) return $t('Acabou de chegar', 'Just arrived');
  if (it.kind==='attack'){
    if (it.special) return $t(`Prepara ${it.special}: vai atingir todas as casas em vermelho`, `Preparing ${it.special}: will hit every red square`);
    if (it.mark) return $t('Marcou a sua casa: saia dela ou leve o golpe', 'Marked your square: leave it or take the blow');
    return it.star ? $t('Vai atacar em estrela', 'Will attack in a star') : $t('Vai atacar as casas em vermelho', 'Will attack the red squares');
  }
  if (it.kind==='move') return it.recover ? $t('Exposto: vai dar 1 passo, sem atacar', 'Exposed: will take 1 step, without attacking') : $t('Vai se mover', 'Will move');
  if (it.kind==='summon') return it.order ? $t('Ordem Real: vai convocar dois peões', 'Royal Order: will summon two pawns') : $t('Vai invocar reforços', 'Will summon reinforcements');
  if (it.kind==='royal') return it.order==='promote' ? $t('Ordem Real: vai promover um peão a rainha', 'Royal Order: will promote a pawn to queen') : $t('Ordem Real: Grito de Guerra (cura a corte e ganha escudo)', 'Royal Order: War Cry (heals the court and gains a shield)');
  return it.stunned ? $t('Atordoado, não age neste turno', 'Stunned, does not act this turn') : $t('Aguarda', 'Waiting');
}
