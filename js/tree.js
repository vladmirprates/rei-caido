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
function buildTree(branches, nodesOf){
  const nodes = {start:{id:'start', x:0, y:0, kind:'start', name:$t('Origem', 'Origin'), d:$t('Ponto de partida.', 'Starting point.'), aff:[], links:[]}};
  for (const br of branches){
    const list = nodesOf(br);
    const a = br.ang*Math.PI/180;
    let prev = 'start';
    list.forEach((n, i) => {
      const id = br.id + i, r = 1.3 + i*1.05;
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
function treeFor(cls){
  return treeCache[cls] || (treeCache[cls] = buildTree(TREE_BRANCHES, br => br.nodes==='class' ? classNodes(cls) : br.nodes));
}
const treePoints = h => (h.level-1) - (h.tree||[]).length;
function canLearn(h, id){
  const t = treeFor(h.cls), n = t[id], learned = new Set(['start', ...(h.tree||[])]);
  return n && !learned.has(id) && treePoints(h)>0 && n.links.some(l => learned.has(l));
}

/* ---------- Atlas tree ----------
   Endgame specialisation like Path of Exile's Atlas: one branch per mechanic. Points come from
   finishing each biome x tier of map for the first time. Effects apply inside maps. */
const ATLAS_BRANCHES = [
  {id:'f', name:$t('Fenda', 'Rift'), ang:90, nodes:[
    [$t('+10% de Estilhaços da Fenda', '+10% Rift Shards'), {aShards:1}],
    [$t('+15% de chance de o evento ser uma Fenda', '+15% chance for the event to be a Rift'), {aRiftW:1}],
    [$t('+10% de Estilhaços da Fenda', '+10% Rift Shards'), {aShards:1}],
    {notable:$t('Fenda Profunda', 'Deep Rift'), d:$t('Fendas duram +1 turno', 'Rifts last +1 turn'), aff:{aRift:1}},
    [$t('+10% de Estilhaços da Fenda', '+10% Rift Shards'), {aShards:1}],
    [$t('+15% de chance de o evento ser uma Fenda', '+15% chance for the event to be a Rift'), {aRiftW:1}],
    {key:$t('Colapso', 'Collapse'), d:$t('Fendas duram 2 turnos a menos, mas cada onda solta o dobro de crias', 'Rifts last 2 fewer turns, but each wave releases twice the spawn'), aff:{kCollapse:1}}]},
  {id:'g', name:$t('Exército Congelado', 'Frozen Army'), ang:162, nodes:[
    [$t('+10% de chance de saque das peças marcadas', '+10% loot chance from marked pieces'), {aMarked:1}],
    [$t('+15% de chance de o evento ser um Exército', '+15% chance for the event to be an Army'), {aRiftW:-1}],
    [$t('+10% de chance de saque das peças marcadas', '+10% loot chance from marked pieces'), {aMarked:1}],
    {notable:$t('Gelo Espesso', 'Thick Ice'), d:$t('O gelo dura +1 turno', 'The ice lasts +1 turn'), aff:{aArmyTurns:1}},
    [$t('+10% de chance de saque das peças marcadas', '+10% loot chance from marked pieces'), {aMarked:1}],
    [$t('+10% de chance de evento em cada andar', '+10% event chance on every floor'), {aEvent:1}],
    {key:$t('Inverno Eterno', 'Eternal Winter'), d:$t('O gelo dura +2 turnos, mas as peças congeladas recebem só +25% de dano (em vez de +50%)', 'The ice lasts +2 turns, but frozen pieces take only +25% damage (instead of +50%)'), aff:{kWinter:1}}]},
  {id:'m', name:$t('Maré de Sangue', 'Blood Tide'), ang:234, nodes:[
    [$t('+15% de Brasas de Sangue', '+15% Blood Embers'), {aEmbers:1}],
    [$t('+10% de chance de Arauto', '+10% Herald chance'), {aHerald:1}],
    [$t('+15% de Brasas de Sangue', '+15% Blood Embers'), {aEmbers:1}],
    {notable:$t('Baú Barato', 'Cheap Chest'), d:$t('Baús Tormentosos custam 10 brasas a menos', 'Torment Chests cost 10 fewer embers'), aff:{aChestCost:1}},
    [$t('+15% de Brasas de Sangue', '+15% Blood Embers'), {aEmbers:1}],
    [$t('+10% de chance de Arauto', '+10% Herald chance'), {aHerald:1}],
    {key:$t('Maré Sem Fim', 'Endless Tide'), d:$t('Todo andar de mapa tem a Maré de Sangue, além do evento normal', 'Every map floor has the Blood Tide, on top of the normal event'), aff:{kTide:1}}]},
  {id:'p', name:$t('Mapas e Saque', 'Maps and Loot'), ang:306, nodes:[
    [$t('+10% de itens nos mapas', '+10% items in maps'), {aQuant:1}],
    [$t('+20% de moedas de mapa', '+20% map currency'), {aCurrency:1}],
    [$t('+15% de chance de um mapa extra do chefe', '+15% chance of an extra map from the boss'), {aMapDrop:1}],
    {notable:$t('Cartógrafo', 'Cartographer'), d:$t('+10% de chance de o mapa do chefe subir de nível e +10% de chance de evento em cada andar', '+10% chance for the boss\'s map to go up a tier and +10% event chance on every floor'), aff:{aTierUp:1, aEvent:1}},
    [$t('+10% de itens nos mapas', '+10% items in maps'), {aQuant:1}],
    [$t('+20% de moedas de mapa', '+20% map currency'), {aCurrency:1}],
    {key:$t('Mapas Perigosos', 'Dangerous Maps'), d:$t('Todo mapa ganha +1 afixo de dificuldade e +1 afixo de recompensa', 'Every map gains +1 difficulty affix and +1 reward affix'), aff:{kDanger:1}}]},
  {id:'b', name:$t('Chefes', 'Bosses'), ang:18, nodes:[
    [$t('+20% de ouro dos chefes de mapa', '+20% gold from map bosses'), {aBossGold:1}],
    [$t('+10% de itens nos mapas', '+10% items in maps'), {aQuant:1}],
    [$t('+20% de ouro dos chefes de mapa', '+20% gold from map bosses'), {aBossGold:1}],
    {notable:$t('Tesouro Real', 'Royal Treasure'), d:$t('Chefes de mapa oferecem +1 relíquia para escolher', 'Map bosses offer +1 relic to choose from'), aff:{aRelic:1}},
    [$t('+20% de ouro dos chefes de mapa', '+20% gold from map bosses'), {aBossGold:1}],
    [$t('Chefes de mapa deixam +1 moeda de mapa', 'Map bosses drop +1 map currency'), {aBossCur:1}],
    {key:$t('Duelo', 'Duel'), d:$t('Chefes de mapa têm +30% de vida, mas oferecem mais uma relíquia e deixam duas runas extras', 'Map bosses have +30% health, but offer one more relic and drop two extra runes'), aff:{kDuel:1}}]}
];
let atlasCache = null;
const atlasTree = () => atlasCache || (atlasCache = buildTree(ATLAS_BRANCHES, br => br.nodes));
const atlasPoints = h => Object.keys(h.atlas||{}).length - (h.atlasTree||[]).length;
function canLearnAtlas(h, id){
  const t = atlasTree(), n = t[id], learned = new Set(['start', ...(h.atlasTree||[])]);
  return n && !learned.has(id) && atlasPoints(h)>0 && n.links.some(l => learned.has(l));
}
// sum of an Atlas effect over the learned nodes; the Atlas only acts inside maps
function atlasRank(k){
  if (typeof S==='undefined' || !S || !S.exp || S.exp.kind!=='map' || !HERO) return 0;
  const t = atlasTree();
  return (HERO.atlasTree||[]).reduce((sum, id) => sum + ((t[id] && t[id].aff[k]) || 0), 0);
}
