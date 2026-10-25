// =====================================================================
//  FARO · firmware del POD (v1.0.0)
//  Pod de reacción: anillo RGB + golpe (ADXL345) + toque y cercanía
//  (electrodo capacitivo) + distancia láser opcional (VL53L0X).
//
//  Placa en Arduino IDE: "ESP32S3 Dev Module" con
//     USB CDC On Boot: Enabled · Flash Size: 4MB
//  (o "XIAO_ESP32S3" si usas la placa de Seeed)
//  Librerías: Adafruit NeoPixel · VL53L0X (Pololu)
//
//  Elaborado por Mg. Manuel Alejandro Obando
//  Departamento de Física, Universidad del Cauca
// =====================================================================
#include <Arduino.h>
#include <Wire.h>
#include <Preferences.h>
#include "config.h"
#include "protocolo.h"
#include "luces.h"
#include "acelerometro.h"
#include "tactil.h"
#include "distancia.h"
#include "red.h"
#include "energia.h"

// ---------- Ajustes guardados en la memoria flash ----------
struct Ajustes {
  uint8_t id, grupo, golpe_dg, brillo;
  uint16_t toque_pm, cerca_pm, dist_mm;
};
static Ajustes aj;
static Preferences prefs;

static void cargarAjustes() {
  prefs.begin("faro", true);
  aj.id = prefs.getUChar("id", 1);
  aj.grupo = prefs.getUChar("grupo", GRUPO_DEFECTO);
  aj.golpe_dg = prefs.getUChar("golpe", GOLPE_DG_DEF);
  aj.brillo = prefs.getUChar("brillo", BRILLO_DEF);
  aj.toque_pm = prefs.getUShort("toque", TOQUE_PM_DEF);
  aj.cerca_pm = prefs.getUShort("cerca", CERCA_PM_DEF);
  aj.dist_mm = prefs.getUShort("dist", DIST_MM_DEF);
  prefs.end();
}

static void guardarAjustes() {
  prefs.begin("faro", false);
  prefs.putUChar("id", aj.id);
  prefs.putUChar("grupo", aj.grupo);
  prefs.putUChar("golpe", aj.golpe_dg);
  prefs.putUChar("brillo", aj.brillo);
  prefs.putUShort("toque", aj.toque_pm);
  prefs.putUShort("cerca", aj.cerca_pm);
  prefs.putUShort("dist", aj.dist_mm);
  prefs.end();
}

static void aplicarAjustes() {
  brilloGlobal = aj.brillo;
  umbralToque = aj.toque_pm;
  umbralCerca = aj.cerca_pm;
  umbralDist = aj.dist_mm;
  if (accPresente) accFijarUmbral(aj.golpe_dg);
}

static uint8_t sensoresPresentes() {
  uint8_t s = 0;
  if (accPresente) s |= SEN_GOLPE;
  if (tactilPresente) s |= SEN_TOQUE | SEN_CERCA;
  if (tofPresente) s |= SEN_DISTANCIA;
  return s;
}

// ---------- Estado ----------
enum Estado : uint8_t { REPOSO = 0, ARMADO = 1, SOLO = 2, ESPERA_ENCENDER = 3 };
static Estado estado = REPOSO;

struct Ronda {
  uint16_t id = 0xFFFF;
  Color color;
  uint8_t sensores = 0;
  uint16_t espera_ms = 0;
  uint8_t fin = FIN_APAGAR;
  uint32_t t0_us = 0;            // instante en que el anillo se encendió
  uint32_t encender_ms = 0;      // para el retardo
  bool bloqueoTactil = false;    // la mano ya estaba cerca al encender: esperar a que se aleje
  bool bloqueoDist = false;
  uint8_t nDist = 0;
  uint32_t tDist_us = 0;
};
static Ronda ronda;

