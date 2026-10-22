import assert from 'node:assert/strict';
import { validateAvatar, AVATAR_MAX_BYTES } from '../lib/auth/avatarValidation';
import { AvatarService } from '../lib/auth/avatarService';
import { AvatarController } from '../lib/auth/AvatarController';
import { AccountError, type AccountIdentity, type AccountRepository } from '../lib/auth/contracts';
import { AccountCookies } from '../lib/auth/cookies';
import { unifiedAuthConfig } from '../lib/auth/config';
import { avatarCrop } from '../lib/avatar-crop';
import { stripAvatarMetadata } from '../lib/avatar-webp';
import { availableTimezones, validTimezone, timezoneOffset, timezoneLabel } from '../lib/timezones';
import { normalizeDriver } from '../lib/drivers/driverService';
import { validRaceImage, announcementMatches, articleMedia, canonicalTeam, rssAnnouncements } from '../lib/race-media';
import { boundedMediaFetch, RaceMediaRepository, RaceMediaService } from '../lib/race-media-service';

// A minimal container fixture exercises structural validation; browser tests use a real encoded image.
function container(width = 256, height = 256) {
  const bytes = new Uint8Array(30), view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode('RIFF')); view.setUint32(4,22,true); bytes.set(new TextEncoder().encode('WEBPVP8 '),8); view.setUint32(16,10,true);
  bytes.set([0,0,0,0x9d,1,0x2a],20); view.setUint16(26,width,true); view.setUint16(28,height,true);
  return bytes;
}
validateAvatar(container(),'image/webp');
for (const [bytes,mime] of [[container(),'image/svg+xml'],[container(255),'image/webp'],[new Uint8Array(AVATAR_MAX_BYTES+1),'image/webp'],[new TextEncoder().encode('<svg onload="alert(1)"/>'),'image/webp']] as const) assert.throws(()=>validateAvatar(bytes,mime),AccountError);
const truncated=container().slice(0,25); assert.throws(()=>validateAvatar(truncated,'image/webp'),AccountError);
const metadata=container();metadata.set(new TextEncoder().encode('EXIF'),12);assert.throws(()=>validateAvatar(metadata,'image/webp'),AccountError);
// Chromium's real Canvas WebP uses VP8X with an ICC profile (flag 0x20).
const withProfile = new Uint8Array(58), profileView = new DataView(withProfile.buffer);
withProfile.set(container().subarray(0,12)); profileView.setUint32(4,50,true);
withProfile.set(new TextEncoder().encode('VP8X'),12); profileView.setUint32(16,10,true); withProfile[20]=0x20; withProfile[24]=255; withProfile[27]=255;
withProfile.set(new TextEncoder().encode('ICCP'),30); profileView.setUint32(34,2,true); withProfile.set([1,2],38);
withProfile.set(container().subarray(12),40);
assert.throws(()=>validateAvatar(withProfile,'image/webp'),AccountError);
const stripped = stripAvatarMetadata(withProfile); validateAvatar(stripped,'image/webp'); assert.equal(stripped[20],0); assert.equal(stripped.length,48);
assert.throws(()=>stripAvatarMetadata(withProfile.slice(0,42)));
assert.deepEqual(avatarCrop(1000,500,1,.5,.5),{side:500,sx:250,sy:0});
assert.deepEqual(avatarCrop(500,1000,2,1,0),{side:250,sx:250,sy:0});
assert.deepEqual(avatarCrop(500,500,99,-2,9),{side:500/3,sx:0,sy:500-500/3});

