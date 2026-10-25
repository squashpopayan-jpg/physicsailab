// =====================================================================
//  FARO · acelerómetro ADXL345 (módulo GY-291) por I²C
//  Detecta golpes con su lógica interna de "tap" y despierta al pod.
//  Conexión: VCC→3V3, GND, SDA, SCL, CS→3V3 (modo I²C), SDO→GND (dir. 0x53),
//            INT1→GPIO 7.
// =====================================================================
#pragma once
#include <Wire.h>

#define ADXL_DIR 0x53
enum : uint8_t {
  ADXL_DEVID = 0x00, ADXL_THRESH_TAP = 0x1D, ADXL_DUR = 0x21, ADXL_LATENT = 0x22,
  ADXL_WINDOW = 0x23, ADXL_THRESH_ACT = 0x24, ADXL_ACT_INACT_CTL = 0x27, ADXL_TAP_AXES = 0x2A,
  ADXL_BW_RATE = 0x2C, ADXL_POWER_CTL = 0x2D, ADXL_INT_ENABLE = 0x2E, ADXL_INT_MAP = 0x2F,
  ADXL_INT_SOURCE = 0x30, ADXL_DATA_FORMAT = 0x31, ADXL_DATAX0 = 0x32, ADXL_FIFO_CTL = 0x38,
  ADXL_FIFO_STATUS = 0x39,
};
#define ADXL_INT_SIMPLE    0x40   // un golpe
#define ADXL_INT_DOBLE     0x20   // doble golpe
#define ADXL_INT_ACTIVIDAD 0x10

static bool accPresente = false;
static volatile bool accBandera = false;     // el pin INT1 subió
static volatile uint32_t accT_us = 0;        // instante de la interrupción

static void IRAM_ATTR accISR() {
  if (!accBandera) {
    accT_us = micros();
    accBandera = true;
  }
}

static void accEscribir(uint8_t reg, uint8_t v) {
  Wire.beginTransmission(ADXL_DIR);
  Wire.write(reg);
  Wire.write(v);
  Wire.endTransmission();
}

static uint8_t accLeer(uint8_t reg) {
  Wire.beginTransmission(ADXL_DIR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return 0;
  if (Wire.requestFrom((uint8_t)ADXL_DIR, (uint8_t)1) != 1) return 0;
  return Wire.read();
}

static bool accLeerVarios(uint8_t reg, uint8_t *buf, uint8_t n) {
  Wire.beginTransmission(ADXL_DIR);
  Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((uint8_t)ADXL_DIR, n) != n) return false;
  for (uint8_t i = 0; i < n; i++) buf[i] = Wire.read();
  return true;
}

// Umbral de golpe en décimas de g (62,5 mg por unidad del registro)
static void accFijarUmbral(uint8_t golpe_dg) {
  int v = (int)lroundf(golpe_dg * 100.0f / 62.5f);
  accEscribir(ADXL_THRESH_TAP, (uint8_t)constrain(v, 1, 255));
}

static bool accIniciar(uint8_t golpe_dg) {
  if (accLeer(ADXL_DEVID) != 0xE5) return false;
  accEscribir(ADXL_POWER_CTL, 0x00);        // en espera mientras se configura
  accEscribir(ADXL_INT_ENABLE, 0x00);
  accEscribir(ADXL_DATA_FORMAT, 0x0B);      // ±16 g, resolución completa (3,9 mg/LSB), INT activo en alto
  accEscribir(ADXL_BW_RATE, 0x0D);          // 800 muestras/s
  accFijarUmbral(golpe_dg);
  accEscribir(ADXL_DUR, 24);                // un golpe dura menos de 15 ms (625 µs/LSB)
  accEscribir(ADXL_LATENT, 16);             // 20 ms de silencio antes del segundo golpe
  accEscribir(ADXL_WINDOW, 200);            // ventana de 250 ms para el doble golpe
  accEscribir(ADXL_TAP_AXES, 0x07);         // golpes en x, y, z
  accEscribir(ADXL_FIFO_CTL, 0x80 | 31);    // FIFO en modo flujo: guarda las últimas 32 muestras
  accEscribir(ADXL_INT_MAP, 0x00);          // todas las interrupciones a INT1
  accEscribir(ADXL_INT_ENABLE, ADXL_INT_SIMPLE | ADXL_INT_DOBLE);
  accEscribir(ADXL_POWER_CTL, 0x08);        // a medir
  accLeer(ADXL_INT_SOURCE);                 // limpia eventos viejos
  pinMode(PIN_ACC_INT, INPUT);
  accBandera = false;
  attachInterrupt(digitalPinToInterrupt(PIN_ACC_INT), accISR, RISING);
  return true;
}

