$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
New-Item -ItemType Directory -Force runtime-bundle | Out-Null
# PHP from Chocolatey installed on GitHub Windows runner, not on the end user's PC.
choco install php -y --no-progress
$phpExe = Get-ChildItem 'C:/tools' -Filter php.exe -Recurse -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.DirectoryName 'ext') } | Select-Object -First 1
if (!$phpExe) { throw 'Could not find a complete PHP installation under C:/tools' }
$phpDir = $phpExe.DirectoryName
New-Item -ItemType Directory -Force runtime-bundle/php | Out-Null
Copy-Item "$phpDir/*" runtime-bundle/php -Recurse -Force
$ini = Join-Path (Resolve-Path runtime-bundle/php) 'php.ini'
@'
[PHP]
extension_dir="ext"
extension=php_sqlite3.dll
extension=php_pdo_sqlite.dll
extension=php_mysqli.dll
extension=php_curl.dll
extension=php_mbstring.dll
extension=php_openssl.dll
extension=php_fileinfo.dll
extension=php_gd.dll
extension=php_zip.dll
date.timezone=UTC
max_execution_time=90
memory_limit=256M
upload_max_filesize=40M
post_max_size=40M
'@ | Set-Content $ini
Invoke-WebRequest https://wordpress.org/latest.zip -OutFile "$env:RUNNER_TEMP/wordpress.zip"
Expand-Archive "$env:RUNNER_TEMP/wordpress.zip" runtime-bundle -Force
Invoke-WebRequest https://downloads.wordpress.org/plugin/sqlite-database-integration.latest-stable.zip -OutFile "$env:RUNNER_TEMP/sqlite.zip"
Expand-Archive "$env:RUNNER_TEMP/sqlite.zip" runtime-bundle -Force
if (!(Test-Path runtime-bundle/sqlite-database-integration/db.copy)) { throw 'SQLite integration db.copy missing; check plugin version' }
if (!(Test-Path runtime-bundle/php/php.exe)) { throw 'PHP executable missing' }
Write-Host 'Bundled WordPress/PHP/SQLite assets prepared.'
