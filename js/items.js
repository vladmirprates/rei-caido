/* Rei Caído — items, uniques, endgame maps */

const SLOTS = {
  arma:{label:'Arma', bases:['Lança','Espada','Maça','Cetro']},
  elmo:{label:'Elmo', bases:['Elmo','Capuz','Diadema','Máscara']},
  armadura:{label:'Armadura', bases:['Cota','Couraça','Gibão','Manto']},
  botas:{label:'Botas', bases:['Botas','Grevas','Sapatos','Sandálias']},
  anel:{label:'Anel', bases:['Anel','Selo','Aliança','Amuleto']}
};
const RAR = {common:{label:'Comum', c:'#cfc6b6'}, magic:{label:'Mágico', c:'#8aa4ff'}, rare:{label:'Raro', c:'#ecd36a'}, legend:{label:'Único', c:'#f08a3c'}};
const AFX = {
  dmg:{t:v=>`+${v} de dano`, suf:'da Ruína'},
  hp:{t:v=>`+${v} de vida máxima`, suf:'do Bastião'},
  shield:{t:v=>`+${v} de escudo por andar`, suf:'da Égide'},
  cdr:{t:v=>`Habilidades recarregam ${v} turno mais rápido`, suf:'do Vento'},
  crit:{t:v=>`${v}% de chance de crítico (golpe ×1,5)`, suf:'da Fúria'},
  eliteDmg:{t:v=>`+${v}% de dano contra elites e chefes`, suf:'do Algoz'},
  block:{t:v=>`${v}% de chance de bloquear metade de um golpe`, suf:'da Muralha'},
  healKill:{t:v=>`Cura ${v} ao matar`, suf:'da Colheita'},
  mf:{t:v=>`+${v}% de achado de itens`, suf:'da Fortuna'},
  gold:{t:v=>`+${v}% de ouro`, suf:'da Cobiça'},
  fireDmg:{t:v=>`+${v} de dano de fogo`, suf:'das Brasas'},
  coldDmg:{t:v=>`+${v} de dano de gelo`, suf:'do Inverno'},
  lightDmg:{t:v=>`+${v} de dano de raio`, suf:'da Tempestade'},
  resFire:{t:v=>`+${v}% de resistência a fogo`, suf:'da Salamandra'},
  resCold:{t:v=>`+${v}% de resistência a gelo`, suf:'do Urso'},
  resLight:{t:v=>`+${v}% de resistência a raio`, suf:'do Para-raios'},
  chain:{t:()=>'Ceifa: ao abater, ganha +1 ação (máx. 2 por turno)', suf:'da Ceifa', rule:true},
  trample:{t:()=>'Ao pousar, causa 1 de dano aos vizinhos', suf:'do Pisoteio', rule:true},
  vamp:{t:()=>'Abates curam 2 de vida', suf:'do Sangue', rule:true},
  thorns:{t:()=>'Quem te acerta leva 2 de dano', suf:'dos Espinhos', rule:true},
  longJump:{t:()=>'Também salta em 3x1', rule:true},
  darkQuake:{t:()=>'Salto Sísmico causa +3 de dano', rule:true},
  fork:{t:()=>'Garfo: o golpe também atinge, com metade do dano, um inimigo a um salto em L de onde você termina', rule:true},
  cavalry:{t:()=>'Galope recarrega 2 turnos mais rápido e o próximo golpe causa +2', rule:true},
  aegisFirst:{t:()=>'O primeiro golpe que você recebe em cada andar é anulado', rule:true},
  pushPower:{t:()=>'Empurrão causa +3 de dano em quem bate em algo', rule:true},
  fortify:{t:()=>'Muralha dá +4 de escudo', rule:true},
  ram:{t:()=>'Se a investida não matar, o inimigo é empurrado 1 casa e fica atordoado', rule:true},
  pierce:{t:()=>'Perfurar: a investida atinge todos os inimigos na linha até a parede', rule:true},
  castle:{t:()=>'Roque: atacar um inimigo que sobrevive troca vocês de lugar e o atordoa', rule:true},
  lineGuard:{t:()=>'Ataques em linha causam metade do dano em você', rule:true},
  granite:{t:()=>'Se você não se moveu no turno: +2 de dano e recebe 1 a menos', rule:true},
  crossBeam:{t:()=>'Raio também atinge as linhas retas', rule:true},
  pierceShot:{t:()=>'O ataque à distância atravessa o primeiro inimigo e atinge o seguinte', rule:true},
  stainedGlass:{t:()=>'Troca de Cor também dá 4 de escudo', rule:true},
  pilgrim:{t:()=>'Também anda 2 casas em linha reta, trocando a cor da casa', rule:true},
  rosary:{t:()=>'Cada abate com o Raio reduz a recarga do Raio em 1', rule:true},
  censer:{t:()=>'Trilha: casas por onde você desliza queimam por 2 turnos e causam 1 a inimigos nelas', rule:true},
  holy:{t:()=>'Troca de Cor cura 4', rule:true},
  fury:{t:()=>'+2 de dano com menos da metade da vida', rule:true},
  bladeStorm:{t:()=>'Tempestade de Lâminas causa +3 de dano', rule:true},
  check:{t:()=>'Xeque: inimigos que você ataca e não mata ficam atordoados', rule:true},
  mirror:{t:()=>'O primeiro dano que você recebe por turno volta para o atacante', rule:true},
  escape:{t:()=>'Fuga Real: depois de matar, pode se mover de novo, sem atacar (1 vez por turno)', rule:true},
  redSacrifice:{t:()=>'Sacrifício custa 1 de vida em vez de 3 e dá +1 de dano no turno', rule:true},
  gambit:{t:()=>'Gambito: começa cada andar com no máximo metade da vida, mas causa +3 de dano', rule:true},
  twinSummon:{t:()=>'Convocar cria dois peões', rule:true},
  sturdyPawns:{t:()=>'Peões aliados têm +3 de vida e +1 de dano', rule:true},
  freeSwap:{t:()=>'Uma vez por turno, trocar de lugar com um aliado não gasta ação', rule:true},
  earlyPromo:{t:()=>'Peões aliados promovem a rainha já na metade do tabuleiro', rule:true},
  martyr:{t:()=>'Quando um aliado morre, você cura 3 e ganha 2 de escudo', rule:true},
  banner:{t:()=>'Aliados ao seu lado causam +1 de dano e recebem 1 a menos', rule:true},
  kingStep:{t:()=>'Pode andar 1 casa em qualquer direção', rule:true},
  execute:{t:()=>'Xeque-mate: inimigos que ficam com menos de 3 de vida após seu golpe morrem', rule:true}
};
const GENERIC_RULES = ['chain','trample','vamp','thorns'];

