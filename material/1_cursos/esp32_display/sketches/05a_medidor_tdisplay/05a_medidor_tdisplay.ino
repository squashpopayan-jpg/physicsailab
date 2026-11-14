/* 05a_medidor_tdisplay
   Medidor de distancia HC-SR04 con la pantalla de la LilyGO T-Display.
   TRIG = GPIO26, ECHO = GPIO27 (con divisor de tension). */

#include <TFT_eSPI.h>

const int PIN_TRIG = 26;
const int PIN_ECHO = 27;
const float TEMPERATURA_C = 20.0;
const unsigned long TIMEOUT_US = 30000UL;
const float DIST_MIN = 2.0;
const float DIST_MAX = 400.0;
const int N_MUESTRAS = 5;
const float ESCALA_CM = 200.0;               // la barra llena equivale a 200 cm

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
  pinMode(PIN_ECHO, INPUT);
  digitalWrite(PIN_TRIG, LOW);

  tft.init();
  tft.setRotation(1);                        // 240 x 135, horizontal
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_CYAN, TFT_BLACK);
  tft.drawString("Distancia (cm)", 8, 6, 2);
}

void loop() {
  float d = medirDistancia();

  // Cifra grande: el fondo negro (2.º color) borra el valor anterior
  tft.setTextColor(d < 0 ? TFT_RED : TFT_GREEN, TFT_BLACK);
  tft.setTextPadding(224);                   // borra hasta 224 px a la derecha
  if (d < 0) tft.drawString("-- sin eco --", 8, 40, 4);
  else       tft.drawString(String(d, 1), 8, 34, 7);   // fuente 7 segmentos
  tft.setTextPadding(0);

  // Barra proporcional a la distancia
  int w = 0;
  if (d > 0) w = (int)(224.0 * min(d, ESCALA_CM) / ESCALA_CM);
  tft.drawRect(8, 100, 224, 24, TFT_WHITE);
  tft.fillRect(9, 101, w, 22, TFT_GREEN);
  tft.fillRect(9 + w, 101, 222 - w, 22, TFT_BLACK);

  Serial.println(d);                         // tambien por el monitor serie
}
