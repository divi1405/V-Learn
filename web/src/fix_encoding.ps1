$srcDir = "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src"

$replacements = [ordered]@{
    'â ±' = 'â ±' # Wait, 'â ±' is actually how PowerShell read the mangled file in ANSI. 
    # Let's just do simple string replacements. 
    # 'â ±' -> '⏱'
    # 'â†’' -> '→'
    # 'â† ' -> '&larr;'
    # 'â °' -> '⏰'
    # 'âš ï¸ ' -> '⚠️'
    # 'âœ…' -> '✅'
}

$files = Get-ChildItem -Path $srcDir -Recurse -Include *.js,*.jsx,*.css
$modifiedCount = 0

foreach ($file in $files) {
    if ($file.FullName -notmatch "node_modules|\.next|build") {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $originalContent = $content
        
        $content = $content.Replace('â ±', '⏱')
        $content = $content.Replace('â†’', '&rarr;')
        $content = $content.Replace('â† ', '&larr;')
        $content = $content.Replace('â °', '⏰')
        $content = $content.Replace('âš ï¸ ', '⚠️')
        $content = $content.Replace('âœ…', '✅')

        if ($content -cne $originalContent) {
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
            $modifiedCount++
            Write-Host "Fixed encoding in: $($file.FullName)"
        }
    }
}
Write-Host "Done. Modified $modifiedCount files."
