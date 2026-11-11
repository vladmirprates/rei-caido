/* Rei Caído — shared helpers and static game data.
   Load order: data.js, items.js, world.js, combat.js, render.js, ui.js (classic scripts sharing globals). */

// language: Portuguese or English (PT/EN button at the top); switching reloads the page.
// $t(pt, en) returns the text in the current language and remembers the pair (used to relabel saved item names).
const LANG = (() => { try { const l = localStorage.getItem('reiCaido.lang'); if (l==='pt' || l==='en') return l; } catch(e){}
  return String(navigator.language||'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en'; })();
const I18N = {pt:{}, en:{}};
function $t(pt, en){ if (typeof pt==='string' && typeof en==='string'){ I18N.en[pt] = en; I18N.pt[en] = pt; } return LANG==='en' ? en : pt; }
// a saved item name in the other language: whole (uniques) or base word + suffix ("Espada da Ruína" / "Sword of Ruin")
function relabel(name){
  const M = I18N[LANG]; if (!name || M[name]===undefined && !name.includes(' ')) return name;
  if (M[name]!==undefined) return M[name];
  const i = name.indexOf(' '), base = name.slice(0,i), rest = name.slice(i+1);
  return M[base]!==undefined && M[rest]!==undefined ? M[base] + ' ' + M[rest] : name;
}
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
  P:{name:$t('Peão', 'Pawn'), hp:3, dmg:2, drop:.04, xp:2, gold:1},
  N:{name:$t('Cavalo', 'Knight'), hp:6, dmg:3, drop:.12, xp:4, gold:2},
  B:{name:$t('Bispo', 'Bishop'), hp:6, dmg:3, drop:.12, xp:4, gold:2},
  R:{name:$t('Torre', 'Rook'), hp:9, dmg:4, drop:.20, xp:5, gold:3},
  Q:{name:$t('Rainha', 'Queen'), hp:10, dmg:4, drop:.30, xp:8, gold:4},
  K:{name:$t('Rei', 'King'), hp:12, dmg:3, drop:.30, xp:8, gold:4}
};
const MODS = {
  armor:{n:$t('Blindagem', 'Armored'), d:$t('recebe 1 de dano a menos por golpe', 'takes 1 less damage per hit')},
  vamp:{n:$t('Vampirismo', 'Vampiric'), d:$t('cura vida quando acerta alguém', 'heals when it hits someone')},
  swift:{n:$t('Agilidade', 'Swift'), d:$t('move 1 casa a mais', 'moves 1 extra square')},
  explode:{n:$t('Explosão', 'Explosive'), d:$t('ao morrer, causa 3 a todos ao lado', 'on death, deals 3 to everything adjacent')},
  thorns:{n:$t('Espinhos', 'Thorns'), d:$t('quem o acerta leva 2 de dano', 'whoever hits it takes 2 damage')},
  regen:{n:$t('Regeneração', 'Regenerating'), d:$t('cura 2 por turno, se não foi atingido nesse turno', 'heals 2 per turn if it was not hit that turn')},
  double:{n:$t('Golpe duplo', 'Double Strike'), d:$t('acerta duas vezes', 'hits twice')},
  trample:{n:$t('Pisoteio', 'Trample'), d:$t('ao se mover, causa 1 a quem fica ao lado', 'when it moves, deals 1 to anyone adjacent')},
  fastSummon:{n:$t('Convocação rápida', 'Quick Summoner'), d:$t('invoca com mais frequência', 'summons more often')},
  submerge:{n:$t('Afogado', 'Drowned'), d:$t('na água, recebe metade do dano', 'in water, takes half damage')},
  lavaTrail:{n:$t('Rastro de lava', 'Lava Trail'), d:$t('deixa lava na casa de onde sai', 'leaves lava on the square it leaves')},
  frost:{n:$t('Geada', 'Frost'), d:$t('as casas que ataca viram gelo', 'the squares it attacks turn to ice')},
  enraged:{n:$t('Enlouquecida', 'Enraged'), d:$t('dano dobrado e move 4 casas', 'double damage and moves 4 squares')}
};
const ELITE_MODS = ['armor','vamp','swift','explode','thorns','regen'];

