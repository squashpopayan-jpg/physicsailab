// =====================================================================
//  FARO hub · radio ESP-NOW, pods conocidos y órdenes a los pods
// =====================================================================
#pragma once

struct Paquete {
  uint8_t mac[6];
  int8_t rssi;
  uint8_t len;
  uint8_t datos[64];
};
struct ResEnvio {
  uint8_t mac[6];
  uint8_t ok;
};
static QueueHandle_t colaRx, colaRes;
static const uint8_t DIFUSION[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
static uint16_t seqTx = 0;

static void alRecibir(const esp_now_recv_info_t *info, const uint8_t *d, int n) {
  if (!faroValido(d, n) || n > 64) return;
  Paquete p;
  memcpy(p.mac, info->src_addr, 6);
  p.rssi = info->rx_ctrl ? info->rx_ctrl->rssi : 0;
  p.len = n;
  memcpy(p.datos, d, n);
  xQueueSend(colaRx, &p, 0);
}

static void resultadoEnvio(const uint8_t *mac, bool ok) {
  if (!mac) return;
  ResEnvio r;
  memcpy(r.mac, mac, 6);
  r.ok = ok;
  xQueueSend(colaRes, &r, 0);
}
#if ESP_IDF_VERSION >= ESP_IDF_VERSION_VAL(5, 5, 0)
static void alEnviar(const esp_now_send_info_t *info, esp_now_send_status_t st) {
  resultadoEnvio(info ? info->des_addr : nullptr, st == ESP_NOW_SEND_SUCCESS);
}
#else
static void alEnviar(const uint8_t *mac, esp_now_send_status_t st) {
  resultadoEnvio(mac, st == ESP_NOW_SEND_SUCCESS);
}
#endif

static bool agregarPar(const uint8_t *mac) {
  if (esp_now_is_peer_exist(mac)) return true;
  esp_now_peer_info_t p = {};
  memcpy(p.peer_addr, mac, 6);
  p.channel = CANAL_WIFI;
  p.ifidx = WIFI_IF_STA;
  p.encrypt = false;
  return esp_now_add_peer(&p) == ESP_OK;
}

static void radioIniciar() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  esp_wifi_set_ps(WIFI_PS_NONE);
  esp_wifi_set_channel(CANAL_WIFI, WIFI_SECOND_CHAN_NONE);
  colaRx = xQueueCreate(24, sizeof(Paquete));
  colaRes = xQueueCreate(24, sizeof(ResEnvio));
  if (esp_now_init() != ESP_OK) {
    salida("# ERROR: no arrancó ESP-NOW");
    return;
  }
  esp_now_register_recv_cb(alRecibir);
  esp_now_register_send_cb(alEnviar);
  agregarPar(DIFUSION);
}

// =====================================================================
//  Pods conocidos y su bandeja de salida (un mensaje en vuelo por pod)
// =====================================================================
struct Saliente {
  uint8_t buf[24];
  uint8_t len;
  bool fiable;
  uint8_t intentos;
};
struct Pod {
  bool usado = false;
  bool conectado = false;
  uint8_t mac[6];
  uint8_t id = 0;
  uint32_t visto = 0;
  int8_t rssi = 0;
  MsgHola hola;
  uint16_t ultimaRondaEv = 0xFFFF;
  Saliente cola[4];
  uint8_t qIni = 0, qCant = 0;
  bool enVuelo = false;
  uint32_t tVuelo = 0, prox = 0;
};
static Pod pods[MAX_PODS];

static Pod *porMac(const uint8_t *mac) {
  for (auto &p : pods)
    if (p.usado && memcmp(p.mac, mac, 6) == 0) return &p;
  return nullptr;
}

static Pod *porId(int id) {
  for (auto &p : pods)
    if (p.usado && p.conectado && p.id == id) return &p;
  return nullptr;
}

static int indice(const Pod *p) { return p - pods; }

static void atenderPod(Pod &p) {
  uint32_t ahora = millis();
  if (p.enVuelo) {
    if (ahora - p.tVuelo < 80) return;
    p.enVuelo = false;                         // la radio no respondió: se reintenta
  }
  if (!p.qCant || (int32_t)(ahora - p.prox) < 0) return;
  Saliente &s = p.cola[p.qIni];
  if (s.intentos >= 6) {
    p.qIni = (p.qIni + 1) % 4;
    p.qCant--;
    return;
  }
  s.intentos++;
  if (esp_now_send(p.mac, s.buf, s.len) == ESP_OK) {
    p.enVuelo = true;
    p.tVuelo = ahora;
  } else {
    p.prox = ahora + 10;
  }
}

static void encolar(Pod &p, const void *msg, size_t len, bool fiable = true) {
  if (p.qCant == 4 || len > sizeof(Saliente::buf)) return;
  Saliente &s = p.cola[(p.qIni + p.qCant) % 4];
  memcpy(s.buf, msg, len);
  ((Cabecera *)s.buf)->seq = seqTx++;
  s.len = len;
  s.fiable = fiable;
  s.intentos = 0;
  p.qCant++;
  atenderPod(p);                               // sale de una vez si no hay otro en vuelo
}

static void atenderResultados() {
  ResEnvio r;
  while (xQueueReceive(colaRes, &r, 0) == pdTRUE) {
    Pod *p = porMac(r.mac);
    if (!p || !p->enVuelo || !p->qCant) continue;
    p->enVuelo = false;
    Saliente &s = p->cola[p->qIni];
    if (r.ok || !s.fiable || s.intentos >= 6) {
      p->qIni = (p->qIni + 1) % 4;
      p->qCant--;
    } else {
      p->prox = millis() + 5 + 5 * s.intentos;
    }
  }
  for (auto &p : pods)
    if (p.usado) atenderPod(p);
}

// ---------- Órdenes a los pods ----------
static uint16_t rondaSig = 1;
static uint16_t nuevaRonda() {
  if (++rondaSig == 0xFFFF) rondaSig = 1;
  return rondaSig;
}

static void podEncender(Pod &p, Color c, uint8_t sensores, uint16_t espera, uint8_t fin, uint16_t ronda,
                        uint16_t retardo = 0) {
  MsgEncender m = {};
  faroCabecera(m.c, MSG_ENCENDER, p.id, 0);
  m.ronda = ronda;
  m.r = c.r;
  m.g = c.g;
  m.b = c.b;
  m.sensores = sensores;
  m.espera_ms = espera;
  m.retardo_ms = retardo;
  m.fin = fin;
  encolar(p, &m, sizeof(m));
}

static void podApagar(Pod &p) {
  Cabecera c;
  faroCabecera(c, MSG_APAGAR, p.id, 0);
  encolar(p, &c, sizeof(c));
}

static void podSimple(Pod &p, uint8_t tipo) {
  Cabecera c;
  faroCabecera(c, tipo, p.id, 0);
  encolar(p, &c, sizeof(c));
}

static void podIdentificar(Pod &p) {
  MsgIdentificar m = {};
  faroCabecera(m.c, MSG_IDENTIFICAR, p.id, 0);
  m.r = 255;
  m.g = 255;
  m.b = 255;
  encolar(p, &m, sizeof(m));
}