/* Uniques: only bosses (and the daily challenge) give them. Each boss carries part of the class pool, so they can be hunted. */
const UNIQUES = [
  {cls:['N'], slot:'elmo', name:'Elmo do Cavalo Sombrio', affixes:[{k:'darkQuake'},{k:'trample'}]},
  {cls:['N'], slot:'botas', name:'Ferraduras do Abismo', affixes:[{k:'longJump'},{k:'hp',v:3}]},
  {cls:['N'], slot:'arma', name:'Lança do Garfo', affixes:[{k:'fork'},{k:'dmg',v:1}]},
  {cls:['N'], slot:'anel', name:'Rédeas de Sangue', affixes:[{k:'chain'},{k:'hp',v:4}]},
  {cls:['N'], slot:'anel', name:'Selo da Cavalaria', affixes:[{k:'cavalry'},{k:'dmg',v:1}]},
  {cls:['N'], slot:'armadura', name:'Barda de Obsidiana', affixes:[{k:'aegisFirst'},{k:'hp',v:6}]},
  {cls:['R'], slot:'botas', name:'Grevas da Fortaleza', affixes:[{k:'pushPower'},{k:'fortify'}]},
  {cls:['R'], slot:'arma', name:'Aríete de Ferro Negro', affixes:[{k:'ram'},{k:'dmg',v:1}]},
  {cls:['R'], slot:'anel', name:'Anel da Fileira', affixes:[{k:'pierce'}]},
  {cls:['R'], slot:'elmo', name:'Elmo do Roque', affixes:[{k:'castle'},{k:'hp',v:4}]},
  {cls:['R'], slot:'armadura', name:'Placas da Muralha Viva', affixes:[{k:'lineGuard'},{k:'hp',v:4}]},
  {cls:['R'], slot:'armadura', name:'Base de Granito', affixes:[{k:'granite'},{k:'shield',v:2}]},
  {cls:['B'], slot:'elmo', name:'Mitra do Raio Cruzado', affixes:[{k:'crossBeam'},{k:'dmg',v:1}]},
  {cls:['B'], slot:'arma', name:'Báculo da Diagonal Longa', affixes:[{k:'pierceShot'},{k:'dmg',v:1}]},
  {cls:['B'], slot:'armadura', name:'Vitral Sagrado', affixes:[{k:'stainedGlass'},{k:'holy'}]},
  {cls:['B'], slot:'botas', name:'Sandálias do Peregrino', affixes:[{k:'pilgrim'},{k:'hp',v:3}]},
  {cls:['B'], slot:'anel', name:'Rosário de Ossos', affixes:[{k:'rosary'},{k:'hp',v:3}]},
  {cls:['B'], slot:'arma', name:'Incensário Profano', affixes:[{k:'censer'}]},
  {cls:['Q'], slot:'elmo', name:'Coroa da Rainha de Vidro', affixes:[{k:'fury'},{k:'bladeStorm'}]},
  {cls:['Q'], slot:'arma', name:'Cetro do Xeque', affixes:[{k:'check'},{k:'dmg',v:1}]},
  {cls:['Q'], slot:'armadura', name:'Vestido de Espelhos', affixes:[{k:'mirror'},{k:'hp',v:3}]},
  {cls:['Q'], slot:'botas', name:'Sapatilhas da Fuga Real', affixes:[{k:'escape'}]},
  {cls:['Q'], slot:'anel', name:'Anel do Sacrifício Rubro', affixes:[{k:'redSacrifice'},{k:'hp',v:2}]},
  {cls:['Q'], slot:'arma', name:'Lâmina do Gambito', affixes:[{k:'gambit'}]},
  {cls:['K'], slot:'arma', name:'Cetro do Rei Louco', affixes:[{k:'twinSummon'},{k:'dmg',v:1}]},
  {cls:['K'], slot:'elmo', name:'Coroa da Guarda', affixes:[{k:'sturdyPawns'},{k:'hp',v:3}]},
  {cls:['K'], slot:'armadura', name:'Manto do Roque', affixes:[{k:'freeSwap'},{k:'hp',v:4}]},
  {cls:['K'], slot:'botas', name:'Botas da Promoção', affixes:[{k:'earlyPromo'}]},
  {cls:['K'], slot:'anel', name:'Anel do Mártir', affixes:[{k:'martyr'},{k:'hp',v:3}]},
  {cls:['K'], slot:'anel', name:'Estandarte Real', affixes:[{k:'banner'}]},
  {cls:null, slot:'arma', name:'Lâmina da Corrente Rubra', affixes:[{k:'chain'},{k:'dmg',v:2}]},
  {cls:null, slot:'anel', name:'Anel da Sede Negra', affixes:[{k:'vamp'},{k:'thorns'}]},
  {cls:['N','R'], slot:'botas', name:'Botas do Peão Ancestral', affixes:[{k:'kingStep'},{k:'shield',v:2}]},
  {cls:null, slot:'armadura', name:'Peitoral do Xeque-Mate', affixes:[{k:'execute'},{k:'hp',v:8}]}
];
// how a boss turns the relic it wields into a power
const BOSS_ITEM_MAP = {
  chain:'double', vamp:'vamp', thorns:'thorns', trample:'trample', twinSummon:'fastSummon', bladeStorm:'double',
  darkQuake:'trample', pushPower:'armor', fortify:'armor', holy:'regen', fury:'double', longJump:'swift',
  kingStep:'swift', fork:'double', cavalry:'swift', aegisFirst:'armor', ram:'armor', pierce:'double',
  castle:'armor', lineGuard:'armor', granite:'armor', crossBeam:'double', pierceShot:'double', stainedGlass:'regen',
  pilgrim:'swift', rosary:'regen', censer:'trample', check:'double', mirror:'thorns', escape:'swift',
  redSacrifice:'vamp', gambit:'double', sturdyPawns:'armor', freeSwap:'swift', earlyPromo:'fastSummon',
  martyr:'regen', banner:'armor', execute:'double'
};