/* ---------- Bosses ---------- */
// names[dark] are fought by the White faction; names[holy] by the Black faction
const BOSSES = {
  queen:{type:'Q', hp:60, dmg:5, names:{dark:$t('Rainha Sangrenta', 'Bloody Queen'), holy:$t('Rainha Inquisidora', 'Inquisitor Queen')},
    p1:$t('Ataca nas 8 direções e invoca peões.', 'Attacks in all 8 directions and summons pawns.'), p2:$t('Com metade da vida, ataca em estrela, quebra pilares e invoca mais rápido. Guarda Real: com 3 ou mais peões vivos, recebe metade do dano.', 'At half health, attacks in a star, breaks pillars and summons faster. Royal Guard: with 3 or more pawns alive, takes half damage.')},
  knight:{type:'N', hp:55, dmg:4, names:{dark:$t('Cavalo de Mil Pernas', 'Thousand-Legged Horse'), holy:$t('Corcel do Juízo', 'Steed of Judgment')},
    p1:$t('Ataca todas as casas em L ao redor dele.', 'Attacks every L-square around it.'), p2:$t('Com metade da vida, salta para longe quando é atingido e deixa brasas, mas mantém o golpe anunciado. Depois de 3 saltos fica exausto por 2 turnos: não foge e recebe +50% de dano.', 'At half health, leaps away when hit and leaves embers, but keeps its announced strike. After 3 leaps it is exhausted for 2 turns: it does not flee and takes +50% damage.')},
  twins:{type:'R', hp:34, dmg:4, names:{dark:$t('Torres Gêmeas', 'Twin Towers'), holy:$t('Torres da Vigília', 'Watchtowers')},
    p1:$t('Duas torres que atacam em cruz.', 'Two rooks that attack in a cross.'), p2:$t('Se uma cair e a outra sobreviver ao turno, a outra enlouquece. Derrube as duas no mesmo turno.', 'If one falls and the other survives the turn, the other goes berserk. Bring both down on the same turn.')},
  pawn:{type:'P', hp:40, dmg:4, names:{dark:$t('Peão Eterno', 'Eternal Pawn'), holy:$t('Peão Imaculado', 'Immaculate Pawn')},
    p1:$t('Marcha para a sua fileira protegido por peões.', 'Marches toward your rank, protected by pawns.'), p2:$t('Com metade da vida, convoca guardas. Se chegar ao fim do tabuleiro, vira rainha.', 'At half health, calls guards. If it reaches the end of the board, it becomes a queen.')},
  mirror:{type:null, hp:0, dmg:0, names:{dark:$t('Reflexo', 'Reflection'), holy:$t('Reflexo', 'Reflection')},
    p1:$t('Uma cópia da sua classe.', 'A copy of your class.'), p2:$t('Com metade da vida, golpeia duas vezes e solta 2 estilhaços. Enquanto houver estilhaço vivo, metade do dano que você causa ao Reflexo volta para você.', 'At half health, strikes twice and releases 2 shards. While a shard is alive, half the damage you deal to the Reflection comes back to you.')}
};
// the pinnacle: fought only with one Crown Fragment from each uber boss
BOSSES.fallen = {type:'K', hp:60, dmg:4, names:{dark:$t('O Rei Caído', 'The Fallen King'), holy:$t('O Rei Caído', 'The Fallen King')},
  p1:$t('Fase 1, O Rei e a Corte: move e ataca como rei. A cada 2 turnos alterna o Decreto Real (todas as casas a até 2 dele) e uma Ordem Real: convoca peões, promove um peão a rainha ou dá o Grito de Guerra (cura a corte e dá escudo a ele). Golpeado de perto, pode fazer Roque com um peão distante.', 'Phase 1, The King and his Court: moves and attacks like a king. Every 2 turns he alternates the Royal Decree (every square up to 2 from him) and a Royal Order: summons pawns, promotes a pawn to queen or gives the War Cry (heals his court and shields himself). Struck up close, he may castle with a distant pawn.'),
  p2:$t('Fase 2, com 60% da vida, A Coroa Estilhaçada: ele toma a forma dos supremos, uma de cada vez: Torre, Bispo, Cavalo e Rainha. Move, ataca e usa o decreto da forma atual. Cada troca o deixa exposto por 2 turnos e chama dois guardas.', 'Phase 2, at 60% health, The Shattered Crown: he takes the forms of the ubers, one at a time: Rook, Bishop, Knight and Queen. He moves, attacks and uses the decree of his current form. Each change leaves him exposed for 2 turns and calls two guards.'),
  p3:$t('Fase 3, com 25%, O Último Rei: volta a ser rei e a corte inteira se ergue. Guarda Real: com 3 ou mais peças da corte vivas, recebe metade do dano. Encurralado: com 2 casas de fuga ou menos, recebe +50%.', 'Phase 3, at 25%, The Last King: he is a king again and the whole court rises. Royal Guard: with 3 or more court pieces alive, he takes half damage. Cornered: with 2 escape squares or fewer, he takes +50%.')};
