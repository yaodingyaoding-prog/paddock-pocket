import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
