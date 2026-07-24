#Requires -Version 5.1
<#
  Starts the North Star Headquarters dev server (apps/north-star-hq, its own
  standalone app — see apps/north-star-hq/README.md) and opens it
  automatically. Safe to re-run: detects an already-running server on the
  target port before starting a new one, and never kills unrelated node
  processes.
#>

param(
  [int]$Port = 3100
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Join-Path $repoRoot 'apps\north-star-hq'
Set-Location $appDir

function Test-PortOpen($port) {
  try {
    $conn = Test-NetConnection -ComputerName 'localhost' -Port $port -WarningAction SilentlyContinue
    return $conn.TcpTestSucceeded
  } catch {
    return $false
  }
}

$url = "http://localhost:$Port"

if (Test-PortOpen $Port) {
  Write-Host "Something is already listening on port $Port." -ForegroundColor Yellow
  Write-Host "Assuming it's North Star Headquarters' dev server and opening $url ..." -ForegroundColor Yellow
  Start-Process $url
  exit 0
}

Write-Host "Starting North Star Headquarters dev server on port $Port ..." -ForegroundColor Cyan

$devProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Normal -WorkingDirectory $appDir

Write-Host "Waiting for http://localhost:$Port to respond ..." -ForegroundColor Cyan
$maxWaitSeconds = 60
$elapsed = 0
while (-not (Test-PortOpen $Port)) {
  Start-Sleep -Seconds 1
  $elapsed++
  if ($elapsed -ge $maxWaitSeconds) {
    Write-Host "Timed out waiting for the dev server to start. Check the npm run dev window for errors." -ForegroundColor Red
    exit 1
  }
}

Start-Sleep -Seconds 1
Write-Host "Ready. Opening $url" -ForegroundColor Green
Start-Process $url

Write-Host ""
Write-Host "The dev server is running in a separate window (PID $($devProcess.Id))." -ForegroundColor DarkGray
Write-Host "Close that window, or press Ctrl+C in it, to stop North Star Headquarters." -ForegroundColor DarkGray