const BOSS_ORDER = ['queen','knight','twins','pawn'];

/* ---------- Biomes and acts ---------- */
const BIOMES = {
  crypt:{name:$t('Cripta', 'Crypt'), boss:'queen', sizes:[7,8,9], tiles:['#3b3229','#2a231d'],
    rule:$t('Fossos: inimigos empurrados para dentro caem e morrem. Túmulos: a cada 4 turnos um esqueleto se ergue (até 3 por andar).', 'Pits: enemies pushed into them fall and die. Graves: every 4 turns a skeleton rises (up to 3 per floor).')},
  swamp:{name:$t('Pântano Afogado', 'Drowned Swamp'), boss:'knight', sizes:[8,9], tiles:['#323b2c','#232b20'],
    rule:$t('Água: quem ataca de dentro dela causa 1 de dano a menos, e ninguém desliza através dela. A névoa esconde tudo o que está fora do seu raio de visão (cerca de 3 casas).', 'Water: attacking from inside it deals 1 less damage, and nothing slides through it. The fog hides everything outside your sight radius (about 3 squares).')},
  forge:{name:$t('Forja Infernal', 'Infernal Forge'), boss:'twins', sizes:[8,9,10], tiles:['#3e2b22','#2b1d18'],
    rule:$t('Lava: quem termina o turno nela leva 2 de dano. Pilares instáveis explodem.', 'Lava: whoever ends the turn on it takes 2 damage. Unstable pillars explode.')},
  cathedral:{name:$t('Catedral Gelada', 'Frozen Cathedral'), boss:'pawn', sizes:[8,10], tiles:['#353d48','#252b33'],
    rule:$t('Gelo: quem pisa nele escorrega na mesma direção até sair do gelo ou bater em algo. Vale para você, inimigos e empurrões.', 'Ice: whoever steps on it slides in the same direction until it leaves the ice or hits something. Applies to you, enemies and pushes.')}
};
// rare biomes: they only appear in maps (never in the campaign or the Atlas), each with a rule of its own
BIOMES.storm = {name:$t('Cume Tempestuoso', 'Stormcrag'), boss:'queen', sizes:[8,9], tiles:['#3b4559','#283042'],
  rule:$t('Trovões: a cada 3 turnos, casas piscam e um trovão cai nelas no fim do turno (3 de dano a qualquer um). Poças conduzem: o choque corre por toda a poça conectada (2 de dano).', 'Thunder: every 3 turns, squares flash and a bolt strikes them at the end of the turn (3 damage to anyone). Puddles conduct: the shock runs through the whole connected puddle (2 damage).')};
