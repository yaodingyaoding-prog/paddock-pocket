package dev.paddock.pocket;
import android.app.*;
import android.app.job.*;
import android.appwidget.*;
import android.content.*;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;
import org.json.*;
import java.text.SimpleDateFormat;
import java.util.*;

public class RaceWidget extends AppWidgetProvider {
    static final String REFRESH="dev.paddock.pocket.REFRESH";
    private static final java.util.concurrent.atomic.AtomicBoolean foregroundRefresh=new java.util.concurrent.atomic.AtomicBoolean(false);
    /** A reachable API must still refresh when Android has not validated its network. */
    static void refreshInApp(Context context){
        Context app=context.getApplicationContext();JSONObject saved=DataRepository.load(app);
        if("live".equals(saved.optString("source"))&&saved.has("weather")&&System.currentTimeMillis()-DataRepository.millis(saved.optString("fetchedAt"))<300000){render(app,saved);return;}
        if(!foregroundRefresh.compareAndSet(false,true))return;
        new Thread(()->{try{render(app,DataRepository.refresh(app));}catch(Exception e){if((app.getApplicationInfo().flags&android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0)android.util.Log.w("PaddockWidget",e.getClass().getSimpleName()+": "+e.getMessage());}finally{foregroundRefresh.set(false);}},"paddock-widget-foreground").start();
    }
    @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){render(c,DataRepository.load(c));schedule(c);}
    @Override public void onReceive(Context c,Intent intent){super.onReceive(c,intent);if(REFRESH.equals(intent.getAction()))schedule(c);}
    static void schedule(Context c){JobScheduler j=(JobScheduler)c.getSystemService(Context.JOB_SCHEDULER_SERVICE);if(j!=null)j.schedule(new JobInfo.Builder(2026,new ComponentName(c,RefreshJob.class)).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setMinimumLatency(0).build());}
    static void render(Context c,JSONObject data){
        AppWidgetManager manager=AppWidgetManager.getInstance(c);int[] ids=manager.getAppWidgetIds(new ComponentName(c,RaceWidget.class));
        JSONObject race=DataRepository.next(data), session=DataRepository.nextSession(race);
        JSONArray drivers=DataRepository.standings(data.optJSONObject("drivers"));String favorite=DataRepository.favorite(c),driver="在 App 中关注你的车手";
        String favorites=c.getSharedPreferences("paddock",0).getString("favorites",favorite);
        StringBuilder summary=new StringBuilder();
        for(String followed:favorites.split(",")){for(int i=0;i<drivers.length();i++){JSONObject d=drivers.optJSONObject(i);if(d!=null&&d.optString("driverId").equals(followed)){if(summary.length()>0)summary.append("\n");summary.append(d.optString("driverName")).append(" P").append(d.optString("position")).append(" · ").append(d.optString("points")).append("分");break;}}}
        if(summary.length()>0)driver=summary.toString();
        for(int id:ids){RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.race_widget);
            v.setTextViewText(R.id.widget_title,race.optString("name","暂无赛事数据"));v.setTextViewText(R.id.widget_session,DataRepository.sessionName(session));
            v.setViewVisibility(R.id.widget_countdown,session==null?View.GONE:View.VISIBLE);
            if(session!=null){long remaining=Math.max(0,DataRepository.millis(session.optString("startDate"))-System.currentTimeMillis());v.setChronometerCountDown(R.id.widget_countdown,true);v.setChronometer(R.id.widget_countdown,SystemClock.elapsedRealtime()+remaining,"剩余 %s",true);}
            v.setTextViewText(R.id.widget_weather,DataRepository.weatherLabel(data));v.setTextViewText(R.id.widget_driver,driver);
            long at=DataRepository.millis(data.optString("fetchedAt"));String when=at==0?"未知":new SimpleDateFormat("MM-dd HH:mm",Locale.CHINA).format(new Date(at));
            JSONObject weather=data.optJSONObject("weather"),current=weather==null?null:weather.optJSONObject("current");
            String weatherWhen=current==null?"":new SimpleDateFormat("HH:mm",Locale.CHINA).format(new Date(current.optLong("time")*1000));
            v.setTextViewText(R.id.widget_updated,("live".equals(data.optString("source"))?"获取 ":"快照 ")+when+" · 设备时间"+(weatherWhen.isEmpty()?"":" · 天气 "+weatherWhen));
            v.setOnClickPendingIntent(R.id.widget_root,PendingIntent.getActivity(c,0,new Intent(c,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
            v.setOnClickPendingIntent(R.id.widget_refresh,PendingIntent.getBroadcast(c,1,new Intent(c,RaceWidget.class).setAction(REFRESH),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
            manager.updateAppWidget(id,v);
        }
    }
}
