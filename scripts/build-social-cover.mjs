import fs from 'node:fs/promises';
import sharp from 'sharp';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#183e3c"/><stop offset="1" stop-color="#0d1b23"/></linearGradient><pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M0 0H36V36H0ZM36 36H72V72H36Z" fill="#91ebd5" fill-opacity=".1"/></pattern></defs>
<path fill="url(#bg)" d="M0 0H1200V630H0Z"/><path d="M760 0H1200V630H760Z" fill="url(#grid)"/>
<rect x="66" y="60" width="8" height="38" rx="4" fill="#91ebd5"/>
<g font-family="Microsoft YaHei, PingFang SC, sans-serif"><text x="94" y="91" fill="#eff8ef" font-size="30" font-weight="700">围场口袋</text><text x="68" y="137" fill="#aac9c2" font-size="15" letter-spacing="4">PADDOCK POCKET / F1</text>
<text x="64" y="270" fill="#f5f6ec" font-size="84" font-weight="800">这个周末，</text><text x="64" y="376" fill="#91ebd5" font-size="84" font-weight="800">一起看 F1。</text>
<text x="68" y="463" fill="#e2efdf" font-size="29">看赛程 · 查天气 · 找回放</text><text x="68" y="538" fill="#abc6c0" font-size="21">游客即可浏览　/　免费开源</text>
<text x="1132" y="580" fill="#abc6c0" font-size="21" text-anchor="end">F1.xiaodinglab.com</text></g>
<path d="M910 155L1090 200L1020 290L1070 356L995 440L805 365L856 285L811 240Z" fill="none" stroke="#8bebd5" stroke-width="9" stroke-linejoin="round" opacity=".7"/>
<path d="M910 155L945 164" stroke="#f5f6ec" stroke-width="13"/></svg>`;
await fs.writeFile('public/social-cover.svg', svg);
await sharp(Buffer.from(svg)).png().toFile('public/social-cover.png');
console.log('Generated 1200×630 social cover.');