BIOMES.tar = {name:$t('Poço de Piche', 'Tar Pits'), boss:'knight', sizes:[8,9,10], tiles:['#54483a','#3a3128'],
  rule:$t('Piche: quem termina o turno nele fica preso (no turno seguinte só ataca ou usa habilidades). Dois gêiseres cospem piche a cada 2 turnos, e a cada 3ª erupção ele pega fogo. Fogo incendeia o piche (3 de dano) e se espalha.', 'Tar: whoever ends the turn in it gets stuck (next turn they can only attack or use skills). Two geysers spit tar every 2 turns, and every 3rd eruption it catches fire. Fire ignites tar (3 damage) and spreads.')};
BIOMES.fungal = {name:$t('Gruta Fúngica', 'Fungal Grotto'), boss:'twins', sizes:[8,9], tiles:['#3d3249','#271f33'],
  rule:$t('Cogumelos brotam pelo andar: quem termina o turno em cima consome (você, aliado ou inimigo). Verde cura 6; azul dá +4 no golpe e 4 de escudo; a bufa estoura (4 de dano em volta e atordoa).', 'Mushrooms sprout around the floor: whoever ends the turn on one consumes it (you, an ally or an enemy). Green heals 6; blue gives +4 to your blow and 4 shield; the puffball bursts (4 damage around and stuns).')};
const MAP_BIOMES = ['storm','tar','fungal'];
const MUSH = ['m_heal','m_glow','m_puff'];   // the three mushrooms of the Fungal Grotto
const ACTS = ['crypt','swamp','forge','cathedral'];
// damage types: each biome's enemies hit with its element and resist it by 50%
const DTYPES = {phys:{n:$t('físico', 'physical')}, fire:{n:$t('fogo', 'fire'), c:'#f08a3c'}, cold:{n:$t('gelo', 'cold'), c:'#9fd3ff'}, light:{n:$t('raio', 'lightning'), c:'#ecd36a'}};
const BIOME_ELEMENT = {crypt:'phys', swamp:'light', forge:'fire', cathedral:'cold', storm:'light', tar:'fire', fungal:'phys'};
const RES_KEY = {fire:'resFire', cold:'resCold', light:'resLight'};

/* ---------- Skill unlocks and runes ----------
   Each class has a pool of skills (unlocked by hero level) and puts up to 3 on the bar.
   Runes are support modifiers found as loot and socketed into one skill each, in the camp. */
const SKILL_UNLOCK = [1, 1, 4, 8];
const BAR_MAX = 3;
// the three ascension skills of each class join its pool (level unlocks, picked freely like any other skill)
const ASC_UNLOCK = [2, 5, 10];
const RUNES = {
  pressa:  {name:$t('Runa da Pressa', 'Rune of Haste'),  d:$t('A habilidade recarrega 1 turno mais rápido.', 'The skill recharges 1 turn faster.')},
  eco:     {name:$t('Runa do Eco', 'Rune of Echo'),     d:$t('30% de chance de a habilidade não entrar em recarga.', '30% chance the skill does not go on cooldown.')},
  forca:   {name:$t('Runa da Força', 'Rune of Strength'),   d:$t('+2 de dano em cada inimigo atingido.', '+2 damage to each enemy hit.'), hit:true},
  trovao:  {name:$t('Runa do Trovão', 'Rune of Thunder'),  d:$t('Inimigos atingidos que sobrevivem ficam atordoados.', 'Enemies hit that survive are stunned.'), hit:true},
  sangue:  {name:$t('Runa do Sangue', 'Rune of Blood'),  d:$t('Cura 1 por inimigo atingido.', 'Heals 1 per enemy hit.'), hit:true},
  brasas:  {name:$t('Runa das Brasas', 'Rune of Embers'), d:$t('As casas dos inimigos atingidos queimam por 2 turnos (1 de dano por turno).', 'The squares of enemies hit burn for 2 turns (1 damage per turn).'), hit:true},
  carrasco:{name:$t('Runa do Carrasco', 'Rune of the Executioner'),d:$t('Inimigos comuns atingidos que ficam com 1/4 da vida ou menos morrem.', 'Common enemies hit that are left at 1/4 health or less die.'), hit:true}
};

