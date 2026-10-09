// 미쿠 — 별빛 카지노 딜러이자 노래하는 버추얼 가수. 밝고 통통 튀는 반말, 카드는
// 박자에 맞춰 돌리고 칩은 메트로놈처럼 센다. 서른아홉은 "삼구, 땡큐". 무대·리허설·
// 흥얼거림, 청록 트윈테일, 리본, 마이크, 리본 묶은 대파는 응원봉 같은 귀여운 소품.
// 원작의 "누구나 노래를 줄 수 있는 가수" 정서를 마을로 옮겨, 마을 사람들이 넣고 가는
// 가사 병으로 노래한다. 장 줄기: 딜러 일과 노래 사이에서 축제 무대에 서기까지,
// 플레이어가 첫 관객이자 가사 친구가 되는 이야기. 더 걸라는 말은 절대 안 한다.
// 예림이·미스 포츈은 언니, 봇치는 공연 친구, 잔나는 취재 파트너, 무잔은 저녁 손님.
// 원작 가사나 대사는 쓰지 않고 분위기만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const LUMI_TALK: NpcTalkBook = {
  npc: 'lumi',
  memories: {
    'sing-along': '노래를 같이 부르자고 했어요',
    'listen-only': '노래는 듣는 쪽이 좋다고 했어요',
    'leek-fan': '파를 좋아한다고 했어요',
    'sweet-drink': '달콤한 음료를 좋아한다고 했어요',
    'flower-cafe': '꽃 핀 카페에 같이 가기로 했어요',
    'stage-fright': '무대가 떨린다는 이야기를 들었어요',
    'first-fan': '첫 번째 팬이 되겠다고 했어요',
    'no-bet': '무리하게 걸지 않겠다고 약속했어요',
    'dance-rhythm': '박자에 맞춰 걷는 법을 배웠어요',
    'compose-help': '새 노래 가사를 같이 쓰기로 했어요',
    'teal-hair': '트윈테일이 예쁘다고 했어요',
    'night-sky': '밤하늘 노래 이야기를 들었어요',
    'plaza-stage': '광장 무대에서 노래를 들었어요',
    'strawberry': '딸기 한 바구니를 함께 나눴어요',
    'encore-promise': '앙코르를 약속했어요',
    'lyric-done': '노래 첫 줄을 함께 지었어요',
    'taste-heard': '내 취향을 노래로 불러 줬어요',
    'outing-talk': '함께 걸은 박자를 이야기했어요',
    'bday-plan': '생일 축하 노래를 약속했어요',
    'lyric-jar': '가사 병에 한 줄을 넣고 왔어요',
    'ribbon-pick': '새 리본 색을 골라 줬어요',
    'mic-name': '마이크에 이름을 지어 줬어요',
    'bug-guard': '벌레가 나오면 지켜 주기로 했어요',
    'hum-signal': '둘만의 흥얼거림 신호를 정했어요',
    'stage-apply': '축제 무대 신청을 응원했어요',
    'voice-reach': '목소리가 닿는다는 이야기를 나눴어요',
    'date-talk': '방에서 부른 노래 이야기를 했어요',
    'festival-stage': '축제 무대에 서기로 했어요',
  },
  talks: [
    {
      id: 'sing-or-listen',
      open: '{me}! 노래는 부르는 게 좋아, 듣는 게 좋아? 난 둘 다!',
      replies: [
        { say: '같이 부르는 게 제일!', tier: 'great', remember: 'sing-along', answer: ['꺄, 최고! 그럼 오늘 퇴근길에 한 소절씩 주고받자.', '틀려도 돼. 같이 부르면 틀린 음도 화음이 되거든. 약속!'] },
        { say: '난 듣는 쪽', tier: 'good', remember: 'listen-only', answer: ['좋아! 관객이 있어야 무대가 완성되거든.', '맨 앞자리 줄게. 대신 박수는 박자 맞춰서!'] },
        { say: '노래는 잘 몰라', tier: 'meh', face: 'calm', answer: '괜찮아! 박수만 쳐도 음악이야. 짝, 짝. 봐, 벌써 잘하잖아.' },
      ],
    },
    {
      id: 'leek',
      open: '비밀 하나 알려 줄까? 나 파 진짜 좋아해. 이상해?',
      replies: [
        { say: '나도 파 좋아!', tier: 'great', remember: 'leek-fan', face: 'wow', answer: ['진짜?! 파 동맹 결성!', '장날에 같이 한 단씩 메고 다니자. 응원봉처럼 흔들면서.'] },
        { say: '파전이라면 좋지', tier: 'good', answer: ['파전 최고지! 파가 두껍게 들어간 걸로.', '예림 언니 부침개도 맛있어. 비 오는 날 얻어먹으러 가.'] },
        { say: '파는 좀 매워', tier: 'meh', face: 'sorry', answer: '에이, 익히면 달아지는데. 언젠가 파의 진가를 알려 줄게.' },
      ],
    },
    {
      id: 'sweet',
      open: '출근 전에 마실 거 고르는 중이야. 딸기 우유, 꽃차, 아이스 커피!',
      replies: [
        { say: '딸기 우유!', tier: 'great', remember: 'sweet-drink', answer: ['역시! 목도 부드러워지고 기분도 분홍색 돼.', '삼구, 아니 땡큐! 오늘 첫 곡은 딸기 맛으로 부를게.'] },
        { say: '꽃차가 목에 좋대', tier: 'good', face: 'think', answer: '오, 똑똑해. 노래하는 사람한텐 꽃차가 보약이래. 오늘은 꽃차.' },
        { say: '커피!', tier: 'meh', face: 'sorry', answer: '커피는 목이 말라서… 딜러 일 끝나면 한 잔 할게.' },
      ],
    },
    {
      id: 'no-bet',
      open: '{me}, 하나만 약속해 줘. 내 테이블에서 무리하게 걸지 않기. 응?',
      replies: [
        { say: '약속할게', tier: 'great', remember: 'no-bet', face: 'smile', answer: ['고마워!', '그 약속이 오늘 들은 노래 중에 제일 좋은 노래야.'] },
        { say: '왜 그런 말을 해?', tier: 'good', face: 'think', answer: ['딜러는 이겨도 안 기뻐.', '손님이 웃으면서 나가는 게 내 박수 소리야.'] },
        { say: '오늘은 운이 좋은데?', tier: 'meh', face: 'sorry', answer: '운은 박자랑 같아. 잘 맞다가 갑자기 엇나가. 조심해 줘, 응?' },
      ],
    },
    {
      id: 'stage-fright',
      open: '있잖아, 무대에 서기 전에 손이 떨려. 아무도 안 믿지만 진짜야.',
      replies: [
        { say: '떨리는 게 진심이라 그래', tier: 'great', remember: 'stage-fright', face: 'shy', answer: ['…그런가? 그럼 떨려도 괜찮겠다.', '다음 무대 때 그 말 떠올릴게. 주문처럼.'] },
        { say: '미쿠도 떨려?', tier: 'good', face: 'laugh', answer: ['엄청! 근데 첫 소절만 넘기면 괜찮아.', '그 첫 소절이 제일 어렵지. 숨이 목에 걸려.'] },
        { say: '그냥 하면 되잖아', tier: 'meh', face: 'calm', answer: '그치… 그냥 하면 되지. 말은 쉬운데. 헤헤.' },
      ],
    },
    {
      id: 'first-fan',
      open: '언젠가 큰 무대에 서는 게 꿈이야. 그때 누가 와 줄까?',
      replies: [
        { say: '내가 첫 번째 팬이야', tier: 'great', remember: 'first-fan', face: 'wow', answer: ['…진짜? 그럼 응원봉 청록색으로 맞춰 와!', '객석에서 제일 먼저 찾을 거야. 맨 처음에, 꼭.'] },
        { say: '마을 사람 다 오겠지', tier: 'good', answer: '그럼 좋겠다! 선장님은 박수를 너무 크게 쳐서 박자 깨질 것 같지만.' },
        { say: '꿈이 크네', tier: 'meh', face: 'smile', answer: '응! 크게 꿔야 반이라도 이루지. 반이면 광장 무대 정도?' },
      ],
    },
    {
      id: 'rhythm-walk',
      open: '걸을 때도 박자가 있어. 왼발, 오른발, 쿵짝. 너도 해 볼래?',
      replies: [
        { say: '쿵짝, 쿵짝!', tier: 'great', remember: 'dance-rhythm', face: 'laugh', answer: ['완벽해! 너 리듬감 있다.', '다음엔 쿵짝짝 삼박자 가 보자. 왈츠 걸음!'] },
        { say: '부끄러워', tier: 'good', face: 'shy', answer: '나도 처음엔 그랬어. 아무도 안 볼 때 연습해. 나만 볼게.' },
        { say: '그냥 걸을래', tier: 'meh', answer: '그것도 박자야. 느린 발라드 걸음. 나쁘지 않아.' },
      ],
    },
    {
      id: 'twin-tail',
      open: '오늘 트윈테일 묶는 데 한참 걸렸어. 티 나? 티 나야 하는데!',
      replies: [
        { say: '청록색이 반짝반짝해', tier: 'great', remember: 'teal-hair', face: 'shy', answer: ['헤헤, 알아봐 줬다!', '오늘 하루 행운 칩 하나 적립! 나중에 꼭 쓸게.'] },
        { say: '무겁지 않아?', tier: 'good', answer: ['무거워! 목이 뻐근할 때도 있어.', '근데 무대에서 돌 때 휘날리는 게 좋아서 못 잘라.'] },
        { say: '잘 모르겠는데', tier: 'meh', face: 'sorry', answer: '에엥, 한참 걸렸는데… 괜찮아, 내일은 더 반짝이게 하고 올게.' },
      ],
    },
    {
      id: 'night-sky',
      open: '퇴근할 때 하늘 보면 별이 음표처럼 보여. 이상한 말이지?',
      replies: [
        { say: '무슨 노래가 들려?', tier: 'great', remember: 'night-sky', face: 'wow', answer: ['음… 느린 왈츠! 별 세 개씩 묶으면 한 마디야.', '들려줄까? 흠흠… 아, 별 하나 구름에 가렸다. 쉼표다.'] },
        { say: '하나도 안 이상해', tier: 'good', face: 'smile', answer: '고마워. 이상하다는 말 많이 들었거든. 너는 다르네.' },
        { say: '별은 그냥 별이지', tier: 'meh', face: 'calm', answer: '그치, 별은 별이지. 근데 별도 가끔 노래하고 싶을걸?' },
      ],
    },
    {
      id: 'compose',
      open: '새 노래 쓰는 중인데 가사가 안 나와. {me}, 한 줄만 줘 볼래?',
      replies: [
        { say: '같이 써 보자', tier: 'great', remember: 'compose-help', face: 'wow', answer: ['진짜?! 그럼 첫 줄은 네 거.', '마음에 드는 말 떠오르면 언제든 알려 줘. 쪽지도 좋아!'] },
        { say: '파가 좋아 파파파', tier: 'good', face: 'laugh', answer: ['하하하! 그거 후렴으로 쓸래!', '중독성 최고야. 미스 포츈 언니가 들으면 한숨 쉬겠지만.'] },
        { say: '가사는 어려워', tier: 'meh', answer: '그치… 그럼 흥얼거리기만 해 줘. 음만 있어도 반은 된 거야.' },
      ],
    },
    {
      id: 'flower-cafe',
      open: '쉬는 날엔 꽃 핀 카페를 찾아다녀. 아직 못 가 본 데가 많아.',
      replies: [
        { say: '같이 찾으러 가자', tier: 'great', remember: 'flower-cafe', face: 'smile', answer: ['좋아! 지도에 동그라미 쳐 둘게.', '딸기 우유 맛있는 데부터. 창가에 화분 많은 데로.'] },
        { say: '빵집 카페 가 봤어?', tier: 'good', answer: ['프리렌 씨네! 창가 화분이 예뻐.', '힘멜 씨가 꽃 모양 쿠키를 덤으로 줘서 자주 가.'] },
        { say: '카페는 비싸', tier: 'meh', face: 'think', answer: '음, 맞아. 그럼 꽃밭에서 도시락 먹는 건 어때? 공짜야.' },
      ],
    },
    {
      id: 'dealer-face',
      open: '딜러는 표정이 없어야 한대. 근데 나 자꾸 웃음이 새. 혼날까?',
      replies: [
        { say: '웃는 딜러가 좋아', tier: 'great', face: 'laugh', answer: ['그치?! 미스 포츈 언니한테도 그렇게 말해 줘.', '언니는 맨날 표정 관리하래. 근데 언니도 가끔 웃어.'] },
        { say: '조금만 참아 봐', tier: 'good', face: 'think', answer: '음… 해 볼게. 대신 카드 섞을 때만. 그때는 진지해.' },
        { say: '혼나겠다', tier: 'meh', face: 'sorry', answer: '으앙, 그런 말 하지 마. 벌써 세 번 혼났단 말이야.' },
      ],
    },
    {
      id: 'duet-hint',
      when: { ch: 3 },
      open: '{me}, 듀엣 곡 하나 연습 중이야. 상대 파트가 비어 있는데… 누가 좋을까?',
      replies: [
        { say: '내가 할게', tier: 'great', face: 'shy', answer: ['…헤헤, 그 말 기다렸어.', '음 틀려도 돼. 같이 부르는 게 중요하니까.'] },
        { say: '봇치 어때?', tier: 'good', answer: ['봇치 기타는 최고지!', '근데 노래는 숨어서 부른대. 그래서 고민이야.'] },
        { say: '혼자 불러도 되잖아', tier: 'meh', face: 'calm', answer: '그치. 근데 이 곡은 둘이 불러야 완성돼. 천천히 찾을게.' },
      ],
    },
    {
      id: 'lyric-jar',
      open: ['카지노 문 옆에 유리병 하나 둔 거 봤어? 청록 리본 감은 거.', '지나가는 누구든 가사 한 줄씩 써서 넣는 병이야.'],
      replies: [
        { say: '나도 한 줄 넣을게', tier: 'great', remember: 'lyric-jar', face: 'wow', answer: ['진짜? 그럼 꼭 접어서 넣어 줘. 펴는 재미가 있거든.', '그 줄은 내가 꼭 노래로 만들게. 약속!'] },
        { say: '어떤 가사가 들어 있어?', tier: 'good', face: 'think', answer: ['어제는 "그물은 무거워도 노을은 가볍다"가 나왔어.', '럭스 글씨 같아. 바다 냄새 나는 가사는 다 럭스야.'] },
        { say: '장난치는 사람도 있겠다', tier: 'meh', face: 'calm', answer: '응, "오늘 저녁 뭐 먹지"도 있었어. 근데 그것도 노래 돼.' },
      ],
    },
    {
      id: 'everyone-song',
      open: ['있잖아, 내 노래는 사실 다 마을 사람들 거야.', '난 목소리를 빌려주는 사람이고. 그게 이상해?'],
      replies: [
        { say: '그래서 다들 좋아하나 봐', tier: 'great', remember: 'voice-reach', face: 'shy', answer: ['…그런가. 자기 이야기가 들리니까?', '그럼 더 잘 불러야겠다. 누구 한 줄도 안 놓치게.'] },
        { say: '미쿠 노래도 있잖아', tier: 'good', face: 'think', answer: ['음, 있지. 근데 그것도 누가 해 준 말에서 시작했어.', '노래는 혼자 안 생기더라. 꼭 누가 먼저 말을 걸어.'] },
        { say: '좀 아깝다', tier: 'meh', face: 'calm', answer: '아깝지 않아. 같이 만든 노래가 오래가. 그건 확실해.' },
      ],
    },
    {
      id: 'ribbon',
      open: '트윈테일 리본 새로 살 건데, 무슨 색이 좋을까? 진짜 고민이야.',
      replies: [
        { say: '청록에 맞춰 분홍!', tier: 'great', remember: 'ribbon-pick', face: 'laugh', answer: ['분홍! 딸기 우유 색이다!', '좋아, 결정. 다음 무대엔 네가 골라 준 리본 하고 갈게.'] },
        { say: '늘 하던 검정이 좋아', tier: 'good', face: 'smile', answer: '역시 기본이 최고지. 검정은 청록을 더 진하게 보이게 해.' },
        { say: '리본은 다 똑같아', tier: 'meh', face: 'sorry', answer: '에엥, 다 다르거든? 매듭 하나로 기분이 반음 올라가.' },
      ],
    },
    {
      id: 'mic-name',
      open: ['내 마이크 아직 이름이 없어. 매일 같이 일하는데 미안하잖아.', '{me}, 이름 하나 지어 줄래?'],
      replies: [
        { say: '반짝이 어때?', tier: 'great', remember: 'mic-name', face: 'wow', answer: ['반짝이! 귀엽다. 조명 받으면 진짜 반짝이거든.', '반짝아, 오늘도 잘 부탁해. 봐, 대답하는 것 같지?'] },
        { say: '대파는 어때?', tier: 'good', face: 'laugh', answer: ['대파는 이미 있어! 리본 묶은 진짜 대파.', '둘 다 대파면 헷갈려서 무대에서 파를 잡을 거야.'] },
        { say: '마이크는 마이크지', tier: 'meh', face: 'calm', answer: '그치… 그래도 이름 부르면 소리가 조금 더 다정해지는걸.' },
      ],
    },
    {
      id: 'leek-prop',
      open: '테이블 끝에 대파 세워 둔 거 봤어? 리본 묶은 거. 먹는 거 아니야.',
      replies: [
        { say: '응원봉 같아 귀엽다', tier: 'great', face: 'laugh', answer: ['그치! 손님이 이기면 살랑살랑 흔들어 줘.', '지면 더 크게 흔들어. 다음엔 잘될 거라고.'] },
        { say: '시들면 어떡해?', tier: 'good', face: 'think', answer: ['장날마다 새로 사. 시든 건 국에 넣고.', '그러니까 사실 반쯤은 먹는 거네. 헤헤.'] },
        { say: '좀 이상해', tier: 'meh', face: 'sorry', answer: '이상해도 좋아. 내 테이블은 내 무대니까. 소품은 내 맘이야.' },
      ],
    },
    {
      id: 'bug-fear',
      open: '어제 꽃밭에서 풍뎅이가 내 리본에 앉았어. 고음 나올 뻔했어.',
      replies: [
        { say: '다음엔 내가 쫓아 줄게', tier: 'great', remember: 'bug-guard', face: 'shy', answer: ['진짜? 그럼 꽃밭 갈 때 꼭 불러.', '넌 벌레 담당, 난 노래 담당. 공평하지?'] },
        { say: '그 고음 듣고 싶다', tier: 'good', face: 'laugh', answer: '안 돼! 그건 무대용이 아니라 비명용이야. 박자도 없어.' },
        { say: '벌레도 귀엽잖아', tier: 'meh', face: 'sorry', answer: '…귀엽다는 사람 처음 봐. 멀리서만 귀여워해 줘. 아주 멀리서.' },
      ],
    },
    {
      id: 'bitter-greens',
      open: ['츠나데 할머니가 텃밭 쑥을 한 아름 주셨어. 몸에 좋대.', '근데 나 쓴 나물은 정말 못 먹어. 어떡하지?'],
      replies: [
        { say: '쑥떡으로 만들면 달아', tier: 'great', face: 'wow', answer: ['쑥떡! 팥 넣고 달콤하게? 그럼 먹을 수 있어!', '할머니한테도 쑥떡 만들었다고 자랑해야지.'] },
        { say: '내가 대신 먹을게', tier: 'good', face: 'smile', answer: '땡큐! 대신 할머니한텐 비밀이야. 맛있게 먹었다고 할 거야.' },
        { say: '편식하면 안 돼', tier: 'meh', face: 'sorry', answer: '알아… 알지만, 혀가 단조로 울어. 쓴맛은 불협화음이야.' },
      ],
    },
    {
      id: 'hum-signal',
      open: ['손님 많을 땐 너랑 말을 못 하잖아. 그래서 생각했어.', '내가 흠, 흠, 흐음 하면 그게 "왔구나, 반가워"야. 어때?'],
      replies: [
        { say: '난 고개 두 번 끄덕일게', tier: 'great', remember: 'hum-signal', face: 'laugh', answer: ['좋아, 그게 답가야! 둘만 아는 신호.', '다른 손님은 그냥 내가 흥얼거리는 줄 알겠지. 헤헤.'] },
        { say: '그냥 손 흔들면 안 돼?', tier: 'good', face: 'think', answer: '딜러는 손 흔들면 안 돼. 카드 감추는 줄 오해받거든.' },
        { say: '너무 헷갈리는데', tier: 'meh', face: 'calm', answer: '그치, 나도 맨날 흥얼거려서 신호가 묻힐지도. 크게 할게.' },
      ],
    },
    {
      id: 'stage-apply',
      open: ['잔나가 축제 무대 신청서 갖다줬어.', '근데 축제 날 밤이 카지노 대목이라… 언니들한테 미안해.'],
      replies: [
        { say: '한 번은 꼭 서 봐야지', tier: 'great', remember: 'stage-apply', face: 'shy', answer: ['…그치? 한 번은. 딱 한 번은 서 보고 싶어.', '네가 그렇게 말해 주니까 신청서가 가벼워졌어.'] },
        { say: '언니들한테 물어봐', tier: 'good', face: 'think', answer: ['포츈 언니는 "네가 정해"래. 예림 언니는 웃기만 해.', '그게 제일 어려운 대답이야.'] },
        { say: '일이 먼저 아니야?', tier: 'meh', face: 'sorry', answer: '그치… 맞아. 맞는 말인데, 마음이 자꾸 반음 올라가.' },
      ],
    },
    {
      id: 'voice-reach',
      open: ['노래할 때 제일 궁금한 거 있어. 내 목소리가 진짜 닿았을까?', '객석 맨 뒤까지, 아니면 그냥 공기 속으로?'],
      replies: [
        { say: '나한텐 늘 닿았어', tier: 'great', remember: 'voice-reach', face: 'shy', answer: ['…그럼 됐다. 한 사람한테 닿으면 노래는 성공이야.', '그 한 사람이 너라서 더 좋고.'] },
        { say: '박수 소리가 대답이잖아', tier: 'good', face: 'smile', answer: '맞아. 근데 박수 그치고 나서 조용할 때가 진짜 대답 같아.' },
        { say: '마이크가 크니까 닿겠지', tier: 'meh', face: 'calm', answer: '헤헤, 소리는 닿지. 근데 마음까지는 마이크도 몰라.' },
      ],
    },
    {
      id: 'shuffle-song',
      open: '카드 섞을 때 속으로 노래 한 곡을 다 불러. 그래서 손이 안 틀려.',
      replies: [
        { say: '무슨 곡인지 맞혀 볼게', tier: 'great', face: 'laugh', answer: ['좋아, 들어 봐. 착, 착, 촤르륵… 착!', '정답은 "오늘도 무리하지 마세요" 행진곡이야. 내가 지었어.'] },
        { say: '그래서 박자가 일정하구나', tier: 'good', face: 'smile', answer: '응! 손님들은 내 손이 메트로놈이래. 칭찬 맞지?' },
        { say: '노래하면 실수 안 해?', tier: 'meh', face: 'think', answer: '한 번 했어. 클라이맥스에서 카드가 날아갔지. 그 뒤론 잔잔한 곡만.' },
      ],
    },
    {
      id: 'rose-unnie',
      open: ['미스 포츈 언니 말이야. 무섭지? 나도 처음엔 그랬어.', '근데 내 리허설엔 꼭 와. 맨 뒷줄에서 팔짱 끼고.'],
      replies: [
        { say: '언니 나름의 응원이네', tier: 'great', face: 'smile', answer: ['그치! 끝나면 "음정 반 박 늦었다"고만 해.', '근데 그 말 하려고 끝까지 들은 거잖아. 헤헤.'] },
        { say: '박수는 안 쳐 줘?', tier: 'good', face: 'think', answer: '한 번 쳤어. 딱 두 번, 짝짝. 그날 칩 정리가 하나도 안 틀렸어.' },
        { say: '그냥 감시하는 거 아냐?', tier: 'meh', face: 'sorry', answer: '에이, 감시면 앞줄에 앉겠지. 언니는 들키기 싫은 거야.' },
      ],
    },
    {
      id: 'maehwa-unnie',
      open: '예림 언니랑 퇴근길에 같이 걸어. 언니는 걸음이 느린 노래 같아.',
      replies: [
        { say: '무슨 얘기 해?', tier: 'good', face: 'shy', answer: ['연애 얘기! 근데 언니는 남 얘기만 듣고 자기 얘긴 안 해.', '판 읽듯이 내 얼굴을 읽어. 숨길 수가 없어.'] },
        { say: '언니가 많이 아끼더라', tier: 'great', face: 'smile', answer: ['진짜? 언니는 그런 말 직접 안 하거든.', '대신 내 꽃차에 꿀을 몰래 한 숟가락 더 넣어 줘. 그게 언니 말투야.'] },
        { say: '빨리 걸으면 되잖아', tier: 'meh', face: 'calm', answer: '빨리 걸으면 이야기가 짧아지잖아. 느린 게 좋을 때도 있어.' },
      ],
    },
    {
      id: 'janna-night',
      open: '잔나가 "카지노의 밤" 기사 쓴대. 나 인터뷰했어. 떨려서 말을 막 했어.',
      replies: [
        { say: '뭐라고 했는데?', tier: 'great', face: 'laugh', answer: ['"딜러가 꿈이냐"길래 "가수가 꿈인 딜러"라고 했어.', '잔나가 그 말 제목으로 쓴대. 으앗, 부끄러워!'] },
        { say: '잔나 기사 재밌던데', tier: 'good', face: 'smile', answer: '응, 날씨 예보는 가끔 틀리지만 사람 이야기는 정확해.' },
        { say: '신문 잘 안 봐', tier: 'meh', face: 'calm', answer: '그럼 내가 읽어 줄게. 노래하듯이. 기사가 갑자기 뮤지컬 돼.' },
      ],
    },
    {
      id: 'muzan-odds',
      open: ['무잔 지점장님이 저녁마다 카지노 앞에서 확률 얘기를 해.', '이길 확률이 얼마라느니. 난 박자 얘기로 받아쳐.'],
      replies: [
        { say: '확률보다 박자지', tier: 'great', face: 'laugh', answer: ['그치! 확률은 맞혀도 노래는 안 돼.', '지점장님이 처음으로 대답을 못 하셨어. 헤헤.'] },
        { say: '지점장님 무섭지 않아?', tier: 'good', face: 'think', answer: '조금. 근데 해 지면 웃음이 부드러워져. 밤에만 오는 단골이야.' },
        { say: '확률이 중요하긴 해', tier: 'meh', face: 'calm', answer: '응, 중요하지. 그래서 딜러인 내가 무리하지 말라고 하는 거야.' },
      ],
    },
    {
      id: 'bocchi-guitar',
      open: '봇치 공연 봤어? 허풍 주점 무대 구석에서 기타 치는 거.',
      replies: [
        { say: '기타 소리가 좋더라', tier: 'great', face: 'wow', answer: ['그치?! 고개 숙이고 쳐도 소리는 고개를 쳐들어.', '나중에 같이 무대 서자고 했더니 탁자 밑으로 숨었어.'] },
        { say: '둘이 친해?', tier: 'good', face: 'smile', answer: ['응! 공연 밤마다 카지노 앞에서 박수 쳐 줘.', '나도 봇치 공연 땐 맨 뒤에서 조용히 박수 쳐. 그래야 안 숨어.'] },
        { say: '안 봤어', tier: 'meh', face: 'calm', answer: '꼭 봐! 단, 크게 박수 치면 숨으니까 작게. 아주 작게.' },
      ],
    },
    {
      id: 'captain-clap',
      open: '선장님 박수 들어 봤어? 주점에서 내가 한 소절 불렀는데 창문이 울렸어.',
      replies: [
        { say: '박수도 허풍급이네', tier: 'great', face: 'laugh', answer: ['하하! 맞아, 허풍 주점다워!', '근데 그 박수 들으면 이상하게 다음 소절이 더 잘 나와.'] },
        { say: '주점에서도 불러?', tier: 'good', face: 'smile', answer: '가끔! 선장님이 한 곡 하면 한 잔 공짜래. 난 꽃차로 받아.' },
        { say: '시끄럽겠다', tier: 'meh', face: 'calm', answer: '시끄럽지. 그래도 조용한 객석보단 나아. 진짜야.' },
      ],
    },
    {
      id: 'library-poem',
      open: ['가사 공부하려고 언덕 도서관에서 시집 빌려 왔어.', '근데 소리 내서 읽다가 베아트리스 씨한테 혼났어.'],
      replies: [
        { say: '시집 빌린 건 잘했어', tier: 'great', face: 'smile', answer: ['그치? 짧은 말에 마음 넣는 법을 배우는 중이야.', '다음엔 속으로만 읽을게. 입술만 달싹달싹.'] },
        { say: '도서관에선 조용히 해야지', tier: 'good', face: 'sorry', answer: '알아… 근데 좋은 문장 보면 멜로디가 저절로 붙어서.' },
        { say: '가사에 시가 필요해?', tier: 'meh', face: 'think', answer: '음, 꼭은 아닌데. 파파파도 가사니까. 그래도 공부해 둘래.' },
      ],
    },
    {
      id: 'gwen-hair',
      open: '그웬 원장님한테 트윈테일 끝만 다듬었어. 소문도 같이 듣고 왔지.',
      replies: [
        { say: '무슨 소문?', tier: 'good', face: 'laugh', answer: ['비밀! …은 아니고, 내가 축제 무대에 선다는 소문.', '아직 안 정했는데 벌써 마을이 다 알아. 미용실 대단해.'] },
        { say: '끝이 더 찰랑거린다', tier: 'great', face: 'shy', answer: ['알아봤어?! 손가락 한 마디만 잘랐는데.', '역시 넌 박자도 머리끝도 놓치지 않는구나.'] },
        { say: '별 차이 없는데', tier: 'meh', face: 'sorry', answer: '에엥, 차이가 있어. 돌 때 휘날리는 소리가 달라졌단 말이야.' },
      ],
    },
    {
      id: 'off-key',
      open: '실수담 하나 해 줄까? 첫 무대에서 첫 음을 반음 높게 냈어.',
      replies: [
        { say: '그래서 어떻게 했어?', tier: 'great', face: 'smile', answer: ['그냥 끝까지 반음 높게 불렀어. 일부러인 척!', '나중에 다들 편곡이 신선했대. 아무도 몰랐던 거야.'] },
        { say: '미쿠도 실수를 하는구나', tier: 'good', face: 'laugh', answer: '엄청! 실수 없는 노래는 없어. 그걸 어떻게 넘기느냐가 노래야.' },
        { say: '창피했겠다', tier: 'meh', face: 'sorry', answer: '…응, 그날 밤에 베개에 대고 한 옥타브 높게 소리 질렀어.' },
      ],
    },
    {
      id: 'practice-day',
      open: '쉬는 날엔 아침부터 무대 연습해. 꽃밭 앞에서 발성부터. 아, 에, 이!',
      replies: [
        { say: '구경 가도 돼?', tier: 'great', face: 'wow', answer: ['돼! 관객 있으면 연습이 공연이 돼.', '대신 꽃밭 벌레 보이면 먼저 말해 줘. 그게 입장료야.'] },
        { say: '쉬는 날엔 쉬어야지', tier: 'good', face: 'think', answer: '노래는 나한테 쉬는 거야. 카드 섞는 게 일이고. 반대 같지?' },
        { say: '시끄럽다고 안 해?', tier: 'meh', face: 'calm', answer: '연못 개구리가 더 시끄러워. 우린 같이 합창하는 사이야.' },
      ],
    },
    {
      id: 'season-voice',
      open: '계절마다 목소리가 달라. 넌 어느 계절 노래가 제일 좋아?',
      replies: [
        { say: '봄, 꽃 피는 노래', tier: 'great', face: 'laugh', answer: ['나도! 봄엔 목도 마음도 말랑해.', '꽃 냄새 맡으면서 부르면 고음이 저절로 올라가.'] },
        { say: '겨울, 따뜻한 노래', tier: 'good', face: 'smile', answer: '좋다. 목도리 속에서 흥얼거리면 김이 음표처럼 피어올라.' },
        { say: '계절은 상관없어', tier: 'meh', face: 'calm', answer: '그것도 맞아. 좋은 노래는 언제 들어도 좋으니까.' },
      ],
    },
    {
      id: 'high-or-low',
      open: '높은 음이랑 낮은 음, 넌 어느 쪽이 좋아? 난 높은 음 담당이야.',
      replies: [
        { say: '내가 낮은 음 할게', tier: 'great', face: 'shy', answer: ['그럼 우리 화음 완성이네.', '높은 음은 혼자면 날아가 버려. 낮은 음이 붙잡아 줘야 해.'] },
        { say: '높은 음이 시원해', tier: 'good', face: 'laugh', answer: '그치! 끝까지 올라갈 때 기분, 관람차 꼭대기 같아.' },
        { say: '둘 다 잘 몰라', tier: 'meh', face: 'calm', answer: '그럼 가운데 음. 제일 편한 음이 제일 좋은 음이야.' },
      ],
    },
    {
      id: 'after-show-walk',
      when: { love: 'dating' },
      open: '{me}, 공연 끝나고 같이 걷는 이 길, 요즘 내 최애 곡이야.',
      replies: [
        { say: '매일 데려다줄게', tier: 'great', face: 'shy', answer: ['…매일이라고 했다. 녹음했어. 마음속으로.', '그럼 이 길에도 박자를 붙여야겠다. 우리 둘 걸음으로.'] },
        { say: '피곤하지 않아?', tier: 'good', face: 'smile', answer: '피곤해. 근데 너랑 걸으면 피곤이 쉼표가 돼. 쉬어 가는 거.' },
        { say: '오늘은 일찍 자자', tier: 'meh', face: 'calm', answer: '응… 알았어. 대신 문 앞에서 한 소절만. 짧은 걸로.' },
      ],
    },
    {
      id: 'ring-rhythm',
      when: { love: 'engaged' },
      open: '반지 낀 손으로 카드 섞으니까 소리가 달라. 딸깍, 하고 박자가 하나 늘어.',
      replies: [
        { say: '그 박자 내 거야', tier: 'great', face: 'shy', answer: ['헤헤… 맞아. 손님들은 몰라. 그 딸깍이 너라는 거.', '하루에 몇 번이나 그 박자를 세는지 몰라.'] },
        { say: '일할 때 안 불편해?', tier: 'good', face: 'think', answer: '조금. 포츈 언니가 "번쩍여서 눈부시다"래. 근데 웃으면서.' },
        { say: '빼 두는 게 낫지 않아?', tier: 'meh', face: 'sorry', answer: '안 돼! 이건 제일 아끼는 소품… 아니, 소품 아니고 약속이야.' },
      ],
    },
    {
      id: 'home-song',
      when: { love: 'married' },
      open: '우리 집에서 부르는 노래가 생겼어. 아무 무대에서도 안 부르는 노래.',
      replies: [
        { say: '제목이 뭐야?', tier: 'great', face: 'laugh', answer: ['아직 없어. 매일 가사가 조금씩 바뀌거든.', '오늘 저녁 메뉴가 들어갈 때도 있어. 그래서 제목은 "오늘".'] },
        { say: '매일 들을 수 있어서 좋아', tier: 'good', face: 'shy', answer: '나도 매일 부를 수 있어서 좋아. 관객이 늘 같은 자리에 있으니까.' },
        { say: '가끔은 조용히 있고 싶어', tier: 'meh', face: 'calm', answer: '그럼 흥얼거림 버전으로. 차 끓는 소리보다 작게.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '빗소리 들려? 툭, 툭, 투둑. 오늘 반주는 하늘이 깔아 주네!',
      replies: [
        { say: '그 박자에 맞춰 불러 줘', tier: 'great', answer: ['좋아! 흠흠, 비 오는 날의 노래…', '앗, 가사는 아직이야. 빗방울이 가사를 다 가져갔어. 헤헤.'] },
        { say: '우산은 챙겼어?', tier: 'good', answer: '트윈테일이 젖으면 무거워져서 꼭 챙겨! 오늘은 청록 우산.' },
        { say: '비 오면 우울해', tier: 'meh', face: 'sorry', answer: '그럼 내가 밝은 노래 불러 줄게. 빗소리보다 크게!' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 오는 밤엔 소리가 다 묻혀. 내 흥얼거림만 동그랗게 남아.',
      replies: [
        { say: '그 흥얼거림 듣고 싶어', tier: 'great', face: 'shy', answer: ['…그럼 작게 불러 줄게.', '눈 녹기 전까지만 들리는 노래야. 귀 기울여.'] },
        { say: '추워서 목 아프겠다', tier: 'good', answer: '그래서 목도리 꽁꽁! 꽃차도 두 잔째야. 걱정해 줘서 땡큐!' },
        { say: '눈 치우기 귀찮다', tier: 'meh', face: 'calm', answer: '그럼 박자 맞춰서 치우자. 삽질도 사분의 사 박자면 덜 힘들어.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '햇볕 좋다! 이런 날엔 꽃밭 앞이 전부 야외 무대 같아.',
      replies: [
        { say: '오늘 연습 구경 갈게', tier: 'great', face: 'laugh', answer: ['좋아! 햇볕 조명, 바람 반주, 관객 한 명. 완벽한 구성이야.', '아, 모자는 챙겨 와. 햇볕이 꽤 세.'] },
        { say: '트윈테일이 더 반짝여', tier: 'good', face: 'shy', answer: '헤헤, 햇볕 받으면 청록이 한 톤 밝아져. 알아봐 줘서 땡큐.' },
        { say: '더워서 싫어', tier: 'meh', face: 'calm', answer: '그럼 얼음 띄운 꽃차 한 잔. 시원해지면 노래도 시원해져.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐린 날엔 목소리가 차분해져. 오늘은 느린 곡 기분이야.',
      replies: [
        { say: '느린 곡도 좋아', tier: 'great', face: 'smile', answer: ['그치? 빠른 곡은 신나고, 느린 곡은 남아.', '오늘 테이블 반주도 안단테로 갈게.'] },
        { say: '비 올 것 같아', tier: 'good', face: 'think', answer: '응, 하늘이 숨 고르는 중이야. 첫 빗방울 전 쉼표.' },
        { say: '흐린 날은 졸려', tier: 'meh', face: 'calm', answer: '그럼 자장가 템포로 하자. 꾸벅, 꾸벅, 박자 맞네.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '{me}, 벌써 일어났어? 난 이제 마지막 곡 끝내고 퇴근하는 길이야.',
      replies: [
        { say: '수고했어, 푹 자', tier: 'great', face: 'shy', answer: ['헤헤, 그 말 들으니까 오늘 공연 완결이다.', '꿈에서도 칩 세면 어떡하지. 하나, 둘…'] },
        { say: '같이 해 뜨는 거 볼래?', tier: 'good', face: 'wow', answer: '좋아! 퇴근길에 늘 혼자 봤거든. 오늘은 둘이네.' },
        { say: '밤샘은 몸에 안 좋아', tier: 'meh', face: 'sorry', answer: '알아… 딜러는 밤이 일터라서. 낮잠으로 갚을게.' },
      ],
    },
    {
      id: 'op-day',
      when: { time: 'day' },
      open: '낮의 카지노는 한가해. 혼자 박자 맞춰 카드 섞기 연습 중이었어.',
      replies: [
        { say: '박자 세 줄까?', tier: 'great', face: 'laugh', answer: ['좋아! 하나, 둘, 셋, 넷, 그때 촤르륵!', '봐, 너랑 하니까 한 장도 안 튀었어.'] },
        { say: '심심하지 않아?', tier: 'good', face: 'think', answer: '조금. 그래서 흥얼거려. 빈 홀이 소리를 잘 돌려줘.' },
        { say: '한 판 할래', tier: 'meh', face: 'calm', answer: '한 판만이야? 약속. 낮엔 머리 맑을 때 멈추는 연습도 하자.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '조명 켜지기 직전이야! 막 오르기 전 이 순간이 제일 두근거려.',
      replies: [
        { say: '오늘 무대도 응원할게', tier: 'great', answer: ['그 말이면 충분해!', '첫 카드 돌릴 때 너 쪽 한 번 볼게. 신호야.'] },
        { say: '떨려?', tier: 'good', face: 'shy', answer: '조금. 근데 이 떨림이 없으면 재미없어. 무대니까.' },
        { say: '난 이제 집에 갈래', tier: 'meh', face: 'calm', answer: '응, 조심히 가! 앙코르는 다음에 들려줄게.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤이 깊었네. 칩 소리가 잦아들면 내 목소리도 반 톤 내려가.',
      replies: [
        { say: '그 목소리 좋다', tier: 'great', face: 'shy', answer: ['…진짜? 낮은 목소리는 자신 없었는데.', '그럼 오늘 마지막 곡은 낮게 불러 볼게. 너한테만.'] },
        { say: '마감까지 얼마나 남았어?', tier: 'good', face: 'think', answer: '노래로 치면 세 곡. 카드로 치면 열 판쯤. 버틸 만해.' },
        { say: '졸려 보여', tier: 'meh', face: 'sorry', answer: '들켰다. 하품도 반음 높게 나와. 쉿, 비밀.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄이다! 꽃 피는 속도에 맞춰 새 노래가 하나씩 생겨.',
      replies: [
        { say: '꽃 카페 같이 가자', tier: 'great', face: 'laugh', answer: ['좋아! 벚꽃 보이는 창가 자리로.', '딸기 우유 두 잔, 내가 살게. 봄 첫 데이트 아니고, 첫 외출!'] },
        { say: '새 노래 들려줘', tier: 'good', face: 'smile', answer: '흠흠… 아직 첫 소절뿐이야. 꽃봉오리 같은 노래.' },
        { say: '꽃가루 때문에 재채기 나', tier: 'meh', face: 'sorry', answer: '에취도 박자야… 라고 하면 혼나겠지. 손수건 줄게.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: '여름엔 축제 무대가 많아서 신나! 객석에서 박자만 맞춰도 좋아.',
      replies: [
        { say: '객석에서 응원할게', tier: 'great', face: 'laugh', answer: ['청록 부채 흔들어 줘! 그게 여름 응원봉이야.', '부채 바람에 트윈테일 날리면 그게 연출이야.'] },
        { say: '더위 먹지 마', tier: 'good', face: 'smile', answer: '응! 얼음 띄운 꽃차 들고 다녀. 목도 시원, 마음도 시원.' },
        { say: '여름엔 집에 있을래', tier: 'meh', face: 'calm', answer: '그것도 좋지. 창문 열어 둬. 바람에 노래 실어 보낼게.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을엔 목이 건조해져. 그래서 국화차 들고 다녀. 향 맡아 볼래?',
      replies: [
        { say: '향이 노래 같다', tier: 'great', face: 'wow', answer: ['오, 그거 가사로 써도 돼?', '향이 노래 같다. 가을 곡 첫 줄로 딱이야!'] },
        { say: '국화차 좋지', tier: 'good', face: 'smile', answer: '응! 오래 남는 향이 좋아. 오래 남는 노래처럼.' },
        { say: '가을은 쓸쓸해', tier: 'meh', face: 'calm', answer: '쓸쓸한 노래도 필요해. 그래야 밝은 노래가 반짝이지.' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter' },
      open: '손이 시리면 카드가 박자를 놓쳐. 근데 장갑은 딜러 규칙 위반이야.',
      replies: [
        { say: '손 녹여 줄게', tier: 'great', face: 'shy', answer: ['…앗, 따뜻해. 이러면 카드가 아니라 내 박자가 놓쳐.', '고마워. 오늘은 한 장도 안 틀릴 것 같아.'] },
        { say: '핫초코 사 올까?', tier: 'good', face: 'laugh', answer: '최고! 두 잔이면 더 최고. 한 잔은 네 거.' },
        { say: '규칙이면 참아야지', tier: 'meh', face: 'sorry', answer: '그치… 손가락으로 박자 치면서 버틸게. 톡톡톡.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 광장에 무대 섰대. 한 곡 신청할까 말까 고민 중이야!',
      replies: [
        { say: '무조건 신청해!', tier: 'great', remember: 'festival-stage', face: 'laugh', answer: ['좋아, 결정! 맨 앞에서 청록 응원 해 줘야 해.', '약속! 떨리면 너 쪽만 볼 거야.'] },
        { say: '같이 구경 가자', tier: 'good', answer: '그것도 좋다! 남의 무대 보는 것도 공부야.' },
        { say: '오늘은 카지노 바쁘잖아', tier: 'meh', face: 'sorry', answer: '…맞아. 대목이지. 그래도 쉬는 시간에 한 곡은 몰래 부를래.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{me}, 오늘 {fish} 낚았다며? 낚싯줄 감는 소리도 리듬 있지 않아?',
      replies: [
        { say: '촤르륵, 탁!', tier: 'great', face: 'laugh', answer: ['그거! 완전 드럼 소리야.', '다음 노래 간주에 넣을래. 작곡 협력자 이름에 너 넣을게.'] },
        { say: '힘들었어', tier: 'good', answer: '수고했어! 그럼 오늘은 느린 노래로 쉬게 해 줄게.' },
        { say: '물고기는 조용해', tier: 'meh', face: 'think', answer: '그치, 물고기는 노래 안 하지. 대신 물소리가 해 줘.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '들었어! 엄청 큰 걸 낚았다며? 마을 소문이 노래보다 빨라!',
      replies: [
        { say: '축하곡 불러 줘!', tier: 'great', face: 'laugh', answer: ['좋아! 빰빠바밤! 대어의 노래!', '가사는 즉석이야. 크다, 크다, 정말 크다. 헤헤.'] },
        { say: '운이 좋았어', tier: 'good', face: 'smile', answer: '운도 실력이야. 낚시엔 그래도 돼. 카지노에선 아니고.' },
        { say: '별거 아니야', tier: 'meh', face: 'wow', answer: '별거야! 겸손은 박자 하나 늦게. 지금은 자랑할 때야.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '흙냄새 난다. 밭일하고 왔구나! 손에서 정직한 냄새가 나.',
      replies: [
        { say: '대파도 심어 볼까?', tier: 'great', face: 'wow', answer: ['진짜?! 그럼 한 줄은 내 거야. 물은 내가 줄게.', '리본 묶을 만큼 길게 키워 줘. 무대 소품으로 쓸 거야.'] },
        { say: '허리가 아파', tier: 'good', face: 'sorry', answer: '수고했어. 쉬는 시간에 어깨 박자 맞춰 두드려 줄게. 통, 통.' },
        { say: '그냥 그랬어', tier: 'meh', face: 'calm', answer: '그냥 그런 날도 있지. 그런 날 노래가 제일 담백해.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물 나왔다며?! 반짝반짝, 무대 조명 같아!',
      replies: [
        { say: '미쿠 테이블에 장식해 줄까?', tier: 'great', face: 'wow', answer: ['진짜?! 그럼 오늘 테이블은 금빛 무대다!', '삼구, 땡큐! 손님들이 다 웃겠다.'] },
        { say: '팔아서 부자 될 거야', tier: 'good', face: 'laugh', answer: '헤헤, 그것도 좋지! 그래도 카지노에서 다 쓰지는 마. 약속.' },
        { say: '운이야', tier: 'meh', face: 'smile', answer: '운이어도 네가 심은 거야. 박수 받을 자격 있어.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me}, 오늘 걸음이 장조야! 뭐 좋은 일 있었어?',
      replies: [
        { say: '미쿠 봐서 좋아', tier: 'great', face: 'shy', answer: ['…그런 말은 반칙이야.', '박자 놓쳤잖아. 다시, 하나, 둘. 헤헤.'] },
        { say: '그냥 기분 좋아', tier: 'good', face: 'laugh', answer: '이유 없는 기분 좋음이 최고야. 그대로 쭉 가자. 크레센도!' },
        { say: '별일 없어', tier: 'meh', face: 'calm', answer: '그래? 그래도 발소리는 신나 보였어. 발은 거짓말 못 해.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 오늘 표정이 단조야. 무슨 일 있어? 장조로 바꿔 줄까?',
      replies: [
        { say: '노래 하나만 불러 줘', tier: 'great', face: 'smile', answer: ['좋아. 아주 작게, 너만 들리게.', '흠흠… 어때, 조금 밝아졌어?'] },
        { say: '그냥 피곤해', tier: 'good', answer: '그럼 자장가 버전으로. 오늘은 일찍 자. 내일은 장조로 시작하자.' },
        { say: '말하기 싫어', tier: 'meh', face: 'sorry', answer: '응, 말 안 해도 돼. 옆에서 흥얼거리기만 할게. 그것도 싫으면 조용히.' },
      ],
    },
    {
      id: 'op-birthday-news',
      when: { news: 'birthday' },
      open: '오늘 생일인 친구 있다며! 축하 노래 준비해야지. 화음 넣어 줄래?',
      replies: [
        { say: '내가 화음 할게!', tier: 'great', face: 'laugh', answer: ['좋아! 너 낮은 음, 나 높은 음.', '광장에서 깜짝 공연이다! 케이크 촛불 끄는 박자까지.'] },
        { say: '박수는 칠게', tier: 'good', answer: '박수도 화음이야! 크게 쳐 줘.' },
        { say: '난 잘 모르는 사람이야', tier: 'meh', face: 'calm', answer: '그래도 축하는 해 줄 수 있어. 노래는 모르는 사람한테도 닿거든.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '마을에 결혼 소식 들었어?! 축가 부탁받으면 어떡하지, 벌써 떨려!',
      replies: [
        { say: '미쿠 축가면 다들 울걸', tier: 'great', face: 'shy', answer: ['울리면 안 되는데… 웃게 해야 하는데.', '그럼 웃다가 우는 노래로 할게. 그게 결혼식 노래 같아.'] },
        { say: '무슨 곡 부를 거야?', tier: 'good', face: 'think', answer: '두 사람이 처음 만난 날 이야기를 듣고 거기서 한 줄 뽑을래.' },
        { say: '결혼은 아직 관심 없어', tier: 'meh', face: 'calm', answer: '그래도 축하는 좋잖아. 노래는 축하하라고 있는 거야.' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '전설의 물고기 소식 들었어? 그런 건 노래로 남겨야 해. 발라드로!',
      replies: [
        { say: '내가 가사 써 볼게', tier: 'great', remember: 'lyric-jar', face: 'wow', answer: ['좋아! 가사 병에 넣어 줘.', '전설은 노래가 돼야 오래가. 신문은 다음 날 접히잖아.'] },
        { say: '발라드보단 행진곡이지', tier: 'good', face: 'laugh', answer: '오, 그것도 좋다! 빠밤빰, 전설이 왔다! 선장님이 좋아하겠다.' },
        { say: '물고기가 무슨 노래야', tier: 'meh', face: 'calm', answer: '물고기 노래도 있어야지. 바다가 서운해해.' },
      ],
    },
    {
      id: 'op-record',
      when: { news: 'record' },
      open: '마을 기록이 새로 나왔대! 기록 깨지는 순간은 늘 클라이맥스 같아.',
      replies: [
        { say: '그 순간 같이 봤어야 했는데', tier: 'great', face: 'smile', answer: ['그치! 다음 기록 때는 꼭 같이 보자.', '난 옆에서 북 치듯 박수 칠게.'] },
        { say: '기록은 금방 또 깨져', tier: 'good', face: 'think', answer: '그래서 좋은 거야. 앙코르처럼 계속 다음이 있으니까.' },
        { say: '난 관심 없어', tier: 'meh', face: 'calm', answer: '그래? 그럼 기록 말고 오늘 날씨 노래나 하자.' },
      ],
    },
    {
      id: 'op-museum-news',
      when: { news: 'museum' },
      open: '박물관에 새 전시가 들어왔대. 조용한 데서 흥얼거리면 울림이 좋아.',
      replies: [
        { say: '같이 보러 가자', tier: 'great', face: 'laugh', answer: ['좋아! 대신 내가 흥얼거리면 옆구리 쿡 찔러 줘.', '박물관 노래는 마음속으로만 부르는 거니까.'] },
        { say: '전시보다 울림이 궁금해?', tier: 'good', face: 'shy', answer: '헤헤, 들켰다. 둘 다 궁금해. 진짜야.' },
        { say: '박물관은 지루해', tier: 'meh', face: 'calm', answer: '그럼 오래된 물건마다 노래를 붙여 봐. 하나도 안 지루해져.' },
      ],
    },
    {
      id: 'op-festival-news',
      when: { news: 'festival' },
      open: '축제 준비 소식 봤어? 광장 무대 순서표가 붙었대. 내 이름 있을까?',
      replies: [
        { say: '같이 보러 가자', tier: 'great', face: 'shy', answer: ['…응. 혼자 보러 가기 무서웠어.', '이름 있으면 소리 질러도 돼? 작게. 아주 작게.'] },
        { say: '당연히 있겠지', tier: 'good', face: 'laugh', answer: '그 자신감 반만 빌려줘! 그럼 무대 내내 버틸 수 있어.' },
        { say: '순서표는 왜?', tier: 'meh', face: 'calm', answer: '아무것도 아니야… 그냥 궁금해서. 헤헤. 진짜야.' },
      ],
    },
    {
      id: 'op-friend-news',
      when: { friendNews: 'birthday' },
      open: '네 친구 생일이라며? 축하 노래 짧은 버전 알려 줄까? 누구든 부를 수 있어.',
      replies: [
        { say: '알려 줘, 불러 줄래', tier: 'great', face: 'laugh', answer: ['좋아! 이름 넣고 박수 세 번, 마지막에 크게.', '음 틀려도 돼. 축하는 음정보다 마음이야.'] },
        { say: '선물만 줘도 되지', tier: 'good', face: 'smile', answer: '그것도 좋지! 포장 리본만 예쁘게 해. 리본은 중요해.' },
        { say: '노래는 부끄러워', tier: 'meh', face: 'calm', answer: '그럼 내가 대신 부르고 넌 박수만. 그것도 듀엣이야.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '바다 나갔다 왔다며? 파도 소리 어땠어? 베이스 같았어, 북 같았어?',
      replies: [
        { say: '큰북 같았어', tier: 'great', face: 'wow', answer: ['역시! 파도는 쿵, 쿵, 쏴아. 그게 바다 박자야.', '다음 노래 간주를 바다 박자로 할래.'] },
        { say: '배멀미 때문에 몰라', tier: 'good', face: 'sorry', answer: '에엥, 고생했다. 멀미엔 박하차래. 다음엔 들려줄게.' },
        { say: '그냥 시끄러웠어', tier: 'meh', face: 'calm', answer: '시끄러운 것도 음악이야. 선장님 웃음소리처럼.' },
      ],
    },
    {
      id: 'op-stock-up',
      when: { recent: 'stockUp' },
      open: '주식 올랐다며? 축하해! 무잔 지점장님이 오늘 기분이 좋더라.',
      replies: [
        { say: '이쯤에서 멈출래', tier: 'great', face: 'smile', answer: ['최고야. 노래도 제일 좋을 때 끝내야 앙코르가 나와.', '기분 좋을 때 멈추는 사람이 제일 멋있어.'] },
        { say: '더 넣어 볼까?', tier: 'meh', face: 'sorry', answer: '으음… 지점장님 웃음은 믿지 마. 박자가 너무 정확하거든.' },
        { say: '운이 좋았지', tier: 'good', face: 'laugh', answer: '운이 좋은 날은 노래도 잘 돼. 오늘 한 곡 들려줄게.' },
      ],
    },
    {
      id: 'op-stock-down',
      when: { recent: 'stockDown' },
      open: '주식 좀 내렸다며… 괜찮아? 오르락내리락, 꼭 음계 같다.',
      replies: [
        { say: '괜찮아, 다시 올라가겠지', tier: 'great', face: 'smile', answer: ['그 마음이 제일 좋아.', '내려간 음은 다시 올라와. 그게 노래야.'] },
        { say: '좀 속상해', tier: 'good', face: 'sorry', answer: '속상하지. 오늘은 단조로 같이 불러 줄게. 실컷 슬프고 털어 내.' },
        { say: '음계랑은 다르지', tier: 'meh', face: 'calm', answer: '그치, 미안. 위로가 서툴렀다. 꽃차 한 잔 살게.' },
      ],
    },
    {
      id: 'op-fishing',
      when: { recent: 'fishing' },
      open: '요즘 낚시 자주 간다며? 찌 기다리는 거, 무대 입장 직전이랑 비슷해?',
      replies: [
        { say: '딱 그 두근거림이야', tier: 'great', face: 'laugh', answer: ['그치! 숨 참고, 기다리고, 지금이다!', '다음에 같이 가면 내가 박자 세 줄게.'] },
        { say: '그냥 멍하니 기다려', tier: 'good', face: 'smile', answer: '그것도 좋다. 멍하니는 노래로 치면 긴 쉼표야.' },
        { say: '지루할 때가 많아', tier: 'meh', face: 'think', answer: '그럼 흥얼거려. 물고기가 박자 맞춰 올지도 몰라.' },
      ],
    },
    {
      id: 'op-museum-visit',
      when: { recent: 'museum' },
      open: '요즘 박물관 자주 들른다며? 거기 계단 끝에서 소리 내면 메아리가 좋아.',
      replies: [
        { say: '다음엔 같이 해 보자', tier: 'great', face: 'laugh', answer: ['좋아! 딱 한 음만. 관장님 오기 전에.', '그 한 음이 우리 둘만의 전시품이야.'] },
        { say: '거기서 노래하면 혼나', tier: 'good', face: 'sorry', answer: '…응, 혼난 적 있어. 그래서 이제 한 음만 해.' },
        { say: '난 전시만 봐', tier: 'meh', face: 'calm', answer: '그것도 좋아. 오래된 물건도 다 한 곡씩 품고 있어.' },
      ],
    },
    {
      id: 'op-casino-win',
      when: { recent: 'casinoWin' },
      open: '이번 주에 테이블에서 좀 땄다며? 축하해! …근데 오늘은 쉬는 거다?',
      replies: [
        { say: '응, 오늘은 쉴게', tier: 'great', remember: 'no-bet', face: 'smile', answer: ['최고야!', '기분 좋을 때 멈추는 사람이 진짜 고수래. 포츈 언니 말이야.'] },
        { say: '한 판만 더!', tier: 'meh', face: 'sorry', answer: '으음… 한 판이 두 판 되는 거 알지? 딜러로서 말리는 거야.' },
        { say: '딴 걸로 뭐 하지?', tier: 'good', face: 'think', answer: '꽃 사! 아니면 맛있는 거. 칩으로 남기면 다시 테이블로 와.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose', noMem: 'no-bet' },
      open: '{me}, 요즘 테이블에서 좀 잃었지? 딜러로서 하는 말 아니고, 친구로서야.',
      replies: [
        { say: '이제 무리 안 할게', tier: 'great', remember: 'no-bet', face: 'smile', answer: ['응. 그 말 들으니까 안심이다.', '오늘은 칩 말고 노래 들으러 와. 그건 공짜야.'] },
        { say: '다음엔 딸 거야', tier: 'meh', face: 'sorry', answer: '그 말이 제일 무서운 말이야. 박자 놓친 걸 박자로 못 따라잡아.' },
        { say: '걱정해 줘서 고마워', tier: 'good', face: 'shy', answer: '당연하지. 손님이 웃고 나가야 내 하루가 장조로 끝나.' },
      ],
    },
    {
      id: 'op-bocchi',
      when: { bond: 'bocchi' },
      open: '봇치 만났어? 오늘 공연 언제래? 나 박수 치러 가야 해!',
      replies: [
        { say: '저녁에 한대', tier: 'great', answer: ['좋아, 퇴근하자마자 갈게!', '맨 앞에서 박수 치면 봇치가 숨을까 봐 중간쯤.'] },
        { say: '둘이 친해?', tier: 'good', face: 'smile', answer: '응! 봇치 기타 소리 정말 좋아. 근데 칭찬하면 기타 뒤로 숨어.' },
        { say: '말을 거의 안 하던데', tier: 'meh', face: 'calm', answer: '응, 봇치는 말 대신 기타로 해. 그걸 알아들으면 친구야.' },
      ],
    },
    {
      id: 'op-maehwa',
      when: { bond: 'maehwa' },
      open: '{other} 언니 만났구나! 언니가 오늘 퇴근길에 나 기다려 준대. 헤헤.',
      replies: [
        { say: '둘이 무슨 얘기 해?', tier: 'good', face: 'shy', answer: ['그건… 비밀! 여자들끼리 하는 이야기야.', '너 얘기는 안 해. 아마도. 거의.'] },
        { say: '언니가 미쿠 많이 아끼더라', tier: 'great', face: 'smile', answer: '진짜? 언니는 그런 말 직접 안 하거든. 알려 줘서 땡큐!' },
        { say: '화투방이 더 재밌던데', tier: 'meh', face: 'calm', answer: '헤헤, 언니 판은 재밌지. 근데 내 테이블엔 노래가 있어.' },
      ],
    },
    {
      id: 'op-rose',
      when: { bond: 'rose' },
      open: '포츈 언니랑 얘기했어? 언니 오늘 기분 어땠어? 나 리허설 날이라.',
      replies: [
        { say: '미쿠 걱정하던데', tier: 'great', face: 'wow', answer: ['언니가? 진짜?', '…그럼 오늘 리허설은 맨 뒷줄까지 들리게 해야겠다.'] },
        { say: '평소랑 똑같았어', tier: 'good', face: 'think', answer: '평소랑 똑같으면 좋은 거야. 언니는 기분 나쁘면 더 조용해지거든.' },
        { say: '좀 무섭던데', tier: 'meh', face: 'sorry', answer: '헤헤, 처음엔 다 그래. 근데 언니가 칩 정리하는 법 알려 줬어. 다정하게.' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '{other} 만났어? 오늘 신문에 내 얘기 났어? 아니면 날씨만?',
      replies: [
        { say: '구석에 작게 났던데', tier: 'great', face: 'wow', answer: ['꺄! 구석이어도 좋아. 오려서 리허설 거울에 붙일래.', '잔나한테 꽃차 한 잔 사야겠다.'] },
        { say: '날씨만 봤어', tier: 'good', face: 'laugh', answer: '헤헤, 잔나 예보는 가끔 틀려. 그래도 우산은 챙겨.' },
        { say: '신문 안 봤어', tier: 'meh', face: 'calm', answer: '그럼 내가 노래로 읽어 줄게. 일면부터. 박자 맞춰서.' },
      ],
    },
    {
      id: 'op-muzan',
      when: { bond: 'muzan' },
      open: '무잔 지점장님 만났지? 또 확률 얘기 했어? 나한테도 어제 했거든.',
      replies: [
        { say: '박자 얘기로 받아쳤어', tier: 'great', face: 'laugh', answer: ['잘했어! 그게 우리 카지노 방식이야.', '확률엔 박자가 약이야. 지점장님 표정 볼만했겠다.'] },
        { say: '말이 어려웠어', tier: 'good', face: 'think', answer: '나도 반은 못 알아들어. 그냥 웃으면서 칩만 세.' },
        { say: '좀 솔깃했어', tier: 'meh', face: 'sorry', answer: '에이, 솔깃하면 안 돼. 지점장님 말은 늘 박자가 너무 완벽해.' },
      ],
    },
    {
      id: 'op-with-rose',
      when: { with: 'rose' },
      open: '쉿, {other} 언니 옆이라 딜러 얼굴 하는 중이야. 근데 웃음 새는 거 보여?',
      replies: [
        { say: '조금 보여', tier: 'great', face: 'laugh', answer: ['으앗, 들켰다!', '언니도 방금 입꼬리 올라갔어. 둘 다 들켰다.'] },
        { say: '완벽한 무표정이야', tier: 'good', face: 'smile', answer: '진짜? 연습한 보람 있다. 언니, 들었지?' },
        { say: '둘 다 무서워', tier: 'meh', face: 'sorry', answer: '에엥, 나는 안 무서워! 언니만… 아, 언니 듣고 있다.' },
      ],
    },
    {
      id: 'op-with-maehwa',
      when: { with: 'maehwa' },
      open: '{other} 언니랑 꽃차 마시던 중이야. 너도 앉아. 의자 하나 비워 뒀어.',
      replies: [
        { say: '고마워, 같이 마실게', tier: 'great', face: 'laugh', answer: ['언니, 꿀 한 숟가락 더! 손님 왔어.', '셋이 마시니까 찻잔 부딪는 소리가 화음 같다.'] },
        { say: '무슨 얘기 중이었어?', tier: 'good', face: 'shy', answer: '그건… 언니가 웃기만 하네. 비밀이야. 진짜 비밀.' },
        { say: '난 바빠서', tier: 'meh', face: 'calm', answer: '응, 그럼 다음에. 의자는 계속 비워 둘게.' },
      ],
    },
    {
      id: 'op-with-bocchi',
      when: { with: 'bocchi' },
      open: '{other}랑 맞춰 보는 중이었어! 기타 반주에 내 흥얼거림. 들어 볼래?',
      replies: [
        { say: '조용히 들을게', tier: 'great', face: 'smile', answer: ['고마워. 봇치는 박수 소리에 놀라거든.', '끝나면 박수 대신 엄지만 들어 줘. 그게 우리 약속이야.'] },
        { say: '같이 불러도 돼?', tier: 'good', face: 'laugh', answer: '좋아! 봇치, 괜찮지? …고개 끄덕였어. 아마도.' },
        { say: '시끄럽지 않아?', tier: 'meh', face: 'sorry', answer: '앗, 봇치가 기타 뒤로 숨었다. 괜찮아, 괜찮아. 나와.' },
      ],
    },
    {
      id: 'op-with-janna',
      when: { with: 'janna' },
      open: '{other}랑 카지노 밤 취재 중이야. 나 오늘 인터뷰이 겸 배경 음악이래.',
      replies: [
        { say: '배경 음악 들려줘', tier: 'great', face: 'laugh', answer: ['흠흠, 카지노의 밤, 칩이 반짝, 카드가 촤르륵.', '잔나가 받아 적고 있어. 이거 진짜 실리나?'] },
        { say: '인터뷰 잘 돼 가?', tier: 'good', face: 'shy', answer: '자꾸 노래 얘기로 새. 잔나가 그게 기삿거리래.' },
        { say: '방해 안 할게', tier: 'meh', face: 'calm', answer: '방해 아니야! 지나가는 손님 인터뷰도 필요하대.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '…응? 아, 미안. {other}랑 좀 어긋났어. 박자가 엇나간 것 같아.',
      replies: [
        { say: '박자는 다시 맞추면 돼', tier: 'great', face: 'smile', answer: ['…그치. 한 마디 쉬고 다시 들어가면 돼.', '내일 먼저 꽃차 한 잔 들고 가 볼게.'] },
        { say: '무슨 일인데?', tier: 'good', face: 'sorry', answer: '별거 아니야. 서로 다른 노래를 부르고 있었나 봐.' },
        { say: '내버려 둬', tier: 'meh', face: 'calm', answer: '응… 시간이 해결해 주겠지. 노래 한 곡 길이만큼만.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me}! 생일 축하해! 오늘 테이블 첫 곡은 네 거야. 준비됐어?',
      replies: [
        { say: '준비됐어, 불러 줘!', tier: 'great', face: 'laugh', answer: ['좋아! 생일 축하해, 오늘의 주인공~', '마지막 음 길게 끌 테니까 촛불 끄는 거 맞춰!'] },
        { say: '어떻게 알았어?', tier: 'good', face: 'shy', answer: '비밀! …사실 달력에 청록 펜으로 동그라미 쳐 놨어.' },
        { say: '생일은 별로야', tier: 'meh', face: 'sorry', answer: '그럼 조용한 버전으로. 생일은 몰라도 너는 축하하고 싶어.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-leek',
      when: { mem: 'leek-fan' },
      use: 'leek-fan',
      open: '파 동맹! 오늘 장터에 파가 엄청 싱싱하대. 같이 가자고 하려고 기다렸어.',
      replies: [
        { say: '한 단씩 메고 가자', tier: 'great', face: 'laugh', answer: ['좋아! 어깨에 파, 입에는 노래.', '시장 사람들이 행진하는 줄 알 거야. 하나, 둘!'] },
        { say: '기억하고 있었어?', tier: 'good', face: 'shy', answer: '당연하지! 파 좋아하는 사람은 귀하거든.' },
        { say: '오늘은 안 될 것 같아', tier: 'meh', face: 'calm', answer: '그럼 내가 한 단 더 사 둘게. 네 몫으로.' },
      ],
    },
    {
      id: 'cb-sing',
      when: { mem: 'sing-along' },
      use: 'sing-along',
      open: '같이 부르자고 했던 거 기억나? 오늘 퇴근길에 한 소절씩 주고받자!',
      replies: [
        { say: '먼저 시작해!', tier: 'great', face: 'laugh', answer: ['라라라… 이제 네 차례!', '틀려도 돼, 크게! 그렇지, 그거야!'] },
        { say: '음치인데 괜찮아?', tier: 'good', answer: '음치는 없어. 자기 음이 있을 뿐이야. 그게 내 철학!' },
        { say: '오늘은 목이 아파', tier: 'meh', face: 'sorry', answer: '그럼 난 부르고 넌 박자만. 목 아끼는 것도 가수 일이야.' },
      ],
    },
    {
      id: 'cb-fright',
      when: { mem: 'stage-fright' },
      use: 'stage-fright',
      open: '어제 무대 섰을 때 손 떨렸는데, 네 말 생각났어. 진심이라 떨리는 거라고.',
      replies: [
        { say: '그래서 어땠어?', tier: 'great', face: 'smile', answer: ['첫 소절 무사 통과!', '떨림도 노래에 섞였는데 그게 더 좋았대.'] },
        { say: '내 말이 맞지?', tier: 'good', face: 'laugh', answer: '응! 이제 무대 전에 주문처럼 외워. 진심이라 떨린다, 진심이라.' },
      ],
    },
    {
      id: 'cb-compose',
      when: { mem: 'compose-help', noMem: 'lyric-done' },
      open: '같이 쓰기로 한 노래 말이야. 첫 줄 생각났어? 난 멜로디 다 만들었어!',
      replies: [
        { say: '오늘의 너에게', tier: 'great', remember: 'lyric-done', face: 'wow', answer: ['…좋다. 오늘의 너에게.', '그 다음은 내가 이을게. 완성되면 제일 먼저 들려줄게!'] },
        { say: '아직 고민 중이야', tier: 'good', remember: 'lyric-done', answer: '천천히 해! 좋은 가사는 늦게 와. 기다리는 것도 리듬이야.' },
        { say: '파파파 어때?', tier: 'meh', remember: 'lyric-done', face: 'laugh', answer: '하하, 그건 후렴으로 이미 썼어! 첫 줄은 다음에 또 물어볼게.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며? 그거로 짧은 노래 하나 만들어 봤어!',
      replies: [
        { say: '불러 줘!', tier: 'great', remember: 'taste-heard', face: 'laugh', answer: ['흠흠… 좋아하는 걸 좋아하는 너가 좋아~', '헤헤, 아직 일 절뿐이야. 이 절은 네가 써.'] },
        { say: '부끄러운데', tier: 'good', remember: 'taste-heard', face: 'shy', answer: '헤헤, 그럼 너 없을 때만 부를게. 아니다, 있을 때 부를래.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '같이 걸었던 날, 우리 발소리가 딱 사분의 사 박자였던 거 알아?',
      replies: [
        { say: '그래서 그렇게 즐거웠구나', tier: 'great', remember: 'outing-talk', face: 'shy', answer: ['그치?! 박자가 맞는 사람은 드물어.', '다음에도 같이 걷자. 이번엔 왈츠 박자로.'] },
        { say: '네가 계속 흥얼거렸잖아', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '들켰다! 너랑 걸으면 노래가 저절로 나와. 어쩔 수 없어.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '곧 네 생일이지?! 축하 노래 준비해야지. 신나는 거, 잔잔한 거?',
      replies: [
        { say: '미쿠가 부르는 거면 다 좋아', tier: 'great', remember: 'bday-plan', face: 'shy', answer: ['…그런 말 하면 반칙이야.', '그럼 둘 다 준비할게. 이 절짜리로!'] },
        { say: '신나는 걸로!', tier: 'good', remember: 'bday-plan', face: 'laugh', answer: '좋아! 박수 치는 부분도 넣을게. 다 같이 쿵짝!' },
        { say: '생일은 조용히 보낼래', tier: 'meh', remember: 'bday-plan', face: 'calm', answer: '응, 그럼 자장가처럼 작게. 너만 들리게 부를게.' },
      ],
    },
    {
      id: 'cb-nobet',
      when: { mem: 'no-bet', recent: 'casinoLose' },
      use: 'no-bet',
      open: '이번 주에 좀 잃었다며… 무리 안 하기로 했잖아. 괜찮아?',
      replies: [
        { say: '미안. 이제 멈출게', tier: 'great', face: 'smile', answer: ['응. 그 말이면 됐어.', '오늘은 노래나 듣고 가. 공짜야.'] },
        { say: '조금밖에 안 잃었어', tier: 'good', face: 'think', answer: '조금이 쌓이면 큰 노래가 돼. 슬픈 노래. 그건 부르기 싫어.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '네 방에서 마이크 없이 불렀던 노래, 아직 귀에 남아 있어?',
      replies: [
        { say: '매일 밤 생각나', tier: 'great', remember: 'date-talk', face: 'shy', answer: ['…나도. 마이크 없이 부른 건 오랜만이었어.', '목소리가 공기 대신 너한테 바로 가는 느낌이었어.'] },
        { say: '다음엔 내가 부를게', tier: 'good', remember: 'date-talk', face: 'laugh', answer: '진짜? 그럼 난 관객석 맨 앞! 박수 박자 엄청 정확하게 쳐 줄게.' },
        { say: '조금 졸렸어', tier: 'meh', remember: 'date-talk', face: 'sorry', answer: '헤헤, 자장가처럼 들렸나 봐. 그럼 성공이야. 반쯤.' },
      ],
    },
    {
      id: 'cb-jar',
      when: { mem: 'lyric-jar' },
      use: 'lyric-jar',
      open: ['가사 병에서 네 쪽지 찾았어! 글씨 보고 바로 알았어.', '그 한 줄에 멜로디 붙여 봤는데, 들어 볼래?'],
      replies: [
        { say: '내 가사가 노래가 됐네', tier: 'great', face: 'wow', answer: ['응! 흠흠… 어때? 네 말이 내 목소리로 나오니까 신기하지?', '이게 내가 노래하는 이유야. 누군가의 한 줄을 멀리 보내는 거.'] },
        { say: '부끄러운 글씨였는데', tier: 'good', face: 'laugh', answer: '삐뚤빼뚤해서 더 좋았어. 그 글씨 모양대로 음을 붙였거든.' },
        { say: '뭐라고 썼는지 까먹었어', tier: 'meh', face: 'calm', answer: '그럼 노래로 기억해. 이제 이건 둘의 노래니까.' },
      ],
    },
    {
      id: 'cb-ribbon',
      when: { mem: 'ribbon-pick' },
      use: 'ribbon-pick',
      open: '짠! 네가 골라 준 색 리본 샀어. 어때, 트윈테일에 잘 어울려?',
      replies: [
        { say: '딱 미쿠 색이야', tier: 'great', face: 'shy', answer: ['헤헤, 그치? 거울 보면서 한참 웃었어.', '이 리본 하고 무대 서면 덜 떨릴 것 같아.'] },
        { say: '내가 골라서 더 예뻐', tier: 'good', face: 'laugh', answer: '그 말은 반만 맞아. 나머지 반은 내가 잘 묶어서야!' },
        { say: '이전 게 나았나?', tier: 'meh', face: 'sorry', answer: '에엥, 네가 골라 놓고! …내일은 둘 다 해 볼게. 한쪽씩.' },
      ],
    },
    {
      id: 'cb-mic',
      when: { mem: 'mic-name' },
      use: 'mic-name',
      open: '반짝이가 어제 무대에서 처음으로 한 번도 안 끊겼어. 이름 덕분인가?',
      replies: [
        { say: '반짝이도 미쿠 편이야', tier: 'great', face: 'laugh', answer: ['그치! 이름 부르고 시작하니까 소리가 다정해.', '오늘 밤에도 반짝아, 부탁해. 봐, 반짝였지?'] },
        { say: '그냥 운 아냐?', tier: 'good', face: 'think', answer: '운일 수도. 근데 운도 이름 불러 주면 친해지는 거 아닐까?' },
        { say: '마이크 고친 거 아냐?', tier: 'meh', face: 'calm', answer: '…사실 줄도 갈았어. 그래도 이름 덕이라고 할래.' },
      ],
    },
    {
      id: 'cb-bug',
      when: { mem: 'bug-guard' },
      use: 'bug-guard',
      open: '벌레 담당! 오늘 꽃밭 연습 가는데, 약속한 거 기억나지? 같이 가 줄래?',
      replies: [
        { say: '맡겨, 다 쫓아 줄게', tier: 'great', face: 'laugh', answer: ['든든하다! 그럼 난 노래만 할게.', '나비는 쫓지 마. 나비는 관객이야.'] },
        { say: '나도 사실 좀 무서워', tier: 'good', face: 'wow', answer: '진짜? 그럼 둘이 같이 소리 지르자. 화음으로.' },
        { say: '오늘은 바빠', tier: 'meh', face: 'sorry', answer: '그럼 오늘은 처마 밑에서 연습할게. 벌레 없는 무대로.' },
      ],
    },
    {
      id: 'cb-signal',
      when: { mem: 'hum-signal' },
      use: 'hum-signal',
      open: ['어제 테이블에서 흠, 흠, 흐음 했는데 못 봤지?', '손님들이 다 고개를 끄덕여서 누가 너인지 몰랐어!'],
      replies: [
        { say: '두 번 끄덕인 게 나야', tier: 'great', face: 'laugh', answer: ['아, 그게 너였구나! 다들 한 번씩만 끄덕였어.', '역시 우리 신호는 정확해. 박자까지.'] },
        { say: '다들 따라 했나 봐', tier: 'good', face: 'shy', answer: '내 흥얼거림이 전염됐나 봐. 신호를 새로 만들어야겠다.' },
        { say: '못 봤어, 미안', tier: 'meh', face: 'sorry', answer: '괜찮아. 그럼 오늘은 크게 흠, 흠, 흐음. 이번엔 꼭 봐!' },
      ],
    },
    {
      id: 'cb-apply',
      when: { mem: 'stage-apply' },
      use: 'stage-apply',
      open: ['신청서 냈어! 네가 응원해 줘서. 이름 쓸 때 손이 덜 떨렸어.', '이제 진짜 연습해야 해. 무섭고 신나.'],
      replies: [
        { say: '연습 상대 해 줄게', tier: 'great', face: 'wow', answer: ['진짜? 그럼 매일 한 곡씩 들어 줘.', '객석이 한 명이어도 연습은 공연이 되니까.'] },
        { say: '잘할 거야', tier: 'good', face: 'shy', answer: '그 말 하나로 사흘은 버텨. 또 해 줘야 해.' },
        { say: '떨어지면 어떡해?', tier: 'meh', face: 'sorry', answer: '…그럼 광장 상자 무대에서 부르면 되지. 노래는 안 떨어져.' },
      ],
    },
    {
      id: 'cb-voice',
      when: { mem: 'voice-reach' },
      use: 'voice-reach',
      open: '저번에 목소리 닿는 이야기 했잖아. 어제 손님이 내 노래 듣고 울었어.',
      replies: [
        { say: '닿았구나, 마음까지', tier: 'great', face: 'shy', answer: ['…응. 나도 같이 울 뻔했어. 딜러 얼굴 지키느라 혼났어.', '네 말 생각나서 끝까지 불렀어.'] },
        { say: '좋은 눈물이었겠다', tier: 'good', face: 'smile', answer: '응, 다 듣고 웃었어. 웃다가 우는 노래였나 봐.' },
        { say: '돈 잃어서 운 거 아냐?', tier: 'meh', face: 'sorry', answer: '에엥! 아니야. 그 손님 오늘은 한 판도 안 했어. 노래만 들었어.' },
      ],
    },
    {
      id: 'cb-sweet',
      when: { mem: 'sweet-drink' },
      use: 'sweet-drink',
      open: '딸기 우유 좋아한다고 했었지? 오늘 두 개 샀어. 하나는 네 거!',
      replies: [
        { say: '건배하자!', tier: 'great', face: 'laugh', answer: ['건배! 짠, 소리가 미 음이야.', '딸기 우유 건배는 우리만 하는 거야.'] },
        { say: '기억해 줘서 고마워', tier: 'good', face: 'shy', answer: '당연하지. 좋아하는 걸 기억하는 게 내 특기야. 음 외우듯이.' },
        { say: '오늘은 커피 마시고 싶은데', tier: 'meh', face: 'sorry', answer: '에엥… 그럼 두 개 다 내가 마신다! 목이 오늘 분홍색 되겠다.' },
      ],
    },
    {
      id: 'cb-cafe',
      when: { mem: 'flower-cafe' },
      use: 'flower-cafe',
      open: ['같이 가기로 한 꽃 카페, 찾았어!', '연못 건너편, 창가에 동백 화분이 줄지어 있는 데야.'],
      replies: [
        { say: '이번 쉬는 날 가자', tier: 'great', face: 'laugh', answer: ['좋아! 지도에 그린 동그라미가 드디어 진짜가 된다.', '딸기 우유 맛있으면 거기가 우리 단골이야.'] },
        { say: '동백 좋아해?', tier: 'good', face: 'smile', answer: '응! 겨울에도 꿋꿋하게 피잖아. 무대 전 나도 그러고 싶어.' },
        { say: '멀지 않아?', tier: 'meh', face: 'calm', answer: '조금. 그래도 박자 맞춰 걸으면 금방이야. 쿵짝, 쿵짝.' },
      ],
    },
    {
      id: 'cb-teal',
      when: { mem: 'teal-hair' },
      use: 'teal-hair',
      open: '전에 트윈테일 반짝인다고 해 준 거, 그날 행운 칩 적립했잖아. 오늘 쓸래!',
      replies: [
        { say: '무슨 소원 빌 거야?', tier: 'great', face: 'shy', answer: ['오늘 무대에서 한 음도 안 틀리기.', '…랑, 끝나고 너랑 같이 퇴근하기. 두 개야.'] },
        { say: '칩은 테이블에서만!', tier: 'good', face: 'laugh', answer: '헤헤, 이건 진짜 칩 아니고 마음속 칩이야. 규칙 위반 아니야.' },
        { say: '그런 걸 했어?', tier: 'meh', face: 'sorry', answer: '에엥, 까먹었어? 난 하나도 안 까먹었는데.' },
      ],
    },
    {
      id: 'cb-nightsky',
      when: { mem: 'night-sky' },
      use: 'night-sky',
      open: '밤하늘 노래 말이야. 별 세 개씩 묶는 거. 어젯밤에 드디어 끝까지 셌어.',
      replies: [
        { say: '마지막 마디는 어땠어?', tier: 'great', face: 'wow', answer: ['유성이 하나 떨어졌어. 꼭 마지막 음표 같았어!', '그래서 그 노래는 별똥별로 끝나. 다음에 같이 세자.'] },
        { say: '밤새 셌어?', tier: 'good', face: 'laugh', answer: '응, 퇴근하고. 덕분에 아침에 칩 세다가 별 셀 뻔했어.' },
        { say: '그런 얘기 했었나', tier: 'meh', face: 'calm', answer: '했어! 괜찮아, 다음에 별 보면 또 얘기해 줄게.' },
      ],
    },
    {
      id: 'cb-firstfan',
      when: { mem: 'first-fan', ch: 3 },
      use: 'first-fan',
      open: '첫 번째 팬 되겠다고 했던 거, 아직 유효해? 축제 날 응원봉 준비됐어?',
      replies: [
        { say: '청록색으로 준비했어', tier: 'great', face: 'wow', answer: ['…진짜 했구나. 그럼 객석에서 그거부터 찾을게.', '첫 소절은 그 응원봉 쪽으로 부를 거야.'] },
        { say: '대파 흔들어도 돼?', tier: 'good', face: 'laugh', answer: '하하! 돼! 그럼 객석에서 단번에 찾겠다. 리본 묶어 와.' },
        { say: '아직 준비 못 했어', tier: 'meh', face: 'calm', answer: '괜찮아. 손만 흔들어 줘도 돼. 팬은 그걸로 충분해.' },
      ],
    },
    {
      id: 'cb-rhythm',
      when: { mem: 'dance-rhythm' },
      use: 'dance-rhythm',
      open: '쿵짝 걸음 연습했어? 오늘은 삼박자로 가 보자. 쿵짝짝, 쿵짝짝!',
      replies: [
        { say: '쿵짝짝, 쿵짝짝!', tier: 'great', face: 'laugh', answer: ['완벽해! 이제 너 왈츠 걸음 할 줄 안다.', '다음엔 손 잡고 돌기. 그건 무대 위에서만.'] },
        { say: '발이 꼬여', tier: 'good', face: 'smile', answer: '처음엔 다 꼬여. 꼬인 것도 박자야. 엇박이라고 해.' },
        { say: '그냥 걸으면 안 돼?', tier: 'meh', face: 'calm', answer: '돼. 그래도 마음속으로는 쿵짝짝 해 줘. 나만 알게.' },
      ],
    },
  ],
  chapters: [
    {
      title: '첫 소절',
      hint: '한 번 이야기를 나누면 미쿠가 새 노래의 첫 소절을 들려줘요.',
      need: { days: 1 },
      scene: [
        '문 열기 전의 별빛 카지노. 초록 펠트 위로 조명 하나만 켜져 있다.',
        '미쿠가 카드를 섞는다. 착, 착, 촤르륵. 손목이 박자를 탄다.',
        '테이블 끝에는 리본 묶은 대파 한 대가 마이크처럼 세워져 있다.',
        '"앗, {me}! 아직 개장 전인데… 쉿, 포츈 언니한테는 비밀."',
        '그녀가 카드를 내려놓고 대파를 집어 든다. 반은 장난, 반은 진심이다.',
        '"방금 떠오른 멜로디가 있어. 까먹기 전에 누가 들어 줬으면 했거든."',
        '작은 흥얼거림이 빈 홀을 채운다. 쌓아 둔 칩이 박자에 맞춰 달그락댄다.',
        '노래가 끝나자 미쿠가 귀 끝까지 빨개져서 대파 뒤로 얼굴을 숨긴다.',
        '"…어때? 아직 제목도, 가사도 없어. 네가 첫 번째 관객이야."',
        '"사실 언젠가 마을 축제 무대에서 부르고 싶어. 카드 말고, 노래로."',
      ],
      replies: [
        { say: '제목은 첫 소절로 하자', tier: 'great', face: 'wow', answer: ['첫 소절! 좋다, 그걸로 할래.', '너는 오늘부터 이 노래 작명가야. 그리고 첫 관객이고.', '…축제 얘기는 아직 비밀이야. 너만 알아.'] },
        { say: '좋다! 또 불러 줘', tier: 'good', face: 'laugh', answer: ['앙코르는 다음에!', '대신 계속 다듬어 둘게. 다음엔 한 소절 더 붙여서.'] },
        { say: '잘 모르겠어', tier: 'meh', face: 'calm', answer: ['괜찮아. 노래는 몇 번 들어야 좋아지는 거야.', '또 들려줄게. 언젠가 흥얼거리게 될걸?'] },
      ],
    },
    {
      title: '광장의 작은 무대',
      hint: '밤(게임 시각 저녁 일곱 시부터 열한 시) 마을 광장에 가 보세요. 미쿠가 몰래 노래한대요.',
      need: { days: 3, points: 20, visit: { area: 'village', from: 19, to: 23 } },
      scene: [
        '밤의 광장. 분수 물소리 사이로 낯익은 흥얼거림이 들려온다.',
        '미쿠가 빈 사과 상자를 뒤집어 놓고 그 위에 올라서 있다.',
        '"앗, 진짜 왔다! 관객 한 명. 오늘은 그걸로 충분해!"',
        '상자 옆에는 뚜껑에 청록 리본을 감은 유리병 하나가 놓여 있다.',
        '병 안에는 접힌 쪽지가 수북하다. 글씨체가 하나도 안 겹친다.',
        '"이건 가사 병이야. 지나가던 사람들이 한 줄씩 넣고 가."',
        '"신짜장 씨는 편지 얘기, 럭스는 바다 얘기, 선장님은 맨날 술 얘기."',
        '"내 노래는 원래 다 그래. 누구든 한 줄 주면, 내가 목소리를 빌려줘."',
        '그녀가 쪽지 하나를 펴서 즉석으로 음을 붙인다. 바람이 트윈테일을 흔든다.',
        '"카지노 무대는 일이고, 여기는 그냥 내가 좋아서 부르는 데야."',
        '"그러니까 오늘은 박수 대신 같이 흥얼거려 줘. 네 목소리도 섞이게."',
      ],
      replies: [
        { say: '같이 흥얼거릴게', tier: 'great', remember: 'plaza-stage', face: 'laugh', answer: ['최고야! 분수 소리, 너, 나. 삼중창이다!', '…방금 네 음, 병 속 쪽지보다 더 좋은 가사였어.', '다음엔 너도 한 줄 넣어 줘. 꼭.'] },
        { say: '박수는 쳐도 되지?', tier: 'good', remember: 'plaza-stage', face: 'smile', answer: ['헤헤, 그럼 박수는 마지막에!', '크게! 분수가 놀랄 만큼.'] },
        { say: '추운데 들어가자', tier: 'meh', remember: 'plaza-stage', face: 'sorry', answer: ['앗, 그러네. 손끝이 차다.', '한 곡만 더 하고! 진짜 한 곡만.'] },
      ],
    },
    {
      title: '딸기 한 바구니',
      hint: '미쿠가 딸기 이야기를 했어요. 딸기를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'strawberry', take: true } },
      scene: [
        '딸기를 내밀자 미쿠가 카드 섞던 손을 딱 멈춘다.',
        '"딸기다! 어떻게 알았어? 딸기 우유의 원재료잖아!"',
        '그녀가 한 알을 집어 테이블 조명에 비춰 본다. 달콤한 냄새가 퍼진다.',
        '그런데 딸기 옆, 펠트 위에 접힌 종이 한 장이 눈에 들어온다.',
        '"아, 그거… 축제 무대 신청서야. 잔나가 신문사에서 갖다줬어."',
        '"근데 축제 날 밤이 카지노 대목이야. 언니들한테 미안해서."',
        '멀리서 미스 포츈의 구두 소리가 또각또각 다가왔다가 멀어진다.',
        '"포츈 언니는 그냥 네가 정하래. 그 말이 제일 어려워."',
        '미쿠가 딸기를 반으로 갈라 하나를 내민다. 손끝에 붉은 물이 든다.',
        '"반 나눠 먹자. 혼자 먹으면 맛이 반이고, 고민은 두 배거든."',
        '마지막 딸기를 삼킨 뒤, 그녀가 청록 펜 뚜껑을 딸깍 연다.',
      ],
      replies: [
        { say: '둘이 먹으면 용기도 두 배', tier: 'great', remember: 'strawberry', face: 'laugh', answer: ['그 계산 마음에 들어!', '…좋아, 쓴다. 이름 칸에 미쿠. 딸기 물 묻었지만.', '첫 관객이 봤으니까 이제 못 물러.'] },
        { say: '다 먹어도 돼', tier: 'good', remember: 'strawberry', face: 'shy', answer: ['안 돼, 같이 먹어야 해. 노래도 딸기도 나눠야 맛있어.', '…신청서도 같이 봐 줘. 혼자 쓰면 손이 떨려.'] },
        { say: '신청은 천천히 해', tier: 'meh', remember: 'strawberry', face: 'think', answer: ['응… 그래도 되겠지.', '근데 딸기 다 먹을 때까지 고민하면 충분할 것 같아.'] },
      ],
    },
    {
      title: '너에게 쓰는 노래',
      hint: '미쿠와 새 노래 가사를 같이 쓰기로 약속하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'compose-help' },
      scene: [
        '카지노 뒷마당 처마 밑. 미쿠가 가사 병을 무릎에 안고 앉아 있다.',
        '"축제 곡, 거의 다 됐어. 가사 병 쪽지들로 만들었어."',
        '"아, 축제 날 근무는 포츈 언니가 대신 서 준대. 무뚝뚝하게."',
        '그녀가 악보를 펼친다. 쪽지마다 색깔 펜으로 줄이 그어져 있다.',
        '"여기는 빵집 아침 냄새, 여기는 등대 불빛. 이건 봇치가 준 한 줄."',
        '"이 노래는 내 노래가 아니라 마을 노래야. 난 부르는 사람이고."',
        '악보 맨 아래 한 줄이 비어 있다. 지운 자국이 몇 겹이나 남아 있다.',
        '"근데 마지막 줄은 아무 쪽지로도 안 채워지더라."',
        '"…처음 들어 준 사람, 같이 쓰자고 해 준 사람이 써 줬으면 해서."',
        '그녀가 청록 펜을 건넨다. 펜을 쥔 손끝이 조금 떨린다.',
        '바람에 쪽지 하나가 날아오르고, 미쿠가 대파로 꾹 눌러 잡는다.',
        '"천천히 써. 박자는 내가 맞출게. 그게 내 일이니까."',
      ],
      replies: [
        { say: '네 목소리가 닿는 곳까지', tier: 'great', face: 'shy', answer: ['…네 목소리가 닿는 곳까지.', '흠흠… 딱 맞아. 음이 거기서 멈추고 싶어 했어.', '이 줄은 무대에서 너를 보면서 부를게.'] },
        { say: '누구한테 주는 노래야?', tier: 'good', face: 'laugh', answer: ['헤헤, 그걸 물어? 마을 노래라고 했잖아.', '…근데 마지막 줄만은 펜 든 사람한테야.'] },
        { say: '난 가사 못 써', tier: 'meh', face: 'calm', answer: ['괜찮아. 그럼 그냥 이름 써.', '네 이름이 마지막 줄이면, 그걸로 완성이야.'] },
      ],
    },
    {
      title: '앙코르',
      hint: '미쿠와 아주 가까워지면 그녀가 무대가 끝난 뒤의 이야기를 들려줘요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '축제 날 밤. 광장 무대 위로 등불이 줄줄이 켜져 있다.',
        '무대 뒤 천막, 미쿠가 마이크를 쥔 채 제자리에서 콩콩 뛴다.',
        '"손 떨려. 진짜 떨려. 진심이라 떨리는 거 맞지?"',
        '사회를 맡은 잔나가 이름을 부르자 그녀가 숨을 크게 들이쉰다.',
        '첫 소절. 목소리가 조금 흔들리다가, 객석을 훑던 눈이 너에게 멈춘다.',
        '그 순간부터 노래가 곧게 뻗는다. 마을 사람들의 가사가 광장을 돈다.',
        '봇치가 무대 옆에서 기타를 보태고, 예림이는 팔짱을 끼고 웃는다.',
        '마지막 줄에서 미쿠가 잠깐 멈췄다가, 너를 보며 부른다.',
        '박수가 끝나고 등불이 하나씩 꺼진 뒤, 그녀가 무대 끝에 걸터앉는다.',
        '"무대 끝나면 늘 좀 외로웠어. 근데 오늘은 하나도 안 그래."',
        '"객석에서 제일 먼저 찾은 얼굴이 너였어. 처음부터 끝까지."',
        '"앙코르 하나만 할게. 이번엔 관객이 너 하나야."',
      ],
      replies: [
        { say: '앙코르! 앙코르!', tier: 'great', remember: 'encore-promise', face: 'laugh', answer: ['헤헤… 그럼 첫 소절부터 다시.', '꽃다발이라도 있으면 진짜 무대 같을 텐데.', '아, 아무 말도 안 했어! 진짜야!'] },
        { say: '외로울 땐 불러', tier: 'good', remember: 'encore-promise', face: 'shy', answer: ['…응. 이제 박수 끝나도 안 무서워.', '끝나고 돌아볼 데가 생겼으니까.'] },
        { say: '피곤해 보여', tier: 'meh', remember: 'encore-promise', face: 'calm', answer: ['조금. 목도 살짝 잠겼어.', '그래도 이 노래는 꼭 하고 갈래. 너한테만.'] },
      ],
    },
    {
      title: '듀엣',
      hint: '미쿠와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '쉬는 날 오후, 연못가 꽃밭. 미쿠가 마이크 두 개를 들고 기다린다.',
        '하나는 청록 리본이 감긴 반짝이, 하나는 아직 리본이 없는 새 마이크다.',
        '"축제 끝나고 노래 부탁이 엄청 왔어. 결혼식, 생일, 등대 점등식까지."',
        '"근데 제일 부르고 싶은 노래는 딱 하나 남았어. 비어 있던 듀엣 곡."',
        '그녀가 리본 없는 마이크를 내민다. 꽃밭 위로 벌 한 마리가 지나간다.',
        '"으앗, 벌! …괜찮아, 괜찮아. 너 있으니까 안 무서워."',
        '둘이 부르는 첫 소절. 네 음이 조금 낮고, 미쿠가 반음 내려 맞춘다.',
        '"봐, 맞춰졌지? 박자 놓쳐도 돼. 음 틀려도 돼. 내가 따라갈게."',
        '노래가 끝나자 미쿠가 새 마이크에 리본을 감다 말고 손을 멈춘다.',
        '"있잖아, 노래는 끝나도 후렴은 계속 돌아오잖아."',
        '"…반지도 그렇대. 끝이 없이 동그랗게 이어져서."',
        '"아, 아무 말도 안 했어! 방금 건 가사 연습이야. 진짜야."',
      ],
      replies: [
        { say: '끝까지 같이 부르자', tier: 'great', face: 'laugh', answer: ['응! 이 노래는 끝이 없는 걸로 할래.', '후렴 돌아올 때마다 네 쪽 볼게. 계속, 계속.'] },
        { say: '음치라도 괜찮아?', tier: 'good', face: 'shy', answer: ['너라서 괜찮아. 네 음이 내 음이야.', '반음쯤은 내가 언제든 내려갈게.'] },
        { say: '부끄러운데', tier: 'meh', face: 'smile', answer: ['헤헤, 그럼 작게. 둘만 들리게.', '벌도 지나갔고, 이제 관객은 꽃밖에 없어.'] },
      ],
    },
  ],
  after: [
    '오늘 이야기는 했잖아! 그래도 또 와 줘서 땡큐!',
    '흠흠, 오늘의 노래는 끝! 내일 새 곡 들려줄게.',
    '앙코르는 내일 무대에서! 약속.',
    '삼구! 아니 땡큐! 또 와.',
    '가사 병에 한 줄 넣고 가도 돼. 언제든!',
    '쉿, 지금은 딜러 얼굴 하는 중. 흠, 흠, 흐음.',
    '오늘 목은 다 썼어. 남은 건 흥얼거림뿐이야.',
    '다음에 올 땐 꽃 이야기 하나 들고 와 줘.',
  ],
};
