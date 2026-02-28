$files = @(
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\dashboard\page.js",
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\courses\page.js",
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\manager\assign-course\page.js",
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\courses\[id]\page.js",
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\notifications\page.js",
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\set-password\page.js",
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\components\Sidebar.js",
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\certificates\page.js"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        $text = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
        $orig = $text
        $text = $text.Replace('â ±', '⏱')
        $text = $text.Replace('â °', '⏰')
        $text = $text.Replace('ðŸ” ', '🔑')
        $text = $text.Replace('ðŸ”’', '🔒')
        $text = $text.Replace('ðŸ“‹', '📋')
        $text = $text.Replace('ðŸ †', '🏆')
        $text = $text.Replace('ðŸ”•', '🔕')
        $text = $text.Replace('ðŸ””', '🔔')
        if ($text -cne $orig) {
            Write-Host "Fixed: $f"
            [System.IO.File]::WriteAllText($f, $text, [System.Text.Encoding]::UTF8)
        }
    }
}
