/* 05b_medidor_cyd
   Medidor de distancia HC-SR04 con la ESP32-2432S028R (CYD).
   TRIG = GPIO22 (conector CN1/P3), ECHO = GPIO35 (conector P3, con divisor),
   alimentacion 5 V desde el pin VIN del conector P1. */

#include <TFT_eSPI.h>

const int PIN_TRIG = 22;
const int PIN_ECHO = 35;
const float TEMPERATURA_C = 20.0;
const unsigned long TIMEOUT_US = 30000UL;
const float DIST_MIN = 2.0;
const float DIST_MAX = 400.0;
const int N_MUESTRAS = 5;
const float ESCALA_CM = 200.0;

TFT_eSPI tft = TFT_eSPI();

float velocidadCmUs() { return (331.3 + 0.606 * TEMPERATURA_C) * 0.0001; }

float medirUnaVez() {
  digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(4);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long t = pulseIn(PIN_ECHO, HIGH, TIMEOUT_US);
  if (t == 0) return -1;
  float d = t * velocidadCmUs() / 2.0;
  return (d < DIST_MIN || d > DIST_MAX) ? -1 : d;
}

float medirDistancia() {
  float v[N_MUESTRAS];
  int n = 0;
  for (int i = 0; i < N_MUESTRAS; i++) {
    float d = medirUnaVez();
    if (d > 0) v[n++] = d;
    delay(60);
  }
  if (n < 3) return -1;
  for (int i = 1; i < n; i++) {
    float x = v[i]; int j = i - 1;
    while (j >= 0 && v[j] > x) { v[j + 1] = v[j]; j--; }
    v[j + 1] = x;
  }
  return v[n / 2];
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);                  // GPIO35: sin pull-up interno, no hace falta
  digitalWrite(PIN_TRIG, LOW);

  tft.init();
  tft.setRotation(1);                        // 320 x 240, horizontal
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_CYAN, TFT_BLACK);
  tft.drawString("Distancia (cm)", 12, 10, 4);
}

void loop() {
  float d = medirDistancia();

  tft.setTextColor(d < 0 ? TFT_RED : TFT_GREEN, TFT_BLACK);
  tft.setTextPadding(300);
  if (d < 0) tft.drawString("-- sin eco --", 12, 70, 4);
  else       tft.drawString(String(d, 1), 12, 60, 8);  // fuente 8: cifras de 75 px
  tft.setTextPadding(0);

  int w = 0;
  if (d > 0) w = (int)(296.0 * min(d, ESCALA_CM) / ESCALA_CM);
  tft.drawRect(12, 180, 296, 36, TFT_WHITE);
  tft.fillRect(13, 181, w, 34, TFT_GREEN);
  tft.fillRect(13 + w, 181, 294 - w, 34, TFT_BLACK);

  Serial.println(d);
}
