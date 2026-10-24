import type { Metadata } from "next";
import "./globals.css";
import { bootStatusScript } from '../lib/boot-status';
import { browserSupportScript } from '../lib/browser-support';
import './compatible-controls.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://f1.xiaodinglab.com'),
  title: "围场口袋 · F1 赛程、天气与赛事回放",
  description: "下一场 F1 几点开始？比赛时会下雨吗？去哪里找回放？围场口袋将赛程、赛道天气与观赛入口放在一起，游客即可浏览，支持网页与 Android。",
  openGraph: {
    type: 'website', locale: 'zh_CN', siteName: '围场口袋 · Paddock Pocket', url: '/',
    title: '围场口袋｜这个周末，一起看 F1',
    description: '赛程几点开始，比赛天气怎样，回放去哪里找。打开即看，无需先注册。',
    images: [{ url: '/social-cover.png', width: 1200, height: 630, alt: '围场口袋：F1 赛程、天气与回放' }],
  },
  twitter: { card: 'summary_large_image', title: '围场口袋｜这个周末，一起看 F1', description: 'F1 赛程、天气与回放，游客即可浏览。', images: ['/social-cover.png'] },
  alternates: { canonical: '/' },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "围场口袋", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <style dangerouslySetInnerHTML={{__html:`#paddock-startup{position:fixed;z-index:9999;top:0;right:0;bottom:0;left:0;display:flex;align-items:center;justify-content:center;background:#0d1017;color:#edf4fa;font-family:system-ui,sans-serif;transition:opacity .18s ease-out}#paddock-startup[hidden]{display:none}#paddock-startup>div{text-align:center;padding:32px;max-width:380px}.startup-label{font-size:10px;letter-spacing:4px;color:#76e5cc}.startup-title{font-size:32px;font-weight:800;letter-spacing:2px;margin:16px 0}.startup-lights{display:flex;justify-content:center;gap:12px;margin:30px 0}.startup-lights i{height:12px;width:12px;border-radius:6px;background:#5fe2c3;animation:paddock-signal 1.5s ease-in-out infinite}.startup-lights i:nth-child(2){animation-delay:.15s}.startup-lights i:nth-child(3){animation-delay:.3s}.startup-lights i:nth-child(4){animation-delay:.45s}.startup-lights i:nth-child(5){animation-delay:.6s}.startup-caption{font-size:13px;color:#a4b4c3}.startup-track{width:140px;height:3px;background:#2e3a46;margin:0 auto;overflow:hidden}.startup-track:after{content:'';display:block;width:45%;height:100%;background:#9df1d7;animation:paddock-track 1.4s ease-in-out infinite}@keyframes paddock-signal{0%,100%{opacity:.25;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}@keyframes paddock-track{from{transform:translateX(-110%)}to{transform:translateX(330%)}}@media(prefers-reduced-motion:reduce){.startup-lights i,.startup-track:after{animation:none}#paddock-startup{transition:none}}`}}/>
        <div id="paddock-startup" suppressHydrationWarning role="status" aria-label="正在打开围场口袋"><div><p className="startup-label">PADDOCK POCKET</p><p className="startup-title">围场口袋</p><div className="startup-lights" aria-hidden="true"><i/><i/><i/><i/><i/></div><div className="startup-track" aria-hidden="true"/><p className="startup-caption">正在准备你的比赛周末…</p></div></div>
        <div id="paddock-boot-status" hidden suppressHydrationWarning role="status" style={{position:'fixed',zIndex:10000,bottom:24,left:'50%',transform:'translateX(-50%)',width:'min(440px, calc(100% - 32px))',boxSizing:'border-box',padding:18,borderRadius:16,background:'#17212b',border:'1px solid #6e8899',color:'#f3f8fc',fontFamily:'system-ui, sans-serif',fontSize:14,lineHeight:1.7,boxShadow:'0 8px 32px #0008'}}>
          <strong>网页尚未完成加载</strong>
          <p style={{margin:'6px 0 12px'}}>部分按钮暂不可用，可能是网络较慢或文件下载中断。你可以稍等片刻，或重新加载。</p>
          <button id="paddock-boot-retry" type="button" style={{border:0,borderRadius:8,padding:'8px 16px',background:'#9df1d7',color:'#10221e',font:'inherit',cursor:'pointer'}}>重新加载</button>
          <a href="/download" style={{color:'#9df1d7',marginLeft:16}}>下载安卓 App</a>
        </div>
        <script dangerouslySetInnerHTML={{__html:browserSupportScript+bootStatusScript}} />
        {children}
      </body>
    </html>
  );
}
