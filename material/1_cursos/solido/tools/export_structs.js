/* Exporta las estructuras generadas por el curso (src/core/30-ss.js) a tests/estructuras.json
   para que spglib identifique su grupo espacial y pymatgen calcule difracción y Ewald. */
const path = require('path'), fs = require('fs');
const SS = require(path.join(__dirname, '../src/core/30-ss.js'));
const D = SS.data || require(path.join(__dirname, '../src/core/29-data.js'));
const list = {
  sc: ['sc', 3.0, null, ['Po']], bcc: ['bcc', 2.867, null, ['Fe']], fcc: ['fcc', 3.615, null, ['Cu']], hcp: ['hcp', 3.209, 5.211, ['Mg']],
  diamond: ['diamond', 5.431, null, ['Si']], zincblende: ['zincblende', 5.653, null, ['Ga', 'As']], NaCl: ['NaCl', 5.640, null, ['Na', 'Cl']],
  CsCl: ['CsCl', 4.123, null, ['Cs', 'Cl']], fluorite: ['fluorite', 5.463, null, ['Ca', 'F']], perovskite: ['perovskite', 3.905, null, ['Sr', 'Ti', 'O']],
  wurtzite: ['wurtzite', 3.250, 5.207, ['Zn', 'O']], graphite: ['graphite', 2.464, 6.711, ['C']],
  Al: ['fcc', 4.049, null, ['Al']], W: ['bcc', 3.165, null, ['W']], KCl: ['NaCl', 6.293, null, ['K', 'Cl']]
};
const out = {};
for (const [k, [name, a, c, els]] of Object.entries(list)) {
  const st = SS.structure(name, a, c || undefined, name === 'wurtzite' ? 0.382 : undefined);
  out[k] = { name, cell: st.cell, frac: st.atoms.map((x) => x.f), species: st.atoms.map((x) => els[x.s]) };
}
fs.writeFileSync(path.join(__dirname, '../tests/estructuras.json'), JSON.stringify(out));
console.log('estructuras.json:', Object.keys(out).length, 'estructuras');
