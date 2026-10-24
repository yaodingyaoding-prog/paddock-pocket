package dev.paddock.pocket;
import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import java.io.*;

/** Isolated official-page player: no local assets origin and no JavaScript/native bridge. */
public class LiveActivity extends Activity {
 private WebView web;private FrameLayout root;private LinearLayout content;private TextView status;
 private View fullScreen;private WebChromeClient.CustomViewCallback fullCallback;private String script,scriptVersion="";
 @Override public void onCreate(Bundle state){
  super.onCreate(state);getWindow().setStatusBarColor(Color.rgb(13,16,23));getWindow().setNavigationBarColor(Color.rgb(13,16,23));
  root=new FrameLayout(this);root.setBackgroundColor(Color.rgb(13,16,23));setContentView(root);
  root.setOnApplyWindowInsetsListener((v,i)->{if(fullScreen==null){if(Build.VERSION.SDK_INT>=30){android.graphics.Insets s=i.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());v.setPadding(s.left,s.top,s.right,s.bottom);}else v.setPadding(i.getSystemWindowInsetLeft(),i.getSystemWindowInsetTop(),i.getSystemWindowInsetRight(),i.getSystemWindowInsetBottom());}else v.setPadding(0,0,0,0);return i;});
  content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);root.addView(content,new FrameLayout.LayoutParams(-1,-1));
  LinearLayout bar=new LinearLayout(this);bar.setGravity(Gravity.CENTER_VERTICAL);bar.setPadding(12,4,12,4);content.addView(bar,new LinearLayout.LayoutParams(-1,-2));
  Button close=new Button(this);close.setText("返回围场");close.setOnClickListener(v->finish());bar.addView(close,new LinearLayout.LayoutParams(-2,-2));
  status=new TextView(this);status.setTextColor(Color.rgb(220,226,235));status.setTextSize(12);status.setPadding(14,0,0,0);status.setText("五星体育 · 加载官方页面");bar.addView(status,new LinearLayout.LayoutParams(0,-2,1));
  web=new WebView(this);web.setBackgroundColor(Color.BLACK);content.addView(web,new LinearLayout.LayoutParams(-1,0,1));
  WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setDatabaseEnabled(false);settings.setAllowFileAccessFromFileURLs(false);settings.setAllowUniversalAccessFromFileURLs(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);settings.setMediaPlaybackRequiresUserGesture(true);settings.setSupportMultipleWindows(false);settings.setUseWideViewPort(true);settings.setLoadWithOverviewMode(true);
  CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
  try(InputStream in=getAssets().open("web/user-scripts/smg_fivestar.android.user.js")){script=DataRepository.read(in);java.util.regex.Matcher version=java.util.regex.Pattern.compile("@version\\s+([0-9.]+)").matcher(script);if(version.find())scriptVersion=version.group(1);}catch(Exception e){status.setText("脚本文件暂缺 · 官方网页模式");}
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri u=request.getUrl();if(!request.isForMainFrame())return false;if(trusted(u))return false;external(u);return true;}
   @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){status.setText("五星体育 · 正在加载");}
   @Override public void onPageFinished(WebView view,String url){
    if(script==null||!trusted(Uri.parse(url)))return;
    String js="(function(){if(window.__paddockSmgInjected)return true;try{\n"+script+"\n;window.__paddockSmgInjected=true;return true;}catch(e){return false;}})()";
    view.evaluateJavascript(js,result->{status.setText("true".equals(result)?"SMG "+scriptVersion+" 已载入 · 请点按播放":"脚本未能加载 · 可用浏览器方案");});
   }
   @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){if(request.isForMainFrame())status.setText("官方页面加载失败 · 可返回重试");}
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public void onShowCustomView(View view,CustomViewCallback callback){if(fullScreen!=null){callback.onCustomViewHidden();return;}fullScreen=view;fullCallback=callback;content.setVisibility(View.GONE);root.addView(view,new FrameLayout.LayoutParams(-1,-1));if(Build.VERSION.SDK_INT>=30)getWindow().getInsetsController().hide(WindowInsets.Type.systemBars());else getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);root.requestApplyInsets();}
   @Override public void onHideCustomView(){hideVideo();}
  });
  web.loadUrl("https://live.kankanews.com/huikan?id=10");
  if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,()->back());
 }
 static boolean trusted(Uri u){return u!=null&&"https".equals(u.getScheme())&&(u.getPort()==-1||u.getPort()==443)&&("live.kankanews.com".equals(u.getHost())||"m.kankanews.com".equals(u.getHost()))&&u.getPath()!=null&&u.getPath().matches("/huikan(?:/[0-9]{1,10})?/?");}
 void external(Uri u){if(u==null||!("https".equals(u.getScheme())||"http".equals(u.getScheme())))return;try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){Toast.makeText(this,"无法打开链接",Toast.LENGTH_SHORT).show();}}
 void hideVideo(){if(fullScreen==null)return;root.removeView(fullScreen);fullScreen=null;content.setVisibility(View.VISIBLE);if(fullCallback!=null){fullCallback.onCustomViewHidden();fullCallback=null;}if(Build.VERSION.SDK_INT>=30)getWindow().getInsetsController().show(WindowInsets.Type.systemBars());else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);root.requestApplyInsets();}
 void back(){if(fullScreen!=null)hideVideo();else if(web.canGoBack())web.goBack();else finish();}
 @Override public void onBackPressed(){back();}
 @Override protected void onPause(){web.onPause();super.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override protected void onDestroy(){if(web!=null){web.stopLoading();web.destroy();}super.onDestroy();}
}
