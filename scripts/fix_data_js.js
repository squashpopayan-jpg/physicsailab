const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '../web/data.js');
let code = fs.readFileSync(p, 'utf8');

const badChunk = `        },
        {
                    {
            id: "squash_arbitraje",`;

const goodChunk = `        },
        {
            id: "squash_arbitraje",`;

const badHbn = `            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        id: "hbn_mc",`;

const goodHbn = `            enlaceWompi: "https://checkout.wompi.co/l/VPOS_b6GD2z"
        },
        {
            id: "hbn_mc",`;

code = code.replace(/\r\n/g, '\n');
code = code.replace(badChunk, goodChunk);
code = code.replace(badHbn, goodHbn);

fs.writeFileSync(p, code, 'utf8');
console.log('Fixed web/data.js syntax.');
