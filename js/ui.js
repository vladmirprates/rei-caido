/* Rei Caído — save data, screens (heroes, camp, game), modals, HUD, input, boot */

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- Error reporter: shows any crash on screen so it can be copied and reported ---------- */
function reportError(err){
  const msg = (err && err.stack) || String(err);
  console.error(err);
  let box = document.getElementById('errBox');
  if (!box){
    box = document.createElement('div'); box.id = 'errBox'; box.className = 'errbox';
    document.body.appendChild(box);
  }
  const where = S && S.walls ? `${floorTitle()} · turno ${S.turn} · fase ${S.phase}` : 'fora de uma expedição';
  box.innerHTML = `<b>Algo deu errado</b><p>Copie o texto abaixo e me envie. Onde: ${esc(where)}.</p><textarea readonly>${esc(where+'\n'+msg)}</textarea><button class="ghost sm" type="button">Fechar</button>`;
  box.hidden = false;
  box.querySelector('button').onclick = () => { box.hidden = true; };
}
window.addEventListener('error', e => reportError(e.error || e.message));
window.addEventListener('unhandledrejection', e => reportError(e.reason));

/* ---------- Save ---------- */
const SAVE_KEY = 'reiCaido.save.v1';
let SAVE = {heroes:[]};
function loadSave(){
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) SAVE = JSON.parse(raw); } catch(e){ SAVE = {heroes:[]}; }
  if (!SAVE || !Array.isArray(SAVE.heroes)) SAVE = {heroes:[]};
  for (const h of SAVE.heroes) for (const it of [...Object.values(h.equip), ...h.stash]) if (it && it.id>uid) uid = it.id;
  for (const h of SAVE.heroes){ h.tree = h.tree || []; if (h.talents && Object.values(h.talents).some(v => v>0)){ h.talents = {}; legacyNotice = 'Os talentos viraram uma Árvore de Passivas: seus pontos foram devolvidos. Veja a aba Árvore.'; } }
  for (const h of SAVE.heroes) if (h.atlasSpent){ delete h.atlasSpent; h.atlasTree = h.atlasTree || []; }
  let reforged = 0;
  for (const h of SAVE.heroes){
    const lv = Math.max(1, Math.min(30, h.level));
    for (const s in h.equip) if (h.equip[s] && !h.equip[s].ilvl){ h.equip[s] = reforgeLegacy(h.equip[s], lv); reforged++; }
    h.stash = h.stash.map(it => { if (it && !it.ilvl){ reforged++; return reforgeLegacy(it, lv); } return it; });
  }
  if (reforged){ legacyNotice = (legacyNotice ? legacyNotice + ' ' : '') + `Seus ${reforged} itens antigos foram reforjados no novo sistema: ganharam nível, camadas e um afixo de herança.`; persist(); }
}
let legacyNotice = '';
function persist(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch(e){ /* storage blocked: progress lasts this session only */ } }
function newHero(name, cls, color, mode){
  return {id:'h'+Date.now().toString(36)+Math.random().toString(36).slice(2,6), name, cls, color, mode,
          level:1, xp:0, talents:{}, equip:{arma:null, elmo:null, armadura:null, botas:null, anel:null},
          stash:[], gold:0, maps:[], actDone:0, bossesKilled:[], record:0, daily:'', torment:0, tormentMax:0, tree:[], created:Date.now()};
}
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const todaySeed = () => Number(todayStr().replace(/-/g,'')) * 7919;
const talentPoints = h => treePoints(h);

/* ---------- Screens ---------- */
function showScreen(name){
  $('scrHeroes').hidden = name!=='heroes';
  $('scrCamp').hidden = name!=='camp';
  $('scrGame').hidden = name!=='game';
  if (name==='game') requestAnimationFrame(resize);
  updateHeader();
}
function updateHeader(){
  $('heroChip').textContent = HERO ? `${HERO.name} · ${CLASSES[HERO.cls].name} nível ${HERO.level}${HERO.mode==='hardcore'?' · hardcore':''}` : '';
  if (!S || !S.walls){ $('floorLabel').textContent = HERO ? 'Acampamento' : 'O Abismo'; $('turnLabel').textContent = ''; }
}

let pick_ = {cls:'N', color:'w', mode:'normal'}, delPending = null;
function showHeroes(){
  HERO = null; S = null;
  const cards = SAVE.heroes.map(h => `
    <div class="hcard">
      <span class="g ${h.color}">${GLYPH[h.cls]}</span>
      <div class="hinfo"><b>${esc(h.name)}</b>
        <span>${CLASSES[h.cls].name} · ${FACTIONS[h.color].name} · ${h.mode==='hardcore'?'Hardcore':'Padrão'}</span>
        <span>Nível ${h.level} · Ato ${Math.min(4,h.actDone+1)}${h.actDone>=4?' · fim de jogo':''}</span></div>
      <div class="hbtns"><button class="primary sm" type="button" data-act="play:${h.id}">Jogar</button>
        <button class="ghost sm" type="button" data-act="del:${h.id}">${delPending===h.id?'Confirmar exclusão':'Apagar'}</button></div>
    </div>`).join('');
  const clsBtns = Object.entries(CLASSES).map(([k,c]) => `<button class="cls" type="button" data-act="cls:${k}" aria-pressed="${pick_.cls===k}"><span class="g ${pick_.color}">${GLYPH[k]}</span>${c.name}</button>`).join('');
  const c = CLASSES[pick_.cls], f = FACTIONS[pick_.color];
  $('scrHeroes').innerHTML = `
    <div class="col">
      <h2 class="sh">Seus heróis</h2>
      ${cards || '<p class="muted">Nenhum herói ainda. Crie o primeiro ao lado.</p>'}
    </div>
    <div class="col">
      <h2 class="sh">Novo herói</h2>
      <label class="lbl" for="heroName">Nome</label>
      <input id="heroName" class="txt" maxlength="20" placeholder="Ex.: Ser Aldric" value="${esc($('heroName') ? $('heroName').value : '')}">
      <p class="lbl">Classe</p>
      <div class="classes">${clsBtns}</div>
      <p class="cls-desc"><b>${c.name}.</b> ${c.pitch} Vida ${c.hp}, dano ${c.dmg}.</p>
      <p class="lbl">Facção</p>
      <div class="choices">
        ${['w','b'].map(k => `<button class="choice" type="button" data-act="col:${k}" aria-pressed="${pick_.color===k}"><strong>${FACTIONS[k].name}, ${FACTIONS[k].title}</strong><span class="d">${FACTIONS[k].pitch}</span></button>`).join('')}
      </div>
      <ul class="passives">${f.passives.map(p=>`<li>${p}</li>`).join('')}</ul>
      <p class="lbl">Morte</p>
      <div class="choices">
        <button class="choice" type="button" data-act="mode:normal" aria-pressed="${pick_.mode==='normal'}"><strong>Padrão</strong><span class="d">Ao morrer, a expedição acaba, mas você leva ao acampamento tudo o que pegou.</span></button>
        <button class="choice" type="button" data-act="mode:hardcore" aria-pressed="${pick_.mode==='hardcore'}"><strong>Hardcore</strong><span class="d">Ao morrer, o herói se perde para sempre.</span></button>
      </div>
      <button class="primary" type="button" data-act="create">Criar herói</button>
    </div>`;
  showScreen('heroes');
}
$('scrHeroes').addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const [act, arg] = b.dataset.act.split(':');
  if (act==='cls'){ pick_.cls = arg; showHeroes(); }
  else if (act==='col'){ pick_.color = arg; showHeroes(); }
  else if (act==='mode'){ pick_.mode = arg; showHeroes(); }
  else if (act==='create'){
    const name = ($('heroName').value || '').trim() || 'Sem Nome';
    const h = newHero(name.slice(0,20), pick_.cls, pick_.color, pick_.mode);
    SAVE.heroes.push(h); persist(); $('heroName').value = '';
    HERO = h; startExpedition({kind:'tutorial'});
  }
  else if (act==='play'){ HERO = SAVE.heroes.find(h=>h.id===arg); delPending = null; showCamp(); }
  else if (act==='del'){
    if (delPending===arg){ SAVE.heroes = SAVE.heroes.filter(h=>h.id!==arg); delPending = null; persist(); }
    else delPending = arg;
    showHeroes();
  }
});