static uint32_t ultimaActividad = 0;
static uint32_t ultimoHola = 0;
static uint32_t finEfecto = 0;     // fin de un destello o aviso (ms); 0 = nada
static bool colorMantenido = false; // FIN_MANTENER: el color sigue hasta nueva orden
static float vbat = 4.0f, pctBat = 80;
static bool usb = false;
static bool dobleGolpe = false;    // pedido de modo solo
static uint8_t ultimoGolpe = 0;    // banderas del último golpe leído (para el loop)
static uint32_t tGolpe_us = 0;

static void actividad() { ultimaActividad = millis(); }

// ---------- Mensajes al hub ----------
static void enviarHola() {
  MsgHola h = {};
  faroCabecera(h.c, MSG_HOLA, aj.id, 0);
  h.grupo = aj.grupo;
  h.vbat_mV = (uint16_t)(vbat * 1000);
  h.carga_pct = (uint8_t)pctBat;
  h.flags = (usb ? HOLA_USB : 0) | (vbat < VBAT_AVISO ? HOLA_BAT_BAJA : 0);
  h.sensores = sensoresPresentes();
  h.estado = estado == ESPERA_ENCENDER ? ARMADO : estado;
  h.golpe_dg = aj.golpe_dg;
  h.toque_pm = aj.toque_pm;
  h.cerca_pm = aj.cerca_pm;
  h.dist_mm = aj.dist_mm;
  h.brillo = aj.brillo;
  strncpy(h.fw, FARO_FW, sizeof(h.fw));
  redEncolar(&h, sizeof(h), false);
  ultimoHola = millis();
}

static void enviarEvento(uint8_t tipo, uint32_t tr_us, uint16_t intensidad) {
  MsgEvento e = {};
  faroCabecera(e.c, MSG_EVENTO, aj.id, 0);
  e.ronda = ronda.id;
  e.tipo = tipo;
  e.tr_us = tr_us;
  e.intensidad = intensidad;
  redEncolar(&e, sizeof(e), true);
}

// ---------- Rondas ----------
static void encenderRonda() {
  lucesColor(ronda.color);
  ronda.t0_us = micros();          // el anillo ya muestra el color (show() terminó)
  // si la mano ya está encima, no vale: hay que alejarse primero
  ronda.bloqueoTactil = tac.cerca.activo || tac.toque.activo;
  ronda.bloqueoDist = false;
  ronda.nDist = 0;
  if (ronda.sensores & SEN_DISTANCIA) tofArrancar();
  accBandera = false;
  if (accPresente) accLeer(ADXL_INT_SOURCE);
  estado = ARMADO;
}

static void terminarRonda(uint8_t tipo, uint32_t tr_us, uint16_t intensidad, bool avisar) {
  tofParar();
  if (avisar) enviarEvento(tipo, tr_us, intensidad);
  if (tipo != EV_TIEMPO && ronda.fin == FIN_DESTELLO) {
    lucesColor(C_BLANCO);
    finEfecto = millis() + 90;
  } else if (ronda.fin == FIN_MANTENER && tipo != EV_TIEMPO) {
    colorMantenido = true;         // el color se queda hasta que el hub mande otra cosa
  } else {
    lucesApagar();
  }
  estado = REPOSO;
  actividad();
}

