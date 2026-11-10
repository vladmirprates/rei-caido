/* Rei Caído — passive tree (replaces the old talents).
   One point per hero level. A node can be learned when it touches the start or a learned node.
   Small nodes give numbers; notables give rules; keystones are big trade-offs at the end of a branch. */

// [label, affixes] = small node; {notable|key, d, aff} = big node
const TREE_BRANCHES = [
  {id:'o', name:'Ofensiva', ang:200, nodes:[
    ['+1 de dano', [{k:'dmg',v:1}]],
    ['+5% de crítico', [{k:'crit',v:5}]],
    ['+1 de dano', [{k:'dmg',v:1}]],
    {notable:'Fúria', d:'+2 de dano com menos da metade da vida', aff:[{k:'fury'}]},
    ['+10% de dano contra elites e chefes', [{k:'eliteDmg',v:10}]],
    ['+5% de crítico', [{k:'crit',v:5}]],
    ['+1 de dano', [{k:'dmg',v:1}]],
    {key:'Gambito', d:'Começa cada andar com no máximo metade da vida, mas causa +3 de dano', aff:[{k:'gambit'}]}]},
  {id:'d', name:'Defesa', ang:340, nodes:[
    ['+4 de vida máxima', [{k:'hp',v:4}]],
    ['+1 de escudo por andar', [{k:'shield',v:1}]],
    ['+4 de vida máxima', [{k:'hp',v:4}]],
    {notable:'Muralha Viva', d:'Começa cada andar com +6 de escudo', aff:[{k:'bulwark'}]},
    ['+5% de bloqueio', [{k:'block',v:5}]],
    ['+4 de vida máxima', [{k:'hp',v:4}]],
    ['+5% de bloqueio', [{k:'block',v:5}]],
    {key:'Égide Eterna', d:'O primeiro golpe que você recebe em cada andar é anulado', aff:[{k:'aegisFirst'}]}]},
  {id:'u', name:'Fortuna', ang:270, nodes:[
    ['+15% de ouro', [{k:'gold',v:15}]],
    ['+10% de achado de itens', [{k:'mf',v:10}]],
    ['Cura 1 ao matar', [{k:'healKill',v:1}]],
    {notable:'Foco', d:'Habilidades recarregam 1 turno mais rápido', aff:[{k:'cdr',v:1}]},
    ['+10% de achado de itens', [{k:'mf',v:10}]],
    ['+15% de ouro', [{k:'gold',v:15}]],
    {key:'Ceifa', d:'Ao abater, ganha +1 ação (máx. 2 por turno)', aff:[{k:'chain'}]}]},
  {id:'e', name:'Elementos', ang:130, nodes:[
    ['+10% de resistência a fogo', [{k:'resFire',v:10}]],
    ['+10% de resistência a gelo', [{k:'resCold',v:10}]],
    ['+10% de resistência a raio', [{k:'resLight',v:10}]],
    {notable:'Prisma', d:'+1 de dano de fogo, de gelo e de raio', aff:[{k:'fireDmg',v:1},{k:'coldDmg',v:1},{k:'lightDmg',v:1}]},
    ['+8% de todas as resistências', [{k:'resFire',v:8},{k:'resCold',v:8},{k:'resLight',v:8}]],
    ['+8% de todas as resistências', [{k:'resFire',v:8},{k:'resCold',v:8},{k:'resLight',v:8}]],
    {key:'Represália', d:'Ao ser atingido, seu próximo golpe causa +3', aff:[{k:'reprisal'}]}]},
  {id:'c', name:'Classe', ang:60, nodes:'class'}
];
// class branch: small nodes plus the two old class talents as notables, and a class keystone
const CLASS_KEYS = {
  N:{key:'Salto Longo', d:'Também salta em 3x1', aff:[{k:'longJump'}]},
  R:{key:'Investida Perfurante', d:'A investida atinge todos os inimigos na linha até a parede', aff:[{k:'pierce'}]},
  B:{key:'Disparo Perfurante', d:'O ataque à distância atravessa o primeiro inimigo e atinge o seguinte', aff:[{k:'pierceShot'}]},
  Q:{key:'Xeque-mate', d:'Inimigos que ficam com menos de 3 de vida após seu golpe morrem', aff:[{k:'execute'}]},
  K:{key:'Exército Robusto', d:'Peões aliados têm +3 de vida e +1 de dano', aff:[{k:'sturdyPawns'}]}
};
function classNodes(cls){
  const [t1, t2] = TALENTS_CLASS[cls];
  return [
    ['+1 de dano', [{k:'dmg',v:1}]],
    ['+4 de vida máxima', [{k:'hp',v:4}]],
    {notable:t1.name, d:t1.desc(1), aff:t1.aff(1)},
    ['+1 de dano', [{k:'dmg',v:1}]],
    ['+4 de vida máxima', [{k:'hp',v:4}]],
    {notable:t2.name, d:t2.desc(1), aff:t2.aff(1)},
    ['+5% de crítico', [{k:'crit',v:5}]],
    CLASS_KEYS[cls]
  ];
}
// flatten into nodes with positions and links (cached per class)
const treeCache = {};
// builds a radial tree: every branch is a path from the start; big nodes keep their names as labels
function buildTree(branches, nodesOf){
  const nodes = {start:{id:'start', x:0, y:0, kind:'start', name:'Origem', d:'Ponto de partida.', aff:[], links:[]}};
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
  {id:'f', name:'Fenda', ang:90, nodes:[
    ['+10% de Estilhaços da Fenda', {aShards:1}],
    ['+15% de chance de o evento ser uma Fenda', {aRiftW:1}],
    ['+10% de Estilhaços da Fenda', {aShards:1}],
    {notable:'Fenda Profunda', d:'Fendas duram +1 turno', aff:{aRift:1}},
    ['+10% de Estilhaços da Fenda', {aShards:1}],
    ['+15% de chance de o evento ser uma Fenda', {aRiftW:1}],
    {key:'Colapso', d:'Fendas duram 2 turnos a menos, mas cada onda solta o dobro de crias', aff:{kCollapse:1}}]},
  {id:'g', name:'Exército Congelado', ang:162, nodes:[
    ['+10% de chance de saque das peças marcadas', {aMarked:1}],
    ['+15% de chance de o evento ser um Exército', {aRiftW:-1}],
    ['+10% de chance de saque das peças marcadas', {aMarked:1}],
    {notable:'Gelo Espesso', d:'O gelo dura +1 turno', aff:{aArmyTurns:1}},
    ['+10% de chance de saque das peças marcadas', {aMarked:1}],
    ['+10% de chance de evento em cada andar', {aEvent:1}],
    {key:'Inverno Eterno', d:'O gelo dura +2 turnos, mas as peças congeladas recebem só +25% de dano (em vez de +50%)', aff:{kWinter:1}}]},
  {id:'m', name:'Maré de Sangue', ang:234, nodes:[
    ['+15% de Brasas de Sangue', {aEmbers:1}],
    ['+10% de chance de Arauto', {aHerald:1}],
    ['+15% de Brasas de Sangue', {aEmbers:1}],
    {notable:'Baú Barato', d:'Baús Tormentosos custam 10 brasas a menos', aff:{aChestCost:1}},
    ['+15% de Brasas de Sangue', {aEmbers:1}],
    ['+10% de chance de Arauto', {aHerald:1}],
    {key:'Maré Sem Fim', d:'Todo andar de mapa tem a Maré de Sangue, além do evento normal', aff:{kTide:1}}]},
  {id:'p', name:'Mapas e Saque', ang:306, nodes:[
    ['+10% de itens nos mapas', {aQuant:1}],
    ['+20% de moedas de mapa', {aCurrency:1}],
    ['+15% de chance de um mapa extra do chefe', {aMapDrop:1}],
    {notable:'Cartógrafo', d:'+10% de chance de o mapa do chefe subir de nível e +10% de chance de evento em cada andar', aff:{aTierUp:1, aEvent:1}},
    ['+10% de itens nos mapas', {aQuant:1}],
    ['+20% de moedas de mapa', {aCurrency:1}],
    {key:'Mapas Perigosos', d:'Todo mapa ganha +1 afixo de dificuldade e +1 afixo de recompensa', aff:{kDanger:1}}]},
  {id:'b', name:'Chefes', ang:18, nodes:[
    ['+20% de ouro dos chefes de mapa', {aBossGold:1}],
    ['+10% de itens nos mapas', {aQuant:1}],
    ['+20% de ouro dos chefes de mapa', {aBossGold:1}],
    {notable:'Tesouro Real', d:'Chefes de mapa oferecem +1 relíquia para escolher', aff:{aRelic:1}},
    ['+20% de ouro dos chefes de mapa', {aBossGold:1}],
    ['Chefes de mapa deixam +1 moeda de mapa', {aBossCur:1}],
    {key:'Duelo', d:'Chefes de mapa têm +30% de vida, mas oferecem mais uma relíquia e deixam duas runas extras', aff:{kDuel:1}}]}
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
