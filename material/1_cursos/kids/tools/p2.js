const g = sim('resonancia-columpio'); const r = [];
for (const Tp of [1.5, 2.3, 2.8, 3.0, 4, 5.7]) { g.setSlider('Tp', Tp); g.restart(); g._tick(60*70); r.push([Tp, g.host.querySelector('.out-v').textContent]); }
return r;
