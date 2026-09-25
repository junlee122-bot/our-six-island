// 섯다 족보표: every rank of this table (app/lounge-seotda.ts) from the top,
// each with an example pair of real cards. tests/lounge-seotda.test.mjs checks
// that every example scores as its row.
export type SeotdaChartRow = {
  id: string;
  name: string;
  cards: [string, string];
  note: string;
  special?: boolean;
};

export const SEOTDA_CHART: readonly SeotdaChartRow[] = [
  { id: '38', name: '38광땡', cards: ['m03-01', 'm08-01'], note: '3월 광 + 8월 광 · 가장 높아요' },
  { id: '광땡', name: '13·18광땡', cards: ['m01-01', 'm08-01'], note: '1월 광 + 3월이나 8월 광' },
  { id: '땡', name: '땡', cards: ['m10-01', 'm10-02'], note: '같은 월 두 장 · 장땡(10)부터 삥땡(1)' },
  { id: '알리', name: '알리', cards: ['m01-02', 'm02-02'], note: '1월 + 2월' },
  { id: '독사', name: '독사', cards: ['m01-02', 'm04-02'], note: '1월 + 4월' },
  { id: '구삥', name: '구삥', cards: ['m01-02', 'm09-02'], note: '1월 + 9월' },
  { id: '장삥', name: '장삥', cards: ['m01-02', 'm10-02'], note: '1월 + 10월' },
  { id: '장사', name: '장사', cards: ['m04-02', 'm10-02'], note: '4월 + 10월' },
  { id: '세륙', name: '세륙', cards: ['m04-02', 'm06-02'], note: '4월 + 6월' },
  { id: '갑오', name: '갑오 (9끗)', cards: ['m02-02', 'm07-02'], note: '두 월을 더한 끝자리가 9' },
  { id: '끗', name: '8끗 ~ 1끗', cards: ['m03-02', 'm05-02'], note: '끝자리가 클수록 높아요' },
  { id: '망통', name: '망통 (0끗)', cards: ['m02-02', 'm08-02'], note: '끝자리 0 · 가장 낮아요' },
  {
    id: '암행어사',
    name: '암행어사',
    cards: ['m04-01', 'm07-01'],
    note: '4월 열끗 + 7월 열끗 · 13·18광땡을 잡고, 그 외에는 1끗',
    special: true,
  },
  {
    id: '땡잡이',
    name: '땡잡이',
    cards: ['m03-01', 'm07-01'],
    note: '3월 광 + 7월 열끗 · 1~9땡을 잡고, 그 외에는 망통',
    special: true,
  },
  {
    id: '멍텅구리 구사',
    name: '멍텅구리 구사',
    cards: ['m04-01', 'm09-01'],
    note: '4월 열끗 + 9월 열끗 · 최고 패가 9땡 이하면 재경기',
    special: true,
  },
  {
    id: '구사',
    name: '구사',
    cards: ['m04-02', 'm09-02'],
    note: '4월 + 9월 · 최고 패가 알리 이하면 재경기',
    special: true,
  },
];

/** The chart row a rank label (seotdaRank().label) belongs to. */
export function seotdaChartRow(label: string): SeotdaChartRow | undefined {
  const id =
    label === '38광땡'
      ? '38'
      : label === '13광땡' || label === '18광땡'
        ? '광땡'
        : label.endsWith('땡') && label !== '땡잡이'
          ? '땡'
          : label === '갑오'
            ? '갑오'
            : /^[1-8]끗$/.test(label)
              ? '끗'
              : label;
  return SEOTDA_CHART.find((row) => row.id === id);
}
