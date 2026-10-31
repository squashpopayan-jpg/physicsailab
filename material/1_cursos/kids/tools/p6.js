const g = sim('canon-newton'); const out = [];
for (const v of [5, 7.7, 9.5, 12]) { g.setSlider('v', v); g.host.querySelector('.btn.primary').click(); for (let i = 0; i < 1200; i++) g._tick(1, 1 / 60); out.push([v, g.host.querySelectorAll('.out-v')[0].textContent]); }
return out;