// Revisa los sensores pedidos. Devuelve true si hubo estímulo.
static bool detectar(uint8_t sensores, uint32_t t0, uint8_t &tipo, uint32_t &t_us, uint16_t &inten) {
  bool hay = false;
  uint32_t mejor = 0xFFFFFFFF;
  auto candidato = [&](uint8_t tp, uint32_t t, uint16_t in) {
    uint32_t dt = t - t0;
    if ((int32_t)dt < 0) dt = 0;
    if (!hay || dt < mejor) {
      hay = true;
      mejor = dt;
      tipo = tp;
      t_us = t;
      inten = in;
    }
  };
  if ((sensores & SEN_GOLPE) && (ultimoGolpe & ADXL_INT_SIMPLE)) {
    candidato(SEN_GOLPE, tGolpe_us, accPicoMg());
  }
  if (sensores & (SEN_TOQUE | SEN_CERCA)) {
    if (ronda.bloqueoTactil) {
      if (!tac.cerca.activo && !tac.toque.activo) ronda.bloqueoTactil = false;
    } else {
      if ((sensores & SEN_TOQUE) && tac.toque.activo) candidato(SEN_TOQUE, tac.toque.t_us, (uint16_t)tac.pm);
      if ((sensores & SEN_CERCA) && tac.cerca.activo) candidato(SEN_CERCA, tac.cerca.t_us, (uint16_t)tac.pm);
    }
  }
  if (sensores & SEN_DISTANCIA) {
    int mm = tofLeer();
    if (mm >= 0) {
      if (mm < umbralDist) {
        if (ronda.nDist == 0) ronda.tDist_us = micros();
        if (++ronda.nDist >= 2) candidato(SEN_DISTANCIA, ronda.tDist_us, (uint16_t)mm);
      } else {
        ronda.nDist = 0;
      }
    }
  }
  return hay;
}

// ---------- Modo solo: práctica sin hub (doble golpe en reposo) ----------
struct Solo {
  uint8_t n = 0, total = 10, fallos = 0;
  uint32_t suma = 0, mejor = 0xFFFFFFFF;
  uint32_t proximo = 0;     // cuándo encender
  bool encendido = false;
  uint32_t t0 = 0;
};
static Solo solo;

static void soloEmpezar() {
  solo = Solo();
  solo.proximo = millis() + 1500 + random(2500);
  estado = SOLO;
  lucesColor(C_VERDE, 60);
  delay(150);
  lucesApagar();
  Serial.println("# modo solo: 10 rondas. Golpea, toca o acerca la mano cuando se encienda.");
  actividad();
}

static void soloTerminar() {
  estado = REPOSO;
  lucesApagar();
  uint8_t ok = solo.n - solo.fallos;
  if (ok > 0) {
    uint32_t media = solo.suma / ok;
    Serial.printf("# fin: %u aciertos, media %lu ms, mejor %lu ms\n", ok, (unsigned long)media, (unsigned long)solo.mejor);
    Color c = media < 350 ? C_VERDE : (media < 550 ? C_AMBAR : C_ROJO);
    for (int i = 0; i < 3; i++) {
      lucesColor(c);
      delay(200);
      lucesApagar();
      delay(150);
    }
  }
  actividad();
}

static void soloPaso(uint32_t ahora) {
  uint8_t tipo;
  uint32_t t;
  uint16_t inten;
  if (!solo.encendido) {
    // salida en falso: golpear antes de que se encienda
    if (ultimoGolpe & ADXL_INT_SIMPLE) {
      Serial.println("# ¡anticipado!");
      lucesColor(C_ROJO);
      delay(300);
      lucesApagar();
      solo.proximo = millis() + 1500 + random(2500);
      return;
    }
    if ((int32_t)(ahora - solo.proximo) >= 0) {
      lucesColor(PALETA[solo.n % 8]);
      solo.t0 = micros();
      solo.encendido = true;
      ronda.bloqueoTactil = tac.cerca.activo || tac.toque.activo;
      tofArrancar();
    }
    return;
  }
  bool hay = detectar(SEN_TODOS & sensoresPresentes(), solo.t0, tipo, t, inten);
  uint32_t dt_ms = (micros() - solo.t0) / 1000;
  if (hay || dt_ms > 3000) {
    tofParar();
    solo.n++;
    if (hay) {
      uint32_t tr = (t - solo.t0) / 1000;
      solo.suma += tr;
      solo.mejor = min(solo.mejor, tr);
      Serial.printf("ronda %u: %lu ms (%s)\n", solo.n, (unsigned long)tr,
                    tipo == SEN_GOLPE ? "golpe" : tipo == SEN_TOQUE ? "toque" : tipo == SEN_CERCA ? "cerca" : "distancia");
      lucesColor(tr < 350 ? C_VERDE : (tr < 550 ? C_AMBAR : C_ROJO));
    } else {
      solo.fallos++;
      Serial.printf("ronda %u: sin respuesta\n", solo.n);
      lucesColor(C_ROJO, 40);
    }
    delay(350);
    lucesApagar();
    solo.encendido = false;
    solo.proximo = millis() + 1200 + random(2800);
    if (solo.n >= solo.total) soloTerminar();
  }
}

