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
  const where = S && S.walls ? $t(`${floorTitle()} · turno ${S.turn} · fase ${S.phase}`, `${floorTitle()} · turn ${S.turn} · phase ${S.phase}`) : $t('fora de uma expedição', 'outside an expedition');
  box.innerHTML = `<b>${$t('Algo deu errado', 'Something went wrong')}</b><p>${$t('Copie o texto abaixo e me envie. Onde:', 'Copy the text below and send it to me. Where:')} ${esc(where)}.</p><textarea readonly>${esc(where+'\n'+msg)}</textarea><button class="ghost sm" type="button">${$t('Fechar', 'Close')}</button>`;
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
  for (const h of SAVE.heroes) for (const it of [...Object.values(h.equip), ...h.stash]) if (it){ if (it.id>uid) uid = it.id; it.name = relabel(it.name); renameOld(it); }
  for (const h of SAVE.heroes){ h.tree = h.tree || []; if (h.talents && Object.values(h.talents).some(v => v>0)){ h.talents = {}; legacyNotice = $t('Os talentos viraram uma Árvore de Passivas: seus pontos foram devolvidos. Veja a aba Árvore.', 'Talents became a Passive Tree: your points were refunded. See the Tree tab.'); } }
  for (const h of SAVE.heroes) if (h.atlasSpent){ delete h.atlasSpent; h.atlasTree = h.atlasTree || []; }
  let reforged = 0;
  for (const h of SAVE.heroes){
    const lv = Math.max(1, Math.min(30, h.level));
    for (const s in h.equip) if (h.equip[s] && !h.equip[s].ilvl){ h.equip[s] = reforgeLegacy(h.equip[s], lv); reforged++; }
    h.stash = h.stash.map(it => { if (it && !it.ilvl){ reforged++; return reforgeLegacy(it, lv); } return it; });
  }
  if (reforged){ legacyNotice = (legacyNotice ? legacyNotice + ' ' : '') + $t(`Seus ${reforged} itens antigos foram reforjados no novo sistema: ganharam nível, camadas e um afixo de herança.`, `Your ${reforged} old items were reforged into the new system: they gained an item level, tiers and an heirloom affix.`); persist(); }
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
  $('btnLang').hidden = name==='game';   // switching language reloads the page, so not during an expedition
  updateHeader();
}
function updateHeader(){
  $('heroChip').textContent = HERO ? $t(`${HERO.name} · ${CLASSES[HERO.cls].name} nível ${HERO.level}${HERO.mode==='hardcore'?' · hardcore':''}`, `${HERO.name} · ${CLASSES[HERO.cls].name} level ${HERO.level}${HERO.mode==='hardcore'?' · hardcore':''}`) : '';
  if (!S || !S.walls){ $('floorLabel').textContent = HERO ? $t('Acampamento', 'Camp') : $t('O Abismo', 'The Abyss'); $('turnLabel').textContent = ''; }
}

