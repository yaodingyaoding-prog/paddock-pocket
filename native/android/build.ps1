param([string]$JavaRoot=$env:JAVA_HOME,[string]$ToolRoot,[switch]$RuntimeDebug)
$ErrorActionPreference='Stop'
$projectRoot=$PSScriptRoot
$workspaceRoot=Split-Path $projectRoot -Parent
if(!$ToolRoot){throw 'Pass -ToolRoot with the existing Android build tools directory'}
$buildRoot=Join-Path $projectRoot ('build\'+[DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))
$releaseRoot=Join-Path $workspaceRoot 'releases'
# The production website is loaded directly; package only widget snapshots and the live helper.
$assetRoot=Join-Path $buildRoot 'assets'
New-Item -ItemType Directory -Force -Path (Join-Path $assetRoot 'web\user-scripts') | Out-Null
Get-ChildItem (Join-Path $projectRoot 'assets') -File | Copy-Item -Destination $assetRoot
Copy-Item (Join-Path $projectRoot 'assets\web\user-scripts\smg_fivestar.android.user.js') (Join-Path $assetRoot 'web\user-scripts')
New-Item -ItemType Directory -Force -Path $buildRoot,$releaseRoot,(Join-Path $buildRoot 'gen'),(Join-Path $buildRoot 'classes'),(Join-Path $buildRoot 'dex') | Out-Null
function Invoke-Checked([string]$Executable,[string[]]$CommandArguments){& $Executable @CommandArguments;if($LASTEXITCODE -ne 0){throw "Build step failed: $([IO.Path]::GetFileName($Executable)) ($LASTEXITCODE)"}}
$aapt=Join-Path $toolRoot 'aapt2.exe'
$androidJar=Join-Path $toolRoot 'android.jar'
$java=Join-Path $JavaRoot 'bin\java.exe'
$javac=Join-Path $JavaRoot 'bin\javac.exe'
$zipalign=Join-Path $toolRoot 'build-tools-36\zipalign.exe'
$signer=Join-Path $toolRoot 'build-tools-36\apksigner.jar'
$r8=Join-Path $toolRoot 'r8-9.5.28.jar'
foreach($required in @($aapt,$androidJar,$java,$javac,$zipalign,$signer,$r8)){if(!(Test-Path -LiteralPath $required)){throw "Missing tool: $required"}}
Invoke-Checked $aapt @('compile','--dir',(Join-Path $projectRoot 'res'),'-o',(Join-Path $buildRoot 'resources.zip'))
$manifestPath=Join-Path $projectRoot 'AndroidManifest.xml'
if($RuntimeDebug){$manifestPath=Join-Path $buildRoot 'AndroidManifest.xml'; (Get-Content (Join-Path $projectRoot 'AndroidManifest.xml') -Raw).Replace('<application ','<application android:debuggable="true" ') | Set-Content -LiteralPath $manifestPath -Encoding utf8}
Invoke-Checked $aapt @('link','-o',(Join-Path $buildRoot 'resources.apk'),'-I',$androidJar,'--manifest',$manifestPath,'--java',(Join-Path $buildRoot 'gen'),'-A',$assetRoot,'--min-sdk-version','26','--target-sdk-version','36',(Join-Path $buildRoot 'resources.zip'))
$sourceFiles=@(Get-ChildItem (Join-Path $projectRoot 'src'),(Join-Path $buildRoot 'gen') -Recurse -Filter '*.java' -File | ForEach-Object {$_.FullName})
Invoke-Checked $javac (@('-encoding','UTF-8','-source','8','-target','8','-classpath',$androidJar,'-d',(Join-Path $buildRoot 'classes'))+$sourceFiles)
Add-Type -AssemblyName System.IO.Compression.FileSystem
[IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $buildRoot 'classes'),(Join-Path $buildRoot 'classes.jar'))
Invoke-Checked $java @('-cp',$r8,'com.android.tools.r8.D8','--release','--min-api','26','--lib',$androidJar,'--output',(Join-Path $buildRoot 'dex'),(Join-Path $buildRoot 'classes.jar'))
# Preserve AAPT2's resource archive; append only compiled DEX entries.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$unsigned=Join-Path $buildRoot 'unsigned.apk'
Copy-Item -LiteralPath (Join-Path $buildRoot 'resources.apk') -Destination $unsigned
$archive=[IO.Compression.ZipFile]::Open($unsigned,[IO.Compression.ZipArchiveMode]::Update)
try {
 # AAPT2 on Windows may retain backslashes in nested asset names. Android's
 # AssetManager uses ZIP forward-slash names even when the build host is Windows.
 foreach($entry in @($archive.Entries | Where-Object {$_.FullName.Contains('\')})){
  $fixed=$archive.CreateEntry($entry.FullName.Replace('\','/'),[IO.Compression.CompressionLevel]::Optimal)
  $input=$entry.Open();$output=$fixed.Open()
  try {$input.CopyTo($output)} finally {$input.Dispose();$output.Dispose()}
  $entry.Delete()
 }
 foreach($dex in Get-ChildItem (Join-Path $buildRoot 'dex') -Filter '*.dex' -File){[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$dex.FullName,$dex.Name,[IO.Compression.CompressionLevel]::Optimal)|Out-Null}
 if(!$archive.GetEntry('assets/web/user-scripts/smg_fivestar.android.user.js')){throw 'Live helper is missing'}
 if(@($archive.Entries | Where-Object {$_.FullName.Contains('\')}).Count){throw 'Invalid ZIP path separator'}
} finally {$archive.Dispose()}
$aligned=Join-Path $buildRoot 'aligned.apk'
Invoke-Checked $zipalign @('-f','-p','4',$unsigned,$aligned)
$keyStore=Join-Path $toolRoot 'paddock-debug.keystore'
if(!(Test-Path -LiteralPath $keyStore)){Invoke-Checked (Join-Path $JavaRoot 'bin\keytool.exe') @('-genkeypair','-keystore',$keyStore,'-storepass','android','-keypass','android','-alias','androiddebugkey','-dname','CN=Android Debug,O=Android,C=US','-keyalg','RSA','-keysize','2048','-validity','10000')}
$apk=Join-Path $releaseRoot $(if($RuntimeDebug){'Paddock-Pocket-0.6.0-debug.apk'}else{'Paddock-Pocket-0.6.0.apk'})
Invoke-Checked $java @('-jar',$signer,'sign','--ks',$keyStore,'--ks-key-alias','androiddebugkey','--ks-pass','pass:android','--key-pass','pass:android','--out',$apk,$aligned)
Invoke-Checked $java @('-jar',$signer,'verify','--verbose','--print-certs',$apk)
Invoke-Checked $zipalign @('-c','4',$apk)
$badging=& $aapt dump badging $apk
if($LASTEXITCODE -ne 0){throw 'APK badging verification failed'}
$badging | Set-Content -LiteralPath (Join-Path $releaseRoot 'APK_BADGING.txt') -Encoding utf8
$report=[ordered]@{apk=$apk;sha256=(Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash;size=(Get-Item -LiteralPath $apk).Length;builtAtUtc=[DateTime]::UtcNow.ToString('o');package='dev.paddock.pocket';version='0.6.0';minSdk=26;targetSdk=36;signature='Same Android test certificate as 0.1; supports update installation';build=$buildRoot;validation='Production URL and scoped native actions; Java compile, signature, ZIP alignment verified. Android device acceptance pending';webOrigin='https://f1.xiaodinglab.com';versionCode=6;download='/downloads/Paddock-Pocket-0.6.0.apk';license='User explicitly authorized Android SDK License Agreement for this project on 2026-10-20';toolsManifest=(Join-Path $toolRoot 'official-sdk-tools-manifest.json')}
$report['debuggable']=[bool]$RuntimeDebug
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $releaseRoot $(if($RuntimeDebug){'APK_WEB_DEBUG_BUILD_REPORT.json'}else{'APK_WEB_BUILD_REPORT.json'})) -Encoding utf8
Write-Output "APK ready: $apk"

