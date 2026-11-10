/* Rei Caído — map events (Frozen Match, the Rift) and the uber boss */

/* ---------- Placement ---------- */
// event size follows the difficulty: area level, and each Torment level counts as +3
const eventPower = () => S.lvl + 3*(S.torment||0);
const armySize = () => Math.max(4, Math.min(16, Math.round(3 + eventPower()*.45)));
const riftMaxAlive = () => Math.max(3, Math.min(8, Math.round(2 + eventPower()/4)));
function placeEvent(force){
  if (S.exp.kind==='daily' || S.exp.kind==='uber') return;
  const chance = S.exp.kind==='map' ? .6 + .1*atlasRank('aEvent') : S.exp.kind==='abyss' ? .45 : .35;
  if (!force && rnd()>=chance && !S.mapAff.has('rEvent')) return;
  let spot = null;
  for (let g=0; g<200 && !spot; g++){
    const x = rint(W), y = 1+rint(H-3);
    if (!occupied(x,y) && !S.terrain.has(key(x,y)) && !S.items.some(i => i.x===x && i.y===y) && cheb(x,y,S.player.x,S.player.y)>2) spot = [x,y];
  }
  if (!spot) return;
  const kind = force || (rnd() < Math.min(.9, Math.max(.1, .5 - .15*atlasRank('aRiftW'))) ? 'frozen' : 'rift');
  if (kind==='frozen' && frozenMode()==='army'){
    S.items.push({x:spot[0], y:spot[1], frozenArmy:pick(OPENINGS).id});
    // the army replaces part of the floor's usual enemies
    const regular = S.enemies.filter(e => !e.elite && !e.boss);
    for (const e of shuffle(regular).slice(0, Math.floor(regular.length * armySize()/32))) S.enemies = S.enemies.filter(o => o!==e);
    log('Um tabuleiro congelado brilha neste andar.');
    S.eventNote = ['Exército Congelado', 'Um tabuleiro de gelo brilha neste andar. Pise nele para revelar o exército.'];
  } else if (kind==='frozen'){
    const unknown = MATES.filter(m => !(HERO.grimoire||{})[m.id]);
    // mostly the longer problems; now and then a pattern you haven't learned yet (it teaches a Grimório power)
    const P = unknown.length && rnd()<.35 ? pick(unknown) : pick(PROBLEMS);
    S.items.push({x:spot[0], y:spot[1], frozen:P.id});
    log('Um tabuleiro congelado brilha neste andar.');
    S.eventNote = ['Partida Congelada', 'Um tabuleiro de gelo brilha neste andar. Pise nele para jogar.'];
  } else {
    S.items.push({x:spot[0], y:spot[1], riftGate:true});
    log('Uma fenda pulsa neste andar.');
    S.eventNote = ['Uma Fenda pulsa', 'Pise no rasgo roxo para abri-la. Crias surgem e deixam Estilhaços.'];
  }
}

/* ---------- Two versions of the frozen event, switchable in the camp ----------
   'army'  : a black army frozen in a classic opening; time stops for 3 turns to strike it, then it wakes.
   'puzzle': the hero and spectral pieces must deliver a checkmate in N moves (kept intact below). */
