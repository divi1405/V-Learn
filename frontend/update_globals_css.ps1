$cssPath = "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\globals.css"
$content = [System.IO.File]::ReadAllText($cssPath, [System.Text.Encoding]::UTF8)

# 1. We replace old variables with new ones throughout globals.css
$replacements = @{
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
}

foreach ($key in $replacements.Keys) {
    $content = [regex]::Replace($content, $key, $replacements[$key])
}

# 2. Extract out the top part. The top part is from line 1 to 119. 
# We'll use regex to remove everything from :root { ... } to just before /* ========== LAYOUT ========== */
$content = [regex]::Replace($content, '(?s):root\s*\{.*?(?=/\*\s*========== LAYOUT)', '')

# 3. Insert the User's CSS block
$userCSS = @"
:root {
  /* Brand */
  --vearc-primary: #400F61;
  --vearc-primary-light: #5A1A82;
  --vearc-primary-verylight: #F4EDF9;
  /* Neutrals */
  --vearc-bg: #F6F4F8;
  --vearc-surface: #FFFFFF;
  --vearc-surface-soft: #FBFAFC;
  --vearc-border: #E6E1EA;
  /* Text */
  --vearc-text-primary: #2B2B2B;
  --vearc-text-secondary: #6E6A75;
  --vearc-text-muted: #9A96A3;
  /* Status */
  --vearc-danger: #E5484D;
  --vearc-success: #2E8B57;
  /* Elevation */
  --vearc-shadow-soft: 0 2px 8px rgba(0,0,0,0.04);
  --vearc-shadow-hover: 0 6px 16px rgba(0,0,0,0.08);
  /* Radius */
  --vearc-radius-sm: 6px;
  --vearc-radius-md: 10px;
  --vearc-radius-lg: 16px;
  /* Layout */
  --vearc-sidebar-width: 240px;
}
.vearc-sidebar {
  width: var(--vearc-sidebar-width);
  background: var(--vearc-surface);
  border-right: 1px solid var(--vearc-border);
}
.vearc-sidebar-item {
  padding: 10px 14px;
  border-radius: var(--vearc-radius-sm);
  color: var(--vearc-text-secondary);
  transition: all 0.2s ease;
}
.vearc-sidebar-item:hover {
  background: var(--vearc-primary-verylight);
  color: var(--vearc-primary);
}
.vearc-sidebar-item.active {
  background: var(--vearc-primary);
  color: #fff;
}
.vearc-page-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
}
.vearc-tabs {
  border-bottom: 1px solid var(--vearc-border);
}
.vearc-tab {
  padding: 10px 18px;
  color: var(--vearc-text-secondary);
  font-weight: 500;
  cursor: pointer;
}
.vearc-tab.active {
  color: var(--vearc-primary);
  border-bottom: 2px solid var(--vearc-primary);
}
.vearc-search {
  background: var(--vearc-surface);
  border: 1px solid var(--vearc-border);
  border-radius: var(--vearc-radius-sm);
  padding: 8px 12px;
  outline: none;
  transition: border 0.2s ease;
}
.vearc-search:focus {
  border-color: var(--vearc-primary);
}
.vearc-btn-primary {
  background: var(--vearc-primary);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: var(--vearc-radius-sm);
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.vearc-btn-primary:hover {
  background: var(--vearc-primary-light);
  box-shadow: var(--vearc-shadow-soft);
}
body {
  font-family: "Roboto", "Segoe UI", sans-serif;
  background: var(--vearc-bg);
  color: var(--vearc-text-primary);
  margin: 0;
  font-weight: 400;
}
h1, h2, h3 {
  font-family: "Playfair Display", serif;
  font-weight: 600;
  letter-spacing: 0.3px;
}
h4, h5, h6 {
  font-family: "Roboto", sans-serif;
  font-weight: 600;
}

"@

$newContent = [regex]::Replace($content, "@import url.*?;\r?\n", "`$0$userCSS`n`n")

[System.IO.File]::WriteAllText($cssPath, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "globals.css updated successfully."
