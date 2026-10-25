// =====================================================================
//  FARO hub · ejercicios incorporados y mensajes de los pods
// =====================================================================
#pragma once

enum TipoEj : uint8_t { EJ_NINGUNO, EJ_ALEATORIO, EJ_TODOS, EJ_GONOGO, EJ_SECUENCIA };
static const char *NOMBRE_EJ[] = {"", "aleatorio", "todos", "gonogo", "secuencia"};
enum Fase : uint8_t { F_CUENTA, F_PAUSA, F_ESPERA };

struct Ejercicio {
  TipoEj tipo = EJ_NINGUNO;
  // parámetros
  uint16_t n = 20;                 // estímulos (rondas en "todos", vueltas en "secuencia")
  uint32_t limite_ms = 0;          // si > 0 termina por tiempo
  uint8_t sensores = SEN_TODOS;
  Color si = {0, 60, 255}, no = {255, 0, 0};
  bool siAleatorio = false;
  uint16_t espera = 3000, esperaNo = 1500;
  uint16_t pausaMin = 600, pausaMax = 1800;
  uint8_t prob = 70;               // % de estímulos "sí" (go/no-go)
  uint8_t fin = FIN_DESTELLO;
  uint8_t lista[MAX_PODS];
  uint8_t nLista = 0;
  // estado
  Fase fase = F_CUENTA;
  uint8_t paso = 0;
  uint32_t tProx = 0, tInicio = 0, tRonda = 0;
  uint16_t ronda = 0, k = 0;
  int idx = -1, anterior = -1;
  bool esSi = true;
  uint16_t esperaActual = 0;
  uint8_t pendientes = 0;
  bool respondio[MAX_PODS];
  uint32_t trMax = 0;
  // estadísticas
  uint16_t aciertos = 0, omisiones = 0, errores = 0, inhibidos = 0, rondasTodos = 0;
  uint64_t suma = 0;
  uint32_t mejor = UINT32_MAX, peor = 0;
  uint64_t sumaRondas = 0;
};
static Ejercicio ej;

static bool enLista(int i) {
  for (int j = 0; j < ej.nLista; j++)
    if (ej.lista[j] == i) return true;
  return false;
}

static void registrarAcierto(uint32_t tr_us) {
  ej.aciertos++;
  ej.suma += tr_us;
  ej.mejor = min(ej.mejor, tr_us);
  ej.peor = max(ej.peor, tr_us);
}

static void terminar(bool interrumpido) {
  for (int j = 0; j < ej.nLista; j++) podApagar(pods[ej.lista[j]]);
  float seg = (millis() - ej.tInicio) / 1000.0f;
  float media = ej.aciertos ? ej.suma / 1000.0f / ej.aciertos : 0;
  float mejor = ej.aciertos ? ej.mejor / 1000.0f : 0;
  float peor = ej.aciertos ? ej.peor / 1000.0f : 0;
  salida("{\"ev\":\"fin\",\"ej\":\"%s\",\"interrumpido\":%s,\"estimulos\":%u,\"aciertos\":%u,\"omisiones\":%u,"
         "\"errores\":%u,\"inhibidos\":%u,\"media\":%.1f,\"mejor\":%.1f,\"peor\":%.1f,\"seg\":%.1f%s}",
         NOMBRE_EJ[ej.tipo], interrumpido ? "true" : "false", ej.k, ej.aciertos, ej.omisiones, ej.errores, ej.inhibidos,
         media, mejor, peor, seg,
         ej.tipo == EJ_TODOS && ej.rondasTodos
             ? (String(",\"ronda_media\":") + String(ej.sumaRondas / 1000.0f / ej.rondasTodos, 1)).c_str()
             : "");
  salida("# %s terminado: %u aciertos de %u, media %.0f ms (mejor %.0f, peor %.0f) en %.1f s", NOMBRE_EJ[ej.tipo],
         ej.aciertos, ej.k, media, mejor, peor, seg);
  // celebración: verde breve en todos
  if (!interrumpido) {
    uint16_t r = nuevaRonda();
    for (int j = 0; j < ej.nLista; j++) podEncender(pods[ej.lista[j]], {0, 255, 0}, 0, 700, FIN_APAGAR, r, 300);
  }
  ej.tipo = EJ_NINGUNO;
}

