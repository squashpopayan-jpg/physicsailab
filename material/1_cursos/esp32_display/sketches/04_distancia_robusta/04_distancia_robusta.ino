/* 04_distancia_robusta
   HC-SR04 con ESP32, version fiable:
   - limite de espera (timeout) para no bloquearse sin eco,
   - descarta lecturas fuera de 2-400 cm,
   - mediana de 5 medidas (elimina valores locos),
   - compensacion por temperatura. */

// --- Elija UNA placa quitando las barras de su linea ---
#define PLACA_TDISPLAY
//#define PLACA_CYD
//#define PLACA_OLED

#if defined(PLACA_TDISPLAY)
  const int PIN_TRIG = 26;
  const int PIN_ECHO = 27;
#elif defined(PLACA_CYD)
  const int PIN_TRIG = 22;
  const int PIN_ECHO = 35;
#elif defined(PLACA_OLED)
  const int PIN_TRIG = 26;
  const int PIN_ECHO = 27;
#else
  #error "Elija una placa: PLACA_TDISPLAY, PLACA_CYD o PLACA_OLED"
#endif

const float TEMPERATURA_C = 20.0;            // ponga la temperatura ambiente
const unsigned long TIMEOUT_US = 30000UL;    // 30 ms ~ 5 m de ida y vuelta
const float DIST_MIN = 2.0;                  // cm: minimo del sensor
const float DIST_MAX = 400.0;                // cm: maximo del sensor
const int N_MUESTRAS = 5;                    // lecturas por medida

// Velocidad del sonido en cm por microsegundo:
// v = 331,3 + 0,606*T  (m/s)  y  1 m/s = 0,0001 cm/us
float velocidadCmUs() {
  return (331.3 + 0.606 * TEMPERATURA_C) * 0.0001;
}

// Una lectura. Devuelve la distancia en cm o -1 si no es valida.
float medirUnaVez() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(4);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  unsigned long t = pulseIn(PIN_ECHO, HIGH, TIMEOUT_US);   // 0 si no hay eco
  if (t == 0) return -1;
  float d = t * velocidadCmUs() / 2.0;
  if (d < DIST_MIN || d > DIST_MAX) return -1;
  return d;
}

// Mediana de N_MUESTRAS lecturas validas. Devuelve -1 si hay menos de 3.
float medirDistancia() {
  float v[N_MUESTRAS];
  int n = 0;
  for (int i = 0; i < N_MUESTRAS; i++) {
    float d = medirUnaVez();
    if (d > 0) v[n++] = d;
    delay(60);                               // el sensor pide >= 60 ms entre disparos
  }
  if (n < 3) return -1;
  for (int i = 1; i < n; i++) {              // ordenar de menor a mayor (insercion)
    float x = v[i];
    int j = i - 1;
    while (j >= 0 && v[j] > x) { v[j + 1] = v[j]; j--; }
    v[j + 1] = x;
  }
  return v[n / 2];                           // el valor del medio
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  digitalWrite(PIN_TRIG, LOW);
}

void loop() {
  float d = medirDistancia();
  if (d < 0) {
    Serial.println("Sin eco valido (objeto fuera de rango o cableado incorrecto)");
  } else {
    Serial.print("Distancia: ");
    Serial.print(d, 1);                      // un decimal
    Serial.println(" cm");
  }
  delay(200);
}
