/* Rei Caído — map events (Frozen Match, the Rift) and the uber boss */

/* ---------- Placement ---------- */
// event size follows the difficulty: area level, and each Torment level counts as +3
const eventPower = () => S.lvl + 3*(S.torment||0);
const armySize = () => Math.max(4, Math.min(16, Math.round(3 + eventPower()*.45)));
const riftMaxAlive = () => Math.max(3, Math.min(8, Math.round(2 + eventPower()/4)));
// once it rises, the tide lasts 1 to 3 floors in a row (it comes and goes like a wave)
function startTide(cont){
  S.tide = true;
  if (!cont) S.tideLeft = rint(3) + atlasRank('aTideLen');
  const more = S.tideLeft ? $t(` Ela deve durar mais ${S.tideLeft} ${S.tideLeft===1?'andar':'andares'}.`, ` It should last ${S.tideLeft} more ${S.tideLeft===1?'floor':'floors'}.`) : $t(' Ela recua depois deste andar.', ' It recedes after this floor.');
  log(cont ? $t('A Maré de Sangue continua.', 'The Blood Tide continues.') : $t('A Maré de Sangue sobe.', 'The Blood Tide rises.'));
  S.eventNote = [cont ? $t('A Maré continua', 'The Tide continues') : $t('Maré de Sangue', 'Blood Tide'), $t('Poças de sangue sobem: inimigos nelas batem mais forte, mas abates ali dão Brasas em dobro.', 'Blood pools rise: enemies in them hit harder, but kills there give double Embers.') + more];
}
// how many moves the checkmate takes follows progress: 1 in Act 1, up to 3 or 4 in Torment and maps
function puzzleDepths(){
  const p = S.lvl + 3*(S.torment||0);
  return p<=3 ? [1] : p<=6 ? [1,2] : p<=9 ? [2] : p<=12 ? [2,3] : p<=18 ? [3] : [3,4];
}
function placeEvent(force){
  if (['daily','uber','pinnacle','tutorial'].includes(S.exp.kind)) return;
  // Atlas keystone: every map floor has the tide, on top of any other event
  if (S.exp.kind==='map' && atlasRank('kTide')) startTide(true);
  else if (S.tideLeft>0){ S.tideLeft--; startTide(true); }
  if (S.mapAff.has('rHorde') && !force){ startHorde(); return; }
  const chance = S.exp.kind==='map' ? .6 + .1*atlasRank('aEvent') : S.exp.kind==='abyss' ? .45 : .35;
  if (!force && rnd()>=chance && !S.mapAff.has('rEvent')) return;
  let spot = null;
  for (let g=0; g<200 && !spot; g++){
    const x = rint(W), y = 1+rint(H-3);
    if (!occupied(x,y) && !S.terrain.has(key(x,y)) && !S.items.some(i => i.x===x && i.y===y) && cheb(x,y,S.player.x,S.player.y)>2) spot = [x,y];
  }
  if (!spot) return;
  // the Blood Tide is one of the floor events, from Act 2 on (it makes the floor harder)
  const tideOk = contentLvl()>=4 && !S.tide;
  // the Horde: endgame content (maps, Torment, the end of the campaign)
  const hordeOk = contentLvl()>=10;
  const kind = force || (hordeOk && rnd()<.25 + .1*atlasRank('aHordeW') ? 'horde' : tideOk && rnd()<.25 ? 'tide' : rnd() < Math.min(.9, Math.max(.1, .5 - .15*atlasRank('aRiftW'))) ? 'frozen' : 'rift');
  if (kind==='tide'){ startTide(); return; }
  if (kind==='horde'){ startHorde(); return; }
  if (kind==='frozen' && frozenMode()==='army'){
    S.items.push({x:spot[0], y:spot[1], frozenArmy:pick(OPENINGS).id});
    // the army replaces part of the floor's usual enemies
    const regular = S.enemies.filter(e => !e.elite && !e.boss);
    for (const e of shuffle(regular).slice(0, Math.floor(regular.length * armySize()/32))) S.enemies = S.enemies.filter(o => o!==e);
    log($t('Um tabuleiro congelado brilha neste andar.', 'A frozen board glows on this floor.'));
    S.eventNote = [$t('Exército Congelado', 'Frozen Army'), $t('Um tabuleiro de gelo brilha neste andar. Pise nele para revelar o exército.', 'An ice board glows on this floor. Step on it to reveal the army.')];
  } else if (kind==='frozen'){
    const depths = puzzleDepths(), maxN = Math.max(...depths);
    const unknown = MATES.filter(m => !(HERO.grimoire||{})[m.id] && m.n<=maxN);
    const pool = PROBLEMS.filter(m => depths.includes(m.n));
    // mostly the longer problems; now and then a pattern you haven't learned yet (it teaches a Grimório power)
    const P = unknown.length && (rnd()<.35 || !pool.length) ? pick(unknown) : pick(pool.length ? pool : PROBLEMS);
    S.items.push({x:spot[0], y:spot[1], frozen:P.id});
    log($t('Um tabuleiro congelado brilha neste andar.', 'A frozen board glows on this floor.'));
    S.eventNote = [$t('Partida Congelada', 'Frozen Match'), $t('Um tabuleiro de gelo brilha neste andar. Pise nele para jogar.', 'An ice board glows on this floor. Step on it to play.')];
  } else {
    S.items.push({x:spot[0], y:spot[1], riftGate:true});
    log($t('Uma fenda pulsa neste andar.', 'A rift pulses on this floor.'));
    S.eventNote = [$t('Uma Fenda pulsa', 'A Rift pulses'), $t('Pise no rasgo roxo para abri-la. Crias surgem e deixam Estilhaços.', 'Step on the purple tear to open it. Spawn appear and drop Shards.')];
  }
}

/* ---------- The Horde ----------
   Dozens of frail minions that die to one blow: the floor where an on-kill build runs wild.
   Clearing the whole horde drops a chest; doing it within the turn par adds a rare item. */
