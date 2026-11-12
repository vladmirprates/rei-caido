/* Rei Caído — Ascendancies: an endgame subclass per class, with its own skill and a small tree of rules.
   Points: 2 for finishing the campaign, 1 for the Reflection, 1 per uber boss, 1 for the Fallen King (max 8).
   Prototype: the King's Necromancer (raises fallen enemy pieces) and the Knight's Arcane Knight (elemental spellcasting). */

const ASC = {
  necro:{cls:'K', skill:'raise', replaces:'summon', name:$t('Necromante', 'Necromancer'),
    pitch:$t('Cada peça inimiga que cai deixa um corpo. Reanimar ergue o corpo como aliado, com a mesma peça: um cavalo morto vira um cavalo seu.', 'Every fallen enemy piece leaves a corpse. Raise Dead brings the corpse back as your ally, as the same piece: a dead knight becomes your knight.'),
    base:[{k:'asc', n:'raise'}],
    nodes:[
      {id:'n1', name:$t('Pele Podre', 'Rotten Hide'), req:[], d:$t('Mortos-vivos erguidos têm +3 de vida e +1 de dano', 'Raised undead have +3 health and +1 damage'), aff:[{k:'asc', n:'necroBody'}]},
      {id:'n2', name:$t('Exército dos Mortos', 'Army of the Dead'), req:['n1'], d:$t('+2 ao limite de aliados', '+2 to the ally limit'), aff:[{k:'asc', n:'allyCap', v:2}]},
      {id:'n3', name:$t('Fome dos Mortos', 'Hunger of the Dead'), req:['n1'], d:$t('Cada abate dos seus aliados cura 1 de vida', 'Each kill by your allies heals 1 health'), aff:[{k:'asc', n:'necroLeech'}]},
      {id:'n4', name:$t('Corpo Explosivo', 'Volatile Corpse'), req:['n2'], d:$t('Mortos-vivos explodem ao cair: 1,5× o dano deles a todos ao redor', 'Undead explode when they fall: 1.5× their damage to everything around'), aff:[{k:'asc', n:'necroBomb'}]},
      {id:'n5', name:$t('Reanimação Rápida', 'Swift Reanimation'), req:['n3'], d:$t('Reanimar recarrega 2 turnos mais rápido', 'Raise Dead recharges 2 turns faster'), aff:[{k:'asc', n:'raiseCd', v:2}]},
      {id:'n6', name:$t('Cova Funda', 'Deep Grave'), req:['n4','n5'], d:$t('Os corpos duram +4 turnos', 'Corpses last +4 turns'), aff:[{k:'asc', n:'corpseLife', v:4}]},
      {id:'n7', name:$t('Elite Morta-Viva', 'Undead Elite'), req:['n6'], d:$t('Corpos de elites se erguem com +50% de vida e dano', 'Elite corpses rise with +50% health and damage'), aff:[{k:'asc', n:'necroElite'}]},
      {id:'n8', key:true, name:$t('Legião Eterna', 'Eternal Legion'), req:['n7'], d:$t('Os mortos-vivos não somem no fim do andar: seguem você', 'Undead do not vanish at the end of the floor: they follow you'), aff:[{k:'asc', n:'necroLegion'}]}
    ]},
  arcane:{cls:'N', skill:'arcane', replaces:'kick', name:$t('Cavalo Arcano', 'Arcane Knight'),
    pitch:$t('Um cavalo mago: o Projétil Arcano acerta de longe, com o seu elemento mais forte (fogo queima, gelo atordoa, raio salta). Elementos viram o centro da build.', 'A knight mage: the Arcane Bolt hits from afar with your strongest element (fire burns, cold stuns, lightning jumps). Elements become the core of the build.'),
    base:[{k:'asc', n:'arcane'}],
    nodes:[
      {id:'n1', name:$t('Foco Arcano', 'Arcane Focus'), req:[], d:$t('Projétil Arcano: +2 de dano e recarrega 1 turno mais rápido', 'Arcane Bolt: +2 damage and recharges 1 turn faster'), aff:[{k:'asc', n:'arcFocus'}, {k:'asc', n:'arcCd'}]},
      {id:'n2', name:$t('Prisma do Cavalo', 'Knight\'s Prism'), req:['n1'], d:$t('+1 de dano de fogo, de gelo e de raio', '+1 fire, cold and lightning damage'), aff:[{k:'fireDmg', v:1}, {k:'coldDmg', v:1}, {k:'lightDmg', v:1}]},
      {id:'n3', name:$t('Salto Arcano', 'Arcane Leap'), req:['n1'], d:$t('Salto Sísmico ganha o dano elemental e +2', 'Seismic Leap gains your elemental damage and +2'), aff:[{k:'asc', n:'arcLeap'}]},
      {id:'n4', name:$t('Conduíte', 'Conduit'), req:['n2'], d:$t('O Projétil Arcano salta para um segundo inimigo, com metade do dano', 'The Arcane Bolt jumps to a second enemy for half damage'), aff:[{k:'asc', n:'arcChain'}]},
      {id:'n5', name:$t('Ressonância', 'Resonance'), req:['n3'], d:$t('+1 de dano em todos os golpes por elemento diferente no equipamento', '+1 damage on every blow per different element in your gear'), aff:[{k:'asc', n:'arcRes'}]},
      {id:'n6', name:$t('Mana Pulsante', 'Pulsing Mana'), req:['n4','n5'], d:$t('Abater com o Projétil Arcano reduz a recarga dele em 1', 'Killing with the Arcane Bolt lowers its cooldown by 1'), aff:[{k:'asc', n:'arcMana'}]},
      {id:'n7', name:$t('Tempestade de Mana', 'Mana Storm'), req:['n6'], d:$t('O Projétil Arcano também atinge as casas vizinhas do alvo, com metade do dano', 'The Arcane Bolt also hits the target\'s neighboring squares for half damage'), aff:[{k:'asc', n:'arcStorm'}]},
      {id:'n8', key:true, name:$t('Arquimago', 'Archmage'), req:['n7'], d:$t('O Projétil Arcano não gasta ação (recarrega 1 turno mais devagar)', 'The Arcane Bolt costs no action (recharges 1 turn slower)'), aff:[{k:'asc', n:'arcFree'}]}
    ]}
};

