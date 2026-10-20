/* ===================================================================
   04-local.js — Constantes del lugar donde se hace la práctica
   · gravedad: fórmula cerrada de Somigliana (elipsoide WGS84) con la
     corrección por altura: promedio de las correcciones de aire libre
     (−3,086 µm/s² por metro) y de Bouguer simple (lámina de 2670 kg/m³);
     la mitad de su diferencia se toma como incertidumbre del modelo.
   · presión: atmósfera tropical con 1012 hPa y 300 K al nivel del mar
     y gradiente de 6,5 K/km.
   · ebullición del agua: Antoine (Bridgeman y Aldrich, 344–373 K),
     contrastada con IAPWS-95 (CoolProp) en tests/.
   · campo geomagnético: síntesis del IGRF-14 hasta n = 13.
   =================================================================== */
(function () {
  'use strict';
  const EM = (window.EM = window.EM || {});
  const LO = (EM.LOC = {});
  const rad = Math.PI / 180;

  LO.CAPITALES = [
    ['Leticia', 'Amazonas', -4.215, -69.940, 96], ['Medellín', 'Antioquia', 6.244, -75.581, 1495],
    ['Arauca', 'Arauca', 7.084, -70.759, 125], ['Barranquilla', 'Atlántico', 10.964, -74.796, 18],
    ['Bogotá', 'Bogotá D. C.', 4.711, -74.072, 2640], ['Cartagena', 'Bolívar', 10.391, -75.479, 2],
    ['Tunja', 'Boyacá', 5.535, -73.368, 2810], ['Manizales', 'Caldas', 5.070, -75.514, 2160],
    ['Florencia', 'Caquetá', 1.614, -75.606, 242], ['Yopal', 'Casanare', 5.337, -72.395, 350],
    ['Popayán', 'Cauca', 2.444, -76.614, 1737], ['Valledupar', 'Cesar', 10.463, -73.253, 168],
    ['Quibdó', 'Chocó', 5.692, -76.658, 43], ['Montería', 'Córdoba', 8.748, -75.881, 18],
    ['Inírida', 'Guainía', 3.865, -67.924, 95], ['San José del Guaviare', 'Guaviare', 2.572, -72.645, 175],
    ['Neiva', 'Huila', 2.936, -75.281, 442], ['Riohacha', 'La Guajira', 11.544, -72.907, 3],
    ['Santa Marta', 'Magdalena', 11.241, -74.199, 2], ['Villavicencio', 'Meta', 4.142, -73.627, 467],
    ['Pasto', 'Nariño', 1.214, -77.281, 2527], ['Cúcuta', 'Norte de Santander', 7.894, -72.508, 320],
    ['Mocoa', 'Putumayo', 1.152, -76.647, 604], ['Armenia', 'Quindío', 4.534, -75.681, 1551],
    ['Pereira', 'Risaralda', 4.814, -75.694, 1411], ['San Andrés', 'San Andrés y Providencia', 12.584, -81.701, 3],
    ['Bucaramanga', 'Santander', 7.119, -73.123, 959], ['Sincelejo', 'Sucre', 9.304, -75.397, 213],
    ['Ibagué', 'Tolima', 4.439, -75.232, 1285], ['Cali', 'Valle del Cauca', 3.451, -76.532, 1018],
    ['Mitú', 'Vaupés', 1.198, -70.173, 180], ['Puerto Carreño', 'Vichada', 6.189, -67.486, 51]
  ].map(([nombre, dep, lat, lon, h]) => ({ nombre, dep, lat, lon, h }));

  /* Gravedad normal WGS84 (m/s²) */
  LO.gNormal = function (lat) {
    const s2 = Math.sin(lat * rad) ** 2;
    return (9.7803253359 * (1 + 0.00193185265241 * s2)) / Math.sqrt(1 - 0.00669437999013 * s2);
  };
  /* Gravedad local estimada: [valor, incertidumbre del modelo] */
  LO.g = function (lat, h) {
    const g0 = LO.gNormal(lat), al = g0 - 3.086e-6 * h, bg = al + 2 * Math.PI * 6.674e-11 * 2670 * h;
    return [(al + bg) / 2, (bg - al) / 2];
  };
  /* Presión atmosférica media (Pa) */
  LO.p = function (h) {
    const P0 = 101200, T0 = 300, L = 0.0065, ex = (9.80665 * 0.0289644) / (8.314462618 * L);
    return P0 * Math.pow(1 - (L * h) / T0, ex);
  };
  /* Temperatura de ebullición del agua (°C) a la presión p (Pa), Antoine 344–373 K */
  LO.tEbullicion = function (p) {
    const A = 5.08354, B = 1663.125, C = -45.622;
    return B / (A - Math.log10(p / 1e5)) - C - 273.15;
  };
  /* Presión de vapor del agua (Pa) a θ (°C), misma ecuación */
  LO.pVapor = (th) => 1e5 * Math.pow(10, 5.08354 - 1663.125 / (th + 273.15 - 45.622));

  /* Velocidad del sonido en aire seco (m/s) a θ (°C): gas ideal con γ = 1,4 y M = 28,965 g/mol */
  LO.vSonido = (th) => Math.sqrt((1.4 * 8.314462618 * (th + 273.15)) / 0.0289645);

  /* Año decimal */
  LO.anio = function (d) {
    d = d || new Date();
    const y = d.getUTCFullYear(), t0 = Date.UTC(y, 0, 1), t1 = Date.UTC(y + 1, 0, 1);
    return y + (d.getTime() - t0) / (t1 - t0);
  };
  /* Campo geomagnético IGRF-14. Devuelve nT y grados:
     {X (norte), Y (este), Z (abajo), H, F, D (declinación), I (inclinación)} */
  LO.igrf = function (lat, lon, h, anio) {
    const C = EM.IGRF;
    const t = Math.min(Math.max((anio - 2025) / 5, 0), 1.2);
    const N = C.nmax;
    const a = 6378.137, f = 1 / 298.257223563, b = a * (1 - f), ref = 6371.2;
    const hk = h / 1000;
    const sl = Math.sin(lat * rad), cl = Math.cos(lat * rad);
    const Nr = (a * a) / Math.sqrt(a * a * cl * cl + b * b * sl * sl);
    const Xc = (Nr + hk) * cl, Zc = ((b * b) / (a * a) * Nr + hk) * sl;
    const r = Math.hypot(Xc, Zc);
    const psi = Math.atan2(Zc, Xc);
    const th = Math.PI / 2 - psi, ct = Math.cos(th), st = Math.sin(th);
    const ph = lon * rad;
    /* Legendre de Schmidt y derivadas respecto a θ */
    const P = [], dP = [];
    for (let n = 0; n <= N; n++) { P.push(new Array(N + 1).fill(0)); dP.push(new Array(N + 1).fill(0)); }
    P[0][0] = 1;
    for (let n = 1; n <= N; n++) {
      for (let m = 0; m <= n; m++) {
        if (m === n) {
          if (n === 1) { P[1][1] = st; dP[1][1] = ct; }
          else {
            const k = Math.sqrt((2 * n - 1) / (2 * n));
            P[n][n] = k * st * P[n - 1][n - 1];
            dP[n][n] = k * (ct * P[n - 1][n - 1] + st * dP[n - 1][n - 1]);
          }
        } else {
          const d = Math.sqrt(n * n - m * m);
          const e = n - 2 >= m ? Math.sqrt((n - 1) * (n - 1) - m * m) : 0;
          const p2 = n - 2 >= m ? P[n - 2][m] : 0, dp2 = n - 2 >= m ? dP[n - 2][m] : 0;
          P[n][m] = ((2 * n - 1) * ct * P[n - 1][m] - e * p2) / d;
          dP[n][m] = ((2 * n - 1) * (ct * dP[n - 1][m] - st * P[n - 1][m]) - e * dp2) / d;
        }
      }
    }
    let Br = 0, Bt = 0, Bp = 0, i = 0;
    for (let n = 1; n <= N; n++) {
      const fr = Math.pow(ref / r, n + 2);
      for (let m = 0; m <= n; m++, i++) {
        const g = C.g2025[i] + t * (C.g2030[i] - C.g2025[i]);
        const hh = C.h2025[i] + t * (C.h2030[i] - C.h2025[i]);
        const cm = Math.cos(m * ph), sm = Math.sin(m * ph);
        Br += (n + 1) * fr * (g * cm + hh * sm) * P[n][m];
        Bt -= fr * (g * cm + hh * sm) * dP[n][m];
        Bp -= (fr * m * (-g * sm + hh * cm) * P[n][m]) / st;
      }
    }
    /* Componentes geocéntricas → geodésicas */
    const Xg = -Bt, Yg = Bp, Zg = -Br;
    const del = lat * rad - psi;
    const X = Xg * Math.cos(del) + Zg * Math.sin(del);
    const Z = Zg * Math.cos(del) - Xg * Math.sin(del);
    const H = Math.hypot(X, Yg), F = Math.hypot(H, Z);
    return { X, Y: Yg, Z, H, F, D: Math.atan2(Yg, X) / rad, I: Math.atan2(Z, H) / rad };
  };

  /* Ficha completa de un lugar */
  LO.datos = function (lugar, fecha) {
    const [g, ug] = LO.g(lugar.lat, lugar.h);
    const p = LO.p(lugar.h);
    return Object.assign({}, lugar, { g, ug, p, tb: LO.tEbullicion(p), B: LO.igrf(lugar.lat, lugar.lon, lugar.h, LO.anio(fecha)) });
  };
  LO.POR_DEFECTO = 'Popayán';
})();
