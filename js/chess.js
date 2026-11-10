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
const mateById = id => MATES.find(m => m.id===id);
