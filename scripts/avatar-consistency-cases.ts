import assert from 'node:assert/strict';
import {SupabaseAccountRepository} from '../lib/auth/SupabaseAccountRepository';
import {AccountCookies} from '../lib/auth/cookies';
import {unifiedAuthConfig} from '../lib/auth/config';
const config=unifiedAuthConfig({SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture',AUTH_SESSION_SECRET:'fixture-secret-at-least-32-characters'});
const cookies=new AccountCookies(new Request('https://f1.xiaodinglab.com/'),config);
const revision='11111111-1111-4111-8111-111111111111';
const repository=new SupabaseAccountRepository(config,cookies,async(input,init)=>{
 const url=new URL(String(input));
 assert(url.pathname.endsWith('/owner/avatar.webp'),'Storage access stays confined to the current owner object');
 const current=url.searchParams.get('cacheNonce')===revision;
 if(current)assert.equal(init?.cache,'no-store');
 return new Response(current?'new-avatar':'old-cached-avatar',{headers:{'content-type':'image/webp'}});
});
const avatar=await repository.downloadAvatar('owner',revision);
assert.equal(await avatar?.text(),'new-avatar','The first post-upload image read must vary the upstream CDN request by the saved revision');
console.log('Avatar consistency: owner-only object, versioned upstream cache key and cache bypass passed.');
