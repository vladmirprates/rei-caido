/* Rei Caído — the other ascensions (13). Each one: a skill that replaces a base skill, an 8-node tree (the last is the keystone),
   and an emblem drawn on the piece.
   Shared modifiers read by every ascension skill: ascDmg, ascCd, ascStun, ascBurn, ascHeal, ascShield, ascKillCd, ascKillAct. */

const A_ = (n, v) => ({k:'asc', n, v});
const REQS = [[], ['n1'], ['n1'], ['n2'], ['n3'], ['n4','n5'], ['n6'], ['n7']];
// rows: [namePt, nameEn, descPt, descEn, aff[]]; the 8th row is the keystone
const tree = rows => rows.map((r, i) => ({id:'n'+(i+1), name:$t(r[0], r[1]), req:REQS[i], d:$t(r[2], r[3]), aff:r[4], key:i===7}));

/* ---------- shared helpers ---------- */
const ascHit = (e, amt) => skillHit(e, amt);   // damage, stun, burn of the skill's tree branch are applied inside skillHit
const adjEnemies = () => ALL.map(([dx,dy]) => enemyAt(S.player.x+dx, S.player.y+dy)).filter(Boolean);
const fireOn = (x, y, t) => { if (inb(x,y) && !isWall(x,y)) S.fire.set(key(x,y), t); };

