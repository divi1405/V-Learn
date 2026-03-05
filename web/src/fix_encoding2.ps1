$srcDir = "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src"

$files = Get-ChildItem -Path $srcDir -Recurse -Include *.js,*.jsx,*.css
$modifiedCount = 0

foreach ($file in $files) {
    if ($file.FullName -notmatch "node_modules|\.next|build") {
        # Read as UTF8
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $originalContent = $content
        
        $content = $content -replace 'â ±', '⏱'
        $content = $content -replace 'â†’', '&rarr;'
        $content = $content -replace 'â °', '⏰'
        $content = $content -replace 'âš ï¸ ', '⚠️'
        $content = $content -replace 'âœ…', '✅'
        $content = $content -replace 'â† ', '&larr;'

        if ($content -cne $originalContent) {
            [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
            $modifiedCount++
            Write-Host "Fixed encoding in: $($file.FullName)"
        }
    }
}
Write-Host "Done. Modified $modifiedCount files."
