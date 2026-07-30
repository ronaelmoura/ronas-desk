$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendDirectory = Join-Path $projectRoot 'backend'

function ConvertTo-PlainText {
  param(
    [Security.SecureString]$SecureValue
  )

  $pointer = [IntPtr]::Zero

  try {
    $pointer =
      [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)

    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    if ($pointer -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
  }
}

$databaseHost = Read-Host 'Host do MySQL no Aiven'
$databasePort = Read-Host 'Porta do MySQL no Aiven'
$databaseName = Read-Host 'Nome do banco [defaultdb]'
$databaseUser = Read-Host 'Usuário do MySQL no Aiven'
$secureDatabasePassword = Read-Host 'Senha do MySQL no Aiven' -AsSecureString

if ([string]::IsNullOrWhiteSpace($databaseName)) {
  $databaseName = 'defaultdb'
}

if (
  [string]::IsNullOrWhiteSpace($databaseHost) -or
  [string]::IsNullOrWhiteSpace($databaseUser) -or
  $databasePort -notmatch '^\d{1,5}$' -or
  [int]$databasePort -lt 1 -or
  [int]$databasePort -gt 65535 -or
  $secureDatabasePassword.Length -eq 0
) {
  exit 10
}

$adminName = Read-Host 'Nome do administrador'
$adminEmail = Read-Host 'Email do administrador'

if ([string]::IsNullOrWhiteSpace($adminName) -or $adminName.Length -gt 120) {
  exit 11
}

if (
  $adminEmail.Length -gt 160 -or
  $adminEmail -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$'
) {
  exit 12
}

$plainAdminPassword = $null

while ($null -eq $plainAdminPassword) {
  Write-Host 'A senha será mascarada durante a digitação.'
  $secureAdminPassword = Read-Host 'Senha do administrador' -AsSecureString
  $secureAdminPasswordConfirmation =
    Read-Host 'Confirme a senha do administrador' -AsSecureString

  if (
    $secureAdminPassword.Length -lt 8 -or
    $secureAdminPassword.Length -gt 200
  ) {
    Write-Host 'A senha deve ter entre 8 e 200 caracteres. Tente novamente.' `
      -ForegroundColor Yellow
    continue
  }

  $passwordCandidate = ConvertTo-PlainText $secureAdminPassword
  $passwordConfirmation =
    ConvertTo-PlainText $secureAdminPasswordConfirmation

  if ($passwordCandidate -cne $passwordConfirmation) {
    Write-Host 'As senhas não coincidem. Tente novamente.' `
      -ForegroundColor Yellow
    $passwordCandidate = $null
    $passwordConfirmation = $null
    continue
  }

  $plainAdminPassword = $passwordCandidate
  $passwordCandidate = $null
  $passwordConfirmation = $null
}

$plainDatabasePassword = ConvertTo-PlainText $secureDatabasePassword
$previousLocation = Get-Location
$scriptExitCode = 0

try {
  $env:DB_HOST = $databaseHost
  $env:DB_PORT = $databasePort
  $env:DB_NAME = $databaseName
  $env:DB_USER = $databaseUser
  $env:DB_PASSWORD = $plainDatabasePassword
  $env:DB_SSL = 'true'
  $env:ADMIN_NOME = $adminName
  $env:ADMIN_EMAIL = $adminEmail
  $env:ADMIN_SENHA = $plainAdminPassword
  $env:ADMIN_CARGO = 'Administrador'

  Set-Location $backendDirectory
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'

  try {
    $commandOutput = npm.cmd run create-admin 2>&1 | Out-String
    $commandExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($commandExitCode -ne 0) {
    if ($commandOutput -match 'existe um usuário') {
      $scriptExitCode = 13
    } elseif ($commandOutput -match 'Access denied') {
      $scriptExitCode = 14
    } else {
      $scriptExitCode = 20
    }
  } else {
    Write-Host 'Administrador de demonstração criado com sucesso.' `
      -ForegroundColor Green
  }
} finally {
  Set-Location $previousLocation
  Remove-Item Env:DB_HOST -ErrorAction SilentlyContinue
  Remove-Item Env:DB_PORT -ErrorAction SilentlyContinue
  Remove-Item Env:DB_NAME -ErrorAction SilentlyContinue
  Remove-Item Env:DB_USER -ErrorAction SilentlyContinue
  Remove-Item Env:DB_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:DB_SSL -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_NOME -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_EMAIL -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_SENHA -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_CARGO -ErrorAction SilentlyContinue
  $plainDatabasePassword = $null
  $plainAdminPassword = $null
}

exit $scriptExitCode
