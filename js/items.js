/* Rei Caído — items, uniques, endgame maps */

const SLOTS = {
  arma:{label:$t('Arma', 'Weapon'), bases:[$t('Lança', 'Spear'),$t('Espada', 'Sword'),$t('Maça', 'Mace'),$t('Cetro', 'Scepter')]},
  elmo:{label:$t('Elmo', 'Helm'), bases:[$t('Elmo', 'Helm'),$t('Capuz', 'Hood'),$t('Diadema', 'Diadem'),$t('Máscara', 'Mask')]},
  armadura:{label:$t('Armadura', 'Armor'), bases:[$t('Cota', 'Mail'),$t('Couraça', 'Cuirass'),$t('Gibão', 'Doublet'),$t('Manto', 'Cloak')]},
  botas:{label:$t('Botas', 'Boots'), bases:[$t('Botas', 'Boots'),$t('Grevas', 'Greaves'),$t('Sapatos', 'Shoes'),$t('Sandálias', 'Sandals')]},
  anel:{label:$t('Anel', 'Ring'), bases:[$t('Anel', 'Ring'),$t('Selo', 'Seal'),$t('Aliança', 'Band'),$t('Amuleto', 'Amulet')]}
};
const RAR = {common:{label:$t('Comum', 'Common'), c:'#cfc6b6'}, magic:{label:$t('Mágico', 'Magic'), c:'#8aa4ff'}, rare:{label:$t('Raro', 'Rare'), c:'#ecd36a'}, legend:{label:$t('Único', 'Unique'), c:'#f08a3c'}};
const AFX = {
  dmg:{t:v=>$t(`+${v} de dano`, `+${v} damage`), suf:$t('da Ruína', 'of Ruin')},
  hp:{t:v=>$t(`+${v} de vida máxima`, `+${v} max health`), suf:$t('do Bastião', 'of the Bastion')},
  shield:{t:v=>$t(`+${v} de escudo por andar`, `+${v} shield per floor`), suf:$t('da Égide', 'of the Aegis')},
  cdr:{t:v=>$t(`Habilidades recarregam ${v} turno mais rápido`, `Skills recharge ${v} turn faster`), suf:$t('do Vento', 'of the Wind')},
  crit:{t:v=>$t(`${v}% de chance de crítico (golpe ×1,5)`, `${v}% critical chance (blow ×1.5)`), suf:$t('da Fúria', 'of Fury')},
  eliteDmg:{t:v=>$t(`+${v}% de dano contra elites e chefes`, `+${v}% damage against elites and bosses`), suf:$t('do Algoz', 'of the Slayer')},
  block:{t:v=>$t(`${v}% de chance de bloquear metade de um golpe`, `${v}% chance to block half of a blow`), suf:$t('da Muralha', 'of the Wall')},
  healKill:{t:v=>$t(`Cura ${v} ao matar`, `Heal ${v} on kill`), suf:$t('da Colheita', 'of the Harvest')},
  mf:{t:v=>$t(`+${v}% de achado de itens`, `+${v}% item find`), suf:$t('da Fortuna', 'of Fortune')},
  gold:{t:v=>$t(`+${v}% de ouro`, `+${v}% gold`), suf:$t('da Cobiça', 'of Greed')},
  fireDmg:{t:v=>$t(`+${v} de dano de fogo`, `+${v} fire damage`), suf:$t('das Brasas', 'of Embers')},
  coldDmg:{t:v=>$t(`+${v} de dano de gelo`, `+${v} cold damage`), suf:$t('do Inverno', 'of Winter')},
  lightDmg:{t:v=>$t(`+${v} de dano de raio`, `+${v} lightning damage`), suf:$t('da Tempestade', 'of the Storm')},
  resFire:{t:v=>$t(`+${v}% de resistência a fogo`, `+${v}% fire resistance`), suf:$t('da Salamandra', 'of the Salamander')},
  resCold:{t:v=>$t(`+${v}% de resistência a gelo`, `+${v}% cold resistance`), suf:$t('do Urso', 'of the Bear')},
  resLight:{t:v=>$t(`+${v}% de resistência a raio`, `+${v}% lightning resistance`), suf:$t('do Para-raios', 'of the Lightning Rod')},
  chain:{t:()=>$t('Ceifa: ao abater, ganha +1 ação (máx. 2 por turno; cada fonte de Ceifa a mais soma +1 ao limite)', 'Reaping: on kill, gain +1 action (max. 2 per turn; each extra source of Reaping adds +1 to the limit)'), suf:$t('da Ceifa', 'of Reaping'), rule:true},
  killFury:{t:()=>$t('Matança: cada abate dá +1 de dano até o fim do turno (até +5)', 'Slaughter: each kill gives +1 damage until the end of the turn (up to +5)'), suf:$t('da Matança', 'of Slaughter'), rule:true},
  killCdr:{t:()=>$t('Colheita de Almas: cada abate reduz em 1 a recarga das habilidades (até 2 por turno)', 'Soul Harvest: each kill lowers your skill cooldowns by 1 (up to 2 per turn)'), suf:$t('das Almas', 'of Souls'), rule:true},
  killStep:{t:()=>$t('Passo Leve: depois de um abate, ganha um movimento extra sem ataque (1 por turno)', 'Light Step: after a kill, gain an extra move without attacking (1 per turn)'), suf:$t('do Passo Leve', 'of the Light Step'), rule:true},
  trample:{t:()=>$t('Ao pousar, causa 1 de dano aos vizinhos', 'On landing, deals 1 damage to neighbors'), suf:$t('do Pisoteio', 'of Trampling'), rule:true},
  vamp:{t:()=>$t('Abates curam 2 de vida', 'Kills heal 2 health'), suf:$t('do Sangue', 'of Blood'), rule:true},
  thorns:{t:()=>$t('Quem te acerta leva 2 de dano', 'Whoever hits you takes 2 damage'), suf:$t('dos Espinhos', 'of Thorns'), rule:true},
  longJump:{t:()=>$t('Também salta em 3x1', 'Also leaps in 3x1'), rule:true},
  darkQuake:{t:()=>$t('Salto Sísmico causa +3 de dano', 'Seismic Leap deals +3 damage'), rule:true},
  fork:{t:()=>$t('Garfo: o golpe também atinge, com metade do dano, um inimigo a um salto em L de onde você termina', 'Fork: the blow also hits, for half damage, an enemy one L-leap from where you land'), rule:true},
  cavalry:{t:()=>$t('Galope recarrega 2 turnos mais rápido e o próximo golpe causa +2', 'Gallop recharges 2 turns faster and the next blow deals +2'), rule:true},
  aegisFirst:{t:()=>$t('O primeiro golpe que você recebe em cada andar é anulado', 'The first blow you take on each floor is nullified'), rule:true},
  pushPower:{t:()=>$t('Empurrão causa +3 de dano em quem bate em algo', 'Shove deals +3 damage to whoever hits something'), rule:true},
  fortify:{t:()=>$t('Muralha dá +4 de escudo', 'Wall gives +4 shield'), rule:true},
  ram:{t:()=>$t('Se a investida não matar, o inimigo é empurrado 1 casa e fica atordoado', 'If the charge does not kill, the enemy is pushed 1 square and stunned'), rule:true},
  pierce:{t:()=>$t('Perfurar: a investida atinge todos os inimigos na linha até a parede', 'Pierce: the charge hits every enemy in the line up to the wall'), rule:true},
  castle:{t:()=>$t('Roque: atacar um inimigo que sobrevive troca vocês de lugar e o atordoa', 'Castling: attacking an enemy that survives swaps your places and stuns it'), rule:true},
  lineGuard:{t:()=>$t('Ataques em linha causam metade do dano em você', 'Line attacks deal half damage to you'), rule:true},
  granite:{t:()=>$t('Se você não se moveu no turno: +2 de dano e recebe 1 a menos', 'If you did not move this turn: +2 damage and take 1 less'), rule:true},
  crossBeam:{t:()=>$t('Raio também atinge as linhas retas', 'Ray also hits the straight lines'), rule:true},
  pierceShot:{t:()=>$t('O ataque à distância atravessa o primeiro inimigo e atinge o seguinte', 'The ranged attack passes through the first enemy and hits the next one'), rule:true},
  stainedGlass:{t:()=>$t('Troca de Cor também dá 4 de escudo', 'Color Shift also gives 4 shield'), rule:true},
  pilgrim:{t:()=>$t('Também anda 2 casas em linha reta, trocando a cor da casa', 'Also moves 2 squares in a straight line, changing the square\'s color'), rule:true},
  rosary:{t:()=>$t('Cada abate com o Raio reduz a recarga do Raio em 1', 'Each kill with the Ray reduces the Ray\'s cooldown by 1'), rule:true},
  censer:{t:()=>$t('Trilha: casas por onde você desliza queimam por 2 turnos e causam 1 a inimigos nelas', 'Trail: squares you slide through burn for 2 turns and deal 1 to enemies on them'), rule:true},
  holy:{t:()=>$t('Troca de Cor cura 4', 'Color Shift heals 4'), rule:true},
  fury:{t:()=>$t('+2 de dano com menos da metade da vida', '+2 damage while below half health'), rule:true},
  bladeStorm:{t:()=>$t('Tempestade de Lâminas causa +3 de dano', 'Blade Storm deals +3 damage'), rule:true},
  check:{t:()=>$t('Xeque: inimigos que você ataca e não mata ficam atordoados', 'Check: enemies you attack and do not kill are stunned'), rule:true},
  mirror:{t:()=>$t('O primeiro dano que você recebe por turno volta para o atacante', 'The first damage you take each turn goes back to the attacker'), rule:true},
  escape:{t:()=>$t('Fuga Real: depois de matar, pode se mover de novo, sem atacar (1 vez por turno)', 'Royal Escape: after a kill, you may move again, without attacking (once per turn)'), rule:true},
  redSacrifice:{t:()=>$t('Sacrifício custa 1 de vida em vez de 3 e dá +1 de dano no turno', 'Sacrifice costs 1 health instead of 3 and gives +1 damage for the turn'), rule:true},
  gambit:{t:()=>$t('Gambito: começa cada andar com no máximo metade da vida, mas causa +3 de dano', 'Gambit: start each floor with at most half health, but deal +3 damage'), rule:true},
  twinSummon:{t:()=>$t('Convocar cria dois peões', 'Summon creates two pawns'), rule:true},
  sturdyPawns:{t:()=>$t('Peões aliados têm +3 de vida e +1 de dano', 'Allied pawns have +3 health and +1 damage'), rule:true},
  freeSwap:{t:()=>$t('Uma vez por turno, trocar de lugar com um aliado não gasta ação', 'Once per turn, swapping places with an ally costs no action'), rule:true},
  earlyPromo:{t:()=>$t('Peões aliados promovem a rainha já na metade do tabuleiro', 'Allied pawns promote to queen at the middle of the board'), rule:true},
  martyr:{t:()=>$t('Quando um aliado morre, você cura 3 e ganha 2 de escudo', 'When an ally dies, you heal 3 and gain 2 shield'), rule:true},
  banner:{t:()=>$t('Aliados ao seu lado causam +1 de dano e recebem 1 a menos', 'Allies next to you deal +1 damage and take 1 less'), rule:true},
  kingStep:{t:()=>$t('Pode andar 1 casa em qualquer direção', 'Can move 1 square in any direction'), rule:true},
  execute:{t:()=>$t('Xeque-mate: inimigos que ficam com menos de 3 de vida após seu golpe morrem', 'Checkmate: enemies left below 3 health after your blow die'), rule:true},
  // uber boss uniques: each copies its boss's own mechanic
  shatterCrown:{t:()=>$t('Coroa: a cada 4 turnos, seu golpe também atinge o primeiro inimigo em cada uma das 8 linhas a partir de você, com metade do dano', 'Crown: every 4 turns, your blow also hits the first enemy on each of the 8 lines from you, for half damage'), rule:true},
  spectralGuard:{t:()=>$t('Guarda Real: começa cada andar com 2 peões espectrais ao seu lado (somem no fim do andar)', 'Royal Guard: start each floor with 2 spectral pawns next to you (they vanish at the end of the floor)'), rule:true},
  momentum:{t:()=>$t('Ímpeto: o golpe ganha +1 de dano por casa entre você e o alvo, até +3 (o salto do Cavalo conta como 3)', 'Momentum: the blow gains +1 damage per square between you and the target, up to +3 (a Knight leap counts as 3)'), rule:true},
  flee:{t:()=>$t('Fuga: uma vez por andar, ao cair abaixo de 30% de vida, você salta para a casa mais segura e fica intocável até o seu turno', 'Escape: once per floor, when you drop below 30% health, you leap to the safest square and are untouchable until your turn'), rule:true},
  link:{t:()=>$t('Elo: o último inimigo que você golpeou fica ligado; ao golpear outro, o ligado leva metade do mesmo dano', 'Link: the last enemy you struck stays linked; when you strike another, the linked one takes half the same damage'), rule:true},
  forgeWalk:{t:()=>$t('Forja: lava e brasas não te queimam e você não escorrega no gelo. Terminar o turno na lava dá +2 no próximo golpe', 'Forge: lava and embers do not burn you and you do not slide on ice. Ending the turn on lava gives +2 to your next blow'), rule:true},
  supremePromo:{t:()=>$t('Promoção: uma vez por andar, ao chegar à fileira do topo, cura toda a vida e ganha +2 de dano até o fim do andar', 'Promotion: once per floor, reaching the top rank heals you fully and gives +2 damage until the end of the floor'), rule:true},
  enPassant:{t:()=>$t('En Passant: inimigos que terminam o movimento ao seu lado levam metade do seu dano', 'En Passant: enemies that end their move next to you take half your damage'), rule:true},
  // archetype rules: open to any class. Ascensions amplify them, they never require them
  ossuary:{t:()=>$t('Ossuário: +1 ao limite de aliados e os corpos duram +3 turnos', 'Ossuary: +1 to the ally limit and corpses last +3 turns'), rule:true},
  soulTithe:{t:()=>$t('Dízimo de Almas: sempre que você cria um aliado, cura 4 de vida e ganha 2 de escudo', 'Soul Tithe: whenever you create an ally, heal 4 and gain 2 shield'), rule:true},
  gravecall:{t:()=>$t('Chamado da Cova: habilidades que criam aliados recarregam 2 turnos mais rápido', 'Grave Call: skills that create allies recharge 2 turns faster'), rule:true},
  undeadFury:{t:()=>$t('Marcha Fúnebre: aliados que você cria têm +2 de dano e +25% de vida', 'Funeral March: allies you create have +2 damage and +25% health'), rule:true},
  prism:{t:()=>$t('Prisma: os elementos do equipamento ganham efeito nos golpes e habilidades (35% de chance): fogo queima a casa, gelo atordoa, raio salta para outro inimigo', "Prism: your gear's elements gain an effect on blows and skills (35% chance): fire burns the square, cold stuns, lightning jumps to another enemy"), rule:true},
  skillPower:{t:()=>$t('Conduíte: cada acerto de habilidade causa +2 de dano', 'Conduit: every skill hit deals +2 damage'), rule:true},
  skillShield:{t:()=>$t('Mana Fluida: usar uma habilidade dá 2 de escudo (1 vez por turno)', 'Fluid Mana: using a skill gives 2 shield (once per turn)'), rule:true},
  // archetype rules (round 2): poison, shield, fire, cold, blood, single target. Open to any class
  venom:{t:()=>$t('Peçonha: seus golpes e habilidades envenenam: 1 de dano por turno durante 3 turnos', 'Venom: your blows and skills poison: 1 damage per turn for 3 turns'), rule:true},
  rot:{t:()=>$t('Putrefação: inimigos envenenados recebem +30% de dano seu', 'Rot: poisoned enemies take +30% damage from you'), rule:true},
  ironSkin:{t:()=>$t('Pele de Ferro: +1 de dano a cada 5 de escudo que você tem (até +4)', 'Iron Skin: +1 damage per 5 shield you have (up to +4)'), rule:true},
  emberTrail:{t:()=>$t('Rastro de Brasas: a casa de onde você sai queima por 2 turnos', 'Ember Trail: the square you leave burns for 2 turns'), rule:true},
  kindling:{t:()=>$t('Combustão: casas em chamas causam +2 de dano a inimigos', 'Kindling: burning squares deal +2 damage to enemies'), rule:true},
  shatter:{t:()=>$t('Estilhaçar: inimigos atordoados recebem +3 de dano seu', 'Shatter: stunned enemies take +3 damage from you'), rule:true},
  bloodPrice:{t:()=>$t('Preço de Sangue: com menos da metade da vida, habilidades recarregam 1 turno mais rápido', 'Blood Price: below half health, skills recharge 1 turn faster'), rule:true},
  skillLeech:{t:()=>$t('Banquete: abates com habilidades curam 3 de vida', 'Feast: kills with skills heal 3 health'), rule:true},
  opener:{t:()=>$t('Golpe Inicial: o primeiro dano que você causa a cada inimigo é +3', 'Opening Strike: the first damage you deal to each enemy is +3'), rule:true},
  lone:{t:()=>$t('Caçador Solitário: +2 de dano contra inimigos sem outros inimigos ao lado', 'Lone Hunter: +2 damage against enemies with no other enemies next to them'), rule:true},
  ward:{t:()=>$t('Vigília: cura 1 de vida no fim de todo turno em que você não foi ferido', 'Vigil: heal 1 health at the end of every turn you were not hurt'), rule:true},
  // archetype rules (round 3): tempo, risk, crit, wealth. Open to any class; the ones with a suffix can also roll on rare items
  vigor:{t:()=>$t('Vigor: com a vida cheia, +2 de dano', 'Vigor: at full health, +2 damage'), suf:$t('do Vigor', 'of Vigor'), rule:true},
  crowd:{t:()=>$t('Multidão: +1 de dano por inimigo ao seu lado (até +3)', 'Crowd: +1 damage per enemy next to you (up to +3)'), suf:$t('da Multidão', 'of the Crowd'), rule:true},
  mercenary:{t:()=>$t('Mercenário: +1 de dano a cada 100 de ouro que você carrega (até +3)', 'Mercenary: +1 damage per 100 gold you carry (up to +3)'), suf:$t('do Mercenário', 'of the Mercenary'), rule:true},
  flow:{t:()=>$t('Fluxo: cada movimento sem atacar dá +1 de dano ao próximo golpe (até +3)', 'Flow: each move without attacking gives +1 damage to your next blow (up to +3)'), suf:$t('do Fluxo', 'of Flow'), rule:true},
  critStun:{t:()=>$t('Trovão: golpes críticos atordoam o alvo', 'Thunder: critical blows stun the target'), suf:$t('do Trovão', 'of Thunder'), rule:true},
  critHeal:{t:()=>$t('Sangue Frio: golpes críticos curam 2 de vida', 'Cold Blood: critical blows heal 2 health'), suf:$t('do Sangue Frio', 'of Cold Blood'), rule:true},
  thick:{t:()=>$t('Casca Grossa: golpes que causariam mais de 5 de dano causam 2 a menos', 'Thick Hide: blows that would deal more than 5 damage deal 2 less'), suf:$t('da Casca Grossa', 'of the Thick Hide'), rule:true},
  echoSkill:{t:()=>$t('Eco: 20% de chance de uma habilidade não entrar em recarga', 'Echo: 20% chance for a skill not to go on cooldown'), suf:$t('do Eco', 'of the Echo'), rule:true},
  bounty:{t:()=>$t('Troféu: abater um elite ou chefe cura 6 de vida', 'Trophy: killing an elite or boss heals 6 health'), suf:$t('do Troféu', 'of the Trophy'), rule:true},
  vanguard:{t:()=>$t('Vanguarda: começa cada andar com +2 de dano', 'Vanguard: start each floor with +2 damage'), suf:$t('da Vanguarda', 'of the Vanguard'), rule:true},
  lastBreath:{t:()=>$t('Último Fôlego: uma vez por andar, ao cair abaixo de 30% de vida, ganha 6 de escudo', 'Last Breath: once per floor, when you drop below 30% health, gain 6 shield'), suf:$t('do Último Fôlego', 'of the Last Breath'), rule:true},
  reprisal:{t:()=>$t('Represália: ao ser atingido, seu próximo golpe causa +3', 'Reprisal: when hit, your next blow deals +3'), suf:$t('da Represália', 'of Reprisal'), rule:true},
  // the Fallen King's uniques: build-defining rules for clearing whole floors
  regicide:{t:()=>$t('Regicídio: cada abate dá +1 ação, até 5 por turno (a Ceifa soma ao limite)', 'Regicide: each kill gives +1 action, up to 5 per turn (Reaping adds to the limit)'), rule:true},
  deathBurst:{t:()=>$t('Exílio: inimigos que você mata explodem e causam metade do golpe aos vizinhos (em cadeia)', 'Exile: enemies you kill explode and deal half the blow to their neighbors (in a chain)'), rule:true},
  cleave:{t:()=>$t('Usurpador: seu golpe também atinge os inimigos ao lado do alvo, com metade do dano', 'Usurper: your blow also hits the enemies next to the target, for half damage'), rule:true}
};
const GENERIC_RULES = ['chain','trample','vamp','thorns','killFury','killCdr','killStep','vigor','crowd','mercenary','flow','critStun','critHeal','thick','echoSkill','bounty','vanguard','lastBreath','reprisal'];

