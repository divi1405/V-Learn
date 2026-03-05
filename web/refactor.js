const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            if (dirPath.endsWith('.js') || dirPath.endsWith('.jsx')) {
                callback(dirPath);
            }
        }
    });
}

const colorRegexList = [
    /color:\s*['"][^'"]+['"]/gi,
    /backgroundColor:\s*['"][^'"]+['"]/gi,
    /background:\s*['"](?:var\(--bg-[^'"]+\)|#\w+|rgba?[^'"]+)['"]/gi,
    /borderColor:\s*['"][^'"]+['"]/gi,
];

// Mapping old classes to new ones where applicable
const classReplacements = {
    'btn-primary': 'vearc-btn-primary',
    'page-title': 'vearc-page-title',
    'sidebar-item': 'vearc-sidebar-item',
    'sidebar active': 'vearc-sidebar-item active',
    'search-input': 'vearc-search',
    'tabs': 'vearc-tabs',
    'tab': 'vearc-tab',
};

// Also we need to replace css variables in strings
const varReplacements = {
    'var(--bg-primary)': 'var(--vearc-bg)',
    'var(--bg-surface)': 'var(--vearc-surface)',
    'var(--bg-secondary)': 'var(--vearc-surface-soft)',
    'var(--bg-elevated)': 'var(--vearc-surface)',
    'var(--bg-hover)': 'var(--vearc-primary-verylight)',

    'var(--text-primary)': 'var(--vearc-text-primary)',
    'var(--text-secondary)': 'var(--vearc-text-secondary)',
    'var(--text-muted)': 'var(--vearc-text-muted)',
    'var(--text-inverse)': '#fff',

    'var(--border)': 'var(--vearc-border)',
    'var(--border-light)': 'var(--vearc-border)',

    'var(--accent)': 'var(--vearc-primary)',
    'var(--accent-hover)': 'var(--vearc-primary-light)',
    'var(--accent-light)': 'var(--vearc-primary-verylight)',

    'var(--success)': 'var(--vearc-success)',
    'var(--danger)': 'var(--vearc-danger)',
    'var(--error)': 'var(--vearc-danger)',
    'var(--warning)': '#d97706', // no warning in new palette, fallback config if needed or removed

    'var(--radius-sm)': 'var(--vearc-radius-sm)',
    'var(--radius-md)': 'var(--vearc-radius-md)',
    'var(--radius-lg)': 'var(--vearc-radius-lg)',

    // also handle hardcoded colors
    '#0d0a12': 'var(--vearc-bg)',
    '#1a1523': 'var(--vearc-surface)',
    '#f0edf3': 'var(--vearc-text-primary)',
    '#a8a0b2': 'var(--vearc-text-secondary)'
};

let modifiedFiles = 0;

walkDir(srcDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Replace variables in style objects or strings
    for (const [oldVar, newVar] of Object.entries(varReplacements)) {
        // Escape for regex if needed, but string replacement is safer for exact vars
        content = content.split(oldVar).join(newVar);
    }

    // 2. Replace classes
    for (const [oldClass, newClass] of Object.entries(classReplacements)) {
        // Regex to match exact class names and not partials
        const regex = new RegExp(`\\b${oldClass}\\b`, 'g');
        content = content.replace(regex, newClass);
    }

    // 3. Strip hardcoded color properties from style={{ ... }}
    // It's tricky with regex, let's just do targeted replaces of common inline issues
    // if they involve hex or old vars
    content = content.replace(/color:\s*['"]#[0-9a-fA-F]{3,8}['"]/g, "color: 'var(--vearc-text-primary)'");
    content = content.replace(/backgroundColor:\s*['"]#[0-9a-fA-F]{3,8}['"]/g, "backgroundColor: 'var(--vearc-surface)'");
    content = content.replace(/background:\s*['"]#[0-9a-fA-F]{3,8}['"]/g, "background: 'var(--vearc-surface)'");

    content = content.replace(/color:\s*['"]var\(--text-[^'"]+\)['"]/g, "color: 'var(--vearc-text-primary)'");
    content = content.replace(/backgroundColor:\s*['"]var\(--bg-[^'"]+\)['"]/g, "backgroundColor: 'var(--vearc-surface)'");

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedFiles++;
        console.log(`Modified: ${filePath}`);
    }
});

console.log(`Done. Modified ${modifiedFiles} files.`);
