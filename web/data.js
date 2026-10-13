// Base de datos de Cursos, Cómics, Podcasts y Configuración para la plataforma
window.PLATFORM_DATA = {
    profesor: {
        nombre: "Mg. Manuel Alejandro Obando",
        titulo: "Ingeniero Físico · M.Sc. en Física de Materiales · Especialista en IA (en curso)",
        institucion: "Departamento de Física · Universidad del Cauca",
        pregrado: "Ingeniero Físico — Universidad del Cauca",
        maestria: "Maestría en Ciencias (Énfasis en Física de Materiales) — Universidad Federal de Ouro Preto (UFOP, Brasil)",
        especializacion: "Especialización en Inteligencia Artificial — Universidad Internacional de La Rioja (UNIR)",
        cargo: "Docente del Departamento de Física — Universidad del Cauca",
        bio: "Ingeniero Físico graduado de la Universidad del Cauca, con maestría en Ciencias con énfasis en Física de Materiales por la Universidad Federal de Ouro Preto (Brasil) y actualmente cursando la especialización en Inteligencia Artificial en la UNIR. Apasionado por la divulgación científica y por desarrollar nuevas herramientas tecnológicas e interactivas para enseñar y democratizar la física. Además, soy jugador y entrenador de squash; en esta plataforma he integrado un espacio dedicado para los amantes de este deporte, donde exploramos la ciencia, la biomecánica articular y las leyes físicas que rigen cada movimiento en la cancha.",
        mision: "Transformar la enseñanza de la física a través de laboratorios virtuales matemáticamente rigurosos, cuadernos computacionales interactivos, ciencia del deporte y divulgación científica abierta creada por los propios estudiantes.",
        redes: {
            instagram: "https://www.instagram.com/manu_squash/",
            instagramUser: "@manu_squash",
            linkedin: "https://www.linkedin.com/in/manuel-alejandro-obando/",
            linkedinUser: "manuel-alejandro-obando",
            email: "manuelobando@unicauca.edu.co"
        },
        hotmartUser: "@manuel_obando_963654"
    },
    
    // Claves privadas que el docente entrega a sus alumnos en el aula para desbloquear los cursos
    // (Puedes modificar, agregar o cambiar estas claves cuando comience un nuevo semestre)
    codigosEstudiantilesValidos: [
        "UNICAUCA-FISICA-2026",
        "OBANDO-AULA-2026",
        "ELECTRO-FIET-2026",
        "AMBIENTAL-UNICA-26"
    ],

    cursos: [
        {
            id: "mecanica",
            titulo: "Cuaderno Interactivo de Mecánica Clásica",
            nivel: "Universitario / Preuniversitario",
            modulos: "18 Capítulos Interactivos + Formulario",
            categoria: "Física Fundamental",
            descripcion: "Suite computacional completa que cubre desde medición y cálculo vectorial hasta fluidos, ondas y sonido. Incluye motores de física en tiempo real para experimentar con cada ecuación.",
            temas: [
                "01. Medición y Conversiones", "02. Vectores y Álgebra", "03. Movimiento en 1D",
                "04. Movimiento en 2D (Tiro Parabólico)", "05. Leyes de Newton", "06. Aplicaciones de Dinámica",
                "07. Trabajo Mecánico", "08. Conservación de la Energía", "09. Momento Lineal y Colisiones",
                "10. Cinemática Rotacional", "11. Torque y Dinámica Rotacional", "12. Momento Angular",
                "13. Equilibrio Estático", "14. Gravitación Universal", "15. Mecánica de Fluidos",
                "16. Oscilaciones y M.A.S.", "17. Ondas Mecánicas", "18. Física del Sonido"
            ],
            destacado: true,
            tipo: "Cuaderno Interactivo HTML5/JS",
            demoPath: "/material/1_cursos/mecanica/dist/index.html",
            precioEstimado: "$29 USD (~$115.000 COP)",
            valorReal: "$49 USD",
            descuentoTag: "40% OFF Lanzamiento",
            enlaceCompra: "https://hotmart.com" // Placeholder para el link de Hotmart
        },
        {
            id: "transformadores",
            titulo: "Laboratorio de Transformadores",
            nivel: "Ingeniería / Tecnología Eléctrica",
            modulos: "Banco Libre con 24 Kits Calibrados",
            categoria: "Laboratorio Virtual",
            descripcion: "Entorno de laboratorio virtual de alta precisión con cableado libre y equipos de medición reales. Modela saturación del núcleo (Steinmetz), armónicos, cálculo de reluctancia, osciloscopio digital, multímetros de 6000 cuentas y preinformes autocalificados.",
            temas: [
                "Ensayos de resistencia de devanados (R)", "Ensayos de vacío (A y B)",
                "Ensayos de cortocircuito (C)", "Pruebas con carga inductiva/resistiva (D)",
                "Determinación de polaridad (E)", "Ajuste por mínimos cuadrados e incertidumbres",
                "Generación automática de diapositivas y bitácora de laboratorio"
            ],
            destacado: true,
            tipo: "Laboratorio Virtual de Ingeniería",
            esLaboratorio: true,
            demoPath: "/material/1_cursos/transformadores/dist/Transformadores_Laboratorio.html",
            precioEstimado: "$39 USD (~$155.000 COP)",
            valorReal: "$89 USD",
            descuentoTag: "Laboratorio Insignia",
            enlaceCompra: "https://hotmart.com"
        },
        {
            id: "electromagnetismo",
            titulo: "Atlas Interactivo de Electromagnetismo",
            nivel: "Universitario / Ingeniería",
            modulos: "Campos, Flujo y Leyes de Maxwell",
            categoria: "Electromagnetismo",
            descripcion: "Entorno interactivo para la visualización de líneas de fuerza, potencial eléctrico, inducción de Faraday y ondas electromagnéticas.",
            temas: [
                "Ley de Coulomb y Campo Eléctrico", "Ley de Gauss y Superficies",
                "Potencial Eléctrico y Gradiente", "Leyes de Biot-Savart y Ampère",
                "Inducción de Faraday y Lenz", "Ecuaciones de Maxwell"
            ],
            destacado: true,
            tipo: "Atlas Interactivo Computacional",
            demoPath: "/material/1_cursos/electromagnetismo/dist/index.html",
            precioEstimado: "$29 USD (~$115.000 COP)",
            valorReal: "$49 USD",
            descuentoTag: "40% OFF Lanzamiento",
            enlaceCompra: "https://hotmart.com"
        },
        {
            id: "cuantica",
            titulo: "Exploraciones en Física Cuántica Interactiva",
            nivel: "Avanzado / Universitario",
            modulos: "Simulaciones Cuánticas Numéricas",
            categoria: "Física Moderna",
            descripcion: "Visualización de funciones de onda, dualidad onda-partícula, pozos de potencial y el principio de incertidumbre a través de modelos numéricos interactivos.",
            temas: [
                "Ecuación de Schrödinger 1D", "Barreras y Efecto Túnel",
                "Superposición y Medición", "Entrelazamiento Cuántico",
                "Modelos de Enlace y Redes Cristalinas"
            ],
            destacado: false,
            tipo: "Laboratorio Computacional",
            demoPath: "/material/1_cursos/cuantica/dist/index.html",
            precioEstimado: "$35 USD (~$140.000 COP)",
            valorReal: "$59 USD",
            descuentoTag: "Física Avanzada",
            enlaceCompra: "https://hotmart.com"
        },
        {
            id: "retie",
            titulo: "Especialización Práctica en Normativa RETIE",
            nivel: "Ingenieros y Técnicos Electricistas",
            modulos: "Auditoría, Diseño e Instalaciones",
            categoria: "Ingeniería Aplicada",
            descripcion: "Guía técnica e interactiva para la aplicación del Reglamento Técnico de Instalaciones Eléctricas en Colombia. Cálculos de apantallamiento, puesta a tierra, protecciones y certificación.",
            temas: [
                "Fundamentos legales y campo de aplicación del RETIE", "Diseño de sistemas de puesta a tierra (SPT)",
                "Cálculo de distancias de seguridad", "Selección de conductores y canalizaciones",
                "Protección contra sobretensiones y descargas atmosféricas"
            ],
            destacado: false,
            tipo: "Módulo Profesional",
            demoPath: "/material/1_cursos/retie/dist/index.html",
            precioEstimado: "$49 USD (~$195.000 COP)",
            valorReal: "$99 USD",
            descuentoTag: "Aplicación Normativa",
            enlaceCompra: "https://hotmart.com"
        },
        {
            id: "squash_sim",
            titulo: "Física del Deporte: Simulador de Squash",
            nivel: "Divulgación & Física Aplicada",
            modulos: "Cinemática y Dinámica de Impacto",
            categoria: "Física & Simulación 3D",
            descripcion: "Estudio del coeficiente de restitución térmico en pelotas de goma, trayectorias en frontón y efecto Magnus en deportes de raqueta.",
            temas: [
                "Termodinámica del balón de squash", "Rozamiento aerodinámico no lineal",
                "Impacto elástico/inelástico en paredes", "Optimización de tiros estratégicos"
            ],
            destacado: false,
            tipo: "Simulador Físico",
            demoPath: "/material/1_cursos/squash_sim/dist/index.html",
            precioEstimado: "100% Gratuito (Lead Magnet)",
            valorReal: "$20 USD",
            descuentoTag: "Acceso Libre / Demo",
            enlaceCompra: null
        }
    ],

    // Canales Oficiales en Spotify (Investigación publicada en Revista Góndola)
    canalesSpotify: [
        {
            id: "sp-1",
            titulo: "El Lado Humano de la Física",
            autor: "Christian Maya",
            curso: "Física I",
            facultad: "Universidad del Cauca",
            spotifyId: "5WjQS0DTZFC7Kz3rTGAKyz",
            portada: "/assets/spotify/5WjQS0DTZFC7Kz3rTGAKyz.jpg",
            url: "https://open.spotify.com/show/5WjQS0DTZFC7Kz3rTGAKyz",
            descripcion: "Un podcast con muchos temas que relacionan la física clásica con la vida cotidiana y las vivencias de los científicos."
        },
        {
            id: "sp-2",
            titulo: "Mecapodcast",
            autor: "Yul",
            curso: "Física I",
            facultad: "Ingeniería Ambiental",
            spotifyId: "5wBxi8aZVbkLUPM8W7a6Ti",
            portada: "/assets/spotify/5wBxi8aZVbkLUPM8W7a6Ti.jpg",
            url: "https://open.spotify.com/show/5wBxi8aZVbkLUPM8W7a6Ti",
            descripcion: "Relaciona la mecánica básica con todo lo que puede existir en la naturaleza y el entorno ambiental."
        },
        {
            id: "sp-3",
            titulo: "Podcast Meccanica FIET",
            autor: "Carlos",
            curso: "Física I",
            facultad: "Facultad de Ing. Electrónica y Telecomunicaciones (FIET)",
            spotifyId: "3rY594Xa2fQB8qAL0b78nU",
            portada: "/assets/spotify/3rY594Xa2fQB8qAL0b78nU.jpg",
            url: "https://open.spotify.com/show/3rY594Xa2fQB8qAL0b78nU",
            descripcion: "Mecánica orientada a circuitos, telecomunicaciones, hardware y aplicaciones de ingeniería electrónica."
        },
        {
            id: "sp-4",
            titulo: "Fisicast",
            autor: "Ana Zúñiga",
            curso: "Física I",
            facultad: "Universidad del Cauca",
            spotifyId: "4209YIJGd1jwNN8Y36NSwY",
            portada: "/assets/spotify/4209YIJGd1jwNN8Y36NSwY.jpg",
            url: "https://open.spotify.com/show/4209YIJGd1jwNN8Y36NSwY",
            descripcion: "Podcast sobre la física básica en todo, o casi todo. Conceptos de movimiento, energía y oscilaciones."
        },
        {
            id: "sp-5",
            titulo: "Electromagnetismo 2025-I",
            autor: "Arnold Castro",
            curso: "Física II",
            facultad: "Universidad del Cauca",
            spotifyId: "3QAI0uuC5fkGT0FrzbTQDF",
            portada: "/assets/spotify/3QAI0uuC5fkGT0FrzbTQDF.jpg",
            url: "https://open.spotify.com/show/3QAI0uuC5fkGT0FrzbTQDF",
            descripcion: "Episodios dedicados a la inducción magnética, leyes de Maxwell, tecnología 5G, ciberseguridad y medicina."
        },
        {
            id: "sp-6",
            titulo: "Mecánica Ingeniería Ambiental 2025-I",
            autor: "Valentina Hr",
            curso: "Física I",
            facultad: "Ingeniería Ambiental",
            spotifyId: "5qejJVvb1PhNKXOgLXyuOz",
            portada: "/assets/spotify/5qejJVvb1PhNKXOgLXyuOz.jpg",
            url: "https://open.spotify.com/show/5qejJVvb1PhNKXOgLXyuOz",
            descripcion: "Caída de partículas, flujo de agua, choque de masas, turbinas eólicas, deslizamientos de tierra y huracanes."
        }
    ],

    librosHotmart: [
        {
            id: "libro-mecanica",
            titulo: "Fundamentos de Mecánica: Teoría y Modelación",
            autor: "Mg. Manuel Alejandro Obando",
            descripcion: "El libro guía definitivo con explicaciones conceptuales intuitivas, problemas resueltos paso a paso y códigos de cálculo computacional.",
            precio: "Disponible en Hotmart",
            enlaceHotmart: "#",
            disponible: false
        },
        {
            id: "libro-transformadores",
            titulo: "Manual Práctico de Máquinas Eléctricas y Transformadores",
            autor: "Mg. Manuel Alejandro Obando",
            descripcion: "De los principios de inducción de Faraday al diseño de bancos de potencia y pruebas de ensayo en campo.",
            precio: "Disponible en Hotmart",
            enlaceHotmart: "#",
            disponible: false
        }
    ],

    // Artículos de divulgación y Física del Deporte (Squash) para captación de público
    articulosSquash: [
        {
            id: "art-1",
            titulo: "Termodinámica y Rebote: ¿Por qué calentar la pelota de squash lo cambia todo?",
            subtitulo: "Física de Polímeros & Coeficiente de Restitución",
            tag: "Termodinámica & Materiales",
            tiempoLectura: "5 min de lectura",
            icono: "🎾",
            resumen: "A diferencia de las pelotas de tenis o pádel, la pelota de squash de doble punto amarillo es casi inerte en frío. Descubre la física de los gases internos, la viscoelasticidad del caucho sintético y cómo pasar de 20°C a 45°C duplica su capacidad de rebote.",
            demoPath: "/material/1_cursos/squash_sim/dist/index.html",
            contenido: `
                <h3>La física detrás de una pelota que 'despierta' con el calor</h3>
                <p>Cualquier jugador de squash sabe que comenzar un partido con una pelota fría es frustrante: la bola parece 'muerta', apenas levanta del piso y los desplazamientos se hacen pesados. Tras cinco minutos de peloteo continuo, la pelota parece otra: viva, rápida y con bote predecible.</p>
                <div style="background:rgba(56,189,248,0.08); border-left:4px solid var(--accent-blue); padding:1rem; border-radius:8px; margin:1rem 0;">
                    <strong>Fórmula del Coeficiente de Restitución (e):</strong><br>
                    <code>e = v_rebote / v_impacto = √(h_rebote / h_caida)</code>
                </div>
                <p>A temperatura ambiente (20°C), el coeficiente de una bola oficial de doble punto amarillo es de apenas <strong>e ≈ 0.25</strong> (disipa más del 93% de su energía en calor interno). Al alcanzar su temperatura de régimen en juego (45°C), el coeficiente salta a <strong>e ≈ 0.50</strong>, cuadruplicando la energía conservada en cada bote.</p>
                <h4>¿Por qué ocurre esto?</h4>
                <p>El compuesto de caucho butílico experimenta una reducción en su fricción interna molecular. Simultáneamente, el aire confinado en el interior se expande según la ley de los gases ideales (PV = nRT), aumentando la presión manométrica y dotando a la pelota de una respuesta elástica óptima.</p>
            `
        },
        {
            id: "art-2",
            titulo: "Biomecánica del Golpe: La Cadena Cinética y el Codo de Tenista",
            subtitulo: "Transferencia de Momento Angular & Salud Articular",
            tag: "Biomecánica & Salud",
            tiempoLectura: "6 min de lectura",
            icono: "🦾",
            resumen: "¿Por qué tantos jugadores sufren de epicondilitis? La física demuestra que la potencia no proviene de la fuerza del brazo, sino de la aceleración secuencial de la cadena cinética: piernas, cadera, rotación torácica y retardo de muñeca.",
            demoPath: "/material/1_cursos/squash_sim/dist/index.html",
            contenido: `
                <h3>El mito de golpear con el brazo</h3>
                <p>En el squash de alta competencia, la cabeza de la raqueta puede superar los 180 km/h al momento del impacto. Intentar generar esa velocidad utilizando los pequeños músculos flexores y extensores del antebrazo produce microdesgarros en la inserción tendinosa del epicóndilo lateral (codo de tenista).</p>
                <div style="background:rgba(16,185,129,0.08); border-left:4px solid var(--accent-emerald); padding:1rem; border-radius:8px; margin:1rem 0;">
                    <strong>Principio de la Cadena Cinética:</strong><br>
                    Sumar velocidades angulares en orden estricto de distal a proximal con desfases de 30 a 60 milisegundos.
                </div>
                <h4>Las cuatro fases del swing eficiente:</h4>
                <ol>
                    <li><strong>Estocada y anclaje:</strong> El talón trasero anclado frena la inercia del cuerpo y transfiere la reacción del suelo a la pelvis.</li>
                    <li><strong>Rotación pélvica y de torso:</strong> Almacena energía elástica en los oblicuos abdominales y la fascia toracolumbar.</li>
                    <li><strong>Aceleración del hombro:</strong> Conduce el brazo como una palanca de tercer género.</li>
                    <li><strong>Retardo de muñeca (Cocked Wrist):</strong> La muñeca se mantiene a 90° durante la bajada y se desancla en el último instante, multiplicando el momento lineal en el punto de contacto.</li>
                </ol>
            `
        },
        {
            id: "art-3",
            titulo: "Geometría en la Cancha: Control de la 'T' y Optimización de Trayectorias",
            subtitulo: "Cinemática de Cobertura & Tiempos de Reacción",
            tag: "Cinemática & Táctica",
            tiempoLectura: "4 min de lectura",
            icono: "📐",
            resumen: "La 'T' del squash no es solo una marca en la duela; es el centro baricéntrico óptimo de cobertura espacial. Descubre por qué recortar 50 centímetros de distancia hacia la 'T' duplica tu tiempo de anticipación.",
            demoPath: "/material/1_cursos/squash_sim/dist/index.html",
            contenido: `
                <h3>La cancha de 9.75 x 6.40 m como espacio vectorial</h3>
                <p>El squash ha sido denominado 'el ajedrez a 200 pulsaciones por minuto'. La pelota puede cruzar la cancha de la pared frontal a la trasera en menos de 400 milisegundos, rozando el límite fisiológico del tiempo de reacción motora humana.</p>
                <div style="background:rgba(245,158,11,0.08); border-left:4px solid var(--accent-amber); padding:1rem; border-radius:8px; margin:1rem 0;">
                    <strong>El Principio del Centroide de Distancia Mínima:</strong><br>
                    Estar parado en la 'T' minimiza la distancia euclidiana máxima hacia cualquiera de las 4 esquinas de la cancha a menos de 4.6 metros.
                </div>
                <h4>Física de los ángulos de pared (Boast y Nick):</h4>
                <p>Al impactar las paredes laterales con efecto, el rozamiento no uniforme altera la ley clásica de reflexión óptica especular (θ_incidencia ≠ θ_reflexión). Dominar esta desviación cinemática permite anticipar con exactitud el segundo bote y forzar al rival fuera de su centro de equilibrio.</p>
            `
        }
    ],

    podcasts: [
        {
            id: "pod-1",
            titulo: "Electromagnetismo y la Medicina",
            categoria: "Electromagnetismo",
            archivo: "/material/4_podcasts/Electromagnetismo/Electromagnetismo y la Medicina.mp3",
            tipo: "audio",
            descripcion: "Cómo las resonancias magnéticas, los biomarcadores electromagnéticos y la radiación no ionizante salvaron vidas y revolucionaron los diagnósticos.",
            creditos: "Estudiantes del Curso de Electromagnetismo · Departamento de Física"
        },
        {
            id: "pod-2",
            titulo: "Teletransportación Cuántica: Mito vs. Realidad",
            categoria: "Física Moderna",
            archivo: "/material/4_podcasts/Fisica Moderna/Teletransportación Cuántica.MP3",
            tipo: "audio",
            descripcion: "Desmitificando el entrelazamiento cuántico, el protocolo Bennett y el futuro del internet cuántico global.",
            creditos: "Estudiantes del Curso de Física Moderna"
        },
        {
            id: "pod-3",
            titulo: "Cosmología y Energía Oscura",
            categoria: "Física Moderna",
            archivo: "/material/4_podcasts/Fisica Moderna/Cosmología y Energia Oscura.m4a",
            tipo: "audio",
            descripcion: "Un viaje sonoro por el modelo cosmológico estándar, la aceleración de la expansión del universo y el destino final del cosmos.",
            creditos: "Estudiantes del Curso de Física Moderna"
        },
        {
            id: "pod-4",
            titulo: "Nanotecnología y Electromagnetismo",
            categoria: "Electromagnetismo",
            archivo: "/material/4_podcasts/Electromagnetismo/Nanotecnologia y Electromagnestimo.mp3",
            tipo: "audio",
            descripcion: "El comportamiento de la luz y los campos electromagnéticos en la escala de los nanómetros: plasmónica y metamateriales.",
            creditos: "Estudiantes del Curso de Electromagnetismo"
        },
        {
            id: "pod-5",
            titulo: "Energía Renovable y Electromagnetismo",
            categoria: "Electromagnetismo",
            archivo: "/material/4_podcasts/Electromagnetismo/Energía Renovable y Electromagnetismo.MP3",
            tipo: "audio",
            descripcion: "Generadores eólicos, paneles solares de alta eficiencia y la transición energética vista desde la física de partículas.",
            creditos: "Estudiantes del Curso de Electromagnetismo"
        },
        {
            id: "pod-6",
            titulo: "Holografía y Realidad Virtual",
            categoria: "Física Moderna",
            archivo: "/material/4_podcasts/Fisica Moderna/Podcast Holografía y Realidad Virtual.mp3",
            tipo: "audio",
            descripcion: "Interferencia de ondas coherentes, láseres y cómo construimos mundos tridimensionales con luz.",
            creditos: "Estudiantes del Curso de Física Moderna"
        },
        {
            id: "pod-7",
            titulo: "Superconductores y el Futuro Tecnológico",
            categoria: "Física Moderna",
            archivo: "/material/4_podcasts/Fisica Moderna/Superconductores.mp4",
            tipo: "video",
            descripcion: "Resistencia eléctrica cero, efecto Meissner y trenes de levitación magnética explicados paso a paso.",
            creditos: "Estudiantes del Curso de Física Moderna"
        },
        {
            id: "pod-8",
            titulo: "Trabajo y Energía en la Vida Cotidiana",
            categoria: "Mecánica",
            archivo: "/material/4_podcasts/Podcast Mecanica/Trabajo y Energia en la vida cotidiana.aac",
            tipo: "audio",
            descripcion: "La física detrás de una bicicleta, el frenado de un auto y el rendimiento metabólico humano.",
            creditos: "Estudiantes del Curso de Mecánica"
        },
        {
            id: "pod-9",
            titulo: "Tensión en Cuerdas y Estructuras",
            categoria: "Mecánica",
            archivo: "/material/4_podcasts/Podcast Mecanica/Tension en Cuerdas.mpeg",
            tipo: "audio",
            descripcion: "Por qué los puentes colgantes no se caen: equilibrio estático, tracción y vectores en el mundo real.",
            creditos: "Estudiantes del Curso de Mecánica"
        },
        {
            id: "pod-10",
            titulo: "Electromagnetismo y Seguridad Cibernética",
            categoria: "Electromagnetismo",
            archivo: "/material/4_podcasts/Electromagnetismo/Electromagnetismo y Seguridad Cibernética.mp3",
            tipo: "audio",
            descripcion: "Tempest attacks, apantallamiento de Faraday e interceptación de señales por fuga electromagnética en procesadores.",
            creditos: "Estudiantes del Curso de Electromagnetismo"
        }
    ],

    comics: [
        {
            id: "com-1",
            titulo: "El Reactor de Corriente Alterna",
            categoria: "Electromagnetismo",
            archivo: "/material/3_comics/elReactorDeCorrienteAlterna.pdf",
            descripcion: "La batalla de los voltajes y la invención del transformador que electrificó al mundo moderno.",
            conceptoFisico: "Inducción Electromagnética y Flujo Magnético",
            creditos: "Estudiantes de Ingeniería y Física"
        },
        {
            id: "com-2",
            titulo: "Gravedad Cero: Más Allá de la Tierra",
            categoria: "Mecánica",
            archivo: "/material/3_comics/GRAVEDAD 0.pdf",
            descripcion: "Una aventura en caída libre continua para desmentir los mitos comunes sobre el peso en el espacio.",
            conceptoFisico: "Fuerza Gravitacional y Órbitas Satelitales",
            creditos: "Estudiantes de Mecánica Clásica"
        },
        {
            id: "com-3",
            titulo: "El Magnetizador Urbano",
            categoria: "Electromagnetismo",
            archivo: "/material/3_comics/EL MAGNETIZADOR URBANO.pdf",
            descripcion: "¿Qué pasaría si pudieras manipular la polaridad magnética de los objetos de una ciudad?",
            conceptoFisico: "Leyes de Ampère, Biot-Savart y Fuerzas de Lorentz",
            creditos: "Estudiantes de Electromagnetismo"
        },
        {
            id: "com-4",
            titulo: "La Carrera del Siglo (Cinemática Relativa)",
            categoria: "Mecánica",
            archivo: "/material/3_comics/La Carrera Del Siglo.pdf",
            descripcion: "Un enfrentamiento de alta velocidad donde ganar depende de comprender la aceleración y los sistemas de referencia.",
            conceptoFisico: "Velocidad Relativa y Dinámica de Partículas",
            creditos: "Estudiantes de Mecánica"
        },
        {
            id: "com-5",
            titulo: "La Vida de Nikola Tesla",
            categoria: "Historia de la Física",
            archivo: "/material/3_comics/ComicNikolaTesla.pdf",
            descripcion: "Biografía ilustrada del visionario serbio y su obsesión con las altas frecuencias y la resonancia magnética.",
            conceptoFisico: "Campos Magnéticos Rotativos y Corriente Alterna",
            creditos: "Estudiantes de Física"
        },
        {
            id: "com-6",
            titulo: "Agrofísica: Presión Máxima en los Cultivos",
            categoria: "Agrofísica & Fluidos",
            archivo: "/material/3_comics/Comic agrofisica a presion maxima.pdf",
            descripcion: "Cómo la tensión superficial y el potencial hídrico permiten a los árboles gigantes llevar agua a 100 metros de altura.",
            conceptoFisico: "Capilaridad, Presión Hidrostática y Cohesión",
            creditos: "Estudiantes de Física Aplicada"
        },
        {
            id: "com-7",
            titulo: "El Último Campo (Líneas de Fuerza)",
            categoria: "Electromagnetismo",
            archivo: "/material/3_comics/El último campo.pdf",
            descripcion: "Descubriendo la geometría oculta de los campos electrostáticos y el potencial eléctrico.",
            conceptoFisico: "Ley de Gauss y Superficies Equipotenciales",
            creditos: "Estudiantes de Electromagnetismo"
        },
        {
            id: "com-8",
            titulo: "Cuentos de Energía y Transformación",
            categoria: "Mecánica",
            archivo: "/material/3_comics/Comic energias.pdf",
            descripcion: "La energía no se crea ni se destruye, solo se transforma... ¡a veces con consecuencias explosivas!",
            conceptoFisico: "Conservación de la Energía y Fuerzas Disipativas",
            creditos: "Estudiantes de Mecánica"
        },
        {
            id: "com-9",
            titulo: "La Bobina Maldita",
            categoria: "Electromagnetismo",
            archivo: "/material/3_comics/BOBINA MALDITA.pdf",
            descripcion: "Un misterio en el laboratorio que solo puede resolverse calculando la autoinductancia y la ley de Lenz.",
            conceptoFisico: "Inductancia, Fuerza Contraelectromotriz y Ley de Lenz",
            creditos: "Estudiantes de Física"
        },
        {
            id: "com-10",
            titulo: "Balance Cuántico",
            categoria: "Física Moderna",
            archivo: "/material/3_comics/cmicBALANCNCUNTICO.pdf",
            descripcion: "Cuando las partículas desafían el sentido común clásico y existen en múltiples estados a la vez.",
            conceptoFisico: "Principio de Incertidumbre y Superposición",
            creditos: "Estudiantes de Física Moderna"
        }
    ]
};
