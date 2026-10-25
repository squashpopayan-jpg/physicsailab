// =====================================================================
//  FARO · Pod de reacción con luz RGB, golpe, toque y cercanía
//  Carcasa paramétrica para impresión 3D (OpenSCAD 2021.01 o posterior)
//  Elaborado por Mg. Manuel Alejandro Obando
//  Departamento de Física, Universidad del Cauca
//
//  Unidades: milímetros.  Origen: centro del pod, z = 0 en el apoyo.
//  Ángulos en grados, medidos desde +X (puerto USB) en sentido antihorario
//  mirando desde arriba.
//
//  Piezas imprimibles:  base · domo · soporte · anillo_tpu
//  Uso rápido:  abre este archivo, elige "parte" en el Personalizador
//  (Ventana → Personalizador), pulsa F6 y exporta STL (F7).
// =====================================================================

/* [Qué generar] */
parte = "ensamble"; // [ensamble, corte, explosionado, interior, sin_domo, base, domo, soporte, anillo_tpu, electrodo_2d, ventana_2d, seccion_2d, planta_2d, silueta_2d, choque]
// Sensor de distancia VL53L0X con ventana en el domo
con_tof = true;
// Dibujar batería, placas y anillo en los ensambles
ver_componentes = true;
// Plano del corte (para "corte" y "seccion_2d")
angulo_corte = 0;
// Altura del corte horizontal (para "planta_2d")
z_planta = 5;
// Calidad de las curvas (128 para imprimir)
calidad = 128;

/* [Cuerpo] */
D = 100;            // diámetro exterior
H = 34;             // altura total
h_base = 20;        // altura del borde de la base
e_pared = 2.4;      // pared de la base
e_piso = 2.4;       // piso de la base
chaflan_inf = 1.0;  // chaflán del borde inferior
holgura = 0.2;      // juego entre domo y base

/* [Domo translúcido] */
e_domo = 1.8;       // espesor del techo
e_lateral = 2.0;    // espesor de la banda lateral
R_borde = 10;       // radio del redondeo superior
z_borde = 25;       // altura donde arranca el redondeo
falda_z = 13;       // cota inferior de la falda que entra en la base
falda_e = 1.6;      // espesor de la falda

/* [Tornillos del domo: M3 avellanado + inserto térmico] */
tornillos_ang = [30, 150, 270];
z_tornillo = 16.3;
inserto_d = 4.0;     // agujero para inserto M3 (Ø ext. 4,2–4,5)
inserto_prof = 5.9;
paso_d = 3.4;        // paso del tornillo por la pared de la base
avellanado_d = 6.4;  // cabeza avellanada DIN 7991

/* [Anillo LED WS2812B] */
anillo_d_ext = 68;  // 16 LED típicos: 68 mm (24 LED: 86 mm)
anillo_d_int = 50;
anillo_e = 1.6;
n_leds = 16;
anillo_cables_ang = 60;  // ranura bajo los pads DIN/5V/GND

/* [Soporte del anillo y pedestal del electrodo] */
z_soporte = 14;     // cara inferior del plato (= tope de los postes)
e_soporte = 2;
pedestal_d = 40;    // diámetro del pedestal (y del electrodo)
holgura_pedestal = 0.8;
labio_h = 1.2;      // labio que centra el anillo
electrodo_cable = [16, 0];   // paso del cable del electrodo (x, y)

/* [Postes del soporte: tornillo autorroscante M2,5 × 8] */
postes_ang = [90, 210, 330];
postes_r = 39;
poste_d = 7;
piloto_d = 2.1;

/* [Sensor ToF GY-530 / VL53L0X] */
tof_pcb = [13.3, 10.5, 1.0];   // largo (x), ancho (y), espesor
tof_prof = 2.0;     // profundidad del bolsillo
tof_canal = [3, 0]; // centro del canal de cables
tof_canal_d = 6.5;
ventana_d = 10;     // abertura en el domo
ventana_ext_d = 16; // disco de acrílico transparente
ventana_e = 1.5;
ventana_rebaje = 1.0;

/* [Puerto de carga USB-C de panel] */
usb_ang = 0;
usb_z = 7;
usb_hueco = [9.4, 3.8];      // ancho × alto del receptáculo + juego
usb_bolsillo = [13, 8, 1.0]; // rebaje interior para la pestaña/placa

