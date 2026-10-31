import type { Metadata } from 'next';
import androidRelease from '../../public/downloads/android-build.json';
import './about.css';

export const metadata: Metadata = { title: '关于围场口袋 · 你的 F1 比赛周末', alternates: { canonical: '/about' }, openGraph: { url: '/about', title: '围场口袋｜你的 F1 比赛周末', description: '看赛程、查天气、找回放。打开即看，免费开源。', images: ['/social-cover.png'] } };
export default function AboutPage() {
  return <main className="paddock-about"><header className="about-nav"><a href="/#schedule" className="about-brand"><img src="/favicon.svg" alt=""/>围场口袋<span>PADDOCK POCKET</span></a><a href="/#schedule" className="about-open">打开围场</a></header>
    <section className="about-hero"><p className="about-kicker">YOUR RACE WEEKEND STARTS HERE</p><h1>这个周末，<br/><span>围场见。</span></h1><p className="about-intro">下一场几点开始，比赛时会不会下雨，错过了去哪里找回放。<br/>把比赛周末关心的事，放在一起。</p><div className="about-actions"><a className="about-primary" href="/#schedule">游客直接浏览</a><a href="/download">下载 Android {androidRelease.version}</a></div><p className="about-access">无需先注册 · 手机、平板与电脑可用</p><div className="about-checker" aria-hidden="true"/></section>
    <section className="about-essentials" aria-label="三个观赛用途">{[
      ['01', '比赛几点开始？', '完整比赛周末，按你的时区显示。', '自由练习、排位、冲刺和正赛，选择分站即可查看。', '/#schedule', '查看赛程'],
      ['02', '比赛天气怎样？', '赛道位置与比赛时段相匹配。', '查看当地天气与各场次预报。', '/#schedule', '查看比赛周末'],
      ['03', '错过了去哪里看？', '按赛季和分站找到回放入口。', '提供 B 站、腾讯视频搜索入口，观看权限以平台为准。', '/#discover/replays', '查找回放'],
    ].map(([n,title,subtitle,copy,href,cta]) => <article key={n}><span className="about-number">{n}</span><h2>{title}</h2><strong>{subtitle}</strong><p>{copy}</p><a href={href}>{cta}<span aria-hidden="true">＋</span></a></article>)}</section>
    <section className="about-personal"><div><p className="about-kicker">MAKE IT YOUR PADDOCK</p><h2>选出你的三位车手。<br/>带上自己的领奖台。</h2><p>关注阵容、主题、配色和时区随账号跨设备同步。登录可设置账号头像，领取超级执照风格的车迷通行证。</p><a href="/#profile">打造我的主场</a></div><div className="about-podium" aria-hidden="true"><span><i>02</i></span><span><i>01</i></span><span><i>03</i></span></div></section>
    <footer className="about-bottom"><p>由车迷构建，向车迷开源。</p><div><a href="https://github.com/yaodingyaoding-prog/paddock-pocket" target="_blank" rel="noopener noreferrer">GitHub / MIT</a><a href="/privacy">隐私说明</a><details><summary>第三方许可</summary><a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a><a href="/drivers/credits.json">车手图片</a><a href="/drivers/history/credits.json">历史车手图片</a><a href="/circuits/models/credits.json">赛道模型</a></details><a href="/#schedule">进入围场</a></div><small>独立车迷项目，与 Formula 1 及相关车队、观赛平台无官方隶属关系。支持 Android 安装与桌面小组件。</small></footer>
  </main>;
}