// the army version is kept in the code but switched off for now: only the checkmate version spawns
const frozenMode = () => 'puzzle';
const OPENINGS = [
  {id:'italiana', name:'Abertura Italiana', fen:'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R'},
  {id:'siciliana', name:'Defesa Siciliana, Najdorf', fen:'rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R'},
  {id:'francesa', name:'Defesa Francesa', fen:'rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR'},
  {id:'carokann', name:'Defesa Caro-Kann', fen:'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR'},
  {id:'gambito', name:'Gambito da Dama Recusado', fen:'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR'},
  {id:'espanhola', name:'Ruy López (Espanhola)', fen:'r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R'}
];
const TIME_STOP = 3;
// The black half of the opening appears on the top rows as NEW, frozen pieces (the floor's own enemies keep acting).
// For 3 turns you can shatter them; when the ice melts the whole army wakes, the shattered pieces come back
// to life, and only those you shattered ("marked") can drop loot when you kill them for real.
function startFrozenArmy(en){
  const O = OPENINGS.find(o => o.id===en.frozenArmy) || OPENINGS[0];
  const b = chParse(O.fen), off = Math.floor((8-W)/2);
  const king = b.findIndex(p => p && p.t==='K' && p.c==='b');
  const dist = sq => Math.max(Math.abs(sq%8 - king%8), Math.abs(((sq/8)|0) - ((king/8)|0)));
  const keep = b.map((p,sq) => p && p.c==='b' ? sq : -1).filter(sq => sq>=0).sort((a,c) => dist(a)-dist(c)).slice(0, armySize());
  for (const sq of keep){
    const p = b[sq];
    const fx_ = sq%8 - off, fy = (sq/8)|0;
    if (fx_<0 || fx_>=W || fy>=H-2) continue;
    // keep the opening's shape; if that square is blocked, use the nearest free square on the same row
    const cands = [...Array(W).keys()].map(x => [x, fy]).filter(([x,y]) => !occupied(x,y) && !isLava(x,y) && !isPit(x,y))
      .sort((a,c) => Math.abs(a[0]-fx_) - Math.abs(c[0]-fx_));
    if (!cands.length) continue;
    const [x,y] = cands[0];
    const e = makeEnemy(p.t, x, y, {rx:x, ry:y});
    e.frozenPiece = true; e.armyPiece = true; e.label = p.t==='K' ? 'Rei do Exército' : null;
    if (p.t==='P') e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp*.6));
    e.mods = e.mods.filter(m => m!=='submerge');
    e.intent = {kind:'wait', frozen:true};
    S.enemies.push(e);
    burst(x, y, '#cfe6f5', 6);
  }
  S.timeStop = TIME_STOP + 1 + atlasRank('aArmyTurns') + (atlasRank('kWinter') ? 2 : 0);   // +1: the step onto the board already spends this turn
  S.shattered = []; S.armyOpening = O.name; S.floorCleared = false;
  refreshDanger();
  fx.shake = Math.max(fx.shake, 6);
  showBanner('Exército Congelado', `${O.name}: ${TIME_STOP} turnos para estilhaçar peças. Quando o gelo derreter, elas voltam, e só as estilhaçadas deixam saque.`);
  log(`Exército Congelado: ${O.name}. ${TIME_STOP} turnos até o gelo derreter.`);
}
// a frozen piece destroyed by you shatters: it leaves the board until the ice melts, marked for loot
function shatterPiece(e){
  S.enemies = S.enemies.filter(o => o!==e);
  e.marked = true; S.shattered.push(e);
  burst(e.x, e.y, '#cfe6f5', 22); fx.shake = Math.max(fx.shake, 4);
  floatText(e.x, e.y-0.3, 'estilhaçado', '#cfe6f5');
  log(`${enemyName(e)} foi estilhaçado. Volta quando o gelo derreter, e aí pode deixar saque.`);
}
// end of each enemy phase: count down; at zero the army wakes and the shattered pieces come back
function frozenTick(){
  if (!(S.timeStop>0)) return;
  S.timeStop--;
  if (S.timeStop>0) return;
  for (const e of S.enemies) e.frozenPiece = false;
  for (const e of S.shattered || []){
    const spots = [];
    for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (!occupied(x,y) && !isLava(x,y) && !isPit(x,y)) spots.push([x,y]);
    spots.sort((a,c) => cheb(a[0],a[1],e.x,e.y) - cheb(c[0],c[1],e.x,e.y));
    if (!spots.length) continue;
    [e.x, e.y] = spots[0]; e.rx = e.x; e.ry = e.y;
    e.hp = e.maxHp; e.frozenPiece = false; e.intent = null;
    S.enemies.push(e); burst(e.x, e.y, '#e3b456', 14);
  }
  const n = (S.shattered || []).length;
  S.shattered = [];
  showBanner('O gelo derreteu', n ? `O exército despertou. ${n} ${n===1 ? 'peça estilhaçada voltou' : 'peças estilhaçadas voltaram'}, marcadas para deixar saque.` : 'O exército despertou.');
  log(`O gelo derreteu. ${n} ${n===1?'peça marcada':'peças marcadas'} para saque.`);
}
// loot for army pieces: only the marked ones, and better than usual; the marked King also gives a Seal
function armyLoot(e){
  if (!e.marked) return;
  if (e.type==='K'){
    HERO.checkSeals = (HERO.checkSeals||0) + 1;
    S.items.push({x:e.x, y:e.y, item:genItem(true)});
    floatText(e.x, e.y-0.5, '+1 Selo de Xeque', '#cfe6f5');
    log('O Rei marcado caiu: +1 Selo de Xeque.');
  } else if (rnd() < (e.type==='P' ? .3 : .65) + .1*atlasRank('aMarked')) S.items.push({x:e.x, y:e.y, item:genItem(e.type==='Q' || e.type==='R')});
}

