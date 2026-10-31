/* ===================================================================
   05-chars.js — los 10 personajes (SVG, viewBox 100×100) y sus caras
   =================================================================== */
(function () {
  'use strict';
  const FK = window.FK;
  const INK = '#2B2350';

  /* ----- cara: ojos y boca según el ánimo ----- */
  function eyes(m, cx, cy, dx, r) {
    r = r || 6;
    const L = cx - dx, R = cx + dx;
    const open = (x, y, rr, px, py) =>
      `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="${x + px}" cy="${y + py}" r="${rr * 0.56}" fill="${INK}"/><circle cx="${x + px + rr * 0.2}" cy="${y + py - rr * 0.22}" r="${rr * 0.2}" fill="#fff"/>`;
    const arc = (x, y, rr) => `<path d="M${x - rr} ${y + 1.5}q${rr} ${-rr * 1.5} ${2 * rr} 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    const brow = (x, y, rr, dir) => `<path d="M${x - rr} ${y - rr - 2 + dir * 2}L${x + rr} ${y - rr - 2 - dir * 2}" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
    switch (m) {
      case 'happy': return arc(L, cy, r) + arc(R, cy, r);
      case 'wink': return open(L, cy, r, 0.5, 0.5) + arc(R, cy, r);
      case 'wow': return open(L, cy, r * 1.2, 0, 0) + open(R, cy, r * 1.2, 0, 0);
      case 'think': return open(L, cy, r, 1.6, -1.6) + open(R, cy, r, 1.6, -1.6);
      case 'sad': return open(L, cy, r, 0, 1) + open(R, cy, r, 0, 1) + brow(L, cy, r, -1) + brow(R, cy, r, 1);
      default: return open(L, cy, r, 0.5, 0.5) + open(R, cy, r, 0.5, 0.5);
    }
  }
  function mouth(m, cx, cy, w) {
    w = w || 7;
    const s = `fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"`;
    switch (m) {
      case 'happy': case 'wink': return `<path d="M${cx - w} ${cy - 1}Q${cx} ${cy + w * 1.1} ${cx + w} ${cy - 1}Z" fill="#7A1F3D" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${cx - w * 0.55} ${cy + w * 0.5}Q${cx} ${cy + w * 0.9} ${cx + w * 0.55} ${cy + w * 0.5}" fill="#FF7A9A"/>`;
      case 'wow': return `<ellipse cx="${cx}" cy="${cy + 2}" rx="${w * 0.55}" ry="${w * 0.8}" fill="#7A1F3D" stroke="${INK}" stroke-width="2.4"/>`;
      case 'think': return `<path d="M${cx - w * 0.7} ${cy + 1}q${w * 0.35} ${-2.5} ${w * 0.7} 0t${w * 0.7} 0" ${s}/>`;
      case 'sad': return `<path d="M${cx - w * 0.8} ${cy + 3}Q${cx} ${cy - w * 0.6} ${cx + w * 0.8} ${cy + 3}" ${s}/>`;
      default: return `<path d="M${cx - w * 0.8} ${cy}Q${cx} ${cy + w * 0.8} ${cx + w * 0.8} ${cy}" ${s}/>`;
    }
  }
  const cheeks = (cx, cy, dx) => `<ellipse cx="${cx - dx}" cy="${cy}" rx="4" ry="2.6" fill="#FF6B8B" opacity=".45"/><ellipse cx="${cx + dx}" cy="${cy}" rx="4" ry="2.6" fill="#FF6B8B" opacity=".45"/>`;
  const outline = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;

  const C = (FK.CHARS = {});
  const add = (id, o) => { C[id] = o; };

  /* ---- Búho Sabio ---- */
  add('buho', {
    name: 'Búho Sabio', color: '#00B3A4', dark: '#007A70', soft: '#D9F6F2', world: 1, role: 'el que cuenta las historias',
    svg: (m) => `
      <path d="M22 34 L26 12 L42 26Z M78 34 L74 12 L58 26Z" fill="#007A70" ${outline}/>
      <ellipse cx="50" cy="60" rx="31" ry="33" fill="#00B3A4" ${outline}/>
      <ellipse cx="50" cy="70" rx="20" ry="22" fill="#B5F0E9"/>
      <path d="M40 66q4 5 8 0M52 66q4 5 8 0M40 76q4 5 8 0M52 76q4 5 8 0" fill="none" stroke="#00B3A4" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="19" cy="64" rx="8" ry="19" fill="#007A70" ${outline} transform="rotate(8 19 64)"/>
      <ellipse cx="81" cy="64" rx="8" ry="19" fill="#007A70" ${outline} transform="rotate(-8 81 64)"/>
      <circle cx="37" cy="45" r="13" fill="#fff" stroke="#FFC21A" stroke-width="3.5"/><circle cx="63" cy="45" r="13" fill="#fff" stroke="#FFC21A" stroke-width="3.5"/>
      <path d="M50 45h0" stroke="#FFC21A" stroke-width="3.5"/>
      ${m === 'happy' ? `<path d="M31 47q6 -8 12 0M57 47q6 -8 12 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` :
        m === 'wow' ? `<circle cx="37" cy="45" r="7" fill="${INK}"/><circle cx="63" cy="45" r="7" fill="${INK}"/><circle cx="39" cy="42" r="2.2" fill="#fff"/><circle cx="65" cy="42" r="2.2" fill="#fff"/>` :
        m === 'think' ? `<circle cx="40" cy="42" r="5" fill="${INK}"/><circle cx="66" cy="42" r="5" fill="${INK}"/><circle cx="41.6" cy="40" r="1.6" fill="#fff"/><circle cx="67.6" cy="40" r="1.6" fill="#fff"/>` :
        m === 'sad' ? `<circle cx="37" cy="48" r="5" fill="${INK}"/><circle cx="63" cy="48" r="5" fill="${INK}"/><path d="M26 33l20 4M74 33l-20 4" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` :
        `<circle cx="38" cy="46" r="5.5" fill="${INK}"/><circle cx="64" cy="46" r="5.5" fill="${INK}"/><circle cx="39.8" cy="44" r="1.8" fill="#fff"/><circle cx="65.8" cy="44" r="1.8" fill="#fff"/>`}
      <path d="M45 56 L55 56 L50 65Z" fill="#FFB02E" ${outline}/>
      <path d="M30 86l-4 8h10zM70 86l4 8H64z" fill="#FFB02E" ${outline}/>
      <path d="M24 26 L50 14 L76 26 L50 37Z" fill="${INK}" ${outline}/><path d="M76 26v12" stroke="#FFC21A" stroke-width="2.5" stroke-linecap="round"/><circle cx="76" cy="40" r="2.6" fill="#FFC21A"/>`
  });

  /* ---- Newti, el gato ---- */
  add('newti', {
    name: 'Newti', color: '#FF8A1F', dark: '#C25A00', soft: '#FFE9D2', world: 2, role: 'el gato que siempre cae de pie',
    svg: (m) => `
      <path d="M72 84q22 -2 18 -26q-2 -8 -8 -4" fill="none" stroke="#FF8A1F" stroke-width="9" stroke-linecap="round"/>
      <path d="M72 84q22 -2 18 -26q-2 -8 -8 -4" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".0"/>
      <ellipse cx="50" cy="84" rx="21" ry="14" fill="#FF8A1F" ${outline}/>
      <ellipse cx="50" cy="86" rx="11" ry="9" fill="#FFF1DE"/>
      <path d="M20 36 L22 8 L44 24Z M80 36 L78 8 L56 24Z" fill="#FF8A1F" ${outline}/>
      <path d="M25 30 L26 15 L38 25Z M75 30 L74 15 L62 25Z" fill="#FF8FB1"/>
      <ellipse cx="50" cy="50" rx="31" ry="27" fill="#FF8A1F" ${outline}/>
      <path d="M44 24v8M50 23v9M56 24v8" stroke="#C25A00" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="50" cy="60" rx="15" ry="11" fill="#FFF1DE"/>
      ${eyes(m, 50, 46, 14, 6.5)}
      <path d="M47 54l3 3.5l3 -3.5Z" fill="#FF6B8B" ${outline}/>
      ${mouth(m, 50, 62, 6)}
      <path d="M18 54l-12 -3M18 59l-12 3M82 54l12 -3M82 59l12 3" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
      ${cheeks(50, 56, 22)}
      <rect x="32" y="69" width="36" height="6" rx="3" fill="#1E88FF" ${outline} transform="rotate(-3 50 72)"/>`
  });

  /* ---- Gotín, la gota ---- */
  add('gotin', {
    name: 'Gotín', color: '#1E88FF', dark: '#0B58B8', soft: '#DCEBFF', world: 3, role: 'la gotita que flota y se cuela por todas partes',
    svg: (m) => `
      <path d="M50 6C50 6 17 46 17 66a33 33 0 0 0 66 0C83 46 50 6 50 6Z" fill="#1E88FF" ${outline}/>
      <path d="M26 66a24 24 0 0 0 10 20" fill="none" stroke="#0B58B8" stroke-width="5" stroke-linecap="round" opacity=".35"/>
      <ellipse cx="31" cy="60" rx="5" ry="10" fill="#fff" opacity=".6" transform="rotate(20 31 60)"/>
      ${eyes(m, 50, 62, 12, 6.5)}
      ${mouth(m, 50, 76, 7)}
      ${cheeks(50, 72, 20)}
      <ellipse cx="16" cy="78" rx="5" ry="7" fill="#1E88FF" ${outline}/><ellipse cx="84" cy="78" rx="5" ry="7" fill="#1E88FF" ${outline}/>`
  });

  /* ---- Flamo, la llamita ---- */
  add('flamo', {
    name: 'Flamo', color: '#FF4757', dark: '#C0182B', soft: '#FFE0E3', world: 4, role: 'la llama que sabe de calor',
    svg: (m) => `
      <path d="M50 4C55 22 82 32 82 62a32 32 0 0 1-64 0C18 48 30 40 34 26C40 34 43 36 46 36C48 26 46 14 50 4Z" fill="#FF4757" ${outline}/>
      <path d="M50 30C54 42 70 50 70 68a20 20 0 0 1-40 0C30 58 40 54 42 44C45 48 48 46 50 30Z" fill="#FF9F1C"/>
      <path d="M50 52C53 60 60 64 60 74a10 10 0 0 1-20 0C40 68 46 66 47 60C48 62 49 60 50 52Z" fill="#FFE066"/>
      ${eyes(m, 50, 62, 11, 5.5)}
      ${mouth(m, 50, 76, 6.5)}
      ${cheeks(50, 71, 18)}`
  });

  /* ---- Eco, el murciélago ---- */
  add('eco', {
    name: 'Eco', color: '#8E5CF6', dark: '#5B2FC4', soft: '#EBE0FF', world: 5, role: 'el murciélago que ve con los oídos',
    svg: (m) => `
      <path d="M30 56C14 38 4 46 2 66C10 60 14 64 18 74C22 64 27 66 31 74Z" fill="#5B2FC4" ${outline}/>
      <path d="M70 56C86 38 96 46 98 66C90 60 86 64 82 74C78 64 73 66 69 74Z" fill="#5B2FC4" ${outline}/>
      <path d="M26 32 L24 6 L44 22Z M74 32 L76 6 L56 22Z" fill="#8E5CF6" ${outline}/>
      <path d="M29 28 L28 14 L38 23Z M71 28 L72 14 L62 23Z" fill="#FF8FB1"/>
      <ellipse cx="50" cy="74" rx="17" ry="18" fill="#8E5CF6" ${outline}/>
      <circle cx="50" cy="46" r="27" fill="#8E5CF6" ${outline}/>
      <ellipse cx="50" cy="55" rx="14" ry="11" fill="#D8C6FF"/>
      ${eyes(m, 50, 43, 12, 6)}
      <path d="M47 51l3 3l3 -3Z" fill="${INK}"/>
      ${mouth(m, 50, 60, 6)}
      <path d="M45 62l1.5 5l2 -4.5M55 62l-1.5 5l-2 -4.5" fill="#fff" stroke="${INK}" stroke-width="1.2"/>
      ${cheeks(50, 53, 20)}
      <path d="M86 18q8 6 0 14M92 14q12 10 0 22" fill="none" stroke="#8E5CF6" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`
  });

  /* ---- Lumi, la luciérnaga ---- */
  add('lumi', {
    name: 'Lumi', color: '#FFC21A', dark: '#B07F00', soft: '#FFF3CC', world: 6, role: 'la luciérnaga que brilla de noche',
    svg: (m) => `
      <circle cx="50" cy="76" r="30" fill="#FFF3A0" opacity=".55"/>
      <circle cx="50" cy="76" r="22" fill="#FFF3A0" opacity=".6"/>
      <ellipse cx="24" cy="52" rx="14" ry="22" fill="#CFEFFF" opacity=".85" ${outline} transform="rotate(-25 24 52)"/>
      <ellipse cx="76" cy="52" rx="14" ry="22" fill="#CFEFFF" opacity=".85" ${outline} transform="rotate(25 76 52)"/>
      <ellipse cx="50" cy="76" rx="17" ry="20" fill="#FFE45C" ${outline}/>
      <path d="M36 70h28M37 78h26M40 86h20" stroke="#B07F00" stroke-width="2" stroke-linecap="round" opacity=".5"/>
      <path d="M40 22Q32 6 22 6M60 22Q68 6 78 6" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><circle cx="22" cy="6" r="3.4" fill="#FFC21A" ${outline}/><circle cx="78" cy="6" r="3.4" fill="#FFC21A" ${outline}/>
      <circle cx="50" cy="42" r="24" fill="#FFC21A" ${outline}/>
      ${eyes(m, 50, 40, 11, 6)}
      ${mouth(m, 50, 53, 6)}
      ${cheeks(50, 49, 18)}`
  });

  /* ---- Chispa, el rayito ---- */
  add('chispa', {
    name: 'Chispa', color: '#FF3E9D', dark: '#B8146A', soft: '#FFDDEE', world: 7, role: 'la traviesa de la electricidad',
    svg: (m) => `
      <path d="M26 38L32 8L44 28L52 4L60 28L72 8L76 40Z" fill="#FFD43B" ${outline}/>
      <circle cx="50" cy="60" r="31" fill="#FF3E9D" ${outline}/>
      <path d="M52 76l-8 -9h7l-4 -9l11 12h-7Z" fill="#FFD43B" ${outline} transform="translate(0 4)"/>
      ${eyes(m, 50, 52, 12, 6.5)}
      ${mouth(m, 50, 64, 7)}
      ${cheeks(50, 61, 21)}
      <path d="M19 66q-10 4 -12 14M81 66q10 4 12 14" fill="none" stroke="#FF3E9D" stroke-width="6" stroke-linecap="round"/>
      <path d="M12 12l4 8l-8 0l4 8M88 16l-3 6l7 0l-3 6" fill="none" stroke="#FFD43B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
  });

  /* ---- Cosmo, el perro astronauta ---- */
  add('cosmo', {
    name: 'Cosmo', color: '#4A4FE0', dark: '#2A2EA8', soft: '#E1E2FF', world: 8, role: 'el perro astronauta',
    svg: (m) => `
      <rect x="28" y="66" width="44" height="30" rx="14" fill="#4A4FE0" ${outline}/>
      <rect x="40" y="74" width="20" height="12" rx="4" fill="#FFC21A" ${outline}/><circle cx="46" cy="80" r="2" fill="#FF4757"/><circle cx="54" cy="80" r="2" fill="#12B76A"/>
      <rect x="14" y="70" width="16" height="10" rx="5" fill="#EAF1FF" ${outline}/><rect x="70" y="70" width="16" height="10" rx="5" fill="#EAF1FF" ${outline}/>
      <path d="M50 12V3" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><circle cx="50" cy="3.5" r="3.2" fill="#FF4757" ${outline}/>
      <circle cx="50" cy="42" r="33" fill="#EAF1FF" ${outline}/>
      <circle cx="50" cy="42" r="26" fill="#9FC4FF" stroke="${INK}" stroke-width="2"/>
      <path d="M33 30q6 -9 17 -10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="33" cy="40" rx="7" ry="13" fill="#8A5A2B" ${outline} transform="rotate(14 33 40)"/><ellipse cx="67" cy="40" rx="7" ry="13" fill="#8A5A2B" ${outline} transform="rotate(-14 67 40)"/>
      <ellipse cx="50" cy="44" rx="17" ry="15" fill="#E8B77D" ${outline}/>
      <ellipse cx="50" cy="51" rx="9" ry="7" fill="#FFF1DE"/>
      ${eyes(m, 50, 40, 8.5, 4.6)}
      <ellipse cx="50" cy="48" rx="3.6" ry="2.6" fill="${INK}"/>
      ${m === 'happy' || m === 'wink' || m === 'wow' ? `<path d="M46 54q4 5 8 0" fill="#FF7A9A" stroke="${INK}" stroke-width="1.6"/>` : `<path d="M46 53q4 3 8 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`}`
  });

  /* ---- Quarki, el átomo ---- */
  add('quarki', {
    name: 'Quarki', color: '#12B76A', dark: '#0A7A46', soft: '#D6F5E6', world: 9, role: 'el átomo curioso',
    svg: (m) => `
      <ellipse cx="50" cy="52" rx="46" ry="15" fill="none" stroke="#12B76A" stroke-width="3" transform="rotate(30 50 52)"/>
      <ellipse cx="50" cy="52" rx="46" ry="15" fill="none" stroke="#12B76A" stroke-width="3" transform="rotate(-30 50 52)"/>
      <circle cx="10" cy="72" r="5" fill="#FFC21A" ${outline}/><circle cx="90" cy="32" r="5" fill="#FFC21A" ${outline}/><circle cx="12" cy="30" r="5" fill="#FFC21A" ${outline}/><circle cx="88" cy="74" r="5" fill="#FFC21A" ${outline}/>
      <circle cx="50" cy="52" r="26" fill="#12B76A" ${outline}/>
      <circle cx="40" cy="38" r="6" fill="#7BE3B0" opacity=".7"/>
      ${eyes(m, 50, 48, 10.5, 6)}
      ${mouth(m, 50, 61, 6.5)}
      ${cheeks(50, 57, 18)}
      <text x="50" y="28" font-family="Fredoka,system-ui,sans-serif" font-size="13" font-weight="700" fill="#fff" text-anchor="middle" opacity="0">+</text>`
  });

  /* ---- Terra, el planeta ---- */
  add('terra', {
    name: 'Terra', color: '#B5651D', dark: '#7A400B', soft: '#F6E4D0', world: 10, role: 'el planeta Tierra, siempre curioso',
    svg: (m) => `
      <path d="M50 22V10" stroke="#2E9E44" stroke-width="3.5" stroke-linecap="round"/><path d="M50 12q-2 -10 -14 -9q2 10 14 9ZM50 12q2 -10 14 -9q-2 10 -14 9Z" fill="#5CD068" ${outline} stroke-width="2"/>
      <circle cx="50" cy="58" r="35" fill="#2E9BFF" ${outline}/>
      <path d="M22 44q6 -10 16 -8q6 6 -2 12q-4 8 -12 6Q18 52 22 44ZM58 30q10 -4 18 4q2 8 -6 10q-6 10 -10 2q-6 -8 -2 -16ZM60 72q8 -2 14 4q-4 10 -12 10q-6 -6 -2 -14ZM30 70q6 2 8 8q-2 6 -8 4q-4 -6 0 -12Z" fill="#5CD068"/>
      <ellipse cx="74" cy="56" rx="9" ry="4" fill="#fff" opacity=".55"/>
      ${eyes(m, 50, 56, 13, 6.5)}
      ${mouth(m, 50, 70, 7)}
      ${cheeks(50, 66, 22)}
      <ellipse cx="14" cy="64" rx="6" ry="4.5" fill="#2E9BFF" ${outline}/><ellipse cx="86" cy="64" rx="6" ry="4.5" fill="#2E9BFF" ${outline}/>`
  });

  FK.CHAR_IDS = Object.keys(C);
  /* SVG listo para insertar en HTML */
  FK.char = function (id, mood = 'happy', size = 64) {
    const c = C[id] || C.buho;
    return `<svg class="char" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${c.name}">${c.svg(mood)}</svg>`;
  };
  /* Imagen para dibujar dentro de un lienzo (se cachea) */
  const imgCache = {};
  FK.charImg = function (id, mood = 'happy') {
    const k = id + ':' + mood;
    if (!imgCache[k]) {
      const c = C[id] || C.buho;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200">${c.svg(mood)}</svg>`;
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      imgCache[k] = img;
    }
    return imgCache[k];
  };
})();
