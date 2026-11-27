# Diseño de algoritmos

Todos los valores numéricos son **iniciales**: se ajustan con los resultados de la Fase 0.5 y con las grabaciones reales de la Fase 1. Cada uno será un parámetro del perfil, no una constante enterrada en el código.

## 1. Arranque y pausa automáticos

Máquina de estados `detenida → esperando → relevando ⇄ pausada → detenida`, con histéresis para que la deriva del GPS con el teléfono quieto no la active sola.

| Perfil    | Arranca si…                                                | Pausa si…              |
| --------- | ---------------------------------------------------------- | ---------------------- |
| Bici      | v > 6 km/h durante 3 s                                     | v < 3 km/h durante 5 s |
| Caminando | v > 2,5 km/h **y** ≥ 8 m recorridos **y** precisión ≤ 15 m | v < 1 km/h durante 8 s |
| Auto      | v > 10 km/h durante 3 s                                    | v < 5 km/h durante 5 s |

Se descartan lecturas GPS con precisión peor que 25 m (15 m en Caminando).

## 2. Impactos verticales (Bici y Auto)

1. **Gravedad:** filtro paso bajo sobre `accelerationIncludingGravity` (constante de tiempo ≈ 0,5 s) → vector unitario ĝ.
2. **Aceleración vertical:** `a_v = (a_total − g) · ĝ`. No se usa el eje Z del teléfono porque su orientación en el soporte es arbitraria.
3. **Línea base adaptativa:** RMS móvil de `a_v` en 2 s. Indispensable en adoquín y granito, donde la vibración es constante.
4. **Pico:** `p = |a_v| − k · RMS` con k ≈ 3; candidato si `p > p_min`.
5. **Severidad:** `severidad = p / max(v, v_min)` con `v_min = 2 m/s`. El piso evita que la división explote a baja velocidad.
6. **Ubicación:** el impacto ocurre bajo la rueda: posición actual (sin proyección).
7. Ventana refractaria de 0,5 s para no contar el rebote como otro bache.

Desactivado en el perfil Caminando (los pasos generarían falsos positivos).

## 3. Esquive (Bici y Auto)

Candidato si la tasa de giro (yaw) supera ω_umbral (≈ 60 °/s) y el rumbo vuelve a su valor previo (± 20°) en menos de 2 s, sin cambio neto del rumbo GPS. La ubicación se proyecta ~2 m hacia adelante desde el inicio de la maniobra. Desactivado en Caminando.

## 4. Control (botones)

Máquina de estados por botón, alimentada por eventos `pulsar`/`soltar` con marca de tiempo del `Reloj`:

- **1 clic:** pulsar + soltar y ningún otro pulsar en 400 ms → marca el tipo asignado al botón para ese perfil.
- **2 clics:** segundo pulsar dentro de los 400 ms → tipo alternativo (solo si el control tiene un único botón).
- **Mantener:** pulsado ≥ 800 ms → deshacer la última marca.
- Se ignoran los `keydown` con `repeat = true`.
- "Detectar tecla" guarda `key` y `code` del evento en la configuración.

Con un control de 2 botones, cada botón tiene su tipo y el doble clic no hace falta (no hay espera de 400 ms).

## 5. Georreferencia

- **Coordenadas locales:** proyección equirectangular alrededor del primer punto de la sesión (error despreciable en pocos km).
- **Estimación entre lecturas GPS:** `p(t) = p_k + v_k · (t − t_k) · (sin θ_k, cos θ_k)` hasta la próxima lectura.
- **Rumbo:** el del GPS si v > 2 m/s; por debajo, se mantiene el último confiable. La brújula del teléfono no se usa por la interferencia del soporte.
- **Proyección hacia adelante:** una detección visual a distancia d se ubica en `p(t) + d · (sin θ, cos θ)`.

## 6. Agrupamiento

- **Dentro de una pasada:** misma detección si es del mismo tipo y la distancia **medida sobre el recorrido** (integrando v · dt, más precisa que el GPS) es < 1,5 m.
- **Entre pasadas o sesiones:** mismo tipo y distancia GPS < 6 m. El punto resultante guarda cuántas veces fue visto y por qué fuentes; eso alimenta la confianza.

## 7. Visión: 3 líneas láser

### Geometría de cámara (modelo estenopeico)

- Altura de la cámara `h` (configurada una vez), inclinación hacia abajo del eje óptico `β` y rolado `ρ` calculados en cada cuadro a partir de ĝ.
- Distancia focal en píxeles: `f = (H / 2) / tan(FOV_v / 2)` (FOV vertical con valor por defecto ajustable).
- Un punto del suelo a distancia d está a un ángulo de depresión `φ = atan(h / d)`; su fila en la imagen es `y = c_y + f · tan(φ − β)`. La línea se rota `ρ` alrededor del centro.
- Distancias por defecto: **1,5 / 2,5 / 3,5 m**. Cada franja abarca d ± 0,25 m y un ancho de calzada configurable (trapecio por perspectiva).
- Si β cae fuera de 10°–50° o |ρ| > 15°, la visión se suspende con un tono.

### Anomalías de profundidad

El modelo devuelve **disparidad relativa** (inversa de la profundidad, a menos de escala y desplazamiento). Para un suelo plano, la disparidad es **lineal en la fila de la imagen**, así que:

1. Se ajusta `disp(y) ≈ a · y + b` con un método robusto sobre la región de calzada (las tres franjas y su entorno). La escala y el desplazamiento desconocidos quedan absorbidos por a y b.
2. En cada franja se calcula el residuo `r = disp − (a · y + b)`, normalizado por la disparidad esperada.
3. **Bache:** tramo contiguo con `r < −r_min` (más lejos que el suelo) y ancho ≥ 15 cm a esa distancia. **Saliente u obstáculo:** `r > r_min`.
4. **Confirmación entre cuadros:** la anomalía proyectada al suelo debe reaparecer en una franja más cercana en el cuadro siguiente (o cuadros siguientes), consistente con la velocidad. Sube la confianza y filtra ruido de un solo cuadro.

### Cuadros por segundo

La cobertura sin huecos exige `fps ≥ v / tramo cubierto`. A 20 km/h (5,6 m/s) y un tramo de 1,5 a 3,5 m hace falta ≈ 3 fps; con menos, se pierde cobertura (se registra). Si el tiempo por cuadro sube (calor), se baja la resolución o los fps y suena un tono de aviso.

### Nitidez

Se descartan los cuadros con varianza del Laplaciano baja (cuadros movidos, frecuentes con el teléfono en la mano).

## 8. Agua y reflejos

Puntaje por región dentro de las franjas, combinando:

- **Textura baja:** energía del gradiente local por debajo de un umbral.
- **Brillo alto y saturación baja:** reflejo del cielo.
- **Profundidad anómala "hacia abajo":** el reflejo hace que la región parezca mucho más lejana que el suelo (`r` fuertemente negativo y extenso).

Interruptor "calle mojada por lluvia" que desactiva el detector. Visualmente un derrame cloacal no se distingue de agua de lluvia: el tipo cloacal se asigna con el botón o en la revisión.

## 9. Fusión

Cada fuente genera candidatos independientes (fusión `OR`) con una confianza `c_i ∈ [0, 1]`. El agrupamiento combina candidatos cercanos del mismo tipo; la confianza combinada es `1 − Π(1 − c_i)`. Las marcas manuales tienen confianza 1. Todas las detecciones automáticas quedan en estado **pendiente** hasta la revisión.