// Pico de |a| en las muestras guardadas en la FIFO (≈ los últimos 40 ms), en mg
static uint16_t accPicoMg() {
  uint8_t n = accLeer(ADXL_FIFO_STATUS) & 0x3F;
  int32_t max2 = 0;
  for (uint8_t i = 0; i < n; i++) {
    uint8_t b[6];
    if (!accLeerVarios(ADXL_DATAX0, b, 6)) break;
    int32_t x = (int16_t)(b[1] << 8 | b[0]);
    int32_t y = (int16_t)(b[3] << 8 | b[2]);
    int32_t z = (int16_t)(b[5] << 8 | b[4]);
    int32_t m2 = x * x + y * y + z * z;
    if (m2 > max2) max2 = m2;
  }
  float mg = sqrtf((float)max2) * 3.9f;
  return (uint16_t)min(mg, 65535.0f);
}

// Revisa si hubo golpe. Devuelve las banderas de INT_SOURCE (0 si nada).
static uint8_t accRevisar(uint32_t &t_us) {
  if (!accPresente) return 0;
  bool alto = digitalRead(PIN_ACC_INT);
  if (!accBandera && !alto) return 0;
  t_us = accBandera ? accT_us : micros();
  accBandera = false;                        // primero se baja la bandera y luego se lee
  uint8_t src = accLeer(ADXL_INT_SOURCE);    // leer INT_SOURCE baja el pin INT1
  return src & (ADXL_INT_SIMPLE | ADXL_INT_DOBLE | ADXL_INT_ACTIVIDAD);
}

// Antes de dormir: solo "actividad" (> 0,5 g) a 100 Hz en bajo consumo (≈ 50 µA)
static void accModoDespertar() {
  if (!accPresente) return;
  detachInterrupt(digitalPinToInterrupt(PIN_ACC_INT));
  accEscribir(ADXL_POWER_CTL, 0x00);
  accEscribir(ADXL_INT_ENABLE, 0x00);
  accEscribir(ADXL_FIFO_CTL, 0x00);         // FIFO apagada
  accEscribir(ADXL_BW_RATE, 0x1A);          // 100 Hz, bajo consumo
  accEscribir(ADXL_THRESH_ACT, 8);          // 0,5 g
  accEscribir(ADXL_ACT_INACT_CTL, 0xF0);    // actividad acoplada en AC, ejes x, y, z
  accEscribir(ADXL_INT_MAP, 0x00);
  accEscribir(ADXL_INT_ENABLE, ADXL_INT_ACTIVIDAD);
  accEscribir(ADXL_POWER_CTL, 0x08);
  delay(30);
  accLeer(ADXL_INT_SOURCE);
}

// |a| actual en mg (para el comando "prueba")
static uint16_t accModuloMg() {
  uint8_t b[6];
  if (!accLeerVarios(ADXL_DATAX0, b, 6)) return 0;
  float x = (int16_t)(b[1] << 8 | b[0]), y = (int16_t)(b[3] << 8 | b[2]), z = (int16_t)(b[5] << 8 | b[4]);
  return (uint16_t)(sqrtf(x * x + y * y + z * z) * 3.9f);
}
