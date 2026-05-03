$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$minio = Join-Path $root '.local\bin\minio.exe'
$data = Join-Path $root '.local\minio-data'

if (-not (Test-Path $minio)) {
  New-Item -ItemType Directory -Force (Split-Path $minio), $data | Out-Null
  Invoke-WebRequest -Uri 'https://dl.min.io/server/minio/release/windows-amd64/minio.exe' -OutFile $minio
}

New-Item -ItemType Directory -Force $data | Out-Null

$portInUse = Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue
if ($portInUse) {
  Write-Host 'MinIO already listens on port 9000'
  exit 0
}

if (-not $env:MINIO_ROOT_USER) {
  $env:MINIO_ROOT_USER = 'minioadmin'
}

if (-not $env:MINIO_ROOT_PASSWORD) {
  $env:MINIO_ROOT_PASSWORD = 'minioadmin'
}

Start-Process -FilePath $minio `
  -ArgumentList "server `"$data`" --address :9000 --console-address :9001" `
  -WorkingDirectory $root `
  -WindowStyle Hidden | Out-Null

Start-Sleep -Seconds 3
Write-Host 'MinIO started: API http://localhost:9000, console http://localhost:9001'