/* [Interruptor deslizante SS12D00] */
sw_ang = 180;
sw_z = 7;
sw_ranura = [5.5, 2.2];
sw_rebaje = [11, 6, 1.0];

/* [Disposición interna] */
bat = [42, 31, 10];          // LiPo 103040 (1000–1200 mAh) con su protección
bat_c = [0, -25.6];
placa = [40.64, 33.02];      // placa perforada de 16 × 13 pasos
placa_c = [0, 8.5];
placa_alto = 2.0;            // separadores
tp = [17, 26];               // módulo cargador TP4056 con protección
tp_c = [30.5, 5];
esp = [22.52, 18];           // ESP32-S3 Super Mini (USB-C hacia -X)
esp_c = [-9.06, 12];
adxl = [16, 21];             // GY-291 ADXL345
adxl_c = [11.8, 11.5];

/* [Antideslizante] */
tpu_r = [36, 44];
tpu_rebaje = 1.0;
tpu_e = 1.6;
texto_fondo = "FARO";

// ---------------------------------------------------------------------
//  Cotas derivadas
// ---------------------------------------------------------------------
$fn = calidad;
R = D / 2;
r_int = R - e_pared;
falda_r_ext = r_int - holgura;
falda_r_int = falda_r_ext - falda_e;
z_techo_int = H - e_domo;
z_ped = z_techo_int - holgura_pedestal;     // cara superior del pedestal
z_plato = z_soporte + e_soporte;             // cara superior del plato
r_plato = anillo_d_ext / 2 + 0.3 + 1.2;
placa_z = e_piso + placa_alto;
esp_z = placa_z + 1.6 + 2.5;                 // sobre espaciador de pines
adxl_z = esp_z;
tp_z = e_piso + 0.2;
bat_z = e_piso + 0.2;

function polar(r, a) = [r * cos(a), r * sin(a)];

// Perfil exterior/interior del domo (r, z): techo plano, borde redondeado
// que termina en chaflán de 45° (imprimible boca abajo sin soportes).
function arco(Rx, Rb, zc, a0, a1, n = 24) =
    [for (i = [0 : n]) let (a = a0 + (a1 - a0) * i / n)
        [Rx - Rb + Rb * cos(a), zc + Rb * sin(a)]];

function perfil(Rx, Rb, zc, ztop) =
    let (fin = [Rx - Rb + Rb * cos(45), zc + Rb * sin(45)],
         d = ztop - fin[1])
    concat([[0, ztop], [fin[0] - d, ztop]], arco(Rx, Rb, zc, 45, 0));

// =====================================================================
//  PIEZA 1 · BASE (opaca)
// =====================================================================
module base() {
    difference() {
        union() {
            rotate_extrude()
                polygon([[0, 0], [R - chaflan_inf, 0], [R, chaflan_inf], [R, h_base],
                         [r_int, h_base], [r_int, e_piso], [0, e_piso]]);
            // postes del soporte con nervio hasta la pared
            for (a = postes_ang) rotate(a) {
                translate([postes_r, 0, 0]) cylinder(d = poste_d, h = z_soporte);
                translate([postes_r, -1, 0]) cube([r_int - postes_r + 0.5, 2, 12]);
            }
            cuna_bateria();
            guias_tp4056();
            separadores_placa();
            refuerzo_usb();
        }
        // pilotos de los postes
        for (a = postes_ang) rotate(a) translate([postes_r, 0, z_soporte - 10])
            cylinder(d = piloto_d, h = 11, $fn = 24);
        // tornillos del domo (avellanados desde fuera)
        for (a = tornillos_ang) rotate(a) translate([0, 0, z_tornillo]) rotate([0, 90, 0]) {
            cylinder(d = paso_d, h = R + 1, $fn = 32);
            translate([0, 0, R - (avellanado_d - paso_d) / 2])
                cylinder(d1 = paso_d, d2 = avellanado_d + 0.02, h = (avellanado_d - paso_d) / 2 + 0.01, $fn = 32);
            translate([0, 0, R]) cylinder(d = avellanado_d + 0.02, h = 2, $fn = 32);
        }
        hueco_usb();
        hueco_interruptor();
        // rebaje del anillo antideslizante y texto del fondo
        translate([0, 0, -0.01]) difference() {
            cylinder(r = tpu_r[1], h = tpu_rebaje + 0.01);
            cylinder(r = tpu_r[0], h = tpu_rebaje + 0.02);
        }
        if (texto_fondo != "")
            translate([0, 0, -0.01]) linear_extrude(0.61) mirror([1, 0, 0])
                text(texto_fondo, size = 11, font = "Liberation Sans:style=Bold",
                     halign = "center", valign = "center");
    }
}

