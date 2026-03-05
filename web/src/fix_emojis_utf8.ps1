$files = @(
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\dashboard\page.js",
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\courses\page.js",
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\manager\assign-course\page.js",
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\notifications\page.js",
    "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\set-password\page.js"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        $text = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8)
        $orig = $text
        $text = $text.Replace("â ±", "⏱")
        $text = $text.Replace("â °", "⏰")
        $text = $text.Replace("ðŸ” ", "🔑")
        $text = $text.Replace("ðŸ †", "🏆")
        $text = $text.Replace("ðŸ”•", "🔕")
        $text = $text.Replace("â† ", "←")
        $text = $text.Replace("âš ï¸ ", "⚠️")

        if ($text -cne $orig) {
            Write-Host "Fixed: $f"
            [IO.File]::WriteAllText($f, $text, [Text.Encoding]::UTF8)
        }
    }
}
