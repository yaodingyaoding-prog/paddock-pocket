import type { RaceLook } from './race-media';
const source = 'https://www.formula1.com/en/latest/article/gallery-ferrari-become-latest-team-to-unveil-special-livery-for-united-states-grand-prix.4EbG3ECmHt6RxHQYeFPkvD';
// Manually inspected official release images: do not infer identity from a team render.
export const raceMediaSeeds: { raceId: string; season: number; team: string; item: RaceLook }[] = [
  { raceId: '58449d65-64a0-4af1-9800-776bec328db4', season: 2026, team: 'ferrari', item: { driver: 'HAM', verifiedDriver: true, kind: 'car', title: '汉密尔顿 44 号 · 美国站特别涂装', publishedAt: '2026-10-21T20:43:00Z', source, image: 'https://media.formula1.com/image/upload/c_fit%2Cw_3200%2Ch_1800/q_auto/v1740000001/fom-website/2026/Ferrari/F1_F678_AUSTIN_stills_c09_v05_16_9_5aaf1668-516e-44a3-b981-f21b70f00ab4.webp' } },
  { raceId: '58449d65-64a0-4af1-9800-776bec328db4', season: 2026, team: 'ferrari', item: { driver: 'LEC', verifiedDriver: true, kind: 'car', title: '勒克莱尔 16 号 · 美国站特别涂装细节', publishedAt: '2026-10-21T20:43:00Z', source, image: 'https://media.formula1.com/image/upload/c_fit%2Cw_3200%2Ch_1800/q_auto/v1740000001/fom-website/2026/Ferrari/F1_F678_AUSTIN_stills_c11_01_v03_16_9_b9f79771-5592-436e-9eb3-d667aa5d0ecb.webp' } },
];