static void siguiente() {
  uint32_t ahora = millis();
  uint16_t total = ej.tipo == EJ_SECUENCIA ? ej.n * ej.nLista : ej.n;
  bool porTiempo = ej.limite_ms && ahora - ej.tInicio >= ej.limite_ms;
  if ((!ej.limite_ms && ej.k >= total) || porTiempo) {
    terminar(false);
    return;
  }
  ej.fase = F_PAUSA;
  uint16_t pmax = max(ej.pausaMin, ej.pausaMax);
  ej.tProx = ahora + (pmax > ej.pausaMin ? random(ej.pausaMin, pmax + 1) : ej.pausaMin);
}

static Color colorEstimulo() {
  if (ej.siAleatorio) return COLORES[random(N_COLORES)].c;
  return ej.si;
}

static void lanzar() {
  ej.ronda = nuevaRonda();
  ej.tRonda = millis();
  ej.fase = F_ESPERA;
  if (ej.tipo == EJ_TODOS) {
    ej.pendientes = 0;
    ej.trMax = 0;
    Color c = colorEstimulo();
    for (int j = 0; j < ej.nLista; j++) {
      Pod &p = pods[ej.lista[j]];
      ej.respondio[ej.lista[j]] = false;
      if (!p.conectado) continue;
      podEncender(p, c, ej.sensores, ej.espera, ej.fin, ej.ronda);
      ej.pendientes++;
    }
    ej.esperaActual = ej.espera;
    if (!ej.pendientes) terminar(true);
    return;
  }
  // un pod a la vez
  int elegido;
  if (ej.tipo == EJ_SECUENCIA) {
    elegido = ej.lista[ej.k % ej.nLista];
  } else {
    do {
      elegido = ej.lista[random(ej.nLista)];
    } while (ej.nLista > 1 && elegido == ej.anterior);
  }
  ej.idx = elegido;
  ej.anterior = elegido;
  Color c = colorEstimulo();
  ej.esSi = true;
  ej.esperaActual = ej.espera;
  if (ej.tipo == EJ_GONOGO) {
    ej.esSi = random(100) < ej.prob;
    if (!ej.esSi) {
      c = ej.no;
      ej.esperaActual = ej.esperaNo;
    }
  }
  podEncender(pods[elegido], c, ej.sensores, ej.esperaActual, ej.fin, ej.ronda);
}

static void alEventoEjercicio(Pod &p, const MsgEvento &e) {
  int i = indice(&p);
  float tr = e.tr_us / 1000.0f;
  bool hit = e.tipo != EV_TIEMPO;
  if (ej.tipo == EJ_TODOS) {
    if (!enLista(i) || ej.respondio[i]) return;
    ej.respondio[i] = true;
    if (hit) {
      registrarAcierto(e.tr_us);
      ej.trMax = max(ej.trMax, e.tr_us);
    } else {
      ej.omisiones++;
    }
    salida("{\"ev\":\"estimulo\",\"ej\":\"todos\",\"ronda\":%u,\"pod\":%u,\"tipo\":\"%s\",\"tr\":%.1f,\"int\":%u}", ej.k + 1,
           p.id, nombreEvento(e.tipo), tr, e.intensidad);
    if (--ej.pendientes == 0) {
      ej.k++;
      ej.rondasTodos++;
      ej.sumaRondas += ej.trMax;
      salida("{\"ev\":\"ronda\",\"ej\":\"todos\",\"ronda\":%u,\"tiempo\":%.1f}", ej.k, ej.trMax / 1000.0f);
      siguiente();
    }
    return;
  }
  if (i != ej.idx) return;
  ej.k++;
  const char *res;
  if (ej.tipo == EJ_GONOGO && !ej.esSi) {
    if (hit) {
      ej.errores++;
      res = "error";
    } else {
      ej.inhibidos++;
      res = "inhibido";
    }
  } else if (hit) {
    registrarAcierto(e.tr_us);
    res = "acierto";
  } else {
    ej.omisiones++;
    res = "omision";
  }
  salida("{\"ev\":\"estimulo\",\"ej\":\"%s\",\"k\":%u,\"pod\":%u,\"go\":%s,\"tipo\":\"%s\",\"tr\":%.1f,\"int\":%u,\"res\":\"%s\"}",
         NOMBRE_EJ[ej.tipo], ej.k, p.id, ej.esSi ? "true" : "false", nombreEvento(e.tipo), tr, e.intensidad, res);
  siguiente();
}

