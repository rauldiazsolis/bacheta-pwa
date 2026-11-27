# 0005 — Privacidad: datos reales fuera del repo

**Contexto.** El repositorio es público. Las fotos y videos de la calle muestran personas y patentes (Ley 25.326 de Protección de Datos Personales).

**Decisión.** Ninguna grabación ni foto real se versiona: `grabaciones/` y `*.bacheta.zip` están en `.gitignore`. Los fixtures del repo son sintéticos. La app no envía datos a ningún servidor: todo se guarda en el teléfono y solo sale cuando el usuario exporta. En la Fase 3 se suma un aviso de privacidad. El difuminado de caras y patentes queda fuera de la PoC.
