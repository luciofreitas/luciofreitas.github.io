$root = Get-Location
$exts = @('*.js','*.jsx','*.ts','*.tsx','*.html')
$files = Get-ChildItem -Recurse -Include $exts -File -ErrorAction SilentlyContinue
$missing = New-Object System.Collections.Generic.List[string]

foreach ($f in $files) {
  $lines = Get-Content $f.FullName -ErrorAction SilentlyContinue
  for ($i=0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ($line -match "from\s+['\"]|src\s*=\s*['\"]|href\s*=\s*['\"]") {
      # find first quote character
      $single = $line.IndexOf("'")
      $double = $line.IndexOf('"')
      if ($single -ge 0 -and ($double -eq -1 -or $single -lt $double)) { $q = "'"; $start = $single } elseif ($double -ge 0) { $q = '"'; $start = $double } else { continue }
      $end = $line.IndexOf($q, $start + 1)
      if ($end -gt $start) {
        $p = $line.Substring($start + 1, $end - $start - 1)
        if ($p.StartsWith('.') -or $p.StartsWith('/')) {
          if ($p.StartsWith('/')) {
            $resolved = Join-Path $root ($p.TrimStart('/'))
          } else {
            $candidate = Join-Path $f.DirectoryName $p
            try { $resolved = (Resolve-Path $candidate -ErrorAction Stop).Path } catch { $resolved = $null }
          }
          if (-not $resolved -or -not (Test-Path $resolved)) {
            $missing.Add("$($f.FullName):$($i+1) -> $p")
          }
        }
      }
    }
  }
}

if ($missing.Count -eq 0) {
  Write-Output "No missing relative imports found."
} else {
  $missing | Sort-Object | Select-Object -Unique | ForEach-Object { Write-Output $_ }
  $missing | Out-File -FilePath .\missing_references.txt -Encoding utf8
  Write-Output "Saved list to missing_references.txt"
}
