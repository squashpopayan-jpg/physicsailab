(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const $ = (s) => document.querySelector(s);
  const click = (sel) => $(sel).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const knobTo = async (target) => { const k = TLBench.getState().supply.knob, need = target / (24 * (1 + TLBench.variant().dialErr)); const n = Math.round((need - k) / 0.002), key = n > 0 ? 'ArrowUp' : 'ArrowDown'; for (let i = 0; i < Math.abs(n); i++) $('#knobG').dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); await sleep(900); };
  const out = [];
  // Escenario 1: voltímetro con la punta en el borne mA
  let s = TLBench.getState();
  s.wires = [['src.l','tl.1'],['tl.2','src.n'],['d1.ma','tl.1'],['d1.com','tl.2']].map((w,i)=>({id:i+1,a:w[0],b:w[1],color:'rojo'})); s.nextWire = 10;
  s.dmm[0].sel = 'V~'; TLBench.setState(s); await sleep(300);
  click('#btnReview'); out.push('REVISIÓN 1: ' + $('#reviewOut').innerText.replace(/\n/g,' | '));
  click('[data-act="power"]'); await knobTo(6); out.push('LECTURA DMM1: ' + $('#rv0').innerText);
  out.push('LOG: ' + TLBench.getLog().slice(-3).map(l=>l.type+': '+l.msg).join(' || '));
  await knobTo(0); click('[data-act="power"]'); await sleep(300);
  // Escenario 2: saturación con 100 espiras y shunt
  s = TLBench.getState();
  s.tx.L = 'c100'; s.tx.R = 'c250';
  s.dmm.forEach(d => { d.fuseMa = d.fuseA = true; d.sel = 'OFF'; });
  s.wires = [['src.l','tl.1'],['tl.2','sh.a'],['sh.b','src.n'],['sc.1','tl.1'],['sc.g1','tl.2'],['sc.g2','tl.2'],['sc.2','sh.b']].map((w,i)=>({id:i+1,a:w[0],b:w[1],color:'amarillo'}));
  s.scope.ch[0].vdiv = 5; s.scope.ch[1].vdiv = 1; s.scope.tdiv = 0.005; s.stage = 'B';
  TLBench.setState(s); await sleep(300);
  click('#btnReview'); out.push('REVISIÓN 2: ' + $('#reviewOut').innerText.replace(/\n/g,' | '));
  click('[data-act="power"]'); await knobTo(14); await sleep(600);
  out.push('LOG2: ' + TLBench.getLog().slice(-3).map(l=>l.type+': '+l.msg).join(' || '));
  $('#scopeCanvas').scrollIntoView();
  return out.join('\n');
})()