const origin='https://f1.xiaodinglab.com';
const env={AUTH_MODE:'required',AUTH_BASE_URL:origin,SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture_not_a_real_key',AUTH_SESSION_SECRET:'fixture-session-secret-at-least-32-characters',AUTH_IP_LIMITER:{limit:async()=>({success:true})}};
const config=unifiedAuthConfig(env);
const owner:AccountIdentity={id:'11111111-1111-4111-8111-111111111111',email:'fixture@example.test',name:'Fixture',verified:true};
class Repository implements AccountRepository {
  user:AccountIdentity|null=owner; writes:string[]=[];
  async current(){return this.user;} async login(){return owner;} async register(){} async resend(){} async recover(){} async verify(){return owner;} async updatePassword(){} async logout(){} clearSession(){}
  async uploadAvatar(id:string){this.writes.push(id);return {...owner,avatarUrl:'/api/auth/avatar?v=fixture'};}
  async removeAvatar(id:string){this.writes.push(id);return owner;}
  async downloadAvatar(id:string){this.writes.push(id);return new Blob([container()],{type:'image/webp'});}
}
const repository=new Repository(),service=new AvatarService(repository);
const cookies=new AccountCookies(new Request(origin),config),controller=new AvatarController(config,service,cookies,env);
const upload=(body:BodyInit=container(),headers:Record<string,string>={})=>new Request(origin+'/api/auth/avatar',{method:'POST',headers:{origin,'content-type':'image/webp',...headers},body});
let response=await controller.mutate(upload()); assert.equal(response.status,200); assert.equal(repository.writes[0],owner.id);
assert.equal((await response.json() as any).user.avatarUrl,'/api/auth/avatar?v=fixture');
response=await controller.get();assert.equal(response.status,200);assert.match(response.headers.get('cache-control')||'',/private.*no-store/);assert.equal(response.headers.get('content-type'),'image/webp');
response=await controller.mutate(upload(container(),{origin:'https://untrusted.example'}));assert.equal(response.status,403);
response=await controller.mutate(upload('{}',{'content-type':'application/json'}));assert.equal(response.status,415);
response=await controller.mutate(upload(new Uint8Array(AVATAR_MAX_BYTES+1)));assert.equal(response.status,413);
repository.user=null;response=await controller.get();assert.equal(response.status,401);response=await controller.mutate(upload());assert.equal(response.status,401);
repository.user={...owner,verified:false};assert.equal((await controller.mutate(upload())).status,401);
repository.user=owner;response=await controller.mutate(new Request(origin+'/api/auth/avatar',{method:'DELETE',headers:{origin}}));assert.equal(response.status,200);assert.equal(repository.writes.at(-1),owner.id);
const limited=new AvatarController(config,service,cookies,{...env,AUTH_IP_LIMITER:{limit:async()=>({success:false})}});assert.equal((await limited.mutate(upload())).status,429);
assert.deepEqual(Object.keys((await service.remove()).user).sort(),['email','id','name']);

const zones=availableTimezones('Asia/Tokyo');assert.ok(zones.length>40);assert.ok(zones.includes('America/New_York')&&zones.includes('UTC')&&zones.includes('Australia/Melbourne'));
assert.ok(!validTimezone('untrusted/not-a-timezone'));assert.equal(timezoneLabel('Asia/Shanghai'),'北京时间');
assert.equal(timezoneOffset('America/New_York',new Date('2024-06-01T00:00:00Z')),'UTC-4');
assert.equal(timezoneOffset('America/New_York',new Date('2024-12-01T00:00:00Z')),'UTC-5');
const raw={profile:{items:[{id:owner.id,firstName:'Fixture',lastName:'Driver',birth_date:'1985-01-07',countryName:'测试国籍',teams:[{seasonYear:2026,name:'当前车队',number:'44',standing:{position:1,points:340}},{seasonYear:2020,name:'历史车队',number:'44',standing:{position:1,points:350}}]}]},statistics:{items:[{type:'Wins',value:106},{type:'Titles',value:1},{type:'Poles',value:104},{type:'Results',value:397},{type:'Podiums',value:208}]}};
const archive=normalizeDriver(owner.id,raw,2026);assert.equal(archive.career.wins,106);assert.deepEqual(archive.championshipYears,[2020]);assert.equal(archive.history[0].number,'44');assert.throws(()=>normalizeDriver('different-driver',raw));
const noStats=normalizeDriver(owner.id,{...raw,statistics:{items:[]}},2026);assert.equal(noStats.career.wins,null);assert.deepEqual(noStats.championshipYears,[]);

const image='https://media.formula1.com/image/upload/c_fit%2Cw_3200%2Ch_1800/q_auto/v1740000001/fom-website/2026/car.webp';
assert.ok(validRaceImage(image));for(const value of ['https://evil.example/a.webp','http://media.formula1.com/image/upload/a.webp','https://media.formula1.com/image/fetch/https://evil.example/a.webp','https://media.formula1.com/image/upload/a.svg','https://media.formula1.com/image/upload/%2e%2e/private.webp'])assert.ok(!validRaceImage(value));
assert.equal(canonicalTeam({teamName:'红牛二队'}),'racingbulls');assert.equal(canonicalTeam({teamName:'Unknown Historic Constructor'}),undefined);
assert.ok(announcementMatches('Ferrari special livery for US GP in Austin','United States Grand Prix','ferrari'));
assert.ok(!announcementMatches('Ferrari special livery for British GP','United States Grand Prix','ferrari'));
assert.ok(!announcementMatches('McLaren special livery for US GP','United States Grand Prix','ferrari'));
assert.deepEqual(articleMedia(`<meta content="${image}" property="og:image"><script type="application/ld+json">{"datePublished":"2026-10-21T20:43:00Z"}</script>`),{image,publishedAt:'2026-10-21T20:43:00Z'});
const feed='<rss><channel><item><title><![CDATA[Ferrari &amp; HP livery]]></title><description>US GP</description><link>https://www.formula1.com/en/latest/article/fixture</link></item><item><title>bad</title><link>https://evil.example</link></item></channel></rss>';
assert.equal(rssAnnouncements(feed).length,1);assert.equal(rssAnnouncements(feed)[0].title,'Ferrari & HP livery');
class MediaRepository extends RaceMediaRepository {
  async nextRace(){return{id:owner.id,name:'美国大奖赛',nameKey:'United States Grand Prix',startDate:'2026-10-23T17:30:00Z',endDate:'2026-10-25T22:00:00Z',season:{year:2026}};}
  async announcements(){return[{title:'Ferrari special livery for US GP',description:'Austin',url:'https://www.formula1.com/en/latest/article/fixture'}];}
  async article(){return{image,publishedAt:'2026-10-21T20:43:00Z'};}
}
const mediaService=new RaceMediaService(new MediaRepository());
assert.equal((await mediaService.load('22222222-2222-4222-8222-222222222222',2026,'ferrari','HAM')).items.length,0);
assert.equal((await mediaService.load(owner.id,2025,'ferrari','HAM')).items.length,0);
const result=await mediaService.load(owner.id,2026,'ferrari','HAM');assert.equal(result.items.length,1);assert.equal(result.items[0].verifiedDriver,undefined);
await assert.rejects(()=>mediaService.image('https://evil.example/avatar.webp'));
await assert.rejects(()=>boundedMediaFetch(image,100,async (_url,init)=>{assert.equal(init?.redirect,'manual'); return new Response(null,{status:302,headers:{location:'https://evil.example/a.webp'}});}),/MEDIA_UNAVAILABLE/);
console.log('Personal features passed: private avatar ownership, image bounds and type checks, crop geometry, searchable IANA timezones and DST, career identity and completed titles, race/season/team media matching and safe image origins.');
