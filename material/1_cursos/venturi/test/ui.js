(() => {
  const $ = (id) => document.getElementById(id), r = {};
  $('inpGrupo').value = 'Ana Pérez, Luis Gómez'; $('selBanco').value = '4';
  $('setupForm').requestSubmit();
  document.querySelector('#confirmYes') && !$('confirmBox').hidden && $('confirmYes').click();
  r.chip = $('topChip').textContent.trim();
  $('btnBomba').click(); $('btnVaciado').click();
  document.querySelector('[data-dv="1"]').click(); document.querySelector('[data-dv="0.125"]').click();
  r.valv = $('valvInfo').textContent;
  $('regh2').dispatchEvent(new Event('focus')); r.tubo = BENCH.tubo;
  $('regQ').value = '8,5'; $('regh0').value = '221'; $('regh3').value = '165';
  $('regForm').requestSubmit();
  r.regN = $('regN').textContent;
  location.hash = 'guia';
  $('docClave').value = 'bernoulli-unicauca'; $('docForm').requestSubmit();
  r.docFilas = document.querySelectorAll('#docTabla tbody tr').length;
  r.log = BENCH.log.map((e) => e.msg);
  return r;
})()