/* ---------- Partida Congelada: puzzle runtime ---------- */
// resolves when the puzzle ends; stepping on the frozen board opens it through the loot queue
function frozenPlay(en){
  return new Promise(resolve => {
    const P = mateById(en.frozen), board = chParse(P.fen);
    let hero = board.findIndex(p => p && p.c==='w' && p.t===S.cls);
    if (hero<0) hero = chKing(board, 'w');
    board[hero] = {...board[hero], hero:true};
    S.chess = {P, board, left:P.n, sel:null, last:null, hints:0, busy:false, at:[en.x,en.y], resolve, hintMove:null};
    S.phase = 'chess'; hover = null; $('tip').hidden = true;
    showBanner('Partida Congelada', `${P.name}: dê xeque-mate em ${P.n} ${P.n===1 ? 'lance' : 'lances'}.`);
    log(`Partida Congelada: ${P.name}. Mate em ${P.n}.`);
    updateUI();
  });
}
const chessTargets = () => { const c = S.chess; return c && c.sel!=null ? chLegal(c.board,'w').filter(m => m.from===c.sel) : []; };
async function chessClick(x, y){
  const c = S.chess; if (!c || c.busy || x<0 || y<0 || x>7 || y>7) return;
  const sq = y*8+x, mv = chessTargets().find(m => m.to===sq);
  if (mv){ await chessPlay(mv); return; }
  const p = c.board[sq];
  c.sel = p && p.c==='w' ? sq : null;
  updateUI();
}
async function chessPlay(m){
  const c = S.chess; c.busy = true; c.sel = null; c.hintMove = null;
  c.board = chMake(c.board, m); c.last = m; c.left--;
  updateUI();
  const replies = chLegal(c.board, 'b');
  if (!replies.length) return chessEnd(chInCheck(c.board,'b') ? 'win' : 'stale');
  if (c.left<=0){ await sleep(400); return chessEnd('fail'); }
  await sleep(reduce ? 150 : 500);
  if (S.chess!==c) return;
  const r = chDefend(c.board, c.left);
  c.board = chMake(c.board, r); c.last = r; c.busy = false;
  if (!chLegal(c.board,'w').length) return chessEnd('fail');
  updateUI();
}
// 1st hint: the pattern's idea; 2nd: which piece; 3rd: the whole move
function chessHint(){
  const c = S.chess; if (!c || c.busy) return;
  c.hints++;
  if (c.hints>=2){ const m = chForce(c.board, c.left); if (m){ c.hintMove = c.hints>=3 ? m : {from:m.from}; c.sel = m.from; } }
  updateUI();
}
function chessGiveUp(){ const c = S.chess; if (c && !c.busy) chessEnd('fail'); }
async function chessEnd(result){
  const c = S.chess; c.busy = true; c.result = result; updateUI();
  await sleep(reduce ? 200 : 700);
  if (result==='win'){
    const lines = frozenReward(c);
    await openModal({title:'Xeque-mate!', body:`<p class="mtext">${c.P.name} resolvido${c.hints ? ` com ${c.hints} ${c.hints===1?'dica':'dicas'}` : ' sem dicas'}.</p><ul class="mtext">${lines.map(l => `<li>${l}</li>`).join('')}</ul>`,
      note:'O saque está no chão, ao lado do tabuleiro de gelo.', actions:[{label:'Voltar ao andar', primary:true, value:'ok'}]});
  } else {
    await openModal({title:'O exército desperta', body:`<p class="mtext">${result==='stale' ? 'Afogamento não é mate.' : 'O mate não veio a tempo.'} As peças pretas ganham vida ao redor do tabuleiro de gelo.</p>`,
      actions:[{label:'Voltar ao andar e lutar', primary:true, value:'ok'}]});
    thawArmy(c);
  }
  S.chess = null; S.phase = 'modal';
  updateUI();
  c.resolve();
}
// returns the lines shown in the result window; items go on the ground around the frozen board (with their light beams)
function frozenReward(c){
  const lines = [];
  HERO.grimoire = HERO.grimoire || {};
  if (!c.P.problem){
    const first = !HERO.grimoire[c.P.id];
    HERO.grimoire[c.P.id] = true;
    if (first){ lines.push(`<b>Grimório:</b> ${c.P.name} aprendido. ${c.P.power}`); log(`Grimório: ${c.P.name} aprendido.`); }
  }
  const seals = c.P.n>=4 ? 2 : 1;
  HERO.checkSeals = (HERO.checkSeals||0) + seals;
  lines.push(`+${seals} ${seals===1 ? 'Selo' : 'Selos'} de Xeque`);
  if (!c.hints){ const r = pick(Object.keys(RUNES)); HERO.runes = HERO.runes || {}; HERO.runes[r] = (HERO.runes[r]||0) + 1; lines.push(`${RUNES[r].name} (bônus por não usar dicas)`); }
  const items = [rollItem(c.hints>=2 ? 'magic' : 'rare', areaIlvl())];
  if (c.P.problem) items.push(rollItem(c.P.n>=4 || !c.hints ? 'rare' : 'magic', areaIlvl() + (c.P.n>=4 ? 2 : 0)));
  const spots = [[c.at[0],c.at[1]], ...ALL.map(([dx,dy]) => [c.at[0]+dx, c.at[1]+dy])].filter(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !S.items.some(i => i.x===x && i.y===y));
  for (const it of items){ const s = spots.shift() || c.at; S.items.push({x:s[0], y:s[1], item:it}); lines.push(`<span class="rc-${it.rar}">${esc(it.name)}</span> no chão`); }
  log(`Xeque-mate: ${c.P.name}.`);
  burst(c.at[0], c.at[1], '#cfe6f5', 30); fx.rings.push({x:c.at[0], y:c.at[1], t:0, c:'207,230,245'});
  return lines;
}
// failure: the black army wakes up on the dungeon floor around the board
function thawArmy(c){
  const val = {Q:5, R:4, B:3, N:3, K:2, P:1};
  const pieces = c.board.filter(p => p && p.c==='b').map(p => p.t).sort((a,b) => val[b]-val[a]).slice(0,6);
  const [cx,cy] = c.at, spots = [];
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (cheb(x,y,cx,cy)<=2 && !occupied(x,y) && !isLava(x,y) && !isPit(x,y)) spots.push([x,y]);
  spots.sort((a,b) => cheb(a[0],a[1],cx,cy) - cheb(b[0],b[1],cx,cy));
  pieces.forEach((t, i) => {
    const s = spots.shift(); if (!s) return;
    const e = makeEnemy(t, s[0], s[1], {rx:cx, ry:cy});
    if (i===0){ e.elite = true; e.hp = e.maxHp = e.maxHp*2; e.dmg += 1; }
    e.intent = {kind:'wait'};
    S.enemies.push(e); burst(s[0], s[1], '#cfe6f5', 12);
  });
  S.floorCleared = false;
  log('O exército congelado despertou.');
}

