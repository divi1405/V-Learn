$srcDir = "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src"

$files = Get-ChildItem -Path $srcDir -Recurse -Include *.js,*.jsx
$modifiedCount = 0

foreach ($file in $files) {
    if ($file.FullName -notmatch "node_modules|\.next|build") {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if ($content -match "vearc-vearc-") {
            $newContent = $content -replace "vearc-vearc-", "vearc-"
            [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
            $modifiedCount++
            Write-Host "Fixed double vearc on: $($file.FullName)"
        }
    }
}
Write-Host "Done. Modified $modifiedCount files."
