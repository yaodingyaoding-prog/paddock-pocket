package dev.paddock.pocket;

import android.content.Context;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

/** Personal prototype: fixed public endpoints; no credentials, location or arbitrary proxy. */
final class DataRepository {
    static final String BASE="https://api.f1push.com/api/v1";
    static final String SNAPSHOT_TIME="2026-10-20T09:10:45Z";
    static JSONObject load(Context c) {
        try { String saved=c.getSharedPreferences("paddock",0).getString("data",null); if(saved!=null)return new JSONObject(saved); } catch(Exception ignored) { }
        JSONObject root=new JSONObject();
        try {
            root.put("next",envelope(asset(c,"next.json")));
            root.put("drivers",envelope(asset(c,"drivers.json")));
            root.put("races",envelope(asset(c,"races.json")));
            root.put("source","snapshot").put("fetchedAt",SNAPSHOT_TIME);
        } catch(Exception ignored) { }
        return root;
    }
    static synchronized JSONObject refresh(Context c) throws Exception {
        JSONObject old=load(c), root=new JSONObject();
        JSONObject next=envelope(get(BASE+"/nextgrands-prix?lang=zh"));
        JSONObject season=next.optJSONObject("season");
        String id=season==null?"":season.optString("id","");
        if(!id.matches("[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}"))throw new IOException("Missing season");
        JSONObject drivers=envelope(get(BASE+"/seasons/"+id+"/drivers-standings?page=1&pageSize=100&isLastStanding=true&lang=zh"));
        JSONObject races=envelope(get(BASE+"/grands-prix?season_id="+id+"&page=1&pageSize=100&lang=zh"));
        if(next.optJSONArray("schedule")==null||standings(drivers).length()==0)throw new IOException("Incomplete data");
        root.put("next",next).put("drivers",drivers).put("races",races).put("source","live").put("fetchedAt",Instant.now().toString());
        JSONObject circuit=next.optJSONObject("circuit");
        if(circuit!=null) {
            JSONObject extras=asset(c,"circuits.json"), loc=extras.optJSONObject(circuit.optString("id"));
            JSONObject oldNext=old.optJSONObject("next"), oldCircuit=oldNext==null?null:oldNext.optJSONObject("circuit");
            if(oldCircuit!=null&&oldCircuit.optString("id").equals(circuit.optString("id"))&&old.has("weather"))root.put("weather",old.get("weather"));
            if(loc!=null)try {
                double lat=loc.getDouble("latitude"),lon=loc.getDouble("longitude");
                if(Double.isFinite(lat)&&Double.isFinite(lon)) {
                    JSONObject weather=get("https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+"&current=temperature_2m,wind_speed_10m,weather_code&timeformat=unixtime&timezone=UTC");
                    if(weather.optJSONObject("current")!=null)root.put("weather",weather);
                }
            } catch(Exception ignored) { /* Weather is independently timestamped; never replace it with invented data. */ }
        }
        c.getSharedPreferences("paddock",0).edit().putString("data",root.toString()).apply();
        return root;
    }
    static JSONObject envelope(JSONObject json) throws Exception {
        int code=json.optInt("code",200);
        JSONObject data=json.optJSONObject("data");
        if((code!=0&&code!=200)||data==null)throw new IOException("Upstream unavailable");return data;
    }
    static JSONObject get(String url) throws Exception {
        HttpURLConnection conn=(HttpURLConnection)new URL(url).openConnection();
        conn.setConnectTimeout(8000);conn.setReadTimeout(8000);conn.setRequestProperty("Accept","application/json");
        conn.setInstanceFollowRedirects(false);
        try { if(conn.getResponseCode()!=200)throw new IOException("HTTP "+conn.getResponseCode());try(InputStream in=conn.getInputStream()){return new JSONObject(read(in));} } finally {conn.disconnect();}
    }
    static JSONObject asset(Context c,String file) throws Exception {try(InputStream in=c.getAssets().open(file)){return new JSONObject(read(in));}}
    static String read(InputStream in)throws Exception {
        ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[8192];int n;
        while((n=in.read(buffer))!=-1){if(out.size()+n>2*1024*1024)throw new IOException("Payload too large");out.write(buffer,0,n);}
        return new String(out.toByteArray(),StandardCharsets.UTF_8);
    }
    static JSONArray standings(JSONObject data) {JSONArray items=data==null?null:data.optJSONArray("items");JSONObject first=items==null?null:items.optJSONObject(0);JSONArray rows=first==null?null:first.optJSONArray("standings");return rows==null?new JSONArray():rows;}
    static JSONObject next(JSONObject root){JSONObject n=root.optJSONObject("next");return n==null?new JSONObject():n;}
    static long millis(String value){try{return Instant.parse(value).toEpochMilli();}catch(Exception e){return 0;}}
    static JSONObject nextSession(JSONObject race){JSONArray sessions=race.optJSONArray("schedule");JSONObject chosen=null;long earliest=Long.MAX_VALUE;if(sessions!=null)for(int i=0;i<sessions.length();i++){JSONObject s=sessions.optJSONObject(i);if(s==null)continue;long at=millis(s.optString("startDate"));if(at>System.currentTimeMillis()&&at<earliest){chosen=s;earliest=at;}}return chosen;}
    static String sessionName(JSONObject s){if(s==null)return "暂无后续场次";String type=s.optString("type");switch(type){case "FirstPractice":return "第一次自由练习赛";case "SecondPractice":return "第二次自由练习赛";case "ThirdPractice":return "第三次自由练习赛";case "StandardQualifying":return "排位赛";case "SprintQualifying":return "冲刺排位赛";case "SprintRace":return "冲刺赛";case "MainRace":return "正赛";default:return s.optString("sessionName","比赛");}}
    static String weatherLabel(JSONObject root){JSONObject w=root.optJSONObject("weather"),current=w==null?null:w.optJSONObject("current");if(current==null)return "赛道天气暂缺 · 进入 App 刷新";double t=current.optDouble("temperature_2m",Double.NaN),wind=current.optDouble("wind_speed_10m",Double.NaN);if(!Double.isFinite(t)||!Double.isFinite(wind))return "天气数据不完整";long at=current.optLong("time")*1000;String stamp=new java.text.SimpleDateFormat("MM-dd HH:mm",java.util.Locale.CHINA).format(new java.util.Date(at));return Math.round(t)+"°C · 风 "+Math.round(wind)+" km/h · "+stamp+(System.currentTimeMillis()-at>7200000?"（较旧）":"")+" · Open-Meteo";}
    static String favorite(Context c){return c.getSharedPreferences("paddock",0).getString("favorite","");}
}