/* ---------- Camp ---------- */
let campNotice = '';
function affixLine(a){ return `<li class="${AFX[a.k].rule?'rule':''}">${AFX[a.k].t(a.v)}${a.t ? ` <span class="tier t${a.t}">T${a.t}</span>` : ''}${a.heir ? ' <span class="heir">herança</span>' : ''}</li>`; }
function itemBlock(it){
  return `<div class="nm rc-${it.rar}">${esc(it.name)}</div><ul>${it.affixes.map(affixLine).join('')}</ul>`;
}
const actProgress = (h, t = h.torment||0) => t ? ((h.actsByT||{})[t]||0) : h.actDone;
function tormentDesc(t){
  const next = 'Zere a campanha no nível mais alto liberado para abrir o próximo (cada nível recomeça no Ato 1).';
  if (!t) return `Base: o Ato 1 é tranquilo e o conteúdo (elites, grupos, formações, Maré, Rival) entra ato a ato. ${next}`;
  return `Inimigos +${30*t}% de vida, +${t} de dano, ${12*t}% mais numerosos${t>=3?', uma elite a mais por andar':''}; todo o conteúdo desde o primeiro andar. Recompensa +${25*t}% e raridade maior. ${next}`;
}
/* ---------- Camp: three tabs (expeditions, equipment, talents) ---------- */
let campTab = 'exp', campSel = null, campFilter = 'all';
const SLOT_ICON = {
  arma:'<path d="M14.5 3.5h6v6l-9.5 9.5-6-6z"/><path d="M8 13l3 3M4 20l3.5-3.5M5.5 15.5l3 3"/>',
  elmo:'<path d="M4.5 15a7.5 7.5 0 0 1 15 0v3.5h-15z"/><path d="M9.5 18.5v-4.5h5v4.5M12 7.5v-3"/>',
  armadura:'<path d="M8 3.5l4 2 4-2 4.5 4-3 2.5v10.5h-11V10l-3-2.5z"/><path d="M12 5.5v15"/>',
  botas:'<path d="M8 3.5h5.5v9l6 3.2v4.8H8z"/><path d="M8 17h11.5"/>',
  anel:'<circle cx="12" cy="14.5" r="5.5"/><path d="M9.5 4.5h5l1.8 2.8-4.3 2.4-4.3-2.4z"/>'
};
const slotIcon = (slot, cls='') => `<svg class="sicon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${SLOT_ICON[slot]}</svg>`;
function itemTile(it, act, selected){
  return `<button class="itile r-${it.rar} ${selected?'sel':''}" type="button" data-act="${act}" aria-pressed="${selected}" title="${esc(it.name)}">
    ${slotIcon(it.slot)}<span class="iname">${esc(it.name)}</span></button>`;
}
// numeric changes and rule effects gained/lost when `it` replaces what is in its slot
function swapDiff(h, it){
  const cur = h.equip[it.slot];
  const a = statsFor(h.cls, h.color, h.equip), b = statsFor(h.cls, h.color, {...h.equip, [it.slot]:it});
  const nums = [['dmg','dano'],['hp','vida'],['shield','escudo por andar'],['cdr','recarga'],['crit','% de crítico'],['eliteDmg','% contra elites e chefes'],
    ['block','% de bloqueio'],['healKill','de cura ao matar'],['mf','% de achado de itens'],['gold','% de ouro'],
    ['fireDmg','de dano de fogo'],['coldDmg','de dano de gelo'],['lightDmg','de dano de raio'],['resFire','% de resistência a fogo'],['resCold','% de resistência a gelo'],['resLight','% de resistência a raio']].map(([k,l]) => [l, b[k]-a[k]]).filter(([,d]) => d);
  const rules = x => x ? x.affixes.filter(f => AFX[f.k].rule).map(f => AFX[f.k].t(f.v)) : [];
  const gain = rules(it).filter(t => !rules(cur).includes(t)), lose = rules(cur).filter(t => !rules(it).includes(t));
  return {nums, gain, lose};
}
function diffHtml(d){
  const rows = d.nums.map(([l,v]) => `<li class="${v>0?'up':'down'}">${v>0?'+':''}${v}${l.startsWith('%') ? l : ' '+(l.startsWith('de ') ? l : 'de '+l)}</li>`)
    .concat(d.gain.map(t => `<li class="up">Ganha: ${t}</li>`), d.lose.map(t => `<li class="down">Perde: ${t}</li>`));
  return rows.length ? `<ul class="diff">${rows.join('')}</ul>` : '<p class="muted small">Sem diferença nos atributos.</p>';
}
function campGear(h){
  const st = statsFor(h.cls, h.color, h.equip);
  const slots = Object.keys(SLOTS).map(s => {
    const it = h.equip[s], sel = campSel && campSel.from==='equip' && campSel.slot===s;
    return it ? `<div class="eslot"><span class="lbl">${SLOTS[s].label}</span>${itemTile(it, 'selE:'+s, sel)}</div>`
      : `<div class="eslot"><span class="lbl">${SLOTS[s].label}</span><div class="itile empty">${slotIcon(s)}<span class="iname">vazio</span></div></div>`;
  }).join('');
  const list = h.stash.map((it,i) => ({it,i})).filter(o => campFilter==='all' || o.it.slot===campFilter)
    .sort((a,b) => ['legend','rare','magic','common'].indexOf(a.it.rar) - ['legend','rare','magic','common'].indexOf(b.it.rar));
  const chips = [['all','Todos'], ...Object.keys(SLOTS).map(s => [s, SLOTS[s].label])].map(([k,l]) => {
    const n = k==='all' ? h.stash.length : h.stash.filter(it => it.slot===k).length;
    return `<button class="chip ${campFilter===k?'on':''}" type="button" data-act="filter:${k}" aria-pressed="${campFilter===k}">${l} <span>${n}</span></button>`;
  }).join('');
  const commons = h.stash.filter(it => it.rar==='common');
  const grid = list.length ? `<div class="igrid">${list.map(o => itemTile(o.it, 'selS:'+o.i, campSel && campSel.from==='stash' && campSel.i===o.i)).join('')}</div>`
    : `<p class="muted">${h.stash.length ? 'Nada deste tipo no baú.' : 'Vazio. Itens guardados nas expedições aparecem aqui.'}</p>`;
  // detail of the selected item
  let detail = '<p class="muted">Clique num item, equipado ou do baú, para ver os detalhes e comparar.</p>';
  if (campSel && campSel.from==='stash' && h.stash[campSel.i]){
    const it = h.stash[campSel.i], cur = h.equip[it.slot];
    detail = `${itemCard(it,'No baú')}
      <h4 class="dh">Se equipar, no lugar de ${cur ? `<span class="rc-${cur.rar}">${esc(cur.name)}</span>` : 'nada'}</h4>${diffHtml(swapDiff(h, it))}
      ${cur ? `<details class="curd"><summary>Ver o item equipado</summary>${itemCard(cur,'Equipado')}</details>` : ''}
      <div class="row"><button class="primary sm" type="button" data-act="equip:${campSel.i}">Equipar</button>
      <button class="ghost sm" type="button" data-act="sell:${campSel.i}">Vender por ${sellPrice(it)}</button></div>`;
  } else if (campSel && campSel.from==='equip' && h.equip[campSel.slot]){
    const it = h.equip[campSel.slot], full = h.stash.length>=STASH_MAX;
    const alts = h.stash.filter(o => o.slot===it.slot).length;
    detail = `${itemCard(it,'Equipado')}
      <p class="muted small">${alts ? `${alts} ${alts===1?'item':'itens'} deste tipo no baú: use o filtro ${SLOTS[it.slot].label} para comparar.` : 'Nenhum item deste tipo no baú.'}</p>
      <div class="row"><button class="ghost sm" type="button" data-act="unequip:${campSel.slot}" ${full?'disabled':''}>Guardar no baú${full?' (cheio)':''}</button></div>`;
  }
  return `<div class="gearlayout">
    <section class="gpanel">
      <h3 class="sub">Equipado</h3><div class="eslots">${slots}</div>
      <dl class="stats st4"><div><dt>Dano</dt><dd>${st.dmg}</dd></div><div><dt>Vida</dt><dd>${st.hp}</dd></div><div><dt>Escudo</dt><dd>${st.shield}</dd></div><div><dt>Recarga</dt><dd>-${st.cdr}</dd></div></dl><p class="resline"><b>Resistências</b>: fogo ${st.resFire}% · gelo ${st.resCold}% · raio ${st.resLight}%${st.fireDmg+st.coldDmg+st.lightDmg ? `<br><b>Dano elemental</b>: fogo +${st.fireDmg} · gelo +${st.coldDmg} · raio +${st.lightDmg}` : ''}</p>
    </section>
    <section class="gpanel">
      <div class="shead"><h3 class="sub">Baú <span class="muted">${h.stash.length}/${STASH_MAX}</span></h3>
        ${commons.length ? `<button class="ghost sm" type="button" data-act="sellcommons">Vender ${commons.length} ${commons.length===1?'comum':'comuns'} (+${commons.reduce((a,it)=>a+sellPrice(it),0)})</button>` : ''}</div>
      <div class="chips">${chips}</div>${grid}
    </section>
    <section class="gpanel detail" aria-live="polite"><h3 class="sub">Detalhes</h3>${detail}</section>
  </div>`;
}
let campNode = null;
// hover tooltip for the passive tree
function treeTip(ev){
  const g = ev.target.closest && ev.target.closest('.nd');
  let tip = document.getElementById('treeTip');
  if (!g || (campTab!=='tal' && campTab!=='atl') || !HERO){ if (tip) tip.hidden = true; return; }
  if (!tip){ tip = document.createElement('div'); tip.id = 'treeTip'; tip.className = 'ttip'; document.body.appendChild(tip); }
  const [act, id] = g.dataset.act.split(':'), atlas = act==='anode', n = (atlas ? atlasTree() : treeFor(HERO.cls))[id];
  const on = id==='start' || (atlas ? HERO.atlasTree||[] : HERO.tree||[]).includes(id), canL = atlas ? canLearnAtlas(HERO, id) : canLearn(HERO, id), pts = atlas ? atlasPoints(HERO) : treePoints(HERO);
  const kind = {small:'Passiva', notable:'Notável', key:'Pedra-chave', start:'Origem'}[n.kind];
  const status = on ? '<span class="st on">Aprendido</span>' : canL ? '<span class="st av">Clique para ver e aprender (1 ponto)</span>'
    : `<span class="st no">${pts>0 ? 'Bloqueado: precisa estar ligado a um nó aprendido' : 'Sem pontos livres'}</span>`;
  tip.innerHTML = `<span class="k">${kind}${n.branch ? ' · ' + n.branch : ''}</span><b class="${n.kind}">${esc(n.name)}</b>${n.kind!=='small' || n.d!==n.name ? `<p>${esc(n.d)}</p>` : ''}${status}`;
  tip.hidden = false;
  const r = tip.getBoundingClientRect(), x = Math.min(ev.clientX + 16, innerWidth - r.width - 8), y = Math.min(ev.clientY + 16, innerHeight - r.height - 8);
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
$('scrCamp').addEventListener('mousemove', treeTip);
$('scrCamp').addEventListener('mouseleave', () => { const t = document.getElementById('treeTip'); if (t) t.hidden = true; });
// draws any radial tree (hero passives or Atlas) as SVG; nodes carry data-act="<nodeAct>:<id>"
function renderTree(T, on, can, nodeAct, branches, sel){
  const lines = [], dots = [], labels = [];
  for (const n of Object.values(T)){
    for (const l of n.links) if (n.id < l) lines.push(`<line x1="${n.x}" y1="${n.y}" x2="${T[l].x}" y2="${T[l].y}" class="${on.has(n.id)&&on.has(l)?'on':''}"/>`);
    const r = n.kind==='key' ? .55 : n.kind==='notable' ? .42 : n.kind==='start' ? .45 : .26;
    const cls = [n.kind, on.has(n.id) ? 'on' : can(n.id) ? 'avail' : '', sel===n.id ? 'sel' : ''].join(' ');
    dots.push(`<g class="nd ${cls}" data-act="${nodeAct}:${n.id}"><circle cx="${n.x}" cy="${n.y}" r="${r}"/></g>`);
    if (n.kind==='notable' || n.kind==='key') labels.push(`<text x="${n.x}" y="${n.y + r + .5}" class="${on.has(n.id)?'on':''}">${esc(n.name)}</text>`);
  }
  const bl = branches.map(b => { const a = b.ang*Math.PI/180; return `<text x="${Math.cos(a)*9.4}" y="${-Math.sin(a)*10.4}" style="font-size:.5px;fill:#e07a32">${b.name}</text>`; }).join('');
  return `<svg class="treesvg" viewBox="-12 -12 24 24" role="img">${lines.join('')}${dots.join('')}${labels.join('')}${bl}</svg>`;
}
const NODE_KIND = {small:'Passiva', notable:'Notável', key:'Pedra-chave', start:'Origem'};
function nodeDetail(sel, on, can, pts, learnAct){
  if (!sel) return '<p>Clique num nó para ver o que ele faz. Nós grandes são Notáveis (regras novas); os maiores, no fim de cada ramo, são Pedras-chave.</p>';
  return `<span class="xk">${NODE_KIND[sel.kind]}${sel.branch ? ' · '+sel.branch : ''}</span><b>${esc(sel.name)}</b><p>${esc(sel.d)}</p>
    ${on.has(sel.id) ? '<p class="pw">Aprendido.</p>' : can(sel.id) ? `<button class="primary sm" type="button" data-act="${learnAct}:${sel.id}">Aprender (1 ponto)</button>` : `<p>${pts>0 ? 'Precisa estar ligado a um nó aprendido.' : 'Sem pontos livres.'}</p>`}`;
}
let campANode = null;
function campTree(h){
  const T = treeFor(h.cls), on = new Set(['start', ...(h.tree||[])]), pts = treePoints(h), can = id => canLearn(h, id);
  return `<div class="thead"><p class="muted">${pts>0 ? `Você tem <b class="pts">${pts}</b> ${pts===1?'ponto':'pontos'} para gastar.` : 'Sem pontos livres.'} Ganha 1 por nível. Comece pelo centro e avance pelos ramos.</p>
      <button class="ghost sm" type="button" data-act="respec">Redistribuir pontos (grátis)</button></div>
    <div class="treewrap">${renderTree(T, on, can, 'node', TREE_BRANCHES, campNode)}<div class="tdet">${nodeDetail(campNode && T[campNode], on, can, pts, 'learn')}</div></div>`;
}
function campAtlas(h){
  if (h.actDone<4) return '<p class="muted">Conclua o Ato 4 para liberar os mapas e o Atlas.</p>';
  const T = atlasTree(), on = new Set(['start', ...(h.atlasTree||[])]), pts = atlasPoints(h), can = id => canLearnAtlas(h, id);
  const col = {crypt:'#8a6a48', swamp:'#5f8a55', forge:'#d0602a', cathedral:'#8fb0d8'};
  const prog = ACTS.map(b => { const n = [...Array(10).keys()].filter(i => (h.atlas||{})[b+'-'+(i+1)]).length;
    return `<div class="aprog"><span>${BIOMES[b].name}</span><div class="adots">${[...Array(10).keys()].map(i => `<i class="${(h.atlas||{})[b+'-'+(i+1)] ? 'done' : ''}" style="--bc:${col[b]}" title="Nível ${i+1}${(h.atlas||{})[b+'-'+(i+1)] ? ': concluído' : ''}"></i>`).join('')}</div><small>${n}/10</small></div>`; }).join('');
  return `<div class="thead"><p class="muted">Cada bioma e nível de mapa concluído pela primeira vez (matando o chefe do mapa) dá 1 ponto. Os efeitos do Atlas valem dentro dos mapas. ${pts>0 ? `<b class="pts">${pts}</b> ${pts===1?'ponto livre':'pontos livres'}.` : 'Sem pontos livres.'}</p>
      <button class="ghost sm" type="button" data-act="atlasReset">Redistribuir (grátis)</button></div>
    <div class="treewrap">${renderTree(T, on, can, 'anode', ATLAS_BRANCHES, campANode)}<div class="tdet">${nodeDetail(campANode && T[campANode], on, can, pts, 'alearn')}<h4 class="dh">Conclusões</h4>${prog}</div></div>`;
}
function campTalents(h, pts){
  const cards = talentList(h.cls).map(t => {
    const r = h.talents[t.id]||0, locked = h.level < t.req, can = pts>0 && r<t.max && !locked;
    const pips = Array.from({length:t.max}, (_,i) => `<i class="${i<r?'on':''}"></i>`).join('');
    return `<div class="tcard ${locked?'locked':''} ${r?'has':''}"><div class="tt"><b>${t.name}</b><span class="pips" aria-label="${r} de ${t.max}">${pips}</span></div>
      <p>${t.desc(Math.max(1,r))}</p>${locked ? `<span class="muted small">Libera no nível ${t.req}</span>` : `<button class="${can?'primary':'ghost'} sm" type="button" data-act="talent:${t.id}" ${can?'':'disabled'}>${r>=t.max?'Completo':'Aprender'}</button>`}</div>`;
  }).join('');
  return `<div class="thead"><p class="muted">${pts>0 ? `Você tem <b class="pts">${pts}</b> ${pts===1?'ponto':'pontos'} para gastar. Ganha 1 por nível.` : 'Sem pontos livres. Você ganha 1 por nível.'}</p>
    <button class="ghost sm" type="button" data-act="respec">Redistribuir pontos (grátis)</button></div><div class="tgrid">${cards}</div>`;
}
/* Expeditions tab: three portals on top (Campaign, Modes, Maps), the chosen one opens below.
   Maps use a Map Device: pick a map from your stash, it goes into the device, apply currency, open the portal. */
let campExp = null, campAct = null, campDev = null;
const mapsOpen = h => h.actDone>=4;
function campExpeditions(h){
  if (!campExp) campExp = mapsOpen(h) && actProgress(h)>=4 ? 'maps' : 'camp';
  if (campExp==='maps' && !mapsOpen(h)) campExp = 'camp';
  const prog = actProgress(h), side = h.color==='w' ? 'dark' : 'holy';
  const nextAct = Math.min(3, prog);
  const portal = (k, kicker, title, sub, locked) => `<button class="portal p-${k} ${campExp===k?'on':''}" type="button" data-act="xsub:${k}" aria-pressed="${campExp===k}" ${locked?'disabled':''}>
      <span class="xk">${kicker}</span><b>${title}</b><small>${sub}</small></button>`;
  const portals = `<div class="portals">
    ${portal('camp', 'Campanha', prog>=4 ? 'Concluída' : `Ato ${nextAct+1}: ${BIOMES[ACTS[nextAct]].name}`, prog>=4 ? 'Suba o Tormento ou repita um ato' : 'Continue a história', false)}
    ${portal('modes', 'Modos', 'Abismo, Desafio, Caças', `Recorde no Abismo: andar ${h.record||0}`, false)}
    ${portal('maps', 'Mapas', mapsOpen(h) ? `${h.maps.length} ${h.maps.length===1?'mapa':'mapas'}` : 'Bloqueado', mapsOpen(h) ? 'Dispositivo de Mapas' : 'Conclua o Ato 4 da campanha', !mapsOpen(h))}
  </div>`;
  const torm = `<div class="tormbar"><div><span class="xk">Dificuldade · vale para tudo, menos o desafio do dia</span><b>${h.torment ? 'Tormento '+h.torment : 'Normal'}</b><p class="muted small">${tormentDesc(h.torment||0)}</p></div>
      <div class="tstep"><button class="ghost sm" type="button" data-act="torm:-1" ${(h.torment||0)>0?'':'disabled'} aria-label="Diminuir tormento">−</button>
      <span>${h.torment||0} / ${h.tormentMax||0}</span>
      <button class="ghost sm" type="button" data-act="torm:1" ${(h.torment||0)<(h.tormentMax||0)?'':'disabled'} aria-label="Aumentar tormento">+</button></div></div>`;
  const body = campExp==='maps' ? expMaps(h, side) : campExp==='modes' ? expModes(h, side) : expCampaign(h, side, prog);
  return portals + torm + `<div class="xbody">${body}</div>`;
}
function expCampaign(h, side, prog){
  if (campAct===null || campAct>Math.min(3,prog)) campAct = Math.min(3, prog);
  const nodes = ACTS.map((b,i) => {
    const open = i <= prog, done = i < prog;
    return `<button class="actnode bio-${b} ${campAct===i?'on':''} ${done?'done':''}" type="button" data-act="actsel:${i}" ${open?'':'disabled'} aria-pressed="${campAct===i}">
      <span class="an-n">${done ? '✓' : i+1}</span><span class="an-t"><b>${BIOMES[b].name}</b><small>${done ? 'Concluído' : open ? 'Disponível' : 'Bloqueado'}</small></span></button>`;
  }).join('<span class="an-link" aria-hidden="true"></span>');
  const b = ACTS[campAct], done = campAct < prog;
  return `<div class="actpath">${nodes}</div>
    <div class="actdetail bio-${b}">
      <div><span class="xk">Ato ${campAct+1}${h.torment ? ` · Tormento ${h.torment}` : ''}</span><h3 class="sh">${BIOMES[b].name}</h3>
        <p>${BIOMES[b].rule}</p><p class="muted small">Três andares; o último é o chefe: ${BOSSES[BIOMES[b].boss].names[side]}.</p></div>
      <button class="primary" type="button" data-act="act:${campAct}">${done ? 'Repetir ato' : `Iniciar Ato ${campAct+1}`}</button>
    </div>
    <p class="muted small xfoot">Primeira vez? <button class="link" type="button" data-act="tutorial">${h.tutorialDone ? 'Refazer o Pátio de Treino' : 'Fazer o Pátio de Treino'}</button></p>`;
}
function expModes(h, side){
  const dailyDone = h.daily===todayStr();
  const hunts = h.bossesKilled.length ? `<div class="chips">${h.bossesKilled.map(id => `<button class="ghost sm" type="button" data-act="hunt:${id}">${BOSSES[id].names[side]}</button>`).join('')}</div>` : '<p class="muted small">Derrote um chefe na campanha para poder caçá-lo de novo.</p>';
  const ev = [['Fenda','#b08cff','Pise no rasgo roxo: 5 turnos de crias que deixam Estilhaços.'],['Partida Congelada','#cfe6f5','Um problema de xeque-mate; ensina poderes do Grimório e dá Selos.'],
    ['Maré de Sangue','#e04a3a','Onda de 1 a 3 andares: poças de sangue, Brasas e o Baú Tormentoso.'],['Rival', '#8fd18a', `${esc(heroRival(h).name)}, nível ${heroRival(h).tier}: pode aparecer uma vez por expedição.`]];
  return `<div class="xgrid">
      <div class="xcard"><span class="xk">Sem fim</span><b>Abismo infinito</b><p>Biomas mudam a cada 3 andares, chefe a cada 3, o Reflexo a cada 12. A dificuldade sobe a cada andar.</p><p class="muted small">Recorde: andar ${h.record||0}.</p><button class="primary sm" type="button" data-act="abyss">Descer</button></div>
      <div class="xcard"><span class="xk">Desafio do dia · ${todayStr()}</span><b>Tabuleiro do dia</b><p>Igual para todos. Vença dentro do limite de turnos.</p><p class="muted small">${dailyDone ? 'Recompensa de hoje já recebida.' : 'Recompensa: escolha entre dois únicos.'}</p><button class="ghost sm" type="button" data-act="daily">Jogar</button></div>
      <div class="xcard"><span class="xk">Caça ao chefe</span><b>Enfrente um chefe direto</b><p>Um andar só, com o chefe e as relíquias dele.</p>${hunts}</div>
    </div>
    <h3 class="sub">Chefes supremos <span class="muted">cada um custa ${UBER_COST.shards} Estilhaços (você tem ${h.riftShards||0}) e ${UBER_COST.seals} Selos (você tem ${h.checkSeals||0})</span></h3>
    <div class="xgrid">${Object.entries(UBERS).map(([id,U]) => `<div class="xcard bio-${U.biome}"><span class="xk">Supremo</span><b>${U.name}</b>
      <p>${U.special} Deixa únicos exclusivos.</p>
      <button class="${canUber(h)?'primary':'ghost'} sm" type="button" data-act="uber:${id}" ${canUber(h)?'':'disabled'}>Enfrentar</button></div>`).join('')}</div>
    <h3 class="sub">Eventos que surgem nos andares <span class="muted">em qualquer modo</span></h3>
    <div class="evstrip">${ev.map(([n,c,d]) => `<div style="--ec:${c}"><b>${n}</b><span>${d}</span></div>`).join('')}</div>`;
}
function mapTile(m, on){
  const pen = m.affixes.filter(a => !isRewardAffix(a)).length, rew = m.affixes.length - pen, new_ = !(HERO.atlas||{})[`${m.biome}-${m.tier}`];
  return `<button class="mtile bio-${m.biome} ${on?'on':''}" type="button" data-act="dev:${m.id}" aria-pressed="${on}" title="${esc(mapName(m))}">
    <span class="mt-tier">${m.tier}</span><span class="mt-name">${BIOMES[m.biome].name}</span>
    <span class="mt-aff">${'<i class="pen"></i>'.repeat(pen)}${'<i class="rew"></i>'.repeat(rew)}</span>${new_ ? '<span class="mt-new">novo</span>' : ''}</button>`;
}
function expMaps(h, side){
  const maps = h.maps.slice().sort((a,b) => b.tier-a.tier || a.biome.localeCompare(b.biome));
  if (campDev && !h.maps.some(m => m.id===campDev)) campDev = null;
  if (!campDev && maps.length) campDev = maps[0].id;
  const m = h.maps.find(m => m.id===campDev);
  const cur = Object.keys(CURRENCY).map(k => { const n = (h.currency||{})[k]||0;
    return `<button class="curbtn" type="button" data-act="cur:${m?m.id:''}|${k}" ${n&&m?'':'disabled'} title="${CURRENCY[k].d}" style="--cc:${CURRENCY[k].c}"><b>${CURRENCY[k].short}</b><span>${n}</span><small>${CURRENCY[k].d}</small></button>`; }).join('');
  const done = Object.keys(h.atlas||{}).length;
  const device = m ? `<div class="dev-core bio-${m.biome}"><span class="xk">Nível</span><span class="dc-tier">${m.tier}</span><span class="dc-name">${BIOMES[m.biome].name}</span></div>
      <div class="dev-info">
        <p class="muted small">Chefe no 3º andar: <b>${BOSSES[m.boss].names[side]}</b>${(h.atlas||{})[`${m.biome}-${m.tier}`] ? ' · já concluído no Atlas' : ' · primeira conclusão: +1 ponto de Atlas'}</p>
        <ul class="maff">${m.affixes.filter(a=>!isRewardAffix(a)).map(a => `<li class="pen">${MAP_AFFIXES[a]}</li>`).join('')}${m.affixes.filter(isRewardAffix).map(a => `<li class="rew">${MAP_AFFIXES[a].replace('Recompensa: ','')}</li>`).join('')}</ul>
        <button class="primary devgo" type="button" data-act="map:${m.id}">Abrir o portal</button>
      </div>`
    : `<div class="dev-core empty"><span class="dc-name">Vazio</span></div><div class="dev-info"><p class="muted">Nenhum mapa. Mapas caem dos chefes no Abismo infinito e nos próprios mapas.</p></div>`;
  return `<div class="mapdev">
      <section class="mstash" aria-label="Seus mapas"><h3 class="sub">Seus mapas <span class="muted">${maps.length} · clique para pôr no dispositivo</span></h3>
        <div class="mgrid">${maps.map(x => mapTile(x, x.id===campDev)).join('') || '<p class="muted small">Vazio.</p>'}</div>
        <p class="muted small">Atlas: ${done} ${done===1?'mapa concluído':'mapas concluídos'}. Pontos e bônus na aba Atlas.</p></section>
      <section class="device" aria-label="Dispositivo de Mapas"><h3 class="sub">Dispositivo de Mapas</h3>
        <div class="dev-main">${device}</div>
        <div class="dev-cur"><span class="xk">Moedas · aplicar no mapa do dispositivo</span><div class="curgrid">${cur}</div></div>
      </section>
    </div>`;
}
function campSkills(h){
  const pool = CLASSES[h.cls].skills, st = statsFor(h.cls, h.color, h.equip);
  barSkills();   // initialises h.skills for older heroes
  const onBar = h.skills.filter(id => pool.indexOf(id)>=0 && h.level >= SKILL_UNLOCK[pool.indexOf(id)]);
  h.runes = h.runes || {}; h.skillRunes = h.skillRunes || {};
  const bag = Object.keys(RUNES).filter(r => h.runes[r]>0).map(r => `<span class="rchip" title="${RUNES[r].d}">${RUNES[r].name}<b>×${h.runes[r]}</b></span>`).join('');
  const card = (id, i) => {
    const sk = SKILLS[id], lock = i>=0 && h.level < SKILL_UNLOCK[i], on = onBar.includes(id), fixed = id==='shift';
    const r = h.skillRunes[id];
    const fits = Object.keys(RUNES).filter(k => h.runes[k]>0 && (!RUNES[k].hit || sk.hits));
    const rune = lock ? '' : r
      ? `<div class="rslot"><span><b>${RUNES[r].name}</b>: ${RUNES[r].d}</span><div class="rpick"><button class="ghost sm" type="button" data-act="unrune:${id}">Remover runa</button></div></div>`
      : `<div class="rslot"><span>Encaixe de runa vazio${fits.length ? '' : ' · nenhuma runa que sirva'}</span>${fits.length ? `<div class="rpick">${fits.map(k => `<button class="ghost sm" type="button" data-act="rune:${id}|${k}" title="${RUNES[k].d}">${RUNES[k].name}</button>`).join('')}</div>` : ''}</div>`;
    const btn = fixed ? '<span class="muted small">Sempre na barra (Bispo)</span>'
      : lock ? `<span class="muted small">Libera no nível ${SKILL_UNLOCK[i]}</span>`
      : on ? `<button class="ghost sm" type="button" data-act="skillOff:${id}" ${onBar.length<=1?'disabled':''}>Tirar da barra</button>`
      : `<button class="primary sm" type="button" data-act="skillOn:${id}" ${onBar.length>=BAR_MAX?'disabled':''}>Pôr na barra</button>`;
    return `<div class="scard ${on||fixed?'onbar':''} ${lock?'locked':''}"><div class="tt"><b>${sk.name}</b><span class="muted small">recarga ${sk.cd}${sk.free?' · não gasta ação':''}</span></div>
      <p>${sk.desc(st)}.</p>${btn}${rune}</div>`;
  };
  const cards = pool.map((id,i) => card(id,i)).join('') + (h.cls==='B' ? card('shift', -1) : '');
  return `<div class="thead"><p class="muted">Escolha até ${BAR_MAX} habilidades para a barra (${onBar.length}/${BAR_MAX}). Runas mudam uma habilidade; caem de elites, chefes e baús.</p></div>
    <div class="runebag">${bag || '<span class="muted small">Você ainda não tem runas.</span>'}</div>
    <div class="sgrid">${cards}</div>`;
}
function miniBoard(fen){
  const b = chParse(fen);
  return `<div class="mini" aria-hidden="true">${b.map((p,i) => `<i class="${(i%8 + ((i/8)|0))%2 ? 'd' : 'l'} ${p ? p.c : ''}">${p ? GLYPH[p.t] : ''}</i>`).join('')}</div>`;
}
function campGrimoire(h){
  const g = h.grimoire || {};
  const cards = MATES.map(m => g[m.id]
    ? `<div class="gcard known"><b>${m.name}</b>${miniBoard(m.fen)}<p>${m.tip}</p><p class="pw">Poder: ${m.power}</p></div>`
    : `<div class="gcard"><b>???</b><p>Padrão desconhecido · mate em ${m.n}.</p><p>Resolva uma Partida Congelada com este padrão para aprendê-lo e ganhar o poder.</p></div>`).join('');
  return `<div class="thead"><p class="muted">Cada padrão de mate resolvido numa Partida Congelada entra aqui e dá um poder permanente. Partidas aparecem em andares a partir do Ato 2, no Abismo e nos mapas.</p></div><div class="ggrid">${cards}</div>`;
}
function showCamp(notice){
  if (notice!==undefined) campNotice = notice;
  if (legacyNotice){ campNotice = legacyNotice; legacyNotice = ''; }
  if (HERO.actDone>=4 && !HERO.maps.length){ HERO.maps.push(makeMap(1)); campNotice = (campNotice ? campNotice+' ' : '') + 'Você estava sem mapas: um mapa de nível 1 foi deixado no acampamento.'; persist(); }
  S = null; rng = Math.random;
  const h = HERO, pts = talentPoints(h);
  if (campSel && campSel.from==='stash' && !h.stash[campSel.i]) campSel = null;
  if (campSel && campSel.from==='equip' && !h.equip[campSel.slot]) campSel = null;
  const runeN = Object.values(h.runes||{}).reduce((a,b)=>a+b,0);
  const tabs = [['exp','Expedições'],['gear','Equipamento'],['skl', `Habilidades${runeN?` <span class="badge">${runeN}</span>`:''}`],['tal', `Árvore${pts>0?` <span class="badge">${pts}</span>`:''}`],['atl', `Atlas${h.actDone>=4 && atlasPoints(h)>0 ? ` <span class="badge">${atlasPoints(h)}</span>` : ''}`],['gri', `Grimório <span class="muted small">${MATES.filter(m=>(h.grimoire||{})[m.id]).length}/${MATES.length}</span>`]]
    .map(([k,l]) => `<button class="tab ${campTab===k?'on':''}" type="button" role="tab" aria-selected="${campTab===k}" data-act="tab:${k}">${l}</button>`).join('');
  const body = campTab==='gear' ? campGear(h) : campTab==='tal' ? campTree(h) : campTab==='skl' ? campSkills(h) : campTab==='gri' ? campGrimoire(h) : campTab==='atl' ? campAtlas(h) : campExpeditions(h);
  $('scrCamp').innerHTML = `
    <div class="camphead">
      <span class="g ${h.color} big">${GLYPH[h.cls]}</span>
      <div class="chname"><h2 class="sh">${esc(h.name)}</h2><span class="muted">${CLASSES[h.cls].name} · ${FACTIONS[h.color].name} · ${h.mode==='hardcore'?'Hardcore':'Padrão'}</span></div>
      <div class="chlvl"><div class="vl"><span>Nível ${h.level}</span><span>${h.xp} / ${xpNeed(h.level)}</span></div><div class="bar xp"><i style="width:${100*h.xp/xpNeed(h.level)}%"></i></div></div>
      <dl class="stats"><div><dt>Ouro</dt><dd>${h.gold}</dd></div><div><dt>Recorde</dt><dd>${h.record||0}</dd></div><div><dt>Mapas</dt><dd>${h.maps.length}</dd></div><div><dt>Estilhaços</dt><dd>${h.riftShards||0}</dd></div><div><dt>Selos</dt><dd>${h.checkSeals||0}</dd></div><div><dt>Brasas</dt><dd>${h.embers||0}</dd></div></dl>
      <button class="ghost sm" type="button" data-act="switch">Trocar de herói</button>
    </div>
    ${campNotice ? `<div class="notice">${campNotice}</div>` : ''}
    <div class="tabs" role="tablist">${tabs}</div>
    <div class="tabbody">${body}</div>`;
  const tt = document.getElementById('treeTip'); if (tt) tt.hidden = true;
  showScreen('camp');
}
$('scrCamp').addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b || b.disabled) return;
  const [act, arg] = b.dataset.act.split(':');
  const h = HERO;
  campNotice = '';
  if (act==='tab'){ campTab = arg; }
  else if (act==='xsub'){ campExp = arg; }
  else if (act==='actsel'){ campAct = +arg; }
  else if (act==='dev'){ campDev = +arg; }
  else if (act==='filter'){ campFilter = arg; }
  else if (act==='selS'){ campSel = {from:'stash', i:+arg}; }
  else if (act==='selE'){ campSel = {from:'equip', slot:arg}; }
  else if (act==='talent'){ const t = talentList(h.cls).find(t=>t.id===arg); if (talentPoints(h)>0 && (h.talents[arg]||0)<t.max && h.level>=t.req) h.talents[arg] = (h.talents[arg]||0)+1; }
  else if (act==='anode'){ campANode = arg; }
  else if (act==='alearn'){ h.atlasTree = h.atlasTree || []; if (canLearnAtlas(h, arg)) h.atlasTree.push(arg); }
  else if (act==='atlasReset'){ h.atlasTree = []; campANode = null; }
  else if (act==='cur'){ const [mid, k] = arg.split('|'); const m = h.maps.find(m => String(m.id)===mid); if (m) campNotice = applyCurrency(h, m, k); }
  else if (act==='respec'){ h.tree = []; campNode = null; }
  else if (act==='node'){ campNode = arg; }
  else if (act==='learn'){ h.tree = h.tree || []; if (canLearn(h, arg)) h.tree.push(arg); }
  else if (act==='fmode'){ SAVE.opts = SAVE.opts || {}; SAVE.opts.frozenMode = arg; }
  else if (act==='skillOn'){ barSkills(); if (!h.skills.includes(arg) && h.skills.length<BAR_MAX) h.skills.push(arg); }
  else if (act==='skillOff'){ barSkills(); if (h.skills.length>1) h.skills = h.skills.filter(id => id!==arg); }
  else if (act==='rune'){ const [id, r] = arg.split('|'); h.runes = h.runes||{}; h.skillRunes = h.skillRunes||{};
    if (h.runes[r]>0){ const old = h.skillRunes[id]; if (old) h.runes[old] = (h.runes[old]||0)+1; h.runes[r]--; h.skillRunes[id] = r; campNotice = `${RUNES[r].name} encaixada em ${SKILLS[id].name}.`; } }
  else if (act==='unrune'){ const r = (h.skillRunes||{})[arg]; if (r){ h.runes[r] = (h.runes[r]||0)+1; delete h.skillRunes[arg]; } }
  else if (act==='torm') h.torment = Math.max(0, Math.min(h.tormentMax||0, (h.torment||0) + Number(arg)));
  else if (act==='unequip'){ if (h.stash.length<STASH_MAX && h.equip[arg]){ h.stash.push(h.equip[arg]); h.equip[arg] = null; campSel = {from:'stash', i:h.stash.length-1}; } }
  else if (act==='equip'){
    const it = h.stash[+arg];
    if (it){ h.stash.splice(+arg,1); const old = h.equip[it.slot]; if (old) h.stash.push(old); h.equip[it.slot] = it;
      campSel = {from:'equip', slot:it.slot}; campNotice = `Equipado: ${esc(it.name)}${old ? `. ${esc(old.name)} foi para o baú` : ''}.`; }
  }
  else if (act==='sell'){ const it = h.stash[+arg]; if (it){ h.stash.splice(+arg,1); h.gold += sellPrice(it); campSel = null; campNotice = `Vendido: ${esc(it.name)} (+${sellPrice(it)} de ouro).`; } }
  else if (act==='sellcommons'){
    const c = h.stash.filter(it => it.rar==='common'), g = c.reduce((a,it)=>a+sellPrice(it),0);
    h.stash = h.stash.filter(it => it.rar!=='common'); h.gold += g; campSel = null;
    campNotice = `${c.length} ${c.length===1?'item comum vendido':'itens comuns vendidos'} (+${g} de ouro).`;
  }
  else if (act==='switch'){ persist(); showHeroes(); return; }
  else if (act==='act'){ startExpedition({kind:'campaign', act:+arg}); return; }
  else if (act==='abyss'){ startExpedition({kind:'abyss'}); return; }
  else if (act==='tutorial'){ startExpedition({kind:'tutorial'}); return; }
  else if (act==='uber'){ if (canUber(h)){ h.riftShards -= UBER_COST.shards; h.checkSeals -= UBER_COST.seals; persist(); startExpedition({kind:'uber', boss:arg||'queen'}); return; } }
  else if (act==='daily'){ startExpedition({kind:'daily'}); return; }
  else if (act==='hunt'){ startExpedition({kind:'hunt', boss:arg}); return; }
  else if (act==='map'){ const m = h.maps.find(m=>String(m.id)===arg); if (m){ startExpedition({kind:'map', map:m}); return; } }
  persist(); showCamp();
});

