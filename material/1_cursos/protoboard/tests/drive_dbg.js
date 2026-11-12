module.exports = async (A) => {
  const q = JSON.parse(await A.ev("const P=lab.part('D1'); return [P.pos[0], P.pos[1]]"));
  const mq = [(q[0][0] + q[1][0]) / 2, q[0][1]];
  const d9 = await A.hole('d9'), d10 = await A.hole('d10');
  console.log('pins before', JSON.stringify(q), 'd9', d9, 'd10', d10, 'grab', mq);
  await A.drag(mq[0], mq[1], d9[0] + 1.27, d9[1]);
  console.log('after', await A.ev("const P=lab.part('D1'); return [P.pos, (P._h||[]).map(h=>h&&h.ref), P._free]"));
};