let pick_ = {cls:'N', color:'w', mode:'normal'}, delPending = null;
function showHeroes(){
  HERO = null; S = null;
  const cards = SAVE.heroes.map(h => `
    <div class="hcard">
      <span class="g ${h.color}">${GLYPH[h.cls]}</span>
      <div class="hinfo"><b>${esc(h.name)}</b>
        <span>${CLASSES[h.cls].name} · ${FACTIONS[h.color].name} · ${h.mode==='hardcore'?$t('Hardcore', 'Hardcore'):$t('Padrão', 'Standard')}</span>
        <span>${$t('Nível', 'Level')} ${h.level} ${$t('· Ato', '· Act')} ${Math.min(4,h.actDone+1)}${h.actDone>=4?$t(' · fim de jogo', ' · endgame'):''}</span></div>
      <div class="hbtns"><button class="primary sm" type="button" data-act="play:${h.id}">${$t('Jogar', 'Play')}</button>
        <button class="ghost sm" type="button" data-act="del:${h.id}">${delPending===h.id?$t('Confirmar exclusão', 'Confirm deletion'):$t('Apagar', 'Delete')}</button></div>
    </div>`).join('');
  const clsBtns = Object.entries(CLASSES).map(([k,c]) => `<button class="cls" type="button" data-act="cls:${k}" aria-pressed="${pick_.cls===k}"><span class="g ${pick_.color}">${GLYPH[k]}</span>${c.name}</button>`).join('');
  const c = CLASSES[pick_.cls], f = FACTIONS[pick_.color];
  $('scrHeroes').innerHTML = `
    <div class="col">
      <h2 class="sh">${$t('Seus heróis', 'Your heroes')}</h2>
      ${cards || $t('<p class="muted">Nenhum herói ainda. Crie o primeiro ao lado.</p>', '<p class="muted">No heroes yet. Create the first one alongside.</p>')}
    </div>
    <div class="col">
      <h2 class="sh">${$t('Novo herói', 'New hero')}</h2>
      <label class="lbl" for="heroName">${$t('Nome', 'Name')}</label>
      <input id="heroName" class="txt" maxlength="20" placeholder="${$t('Ex.: Ser Aldric', 'E.g.: Sir Aldric')}" value="${esc($('heroName') ? $('heroName').value : '')}">
      <p class="lbl">${$t('Classe', 'Class')}</p>
      <div class="classes">${clsBtns}</div>
      <p class="cls-desc"><b>${c.name}.</b> ${c.pitch} ${$t('Vida', 'Health')} ${c.hp}${$t(', dano', ', damage')} ${c.dmg}.</p>
      <p class="lbl">${$t('Facção', 'Faction')}</p>
      <div class="choices">
        ${['w','b'].map(k => `<button class="choice" type="button" data-act="col:${k}" aria-pressed="${pick_.color===k}"><strong>${FACTIONS[k].name}, ${FACTIONS[k].title}</strong><span class="d">${FACTIONS[k].pitch}</span></button>`).join('')}
      </div>
      <ul class="passives">${f.passives.map(p=>`<li>${p}</li>`).join('')}</ul>
      <p class="lbl">${$t('Morte', 'Death')}</p>
      <div class="choices">
        <button class="choice" type="button" data-act="mode:normal" aria-pressed="${pick_.mode==='normal'}"><strong>${$t('Padrão', 'Standard')}</strong><span class="d">${$t('Ao morrer, a expedição acaba, mas você leva ao acampamento tudo o que pegou.', 'When you die, the expedition ends, but you bring back to camp everything you picked up.')}</span></button>
        <button class="choice" type="button" data-act="mode:hardcore" aria-pressed="${pick_.mode==='hardcore'}"><strong>${$t('Hardcore', 'Hardcore')}</strong><span class="d">${$t('Ao morrer, o herói se perde para sempre.', 'When you die, the hero is lost forever.')}</span></button>
      </div>
      <button class="primary" type="button" data-act="create">${$t('Criar herói', 'Create hero')}</button>
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
    const name = ($('heroName').value || '').trim() || $t('Sem Nome', 'Nameless');
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
function affixLine(a){ return `<li class="${AFX[a.k].rule?'rule':''}">${AFX[a.k].t(a.v)}${a.t ? ` <span class="tier t${a.t}">T${a.t}</span>` : ''}${a.heir ? $t(' <span class="heir">herança</span>', ' <span class="heir">heirloom</span>') : ''}</li>`; }
function itemBlock(it){
  return `<div class="nm rc-${it.rar}">${esc(it.name)}</div><ul>${it.affixes.map(affixLine).join('')}</ul>`;
}
const actProgress = (h, t = h.torment||0) => t ? ((h.actsByT||{})[t]||0) : h.actDone;
function tormentDesc(t){
  const next = $t('Zere a campanha no nível mais alto liberado para abrir o próximo (cada nível recomeça no Ato 1).', 'Beat the campaign on the highest unlocked level to open the next one (each level starts again at Act 1).');
  if (!t) return $t(`Base: o Ato 1 é tranquilo e o conteúdo (elites, grupos, formações, Maré, Rival) entra ato a ato. ${next}`, `Base: Act 1 is calm and the content (elites, packs, formations, Tide, Rival) comes in act by act. ${next}`);
  return $t(`Inimigos +${30*t}% de vida, +${t} de dano, ${12*t}% mais numerosos${t>=3?', uma elite a mais por andar':''}; todo o conteúdo desde o primeiro andar. Recompensa +${25*t}% e raridade maior. ${next}`, `Enemies +${30*t}% health, +${t} damage, ${12*t}% more numerous${t>=3?', one extra elite per floor':''}; all content from the first floor. Rewards +${25*t}% and higher rarity. ${next}`);
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
  const nums = [['dmg',$t('de dano', 'damage')],['hp',$t('de vida', 'health')],['shield',$t('de escudo por andar', 'shield per floor')],['cdr',$t('de recarga', 'cooldown')],['crit',$t('% de crítico', '% critical chance')],['eliteDmg',$t('% contra elites e chefes', '% against elites and bosses')],
    ['block',$t('% de bloqueio', '% block')],['healKill',$t('de cura ao matar', 'healing on kill')],['mf',$t('% de achado de itens', '% item find')],['gold',$t('% de ouro', '% gold')],
    ['fireDmg',$t('de dano de fogo', 'fire damage')],['coldDmg',$t('de dano de gelo', 'cold damage')],['lightDmg',$t('de dano de raio', 'lightning damage')],['resFire',$t('% de resistência a fogo', '% fire resistance')],['resCold',$t('% de resistência a gelo', '% cold resistance')],['resLight',$t('% de resistência a raio', '% lightning resistance')]].map(([k,l]) => [l, b[k]-a[k]]).filter(([,d]) => d);
  const rules = x => x ? x.affixes.filter(f => AFX[f.k].rule).map(f => AFX[f.k].t(f.v)) : [];
  const gain = rules(it).filter(t => !rules(cur).includes(t)), lose = rules(cur).filter(t => !rules(it).includes(t));
  return {nums, gain, lose};
}
function diffHtml(d){
  const rows = d.nums.map(([l,v]) => `<li class="${v>0?'up':'down'}">${v>0?'+':''}${v}${l.startsWith('%') ? l : ' '+l}</li>`)
    .concat(d.gain.map(t => `<li class="up">${$t('Ganha:', 'Gains:')} ${t}</li>`), d.lose.map(t => `<li class="down">${$t('Perde:', 'Loses:')} ${t}</li>`));
  return rows.length ? `<ul class="diff">${rows.join('')}</ul>` : $t('<p class="muted small">Sem diferença nos atributos.</p>', '<p class="muted small">No difference in stats.</p>');
}
function campGear(h){
  const st = statsFor(h.cls, h.color, h.equip);
  const slots = Object.keys(SLOTS).map(s => {
    const it = h.equip[s], sel = campSel && campSel.from==='equip' && campSel.slot===s;
    return it ? `<div class="eslot"><span class="lbl">${SLOTS[s].label}</span>${itemTile(it, 'selE:'+s, sel)}</div>`
      : `<div class="eslot"><span class="lbl">${SLOTS[s].label}</span><div class="itile empty">${slotIcon(s)}<span class="iname">${$t('vazio', 'empty')}</span></div></div>`;
  }).join('');
  const list = h.stash.map((it,i) => ({it,i})).filter(o => campFilter==='all' || o.it.slot===campFilter)
    .sort((a,b) => ['legend','rare','magic','common'].indexOf(a.it.rar) - ['legend','rare','magic','common'].indexOf(b.it.rar));
  const chips = [['all',$t('Todos', 'All')], ...Object.keys(SLOTS).map(s => [s, SLOTS[s].label])].map(([k,l]) => {
    const n = k==='all' ? h.stash.length : h.stash.filter(it => it.slot===k).length;
    return `<button class="chip ${campFilter===k?'on':''}" type="button" data-act="filter:${k}" aria-pressed="${campFilter===k}">${l} <span>${n}</span></button>`;
  }).join('');
  const commons = h.stash.filter(it => it.rar==='common');
  const grid = list.length ? `<div class="igrid">${list.map(o => itemTile(o.it, 'selS:'+o.i, campSel && campSel.from==='stash' && campSel.i===o.i)).join('')}</div>`
    : `<p class="muted">${h.stash.length ? $t('Nada deste tipo no baú.', 'Nothing of this type in the stash.') : $t('Vazio. Itens guardados nas expedições aparecem aqui.', 'Empty. Items stored on expeditions show up here.')}</p>`;
  // detail of the selected item
  let detail = $t('<p class="muted">Clique num item, equipado ou do baú, para ver os detalhes e comparar.</p>', '<p class="muted">Click an item, equipped or in the stash, to see its details and compare.</p>');
  if (campSel && campSel.from==='stash' && h.stash[campSel.i]){
    const it = h.stash[campSel.i], cur = h.equip[it.slot];
    detail = `${itemCard(it,$t('No baú', 'In the stash'))}
      <h4 class="dh">${$t('Se equipar, no lugar de', 'If equipped, replacing')} ${cur ? `<span class="rc-${cur.rar}">${esc(cur.name)}</span>` : 'nada'}</h4>${diffHtml(swapDiff(h, it))}
      ${cur ? `<details class="curd"><summary>${$t('Ver o item equipado', 'See the equipped item')}</summary>${itemCard(cur,$t('Equipado', 'Equipped'))}</details>` : ''}
      <div class="row"><button class="primary sm" type="button" data-act="equip:${campSel.i}">${$t('Equipar', 'Equip')}</button>
      <button class="ghost sm" type="button" data-act="sell:${campSel.i}">${$t('Vender por', 'Sell for')} ${sellPrice(it)}</button></div>`;
  } else if (campSel && campSel.from==='equip' && h.equip[campSel.slot]){
    const it = h.equip[campSel.slot], full = h.stash.length>=STASH_MAX;
    const alts = h.stash.filter(o => o.slot===it.slot).length;
    detail = `${itemCard(it,$t('Equipado', 'Equipped'))}
      <p class="muted small">${alts ? $t(`${alts} ${alts===1?'item':'itens'} deste tipo no baú: use o filtro ${SLOTS[it.slot].label} para comparar.`, `${alts} ${alts===1?'item':'items'} of this type in the stash: use the ${SLOTS[it.slot].label} filter to compare.`) : $t('Nenhum item deste tipo no baú.', 'No items of this type in the stash.')}</p>
      <div class="row"><button class="ghost sm" type="button" data-act="unequip:${campSel.slot}" ${full?'disabled':''}>${$t('Guardar no baú', 'Move to stash')}${full?$t(' (cheio)', ' (full)'):''}</button></div>`;
  }
  return `<div class="gearlayout">
    <section class="gpanel">
      <h3 class="sub">${$t('Equipado', 'Equipped')}</h3><div class="eslots">${slots}</div>
      <dl class="stats st4"><div><dt>${$t('Dano', 'Damage')}</dt><dd>${st.dmg}</dd></div><div><dt>${$t('Vida', 'Health')}</dt><dd>${st.hp}</dd></div><div><dt>${$t('Escudo', 'Shield')}</dt><dd>${st.shield}</dd></div><div><dt>${$t('Recarga', 'Cooldown')}</dt><dd>-${st.cdr}</dd></div></dl><p class="resline"><b>${$t('Resistências', 'Resistances')}</b>${$t(': fogo', ': fire')} ${st.resFire}${$t('% · gelo', '% · cold')} ${st.resCold}${$t('% · raio', '% · lightning')} ${st.resLight}%${st.fireDmg+st.coldDmg+st.lightDmg ? `<br><b>${$t('Dano elemental', 'Elemental damage')}</b>${$t(': fogo +', ': fire +')}${st.fireDmg} ${$t('· gelo +', '· cold +')}${st.coldDmg} ${$t('· raio +', '· lightning +')}${st.lightDmg}` : ''}</p>
    </section>
    <section class="gpanel">
      <div class="shead"><h3 class="sub">${$t('Baú', 'Stash')} <span class="muted">${h.stash.length}/${STASH_MAX}</span></h3>
        ${commons.length ? `<button class="ghost sm" type="button" data-act="sellcommons">${$t('Vender', 'Sell')} ${commons.length} ${commons.length===1?'comum':'comuns'} (+${commons.reduce((a,it)=>a+sellPrice(it),0)})</button>` : ''}</div>
      <div class="chips">${chips}</div>${grid}
    </section>
    <section class="gpanel detail" aria-live="polite"><h3 class="sub">${$t('Detalhes', 'Details')}</h3>${detail}</section>
  </div>`;
}
/* ---------- Forge: crafting with gold and Blood Embers ----------
   Salvage stash items into Embers; reroll or upgrade an affix, add one, or temper a unique to your level. */
const SALVAGE = {common:1, magic:2, rare:4, legend:10};
const forgeIlvl = h => h.level + 3*(h.tormentMax||0);
const isRuleAf = a => AFX[a.k] && AFX[a.k].rule;
function forgeItem(h){
  if (campSel && campSel.from==='stash') return h.stash[campSel.i] || null;
  if (campSel && campSel.from==='equip') return h.equip[campSel.slot] || null;
  return null;
}
function uniqueDef(name){
  const all = [...UNIQUES, ...UBER_UNIQUES, ...Object.values(UBER_OWN).flat(), ...FALLEN_UNIQUES];
  return all.find(U => U.name===name || relabel(U.name)===name || (I18N.en[U.name]||'')===name || (I18N.pt[U.name]||'')===name) || null;
}
// cost of an operation, or null when it does not apply
function forgeCost(h, it, op, ai){
  const a = it.affixes[ai];
  if (op==='reroll') return it.rar!=='legend' && a && !isRuleAf(a) ? {gold:20*(a.t||1), embers:6} : null;
  if (op==='upgrade'){ if (it.rar==='legend' || !a || isRuleAf(a) || !a.t) return null;
    const tiers = tiersFor(a.k, it.slot); return tiers && a.t < Math.min(5, maxTier(it.ilvl||1)) && tiers[a.t] ? {gold:40*a.t, embers:5*a.t} : null; }
  if (op==='enchant') return it.rar!=='legend' && it.affixes.filter(x => !isRuleAf(x)).length < 3 ? {gold:100, embers:15} : null;
  if (op==='temper'){ const U = it.rar==='legend' && uniqueDef(it.name); return U && maxTier(forgeIlvl(h)) > maxTier(it.ilvl||1) ? {gold:150, embers:20} : null; }
  if (op==='salvage') return campSel && campSel.from==='stash' ? {gold:0, embers:0} : null;
  return null;
}
const costTxt = c => c.gold || c.embers ? [c.gold ? `${c.gold} ${$t('ouro', 'gold')}` : '', c.embers ? `${c.embers} ${$t('brasas', 'embers')}` : ''].filter(Boolean).join(' + ') : '';
const canPay = (h, c) => c && (h.gold||0) >= c.gold && (h.embers||0) >= c.embers;
function forgeDo(h, op, ai){
  const it = forgeItem(h); if (!it) return '';
  const c = forgeCost(h, it, op, ai);
  if (!c) return $t('A Forja não pode fazer isso com este item.', 'The Forge cannot do that with this item.');
  if (!canPay(h, c)) return $t(`Faltam recursos: precisa de ${costTxt(c)}.`, `Not enough resources: needs ${costTxt(c)}.`);
  const top = maxTier(it.ilvl||1);
  if (op==='salvage'){
    const n = SALVAGE[it.rar] || 1; h.stash.splice(campSel.i, 1); campSel = null; h.embers = (h.embers||0) + n;
    return $t(`${esc(it.name)} desmanchado: +${n} brasas.`, `${esc(it.name)} salvaged: +${n} embers.`);
  }
  h.gold -= c.gold; h.embers = (h.embers||0) - c.embers;
  if (op==='reroll'){
    const old = it.affixes[ai];
    const keys = shuffle(Object.keys(POOL).filter(k => tiersFor(k, it.slot) && k!==old.k && !it.affixes.some(x => x.k===k)));
    const nu = keys.map(k => rollAffix(k, it.slot, top)).find(Boolean);
    if (!nu){ h.gold += c.gold; h.embers += c.embers; return $t('Não há outro afixo possível para este item.', 'There is no other possible affix for this item.'); }
    it.affixes[ai] = nu;
    return $t(`Refeito: ${AFX[old.k].t(old.v)} virou ${AFX[nu.k].t(nu.v)}.`, `Rerolled: ${AFX[old.k].t(old.v)} became ${AFX[nu.k].t(nu.v)}.`);
  }
  if (op==='upgrade'){
    const a = it.affixes[ai], [lo, hi] = tiersFor(a.k, it.slot)[a.t];
    a.t++; a.v = Math.max(a.v, lo + rint(hi-lo+1));
    return $t(`Aprimorado para T${a.t}: ${AFX[a.k].t(a.v)}.`, `Upgraded to T${a.t}: ${AFX[a.k].t(a.v)}.`);
  }
  if (op==='enchant'){
    const nu = shuffle(Object.keys(POOL).filter(k => tiersFor(k, it.slot) && !it.affixes.some(x => x.k===k))).map(k => rollAffix(k, it.slot, top)).find(Boolean);
    if (!nu){ h.gold += c.gold; h.embers += c.embers; return $t('Não há afixo novo possível para este item.', 'There is no new affix possible for this item.'); }
    it.affixes.push(nu);
    const n = it.affixes.filter(x => !isRuleAf(x)).length;
    if (it.rar==='common' && n>=2) it.rar = 'magic'; if (it.rar==='magic' && n>=3) it.rar = 'rare';
    return $t(`Encantado: ${AFX[nu.k].t(nu.v)}.`, `Enchanted: ${AFX[nu.k].t(nu.v)}.`);
  }
  if (op==='temper'){
    const n = makeUnique(uniqueDef(it.name), forgeIlvl(h));
    it.affixes = n.affixes; it.ilvl = n.ilvl; delete it.legacy;
    return $t(`${esc(it.name)} temperado no nível ${it.ilvl}.`, `${esc(it.name)} tempered to level ${it.ilvl}.`);
  }
  return '';
}
function campForge(h){
  const eq = Object.keys(SLOTS).filter(s => h.equip[s]).map(s => itemTile(h.equip[s], 'selE:'+s, campSel && campSel.from==='equip' && campSel.slot===s)).join('');
  const st = h.stash.map((it,i) => itemTile(it, 'selS:'+i, campSel && campSel.from==='stash' && campSel.i===i)).join('');
  const it = forgeItem(h);
  const btn = (op, ai, label) => { const c = forgeCost(h, it, op, ai); if (!c) return '';
    return `<button class="${canPay(h,c) && (op==='enchant' || op==='temper') ? 'primary' : 'ghost'} sm" type="button" data-act="forge:${op}|${ai}" ${canPay(h,c)?'':'disabled'}>${label}${costTxt(c) ? ` <small>(${costTxt(c)})</small>` : ''}</button>`; };
  let detail = $t('<p class="muted">Escolha um item, equipado ou do baú.</p>', '<p class="muted">Pick an item, equipped or from the stash.</p>');
  if (it){
    const top = maxTier(it.ilvl||1);
    const rows = it.affixes.map((a,i) => `<li class="frow ${isRuleAf(a)?'rule':''}"><span>${AFX[a.k].t(a.v)}${a.t ? ` <span class="tier t${a.t}">T${a.t}</span>` : ''}</span><span class="fbtns">${btn('reroll', i, $t('Refazer', 'Reroll'))}${btn('upgrade', i, $t('Aprimorar', 'Upgrade'))}</span></li>`).join('');
    detail = `<div class="card"><div class="meta">${RAR[it.rar].label} · ${SLOTS[it.slot].label} · ${$t('nível', 'level')} ${it.ilvl||1} · ${$t('camada máxima', 'max tier')} T${top}</div><div class="nm rc-${it.rar}">${esc(it.name)}</div><ul class="flist">${rows}</ul></div>
      <div class="row fops">${btn('enchant', 0, $t('Encantar: novo afixo', 'Enchant: new affix'))}${btn('temper', 0, $t(`Temperar: T${maxTier(it.ilvl||1)} → T${maxTier(forgeIlvl(h))}`, `Temper: T${maxTier(it.ilvl||1)} → T${maxTier(forgeIlvl(h))}`))}${it.rar==='legend' && !forgeCost(h, it, 'temper', 0) && maxTier(forgeIlvl(h)) < 5 ? `<span class="muted small">${$t(`Temperar sobe a camada dos números. A próxima (T${maxTier(forgeIlvl(h))+1}) libera no nível ${TIER_ILVL[maxTier(forgeIlvl(h))]}.`, `Tempering raises the tier of the numbers. The next one (T${maxTier(forgeIlvl(h))+1}) unlocks at level ${TIER_ILVL[maxTier(forgeIlvl(h))]}.`)}</span>` : ''}${campSel.from==='stash' ? `<button class="ghost sm" type="button" data-act="forge:salvage|0">${$t('Desmanchar', 'Salvage')} <small>(+${SALVAGE[it.rar]||1} ${$t('brasas', 'embers')})</small></button>` : ''}</div>
      <p class="muted small">${it.rar==='legend' ? $t('Únicos não mudam de afixos. Os números de um único sobem por camada (níveis 1, 5, 10, 18 e 28); Temperar leva o item à camada do seu nível atual (nível do herói + 3 por Tormento liberado).', 'Uniques keep their affixes. A unique\'s numbers go up by tier (levels 1, 5, 10, 18 and 28); Tempering brings the item to the tier of your current level (hero level + 3 per unlocked Torment).')
        : $t('Refazer troca um afixo por outro. Aprimorar sobe a camada até o máximo que o nível do item permite. Encantar adiciona um afixo (até 3) e sobe a raridade.', 'Reroll swaps an affix for another. Upgrade raises the tier up to the maximum the item level allows. Enchant adds an affix (up to 3) and raises the rarity.')}</p>`;
  }
  return `<div class="thead"><p class="muted">${$t('Ouro', 'Gold')} <b>${h.gold}</b> · ${$t('Brasas de Sangue', 'Blood Embers')} <b>${h.embers||0}</b>. ${$t('Brasas vêm da Maré de Sangue e de itens desmanchados aqui.', 'Embers come from the Blood Tide and from items salvaged here.')}</p></div>
    <div class="gearlayout">
      <section class="gpanel"><h3 class="sub">${$t('Equipado', 'Equipped')}</h3><div class="igrid">${eq || `<p class="muted small">${$t('Nada equipado.', 'Nothing equipped.')}</p>`}</div>
        <h3 class="sub">${$t('Baú', 'Stash')} <span class="muted">${h.stash.length}/${STASH_MAX}</span></h3><div class="igrid">${st || `<p class="muted small">${$t('Vazio.', 'Empty.')}</p>`}</div></section>
      <section class="gpanel detail forge" aria-live="polite"><h3 class="sub">${$t('Bigorna', 'Anvil')}</h3>${detail}</section>
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
  const kind = {small:$t('Passiva', 'Passive'), notable:$t('Notável', 'Notable'), key:$t('Pedra-chave', 'Keystone'), start:$t('Origem', 'Origin')}[n.kind];
  const status = on ? $t('<span class="st on">Aprendido</span>', '<span class="st on">Learned</span>') : canL ? $t('<span class="st av">Clique para ver e aprender (1 ponto)</span>', '<span class="st av">Click to view and learn (1 point)</span>')
    : `<span class="st no">${pts>0 ? $t('Bloqueado: precisa estar ligado a um nó aprendido', 'Locked: must connect to a learned node') : $t('Sem pontos livres', 'No free points')}</span>`;
  tip.innerHTML = `<span class="k">${kind}${n.branch ? ' · ' + n.branch : ''}</span><b class="${n.kind}">${esc(n.name)}</b>${n.kind!=='small' || n.d!==n.name ? `<p>${esc(n.d)}</p>` : ''}${status}`;
  tip.hidden = false;
  const r = tip.getBoundingClientRect(), x = Math.min(ev.clientX + 16, innerWidth - r.width - 8), y = Math.min(ev.clientY + 16, innerHeight - r.height - 8);
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
$('scrCamp').addEventListener('mousemove', treeTip);
// hover tooltip for the equipment icons on the game screen
function gearTip(ev){
  const g = ev.target.closest && ev.target.closest('[data-gslot]');
  let tip = document.getElementById('gearTip');
  if (!g || !S || !S.equip){ if (tip) tip.hidden = true; return; }
  if (!tip){ tip = document.createElement('div'); tip.id = 'gearTip'; tip.className = 'ttip'; document.body.appendChild(tip); }
  const slot = g.dataset.gslot, it = S.equip[slot];
  tip.innerHTML = it
    ? `<span class="k">${SLOTS[slot].label} · ${RAR[it.rar].label}${it.ilvl ? $t(` · nível ${it.ilvl}`, ` · level ${it.ilvl}`) : ''}</span><b style="color:${RAR[it.rar].c}">${esc(it.name)}</b>${affixList(it)}`
    : `<span class="k">${SLOTS[slot].label}</span><p>${$t('Espaço vazio', 'Empty slot')}</p>`;
  tip.hidden = false;
  const r = tip.getBoundingClientRect(), x = Math.min(ev.clientX + 16, innerWidth - r.width - 8), y = Math.min(ev.clientY + 16, innerHeight - r.height - 8);
  tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
}
$('scrGame').addEventListener('mousemove', gearTip);
$('scrGame').addEventListener('mouseleave', () => { const t = document.getElementById('gearTip'); if (t) t.hidden = true; });
$('scrGame').addEventListener('focusin', ev => { const g = ev.target.closest && ev.target.closest('[data-gslot]'); if (g){ const r = g.getBoundingClientRect(); gearTip({target:g, clientX:r.right, clientY:r.top}); } });
$('scrGame').addEventListener('focusout', () => { const t = document.getElementById('gearTip'); if (t) t.hidden = true; });
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
const NODE_KIND = {small:$t('Passiva', 'Passive'), notable:$t('Notável', 'Notable'), key:$t('Pedra-chave', 'Keystone'), start:$t('Origem', 'Origin')};
function nodeDetail(sel, on, can, pts, learnAct){
  if (!sel) return $t('<p>Clique num nó para ver o que ele faz. Nós grandes são Notáveis (regras novas); os maiores, no fim de cada ramo, são Pedras-chave.</p>', '<p>Click a node to see what it does. Large nodes are Notables (new rules); the largest, at the end of each branch, are Keystones.</p>');
  return `<span class="xk">${NODE_KIND[sel.kind]}${sel.branch ? ' · '+sel.branch : ''}</span><b>${esc(sel.name)}</b><p>${esc(sel.d)}</p>
    ${on.has(sel.id) ? $t('<p class="pw">Aprendido.</p>', '<p class="pw">Learned.</p>') : can(sel.id) ? `<button class="primary sm" type="button" data-act="${learnAct}:${sel.id}">${$t('Aprender (1 ponto)', 'Learn (1 point)')}</button>` : `<p>${pts>0 ? $t('Precisa estar ligado a um nó aprendido.', 'Must connect to a learned node.') : $t('Sem pontos livres.', 'No free points.')}</p>`}`;
}
let campANode = null;
function campTree(h){
  const T = treeFor(h.cls), pts = treePoints(h), learned = (h.tree||[]).map(id => T[id]).filter(Boolean), total = Object.keys(T).length - 1;
  const big = learned.filter(n => n.kind!=='small');
  const list = big.length
    ? `<div class="sgrid">${big.map(n => `<div class="scard onbar"><div class="tt"><b>${esc(n.name)}</b><span class="muted small">${NODE_KIND[n.kind]} · ${esc(n.branch||'')}</span></div><p>${esc(n.d)}</p></div>`).join('')}</div>`
    : `<p class="muted">${$t('Nenhuma regra aprendida ainda. Abra a árvore para escolher o seu caminho.', 'No rules learned yet. Open the tree to choose your path.')}</p>`;
  return `<div class="thead"><p class="muted">${pts>0 ? `${$t('Você tem', 'You have')} <b class="pts">${pts}</b> ${pts===1?$t('ponto', 'point'):$t('pontos', 'points')} ${$t('para gastar.', 'to spend.')}` : $t('Sem pontos livres.', 'No free points.')} ${$t('Ganha 1 por nível (até o 50) e até 8 no endgame: 2 pela campanha, 1 pelo Reflexo, 1 por chefe supremo e 1 pelo Rei Caído. A árvore tem mais nós do que pontos: escolha.', 'You gain 1 per level (up to 50) and up to 8 in the endgame: 2 for the campaign, 1 for the Reflection, 1 per uber boss and 1 for the Fallen King. The tree has more nodes than points: choose.')}</p>
      <button class="primary sm" type="button" data-act="treeopen">${$t('Abrir a árvore', 'Open the tree')}</button>
      <button class="ghost sm" type="button" data-act="respec">${$t('Redistribuir pontos (grátis)', 'Reset points (free)')}</button></div>
    <div class="xcard"><span class="xk">${$t('Sua árvore', 'Your tree')}</span><b>${learned.length} / ${total} ${$t('nós', 'nodes')}</b></div>
    ${list}`;
}
// Appearance: the emblems worn by the piece, earned by using each skill
function campSkins(h){
  const cards = skinsOf(h.cls).map(A => {
    const n = skinUses(h, A), ok = n >= SKIN_FEAT, on = h.skin===A.id, pct = Math.min(100, Math.round(100*n/SKIN_FEAT));
    return `<div class="scard ${on?'onbar':''} ${ok?'':'locked'}"><div class="tt"><b>${esc(A.name)}</b><span class="muted small">${ok ? $t('desbloqueada', 'unlocked') : $t('bloqueada', 'locked')}</span></div>
      <p>${$t('Feito: usar', 'Feat: use')} <b>${esc(SKILLS[A.skill].name)}</b> ${SKIN_FEAT} ${$t('vezes', 'times')} (${Math.min(n, SKIN_FEAT)}/${SKIN_FEAT}).</p>
      <div class="bar xp"><i style="width:${pct}%"></i></div>
      ${ok ? (on ? `<button class="ghost sm" type="button" data-act="skin:none">${$t('Tirar', 'Remove')}</button>` : `<button class="primary sm" type="button" data-act="skin:${A.id}">${$t('Usar', 'Wear')}</button>`) : ''}</div>`;
  }).join('');
  return `<div class="thead"><p class="muted">${$t('Skins são só aparência: um adereço que a sua peça carrega no tabuleiro. Cada uma é liberada ao usar a habilidade correspondente 25 vezes, em qualquer expedição.', 'Skins are cosmetic only: an emblem your piece carries on the board. Each is unlocked by using the matching skill 25 times, in any expedition.')}</p></div><div class="sgrid">${cards}</div>`;
}
function campAtlas(h){
  if (h.actDone<4) return $t('<p class="muted">Conclua o Ato 4 para liberar os mapas e o Atlas.</p>', '<p class="muted">Complete Act 4 to unlock maps and the Atlas.</p>');
  const T = atlasTree(), pts = atlasPoints(h), learned = (h.atlasTree||[]).map(id => T[id]).filter(Boolean), total = Object.keys(T).length - 1;
  const col = {crypt:'#8a6a48', swamp:'#5f8a55', forge:'#d0602a', cathedral:'#8fb0d8'};
  const prog = ACTS.map(b => { const n = [...Array(10).keys()].filter(i => (h.atlas||{})[b+'-'+(i+1)]).length;
    return `<div class="aprog"><span>${BIOMES[b].name}</span><div class="adots">${[...Array(10).keys()].map(i => `<i class="${(h.atlas||{})[b+'-'+(i+1)] ? 'done' : ''}" style="--bc:${col[b]}" title="${$t('Nível', 'Tier')} ${i+1}${(h.atlas||{})[b+'-'+(i+1)] ? $t(': concluído', ': completed') : ''}"></i>`).join('')}</div><small>${n}/10</small></div>`; }).join('');
  const big = learned.filter(n => n.kind!=='small');
  const list = big.length ? `<div class="sgrid">${big.map(n => `<div class="scard onbar"><div class="tt"><b>${esc(n.name)}</b><span class="muted small">${NODE_KIND[n.kind]} · ${esc(n.branch||'')}</span></div><p>${esc(n.d)}</p></div>`).join('')}</div>` : '';
  return `<div class="thead"><p class="muted">${$t('Cada bioma e nível de mapa concluído pela primeira vez (matando o chefe do mapa) dá 1 ponto, até 40. O Atlas tem mais de 90 nós: cada mecânica (Fenda, Xeque-mate, Maré, Horda) tem um tronco e dois sub-ramos, e você não pega tudo. Os efeitos valem dentro dos mapas.', 'Each biome and map tier completed for the first time (by killing the map boss) gives 1 point, up to 40. The Atlas has over 90 nodes: each mechanic (Rift, Checkmate, Tide, Horde) has a trunk and two sub-branches, and you cannot take everything. Effects apply inside maps.')} ${pts>0 ? `<b class="pts">${pts}</b> ${pts===1?$t('ponto livre', 'free point'):$t('pontos livres', 'free points')}.` : $t('Sem pontos livres.', 'No free points.')}</p>
      <button class="primary sm" type="button" data-act="treeopen:atlas">${$t('Abrir o Atlas', 'Open the Atlas')}</button>
      <button class="ghost sm" type="button" data-act="atlasReset">${$t('Redistribuir (grátis)', 'Reset (free)')}</button></div>
    <div class="xcard"><span class="xk">${$t('Seu Atlas', 'Your Atlas')}</span><b>${learned.length} / ${total} ${$t('nós', 'nodes')}</b></div>
    ${list}<h4 class="dh">${$t('Conclusões', 'Completions')}</h4>${prog}`;
}
function campTalents(h, pts){
  const cards = talentList(h.cls).map(t => {
    const r = h.talents[t.id]||0, locked = h.level < t.req, can = pts>0 && r<t.max && !locked;
    const pips = Array.from({length:t.max}, (_,i) => `<i class="${i<r?'on':''}"></i>`).join('');
    return `<div class="tcard ${locked?'locked':''} ${r?'has':''}"><div class="tt"><b>${t.name}</b><span class="pips" aria-label="${r} ${$t('de', 'of')} ${t.max}">${pips}</span></div>
      <p>${t.desc(Math.max(1,r))}</p>${locked ? `<span class="muted small">${$t('Libera no nível', 'Unlocks at level')} ${t.req}</span>` : `<button class="${can?'primary':'ghost'} sm" type="button" data-act="talent:${t.id}" ${can?'':'disabled'}>${r>=t.max?$t('Completo', 'Complete'):$t('Aprender', 'Learn')}</button>`}</div>`;
  }).join('');
  return `<div class="thead"><p class="muted">${pts>0 ? `${$t('Você tem', 'You have')} <b class="pts">${pts}</b> ${pts===1?'ponto':'pontos'} ${$t('para gastar. Ganha 1 por nível.', 'to spend. You gain 1 per level.')}` : $t('Sem pontos livres. Você ganha 1 por nível.', 'No free points. You gain 1 per level.')}</p>
    <button class="ghost sm" type="button" data-act="respec">${$t('Redistribuir pontos (grátis)', 'Reset points (free)')}</button></div><div class="tgrid">${cards}</div>`;
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
    ${portal('camp', $t('Campanha', 'Campaign'), prog>=4 ? $t('Concluída', 'Completed') : $t(`Ato ${nextAct+1}: ${BIOMES[ACTS[nextAct]].name}`, `Act ${nextAct+1}: ${BIOMES[ACTS[nextAct]].name}`), prog>=4 ? $t('Suba o Tormento ou repita um ato', 'Raise the Torment or replay an act') : $t('Continue a história', 'Continue the story'), false)}
    ${portal('maps', $t('Mapas', 'Maps'), mapsOpen(h) ? `${h.maps.length} ${h.maps.length===1?$t('mapa', 'map'):$t('mapas', 'maps')}` : $t('Bloqueado', 'Locked'), mapsOpen(h) ? $t('Dispositivo de Mapas', 'Map Device') : $t('Conclua o Ato 4 da campanha', 'Complete Act 4 of the campaign'), !mapsOpen(h))}
    ${portal('bosses', $t('Chefes Supremos', 'Uber Bosses'), `${Object.keys(UBERS).length} ${$t('supremos', 'ubers')}`, canUber(h) ? $t('Você pode enfrentar um agora', 'You can face one now') : $t(`${h.riftShards||0}/${UBER_COST.shards} Estilhaços · ${h.checkSeals||0}/${UBER_COST.seals} Selos`, `${h.riftShards||0}/${UBER_COST.shards} Shards · ${h.checkSeals||0}/${UBER_COST.seals} Seals`), false)}
    ${portal('chal', $t('Desafios', 'Challenges'), $t('Abismo e Desafio do dia', 'Abyss and Daily Challenge'), $t(`Recorde no Abismo: andar ${h.record||0}`, `Abyss record: floor ${h.record||0}`), false)}
  </div>`;
  const torm = `<div class="tormbar"><div><span class="xk">${$t('Dificuldade · vale para tudo, menos o desafio do dia', 'Difficulty · applies to everything except the daily challenge')}</span><b>${h.torment ? $t('Tormento ', 'Torment')+h.torment : $t('Normal', 'Normal')}</b><p class="muted small">${tormentDesc(h.torment||0)}</p></div>
      <div class="tstep"><button class="ghost sm" type="button" data-act="torm:-1" ${(h.torment||0)>0?'':'disabled'} aria-label="${$t('Diminuir tormento', 'Lower torment')}">−</button>
      <span>${h.torment||0} / ${h.tormentMax||0}</span>
      <button class="ghost sm" type="button" data-act="torm:1" ${(h.torment||0)<(h.tormentMax||0)?'':'disabled'} aria-label="${$t('Aumentar tormento', 'Raise torment')}">+</button></div></div>`;
  const body = campExp==='maps' ? expMaps(h, side) : campExp==='bosses' ? expBosses(h, side) : campExp==='chal' ? expChallenges(h) : expCampaign(h, side, prog);
  return portals + torm + `<div class="xbody">${body}</div>`;
}
function expCampaign(h, side, prog){
  if (campAct===null || campAct>Math.min(3,prog)) campAct = Math.min(3, prog);
  const nodes = ACTS.map((b,i) => {
    const open = i <= prog, done = i < prog;
    return `<button class="actnode bio-${b} ${campAct===i?'on':''} ${done?'done':''}" type="button" data-act="actsel:${i}" ${open?'':'disabled'} aria-pressed="${campAct===i}">
      <span class="an-n">${done ? '✓' : i+1}</span><span class="an-t"><b>${BIOMES[b].name}</b><small>${done ? $t('Concluído', 'Completed') : open ? $t('Disponível', 'Available') : $t('Bloqueado', 'Locked')}</small></span></button>`;
  }).join('<span class="an-link" aria-hidden="true"></span>');
  const b = ACTS[campAct], done = campAct < prog;
  return `<div class="actpath">${nodes}</div>
    <div class="actdetail bio-${b}">
      <div><span class="xk">${$t('Ato', 'Act')} ${campAct+1}${h.torment ? $t(` · Tormento ${h.torment}`, ` · Torment ${h.torment}`) : ''}</span><h3 class="sh">${BIOMES[b].name}</h3>
        <p>${BIOMES[b].rule}</p><p class="muted small">${$t('Três andares; o último é o chefe:', 'Three floors; the last one is the boss:')} ${BOSSES[BIOMES[b].boss].names[side]}.</p></div>
      <button class="primary" type="button" data-act="act:${campAct}">${done ? $t('Repetir ato', 'Replay act') : $t(`Iniciar Ato ${campAct+1}`, `Start Act ${campAct+1}`)}</button>
    </div>
    <p class="muted small xfoot">${$t('Primeira vez?', 'First time?')} <button class="link" type="button" data-act="tutorial">${h.tutorialDone ? $t('Refazer o Pátio de Treino', 'Redo the Training Yard') : $t('Fazer o Pátio de Treino', 'Do the Training Yard')}</button></p>`;
}
function expBosses(h, side){
  const killed = h.bossesKilled.filter(id => BOSSES[id] && id!=='fallen');
  const hunts = killed.length ? `<div class="chips">${killed.map(id => `<button class="ghost sm" type="button" data-act="hunt:${id}">${BOSSES[id].names[side]}</button>`).join('')}</div>` : $t('<p class="muted small">Derrote um chefe na campanha para poder caçá-lo de novo.</p>', '<p class="muted small">Defeat a boss in the campaign to hunt it again.</p>');
  return `<p class="muted small">${$t('Cada chefe supremo custa', 'Each uber boss costs')} ${UBER_COST.shards} ${$t('Estilhaços (você tem', 'Shards (you have')} ${h.riftShards||0}) e ${UBER_COST.seals} ${$t('Selos (você tem', 'Seals (you have')} ${h.checkSeals||0}${$t('). Estilhaços vêm das Fendas; Selos, das Partidas Congeladas.', '). Shards come from Rifts; Seals, from Frozen Matches.')}</p>
    <div class="xgrid">${Object.entries(UBERS).map(([id,U]) => `<div class="xcard bio-${U.biome}"><span class="xk">${$t('Supremo', 'Uber')}</span><b>${U.name}</b>
      <p>${U.special}</p>
      <ul class="uown">${UBER_OWN[id].map(o => `<li class="${ownsUnique(h, o.name)?'have':''}" title="${esc(AFX[o.affixes[0].k].t())}">${ownsUnique(h, o.name)?'✓ ':''}<span class="rc-legend">${esc(o.name)}</span></li>`).join('')}</ul>
      <p class="muted small">${$t('Deixa um destes ou um único supremo comum, e um Fragmento da Coroa.', 'Drops one of these or a common uber unique, and a Crown Fragment.')} ${((h.crownFrags||{})[id]||0) ? $t(`Fragmentos: ${h.crownFrags[id]}.`, `Fragments: ${h.crownFrags[id]}.`) : ''}</p>
      <button class="${canUber(h)?'primary':'ghost'} sm" type="button" data-act="uber:${id}" ${canUber(h)?'':'disabled'}>${$t('Enfrentar', 'Face')}</button></div>`).join('')}</div>
    <div class="xcard pinnacle"><span class="xk">${$t('Pináculo', 'Pinnacle')}</span><b>${$t('O Rei Caído', 'The Fallen King')}</b>
      <p>${BOSSES.fallen.p1}</p><p>${BOSSES.fallen.p2}</p><p>${BOSSES.fallen.p3}</p>
      <div class="frags">${BOSS_ORDER.map(id => `<span class="${((h.crownFrags||{})[id]||0)>0?'have':''}">${UBERS[id].name}<b>${(h.crownFrags||{})[id]||0}</b></span>`).join('')}</div>
      <ul class="uown">${FALLEN_UNIQUES.map(o => `<li class="${ownsUnique(h, o.name)?'have':''}" title="${esc(AFX[o.affixes[0].k].t())}">${ownsUnique(h, o.name)?'✓ ':''}<span class="rc-legend">${esc(o.name)}</span>: ${AFX[o.affixes[0].k].t()}</li>`).join('')}</ul>
      <p class="muted small">${$t('A entrada custa um Fragmento da Coroa de cada supremo. Cada supremo derrotado deixa o seu.', 'Entry costs one Crown Fragment from each uber boss. Each uber you defeat drops its own.')}${h.fallenKills ? $t(` Derrotado ${h.fallenKills}×.`, ` Defeated ${h.fallenKills}×.`) : ''}</p>
      <button class="${canFallen(h)?'primary':'ghost'} sm" type="button" data-act="pinnacle" ${canFallen(h)?'':'disabled'}>${$t('Entrar na sala do trono', 'Enter the throne room')}</button></div>
    <h3 class="sub">${$t('Caça ao chefe', 'Boss hunt')} <span class="muted">${$t('um andar só, com o chefe e as relíquias dele', 'a single floor, with the boss and its relics')}</span></h3>${hunts}`;
}
function expChallenges(h){
  const dailyDone = h.daily===todayStr();
  const ev = [[$t('Fenda', 'Rift'),'#b08cff',$t('Pise no rasgo roxo: 5 turnos de crias que deixam Estilhaços.', 'Step on the purple tear: 5 turns of spawn that drop Shards.')],[$t('Partida Congelada', 'Frozen Match'),'#cfe6f5',$t('Um problema de xeque-mate; ensina poderes do Grimório e dá Selos.', 'A checkmate puzzle; teaches Grimoire powers and gives Seals.')],
    [$t('Horda', 'Horde'),'#f08a3c',$t('Fim de jogo: dezenas de lacaios de um golpe. Limpe rápido para um bônus.', 'Endgame: dozens of one-hit minions. Clear it fast for a bonus.')],
    [$t('Maré de Sangue', 'Blood Tide'),'#e04a3a',$t('Onda de 1 a 3 andares: poças de sangue, Brasas e o Baú Tormentoso.', 'A wave of 1 to 3 floors: blood pools, Embers and the Torment Chest.')],[$t('Rival', 'Rival'), '#8fd18a', $t(`${esc(heroRival(h).name)}, nível ${heroRival(h).tier}: pode aparecer uma vez por expedição.`, `${esc(heroRival(h).name)}, level ${heroRival(h).tier}: may show up once per expedition.`)]];
  return `<div class="xgrid">
      <div class="xcard"><span class="xk">${$t('Sem fim', 'Endless')}</span><b>${$t('Abismo infinito', 'Endless Abyss')}</b><p>${$t('Biomas mudam a cada 3 andares, chefe a cada 3, o Reflexo a cada 12. A dificuldade sobe a cada andar.', 'Biomes change every 3 floors, a boss every 3, the Reflection every 12. Difficulty rises every floor.')}</p><p class="muted small">${$t('Recorde: andar', 'Record: floor')} ${h.record||0}.</p><button class="primary sm" type="button" data-act="abyss">${$t('Descer', 'Descend')}</button></div>
      <div class="xcard"><span class="xk">${$t('Desafio do dia ·', 'Daily challenge ·')} ${todayStr()}</span><b>${$t('Tabuleiro do dia', 'Board of the day')}</b><p>${$t('Igual para todos. Vença dentro do limite de turnos.', 'The same for everyone. Win within the turn limit.')}</p><p class="muted small">${dailyDone ? $t('Recompensa de hoje já recebida.', 'Today\'s reward already claimed.') : $t('Recompensa: escolha entre dois únicos.', 'Reward: choose between two uniques.')}</p><button class="ghost sm" type="button" data-act="daily">${$t('Jogar', 'Play')}</button></div>
    </div>
    <h3 class="sub">${$t('Eventos que surgem nos andares', 'Events that show up on floors')} <span class="muted">${$t('em qualquer modo', 'in any mode')}</span></h3>
    <div class="evstrip">${ev.map(([n,c,d]) => `<div style="--ec:${c}"><b>${n}</b><span>${d}</span></div>`).join('')}</div>`;
}
function mapTile(m, on){
  const pen = m.affixes.filter(a => !isRewardAffix(a)).length, rew = m.affixes.length - pen, new_ = !(HERO.atlas||{})[`${m.biome}-${m.tier}`];
  return `<button class="mtile bio-${m.biome} ${on?'on':''}" type="button" data-act="dev:${m.id}" aria-pressed="${on}" title="${esc(mapName(m))}">
    <span class="mt-tier">${m.tier}</span><span class="mt-name">${BIOMES[m.biome].name}</span>
    <span class="mt-aff">${'<i class="pen"></i>'.repeat(pen)}${'<i class="rew"></i>'.repeat(rew)}</span>${new_ ? $t('<span class="mt-new">novo</span>', '<span class="mt-new">new</span>') : ''}</button>`;
}
function expMaps(h, side){
  const maps = h.maps.slice().sort((a,b) => b.tier-a.tier || a.biome.localeCompare(b.biome));
  if (campDev && !h.maps.some(m => m.id===campDev)) campDev = null;
  if (!campDev && maps.length) campDev = maps[0].id;
  const m = h.maps.find(m => m.id===campDev);
  const cur = Object.keys(CURRENCY).map(k => { const n = (h.currency||{})[k]||0;
    return `<button class="curbtn" type="button" data-act="cur:${m?m.id:''}|${k}" ${n&&m?'':'disabled'} title="${CURRENCY[k].d}" style="--cc:${CURRENCY[k].c}"><b>${CURRENCY[k].short}</b><span>${n}</span><small>${CURRENCY[k].d}</small></button>`; }).join('');
  const done = Object.keys(h.atlas||{}).length;
  const device = m ? `<div class="dev-core bio-${m.biome}"><span class="xk">${$t('Nível', 'Tier')}</span><span class="dc-tier">${m.tier}</span><span class="dc-name">${BIOMES[m.biome].name}</span></div>
      <div class="dev-info">
        <p class="muted small">${$t('Chefe no 3º andar:', 'Boss on floor 3:')} <b>${BOSSES[m.boss].names[side]}</b>${(h.atlas||{})[`${m.biome}-${m.tier}`] ? $t(' · já concluído no Atlas', ' · already completed in the Atlas') : $t(' · primeira conclusão: +1 ponto de Atlas', ' · first completion: +1 Atlas point')}</p>
        <ul class="maff">${m.affixes.filter(a=>!isRewardAffix(a)).map(a => `<li class="pen">${MAP_AFFIXES[a]}</li>`).join('')}${m.affixes.filter(isRewardAffix).map(a => `<li class="rew">${MAP_AFFIXES[a].replace($t('Recompensa: ', 'Reward:'),'')}</li>`).join('')}</ul>
        <button class="primary devgo" type="button" data-act="map:${m.id}">${$t('Abrir o portal', 'Open the portal')}</button>
      </div>`
    : `<div class="dev-core empty"><span class="dc-name">${$t('Vazio', 'Empty')}</span></div><div class="dev-info"><p class="muted">${$t('Nenhum mapa. Mapas caem dos chefes no Abismo infinito e nos próprios mapas.', 'No maps. Maps drop from bosses in the Endless Abyss and in maps themselves.')}</p></div>`;
  return `<div class="mapdev">
      <section class="mstash" aria-label="${$t('Seus mapas', 'Your maps')}"><h3 class="sub">${$t('Seus mapas', 'Your maps')} <span class="muted">${maps.length} ${$t('· clique para pôr no dispositivo', '· click to put in the device')}</span></h3>
        <div class="mgrid">${maps.map(x => mapTile(x, x.id===campDev)).join('') || $t('<p class="muted small">Vazio.</p>', '<p class="muted small">Empty.</p>')}</div>
        <p class="muted small">${$t('Atlas:', 'Atlas:')} ${done} ${done===1?$t('mapa concluído', 'map completed'):$t('mapas concluídos', 'maps completed')}${$t('. Pontos e bônus na aba Atlas.', '. Points and bonuses in the Atlas tab.')}</p></section>
      <section class="device" aria-label="${$t('Dispositivo de Mapas', 'Map Device')}"><h3 class="sub">${$t('Dispositivo de Mapas', 'Map Device')}</h3>
        <div class="dev-main">${device}</div>
        <div class="dev-cur"><span class="xk">${$t('Moedas · aplicar no mapa do dispositivo', 'Currency · apply to the map in the device')}</span><div class="curgrid">${cur}</div></div>
      </section>
    </div>`;
}
function campSkills(h){
  const pool = classPool(h.cls), st = statsFor(h.cls, h.color, h.equip);
  barSkills();   // initialises h.skills for older heroes
  const onBar = h.skills.filter(id => pool.includes(id) && h.level >= skillUnlock(h.cls, id)).slice(0, BAR_MAX);
  h.runes = h.runes || {}; h.skillRunes = h.skillRunes || {};
  const bag = Object.keys(RUNES).filter(r => h.runes[r]>0).map(r => `<span class="rchip" title="${RUNES[r].d}">${RUNES[r].name}<b>×${h.runes[r]}</b></span>`).join('');
  const card = id => {
    const sk = SKILLS[id], fixed = id==='shift', lv = fixed ? 0 : skillUnlock(h.cls, id), lock = h.level < lv, on = onBar.includes(id);
    const r = h.skillRunes[id];
    const fits = Object.keys(RUNES).filter(k => h.runes[k]>0 && (!RUNES[k].hit || sk.hits));
    const rune = lock ? '' : r
      ? `<div class="rslot"><span><b>${RUNES[r].name}</b>: ${RUNES[r].d}</span><div class="rpick"><button class="ghost sm" type="button" data-act="unrune:${id}">${$t('Remover runa', 'Remove rune')}</button></div></div>`
      : `<div class="rslot"><span>${$t('Encaixe de runa vazio', 'Empty rune socket')}${fits.length ? '' : $t(' · nenhuma runa que sirva', ' · no rune that fits')}</span>${fits.length ? `<div class="rpick">${fits.map(k => `<button class="ghost sm" type="button" data-act="rune:${id}|${k}" title="${RUNES[k].d}">${RUNES[k].name}</button>`).join('')}</div>` : ''}</div>`;
    const btn = fixed ? $t('<span class="muted small">Sempre na barra (Bispo)</span>', '<span class="muted small">Always on the bar (Bishop)</span>')
      : lock ? `<span class="muted small">${$t('Libera no nível', 'Unlocks at level')} ${lv}</span>`
      : on ? `<button class="ghost sm" type="button" data-act="skillOff:${id}" ${onBar.length<=1?'disabled':''}>${$t('Tirar da barra', 'Remove from bar')}</button>`
      : `<button class="primary sm" type="button" data-act="skillOn:${id}" ${onBar.length>=BAR_MAX?'disabled':''}>${$t('Pôr na barra', 'Put on bar')}</button>`;
    const tag = isAscSkill(id) ? `${$t('endgame', 'endgame')} · ` : '';
    return `<div class="scard ${on||fixed?'onbar':''} ${lock?'locked':''}"><div class="tt"><b>${sk.name}</b><span class="muted small">${tag}${$t('recarga', 'cooldown')} ${sk.cd}${sk.free?$t(' · não gasta ação', ' · costs no action'):''}</span></div>
      <p>${sk.desc(skillView(st, id))}.</p>${btn}${rune}</div>`;
  };
  const cards = pool.map(card).join('') + (h.cls==='B' ? card('shift') : '');
  return `<div class="thead"><p class="muted">${$t('Escolha até', 'Choose up to')} ${BAR_MAX} ${$t('habilidades para a barra (', 'skills for the bar (')}${onBar.length}/${BAR_MAX}${$t('), de qualquer parte da lista. Os aprimoramentos de cada habilidade ficam na Árvore. Runas mudam uma habilidade; caem de elites, chefes e baús.', '), from anywhere in the list. Each skill\'s upgrades are in the Tree. Runes change a skill; they drop from elites, bosses and chests.')}</p></div>
    <div class="runebag">${bag || $t('<span class="muted small">Você ainda não tem runas.</span>', '<span class="muted small">You have no runes yet.</span>')}</div>
    <div class="sgrid">${cards}</div>`;
}
function miniBoard(fen){
  const b = chParse(fen);
  return `<div class="mini" aria-hidden="true">${b.map((p,i) => `<i class="${(i%8 + ((i/8)|0))%2 ? 'd' : 'l'} ${p ? p.c : ''}">${p ? GLYPH[p.t] : ''}</i>`).join('')}</div>`;
}
function campGrimoire(h){
  const g = h.grimoire || {};
  const cards = MATES.map(m => g[m.id]
    ? `<div class="gcard known"><b>${m.name}</b>${miniBoard(m.fen)}<p>${m.tip}</p><p class="pw">${$t('Poder:', 'Power:')} ${m.power}</p></div>`
    : `<div class="gcard"><b>???</b><p>${$t('Padrão desconhecido · mate em', 'Unknown pattern · mate in')} ${m.n}.</p><p>${$t('Resolva uma Partida Congelada com este padrão para aprendê-lo e ganhar o poder.', 'Solve a Frozen Match with this pattern to learn it and gain the power.')}</p></div>`).join('');
  return `<div class="thead"><p class="muted">${$t('Cada padrão de mate resolvido numa Partida Congelada entra aqui e dá um poder permanente. Partidas aparecem em andares a partir do Ato 2, no Abismo e nos mapas.', 'Each mate pattern solved in a Frozen Match goes here and gives a permanent power. Matches show up on floors from Act 2 on, in the Abyss and in maps.')}</p></div><div class="ggrid">${cards}</div>`;
}
function showCamp(notice){
  if (notice!==undefined) campNotice = notice;
  if (legacyNotice){ campNotice = legacyNotice; legacyNotice = ''; }
  if (HERO.actDone>=4 && !HERO.maps.length){ HERO.maps.push(makeMap(1)); campNotice = (campNotice ? campNotice+' ' : '') + $t('Você estava sem mapas: um mapa de nível 1 foi deixado no acampamento.', 'You had no maps: a tier 1 map was left at camp.'); persist(); }
  S = null; rng = Math.random;
  migrateHero(HERO);
  const h = HERO, pts = talentPoints(h);
  if (campSel && campSel.from==='stash' && !h.stash[campSel.i]) campSel = null;
  if (campSel && campSel.from==='equip' && !h.equip[campSel.slot]) campSel = null;
  const runeN = Object.values(h.runes||{}).reduce((a,b)=>a+b,0);
  const tabs = [['exp',$t('Expedições', 'Expeditions')],['gear',$t('Equipamento', 'Gear')],['forge',$t('Forja', 'Forge')],['skl', $t(`Habilidades${runeN?` <span class="badge">${runeN}</span>`:''}`, `Skills${runeN?` <span class="badge">${runeN}</span>`:''}`)],['tal', $t(`Árvore${pts>0?` <span class="badge">${pts}</span>`:''}`, `Tree${pts>0?` <span class="badge">${pts}</span>`:''}`)],['skn', $t('Aparência', 'Appearance')],['atl', $t(`Atlas${h.actDone>=4 && atlasPoints(h)>0 ? ` <span class="badge">${atlasPoints(h)}</span>` : ''}`, `Atlas${h.actDone>=4 && atlasPoints(h)>0 ? ` <span class="badge">${atlasPoints(h)}</span>` : ''}`)],['gri', `${$t('Grimório', 'Grimoire')} <span class="muted small">${MATES.filter(m=>(h.grimoire||{})[m.id]).length}/${MATES.length}</span>`]]
    .map(([k,l]) => `<button class="tab ${campTab===k?'on':''}" type="button" role="tab" aria-selected="${campTab===k}" data-act="tab:${k}">${l}</button>`).join('');
  const body = campTab==='gear' ? campGear(h) : campTab==='forge' ? campForge(h) : campTab==='tal' ? campTree(h) : campTab==='skn' ? campSkins(h) : campTab==='skl' ? campSkills(h) : campTab==='gri' ? campGrimoire(h) : campTab==='atl' ? campAtlas(h) : campExpeditions(h);
  $('scrCamp').innerHTML = `
    <div class="camphead">
      <span class="g ${h.color} big">${GLYPH[h.cls]}</span>
      <div class="chname"><h2 class="sh">${esc(h.name)}</h2><span class="muted">${CLASSES[h.cls].name} · ${FACTIONS[h.color].name} · ${h.mode==='hardcore'?$t('Hardcore', 'Hardcore'):$t('Padrão', 'Standard')}</span></div>
      <div class="chlvl"><div class="vl"><span>${$t('Nível', 'Level')} ${h.level}</span><span>${h.xp} / ${xpNeed(h.level)}</span></div><div class="bar xp"><i style="width:${100*h.xp/xpNeed(h.level)}%"></i></div></div>
      <dl class="stats"><div><dt>${$t('Ouro', 'Gold')}</dt><dd>${h.gold}</dd></div><div><dt>${$t('Recorde', 'Record')}</dt><dd>${h.record||0}</dd></div><div><dt>${$t('Mapas', 'Maps')}</dt><dd>${h.maps.length}</dd></div><div><dt>${$t('Estilhaços', 'Shards')}</dt><dd>${h.riftShards||0}</dd></div><div><dt>${$t('Selos', 'Seals')}</dt><dd>${h.checkSeals||0}</dd></div><div><dt>${$t('Brasas', 'Embers')}</dt><dd>${h.embers||0}</dd></div></dl>
      <button class="ghost sm" type="button" data-act="switch">${$t('Trocar de herói', 'Switch hero')}</button>
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
  else if (act==='skillOn'){ barSkills(); if (!h.skills.includes(arg) && barSkills().filter(i => i!=='shift').length<BAR_MAX) h.skills.push(arg); }
  else if (act==='skillOff'){ barSkills(); if (h.skills.length>1) h.skills = h.skills.filter(id => id!==arg); }
  else if (act==='rune'){ const [id, r] = arg.split('|'); h.runes = h.runes||{}; h.skillRunes = h.skillRunes||{};
    if (h.runes[r]>0){ const old = h.skillRunes[id]; if (old) h.runes[old] = (h.runes[old]||0)+1; h.runes[r]--; h.skillRunes[id] = r; campNotice = $t(`${RUNES[r].name} encaixada em ${SKILLS[id].name}.`, `${RUNES[r].name} socketed into ${SKILLS[id].name}.`); } }
  else if (act==='unrune'){ const r = (h.skillRunes||{})[arg]; if (r){ h.runes[r] = (h.runes[r]||0)+1; delete h.skillRunes[arg]; } }
  else if (act==='torm') h.torment = Math.max(0, Math.min(h.tormentMax||0, (h.torment||0) + Number(arg)));
  else if (act==='unequip'){ if (h.stash.length<STASH_MAX && h.equip[arg]){ h.stash.push(h.equip[arg]); h.equip[arg] = null; campSel = {from:'stash', i:h.stash.length-1}; } }
  else if (act==='equip'){
    const it = h.stash[+arg];
    if (it){ h.stash.splice(+arg,1); const old = h.equip[it.slot]; if (old) h.stash.push(old); h.equip[it.slot] = it;
      campSel = {from:'equip', slot:it.slot}; campNotice = $t(`Equipado: ${esc(it.name)}${old ? `. ${esc(old.name)} foi para o baú` : ''}.`, `Equipped: ${esc(it.name)}${old ? `. ${esc(old.name)} went to the stash` : ''}.`); }
  }
  else if (act==='sell'){ const it = h.stash[+arg]; if (it){ h.stash.splice(+arg,1); h.gold += sellPrice(it); campSel = null; campNotice = $t(`Vendido: ${esc(it.name)} (+${sellPrice(it)} de ouro).`, `Sold: ${esc(it.name)} (+${sellPrice(it)} gold).`); } }
  else if (act==='sellcommons'){
    const c = h.stash.filter(it => it.rar==='common'), g = c.reduce((a,it)=>a+sellPrice(it),0);
    h.stash = h.stash.filter(it => it.rar!=='common'); h.gold += g; campSel = null;
    campNotice = $t(`${c.length} ${c.length===1?'item comum vendido':'itens comuns vendidos'} (+${g} de ouro).`, `${c.length} ${c.length===1?'common item sold':'common items sold'} (+${g} gold).`);
  }
  else if (act==='treeopen'){ openTree(arg); }
  else if (act==='skin'){ if (arg==='none') delete h.skin; else if (ASC[arg] && ASC[arg].cls===h.cls && skinUnlocked(h, ASC[arg])) h.skin = arg; }
  else if (act==='switch'){ persist(); showHeroes(); return; }
  else if (act==='act'){ startExpedition({kind:'campaign', act:+arg}); return; }
  else if (act==='abyss'){ startExpedition({kind:'abyss'}); return; }
  else if (act==='tutorial'){ startExpedition({kind:'tutorial'}); return; }
  else if (act==='uber'){ if (canUber(h)){ h.riftShards -= UBER_COST.shards; h.checkSeals -= UBER_COST.seals; persist(); startExpedition({kind:'uber', boss:arg||'queen'}); return; } }
  else if (act==='daily'){ startExpedition({kind:'daily'}); return; }
  else if (act==='pinnacle'){ if (canFallen(h)){ for (const id of BOSS_ORDER) h.crownFrags[id]--; persist(); startExpedition({kind:'pinnacle'}); return; } }
  else if (act==='forge'){ const [op, ai] = arg.split('|'); campNotice = forgeDo(h, op, +ai); }
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
      boardMessage($t('Fim da linhagem', 'End of the line'), $t(`${esc(name)} caiu para sempre. ${floorTitle()}.${deathRecap(run)}`, `${esc(name)} has fallen forever. ${floorTitle()}.${deathRecap(run)}`), $t('Escolher outro herói', 'Choose another hero'), () => showHeroes());
      return;
    }
    // normal mode: dying ends the expedition but you keep everything you picked up
    persist();
    const recap = deathRecap(run);
    boardMessage($t(`${c.art} ${c.name} caiu`, `The ${c.name} has fallen`), $t(`${floorTitle()}. Você volta ao acampamento com tudo o que pegou: itens, ouro, mapas, runas e experiência (+${run.xpFound}). Só o que ficou no chão se perde.${recap}`, `${floorTitle()}. You return to camp with everything you picked up: items, gold, maps, runes and experience (+${run.xpFound}). Only what was left on the ground is lost.${recap}`), $t('Voltar ao acampamento', 'Back to camp'),
      () => showCamp(recap ? `${$t(`${c.name} caiu em ${floorTitle()}.`, `${c.name} fell on ${floorTitle()}.`)}<details class="rdet"><summary>${$t('Como você morreu', 'How you died')}</summary>${recap}</details>` : ''));
    return;
  }
  if (ex.kind==='tutorial'){ HERO.tutorialDone = true; persist(); showCamp(reason==='abandon' ? $t('Treino interrompido. Você pode refazê-lo pela aba Expedições.', 'Training interrupted. You can redo it from the Expeditions tab.') : $t(`${esc(HERO.name)} terminou o treino e chega ao acampamento à beira do abismo.`, `${esc(HERO.name)} finished training and arrives at the camp on the edge of the abyss.`)); return; }
  if (reason==='abandon'){
    persist();
    showCamp(ex.kind==='daily' ? $t('Você desistiu do desafio do dia.', 'You gave up on the daily challenge.') : $t(`Expedição encerrada. Você trouxe tudo o que pegou (+${run.goldFound} de ouro, +${run.xpFound} de experiência).`, `Expedition over. You brought back everything you picked up (+${run.goldFound} gold, +${run.xpFound} experience).`));
    return;
  }
  persist();
  if (reason==='fail' || reason==='death'){
    boardMessage($t('Desafio falhou', 'Challenge failed'), $t(`Você não venceu a tempo. Pode tentar de novo quantas vezes quiser hoje.`, `You did not win in time. You can try again as many times as you like today.`), $t('Voltar ao acampamento', 'Back to camp'), () => showCamp(''));
    return;
  }
  showCamp($t(`Expedição encerrada: +${run.goldFound} de ouro, +${run.xpFound} de experiência.`, `Expedition over: +${run.goldFound} gold, +${run.xpFound} experience.`));
}
async function quitExpedition(){
  if (!S || !S.walls || S.phase!=='player') return;
  const daily = S.exp.kind==='daily';
  const v = await openModal({title:$t('Desistir da expedição?', 'Abandon the expedition?'),
    body:`<p class="mtext">${daily ? $t('Você volta ao acampamento e pode tentar o desafio de novo.', 'You return to camp and can try the challenge again.') : $t(`Você volta ao acampamento com tudo o que pegou nesta expedição (+${S.xpFound} de experiência). O que ficou no chão se perde.${HERO.mode==='hardcore' ? ' No Hardcore, desistir não mata o herói.' : ''}`, `You return to camp with everything you picked up on this expedition (+${S.xpFound} experience). What was left on the ground is lost.${HERO.mode==='hardcore' ? ' In Hardcore, abandoning does not kill the hero.' : ''}`)}</p>`,
    actions:[{label:$t('Desistir', 'Abandon'), primary:true, value:'quit'}, {label:$t('Continuar jogando', 'Keep playing'), value:'stay'}]});
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
  const rows = recent.map(h => `<li><span class="rt">T${h.turn}</span><span class="rm">${esc(src(h))}</span><span class="rd">−${h.taken}${h.absorbed ? ` <small>(+${h.absorbed} ${$t('no escudo)', 'on the shield)')}</small>` : ''}</span><span class="rh">${Math.max(0,h.hpBefore)} → ${Math.max(0,h.hpAfter)}</span></li>`).join('');
  const marked = recent.filter(h => h.danger).length;
  const tip = marked ? $t(`${marked} ${marked===1?'golpe caiu':'golpes caíram'} numa casa que estava marcada em vermelho no seu turno.`, `${marked} ${marked===1?'blow landed':'blows landed'} on a square that was marked red during your turn.`) : $t('Nenhum golpe caiu em casa marcada: foi dano de área, efeito do terreno ou de afixo.', 'No blow landed on a marked square: it was area damage, a terrain effect or an affix.');
  return `<div class="recap"><p class="rk">${$t('Golpe final:', 'Final blow:')} <b>${esc(src(last))}</b> (${last.taken} ${$t('de dano)', 'damage)')}</p>
    <ol>${rows}</ol>
    <p class="rs">${$t('Nos últimos', 'In the last')} ${lastTurn - recent[0].turn + 1} ${$t('turnos:', 'turns:')} ${total} ${$t('de dano. Mais perigoso:', 'damage. Most dangerous:')} ${top.slice(0,2).map(([k,v]) => `${esc(k)} (${v})`).join(', ')}.</p>
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
    await showRelics(relics, $t('Recompensa do desafio', 'Challenge reward'));
  }
  endExpedition('return');
}
function dailyFail(){ S.dead = true; endExpedition('fail'); }
async function stairsChoice(){
  // training yard: the stairs always lead back to camp
  if (S.exp.kind==='tutorial'){
    await openModal({title:$t('Treino concluído', 'Training complete'), body:$t('<p class="mtext">Você aprendeu o básico: mover, atacar, desviar das casas vermelhas, usar habilidades e descer a escada.</p>', '<p class="mtext">You learned the basics: moving, attacking, dodging the red squares, using skills and taking the stairs.</p>'), actions:[{label:$t('Ir ao acampamento', 'Go to camp'), primary:true, value:'camp'}]});
    endExpedition('return'); return;
  }
  const last = isLastFloor(), opts = [];
  if (!last) opts.push({label: S.exp.kind==='campaign' && S.af===3 ? $t(`Seguir para o Ato ${S.act+2}`, `Continue to Act ${S.act+2}`) : $t('Descer', 'Descend'), primary:true, value:'down'});
  opts.push({label:$t('Voltar ao acampamento', 'Back to camp'), primary:last, value:'camp'});
  const text = last ? $t('Você completou esta expedição.', 'You completed this expedition.') : $t('Descer continua a expedição. Voltar guarda tudo o que você encontrou até aqui.', 'Descending continues the expedition. Going back keeps everything you have found so far.');
  const v = await openModal({title: last ? $t('Expedição completa', 'Expedition complete') : $t('Escada', 'Stairs'), body:`<p class="mtext">${text}</p><p class="mtext muted">${$t('Nesta expedição: +', 'This expedition: +')}${S.goldFound} ${$t('de ouro, +', 'gold, +')}${S.xpFound} ${$t('de experiência.', 'experience.')}</p>`, actions:opts});
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
  if (!it) return `<div class="eqmini"><span class="meta">${$t('Equipado em', 'Equipped in')} ${SLOTS[slot].label}</span>${$t('Espaço vazio', 'Empty slot')}</div>`;
  return `<div class="eqmini"><span class="meta">${$t('Equipado em', 'Equipped in')} ${SLOTS[slot].label}</span>${itemBlock(it)}</div>`;
}
function itemCard(it, title){
  if (!it) return `<div class="card"><div class="meta">${title}</div><div class="nm" style="color:#6d6156">${$t('Espaço vazio', 'Empty slot')}</div></div>`;
  return `<div class="card"><div class="meta">${title} · ${RAR[it.rar].label} · ${SLOTS[it.slot].label}${it.ilvl ? $t(` · nível ${it.ilvl}`, ` · level ${it.ilvl}`) : ''}${it.legacy ? $t(' · herança', ' · heirloom') : ''}</div>${itemBlock(it)}</div>`;
}
function equipItem(it){
  const before = stats();
  const old = S.equip[it.slot];
  S.equip[it.slot] = it;
  if (old){ if (HERO.stash.length<STASH_MAX){ HERO.stash.push(old); log($t(`${old.name} foi para o baú.`, `${old.name} went to the stash.`)); } else log($t(`${old.name} foi destruído (baú cheio).`, `${old.name} was destroyed (stash full).`)); }
  const after = stats();
  S.player.hp = Math.max(1, Math.min(after.hp, S.player.hp+(after.hp-before.hp)));
  if (after.shield>before.shield) S.shield += after.shield-before.shield;
  log($t(`Equipado: ${it.name}.`, `Equipped: ${it.name}.`));
}
function stashItem(it){ if (HERO.stash.length>=STASH_MAX) return false; HERO.stash.push(it); log($t(`${it.name} foi para o baú.`, `${it.name} went to the stash.`)); return true; }
async function showLoot(it){
  const full = HERO.stash.length>=STASH_MAX;
  const v = await openModal({title:$t('Saque', 'Loot'), body:`<div class="cmp">${itemCard(it,$t('Encontrado', 'Found'))}${itemCard(S.equip[it.slot],$t('Equipado', 'Equipped'))}</div><h4 class="dh">${$t('Se equipar', 'If equipped')}</h4>${diffHtml(swapDiff(HERO, it))}`,
    note:$t('Ao equipar, o item atual vai para o baú. Itens desta expedição só ficam seus se você voltar vivo ao acampamento.', 'When you equip it, the current item goes to the stash. Items from this expedition are only yours if you return to camp alive.'),
    actions:[{label:$t('Equipar', 'Equip'), primary:true, value:'equip'}, {label:$t(`Guardar no baú${full?' (cheio)':''}`, `Move to stash${full?' (full)':''}`), value:'stash', disabled:full}, {label:$t('Deixar', 'Leave it'), value:'leave'}]});
  if (v==='equip') equipItem(it); else if (v==='stash') stashItem(it); else log($t(`Você deixou ${it.name} para trás.`, `You left ${it.name} behind.`));
  updateUI();
}
async function showRelics(relics, title){
  const full = HERO.stash.length>=STASH_MAX;
  const body = `<div class="cmp">${relics.map((it,i) => `<div class="relic">${itemCard(it, $t('Opção ', 'Option')+(i+1))}
    ${equippedMini(it.slot)}
    <div class="row"><button class="primary sm" type="button" data-act="equip:${i}">${$t('Equipar', 'Equip')}</button><button class="ghost sm" type="button" data-act="stash:${i}" ${full?'disabled':''}>${$t('Guardar', 'Keep')}</button></div></div>`).join('')}</div>`;
  const v = await openModal({title: title || $t('Relíquias do chefe', 'Boss relics'), body, minimizable:true, note:$t(`Escolha uma. ${relics.length>2 ? 'As outras se perdem' : 'A outra se perde'}. Minimizar deixa ver o tabuleiro e o painel.`, `Choose one. ${relics.length>2 ? 'The others are lost' : 'The other is lost'}. Minimizing lets you see the board and the panel.`), actions:[{label: relics.length>2 ? $t('Recusar todas', 'Refuse all') : $t('Recusar as duas', 'Refuse both'), value:'none'}]});
  const [act, i] = v.split(':');
  if (act==='equip') equipItem(relics[+i]); else if (act==='stash') stashItem(relics[+i]); else log($t('Você recusou as relíquias.', 'You refused the relics.'));
  updateUI();
}
async function showShop(en){
  for (;;){
    const full = HERO.stash.length>=STASH_MAX;
    const body = `<p class="mtext">${$t('Ouro:', 'Gold:')} <b>${HERO.gold}</b>${$t('. Compras vão para o baú.', '. Purchases go to the stash.')}</p><div class="cmp">${en.stock.map((it,i) => it ? `<div class="relic">${itemCard(it,$t('À venda', 'For sale'))}
      <button class="primary sm" type="button" data-act="buy:${i}" ${HERO.gold<itemPrice(it)||full?'disabled':''}>${$t('Comprar por', 'Buy for')} ${itemPrice(it)}</button></div>` : '').join('')}</div>`;
    const v = await openModal({title:$t('Mercador', 'Merchant'), body, actions:[{label:$t(`Frasco de vida (15)`, `Health flask (15)`), value:'potion', disabled:HERO.gold<15}, {label:$t('Sair', 'Leave'), primary:true, value:'leave'}]});
    if (v==='leave') break;
    if (v==='potion'){ HERO.gold -= 15; heal(POTION_HEAL); log($t('Você comprou um frasco de vida.', 'You bought a health flask.')); continue; }
    const i = +v.split(':')[1], it = en.stock[i];
    if (it && HERO.gold>=itemPrice(it) && stashItem(it)){ HERO.gold -= itemPrice(it); en.stock[i] = null; }
  }
  updateUI();
}
async function openEntry(en){
  if (en.relics) await showRelics(en.relics);
  else if (en.merchant) await showShop(en);
  else if (en.item){ sfx('loot', {rar: en.item.rar}); await showLoot(en.item); }
  else if (en.frozen) await frozenPlay(en);
}

/* ---------- Banner ---------- */
let bannerTimer = null;
const hideBanner = () => { const b = $('banner'); if (b && !b.hidden){ b.hidden = true; clearTimeout(bannerTimer); } };
document.addEventListener('pointerdown', hideBanner); document.addEventListener('keydown', hideBanner);
function showBanner(title, sub){
  const b = $('banner');
  $('bnTitle').textContent = title; $('bnSub').textContent = sub || '';
  const ms = Math.max(2000, Math.min(3200, 1700 + 16*((title||'').length + (sub||'').length)));   // short on purpose; any click or key closes it
  b.style.animationDuration = ms + 'ms';
  b.hidden = false; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { b.hidden = true; }, reduce ? Math.max(2500, ms*.7) : ms);
}

/* ---------- HUD ---------- */
function defaultHint(){
  if (S && S.moveOnly) return $t('Fuga Real: esta ação extra só pode mover, sem atacar nem usar habilidades.', 'Royal Escape: this extra action can only move, without attacking or using skills.');
  const base = S ? CLASSES[S.cls].hint : '';
  return base + $t(' Casas vermelhas serão atacadas quando o turno acabar. O triângulo amarelo marca quem está na linha de fogo.', ' Red squares will be attacked when the turn ends. The yellow triangle marks who is in the line of fire.') + (S && S.biome ? ' ' + BIOMES[S.biome].rule : '');
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
let shiftDown = false;
function renderTip(){
  const tip = $('tip');
  if (!S || !S.walls || !hover || !tipReady || S.phase==='over' || S.dead){ tip.hidden = true; return; }
  const [x,y] = hover, e = enemyAt(x,y), a = allyAt(x,y);
  const item = !e && !a ? S.items.find(i=>i.x===x&&i.y===y) : null;
  let html = '';
  if (e && !intentVisible(e)){
    html += `<div class="tr">${$t('Algo se move na névoa.', 'Something moves in the fog.')}</div>`;
  } else if (e){
    const full = shiftDown;   // Shift shows the full text; otherwise short chips
    const pv = attackPreview(e);
    const hpPct = 100*Math.max(0,e.hp)/e.maxHp, cut = pv ? Math.min(hpPct, 100*pv.dmg/e.maxHp) : 0;
    html += `<div class="tn ${e.boss?'boss':e.elite?'elite':''}">${enemyName(e)}</div>`;
    html += `<div class="tbar"><i style="width:${hpPct}%"></i>${pv?`<b style="left:${hpPct-cut}%;width:${cut}%"></b>`:''}</div>`;
    html += `<div class="tr">${Math.max(0,e.hp)}/${e.maxHp} ${$t('de vida', 'health')}${e.shield>0?$t(` · escudo ${e.shield}`, ` · shield ${e.shield}`):''} ${$t('· bate', '· hits')} ${enemyHit(e)}${e.dtype && e.dtype!=='phys' ? $t(' de ', ' ')+DTYPES[e.dtype].n : ''}${isWater(e.x,e.y)?$t(' (na água)', ' (in water)'):''}${['B','R','Q'].includes(e.type) && !e.boss ? $t(` · alcance ${attackReach(e)} casas`, ` · reach ${attackReach(e)} squares`) : ''}</div>`;
    if (pv){
      const stay = (S.cls==='R'||S.cls==='Q') ? $t('você para ao lado', 'you stop next to it') : $t('você fica no lugar', 'you stay in place');
      html += `<div class="to ${pv.kills?'kill':''}">${$t('Seu golpe: -', 'Your blow: -')}${pv.raw}${S.color==='b'&&e.moved?$t(' (emboscada)', ' (ambush)'):''} · ${pv.kills ? $t('mata, você ocupa a casa', 'kills, you take the square') : $t('sobrevive, ', 'survives,')+stay}</div>`;
    }
    html += `<div class="tr">${intentText(e)}</div>`;
    if (e.boss && full) html += `<div class="tr">${e.bossId==='fallen' ? BOSSES.fallen['p'+(e.fphase||1)] : e.phase===2 ? BOSSES[e.origId==='pawn'&&e.bossId==='queen'?'queen':e.bossId].p2 : BOSSES[e.bossId].p1}</div>`;
    // compact: one chip per modifier (colored like its badge on the board); Shift expands to the full descriptions
    const chip = (m, label) => { const ic = MOD_ICON[m]; return `<span class="mchip" style="--mc:${ic ? ic[0] : '#cdbb9c'}">${ic ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ic[1]}" fill="${ic[2] ? ic[0]+'55' : 'none'}"/></svg>` : ''}${label}</span>`; };
    if (e.mods.length && !full) html += `<div class="chips2">${e.mods.map(m => chip(m, MODS[m].n)).join('')}</div>`;
    else for (const m of e.mods) html += `<div class="tm"><b>${MODS[m].n}:</b> ${MODS[m].d}</div>`;
    const tags = [];
    if (!full){
      if (e.frozenPiece && S.timeStop>0) tags.push([$t('Congelado', 'Frozen'), '#cfe6f5']); else if (e.marked) tags.push([$t('Marcado', 'Marked'), '#e3b456']); else if (e.armyPiece) tags.push([$t('Sem saque', 'No loot'), '#a89b87']);
      if (e.role) tags.push([{protector:$t('Protetor', 'Protector'), artillery:$t('Artilheiro', 'Artillery'), guard:$t('Guarda', 'Guard')}[e.role], '#a9bfd6']);
      if (e.herald) tags.push([$t('Arauto', 'Herald'), '#ff4a3a']); if (e.rival) tags.push([$t('Rival', 'Rival'), '#8fd18a']); if (e.rift) tags.push([$t('Cria da Fenda', 'Rift Spawn'), '#b48cff']);
      for (const el in (e.res||{})) tags.push([`${DTYPES[el].n} ${e.res[el]}%`, DTYPES[el].c || '#cdbb9c']);
      if (e.judged) tags.push([$t('Julgado +50%', 'Judged +50%'), '#f0d68c']);
      if (tags.length) html += `<div class="chips2">${tags.map(([l,c]) => `<span class="mchip" style="--mc:${c}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="${c}" stroke="none"/></svg>${l}</span>`).join('')}</div>`;
    }
    if (!full){}
    else if (e.frozenPiece && S.timeStop>0) html += `<div class="tm"><b>${$t('Congelado:', 'Frozen:')}</b> ${$t('não age e recebe +50% de dano. Estilhace-o para marcá-lo: ele volta quando o gelo derreter e só então pode deixar saque', 'does not act and takes +50% damage. Shatter it to mark it: it comes back when the ice melts and only then can it drop loot')}${e.type==='K' ? $t(' (o Rei marcado dá um Selo de Xeque)', ' (the marked King gives a Check Seal)') : ''}.</div>`;
    else if (e.marked) html += `<div class="tm"><b>${$t('Marcado:', 'Marked:')}</b> ${$t('você o estilhaçou; ao morrer pode deixar saque', 'you shattered it; on death it can drop loot')}${e.type==='K' ? $t(' e dá um Selo de Xeque', ' and gives a Check Seal') : ''}.</div>`;
    else if (e.armyPiece) html += `<div class="tm"><b>${$t('Exército:', 'Army:')}</b> ${$t('não foi estilhaçado, não deixa saque.', 'was not shattered, drops no loot.')}</div>`;
    if (full && e.role==='protector') html += `<div class="tm"><b>${$t('Protetor:', 'Protector:')}</b> ${$t('no fim de cada turno inimigo dá', 'at the end of each enemy turn gives')} ${protectorShield()} ${$t('de escudo a cada peça colada nele. Derrube-o primeiro.', 'shield to every piece next to it. Take it down first.')}</div>`;
    if (full && e.role==='artillery') html += `<div class="tm"><b>${$t('Artilheiro:', 'Artillery:')}</b> ${$t('fica atrás do Protetor. Como no xadrez, só atira com a linha livre; qualquer peça no caminho bloqueia o tiro.', 'stays behind the Protector. As in chess, it only fires with a clear line; any piece in the way blocks the shot.')}</div>`;
    if (full && e.role==='guard') html += `<div class="tm"><b>${$t('Guarda:', 'Guard:')}</b> ${$t('protege a formação pela frente.', 'protects the formation from the front.')}</div>`;
    if (full && e.herald) html += `<div class="tm"><b>${$t('Arauto da Maré:', 'Herald of the Tide:')}</b> ${$t('deixa 15 brasas, um item raro e uma runa', 'drops 15 embers, a rare item and a rune')}</div>`;
    if (full && e.rival) html += `<div class="tm"><b>${$t('Seu rival:', 'Your rival:')}</b> ${$t('nível', 'level')} ${heroRival(HERO).tier}${$t('. Deixa o equipamento dele. Se ele te matar, fica mais forte.', '. Drops their gear. If they kill you, they grow stronger.')}</div>`;
    if (full && e.rift) html += `<div class="tm"><b>${$t('Cria da Fenda:', 'Rift Spawn:')}</b> ${$t('deixa Estilhaços da Fenda e some quando a fenda fecha', 'drops Rift Shards and vanishes when the rift closes')}</div>`;
    if (full) for (const el in (e.res||{})) html += `<div class="tm"><b>${$t('Resistente:', 'Resistant:')}</b> ${e.res[el]}% ${$t('a', 'to')} ${DTYPES[el].n}</div>`;
    if (full && e.judged) html += `<div class="tm"><b>${$t('Julgado:', 'Judged:')}</b> ${$t('recebe +50% de dano', 'takes +50% damage')}</div>`;
    if (e.boss && S.bossRelics && full) html += `<div class="tl">${$t('Usa', 'Wields')} <span class="rc-${S.bossRelics[0].rar}">${S.bossRelics[0].name}</span>${$t('. Vença e escolha entre ela e', '. Win and choose between it and')} <span class="rc-${S.bossRelics[1].rar}">${S.bossRelics[1].name}</span>.</div>`;
    const ff = attackersOf(x,y).filter(o=>o!==e && intentVisible(o));
    if (ff.length) html += `<div class="tw">${$t('Na linha de fogo:', 'In the line of fire:')} ${ff.map(enemyName).join(', ')}</div>`;
    if (!full && (e.mods.length || tags.length || e.boss)) html += `<div class="thint">${$t('Segure Shift para os detalhes', 'Hold Shift for details')}</div>`;
  } else if (a){
    html += `<div class="tn ally">${a.raised ? $t(`${EDEF[a.type].name} morto-vivo`, `Undead ${EDEF[a.type].name}`) : a.type==='P'?$t('Peão', 'Allied Pawn'):$t('Rainha', 'Allied Queen')}${a.raised ? '' : $t(' aliado', '')}</div><div class="tbar"><i class="ally" style="width:${100*a.hp/a.maxHp}%"></i></div><div class="tr">${a.hp}/${a.maxHp} ${$t('de vida · bate', 'health · hits')} ${allyDmg(a)}</div>`;
    if (S.dangerSeen.has(key(x,y))) html += `<div class="tw">${$t('Vai ser atacado', 'Will be attacked')}</div>`;
  } else if (item){
    if (item.potion) html += `<div class="tn" style="color:#8fd18a">${$t('Frasco de vida', 'Health flask')}</div><div class="tr">${$t('Cura', 'Heals')} ${POTION_HEAL} ${$t('ao pisar', 'when stepped on')}</div>`;
    else if (item.relics) html += `<div class="tn rc-legend">${$t('Relíquias do chefe', 'Boss relics')}</div><div class="tr">${item.relics.map(r=>r.name).join(' ou ')}</div>`;
    else if (item.chest) html += `<div class="tn" style="color:#e3b456">${$t('Baú', 'Chest')}</div><div class="tr">${$t('Ouro e um item, quase sempre raro', 'Gold and an item, almost always rare')}</div>`;
    else if (item.shrine) html += `<div class="tn" style="color:#f0d68c">${item.shrine.name}</div><div class="tr">${item.shrine.desc}</div>`;
    else if (item.merchant) html += `<div class="tn" style="color:#e3b456">${$t('Mercador', 'Merchant')}</div><div class="tr">${$t('Pise aqui para comprar com ouro', 'Step here to buy with gold')}</div>`;
    else if (item.mapItem) html += `<div class="tn rc-legend">${$t('Mapa', 'Map')}</div><div class="tr">${mapName(item.mapItem)}</div>`;
    else if (item.frozen){ const P = mateById(item.frozen); html += `<div class="tn" style="color:#cfe6f5">${$t('Partida Congelada', 'Frozen Match')}</div><div class="tr">${P.problem ? $t(`Problema: mate em ${P.n} ${P.n===1?'lance':'lances'}.${P.n>=3 ? ' Paga em dobro.' : ''}`, `Puzzle: mate in ${P.n} ${P.n===1?'move':'moves'}.${P.n>=3 ? ' Pays double.' : ''}`) : $t(`Padrão de mate em ${P.n}. ${(HERO.grimoire||{})[item.frozen] ? 'Já aprendido.' : 'Novo: ensina um poder do Grimório.'}`, `Mate pattern in ${P.n}. ${(HERO.grimoire||{})[item.frozen] ? 'Already learned.' : 'New: teaches a Grimoire power.'}`)}</div><div class="tr"><b>${$t('Pise nesta casa para jogar.', 'Step on this square to play.')}</b> ${$t('Se falhar, o exército desperta.', 'If you fail, the army awakens.')}</div>`; }
    else if (item.currency) html += `<div class="tn" style="color:${CURRENCY[item.currency].c}">${CURRENCY[item.currency].name}</div><div class="tr">${CURRENCY[item.currency].d} ${$t('Use no acampamento, num mapa.', 'Use it on a map at camp.')}</div>`;
    else if (item.tideChest) html += `<div class="tn" style="color:#ff6b4a">${$t('Baú Tormentoso', 'Torment Chest')}</div><div class="tr">${$t('Custa', 'Costs')} ${tideCost()} ${$t('Brasas de Sangue (você tem', 'Blood Embers (you have')} ${HERO.embers||0}${$t('). Item raro garantido, 25% de chance de único, 30% de runa.', '). Guaranteed rare item, 25% chance of a unique, 30% of a rune.')}</div>`;
    else if (item.frozenArmy) html += `<div class="tn" style="color:#cfe6f5">${$t('Exército Congelado', 'Frozen Army')}</div><div class="tr">${$t('Pise para revelar um exército novo, congelado numa abertura clássica. Você tem', 'Step on it to reveal a new army, frozen in a classic opening. You have')} ${TIME_STOP} ${$t('turnos para estilhaçar peças (+50% de dano). Quando o gelo derrete, todas acordam e as estilhaçadas voltam à vida: só elas deixam saque, e o Rei estilhaçado dá um Selo de Xeque.', 'turns to shatter pieces (+50% damage). When the ice melts, they all wake up and the shattered ones come back to life: only they drop loot, and the shattered King gives a Check Seal.')}</div>`;
    else if (item.riftGate) html += `<div class="tn" style="color:#b48cff">${$t('Fenda', 'Rift')}</div><div class="tr"><b>${$t('Pise nesta casa para abri-la:', 'Step on this square to open it:')}</b> ${$t('5 turnos de ondas crescentes de crias, que deixam Estilhaços. A cada 3 abates perto dela, +1 turno (até +3).', '5 turns of growing waves of spawn, which drop Shards. Every 3 kills near it, +1 turn (up to +3).')}</div>`;
    else if (item.rune) html += `<div class="tn" style="color:#c9a0ff">${RUNES[item.rune].name}</div><div class="tr">${RUNES[item.rune].d}</div><div class="tr">${$t('Pise para pegar. Encaixe numa habilidade no acampamento.', 'Step on it to pick it up. Socket it into a skill at camp.')}</div>`;
    else html += `<div class="tn rc-${item.item.rar}">${esc(item.item.name)}</div><div class="tr">${RAR[item.item.rar].label} · ${SLOTS[item.item.slot].label} ${$t('· nível', '· level')} ${item.item.ilvl||1}</div><ul class="tafx">${item.item.affixes.map(affixLine).join('')}</ul>${diffHtml(swapDiff(HERO, item.item))}`;
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
  if (e && !intentVisible(e)) parts.push($t('Algo se move na névoa.', 'Something moves in the fog.'));
  else if (e){
    if (e.boss && e.intent && e.intent.recover) parts.push($t('Exposto: recuperando-se do ataque, não ataca neste turno e recebe +50% de dano. Bata agora!', 'Exposed: recovering from its attack, it does not attack this turn and takes +50% damage. Hit it now!'));
    if (e.boss) parts.push($t('Chefe: depois de cada ataque fica exposto por 1 turno (2 depois de um golpe especial ou em estrela). Deixa duas relíquias únicas para você escolher uma.', 'Boss: after each attack it is exposed for 1 turn (2 after a special or star attack). Drops two unique relics for you to choose one.'));
    else if (e.elite) parts.push($t('Inimigo de elite: sempre deixa um item, quase sempre raro.', 'Elite enemy: always drops an item, almost always rare.'));
    if (S.cls==='B' && (e.x+e.y)%2 !== (S.player.x+S.player.y)%2) parts.push($t('Está numa casa de outra cor: suas diagonais nunca o alcançam. Use Troca de Cor.', 'It is on a square of the other color: your diagonals never reach it. Use Color Shift.'));
  } else if (allyAt(x,y)) parts.push($t('Aliados agem depois do seu turno. Clique para trocar de lugar.', 'Allies act after your turn. Click to swap places.'));
  else if (S.stairs && S.stairs.x===x && S.stairs.y===y) parts.push($t('Escada: descer ou voltar ao acampamento.', 'Stairs: descend or go back to camp.'));
  else if (isPlayer(x,y)) parts.push($t('Você.', 'You.'));
  const t = terrainAt(x,y);
  if (t==='pit') parts.push($t('Fosso: ninguém pisa aqui, mas ataques em linha passam por cima. Inimigo empurrado para cá cai e morre.', 'Pit: no one steps here, but line attacks pass over it. An enemy pushed in falls and dies.'));
  if (t==='grave') parts.push(S.rise && S.rise[0]===x && S.rise[1]===y ? $t('Túmulo se abrindo: um esqueleto se ergue no fim do turno, se a casa estiver livre.', 'Grave opening: a skeleton rises at the end of the turn, if the square is free.') : $t('Túmulo: de tempos em tempos um esqueleto se ergue daqui. Ficar em cima impede.', 'Grave: from time to time a skeleton rises from here. Standing on it prevents that.'));
  if (t==='water') parts.push($t('Água: quem ataca daqui causa 1 de dano a menos. Ninguém desliza através dela.', 'Water: attacking from here deals 1 less damage. Nothing slides through it.'));
  if (t==='lava') parts.push($t('Lava: quem termina o turno aqui leva 2 de dano.', 'Lava: whoever ends the turn here takes 2 damage.'));
  if (t==='blood') parts.push($t('Poça de Sangue: inimigo em cima causa +1 de dano e se cura 1 por turno, mas matá-lo aqui dá o dobro de Brasas.', 'Blood Pool: an enemy on it deals +1 damage and heals 1 per turn, but killing it here gives double Embers.'));
  if (S.tideRise && S.tideRise.some(([a,b]) => a===x && b===y)) parts.push($t('A Maré vai subir aqui no fim do turno: vira Poça de Sangue.', 'The Tide will rise here at the end of the turn: it becomes a Blood Pool.'));
  if (S.bloodRain && S.bloodRain.sq.some(([a,b]) => a===x && b===y)) parts.push($t('Chuva de Sangue: cai aqui no fim do turno.', 'Blood Rain: falls here at the end of the turn.'));
  if (t==='ice') parts.push($t('Gelo: quem pisa aqui escorrega na mesma direção até sair do gelo ou bater em algo.', 'Ice: whoever steps here slides in the same direction until it leaves the ice or hits something.'));
  if (S.burn.has(key(x,y))) parts.push($t('Brasas: quem terminar o turno aqui leva 2 de dano.', 'Embers: whoever ends the turn here takes 2 damage.'));
  if (S.clock && S.clock.sq.some(([a,b]) => a===x && b===y)) parts.push(CLOCK_TEXT[S.clock.kind]);
  if (S.enemies.some(o => o.intent && o.intent.mark && o.intent.mark[0]===x && o.intent.mark[1]===y)) parts.push($t('Casa marcada pelo chefe: quem estiver aqui no fim do turno leva o golpe.', 'Square marked by the boss: whoever is here at the end of the turn takes the blow.'));
  if (isWall(x,y)) parts.push(S.env && S.env.wall[0]===x && S.env.wall[1]===y ? $t('Pilar instável: vai explodir no fim do turno.', 'Unstable pillar: it will explode at the end of the turn.') : $t(`${({swamp:'Árvore morta', cathedral:'Coluna'})[S.biome]||'Pilar'}. Bloqueia ataques em linha.`, `${({swamp:'Dead tree', cathedral:'Column'})[S.biome]||'Pillar'}. Blocks line attacks.`));
  if (!e && S.dangerSeen.has(key(x,y))) parts.push($t('Esta casa será atacada no fim do turno.', 'This square will be attacked at the end of the turn.'));
  if (S.threatNext && S.threatNext.has(key(x,y)) && !S.dangerSeen.has(key(x,y))) parts.push($t('Visão tática: ameaçada no turno seguinte.', 'Tactical sight: threatened next turn.'));
  if (S.mode==='quake' && SKILLS[S.mode].targets().some(([sx,sy])=>sx===x&&sy===y)) parts.push($t(`Pousar aqui causa ${st.dmg+st.darkQuake} a cada vizinho.`, `Landing here deals ${st.dmg+st.darkQuake} to each neighbor.`));
  h.textContent = parts.length ? parts.join(' ') : defaultHint();
}
function affixList(it){ return `<ul>${it.affixes.map(a=>`<li class="${AFX[a.k].rule?'rule':''}">${AFX[a.k].t(a.v)}</li>`).join('')}</ul>`; }
/* ---------- Boss sheet (left of the board) ---------- */
const SPECIAL_DESC = {
  queen:$t('Atinge a sua casa e 3 casas em cada direção reta a partir dela.', 'Hits your square and 3 squares in each straight direction from it.'),
  knight:$t('Atinge a sua casa e todas as vizinhas.', 'Hits your square and all its neighbors.'),
  twins:$t('Atinge a fileira e a coluna inteiras da torre, até um pilar. As duas se revezam.', 'Hits the rook\'s whole rank and file, up to a pillar. The two take turns.'),
  pawn:$t('Atinge as duas fileiras inteiras à frente dele.', 'Hits the two full ranks in front of it.'),
  mirror:$t('Atinge todas as casas para onde você poderia se mover agora.', 'Hits every square you could move to right now.')};
function bossObjectiveRow(b, p2, bosses){
  const id = b.bossId;
  if (id==='queen' && b.origId==='queen'){
    if (!p2) return `<div class="bi-row"><b>${$t('Objetivo na fase 2', 'Phase 2 objective')}</b>${$t('Guarda Real: com 3 ou mais peões vivos, ela recebe metade do dano. Mate os peões.', 'Royal Guard: with 3 or more pawns alive, she takes half damage. Kill the pawns.')}</div>`;
    const g = queenGuards();
    return `<div class="bi-row"><b>${$t('Guarda Real ·', 'Royal Guard ·')} ${g>=3 ? $t('<span class="now">protegida</span>', '<span class="now">protected</span>') : $t('<span class="when">exposta</span>', '<span class="when">exposed</span>')}</b>${$t('Com 3 ou mais peões vivos, recebe metade do dano. Peões vivos:', 'With 3 or more pawns alive, takes half damage. Pawns alive:')} ${g}.</div>`;
  }
  if (id==='knight'){
    if (!p2) return `<div class="bi-row"><b>${$t('Objetivo na fase 2', 'Phase 2 objective')}</b>${$t('Ele foge quando é atingido. Depois de 3 fugas fica exausto e vulnerável.', 'It flees when hit. After 3 escapes it is exhausted and vulnerable.')}</div>`;
    return b.exhausted ? `<div class="bi-row"><b>${$t('Exausto ·', 'Exhausted ·')} <span class="now">${$t('ataque agora', 'attack now')}</span></b>${$t('Não foge e recebe +50% de dano.', 'Does not flee and takes +50% damage.')}</div>`
      : `<div class="bi-row"><b>${$t('Exaustão ·', 'Exhaustion ·')} ${b.escapes||0} ${$t('de 3 fugas', 'of 3 escapes')}</b>${$t('Na terceira fuga fica exausto por 2 turnos: não foge e recebe +50% de dano.', 'On the third escape it is exhausted for 2 turns: it does not flee and takes +50% damage.')}</div>`;
  }
  if (id==='twins') return b===bosses[0] ? `<div class="bi-row"><b>${$t('Objetivo', 'Objective')}</b>${$t('Derrube as duas no mesmo turno. Se uma cair e a outra sobreviver ao turno, a sobrevivente enlouquece (dano dobrado).', 'Bring both down on the same turn. If one falls and the other survives the turn, the survivor goes berserk (double damage).')}</div>` : '';
  if (id==='pawn') return `<div class="bi-row"><b>${$t('Objetivo · faltam', 'Objective · remaining')} ${Math.max(0, H-1-b.y)} ${$t('fileiras', 'ranks')}</b>${$t('Mate-o antes que chegue à última fileira, ou ele vira rainha com vida cheia.', 'Kill it before it reaches the last rank, or it becomes a queen at full health.')}</div>`;
  if (id==='mirror'){
    if (!p2) return `<div class="bi-row"><b>${$t('Objetivo na fase 2', 'Phase 2 objective')}</b>${$t('Ele solta 2 estilhaços. Mate-os antes de focar o Reflexo.', 'It releases 2 shards. Kill them before focusing the Reflection.')}</div>`;
    const n = mirrorShards();
    return `<div class="bi-row"><b>${$t('Estilhaços ·', 'Shards ·')} ${n ? `<span class="now">${n} ${$t('vivos', 'alive')}</span>` : $t('<span class="when">nenhum</span>', '<span class="when">none</span>')}</b>${$t('Enquanto houver estilhaço vivo, metade do dano que você causa ao Reflexo volta para você.', 'While a shard is alive, half the damage you deal to the Reflection comes back to you.')}</div>`;
  }
  return '';
}
const whenTxt = k => k<=0 ? $t('<span class="now">agora</span>', '<span class="now">now</span>') : `<span class="when">${k===1 ? $t('no próximo turno', 'next turn') : $t(`em ${k} turnos`, `in ${k} turns`)}</span>`;
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
    rows.push(`<div class="bi-row"><b>${b.intent && b.intent.recover ? $t('Exposto agora', 'Exposed now') : $t('Ritmo', 'Rhythm')}</b>${$t('Depois de cada ataque fica exposto: sem atacar e recebendo +50% de dano por 1 turno, ou 2 depois de um golpe especial ou em estrela. Desvie, depois bata.', 'After each attack it is exposed: no attacks and +50% damage taken for 1 turn, or 2 after a special or star attack. Dodge, then strike.')}</div>`);
    if (id==='fallen') rows.push(`<div class="bi-row"><b>${$t('Fase', 'Phase')} ${b.fphase||1} ${$t('de 3', 'of 3')}: ${FALLEN_PHASE_NAME[b.fphase||1]}${b.fphase===2 ? ` · ${FALLEN_FORM_NAME[b.type]}` : ''}</b>${B['p'+(b.fphase||1)]}${(b.fphase||1)<3 ? `<br><i>${B['p'+((b.fphase||1)+1)]}</i>` : ''}</div>`);
    else rows.push(`<div class="bi-row"><b>${p2 ? $t('Fase 2', 'Phase 2') : $t('Fase 1', 'Phase 1')}</b>${p2 ? B.p2 : B.p1}${!p2 && id!=='twins' ? $t(' Muda de fase com metade da vida.', ' Changes phase at half health.') : ''}${p2 ? '' : `<br><i>${$t('Fase 2:', 'Phase 2:')} ${B.p2}</i>`}</div>`);
    if (id==='fallen'){
      const ph = b.fphase||1;
      if (ph!==2) rows.push(`<div class="bi-row"><b>${$t('Decreto Real e Ordem Real', 'Royal Decree and Royal Order')} · ${whenTxt(sp)}</b>${$t('Alternados a cada 2 turnos. O Decreto atinge todas as casas a até 2 dele: fique longe ou bata e saia.', 'Alternating every 2 turns. The Decree hits every square up to 2 from him: stay away, or strike and get out.')}</div>`);
      else rows.push(`<div class="bi-row"><b>${FALLEN_SPECIAL[b.type]} · ${whenTxt(sp)}</b>${FALLEN_SPECIAL_DESC[b.type]} ${$t('A cada 2 turnos. Troca de forma a cada ~9% da vida.', 'Every 2 turns. Changes form every ~9% of his health.')}</div>`);
      if (ph===3){ const esc = (S.kingEscapes || []).length, court = S.enemies.filter(o => !o.boss).length;
        rows.push(`<div class="bi-row"><b>${$t('Guarda Real:', 'Royal Guard:')} <span class="${court>=3?'when':'now'}">${court} ${$t('peças', 'pieces')}</span> · ${$t('Fugas:', 'Escapes:')} <span class="${esc<=2?'now':'when'}">${esc}</span></b>${$t('Com 3 ou mais peças da corte vivas, ele recebe metade do dano. Com 2 fugas ou menos (marcadas em dourado), recebe +50%.', 'With 3 or more court pieces alive, he takes half damage. With 2 escapes or fewer (marked in gold), he takes +50%.')}</div>`); }
    }
    else rows.push(b.uber ? `<div class="bi-row"><b>${$t('Golpe supremo ·', 'Supreme strike ·')} ${whenTxt(sp)}</b>${UBERS[spId==='queen'&&b.origId!=='queen'?'pawn':spId].special} ${$t('A cada 2 turnos.', 'Every 2 turns.')}</div>`
      : `<div class="bi-row"><b>${BOSS_SPECIAL[spId]} · ${whenTxt(sp)}</b>${SPECIAL_DESC[spId]} ${$t('A cada', 'Every')} ${every} ${$t('turnos.', 'turns.')}</div>`);
    if (b===first){
      let mk = 0; if (!(b.intent && b.intent.mark)) { mk = 1; while ((b.t+mk) % 4 !== 1) mk++; }
      rows.push(`<div class="bi-row"><b>${$t('Marca ·', 'Mark ·')} ${whenTxt(mk)}</b>${$t('Mira a casa onde você está. Saia dela antes do fim do turno. Atordoar cancela.', 'Targets the square you stand on. Leave it before the end of the turn. Stunning cancels it.')}</div>`);
    }
    const obj = bossObjectiveRow(b, p2, bosses);
    if (obj) rows.push(obj);
    if (stunned) rows.push(`<div class="bi-row"><b>${$t('Atordoado', 'Stunned')}</b>${$t('Não age neste turno.', 'Does not act this turn.')}</div>`);
    const ev = summonEvery(b);
    if (ev) rows.push(`<div class="bi-row"><b>${$t('Reforços', 'Reinforcements')}</b>${$t('Invoca peões a cada', 'Summons pawns every')} ${ev} ${$t('turnos, até 4 vivos.', 'turns, up to 4 alive.')}</div>`);
    if (b.mods.length) rows.push(`<div class="bi-row"><b>${$t('Afixos', 'Affixes')}</b><ul>${b.mods.map(m => `<li>${MODS[m].n}: ${MODS[m].d}</li>`).join('')}</ul></div>`);
    rows.push(`<div class="bi-row"><b>${$t('Golpe', 'Blow')}</b>${enemyHit(b)} ${$t('de dano', 'damage')}${b.shield>0 ? $t(` · escudo ${b.shield}`, ` · shield ${b.shield}`) : ''} ${$t('· vida', '· health')} ${Math.max(0,b.hp)}/${b.maxHp}</div>`);
    return `<div class="bi-card"><div><h2 class="${b.side==='holy'?'holy':''}">${esc(b.name)}</h2><span class="phase">${bosses.length>1 ? $t(`Torre ${idx+1} de 2`, `Rook ${idx+1} of 2`) : $t('Chefe', 'Boss')}</span></div>${rows.join('')}</div>`;
  });
  const extra = [];
  if (S.bossRelics){
    const r = S.bossRelics[0];
    extra.push(`<div class="bi-row"><b>${$t('Empunha', 'Wields')} <span class="rc-${r.rar}">${esc(r.name)}</span></b><ul>${r.affixes.map(a => `<li>${AFX[a.k].t(a.v)}</li>`).join('')}</ul>${$t('Vença e escolha entre ela e', 'Win and choose between it and')} <span class="rc-${S.bossRelics[1].rar}">${esc(S.bossRelics[1].name)}</span>.</div>`);
  }
  if (S.bossId){
    const used = S.clocks||0, big = S.exp.kind==='uber' || S.exp.kind==='pinnacle', every = big ? 4 : 5, max = big ? 8 : 4;
    let ck = 0; if (!S.clock){ ck = 1; while ((S.turn+ck) % every !== every-1) ck++; }
    const what = {crypt:$t('o teto desaba perto de você', 'the ceiling collapses near you'), swamp:$t('a água sobe e a névoa fecha', 'the water rises and the fog closes in'), forge:$t('a lava se espalha', 'the lava spreads'), cathedral:$t('o gelo avança', 'the ice advances')}[S.biome] || $t('a arena piora', 'the arena gets worse');
    extra.push(`<div class="bi-row"><b>${$t('Arena ·', 'Arena ·')} ${used>=max ? $t('estável', 'stable') : whenTxt(S.clock ? 0 : ck)}</b>${$t(`A cada ${every} turnos`, `Every ${every} turns`)} ${what} (${Math.max(0,max-used)} ${$t(`de ${max} restantes).`, `of ${max} remaining).`)}</div>`);
  }
  return cards.join('') + (extra.length ? `<div class="bi-card">${extra.join('')}</div>` : '');
}
const waitKeyNum = () => barSkills().length + (S.color==='b' ? 1 : 0) + 1;
function updateUI(){
  if (!S || !S.walls) return;
  const st = stats(), c = CLASSES[S.cls];
  if (cv.parentElement && cv.parentElement.dataset.biome!==S.biome) cv.parentElement.dataset.biome = S.biome;
  $('floorLabel').textContent = floorTitle();
  $('turnLabel').textContent = S.tut ? $t('Treino', 'Training') : S.timeStop>0 ? $t(`Gelo derrete em ${S.timeStop} ${S.timeStop===1?'turno':'turnos'}`, `Ice melts in ${S.timeStop} ${S.timeStop===1?'turn':'turns'}`) : S.phase==='enemy' ? $t('Turno inimigo', 'Enemy turn') : S.phase==='allies' ? $t('Turno dos aliados', 'Allies\' turn')
    : S.exp.kind==='daily' ? $t(`Turno ${S.turn} de ${S.turnLimit}`, `Turn ${S.turn} of ${S.turnLimit}`) : S.enemies.length ? $t(`Turno ${S.turn}`, `Turn ${S.turn}`) : $t('Andar limpo', 'Floor clear');
  updateHeader();
  $('clsName').textContent = c.name;
  $('stSide').textContent = FACTIONS[S.color].name;
  const hp = Math.max(0, S.player.hp);
  $('hpTxt').textContent = `${hp} / ${st.hp}`; $('hpBar').style.width = (100*hp/st.hp)+'%';
  const shMax = Math.max(st.shield, S.shield, 1);
  $('shTxt').textContent = `${S.shield}`; $('shBar').style.width = (100*S.shield/shMax)+'%';
  $('xpTxt').textContent = $t(`Nível ${HERO.level} · ${HERO.xp} / ${xpNeed(HERO.level)}`, `Level ${HERO.level} · ${HERO.xp} / ${xpNeed(HERO.level)}`); $('xpBar').style.width = (100*HERO.xp/xpNeed(HERO.level))+'%';
  $('stDmg').textContent = attackDmg(st); $('stAct').textContent = S.actions; $('stGold').textContent = HERO.gold;
  const gr = MATES.filter(m => (HERO.grimoire||{})[m.id]);
  $('passives').innerHTML = `<li><b>${$t('Resistências.', 'Resistances.')}</b> ${$t('fogo', 'fire')} ${st.resFire}${$t('% · gelo', '% · cold')} ${st.resCold}${$t('% · raio', '% · lightning')} ${st.resLight}%${BIOME_ELEMENT[S.biome]!=='phys' ? $t(` · inimigos daqui causam ${DTYPES[BIOME_ELEMENT[S.biome]].n} e resistem 50% a ele`, ` · enemies here deal ${DTYPES[BIOME_ELEMENT[S.biome]].n} and resist it by 50%`) : ''}</li><li>${c.passive}</li>` + FACTIONS[S.color].passives.map(p=>`<li>${p}</li>`).join('') + (gr.length ? `<li title="${gr.map(m=>m.name+': '+m.power).join(' | ')}"><b>${$t('Grimório.', 'Grimoire.')}</b> ${gr.length} ${gr.length===1?$t('poder de mate ativo', 'active mate power'):$t('poderes de mate ativos', 'active mate powers')} ${$t('(passe o mouse).', '(hover).')}</li>` : '');
  const canAct = S.phase==='player' && S.enemies.length>0;
  const bar = barSkills();
  for (let i=0;i<4;i++) $('btnS'+i).hidden = i>=bar.length;
  bar.forEach((id,i) => {
    const sk = SKILLS[id], b = $('btnS'+i);
    $('sName'+i).textContent = sk.name + (runeOf(id) ? ' ✦' : '');
    b.title = runeOf(id) ? RUNES[runeOf(id)].name + ': ' + RUNES[runeOf(id)].d : '';
    $('sDesc'+i).textContent = S.mode===id ? $t('Escolha onde pousar (Esc cancela)', 'Choose where to land (Esc cancels)') : sk.desc(skillView(st, id));
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
  $('pactDesc').textContent = S.pactUsed ? $t('Já usado neste andar', 'Already used on this floor') : $t('Paga 4 de vida e zera as recargas', 'Pay 4 health and reset cooldowns');
  $('btnWait').disabled = !canAct;
  // the build at a glance: one chip per named rule you carry
  const ruleChips = []; for (const s in S.equip){ const it = S.equip[s]; if (!it) continue; for (const a of it.affixes){ const d = AFX[a.k]; if (!d || !d.rule) continue; const txt = d.t(a.v), nm = txt.includes(':') ? txt.split(':')[0] : null; if (nm && nm.length<=20 && !ruleChips.some(r => r[0]===nm)) ruleChips.push([nm, txt]); } }
  $('gear').innerHTML = (ruleChips.length ? `<div class="chips2 rulechips">${ruleChips.map(([n,t]) => `<span class="mchip" style="--mc:#e3b456" title="${esc(t)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 6 6.4.6-4.9 4.2 1.5 6.4L12 17l-5.6 3.2 1.5-6.4L3 9.6 9.4 9z" fill="#e3b45655"/></svg>${esc(n)}</span>`).join('')}</div>` : '') + `<div class="gearicons">${Object.keys(SLOTS).map(s => { const it = S.equip[s]; return `<div class="itile gt ${it ? 'r-'+it.rar : 'empty'}" data-gslot="${s}" tabindex="0" aria-label="${esc(it ? it.name : SLOTS[s].label)}">${slotIcon(s)}</div>`; }).join('')}</div>`;
  $('log').innerHTML = S.log.map(l => `<li>${l}</li>`).join('');
  const bosses = S.enemies.filter(e=>e.boss);
  $('bossBar').hidden = !bosses.length;
  $('tideBar').hidden = !S.tide;
  if (S.tide){ const goal = S.tideGoal||8, ira = S.tideIra||0; $('tbFill').style.width = (100*Math.min(1, ira/goal))+'%'; $('tbSub').textContent = $t(`${ira}/${goal} · Brasas ${HERO.embers||0}`, `${ira}/${goal} · Embers ${HERO.embers||0}`); }
  if (bosses.length){
    const hpT = bosses.reduce((a,e)=>a+Math.max(0,e.hp),0), mx = bosses.reduce((a,e)=>a+e.maxHp,0), b0 = bosses[0];
    $('bbName').textContent = bosses.length>1 ? BOSSES.twins.names[b0.side] : b0.name;
    $('bbName').className = 'bb-name ' + (b0.side==='holy' ? 'holy' : '');
    $('bbFill').style.width = (100*hpT/mx)+'%';
    $('bbSub').textContent = `${hpT} / ${mx}` + (b0.phase===2 || b0.mods.includes('enraged') ? $t(' · segunda fase', ' · second phase') : '');
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
    $('ttStep').textContent = $t(`Treino ${S.tut.step+1}/${TUT_STEPS.length}`, `Training ${S.tut.step+1}/${TUT_STEPS.length}`);
    $('ttGoal').textContent = TUT_STEPS[S.tut.step].goal;
    $('ttDots').innerHTML = TUT_STEPS.map((_,i) => `<i class="${i<=S.tut.step?'on':''}"></i>`).join('');
  }
  $('btnS0').classList.toggle('tutpulse', !!(S.tut && S.tut.step===4));
  // frozen match: swap the skill bar for the puzzle bar
  const ch = S.chess;
  $('hotbar').hidden = !!ch; $('chessBar').hidden = !ch;
  if (ch){
    $('turnLabel').textContent = $t('Partida Congelada', 'Frozen Match');
    $('cbTitle').textContent = ch.P.name;
    $('cbSub').textContent = $t(`Mate em ${ch.P.n} · ${ch.left} ${ch.left===1?'lance restante':'lances restantes'} · ${ch.hints ? `${ch.hints} ${ch.hints===1?'dica usada':'dicas usadas'}` : 'sem dicas: runa de bônus'}`, `Mate in ${ch.P.n} · ${ch.left} ${ch.left===1?'move left':'moves left'} · ${ch.hints ? `${ch.hints} ${ch.hints===1?'hint used':'hints used'}` : 'no hints: bonus rune'}`);
    $('cbHint').disabled = ch.busy; $('cbQuit').disabled = ch.busy;
    $('cbHint').textContent = ch.hints===0 ? $t('Dica: a ideia', 'Hint: the idea') : ch.hints===1 ? $t('Dica: qual peça', 'Hint: which piece') : $t('Dica: o lance', 'Hint: the move');
    $('hint').textContent = (ch.hints ? ch.P.tip + ' ' : '') + $t('Regras normais de xadrez, sem vida nem dano. Clique numa peça sua (o herói brilha) e depois no destino. As pretas respondem com a melhor defesa; qualquer caminho para o mate vale.', 'Normal chess rules, no health or damage. Click one of your pieces (the hero glows) and then the destination. Black replies with the best defense; any path to mate counts.');
  }
}

/* ---------- Input ---------- */
$('btnS0').onclick = () => useSkill(0);
$('btnS1').onclick = () => useSkill(1);
$('btnS2').onclick = () => useSkill(2);
$('btnS3').onclick = () => useSkill(3);
$('btnQuit').onclick = quitExpedition;
const soundLabel = () => { $('btnSound').textContent = soundOn() ? $t('Som: ligado (M)', 'Sound: on (M)') : $t('Som: desligado (M)', 'Sound: off (M)'); };
$('btnSound').onclick = () => { toggleSound(); soundLabel(); };
try { soundLabel(); } catch(e){}
$('cbHint').onclick = chessHint;
$('cbQuit').onclick = chessGiveUp;
$('btnPact').onclick = usePact;
$('btnWait').onclick = waitTurn;
document.addEventListener('keydown', ev => { if (ev.key==='Shift' && !shiftDown){ shiftDown = true; if (typeof renderTip==='function') renderTip(); } });
document.addEventListener('keyup', ev => { if (ev.key==='Shift' && shiftDown){ shiftDown = false; if (typeof renderTip==='function') renderTip(); } });
window.addEventListener('blur', () => { shiftDown = false; });
document.addEventListener('keydown', ev => {
  if (!S || !S.walls || !$('modal').hidden || !$('overlay').hidden || $('scrGame').hidden) return;
  if (ev.target instanceof HTMLInputElement) return;
  if (ev.key==='m' || ev.key==='M'){ toggleSound(); soundLabel(); return; }
  if (S.chess) return;
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
function tileAt(ev){ return screenToTile(ev.clientX, ev.clientY); }
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
// static page texts: English versions live in data-en / data-en-aria
if (LANG==='en'){
  document.documentElement.lang = 'en';
  for (const el of document.querySelectorAll('[data-en]')) el.textContent = el.dataset.en;
  for (const el of document.querySelectorAll('[data-en-aria]')) el.setAttribute('aria-label', el.dataset.enAria);
}
$('btnLang').textContent = LANG==='en' ? 'PT' : 'EN';
$('btnLang').onclick = () => { try { localStorage.setItem('reiCaido.lang', LANG==='en' ? 'pt' : 'en'); } catch(e){} persist(); location.reload(); };
loadSave();
showHeroes();
if (document.fonts && document.fonts.load) document.fonts.load('40px "Noto Sans Symbols 2"', '♞').catch(()=>{});
requestAnimationFrame(frame);
