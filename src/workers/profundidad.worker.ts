/**
 * Worker de profundidad: corre Depth Anything V2 Small con Transformers.js
 * fuera del hilo de la interfaz. El preprocesamiento es el de src/core.
 */
import { AutoModel, Tensor, env, type PreTrainedModel } from '@huggingface/transformers';
import { aTensorNormalizado } from '../core/vision/preprocesamiento';
import { ID_MODELO_PROFUNDIDAD } from '../core/vision/modelo';
import type { ConfigEstimador } from '../core/puertos/profundidad';
import type { MensajeAlWorker, MensajeDelWorker } from './protocoloProfundidad';

env.allowLocalModels = false;

const ambito = self as unknown as DedicatedWorkerGlobalScope;
const enviar = (mensaje: MensajeDelWorker, transferir: Transferable[] = []) =>
  ambito.postMessage(mensaje, transferir);

let modelo: PreTrainedModel | null = null;
let config: ConfigEstimador | null = null;
/** Algunos modelos fp16 esperan la entrada en float16; se detecta en el primer cuadro. */
let entradaFloat16 = false;

async function cargar(id: number, nueva: ConfigEstimador): Promise<void> {
  await liberar();
  const porArchivo = new Map<string, { cargados: number; total: number }>();
  modelo = await AutoModel.from_pretrained(ID_MODELO_PROFUNDIDAD, {
    device: nueva.backend,
    dtype: nueva.precision,
    progress_callback: (info) => {
      if (info.status !== 'progress') return;
      porArchivo.set(info.file, { cargados: info.loaded, total: info.total });
      let bytesCargados = 0;
      let bytesTotales = 0;
      for (const { cargados, total } of porArchivo.values()) {
        bytesCargados += cargados;
        bytesTotales += total;
      }
      enviar({ tipo: 'progreso', id, bytesCargados, bytesTotales });
    },
  });
  config = nueva;
  entradaFloat16 = false;
}

async function inferir(entrada: Tensor): Promise<Tensor> {
  if (!modelo) throw new Error('El modelo no está cargado');
  const salida = (await modelo({ pixel_values: entrada })) as { predicted_depth: Tensor };
  return salida.predicted_depth.to('float32');
}

async function estimar(id: number, imagen: MensajeAlWorker & { tipo: 'estimar' }): Promise<void> {
  const { ancho, alto } = imagen.imagen;
  const datos = aTensorNormalizado(imagen.imagen);
  const entrada32 = new Tensor('float32', datos, [1, 3, alto, ancho]);
  let profundidad: Tensor;
  try {
    profundidad = await inferir(entradaFloat16 ? entrada32.to('float16') : entrada32);
  } catch (e) {
    const pideFloat16 = config?.precision === 'fp16' && !entradaFloat16 && /float16/i.test(String(e));
    if (!pideFloat16) throw e;
    entradaFloat16 = true;
    profundidad = await inferir(entrada32.to('float16'));
  }
  const valores = Float32Array.from(profundidad.data as Float32Array);
  const dims = profundidad.dims;
  enviar({ tipo: 'mapa', id, ancho: dims[dims.length - 1] ?? 0, alto: dims[dims.length - 2] ?? 0, valores }, [
    valores.buffer,
  ]);
}

async function liberar(): Promise<void> {
  const anterior = modelo;
  modelo = null;
  config = null;
  await anterior?.dispose();
}

ambito.onmessage = async (evento: MessageEvent<MensajeAlWorker>) => {
  const mensaje = evento.data;
  try {
    if (mensaje.tipo === 'cargar') {
      await cargar(mensaje.id, mensaje.config);
      enviar({ tipo: 'listo', id: mensaje.id });
    } else if (mensaje.tipo === 'estimar') {
      await estimar(mensaje.id, mensaje);
    } else {
      await liberar();
      enviar({ tipo: 'listo', id: mensaje.id });
    }
  } catch (e) {
    enviar({ tipo: 'error', id: mensaje.id, mensaje: e instanceof Error ? e.message : String(e) });
  }
};
