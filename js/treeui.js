/* Rei Caído — the passive tree and the Atlas in one full-screen window.
   Left click learns a node and every node on the shortest path to it; right click removes it and everything that depended on it.
   Hovering shows a tooltip with the effect and the cost (gold) or the refund (red). Drag to pan, wheel to zoom. */

const TU = {kind:'class', unit:60, k:1, x:0, y:0, hover:null, down:null, moved:false, msg:''};
const TU_R = {key:.5, notable:.36, start:.4, small:.22};
const tuT = () => TREE_API[TU.kind].T(HERO);
const tuPts = () => TREE_API[TU.kind].pts(HERO);
const tuLearned = () => gLearnedSet(TU.kind, HERO);
const treeLabelR = b => b.skillBranch ? 11.8 : 14.8;
const tuLabels = () => TU.kind==='atlas'
  ? atlasLabels()
  : treeBranchesFor(HERO.cls).map(b => ({name:b.name, x:Math.cos(b.ang*Math.PI/180)*treeLabelR(b), y:-Math.sin(b.ang*Math.PI/180)*treeLabelR(b)}));

function openTree(kind){
  if (!HERO || document.getElementById('treeModal')) return;
  TU.kind = kind==='atlas' ? 'atlas' : 'class';
  if (!document.getElementById('treeCss')){
    const st = document.createElement('style'); st.id = 'treeCss';
    st.textContent = `
.treemodal{position:fixed;inset:0;z-index:60;background:#0d0a08;display:flex;flex-direction:column;color:var(--bone,#e8dcc4)}
.treemodal header{display:flex;align-items:center;gap:16px;padding:10px 16px;border-bottom:1px solid #3a2a1c;flex-wrap:wrap}
.treemodal h2{margin:0;font-family:var(--f-display,serif);font-weight:400;font-size:1.3rem}
.treemodal .tpts{font-size:1rem;color:var(--ash,#a89b87)} .treemodal .tpts b{color:#e3b456;font-size:1.3rem}
.treemodal .tbtns{margin-left:auto;display:flex;gap:8px}
.treemodal .tmain{flex:1;display:flex;min-height:0}
.treemodal svg{flex:1;min-width:0;height:100%;cursor:grab;touch-action:none;user-select:none}
.treemodal svg.pan{cursor:grabbing}
.treemodal aside{width:270px;border-left:1px solid #3a2a1c;padding:14px;overflow:auto;font-size:.9rem;display:flex;flex-direction:column;gap:8px}
.treemodal aside .k{font-size:.66rem;text-transform:uppercase;letter-spacing:.14em;color:var(--ash,#a89b87)}
.treemodal aside p{margin:0}
.treemodal footer{padding:6px 16px;border-top:1px solid #3a2a1c;color:var(--ash,#a89b87);font-size:.78rem}
.treemodal .ln{stroke:#4a3a2c;stroke-width:3}
.treemodal .ln.on{stroke:#e07a32;stroke-width:4}
.treemodal .ln.add{stroke:#e3b456;stroke-width:4;stroke-dasharray:7 5}
.treemodal .ln.rem{stroke:#d9534f;stroke-width:4;stroke-dasharray:7 5}
.treemodal .tn circle{fill:#1c1510;stroke:#6b4a2a;stroke-width:2.5}
.treemodal .tn.avail circle{stroke:#e3b456}
.treemodal .tn.on circle{fill:#e07a32;stroke:#ffd9a0}
.treemodal .tn.add circle{fill:#5a4520;stroke:#e3b456;stroke-width:4}
.treemodal .tn.rem circle{fill:#5a2020;stroke:#d9534f;stroke-width:4}
.treemodal .tn.notable circle{stroke-width:3.5} .treemodal .tn.key circle{stroke-width:4;stroke:#f08a3c}
.treemodal .tn.key.on circle{fill:#ffb35c}
.treemodal .tn:hover circle{stroke:#fff}
.treemodal text{fill:#cdbb9c;font-family:var(--f-display,serif);text-anchor:middle;pointer-events:none}
.treemodal text.on{fill:#ffd9a0} .treemodal text.br{fill:#e07a32;letter-spacing:.1em}
.tmtip{position:fixed;z-index:80;pointer-events:none;max-width:310px;background:rgba(18,14,12,.98);border:1px solid #6b4a2a;box-shadow:0 10px 30px rgba(0,0,0,.7);padding:10px 12px;display:flex;flex-direction:column;gap:5px;font-size:.88rem;color:var(--bone,#e8dcc4)}
.tmtip .k{font-size:.66rem;text-transform:uppercase;letter-spacing:.14em;color:var(--ash,#a89b87)}
.tmtip b{font-family:var(--f-display,serif);font-weight:400;font-size:1.15rem}
.tmtip b.notable{color:#ecd36a} .tmtip b.key{color:#f08a3c}
.tmtip p{margin:0}`;
    document.head.appendChild(st);
  }
  const atlas = TU.kind==='atlas';
  const m = document.createElement('div'); m.id = 'treeModal'; m.className = 'treemodal';
  m.innerHTML = `<header><h2>${atlas ? $t('Atlas', 'Atlas') : $t('Árvore de passivas', 'Passive tree') + ' · ' + CLASSES[HERO.cls].name}</h2><span class="tpts" id="tmPts"></span>
      <div class="tbtns"><button class="ghost sm" type="button" id="tmReset">${$t('Redistribuir tudo', 'Reset all')}</button><button class="primary sm" type="button" id="tmClose">${$t('Fechar (Esc)', 'Close (Esc)')}</button></div></header>
    <div class="tmain"><svg id="tmSvg"><g id="tmG"></g></svg><aside id="tmInfo"></aside></div>
    <footer>${$t('Clique esquerdo: aprende o nó e o caminho até ele · Clique direito: remove o nó e o que dependia dele · Arraste para mover · Roda do mouse: zoom · 0: centralizar', 'Left click: learn the node and the path to it · Right click: remove the node and what depended on it · Drag to pan · Wheel: zoom · 0: recenter')}</footer>
    <div class="tmtip" id="tmTip" hidden></div>`;
  document.body.appendChild(m);
  const svg = m.querySelector('#tmSvg');
  $('tmClose').onclick = treeClose;
  $('tmReset').onclick = () => { if (!TREE_API[TU.kind].get(HERO).length) return; TREE_API[TU.kind].set(HERO, []); persist(); treeDraw(); };
  svg.addEventListener('wheel', ev => { ev.preventDefault(); treeZoom(Math.pow(1.0015, -ev.deltaY), ev.clientX, ev.clientY); }, {passive:false});
  svg.addEventListener('pointerdown', ev => {
    if (ev.button!==0 && ev.button!==2) return;
    const nd = ev.target.closest && ev.target.closest('.tn');
    TU.down = {x:ev.clientX, y:ev.clientY, ox:TU.x, oy:TU.y, node:nd ? nd.dataset.id : null, btn:ev.button}; TU.moved = false;
    if (ev.button===0) svg.setPointerCapture(ev.pointerId);
  });
  svg.addEventListener('pointermove', ev => {
    const d = TU.down;
    if (d && ev.buttons && Math.hypot(ev.clientX-d.x, ev.clientY-d.y) > 5){ TU.moved = true; svg.classList.add('pan'); }
    if (d && TU.moved && d.btn===0){ TU.x = d.ox + ev.clientX - d.x; TU.y = d.oy + ev.clientY - d.y; treeApplyView(); treeTip(null); return; }
    const el = document.elementFromPoint(ev.clientX, ev.clientY), nd = el && el.closest ? el.closest('.tn') : null, id = nd ? nd.dataset.id : null;
    if (id!==TU.hover){ TU.hover = id; TU.msg = ''; treeDraw(); }
    treeTip(id, ev);
  });
  svg.addEventListener('pointerup', () => {
    const d = TU.down; TU.down = null; svg.classList.remove('pan');
    if (!d || TU.moved || d.btn!==0 || !d.node || d.node==='start') return;
    if (gLearn(TU.kind, HERO, d.node)){ persist(); TU.msg = ''; }
    else { const need = gPath(TU.kind, HERO, d.node).length; TU.msg = need ? $t(`Faltam ${need - Math.max(0, tuPts())} ponto(s) para chegar a esse nó.`, `You need ${need - Math.max(0, tuPts())} more point(s) to reach this node.`) : ''; }
    treeDraw();
  });
  svg.addEventListener('contextmenu', ev => {
    ev.preventDefault();
    const nd = ev.target.closest && ev.target.closest('.tn'); if (!nd || nd.dataset.id==='start') return;
    if (gUnlearn(TU.kind, HERO, nd.dataset.id)){ persist(); TU.msg = ''; treeDraw(); treeTip(nd.dataset.id, ev); }
  });
  svg.addEventListener('pointerleave', () => { if (TU.hover){ TU.hover = null; treeDraw(); } treeTip(null); });
  document.addEventListener('keydown', treeKey);
  addEventListener('resize', treeFit);
  TU.hover = null; TU.msg = '';
  treeFit();
}
function treeClose(){
  const m = document.getElementById('treeModal'); if (m) m.remove();
  document.removeEventListener('keydown', treeKey); removeEventListener('resize', treeFit);
  showCamp();
}
function treeKey(ev){
  if (ev.key==='Escape'){ ev.preventDefault(); treeClose(); }
  else if (ev.key==='0') treeFit();
  else if (ev.key==='+' || ev.key==='=') treeZoom(1.25);
  else if (ev.key==='-' || ev.key==='_') treeZoom(.8);
}
function treeApplyView(){ const g = document.getElementById('tmG'); if (g) g.setAttribute('transform', `translate(${TU.x} ${TU.y}) scale(${TU.k})`); }
function treeZoom(f, cx, cy){
  const svg = document.getElementById('tmSvg'); if (!svg) return;
  const r = svg.getBoundingClientRect(); if (cx===undefined){ cx = r.left + r.width/2; cy = r.top + r.height/2; }
  const k = Math.max(.25, Math.min(4, TU.k*f)), px = cx - r.left, py = cy - r.top;
  TU.x = px - (px - TU.x)*(k/TU.k); TU.y = py - (py - TU.y)*(k/TU.k); TU.k = k; treeDraw();
}
// fit the whole tree in the window
function treeFit(){
  const svg = document.getElementById('tmSvg'); if (!svg) return;
  const r = svg.getBoundingClientRect(), T = tuT(), U = TU.unit;
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  for (const n of Object.values(T)){ x0 = Math.min(x0, n.x*U); x1 = Math.max(x1, n.x*U); y0 = Math.min(y0, n.y*U); y1 = Math.max(y1, n.y*U); }
  for (const b of tuLabels()){ x0 = Math.min(x0, b.x*U); x1 = Math.max(x1, b.x*U); y0 = Math.min(y0, b.y*U); y1 = Math.max(y1, b.y*U); }
  const pad = 60, k = Math.min((r.width - pad)/(x1 - x0 || 1), (r.height - pad)/(y1 - y0 || 1));
  TU.k = k; TU.x = r.width/2 - (x0 + x1)/2*k; TU.y = r.height/2 - (y0 + y1)/2*k;
  treeDraw();
}
// the text of a node (used by the tooltip)
function treeNodeHtml(n, add, rem, learned, pts){
  const kind = {small:$t('Passiva', 'Passive'), notable:$t('Notável', 'Notable'), key:$t('Pedra-chave', 'Keystone'), start:$t('Origem', 'Origin')}[n.kind];
  const affordable = add.size > 0 && add.size <= pts;
  let status;
  if (n.kind==='start') status = '';
  else if (learned.has(n.id)) status = `<p style="color:#ffd9a0">${$t('Aprendido.', 'Learned.')} ${rem.size > 1 ? $t(`Remover devolve ${rem.size} pontos (inclui os nós que dependem dele).`, `Removing refunds ${rem.size} points (including the nodes that depend on it).`) : $t('Remover devolve 1 ponto.', 'Removing refunds 1 point.')}</p><p class="k">${$t('Clique direito para remover', 'Right click to remove')}</p>`;
  else if (affordable) status = `<p style="color:#e3b456">${$t('Custo', 'Cost')}: ${add.size} ${add.size===1 ? $t('ponto', 'point') : $t('pontos', 'points')}${add.size>1 ? $t(' (todo o caminho)', ' (the whole path)') : ''}</p><p class="k">${$t('Clique esquerdo para aprender', 'Left click to learn')}</p>`;
  else status = `<p style="color:#ff9a8a">${$t('Custo', 'Cost')}: ${add.size} ${$t('pontos', 'points')}. ${$t(`Faltam ${add.size - Math.max(0, pts)}.`, `${add.size - Math.max(0, pts)} short.`)}</p>`;
  const sk = n.skill ? `<p class="k">${$t('Só funciona com', 'Only works with')} ${esc(SKILLS[n.skill].name)} ${$t('na barra', 'on the bar')}</p>` : '';
  return `<span class="k">${kind}${n.branch ? ' · ' + esc(n.branch) : ''}</span><b class="${n.kind}">${esc(n.name)}</b>${n.d!==n.name || n.kind!=='small' ? `<p>${esc(n.d)}</p>` : ''}${sk}${status}`;
}
function treePreview(){
  const learned = tuLearned();
  let add = new Set(), rem = new Set();
  if (TU.hover && TU.hover!=='start'){
    if (learned.has(TU.hover)) rem = new Set(gRefund(TU.kind, HERO, TU.hover));
    else add = new Set(gPath(TU.kind, HERO, TU.hover));
  }
  return {learned, add, rem};
}
// floating tooltip next to the pointer
function treeTip(id, ev){
  const tip = document.getElementById('tmTip'); if (!tip) return;
  const n = id && tuT()[id];
  if (!n){ tip.hidden = true; return; }
  const {learned, add, rem} = treePreview();
  tip.innerHTML = treeNodeHtml(n, add, rem, learned, tuPts());
  tip.hidden = false;
  if (ev){
    const r = tip.getBoundingClientRect(), x = Math.min(ev.clientX + 18, innerWidth - r.width - 8), y = Math.min(ev.clientY + 18, innerHeight - r.height - 8);
    tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
  }
}
function treeDraw(){
  const g = document.getElementById('tmG'); if (!g) return;
  const T = tuT(), U = TU.unit, pts = tuPts(), {learned, add, rem} = treePreview();
  const parts = [], labels = [];
  for (const n of Object.values(T)) for (const l of n.links) if (n.id < l){
    const both = learned.has(n.id) && learned.has(l);
    const inAdd = (add.has(n.id) || learned.has(n.id)) && (add.has(l) || learned.has(l)) && (add.has(n.id) || add.has(l));
    const inRem = both && (rem.has(n.id) || rem.has(l));
    parts.push(`<line class="ln ${inRem ? 'rem' : inAdd ? 'add' : both ? 'on' : ''}" x1="${n.x*U}" y1="${n.y*U}" x2="${T[l].x*U}" y2="${T[l].y*U}"/>`);
  }
  for (const n of Object.values(T)){
    const r = TU_R[n.kind]*U, on = learned.has(n.id), st = rem.has(n.id) ? 'rem' : add.has(n.id) ? 'add' : on ? 'on' : (n.links.some(l => learned.has(l)) && pts>0 ? 'avail' : '');
    parts.push(`<g class="tn ${n.kind} ${st}" data-id="${n.id}"><circle cx="${n.x*U}" cy="${n.y*U}" r="${r}"/></g>`);
    if (n.kind==='key' || (n.kind==='notable' && (TU.k > .85 || on || TU.hover===n.id))) labels.push(`<text class="${on?'on':''}" x="${n.x*U}" y="${n.y*U + r + 17/TU.k}" style="font-size:${(14/TU.k).toFixed(1)}px">${esc(n.name)}</text>`);
  }
  for (const b of tuLabels()) labels.push(`<text class="br" x="${b.x*U}" y="${b.y*U}" style="font-size:${(19/TU.k).toFixed(1)}px">${esc(b.name)}</text>`);
  g.innerHTML = parts.join('') + labels.join('');
  treeApplyView();
  $('tmPts').innerHTML = `${$t('Pontos livres', 'Free points')}: <b>${Math.max(0, pts)}</b> · ${$t('gastos', 'spent')} ${TREE_API[TU.kind].get(HERO).length}`;
  const info = $('tmInfo'), atlas = TU.kind==='atlas';
  info.innerHTML = `<span class="k">${$t('Como funciona', 'How it works')}</span>${TU.msg ? `<p style="color:#ff9a8a">${esc(TU.msg)}</p>` : ''}
    <p>${$t('Passe o mouse sobre um nó para ver o que ele faz e quanto custa chegar nele.', 'Hover a node to see what it does and what it costs to reach it.')}</p>
    <p>${$t('Nós pequenos dão números; Notáveis dão regras; Pedras-chave, no fim de cada ramo, mudam a forma de jogar.', 'Small nodes give numbers; Notables give rules; Keystones, at the end of each branch, change how you play.')}</p>
    ${atlas ? `<p>${$t('Cada mecânica tem um tronco e dois sub-ramos: dois jeitos de jogar a mesma mecânica. Você não consegue pegar tudo: escolha em qual quer se especializar.', 'Each mechanic has a trunk and two sub-branches: two ways to play the same mechanic. You cannot take everything: choose what to specialise in.')}</p><p>${$t('Os efeitos do Atlas só valem dentro dos mapas.', 'Atlas effects only apply inside maps.')}</p>
      <p class="k" style="margin-top:6px">${$t('Pontos', 'Points')}</p><p>${$t('1 por bioma e nível de mapa concluído pela primeira vez (até 40). A árvore tem mais nós do que isso.', '1 per biome and map tier completed for the first time (up to 40). The tree has more nodes than that.')}</p>`
    : `<p>${$t('Os ramos com nome de habilidade só ajudam quando ela está na sua barra.', 'Branches named after a skill only help when that skill is on your bar.')}</p>
      <p class="k" style="margin-top:6px">${$t('Pontos', 'Points')}</p><p>${$t('1 por nível e até 8 no endgame. A árvore tem mais nós do que você consegue pegar.', '1 per level and up to 8 in the endgame. The tree has more nodes than you can take.')}</p>`}`;
}
