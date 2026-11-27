# Factibilidad en teléfonos reales (Fase 0.5)

> **Estado:** pendiente de mediciones. La página está en https://rauldiazsolis.github.io/bacheta-pwa/spike/ y exporta un JSON por teléfono.

## Qué se quiere saber

| Pregunta                                                                                               | Para decidir                                                                                |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| ¿Cuánto tarda el modelo por cuadro en cada teléfono, con y sin GPU?                                    | Backend, precisión y tamaño de entrada de la Fase 2; si la visión es viable en el Redmi 4G. |
| ¿Cuánto tarda la descarga real del modelo?                                                             | Pantalla de instalación y recomendación de wifi.                                            |
| ¿A qué frecuencia llegan el sensor de movimiento y el GPS, y con qué precisión?                        | Umbrales de impactos, arranque automático y agrupamiento.                                   |
| ¿Qué teclas llegan desde los botones de volumen o un control? ¿Se puede evitar que cambien el volumen? | Control manual y "Detectar tecla".                                                          |
| ¿Cuánto consume y cuánto se frena el teléfono en 20 minutos?                                           | Cuadros por segundo sostenibles y reducción automática por calor.                           |

## Teléfonos

| Teléfono             | SoC / GPU                     | Android               | Chrome        | WebGPU                       |
| -------------------- | ----------------------------- | --------------------- | ------------- | ---------------------------- |
| Moto Edge 40         | Dimensity 8020 / Mali-G77 MC9 | 15                    | 158.0.8127.42 | _a medir_                    |
| Redmi Note 12 Pro 4G | Snapdragon 732G / Adreno 618  | 13 (HyperOS 1.0.34.0) | 158.0.8127.42 | _a medir (probablemente no)_ |
| Moto G100 (opcional) | Snapdragon 870 / Adreno 650   | —                     | —             | _a medir_                    |

## Protocolo (unos 40 minutos por teléfono)

Antes de empezar: batería por encima del 80 %, **sin cargador**, wifi activo, GPS activado, cerrá las otras apps. Abrí https://rauldiazsolis.github.io/bacheta-pwa/spike/ en Chrome.

1. **Dispositivo.** Revisá que aparezca el modelo del teléfono y si hay WebGPU. Tocá «Iniciar cámara» y aceptá el permiso (apuntá a la calle o a cualquier escena con textura).
2. **Modelo.** Tocá «Borrar modelo descargado» y después «Medir modelo», con todas las configuraciones marcadas. Mide descarga, carga y 20 cuadros a 252 y 392 px por configuración. Puede tardar varios minutos en WASM; no bloquees la pantalla. Si una configuración falla, queda anotado el error y sigue.
3. **Sensores.**
   - «Medir: quieto»: dejá el teléfono apoyado en una mesa 30 s. Aceptá el permiso de ubicación.
   - «Medir: caminando»: salí y caminá 1 minuto con el teléfono en la mano, a cielo abierto.
4. **Teclas.** Tocá «Empezar a detectar» y apretá 2 o 3 veces cada botón: subir volumen, bajar volumen y, si tenés, cada botón del control Bluetooth. Anotá si **cambió el volumen**. Tocá «Terminar». Repetí con «Bloquear acción por defecto» marcado.
5. **Resistencia.** Elegí la configuración más rápida que haya funcionado y 252 px. Tocá «Empezar prueba de resistencia» y dejá el teléfono **20 minutos** al aire libre (a la sombra si hace mucho calor), sin tocarlo. Si la pantalla se apaga o la página se interrumpe, anotalo.
6. **Exportar.** Tocá «Descargar informe JSON» (queda en «Descargas») y adjuntalo al PR de la Fase 0.5, junto con lo que anotaste del volumen. El informe **no contiene fotos ni ubicaciones**.

> Desde la PC se puede recorrer todo con `?modo=simulacion` (modelo simulado y pruebas acortadas): https://rauldiazsolis.github.io/bacheta-pwa/spike/?modo=simulacion

## Resultados

### Modelo (ms por cuadro, mediana / p95)

| Teléfono | Backend | Formato | Descarga (MB · Mbps) | Carga | 252 px | 392 px |
| -------- | ------- | ------- | -------------------- | ----- | ------ | ------ |
|          |         |         |                      |       |        |        |

### Sensores

| Teléfono | Movimiento (Hz) | Giroscopio | Ruido quieto (m/s²) | GPS (Hz) | Precisión mediana quieto / caminando (m) | Cámara (máx.) |
| -------- | --------------- | ---------- | ------------------- | -------- | ---------------------------------------- | ------------- |
|          |                 |            |                     |          |                                          |               |

### Teclas detectadas

| Teléfono | Botón | `key` | `code` | ¿Cambia el volumen? | ¿Y con bloqueo? |
| -------- | ----- | ----- | ------ | ------------------- | --------------- |
|          |       |       |        |                     |                 |

### Resistencia (20 min)

| Teléfono | Config. | Batería consumida | Ritmo inicio → final | Pérdidas de pantalla encendida |
| -------- | ------- | ----------------- | -------------------- | ------------------------------ |
|          |         |                   |                      |                                |

## Conclusiones y parámetros para la Fase 2

_Se completa al cerrar la Fase 0.5._

## Limitaciones conocidas de la medición

- En GitHub Pages WASM corre en **un solo hilo** (no hay aislamiento de origen cruzado): el tiempo WASM medido es el peor caso.
- La primera inferencia incluye la compilación de shaders: se informa aparte («1.er cuadro») y no entra en la mediana.
- La imagen se toma de la cámara y se escala a un cuadrado; si la cámara no abre, se usa una imagen sintética (los tiempos no dependen del contenido).
