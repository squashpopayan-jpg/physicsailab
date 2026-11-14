/* Valida TODOS los enlaces http(s) del curso (src/curso.html).
   Cada URL se pide con GET (siguiendo redirecciones) y se guarda estado,
   URL final y <title>. Los sitios que bloquean programas automáticos (403)
   se confirman a mano en el navegador y se anotan en tests/enlaces_manual.json.
   Uso: node tests/enlaces.js            → escribe tests/enlaces.json */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'curso.html'), 'utf8');
const manualPath = path.join(__dirname, 'enlaces_manual.json');
const manual = fs.existsSync(manualPath) ? JSON.parse(fs.readFileSync(manualPath, 'utf8')) : {};

const urls = [...new Set([...html.matchAll(/<a [^>]*href="(https?:\/\/[^"#]+)(#[^"]*)?"/g)].map((m) => m[1]))];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

async function probar(url) {
  let ultimo = null;
  for (let intento = 0; intento < 5; intento++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 30000);
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, redirect: 'follow', signal: ctl.signal });
      clearTimeout(t);
      let title = '';
      const ct = r.headers.get('content-type') || '';
      if (ct.includes('text/html')) {
        const txt = (await r.text()).slice(0, 200000);
        const m = txt.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        title = m ? m[1].replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim().slice(0, 140) : '';
      } else { await r.arrayBuffer().catch(() => {}); }
      if ((r.status === 429 || r.status >= 500) && intento < 4) { await new Promise((s) => setTimeout(s, 4000 * (intento + 1))); ultimo = new Error('HTTP ' + r.status); continue; }
      return { url, status: r.status, final: r.url, tipo: ct.split(';')[0], title };
    } catch (e) { ultimo = e; await new Promise((s) => setTimeout(s, 1500)); }
  }
  return { url, status: 0, final: url, tipo: '', title: '', error: String(ultimo && ultimo.message) };
}

(async () => {
  const out = [];
  const cola = urls.slice();
  const trabajadores = Array.from({ length: 3 }, async () => {
    while (cola.length) { const u = cola.shift(); out.push(await probar(u)); }
  });
  await Promise.all(trabajadores);
  out.sort((a, b) => urls.indexOf(a.url) - urls.indexOf(b.url));
  let ok = 0, manualOk = 0, mal = 0;
  for (const r of out) {
    if (r.status >= 200 && r.status < 300) { r.estado = 'ok'; ok++; }
    else if (manual[r.url]) { r.estado = 'manual'; r.nota = manual[r.url]; manualOk++; }
    else { r.estado = 'MAL'; mal++; }
  }
  const res = { fecha: new Date().toISOString().slice(0, 10), total: out.length, ok, manual: manualOk, mal, enlaces: out };
  fs.writeFileSync(path.join(__dirname, 'enlaces.json'), JSON.stringify(res, null, 1));
  for (const r of out) console.log(`${r.estado.padEnd(6)} ${String(r.status).padEnd(4)} ${r.url}${r.final !== r.url ? '  →  ' + r.final : ''}`);
  console.log(`\n${out.length} enlaces: ${ok} responden 200, ${manualOk} confirmados a mano, ${mal} con problema`);
  process.exit(mal ? 1 : 0);
})();
