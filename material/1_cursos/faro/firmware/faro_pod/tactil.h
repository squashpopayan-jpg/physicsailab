// =====================================================================
//  FARO · electrodo capacitivo (toque y cercanía) con el sensor táctil
//  del ESP32-S3. La lectura sube cuando una mano se acerca al electrodo.
//  Se trabaja con la variación relativa respecto a la línea base, en ‰.
// =====================================================================
#pragma once
#include "soc/soc_caps.h"

#if SOC_TOUCH_SENSOR_SUPPORTED
#define HAY_TACTIL 1
#else
#define HAY_TACTIL 0   // p. ej. ESP32-C3: sin sensor táctil
#endif

struct Umbral {          // detector con confirmación e histéresis
  bool activo = false;
  uint8_t n = 0;         // muestras seguidas por encima del umbral
  uint32_t t_us = 0;     // instante del primer cruce
};

struct EstadoTactil {
  float base = 1;        // línea base (sin manos cerca)
  float ruido = 0;       // desviación típica en reposo (‰)
  float pm = 0;          // variación actual (‰)
  float pico = 0;        // máximo desde el último reinicio (‰)
  Umbral cerca, toque;
  uint32_t ultimo_us = 0;
  uint32_t encima_ms = 0;
};

static EstadoTactil tac;
static bool tactilPresente = false;
static uint16_t umbralToque = TOQUE_PM_DEF;
static uint16_t umbralCerca = CERCA_PM_DEF;

static inline float tactilCrudo() {
#if HAY_TACTIL
  float v = (float)touchRead(PIN_ELECTRODO);
#if SOC_TOUCH_SENSOR_VERSION == 1
  return -v;            // ESP32 clásico: la lectura baja al tocar
#else
  return v;
#endif
#else
  return 0;
#endif
}

// Mide la línea base y el ruido durante ~0,5 s. ¡Sin manos cerca!
static bool tactilCalibrarBase() {
#if HAY_TACTIL
  tactilCrudo();
  delay(60);
  const int N = 120;
  double s = 0, s2 = 0;
  for (int i = 0; i < N; i++) {
    double v = tactilCrudo();
    s += v;
    s2 += v * v;
    delay(4);
  }
  double m = s / N;
  double var = max(s2 / N - m * m, 0.0);
  tac.base = (float)m;
  tac.ruido = (float)(sqrt(var) * 1000.0 / fabs(m));
  tac.cerca = Umbral();
  tac.toque = Umbral();
  tac.pico = 0;
  return fabs(m) > 1;
#else
  return false;
#endif
}

static bool tactilIniciar() {
  tactilPresente = tactilCalibrarBase();
  return tactilPresente;
}

static void tactilUmbral(Umbral &u, float pm, uint16_t umbral, uint32_t ahora) {
  if (!u.activo) {
    if (pm >= umbral) {
      if (u.n == 0) u.t_us = ahora;
      if (++u.n >= 3) u.activo = true;      // 3 muestras seguidas (≈3 ms)
    } else {
      u.n = 0;
    }
  } else if (pm < umbral * 0.6f) {           // histéresis: suelta al 60 %
    u.activo = false;
    u.n = 0;
  }
}

// Llamar en cada vuelta del loop. adaptar = seguir la deriva lenta de la línea base
static void tactilMuestrear(bool adaptar) {
  if (!tactilPresente) return;
  uint32_t ahora = micros();
  if (ahora - tac.ultimo_us < 1000) return;  // hasta 1000 muestras/s
  tac.ultimo_us = ahora;
  float v = tactilCrudo();
  float d = v - tac.base;
  tac.pm = d * 1000.0f / fabsf(tac.base);
  if (tac.pm > tac.pico) tac.pico = tac.pm;
  tactilUmbral(tac.cerca, tac.pm, umbralCerca, ahora);
  tactilUmbral(tac.toque, tac.pm, umbralToque, ahora);
  if (!adaptar) return;
  // deriva: rápida si la lectura bajó de la base, muy lenta si está quieta, nula si hay una mano
  float a = 0;
  if (tac.pm < 0) a = 0.002f;                         // τ ≈ 0,5 s
  else if (tac.pm < umbralCerca * 0.5f) a = 0.0001f;  // τ ≈ 10 s
  tac.base += a * d;
  if (tac.pm < umbralCerca * 0.5f) tac.ruido += 0.001f * (fabsf(tac.pm) - tac.ruido);
  // algo quedó pegado al domo (agua, una toalla): rebasar tras 20 s
  if (tac.cerca.activo) {
    uint32_t ms = millis();
    if (!tac.encima_ms) tac.encima_ms = ms;
    else if (ms - tac.encima_ms > 20000) {
      tac.base = v;
      tac.cerca = Umbral();
      tac.toque = Umbral();
      tac.encima_ms = 0;
    }
  } else {
    tac.encima_ms = 0;
  }
}
