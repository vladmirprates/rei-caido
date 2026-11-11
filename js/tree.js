/* Rei Caído — passive tree (replaces the old talents).
   One point per hero level. A node can be learned when it touches the start or a learned node.
   Small nodes give numbers; notables give rules; keystones are big trade-offs at the end of a branch. */

// [label, affixes] = small node; {notable|key, d, aff} = big node
const TREE_BRANCHES = [
  {id:'o', name:$t('Ofensiva', 'Offense'), ang:200, nodes:[
    [$t('+1 de dano', '+1 damage'), [{k:'dmg',v:1}]],
    [$t('+5% de crítico', '+5% critical chance'), [{k:'crit',v:5}]],
    [$t('+1 de dano', '+1 damage'), [{k:'dmg',v:1}]],
    {notable:$t('Fúria', 'Fury'), d:$t('+2 de dano com menos da metade da vida', '+2 damage while below half health'), aff:[{k:'fury'}]},
    {notable:$t('Matança', 'Slaughter'), d:$t('Cada abate dá +1 de dano até o fim do turno (até +5)', 'Each kill gives +1 damage until the end of the turn (up to +5)'), aff:[{k:'killFury'}]},
    [$t('+5% de crítico', '+5% critical chance'), [{k:'crit',v:5}]],
    [$t('+1 de dano', '+1 damage'), [{k:'dmg',v:1}]],
    {key:$t('Gambito', 'Gambit'), d:$t('Começa cada andar com no máximo metade da vida, mas causa +3 de dano', 'Start each floor with at most half health, but deal +3 damage'), aff:[{k:'gambit'}]}]},
  {id:'d', name:$t('Defesa', 'Defense'), ang:340, nodes:[
    [$t('+4 de vida máxima', '+4 max health'), [{k:'hp',v:4}]],
    [$t('+1 de escudo por andar', '+1 shield per floor'), [{k:'shield',v:1}]],
    [$t('+4 de vida máxima', '+4 max health'), [{k:'hp',v:4}]],
    {notable:$t('Muralha Viva', 'Living Wall'), d:$t('Começa cada andar com +6 de escudo', 'Start each floor with +6 shield'), aff:[{k:'bulwark'}]},
    [$t('+5% de bloqueio', '+5% block'), [{k:'block',v:5}]],
    [$t('+4 de vida máxima', '+4 max health'), [{k:'hp',v:4}]],
    [$t('+5% de bloqueio', '+5% block'), [{k:'block',v:5}]],
    {key:$t('Égide Eterna', 'Eternal Aegis'), d:$t('O primeiro golpe que você recebe em cada andar é anulado', 'The first blow you take on each floor is nullified'), aff:[{k:'aegisFirst'}]}]},
  {id:'u', name:$t('Fortuna', 'Fortune'), ang:270, nodes:[
    [$t('+15% de ouro', '+15% gold'), [{k:'gold',v:15}]],
    [$t('+10% de achado de itens', '+10% item find'), [{k:'mf',v:10}]],
    [$t('Cura 1 ao matar', 'Heal 1 on kill'), [{k:'healKill',v:1}]],
    {notable:$t('Foco', 'Focus'), d:$t('Habilidades recarregam 1 turno mais rápido', 'Skills recharge 1 turn faster'), aff:[{k:'cdr',v:1}]},
    {notable:$t('Colheita de Almas', 'Soul Harvest'), d:$t('Cada abate reduz em 1 a recarga das habilidades (até 2 por turno)', 'Each kill lowers your skill cooldowns by 1 (up to 2 per turn)'), aff:[{k:'killCdr'}]},
    {notable:$t('Passo Leve', 'Light Step'), d:$t('Depois de um abate, ganha um movimento extra sem ataque (1 por turno)', 'After a kill, gain an extra move without attacking (1 per turn)'), aff:[{k:'killStep'}]},
    {key:$t('Ceifa', 'Reaping'), d:$t('Ao abater, ganha +1 ação (máx. 2 por turno; cada fonte de Ceifa a mais soma +1 ao limite)', 'On kill, gain +1 action (max. 2 per turn; each extra source of Reaping adds +1 to the limit)'), aff:[{k:'chain'}]}]},
  {id:'e', name:$t('Elementos', 'Elements'), ang:130, nodes:[
    [$t('+10% de resistência a fogo', '+10% fire resistance'), [{k:'resFire',v:10}]],
    [$t('+10% de resistência a gelo', '+10% cold resistance'), [{k:'resCold',v:10}]],
    [$t('+10% de resistência a raio', '+10% lightning resistance'), [{k:'resLight',v:10}]],
    {notable:$t('Prisma', 'Prism'), d:$t('+1 de dano de fogo, de gelo e de raio', '+1 fire, cold and lightning damage'), aff:[{k:'fireDmg',v:1},{k:'coldDmg',v:1},{k:'lightDmg',v:1}]},
    [$t('+8% de todas as resistências', '+8% to all resistances'), [{k:'resFire',v:8},{k:'resCold',v:8},{k:'resLight',v:8}]],
    [$t('+8% de todas as resistências', '+8% to all resistances'), [{k:'resFire',v:8},{k:'resCold',v:8},{k:'resLight',v:8}]],
    {key:$t('Represália', 'Reprisal'), d:$t('Ao ser atingido, seu próximo golpe causa +3', 'When hit, your next blow deals +3'), aff:[{k:'reprisal'}]}]},
  {id:'c', name:$t('Classe', 'Class'), ang:60, nodes:'class'}
];
// class branch: small nodes plus the two old class talents as notables, and a class keystone
const CLASS_KEYS = {
  N:{key:$t('Salto Longo', 'Long Leap'), d:$t('Também salta em 3x1', 'Also leaps in 3x1'), aff:[{k:'longJump'}]},
  R:{key:$t('Investida Perfurante', 'Piercing Charge'), d:$t('A investida atinge todos os inimigos na linha até a parede', 'The charge hits every enemy in the line up to the wall'), aff:[{k:'pierce'}]},
  B:{key:$t('Disparo Perfurante', 'Piercing Shot'), d:$t('O ataque à distância atravessa o primeiro inimigo e atinge o seguinte', 'The ranged attack passes through the first enemy and hits the next one'), aff:[{k:'pierceShot'}]},
  Q:{key:$t('Xeque-mate', 'Checkmate'), d:$t('Inimigos que ficam com menos de 3 de vida após seu golpe morrem', 'Enemies left below 3 health after your blow die'), aff:[{k:'execute'}]},
  K:{key:$t('Exército Robusto', 'Sturdy Army'), d:$t('Peões aliados têm +3 de vida e +1 de dano', 'Allied pawns have +3 health and +1 damage'), aff:[{k:'sturdyPawns'}]}
};
function classNodes(cls){
  const [t1, t2] = TALENTS_CLASS[cls];
  return [
    [$t('+1 de dano', '+1 damage'), [{k:'dmg',v:1}]],
    [$t('+4 de vida máxima', '+4 max health'), [{k:'hp',v:4}]],
    {notable:t1.name, d:t1.desc(1), aff:t1.aff(1)},
    [$t('+1 de dano', '+1 damage'), [{k:'dmg',v:1}]],
    [$t('+4 de vida máxima', '+4 max health'), [{k:'hp',v:4}]],
    {notable:t2.name, d:t2.desc(1), aff:t2.aff(1)},
    [$t('+5% de crítico', '+5% critical chance'), [{k:'crit',v:5}]],
    CLASS_KEYS[cls]
  ];
}
// flatten into nodes with positions and links (cached per class)
const treeCache = {};
// builds a radial tree: every branch is a path from the start; big nodes keep their names as labels
function buildTree(branches, nodesOf, r0 = 1.3, step = 1.05){
  const nodes = {start:{id:'start', x:0, y:0, kind:'start', name:$t('Origem', 'Origin'), d:$t('Ponto de partida.', 'Starting point.'), aff:[], links:[]}};
  for (const br of branches){
    const list = nodesOf(br);
    const a = br.ang*Math.PI/180;
    let prev = 'start';
    list.forEach((n, i) => {
      const id = br.id + i, r = r0 + i*step;
      const wob = (i%2 ? .35 : -.35);   // a slight zig-zag so branches read as paths
      const x = Math.cos(a)*r - Math.sin(a)*wob, y = -Math.sin(a)*r - Math.cos(a)*wob;
      const node = Array.isArray(n)
        ? {id, x, y, kind:'small', name:n[0], d:n[0], aff:n[1]}
        : {id, x, y, kind:n.key ? 'key' : 'notable', name:n.key || n.notable, d:n.d, aff:n.aff};
      node.branch = br.name; node.links = [prev];
      nodes[prev].links.push(id);
      nodes[id] = node; prev = id;
    });
  }
  return nodes;
}
// the three ascension skills of the class each get a branch of 8 nodes next to the classic five; depth/lateral place the diamond
// class tree spacing (the Atlas keeps the tighter default)
const TREE_R0 = 3.2, TREE_STEP = 1.4;
const SKILL_NODE_POS = {n1:[0,0], n2:[1,-.55], n3:[1,.55], n4:[2,-.55], n5:[2,.55], n6:[3,0], n7:[4,0], n8:[5,0]};
// every skill of the class (base ones first, then the three ascension skills) has an 8-node branch
const classSkillList = cls => CLASSES[cls].skills.concat(cls==='B' ? ['shift'] : [], ascSkillsOf(cls));
const skillRows = sk => isAscSkill(sk) ? ascOfSkill(sk).nodes : baseSkillNodes(sk);
// 15 slots around the circle: the 8 simple branches (classic 5 + 3 archetypes) first, then the 7 skill branches
function classLayout(cls){
  const simple = TREE_BRANCHES.map(b => ({id:b.id, name:b.name, nodes:b.nodes==='class' ? classNodes(cls) : b.nodes})).concat(archBranches(cls));
  const skills = classSkillList(cls).map(sk => ({skill:sk, name:SKILLS[sk].name, rows:skillRows(sk)}));
  const n = simple.length + skills.length, step = 360/n;
  simple.forEach((b, i) => b.ang = 90 - i*step);
  skills.forEach((b, i) => b.ang = 90 - (simple.length + i)*step);
  return {simple, skills};
}
const layoutCache = {};
const classLayoutOf = cls => layoutCache[cls] || (layoutCache[cls] = classLayout(cls));
function addSkillBranches(T, cls){
  for (const br of classLayoutOf(cls).skills){
    const a = br.ang*Math.PI/180;
    for (const n of br.rows){
      const [depth, lat] = SKILL_NODE_POS[n.id], r = TREE_R0 + depth*TREE_STEP, id = br.skill + '_' + n.id;
      const generic = af => af.k==='asc' && ASC_GENERIC.has(af.n) ? Object.assign({}, af, {skill:br.skill}) : af;
      const rule = n.aff.some(af => (AFX[af.k] && AFX[af.k].rule) || (af.k==='asc' && !ASC_GENERIC.has(af.n) && af.v===undefined));
      T[id] = {id, x:Math.cos(a)*r - Math.sin(a)*lat, y:-Math.sin(a)*r - Math.cos(a)*lat, kind:n.key ? 'key' : n.kind || (rule ? 'notable' : 'small'),
        name:n.name, d:n.d, aff:n.aff.map(generic), branch:br.name, skill:br.skill, links:[]};
    }
    for (const n of br.rows){
      const id = br.skill + '_' + n.id, parents = n.req.length ? n.req.map(p => br.skill + '_' + p) : ['start'];
      for (const p of parents){ T[id].links.push(p); T[p].links.push(id); }
    }
  }
}
// the simple branches form a ring at the 4th node: neighbours link, so there is more than one way to reach a branch
function addRing(T, cls){
  const ids = classLayoutOf(cls).simple.map(b => b.id + '3');
  for (let i=0; i<ids.length-1; i++){ if (T[ids[i]] && T[ids[i+1]]){ T[ids[i]].links.push(ids[i+1]); T[ids[i+1]].links.push(ids[i]); } }
}
function treeFor(cls){
  return treeCache[cls] || (treeCache[cls] = (() => {
    const L = classLayoutOf(cls), T = buildTree(L.simple, br => br.nodes, TREE_R0, TREE_STEP);
    addSkillBranches(T, cls); addRing(T, cls); return T;
  })());
}
const treeBranchesFor = cls => { const L = classLayoutOf(cls); return L.simple.map(b => ({name:b.name, ang:b.ang})).concat(L.skills.map(b => ({name:b.name, ang:b.ang, skillBranch:true}))); };
// 1 point per level, plus the endgame points (campaign, Reflection, ubers, Fallen King)
const treePoints = h => (h.level-1) + (typeof ascPoints==='function' ? ascPoints(h) : 0) - (h.tree||[]).length;
const treeLearned = h => new Set(['start', ...(h.tree||[])]);
// nodes of `ids` still connected to the start through nodes of `ids`
function treeReach(T, ids){
  const seen = new Set(['start']), q = ['start'];
  for (let i=0; i<q.length; i++) for (const l of T[q[i]].links) if (ids.has(l) && !seen.has(l)){ seen.add(l); q.push(l); }
  return seen;
}
// both trees share the same rules: learn = the shortest path, unlearn = the node and what depended on it
const TREE_API = {
  class: {T:h => treeFor(h.cls), get:h => h.tree || [], set:(h, a) => { h.tree = a; }, pts:h => treePoints(h)},
  atlas: {T:() => atlasTree(), get:h => h.atlasTree || [], set:(h, a) => { h.atlasTree = a; }, pts:h => atlasPoints(h)}
};
const gLearnedSet = (kind, h) => new Set(['start', ...TREE_API[kind].get(h)]);
// shortest chain of unlearned nodes that joins `id` to what is already learned (ordered from the tree outwards, ending in `id`)
function gPath(kind, h, id){
  const T = TREE_API[kind].T(h), learned = gLearnedSet(kind, h);
  if (!T[id] || learned.has(id)) return [];
  const parent = new Map([[id, null]]), q = [id];
  for (let i=0; i<q.length; i++){
    const cur = q[i];
    for (const l of T[cur].links){
      if (learned.has(l)){ const path = []; for (let n = cur; n; n = parent.get(n)) path.push(n); return path; }
      if (!parent.has(l)){ parent.set(l, cur); q.push(l); }
    }
  }
  return [];
}
// nodes that would be refunded by removing `id` (itself plus everything that depended on it)
function gRefund(kind, h, id){
  const T = TREE_API[kind].T(h), learned = gLearnedSet(kind, h);
  if (id==='start' || !learned.has(id)) return [];
  learned.delete(id);
  const keep = treeReach(T, learned);
  return TREE_API[kind].get(h).filter(n => !keep.has(n));
}
function gLearn(kind, h, id){ const p = gPath(kind, h, id); if (!p.length || p.length > TREE_API[kind].pts(h)) return false; TREE_API[kind].set(h, TREE_API[kind].get(h).concat(p)); return true; }
function gUnlearn(kind, h, id){ const gone = new Set(gRefund(kind, h, id)); if (!gone.size) return 0; TREE_API[kind].set(h, TREE_API[kind].get(h).filter(n => !gone.has(n))); return gone.size; }
const treePath = (h, id) => gPath('class', h, id), treeRefund = (h, id) => gRefund('class', h, id);
const treeLearn = (h, id) => gLearn('class', h, id), treeUnlearn = (h, id) => gUnlearn('class', h, id);
const canLearn = (h, id) => { const p = treePath(h, id); return p.length>0 && p.length <= treePoints(h); };
// old saves: the chosen subclass tree becomes ordinary passive nodes and its skill goes on the bar; stale ids are dropped
function migrateHero(h){
  if (h.atlasVer!==2){ h.atlasTree = []; h.atlasVer = 2; }
  if (h.atlasTree && h.atlasTree.length){ const A = atlasTree(); h.atlasTree = [...treeReach(A, new Set(['start', ...h.atlasTree.filter(id => A[id])]))].filter(id => id!=='start'); }
  if (h.asc){
    const A = ASC[h.asc.id];
    if (A && A.cls===h.cls){
      h.tree = (h.tree||[]).concat((h.asc.nodes||[]).map(n => A.skill + '_' + n));
      if (Array.isArray(h.skills) && !h.skills.includes(A.skill)) h.skills.unshift(A.skill);
    }
    delete h.asc;
  }
  if (h.tree){
    const T = treeFor(h.cls);
    h.tree = [...treeReach(T, new Set(['start', ...new Set(h.tree.filter(id => T[id]))]))].filter(id => id!=='start');
  }
}

