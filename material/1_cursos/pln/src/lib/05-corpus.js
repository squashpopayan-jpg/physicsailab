/* ===================================================================
   lib/05-corpus.js — Corpus didácticos en español (originales del curso).
   · L.corpus.es    — 60 oraciones de temas cotidianos y de PLN
   · L.corpus.texto — las mismas oraciones unidas en un solo texto
   Son pequeños a propósito: sirven para ver el algoritmo, no para
   estimar cifras de lenguaje real.
   =================================================================== */
(function (root) {
  'use strict';
  const NL = (root.NL = root.NL || {});
  const L = (NL.L = NL.L || {});
  const es = [
    'El gato duerme en la alfombra roja.',
    'La niña lee un libro muy largo.',
    'Mi hermano compró pan en la tienda del barrio.',
    'El perro corre por el parque cada mañana.',
    'La profesora explica el tema con un ejemplo sencillo.',
    'Los estudiantes escriben un programa para contar palabras.',
    'Hoy llueve mucho y las calles están mojadas.',
    'El tren sale de la estación a las ocho.',
    'Mi madre prepara una sopa de verduras para la cena.',
    'El niño pequeño juega con una pelota azul.',
    'La computadora procesa el texto en pocos segundos.',
    'Ella no quiere salir porque tiene mucho trabajo.',
    'Los pájaros cantan en el árbol del jardín.',
    'El libro está sobre la mesa de la cocina.',
    'Ayer visitamos a nuestros abuelos en el pueblo.',
    'La ciudad es grande y tiene muchos edificios altos.',
    'Un buen modelo aprende patrones a partir de los datos.',
    'El profesor corrige los exámenes de los estudiantes.',
    'La lluvia cae sobre el techo de la casa.',
    'Mi amigo toca la guitarra todas las tardes.',
    'El médico revisa al paciente con mucho cuidado.',
    'La sopa está caliente pero no tiene sal.',
    'Los niños comen fruta después del colegio.',
    'La máquina lee el texto y busca las palabras importantes.',
    'El viento mueve las hojas del árbol.',
    'Nosotros caminamos por la playa al atardecer.',
    'La tienda cierra los domingos y abre los lunes.',
    'El conductor del autobús saluda a todos los pasajeros.',
    'Esta clase no es difícil si estudias cada día.',
    'El río baja de la montaña y llega al mar.',
    'La abuela cuenta historias antiguas a sus nietos.',
    'Los científicos miden la temperatura del agua.',
    'Un traductor automático convierte frases de un idioma a otro.',
    'Me gusta el café con leche por la mañana.',
    'El estudiante pregunta y la profesora responde con paciencia.',
    'La película empieza tarde pero termina temprano.',
    'Mi vecino pinta la puerta de la casa de verde.',
    'El agua del lago es clara y muy fría.',
    'La biblioteca abre temprano y cierra por la noche.',
    'El equipo gana el partido con un gol al final.',
    'Los datos de entrenamiento no contienen todas las palabras.',
    'La pregunta del examen fue más difícil de lo esperado.',
    'Ella escribe una carta larga a su amiga.',
    'El mercado vende frutas, verduras y pescado fresco.',
    'Un asistente virtual responde preguntas sobre el clima.',
    'La luna sale despacio detrás de la montaña.',
    'Mi primo estudia ingeniería en la universidad.',
    'El banco no abre los domingos.',
    'La música suena fuerte en la fiesta del barrio.',
    'El texto contiene errores de ortografía que el programa corrige.',
    'Las flores del jardín huelen muy bien en primavera.',
    'El camino hacia el pueblo es largo y estrecho.',
    'Nadie sabe cuántas lenguas se hablan en el mundo.',
    'El modelo no entiende la frase si falta una palabra clave.',
    'Los vecinos plantan árboles frutales en el patio.',
    'El pan recién hecho huele delicioso.',
    'La nieve cubre la cima de la montaña en invierno.',
    'Mi hermana dibuja animales con lápices de colores.',
    'La red neuronal aprende de millones de oraciones.',
    'El maestro enseña a leer a los niños del pueblo.'
  ];
  L.corpus = { es, texto: es.join(' ') };
})(typeof window !== 'undefined' ? window : globalThis);
