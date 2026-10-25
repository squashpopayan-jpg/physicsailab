// =====================================================================
//  FARO · sensor de distancia láser VL53L0X (módulo GY-530), opcional
//  Librería: "VL53L0X" de Pololu (Gestor de librerías de Arduino).
//  Conexión: VIN→3V3, GND, SDA, SCL, XSHUT→GPIO 9. Dirección 0x29.
// =====================================================================
#pragma once
#include <VL53L0X.h>

static VL53L0X tof;
static bool tofPresente = false;
static bool tofMidiendo = false;
static uint16_t umbralDist = DIST_MM_DEF;

static bool tofIniciar() {
  pinMode(PIN_TOF_XSHUT, INPUT);   // liberar XSHUT: la resistencia del módulo lo activa
  delay(5);
  Wire.beginTransmission(0x29);
  if (Wire.endTransmission() != 0) return false;   // no hay sensor
  tof.setTimeout(60);
  if (!tof.init()) return false;
  tof.setMeasurementTimingBudget(20000);           // 20 ms por medida (≈ 50 por segundo)
  return true;
}

static void tofArrancar() {
  if (tofPresente && !tofMidiendo) {
    tof.startContinuous(0);
    tofMidiendo = true;
  }
}

static void tofParar() {
  if (tofMidiendo) {
    tof.stopContinuous();
    tofMidiendo = false;
  }
}

// Devuelve la distancia en mm si hay una medida nueva; -1 si no la hay todavía
static int tofLeer() {
  if (!tofMidiendo) return -1;
  if ((tof.readReg(VL53L0X::RESULT_INTERRUPT_STATUS) & 0x07) == 0) return -1;
  uint16_t mm = tof.readRangeContinuousMillimeters();
  if (tof.timeoutOccurred() || mm >= 8000) return 8190;   // fuera de alcance
  return mm;
}

// Apaga el sensor del todo (antes de dormir)
static void tofApagar() {
  tofParar();
  pinMode(PIN_TOF_XSHUT, OUTPUT);
  digitalWrite(PIN_TOF_XSHUT, LOW);
}
