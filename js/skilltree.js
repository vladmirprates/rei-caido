/* Rei Caído — the rest of the passive tree: one branch per base skill (8 nodes, the last a keystone that changes the skill)
   and three archetype branches per class (rules that any build can use). Together with the classic 5 branches and the 3 ascension
   skills this makes ~120 nodes per class, for at most 57 points. */

/* ---------- base skill branches ---------- */
// seven standard nodes (picked per skill) plus a keystone written by hand
const SKILL_MOD = {
  dmg2:   {n:['Impacto', 'Impact'], notable:0, aff:[A_('ascDmg', 2)], d:(s) => [`${s} causa +2 de dano`, `${s} deals +2 damage`]},
  dmg3:   {n:['Golpe Pesado', 'Heavy Blow'], notable:0, aff:[A_('ascDmg', 3)], d:(s) => [`${s} causa +3 de dano`, `${s} deals +3 damage`]},
  cd1:    {n:['Ritmo', 'Tempo'], notable:0, aff:[A_('ascCd', 1)], d:(s) => [`${s} recarrega 1 turno mais rápido`, `${s} recharges 1 turn faster`]},
  stun:   {n:['Atordoar', 'Stagger'], notable:1, aff:[A_('ascStun')], d:(s) => [`${s} atordoa os inimigos que atinge`, `${s} stuns the enemies it hits`]},
  burn:   {n:['Chamas', 'Flames'], notable:1, aff:[A_('ascBurn')], d:(s) => [`${s} queima as casas atingidas`, `${s} burns the squares it hits`]},
  heal2:  {n:['Vigor', 'Vigor'], notable:0, aff:[A_('ascHeal', 2)], d:(s) => [`Usar ${s} cura 2 de vida`, `Using ${s} heals 2 health`]},
  heal3:  {n:['Vigor Pleno', 'Full Vigor'], notable:0, aff:[A_('ascHeal', 3)], d:(s) => [`Usar ${s} cura 3 de vida`, `Using ${s} heals 3 health`]},
  shield2:{n:['Guarda', 'Guard'], notable:0, aff:[A_('ascShield', 2)], d:(s) => [`Usar ${s} dá 2 de escudo`, `Using ${s} gives 2 shield`]},
  shield3:{n:['Guarda Firme', 'Firm Guard'], notable:0, aff:[A_('ascShield', 3)], d:(s) => [`Usar ${s} dá 3 de escudo`, `Using ${s} gives 3 shield`]},
  next2:  {n:['Impulso', 'Surge'], notable:0, aff:[A_('ascNext', 2)], d:(s) => [`Depois de ${s}, o próximo golpe causa +2`, `After ${s}, your next blow deals +2`]},
  next3:  {n:['Grande Impulso', 'Great Surge'], notable:1, aff:[A_('ascNext', 3)], d:(s) => [`Depois de ${s}, o próximo golpe causa +3`, `After ${s}, your next blow deals +3`]},
  killcd1:{n:['Colheita', 'Harvest'], notable:1, aff:[A_('ascKillCd', 1)], d:(s) => [`Abater com ${s} reduz a recarga dela em 1`, `Killing with ${s} lowers its cooldown by 1`]},
  killact:{n:['Frenesi', 'Frenzy'], notable:1, aff:[A_('ascKillAct')], d:(s) => [`Abater com ${s} dá +1 ação (1 por turno)`, `Killing with ${s} gives +1 action (once per turn)`]}
};
const BASE_PLANS = {
  // King
  summon:  {codes:['next2','cd1','shield2','heal2','shield3','next3','heal3'], key:['Prole Real', 'Royal Brood', 'Convocar Peão cria mais um peão', 'Summon Pawn creates one more pawn', [A_('sumMore', 1)]]},
  command: {codes:['next2','cd1','shield2','heal2','next3','shield3','heal3'], key:['Ordem Dupla', 'Double Order', 'Ordem Real faz os aliados agirem duas vezes', 'Royal Order makes your allies act twice', [A_('ordTwice')]]},
  rally:   {codes:['shield2','cd1','heal2','next2','shield3','heal3','next3'], key:['Grito Imortal', 'Deathless Cry', 'O Grito de Guerra dá +2 de dano a cada aliado, sem limite de acúmulo', 'War Cry gives each ally +2 damage, with no stacking limit', [A_('rallyAll')]]},
  promote: {codes:['shield2','cd1','heal2','next2','shield3','heal3','next3'], key:['Coroação em Massa', 'Mass Coronation', 'A Promoção também promove os outros peões aliados vizinhos', 'Promotion also promotes the other neighboring allied pawns', [A_('promoMass')]]},
  // Knight
  quake:   {codes:['dmg2','cd1','stun','heal2','burn','killcd1','dmg3'], key:['Eco Sísmico', 'Seismic Echo', 'O Salto Sísmico causa metade do dano uma segunda vez', 'Seismic Leap deals half its damage a second time', [A_('quakeEcho')]]},
  gallop:  {codes:['next2','cd1','shield2','heal2','next3','shield3','heal3'], key:['Galope Duplo', 'Double Gallop', 'O Galope dá +2 ações em vez de +1', 'Gallop gives +2 actions instead of +1', [A_('gallopMore', 1)]]},
  kick:    {codes:['dmg2','cd1','stun','heal2','killact','killcd1','dmg3'], key:['Coice em Cadeia', 'Chain Kick', 'Cada inimigo atingido pelo Coice causa metade do dano aos vizinhos', 'Each enemy hit by the Kick deals half damage to its neighbors', [A_('kickChain')]]},
  neigh:   {codes:['dmg2','cd1','shield2','heal2','burn','killcd1','dmg3'], key:['Relincho de Guerra', 'War Neigh', 'O Relincho também fere em 2 e atordoa quem está a 2 casas', 'The Neigh also hurts for 2 and stuns whoever is 2 squares away', [A_('neighWide')]]},
  // Rook
  shove:   {codes:['dmg2','cd1','shield2','heal2','burn','killcd1','dmg3'], key:['Empurrão Total', 'Full Shove', 'O Empurrão atinge as 8 direções', 'The Shove hits all 8 directions', [A_('shoveAll')]]},
  fortress:{codes:['next2','cd1','heal2','shield3','next3','heal3','shield3'], key:['Bastião Total', 'Total Bastion', 'A Muralha dá +8 de escudo e cura 4 de vida', 'The Wall gives +8 shield and heals 4 health', [A_('fortBonus', 8)]]},
  charge:  {codes:['dmg2','cd1','stun','heal2','burn','killact','dmg3'], key:['Aríete Furioso', 'Raging Ram', 'O Aríete causa o dobro de dano', 'The Battering Ram deals double damage', [A_('chargeDouble')]]},
  tremor:  {codes:['dmg2','cd1','stun','heal2','burn','killcd1','dmg3'], key:['Tremor Total', 'Total Tremor', 'O Tremor também atinge as diagonais', 'The Tremor also hits the diagonals', [A_('tremorAll')]]},
  // Bishop
  beam:    {codes:['dmg2','cd1','stun','heal2','burn','killcd1','dmg3'], key:['Raio Total', 'Total Ray', 'O Raio Diagonal também atravessa as linhas retas', 'The Diagonal Ray also crosses the straight lines', [{k:'crossBeam'}]]},
  judge:   {codes:['dmg2','cd1','heal2','shield2','burn','killact','dmg3'], key:['Julgamento Final', 'Final Judgment', 'O Julgamento marca todos os inimigos das suas diagonais', 'Judgment marks every enemy on your diagonals', [A_('judgeAll')]]},
  radiance:{codes:['dmg2','cd1','heal2','shield2','burn','killcd1','dmg3'], key:['Clarão Longo', 'Long Flash', 'O Clarão alcança 5 casas e causa 2', 'The Flash reaches 5 squares and deals 2', [A_('radLong')]]},
  shift:   {codes:['shield2','cd1','heal2','next2','shield3','heal3','next3'], key:['Pulso Sagrado', 'Holy Pulse', 'A Troca de Cor fere os inimigos vizinhos', 'Color Shift hurts neighboring enemies', [A_('shiftBlast')]]},
  // Queen
  storm:   {codes:['dmg2','cd1','stun','heal2','burn','killact','dmg3'], key:['Tempestade Dupla', 'Twin Storm', 'A Tempestade de Lâminas golpeia duas vezes', 'Blade Storm strikes twice', [A_('stormTwice')]]},
  sacrifice:{codes:['next2','cd1','heal2','shield2','next3','heal3','shield3'], key:['Sangue Livre', 'Free Blood', 'O Sacrifício não custa vida', 'Sacrifice costs no health', [A_('sacFree')]]},
  lunge:   {codes:['dmg2','cd1','stun','heal2','burn','killcd1','dmg3'], key:['Investida Longa', 'Long Charge', 'A Investida Real alcança +2 casas', 'The Royal Charge reaches +2 squares', [A_('lungeLong')]]},
  finisher:{codes:['dmg2','cd1','stun','heal2','killact','killcd1','dmg3'], key:['Golpe de Misericórdia', 'Mercy Blow', 'O Golpe Final executa inimigos comuns com menos de 30% de vida', 'Final Blow executes regular enemies below 30% health', [A_('finExec')]]}
};
// builds the 8 rows (same shape as the ascension trees) for a base skill
const baseSkillNodes = skill => {
  const plan = BASE_PLANS[skill], nm = SKILLS[skill].name;
  const rows = plan.codes.map(c => { const m = SKILL_MOD[c], d = m.d(nm); return [m.n[0], m.n[1], d[0], d[1], m.aff, m.notable]; });
  rows.push([plan.key[0], plan.key[1], plan.key[2], plan.key[3], plan.key[4]]);
  return tree(rows).map((n, i) => (rows[i][5] ? Object.assign(n, {kind:'notable'}) : n));
};

