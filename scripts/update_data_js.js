const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../web/data.js');
let code = fs.readFileSync(dataPath, 'utf8');

// 1. Add to clavesCursos
if (!code.includes('squash_arbitraje:')) {
    code = code.replace(
        'diagnosticas: ["DIAGNOSTICAS-2026", "PRUEBAS-26", "OBANDO-DIAG-26"]',
        'diagnosticas: ["DIAGNOSTICAS-2026", "PRUEBAS-26", "OBANDO-DIAG-26"],\n        squash_arbitraje: ["ARBITRAJE-2026", "SQUASH-REF-26", "MANU-REF-26", "WSF-REGLAS-26"]'
    );
}

// 2. Add course object to cursos array before hbn_mc (or after faro)
if (!code.includes('id: "squash_arbitraje"')) {
    const courseObj = `        {
            id: "squash_arbitraje",
            titulo: "Manu_Squash Arbitraje: Sistema Oficial WSF & Simulador Interactivo",
            nivel: "Árbitros / Entrenadores / Jugadores",
            modulos: "6 Módulos Interactivos + Simulador 3D/2D + Árbol de Decisión WSF",
            categoria: "Deporte & Ciencias del Movimiento",
            categoriaFiltro: "aplicada",
            descripcion: "Aplicación interactiva y manual oficial de arbitraje de squash bajo el reglamento de la World Squash Federation (WSF). Incluye simulador de cancha 3D/2D con jugadas interactivas, árbol de decisión dinámico para interferencias (Stroke, Yes Let, No Let), manual comentado de Reglas 1 a 15 y planilla/marcador con llamados reglamentarios oficiales en vivo.",
            temas: [
                "01. Filosofía del Arbitraje y Código de Conducta WSF",
                "02. Simulador de Cancha 3D/2D con Jugadas de Prueba",
                "03. Árbol de Decisión Interactivo de Interferencias (Stroke, Yes Let, No Let)",
                "04. Manual Oficial de Reglas 1 a 15 WSF Comentadas",
                "05. Planilla Electrónica & Marcador con Llamados Reglamentarios",
                "06. Casos Polémicos, Exámenes de Certificación & Protocolos de Interferencia"
            ],
            destacado: true,
            tipo: "Aplicación Interactiva HTML5/JS",
            demoPath: "/material/1_cursos/manu_squash_arbitraje/index.html",
            precioEstimado: "$25 USD (~$99.000 COP)",
            precioCOP: 99000,
            precioUSD: 25,
            valorReal: "$45 USD",
            descuentoTag: "Lanzamiento Oficial",
            enlaceCompra: "https://hotmart.com",
            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },\n`;

    code = code.replace(
        'id: "hbn_mc"',
        `${courseObj}        id: "hbn_mc"`
    );
}

fs.writeFileSync(dataPath, code, 'utf8');
console.log('✅ Successfully updated web/data.js with squash_arbitraje course.');