/* ---------- Expeditions ---------- */
function startExpedition(exp){
  rng = exp.kind==='daily' ? seeded(todaySeed()) : Math.random;
  if (exp.kind==='map') HERO.maps = HERO.maps.filter(m => m.id!==exp.map.id);
  persist();
  S = {exp, color:HERO.color, cls:HERO.cls, floor:0, player:{x:0,y:0,rx:0,ry:0,lx:0,ly:0,hp:0}, equip:HERO.equip, seen:new Set(),
       enemies:[], allies:[], items:[], walls:null, terrain:new Map(), danger:new Set(), dangerSeen:new Set(), threatNext:new Set(),
       fire:new Map(), burn:new Map(), pendingLoot:[], log:[], kills:0, phase:'busy', actions:1, cds:{}, mode:'move', killsThisAction:0, turn:1,
       mapAff:new Set(exp.kind==='map' ? exp.map.affixes : []), goldFound:0, xpFound:0, torment: exp.kind==='daily' ? 0 : (HERO.torment||0), tide:false,
       snapshot:JSON.stringify({equip:HERO.equip, stash:HERO.stash, gold:HERO.gold, maps:HERO.maps, runes:HERO.runes||{}, currency:HERO.currency||{}})};
  if (exp.kind==='map' && atlasRank('kDanger')){
    const keys = Object.keys(MAP_AFFIXES), have = S.mapAff;
    const pen = shuffle(keys.filter(a => !isRewardAffix(a) && !have.has(a)))[0], rew = shuffle(keys.filter(a => isRewardAffix(a) && !have.has(a)))[0];
    if (pen) have.add(pen); if (rew) have.add(rew);
  }
  S.player.hp = stats().hp;
  fx.parts=[]; fx.floats=[]; fx.flashes=[]; fx.rings=[]; fx.beams=[]; fx.embers=[];
  $('overlay').hidden = true;
  showScreen('game');
  nextFloor();
}
function endExpedition(reason){
  const ex = S.exp, run = S;
  rng = Math.random;
  if (ex.kind==='abyss') HERO.record = Math.max(HERO.record||0, S.floor);
  S.phase = 'over'; S.dead = S.dead || reason!=='return';
  const c = CLASSES[S.cls];
  if (reason==='death' && ex.kind!=='daily'){
    const lastHit = (run.hits||[]).slice(-1)[0];
    if (lastHit && HERO.rival && lastHit.msg.startsWith(HERO.rival.name)){ HERO.rival.tier++; HERO.rival.kills++; }
    if (HERO.mode==='hardcore'){
      const name = HERO.name;
      SAVE.heroes = SAVE.heroes.filter(h => h.id!==HERO.id); persist();
      boardMessage('Fim da linhagem', `${esc(name)} caiu para sempre. ${floorTitle()}.${deathRecap(run)}`, 'Escolher outro herói', () => showHeroes());
      return;
    }
    // normal mode: dying ends the expedition but you keep everything you picked up
    persist();
    const recap = deathRecap(run);
    boardMessage(`${c.art} ${c.name} caiu`, `${floorTitle()}. Você volta ao acampamento com tudo o que pegou: itens, ouro, mapas, runas e experiência (+${run.xpFound}). Só o que ficou no chão se perde.${recap}`, 'Voltar ao acampamento',
      () => showCamp(recap ? `${c.name} caiu em ${floorTitle()}.<details class="rdet"><summary>Como você morreu</summary>${recap}</details>` : ''));
    return;
  }
  if (ex.kind==='tutorial'){ HERO.tutorialDone = true; persist(); showCamp(reason==='abandon' ? 'Treino interrompido. Você pode refazê-lo pela aba Expedições.' : `${esc(HERO.name)} terminou o treino e chega ao acampamento à beira do abismo.`); return; }
  if (reason==='abandon'){
    persist();
    showCamp(ex.kind==='daily' ? 'Você desistiu do desafio do dia.' : `Expedição encerrada. Você trouxe tudo o que pegou (+${run.goldFound} de ouro, +${run.xpFound} de experiência).`);
    return;
  }
  persist();
  if (reason==='fail' || reason==='death'){
    boardMessage('Desafio falhou', `Você não venceu a tempo. Pode tentar de novo quantas vezes quiser hoje.`, 'Voltar ao acampamento', () => showCamp(''));
    return;
  }
  showCamp(`Expedição encerrada: +${run.goldFound} de ouro, +${run.xpFound} de experiência.`);
}
async function quitExpedition(){
  if (!S || !S.walls || S.phase!=='player') return;
  const daily = S.exp.kind==='daily';
  const v = await openModal({title:'Desistir da expedição?',
    body:`<p class="mtext">${daily ? 'Você volta ao acampamento e pode tentar o desafio de novo.' : `Você volta ao acampamento com tudo o que pegou nesta expedição (+${S.xpFound} de experiência). O que ficou no chão se perde.${HERO.mode==='hardcore' ? ' No Hardcore, desistir não mata o herói.' : ''}`}</p>`,
    actions:[{label:'Desistir', primary:true, value:'quit'}, {label:'Continuar jogando', value:'stay'}]});
  if (v!=='quit' || !S) { if (S) { S.phase = 'player'; updateUI(); } return; }
  endExpedition('abandon');
}
// what killed you: the killing blow, the last turns hit by hit, and who did the most damage
function deathRecap(run){
  const hits = run.hits || [];
  if (!hits.length) return '';
  const last = hits[hits.length-1], lastTurn = last.turn;
  const recent = hits.filter(h => h.turn >= lastTurn-2);
  const src = h => h.msg.replace(/\s*\(\d+\)\.?$/, '').replace(/\.$/, '').replace(/ te acertou$/, '');
  const by = {};
  for (const h of recent) by[src(h)] = (by[src(h)]||0) + h.taken + h.absorbed;
  const top = Object.entries(by).sort((a,b) => b[1]-a[1]);
  const total = recent.reduce((a,h) => a + h.taken, 0);
  const rows = recent.map(h => `<li><span class="rt">T${h.turn}</span><span class="rm">${esc(src(h))}</span><span class="rd">−${h.taken}${h.absorbed ? ` <small>(+${h.absorbed} no escudo)</small>` : ''}</span><span class="rh">${Math.max(0,h.hpBefore)} → ${Math.max(0,h.hpAfter)}</span></li>`).join('');
  const marked = recent.filter(h => h.danger).length;
  const tip = marked ? `${marked} ${marked===1?'golpe caiu':'golpes caíram'} numa casa que estava marcada em vermelho no seu turno.` : 'Nenhum golpe caiu em casa marcada: foi dano de área, efeito do terreno ou de afixo.';
  return `<div class="recap"><p class="rk">Golpe final: <b>${esc(src(last))}</b> (${last.taken} de dano)</p>
    <ol>${rows}</ol>
    <p class="rs">Nos últimos ${lastTurn - recent[0].turn + 1} turnos: ${total} de dano. Mais perigoso: ${top.slice(0,2).map(([k,v]) => `${esc(k)} (${v})`).join(', ')}.</p>
    <p class="rs">${tip}</p></div>`;
}
function gameOver(){
  if (S.dead) return;
  S.dead = true; S.phase = 'over';
  updateUI();
  setTimeout(() => endExpedition('death'), reduce ? 0 : 600);
}
async function dailyWin(){
  if (HERO.daily !== todayStr()){
    HERO.daily = todayStr();
    rng = Math.random;
    const relics = shuffle(classUniques(S.cls)).slice(0,2).map(makeUnique);
    await showRelics(relics, 'Recompensa do desafio');
  }
  endExpedition('return');
}
function dailyFail(){ S.dead = true; endExpedition('fail'); }
async function stairsChoice(){
  // training yard: the stairs always lead back to camp
  if (S.exp.kind==='tutorial'){
    await openModal({title:'Treino concluído', body:'<p class="mtext">Você aprendeu o básico: mover, atacar, desviar das casas vermelhas, usar habilidades e descer a escada.</p>', actions:[{label:'Ir ao acampamento', primary:true, value:'camp'}]});
    endExpedition('return'); return;
  }
  const last = isLastFloor(), opts = [];
  if (!last) opts.push({label: S.exp.kind==='campaign' && S.af===3 ? `Seguir para o Ato ${S.act+2}` : 'Descer', primary:true, value:'down'});
  opts.push({label:'Voltar ao acampamento', primary:last, value:'camp'});
  const text = last ? 'Você completou esta expedição.' : 'Descer continua a expedição. Voltar guarda tudo o que você encontrou até aqui.';
  const v = await openModal({title: last ? 'Expedição completa' : 'Escada', body:`<p class="mtext">${text}</p><p class="mtext muted">Nesta expedição: +${S.goldFound} de ouro, +${S.xpFound} de experiência.</p>`, actions:opts});
  if (v==='down') nextFloor(); else endExpedition('return');
}
function boardMessage(title, text, btn, fn){
  const ov = $('overlay');
  ov.innerHTML = `<div class="ov-inner"><h2 class="ov-title">${title}</h2><div class="ov-sub">${text}</div><button class="primary" id="ovBtn" type="button">${btn}</button></div>`;
  ov.hidden = false;
  $('ovBtn').onclick = () => { ov.hidden = true; fn(); };
  $('ovBtn').focus();
}

