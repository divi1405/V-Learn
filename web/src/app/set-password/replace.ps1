$path = "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\set-password\page.js"
$content = Get-Content $path -Raw -Encoding UTF8

# Remove duplicate LockIcon
$content = $content -replace "(?s)    const LockIcon = \(\{\s*size\s*=\s*24\s*\}\)\s*=>\s*\([\s\S]*?<\/svg>\r?\n    \);\r?\n\r?\n    const LockIcon", "    const LockIcon"

# Replace 1.5rem icon
$content = $content -replace "(?s)<div style=\{\{ fontSize: '1\.5rem', marginBottom: 6 \}\}>[^\<]+<\/div>", "<div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: 'var(--vearc-primary)' }}><LockIcon size={28} /></div>"

# Replace button icon
$content = $content -replace "(?s)\) : '[^']+Set Password & Continue'}", ") : (`n                            <>`n                                <LockIcon size={18} />`n                                Set Password & Continue`n                            </>`n                        )}"

Set-Content -Path $path -Value $content -Encoding UTF8
Write-Output "Replacements completed"
