/* Compila src/curso.html → dist/guia-esp32-display.html
   - <!--INO:nombre-->  inserta sketches/<nombre>/<nombre>.ino resaltado (el código mostrado es el compilado)
   - <!--ENLACES-->     tabla de enlaces con el resultado de tests/enlaces.json
   - <!--COMPILACION--> tabla con el resultado de tests/compilacion.json */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const KW = /^(int|float|const|void|bool|unsigned|long|char|if|else|for|while|return|true|false|struct|static|uint8_t|String|HIGH|LOW|INPUT|OUTPUT|define|include|ifdef|elif|endif|error|undef|sizeof|and|or)$/;
function resaltar(src) {
  let out = '';
  const re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*")|(#\s*\w+)|(\b\d+(?:\.\d+)?(?:UL|L|f)?\b|\b0x[0-9A-Fa-f]+\b)|([A-Za-z_]\w*)|([\s\S])/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[1]) out += `<span class="c">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="s">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="k">${esc(m[3])}</span>`;
    else if (m[4]) out += `<span class="n">${esc(m[4])}</span>`;
    else if (m[5]) {
      const w = m[5];
      if (KW.test(w)) out += `<span class="k">${w}</span>`;
      else if (/^(SSD1306_\w+|TFT_\w+|PIN_\w+)$/.test(w)) out += `<span class="n">${w}</span>`;
      else if (/^[A-Z]\w*$/.test(w) && /^\s*[(*&\s]/.test(src.slice(re.lastIndex, re.lastIndex + 3)) === false && /^(Serial|Wire|ESP|TFT_eSPI|Adafruit_SSD1306)$/.test(w)) out += `<span class="t">${w}</span>`;
      else if (/^(Serial|Wire|ESP|TFT_eSPI|Adafruit_SSD1306|Par)$/.test(w)) out += `<span class="t">${w}</span>`;
      else if (/^[a-zA-Z_]\w*$/.test(w) && /^\s*\(/.test(src.slice(re.lastIndex))) out += `<span class="f">${w}</span>`;
      else out += w;
    } else out += esc(m[6]);
  }
  return out;
}

let html = read('src/curso.html');
html = html.replace(/<!--INO:([\w]+)-->/g, (_, n) => {
  const code = read(`sketches/${n}/${n}.ino`).replace(/\s+$/, '');
  return `<figure class="code" data-file="${n}.ino"><figcaption><span>${n}.ino</span><button type="button" class="copy" aria-label="Copiar ${n}.ino">Copiar</button></figcaption><pre><code>${resaltar(code)}</code></pre></figure>`;
});

/* Enlaces */
let enl = '<p>No hay resultados: ejecute <code>node tests/enlaces.js</code>.</p>';
try {
  const E = JSON.parse(read('tests/enlaces.json'));
  const fila = (r) => `<tr><td><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title || r.url).slice(0, 90)}</a><div class="u">${esc(r.url)}</div></td><td class="c ${r.estado === 'MAL' ? 'mal' : 'bien'}">${r.estado === 'manual' ? 'abre (confirmado en el navegador)' : r.status}</td></tr>`;
  enl = `<p><b>${E.total} enlaces comprobados el ${E.fecha}:</b> ${E.ok} responden HTTP 200${E.manual ? `, ${E.manual} se confirmaron abriéndolos en un navegador (el sitio rechaza a los programas automáticos)` : ''}${E.mal ? `, <b>${E.mal} con problema</b>` : ', ninguno roto'}.</p>` +
    `<div class="tablewrap"><table class="enl"><thead><tr><th>Página (título real de la página)</th><th class="c">Estado</th></tr></thead><tbody>${E.enlaces.map(fila).join('')}</tbody></table></div>`;
} catch (e) { console.warn('Sin tests/enlaces.json'); }
html = html.replace('<!--ENLACES-->', () => enl);

/* Compilación */
let comp = '<p>No hay resultados: ejecute <code>bash tests/compilar.sh</code>.</p>';
try {
  const C = JSON.parse(read('tests/compilacion.json'));
  comp = `<p><b>${C.ok} de ${C.ok + C.mal} compilaciones correctas</b> el ${C.fecha} con el núcleo <code>${esc(C.nucleo)}</code>. Librerías: ${esc(C.librerias.split(';').filter(Boolean).join(' · '))}.</p>` +
    `<div class="tablewrap"><table><thead><tr><th>Sketch</th><th>Placa elegida en el IDE</th><th class="c">Resultado</th><th>Memoria</th></tr></thead><tbody>` +
    C.resultados.map((r) => `<tr><td><code>${esc(r.sketch)}</code></td><td><code>${esc(r.fqbn.replace('esp32:esp32:', ''))}</code></td><td class="c ${r.ok ? 'bien' : 'mal'}">${r.ok ? 'compila' : 'ERROR'}</td><td>${esc(r.uso)}</td></tr>`).join('') + '</tbody></table></div>';
} catch (e) { console.warn('Sin tests/compilacion.json', e.message); }
html = html.replace('<!--COMPILACION-->', () => comp);

const guardScripts = '<script src="/material/course-guard.js"></script>\n<script>if(typeof window.PhysicsAILabGuard===\'undefined\'){var s=document.createElement(\'script\');s.src=\'../../../course-guard.js\';document.head.appendChild(s);}</script>\n';

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'guia-esp32-display.html'), html);   // fragmento para publicar como Artifact
/* Documento completo para abrir en local (con el esqueleto que el Artifact añade al publicar) */
fs.writeFileSync(path.join(root, 'dist', 'index.html'), ['<!doctype html>', '<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0">', html, guardScripts, '</body></html>'].join('\n'));
console.log('dist/guia-esp32-display.html', (html.length / 1024).toFixed(0) + ' KB');
