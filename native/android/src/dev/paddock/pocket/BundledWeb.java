package dev.paddock.pocket;
import android.content.res.AssetManager;
import android.webkit.WebResourceResponse;
import java.io.*;
import java.util.*;
/** Public, immutable app resources only. Account/API responses always use HTTPS networking. */
final class BundledWeb {
 static String asset(String path,boolean home){
  if(path==null||path.contains("..")||path.contains("\\"))return null;
  if(home&&"/".equals(path))return "shell/index.html";
  if(path.startsWith("/_next/static/")||path.startsWith("/fonts/")||path.startsWith("/circuits/models/")||path.startsWith("/drivers/")||"/favicon.svg".equals(path))return "shell"+path;
  return null;
 }
 static WebResourceResponse response(AssetManager assets,String path,boolean home){
  String file=asset(path,home);if(file==null)return null;
  try{InputStream input=assets.open(file);String type=file.endsWith(".html")?"text/html":file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":file.endsWith(".svg")?"image/svg+xml":file.endsWith(".webp")?"image/webp":file.endsWith(".woff2")?"font/woff2":"application/octet-stream";
   Map<String,String> headers=new HashMap<>();headers.put("Cache-Control",file.endsWith(".html")?"no-store":"public, max-age=31536000, immutable");headers.put("X-Content-Type-Options","nosniff");
   return new WebResourceResponse(type,"UTF-8",200,"OK",headers,input);
  }catch(IOException ignored){return null;}
 }
}
