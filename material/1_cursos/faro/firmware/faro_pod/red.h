// =====================================================================
//  FARO · radio ESP-NOW del pod
//  El pod escucha las balizas del hub, guarda su dirección y le envía
//  su estado y sus eventos. Cada envío espera la confirmación de la
//  radio (acuse de la capa MAC); los eventos se reintentan hasta 6 veces.
// =====================================================================
#pragma once
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <esp_idf_version.h>

struct Paquete {
  uint8_t mac[6];
  int8_t rssi;
  uint8_t len;
  uint8_t datos[64];
};

static QueueHandle_t colaRx = nullptr;
static QueueHandle_t colaEnvio = nullptr;      // resultados de envío (desde la tarea Wi-Fi)
static uint8_t macHub[6];
static bool hubConocido = false;
static uint32_t hubVisto_ms = 0;
static bool hubActivo = false;                 // el hub tiene un ejercicio en curso
static int8_t rssiHub = 0;
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
  (void)mac;
  uint8_t r = ok ? 1 : 0;
  xQueueSend(colaEnvio, &r, 0);
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

static bool redIniciar() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  esp_wifi_set_ps(WIFI_PS_NONE);                       // sin ahorro: menor latencia
  esp_wifi_set_channel(CANAL_WIFI, WIFI_SECOND_CHAN_NONE);
  if (esp_now_init() != ESP_OK) return false;
  colaRx = xQueueCreate(16, sizeof(Paquete));
  colaEnvio = xQueueCreate(8, sizeof(uint8_t));
  esp_now_register_recv_cb(alRecibir);
  esp_now_register_send_cb(alEnviar);
  return true;
}

static void redApagar() {
  esp_now_deinit();
  WiFi.mode(WIFI_OFF);
}

static bool redAgregarPar(const uint8_t *mac) {
  if (esp_now_is_peer_exist(mac)) return true;
  esp_now_peer_info_t p = {};
  memcpy(p.peer_addr, mac, 6);
  p.channel = CANAL_WIFI;
  p.ifidx = WIFI_IF_STA;
  p.encrypt = false;
  return esp_now_add_peer(&p) == ESP_OK;
}

static bool hubConectado() {
  return hubConocido && (millis() - hubVisto_ms < 3000);
}

// ---------- Bandeja de salida: un mensaje en vuelo a la vez ----------
struct Saliente {
  uint8_t buf[sizeof(MsgHola)];
  uint8_t len;
  bool fiable;       // reintentar si la radio no confirma
  uint8_t intentos;
};
static Saliente bandeja[6];
static uint8_t bIni = 0, bCant = 0;
static bool enVuelo = false;
static uint32_t tVuelo = 0, proxIntento = 0;

static void redEncolar(const void *msg, size_t len, bool fiable) {
  if (!hubConocido || len > sizeof(Saliente::buf)) return;
  if (bCant == 6) return;                 // bandeja llena: se pierde este mensaje
  Saliente &s = bandeja[(bIni + bCant) % 6];
  memcpy(s.buf, msg, len);
  ((Cabecera *)s.buf)->seq = seqTx++;
  s.len = len;
  s.fiable = fiable;
  s.intentos = 0;
  bCant++;
}

static void redAtenderEnvios() {
  uint8_t r;
  while (xQueueReceive(colaEnvio, &r, 0) == pdTRUE) {
    if (!enVuelo || bCant == 0) continue;
    enVuelo = false;
    Saliente &s = bandeja[bIni];
    if (r || !s.fiable || s.intentos >= 6) {
      bIni = (bIni + 1) % 6;
      bCant--;
    } else {
      proxIntento = millis() + 8 + s.intentos * 6;
    }
  }
  if (enVuelo && millis() - tVuelo > 80) enVuelo = false;   // la radio no respondió
  if (enVuelo || bCant == 0 || (int32_t)(millis() - proxIntento) < 0) return;
  Saliente &s = bandeja[bIni];
  s.intentos++;
  if (esp_now_send(macHub, s.buf, s.len) == ESP_OK) {
    enVuelo = true;
    tVuelo = millis();
  } else {
    proxIntento = millis() + 10;
    if (s.intentos >= 6) {
      bIni = (bIni + 1) % 6;
      bCant--;
    }
  }
}
