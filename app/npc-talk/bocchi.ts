// 봇치 — 떠돌이 악사. 극도로 낯을 가려 "아, 저, 저…" 더듬는 존댓말, 말끝은 늘
// 흐려진다. 구석·박스 안이 제일 편하고, 기타를 잡고 무대에 서면 사람이 바뀐다.
// 칭찬받으면 녹아내린다. 분홍 운동복, 화·금 저녁 허풍 주점 무대, 비밀 영상 계정,
// 옛 밴드 친구들의 편지. 힘멜의 연애 상담역인데 본인이 더 떨고, 프리렌은 공연
// 때마다 존다. 원작 대사는 쓰지 않는다.
import type { NpcTalkBook } from './types.ts';

export const BOCCHI_TALK: NpcTalkBook = {
  npc: 'bocchi',
  memories: {
    'box-ok': '박스 안도 좋은 자리라고 해 줬어요',
    'corner-share': '구석 자리를 함께 나눠 앉았어요',
    'show-promise': '공연을 꼭 보러 가겠다고 약속했어요',
    'praise-melt': '칭찬했더니 녹아내렸어요',
    'lyrics': '가사 쓰는 걸 응원했어요',
    'phone-script': '전화 대본 연습을 도와줬어요',
    'secret-channel': '비밀 영상 계정 이야기를 들었어요',
    'band-letters': '옛 밴드 친구들 이야기를 들었어요',
    'himmel-advice': '힘멜의 연애 상담을 같이 들어 주기로 했어요',
    'tracksuit': '분홍 운동복이 잘 어울린다고 했어요',
    'dream-tour': '순회공연 꿈 이야기를 들었어요',
    'wall-practice': '벽 보고 연습하는 걸 지켜봤어요',
    'empty-stage': '빈 무대에서 첫 곡을 들었어요',
    'chestnut-gift': '군밤을 선물했어요',
    'stage-eyes': '무대에서 나만 보고 쳤대요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'bday-plan': '생일 축하곡을 만들어 준대요',
    'date-talk': '내 방에서 보낸 시간을 이야기했어요',
  },
  talks: [
    {
      id: 'box',
      open: ['아, 저, 저… 놀라지 마세요… 이 박스 안에 있는 거 저예요…', '여기가 제일 편해서요… 소리도 잘 울리고…'],
      replies: [
        { say: '좋은 자리네요', tier: 'great', remember: 'box-ok', face: 'wow', answer: '이, 이해해 주시는 분이 있다니… 오늘 운을 다 썼어요…' },
        { say: '나와서 얘기해요', tier: 'good', face: 'shy', answer: '그, 그럼 반만요… 머리만 나갈게요… 이게 한계예요…' },
        { say: '답답하지 않아요?', tier: 'meh', face: 'sorry', answer: '바깥 세상이 더 답답해요… 아, 죄송해요… 실언이에요…' },
      ],
    },
    {
      id: 'corner',
      open: '{me} 씨… 공원 벤치 끝자리 아세요…? 저, 저는 거기만 앉아요… 가운데는 무리예요…',
      replies: [
        { say: '반대쪽 끝에 앉을게요', tier: 'great', remember: 'corner-share', face: 'shy', answer: '그, 그럼 가운데가 비니까… 안전해요… 헤헤… 같이 앉아요…' },
        { say: '가운데도 괜찮아요', tier: 'good', face: 'think', answer: '가, 가운데는… 모두가 보는 자리라서요… 언젠가 도전할게요…' },
        { say: '그냥 아무 데나 앉아요', tier: 'meh', face: 'sorry', answer: '아무 데나가 제일 어려워요… 죄, 죄송해요…' },
      ],
    },
    {
      id: 'show-invite',
      open: ['저, 저기… 이번 화요일 저녁에… 주점 무대에 서요…', '오, 오시라는 건 아니고… 아니, 오시면… 좋겠다는…'],
      replies: [
        { say: '꼭 갈게요. 약속해요', tier: 'great', remember: 'show-promise', face: 'shy', answer: '야, 약속…! 그럼 도망 못 가요… 아, 기쁜 의미로요…' },
        { say: '맨 앞자리 맡아 둘게요', tier: 'good', remember: 'show-promise', face: 'wow', answer: '매, 맨 앞…? 눈이 마주치면 굳을지도… 그래도 와 주세요…' },
        { say: '시간 되면요', tier: 'meh', face: 'calm', answer: '네, 네… 괜찮아요… 원래 손님 셋이면 많은 거예요…' },
      ],
    },
    {
      id: 'praise',
      open: '아, 아까 연습하는 거… 들으셨어요…? 어, 어땠어요… 아, 아니 대답 안 하셔도…',
      replies: [
        { say: '진짜 멋있었어요', tier: 'great', remember: 'praise-melt', face: 'shy', answer: ['헤, 헤헤… 멋, 멋있…', '…아, 지금 몸이 녹고 있어요… 흐물흐물…'] },
        { say: '마지막 부분 좋던데요', tier: 'good', face: 'wow', answer: '거기 백 번 연습한 데예요…! 알아봐 주시다니…' },
        { say: '잘 못 들었어요', tier: 'meh', face: 'sorry', answer: '다, 다행이에요… 틀린 데가 세 군데 있었거든요…' },
      ],
    },
    {
      id: 'lyrics',
      open: '가사 쓰는 중이었어요… 보, 보면 안 돼요…! 너무 어두워서… 다들 걱정해요…',
      replies: [
        { say: '어두운 가사도 좋아요', tier: 'great', remember: 'lyrics', face: 'wow', answer: '저, 정말요…? 그럼 이 줄은 안 지울게요… 구석의 노래예요…' },
        { say: '밝은 것도 써 봐요', tier: 'good', remember: 'lyrics', face: 'think', answer: '바, 밝은 거… 해 보면 이상하게 박스가 나와요… 노력할게요…' },
        { say: '몰래 볼게요', tier: 'meh', face: 'sorry', answer: '아, 안 돼요…! 공책을 품에 꼭 안을게요…' },
      ],
    },
    {
      id: 'phone',
      open: '주점 사장님한테 전화해야 하는데… 대, 대본을 세 번 썼어요… 들어 봐 주실래요…?',
      replies: [
        { say: '내가 사장님 역 할게요', tier: 'great', remember: 'phone-script', face: 'laugh', answer: '여, 연습 상대…! 그럼 시작할게요… 여, 여보세… 아, 다시요…' },
        { say: '대본 없이도 돼요', tier: 'good', face: 'think', answer: '대본 없이요…? 그건 맨손으로 바다 건너는 거예요…' },
        { say: '그냥 직접 가요', tier: 'meh', face: 'sorry', answer: '지, 직접…? 얼굴을 보면서요…? 더 무서워요…' },
      ],
    },
    {
      id: 'channel',
      open: '사, 사실 기타 영상 올리는 계정이 있어요… 이름은… 절대 말 못 해요…',
      replies: [
        { say: '비밀 지켜 줄게요', tier: 'great', remember: 'secret-channel', face: 'shy', answer: '고, 고마워요… {me} 씨한테만 말한 거예요… 처음이에요…' },
        { say: '구독자 많아요?', tier: 'good', remember: 'secret-channel', face: 'wow', answer: '조, 조금요… 근데 화면 너머는 괜찮은데 실제 사람은 무리예요…' },
        { say: '찾아볼래요', tier: 'meh', face: 'sorry', answer: '아, 안 돼요…! 찾으시면 저 박스째 이사 가요…' },
      ],
    },
    {
      id: 'band',
      open: '옛 밴드 친구들한테 편지가 왔어요… 하나는 안부, 하나는 돈 빌려 달래요…',
      replies: [
        { say: '좋은 친구들이네요', tier: 'great', remember: 'band-letters', face: 'smile', answer: ['네… 저 같은 사람이랑 같이 쳐 줬어요…', '답장 오면 사흘은 행복해요… 헤헤…'] },
        { say: '돈은 빌려줄 거예요?', tier: 'good', remember: 'band-letters', face: 'think', answer: '버, 벌써 빌려줬어요… 늘 그래요… 근데 미워할 수가 없어요…' },
        { say: '다시 밴드 해요', tier: 'meh', face: 'sorry', answer: '다, 다들 멀리 있어서… 지금은 혼자 치는 게 맞아요…' },
      ],
    },
    {
      id: 'himmel-love',
      open: '힘멜 씨가 또 연애 상담을… 고백 연습을 저한테 했어요… 제가 먼저 쓰러졌어요…',
      replies: [
        { say: '다음엔 같이 들어요', tier: 'great', remember: 'himmel-advice', face: 'wow', answer: '두, 둘이면 덜 쓰러질지도… 좋아요… 상담단 결성이에요…' },
        { say: '뭐라고 조언했어요?', tier: 'good', face: 'think', answer: '"노래로 하세요"요… 힘멜 씨는 노래를 못 해요… 큰일이에요…' },
        { say: '왜 봇치 씨가 떨어요', tier: 'meh', face: 'sorry', answer: '모, 모르겠어요… 고백이라는 단어만 들어도 손이…' },
      ],
    },
    {
      id: 'tracksuit',
      open: '이 분홍 운동복… 너무 눈에 띄죠… 근데 이거 아니면 불안해서요…',
      replies: [
        { say: '봇치 씨답고 좋아요', tier: 'great', remember: 'tracksuit', face: 'shy', answer: '제, 제답다…? 그런 말 처음 들어요… 평생 입을게요…' },
        { say: '다른 색도 어울릴 거예요', tier: 'good', face: 'think', answer: '다른 색… 회색이면 벽이랑 섞일 수 있겠네요… 좋은 생각이에요…' },
        { say: '좀 튀긴 해요', tier: 'meh', face: 'sorry', answer: '역, 역시… 오늘은 그늘로만 다닐게요…' },
      ],
    },
    {
      id: 'dream',
      open: '머릿속에선… 벌써 대륙 순회공연 중이에요… 넘어지는 데까지 상상하고 끝나지만요…',
      replies: [
        { say: '안 넘어지는 데까지 상상해요', tier: 'great', remember: 'dream-tour', face: 'wow', answer: '아, 안 넘어지는…? 그, 그럼 앙코르까지 갈 수 있어요…!' },
        { say: '첫 공연은 이 마을에서', tier: 'good', remember: 'dream-tour', face: 'smile', answer: '여기라면… 아는 얼굴이 있어서 조금 덜 무서워요…' },
        { say: '꿈이 크네요', tier: 'meh', face: 'sorry', answer: '꿈, 꿈만 커요… 현실은 박스 안이에요…' },
      ],
    },
    {
      id: 'wall',
      open: '관객이 세 명 넘으면… 벽 보고 쳐요… 요즘은 네 명까지 괜찮아졌어요…',
      replies: [
        { say: '엄청 늘었네요!', tier: 'great', remember: 'wall-practice', face: 'shy', answer: '느, 늘었다…? 칭찬… 아, 또 녹아요… 헤헤…' },
        { say: '내가 다섯 번째 할게요', tier: 'good', face: 'wow', answer: '다섯 번째…! {me} 씨라면… 벽 대신 볼 수 있을지도…' },
        { say: '벽이 좋아하겠네요', tier: 'meh', face: 'calm', answer: '벼, 벽은 박수를 안 쳐서 편해요…' },
      ],
    },
    {
      id: 'brave',
      when: { ch: 3 },
      open: '요, 요즘… {me} 씨랑 말할 땐 박스 생각이 덜 나요… 이상하죠…',
      replies: [
        { say: '하나도 안 이상해요', tier: 'great', face: 'shy', answer: '그, 그럼… 박스 대신 {me} 씨 옆이 제 구석이에요… 아, 말해 버렸다…' },
        { say: '박스가 서운하겠어요', tier: 'good', face: 'laugh', answer: '헤헤… 박스한텐 비밀로 해 주세요… 아직 같이 살아야 해서요…' },
        { say: '익숙해져서 그래요', tier: 'meh', face: 'think', answer: '그, 그런 걸까요… 그것도 좋은 거겠죠…' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '앗… 이, 이런 시간에 사람이… 밤새 연습하다가 나왔어요… 해가 무서워요…',
      replies: [
        { say: '조용한 시간이라 좋죠', tier: 'great', face: 'smile', answer: '네… 새벽은 아무도 저를 안 봐서… 아, {me} 씨는 괜찮아요…' },
        { say: '얼른 자요', tier: 'good', face: 'shy', answer: '네, 네… 박스로 돌아갈게요… 걱정해 주셔서 고마워요…' },
        { say: '밤샘은 몸에 안 좋아요', tier: 'meh', face: 'sorry', answer: '아, 알아요… 근데 코드가 안 잡혀서… 죄송해요…' },
      ],
    },
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비, 비 오는 날은… 밖에 안 나가도 되는 핑계가 생겨서 좋아요… 헤헤…',
      replies: [
        { say: '빗소리에 맞춰 쳐 줘요', tier: 'great', face: 'wow', answer: '비, 빗소리랑 같이…? 틀려도 티가 덜 나요… 좋아요…' },
        { say: '저도 집에 있을래요', tier: 'good', face: 'smile', answer: '도, 동지네요… 각자 구석에서 조용히 지내요…' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '누, 눈이에요… 손가락이 굳어서… 주머니에서 못 빼요…',
      replies: [
        { say: '따뜻한 거 사 줄게요', tier: 'great', face: 'shy', answer: '저, 저한테요…? 소, 손이 녹는 게 아니라 제가 녹아요…' },
        { say: '눈 밟는 소리 좋네요', tier: 'good', face: 'wow', answer: '그, 그쵸…! 리듬이 좋아요… 아, 혼잣말 들으셨군요…' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '저, 저녁이네요… 무대 시간이 다가오면… 배가 아파요…',
      replies: [
        { say: '무대 위 봇치 씨 최고예요', tier: 'great', remember: 'praise-melt', face: 'shy', answer: '최, 최고…! 아, 녹아요… 무대 전에 녹으면 안 되는데…' },
        { say: '심호흡 같이 해요', tier: 'good', face: 'smile', answer: '흐, 흐읍… 후… 조금 나아졌어요… 고마워요…' },
        { say: '오늘은 쉬어요', tier: 'meh', face: 'think', answer: '쉬, 쉬면… 다음엔 더 무서워져요… 그래서 가요…' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤이 제일 편해요… 아무도 저를 안 보니까요… 아, {me} 씨는 봐도 돼요…',
      replies: [
        { say: '작게 한 곡 들려줘요', tier: 'great', face: 'shy', answer: '자, 작게요… 밤에는 소리가 멀리 가니까… 귀 가까이 오세요…' },
        { say: '별 보러 온 거예요', tier: 'good', face: 'smile', answer: '별, 별은 관객이 아니라서 좋아요… 같이 봐요…' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축, 축제 무대에 서기로 했어요… 도망가면… 잡아 주세요… 꼭이요…',
      replies: [
        { say: '무대 옆에서 지킬게요', tier: 'great', remember: 'show-promise', face: 'wow', answer: '지, 지켜…! 그럼 도망 못 가요… 아, 고마운 의미예요…' },
        { say: '상자 하나 갖다 둘게요', tier: 'good', remember: 'box-ok', face: 'laugh', answer: '무, 무대 뒤에요…? 공연 끝나면 바로 들어갈게요… 헤헤…' },
        { say: '도망가도 괜찮아요', tier: 'meh', face: 'sorry', answer: '그, 그렇게 말하면 진짜 가요… 잡아 주세요…' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{fish}… 낚으셨어요…? 아, 저, 저 조용히 앉아 있는 건 자신 있어요… 낚시 같이…',
      replies: [
        { say: '다음엔 같이 가요', tier: 'great', face: 'shy', answer: '네, 네…! 말 안 해도 되는 취미라니… 최고예요…' },
        { say: '조개도 주웠어요', tier: 'good', face: 'wow', answer: '조, 조개…! 귀에 대면 소리가 나요… 그거 좋아해요…' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일 하셨어요…? 괭이 소리가 일정해서… 메트로놈 같았어요…',
      replies: [
        { say: '그 박자로 곡 써 줘요', tier: 'great', face: 'wow', answer: '바, 밭의 노래…! 제목은 아직이에요… 같이 지어 주세요…' },
        { say: '들었어요?', tier: 'good', face: 'shy', answer: '지, 지나가다가요… 멀리서요… 숨어서요…' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '그, 금별 작물이에요…? 반짝여서… 무대 조명 같아요… 눈부셔요…',
      replies: [
        { say: '무대 장식으로 쓸래요?', tier: 'great', face: 'wow', answer: '자, 장식…? 그럼 관객이 저 말고 작물을 볼 테니… 완벽해요…' },
        { say: '부럽죠?', tier: 'good', face: 'sorry', answer: '조, 조금요… 저도 언젠가 반짝이고 싶어요… 무대에서만요…' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me} 씨… 오, 오늘 기운 없어 보여요… 저, 저도 그런 날 많아서… 알아요…',
      replies: [
        { say: '한 곡만 들려줘요', tier: 'great', face: 'shy', answer: '네… 말은 서툴러도 기타는 할 수 있어요… 조용한 곡으로요…' },
        { say: '박스 빌려줘요', tier: 'good', remember: 'box-ok', face: 'laugh', answer: '헤, 헤헤… 제일 좋은 걸로 빌려드릴게요… 소리 잘 울리는 거요…' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me} 씨, 오늘 빛나요… 너, 너무 밝아서… 그늘로 조금만 갈게요…',
      replies: [
        { say: '같이 빛나요', tier: 'great', face: 'shy', answer: '가, 같이…? 그, 그럼 조금만 덜 숨을게요… 조금만요…' },
        { say: '좋은 일 있었어요', tier: 'good', face: 'smile', answer: '다, 다행이에요… 그 얘기 곡으로 만들어도 돼요…?' },
      ],
    },
    {
      id: 'op-record',
      when: { news: 'record' },
      open: '마, 마을 소식에… 기록이 나왔대요… 사람들이 막 모여서… 저는 숨었어요…',
      replies: [
        { say: '축하곡 쳐 줘요', tier: 'great', face: 'wow', answer: '추, 축하곡…! 멀리서 치면… 아무도 제가 친 줄 모르겠죠…?' },
        { say: '같이 구경 가요', tier: 'good', face: 'sorry', answer: '{me} 씨 등 뒤에 숨어서라면… 가, 갈게요…' },
      ],
    },
    {
      id: 'op-himmel',
      when: { bond: 'himmel' },
      open: '{other} 씨 만나셨어요…? 또 상담할 게 있다고… 저, 벌써 손에 땀이…',
      replies: [
        { say: '이번엔 같이 들어요', tier: 'great', remember: 'himmel-advice', face: 'wow', answer: '가, 같이요…! 든든해요… 쓰러지면 받아 주세요…' },
        { say: '거절해도 돼요', tier: 'good', face: 'think', answer: '그, 그건 못 해요… 힘멜 씨는 제 공연에 늘 박수 쳐 줘서요…' },
      ],
    },
    {
      id: 'op-frieren',
      when: { bond: 'frieren' },
      open: '{other} 씨 보셨어요…? 제 공연에서 또 주무셨어요… 자장가로는 합격인가 봐요…',
      replies: [
        { say: '편해서 조는 거예요', tier: 'great', face: 'shy', answer: '펴, 편해서…? 그렇게 생각하면… 칭찬이네요… 헤헤…' },
        { say: '신나는 곡을 쳐 봐요', tier: 'good', face: 'think', answer: '시, 신나는 곡에도 주무셨어요… 오히려 더 깊이…' },
      ],
    },
    {
      id: 'op-haku',
      when: { bond: 'haku' },
      open: '{other} 씨 과수원 다녀오셨어요…? 거기 원두막이 제일 편한 무대예요… 말이 없어서요…',
      replies: [
        { say: '다음엔 같이 가요', tier: 'great', face: 'smile', answer: '네…! 관객 둘… 한 분은 말이 없으시고… 딱 좋아요…' },
        { say: '박수는 쳐 줘요?', tier: 'good', face: 'think', answer: '고, 고개를 한 번 끄덕여 주세요… 그게 제일 좋아요…' },
      ],
    },
    {
      id: 'op-lumi',
      when: { bond: 'lumi' },
      open: '{other} 씨요…? 공연 밤마다 카지노 앞에서 박수 쳐 주세요… 너, 너무 커서 숨고 싶어요…',
      replies: [
        { say: '팬이 있는 거잖아요', tier: 'great', face: 'shy', answer: '패, 팬…! 그 단어는 너무 무거워요… 녹아요…' },
        { say: '작게 쳐 달라고 해요', tier: 'good', face: 'sorry', answer: '그, 그런 말은 못 해요… 대본 쓰면 사흘 걸려요…' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-box',
      when: { mem: 'box-ok' },
      use: 'box-ok',
      open: '전에 박스가 좋은 자리라고 해 주셨죠… 그래서 하나 더 구했어요… {me} 씨 거예요…',
      replies: [
        { say: '나란히 들어가요', tier: 'great', face: 'shy', answer: '나, 나란히…! 박스 두 개면… 그건 거의 집이에요…' },
        { say: '고마워요', tier: 'good', face: 'smile', answer: '소, 소리 잘 울리는 걸로 골랐어요… 써 주세요…' },
      ],
    },
    {
      id: 'cb-praise',
      when: { mem: 'praise-melt' },
      use: 'praise-melt',
      open: '저번 칭찬… 아직 반쯤 녹은 상태예요… 그날 쓴 곡이 제일 잘 나왔어요…',
      replies: [
        { say: '또 칭찬해도 돼요?', tier: 'great', face: 'shy', answer: '아, 안 돼요…! 아니 돼요… 아니 반만요… 흐물…' },
        { say: '곡 들려줘요', tier: 'good', face: 'smile', answer: '네… 제목은 "칭찬받은 날"이에요… 아, 부끄러워요…' },
      ],
    },
    {
      id: 'cb-phone',
      when: { mem: 'phone-script' },
      use: 'phone-script',
      open: '대, 대본 연습 덕분에… 주점 사장님한테 전화했어요…! 세 번 만에 말했어요…',
      replies: [
        { say: '대단해요, 봇치 씨!', tier: 'great', face: 'shy', answer: '대, 대단…! 오늘 일기장에 크게 쓸게요… 헤헤…' },
        { say: '두 번은 왜요?', tier: 'good', face: 'sorry', answer: '처, 처음 두 번은… 신호 가자마자 끊었어요…' },
      ],
    },
    {
      id: 'cb-himmel',
      when: { mem: 'himmel-advice' },
      use: 'himmel-advice',
      open: '상담단 결성한 거 기억하세요…? 힘멜 씨가 요즘 상담을 안 해요… 표정이 달라졌어요…',
      replies: [
        { say: '마음이 정리됐나 봐요', tier: 'great', face: 'think', answer: '그, 그런가요… 좋은 쪽이면 좋겠어요… 저도 덜 쓰러지고요…' },
        { say: '봇치 씨 덕분이에요', tier: 'good', face: 'shy', answer: '저, 저는 쓰러지기만 했는데요…? 헤헤… 그래도 기뻐요…' },
      ],
    },
    {
      id: 'cb-band',
      when: { mem: 'band-letters' },
      use: 'band-letters',
      open: '밴드 친구들한테 답장 썼어요… {me} 씨 얘기도 썼어요… 공연 봐 주는 사람이라고…',
      replies: [
        { say: '영광이에요', tier: 'great', face: 'shy', answer: '여, 영광은 제 쪽이에요… 친구들이 놀랐대요… 제가 사람 얘기를 해서…' },
        { say: '돈은 돌려받았어요?', tier: 'good', face: 'laugh', answer: '아, 아니요… 대신 사진이 왔어요… 그걸로 됐어요…' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '저, 저기… {me} 씨가 좋아하는 게… {taste} 맞죠…? 그걸로 가사를 써 봤어요…',
      replies: [
        { say: '들려줘요!', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '가, 가사만 읽으면 부끄러우니까… 기타랑 같이요… 작게요…' },
        { say: '어떻게 알았어요?', tier: 'good', remember: 'taste-heard', face: 'sorry', answer: '그, 그냥… 잘 듣고 있었어요… 구석에서요…' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '가, 같이 걸은 날… 사람 많은 길이었는데… 하나도 안 무서웠어요… 처음이에요…',
      replies: [
        { say: '또 같이 걸어요', tier: 'great', remember: 'outing-talk', face: 'shy', answer: '네…! 다음엔 최소 인원 경로 말고… {me} 씨 경로로요…' },
        { say: '내 뒤에 숨었잖아요', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '드, 들켰어요…? 등이 넓어서… 좋은 그늘이었어요…' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '고, 곧 생일이시죠…? 축하곡을… 만들고 있어요… 제목에 이름 넣어도 돼요…?',
      replies: [
        { say: '물론이죠!', tier: 'great', remember: 'bday-plan', face: 'shy', answer: '그, 그럼 무대에서 제목 말할게요… 떨려도… 꼭요…' },
        { say: '작게 불러 줘요', tier: 'good', remember: 'bday-plan', face: 'smile', answer: '네… 둘만 들리게요… 그게 저도 편해요… 헤헤…' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '{me} 씨 방… 구석이 아늑했어요… 그날은 박스 생각이 하나도 안 났어요…',
      replies: [
        { say: '언제든 와요', tier: 'great', remember: 'date-talk', face: 'shy', answer: '어, 언제든…? 그 말… 녹아요… 기타 들고 갈게요…' },
        { say: '구석 비워 둘게요', tier: 'good', remember: 'date-talk', face: 'laugh', answer: '헤헤… 제 지정석이네요… 이름표 붙여도 돼요…?' },
      ],
    },
  ],
  chapters: [
    {
      title: '박스 속 악사',
      hint: '한 번 이야기를 나누면 봇치가 박스에서 머리를 내밀어요.',
      need: { days: 1 },
      scene: [
        '구석에 놓인 박스가 조금 흔들린다. 안에서 기타 소리가 난다.',
        '말을 걸자 소리가 뚝 멈추고, 분홍 머리가 반쯤 나온다.',
        '"아, 저, 저는… 봇치라고 해요… 떠돌이 악사… 라고 하기엔…"',
        '"방, 방금 그 소리… 들으셨어요…? 잊어 주세요… 제발요…"',
      ],
      replies: [
        { say: '좋은 소리였어요', tier: 'great', remember: 'praise-melt', face: 'shy', answer: '조, 좋은…! 첫 만남에 칭찬이라니… 녹아요… 흐물…' },
        { say: '못 잊을 것 같은데요', tier: 'good', face: 'wow', answer: '그, 그럼… 기억하셔도 돼요… 대신 다른 사람한텐 비밀로…' },
        { say: '거기서 뭐 해요?', tier: 'meh', remember: 'box-ok', face: 'sorry', answer: '사, 살고 있어요… 아니, 연습이요… 반쯤 살아요…' },
      ],
    },
    {
      title: '빈 무대',
      hint: '밤(게임 시각 저녁 아홉 시부터 자정) 허풍 주점에 가 보세요. 손님이 다 가면 봇치가 무대에 서요.',
      need: { days: 3, points: 20, visit: { area: 'tavern', from: 21, to: 24 } },
      scene: [
        '손님이 다 떠난 주점. 의자는 테이블 위에 올라가 있다.',
        '무대 위 봇치가 나를 보고 기타를 끌어안는다.',
        '"오, 오셨어요… 사람 없는 무대가 제일 좋아서요… 관객은 한 분만…"',
        '그녀가 줄을 튕기자 표정이 바뀐다. 더듬던 사람이 사라진다.',
        '곡이 끝나고, 봇치가 다시 작아진다. "…어, 어땠어요…?"',
      ],
      replies: [
        { say: '딴사람 같았어요', tier: 'great', remember: 'empty-stage', face: 'shy', answer: '기, 기타 잡으면 그래요… 근데 지금 이 사람도 저예요… 헤헤…' },
        { say: '앙코르!', tier: 'good', remember: 'empty-stage', face: 'wow', answer: '앙, 앙코르…! 처음 들어 봐요… 한 곡 더 할게요…!' },
        { say: '졸려요…', tier: 'meh', remember: 'empty-stage', face: 'sorry', answer: '프, 프리렌 씨처럼요…? 자장가 재능이 있나 봐요…' },
      ],
    },
    {
      title: '조용한 간식',
      hint: '봇치는 소리 안 나는 간식을 좋아해요. 군밤을 가지고 가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'roastchestnut', take: true } },
      scene: [
        '군밤 봉지를 내밀자 봇치가 박스 뒤에서 눈만 내민다.',
        '"구, 군밤…! 바스락 소리가 작아서… 몰래 먹기 좋은 간식이에요…"',
        '그녀가 껍질을 조심조심 깐다. 아주 작은 소리만 난다.',
        '"저, 저는 늘 혼자 먹었어요… 누가 보면 목에 걸려서요…"',
        '"근데 지금은… 안 걸려요. 이상하네요… 하나 드세요…"',
      ],
      replies: [
        { say: '같이 먹으니 맛있네요', tier: 'great', remember: 'chestnut-gift', face: 'shy', answer: '네… 같이 먹는 군밤이 더 따뜻해요… 처음 알았어요…' },
        { say: '내가 까 줄게요', tier: 'good', remember: 'chestnut-gift', face: 'wow', answer: '저, 정말요…? 그럼 저는 노래로 갚을게요… 군밤 송이요…' },
        { say: '남아서 가져왔어요', tier: 'meh', remember: 'chestnut-gift', face: 'smile', answer: '그, 그래도 저한테 와 주셨잖아요… 그게 기뻐요…' },
      ],
    },
    {
      title: '맨 앞자리',
      hint: '봇치의 공연을 꼭 보러 가겠다고 약속하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'show-promise' },
      scene: [
        '금요일 저녁, 주점이 꽉 찼다. 봇치가 무대 가장자리에서 떨고 있다.',
        '조명이 켜지자, 그녀가 맨 앞자리의 나를 찾는다.',
        '눈이 마주친 순간 기타 소리가 객석을 뒤흔든다. 아무도 졸지 않는다.',
        '공연이 끝나고 무대 뒤, 봇치가 박스 위에 털썩 앉는다.',
        '"저, 저… 오늘 벽 안 봤어요… {me} 씨만 보고 쳤어요…"',
      ],
      replies: [
        { say: '다 보였어요. 멋졌어요', tier: 'great', remember: 'stage-eyes', face: 'shy', answer: '머, 멋졌…! 녹아요… 오늘은 진짜 다 녹아요… 받아 주세요…' },
        { say: '프리렌 씨도 안 졸았어요', tier: 'good', remember: 'stage-eyes', face: 'wow', answer: '지, 진짜요…? 역사적인 밤이에요… 일기장에 쓸게요…' },
        { say: '눈이 좀 무서웠어요', tier: 'meh', remember: 'stage-eyes', face: 'sorry', answer: '죄, 죄송해요… 너무 집중해서… 다음엔 웃으면서 볼게요…' },
      ],
    },
    {
      title: '제목 없는 곡',
      hint: '봇치와 아주 가까워지면 그녀가 새 곡을 들려줘요. 그 뒤엔 꽃다발도 받을지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '공원 벤치 끝자리. 오늘은 봇치가 가운데 쪽으로 한 칸 옮겨 앉는다.',
        '"이, 이 곡… 아직 제목이 없어요… {me} 씨 생각하면서 썼거든요…"',
        '조용한 곡이다. 박스 속 소리가 아니라, 밖으로 나가는 소리.',
        '"제, 제목을 말하려면… 용기가 조금 더 필요해요…"',
        '"혹시… 꽃 같은 걸 받으면… 그 용기가 생길지도… 아, 아니에요…!"',
      ],
      replies: [
        { say: '제목 기다릴게요', tier: 'great', face: 'shy', answer: '네… 기다려 주시면… 꼭 말할게요… 무대에서요…' },
        { say: '정말 좋은 곡이에요', tier: 'good', face: 'shy', answer: '조, 좋은…! 아, 녹지 말자… 오늘은 버틸 거예요…' },
        { say: '꽃이요?', tier: 'meh', face: 'sorry', answer: '모, 못 들은 걸로 해 주세요…! 박스 들어갈게요…' },
      ],
    },
    {
      title: '둘만의 앙코르',
      hint: '봇치와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '주점 무대. 봇치가 마이크 앞에서 크게 숨을 들이쉰다.',
        '"이, 이번 곡 제목은… {me} 씨를 위한 노래예요…"',
        '객석이 술렁인다. 그녀는 숨지 않고 끝까지 친다.',
        '무대가 끝나고, 봇치가 내 소매를 살짝 잡는다.',
        '"바, 박스보다… {me} 씨 옆이 좋아요… 계속이요…"',
        '"반지 같은 거… 받으면 저 진짜 녹아 없어질지도 몰라요… 그래도요…"',
      ],
      replies: [
        { say: '계속 옆에 있을게요', tier: 'great', face: 'shy', answer: '네…! 앙코르는 평생 할게요… {me} 씨한테만요…' },
        { say: '제목 말했네요!', tier: 'good', face: 'laugh', answer: '마, 말했어요…! 지금 다리가 후들거려요… 붙잡아 주세요…' },
        { say: '녹으면 안 돼요', tier: 'meh', face: 'sorry', answer: '노, 노력할게요… 반만 녹을게요… 헤헤…' },
      ],
    },
  ],
  after: [
    '오, 오늘은 대화 에너지를 다 썼어요… 내일 충전해 올게요…',
    '더, 더 말하면 쓰러져요… 그래도 와 주셔서 기뻐요…',
    '저, 저는 박스로 돌아갈게요… 또 불러 주세요…',
    '…(작게 기타 줄을 튕기며 고개를 꾸벅 숙인다)',
  ],
};
