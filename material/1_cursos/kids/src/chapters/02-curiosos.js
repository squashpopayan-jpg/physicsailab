/* Capítulo 2 — Los primeros curiosos */
(function () {
  'use strict';
  const FK = window.FK;

  FK.sim('ordena-historia', function (g) {
    /* de la más antigua a la más reciente */
    FK.kit.order(g, [
      '🏺 Tales de Mileto<br><small>hace 2600 años</small>',
      '🛁 Arquímedes<br><small>hace 2250 años</small>',
      '👁️ Ibn al-Haytham<br><small>hace 1000 años</small>',
      '🔭 Galileo<br><small>hace 415 años</small>',
      '🍎 Newton<br><small>hace 340 años</small>',
      '🌌 Einstein<br><small>hace 120 años</small>'
    ], { start: 'Toca primero al que vivió hace MÁS años. Fíjate en los números.', okMsg: '¡Bien! ¿Quién sigue? Busca el siguiente número más pequeño.' });
  });

  FK.sim('quien-fue', function (g) {
    FK.kit.match(g, [
      ['🏺 Tales de Mileto', 'Frotó ámbar y vio que atraía pajitas'],
      ['🛁 Arquímedes', 'Entendió por qué flotan las cosas'],
      ['📏 Eratóstenes', 'Midió la Tierra con sombras'],
      ['🔭 Galileo', 'Vio las lunas de Júpiter'],
      ['🍎 Newton', 'Explicó la gravedad'],
      ['☢️ Marie Curie', 'Estudió la radiactividad'],
      ['🌿 Francisco José de Caldas', 'Midió montañas con agua hirviendo']
    ]);
  });
})();
