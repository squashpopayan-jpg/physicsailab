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
                "id": "com-1",
                "titulo": "El Impulso Fantasma: Termodinámica y Trabajo",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_01.jpg",
                "archivo": "/material/3_comics/4_Viñetas_de_Cómic_En_Blanco[1].pdf",
                "autores": "Juan David Mondragón Chois (Ing. Electrónica y Telecomunicaciones)",
                "descripcion": "¿Qué sucede cuando un experimento de física mecánica parece violar la conservación de energía? Una entretenida investigación sobre el trabajo mecánico, el calor disipado y la Primera Ley de la Termodinámica.",
                "conceptoFisico": "Primera Ley de la Termodinámica, Trabajo Mecánico y Conservación de Energía"
        },
        {
                "id": "com-2",
                "titulo": "La Bobina Maldita",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_02.jpg",
                "archivo": "/material/3_comics/BOBINA MALDITA.pdf",
                "autores": "Daniel Cuellar Ruiz, Samantha Durán Muñoz, Alejandro Rodríguez Luligo",
                "descripcion": "Un misterio electrizante en el laboratorio donde fenómenos anómalos de voltaje solo pueden resolverse calculando la autoinductancia, la ley de Lenz y la fuerza contraelectromotriz.",
                "conceptoFisico": "Autoinductancia, Fuerza Contraelectromotriz y Ley de Lenz"
        },
        {
                "id": "com-3",
                "titulo": "Más Allá de la Gravedad: La Velocidad de Escape",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_03.jpg",
                "archivo": "/material/3_comics/COMIC (2).pdf",
                "autores": "Ángela Fernanda Perafán López, Jaider Hurtado Riascos",
                "descripcion": "Una apasionante odisea espacial que explora la física para vencer el pozo gravitacional de un planeta mediante el principio de conservación de la energía mecánica.",
                "conceptoFisico": "Velocidad de Escape, Gravitación Universal y Energía Mecánica Orbital"
        },
        {
                "id": "com-4",
                "titulo": "Los Guardianes de la Carga",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_04.jpg",
                "archivo": "/material/3_comics/COMIC (3).pdf",
                "autores": "Estudiantes del Curso de Electromagnetismo · Univ. del Cauca",
                "descripcion": "En un microcosmos de partículas atómicas, los guardianes deben preservar el equilibrio de atracción y repulsión electrostática para evitar el colapso del sistema.",
                "conceptoFisico": "Carga Eléctrica, Campo Electrostático y Ley de Coulomb"
        },
        {
                "id": "com-5",
                "titulo": "El Laberinto Magnético (Villa Faraday)",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_05.jpg",
                "archivo": "/material/3_comics/COMIC (4).pdf",
                "autores": "Estudiantes de Ingeniería y Física · Univ. del Cauca",
                "descripcion": "Una noche de tormenta en Villa Faraday desata fenómenos magnéticos inesperados: guiarse a través del laberinto exige calcular la fuerza magnética de Lorentz sobre cargas en movimiento.",
                "conceptoFisico": "Fuerza Magnética de Lorentz, Líneas de Campo y Ley de Faraday"
        },
        {
                "id": "com-6",
                "titulo": "Gravedad Sayayin: Fuerzas y Aceleración Extrema",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_06.jpg",
                "archivo": "/material/3_comics/COMIC 2025 MECANICA. Isabel Garcés, Nicolas Pungo, Ruben Quirá.pdf.pdf",
                "autores": "Isabel Garcés, Nicolás Pungo, Rubén Quirá",
                "descripcion": "Inspirado en el mundo del anime, los guerreros entrenan bajo 300G en una cámara de gravedad aumentada, analizando la Segunda Ley de Newton, la masa inercial y el peso aparente.",
                "conceptoFisico": "Segunda Ley de Newton, Aceleración Gravitatoria Extrema y Peso Aparente"
        },
        {
                "id": "com-7",
                "titulo": "El Pulso del Tiempo: Oscilaciones y Péndulos",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_07.jpg",
                "archivo": "/material/3_comics/COMIC JORGE ACHURY Y JUAN REYES.pdf",
                "autores": "Jorge Achury, Juan Carlos Reyes",
                "descripcion": "¿Por qué tantos relojes sonando al mismo tiempo? Ana y su tío descubren la precisión matemática del Movimiento Armónico Simple, la longitud del péndulo y la frecuencia de resonancia.",
                "conceptoFisico": "Movimiento Armónico Simple (MAS), Periodo de Péndulo y Resonancia"
        },
        {
                "id": "com-8",
                "titulo": "La Carrera que Nadie Pudo Ganar",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_08.jpg",
                "archivo": "/material/3_comics/COMIC LA CARRERA QUE NADIE PUEDE GANAR.pdf",
                "autores": "Lina María Granja",
                "descripcion": "En una pista donde la fricción dicta el destino de cada vehículo, Lina comprende que la máxima aceleración en curva no depende de la potencia del motor, sino del agarre del neumático.",
                "conceptoFisico": "Fricción Estática vs. Cinética, Fuerza Centrípeta y Dinámica de Curvas"
        },
        {
                "id": "com-9",
                "titulo": "Giro Sin Control: Dinámica Rotacional",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_09.jpg",
                "archivo": "/material/3_comics/COMIC PAUVA.pdf",
                "autores": "Estudiantes del Curso de Mecánica · Univ. del Cauca",
                "descripcion": "Cuando un rotor mecánico gira fuera de control, comprender la relación entre torque, momento de inercia y distribución radial de masa es la única salvación para la maquinaria.",
                "conceptoFisico": "Torque, Momento de Inercia y Dinámica Rotacional"
        },
        {
                "id": "com-10",
                "titulo": "La Revelación de la Inducción",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_12.jpg",
                "archivo": "/material/3_comics/COMICFINAL.pdf",
                "autores": "Carlos Eduardo Dorado Joaqui, Laura Isabel Rodríguez Tróchez, Jors Eduar Solarte Castillo, Darío Alexander Cárdenas Guerrero",
                "descripcion": "Un viaje narrativo visual al corazón del descubrimiento de Michael Faraday: cómo un campo magnético variable en el tiempo es capaz de engendrar corriente eléctrica en una espira.",
                "conceptoFisico": "Ley de Faraday, Flujo Magnético y Fuerza Electromotriz Inducida"
        },
        {
                "id": "com-11",
                "titulo": "La Antena: Transmitiendo a Frecuencias Prohibidas",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_11.jpg",
                "archivo": "/material/3_comics/COMICF.pdf",
                "autores": "Estudiantes del Departamento de Física · Univ. del Cauca",
                "descripcion": "Una misteriosa señal clandestina cruza el espectro de radio, guiando a los personajes a través de las frecuencias del espectro electromagnético y la física de radiación de dipolos.",
                "conceptoFisico": "Ondas Electromagnéticas, Espectro Radioeléctrico y Radiación de Antenas"
        },
        {
                "id": "com-12",
                "titulo": "El Rescate de la Nave a la Deriva",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_13.jpg",
                "archivo": "/material/3_comics/COMICTOTAL.pdf",
                "autores": "María José Rivera Girón, Fabián Felipe Velazco Mera, Javier Maelo Caicedo Caicedo",
                "descripcion": "A bordo de la dañada NAVE-47K en el vacío profundo, la tripulación debe realizar maniobras de emergencia aplicando con rigor la Tercera Ley de Newton y el principio de conservación de momento.",
                "conceptoFisico": "Tercera Ley de Newton, Conservación del Momento Lineal e Impulso"
        },
        {
                "id": "com-13",
                "titulo": "Las Piedras del Infinitum: Colisiones y Choques",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_14.jpg",
                "archivo": "/material/3_comics/Comic (1) (1).pdf",
                "autores": "Camilo Gordillo, Tatiana Rojas, Alejandra López, Camilo Montenegro",
                "descripcion": "Gamora investiga reliquias de alta energía en la Academia Nacional de Ciencias Antiguas, desentrañando la física de las colisiones elásticas e inelásticas en el espacio.",
                "conceptoFisico": "Colisiones Elásticas, Momento Lineal y Conservación de la Energía"
        },
        {
                "id": "com-14",
                "titulo": "Desafiando las Leyes del Movimiento",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_15.jpg",
                "archivo": "/material/3_comics/Comic (1).pdf",
                "autores": "Estudiantes de Mecánica Newtoniana · Univ. del Cauca",
                "descripcion": "Un recorrido humorístico por situaciones donde los personajes intentan saltarse las leyes físicas elementales, demostrando que la inercia y el centro de masa son ineludibles.",
                "conceptoFisico": "Centro de Masa, Equilibrio de Fuerzas e Inercia Mecánica"
        },
        {
                "id": "com-15",
                "titulo": "Ionix: La Ciudad de las Descargas",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_16.jpg",
                "archivo": "/material/3_comics/Comic Electro.pdf",
                "autores": "Nicolás Rocha Gutiérrez, Ángela Marcela Méndez Astudillo",
                "descripcion": "Voltaria, la ciudad que nunca dormía, colapsa ante una tormenta de sobrevoltaje. Comprender la ruptura dieléctrica del aire y la capacitancia de la red es la clave para restaurar el fluido.",
                "conceptoFisico": "Ruptura Dieléctrica, Descargas Eléctricas y Redes de Potencia"
        },
        {
                "id": "com-16",
                "titulo": "La Torre Inestable: Equilibrio y Estática",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_17.jpg",
                "archivo": "/material/3_comics/Comic Fisica 03 dic 25 · 06·51·28.pdf",
                "autores": "Andrés Andrés, Juan Andrés Guachavez, Juan David Urrutia",
                "descripcion": "Una enorme estructura inclinada amenaza con desplomarse. Los protagonistas deben calcular el centro de gravedad y las condiciones de equilibrio estático antes de que el torque la derrumbe.",
                "conceptoFisico": "Condiciones de Equilibrio Estático, Torque y Centro de Gravedad"
        },
        {
                "id": "com-17",
                "titulo": "Ladrón Electromagnético: La Fuga de Carga",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_18.jpg",
                "archivo": "/material/3_comics/Comic Ladron FULL EDITION.pdf",
                "autores": "Estudiantes del Curso de Electromagnetismo · Univ. del Cauca",
                "descripcion": "En una galaxia tecnológica, un villano drena las cargas eléctricas de las ciudades e interactúa con los pulsos bioeléctricos de los sistemas neuronales vivos.",
                "conceptoFisico": "Campos Electromagnéticos, Corrientes Iónicas y Bioelectricidad"
        },
        {
                "id": "com-18",
                "titulo": "Presión Máxima: El Riego que Salvó la Cosecha",
                "categoria": "Agrofísica",
                "portada": "/assets/comics/cover_19.jpg",
                "archivo": "/material/3_comics/Comic agrofisica a presion maxima.pdf",
                "autores": "Estudiantes del Curso de Agrofísica · Univ. del Cauca",
                "descripcion": "Una severa sequía pone en jaque al valle agrícola. Aplicando hidrostática y la ecuación de continuidad en los canales, los agrónomos logran optimizar el riego a presión máxima.",
                "conceptoFisico": "Presión Hidrostática, Caudal, Ecuación de Continuidad y Bernoulli"
        },
        {
                "id": "com-19",
                "titulo": "Las Fuerzas que No Puedes Ver (Popayán)",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_20.jpg",
                "archivo": "/material/3_comics/Comic completo.pdf",
                "autores": "Estudiantes de Física I · Universidad del Cauca (Popayán)",
                "descripcion": "En el centro histórico de Popayán, un grupo de universitarios investiga extrañas oscilaciones de objetos, identificando las fuerzas de campo y contacto que gobiernan la ciudad.",
                "conceptoFisico": "Fuerzas a Distancia vs. Contacto, Gravedad y Fricción"
        },
        {
                "id": "com-20",
                "titulo": "Confinamiento: El Caso de la Antimateria",
                "categoria": "Física Moderna",
                "portada": "/assets/comics/cover_21.jpg",
                "archivo": "/material/3_comics/Comic electromagnetismo.pdf",
                "autores": "Estudiantes de Física y Electromagnetismo · Univ. del Cauca",
                "descripcion": "¿Cómo retener partículas de antimateria sin que se aniquilen al tocar la materia común? Una historia sobre trampas de Penning y confinamiento magnético dipolar.",
                "conceptoFisico": "Confinamiento Magnético, Trampas de Penning y Antimateria"
        },
        {
                "id": "com-21",
                "titulo": "Potencial vs. Cinética: La Guerra de las Energías",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_22.jpg",
                "archivo": "/material/3_comics/Comic energias.pdf",
                "autores": "Estudiantes del Curso de Mecánica · Univ. del Cauca",
                "descripcion": "En un conflicto épico intergaláctico, dos imperios combaten por controlar la transformación continua de la energía potencial en energía cinética devastadora.",
                "conceptoFisico": "Conservación de la Energía Mecánica, Trabajo y Fuerzas Conservativas"
        },
        {
                "id": "com-22",
                "titulo": "Las Leyes de Arón: Universo del Caos",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_23.jpg",
                "archivo": "/material/3_comics/Comic mecánica .pdf",
                "autores": "Estudiantes de Mecánica Clásica · Univ. del Cauca",
                "descripcion": "Arón queda transportado a un mundo donde las leyes mecánicas actúan en cámara lenta, permitiéndole analizar cada vector de fuerza y choque con precisión didáctica.",
                "conceptoFisico": "Leyes de Newton, Dinámica Vectorial y Cantidad de Movimiento"
        },
        {
                "id": "com-23",
                "titulo": "Epsilon: Atrapados en el Campo",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_24.jpg",
                "archivo": "/material/3_comics/Comic--Britney Benitez-Jonnathan Benavidez-MiguelVillanueva.pdf",
                "autores": "Britney Benitez, Jonnathan Benavidez, Miguel Villanueva",
                "descripcion": "La conmovedora historia de una partícula atrapada entre las placas cargadas de un condensador gigante: cómo la trayectoria parabólica depende del potencial electrostático.",
                "conceptoFisico": "Campo Eléctrico Uniforme, Diferencia de Potencial y Trayectoria Parabólica"
        },
        {
                "id": "com-24",
                "titulo": "La Montaña Invisible: Energía en Pendientes",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_25.jpg",
                "archivo": "/material/3_comics/ComicCompleto.pdf",
                "autores": "Dubán Muñoz González, Hugo J. González",
                "descripcion": "Escalando una montaña con zonas de hielo y roca áspera, los aventureros calculan el ángulo crítico del plano inclinado para evitar deslizamientos involuntarios.",
                "conceptoFisico": "Plano Inclinado, Coeficiente de Fricción y Ángulo Crítico de Deslizamiento"
        },
        {
                "id": "com-25",
                "titulo": "El Parque de Atracciones Flotante: Principio de Arquímedes",
                "categoria": "Mecánica de Fluidos",
                "portada": "/assets/comics/cover_26.jpg",
                "archivo": "/material/3_comics/ComicDOC-20251202-WA0014..pdf",
                "autores": "Jhon & Compañeros de Física Aplicada · Univ. del Cauca",
                "descripcion": "Jhon visita una megaestructura flotante sobre un lago y descubre cómo el empuje hidrostático de Arquímedes equilibra el peso de montañas rusas y miles de visitantes.",
                "conceptoFisico": "Principio de Arquímedes, Empuje Hidrostático y Flotabilidad"
        },
        {
                "id": "com-26",
                "titulo": "Nikola Tesla: El Genio de la Electricidad",
                "categoria": "Historia de la Física",
                "portada": "/assets/comics/cover_27.jpg",
                "archivo": "/material/3_comics/ComicNikolaTesla.pdf",
                "autores": "Santiago Andrés Caicedo, Santiago Benavides, José Manuel Guampe, Sergio Rosadol",
                "descripcion": "Una rigurosa y amena biografía ilustrada sobre Nikola Tesla, su invención de la corriente alterna polifásica y sus experimentos pioneros con campos magnéticos rotativos.",
                "conceptoFisico": "Corriente Alterna, Campos Magnéticos Rotativos y Resonancia LC"
        },
        {
                "id": "com-27",
                "titulo": "El Faro de las Ondas Perdidas",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_28.jpg",
                "archivo": "/material/3_comics/Comic_Electro.pdf",
                "autores": "Estudiantes del Departamento de Física · Univ. del Cauca",
                "descripcion": "Un viejo faro que parecía inactivo revela transmitir en longitudes de onda no visibles. Nico y sus compañeros usan antenas receptoras para rastrear su haz electromagnético.",
                "conceptoFisico": "Espectro Óptico y Electromagnético, Frecuencia y Ondas de Radio"
        },
        {
                "id": "com-28",
                "titulo": "Misión Newton: Aceleración al Infinito",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_29.jpg",
                "archivo": "/material/3_comics/Cómic.pdf",
                "autores": "El Club de los Coheteros · Universidad del Cauca",
                "descripcion": "En el club escolar de ciencias espaciales, los estudiantes diseñan su primer cohete propulsado y deben optimizar la relación masa-combustible mediante la ecuación del cohete.",
                "conceptoFisico": "Propulsión a Reacción, Ecuación de Tsiolkovski y Cinemática de Despegue"
        },
        {
                "id": "com-29",
                "titulo": "Carrera de Obstáculos en Gravedad Cero",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_30.jpg",
                "archivo": "/material/3_comics/Cómic[1].pdf",
                "autores": "María José Astaiza, Stiven Gómez, Harol Suárez",
                "descripcion": "En el circuito de entrenamiento orbital, los cadetes descubren que en ingravidez cualquier movimiento produce una reacción opuesta instantánea según la Tercera Ley de Newton.",
                "conceptoFisico": "Conservación del Momento Lineal y Tercera Ley en Microgravedad"
        },
        {
                "id": "com-30",
                "titulo": "Desafío Estelar por Gravedad Cero",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_31.jpg",
                "archivo": "/material/3_comics/Cómic 4 Viñetas  en Blanco Rectángulos (1).pdf",
                "autores": "Estudiantes de Ingeniería · Universidad del Cauca",
                "descripcion": "Ziro y Anya compiten en el Gran Premio Orbital aprendiendo que el exceso de impulso inicial sin cálculo de vector resultante arroja la nave fuera del trazado seguro.",
                "conceptoFisico": "Impulso Mecánico, Momento Lineal y Vectores de Fuerza"
        },
        {
                "id": "com-31",
                "titulo": "Mientras me Mueva: Movimiento Restringido",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_32.jpg",
                "archivo": "/material/3_comics/Cómic-mecánica.pdf",
                "autores": "Estudiantes del Curso de Mecánica · Univ. del Cauca",
                "descripcion": "En una fábrica automatizada de alta seguridad, un dron debe navegar a través de sistemas de poleas y guías respetando las ecuaciones de ligadura cinemática.",
                "conceptoFisico": "Movimiento Ligado, Poleas Ideales y Grados de Libertad"
        },
        {
                "id": "com-32",
                "titulo": "Proyecto Alfa Nova: Momento Angular",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_33.jpg",
                "archivo": "/material/3_comics/DOC-20251204-WA0041_pdf.pdf",
                "autores": "Karol Cajas, Sara Castillo, Erwin Guasaco",
                "descripcion": "Una estación espacial pierde estabilidad de rotación. Los tripulantes aplican la conservación del momento angular retrayendo y extendiendo sus módulos para controlar el giro.",
                "conceptoFisico": "Conservación del Momento Angular y Rotación de Cuerpos Rígidos"
        },
        {
                "id": "com-33",
                "titulo": "El Espectro Secreto del Radio",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_34.jpg",
                "archivo": "/material/3_comics/Diseño sin título.pdf",
                "autores": "Esteban Arcos Velandia, Isabella González Morales, Sebastián Camilo Soto Fajardo",
                "descripcion": "Tres jóvenes interceptan frecuencias misteriosas y exploran cómo viajan las ondas electromagnéticas portadoras a través de la atmósfera y el espacio.",
                "conceptoFisico": "Propagación de Ondas Electromagnéticas y Modulación de Señal"
        },
        {
                "id": "com-34",
                "titulo": "El Magnetizador Urbano",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_35.jpg",
                "archivo": "/material/3_comics/EL MAGNETIZADOR URBANO.pdf",
                "autores": "José Chávez, Jancer Chamorro, Isabela Hernández, Sebastián Meneses",
                "descripcion": "Un misterioso dispositivo altera los campos magnéticos de una metrópoli de acero: la física de atracción, repulsión y corrientes inducidas puesta a prueba.",
                "conceptoFisico": "Leyes de Ampère, Biot-Savart y Ferromagnetismo"
        },
        {
                "id": "com-35",
                "titulo": "Rayden: El Escudo Electrostático",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_36.jpg",
                "archivo": "/material/3_comics/El mundo cambio el dia que ellos nacieron._20251201_133131_0000.pdf",
                "autores": "José David Gómez, Luis Miguel Solis, Luis Fernando Becerra, David Santiago Hurtado",
                "descripcion": "El mundo cambió con la llegada de entidades con campos eléctricos descontrolados. Para salvar a su ciudad, Rayden diseña una jaula de Faraday perfecta para blindar a la población.",
                "conceptoFisico": "Jaula de Faraday, Apantallamiento Electrostático y Potencial Eléctrico"
        },
        {
                "id": "com-36",
                "titulo": "La Caída Inesperada de la Luna",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_37.jpg",
                "archivo": "/material/3_comics/El texto del párrafo (1).pdf",
                "autores": "Laia Guasco Osorio, Isabella Cajas Ojeda, Julieth Vanessa Mamián González",
                "descripcion": "La luna aparece más cercana e imponente en el cielo nocturno: una alteración en su energía orbital amenaza con precipitarla si no se restaura la velocidad tangencial precisa.",
                "conceptoFisico": "Ley de Gravitación Universal, Energía Orbital y Velocidad Orbital"
        },
        {
                "id": "com-37",
                "titulo": "El Último Campo: Batalla de Luz y Oscuridad",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_38.jpg",
                "archivo": "/material/3_comics/El último campo.pdf",
                "autores": "Estudiantes del Departamento de Física · Univ. del Cauca",
                "descripcion": "En el génesis cósmico, antes de la materia condensada, los campos eléctrico y magnético se entrelazan armónicamente para dar nacimiento a la luz y a las ondas electromagnéticas.",
                "conceptoFisico": "Ecuaciones de Maxwell, Ondas Electromagnéticas y Dualidad Campo-Radiación"
        },
        {
                "id": "com-38",
                "titulo": "Gravedad Cero: Atrapadas en el Espacio",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_39.jpg",
                "archivo": "/material/3_comics/GRAVEDAD 0.pdf",
                "autores": "Kerlin Valeria Campo, Katherin Daniela Molina (Geotecnología)",
                "descripcion": "Dos tripulantes en órbita desmienten los mitos comunes sobre la gravedad cero, demostrando que la ingravidez es en realidad una caída libre continua alrededor de la Tierra.",
                "conceptoFisico": "Caída Libre en Órbita, Aceleración Centrípeta y Peso Aparente"
        },
        {
                "id": "com-39",
                "titulo": "Flotón: El Misterio de la Materia Flotante",
                "categoria": "Mecánica de Fluidos",
                "portada": "/assets/comics/cover_40.jpg",
                "archivo": "/material/3_comics/Image_to_PDF_20251202_025649.pdf",
                "autores": "Estudiantes de Ciencias Físicas · Popayán (Univ. del Cauca)",
                "descripcion": "Popayán amanece con estructuras flotando sobre sus tejados: una aventura de ciencia ficción basada en la manipulación controlada de la densidad y la presión hidrostática del aire.",
                "conceptoFisico": "Densidad de Fluidos, Empuje Hidrostático y Equilibrio Flotante"
        },
        {
                "id": "com-40",
                "titulo": "La Carrera del Siglo: Cinemática Relativa",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_41.jpg",
                "archivo": "/material/3_comics/La Carrera Del Siglo.pdf",
                "autores": "Joed David Gaviria Chaves, Eddier Andrés Jurado España",
                "descripcion": "Cinco naves compiten en una nebulosa agonizante durante una ventana crítica de 22 minutos. La victoria exige dominar la aceleración y los sistemas de referencia en movimiento relativo.",
                "conceptoFisico": "Cinemática Relativa, Sistemas de Referencia y Velocidad Vectorial"
        },
        {
                "id": "com-41",
                "titulo": "Voltage Comics: Tres Distritos sin Luz",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_42.jpg",
                "archivo": "/material/3_comics/MAS RECINETE.pdf",
                "autores": "Estudiantes de Ingeniería Eléctrica y Electrónica · Univ. del Cauca",
                "descripcion": "El gran banco de condensadores de 230 kV cede ante la fatiga dieléctrica, dejando tres distritos en tinieblas. Los técnicos aplican leyes de circuitos y capacitancia para aislar la falla.",
                "conceptoFisico": "Capacitores en Alta Tensión, Rigidez Dieléctrica y Energía Almacenada"
        },
        {
                "id": "com-42",
                "titulo": "Submarino Averiado: Hidrostática y Presión",
                "categoria": "Mecánica de Fluidos",
                "portada": "/assets/comics/cover_43.jpg",
                "archivo": "/material/3_comics/MECANICA - COMIC.pdf",
                "autores": "Estudiantes del Curso de Mecánica · Univ. del Cauca",
                "descripcion": "Una nave sumergible queda atascada en una fosa oceánica profunda. Para expulsar agua de los tanques de lastre, los tripulantes deben vencer la inmensa presión hidrostática ejercida por la columna de agua.",
                "conceptoFisico": "Presión Hidrostática, Principio de Pascal y Fuerza de Empuje"
        },
        {
                "id": "com-43",
                "titulo": "Los Imitadores: Motores que No lo Son",
                "categoria": "Termodinámica",
                "portada": "/assets/comics/cover_44.jpg",
                "archivo": "/material/3_comics/cap 7.pdf",
                "autores": "Estudiantes de Termodinámica y Física · Univ. del Cauca",
                "descripcion": "Un falso inventor clama haber creado el motor con 100% de rendimiento. Con las leyes de Carnot y el concepto de entropía, los estudiantes desenmascaran el mito del movimiento perpetuo.",
                "conceptoFisico": "Segunda Ley de la Termodinámica, Rendimiento de Carnot y Entropía"
        },
        {
                "id": "com-44",
                "titulo": "Balancín Cuántico: Dualidad Onda-Partícula",
                "categoria": "Física Moderna",
                "portada": "/assets/comics/cover_45.jpg",
                "archivo": "/material/3_comics/cmicBALANCNCUNTICO.pdf",
                "autores": "Estudiantes del Curso de Física Moderna · Univ. del Cauca",
                "descripcion": "Un parque infantil en la escala atómica donde los columpios operan según la superposición de estados y el Principio de Incertidumbre de Heisenberg.",
                "conceptoFisico": "Principio de Incertidumbre de Heisenberg y Superposición Cuántica"
        },
        {
                "id": "com-45",
                "titulo": "El Choque Cósmico: Estación Momentum Prime",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_46.jpg",
                "archivo": "/material/3_comics/comic (1)-1.pptx_20251203_222150_0000.pdf",
                "autores": "Estudiantes de Física I · Universidad del Cauca",
                "descripcion": "En un cinturón de asteroides inestable, la estación espacial calcula la trayectoria de desviación de un bólido rocoso mediante conservación del momento en colisiones.",
                "conceptoFisico": "Conservación del Momento Lineal en Choques y Aceleración Centrífuga"
        },
        {
                "id": "com-46",
                "titulo": "Misión Newton: El Lanzamiento de Newton-K1",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_47.jpg",
                "archivo": "/material/3_comics/comic (5).pdf",
                "autores": "El Club de los Coheteros (Capítulo II) · Univ. del Cauca",
                "descripcion": "La emocionante secuela del club de cohetería: la prueba del prototipo Newton-K1 midiendo la aceleración real frente a la resistencia del aire y el apogeo.",
                "conceptoFisico": "Arrastre Aerodinámico, Aceleración Instantánea y Leyes de Newton"
        },
        {
                "id": "com-47",
                "titulo": "Montaña Rusa Descontrolada: Energía Mecánica",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_48.jpg",
                "archivo": "/material/3_comics/comic (6).pdf",
                "autores": "Helen Molina, Miguel Delgado, Valentina Idrobo",
                "descripcion": "Fallo crítico en los frenos de una gigantesca montaña rusa: calcular la altura mínima inicial para no desprenderse en el punto superior del rizo invertido salva a todos los ocupantes.",
                "conceptoFisico": "Conservación de la Energía Mecánica, Bucles Verticales y Fuerza Normal Mínima"
        },
        {
                "id": "com-48",
                "titulo": "La Liga de la Justicia: Batalla Centrípeta",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_49.jpg",
                "archivo": "/material/3_comics/comic Fernanda C Isabella M Jhon C_251205_124509.pdf",
                "autores": "Fernanda C., Isabella M., Jhon C.",
                "descripcion": "Los héroes deben desviar una nave enemiga atrapada en un peligroso vórtice circular calculando la aceleración centrípeta y el radio de giro para evitar que se desintegre.",
                "conceptoFisico": "Fuerza Centrípeta, Inercia en Movimiento Circular y Dinámica Radial"
        },
        {
                "id": "com-49",
                "titulo": "La Máquina del Tiempo Incompleta",
                "categoria": "Física Moderna",
                "portada": "/assets/comics/cover_50.jpg",
                "archivo": "/material/3_comics/comic final mecanica impresión.pdf",
                "autores": "Estudiantes del Departamento de Física · Univ. del Cauca",
                "descripcion": "Año 3000: En una Tierra futurista, investigadores intentan activar un motor cronológico descubriendo que la dilatación temporal de la Relatividad Especial exige velocidades cercanas a c.",
                "conceptoFisico": "Dilatación Temporal, Relatividad Especial de Einstein y Cinemática Relativista"
        },
        {
                "id": "com-50",
                "titulo": "Infiltración: El Viaje hacia las Raíces",
                "categoria": "Agrofísica",
                "portada": "/assets/comics/cover_51.jpg",
                "archivo": "/material/3_comics/comic.pdf",
                "autores": "Estudiantes del Curso de Agrofísica · Univ. del Cauca",
                "descripcion": "Dos gotas de agua viajan desde la nube hasta el subsuelo, explicando cómo la tensión superficial, el potencial mátrico y los capilares del suelo nutren a las raíces.",
                "conceptoFisico": "Tensión Superficial, Capilaridad y Física del Agua en el Suelo"
        },
        {
                "id": "com-51",
                "titulo": "Agrofísica: Dinámica de Fluidos en la Planta",
                "categoria": "Agrofísica",
                "portada": "/assets/comics/cover_52.jpg",
                "archivo": "/material/3_comics/comic_agrosfisica_final_2.0.pdf",
                "autores": "Estudiantes de Ingeniería Forestal y Agroforestal · Univ. del Cauca",
                "descripcion": "¿Cómo asciende el agua hasta 80 metros de altura en un eucalipto? Un viaje didáctico por la cohesión-tensión, el potencial hídrico y la transpiración vegetal.",
                "conceptoFisico": "Potencial Hídrico, Cohesión-Tensión y Presión Osmótica en Plantas"
        },
        {
                "id": "com-52",
                "titulo": "Semillas del Futuro: AgroFísica y Bosques",
                "categoria": "Agrofísica",
                "portada": "/assets/comics/cover_53.jpg",
                "archivo": "/material/3_comics/cómic-AgroFísica.pdf",
                "autores": "Estudiantes de Ingeniería Forestal · Univ. del Cauca",
                "descripcion": "En un pueblo rodeado de montañas, los jóvenes aprenden cómo la radiación solar, la temperatura del suelo y la humedad relativa interactúan físicamente para la germinación forestal.",
                "conceptoFisico": "Física de Radiación Térmica, Humedad Relativa y Microclimas Forestales"
        },
        {
                "id": "com-53",
                "titulo": "El Reactor de Corriente Alterna",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_54.jpg",
                "archivo": "/material/3_comics/elReactorDeCorrienteAlterna.pdf",
                "autores": "Leo (Ingeniero) & Dra. Elena · Estudiantes de la Univ. del Cauca",
                "descripcion": "En la planta generadora E-Sigma, Leo y Elena deben sincronizar el transformador de potencia y evitar la sobretensión calculando la relación de espiras y el flujo alterno.",
                "conceptoFisico": "Inducción Electromagnética, Relación de Transformación y Flujo Magnético"
        },
        {
                "id": "com-54",
                "titulo": "Kiro: El Desafío del Ascenso",
                "categoria": "Mecánica",
                "portada": "/assets/comics/cover_55.jpg",
                "archivo": "/material/3_comics/historieta fin.pdf",
                "autores": "Cristina Ruiz, Allan Ortega",
                "descripcion": "Kiro y Kai compiten en la final de escalada deportiva. Cada cambio de presa y apoyo exige dominar el balance del centro de masa, el torque articular y el coeficiente de fricción de la suela.",
                "conceptoFisico": "Biomecánica de la Escalada, Torque de Articulaciones y Fricción Estática"
        },
        {
                "id": "com-55",
                "titulo": "El Enigma del Campo Magnético",
                "categoria": "Electromagnetismo",
                "portada": "/assets/comics/cover_56.jpg",
                "archivo": "/material/3_comics/NOTE.pdf",
                "autores": "Estudiantes del Laboratorio de Electromagnetismo · Univ. del Cauca",
                "descripcion": "Una entretenida historieta gráfica sobre cómo las corrientes circulares en solenoides generan campos magnéticos uniformes capaces de desviar partículas cargadas.",
                "conceptoFisico": "Campo Magnético en Solenoides, Ley de Ampère y Fuerzas Magnéticas"
        },
        {
                "id": "com-56",
                "titulo": "La Física en una Final del Mundo",
                "categoria": "Mecánica & Fluidos",
                "portada": "/assets/comics/cover_57.jpg",
                "archivo": "/material/3_comics/la_fisica_en_una_final_del_mundo.pdf",
                "autores": "Royher Alejandro Bolaños, Yesly Michelly Ortega, Andrés Felipe Fernández",
                "descripcion": "En el tiro libre definitorio de una final del mundo, la física decide el partido: rotación del balón, diferencia de presiones de aire, el efecto Magnus y la parábola perfecta hacia el ángulo.",
                "conceptoFisico": "Efecto Magnus, Aerodinámica de Balón, Rotación Angular y Tiro Parabólico"
        }
]
};