/* ---------- The Rift (Fenda) ---------- */
// a short burst: 5 turns of growing waves (max 8 spawns alive); every 3 kills nearby add a turn, at most +3 in total
function openRift(en){
  S.rift = {x:en.x, y:en.y, turns:5 + atlasRank('aRift') - (atlasRank('kCollapse') ? 2 : 0), ext:0, kills:0, wave:0};
  S.floorCleared = false;
  showBanner('A Fenda se abriu', `5 turnos de ondas cada vez maiores (até ${riftMaxAlive()} crias ao mesmo tempo). Crias deixam Estilhaços; a cada 3 abates perto dela, +1 turno (até +3).`);
  log('A Fenda se abriu.');
  fx.rings.push({x:en.x, y:en.y, t:0, c:'180,140,255'}); fx.shake = Math.max(fx.shake, 8);
  riftSpawn(Math.min(3, riftMaxAlive()-1));
}
function riftSpawn(n){
  const r = S.rift; if (!r) return;
  const spots = [];
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (cheb(x,y,r.x,r.y)<=2 && !occupied(x,y) && !isLava(x,y) && !isPit(x,y) && cheb(x,y,S.player.x,S.player.y)>1) spots.push([x,y]);
  n = Math.min(n, riftMaxAlive() - S.enemies.filter(e => e.rift).length);
  for (const [x,y] of shuffle(spots).slice(0, Math.max(0,n))){
    const pool = eventPower()<4 ? ['P','P','P','N'] : eventPower()<10 ? ['P','P','N','B'] : ['P','P','N','B','R'];
    const e = makeEnemy(pick(pool), x, y, {rx:r.x, ry:r.y});
    e.rift = true; e.label = 'Cria da Fenda'; e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp*.8));
    e.mods = e.mods.filter(m => m!=='submerge');
    S.enemies.push(e); burst(x, y, '#b48cff', 12);
  }
}
function riftTick(){
  const r = S.rift; if (!r) return;
  r.turns--;
  if (r.turns<=0){ closeRift(); return; }
  r.wave++;
  riftSpawn(Math.round((1 + r.wave*(.5 + eventPower()/30)) * (atlasRank('kCollapse') ? 2 : 1)));
}
function closeRift(){
  const gone = S.enemies.filter(e => e.rift);
  S.enemies = S.enemies.filter(e => !e.rift);
  for (const e of gone) burst(e.x, e.y, '#b48cff', 14);
  showBanner('A Fenda se fechou', `+${S.riftShardsRun||0} Estilhaços da Fenda nesta abertura.`);
  log(`A Fenda se fechou. Estilhaços: ${HERO.riftShards||0}.`);
  S.rift = null;
}
function riftKill(e){
  const r = S.rift; if (!r) return;
  if (e.rift){
    const n = Math.max(1, Math.round((1 + (e.type==='R' || e.type==='Q' ? 1 : 0)) * (S.mapAff.has('rShards') ? 1.5 : 1) * (1 + .1*atlasRank('aShards'))));
    HERO.riftShards = (HERO.riftShards||0) + n; S.riftShardsRun = (S.riftShardsRun||0) + n;
    floatText(e.x, e.y-0.5, `+${n} estilhaço${n>1?'s':''}`, '#b48cff');
  }
  if (cheb(e.x,e.y,r.x,r.y)<=3){
    r.kills++;
    if (r.kills%3===0 && r.ext<3){ r.ext++; r.turns++; floatText(r.x, r.y-0.6, '+1 turno', '#e6d6ff'); }
  }
}

