export type DriverNote = { match: RegExp; aliases: string[]; note: string; source: string; numberHistory?: string };
const official = 'https://www.formula1.com/en/drivers/';
const notes: DriverNote[] = [
  { match: /维斯塔潘|verstappen/i, aliases: ['Max'], note: '2016 年西班牙站首胜，成为 F1 历史上最年轻的分站冠军；2021 至 2024 年连续四次夺得车手世界冠军。', numberHistory: '2015–2021：33 号；2022–2025：卫冕冠军 1 号；2026 起：3 号。', source: official + 'max-verstappen' },
  { match: /汉密尔顿|hamilton/i, aliases: ['Sir Lewis', 'Hammertime'], note: '七届车手世界冠军，冠军赛季为 2008、2014、2015、2017、2018、2019 和 2020。曾效力迈凯伦、梅赛德斯，2025 年加入法拉利。', numberHistory: '自 2014 年固定车号制度实施以来选择 44 号。', source: official + 'lewis-hamilton' },
  { match: /塞恩斯|sainz/i, aliases: ['Chilli', 'Smooth Operator'], note: '2022 年英国大奖赛取得个人 F1 首胜，曾效力红牛二队、雷诺、迈凯伦及法拉利，2025 年转投威廉姆斯。', source: official + 'carlos-sainz' },
  { match: /里卡多|ricciardo/i, aliases: ['Honey Badger · 蜜獾'], note: '以积极的晚刹车超车闻名。代表红牛和迈凯伦赢得过分站冠军，2021 年意大利大奖赛领衔迈凯伦包揽前二。', source: 'https://www.formula1.com/en/latest/article/ricciardo-shares-how-he-ended-up-with-honey-badger-nickname-during-time-in.42bshlinzhtTbUIi2NiWcK' },
  { match: /莱科宁|räikkönen|raikkonen/i, aliases: ['Iceman · 冰人'], note: '2007 年代表法拉利获得车手世界冠军。F1 生涯曾效力索伯、迈凯伦、法拉利、路特斯和阿尔法·罗密欧。', source: 'https://www.formula1.com/en/information/drivers-hall-of-fame-kimi-raikkonen.4Ykdt9U76gWO40cNbjaMXf' },
];
export function notesForDriver(name: string) { return notes.find(item => item.match.test(name)); }