// extra passive-tree points from endgame milestones: 2 for the campaign, 1 for the Reflection, 1 per uber boss, 1 for the Fallen King
const ascPoints = h => (h.actDone>=4 ? 2 : 0) + ((h.bossesKilled||[]).includes('mirror') ? 1 : 0) + (h.ubersBeaten||[]).length + ((h.fallenKills||0)>0 ? 1 : 0);
for (const [id, A] of Object.entries(ASC)) A.id = id;
const ascSkillsOf = cls => Object.values(ASC).filter(A => A.cls===cls).map(A => A.skill);
const ascOfSkill = id => Object.values(ASC).find(A => A.skill===id) || null;
const isAscSkill = id => !!ascOfSkill(id);
// skills with their own numbers per skill (the shared ascension modifiers live under stats().by[skillId])
const ASC_GENERIC = new Set(['ascDmg','ascCd','ascStun','ascBurn','ascHeal','ascShield','ascKillCd','ascKillAct','ascNext']);

/* ---------- Necromancer: corpses and raised pieces ---------- */
const allyCap = () => MAX_ALLIES + (stats().allyCap||0) + (stats().ossuary ? 1 : 0);
const corpseLife = () => 6 + (stats().corpseLife||0) + (stats().ossuary ? 3 : 0);
function addCorpse(e){
  if (!S.corpses || e.boss || e.shard || e.frozenPiece || e.rift || !barSkills().includes('raise')) return;
  S.corpses.push({x:e.x, y:e.y, type:e.type, elite:!!e.elite, maxHp:e.maxHp, dmg:e.dmg, turn:S.turn});
  if (S.corpses.length>10) S.corpses.shift();
}
const corpseAt = (x,y) => (S.corpses||[]).find(c => c.x===x && c.y===y);
const raisable = c => S.turn - c.turn <= corpseLife() && cheb(c.x,c.y,S.player.x,S.player.y) <= 4 && !occupied(c.x,c.y);
function raiseCorpse(c){
  const st = stats(), mult = c.elite && st.necroElite ? 1.5 : 1;
  const maxHp = Math.max(3, Math.round(c.maxHp*(c.elite ? .7 : .5)*mult*(st.undeadFury ? 1.25 : 1))) + 3*(st.necroBody||0);
  const a = {id:++uid, type:c.type, x:c.x, y:c.y, rx:c.x, ry:c.y, lx:0, ly:0, hp:maxHp, maxHp, dmg:Math.max(2, Math.round(c.dmg*.7*mult)) + (st.necroBody||0) + (st.undeadFury ? 2 : 0), raised:true, spectral:!st.necroLegion};
  S.allies.push(a); burst(c.x, c.y, '#b048c8', 10); vfx('hand', c.x, c.y, c.x, c.y);
  return a;
}
// allied knights hit what is an L-leap away
function allyKnightTarget(a){
  let best = null;
  for (const [dx,dy] of KN){ const e = enemyAt(a.x+dx, a.y+dy); if (e && (!best || e.hp<best.hp)) best = e; }
  return best;
}

