const g = sim('torre-asoma'); const btn = [...g.host.querySelectorAll('.btn')].find((b) => b.textContent.includes('Poner'));
const offs = [0.12, 0.16, 0.24, 0.48, 0.0];
for (const o of offs.slice(0, 4)) { g.setSlider('o', o); btn.click(); }
return { won: FK.isWon('torre-asoma'), outs: [...g.host.querySelectorAll('.out-v')].map((e) => e.textContent) };
