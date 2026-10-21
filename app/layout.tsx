import type { Metadata } from "next";
import "./globals.css";
import { bootStatusScript } from '../lib/boot-status';

export const metadata: Metadata = {
  title: "围场口袋 · 我的比赛周末",
  description: "在 iPhone 上查看 F1 赛程、倒计时、积分与比赛成绩。你的随身围场。",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "我的围场", statusBarStyle: "black-translucent" },
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
        <script dangerouslySetInnerHTML={{__html:bootStatusScript}} />
        {children}
      </body>
    </html>
  );
}