/* ---------- Classes ---------- */
const CLASSES = {
  N:{name:$t('Cavaleiro', 'Knight'), art:'O', hp:20, dmg:3, skills:['quake','gallop','kick','neigh'],
     pitch:$t('Salta em L por cima de peças e pilares. Mobilidade e dano em área.', 'Leaps in an L over pieces and pillars. Mobility and area damage.'),
     passive:$t('<b>Salto.</b> Pula por cima de tudo. Se o golpe não matar, você fica onde está.', '<b>Leap.</b> Jumps over everything. If the blow does not kill, you stay where you are.'),
     hint:$t('Clique numa casa marcada para saltar em L.', 'Click a marked square to leap in an L.')},
  R:{name:$t('Torre', 'Rook'), art:'A', hp:28, dmg:4, skills:['shove','fortress','charge','tremor'],
     pitch:$t('Avança em linha reta, empurra inimigos e aguenta muito dano.', 'Charges in straight lines, pushes enemies and takes a lot of damage.'),
     passive:$t('<b>Investida.</b> Se o golpe não matar, você para ao lado do inimigo.', '<b>Charge.</b> If the blow does not kill, you stop next to the enemy.'),
     hint:$t('Clique numa casa marcada para avançar em linha reta.', 'Click a marked square to charge in a straight line.')},
  B:{name:$t('Bispo', 'Bishop'), art:'O', hp:16, dmg:3, skills:['beam','judge','radiance'],
     pitch:$t('Ataca à distância pelas diagonais e troca de cor para alcançar o resto do tabuleiro.', 'Attacks from range along the diagonals and changes color to reach the rest of the board.'),
     passive:$t('<b>Distância.</b> Ataca de longe, e de 3 casas ou mais causa +1 de dano. Bispos, Torres e Rainhas inimigos só alcançam 3 a 4 casas. Se matar, ocupa a casa; se não, fica onde está. Só anda e ataca nas diagonais: para mudar de cor, use Troca de Cor (sempre na barra).', '<b>Range.</b> Attacks from afar, and from 3 or more squares deals +1 damage. Enemy Bishops, Rooks and Queens only reach 3 to 4 squares. If it kills, it takes the square; if not, it stays put. Only moves and attacks on diagonals: to change color, use Color Shift (always on the bar).'),
     hint:$t('Clique numa casa marcada para andar. Inimigos nas suas diagonais podem ser atacados de longe. Inimigo em casa de outra cor? Use Troca de Cor.', 'Click a marked square to move. Enemies on your diagonals can be attacked from afar. Enemy on a square of the other color? Use Color Shift.')},
  Q:{name:$t('Rainha', 'Queen'), art:'A', hp:13, dmg:5, skills:['storm','sacrifice','lunge','finisher'],
     pitch:$t('Move em todas as direções e bate forte, mas tem pouca vida.', 'Moves in every direction and hits hard, but has little health.'),
     passive:$t('<b>Investida.</b> Se o golpe não matar, você para ao lado do inimigo.', '<b>Charge.</b> If the blow does not kill, you stop next to the enemy.'),
     hint:$t('Clique numa casa marcada para avançar em qualquer direção.', 'Click a marked square to charge in any direction.')},
  K:{name:$t('Rei', 'King'), art:'O', hp:22, dmg:2, skills:['summon','command','rally','promote'],
     pitch:$t('Anda uma casa por vez e comanda um exército de peões.', 'Moves one square at a time and commands an army of pawns.'),
     passive:$t('<b>Comando.</b> Aliados agem depois do seu turno. Peões que chegam à fileira do topo viram rainhas. Mover-se para um aliado troca vocês de lugar.', '<b>Command.</b> Allies act after your turn. Pawns that reach the top rank become queens. Moving onto an ally swaps your places.'),
     hint:$t('Clique numa casa vizinha para andar. Convoque peões com a tecla 1.', 'Click a neighboring square to move. Summon pawns with key 1.')}
};