/* ---------- Uber boss: Rainha Suprema ---------- */
const UBER_COST = {shards:80, seals:2};
const UBER_UNIQUES = [
  {slot:'arma', name:'Cetro da Suprema', affixes:[{k:'execute'},{k:'dmg',v:4},{k:'crit',v:15}]},
  {slot:'armadura', name:'Manto da Coroa Partida', affixes:[{k:'aegisFirst'},{k:'hp',v:12},{k:'block',v:12}]},
  {slot:'anel', name:'Anel da Fenda', affixes:[{k:'chain'},{k:'dmg',v:2},{k:'mf',v:30}]},
  {slot:'botas', name:'Ferraduras do Corcel Supremo', affixes:[{k:'kingStep'},{k:'hp',v:10},{k:'block',v:10}]},
  {slot:'elmo', name:'Ameias Gêmeas', affixes:[{k:'lineGuard'},{k:'resFire',v:25},{k:'resCold',v:25},{k:'resLight',v:25}]},
  {slot:'anel', name:'Coroa do Peão Supremo', affixes:[{k:'fury'},{k:'crit',v:15},{k:'eliteDmg',v:25}]}
];
const canUber = h => (h.riftShards||0) >= UBER_COST.shards && (h.checkSeals||0) >= UBER_COST.seals;

/* ---------- Maré de Sangue (Helltide-like) ----------
   Active during the first 45 minutes of every hour. An expedition started during the tide keeps it to the end:
   tougher enemies, Embers from every kill, Torment Chests that cost Embers, and a roaming Herald. */
const TIDE_COST_BASE = 30;
const tideCost = () => TIDE_COST_BASE - 10*atlasRank('aChestCost');
const tideActive = (d = new Date()) => d.getMinutes() < 45;
// when it ends (if active) or next starts (if not)
const tideBoundary = (d = new Date()) => { const n = new Date(d); n.setSeconds(0,0); if (d.getMinutes() < 45) n.setMinutes(45); else { n.setMinutes(0); n.setHours(n.getHours()+1); } return n; };
const hhmm = d => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
function placeTide(){
  if (!S.tide) return;
  let spot = null;
  for (let g=0; g<200 && !spot; g++){
    const x = rint(W), y = 1+rint(H-3);
    if (!occupied(x,y) && !S.terrain.has(key(x,y)) && !S.items.some(i => i.x===x && i.y===y) && cheb(x,y,S.player.x,S.player.y)>2) spot = [x,y];
  }
  if (spot) S.items.push({x:spot[0], y:spot[1], tideChest:true});
  if (rnd() < .35 + .1*atlasRank('aHerald')){
    const cand = shuffle(S.enemies.filter(e => !e.boss && !e.elite && e.type!=='P'))[0];
    if (cand){
      cand.elite = true; cand.herald = true; cand.label = 'Arauto da Maré';
      cand.hp = cand.maxHp = Math.round(cand.maxHp*3); cand.dmg += 2;
      for (const m of shuffle(ELITE_MODS.filter(m => !cand.mods.includes(m))).slice(0,2)) cand.mods.push(m);
      log('Um Arauto da Maré ronda este andar.');
    }
  }
}
/* The tide rises on the board: every 3 turns Blood Pools spread (telegraphed a turn ahead).
   An enemy standing in blood hits +1 and heals 1 per turn, but a kill made on a pool gives double Embers.
   Kills fill the Tide's Wrath; when it overflows a Herald rises from the blood and Blood Rain falls near you. */
