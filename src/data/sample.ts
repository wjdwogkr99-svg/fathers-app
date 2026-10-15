import { Mountain } from '../core/types';
// Not an official 100-mountain registry. The official list is intentionally empty until verified.
export const SAMPLE_MOUNTAINS: Mountain[] = [
  { id: 'sample-bukhansan', name: '북한산', region: '서울·경기', official100: false, officialVerified: false },
  { id: 'sample-gwanaksan', name: '관악산', region: '서울·경기', official100: false, officialVerified: false },
  { id: 'sample-seoraksan', name: '설악산', region: '강원', official100: false, officialVerified: false },
  { id: 'sample-dobongsan', name: '도봉산', region: '서울·경기', official100: false, officialVerified: false },
];
export const GENERAL_TIERS = [
  { n: 1, title: '첫걸음 등산가' },
  { n: 5, title: '산길 탐험가' },
  { n: 10, title: '등산 애호가' },
  { n: 30, title: '산악 탐험가' },
  { n: 50, title: '산의 달인' },
];
export const SPECIAL_TIERS = [
  { n: 10, title: '동빛 명산 탐험가' },
  { n: 25, title: '은빛 명산 탐험가' },
  { n: 50, title: '금빛 명산 탐험가' },
  { n: 75, title: '명산 정복가' },
  { n: 100, title: '100대 명산 완주' },
];
