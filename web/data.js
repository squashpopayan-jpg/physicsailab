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
    
    // Clave Maestra de Administrador (Profesor Mg. Manuel Alejandro Obando)
    // Desbloquea todo el contenido de la plataforma y abre el panel de control docente
    claveAdministrador: "OBANDO-ADMIN-2026",

    // Claves privadas independientes para cada curso
    // Cada clave desbloquea ÚNICAMENTE su materia respectiva (un estudiante de Mecánica no accede a Cuántica a menos que tenga la clave de esa materia)
    clavesCursos: {
        "mecanica": ["MECANICA-2026", "OBANDO-MEC-26"],
        "materiales": ["MATERIALES-2026", "SOLIDOS-UFOP-26"],
        "transformadores": ["TRANSFO-2026", "LAB-TRANS-26"],
        "ondas": ["ONDAS-2026", "VIBRACIONES-26"],
        "neuro": ["RECABLEAR-2026", "NEURO-26"],
        "electromagnetismo": ["ELECTRO-2026", "FIET-EM-26"],
        "ml": ["DATOS-IA-2026", "MACHINE-LEARNING-26"],
        "cuantica": ["CUANTICA-2026", "MODERNA-26"],
        "retie": ["RETIE-2026", "NORMA-RETIE-26"],
        "squash_sim": ["SQUASH-PRO-2026", "MANU-SQUASH-26"],
        "finanzas": ["FINANZAS-2026", "CUENTAS-CLARAS-26"],
        "termo": ["TERMO-2026", "CALOR-TERMO-26", "OBANDO-TERMO-26"],
        "torneos": ["TORNEOS-2026", "SQUASH-POPAYAN-26", "SQUASH-TORNEOS-26"],
        "laboratorio": ["LAB-PROYECTO-2026", "PROYECTO-LAB-26", "OBANDO-LAB-26"],
        "fluidos": ["FLUIDOS-2026", "BERNOULLI-26", "OBANDO-FLUIDOS-26"],
        "guias": ["GUIAS-2026", "MONTAJES-26", "LAB-MONTAJES-26"],
        "ingles": ["INGLES-2026", "QUANTUM-ENGLISH-26", "LEAP-2026"]
    },

    // Configuración oficial de Pasarelas de Pago (Wompi PSE, Bancolombia, Nequi y Hotmart)
    configuracionPasarela: {
        wompi: {
            habilitado: true,
            modo: "produccion", // 'produccion' para pagos reales con Wompi Bancolombia
            linkPago: "https://checkout.wompi.co/l/VPOS_b6GD2z",
            llavePublicaTest: "pub_test_Q5yDA9xoKdePzhSGeVe9HAez7HgGObCi",
            llavePublicaProd: "",
            moneda: "COP"
        },
        pagoDirecto: {
            habilitado: true,
            nequi: "312 874 5821",
            daviplata: "312 874 5821",
            bancolombiaTipo: "Ahorros",
            bancolombiaNumero: "865-000124-91",
            titular: "Mg. Manuel Alejandro Obando",
            whatsapp: "573128745821"
        },
        hotmart: {
            habilitado: true,
            usuario: "@manuel_obando_963654",
            urlBase: "https://hotmart.com"
        }
    },

    cursos: [
        {
            id: "mecanica",
            titulo: "Cuaderno Interactivo de Mecánica Clásica",
            nivel: "Universitario / Preuniversitario",
            modulos: "19 Capítulos Interactivos + Formulario Completo",
            categoria: "Física Fundamental",
            categoriaFiltro: "fundamental",
            descripcion: "Suite computacional completa que cubre desde medición y cálculo vectorial hasta leyes de Newton, diagramas de cuerpo libre (DCL), fluidos, oscilaciones, ondas y sonido. Incluye 83 motores de simulación física en tiempo real para experimentar con cada ecuación.",
            temas: [
                "01. Medición y Conversiones",
                "02. Vectores y Álgebra",
                "03. Movimiento en 1D",
                "04. Movimiento en 2D (Tiro Parabólico)",
                "05. Las Leyes de Newton",
                "06. Las Fuerzas y el Diagrama de Cuerpo Libre (DCL)",
                "07. Aplicaciones de las Leyes de Newton",
                "08. Trabajo y Energía Cinética",
                "09. Conservación de la Energía",
                "10. Momento Lineal y Colisiones",
                "11. Cinemática Rotacional",
                "12. Torque y Dinámica Rotacional",
                "13. Momento Angular",
                "14. Equilibrio Estático y Elasticidad",
                "15. Gravitación Universal",
                "16. Mecánica de Fluidos",
                "17. Oscilaciones y M.A.S.",
                "18. Ondas Mecánicas",
                "19. Física del Sonido"
            ],
            destacado: true,
            tipo: "Cuaderno Interactivo HTML5/JS",
            demoPath: "/material/1_cursos/mecanica/dist/index.html",
            precioEstimado: "$29 USD (~$115.000 COP)",
            precioCOP: 115000,
            precioUSD: 29,
            valorReal: "$49 USD",
            descuentoTag: "40% OFF Lanzamiento",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "materiales",
            titulo: "Ciencia de los Materiales: del Enlace al Diseño",
            nivel: "Universitario / Maestría / Ingeniería",
            modulos: "27 Capítulos Interactivos + Formulario + Validación SciPy",
            categoria: "Ciencia de Materiales & Sólidos",
            categoriaFiltro: "materiales",
            descripcion: "Obra insignia de maestría del autor: desde el enlace químico, defectos cristalinos y difusión hasta diagramas de fases (Fe-C), tratamientos térmicos, fractura, fatiga, cerámicos, polímeros, propiedades magnéticas, corrosión y mapas de selección de Ashby.",
            temas: [
                "01. Introducción y Familias de Materiales",
                "02. Enlace Químico y Potenciales Interatómicos",
                "03. Estructuras Cristalinas y Redes de Bravais",
                "04. Cristalografía, Índices de Miller y Planos",
                "05. Difracción de Rayos X (Ley de Bragg)",
                "06. Defectos Cristalinos y Vacancias",
                "07. Difusión en Sólidos (Leyes de Fick)",
                "08. Ensayos de Tracción y Propiedades Mecánicas",
                "09. Deformación Plástica y Dislocaciones",
                "10. Mecánica de la Fractura (Criterio de Griffith)",
                "11. Fatiga de Materiales y Curvas S-N",
                "12. Diagramas de Fases Binarios",
                "13. Diagrama Hierro-Carbono (Fe-C) y Aceros",
                "14. Transformaciones de Fase y Curvas TTT",
                "15. Tratamientos Térmicos Industriales",
                "16. Metales y Aleaciones de Ingeniería",
                "17. Materiales Cerámicos y Vidrios",
                "18. Polímeros y Estructura Molecular",
                "19. Materiales Compuestos (Composites)",
                "20. Propiedades Eléctricas y Semiconductores",
                "21. Propiedades Dieléctricas y Piezoeléctricos",
                "22. Propiedades Térmicas y Capacidad Calorífica",
                "23. Propiedades Magnéticas y Dominios",
                "24. Propiedades Ópticas y Fotónica",
                "25. Corrosión y Degradación Electroquímica",
                "26. Selección de Materiales y Mapas de Ashby",
                "27. Nanomateriales y Nanotecnología",
                "98. Formulario & Validación Numérica SciPy"
            ],
            destacado: true,
            tipo: "Cuaderno Interactivo HTML5/JS",
            demoPath: "/material/1_cursos/materiales/dist/index.html",
            precioEstimado: "$35 USD (~$140.000 COP)",
            precioCOP: 140000,
            precioUSD: 35,
            valorReal: "$69 USD",
            descuentoTag: "Especialidad Maestría UFOP",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "transformadores",
            titulo: "Laboratorio de Transformadores",
            nivel: "Ingeniería / Tecnología Eléctrica",
            modulos: "Banco Libre con 24 Kits Calibrados",
            categoria: "Laboratorio Virtual",
            categoriaFiltro: "materiales",
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
            precioCOP: 155000,
            precioUSD: 39,
            valorReal: "$89 USD",
            descuentoTag: "Laboratorio Insignia",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "ondas",
            titulo: "Cuaderno Interactivo de Vibraciones y Ondas",
            nivel: "Universitario / Ingeniería",
            modulos: "24 Capítulos Interactivos + Simuladores Numéricos",
            categoria: "Oscilaciones, Acústica & Óptica",
            categoriaFiltro: "fundamental",
            descripcion: "Tratado interactivo exhaustivo que cubre desde osciladores armónicos, péndulos caóticos y sistemas acoplados, hasta la ecuación de onda 1D/2D, series de Fourier, efecto Doppler, acústica arquitectónica, interferencia, difracción y óptica electromagnética.",
            temas: [
                "01. Movimiento Armónico Simple & Péndulos",
                "02. Oscilaciones Amortiguadas y Forzadas (Resonancia)",
                "03. Osciladores Eléctricos & Sistemas Acoplados",
                "04. Ecuación de Onda 1D & Ondas Armónicas",
                "05. Reflexión, Transmisión y Ondas Estacionarias",
                "06. Análisis Espectral y Series de Fourier",
                "07. Acústica Arquitectónica, Sonido & Efecto Doppler",
                "08. Ondas en 2D, Interferencia, Difracción y Óptica Ondulatoria"
            ],
            destacado: true,
            tipo: "Cuaderno Interactivo HTML5/JS",
            demoPath: "/material/1_cursos/ondas/dist/index.html",
            precioEstimado: "$29 USD (~$115.000 COP)",
            precioCOP: 115000,
            precioUSD: 29,
            valorReal: "$49 USD",
            descuentoTag: "40% OFF Lanzamiento",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "neuro",
            titulo: "Recablear: Neurociencia, Plasticidad y Aprendizaje Motor",
            nivel: "Universitario / Multidisciplinar / Ciencias del Deporte",
            modulos: "31 Capítulos Interactivos + Test de Hábitos + Medidor Personal",
            categoria: "Neurociencia & Biomecánica Motora",
            categoriaFiltro: "ia",
            descripcion: "Tratado exhaustivo de neuroplasticidad, sinapsis y aprendizaje motor con evidencia científica contrastada. Desmonta neuromitos, modela la regla de Hebb y circuitos de dopamina, optimiza la formación de hábitos, control del movimiento atlético y recuperación cognitiva.",
            temas: [
                "01. La Neurona, Canales Iónicos y Potencial de Acción",
                "02. Sinapsis, Neurotransmisores y Transmisión Química",
                "03. Neuroplasticidad, Regla de Hebb y Potenciación a Largo Plazo",
                "04. Consolidación de la Memoria y Engramas",
                "05. Mapas Corticales y Reorganización Cerebral",
                "06. El Sistema de Recompensa y Vía Mesolímbica de Dopamina",
                "07. Modelado Computacional del Aprendizaje",
                "08. Análisis Crítico de la PNL frente a la Neurociencia",
                "09. Sistemas Complejos y Redes Neuronales Biológicas",
                "10. Psicología del Cambio Conductual y Hábitos (B.J. Fogg & Clear)",
                "11. Control Motor, Propiocepción y Aprendizaje en el Deporte",
                "12. Foco Atencional, Fatiga Mental y Corteza Prefrontal",
                "13. Ejercicio Físico, Neurobiogénesis y BDNF",
                "14. Bioenergética Mitocondrial y Metabolismo Cerebral",
                "15. Regulación Neuroendocrina del Sueño y Recuperación",
                "16. Neurorrehabilitación y Terapias Neurales con Evidencia",
                "17. Plan Integral de Recableado y Rendimiento Deportivo"
            ],
            destacado: true,
            tipo: "Cuaderno Interactivo HTML5/JS",
            demoPath: "/material/1_cursos/neuro/dist/index.html",
            precioEstimado: "$35 USD (~$140.000 COP)",
            precioCOP: 140000,
            precioUSD: 35,
            valorReal: "$59 USD",
            descuentoTag: "Neurociencia Aplicada",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "electromagnetismo",
            titulo: "Atlas Interactivo de Electromagnetismo",
            nivel: "Universitario / Ingeniería",
            modulos: "Campos, Flujo y Leyes de Maxwell",
            categoria: "Electromagnetismo",
            categoriaFiltro: "fundamental",
            descripcion: "Entorno interactivo para la visualización de líneas de fuerza, potencial eléctrico, inducción de Faraday y ondas electromagnéticas.",
            temas: [
                "Ley de Coulomb y Campo Eléctrico", "Ley de Gauss y Superficies",
                "Potencial Eléctrico y Gradiente", "Leyes de Biot-Savart y Ampère",
                "Inducción de Faraday y Lenz", "Ecuaciones de Maxwell"
            ],
            destacado: false,
            tipo: "Atlas Interactivo Computacional",
            demoPath: "/material/1_cursos/electromagnetismo/dist/index.html",
            precioEstimado: "$29 USD (~$115.000 COP)",
            precioCOP: 115000,
            precioUSD: 29,
            valorReal: "$49 USD",
            descuentoTag: "40% OFF Lanzamiento",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "ml",
            titulo: "Aprender de los Datos: Machine Learning y Redes Neuronales",
            nivel: "Universitario / Profesional / IA Aplicada",
            modulos: "12 Módulos Interactivos + Prácticas Validadas con scikit-learn",
            categoria: "Inteligencia Artificial & Ciencia de Datos",
            categoriaFiltro: "ia",
            descripcion: "Fundamento matemático y computacional del aprendizaje automático moderno: regresión, descenso de gradiente estocástico, clasificación logística, árboles de decisión, Random Forest, K-Means, PCA, redes neuronales profundas (MLP) y diagnóstico de overfitting.",
            temas: [
                "01. Fundamentos y Taxonomía del Aprendizaje Automático",
                "02. Regresión Lineal, Función de Costo y Regularización Ridge/Lasso",
                "03. Descenso de Gradiente (Batch, Mini-Batch y Estocástico)",
                "04. Clasificación Logística, Matrices de Confusión y Curvas ROC",
                "05. Árboles de Decisión y Ganancia de Información (Gini / Entropía)",
                "06. Métodos de Ensamble: Random Forest y Gradient Boosting",
                "07. Aprendizaje No Supervisado: K-Means Clustering y Reducción PCA",
                "08. Redes Neuronales Artificiales y Perceptrón Multicapa (MLP)",
                "09. Retropropagación (Backpropagation) y Derivadas de Pérdida",
                "10. Diagnóstico de Sesgo vs. Varianza (Underfitting vs Overfitting)",
                "11. Validación Cruzada, Pipeline de Datos e Hiperparámetros",
                "12. Casos de Estudio en Python y Validación Numérica"
            ],
            destacado: false,
            tipo: "Laboratorio Computacional de IA",
            demoPath: "/material/1_cursos/ml/dist/index.html",
            precioEstimado: "$39 USD (~$155.000 COP)",
            precioCOP: 155000,
            precioUSD: 39,
            valorReal: "$79 USD",
            descuentoTag: "Especialidad IA UNIR",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "cuantica",
            titulo: "Exploraciones en Física Cuántica Interactiva",
            nivel: "Avanzado / Universitario",
            modulos: "Simulaciones Cuánticas Numéricas",
            categoria: "Física Cuántica Moderna",
            categoriaFiltro: "fundamental",
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
            precioCOP: 140000,
            precioUSD: 35,
            valorReal: "$59 USD",
            descuentoTag: "Física Avanzada",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "retie",
            titulo: "Especialización Práctica en Normativa RETIE",
            nivel: "Ingenieros y Técnicos Electricistas",
            modulos: "Auditoría, Diseño e Instalaciones",
            categoria: "Ingeniería Eléctrica Aplicada",
            categoriaFiltro: "materiales",
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
            precioCOP: 195000,
            precioUSD: 49,
            valorReal: "$99 USD",
            descuentoTag: "Aplicación Normativa",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "squash_sim",
            titulo: "Física del Deporte: Simulador de Squash",
            nivel: "Deportistas, Entrenadores & Física Aplicada",
            modulos: "Rutinas Pre-generadas + Editor Táctico y Biomecánico",
            categoria: "Física del Deporte & Simulación 3D",
            categoriaFiltro: "aplicada",
            descripcion: "Entorno interactivo de cinemática y biomecánica en cancha. La vista previa incluye reproducción de rutinas tácticas pre-generadas; adquiere o desbloquea la licencia para personalizar trayectorias, manipular controles en tiempo real, exportar datos y acceder al análisis muscular.",
            temas: [
                "01. Cinemática de Desplazamiento y Cobertura desde la T",
                "02. Cadena Cinética y Transferencia de Momento en Estocada",
                "03. Termodinámica del Balón y Coeficiente de Restitución",
                "04. Ángulos de Rebote y Física de Paredes (Boast, Nick, Drop)",
                "05. Análisis Muscular y Prevención de Lesiones",
                "06. Editor Táctico de Rutinas Personalizadas y Exportación"
            ],
            destacado: false,
            tipo: "Simulador Táctico & Biomecánico",
            demoPath: "/material/1_cursos/squash_sim/dist/index.html",
            precioEstimado: "$25 USD (~$99.000 COP)",
            precioCOP: 99000,
            precioUSD: 25,
            valorReal: "$45 USD",
            descuentoTag: "Acceso Premium / Demo de Rutinas",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "finanzas",
            titulo: "Cuentas Claras: Psicología del Dinero y Matemática Financiera",
            nivel: "Universitario / General / Planificación Financiera",
            modulos: "10 Módulos Interactivos + Calculadoras de Interés Real e Inflación",
            categoria: "Finanzas Cuantitativas & Psicología",
            categoriaFiltro: "aplicada",
            descripcion: "Modelos cuantitativos para la toma de decisiones económicas: sesgos cognitivos del inversor, matemática del interés compuesto, amortización de créditos, fondos de emergencia, inversión pasiva indexada y planificación para la independencia financiera.",
            temas: [
                "01. Psicología Financiera: Creencias, Impulsividad y Sesgos",
                "02. Matemática del Interés Simple y Compuesto en Tiempo Real",
                "03. Inflación, Tasa Real y Preservación del Poder Adquisitivo",
                "04. Presupuesto Base Cero y Gestión de Flujo de Caja",
                "05. Estrategias de Desendeudamiento: Método Avalancha vs. Bola de Nieve",
                "06. Fondos de Emergencia, Seguros y Gestión de Riesgo Patrimonial",
                "07. Inversión Indexada a Largo Plazo y Diversificación Global",
                "08. Matemática del Retiro e Independencia Financiera (Regla del 4%)",
                "09. Detección Matemática de Esquemas Piramidales y Fraudes",
                "10. Hoja de Ruta de Finanzas Personales 2026"
            ],
            destacado: false,
            tipo: "Cuaderno Interactivo HTML5/JS",
            demoPath: "/material/1_cursos/finanzas/dist/index.html",
            precioEstimado: "$25 USD (~$99.000 COP)",
            precioCOP: 99000,
            precioUSD: 25,
            valorReal: "$49 USD",
            descuentoTag: "Finanzas Personales",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "termo",
            titulo: "Termodinámica Computacional & Mecánica Estadística",
            nivel: "Ingeniería / Física Universitaria / Ciencias Aplicadas",
            modulos: "25 Capítulos Interactivos + Validación CoolProp / SciPy",
            categoria: "Física Fundamental & Termodinámica",
            categoriaFiltro: "fundamental",
            descripcion: "Tratado computacional exhaustivo: desde la ley cero y la ecuación de estado hasta ciclos de potencia (Rankine, Brayton, Diesel, Otto), psicrometría, mecánica estadística, gases cuánticos (Fermi-Dirac, Bose-Einstein) y termodinámica del no-equilibrio.",
            temas: [
                "01. Temperatura, Ley Cero y Escalas Termométricas",
                "02. Ecuación de Estado de Gas Ideal y Compresibilidad",
                "03. Propiedades de Sustancia Pura, Domos de Vapor y Diagramas T-s/P-v",
                "04. Gases Reales: Van der Waals, Redlich-Kwong y Factor Z",
                "05. Trabajo de Frontera Móvil, Calor y Formas de Energía",
                "06. Primera Ley de la Termodinámica para Sistemas Cerrados",
                "07. Procesos con Gases Ideales: Isotérmico, Isobárico, Isocórico y Adiabático",
                "08. Volúmenes de Control: Conservación de Masa y Energía en Flujo Estacionario",
                "09. Mecanismos de Transferencia de Calor: Conducción, Convección y Radiación",
                "10. Segunda Ley de la Termodinámica, Kelvin-Planck, Clausius y Máquinas Térmicas",
                "11. Entropía, Desigualdad de Clausius y Generación de Entropía",
                "12. Exergía, Disponibilidad y Rendimiento de Segunda Ley",
                "13. Ciclos de Potencia de Gas: Otto, Diesel, Dual y Turbinas Brayton",
                "14. Ciclos de Potencia de Vapor: Ciclo Rankine Simple, Sobrecalentado y Regenerativo",
                "15. Ciclos de Refrigeración por Compresión de Vapor y Bombas de Calor",
                "16. Relaciones Termodinámicas Generales, Ecuaciones Tds y Relaciones de Maxwell",
                "17. Mezclas de Gases, Psicrometría y Acondicionamiento de Aire",
                "18. Equilibrio de Fases y Reacciones Químicas",
                "19. Termoquímica, Combustión y Entalpía de Reacción",
                "20. Microestados, Macroestados y Ensamble Microcanónico",
                "21. Distribución de Maxwell-Boltzmann y Función de Partición",
                "22. Gases Cuánticos: Condensación de Bose-Einstein y Gas de Fermi",
                "23. Termodinámica de No-Equilibrio, Sistemas Abiertos y Teorema de Prigogine",
                "24. Información, Entropía de Shannon y Termodinámica de Sistemas Vivos",
                "25. Formulario Integrado, Calculadoras Numéricas y Suite de Validación"
            ],
            destacado: true,
            tipo: "Cuaderno Computacional Interactivo",
            demoPath: "/material/1_cursos/termo/dist/index.html",
            precioEstimado: "$39 USD (~$155.000 COP)",
            precioCOP: 155000,
            precioUSD: 39,
            valorReal: "$80 USD",
            descuentoTag: "Nuevo · 25 Capítulos",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "torneos",
            titulo: "Torneos Squash Popayán: Gestión, Cuadros & Arbitraje en Vivo",
            nivel: "Directores de Torneo, Árbitros, Clubes & Jugadores",
            modulos: "Gestor Oficial v15 + Cuadros Eliminatorios + Marcador PWA Offline",
            categoria: "Gestión Deportiva & PWA",
            categoriaFiltro: "aplicada",
            descripcion: "Aplicación web progresiva (PWA) de nivel profesional para la administración integral de torneos de squash: cuadros de eliminación directa y fase de grupos, siembra oficial, prevención automática de cruces de horario, arbitraje en vivo con sincronización punto a punto en Firebase, soporte offline y exportación a PDF.",
            temas: [
                "01. Gestión de Jugadores e Inscripciones Multi-Categoría (hasta 8 categorías)",
                "02. Fase de Grupos con Desempate Oficial (enfrentamiento directo y mini-tablas)",
                "03. Cuadros de Playoffs y Eliminación Directa con Siembra Estándar",
                "04. Programación Inteligente de Horarios con Prevención de Conflictos de Cancha",
                "05. Marcador de Arbitraje en Vivo: Pantalla Bloqueada, Vibración y Atajos de Teclado",
                "06. Sincronización Punto a Punto en Firebase y Tolerancia a Fallos Offline",
                "07. Panel de Acceso Administrador (PIN) y Claves Dinámicas para Jueces de Cancha",
                "08. Vista General en Vivo para Espectadores y Generación de Reportes PDF"
            ],
            destacado: true,
            esLaboratorio: true,
            tipo: "Aplicación Web / PWA Deportiva",
            demoPath: "/material/1_cursos/torneos/dist/index.html",
            precioEstimado: "$29 USD (~$115.000 COP)",
            precioCOP: 115000,
            precioUSD: 29,
            valorReal: "$60 USD",
            descuentoTag: "Versión 15 Oficial",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "laboratorio",
            titulo: "Proyecto Laboratorio: Kits de Física de Bajo Costo",
            nivel: "Universitario / Ingeniería / Física Experimental",
            modulos: "38 Capítulos Interactivos + 36 Simuladores + Banco LEGO & ESP32",
            categoria: "Laboratorio Virtual & Maker",
            categoriaFiltro: "materiales",
            descripcion: "Kits de física de bajo costo con el celular, la placa microcontroladora ESP32, MIT App Inventor y estructuras LEGO. Contiene 38 guías prácticas experimentales paso a paso, simuladores interactivos, analizador de mínimos cuadrados e incertidumbres, y generador automático de informes para mecánica, electromagnetismo y fluidos.",
            temas: [
                "00. Inicio & Metodología de Laboratorio de Bolsillo",
                "01. Kit de Componentes, Sensores y Calibración",
                "02. Medición, Incertidumbres y Propagación de Errores",
                "03. Adquisición de Señales Analógicas y Digitales",
                "04. El Teléfono Inteligente como Laboratorio Móvil",
                "05. Adquisición Avanzada de Datos con Phyphox",
                "06. Microcontrolador ESP32: WiFi, BLE y Telemetría",
                "07. Módulos de Sensores y Actuadores de Precisión",
                "08. MIT App Inventor: Creación de Apps de Medición",
                "09. Montajes Experimentales y Estructuras con LEGO",
                "20. Mecánica: Caída Libre y Aceleración de la Gravedad",
                "21. Mecánica: Plano Inclinado y Fuerzas",
                "22. Mecánica: Péndulo Simple y No Lineal",
                "23. Mecánica: Oscilador Masa-Resorte (M.A.S.)",
                "24. Mecánica: Movimiento Circular y Fuerza Centrípeta",
                "25. Mecánica: Choques y Conservación del Momento",
                "26. Mecánica: Máquina de Atwood y Tensiones",
                "27. Mecánica: Dinámica de Rodadura sin Deslizamiento",
                "28. Mecánica: Fricción Estática y Cinética",
                "30. Electromagnetismo: Ley de Ohm y Circuitos DC",
                "31. Electromagnetismo: Transitorios en Circuitos RC",
                "32. Electromagnetismo: Campo Magnético de un Dipolo",
                "33. Electromagnetismo: Galvanómetro de Tangentes y Campo Terrestre",
                "34. Electromagnetismo: Fuerza sobre Conductor con Corriente",
                "35. Electromagnetismo: Inducción y Ley de Faraday",
                "36. Electromagnetismo: Corrientes de Foucault y Freno Magnético",
                "37. Electromagnetismo: Polarización de la Luz y Ley de Malus",
                "40. Fluidos: Presión Atmosférica y Barometría",
                "41. Fluidos: Presión Hidrostática y Principio de Pascal",
                "42. Fluidos: Principio de Arquímedes y Empuje",
                "43. Fluidos: Ley de Boyle-Mariotte en Gases",
                "44. Fluidos: Vaciado de Tanques y Ley de Torricelli",
                "45. Fluidos: Viscosidad y Ley de Stokes",
                "46. Fluidos: Coeficiente de Arrastre Aerodinámico",
                "47. Fluidos: Tensión Superficial en Líquidos",
                "48. Fluidos: Resonador de Helmholtz y Acústica",
                "90. Analizador de Datos, Ajuste Lineal y Mínimos Cuadrados",
                "91. Generador Automático de Informes y Bitácora de Práctica"
            ],
            destacado: true,
            tipo: "Laboratorio Virtual & Cuaderno Experimental",
            esLaboratorio: true,
            demoPath: "/material/1_cursos/laboratorio/dist/index.html",
            precioEstimado: "$35 USD (~$140.000 COP)",
            precioCOP: 140000,
            precioUSD: 35,
            valorReal: "$79 USD",
            descuentoTag: "Nuevo · 38 Prácticas",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "fluidos",
            titulo: "Física de Fluidos: del Medio Continuo a la Turbulencia",
            nivel: "Universitario / Ingeniería / Física",
            modulos: "27 Capítulos Interactivos + Formulario + Banco CFD",
            categoria: "Física Fundamental & Medios Continuos",
            categoriaFiltro: "fundamental",
            descripcion: "Curso computacional interactivo y matemáticamente riguroso sobre hidrostática, dinámica de fluidos ideales y reales, deducción de Navier-Stokes, capa límite, turbulencia de Kolmogorov, ondas en agua y simulación CFD en tiempo real. Elaborado por el Mg. Manuel Alejandro Obando (Universidad del Cauca).",
            temas: [
                "01. La Hipótesis del Continuo y el Tensor de Esfuerzos de Cauchy",
                "02. Propiedades Termofísicas, Densidad, Compresibilidad y Viscosidad",
                "03. Hidrostática, Manometría y Distribución de Presiones en Campos Gravitatorios",
                "04. Flotación, Principio de Arquímedes y Criterio de Estabilidad del Metacentro",
                "05. Tensión Superficial, Ecuación de Young-Laplace y Capilaridad",
                "06. Cinemática de Fluidos: Campos de Velocidad, Vórtices y Descripción Euleriana",
                "07. Ecuación de Bernoulli: Deducción, Líneas de Corriente y Tubo de Pitot",
                "08. Teorema de Transporte de Reynolds y Conservación del Momentum Lineal",
                "09. Conservación de la Energía, Primera Ley y Ecuación de Pérdidas de Carga",
                "10. Ecuaciones Diferenciales de Navier-Stokes: Deducción Completa",
                "11. Análisis Dimensional, Teorema Pi de Buckingham y Semejanza Dinámica",
                "12. Flujos Viscosos Laminares: Flujo de Stokes, Poiseuille y Couette",
                "13. Capa Límite Laminar y Turbulenta de Prandtl y Desprendimiento",
                "14. Fenomenología de la Turbulencia: Cascadas de Energía y Escalas de Kolmogorov",
                "15. Flujo en Redes de Tuberías, Pérdidas Primarias/Secundarias y Diagrama de Moody",
                "16. Fuerzas de Arrastre, Sustentación Aerodinámica y Resistencia de Forma",
                "17. Flujo Potencial Incompresible, Función de Corriente y Redes de Flujo",
                "18. Dinámica de la Vorticidad, Teorema de Kelvin y Vórtices de Rankine",
                "19. Ondas en Superficie Libre de Agua: Ondas Cortas, Largas y Dispersión",
                "20. Flujo en Canales Abiertos, Energía Específica y Resalto Hidráulico",
                "21. Dinámica de Gases y Flujo Compresible 1D con Número de Mach",
                "22. Ondas de Choque Normales, Choques Oblicuos y Expansión de Prandtl-Meyer",
                "23. Inestabilidades Hidrodinámicas (Rayleigh-Taylor, Kelvin-Helmholtz y Bénard)",
                "24. Flujos en Sistemas en Rotación, Efecto Coriolis y Vórtice Geostrófico",
                "25. Análisis Complejo en Fluidos: Transformación de Joukowsky y Perfiles Alares",
                "26. Métodos Numéricos CFD: Volúmenes Finitos y Simulación en el Navegador",
                "27. Formulario Oficial, Suite de Validación Numérica y Bibliografía Universitaria"
            ],
            destacado: true,
            tipo: "Cuaderno Computacional Interactivo",
            demoPath: "/material/1_cursos/fluidos/dist/index.html",
            precioEstimado: "$29 USD (~$115.000 COP)",
            precioCOP: 115000,
            precioUSD: 29,
            valorReal: "$59 USD",
            descuentoTag: "Nuevo Lanzamiento 2026",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "guias",
            titulo: "Guías y Montajes de Laboratorio de Física",
            nivel: "Educación Media & Universitaria (Grados 10.°, 11.° y Universidad)",
            modulos: "46 Prácticas Experimentales + Generador Word + NTC 4595:2025",
            categoria: "Física Experimental & Didáctica",
            categoriaFiltro: "materiales",
            descripcion: "Cuaderno interactivo para elaborar guías y montajes experimentales de física conforme a los lineamientos curriculares del MEN, estándares ICFES Saber 11.°, NTC 4595:2025 y seguridad GTC 45. Incluye 46 montajes con materiales de bajo costo y equipos avanzados, tratamiento riguroso de incertidumbres, bancos virtuales y generador automatizado de guías en Word.",
            temas: [
                "01. Marco Normativo MEN, Derechos Básicos de Aprendizaje (DBA) y Prueba Saber 11.°",
                "02. Diseño de Espacios de Laboratorio bajo Norma Técnica Colombiana NTC 4595:2025",
                "03. Seguridad Ocupacional y Matriz de Riesgos según Guía Técnica Colombiana GTC 45",
                "04. Rúbricas de Evaluación Basadas en Evidencias y Competencias Científicas",
                "05. Propósito Pedagógico del Laboratorio Experimental en Ciencias Naturales",
                "06. Anatomía y Estructura Editorial de una Guía de Laboratorio Didáctica",
                "07. Generador Automatizado de Guías en Formato Word (.docx) descargable",
                "08. Teoría de Errores, Incertidumbre Tipo A/B y Propagación según la GUM",
                "09. Análisis Gráfico, Ajuste de Curvas y Regresión Lineal por Mínimos Cuadrados",
                "10. Redacción del Informe Científico de Laboratorio en Formato IEEE / Revista",
                "11. Taller Maker de Construcción de Instrumentos de Medición Caseros",
                "12. Calibración de Instrumentos: Calibrador Pie de Rey, Micrómetro y Balanza",
                "13. Sensores Electrónicos, Microcontroladores Arduino y Adquisición Digital",
                "14-23. Prácticas de Mecánica (Péndulo, Cinemática, Resortes, Fricción, Newton, Choques)",
                "24-25. Prácticas de Fluidos (Hidrostática, Principio de Pascal y Vaciado de Torricelli)",
                "26-27. Prácticas de Termodinámica (Calorimetría y Equivalente Mecánico del Calor)",
                "28-33. Prácticas de Ondas y Óptica (Leyes de Snell, Lentes Delgadas, Difracción y Polarización)",
                "34-37. Prácticas de Electromagnetismo (Ley de Coulomb, Circuitos RC y Ley de Faraday)",
                "38-46. Montajes Especiales (Riel de Aire, Tubo de Melde, Constante de Planck y Motor DC)"
            ],
            destacado: true,
            esLaboratorio: true,
            tipo: "Cuaderno Interactivo + Generador Word",
            demoPath: "/material/1_cursos/guias/dist/index.html",
            precioEstimado: "$29 USD (~$115.000 COP)",
            precioCOP: 115000,
            precioUSD: 29,
            valorReal: "$59 USD",
            descuentoTag: "Nuevo Lanzamiento 2026",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "ingles",
            titulo: "Quantum Leap English: Inglés Técnico & Científico",
            nivel: "Multinivel (Niveles Cuánticos desde A1 Fundamental hasta C1 Ionización)",
            modulos: "15 Capítulos + Fonética Acústica IPA + Abstracts + Papers",
            categoria: "Habilidades Profesionales & Idiomas",
            categoriaFiltro: "aplicada",
            descripcion: "Método interactivo y secuencial de inglés diseñado específicamente para físicos, científicos e ingenieros. Estructurado como un diagrama de niveles cuánticos de energía: domina la fonética IPA, vocabulario técnico de laboratorio, voz pasiva para redacción de papers indexados (IEEE/APS) y oratoria para conferencias internacionales.",
            temas: [
                "01. Ground State A1: Estructura del Idioma y Verbo To Be en Ciencia y Laboratorio",
                "02. Pronombres, Posesivos y Vocabulario Técnico de Equipos y Materiales",
                "03. Present Simple & Routine: Descripción de Procedimientos Experimentales",
                "04. Fonética Acústica IPA: Vocales y Consonantes Críticas para Hispanohablantes",
                "05. Past Simple & Reporting: Cómo Reportar Observaciones y Mediciones Anteriores",
                "06. Level A2: Comparativos, Mediciones Numéricas y Propiedades de la Materia",
                "07. Present Continuous & Procesos Dinámicos en Tiempo Real",
                "08. Verbos Modales: Deducción Lógica, Incertidumbre y Probabilidad Teórica",
                "09. Level B1: Voz Pasiva Rigurosa en la Sección de Metodología de Papers",
                "10. First & Second Conditionals: Planteamiento de Hipótesis y Consecuencias Físicas",
                "11. Present Perfect vs. Past Simple en Estado del Arte y Revisiones Bibliográficas",
                "12. Level B2: Causalidad, Conectores Lógicos y Cohesión de Párrafos Científicos",
                "13. Redacción de Abstracts e Introducciones para Revistas Indexadas (APS, Elsevier, IEEE)",
                "14. Preparación de Diapositivas, Gráficos y Defensa Oral en Congresos Internacionales",
                "15. Level C1 Ionization: Peer Review, Respuesta a Evaluadores y Negociación Académica"
            ],
            destacado: true,
            tipo: "Plataforma Interactiva Multinivel",
            demoPath: "/material/1_cursos/ingles/dist/index.html",
            precioEstimado: "$29 USD (~$115.000 COP)",
            precioCOP: 115000,
            precioUSD: 29,
            valorReal: "$69 USD",
            descuentoTag: "Nuevo Lanzamiento 2026",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
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
            curso: "Electromagnetismo",
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
    ],

    // Datos Curiosos y Fascinantes de la Física (Rotación Diaria Dinámica de 31 hechos científicos)
    datosCuriosos: [
        {
            id: "dato-1",
            categoria: "Squash & Deporte",
            categoriaTag: "squash",
            icono: "🎾",
            titulo: "¿Por qué la pelota de squash no rebota si está fría?",
            descripcion: "A diferencia del tenis, la pelota de squash está fabricada con caucho butílico crudo de alta histéresis. En reposo a 20°C, absorbe casi toda la energía cinética del impacto convirtiéndola en calor interno. Solo al pelotear intensamente alcanza entre 45°C y 55°C; a esa temperatura, las cadenas de polímero ganan elasticidad y el aire atrapado en su interior aumenta de presión interna según la ley de Gay-Lussac (P ∝ T), reactivando el rebote dinámico.",
            principio: "Termodinámica de Gases (P ∝ T) & Histéresis Viscoelástica del Caucho"
        },
        {
            id: "dato-2",
            categoria: "Relatividad & Cosmos",
            categoriaTag: "relatividad",
            icono: "🛰️",
            titulo: "Si el GPS no usara a Einstein, Google Maps fallaría por 11 km al día",
            descripcion: "Los satélites de posicionamiento GPS orbitan a 20.200 km de altitud a más de 14.000 km/h. Por la Relatividad Especial (velocidad), sus relojes atómicos atrasan 7 microsegundos diarios frente a la Tierra; pero por la Relatividad General (campo gravitatorio más débil en el espacio), adelantan 45 microsegundos al día. La diferencia neta (+38 microsegundos por día) provocaría un error acumulado de 11.4 kilómetros diarios si los ingenieros no corrigieran las fórmulas relativistas.",
            principio: "Relatividad Especial de Lorentz & Dilatación Gravitacional del Tiempo (Einstein)"
        },
        {
            id: "dato-3",
            categoria: "Ondas & Electromagnetismo",
            categoriaTag: "ondas",
            icono: "⚡",
            titulo: "Un relámpago es 5 veces más caliente que la superficie del Sol",
            descripcion: "La descarga eléctrica de un rayo transporta entre 20.000 y 200.000 amperios de corriente continua en una fracción de milisegundo. Este colosal flujo iónico calienta el canal de plasma de aire circundante a temperaturas de hasta 30.000 Kelvin (unos 29.700 °C), mientras que la fotosfera visible del Sol ronda apenas los 5.778 K. La violenta expansión supersónica del aire provocada por este choque térmico crea la onda acústica que llamamos trueno.",
            principio: "Efecto Joule Extremo (Q = I²·R·t) & Ondas de Choque Hidrodinámicas"
        },
        {
            id: "dato-4",
            categoria: "Cuántica & Tecnología",
            categoriaTag: "cuantica",
            icono: "💾",
            titulo: "El Efecto Túnel Cuántico permite que funcione tu memoria USB y SSD",
            descripcion: "En la física clásica, si una partícula no tiene suficiente energía cinética para saltar una barrera potencial, rebota inevitablemente. Pero a escala cuántica, la función de onda de un electrón tiene una probabilidad finita de 'atravesar' la barrera como un fantasma. Las celdas de memoria Flash (NAND) de tu teléfono y computadora inyectan electrones a través de un aislante de óxido de silicio de 10 nanómetros mediante efecto túnel Fowler-Nordheim, almacenando tus datos durante años sin gastar batería.",
            principio: "Mecánica Cuántica, Ecuación de Schrödinger & Efecto Túnel (Fowler-Nordheim)"
        },
        {
            id: "dato-5",
            categoria: "Squash & Deporte",
            categoriaTag: "squash",
            icono: "🚀",
            titulo: "285 km/h: El proyectil más veloz en los deportes de raqueta de interior",
            descripcion: "El récord mundial de tiro en squash pertenece al profesional australiano Cameron Pilley con 285 km/h (177.1 mph). Al chocar contra el frontis de concreto a esa velocidad, la pelota sufre una compresión del 50% de su volumen en menos de 4 milisegundos, experimentando desaceleraciones superiores a 3.000 G (3.000 veces la gravedad terrestre) antes de rebotar hacia la pista.",
            principio: "Conservación del Momento Lineal, Impulso (J = F·Δt) & Deformación Elástica"
        },
        {
            id: "dato-6",
            categoria: "Squash & Deporte",
            categoriaTag: "squash",
            icono: "⚽",
            titulo: "El Efecto Magnus: La física que curva el balón en el aire",
            descripcion: "Cuando una pelota (de squash, tenis o fútbol) viaja con efecto de giro sobre su eje (spin), arrastra una fina capa límite de aire. En el lado donde el giro acompaña al flujo de aire, la velocidad relativa aumenta y la presión disminuye; en el lado opuesto, la velocidad cae y la presión se eleva. Esta asimetría de presiones genera una fuerza neta perpendicular a la trayectoria (Efecto Magnus) que desvía la bola en el aire contra la intuición del rival.",
            principio: "Efecto Magnus & Principio de Bernoulli en Aerodinámica de Capa Límite"
        },
        {
            id: "dato-7",
            categoria: "Ondas & Acústica",
            categoriaTag: "ondas",
            icono: "🌊",
            titulo: "¿Por qué el sonido viaja 4.3 veces más rápido en el agua que en el aire?",
            descripcion: "Aunque el agua es 800 veces más densa que el aire, la velocidad del sonido en el agua dulce es de 1.482 m/s frente a solo 343 m/s en el aire (y más de 5.100 m/s en el acero). Esto ocurre porque la velocidad de una onda mecánica longitudinal depende de la razón entre el módulo elástico volumétrico del medio (B) y su densidad (ρ): v = √(B/ρ). El agua es tan difícil de comprimir que su rigidez elástica supera con creces el efecto de su densidad.",
            principio: "Propagación de Ondas Longitudinales: Ecuación de Newton-Laplace v = √(B/ρ)"
        },
        {
            id: "dato-8",
            categoria: "Cuántica & Termodinámica",
            categoriaTag: "cuantica",
            icono: "❄️",
            titulo: "¿Por qué el Cero Absoluto (0 Kelvin) es matemáticamente inalcanzable?",
            descripcion: "A -273.15 °C (0 Kelvin), cabría pensar que toda vibración atómica se detendría por completo. Sin embargo, el Principio de Incertidumbre de Heisenberg (Δx · Δp ≥ ℏ/2) prohíbe que una partícula tenga simultáneamente una posición fija exacta y una velocidad o momento nulo, pues violaría las leyes cuánticas fundamentales. Por ello, la materia siempre conserva una 'energía del punto cero' residual que ningún sistema termodinámico puede disipar.",
            principio: "Tercera Ley de la Termodinámica & Energía del Punto Cero de Heisenberg"
        },
        {
            id: "dato-9",
            categoria: "Ciencia de Materiales",
            categoriaTag: "materiales",
            icono: "🔬",
            titulo: "Grafeno: Una sola capa de átomos 200 veces más resistente que el acero",
            descripcion: "El grafeno está formado por una lámina bidimensional de átomos de carbono dispuestos en una red hexagonal tipo panal. Gracias a la hibridación electrónica sp² con enlaces covalentes sigma extremadamente cortos y fuertes, posee una resistencia a la tracción intrínseca de 130 GPa (frente a ~0.4 GPa del acero estructural) y conduce el calor mejor que el diamante.",
            principio: "Hibridación Orbital sp², Enlace Covalente Carbono-Carbono & Dispersión de Dirac"
        },
        {
            id: "dato-10",
            categoria: "Ciencia de Materiales",
            categoriaTag: "materiales",
            icono: "🪄",
            titulo: "Nitinol: El metal inteligente que recuerda su forma al calentarse",
            descripcion: "El Nitinol (aleación equiatómica de Níquel y Titanio) posee memoria de forma: puedes deformarlo o arrugarlo en frío y, al sumergirlo en agua caliente, recupera instantáneamente su geometría original. Esto ocurre por una transformación de fase reversible en estado sólido entre la fase martensítica (fácilmente deformable) y la austenítica de alta simetría sin desplazamiento difusivo atómico.",
            principio: "Transformación Martensítica Termoelástica Adifusional en Aleaciones SMA"
        },
        {
            id: "dato-11",
            categoria: "Termodinámica & Fluidos",
            categoriaTag: "termodinamica",
            icono: "☕",
            titulo: "El Efecto Mpemba: ¿Puede el agua caliente congelarse antes que la fría?",
            descripcion: "Descrito desde Aristóteles y comprobado en 1969 por el estudiante tanzano Erasto Mpemba: bajo ciertas condiciones geométricas y de convección, un recipiente con agua tibia puede alcanzar el punto de congelación antes que uno con agua fría. Se debe a una combinación de rápida evaporación (que reduce la masa térmica total), convección turbulenta acelerada y relajación de enlaces de hidrógeno covalentes.",
            principio: "Convección Térmica de Rayleigh-Bénard & Dinámica de Enlaces de Hidrógeno O-H···O"
        },
        {
            id: "dato-12",
            categoria: "Ondas & Acústica",
            categoriaTag: "ondas",
            icono: "🚂",
            titulo: "El silbido del tren y las galaxias: La omnipresencia del Efecto Doppler",
            descripcion: "Cuando una ambulancia se acerca, la frecuencia percibida de la sirena aumenta (sonido más agudo) porque cada frente de onda sucesivo se emite más cerca del oyente; al alejarse, la frecuencia decae (sonido más grave). Este mismo fenómeno ondulatorio permitió a Edwin Hubble en 1929 descubrir que las galaxias lejanas presentan un 'corrimiento al rojo' Doppler en su espectro luminoso, demostrando que el universo entero se está expandiendo.",
            principio: "Efecto Doppler Ondulatorio (f' = f · (v ± v_r)/(v ∓ v_f)) & Expansión de Hubble"
        },
        {
            id: "dato-13",
            categoria: "Relatividad & Cosmos",
            categoriaTag: "relatividad",
            icono: "⏳",
            titulo: "En el centro de la Tierra eres un microsegundo más joven que en la superficie",
            descripcion: "La Relatividad General de Einstein postula que la masa curva el espaciotiempo: cuanto más intenso es el potencial gravitatorio en el que te encuentras, más lento transcurre el tiempo relativo frente a un observador exterior lejano. Si pasaras toda tu vida en el núcleo de la Tierra, envejecerías aproximadamente 2.5 años menos cada mil millones de años respecto a alguien viviendo en el espacio exterior.",
            principio: "Dilatación Gravitacional del Tiempo (Ecuaciones de Campo de Einstein: g_00)"
        },
        {
            id: "dato-14",
            categoria: "Relatividad & Cosmos",
            categoriaTag: "relatividad",
            icono: "🌌",
            titulo: "Una cucharadita de estrella de neutrones pesaría 6.000 millones de toneladas",
            descripcion: "Cuando una estrella gigante colapsa en una supernova, la tremenda gravedad supera la repulsión electrónica y fuerza a los electrones a fundirse con los protones, creando una bola de neutrones puros de apenas 20 km de diámetro. Su densidad es tan gigantesca (~10¹⁷ kg/m³) que un solo centímetro cúbico de su materia sobre la superficie terrestre equivaldría al peso combinado de toda la humanidad multiplicada por diez.",
            principio: "Presión de Degeneración Cuántica Fermiónica (Principio de Exclusión de Pauli)"
        },
        {
            id: "dato-15",
            categoria: "Cuántica & Tecnología",
            categoriaTag: "cuantica",
            icono: "🔗",
            titulo: "Entrelazamiento Cuántico: La 'acción fantasmal a distancia' de Einstein",
            descripcion: "Cuando dos partículas cuánticas se generan juntas en un estado entrelazado, sus propiedades físicas (como el espín) quedan unidas inseparablemente sin importar si se separan por un milímetro o por galaxias opuestas. Al medir el espín de una partícula y colapsar su estado en 'arriba', la otra instantáneamente asume el espín 'abajo' con correlación perfecta y sin señales electromagnéticas viajando entre ellas.",
            principio: "No-Localidad Cuántica, Teorema de Bell & Estado de Bell (|Ψ⁺⟩)"
        },
        {
            id: "dato-16",
            categoria: "Biofísica & Neurociencia",
            categoriaTag: "biofisica",
            icono: "🧠",
            titulo: "El cerebro humano opera como una supercomputadora de 20 vatios de potencia",
            descripcion: "Con aproximadamente 86.000 millones de neuronas y más de 100 billones de conexiones sinápticas que procesan información en paralelo a velocidades de hasta 120 m/s, el cerebro humano consume apenas ~20 vatios de potencia metabólica continua (menos que una bombilla incandescente común). Genera esta asombrosa computación mediante diminutos gradientes electroquímicos de iones sodio (Na⁺) y potasio (K⁺).",
            principio: "Bioelectroquímica: Ecuación de Nernst-Planck & Potenciales de Acción de Hodgkin-Huxley"
        },
        {
            id: "dato-17",
            categoria: "Squash & Deporte",
            categoriaTag: "squash",
            icono: "👟",
            titulo: "Biomecánica de la 'T': El squash como un péndulo invertido dinámico",
            descripcion: "En la cancha de squash, un jugador de élite cubre hasta 5 kilómetros en un partido realizando más de 800 cambios violentos de dirección. El secreto biomecánico radica en descender el centro de masa (COM) en cada aproximación a la bola, almacenando energía elástica en los tendones de Aquiles y el cuádriceps (ciclo de estiramiento-acortamiento) para rebotar hacia la 'T' con máxima eficiencia biomecánica.",
            principio: "Mecánica de Péndulo Invertido, Centro de Masa & Ciclo Estiramiento-Acortamiento (SSC)"
        },
        {
            id: "dato-18",
            categoria: "Ondas & Óptica",
            categoriaTag: "ondas",
            icono: "🌈",
            titulo: "¿Por qué el cielo es azul y los atardeceres son intensamente rojos?",
            descripcion: "Las moléculas de nitrógeno y oxígeno en la atmósfera terrestre son mucho más pequeñas que la longitud de onda de la luz visible. Por la Dispersión de Rayleigh, la intensidad de la luz dispersada es inversamente proporcional a la cuarta potencia de su longitud de onda (I ∝ 1/λ⁴). Como la luz azul tiene una longitud de onda corta (~450 nm), se dispersa 10 veces más que la roja (~700 nm); al atardecer, la luz debe atravesar mucho más espesor atmosférico, filtrando todo el azul y dejando pasar los tonos rojos cálidos.",
            principio: "Dispersión Elástica de Rayleigh (I ∝ λ⁻⁴) & Óptica Electromagnética"
        },
        {
            id: "dato-19",
            categoria: "Electromagnetismo & Materiales",
            categoriaTag: "materiales",
            icono: "🧲",
            titulo: "Efecto Meissner: La levitación magnética perfecta en superconductores",
            descripcion: "Al enfriar un material superconductor por debajo de su temperatura crítica (Tc), no solo pierde toda resistencia eléctrica a cero ohmios, sino que expulsa activamente cualquier campo magnético de su interior. Este fenómeno, descubierto por Meissner y Ochsenfeld en 1933, crea corrientes superficiales apantalladoras que generan un campo magnético idéntico y opuesto, permitiendo la levitación estable de imanes (utilizada en los trenes Maglev).",
            principio: "Superconductividad Cuántica, Pares de Cooper & Efecto Meissner-Ochsenfeld"
        },
        {
            id: "dato-20",
            categoria: "Termodinámica & Caos",
            categoriaTag: "termodinamica",
            icono: "⏳",
            titulo: "La Entropía: La única ley física que le enseña al universo hacia dónde va el futuro",
            descripcion: "Casi todas las ecuaciones fundamentales de la física (Newton, Maxwell, Schrödinger, relatividad) son simétricas en el tiempo: funcionan matemáticamente igual si el tiempo corre hacia adelante o hacia atrás. La única ley que distingue el pasado del futuro es la Segunda Ley de la Termodinámica: la entropía (desorden microscópico) de un sistema aislado nunca decrece (ΔS ≥ 0). Por eso los huevos se rompen pero nunca se reconstruyen espontáneamente.",
            principio: "Segunda Ley de la Termodinámica & Fórmula de Entropía Estadística de Boltzmann (S = k·ln Ω)"
        },
        {
            id: "dato-21",
            categoria: "Termodinámica & Fluidos",
            categoriaTag: "termodinamica",
            icono: "🛢️",
            titulo: "La Paradoja de Pascal: El barril que reventó con un fino tubo de agua",
            descripcion: "En 1648, Blaise Pascal demostró que la presión ejercida por un fluido en reposo depende únicamente de la altura de la columna líquida y no del volumen total ni de la forma del recipiente (P = ρ·g·h). Insertó un tubo delgado de 10 metros de altura en un robusto barril de roble lleno de agua; al verter apenas dos vasos más de agua por el tubo largo, la colosal presión hidrostática generada en la base reventó las tablas del barril.",
            principio: "Ecuación Fundamental de la Hidrostática (ΔP = ρ·g·Δh) & Principio de Pascal"
        },
        {
            id: "dato-22",
            categoria: "Ciencia de Materiales",
            categoriaTag: "materiales",
            icono: "🧪",
            titulo: "Vidrios Metálicos: Aleaciones con estructura de líquido congelado",
            descripcion: "La mayoría de los metales se solidifican formando redes cristalinas periódicas repletas de bordes de grano y dislocaciones microscópicas. Si se enfría una aleación líquida a velocidades extremas de un millón de grados Celsius por segundo (10⁶ K/s), los átomos no tienen tiempo de ordenarse en cristales y quedan atrapados en un estado vítreo amorfo. Estos vidrios metálicos duplican la resistencia del titanio y tienen una resiliencia elástica sin precedentes.",
            principio: "Cinética de Cristalización, Transición Vítrea (Tg) & Redes Metálicas Amorfas"
        },
        {
            id: "dato-23",
            categoria: "Ondas & Acústica",
            categoriaTag: "ondas",
            icono: "🌉",
            titulo: "Resonancia Mecánica: Cuando una pequeña fuerza derriba un puente gigante",
            descripcion: "Todo objeto físico (un puente, una copa de cristal o una cuerda de violín) tiene frecuencias naturales de vibración. Si una fuerza periódica externa coincide con una de esas frecuencias, la amplitud de oscilación crece exponencialmente acumulando energía elástica. En 1940, los vórtices de von Kármán generados por el viento en el puente de Tacoma Narrows acoplaron su frecuencia con el modo torsional de la estructura, provocando su célebre colapso.",
            principio: "Resonancia Mecánica Forzada, Factor de Calidad (Q) & Flotamiento Aeroelástico"
        },
        {
            id: "dato-24",
            categoria: "Relatividad & Cosmos",
            categoriaTag: "relatividad",
            icono: "💥",
            titulo: "E = mc²: La colosal energía encerrada en la masa de un clip de papel",
            descripcion: "La famosa ecuación de equivalencia entre masa y energía de Einstein demuestra que la materia es energía concentrada. La constante c² (la velocidad de la luz al cuadrado, ~9 × 10¹⁶ m²/s²) es un multiplicador descomunal: si pudieras aniquilar por completo un clip de papel de 1 gramo convirtiéndolo en fotones puros, liberarías 90 terajulios (9 × 10¹³ Joules), energía equivalente a la detonación de 21 kilotones de TNT.",
            principio: "Equivalencia Masa-Energía de Einstein (E = m·c²) & Física Nuclear"
        },
        {
            id: "dato-25",
            categoria: "Cuántica & Tecnología",
            categoriaTag: "cuantica",
            icono: "☀️",
            titulo: "El Efecto Fotoeléctrico: Por qué la luz está hecha de paquetes llamados fotones",
            descripcion: "A finales del siglo XIX, la física clásica no podía explicar por qué la luz roja, por intensa que fuera, no lograba arrancar electrones de una placa de metal, mientras que una luz ultravioleta muy tenue sí lo hacía al instante. En 1905, Albert Einstein propuso que la radiación electromagnética viaja cuantizada en paquetes indivisibles de energía (E = h·f). Si el fotón individual no supera la función de trabajo del metal, ningún electrón puede liberarse.",
            principio: "Efecto Fotoeléctrico (E_k = h·f - Φ) & Cuantización de Planck (Premio Nobel 1921)"
        },
        {
            id: "dato-26",
            categoria: "Biofísica & Neurociencia",
            categoriaTag: "biofisica",
            icono: "👁️",
            titulo: "La física del ojo: Dos lentes biológicos que refractan la luz en dioptrías",
            descripcion: "El ojo humano funciona como un sistema óptico compuesto de dos lentes: la córnea (una lente fija de menisco divergente-convergente que aporta ~43 dioptrías de potencia óptica por el cambio de índice de refracción aire-agua de 1.000 a 1.376) y el cristalino (una lente biconvexa flexible que añade entre 15 y 20 dioptrías adicionales mediante la tensión de los músculos ciliares para enfocar objetos cercanos o distantes).",
            principio: "Refracción de Snell-Descartes, Ecuación del Fabricante de Lentes & Acomodación Óptica"
        },
        {
            id: "dato-27",
            categoria: "Electromagnetismo & Cosmos",
            categoriaTag: "ondas",
            icono: "🌌",
            titulo: "Auroras Boreales: El escudo magnético de la Tierra colisionando con el viento solar",
            descripcion: "El Sol emite constantemente una corriente supersónica de protones y electrones cargados a más de 400 km/s (viento solar). El campo magnético terrestre (la magnetosfera) desvía estas partículas mediante la fuerza de Lorentz (F = q·v × B), canalizándolas en espiral hacia las regiones polares. Al colisionar con átomos de oxígeno a 100 km de altitud, los excitan a estados cuánticos superiores; al decaer, emiten la mágica luz verde-esmeralda (557.7 nm) de las auroras.",
            principio: "Fuerza de Lorentz (F = q(E + v × B)) & Emisión Espectral por Desexcitación Atómica"
        },
        {
            id: "dato-28",
            categoria: "Relatividad & Cosmos",
            categoriaTag: "relatividad",
            icono: "🎵",
            titulo: "El sonido de un agujero negro: Una nota en Si bemol a 57 octavas bajo el Do central",
            descripcion: "Aunque suele decirse que el espacio exterior es un vacío mudo, en el cúmulo de galaxias de Perseo existe abundante gas caliente ionizado. En 2003, el telescopio espacial de rayos X Chandra detectó ondas de presión acústica concéntricas propagándose desde el agujero negro supermasivo central. Es la nota musical más grave jamás registrada en el cosmos: un Si bemol con un periodo de oscilación de 9.6 millones de años (57 octavas por debajo de las capacidades del oído humano).",
            principio: "Propagación de Ondas Acústicas en Plasma Intergaláctico & Astrofísica de Altas Energías"
        },
        {
            id: "dato-29",
            categoria: "Termodinámica & Caos",
            categoriaTag: "termodinamica",
            icono: "🦋",
            titulo: "El Efecto Mariposa: Determinismo sin predictibilidad en sistemas no lineales",
            descripcion: "En 1961, el meteorólogo y físico Edward Lorenz descubrió que en sistemas de ecuaciones diferenciales no lineales, una variación infinitesimal en las condiciones iniciales (como redondear 0.506127 a 0.506) conduce a comportamientos completamente divergentes con el tiempo. Esto demostró que un sistema puede ser 100% determinista (sin azar cuántico) y, sin embargo, ser intrínsecamente imposible de predecir a largo plazo.",
            principio: "Dinámica No Lineal, Atractores Extraños de Lorenz & Exponentes de Lyapunov"
        },
        {
            id: "dato-30",
            categoria: "Squash & Deporte",
            categoriaTag: "squash",
            icono: "🎾",
            titulo: "Física de Raquetas: ¿Por qué menor tensión en las cuerdas genera más potencia?",
            descripcion: "Contra la intuición común, encordar una raqueta de squash o tenis con menor tensión (ej. 24 lbs en vez de 30 lbs) genera mayor velocidad de salida en la pelota. Una cuerda menos tensa se deforma más durante los 4 a 6 milisegundos que dura el impacto (Efecto Trampolín), almacenando energía de deformación con menores pérdidas viscoelásticas internas que la pelota, devolviendo más energía cinética al tiro.",
            principio: "Efecto Trampolín Elástico, Coeficiente de Restitución (COR) & Tiempos de Contacto"
        },
        {
            id: "dato-31",
            categoria: "Ciencia de Materiales",
            categoriaTag: "materiales",
            icono: "☁️",
            titulo: "Aerogel de Sílice: El 'humo congelado' compuesto por un 99.8% de aire",
            descripcion: "El aerogel es el material sólido más ligero del mundo: posee una densidad de apenas 1 a 3 mg/cm³ (casi tan ligero como el aire ambiental). Se sintetiza secando supercríticamente un gel de sílice sin colapsar su nanoestructura porosa. Es tan aislante que una flor colocada sobre un bloque de aerogel de 5 milímetros no se marchita ni quema incluso si colocas un soplete encendido a 1.200 °C directamente debajo.",
            principio: "Estructura Mesoporosa Nanométrica, Efecto Knudsen & Conducción Térmica Cuasi-Nula"
        }
    ],

    // Comentarios y Opiniones de la Comunidad
    comentarios: [
        {
            id: "com-user-1",
            nombre: "Carlos Andrés Muñoz",
            rol: "Estudiante de Ing. Electrónica",
            rolBadge: "🎓 Estudiante Unicauca",
            calificacion: 5,
            fecha: "Hace 2 días",
            texto: "El Laboratorio de Transformadores es una herramienta excepcional. Poder variar las espiras, simular pérdidas en el núcleo y visualizar la curva B-H en tiempo real me permitió comprender conceptos que en el aula física resultaban muy abstractos. ¡Excelente trabajo del profesor Manuel!",
            avatarBg: "linear-gradient(135deg, #38BDF8, #1E40AF)"
        },
        {
            id: "com-user-2",
            nombre: "Valentina Ríos",
            rol: "Estudiante de Ingeniería Física",
            rolBadge: "🎓 Estudiante Unicauca",
            calificacion: 5,
            fecha: "Hace 5 días",
            texto: "Me encantó la iniciativa de los cómics de divulgación. En nuestro grupo creamos una narrativa gráfica sobre termodinámica y entropía, y verla publicada aquí junto a las producciones de los demás compañeros hace que aprender física sea mucho más inspirador.",
            avatarBg: "linear-gradient(135deg, #F472B6, #9D174D)"
        },
        {
            id: "com-user-3",
            nombre: "Felipe Gómez",
            rol: "Entrenador y Jugador de Squash",
            rolBadge: "🎾 Deportista & Entrenador",
            calificacion: 5,
            fecha: "Hace 1 semana",
            texto: "Una perspectiva genial que nunca había visto en el deporte: explicar el squash desde la termodinámica del caucho butílico y la física de choques. Ahora entiendo científicamente por qué la bola fría no levanta rebote y cómo aprovechar el efecto Magnus en cancha.",
            avatarBg: "linear-gradient(135deg, #34D399, #065F46)"
        },
        {
            id: "com-user-4",
            nombre: "Ing. David Caicedo",
            rol: "Docente de Física Universitaria",
            rolBadge: "🏫 Docente",
            calificacion: 5,
            fecha: "Hace 2 semanas",
            texto: "Felicito al colega Manuel Obando por este proyecto integrador. PhysicsAILab demuestra cómo combinar la rigurosidad analítica con la didáctica interactiva, podcasts y narrativas visuales. Un recurso imperdible para docentes y estudiantes de ciencias.",
            avatarBg: "linear-gradient(135deg, #818CF8, #3730A3)"
        },
        {
            id: "com-user-5",
            nombre: "Laura Marcela Delgado",
            rol: "Estudiante de Ingeniería Ambiental",
            rolBadge: "🎓 Estudiante Unicauca",
            calificacion: 5,
            fecha: "Hace 2 semanas",
            texto: "El cómic sobre agrofísica y la dinámica del agua en plantas me sirvió muchísimo para afianzar conceptos clave de mi semestre. Además, los podcasts en Spotify son ideales para repasar camino a la universidad. Muy fácil de descargar en PDF.",
            avatarBg: "linear-gradient(135deg, #F59E0B, #B45309)"
        },
        {
            id: "com-user-6",
            nombre: "Juan Sebastián Hurtado",
            rol: "Aficionado a la Ciencia & Squash",
            rolBadge: "💡 Aficionado a la Ciencia",
            calificacion: 5,
            fecha: "Hace 3 semanas",
            texto: "Gran plataforma. Los artículos de la física del squash y la simulación interactiva de rutinas con tiempo de impacto y aceleración son brutales. Muy recomendada tanto para atletas como para cualquier mente curiosa.",
            avatarBg: "linear-gradient(135deg, #06B6D4, #0E7490)"
        }
    ]
};

