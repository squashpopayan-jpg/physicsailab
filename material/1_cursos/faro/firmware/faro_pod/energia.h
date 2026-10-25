// =====================================================================
//  FARO · batería, carga y sueño profundo
// =====================================================================
#pragma once
#include <esp_sleep.h>
#include <driver/gpio.h>
#include <esp_idf_version.h>

static float leerVbat() {
  uint32_t s = 0;
  for (int i = 0; i < 8; i++) s += analogReadMilliVolts(PIN_VBAT);
  return s / 8.0f * DIVISOR_VBAT / 1000.0f;
}

static bool usbConectado() {
  return analogReadMilliVolts(PIN_VUSB) > UMBRAL_USB_MV;
}

// Curva aproximada de descarga de una LiPo a ~0,2 C (V → %)
static float porcentajeBateria(float v) {
  static const float tv[] = {3.30f, 3.50f, 3.62f, 3.70f, 3.76f, 3.82f, 3.90f, 4.00f, 4.10f, 4.20f};
  static const float tp[] = {0, 5, 15, 30, 45, 58, 70, 82, 93, 100};
  if (v <= tv[0]) return 0;
  for (int i = 1; i < 10; i++)
    if (v < tv[i]) return tp[i - 1] + (tp[i] - tp[i - 1]) * (v - tv[i - 1]) / (tv[i] - tv[i - 1]);
  return 100;
}

static void liberarPinesRetenidos() {
  gpio_hold_dis((gpio_num_t)PIN_LED_ON);
  gpio_hold_dis((gpio_num_t)PIN_TOF_XSHUT);
  gpio_deep_sleep_hold_dis();
}

// Sueño profundo (≈ 0,1–0,2 mA en total). Despierta con un golpe al pod,
// al conectar el cargador o, si "temporizador", cada S_CARGA segundos.
static void dormir(bool temporizador) {
  Serial.println("# a dormir");
  Serial.flush();
  lucesAlimentar(false);
  gpio_hold_en((gpio_num_t)PIN_LED_ON);       // anillo sin alimentación durante el sueño
  tofApagar();                                // XSHUT en bajo (sin sensor no pasa nada)
  gpio_hold_en((gpio_num_t)PIN_TOF_XSHUT);
  accModoDespertar();
  redApagar();
  uint64_t mascara = 0;
  if (accPresente) mascara |= 1ULL << PIN_ACC_INT;
  if (!usbConectado()) mascara |= 1ULL << PIN_VUSB;
#if ESP_IDF_VERSION >= ESP_IDF_VERSION_VAL(5, 2, 0)
  if (mascara) esp_sleep_enable_ext1_wakeup_io(mascara, ESP_EXT1_WAKEUP_ANY_HIGH);
#else
  if (mascara) esp_sleep_enable_ext1_wakeup(mascara, ESP_EXT1_WAKEUP_ANY_HIGH);
#endif
  if (temporizador) esp_sleep_enable_timer_wakeup((uint64_t)S_CARGA * 1000000ULL);
  gpio_deep_sleep_hold_en();
  esp_deep_sleep_start();
}

// Modo carga: el pod despertó solo para mostrar la carga (sin radio).
static void modoCarga() {
  if (!usbConectado()) dormir(false);         // ya no hay cargador
  lucesAlimentar(true);
  brilloGlobal = 70;
  float pct = porcentajeBateria(leerVbat());
  uint32_t t0 = millis();
  while (millis() - t0 < 1600) {
    lucesAnimar(AN_CARGA, millis(), C_VERDE, pct);
    delay(10);
  }
  dormir(true);
}
