/* Rei Caído — sound effects: recorded impact samples (sfx/) plus sounds synthesized with Web Audio.
   sfx(name, opt) plays a short sound; the same sound is not repeated within 35 ms (area attacks stay clean). */
let AC = null, master = null;
const lastPlay = {};
const soundOn = () => { try { return !(SAVE && SAVE.opts && SAVE.opts.sound===false); } catch(e){ return true; } };
function audio(){
  if (AC) return AC;
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return null;
  AC = new C(); master = AC.createGain(); master.gain.value = .5; master.connect(AC.destination);
  return AC;
}
function noiseBuf(){
  if (noiseBuf.b) return noiseBuf.b;
  const b = AC.createBuffer(1, AC.sampleRate*.5, AC.sampleRate), d = b.getChannelData(0);
  for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
  return (noiseBuf.b = b);
}
// small building blocks
function env(g, t, a, peak, dec){ g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t+a); g.gain.exponentialRampToValueAtTime(0.0001, t+a+dec); }
function tone(t, type, f0, f1, dur, vol, out){
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t+dur);
  env(g, t, .004, vol, dur); o.connect(g); g.connect(out||master); o.start(t); o.stop(t+dur+.05);
}
function noise(t, ftype, f0, f1, q, dur, vol){
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf(); f.type = ftype; f.Q.value = q; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t+dur);
  env(g, t, .003, vol, dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t+dur+.05);
}
// a wooden piece set down on the board
function tock(t, pitch, vol){ noise(t, 'bandpass', 1900*pitch, 0, 4, .045, .55*vol); tone(t, 'sine', 240*pitch, 130*pitch, .09, .5*vol); }
const SFX = {
  move:    (t, o) => tock(t, 1, 1),
  jump:    (t, o) => { noise(t, 'bandpass', 500, 2200, 1.5, .16, .18); tock(t+.13, 1.05, 1); },
  slide:   (t, o) => { noise(t, 'highpass', 3000, 6000, .7, .3, .12); tock(t+.28, 1.1, .7); },
  emove:   (t, o) => tock(t, .78, .55),
  chess:   (t, o) => tock(t, 1.25, .8),
  hit:     (t, o) => { tone(t, 'sine', 150, 55, .16, .7); noise(t, 'lowpass', 1400, 300, 1, .1, .4); },
  crit:    (t, o) => { tone(t, 'sine', 170, 50, .2, .8); noise(t, 'lowpass', 2600, 300, 1, .14, .5); tone(t, 'triangle', 1400, 900, .08, .2); },
  kill:    (t, o) => { noise(t, 'lowpass', 1600, 160, 1, .38, .45); tone(t+.02, 'sine', 110, 45, .25, .5); },
  boss:    (t, o) => { noise(t, 'lowpass', 900, 60, 1, 1.1, .6); tone(t, 'sine', 80, 30, 1, .7); },
  hurt:    (t, o) => { tone(t, 'square', 110, 60, .16, .18); noise(t, 'lowpass', 800, 200, 1, .15, .35); },
  skill:   (t, o) => noise(t, 'bandpass', 350, 2400, 2, .28, .3),
  fire:    (t, o) => { for (let i=0;i<7;i++) noise(t + Math.random()*.25, 'highpass', 2500+Math.random()*3000, 0, 1, .03, .25); noise(t, 'lowpass', 600, 200, 1, .35, .25); },
  cold:    (t, o) => { tone(t, 'triangle', 2600, 2400, .18, .14); tone(t+.05, 'triangle', 3300, 3100, .15, .1); noise(t, 'highpass', 5000, 0, 1, .08, .15); },
  zap:     (t, o) => { const o2 = AC.createOscillator(), g = AC.createGain(); o2.type = 'sawtooth';
             for (let i=0;i<8;i++) o2.frequency.setValueAtTime(300 + Math.random()*1400, t + i*.02); env(g, t, .003, .15, .18); o2.connect(g); g.connect(master); o2.start(t); o2.stop(t+.25); },
  loot:    (t, o) => { const r = (o && o.rar) || 'common', notes = {common:[523], magic:[523,659], rare:[523,659,784], legend:[523,659,784,1047]}[r] || [523];
             notes.forEach((f,i) => tone(t + i*.07, 'triangle', f, 0, .35, .16)); if (r==='legend') noise(t+.25, 'highpass', 6000, 0, 1, .5, .08); },
  stairs:  (t, o) => { [392, 330, 262].forEach((f,i) => tone(t + i*.11, 'sine', f, 0, .3, .18)); },
  level:   (t, o) => { [523, 659, 784, 1047].forEach((f,i) => tone(t + i*.08, 'triangle', f, 0, .4, .16)); },
  win:     (t, o) => { [392, 523, 659, 784].forEach((f,i) => tone(t + i*.1, 'triangle', f, 0, .5, .17)); }
};
// recorded impact sounds (sfx/, Kenney CC0) on top of the synthesized ones: anything without a sample, or whose file fails to load, stays synthesized
// WAV (not Ogg): every browser decodes it, including phones that cannot play Ogg Vorbis (they used to fall back to the synthesized sounds)
const sfxSet = (n, k) => Array.from({length:k}, (_, i) => `sfx/${n}_00${i}.wav`);
const SAMPLES = {
  move:{f:sfxSet('impactWood_light',5), vol:.7}, emove:{f:sfxSet('impactWood_light',5), vol:.35, rate:.85},
  jump:{f:sfxSet('impactWood_medium',3), vol:.7, delay:.1}, slide:{f:sfxSet('footstep_wood',2), vol:.5},
  chess:{f:sfxSet('impactWood_light',5), vol:.7, rate:1.1}, hit:{f:sfxSet('impactPunch_medium',3), vol:.55},
  crit:{f:sfxSet('impactPunch_heavy',2), vol:.7}, kill:{f:sfxSet('impactWood_heavy',3), vol:.75},
  hurt:{f:sfxSet('impactSoft_heavy',2), vol:.7}, boss:{f:sfxSet('impactBell_heavy',1), vol:.8}, block:{f:sfxSet('impactMetal_light',2), vol:.55}
};
const badSample = {};
// The recorded sounds are fetched and decoded ONCE into memory and played from there (a new Audio element per hit loaded the file
// again every time: it stalled the game and, when it failed, a different synthesized sound played instead).
const _buf = {};   // file -> decoded AudioBuffer | 'loading' | 'bad'
function loadSample(f){
  if (_buf[f]) return; _buf[f] = 'loading';
  const ac = audio(); if (!ac){ _buf[f] = 'bad'; return; }
  fetch(f).then(r => { if (!r.ok) throw new Error('http'); return r.arrayBuffer(); }).then(b => new Promise((ok, no) => ac.decodeAudioData(b, ok, no))).then(buf => { _buf[f] = buf; }).catch(() => { _buf[f] = 'bad'; });
}
function preloadSamples(){ for (const k in SAMPLES) for (const f of SAMPLES[k].f) loadSample(f); }
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', preloadSamples);
const _el = {};
function playEl(f, s, o, name){
  try {
    const base = _el[f] || (_el[f] = new Audio(f)), el = base.cloneNode();
    el.volume = s.vol*.9; if (s.rate){ el.preservesPitch = false; el.playbackRate = s.rate; }
    const p = el.play(); if (p && p.catch) p.catch(() => { badSample[name] = true; synthSfx(name, o); });
  } catch(e){ badSample[name] = true; synthSfx(name, o); }
}
const _ready = b => b && b !== 'loading' && b !== 'bad';
function sfx(name, o){
  const s = SAMPLES[name];
  if (!s || badSample[name] || !soundOn()) return synthSfx(name, o);
  const t = performance.now();
  if (lastPlay['s:'+name] && t - lastPlay['s:'+name] < 35) return;
  const ac = audio(); if (!ac) return synthSfx(name, o);
  const ready = s.f.filter(f => _ready(_buf[f]));
  if (!ready.length){
    preloadSamples();
    if (s.f.every(f => _buf[f]==='bad')){   // decoding is not possible here (for example a page opened from a file): play it through an audio element instead
      lastPlay['s:'+name] = t;
      const f = s.f[Math.floor(Math.random()*s.f.length)], d = ((o && o.delay) || 0) + (s.delay || 0), go = () => playEl(f, s, o, name);
      if (d > 0) setTimeout(go, d*1000); else go();
    }
    return;   // still decoding: stay silent instead of playing a different sound
  }
  lastPlay['s:'+name] = t;
  const buf = _buf[ready[Math.floor(Math.random()*ready.length)]], d = ((o && o.delay) || 0) + (s.delay || 0);
  const go = () => { try {
    if (ac.state==='suspended') ac.resume();
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = buf; if (s.rate) src.playbackRate.value = s.rate;
    g.gain.value = s.vol*.9; src.connect(g); g.connect(ac.destination); src.start();
  } catch(e){ badSample[name] = true; synthSfx(name, o); } };
  if (d > 0) setTimeout(go, d*1000); else go();
}
function synthSfx(name, o){
  if (!soundOn() || !SFX[name]) return;
  const ac = audio(); if (!ac) return;
  if (ac.state==='suspended') ac.resume();
  const now = ac.currentTime, delay = (o && o.delay) || 0;
  if (!delay && lastPlay[name] && now - lastPlay[name] < .035) return;
  lastPlay[name] = now;
  try { SFX[name](now + delay, o); } catch(e){}
}
function toggleSound(){
  SAVE.opts = SAVE.opts || {};
  SAVE.opts.sound = !soundOn();
  if (typeof persist==='function') persist();
  if (soundOn()) sfx('move');
  return soundOn();
}
