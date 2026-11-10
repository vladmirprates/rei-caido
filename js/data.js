/* Rei Caído — shared helpers and static game data.
   Load order: data.js, items.js, world.js, combat.js, render.js, ui.js (classic scripts sharing globals). */

let W = 8, H = 8;            // current board size (changes per floor)
let uid = 0;
let S = null;                // current expedition (run) state
let HERO = null;             // persistent hero currently selected

const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GF = '"Noto Sans Symbols 2","Segoe UI Symbol","DejaVu Sans",serif';
const BF = '"Alegreya Sans","Segoe UI",sans-serif';
const DF = '"IM Fell English SC", Georgia, serif';
const GLYPH = {K:'♚', Q:'♛', R:'♜', B:'♝', N:'♞', P:'♟︎'};
const ORTH = [[1,0],[-1,0],[0,1],[0,-1]], DIAG = [[1,1],[1,-1],[-1,1],[-1,-1]], ALL = ORTH.concat(DIAG);
const KN  = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
const KN3 = [[1,3],[3,1],[-1,3],[-3,1],[1,-3],[3,-1],[-1,-3],[-3,-1]];
const MAX_ALLIES = 5, POTION_HEAL = 6, STASH_MAX = 24;

/* Randomness: everything goes through rnd() so the daily challenge can be seeded */
let rng = Math.random;
function seeded(seed){
  let a = seed>>>0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a>>>15, 1 | a); t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t; return ((t ^ t>>>14)>>>0) / 4294967296; };
}
const rnd = () => rng();
const rint = n => Math.floor(rnd()*n);
const pick = a => a[rint(a.length)];
const shuffle = a => a.map(v=>[rnd(),v]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
const key = (x,y) => x+','+y;
const unkey = k => k.split(',').map(Number);
const inb = (x,y) => x>=0 && y>=0 && x<W && y<H;
const cheb = (ax,ay,bx,by) => Math.max(Math.abs(ax-bx), Math.abs(ay-by));
const sleep = ms => new Promise(r => setTimeout(r, reduce ? Math.min(ms,80) : ms));
const SEED = Array.from({length:12*12}, () => Array.from({length:6}, () => 0.1+Math.random()*0.75));

/* ---------- Enemies ---------- */
const EDEF = {
  P:{name:'Peão', hp:3, dmg:2, drop:.04, xp:2, gold:1},
  N:{name:'Cavalo', hp:6, dmg:3, drop:.12, xp:4, gold:2},
  B:{name:'Bispo', hp:6, dmg:3, drop:.12, xp:4, gold:2},
  R:{name:'Torre', hp:9, dmg:4, drop:.20, xp:5, gold:3},
  Q:{name:'Rainha', hp:10, dmg:4, drop:.30, xp:8, gold:4},
  K:{name:'Rei', hp:12, dmg:3, drop:.30, xp:8, gold:4}
};
const MODS = {
  armor:{n:'Blindagem', d:'recebe 1 de dano a menos por golpe'},
  vamp:{n:'Vampirismo', d:'cura vida quando acerta alguém'},
  swift:{n:'Agilidade', d:'move 1 casa a mais'},
  explode:{n:'Explosão', d:'ao morrer, causa 3 a todos ao lado'},
  thorns:{n:'Espinhos', d:'quem o acerta leva 2 de dano'},
  regen:{n:'Regeneração', d:'cura 2 por turno, se não foi atingido nesse turno'},
  double:{n:'Golpe duplo', d:'acerta duas vezes'},
  trample:{n:'Pisoteio', d:'ao se mover, causa 1 a quem fica ao lado'},
  fastSummon:{n:'Convocação rápida', d:'invoca com mais frequência'},
  submerge:{n:'Afogado', d:'na água, recebe metade do dano'},
  lavaTrail:{n:'Rastro de lava', d:'deixa lava na casa de onde sai'},
  frost:{n:'Geada', d:'as casas que ataca viram gelo'},
  enraged:{n:'Enlouquecida', d:'dano dobrado e move 4 casas'}
};
const ELITE_MODS = ['armor','vamp','swift','explode','thorns','regen'];

/* ---------- Bosses ---------- */
// names[dark] are fought by the White faction; names[holy] by the Black faction
const BOSSES = {
  queen:{type:'Q', hp:60, dmg:5, names:{dark:'Rainha Sangrenta', holy:'Rainha Inquisidora'},
    p1:'Ataca nas 8 direções e invoca peões.', p2:'Com metade da vida, ataca em estrela, quebra pilares e invoca mais rápido. Guarda Real: com 3 ou mais peões vivos, recebe metade do dano.'},
  knight:{type:'N', hp:55, dmg:4, names:{dark:'Cavalo de Mil Pernas', holy:'Corcel do Juízo'},
    p1:'Ataca todas as casas em L ao redor dele.', p2:'Com metade da vida, salta para longe quando é atingido e deixa brasas, mas mantém o golpe anunciado. Depois de 3 saltos fica exausto por 2 turnos: não foge e recebe +50% de dano.'},
  twins:{type:'R', hp:34, dmg:4, names:{dark:'Torres Gêmeas', holy:'Torres da Vigília'},
    p1:'Duas torres que atacam em cruz.', p2:'Se uma cair e a outra sobreviver ao turno, a outra enlouquece. Derrube as duas no mesmo turno.'},
  pawn:{type:'P', hp:40, dmg:4, names:{dark:'Peão Eterno', holy:'Peão Imaculado'},
    p1:'Marcha para a sua fileira protegido por peões.', p2:'Com metade da vida, convoca guardas. Se chegar ao fim do tabuleiro, vira rainha.'},
  mirror:{type:null, hp:0, dmg:0, names:{dark:'Reflexo', holy:'Reflexo'},
    p1:'Uma cópia da sua classe.', p2:'Com metade da vida, golpeia duas vezes e solta 2 estilhaços. Enquanto houver estilhaço vivo, metade do dano que você causa ao Reflexo volta para você.'}
};
const BOSS_ORDER = ['queen','knight','twins','pawn'];

/* ---------- Biomes and acts ---------- */
const BIOMES = {
  crypt:{name:'Cripta', boss:'queen', sizes:[7,8,9], tiles:['#3b3229','#2a231d'],
    rule:'Fossos: inimigos empurrados para dentro caem e morrem. Túmulos: a cada 4 turnos um esqueleto se ergue (até 3 por andar).'},
  swamp:{name:'Pântano Afogado', boss:'knight', sizes:[8,9], tiles:['#323b2c','#232b20'],
    rule:'Água: quem ataca de dentro dela causa 1 de dano a menos, e ninguém desliza através dela. A névoa esconde tudo o que está fora do seu raio de visão (cerca de 3 casas).'},
  forge:{name:'Forja Infernal', boss:'twins', sizes:[8,9,10], tiles:['#3e2b22','#2b1d18'],
    rule:'Lava: quem termina o turno nela leva 2 de dano. Pilares instáveis explodem.'},
  cathedral:{name:'Catedral Gelada', boss:'pawn', sizes:[8,10], tiles:['#353d48','#252b33'],
    rule:'Gelo: quem pisa nele escorrega na mesma direção até sair do gelo ou bater em algo. Vale para você, inimigos e empurrões.'}
};
const ACTS = ['crypt','swamp','forge','cathedral'];
// damage types: each biome's enemies hit with its element and resist it by 50%
const DTYPES = {phys:{n:'físico'}, fire:{n:'fogo', c:'#f08a3c'}, cold:{n:'gelo', c:'#9fd3ff'}, light:{n:'raio', c:'#ecd36a'}};
const BIOME_ELEMENT = {crypt:'phys', swamp:'light', forge:'fire', cathedral:'cold'};
const RES_KEY = {fire:'resFire', cold:'resCold', light:'resLight'};

/* ---------- Skill unlocks and runes ----------
   Each class has a pool of skills (unlocked by hero level) and puts up to 3 on the bar.
   Runes are support modifiers found as loot and socketed into one skill each, in the camp. */
const SKILL_UNLOCK = [1, 1, 4, 8];
const BAR_MAX = 3;
const RUNES = {
  pressa:  {name:'Runa da Pressa',  d:'A habilidade recarrega 1 turno mais rápido.'},
  eco:     {name:'Runa do Eco',     d:'30% de chance de a habilidade não entrar em recarga.'},
  forca:   {name:'Runa da Força',   d:'+2 de dano em cada inimigo atingido.', hit:true},
  trovao:  {name:'Runa do Trovão',  d:'Inimigos atingidos que sobrevivem ficam atordoados.', hit:true},
  sangue:  {name:'Runa do Sangue',  d:'Cura 1 por inimigo atingido.', hit:true},
  brasas:  {name:'Runa das Brasas', d:'As casas dos inimigos atingidos queimam por 2 turnos (1 de dano por turno).', hit:true},
  carrasco:{name:'Runa do Carrasco',d:'Inimigos comuns atingidos que ficam com 1/4 da vida ou menos morrem.', hit:true}
};

/* ---------- Classes ---------- */
const CLASSES = {
  N:{name:'Cavaleiro', art:'O', hp:20, dmg:3, skills:['quake','gallop','kick','neigh'],
     pitch:'Salta em L por cima de peças e pilares. Mobilidade e dano em área.',
     passive:'<b>Salto.</b> Pula por cima de tudo. Se o golpe não matar, você fica onde está.',
     hint:'Clique numa casa marcada para saltar em L.'},
  R:{name:'Torre', art:'A', hp:28, dmg:4, skills:['shove','fortress','charge','tremor'],
     pitch:'Avança em linha reta, empurra inimigos e aguenta muito dano.',
     passive:'<b>Investida.</b> Se o golpe não matar, você para ao lado do inimigo.',
     hint:'Clique numa casa marcada para avançar em linha reta.'},
  B:{name:'Bispo', art:'O', hp:16, dmg:3, skills:['beam','judge','radiance'],
     pitch:'Ataca à distância pelas diagonais e troca de cor para alcançar o resto do tabuleiro.',
     passive:'<b>Distância.</b> Ataca de longe, e de 3 casas ou mais causa +1 de dano. Bispos, Torres e Rainhas inimigos só alcançam 3 a 4 casas. Se matar, ocupa a casa; se não, fica onde está. Só anda e ataca nas diagonais: para mudar de cor, use Troca de Cor (sempre na barra).',
     hint:'Clique numa casa marcada para andar. Inimigos nas suas diagonais podem ser atacados de longe. Inimigo em casa de outra cor? Use Troca de Cor.'},
  Q:{name:'Rainha', art:'A', hp:13, dmg:5, skills:['storm','sacrifice','lunge','finisher'],
     pitch:'Move em todas as direções e bate forte, mas tem pouca vida.',
     passive:'<b>Investida.</b> Se o golpe não matar, você para ao lado do inimigo.',
     hint:'Clique numa casa marcada para avançar em qualquer direção.'},
  K:{name:'Rei', art:'O', hp:22, dmg:2, skills:['summon','command','rally','promote'],
     pitch:'Anda uma casa por vez e comanda um exército de peões.',
     passive:'<b>Comando.</b> Aliados agem depois do seu turno. Peões que chegam à fileira do topo viram rainhas. Mover-se para um aliado troca vocês de lugar.',
     hint:'Clique numa casa vizinha para andar. Convoque peões com a tecla 1.'}
};

/* ---------- Factions ---------- */
const FACTIONS = {
  w:{name:'Brancas', title:'a Ordem', pitch:'Controle e informação.', passives:[
    '<b>Iniciativa.</b> No primeiro turno de cada andar, os inimigos só se movem.',
    '<b>Visão tática.</b> Contornos tracejados mostram o que os inimigos vão ameaçar no turno seguinte.',
    '<b>Promoção.</b> A primeira vez em cada andar que você chega à fileira do topo: +1 ação e cura 4.']},
  b:{name:'Pretas', title:'a Sombra', pitch:'Risco e emboscada.', passives:[
    '<b>Emboscada.</b> Golpes em inimigos que se moveram no último turno causam +2.',
    '<b>Pacto de Sangue.</b> Uma vez por andar, pague 4 de vida para zerar a recarga das habilidades (botão na barra).',
    '<b>Sede.</b> Cada abate cura 1 de vida.']}
};

/* ---------- Talents ---------- */
const TALENTS_COMMON = [
  {id:'forca', name:'Força', max:3, req:1, desc:r=>`+${Math.max(1,r)} de dano por ponto`, aff:r=>[{k:'dmg',v:r}]},
  {id:'vigor', name:'Vigor', max:3, req:1, desc:r=>`+4 de vida máxima por ponto`, aff:r=>[{k:'hp',v:4*r}]},
  {id:'egide', name:'Égide', max:2, req:3, desc:r=>`+2 de escudo por andar por ponto`, aff:r=>[{k:'shield',v:2*r}]},
  {id:'foco', name:'Foco', max:1, req:6, desc:()=>'Habilidades recarregam 1 turno mais rápido', aff:()=>[{k:'cdr',v:1}]}
];
const TALENTS_CLASS = {
  N:[{id:'n1', name:'Tremor Atordoante', max:1, req:10, desc:()=>'Salto Sísmico atordoa quem atinge', aff:()=>[{k:'quakeStun'}]},
     {id:'n2', name:'Carga Inicial', max:1, req:16, desc:()=>'Começa cada andar com +1 ação', aff:()=>[{k:'firstStrike'}]}],
  R:[{id:'r1', name:'Bastião', max:1, req:10, desc:()=>'Começa cada andar com +6 de escudo', aff:()=>[{k:'bulwark'}]},
     {id:'r2', name:'Represália', max:1, req:16, desc:()=>'Ao ser atingido, seu próximo golpe causa +3', aff:()=>[{k:'reprisal'}]}],
  B:[{id:'b1', name:'Raio Ofuscante', max:1, req:10, desc:()=>'Raio Diagonal atordoa quem atinge', aff:()=>[{k:'beamStun'}]},
     {id:'b2', name:'Absolvição', max:1, req:16, desc:()=>'Abates curam 2 de vida', aff:()=>[{k:'vamp'}]}],
  Q:[{id:'q1', name:'Sede de Sangue', max:1, req:10, desc:()=>'Cada abate dá +1 de dano até o fim do andar (máx. 5)', aff:()=>[{k:'bloodRush'}]},
     {id:'q2', name:'Última Resistência', max:1, req:16, desc:()=>'Uma vez por andar, sobrevive a um golpe fatal com 1 de vida', aff:()=>[{k:'lastStand'}]}],
  K:[{id:'k1', name:'Guarda Real', max:1, req:10, desc:()=>'Começa cada andar com dois peões aliados', aff:()=>[{k:'royalGuard'}]},
     {id:'k2', name:'Veteranos', max:1, req:16, desc:()=>'Aliados causam +2 de dano', aff:()=>[{k:'veterans'}]}]
};
const talentList = cls => TALENTS_COMMON.concat(TALENTS_CLASS[cls]);
const xpNeed = lvl => 15 + lvl*10;

/* ---------- Endgame map affixes ---------- */
const MAP_AFFIXES = {
  mThorns:'Inimigos têm Espinhos',
  mElites:'Dois inimigos de elite por andar',
  mNoPotions:'Sem frascos de vida',
  mHp:'Inimigos têm +40% de vida',
  mDmg:'Inimigos causam +1 de dano',
  mSwift:'Inimigos têm Agilidade',
  mExplode:'Inimigos explodem ao morrer',
  // rewards (names start with r): every map carries some, to balance the penalties
  rEvent:'Recompensa: um evento garantido em cada andar',
  rRelic:'Recompensa: o chefe oferece 3 relíquias para escolher',
  rShards:'Recompensa: +50% de Estilhaços da Fenda',
  rGold:'Recompensa: +40% de ouro',
  rRunes:'Recompensa: elites sempre deixam uma runa',
  rQuality:'Recompensa: itens de raridade maior'
};
const isRewardAffix = a => a[0]==='r';

/* ---------- Floor specials ---------- */
const SHRINES = [
  {id:'fury', name:'Santuário da Fúria', desc:'+2 de dano até o fim do andar'},
  {id:'life', name:'Santuário da Vida', desc:'Cura toda a vida'},
  {id:'ward', name:'Santuário da Guarda', desc:'+8 de escudo'},
  {id:'haste', name:'Santuário do Vento', desc:'Zera a recarga das habilidades'}
];
