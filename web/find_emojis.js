const fs = require('fs');
const path = require('path');

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{1F004}\u{1F916}\u{1F44B}\u{1F3AF}\u{1F4DD}\u{1F3C6}\u{1F514}\u{1F465}\u{1F4D6}\u{1F5A5}\u{1F9D1}\u{1F4BB}\u{1F4E7}\u{1F31F}\u{2B50}\u{2728}]/u;

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        if (file === 'node_modules' || file === '.next') return;
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
                const content = fs.readFileSync(file, 'utf8');
                if (emojiRegex.test(content)) {
                    results.push(file);
                }
            }
        }
    });
    return results;
}

const res = walk('./src/app');
console.log(res);