/* ---------- Modals ---------- */
let modalResolve = null;
function openModal({title, body, note, actions, minimizable}){
  return new Promise(res => {
    $('modalTitle').textContent = title;
    $('modalMin').hidden = !minimizable; $('modal').classList.remove('min'); $('modalRestore').hidden = true;
    $('modalBody').innerHTML = body || '';
    $('modalNote').textContent = note || ''; $('modalNote').hidden = !note;
    $('modalActions').innerHTML = (actions||[]).map(a => `<button class="${a.primary?'primary':'ghost'}" type="button" data-act="${a.value}" ${a.disabled?'disabled':''}>${a.label}</button>`).join('');
    $('modal').hidden = false;
    modalResolve = v => { $('modal').hidden = true; $('modal').classList.remove('min'); $('modalRestore').hidden = true; modalResolve = null; res(v); };
    const first = $('modal').querySelector('button:not([disabled])'); if (first) first.focus();
  });
}
$('modalMin').onclick = () => { $('modal').classList.add('min'); $('modalRestore').hidden = false; $('modalRestore').focus(); };
$('modalRestore').onclick = () => { $('modal').classList.remove('min'); $('modalRestore').hidden = true; };
$('modal').addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b || b.disabled || !modalResolve) return;
  modalResolve(b.dataset.act);
});
function equippedMini(slot){
  const it = S.equip[slot];
  if (!it) return `<div class="eqmini"><span class="meta">Equipado em ${SLOTS[slot].label}</span>Espaço vazio</div>`;
  return `<div class="eqmini"><span class="meta">Equipado em ${SLOTS[slot].label}</span>${itemBlock(it)}</div>`;
}
function itemCard(it, title){
  if (!it) return `<div class="card"><div class="meta">${title}</div><div class="nm" style="color:#6d6156">Espaço vazio</div></div>`;
  return `<div class="card"><div class="meta">${title} · ${RAR[it.rar].label} · ${SLOTS[it.slot].label}${it.ilvl ? ` · nível ${it.ilvl}` : ''}${it.legacy ? ' · herança' : ''}</div>${itemBlock(it)}</div>`;
}
function equipItem(it){
  const before = stats();
  const old = S.equip[it.slot];
  S.equip[it.slot] = it;
  if (old){ if (HERO.stash.length<STASH_MAX){ HERO.stash.push(old); log(`${old.name} foi para o baú.`); } else log(`${old.name} foi destruído (baú cheio).`); }
  const after = stats();
  S.player.hp = Math.max(1, Math.min(after.hp, S.player.hp+(after.hp-before.hp)));
  if (after.shield>before.shield) S.shield += after.shield-before.shield;
  log(`Equipado: ${it.name}.`);
}
function stashItem(it){ if (HERO.stash.length>=STASH_MAX) return false; HERO.stash.push(it); log(`${it.name} foi para o baú.`); return true; }
async function showLoot(it){
  const full = HERO.stash.length>=STASH_MAX;
  const v = await openModal({title:'Saque', body:`<div class="cmp">${itemCard(it,'Encontrado')}${itemCard(S.equip[it.slot],'Equipado')}</div><h4 class="dh">Se equipar</h4>${diffHtml(swapDiff(HERO, it))}`,
    note:'Ao equipar, o item atual vai para o baú. Itens desta expedição só ficam seus se você voltar vivo ao acampamento.',
    actions:[{label:'Equipar', primary:true, value:'equip'}, {label:`Guardar no baú${full?' (cheio)':''}`, value:'stash', disabled:full}, {label:'Deixar', value:'leave'}]});
  if (v==='equip') equipItem(it); else if (v==='stash') stashItem(it); else log(`Você deixou ${it.name} para trás.`);
  updateUI();
}
async function showRelics(relics, title){
  const full = HERO.stash.length>=STASH_MAX;
  const body = `<div class="cmp">${relics.map((it,i) => `<div class="relic">${itemCard(it, 'Opção '+(i+1))}
    ${equippedMini(it.slot)}
    <div class="row"><button class="primary sm" type="button" data-act="equip:${i}">Equipar</button><button class="ghost sm" type="button" data-act="stash:${i}" ${full?'disabled':''}>Guardar</button></div></div>`).join('')}</div>`;
  const v = await openModal({title: title || 'Relíquias do chefe', body, minimizable:true, note:`Escolha uma. ${relics.length>2 ? 'As outras se perdem' : 'A outra se perde'}. Minimizar deixa ver o tabuleiro e o painel.`, actions:[{label: relics.length>2 ? 'Recusar todas' : 'Recusar as duas', value:'none'}]});
  const [act, i] = v.split(':');
  if (act==='equip') equipItem(relics[+i]); else if (act==='stash') stashItem(relics[+i]); else log('Você recusou as relíquias.');
  updateUI();
}
async function showShop(en){
  for (;;){
    const full = HERO.stash.length>=STASH_MAX;
    const body = `<p class="mtext">Ouro: <b>${HERO.gold}</b>. Compras vão para o baú.</p><div class="cmp">${en.stock.map((it,i) => it ? `<div class="relic">${itemCard(it,'À venda')}
      <button class="primary sm" type="button" data-act="buy:${i}" ${HERO.gold<itemPrice(it)||full?'disabled':''}>Comprar por ${itemPrice(it)}</button></div>` : '').join('')}</div>`;
    const v = await openModal({title:'Mercador', body, actions:[{label:`Frasco de vida (15)`, value:'potion', disabled:HERO.gold<15}, {label:'Sair', primary:true, value:'leave'}]});
    if (v==='leave') break;
    if (v==='potion'){ HERO.gold -= 15; heal(POTION_HEAL); log('Você comprou um frasco de vida.'); continue; }
    const i = +v.split(':')[1], it = en.stock[i];
    if (it && HERO.gold>=itemPrice(it) && stashItem(it)){ HERO.gold -= itemPrice(it); en.stock[i] = null; }
  }
  updateUI();
}
async function openEntry(en){
  if (en.relics) await showRelics(en.relics);
  else if (en.merchant) await showShop(en);
  else if (en.item) await showLoot(en.item);
  else if (en.frozen) await frozenPlay(en);
}

