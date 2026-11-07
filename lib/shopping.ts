export const shoppingCategories = {
  apparel: '服饰帽饰',
  models: '车模拼装',
  collectibles: '收藏艺术',
  accessories: '礼品配件',
} as const;

export const shippingLabels = {
  domestic: '国内购买',
  mainland: '已列大陆配送',
  checkout: '需结账确认',
  contact: '需联系商家',
  unlisted: '大陆未列配送',
} as const;

export type ShoppingCategory = keyof typeof shoppingCategories;
export type ShoppingShipping = keyof typeof shippingLabels;
export type ShoppingRegion = 'domestic' | 'overseas';
export type ShoppingChannel = {
  id: string;
  name: string;
  mark: string;
  identity: string;
  region: ShoppingRegion;
  categories: ShoppingCategory[];
  description: string;
  keywords: string[];
  url: string;
  shipping: ShoppingShipping;
  shippingNote: string;
  sourceUrl: string;
  verifiedAt: string;
};

export const shoppingChannels: ShoppingChannel[] = [
  {
    id: 'puma', name: 'PUMA 中国', mark: 'P', identity: '品牌官方', region: 'domestic',
    categories: ['apparel', 'accessories'],
    description: '法拉利、迈凯伦与阿斯顿·马丁车队服饰、帽子及配件。',
    keywords: ['彪马', 'Ferrari', '法拉利', 'McLaren', '迈凯伦', 'Aston Martin', '阿斯顿马丁', '阿隆索'],
    url: 'https://www.puma.com.cn/list?keyword=F1', shipping: 'domestic',
    shippingNote: '中国官方商城提供人民币标价，也可从品牌小程序及官方旗舰店选购。',
    sourceUrl: 'https://www.puma.com.cn/list/50374', verifiedAt: '2026-11-05',
  },
  {
    id: 'adidas', name: 'adidas 中国', mark: 'a', identity: '品牌官方', region: 'domestic',
    categories: ['apparel', 'accessories'],
    description: '梅赛德斯与奥迪 F1 车队服饰、鞋履及帽饰。',
    keywords: ['阿迪达斯', '奔驰', '梅赛德斯', 'Mercedes', 'Audi', '奥迪', '拉塞尔', '安东内利'],
    url: 'https://www.adidas.com.cn/plp/search?keyword=F1', shipping: 'domestic',
    shippingNote: '中国官网、官方 App 与小程序可选购，具体款式和库存以各渠道为准。',
    sourceUrl: 'https://www.adidas.com.cn/', verifiedAt: '2026-11-05',
  },
  {
    id: 'lego', name: 'LEGO 乐高中国', mark: 'L', identity: '品牌官方', region: 'domestic',
    categories: ['models'],
    description: 'F1 赛车、维修站与运输车拼装套装。',
    keywords: ['乐高', '积木', '拼装', '法拉利', '红牛', '迈凯伦', '奔驰', '梅赛德斯', '阿斯顿马丁', 'Ferrari', 'Red Bull', 'McLaren', 'Mercedes'],
    url: 'https://www.lego.com/zh-cn/categories/f1/f1-sets', shipping: 'domestic',
    shippingNote: '中国官网提供产品目录，可据套装编号在国内乐高官方渠道选购。',
    sourceUrl: 'https://www.lego.com/zh-cn/categories/f1/f1-sets', verifiedAt: '2026-11-05',
  },
  {
    id: 'rastar', name: 'RASTAR 星辉', mark: 'R', identity: '品牌官方', region: 'domestic',
    categories: ['models'],
    description: 'F1 授权遥控赛车、拼装车及车模，适合互动把玩。',
    keywords: ['星辉', '遥控车', '积木', '奔驰', '法拉利', '红牛', '迈凯伦', 'Mercedes', 'Ferrari', 'Red Bull'],
    url: 'https://rastar.tmall.com/search.htm?search=y&keyword=F1', shipping: 'domestic',
    shippingNote: '品牌官网提供天猫与京东商城入口，进入后按车型或车队查找。',
    sourceUrl: 'https://rastar.com/html/toys-pc/', verifiedAt: '2026-11-05',
  },
  {
    id: 'f1-store', name: 'F1 Store', mark: 'F1', identity: 'F1 授权商城', region: 'overseas',
    categories: ['apparel', 'models', 'collectibles', 'accessories'],
    description: '多车队队服、车手帽、赛车模型与纪念周边。',
    keywords: ['Fanatics', '官方商城', '法拉利', '奔驰', '红牛', '迈凯伦', '阿斯顿马丁', '奥迪', '凯迪拉克', '威廉姆斯', '哈斯', '阿尔派', '小红牛'],
    url: 'https://f1store.formula1.com/zh/hot-new-arrivals/c-3400089892%2Bz-916098-203033323', shipping: 'mainland',
    shippingNote: '中国标准配送通常为发货后 5–10 个工作日，最长预留 20 个工作日。运费及可能的税费另计。',
    sourceUrl: 'https://f1store.formula1.com/zh/delivery-and-shipping/ch-1364', verifiedAt: '2026-11-05',
  },
  {
    id: 'fuel-for-fans', name: 'Fuel for Fans', mark: 'FF', identity: 'stichd 运营商城', region: 'overseas',
    categories: ['apparel', 'models', 'accessories'],
    description: '车队服饰、车手帽、赛车模型与礼品。',
    keywords: ['stichd', '法拉利', '奔驰', '红牛', '迈凯伦', '阿斯顿马丁', '奥迪', '凯迪拉克', '威廉姆斯', '哈斯', '阿尔派', '小红牛'],
    url: 'https://www.fuelforfans.com/global/en/f1/teams/', shipping: 'checkout',
    shippingNote: '运费表列有其他地区收费与免邮门槛，未单列中国大陆。结账时核实地址及费用。',
    sourceUrl: 'https://www.fuelforfans.com/global/en/help/shipping.html', verifiedAt: '2026-11-05',
  },
  {
    id: 'mclaren', name: 'McLaren 官方商城', mark: 'McL', identity: '车队官方', region: 'overseas',
    categories: ['apparel', 'models', 'collectibles', 'accessories'],
    description: '迈凯伦队服、诺里斯与皮亚斯特里周边、特别系列及模型。',
    keywords: ['迈凯伦', '诺里斯', '皮亚斯特里', 'Lando Norris', 'Oscar Piastri', '木瓜橙'],
    url: 'https://store.mclaren.com/en/formula1/team/', shipping: 'checkout',
    shippingNote: '当前商城入口为 store.mclaren.com，大陆地址可用性及运费需结账确认。',
    sourceUrl: 'https://store.mclaren.com/en/home/', verifiedAt: '2026-11-05',
  },
  {
    id: 'mercedes', name: 'Mercedes 官方商城', mark: 'AMG', identity: '车队官方', region: 'overseas',
    categories: ['apparel', 'accessories'],
    description: '梅赛德斯车队服饰、拉塞尔与安东内利车手帽及特别系列。',
    keywords: ['奔驰', '梅赛德斯', '拉塞尔', '安东内利', 'George Russell', 'Kimi Antonelli', 'adidas'],
    url: 'https://shop.mercedesamgf1.com/collections/teamwear', shipping: 'checkout',
    shippingNote: '官网覆盖全球多数地区。大陆地址、运费与是否含税以结账页面为准。',
    sourceUrl: 'https://shop.mercedesamgf1.com/pages/delivery', verifiedAt: '2026-11-05',
  },
  {
    id: 'ferrari', name: 'Ferrari 官方商城', mark: 'SF', identity: '品牌官方', region: 'overseas',
    categories: ['apparel', 'models', 'accessories'],
    description: '法拉利服饰、品牌配件及车队系列。',
    keywords: ['法拉利', '勒克莱尔', '汉密尔顿', 'Charles Leclerc', 'Lewis Hamilton', 'Scuderia'],
    url: 'https://store.ferrari.cn/zh-cn/cavallino/%E5%A4%8D%E5%88%BB%E7%B3%BB%E5%88%97/%E6%B3%95%E6%8B%89%E5%88%A9%E8%BD%A6%E9%98%9F%E5%A4%8D%E5%88%BB%E7%B3%BB%E5%88%97/', shipping: 'mainland',
    shippingNote: '配送表列有中国，标准运费 ¥440，预计发货后 5–6 个工作日。结账核对最终费用。',
    sourceUrl: 'https://support.store.ferrari.com/hc/en-us/articles/12406454046876-Do-you-ship-to-my-country', verifiedAt: '2026-11-05',
  },
  {
    id: 'aston-martin', name: 'Aston Martin 官方商城', mark: 'AM', identity: '车队官方', region: 'overseas',
    categories: ['apparel', 'accessories'],
    description: '阿斯顿·马丁队服、阿隆索与斯特罗尔周边及礼品。',
    keywords: ['阿斯顿马丁', '阿斯顿·马丁', '阿隆索', '斯特罗尔', 'Fernando Alonso', 'Lance Stroll'],
    url: 'https://shop.astonmartinf1.com/en/team/', shipping: 'checkout',
    shippingNote: '已核实车队商城入口，大陆地址及配送条件需在结账时确认。',
    sourceUrl: 'https://shop.astonmartinf1.com/en/home/', verifiedAt: '2026-11-05',
  },
  {
    id: 'redbull', name: 'Red Bull Shop', mark: 'RB', identity: '品牌官方', region: 'overseas',
    categories: ['apparel', 'accessories'],
    description: '红牛车队服饰、车手帽及品牌配件。',
    keywords: ['红牛', 'Red Bull Racing', '维斯塔潘', '哈贾尔', 'Max Verstappen', 'Isack Hadjar'],
    url: 'https://www.redbullshop.com/en-gb/rb-racing/', shipping: 'unlisted',
    shippingNote: '当前配送名单列有中国香港，未列中国大陆。大陆收货可先比较 F1 Store 的红牛商品。',
    sourceUrl: 'https://customerservice.redbullshop.com/hc/en-us/sections/27269814144413', verifiedAt: '2026-11-05',
  },
  {
    id: 'verstappen', name: 'Max Verstappen 官方商城', mark: 'MV', identity: '车手官方', region: 'overseas',
    categories: ['apparel', 'models', 'collectibles', 'accessories'],
    description: '维斯塔潘个人服饰、赛车模型、头盔模型及收藏周边。',
    keywords: ['维斯塔潘', '潘子', '红牛', 'Red Bull', '头盔', 'Fanatics'],
    url: 'https://store.verstappen.com/en/teamwear/c-2315376502%2Bz-900743-2381588112', shipping: 'checkout',
    shippingNote: '当前商城由 Fanatics 运营，按所选商品在结账时核实大陆配送及费用。',
    sourceUrl: 'https://store.verstappen.com/en/terms-of-use/ch-7347', verifiedAt: '2026-11-05',
  },
  {
    id: 'ck-modelcars', name: 'CK-Modelcars', mark: 'CK', identity: '专业模型零售商', region: 'overseas',
    categories: ['models'],
    description: 'Spark、Minichamps、Bburago 等品牌比例车模。',
    keywords: ['德国', '车模', 'Minichamps', '迷你切', 'Spark', '斯帕克', 'Bburago', '比美高', '1:18', '1:43'],
    url: 'https://ck-modelcars.de/en/l/t-gesamt/k-formel1/', shipping: 'checkout',
    shippingNote: '实时政策列全球 DHL 运费 €59.95/箱，每箱订单金额上限 €999。大陆地址需结账确认，税费另计。',
    sourceUrl: 'https://ck-modelcars.de/en/shipping-costs/', verifiedAt: '2026-11-05',
  },
  {
    id: 'diecast-legends', name: 'Diecast Legends', mark: 'DL', identity: '专业模型零售商', region: 'overseas',
    categories: ['models'],
    description: '赛车模型、头盔模型与预订收藏品。',
    keywords: ['英国', '车模', '头盔', 'Minichamps', 'Spark', '1:18', '1:43'],
    url: 'https://www.diecastlegends.com/f1-models', shipping: 'checkout',
    shippingNote: '欧洲以外首件运费 £25，每增加一件加 £10，部分大件另计。大陆订单需结账确认。',
    sourceUrl: 'https://www.diecastlegends.com/customer-service/terms-and-conditions', verifiedAt: '2026-11-05',
  },
  {
    id: 'gpworld', name: 'GPworld', mark: 'GP', identity: '专业模型零售商', region: 'overseas',
    categories: ['models'],
    description: '1:43 赛车比例模型、限量版本与预订车模。',
    keywords: ['荷兰', '车模', 'Spark', 'Minichamps', '维斯塔潘', '1:18', '1:43'],
    url: 'https://www.gpworld.nl/en/formula-1-143/', shipping: 'contact',
    shippingNote: '条款默认覆盖荷兰及欧洲。欧洲以外的配送与运费需要先联系商家商定。',
    sourceUrl: 'https://www.gpworld.nl/en/algemene-voorwaarden.php', verifiedAt: '2026-11-05',
  },
  {
    id: 'automobilist', name: 'Automobilist', mark: 'A', identity: '艺术品牌商城', region: 'overseas',
    categories: ['collectibles', 'accessories'],
    description: '赛车艺术海报、装饰画与比赛纪念作品。',
    keywords: ['海报', '装饰画', '艺术', '拼图', '挂画', '收藏'],
    url: 'https://automobilist.com/pages/f1-print-store', shipping: 'mainland',
    shippingNote: '运费表列中国经济配送 €26.75、快递 €31.45，满 €400 免邮。最终费用以结账为准。',
    sourceUrl: 'https://automobilist.com/en-gb/pages/shipping-rates', verifiedAt: '2026-11-05',
  },
  {
    id: 'f1-authentics', name: 'F1 Authentics', mark: 'F1A', identity: 'F1 授权收藏平台', region: 'overseas',
    categories: ['collectibles', 'models', 'accessories'],
    description: '签名收藏品、比赛使用零件、赛车服及展示品。',
    keywords: ['签名', '实战', '零件', '赛车服', '头盔', '收藏', 'Memento Exclusives'],
    url: 'https://www.f1authentics.com/collections/all-products', shipping: 'mainland',
    shippingNote: '配送政策列有中国。商品备货时间、装裱需求及大件运费需查看具体商品。',
    sourceUrl: 'https://us.f1authentics.com/policies/shipping-policy', verifiedAt: '2026-11-05',
  },
];

export type ShoppingFilters = {
  query?: string;
  region?: ShoppingRegion | 'all';
  category?: ShoppingCategory | 'all';
  shipping?: ShoppingShipping | 'all';
};

export function filterShoppingChannels(channels: ShoppingChannel[], filters: ShoppingFilters): ShoppingChannel[] {
  const terms = (filters.query || '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return channels.filter(channel => {
    const text = [channel.name, channel.identity, channel.description, ...channel.keywords].join(' ').toLocaleLowerCase();
    return (!filters.region || filters.region === 'all' || channel.region === filters.region)
      && (!filters.category || filters.category === 'all' || channel.categories.includes(filters.category))
      && (!filters.shipping || filters.shipping === 'all' || channel.shipping === filters.shipping)
      && terms.every(term => text.includes(term));
  });
}
