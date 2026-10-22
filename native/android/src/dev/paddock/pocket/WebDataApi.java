package dev.paddock.pocket;
import android.content.Context;
import android.net.Uri;
import android.webkit.WebResourceResponse;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/** Same six resource contracts as the existing website's /api/data route. */
final class WebDataApi {
 static final String SEASON="3589dd46-e3ab-9929-435d-93b14f52cf6e";
 private static final String UUID="(?i)[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}";
 private static final Map<String,Entry> cache=Collections.synchronizedMap(new LinkedHashMap<String,Entry>());
 private static final class Entry {final long at;final JSONObject json;Entry(JSONObject j){at=System.currentTimeMillis();json=j;}}
 static String q(Uri u,String name,String fallback){String v=u.getQueryParameter(name);return v==null?fallback:v;}
 static WebResourceResponse handle(Context c,Uri u){
  String resource=q(u,"resource","next"),season=q(u,"season",SEASON),session=q(u,"session",""),gp=q(u,"gp",""),kind=q(u,"kind","races");
  if(!season.matches(UUID)||(!session.isEmpty()&&!session.matches(UUID))||(!gp.isEmpty()&&!gp.matches(UUID)))return error(400,"无效的赛事编号");
  String route,file=null;
  switch(resource){
   case "seasons":route="/seasons?page=1&pageSize=100&lang=zh";file="seasons.json";break;
   case "next":route="/nextgrands-prix?lang=zh";file="next.json";break;
   case "races":route="/grands-prix?season_id="+season+"&page=1&pageSize=100&lang=zh";file="races.json";break;
   case "drivers":route="/seasons/"+season+"/drivers-standings?page=1&pageSize=100&isLastStanding=true&lang=zh";file="drivers.json";break;
   case "teams":route="/seasons/"+season+"/constructors-standings?page=1&pageSize=100&isLastStanding=true&lang=zh";file="teams.json";break;
   case "results":if(session.isEmpty()||gp.isEmpty()||!Arrays.asList("races","practices","qualifying").contains(kind))return error(400,"无效的场次");route="/grands-prix/"+gp+"/"+kind+"/"+session+"/results?lang=zh";break;
   default:return error(400,"暂不支持这类数据");
  }
  Entry old=cache.get(route);if(old!=null&&System.currentTimeMillis()-old.at<300000)return response(200,old.json);
  try {
   JSONObject raw=DataRepository.get(DataRepository.BASE+route);
   Object data=raw.opt("data");int code=raw.optInt("code",200);
   if((code!=0&&code!=200)||data==null||data==JSONObject.NULL)throw new IOException("Upstream unavailable");
   JSONObject result=new JSONObject().put("data",data).put("source","live").put("updatedAt",Instant.now().toString());
   synchronized(cache){if(cache.size()>32)cache.clear();cache.put(route,new Entry(result));}
   return response(200,result);
  }catch(Exception e){
   if((c.getApplicationInfo().flags&android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0)android.util.Log.w("PaddockData",resource+": "+e.getClass().getSimpleName()+": "+e.getMessage());
   if(file!=null&&(season.equals(SEASON)||resource.equals("seasons")||resource.equals("next")))try{
    JSONObject result=new JSONObject().put("data",DataRepository.asset(c,file).get("data")).put("source","snapshot").put("updatedAt",DataRepository.SNAPSHOT_TIME);
    return response(200,result);
   }catch(Exception ignored){}
   return error(503,"暂时无法获取数据，请稍后重试");
  }
 }
 static WebResourceResponse error(int status,String message){JSONObject value=new JSONObject();try{value.put("error",message);}catch(Exception ignored){}return response(status,value);}
 static WebResourceResponse response(int status,JSONObject data){Map<String,String> headers=new HashMap<>();headers.put("Cache-Control","no-store");return new WebResourceResponse("application/json","UTF-8",status,status==200?"OK":"Unavailable",headers,new ByteArrayInputStream(data.toString().getBytes(StandardCharsets.UTF_8)));}
}
