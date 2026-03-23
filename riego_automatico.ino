/*
  Sistema de riego automático para huerto - Arduino Uno
  ------------------------------------------------------
  Componentes:
  - Sensor de humedad de suelo (analógico en A0)
  - Módulo relé (control en pin digital 7)
  - Bomba de agua conectada al relé

  Lógica principal:
  - Si la tierra está seca (lectura por encima del umbral de seco), la bomba se enciende.
  - Si la tierra está húmeda (lectura por debajo del umbral de húmedo), la bomba se apaga.

  Nota importante:
  Muchos módulos de relé son "activos en LOW" (se activan con nivel BAJO).
  Este código lo contempla con la constante RELAY_ACTIVE_LEVEL.
*/

// =========================
// Configuración de pines
// =========================
const byte SOIL_SENSOR_PIN = A0;     // Pin analógico del sensor de humedad de suelo
const byte RELAY_PIN       = 7;      // Pin digital conectado al relé

// =========================
// Configuración del relé
// =========================
// Cambiar a HIGH si tu relé se activa con HIGH.
const byte RELAY_ACTIVE_LEVEL   = LOW;
const byte RELAY_INACTIVE_LEVEL = (RELAY_ACTIVE_LEVEL == LOW) ? HIGH : LOW;

// =========================
// Umbrales de humedad (AJUSTABLES)
// =========================
// En sensores resistivos típicos:
// - Valor analógico ALTO  -> suelo MÁS seco
// - Valor analógico BAJO  -> suelo MÁS húmedo
//
// Se usa histéresis para evitar oscilaciones cerca del umbral:
// - Encendido (seco):  lectura >= DRY_THRESHOLD
// - Apagado (húmedo):  lectura <= WET_THRESHOLD
const int DRY_THRESHOLD = 650;  // Umbral para considerar "SECO" y encender bomba
const int WET_THRESHOLD = 600;  // Umbral para considerar "HÚMEDO" y apagar bomba

// =========================
// Control temporal
// =========================
const unsigned long READ_INTERVAL_MS       = 2000UL; // Tiempo entre lecturas
const unsigned long MIN_SWITCH_INTERVAL_MS = 5000UL; // Anti-rebote de control (5 s)

// =========================
// Variables de estado
// =========================
bool pumpIsOn = false;                    // Estado lógico de la bomba
unsigned long lastReadMs = 0;             // Marca de tiempo de última lectura
unsigned long lastSwitchMs = 0;           // Marca de tiempo del último cambio de estado de bomba

// Valores de calibración por defecto para conversión a porcentaje.
// Puedes ajustar estos valores tras calibrar tu sensor.
int sensorWetCal = 300; // Lectura aproximada con suelo muy húmedo / sensor en agua
int sensorDryCal = 900; // Lectura aproximada con suelo seco / sensor al aire

// -------------------------
// Declaraciones de funciones
// -------------------------
float analogToMoisturePercent(int analogValue, int wetRef, int dryRef);
void setPump(bool on);
void printStatus(int analogValue, float humidityPercent, const char* soilState, const char* pumpState);

void setup() {
  // Inicializa comunicación serial para monitoreo
  Serial.begin(9600);

  // Configura pin del relé y garantiza bomba apagada al iniciar
  pinMode(RELAY_PIN, OUTPUT);
  setPump(false);

  // Mensaje de arranque
  Serial.println(F("=== Sistema de riego automático iniciado ==="));
  Serial.print(F("Umbral seco (encender): "));
  Serial.println(DRY_THRESHOLD);
  Serial.print(F("Umbral humedo (apagar): "));
  Serial.println(WET_THRESHOLD);
  Serial.println(F("-------------------------------------------"));
}

void loop() {
  unsigned long now = millis();

  // Ejecuta lectura periódica cada 2 segundos
  if (now - lastReadMs < READ_INTERVAL_MS) {
    return;
  }
  lastReadMs = now;

  // Lee valor analógico del sensor (0 a 1023)
  int soilRaw = analogRead(SOIL_SENSOR_PIN);

  // Convierte lectura a porcentaje aproximado (0% = seco, 100% = húmedo)
  float humidityPercent = analogToMoisturePercent(soilRaw, sensorWetCal, sensorDryCal);

  // Determina estado textual del suelo
  const char* soilState = (soilRaw >= DRY_THRESHOLD) ? "SECO" : "HUMEDO";

  // Lógica de control con histéresis + protección temporal anti-conmutación rápida
  bool canSwitch = (now - lastSwitchMs) >= MIN_SWITCH_INTERVAL_MS;

  if (!pumpIsOn && soilRaw >= DRY_THRESHOLD && canSwitch) {
    // Suelo seco -> encender bomba
    setPump(true);
    lastSwitchMs = now;
  } else if (pumpIsOn && soilRaw <= WET_THRESHOLD && canSwitch) {
    // Suelo húmedo -> apagar bomba
    setPump(false);
    lastSwitchMs = now;
  }

  // Determina estado textual de la bomba
  const char* pumpState = pumpIsOn ? "ENCENDIDA" : "APAGADA";

  // Muestra telemetría por serial
  printStatus(soilRaw, humidityPercent, soilState, pumpState);
}

/*
  Convierte una lectura analógica en porcentaje de humedad.

  Parámetros:
  - analogValue: lectura actual (0..1023)
  - wetRef: valor de referencia en húmedo
  - dryRef: valor de referencia en seco

  Retorna:
  - Porcentaje aproximado entre 0 y 100.

  Fórmula:
  - Si analogValue == dryRef -> 0%
  - Si analogValue == wetRef -> 100%
*/
float analogToMoisturePercent(int analogValue, int wetRef, int dryRef) {
  // Evita división por cero por configuración incorrecta
  if (dryRef == wetRef) {
    return 0.0f;
  }

  // Normalización invertida: valores más altos indican más seco
  float percent = (float)(dryRef - analogValue) * 100.0f / (float)(dryRef - wetRef);

  // Limita el resultado al rango 0..100
  if (percent < 0.0f) percent = 0.0f;
  if (percent > 100.0f) percent = 100.0f;

  return percent;
}

// Controla físicamente la salida al relé y actualiza el estado lógico de la bomba
void setPump(bool on) {
  pumpIsOn = on;
  digitalWrite(RELAY_PIN, on ? RELAY_ACTIVE_LEVEL : RELAY_INACTIVE_LEVEL);
}

// Imprime información de diagnóstico en monitor serial
void printStatus(int analogValue, float humidityPercent, const char* soilState, const char* pumpState) {
  Serial.print(F("Valor sensor: "));
  Serial.print(analogValue);

  Serial.print(F(" | Humedad: "));
  Serial.print(humidityPercent, 1);
  Serial.print(F("%"));

  Serial.print(F(" | Suelo: "));
  Serial.print(soilState);

  Serial.print(F(" | Bomba: "));
  Serial.println(pumpState);
}
