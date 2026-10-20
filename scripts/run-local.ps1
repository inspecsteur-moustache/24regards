param([ValidateSet('ci', 'dev', 'build', 'check', 'test', 'test:e2e', 'preview')][string]$Task = 'dev')
$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
$localNode = Join-Path $workspace '.tools/node-v24.22.0-win-x64'
if (Test-Path -LiteralPath (Join-Path $localNode 'node.exe')) {
    $env:PATH = $localNode + ';' + $env:PATH
}
$nodeVersion = & node.exe --version
if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v24\.') {
    throw "Node.js 24 est requis. Version trouvee : $nodeVersion. Installez Node.js 24 ou utilisez sa copie locale dans .tools/."
}
Write-Host "Node.js $nodeVersion"
Push-Location -LiteralPath $workspace
try {
    if ($Task -eq 'ci') { & npm.cmd ci } else { & npm.cmd run $Task }
    $taskExitCode = $LASTEXITCODE
} finally { Pop-Location }
exit $taskExitCode
