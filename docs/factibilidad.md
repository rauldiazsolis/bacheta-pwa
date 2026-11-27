# Factibilidad en teléfonos reales (Fase 0.5)

> **Estado:** pendiente. Esta página se completa con los resultados que exporta `/spike/`.

## Teléfonos

| Teléfono             | SoC / GPU                     | Android               | Chrome        | WebGPU                       |
| -------------------- | ----------------------------- | --------------------- | ------------- | ---------------------------- |
| Moto Edge 40         | Dimensity 8020 / Mali-G77 MC9 | 15                    | 158.0.8127.42 | _a medir_                    |
| Redmi Note 12 Pro 4G | Snapdragon 732G / Adreno 618  | 13 (HyperOS 1.0.34.0) | 158.0.8127.42 | _a medir (probablemente no)_ |
| Moto G100 (opcional) | Snapdragon 870 / Adreno 650   | —                     | —             | _a medir_                    |

## Protocolo

1. Con wifi, abrir `/spike/` desde la URL de GitHub Pages. Anotar el tiempo de descarga del modelo.
2. **Modelo:** correr el benchmark (WebGPU y WASM × fp16 y q8 × 256 y 392 px, 30 cuadros cada uno).
3. **Sensores:** dejar el teléfono quieto 30 s, después caminar 1 minuto al aire libre.
4. **Teclas:** "Detectar tecla" con los botones de volumen y con cualquier control disponible.
5. **Resistencia:** prueba de 20 minutos con pantalla encendida, cámara y modelo corriendo, en condiciones parecidas a las reales (al aire libre).
6. Exportar el JSON y adjuntarlo al PR de la Fase 0.5 (no contiene fotos ni ubicaciones).

## Resultados

### Modelo (ms por cuadro, mediana / p95)

| Teléfono | Backend | Formato | 256 px | 392 px |
| -------- | ------- | ------- | ------ | ------ |
|          |         |         |        |        |

### Sensores

| Teléfono | Movimiento (Hz) | GPS (Hz) | Precisión GPS (m) | Cámara (resolución máx.) |
| -------- | --------------- | -------- | ----------------- | ------------------------ |
|          |                 |          |                   |                          |

### Teclas detectadas

| Teléfono | Botón | `key` | `code` | ¿Cambia el volumen? |
| -------- | ----- | ----- | ------ | ------------------- |
|          |       |       |        |                     |

### Resistencia (20 min)

| Teléfono | Batería consumida | fps al inicio | fps al final | ¿Se perdió la pantalla encendida? |
| -------- | ----------------- | ------------- | ------------ | --------------------------------- |
|          |                   |               |              |                                   |

## Conclusiones y parámetros para la Fase 2

_Se completa al cerrar la Fase 0.5._
