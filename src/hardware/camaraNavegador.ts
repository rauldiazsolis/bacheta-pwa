import type { FuenteCamara, ImagenRGBA, InfoCamara } from '../core/puertos/imagen';

/** Cámara trasera con getUserMedia; los cuadros se escalan con un canvas. */
export class CamaraNavegador implements FuenteCamara {
  private flujo: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private lienzo: HTMLCanvasElement | null = null;

  async iniciar(): Promise<InfoCamara> {
    this.detener();
    const flujo = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = flujo;
    await video.play();
    this.flujo = flujo;
    this.video = video;

    const pista = flujo.getVideoTracks()[0];
    const ajustes = pista?.getSettings() ?? {};
    const capacidades = (pista?.getCapabilities?.() ?? {}) as MediaTrackCapabilities;
    return {
      anchoActual: ajustes.width ?? video.videoWidth,
      altoActual: ajustes.height ?? video.videoHeight,
      anchoMaximo: capacidades.width?.max ?? null,
      altoMaximo: capacidades.height?.max ?? null,
      fpsMaximo: capacidades.frameRate?.max ?? null,
    };
  }

  capturar(ancho: number, alto: number): ImagenRGBA | null {
    const video = this.video;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
    this.lienzo ??= document.createElement('canvas');
    const lienzo = this.lienzo;
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, ancho, alto);
    return { ancho, alto, datos: ctx.getImageData(0, 0, ancho, alto).data };
  }

  detener(): void {
    this.flujo?.getTracks().forEach((pista) => pista.stop());
    this.flujo = null;
    if (this.video) this.video.srcObject = null;
    this.video = null;
  }
}
