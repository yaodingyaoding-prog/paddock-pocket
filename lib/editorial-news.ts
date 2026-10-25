export type NewsItem={id:string;title:string;summary:string;date:string;datePrecision:'day'|'second';source:string;url:string;drivers:string[];teams:string[];topic:string;kind?:'feed'};
export const editorialUpdatedAt='2026-10-20';
export const editorialNews:NewsItem[]=[
  {id:'mercedes-stripe-20261020',title:'梅赛德斯公布 Stripe 多年合作',summary:'车队宣布与 Stripe 建立多年合作；相关品牌标识将从 2027 赛季首站起出现在赛车及车队资产上。',date:'2026-10-20',datePrecision:'day',source:'Mercedes-AMG F1',url:'https://www.mercedesamgf1.com/news/mercedes-amg-petronas-f1-team-partners-with-stripe',drivers:[],teams:['Mercedes'],topic:'车队动态'},
  {id:'fia-wmsc-20261019',title:'FIA 世界汽车运动理事会通过规则修订',summary:'理事会批准 2026 与 2027 年 F1 规则修订，涉及竞技、技术与财务条款的清晰度和实施。',date:'2026-10-19T16:03:00Z',datePrecision:'second',source:'FIA',url:'https://www.fia.com/news/rally-roadmaps-and-grassroots-affordability-focus-fia-world-motor-sport-council',drivers:[],teams:[],topic:'规则动态'},
  {id:'haas-godzilla-20261016',title:'哈斯美国站哥斯拉特别设计',summary:'哈斯宣布在美国站采用哥斯拉特别设计，并将主题延伸至奥康与贝尔曼的赛车服。',date:'2026-10-16',datePrecision:'day',source:'Haas F1 Team',url:'https://www.haasf1team.com/news/godzilla-roar-once-more-united-states-grand-prix-tgr-haas-f1-team-and-toho-co-ltd',drivers:['OCO','BEA'],teams:['Haas'],topic:'涂装与赛车服'},
];
