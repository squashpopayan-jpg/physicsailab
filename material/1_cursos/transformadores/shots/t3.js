(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  document.getElementById('student').value = 'Ana Pérez, Luis Gómez, Sofía Muñoz';
  document.getElementById('group').value = 'Física II · grupo 3';
  document.getElementById('conclusion').value = 'La relación de tensiones en vacío sigue a la de espiras: pendiente 0,991 ± 0,005.\nLa bobina X tiene 396 ± 4 espiras.\nCon 22 Ω la eficiencia fue 86 % y la regulación 5,4 %.';
  location.hash = 'exposicion'; await sleep(700);
  return document.getElementById('slideNum').innerText;
})()
