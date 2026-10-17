<#
.SYNOPSIS
  Scaffold a minimal, ready-to-run uni-app project (Vue3 / Vue2) that opens
  directly in HBuilderX and can be released as a native App via cloud packaging.

.DESCRIPTION
  Copies a complete uni-app project from this skill's templates directory:
    App.vue / main.js / manifest.json / pages.json / uni.scss / index.html
    pages/index/index.vue / static/logo.png / .gitignore / README.md
  The project root is the source root, so HBuilderX can open it as-is.

  This script is intentionally pure ASCII so that Windows PowerShell 5.1
  (which decodes BOM-less files as ANSI) parses it correctly.

.PARAMETER Name
  Project name. Also used as the target directory name and default App name.

.PARAMETER Target
  Destination directory. Defaults to .\<Name> under the current directory.

.PARAMETER Vue
  Vue version: "3" (default) or "2".
  Vue3 writes "vueVersion": "3" into manifest.json and uses createSSRApp in main.js.
  Vue2 omits the field and uses new Vue({...App}) in main.js.

.PARAMETER AppId
  DCloud AppID, e.g. __UNI__XXXXXXX. Leave empty and click "re-acquire" in
  HBuilderX before cloud packaging.

.PARAMETER AppName
  App display name. Defaults to Name.

.PARAMETER Force
  Continue even when the target directory is not empty.

.EXAMPLE
  .\create-uniapp.ps1 -Name myapp

.EXAMPLE
  .\create-uniapp.ps1 -Name myapp -Target D:\code\myapp -Vue 3 -AppName MyApp

.EXAMPLE
  .\create-uniapp.ps1 -Name myapp -Vue 2
#>
[CmdletBinding()]
param(
	[Parameter(Mandatory = $true, Position = 0)][string]$Name,
	[string]$Target,
	[ValidateSet('3', '2')][string]$Vue = '3',
	[string]$AppId = '',
	[string]$AppName,
	[switch]$Force
)

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)

$skillRoot = Split-Path -Parent $PSScriptRoot
$template = Join-Path $skillRoot (Join-Path 'templates' "vue$Vue")
if (-not (Test-Path $template)) { throw "Template directory not found: $template" }

if (-not $AppName) { $AppName = $Name }
if (-not $Target) {
	$Target = Join-Path (Get-Location).Path $Name
} elseif (-not [System.IO.Path]::IsPathRooted($Target)) {
	$Target = Join-Path (Get-Location).Path $Target
}
$Target = [System.IO.Path]::GetFullPath($Target)

if (Test-Path $Target) {
	$children = @(Get-ChildItem $Target -Force -ErrorAction SilentlyContinue)
	if ($children.Count -gt 0 -and -not $Force) {
		throw "Target directory exists and is not empty: $Target (pass -Force to write into it)"
	}
} else {
	New-Item -ItemType Directory -Path $Target -Force | Out-Null
}

Copy-Item -Path (Join-Path $template '*') -Destination $Target -Recurse -Force

# manifest.json: replace only the FIRST "name" / "appid", keep UTF-8 without BOM
$manifestPath = Join-Path $Target 'manifest.json'
$content = [System.IO.File]::ReadAllText($manifestPath, $utf8)
$content = ([regex]'"name"\s*:\s*""').Replace($content, '"name" : "' + $AppName + '"', 1)
$content = ([regex]'"appid"\s*:\s*""').Replace($content, '"appid" : "' + $AppId + '"', 1)
[System.IO.File]::WriteAllText($manifestPath, $content, $utf8)

# pages.json: normalize to UTF-8 without BOM too
$pagesPath = Join-Path $Target 'pages.json'
[System.IO.File]::WriteAllText($pagesPath, [System.IO.File]::ReadAllText($pagesPath, $utf8), $utf8)

# README.md for the generated project. The template is a separate UTF-8 file so
# this script stays pure ASCII; it is read with an explicit UTF-8 decoder.
$readmeTemplatePath = Join-Path $skillRoot 'templates\README.project.md'
$readme = [System.IO.File]::ReadAllText($readmeTemplatePath, $utf8)
$readme = $readme.Replace('{{APP_NAME}}', $AppName).Replace('{{VUE}}', $Vue)
[System.IO.File]::WriteAllText((Join-Path $Target 'README.md'), $readme, $utf8)

Write-Host ''
Write-Host 'uni-app project created' -ForegroundColor Green
Write-Host "  Path     : $Target"
Write-Host "  Name     : $Name"
Write-Host "  App name : $AppName"
Write-Host "  Vue      : Vue$Vue"
if ($AppId) {
	Write-Host "  AppID    : $AppId"
} else {
	Write-Host '  AppID    : (empty) click "re-acquire" in HBuilderX before cloud packaging' -ForegroundColor Yellow
}
Write-Host ''
Write-Host 'Next: HBuilderX -> File -> Open Directory -> select the path above' -ForegroundColor Cyan
