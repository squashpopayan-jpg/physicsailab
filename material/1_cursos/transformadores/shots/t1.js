(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const click = (sel) => document.querySelector(sel).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  document.getElementById('stageSel').value = 'B'; document.getElementById('stageSel').dispatchEvent(new Event('change', { bubbles: true }));
  click('#btnDemo'); click('#btnDemo');
  await sleep(300);
  click('#btnReview');
  const rev = document.getElementById('reviewOut').innerText;
  click('[data-act="power"]');
  const knob = document.getElementById('knobG');
  for (let i = 0; i < 25; i++) knob.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true }));
  await sleep(1500);
  const rd = [...document.querySelectorAll('#readBody tr')].map(tr => tr.innerText.replace(/\s+/g, ' ')).join('\n');
  click('#btnRecord');
  await sleep(200);
  return rev + '\n---\n' + rd + '\n' + document.getElementById('readCfg').innerText + '\n' + document.getElementById('recLast').innerText + '\nLOG: ' + document.getElementById('benchLog').innerText;
})()
