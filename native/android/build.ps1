param(
 [string]$JavaRoot=$env:JAVA_HOME,
 [Parameter(Mandatory=$true)][string]$ToolRoot,
 [string]$OutputDir,
 [string]$KeyStorePath,
 [string]$KeyAlias='androiddebugkey',
 [string]$StorePasswordEnv='PADDOCK_KEYSTORE_PASSWORD',
 [string]$KeyPasswordEnv='PADDOCK_KEY_PASSWORD',
 [switch]$RuntimeDebug
)
$ErrorActionPreference='Stop'
$projectRoot=$PSScriptRoot
$repositoryRoot=[IO.Path]::GetFullPath((Join-Path $projectRoot '..\..'))
[xml]$releaseManifest=Get-Content -LiteralPath (Join-Path $projectRoot 'AndroidManifest.xml') -Raw
$androidNamespace='http://schemas.android.com/apk/res/android'
$versionName=$releaseManifest.manifest.GetAttribute('versionName',$androidNamespace)
$versionCode=[int]$releaseManifest.manifest.GetAttribute('versionCode',$androidNamespace)
$packageName=$releaseManifest.manifest.GetAttribute('package')
$minSdk=[int]$releaseManifest.manifest.'uses-sdk'.GetAttribute('minSdkVersion',$androidNamespace)
$targetSdk=[int]$releaseManifest.manifest.'uses-sdk'.GetAttribute('targetSdkVersion',$androidNamespace)
if($versionName -notmatch '^\d+\.\d+\.\d+$' -or $versionCode -lt 1){throw 'Invalid Android release version'}
if(!$OutputDir){$OutputDir=Join-Path $repositoryRoot '.local-artifacts\android'}
$releaseRoot=[IO.Path]::GetFullPath($OutputDir)
$buildRoot=Join-Path $projectRoot ('build\'+[DateTime]::UtcNow.ToString('yyyyMMddHHmmss'))
$assetRoot=Join-Path $buildRoot 'assets'
New-Item -ItemType Directory -Force -Path $buildRoot,$releaseRoot,(Join-Path $buildRoot 'gen'),(Join-Path $buildRoot 'classes'),(Join-Path $buildRoot 'dex'),(Join-Path $assetRoot 'web\user-scripts') | Out-Null
Get-ChildItem (Join-Path $projectRoot 'assets') -File | Copy-Item -Destination $assetRoot
Copy-Item (Join-Path $projectRoot 'assets\web\user-scripts\smg_fivestar.android.user.js') (Join-Path $assetRoot 'web\user-scripts')
function Invoke-Checked([string]$Executable,[string[]]$CommandArguments){& $Executable @CommandArguments;if($LASTEXITCODE -ne 0){throw "Build step failed: $([IO.Path]::GetFileName($Executable)) ($LASTEXITCODE)"}}
$aapt=Join-Path $ToolRoot 'aapt2.exe'
$androidJar=Join-Path $ToolRoot 'android.jar'
$java=Join-Path $JavaRoot 'bin\java.exe'
$javac=Join-Path $JavaRoot 'bin\javac.exe'
$zipalign=Join-Path $ToolRoot 'build-tools-36\zipalign.exe'
$signer=Join-Path $ToolRoot 'build-tools-36\apksigner.jar'
$r8=Join-Path $ToolRoot 'r8-9.5.28.jar'
foreach($required in @($aapt,$androidJar,$java,$javac,$zipalign,$signer,$r8)){if(!(Test-Path -LiteralPath $required)){throw "Missing tool: $required"}}
Invoke-Checked $aapt @('compile','--dir',(Join-Path $projectRoot 'res'),'-o',(Join-Path $buildRoot 'resources.zip'))
$manifestPath=Join-Path $projectRoot 'AndroidManifest.xml'
if($RuntimeDebug){$manifestPath=Join-Path $buildRoot 'AndroidManifest.xml';(Get-Content (Join-Path $projectRoot 'AndroidManifest.xml') -Raw).Replace('<application ','<application android:debuggable="true" ') | Set-Content -LiteralPath $manifestPath -Encoding utf8}
Invoke-Checked $aapt @('link','-o',(Join-Path $buildRoot 'resources.apk'),'-I',$androidJar,'--manifest',$manifestPath,'--java',(Join-Path $buildRoot 'gen'),'-A',$assetRoot,'--min-sdk-version',[string]$minSdk,'--target-sdk-version',[string]$targetSdk,(Join-Path $buildRoot 'resources.zip'))
$sourceFiles=@(Get-ChildItem (Join-Path $projectRoot 'src'),(Join-Path $buildRoot 'gen') -Recurse -Filter '*.java' -File | ForEach-Object {$_.FullName})
Invoke-Checked $javac (@('-encoding','UTF-8','-source','8','-target','8','-classpath',$androidJar,'-d',(Join-Path $buildRoot 'classes'))+$sourceFiles)
Add-Type -AssemblyName System.IO.Compression.FileSystem
[IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $buildRoot 'classes'),(Join-Path $buildRoot 'classes.jar'))
Invoke-Checked $java @('-cp',$r8,'com.android.tools.r8.D8','--release','--min-api',[string]$minSdk,'--lib',$androidJar,'--output',(Join-Path $buildRoot 'dex'),(Join-Path $buildRoot 'classes.jar'))
$unsigned=Join-Path $buildRoot 'unsigned.apk'
Copy-Item -LiteralPath (Join-Path $buildRoot 'resources.apk') -Destination $unsigned
$archive=[IO.Compression.ZipFile]::Open($unsigned,[IO.Compression.ZipArchiveMode]::Update)
try{
 foreach($entry in @($archive.Entries | Where-Object {$_.FullName.Contains('\')})){
  $fixed=$archive.CreateEntry($entry.FullName.Replace('\','/'),[IO.Compression.CompressionLevel]::Optimal)
  $input=$entry.Open();$output=$fixed.Open()
  try{$input.CopyTo($output)}finally{$input.Dispose();$output.Dispose()}
  $entry.Delete()
 }
 foreach($dex in Get-ChildItem (Join-Path $buildRoot 'dex') -Filter '*.dex' -File){[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$dex.FullName,$dex.Name,[IO.Compression.CompressionLevel]::Optimal)|Out-Null}
 if(!$archive.GetEntry('assets/web/user-scripts/smg_fivestar.android.user.js')){throw 'Viewing helper missing'}
 if(@($archive.Entries | Where-Object {$_.FullName.Contains('\')}).Count){throw 'Invalid APK asset path'}
}finally{$archive.Dispose()}
$aligned=Join-Path $buildRoot 'aligned.apk'
Invoke-Checked $zipalign @('-f','-p','4',$unsigned,$aligned)
$customSigning=!!$KeyStorePath
$keyStore=if($customSigning){[IO.Path]::GetFullPath($KeyStorePath)}else{Join-Path $ToolRoot 'paddock-debug.keystore'}
if($customSigning){
 if(!(Test-Path -LiteralPath $keyStore)){throw 'Signing keystore does not exist'}
 if(![Environment]::GetEnvironmentVariable($StorePasswordEnv)){throw 'Set the named keystore password environment variable first'}
 if(![Environment]::GetEnvironmentVariable($KeyPasswordEnv)){$KeyPasswordEnv=$StorePasswordEnv}
 $passwordArguments=@('--ks-pass',('env:'+$StorePasswordEnv),'--key-pass',('env:'+$KeyPasswordEnv))
}else{
 if(!(Test-Path -LiteralPath $keyStore)){Invoke-Checked (Join-Path $JavaRoot 'bin\keytool.exe') @('-genkeypair','-keystore',$keyStore,'-storepass','android','-keypass','android','-alias','androiddebugkey','-dname','CN=Android Debug,O=Android,C=US','-keyalg','RSA','-keysize','2048','-validity','10000')}
 $passwordArguments=@('--ks-pass','pass:android','--key-pass','pass:android')
}
$apkName='Paddock-Pocket-'+$versionName+$(if($RuntimeDebug){'-debug.apk'}else{'.apk'})
$apk=Join-Path $releaseRoot $apkName
Invoke-Checked $java (@('-jar',$signer,'sign','--ks',$keyStore,'--ks-key-alias',$KeyAlias)+$passwordArguments+@('--out',$apk,$aligned))
$signatureOutput=& $java -jar $signer verify --verbose --print-certs $apk
if($LASTEXITCODE -ne 0){throw 'APK signature verification failed'}
$signatureOutput | ForEach-Object {Write-Output $_}
$certificateMatch=[regex]::Match(($signatureOutput -join [Environment]::NewLine),'Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]{64})')
if(!$certificateMatch.Success){throw 'Signing certificate digest missing'}
$certificateSha256=$certificateMatch.Groups[1].Value.ToLowerInvariant()
Invoke-Checked $zipalign @('-c','4',$apk)
$badging=& $aapt dump badging $apk
if($LASTEXITCODE -ne 0){throw 'APK metadata verification failed'}
$badging | Set-Content -LiteralPath (Join-Path $releaseRoot 'APK_BADGING.txt') -Encoding utf8
$report=[ordered]@{apk=$apk;sha256=(Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash;size=(Get-Item -LiteralPath $apk).Length;builtAtUtc=[DateTime]::UtcNow.ToString('o');package=$packageName;version=$versionName;versionCode=$versionCode;minSdk=$minSdk;targetSdk=$targetSdk;certificateSha256=$certificateSha256;signingChannel=$(if($customSigning){'custom'}else{'preview'});debuggable=[bool]$RuntimeDebug;validation='Java compilation, APK signature and ZIP alignment verified; Android device acceptance pending';webOrigin='https://f1.xiaodinglab.com';download=('/downloads/Paddock-Pocket-'+$versionName+'.apk')}
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $releaseRoot $(if($RuntimeDebug){'APK_WEB_DEBUG_BUILD_REPORT.json'}else{'APK_WEB_BUILD_REPORT.json'})) -Encoding utf8
Write-Output "APK ready: $apk"
