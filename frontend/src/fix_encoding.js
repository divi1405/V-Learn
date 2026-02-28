const fs = require('fs');
const glob = require('glob');

// To fix mangled encodings introduced by powershell
// â ± -> ⏱
// â†’ -> →
// â†  -> ←
// â ° -> ⏰
// âš ï¸  -> ⚠️
// We will simply search and replace these in all files.
const replacements = {
    'â ±': '⏱',
    'â†’': '→',
    'â† ': '&larr;',
    'â °': '⏰',
    'âš ï¸ ': '⚠️'
};

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.next') continue;
        const fullPath = dir + '/' + file;
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            for (const [bad, good] of Object.entries(replacements)) {
                if (content.includes(bad)) {
                    content = content.split(bad).join(good);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Fixed encoding in ${fullPath}`);
            }
        }
    }
}

processDir('c:/Users/JRaviteja/Documents/hr_actual_data2/hr_platform/frontend/src');
