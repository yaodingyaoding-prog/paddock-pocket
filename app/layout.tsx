import type { Metadata } from "next";
import "./globals.css";
import { bootStatusScript } from '../lib/boot-status';
import { browserSupportScript } from '../lib/browser-support';

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
        <div id="paddock-boot-status" hidden suppressHydrationWarning role="status" style={{position:'fixed',zIndex:10000,bottom:24,left:'50%',transform:'translateX(-50%)',width:'min(440px, calc(100% - 32px))',boxSizing:'border-box',padding:18,borderRadius:16,background:'#17212b',border:'1px solid #6e8899',color:'#f3f8fc',fontFamily:'system-ui, sans-serif',fontSize:14,lineHeight:1.7,boxShadow:'0 8px 32px #0008'}}>
          <strong>网页尚未完成加载</strong>
          <p style={{margin:'6px 0 12px'}}>部分按钮暂不可用，可能是网络较慢或文件下载中断。你可以稍等片刻，或重新加载。</p>
          <button id="paddock-boot-retry" type="button" style={{border:0,borderRadius:8,padding:'8px 16px',background:'#9df1d7',color:'#10221e',font:'inherit',cursor:'pointer'}}>重新加载</button>
        </div>
        <script dangerouslySetInnerHTML={{__html:browserSupportScript+bootStatusScript}} />
        {children}
      </body>
    </html>
  );
}