/* ---------- Atlas tree ----------
   Endgame specialisation like Path of Exile's Atlas, one branch per mechanic. Each mechanic has a trunk and two sub-branches
   (two ways to play it) ending in keystones, so you commit to a mechanic and a style instead of taking everything.
   Points come from finishing each biome x tier of map for the first time (at most 40) and the tree has ~95 nodes. */
const AS = (pt, en, aff) => [$t(pt, en), aff];                      // small node
const AN = (pt, en, dpt, den, aff) => ({notable:$t(pt, en), d:$t(dpt, den), aff});
const AK = (pt, en, dpt, den, aff) => ({key:$t(pt, en), d:$t(dpt, den), aff});
const ATLAS_MECH = [
  {id:'f', name:$t('Fenda', 'Rift'), ang:90,
   trunk:[AS('+10% de Estilhaços da Fenda', '+10% Rift Shards', {aShards:1}), AS('+15% de chance de o evento ser uma Fenda', '+15% chance for the event to be a Rift', {aRiftW:1}),
     AS('Fendas duram +1 turno', 'Rifts last +1 turn', {aRift:1}), AS('+10% de Estilhaços da Fenda', '+10% Rift Shards', {aShards:1}),
     AN('Maestria da Fenda', 'Rift Mastery', 'A cada 2 abates perto da Fenda (em vez de 3) ela ganha +1 turno', 'Every 2 kills near the Rift (instead of 3) it gains +1 turn', {aRiftFast:1}),
     AS('+10% de Estilhaços da Fenda', '+10% Rift Shards', {aShards:1})],
   subs:[
    {name:$t('Abismo', 'Abyss'), nodes:[
      AS('Ao fechar a Fenda, +50% de bônus de Estilhaços', 'Closing the Rift gives +50% bonus Shards', {aRiftBonus:1}),
      AS('Crias de Torre e Rainha dão +2 Estilhaços', 'Rook and Queen spawn give +2 Shards', {aBigShard:1}),
      AS('Fendas duram +1 turno', 'Rifts last +1 turn', {aRift:1}),
      AN('Coração do Abismo', 'Heart of the Abyss', 'A Fenda pode ganhar até +6 turnos por abates (em vez de +3)', 'The Rift can gain up to +6 turns from kills (instead of +3)', {aRiftExt:1}),
      AS('+10% de Estilhaços da Fenda', '+10% Rift Shards', {aShards:1}),
      AS('Crias têm 8% de chance de deixar um item', 'Spawn have an 8% chance to drop an item', {aSpawnLoot:1}),
      AK('Fenda Sem Fundo', 'Bottomless Rift', 'A Fenda só se fecha depois de 3 turnos seguidos sem abates perto dela, e os Estilhaços valem +50%', 'The Rift only closes after 3 turns in a row without kills near it, and Shards are worth +50%', {kBottomless:1})]},
    {name:$t('Colapso', 'Collapse'), nodes:[
      AS('Cada onda solta +1 cria', 'Each wave releases +1 spawn', {aRiftSpawn:1}),
      AS('+10% de Estilhaços da Fenda', '+10% Rift Shards', {aShards:1}),
      AS('+1 Estilhaço por cria abatida', '+1 Shard per spawn killed', {aShardKill:1}),
      AN('Onda Dupla', 'Twin Wave', 'A Fenda se abre com +3 crias imediatas', 'The Rift opens with +3 immediate spawn', {aRiftOpen:1}),
      AS('+15% de chance de o evento ser uma Fenda', '+15% chance for the event to be a Rift', {aRiftW:1}),
      AS('Crias têm 15% de chance de ser elites (+3 Estilhaços)', 'Spawn have a 15% chance to be elites (+3 Shards)', {aSpawnElite:1}),
      AK('Colapso', 'Collapse', 'Fendas duram 2 turnos a menos, mas cada onda solta o dobro de crias', 'Rifts last 2 fewer turns, but each wave releases twice the spawn', {kCollapse:1})]}]},
  {id:'g', name:$t('Xeque-mate', 'Checkmate'), ang:150,
   trunk:[AS('+10% de chance de saque das peças marcadas', '+10% loot chance from marked pieces', {aMarked:1}), AS('+15% de chance de o evento ser uma Partida ou Exército', '+15% chance for the event to be a Match or Army', {aRiftW:-1}),
     AS('+10% de chance de saque das peças marcadas', '+10% loot chance from marked pieces', {aMarked:1}), AN('Gelo Espesso', 'Thick Ice', 'O gelo dura +1 turno', 'The ice lasts +1 turn', {aArmyTurns:1}),
     AS('+10% de chance de evento em cada andar', '+10% event chance on every floor', {aEvent:1}), AS('+10% de chance de saque das peças marcadas', '+10% loot chance from marked pieces', {aMarked:1})],
   subs:[
    {name:$t('Estratégia', 'Strategy'), nodes:[
      AS('+1 dica grátis por Partida (não conta como dica)', '+1 free hint per Match (does not count as a hint)', {aFreeHint:1}),
      AS('Resolver uma Partida dá +1 Selo de Xeque', 'Solving a Match gives +1 Check Seal', {aSeal:1}),
      AS('Resolver uma Partida dá +25 de ouro', 'Solving a Match gives +25 gold', {aMateGold:1}),
      AN('Mente Aberta', 'Open Mind', 'Resolver uma Partida sem dicas dá um item raro extra', 'Solving a Match without hints gives an extra rare item', {aNoHintItem:1}),
      AS('+10% de chance de evento em cada andar', '+10% event chance on every floor', {aEvent:1}),
      AS('Resolver uma Partida dá +25 de ouro', 'Solving a Match gives +25 gold', {aMateGold:1}),
      AK('Grande Mestre', 'Grandmaster', 'Partidas de mate em 3 ou mais lances também dão um item único da sua classe', 'Matches of mate in 3 or more also give a unique item for your class', {kGrandmaster:1})]},
    {name:$t('Exército', 'Army'), nodes:[
      AS('+10% de chance de saque das peças marcadas', '+10% loot chance from marked pieces', {aMarked:1}),
      AS('O gelo dura +1 turno', 'The ice lasts +1 turn', {aArmyTurns:1}),
      AS('Cada peça estilhaçada cura 2 de vida', 'Each shattered piece heals 2 health', {aShatterHeal:1}),
      AN('Quebra-Gelo', 'Icebreaker', 'Peças congeladas recebem +2 de dano seu', 'Frozen pieces take +2 damage from you', {aIceBreak:1}),
      AS('+10% de chance de saque das peças marcadas', '+10% loot chance from marked pieces', {aMarked:1}),
      AS('O Rei marcado dá +1 Selo de Xeque extra', 'The marked King gives +1 extra Check Seal', {aKingSeal:1}),
      AK('Inverno Eterno', 'Eternal Winter', 'O gelo dura +2 turnos, mas as peças congeladas recebem só +25% de dano (em vez de +50%)', 'The ice lasts +2 turns, but frozen pieces take only +25% damage (instead of +50%)', {kWinter:1})]}]},
  {id:'m', name:$t('Maré de Sangue', 'Blood Tide'), ang:210,
   trunk:[AS('+15% de Brasas de Sangue', '+15% Blood Embers', {aEmbers:1}), AS('+10% de chance de Arauto', '+10% Herald chance', {aHerald:1}),
     AS('+15% de Brasas de Sangue', '+15% Blood Embers', {aEmbers:1}), AN('Baú Barato', 'Cheap Chest', 'Baús Tormentosos custam 10 brasas a menos', 'Torment Chests cost 10 fewer embers', {aChestCost:1}),
     AS('+15% de Brasas de Sangue', '+15% Blood Embers', {aEmbers:1}), AS('A Maré dura +1 andar', 'The Tide lasts +1 floor', {aTideLen:1})],
   subs:[
    {name:$t('Caça ao Arauto', 'Herald Hunt'), nodes:[
      AS('Arautos deixam um item raro a mais', 'Heralds drop one more rare item', {aHeraldLoot:1}),
      AS('+10% de chance de Arauto', '+10% Herald chance', {aHerald:1}),
      AS('Arautos têm 15% menos de vida', 'Heralds have 15% less health', {aHeraldWeak:1}),
      AN('Fúria da Maré', 'Tide Wrath', 'A Fúria da Maré enche 30% mais rápido', 'The Tide\'s Wrath fills 30% faster', {aWrath:1}),
      AS('+15% de Brasas de Sangue', '+15% Blood Embers', {aEmbers:1}),
      AS('Baús Tormentosos têm +10% de chance de dar um único', 'Torment Chests have +10% chance to give a unique', {aChestUnique:1}),
      AK('Rainha de Sangue', 'Blood Queen', 'Cada Arauto derrotado abre um Baú Tormentoso de graça no lugar onde caiu', 'Every Herald you defeat opens a free Torment Chest where it fell', {kHeraldChest:1})]},
    {name:$t('Maré Alta', 'High Tide'), nodes:[
      AS('+15% de Brasas de Sangue', '+15% Blood Embers', {aEmbers:1}),
      AS('Cada vez, +1 poça de sangue sobe', 'Each time, +1 blood pool rises', {aPools:1}),
      AN('Sangue Seco', 'Dry Blood', 'Inimigos nas poças de sangue não regeneram vida', 'Enemies in blood pools do not regenerate health', {aDry:1}),
      AN('Banho de Sangue', 'Blood Bath', 'Você causa +2 de dano a inimigos que estão numa poça de sangue', 'You deal +2 damage to enemies standing in a blood pool', {aBloodBath:1}),
      AS('+15% de Brasas de Sangue', '+15% Blood Embers', {aEmbers:1}),
      AS('Abates em poças de sangue dão brasas x3 (em vez de x2)', 'Kills on blood pools give embers x3 (instead of x2)', {aBloodEmbers:1}),
      AK('Maré Sem Fim', 'Endless Tide', 'Todo andar de mapa tem a Maré de Sangue, além do evento normal', 'Every map floor has the Blood Tide, on top of the normal event', {kTide:1})]}]},
  {id:'h', name:$t('Horda', 'Horde'), ang:270,
   trunk:[AS('+10% de chance de Horda', '+10% Horde chance', {aHordeW:1}), AS('+2 turnos para o bônus da Horda', '+2 turns for the Horde bonus', {aHordePar:1}),
     AS('+10% de lacaios na Horda', '+10% Horde minions', {aHordeSize:1}), AN('Corneta de Guerra', 'War Horn', 'Destruir a Horda dá um baú a mais', 'Destroying the Horde gives one more chest', {aHordeChest:1}),
     AS('+10% de chance de Horda', '+10% Horde chance', {aHordeW:1}), AS('Lacaios dão +50% de ouro', 'Minions give +50% gold', {aMinionGold:1})],
   subs:[
    {name:$t('Massacre', 'Massacre'), nodes:[
      AS('+2 turnos para o bônus da Horda', '+2 turns for the Horde bonus', {aHordePar:1}),
      AS('A cada 10 lacaios mortos, +1 ação', 'Every 10 minions killed, +1 action', {aHordeAct:1}),
      AS('Cada lacaio morto cura 1 de vida', 'Each minion killed heals 1 health', {aHordeHeal:1}),
      AN('Ceifador', 'Reaper', 'Cada lacaio abatido reduz em 1 a recarga das habilidades (até 3 por turno)', 'Each minion killed lowers your skill cooldowns by 1 (up to 3 per turn)', {aHordeCdr:1}),
      AS('+10% de lacaios na Horda', '+10% Horde minions', {aHordeSize:1}),
      AS('+2 turnos para o bônus da Horda', '+2 turns for the Horde bonus', {aHordePar:1}),
      AK('Tsunami', 'Tsunami', 'Os lacaios explodem ao morrer: 1 de dano aos vizinhos, em cadeia', 'Minions explode when they die: 1 damage to their neighbors, in a chain', {kTsunami:1})]},
    {name:$t('Pilhagem', 'Plunder'), nodes:[
      AS('Lacaios dão +50% de ouro', 'Minions give +50% gold', {aMinionGold:1}),
      AS('Lacaios têm 3% de chance de deixar um item', 'Minions have a 3% chance to drop an item', {aHordeLoot:1}),
      AS('+10% de chance de Horda', '+10% Horde chance', {aHordeW:1}),
      AN('Saque da Horda', 'Horde Plunder', 'Destruir a Horda a tempo dá um item único da sua classe em vez de um raro', 'Destroying the Horde in time gives a unique item for your class instead of a rare', {aHordeUnique:1}),
      AS('Lacaios dão +50% de ouro', 'Minions give +50% gold', {aMinionGold:1}),
      AS('+10% de lacaios na Horda', '+10% Horde minions', {aHordeSize:1}),
      AK('Horda Eterna', 'Eternal Horde', 'Depois de destruir a Horda, uma segunda, com metade do tamanho, surge ao seu redor', 'After you destroy the Horde, a second one, half its size, rises around you', {kEternal:1})]}]}
];
// maps and bosses stay as single branches
const ATLAS_GENERAL = [
  {id:'p', name:$t('Mapas e Saque', 'Maps and Loot'), ang:330, nodes:[
    AS('+10% de itens nos mapas', '+10% items in maps', {aQuant:1}), AS('+20% de moedas de mapa', '+20% map currency', {aCurrency:1}),
    AS('+15% de chance de um mapa extra do chefe', '+15% chance of an extra map from the boss', {aMapDrop:1}),
    AN('Cartógrafo', 'Cartographer', '+10% de chance de o mapa do chefe subir de nível e +10% de chance de evento em cada andar', '+10% chance for the boss\'s map to go up a tier and +10% event chance on every floor', {aTierUp:1, aEvent:1}),
    AS('+10% de itens nos mapas', '+10% items in maps', {aQuant:1}), AS('+20% de moedas de mapa', '+20% map currency', {aCurrency:1}),
    AK('Mapas Perigosos', 'Dangerous Maps', 'Todo mapa ganha +1 afixo de dificuldade e +1 afixo de recompensa', 'Every map gains +1 difficulty affix and +1 reward affix', {kDanger:1})]},
  {id:'b', name:$t('Chefes', 'Bosses'), ang:30, nodes:[
    AS('+20% de ouro dos chefes de mapa', '+20% gold from map bosses', {aBossGold:1}), AS('+10% de itens nos mapas', '+10% items in maps', {aQuant:1}),
    AS('+20% de ouro dos chefes de mapa', '+20% gold from map bosses', {aBossGold:1}),
    AN('Tesouro Real', 'Royal Treasure', 'Chefes de mapa oferecem +1 relíquia para escolher', 'Map bosses offer +1 relic to choose from', {aRelic:1}),
    AS('+20% de ouro dos chefes de mapa', '+20% gold from map bosses', {aBossGold:1}), AS('Chefes de mapa deixam +1 moeda de mapa', 'Map bosses drop +1 map currency', {aBossCur:1}),
    AK('Duelo', 'Duel', 'Chefes de mapa têm +30% de vida, mas oferecem mais uma relíquia e deixam duas runas extras', 'Map bosses have +30% health, but offer one more relic and drop two extra runes', {kDuel:1})]}
];
// layout: trunk straight out along the branch angle, the two sub-branches fan out from its end
const ATLAS_R0 = 1.8, ATLAS_STEP = 1.25;
function buildAtlas(){
  const T = {start:{id:'start', x:0, y:0, kind:'start', name:$t('Origem', 'Origin'), d:$t('Ponto de partida.', 'Starting point.'), aff:{}, links:[]}};
  const labels = [];
  const put = (id, spec, x, y, branch, prev) => {
    const node = Array.isArray(spec) ? {id, kind:'small', name:spec[0], d:spec[0], aff:spec[1]} : {id, kind:spec.key ? 'key' : 'notable', name:spec.key || spec.notable, d:spec.d, aff:spec.aff};
    Object.assign(node, {x, y, branch, links:[prev]}); T[id] = node; T[prev].links.push(id);
  };
  const line = (ids, specs, x0, y0, ang, branch, prev, zig) => {
    let x = x0, y = y0; const a = ang*Math.PI/180;
    specs.forEach((sp, i) => {
      x += Math.cos(a)*ATLAS_STEP; y -= Math.sin(a)*ATLAS_STEP;
      const w = zig ? (i%2 ? .3 : -.3) : 0;
      put(ids[i], sp, x - Math.sin(a)*w, y - Math.cos(a)*w, branch, prev); prev = ids[i];
    });
    return [x, y];
  };
  for (const m of ATLAS_MECH){
    const a = m.ang*Math.PI/180, x0 = Math.cos(a)*ATLAS_R0, y0 = -Math.sin(a)*ATLAS_R0;
    const ids = m.trunk.map((_, i) => m.id + i);
    const [ex, ey] = line(ids, m.trunk, x0 - Math.cos(a)*ATLAS_STEP, y0 + Math.sin(a)*ATLAS_STEP, m.ang, m.name, 'start', true);
    { const r = ATLAS_R0 + 2.2*ATLAS_STEP; labels.push({name:m.name, x:Math.cos(a)*r + Math.sin(a)*1.9, y:-Math.sin(a)*r + Math.cos(a)*1.9, main:true}); }
    m.subs.forEach((sub, j) => {
      const ang = m.ang + (j ? -1 : 1)*34, sid = m.id + (j ? 'b' : 'a');
      const [fx, fy] = line(sub.nodes.map((_, i) => sid + i), sub.nodes, ex, ey, ang, sub.name, ids[ids.length-1], true);
      labels.push({name:sub.name, x:fx + Math.cos(ang*Math.PI/180)*2.7, y:fy - Math.sin(ang*Math.PI/180)*2.7});
    });
  }
  for (const g of ATLAS_GENERAL){
    const a = g.ang*Math.PI/180, ids = g.nodes.map((_, i) => g.id + i);
    const [ex, ey] = line(ids, g.nodes, Math.cos(a)*(ATLAS_R0 - ATLAS_STEP), -Math.sin(a)*(ATLAS_R0 - ATLAS_STEP), g.ang, g.name, 'start', true);
    labels.push({name:g.name, x:ex + Math.cos(a)*2.7, y:ey - Math.sin(a)*2.7});
  }
  return {T, labels};
}
let atlasCache = null;
const atlasBuilt = () => atlasCache || (atlasCache = buildAtlas());
const atlasTree = () => atlasBuilt().T;
const atlasLabels = () => atlasBuilt().labels;
const atlasPoints = h => Object.keys(h.atlas||{}).length - (h.atlasTree||[]).length;
const canLearnAtlas = (h, id) => { const p = gPath('atlas', h, id); return p.length>0 && p.length <= atlasPoints(h); };
// sum of an Atlas effect over the learned nodes; the Atlas only acts inside maps
function atlasRank(k){
  if (typeof S==='undefined' || !S || !S.exp || S.exp.kind!=='map' || !HERO) return 0;
  const t = atlasTree();
  return (HERO.atlasTree||[]).reduce((sum, id) => sum + ((t[id] && t[id].aff[k]) || 0), 0);
}
