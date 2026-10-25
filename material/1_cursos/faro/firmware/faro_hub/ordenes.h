// =====================================================================
//  FARO hub · órdenes de texto, botón BOOT y LED de estado
// =====================================================================
#pragma once

static void ayuda() {
  salida("# FARO hub %s · órdenes:", FARO_HUB_FW);
  salida("#  pods | ident [n|*] | enc <n|*> <color> [espera=ms] [sensores=golpe,toque,cerca,dist] | apa [n|*]");
  salida("#  config [n|*] golpe=<g> toque=<‰> cerca=<‰> dist=<mm> brillo=<0-255> | calibrar [n|*] | dormir [n|*]");
  salida("#  aleatorio [n=20|t=60] [color=azul] [sensores=..] [espera=3000] [pausa=600-1800] [pods=1,2,3]");
  salida("#  todos [n=5] [color=..] | gonogo [n=20] [si=verde] [no=rojo] [prob=70] [esperano=1500]");
  salida("#  secuencia [n=3 vueltas] [pausa=0] | alto");
  salida("#  colores: rojo verde azul amarillo cian magenta blanco naranja morado rosa lima aleatorio #RRGGBB");
}

static void ejecutar(String linea) {
  linea.trim();
  if (!linea.length()) return;
  int esp = linea.indexOf(' ');
  String cmd = esp < 0 ? linea : linea.substring(0, esp);
  String resto = esp < 0 ? "" : linea.substring(esp + 1);
  cmd.toLowerCase();
  Args a = partir(resto);
  String dest = a.nPos ? a.pos[0] : "*";

  if (cmd == "pods") {
    int n = 0;
    for (auto &p : pods)
      if (p.usado && p.conectado) {
        anunciarPod(p, "pod");
        n++;
      }
    salida("# %d pod(s) conectado(s)", n);
  } else if (cmd == "ident") {
    paraCada(dest, [](Pod &p) { podIdentificar(p); });
  } else if (cmd == "enc") {
    Color c = {0, 60, 255};
    bool al;
    if (a.nPos > 1 && !leerColor(a.pos[1], c, al)) salida("{\"ev\":\"error\",\"msg\":\"color desconocido\"}");
    if (al) c = COLORES[random(N_COLORES)].c;
    uint8_t sens = a.tiene("sensores") ? leerSensores(a("sensores")) : SEN_TODOS;
    uint16_t espera = a.tiene("espera") ? a("espera").toInt() : 0;
    rondaManual = nuevaRonda();
    uint16_t r = rondaManual;
    paraCada(dest, [&](Pod &p) { podEncender(p, c, sens, espera, FIN_DESTELLO, r); });
  } else if (cmd == "apa") {
    paraCada(dest, [](Pod &p) { podApagar(p); });
  } else if (cmd == "config") {
    MsgConfig m = {};
    faroCabecera(m.c, MSG_CONFIG, 0, 0);
    m.golpe_dg = a.tiene("golpe") ? (uint8_t)constrain(lroundf(a("golpe").toFloat() * 10), 1, 160) : NO_CAMBIAR8;
    m.toque_pm = a.tiene("toque") ? a("toque").toInt() : NO_CAMBIAR16;
    m.cerca_pm = a.tiene("cerca") ? a("cerca").toInt() : NO_CAMBIAR16;
    m.dist_mm = a.tiene("dist") ? a("dist").toInt() : NO_CAMBIAR16;
    m.brillo = a.tiene("brillo") ? (uint8_t)constrain(a("brillo").toInt(), 5, 254) : NO_CAMBIAR8;
    paraCada(dest, [&](Pod &p) {
      m.c.pod = p.id;
      encolar(p, &m, sizeof(m));
    });
  } else if (cmd == "calibrar") {
    paraCada(dest, [](Pod &p) { podSimple(p, MSG_CALIBRAR); });
  } else if (cmd == "dormir") {
    paraCada(dest, [](Pod &p) { podSimple(p, MSG_DORMIR); });
  } else if (cmd == "aleatorio") {
    empezar(EJ_ALEATORIO, a);
  } else if (cmd == "todos") {
    empezar(EJ_TODOS, a);
  } else if (cmd == "gonogo") {
    empezar(EJ_GONOGO, a);
  } else if (cmd == "secuencia") {
    empezar(EJ_SECUENCIA, a);
  } else if (cmd == "alto") {
    if (ej.tipo != EJ_NINGUNO) terminar(true);
  } else {
    ayuda();
  }
}

static void leerEntradas() {
  static String usb, ble;
  while (Serial.available()) {
    char ch = Serial.read();
    if (ch == '\n' || ch == '\r') {
      if (usb.length()) ejecutar(usb);
      usb = "";
    } else if (usb.length() < 200) {
      usb += ch;
    }
  }
  Trozo t;
  while (colaBle && xQueueReceive(colaBle, &t, 0) == pdTRUE) {
    for (int i = 0; i < t.n; i++) {
      char ch = t.t[i];
      if (ch == '\n' || ch == '\r') {
        if (ble.length()) ejecutar(ble);
        ble = "";
      } else if (ble.length() < 200) {
        ble += ch;
      }
    }
  }
  // apps que no mandan salto de línea: la orden termina tras 150 ms de silencio
  if (ble.length() && millis() - bleUltimo_ms > 150) {
    ejecutar(ble);
    ble = "";
  }
}

// =====================================================================
//  Botón BOOT y LED de estado
// =====================================================================
static void atenderBoton() {
  static bool antes = false, largo = false;
  static uint32_t tAbajo = 0;
  bool abajo = digitalRead(PIN_BOTON) == LOW;
  uint32_t ahora = millis();
  if (abajo && !antes) {
    tAbajo = ahora;
    largo = false;
  }
  if (abajo && !largo && ahora - tAbajo > 900) {        // pulsación larga
    largo = true;
    paraCada("*", [](Pod &p) { podIdentificar(p); });
  }
  if (!abajo && antes && !largo && ahora - tAbajo > 30) {   // pulsación corta
    if (ej.tipo != EJ_NINGUNO) terminar(true);
    else empezar(EJ_ALEATORIO, Args());
  }
  antes = abajo;
}

static void ledEstado() {
#ifdef RGB_BUILTIN
  static uint32_t t = 0;
  uint32_t ahora = millis();
  if (ahora - t < 100) return;
  t = ahora;
  bool hayPods = false;
  for (auto &p : pods)
    if (p.usado && p.conectado) hayPods = true;
  bool fase = (ahora / 500) % 2;
  if (ej.tipo != EJ_NINGUNO) rgbLedWrite(RGB_BUILTIN, 0, 30, 0);
  else if (bleConectado) rgbLedWrite(RGB_BUILTIN, 0, 0, 30);
  else if (hayPods) rgbLedWrite(RGB_BUILTIN, 0, fase ? 12 : 0, fase ? 12 : 0);
  else rgbLedWrite(RGB_BUILTIN, fase ? 20 : 0, fase ? 8 : 0, 0);
#endif
}
