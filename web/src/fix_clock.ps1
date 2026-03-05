$OutputEncoding = [Console]::InputEncoding = [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding

$file = "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\manager\assign-course\page.js"
$lines = Get-Content $file -Encoding UTF8
$lines[247] = "                                                            ⏱ {c.duration_mins ? (c.duration_mins < 60 ? ``${c.duration_mins}m`` : (c.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : ''}"
$lines[273] = "                                        {message.type === 'success' ? '✓' : '⚠️'} {message.text}"
Set-Content $file -Value $lines -Encoding UTF8

$file = "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\dashboard\page.js"
$lines = Get-Content $file -Encoding UTF8
$lines[68] = "                <span>⏱ {e.course?.duration_mins ? (e.course.duration_mins < 60 ? ``${e.course.duration_mins}m`` : (e.course.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : ''}</span>"
$lines[191] = "                                            <span style={{ color: 'var(--vearc-text-muted)' }}>⏱ {c.duration_mins ? (c.duration_mins < 60 ? ``${c.duration_mins}m`` : (c.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : ''}</span>"
Set-Content $file -Value $lines -Encoding UTF8

$file = "c:\Users\JRaviteja\Documents\hr_actual_data2\hr_platform\frontend\src\app\courses\page.js"
$lines = Get-Content $file -Encoding UTF8
$lines[123] = "                    <span>⏱ {c.duration_mins ? (c.duration_mins < 60 ? ``${c.duration_mins}m`` : (c.duration_mins / 60).toFixed(1).replace('.0', '') + 'h') : ''}</span>"
Set-Content $file -Value $lines -Encoding UTF8