module cuna_bateria() {
    j = 0.6; t = 1.2; h = 4;
    translate([bat_c[0], bat_c[1], e_piso]) difference() {
        translate([-(bat[0] / 2 + j + t), -(bat[1] / 2 + j + t), 0])
            cube([bat[0] + 2 * (j + t), bat[1] + 2 * (j + t), h]);
        translate([-(bat[0] / 2 + j), -(bat[1] / 2 + j), -1])
            cube([bat[0] + 2 * j, bat[1] + 2 * j, h + 2]);
        // salida de cables hacia la placa
        translate([-8, 0, -1]) cube([16, bat[1], h + 2]);
    }
}

module guias_tp4056() {
    // cuatro topes laterales; los extremos quedan libres para cables y el USB del módulo
    j = 0.4; t = 1.2; h = 3; l = 6;
    translate([tp_c[0], tp_c[1], e_piso])
        for (sx = [-1, 1], sy = [-1, 1])
            translate([sx > 0 ? tp[0] / 2 + j : -tp[0] / 2 - j - t, sy * (tp[1] / 2 - 4) - l / 2, 0])
                cube([t, l, h]);
}

function agujeros_placa() =
    [for (sx = [-1, 1], sy = [-1, 1])
        [placa_c[0] + sx * (placa[0] / 2 - 2.54), placa_c[1] + sy * (placa[1] / 2 - 3.05)]];

module separadores_placa() {
    for (p = agujeros_placa()) translate([p[0], p[1], 0]) difference() {
        cylinder(d = 5, h = placa_z, $fn = 32);
        translate([0, 0, 1.2]) cylinder(d = 1.6, h = placa_z, $fn = 16);
    }
}

module refuerzo_usb() {
    // repisa bajo el receptáculo USB-C, para apoyarlo al pegarlo
    rotate(usb_ang) translate([r_int - 7, -usb_bolsillo[0] / 2, 0])
        cube([7.5, usb_bolsillo[0], usb_z - usb_hueco[1] / 2 - 0.15]);
}

module rect_redondeado(w, h, r) {
    offset(r) square([w - 2 * r, h - 2 * r], center = true);
}

module hueco_usb() {
    rotate(usb_ang) {
        translate([r_int - 1, 0, usb_z]) rotate([0, 90, 0]) rotate(90)
            linear_extrude(10) rect_redondeado(usb_hueco[0], usb_hueco[1], 1.3);
        // bolsillo interior para la pestaña del conector
        translate([r_int - 0.01, 0, usb_z]) rotate([0, 90, 0]) rotate(90)
            linear_extrude(usb_bolsillo[2] + 0.01) rect_redondeado(usb_bolsillo[0], usb_bolsillo[1], 1);
    }
}

module hueco_interruptor() {
    rotate(sw_ang) {
        translate([r_int - 1, 0, sw_z]) rotate([0, 90, 0]) rotate(90)
            linear_extrude(10) rect_redondeado(sw_ranura[0], sw_ranura[1], 0.6);
        translate([R - sw_rebaje[2], 0, sw_z]) rotate([0, 90, 0]) rotate(90)
            linear_extrude(5) rect_redondeado(sw_rebaje[0], sw_rebaje[1], 1.5);
    }
}

// =====================================================================
//  PIEZA 2 · DOMO (translúcido, se imprime boca abajo)
// =====================================================================
module domo() {
    ext = perfil(R, R_borde, z_borde, H);
    inn = perfil(R - e_lateral, R_borde - e_lateral, z_borde, z_techo_int);
    difference() {
        union() {
            rotate_extrude()
                polygon(concat(ext, [[R, h_base], [R - e_lateral, h_base]],
                               [for (i = [len(inn) - 1 : -1 : 0]) inn[i]]));
            // falda que entra en la base, con escalón de apoyo a 45°
            rotate_extrude()
                polygon([[falda_r_int, falda_z], [falda_r_ext - 0.5, falda_z],
                         [falda_r_ext, falda_z + 0.5], [falda_r_ext, h_base],
                         [R - e_lateral + 0.01, h_base], [R - e_lateral + 0.01, h_base + 3.7],
                         [falda_r_int, h_base + 1.5]]);
            // tetones para los insertos M3
            for (a = tornillos_ang) rotate(a) teton();
        }
        for (a = tornillos_ang) rotate(a) translate([0, 0, z_tornillo]) rotate([0, 90, 0]) {
            translate([0, 0, falda_r_ext - inserto_prof]) cylinder(d = inserto_d, h = inserto_prof + 1, $fn = 32);
            translate([0, 0, falda_r_ext - inserto_prof - 3]) cylinder(d = 2.6, h = 4, $fn = 24);
        }
        if (con_tof) {
            translate([0, 0, z_techo_int - 1]) cylinder(d = ventana_d, h = e_domo + 2, $fn = 64);
            translate([0, 0, z_techo_int - 0.01])
                cylinder(d = ventana_ext_d + 0.4, h = ventana_rebaje + 0.01, $fn = 64);
        }
    }
}