/* ---------- Factions ---------- */
const FACTIONS = {
  w:{name:$t('Brancas', 'White'), title:$t('a Ordem', 'the Order'), pitch:$t('Controle e informação.', 'Control and information.'), passives:[
    $t('<b>Iniciativa.</b> No primeiro turno de cada andar, os inimigos só se movem.', '<b>Initiative.</b> On the first turn of each floor, enemies only move.'),
    $t('<b>Visão tática.</b> Contornos tracejados mostram o que os inimigos vão ameaçar no turno seguinte.', '<b>Tactical sight.</b> Dashed outlines show what enemies will threaten next turn.'),
    $t('<b>Promoção.</b> A primeira vez em cada andar que você chega à fileira do topo: +1 ação e cura 4.', '<b>Promotion.</b> The first time on each floor that you reach the top rank: +1 action and heal 4.')]},
  b:{name:$t('Pretas', 'Black'), title:$t('a Sombra', 'the Shadow'), pitch:$t('Risco e emboscada.', 'Risk and ambush.'), passives:[
    $t('<b>Emboscada.</b> Golpes em inimigos que se moveram no último turno causam +2.', '<b>Ambush.</b> Blows on enemies that moved last turn deal +2.'),
    $t('<b>Pacto de Sangue.</b> Uma vez por andar, pague 4 de vida para zerar a recarga das habilidades (botão na barra).', '<b>Blood Pact.</b> Once per floor, pay 4 health to reset your skill cooldowns (button on the bar).'),
    $t('<b>Sede.</b> Cada abate cura 1 de vida.', '<b>Thirst.</b> Each kill heals 1 health.')]}
};

/* ---------- Talents ---------- */
const TALENTS_COMMON = [
  {id:'forca', name:$t('Força', 'Strength'), max:3, req:1, desc:r=>$t(`+${Math.max(1,r)} de dano por ponto`, `+${Math.max(1,r)} damage per point`), aff:r=>[{k:'dmg',v:r}]},
  {id:'vigor', name:$t('Vigor', 'Vigor'), max:3, req:1, desc:r=>$t(`+4 de vida máxima por ponto`, `+4 max health per point`), aff:r=>[{k:'hp',v:4*r}]},
  {id:'egide', name:$t('Égide', 'Aegis'), max:2, req:3, desc:r=>$t(`+2 de escudo por andar por ponto`, `+2 shield per floor per point`), aff:r=>[{k:'shield',v:2*r}]},
  {id:'foco', name:$t('Foco', 'Focus'), max:1, req:6, desc:()=>$t('Habilidades recarregam 1 turno mais rápido', 'Skills recharge 1 turn faster'), aff:()=>[{k:'cdr',v:1}]}
];
const TALENTS_CLASS = {
  N:[{id:'n1', name:$t('Tremor Atordoante', 'Stunning Tremor'), max:1, req:10, desc:()=>$t('Salto Sísmico atordoa quem atinge', 'Seismic Leap stuns those it hits'), aff:()=>[{k:'quakeStun'}]},
     {id:'n2', name:$t('Carga Inicial', 'Opening Charge'), max:1, req:16, desc:()=>$t('Começa cada andar com +1 ação', 'Start each floor with +1 action'), aff:()=>[{k:'firstStrike'}]}],
  R:[{id:'r1', name:$t('Bastião', 'Bastion'), max:1, req:10, desc:()=>$t('Começa cada andar com +6 de escudo', 'Start each floor with +6 shield'), aff:()=>[{k:'bulwark'}]},
     {id:'r2', name:$t('Represália', 'Reprisal'), max:1, req:16, desc:()=>$t('Ao ser atingido, seu próximo golpe causa +3', 'When hit, your next blow deals +3'), aff:()=>[{k:'reprisal'}]}],
  B:[{id:'b1', name:$t('Raio Ofuscante', 'Blinding Ray'), max:1, req:10, desc:()=>$t('Raio Diagonal atordoa quem atinge', 'Diagonal Ray stuns those it hits'), aff:()=>[{k:'beamStun'}]},
     {id:'b2', name:$t('Absolvição', 'Absolution'), max:1, req:16, desc:()=>$t('Abates curam 2 de vida', 'Kills heal 2 health'), aff:()=>[{k:'vamp'}]}],
  Q:[{id:'q1', name:$t('Sede de Sangue', 'Bloodlust'), max:1, req:10, desc:()=>$t('Cada abate dá +1 de dano até o fim do andar (máx. 5)', 'Each kill gives +1 damage until the end of the floor (max. 5)'), aff:()=>[{k:'bloodRush'}]},
     {id:'q2', name:$t('Última Resistência', 'Last Stand'), max:1, req:16, desc:()=>$t('Uma vez por andar, sobrevive a um golpe fatal com 1 de vida', 'Once per floor, survive a fatal blow with 1 health'), aff:()=>[{k:'lastStand'}]}],
  K:[{id:'k1', name:$t('Guarda Real', 'Royal Guard'), max:1, req:10, desc:()=>$t('Começa cada andar com dois peões aliados', 'Start each floor with two allied pawns'), aff:()=>[{k:'royalGuard'}]},
     {id:'k2', name:$t('Veteranos', 'Veterans'), max:1, req:16, desc:()=>$t('Aliados causam +2 de dano', 'Allies deal +2 damage'), aff:()=>[{k:'veterans'}]}]
};
const talentList = cls => TALENTS_COMMON.concat(TALENTS_CLASS[cls]);
const xpNeed = lvl => 15 + lvl*10;