/* ---------- Banner ---------- */
let bannerTimer = null;
function showBanner(title, sub){
  const b = $('banner');
  $('bnTitle').textContent = title; $('bnSub').textContent = sub || '';
  b.hidden = false; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { b.hidden = true; }, reduce ? 1500 : 2600);
}

/* ---------- HUD ---------- */
function defaultHint(){
  if (S && S.moveOnly) return 'Fuga Real: esta ação extra só pode mover, sem atacar nem usar habilidades.';
  const base = S ? CLASSES[S.cls].hint : '';
  return base + ' Casas vermelhas serão atacadas quando o turno acabar. O triângulo amarelo marca quem está na linha de fogo.' + (S && S.biome ? ' ' + BIOMES[S.biome].rule : '');
}
function attackPreview(e){
  if (!S || S.phase!=='player' || S.mode!=='move' || !hover || hover[0]!==e.x || hover[1]!==e.y) return null;
  if (!playerTargets().some(t => t.kind==='attack' && t.x===e.x && t.y===e.y)) return null;
  let raw = attackDmg(stats(), e);
  if (e.mods.includes('armor')) raw = Math.max(1, raw-1);
  if (e.mods.includes('submerge') && isWater(e.x,e.y)) raw = Math.max(1, Math.ceil(raw/2));
  const dmg = Math.max(0, raw - e.shield);
  return {dmg, raw, kills: e.hp<=dmg};
}
let tipTimer = null, tipReady = false;
const TIP_DELAY = 700;
function renderTip(){
  const tip = $('tip');
  if (!S || !S.walls || !hover || !tipReady || S.phase==='over' || S.dead){ tip.hidden = true; return; }
  const [x,y] = hover, e = enemyAt(x,y), a = allyAt(x,y);
  const item = !e && !a ? S.items.find(i=>i.x===x&&i.y===y) : null;
  let html = '';
  if (e && !intentVisible(e)){
    html += `<div class="tr">Algo se move na névoa.</div>`;
  } else if (e){
    const pv = attackPreview(e);
    const hpPct = 100*Math.max(0,e.hp)/e.maxHp, cut = pv ? Math.min(hpPct, 100*pv.dmg/e.maxHp) : 0;
    html += `<div class="tn ${e.boss?'boss':e.elite?'elite':''}">${enemyName(e)}</div>`;
    html += `<div class="tbar"><i style="width:${hpPct}%"></i>${pv?`<b style="left:${hpPct-cut}%;width:${cut}%"></b>`:''}</div>`;
    html += `<div class="tr">${Math.max(0,e.hp)}/${e.maxHp} de vida${e.shield>0?` · escudo ${e.shield}`:''} · bate ${enemyHit(e)}${e.dtype && e.dtype!=='phys' ? ' de '+DTYPES[e.dtype].n : ''}${isWater(e.x,e.y)?' (na água)':''}${['B','R','Q'].includes(e.type) && !e.boss ? ` · alcance ${attackReach(e)} casas` : ''}</div>`;
    if (pv){
      const stay = (S.cls==='R'||S.cls==='Q') ? 'você para ao lado' : 'você fica no lugar';
      html += `<div class="to ${pv.kills?'kill':''}">Seu golpe: -${pv.raw}${S.color==='b'&&e.moved?' (emboscada)':''} · ${pv.kills ? 'mata, você ocupa a casa' : 'sobrevive, '+stay}</div>`;
    }
    html += `<div class="tr">${intentText(e)}</div>`;
    if (e.boss) html += `<div class="tr">${e.phase===2 ? BOSSES[e.origId==='pawn'&&e.bossId==='queen'?'queen':e.bossId].p2 : BOSSES[e.bossId].p1}</div>`;
    for (const m of e.mods) html += `<div class="tm"><b>${MODS[m].n}:</b> ${MODS[m].d}</div>`;
    if (e.frozenPiece && S.timeStop>0) html += `<div class="tm"><b>Congelado:</b> não age e recebe +50% de dano. Estilhace-o para marcá-lo: ele volta quando o gelo derreter e só então pode deixar saque${e.type==='K' ? ' (o Rei marcado dá um Selo de Xeque)' : ''}.</div>`;
    else if (e.marked) html += `<div class="tm"><b>Marcado:</b> você o estilhaçou; ao morrer pode deixar saque${e.type==='K' ? ' e dá um Selo de Xeque' : ''}.</div>`;
    else if (e.armyPiece) html += `<div class="tm"><b>Exército:</b> não foi estilhaçado, não deixa saque.</div>`;
    if (e.role==='protector') html += `<div class="tm"><b>Protetor:</b> no fim de cada turno inimigo dá ${protectorShield()} de escudo a cada peça colada nele. Derrube-o primeiro.</div>`;
    if (e.role==='artillery') html += `<div class="tm"><b>Artilheiro:</b> fica atrás do Protetor. Como no xadrez, só atira com a linha livre; qualquer peça no caminho bloqueia o tiro.</div>`;
    if (e.role==='guard') html += `<div class="tm"><b>Guarda:</b> protege a formação pela frente.</div>`;
    if (e.herald) html += `<div class="tm"><b>Arauto da Maré:</b> deixa 15 brasas, um item raro e uma runa</div>`;
    if (e.rival) html += `<div class="tm"><b>Seu rival:</b> nível ${heroRival(HERO).tier}. Deixa o equipamento dele. Se ele te matar, fica mais forte.</div>`;
    if (e.rift) html += `<div class="tm"><b>Cria da Fenda:</b> deixa Estilhaços da Fenda e some quando a fenda fecha</div>`;
    for (const el in (e.res||{})) html += `<div class="tm"><b>Resistente:</b> ${e.res[el]}% a ${DTYPES[el].n}</div>`;
    if (e.judged) html += `<div class="tm"><b>Julgado:</b> recebe +50% de dano</div>`;
    if (e.boss && S.bossRelics) html += `<div class="tl">Usa <span class="rc-${S.bossRelics[0].rar}">${S.bossRelics[0].name}</span>. Vença e escolha entre ela e <span class="rc-${S.bossRelics[1].rar}">${S.bossRelics[1].name}</span>.</div>`;
    const ff = attackersOf(x,y).filter(o=>o!==e && intentVisible(o));
    if (ff.length) html += `<div class="tw">Na linha de fogo: ${ff.map(enemyName).join(', ')}</div>`;
  } else if (a){
    html += `<div class="tn ally">${a.type==='P'?'Peão':'Rainha'} aliado</div><div class="tbar"><i class="ally" style="width:${100*a.hp/a.maxHp}%"></i></div><div class="tr">${a.hp}/${a.maxHp} de vida · bate ${allyDmg(a)}</div>`;
    if (S.dangerSeen.has(key(x,y))) html += `<div class="tw">Vai ser atacado</div>`;
  } else if (item){
    if (item.potion) html += `<div class="tn" style="color:#8fd18a">Frasco de vida</div><div class="tr">Cura ${POTION_HEAL} ao pisar</div>`;
    else if (item.relics) html += `<div class="tn rc-legend">Relíquias do chefe</div><div class="tr">${item.relics.map(r=>r.name).join(' ou ')}</div>`;
    else if (item.chest) html += `<div class="tn" style="color:#e3b456">Baú</div><div class="tr">Ouro e um item, quase sempre raro</div>`;
    else if (item.shrine) html += `<div class="tn" style="color:#f0d68c">${item.shrine.name}</div><div class="tr">${item.shrine.desc}</div>`;
    else if (item.merchant) html += `<div class="tn" style="color:#e3b456">Mercador</div><div class="tr">Pise aqui para comprar com ouro</div>`;
    else if (item.mapItem) html += `<div class="tn rc-legend">Mapa</div><div class="tr">${mapName(item.mapItem)}</div>`;
    else if (item.frozen){ const P = mateById(item.frozen); html += `<div class="tn" style="color:#cfe6f5">Partida Congelada</div><div class="tr">${P.problem ? `Problema: mate em ${P.n}. Paga mais que os padrões.` : `Padrão de mate em ${P.n}. ${(HERO.grimoire||{})[item.frozen] ? 'Já aprendido.' : 'Novo: ensina um poder do Grimório.'}`}</div><div class="tr"><b>Pise nesta casa para jogar.</b> Se falhar, o exército desperta.</div>`; }
    else if (item.currency) html += `<div class="tn" style="color:${CURRENCY[item.currency].c}">${CURRENCY[item.currency].name}</div><div class="tr">${CURRENCY[item.currency].d} Use no acampamento, num mapa.</div>`;
    else if (item.tideChest) html += `<div class="tn" style="color:#ff6b4a">Baú Tormentoso</div><div class="tr">Custa ${tideCost()} Brasas de Sangue (você tem ${HERO.embers||0}). Item raro garantido, 25% de chance de único, 30% de runa.</div>`;
    else if (item.frozenArmy) html += `<div class="tn" style="color:#cfe6f5">Exército Congelado</div><div class="tr">Pise para revelar um exército novo, congelado numa abertura clássica. Você tem ${TIME_STOP} turnos para estilhaçar peças (+50% de dano). Quando o gelo derrete, todas acordam e as estilhaçadas voltam à vida: só elas deixam saque, e o Rei estilhaçado dá um Selo de Xeque.</div>`;
    else if (item.riftGate) html += `<div class="tn" style="color:#b48cff">Fenda</div><div class="tr"><b>Pise nesta casa para abri-la:</b> 5 turnos de ondas crescentes de crias, que deixam Estilhaços. A cada 3 abates perto dela, +1 turno (até +3).</div>`;
    else if (item.rune) html += `<div class="tn" style="color:#c9a0ff">${RUNES[item.rune].name}</div><div class="tr">${RUNES[item.rune].d}</div><div class="tr">Pise para pegar. Encaixe numa habilidade no acampamento.</div>`;
    else html += `<div class="tn rc-${item.item.rar}">${esc(item.item.name)}</div><div class="tr">${RAR[item.item.rar].label} · ${SLOTS[item.item.slot].label} · nível ${item.item.ilvl||1}</div><ul class="tafx">${item.item.affixes.map(affixLine).join('')}</ul>${diffHtml(swapDiff(HERO, item.item))}`;
  }
  if (!html){ tip.hidden = true; return; }
  tip.innerHTML = html;
  const tx = x===0 ? '-12%' : x===W-1 ? '-88%' : '-50%';
  tip.style.left = ((x+.5)/W*100)+'%';
  if (y===0){ tip.style.top = ((y+1)/H*100)+'%'; tip.style.transform = `translate(${tx}, 4px)`; }
  else { tip.style.top = (y/H*100)+'%'; tip.style.transform = `translate(${tx}, calc(-100% - 4px))`; }
  tip.hidden = false;
}
function hoverHint(){
  renderTip();
  const h = $('hint');
  // training: the step guide stays in the box while you move the mouse (the tooltip still shows the piece)
  if (S && S.tut && S.phase!=='over'){ const step = TUT_STEPS[S.tut.step]; h.classList.add('tut'); h.innerHTML = `<b>${step.title}.</b> ${step.text(S.cls)}`; return; }
  if (!S || !S.walls || !hover || S.phase==='over'){ h.textContent = defaultHint(); return; }
  const [x,y] = hover, e = enemyAt(x,y), st = stats(), parts = [];
  if (e && !intentVisible(e)) parts.push('Algo se move na névoa.');
  else if (e){
    if (e.boss) parts.push('Chefe: deixa duas relíquias únicas para você escolher uma.');
    else if (e.elite) parts.push('Inimigo de elite: sempre deixa um item, quase sempre raro.');
    if (S.cls==='B' && (e.x+e.y)%2 !== (S.player.x+S.player.y)%2) parts.push('Está numa casa de outra cor: suas diagonais nunca o alcançam. Use Troca de Cor.');
  } else if (allyAt(x,y)) parts.push('Aliados agem depois do seu turno. Clique para trocar de lugar.');
  else if (S.stairs && S.stairs.x===x && S.stairs.y===y) parts.push('Escada: descer ou voltar ao acampamento.');
  else if (isPlayer(x,y)) parts.push('Você.');
  const t = terrainAt(x,y);
  if (t==='pit') parts.push('Fosso: ninguém pisa aqui, mas ataques em linha passam por cima. Inimigo empurrado para cá cai e morre.');
  if (t==='grave') parts.push(S.rise && S.rise[0]===x && S.rise[1]===y ? 'Túmulo se abrindo: um esqueleto se ergue no fim do turno, se a casa estiver livre.' : 'Túmulo: de tempos em tempos um esqueleto se ergue daqui. Ficar em cima impede.');
  if (t==='water') parts.push('Água: quem ataca daqui causa 1 de dano a menos. Ninguém desliza através dela.');
  if (t==='lava') parts.push('Lava: quem termina o turno aqui leva 2 de dano.');
  if (t==='blood') parts.push('Poça de Sangue: inimigo em cima causa +1 de dano e se cura 1 por turno, mas matá-lo aqui dá o dobro de Brasas.');
  if (S.tideRise && S.tideRise.some(([a,b]) => a===x && b===y)) parts.push('A Maré vai subir aqui no fim do turno: vira Poça de Sangue.');
  if (S.bloodRain && S.bloodRain.sq.some(([a,b]) => a===x && b===y)) parts.push('Chuva de Sangue: cai aqui no fim do turno.');
  if (t==='ice') parts.push('Gelo: quem pisa aqui escorrega na mesma direção até sair do gelo ou bater em algo.');
  if (S.burn.has(key(x,y))) parts.push('Brasas: quem terminar o turno aqui leva 2 de dano.');
  if (S.clock && S.clock.sq.some(([a,b]) => a===x && b===y)) parts.push(CLOCK_TEXT[S.clock.kind]);
  if (S.enemies.some(o => o.intent && o.intent.mark && o.intent.mark[0]===x && o.intent.mark[1]===y)) parts.push('Casa marcada pelo chefe: quem estiver aqui no fim do turno leva o golpe.');
  if (isWall(x,y)) parts.push(S.env && S.env.wall[0]===x && S.env.wall[1]===y ? 'Pilar instável: vai explodir no fim do turno.' : `${({swamp:'Árvore morta', cathedral:'Coluna'})[S.biome]||'Pilar'}. Bloqueia ataques em linha.`);
  if (!e && S.dangerSeen.has(key(x,y))) parts.push('Esta casa será atacada no fim do turno.');
  if (S.threatNext && S.threatNext.has(key(x,y)) && !S.dangerSeen.has(key(x,y))) parts.push('Visão tática: ameaçada no turno seguinte.');
  if (S.mode==='quake' && SKILLS[S.mode].targets().some(([sx,sy])=>sx===x&&sy===y)) parts.push(`Pousar aqui causa ${st.dmg+st.darkQuake} a cada vizinho.`);
  h.textContent = parts.length ? parts.join(' ') : defaultHint();
}
function affixList(it){ return `<ul>${it.affixes.map(a=>`<li class="${AFX[a.k].rule?'rule':''}">${AFX[a.k].t(a.v)}</li>`).join('')}</ul>`; }
/* ---------- Boss sheet (left of the board) ---------- */
const SPECIAL_DESC = {
  queen:'Atinge a sua casa e 3 casas em cada direção reta a partir dela.',
  knight:'Atinge a sua casa e todas as vizinhas.',
  twins:'Atinge a fileira e a coluna inteiras da torre, até um pilar. As duas se revezam.',
  pawn:'Atinge as duas fileiras inteiras à frente dele.',
  mirror:'Atinge todas as casas para onde você poderia se mover agora.'};