// ---------- Mensajes recibidos ----------
static void atenderPaquete(const Paquete &p) {
  const Cabecera *c = (const Cabecera *)p.datos;
  if (c->tipo == MSG_BALIZA) {
    if (p.len < (int)sizeof(MsgBaliza)) return;
    const MsgBaliza *b = (const MsgBaliza *)p.datos;
    if (b->grupo != aj.grupo) return;
    bool nuevo = !hubConocido || memcmp(macHub, p.mac, 6) != 0;
    if (nuevo) {
      memcpy(macHub, p.mac, 6);
      redAgregarPar(macHub);
      hubConocido = true;
      Serial.printf("# hub encontrado: %02X:%02X:%02X:%02X:%02X:%02X\n", p.mac[0], p.mac[1], p.mac[2], p.mac[3], p.mac[4], p.mac[5]);
    }
    bool estaba = millis() - hubVisto_ms < 3000;
    hubVisto_ms = millis();
    rssiHub = p.rssi;
    hubActivo = b->activo;
    if (hubActivo) actividad();
    if (nuevo || !estaba) enviarHola();
    return;
  }
  // el resto de mensajes debe venir del hub y ser para este pod
  if (!hubConocido || memcmp(macHub, p.mac, 6) != 0) return;
  if (c->pod != aj.id && c->pod != POD_TODOS) return;
  actividad();
  switch (c->tipo) {
    case MSG_ENCENDER: {
      if (p.len < (int)sizeof(MsgEncender)) return;
      const MsgEncender *m = (const MsgEncender *)p.datos;
      if (m->ronda == ronda.id && estado != REPOSO) return;   // duplicado
      if (estado == SOLO) soloTerminar();
      ronda.id = m->ronda;
      ronda.color = {m->r, m->g, m->b};
      ronda.sensores = m->sensores & sensoresPresentes();
      ronda.espera_ms = m->espera_ms;
      ronda.fin = m->fin;
      finEfecto = 0;
      colorMantenido = false;
      if (m->retardo_ms) {
        ronda.encender_ms = millis() + m->retardo_ms;
        estado = ESPERA_ENCENDER;
      } else {
        encenderRonda();
      }
      break;
    }
    case MSG_APAGAR:
      if (estado == SOLO) soloTerminar();
      tofParar();
      estado = REPOSO;
      finEfecto = 0;
      colorMantenido = false;
      lucesApagar();
      break;
    case MSG_CONFIG: {
      if (p.len < (int)sizeof(MsgConfig)) return;
      const MsgConfig *m = (const MsgConfig *)p.datos;
      if (m->golpe_dg != NO_CAMBIAR8) aj.golpe_dg = m->golpe_dg;
      if (m->brillo != NO_CAMBIAR8) aj.brillo = m->brillo;
      if (m->toque_pm != NO_CAMBIAR16) aj.toque_pm = m->toque_pm;
      if (m->cerca_pm != NO_CAMBIAR16) aj.cerca_pm = m->cerca_pm;
      if (m->dist_mm != NO_CAMBIAR16) aj.dist_mm = m->dist_mm;
      guardarAjustes();
      aplicarAjustes();
      enviarHola();
      break;
    }
    case MSG_IDENTIFICAR: {
      if (p.len < (int)sizeof(MsgIdentificar)) return;
      const MsgIdentificar *m = (const MsgIdentificar *)p.datos;
      lucesNumero(aj.id, {m->r, m->g, m->b});
      finEfecto = millis() + 2500;
      break;
    }
    case MSG_CALIBRAR:
      lucesColor(C_AZUL, 40);
      tactilCalibrarBase();
      lucesApagar();
      enviarHola();
      break;
    case MSG_DORMIR:
      dormir(usbConectado());
      break;
  }
}