const BLOOD_MAX = () => Math.round(W*H/5);
function planTide(){
  S.tideRise = null; S.bloodRain = S.bloodRain && S.bloodRain.pending ? S.bloodRain : null;
  if (!S.tide || !S.enemies.length || S.turn%3!==2) return;
  const pools = [...S.terrain.values()].filter(t => t==='blood').length;
  if (pools >= BLOOD_MAX()) return;
  const cand = [];
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (!isWall(x,y) && !terrainAt(x,y) && !isPlayer(x,y) && !(S.stairs && S.stairs.x===x && S.stairs.y===y)) cand.push([x,y]);
  // the tide favours squares near enemies, so the trade-off shows up where the fight is
  cand.sort((a,b) => Math.min(...S.enemies.map(e => cheb(a[0],a[1],e.x,e.y))) - Math.min(...S.enemies.map(e => cheb(b[0],b[1],e.x,e.y))) + (rnd()-.5)*3);
  S.tideRise = cand.slice(0, 3 + rint(3));
}
function resolveTide(){
  if (S.tideRise){
    for (const [x,y] of S.tideRise) if (!isWall(x,y) && !terrainAt(x,y)){ S.terrain.set(key(x,y), 'blood'); burst(x, y, '#9e1a12', 10); }
    log('A Maré subiu: poças de sangue se espalham.');
    S.tideRise = null;
  }
  if (S.bloodRain){
    const dmg = 2 + Math.floor(S.lvl/6);
    for (const [x,y] of S.bloodRain.sq){
      burst(x, y, '#c41e14', 14); fx.rings.push({x, y, t:0, c:'200,30,20'});
      if (isPlayer(x,y)) hurtPlayer(dmg, `A Chuva de Sangue te atingiu (${dmg}).`);
      const a = allyAt(x,y); if (a) damageAlly(a, dmg);
    }
    S.bloodRain = null;
  }
}
// end of each enemy turn: enemies in blood regenerate
function bloodRegen(){ for (const e of S.enemies) if (terrainAt(e.x,e.y)==='blood' && e.hp<e.maxHp) healEnemy(e, 1); }
function tideOverflow(){
  S.tideIra = 0; S.tideGoal = (S.tideGoal||8) + 4;
  const pools = [...S.terrain].filter(([k,t]) => t==='blood').map(([k]) => unkey(k)).filter(([x,y]) => !occupied(x,y));
  const spot = pick(pools.length ? pools : [[rint(W), rint(Math.ceil(H/2))]]);
  if (spot && !occupied(spot[0],spot[1])){
    const t = pick(['N','B','R']), e = makeEnemy(t, spot[0], spot[1]);
    e.elite = true; e.herald = true; e.label = 'Arauto da Maré';
    e.hp = e.maxHp = Math.round(e.maxHp*3); e.dmg += 2;
    for (const m of shuffle(ELITE_MODS.filter(m => !e.mods.includes(m))).slice(0,2)) e.mods.push(m);
    e.intent = {kind:'wait'};
    S.enemies.push(e); burst(spot[0], spot[1], '#ff4a3a', 26);
  }
  // blood rain: a few squares around you, hit next enemy turn
  const near = [];
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (!isWall(x,y) && cheb(x,y,S.player.x,S.player.y)<=2) near.push([x,y]);
  S.bloodRain = {sq: shuffle(near).slice(0, 4 + rint(3)), pending:true};
  refreshDanger();
  fx.shake = Math.max(fx.shake, 10);
  showBanner('A Maré transborda', 'Um Arauto se ergue do sangue, e uma Chuva de Sangue vai cair perto de você.');
  log('A Maré transbordou: um Arauto surgiu e uma Chuva de Sangue se aproxima.');
}
function tideKill(e){
  if (!S.tide) return;
  const onBlood = terrainAt(e.x,e.y)==='blood';
  const n = Math.round((e.herald ? 15 : e.boss ? 8 : e.elite ? 3 : 1) * (1 + .15*atlasRank('aEmbers')) * (onBlood ? 2 : 1));
  if (onBlood) floatText(e.x, e.y-0.7, 'sangue: brasas x2', '#ff6b4a');
  if (!e.herald){ S.tideIra = (S.tideIra||0) + (e.elite ? 3 : 1); if (S.tideIra >= (S.tideGoal||8)) tideOverflow(); }
  HERO.embers = (HERO.embers||0) + n; S.embersRun = (S.embersRun||0) + n;
  if (n>1) floatText(e.x, e.y-0.5, `+${n} brasas`, '#ff6b4a');
  if (e.herald){ S.items.push({x:e.x, y:e.y, item:rollItem('rare', areaIlvl()+2)}); dropRune(e); log('O Arauto caiu: +15 brasas, um item raro e uma runa.'); }
}
// returns false when there are not enough Embers (the chest stays on the floor)
function openTideChest(en){
  const cost = tideCost();
  if ((HERO.embers||0) < cost){
    floatText(en.x, en.y-0.4, `precisa de ${cost} brasas`, '#ff6b4a');
    log(`O Baú Tormentoso pede ${cost} Brasas de Sangue. Você tem ${HERO.embers||0}.`);
    return false;
  }
  HERO.embers -= cost;
  S.pendingLoot.push({item: genItem(true)});
  if (rnd()<.25){ const U = pick(classUniques(S.cls)); if (U) S.pendingLoot.push({item: makeUnique(U)}); }
  if (rnd()<.3) dropRune(en);
  burst(en.x, en.y, '#ff4a3a', 30); fx.rings.push({x:en.x, y:en.y, t:0, c:'255,80,60'});
  log(`Baú Tormentoso aberto (−${cost} brasas).`);
  return true;
}