/* ---------- Item level and affix tiers ----------
   An item's level is the area level where it dropped (+3 per Torment level).
   Each affix has 5 tiers; the item level decides the highest tier it can roll. */
const TIER_ILVL = [1, 5, 10, 18, 28];
const maxTier = ilvl => TIER_ILVL.filter(t => ilvl >= t).length;
// where each affix can roll and its [min,max] per tier (null = not at that tier)
const POOL = {
  dmg:     {slots:{arma:[[1,1],[1,2],[2,3],[3,4],[4,5]], anel:[null,null,[1,1],[1,2],[2,2]]}},
  crit:    {slots:['arma','anel','elmo'], t:[[5,5],[8,8],[12,12],[16,16],[20,20]]},
  eliteDmg:{slots:['arma','anel'], t:[[10,10],[15,15],[20,20],[25,25],[30,30]]},
  hp:      {slots:['armadura','elmo','botas'], t:[[3,4],[5,6],[6,8],[8,10],[10,12]]},
  shield:  {slots:['armadura','elmo'], t:[[1,1],[1,2],[2,3],[3,3],[3,4]]},
  block:   {slots:['armadura','botas'], t:[[5,5],[8,8],[10,10],[13,13],[15,15]]},
  healKill:{slots:['arma','anel'], t:[[1,1],[1,1],[1,2],[2,2],[2,3]]},
  cdr:     {slots:['elmo','anel'], t:[null,null,[1,1],[1,1],[1,1]]},
  mf:      {slots:['anel','elmo','botas'], t:[[10,10],[15,15],[20,20],[30,30],[40,40]]},
  gold:    {slots:['arma','elmo','armadura','botas','anel'], t:[[15,15],[25,25],[35,35],[45,45],[60,60]]},
  fireDmg: {slots:['arma','anel'], t:[[1,1],[1,2],[2,2],[2,3],[3,4]]},
  coldDmg: {slots:['arma','anel'], t:[[1,1],[1,2],[2,2],[2,3],[3,4]]},
  lightDmg:{slots:['arma','anel'], t:[[1,1],[1,2],[2,2],[2,3],[3,4]]},
  resFire: {slots:['armadura','elmo','botas','anel'], t:[[8,8],[12,12],[16,16],[22,22],[30,30]]},
  resCold: {slots:['armadura','elmo','botas','anel'], t:[[8,8],[12,12],[16,16],[22,22],[30,30]]},
  resLight:{slots:['armadura','elmo','botas','anel'], t:[[8,8],[12,12],[16,16],[22,22],[30,30]]}
};
function tiersFor(k, slot){
  const p = POOL[k]; if (!p) return null;
  return Array.isArray(p.slots) ? (p.slots.includes(slot) ? p.t : null) : (p.slots[slot] || null);
}
// the best available tier 40%, the one below 35%, anything lower the rest
function rollTier(tiers, top){
  const av = []; for (let i=0; i<Math.min(top,5); i++) if (tiers[i]) av.push(i+1);
  if (!av.length) return 0;
  const r = rnd();
  if (r<.4 || av.length===1) return av[av.length-1];
  if (r<.75 || av.length===2) return av[av.length-2];
  return av[rint(av.length-2)];
}
function rollAffix(k, slot, top){
  const tiers = tiersFor(k, slot); if (!tiers) return null;
  const t = rollTier(tiers, top); if (!t) return null;
  const [lo, hi] = tiers[t-1];
  return {k, v: lo + rint(hi-lo+1), t};
}
const areaIlvl = () => S && S.lvl ? S.lvl + 3*(S.torment||0) : 1;
function rollItem(rar, ilvl, slot){
  ilvl = Math.max(1, ilvl || areaIlvl());
  slot = slot || pick(Object.keys(SLOTS));
  const base = pick(SLOTS[slot].bases);
  const top = Math.max(1, maxTier(ilvl) - (rar==='common' ? 1 : 0));
  const n = rar==='common' ? 1 : rar==='magic' ? 2 : 3;
  const keys = shuffle(Object.keys(POOL).filter(k => tiersFor(k, slot)));
  if (slot==='arma') keys.sort((a,b) => (b==='dmg') - (a==='dmg'));   // weapons always carry damage
  const affixes = [];
  for (const k of keys){ if (affixes.length>=n) break; const af = rollAffix(k, slot, top); if (af) affixes.push(af); }
  let name = base + ' ' + AFX[affixes[0].k].suf;
  if (rar==='rare' && rnd()<.6){ const r = pick(GENERIC_RULES); affixes.unshift({k:r}); name = base + ' ' + AFX[r].suf; }
  return {id:++uid, slot, name, rar, ilvl, affixes};
}
// elite: mostly rare; normal enemies: common or magic. Maps, Torment and item find push quality up.
function genItem(elite){
  const mf = S && S.equip ? (stats().mf||0) : 0;
  const bump = (S && S.exp.kind==='map' ? .1+.03*S.exp.map.tier + (S.mapAff.has('rQuality') ? .08 : 0) : 0) + (S ? .05*(S.torment||0) : 0) + mf/400;
  const r = rnd() - bump;
  const rar = elite ? (r<.7 ? 'rare' : 'magic') : (r<.08 ? 'rare' : r<.4 ? 'magic' : 'common');
  return rollItem(rar, areaIlvl());
}
// uniques keep their identity but their numbers follow the item level
const UNIQ_SCALE = [.7, .85, 1, 1.2, 1.4];
function makeUnique(U, ilvl){
  ilvl = Math.max(1, ilvl || areaIlvl());
  const t = maxTier(ilvl), f = UNIQ_SCALE[t-1];
  return {id:++uid, slot:U.slot, name:U.name, rar:'legend', ilvl,
    affixes:U.affixes.map(a => a.v!==undefined && !AFX[a.k].rule ? {...a, v:Math.max(1, Math.round(a.v*f)), t} : {...a})};
}
/* Old items (from before item levels) are reforged once, keeping their name and special rule,
   one rarity up for commons, plus an heirloom affix. */
