/* Rei Caído — training yard: a quick tutorial adapted to the hero's class.
   Steps: move, attack, dodge red squares, fight back, use a skill, take the stairs. */
const MOVE_TEXT = {
  N:'O Cavaleiro salta em L (duas casas numa direção e uma para o lado), por cima de qualquer peça.',
  R:'A Torre anda em linha reta, quantas casas quiser, até bater em algo.',
  B:'O Bispo anda na diagonal, quantas casas quiser. Para mudar a cor da casa, use a Troca de Cor.',
  Q:'A Rainha anda em qualquer linha reta ou diagonal, quantas casas quiser.',
  K:'O Rei anda uma casa em qualquer direção e convoca peões aliados que lutam por ele.'
};
const TUT_STEPS = [
  {title:'Movimento', goal:'Mova sua peça até o anel dourado', text:c => `${MOVE_TEXT[c]} As casas marcadas mostram para onde você pode ir. Clique na casa com o anel dourado.`},
  {title:'Ataque', goal:'Ataque o boneco: clique na casa dele', text:() => 'Mover-se para a casa de um inimigo é atacar. O marcador laranja mostra quem você alcança.'},
  {title:'Casas vermelhas', goal:'Saia das casas vermelhas antes que a Torre ataque', text:() => 'Os inimigos avisam antes onde vão bater: as casas vermelhas. Mova-se para uma casa que não esteja vermelha (ou derrube a Torre antes).'},
  {title:'Contra-ataque', goal:'Derrote a Torre de treino (ela aguenta dois golpes)', text:() => 'Se o golpe não matar, você fica onde está e ataca de novo. Passe o mouse sobre uma peça para ver vida, dano e o que ela vai fazer.'},
  {title:'Habilidades', goal:'Aperte 1 (o botão piscando) e use a habilidade no boneco', text:() => 'As habilidades ficam na barra embaixo do tabuleiro. Use a habilidade 1 (clique no botão ou tecle 1); um ataque normal não conta. Algumas pedem que você escolha uma casa depois.'},
  {title:'Escada', goal:'Pise na escada para terminar o treino', text:() => 'Nas expedições, a escada aparece quando o andar fica limpo.'}
];
function genTutorial(){
  W = H = 6;
  placePlayer(2, 5);
  S.tut = {step:0, hp0:0, skillUsed:false, target:null};
  tutSetup();
}
const tutFree = (x,y) => inb(x,y) && !occupied(x,y) && !isWall(x,y);
function tutDummy(t, x, y, o){
  const e = makeEnemy(t, x, y);
  Object.assign(e, {dummy:true, label: t==='R' ? 'Torre de treino' : 'Boneco de treino', mods:[]}, o||{});
  S.enemies.push(e); burst(x, y, '#e3b456', 10);
  return e;
}
function tutSetup(){
  const st = S.tut, step = st.step, p = S.player;
  const moves = classMoves(p.x, p.y, false).filter(o => o.kind==='move' && !o.slide);
  st.target = null;
  if (step===0){
    const far = moves.filter(o => cheb(o.x,o.y,p.x,p.y)>=2);
    const t = (far.length ? far : moves)[0];
    st.target = t ? [t.x, t.y] : null;
  } else if (step===1){
    st.target = null;
    const t = moves.find(o => cheb(o.x,o.y,p.x,p.y)<=3) || moves[0];
    if (t) tutDummy('P', t.x, t.y, {hp:1, maxHp:1, dmg:1});
  } else if (step===2){
    // a rook lined up with you, a few squares away: its red squares show where it will hit
    const cand = [[p.x-3,p.y],[p.x+3,p.y],[p.x,p.y-3],[p.x-2,p.y],[p.x+2,p.y],[p.x,p.y-2],[p.x-4,p.y],[p.x+4,p.y]].filter(([x,y]) => tutFree(x,y));
    if (cand.length){ const [x,y] = cand[0]; tutDummy('R', x, y, {dmg:1, dummy:false}); }
    st.hp0 = p.hp;
  } else if (step===3){
    // a training rook that stands still on a square your piece reaches, so every class can finish this step
    S.enemies = [];
    const t = moves.find(o => cheb(o.x,o.y,p.x,p.y)>=1) || moves[0];
    if (t) tutDummy('R', t.x, t.y, {hp: stats().dmg*2, maxHp: stats().dmg*2, dmg:1});
  } else if (step===4){
    st.skillUsed = false;
    for (const id in S.cds) S.cds[id] = 0;
    // something to use the skill on
    const spot = ALL.map(([dx,dy]) => [p.x+dx*2, p.y+dy]).concat(ALL.map(([dx,dy]) => [p.x+dx, p.y+dy])).find(([x,y]) => tutFree(x,y));
    if (spot) tutDummy('P', spot[0], spot[1], {hp:1, maxHp:1, dmg:0});
  } else if (step===5){
    S.enemies = [];
    // the stairs show up one move away, to keep the training short
    const t = moves.find(o => !S.items.some(i => i.x===o.x && i.y===o.y));
    if (t){ S.stairs = {x:t.x, y:t.y}; S.terrain.delete(key(t.x,t.y)); } else spawnStairs();
  }
  planIntents(false);
  showBanner(`Treino ${step+1} de ${TUT_STEPS.length}`, TUT_STEPS[step].title);
  updateUI();
}
// called after your action ('action') and after the enemy turn ('enemy')
function tutCheck(kind){
  const st = S.tut; if (!st || st.step>=TUT_STEPS.length-1) return;
  let done = false;
  if (st.step===0) done = st.target && S.player.x===st.target[0] && S.player.y===st.target[1];
  else if (st.step===1) done = !S.enemies.length;
  // killing the rook also passes this step (with no enemies left, there is no enemy turn)
  else if (st.step===2 && !S.enemies.length) done = true;
  else if (st.step===2 && kind==='enemy'){
    done = S.player.hp >= st.hp0;
    if (!done){ log('Você ficou numa casa vermelha. Tente de novo: saia das casas vermelhas antes de passar o turno.'); st.hp0 = S.player.hp; }
  }
  else if (st.step===3) done = !S.enemies.length;
  else if (st.step===4){
    done = st.skillUsed;
    // the dummy was killed with a normal attack: skills need a target on the board, so a new dummy shows up
    if (!done && !S.enemies.length){ log('Esse foi um ataque normal. Um novo boneco aparece: use a habilidade 1 nele.'); floatText(S.player.x, S.player.y-0.4, 'use a habilidade 1', '#e3b456'); tutSetup(); return; }
  }
  if (!done) return;
  floatText(S.player.x, S.player.y-0.4, 'muito bem', '#8fd18a');
  const bar = document.getElementById('tutBar'); if (bar){ bar.classList.remove('flash'); void bar.offsetWidth; bar.classList.add('flash'); }
  st.step++;
  tutSetup();
}
