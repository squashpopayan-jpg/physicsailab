// Módulo 3: Electromagnetismo, Circuitos, Ondas, Acústica y Óptica (55 preguntas)
module.exports = [
  // --- ELECTROSTÁTICA, CIRCUITOS Y ELECTROMAGNETISMO (30 preguntas) ---
  {
    area: "Electromagnetismo",
    subtema: "Ley de Gauss",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La Ley de Gauss establece que el flujo eléctrico neto a través de cualquier superficie gaussiana cerrada es igual a:",
    opciones: [
      "A. La corriente eléctrica que atraviesa dicha superficie dividida por la permitividad del vacío",
      "B. La carga eléctrica neta total encerrada dividida por la permitividad del vacío (Q_enc / ε₀)",
      "C. La derivada temporal del flujo magnético",
      "D. Cero en todos los casos físicos reales"
    ],
    correcta: 1,
    explicacion: "La 1ª Ecuación de Maxwell (Ley de Gauss) formula: ∮ E · dA = Q_enc / ε₀. Muestra que las cargas eléctricas actúan como fuentes (cargas positivas) o sumideros (cargas negativas) de las líneas de campo eléctrico."
  },
  {
    area: "Electromagnetismo",
    subtema: "Equilibrio Electrostático",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál es el valor del campo eléctrico en cualquier punto del interior de un conductor metálico sólido en equilibrio electrostático estático?",
    opciones: [
      "A. Es idénticamente cero (E = 0)",
      "B. Es proporcional a la masa del conductor",
      "C. Es infinito cerca del centro geométrico",
      "D. Oscila a la frecuencia de resonancia de los electrones"
    ],
    correcta: 0,
    explicacion: "Si existiera campo eléctrico en el interior, los electrones libres de conducción experimentarían una fuerza F = qE y se moverían, contradiciendo la condición de equilibrio electrostático. Los electrones se redistribuyen en la superficie hasta anular por completo el campo interior."
  },
  {
    area: "Electromagnetismo",
    subtema: "Jaula de Faraday",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "Los pasajeros en el interior de un automóvil cerrado con carrocería metálica o en un avión no sufren daños directos si el vehículo es alcanzado por un rayo. ¿A qué fenómeno físico se debe este apantallamiento?",
    opciones: [
      "A. Al aislamiento eléctrico que proporcionan los neumáticos de caucho",
      "B. Al efecto Jaula de Faraday: las cargas eléctricas del rayo circulan por la superficie exterior conductora y el campo eléctrico en el recinto interior permanece nulo",
      "C. A que el rayo no tiene carga eléctrica suficiente",
      "D. A la refracción cuántica del aire interior"
    ],
    correcta: 1,
    explicacion: "En un recinto conductor cerrado (Jaula de Faraday), cualquier carga externa induce una distribución superficial que cancela con absoluta precisión el campo eléctrico en la cavidad interna, protegiendo todo lo que se encuentre en su interior."
  },
  {
    area: "Electromagnetismo",
    subtema: "Superficies Equipotenciales",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Qué ángulo geométrico forman siempre las líneas de campo eléctrico con las superficies equipotenciales en cualquier punto del espacio?",
    opciones: [
      "A. 0° (son paralelas)",
      "B. 45°",
      "C. 90° (son rigurosamente perpendiculares)",
      "D. 180°"
    ],
    correcta: 2,
    explicacion: "Como el trabajo para desplazar una carga sobre una superficie equipotencial es nulo (dW = -q dV = 0 = q E · dr), el producto escalar E · dr debe anularse para cualquier desplazamiento dr tangente a la superficie. Por tanto, el vector campo E es siempre perpendicular a las equipotenciales."
  },
  {
    area: "Electromagnetismo",
    subtema: "Condensadores y Dieléctricos",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Qué efecto produce introducir un material dieléctrico de constante dieléctrica relativa κ > 1 entre las placas de un condensador aislado con carga fija Q?",
    opciones: [
      "A. Aumenta la diferencia de potencial entre las placas",
      "B. Reduce el campo eléctrico y el voltaje entre placas, aumentando la capacitancia por un factor κ (C = κ C₀)",
      "C. Disminuye la capacitancia a la mitad",
      "D. Descarga instantáneamente el condensador destruyendo su carga"
    ],
    correcta: 1,
    explicacion: "Las moléculas del dieléctrico se polarizan creando un campo interno inducido opuesto al campo exterior, lo que reduce el campo neto (E = E₀/κ) y consecuentemente el voltaje (V = V₀/κ). Dado que C = Q/V, la capacitancia se multiplica por κ."
  },
  {
    area: "Electromagnetismo",
    subtema: "Energía en Condensadores",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál es la expresión exacta para la energía electrostática total almacenada en un condensador de capacitancia C cargado a un potencial V?",
    opciones: [
      "A. U = C V",
      "B. U = 1/2 C V²",
      "C. U = 2 C² V",
      "D. U = C / (2 V²)"
    ],
    correcta: 1,
    explicacion: "La energía almacenada corresponde al trabajo realizado para transferir infinitesimalmente la carga: U = ∫ V(q) dq = ∫ (q/C) dq = 1/2 q²/C = 1/2 C V². Esta energía reside físicamente almacenada en el campo eléctrico confinado entre las placas."
  },
  {
    area: "Electromagnetismo",
    subtema: "Circuitos RC",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En un circuito serie compuesto por una resistencia R y un condensador inicialmente descargado C conectado a una fuente V₀, la constante de tiempo τ = RC representa el tiempo necesario para que el condensador alcance aproximadamente:",
    opciones: [
      "A. El 50% de su voltaje final de carga",
      "B. El 63.2% (1 - 1/e) de su carga y voltaje final máximo",
      "C. El 100% exacto de su carga de equilibrio",
      "D. El 99.9% de su carga"
    ],
    correcta: 1,
    explicacion: "La ecuación de carga de un condensador es V(t) = V₀ (1 - e^(-t/RC)). Cuando t = τ = RC, el factor es (1 - e⁻¹) = 1 - 0.368 = 0.632, lo que equivale al 63.2% del voltaje final de la fuente."
  },
  {
    area: "Electromagnetismo",
    subtema: "Leyes de Kirchhoff",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La Primera Ley de Kirchhoff (Ley de Nodos: ∑ I = 0) y la Segunda Ley de Kirchhoff (Ley de Mallas: ∑ V = 0) son manifestaciones directas de las leyes fundamentales de conservación de:",
    opciones: [
      "A. Momento lineal y masa respectivamente",
      "B. Carga eléctrica y energía respectivamente",
      "C. Momento angular e inductancia respectivamente",
      "D. Resistencia y capacitancia respectivamente"
    ],
    correcta: 1,
    explicacion: "La ley de nodos refleja la conservación de la carga eléctrica (no puede acumularse carga neta indefinidamente en un punto infinitesimal). La ley de mallas refleja la conservación de la energía en un campo electrostático conservativo (∮ E · dl = 0)."
  },
  {
    area: "Electromagnetismo",
    subtema: "Fuerza Magnética de Lorentz",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Una partícula con carga positiva q se mueve con velocidad v en una región donde existe un campo magnético uniforme B. Si v es paralela a B, ¿cuál es la magnitud de la fuerza magnética sobre la partícula?",
    opciones: [
      "A. F = q v B",
      "B. F = 0 (cero)",
      "C. F = 1/2 q v² B",
      "D. F = q B / v"
    ],
    correcta: 1,
    explicacion: "La fuerza magnética sobre una carga en movimiento es el producto vectorial F = q (v × B), cuya magnitud es |F| = |q| v B senθ. Si la velocidad es paralela al campo, el ángulo es θ = 0°, y como sen(0°) = 0, la fuerza magnética es idénticamente nula."
  },
  {
    area: "Electromagnetismo",
    subtema: "Trabajo del Campo Magnético",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Por qué un campo magnético estático B nunca puede realizar trabajo mecánico sobre una partícula cargada libre?",
    opciones: [
      "A. Porque los campos magnéticos no poseen energía",
      "B. Porque la fuerza magnética F = q (v × B) es en todo instante estrictamente perpendicular al vector velocidad v y al desplazamiento infinitesimal dr, haciendo que dW = F · dr = 0",
      "C. Porque los electrones son inmunes a los campos magnéticos",
      "D. Por el principio de equivalencia relativista"
    ],
    correcta: 1,
    explicacion: "Dado que la fuerza magnética es perpendicular a la velocidad en todo instante, la potencia instantánea entregada P = F · v = q (v × B) · v = 0. En consecuencia, el campo magnético solo desvía la dirección del movimiento, pero no puede alterar la rapidez ni la energía cinética de la partícula."
  },
  {
    area: "Electromagnetismo",
    subtema: "Radio de Larmor en Ciclotrón",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Una partícula cargada (masa m, carga q) ingresa perpendicularmente a un campo magnético uniforme B con rapidez v. El radio R de la trayectoria circular descrita viene dado por:",
    opciones: [
      "A. R = m v / (q B)",
      "B. R = q B / (m v)",
      "C. R = q v / (m B)",
      "D. R = m B / (q v²)"
    ],
    correcta: 0,
    explicacion: "Igualando la fuerza magnética centrípeta a la aceleración centrípeta: q v B = m v² / R. Despejando el radio orbital de giro (radio de Larmor o de ciclotrón) se obtiene directamente R = mv / (qB)."
  },
  {
    area: "Electromagnetismo",
    subtema: "Efecto Hall",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué descubrimiento físico crucial permitió realizar el Efecto Hall (descubierto por Edwin Hall en 1879) en conductores y semiconductores?",
    opciones: [
      "A. Permitió medir la velocidad de la luz en el interior de los metales",
      "B. Permitió determinar experimentalmente el signo de la carga eléctrica de los portadores mayoritarios de corriente y su densidad volumétrica",
      "C. Demostró la inexistencia de la masa inercial",
      "D. Validó que los átomos poseen un núcleo denso"
    ],
    correcta: 1,
    explicacion: "Al aplicar un campo magnético perpendicular a una lámina con corriente, la fuerza de Lorentz desvía a los portadores hacia un borde, generando un voltaje transversal (Voltaje Hall V_H). El signo de este voltaje revela si los portadores son electrones negativos o huecos positivos."
  },
  {
    area: "Electromagnetismo",
    subtema: "Ley de Ampère",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "La magnitud del campo magnético B en el interior de un solenoide ideal muy largo con n espiras por unidad de longitud por el que circula una corriente I es:",
    opciones: [
      "A. B = μ₀ n I",
      "B. B = μ₀ I / (2π r)",
      "C. B = μ₀ n² I / 2",
      "D. B = 0"
    ],
    correcta: 0,
    explicacion: "Aplicando la Ley de Ampère a un lazo rectangular cerrado que atraviesa el solenoide: ∮ B · dl = B L = μ₀ (n L) I. Cancelando la longitud L del lazo resulta B = μ₀ n I, un campo extraordinariamente uniforme en todo el interior del solenoide."
  },
  {
    area: "Electromagnetismo",
    subtema: "Ley de Inducción de Faraday",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La Ley de Inducción de Faraday establece que la fuerza electromotriz (fem) inducida en una espira cerrada es directamente proporcional a:",
    opciones: [
      "A. El valor estático constante del flujo magnético",
      "B. La rapidez con la que varía en el tiempo el flujo magnético que atraviesa la espira: E = -dΦ_B / dt",
      "C. La temperatura ambiente del laboratorio",
      "D. La masa total del alambre de la espira"
    ],
    correcta: 1,
    explicacion: "Michael Faraday descubrió en 1831 que solo el cambio temporal en el flujo magnético genera corriente inducida: E = -dΦ_B/dt. Si el flujo es inmenso pero estrictamente constante en el tiempo, la fem inducida es exactamente cero."
  },
  {
    area: "Electromagnetismo",
    subtema: "Ley de Lenz",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "El signo negativo en la ecuación de Faraday-Lenz (E = -dΦ_B / dt) representa físicamente que:",
    opciones: [
      "A. La corriente inducida genera un campo magnético que favorece e incrementa la variación de flujo original",
      "B. La corriente inducida fluye en un sentido tal que su propio campo magnético se opone siempre a la variación del flujo magnético exterior que la produjo",
      "C. La energía electromagnética siempre se destruye en presencia de inductores",
      "D. El potencial eléctrico es siempre negativo en corriente alterna"
    ],
    correcta: 1,
    explicacion: "Heinrich Lenz formuló esta regla en 1834 como un requisito estricto de la Conservación de la Energía. Si la corriente inducida reforzara el cambio de flujo en vez de oponerse a él, el sistema auto-aceleraría indefinidamente creando energía de la nada."
  },
  {
    area: "Electromagnetismo",
    subtema: "Corrientes Parásitas de Foucault",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Cuando una placa gruesa de cobre o aluminio (materiales no ferromagnéticos) oscila entre los polos de un imán potente, se frena casi instantáneamente sin tocar nada. ¿Por qué ocurre esto?",
    opciones: [
      "A. Por la atracción gravitatoria del imán",
      "B. Porque se inducen corrientes de Foucault (Eddy currents) en el metal que, por la Ley de Lenz, crean campos magnéticos opuestos al movimiento, disipando energía mecánica en calor",
      "C. Por la fricción electrostática con el aire",
      "D. Porque el cobre se vuelve superconductor a temperatura ambiente"
    ],
    correcta: 1,
    explicacion: "El movimiento en el gradiente de campo magnético induce lazos de corriente microscópicos cerrados (corrientes parásitas de Foucault) en la masa del conductor. Estas corrientes experimentan fuerzas de Lorentz que frenan el movimiento (freno electromagnético)."
  },
  {
    area: "Electromagnetismo",
    subtema: "Energía en un Inductor",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuánta energía magnética total U se encuentra almacenada en una bobina o inductor con inductancia L por el que circula una corriente estacionaria I?",
    opciones: [
      "A. U = L I",
      "B. U = 1/2 L I²",
      "C. U = 2 L² I",
      "D. U = L / (2 I²)"
    ],
    correcta: 1,
    explicacion: "El trabajo necesario para vencer la fuerza contraelectromotriz autoinducida durante el establecimiento de la corriente es U = ∫ E I dt = ∫ L (dI/dt) I dt = L ∫ I dI = 1/2 L I². Esta energía reside almacenada en el campo magnético del inductor."
  },
  {
    area: "Electromagnetismo",
    subtema: "Resonancia RLC",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En un circuito RLC conectado en serie a un generador de corriente alterna, la resonancia eléctrica ocurre a la frecuencia angular ω₀ igual a:",
    opciones: [
      "A. ω₀ = 1 / √(L C)",
      "B. ω₀ = √(L / C)",
      "C. ω₀ = R / (L C)",
      "D. ω₀ = 2π L C"
    ],
    correcta: 0,
    explicacion: "En resonancia, la reactancia inductiva se cancela con la reactancia capacitiva (X_L = X_C ⟹ ωL = 1/(ωC)), lo que implica ω₀ = 1/√(LC). En este punto la impedancia total del circuito es mínima y puramente resistiva (Z = R), maximizando la corriente."
  },
  {
    area: "Electromagnetismo",
    subtema: "Corriente de Desplazamiento",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "¿Qué término fundamental introdujo James Clerk Maxwell en la Ley de Ampère para resolver la inconsistencia durante la carga de un condensador y predecir las ondas electromagnéticas?",
    opciones: [
      "A. El término de resistividad cuántica de Hall",
      "B. La Corriente de Desplazamiento: I_d = ε₀ (dΦ_E / dt), demostrando que un campo eléctrico variable en el tiempo genera un campo magnético",
      "C. La constante cosmológica de Einstein",
      "D. El potencial escalar retardado de Liénard-Wiechert"
    ],
    correcta: 1,
    explicacion: "Maxwell advirtió que la ley de Ampère clásica violaba la continuidad de la carga en un circuito con condensador abierto. Al añadir la corriente de desplazamiento (ε₀ dΦ_E/dt), completó la simetría: campos magnéticos variables generan campos eléctricos y viceversa, naciendo la teoría de las ondas EM."
  },
  {
    area: "Electromagnetismo",
    subtema: "Vector de Poynting",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El Vector de Poynting S = (1/μ₀) (E × B) describe en el electromagnetismo clásico:",
    opciones: [
      "A. La densidad volumétrica de carga electrostática libre",
      "B. La densidad de flujo de potencia (energía electromagnética por unidad de tiempo y por unidad de área) transportada por la onda",
      "C. La fuerza gravitatoria neta de un fotón",
      "D. El momento de inercia de las líneas de inducción"
    ],
    correcta: 1,
    explicacion: "El vector de Poynting representa la dirección y magnitud del flujo de energía por unidad de área (W/m²) transportada por los campos electromagnéticos. Su promedio temporal determina la irradiancia o intensidad de una onda luminosa o de radio."
  },
  {
    area: "Electromagnetismo",
    subtema: "Materiales Ferromagnéticos",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Por encima de la llamada 'Temperatura de Curie' (Tc), un material ferromagnético como el hierro metálico:",
    opciones: [
      "A. Se convierte espontáneamente en superconductor",
      "B. Pierde permanentemente su magnetización espontánea y se transforma en un material paramagnético ordinario",
      "C. Expulsa completamente todas las líneas de campo eléctrico",
      "D. Se desintegra radiactivamente por fisión nuclear"
    ],
    correcta: 1,
    explicacion: "Por encima de Tc (para el hierro ~770 °C o 1043 K), la agitación térmica supera la energía de acoplamiento de canje cuántico que alinea los momentos magnéticos en los dominios de Weiss, destruyendo el ferromagnetismo macroscópico."
  },
  {
    area: "Electromagnetismo",
    subtema: "Transformador Eléctrico",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Un transformador ideal con 100 espiras en el devanado primario y 1000 espiras en el secundario se conecta a una red AC de 120 V. ¿Cuál es el voltaje y la relación de corriente en el secundario?",
    opciones: [
      "A. 12 V, con corriente 10 veces mayor",
      "B. 1200 V, con corriente 10 veces menor que en el primario",
      "C. 120 V, sin variación alguna",
      "D. 2400 V, con igual corriente"
    ],
    correcta: 1,
    explicacion: "Por la relación del transformador V₂/V₁ = N₂/N₁ = 1000/100 = 10, por lo que V₂ = 10 × 120 V = 1200 V. Al ser ideal (potencia conservada P = V₁ I₁ = V₂ I₂), la corriente en el secundario debe reducirse a la décima parte (I₂ = I₁/10)."
  },
  {
    area: "Electromagnetismo",
    subtema: "Voltaje RMS",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "La toma de corriente domiciliaria suministra corriente alterna senoidal con un valor eficaz de 120 V RMS. ¿Cuál es aproximadamente el voltaje pico (máximo) de la onda?",
    opciones: [
      "A. 120 V",
      "B. 170 V (V_pico = V_rms · √2)",
      "C. 240 V",
      "D. 85 V"
    ],
    correcta: 1,
    explicacion: "Para una señal senoidal pura, el valor cuadrático medio (RMS) es V_rms = V_pico / √2. Despejando el pico máximo: V_pico = 120 V × √2 ≈ 120 × 1.4142 ≈ 170 V. La tensión oscila continuamente entre +170 V y -170 V."
  },
  {
    area: "Electromagnetismo",
    subtema: "Puente de Wheatstone",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿En qué condición de equilibrio el galvanómetro de un Puente de Wheatstone clásico marca exactamente cero corriente?",
    opciones: [
      "A. Cuando todas las resistencias son nulas",
      "B. Cuando los productos cruzados de las resistencias de sus ramas opuestas son iguales (R₁ · R₄ = R₂ · R₃)",
      "C. Cuando la batería se agota por completo",
      "D. Cuando la inductancia es infinita"
    ],
    correcta: 1,
    explicacion: "El puente está balanceado cuando el potencial en los dos nodos intermedios se iguala (ΔV = 0), lo que ocurre cuando la relación de divisor de tensión es idéntica en ambas ramas: R₁/R₂ = R₃/R₄, es decir, R₁ R₄ = R₂ R₃."
  },
  {
    area: "Electromagnetismo",
    subtema: "Dipolos Eléctricos",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "A distancias r muy grandes comparadas con la separación d entre cargas, el potencial eléctrico V generado por un dipolo eléctrico puntual decae espacialmente como:",
    opciones: [
      "A. 1 / r",
      "B. 1 / r²",
      "C. 1 / r³",
      "D. ln(r)"
    ],
    correcta: 1,
    explicacion: "Para una carga puntual aislada V ∝ 1/r. Sin embargo, en un dipolo las dos cargas opuestas casi se cancelan a gran distancia; la aproximación dipolar demuestra que su potencial decae más rápidamente: V(r) = (1 / 4πε₀) (p · r̂ / r²), y su campo eléctrico E ∝ 1/r³."
  },
  {
    area: "Electromagnetismo",
    subtema: "Efecto Corona y Puntas",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Por qué los pararrayos y conductores cargados a alto potencial rematan siempre en una punta metálica afilada?",
    opciones: [
      "A. Porque el radio de curvatura extremadamente pequeño en la punta intensifica exponencialmente la densidad superficial de carga y el campo eléctrico exterior (E ∝ 1/R), facilitando la ionización del aire",
      "B. Porque las puntas pesan menos",
      "C. Para evitar que las aves se posen sobre el edificio",
      "D. Porque los electrones prefieren viajar en línea recta"
    ],
    correcta: 0,
    explicacion: "En un conductor en equilibrio a potencial V constante, la densidad superficial de carga σ y el campo eléctrico en la superficie son inversamente proporcionales al radio de curvatura local: E = σ/ε₀ ∝ V/R. En una punta afilada (R muy pequeño), el campo supera la rigidez dieléctrica del aire."
  },
  {
    area: "Electromagnetismo",
    subtema: "Momento Magnético Orbital",
    nivel: 4,
    dificultad: "Experto",
    pregunta: "El Magnetón de Bohr (μ_B = e ħ / (2 m_e)) representa en física cuántica y atómica:",
    opciones: [
      "A. La unidad natural del momento dipolar magnético de un electrón debido a su momento angular orbital o intrínseco",
      "B. La velocidad máxima que puede alcanzar un protón en un acelerador",
      "C. La frecuencia de resonancia nuclear del agua pesada",
      "D. La masa del neutrino electrónico"
    ],
    correcta: 0,
    explicacion: "El magnetón de Bohr μ_B ≈ 9.274 × 10⁻²⁴ J/T es la constante física fundamental que cuantifica la escala elemental del momento magnético asociado a los electrones en átomos, crucial en espectroscopía y efecto Zeeman."
  },
  {
    area: "Electromagnetismo",
    subtema: "Monopolos Magnéticos",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "La Segunda Ecuación de Maxwell, formulada matemáticamente como ∇ · B = 0 (o ∮ B · dA = 0 sobre toda superficie cerrada), postula físicamente que:",
    opciones: [
      "A. Los campos magnéticos no tienen energía propia",
      "B. No existen monopolos magnéticos aislados en la naturaleza: las líneas de campo magnético son siempre curvas cerradas continuas",
      "C. La velocidad de la luz en el vacío es infinita",
      "D. El campo magnético se anula en todos los imanes de neodimio"
    ],
    correcta: 1,
    explicacion: "Si cortas un imán por la mitad, no obtienes un polo norte y un polo sur separados, sino dos imanes bipolares completos. Al ser la divergencia de B estrictamente nula, las líneas de inducción magnética no tienen principio ni fin."
  },
  {
    area: "Electromagnetismo",
    subtema: "Impedancia Eléctrica",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Cómo se define la impedancia compleja Z en un circuito de corriente alterna lineal?",
    opciones: [
      "A. Como el producto de la potencia activa por el coseno de fi",
      "B. Como la relación fasorial compleja entre la tensión fasorial V y la corriente fasorial I: Z = R + j(X_L - X_C)",
      "C. Como la suma simple de resistencias dividida por el tiempo",
      "D. Como la energía térmica disipada por ciclo"
    ],
    correcta: 1,
    explicacion: "La impedancia Z generaliza la ley de Ohm en régimen senoidal permanente incorporando tanto la oposición disipativa al paso de corriente (resistencia pura R) como la oposición por almacenamiento reactivo de energía en campos (reactancia X = ωL - 1/(ωC))."
  },
  {
    area: "Electromagnetismo",
    subtema: "Espectro Electromagnético",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "¿Cuál es el orden correcto de menor a mayor frecuencia (o equivalentemente de mayor a menor longitud de onda) en el espectro electromagnético?",
    opciones: [
      "A. Rayos Gamma, Rayos X, Luz Visible, Microondas, Ondas de Radio",
      "B. Ondas de Radio, Microondas, Infrarrojo, Luz Visible, Ultravioleta, Rayos X, Rayos Gamma",
      "C. Luz Visible, Ultravioleta, Microondas, Rayos X, Rayos Gamma",
      "D. Ondas de Radio, Luz Visible, Infrarrojo, Rayos Gamma"
    ],
    correcta: 1,
    explicacion: "A medida que aumenta la frecuencia (f = c/λ), la energía cuántica del fotón (E = hf) crece: Radio (km a cm) → Microondas (cm a mm) → Infrarrojo → Visible (380-750 nm) → Ultravioleta → Rayos X → Rayos Gamma (longitudes subatómicas picométricas)."
  },

  // --- ONDAS, ACÚSTICA Y ÓPTICA (25 preguntas) ---
  {
    area: "Óptica y Fotónica",
    subtema: "Ley de Snell",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "Un rayo de luz pasa desde el aire (índice n₁ ≈ 1.00) hacia un bloque de vidrio (índice n₂ ≈ 1.50) con un ángulo de incidencia θ₁ respecto a la normal. ¿Qué ocurre con la trayectoria del rayo refractado dentro del vidrio?",
    opciones: [
      "A. Se desvía alejándose de la normal (θ₂ > θ₁)",
      "B. Se desvía acercándose a la línea normal a la superficie (θ₂ < θ₁)",
      "C. Continúa en línea recta sin sufrir desviación angular alguna",
      "D. Se refleja de regreso al aire en un 100% como un espejo perfecto"
    ],
    correcta: 1,
    explicacion: "Por la Ley de Snell: n₁ senθ₁ = n₂ senθ₂. Dado que el vidrio es ópticamente más denso (n₂ > n₁), para mantener la igualdad el seno del ángulo debe ser menor: senθ₂ < senθ₁, lo que significa que el rayo se quiebra acercándose hacia la normal."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Reflexión Total Interna",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Bajo qué condiciones precisas puede ocurrir el fenómeno de Reflexión Total Interna, principio sobre el cual operan las fibras ópticas de telecomunicaciones?",
    opciones: [
      "A. La luz debe viajar de un medio de menor índice a uno de mayor índice a cualquier ángulo",
      "B. La luz debe propagarse desde un medio de mayor índice de refracción hacia uno de menor índice (n₁ > n₂) e incidir a un ángulo estrictamente superior al ángulo crítico (θ₁ > θ_c = arcsen(n₂/n₁))",
      "C. Solo ocurre cuando la luz es coherente monocromática láser",
      "D. Exige temperaturas cercanas al cero absoluto"
    ],
    correcta: 1,
    explicacion: "Al pasar a un medio menos refringente, el rayo se aleja de la normal. Al alcanzar el ángulo crítico θ_c, el ángulo de refracción es 90°. Para cualquier ángulo de incidencia superior a θ_c, no existe onda refractada transmitida y el 100% de la energía luminosa se refleja internamente sin pérdidas."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Rapidez del Sonido",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "¿En cuál de los siguientes medios materiales la velocidad de propagación de las ondas sonoras acústicas es sustancialmente mayor?",
    opciones: [
      "A. En el aire seco a 20 °C (~343 m/s)",
      "B. En el agua líquida (~1480 m/s)",
      "C. En una barra sólida de acero (~5000 a 5900 m/s)",
      "D. En el vacío interestelar"
    ],
    correcta: 2,
    explicacion: "La velocidad del sonido en sólidos viene dada por v = √(E / ρ), donde E es el módulo de elasticidad de Young. Aunque el acero es más denso que el agua y el aire, su rigidez elástica interatómica es descomunal, permitiendo propagar ondas elásticas a casi 6 km por segundo."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Efecto Doppler Acústico",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Una ambulancia con la sirena encendida se acerca velozmente a un peatón estacionado en la acera. El peatón percibe un tono acústico:",
    opciones: [
      "A. De mayor frecuencia (más agudo) que el emitido originalmente en reposo",
      "B. De menor frecuencia (más grave)",
      "C. Con idéntica frecuencia pero mayor longitud de onda",
      "D. Inaudible debido a la interferencia destructiva de las ondas"
    ],
    correcta: 0,
    explicacion: "Al desplazarse la fuente emisora hacia el observador, los frentes de onda sucesivos se comprimen espacialmente frente al vehículo (menor longitud de onda aparente λ'). Al llegar con menor separación temporal al oído receptor, la frecuencia percibida f' = v / λ' resulta más alta (más aguda)."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Decibeles y Nivel Sonoro",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Si la intensidad física de una onda sonora se multiplica por un factor de 10 (por ejemplo de 10⁻⁵ W/m² a 10⁻⁴ W/m²), ¿en cuántos decibeles (dB) aumenta el nivel de intensidad sonora percibido?",
    opciones: [
      "A. En 1 dB",
      "B. En 10 dB",
      "C. En 100 dB",
      "D. En 2 dB"
    ],
    correcta: 1,
    explicacion: "La escala de decibeles es logarítmica: β = 10 log₁₀(I / I₀). Un incremento de un factor de 10 en la intensidad corresponde a Δβ = 10 log₁₀(10) = 10 × 1 = +10 dB. Un factor de 100 representaría +20 dB."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Batimientos Acústicos",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Si se hacen sonar simultáneamente dos diapasones que vibran a frecuencias ligeramente distintas de 440 Hz y 444 Hz, ¿cuál es la frecuencia de las pulsaciones o batimientos perceptibles en el sonido combinado?",
    opciones: [
      "A. 884 Hz",
      "B. 442 Hz",
      "C. 4 Hz (f_batido = |f₁ - f₂|)",
      "D. 1760 Hz"
    ],
    correcta: 2,
    explicacion: "La interferencia de dos ondas de igual amplitud y frecuencias muy próximas modula la amplitud total resultante con una envolvente periódica cuya frecuencia de batimiento es exactamente la diferencia de frecuencias: f_batido = |444 Hz - 440 Hz| = 4 Hz (cuatro pulsaciones por segundo)."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Ondas Estacionarias",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En una onda estacionaria formada en una cuerda tensa con extremos fijos, la distancia física entre dos nodos adyacentes consecutivos equivale a:",
    opciones: [
      "A. Una longitud de onda completa (λ)",
      "B. Media longitud de onda (λ / 2)",
      "C. Un cuarto de longitud de onda (λ / 4)",
      "D. Dos longitudes de onda (2λ)"
    ],
    correcta: 1,
    explicacion: "En una onda estacionaria descrita por y = 2A sen(kx) cos(ωt), los nodos son los puntos de amplitud nula donde sen(kx) = 0, lo cual ocurre para kx = nπ. Como k = 2π/λ, resulta x_n = n (λ/2). Por tanto, la separación espacial entre dos nodos contiguos es exactamente λ/2."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Tubos Sonoros Cerrados",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Un tubo sonoro de longitud L cerrado en uno de sus extremos y abierto en el otro solo puede generar resonancias acústicas correspondientes a:",
    opciones: [
      "A. Todos los armónicos enteros pares e impares (n = 1, 2, 3, 4...)",
      "B. Exclusivamente armónicos impares (n = 1, 3, 5, 7...), con frecuencias f_n = n v / (4L)",
      "C. Exclusivamente armónicos pares (n = 2, 4, 6...)",
      "D. Una única frecuencia fundamental invariable"
    ],
    correcta: 1,
    explicacion: "El extremo cerrado impone un nodo de desplazamiento para las moléculas de aire, mientras que el extremo abierto exige un antinodo. La longitud del tubo debe albergar un número impar de cuartos de onda: L = n (λ/4) con n = 1, 3, 5..., originando f_n = nv / (4L)."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Experimento de Young",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "En el célebre experimento de la doble rendija realizado por Thomas Young en 1801, la aparición de un patrón alternado de franjas brillantes y oscuras sobre una pantalla distante demostró de manera concluyente:",
    opciones: [
      "A. La naturaleza corpuscular newtoniana de los fotones",
      "B. La naturaleza ondulatoria de la luz y el principio de interferencia coherente",
      "C. La velocidad finita de la gravedad",
      "D. La existencia del electrón"
    ],
    correcta: 1,
    explicacion: "Young demostró que la luz experimenta interferencia constructiva (franjas brillantes donde la diferencia de camino óptico es d senθ = mλ) e interferencia destructiva (franjas oscuras donde d senθ = (m + 1/2)λ), una propiedad exclusiva e inconfundible de los fenómenos ondulatorios."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Difracción de Fraunhofer",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En el patrón de difracción de Fraunhofer generado por una única rendija delgada de ancho 'a' iluminada por luz monocromática de longitud de onda λ, los mínimos de intensidad (franjas oscuras) ocurren en ángulos que satisfacen:",
    opciones: [
      "A. a sen θ = m λ (con m = ±1, ±2, ±3...)",
      "B. a sen θ = (m + 1/2) λ",
      "C. a cos θ = m λ",
      "D. sen θ = m λ / (2a)"
    ],
    correcta: 0,
    explicacion: "Dividiendo la rendija en parejas de mitades cuyos rayos interfieren destructivamente con diferencia de camino de λ/2, la condición para cancelación total de amplitud integrada en la rendija resulta en a senθ = mλ para todo entero m ≠ 0."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Criterio de Rayleigh",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "El Criterio de Resolución de Lord Rayleigh establece que dos fuentes luminosas puntuales se consideran apenas resueltas por un telescopio o microscopio circular de diámetro D cuando:",
    opciones: [
      "A. Sus imágenes no se tocan en absoluto",
      "B. El máximo central de difracción (disco de Airy) de una de las fuentes coincide exactamente con el primer mínimo de difracción de la otra: θ_min ≈ 1.22 λ / D",
      "C. La distancia focal de la lente es igual a la longitud de onda de la luz",
      "D. Se utiliza luz ultravioleta con polarización circular"
    ],
    correcta: 1,
    explicacion: "Debido a la difracción por la apertura circular de diámetro D, la imagen de un punto es un patrón de Airy. Rayleigh estableció el límite práctico de resolución cuando la cresta central de una fuente cae sobre el primer valle oscuro de la otra: θ_min = 1.22 λ/D."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Ley de Malus",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "La Ley de Malus determina que cuando un haz de luz polarizada linealmente con intensidad inicial I₀ incide sobre un filtro polarizador cuyo eje de transmisión forma un ángulo θ con la dirección de polarización, la intensidad transmitida es:",
    opciones: [
      "A. I = I₀ cos(θ)",
      "B. I = I₀ cos²(θ)",
      "C. I = I₀ sen²(θ)",
      "D. I = I₀ tan(θ)"
    ],
    correcta: 1,
    explicacion: "Solo la componente del campo eléctrico paralela al eje de transmisión atraviesa el polarizador: E_trans = E₀ cosθ. Como la intensidad de una onda electromagnética es proporcional al cuadrado de la amplitud del campo eléctrico (I ∝ E²), resulta I = I₀ cos²θ."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Ángulo de Brewster",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "¿Qué propiedad óptica singular ocurre cuando un rayo de luz incide desde el aire (n₁) sobre la superficie de un dieléctrico transparente (n₂) en el Ángulo de Brewster (o ángulo de polarización) tan θ_B = n₂ / n₁?",
    opciones: [
      "A. Toda la luz incidente se absorbe y se transforma en calor",
      "B. La luz reflejada resulta 100% polarizada linealmente en el plano perpendicular al plano de incidencia, y el rayo reflejado forma 90° con el refractado",
      "C. La velocidad de la luz en el segundo medio se acelera superando a c",
      "D. Se anula la refracción"
    ],
    correcta: 1,
    explicacion: "En θ_B, el rayo reflejado y el transmitido forman un ángulo recto exacto de 90°. Los dipolos oscilantes del medio alineados en el plano de incidencia no pueden emitir radiación a lo largo de su eje oscilatorio hacia la dirección reflejada, quedando la reflexión polarizada pura."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Dispersión de Rayleigh",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Por qué el cielo diurno en la Tierra se ve predominantemente de color azul y los atardeceres se aprecian rojizos?",
    opciones: [
      "A. Por la emisión de luz fosforescente por parte del gas ozono",
      "B. Por la Dispersión de Rayleigh en las moléculas atmosféricas (N₂ y O₂): la intensidad dispersada es inversamente proporcional a la cuarta potencia de la longitud de onda (I ∝ 1/λ⁴), dispersándose mucho más el azul que el rojo",
      "C. Porque los océanos reflejan su color sobre las nubes altas",
      "D. Por el efecto Doppler relativista del movimiento de rotación de la Tierra"
    ],
    correcta: 1,
    explicacion: "Al ser el tamaño de las moléculas muy inferior a la longitud de onda luminosa, la dispersión elástica sigue la ley I ∝ 1/λ⁴. La luz azul (λ ≈ 400 nm) se dispersa unas 10 veces más que la roja (λ ≈ 700 nm). En el atardecer, la luz atraviesa una capa atmosférica muy gruesa y los tonos azules se dispersan fuera de la línea de visión."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Lentes Delgadas",
    nivel: 1,
    dificultad: "Básico",
    pregunta: "La ecuación fundamental de Gauss para lentes delgadas es 1/f = 1/d_o + 1/d_i. Si un objeto real se coloca a una distancia d_o que es exactamente el doble de la distancia focal de una lente convergente (d_o = 2f), la imagen formada es:",
    opciones: [
      "A. Virtual, derecha y de mayor tamaño",
      "B. Real, invertida y de exactamente el mismo tamaño que el objeto (aumento lateral m = -1), ubicada a d_i = 2f",
      "C. Enfocada en el infinito con tamaño infinito",
      "D. Se forma en el foco principal f con tamaño nulo"
    ],
    correcta: 1,
    explicacion: "Aplicando la fórmula: 1/d_i = 1/f - 1/(2f) = 1/(2f), lo que da d_i = 2f. El aumento lateral es m = -d_i / d_o = -(2f)/(2f) = -1. La imagen es real, invertida y tiene idéntica altura que el objeto original."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Espejos Esféricos",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cuál es la característica invariable de las imágenes formadas por un espejo esférico convexo para cualquier posición real de un objeto situado frente a él?",
    opciones: [
      "A. Son siempre imágenes virtuales, derechas y de menor tamaño que el objeto",
      "B. Son siempre reales, invertidas y aumentadas",
      "C. Cambian de reales a virtuales al cruzar el foco",
      "D. Son siempre de igual tamaño y se proyectan sobre una pantalla real"
    ],
    correcta: 0,
    explicacion: "Un espejo convexo tiene distancia focal virtual negativa (f < 0). La ecuación de los espejos sitúa la imagen siempre detrás del espejo (d_i < 0, imagen virtual), con orientación derecha y aumento |m| < 1 (reducida), lo que proporciona un gran campo visual (espejos retrovisores y de seguridad)."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Dispersión Cromática en Prismas",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "Cuando un haz de luz blanca natural atraviesa un prisma triangular de vidrio transparente, ¿cuál de los colores del espectro visible sufre el mayor ángulo de desviación angular respecto a la trayectoria original?",
    opciones: [
      "A. El color rojo",
      "B. El color verde",
      "C. El color violeta",
      "D. Todos los colores se desvían exactamente el mismo ángulo"
    ],
    correcta: 2,
    explicacion: "En medios dispersivos ordinarios (dispersión normal), el índice de refracción n aumenta a medida que disminuye la longitud de onda: n_violeta > n_rojo. Por la Ley de Snell, a mayor índice de refracción corresponde mayor quiebre, desviándose el violeta más que ningún otro color visible."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Redes de Difracción",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Una red de difracción plana con espaciado entre rendijas 'd' iluminada con luz de longitud de onda λ forma máximos principales agudos en ángulos θ que cumplen:",
    opciones: [
      "A. d sen θ = m λ (donde m = 0, ±1, ±2... es el orden espectral)",
      "B. d cos θ = m λ / 2",
      "C. d tan θ = λ² / m",
      "D. sen θ = m / (d λ)"
    ],
    correcta: 0,
    explicacion: "La superposición constructiva de cientos o miles de rendijas periódicas exige que la diferencia de camino óptico entre rendijas consecutivas sea un múltiplo entero de longitudes de onda: d senθ = mλ. Las redes permiten separar líneas espectrales con una resolución inalcanzable para prismas."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Aberración Cromática",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Por qué los espejos astronómicos cóncavos (como los de los telescopios reflectores tipo Newton) están intrínsecamente libres de aberración cromática, a diferencia de las lentes astronómicas de vidrio?",
    opciones: [
      "A. Porque los espejos tienen masa infinita",
      "B. Porque la Ley de la Reflexión (ángulo de incidencia = ángulo de reflexión) es estrictamente independiente de la longitud de onda de la luz, mientras que la refracción en lentes depende del índice de refracción variable con el color",
      "C. Porque el aluminio refleja solo la luz infrarroja",
      "D. Porque los espejos anulan la difracción"
    ],
    correcta: 1,
    explicacion: "En la reflexión todos los colores rebotan con el mismo ángulo (θ_r = θ_i), convergiendo en un foco común. En las lentes refractivas, la dispersión del vidrio hace que cada color tenga una distancia focal distinta, generando halos coloreados borrosos (aberración cromática)."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Ondas Sísmicas P y S",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "En geofísica y sismología, ¿cuál es la diferencia fundamental de propagación entre las ondas sísmicas primarias (P) y las secundarias (S)?",
    opciones: [
      "A. Las ondas P son gravitatorias y las S son electromagnéticas",
      "B. Las ondas P son longitudinales (compresión) y viajan por sólidos, líquidos y gases; las ondas S son transversales (corte o cizalladura) y no pueden propagarse a través de fluidos líquidos",
      "C. Las ondas S viajan al doble de velocidad que las ondas P",
      "D. Ambas son ondas electromagnéticas polarizadas circularmente"
    ],
    correcta: 1,
    explicacion: "Los fluidos no ofrecen resistencia elástica a la deformación por corte o cizalladura (su módulo de cizalla G es nulo). Como las ondas S son ondas de corte transversales puras, no pueden atravesar fluidos líquidos, lo que demostró que el núcleo externo de la Tierra es líquido."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Efecto Mach y Ondas de Choque",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Cuando un avión supersónico vuela a una velocidad superior a la del sonido en el aire (v > v_s), los frentes de onda de presión se acumulan formando una superficie cónica de choque cuyo semiángulo de apertura μ satisface:",
    opciones: [
      "A. sen μ = v_s / v = 1 / M (donde M es el Número de Mach)",
      "B. tan μ = M",
      "C. cos μ = 1 / M²",
      "D. sen μ = M"
    ],
    correcta: 0,
    explicacion: "En régimen supersónico, el objeto deja atrás sus propias ondas esféricas de sonido. La envolvente tangencial a las ondas esferoidales forma el Cono de Mach, cuyo semiángulo es senμ = v_sonido / v_avion = 1/Mach. Al cruzar el suelo, este frente genera el estampido sónico."
  },
  {
    area: "Oscilaciones y Ondas",
    subtema: "Velocidad de Ondas en Cuerdas",
    nivel: 2,
    dificultad: "Intermedio",
    pregunta: "¿Cómo varía la velocidad de propagación v de una onda transversal en una cuerda tensa si se cuadruplica la tensión mecánica T aplicada a la misma?",
    opciones: [
      "A. Se mantiene constante",
      "B. Se duplica (v₂ = 2 v₁)",
      "C. Se cuadruplica",
      "D. Se reduce a la mitad"
    ],
    correcta: 1,
    explicacion: "La fórmula de Taylor para ondas transversales en cuerdas es v = √(T / μ), donde μ es la densidad lineal de masa. Al ser v proporcional a la raíz cuadrada de la tensión T, cuadruplicar la tensión hace que la velocidad se multiplique por √4 = 2."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Interferometría de Michelson",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "El Interferómetro de Michelson divide la amplitud de un haz luminoso mediante un espejo semitransparente divisor de haz (beam splitter). Es capaz de detectar desplazamientos de sus espejos con una precisión del orden de:",
    opciones: [
      "A. Varios milímetros",
      "B. Fracciones de la longitud de onda de la luz utilizada (nanómetros)",
      "C. La masa del observador",
      "D. Solo mediciones acústicas macroscópicas"
    ],
    correcta: 1,
    explicacion: "Al recombinar los dos haces perpendiculares en el divisor, el corrimiento de una sola franja de interferencia en el patrón corresponde a un desplazamiento del espejo móvil de apenas λ/2 (pocos cientos de nanómetros), base del experimento Michelson-Morley y de los detectores LIGO."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Láser y Emisión Estimulada",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "El acrónimo LÁSER ('Light Amplification by Stimulated Emission of Radiation') se fundamenta en el proceso físico cuántico postulado por Albert Einstein en 1917 consistente en:",
    opciones: [
      "A. La fisión térmica de los fotones incidentes",
      "B. Un fotón incidente induce la desexcitación de un átomo previamente excitado, emitiendo un segundo fotón con idéntica frecuencia, fase, dirección de propagación y polarización que el original",
      "C. La reflexión difusa de luz solar sobre espejos planos",
      "D. La recombinación termonuclear de iones"
    ],
    correcta: 1,
    explicacion: "A diferencia de la emisión espontánea donde los fotones salen en direcciones y fases al azar, en la emisión estimulada el fotón interactuante estimula la emisión de una réplica cuántica idéntica y coherente, logrando la amplificación óptica cuando existe inversión de población."
  },
  {
    area: "Óptica y Fotónica",
    subtema: "Polarización por Dispersión",
    nivel: 3,
    dificultad: "Avanzado",
    pregunta: "Si se observa la luz azul del cielo despejado en un ángulo de 90° respecto a la posición del Sol utilizando una lámina polarizadora:",
    opciones: [
      "A. La luz del cielo no muestra polarización alguna",
      "B. Se comprueba que la luz dispersada a 90° está fuertemente polarizada linealmente en el plano perpendicular al plano de dispersión Sol-observador",
      "C. Se extingue por completo la velocidad de la luz",
      "D. La luz se transforma en rayos gamma"
    ],
    correcta: 1,
    explicacion: "Los dipolos inducidos en las moléculas de aire oscilan en el plano perpendicular al rayo solar original. Vistos a 90°, el observador solo ve la radiación transversal a la oscilación dipolar, observando luz con un altísimo grado de polarización lineal."
  }
];
