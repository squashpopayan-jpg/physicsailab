/* Práctica F10-01 · Densidad de sólidos con incertidumbre */
(function () {
  'use strict';
  window.EM.PR.add({
    id: 'densidad', cod: 'F10-01', titulo: 'Medir con incertidumbre: la densidad de los sólidos', grado: 10, tipo: 'simple',
    tiempo: 110, grupo: '3 estudiantes (medición, registro, cálculo)', nivel: 1,
    dba: [], est: ['C5', 'C6', 'C7', 'C10', 'C14', 'C17'], comp: ['ind', 'uso'], temas: [],
    pregunta: '¿De qué material está hecho un objeto y con qué seguridad podemos afirmarlo a partir de su densidad?',
    contexto: 'Un chatarrero distingue el aluminio del acero con un imán, pero ¿cómo distinguir el aluminio de una aleación de magnesio o el latón del bronce? La densidad es una huella de cada material; para usarla hay que medirla con una incertidumbre menor que la diferencia entre los candidatos.',
    objetivos: [
      'Medir masa y volumen de sólidos regulares e irregulares con instrumentos de distinta resolución.',
      'Calcular la densidad con su incertidumbre combinada y decidir qué medida domina el presupuesto de incertidumbre.',
      'Identificar el material comparando con una tabla mediante la compatibilidad z.'
    ],
    prediccion: '¿Qué método dará la densidad con menor incertidumbre: medir el diámetro y la altura con una regla, con un calibrador o sumergir el objeto en una probeta? Ordénenlos y justifiquen.',
    claves: [
      'Densidad: ρ = m/V. En el SI se da en kg/m³; en el laboratorio escolar se usa también g/cm³ (1 g/cm³ = 1000 kg/m³).',
      'Volumen de un cilindro: V = π d² h / 4. El diámetro aparece al cuadrado: su incertidumbre pesa el doble.',
      'Volumen de un sólido irregular: el agua que desplaza al sumergirse por completo (V = V₂ − V₁).',
      'La incertidumbre de un instrumento digital de resolución r es r/√12; la de una medida repetida, s/√n.'
    ],
    materiales: [
      ['Cilindro de aluminio de 1 pulgada × 5 cm (retal de barra redonda)', '1', 'Cualquier pieza metálica regular', 3000],
      ['Cilindro de latón, varilla de 1/2 pulgada × 4 cm', '1', 'Perno o llave de grifo', 3000],
      ['Cilindro de PVC (retal de varilla o tapón macizo)', '1', 'Borrador rectangular', 1000],
      ['Piedra pequeña de río', '1', 'Tornillo grande', 0],
      ['Calibrador plástico (0,05 mm o 0,1 mm)', '1', 'Regla de 30 cm (1 mm)', 12000],
      ['Balanza digital de cocina (1 g) o de joyería (0,01 g)', '1', 'Balanza del laboratorio', 30000],
      ['Probeta plástica de 100 mL (división de 1 mL)', '1', 'Jeringa de 60 mL sin aguja, con la punta tapada', 8000],
      ['Hilo delgado y toalla de papel', '1 m', '—', 500]
    ],
    montaje: [
      'Verifique el cero de la balanza y del calibrador; anote la resolución de cada instrumento.',
      'Llene la probeta hasta unos 50 mL con agua y déjela sobre una superficie horizontal.',
      'Amarre cada objeto con un hilo delgado para bajarlo a la probeta sin salpicar ni golpear el fondo.'
    ],
    seguridad: [
      { p: 'Probeta o recipiente que se vuelca', c: 'loc', ef: 'Agua en la mesa o el piso; resbalones', ctrl: 'Probeta plástica, sobre bandeja; secar de inmediato.', nd: 0, ne: 2, nc: 10 },
      { p: 'Bordes cortantes de los retales metálicos', c: 'mec', ef: 'Cortes leves', ctrl: 'Limar las rebabas al preparar las piezas; manipular sin apretar los bordes.', nd: 2, ne: 2, nc: 10 }
    ],
    epp: 'no se requieren.',
    procedimiento: [
      'Mida la masa de cada objeto tres veces, retirándolo y volviéndolo a poner en la balanza.',
      'En los cilindros, mida el diámetro en tres posiciones distintas y la altura en tres posiciones, primero con regla y luego con calibrador.',
      'Lea el volumen inicial V₁ del agua en la probeta, a la altura de los ojos y en la parte baja del menisco.',
      'Sumerja cada objeto por completo con el hilo, sin burbujas pegadas, y lea V₂. Repita tres veces secando el objeto.',
      'Registre todas las lecturas, no solo los promedios.'
    ],
    tabla: { cols: ['Objeto', '<i>m</i> (g)', '<i>d</i> (mm)', '<i>h</i> (mm)', '<i>V</i>₁ (mL)', '<i>V</i>₂ (mL)', 'ρ (g/cm³)'], filas: 8 },
    analisis: [
      'Calcule el promedio y la incertidumbre tipo A de cada magnitud; súmele en cuadratura la tipo B de la resolución.',
      'Calcule la densidad de cada objeto por el método geométrico (con regla y con calibrador) y por desplazamiento.',
      'Propague la incertidumbre: (u<sub>ρ</sub>/ρ)² = (u<sub>m</sub>/m)² + (2u<sub>d</sub>/d)² + (u<sub>h</sub>/h)², o (u<sub>ρ</sub>/ρ)² = (u<sub>m</sub>/m)² + (u<sub>V</sub>/V)².',
      'Identifique el término que más aporta en cada caso.',
      'Compare con la tabla de densidades mediante z y decida de qué material es cada objeto.'
    ],
    esperado: 'Aluminio: 2,70 g/cm³; latón: entre 8,4 y 8,7 g/cm³ según la aleación; PVC rígido: 1,3 a 1,45 g/cm³; roca granítica: unos 2,65 g/cm³. Para el cilindro de aluminio de 25,4 mm × 50 mm, con calibrador y balanza de joyería la incertidumbre relativa es de 0,1 %; con regla y balanza de cocina el diámetro domina y la incertidumbre ronda el 2,4 %; la probeta de 1 mL da cerca de 2 % en sus 25 cm³ y es inútil para el cilindro de latón (5 cm³, 8 %).',
    errores: [
      ['Leer la probeta desde arriba.', 'El error de paralaje cambia la lectura hasta en 1 mL; se lee a la altura del menisco.'],
      ['Burbujas pegadas al objeto sumergido.', 'Aumentan el volumen desplazado; se sacude el objeto o se humedece antes.'],
      ['Usar el promedio sin incertidumbre para identificar el material.', 'Dos materiales cuya diferencia es menor que la incertidumbre no se pueden distinguir; la conclusión debe decirlo.'],
      ['Medir el diámetro con regla y la altura con calibrador.', 'El diámetro pesa el doble en la incertidumbre: el mejor instrumento va donde más pesa.']
    ],
    orientadoras: [
      '¿Qué dos magnitudes necesitan para la densidad y con qué instrumentos pueden medir cada una?',
      '¿Cómo medirán el volumen de un objeto sin forma geométrica?',
      '¿Cuántas veces repetirán cada medida y cómo combinarán las incertidumbres?',
      '¿Qué tan pequeña debe ser la incertidumbre para distinguir el aluminio (2,70) del magnesio (1,74) o del titanio (4,5)?'
    ],
    abierta: 'En la caja de chatarra del taller hay piezas metálicas sin rótulo. Diseñen un procedimiento para identificar de qué material es cada una a partir de mediciones, e informen con qué grado de confianza lo pueden afirmar.',
    preguntas: [
      '¿Qué medida aportó más a la incertidumbre de la densidad en cada método? ¿Cómo la reducirían?',
      '¿Coinciden la densidad geométrica y la de desplazamiento del cilindro de aluminio? Use z para responder.',
      '¿Por qué el método de desplazamiento falla con el cilindro de latón y no con el de aluminio?',
      'Un estudiante obtuvo 2,9 ± 0,3 g/cm³ y concluyó que su objeto «no es de aluminio». ¿Está justificada su conclusión?'
    ],
    saber: {
      comp: 'ind',
      enunciado: 'Para calcular la densidad de un cilindro, un estudiante mide su masa con una balanza de 0,01 g de resolución, y su diámetro y su altura con una regla de 1 mm. El diámetro es de unos 13 mm y la altura de unos 40 mm. Para reducir al máximo la incertidumbre de la densidad, lo más conveniente es',
      opciones: ['usar una balanza de mayor resolución.', 'medir el diámetro con un calibrador.', 'medir la altura con un calibrador.', 'repetir diez veces la medida de la masa.'],
      clave: 'B',
      just: 'La contribución relativa del diámetro es 2 × (0,29 mm / 13 mm) ≈ 4,5 %, la de la altura 0,7 % y la de la masa menos de 0,1 %. El diámetro domina y además aparece al cuadrado; mejorar su medida es lo que más reduce la incertidumbre.'
    },
    rubrica: [['Presupuesto de incertidumbre', 'Da el resultado sin incertidumbre.', 'Calcula la incertidumbre de una sola magnitud.', 'Propaga todas las contribuciones y da ρ ± u.', 'Identifica la contribución dominante y justifica cómo reducirla.']],
    referencias: ['JCGM 100:2008, Guía para la expresión de la incertidumbre de medida (GUM).', 'D. R. Lide (ed.), <i>CRC Handbook of Chemistry and Physics</i>, densidades de metales y polímeros.']
  });
})();
