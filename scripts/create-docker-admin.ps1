$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot '.env.docker'

if (-not (Test-Path -LiteralPath $envFile)) {
  throw 'Arquivo .env.docker não encontrado na raiz do projeto.'
}

$adminName = Read-Host 'Nome do administrador'
$adminEmail = Read-Host 'Email do administrador'

if ([string]::IsNullOrWhiteSpace($adminName) -or $adminName.Length -gt 120) {
  exit 10
}

if (
  $adminEmail.Length -gt 160 -or
  $adminEmail -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$'
) {
  exit 11
}

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

$plainPassword = $null

while ($null -eq $plainPassword) {
  Write-Host 'A senha será mascarada durante a digitação.'
  $securePassword = Read-Host 'Senha do administrador' -AsSecureString
  $securePasswordConfirmation =
    Read-Host 'Confirme a senha do administrador' -AsSecureString

  if ($securePassword.Length -lt 8 -or $securePassword.Length -gt 200) {
    Write-Host 'A senha deve ter entre 8 e 200 caracteres. Tente novamente.' `
      -ForegroundColor Yellow
    continue
  }

  $passwordCandidate = ConvertTo-PlainText $securePassword
  $passwordConfirmation =
    ConvertTo-PlainText $securePasswordConfirmation

  if ($passwordCandidate -cne $passwordConfirmation) {
    Write-Host 'As senhas não coincidem. Tente novamente.' `
      -ForegroundColor Yellow
    $passwordCandidate = $null
    $passwordConfirmation = $null
    continue
  }

  $plainPassword = $passwordCandidate
  $passwordCandidate = $null
  $passwordConfirmation = $null
}

$previousLocation = Get-Location
$scriptExitCode = 0

try {
  $env:ADMIN_NOME = $adminName
  $env:ADMIN_EMAIL = $adminEmail
  $env:ADMIN_SENHA = $plainPassword
  $env:ADMIN_CARGO = 'Administrador'

  Set-Location $projectRoot
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'

  try {
    $dockerOutput =
      docker compose --env-file $envFile exec -T `
        -e ADMIN_NOME `
        -e ADMIN_EMAIL `
        -e ADMIN_SENHA `
        -e ADMIN_CARGO `
        backend npm run create-admin 2>&1 |
        Out-String
    $dockerExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  if ($dockerExitCode -ne 0) {
    if ($dockerOutput -match 'Já existe um usuário') {
      $scriptExitCode = 13
    } elseif ($dockerOutput -match 'Access denied') {
      $scriptExitCode = 14
    } else {
      $scriptExitCode = 20
    }
  } else {
    Write-Host 'Administrador criado com sucesso.' -ForegroundColor Green
  }
} finally {
  Set-Location $previousLocation
  Remove-Item Env:ADMIN_NOME -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_EMAIL -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_SENHA -ErrorAction SilentlyContinue
  Remove-Item Env:ADMIN_CARGO -ErrorAction SilentlyContinue
  $plainPassword = $null
}

exit $scriptExitCode