function startHorde(){
  const st = stats();
  // fewer regular enemies so the horde has room
  const regular = S.enemies.filter(o => !o.elite && !o.boss && !o.group);
  for (const o of shuffle(regular).slice(0, Math.floor(regular.length/2))) S.enemies = S.enemies.filter(q => q!==o);
  const want = Math.round(W*H*.3*(1 + .1*atlasRank('aHordeSize'))); let n = 0;
  for (let g=0; g<600 && n<want; g++){
    const x = rint(W), y = rint(H-2);
    if (occupied(x,y) || terrainAt(x,y) || cheb(x,y,S.player.x,S.player.y)<=2 || S.items.some(i => i.x===x && i.y===y)) continue;
    const m = makeEnemy('P', x, y);
    m.fodder = true; m.horde = true; m.label = $t('Lacaio da Horda', 'Horde Minion'); m.mods = [];
    m.hp = m.maxHp = Math.max(1, Math.floor(st.dmg*.8)); m.dmg = Math.max(1, Math.ceil(m.dmg*.5));
    S.enemies.push(m); n++;
  }
  if (!n) return;
  S.horde = {total:n, killed:0, start:1, par:Math.ceil(n/2)+2+2*atlasRank('aHordePar')};   // placed while the floor is built: it starts on turn 1
  log($t(`Uma Horda de ${n} lacaios toma este andar. Limpe tudo em até ${S.horde.par} turnos para um bônus.`, `A Horde of ${n} minions takes this floor. Clear it all within ${S.horde.par} turns for a bonus.`));
  S.eventNote = [$t('Horda', 'Horde'), $t(`${n} lacaios frágeis. Limpe a horda em até ${S.horde.par} turnos para um bônus.`, `${n} frail minions. Clear the horde within ${S.horde.par} turns for a bonus.`)];
}
// a pack of Horde minions around the player (used by the Eternal Horde)
function hordeRespawn(n){
  const st = stats(); let made = 0;
  for (let g=0; g<400 && made<n; g++){
    const x = rint(W), y = rint(H-2);
    if (occupied(x,y) || terrainAt(x,y) || cheb(x,y,S.player.x,S.player.y)<=1 || S.items.some(i => i.x===x && i.y===y)) continue;
    const m = makeEnemy('P', x, y);
    m.fodder = true; m.horde = true; m.label = $t('Lacaio da Horda', 'Horde Minion'); m.mods = [];
    m.hp = m.maxHp = Math.max(1, Math.floor(st.dmg*.8)); m.dmg = Math.max(1, Math.ceil(m.dmg*.5));
    S.enemies.push(m); made++;
  }
  return made;
}
function hordeKill(e){
  const h = S.horde; if (!h || !e.horde) return;
  h.killed++;
  const ar = k => atlasRank(k);
  if (ar('aHordeHeal')) heal(ar('aHordeHeal'));
  if (ar('aHordeAct') && h.killed%10===0){ S.actions++; floatText(S.player.x, S.player.y-0.5, $t('+1 ação', '+1 action'), '#e3b456'); }
  if (ar('aHordeCdr') && (S.hordeCdrTurn||[0,0])[0]===S.turn && S.hordeCdrTurn[1]>=3){ /* capped this turn */ }
  else if (ar('aHordeCdr')){ S.hordeCdrTurn = [S.turn, ((S.hordeCdrTurn||[0,0])[0]===S.turn ? S.hordeCdrTurn[1] : 0) + 1]; for (const id in S.cds) S.cds[id] = Math.max(0, S.cds[id]-1); }
  if (ar('aHordeLoot') && rnd() < .03*ar('aHordeLoot')) S.items.push({x:e.x, y:e.y, item:genItem(false)});
  if (ar('kTsunami') && !S.blasting){ S.blasting = true; for (const [dx,dy] of ALL){ const o = enemyAt(e.x+dx, e.y+dy); if (o && o.horde) damageEnemy(o, 1, 'player'); } S.blasting = false; }
  if (h.killed < h.total) return;
  const fast = S.turn - h.start + 1 <= h.par;
  const spot = [[e.x,e.y], ...ALL.map(([dx,dy]) => [e.x+dx,e.y+dy])].find(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !S.items.some(i => i.x===x && i.y===y));
  if (spot) S.items.push({x:spot[0], y:spot[1], chest:true});
  if (atlasRank('aHordeChest')){ const s3 = ALL.map(([dx,dy]) => [e.x+dx,e.y+dy]).find(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !S.items.some(i => i.x===x && i.y===y)); if (s3) S.items.push({x:s3[0], y:s3[1], chest:true}); }
  if (fast && atlasRank('aHordeUnique')){ const U = pick(classUniques(S.cls)), s4 = ALL.map(([dx,dy]) => [e.x+dx,e.y+dy]).find(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !S.items.some(i => i.x===x && i.y===y)); if (U && s4) S.items.push({x:s4[0], y:s4[1], item:makeUnique(U)}); }
  else if (fast){ const s2 = ALL.map(([dx,dy]) => [e.x+dx,e.y+dy]).find(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !S.items.some(i => i.x===x && i.y===y)); if (s2) S.items.push({x:s2[0], y:s2[1], item:rollItem('rare', areaIlvl()+2)}); }
  showBanner($t('Horda destruída', 'Horde destroyed'), fast ? $t(`Em ${S.turn - h.start + 1} turnos: baú e um item raro de bônus.`, `In ${S.turn - h.start + 1} turns: a chest and a bonus rare item.`) : $t('Um baú surgiu.', 'A chest appeared.'));
  log(fast ? $t('Horda destruída a tempo: um baú e um item raro de bônus.', 'Horde destroyed in time: a chest and a bonus rare item.') : $t('Horda destruída: um baú surgiu.', 'Horde destroyed: a chest appeared.'));
  S.horde = null;
  if (atlasRank('kEternal')){ const n = hordeRespawn(Math.max(6, Math.floor(h.total/2))); if (n){ S.horde = {total:n, killed:0, start:S.turn+1, par:Math.ceil(n/2)+2+2*atlasRank('aHordePar')}; showBanner($t('A Horda Eterna', 'The Eternal Horde'), $t(`Uma segunda Horda de ${n} lacaios se ergue.`, `A second Horde of ${n} minions rises.`)); } }
}

