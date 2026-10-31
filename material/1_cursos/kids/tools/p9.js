const g = sim('puertas-logicas'); const btns = [...g.host.querySelectorAll('.btn')]; const ans = btns.find((b) => b.textContent.includes('Esta es'));
const chipsRows = [...g.host.querySelectorAll('.chip')]; const gateChips = chipsRows.filter((c) => /Y \(AND\)|O \(OR\)|XOR|NAND/.test(c.textContent));
const sw = [...g.host.querySelectorAll('.switch')];
const log = [];
for (let round = 0; round < 4; round++) {
  /* probar las cuatro combinaciones */
  g.setToggle('A', false); g.setToggle('B', false);
  sw[0].click(); sw[1].click(); sw[0].click(); /* 10, 11, 01 */ sw[1].click(); /* 00? */ sw[0].click(); sw[1].click();
  for (const ch of gateChips) { ch.click(); ans.click(); if (g.host.querySelectorAll('.out-v')[0].textContent.startsWith((round + 1) + '')) break; }
  log.push(g.host.querySelectorAll('.out-v')[0].textContent);
}
return { log, won: FK.isWon('puertas-logicas') };