/* ---------- Arcane Knight ---------- */
const elemSum = st => (st.fireDmg||0) + (st.coldDmg||0) + (st.lightDmg||0);
function topElem(st){
  const m = Math.max(st.fireDmg||0, st.coldDmg||0, st.lightDmg||0); if (!m) return null;
  return st.fireDmg===m ? 'fire' : st.coldDmg===m ? 'cold' : 'light';
}

const ELEM_RGB = {fire:'255,120,40', cold:'150,205,255', light:'236,222,110'};
const scepterColor = () => ELEM_RGB[topElem(stats())] || '190,140,255';

Object.assign(SKILLS, {
  raise:{name:$t('Reanimar', 'Raise Dead'), cd:3, target:true,
    desc:st=>$t(`Ergue como aliado uma peça inimiga morta nos últimos ${6+(st.corpseLife||0)} turnos, a até 4 casas. Some no fim do andar${st.necroLegion?' (aqui, não)':''}`, `Raises a fallen enemy piece from the last ${6+(st.corpseLife||0)} turns, within 4 squares, as your ally. Vanishes at the end of the floor${st.necroLegion?' (not here)':''}`),
    can:() => S.allies.length < allyCap() && (S.corpses||[]).some(raisable),
    targets(){ return (S.corpses||[]).filter(raisable).map(c => [c.x,c.y]); },
    run(x,y){
      const c = corpseAt(x,y); if (!c) return;
      S.corpses = S.corpses.filter(o => o!==c);
      const a = raiseCorpse(c), st = stats();
      if (st.twinSummon && S.allies.length < allyCap()){
        const o = (S.corpses||[]).filter(raisable).sort((p,q) => cheb(p.x,p.y,x,y)-cheb(q.x,q.y,x,y))[0];
        if (o){ S.corpses = S.corpses.filter(k => k!==o); raiseCorpse(o); }
      }
      if (st.soulTithe){ heal(4); S.shield += 2; floatText(S.player.x, S.player.y-0.3, '+2 '+$t('escudo', 'shield'), '#a9bfd6'); }
      floatText(x, y-0.4, $t('Reanimar', 'Raise Dead'), '#c08cf0'); log($t(`${EDEF[a.type].name} morto-vivo se ergue.`, `An undead ${EDEF[a.type].name} rises.`));
    }},
  arcane:{name:$t('Projétil Arcano', 'Arcane Bolt'), cd:2, target:true, hits:true,
    desc:st=>{ const el = topElem(st); return $t(`Atinge um inimigo a até 4 casas com ${st.dmg+2+(st.arcFocus?2:0)} + elemental${el ? ': '+{fire:'queima a casa', cold:'atordoa', light:'salta para outro inimigo'}[el] : ''}`, `Hits an enemy within 4 squares for ${st.dmg+2+(st.arcFocus?2:0)} + elemental${el ? ': '+{fire:'burns the square', cold:'stuns', light:'jumps to another enemy'}[el] : ''}`); },
    targets(){ const p = S.player; return S.enemies.filter(e => cheb(e.x,e.y,p.x,p.y)<=4 && inSight(e.x,e.y)).map(e => [e.x,e.y]); },
    run(x,y){
      const st = stats(), p = S.player, e = enemyAt(x,y); if (!e) return;
      const el = topElem(st), col = ELEM_RGB[el] || '190,140,255';
      const dmg = attackDmg(st, e) + 2 + (st.arcFocus ? 2 : 0);
      const all = !!st.prism, hasF = st.fireDmg>0 && (all || el==='fire'), hasC = st.coldDmg>0 && (all || el==='cold'), hasL = st.lightDmg>0 && (all || el==='light');
      // always a flying arcane orb (never the jagged lightning of gear): the element only tints its core
      vfx('arcane', p.x, p.y, e.x, e.y, {c:col});
      sfx(el==='fire' ? 'fire' : el==='cold' ? 'cold' : 'zap');
      skillHit(e, dmg);
      if (hasF) S.fire.set(key(x,y), 2);
      if (hasC && S.enemies.includes(e)) stun(e);
      const half = Math.max(1, Math.floor(dmg/2)), extra = new Set();
      if (hasL || st.arcChain){ const o = S.enemies.filter(q => q!==e && cheb(q.x,q.y,x,y)<=2).sort((a,b) => cheb(a.x,a.y,x,y)-cheb(b.x,b.y,x,y))[0]; if (o) extra.add(o); }
      if (st.arcStorm) for (const [dx,dy] of ALL){ const o = enemyAt(x+dx,y+dy); if (o) extra.add(o); }
      const was = S.blasting; S.blasting = true;
      for (const o of extra){ if (!S.enemies.includes(o)) continue; vfx('arcane', x, y, o.x, o.y, {c:col}); skillHit(o, half); }
      S.blasting = was;
      if (st.arcFree) S.actions++;
      log($t('Projétil Arcano.', 'Arcane Bolt.'));
    }}
});

