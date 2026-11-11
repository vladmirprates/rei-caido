/* Rei Caído — Partida Congelada: a real chess puzzle inside an expedition.
   The hero and spectral pieces (white) must deliver checkmate in N moves; black defends with its best reply.
   Any line that forces mate counts, not only the book line. */

/* ---------- Engine (no castling or en passant: puzzle positions don't need them) ---------- */
const CH_DIRS = {R:ORTH, B:DIAG, Q:ALL, N:KN, K:ALL};
function chParse(fen){
  const b = new Array(64).fill(null);
  fen.split(' ')[0].split('/').forEach((row, y) => {
    let x = 0;
    for (const ch of row){
      if (/\d/.test(ch)){ x += +ch; continue; }
      b[y*8+x] = {t:ch.toUpperCase(), c: ch===ch.toUpperCase() ? 'w' : 'b'}; x++;
    }
  });
  return b;
}
const chIn = (x,y) => x>=0 && y>=0 && x<8 && y<8;
function chAttacked(b, sq, by){
  const x = sq%8, y = (sq/8)|0;
  for (const [dx,dy] of KN){ const p = chIn(x+dx,y+dy) && b[(y+dy)*8+x+dx]; if (p && p.c===by && p.t==='N') return true; }
  for (const [dx,dy] of ALL){ const p = chIn(x+dx,y+dy) && b[(y+dy)*8+x+dx]; if (p && p.c===by && p.t==='K') return true; }
  const py = by==='w' ? y+1 : y-1;   // white pawns attack upwards (towards y-1), so they sit below the square
  for (const dx of [-1,1]){ const p = chIn(x+dx,py) && b[py*8+x+dx]; if (p && p.c===by && p.t==='P') return true; }
  for (const [dx,dy] of ALL){
    const diag = dx && dy;
    for (let i=1;;i++){
      const nx = x+dx*i, ny = y+dy*i; if (!chIn(nx,ny)) break;
      const p = b[ny*8+nx]; if (!p) continue;
      if (p.c===by && (p.t==='Q' || (diag ? p.t==='B' : p.t==='R'))) return true;
      break;
    }
  }
  return false;
}
const chKing = (b, c) => b.findIndex(p => p && p.t==='K' && p.c===c);
const chInCheck = (b, c) => { const k = chKing(b,c); return k>=0 && chAttacked(b, k, c==='w' ? 'b' : 'w'); };
function chPseudo(b, c){
  const out = [];
  for (let sq=0; sq<64; sq++){
    const p = b[sq]; if (!p || p.c!==c) continue;
    const x = sq%8, y = (sq/8)|0;
    const add = (nx,ny) => { const t = b[ny*8+nx]; if (!t || t.c!==c) out.push({from:sq, to:ny*8+nx, cap:!!t}); };
    if (p.t==='P'){
      const dy = c==='w' ? -1 : 1, start = c==='w' ? 6 : 1;
      if (chIn(x,y+dy) && !b[(y+dy)*8+x]){
        out.push({from:sq, to:(y+dy)*8+x});
        if (y===start && !b[(y+2*dy)*8+x]) out.push({from:sq, to:(y+2*dy)*8+x});
      }
      for (const dx of [-1,1]){ const t = chIn(x+dx,y+dy) && b[(y+dy)*8+x+dx]; if (t && t.c!==c) out.push({from:sq, to:(y+dy)*8+x+dx, cap:true}); }
      continue;
    }
    const slide = p.t==='R' || p.t==='B' || p.t==='Q';
    for (const [dx,dy] of CH_DIRS[p.t]){
      if (!slide){ if (chIn(x+dx,y+dy)) add(x+dx,y+dy); continue; }
      for (let i=1;;i++){ const nx = x+dx*i, ny = y+dy*i; if (!chIn(nx,ny)) break; add(nx,ny); if (b[ny*8+nx]) break; }
    }
  }
  return out;
}
function chMake(b, m){
  const n = b.slice(), p = n[m.from];
  n[m.to] = p.t==='P' && (m.to<8 || m.to>=56) ? {t:'Q', c:p.c} : p;   // promotion: always a queen
  n[m.from] = null;
  return n;
}
const chLegal = (b, c) => chPseudo(b,c).filter(m => !chInCheck(chMake(b,m), c));
// a white move that forces mate within n moves, or null (checks are tried first: they decide most puzzles)
function chForce(b, n){
  const moves = chLegal(b,'w').map(m => ({m, nb:chMake(b,m)}));
  moves.sort((a,c) => chInCheck(c.nb,'b') - chInCheck(a.nb,'b'));
  for (const {m, nb} of moves){
    const replies = chLegal(nb,'b');
    if (!replies.length){ if (chInCheck(nb,'b')) return m; continue; }
    if (n>1 && replies.every(r => chForce(chMake(nb,r), n-1))) return m;
  }
  return null;
}
const chMateIn = (b, max) => { for (let n=1; n<=max; n++) if (chForce(b,n)) return n; return 0; };
// black's best defence: a reply after which white can no longer mate in time, otherwise the one that lasts longest
function chDefend(b, left){
  const replies = chLegal(b,'b'); if (!replies.length) return null;
  let best = null, bestScore = -1;
  for (const r of shuffle(replies)){
    const nb = chMake(b, r), k = left>0 ? chMateIn(nb, left) : 0;
    const score = k===0 ? 99 : k;
    if (score>bestScore){ bestScore = score; best = r; }
  }
  return best;
}

