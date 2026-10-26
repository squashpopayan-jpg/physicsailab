// Módulo 5: Física del Estado Sólido & hBN, Física Nuclear, Partículas Elementales, Astrofísica y Cosmología (78 preguntas)
module.exports = [
  // --- CIENCIA DE MATERIALES Y FÍSICA DEL ESTADO SÓLIDO (30 preguntas) ---
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Redes Cristalinas de Bravais",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuántas redes cristalinas tridimensionales periódicas distintas (Redes de Bravais) existen en la naturaleza, clasificadas dentro de 7 sistemas cristalinos?",
    opciones: [
      "A. 7 redes",
      "B. 14 redes de Bravais",
      "C. 32 redes",
      "D. 230 redes espaciales"
    ],
    correcta: 1,
    explicacion: "Auguste Bravais demostró geométricamente en 1848 que en 3 dimensiones espaciales solo pueden existir exactamente 14 arreglos periódicos tridimensionales independientes y no equivalentes que llenan el espacio por traslación pura."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Ley de Bragg",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La Ley de Bragg para la difracción constructiva de rayos X en los planos atómicos paralelos de un cristal separados una distancia interplanar 'd' se formula como:",
    opciones: [
      "A. 2 d sen θ = n λ (con n = 1, 2, 3...)",
      "B. d cos θ = 2 n λ",
      "C. d sen θ = n λ²",
      "D. 2 d tan θ = λ / n"
    ],
    correcta: 0,
    explicacion: "William Henry Bragg y su hijo William Lawrence Bragg dedujeron que la diferencia de camino óptico entre rayos X reflejados por planos contiguos es 2d senθ. Al igualarse a un número entero n de longitudes de onda, se produce interferencia constructiva, base de la cristalografía."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Índices de Miller",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Los Índices de Miller (h k l) utilizados para designar planos cristalográficos en una red espacial se calculan matemáticamente a partir de:",
    opciones: [
      "A. La suma directa de los radios atómicos",
      "B. Los recíprocos de las intersecciones fraccionarias del plano con los ejes cristalográficos principales, multiplicados para obtener los números enteros más pequeños posibles",
      "C. El número de electrones de valencia en la superficie",
      "D. El momento dipolar magnético del cristal"
    ],
    correcta: 1,
    explicacion: "Si un plano interseca los ejes en pa, qb, rc, los recíprocos 1/p, 1/q, 1/r se reducen a la terna de enteros coprimos más pequeños (hkl). Un índice cero indica que el plano es rigurosamente paralelo a ese eje cristalográfico."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Fonones y Vibraciones de Red",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué es un 'Fonón' en la física de la materia condensada?",
    opciones: [
      "A. Una partícula elemental de carga fraccionaria",
      "B. Un cuasipartícula cuántica que cuantiza los modos normales de vibración colectiva elástica de la red cristalina con energía E = ħ ω",
      "C. Un fotón de luz confinado en un metal",
      "D. Un tipo de defecto puntual como una vacancia"
    ],
    correcta: 1,
    explicacion: "Así como el fotón cuantiza las oscilaciones del campo electromagnético, el fonón cuantiza las vibraciones mecánicas de los iones en la red cristalina. Son responsables de la conducción térmica en aislantes y de la capacidad calorífica de los sólidos."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Modelo de Debye",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "A temperaturas criogénicas muy bajas (T << θ_Debye), la capacidad calorífica a volumen constante Cv de un sólido aislante no magnético decae siguiendo:",
    opciones: [
      "A. La ley de Dulong-Petit (Cv = 3 R constante)",
      "B. La Ley T³ de Debye: Cv ∝ T³",
      "C. Una caída lineal simple con T",
      "D. Un decaimiento exponencial e^(-T)"
    ],
    correcta: 1,
    explicacion: "Peter Debye trató a los sólidos como un medio elástico continuo con fonones acústicos. A bajas temperaturas solo los modos acústicos de baja energía están térmicamente excitados, originando una densidad de estados proporcional a ω² que integra una capacidad calorífica proporcional a T³."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Teoría de Bandas de Energía",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál es la diferencia electrónica fundamental que distingue a un semiconductor de un aislante eléctrico perfecto?",
    opciones: [
      "A. Los aislantes tienen masa atómica nula",
      "B. Ambos poseen una banda de valencia llena y una de conducción vacía a 0 K, pero el semiconductor tiene una brecha de banda prohibida moderada (Eg ≈ 0.5 a 3.0 eV) que permite excitación térmica a temperatura ambiente, mientras que el aislante tiene una brecha muy ancha (Eg > 4-5 eV)",
      "C. Los semiconductores carecen de electrones de valencia",
      "D. Los aislantes son exclusivamente metales alcalinos"
    ],
    correcta: 1,
    explicacion: "En el silicio (Eg ≈ 1.1 eV), la energía térmica ambiental k_B T (≈ 0.026 eV a 300 K) basta para promover una fracción medible de electrones a la banda de conducción. En aislantes como el diamante (Eg ≈ 5.5 eV) o el hBN (Eg ≈ 5.9 eV), la probabilidad térmica es prácticamente nula."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Nivel de Fermi",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En la estadística de Fermi-Dirac, ¿qué representa la Energía de Fermi E_F a una temperatura de cero absoluto (0 Kelvin)?",
    opciones: [
      "A. La energía promedio de todos los fonones de la red",
      "B. La energía del nivel cuántico ocupado de mayor energía por los electrones en el estado fundamental del sistema",
      "C. La energía necesaria para ionizar un núcleo atómico",
      "D. La brecha de energía entre el silicio y el germanio"
    ],
    correcta: 1,
    explicacion: "A T = 0 K, los electrones llenan todos los estados cuánticos disponibles desde la mínima energía hasta E_F debido al Principio de Exclusión de Pauli. Todos los estados con E < E_F están 100% ocupados (probabilidad f=1) y los estados con E > E_F están vacíos (f=0)."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Dopaje de Semiconductores Tipo n",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Cuando se dopa un cristal de silicio puro (grupo 14, cuatro electrones de valencia) con trazas de fósforo o arsénico (grupo 15, cinco electrones de valencia):",
    opciones: [
      "A. Se destruye la red cristalina convirtiéndose en vidrio amorfo",
      "B. Se obtiene un semiconductor tipo n, donde cuatro electrones forman enlaces covalentes y el quinto electrón queda débilmente ligado, aportando electrones libres como portadores mayoritarios a la banda de conducción",
      "C. Se crea un semiconductor tipo p con huecos libres",
      "D. El material se vuelve superconductor a temperatura ambiente"
    ],
    correcta: 1,
    explicacion: "Los átomos del grupo 15 actúan como impurezas 'donadoras': introducen niveles energéticos discretos justo debajo del fondo de la banda de conducción. La energía térmica ambiente basta para ionizar el quinto electrón, generando una alta densidad de electrones libres de conducción."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Dopaje de Semiconductores Tipo p",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Para fabricar un semiconductor de silicio tipo p, se introducen impurezas aceptoras trivalentes (del grupo 13 de la Tabla Periódica) tales como:",
    opciones: [
      "A. Fósforo o Antimonio",
      "B. Boro, Galio o Indio",
      "C. Cobre o Plata",
      "D. Neón o Argón"
    ],
    correcta: 1,
    explicacion: "El boro solo tiene 3 electrones de valencia. Al sustituir a un átomo de silicio en la red, deja un enlace covalente incompleto llamado 'hueco' (vacancia electrónica positiva). Los electrones vecinos pueden saltar a ese hueco, permitiendo que la carga positiva efectiva se mueva libremente."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Juntura p-n y Zona de Agotamiento",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En una juntura p-n en equilibrio térmico sin voltaje externo aplicado, los electrones del lado n se difunden hacia el lado p y se recombinan con huecos, formándose una región llamada:",
    opciones: [
      "A. Cono de Dirac",
      "B. Zona de agotamiento o de carga espacial, donde los iones fijos inmunes crean un campo eléctrico interno que frena la difusión posterior",
      "C. Canal superconductor de Cooper",
      "D. Capa ferromagnética de Bloch"
    ],
    correcta: 1,
    explicacion: "Los iones donadores positivos fijos en el lado n y los iones aceptores negativos fijos en el lado p quedan al descubierto al recombinarse los portadores libres. Este dipolo macroscópico genera un fuerte campo eléctrico interno y una barrera de potencial de contacto (V_bi ≈ 0.7 V en Si)."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Diodos Emisores de Luz (LED)",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál es el mecanismo cuántico por el cual un diodo emisor de luz (LED) genera fotones cuando se polariza en sentido directo?",
    opciones: [
      "A. La incandescencia térmica de filamentos microscópicos de tungsteno",
      "B. La recombinación radiativa directa de electrones de la banda de conducción con huecos de la banda de valencia, emitiendo un fotón de energía aproximadamente igual a la brecha de banda (hν ≈ Eg)",
      "C. La fisión de núcleos pesados en la juntura",
      "D. El efecto fotoeléctrico inverso sobre la batería"
    ],
    correcta: 1,
    explicacion: "Al aplicar voltaje directo, los electrones y huecos son inyectados hacia la juntura p-n. Al encontrarse, el electrón decae a un estado de menor energía en la banda de valencia, liberando el exceso de energía Eg en forma de un fotón cuya longitud de onda λ = hc/Eg determina el color del LED."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Superconductividad y Resistencia Cero",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "El fenómeno de la superconductividad fue descubierto en 1911 por Heike Kamerlingh Onnes en Leiden al observar que la resistencia eléctrica del mercurio líquido enfriado con helio:",
    opciones: [
      "A. Se reducía a la mitad de su valor a 10 K",
      "B. Caía abruptamente a cero absoluto medible por debajo de una temperatura crítica Tc ≈ 4.2 Kelvin",
      "C. Aumentaba exponencialmente hasta aislar completamente el circuito",
      "D. Generaba chispas eléctricas continuas"
    ],
    correcta: 1,
    explicacion: "A 4.2 K, el mercurio sufrió una transición de fase electrónica de segundo orden donde su resistividad eléctrica cayó a cero estricto (< 10⁻²⁶ Ω·m). Una corriente inducida en un anillo superconductor cerrado puede persistir durante años sin disiparse."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Efecto Meissner-Ochsenfeld",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué demostraron Walther Meissner y Robert Ochsenfeld en 1933 que diferencia a un verdadero superconductor de un hipotético 'conductor perfecto con resistencia cero'?",
    opciones: [
      "A. Los superconductores no conducen calor",
      "B. La expulsión activa y espontánea del campo magnético del interior del material (B = 0, diamagnetismo perfecto) cuando se enfría por debajo de Tc en presencia de un campo magnético exterior",
      "C. La rotación espontánea del material a velocidad angular constante",
      "D. La absorción de todos los neutrones térmicos"
    ],
    correcta: 1,
    explicacion: "Un conductor ideal solo mantendría constante el flujo que ya tenía al enfriarse (por Lenz). Un superconductor expulsa activamente todo campo magnético previo al pasar por Tc (diamagnetismo perfecto con susceptibilidad magnética χ = -1), permitiendo la levitación magnética estable."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Teoría BCS de la Superconductividad",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "La teoría microscópica de Bardeen, Cooper y Schrieffer (BCS, 1957) explica la superconductividad convencional en metales a través de:",
    opciones: [
      "A. La repulsión electrostática pura entre núcleos pesados",
      "B. La formación de 'Pares de Cooper': pares de electrones ligados con momentos y espines opuestos gracias a una interacción atractiva efectiva mediada por el intercambio virtual de fonones de la red cristalina",
      "C. El colapso relativista de la nube electrónica al núcleo",
      "D. La creación de monopolos magnéticos"
    ],
    correcta: 1,
    explicacion: "Un electrón deforma localmente la red iónica positiva atrayendo carga hacia sí. Antes de que los iones se relajen, un segundo electrón es atraído por ese exceso de carga positiva. Este apareamiento de Cooper forma bosones compuestos que condensan en un macroestado cuántico común con resistencia cero."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Superconductores Tipo I y Tipo II",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué caracteriza a los superconductores de Tipo II en presencia de un campo magnético moderado entre su campo crítico inferior Hc1 y superior Hc2?",
    opciones: [
      "A. Pierden la superconductividad completamente al alcanzar Hc1",
      "B. Entran en un 'estado mixto' (fase de vórtices de Abrikosov) donde el campo magnético penetra en filamentos discretos cuantizados rodeados por supercorrientes, reteniendo resistencia cero",
      "C. Se vuelven materiales ferromagnéticos permanentes",
      "D. La temperatura crítica se multiplica por diez"
    ],
    correcta: 1,
    explicacion: "Alexei Abrikosov demostró que los superconductores de Tipo II toleran campos colosales (de decenas de Teslas) al permitir que el flujo penetre en vórtices cuantizados con flujo magnético elemental Φ₀ = h/(2e). Esto permite construir los imanes superconductores del LHC y de resonancias médicas."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Grafeno y Estructura Cristalina",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Qué es el Grafeno, aislado experimentalmente por primera vez en 2004 por Andre Geim y Konstantin Novoselov en la Universidad de Manchester (Premio Nobel 2010)?",
    opciones: [
      "A. Un polímero plástico derivado del petróleo",
      "B. Una monocapa bidimensional de átomos de carbono con hibridación sp² organizados en una red hexagonal periódica en forma de panal de abejas con un solo átomo de espesor",
      "C. Un compuesto de silicio y germanio",
      "D. Un isótopo artificial de diamante"
    ],
    correcta: 1,
    explicacion: "El grafeno es el primer material bidimensional auténtico aislado. Posee una resistencia mecánica 200 veces superior a la del acero, una conductividad térmica descomunal (~5000 W/(m·K)) y una transparencia óptica del 97.7% a la luz visible."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Conos de Dirac en Grafeno",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Por qué los portadores de carga en el grafeno se comportan como 'fermiones de Dirac relativistas sin masa' con relación de dispersión lineal E(k) = ± ħ v_F k?",
    opciones: [
      "A. Porque los electrones viajan literalmente a la velocidad de la luz c en el vacío",
      "B. Porque las bandas de valencia y conducción se tocan en seis puntos discretos (puntos K y K' de la zona de Brillouin formando los Conos de Dirac), donde la ecuación cuántica efectiva de baja energía es formalmente idéntica a la ecuación de Dirac para partículas sin masa con v_F ≈ c / 300",
      "C. Porque el carbono no posee electrones pz",
      "D. Por la ausencia de enlaces sigma"
    ],
    correcta: 1,
    explicacion: "Cerca de los puntos K, la dispersión parabólica ordinaria E ∝ k² se vuelve rigurosamente lineal E = ħv_F k, lo que implica una masa efectiva de reposo nula y una velocidad de Fermi constante v_F ≈ 10⁶ m/s. Esto produce fenómenos como el efecto túnel de Klein y movilidad ultra-alta."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Nitruro de Boro Hexagonal (hBN)",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "El Nitruro de Boro Hexagonal (hBN), apodado habitualmente 'grafeno blanco', comparte la misma red hexagonal plana del grafeno pero con átomos alternados de boro y nitrógeno. ¿Cuál es su propiedad electrónica fundamental?",
    opciones: [
      "A. Es un metal superconductor a temperatura ambiente",
      "B. Es un aislante de banda ancha (wide bandgap) con Eg ≈ 5.9 a 6.0 eV, químicamente inerte, térmicamente estable y atómicamente ultra-liso",
      "C. Es un semiconductor de brecha nula idéntico al grafeno",
      "D. Es un gas a temperatura ambiente"
    ],
    correcta: 1,
    explicacion: "Al tener átomos distintos en las dos subredes (Boro electropositivo y Nitrógeno electronegativo), se rompe la simetría de inversión, abriendo una enorme brecha de energía prohibida de casi 6 eV en los puntos K. Esto convierte al hBN en un aislante 2D excepcional."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Encapsulamiento con hBN",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Por qué el nitruro de boro hexagonal (hBN) es el sustrato dieléctrico por excelencia para encapsular grafeno y dicalcogenuros de metales de transición (TMDs) en nanoelectrónica cuántica avanzada?",
    opciones: [
      "A. Porque disuelve las impurezas con ácido clorhídrico",
      "B. Porque al estar libre de enlaces colgantes (dangling bonds), no poseer trampas de carga superficiales y ser atómicamente plano con parámetros de red casi coincidentes con el grafeno (~1.7% de desajuste), preserva movilidades electrónicas extraordinarias cercanas al límite intrínseco",
      "C. Porque convierte a cualquier material en ferromagnético",
      "D. Porque bloquea completamente la gravedad"
    ],
    correcta: 1,
    explicacion: "En sustratos ordinarios como SiO₂, la rugosidad y las cargas atrapadas dispersan a los electrones reduciendo drásticamente su movilidad. Al encapsular grafeno entre dos capas ultra-limpias de hBN, los electrones pueden viajar micrómetros balísticamente sin colisionar."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Heteroestructuras de Van der Waals",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Cómo se construyen las denominadas 'Heteroestructuras de Van der Waals' en la física moderna de materiales bidimensionales?",
    opciones: [
      "A. Soldando metales fundidos a más de 3000 °C",
      "B. Apilando capa por capa diferentes cristales atómicamente delgados (como grafeno, hBN, MoS₂ y WSe₂) unidos verticalmente por fuerzas interfaciales de Van der Waals, sin necesidad de acoplamiento epitaxial de redes",
      "C. Bombardeando diamantes con rayos gamma",
      "D. Evaporando silicio en atmósfera de helio"
    ],
    correcta: 1,
    explicacion: "A diferencia de las heteroestructuras semiconductoras tradicionales donde el desajuste de red atómica genera dislocaciones destructivas, en las heteroestructuras 2D las capas interactúan solo por fuerzas de Van der Waals débiles, permitiendo combinar materiales con propiedades totalmente disímiles como bloques de Lego atómicos."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Grafeno de Ángulo Mágico",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "En 2018, el grupo de Pablo Jarillo-Herrero en el MIT descubrió que al apilar dos monocapas de grafeno rotadas entre sí a un 'ángulo mágico' de aproximadamente θ ≈ 1.1°:",
    opciones: [
      "A. Las dos capas se desintegran en vapor de metano",
      "B. Se genera un superpatrón de Moiré que aplana las bandas electrónicas (flat bands), dando lugar a fases fuertemente correlacionadas como aislantes de Mott y superconductividad no convencional",
      "C. El material se vuelve transparente a los rayos X",
      "D. El grafeno se transforma en diamante sintético puro"
    ],
    correcta: 1,
    explicacion: "A θ ≈ 1.1°, la interacción interfacial entre capas frena la velocidad de Fermi a cero creando bandas planas ultra-estrechas. En estas bandas la energía de repulsión culombiana entre electrones domina sobre la energía cinética, naciendo el campo de la 'twistrónica' y superconductividad no convencional."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Efecto Hall Cuántico Entero",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "Klaus von Klitzing descubrió en 1980 (Premio Nobel 1985) que en un gas bidimensional de electrones a temperaturas criogénicas y campos magnéticos intensos, la conductancia Hall transversal G_xy se cuantiza en escalones rigurosos iguales a:",
    opciones: [
      "A. G_xy = ν · (e² / h) (donde ν = 1, 2, 3... es un número entero)",
      "B. G_xy = e · c / ħ",
      "C. G_xy = 1/2 k_B T",
      "D. G_xy = h / e²"
    ],
    correcta: 0,
    explicacion: "La constante de von Klitzing R_K = h/e² ≈ 25,812.807 Ω es un invariante topológico universal independiente del material o de sus imperfecciones. Esta precisión cuántica es tan perfecta que desde 2019 se utiliza como el patrón internacional primario de resistencia eléctrica en metrología."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Aislantes Topológicos",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Qué propiedad singular define a los 'Aislantes Topológicos' en la física del estado sólido?",
    opciones: [
      "A. Conducen corriente eléctrica exclusivamente cuando se calientan al rojo vivo",
      "B. Poseen un volumen interior aislante con brecha energética, pero alojan en su superficie estados electrónicos conductores protegidos por simetría de inversión temporal donde el espín del electrón está rígidamente bloqueado con su momento lineal",
      "C. Tienen carga magnética en sus bordes",
      "D. Son superconductores solo en el vacío"
    ],
    correcta: 1,
    explicacion: "En un aislante topológico, el fuerte acoplamiento espín-órbita invierte el orden de las bandas en el interior. Para conectar con el vacío exterior, la brecha debe cerrarse forzosamente en la superficie, originando estados superficiales metálicos inmunes a la retrodispersión por impurezas no magnéticas."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Masa Efectiva",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En la teoría cuántica de bandas, la masa efectiva m* de un electrón en un cristal refleja cómo la red atómica periódica modifica su aceleración ante una fuerza externa, calculándose como:",
    opciones: [
      "A. m* = ħ² / (d²E / dk²)",
      "B. m* = dE / dk",
      "C. m* = m_e · k²",
      "D. m* = ħ · k / v"
    ],
    correcta: 0,
    explicacion: "La masa efectiva es inversamente proporcional a la curvatura de la banda de energía E(k): m* = ħ² / (d²E/dk²). Cerca del tope de una banda donde la curvatura es cóncava hacia abajo (d²E/dk² < 0), la masa efectiva resulta negativa, comportamiento que se describe físicamente como un hueco con carga positiva."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Semiconductores de Brecha Directa e Indirecta",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Por qué el Arseniuro de Galio (GaAs) es un material idóneo para fabricar diodos láser y LEDs eficientes mientras que el Silicio puro no lo es?",
    opciones: [
      "A. Porque el silicio es un líquido a temperatura ambiente",
      "B. Porque el GaAs es un semiconductor de brecha directa (el mínimo de conducción y el máximo de valencia ocurren al mismo momento k), mientras que el silicio es de brecha indirecta y requiere la asistencia de un fonón para conservar momento, haciendo la emisión óptica muy ineficiente",
      "C. Porque el GaAs no tiene átomos",
      "D. Porque el silicio absorbe todos los fotones que genera"
    ],
    correcta: 1,
    explicacion: "En un semiconductor de brecha directa (como GaAs o InP), los electrones decaen directamente emitiendo un fotón sin necesidad de cambiar su momento k. En el silicio (brecha indirecta), la transición radiativa requiere absorber o emitir un fonón de la red, un proceso de segundo orden de bajísima probabilidad."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Transistores MOSFET",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál es el principio operativo central de un transistor MOSFET de silicio, componente básico de todos los microprocesadores modernos?",
    opciones: [
      "A. Controlar la conductividad de un canal semiconductor mediante el campo eléctrico electrostático aplicado a través de un electrodo de compuerta (gate) aislado por un dieléctrico",
      "B. Calentar filamentos con corriente continua para emitir electrones al vacío",
      "C. Utilizar radioactividad natural para conmutar corriente",
      "D. Cambiar la orientación del polo magnético terrestre"
    ],
    correcta: 0,
    explicacion: "El transistor de efecto de campo metal-óxido-semiconductor (MOSFET) actúa como un interruptor controlado por voltaje: al aplicar tensión en la compuerta, el campo eléctrico induce una capa de inversión de portadores que abre el canal de conducción entre drenador y fuente sin consumir corriente de compuerta."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Cuantización del Flujo Magnético",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El flujo magnético Φ que atraviesa el orificio de un anillo superconductor cerrado no puede adoptar valores arbitrarios continuos, sino que está estrictamente cuantizado en múltiplos enteros de:",
    opciones: [
      "A. Φ₀ = h / e",
      "B. Φ₀ = h / (2 e) ≈ 2.0678 × 10⁻¹⁵ Weber (cuanto de flujo magnético)",
      "C. Φ₀ = 2 h / e²",
      "D. Φ₀ = ħ · c"
    ],
    correcta: 1,
    explicacion: "Como los portadores de la supercorriente son pares de Cooper con carga 2e, la condición de univaluación de la función de onda macroscópica a lo largo de un circuito cerrado exige que el flujo encerrado sea múltiplo de Φ₀ = h/(2e). Este fenómeno es la base de los magnetómetros ultrasensibles SQUID."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Defectos Cristalinos Puntuales",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En la ciencia de materiales cristalinos, ¿qué diferencia a un defecto de Schottky de un defecto de Frenkel?",
    opciones: [
      "A. El defecto de Schottky ocurre solo en metales líquidos",
      "B. El defecto de Schottky consiste en un par estequiométrico de vacancias (un catión y un anión ausentes de la red), mientras que el defecto de Frenkel ocurre cuando un ion abandona su posición normal y ocupa un sitio intersticial cercano dejando una vacancia",
      "C. Ambos son dislocaciones lineales de borde",
      "D. El defecto de Frenkel genera radioactividad"
    ],
    correcta: 1,
    explicacion: "Ambos son defectos puntuales intrínsecos que mantienen la neutralidad eléctrica del cristal. En Schottky, los iones faltantes migraron a la superficie (reduciendo la densidad global del cristal); en Frenkel, el ion se aloja en un intersticio sin cambiar la densidad volumétrica neta."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Ferroelectricidad",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué propiedad singular exhibe un material ferroeléctrico como el titanato de bario (BaTiO₃)?",
    opciones: [
      "A. Conduce electricidad a través de vórtices magnéticos",
      "B. Presenta una polarización eléctrica espontánea reversible en ausencia de campo eléctrico externo, la cual puede reorientarse mediante la aplicación de un campo eléctrico exterior (ciclo de histéresis dieléctrica)",
      "C. Repele a todos los imanes de neodimio",
      "D. Se licúa espontáneamente a temperatura ambiente"
    ],
    correcta: 1,
    explicacion: "Análogo al ferromagnetismo pero con dipolos eléctricos, los ferroeléctricos presentan dominios con polarización eléctrica neta debida al desplazamiento asimétrico de los iones en la celda unitaria por debajo de la temperatura de Curie ferroeléctrica."
  },
  {
    area: "Ciencia de Materiales y Estado Sólido",
    subtema: "Brecha de Banda de hBN y Grafeno",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Cuál es el valor aproximado del bandgap (brecha prohibida) en el grafeno monocapa pristino y en el nitruro de boro hexagonal (hBN) respectivamente?",
    opciones: [
      "A. Grafeno: Eg = 1.1 eV; hBN: Eg = 0 eV",
      "B. Grafeno: Eg = 0 eV (semimetal de brecha nula); hBN: Eg ≈ 5.9 - 6.0 eV (aislante de banda ancha)",
      "C. Ambos tienen exactamente Eg = 3.4 eV",
      "D. Grafeno: Eg = 10 eV; hBN: Eg = 1 eV"
    ],
    correcta: 1,
    explicacion: "El grafeno es un semimetal con brecha cero donde los conos de valencia y conducción se tocan en el nivel de Fermi. Por el contrario, el hBN tiene una de las mayores brechas entre los materiales 2D (~6 eV), haciéndolo ópticamente transparente en todo el visible y aislante dieléctrico ideal."
  },

  // --- FÍSICA NUCLEAR Y PARTÍCULAS ELEMENTALES (28 preguntas) ---
  {
    area: "Física Nuclear y Partículas",
    subtema: "Defecto de Masa y Energía de Enlace",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "La masa medida de cualquier núcleo atómico estable es siempre estrictamente menor que la suma de las masas individuales de sus protones y neutrones constituyentes aislados. ¿Cómo se denomina y qué representa esta diferencia de masa Δm?",
    opciones: [
      "A. Masa fantasma por fricción térmica",
      "B. Defecto de Masa (Δm), y multiplicado por c² equivale a la Energía de Enlace nuclear (B = Δm c²) que mantiene cohesionado al núcleo",
      "C. Masa de los neutrinos atrapados",
      "D. Error experimental en los espectrómetros de masas"
    ],
    correcta: 1,
    explicacion: "Al formarse el núcleo a partir de nucleones libres, la interacción nuclear fuerte libera energía potencial en forma de radiación gamma. Por E=mc², esa energía liberada se traduce en una pérdida de masa medible: M_núcleo = Z m_p + N m_n - B/c²."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Curva de Energía de Enlace por Nucleón",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En la curva de energía de enlace nuclear por nucleón (B/A), ¿alrededor de qué elemento químico se alcanza la máxima estabilidad nuclear del universo (~8.8 MeV por nucleón)?",
    opciones: [
      "A. En el Hidrógeno-1",
      "B. En el Hierro-56 y Níquel-62",
      "C. En el Uranio-238",
      "D. En el Plomo-208"
    ],
    correcta: 1,
    explicacion: "El máximo de estabilidad en torno a Fe-56 y Ni-62 explica por qué fusionar núcleos ligeros (hacia la derecha en la curva) libera energía (fusión estelar), y fisionar núcleos muy pesados como U-235 (hacia la izquierda en la curva) también libera energía."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Fuerza Nuclear Fuerte",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Por qué los protones cargados positivamente dentro de un diminuto núcleo atómico permanecen estrechamente unidos en lugar de salir despedidos por la violenta repulsión electrostática de Coulomb?",
    opciones: [
      "A. Por la atracción gravitatoria de los neutrones",
      "B. Porque a distancias subatómicas menores a ~1 a 2 femtómetros (10⁻¹⁵ m), la Interacción Nuclear Fuerte es atractiva y unas 100 veces más intensa que la repulsión de Coulomb",
      "C. Porque los protones pierden su carga eléctrica dentro del núcleo",
      "D. Por el efecto magnético de los electrones orbitales"
    ],
    correcta: 1,
    explicacion: "La fuerza nuclear residual (mediada por intercambio de mesones pi entre nucleones) es la fuerza más poderosa de la naturaleza a distancias nucleares (~1 fm), superando con holgura la repulsión culombiana. A distancias mayores de 2-3 fm decae a cero exponencialmente."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Desintegración Alfa",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Una partícula Alfa (α) emitida en desintegraciones nucleares radiactivas está compuesta físicamente por:",
    opciones: [
      "A. Un electrón relativista de alta energía",
      "B. Un núcleo completamente ionizado de Helio-4 (dos protones y dos neutrones: ⁴He²⁺)",
      "C. Un fotón electromagnético de alta frecuencia",
      "D. Un neutrón libre en reposo"
    ],
    correcta: 1,
    explicacion: "Las partículas alfa son núcleos desnudos de helio (⁴He²⁺) extraordinariamente estables. Tienen una masa elevada y doble carga positiva (+2e), lo que les otorga una alta capacidad de ionización pero muy bajo poder de penetración (una hoja de papel o la piel las detiene)."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Desintegración Beta Menos",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En la desintegración radiactiva Beta menos (β⁻), un neutrón en el interior de un núcleo inestable se transforma en:",
    opciones: [
      "A. Dos partículas alfa y un positrón",
      "B. Un protón, un electrón de alta energía (partícula β⁻) y un antineutrino electrónico: n → p + e⁻ + ν̄_e",
      "C. Un fotón gamma únicamente",
      "D. Un mesón pi neutro"
    ],
    correcta: 1,
    explicacion: "A nivel fundamental de quarks, un quark 'down' se convierte en un quark 'up' mediante la fuerza débil mediada por un bosón W⁻ virtual (d → u + W⁻ → u + e⁻ + ν̄_e). El número atómico del núcleo aumenta en 1 (Z → Z + 1) conservando el número másico A."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Desintegración Beta Más y PET",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En la tomografía médica PET (Tomografía por Emisión de Positrones), se inyecta un radioisótopo emisor de radiación Beta más (β⁺). Al emitirse un positrón en el tejido biológico:",
    opciones: [
      "A. Se destruye todo el tejido circundante",
      "B. El positrón colisiona casi de inmediato con un electrón del tejido y ambos se aniquilan mutuamente, emitiendo dos fotones gamma colineales de 511 keV en direcciones exactamente opuestas (180°)",
      "C. El positrón se transforma en un protón",
      "D. Se genera una corriente superconductora"
    ],
    correcta: 1,
    explicacion: "La aniquilación e⁺ + e⁻ → 2γ convierte la masa en reposo de ambas partículas (2 × 511 keV) en dos fotones gamma emitidos a 180°. Detectores en anillo cronometran la llegada simultánea de ambos fotones (coincidencia temporal), reconstruyendo la imagen metabólica tridimensional."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Ley de Decaimiento Radiactivo",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Si una muestra radiactiva contiene inicialmente N₀ núcleos radiactivos y su periodo de semidesintegración (vida media) es T_1/2 = 10 horas, ¿qué fracción de los núcleos originales permanece sin desintegrarse al cabo de 30 horas?",
    opciones: [
      "A. La mitad (1/2)",
      "B. La cuarta parte (1/4)",
      "C. La octava parte (1/8 = 12.5%)",
      "D. Cero (se desintegraron todos)"
    ],
    correcta: 2,
    explicacion: "Han transcurrido n = 30 h / 10 h = 3 vidas medias. La cantidad remanente es N(t) = N₀ (1/2)ⁿ = N₀ (1/2)³ = N₀ / 8 = 12.5% de la muestra inicial."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Fisión Nuclear Inducida",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En una central nuclear de fisión, cuando un núcleo de Uranio-235 absorbe un neutrón térmico lento, se vuelve inestable y se divide en dos fragmentos medianos más ligeros, liberando además:",
    opciones: [
      "A. Únicamente calor sin partículas",
      "B. Entre 2 y 3 neutrones rápidos libres y aproximadamente 200 MeV de energía nuclear",
      "C. Un núcleo de hidrógeno y un positrón",
      "D. Cero neutrones"
    ],
    correcta: 1,
    explicacion: "La liberación de 2 a 3 neutrones adicionales es la clave que hace posible la reacción nuclear en cadena: esos neutrones pueden inducir la fisión de otros núcleos vecinos si son ralentizados adecuadamente por un moderador."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Moderadores en Reactores Nucleares",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Por qué los reactores nucleares térmicos utilizan un 'moderador' (como agua ordinaria H₂O, agua pesada D₂O o grafito puro)?",
    opciones: [
      "A. Para absorber todos los neutrones y apagar el reactor",
      "B. Para ralentizar la tremenda velocidad de los neutrones rápidos recién nacidos mediante colisiones elásticas hasta energías térmicas (~0.025 eV), donde la sección eficaz de fisión del U-235 es cientos de veces mayor",
      "C. Para enfriar la carcasa de hormigón exterior",
      "D. Para generar campos magnéticos de confinamiento"
    ],
    correcta: 1,
    explicacion: "Los neutrones nacen con energías cinéticas del orden de 2 MeV. Para esas energías la probabilidad de causar fisión en U-235 es baja. Al chocar elásticamente con núcleos livianos del moderador (de masa similar al neutrón como el hidrógeno o deuterio), ceden energía hasta alcanzar el equilibrio térmico."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Fusión Nuclear Solar",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La principal fuente de energía radiante generada en el corazón del Sol durante su fase de secuencia principal es la cadena de fusión protón-protón, cuyo balance neto global consiste en transformar:",
    opciones: [
      "A. Cuatro núcleos de Uranio en Plomo",
      "B. Cuatro protones (hidrógeno-1) en un núcleo de Helio-4, dos positrones, dos neutrinos electrónicos y unos 26.7 MeV de energía neta",
      "C. Helio en Carbono únicamente",
      "D. Oxígeno en Hierro"
    ],
    correcta: 1,
    explicacion: "La reacción neta es 4 ¹H → ⁴He + 2 e⁺ + 2 ν_e + 26.7 MeV. El Sol convierte aproximadamente 600 millones de toneladas de hidrógeno en helio cada segundo, perdiendo unas 4 millones de toneladas de masa por segundo que se transforman íntegramente en luz y calor."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Quarks y Carga Eléctrica Fraccionaria",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En el Modelo Estándar de la física de partículas, los quarks son los constituyentes fundamentales de los hadrones y poseen cargas eléctricas fraccionarias. ¿Cuáles son las cargas de los quarks 'up' (u) y 'down' (d)?",
    opciones: [
      "A. u = +1 e; d = -1 e",
      "B. u = +2/3 e; d = -1/3 e",
      "C. u = +1/2 e; d = -1/2 e",
      "D. u = +1/3 e; d = -2/3 e"
    ],
    correcta: 1,
    explicacion: "Los quarks tipo up (u, c, t) tienen carga eléctrica fraccionaria +2/3 e, mientras que los tipo down (d, s, b) tienen -1/3 e. Un protón (uud) tiene carga 2/3 + 2/3 - 1/3 = +1 e, y un neutrón (udd) tiene 2/3 - 1/3 - 1/3 = 0."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Confinamiento del Color y Gluones",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Por qué nunca se ha observado un quark aislado libre en ningún experimento de física de altas energías (Principio de Confinamiento del Color)?",
    opciones: [
      "A. Porque los quarks se desintegran antes de formarse",
      "B. Porque en la Cromodinámica Cuántica (QCD) la fuerza fuerte entre quarks mediada por gluones con carga de color no decae con la distancia; al intentar separarlos, la energía del tubo de flujo crece linealmente hasta que resulta energéticamente más favorable crear un nuevo par quark-antiquark del vacío",
      "C. Porque los quarks son transparentes a los campos electromagnéticos",
      "D. Porque los quarks tienen masa infinita"
    ],
    correcta: 1,
    explicacion: "A diferencia del electromagnetismo donde F ∝ 1/r², la fuerza fuerte entre cargas de color (rojo, verde, azul) actúa como un elástico inextensible (V ∝ r). Al estirarlo, la energía almacenada supera 2mc², materializando nuevos mesones (hadronización)."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Bariones y Mesones",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál es la diferencia estructural básica entre un Barión y un Mesón dentro de la familia de los hadrones?",
    opciones: [
      "A. Los bariones son leptones y los mesones son fotones",
      "B. Los bariones están formados por tres quarks de valencia (como el protón uud o el neutrón udd), mientras que los mesones están formados por un par quark-antiquark (como los piones o kaones)",
      "C. Los mesones tienen carga cero y los bariones carga infinita",
      "D. Los bariones solo existen en el vacío cósmico"
    ],
    correcta: 1,
    explicacion: "Los bariones son fermiones de espín semientero (3 quarks: qqq), con número bariónico B=1. Los mesones son bosones de espín entero compuestos por un quark y un antiquark (q q̄), con número bariónico B=0."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Leptones en el Modelo Estándar",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La familia de los Leptones (partículas fundamentales que no experimentan la interacción nuclear fuerte) está constituida por seis miembros agrupados en tres generaciones:",
    opciones: [
      "A. Protón, Neutrón, Electrón, Positrón, Muón y Pión",
      "B. Electrón, Muón, Tauón y sus tres respectivos neutrinos: neutrino electrónico (ν_e), neutrino muónico (ν_μ) y neutrino tauónico (ν_τ)",
      "C. Quarks up, down, charm, strange, top y bottom",
      "D. Fotón, Gluón, Gravitón, Bosón W, Bosón Z y Bosón de Higgs"
    ],
    correcta: 1,
    explicacion: "Los leptones son fermiones fundamentales (espín 1/2) sin carga de color. Cada generación consta de un leptón cargado negativamente (e⁻, μ⁻, τ⁻) y su correspondiente neutrino neutro casi sin masa (ν_e, ν_μ, ν_τ)."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Bosones Mediadores de Gauge",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Cuáles son las partículas mediadoras (bosones de gauge con espín 1) que transmiten la fuerza Electromagnética, la fuerza Fuerte y la fuerza Débil respectivamente en el Modelo Estándar?",
    opciones: [
      "A. Fotón, Gluones (8 tipos), y los Bosones vectoriales W⁺, W⁻ y Z⁰",
      "B. Electrón, Gravitón y Mesón",
      "C. Neutrino, Protón y Neutrón",
      "D. Fotón, Higgs y Gravitón"
    ],
    correcta: 0,
    explicacion: "El fotón sin masa media el electromagnetismo U(1); 8 gluones con carga de color median la interacción fuerte SU(3); y los bosones masivos W⁺, W⁻ (80.4 GeV) y Z⁰ (91.2 GeV) median la interacción débil SU(2)."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Bosón de Higgs",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "El descubrimiento del Bosón de Higgs en julio de 2012 en el Gran Colisionador de Hadrones (LHC) del CERN confirmó experimentalmente la existencia de:",
    opciones: [
      "A. La energía oscura en el vacío",
      "B. El Campo de Higgs: un campo escalar cósmico que permea todo el universo cuyo valor esperado en el vacío no nulo rompe espontáneamente la simetría electrodébil y dota de masa inercial a las partículas fundamentales mediante acoplamiento de Yukawa",
      "C. La gravedad cuántica de cuerdas",
      "D. Un quinto estado de agregación de la materia sólida"
    ],
    correcta: 1,
    explicacion: "El bosón de Higgs es la excitación cuántica del campo de Higgs (con masa de ~125 GeV y espín 0). Sin este mecanismo de ruptura espontánea de simetría (Brout-Englert-Higgs), los bosones W y Z no tendrían masa y los electrones viajarían a la velocidad de la luz c sin formar átomos."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Oscilaciones de Neutrinos",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El descubrimiento de las 'Oscilaciones de Neutrinos' en los detectores Super-Kamiokande y SNO (Premio Nobel 2015), donde un neutrino de un sabor determinado se metamorfosea espontáneamente en otro sabor durante su viaje, demostró indiscutiblemente que:",
    opciones: [
      "A. Los neutrinos tienen carga eléctrica fraccionaria",
      "B. Los neutrinos tienen masas en reposo estrictamente distintas de cero, contradiciendo el Modelo Estándar original que los asumía de masa exactamente nula",
      "C. Los neutrinos viajan más rápido que la luz",
      "D. El Sol no produce energía nuclear"
    ],
    correcta: 1,
    explicacion: "Para que ocurran oscilaciones cuánticas de sabor (como ν_e → ν_μ), los estados propios de sabor deben ser combinaciones lineales de estados propios de masa con masas ligeramente distintas (Δm² ≠ 0). Esto resolvió el enigma histórico del déficit de neutrinos solares."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Violación de la Paridad (Experimento de Wu)",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "En 1956, la física Chien-Shiung Wu demostró mediante la desintegración beta de núcleos polarizados de Cobalto-60 a temperaturas criogénicas que:",
    opciones: [
      "A. La energía no se conserva en reacciones nucleares",
      "B. La Interacción Débil viola al 100% la simetría de paridad espacial (P), emitiéndose los electrones preferencialmente en sentido opuesto al espín nuclear, lo que demuestra que la naturaleza distingue intrínsecamente entre la izquierda y la derecha",
      "C. El cobalto es un gas noble",
      "D. La carga eléctrica se destruye"
    ],
    correcta: 1,
    explicacion: "Propuesto teóricamente por Lee y Yang (Premio Nobel 1957), el experimento de Wu tumbó el dogma clásico de que las leyes de la física eran idénticas en un espejo. La fuerza débil acopla únicamente a fermiones con quiralidad levógira (mano izquierda)."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Datación por Carbono-14",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál es el principio biofísico de la datación arqueológica mediante el isótopo radiactivo Carbono-14 (vida media de 5,730 años)?",
    opciones: [
      "A. El C-14 se produce en las rocas ígneas por el calor subterráneo",
      "B. Los seres vivos asimilan C-14 de la atmósfera en proporción constante durante su ciclo vital mediante fotosíntesis o alimentación; al morir cesa la ingesta y la concentración de C-14 decae exponencialmente según la ley radiactiva",
      "C. El C-14 no decae nunca y sirve de referencia fija",
      "D. La radiación ultravioleta destruye los huesos fósiles"
    ],
    correcta: 1,
    explicacion: "Willard Libby ideó el método en 1949: el C-14 se genera en la alta atmósfera por rayos cósmicos (¹⁴N + n → ¹⁴C + p). Al morir el organismo, el reloj radiactivo inicia su cuenta regresiva. Midiendo la actividad residual de C-14 respecto a C-12 se determina la fecha de muerte hasta ~50,000 años."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Sección Eficaz Nuclear",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En física nuclear y de colisiones, la 'Sección Eficaz' (representada por σ y medida en barns, 1 barn = 10⁻²⁸ m²) cuantifica:",
    opciones: [
      "A. El diámetro geométrico macroscópico del reactor",
      "B. La probabilidad de que ocurra una reacción nuclear específica o proceso de dispersión entre un proyectil incidente y un núcleo blanco",
      "C. La temperatura a la que se funde el combustible nuclear",
      "D. La masa inercial de los neutrones térmicos"
    ],
    correcta: 1,
    explicacion: "La sección eficaz representa el área efectiva aparente que el núcleo presenta al proyectil para una interacción determinada. Puede ser mucho mayor o menor que el área geométrica real del núcleo debido a efectos cuánticos de resonancia ondulatoria."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Antimateria y Positrón",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Paul Dirac predijo teóricamente la existencia de la antimateria en 1928 al buscar una versión relativista de la mecánica cuántica. El positrón (antipartícula del electrón), descubierto por Carl Anderson en 1932 en rayos cósmicos, tiene:",
    opciones: [
      "A. La misma masa y espín que el electrón, pero carga eléctrica exactamente opuesta (+1 e)",
      "B. La masa del protón y carga negativa",
      "C. Masa nula y espín cero",
      "D. Carga neutra y velocidad infinita"
    ],
    correcta: 0,
    explicacion: "Toda partícula elemental posee su correspondiente antipartícula con idéntica masa, vida media y espín, pero con números cuánticos aditivos opuestos (carga eléctrica, número leptónico/bariónico). Al colisionar partícula y antipartícula se produce aniquilación total en radiación pura."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Barras de Control en Reactores",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál es el material comúnmente empleado en las barras de control de un reactor nuclear debido a su extraordinaria capacidad de absorber neutrones sin sufrir fisión?",
    opciones: [
      "A. Cobre o Aluminio puro",
      "B. Boro o Cadmio",
      "C. Plástico o Vidrio común",
      "D. Helio líquido"
    ],
    correcta: 1,
    explicacion: "El Cadmio-113 y el Boro-10 poseen colosales secciones eficaces de captura neutrónica térmica (miles de barns). Insertar las barras de control en el núcleo del reactor absorbe neutrones libres reduciendo el factor de multiplicación k por debajo de 1 para controlar o apagar la reacción en cadena."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Vida Media del Neutrón Libre",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "A diferencia de un neutrón confinado dentro de un núcleo atómico estable, un neutrón libre aislado fuera del núcleo es inestable y decae radiactivamente con una vida media media de aproximadamente:",
    opciones: [
      "A. 1 milisegundo",
      "B. Unos 14.7 minutos (~880 segundos) por desintegración beta",
      "C. 5,730 años",
      "D. Es rigurosamente eterno"
    ],
    correcta: 1,
    explicacion: "Dado que la masa del neutrón libre (939.565 MeV) supera a la suma de las masas del protón (938.272 MeV) y del electrón (0.511 MeV), el decaimiento n → p + e⁻ + ν̄_e es energéticamente espontáneo, liberando 0.78 MeV con una vida media de unos 14.7 minutos."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Interacción Débil y Bosones Z",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El descubrimiento de las 'Corrientes Neutras Débiles' en la cámara de burbujas Gargamelle del CERN en 1973 confirmó la teoría electrodébil de Glashow, Salam y Weinberg al demostrar interacciones mediadas por:",
    opciones: [
      "A. El bosón vectorial neutro Z⁰",
      "B. Fotones magnéticos de Dirac",
      "C. Monopolos de 't Hooft-Polyakov",
      "D. Axiones cósmicos"
    ],
    correcta: 0,
    explicacion: "Las corrientes débiles cargadas están mediadas por W⁺ y W⁻ y cambian el sabor de los fermiones. La corriente neutra débil mediada por el bosón Z⁰ permite que los neutrinos colisionen elásticamente contra electrones o quarks sin cambiar su carga, hito clave en la unificación electrodébil."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Masa del Quark Top",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El quark 'top' (t), descubierto en el acelerador Tevatron del Fermilab en 1995, es la partícula elemental más pesada conocida del Modelo Estándar, con una masa equivalente a:",
    opciones: [
      "A. La masa de un átomo de helio",
      "B. Unos 173 GeV/c² (aproximadamente la masa de un átomo completo de oro o tungsteno)",
      "C. 1 MeV/c²",
      "D. Diez veces la masa del Sol"
    ],
    correcta: 1,
    explicacion: "Con ~173 GeV, el quark top es unas 70,000 veces más masivo que el quark up. Su vida media es tan astronómicamente efímera (~5 × 10⁻²⁵ segundos) que decae antes de que la fuerza fuerte tenga tiempo de formar hadrones con él (no forma mesones ni bariones)."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Isótopos de Hidrógeno",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "¿Cuáles son los tres isótopos del elemento Hidrógeno y cuántos neutrones contiene cada uno de sus núcleos?",
    opciones: [
      "A. Protio (0 neutrones), Deuterio (1 neutrón) y Tritio (2 neutrones)",
      "B. Hidrógeno alfa, beta y gamma (con 1, 2 y 3 protones respectivamente)",
      "C. Helio ligero, medio y pesado",
      "D. Todos los isótopos del hidrógeno tienen 2 neutrones obligatoriamente"
    ],
    correcta: 0,
    explicacion: "El Protio (¹H) tiene 1 protón y 0 neutrones (~99.98% de abundancia); el Deuterio (²H o D) tiene 1 protón y 1 neutrón (forma agua pesada D₂O); y el Tritio (³H o T) es un isótopo radiactivo inestable con 1 protón y 2 neutrones."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Fusión Inercial y Magnética",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En los reactores experimentales de fusión nuclear como ITER (Tokamak), la reacción más accesible a menor temperatura de ignición (~150 millones de Kelvin) es la fusión entre:",
    opciones: [
      "A. Carbono y Oxígeno",
      "B. Deuterio y Tritio: ²H + ³H → ⁴He (3.5 MeV) + n (14.1 MeV)",
      "C. Protón y Neutrón libre",
      "D. Uranio y Plutonio"
    ],
    correcta: 1,
    explicacion: "La reacción D-T tiene la sección eficaz de fusión más alta a temperaturas energéticamente alcanzables en laboratorio. Libera una partícula alfa (helio-4) que retiene el plasma confinado por potentes campos magnéticos y un neutrón de alta energía que calienta el manto reproductor."
  },
  {
    area: "Física Nuclear y Partículas",
    subtema: "Simetría CPT",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El Teorema CPT de la teoría cuántica de campos relativista demuestra que cualquier teoría física local invariante de Lorentz debe ser rigurosamente exacta e invariante ante la aplicación simultánea de:",
    opciones: [
      "A. Campo, Potencial y Temperatura",
      "B. Conjugación de Carga (C), Inversión de Paridad espacial (P) y Reversión Temporal (T)",
      "C. Calor, Presión y Tensión",
      "D. Continuidad, Proyección y Traslación"
    ],
    correcta: 1,
    explicacion: "Aunque C, P y CP pueden violarse individualmente en la naturaleza (como en la interacción débil de los kaones y mesones B), el producto combinado CPT permanece estrictamente exacto. Garantiza que toda partícula y su antipartícula tengan masas y vidas medias rigurosamente idénticas."
  },

  // --- ASTROFÍSICA, COSMOLOGÍA Y EXPERIMENTOS CRUCIALES (20 preguntas) ---
  {
    area: "Rotación y Gravitación",
    subtema: "Límite de Chandrasekhar",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "El célebre astrofísico Subrahmanyan Chandrasekhar calculó en 1930 que la masa máxima que puede soportar una estrella enana blanca contra el colapso gravitatorio mediante la presión de degeneración de electrones relativistas es de aproximadamente:",
    opciones: [
      "A. 0.5 Masas Solares",
      "B. 1.44 Masas Solares (Límite de Chandrasekhar)",
      "C. 5.0 Masas Solares",
      "D. 100 Masas Solares"
    ],
    correcta: 1,
    explicacion: "Si la masa del núcleo remanente de una estrella excede 1.44 M_☉, los electrones degenerados alcanzan velocidades ultra-relativistas y no pueden generar la presión suficiente para equilibrar la gravedad, colapsando inevitablemente en una estrella de neutrones o un agujero negro."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Estrellas de Neutrones y Púlsares",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué es un Púlsar, descubierto en 1967 por Jocelyn Bell Burnell?",
    opciones: [
      "A. Un planeta gigante con tormentas eléctricas periódicas",
      "B. Una estrella de neutrones ultradensa y altamente magnetizada en rápida rotación que emite haces colimados de radiación electromagnética a lo largo de sus polos magnéticos, barriendo la Tierra periódicamente como un faro",
      "C. Una estrella que colapsa y explota cada 5 segundos",
      "D. Un satélite artificial de origen extraterrestre"
    ],
    correcta: 1,
    explicacion: "Una estrella de neutrones comprime la masa del Sol en una esfera de apenas 20 km de diámetro sostenida por degeneración neutrónica. Debido a la conservación del momento angular y del flujo magnético durante el colapso, rota a velocidades vertiginosas emitiendo pulsos extremadamente precisos."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Ley de Hubble-Lemaître",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La Ley de Hubble-Lemaître formulada empíricamente en 1929 establece que la velocidad de recesión aparente v con la que se alejan las galaxias lejanas respecto a nosotros es proporcional a:",
    opciones: [
      "A. El cuadrado de la masa de la galaxia",
      "B. Su distancia física d respecto a la Tierra: v = H₀ · d",
      "C. La temperatura de sus estrellas centrales",
      "D. El ángulo de inclinación de sus brazos espirales"
    ],
    correcta: 1,
    explicacion: "v = H₀ d demuestra que el universo no es estático sino que el tejido del espacio mismo se expande uniformemente en todas direcciones: cuanto más lejana está una galaxia, mayor cantidad de espacio se expande entre ella y nosotros, produciendo un corrimiento al rojo proporcional a la distancia."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Fondo Cósmico de Microondas (CMB)",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "La Radiación del Fondo Cósmico de Microondas (CMB), descubierta accidentalmente en 1964 por Arno Penzias y Robert Wilson (Premio Nobel 1978), corresponde físicamente a:",
    opciones: [
      "A. La radiación dispersada por satélites de telecomunicaciones",
      "B. El eco térmico fósil de radiación de cuerpo negro perfecto a T ≈ 2.725 Kelvin emitido en la época de recombinación (~380,000 años tras el Big Bang), cuando los electrones y protones formaron átomos neutros de hidrógeno y el universo se volvió transparente a la luz",
      "C. Emisiones de ondas de radio generadas por agujeros negros supermasivos",
      "D. La luz emitida por el núcleo de la Vía Láctea"
    ],
    correcta: 1,
    explicacion: "Es la evidencia más concluyente de la teoría del Big Bang. Inicialmente emitida como radiación ultravioleta/visible a ~3,000 K, la expansión cósmica durante 13,800 millones de años estiró su longitud de onda por un factor de z ≈ 1,100, desplazándola a microondas a solo 2.7 K sobre el cero absoluto."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Materia Oscura y Curvas de Rotación",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En la década de 1970, la astrónoma Vera Rubin midió las velocidades de rotación orbital de las estrellas y gas en los bordes exteriores de galaxias espirales, descubriendo con asombro que:",
    opciones: [
      "A. Las estrellas exteriores estaban completamente inmóviles",
      "B. Las curvas de rotación eran planas (v ≈ constante) en lugar de decaer como 1/√r según predecía la masa visible newtoniana, demostrando la presencia de un gigantesco halo invisible de Materia Oscura que rodea a las galaxias",
      "C. Todas las estrellas eran expulsadas al espacio intergaláctico",
      "D. La masa del gas era mil veces superior a la de las estrellas"
    ],
    correcta: 1,
    explicacion: "Por la mecánica de Kepler y Newton, lejos del centro brillante v debería caer como √(GM/r). Al permanecer la velocidad constante a distancias colosales, Rubin probó que el 85% de la masa galáctica total corresponde a materia oscura no luminosa que permea el halo galáctico."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Energía Oscura y Expansión Acelerada",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En 1998, dos equipos independientes de astrónomos midieron la luminosidad de Supernovas de Tipo Ia muy lejanas y descubrieron un hecho que conmocionó a la cosmología (Premio Nobel 2011):",
    opciones: [
      "A. El universo se estaba contrayendo rápidamente hacia un Big Crunch",
      "B. La velocidad de expansión del universo no se está frenando por la gravedad, sino que se está acelerando en el tiempo debido a la presencia de la denominada 'Energía Oscura' (~68% del cosmos)",
      "C. La velocidad de la luz en el universo temprano era cero",
      "D. Las supernovas no emiten energía"
    ],
    correcta: 1,
    explicacion: "Las supernovas lejanas aparecían sistemáticamente más tenues y lejanas de lo esperado para un universo desacelerado. La Energía Oscura actúa como una presión negativa repulsiva homogénea en el espacio-tiempo (asociada a la Constante Cosmológica Λ de Einstein)."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Composición del Universo (Modelo ΛCDM)",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "De acuerdo con las observaciones cosmológicas de ultra-alta precisión del satélite espacial Planck, ¿cuál es la composición energética actual aproximada del Universo observable?",
    opciones: [
      "A. 100% átomos de hidrógeno y helio visibles",
      "B. ~68% Energía Oscura, ~27% Materia Oscura fría, y apenas ~5% de Materia Ordinaria o Bariónica (estrellas, planetas, gas y seres humanos)",
      "C. 50% materia visible y 50% antimateria",
      "D. 90% agujeros negros y 10% radiación"
    ],
    correcta: 1,
    explicacion: "La materia ordinaria de la que estamos hechos (protones, neutrones, electrones) representa apenas una vigésima parte del contenido del cosmos (≈ 4.9%). El 95% restante es un sector oscuro compuesto por materia oscura (≈ 26.8%) y energía oscura (≈ 68.3%)."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Paradoja de Olbers",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La Paradoja de Heinrich Olbers plantea: 'Si el universo fuese estático, infinito en extensión y eterno en el tiempo, cada línea de visión terminaría tarde o temprano en la superficie brillante de una estrella, haciendo que el cielo nocturno ardiera tan brillante como el Sol'. ¿Por qué la noche es oscura?",
    opciones: [
      "A. Porque el polvo interestelar absorbe y destruye la luz para siempre",
      "B. Porque el universo tiene una edad finita (~13,800 millones de años, la luz de estrellas lejanas aún no ha tenido tiempo de llegar) y el universo se expande, corriendo la luz lejana al infrarrojo",
      "C. Porque las estrellas se apagan todas a medianoche",
      "D. Por el campo magnético de la Luna"
    ],
    correcta: 1,
    explicacion: "El enigma se resuelve porque el universo observable tiene un horizonte temporal finito de 13,800 millones de años (muchas estrellas aún no han nacido o su luz no ha alcanzado la Tierra) y la expansión cósmica atenúa y enrojece la radiación de fondo."
  },
  {
    area: "Física Fundamental",
    subtema: "Experimento de Rutherford",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En 1911, Ernest Rutherford bombardeó una delgada lámina de oro con partículas alfa observando que la inmensa mayoría atravesaba sin desviarse, pero unas pocas rebotaban hacia atrás con ángulos superiores a 90°. Rutherford concluyó que:",
    opciones: [
      "A. El modelo del pudín de pasas de Thomson era perfectamente exacto",
      "B. La mayor parte del átomo es espacio vacío y casi toda su masa y carga positiva se concentran en un núcleo central diminuto y extremadamente denso",
      "C. El oro es impermeable a la radiación",
      "D. Los electrones tienen mayor masa que las partículas alfa"
    ],
    correcta: 1,
    explicacion: "Rutherford comparó el asombro diciendo: 'Fue tan increíble como si dispararas un proyectil de 15 pulgadas contra un papel de seda y rebotara contra ti'. Demostró que el núcleo tiene un radio de ~10⁻¹⁵ m frente al radio atómico de ~10⁻¹⁰ m (el núcleo ocupa una diezmilésima del tamaño del átomo)."
  },
  {
    area: "Física Fundamental",
    subtema: "Experimento de la Gota de Aceite de Millikan",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Qué midió Robert Millikan en 1909 suspendiendo diminutas gotas de aceite cargadas entre las placas electrificadas de un condensador horizontal?",
    opciones: [
      "A. La velocidad de la luz en el aceite",
      "B. Demostró la cuantización exacta de la carga eléctrica y determinó con gran precisión la carga elemental fundamental del electrón (e ≈ 1.602 × 10⁻¹⁹ Coulomb)",
      "C. La viscosidad del aire únicamente",
      "D. La masa del neutrón"
    ],
    correcta: 1,
    explicacion: "Equilibrando el peso gravitatorio con la fuerza eléctrica de campo (qE = mg) y midiendo la velocidad terminal de caída libre mediante la Ley de Stokes, Millikan comprobó que la carga q en todas las gotas era siempre un múltiplo entero exacto de un cuanto indivisible: q = n e."
  },
  {
    area: "Física Fundamental",
    subtema: "Experimento de Cavendish",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "El célebre experimento de la balanza de torsión de Henry Cavendish (1798), conocido popularmente como 'pesar la Tierra', permitió medir por primera vez:",
    opciones: [
      "A. La presión barométrica en las montañas",
      "B. La débil atracción gravitatoria mutua entre masas esféricas de plomo en laboratorio, deduciendo el valor numérico de la Constante de Gravitación Universal G y la masa de la Tierra",
      "C. La velocidad de rotación de la galaxia",
      "D. La carga eléctrica de la atmósfera"
    ],
    correcta: 1,
    explicacion: "Midiendo la minúscula torsión de un hilo fino de cuarzo que sostenía dos esferas de plomo atraídas por esferas de plomo mayores, Cavendish midió la constante G ≈ 6.67 × 10⁻¹¹ N·m²/kg², calculando inmediatamente a partir de g = GM/R² la masa de la Tierra en unas 6 × 10²⁴ kg."
  },
  {
    area: "Física Fundamental",
    subtema: "Redefinición del SI (2019)",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En la histórica redefinición del Sistema Internacional de Unidades (SI) aprobada en Versalles en noviembre de 2018 y en vigor desde 2019, ¿cómo se define formalmente el kilogramo patrón?",
    opciones: [
      "A. Sigue basándose en el cilindro de platino-iridio guardado en una bóveda en París",
      "B. Se fija unívocamente fijando el valor numérico exacto de la Constante de Planck (h = 6.62607015 × 10⁻³⁴ J·s) mediante instrumentos electromagnéticos como la Balanza de Kibble",
      "C. Como la masa de un litro de agua pesada a 4 °C",
      "D. Como la masa de un trillón de átomos de carbono"
    ],
    correcta: 1,
    explicacion: "El SI eliminó el último artefacto material físico (el 'Gran Kilo' en París). Hoy todas las unidades base (metro, segundo, kilogramo, amperio, kelvin, mol y candela) se derivan de constantes universales de la naturaleza inmutables (c, h, e, k_B, N_A, Δν_Cs, K_cd)."
  },
  {
    area: "Física Fundamental",
    subtema: "Definición del Metro en el SI",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "Desde 1983, el metro patrón en el Sistema Internacional se define formalmente como:",
    opciones: [
      "A. La longitud de una barra metálica de platino e iridio conservada a 0 °C",
      "B. La distancia exacta que recorre la luz en el vacío en un intervalo temporal de 1 / 299,792,458 segundos",
      "C. La diezmillonésima parte de la distancia del ecuador al polo norte",
      "D. Un millón de longitudes de onda de un láser verde"
    ],
    correcta: 1,
    explicacion: "Al definirse la velocidad de la luz en el vacío como una constante exacta invariable por decreto metrológico (c = 299,792,458 m/s), la unidad de longitud metro quedó vinculada directamente a la medición ultra-precisa del tiempo mediante relojes atómicos de cesio."
  },
  {
    area: "Física Fundamental",
    subtema: "Teorema de Noether",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El Teorema de Emmy Noether (1918) es uno de los teoremas más bellos y profundos de toda la física teórica al demostrar que:",
    opciones: [
      "A. Toda partícula elemental debe tener carga fraccionaria",
      "B. A cada simetría geométrica continua de las leyes de la física (del lagrangiano) le corresponde inexorablemente una ley de conservación física: la simetría temporal implica conservación de energía, la traslacional conserva momento lineal y la rotacional conserva momento angular",
      "C. Las fuerzas de fricción no conservan la masa",
      "D. El universo se colapsará en un punto"
    ],
    correcta: 1,
    explicacion: "Noether demostró la raíz geométrica de las leyes de conservación: que las leyes de la física sean las mismas hoy que mañana (invariancia temporal) garantiza la conservación de la energía; que sean las mismas aquí que en Marte conserva el momento lineal."
  },
  {
    area: "Física Fundamental",
    subtema: "Experimento de Pound-Rebka",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Qué midieron con éxito Robert Pound y Glen Rebka en 1959 en una torre de la Universidad de Harvard de solo 22.5 metros de altura?",
    opciones: [
      "A. La aceleración centrífuga de la atmósfera",
      "B. El corrimiento al rojo gravitacional de fotones gamma del Hierro-57 ascendiendo en el campo gravitatorio terrestre aprovechando el efecto Mössbauer de absorción sin retroceso, confirmando la Relatividad General en escala terrestre",
      "C. La velocidad del sonido en el vacío",
      "D. La masa del neutrón"
    ],
    correcta: 1,
    explicacion: "Los fotones pierden energía al escalar un pozo gravitatorio (ΔE/E = gh/c² ≈ 2.5 × 10⁻¹⁵). Pound y Rebka utilizaron el Efecto Mössbauer para detectar esa diminuta variación fraccionaria de frecuencia con una precisión de 1 parte en 10¹⁵, validando el principio de equivalencia en laboratorio."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Lente Gravitacional y Materia Oscura en el Cúmulo de la Bala",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "La observación astrofísica del 'Cúmulo de la Bala' (Bullet Cluster 1E 0657-56) es considerada la prueba empírica más contundente de la existencia de la Materia Oscura porque:",
    opciones: [
      "A. Se apagaron todas las galaxias simultáneamente",
      "B. Tras la colisión entre dos cúmulos de galaxias, el gas intergaláctico ordinario visible por rayos X se frenó por fricción electromagnética en el centro, mientras que los mapas de masa deducidos por lente gravitacional mostraron que la mayor parte de la masa continuó su trayectoria sin interactuar",
      "C. Las estrellas chocaron frontalmente fusionándose",
      "D. Se detectó una nube de antimateria pura"
    ],
    correcta: 1,
    explicacion: "Muestra una separación espacial neta entre la materia ordinaria (gas caliente que interactuó y quedó rezagado en el centro) y la materia oscura (que pasó de largo sin colisionar excepto gravitatoriamente), descartando las teorías que intentaban modificar la gravedad (MOND) sin partículas oscuras."
  },
  {
    area: "Rotación y Gravitación",
    subtema: "Diagrama Hertzsprung-Russell",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En un diagrama de Hertzsprung-Russell (H-R), herramienta fundamental de la astrofísica estelar, las estrellas de la 'Secuencia Principal' (donde pasa el 90% de su vida el Sol) se caracterizan por:",
    opciones: [
      "A. Fusionar activamente hidrógeno en helio en su núcleo denso en equilibrio hidrostático perfecto entre la presión de radiación térmica y la auto-gravedad",
      "B. Estar colapsando en agujeros negros",
      "C. Ser estrellas frías de hierro puro",
      "D. No tener campo magnético"
    ],
    correcta: 0,
    explicacion: "La secuencia principal es la banda diagonal en el diagrama H-R (Luminosidad vs Temperatura efectiva). La estrella permanece en ella de forma extraordinariamente estable fusionando hidrógeno mientras su presión térmica hacia afuera equilibre el peso gravitatorio hacia adentro."
  },
  {
    area: "Física Fundamental",
    subtema: "Análisis Dimensional y Teorema Pi de Buckingham",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "El Teorema Pi de Buckingham en el análisis dimensional de la física y la ingeniería establece que si un fenómeno físico involucra n variables dimensionales independientes expresables en k dimensiones físicas fundamentales, el problema puede describirse completamente mediante:",
    opciones: [
      "A. n + k ecuaciones diferenciales",
      "B. n - k números o grupos adimensionales independientes Π",
      "C. Un único parámetro constante sin dimensiones",
      "D. n · k variables de estado"
    ],
    correcta: 1,
    explicacion: "Permite simplificar drásticamente sistemas complejos reduciendo el número de parámetros efectivos a n - k grupos adimensionales (como el Número de Reynolds, Número de Mach, Número de Froude), base de la teoría de modelos a escala en túneles de viento."
  },
  {
    area: "Física Fundamental",
    subtema: "Principio de Mínima Acción",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El Principio de Mínima Acción de Maupertuis y Hamilton formula que la trayectoria dinámica real que sigue una partícula o sistema entre dos estados configuracionales en el espacio-tiempo es aquella que:",
    opciones: [
      "A. Maximiza la fricción con el medio",
      "B. Hace estacionaria (mínima o punto de ensilladura) la integral temporal de la función Lagrangiana (S = ∫ L dt, donde L = T - V): δS = 0, de la cual emergen las ecuaciones de Euler-Lagrange",
      "C. Mantiene constante la aceleración",
      "D. Iguala la velocidad de la partícula a la de la luz"
    ],
    correcta: 1,
    explicacion: "Es el principio unificador más sublime de la física: la mecánica clásica newtoniana, el electromagnetismo de Maxwell, la relatividad general de Einstein y el formalismo de integrales de camino de Feynman en física cuántica se deducen a partir de la exigencia de que la acción S sea estacionaria: δS = 0."
  },
  {
    area: "Física Fundamental",
    subtema: "Difracción de Moléculas Gigantes (C60)",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "En 1999, el grupo de Anton Zeilinger en Viena demostró el patrón de interferencia ondulatoria de doble rendija utilizando macromoléculas de Buckyballs (Fulerenos C₆₀, compuestas por 60 átomos de carbono masivos). ¿Qué implicación tiene este experimento?",
    opciones: [
      "A. Que las moléculas grandes se descomponen en luz",
      "B. Que la dualidad onda-partícula cuántica de de Broglie es universal y sigue siendo rigurosamente válida incluso para moléculas orgánicas complejas y masivas, siempre que se mantenga el aislamiento cuántico y se evite la decoherencia con el entorno",
      "C. Que el carbono no tiene masa inercial",
      "D. Que los fulerenos son partículas sin masa"
    ],
    correcta: 1,
    explicacion: "Con una masa atómica de 720 Da y 60 núcleos, una molécula de C₆₀ es gigantesca en comparación con un electrón. El experimento probó que la frontera entre lo cuántico y lo clásico no es una cuestión de tamaño molecular intrínseco, sino de decoherencia cuántica por interacción con fotones o gas ambiental."
  }
];