static void pasoEjercicio() {
  if (ej.tipo == EJ_NINGUNO) return;
  uint32_t ahora = millis();
  switch (ej.fase) {
    case F_CUENTA:                                   // 3 destellos blancos: ¡prepárate!
      if ((int32_t)(ahora - ej.tProx) < 0) return;
      if (ej.paso < 6) {
        uint16_t r = nuevaRonda();
        for (int j = 0; j < ej.nLista; j++) {
          Pod &p = pods[ej.lista[j]];
          if (ej.paso % 2 == 0) podEncender(p, {90, 90, 90}, 0, 0, FIN_MANTENER, r);
          else podApagar(p);
        }
        ej.paso++;
        ej.tProx = ahora + 330;
      } else {
        ej.tInicio = ahora;
        ej.fase = F_PAUSA;
        ej.tProx = ahora + 700;
      }
      break;
    case F_PAUSA:
      if ((int32_t)(ahora - ej.tProx) >= 0) lanzar();
      break;
    case F_ESPERA:
      // seguro: si un pod no contesta (se apagó o salió de alcance), seguir
      if (ej.esperaActual && ahora - ej.tRonda > ej.esperaActual + 1500u) {
        salida("{\"ev\":\"aviso\",\"msg\":\"sin respuesta en la ronda %u\"}", ej.k + 1);
        if (ej.tipo == EJ_TODOS) {
          ej.omisiones += ej.pendientes;
          ej.pendientes = 0;
          ej.rondasTodos++;
          ej.sumaRondas += ej.trMax;
        } else {
          ej.omisiones++;
        }
        ej.k++;
        siguiente();
      }
      break;
  }
  if (ej.tipo != EJ_NINGUNO && ej.limite_ms && ahora - ej.tInicio > ej.limite_ms + 5000 && ej.fase != F_CUENTA) terminar(false);
}

static void empezar(TipoEj tipo, const Args &a) {
  if (ej.tipo != EJ_NINGUNO) terminar(true);
  Ejercicio e;
  e.tipo = tipo;
  // pods participantes
  String lista = a("pods");
  for (int i = 0; i < MAX_PODS; i++) {
    Pod &p = pods[i];
    if (!p.usado || !p.conectado) continue;
    if (lista.length()) {
      String b = "," + lista + ",";
      if (b.indexOf("," + String(p.id) + ",") < 0) continue;
    }
    e.lista[e.nLista++] = i;
  }
  // ordenar por número de pod (para "secuencia")
  for (int i = 0; i < e.nLista; i++)
    for (int j = i + 1; j < e.nLista; j++)
      if (pods[e.lista[j]].id < pods[e.lista[i]].id) std::swap(e.lista[i], e.lista[j]);
  if (!e.nLista) {
    salida("{\"ev\":\"error\",\"msg\":\"no hay pods conectados\"}");
    return;
  }
  // parámetros con sus valores por defecto según el ejercicio
  if (tipo == EJ_TODOS) e.n = 5;
  if (tipo == EJ_SECUENCIA) {
    e.n = 3;
    e.pausaMin = e.pausaMax = 0;
  }
  if (tipo == EJ_GONOGO) e.si = {0, 255, 0};
  if (a.tiene("n")) e.n = max(1L, a("n").toInt());
  if (a.tiene("t")) e.limite_ms = (uint32_t)(a("t").toFloat() * 1000);
  if (a.tiene("sensores")) e.sensores = leerSensores(a("sensores"));
  bool al;
  if (a.tiene("color")) leerColor(a("color"), e.si, e.siAleatorio);
  if (a.tiene("si")) leerColor(a("si"), e.si, e.siAleatorio);
  if (a.tiene("no")) leerColor(a("no"), e.no, al);
  if (a.tiene("espera")) e.espera = a("espera").toInt();
  if (a.tiene("esperano")) e.esperaNo = a("esperano").toInt();
  if (a.tiene("prob")) e.prob = constrain(a("prob").toInt(), 0, 100);
  if (a.tiene("pausa")) {
    String s = a("pausa");
    int g = s.indexOf('-');
    e.pausaMin = s.toInt();
    e.pausaMax = g > 0 ? s.substring(g + 1).toInt() : e.pausaMin;
  }
  if (a.tiene("fin")) {
    String f = a("fin");
    e.fin = f == "apagar" ? FIN_APAGAR : (f == "mantener" ? FIN_MANTENER : FIN_DESTELLO);
  }
  ej = e;
  ej.tProx = millis();
  salida("{\"ev\":\"inicio\",\"ej\":\"%s\",\"pods\":%u,\"n\":%u,\"t\":%.1f,\"sensores\":\"%s\"}", NOMBRE_EJ[tipo], ej.nLista, ej.n,
         ej.limite_ms / 1000.0f, textoSensores(ej.sensores).c_str());
}

