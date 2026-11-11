/* Rei Caído — training yard: a quick tutorial adapted to the hero's class.
   Steps: move, attack, dodge red squares, fight back, use a skill, take the stairs. */
const MOVE_TEXT = {
  N:$t('O Cavaleiro salta em L (duas casas numa direção e uma para o lado), por cima de qualquer peça.', 'The Knight leaps in an L (two squares in one direction and one to the side), over any piece.'),
  R:$t('A Torre anda em linha reta, quantas casas quiser, até bater em algo.', 'The Rook moves in a straight line, as many squares as it wants, until it hits something.'),
  B:$t('O Bispo anda na diagonal, quantas casas quiser. Para mudar a cor da casa, use a Troca de Cor.', 'The Bishop moves diagonally, as many squares as it wants. To change the square\'s color, use Color Shift.'),
  Q:$t('A Rainha anda em qualquer linha reta ou diagonal, quantas casas quiser.', 'The Queen moves along any straight line or diagonal, as many squares as it wants.'),
  K:$t('O Rei anda uma casa em qualquer direção e convoca peões aliados que lutam por ele.', 'The King moves one square in any direction and summons allied pawns that fight for him.')
};
const TUT_STEPS = [
  {title:$t('Movimento', 'Movement'), goal:$t('Mova sua peça até o anel dourado', 'Move your piece to the gold ring'), text:c => $t(`${MOVE_TEXT[c]} As casas marcadas mostram para onde você pode ir. Clique na casa com o anel dourado.`, `${MOVE_TEXT[c]} The marked squares show where you can go. Click the square with the gold ring.`)},
  {title:$t('Ataque', 'Attack'), goal:$t('Ataque o boneco: clique na casa dele', 'Attack the dummy: click its square'), text:() => $t('Mover-se para a casa de um inimigo é atacar. O marcador laranja mostra quem você alcança.', 'Moving onto an enemy\'s square is an attack. The orange marker shows who you can reach.')},
  {title:$t('Casas vermelhas', 'Red squares'), goal:$t('Saia das casas vermelhas antes que a Torre ataque', 'Leave the red squares before the Rook attacks'), text:() => $t('Os inimigos avisam antes onde vão bater: as casas vermelhas. Mova-se para uma casa que não esteja vermelha (ou derrube a Torre antes).', 'Enemies warn you where they will strike: the red squares. Move to a square that is not red (or take the Rook down first).')},
  {title:$t('Contra-ataque', 'Counterattack'), goal:$t('Derrote a Torre de treino (ela aguenta dois golpes)', 'Defeat the training Rook (it takes two blows)'), text:() => $t('Se o golpe não matar, você fica onde está e ataca de novo. Passe o mouse sobre uma peça para ver vida, dano e o que ela vai fazer.', 'If the blow does not kill, you stay where you are and attack again. Hover over a piece to see its health, damage and what it will do.')},
  {title:$t('Habilidades', 'Skills'), goal:$t('Aperte 1 (o botão piscando) e use a habilidade no boneco', 'Press 1 (the blinking button) and use the skill on the dummy'), text:() => $t('As habilidades ficam na barra embaixo do tabuleiro. Use a habilidade 1 (clique no botão ou tecle 1); um ataque normal não conta. Algumas pedem que você escolha uma casa depois.', 'Skills sit on the bar below the board. Use skill 1 (click the button or press 1); a normal attack does not count. Some ask you to pick a square afterwards.')},
  {title:$t('Escada', 'Stairs'), goal:$t('Pise na escada para terminar o treino', 'Step on the stairs to finish the training'), text:() => $t('Nas expedições, a escada aparece quando o andar fica limpo.', 'On expeditions, the stairs appear when the floor is clear.')}
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
  Object.assign(e, {dummy:true, label: t==='R' ? $t('Torre de treino', 'Training Rook') : $t('Boneco de treino', 'Training Dummy'), mods:[]}, o||{});
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
  showBanner($t(`Treino ${step+1} de ${TUT_STEPS.length}`, `Training ${step+1} of ${TUT_STEPS.length}`), TUT_STEPS[step].title);
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
    if (!done){ log($t('Você ficou numa casa vermelha. Tente de novo: saia das casas vermelhas antes de passar o turno.', 'You stayed on a red square. Try again: leave the red squares before ending the turn.')); st.hp0 = S.player.hp; }
  }
  else if (st.step===3) done = !S.enemies.length;
  else if (st.step===4){
    done = st.skillUsed;
    // the dummy was killed with a normal attack: skills need a target on the board, so a new dummy shows up
    if (!done && !S.enemies.length){ log($t('Esse foi um ataque normal. Um novo boneco aparece: use a habilidade 1 nele.', 'That was a normal attack. A new dummy appears: use skill 1 on it.')); floatText(S.player.x, S.player.y-0.4, $t('use a habilidade 1', 'use skill 1'), '#e3b456'); tutSetup(); return; }
  }
  if (!done) return;
  floatText(S.player.x, S.player.y-0.4, $t('muito bem', 'well done'), '#8fd18a');
  const bar = document.getElementById('tutBar'); if (bar){ bar.classList.remove('flash'); void bar.offsetWidth; bar.classList.add('flash'); }
  st.step++;
  tutSetup();
}
