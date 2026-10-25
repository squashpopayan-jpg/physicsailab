// Genera icons/icon-192.png e icon-512.png (mismo dibujo que icons/icon.svg) sin dependencias.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

function png(w, h, rgba, path) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cr]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
const segD = (px, py, ax, ay, bx, by) => { const vx = bx - ax, vy = by - ay; let t = ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy); t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * vx, py - ay - t * vy); };
function icon(n) {
  const buf = Buffer.alloc(n * n * 4);
  const s = 512 / n;
  const bez = (t) => [(1 - t) ** 3 * 150 + 3 * (1 - t) ** 2 * t * 195 + 3 * (1 - t) * t * t * 320 + t ** 3 * 420, (1 - t) ** 3 * 420 + 3 * (1 - t) ** 2 * t * 150 + 3 * (1 - t) * t * t * 90 + t ** 3 * 300];
  const dots = []; for (let t = 0.02; t <= 1; t += 0.085) dots.push(bez(t));
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let col = [0, 0, 0, 0];
    const X = (x + 0.5) * s, Y = (y + 0.5) * s;
    const over = (c, a) => { const al = Math.max(0, Math.min(1, a)); for (let k = 0; k < 3; k++) col[k] = col[k] * (1 - al) + c[k] * al; col[3] = Math.max(col[3], al); };
    // fondo redondeado
    const qx = Math.max(Math.abs(X - 256) - (256 - 112), 0), qy = Math.max(Math.abs(Y - 256) - (256 - 112), 0);
    over([11, 17, 22], (112 - Math.hypot(qx, qy)) / s + 0.5);
    over([233, 239, 243], ((8 - segD(X, Y, 70, 420, 442, 420)) / s + 0.5) * 0.4);
    for (const [dx, dy] of dots) over([233, 239, 243], (11 - Math.hypot(X - dx, Y - dy)) / s + 0.5);
    over([127, 224, 255], (11 - segD(X, Y, 70, 420, 280, 120)) / s + 0.5);
    const ang = Math.atan2(Y - 420, X - 70), rr = Math.hypot(X - 70, Y - 420);
    if (ang < -0.05 && ang > -1.0) over([127, 224, 255], (10 - Math.abs(rr - 80)) / s + 0.5);
    over([255, 138, 61], (44 - Math.hypot(X - 280, Y - 120)) / s + 0.5);
    const i = (y * n + x) * 4;
    buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2]; buf[i + 3] = Math.round(col[3] * 255);
  }
  return buf;
}
for (const n of [192, 512]) png(n, n, icon(n), fileURLToPath(new URL(`../icons/icon-${n}.png`, import.meta.url)));
console.log('iconos generados');
