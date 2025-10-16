<#
.SYNOPSIS
  Checa o health endpoint e root de um domínio Render e, opcionalmente, tenta obter logs via Render CLI.

.PARAMETER Domain
  O domínio (ex: luciofreitas-github-io.onrender.com) a ser testado.

.PARAMETER ServiceName
  (Opcional) Nome do serviço no Render. Usado para obter logs via Render CLI, se instalado.

.PARAMETER HealthPath
  Path do health endpoint. Padrão: /api/health

.PARAMETER Retries
  Número de tentativas para checagem do health.

.PARAMETER IntervalSeconds
  Intervalo entre tentativas em segundos.

USAGE
  .\scripts\check_render_service.ps1 -Domain "luciofreitas-github-io.onrender.com" -ServiceName "lucio-backend"

#>
param(
  [Parameter(Mandatory=$true)][string]$Domain,
  [string]$ServiceName = $null,
  [string]$HealthPath = "/api/health",
  [int]$Retries = 6,
  [int]$IntervalSeconds = 5
)

function Test-Url($url) {
  try {
    $res = Invoke-RestMethod -Uri $url -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] $url ->" -ForegroundColor Green
    $res | ConvertTo-Json -Depth 3 | Write-Host
    return $true
  } catch {
    Write-Host "[ERR] $url -> $($_.Exception.Message)" -ForegroundColor Yellow
    return $false
  }
}

Write-Host "Checking domain: $Domain" -ForegroundColor Cyan

$rootUrl = "https://$Domain/"
$healthUrl = "https://$Domain$HealthPath"

Write-Host "Testing root URL: $rootUrl"
Test-Url $rootUrl

Write-Host "Testing health URL: $healthUrl (up to $Retries attempts, $IntervalSeconds seconds interval)"
$success = $false
for ($i=1; $i -le $Retries; $i++) {
  if (Test-Url $healthUrl) { $success = $true; break }
  Write-Host "Retrying in $IntervalSeconds seconds... (attempt $i of $Retries)" -ForegroundColor DarkGray
  Start-Sleep -Seconds $IntervalSeconds
}

if (-not $success) {
  Write-Host "Health check failed after $Retries attempts." -ForegroundColor Red
} else {
  Write-Host "Health check succeeded." -ForegroundColor Green
}

# Check for Render CLI (optional)
$renderCmd = Get-Command render -ErrorAction SilentlyContinue
if ($null -ne $renderCmd) {
  Write-Host "Render CLI found: $($renderCmd.Path)" -ForegroundColor Cyan
  Write-Host "Note: you must be logged in (run 'render login') for service-specific commands to work." -ForegroundColor Yellow

  Write-Host "Listing services via Render CLI..."
  try {
    & render services list 2>&1 | Write-Host
  } catch {
    Write-Host "Failed to list services via Render CLI: $($_.Exception.Message)" -ForegroundColor Yellow
  }

  if ($ServiceName) {
    Write-Host "Fetching logs for service: $ServiceName" -ForegroundColor Cyan
    try {
      # Attempt to fetch recent logs; exact flags may vary with your CLI version.
      & render services logs $ServiceName 2>&1 | Select-Object -Last 200 | Write-Host
    } catch {
      Write-Host "Failed to fetch logs for $ServiceName via Render CLI: $($_.Exception.Message)" -ForegroundColor Yellow
    }
  } else {
    Write-Host "No ServiceName provided; skipping service-specific logs." -ForegroundColor DarkGray
  }
} else {
  Write-Host "Render CLI not found on this machine. If you want to use it, install it and run 'render login' then re-run this script." -ForegroundColor Yellow
  Write-Host "Render CLI (installation): npm install -g @render/cli  (or use the instructions at https://render.com/docs/cli)" -ForegroundColor DarkGray
}

Write-Host "Done." -ForegroundColor Green
