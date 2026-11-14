/* 03_distancia_basica
   HC-SR04 con ESP32: la lectura mas sencilla posible, por el Monitor Serie.
   ¡Recuerde el divisor de tension en ECHO (5 V -> 3,3 V)! */

// --- Elija UNA placa quitando las barras de su linea ---
#define PLACA_TDISPLAY
//#define PLACA_CYD
//#define PLACA_OLED

#if defined(PLACA_TDISPLAY)
  const int PIN_TRIG = 26;      // salida: dispara el pulso ultrasonico
  const int PIN_ECHO = 27;      // entrada: recibe el eco (CON divisor)
#elif defined(PLACA_CYD)
  const int PIN_TRIG = 22;
  const int PIN_ECHO = 35;      // GPIO35 es solo entrada: ideal para ECHO
#elif defined(PLACA_OLED)
  const int PIN_TRIG = 26;
  const int PIN_ECHO = 27;
#else
  #error "Elija una placa: PLACA_TDISPLAY, PLACA_CYD o PLACA_OLED"
#endif

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  digitalWrite(PIN_TRIG, LOW);  // TRIG en reposo
}

void loop() {
  // 1) Pulso de disparo: 10 microsegundos en alto
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(4);         // asegura un LOW limpio antes del pulso
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);        // el HC-SR04 exige >= 10 us
  digitalWrite(PIN_TRIG, LOW);

  // 2) Medimos cuanto dura el pulso ECHO en alto (microsegundos)
  unsigned long duracion = pulseIn(PIN_ECHO, HIGH);

  // 3) Convertimos tiempo a distancia: el sonido va y vuelve (ida y vuelta)
  //    velocidad del sonido ~ 0,0343 cm/us a 20 C  ->  d = t * 0,0343 / 2
  float distancia = duracion * 0.0343 / 2.0;

  Serial.print("Tiempo: ");
  Serial.print(duracion);
  Serial.print(" us   Distancia: ");
  Serial.print(distancia);
  Serial.println(" cm");

  delay(500);                   // dos lecturas por segundo
}