function reforgeLegacy(it, lv){
  if (!it || it.ilvl) return it;
  let n;
  if (it.rar==='legend'){ const U = UNIQUES.find(U => U.name===it.name); n = U ? makeUnique(U, lv) : {...it, ilvl:lv}; }
  else {
    n = rollItem(it.rar==='common' ? 'magic' : it.rar, lv, it.slot);
    const rule = it.affixes.find(a => AFX[a.k] && AFX[a.k].rule);
    if (rule){ n.affixes = n.affixes.filter(a => !AFX[a.k].rule); n.affixes.unshift({k:rule.k}); }
    n.name = it.name;
  }
  const extra = shuffle(Object.keys(POOL).filter(k => tiersFor(k, n.slot) && !n.affixes.some(a => a.k===k)))
    .map(k => rollAffix(k, n.slot, maxTier(lv))).find(Boolean);
  if (extra){ extra.heir = true; n.affixes.push(extra); }
  n.id = it.id; n.legacy = true;
  return n;
}
function classUniques(cls){ return UNIQUES.filter(U => !U.cls || U.cls.includes(cls)); }
function bossTable(bossId, cls){
  const pool = classUniques(cls);
  if (bossId==='mirror' || !BOSS_ORDER.includes(bossId)) return pool;
  const i = BOSS_ORDER.indexOf(bossId);
  return pool.filter((U,j) => j%4===i);
}
// two uniques for the player's class, preferring the boss's own table, never repeated within an expedition
function bossRelics(bossId){
  if (S.exp.kind==='uber') return shuffle(UBER_UNIQUES).slice(0,2).map(U => makeUnique(U));
  let pool = shuffle(bossTable(bossId, S.cls).filter(U => !S.seen.has(U.name)));
  if (pool.length<2) pool = pool.concat(shuffle(classUniques(S.cls).filter(U => !S.seen.has(U.name) && !pool.includes(U))));
  const want = (S.mapAff && S.mapAff.has('rRelic') ? 3 : 2) + atlasRank('aRelic') + atlasRank('kDuel');
  const out = pool.slice(0,want).map(U => makeUnique(U));
  while (out.length<want) out.push(rollItem('rare', areaIlvl()));
  out.forEach(it => S.seen.add(it.name));
  return out;
}
function makeMap(tier){
  tier = Math.max(1, Math.min(10, tier));
  const biome = pick(ACTS), boss = pick(BOSS_ORDER);
  const n = Math.min(4, 1 + Math.floor(tier/3) + rint(2)), nr = 1 + Math.floor(tier/4);
  const keys = Object.keys(MAP_AFFIXES);
  const affixes = shuffle(keys.filter(k => !isRewardAffix(k))).slice(0, n).concat(shuffle(keys.filter(isRewardAffix)).slice(0, nr));
  return {id:++uid, kind:'map', tier, biome, boss, affixes};
}
const mapName = m => `${BIOMES[m.biome].name}, nível ${m.tier}`;
function itemPrice(it){ return Math.round((({common:8, magic:20, rare:55, legend:150})[it.rar] || 10) * (1 + (it.ilvl||1)/10)); }
const sellPrice = it => Math.max(1, Math.floor(itemPrice(it)/4));
