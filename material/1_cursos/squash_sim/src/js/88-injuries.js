/* Lesiones: gráficos, mapa corporal, fichas con enlace al simulador, calentamiento, lista y fortalecimiento. */
MS.Injuries = (function () {
  const { U } = MS;
  const TYPES = [
    { k: 'Contracturas', v: 45, br: [['Lumbares', 29], ['Zona glútea', 15], ['Pantorrillas', 13], ['Isquiotibiales', 11], ['Cuádriceps', 11], ['Cervicales', 9], ['Otras', 12]] },
    { k: 'Tendinitis', v: 22, br: [['Epitrocleítis y epicondilitis', 23], ['Aductores', 14], ['Manguito rotador', 11], ['Aquiliana', 11], ['Rotuliana', 11], ['Muñeca', 10], ['Isquiotibiales', 8], ['Otras', 12]] },
    { k: 'Esguinces', v: 15, br: [['Tobillo', 56], ['Muñeca', 15], ['Rodilla', 12], ['Otras', 16]] },
    { k: 'Desgarros', v: 10, br: [['Aductores', 32], ['Isquiotibiales', 25], ['Pantorrilla', 21], ['Otras', 22]] },
    { k: 'Otras', v: 8, br: [] },
  ];
  /* peso de cada región: % del total de lesiones (tipo × desglose) */
  const W = { lumbares: 45 * .29, gluteoMax: 45 * .15, gluteoMed: 45 * .15 * .6, gastro: 45 * .13 + 10 * .21, soleo: 45 * .13 * .8, isquios: 45 * .11 + 22 * .08 + 10 * .25, cuadriceps: 45 * .11 + 22 * .11, trapecio: 45 * .09, extensores: 22 * .23, flexores: 22 * .23, aductores: 22 * .14 + 10 * .32, manguito: 22 * .11, aquiles: 22 * .11, peroneos: 15 * .56, tibial: 15 * .56 * .4, deltoides: 22 * .11 * .4 };
  const LIST = [
    { id: 'lumbalgia', reg: 'Espalda', nombre: 'Lumbalgia y contractura lumbar', m: 'lumbares', dato: '29 % de las contracturas (Buenos Aires) · 26 % de los amateurs encuestados (Mar del Plata)',
      mec: 'Flexión del tronco combinada con torsión al buscar bolas bajas sin una buena estocada, o levantar el tronco de golpe sin usar las piernas. Afecta sobre todo L4, L5 y S1. Un psoas acortado y un core débil la favorecen.',
      gesto: 'Llegar encimado a la bola y doblar la espalda en lugar de las rodillas; jugar con la bola muy pegada al cuerpo cuando las piernas ya están cansadas.',
      senal: 'Dolor al inclinarse o al incorporarse; rigidez. Si el dolor baja por el glúteo o la pierna (ciatalgia), o hay hormigueo o pérdida de fuerza, consultar al médico.',
      prev: 'Core (bird-dog, puente, plancha), fortalecer abdominales, glúteos, isquiotibiales y aductores; estirar el psoas; bajar a la bola con las piernas y la espalda recta.',
      sim: { rt: 'driveDrop', tec: 'encimado', cam: 'lateral' } },
    { id: 'epicondilitis', reg: 'Tren superior', nombre: 'Epicondilitis lateral (codo de tenista)', m: 'extensores', dato: '26 % de los amateurs encuestados · con la epitrocleítis, 23 % de las tendinitis',
      mec: 'Sobrecarga repetida de los extensores de la muñeca (sobre todo el segundo radial) en su inserción del epicóndilo. Las microrroturas se reparan con un tejido de mala calidad que se vuelve a romper: por eso se cronifica.',
      gesto: 'Revés con el brazo flexionado por estar encimado, mal punto de impacto, cara de la raqueta mal orientada por la empuñadura, y «muñequear» en lugar de generar fuerza con piernas, cadera y tronco. También influyen el peso de la raqueta y la tensión del encordado.',
      senal: 'Dolor en la cara externa del codo al extender la muñeca contra resistencia (prueba de Thomsen) o al levantar una silla con el brazo extendido.',
      prev: 'Distancia correcta a la bola y brazo extendido en el impacto; excéntricos de muñeca; revisar empuñadura, peso de la raqueta y tensión de las cuerdas.',
      sim: { rt: 'cruzadasFondo', tec: 'encimado', cam: 'lateral', musculos: true } },
    { id: 'epitroclea', reg: 'Tren superior', nombre: 'Epitrocleítis (codo de golfista)', m: 'flexores', dato: 'Del lado del drive: incluida en el 23 % de tendinitis de codo',
      mec: 'Sobrecarga de los flexores y pronadores que nacen en la epitróclea (cara interna del codo).',
      gesto: 'Drive con el codo flexionado y la muñeca forzando la pronación para compensar una mala posición del cuerpo.',
      senal: 'Dolor en la cara interna del codo al cerrar el puño con fuerza o al flexionar la muñeca contra resistencia.',
      prev: 'Técnica (codo cerca del cuerpo en la preparación y brazo extendido en el impacto), excéntricos de flexores, empuñadura relajada.',
      sim: { rt: 'drivesParalelos', tec: 'encimado', cam: 'tv', musculos: true } },
    { id: 'aquiles', reg: 'Tren inferior', nombre: 'Tendinopatía y rotura del tendón de Aquiles', m: 'aquiles', dato: '11 % de las tendinitis · la lesión tendinosa más vista en el squash según el manual',
      mec: 'Uso excesivo con pantorrillas tensas, aumentos bruscos de carga, calzado poco amortiguado o talón desviado. La rotura ocurre en tendones ya degenerados, a unos 2,5 cm de la inserción, donde hay poca irrigación.',
      gesto: 'Arranques explosivos, frenadas y saltos repetidos; volver a jugar con intensidad tras una pausa larga.',
      senal: 'Dolor y rigidez antes, durante y después de jugar, al subir escaleras o al tocar el tendón. Un chasquido con sensación de «patada» en la pantorrilla puede ser una rotura: atención urgente.',
      prev: 'Excéntricos de gemelo y sóleo, progresión gradual de cargas, buen calentamiento y calzado adecuado. Tratar el dolor en su fase más precoz.',
      sim: { rt: 'ghostAzar', tec: '', cam: 'lateral', musculos: true } },
    { id: 'tobillo', reg: 'Tren inferior', nombre: 'Esguince de tobillo', m: 'peroneos', dato: '56 % de los esguinces · el externo (por inversión) es el 80–90 %',
      mec: 'El pie se va hacia adentro y se estiran o rompen los ligamentos laterales. Grado I: distensión, vuelve en unas 2 semanas. Grado II: rotura parcial con hinchazón y moretón, unas 3 semanas. Grado III: rotura completa, cirugía o inmovilización de unas 4 semanas.',
      gesto: 'Pisar al rival, mal calzado, mala técnica de desplazamiento y piso en mal estado. Los peroneos débiles no recolocan el tobillo a tiempo.',
      senal: 'Dolor, hinchazón y dificultad para apoyar. Un esguince mal rehabilitado deja inestabilidad crónica.',
      prev: 'Propiocepción (apoyo monopodal, superficies inestables) y fortalecimiento de los evertores; rehabilitar completo cada esguince.',
      sim: { rt: 'presion2v1Frente', tec: '', cam: 'tv' } },
    { id: 'rodilla', reg: 'Tren inferior', nombre: 'Rodilla: menisco, ligamentos y dolor patelofemoral', m: 'cuadriceps', dato: '23 % de las lesiones del squash (Chard y Lachmann) · 12 % de los esguinces · 11 % de las tendinitis (rotuliana)',
      mec: 'El menisco se lesiona con peso y giro con la rodilla flexionada, o con valgo forzado. Los ligamentos cruzados, en frenadas con rotación. La rótula y el tendón rotuliano sufren con estocadas de más de 90° o con la rodilla pasando la punta del pie.',
      gesto: 'Estocadas demasiado profundas o con el centro de gravedad adelantado, y recuperar desde posiciones muy bajas.',
      senal: 'Bloqueos o chasquidos (menisco), inestabilidad (ligamentos), dolor delante de la rodilla al bajar escaleras o al estar sentado (patelofemoral).',
      prev: 'Estocada con la rodilla cerca de 90° y sobre el pie; co-contracción de cuádriceps e isquiotibiales; glúteo medio fuerte para evitar el valgo.',
      sim: { rt: 'ghostDiag', tec: 'encimado', cam: 'lateral' } },
    { id: 'aductores', reg: 'Tren inferior', nombre: 'Desgarro y tendinitis de aductores', m: 'aductores', dato: '32 % de los desgarros (el grupo más afectado) · 14 % de las tendinitis',
      mec: 'Contracción excéntrica intensa al frenar desplazamientos laterales o estocadas abiertas.',
      gesto: 'Voleas y llegadas laterales exigidas por la velocidad del juego.',
      senal: 'Dolor en la ingle al abrir la pierna o al cambiar de dirección.',
      prev: 'Plancha de Copenhague, calentamiento con desplazamientos laterales, flexibilidad.',
      sim: { rt: 'ghostVolea', tec: '', cam: 'frontal', musculos: true } },
    { id: 'isquios', reg: 'Tren inferior', nombre: 'Desgarro de isquiotibiales', m: 'isquios', dato: '25 % de los desgarros · 11 % de las contracturas · 8 % de las tendinitis',
      mec: 'Estiramiento bajo carga en estocadas profundas a bolas bajas y en arranques con fatiga; desequilibrio de fuerza con el cuádriceps.',
      gesto: 'Estocada larga con el tronco muy inclinado hacia adelante.',
      senal: 'Pinchazo en la cara posterior del muslo, a veces con moretón.',
      prev: 'Curl nórdico, peso muerto rumano, flexibilidad y buen calentamiento.',
      sim: { rt: 'driveDrop', tec: '', cam: 'lateral', musculos: true } },
    { id: 'gemelo', reg: 'Tren inferior', nombre: 'Desgarro del gemelo («pierna de tenista»)', m: 'gastro', dato: '21 % de los desgarros · 13 % de las contracturas (pantorrillas)',
      mec: 'Arranque explosivo con la rodilla extendida y el tobillo flexionado hacia arriba, sobre todo con frío o fatiga.',
      gesto: 'Primer paso hacia la bola desde una posición estática, sin split-step.',
      senal: 'Dolor súbito en la pantorrilla, como una pedrada.',
      prev: 'Excéntricos de gemelo, calentamiento progresivo, hidratación.',
      sim: { rt: 'ghostAzar', tec: '', cam: 'lateral', musculos: true } },
    { id: 'hombro', reg: 'Tren superior', nombre: 'Tendinopatía del manguito rotador', m: 'manguito', dato: '11 % de las tendinitis (sobre todo el supraespinoso)',
      mec: 'Sobrecarga de los tendones que centran la cabeza del húmero; en casos graves, lesión completa y luxación.',
      gesto: 'Golpear encimado o con la pierna cambiada obliga a forzar el hombro para dar potencia; swing excesivo sin la «tijera» escapular.',
      senal: 'Dolor al levantar el brazo o al dormir sobre ese lado.',
      prev: 'Rotación externa con banda, control escapular, terminación del revés entre las 11 y las 12 (manual).',
      sim: { rt: 'drivesParalelos', tec: 'cambiada', cam: 'tv', musculos: true } },
    { id: 'fascitis', reg: 'Tren inferior', nombre: 'Talalgia y fascitis plantar', m: 'soleo', dato: 'Incluida en las lesiones frecuentes del manual',
      mec: 'Mal apoyo plantar y repetición de cargas de mucho impacto; calzado duro, estrecho o gastado.',
      gesto: 'Muchas horas de cancha con zapatillas sin soporte del medio pie.',
      senal: 'Dolor en el talón con los primeros pasos de la mañana.',
      prev: 'Test de apoyo plantar, calzado adecuado y en buen estado, fortalecer la musculatura del pie, estirar gemelo y fascia.',
      sim: { rt: 'ghost6', tec: '', cam: 'tv' } },
    { id: 'muneca', reg: 'Tren superior', nombre: 'Tendinitis y esguince de muñeca', m: 'extensores', dato: '10 % de las tendinitis · 15 % de los esguinces',
      mec: 'Inflamación de los tendones que rodean la muñeca por sobreuso; esguinces por golpes o caídas.',
      gesto: 'Abusar de la muñeca para dirigir la bola; empuñadura inadecuada.',
      senal: 'Dolor al girar o flexionar la muñeca, hinchazón.',
      prev: 'Muñeca firme y levantada, cadena cinética completa, fortalecimiento de antebrazo.',
      sim: { rt: 'soloDrive', tec: 'encimado', cam: 'tv', musculos: true } },
    { id: 'ciatalgia', reg: 'Espalda', nombre: 'Ciatalgia y hernia de disco', m: 'lumbares', dato: 'Evolución posible de la lumbalgia cuando el disco comprime la raíz nerviosa',
      mec: 'El disco se desplaza y presiona la raíz del nervio ciático; el dolor se irradia por el glúteo y la pierna, a veces hasta el dedo gordo. Las causas son progresivas: años de cargas en flexión y torsión, golpes, caídas, inflamación y artrosis.',
      gesto: 'Golpes con el tronco flexionado y girado, sobre todo con las piernas cansadas.',
      senal: 'Dolor tipo «corrientazo» que baja por la pierna y empeora con ciertos movimientos. Si hay pérdida de fuerza o de sensibilidad, consultar de inmediato.',
      prev: 'La misma que la lumbalgia: core, glúteos, flexibilidad del psoas y técnica de piernas. Ante dolor irradiado, dejar de jugar y consultar.',
      sim: { rt: 'driveDrop', tec: 'encimado', cam: 'lateral', musculos: true } },
    { id: 'espondilo', reg: 'Espalda', nombre: 'Espondilólisis y espondilolistesis', m: 'lumbares', dato: 'Afecta sobre todo a la quinta vértebra lumbar, luego a la cuarta',
      mec: 'Rotura del istmo (la lámina) de la vértebra por estrés repetido en extensión y rotación (espondilólisis); si la vértebra se desliza sobre la de abajo, por ejemplo L5 sobre S1, es una espondilolistesis. La charnela lumbosacra es el punto débil de la columna.',
      gesto: 'Hiperextensiones y rotaciones violentas del tronco repetidas, típicas en jóvenes que entrenan mucho.',
      senal: 'Dolor lumbar al arquear la espalda, a veces en un solo lado.',
      prev: 'Evitar la hiperextensión y la rotación forzada; fortalecer el core profundo; controlar el volumen de entrenamiento en jóvenes.',
      sim: { rt: 'cruzadasFondo', tec: 'cambiada', cam: 'tv' } },
    { id: 'bursitis', reg: 'Tren superior', nombre: 'Bursitis', m: 'deltoides', dato: 'Puede aparecer en hombro, codo, rodilla, cadera y tobillo',
      mec: 'Inflamación de las bolsas sinoviales que reducen el roce entre tendones, músculos y huesos, por presión, fricción o golpes repetidos.',
      gesto: 'Golpes contra las paredes y movimientos repetidos con mala alineación articular.',
      senal: 'Hinchazón localizada, dolor al apoyar o al mover la articulación.',
      prev: 'Técnica, dosificación de la carga y protección frente a choques; tratar pronto la inflamación.',
      sim: { rt: 'presion2v1Fondo', tec: '', cam: 'tv' } },
    { id: 'sobreuso', reg: 'Tren inferior', nombre: 'Sobreuso por la pierna cambiada', m: 'cuadriceps', dato: 'El manual estima que un diestro que juega el drive con la pierna cambiada usa la misma pierna delantera en cerca del 90 % de sus golpes',
      mec: 'Si en el drive también adelanta la pierna derecha (la del revés), un diestro carga siempre la misma rodilla, cadera y tobillo: desgaste por sobreuso.',
      gesto: 'Llegar de frente al frontón o con la pierna cambiada por costumbre, no por emergencia. El manual admite como máximo un 30 % de golpes así en jugadores avanzados.',
      senal: 'Dolor que aparece siempre del mismo lado; asimetría de fuerza entre piernas.',
      prev: 'Entrenar la motricidad bilateral equivalente y la llegada perfilada con la pierna correcta.',
      sim: { rt: 'drivesParalelos', tec: 'cambiada', cam: 'tv' } },
  ];
  const WARM = [
    ['Trote y desplazamientos suaves', 180, 'Trote, pasos laterales y hacia atrás alrededor de la cancha. Sube la temperatura del músculo y la frecuencia cardiaca.'],
    ['Movilidad articular', 120, 'Círculos de tobillos, rodillas, caderas, columna, hombros y muñecas.'],
    ['Activación de core y glúteos', 120, 'Puente de glúteo, plancha frontal y lateral, caminata lateral con banda.'],
    ['Estiramientos dinámicos', 120, 'Zancadas con giro del tronco, balanceos de pierna, círculos de brazos.'],
    ['Split-step y salidas', 60, 'Saltitos en la T y primeros pasos explosivos a cada esquina.'],
    ['Ghosting suave', 120, 'Las seis esquinas al 50–70 % con golpe fantasma y regreso a la T.'],
    ['Peloteo progresivo', 300, 'Paralelas suaves aumentando el ritmo; la bola también necesita calentarse para rebotar.'],
    ['Voleas y golpes cortos', 120, 'Voleas de peloteo y dejadas para afinar el toque.'],
  ];
  const CHECK = ['Entrada en calor completa', 'Flexibilidad articular y elasticidad muscular', 'Hidratación antes, durante y después', 'Vuelta a la calma', 'Alimentación adecuada', 'Fortalecimiento muscular general y específico', 'Preparación física general y específica', 'Calzado adecuado y en buen estado', 'Salud bucal', 'Entrenamiento de habilidades mentales', 'Chequeos y evaluaciones físico-médicas', 'Test de apoyo plantar', 'Trabajo propioceptivo de pies y tobillos', 'Técnica: conceptos técnicos básicos', 'Estilo personal completo, con variantes tácticas', 'Un estilo que respete la técnica sana', 'Entrenamiento de la percepción y la visión periférica'];
  const STR = [
    ['Curl nórdico', 'Isquiotibiales', '2–3 × 5–8 (excéntrico)', 'Reduce desgarros en estocadas y arranques.'],
    ['Plancha de Copenhague', 'Aductores', '2–3 × 20–30 s por lado', 'Es el grupo con más desgarros.'],
    ['Elevación de talón excéntrica en escalón', 'Gemelo, sóleo, tendón de Aquiles', '3 × 15 con rodilla extendida y flexionada', 'Tendinopatía aquílea y desgarro de gemelo.'],
    ['Sentadilla búlgara o estocada controlada', 'Cuádriceps, glúteo mayor', '3 × 8–10 por pierna', 'Estocada estable a 90°, rodilla sobre el pie.'],
    ['Puente de glúteo o hip thrust', 'Glúteo mayor, isquiotibiales', '3 × 10–12', 'Potencia para salir de la estocada.'],
    ['Caminata lateral con banda', 'Glúteo medio', '3 × 12 pasos por lado', 'Controla el valgo de rodilla.'],
    ['Bird-dog y plancha lateral', 'Core profundo, lumbares, oblicuos', '3 × 30 s', 'Protección lumbar.'],
    ['Rotación externa con banda', 'Manguito rotador', '3 × 15', 'Estabilidad del hombro y frenado del swing.'],
    ['Excéntricos de muñeca', 'Extensores y flexores del antebrazo', '3 × 15', 'Prevención de epicondilitis y epitrocleítis.'],
    ['Equilibrio monopodal inestable', 'Peroneos, propiocepción del tobillo', '3 × 30 s por pierna', 'Prevención del esguince de tobillo.'],
  ];

  /* ---------- gráficos SVG ---------- */
  function bars(host, data, onClick, sel, unit) {
    const rowH = 30, w = 520, lab = 190, mx = Math.max(...data.map((d) => d[1]));
    const h = data.length * rowH + 6;
    let s = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Gráfico de barras">`;
    data.forEach(([k, v], i) => {
      const y = i * rowH + 4, bw = ((w - lab - 50) * v) / mx;
      const on = sel == null || sel === i;
      s += `<g data-i="${i}" style="cursor:${onClick ? 'pointer' : 'default'}"><rect x="0" y="${y}" width="${w}" height="${rowH - 4}" fill="transparent"/><text class="lbl" x="${lab - 8}" y="${y + 17}" text-anchor="end">${U.esc(k)}</text><rect x="${lab}" y="${y + 4}" width="${Math.max(2, bw)}" height="${rowH - 12}" rx="4" fill="${on ? 'var(--brand)' : 'var(--line)'}"/><text x="${lab + bw + 6}" y="${y + 17}">${v}${unit || ' %'}</text></g>`;
    });
    s += '</svg>';
    host.innerHTML = s;
    if (onClick) for (const g of host.querySelectorAll('g[data-i]')) g.addEventListener('click', () => onClick(+g.dataset.i));
  }
  let selType = 0;
  function charts() {
    bars(U.$('#chTypes'), TYPES.map((t) => [t.k, t.v]), (i) => { selType = i; charts(); }, selType);
    const t = TYPES[selType], br = U.$('#chBreak');
    if (t.br.length) { br.innerHTML = ''; br.append(U.h('p', { class: 'small', style: { margin: '4px 0' } }, U.h('b', null, 'Desglose de ' + t.k.toLowerCase()), ' (porcentaje dentro de este tipo)')); const d = U.h('div'); br.append(d); bars(d, t.br, null, null); }
    else br.innerHTML = '<p class="small muted">Sin desglose en la fuente.</p>';
    bars(U.$('#chRacket'), [['Squash', 59], ['Tenis', 21], ['Bádminton', 20]], null, 0);
  }

  /* ---------- fichas ---------- */
  let filter = 'Todas';
  function cards() {
    const box = U.$('#injCards'); box.innerHTML = '';
    for (const it of LIST) {
      if (filter !== 'Todas' && it.reg !== filter) continue;
      const btn = U.h('button', { class: 'btn primary', style: { marginTop: '10px' } }, 'Ver el gesto en el simulador');
      btn.addEventListener('click', () => {
        const rt = MS.Routines.byId[it.sim.rt];
        MS.App.go('simulador');
        MS.Sim.open(rt, { key: 'lib:' + it.sim.rt, tec: it.sim.tec || '', cam: it.sim.cam, musculos: !!it.sim.musculos });
        U.toast(it.sim.tec ? 'Simulación con técnica «' + (it.sim.tec === 'cambiada' ? 'pierna cambiada' : 'encimado') + '»: compárala con la correcta en Ajustes.' : 'Observa el gesto y los músculos activos.');
      });
      const g = MS.Muscles.byId[it.m];
      box.append(U.h('article', { class: 'card inj', id: 'inj-' + it.id },
        U.h('h3', null, it.nombre),
        U.h('div', { class: 'meta' }, U.h('span', { class: 'tag' }, it.reg), g ? U.h('button', { class: 'chip', onclick: () => { MS.App.go('anatomia'); MS.Anat.select(it.m); } }, g.nombre) : ''),
        U.h('p', { class: 'notebox small' }, it.dato),
        U.h('dl', { style: { marginTop: '8px' } }, U.h('dt', null, 'Mecanismo'), U.h('dd', null, it.mec), U.h('dt', null, 'Gesto de riesgo en el squash'), U.h('dd', null, it.gesto), U.h('dt', null, 'Señales'), U.h('dd', null, it.senal), U.h('dt', null, 'Prevención'), U.h('dd', null, it.prev)),
        btn));
    }
  }

  /* ---------- calentamiento ---------- */
  const WU = { i: 0, left: WARM[0][1], run: false, timer: 0, ac: null };
  const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function beep() { try { if (!WU.ac) return; const o = WU.ac.createOscillator(), g = WU.ac.createGain(); o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(WU.ac.destination); o.start(); o.stop(WU.ac.currentTime + 0.18); } catch (e) { /* sin audio */ } }
  function wuRender() {
    const [n, d, desc] = WARM[WU.i];
    U.$('#wuStep').textContent = `Paso ${WU.i + 1} de ${WARM.length}`; U.$('#wuName').textContent = n; U.$('#wuDesc').textContent = desc;
    U.$('#wuTime').textContent = fmt(WU.left); U.$('#wuBar').style.width = (100 * (1 - WU.left / d)) + '%';
    U.$('#wuPlay').textContent = WU.run ? 'Pausar' : 'Iniciar';
    U.$$('#wuList li').forEach((li, i) => { li.style.fontWeight = i === WU.i ? '700' : ''; li.style.color = i === WU.i ? 'var(--ink)' : ''; });
  }
  function wuGo(i) { WU.i = U.clamp(i, 0, WARM.length - 1); WU.left = WARM[WU.i][1]; wuRender(); }
  function wuTick() {
    if (!WU.run) return;
    WU.left -= 1;
    if (WU.left <= 0) { beep(); if (WU.i < WARM.length - 1) wuGo(WU.i + 1); else { WU.run = false; U.toast('Calentamiento completo: ¡a jugar!'); wuGo(0); } }
    wuRender();
  }
  let wake = null;
  async function wakeOn() { try { if (navigator.wakeLock) wake = await navigator.wakeLock.request('screen'); } catch (e) { wake = null; } }

  /* ---------- lista ---------- */
  function checklist() {
    const st = U.store.get('ms.check', {}) || {};
    const ul = U.$('#chk'); ul.innerHTML = '';
    CHECK.forEach((c, i) => {
      const cb = U.h('input', { type: 'checkbox', id: 'chk' + i, checked: st[i] ? true : null });
      cb.addEventListener('change', () => { st[i] = cb.checked; U.store.set('ms.check', st); score(); });
      ul.append(U.h('li', null, U.h('label', { for: 'chk' + i }, cb, U.h('span', null, c))));
    });
    const score = () => { const n = CHECK.filter((_, i) => st[i]).length; U.$('#chkScore').textContent = `${n} de ${CHECK.length} hábitos de prevención en marcha.`; };
    score();
  }

  function init() {
    charts();
    const body = MS.Body.create(U.$('#injBody'), { interactive: true, onSelect: (id) => { const it = LIST.find((x) => x.m === id) || LIST.find((x) => (id === 'gluteoMax' || id === 'gluteoMed' || id === 'coreProf' || id === 'psoas') && x.id === 'lumbalgia'); if (it) { filter = 'Todas'; renderFilter(); cards(); const el = U.$('#inj-' + it.id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.outline = '2px solid var(--brand)'; setTimeout(() => (el.style.outline = ''), 1600); } } else U.toast('Sin ficha específica para esta zona.'); } });
    const mx = Math.max(...Object.values(W));
    const paint = () => body.paint((id, b) => (W[id] ? MS.TV.heatCol(0.12 + 0.88 * Math.pow(W[id] / mx, 1.3), b) : b));
    paint(); MS.Injuries._paint = paint;
    renderFilter(); cards();
    const ol = U.$('#wuList'); WARM.forEach((w, i) => ol.append(U.h('li', null, `${w[0]} · ${fmt(w[1])}`)));
    U.$('#wuPlay').addEventListener('click', () => {
      WU.run = !WU.run;
      if (WU.run) { try { WU.ac = WU.ac || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { WU.ac = null; } wakeOn(); clearInterval(WU.timer); WU.timer = setInterval(wuTick, 1000); }
      else { clearInterval(WU.timer); if (wake) { wake.release().catch(() => {}); wake = null; } }
      wuRender();
    });
    U.$('#wuNext').addEventListener('click', () => wuGo(WU.i + 1));
    U.$('#wuPrev').addEventListener('click', () => wuGo(WU.i - 1));
    U.$('#wuReset').addEventListener('click', () => { WU.run = false; clearInterval(WU.timer); wuGo(0); });
    wuRender();
    checklist();
    const tb = U.$('#strTbl');
    tb.append(U.h('thead', null, U.h('tr', null, ['Ejercicio', 'Músculos', 'Dosis', 'Para qué'].map((x) => U.h('th', null, x)))));
    tb.append(U.h('tbody', null, STR.map((r) => U.h('tr', null, r.map((c, i) => U.h('td', i === 0 ? { style: { fontWeight: 600 } } : null, c))))));
  }
  function renderFilter() {
    const f = U.$('#injFilter'); f.innerHTML = '';
    for (const k of ['Todas', 'Tren inferior', 'Espalda', 'Tren superior']) { const b = U.h('button', { class: 'chip', 'aria-pressed': String(k === filter), text: k }); b.addEventListener('click', () => { filter = k; renderFilter(); cards(); }); f.append(b); }
  }
  MS.App.on('lesiones', { init, theme: () => { charts(); MS.Injuries && MS.Injuries._paint && MS.Injuries._paint(); } });
  return { LIST, TYPES };
})();
