const fs = require('fs');
const path = require('path');

const targetFiles = [
    {
        file: 'material/1_cursos/solido/dist/index.html',
        tag: '<script src="/material/course-guard.js"></script>\n<script>if(typeof window.PhysicsAILabGuard===\'undefined\'){var s=document.createElement(\'script\');s.src=\'../../../course-guard.js\';document.head.appendChild(s);}</script>\n'
    },
    {
        file: 'material/1_cursos/solido/dist/Estado-Solido.html',
        tag: '<script src="/material/course-guard.js"></script>\n<script>if(typeof window.PhysicsAILabGuard===\'undefined\'){var s=document.createElement(\'script\');s.src=\'../../../course-guard.js\';document.head.appendChild(s);}</script>\n'
    },
    {
        file: 'material/1_cursos/solido/dist/solido.html',
        tag: '<script src="/material/course-guard.js"></script>\n<script>if(typeof window.PhysicsAILabGuard===\'undefined\'){var s=document.createElement(\'script\');s.src=\'../../../course-guard.js\';document.head.appendChild(s);}</script>\n'
    },
    {
        file: 'material/1_cursos/faro/manual/dist/index.html',
        tag: '<script src="/material/course-guard.js"></script>\n<script>if(typeof window.PhysicsAILabGuard===\'undefined\'){var s=document.createElement(\'script\');s.src=\'../../../../course-guard.js\';document.head.appendChild(s);}</script>\n'
    },
    {
        file: 'material/1_cursos/faro/manual/dist/faro-manual.html',
        tag: '<script src="/material/course-guard.js"></script>\n<script>if(typeof window.PhysicsAILabGuard===\'undefined\'){var s=document.createElement(\'script\');s.src=\'../../../../course-guard.js\';document.head.appendChild(s);}</script>\n'
    }
];

targetFiles.forEach(({ file, tag }) => {
    const fullPath = path.resolve(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) {
        console.warn('File not found:', file);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('course-guard.js')) {
        console.log('Already contains course-guard:', file);
        return;
    }
    if (content.includes('</body>')) {
        content = content.replace('</body>', `${tag}</body>`);
    } else {
        content = content + '\n' + tag;
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Injected course-guard into:', file);
});
