(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const $ = (s) => document.querySelector(s);
  const click = (sel) => $(sel).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const out = [];
  const stage = (s) => { $('#stageSel').value = s; $('#stageSel').dispatchEvent(new Event('change', { bubbles: true })); };
  const demo = async (s) => { stage(s); click('#btnDemo'); click('#btnDemo'); await sleep(100); };
  const st = () => TLBench.getState();
  const knobTo = async (target) => { // ajusta la perilla hasta que V1 (analizador o DMM1) ≈ target
    const k = TLBench.getState().supply.knob, need = target / (24 * (1 + TLBench.variant().dialErr));
    const n = Math.round((need - k) / 0.002), key = n > 0 ? 'ArrowUp' : 'ArrowDown';
    for (let i = 0; i < Math.abs(n); i++) $('#knobG').dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await sleep(800);
  };
  const power = async (on) => { if (st().supply.on !== on) click('[data-act="power"]'); await sleep(500); };
  const rec = async (note) => { $('#recNote').value = note || ''; click('#btnRecord'); await sleep(150); out.push($('#recLast').innerText); };
  const coil = async (side, id) => { click(`[data-act="coil${side}"]`); await sleep(50); const b = document.querySelector(`#benchPop [data-coil="${id}"]`); b.click(); await sleep(100); };
  // R: resistencias
  await demo('R'); await sleep(1200); await rec('R frío');
  // A: relación con varias bobinas
  await demo('A'); await power(true); await knobTo(12); await rec('A 500/250'); await rec('A réplica');
  for (const c of ['c100', 'c1000', 'cX']) { await knobTo(0); await power(false); await coil('R', c); await demo('A'); await power(true); await knobTo(12); await rec('A 500/' + c); }
  await knobTo(0); await power(false); await coil('R', 'c250');
  // B: barrido de vacío
  await demo('B'); await power(true);
  for (const v of [2, 6, 10, 12, 16, 20, 24]) { await knobTo(v); await rec('B ' + v); }
  await knobTo(12); click('[data-act="yoke"]'); await sleep(900); await rec('B yugo flojo'); await knobTo(5); click('[data-act="yoke"]'); await sleep(900); await rec('B yugo retirado'); click('[data-act="yoke"]'); await sleep(300);
  await knobTo(0); await power(false);
  // C: cortocircuito
  await demo('C'); await power(true);
  for (const v of [2, 4, 6, 8]) { await knobTo(v); await rec('C ' + v); }
  await knobTo(0); await power(false);
  // D: carga
  await demo('D'); click('[data-act="loadsw"]'); await power(true); await knobTo(12); await rec('D V20'); click('[data-act="loadsw"]');
  const loadTo = async (idx) => { while (st().load.idx !== idx) { click('[data-act="load"]'); await sleep(20); } await sleep(600); };
  for (const idx of [8, 7, 6, 5, 4, 3, 2]) { await loadTo(idx); await knobTo(12); await rec('D R=' + idx); }
  await knobTo(0); await power(false);
  // E: polaridad
  await demo('E'); await power(true); await knobTo(6); await rec('E sustractiva'); await knobTo(0); await power(false);
  out.push('LOG: ' + TLBench.getLog().map(l => l.type + ': ' + l.msg).join(' | '));
  out.push('ROWS: ' + TransformerLab.getData().length);
  location.hash = 'cuaderno'; await sleep(800);
  out.push(document.getElementById('stageCards').innerText.split(String.fromCharCode(10)).filter(l => !/^[0-9.]+$/.test(l.trim())).join(String.fromCharCode(10)).slice(0, 6000));
  return out.join('\n');
})()