// =====================================================================
//  Mensajes de los pods
// =====================================================================
static uint16_t rondaManual = 0;

static void anunciarPod(const Pod &p, const char *ev) {
  salida("{\"ev\":\"%s\",\"pod\":%u,\"bat\":%.2f,\"pct\":%u,\"usb\":%s,\"rssi\":%d,\"sensores\":\"%s\",\"fw\":\"%.8s\","
         "\"golpe\":%.1f,\"toque\":%u,\"cerca\":%u,\"dist\":%u,\"brillo\":%u}",
         ev, p.id, p.hola.vbat_mV / 1000.0f, p.hola.carga_pct, (p.hola.flags & HOLA_USB) ? "true" : "false", p.rssi,
         textoSensores(p.hola.sensores).c_str(), p.hola.fw, p.hola.golpe_dg / 10.0f, p.hola.toque_pm, p.hola.cerca_pm,
         p.hola.dist_mm, p.hola.brillo);
}

static void atenderPaquete(const Paquete &pk) {
  const Cabecera *c = (const Cabecera *)pk.datos;
  if (c->tipo == MSG_HOLA && pk.len >= (int)sizeof(MsgHola)) {
    const MsgHola *h = (const MsgHola *)pk.datos;
    if (h->grupo != GRUPO) return;
    Pod *p = porMac(pk.mac);
    if (!p) {
      for (auto &q : pods)
        if (!q.usado) {
          p = &q;
          break;
        }
      if (!p) {
        salida("{\"ev\":\"error\",\"msg\":\"máximo %d pods\"}", MAX_PODS);
        return;
      }
      *p = Pod();
      p->usado = true;
      memcpy(p->mac, pk.mac, 6);
      agregarPar(p->mac);
    }
    bool nuevo = !p->conectado;
    p->id = c->pod;
    p->hola = *h;
    p->visto = millis();
    p->rssi = pk.rssi;
    p->conectado = true;
    if (nuevo) {
      anunciarPod(*p, "conectado");
      for (auto &q : pods)
        if (&q != p && q.usado && q.conectado && q.id == p->id)
          salida("{\"ev\":\"aviso\",\"msg\":\"dos pods con el número %u: cambia uno con el comando id\"}", p->id);
    }
    return;
  }
  if (c->tipo == MSG_EVENTO && pk.len >= (int)sizeof(MsgEvento)) {
    Pod *p = porMac(pk.mac);
    if (!p) return;
    p->visto = millis();
    const MsgEvento *e = (const MsgEvento *)pk.datos;
    if (e->ronda == p->ultimaRondaEv) return;   // repetido por un reintento
    p->ultimaRondaEv = e->ronda;
    if (ej.tipo != EJ_NINGUNO && e->ronda == ej.ronda) alEventoEjercicio(*p, *e);
    else if (e->ronda == rondaManual)
      salida("{\"ev\":\"evento\",\"pod\":%u,\"tipo\":\"%s\",\"tr\":%.1f,\"int\":%u}", p->id, nombreEvento(e->tipo),
             e->tr_us / 1000.0f, e->intensidad);
  }
}

static void revisarAusentes() {
  for (auto &p : pods)
    if (p.usado && p.conectado && millis() - p.visto > POD_AUSENTE_MS) {
      p.conectado = false;
      salida("{\"ev\":\"desconectado\",\"pod\":%u}", p.id);
    }
}
