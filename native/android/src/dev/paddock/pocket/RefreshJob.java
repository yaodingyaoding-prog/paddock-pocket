package dev.paddock.pocket;
import android.app.job.*;
import android.os.Handler;
import android.os.Looper;
public class RefreshJob extends JobService {
    private volatile boolean stopped;
    @Override public boolean onStartJob(JobParameters params){stopped=false;new Thread(()->{boolean failed=false;try{RaceWidget.render(this,DataRepository.refresh(this));}catch(Exception e){failed=true;}final boolean retry=failed;new Handler(Looper.getMainLooper()).post(()->{if(!stopped)jobFinished(params,retry);});},"paddock-refresh").start();return true;}
    @Override public boolean onStopJob(JobParameters params){stopped=true;return true;}
}
