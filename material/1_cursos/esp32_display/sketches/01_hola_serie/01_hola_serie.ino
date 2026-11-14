/* 01_hola_serie
   Primer programa: comprueba que la placa, el cable, el driver y el
   Monitor Serie funcionan. No usa pantalla ni sensor. */

int contador = 0;               // cuenta los segundos desde el arranque

void setup() {
  Serial.begin(115200);         // abre el puerto serie a 115200 baudios
  delay(1000);                  // da tiempo a que el PC abra el puerto
  Serial.println();
  Serial.println("Hola desde el ESP32");
  Serial.print("Chip: ");
  Serial.println(ESP.getChipModel());          // p. ej. ESP32-D0WDQ6
  Serial.print("Nucleos: ");
  Serial.println(ESP.getChipCores());          // normalmente 2
  Serial.print("Frecuencia (MHz): ");
  Serial.println(ESP.getCpuFreqMHz());         // normalmente 240
  Serial.print("Flash (MB): ");
  Serial.println(ESP.getFlashChipSize() / (1024 * 1024));
}

void loop() {
  Serial.print("Han pasado ");
  Serial.print(contador);
  Serial.println(" s");
  contador++;
  delay(1000);                  // espera 1 segundo
}