/* ---------- Two versions of the frozen event, switchable in the camp ----------
   'army'  : a black army frozen in a classic opening; time stops for 3 turns to strike it, then it wakes.
   'puzzle': the hero and spectral pieces must deliver a checkmate in N moves (kept intact below). */
// the army version is kept in the code but switched off for now: only the checkmate version spawns
const frozenMode = () => 'puzzle';
const OPENINGS = [
  {id:'italiana', name:$t('Abertura Italiana', 'Italian Game'), fen:'r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R'},
  {id:'siciliana', name:$t('Defesa Siciliana, Najdorf', 'Sicilian Defense, Najdorf'), fen:'rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R'},
  {id:'francesa', name:$t('Defesa Francesa', 'French Defense'), fen:'rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPP2PPP/RNBQKBNR'},
  {id:'carokann', name:$t('Defesa Caro-Kann', 'Caro-Kann Defense'), fen:'rnbqkbnr/pp2pppp/2p5/3p4/3PP3/8/PPP2PPP/RNBQKBNR'},
  {id:'gambito', name:$t('Gambito da Dama Recusado', 'Queen\'s Gambit Declined'), fen:'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR'},
  {id:'espanhola', name:$t('Ruy López (Espanhola)', 'Ruy López (Spanish)'), fen:'r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R'}
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
    e.frozenPiece = true; e.armyPiece = true; e.label = p.t==='K' ? $t('Rei do Exército', 'King of the Army') : null;
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
  showBanner($t('Exército Congelado', 'Frozen Army'), $t(`${O.name}: ${TIME_STOP} turnos para estilhaçar peças. Quando o gelo derreter, elas voltam, e só as estilhaçadas deixam saque.`, `${O.name}: ${TIME_STOP} turns to shatter pieces. When the ice melts they come back, and only the shattered ones drop loot.`));
  log($t(`Exército Congelado: ${O.name}. ${TIME_STOP} turnos até o gelo derreter.`, `Frozen Army: ${O.name}. ${TIME_STOP} turns until the ice melts.`));
}
// a frozen piece destroyed by you shatters: it leaves the board until the ice melts, marked for loot
function shatterPiece(e){
  S.enemies = S.enemies.filter(o => o!==e);
  e.marked = true; S.shattered.push(e);
  if (atlasRank('aShatterHeal')) heal(2*atlasRank('aShatterHeal'));
  burst(e.x, e.y, '#cfe6f5', 22); fx.shake = Math.max(fx.shake, 4);
  floatText(e.x, e.y-0.3, $t('estilhaçado', 'shattered'), '#cfe6f5');
  log($t(`${enemyName(e)} foi estilhaçado. Volta quando o gelo derreter, e aí pode deixar saque.`, `${enemyName(e)} was shattered. It comes back when the ice melts, and then it can drop loot.`));
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
  showBanner($t('O gelo derreteu', 'The ice melted'), n ? $t(`O exército despertou. ${n} ${n===1 ? 'peça estilhaçada voltou' : 'peças estilhaçadas voltaram'}, marcadas para deixar saque.`, `The army awoke. ${n} ${n===1 ? 'shattered piece came back' : 'shattered pieces came back'}, marked to drop loot.`) : $t('O exército despertou.', 'The army awoke.'));
  log($t(`O gelo derreteu. ${n} ${n===1?'peça marcada':'peças marcadas'} para saque.`, `The ice melted. ${n} ${n===1?'piece':'pieces'} marked for loot.`));
}
// loot for army pieces: only the marked ones, and better than usual; the marked King also gives a Seal
function armyLoot(e){
  if (!e.marked) return;
  if (e.type==='K'){
    HERO.checkSeals = (HERO.checkSeals||0) + 1 + atlasRank('aKingSeal');
    S.items.push({x:e.x, y:e.y, item:genItem(true)});
    floatText(e.x, e.y-0.5, $t('+1 Selo de Xeque', '+1 Check Seal'), '#cfe6f5');
    log($t('O Rei marcado caiu: +1 Selo de Xeque.', 'The marked King fell: +1 Check Seal.'));
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
    showBanner($t('Partida Congelada', 'Frozen Match'), $t(`${P.name}: dê xeque-mate em ${P.n} ${P.n===1 ? 'lance' : 'lances'}.`, `${P.name}: deliver checkmate in ${P.n} ${P.n===1 ? 'move' : 'moves'}.`));
    log($t(`Partida Congelada: ${P.name}. Mate em ${P.n}.`, `Frozen Match: ${P.name}. Mate in ${P.n}.`));
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
  sfx('chess');
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
  if (result==='win') sfx('win');
  await sleep(reduce ? 200 : 700);
  if (result==='win'){
    const lines = frozenReward(c);
    await openModal({title:$t('Xeque-mate!', 'Checkmate!'), body:`<p class="mtext">${c.P.name} ${$t('resolvido', 'solved')}${c.hints ? $t(` com ${c.hints} ${c.hints===1?'dica':'dicas'}`, ` with ${c.hints} ${c.hints===1?'hint':'hints'}`) : $t(' sem dicas', ' with no hints')}.</p><ul class="mtext">${lines.map(l => `<li>${l}</li>`).join('')}</ul>`,
      note:$t('O saque está no chão, ao lado do tabuleiro de gelo.', 'The loot is on the ground, next to the ice board.'), actions:[{label:$t('Voltar ao andar', 'Back to the floor'), primary:true, value:'ok'}]});
  } else {
    await openModal({title:$t('O exército desperta', 'The army awakens'), body:`<p class="mtext">${result==='stale' ? $t('Afogamento não é mate.', 'Stalemate is not mate.') : $t('O mate não veio a tempo.', 'The mate did not come in time.')} ${$t('As peças pretas ganham vida ao redor do tabuleiro de gelo.', 'The black pieces come to life around the ice board.')}</p>`,
      actions:[{label:$t('Voltar ao andar e lutar', 'Back to the floor and fight'), primary:true, value:'ok'}]});
    thawArmy(c);
  }
  S.chess = null; S.phase = 'modal';
  updateUI();
  c.resolve();
}
// returns the lines shown in the result window; items go on the ground around the frozen board (with their light beams)
// hints you did not have to pay for (Atlas) do not count against the bonus
const paidHints = c => Math.max(0, c.hints - atlasRank('aFreeHint'));
function frozenReward(c){
  const lines = [];
  HERO.grimoire = HERO.grimoire || {};
  if (!c.P.problem){
    const first = !HERO.grimoire[c.P.id];
    HERO.grimoire[c.P.id] = true;
    if (first){ lines.push(`<b>${$t('Grimório:', 'Grimoire:')}</b> ${c.P.name} ${$t('aprendido.', 'learned.')} ${c.P.power}`); log($t(`Grimório: ${c.P.name} aprendido.`, `Grimoire: ${c.P.name} learned.`)); }
  }
  const seals = (c.P.n>=4 ? 2 : 1) + atlasRank('aSeal');
  if (atlasRank('aMateGold')){ const g = 25*atlasRank('aMateGold'); HERO.gold += g; S.goldFound += g; lines.push($t(`+${g} de ouro`, `+${g} gold`)); }
  HERO.checkSeals = (HERO.checkSeals||0) + seals;
  lines.push($t(`+${seals} ${seals===1 ? 'Selo' : 'Selos'} de Xeque`, `+${seals} Check ${seals===1 ? 'Seal' : 'Seals'}`));
  if (!paidHints(c)){ const r = pick(Object.keys(RUNES)); HERO.runes = HERO.runes || {}; HERO.runes[r] = (HERO.runes[r]||0) + 1; lines.push($t(`${RUNES[r].name} (bônus por não usar dicas)`, `${RUNES[r].name} (bonus for using no hints)`)); }
  const n = c.P.n;
  const items = [rollItem(paidHints(c)>=2 || n===1 ? 'magic' : 'rare', areaIlvl())];
  if (n>=3) items.push(rollItem(n>=4 || !paidHints(c) ? 'rare' : 'magic', areaIlvl() + (n>=4 ? 2 : 0)));
  if (atlasRank('aNoHintItem') && !paidHints(c)) items.push(rollItem('rare', areaIlvl() + 1));
  if (atlasRank('kGrandmaster') && n>=3){ const U = pick(classUniques(S.cls)); if (U) items.push(makeUnique(U)); }
  const spots = [[c.at[0],c.at[1]], ...ALL.map(([dx,dy]) => [c.at[0]+dx, c.at[1]+dy])].filter(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !S.items.some(i => i.x===x && i.y===y));
  for (const it of items){ const s = spots.shift() || c.at; S.items.push({x:s[0], y:s[1], item:it}); lines.push(`<span class="rc-${it.rar}">${esc(it.name)}</span> ${$t('no chão', 'on the ground')}`); }
  log($t(`Xeque-mate: ${c.P.name}.`, `Checkmate: ${c.P.name}.`));
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
  log($t('O exército congelado despertou.', 'The frozen army awoke.'));
}

/* ---------- The Rift (Fenda) ---------- */
// a short burst: 5 turns of growing waves (max 8 spawns alive); every 3 kills nearby add a turn, at most +3 in total
function openRift(en){
  S.rift = {x:en.x, y:en.y, turns:5 + atlasRank('aRift') - (atlasRank('kCollapse') ? 2 : 0), ext:0, kills:0, wave:0, open:S.turn};
  S.floorCleared = false;
  showBanner($t('A Fenda se abriu', 'The Rift opened'), $t(`5 turnos de ondas cada vez maiores (até ${riftMaxAlive()} crias ao mesmo tempo). Crias deixam Estilhaços; a cada 3 abates perto dela, +1 turno (até +3).`, `5 turns of ever larger waves (up to ${riftMaxAlive()} spawn at once). Spawn drop Shards; every 3 kills near it, +1 turn (up to +3).`));
  log($t('A Fenda se abriu.', 'The Rift opened.'));
  fx.rings.push({x:en.x, y:en.y, t:0, c:'180,140,255'}); fx.shake = Math.max(fx.shake, 8);
  riftSpawn(Math.min(3 + 3*atlasRank('aRiftOpen'), riftMaxAlive()-1));
}
function riftSpawn(n){
  const r = S.rift; if (!r) return;
  const spots = [];
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) if (cheb(x,y,r.x,r.y)<=2 && !occupied(x,y) && !isLava(x,y) && !isPit(x,y) && cheb(x,y,S.player.x,S.player.y)>1) spots.push([x,y]);
  n = Math.min(n, riftMaxAlive() - S.enemies.filter(e => e.rift).length);
  for (const [x,y] of shuffle(spots).slice(0, Math.max(0,n))){
    const pool = eventPower()<4 ? ['P','P','P','N'] : eventPower()<10 ? ['P','P','N','B'] : ['P','P','N','B','R'];
    const e = makeEnemy(pick(pool), x, y, {rx:r.x, ry:r.y});
    e.rift = true; e.label = $t('Cria da Fenda', 'Rift Spawn'); e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp*.8));
    e.mods = e.mods.filter(m => m!=='submerge');
    if (rnd() < .15*atlasRank('aSpawnElite')){ e.elite = true; e.eliteRift = true; e.hp = e.maxHp = e.maxHp*2; e.label = $t('Cria Elite da Fenda', 'Elite Rift Spawn'); }
    S.enemies.push(e); burst(x, y, '#b48cff', 12);
  }
}
function riftTick(){
  const r = S.rift; if (!r) return;
  r.turns--;
  if (atlasRank('kBottomless') && S.turn - (r.lastKill ?? r.open) <= 2) r.turns = Math.max(r.turns, 1);
  if (r.turns<=0){ closeRift(); return; }
  r.wave++;
  riftSpawn(Math.round((1 + r.wave*(.5 + eventPower()/30)) * (atlasRank('kCollapse') ? 2 : 1)) + atlasRank('aRiftSpawn'));
}
function closeRift(){
  const gone = S.enemies.filter(e => e.rift);
  // surviving the whole rift pays a bonus (more on higher Torment)
  const bonus = Math.round((5 + 2*(S.torment||0)) * (S.mapAff.has('rShards') ? 1.5 : 1) * (1 + .5*atlasRank('aRiftBonus')) * (atlasRank('kBottomless') ? 1.5 : 1));
  HERO.riftShards = (HERO.riftShards||0) + bonus; S.riftShardsRun = (S.riftShardsRun||0) + bonus;
  floatText(S.player.x, S.player.y-0.5, $t(`+${bonus} estilhaços`, `+${bonus} shards`), '#b48cff');
  S.enemies = S.enemies.filter(e => !e.rift);
  for (const e of gone) burst(e.x, e.y, '#b48cff', 14);
  showBanner($t('A Fenda se fechou', 'The Rift closed'), $t(`+${S.riftShardsRun||0} Estilhaços da Fenda nesta abertura.`, `+${S.riftShardsRun||0} Rift Shards from this opening.`));
  log($t(`A Fenda se fechou. Estilhaços: ${HERO.riftShards||0}.`, `The Rift closed. Shards: ${HERO.riftShards||0}.`));
  S.rift = null;
}
function riftKill(e){
  const r = S.rift; if (!r) return;
  if (e.rift){
    const n = Math.max(1, Math.round((1 + (e.type==='R' || e.type==='Q' ? 1 + 2*atlasRank('aBigShard') : 0) + atlasRank('aShardKill') + (e.eliteRift ? 3 : 0)) * (S.mapAff.has('rShards') ? 1.5 : 1) * (1 + .1*atlasRank('aShards')) * (atlasRank('kBottomless') ? 1.5 : 1)));
    if (rnd() < .08*atlasRank('aSpawnLoot')) S.items.push({x:e.x, y:e.y, item:genItem(false)});
    HERO.riftShards = (HERO.riftShards||0) + n; S.riftShardsRun = (S.riftShardsRun||0) + n;
    floatText(e.x, e.y-0.5, $t(`+${n} estilhaço${n>1?'s':''}`, `+${n} shard${n>1?'s':''}`), '#b48cff');
  }
  if (cheb(e.x,e.y,r.x,r.y)<=3){
    r.kills++; r.lastKill = S.turn;
    if (r.kills % (atlasRank('aRiftFast') ? 2 : 3)===0 && r.ext < (atlasRank('aRiftExt') ? 6 : 3)){ r.ext++; r.turns++; floatText(r.x, r.y-0.6, $t('+1 turno', '+1 turn'), '#e6d6ff'); }
  }
}

