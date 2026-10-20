/* ===================================================================
   07-docx.js — Documento de Word (.docx, Office Open XML) a partir de
   bloques. Puro: lo usan el generador de guías y las pruebas en Node.
   Bloques:
     {t:'titulo', text, sub}      {t:'h1'|'h2'|'h3', text}
     {t:'p', text, align, small, color}   {t:'ul'|'ol', items:[…]}
     {t:'tabla', head:[…], rows:[[…]], widths:[…], vacias:n, small}
     {t:'campos', pares:[[etiqueta, valor], …], cols:2}
     {t:'caja', titulo, text | items}    {t:'lineas', n}
     {t:'img', png: Uint8Array, w, h, ancho (cm), pie}   {t:'salto'}
   El texto admite <b>, <i>, <sub>, <sup> y <br>.
   =================================================================== */
(function () {
  'use strict';
  const EM = (window.EM = window.EM || {});
  const X = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const ACC = '0B7A5F';

  /* Texto con marcas mínimas → corridas {text, b, i, sub, sup, br} */
  function runs(s) {
    const out = [];
    const st = { b: 0, i: 0, sub: 0, sup: 0 };
    const re = /<(\/?)(b|strong|i|em|sub|sup|br)\s*\/?>|<[^>]+>|([^<]+)/gi;
    let m;
    const dec = (t) => t.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    while ((m = re.exec(String(s)))) {
      if (m[3] !== undefined) { out.push({ text: dec(m[3]), b: st.b > 0, i: st.i > 0, sub: st.sub > 0, sup: st.sup > 0 }); continue; }
      if (!m[2]) continue;
      const tag = m[2].toLowerCase(), close = m[1] === '/';
      if (tag === 'br') { out.push({ br: true }); continue; }
      const k = tag === 'strong' ? 'b' : tag === 'em' ? 'i' : tag;
      st[k] += close ? -1 : 1;
      if (st[k] < 0) st[k] = 0;
    }
    return out;
  }
  EM.docRuns = runs;
  function rXml(r, o = {}) {
    if (r.br) return '<w:r><w:br/></w:r>';
    let pr = '';
    if (r.b || o.b) pr += '<w:b/>';
    if (r.i || o.i) pr += '<w:i/>';
    if (o.color) pr += `<w:color w:val="${o.color}"/>`;
    if (o.sz) pr += `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>`;
    if (r.sub) pr += '<w:vertAlign w:val="subscript"/>';
    if (r.sup) pr += '<w:vertAlign w:val="superscript"/>';
    return `<w:r>${pr ? '<w:rPr>' + pr + '</w:rPr>' : ''}<w:t xml:space="preserve">${X(r.text)}</w:t></w:r>`;
  }
  const para = (s, o = {}) => {
    let ppr = '';
    if (o.style) ppr += `<w:pStyle w:val="${o.style}"/>`;
    if (o.keep) ppr += '<w:keepNext/>';
    if (o.num) ppr += `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${o.num}"/></w:numPr>`;
    if (o.border) ppr += '<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="AAAAAA"/></w:pBdr>';
    if (o.shd) ppr += `<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>`;
    if (o.spacing) ppr += `<w:spacing ${o.spacing}/>`;
    if (o.align) ppr += `<w:jc w:val="${o.align}"/>`;
    return `<w:p>${ppr ? '<w:pPr>' + ppr + '</w:pPr>' : ''}${runs(s).map((r) => rXml(r, o)).join('')}</w:p>`;
  };
  const CM = 567; /* twips por centímetro */

  EM.docx = function (bloques, meta = {}) {
    const ANCHO = 12240 - 2 * 1134; /* carta con márgenes de 2 cm */
    const nums = [];
    const media = [];
    let body = '';
    let imgN = 0;
    const tabla = (head, rows, widths, o = {}) => {
      const n = head ? head.length : rows[0].length;
      const w = widths && widths.length === n ? widths : new Array(n).fill(1);
      const sw = w.reduce((a, b) => a + b, 0);
      const cw = w.map((v) => Math.round((ANCHO * v) / sw));
      const sz = o.small ? 18 : 20;
      const cell = (s, i, hd, fill) => `<w:tc><w:tcPr><w:tcW w:w="${cw[i]}" w:type="dxa"/>${fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : ''}</w:tcPr>${para(s === undefined || s === null ? '' : s, { b: hd, sz, spacing: 'w:before="20" w:after="20"' })}</w:tc>`;
      let x = '<w:tbl><w:tblPr><w:tblW w:w="' + ANCHO + '" w:type="dxa"/><w:tblBorders>' +
        ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((b) => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="8A8A8A"/>`).join('') +
        '</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' + cw.map((c) => `<w:gridCol w:w="${c}"/>`).join('') + '</w:tblGrid>';
      if (head) x += '<w:tr><w:trPr><w:tblHeader/></w:trPr>' + head.map((h, i) => cell(h, i, true, 'E3EFEA')).join('') + '</w:tr>';
      for (const r of rows) x += '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + r.map((c, i) => cell(c, i, o.primeraNegrita && i === 0, o.primeraNegrita && i === 0 ? 'F3F2EC' : null)).join('') + '</w:tr>';
      for (let k = 0; k < (o.vacias || 0); k++) x += '<w:tr><w:trPr><w:trHeight w:val="400"/></w:trPr>' + cw.map((_, i) => cell('', i, false)).join('') + '</w:tr>';
      return x + '</w:tbl>' + para('', { spacing: 'w:after="60"' });
    };
    for (const b of bloques) {
      switch (b.t) {
        case 'titulo':
          body += para(b.text, { style: 'Title' });
          if (b.sub) body += para(b.sub, { style: 'Subtitle' });
          break;
        case 'h1': body += para(b.text, { style: 'Heading1' }); break;
        case 'h2': body += para(b.text, { style: 'Heading2' }); break;
        case 'h3': body += para(b.text, { style: 'Heading3' }); break;
        case 'p': body += para(b.text, { align: b.align, sz: b.small ? 18 : undefined, color: b.color, i: b.i }); break;
        case 'ul': for (const it of b.items) body += para(it, { style: 'ListParagraph', num: 1 }); break;
        case 'ol': {
          const id = 2 + nums.length;
          nums.push(id);
          for (const it of b.items) body += para(it, { style: 'ListParagraph', num: id });
          break;
        }
        case 'tabla': body += tabla(b.head, b.rows || [], b.widths, { vacias: b.vacias, small: b.small, primeraNegrita: b.primeraNegrita }); break;
        case 'campos': {
          const c = b.cols || 2, rows = [];
          for (let i = 0; i < b.pares.length; i += c) {
            const r = [];
            for (let j = 0; j < c; j++) { const pr = b.pares[i + j]; r.push(pr ? '<b>' + pr[0] + '</b>' : '', pr ? pr[1] : ''); }
            rows.push(r);
          }
          body += tabla(null, rows, new Array(2 * c).fill(0).map((_, i) => (i % 2 ? 2.2 : 1)), { small: true });
          break;
        }
        case 'caja': {
          if (b.titulo) body += para('<b>' + b.titulo + '</b>', { shd: 'E8F3EE', keep: true, color: ACC, spacing: 'w:before="120" w:after="0"' });
          const items = b.items || [b.text];
          for (const it of items) body += para(it, { shd: 'E8F3EE', spacing: 'w:after="0"' });
          body += para('', { spacing: 'w:after="60"' });
          break;
        }
        case 'lineas': for (let i = 0; i < (b.n || 3); i++) body += para('', { border: true, spacing: 'w:before="200" w:after="0"' }); break;
        case 'img': {
          imgN++;
          const rid = 'rIdImg' + imgN, name = 'img' + imgN + '.png';
          media.push({ name: 'word/media/' + name, data: b.png, rid });
          const anchoCm = b.ancho || 16, cx = Math.round((anchoCm / 2.54) * 914400), cy = Math.round((cx * b.h) / b.w);
          body += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${imgN}" name="Imagen ${imgN}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${imgN}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
          if (b.pie) body += para('<i>' + b.pie + '</i>', { align: 'center', sz: 18 });
          break;
        }
        case 'salto': body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'; break;
        default: break;
      }
    }
    const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body}<w:sectPr><w:headerReference w:type="default" r:id="rIdH"/><w:footerReference w:type="default" r:id="rIdF"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const lvl = (fmt, txt) => `<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${txt}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="567" w:hanging="340"/></w:pPr>${fmt === 'bullet' ? '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr>' : ''}</w:lvl>`;
    const numbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>${lvl('bullet', '•')}</w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="singleLevel"/>${lvl('decimal', '%1.')}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>${nums.map((id) => `<w:num w:numId="${id}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`).join('')}</w:numbering>`;
    const sty = (id, name, rpr, ppr, extra = '') => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>${extra}<w:qFormat/><w:pPr>${ppr}</w:pPr><w:rPr>${rpr}</w:rPr></w:style>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="es-CO" w:eastAsia="es-CO" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>` +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
      sty('Title', 'Title', `<w:b/><w:color w:val="${ACC}"/><w:sz w:val="36"/><w:szCs w:val="36"/>`, '<w:spacing w:after="60"/>') +
      sty('Subtitle', 'Subtitle', '<w:color w:val="555555"/><w:sz w:val="24"/>', '<w:spacing w:after="200"/>') +
      sty('Heading1', 'heading 1', `<w:b/><w:color w:val="${ACC}"/><w:sz w:val="26"/><w:szCs w:val="26"/>`, '<w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="0"/>') +
      sty('Heading2', 'heading 2', '<w:b/><w:sz w:val="23"/><w:szCs w:val="23"/>', '<w:keepNext/><w:spacing w:before="160" w:after="60"/><w:outlineLvl w:val="1"/>') +
      sty('Heading3', 'heading 3', '<w:b/><w:i/><w:sz w:val="22"/>', '<w:keepNext/><w:spacing w:before="120" w:after="40"/><w:outlineLvl w:val="2"/>') +
      sty('ListParagraph', 'List Paragraph', '', '<w:spacing w:after="40"/><w:ind w:left="567"/><w:contextualSpacing/>') +
      sty('Header', 'header', '<w:color w:val="555555"/><w:sz w:val="17"/>', '<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="AAAAAA"/></w:pBdr><w:spacing w:after="0"/>') +
      sty('Footer', 'footer', '<w:color w:val="666666"/><w:sz w:val="16"/>', '<w:spacing w:after="0"/>') +
      '</w:styles>';
    const hdr = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}>${para(meta.encabezado || '', { style: 'Header' })}</w:hdr>`;
    const ftr = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}><w:p><w:pPr><w:pStyle w:val="Footer"/><w:tabs><w:tab w:val="right" w:pos="${ANCHO}"/></w:tabs></w:pPr>${runs(meta.pie || '').map((r) => rXml(r)).join('')}<w:r><w:tab/><w:t xml:space="preserve">Página </w:t></w:r><w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple><w:r><w:t xml:space="preserve"> de </w:t></w:r><w:fldSimple w:instr=" NUMPAGES "><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>`;
    const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${X(meta.titulo || 'Guía de laboratorio')}</dc:title><dc:creator>${X(meta.autor || '')}</dc:creator><dc:language>es-CO</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;
    const app = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Guías y Montajes de Física</Application></Properties>';
    const ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>';
    const rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>';
    const drels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdN" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rIdH" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' +
      media.map((m) => `<Relationship Id="${m.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.name.split('/').pop()}"/>`).join('') + '</Relationships>';
    return EM.zip([
      { name: '[Content_Types].xml', data: ct }, { name: '_rels/.rels', data: rels },
      { name: 'word/document.xml', data: doc }, { name: 'word/_rels/document.xml.rels', data: drels },
      { name: 'word/styles.xml', data: styles }, { name: 'word/numbering.xml', data: numbering },
      { name: 'word/header1.xml', data: hdr }, { name: 'word/footer1.xml', data: ftr },
      { name: 'docProps/core.xml', data: core }, { name: 'docProps/app.xml', data: app }
    ].concat(media.map((m) => ({ name: m.name, data: m.data }))));
  };
  EM.docx.CM = CM;
})();
