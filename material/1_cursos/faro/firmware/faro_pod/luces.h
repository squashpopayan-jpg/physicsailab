// =====================================================================
//  FARO · anillo de LED WS2812B
// =====================================================================
#pragma once
#include <Adafruit_NeoPixel.h>

static Adafruit_NeoPixel anillo(N_LEDS, PIN_LED_DATOS, NEO_GRB + NEO_KHZ800);
static uint8_t brilloGlobal = BRILLO_DEF;

struct Color { uint8_t r, g, b; };
static const Color C_APAGADO = {0, 0, 0};
static const Color C_BLANCO = {255, 255, 255};
static const Color C_ROJO = {255, 0, 0};
static const Color C_VERDE = {0, 255, 0};
static const Color C_AZUL = {0, 60, 255};
static const Color C_AMBAR = {255, 120, 0};
// colores propios de cada pod en reposo (según su número)
static const Color PALETA[] = {{0, 160, 255}, {255, 60, 0}, {0, 255, 80}, {255, 0, 160},
                               {255, 200, 0}, {140, 0, 255}, {0, 255, 255}, {255, 255, 255}};

// Enciende o apaga la alimentación del anillo (transistor alto en PIN_LED_ON)
static void lucesAlimentar(bool on) {
  if (on) {
    pinMode(PIN_LED_ON, OUTPUT);
    digitalWrite(PIN_LED_ON, HIGH);
    delay(2);                       // los WS2812B necesitan ~1 ms para despertar
    anillo.begin();
  } else {
    anillo.clear();
    anillo.show();
    digitalWrite(PIN_LED_ON, LOW);
    pinMode(PIN_LED_DATOS, INPUT);  // evita alimentar los LED por la línea de datos
  }
}

static uint32_t colorEscalado(Color c, uint8_t nivel = 255) {
  uint16_t k = (uint16_t)nivel * brilloGlobal / 255;
  return anillo.Color((uint16_t)c.r * k / 255, (uint16_t)c.g * k / 255, (uint16_t)c.b * k / 255);
}

static void lucesColor(Color c, uint8_t nivel = 255) {
  anillo.fill(colorEscalado(c, nivel));
  anillo.show();
}

static void lucesApagar() {
  anillo.clear();
  anillo.show();
}

// Barra circular: enciende la fracción indicada del anillo
static void lucesBarra(float fraccion, Color c, uint8_t nivel = 255) {
  fraccion = constrain(fraccion, 0.0f, 1.0f);
  float n = fraccion * N_LEDS;
  anillo.clear();
  for (int i = 0; i < N_LEDS; i++) {
    float f = constrain(n - i, 0.0f, 1.0f);   // el último LED se enciende parcialmente
    if (f > 0) anillo.setPixelColor(i, colorEscalado(c, (uint8_t)(nivel * f)));
  }
  anillo.show();
}

// Muestra un número: n LED encendidos (si n > N_LEDS, decenas en rojo + unidades)
static void lucesNumero(int n, Color c) {
  anillo.clear();
  if (n <= N_LEDS) {
    for (int i = 0; i < n; i++) anillo.setPixelColor(i, colorEscalado(c));
  } else {
    int d = n / 10, u = n % 10;
    for (int i = 0; i < d && i < N_LEDS; i++) anillo.setPixelColor(i, colorEscalado(C_ROJO));
    for (int i = 0; i < u && d + 1 + i < N_LEDS; i++) anillo.setPixelColor(d + 1 + i, colorEscalado(c));
  }
  anillo.show();
}

static Color colorBateria(float pct) {
  if (pct >= 50) return C_VERDE;
  if (pct >= 20) return C_AMBAR;
  return C_ROJO;
}

// ---------- Animaciones de reposo (no bloqueantes) ----------
enum Animacion { AN_NADA, AN_BUSCANDO, AN_LATIDO, AN_CARGA, AN_BAT_BAJA };

static void lucesAnimar(Animacion a, uint32_t ahora, Color propio, float pct) {
  static uint32_t ultimo = 0;
  if (ahora - ultimo < 30) return;          // ~33 cuadros por segundo
  ultimo = ahora;
  switch (a) {
    case AN_BUSCANDO: {                      // un punto azul que gira: buscando el hub
      int i = (ahora / 90) % N_LEDS;
      anillo.clear();
      anillo.setPixelColor(i, colorEscalado(C_AZUL, 90));
      anillo.setPixelColor((i + N_LEDS - 1) % N_LEDS, colorEscalado(C_AZUL, 25));
      anillo.show();
      break;
    }
    case AN_LATIDO: {                        // destello suave cada 3 s: conectado y listo
      uint32_t f = ahora % 3000;
      uint8_t nivel = f < 300 ? anillo.sine8((uint8_t)(192 + f * 256 / 300)) / 5 : 0;   // sube y baja desde 0
      lucesColor(propio, nivel);
      break;
    }
    case AN_CARGA: {                         // barra de carga con el último LED respirando
      uint8_t onda = anillo.sine8((uint8_t)(ahora / 8));
      lucesBarra(pct / 100.0f, pct >= 97 ? C_VERDE : C_AMBAR, 40 + onda / 4);
      break;
    }
    case AN_BAT_BAJA: {
      uint32_t f = ahora % 2000;
      lucesColor(C_ROJO, f < 150 ? 60 : 0);
      break;
    }
    default:
      break;
  }
}