module teton() {
    w = 9;
    rotate([90, 0, 0]) linear_extrude(w, center = true)
        polygon([[falda_r_int - 5, falda_z], [falda_r_int + 0.7, falda_z],
                 [falda_r_int + 0.7, h_base], [R - 1.5, h_base + 2],
                 [R - 1.5, h_base + 6.7 + 1.0], [falda_r_int - 5, h_base]]);
}

// =====================================================================
//  PIEZA 3 · SOPORTE del anillo + pedestal del electrodo (blanco)
// =====================================================================
module soporte() {
    difference() {
        union() {
            translate([0, 0, z_soporte]) cylinder(r = r_plato, h = e_soporte);
            for (a = postes_ang) rotate(a) translate([0, 0, z_soporte]) hull() {
                translate([r_plato - 6, 0, 0]) cylinder(d = 10, h = e_soporte, $fn = 32);
                translate([postes_r, 0, 0]) cylinder(d = 8, h = e_soporte, $fn = 32);
            }
            // labio que centra el anillo
            translate([0, 0, z_plato]) difference() {
                cylinder(r = r_plato, h = labio_h);
                translate([0, 0, -1]) cylinder(r = anillo_d_ext / 2 + 0.3, h = labio_h + 2);
            }
            // pedestal macizo (imprimir con 15–20 % de relleno)
            translate([0, 0, z_plato - 0.01]) cylinder(d = pedestal_d, h = z_ped - z_plato + 0.01);
        }
        // tornillos a los postes
        for (a = postes_ang) rotate(a) translate([postes_r, 0, z_soporte - 1]) {
            cylinder(d = 2.9, h = e_soporte + 2, $fn = 24);
        }
        // ranura para los cables del anillo
        rotate(anillo_cables_ang - 12) translate([0, 0, z_soporte - 1])
            rotate_extrude(angle = 24) translate([anillo_d_int / 2 + 2.5, 0]) square([5, e_soporte + 3]);
        // muesca para enchufar la ESP32 sin desarmar (cable USB-C acodado)
        translate([-r_plato - 10, esp_c[1] - 7, z_soporte - 1])
            cube([r_plato + 10 + esp_c[0] - esp[0] / 2 - 0.5, 14, e_soporte + labio_h + 2]);
        // cable del electrodo
        translate([electrodo_cable[0], electrodo_cable[1], z_soporte - 1]) cylinder(d = 2.5, h = 30, $fn = 16);
        if (con_tof) {
            translate([-(tof_pcb[0] + 0.5) / 2, -(tof_pcb[1] + 0.5) / 2, z_ped - tof_prof])
                cube([tof_pcb[0] + 0.5, tof_pcb[1] + 0.5, tof_prof + 1]);
            translate([tof_canal[0], tof_canal[1], z_soporte - 1]) cylinder(d = tof_canal_d, h = 30, $fn = 32);
        }
    }
}

// =====================================================================
//  PIEZA 4 · ANILLO ANTIDESLIZANTE (TPU 95A)
// =====================================================================
module anillo_tpu() {
    difference() {
        cylinder(r = tpu_r[1] - 0.2, h = tpu_e);
        translate([0, 0, -1]) cylinder(r = tpu_r[0] + 0.2, h = tpu_e + 2);
    }
}

// =====================================================================
//  Plantillas 2D (para imprimir en papel y recortar)
// =====================================================================
module electrodo_2d() {
    difference() {
        circle(d = pedestal_d - 1);
        if (con_tof) square([tof_pcb[0] + 1.5, tof_pcb[1] + 1.5], center = true);
        translate(electrodo_cable) circle(d = 1.2, $fn = 16);
    }
}
module ventana_2d() { circle(d = ventana_ext_d, $fn = 96); }