/* ---------- Rival (nemesis) ----------
   One rival per hero, of your own class. It may show up once per expedition; beat it for its gear.
   If it kills you, it grows stronger. */
const RIVAL_NAMES = ['Aldric','Bertrand','Casimir','Dorian','Edmundo','Fausto','Gaspar','Heitor','Isolda','Jocasta','Leonor','Morgana','Ulrico','Vesna'];
const RIVAL_EPITHETS = ['o Implacável','a Lâmina Cinza','o Usurpador','a Sombra da Torre','o Sem-Rei','a Coroa Quebrada','o Carrasco','a Dama de Ferro','o Gambito Negro','a Última Fileira'];
function heroRival(h){ if (!h.rival) h.rival = {name:`${pick(RIVAL_NAMES)} ${pick(RIVAL_EPITHETS)}`, tier:1, beaten:0, kills:0}; return h.rival; }
function placeRival(){
  if (['daily','uber'].includes(S.exp.kind) || S.rivalMet || S.bossId || rnd()>=.15) return;
  const R = heroRival(HERO);
  let spot = null;
  for (let g=0; g<200 && !spot; g++){ const x = rint(W), y = rint(Math.ceil(H/2)); if (!occupied(x,y) && !isLava(x,y) && !isPit(x,y)) spot = [x,y]; }
  if (!spot) return;
  const e = makeEnemy(HERO.cls, spot[0], spot[1]);
  e.rival = true; e.elite = true; e.label = R.name;
  e.hp = e.maxHp = Math.round(EDEF[HERO.cls].hp * enemyScale() * (3 + R.tier));
  e.dmg += 1 + R.tier;
  for (const m of shuffle(ELITE_MODS.filter(m => !e.mods.includes(m))).slice(0, Math.min(3, 1 + R.tier))) e.mods.push(m);
  S.enemies.push(e); S.rivalMet = true;
  S.eventNote = [`${R.name} te encontrou`, `Seu rival, nível ${R.tier}. Derrote-o e fique com o equipamento dele.`];
  log(`${R.name}, seu rival, está neste andar.`);
}
function rivalKill(e){
  if (!e.rival) return;
  const R = heroRival(HERO);
  S.items.push({x:e.x, y:e.y, item:rollItem('rare', areaIlvl()+3)});
  S.pendingLoot.push({item:rollItem(rnd()<.5 ? 'rare' : 'magic', areaIlvl()+3)});
  dropRune(e);
  const g = 40*R.tier; HERO.gold += g; S.goldFound += g;
  log(`${R.name} caiu. Você ficou com o equipamento dele (+${g} de ouro).`);
  HERO.rival = {name:`${pick(RIVAL_NAMES)} ${pick(RIVAL_EPITHETS)}`, tier:R.tier+1, beaten:R.beaten+1, kills:0};
}

