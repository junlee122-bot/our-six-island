// 쓰레쉬 — 시장 거리 잡화점 주인(스물아홉). 상냥하게 웃는 해요체 장사꾼("후후",
// "어머"). 안개 짙은 그림자 군도 출신의 수집광: 등불·사슬·갈고리·초록 불빛·검은
// 안개, 열두 권째 수집 목록과 단골 명단. 손님이 판 물건은 절대 버리지 않는다("제
// 등불 안에 잘 모셔 두죠"). 섬뜩하게 들려도 흥정하고, 주점에서 수다 떨고, 밤
// 해변에서 물건 줍는 동네 사람. 밤과 흐린 날을 좋아하고 해바라기처럼 밝은 건
// 질색. 잔인한 말이나 진짜 위협은 쓰지 않는다. 원작 대사는 쓰지 않는다.
import type { NpcTalkBook } from './types.ts';

export const THRESH_TALK: NpcTalkBook = {
  npc: 'thresh',
  memories: {
    'night-owl': '밤이 좋다고 했어요',
    'day-person': '낮이 더 좋다고 했어요',
    'regular': '단골 명단에 이름을 올리기로 했어요',
    'keep-all': '물건을 버리지 못한다고 했어요',
    'lantern-peek': '등불 안이 궁금하다고 했어요',
    'mist-home': '그림자 군도의 안개 이야기를 들었어요',
    'haggle': '흥정은 웃으면서 하는 거라고 배웠어요',
    'beach-comb': '밤 해변에서 함께 줍기로 했어요',
    'chain-keys': '사슬이 사실 열쇠 꾸러미라고 들었어요',
    'no-sunflower': '해바라기 이야기를 듣고 웃었어요',
    'story-price': '물건값엔 사연이 붙는다고 들었어요',
    'tavern-gossip': '주점 수다 이야기를 들었어요',
    'firefly-woods': '숲에서 반딧불이 등불을 함께 봤어요',
    'shell-gift': '바닷조개를 건넸어요',
    'taste-heard': '내 취향을 수집 목록에 적어 뒀대요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'bday-heard': '생일 선물을 골라 두겠대요',
  },
  talks: [
    {
      id: 'night-or-day',
      open: '{me}, 하나 여쭤봐도 돼요? 밤이 좋아요, 낮이 좋아요?',
      replies: [
        { say: '밤이요. 조용해서 좋아요', tier: 'great', remember: 'night-owl', face: 'laugh', answer: ['어머, 같은 편이네요. 후후.', '밤엔 물건들도 사람도 솔직해져요. 수집 목록에 적어 둘게요.'] },
        { say: '저는 낮이 좋아요', tier: 'good', remember: 'day-person', face: 'smile', answer: '그럼 낮엔 당신이 가게를 밝혀 주세요. 전 그늘에 있을게요.' },
        { say: '잠잘 수 있으면 아무 때나', tier: 'meh', face: 'calm', answer: '후후, 정직하시네요. 잠도 수집할 수 있으면 좋을 텐데.' },
      ],
    },
    {
      id: 'regulars',
      open: ['수집 목록이 벌써 열두 권째예요.', '맨 뒤엔 단골 명단도 있어요. 이름 올려 드릴까요?'],
      replies: [
        { say: '올려 주세요. 자주 올게요', tier: 'great', remember: 'regular', face: 'laugh', answer: '좋아요. 펜으로 적었어요. 단골은 지워지지 않아요. 후후.' },
        { say: '명단에 오르면 뭐가 좋아요?', tier: 'good', face: 'think', answer: '덤이요. 사슬 고리 하나, 아니면 사연 하나. 고르세요.' },
        { say: '조금 무서운데요', tier: 'meh', face: 'sorry', answer: '어머, 그냥 명단이에요. 안 물어요. 대부분은.' },
      ],
    },
    {
      id: 'never-throw',
      open: '손님이 판 물건은 하나도 안 버려요. 당신은 물건 잘 버리세요?',
      replies: [
        { say: '저도 못 버려요', tier: 'great', remember: 'keep-all', face: 'wow', answer: ['어머, 동지시네요.', '버리지 못하는 사람은 기억을 아끼는 사람이에요. 좋아요.'] },
        { say: '팔 거면 여기 가져올게요', tier: 'good', face: 'smile', answer: '현명하시네요. 제 등불 안에 잘 모셔 두죠. 값은 흥정이고요.' },
        { say: '다 버려요. 깔끔하게', tier: 'meh', face: 'calm', answer: '…그 버린 것들, 다음엔 저한테 주세요. 아까워요.' },
      ],
    },
    {
      id: 'lantern',
      open: '이 등불이요? 안 팔아요. 안에 뭐가 있는지 궁금하세요?',
      replies: [
        { say: '궁금해요. 살짝만요', tier: 'great', remember: 'lantern-peek', face: 'laugh', answer: ['후후, 솔직한 분이네요.', '단추, 조개, 장화 끈, 손님들 사연. 다 반짝여요.'] },
        { say: '모르는 게 나을 것 같아요', tier: 'good', face: 'smile', answer: '현명해요. 모르는 게 값이 더 나가는 물건도 있거든요.' },
        { say: '등불 말고 물건 보러 왔어요', tier: 'meh', face: 'calm', answer: '그럼요. 진열장은 이쪽이에요. 셋째 칸만 빼고요.' },
      ],
    },
    {
      id: 'mist-home',
      open: '제 고향 섬은 낮에도 안개가 안 걷혔어요. 지도에도 잘 안 나와요.',
      replies: [
        { say: '그 섬 이야기 더 해 주세요', tier: 'great', remember: 'mist-home', face: 'smile', answer: ['그림자 군도요. 조용하고, 늘 초록빛이 어른거렸죠.', '…이런 얘긴 손님한테 잘 안 하는데. 후후.'] },
        { say: '안개 속에서 길은 어떻게 찾아요?', tier: 'good', face: 'think', answer: '등불이요. 그래서 이걸 안 놓고 다녀요. 습관이에요.' },
        { say: '음침한 곳 같아요', tier: 'meh', face: 'calm', answer: '어머, 칭찬으로 들을게요. 저한텐 아늑했거든요.' },
      ],
    },
    {
      id: 'haggle',
      open: '흥정 좋아하세요? 전 값 깎는 손님이 제일 좋아요. 재밌거든요.',
      replies: [
        { say: '웃으면서 깎아 볼게요', tier: 'great', remember: 'haggle', face: 'laugh', answer: '후후, 그게 정석이에요. 웃는 쪽이 늘 조금 더 얻어 가요.' },
        { say: '정가로 살게요', tier: 'good', face: 'wow', answer: '어머, 귀한 손님. 그럼 덤은 제가 알아서 얹어 드릴게요.' },
        { say: '흥정은 피곤해요', tier: 'meh', face: 'calm', answer: '그럼 값은 제가 정해요. 그것도 나름 재밌어요. 후후.' },
      ],
    },
    {
      id: 'beach',
      open: '밤바다 해변엔 별게 다 밀려와요. 갈고리로 건지러 같이 가실래요?',
      replies: [
        { say: '좋아요. 등불은 제가 들게요', tier: 'great', remember: 'beach-comb', face: 'laugh', answer: '어머, 등불을 맡기다니 처음이에요. 떨어뜨리지만 마세요.' },
        { say: '뭐가 밀려오는데요?', tier: 'good', face: 'think', answer: '병, 조개, 누가 잃어버린 장화. 다 사연이 있어요.' },
        { say: '밤바다는 추워요', tier: 'meh', face: 'calm', answer: '그렇죠. 외투 하나 싸게 드릴까요? 장사 얘기예요.' },
      ],
    },
    {
      id: 'chains',
      open: '제 사슬이 무섭다는 분들이 있어요. 사실 이거, 뭔지 아세요?',
      replies: [
        { say: '열쇠 꾸러미 같은데요', tier: 'great', remember: 'chain-keys', face: 'wow', answer: '어머, 맞혔어요. 열 곳이 많아서 길어졌을 뿐이에요. 후후.' },
        { say: '진열장 장식이요?', tier: 'good', face: 'smile', answer: '반은 맞아요. 반짝이면 손님들이 한 번 더 보거든요.' },
        { say: '그냥 무서워요', tier: 'meh', face: 'sorry', answer: '괜찮아요. 아무도 안 묶어요. 상자만 묶어요.' },
      ],
    },
    {
      id: 'sunflower',
      open: '나세라 씨가 해바라기 씨를 팔라고 하더라고요. 전 좀 곤란해요.',
      replies: [
        { say: '너무 밝아서 그렇죠?', tier: 'great', remember: 'no-sunflower', face: 'laugh', answer: '어머, 들켰네요. 그 꽃은 저를 너무 빤히 봐요. 후후.' },
        { say: '그래도 잘 팔리잖아요', tier: 'good', face: 'think', answer: '그렇죠. 장사는 장사니까 들이긴 할게요. 구석에.' },
        { say: '해바라기 예쁜데요', tier: 'meh', face: 'calm', answer: '예쁘죠. 멀리서 보면요. 아주 멀리서.' },
      ],
    },
    {
      id: 'story-price',
      open: '이 낡은 장화 한 짝, 얼마일 것 같아요? 힌트는, 사연이 있어요.',
      replies: [
        { say: '사연 들으면 값을 매길게요', tier: 'great', remember: 'story-price', face: 'laugh', answer: ['후후, 장사를 아시네요.', '물건값의 절반은 사연이에요. 나머지 반은 분위기고요.'] },
        { say: '공짜 아니에요?', tier: 'good', face: 'smile', answer: '어머, 과감하시네요. 공짜는 사연 없는 물건만이에요.' },
        { say: '장화는 안 사요', tier: 'meh', face: 'calm', answer: '그렇죠. 한 짝이니까요. 나머지 한 짝도 언젠가 올 거예요.' },
      ],
    },
    {
      id: 'tavern',
      open: '어젯밤 주점에서 마을 소식을 잔뜩 들었어요. 궁금하세요?',
      replies: [
        { say: '조금만 알려 주세요', tier: 'great', remember: 'tavern-gossip', face: 'laugh', answer: ['후후, 소문도 수집품이에요.', '누가 누구한테 꽃을 샀는지 정도만요. 이름은 비밀이고요.'] },
        { say: '주점에선 뭐 하세요?', tier: 'good', face: 'smile', answer: '수집품 자랑이요. 샹크스 선장님이 제일 잘 들어 줘요.' },
        { say: '남 얘긴 별로예요', tier: 'meh', face: 'calm', answer: '어머, 점잖으시네요. 그럼 제 얘기만 할게요.' },
      ],
    },
    {
      id: 'cloudy',
      open: '흐린 날이 제일 좋아요. 등불이 예쁘게 보이거든요. 당신은요?',
      replies: [
        { say: '흐린 날 등불, 보고 싶어요', tier: 'great', face: 'laugh', answer: '그럼 흐린 날 오세요. 제일 좋은 자리에 등불 걸어 둘게요.' },
        { say: '맑은 날이 좋아요', tier: 'good', face: 'smile', answer: '그럼 맑은 날은 당신이 즐기세요. 전 가게 안쪽에 있을게요.' },
        { say: '날씨는 신경 안 써요', tier: 'meh', face: 'calm', answer: '편하시겠네요. 전 햇볕만 보면 눈부터 찡그려져요.' },
      ],
    },
    {
      id: 'appraise',
      open: '{me}, 주머니에서 딸그락 소리가 나요. 감정해 드릴까요? 공짜로요.',
      replies: [
        { say: '공짜면 부탁드려요', tier: 'great', face: 'laugh', answer: '후후, 조약돌이네요. 흔한 돌은 별로지만, 당신 거니까 반짝여요.' },
        { say: '그냥 동전이에요', tier: 'good', face: 'smile', answer: '동전도 사연이 있어요. 언제 누구한테 받았는지요.' },
        { say: '안 팔 거예요', tier: 'meh', face: 'calm', answer: '어머, 아쉬워라. 마음 바뀌면 언제든 오세요.' },
      ],
    },
    {
      id: 'second-shelf',
      when: { ch: 3 },
      open: '진열장 셋째 칸, 비매품 칸이에요. 요즘 거기 자리를 하나 비웠어요.',
      replies: [
        { say: '누구 자리예요?', tier: 'great', face: 'shy', answer: '…후후, 그건 비밀이에요. 근데 당신이 판 조개가 옆에 있어요.' },
        { say: '새 보물이 들어와요?', tier: 'good', face: 'smile', answer: '들어오면 좋겠어요. 아직 값을 못 매기는 거라서요.' },
        { say: '청소한 거 아니에요?', tier: 'meh', face: 'laugh', answer: '어머, 그렇게 볼 수도 있죠. 반은 맞아요.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '{weather}. 좋은 날씨네요. 다들 창고 정리하고 버리는 날이에요.',
      replies: [
        { say: '그걸 쓰레쉬 씨가 받죠?', tier: 'great', face: 'laugh', answer: '후후, 아시네요. 비 그치면 해변도 한 바퀴 돌 거예요.' },
        { say: '우산 하나 주세요', tier: 'good', face: 'smile', answer: '손잡이가 갈고리 모양인 거요? 제일 잘 팔려요.' },
        { say: '비 싫어요', tier: 'meh', face: 'calm', answer: '어머, 그럼 가게 안에 있다 가세요. 여긴 늘 아늑해요.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이 오면 발자국이 남죠. 누가 어디 갔는지 다 보여요. 후후.',
      replies: [
        { say: '제 발자국도 보셨어요?', tier: 'great', face: 'laugh', answer: '그럼요. 가게 앞에서 두 번 서성이셨죠. 수집했어요.' },
        { say: '눈 오는 날은 조용하네요', tier: 'good', face: 'smile', answer: '그렇죠. 등불 안 속삭임까지 들려요. 농담이에요. 아마.' },
        { say: '추워요', tier: 'meh', face: 'calm', answer: '등불 가까이 오세요. 따뜻하진 않지만 분위기는 있어요.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤이군요. 제 시간이에요. 초록 불빛이 무서우세요?',
      replies: [
        { say: '예뻐요. 반딧불이 같아요', tier: 'great', face: 'shy', answer: '어머. 그런 말은 처음 들어요. 수집 목록 맨 앞에 적을게요.' },
        { say: '조금요. 그래도 왔어요', tier: 'good', face: 'smile', answer: '용기 있는 손님이네요. 안 물어요. 대부분은. 후후.' },
        { say: '그냥 지나가는 길이에요', tier: 'meh', face: 'calm', answer: '그럼 등불 잡고 가세요. 골목이 어두워요.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny', time: 'day' },
      open: '아, 햇볕. 오늘은 가게 안쪽에 있을게요. 너무 정직한 빛이에요.',
      replies: [
        { say: '그늘 쪽에서 얘기해요', tier: 'great', face: 'laugh', answer: '배려가 깊으시네요. 후후, 그늘은 제가 제일 잘 알아요.' },
        { say: '햇볕 좀 쬐세요', tier: 'good', face: 'sorry', answer: '…조금만요. 손등만. 그걸로 오늘 몫은 다 했어요.' },
        { say: '날씨 좋은데요', tier: 'meh', face: 'calm', answer: '좋죠. 장사엔 안 좋아요. 다들 밖에 나가거든요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제날엔 다들 지갑이 열려요. 경매도 열고요. 구경 오실래요?',
      replies: [
        { say: '첫 물건이 뭐예요?', tier: 'great', face: 'laugh', answer: '누가 버린 장화 한 짝이요. 사연이 있어요. 기대하세요.' },
        { say: '축제는 즐기셔야죠', tier: 'good', face: 'smile', answer: '즐기고 있어요. 저한텐 경매가 축제거든요. 후후.' },
        { say: '돈이 없어요', tier: 'meh', face: 'calm', answer: '구경은 공짜예요. 나가는 것도요. 농담이에요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true, time: ['evening', 'night'] },
      open: '{fish} 낚으셨죠? 밤에 잡은 물고기는 제가 비싸게 쳐 드려요.',
      replies: [
        { say: '비늘 하나 드릴게요', tier: 'great', face: 'laugh', answer: '어머, 진열장에 모셔 둘게요. 밤바다 사연이 묻었네요.' },
        { say: '얼마 쳐 주실 건데요?', tier: 'good', face: 'think', answer: '후후, 흥정 시작이네요. 웃으면서 해요, 우리.' },
        { say: '제가 먹을 거예요', tier: 'meh', face: 'calm', answer: '그럼 맛있게 드세요. 뼈는 버리지 마시고요.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '오늘 엄청난 걸 낚으셨다면서요. 소문이 가게까지 왔어요.',
      replies: [
        { say: '보여 드릴게요. 안 팔아요', tier: 'great', face: 'laugh', answer: '후후, 비매품이군요. 저도 그 마음 알아요. 축하해요.' },
        { say: '파시면 얼마 주실래요?', tier: 'good', face: 'wow', answer: '어머, 그건 감정이 안 돼요. 너무 귀해서요. 처음이에요.' },
        { say: '운이 좋았어요', tier: 'meh', face: 'smile', answer: '운도 사연이에요. 오늘 날짜를 꼭 기억해 두세요.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물을 거두셨다고요? 진열장 제일 가운데 자리감이에요.',
      replies: [
        { say: '구경만 시켜 드릴게요', tier: 'great', face: 'laugh', answer: '후후, 그게 제일 감질나요. 흥정은 다음에 해요.' },
        { say: '파는 건 고민해 볼게요', tier: 'good', face: 'smile', answer: '천천히요. 반짝이는 건 오래 고민할수록 값이 올라요.' },
        { say: '그냥 먹을 거예요', tier: 'meh', face: 'sorry', answer: '…어머. 맛있겠네요. 조금 아깝지만요.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일 하셨죠? 손에 흙이 묻었어요. 수확한 거 중에 팔 거 있어요?',
      replies: [
        { say: '제일 못생긴 거 드릴게요', tier: 'great', face: 'laugh', answer: '어머, 그게 제일 좋아요. 못생긴 건 사연이 많거든요.' },
        { say: '씨앗 좀 싸게 주세요', tier: 'good', face: 'smile', answer: '제 씨앗이 농협보다 싸요. 비밀로요. 후후.' },
        { say: '해바라기 심었어요', tier: 'meh', face: 'sorry', answer: '…아. 그 밭은 멀리서 응원할게요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 오늘 표정이 무겁네요. 무거운 게 있으면 저한테 파세요.',
      replies: [
        { say: '그냥 좀 지쳤어요', tier: 'great', face: 'smile', answer: ['그럼 등불 옆 의자에 앉아요. 단골 자리예요.', '오늘 무게는 제가 대신 모셔 둘게요. 공짜로.'] },
        { say: '팔면 얼마 쳐 주세요?', tier: 'good', face: 'laugh', answer: '후후, 그 농담이 나오면 반은 괜찮은 거예요. 후하게 쳐 드릴게요.' },
        { say: '말하기 싫어요', tier: 'meh', face: 'calm', answer: '그럼 말 안 해도 돼요. 가게 안은 조용하니까 있다 가세요.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '생일 축하해요, {me}. 오늘만은 비매품 하나를 공짜로 드릴게요.',
      replies: [
        { say: '쓰레쉬 씨가 고른 걸로요', tier: 'great', face: 'shy', answer: '…어머. 고르라니요. 그럼 제일 반짝이는 걸로 드릴게요.' },
        { say: '등불 안의 것도요?', tier: 'good', face: 'laugh', answer: '후후, 그건 안 돼요. 생일이어도요. 대신 리본 달아 드릴게요.' },
        { say: '선물은 괜찮아요', tier: 'meh', face: 'smile', answer: '그럼 축하만 드릴게요. 날짜는 단골 명단에 적어 둘게요.' },
      ],
    },
    {
      id: 'op-news-wedding',
      when: { news: 'wedding' },
      open: '마을에 결혼 소식이 있네요. 꽃다발이 잘 팔리겠어요. 후후.',
      replies: [
        { say: '사슬 없는 꽃다발로요', tier: 'great', face: 'laugh', answer: '어머, 제 말버릇을 아시네요. 리본으로 묶어 드려요.' },
        { say: '축하할 일이네요', tier: 'good', face: 'smile', answer: '그렇죠. 결혼식 날 떨어지는 단추도 기념품이 돼요.' },
        { say: '꽃은 금방 시들어요', tier: 'meh', face: 'calm', answer: '그래서 말려 둬요. 시든 꽃도 버리진 않아요.' },
      ],
    },
    {
      id: 'op-news-museum',
      when: { news: 'museum' },
      open: '오늘 마을 소식 보셨어요? 박물관이 또 귀한 걸 가져갔대요. 아쉬워라.',
      replies: [
        { say: '쓰레쉬 씨 가게가 더 낫죠', tier: 'great', face: 'laugh', answer: '후후, 그렇죠. 박물관은 사연을 안 들어 줘요. 전 들어 줘요.' },
        { say: '박물관도 좋던데요', tier: 'good', face: 'smile', answer: '좋죠. 언젠가 제 가게 물건도 거기 갈지 몰라요. 안 팔겠지만.' },
        { say: '관심 없어요', tier: 'meh', face: 'calm', answer: '그럼 진열장 구경이나 하세요. 그게 더 재밌어요.' },
      ],
    },
    {
      id: 'op-frieren',
      when: { bond: 'frieren' },
      open: '{other} 씨 만나셨죠? 그분도 옛 물건을 모아요. 우리 맞수예요.',
      replies: [
        { say: '누가 더 많이 모았어요?', tier: 'great', face: 'laugh', answer: '양은 그분이요. 천 년 모았으니까. 사연은 제가 더 많아요.' },
        { say: '같이 모으면 되잖아요', tier: 'good', face: 'think', answer: '어머, 그건 생각 못 했네요. 근데 고르는 눈이 달라서요.' },
        { say: '빵 얘기만 하던데요', tier: 'meh', face: 'smile', answer: '후후, 그분 수집은 이상한 레시피예요. 저도 하나 샀어요.' },
      ],
    },
    {
      id: 'op-volibas',
      when: { bond: 'volibas' },
      open: '{other} 순경님이 오늘도 제 등불을 수상하게 보셨죠?',
      replies: [
        { say: '반은 맞는 추리 같던데요', tier: 'great', face: 'laugh', answer: '후후, 정확해요. 나머지 반은 그냥 등불이에요.' },
        { say: '걱정하시는 거예요', tier: 'good', face: 'smile', answer: '알아요. 그래서 밤마다 가게 앞은 늘 안전해요. 덕분이죠.' },
        { say: '저도 좀 수상해요', tier: 'meh', face: 'sorry', answer: '어머, 당신까지. 그럼 등불 구경 공짜로 시켜 드릴게요.' },
      ],
    },
    {
      id: 'op-captain',
      when: { bond: 'captain' },
      open: '{other} 선장님 만나셨어요? 어젯밤 주점에서 제 수집품 자랑을 들어 줬어요.',
      replies: [
        { say: '선장님은 다 재밌어하죠', tier: 'great', face: 'laugh', answer: '그렇죠. 장화 한 짝 얘기에도 웃어 줘요. 귀한 청중이에요.' },
        { say: '무슨 자랑을 했어요?', tier: 'good', face: 'smile', answer: '병뚜껑 마흔 개요. 사연까지 하면 밤을 새요. 후후.' },
        { say: '술 얘기만 하던데요', tier: 'meh', face: 'calm', answer: '어머, 그분다워요. 외상 장부도 제가 수집하고 싶네요.' },
      ],
    },
    {
      id: 'op-rose',
      when: { bond: 'rose' },
      open: '{other} 씨 만나셨죠? 어제 보석 흥정을 밤새 했어요. 둘 다 웃으면서요.',
      replies: [
        { say: '누가 이겼어요?', tier: 'great', face: 'laugh', answer: '비겼어요. 늘 그래요. 그래서 재밌어요. 후후.' },
        { say: '무섭게 웃으셨겠네요', tier: 'good', face: 'smile', answer: '어머, 들켰네요. 서로 웃는 얼굴이 제일 무서운 사이예요.' },
        { say: '돈 얘긴 피곤해요', tier: 'meh', face: 'calm', answer: '그분이랑 저한텐 그게 수다예요. 이상하죠.' },
      ],
    },
    {
      id: 'op-makima',
      when: { bond: 'makima' },
      open: '{other} 씨 만나셨어요? 다음 경매에서 같은 걸 노리고 있어요.',
      replies: [
        { say: '쓰레쉬 씨가 이기세요', tier: 'great', face: 'laugh', answer: '후후, 응원이 생기니 값을 한 번 더 부를 용기가 나네요.' },
        { say: '뭘 노리는데요?', tier: 'good', face: 'think', answer: '오래된 회중시계요. 바늘이 거꾸로 돈대요. 탐나죠.' },
        { say: '양보하시면 어때요?', tier: 'meh', face: 'calm', answer: '어머, 수집가한테 양보는 어려운 단어예요. 노력은 할게요.' },
      ],
    },
    {
      id: 'op-shinichi',
      when: { bond: 'shinichi' },
      open: '{other} 탐정님이 또 제 장부를 들여다보고 갔어요. 수상한 건 없는데.',
      replies: [
        { say: '정말 없어요?', tier: 'great', face: 'laugh', answer: '후후, 없어요. 사연이 많을 뿐이에요. 탐정님도 결국 웃었어요.' },
        { say: '장부 정리 잘하시잖아요', tier: 'good', face: 'smile', answer: '그렇죠. 열두 권째예요. 탐정님은 세 권째에서 지쳤어요.' },
        { say: '숨기는 게 있죠?', tier: 'meh', face: 'think', answer: '어머, 다들 저를 그렇게 봐요. 셋째 칸 말고는 없어요.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-regular',
      when: { mem: 'regular' },
      use: 'regular',
      open: '단골 명단에 당신 이름, 요즘 줄이 제일 길어요. 사연 칸이요.',
      replies: [
        { say: '사연이 그렇게 많아요?', tier: 'great', face: 'laugh', answer: '그럼요. 오늘 온 것도 한 줄이에요. 후후, 지금 적어요.' },
        { say: '뭐라고 적었어요?', tier: 'good', face: 'shy', answer: '…비밀이에요. 웃는 얼굴이 좋다는 정도만요.' },
      ],
    },
    {
      id: 'cb-keep-all',
      when: { mem: 'keep-all' },
      use: 'keep-all',
      open: '물건 못 버린다고 하셨죠? 집 정리할 때 부르세요. 버리지 말고 저한테요.',
      replies: [
        { say: '같이 정리해 주세요', tier: 'great', face: 'laugh', answer: '어머, 기꺼이요. 하나도 안 버리는 정리법을 알려 드릴게요.' },
        { say: '다 팔라는 거죠?', tier: 'good', face: 'smile', answer: '후후, 반은요. 나머지 반은 당신이 간직해요.' },
      ],
    },
    {
      id: 'cb-lantern',
      when: { mem: 'lantern-peek' },
      use: 'lantern-peek',
      open: '등불 안이 궁금하다고 하셨죠. 오늘은 기분이 좋아서 살짝 보여 드릴게요.',
      replies: [
        { say: '와, 단추가 반짝여요', tier: 'great', face: 'shy', answer: ['어머, 그거 처음 파신 단추예요.', '…버릴 리가요. 제일 앞자리예요.'] },
        { say: '생각보다 평범하네요', tier: 'good', face: 'laugh', answer: '후후, 그렇죠. 무서운 건 다 소문이에요.' },
      ],
    },
    {
      id: 'cb-beach',
      when: { mem: 'beach-comb' },
      use: 'beach-comb',
      open: '밤 해변 같이 가자고 하셨죠. 어젯밤 혼자 돌다가 당신 몫도 주웠어요.',
      replies: [
        { say: '제 몫이 뭔데요?', tier: 'great', face: 'smile', answer: '파란 유리 조각이요. 등불에 비추면 바다색이 나요. 드릴게요.' },
        { say: '다음엔 꼭 같이 가요', tier: 'good', face: 'laugh', answer: '약속이에요. 갈고리 하나 더 챙겨 둘게요.' },
      ],
    },
    {
      id: 'cb-mist',
      when: { mem: 'mist-home' },
      use: 'mist-home',
      open: '그림자 군도 얘기, 기억하세요? 어젯밤 안개가 꼭 고향 같았어요.',
      replies: [
        { say: '그리웠어요?', tier: 'great', face: 'think', answer: '…조금요. 근데 이젠 이 마을 안개가 더 좋아요. 이유는 알죠?' },
        { say: '등불 들고 산책했어요?', tier: 'good', face: 'smile', answer: '그럼요. 안개 낀 밤 산책이 제 낙이에요. 후후.' },
      ],
    },
    {
      id: 'cb-haggle',
      when: { mem: 'haggle' },
      use: 'haggle',
      open: '웃으면서 깎겠다고 하셨죠. 오늘 연습해 볼래요? 이 유리병으로.',
      replies: [
        { say: '반값이면 살게요. 후후', tier: 'great', face: 'laugh', answer: '어머, 제 웃음까지 따라 하다니. 졌어요. 반값이에요.' },
        { say: '조금만 깎아 주세요', tier: 'good', face: 'smile', answer: '조금만이라니 착하시네요. 덤으로 코르크 마개 드릴게요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라면서요. 수집 목록에 적어 뒀어요. 따로요.',
      replies: [
        { say: '따로 적는 칸이 있어요?', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '…생겼어요. 요즘. 당신 칸이요. 후후.' },
        { say: '들어오면 연락 주세요', tier: 'good', remember: 'taste-heard', face: 'laugh', answer: '그럼요. 단골 우선이에요. 값은 흥정이고요.' },
        { say: '그걸 왜 적어요?', tier: 'meh', remember: 'taste-heard', face: 'calm', answer: '수집가는 다 적어요. 버릇이에요.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '같이 걸었던 날 기억나요? 당신 발자국, 모아 두고 싶었어요.',
      replies: [
        { say: '또 같이 걸어요', tier: 'great', remember: 'outing-talk', face: 'shy', answer: '…어머. 그럼 이번엔 밤에요. 등불은 제가 들게요.' },
        { say: '발자국은 못 모아요', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '알아요. 그래서 기억에 모셔 뒀어요. 후후.' },
        { say: '그날 좀 피곤했어요', tier: 'meh', remember: 'outing-talk', face: 'sorry', answer: '어머, 다음엔 천천히 걸을게요. 그늘로만요.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-heard' },
      open: '{me}, 곧 생일이죠? 단골 명단에 적혀 있어요. 선물은 비매품으로요.',
      replies: [
        { say: '쓰레쉬 씨가 고른 거면 좋아요', tier: 'great', remember: 'bday-heard', face: 'shy', answer: '…그럼 오래 고를게요. 진열장 전부 다시 볼 거예요.' },
        { say: '사슬은 빼 주세요', tier: 'good', remember: 'bday-heard', face: 'laugh', answer: '후후, 알았어요. 리본으로 묶어 드릴게요.' },
        { say: '안 챙겨도 돼요', tier: 'meh', remember: 'bday-heard', face: 'calm', answer: '이미 적어 버렸어요. 수집가는 못 지워요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '열두 권째 수집 목록',
      hint: '한 번 이야기를 나누면 쓰레쉬가 수집 목록을 펼쳐요.',
      need: { days: 1 },
      scene: [
        '쓰레쉬가 등불 옆에서 두꺼운 공책을 펼친다. 표지에 열둘이라 적혀 있다.',
        '"어서 오세요. 처음 뵙는 손님은 여기 적어 두는 게 버릇이에요."',
        '"이름, 오신 시간, 그리고 웃는 얼굴. 물건처럼요. 후후."',
        '"아, 겁먹지 마세요. 그냥 목록이에요. 안 물어요. 대부분은."',
      ],
      replies: [
        { say: '예쁘게 적어 주세요', tier: 'great', face: 'laugh', answer: '어머, 그런 주문은 처음이에요. 제일 고운 글씨로 쓸게요.' },
        { say: '뭘 그렇게 적어요?', tier: 'good', face: 'smile', answer: '사연이요. 사람도 물건도 사연이 값이거든요.' },
        { say: '대부분은이라뇨…', tier: 'meh', face: 'calm', answer: '후후, 농담이에요. 이 가게에선 등불만 무는 척해요.' },
      ],
    },
    {
      title: '반딧불이 등불',
      hint: '밤 아홉 시부터 새벽 두 시 사이에 숲에 가 보세요. 쓰레쉬가 등불을 들고 있대요.',
      need: { days: 3, points: 20, visit: { area: 'woods', from: 21, to: 2 } },
      scene: [
        '깊은 밤의 숲. 나무 사이로 초록 불빛 하나가 흔들린다.',
        '"어머, 정말 오셨네요. 이 시간 숲은 제 단골 자리예요."',
        '쓰레쉬가 등불을 낮추자 주위로 반딧불이가 하나둘 모여든다.',
        '"제 등불이랑 색이 비슷해서 친구인 줄 아나 봐요. 후후."',
        '"잡진 않아요. 보는 게 수집이에요. 이건 병에 못 담거든요."',
      ],
      replies: [
        { say: '저도 이 밤을 모셔 둘게요', tier: 'great', remember: 'firefly-woods', face: 'shy', answer: '…어머. 제 말버릇을 그렇게 쓰다니. 반칙이에요. 좋네요.' },
        { say: '숲이 생각보다 따뜻해요', tier: 'good', remember: 'firefly-woods', face: 'smile', answer: '그렇죠. 밤은 무섭지 않아요. 조용할 뿐이에요.' },
        { say: '모기가 많아요', tier: 'meh', remember: 'firefly-woods', face: 'laugh', answer: '후후, 그건 수집 안 해요. 다음엔 쑥 향 챙겨 드릴게요.' },
      ],
    },
    {
      title: '파도가 놓고 간 것',
      hint: '쓰레쉬가 밤 해변 이야기를 했어요. 바닷조개 하나를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'shell', take: true } },
      scene: [
        '바닷조개를 내밀자 쓰레쉬가 손님 대하는 웃음을 잠깐 잊는다.',
        '"…파신다고요? 아니면, 주시는 거예요?"',
        '그가 조개를 등불에 비춘다. 안쪽이 초록빛으로 일렁인다.',
        '"고향 섬 바닷가엔 조개가 없었어요. 안개만 밀려왔죠."',
        '"이건 장부에 매입이라고 안 적을게요. 선물 칸은 처음 만들어요."',
      ],
      replies: [
        { say: '선물이에요. 값은 없어요', tier: 'great', remember: 'shell-gift', face: 'shy', answer: '…값이 없는 물건은 처음이에요. 등불 제일 앞자리에 모셔요.' },
        { say: '흥정은 다음에 해요', tier: 'good', remember: 'shell-gift', face: 'laugh', answer: '후후, 좋아요. 그때 웃으면서 해요. 오늘은 그냥 받을게요.' },
        { say: '해변에 많던데요', tier: 'meh', remember: 'shell-gift', face: 'calm', answer: '많아도 당신이 주운 건 이거 하나예요. 그게 다르죠.' },
      ],
    },
    {
      title: '밤의 단골',
      hint: '쓰레쉬가 밤이 좋은지 낮이 좋은지 물어볼 때, 밤이 좋다고 답해 보세요.',
      need: { days: 9, points: 60, mem: 'night-owl' },
      scene: [
        '문 닫을 시간. 쓰레쉬가 가게 불을 끄고 등불 하나만 남긴다.',
        '"밤이 좋다고 하셨죠. 그래서 문 닫은 뒤에 불렀어요."',
        '"이 시간엔 장사용 웃음을 안 지어도 돼요. 편하네요."',
        '그가 사슬 꾸러미를 풀어 탁자에 내려놓는다. 열쇠 소리가 난다.',
        '"뒷방 열쇠예요. 아는 사람은 저 말고 당신이 처음이에요."',
      ],
      replies: [
        { say: '밤마다 놀러 와도 돼요?', tier: 'great', face: 'laugh', answer: '어머, 물어볼 필요도 없어요. 등불은 늘 켜 둘게요.' },
        { say: '뒷방엔 뭐가 있어요?', tier: 'good', face: 'think', answer: '버리지 못한 것들이요. 언젠가 하나씩 보여 드릴게요.' },
        { say: '졸려요', tier: 'meh', face: 'smile', answer: '후후, 밤의 단골도 잠은 자야죠. 다음엔 낮잠 자고 와요.' },
      ],
    },
    {
      title: '사슬 없는 꽃다발',
      hint: '쓰레쉬와 아주 가까워지면 그가 웃는 얼굴 뒤를 보여 줘요. 꽃다발 이야기도요.',
      need: { days: 13, points: 96 },
      scene: [
        '쓰레쉬가 늘 짓던 웃음을 지으려다, 그만둔다.',
        '"…이상해요. 당신 앞에선 장사용 얼굴이 안 돼요."',
        '"전 갖고 싶은 건 다 등불 안에 모셔 뒀어요. 그게 제 방식이었죠."',
        '"근데 당신은 가두고 싶지가 않아요. 옆에 있었으면 해요."',
        '그가 진열장의 꽃다발 하나를 본다. 사슬 없이 리본만 묶인 것.',
        '"그런 꽃다발을 누가 주면… 등불에 안 넣을 첫 번째가 될 거예요."',
      ],
      replies: [
        { say: '그 첫 번째, 제가 할게요', tier: 'great', face: 'shy', answer: '…어머. 후후, 아니, 웃음이 안 나와요. 기다릴게요.' },
        { say: '지금 그 얼굴이 좋아요', tier: 'good', face: 'shy', answer: '…곤란하네요. 이 얼굴은 비매품이에요. 당신만 봐요.' },
        { say: '꽃은 시들잖아요', tier: 'meh', face: 'calm', answer: '그렇죠. 그래도 그 꽃이면 시든 것까지 아낄 거예요.' },
      ],
    },
    {
      title: '팔 수 없는 것',
      hint: '쓰레쉬와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '쓰레쉬가 열두 권째 수집 목록을 덮고, 새 공책을 꺼낸다.',
        '"평생 모으기만 했어요. 사고, 팔고, 모셔 두고."',
        '"근데 당신은 값을 매길 수가 없어요. 팔 수도, 모을 수도 없어요."',
        '"그래서 목록 대신 이 공책에 적으려고요. 우리 둘 이야기."',
        '그가 등불을 끄고, 빈손을 내민다. 사슬도 갈고리도 없다.',
        '"언젠가 반지 하나만은… 수집이 아니라 약속으로 받고 싶어요."',
      ],
      replies: [
        { say: '그 약속, 꼭 할게요', tier: 'great', face: 'shy', answer: '…후후. 처음으로 흥정 없이 받아요. 평생 안 버릴게요.' },
        { say: '등불은 왜 껐어요?', tier: 'good', face: 'smile', answer: '오늘은 당신이 더 밝아서요. 큰일이죠. 저 밝은 거 싫어하는데.' },
        { say: '천천히 써요, 우리', tier: 'meh', face: 'smile', answer: '좋아요. 밤은 기니까요. 천천히, 한 장씩.' },
      ],
    },
  ],
  after: [
    '오늘 사연은 잘 받았어요. 등불 안에 모셔 둘게요.',
    '또 오셨네요. 구경은 공짜예요. 나가는 것도요. 후후.',
    '할 얘긴 다 했잖아요. 진열장이나 보고 가세요.',
    '밤에 다시 오세요. 그땐 등불이 더 예뻐요.',
    '단골 명단에 오늘 방문 한 줄 더 적었어요. 후후.',
  ],
};
