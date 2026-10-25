// =====================================================================
//  FARO · firmware del HUB (v1.0.0)
//  Coordina los pods por ESP-NOW, trae ejercicios incorporados y habla
//  con el PC (USB) o el celular (Bluetooth LE, servicio tipo "UART" de
//  Nordic) con órdenes de texto y respuestas en JSON, una por línea.
//
//  Placa: cualquier ESP32 con BLE. Para la ESP32-S3 Super Mini elige
//  "ESP32S3 Dev Module" con USB CDC On Boot: Enabled.
//  No necesita librerías externas.
//
//  Elaborado por Mg. Manuel Alejandro Obando
//  Departamento de Física, Universidad del Cauca
// =====================================================================
#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <esp_idf_version.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "config.h"
#include "protocolo.h"

struct Color {
  uint8_t r, g, b;
};

#include "salida.h"
#include "radio.h"
#include "texto.h"
#include "ejercicios.h"
#include "ordenes.h"

// =====================================================================
void setup() {
  Serial.begin(115200);
  pinMode(PIN_BOTON, INPUT_PULLUP);
  randomSeed(esp_random());
  radioIniciar();
  bleIniciar();
  delay(300);
  uint8_t mac[6];
  WiFi.macAddress(mac);
  salida("{\"ev\":\"hub\",\"fw\":\"%s\",\"grupo\":%u,\"canal\":%u,\"mac\":\"%02X:%02X:%02X:%02X:%02X:%02X\",\"ble\":\"%s\"}",
         FARO_HUB_FW, GRUPO, CANAL_WIFI, mac[0], mac[1], mac[2], mac[3], mac[4], mac[5], NOMBRE_BLE);
  ayuda();
}

void loop() {
  static uint32_t tBaliza = 0;
  uint32_t ahora = millis();
  if (ahora - tBaliza >= BALIZA_MS) {
    tBaliza = ahora;
    MsgBaliza b = {};
    faroCabecera(b.c, MSG_BALIZA, POD_TODOS, seqTx++);
    b.grupo = GRUPO;
    b.activo = ej.tipo != EJ_NINGUNO;
    b.t_ms = ahora;
    esp_now_send(DIFUSION, (uint8_t *)&b, sizeof(b));
    revisarAusentes();
  }
  Paquete pk;
  while (xQueueReceive(colaRx, &pk, 0) == pdTRUE) atenderPaquete(pk);
  atenderResultados();
  pasoEjercicio();
  leerEntradas();
  atenderBoton();
  ledEstado();
  delay(1);
}
