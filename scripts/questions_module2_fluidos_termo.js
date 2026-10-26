// Módulo 2: Mecánica de Fluidos, Termodinámica y Mecánica Estadística (50 preguntas)
module.exports = [
  // --- MECÁNICA DE FLUIDOS (25 preguntas) ---
  {
    area: "Mecánica de Fluidos",
    subtema: "Principio de Pascal",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "El Principio de Pascal establece que cualquier incremento de presión aplicado a la superficie de un fluido incompresible en reposo dentro de un recipiente cerrado se transmite:",
    opciones: [
      "A. Únicamente hacia el fondo del recipiente",
      "B. Con igual intensidad en todas las direcciones y a todos los puntos del fluido y de las paredes",
      "C. Disminuyendo exponencialmente con la distancia al punto de aplicación",
      "D. Solo a lo largo de las líneas verticales de gravedad"
    ],
    correcta: 1,
    explicacion: "El Principio de Pascal demuestra que en un fluido confinado e incompresible, la presión se propaga de manera isotrópica e íntegra, principio fundamental de los frenos y prensas hidráulicas (F₁/A₁ = F₂/A₂)."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Principio de Arquímedes",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Un bloque de hierro y un bloque de madera de exactamente el mismo volumen (1 litro) se sumergen completamente en agua. ¿Cuál experimenta mayor fuerza de empuje hidrostático?",
    opciones: [
      "A. El de hierro, porque tiene mucho mayor peso y densidad",
      "B. El de madera, porque tiende a flotar naturalmente",
      "C. Ambos experimentan exactamente la misma fuerza de empuje",
      "D. Ninguno experimenta empuje cuando están totalmente sumergidos"
    ],
    correcta: 2,
    explicacion: "Por el Principio de Arquímedes, el empuje depende exclusivamente del peso del fluido desalojado: E = ρ_fluido · g · V_sumergido. Al tener idéntico volumen sumergido y estar en el mismo fluido, el empuje es exactamente igual para ambos."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Ecuación de Continuidad",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Por una tubería horizontal fluye agua en régimen estacionario e incompresible. Si la sección transversal del tubo se reduce a la mitad (A₂ = A₁/2), ¿qué ocurre con la rapidez del fluido?",
    opciones: [
      "A. Se reduce a la mitad",
      "B. Se duplica (v₂ = 2 v₁)",
      "C. Se cuadruplica",
      "D. Permanece rigurosamente constante"
    ],
    correcta: 1,
    explicacion: "Por la ecuación de continuidad para fluidos incompresibles, el caudal volumétrico es constante: Q = A₁ v₁ = A₂ v₂. Si el área se reduce a la mitad, la velocidad debe duplicarse para conservar el flujo de masa."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Ecuación de Bernoulli",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "De acuerdo con el Principio de Bernoulli para un fluido ideal en flujo laminar horizontal, en aquellas zonas donde la velocidad de flujo aumenta:",
    opciones: [
      "A. La presión estática disminuye",
      "B. La presión estática aumenta en proporción cuadrática",
      "C. La temperatura se eleva hasta el punto de ebullición",
      "D. La densidad del fluido se reduce a cero"
    ],
    correcta: 0,
    explicacion: "La ecuación de Bernoulli P + 1/2 ρv² + ρgh = constante implica que a lo largo de una línea de corriente horizontal (h constante), un aumento en la energía cinética (velocidad) conlleva necesariamente una disminución en la presión estática P."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Teorema de Torricelli",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Un tanque grande abierto a la atmósfera contiene agua hasta una altura H. Si se perfora un orificio pequeño a una profundidad h por debajo de la superficie libre del agua, la rapidez de salida del chorro es:",
    opciones: [
      "A. v = √(g h)",
      "B. v = √(2 g h)",
      "C. v = 2 g h",
      "D. v = √(2 g H)"
    ],
    correcta: 1,
    explicacion: "El Teorema de Torricelli es una consecuencia directa de Bernoulli: la velocidad de descarga a profundidad h es idéntica a la que adquiriría un cuerpo en caída libre desde esa misma altura: v = √(2gh)."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Tubo de Pitot",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué mide específicamente el tubo de Pitot instalado en el fuselaje exterior de los aviones?",
    opciones: [
      "A. La altitud absoluta mediante radiación infrarroja",
      "B. La velocidad de la aeronave respecto al aire circundante midiendo la diferencia entre la presión total (de estancamiento) y la presión estática",
      "C. El consumo instantáneo de combustible por turbina",
      "D. La temperatura de ignición del motor"
    ],
    correcta: 1,
    explicacion: "El tubo de Pitot convierte la energía cinética del aire en un punto de estancamiento (v=0) donde P_total = P_estatica + 1/2 ρ v². Al medir la diferencia P_total - P_estatica, se determina la velocidad relativa del aire v = √(2ΔP/ρ)."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Efecto Magnus",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En deportes de pelota como squash, tenis o fútbol, una bola con efecto de rotación (spin) describe una trayectoria curvada en el aire. ¿Cómo se denomina y origina este efecto físico?",
    opciones: [
      "A. Efecto Venturi, debido únicamente a la gravedad",
      "B. Efecto Magnus: la rotación arrastra la capa límite de aire, acelerando el flujo en un lado y frenándolo en el opuesto, lo que genera una diferencia de presión neta lateral",
      "C. Efecto Doppler por reflexión de ondas acústicas",
      "D. Efecto Fotoeléctrico superficial del recubrimiento de la pelota"
    ],
    correcta: 1,
    explicacion: "El efecto Magnus surge por la asimetría en la velocidad relativa del aire respecto a la superficie giratoria: el lado que acompaña el giro acelera el aire (menor presión según Bernoulli) y el opuesto lo frena (mayor presión), creando una fuerza neta perpendicular."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Viscosidad y Ley de Poiseuille",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "La Ley de Poiseuille para flujo laminar estacionario de un líquido viscoso a través de un tubo cilíndrico de radio r y longitud L establece que el caudal volumétrico Q es proporcional a:",
    opciones: [
      "A. El radio del tubo r al cuadrado",
      "B. La cuarta potencia del radio del tubo (r⁴)",
      "C. La raíz cuadrada de la viscosidad del líquido",
      "D. La longitud del tubo elevada al cuadrado"
    ],
    correcta: 1,
    explicacion: "La fórmula de Poiseuille es Q = (π ΔP r⁴) / (8 η L). La fortísima dependencia con r⁴ explica por qué una pequeña reducción en el diámetro de una arteria o tubería disminuye drásticamente el caudal de flujo sanguíneo o hidráulico."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Número de Reynolds",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué representa físicamente el Número de Reynolds (Re = ρ v D / μ) en la dinámica de fluidos?",
    opciones: [
      "A. La relación entre las fuerzas elásticas y las térmicas",
      "B. La relación adimensional entre las fuerzas inerciales y las fuerzas viscosas en el seno del fluido",
      "C. La velocidad del sonido en el fluido dividida por la velocidad de la luz",
      "D. La densidad del fluido normalizada a la del mercurio"
    ],
    correcta: 1,
    explicacion: "Re compara las fuerzas inerciales (ρ v²) con las fuerzas viscosas (μ v / D). Valores bajos (Re < 2000 en tuberías) corresponden a régimen laminar suave, mientras que valores altos (Re > 4000) indican predominio de inercia y régimen caótico turbulento."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Ley de Stokes",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Cuál es la fuerza de resistencia hidrodinámica (arrastre viscoso) que experimenta una pequeña esfera de radio r que se desplaza a baja velocidad v en un fluido de viscosidad η (Ley de Stokes)?",
    opciones: [
      "A. F = 6 π η r v",
      "B. F = 1/2 ρ v² π r²",
      "C. F = 4/3 π r³ η v²",
      "D. F = 2 π η r / v"
    ],
    correcta: 0,
    explicacion: "Sir George Stokes derivó analíticamente que para números de Reynolds muy bajos (Re << 1), la resistencia sobre una esfera en un medio viscoso lineal es exactamente F_d = 6πηrv, clave histórica en el experimento de Millikan de la gota de aceite."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Tensión Superficial",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Por qué las gotas de líquido libres en ausencia de gravedad o suspendidas en el aire tienden espontáneamente a adoptar una geometría esférica?",
    opciones: [
      "A. Por la presión de radiación electromagnética exterior",
      "B. Porque la esfera es el cuerpo geométrico que minimiza el área superficial para un volumen dado, minimizando así la energía libre de tensión superficial",
      "C. Por repulsión electrostática entre los electrones periféricos",
      "D. Porque la densidad interna es heterogénea"
    ],
    correcta: 1,
    explicacion: "Las moléculas en la superficie poseen mayor energía potencial que las del interior debido a enlaces incompletos. La tensión superficial minimiza dicha energía reduciendo el área exterior al mínimo absoluto, lo cual geométricamente corresponde a una esfera."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Capilaridad y Ley de Jurin",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Cuando se introduce un tubo capilar de vidrio muy fino y vertical en agua, el líquido asciende espontáneamente hasta una altura h (Ley de Jurin). Esto ocurre debido a que:",
    opciones: [
      "A. Las fuerzas de cohesión intermoleculares del agua superan a las fuerzas de adhesión con el vidrio",
      "B. Las fuerzas de adhesión entre las moléculas de agua y las paredes de vidrio superan a las fuerzas de cohesión internas del agua",
      "C. La presión atmosférica en el interior del tubo se anula por completo",
      "D. El agua hierve a temperatura ambiente dentro del capilar"
    ],
    correcta: 1,
    explicacion: "Cuando la adhesión líquido-sólido supera la cohesión interna (líquido que 'moja', ángulo de contacto θ < 90°), el menisco resultante es cóncavo y la tensión superficial jala la columna hacia arriba hasta equilibrar su peso: h = 2γ cosθ / (ρ g r)."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Cavitación",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En bombas hidráulicas e hélices marinas que giran a alta velocidad, la 'cavitación' es un fenómeno sumamente destructivo caracterizado por:",
    opciones: [
      "A. La cristalización instantánea del agua en hielo",
      "B. La formación e implosión violenta de burbujas de vapor en regiones donde la presión local cae por debajo de la presión de vapor del líquido",
      "C. La electrólisis del agua en hidrógeno y oxígeno gaseoso",
      "D. La desmagnetización espontánea del eje de transmisión"
    ],
    correcta: 1,
    explicacion: "Si la velocidad del flujo es tan alta que la presión cae por debajo de la presión de vapor a esa temperatura, el líquido hierve a temperatura ambiente. Al alcanzar luego zonas de mayor presión, estas microburbujas colapsan violentamente erosionando el metal."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Fluidos No Newtonianos",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Una suspensión concentrada de almidón de maíz en agua (oobleck) se comporta como un líquido cuando se manipula lentamente, pero se vuelve extremadamente rígida al golpearla con fuerza. ¿Cómo se clasifica reológicamente este fluido?",
    opciones: [
      "A. Fluido dilatante (shear-thickening), cuya viscosidad aparente se incrementa con la tasa de deformación por cizalladura",
      "B. Fluido pseudoplástico (shear-thinning)",
      "C. Fluido newtoniano perfecto",
      "D. Fluido superfluido sin viscosidad"
    ],
    correcta: 0,
    explicacion: "Los fluidos dilatantes o reopécticos presentan un aumento drástico de su viscosidad aparente cuando se les aplica una tasa de corte o deformación súbita, mientras que los fluidos pseudoplásticos (como la pintura o el kétchup) se vuelven más fluidos al batirlos."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Paradoja Hidrostática",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Se tienen tres recipientes de formas muy disímiles (uno cónico, uno cilíndrico y uno esférico ensanchado) con la misma área de fondo A y llenos del mismo líquido hasta exactamente la misma altura h. ¿Cómo es la fuerza hidrostática en el fondo?",
    opciones: [
      "A. Mayor en el recipiente que contiene mayor masa total de líquido",
      "B. Menor en el recipiente cónico estrecho",
      "C. Idéntica en los tres recipientes (F = ρ g h A)",
      "D. Cero en todos debido al principio de equilibrio estático"
    ],
    correcta: 2,
    explicacion: "La paradoja de Stevin demuestra que la presión en el fondo de un líquido solo depende de la profundidad y la densidad (P = ρgh), no de la geometría de las paredes ni del volumen total. Al tener igual área A, la fuerza neta F = P·A es idéntica en los tres."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Presión Barométrica",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "¿Por qué Evangelista Torricelli utilizó mercurio en lugar de agua para construir el primer barómetro en 1643?",
    opciones: [
      "A. Porque el agua no experimenta atracción gravitacional",
      "B. Porque el mercurio es 13.6 veces más denso que el agua, lo que permitió equilibrar la presión atmosférica con una columna de solo 76 cm en vez de más de 10 metros",
      "C. Porque el mercurio es transparente a la radiación térmica",
      "D. Porque el agua no cabe en tubos de vidrio"
    ],
    correcta: 1,
    explicacion: "Como P_atm = ρ g h, para equilibrar ~101,325 Pa el agua requeriría un tubo de más de 10.3 metros de altura. Al usar mercurio líquido (ρ ≈ 13,600 kg/m³), la columna requerida fue de apenas 760 mm (76 cm)."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Flotabilidad Neutral",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Un submarino se sumerge a profundidad constante en el océano en estado de 'flotabilidad neutral'. Para lograrlo, los tanques de lastre deben ajustarse de manera que:",
    opciones: [
      "A. La masa total del submarino dividida por su volumen total sea estrictamente igual a la densidad media del agua de mar a esa profundidad",
      "B. El peso del submarino sea el doble de la fuerza de empuje",
      "C. Toda el agua interna de lastre sea expulsada completamente",
      "D. Los motores de propulsión funcionen permanentemente a máxima potencia hacia arriba"
    ],
    correcta: 0,
    explicacion: "La flotabilidad neutral se alcanza cuando el peso del objeto iguala con precisión milimétrica al empuje de Arquímedes (W = E), lo que equivale a decir que la densidad promedio del submarino coincide exactamente con la densidad del agua circundante."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Presión Manométrica",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "Si el manómetro del neumático de una bicicleta marca una presión de 4.0 bar (≈ 400 kPa), ¿cuál es la presión absoluta aproximada del aire en su interior considerando una presión atmosférica de 1.0 bar?",
    opciones: [
      "A. 3.0 bar",
      "B. 4.0 bar",
      "C. 5.0 bar",
      "D. 8.0 bar"
    ],
    correcta: 2,
    explicacion: "La presión absoluta es la suma de la presión atmosférica local más la presión manométrica leída por el instrumento: P_abs = P_atm + P_man = 1.0 bar + 4.0 bar = 5.0 bar."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Efecto Venturi",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál es el principio operativo de un pulverizador o atomizador clásico basado en el Efecto Venturi?",
    opciones: [
      "A. Un chorro de aire rápido sobre la boca superior de un tubo vertical disminuye la presión local, haciendo que la presión atmosférica en el depósito empuje el líquido hacia arriba",
      "B. El líquido se calienta por microondas hasta salir por dilatación",
      "C. La gravedad atrae el fluido hacia la atmósfera",
      "D. Se crea un campo magnético que polariza el agua líquida"
    ],
    correcta: 0,
    explicacion: "Al pasar aire a alta velocidad por la boquilla (estrechamiento), la presión estática disminuye según Bernoulli. La mayor presión atmosférica sobre la superficie libre del líquido en el depósito lo impulsa a ascender por el tubo, donde el aire lo dispersa en gotas."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Capa Límite",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En aerodinámica, la 'Capa Límite' descubierta por Ludwig Prandtl en 1904 es:",
    opciones: [
      "A. La capa exterior de la atmósfera terrestre donde termina el aire respirable",
      "B. La delgada región de fluido adyacente a una superficie sólida donde los efectos de la fricción viscosa son determinantes y la velocidad relativa varía desde cero hasta la corriente libre",
      "C. Una pintura química que impide la condensación de vapor de agua en las alas",
      "D. La zona donde la temperatura del avión supera la barrera del calor"
    ],
    correcta: 1,
    explicacion: "Prandtl demostró que los efectos viscosos se concentran en una capa muy delgada pegada al cuerpo sólido debido a la condición de no-deslizamiento (v=0 en la pared), permitiendo tratar el resto del fluido exterior como prácticamente no viscoso."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Arrastre Aerodinámico",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La fuerza de resistencia aerodinámica que frena a un automóvil que viaja a alta velocidad por autopista es aproximadamente proporcional a:",
    opciones: [
      "A. La raíz cuadrada de la velocidad",
      "B. La velocidad lineal simple (v)",
      "C. El cuadrado de la velocidad del vehículo (v²)",
      "D. La masa del automóvil dividida por su volumen"
    ],
    correcta: 2,
    explicacion: "En régimen turbulento inercial de alta velocidad (Re alto), la ecuación de arrastre es F_d = 1/2 ρ C_d A v². Duplicar la velocidad del automóvil cuadruplica la resistencia del aire y multiplica por ocho la potencia mecánica requerida para vencerla."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Presión Osmótica",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué es la presión osmótica y cómo se describe para soluciones diluidas según la Ley de van 't Hoff?",
    opciones: [
      "A. Es la presión gravitatoria que ejerce un gas noble en disolución acuosa",
      "B. Es la presión hidrostática requerida para detener el flujo espontáneo de solvente puro a través de una membrana semipermeable hacia una solución más concentrada: Π = i M R T",
      "C. Es la presión interna que hace estallar a los glóbulos rojos en agua salada",
      "D. Es la fuerza electromotriz generada por iones de sodio en reposo"
    ],
    correcta: 1,
    explicacion: "La ósmosis es el transporte espontáneo de disolvente hacia el medio hipertónico. La presión externa necesaria para frenar dicho flujo es la presión osmótica, descrita análogamente a la ecuación del gas ideal: Π = i (n/V) RT = iMRT."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Manómetro de Tubo en U",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En un manómetro en U abierto que contiene dos líquidos inmiscibles en equilibrio, las alturas de las columnas sobre la superficie de separación satisfacen que:",
    opciones: [
      "A. El líquido de menor densidad tiene menor altura de columna",
      "B. La altura de cada líquido es inversamente proporcional a su densidad (ρ₁ h₁ = ρ₂ h₂)",
      "C. Las alturas siempre son idénticas sin importar la densidad",
      "D. El producto de las alturas es constante"
    ],
    correcta: 1,
    explicacion: "Al mismo nivel horizontal continuo del mismo líquido, la presión debe ser idéntica: P₀ + ρ₁ g h₁ = P₀ + ρ₂ g h₂. Por tanto, ρ₁ h₁ = ρ₂ h₂, lo que demuestra que el líquido menos denso necesita una columna más alta para equilibrar la presión."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Vórtices y Circulación",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El Teorema de Kutta-Joukowski en aerodinámica establece que la sustentación por unidad de envergadura L' generada sobre un cilindro o perfil alar es directamente proporcional a:",
    opciones: [
      "A. L' = ρ_aire · v_infinito · Γ (donde Γ es la circulación de la velocidad alrededor del perfil)",
      "B. El peso molecular del aluminio de la aeronave",
      "C. La conductividad eléctrica de la atmósfera",
      "D. La aceleración de la gravedad al cuadrado"
    ],
    correcta: 0,
    explicacion: "El teorema fundamental de Kutta-Joukowski formaliza analíticamente la sustentación bidimensional en fluidos potenciales: L' = ρ v_∞ Γ. Demuestra que la generación de sustentación está unida intrínsecamente a la circulación hidrodinámica Γ generada."
  },
  {
    area: "Mecánica de Fluidos",
    subtema: "Densidad y Flotación",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "¿Por qué un enorme crucero transatlántico construido con decenas de miles de toneladas de acero flota pacíficamente en el mar, mientras que una simple aguja de acero se hunde?",
    opciones: [
      "A. Porque el agua de mar no ejerce empuje sobre objetos pequeños",
      "B. Porque el barco contiene grandes volúmenes de aire interior que hacen que su densidad media total sea significativamente menor que la densidad del agua de mar",
      "C. Por la sal marina que repele químicamente al acero de gran tamaño",
      "D. Porque los motores del barco generan una corriente antigravitatoria constante"
    ],
    correcta: 1,
    explicacion: "La flotabilidad depende de la densidad promedio del objeto completo (masa total dividida por volumen exterior desplazado). Al ser hueco y lleno de aire, el volumen desplazado por el casco genera un empuje de Arquímedes colosal que supera al peso total."
  },

  // --- TERMODINÁMICA Y MECÁNICA ESTADÍSTICA (25 preguntas) ---
  {
    area: "Termodinámica",
    subtema: "Ley Cero de la Termodinámica",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "¿Cuál es la consecuencia conceptual más trascendental de la Ley Cero de la Termodinámica?",
    opciones: [
      "A. Establece que la energía del universo es infinita",
      "B. Permite definir formalmente el concepto de temperatura y valida el uso de termómetros para comparar estados térmicos en equilibrio",
      "C. Prohíbe la transferencia de calor por radiación",
      "D. Determina el valor exacto del calor latente del agua"
    ],
    correcta: 1,
    explicacion: "La Ley Cero dice que si el cuerpo A está en equilibrio térmico con B, y B con C, entonces A y C están en equilibrio mutuo. Esta propiedad transitiva garantiza la existencia de una variable de estado universal llamada temperatura."
  },
  {
    area: "Termodinámica",
    subtema: "Primera Ley de la Termodinámica",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En una expansión adiabática ideal de un gas encerrado en un cilindro con émbolo móvil (Q = 0):",
    opciones: [
      "A. La energía interna aumenta porque el gas realiza trabajo",
      "B. La energía interna disminuye exactamente en la misma cantidad que el trabajo realizado por el gas (ΔU = -W), enfriándose el sistema",
      "C. La temperatura del gas se mantiene rigurosamente constante",
      "D. La presión permanece inalterada durante toda la expansión"
    ],
    correcta: 1,
    explicacion: "Por la 1ª Ley: ΔU = Q - W. En un proceso adiabático Q = 0, luego ΔU = -W. Al expandirse, el gas realiza trabajo positivo sobre el entorno (W > 0), a expensas directas de su propia energía interna (ΔU < 0), lo que provoca una caída de su temperatura."
  },
  {
    area: "Termodinámica",
    subtema: "Proceso Isotérmico",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Durante la expansión isotérmica cuasiestática de un mol de gas ideal a temperatura T desde un volumen V₁ hasta V₂ = 2V₁, el calor neto absorbido por el gas es:",
    opciones: [
      "A. Cero, porque la temperatura no cambia",
      "B. Q = R T ln(2), exactamente igual al trabajo realizado por el gas",
      "C. Q = 2 R T",
      "D. Q = -R T ln(2)"
    ],
    correcta: 1,
    explicacion: "En un gas ideal la energía interna U depende exclusivamente de la temperatura (U = f(T)). En un proceso isotérmico ΔT = 0, por lo que ΔU = 0. De la 1ª Ley se desprende que Q = W = ∫ P dV = ∫ (nRT/V) dV = nRT ln(V₂/V₁) = RT ln(2)."
  },
  {
    area: "Termodinámica",
    subtema: "Proceso Isobárico",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En un proceso termodinámico isobárico (a presión constante P constante), el trabajo mecánico realizado por el sistema sobre el entorno cuando su volumen varía desde V₁ hasta V₂ es:",
    opciones: [
      "A. W = 0",
      "B. W = P (V₂ - V₁)",
      "C. W = P / (V₂ - V₁)",
      "D. W = n R ln(V₂ / V₁)"
    ],
    correcta: 1,
    explicacion: "La definición general de trabajo cuasiestático es W = ∫ P dV. Si la presión P se mantiene constante a lo largo de todo el proceso, sale de la integral dando directamente W = P ∫ dV = P(V₂ - V₁)."
  },
  {
    area: "Termodinámica",
    subtema: "Proceso Isocórico",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "Cuando se suministra calor a un gas ideal encerrado dentro de un recipiente rígido e indeformable (volumen constante):",
    opciones: [
      "A. El trabajo de expansión mecánica es nulo (W = 0) y todo el calor absorbido se destina a incrementar la energía interna (Q = ΔU)",
      "B. El calor absorbido se convierte íntegramente en trabajo mecánico útil",
      "C. La presión del gas cae a cero",
      "D. La temperatura disminuye"
    ],
    correcta: 0,
    explicacion: "Al ser el volumen constante (dV = 0), las paredes rígidas no se desplazan y el trabajo mecánico es nulo: W = ∫ P dV = 0. En consecuencia, por la 1ª Ley ΔU = Q, por lo que todo el calor transferido eleva la temperatura y presión del gas."
  },
  {
    area: "Termodinámica",
    subtema: "Segunda Ley de la Termodinámica",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "El enunciado de Clausius de la Segunda Ley de la Termodinámica establece fundamentalmente que:",
    opciones: [
      "A. La energía se conserva en todas las transformaciones físicas",
      "B. Es imposible construir un proceso cíclico cuyo único resultado sea transferir calor espontáneamente desde un cuerpo de menor temperatura a otro de mayor temperatura",
      "C. Todos los motores térmicos tienen una eficiencia del 100%",
      "D. El cero absoluto de temperatura puede alcanzarse en un número finito de etapas"
    ],
    correcta: 1,
    explicacion: "El calor fluye espontáneamente solo de cuerpos calientes a fríos. Para transferir calor en sentido inverso (de un foco frío a uno caliente, como en una refrigeradora) es estrictamente necesario suministrar trabajo mecánico externo al sistema."
  },
  {
    area: "Termodinámica",
    subtema: "Enunciado de Kelvin-Planck",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué prohíbe formalmente el enunciado de Kelvin-Planck de la Segunda Ley de la Termodinámica?",
    opciones: [
      "A. La existencia de procesos adiabáticos reversibles",
      "B. Una máquina térmica cíclica que absorba calor de un único foco térmico y lo transforme íntegramente en trabajo mecánico neto sin ceder calor a un foco más frío",
      "C. La dilatación de los metales al calentarse",
      "D. Que los gases ejerzan presión sobre las paredes"
    ],
    correcta: 1,
    explicacion: "Descarta la llamada 'máquina de movimiento continuo de segunda especie': no es posible extraer calor de un único depósito (por ejemplo, del océano) y convertirlo 100% en trabajo sin disponer de un foco sumidero a menor temperatura."
  },
  {
    area: "Termodinámica",
    subtema: "Ciclo de Carnot",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Una máquina térmica ideal de Carnot opera entre un foco caliente a 600 K y un foco frío a 300 K. ¿Cuál es su rendimiento térmico teórico?",
    opciones: [
      "A. 100%",
      "B. 75%",
      "C. 50%",
      "D. 25%"
    ],
    correcta: 2,
    explicacion: "La eficiencia del ciclo reversible de Carnot depende solo de las temperaturas absolutas de los focos: η = 1 - T_C / T_H = 1 - (300 K / 600 K) = 1 - 0.50 = 0.50, es decir, el 50%."
  },
  {
    area: "Termodinámica",
    subtema: "Entropía y Flecha del Tiempo",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En cualquier proceso termodinámico espontáneo o irreversible que ocurra dentro de un sistema aislado del universo:",
    opciones: [
      "A. La entropía total del sistema disminuye continuamente",
      "B. La entropía total del sistema permanece rigurosamente igual a cero",
      "C. La entropía total del sistema aumenta estrictamente (ΔS_aislado > 0)",
      "D. La temperatura se vuelve infinita"
    ],
    correcta: 2,
    explicacion: "El Principio del Incremento de Entropía establece que para todo proceso real (irreversible) en un sistema aislado, la entropía siempre crece: dS ≥ dQ/T, con dS > 0 para procesos irreversibles. Esto define la dirección o 'flecha termodinámica' del tiempo."
  },
  {
    area: "Termodinámica",
    subtema: "Fórmula de Boltzmann",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "La célebre fórmula estadística de Ludwig Boltzmann grabada en su lápida en Viena vincula la entropía macroscópica S con el número de microestados accesibles Ω mediante:",
    opciones: [
      "A. S = k_B ln(Ω)",
      "B. S = Ω / k_B",
      "C. S = k_B · Ω²",
      "D. S = h · c · ln(Ω)"
    ],
    correcta: 0,
    explicacion: "S = k_B ln Ω conecta magistralmente la termodinámica macroscópica con la probabilidad microscópica, donde k_B es la constante de Boltzmann y Ω es la multiplicidad o número de configuraciones cuánticas microscópicas compatibles con el macroestado."
  },
  {
    area: "Termodinámica",
    subtema: "Tercera Ley de la Termodinámica",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué establece el Teorema de Nernst o Tercera Ley de la Termodinámica cuando la temperatura de un sistema físico se aproxima asintóticamente al cero absoluto (0 Kelvin)?",
    opciones: [
      "A. La masa de los átomos se duplica",
      "B. La entropía de cualquier sustancia pura cristalina en equilibrio termodinámico perfecto tiende a un valor constante independiente e igual a cero",
      "C. La presión del sistema diverge hacia el infinito",
      "D. El calor específico molar se vuelve infinito"
    ],
    correcta: 1,
    explicacion: "Al aproximarse a 0 K, las fluctuaciones térmicas desaparecen y el cristal perfecto adopta un único microestado fundamental bien definido (Ω = 1). Como S = k_B ln(1) = 0, la entropía se anula en el cero absoluto."
  },
  {
    area: "Termodinámica",
    subtema: "Gas de Van der Waals",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "En la ecuación de estado de Van der Waals para gases reales, (P + a/V²)(V - b) = RT, ¿qué representan físicamente los parámetros 'a' y 'b'?",
    opciones: [
      "A. 'a' es la velocidad de la luz y 'b' la masa del protón",
      "B. 'a' corrige las fuerzas atractivas intermoleculares de largo alcance y 'b' representa el covolumen o volumen propio finito ocupado por las moléculas",
      "C. 'a' mide la conductividad eléctrica y 'b' la viscosidad cinemática",
      "D. Son simples constantes matemáticas sin interpretación física alguna"
    ],
    correcta: 1,
    explicacion: "El término a/V² suma la presión adicional debida a la atracción mutua entre moléculas que reduce el impacto contra la pared, mientras que b (covolumen) resta el volumen efectivo ocupado por las moléculas reales debido a su repulsión de corto alcance."
  },
  {
    area: "Termodinámica",
    subtema: "Teorema de Equipartición",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Según el Teorema de Equipartición de la Energía en mecánica estadística clásica, ¿cuánta energía cinética promedio corresponde a cada grado de libertad cuadrático por molécula en equilibrio a temperatura T?",
    opciones: [
      "A. k_B T",
      "B. 1/2 k_B T",
      "C. 3/2 k_B T",
      "D. 2 k_B T"
    ],
    correcta: 1,
    explicacion: "En el límite clásico, cada término cuadrático independiente en el hamiltoniano (traslacional, rotacional o vibracional) contribuye en promedio con exactamente 1/2 k_B T a la energía interna por partícula (o 1/2 RT por mol)."
  },
  {
    area: "Termodinámica",
    subtema: "Punto Triple del Agua",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Qué condición termodinámica singular define al 'Punto Triple' de una sustancia pura como el agua?",
    opciones: [
      "A. La temperatura a la cual el agua hierve a 1 atmósfera de presión",
      "B. El estado único de temperatura (0.01 °C = 273.16 K) y presión (611.65 Pa) en el cual coexisten en equilibrio termodinámico simultáneo las tres fases: sólida, líquida y gaseosa",
      "C. El punto donde el hielo flota con el 100% de su volumen sumergido",
      "D. La temperatura a la que el agua se disocia en iones de hidrógeno"
    ],
    correcta: 1,
    explicacion: "Según la Regla de las Fases de Gibbs (F = C - P + 2 = 1 - 3 + 2 = 0), un punto triple tiene cero grados de libertad: es un punto termodinámico invariante y único donde conviven en equilibrio el hielo, el agua líquida y el vapor de agua."
  },
  {
    area: "Termodinámica",
    subtema: "Efecto Joule-Thomson",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El Efecto Joule-Thomson describe el cambio de temperatura que experimenta un gas real al forzarlo a expandirse a través de una válvula estranguladora o tapón poroso en un proceso:",
    opciones: [
      "A. Rigurosamente isobárico",
      "B. Rigurosamente isentálpico (H = constante) y adiabático",
      "C. Rigurosamente isocórico",
      "D. De fusión nuclear controlada"
    ],
    correcta: 1,
    explicacion: "La expansión estrangulada a través de un tapón poroso o válvula es un proceso adiabático irreversible con entalpía constante (ΔH = 0). Si el gas está por debajo de su temperatura de inversión, la expansión produce enfriamiento, base de la licuefacción industrial de gases."
  },
  {
    area: "Termodinámica",
    subtema: "Ley de Stefan-Boltzmann",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "La potencia total por unidad de área emitida por radiación electromagnética por un cuerpo negro ideal a temperatura absoluta T es proporcional a:",
    opciones: [
      "A. T (temperatura lineal)",
      "B. T²",
      "C. T³",
      "D. T⁴ (la cuarta potencia de la temperatura absoluta: j* = σ T⁴)",
      ],
    correcta: 3,
    explicacion: "La Ley de Stefan-Boltzmann formulada en 1879 por Jožef Stefan y deducida termodinámicamente por Ludwig Boltzmann demuestra que la radiancia total crece como la cuarta potencia: j* = σT⁴, donde σ ≈ 5.67 × 10⁻⁸ W/(m²·K⁴)."
  },
  {
    area: "Termodinámica",
    subtema: "Ley de Desplazamiento de Wien",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "La Ley de Desplazamiento de Wilhelm Wien establece que la longitud de onda λ_max correspondiente al pico de emisión de radiación de cuerpo negro cumple la relación:",
    opciones: [
      "A. λ_max / T = constante",
      "B. λ_max · T = b ≈ 2.898 × 10⁻³ m · K",
      "C. λ_max · T⁴ = constante",
      "D. λ_max = b · T²"
    ],
    correcta: 1,
    explicacion: "La Ley de Wien demuestra que a mayor temperatura del cuerpo emisor, el pico de máxima radiancia se desplaza hacia longitudes de onda más cortas (mayores frecuencias): λ_max T = constante. Por eso el Sol (5778 K) emite principalmente en el espectro visible."
  },
  {
    area: "Termodinámica",
    subtema: "Calor Específico de Gases",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Para un gas ideal monoatómico (como el helio o el argón), la relación entre sus calores específicos molares γ = Cp / Cv es teóricamente igual a:",
    opciones: [
      "A. 1.00",
      "B. 1.33 (4/3)",
      "C. 1.40 (7/5)",
      "D. 1.67 (5/3)"
    ],
    correcta: 3,
    explicacion: "Un gas monoatómico solo posee 3 grados de libertad traslacionales: Cv = 3/2 R. Por la relación de Mayer Cp = Cv + R = 5/2 R. Por consiguiente, el coeficiente adiabático γ = Cp/Cv = (5/2 R) / (3/2 R) = 5/3 ≈ 1.67."
  },
  {
    area: "Termodinámica",
    subtema: "Mecanismos de Transferencia de Calor",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "¿Cuál de los tres mecanismos de transferencia de calor puede propagar energía térmica a través del vacío absoluto del espacio interestelar?",
    opciones: [
      "A. Conducción molecular",
      "B. Convección natural de fluidos",
      "C. Radiación electromagnética térmica",
      "D. Advección capilar"
    ],
    correcta: 2,
    explicacion: "Tanto la conducción como la convección requieren obligatoriamente la presencia de un medio material (choques atómicos o transporte macroscópico de masa). Solo la radiación electromagnética (ondas electromagnéticas y fotones) viaja libremente por el vacío cósmico."
  },
  {
    area: "Termodinámica",
    subtema: "Calor Latente",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "Durante el proceso en que un cubo de hielo a 0 °C se funde completamente en agua líquida a 0 °C a presión atmosférica normal:",
    opciones: [
      "A. La temperatura del sistema aumenta uniformemente desde 0 °C hasta 4 °C",
      "B. La temperatura permanece estrictamente constante en 0 °C mientras el calor absorbido se emplea en romper los enlaces moleculares de la red cristalina",
      "C. La energía interna total del sistema permanece invariable",
      "D. La masa del agua resultante es la mitad que la del hielo inicial"
    ],
    correcta: 1,
    explicacion: "Los cambios de fase de primer orden de sustancias puras a presión constante son estrictamente isotérmicos: la energía térmica transferida (calor latente de fusión Q = m·L_f) no incrementa la energía cinética media (temperatura), sino la energía potencial de cohesión intermolecular."
  },
  {
    area: "Termodinámica",
    subtema: "Dilatación Anómala del Agua",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Por qué los lagos y ríos se congelan en invierno comenzando por la superficie y no desde el fondo?",
    opciones: [
      "A. Porque la radiación solar calienta preferentemente el lecho del lago",
      "B. Por la dilatación anómala del agua: alcanza su máxima densidad a 4 °C, hundiéndose el agua a 4 °C al fondo, mientras que el agua más fría (0-3 °C) y el hielo son menos densos y flotan en la superficie",
      "C. Porque el fondo de los lagos contiene azufre que impide la solidificación",
      "D. Por corrientes de convección forzadas por el campo magnético terrestre"
    ],
    correcta: 1,
    explicacion: "Debido a los enlaces por puente de hidrógeno que forman una estructura hexagonal abierta al congelarse, el agua tiene su máxima densidad a 3.98 °C (~4 °C). El agua a 0 °C y el hielo flotan, creando una capa aislante que protege la vida acuática en el fondo."
  },
  {
    area: "Termodinámica",
    subtema: "Gas de Bose-Einstein",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Qué fenómeno cuántico-estadístico ocurre en un gas de bosones cuando se enfría por debajo de su temperatura crítica de condensación Tc?",
    opciones: [
      "A. Los bosones se transforman espontáneamente en electrones relativistas",
      "B. Una fracción macroscópica de los bosones colapsa al mismo estado cuántico fundamental de mínima energía, comportándose coordinadamente como una única onda macroscópica",
      "C. Los átomos se repelen con fuerza electrostática infinita",
      "D. La masa de los átomos se evapora por completo"
    ],
    correcta: 1,
    explicacion: "Predicho por Bose y Einstein (1924-1925) y observado experimentalmente en 1995 con átomos de rubidio (Premio Nobel 2001), el condensado de Bose-Einstein es un estado de la materia donde millones de bosones ocupan el estado fundamental compartido con coherencia cuántica macroscópica."
  },
  {
    area: "Termodinámica",
    subtema: "Energía Libre de Gibbs",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Para un sistema cerrado que evoluciona a temperatura T constante y presión P constante, la condición termodinámica de espontaneidad y equilibrio viene gobernada por:",
    opciones: [
      "A. La energía interna U debe ser siempre creciente",
      "B. La energía libre de Gibbs G = H - TS, donde los procesos espontáneos exigen ΔG < 0 y el equilibrio termodinámico se alcanza cuando G es mínima (dG = 0)",
      "C. El calor latente debe ser exactamente igual a la constante de Planck",
      "D. La entropía del sistema debe hacerse necesariamente cero"
    ],
    correcta: 1,
    explicacion: "A T y P constantes, el criterio fundamental de espontaneidad derivado de la 2ª Ley es la minimización del potencial termodinámico de Gibbs: ΔG = ΔH - TΔS < 0. En el equilibrio químico y de fases, G alcanza su mínimo absoluto."
  },
  {
    area: "Termodinámica",
    subtema: "Equivalente Mecánico del Calor",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "En su célebre experimento de 1843 con un recipiente de agua agitado por paletas accionadas por pesas descendentes, James Prescott Joule demostró experimentalmente que:",
    opciones: [
      "A. El calor es una sustancia fluida e indestructible llamada 'calórico'",
      "B. El calor y el trabajo mecánico son formas equivalentes de transferencia de energía, requiriéndose aproximadamente 4.18 Joules para elevar 1 g de agua en 1 °C (1 caloría ≈ 4.184 J)",
      "C. El trabajo mecánico se destruye irreversiblemente al agitar líquidos",
      "D. El agua no puede absorber energía mecánica"
    ],
    correcta: 1,
    explicacion: "Joule demolió la teoría errónea del 'calórico' al demostrar que el trabajo mecánico y el calor son intercambiables de forma cuantitativa y exacta, sentando las bases empíricas definitivas del Principio de Conservación de la Energía."
  },
  {
    area: "Termodinámica",
    subtema: "Paradoja de Gibbs",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Cómo resolvió Josiah Willard Gibbs la paradoja sobre el aumento espurio de entropía que predecía la termodinámica clásica al mezclar dos muestras del mismo gas idéntico a igual T y P?",
    opciones: [
      "A. Negando la validez de la 2ª Ley de la Termodinámica",
      "B. Introduciendo el factor de indistinguibilidad cuántico N! en el conteo de microestados en el espacio de fases, reconociendo que permutar partículas idénticas no genera un nuevo estado físico",
      "C. Afirmando que los gases reales tienen densidad infinita",
      "D. Modificando el valor numérico de la constante de los gases R"
    ],
    correcta: 1,
    explicacion: "Dividir la función de partición clásica por N! (factor de corrección de Gibbs) corrige el sobreconteo de microestados debido a la indistinguibilidad de las partículas idénticas, garantizando que la entropía sea una variable estrictamente extensiva (ΔS_mezcla = 0 al mezclar gases idénticos)."
  }
];