/* ---------- The ten mate patterns (white to move) ---------- */
const MATES = [
  {id:'corredor', name:'Mate do Corredor', fen:'6k1/5ppp/8/8/8/8/5PPP/4R1K1', n:1,
   tip:'O rei está preso atrás dos próprios peões. Uma peça pesada na última fileira basta.',
   power:'+2 de dano em inimigos na primeira ou na última fileira.'},
  {id:'arabe', name:'Mate Árabe', fen:'7k/1R6/5N2/8/8/8/8/6K1', n:1,
   tip:'Torre e Cavalo juntos no canto: o Cavalo protege a Torre e tira a fuga.',
   power:'+1 de dano em inimigos vizinhos a um pilar.'},
  {id:'boden', name:'Mate de Boden', fen:'2kr4/p2n4/8/8/5B2/8/8/5BK1', n:1,
   tip:'Dois Bispos cruzando diagonais contra um rei cercado pelas próprias peças.',
   power:'Seus ataques em diagonal causam +1 de dano.'},
  {id:'beijo', name:'Mate do Beijo', fen:'k7/7Q/1K6/8/8/8/8/8', n:1,
   tip:'A Dama encosta no rei inimigo, protegida pelo seu Rei.',
   power:'+1 de dano em inimigos vizinhos a você.'},
  {id:'dragona', name:'Mate das Dragonas', fen:'3rkr2/8/8/8/8/8/Q7/7K', n:1,
   tip:'As torres do rei ocupam as casas ao lado dele, como dragonas num uniforme.',
   power:'Começa cada andar com +3 de escudo.'},
  {id:'greco', name:'Mate de Greco', fen:'7k/6p1/8/8/2B5/R7/8/6K1', n:1,
   tip:'O Bispo fecha a diagonal de fuga; a Torre ataca pela coluna do rei.',
   power:'Ataques em linha reta de 2 casas ou mais causam +1 de dano.'},
  {id:'sufocado', name:'Mate Sufocado', fen:'5r1k/6pp/7N/3Q4/8/8/8/6K1', n:2,
   tip:'Sacrifique a Dama para encher a última casa de fuga. O Cavalo termina o serviço.',
   power:'+50% de dano em inimigos com 2 ou mais aliados colados neles.'},
  {id:'anastacia', name:'Mate de Anastácia', fen:'5b1k/4N1pp/8/8/4Q3/3R4/8/6K1', n:2,
   tip:'Abra a coluna do rei com um sacrifício e entre com a Torre. O Cavalo segura a fuga.',
   power:'+1 de dano em inimigos nas colunas da borda.'},
  {id:'escada', name:'Mate da Escada', fen:'6k1/8/8/8/8/8/R7/1R4K1', n:2,
   tip:'Duas Torres se revezam fileira por fileira, empurrando o rei para a borda.',
   power:'O primeiro golpe em cada andar causa +3 de dano.'},
  {id:'damiano', name:'Mate de Damiano', fen:'6k1/8/6P1/7Q/8/8/8/6K1', n:2,
   tip:'Um peão avançado protege a Dama na casa ao lado do rei.',
   power:'Ao matar, 25% de chance de reduzir em 1 a recarga de todas as habilidades.'}
];
/* Problems found by search and verified: each has exactly one key move. Short ones (mate in 1 or 2) for the
   start of the game, longer ones (mate in 3 or 4) later on. They don't teach Grimório powers. */
