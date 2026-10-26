const fs = require('fs');
let txt = fs.readFileSync('web/index.html', 'utf8');
txt = txt.replace(
  'title="Ir a Óptica">',
  'title="Ir a Sala 4 · Pasillo (lado izquierdo)">'
);
txt = txt.replace(
  '<div class="spot-title">Lab. de Óptica</div>',
  '<div class="spot-title">Sala 4 · Pasillo (lado izquierdo)</div>'
);
txt = txt.replace(
  '<div class="spot-desc">Bancos ópticos para interferometría, difracción, fuentes láser, lentes y fotónica moderna.</div>',
  '<div class="spot-desc">Estación demostrativa montada a lo largo del pasillo izquierdo con 4 mesas experimentales.</div>'
);
txt = txt.replace(
  'Conducen a su grupo por las 4 estaciones en orden estricto (Pasillo Sistemas → Mecánica 1 → Mecánica 2 → Fluidos) y lo regresan a la Entrega.',
  'Conducen a su grupo por las 4 estaciones (Sala 1 Mecánica 1, Sala 2 Mecánica 2, Sala 3 Fluidos y Sala 4 Pasillo lado izquierdo) y lo regresan a la Entrega.'
);
fs.writeFileSync('web/index.html', txt, 'utf8');
console.log('web/index.html updated successfully.');