/* ---------- Uber boss: Rainha Suprema ---------- */
// about 3 Rifts and 3 Frozen Matches per uber boss
const UBER_COST = {shards:45, seals:3};
const UBER_UNIQUES = [
  {slot:'arma', name:$t('Cetro da Suprema', 'Scepter of the Supreme'), affixes:[{k:'decree'},{k:'dmg',v:4},{k:'crit',v:15}]},
  {slot:'armadura', name:$t('Manto da Coroa Partida', 'Cloak of the Broken Crown'), affixes:[{k:'splitCrown'},{k:'hp',v:12},{k:'block',v:12}]},
  {slot:'anel', name:$t('Anel da Fenda', 'Ring of the Rift'), affixes:[{k:'riftAtk'},{k:'dmg',v:2},{k:'mf',v:30}]},
  {slot:'botas', name:$t('Botas do Rei Supremo', 'Boots of the Supreme King'), affixes:[{k:'courage'},{k:'hp',v:10},{k:'block',v:10}]},
  {slot:'elmo', name:$t('Elmo da Muralha Suprema', 'Helm of the Supreme Wall'), affixes:[{k:'resUnify'},{k:'resFire',v:25},{k:'resCold',v:10},{k:'resLight',v:10}]},
  {slot:'anel', name:$t('Anel da Fúria Suprema', 'Ring of Supreme Fury'), affixes:[{k:'crescendo'},{k:'crit',v:15},{k:'eliteDmg',v:25}]},
  // build-defining rules that change how a fight is played: the shared uber pool
  {slot:'amuleto', name:$t('Talismã da Segunda Vida', 'Second Life Talisman'), affixes:[{k:'secondLife'},{k:'hp',v:14},{k:'block',v:10}]},
  {slot:'amuleto', name:$t('Prisma de Três Faces', 'Three-Faced Prism'), affixes:[{k:'unison'},{k:'fireDmg',v:4},{k:'coldDmg',v:2}]},
  {slot:'armadura', name:$t('Égide Vingativa', 'Vengeful Aegis'), affixes:[{k:'avenge'},{k:'shield',v:4},{k:'hp',v:10}]},
  {slot:'arma', name:$t('Lâmina da Marca Mortal', 'Deathmark Blade'), affixes:[{k:'markPrey'},{k:'dmg',v:3},{k:'eliteDmg',v:25}]},
  {slot:'anel', name:$t('Anel da Moeda Fatal', 'Fatal Coin Ring'), affixes:[{k:'luckyCoin'},{k:'hp',v:8},{k:'gold',v:40}]}
];
// each uber boss also has two uniques of its own, with a rule that copies its mechanic
const UBER_OWN = {
  queen:[{slot:'elmo', name:$t('Coroa Estilhaçada', 'Shattered Crown'), affixes:[{k:'shatterCrown'},{k:'hp',v:8},{k:'crit',v:15}]},
         {slot:'armadura', name:$t('Véu da Guarda Real', 'Veil of the Royal Guard'), affixes:[{k:'spectralGuard'},{k:'hp',v:10},{k:'shield',v:2}]},
         {slot:'cinto', name:$t('Cinto do Estandarte', 'Standard-Bearer Belt'), affixes:[{k:'standard'},{k:'hp',v:10},{k:'block',v:8}]}],
  knight:[{slot:'arma', name:$t('Rédeas do Ímpeto', 'Reins of Momentum'), affixes:[{k:'momentum'},{k:'dmg',v:3}]},
          {slot:'botas', name:$t('Ferraduras da Fuga', 'Horseshoes of Escape'), affixes:[{k:'flee'},{k:'hp',v:10},{k:'block',v:10}]},
          {slot:'botas', name:$t('Passos do Titã', 'Titan Steps'), affixes:[{k:'titan'},{k:'area',v:1},{k:'hp',v:10}]}],
  twins:[{slot:'elmo', name:$t('Ameias Gêmeas', 'Twin Battlements'), affixes:[{k:'link'},{k:'resFire',v:25},{k:'resCold',v:25},{k:'resLight',v:25}]},
         {slot:'armadura', name:$t('Couraça da Forja Viva', 'Living Forge Cuirass'), affixes:[{k:'forgeWalk'},{k:'hp',v:12},{k:'resFire',v:30}]},
         {slot:'armadura', name:$t('Couraça de Pedra Viva', 'Living Stone Cuirass'), affixes:[{k:'stoneSkin'},{k:'hp',v:14},{k:'block',v:8}]}],
  pawn:[{slot:'elmo', name:$t('Coroa do Peão Supremo', 'Crown of the Supreme Pawn'), affixes:[{k:'supremePromo'},{k:'hp',v:8},{k:'eliteDmg',v:25}]},
        {slot:'anel', name:$t('Anel do En Passant', 'En Passant Ring'), affixes:[{k:'enPassant'},{k:'dmg',v:1},{k:'mf',v:20}]},
        {slot:'botas', name:$t('Botas da Sombra', 'Shadow Boots'), affixes:[{k:'shadow'},{k:'hp',v:8},{k:'crit',v:12}]}]
};
const canUber = h => (h.riftShards||0) >= UBER_COST.shards && (h.checkSeals||0) >= UBER_COST.seals;