/* ---------- archetype branches: 3 per class ---------- */
// ['hp'|'dmg'|..., value] = small stat node; ['r', rule, pt, en] = notable rule; ['k', rule, pt, en] = keystone rule (text comes from AFX)
const STAT_TXT = {
  hp:{t:v => [`+${v} de vida máxima`, `+${v} max health`]}, dmg:{t:v => [`+${v} de dano`, `+${v} damage`]},
  crit:{t:v => [`+${v}% de crítico`, `+${v}% critical chance`]}, block:{t:v => [`+${v}% de bloqueio`, `+${v}% block`]},
  shield:{t:v => [`+${v} de escudo por andar`, `+${v} shield per floor`]}, eliteDmg:{t:v => [`+${v}% de dano contra elites e chefes`, `+${v}% damage against elites and bosses`]},
  fireDmg:{t:v => [`+${v} de dano de fogo`, `+${v} fire damage`]}, coldDmg:{t:v => [`+${v} de dano de gelo`, `+${v} cold damage`]},
  lightDmg:{t:v => [`+${v} de dano de raio`, `+${v} lightning damage`]}, resFire:{t:v => [`+${v}% de resistência a fogo`, `+${v}% fire resistance`]}
};
const ARCH = {
  K: [
    {id:'a1', name:['Corte', 'Court'], nodes:[['hp',4],['dmg',1],['r','sturdyPawns','Guarda de Ferro','Iron Guard'],['hp',4],['r','banner','Estandarte','Banner'],['shield',1],['r','martyr','Mártir','Martyr'],['k','twinSummon','Prole Real','Royal Brood']]},
    {id:'a2', name:['Trono', 'Throne'], nodes:[['block',5],['hp',4],['r','thick','Casca Grossa','Thick Hide'],['shield',1],['r','lastBreath','Último Fôlego','Last Breath'],['block',5],['r','ward','Vigília','Vigil'],['k','mirror','Espelho Real','Royal Mirror']]},
    {id:'a3', name:['Regicida', 'Regicide'], nodes:[['crit',5],['dmg',1],['r','opener','Golpe Inicial','Opening Strike'],['crit',5],['r','lone','Caçador Solitário','Lone Hunter'],['dmg',1],['r','execute','Xeque-mate','Checkmate'],['k','regicide','Regicídio','Regicide']]}
  ],
  N: [
    {id:'a1', name:['Cavalaria', 'Cavalry'], nodes:[['dmg',1],['hp',4],['r','flow','Fluxo','Flow'],['dmg',1],['r','cavalry','Cavalaria','Cavalry'],['hp',4],['r','trample','Pisoteio','Trample'],['k','momentum','Ímpeto','Momentum']]},
    {id:'a2', name:['Sombra', 'Shade'], nodes:[['hp',4],['crit',5],['r','vamp','Sede de Sangue','Blood Thirst'],['crit',5],['r','critHeal','Sangue Frio','Cold Blood'],['hp',4],['r','bloodPrice','Preço de Sangue','Blood Price'],['k','darkQuake','Abismo','Abyss']]},
    {id:'a3', name:['Arcano', 'Arcane'], nodes:[['fireDmg',1],['coldDmg',1],['r','prism','Prisma Vivo','Living Prism'],['lightDmg',1],['r','skillPower','Conduíte','Conduit'],['hp',4],['r','skillShield','Mana Fluida','Fluid Mana'],['k','echoSkill','Eco Arcano','Arcane Echo']]}
  ],
  R: [
    {id:'a1', name:['Muralha', 'Rampart'], nodes:[['shield',1],['hp',4],['r','fortify','Fortificar','Fortify'],['shield',1],['r','granite','Granito','Granite'],['block',5],['r','lineGuard','Guarda de Linha','Line Guard'],['k','ironSkin','Pele de Ferro','Iron Skin']]},
    {id:'a2', name:['Cerco', 'Siege'], nodes:[['dmg',1],['crit',5],['r','pushPower','Impacto','Impact'],['dmg',1],['r','ram','Aríete','Ram'],['eliteDmg',10],['r','pierce','Perfurar','Pierce'],['k','castle','Roque','Castling']]},
    {id:'a3', name:['Forja', 'Forge'], nodes:[['fireDmg',1],['resFire',10],['r','emberTrail','Rastro de Brasas','Ember Trail'],['fireDmg',1],['r','kindling','Combustão','Kindling'],['hp',4],['r','forgeWalk','Passo de Lava','Lava Step'],['k','deathBurst','Exílio','Exile']]}
  ],
  B: [
    {id:'a1', name:['Fé', 'Faith'], nodes:[['hp',4],['shield',1],['r','holy','Graça','Grace'],['block',5],['r','stainedGlass','Vitral','Stained Glass'],['hp',4],['r','lastBreath','Último Fôlego','Last Breath'],['k','ward','Vigília Eterna','Eternal Vigil']]},
    {id:'a2', name:['Raio', 'Ray'], nodes:[['dmg',1],['crit',5],['r','crossBeam','Raio Cruzado','Crossed Ray'],['dmg',1],['r','pierceShot','Tiro Perfurante','Piercing Shot'],['crit',5],['r','rosary','Rosário','Rosary'],['k','censer','Incensário','Censer']]},
    {id:'a3', name:['Heresia', 'Heresy'], nodes:[['crit',5],['dmg',1],['r','venom','Peçonha','Venom'],['hp',4],['r','rot','Putrefação','Rot'],['crit',5],['r','skillLeech','Banquete','Feast'],['k','execute','Xeque-mate','Checkmate']]}
  ],
  Q: [
    {id:'a1', name:['Lâmina', 'Blade'], nodes:[['dmg',1],['crit',5],['r','bladeStorm','Lâminas','Blades'],['dmg',1],['r','critStun','Trovão','Thunder'],['crit',5],['r','check','Xeque','Check'],['k','cleave','Usurpador','Usurper']]},
    {id:'a2', name:['Dama', 'Lady'], nodes:[['hp',4],['block',5],['r','escape','Fuga Real','Royal Escape'],['block',5],['r','thick','Casca Grossa','Thick Hide'],['hp',4],['r','ward','Vigília','Vigil'],['k','flee','Fuga','Escape']]},
    {id:'a3', name:['Sangue', 'Blood'], nodes:[['hp',4],['crit',5],['r','redSacrifice','Sacrifício Rubro','Crimson Sacrifice'],['dmg',1],['r','bounty','Troféu','Trophy'],['hp',4],['r','critHeal','Sangue Frio','Cold Blood'],['k','deathBurst','Exílio','Exile']]}
  ]
};
// the nodes of an archetype branch in the format buildTree understands
function archNodes(row){
  return row.map(([t, a, b, c]) => {
    if (t==='r' || t==='k'){
      const txt = AFX[a].t(), cut = txt.indexOf(': '), d = cut>0 && cut < 28 ? txt.slice(cut+2) : txt;
      return t==='k' ? {key:$t(b, c), d, aff:[{k:a}]} : {notable:$t(b, c), d, aff:[{k:a}]};
    }
    const x = STAT_TXT[t].t(a); return [$t(x[0], x[1]), [{k:t, v:a}]];
  });
}
const archBranches = cls => (ARCH[cls] || []).map(b => ({id:b.id, name:$t(b.name[0], b.name[1]), nodes:archNodes(b.nodes)}));
