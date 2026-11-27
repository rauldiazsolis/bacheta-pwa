# 0004 — Grabación y reproducción

**Contexto.** Los tests sobre datos sintéticos validan la lógica, no la precisión en la calle. Ajustar umbrales saliendo en bici cada vez es lento.

**Decisión.** Todos los puertos de entrada tienen tres implementaciones: hardware real, reproducción de grabaciones y simulación sintética. En la calle se graba una sesión cruda (video 480p + GPS + movimiento + teclas, con marcas de tiempo), de **máximo 2 minutos**, exportable como un único archivo. En la PC, el modo `reproduccion` la reproduce de forma determinista.

**Consecuencias.** Las grabaciones reales se etiquetan a mano y alimentan el script de evaluación de precisión (Fase 2). El formato de grabación se versiona y tiene tests de ida y vuelta.
