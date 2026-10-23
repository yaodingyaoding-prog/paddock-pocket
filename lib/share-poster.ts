import type { ShareCard } from './share-card';
import portraitBounds from './portrait-bounds.json';

const font = '"Microsoft YaHei", "PingFang SC", system-ui, sans-serif';
function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color = '#f6f8f7', max = 900, weight = 600) {
  ctx.font = `${weight} ${size}px ${font}`;
  while (ctx.measureText(value).width > max && size > 18) { size--; ctx.font = `${weight} ${size}px ${font}`; }
  ctx.fillStyle = color; ctx.fillText(value, x, y, max);
}
function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, radius = 24) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}
async function image(src: string) {
  const value = new Image(); value.src = src;
  await Promise.race([value.decode(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('图片加载超时')), 5000))]);
  return value;
}
export async function renderSharePoster(card: ShareCard): Promise<Blob> {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1440;
  const ctx = canvas.getContext('2d'); if (!ctx) throw Error('浏览器暂不支持图片生成');
  const background = ctx.createLinearGradient(0, 0, 1080, 1440); background.addColorStop(0, '#142d31'); background.addColorStop(.6, '#0d171e'); background.addColorStop(1, '#131c23');
  ctx.fillStyle = background; ctx.fillRect(0, 0, 1080, 1440);
  ctx.strokeStyle = '#84ecd71c'; ctx.lineWidth = 2;
  for (let i = -500; i < 1500; i += 90) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 700, 1440); ctx.stroke(); }
  block(ctx, 64, 64, 8, 45, '#84ecd7', 4); text(ctx, '围场口袋', 90, 101, 38);
  text(ctx, 'PADDOCK POCKET / F1', 64, 152, 20, '#9bb5ba', 800, 500);
  text(ctx, card.label, 64, 240, 28, '#84ecd7');
  text(ctx, card.title, 64, 328, 72, '#f6f8f7', 950, 800);
  text(ctx, card.subtitle, 64, 381, 27, '#afc5ca', 950, 500);
  if (card.kind === 'weekend') {
    const top = 441;
    if (!card.rows.length) text(ctx, '场次时间尚未公布', 94, 510, 30, '#afc5ca');
    card.rows.forEach((row, i) => { const y = top + i * 72; block(ctx, 64, y, 952, 62, i === card.rows.length - 1 ? '#214644' : '#ffffff08', 12); text(ctx, row.label, 88, y + 41, 27, i === card.rows.length - 1 ? '#84ecd7' : '#f6f8f7', 250); text(ctx, row.value, 358, y + 41, 27, '#d4e3e4', 630, 500); });
    text(ctx, card.dataNote, 66, 1000, 19, '#93aeb2', 950, 400);
    block(ctx, 64, 1030, 952, 115, '#ffffff0b', 18);
    text(ctx, card.weather?.summary || '未附比赛时段预报', 88, 1076, 26, '#d7eeeb', 900);
    text(ctx, card.weather?.detail || '打开网站查看当地天气与可用预报。', 88, 1113, 17, '#93aeb2', 900, 400);
  } else {
    const images = await Promise.all(card.rows.map(row => row.image?.startsWith('/drivers/') ? image(row.image).catch(() => null) : null));
    [1, 0, 2].forEach((index, order) => {
      const row = card.rows[index], x = 64 + order * 324, plinth = index === 0 ? 840 : index === 1 ? 915 : 955;
      text(ctx, row?.label || '虚位以待', x + 8, 495, 31, row ? '#f6f8f7' : '#9bb5ba', 290);
      text(ctx, row?.value || '选出你的阵容', x + 8, 535, 20, '#9bb5ba', 290, 500);
      const photo = images[index];
      if (photo) {
        const bounds = (portraitBounds as Record<string, { height: number; bottom: number; center: number }>)[row.image || ''];
        if (bounds) {
          const h = 290 * bounds.height / 100, w = h * photo.width / photo.height;
          ctx.save(); ctx.beginPath(); ctx.rect(x, plinth - 290, 300, 290); ctx.clip();
          ctx.drawImage(photo, x + 150 + w * bounds.center / 100, plinth - 290 * bounds.bottom / 100 - h, w, h); ctx.restore();
        } else { const scale = Math.min(300 / photo.width, 290 / photo.height); ctx.drawImage(photo, x + 150 - photo.width * scale / 2, plinth - photo.height * scale, photo.width * scale, photo.height * scale); }
      }
      else { text(ctx, row ? String(index + 1).padStart(2, '0') : '+', x + 74, plinth - 70, 112, '#84ecd733', 200, 800); }
      block(ctx, x, plinth, 300, 1070 - plinth, row ? '#234647' : '#ffffff08', 8);
      block(ctx, x, plinth, 300, 5, row?.color || '#527174', 0);
      text(ctx, String(index + 1).padStart(2, '0'), x + 22, plinth + 63, 46, '#f0f6f4', 230, 800);
    });
    text(ctx, card.dataNote, 64, 1125, 22, '#93aeb2', 950, 400);
  }
  block(ctx, 64, 1190, 952, 190, '#f0f4ec', 24);
  text(ctx, '赛程 · 天气 · 回放', 94, 1255, 36, '#10262c', 680, 800);
  text(ctx, '扫码进入围场，游客即可浏览', 94, 1302, 25, '#34515a', 680, 500);
  text(ctx, 'F1.xiaodinglab.com', 94, 1345, 22, '#34515a', 680, 500);
  const QRCode = await import('qrcode');
  const qr = document.createElement('canvas'); await QRCode.toCanvas(qr, card.url, { errorCorrectionLevel: 'M', margin: 4, width: 164, color: { dark: '#10262cff', light: '#ffffffff' } });
  ctx.imageSmoothingEnabled = false; ctx.drawImage(qr, 830, 1203, 164, 164);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error('图片生成失败，请重试')), 'image/png'));
}
