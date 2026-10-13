(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const $ = (s) => document.querySelector(s);
  location.hash = 'teoria'; await sleep(300);
  for (const R of ['470', '100', '22']) { $('#mRL').value = R; $('#mRL').dispatchEvent(new Event('input', { bubbles: true })); $('#mRecord').click(); await sleep(50); }
  location.hash = 'cuaderno'; await sleep(300);
  $('#realEntry').open = true;
  const set = (id, v) => { $('#' + id).value = v; };
  set('rStage', 'D'); set('rSec', 'carga'); set('rRL', '22'); set('rV1', '12,02'); set('rV1u', '0,05'); set('rV2', '5,58'); set('rV2u', '0,03'); set('rI1', '0,141'); set('rI2', '0,247'); set('rP1', '1,62'); set('rNote', 'banco real 3');
  $('#realForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  await sleep(400);
  return $('#rErr').innerText + ' | ' + $('#rowCount').innerText + ' | ' + $('#stageCards').innerText.split(String.fromCharCode(10)).filter(l => /Modelo|Laboratorio real|puntos/.test(l)).slice(0, 12).join(' / ');
})()
