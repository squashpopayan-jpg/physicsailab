// Grabación del lienzo (imagen de la cámara + capa de información) y entrega de archivos.

export function pickMime() {
  if (!window.MediaRecorder) return null;
  const c = ['video/mp4;codecs=avc1.42E01F', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return c.find((t) => MediaRecorder.isTypeSupported(t)) || null;
}

export class Recorder {
  constructor(canvas, mime, fps = 30, bitrate = 6e6) {
    this.mime = mime;
    this.stream = canvas.captureStream(fps);
    this.rec = new MediaRecorder(this.stream, { mimeType: mime, videoBitsPerSecond: bitrate });
    this.chunks = [];
    this.rec.ondataavailable = (e) => { if (e.data && e.data.size) this.chunks.push(e.data); };
  }
  start() { this.rec.start(1000); }
  stop() {
    return new Promise((resolve) => {
      this.rec.onstop = () => {
        this.stream.getTracks().forEach((t) => t.stop());
        const type = this.mime.split(';')[0];
        resolve({ blob: new Blob(this.chunks, { type }), mime: type, ext: type.includes('mp4') ? 'mp4' : 'webm' });
      };
      if (this.rec.state !== 'inactive') this.rec.stop(); else this.rec.onstop();
    });
  }
}

/** Descarga un archivo (en Android queda en la carpeta Descargas). */
export function saveBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}

/** Abre el menú de compartir de Android (WhatsApp, Drive, Galería…). Lanza un error si no se puede. */
export async function shareBlob(blob, name, title) {
  const file = new File([blob], name, { type: blob.type });
  if (!navigator.canShare || !navigator.canShare({ files: [file] })) throw new Error('no-share');
  await navigator.share({ files: [file], title });
}

export function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