Object.assign(ASC, {
  /* ===== KING ===== */
  regent:{cls:'K', skill:'decree', replaces:'rally', name:$t('Regente', 'Regent'),
    pitch:$t('O rei que governa um exército. O Decreto Real fortalece todos os aliados de uma vez e o seu reino cresce junto com você.', 'The king who rules an army. The Royal Decree strengthens every ally at once, and your realm grows with you.'),
    base:[{k:'asc', n:'decree'}],
    nodes:tree([
      ['Voz de Comando', 'Voice of Command', 'Decreto Real recarrega 1 turno mais rápido', 'Royal Decree recharges 1 turn faster', [A_('ascCd',1)]],
      ['Corte Leal', 'Loyal Court', '+1 ao limite de aliados', '+1 to the ally limit', [A_('allyCap',1)]],
      ['Armadura da Guarda', 'Guard Armor', 'O Decreto dá +1 de escudo a você por aliado', 'The Decree gives you +1 shield per ally', [A_('regShield',1)]],
      ['Ordem Dupla', 'Double Order', 'O Decreto também faz os aliados agirem agora', 'The Decree also makes your allies act now', [A_('regOrder')]],
      ['Estandarte Vivo', 'Living Banner', 'Aliados ao seu lado causam +1 de dano e recebem 1 a menos', 'Allies next to you deal +1 damage and take 1 less', [{k:'banner'}]],
      ['Decreto Pleno', 'Full Decree', 'O Decreto cura os aliados por completo', 'The Decree fully heals your allies', [A_('decFull')]],
      ['Guarda de Ferro', 'Iron Guard', 'Peões aliados têm +3 de vida e +1 de dano', 'Allied pawns have +3 health and +1 damage', [{k:'sturdyPawns'}, {k:'hp', v:3}]],
      ['Soberano', 'Sovereign', 'O Decreto dá +3 de dano a cada aliado, sem limite de acúmulo', 'The Decree gives each ally +3 damage, with no stacking limit', [A_('regKing')]]
    ])},
  duelist:{cls:'K', skill:'duel', replaces:'command', name:$t('Duelista', 'Duelist'),
    pitch:$t('O rei que luta na linha de frente. O Duelo Real castiga um único inimigo com precisão e fecha a luta rápido.', 'The king who fights on the front line. The Royal Duel punishes a single enemy with precision and ends the fight fast.'),
    base:[{k:'asc', n:'duel'}],
    nodes:tree([
      ['Esgrima', 'Fencing', 'O Duelo causa +2 de dano', 'The Duel deals +2 damage', [A_('ascDmg',2)]],
      ['Estocada Limpa', 'Clean Thrust', 'O Duelo recarrega 1 turno mais rápido', 'The Duel recharges 1 turn faster', [A_('ascCd',1)]],
      ['Pé Firme', 'Steady Footing', '10% de chance de bloquear metade de um golpe', '10% chance to block half of a blow', [{k:'block', v:10}]],
      ['Xeque', 'Check', 'O Duelo atordoa o alvo', 'The Duel stuns the target', [A_('ascStun')]],
      ['Resposta', 'Riposte', 'Usar o Duelo cura 3 de vida', 'Using the Duel heals 3 health', [A_('ascHeal',3)]],
      ['Duelo de Honra', 'Duel of Honor', 'O Duelo mata inimigos comuns que ficam com menos de 40% da vida', 'The Duel kills regular enemies left below 40% health', [A_('duelExec')]],
      ['Ponto Fraco', 'Weak Point', '+15% de chance de crítico', '+15% critical chance', [{k:'crit', v:15}]],
      ['Rei Duelista', 'Duelist King', 'Abater com o Duelo dá +1 ação e zera a recarga dele', 'Killing with the Duel gives +1 action and resets its cooldown', [A_('ascKillAct'), A_('ascKillCd', 99)]]
    ])},

  /* ===== KNIGHT ===== */
  lancer:{cls:'N', skill:'lance', replaces:'neigh', name:$t('Lanceiro', 'Lancer'),
    pitch:$t('Um cavaleiro de justa. A Lançada acerta de longe em linha reta e se transforma em avanço quando mata.', 'A jousting knight. The Lance Thrust strikes from afar in a straight line and turns into an advance when it kills.'),
    base:[{k:'asc', n:'lance'}],
    nodes:tree([
      ['Ponta Afiada', 'Sharp Point', 'A Lançada causa +2 de dano', 'The Lance Thrust deals +2 damage', [A_('ascDmg',2)]],
      ['Haste Longa', 'Long Haft', 'A Lançada alcança +1 casa', 'The Lance Thrust reaches +1 square', [A_('lanceReach',1)]],
      ['Corcel Treinado', 'Trained Steed', '+4 de vida máxima', '+4 max health', [{k:'hp', v:4}]],
      ['Trespassar', 'Run Through', 'A Lançada também atinge o inimigo logo atrás do alvo', 'The Lance Thrust also hits the enemy right behind the target', [A_('lanceThrough')]],
      ['Ímpeto de Justa', 'Joust Momentum', 'Abater com a Lançada reduz a recarga dela em 2', 'Killing with the Lance Thrust lowers its cooldown by 2', [A_('ascKillCd',2)]],
      ['Avanço Mortal', 'Deadly Advance', 'Se a Lançada matar, você avança para a casa do alvo', 'If the Lance Thrust kills, you advance to the target\'s square', [A_('lanceStep')]],
      ['Ímpeto', 'Momentum', 'O golpe ganha +1 de dano por casa entre você e o alvo (até +3)', 'The blow gains +1 damage per square between you and the target (up to +3)', [{k:'momentum'}]],
      ['Quebra-Reinos', 'Realm-Breaker', 'A Lançada atinge todos os inimigos da linha e os atordoa', 'The Lance Thrust hits every enemy on the line and stuns them', [A_('lanceBreak')]]
    ])},
  dread:{cls:'N', skill:'feast', replaces:'kick', name:$t('Cavaleiro Sombrio', 'Dread Knight'),
    pitch:$t('Um cavaleiro que se alimenta da luta. O Banquete Sombrio fere em salto em L e devolve a vida que tira.', 'A knight that feeds on the fight. The Dread Feast strikes at an L-leap and gives back the life it takes.'),
    base:[{k:'asc', n:'feast'}],
    nodes:tree([
      ['Sede', 'Thirst', 'O Banquete cura +1 por inimigo atingido', 'The Feast heals +1 per enemy hit', [A_('feastHeal',1)]],
      ['Pele Escura', 'Dark Hide', '+5 de vida máxima', '+5 max health', [{k:'hp', v:5}]],
      ['Pavor', 'Dread', 'O Banquete atordoa os inimigos atingidos', 'The Feast stuns the enemies it hits', [A_('ascStun')]],
      ['Alma Negra', 'Black Soul', 'Abates curam 2 de vida', 'Kills heal 2 health', [{k:'vamp'}]],
      ['Banquete Voraz', 'Voracious Feast', 'O Banquete recarrega 1 turno mais rápido', 'The Feast recharges 1 turn faster', [A_('ascCd',1)]],
      ['Fome Eterna', 'Endless Hunger', 'A cura acima da vida máxima vira escudo', 'Healing above max health becomes shield', [A_('feastOver')]],
      ['Maldição', 'Curse', 'O Banquete causa +2 de dano', 'The Feast deals +2 damage', [A_('ascDmg',2)]],
      ['Corcel das Trevas', 'Steed of Darkness', 'O Banquete também atinge os inimigos vizinhos', 'The Feast also hits neighboring enemies', [A_('feastAll')]]
    ])},

  /* ===== ROOK ===== */
  bulwark:{cls:'R', skill:'barricade', replaces:'shove', name:$t('Baluarte', 'Bulwark'),
    pitch:$t('A torre que não cai. A Barricada afasta quem chega perto e transforma cada inimigo em escudo para você.', 'The tower that does not fall. The Barricade pushes back whoever gets close and turns every enemy into shield for you.'),
    base:[{k:'asc', n:'barricade'}],
    nodes:tree([
      ['Pés de Pedra', 'Stone Feet', 'Se você não se moveu: +2 de dano e recebe 1 a menos', 'If you did not move: +2 damage and take 1 less', [{k:'granite'}]],
      ['Couraça', 'Cuirass', '+3 de escudo por andar', '+3 shield per floor', [{k:'shield', v:3}]],
      ['Barricada Firme', 'Firm Barricade', 'A Barricada dá +1 de escudo por inimigo', 'The Barricade gives +1 shield per enemy', [A_('barShield',1)]],
      ['Contra-Golpe', 'Counterstrike', 'Quem te acerta leva 2 de dano', 'Whoever hits you takes 2 damage', [{k:'thorns'}]],
      ['Muralha Viva', 'Living Wall', 'Ataques em linha causam metade do dano em você', 'Line attacks deal half damage to you', [{k:'lineGuard'}]],
      ['Recuo Forçado', 'Forced Retreat', 'A Barricada recarrega 1 turno mais rápido', 'The Barricade recharges 1 turn faster', [A_('ascCd',1)]],
      ['Peso', 'Weight', 'A Barricada causa +3 de dano', 'The Barricade deals +3 damage', [A_('ascDmg',3)]],
      ['Bastião Inabalável', 'Unshakable Bastion', 'A Barricada dá pelo menos 8 de escudo, mesmo sem inimigos por perto', 'The Barricade gives at least 8 shield, even with no enemies nearby', [A_('barFort')]]
    ])},
  siege:{cls:'R', skill:'catapult', replaces:'tremor', name:$t('Sitiador', 'Siegebreaker'),
    pitch:$t('A torre de cerco. A Catapulta arremessa um golpe pesado em linha reta e estilhaça os vizinhos do alvo.', 'The siege tower. The Catapult hurls a heavy blow in a straight line and shatters the target\'s neighbors.'),
    base:[{k:'asc', n:'catapult'}],
    nodes:tree([
      ['Contrapeso', 'Counterweight', 'A Catapulta causa +2 de dano', 'The Catapult deals +2 damage', [A_('ascDmg',2)]],
      ['Munição Pesada', 'Heavy Ammunition', 'Os vizinhos do alvo levam o dano total', 'The target\'s neighbors take full damage', [A_('sgFull')]],
      ['Alcance', 'Range', 'A Catapulta alcança +2 casas', 'The Catapult reaches +2 squares', [A_('sgReach',2)]],
      ['Fogo Grego', 'Greek Fire', 'A Catapulta queima as casas atingidas', 'The Catapult burns the squares it hits', [A_('ascBurn')]],
      ['Alvo Marcado', 'Marked Target', '+20% de dano contra elites e chefes', '+20% damage against elites and bosses', [{k:'eliteDmg', v:20}]],
      ['Recarga Rápida', 'Quick Reload', 'A Catapulta recarrega 1 turno mais rápido', 'The Catapult recharges 1 turn faster', [A_('ascCd',1)]],
      ['Golpe Certeiro', 'True Hit', '+12% de chance de crítico', '+12% critical chance', [{k:'crit', v:12}]],
      ['Trabuco Colossal', 'Colossal Trebuchet', 'A Catapulta atinge um raio de 2 casas e causa +4 de dano', 'The Catapult hits a radius of 2 squares and deals +4 damage', [A_('sgColossus')]]
    ])},
  forge:{cls:'R', skill:'embers', replaces:'fortress', name:$t('Mestre da Forja', 'Forgemaster'),
    pitch:$t('A torre que vive no fogo. A Muralha de Brasas incendeia o chão ao seu redor e o protege com escudo.', 'The tower that lives in fire. The Wall of Embers sets the ground around you ablaze and guards you with shield.'),
    base:[{k:'asc', n:'embers'}],
    nodes:tree([
      ['Fornalha', 'Furnace', 'A Muralha de Brasas dá +2 de escudo', 'The Wall of Embers gives +2 shield', [A_('ascShield',2)]],
      ['Brasa Viva', 'Live Coal', 'A Muralha de Brasas recarrega 1 turno mais rápido', 'The Wall of Embers recharges 1 turn faster', [A_('ascCd',1)]],
      ['Pele de Cinzas', 'Ash Skin', '+30% de resistência a fogo', '+30% fire resistance', [{k:'resFire', v:30}]],
      ['Ferro Quente', 'Hot Iron', '+2 de dano de fogo', '+2 fire damage', [{k:'fireDmg', v:2}]],
      ['Passo de Lava', 'Lava Step', 'Lava e brasas não te queimam; terminar o turno na lava dá +2 no próximo golpe', 'Lava and embers do not burn you; ending the turn on lava gives +2 to your next blow', [{k:'forgeWalk'}]],
      ['Anel Maior', 'Wider Ring', 'As brasas cobrem um raio de 2 casas', 'The embers cover a radius of 2 squares', [A_('forgeRing')]],
      ['Sangue de Magma', 'Magma Blood', '+6 de vida máxima', '+6 max health', [{k:'hp', v:6}]],
      ['Coração da Forja', 'Heart of the Forge', 'As brasas duram 6 turnos e a Muralha causa 2 de dano aos vizinhos', 'The embers last 6 turns and the Wall deals 2 damage to neighbors', [A_('forgeHeart')]]
    ])},

  /* ===== BISHOP ===== */
  inquisitor:{cls:'B', skill:'sentence', replaces:'judge', name:$t('Inquisidor', 'Inquisitor'),
    pitch:$t('O bispo que julga e executa. A Sentença marca o alvo e o executa quando ele já está ferido.', 'The bishop who judges and executes. The Sentence marks the target and executes it once it is already hurt.'),
    base:[{k:'asc', n:'sentence'}],
    nodes:tree([
      ['Zelo', 'Zeal', 'A Sentença causa +2 de dano', 'The Sentence deals +2 damage', [A_('ascDmg',2)]],
      ['Veredito Rápido', 'Swift Verdict', 'A Sentença recarrega 1 turno mais rápido', 'The Sentence recharges 1 turn faster', [A_('ascCd',1)]],
      ['Fé Inabalável', 'Unshaken Faith', '+4 de vida máxima', '+4 max health', [{k:'hp', v:4}]],
      ['Marca Longa', 'Long Mark', 'A marca de julgamento dura +1 turno', 'The judgment mark lasts +1 turn', [A_('senMark',1)]],
      ['Penitência', 'Penance', 'A Sentença cura 2 de vida', 'The Sentence heals 2 health', [A_('ascHeal',2)]],
      ['Corte Final', 'Final Cut', 'A Sentença executa inimigos comuns com menos de 50% de vida (antes, 25%)', 'The Sentence executes regular enemies below 50% health (was 25%)', [A_('senExec',25)]],
      ['Cruzada', 'Crusade', '+25% de dano contra elites e chefes', '+25% damage against elites and bosses', [{k:'eliteDmg', v:25}]],
      ['Grande Inquisidor', 'Grand Inquisitor', 'Executar com a Sentença zera a recarga dela', 'Executing with the Sentence resets its cooldown', [A_('senChain')]]
    ])},
  saint:{cls:'B', skill:'benediction', replaces:'radiance', name:$t('Santo', 'Saint'),
    pitch:$t('O bispo que cura e protege. A Bênção restaura você e os aliados e afasta quem está perto.', 'The bishop who heals and protects. The Benediction restores you and your allies and holds back whoever is close.'),
    base:[{k:'asc', n:'benediction'}],
    nodes:tree([
      ['Mãos Sagradas', 'Sacred Hands', 'A Bênção cura +3 de vida', 'The Benediction heals +3 health', [A_('benHeal',3)]],
      ['Escudo da Fé', 'Shield of Faith', 'A Bênção dá +3 de escudo', 'The Benediction gives +3 shield', [A_('ascShield',3)]],
      ['Graça', 'Grace', 'Troca de Cor cura 4', 'Color Shift heals 4', [{k:'holy'}]],
      ['Oração Rápida', 'Quick Prayer', 'A Bênção recarrega 1 turno mais rápido', 'The Benediction recharges 1 turn faster', [A_('ascCd',1)]],
      ['Luz Cegante', 'Blinding Light', 'A Bênção atordoa os inimigos vizinhos', 'The Benediction stuns neighboring enemies', [A_('ascStun')]],
      ['Vitral', 'Stained Glass', 'Troca de Cor também dá 4 de escudo', 'Color Shift also gives 4 shield', [{k:'stainedGlass'}]],
      ['Santuário', 'Sanctuary', '12% de chance de bloquear metade de um golpe', '12% chance to block half of a blow', [{k:'block', v:12}]],
      ['Santo Padroeiro', 'Patron Saint', 'Uma vez por andar, ao cair, você sobrevive com 1 de vida', 'Once per floor, when you would fall, you survive with 1 health', [{k:'lastStand'}]]
    ])},
  heretic:{cls:'B', skill:'plague', replaces:'beam', name:$t('Herege', 'Heretic'),
    pitch:$t('O bispo que corrompe. A Praga Diagonal envenena tudo o que atravessa e o veneno se espalha na morte.', 'The bishop who corrupts. The Diagonal Plague poisons everything it crosses and the poison spreads on death.'),
    base:[{k:'asc', n:'plague'}],
    nodes:tree([
      ['Veneno Forte', 'Strong Venom', 'O veneno causa +1 de dano por turno', 'The poison deals +1 damage per turn', [A_('plagueDmg',1)]],
      ['Praga Duradoura', 'Lasting Plague', 'O veneno dura +2 turnos', 'The poison lasts +2 turns', [A_('plagueDur',2)]],
      ['Pacto Obscuro', 'Dark Pact', '+10% de chance de crítico', '+10% critical chance', [{k:'crit', v:10}]],
      ['Contágio', 'Contagion', 'Quando um envenenado morre, o veneno passa aos vizinhos', 'When a poisoned enemy dies, the poison passes to its neighbors', [A_('plagueSpread')]],
      ['Raio Cruzado', 'Crossed Ray', 'A Praga também atravessa as linhas retas', 'The Plague also crosses the straight lines', [{k:'crossBeam'}]],
      ['Recarga Impura', 'Impure Reload', 'A Praga recarrega 1 turno mais rápido', 'The Plague recharges 1 turn faster', [A_('ascCd',1)]],
      ['Dreno', 'Drain', 'Cura 2 ao matar', 'Heal 2 on kill', [{k:'healKill', v:2}]],
      ['Heresiarca', 'Heresiarch', 'Envenenados que morrem explodem: 4 de dano aos vizinhos', 'Poisoned enemies that die explode: 4 damage to neighbors', [A_('plagueBoom')]]
    ])},

  /* ===== QUEEN ===== */
  blood:{cls:'Q', skill:'frenzy', replaces:'sacrifice', name:$t('Rainha Rubra', 'Crimson Queen'),
    pitch:$t('A rainha que paga em sangue. O Frenesi Rubro troca um pouco de vida por ações e dano, e a carnificina devolve o que custou.', 'The queen who pays in blood. The Crimson Frenzy trades some health for actions and damage, and the carnage gives back what it cost.'),
    base:[{k:'asc', n:'frenzy'}],
    nodes:tree([
      ['Sede', 'Thirst', 'O Frenesi dá +1 de dano a mais no turno', 'The Frenzy gives +1 more damage this turn', [A_('frenzyDmg',1)]],
      ['Pele Rubra', 'Crimson Skin', '+5 de vida máxima', '+5 max health', [{k:'hp', v:5}]],
      ['Frenesi Curto', 'Short Frenzy', 'O Frenesi recarrega 1 turno mais rápido', 'The Frenzy recharges 1 turn faster', [A_('ascCd',1)]],
      ['Sangue Fácil', 'Easy Blood', 'O Frenesi custa 1 de vida a menos (mínimo 1)', 'The Frenzy costs 1 less health (minimum 1)', [A_('frenzyCost',1)]],
      ['Matança', 'Slaughter', 'Cada abate dá +1 de dano até o fim do turno (até +5)', 'Each kill gives +1 damage until the end of the turn (up to +5)', [{k:'killFury'}]],
      ['Gota de Vida', 'Drop of Life', 'Abates curam 2 de vida', 'Kills heal 2 health', [{k:'vamp'}]],
      ['Ceifa', 'Reaping', 'Ao abater, ganha +1 ação (máx. 2 por turno)', 'On kill, gain +1 action (max. 2 per turn)', [{k:'chain'}]],
      ['Rainha Carmesim', 'Crimson Queen', 'O Frenesi dá +2 ações em vez de +1', 'The Frenzy gives +2 actions instead of +1', [A_('frenzyQueen')]]
    ])},
  frost:{cls:'Q', skill:'blizzard', replaces:'storm', name:$t('Rainha do Gelo', 'Frost Queen'),
    pitch:$t('A rainha do inverno. A Nevasca congela o ar ao redor e quebra o que já está parado.', 'The winter queen. The Blizzard freezes the air around you and shatters whatever is already still.'),
    base:[{k:'asc', n:'blizzard'}],
    nodes:tree([
      ['Geada', 'Frost', '+2 de dano de gelo', '+2 cold damage', [{k:'coldDmg', v:2}]],
      ['Vento Cortante', 'Cutting Wind', 'A Nevasca causa +2 de dano', 'The Blizzard deals +2 damage', [A_('ascDmg',2)]],
      ['Pele de Gelo', 'Ice Skin', '+30% de resistência a gelo', '+30% cold resistance', [{k:'resCold', v:30}]],
      ['Estilhaçar', 'Shatter', 'Inimigos já atordoados levam o dobro de dano da Nevasca', 'Enemies already stunned take double damage from the Blizzard', [A_('blizShatter')]],
      ['Nevasca Rápida', 'Quick Blizzard', 'A Nevasca recarrega 1 turno mais rápido', 'The Blizzard recharges 1 turn faster', [A_('ascCd',1)]],
      ['Alcance Gélido', 'Frozen Reach', 'A Nevasca alcança +1 casa', 'The Blizzard reaches +1 square', [A_('blizReach',1)]],
      ['Coração Frio', 'Cold Heart', '+3 de escudo por andar', '+3 shield per floor', [{k:'shield', v:3}]],
      ['Rainha do Inverno', 'Winter Queen', 'A Nevasca atordoa todos os atingidos e dá 4 de escudo', 'The Blizzard stuns everything it hits and gives 4 shield', [A_('ascStun'), A_('ascShield',4)]]
    ])},
  assassin:{cls:'Q', skill:'shadowstep', replaces:'lunge', name:$t('Assassina', 'Assassin'),
    pitch:$t('A rainha das sombras. O Passo da Sombra salta para perto de um inimigo e o apunhala antes que ele reaja.', 'The queen of shadows. The Shadow Step jumps next to an enemy and stabs it before it can react.'),
    base:[{k:'asc', n:'shadowstep'}],
    nodes:tree([
      ['Lâmina Envenenada', 'Poisoned Blade', 'O Passo causa +2 de dano', 'The Step deals +2 damage', [A_('ascDmg',2)]],
      ['Passos Longos', 'Long Strides', 'O Passo alcança +2 casas', 'The Step reaches +2 squares', [A_('sdReach',2)]],
      ['Capuz', 'Hood', '10% de chance de bloquear metade de um golpe', '10% chance to block half of a blow', [{k:'block', v:10}]],
      ['Golpe Duplo', 'Double Strike', 'O Passo também apunhala um segundo inimigo vizinho', 'The Step also stabs a second neighboring enemy', [A_('sdTwice')]],
      ['Sombra Rápida', 'Quick Shadow', 'O Passo recarrega 1 turno mais rápido', 'The Step recharges 1 turn faster', [A_('ascCd',1)]],
      ['Ponto Vital', 'Vital Point', '+15% de chance de crítico', '+15% critical chance', [{k:'crit', v:15}]],
      ['Fuga', 'Escape', 'Uma vez por andar, ao cair abaixo de 30% de vida, você salta para a casa mais segura', 'Once per floor, below 30% health, you leap to the safest square', [{k:'flee'}]],
      ['Mestre das Sombras', 'Shadow Master', 'Abater com o Passo zera a recarga dele', 'Killing with the Step resets its cooldown', [A_('ascKillCd', 99)]]
    ])}
});

