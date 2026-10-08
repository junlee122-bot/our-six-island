// 나모 — 범마을 은행원, 스물여섯. 『사니양 연구실』의 푸른 머리 늑대 계열 수인 대학원생을
// 은행 창구의 '프로 은행원'으로 옮겼다. 차분한 해요체. 시크해 보이지만 나사가 하나 빠져 있고
// (머리 위 안경, 손에 든 도장, 거꾸로 든 서류), 체력은 바닥(계단 → 헥헥). 야근·마감·결산에
// 쫓기고, 쉬는 날엔 소설·영화·게임 덕질. 주민들로 이야기를 지어내다 "아무것도 아니에요".
// 수인 중에선 머리가 좋은 편이라고 은근히 어필. 귀·꼬리가 먼저 반응하고("못 본 걸로 해요")
// 코가 예민하다. 생선이면 다 좋고(고등어!) 매운 건 못 먹는다. 마음도 장부·금고·이자로 셈한다.
// 신짜장(서류 배달, 빵 냄새), 미스 포츈(대부 창구 이자 맞수), 무잔(예금이냐 투자냐 금리 논쟁).
// 원작 대사는 옮기지 않은 오리지널 대사예요.
import type { NpcTalkBook } from './types.ts';

export const NYAMO_TALK: NpcTalkBook = {
  npc: 'nyamo',
  memories: {
    'novel-pal': '소설 이야기를 같이 했어요',
    'mackerel-fan': '고등어가 제일이라고 맞장구쳤어요',
    'no-spicy': '매운 걸 못 먹는 걸 알아줬어요',
    'slow-walk': '계단은 천천히 같이 오르자고 했어요',
    'glasses-find': '머리 위 안경을 찾아 줬어요',
    'overtime-cheer': '야근하는 나모를 응원했어요',
    'story-ears': '나모가 지어낸 이야기를 들어 줬어요',
    'smart-wolf': '나모가 머리 좋다고 인정했어요',
    'tail-secret': '꼬리 흔드는 걸 못 본 걸로 해 줬어요',
    'saver': '예금이 든든하다고 했어요',
    'nose-test': '나모의 코가 대단하다고 했어요',
    'moon-howl': '보름달 이야기를 나눴어요',
    'game-night': '밤새 게임한 이야기를 들었어요',
    'moon-hill': '뒷산에서 달을 함께 봤어요',
    'mackerel-gift': '고등어를 선물했어요',
    'taste-heard': '내 취향을 장부에 적어 뒀대요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'bday-heard': '생일이 다가온다는 걸 나모가 알아챘어요',
  },
  talks: [
    {
      id: 'novel',
      open: '{me} 님, 요즘 무슨 책 읽어요? 저는 어젯밤 소설 한 권을 끝냈어요.',
      replies: [
        { say: '나도 소설 좋아해! 무슨 책이야?', tier: 'great', remember: 'novel-pal', face: 'wow', answer: ['…같은 편이네요. 귀가 쫑긋했어요.', '추리 소설이에요. 범인은 은행원이었어요. 저 아니에요.'] },
        { say: '밤새 읽은 거야?', tier: 'good', face: 'shy', answer: '네. 한 장만 더, 하다가 해가 떴어요. 장부엔 안 적을게요.' },
        { say: '책은 잘 안 읽어', tier: 'meh', answer: '괜찮아요. 줄거리는 제가 이야기해 드릴게요. 길어요.' },
      ],
    },
    {
      id: 'mackerel',
      open: '생선은 다 좋지만 하나만 고르라면요… {me} 님은 뭐 같아요?',
      replies: [
        { say: '고등어지!', tier: 'great', remember: 'mackerel-fan', face: 'laugh', answer: ['…맞혔어요. 꼬리가 멋대로 흔들려요.', '아, 못 본 걸로 해요. 고등어 얘기라서 그래요.'] },
        { say: '은어 아니야?', tier: 'good', face: 'think', answer: '은어도 좋아요. 봄에만 있어서 더 소중해요. 근데 일 등은 아니에요.' },
        { say: '생선은 다 똑같지 않아?', tier: 'meh', face: 'sorry', answer: '…장부에 숫자가 다 똑같다는 말이랑 같아요. 조금 슬퍼요.' },
      ],
    },
    {
      id: 'spicy',
      open: '점심에 누가 매운탕을 권했어요. 냄새만 맡았는데 코가 먼저 도망갔어요.',
      replies: [
        { say: '다음엔 안 매운 걸로 챙겨 줄게', tier: 'great', remember: 'no-spicy', face: 'shy', answer: '…고마워요. 그 말, 이자 붙여서 갚을게요.' },
        { say: '조금씩 먹다 보면 익숙해져', tier: 'good', face: 'think', answer: '그런 말 들은 지 이십 년째예요. 아직도 안 익숙해요.' },
        { say: '매운 게 맛있는데', tier: 'meh', answer: '취향은 존중해요. 근데 제 앞에선 뚜껑 덮어 주세요.' },
      ],
    },
    {
      id: 'stairs',
      open: '은행 이 층 서류실 다녀왔어요. 헥, 헥… 잠깐만요. 숨 좀 고를게요.',
      replies: [
        { say: '다음엔 천천히 같이 올라가자', tier: 'great', remember: 'slow-walk', face: 'shy', answer: '…같이요? 그럼 계단이 조금 짧아질 것 같아요.' },
        { say: '늑대인데 체력이 없어?', tier: 'good', face: 'sorry', answer: '날렵해 보인다는 말은 들어요. 겉모습만요. 장부만큼 정직하죠.' },
        { say: '운동 좀 해', tier: 'meh', answer: '알아요. 내일부터 할게요. …그 내일이 삼 년째예요.' },
      ],
    },
    {
      id: 'glasses',
      open: '안경이 어디 갔지… {me} 님, 혹시 제 안경 봤어요?',
      replies: [
        { say: '머리 위에 있어', tier: 'great', remember: 'glasses-find', face: 'shy', answer: ['…아. 있네요.', '머리는 좋은데요. 진짜예요. 못 본 걸로 해요.'] },
        { say: '같이 찾아볼게', tier: 'good', face: 'smile', answer: '고마워요. 서랍, 금고, 장부 사이… 아, 머리 위였어요.' },
        { say: '그 손에 든 건 도장이야?', tier: 'meh', face: 'wow', answer: '…도장도 찾고 있었어요. 하나는 해결됐네요.' },
      ],
    },
    {
      id: 'overtime',
      open: '이번 주 야근이 사흘째예요. 결산은 왜 꼭 금요일에 몰릴까요.',
      replies: [
        { say: '고생 많아. 야근 간식 사 올게', tier: 'great', remember: 'overtime-cheer', face: 'wow', answer: '…정말요? 생선 과자면 오늘 밤은 버틸 수 있어요.' },
        { say: '일찍 들어가서 자', tier: 'good', face: 'sorry', answer: '그러고 싶어요. 장부가 안 놓아줘요. 저도 장부를 못 놓고요.' },
        { say: '은행원은 편할 줄 알았는데', tier: 'meh', answer: '다들 그렇게 말해요. 창구 뒤를 보면 생각이 바뀔 거예요.' },
      ],
    },
    {
      id: 'stories',
      open: '아까 광장에서 두 분이 우산 하나를 같이 쓰더라고요. 제 머릿속에선 벌써 삼 권째예요.',
      replies: [
        { say: '그 이야기 들려줘!', tier: 'great', remember: 'story-ears', face: 'laugh', answer: ['첫 권은 우산 하나로 시작해요. 둘째 권에서 오해가…', '…아, 아무것도 아니에요. 지어낸 거예요.'] },
        { say: '누구랑 누군데?', tier: 'good', face: 'shy', answer: '그건 비밀이에요. 은행원은 입이 무거워요. 머릿속만 가볍죠.' },
        { say: '그냥 비 와서 같이 쓴 거겠지', tier: 'meh', face: 'think', answer: '…그렇죠. 현실은 소설보다 이자가 적어요.' },
      ],
    },
    {
      id: 'smart',
      open: '이자 계산은 암산으로 해요. 수인 중에선 머리 좋은 편이거든요. 어디까지나 편이에요.',
      replies: [
        { say: '편이 아니라 진짜 똑똑해', tier: 'great', remember: 'smart-wolf', face: 'shy', answer: '…그렇게 말해 주면 귀가 뜨거워져요. 계산이 틀릴 것 같아요.' },
        { say: '그럼 이거 계산해 봐', tier: 'good', face: 'laugh', answer: '이미 했어요. {me} 님 이번 달 이자, 머릿속에 다 있어요.' },
        { say: '안경은 맨날 잃어버리면서', tier: 'meh', face: 'sorry', answer: '…그건 머리 문제가 아니라 머리 위 문제예요.' },
      ],
    },
    {
      id: 'tail',
      open: '방금 꼬리가 흔들렸죠. 아니에요. 바람이에요. 은행 안에 바람이 좀 불어요.',
      replies: [
        { say: '응, 못 본 걸로 할게', tier: 'great', remember: 'tail-secret', face: 'shy', answer: '…고마워요. 이 비밀은 금고에 넣어 둘게요. 둘만 아는 걸로요.' },
        { say: '나 와서 좋은 거지?', tier: 'good', face: 'wow', answer: '그, 그건… 창구 손님이 와서 반가운 거예요. 업무예요.' },
        { say: '창문 닫아 줄까?', tier: 'meh', face: 'think', answer: '…네, 닫아 주세요. 바람 탓이라고 해야 하니까요.' },
      ],
    },
    {
      id: 'deposit',
      open: '{me} 님은 돈이 생기면 예금해요, 투자해요? 무잔 씨는 투자래요.',
      replies: [
        { say: '예금. 든든하잖아', tier: 'great', remember: 'saver', face: 'laugh', answer: '…좋아요. 정말 좋아요. 무잔 씨한테 전해 주고 싶을 만큼요.' },
        { say: '반은 예금, 반은 투자', tier: 'good', face: 'think', answer: '현명해요. 근데 반 중에 예금이 조금 더 크면 좋겠어요.' },
        { say: '다 투자해야지', tier: 'meh', face: 'sorry', answer: '…무잔 씨가 기뻐하겠네요. 저는 장부를 조용히 덮을게요.' },
      ],
    },
    {
      id: 'nose',
      open: '{me} 님, 오늘 아침에 빵 드셨죠. 버터 들어간 거요. 냄새로 알아요.',
      replies: [
        { say: '와, 맞아! 코가 대단하다', tier: 'great', remember: 'nose-test', face: 'laugh', answer: '수인이니까요. 금고 안에 지폐가 몇 장인지도 냄새로… 반쯤은 농담이에요.' },
        { say: '좀 무서운데', tier: 'good', face: 'sorry', answer: '아, 죄송해요. 아무한테나 안 해요. {me} 님 냄새는 익숙해서요.' },
        { say: '아닌데, 떡이었어', tier: 'meh', face: 'think', answer: '…떡이었어요? 버터 떡이었을 거예요. 그렇다고 해 줘요.' },
      ],
    },
    {
      id: 'moon',
      open: '보름달 뜨는 밤엔 좀 들떠요. 목이 간질간질해요. 근무 중이라 참지만요.',
      replies: [
        { say: '참지 말고 한 번 불러 봐', tier: 'great', remember: 'moon-howl', face: 'shy', answer: '…은행에서요? 안 돼요. 언젠가 아무도 없는 데서라면 몰라도요.' },
        { say: '달 보면 기분 좋지', tier: 'good', face: 'smile', answer: '네. 결산 끝난 밤에 보는 달이 제일 좋아요. 보통 새벽이지만요.' },
        { say: '그냥 감기 아니야?', tier: 'meh', face: 'think', answer: '…그럴 수도 있어요. 수인 감기는 귀부터 와요.' },
      ],
    },
    {
      id: 'games',
      open: '쉬는 날에 게임을 시작했는데요, 정신 차려 보니 출근 시간이었어요.',
      replies: [
        { say: '무슨 게임인데? 나도 할래', tier: 'great', remember: 'game-night', face: 'wow', answer: '…같이 해 줘요? 마을 키우는 게임이에요. 은행도 지었어요.' },
        { say: '그래서 오늘 졸린 거구나', tier: 'good', face: 'sorry', answer: '들켰어요. 커피 세 잔째예요. 장부는 맞았어요. 아마요.' },
        { say: '게임은 시간 낭비 아니야?', tier: 'meh', answer: '저축이에요. 추억 저축. 이자는 좀 이상하게 붙지만요.' },
      ],
    },
    {
      id: 'films',
      open: '영화 볼 때 생선 나오는 장면만 기억나요. 줄거리는 친구가 말해 줘요.',
      replies: [
        { say: '그래도 즐거우면 됐지', tier: 'great', face: 'laugh', answer: '…그쵸. 이 말 장부 맨 앞장에 적어 둘게요.' },
        { say: '나랑 같이 보면 줄거리 말해 줄게', tier: 'good', face: 'shy', answer: '…생선 장면에선 조용히 해 줘요. 집중해야 하니까요.' },
        { say: '그건 영화를 안 본 거야', tier: 'meh', face: 'sorry', answer: '…맞아요. 저는 생선을 본 거예요.' },
      ],
    },
    {
      id: 'ledger-page',
      when: { ch: 3 },
      open: '{me} 님, 제 장부 맨 뒷장 본 적 있어요? …아니에요. 거긴 업무용이 아니라서요.',
      replies: [
        { say: '뭐라고 적혀 있는지 궁금하다', tier: 'great', face: 'shy', answer: ['{me} 님 이름이요. 날짜랑. 이자는 안 적었어요.', '…셀 수가 없어서요. 못 본 걸로 해요.'] },
        { say: '비밀 장부야?', tier: 'good', face: 'think', answer: '비밀이라기보다… 금고에 넣기엔 너무 자주 펼쳐 보는 장부예요.' },
        { say: '업무 아니면 됐어', tier: 'meh', answer: '네. 됐어요. …조금 아쉽지만요.' },
      ],
    },
    {
      id: 'dating-lunch',
      when: { love: 'dating' },
      open: '{me} 님, 오늘 점심은 고등어 두 마리예요. 하나는 {me} 님 거예요.',
      replies: [
        { say: '가시는 내가 발라 줄게', tier: 'great', face: 'shy', answer: '…그럼 저는 접시를 데워 둘게요. 꼬리는 못 본 걸로 해요.' },
        { say: '둘 다 나모가 먹어', tier: 'good', face: 'laugh', answer: '안 돼요. 같이 먹는 게 이자예요. 맛이 두 배가 되거든요.' },
        { say: '난 고기가 좋은데', tier: 'meh', face: 'sorry', answer: '…그럼 다음엔 고기도 하나 살게요. 고등어 옆에요.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: 'rain' },
      open: '비 오는 날은 꼬리털이 눅눅해요. 아, 방금 말은 못 들은 걸로 해요.',
      replies: [
        { say: '수건 빌려줄까?', tier: 'great', face: 'shy', answer: '…고마워요. 창구 뒤에서 몰래 말릴게요. 손님 눈엔 안 띄게요.' },
        { say: '빗소리 좋지 않아?', tier: 'good', face: 'smile', answer: '좋아요. 빗소리 들으며 장부 넘기는 거, 제일 좋아해요.' },
        { say: '털이 많아서 그래', tier: 'meh', face: 'think', answer: '…알아요. 겨울엔 그 털 덕분에 버티니까 참을게요.' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: '바람 소리에 귀가 자꾸 납작해져요. 금고는 튼튼한데 저는 안 튼튼해요.',
      replies: [
        { say: '바람 그칠 때까지 같이 있을게', tier: 'great', face: 'shy', answer: '…그럼 귀가 좀 펴질 것 같아요. 의자 하나 더 가져올게요.' },
        { say: '금고에 들어가 있어', tier: 'good', face: 'laugh', answer: '…그 생각 저도 했어요. 진짜로요. 들어가진 않았어요.' },
        { say: '폭풍 별거 아니야', tier: 'meh', face: 'sorry', answer: '{me} 님 귀는 작아서 그래요. 저는 다 들려요.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 와요. 뛰어나가고 싶은데요… 열 걸음이면 지칠 걸 알아서 창밖만 봐요.',
      replies: [
        { say: '열 걸음만 같이 뛰자', tier: 'great', face: 'laugh', answer: '…열 걸음이요? 좋아요. 열한 걸음째엔 업어 줘야 해요.' },
        { say: '창밖 구경도 좋지', tier: 'good', face: 'smile', answer: '네. 눈 위 발자국 세는 거 좋아해요. 장부 버릇이에요.' },
        { say: '추운데 왜 나가?', tier: 'meh', face: 'think', answer: '수인은 눈 보면 그래요. 이유는 장부에도 없어요.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '늦었네요. 은행은 닫았는데 저는 아직 안 닫았어요. 서류가 남아서요.',
      replies: [
        { say: '서류 정리 도와줄게', tier: 'great', face: 'wow', answer: '…정말요? 그럼 저는 도장, 아니 도장 찾는 걸 할게요.' },
        { say: '그만하고 집에 가', tier: 'good', face: 'sorry', answer: '조금만요. 이 장만 맞추면… 아까도 그렇게 말했죠.' },
        { say: '나도 잠이 안 와서', tier: 'meh', answer: '그럼 같이 깨어 있어요. 커피는 없어요. 제가 다 마셨어요.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '이른 시간이네요. 저는… 퇴근을 안 한 거예요. 결산이라서요.',
      replies: [
        { say: '밤새운 거야? 아침 먹으러 가자', tier: 'great', face: 'wow', answer: '…생선 파는 데로요? 그럼 체력이 조금 남아 있어요.' },
        { say: '새벽 공기 좋지', tier: 'good', face: 'smile', answer: '네. 새벽엔 장부도 조용하고, 고등어 배 냄새도 들어와요.' },
        { say: '눈 밑이 까매', tier: 'meh', face: 'sorry', answer: '…털 색이에요. 그렇다고 해 줘요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제 날엔 은행도 쉬어요. 생선 좌판 돌고, 밀린 소설 읽을 거예요.',
      replies: [
        { say: '좌판 같이 돌자', tier: 'great', face: 'laugh', answer: '좋아요. 꼬치는 제가 살게요. 매운 양념 빼고요.' },
        { say: '오늘은 장부 덮어', tier: 'good', face: 'smile', answer: '네. 오늘만은 덮었어요. …가방에 하나 넣어 오긴 했지만요.' },
        { say: '축제엔 사람 많아서 싫어', tier: 'meh', face: 'think', answer: '저도 냄새가 너무 많아서 코가 바빠요. 조금만 돌아요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: ['mackerel', 'crucian', 'sweetfish', 'horsemackerel'] },
      open: '{me} 님, 오늘 {fish} 낚았죠. 문 열리기 전에 코가 먼저 알았어요.',
      replies: [
        { say: '나모 주려고 낚았지', tier: 'great', face: 'shy', answer: '…꼬리가 멋대로 흔들려요. 못 본 걸로 해요. 정말 고마워요.' },
        { say: '냄새로 그걸 알아?', tier: 'good', face: 'laugh', answer: '수인이니까요. 크기도 대충 알아요. 그건 반쯤 농담이에요.' },
        { say: '팔러 가는 길이야', tier: 'meh', face: 'sorry', answer: '…그렇군요. 좋은 값 받으세요. 귀는 조금 처졌지만요.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '큰 놈 낚으셨다면서요. 소문이 창구까지 왔어요. 마을 장부에 적을 일이에요.',
      replies: [
        { say: '나모한테 제일 먼저 자랑하고 싶었어', tier: 'great', face: 'shy', answer: '…저한테요? 그럼 제 장부엔 특별 칸을 만들게요.' },
        { say: '운이 좋았어', tier: 'good', face: 'smile', answer: '운도 실력이라고 하던데요. 미스 포츈 씨는 아니라겠지만요.' },
        { say: '손이 아직 떨려', tier: 'meh', face: 'wow', answer: '저도 계단 오르면 떨려요. 그거랑은 다르겠지만요.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물을 거두셨다고요. 이건 거의 금고에 넣어야 하는 물건이에요.',
      replies: [
        { say: '나모 금고에 맡길게', tier: 'great', face: 'laugh', answer: '맡아 드릴게요. 이자 대신 매일 한 번씩 보러 와도 돼요.' },
        { say: '시장에 팔 거야', tier: 'good', face: 'smile', answer: '좋은 값 받으세요. 판 돈은 예금하러 오시고요. 꼭이요.' },
        { say: '먹을 거야', tier: 'meh', face: 'think', answer: '…그것도 좋아요. 매운 요리에만 넣지 마세요.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일하고 오셨네요. 흙냄새가 나요. 좋은 냄새예요. 생선 다음으로요.',
      replies: [
        { say: '생선 다음이면 일 등이나 마찬가지네', tier: 'great', face: 'laugh', answer: '…맞아요. 생선은 순위 밖이니까요. 영예의 일 등이에요.' },
        { say: '오늘 꽤 많이 거뒀어', tier: 'good', face: 'smile', answer: '수확은 저축이랑 비슷해요. 꾸준히 하면 쌓여요.' },
        { say: '씻고 올게', tier: 'meh', answer: '괜찮아요. 제 코는 흙냄새엔 관대해요. 매운 냄새만 아니면요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 님, 오늘은 귀가 처져 보여요. …아, 인간은 귀가 안 처지죠. 얼굴이요.',
      replies: [
        { say: '좀 지쳤어', tier: 'great', face: 'sorry', answer: ['그런 날은 장부 덮어요. 저도 덮을게요.', '생선 사탕 하나 드릴게요. 단골 손님 비상용이에요.'] },
        { say: '나모도 늘 지쳐 보여', tier: 'good', face: 'laugh', answer: '…저는 기본값이 그래요. 오늘은 {me} 님이 우선이에요.' },
        { say: '괜찮아', tier: 'meh', face: 'think', answer: '괜찮다는 말은 장부에서 제일 안 맞는 숫자예요. 쉬어요.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '오늘 {me} 님 발소리가 가벼워요. 문 열리기 전에 들렸어요. 좋은 일 있어요?',
      replies: [
        { say: '나모 보러 오는 길이라서', tier: 'great', face: 'shy', answer: '…그런 말은 장부에 적을 칸이 없어요. 새로 만들게요.' },
        { say: '그냥 날씨가 좋아서', tier: 'good', face: 'smile', answer: '좋아요. 그 기분 예금해 두세요. 이자 붙여 드릴게요.' },
        { say: '그렇게 티 나?', tier: 'meh', face: 'laugh', answer: '제 귀엔요. 다른 분들은 모를 거예요.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me} 님, 오늘 생일이죠. 장부에 동그라미 쳐 뒀어요. …업무용 장부 아니에요.',
      replies: [
        { say: '기억해 줬구나, 고마워', tier: 'great', face: 'shy', answer: ['생일 축하해요.', '생선 모양 사탕, 오늘은 한 봉지 다 드릴게요.'] },
        { say: '케이크는 있어?', tier: 'good', face: 'laugh', answer: '케이크는 없고… 고등어 케이크는 어때요? 농담이에요. 반쯤요.' },
        { say: '생일 별거 아니야', tier: 'meh', face: 'think', answer: '별거예요. 일 년에 한 번 붙는 이자 같은 날이에요.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '마을에 결혼 소식이 있대요. 제 머릿속에선 둘의 이야기가 벌써 다섯 권째예요.',
      replies: [
        { say: '마지막 권은 어떻게 끝나?', tier: 'great', face: 'laugh', answer: ['둘이 같은 금고 열쇠를 나눠 갖는 걸로 끝나요.', '…아, 아무것도 아니에요. 지어낸 거예요.'] },
        { say: '축하할 일이네', tier: 'good', face: 'smile', answer: '네. 은행에선 공동 통장을 준비해 둘게요. 업무예요.' },
        { say: '결혼은 아직 먼 얘기야', tier: 'meh', face: 'think', answer: '…그쵸. 저한테도요. 아마도요.' },
      ],
    },
    {
      id: 'op-record',
      when: { news: 'record' },
      open: '오늘 마을 소식 봤어요? 장부에 적을 일이 또 생겼어요. 야근 확정이에요.',
      replies: [
        { say: '야근 간식은 내가 챙길게', tier: 'great', face: 'wow', answer: '…그럼 야근이 조금 덜 길어질 것 같아요. 진짜로요.' },
        { say: '마을이 북적이네', tier: 'good', face: 'smile', answer: '좋은 일이에요. 은행은 바빠지지만 장부가 즐거워해요.' },
        { say: '난 잘 모르겠어', tier: 'meh', answer: '괜찮아요. 제가 요약해 드릴게요. 세 줄이에요. 길어질 수도 있어요.' },
      ],
    },
    {
      id: 'op-sinjjajang',
      when: { bond: 'sinjjajang' },
      open: '신짜장 씨 만났죠. 아까 가져온 서류에서 또 빵 냄새가 났어요. 코는 못 속여요.',
      replies: [
        { say: '서류보다 빵을 먼저 배달했나 봐', tier: 'great', face: 'laugh', answer: '…그런 것 같아요. 다음엔 빵도 같이 배달해 달라고 할까요.' },
        { say: '부지런한 우체부잖아', tier: 'good', face: 'smile', answer: '맞아요. 서류는 늘 제시간이에요. 빵 부스러기도요.' },
        { say: '그냥 기분 탓 아니야?', tier: 'meh', face: 'think', answer: '제 코는 기분을 안 타요. 버터에 밀가루, 확실해요.' },
      ],
    },
    {
      id: 'op-rose',
      when: { bond: 'rose' },
      open: '미스 포츈 씨 창구 다녀왔죠. 이자 얘기 들었어요? 저희가 조금 더 싸요.',
      replies: [
        { say: '나모 창구가 더 따뜻하던데', tier: 'great', face: 'shy', answer: '…따뜻한 건 이자에 안 붙지만, 장부엔 적을게요. 고마워요.' },
        { say: '둘이 경쟁하는 거 재밌어', tier: 'good', face: 'laugh', answer: '경쟁이요? 저는 정확할 뿐이에요. 그분도 그렇게 말하겠지만요.' },
        { say: '포츈 쪽이 빠르던데', tier: 'meh', face: 'sorry', answer: '…빠른 건 인정해요. 저는 계단에서 시간을 좀 써요.' },
      ],
    },
    {
      id: 'op-muzan',
      when: { bond: 'muzan' },
      open: '무잔 씨 만났죠. 또 투자가 최고라고 했겠죠. 예금이 얼마나 든든한데요.',
      replies: [
        { say: '난 나모 편이야', tier: 'great', face: 'shy', answer: '…한 표 얻었어요. 장부에 굵게 적을게요. 무잔 씨한텐 비밀로요.' },
        { say: '둘 다 일리가 있던데', tier: 'good', face: 'think', answer: '공정하네요. 그래도 비 오는 날엔 예금이 우산이에요.' },
        { say: '무잔 말이 그럴듯하던데', tier: 'meh', face: 'sorry', answer: '…그분 말솜씨는 인정해요. 금리는 제가 이길 거예요.' },
      ],
    },
    {
      id: 'op-stockdown',
      when: { recent: 'stockDown' },
      open: '주식이 내려갔다면서요. 예금은 안 내려가요. …지금 말할 건 아니었죠. 미안해요.',
      replies: [
        { say: '아니야, 위로가 돼', tier: 'great', face: 'smile', answer: '…그럼 다행이에요. 손해 본 날엔 생선구이 드세요. 나아져요.' },
        { say: '다음엔 예금할게', tier: 'good', face: 'laugh', answer: '창구는 늘 열려 있어요. 저도요. 야근 중이라서요.' },
        { say: '다시 오를 거야', tier: 'meh', face: 'think', answer: '그러길 바라요. 무잔 씨도 그렇게 말하겠죠.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-mackerel',
      when: { mem: 'mackerel-fan' },
      use: 'mackerel-fan',
      open: '고등어가 제일이라던 {me} 님. 오늘 시장에 고등어 들어왔대요. 같이 가 볼래요?',
      replies: [
        { say: '좋아, 지금 가자', tier: 'great', face: 'laugh', answer: '…지금요? 장부 덮을게요. 계단은 천천히 내려가요.' },
        { say: '그걸 기억했구나', tier: 'good', face: 'shy', answer: '고등어 얘기는 잊을 수가 없어요. 장부보다 잘 기억해요.' },
        { say: '오늘은 바빠', tier: 'meh', face: 'sorry', answer: '…괜찮아요. 한 마리 사서 반 남겨 둘게요.' },
      ],
    },
    {
      id: 'cb-spicy',
      when: { mem: 'no-spicy' },
      use: 'no-spicy',
      open: '안 매운 거 챙겨 준다던 말, 아직 장부에 있어요. 오늘 점심도 매운 거였어요.',
      replies: [
        { say: '지금 순한 거 사 올게', tier: 'great', face: 'wow', answer: '…정말 사 왔네요. 이 빚은 이자까지 쳐서 갚을게요.' },
        { say: '그 말 기억했어?', tier: 'good', face: 'shy', answer: '은행원은 약속을 잊지 않아요. 특히 먹는 약속은요.' },
        { say: '조금은 먹어 봐', tier: 'meh', face: 'sorry', answer: '…한 숟갈 먹었어요. 귀까지 빨개졌어요.' },
      ],
    },
    {
      id: 'cb-glasses',
      when: { mem: 'glasses-find' },
      use: 'glasses-find',
      open: '{me} 님, 이번엔 안경 어디 있는지 알아요. 머리 위요. …아, 없네요.',
      replies: [
        { say: '목에 걸려 있어', tier: 'great', face: 'shy', answer: '…목걸이 줄을 샀거든요. 그걸 잊었어요. 머리는 좋은데요.' },
        { say: '또 찾아 줄까?', tier: 'good', face: 'laugh', answer: '네. {me} 님은 제 안경 담당이에요. 정식 업무예요.' },
        { say: '안경 하나 더 사', tier: 'meh', face: 'think', answer: '샀어요. 두 개 다 어디 있는지 몰라요.' },
      ],
    },
    {
      id: 'cb-overtime',
      when: { mem: 'overtime-cheer' },
      use: 'overtime-cheer',
      open: '야근 간식 사 온다던 거요. 그 말 듣고 진짜로 장부가 한 번에 맞았어요.',
      replies: [
        { say: '오늘은 진짜 사 왔어', tier: 'great', face: 'wow', answer: '…생선 과자예요? 꼬리가… 못 본 걸로 해요. 고마워요.' },
        { say: '말만으로도 효과가 있네', tier: 'good', face: 'laugh', answer: '그러니까요. {me} 님 말은 이자가 높아요.' },
        { say: '그래도 야근은 줄여', tier: 'meh', face: 'sorry', answer: '노력할게요. 결산이 허락하면요.' },
      ],
    },
    {
      id: 'cb-stories',
      when: { mem: 'story-ears' },
      use: 'story-ears',
      open: '지난번에 들려준 우산 이야기, 넷째 권까지 갔어요. 이번엔 주인공이 은행원이에요.',
      replies: [
        { say: '그 은행원, 혹시 나모야?', tier: 'great', face: 'shy', answer: '…아무것도 아니에요. 지어낸 거예요. 상대역 이름은 아직 비워 뒀어요.' },
        { say: '다섯째 권도 기대할게', tier: 'good', face: 'laugh', answer: '야근 없는 날에 쓸게요. 그러니까… 언젠가요.' },
        { say: '진짜 소설로 내 봐', tier: 'meh', face: 'think', answer: '머릿속에만 있어서 좋은 거예요. 장부랑 반대예요.' },
      ],
    },
    {
      id: 'cb-smart',
      when: { mem: 'smart-wolf' },
      use: 'smart-wolf',
      open: '똑똑하다고 해 줬던 거요. 그날 계산이 진짜 틀렸어요. 세 번 다시 봤어요.',
      replies: [
        { say: '내 탓이네, 미안', tier: 'great', face: 'laugh', answer: '…네, {me} 님 탓이에요. 근데 기분 좋은 오답이었어요.' },
        { say: '그래도 맞췄잖아', tier: 'good', face: 'smile', answer: '맞췄어요. 수인 중에선 머리 좋은 편이니까요. 편이요.' },
        { say: '세 번이나?', tier: 'meh', face: 'sorry', answer: '…네 번이었어요. 거짓말했어요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me} 님 좋아하는 게 {taste} 맞죠. 장부 구석에 적어 뒀어요. 업무용 아니에요.',
      replies: [
        { say: '나모 장부에 내가 있네', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '…돈 말고 다른 걸로 적힌 건 {me} 님이 처음이에요.' },
        { say: '그걸 왜 적어?', tier: 'good', remember: 'taste-heard', face: 'think', answer: '언젠가 쓸 데가 있을 것 같아서요. 저축 같은 거예요.' },
        { say: '생선은 아니야', tier: 'meh', remember: 'taste-heard', face: 'sorry', answer: '…알아요. 그래도 고등어 칸은 비워 둘게요.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '같이 걸었던 날 기억해요? 제가 세 번 쉬자고 했죠. 사실 네 번이었어요.',
      replies: [
        { say: '난 천천히 걸어서 좋았어', tier: 'great', remember: 'outing-talk', face: 'shy', answer: '…그 말, 금고에 넣어 둘게요. 다음엔 다섯 번 쉬어도 돼요?' },
        { say: '다음엔 업어 줄게', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '…그건 소설에서나 나오는 장면이에요. 좀 기대할게요.' },
        { say: '네 번이었어?', tier: 'meh', remember: 'outing-talk', face: 'sorry', answer: '네. 한 번은 몰래 쉬었어요. 못 본 걸로 해요.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-heard' },
      open: '{me} 님 생일 곧이죠. 장부 달력에 표시해 뒀어요. 날짜 계산은 자신 있어요.',
      replies: [
        { say: '기억해 주는 거야?', tier: 'great', remember: 'bday-heard', face: 'shy', answer: '…네. 그날은 야근 안 할게요. 장부에도 그렇게 적었어요.' },
        { say: '선물은 고등어로 줘', tier: 'good', remember: 'bday-heard', face: 'laugh', answer: '그건 제가 받고 싶은 거예요. 다른 걸로 고민해 볼게요.' },
        { say: '굳이 안 챙겨도 돼', tier: 'meh', remember: 'bday-heard', face: 'think', answer: '챙길 거예요. 은행원은 기념일을 놓치지 않아요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '창구의 새 장부',
      hint: '한 번 이야기를 나누면 나모가 새 장부를 펼쳐요.',
      need: { days: 1 },
      scene: [
        '나모가 창구에서 고개를 든다. 안경은 머리 위에 걸려 있다.',
        '"어서 와요. 처음 오셨죠. 나모예요. 범마을 은행원이에요."',
        '그녀가 새 장부를 펼치고 도장을 찾는다. 도장은 손에 들려 있다.',
        '"…아, 여기 있었네요. 못 본 걸로 해요."',
        '"{me} 님. 이름 적었어요. 장부는 한 번에 맞추는 게 제 규칙이에요."',
      ],
      replies: [
        { say: '잘 부탁해, 나모', tier: 'great', face: 'smile', answer: '네, 잘 부탁해요. 귀가 쫑긋했어요. 반가워서요.' },
        { say: '도장, 손에 있어', tier: 'good', face: 'shy', answer: '…알아요. 방금 찾았어요. 그러니까 못 본 걸로요.' },
        { say: '은행은 처음이야', tier: 'meh', face: 'calm', answer: '괜찮아요. 설명은 자신 있어요. 조금 길 뿐이에요.' },
      ],
    },
    {
      title: '뒷산의 보름달',
      hint: '밤(게임 시각 밤 여덟 시부터 자정 전까지) 뒷산에 올라 보세요. 나모가 달을 보러 온대요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 20, to: 24 } },
      scene: [
        '뒷산 꼭대기. 나모가 바위에 앉아 숨을 고르고 있다.',
        '"헥, 헥… 아, {me} 님. 올라오는 데 세 번 쉬었어요."',
        '둥근 달이 떠오르자 나모의 귀가 곧게 선다. 꼬리가 천천히 흔들린다.',
        '그녀가 목을 들었다가, 입을 꾹 다문다.',
        '"…참았어요. 여기선 소리가 마을까지 내려가거든요."',
        '"그래도 이 달은 은행 창문으로 보는 거랑 달라요. 혼자보단 낫고요."',
      ],
      replies: [
        { say: '참지 마. 나만 들을게', tier: 'great', remember: 'moon-hill', face: 'shy', answer: ['…아주 작게요. 정말 작게요.', '…못 들은 걸로 해요. 아니, 들은 걸로 해 줘요.'] },
        { say: '달 진짜 밝다', tier: 'good', remember: 'moon-hill', face: 'smile', answer: '네. 결산 끝난 밤 같은 달이에요. 마음이 맞아떨어져요.' },
        { say: '내려갈 땐 업어 줄까?', tier: 'meh', remember: 'moon-hill', face: 'laugh', answer: '…내리막은 괜찮아요. 아마요. 손만 잡아 줘요.' },
      ],
    },
    {
      title: '고등어 한 마리',
      hint: '나모는 생선 중에서도 고등어를 제일 좋아해요. 고등어 한 마리를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'mackerel', take: true } },
      scene: [
        '문을 열자마자 나모의 코가 먼저 움직인다.',
        '"…고등어예요. 맞죠. 등 푸른 거, 기름 오른 거."',
        '고등어를 내밀자 꼬리가 의자 뒤에서 마구 흔들린다.',
        '"아, 이건… 바람이에요. 아니, 못 본 걸로 해요."',
        '"사실 연구실 시절엔 고등어 통조림으로 버텼어요. 마감 때마다요."',
        '"오늘은 통조림이 아니라 진짜예요. {me} 님이 가져온 진짜."',
      ],
      replies: [
        { say: '같이 구워 먹자', tier: 'great', remember: 'mackerel-gift', face: 'laugh', answer: '…네! 굽는 건 제가 할게요. 연기는 창문 열고요. 은행이니까요.' },
        { say: '통조림 시절 이야기 해 줘', tier: 'good', remember: 'mackerel-gift', face: 'think', answer: '밤새 논문 쓰고, 새벽에 통조림 따고… 지금이랑 별로 안 다르네요.' },
        { say: '그냥 생선이야', tier: 'meh', remember: 'mackerel-gift', face: 'calm', answer: '…그냥 생선이 제일 좋은 선물일 때도 있어요. 고마워요.' },
      ],
    },
    {
      title: '덮지 못한 소설',
      hint: '나모와 소설 이야기를 같이 해 보세요. 읽는 책을 물어보면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'novel-pal' },
      scene: [
        '퇴근한 은행. 나모가 장부 대신 두꺼운 공책을 펼치고 있다.',
        '"아, {me} 님. 이건… 업무용이 아니에요."',
        '"제가 쓰는 소설이에요. 마을 사람들로 지어낸 이야기요."',
        '"대부분 아무것도 아닌 이야기예요. 우산이랑, 빵 냄새랑, 금리 논쟁 같은."',
        '그녀가 마지막 장을 넘긴다. 주인공 칸 옆이 비어 있다.',
        '"…이 칸은 아직 못 채웠어요. 누굴 쓸지 알 것 같은데, 펜이 안 움직여요."',
      ],
      replies: [
        { say: '천천히 써도 돼. 기다릴게', tier: 'great', face: 'shy', answer: '…기다려 준대요. 그럼 이 소설은 끝까지 쓸 수 있을 것 같아요.' },
        { say: '내가 거기 들어가도 돼?', tier: 'good', face: 'wow', answer: '…그건 작가 마음이에요. 그리고 작가는 지금 귀가 뜨거워요.' },
        { say: '마을 사람들이 알면 어떡해', tier: 'meh', face: 'sorry', answer: '…그래서 금고에 넣어 둬요. 비밀번호는 아무도 몰라요.' },
      ],
    },
    {
      title: '금고의 빈 칸',
      hint: '나모와 아주 가까워지면 그녀가 금고 속 장부를 보여 줘요. 그 뒤엔 꽃다발도 반길지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '나모가 은행 금고 문을 연다. 철컥, 소리에 귀가 쫑긋한다.',
        '안쪽 선반에 얇은 장부 하나가 따로 놓여 있다.',
        '"{me} 님 이름 적힌 장부예요. 업무용이 아니라서 여기 뒀어요."',
        '"날마다 이자가 붙어요. 마음 쪽 이자요. 계산이 안 끝나요."',
        '"…요즘엔 꽃 냄새만 맡아도 꼬리가 먼저 반응할 것 같아요."',
        '"누가 꽃다발이라도 들고 오면, 꼬리를 숨길 자신이 없어요."',
      ],
      replies: [
        { say: '그 꼬리, 보고 싶은데', tier: 'great', face: 'shy', answer: '…그럼 숨기지 않을게요. 꽃 냄새가 나면 문 앞까지 마중 나갈게요.' },
        { say: '그 장부, 나도 보고 싶어', tier: 'good', face: 'wow', answer: '…아직은 결산 중이에요. 다 맞으면 제일 먼저 보여 드릴게요.' },
        { say: '꽃 알레르기 있어?', tier: 'meh', face: 'laugh', answer: '…없어요. 그런 얘기가 아니었어요. 못 들은 걸로 해요.' },
      ],
    },
    {
      title: '평생 예금',
      hint: '나모와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '저녁 은행. 나모가 금고 앞에서 서류 한 장을 내민다. 이번엔 거꾸로가 아니다.',
        '"예금 신청서예요. 만기 칸이 비어 있어요."',
        '"보통은 일 년, 삼 년, 그렇게 적어요. 근데 이건 못 정하겠어요."',
        '"금고 맨 안쪽 칸은 아직 비어 있어요. 작은 상자 하나 들어갈 크기예요."',
        '"…반지 같은 거요. 아, 아무것도 아니에요. 지어낸 거예요."',
        '꼬리가 그녀 등 뒤에서 조용히, 오래 흔들린다.',
      ],
      replies: [
        { say: '만기는 평생으로 하자', tier: 'great', face: 'shy', answer: ['…평생. 이자 계산이 끝나지 않는 상품이네요.', '좋아요. 도장 찍을게요. 이번엔 손에 있는 거 알아요.'] },
        { say: '그 칸, 내가 채울게', tier: 'good', face: 'wow', answer: '…기다릴게요. 금고 문은 {me} 님한테만 열려 있어요.' },
        { say: '서류가 바로 들려 있네', tier: 'meh', face: 'laugh', answer: '…세 번 확인했어요. 오늘만은 틀리고 싶지 않아서요.' },
      ],
    },
  ],
  after: [
    '오늘 이야기는 했어요. 장부 마저 맞출게요.',
    '또 왔네요. 귀가 먼저 알았어요. 내일 또 와요.',
    '창구는 닫았어요. 저는 아직 야근이에요. 조심히 가요.',
    '못 본 걸로 해요, 꼬리요. 그럼 내일 봐요.',
    '하암… 아, 죄송해요. 잘 가요, {me} 님.',
  ],
};