// =====================================================================
//  Componentes (volúmenes de referencia para el ensamble y los choques)
// =====================================================================
module c_bateria() translate([bat_c[0] - bat[0] / 2, bat_c[1] - bat[1] / 2, bat_z]) cube(bat);
module c_placa()   translate([placa_c[0] - placa[0] / 2, placa_c[1] - placa[1] / 2, placa_z]) cube([placa[0], placa[1], 1.6]);
module c_esp32() {
    translate([esp_c[0] - esp[0] / 2, esp_c[1] - esp[1] / 2, esp_z]) cube([esp[0], esp[1], 1.0]);
    // pines y separador plástico
    translate([esp_c[0] - esp[0] / 2 + 1, esp_c[1] - esp[1] / 2, placa_z + 1.6]) cube([esp[0] - 2, 2.54, 2.5]);
    translate([esp_c[0] - esp[0] / 2 + 1, esp_c[1] + esp[1] / 2 - 2.54, placa_z + 1.6]) cube([esp[0] - 2, 2.54, 2.5]);
    // conector USB-C
    translate([esp_c[0] - esp[0] / 2 - 0.8, esp_c[1] - 4.5, esp_z + 1.0]) cube([7.4, 9, 3.2]);
}
module c_adxl() {
    translate([adxl_c[0] - adxl[0] / 2, adxl_c[1] - adxl[1] / 2, adxl_z]) cube([adxl[0], adxl[1], 1.6]);
    translate([adxl_c[0] - adxl[0] / 2 + 1, adxl_c[1] - adxl[1] / 2, placa_z + 1.6]) cube([adxl[0] - 2, 2.54, 2.5]);
}
module c_condensador() translate([-19, placa_c[1] - placa[1] / 2 + 4.3, placa_z + 1.6 + 3.15])
    rotate([0, 90, 0]) cylinder(d = 6.3, h = 8, $fn = 32);
module c_tp4056() {
    translate([tp_c[0] - tp[0] / 2, tp_c[1] - tp[1] / 2, tp_z]) cube([tp[0], tp[1], 1.2]);
    translate([tp_c[0] - 4.5, tp_c[1] - tp[1] / 2 - 0.6, tp_z + 1.2]) cube([9, 7.4, 3.2]);
}
module c_usb() rotate(usb_ang) {
    // receptáculo USB-C (8,94 × 3,26 mm, extremos redondeados) a ras de la cara exterior
    translate([R - 7.35, 0, usb_z]) rotate([0, 90, 0]) rotate(90)
        linear_extrude(7.35) rect_redondeado(8.94, 3.26, 1.6);
    translate([R - 7.35 - 2.5, -(8.94 - 3) / 2, usb_z - 1]) cube([2.6, 8.94 - 3, 2]);   // terminales
}
module c_interruptor() rotate(sw_ang) translate([r_int - 0.25, 0, sw_z]) {   // las esquinas tocan la pared curva
    translate([-4.4, -4.3, -2.25]) cube([4.4, 8.6, 4.5]);
    translate([0, -0.75, -0.75]) cube([3.0, 1.5, 1.5]);      // palanca G3
    translate([-7.0, -3.0, -0.4]) cube([2.6, 6, 0.8]);       // patas dobladas
}
module c_anillo() {
    translate([0, 0, z_plato]) difference() {
        cylinder(d = anillo_d_ext, h = anillo_e);
        translate([0, 0, -1]) cylinder(d = anillo_d_int, h = anillo_e + 2);
    }
    rm = (anillo_d_ext + anillo_d_int) / 4;
    for (i = [0 : n_leds - 1]) rotate(i * 360 / n_leds + 180 / n_leds)
        translate([rm - 2.5, -2.5, z_plato + anillo_e]) cube([5, 5, 1.6]);
}
module c_tof() if (con_tof) {
    translate([-tof_pcb[0] / 2, -tof_pcb[1] / 2, z_ped - tof_prof]) cube(tof_pcb);
    translate([-2.2, -1.2, z_ped - tof_prof + tof_pcb[2]]) cube([4.4, 2.4, 1.0]);
}
module c_ventana() if (con_tof)
    translate([0, 0, z_techo_int + ventana_rebaje - ventana_e]) cylinder(d = ventana_ext_d, h = ventana_e, $fn = 64);
