package dev.paddock.pocket;
import android.app.*;
import android.appwidget.AppWidgetManager;
import android.content.*;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import org.json.*;

/** Production website, with scoped OS actions and no JavaScript credential bridge. */
public class MainActivity extends Activity {
 static final String SITE="https://f1.xiaodinglab.com",HOST="f1.xiaodinglab.com";
 private WebView web;private FrameLayout root;private ValueCallback<Uri[]> chooser;private long checked;private String exportToken;private byte[] exportBytes;
 boolean trusted(String url){if(url==null)return false;Uri u=Uri.parse(url);return "https".equals(u.getScheme())&&HOST.equals(u.getHost())&&(u.getPort()==-1||u.getPort()==443);}
 @Override public void onCreate(Bundle state){
  super.onCreate(state);getWindow().setStatusBarColor(Color.rgb(13,16,23));getWindow().setNavigationBarColor(Color.rgb(13,16,23));root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(13,16,23));setContentView(root);
  root.setOnApplyWindowInsetsListener((v,i)->{if(Build.VERSION.SDK_INT>=30){android.graphics.Insets s=i.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());v.setPadding(s.left,s.top,s.right,s.bottom);}else v.setPadding(i.getSystemWindowInsetLeft(),i.getSystemWindowInsetTop(),i.getSystemWindowInsetRight(),i.getSystemWindowInsetBottom());return i;});
  web=new WebView(this);root.addView(web,new FrameLayout.LayoutParams(-1,-1));web.setBackgroundColor(Color.rgb(13,16,23));WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setTextZoom(100);s.setMediaPlaybackRequiresUserGesture(true);s.setUserAgentString(s.getUserAgentString()+" PaddockPocket/0.6.0");CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
  if(getPreferences(0).getInt("cacheVersion",0)<6){web.clearCache(true);getPreferences(0).edit().putInt("cacheVersion",6).apply();}
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){if(!request.isForMainFrame())return false;Uri u=request.getUrl();if("paddock".equals(u.getScheme())){if(trusted(view.getUrl())){if("save-file".equals(u.getHost()))saveFile(u);else if(request.hasGesture())action(u.getHost());}return true;}if(trusted(u.toString()))return false;external(u);return true;}
   @Override public void onReceivedError(WebView v,WebResourceRequest r,WebResourceError e){if(r.isForMainFrame())new AlertDialog.Builder(MainActivity.this).setMessage("暂时无法连接围场，请检查网络后重试。").setPositiveButton("重试",(d,w)->web.loadUrl(SITE+"/")).setNegativeButton("稍后",null).show();}
   @Override public void onPageFinished(WebView v,String url){if(trusted(url))checkUpdate(false);}
  });
  web.setWebChromeClient(new WebChromeClient(){@Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> callback,FileChooserParams params){if(!trusted(v.getUrl()))return false;if(chooser!=null)chooser.onReceiveValue(null);chooser=callback;try{startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("image/*"),31);}catch(Exception e){chooser.onReceiveValue(null);chooser=null;}return true;}});
  web.setDownloadListener((url,ua,disposition,mime,length)->{if(trusted(web.getUrl())&&url.startsWith("blob:"+SITE+"/"))exportBlob(url);else external(Uri.parse(url));});if(state==null||web.restoreState(state)==null)web.loadUrl(SITE+"/");RaceWidget.schedule(this);RaceWidget.refreshInApp(this);
  if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,()->back());
 }
 void action(String action){if("smg-live".equals(action))startActivity(new Intent(this,LiveActivity.class));else if("open-tencent".equals(action)){Intent i=getPackageManager().getLaunchIntentForPackage("com.tencent.qqlive");if(i!=null)startActivity(i);else external(Uri.parse("https://v.qq.com/"));}else if("pin-widget".equals(action)){AppWidgetManager m=AppWidgetManager.getInstance(this);if(m.isRequestPinAppWidgetSupported())m.requestPinAppWidget(new ComponentName(this,RaceWidget.class),null,null);else Toast.makeText(this,"长按桌面 → 小组件 → 围场口袋",Toast.LENGTH_LONG).show();}else if("check-updates".equals(action))checkUpdate(true);}
 void external(Uri u){if(u==null||!("https".equals(u.getScheme())||"http".equals(u.getScheme())||"txvideo".equals(u.getScheme())))return;try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){Toast.makeText(this,"请先安装可打开此链接的应用",Toast.LENGTH_LONG).show();}}
 void checkUpdate(boolean manual){if(!manual&&System.currentTimeMillis()-checked<86400000)return;checked=System.currentTimeMillis();new Thread(()->{try{java.net.HttpURLConnection c=(java.net.HttpURLConnection)new java.net.URL(SITE+"/downloads/android-build.json").openConnection();c.setConnectTimeout(10000);c.setReadTimeout(10000);c.setInstanceFollowRedirects(false);JSONObject data;try(java.io.InputStream in=c.getInputStream()){data=new JSONObject(DataRepository.read(in));}finally{c.disconnect();}int code=data.optInt("versionCode");String path=data.optString("download");if(!path.matches("/downloads/Paddock-Pocket-[0-9.]+\\.apk"))throw new Exception();int current=getPackageManager().getPackageInfo(getPackageName(),0).versionCode;runOnUiThread(()->{if(isFinishing())return;if(code>current)new AlertDialog.Builder(this).setTitle("围场口袋有新版本").setMessage("版本 "+data.optString("version")+"，下载后按系统提示安装。网页内容随网站同步。").setPositiveButton("下载更新",(d,w)->external(Uri.parse(SITE+path))).setNegativeButton("稍后",null).show();else if(manual)Toast.makeText(this,"当前安装包已是最新版本",Toast.LENGTH_SHORT).show();});}catch(Exception e){if(manual)runOnUiThread(()->Toast.makeText(this,"暂时无法检查更新",Toast.LENGTH_LONG).show());}},"paddock-update").start();}
 void syncFollowing(){if(web==null||!trusted(web.getUrl()))return;web.evaluateJavascript("localStorage.getItem('paddock-following-v1')",value->{try{Object raw=new JSONTokener(value).nextValue();if(!(raw instanceof String))return;JSONArray ids=new JSONObject((String)raw).optJSONArray("driverIds");if(ids==null)return;StringBuilder saved=new StringBuilder();for(int n=0;n<Math.min(3,ids.length());n++){String id=ids.optString(n);if(!id.matches("(?i)[a-f0-9-]{36}"))continue;if(saved.length()>0)saved.append(',');saved.append(id);}getSharedPreferences("paddock",0).edit().putString("favorites",saved.toString()).putString("favorite",ids.optString(0,"")).apply();RaceWidget.render(this,DataRepository.load(this));}catch(Exception ignored){}});}
 void exportBlob(String url){exportToken=java.util.UUID.randomUUID().toString();String token=JSONObject.quote(exportToken);web.evaluateJavascript("fetch("+JSONObject.quote(url)+").then(r=>r.blob()).then(b=>{if(b.size>2097152)throw Error();const r=new FileReader();r.onload=()=>{location.href='paddock://save-file?token='+encodeURIComponent("+token+")+'&data='+encodeURIComponent(String(r.result).split(',')[1]);};r.readAsDataURL(b);}).catch(()=>alert('文件暂时无法保存，请重试'))",null);}
 void saveFile(Uri u){if(exportToken==null||!exportToken.equals(u.getQueryParameter("token")))return;exportToken=null;try{String data=u.getQueryParameter("data");if(data==null||data.length()>2900000)throw new Exception();exportBytes=android.util.Base64.decode(data,android.util.Base64.DEFAULT);startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("text/calendar").putExtra(Intent.EXTRA_TITLE,"Paddock-Race.ics"),32);}catch(Exception e){exportBytes=null;}}
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==31&&chooser!=null){chooser.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);chooser=null;}if(request==32){final byte[] bytes=exportBytes;exportBytes=null;if(result==RESULT_OK&&bytes!=null&&data!=null&&data.getData()!=null){final Uri target=data.getData();new Thread(()->{try(java.io.OutputStream out=getContentResolver().openOutputStream(target)){if(out!=null)out.write(bytes);}catch(Exception ignored){}},"paddock-export").start();}}}
 void back(){if(web.canGoBack())web.goBack();else finish();}
 @Override public void onBackPressed(){back();}
 @Override protected void onSaveInstanceState(Bundle state){web.saveState(state);super.onSaveInstanceState(state);}
 @Override protected void onPause(){syncFollowing();web.onPause();CookieManager.getInstance().flush();super.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override protected void onDestroy(){if(chooser!=null)chooser.onReceiveValue(null);if(web!=null){web.stopLoading();root.removeView(web);web.destroy();}super.onDestroy();}
}

