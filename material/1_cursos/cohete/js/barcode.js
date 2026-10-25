// Número de cuadro grabado dentro del propio video (franja de 20 celdas blancas/negras en la esquina inferior
// izquierda). Al revisar el video cuadro a cuadro se lee de la imagen y así se recupera la orientación exacta con
// que se tomó ese cuadro, aunque el reproductor no sea preciso con los tiempos.

const SYNC = [1, 0, 1, 1];
const BITS = 16;

export function barcodeBox(W, H) {
  const cw = Math.max(8, Math.round(W / 40));
  const bh = Math.max(8, Math.round(H / 110));
  return { x0: Math.round(W * 0.012), y0: H - bh - Math.max(3, Math.round(H / 320)), cw, bh, n: SYNC.length + BITS };
}

export function drawBarcode(ctx, W, H, idx) {
  const g = barcodeBox(W, H);
  const bits = [...SYNC];
  for (let b = BITS - 1; b >= 0; b--) bits.push((idx >> b) & 1);
  ctx.fillStyle = '#000';
  ctx.fillRect(g.x0 - 3, g.y0 - 3, g.cw * g.n + 6, g.bh + 6);
  ctx.fillStyle = '#fff';
  bits.forEach((v, i) => { if (v) ctx.fillRect(g.x0 + i * g.cw, g.y0, g.cw, g.bh); });
}

/** Lee el número de cuadro de un contexto donde se dibujó el cuadro de video completo (W×H). null si no se ve. */
export function readBarcode(ctx, W, H) {
  const g = barcodeBox(W, H);
  const img = ctx.getImageData(g.x0, g.y0, g.cw * g.n, g.bh).data;
  const rowW = g.cw * g.n;
  const lum = [];
  for (let i = 0; i < g.n; i++) {
    let s = 0, k = 0;
    for (let y = Math.floor(g.bh * 0.25); y < Math.ceil(g.bh * 0.75); y++) {
      for (let x = Math.floor(i * g.cw + g.cw * 0.25); x < Math.ceil(i * g.cw + g.cw * 0.75); x++) {
        const j = (y * rowW + x) * 4;
        s += 0.299 * img[j] + 0.587 * img[j + 1] + 0.114 * img[j + 2];
        k++;
      }
    }
    lum.push(s / k);
  }
  const hi = Math.min(lum[0], lum[2], lum[3]), lo = lum[1];
  if (hi - lo < 60) return null;
  const thr = (hi + lo) / 2;
  const bits = lum.map((v) => (v > thr ? 1 : 0));
  if (SYNC.some((v, i) => bits[i] !== v)) return null;
  let idx = 0;
  for (let i = SYNC.length; i < g.n; i++) idx = (idx << 1) | bits[i];
  return idx;
}
