const fs = require('fs');
const file = 'c:/Users/JRaviteja/Documents/hr_actual_data2/hr_platform/frontend/src/app/set-password/page.js';
let content = fs.readFileSync(file, 'utf8');

// Fix duplicate LockIcon by finding the first index and removing the second one, or just simple regex for duplicates
content = content.replace(/const LockIcon = \(\{ size = 24 \}\) => \([\s\S]*?<\/svg>\r?\n    \);\r?\n\r?\n    const LockIcon/g, 'const LockIcon');

// Fix the icon replacements
content = content.replace(/<div style=\{\{ fontSize: '1.5rem', marginBottom: 6 \}\}>.*?<\/div>/, '<div style={{ display: \\'flex\\', justifyContent: \\'center\\', marginBottom: 6, color: \\'var(--vearc - primary) \\' }}><LockIcon size={28} /></div>');
content = content.replace(/\) : '.*? Set Password & Continue\\'}/, ') : (<><LockIcon size={18} /> Set Password & Continue</>)}');

fs.writeFileSync(file, content, 'utf8');
console.log('Replacements done!');
