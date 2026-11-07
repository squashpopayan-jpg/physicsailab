# Validación del curso «Tejiendo el PEC»

## Fuente
- El PDF `Cartilla_PEC_Novirao.pdf` son **19 fotografías de páginas** (sin capa de texto). Se leyeron una por una y se transcribieron a mano (`docs/fuentes/transcripcion*.md`).
- Cubre las páginas 3 a 37 y 60 a 61 de la cartilla impresa. **No incluye las páginas de fotografías de prácticas y vivencias (≈38 a 59)**; el curso no las cubre y lo dice en la portada.

## Fidelidad
- Todo el contenido de las lecciones sale de la cartilla. Lo que no es de la cartilla está marcado: los esquemas (hechos para el curso con datos de la cartilla), el ejemplo del maíz en la lección 11 («inventado para el curso»), y las definiciones de siglas (SEIP) y de términos que la cartilla nombra sin definir (chagra, tul, tulpa), en el glosario.
- Datos de la cartilla que parecen **errores de impresión o que no coinciden entre sí**, tratados con cuidado:
  1. «Cabildo de Guambía» (p. 14) como cabildo que recibió la administración de la escuela en 2024-2025. El curso dice «el cabildo» y **ninguna pregunta depende de ese dato**.
  2. Las cinco juntas (p. 7: Novirao Centro, Alto Novirao, Santa Bárbara, Santa Ana, Brisas de Totoró) no coinciden con los cinco sectores del diagrama de hilos (p. 16: Santa Ana, Novirao Centro, Santa Bárbara, Santa Teresa, Alto Novirao). Se presentan por separado y se avisa en la lección 2.
  3. El rector aparece como «Jeann Nilton Campo Ángel» (p. 14) y «Jean Nilton Campo Angel» (p. 60). Se respeta cada grafía donde aparece.
  4. Frases con texto cortado por la fotografía en el borde de la página: se usó solo lo legible.
- Las cifras del censo (48,4 %, 33,8 %, 12 %, 5,6 %) son las del texto de la cartilla; el gráfico del curso se rehízo con ellas.

## Banco de preguntas (127 en total)
- 47 pausas, 40 de quizzes (4×10) y 40 del examen (10 por parte). Sin enunciados repetidos.
- Cada pregunta: 4 opciones distintas, una correcta, explicación y lección de repaso. Sin «todas/ninguna de las anteriores».
- Se equilibró la longitud de las opciones para que la correcta no delate por ser la más larga (ninguna pregunta supera 1,7× la longitud media de los distractores).
- Prueba de recorrido automática en el navegador: contestando correctamente todas las preguntas se obtiene 10/10 en cada quiz y 40/40 en el examen, con 4 filas en el desglose por parte, y las mejores notas se guardan.

## Interfaz
- Sin desbordamiento horizontal en ninguna de las 19 páginas a 375 px de ancho.
- Tema claro y oscuro; texto sobre fondos de color con tokens propios para cada tema.
- Las fotografías de la cartilla se recortaron para usar solo las ilustraciones (`tests/recortes.py`).