// ---------- Comandos por USB (Monitor Serie a 115200) ----------
static void prueba() {
  Serial.println("# prueba de sensores durante 20 s (táctil ‰ · |a| mg · distancia mm)");
  tofArrancar();
  uint32_t t0 = millis(), tp = 0;
  int mm = -1;
  while (millis() - t0 < 20000) {
    tactilMuestrear(false);
    int d = tofLeer();
    if (d >= 0) mm = d;
    if (millis() - tp >= 100) {
      tp = millis();
      Serial.printf("tactil %6.1f ‰ (base %.0f, ruido %.2f ‰)  %s%s  |a| %5u mg  dist %d mm\n", tac.pm, tac.base, tac.ruido,
                    tac.cerca.activo ? "CERCA " : "", tac.toque.activo ? "TOQUE" : "", accPresente ? accModuloMg() : 0, mm);
      lucesBarra(constrain(tac.pm / (float)umbralToque, 0.0f, 1.0f), tac.toque.activo ? C_VERDE : C_AZUL, 120);
    }
    if (Serial.available()) break;
  }
  tofParar();
  lucesApagar();
}

static void calibrar() {
  Serial.println("# 1) No toques el pod: midiendo la línea base...");
  lucesColor(C_AZUL, 40);
  delay(800);
  tactilCalibrarBase();
  Serial.printf("#    base %.0f, ruido %.2f ‰\n", tac.base, tac.ruido);
  Serial.println("# 2) Ahora apoya la palma sobre el domo durante 4 s...");
  lucesColor(C_AMBAR, 60);
  tac.pico = 0;
  uint32_t t0 = millis();
  while (millis() - t0 < 4000) {
    tactilMuestrear(false);
    delay(1);
  }
  float pico = tac.pico;
  lucesApagar();
  if (pico < 8 * tac.ruido || pico < 5) {
    Serial.printf("# El toque casi no cambió la lectura (%.1f ‰). Revisa el cable del electrodo.\n", pico);
    return;
  }
  aj.toque_pm = (uint16_t)max(pico * 0.5f, 6 * tac.ruido + 2);
  aj.cerca_pm = (uint16_t)max(pico * 0.12f, 5 * tac.ruido + 1);
  if (aj.cerca_pm >= aj.toque_pm) aj.cerca_pm = aj.toque_pm / 2;
  guardarAjustes();
  aplicarAjustes();
  Serial.printf("# listo: toque al palmear %.1f ‰ → umbral de toque %u ‰, de cercanía %u ‰\n", pico, aj.toque_pm, aj.cerca_pm);
  lucesColor(C_VERDE, 80);
  delay(400);
  lucesApagar();
}

