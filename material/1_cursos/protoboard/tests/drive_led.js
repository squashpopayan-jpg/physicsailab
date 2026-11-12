/* Prueba con ratón real: arrastrar resistor y LED a la placa y cablear */
module.exports = async (A) => {
  const info = async () => A.ev("return lab.bench.scene.parts.map(p=>[p.id,p._plugged,(p._h||[]).map(h=>h?h.ref:null).join(' ')]).concat([[ 'I', lab.i('D1') ]])");
  console.log('inicio', await info());
  /* resistor: agarrar el cuerpo (centro entre patas) y soltar con pata 1 en e5 */
  const p = JSON.parse(await A.ev("const P=lab.part('R1'); return [P.pos[0], P.pos[1]]"));
  const mid = [(p[0][0] + p[1][0]) / 2, p[0][1]];
  const e5 = await A.hole('e5');
  await A.drag(mid[0], mid[1], e5[0] + 5.08, e5[1] + 0.3);
  console.log('R1 tras arrastrar', await info());
  /* LED: agarrar el cuerpo */
  const q = JSON.parse(await A.ev("const P=lab.part('D1'); return [P.pos[0], P.pos[1]]"));
  const mq = [(q[0][0] + q[1][0]) / 2, q[0][1]];
  const d9 = await A.hole('d9');
  await A.drag(mq[0], mq[1], d9[0] + 1.27, d9[1]);
  console.log('D1 tras arrastrar', await info());
  /* cables: de a5 (strip del extremo del R) al riel +, de d? al riel - */
  const a5 = await A.hole('a5'), bp = await A.hole('B+3');
  await A.drag(a5[0], a5[1], bp[0], bp[1]);
  const a10 = await A.hole('a10'), bm = await A.hole('B-3');
  await A.drag(a10[0], a10[1], bm[0], bm[1]);
  console.log('tras cables', await info(), await A.ev("return lab.bench.scene.wires.map(w=>w.a+'→'+w.b)"));
  await A.sleep(800);
  console.log('goals', await A.ev("return lab.cfg.goals.map(g=>g.test(lab))"));
  await A.shot('shots/drive_led.png', true);
};