function bossObjectiveRow(b, p2, bosses){
  const id = b.bossId;
  if (id==='queen' && b.origId==='queen'){
    if (!p2) return `<div class="bi-row"><b>Objetivo na fase 2</b>Guarda Real: com 3 ou mais peões vivos, ela recebe metade do dano. Mate os peões.</div>`;
    const g = queenGuards();
    return `<div class="bi-row"><b>Guarda Real · ${g>=3 ? '<span class="now">protegida</span>' : '<span class="when">exposta</span>'}</b>Com 3 ou mais peões vivos, recebe metade do dano. Peões vivos: ${g}.</div>`;
  }
  if (id==='knight'){
    if (!p2) return `<div class="bi-row"><b>Objetivo na fase 2</b>Ele foge quando é atingido. Depois de 3 fugas fica exausto e vulnerável.</div>`;
    return b.exhausted ? `<div class="bi-row"><b>Exausto · <span class="now">ataque agora</span></b>Não foge e recebe +50% de dano.</div>`
      : `<div class="bi-row"><b>Exaustão · ${b.escapes||0} de 3 fugas</b>Na terceira fuga fica exausto por 2 turnos: não foge e recebe +50% de dano.</div>`;
  }
  if (id==='twins') return b===bosses[0] ? `<div class="bi-row"><b>Objetivo</b>Derrube as duas no mesmo turno. Se uma cair e a outra sobreviver ao turno, a sobrevivente enlouquece (dano dobrado).</div>` : '';
  if (id==='pawn') return `<div class="bi-row"><b>Objetivo · faltam ${Math.max(0, H-1-b.y)} fileiras</b>Mate-o antes que chegue à última fileira, ou ele vira rainha com vida cheia.</div>`;
  if (id==='mirror'){
    if (!p2) return `<div class="bi-row"><b>Objetivo na fase 2</b>Ele solta 2 estilhaços. Mate-os antes de focar o Reflexo.</div>`;
    const n = mirrorShards();
    return `<div class="bi-row"><b>Estilhaços · ${n ? `<span class="now">${n} vivos</span>` : '<span class="when">nenhum</span>'}</b>Enquanto houver estilhaço vivo, metade do dano que você causa ao Reflexo volta para você.</div>`;
  }
  return '';
}
const whenTxt = k => k<=0 ? '<span class="now">agora</span>' : `<span class="when">${k===1 ? 'no próximo turno' : `em ${k} turnos`}</span>`;
function bossSheet(bosses){
  const first = bosses[0];
  const cards = bosses.map((b, idx) => {
    const id = b.bossId, B = BOSSES[b.origId==='pawn' && id==='queen' ? 'queen' : id];
    const p2 = b.phase===2 || b.mods.includes('enraged');
    const every = b.uber || p2 ? 2 : 3, off = id==='twins' ? idx : 0;
    let sp = 0; if (!(b.intent && b.intent.special)) { sp = 1; while ((b.t+sp+off) % every !== 0) sp++; }
    const spId = b.origId==='pawn' && id==='queen' ? 'queen' : id;
    const stunned = b.intent && b.intent.stunned;
    const rows = [];
    rows.push(`<div class="bi-row"><b>${p2 ? 'Fase 2' : 'Fase 1'}</b>${p2 ? B.p2 : B.p1}${!p2 && id!=='twins' ? ' Muda de fase com metade da vida.' : ''}${p2 ? '' : `<br><i>Fase 2: ${B.p2}</i>`}</div>`);
    rows.push(b.uber ? `<div class="bi-row"><b>Golpe supremo · ${whenTxt(sp)}</b>${UBERS[spId==='queen'&&b.origId!=='queen'?'pawn':spId].special} A cada 2 turnos.</div>`
      : `<div class="bi-row"><b>${BOSS_SPECIAL[spId]} · ${whenTxt(sp)}</b>${SPECIAL_DESC[spId]} A cada ${every} turnos.</div>`);
    if (b===first){
      let mk = 0; if (!(b.intent && b.intent.mark)) { mk = 1; while ((b.t+mk) % 4 !== 1) mk++; }
      rows.push(`<div class="bi-row"><b>Marca · ${whenTxt(mk)}</b>Mira a casa onde você está. Saia dela antes do fim do turno. Atordoar cancela.</div>`);
    }
    const obj = bossObjectiveRow(b, p2, bosses);
    if (obj) rows.push(obj);
    if (stunned) rows.push(`<div class="bi-row"><b>Atordoado</b>Não age neste turno.</div>`);
    const ev = summonEvery(b);
    if (ev) rows.push(`<div class="bi-row"><b>Reforços</b>Invoca peões a cada ${ev} turnos, até 4 vivos.</div>`);
    if (b.mods.length) rows.push(`<div class="bi-row"><b>Afixos</b><ul>${b.mods.map(m => `<li>${MODS[m].n}: ${MODS[m].d}</li>`).join('')}</ul></div>`);
    rows.push(`<div class="bi-row"><b>Golpe</b>${enemyHit(b)} de dano${b.shield>0 ? ` · escudo ${b.shield}` : ''} · vida ${Math.max(0,b.hp)}/${b.maxHp}</div>`);
    return `<div class="bi-card"><div><h2 class="${b.side==='holy'?'holy':''}">${esc(b.name)}</h2><span class="phase">${bosses.length>1 ? `Torre ${idx+1} de 2` : 'Chefe'}</span></div>${rows.join('')}</div>`;
  });
  const extra = [];
  if (S.bossRelics){
    const r = S.bossRelics[0];
    extra.push(`<div class="bi-row"><b>Empunha <span class="rc-${r.rar}">${esc(r.name)}</span></b><ul>${r.affixes.map(a => `<li>${AFX[a.k].t(a.v)}</li>`).join('')}</ul>Vença e escolha entre ela e <span class="rc-${S.bossRelics[1].rar}">${esc(S.bossRelics[1].name)}</span>.</div>`);
  }
  if (S.bossId){
    const used = S.clocks||0;
    let ck = 0; if (!S.clock){ ck = 1; while ((S.turn+ck) % 5 !== 4) ck++; }
    const what = {crypt:'o teto desaba perto de você', swamp:'a água sobe e a névoa fecha', forge:'a lava se espalha', cathedral:'o gelo avança'}[S.biome] || 'a arena piora';
    extra.push(`<div class="bi-row"><b>Arena · ${used>=4 ? 'estável' : whenTxt(S.clock ? 0 : ck)}</b>A cada 5 turnos ${what} (${Math.max(0,4-used)} de 4 restantes).</div>`);
  }
  return cards.join('') + (extra.length ? `<div class="bi-card">${extra.join('')}</div>` : '');
}
const waitKeyNum = () => barSkills().length + (S.color==='b' ? 1 : 0) + 1;
function updateUI(){
  if (!S || !S.walls) return;
  const st = stats(), c = CLASSES[S.cls];
  if (cv.parentElement && cv.parentElement.dataset.biome!==S.biome) cv.parentElement.dataset.biome = S.biome;
  $('floorLabel').textContent = floorTitle();
  $('turnLabel').textContent = S.tut ? 'Treino' : S.timeStop>0 ? `Gelo derrete em ${S.timeStop} ${S.timeStop===1?'turno':'turnos'}` : S.phase==='enemy' ? 'Turno inimigo' : S.phase==='allies' ? 'Turno dos aliados'
    : S.exp.kind==='daily' ? `Turno ${S.turn} de ${S.turnLimit}` : S.enemies.length ? `Turno ${S.turn}` : 'Andar limpo';
  updateHeader();
  $('clsName').textContent = c.name;
  $('stSide').textContent = FACTIONS[S.color].name;
  const hp = Math.max(0, S.player.hp);
  $('hpTxt').textContent = `${hp} / ${st.hp}`; $('hpBar').style.width = (100*hp/st.hp)+'%';
  const shMax = Math.max(st.shield, S.shield, 1);
  $('shTxt').textContent = `${S.shield}`; $('shBar').style.width = (100*S.shield/shMax)+'%';
  $('xpTxt').textContent = `Nível ${HERO.level} · ${HERO.xp} / ${xpNeed(HERO.level)}`; $('xpBar').style.width = (100*HERO.xp/xpNeed(HERO.level))+'%';
  $('stDmg').textContent = attackDmg(st); $('stAct').textContent = S.actions; $('stGold').textContent = HERO.gold;
  const gr = MATES.filter(m => (HERO.grimoire||{})[m.id]);
  $('passives').innerHTML = `<li><b>Resistências.</b> fogo ${st.resFire}% · gelo ${st.resCold}% · raio ${st.resLight}%${BIOME_ELEMENT[S.biome]!=='phys' ? ` · inimigos daqui causam ${DTYPES[BIOME_ELEMENT[S.biome]].n} e resistem 50% a ele` : ''}</li><li>${c.passive}</li>` + FACTIONS[S.color].passives.map(p=>`<li>${p}</li>`).join('') + (gr.length ? `<li title="${gr.map(m=>m.name+': '+m.power).join(' | ')}"><b>Grimório.</b> ${gr.length} ${gr.length===1?'poder de mate ativo':'poderes de mate ativos'} (passe o mouse).</li>` : '');
  const canAct = S.phase==='player' && S.enemies.length>0;
  const bar = barSkills();
  for (let i=0;i<4;i++) $('btnS'+i).hidden = i>=bar.length;
  bar.forEach((id,i) => {
    const sk = SKILLS[id], b = $('btnS'+i);
    $('sName'+i).textContent = sk.name + (runeOf(id) ? ' ✦' : '');
    b.title = runeOf(id) ? RUNES[runeOf(id)].name + ': ' + RUNES[runeOf(id)].d : '';
    $('sDesc'+i).textContent = S.mode===id ? 'Escolha onde pousar (Esc cancela)' : sk.desc(st);
    $('sCd'+i).textContent = S.cds[id] ? `${S.cds[id]}` : '';
    const free = id==='shift' && S.phase==='player';
    b.disabled = !(canAct || free) || S.moveOnly || S.cds[id]>0 || (sk.can && !sk.can());
    b.classList.toggle('active', S.mode===id);
    b.classList.toggle('cooling', S.cds[id]>0);
  });
  $('pactKey').textContent = String(bar.length+1);
  $('waitKey').textContent = String(waitKeyNum());
  $('btnPact').hidden = S.color!=='b';
  $('btnPact').disabled = !canAct || S.pactUsed || S.player.hp<=4;
  $('pactDesc').textContent = S.pactUsed ? 'Já usado neste andar' : 'Paga 4 de vida e zera as recargas';
  $('btnWait').disabled = !canAct;
  $('gear').innerHTML = Object.keys(SLOTS).map(s => {
    const it = S.equip[s];
    return `<div class="slot"><span class="lbl">${SLOTS[s].label}</span><div>${it ? `<div class="nm rc-${it.rar}">${esc(it.name)}</div>${affixList(it)}` : '<div class="empty">vazio</div>'}</div></div>`;
  }).join('');
  $('log').innerHTML = S.log.map(l => `<li>${l}</li>`).join('');
  const bosses = S.enemies.filter(e=>e.boss);
  $('bossBar').hidden = !bosses.length;
  $('tideBar').hidden = !S.tide;
  if (S.tide){ const goal = S.tideGoal||8, ira = S.tideIra||0; $('tbFill').style.width = (100*Math.min(1, ira/goal))+'%'; $('tbSub').textContent = `${ira}/${goal} · Brasas ${HERO.embers||0}`; }
  if (bosses.length){
    const hpT = bosses.reduce((a,e)=>a+Math.max(0,e.hp),0), mx = bosses.reduce((a,e)=>a+e.maxHp,0), b0 = bosses[0];
    $('bbName').textContent = bosses.length>1 ? BOSSES.twins.names[b0.side] : b0.name;
    $('bbName').className = 'bb-name ' + (b0.side==='holy' ? 'holy' : '');
    $('bbFill').style.width = (100*hpT/mx)+'%';
    $('bbSub').textContent = `${hpT} / ${mx}` + (b0.phase===2 || b0.mods.includes('enraged') ? ' · segunda fase' : '');
  }
  $('scrGame').classList.toggle('has-boss', bosses.length>0);
  $('bossInfo').hidden = !bosses.length;
  if (bosses.length) $('bossInfo').innerHTML = bossSheet(bosses);
  hoverHint();
  $('hint').classList.toggle('tut', !!S.tut);
  if (S.tut){ const step = TUT_STEPS[S.tut.step]; $('hint').innerHTML = `<b>${step.title}.</b> ${step.text(S.cls)}`; }
  // training: the current goal sits right above the board, the skill button blinks on the skill step
  $('tutBar').hidden = !S.tut;
  if (S.tut){
    $('ttStep').textContent = `Treino ${S.tut.step+1}/${TUT_STEPS.length}`;
    $('ttGoal').textContent = TUT_STEPS[S.tut.step].goal;
    $('ttDots').innerHTML = TUT_STEPS.map((_,i) => `<i class="${i<=S.tut.step?'on':''}"></i>`).join('');
  }
  $('btnS0').classList.toggle('tutpulse', !!(S.tut && S.tut.step===4));
  // frozen match: swap the skill bar for the puzzle bar
  const ch = S.chess;
  $('hotbar').hidden = !!ch; $('chessBar').hidden = !ch;
  if (ch){
    $('turnLabel').textContent = 'Partida Congelada';
    $('cbTitle').textContent = ch.P.name;
    $('cbSub').textContent = `Mate em ${ch.P.n} · ${ch.left} ${ch.left===1?'lance restante':'lances restantes'} · ${ch.hints ? `${ch.hints} ${ch.hints===1?'dica usada':'dicas usadas'}` : 'sem dicas: runa de bônus'}`;
    $('cbHint').disabled = ch.busy; $('cbQuit').disabled = ch.busy;
    $('cbHint').textContent = ch.hints===0 ? 'Dica: a ideia' : ch.hints===1 ? 'Dica: qual peça' : 'Dica: o lance';
    $('hint').textContent = (ch.hints ? ch.P.tip + ' ' : '') + 'Regras normais de xadrez, sem vida nem dano. Clique numa peça sua (o herói brilha) e depois no destino. As pretas respondem com a melhor defesa; qualquer caminho para o mate vale.';
  }
}

