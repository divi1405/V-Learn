$cssPath = "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\globals.css"
$content = [System.IO.File]::ReadAllText($cssPath)

# 1. Remove old :root block and [data-theme="light"] block
# Instead of complex regex, let's just replace the variables inside. Actually, creating a new file is safer or string replace.
# I'll just replace the CSS variables mapping via regex inside the whole file, then at the top, I will prepend the user's provided new :root. But I should remove the old variables.