module c_electrodo() translate([0, 0, z_ped]) linear_extrude(0.07) electrodo_2d();

module componentes() {
    color("#3a6fd8") c_bateria();
    color("#c8a165") c_placa();
    color("#202020") c_esp32();
    color("#7b3fa0") c_adxl();
    color("#2a2a2a") c_condensador();
    color("#1f5fbf") c_tp4056();
    color("#b0b0b0") c_usb();
    color("#303030") c_interruptor();
    color("#151515") c_anillo();
    color("#1b2a6b") c_tof();
    color("#cfe8ff", 0.6) c_ventana();
    color("#c87533") c_electrodo();
}

// Selector por nombre (para choques, secciones y vistas web)
module objeto(n) {
    if (n == "base") base();
    else if (n == "domo") domo();
    else if (n == "soporte") soporte();
    else if (n == "tpu") translate([0, 0, -(tpu_e - tpu_rebaje)]) anillo_tpu();
    else if (n == "bateria") c_bateria();
    else if (n == "placa") c_placa();
    else if (n == "esp32") c_esp32();
    else if (n == "adxl") c_adxl();
    else if (n == "condensador") c_condensador();
    else if (n == "tp4056") c_tp4056();
    else if (n == "usb") c_usb();
    else if (n == "interruptor") c_interruptor();
    else if (n == "anillo") c_anillo();
    else if (n == "tof") c_tof();
    else if (n == "ventana") c_ventana();
    else if (n == "electrodo") c_electrodo();
}

// Parámetros para el modo "choque", "seccion_2d" y vistas sueltas
choque_a = "base";
choque_b = "domo";
objeto_sel = "base";

module ensamble(dz = [0, 0, 0, 0, 0]) {
    // dz = desplazamientos para el explosionado: [componentes bajos, soporte, anillo, sensores, domo]
    color("#2b2f36") base();
    color("#2b2f36") translate([0, 0, -(tpu_e - tpu_rebaje)]) anillo_tpu();
    if (ver_componentes) translate([0, 0, dz[0]]) componentes_bajos();
    color("#f2f2f2") translate([0, 0, dz[1]]) soporte();
    if (ver_componentes) translate([0, 0, dz[2]]) color("#151515") c_anillo();
    if (ver_componentes) translate([0, 0, dz[3]]) { color("#1b2a6b") c_tof(); color("#c87533") c_electrodo(); }
    translate([0, 0, dz[4]]) {
        if (ver_componentes) color("#cfe8ff", 0.6) c_ventana();
        color("#eef6ff", 0.42) domo();
    }
}
module componentes_bajos() {
    color("#3a6fd8") c_bateria();
    color("#c8a165") c_placa();
    color("#202020") c_esp32();
    color("#7b3fa0") c_adxl();
    color("#2a2a2a") c_condensador();
    color("#1f5fbf") c_tp4056();
    color("#b0b0b0") c_usb();
    color("#303030") c_interruptor();
}

// =====================================================================
//  Selección
// =====================================================================
if (parte == "ensamble") ensamble();
else if (parte == "explosionado") ensamble([0, 26, 38, 48, 78]);
else if (parte == "corte") difference() {
    ensamble();
    rotate(angulo_corte) translate([-D, 0, -10]) cube([2 * D, D, 3 * H]);
}
else if (parte == "interior") { color("#2b2f36") base(); componentes_bajos(); }
else if (parte == "sin_domo") ensamble([0, 0, 0, 0, 500]);
else if (parte == "base") base();
else if (parte == "domo") translate([0, 0, H]) rotate([180, 0, 0]) domo();   // boca abajo
else if (parte == "soporte") translate([0, 0, -z_soporte]) soporte();
else if (parte == "anillo_tpu") anillo_tpu();
else if (parte == "electrodo_2d") electrodo_2d();
else if (parte == "ventana_2d") ventana_2d();
else if (parte == "seccion_2d") projection(cut = true) rotate([-90, 0, 0]) rotate(-angulo_corte) objeto(objeto_sel);
else if (parte == "planta_2d") projection(cut = true) translate([0, 0, -z_planta]) objeto(objeto_sel);
else if (parte == "silueta_2d") projection() objeto(objeto_sel);
else if (parte == "choque") intersection() { objeto(choque_a); objeto(choque_b); }
else if (parte == "objeto") objeto(objeto_sel);
