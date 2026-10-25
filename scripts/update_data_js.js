const fs = require('fs');
const path = require('path');

const dataJsPath = path.resolve(__dirname, '..', 'web/data.js');
let code = fs.readFileSync(dataJsPath, 'utf8');

// 1. Update clavesCursos
if (!code.includes('"solido":')) {
    const target = '"optica": ["OPTICA-2026", "FOTON-26", "OBANDO-OPTICA-26", "LUZ-RAYO-26", "MAXWELL-OPTICA-26"]';
    const addition = '"optica": ["OPTICA-2026", "FOTON-26", "OBANDO-OPTICA-26", "LUZ-RAYO-26", "MAXWELL-OPTICA-26"],\n' +
        '        "solido": ["SOLIDO-2026", "ESTADO-SOLIDO-26", "SOLIDOS-UFOP-26", "OBANDO-SOLIDO-26"],\n' +
        '        "faro": ["FARO-2026", "PODS-REACCION-26", "LUZ-FARO-26", "OBANDO-FARO-26"],\n' +
        '        "diagnosticas": ["DIAGNOSTICAS-2026", "PRUEBAS-26", "OBANDO-DIAG-26"]';
    code = code.replace(target, addition);
    console.log('Updated clavesCursos in web/data.js');
}

// 2. Add courses into CURSOS_DATA
if (!code.includes('id: "solido"')) {
    const newCourses = `        },
        {
            id: "solido",
            titulo: "Física del Estado Sólido: Estructuras Cristalinas, Bandas & Superconductividad",
            nivel: "Universitario / Física, Ingeniería Física & Ciencia de Materiales",
            modulos: "30 Capítulos Rigurosos + 119 Simulaciones WebGL/3D + Apéndices Teóricos (833 Pruebas Validadas)",
            categoria: "Física de la Materia Condensada",
            categoriaFiltro: "avanzada",
            descripcion: "Curso interactivo de frontera desarrollado por el Mg. Manuel Alejandro Obando (Universidad del Cauca / M.Sc. en Física de Materiales UFOP). Abarca el estado sólido y escalas, redes de Bravais y Miller en 3D, red recíproca y zonas de Brillouin, difracción de rayos X (Bragg, Ewald, factor de estructura), enlace cristalino, fonones en 1D y 3D, calor específico (Einstein vs Debye), efectos anarmónicos, modelo de Drude, gas de Fermi de Sommerfeld, teorema de Bloch, Kronig-Penney, electrones casi libres, método de enlace fuerte (TB, grafeno, modelo SSH), dinámica semiclásica y oscilaciones de Bloch, semiconductores y uniones p-n, heteroestructuras cuánticas y superconductividad. Con 119 simulaciones interactivas 3D y 833 pruebas científicas verificadas.",
            temas: [
                "01. El Estado Sólido: Escalas, Densidad de Estados y Enlace Químico",
                "02. Redes de Bravais, Estructuras Cristalinas y Visor 3D de Celdas Unitarias",
                "03. Red Recíproca, Vectores de Onda y Zonas de Brillouin 2D y 3D",
                "04. Difracción de Rayos X: Ley de Bragg, Esfera de Ewald y Factores de Estructura",
                "05. El Enlace Cristalino: Potencial de Lennard-Jones, Constante de Madelung y Cohesión",
                "06. La Cadena Lineal Monoatómica y Diatómica: Modos Acústicos y Ópticos",
                "07. Fonones en Tres Dimensiones: Superficies de Dispersión y Modos Cuantizados",
                "08. Calor Específico de la Red: Modelos de Einstein y Debye, Ley T³",
                "09. Efectos Anarmónicos: Dilatación Térmica, Parámetro de Grüneisen y Procesos Umklapp",
                "10. Modelo Clásico de Drude: Gas de Electrones, Efecto Hall y Ley Wiedemann-Franz",
                "11. El Gas de Fermi de Sommerfeld: Esfera de Fermi, Distribución f(E,T) y Calor Electrónico",
                "12. Teorema de Bloch y Potencial Periódico: Kronig-Penney y Apertura de Brechas",
                "13. Electrones Casi Libres: Red Vacía, Brecha en el Borde de Zona y Superficies de Fermi",
                "14. Método de Enlace Fuerte (Tight-Binding): Redes 2D, Grafeno y Modelo SSH",
                "15. Bandas de Energía Reales: Metales, Semimetales, Semiconductores y Aislantes",
                "16. Dinámica Semiclásica: Paquetes de Ondas, Masa Efectiva, Huecos y Oscilaciones de Bloch",
                "17. Electrones en Campos Magnéticos: Órbitas Ciclotrón, Niveles de Landau y Mariposa de Hofstadter",
                "18. Semiconductores Intrínsecos: Portadores Térmicos, Brecha Eg(T) y Masa Efectiva",
                "19. Dopaje en Semiconductores: Donadores, Aceptores, Nivel de Fermi y Compensación",
                "20. Transporte y Recombinación: Movilidad, Experimento de Haynes-Shockley y Efecto Hall",
                "21. La Unión p-n: Ecuación de Poisson, Región de Agotamiento y Diodo de Shockley",
                "22. Dispositivos de Estado Sólido: Celdas Solares (Shockley-Queisser), LEDs, MOSFETs y BJTs",
                "23. Heteroestructuras y Nanoestructuras: Pozos Cuánticos, Puntos Cuánticos y Superredes",
                "24. Dieléctricos y Polarización: Clausius-Mossotti, Polarizabilidad y Modos Ópticos",
                "25. Propiedades Ópticas de Sólidos: Función Dieléctrica Completa, Plasmones y Polaritones",
                "26. Diamagnetismo y Paramagnetismo: Ley de Curie-Weiss y Paramagnetismo de Pauli",
                "27. Ferromagnetismo y Orden Magnético: Modelo de Heisenberg, Dominios y Curvas de Histéresis",
                "28. Superconductividad: Fenomenología, Efecto Meissner, Teoría BCS y Ecuaciones de London",
                "29. Superconductores Tipo II: Vórtices de Abrikosov, Campos Críticos Hc1/Hc2 y Cuantización de Flujo",
                "30. Efecto Josephson y Tecnologías Cuánticas: SQUIDs y Qubits Superconductores"
            ],
            destacado: true,
            tipo: "Cuaderno Interactivo HTML5/WebGL/JS",
            demoPath: "/material/1_cursos/solido/dist/index.html",
            precioEstimado: "$35 USD (~$140.000 COP)",
            precioCOP: 140000,
            precioUSD: 35,
            valorReal: "$59 USD",
            descuentoTag: "Estreno Exclusivo 2026",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "faro",
            titulo: "Faro: Pods de Reacción, Sensores ToF & Entrenamiento Físico-Deportivo",
            nivel: "Entrenadores, Deportistas de Squash/Tenis, Fisioterapeutas & Makers",
            modulos: "Manual Técnico Interactivo + Planos A4 1:1 + STLs 3D + Firmware ESP32-S3 + Visor de Ensamble",
            categoria: "Tecnología Deportiva & Hardware Abierto",
            categoriaFiltro: "aplicada",
            descripcion: "Sistema integral de pods inteligentes de entrenamiento que se iluminan en colores y responden en milisegundos al golpe, al toque y a la proximidad (sensores ópticos Time-of-Flight VL53L0X). Diseñado por el Mg. Manuel Alejandro Obando combinando biomecánica deportiva, microelectrónica ESP32-S3 y modelado 3D paramétrico de alta resistencia. Incluye acceso completo al manual de taller paso a paso, esquemas electrónicos, código de pods y hub BLE, 5 láminas A4 acotadas a escala 1:1 y visor 3D interactivo con despiece y cortes.",
            temas: [
                "01. Qué es un Pod de Reacción y Visión del Proyecto",
                "02. Arquitectura del Sistema: Protocolo ESP-NOW en 2.4 GHz y Hub BLE",
                "03. Física y Funcionamiento de Sensores: ToF Infrarrojo, Acelerómetro y Tacto Capacitivo",
                "04. Lista Completa de Componentes y Guía de Compras en Colombia",
                "05. Electrónica: Esquemático, Circuito de Carga Li-Po, Protección y Anillo NeoPixel",
                "06. Carcasa y Modelado 3D en OpenSCAD: Domo Difusor, Base Rígida y Amortiguador TPU",
                "07. Ensamble de Taller Paso a Paso y Soldadura de Módulos",
                "08. Firmware en C++ / Arduino IDE para ESP32-S3 y Hub Central",
                "09. Puesta en Marcha, Calibración de Umbrales y Tiempos de Respuesta",
                "10. Banco de Ejercicios de Entrenamiento: Reacción de Squash, Agilidad y Visión Periférica",
                "11. Diagnóstico, Resolución de Problemas y Mantenimiento",
                "12. Seguridad en Baterías de Litio y Cuidado de Equipos",
                "13. Integración con Aplicaciones Web Bluetooth (Web BLE API)",
                "Apéndice: Modelos OpenSCAD, STLs 3D y Planos de Taller A4 a Escala 1:1"
            ],
            destacado: true,
            tipo: "Manual Técnico + Kit Maker & Firmware",
            demoPath: "/material/1_cursos/faro/manual/dist/index.html",
            precioEstimado: "$29 USD (~$119.000 COP)",
            precioCOP: 119000,
            precioUSD: 29,
            valorReal: "$49 USD",
            descuentoTag: "Hardware & Planos 3D",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "diagnosticas",
            titulo: "Servicio de Pruebas Diagnósticas Estandarizadas (Colegios & Universidades)",
            nivel: "Institucional: Grados 10°-11° de Bachillerato & Primeros Semestres Universitarios",
            modulos: "9 Bancos Especializados (450 Preguntas Validadas) + Supervisión en Vivo + Informe Institucional",
            categoria: "Evaluación & Analítica Académica",
            categoriaFiltro: "aplicada",
            descripcion: "Servicio evaluativo y psicométrico para colegios y universidades. Diagnostica con precisión matemática los vacíos y errores conceptuales de los estudiantes en 9 asignaturas clave (Física Fundamental, Mecánica, Electromagnetismo, Ondas, Matemáticas Universitaria, Cálculo I, II, III y Álgebra Lineal). La institución contrata el servicio por cohorte; el Mg. Manuel Alejandro Obando administra las aplicaciones, emite las credenciales únicas, supervisa en tiempo real y entrega el diagnóstico individual de cada alumno junto con el informe analítico institucional para comités curriculares y rectoría.",
            temas: [
                "01. Prueba Diagnóstica de Física Fundamental (50 ítems, 41 con figuras, 58 errores tipificados)",
                "02. Matemáticas para la Universidad (50 ítems, 27 figuras, verificación matemática independiente)",
                "03. Cálculo Diferencial - Cálculo I (50 ítems, funciones, límites y derivadas paso a paso)",
                "04. Cálculo Integral - Cálculo II (50 ítems, antiderivadas, series y aplicaciones)",
                "05. Cálculo Multivariado - Cálculo III (50 ítems, vectores, superficies 3D e integrales múltiples)",
                "06. Álgebra Lineal (50 ítems, transformaciones, matrices, eigenvalores y proyecciones)",
                "07. Mecánica Newtoniana (50 ítems, dinámica, estática, energía y rotación)",
                "08. Electricidad y Magnetismo (50 ítems, Gauss, Ampère, Faraday y circuitos)",
                "09. Vibraciones y Ondas (50 ítems, MAS, resonancia, acústica y Doppler)",
                "Supervisión Docente en Vivo con Detección Antifraude y Reloj Sincronizado",
                "Entrega de Diagnóstico Individual por Estudiante (Boletín descargable)",
                "Informe Analítico Institucional: Confiabilidad, Discriminación y Prioridades Curriculares"
            ],
            destacado: true,
            tipo: "Servicio Institucional de Evaluación & Analítica",
            demoPath: "/material/1_cursos/diagnosticas/dist/public/index.html",
            precioEstimado: "Desde $450.000 COP / cohorte (~$115 USD)",
            precioCOP: 450000,
            precioUSD: 115,
            valorReal: "$700.000 COP",
            descuentoTag: "Servicio Institucional",
            enlaceCompra: "https://checkout.wompi.co/l/VPOS_b6GD2z",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "hbn_mc",
            titulo: "hBN-MC: Simulador Monte Carlo de Nanoporos en Nitruro de Boro Hexagonal (Privado)",
            nivel: "Investigación & Postgrado / Física Computacional / DFT",
            modulos: "Simulación Monte Carlo Metropolis + Modelo de Enlaces DFT + Visor 3D Three.js",
            categoria: "Investigación Científica",
            categoriaFiltro: "avanzada",
            descripcion: "Simulador científico avanzado de nanoporos en nitruro de boro hexagonal (h-BN) y heteroestructuras h-BNC, basado en un modelo de enlaces parametrizado con cálculos DFT de primeros principios (código SIESTA). Desarrollado por el Mg. Manuel Alejandro Obando a partir de su tesis de maestría en el Departamento de Física / FIMAT de la Universidade Federal de Ouro Preto (UFOP, Brasil). Aplicación científica de uso exclusivo para investigación docente (No comercial / Acceso Privado).",
            temas: [
                "01. Modelo de Enlaces y Parametrización con Cálculos DFT (SIESTA)",
                "02. Algoritmo Monte Carlo Metropolis con Semilla Reproducible",
                "03. Protocolos Térmicos: Recocido Simulado, Isotérmico y Ciclos Térmicos",
                "04. Nanoporos Circulares, Triangulares y Poligonales en h-BN Monocapa",
                "05. Heteroestructuras h-BNC y Dominios de Grafeno en Matriz Dieléctrica",
                "06. Visor Atómico Interactivo 3D con Three.js y Exportación de Coordenadas XYZ",
                "07. Cálculo de Energía de Formación y Estabilidad Termodinámica de Bordes",
                "08. Generación de Estadísticas de Vecindad y Coordinación Atómica"
            ],
            destacado: true,
            tipo: "Herramienta Científica de Investigación",
            demoPath: "/material/1_cursos/hBN-MC/index.html",
            esPrivado: true,
            noComercial: true,
            precioEstimado: "Uso Privado / Investigación Docente",
            precioCOP: null,
            precioUSD: null,
            valorReal: null,
            descuentoTag: "Exclusivo Docente",
            enlaceCompra: null,
            enlaceWompi: null
        }`;

    // Insert before closing bracket of cursos array:
    // Search for demoPath: "/material/1_cursos/optica/dist/index.html" block ending
    const opticaEnd = 'enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"\n        }\n    ],';
    if (code.includes(opticaEnd)) {
        code = code.replace(opticaEnd, 'enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"\n' + newCourses + '\n    ],');
        console.log('Inserted new courses after optica in CURSOS_DATA');
    } else {
        console.warn('Could not find opticaEnd pattern, searching alternative');
    }
}

fs.writeFileSync(dataJsPath, code, 'utf8');
console.log('web/data.js updated successfully!');
