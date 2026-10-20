/* ===================================================================
   06-zip.js — Empaquetador ZIP sin compresión (método «stored»),
   suficiente para .docx y .xlsx (Office Open XML admite entradas sin
   comprimir). Puro: funciona en el navegador y en Node.
   =================================================================== */
(function () {
  'use strict';
  const EM = (window.EM = window.EM || {});
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  EM.crc32 = crc32;
  /* archivos: [{name, data: string | Uint8Array}] */
  EM.zip = function (archivos, fecha = new Date()) {
    const enc = new TextEncoder();
    const dt = ((fecha.getHours() << 11) | (fecha.getMinutes() << 5) | (fecha.getSeconds() >> 1)) & 0xFFFF;
    const dd = (((fecha.getFullYear() - 1980) << 9) | ((fecha.getMonth() + 1) << 5) | fecha.getDate()) & 0xFFFF;
    const partes = [], central = [];
    let off = 0;
    for (const f of archivos) {
      const nombre = enc.encode(f.name), datos = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = crc32(datos);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, datos.length, true); h.setUint32(22, datos.length, true);
      h.setUint16(26, nombre.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), nombre, datos);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, datos.length, true); c.setUint32(24, datos.length, true);
      c.setUint16(28, nombre.length, true); c.setUint16(30, 0, true); c.setUint16(32, 0, true); c.setUint16(34, 0, true); c.setUint16(36, 0, true); c.setUint32(38, 0, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nombre);
      off += 30 + nombre.length + datos.length;
    }
    const tamC = central.reduce((a, b) => a + b.length, 0);
    const fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true); fin.setUint32(12, tamC, true); fin.setUint32(16, off, true);
    const todo = partes.concat(central, [new Uint8Array(fin.buffer)]);
    const out = new Uint8Array(todo.reduce((a, b) => a + b.length, 0));
    let p = 0;
    for (const b of todo) { out.set(b, p); p += b.length; }
    return out;
  };
})();