/* ---------- Input ---------- */
$('btnS0').onclick = () => useSkill(0);
$('btnS1').onclick = () => useSkill(1);
$('btnS2').onclick = () => useSkill(2);
$('btnS3').onclick = () => useSkill(3);
$('btnQuit').onclick = quitExpedition;
$('cbHint').onclick = chessHint;
$('cbQuit').onclick = chessGiveUp;
$('btnPact').onclick = usePact;
$('btnWait').onclick = waitTurn;
document.addEventListener('keydown', ev => {
  if (!S || !S.walls || !$('modal').hidden || !$('overlay').hidden || $('scrGame').hidden) return;
  if (ev.target instanceof HTMLInputElement || S.chess) return;
  if (ev.key==='1') useSkill(0);
  else if (ev.key==='2') useSkill(1);
  else if (ev.key==='3' && barSkills().length>2) useSkill(2);
  else if (ev.key==='4' && barSkills().length>3) useSkill(3);
  else if (ev.key===String(barSkills().length+1) && S.color==='b') usePact();
  else if (ev.key===String(waitKeyNum())) waitTurn();
  else if (ev.key==='e' || ev.key==='E') waitTurn();
  else if (ev.key===' ' && !(ev.target instanceof HTMLButtonElement)){ ev.preventDefault(); waitTurn(); }
  else if (ev.key==='Escape' && S.mode!=='move'){ S.mode = 'move'; updateUI(); }
});
function tileAt(ev){
  const r = cv.getBoundingClientRect();
  return [Math.floor((ev.clientX-r.left)/r.width*W), Math.floor((ev.clientY-r.top)/r.height*H)];
}
cv.addEventListener('click', ev => {
  if (S && S.chess){ const r = cv.getBoundingClientRect(); chessClick(Math.floor((ev.clientX-r.left)/r.width*8), Math.floor((ev.clientY-r.top)/r.height*8)); return; }
  if (!S || !S.walls) return; const [x,y] = tileAt(ev); if (inb(x,y)) onClick(x,y);
});
cv.addEventListener('mousemove', ev => {
  if (!S || !S.walls || S.chess) return;
  const [x,y] = tileAt(ev), nh = inb(x,y) ? [x,y] : null;
  if (!hover || !nh || hover[0]!==nh[0] || hover[1]!==nh[1]){
    hover = nh; tipReady = false; clearTimeout(tipTimer);
    if (nh) tipTimer = setTimeout(() => { tipReady = true; renderTip(); }, TIP_DELAY);
    hoverHint();
  }
});
cv.addEventListener('mouseleave', () => { hover = null; tipReady = false; clearTimeout(tipTimer); if (S && S.walls) hoverHint(); });

/* ---------- Boot ---------- */
let last = performance.now();
function frame(now){
  const dt = Math.min(.05, (now-last)/1000); last = now;
  updateFx(dt);
  if (!$('scrGame').hidden) draw(now/1000);
  requestAnimationFrame(frame);
}
loadSave();
showHeroes();
if (document.fonts && document.fonts.load) document.fonts.load('40px "Noto Sans Symbols 2"', '♞').catch(()=>{});
requestAnimationFrame(frame);
