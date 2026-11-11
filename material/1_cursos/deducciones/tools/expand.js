/* Expansión de las etiquetas de deducción a HTML (usada por build.js).
   <deriv id title tags> … </deriv>   → <section class="deriv"> con número D{cap}.{k}
   <goal>, <given><g>, <step op><why>, <result name>, <vars><v s n u/>, <effects><e>, <limits><l>, <explore sim title/> */
const SUPM = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const unitFmt = (u) => (!u.trim() || u.trim() === '1' ? 'adimensional'
  : u.trim().split(/\s+/).map((tk) => tk.replace(/\^(-?\d+)/, (m, e) => e.split('').map((c) => SUPM[c] || c).join(''))).join('·'));

module.exports = function expand(t, nByDeriv) {
  const num = (t.match(/data-num="([^"]+)"/) || [0, '?'])[1];
  let idx = 0;
  t = t.replace(/<deriv\s+id="([^"]+)"\s+title="([^"]*)"(?:\s+tags="([^"]*)")?\s*>/g, (m, id, title, tags) => {
    idx++;
    const n = nByDeriv[id];
    return `<section class="deriv" id="d-${id}" data-did="${id}"><h2><span class="dn">D${num}.${idx}</span> ${title}</h2>` +
      `<div>${(tags || '').split(',').filter(Boolean).map((s) => `<span class="dtag">${s.trim()}</span>`).join('')}${n ? `<span class="dverif">${n} comprobaciones simbólicas y numéricas superadas</span>` : ''}</div>`;
  });
  t = t.replace(/<\/deriv>/g, '</section>');
  t = t.replace(/<goal>/g, '<p class="dgoal"><b>Se busca. </b>').replace(/<\/goal>/g, '</p>');
  t = t.replace(/<given>/g, '<div class="dgiven"><div class="dlab">Se parte de</div><ul>').replace(/<\/given>/g, '</ul></div>');
  t = t.replace(/<g>/g, '<li>').replace(/<\/g>/g, '</li>');
  t = t.replace(/<step\s+op="([^"]*)"\s*>/g, '<li class="dstep"><div class="dop">$1</div><div class="dmath">').replace(/<\/step>/g, '</div></li>');
  t = t.replace(/<why>/g, '<div class="dwhy">').replace(/<\/why>/g, '</div>');
  t = t.replace(/((?:<li class="dstep">[\s\S]*?<\/li>\s*)+)/g, '<ol class="dsteps">$1</ol>');
  t = t.replace(/<result\s+name="([^"]*)"\s*>/g, '<div class="eq key" data-name="$1">').replace(/<\/result>/g, '</div>');
  t = t.replace(/<vars>/g, '<div class="dlab">Variables y unidades</div><div class="tablewrap narrow"><table class="dvars"><tr><th>Símbolo</th><th>Significado</th><th>Unidad SI</th></tr>').replace(/<\/vars>/g, '</table></div>');
  t = t.replace(/<v\s+s="([^"]*)"\s+n="([^"]*)"\s+u="([^"]*)"\s*\/>/g, (m, s, n, u) => `<tr><td>\\(${s}\\)</td><td>${n}</td><td class="u">${unitFmt(u)}</td></tr>`);
  t = t.replace(/<effects>/g, '<div class="deffects"><div class="dlab">Qué ocurre si se modifican los parámetros</div><ul>').replace(/<\/effects>/g, '</ul></div>');
  t = t.replace(/<limits>/g, '<div class="dlimits"><div class="dlab">Comprobaciones: dimensiones y límites</div><ul>').replace(/<\/limits>/g, '</ul></div>');
  t = t.replace(/<e>/g, '<li>').replace(/<\/e>/g, '</li>').replace(/<l>/g, '<li>').replace(/<\/l>/g, '</li>');
  t = t.replace(/<explore\s+sim="([^"]+)"\s+title="([^"]*)"\s*\/>/g, '<div class="sim" data-sim="$1" data-title="$2"></div>');
  return t;
};