/* ---------- Pinnacle: the Fallen King ----------
   Every uber boss drops a Crown Fragment of its own; one of each (4) opens the throne room. */
const FALLEN_UNIQUES = [
  {slot:'elmo', name:$t('Coroa do Rei Caído', 'Crown of the Fallen King'), affixes:[{k:'regicide'},{k:'hp',v:12},{k:'crit',v:20}]},
  {slot:'armadura', name:$t('Manto do Exílio', 'Mantle of Exile'), affixes:[{k:'deathBurst'},{k:'hp',v:14},{k:'block',v:12}]},
  {slot:'arma', name:$t('Cetro do Trono Vazio', 'Scepter of the Empty Throne'), affixes:[{k:'cleave'},{k:'dmg',v:4},{k:'eliteDmg',v:30}]},
  {slot:'amuleto', name:$t('Relicário do Penitente', 'Penitent Reliquary'), affixes:[{k:'penitent'},{k:'hp',v:14},{k:'resFire',v:20},{k:'resCold',v:20},{k:'resLight',v:20}]},
  {slot:'arma', name:$t('Cetro da Maré Crescente', 'Rising Tide Scepter'), affixes:[{k:'swell'},{k:'area',v:1},{k:'dmg',v:4},{k:'eliteDmg',v:20}]}
];
const fragName = id => $t(`Fragmento da Coroa (${UBERS[id].name})`, `Crown Fragment (${UBERS[id].name})`);
const canFallen = h => BOSS_ORDER.every(id => ((h.crownFrags||{})[id]||0) > 0);
// is this unique in the hero's gear or stash?
const ownsUnique = (h, name) => [...Object.values(h.equip), ...h.stash].some(it => it && it.name===name);
// items renamed when the uber pool changed (old saves): [old pt, old en, slot, new]
const RENAMED = [['Coroa do Peão Supremo', 'Crown of the Supreme Pawn', 'anel', 'Anel da Fúria Suprema'],
  ['Ferraduras do Corcel Supremo', 'Horseshoes of the Supreme Steed', 'botas', 'Botas do Rei Supremo'],
  ['Ameias Gêmeas', 'Twin Battlements', 'elmo', 'Elmo da Muralha Suprema', 'lineGuard']];
