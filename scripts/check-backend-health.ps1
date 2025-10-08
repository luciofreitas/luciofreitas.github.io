Param(
    [string]$BaseUrl = 'https://luciofreitas-github-io.onrender.com',
    [int]$TimeoutSec = 15
)

function Invoke-JsonGet($url){
    try{
        $resp = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec $TimeoutSec -ErrorAction Stop
        return @{ ok = $true; body = $resp }
    } catch {
        return @{ ok = $false; error = $_.Exception.Message; raw = $_.Exception.Response -as [System.Net.HttpWebResponse] }
    }
}

Write-Output "Backend health check for: $BaseUrl"

$checks = @(
    '/api/debug/check-guia-db',
    '/api/guias',
    '/api/users'
)

$results = @{}
foreach($path in $checks){
    $url = ($BaseUrl.TrimEnd('/') + $path)
    Write-Output "Checking: $url"
    $r = Invoke-JsonGet $url
    if($r.ok){
        Write-Output "  -> HTTP OK. Parsing response..."
        $results[$path] = @{ ok = $true; body = $r.body }
    } else {
        Write-Output "  -> Request failed: $($r.error)"
        $results[$path] = @{ ok = $false; error = $r.error }
    }
}

Write-Output "\nSummary:";

if($results['/api/debug/check-guia-db']){
    $d = $results['/api/debug/check-guia-db']
    if($d.ok){
        $body = $d.body
        $pgClient = $false
        if($null -ne $body.pgClient){ $pgClient = $body.pgClient }
        Write-Output ("  - /api/debug/check-guia-db: reachable. pgClient=" + $pgClient)
        if($pgClient -and $null -ne $body.count){ Write-Output ("    count=" + $body.count) }
        if($pgClient -and $null -ne $body.sample){ Write-Output ("    sampleRows=" + ($body.sample | Measure-Object).Count) }
    } else {
        Write-Output "  - /api/debug/check-guia-db: failed -> $($d.error)"
    }
} else { Write-Output "  - /api/debug/check-guia-db: not checked." }

foreach($p in @('/api/guias','/api/users')){
    $r = $results[$p]
    if($null -eq $r){ Write-Output ("  - ${p}: not checked."); continue }
    if($r.ok){
        # try to count items
        $count = 0
        try{ $count = ($r.body | Measure-Object).Count } catch { $count = 0 }
        Write-Output ("  - ${p}: reachable. itemsCount=" + $count)
    } else {
        Write-Output ("  - ${p}: failed -> " + $r.error)
    }
}

Write-Output "\nRecommendations based on the checks above:";
if($results['/api/debug/check-guia-db'] -and $results['/api/debug/check-guia-db'].ok){
    $pg = $results['/api/debug/check-guia-db'].body.pgClient
    if($pg){
        Write-Output "  - Backend connected to Postgres (pgClient=true). No immediate Render/DB env change required; verify migrations were applied if counts are zero.";
    } else {
        Write-Output "  - Backend not connected to Postgres (pgClient=false). Check Render env vars: DATABASE_URL or PG* vars and PGSSL/PGSSLMODE. Consider setting SUPABASE_URL+SUPABASE_SERVICE_ROLE_KEY as fallback.";
    }
} else {
    Write-Output "  - Could not query debug endpoint. Ensure the backend is reachable and that the endpoint /api/debug/check-guia-db exists and is not blocked by CORS or auth.";
}

Write-Output "\nIf you want me to fetch the Render platform logs directly, provide a Render API key and the Service ID (or allow me to run the Render CLI in this environment). Otherwise, run this script locally or on your machine to get the same checks.";

Write-Output "\nDone."
