// =====================================================================
//  FARO · configuración del pod
//  Placa: ESP32-S3 Super Mini (o Seeed XIAO ESP32-S3: mismos GPIO 1–9)
// =====================================================================
#pragma once

#define FARO_FW "1.0.0"

// ---------- Pines (números de GPIO del ESP32-S3) ----------
#define PIN_ELECTRODO   1   // canal táctil T1 → electrodo de cobre (470 Ω en serie)
#define PIN_VBAT        2   // ADC1: batería por divisor 100 k / 100 k
#define PIN_VUSB        3   // ADC1 y despertar: entrada USB por divisor 100 k / 150 k
#define PIN_LED_DATOS   4   // DIN del anillo WS2812B (330 Ω en serie)
#define PIN_SDA         5   // I²C: ADXL345 y VL53L0X
#define PIN_SCL         6
#define PIN_ACC_INT     7   // INT1 del ADXL345: golpe y despertar
#define PIN_LED_ON      8   // alimenta el anillo (2N3904 → AO3401)
#define PIN_TOF_XSHUT   9   // apaga el VL53L0X (se usa como drenador abierto)

#define N_LEDS          16
#define DIVISOR_VBAT    2.0f               // (100 k + 100 k) / 100 k
#define UMBRAL_USB_MV   1500               // 5 V × 150/250 = 3,0 V en el pin

// ---------- Radio ----------
#define CANAL_WIFI      1                  // igual en todos los pods y el hub
#define GRUPO_DEFECTO   0                  // juego de pods (cámbialo con el comando "grupo")

// ---------- Umbrales por defecto (se guardan al cambiarlos) ----------
#define GOLPE_DG_DEF    15                 // 1,5 g (décimas de g)
#define TOQUE_PM_DEF    50                 // +5 % de capacitancia = contacto (antes de calibrar)
#define CERCA_PM_DEF    10                 // +1 % = mano a unos centímetros (antes de calibrar)
#define DIST_MM_DEF     120                // VL53L0X: objeto a menos de 12 cm
#define BRILLO_DEF      160                // 0–255

// ---------- Energía ----------
#define VBAT_AVISO      3.45f              // parpadeo rojo de aviso
#define VBAT_CORTE      3.30f              // se duerme para proteger la batería
#define MIN_INACTIVO    10                 // minutos sin uso antes de dormir
#define S_CARGA         20                 // cada cuántos segundos muestra la carga mientras carga
