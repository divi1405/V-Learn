$srcDir = "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src"

# Define raw replacements
$replacements = @{
    # Classes
    '\bbtn-primary\b' = 'vearc-btn-primary'
    '\bpage-title\b' = 'vearc-page-title'
    '\bsidebar-item\b' = 'vearc-sidebar-item'
    '\bsidebar active\b' = 'vearc-sidebar-item active'
    '\bsearch-input\b' = 'vearc-search'
    '\btabs\b' = 'vearc-tabs'
    '\btab\b' = 'vearc-tab'
    
    # CSS Variables in style objects
    'var\(--bg-primary\)' = 'var(--vearc-bg)'
    'var\(--bg-surface\)' = 'var(--vearc-surface)'
    'var\(--bg-secondary\)' = 'var(--vearc-surface-soft)'
    'var\(--bg-elevated\)' = 'var(--vearc-surface)'
    'var\(--bg-hover\)' = 'var(--vearc-primary-verylight)'
    
    'var\(--text-primary\)' = 'var(--vearc-text-primary)'
    'var\(--text-secondary\)' = 'var(--vearc-text-secondary)'
    'var\(--text-muted\)' = 'var(--vearc-text-muted)'
    'var\(--text-inverse\)' = '#fff'
    
    'var\(--border\)' = 'var(--vearc-border)'
    'var\(--border-light\)' = 'var(--vearc-border)'
    
    'var\(--accent\)' = 'var(--vearc-primary)'
    'var\(--accent-hover\)' = 'var(--vearc-primary-light)'
    'var\(--accent-light\)' = 'var(--vearc-primary-verylight)'
    
    'var\(--success\)' = 'var(--vearc-success)'
    'var\(--danger\)' = 'var(--vearc-danger)'
    'var\(--error\)' = 'var(--vearc-danger)'
    
    'var\(--radius-sm\)' = 'var(--vearc-radius-sm)'
    'var\(--radius-md\)' = 'var(--vearc-radius-md)'
    'var\(--radius-lg\)' = 'var(--vearc-radius-lg)'
    
    # Specific targeted hex replacements mapped to CSS variables
    'color:\s*[''"]#[0-9a-fA-F]{3,8}[''"]' = "color: 'var(--vearc-text-primary)'"
    'backgroundColor:\s*[''"]#[0-9a-fA-F]{3,8}[''"]' = "backgroundColor: 'var(--vearc-surface)'"
    'background:\s*[''"]#[0-9a-fA-F]{3,8}[''"]' = "background: 'var(--vearc-surface)'"
    
    'color:\s*[''"]var\(--text-[^''"]+\)[''"]' = "color: 'var(--vearc-text-primary)'"
    'backgroundColor:\s*[''"]var\(--bg-[^''"]+\)[''"]' = "backgroundColor: 'var(--vearc-surface)'"
}

$files = Get-ChildItem -Path $srcDir -Recurse -Include *.js,*.jsx
$modifiedCount = 0

foreach ($file in $files) {
    if ($file.FullName -notmatch "node_modules|\.next|build") {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $originalContent = $content
        
        foreach ($key in $replacements.Keys) {
            $content = [regex]::Replace($content, $key, $replacements[$key])
        }
        
        # Specific fixed replacements for known inline styles holding exact hex
        $content = $content.Replace("'#0d0a12'", "'var(--vearc-bg)'")
        $content = $content.Replace("'#1a1523'", "'var(--vearc-surface)'")
        $content = $content.Replace("'#f0edf3'", "'var(--vearc-text-primary)'")
        $content = $content.Replace("'#a8a0b2'", "'var(--vearc-text-secondary)'")
        
        if ($content -cne $originalContent) {
            # Use ASCII or UTF8 encoding depending on original file, let's use UTF8
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
            $modifiedCount++
            Write-Host "Modified: $($file.FullName)"
        }
    }
}

Write-Host "Done. Modified $modifiedCount files."
