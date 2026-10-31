# Checks and starts the dedicated XERJ daemon for HumanizeText on port 9300
$port = 9300
$dataDir = "$env:USERPROFILE\xerj-data-humanizetext"
$xerjExe = "C:\Users\varad\AppData\Local\Programs\xerj\xerj.exe"

$conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "[XERJ] Node is already running and listening on http://localhost:$port (PID: $($conn.OwningProcess))"
    exit 0
}

Write-Host "[XERJ] Starting dedicated XERJ node on http://localhost:$port..."
Start-Process -FilePath $xerjExe -ArgumentList "--insecure", "--port", "$port", "--data-dir", "$dataDir" -WindowStyle Hidden

Start-Sleep -Seconds 2
$conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "[XERJ] Node successfully started and listening on http://localhost:$port (PID: $($conn.OwningProcess))"
} else {
    Write-Host "[XERJ] Waiting for node to bind to port $port..."
    Start-Sleep -Seconds 3
    Write-Host "[XERJ] Node status checked."
}