/* ---------- skills ---------- */
Object.assign(SKILLS, {
  decree:{name:$t('Decreto Real', 'Royal Decree'), cd:5, free:true,
    desc:st=>$t(`Cura os aliados em 50%${st.decFull?' (por completo)':''} e dá +${st.regKing?3:2} de dano a cada um${st.regKing?'':' (até +6)'}. Você ganha escudo por aliado${st.regOrder?'. Os aliados agem agora':''}. Não gasta ação`, `Heals allies by 50%${st.decFull?' (fully)':''} and gives each +${st.regKing?3:2} damage${st.regKing?'':' (up to +6)'}. You gain shield per ally${st.regOrder?'. Allies act now':''}. Costs no action`),
    can:() => S.allies.length > 0,
    async run(){
      const st = stats();
      for (const a of S.allies){
        a.hp = st.decFull ? a.maxHp : Math.min(a.maxHp, a.hp + Math.ceil(a.maxHp*.5));
        const step = st.regKing ? 3 : 2;
        if (st.regKing || (a.decree||0) < 3){ a.decree = (a.decree||0) + 1; a.dmg += step; }
        burst(a.x, a.y, '#e3b456', 8);
      }
      const sh = S.allies.length * (1 + (st.regShield||0)); S.shield += sh;
      floatText(S.player.x, S.player.y-0.3, '+'+sh+$t(' escudo', ' shield'), '#a9bfd6');
      vfx('crown', S.player.x, S.player.y, S.player.x, S.player.y, {cells:S.allies.map(a => [a.x,a.y])}); log($t('Decreto Real.', 'Royal Decree.'));
     
      if (st.regOrder) await allyPhase();
    }},
  duel:{name:$t('Duelo Real', 'Royal Duel'), cd:3, target:true, hits:true,
    desc:st=>$t(`Golpeia um vizinho com o dobro do dano (${attackDmg(st)*2+(st.ascDmg||0)})${st.ascStun?' e o atordoa':''}${st.duelExec?'. Executa comuns com menos de 40% de vida':''}`, `Strikes a neighbor for double damage (${attackDmg(st)*2+(st.ascDmg||0)})${st.ascStun?' and stuns it':''}${st.duelExec?'. Executes regular enemies below 40% health':''}`),
    targets(){ return ALL.map(([dx,dy]) => [S.player.x+dx, S.player.y+dy]).filter(([x,y]) => enemyAt(x,y)); },
    run(x,y){
      const e = enemyAt(x,y); if (!e) return; const st = stats();
      S.player.lx = Math.sign(x-S.player.x)*.35; S.player.ly = Math.sign(y-S.player.y)*.35;
      vfx('thrust', S.player.x, S.player.y, x, y);
      ascHit(e, attackDmg(st, e)*2);
      if (S.enemies.includes(e) && st.duelExec && !e.boss && e.hp*5 < e.maxHp*2) damageEnemy(e, e.hp + e.shield + 99, 'player');
      log($t('Duelo Real.', 'Royal Duel.'));
    }},
  lance:{name:$t('Lançada', 'Lance Thrust'), cd:3, target:true, hits:true,
    desc:st=>$t(`Atinge um inimigo a 2 a ${3+(st.lanceReach||0)} casas em linha reta com ${attackDmg(st)+3+(st.ascDmg||0)}, sem se mover${st.lanceThrough?' e o de trás':''}${st.lanceBreak?'. Atinge toda a linha e atordoa':''}${st.lanceStep?'. Se matar, você avança':''}`, `Hits an enemy 2 to ${3+(st.lanceReach||0)} squares away in a straight line for ${attackDmg(st)+3+(st.ascDmg||0)}, without moving${st.lanceThrough?' and the one behind':''}${st.lanceBreak?'. Hits the whole line and stuns':''}${st.lanceStep?'. If it kills, you advance':''}`),
    targets(){
      const p = S.player, st = stats(), out = [], max = 3 + (st.lanceReach||0);
      for (const [dx,dy] of ALL) for (let i=1; i<=max; i++){ const x = p.x+dx*i, y = p.y+dy*i; if (!inb(x,y) || isWall(x,y)) break; if (enemyAt(x,y)){ if (i>=2 || st.lanceBreak) out.push([x,y]); break; } }
      return out;
    },
    run(x,y){
      const st = stats(), p = S.player, dx = Math.sign(x-p.x), dy = Math.sign(y-p.y), e = enemyAt(x,y); if (!e) return;
      vfx('lance', p.x, p.y, x, y); fx.shake = Math.max(fx.shake, 6);
      const list = [e];
      if (st.lanceThrough || st.lanceBreak){ for (let cx=x+dx, cy=y+dy, i=0; inb(cx,cy) && !isWall(cx,cy) && i<(st.lanceBreak ? 6 : 1); cx+=dx, cy+=dy, i++){ const o = enemyAt(cx,cy); if (o) list.push(o); } }
      let killed = false;
      for (const t of list){ const base = attackDmg(st, t) + 3; ascHit(t, base); if (st.lanceBreak && S.enemies.includes(t)) stun(t); if (t===e && !S.enemies.includes(e)) killed = true; }
      if (killed && st.lanceStep && !occupied(x,y)) moveTo(x,y);
      log($t('Lançada.', 'Lance Thrust.'));
    }},
  feast:{name:$t('Banquete Sombrio', 'Dread Feast'), cd:3, hits:true,
    desc:st=>$t(`Atinge todos os inimigos a um salto em L${st.feastAll?' e os vizinhos':''} com ${st.dmg+1+(st.ascDmg||0)} e cura ${2+(st.feastHeal||0)} por inimigo atingido${st.ascStun?', atordoando':''}`, `Hits every enemy one L-leap away${st.feastAll?' and neighbors':''} for ${st.dmg+1+(st.ascDmg||0)} and heals ${2+(st.feastHeal||0)} per enemy hit${st.ascStun?', stunning':''}`),
    can:() => (stats().feastAll ? ALL.concat(KN) : KN).some(([dx,dy]) => enemyAt(S.player.x+dx, S.player.y+dy)),
    run(){
      const st = stats(), p = S.player, offs = st.feastAll ? KN.concat(ALL) : KN; let n = 0;
      for (const [dx,dy] of offs){ const e = enemyAt(p.x+dx,p.y+dy); if (!e) continue; n++; vfx('claw', p.x, p.y, e.x, e.y); ascHit(e, st.dmg+1); }
      if (n){
        const h = n*(2+(st.feastHeal||0)), room = Math.max(0, st.hp - S.player.hp);
        heal(Math.min(h, room));
        if (st.feastOver && h > room){ S.shield += h-room; floatText(p.x, p.y-0.3, '+'+(h-room)+$t(' escudo', ' shield'), '#a9bfd6'); }
      }
      fx.shake = Math.max(fx.shake, 6); log($t('Banquete Sombrio.', 'Dread Feast.'));
    }},
  barricade:{name:$t('Barricada', 'Barricade'), cd:3, hits:true,
    desc:st=>$t(`Empurra e atordoa os inimigos vizinhos (${Math.max(1,st.dmg-2)+(st.ascDmg||0)} de dano) e dá ${3+(st.barShield||0)} de escudo por inimigo${st.barFort?' (mínimo 8)':''}`, `Pushes and stuns neighboring enemies (${Math.max(1,st.dmg-2)+(st.ascDmg||0)} damage) and gives ${3+(st.barShield||0)} shield per enemy${st.barFort?' (minimum 8)':''}`),
    can:() => stats().barFort || adjEnemies().length > 0,
    run(){
      const st = stats(), p = S.player; let n = 0;
      vfx('wall', p.x, p.y); fx.shake = Math.max(fx.shake, 6);
      for (const [dx,dy] of ALL){ const e = enemyAt(p.x+dx,p.y+dy); if (!e) continue; n++; if (!e.boss) pushEnemy(e, dx, dy); if (!S.enemies.includes(e)) continue; stun(e); ascHit(e, Math.max(1, st.dmg-2)); }
      let sh = n*(3+(st.barShield||0)); if (st.barFort) sh = Math.max(8, sh);
      if (sh){ S.shield += sh; floatText(p.x, p.y-0.3, '+'+sh+$t(' escudo', ' shield'), '#a9bfd6'); }
      log($t('Barricada.', 'Barricade.'));
    }},
  catapult:{name:$t('Catapulta', 'Catapult'), cd:4, target:true, hits:true,
    desc:st=>{ const d = st.dmg+4+(st.sgColossus?4:0)+(st.ascDmg||0); return $t(`Arremessa um golpe de ${d} num inimigo em linha reta, a até ${5+(st.sgReach||0)} casas, e ${st.sgFull?d:Math.floor(d/2)} em ${st.sgColossus?'todos num raio de 2':'cada vizinho'} do alvo`, `Hurls a blow of ${d} at an enemy in a straight line, up to ${5+(st.sgReach||0)} squares away, and ${st.sgFull?d:Math.floor(d/2)} to ${st.sgColossus?'everything within 2':'each neighbor'} of the target`); },
    targets(){
      const p = S.player, max = 5 + (stats().sgReach||0), out = [];
      for (const [dx,dy] of ORTH) for (let i=1; i<=max; i++){ const x = p.x+dx*i, y = p.y+dy*i; if (!inb(x,y) || isWall(x,y)) break; if (enemyAt(x,y)) out.push([x,y]); }
      return out;
    },
    run(x,y){
      const st = stats(), p = S.player, e = enemyAt(x,y); if (!e) return;
      const d = st.dmg + 4 + (st.sgColossus ? 4 : 0), half = st.sgFull ? d : Math.max(1, Math.floor(d/2)), r = st.sgColossus ? 2 : 1;
      vfx('boulder', p.x, p.y, x, y, {r:r}); fx.shake = Math.max(fx.shake, 9);
      const around = S.enemies.filter(o => o!==e && cheb(o.x,o.y,x,y)<=r);
      ascHit(e, d);
      const was = S.blasting; S.blasting = true;
      for (const o of around) if (S.enemies.includes(o)) ascHit(o, half);
      S.blasting = was;
      log($t('Catapulta.', 'Catapult.'));
    }},
  embers:{name:$t('Muralha de Brasas', 'Wall of Embers'), cd:5, free:true,
    desc:st=>$t(`Ganha ${4+(st.ascShield||0)} de escudo e incendeia as casas ao redor (raio ${st.forgeRing||st.forgeHeart?2:1}) por ${st.forgeHeart?6:3} turnos${st.forgeHeart?', ferindo os vizinhos em 2':''}. Não gasta ação`, `Gain ${4+(st.ascShield||0)} shield and set the squares around you ablaze (radius ${st.forgeRing||st.forgeHeart?2:1}) for ${st.forgeHeart?6:3} turns${st.forgeHeart?', hurting neighbors for 2':''}. Costs no action`),
    run(){
      const st = stats(), p = S.player, r = (st.forgeRing || st.forgeHeart) ? 2 : 1, t = st.forgeHeart ? 6 : 3;
      S.shield += 4; floatText(p.x, p.y-0.3, '+4'+$t(' escudo', ' shield'), '#a9bfd6');
      const cells = []; for (let dy=-r; dy<=r; dy++) for (let dx=-r; dx<=r; dx++) if ((dx||dy) && inb(p.x+dx,p.y+dy) && !isWall(p.x+dx,p.y+dy)){ fireOn(p.x+dx, p.y+dy, t); cells.push([p.x+dx, p.y+dy]); }
      if (st.forgeHeart) for (const e of adjEnemies()) if (S.enemies.includes(e)) skillHit(e, 2);
      vfx('forgeburst', p.x, p.y, p.x, p.y, {r:r, cells}); fx.shake = Math.max(fx.shake, 6); sfx('fire');
      log($t('Muralha de Brasas.', 'Wall of Embers.'));
    }},
  sentence:{name:$t('Sentença', 'Sentence'), cd:4, target:true, hits:true,
    desc:st=>$t(`Atinge um inimigo nas suas diagonais com ${st.dmg+1+(st.ascDmg||0)}, o marca (+50% de dano) e executa comuns com menos de ${25+(st.senExec||0)}% de vida`, `Hits an enemy on your diagonals for ${st.dmg+1+(st.ascDmg||0)}, marks it (+50% damage) and executes regular enemies below ${25+(st.senExec||0)}% health`),
    targets(){ const p = S.player, out = [];
      for (const [dx,dy] of DIAG){ let x=p.x+dx, y=p.y+dy; while (inb(x,y) && !isWall(x,y)){ if (enemyAt(x,y)){ out.push([x,y]); break; } x+=dx; y+=dy; } }
      return out; },
    run(x,y){
      const e = enemyAt(x,y); if (!e) return; const st = stats();
      vfx('judgment', S.player.x, S.player.y, x, y);
      ascHit(e, st.dmg+1);
      if (S.enemies.includes(e)){
        e.judged = 3 + (st.senMark||0); floatText(e.x, e.y-0.4, $t('julgado', 'judged'), '#f0d68c');
        if (!e.boss && e.hp*100 <= e.maxHp*(25+(st.senExec||0))){
          damageEnemy(e, e.hp + e.shield + 99, 'player'); floatText(x, y-0.5, $t('executado', 'executed'), '#f0d68c');
          if (st.senChain) S.cds.sentence = 0;
        }
      }
      log($t('Sentença.', 'Sentence.'));
    }},
  benediction:{name:$t('Bênção', 'Benediction'), cd:5, free:true,
    desc:st=>$t(`Cura você em ${5+(st.benHeal||0)} e os aliados por completo${st.ascShield?`, dá ${st.ascShield} de escudo`:''}. Fere em 1 os vizinhos${st.ascStun?' e os atordoa':''}. Não gasta ação`, `Heals you for ${5+(st.benHeal||0)} and your allies fully${st.ascShield?`, gives ${st.ascShield} shield`:''}. Hurts neighbors for 1${st.ascStun?' and stuns them':''}. Costs no action`),
    run(){
      const st = stats(), p = S.player;
      heal(5 + (st.benHeal||0));
      for (const a of S.allies){ a.hp = a.maxHp; burst(a.x, a.y, '#f0d68c', 8); }
      for (const e of adjEnemies()) ascHit(e, 1);
      vfx('holy', p.x, p.y);
      log($t('Bênção.', 'Benediction.'));
    }},
  plague:{name:$t('Praga Diagonal', 'Diagonal Plague'), cd:3, hits:true,
    desc:st=>$t(`Atravessa as diagonais${st.crossBeam?' e retas':''} causando ${st.dmg+(st.ascDmg||0)} e envenenando por ${3+(st.plagueDur||0)} turnos (${1+(st.plagueDmg||0)} de dano por turno)`, `Pierces the diagonals${st.crossBeam?' and straight lines':''} dealing ${st.dmg+(st.ascDmg||0)} and poisoning for ${3+(st.plagueDur||0)} turns (${1+(st.plagueDmg||0)} damage per turn)`),
    run(){
      const st = stats(), p = S.player;
      for (const [dx,dy] of (st.crossBeam ? ALL : DIAG)){
        let x=p.x+dx, y=p.y+dy, ex=p.x, ey=p.y; const hits = [];
        while (inb(x,y) && !isWall(x,y)){ const e = enemyAt(x,y); if (e) hits.push(e); ex=x; ey=y; x+=dx; y+=dy; }
        if (ex!==p.x || ey!==p.y) vfx('poison', p.x, p.y, ex, ey);
        for (const e of hits){
          ascHit(e, st.dmg);
          if (S.enemies.includes(e)){ e.poisonT = 3 + (st.plagueDur||0); e.poisonD = 1 + (st.plagueDmg||0); floatText(e.x, e.y-0.4, $t('veneno', 'poison'), '#9fdc7a'); }
        }
      }
      log($t('Praga Diagonal.', 'Diagonal Plague.'));
    }},
  frenzy:{name:$t('Frenesi Rubro', 'Crimson Frenzy'), cd:3, free:true,
    desc:st=>{ const c = Math.max(1, 3-(st.frenzyCost||0)); return $t(`Perde ${c} de vida, ganha +${st.frenzyQueen?2:1} ação e +${2+(st.frenzyDmg||0)} de dano neste turno. Não gasta ação`, `Lose ${c} health, gain +${st.frenzyQueen?2:1} action and +${2+(st.frenzyDmg||0)} damage this turn. Costs no action`); },
    can:() => S.player.hp > Math.max(1, 3-(stats().frenzyCost||0)),
    run(){
      const st = stats(), c = Math.max(1, 3-(st.frenzyCost||0));
      S.player.hp -= c; S.actions += st.frenzyQueen ? 2 : 1; S.turnBonus += 2 + (st.frenzyDmg||0);
      floatText(S.player.x, S.player.y, $t(`-${c} / +${st.frenzyQueen?2:1} ação`, `-${c} / +${st.frenzyQueen?2:1} action`), '#ff6b5e'); vfx('bloodburst', S.player.x, S.player.y);
      log($t('Frenesi Rubro.', 'Crimson Frenzy.'));
    }},
  blizzard:{name:$t('Nevasca', 'Blizzard'), cd:4, hits:true,
    desc:st=>$t(`Causa ${Math.max(1, attackDmg(st)-1)+(st.ascDmg||0)} a todos num raio de ${2+(st.blizReach||0)} e atordoa os vizinhos${st.ascStun?' (todos)':''}${st.blizShatter?'. Atordoados levam o dobro':''}`, `Deals ${Math.max(1, attackDmg(st)-1)+(st.ascDmg||0)} to everything within ${2+(st.blizReach||0)} and stuns neighbors${st.ascStun?' (all)':''}${st.blizShatter?'. Stunned enemies take double':''}`),
    can:() => S.enemies.some(e => cheb(e.x,e.y,S.player.x,S.player.y) <= 2 + (stats().blizReach||0)),
    run(){
      const st = stats(), p = S.player, r = 2 + (st.blizReach||0), base = Math.max(1, attackDmg(st)-1);
      vfx('frost', p.x, p.y, p.x, p.y, {r}); fx.shake = Math.max(fx.shake, 7); sfx('cold');
      for (const e of S.enemies.filter(e => cheb(e.x,e.y,p.x,p.y) <= r)){
        const frozen = e.intent && e.intent.stunned, adj = cheb(e.x,e.y,p.x,p.y) <= 1;
        ascHit(e, st.blizShatter && frozen ? base*2 : base);
        if (adj && S.enemies.includes(e)) stun(e);
        burst(e.x, e.y, '#bfe4ff', 8);
      }
      log($t('Nevasca.', 'Blizzard.'));
    }},
  shadowstep:{name:$t('Passo da Sombra', 'Shadow Step'), cd:4, target:true, hits:true,
    desc:st=>$t(`Salta até ${4+(st.sdReach||0)} casas para perto de um inimigo e o apunhala com ${st.dmg+3+(st.ascDmg||0)}${st.sdTwice?' (e um segundo vizinho)':''}`, `Jumps up to ${4+(st.sdReach||0)} squares next to an enemy and stabs it for ${st.dmg+3+(st.ascDmg||0)}${st.sdTwice?' (and a second neighbor)':''}`),
    targets(){
      const p = S.player, r = 4 + (stats().sdReach||0), out = [];
      for (let y=p.y-r; y<=p.y+r; y++) for (let x=p.x-r; x<=p.x+r; x++){
        if (!inb(x,y) || isWall(x,y) || isPit(x,y) || isLava(x,y) || occupied(x,y)) continue;
        if (ALL.some(([dx,dy]) => enemyAt(x+dx,y+dy))) out.push([x,y]);
      }
      return out;
    },
    run(x,y){
      const st = stats(), ox = S.player.x, oy = S.player.y; vfx('shadow', ox, oy, x, y); moveTo(x,y);
      const foes = adjEnemies().sort((a,b) => a.hp-b.hp).slice(0, st.sdTwice ? 2 : 1);
      for (const e of foes){ vfx('xslash', x, y, e.x, e.y); ascHit(e, attackDmg(st, e) + 3); }
      fx.shake = Math.max(fx.shake, 6); log($t('Passo da Sombra.', 'Shadow Step.'));
    }}
});

for (const [id, A] of Object.entries(ASC)) A.id = id;