const PROBLEMS = [
  {id:'easy1_1', name:'Mate em 1 · I', fen:'2rb3k/1r4pp/8/5Q2/8/8/5BPP/6K1', n:1, problem:true, tip:'Use a Rainha: dê um xeque do qual o rei preto não consiga escapar.'},
  {id:'easy1_2', name:'Mate em 1 · II', fen:'6k1/5ppr/n7/Q4B2/1P6/8/R4P2/6K1', n:1, problem:true, tip:'Use a Rainha: dê um xeque do qual o rei preto não consiga escapar.'},
  {id:'easy1_3', name:'Mate em 1 · III', fen:'6k1/5ppp/4p3/8/8/8/1Q1N3P/7K', n:1, problem:true, tip:'Use a Rainha: dê um xeque do qual o rei preto não consiga escapar.'},
  {id:'easy1_4', name:'Mate em 1 · IV', fen:'7k/5ppp/4R2p/7R/8/8/5PPP/6K1', n:1, problem:true, tip:'Use a Torre: dê um xeque do qual o rei preto não consiga escapar.'},
  {id:'easy1_5', name:'Mate em 1 · V', fen:'2N3k1/2p2ppp/4B2r/3Q4/8/8/5PPP/6K1', n:1, problem:true, tip:'Use a Rainha: dê um xeque do qual o rei preto não consiga escapar.'},
  {id:'easy1_6', name:'Mate em 1 · VI', fen:'1B4k1/5pBp/6Pp/5Q2/8/8/6PP/7K', n:1, problem:true, tip:'Use a Rainha: dê um xeque do qual o rei preto não consiga escapar. O lance captura uma peça.'},
  {id:'easy1_7', name:'Mate em 1 · VII', fen:'6kB/5pp1/N2q2np/8/8/8/1Q3P1P/6K1', n:1, problem:true, tip:'Use a Rainha: dê um xeque do qual o rei preto não consiga escapar. O lance captura uma peça.'},
  {id:'easy1_8', name:'Mate em 1 · VIII', fen:'Q5qk/2q3p1/4B1P1/8/2N5/8/5PPP/6K1', n:1, problem:true, tip:'Use a Rainha: dê um xeque do qual o rei preto não consiga escapar. O lance captura uma peça.'},
  {id:'easy1_9', name:'Mate em 1 · IX', fen:'2r3kq/R1Q2ppp/2q5/8/8/8/N5PP/7K', n:1, problem:true, tip:'Use a Rainha: dê um xeque do qual o rei preto não consiga escapar. O lance captura uma peça.'},
  {id:'easy1_10', name:'Mate em 1 · X', fen:'b3p1k1/2R2ppp/6P1/8/Q7/8/1B3P2/6K1', n:1, problem:true, tip:'Use a Rainha: dê um xeque do qual o rei preto não consiga escapar. O lance captura uma peça.'},
  {id:'easy1_11', name:'Mate em 1 · XI', fen:'6k1/r4ppp/8/4R3/2N5/8/5P1P/7K', n:1, problem:true, tip:'Use a Torre: dê um xeque do qual o rei preto não consiga escapar.'},
  {id:'easy1_12', name:'Mate em 1 · XII', fen:'1b4k1/5ppp/2R5/8/8/5R2/5PPP/7K', n:1, problem:true, tip:'Use a Torre: dê um xeque do qual o rei preto não consiga escapar.'},
  {id:'easy2_1', name:'Mate em 2 · I', fen:'7k/7p/P2rb3/8/2Q5/6R1/3N1PPP/6K1', n:2, problem:true, tip:'Comece com a Rainha: um xeque. Depois o mate vem no lance seguinte.'},
  {id:'easy2_2', name:'Mate em 2 · II', fen:'7k/2B4p/n4p2/8/3Q4/8/4R2P/6K1', n:2, problem:true, tip:'Comece com a Rainha: um xeque capturando uma peça. Depois o mate vem no lance seguinte.'},
  {id:'easy2_3', name:'Mate em 2 · III', fen:'r5k1/5ppp/2q5/Q6B/8/5B2/R4PPP/6K1', n:2, problem:true, tip:'Comece com a Rainha: um xeque capturando uma peça. Depois o mate vem no lance seguinte.'},
  {id:'easy2_4', name:'Mate em 2 · IV', fen:'7k/5ppp/1r6/R7/8/8/5PPN/6K1', n:2, problem:true, tip:'Comece com a Torre: um xeque. Depois o mate vem no lance seguinte.'},
  {id:'easy2_5', name:'Mate em 2 · V', fen:'7k/2n2p2/p2Q2p1/7P/8/5NR1/5PP1/6K1', n:2, problem:true, tip:'Comece com a Rainha: um xeque. Depois o mate vem no lance seguinte.'},
  {id:'easy2_6', name:'Mate em 2 · VI', fen:'6k1/5ppp/P1R1r2r/8/8/8/6PP/6K1', n:2, problem:true, tip:'Comece com a Torre: um xeque. Depois o mate vem no lance seguinte.'},
  {id:'easy2_7', name:'Mate em 2 · VII', fen:'7k/5ppp/3P2n1/R4N2/8/8/5P1Q/7K', n:2, problem:true, tip:'Comece com a Torre: um xeque. Depois o mate vem no lance seguinte.'},
  {id:'easy2_8', name:'Mate em 2 · VIII', fen:'6k1/5ppp/1b1p4/5N2/8/8/2R2P1P/6K1', n:2, problem:true, tip:'Comece com a Torre: um xeque. Depois o mate vem no lance seguinte.'},
  {id:'easy2_9', name:'Mate em 2 · IX', fen:'1qN3k1/5ppp/2N5/1R3P2/8/8/5P1P/6K1', n:2, problem:true, tip:'Comece com o Cavalo: um xeque. Depois o mate vem no lance seguinte.'},
  {id:'easy2_10', name:'Mate em 2 · X', fen:'n3b1k1/1B2Rpp1/8/P3Q3/8/8/5P1P/7K', n:2, problem:true, tip:'Comece com a Torre: um xeque capturando uma peça. Depois o mate vem no lance seguinte.'},
  {id:'easy2_11', name:'Mate em 2 · XI', fen:'6k1/5p1p/8/3B4/2N5/5R2/R5P1/7K', n:2, problem:true, tip:'Comece com a Torre: um lance silencioso, sem xeque, capturando uma peça. Depois o mate vem no lance seguinte.'},
  {id:'easy2_12', name:'Mate em 2 · XII', fen:'1n4k1/q4ppp/1N1r4/8/6Q1/8/7P/6K1', n:2, problem:true, tip:'Comece com a Rainha: um xeque. Depois o mate vem no lance seguinte.'},
  {id:'prob1', name:'Problema I', fen:'2N4k/4n1p1/Q3pp1r/6B1/7P/8/6PP/7K', n:3, problem:true, tip:'O lance-chave não é xeque: é um lance silencioso que prepara a rede de mate. Ele começa capturando uma peça.'},
  {id:'prob2', name:'Problema II', fen:'2Rn2k1/4b2p/6p1/8/8/4RB1B/6P1/7K', n:3, problem:true, tip:'O lance-chave não é xeque: é um lance silencioso que prepara a rede de mate. Ele começa capturando uma peça.'},
  {id:'prob3', name:'Problema III', fen:'2n3k1/6B1/N6p/2P5/8/5Q2/6P1/7K', n:3, problem:true, tip:'O lance-chave não é xeque: é um lance silencioso que prepara a rede de mate. Ele começa capturando uma peça.'},
  {id:'prob4', name:'Problema IV', fen:'3r2k1/6p1/8/R7/Q7/8/1B3RP1/7K', n:3, problem:true, tip:'O lance-chave não é xeque: é um lance silencioso que prepara a rede de mate.'},
  {id:'prob5', name:'Problema V', fen:'6k1/5p1p/2N3pb/8/8/1R2B3/4B1P1/7K', n:3, problem:true, tip:'O lance-chave não é xeque: é um lance silencioso que prepara a rede de mate. Ele começa capturando uma peça.'},
  {id:'prob6', name:'Problema VI', fen:'6kB/5p2/1N3p2/8/8/3R4/7P/7K', n:3, problem:true, tip:'O lance-chave não é xeque: é um lance silencioso que prepara a rede de mate.'},
  {id:'prob7', name:'Problema VII', fen:'7k/3b1p2/7p/2R1P2Q/8/3B4/5PPP/6K1', n:3, problem:true, tip:'O lance-chave não é xeque: é um lance silencioso que prepara a rede de mate. Ele começa capturando uma peça.'},
  {id:'prob8', name:'Problema VIII', fen:'7k/7p/1Pnr1pb1/8/7Q/1B1R4/5PP1/7K', n:3, problem:true, tip:'O lance-chave não é xeque: é um lance silencioso que prepara a rede de mate.'},
  {id:'prob9', name:'Problema IX', fen:'N5k1/3q2pp/R7/8/8/8/3Q1PPP/7K', n:3, problem:true, tip:'O lance-chave não é xeque: é um lance silencioso que prepara a rede de mate. Ele começa capturando uma peça.'},
  {id:'prob10', name:'Problema X', fen:'7k/4pp2/R7/2N5/3R4/8/5P1P/7K', n:3, problem:true, tip:'O lance-chave não é xeque: é um lance silencioso que prepara a rede de mate.'},
  {id:'prob11', name:'Problema XI', fen:'1b1B3k/5p1r/4Q2p/8/8/8/5PPP/7K', n:3, problem:true, tip:'Comece com um xeque que força a resposta do rei.'},
  {id:'prob12', name:'Problema XII', fen:'2N2rkb/6pp/8/8/4N2P/4Q3/5P1P/7K', n:3, problem:true, tip:'Comece com um xeque que força a resposta do rei.'},
  {id:'prob13', name:'Problema XIII', fen:'2b3k1/p4pp1/6Rp/5R2/P7/8/2Q3PP/7K', n:3, problem:true, tip:'Comece com um xeque que força a resposta do rei. Ele começa capturando uma peça.'},
  {id:'prob14', name:'Problema XIV', fen:'6nk/2n1Npp1/7N/1Q6/8/8/8/6K1', n:3, problem:true, tip:'Comece com um xeque que força a resposta do rei. Ele começa capturando uma peça.'},
  {id:'prob15', name:'Problema XV', fen:'7k/2q3p1/8/5Q2/3R4/8/4NPPP/7K', n:3, problem:true, tip:'Comece com um xeque que força a resposta do rei.'},
  {id:'prob16', name:'Problema XVI', fen:'r6k/n3Qppp/8/6P1/1R5N/8/5P1P/6K1', n:4, problem:true, tip:'O lance-chave não é xeque: é um lance silencioso que prepara a rede de mate. Ele começa capturando uma peça.'}
];
const mateById = id => MATES.find(m => m.id===id) || PROBLEMS.find(m => m.id===id);