/* Uniques: only bosses (and the daily challenge) give them. Each boss carries part of the class pool, so they can be hunted. */
const UNIQUES = [
  {cls:['N'], slot:'elmo', name:$t('Elmo do Cavalo Sombrio', 'Helm of the Dark Horse'), affixes:[{k:'darkQuake'},{k:'trample'}]},
  {cls:['N'], slot:'botas', name:$t('Ferraduras do Abismo', 'Horseshoes of the Abyss'), affixes:[{k:'longJump'},{k:'hp',v:3}]},
  {cls:['N'], slot:'arma', name:$t('Lança do Garfo', 'Fork Lance'), affixes:[{k:'fork'},{k:'dmg',v:1}]},
  {cls:['N'], slot:'anel', name:$t('Rédeas de Sangue', 'Blood Reins'), affixes:[{k:'chain'},{k:'hp',v:4}]},
  {cls:['N'], slot:'anel', name:$t('Selo da Cavalaria', 'Cavalry Seal'), affixes:[{k:'cavalry'},{k:'dmg',v:1}]},
  {cls:['N'], slot:'armadura', name:$t('Barda de Obsidiana', 'Obsidian Barding'), affixes:[{k:'aegisFirst'},{k:'hp',v:6}]},
  {cls:['R'], slot:'botas', name:$t('Grevas da Fortaleza', 'Fortress Greaves'), affixes:[{k:'pushPower'},{k:'fortify'}]},
  {cls:['R'], slot:'arma', name:$t('Aríete de Ferro Negro', 'Black Iron Ram'), affixes:[{k:'ram'},{k:'dmg',v:1}]},
  {cls:['R'], slot:'anel', name:$t('Anel da Fileira', 'Ring of the Rank'), affixes:[{k:'pierce'}]},
  {cls:['R'], slot:'elmo', name:$t('Elmo do Roque', 'Castling Helm'), affixes:[{k:'castle'},{k:'hp',v:4}]},
  {cls:['R'], slot:'armadura', name:$t('Placas da Muralha Viva', 'Living Wall Plates'), affixes:[{k:'lineGuard'},{k:'hp',v:4}]},
  {cls:['R'], slot:'armadura', name:$t('Base de Granito', 'Granite Base'), affixes:[{k:'granite'},{k:'shield',v:2}]},
  {cls:['B'], slot:'elmo', name:$t('Mitra do Raio Cruzado', 'Miter of the Crossed Ray'), affixes:[{k:'crossBeam'},{k:'dmg',v:1}]},
  {cls:['B'], slot:'arma', name:$t('Báculo da Diagonal Longa', 'Crozier of the Long Diagonal'), affixes:[{k:'pierceShot'},{k:'dmg',v:1}]},
  {cls:['B'], slot:'armadura', name:$t('Vitral Sagrado', 'Sacred Stained Glass'), affixes:[{k:'stainedGlass'},{k:'holy'}]},
  {cls:['B'], slot:'botas', name:$t('Sandálias do Peregrino', 'Pilgrim\'s Sandals'), affixes:[{k:'pilgrim'},{k:'hp',v:3}]},
  {cls:['B'], slot:'anel', name:$t('Rosário de Ossos', 'Rosary of Bones'), affixes:[{k:'rosary'},{k:'hp',v:3}]},
  {cls:['B'], slot:'arma', name:$t('Incensário Profano', 'Profane Censer'), affixes:[{k:'censer'}]},
  {cls:['Q'], slot:'elmo', name:$t('Coroa da Rainha de Vidro', 'Crown of the Glass Queen'), affixes:[{k:'fury'},{k:'bladeStorm'}]},
  {cls:['Q'], slot:'arma', name:$t('Cetro do Xeque', 'Scepter of Check'), affixes:[{k:'check'},{k:'dmg',v:1}]},
  {cls:['Q'], slot:'armadura', name:$t('Vestido de Espelhos', 'Gown of Mirrors'), affixes:[{k:'mirror'},{k:'hp',v:3}]},
  {cls:['Q'], slot:'botas', name:$t('Sapatilhas da Fuga Real', 'Slippers of the Royal Escape'), affixes:[{k:'escape'}]},
  {cls:['Q'], slot:'anel', name:$t('Anel do Sacrifício Rubro', 'Ring of Crimson Sacrifice'), affixes:[{k:'redSacrifice'},{k:'hp',v:2}]},
  {cls:['Q'], slot:'arma', name:$t('Lâmina do Gambito', 'Gambit Blade'), affixes:[{k:'gambit'}]},
  {cls:['K'], slot:'arma', name:$t('Cetro do Rei Louco', 'Scepter of the Mad King'), affixes:[{k:'twinSummon'},{k:'dmg',v:1}]},
  {cls:['K'], slot:'elmo', name:$t('Coroa da Guarda', 'Crown of the Guard'), affixes:[{k:'sturdyPawns'},{k:'hp',v:3}]},
  {cls:['K'], slot:'armadura', name:$t('Manto do Roque', 'Castling Cloak'), affixes:[{k:'freeSwap'},{k:'hp',v:4}]},
  {cls:['K'], slot:'botas', name:$t('Botas da Promoção', 'Boots of Promotion'), affixes:[{k:'earlyPromo'}]},
  {cls:['K'], slot:'anel', name:$t('Anel do Mártir', 'Martyr\'s Ring'), affixes:[{k:'martyr'},{k:'hp',v:3}]},
  {cls:['K'], slot:'anel', name:$t('Estandarte Real', 'Royal Banner'), affixes:[{k:'banner'}]},
  // archetype support (any class): allies and elements
  {cls:null, slot:'elmo', name:$t('Coroa do Ossuário', 'Ossuary Crown'), affixes:[{k:'ossuary'},{k:'hp',v:4}]},
  {cls:null, slot:'armadura', name:$t('Mortalha do Dízimo', 'Tithe Shroud'), affixes:[{k:'soulTithe'},{k:'hp',v:6}]},
  {cls:null, slot:'anel', name:$t('Anel da Cova Rasa', 'Shallow Grave Ring'), affixes:[{k:'gravecall'},{k:'hp',v:3}]},
  {cls:null, slot:'botas', name:$t('Botas da Marcha Fúnebre', 'Boots of the Funeral March'), affixes:[{k:'undeadFury'},{k:'hp',v:3}]},
  {cls:null, slot:'arma', name:$t('Cetro do Arquimago', "Archmage's Scepter"), affixes:[{k:'prism'},{k:'dmg',v:1}]},
  {cls:null, slot:'elmo', name:$t('Capuz do Foco Eterno', 'Hood of Eternal Focus'), affixes:[{k:'fireDmg',v:1},{k:'coldDmg',v:1},{k:'lightDmg',v:1},{k:'cdr',v:1}]},
  {cls:null, slot:'anel', name:$t('Anel do Conduíte', 'Conduit Ring'), affixes:[{k:'skillPower'},{k:'lightDmg',v:2}]},
  {cls:null, slot:'armadura', name:$t('Manto da Mana Fluida', 'Fluid Mana Mantle'), affixes:[{k:'skillShield'},{k:'hp',v:4}]},
  // archetype support, round 2 (any class)
  {cls:null, slot:'arma', name:$t('Presa da Víbora', 'Viper Fang'), affixes:[{k:'venom'},{k:'dmg',v:1}]},
  {cls:null, slot:'elmo', name:$t('Capuz da Podridão', 'Hood of Rot'), affixes:[{k:'rot'},{k:'hp',v:3}]},
  {cls:null, slot:'armadura', name:$t('Couraça de Ferro Frio', 'Cold Iron Cuirass'), affixes:[{k:'ironSkin'},{k:'shield',v:3}]},
  {cls:null, slot:'botas', name:$t('Botas Incandescentes', 'Glowing Boots'), affixes:[{k:'emberTrail'},{k:'resFire',v:15}]},
  {cls:null, slot:'arma', name:$t('Maça do Braseiro', 'Brazier Mace'), affixes:[{k:'kindling'},{k:'fireDmg',v:1}]},
  {cls:null, slot:'elmo', name:$t('Coroa de Geada', 'Frost Crown'), affixes:[{k:'shatter'},{k:'coldDmg',v:1}]},
  {cls:null, slot:'anel', name:$t('Anel do Preço de Sangue', 'Blood Price Ring'), affixes:[{k:'bloodPrice'},{k:'hp',v:3}]},
  {cls:null, slot:'armadura', name:$t('Manto do Banquete', 'Feast Mantle'), affixes:[{k:'skillLeech'},{k:'hp',v:4}]},
  {cls:null, slot:'arma', name:$t('Adaga do Primeiro Golpe', 'First Strike Dagger'), affixes:[{k:'opener'},{k:'crit',v:8}]},
  {cls:null, slot:'anel', name:$t('Anel do Caçador Solitário', 'Lone Hunter Ring'), affixes:[{k:'lone'},{k:'dmg',v:1}]},
  {cls:null, slot:'botas', name:$t('Botas da Vigília', 'Vigil Boots'), affixes:[{k:'ward'},{k:'hp',v:3}]},
  // archetype support, round 3 (any class)
  {cls:null, slot:'arma', name:$t('Cutelo do Mercenário', 'Mercenary Cleaver'), affixes:[{k:'mercenary'},{k:'dmg',v:1}]},
  {cls:null, slot:'arma', name:$t('Martelo da Multidão', 'Crowd Hammer'), affixes:[{k:'crowd'},{k:'dmg',v:1}]},
  {cls:null, slot:'arma', name:$t('Rapieira do Fluxo', 'Rapier of Flow'), affixes:[{k:'flow'},{k:'crit',v:8}]},
  {cls:null, slot:'arma', name:$t('Machado do Trovão', 'Thunder Axe'), affixes:[{k:'critStun'},{k:'crit',v:10}]},
  {cls:null, slot:'arma', name:$t('Foice do Caçador de Troféus', 'Trophy Hunter Scythe'), affixes:[{k:'bounty'},{k:'eliteDmg',v:15}]},
  {cls:null, slot:'elmo', name:$t('Elmo do Vigor', 'Helm of Vigor'), affixes:[{k:'vigor'},{k:'hp',v:5}]},
  {cls:null, slot:'elmo', name:$t('Máscara do Sangue Frio', 'Mask of Cold Blood'), affixes:[{k:'critHeal'},{k:'crit',v:8}]},
  {cls:null, slot:'elmo', name:$t('Capacete da Vanguarda', 'Vanguard Helm'), affixes:[{k:'vanguard'},{k:'hp',v:3}]},
  {cls:null, slot:'elmo', name:$t('Cocar do Eco', 'Echo Headdress'), affixes:[{k:'echoSkill'},{k:'cdr',v:1}]},
  {cls:null, slot:'elmo', name:$t('Diadema do Rancor', 'Diadem of Spite'), affixes:[{k:'reprisal'},{k:'shield',v:2}]},
  {cls:null, slot:'armadura', name:$t('Gibão do Último Fôlego', 'Last Breath Doublet'), affixes:[{k:'lastBreath'},{k:'hp',v:6}]},
  {cls:null, slot:'armadura', name:$t('Cota da Casca Grossa', 'Thick Hide Mail'), affixes:[{k:'thick'},{k:'hp',v:5}]},
  {cls:null, slot:'armadura', name:$t('Manto do Caçador de Troféus', 'Trophy Hunter Cloak'), affixes:[{k:'bounty'},{k:'hp',v:4}]},
  {cls:null, slot:'armadura', name:$t('Armadura do Vigor', 'Armor of Vigor'), affixes:[{k:'vigor'},{k:'shield',v:2}]},
  {cls:null, slot:'armadura', name:$t('Túnica do Eco', 'Tunic of the Echo'), affixes:[{k:'echoSkill'},{k:'hp',v:4}]},
  {cls:null, slot:'botas', name:$t('Botas do Passo Ligeiro', 'Boots of the Light Stride'), affixes:[{k:'flow'},{k:'hp',v:3}]},
  {cls:null, slot:'botas', name:$t('Sandálias da Vanguarda', 'Vanguard Sandals'), affixes:[{k:'vanguard'},{k:'hp',v:3}]},
  {cls:null, slot:'botas', name:$t('Grevas da Casca Grossa', 'Thick Hide Greaves'), affixes:[{k:'thick'},{k:'resCold',v:15}]},
  {cls:null, slot:'botas', name:$t('Botas do Mercenário', 'Mercenary Boots'), affixes:[{k:'mercenary'},{k:'gold',v:25}]},
  {cls:null, slot:'botas', name:$t('Botas do Rancor', 'Boots of Spite'), affixes:[{k:'reprisal'},{k:'hp',v:3}]},
  {cls:null, slot:'anel', name:$t('Anel do Trovão', 'Thunder Ring'), affixes:[{k:'critStun'},{k:'crit',v:8}]},
  {cls:null, slot:'anel', name:$t('Anel do Sangue Frio', 'Cold Blood Ring'), affixes:[{k:'critHeal'},{k:'hp',v:3}]},
  {cls:null, slot:'anel', name:$t('Anel da Multidão', 'Crowd Ring'), affixes:[{k:'crowd'},{k:'hp',v:3}]},
  {cls:null, slot:'anel', name:$t('Anel do Último Fôlego', 'Last Breath Ring'), affixes:[{k:'lastBreath'},{k:'shield',v:2}]},
  {cls:null, slot:'anel', name:$t('Anel do Eco', 'Echo Ring'), affixes:[{k:'echoSkill'},{k:'mf',v:15}]},
  {cls:null, slot:'arma', name:$t('Lâmina da Corrente Rubra', 'Blade of the Crimson Chain'), affixes:[{k:'chain'},{k:'dmg',v:2}]},
  {cls:null, slot:'anel', name:$t('Anel da Sede Negra', 'Ring of Black Thirst'), affixes:[{k:'vamp'},{k:'thorns'}]},
  {cls:null, slot:'botas', name:$t('Botas do Peão Ancestral', 'Boots of the Ancestral Pawn'), affixes:[{k:'kingStep'},{k:'shield',v:2}]},
  {cls:null, slot:'armadura', name:$t('Peitoral do Xeque-Mate', 'Checkmate Breastplate'), affixes:[{k:'execute'},{k:'hp',v:8}]}
];
// how a boss turns the relic it wields into a power
const BOSS_ITEM_MAP = {
  chain:'double', vamp:'vamp', thorns:'thorns', trample:'trample', twinSummon:'fastSummon', bladeStorm:'double',
  darkQuake:'trample', pushPower:'armor', fortify:'armor', holy:'regen', fury:'double', longJump:'swift',
  kingStep:'swift', fork:'double', cavalry:'swift', aegisFirst:'armor', ram:'armor', pierce:'double',
  castle:'armor', lineGuard:'armor', granite:'armor', crossBeam:'double', pierceShot:'double', stainedGlass:'regen',
  pilgrim:'swift', rosary:'regen', censer:'trample', check:'double', mirror:'thorns', escape:'swift',
  redSacrifice:'vamp', gambit:'double', sturdyPawns:'armor', freeSwap:'swift', earlyPromo:'fastSummon',
  martyr:'regen', banner:'armor', execute:'double',
  shatterCrown:'double', spectralGuard:'fastSummon', momentum:'swift', flee:'swift', link:'double', forgeWalk:'armor',
  ossuary:'armor', soulTithe:'regen', gravecall:'fastSummon', undeadFury:'double',
  prism:'double', skillPower:'double', skillShield:'armor',
  venom:'vamp', rot:'thorns', ironSkin:'armor', emberTrail:'lavaTrail', kindling:'lavaTrail', shatter:'frost', bloodPrice:'vamp', skillLeech:'vamp', opener:'swift', lone:'double', ward:'regen',
  vigor:'regen', crowd:'trample', mercenary:'double', flow:'swift', critStun:'double', critHeal:'vamp', thick:'armor', echoSkill:'fastSummon', bounty:'vamp', vanguard:'swift', lastBreath:'armor', reprisal:'thorns',
  supremePromo:'regen', enPassant:'thorns', regicide:'double', deathBurst:'explode', cleave:'double', killFury:'double', killCdr:'fastSummon', killStep:'swift'
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
  // uber: one of that boss's own two uniques, plus one from the shared uber pool; the Fallen King: two of his three
  if (S.exp.kind==='uber') return [makeUnique(pick(UBER_OWN[bossId] || UBER_OWN.queen)), makeUnique(pick(UBER_UNIQUES))];
  if (S.exp.kind==='pinnacle') return shuffle(FALLEN_UNIQUES).slice(0,2).map(U => makeUnique(U));
  let pool = shuffle(bossTable(bossId, S.cls).filter(U => !S.seen.has(U.name)));
  if (pool.length<2) pool = pool.concat(shuffle(classUniques(S.cls).filter(U => !S.seen.has(U.name) && !pool.includes(U))));
  const want = (S.mapAff && S.mapAff.has('rRelic') ? 3 : 2) + atlasRank('aRelic') + atlasRank('kDuel');
  const out = pool.slice(0,want).map(U => makeUnique(U));
  while (out.length<want) out.push(rollItem('rare', areaIlvl()));
  out.forEach(it => S.seen.add(it.name));
  return out;
}
function makeMap(tier, forceBiome){
  tier = Math.max(1, Math.min(10, tier));
  const biome = forceBiome || pick(Math.random() < .3 ? MAP_BIOMES : ACTS), boss = pick(BOSS_ORDER);
  const n = Math.min(4, 1 + Math.floor(tier/3) + rint(2)), nr = 1 + Math.floor(tier/4);
  const keys = Object.keys(MAP_AFFIXES);
  const affixes = shuffle(keys.filter(k => !isRewardAffix(k))).slice(0, n).concat(shuffle(keys.filter(isRewardAffix)).slice(0, nr));
  return {id:++uid, kind:'map', tier, biome, boss, affixes};
}
const mapName = m => $t(`${BIOMES[m.biome].name}, nível ${m.tier}`, `${BIOMES[m.biome].name}, tier ${m.tier}`);
function itemPrice(it){ return Math.round((({common:8, magic:20, rare:55, legend:150})[it.rar] || 10) * (1 + (it.ilvl||1)/10)); }
const sellPrice = it => Math.max(1, Math.floor(itemPrice(it)/4));
