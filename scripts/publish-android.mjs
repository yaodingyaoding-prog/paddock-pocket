import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const reportPath=process.argv[2];if(!reportPath)throw Error('Usage: node scripts/publish-android.mjs /absolute/path/to/APK_WEB_BUILD_REPORT.json');
const report=JSON.parse(fs.readFileSync(reportPath,'utf8').replace(/^\uFEFF/,''));
const manifest=fs.readFileSync(path.join(root,'native/android/AndroidManifest.xml'),'utf8');
const version=manifest.match(/android:versionName="([^"]+)"/)?.[1],versionCode=Number(manifest.match(/android:versionCode="(\d+)"/)?.[1]);
const pkg=manifest.match(/package="([^"]+)"/)?.[1];
if(report.debuggable!==false||report.version!==version||report.versionCode!==versionCode||report.package!==pkg)throw Error('APK report does not match the non-debug source release');
if(!['preview','custom'].includes(report.signingChannel)||!/^[a-f0-9]{64}$/i.test(report.certificateSha256||''))throw Error('Signing verification metadata missing');
const bytes=fs.readFileSync(report.apk),sha256=createHash('sha256').update(bytes).digest('hex');
if(sha256!==report.sha256.toLowerCase()||bytes.length!==report.size||bytes.readUInt32LE(0)!==0x04034b50)throw Error('APK bytes do not match the verified build report');
const download='/downloads/Paddock-Pocket-'+version+'.apk';
if(report.download!==download)throw Error('Invalid release download path');
const viewingRelease=JSON.parse(fs.readFileSync(path.join(root,'public/user-scripts/release.json'),'utf8'));
const viewingFile=viewingRelease.files.find(item=>item.path==='smg_fivestar.android.user.js');
if(report.viewingScriptVersion!==viewingRelease.version||report.viewingScriptSha256!==viewingFile?.sha256)throw Error('APK viewing script release mismatch');
fs.copyFileSync(report.apk,path.join(root,'public',download));
// Retain a maintainer's device result only for the exact same signed APK.
let previous;try{previous=JSON.parse(fs.readFileSync(path.join(root,'public/downloads/android-build.json'),'utf8'));}catch{}
const deviceValidation=previous?.version===version&&previous?.sha256===sha256&&previous?.certificateSha256===report.certificateSha256&&previous?.deviceValidation?.status==='passed'&&previous.deviceValidation.artifactSha256===sha256?previous.deviceValidation:undefined;
const metadata={version,versionCode,package:pkg,channel:report.signingChannel==='preview'?'preview':'release',download,bytes:bytes.length,sha256,certificateSha256:report.certificateSha256,minSdk:report.minSdk,targetSdk:report.targetSdk,webOrigin:report.webOrigin,builtAtUtc:report.builtAtUtc,updateMode:'Web content follows production; native updates require user-confirmed APK installation',validation:'Java compilation, APK signature and ZIP alignment passed'+(deviceValidation?'; real-device validation confirmed by maintainer':''),...(deviceValidation?{deviceValidation}:{})};
metadata.viewingScriptVersion=report.viewingScriptVersion;
metadata.viewingScriptSha256=report.viewingScriptSha256;
fs.writeFileSync(path.join(root,'public/downloads/android-build.json'),JSON.stringify(metadata,null,2)+'\n');
console.log(JSON.stringify({download,version,versionCode,bytes:bytes.length,sha256,channel:metadata.channel}));