static void info() {
  uint8_t mac[6];
  WiFi.macAddress(mac);
  Serial.printf("FARO pod %u · firmware %s · grupo %u · MAC %02X:%02X:%02X:%02X:%02X:%02X\n", aj.id, FARO_FW, aj.grupo,
                mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  Serial.printf("batería %.2f V (%.0f %%)%s\n", vbat, pctBat, usb ? " · cargando" : "");
  Serial.printf("sensores: golpe %s · táctil %s · distancia %s\n", accPresente ? "sí" : "NO", tactilPresente ? "sí" : "NO",
                tofPresente ? "sí" : "no");
  Serial.printf("umbrales: golpe %.1f g · toque %u ‰ · cerca %u ‰ · dist %u mm · brillo %u\n", aj.golpe_dg / 10.0f, aj.toque_pm,
                aj.cerca_pm, aj.dist_mm, aj.brillo);
  Serial.printf("hub: %s (RSSI %d dBm)\n", hubConectado() ? "conectado" : "no encontrado", rssiHub);
}

static void ayuda() {
  Serial.println(
      "Comandos: info · id <1-99> · grupo <0-9> · prueba · calibrar · colores · solo\n"
      "          umbral golpe=<g> toque=<‰> cerca=<‰> dist=<mm> brillo=<0-255>\n"
      "          dormir · fabrica");
}

static void comando(String linea) {
  linea.trim();
  if (!linea.length()) return;
  actividad();
  int esp = linea.indexOf(' ');
  String cmd = esp < 0 ? linea : linea.substring(0, esp);
  String resto = esp < 0 ? "" : linea.substring(esp + 1);
  cmd.toLowerCase();
  if (cmd == "id") {
    int v = resto.toInt();
    if (v >= 1 && v <= 99) {
      aj.id = v;
      guardarAjustes();
      lucesNumero(aj.id, C_BLANCO);
      finEfecto = millis() + 1500;
      enviarHola();
    }
    Serial.printf("id = %u\n", aj.id);
  } else if (cmd == "grupo") {
    aj.grupo = constrain(resto.toInt(), 0, 9);
    guardarAjustes();
    hubConocido = false;
    Serial.printf("grupo = %u\n", aj.grupo);
  } else if (cmd == "umbral") {
    resto += ' ';
    int i = 0;
    while (i < (int)resto.length()) {
      int j = resto.indexOf(' ', i);
      String par = resto.substring(i, j);
      i = j + 1;
      int k = par.indexOf('=');
      if (k < 0) continue;
      String clave = par.substring(0, k);
      float v = par.substring(k + 1).toFloat();
      if (clave == "golpe") aj.golpe_dg = (uint8_t)constrain(lroundf(v * 10), 1, 160);
      else if (clave == "toque") aj.toque_pm = constrain((int)v, 1, 2000);
      else if (clave == "cerca") aj.cerca_pm = constrain((int)v, 1, 2000);
      else if (clave == "dist") aj.dist_mm = constrain((int)v, 20, 2000);
      else if (clave == "brillo") aj.brillo = constrain((int)v, 5, 255);
    }
    guardarAjustes();
    aplicarAjustes();
    enviarHola();
    info();
  } else if (cmd == "info") {
    info();
  } else if (cmd == "prueba") {
    prueba();
  } else if (cmd == "calibrar") {
    calibrar();
  } else if (cmd == "colores") {
    for (int i = 0; i < 8; i++) {
      lucesColor(PALETA[i]);
      delay(400);
    }
    lucesApagar();
  } else if (cmd == "solo") {
    soloEmpezar();
  } else if (cmd == "dormir") {
    dormir(usbConectado());
  } else if (cmd == "fabrica") {
    prefs.begin("faro", false);
    prefs.clear();
    prefs.end();
    Serial.println("# ajustes borrados; reiniciando");
    delay(100);
    ESP.restart();
  } else {
    ayuda();
  }
}

static void leerSerie() {
  static String buf;
  while (Serial.available()) {
    char ch = Serial.read();
    if (ch == '\n' || ch == '\r') {
      if (buf.length()) comando(buf);
      buf = "";
    } else if (buf.length() < 120) {
      buf += ch;
    }
  }
}

// ---------- Arranque ----------
static void mostrarArranque() {
  lucesNumero(aj.id, C_BLANCO);       // su número
  delay(700);
  for (int i = 0; i <= 20; i++) {     // nivel de batería
    lucesBarra(pctBat / 100.0f * i / 20, colorBateria(pctBat));
    delay(25);
  }
  delay(500);
  lucesApagar();
}

void setup() {
  liberarPinesRetenidos();
  pinMode(PIN_LED_ON, OUTPUT);
  digitalWrite(PIN_LED_ON, LOW);
  Serial.begin(115200);
  analogReadResolution(12);
  cargarAjustes();
  Wire.begin(PIN_SDA, PIN_SCL, 400000);

  // ¿por qué despertó?
  esp_sleep_wakeup_cause_t causa = esp_sleep_get_wakeup_cause();
  bool porGolpe = false;
  if (causa == ESP_SLEEP_WAKEUP_EXT1) porGolpe = esp_sleep_get_ext1_wakeup_status() & (1ULL << PIN_ACC_INT);
  if (causa == ESP_SLEEP_WAKEUP_TIMER || (causa == ESP_SLEEP_WAKEUP_EXT1 && !porGolpe)) {
    accPresente = accLeer(ADXL_DEVID) == 0xE5;
    modoCarga();                      // solo muestra la carga y vuelve a dormir
  }

  lucesAlimentar(true);
  brilloGlobal = aj.brillo;
  accPresente = accIniciar(aj.golpe_dg);
  tofPresente = tofIniciar();
  tactilIniciar();
  aplicarAjustes();
  vbat = leerVbat();
  pctBat = porcentajeBateria(vbat);
  usb = usbConectado();
  redIniciar();
  randomSeed(esp_random());
  mostrarArranque();
  info();
  ayuda();
  actividad();
}

void loop() {
  uint32_t ahora = millis();

  // 1) radio
  Paquete p;
  while (colaRx && xQueueReceive(colaRx, &p, 0) == pdTRUE) atenderPaquete(p);
  redAtenderEnvios();

  // 2) sensores
  tactilMuestrear(estado == REPOSO);
  ultimoGolpe = accRevisar(tGolpe_us);
  if ((ultimoGolpe & ADXL_INT_DOBLE) && estado == REPOSO) dobleGolpe = true;

  // 3) máquina de estados
  switch (estado) {
    case ESPERA_ENCENDER:
      if ((int32_t)(ahora - ronda.encender_ms) >= 0) encenderRonda();
      break;
    case ARMADO: {
      uint8_t tipo;
      uint32_t t;
      uint16_t inten;
      if (ronda.sensores && detectar(ronda.sensores, ronda.t0_us, tipo, t, inten)) {
        uint32_t tr = (int32_t)(t - ronda.t0_us) > 0 ? t - ronda.t0_us : 0;
        terminarRonda(tipo, tr, inten, true);
      } else if (ronda.espera_ms && (micros() - ronda.t0_us) / 1000 >= ronda.espera_ms) {
        terminarRonda(EV_TIEMPO, (uint32_t)ronda.espera_ms * 1000, 0, true);
      }
      break;
    }
    case SOLO:
      soloPaso(ahora);
      break;
    case REPOSO:
      if (dobleGolpe) {
        dobleGolpe = false;
        if (!hubConectado() || !hubActivo) soloEmpezar();
        break;
      }
      if (finEfecto) {
        if ((int32_t)(ahora - finEfecto) >= 0) {
          finEfecto = 0;
          lucesApagar();
        }
        break;
      }
      if (colorMantenido && hubConectado()) break;   // conserva el color
      if (usb) lucesAnimar(AN_CARGA, ahora, C_VERDE, pctBat);
      else if (vbat < VBAT_AVISO) lucesAnimar(AN_BAT_BAJA, ahora, C_ROJO, pctBat);
      else if (!hubConectado()) lucesAnimar(AN_BUSCANDO, ahora, C_AZUL, pctBat);
      else lucesAnimar(AN_LATIDO, ahora, PALETA[(aj.id - 1) % 8], pctBat);
      break;
  }

  // 4) batería, estado y sueño (cada segundo)
  static uint32_t tBat = 0;
  if (ahora - tBat > 1000) {
    tBat = ahora;
    float v = leerVbat();
    vbat = vbat * 0.8f + v * 0.2f;
    pctBat = porcentajeBateria(vbat);
    bool u = usbConectado();
    if (u != usb) {
      usb = u;
      actividad();
    }
    if (vbat < VBAT_CORTE && !usb && estado == REPOSO) {
      lucesColor(C_ROJO, 80);
      delay(600);
      dormir(false);
    }
    if (estado == REPOSO && ahora - ultimaActividad > (uint32_t)MIN_INACTIVO * 60000UL) dormir(usb);
  }
  if (hubConectado() && ahora - ultimoHola > 2000) enviarHola();

  leerSerie();
}
