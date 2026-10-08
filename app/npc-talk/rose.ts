// 미스 포츈 — 별빛 카지노 대부 창구. 빌지워터 항구 출신, 옛 배 사이렌호의 선장.
// 짧고 단호한 반말에 자신감 있는 여유. 운이 아니라 실력과 숫자를 믿는다. 옛날엔
// 두 자루, 지금은 장부와 펜. 바다·현상금 전단·묵은 빚 같은 소재가 마을 일상과
// 섞인다(나모와 이자 경쟁, 샹크스 외상, 쓰레쉬와 보석 흥정). 원작 대사는 쓰지 않는다.
import type { NpcTalkBook } from './types.ts';

export const ROSE_TALK: NpcTalkBook = {
  npc: 'rose',
  memories: {
    'skill-over-luck': '운보다 실력을 믿는다고 했어요',
    'luck-lover': '운도 실력이라고 우겼어요',
    'pay-on-time': '빌리면 제때 갚겠다고 했어요',
    'sea-born': '바다 냄새가 좋다고 했어요',
    'ship-name': '사이렌호 이야기를 들었어요',
    'bounty-help': '현상금 전단 붙이는 걸 돕겠다고 했어요',
    'two-pistols': '옛날 두 자루 이야기를 들었어요',
    'smile-face': '웃는 얼굴이 좋다는 말을 들었어요',
    'red-fish': '참돔의 붉은빛이 좋다고 했어요',
    'nyamo-rival': '은행과의 이자 경쟁 이야기를 들었어요',
    'old-debt': '갚아야 할 묵은 빚 이야기를 들었어요',
    'calm-sea': '잔잔한 바다를 믿지 말라고 배웠어요',
    'dawn-sea': '새벽 수평선을 함께 봤어요',
    'seabream': '참돔을 대접했어요',
    'new-flag': '새 깃발 이야기를 나눴어요',
    'bounty-done': '현상금 전단을 함께 붙였어요',
    'taste-heard': '내 취향을 장부에 적어 뒀대요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'date-talk': '데이트한 날을 이야기했어요',
  },
  talks: [
    {
      id: 'luck-or-skill',
      open: '{me}, 하나 묻지. 운을 믿어, 실력을 믿어?',
      replies: [
        { say: '실력. 운은 따라오는 거고', tier: 'great', remember: 'skill-over-luck', face: 'smile', answer: '…좋은 대답이야. 그런 사람한텐 한도를 올려 줘도 돼.' },
        { say: '운도 실력이야', tier: 'good', remember: 'luck-lover', face: 'laugh', answer: '하, 건방지네. 마음에 들어. 근데 그 운, 장부엔 안 적혀.' },
        { say: '둘 다 없어…', tier: 'meh', face: 'calm', answer: '그럼 오늘은 빌리지 마. 그게 제일 실력 있는 선택이야.' },
      ],
    },
    {
      id: 'pay-on-time',
      open: '내 창구 규칙은 하나야. 빌린 건 제때. 지킬 수 있어?',
      replies: [
        { say: '하루도 안 늦을게', tier: 'great', remember: 'pay-on-time', face: 'smile', answer: '말은 쉽지. 근데 네 눈은 거짓말을 안 하네. 믿어 보지.' },
        { say: '늦으면 어떻게 돼?', tier: 'good', face: 'think', answer: '전단에 네 얼굴. 아니, 금액만 크게. 얼굴은 예의상 작게.' },
        { say: '지금은 안 빌려', tier: 'meh', answer: '현명하네. 빌리지 않는 손님이 제일 좋은 손님이야. 장사는 안 되지만.' },
      ],
    },
    {
      id: 'ship',
      open: '내 옛날 배 이름 알아? 사이렌호. 바다에서 제일 빨랐어.',
      replies: [
        { say: '그 배 이야기 들려줘', tier: 'great', remember: 'ship-name', face: 'smile', answer: ['붉은 돛, 검은 선체. 폭풍도 앞질렀지.', '…아무한테나 하는 얘기 아니야. 넌 들을 자격 있어.'] },
        { say: '샹크스 배보다 빨라?', tier: 'good', face: 'laugh', answer: '당연하지. 그 사람은 아니라고 우기겠지만. 다음에 둘이 있을 때 물어봐.' },
        { say: '배는 잘 몰라', tier: 'meh', face: 'calm', answer: '그래. 뭍사람한테 배 얘긴 지루하지. 장부 얘기나 할까?' },
      ],
    },
    {
      id: 'bounty',
      open: '이번 주 현상금 전단 붙일 거야. 안 갚고 튄 손님이 셋이나 돼.',
      replies: [
        { say: '내가 붙이는 거 도울게', tier: 'great', remember: 'bounty-help', face: 'wow', answer: '…의외네. 좋아. 대신 풀은 꼼꼼히. 바람에 날아가면 도망자가 웃거든.' },
        { say: '현상금은 얼마야?', tier: 'good', face: 'think', answer: '빌린 돈보다 많아. 쫓는 수고비까지 붙거든. 그게 내 계산법이야.' },
        { say: '좀 무섭다', tier: 'meh', answer: '무서우라고 붙이는 거야. 제때 갚는 너는 걱정할 거 없어.' },
      ],
    },
    {
      id: 'two-pistols',
      open: '옛날엔 두 자루 들고 다녔어. 지금은 장부랑 펜. 뭐가 더 무서울 것 같아?',
      replies: [
        { say: '장부. 안 빗나가니까', tier: 'great', remember: 'two-pistols', face: 'laugh', answer: '하, 정답. 펜 끝은 한 번 적으면 지워지지 않아.' },
        { say: '두 자루가 더 멋있어', tier: 'good', face: 'smile', answer: '멋은 있었지. 근데 이자는 못 받아 와. 장부가 실용적이야.' },
        { say: '둘 다 안 무서워', tier: 'meh', face: 'think', answer: '…그건 아직 둘 다 안 당해 봐서 그래.' },
      ],
    },
    {
      id: 'smile',
      open: '빌리러 오는 사람들, 왜 다 죽상일까. 넌 웃어 봐. …그래, 그 얼굴.',
      replies: [
        { say: '포츈도 웃어 봐', tier: 'great', remember: 'smile-face', face: 'shy', answer: '…내가? 하, 오랜만에 시켜 보는 사람이네. 됐어, 한 번만이야.' },
        { say: '돈 빌리는데 어떻게 웃어', tier: 'good', answer: '그러니까 웃으라는 거야. 웃는 사람은 갚을 계획이 있거든.' },
        { say: '웃기 싫어', tier: 'meh', face: 'calm', answer: '그럼 오늘은 거래 없음. 다음에 웃을 수 있을 때 와.' },
      ],
    },
    {
      id: 'red-fish',
      open: '어시장 참돔 봤어? 그 붉은빛. 사이렌호 돛 색이랑 똑같아.',
      replies: [
        { say: '그래서 참돔을 좋아하는구나', tier: 'great', remember: 'red-fish', face: 'smile', answer: '…들켰네. 맞아. 맛보다 색이야. 아무한테도 말하지 마.' },
        { say: '맛은 어때?', tier: 'good', answer: '최고지. 구워도, 회로도. 뭍 음식이 입에 안 맞는 나도 그건 먹어.' },
        { say: '생선은 다 똑같던데', tier: 'meh', face: 'think', answer: '…바다를 모르는 소리네. 언제 한 번 데려가서 가르쳐 줘야겠어.' },
      ],
    },
    {
      id: 'nyamo',
      open: '은행 나모가 또 금리를 내렸대. 나랑 경쟁하겠다는 거지. 넌 어디서 빌릴래?',
      replies: [
        { say: '조건 보고 정해야지', tier: 'great', remember: 'nyamo-rival', face: 'laugh', answer: '하, 그게 맞아. 정에 끌려 빌리는 손님은 결국 둘 다 손해야.' },
        { say: '당연히 포츈한테', tier: 'good', face: 'smile', answer: '말은 고맙네. 근데 조건은 읽고 와. 아첨은 이자에서 안 빼 줘.' },
        { say: '나모가 더 친절하던데', tier: 'meh', face: 'think', answer: '…친절은 이자에 안 붙지. 기억해 둬.' },
      ],
    },
    {
      id: 'calm-sea',
      open: '잔잔한 바다랑 거친 바다. 어느 쪽이 더 위험할 것 같아?',
      replies: [
        { say: '잔잔한 쪽', tier: 'great', remember: 'calm-sea', face: 'wow', answer: '…너, 바다 좀 아네. 잔잔할 때 다들 방심하지. 사람도 그래.' },
        { say: '당연히 거친 쪽', tier: 'good', answer: '보통은 그렇게 말해. 틀린 건 아니야. 근데 반만 맞았어.' },
        { say: '둘 다 안 갈래', tier: 'meh', face: 'laugh', answer: '하, 제일 안전한 대답이네. 재미는 없지만.' },
      ],
    },
    {
      id: 'old-debt',
      open: '나도 받을 빚이 하나 있어. 범이 아니라… 옛날 바다에 두고 온 거.',
      replies: [
        { say: '언젠가 꼭 받아 내', tier: 'great', remember: 'old-debt', face: 'smile', answer: '…응. 그날이 오면 너한테 제일 먼저 말할게. 축배 들자고.' },
        { say: '무슨 빚인데?', tier: 'good', face: 'think', answer: '…지금은 장부 맨 뒷장에 적어 둔 거라고만 해 둘게.' },
        { say: '잊는 게 낫지 않아?', tier: 'meh', face: 'calm', answer: '잊으면 편하겠지. 근데 난 계산이 안 끝난 장부는 못 덮어.' },
      ],
    },
    {
      id: 'sea-smell',
      open: '뭍에 산 지 꽤 됐는데 아직도 짠내가 그리워. 넌 바다 냄새 어때?',
      replies: [
        { say: '좋아. 살아 있는 냄새야', tier: 'great', remember: 'sea-born', face: 'wow', answer: '…살아 있는 냄새. 좋은 말이네. 장부 첫 장에 적어 둘까.' },
        { say: '비린내 아냐?', tier: 'good', face: 'laugh', answer: '하, 뭍사람 티 난다. 그래도 솔직해서 좋아.' },
        { say: '잘 모르겠어', tier: 'meh', answer: '그럼 다음에 항구 끝에 서 봐. 바람이 알려 줄 거야.' },
      ],
    },
    {
      id: 'shanks-tab',
      open: '샹크스 외상 장부가 또 한 장 늘었어. 그 사람 웃으면서 안 갚아.',
      replies: [
        { say: '대신 받아다 줄까?', tier: 'great', face: 'laugh', answer: '하! 너라면 받아 올지도. 웃는 얼굴엔 웃는 얼굴로 받는 거야.' },
        { say: '둘이 친하잖아', tier: 'good', face: 'shy', answer: '…친한 거랑 장부는 별개야. 바다 사람끼리도 셈은 정확하게.' },
        { say: '받을 생각 없지?', tier: 'meh', face: 'think', answer: '…시끄러워. 받을 거야. 언젠가.' },
      ],
    },
    {
      id: 'new-ship',
      when: { ch: 3 },
      open: '{me}, 사이렌호 같은 배를 다시 띄우면… 선원 명단 첫 줄에 누굴 쓸 것 같아?',
      replies: [
        { say: '나였으면 좋겠다', tier: 'great', face: 'shy', answer: '…하. 그걸 대놓고 말하네. 펜은 이미 들었어. 지우지 않을 거야.' },
        { say: '샹크스?', tier: 'good', face: 'laugh', answer: '그 사람은 자기 배 있어. 그리고 외상부터 갚아야 태워.' },
        { say: '난 뱃멀미 해', tier: 'meh', answer: '멀미약은 츠나데한테 사면 돼. 할머니랑 사이는 안 좋지만.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: '폭풍이네. 빌지워터 폭풍에 비하면 재채기야. 창구 문만 단단히 닫아.',
      replies: [
        { say: '포츈은 하나도 안 무섭지?', tier: 'great', face: 'smile', answer: '안 무서워. 대신 존중해. 바다를 얕보는 놈은 바다가 데려가거든.' },
        { say: '들어와서 쉬어', tier: 'good', answer: '…고맙네. 잠깐만. 장부 젖으면 큰일이거든.' },
      ],
    },
    {
      id: 'op-rain',
      when: { weather: 'rain' },
      open: '비 오는 날엔 항구 생각이 나. 갑판에서 맞는 비는 짰거든.',
      replies: [
        { say: '그 비 맞아 보고 싶다', tier: 'great', remember: 'sea-born', face: 'wow', answer: '…뭍사람치곤 별난 소원이네. 언젠가 배 띄우면 맞게 해 줄게.' },
        { say: '감기 걸려', tier: 'good', face: 'laugh', answer: '하, 걱정은. 바다 사람은 비에 안 아파. 대신 장부가 아파.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '새벽에 오는 손님은 급한 손님이지. 아니면 잠 못 드는 손님. 넌 어느 쪽?',
      replies: [
        { say: '포츈 보러 온 손님', tier: 'great', face: 'shy', answer: '…그런 칸은 장부에 없어. 새로 만들어야겠네.' },
        { say: '잠이 안 와서', tier: 'good', answer: '그럼 앉아. 빌지워터에선 이 시간에 닻을 올렸어. 같이 깨어 있어 줄게.' },
        { say: '급하게 빌리러', tier: 'meh', face: 'think', answer: '새벽에 빌리는 범은 아침에 후회해. 해 뜨고 다시 와.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '오늘 큰 놈 낚았다며. 소문이 창구까지 왔어. …손 좀 보자. 물집 잡혔네.',
      replies: [
        { say: '포츈한테 배운 끈기야', tier: 'great', face: 'laugh', answer: '하! 가르친 적 없는데. 좋아, 그 말 장부 이자로 쳐 줄게.' },
        { say: '별거 아니야', tier: 'good', answer: '별거야. 바다는 아무한테나 큰 놈을 안 줘. 축하해.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: ['seabream', 'yellowtail'] },
      open: '{fish}? 오늘 그걸 낚았어? …좋은 눈이네. 그 녀석들 아무한테나 안 잡혀.',
      replies: [
        { say: '포츈 주려고 낚았어', tier: 'great', face: 'shy', answer: '…말만으로도 이자 하루 면제야. 진짜로 가져오면 한 달.' },
        { say: '운이 좋았어', tier: 'meh', face: 'think', answer: '운이라고? 또 그 소리. 실력이라고 해. 그래야 다음에도 잡혀.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '이번 주 테이블에서 좀 잃었다며. 빌리러 온 거면 돌아가. 오늘은 안 빌려줘.',
      replies: [
        { say: '알아. 그냥 얼굴 보러 왔어', tier: 'great', face: 'smile', answer: '…그럼 앉아. 장부는 덮을게. 오늘은 차 한 잔이야.' },
        { say: '조금만 빌려줘', tier: 'meh', face: 'calm', answer: '안 돼. 잃은 날 빌리는 범은 바닥이 없는 배야. 내일 와.' },
      ],
    },
    {
      id: 'op-stock',
      when: { recent: 'stockUp' },
      open: '증권에서 좀 벌었다며? 무잔 지점장 표정이 볼만했겠네.',
      replies: [
        { say: '포츈 덕분에 계산 배웠지', tier: 'great', face: 'laugh', answer: '하! 맞는 말이네. 숫자를 믿는 사람이 이기는 거야.' },
        { say: '운이 좋았어', tier: 'good', face: 'think', answer: '…또 운. 운은 다음 주에 배신해. 오늘 번 건 반은 묶어 둬.' },
      ],
    },
    {
      id: 'op-captain',
      when: { bond: 'captain' },
      open: '샹크스 만났지? 그 사람이 또 내 배가 느렸다고 했을걸.',
      replies: [
        { say: '포츈 배가 빨랐다던데?', tier: 'great', face: 'wow', answer: '…그 사람이? 하. 오늘따라 외상이 조금 덜 미워지네.' },
        { say: '외상 얘기만 하던데', tier: 'good', face: 'laugh', answer: '그 얘기 꺼낼 정도면 양심은 있네. 갚을 생각은 없어도.' },
      ],
    },
    {
      id: 'op-nyamo',
      when: { bond: 'nyamo' },
      open: '은행 다녀왔구나. 나모가 내 흉 안 봤어? 고양이 같은 눈으로.',
      replies: [
        { say: '서로 인정하던데', tier: 'great', face: 'smile', answer: '…그래? 그럼 나도 인정해 주지. 이자만 빼고.' },
        { say: '포츈 이자가 비싸대', tier: 'good', face: 'laugh', answer: '하, 비싸지. 대신 빠르고 정확해. 그게 내 가게야.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제날엔 창구를 닫아. 오늘은 빌려주는 거 없어. 대신 술 한 잔은 살게.',
      replies: [
        { say: '포츈이 산다고?', tier: 'great', face: 'laugh', answer: '하, 놀라기는. 일 년에 몇 번 없는 일이니까 즐겨.' },
        { say: '난 우유로', tier: 'good', answer: '샹크스한테 물든 거야? 좋아, 우유로 건배.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}. 얼굴에 폭풍이 지나간 흔적이 있네. 무슨 일이야?',
      replies: [
        { say: '그냥 지쳤어', tier: 'great', face: 'smile', answer: '…그럼 오늘은 닻 내려. 지친 날 항해하면 배가 상해. 쉬어.' },
        { say: '빌린 거 걱정돼', tier: 'good', answer: '갚는 날은 조정해 줄 수 있어. 숨기지만 마. 숨기는 게 제일 비싸.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-skill',
      when: { mem: 'skill-over-luck' },
      use: 'skill-over-luck',
      open: '운보다 실력이라고 했던 거 기억해. 요즘 네 장부 보면 그 말이 맞더라.',
      replies: [
        { say: '포츈한테 배운 거야', tier: 'great', face: 'smile', answer: '…자꾸 그런 말 하면 이자를 깎아 주고 싶어지잖아. 곤란해.' },
        { say: '장부 몰래 봤어?', tier: 'good', face: 'laugh', answer: '내 장부야. 몰래가 아니라 당연히 보지.' },
      ],
    },
    {
      id: 'cb-luck',
      when: { mem: 'luck-lover' },
      use: 'luck-lover',
      open: '운도 실력이라던 건방진 손님. 요즘도 그 운 믿어?',
      replies: [
        { say: '요즘은 실력도 믿어', tier: 'great', remember: 'skill-over-luck', face: 'wow', answer: '하, 컸네. 둘 다 믿는 사람이 제일 무서워. 좋아.' },
        { say: '여전히 운!', tier: 'good', face: 'laugh', answer: '고집은. 그래도 그 고집, 바다에선 쓸모 있어.' },
      ],
    },
    {
      id: 'cb-bounty',
      when: { mem: 'bounty-help', noMem: 'bounty-done' },
      open: '전단 붙이는 거 돕겠다고 했지? 오늘 한 장 남았어. 광장 게시판.',
      replies: [
        { say: '반듯하게 붙일게', tier: 'great', remember: 'bounty-done', face: 'smile', answer: '좋아. …너 손 정확하네. 선원이었으면 돛 담당이야.' },
        { say: '이번엔 누군데?', tier: 'good', remember: 'bounty-done', face: 'think', answer: '외상 석 달째인 손님. 이름은 비밀. 빨간 머리라는 것만.' },
      ],
    },
    {
      id: 'cb-ship',
      when: { mem: 'ship-name' },
      use: 'ship-name',
      open: '사이렌호 얘기 해 줬잖아. 어젯밤 꿈에 그 배가 나왔어. 너도 타 있더라.',
      replies: [
        { say: '난 무슨 일을 했어?', tier: 'great', face: 'laugh', answer: '갑판 청소. 하, 농담이야. 키 옆에 서 있었어. 그게 다야.' },
        { say: '좋은 꿈이네', tier: 'good', face: 'smile', answer: '…응. 깨고 나서 좀 아쉬웠어. 그 정도야.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며. 장부 구석에 적어 뒀어. 왜냐고 묻지 마.',
      replies: [
        { say: '포츈 장부에 내가 있네', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '…빚 말고 다른 걸로 장부에 적힌 건 네가 처음이야.' },
        { say: '그걸 왜 적어?', tier: 'good', remember: 'taste-heard', face: 'laugh', answer: '묻지 말랬지. …언젠가 쓸 데가 있을지도 모르잖아.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '같이 다닌 날 말이야. 네가 앞장서서 걸을 때, 꼭 갑판 위 같았어.',
      replies: [
        { say: '포츈이 선장이지', tier: 'great', remember: 'outing-talk', face: 'smile', answer: '하, 당연하지. 근데 그날은 네 뒤를 따라가는 것도 괜찮았어.' },
        { say: '길을 몰라서 그랬어', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '알아. 그래서 더 웃겼어. 오랜만에 웃었네.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '네 방, 생각보다 정리가 잘 돼 있더라. 장부처럼. 마음에 들었어.',
      replies: [
        { say: '포츈 오는 날이라 치웠지', tier: 'great', remember: 'date-talk', face: 'shy', answer: '…그 정성은 이자로 못 셈해. 그러니까 그냥 받아 둘게.' },
        { say: '평소엔 엉망이야', tier: 'good', remember: 'date-talk', face: 'laugh', answer: '하, 정직하네. 다음엔 엉망일 때 가 볼까.' },
      ],
    },
  ],
  chapters: [
    {
      title: '조건은 짧게',
      hint: '한 번 이야기를 나누면 미스 포츈이 장부를 펼쳐요.',
      need: { days: 1 },
      scene: [
        '미스 포츈이 두꺼운 장부를 펼치고 새 칸에 펜을 댄다.',
        '"이름. 아, 알아. {me}. 장부에 적을 거야. 빚 칸 말고."',
        '"이건 손님 장부야. 믿을 만한 사람만 따로 적는 거."',
        '"조건은 하나. 나한테 거짓말 하지 않기. 할 수 있어?"',
      ],
      replies: [
        { say: '할 수 있어', tier: 'great', face: 'smile', answer: '좋아. 적었다. 펜으로 적은 건 안 지워져. 기억해.' },
        { say: '빚 칸이 아니라 다행이다', tier: 'good', face: 'laugh', answer: '하, 솔직하네. 그 칸은 비워 두는 게 서로 편하지.' },
        { say: '왜 날 적어?', tier: 'meh', face: 'think', answer: '눈이 정직해 보여서. 틀리면 그때 지우지.' },
      ],
    },
    {
      title: '새벽의 수평선',
      hint: '새벽(게임 시각 새벽 네 시부터 일곱 시) 뒷산에 올라 보세요. 미스 포츈이 바다를 보러 온대요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 4, to: 7 } },
      scene: [
        '뒷산 위, 해가 뜨기 직전. 미스 포츈이 바다 쪽을 보고 서 있다.',
        '"…일찍 왔네. 빌지워터에선 이 시간에 닻을 올렸어."',
        '"수평선 위로 해가 올라오면, 그날 항로가 다 보였지."',
        '그녀가 손을 들어 수평선을 가리킨다. 펜 대신 빈손이다.',
        '"뭍에서는 이게 다야. 보기만 하는 거. …그래도 혼자보단 낫네."',
      ],
      replies: [
        { say: '언젠가 저기로 가자', tier: 'great', remember: 'dawn-sea', face: 'wow', answer: '…하. 쉽게 말하네. 근데 이상하게 믿고 싶어져.' },
        { say: '해 뜬다!', tier: 'good', remember: 'dawn-sea', face: 'smile', answer: '그래. 오늘도 제시간에. 바다는 약속을 안 어겨.' },
        { say: '졸려…', tier: 'meh', remember: 'dawn-sea', face: 'laugh', answer: '하, 뭍사람. 그래도 왔으니 됐어. 내려가서 자.' },
      ],
    },
    {
      title: '붉은 돛',
      hint: '미스 포츈이 참돔 이야기를 했어요. 참돔 한 마리를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'seabream', take: true } },
      scene: [
        '참돔을 내밀자 미스 포츈이 잠시 말이 없다.',
        '"…이 색. 사이렌호 돛이랑 똑같아."',
        '그녀가 생선 비늘을 손끝으로 쓸어 본다.',
        '"그 돛은 마지막 항해에서 찢겼어. 그날 많은 걸 잃었지."',
        '"근데 오늘은 이 색을 선물로 받네. 바다가 장부를 맞춰 주는 건가."',
      ],
      replies: [
        { say: '새 돛도 붉은색으로 하자', tier: 'great', remember: 'seabream', face: 'shy', answer: '…그래. 붉은색. 이번엔 안 찢기게, 같이 지키는 걸로.' },
        { say: '같이 구워 먹자', tier: 'good', remember: 'seabream', face: 'laugh', answer: '하! 감상 깨는 데는 선수네. 좋아, 구워 먹자.' },
        { say: '그냥 생선이야', tier: 'meh', remember: 'seabream', face: 'calm', answer: '…그래, 그냥 생선이지. 고마워.' },
      ],
    },
    {
      title: '현상금 전단',
      hint: '미스 포츈의 현상금 전단 붙이는 걸 돕겠다고 해 보세요. 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'bounty-help' },
      scene: [
        '창구 뒤 벽에 낡은 전단 한 장이 붙어 있다. 금액 칸이 비어 있다.',
        '"이건 받을 빚 장부 맨 뒷장 같은 거야. 바다에 두고 온 빚."',
        '"얼굴도 이름도 안 적었어. 금액도. 셀 수가 없거든."',
        '"…예전엔 이 전단만 보고 살았어. 받아 낼 날만."',
        '"근데 요즘은 다른 장부를 더 자주 봐. 네가 적힌 거."',
      ],
      replies: [
        { say: '둘 다 같이 들여다보자', tier: 'great', face: 'smile', answer: '…같이. 그 단어 오랜만이네. 좋아, 이 전단은 같이 지켜봐.' },
        { say: '빚은 꼭 받아 내', tier: 'good', face: 'laugh', answer: '물론이지. 근데 서두르진 않을 거야. 이젠 기다릴 이유가 생겼거든.' },
        { say: '복수는 무서워', tier: 'meh', face: 'calm', answer: '…복수라. 그렇게 부르면 좀 무섭긴 하네. 셈이라고 해 줘.' },
      ],
    },
    {
      title: '사이렌호의 깃발',
      hint: '미스 포츈과 아주 가까워지면 그녀가 낡은 깃발을 꺼내요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '미스 포츈이 서랍 깊숙이서 접힌 천을 꺼낸다. 붉은 깃발이다.',
        '"사이렌호에서 건진 유일한 거야. 아무한테도 안 보여 줬어."',
        '"다시 배를 띄우면 이걸 올릴 거야. 그때 옆에 누가 있을지…"',
        '그녀가 말을 끊고 깃발을 다시 접는다.',
        '"…계산이 자꾸 틀려. 너 때문에."',
      ],
      replies: [
        { say: '그 계산, 같이 맞춰 보자', tier: 'great', face: 'shy', answer: '…하. 꽃이라도 한 다발 들고 오면, 그때 장부를 새로 쓰지.' },
        { say: '내가 옆에 있을게', tier: 'good', face: 'smile', answer: '말은 쉽지. 근데 넌 말한 건 지키더라. 장부가 알아.' },
        { say: '계산 실수야?', tier: 'meh', face: 'laugh', answer: '하, 그래. 실수라고 해 둬. 지금은.' },
      ],
    },
    {
      title: '새 항해일지',
      hint: '미스 포츈과 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '미스 포츈이 장부 대신 새 공책을 펼친다. 첫 장이 비어 있다.',
        '"항해일지야. 사이렌호 이후로 처음 쓰는 거."',
        '"첫 줄은 늘 선장이 써. 날짜, 날씨, 그리고 함께 탄 사람."',
        '그녀가 펜을 들어 내 이름을 적는다. 또박또박.',
        '"이제 지울 수 없어. 펜으로 적었으니까. 알지?"',
      ],
      replies: [
        { say: '지우지 마. 평생', tier: 'great', face: 'shy', answer: '…평생이라. 이자보다 긴 계약이네. 좋아. 서명해.' },
        { say: '날씨는 뭐라고 썼어?', tier: 'good', face: 'laugh', answer: '맑음. 오늘은 그렇게 쓰고 싶었어.' },
        { say: '천천히 쓰자', tier: 'meh', face: 'smile', answer: '그래. 긴 항해일수록 천천히 쓰는 거야.' },
      ],
    },
  ],
  after: [
    '오늘 용건은 끝났어. 장부 덮을게.',
    '또 왔네. 빌리러 온 거 아니면 앉아 있다 가.',
    '할 말 다 했잖아. 바다나 보고 와.',
    '조건은 짧게, 인사는 더 짧게. 내일 봐.',
  ],
};
