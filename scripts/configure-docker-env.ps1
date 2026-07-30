param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot '.env.docker'

if ((Test-Path -LiteralPath $envFile) -and -not $Force) {
  throw 'O arquivo .env.docker já existe. Use -Force somente para regenerá-lo.'
}

function New-RandomSecret {
  param(
    [int]$Bytes = 48
  )

  $buffer = New-Object byte[] $Bytes
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()

  try {
    $generator.GetBytes($buffer)

    return [Convert]::ToBase64String($buffer).
      TrimEnd('=').
      Replace('+', '-').
      Replace('/', '_')
  } finally {
    $generator.Dispose()
  }
}

$dbPassword = New-RandomSecret
$rootPassword = New-RandomSecret
$jwtSecret = New-RandomSecret -Bytes 64
$utf8WithoutBom = New-Object Text.UTF8Encoding($false)

try {
  $content = @(
    'DB_NAME=ronas_desk'
    'DB_USER=ronas_desk'
    "DB_PASSWORD=$dbPassword"
    "MYSQL_ROOT_PASSWORD=$rootPassword"
    ''
    "JWT_SECRET=$jwtSecret"
    'JWT_EXPIRES_IN=8h'
    'CORS_ORIGIN=http://localhost:5173'
    ''
    'CLOUDINARY_CLOUD_NAME='
    'CLOUDINARY_API_KEY='
    'CLOUDINARY_API_SECRET='
  )

  [IO.File]::WriteAllLines($envFile, $content, $utf8WithoutBom)
  Write-Host 'Configuração Docker criada com segurança.' -ForegroundColor Green
} finally {
  $dbPassword = $null
  $rootPassword = $null
  $jwtSecret = $null
  $content = $null
}
