package dev.paddock.pocket;
import android.net.Uri;
import android.webkit.WebResourceResponse;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.zip.GZIPInputStream;

/** Fixed public telemetry/technical contracts; never an arbitrary URL proxy. */
final class ToolApi {
 static final String ORIGIN="https://api.f1push.com",UUID="(?i)[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}";
 static final Map<String,Entry> manifests=Collections.synchronizedMap(new HashMap<String,Entry>()),parts=Collections.synchronizedMap(new HashMap<String,Entry>());
 static final class Entry {long expires;JSONObject data;Entry(JSONObject d,long ttl){data=d;expires=System.currentTimeMillis()+ttl;}}
 static final class Failure extends Exception {int status;Failure(int s,String m){super(m);status=s;}}
 static String q(Uri uri,String key,String fallback){String v=uri.getQueryParameter(key);return v==null?fallback:v;}
 static JSONObject get(String url,JSONObject capability)throws Exception {
  HttpURLConnection conn=(HttpURLConnection)new URL(url).openConnection();conn.setConnectTimeout(15000);conn.setReadTimeout(20000);conn.setInstanceFollowRedirects(false);conn.setRequestProperty("Accept","application/json");
  if(capability!=null){conn.setRequestProperty("X-F1-Replay-Token",capability.getString("assetToken"));conn.setRequestProperty("X-F1-Replay-Expires",String.valueOf(capability.get("assetTokenExpiresAt")));}
  try{int status=conn.getResponseCode();if(status!=200)throw new Failure(status==404?404:503,status==404?"该场次或时间段尚未发布遥测数据。":"数据源暂时无法读取，请稍后重试。");byte[] bytes;try(InputStream in=conn.getInputStream()){bytes=read(in,12*1024*1024);}if(bytes.length>1&&(bytes[0]&255)==31&&(bytes[1]&255)==139){try(InputStream in=new GZIPInputStream(new ByteArrayInputStream(bytes))){bytes=read(in,16*1024*1024);}}return new JSONObject(new String(bytes,StandardCharsets.UTF_8));}finally{conn.disconnect();}
 }
 static byte[] read(InputStream in,int max)throws Exception{ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>max)throw new IOException("Asset too large");out.write(buffer,0,n);}return out.toByteArray();}
 static JSONObject manifest(String session)throws Exception{
  Entry old=manifests.get(session);if(old!=null&&old.expires>System.currentTimeMillis())return old.data;
  JSONObject raw=get(ORIGIN+"/api/v1/sessions/"+session+"/replay/package/manifest?storage=oss",null),data=raw.optJSONObject("data");if(data==null||!session.equals(data.optString("sessionId"))||data.optInt("schemaVersion")!=1||data.optJSONArray("assets")==null)throw new Failure(503,"遥测清单格式暂不支持。");
  synchronized(manifests){if(manifests.size()>15)manifests.clear();manifests.put(session,new Entry(data,120000));}return data;
 }
 static JSONObject load(Uri u)throws Exception{
  String kind=q(u,"kind","");
  if(kind.equals("technical")){String year=q(u,"year","2026"),gp=q(u,"gp","");if(!year.matches("20[0-9]{2}")||(!gp.isEmpty()&&!gp.matches(UUID)))throw new Failure(400,"无效的技术资料参数。");JSONObject data=get(ORIGIN+"/api/v1/fia/dashboard?lang=zh&year="+year+(gp.isEmpty()?"":"&grandPrixId="+gp),null).optJSONObject("data");if(data==null)throw new Failure(503,"技术报告尚未发布。");return data;}
  String session=q(u,"session","");if(!session.matches(UUID)||(!kind.equals("manifest")&&!kind.equals("part")))throw new Failure(400,"无效的遥测参数。");
  JSONObject m=manifest(session);JSONArray assets=m.getJSONArray("assets");
  if(kind.equals("manifest")){JSONObject result=new JSONObject();for(String key:Arrays.asList("sessionId","version","datasetVersion","chunkMinutes","createdAt","sourceType"))result.put(key,m.opt(key));JSONArray paths=new JSONArray();for(int i=0;i<assets.length();i++)paths.put(assets.getJSONObject(i).getString("path"));result.put("paths",paths);return result;}
  String path=q(u,"path","");if(!path.matches("(?:metadata|timeline)\\.json\\.gz")&&!path.matches("(?i)drivers/[a-f0-9-]{36}/[0-9]{5}\\.json\\.gz"))throw new Failure(400,"无效的数据分片。");
  String cacheKey=session+"/"+m.getString("version")+"/"+path;Entry old=parts.get(cacheKey);if(old!=null&&old.expires>System.currentTimeMillis())return old.data;
  JSONObject asset=null;for(int i=0;i<assets.length();i++)if(path.equals(assets.getJSONObject(i).optString("path"))){asset=assets.getJSONObject(i);break;}if(asset==null)throw new Failure(404,"该车手在所选时间段没有遥测记录。");
  URL url=new URL(new URL(ORIGIN),asset.getString("assetUrl"));String expected="/replay-package-assets/oss/"+session+"/"+m.getString("version")+"/"+path;
  if(!url.getProtocol().equals("https")||!url.getHost().equals("api.f1push.com")||url.getPort()!=-1||!url.getPath().equals(expected)||url.getQuery()!=null||url.getRef()!=null)throw new Failure(503,"数据资产路径不匹配。");
  JSONObject value=get(url.toString(),asset);String id=value.optString("sessionId","");JSONObject metadataSession=value.optJSONObject("session");if(!id.isEmpty()&&!id.equals(session)||metadataSession!=null&&!session.equals(metadataSession.optString("id"))||value.has("datasetVersion")&&!value.optString("datasetVersion").equals(m.optString("datasetVersion")))throw new Failure(503,"数据包版本不一致，请重新载入。");
  if(path.startsWith("drivers/")&&!path.split("/")[1].equals(value.optString("driverId")))throw new Failure(503,"车手数据不匹配。");
  synchronized(parts){if(parts.size()>=20)parts.clear();parts.put(cacheKey,new Entry(value,600000));}return value;
 }
 static WebResourceResponse handle(Uri u){try{return WebDataApi.response(200,new JSONObject().put("data",load(u)).put("updatedAt",Instant.now().toString()));}catch(Failure f){return WebDataApi.error(f.status,f.getMessage());}catch(Exception e){return WebDataApi.error(503,"数据暂时无法读取，请稍后重试。");}}
}
