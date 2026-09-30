$d = Get-PSDrive C
Write-Output "Free: $([math]::Round($d.Free/1GB, 3)) GB"
Write-Output "Used: $([math]::Round($d.Used/1GB, 3)) GB"
