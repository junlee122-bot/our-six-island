// 생일 인사: on a friend's birthday every resident opens the talk with a
// birthday line (lounge-npc-dialog.ts npcTalk), in their own voice. A lover,
// fiancé(e) or spouse says something warmer and hands over a small present
// once that day (op 'bdayGift', lounge-romance.ts). Same writing rules as the
// love lines (design-romance.md 3장): 60 characters, no emoji or English, no
// josa right after a {placeholder}. Everyone in the village is an adult.
import { hash32 } from './lounge-calendar.ts';
import type { NpcId } from './lounge-npc-data.ts';

/** Two birthday greetings per resident ({me} = the birthday friend). */
export const NPC_BIRTHDAY_LINES: Readonly<Record<NpcId, readonly string[]>> = {
  lumi: ['{me}, 생일 축하해! 오늘은 딜러 말고 가수로 축하할게.', '생일이지? 축하 노래 한 곡, 박자 맞춰서 갈게!'],
  maehwa: ['{me}, 생일 축하해. 오늘은 판 접고 언니가 제일 좋은 차를 내줄게.', '생일이구나. 오늘 패는 전부 네 거야. 미역국 안 먹었으면 회관으로 오렴.'],
  captain: ['{me}! 생일이라며? 오늘은 내가 쏜다, 잔치하자!', '생일 축하한다! 하하하, 주점 종을 세 번 울려 주마!'],
  realtor: ['{me} 님, 생일 축하드려요! 오늘은 영업 없이 축하만 할게요.', '생일이시죠? 미선 씨가 달력에 크게 적어 놨더라고요.'],
  misun: ['{me} 님, 생일 축하해요! 오늘은 공사비 얘기 안 할게요.', '생일 축하드려요. 형만 씨랑 둘이서 박수 쳤어요.'],
  carpenter: ['{me}, 니 생일이라매. …축하한다. 두 번은 안 한다.', '생일이가? 오늘만 대패질 쉬고 박수 쳐 준다.'],
  rose: ['{me}, 생일이라며. 오늘 이자는 없어. 축하해.', '생일 축하해. 장부에 적어 둘게. 오늘은 좋은 날이라고.'],
  nyamo: ['{me} 님, 생일 축하해요! 오늘 창구는 축하 전용이에요.', '생일이세요? 고등어 대신 케이크 먹을래요. 축하해요.'],
  gwen: ['{me} 님, 생일 축하해요! 오늘 머리는 제가 특별히 봐 드릴게요.', '생일이시죠? 오늘 제일 빛나는 사람은 {me} 님이에요.'],
  nasera: ['{me}. 생일이라 들었습니다. 축하합니다. 진심입니다.', '생일 축하합니다. 오늘 하루는 매입가보다 귀합니다.'],
  frieren: ['{me}, 생일이구나. 축하해. 빵 하나 더 구워 둘게.', '생일 축하해. 오래 사는 나도 이런 날은 좋아.'],
  thresh: ['{me}, 생일 축하해요. 오늘은 제가 뭘 사 드려야겠네요.', '생일이시군요. 좋은 날은 오래 기억해 둘게요.'],
  sinjjajang: ['{me} 님! 생일 축하드립니다! 축하 우편 배달 완료입니다!', '생일이십니까! 오늘 하루 무사히, 행복하게 보내십시오!'],
  volibas: ['어이, {me}! 생일이라며? 오늘 마을 평화는 네 거다!', '생일 축하한다! 파출소에서 박수 세 번 쳐 줄게!'],
  janna: ['속보입니다! 오늘은 {me} 님 생일이에요! 축하해요!', '오늘의 주요 소식은 {me} 님 생일이에요! 행복하세요!'],
  gabung: ['{me}! 생일이라며! 오늘 바다는 너를 위해 잔잔하다!', '생일 축하한다! 방파제에서 크게 외쳐 주마!'],
  lux: ['{me} 님, 생일 축하해요! 오늘 제일 좋은 물고기 보여 드릴게요.', '생일이세요? 어시장 모두가 축하하고 있어요!'],
  himmel: ['{me}, 생일 축하해! 용사의 이름으로 오늘을 기념할게.', '생일이구나! 동상은 없지만 박수는 크게 쳐 줄게.'],
  beatrice: ['{me}, 생일인 거야? …축하해 주는 거야. 특별히.', '생일 축하하는 거야. 오늘만 도서관에서 떠들어도 되는 거야.'],
  bocchi: ['{me} 씨… 생, 생일 축하해요…! 큰 소리로 말해 봤어요…!', '생일이시죠…? 축하곡을 마음속으로 연주하고 있어요…'],
  tsunade: ['{me}! 생일이라며? 오늘은 밭일 빼고 푹 쉬어라!', '생일 축하한다! 미역국 끓여 놨으니 먹고 가!'],
  makima: ['{me} 씨, 생일 축하해요. 오늘 원하는 건 다 말해 봐요.', '생일이군요. 오늘은 내가 기억해 줄게요. 오래요.'],
  yanineko: ['어, {me}. 생일이라며. 귀찮지만 축하는 해 줄게.', '생일 축하해. 볕 좋은 자리 오늘은 너 줄게.'],
  muzan: ['{me}, 생일을 축하드립니다. 오늘만큼은 시세보다 귀하군요.', '생일이시군요. 오늘 하루는 상한가로 기록해 두지요.'],
  nilah: ['{me}! 생일이라며! 축하해! 양들도 같이 축하한대!', '생일 축하해! 오늘 초원 바람은 다 네 거야!'],
  haku: ['{me} 님, 생일 축하해요. 이름 불러 드릴 수 있어서 기뻐요.', '생일이세요? 오늘 딴 과일 중에 제일 고운 걸 드릴게요.'],
  ornn: ['{me}. 생일이라고. 축하한다. 모루도 한 번 울려 주지.', '생일 축하한다. 오늘은 연장 말고 너를 본다.'],
  mercy: ['{me} 씨, 생일 축하해요! 오늘 처방은 푹 쉬기예요.', '생일이에요? 건강하게 한 살 더 먹은 걸 축하해요.'],
  shinichi: ['{me}, 생일이지? 추리할 필요도 없어. 축하해!', '생일 축하해! 오늘 운세는 볼 것도 없이 대길이야.'],
};
/** For a resident without their own lines yet (polite, fits most voices). */
export const NPC_BIRTHDAY_GENERIC: readonly string[] = [
  '{me} 님, 생일 축하해요! 오늘 하루 좋은 일만 있길 바라요.',
  '오늘 {me} 님 생일이죠? 마을 모두가 축하하고 있어요.',
  '생일 축하드려요! 광장에 케이크가 있대요. 가 보세요.',
];
/** Residents who speak casually (반말); their lover lines are casual too. */
const CASUAL = new Set<NpcId>(['lumi', 'maehwa', 'captain', 'carpenter', 'rose', 'frieren', 'volibas', 'gabung', 'himmel', 'beatrice', 'tsunade', 'yanineko', 'nilah', 'ornn', 'shinichi']);
/** A partner's birthday words (the first page; {me} = the birthday friend). */
export const NPC_BIRTHDAY_LOVE = {
  casual: ['{me}, 생일 축하해. 오늘은 하루 종일 네 편이야.', '생일이잖아. 너를 만난 게 올해 제일 좋은 일이야.'],
  polite: ['{me} 님, 생일 축하해요. 오늘은 제가 제일 먼저 축하하고 싶었어요.', '생일 축하해요. 함께 맞는 생일이라 더 기뻐요.'],
} as const;
/** A partner's present (the next page; {item} = what they hand over). */
export const NPC_BIRTHDAY_GIFT = {
  casual: ['이거 받아. {item}. 오래 고민해서 골랐어.', '생일 선물이야. {item}. 마음에 들었으면 좋겠다.'],
  polite: ['생일 선물이에요. {item}. 오래 고민해서 골랐어요.', '이거 받아 주세요. {item}. 마음에 들면 좋겠어요.'],
} as const;

const pick = (list: readonly string[], key: string) => list[hash32(key) % list.length] ?? list[0];
/** The birthday opener of `npc` for today (`key` keeps it the same all day). */
export function npcBirthdayLine(npc: NpcId, key: string, partner = false) {
  if (partner) return pick(NPC_BIRTHDAY_LOVE[CASUAL.has(npc) ? 'casual' : 'polite'], `bday-love:${key}`);
  return pick(NPC_BIRTHDAY_LINES[npc] ?? NPC_BIRTHDAY_GENERIC, `bday:${key}`);
}
/** The partner's present line (fill {item} with the item's name). */
export const npcBirthdayGiftLine = (npc: NpcId, key: string) => pick(NPC_BIRTHDAY_GIFT[CASUAL.has(npc) ? 'casual' : 'polite'], `bday-gift:${key}`);
/** Every birthday line (tests: the writing rules). */
export const allNpcBirthdayLines = () => [
  ...Object.values(NPC_BIRTHDAY_LINES).flat(),
  ...NPC_BIRTHDAY_GENERIC,
  ...Object.values(NPC_BIRTHDAY_LOVE).flat(),
  ...Object.values(NPC_BIRTHDAY_GIFT).flat(),
];
