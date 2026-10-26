const fs = require('fs');
const html = fs.readFileSync('material/1_cursos/manu_squash_arbitraje/index.html', 'utf8');

const t = html.match(/<title>([^<]+)<\/title>/);
console.log('Title:', t ? t[1] : 'none');

const d = html.match(/name="description"\s+content="([^"]+)"/);
console.log('Desc:', d ? d[1] : 'none');

// Find sections in src/sections
const sectionsDir = 'material/1_cursos/manu_squash_arbitraje/src/sections';
if (fs.existsSync(sectionsDir)) {
    console.log('Sections files:', fs.readdirSync(sectionsDir));
}
