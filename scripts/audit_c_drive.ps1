$drive = Get-PSDrive C
$freeGB = [math]::Round($drive.Free / 1GB, 3)
$usedGB = [math]::Round($drive.Used / 1GB, 3)
Write-Output "C Free Space: $freeGB GB ($($drive.Free) bytes)"
Write-Output "C Used Space: $usedGB GB ($($drive.Used) bytes)"

$candidates = @(
    "C:\Users\ALPHA-1\AppData\Local\Temp",
    "C:\Users\ALPHA-1\AppData\Local\npm-cache",
    "C:\Users\ALPHA-1\AppData\Local\CrashDumps"
)

foreach ($c in $candidates) {
    if (Test-Path $c) {
        $measure = Get-ChildItem -Path $c -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum
        $mb = [math]::Round($measure.Sum / 1MB, 2)
        Write-Output "$c : $mb MB ($($measure.Count) files)"
    }
}