/* ---------- Uber bosses ---------- */
const UBERS = {
  queen:{name:'Rainha Suprema', biome:'crypt', special:'Alterna a Cruz de 4 casas em volta de você e a Coroa Estilhaçada (as 8 linhas a partir dela). Guarda Real com 2 peões.'},
  knight:{name:'Corcel Supremo', biome:'swamp', special:'Cerco Supremo: o anel a 2 casas de você e a sua casa. Fica exausto só depois de 4 fugas.'},
  twins:{name:'Torres Supremas', biome:'forge', special:'Muralha Estrelada: cada torre atinge as 8 linhas a partir dela, alternando entre as duas.'},
  pawn:{name:'Peão Supremo', biome:'cathedral', special:'Avanço Supremo: as três fileiras inteiras à frente dele.'}
};

/* ---------- Atlas completion: every biome x tier finished for the first time gives 1 Atlas point (see tree.js) ---------- */
function atlasComplete(map){
  const k = `${map.biome}-${map.tier}`;
  HERO.atlas = HERO.atlas || {};
  if (HERO.atlas[k]) return;
  HERO.atlas[k] = true;
  log(`Atlas: ${BIOMES[map.biome].name}, nível ${map.tier}, concluído. +1 ponto de Atlas.`);
}

/* ---------- Map currencies ----------
   Endgame drops (after Act 4) used in the camp to reshape a map before opening it. */
const CURRENCY = {
  reforja:{name:'Fragmento de Reforja', short:'Reforja', d:'Sorteia de novo todos os afixos do mapa; o nível fica.', w:45, c:'#cfc6b6'},
  lacre:{name:'Lacre', short:'Lacre', d:'Remove um afixo de dificuldade.', w:25, c:'#a9bfd6'},
  fortuna:{name:'Pedra de Fortuna', short:'Fortuna', d:'Adiciona um afixo de recompensa (até 3).', w:20, c:'#ecd36a'},
  ascensao:{name:'Selo Ascendente', short:'Ascensão', d:'Sobe o mapa 1 nível (até 10) e adiciona um afixo de dificuldade.', w:10, c:'#f08a3c'}
};
function rollCurrency(){ let r = rnd()*100; for (const [k,c] of Object.entries(CURRENCY)){ r -= c.w; if (r<0) return k; } return 'reforja'; }
function currencyDrop(e){
  if (HERO.actDone<4 || S.exp.kind==='daily') return;
  const mult = (S.exp.kind==='map' ? 1.5 : 1) * (1 + .2*atlasRank('aCurrency'));
  const n = e.boss ? 1 + (S.exp.kind==='map' ? 1 : 0) + atlasRank('aBossCur') : (rnd() < (e.elite ? .15 : .02)*mult ? 1 : 0);
  for (let i=0; i<n; i++){
    const spot = [[e.x,e.y], ...ALL.map(([dx,dy]) => [e.x+dx,e.y+dy])].find(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !S.items.some(it => it.x===x && it.y===y));
    if (spot) S.items.push({x:spot[0], y:spot[1], currency:rollCurrency()});
  }
}
// returns the message shown in the camp
function applyCurrency(h, map, k){
  h.currency = h.currency || {};
  if (!h.currency[k]) return 'Você não tem essa moeda.';
  const keys = Object.keys(MAP_AFFIXES);
  const pen = map.affixes.filter(a => !isRewardAffix(a)), rew = map.affixes.filter(isRewardAffix);
  if (k==='reforja') map.affixes = makeMap(map.tier).affixes;
  else if (k==='lacre'){ if (!pen.length) return 'Este mapa não tem afixos de dificuldade.'; const rm = pick(pen); map.affixes = map.affixes.filter(a => a!==rm); }
  else if (k==='fortuna'){
    const add = shuffle(keys.filter(a => isRewardAffix(a) && !rew.includes(a)))[0];
    if (rew.length>=3 || !add) return 'Este mapa já tem o máximo de recompensas.';
    map.affixes.push(add);
  } else if (k==='ascensao'){
    if (map.tier>=10) return 'Este mapa já está no nível máximo.';
    map.tier++;
    const add = shuffle(keys.filter(a => !isRewardAffix(a) && !pen.includes(a)))[0];
    if (add && pen.length<4) map.affixes.push(add);
  }
  h.currency[k]--;
  return `${CURRENCY[k].name} usado em ${mapName(map)}.`;
}