/* ---------- Endgame map affixes ---------- */
const MAP_AFFIXES = {
  mThorns:$t('Inimigos têm Espinhos', 'Enemies have Thorns'),
  mElites:$t('Dois inimigos de elite por andar', 'Two elite enemies per floor'),
  mNoPotions:$t('Sem frascos de vida', 'No health flasks'),
  mHp:$t('Inimigos têm +40% de vida', 'Enemies have +40% health'),
  mDmg:$t('Inimigos causam +1 de dano', 'Enemies deal +1 damage'),
  mSwift:$t('Inimigos têm Agilidade', 'Enemies are Swift'),
  mExplode:$t('Inimigos explodem ao morrer', 'Enemies explode on death'),
  // rewards (names start with r): every map carries some, to balance the penalties
  rEvent:$t('Recompensa: um evento garantido em cada andar', 'Reward: a guaranteed event on every floor'),
  rRelic:$t('Recompensa: o chefe oferece 3 relíquias para escolher', 'Reward: the boss offers 3 relics to choose from'),
  rShards:$t('Recompensa: +50% de Estilhaços da Fenda', 'Reward: +50% Rift Shards'),
  rGold:$t('Recompensa: +40% de ouro', 'Reward: +40% gold'),
  rRunes:$t('Recompensa: elites sempre deixam uma runa', 'Reward: elites always drop a rune'),
  rQuality:$t('Recompensa: itens de raridade maior', 'Reward: items of higher rarity'),
  rHorde:$t('Recompensa: uma Horda em cada andar sem chefe', 'Reward: a Horde on every floor without a boss')
};
const isRewardAffix = a => a[0]==='r';

/* ---------- Floor specials ---------- */
const SHRINES = [
  {id:'fury', name:$t('Santuário da Fúria', 'Shrine of Fury'), desc:$t('+2 de dano até o fim do andar', '+2 damage until the end of the floor')},
  {id:'life', name:$t('Santuário da Vida', 'Shrine of Life'), desc:$t('Cura toda a vida', 'Heals all health')},
  {id:'ward', name:$t('Santuário da Guarda', 'Shrine of the Guard'), desc:$t('+8 de escudo', '+8 shield')},
  {id:'haste', name:$t('Santuário do Vento', 'Shrine of the Wind'), desc:$t('Zera a recarga das habilidades', 'Resets skill cooldowns')}
];