function renameOld(it){
  for (const [pt, en, slot, to, rule] of RENAMED)
    if ((it.name===pt || it.name===en) && it.slot===slot && (!rule || it.affixes.some(a => a.k===rule))) it.name = relabel(to);
}

/* ---------- Maré de Sangue (Helltide-like) ----------
   A random floor event (from Act 2 on): blood pools, Embers from every kill, a Torment Chest that costs Embers,
   and sometimes a roaming Herald. */
const TIDE_COST_BASE = 30;
const tideCost = () => TIDE_COST_BASE - 10*atlasRank('aChestCost');
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
      cand.elite = true; cand.herald = true; cand.label = $t('Arauto da Maré', 'Herald of the Tide');
      cand.hp = cand.maxHp = Math.round(cand.maxHp*3*(1 - .15*atlasRank('aHeraldWeak'))); cand.dmg += 2;
      for (const m of shuffle(ELITE_MODS.filter(m => !cand.mods.includes(m))).slice(0,2)) cand.mods.push(m);
      log($t('Um Arauto da Maré ronda este andar.', 'A Herald of the Tide prowls this floor.'));
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
  S.tideRise = cand.slice(0, 3 + rint(3) + atlasRank('aPools'));
}
function resolveTide(){
  if (S.tideRise){
    for (const [x,y] of S.tideRise) if (!isWall(x,y) && !terrainAt(x,y)){ S.terrain.set(key(x,y), 'blood'); burst(x, y, '#9e1a12', 10); }
    log($t('A Maré subiu: poças de sangue se espalham.', 'The Tide rose: blood pools spread.'));
    S.tideRise = null;
  }
  if (S.bloodRain){
    const dmg = 2 + Math.floor(S.lvl/6);
    for (const [x,y] of S.bloodRain.sq){
      burst(x, y, '#c41e14', 14); fx.rings.push({x, y, t:0, c:'200,30,20'});
      if (isPlayer(x,y)) hurtPlayer(dmg, $t(`A Chuva de Sangue te atingiu (${dmg}).`, `The Blood Rain hit you (${dmg}).`));
      const a = allyAt(x,y); if (a) damageAlly(a, dmg);
    }
    S.bloodRain = null;
  }
}
// end of each enemy turn: enemies in blood regenerate
// only from Torment 1: at the base difficulty the pools just make enemies hit harder
function bloodRegen(){ if (!S.torment || atlasRank('aDry')) return; for (const e of S.enemies) if (terrainAt(e.x,e.y)==='blood' && e.hp<e.maxHp) healEnemy(e, 1); }
function tideOverflow(){
  S.tideIra = 0; S.tideGoal = (S.tideGoal||8) + 4;
  const pools = [...S.terrain].filter(([k,t]) => t==='blood').map(([k]) => unkey(k)).filter(([x,y]) => !occupied(x,y));
  const spot = pick(pools.length ? pools : [[rint(W), rint(Math.ceil(H/2))]]);
  if (spot && !occupied(spot[0],spot[1])){
    const t = pick(['N','B','R']), e = makeEnemy(t, spot[0], spot[1]);
    e.elite = true; e.herald = true; e.label = $t('Arauto da Maré', 'Herald of the Tide');
    e.hp = e.maxHp = Math.round(e.maxHp*3*(1 - .15*atlasRank('aHeraldWeak'))); e.dmg += 2;
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
  showBanner($t('A Maré transborda', 'The Tide overflows'), $t('Um Arauto se ergue do sangue, e uma Chuva de Sangue vai cair perto de você.', 'A Herald rises from the blood, and a Blood Rain will fall near you.'));
  log($t('A Maré transbordou: um Arauto surgiu e uma Chuva de Sangue se aproxima.', 'The Tide overflowed: a Herald appeared and a Blood Rain is coming.'));
}
function tideKill(e){
  if (!S.tide) return;
  const onBlood = terrainAt(e.x,e.y)==='blood';
  const n = Math.round((e.herald ? 15 : e.boss ? 8 : e.elite ? 3 : 1) * (1 + .15*atlasRank('aEmbers')) * (onBlood ? 2 + atlasRank('aBloodEmbers') : 1));
  if (onBlood) floatText(e.x, e.y-0.7, $t('sangue: brasas x2', 'blood: embers x2'), '#ff6b4a');
  if (!e.herald){ S.tideIra = (S.tideIra||0) + (e.elite ? 3 : 1)*(1 + .3*atlasRank('aWrath')); if (S.tideIra >= (S.tideGoal||8)) tideOverflow(); }
  HERO.embers = (HERO.embers||0) + n; S.embersRun = (S.embersRun||0) + n;
  if (n>1) floatText(e.x, e.y-0.5, $t(`+${n} brasas`, `+${n} embers`), '#ff6b4a');
  if (e.herald){ S.items.push({x:e.x, y:e.y, item:rollItem('rare', areaIlvl()+2)}); dropRune(e);
    for (let i=0; i<atlasRank('aHeraldLoot'); i++){ const sp = ALL.map(([dx,dy]) => [e.x+dx,e.y+dy]).find(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !S.items.some(it => it.x===x && it.y===y)); if (sp) S.items.push({x:sp[0], y:sp[1], item:rollItem('rare', areaIlvl()+2)}); }
    if (atlasRank('kHeraldChest')){ const sp = ALL.map(([dx,dy]) => [e.x+dx,e.y+dy]).find(([x,y]) => inb(x,y) && !isWall(x,y) && !isPit(x,y) && !S.items.some(it => it.x===x && it.y===y)); if (sp) S.items.push({x:sp[0], y:sp[1], tideChest:true, free:true}); } log($t('O Arauto caiu: +15 brasas, um item raro e uma runa.', 'The Herald fell: +15 embers, a rare item and a rune.')); }
}
// returns false when there are not enough Embers (the chest stays on the floor)
function openTideChest(en){
  const cost = en.free ? 0 : tideCost();
  if ((HERO.embers||0) < cost){
    floatText(en.x, en.y-0.4, $t(`precisa de ${cost} brasas`, `needs ${cost} embers`), '#ff6b4a');
    log($t(`O Baú Tormentoso pede ${cost} Brasas de Sangue. Você tem ${HERO.embers||0}.`, `The Torment Chest asks for ${cost} Blood Embers. You have ${HERO.embers||0}.`));
    return false;
  }
  HERO.embers -= cost;
  S.pendingLoot.push({item: genItem(true)});
  if (rnd() < .25 + .1*atlasRank('aChestUnique')){ const U = pick(classUniques(S.cls)); if (U) S.pendingLoot.push({item: makeUnique(U)}); }
  if (rnd()<.3) dropRune(en);
  burst(en.x, en.y, '#ff4a3a', 30); fx.rings.push({x:en.x, y:en.y, t:0, c:'255,80,60'});
  log($t(`Baú Tormentoso aberto (−${cost} brasas).`, `Torment Chest opened (−${cost} embers).`));
  return true;
}

/* ---------- Rival (nemesis) ----------
   One rival per hero, of your own class. It may show up once per expedition; beat it for its gear.
   If it kills you, it grows stronger. */
const RIVAL_NAMES = ['Aldric','Bertrand','Casimir','Dorian',$t('Edmundo', 'Edmund'),$t('Fausto', 'Faust'),$t('Gaspar', 'Gaspard'),$t('Heitor', 'Hector'),$t('Isolda', 'Isolde'),'Jocasta',$t('Leonor', 'Eleanor'),'Morgana',$t('Ulrico', 'Ulric'),'Vesna'];
const RIVAL_EPITHETS = [$t('o Implacável', 'the Relentless'),$t('a Lâmina Cinza', 'the Grey Blade'),$t('o Usurpador', 'the Usurper'),$t('a Sombra da Torre', 'the Shadow of the Tower'),$t('o Sem-Rei', 'the Kingless'),$t('a Coroa Quebrada', 'the Broken Crown'),$t('o Carrasco', 'the Executioner'),$t('a Dama de Ferro', 'the Iron Lady'),$t('o Gambito Negro', 'the Black Gambit'),$t('a Última Fileira', 'the Last Rank')];
function heroRival(h){ if (!h.rival) h.rival = {name:`${pick(RIVAL_NAMES)} ${pick(RIVAL_EPITHETS)}`, tier:1, beaten:0, kills:0}; return h.rival; }
function placeRival(){
  // the rival shows up from Act 2 on
  if (['daily','uber','pinnacle','tutorial'].includes(S.exp.kind) || S.rivalMet || S.bossId || contentLvl()<4 || rnd()>=.15) return;
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
  S.eventNote = [$t(`${R.name} te encontrou`, `${R.name} found you`), $t(`Seu rival, nível ${R.tier}. Derrote-o e fique com o equipamento dele.`, `Your rival, level ${R.tier}. Defeat them and keep their gear.`)];
  log($t(`${R.name}, seu rival, está neste andar.`, `${R.name}, your rival, is on this floor.`));
}
function rivalKill(e){
  if (!e.rival) return;
  const R = heroRival(HERO);
  S.items.push({x:e.x, y:e.y, item:rollItem('rare', areaIlvl()+3)});
  S.pendingLoot.push({item:rollItem(rnd()<.5 ? 'rare' : 'magic', areaIlvl()+3)});
  dropRune(e);
  const g = 40*R.tier; HERO.gold += g; S.goldFound += g;
  log($t(`${R.name} caiu. Você ficou com o equipamento dele (+${g} de ouro).`, `${R.name} fell. You kept their gear (+${g} gold).`));
  HERO.rival = {name:`${pick(RIVAL_NAMES)} ${pick(RIVAL_EPITHETS)}`, tier:R.tier+1, beaten:R.beaten+1, kills:0};
}

/* ---------- Uber bosses ---------- */
const UBERS = {
  queen:{name:$t('Rainha Suprema', 'Supreme Queen'), biome:'crypt', special:$t('Alterna a Cruz de 4 casas em volta de você e a Coroa Estilhaçada (as 8 linhas a partir dela). Guarda Real com 2 peões.', 'Alternates the 4-square Cross around you and the Shattered Crown (all 8 lines from her). Royal Guard with 2 pawns.')},
  knight:{name:$t('Corcel Supremo', 'Supreme Steed'), biome:'swamp', special:$t('Cerco Supremo: o anel a 2 casas de você e a sua casa. Fica exausto só depois de 4 fugas.', 'Supreme Siege: the ring 2 squares from you and your own square. Only gets exhausted after 4 escapes.')},
  twins:{name:$t('Torres Supremas', 'Supreme Rooks'), biome:'forge', special:$t('Muralha Estrelada: cada torre atinge as 8 linhas a partir dela, alternando entre as duas.', 'Starry Wall: each rook hits all 8 lines from it, alternating between the two.')},
  pawn:{name:$t('Peão Supremo', 'Supreme Pawn'), biome:'cathedral', special:$t('Avanço Supremo: as três fileiras inteiras à frente dele.', 'Supreme Advance: the three full ranks in front of it.')}
};

/* ---------- Atlas completion: every biome x tier finished for the first time gives 1 Atlas point (see tree.js) ---------- */
function atlasComplete(map){
  if (!ACTS.includes(map.biome)) return;   // the rare map biomes are outside the Atlas
  const k = `${map.biome}-${map.tier}`;
  HERO.atlas = HERO.atlas || {};
  if (HERO.atlas[k]) return;
  HERO.atlas[k] = true;
  log($t(`Atlas: ${BIOMES[map.biome].name}, nível ${map.tier}, concluído. +1 ponto de Atlas.`, `Atlas: ${BIOMES[map.biome].name}, tier ${map.tier}, completed. +1 Atlas point.`));
}

/* ---------- Map currencies ----------
   Endgame drops (after Act 4) used in the camp to reshape a map before opening it. */
const CURRENCY = {
  reforja:{name:$t('Fragmento de Reforja', 'Reforging Shard'), short:$t('Reforja', 'Reforge'), d:$t('Sorteia de novo todos os afixos do mapa; o nível fica.', 'Rerolls every affix on the map; the tier stays.'), w:45, c:'#cfc6b6'},
  lacre:{name:$t('Lacre', 'Seal'), short:$t('Lacre', 'Seal'), d:$t('Remove um afixo de dificuldade.', 'Removes one difficulty affix.'), w:25, c:'#a9bfd6'},
  fortuna:{name:$t('Pedra de Fortuna', 'Fortune Stone'), short:$t('Fortuna', 'Fortune'), d:$t('Adiciona um afixo de recompensa (até 3).', 'Adds one reward affix (up to 3).'), w:20, c:'#ecd36a'},
  ascensao:{name:$t('Selo Ascendente', 'Ascendant Seal'), short:$t('Ascensão', 'Ascension'), d:$t('Sobe o mapa 1 nível (até 10) e adiciona um afixo de dificuldade.', 'Raises the map 1 tier (up to 10) and adds one difficulty affix.'), w:10, c:'#f08a3c'}
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
  if (!h.currency[k]) return $t('Você não tem essa moeda.', 'You do not have that currency.');
  const keys = Object.keys(MAP_AFFIXES);
  const pen = map.affixes.filter(a => !isRewardAffix(a)), rew = map.affixes.filter(isRewardAffix);
  if (k==='reforja') map.affixes = makeMap(map.tier).affixes;
  else if (k==='lacre'){ if (!pen.length) return $t('Este mapa não tem afixos de dificuldade.', 'This map has no difficulty affixes.'); const rm = pick(pen); map.affixes = map.affixes.filter(a => a!==rm); }
  else if (k==='fortuna'){
    const add = shuffle(keys.filter(a => isRewardAffix(a) && !rew.includes(a)))[0];
    if (rew.length>=3 || !add) return $t('Este mapa já tem o máximo de recompensas.', 'This map already has the maximum rewards.');
    map.affixes.push(add);
  } else if (k==='ascensao'){
    if (map.tier>=10) return $t('Este mapa já está no nível máximo.', 'This map is already at the maximum tier.');
    map.tier++;
    const add = shuffle(keys.filter(a => !isRewardAffix(a) && !pen.includes(a)))[0];
    if (add && pen.length<4) map.affixes.push(add);
  }
  h.currency[k]--;
  return $t(`${CURRENCY[k].name} usado em ${mapName(map)}.`, `${CURRENCY[k].name} used on ${mapName(map)}.`);
}
