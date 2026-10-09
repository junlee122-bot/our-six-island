// 봇치 — 떠돌이 악사. 극도로 낯을 가려 "아, 저, 저…" 더듬는 존댓말, 말끝은 늘
// 흐려진다. 구석·박스 안이 제일 편하고, 기타를 잡고 무대에 서면 사람이 바뀐다.
// 칭찬받으면 녹아내리고, 혼자 상상이 폭주한다. 분홍 운동복, 아버지께 빌린 검은
// 기타, 화·금 저녁 허풍 주점 무대(샹크스 사장님), 비밀 영상 계정, 사인 연습 공책.
// 옛 밴드 친구들(드럼 치던 선배, 베이스 치던 선배, 노래하던 친구)의 편지와 첫
// 공연의 떨림. 힘멜의 연애 상담역인데 본인이 더 떨고, 프리렌은 공연 때마다 존다.
// 이야기 여섯 장은 박스 속에서 흥얼대던 "제목 없는 곡"이 무대에서 제목을 얻기까지.
// 원작 대사는 쓰지 않는다.
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
    'drum-letter': '드럼 치던 선배의 편지 이야기를 들었어요',
    'bass-letter': '베이스 치던 선배의 그림 편지 이야기를 들었어요',
    'vocal-letter': '노래하던 친구에게 기타를 가르친대요',
    'first-live': '첫 공연 날 떨렸던 이야기를 들었어요',
    'sign-practice': '봇치의 첫 사인을 받기로 했어요',
    'replay': '부끄러운 장면을 밤새 되감는대요',
    'guitar-story': '검은 기타가 아버지 것이라는 걸 들었어요',
    'wood-dream': '단단한 나무로 기타를 만들고 싶대요',
    'shell-ear': '조개를 귀에 대고 바닷소리를 같이 들었어요',
    'shop-voice': '어서 오세요 연습 상대가 되어 줬어요',
    'mc-script': '공연 멘트를 같이 써 주기로 했어요',
    'fan-letter': '이름 없는 팬레터 이야기를 들었어요',
    'bangs': '앞머리는 봇치의 커튼이래요',
    'couple-song': '둘이 부를 노래를 약속했어요',
    'village-band': '마을 밴드를 꾸려 보자고 했어요',
  },
  talks: [
    {
      id: 'box',
      open: ['아, 저, 저… 놀라지 마세요… 이 박스 안에 있는 거 저예요…', '여기가 제일 편해서요… 소리도 잘 울리고…'],
      replies: [
        { say: '좋은 자리네요', tier: 'great', remember: 'box-ok', face: 'wow', answer: ['이, 이해해 주시는 분이 있다니… 오늘 운을 다 썼어요…', '모서리에 등을 대면요… 세상이 딱 박스만 해져요… 그게 좋아요…'] },
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
        { say: '꼭 갈게요. 약속해요', tier: 'great', remember: 'show-promise', face: 'shy', answer: ['야, 약속…! 그럼 도망 못 가요… 아, 기쁜 의미로요…', '약속이라는 말… 공책 맨 앞장에 적어 둘게요…'] },
        { say: '맨 앞자리 맡아 둘게요', tier: 'good', remember: 'show-promise', face: 'wow', answer: '매, 맨 앞…? 눈이 마주치면 굳을지도… 그래도 와 주세요…' },
        { say: '시간 되면요', tier: 'meh', face: 'calm', answer: '네, 네… 괜찮아요… 원래 손님 셋이면 많은 거예요…' },
      ],
    },
    {
      id: 'praise',
      open: '아, 아까 연습하는 거… 들으셨어요…? 어, 어땠어요… 아, 아니 대답 안 하셔도…',
      replies: [
        { say: '진짜 멋있었어요', tier: 'great', remember: 'praise-melt', face: 'shy', answer: ['헤, 헤헤… 멋, 멋있…', '…아, 지금 몸이 녹고 있어요… 흐물흐물…', '자, 잠깐만요… 다시 굳는 데 오 분만 주세요…'] },
        { say: '마지막 부분 좋던데요', tier: 'good', face: 'wow', answer: '거기 백 번 연습한 데예요…! 알아봐 주시다니…' },
        { say: '잘 못 들었어요', tier: 'meh', face: 'sorry', answer: '다, 다행이에요… 틀린 데가 세 군데 있었거든요…' },
      ],
    },
    {
      id: 'lyrics',
      open: '가사 쓰는 중이었어요… 보, 보면 안 돼요…! 너무 어두워서… 다들 걱정해요…',
      replies: [
        { say: '어두운 가사도 좋아요', tier: 'great', remember: 'lyrics', face: 'wow', answer: ['저, 정말요…? 그럼 이 줄은 안 지울게요…', '"구석에도 햇빛은 반쯤 든다"… 구석의 노래예요…'] },
        { say: '밝은 것도 써 봐요', tier: 'good', remember: 'lyrics', face: 'think', answer: '바, 밝은 거… 해 보면 이상하게 박스가 나와요… 노력할게요…' },
        { say: '몰래 볼게요', tier: 'meh', face: 'sorry', answer: '아, 안 돼요…! 공책을 품에 꼭 안을게요…' },
      ],
    },
    {
      id: 'phone',
      open: '주점 사장님한테 전화해야 하는데… 대, 대본을 세 번 썼어요… 들어 봐 주실래요…?',
      replies: [
        { say: '내가 사장님 역 할게요', tier: 'great', remember: 'phone-script', face: 'laugh', answer: ['여, 연습 상대…! 그럼 시작할게요…', '여, 여보세… 아, 다시요… 여보세요… 됐다…!'] },
        { say: '대본 없이도 돼요', tier: 'good', face: 'think', answer: '대본 없이요…? 그건 맨손으로 바다 건너는 거예요…' },
        { say: '그냥 직접 가요', tier: 'meh', face: 'sorry', answer: '지, 직접…? 얼굴을 보면서요…? 더 무서워요…' },
      ],
    },
    {
      id: 'channel',
      open: '사, 사실 기타 영상 올리는 계정이 있어요… 이름은… 절대 말 못 해요…',
      replies: [
        { say: '비밀 지켜 줄게요', tier: 'great', remember: 'secret-channel', face: 'shy', answer: ['고, 고마워요… {me} 씨한테만 말한 거예요… 처음이에요…', '화면 속 저는요… 얼굴이 안 나와서 엄청 용감해요…'] },
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
        { say: '뭐라고 조언했어요?', tier: 'good', face: 'think', answer: ['"노래로 하세요"요… 힘멜 씨는 노래를 못 해요…', '그래서 제가 반주를 맡기로… 아, 일이 커졌어요…'] },
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
      id: 'drum-senpai',
      open: ['드, 드럼 치던 선배한테 편지가 왔어요…', '"무리하지 말고, 너 하고 싶은 대로 쳐"래요… 늘 그렇게 써요…'],
      replies: [
        { say: '좋은 선배네요', tier: 'great', remember: 'drum-letter', face: 'smile', answer: ['네… 저를 처음 밴드로 데려가 준 사람이에요…', '공원 그네에 혼자 앉아 있던 저한테… 먼저 말을 걸어 줬어요…', '그날 메고 있던 기타가… 제 인생을 바꿨어요… 헤헤…'] },
        { say: '답장 같이 써요', tier: 'good', remember: 'drum-letter', face: 'shy', answer: '가, 같이요…? 그럼 "마을에 아는 사람이 생겼어요"라고… 써도 돼요…?' },
        { say: '선배 무섭진 않아요?', tier: 'meh', face: 'think', answer: '아, 아니요… 제일 안 무서운 사람이에요… 햇볕 같은 사람이라서요…' },
      ],
    },
    {
      id: 'bass-senpai',
      open: ['베이스 치던 선배는… 편지 대신 그림을 보내요…', '이번엔 들풀 그림이에요… 요즘 또 풀 뜯어 먹고 산대요…'],
      replies: [
        { say: '자유로운 분이네요', tier: 'great', remember: 'bass-letter', face: 'laugh', answer: ['네… 말수는 적은데 곡은 제일 잘 써요…', '돈은 늘 없지만요… 그것도 멋있어요… 아마도요…'] },
        { say: '먹을 거 보내 드려요', tier: 'good', remember: 'bass-letter', face: 'smile', answer: '그, 그럼 군밤을 보낼게요… 조용한 간식이라 좋아하실 거예요…' },
        { say: '풀을 먹어요?', tier: 'meh', face: 'think', answer: '네… 들풀 요리에 진심이세요… 저는 따라 하다 배탈 났어요…' },
      ],
    },
    {
      id: 'vocal-friend',
      open: ['노래하던 친구가… 기타를 다시 가르쳐 달래요…', '그 친구는 저보다 백 배 밝은데… 기타는 저한테 배웠거든요…'],
      replies: [
        { say: '봇치 씨가 선생님이네요', tier: 'great', remember: 'vocal-letter', face: 'shy', answer: ['서, 선생님…! 그 단어 너무 무거워요… 녹아요…', '…그래도 그 친구 노래엔 제 기타가 제일 어울린대요…'] },
        { say: '편지로 어떻게 가르쳐요?', tier: 'good', remember: 'vocal-letter', face: 'think', answer: '코, 코드 그림을 그려 보내요… 말로 하는 것보다 훨씬 쉬워요…' },
        { say: '바쁘다고 해요', tier: 'meh', face: 'sorry', answer: '그, 그런 거짓말은… 들키면 목소리가 세 배로 커져서 와요…' },
      ],
    },
    {
      id: 'first-live',
      open: ['처, 처음 무대에 섰던 날 얘기… 해도 될까요…', '태풍 오는 날이었어요… 손님이 몇 없는데도… 신발만 봤어요…'],
      replies: [
        { say: '그래도 끝까지 쳤잖아요', tier: 'great', remember: 'first-live', face: 'shy', answer: ['네… 중간에 선배들 소리가 들려서… 고개를 들었어요…', '그때 처음 알았어요… 같이 치면 덜 무섭다는 거…'] },
        { say: '신발은 예뻤어요?', tier: 'good', remember: 'first-live', face: 'laugh', answer: '사, 삼십 분 동안 봐서… 실밥 개수까지 외웠어요…' },
        { say: '실수 많이 했어요?', tier: 'meh', face: 'sorry', answer: '아, 아주 많이요… 근데 기억에서 지웠어요… 지운 걸로 해 주세요…' },
      ],
    },
    {
      id: 'autograph',
      open: ['이, 이 공책 보지 마세요…! 사, 사인 연습이에요…', '아직 아무도 달라고 한 적 없는데… 벌써 세 권째예요…'],
      replies: [
        { say: '첫 사인은 제가 받을게요', tier: 'great', remember: 'sign-practice', face: 'wow', answer: ['처, 첫 사인…! 그럼 제일 잘 된 걸로 해 드릴게요…', '아, 지금 말고요… 조금 더 연습하고요… 곧이요…'] },
        { say: '하나만 보여 줘요', tier: 'good', face: 'shy', answer: '이, 이건 너무 멋 부린 거라… 여기 작은 것만 보세요… 별 붙은 거요…' },
        { say: '그냥 이름 쓰면 되잖아요', tier: 'meh', face: 'sorry', answer: '그, 그럼 사인이 아니라 출석부예요…' },
      ],
    },
    {
      id: 'melt-doctor',
      open: ['메르시 선생님한테 진찰받았어요… 칭찬받으면 녹는 증상이요…', '아무 이상 없대요… 그럼 이 흐물흐물은 뭘까요…'],
      replies: [
        { say: '봇치 씨만의 재능이에요', tier: 'great', face: 'laugh', answer: '재, 재능…! 아, 또 녹아요… 이것도 진찰받아야 하나요…' },
        { say: '기뻐서 그런 거예요', tier: 'good', face: 'shy', answer: '기, 기뻐서… 그런 거라면… 안 나아도 될 것 같아요…' },
        { say: '다른 데도 가 봐요', tier: 'meh', face: 'think', answer: '점집 천막 신이치 씨는… "사건 냄새가 난다"고만 하셨어요…' },
      ],
    },
    {
      id: 'replay',
      open: ['어, 어제 시장에서 "감사합니다" 대신…', '"수고하세요"라고 했어요… 밤새 그 장면을 백 번 되감았어요…'],
      replies: [
        { say: '저도 그런 적 있어요', tier: 'great', remember: 'replay', face: 'wow', answer: ['저, 정말요…? {me} 씨도요…?', '그럼 우리 둘 다 정상이에요… 아마도요… 헤헤…'] },
        { say: '아무도 기억 못 해요', tier: 'good', remember: 'replay', face: 'think', answer: '그, 그럴까요… 그 상인은 오늘 아침에도 저를 보고 웃었는데요…' },
        { say: '좀 웃기긴 하네요', tier: 'meh', face: 'sorry', answer: '으… 오늘 밤엔 이 장면까지 같이 되감을 거예요…' },
      ],
    },
    {
      id: 'captain-stage',
      open: ['샹크스 사장님이요… 제가 틀리면 더 크게 웃으세요…', '처음엔 무서웠는데… 웃음소리가 박자에 맞아서 이젠 편해요…'],
      replies: [
        { say: '사장님 웃음이 박수네요', tier: 'great', face: 'wow', answer: '바, 박수…! 그렇게 들으면… 틀려도… 아니, 안 틀릴게요…' },
        { say: '무대 준 은인이네요', tier: 'good', face: 'smile', answer: ['네… "아무 때나 와서 쳐라" 하셨어요…', '그 말 듣고 사흘 울었어요… 좋은 의미로요…'] },
        { say: '너무 시끄럽잖아요', tier: 'meh', face: 'calm', answer: '시, 시끄러운 건 싫은데… 사장님 소리는 이상하게 괜찮아요…' },
      ],
    },
    {
      id: 'black-guitar',
      open: ['이 검은 기타… 아버지 거예요… 빌린 지 벌써 몇 년째예요…', '돌려 드려야 하는데… 이제 손에 너무 익었어요…'],
      replies: [
        { say: '기타도 봇치 씨를 골랐네요', tier: 'great', remember: 'guitar-story', face: 'wow', answer: ['기, 기타가 저를…? 그런 생각은 못 해 봤어요…', '…오늘 밤엔 기타한테 고맙다고 말할게요… 작게요…'] },
        { say: '아버님께 편지 써요', tier: 'good', remember: 'guitar-story', face: 'shy', answer: '펴, 편지라면… 할 수 있어요… "조금만 더 빌릴게요"라고요…' },
        { say: '새로 하나 사요', tier: 'meh', face: 'sorry', answer: '새 기타는… 저처럼 낯을 가려서… 친해지는 데 몇 년 걸려요…' },
      ],
    },
    {
      id: 'hardwood',
      open: ['단단한 나무 만지는 거 좋아해요… 두드리면 좋은 소리가 나서요…', '언젠가 그런 나무로… 제 기타를 직접 만들고 싶어요…'],
      replies: [
        { say: '발키리 씨한테 같이 가요', tier: 'great', remember: 'wood-dream', face: 'wow', answer: ['가, 가구점이요…? 혼자선 문 앞에서 세 번 돌아왔어요…', '{me} 씨가 같이 가면… 문 손잡이까지는 잡을게요…'] },
        { say: '좋은 나무 구해 줄게요', tier: 'good', remember: 'wood-dream', face: 'shy', answer: '저, 정말요…? 그 나무로 만든 기타라면… 첫 곡은 {me} 씨 거예요…' },
        { say: '사는 게 편하죠', tier: 'meh', face: 'think', answer: '편, 편하긴 한데… 제 손으로 만든 소리를 듣고 싶어서요…' },
      ],
    },
    {
      id: 'shell',
      open: ['조개를 귀에 대면… 바닷소리가 나요… 아시죠…?', '저는 그걸로 마음을 조율해요… 농담 아니에요… 반쯤은요…'],
      replies: [
        { say: '같이 들어 봐요', tier: 'great', remember: 'shell-ear', face: 'shy', answer: ['그, 그럼 이쪽 큰 걸로 드릴게요… 쉬잇…', '…들리죠? 이게 제가 아는 제일 조용한 노래예요…'] },
        { say: '조개 주워다 줄게요', tier: 'good', remember: 'shell-ear', face: 'smile', answer: '럭스 씨 어시장 옆 모래톱이 좋아요… 사람 없는 새벽에요…' },
        { say: '그거 피 도는 소리래요', tier: 'meh', face: 'sorry', answer: '아, 알아요… 그래도 바다라고 믿고 싶어요…' },
      ],
    },
    {
      id: 'grasshopper',
      open: ['츠나데 할머니 텃밭에서… 메뚜기가 저한테 뛰어올랐어요…', '그대로 굳어서… 할머니가 허수아비인 줄 아셨대요…'],
      replies: [
        { say: '허수아비 역 잘했네요', tier: 'great', face: 'laugh', answer: ['헤, 헤헤… 새가 한 마리도 안 왔대요…', '할머니가 감자 주셨어요… 허수아비 일당이래요…'] },
        { say: '시끄러운 벌레 싫죠', tier: 'good', face: 'think', answer: '네… 매미는 여름 내내 제 박자를 뺏어 가요… 메뚜기는 예고가 없고요…' },
        { say: '귀엽잖아요', tier: 'meh', face: 'sorry', answer: '귀, 귀여움보다 점프력이 무서워요…' },
      ],
    },
    {
      id: 'shop-voice',
      open: ['주점 일을 조금 돕고 있어요… 근데 "어서 오세요"를 못 해서…', '연습 중이에요… 어, 어서… 어…서… 아, 오늘도 실패예요…'],
      replies: [
        { say: '제가 손님 할게요', tier: 'great', remember: 'shop-voice', face: 'laugh', answer: ['소, 손님…! 그럼 문 열고 들어와 주세요… 다시요…', '…어서 오세요…! 아, 했어요…! {me} 씨라서 됐어요…'] },
        { say: '고개 숙여 인사만 해요', tier: 'good', face: 'smile', answer: '고, 고개라면… 자신 있어요… 저 고개는 엄청 잘 숙여요…' },
        { say: '마이크 대고 해 봐요', tier: 'meh', face: 'sorry', answer: '마, 마이크는… 노래할 때만 용기가 나요… 말은 무리예요…' },
      ],
    },
    {
      id: 'strings',
      open: ['장날에 마키마 씨 좌판에서… 기타 줄을 샀어요…', '하나만 사려 했는데… 웃으며 보시길래… 다섯 개 샀어요…'],
      replies: [
        { say: '평생 쓸 줄 생겼네요', tier: 'great', face: 'laugh', answer: '그, 그렇게 생각하면… 이득이에요…! 헤헤… 아마도요…' },
        { say: '다음엔 같이 가요', tier: 'good', face: 'shy', answer: '네… {me} 씨가 옆에 있으면 "하나만요"라고 할 수 있을지도…' },
        { say: '거절을 해야죠', tier: 'meh', face: 'sorry', answer: '거, 거절은… 대본이 세 장 필요해요… 그날은 못 썼어요…' },
      ],
    },
    {
      id: 'library',
      open: ['언덕 도서관이 좋아요… 조용히 해야 하는 곳이라서요…', '베아트리스 씨가 떠드는 사람을 내보내 주세요… 저한텐 천국이에요…'],
      replies: [
        { say: '시집 빌리러 같이 가요', tier: 'great', face: 'wow', answer: ['시, 시집…! 시집 칸 맨 구석 자리… 거기 제 지정석이에요…', '가사가 막히면 거기서 남의 쓸쓸함을 빌려 와요…'] },
        { say: '봇치 씨는 안 쫓겨나요?', tier: 'good', face: 'laugh', answer: '저, 저는 숨소리도 작아서… 베아트리스 씨가 제가 있는 줄 몰라요…' },
        { say: '시끄러운 데도 가 봐요', tier: 'meh', face: 'sorry', answer: '시, 시끄러운 데는… 주점 무대 하나로 충분해요…' },
      ],
    },
    {
      id: 'interview',
      open: ['잔나 기자님이 인터뷰하고 싶대요… 신문에 실린대요…', '그래서 박스 안에서 했어요… 구멍으로 쪽지를 주고받았어요…'],
      replies: [
        { say: '역사적인 인터뷰네요', tier: 'great', face: 'laugh', answer: ['기, 기사 제목이… "박스 속 악사"래요…', '…조금 마음에 들어요… 이건 비밀이에요…'] },
        { say: '무슨 질문 받았어요?', tier: 'good', face: 'think', answer: '"꿈이 뭐예요"였어요… 쪽지에 "무대"라고만 썼어요… 크게요…' },
        { say: '얼굴 보고 했어야죠', tier: 'meh', face: 'sorry', answer: '어, 얼굴을 보면 대답이 전부 "네"가 돼요…' },
      ],
    },
    {
      id: 'mc',
      open: ['고, 공연 중간에 하는 말이요… 멘트… 그게 제일 어려워요…', '지난번엔 "어… 네…" 하고 바로 다음 곡으로 넘어갔어요…'],
      replies: [
        { say: '같이 멘트 써 봐요', tier: 'great', remember: 'mc-script', face: 'wow', answer: ['가, 같이요…! 그럼 첫 줄은… "안녕하세요"부터…', '…거기까지 쓰는 데 한 시간 걸려요… 그래도 해 봐요…'] },
        { say: '말 대신 한 곡 더 해요', tier: 'good', face: 'laugh', answer: '그, 그거 좋네요…! 멘트 없는 악사… 그게 저예요…' },
        { say: '그냥 아무 말이나 해요', tier: 'meh', face: 'sorry', answer: '아, 아무 말이 제일 어려워요… 아무 말이 뭔지 몰라요…' },
      ],
    },
    {
      id: 'fan-letter',
      open: ['게, 게시판에 쪽지가 붙어 있었어요… "봇치 씨 노래 좋아요"…', '이름이 없어요… 매일 밤 다시 읽어요… 벌써 백 번째예요…'],
      replies: [
        { say: '진짜 팬이 생겼네요', tier: 'great', remember: 'fan-letter', face: 'shy', answer: ['패, 팬…! 아, 단어만으로 녹아요…', '…답장은 어디에 붙이면 될까요… 같은 자리에요…?'] },
        { say: '누군지 궁금하지 않아요?', tier: 'good', remember: 'fan-letter', face: 'think', answer: '구, 궁금한데… 알면 그 사람 앞에서 굳어요… 모르는 게 나아요…' },
        { say: '장난일 수도 있어요', tier: 'meh', face: 'sorry', answer: '그, 그 생각은 백한 번째 읽을 때 할게요… 오늘은 믿을래요…' },
      ],
    },
    {
      id: 'bangs',
      open: ['그웬 원장님이 앞머리 자르자고 하셨어요… 눈이 보이게요…', '근데 앞머리는… 제 커튼이에요… 없으면 세상이 너무 밝아요…'],
      replies: [
        { say: '커튼 그대로 둬요', tier: 'great', remember: 'bangs', face: 'smile', answer: '그, 그쵸…! {me} 씨는 알아주실 줄 알았어요… 커튼 지킬게요…' },
        { say: '살짝만 다듬어요', tier: 'good', remember: 'bangs', face: 'think', answer: '사, 살짝만이면… 눈썹까지는… 같이 가 주시면요…' },
        { say: '눈 보고 싶은데요', tier: 'meh', face: 'shy', answer: '누, 눈이요…? 그, 그건 언젠가… 무대 조명 없을 때요…' },
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
    {
      id: 'village-band',
      when: { ch: 4 },
      open: ['저, 저기… 마을에서 밴드를 하면 어떨까… 상상해 봤어요…', '드럼은 오른 씨 망치, 박수는 미쿠 씨, 조는 담당은 프리렌 씨…'],
      replies: [
        { say: '저는 뭐 맡아요?', tier: 'great', remember: 'village-band', face: 'laugh', answer: ['{me} 씨는… 맨 앞자리 담당이요…', '…아, 그건 멤버가 아니라 관객이네요… 그럼 둘 다요…'] },
        { say: '진짜 해 봐요', tier: 'good', remember: 'village-band', face: 'wow', answer: '지, 진짜로요…? 모집 쪽지… 이번엔 끝까지 써 볼게요…' },
        { say: '상상으로 충분해요', tier: 'meh', face: 'sorry', answer: '그, 그쵸… 상상 속 밴드는 싸우지도 않고요…' },
      ],
    },
    {
      id: 'couple-song',
      when: { love: 'dating' },
      open: ['저, 저기… 둘이 같이 부를 노래를… 만들어 봤어요…', '{me} 씨 파트는 쉬워요… 박수만 쳐도 돼요… 헤헤…'],
      replies: [
        { say: '노래도 할게요', tier: 'great', remember: 'couple-song', face: 'shy', answer: ['가, 같이 노래…! 그럼 가사를 한 줄 더 쓸게요…', '…둘이 부르는 노래는 처음이에요… 밴드 시절 빼고요…'] },
        { say: '박수 연습할게요', tier: 'good', remember: 'couple-song', face: 'laugh', answer: '헤헤… 박수 박자가 맞으면… 그것만으로 합주예요…' },
        { say: '부끄러워요', tier: 'meh', face: 'shy', answer: '저, 저도요… 그럼 둘 다 벽 보고 불러요…' },
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
      id: 'op-day-sunny',
      when: { time: 'day', weather: 'sunny' },
      open: ['하, 한낮에 맑은 날이에요… 분홍 운동복이 너무 눈에 띄어요…', '그래서 그림자에서 그림자로 뛰어다니는 중이에요…'],
      replies: [
        { say: '그림자 길 같이 가요', tier: 'great', face: 'laugh', answer: '그, 그림자 길 지도도 있어요…! 시장까지 그늘로만 가는 길이요…' },
        { say: '모자 빌려줄게요', tier: 'good', face: 'shy', answer: '모, 모자…! 챙이 넓으면 세상이 반만 보여요… 최고예요…' },
        { say: '햇볕 좀 쬐요', tier: 'meh', face: 'sorry', answer: '햇볕 받으면 저 증발해요… 진짜예요… 반쯤은요…' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: ['흐, 흐린 날이에요… 저 같은 날씨라서… 마음이 편해요…', '햇빛도 사람도 적당히 적어서… 벤치 끝자리도 비었어요…'],
      replies: [
        { say: '그 자리 같이 앉아요', tier: 'great', face: 'shy', answer: '가, 같이…! 오늘은 반대쪽 끝 말고… 한 칸만 가까이요…' },
        { say: '비 오기 전에 들어가요', tier: 'good', face: 'smile', answer: '네… 기타가 젖으면 안 되니까요… 걱정해 주셔서 기뻐요…' },
        { say: '맑은 날이 좋은데요', tier: 'meh', face: 'calm', answer: '그, 그럼 {me} 씨가 햇빛 하세요… 저는 그늘 할게요…' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: ['보, 봄이에요… 시장 게시판에 모집 쪽지가 잔뜩 붙었어요…', '저도 써 봤는데… "기타 있어요" 한 줄 쓰고 떼어 왔어요…'],
      replies: [
        { say: '제가 첫 멤버 할게요', tier: 'great', face: 'wow', answer: ['처, 첫 멤버…! 악기는 몰라도 돼요…', '박수 담당이에요… 제일 중요한 자리예요… 진짜로요…'] },
        { say: '다음엔 끝까지 써요', tier: 'good', face: 'think', answer: '네… 두 줄까지는 써 볼게요… "구석 좋아해요"까지요…' },
        { say: '혼자가 편하잖아요', tier: 'meh', face: 'sorry', answer: '그, 그렇긴 한데… 봄에는 조금 외로워져요…' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: ['매, 매미 소리가… 제 기타보다 커요… 여름은 이겨 본 적이 없어요…', '그래서 낮엔 창고에서 매미가 쉬는 틈만 기다려요…'],
      replies: [
        { say: '매미랑 합주해 봐요', tier: 'great', face: 'laugh', answer: '하, 합주…! 매미가 주인공이고 저는 반주요… 못 이기면 같이요…' },
        { say: '시원한 데 가요', tier: 'good', face: 'smile', answer: '하, 항구 창고 뒤 그늘이요… 바닷바람이 줄을 식혀 줘요…' },
        { say: '여름 좋잖아요', tier: 'meh', face: 'sorry', answer: '여름은 사람도 매미도 다 밖에 나와서요… 저만 들어가요…' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn', time: ['day', 'evening'] },
      open: ['가, 가을이에요… 낙엽 밟는 소리가 꼭 작은 박수 같아요…', '이런 날엔 가사가… 너무 쓸쓸하게 나와요… 그게 좋아요…'],
      replies: [
        { say: '그 가사 들려줘요', tier: 'great', face: 'shy', answer: '"구석에도 노을은 온다"… 여, 여기까지예요… 부끄러워요…' },
        { say: '같이 낙엽 밟아요', tier: 'good', face: 'laugh', answer: '네… 박자 맞춰서요… 하나, 둘… 아, 틀렸어요… 헤헤…' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter' },
      open: ['겨, 겨울이에요… 손난로를 두 개 들고 다녀요… 하나는 기타 손 거예요…', '사람들이 집에 있어서 길이 넓어요… 겨울이 제일 걷기 좋아요…'],
      replies: [
        { say: '손난로 하나 더 줄게요', tier: 'great', face: 'shy', answer: '세, 세 개…! 그럼 하나는 마음에 넣을게요… 아, 이상한 말 했어요…' },
        { say: '눈사람 같이 만들어요', tier: 'good', face: 'smile', answer: '누, 눈사람은 말을 안 걸어서 좋아요… 관객으로 세워 둘게요…' },
        { say: '겨울은 춥기만 해요', tier: 'meh', face: 'calm', answer: '그, 그래도 주점 난로 옆 무대는 따뜻해요… 놀러 오세요…' },
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
      id: 'op-bday',
      when: { bday: true },
      open: ['새, 생일이시죠…! 저, 저기… 축하곡이요… 지금 칠게요…', '노래는 못 하니까… 기타로만요… 마음은 가사까지 있어요…'],
      replies: [
        { say: '그 연주가 선물이에요', tier: 'great', face: 'shy', answer: ['서, 선물…! 그럼 앙코르도 할게요… 생일 앙코르요…', '…{me} 씨, 생일 축하해요… 아, 말로도 했어요…!'] },
        { say: '같이 케이크 먹어요', tier: 'good', face: 'laugh', answer: '케이크는 소리가 안 나서 좋아요… 초는 제가 불어도… 아, 안 되죠…' },
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
      id: 'op-bigfish',
      when: { bigFish: true },
      open: ['그, 그 큰 물고기… {me} 씨가 잡으셨어요…? 대, 대단해요…', '저 같으면 끌려 들어가서… 바다에서 살았을 거예요…'],
      replies: [
        { say: '기념으로 한 곡 해 줘요', tier: 'great', face: 'laugh', answer: '기, 기념곡…! 낚싯줄 감는 소리로 시작할게요… 끼리릭…' },
        { say: '봇치 씨도 낚시해요', tier: 'good', face: 'think', answer: '조, 조용히 앉아 있는 건 자신 있어요… 잡는 건 자신 없어요…' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일 하셨어요…? 괭이 소리가 일정해서… 박자 맞추는 기계 같았어요…',
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
        { say: '무대 장식으로 쓸래요?', tier: 'great', face: 'wow', answer: '자, 장식…? 그럼 관객이 저 말고 작물을 볼 테니… 딱이에요…' },
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
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: ['마, 마을에 결혼식이 있대요… 축가 부탁이 저한테 올까 봐…', '아침부터 박스 안에서 대기 중이에요… 숨는 대기요…'],
      replies: [
        { say: '봇치 씨 축가면 최고죠', tier: 'great', face: 'wow', answer: '최, 최고…! 그럼 신랑 신부 말고 하객 뒤통수 보고 칠게요…' },
        { say: '숨는 거 도와줄게요', tier: 'good', face: 'laugh', answer: '고, 고마워요… 근데 사실 조금은 불러 주길 바라요… 조금만요…' },
        { say: '부탁 안 올 거예요', tier: 'meh', face: 'sorry', answer: '그, 그렇죠… 다행이에요… 근데 왜 서운하죠…' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: ['전, 전설의 물고기가 잡혔대요…! 광장이 들썩여요…', '저는 들썩임이 무서워서… 항구 끝에서 노래만 만들었어요…'],
      replies: [
        { say: '전설의 노래네요', tier: 'great', face: 'wow', answer: '네…! 제목은 "바다가 아쉬운 날"이에요… 물고기 입장에서 썼어요…' },
        { say: '같이 구경 가요', tier: 'good', face: 'shy', answer: '사, 사람이 빠질 때 가요… 해 질 무렵이면 좀 줄 거예요…' },
      ],
    },
    {
      id: 'op-friend-bday',
      when: { friendNews: 'birthday' },
      open: ['마, 마을 소식에 생일인 분이 있대요… 축하하고 싶은데…', '말로 하면 더듬으니까… 집 앞에서 몰래 한 곡 치고 올까 봐요…'],
      replies: [
        { say: '몰래 축하 좋네요', tier: 'great', face: 'wow', answer: '그, 그쵸…! 들키기 전에 도망칠게요… 그게 제 방식이에요…' },
        { say: '같이 가서 말로 해요', tier: 'good', face: 'shy', answer: '{me} 씨가 말하시면… 저는 뒤에서 반주할게요…' },
      ],
    },
    {
      id: 'op-casino',
      when: { recent: 'casinoWin' },
      open: ['카, 카지노에서 이기셨다면서요…? 미쿠 씨가 박수를 엄청 치셨대요…', '그 박수… 제 공연 때랑 똑같은 크기예요… 놀라셨죠…?'],
      replies: [
        { say: '공연급 박수였어요', tier: 'great', face: 'shy', answer: '그, 그럼 제 공연이 대박급…? 아, 녹아요…' },
        { say: '운이 좋았어요', tier: 'good', face: 'smile', answer: '우, 운도 실력이에요… 제 첫 공연에 손님 온 것도 운이었어요…' },
      ],
    },
    {
      id: 'op-museum',
      when: { recent: 'museum' },
      open: ['바, 박물관 다녀오셨어요…? 거기 조용해서 좋죠…', '저는 화석 앞에 오래 서 있어요… 화석은 저를 안 보니까요…'],
      replies: [
        { say: '다음엔 같이 가요', tier: 'great', face: 'shy', answer: '네…! 박물관은 속삭여야 하니까… 더듬는 것도 안 들켜요…' },
        { say: '화석이 관객이네요', tier: 'good', face: 'laugh', answer: '네… 몇만 년째 조용한 관객이에요… 이상적이에요…' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: ['배, 배 타고 멀리 다녀오셨다면서요…? 바다 한가운데는 어땠어요…', '사람은 없고 파도만 있죠… 상상만 해도 가사가 써져요…'],
      replies: [
        { say: '같이 가고 싶었어요', tier: 'great', face: 'shy', answer: '저, 저랑요…? 그럼 기타는 방수 가방에 넣어 갈게요…' },
        { say: '배멀미 했어요', tier: 'good', face: 'sorry', answer: '저, 저도 상상만으로 멀미해요… 같이 누워 있어요…' },
      ],
    },
    {
      id: 'op-stock',
      when: { recent: 'stockDown' },
      open: ['주, 주식이 떨어졌다는 소문… 들었어요… 괜찮으세요…?', '저도 영상 계정 구독자가 줄면… 사흘은 박스에 있어요… 알아요…'],
      replies: [
        { say: '위로곡 쳐 줘요', tier: 'great', face: 'smile', answer: '네… 내려가는 곡 말고… 천천히 올라가는 곡으로요…' },
        { say: '괜찮아요, 또 올라요', tier: 'good', face: 'wow', answer: '{me} 씨는 강하네요… 그 말 공책에 적어 둘게요…' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: ['저, 저기… 오늘 {other} 씨랑 조금 어색해졌어요…', '제가 인사를 놓쳤어요… 그 뒤로 머릿속에서 계속 사과 중이에요…'],
      replies: [
        { say: '같이 사과하러 가요', tier: 'great', face: 'wow', answer: '가, 같이…! 그럼 사과 대본을 짧게 쓸게요… 한 줄로요…' },
        { say: '곡으로 사과해 봐요', tier: 'good', face: 'think', answer: '고, 곡이라면… 말보다 진심이 잘 전해질지도… 해 볼게요…' },
        { say: '별일 아니에요', tier: 'meh', face: 'sorry', answer: '그, 그런 걸까요… 그래도 밤에 이불 속에서 생각날 거예요…' },
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
    {
      id: 'op-with-captain',
      when: { with: 'captain' },
      open: ['아, {me} 씨… {other} 씨가 오늘 밤 두 곡 더 하래요…', '"관객이 원한다"래요… 그 관객이 사장님 혼자인데요…'],
      replies: [
        { say: '저도 관객 할게요', tier: 'great', face: 'wow', answer: '두, 두 명이면… 진짜 관객이에요…! 그럼 세 곡 할게요…' },
        { say: '사장님 좋은 분이네요', tier: 'good', face: 'smile', answer: '네… 웃음소리가 커서 무섭지만… 제 무대를 지켜 주는 분이에요…' },
      ],
    },
    {
      id: 'op-with-himmel',
      when: { with: 'himmel' },
      open: ['{me} 씨, 살려 주세요… {other} 씨가 지금 고백 연습 중이에요…', '상대가 저예요… 아, 저한테 고백하는 게 아니라… 연습이요…'],
      replies: [
        { say: '제가 상대 해 줄게요', tier: 'great', face: 'laugh', answer: '고, 고마워요…! 저는 옆에서 배경 음악 칠게요… 그게 제 자리예요…' },
        { say: '같이 들어 줄게요', tier: 'good', face: 'shy', answer: '두, 둘이면 덜 쓰러져요… 상담단 재결성이에요…' },
        { say: '둘이 계속해요', tier: 'meh', face: 'sorry', answer: '그, 그럼 저 쓰러져요… 받아 주실 분이 없어요…' },
      ],
    },
    {
      id: 'op-with-frieren',
      when: { with: 'frieren' },
      open: ['쉬, 쉿… {other} 씨가 제 연습 듣다가 또 잠드셨어요…', '깨우면 안 될 것 같아서… 자장가로 바꿔서 치는 중이에요…'],
      replies: [
        { say: '자장가 실력 최고예요', tier: 'great', face: 'laugh', answer: '헤, 헤헤… 칭찬… 맞죠…? 그렇게 받을게요…' },
        { say: '담요 덮어 드릴게요', tier: 'good', face: 'smile', answer: '고, 고마워요… 빵 냄새가 나시네요… 가게에서 바로 오셨나 봐요…' },
      ],
    },
    {
      id: 'op-with-haku',
      when: { with: 'haku' },
      open: ['…(하쿠 옆에서 말없이 기타를 치고 있다)', '아, {me} 씨… {other} 씨는 말을 안 해도 돼서… 같이 있기 편해요…'],
      replies: [
        { say: '저도 조용히 들을게요', tier: 'great', face: 'smile', answer: '네… 셋이서 말없이… 이게 제가 꿈꾸던 합주예요…' },
        { say: '무슨 곡이에요?', tier: 'good', face: 'think', answer: '과, 과수원 바람 소리에 맞춘 곡이요… 제목은 아직이에요…' },
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
        { say: '영광이에요', tier: 'great', face: 'shy', answer: ['여, 영광은 제 쪽이에요…', '친구들이 놀랐대요… 제가 사람 얘기를 해서요…'] },
        { say: '돈은 돌려받았어요?', tier: 'good', face: 'laugh', answer: '아, 아니요… 대신 그림이 왔어요… 그걸로 됐어요…' },
      ],
    },
    {
      id: 'cb-drum',
      when: { mem: 'drum-letter' },
      use: 'drum-letter',
      open: ['드럼 치던 선배한테 답장이 왔어요… {me} 씨 얘기를 썼더니…', '"너한테 그런 사람이 생겨서 다행이다"래요… 저, 울었어요…'],
      replies: [
        { say: '저도 다행이에요', tier: 'great', face: 'shy', answer: ['{me} 씨까지…! 오늘은 눈물이 두 번이에요…', '…선배한테 또 쓸게요… 오늘 일도요…'] },
        { say: '선배께 안부 전해 줘요', tier: 'good', face: 'smile', answer: '네…! 선배는 분명 "우리 봇치 잘 부탁해요"라고 쓰실 거예요…' },
      ],
    },
    {
      id: 'cb-bass',
      when: { mem: 'bass-letter' },
      use: 'bass-letter',
      open: ['베이스 선배가 그림을 또 보냈어요… 이번엔 사람이 둘이에요…', '하나는 저고… 하나는 모르는 사람인데… 왠지 {me} 씨 같아요…'],
      replies: [
        { say: '저 맞아요, 분명히', tier: 'great', face: 'laugh', answer: '헤, 헤헤… 선배는 말을 안 해도 다 아세요… 무서운 분이에요…' },
        { say: '액자에 넣어요', tier: 'good', face: 'smile', answer: '네… 박스 안쪽 벽에 걸게요… 제 전시실이에요…' },
      ],
    },
    {
      id: 'cb-vocal',
      when: { mem: 'vocal-letter' },
      use: 'vocal-letter',
      open: ['노래하던 친구가 코드 그림 보고… 첫 곡을 끝까지 쳤대요…!', '"선생님 덕분"이래요… {me} 씨가 한 말이 거기까지 갔나 봐요…'],
      replies: [
        { say: '봇치 선생님, 축하해요', tier: 'great', face: 'shy', answer: '서, 선생님 두 번이면… 저 완전히 액체예요…' },
        { say: '다음 곡도 가르쳐요', tier: 'good', face: 'smile', answer: '네… 이번엔 둘이 같이 치는 곡으로요… 멀리 있어도 합주예요…' },
      ],
    },
    {
      id: 'cb-first-live',
      when: { mem: 'first-live' },
      use: 'first-live',
      open: ['처, 첫 공연 얘기 들어 주셨잖아요… 어젯밤 그 꿈을 또 꿨어요…', '근데 이번엔… 신발 말고 객석을 봤어요… {me} 씨가 있었어요…'],
      replies: [
        { say: '꿈에서도 갈게요', tier: 'great', face: 'shy', answer: '꾸, 꿈에서도…! 그럼 매일 밤 공연이에요… 잠이 기다려져요…' },
        { say: '많이 컸네요, 봇치 씨', tier: 'good', face: 'laugh', answer: '커, 컸다… 키 말고 마음이요… 헤헤…' },
        { say: '그냥 꿈이잖아요', tier: 'meh', face: 'sorry', answer: '네… 그래도 꿈속 저는 좀 멋있었어요…' },
      ],
    },
    {
      id: 'cb-sign',
      when: { mem: 'sign-practice' },
      use: 'sign-practice',
      open: ['전에 첫 사인 받겠다고 하셨죠…? 그 뒤로 매일 연습했어요…', '이, 이거요… {me} 씨 이름 옆에 그렸어요… 아직 유명하진 않지만…'],
      replies: [
        { say: '평생 간직할게요', tier: 'great', face: 'shy', answer: ['펴, 평생…! 그럼 저도 유명해져야겠네요…', '그 사인 값 올려 드리려고요… 아, 녹기 전에 갈게요…'] },
        { say: '날짜도 써 줘요', tier: 'good', face: 'smile', answer: '나, 날짜…! "첫 사인 날"이라고 쓸게요… 둘만 아는 기념일이에요…' },
      ],
    },
    {
      id: 'cb-replay',
      when: { mem: 'replay' },
      use: 'replay',
      open: ['저, 저번에 "수고하세요" 얘기 들어 주셨잖아요…', '그 상인한테 다시 갔어요… 이번엔 "감사합니다" 했어요…!'],
      replies: [
        { say: '멋진 설욕이에요', tier: 'great', face: 'laugh', answer: '서, 설욕…! 근데 상인은 저를 기억 못 하셨어요… 저 혼자 싸웠어요…' },
        { say: '다음엔 날씨 얘기도 해요', tier: 'good', face: 'think', answer: '나, 날씨…? 그건 고급 기술이에요… 내년 목표예요…' },
      ],
    },
    {
      id: 'cb-guitar',
      when: { mem: 'guitar-story' },
      use: 'guitar-story',
      open: ['아버지께 편지 썼어요… "기타 조금만 더 빌릴게요"라고요…', '답장이 왔는데… "이제 네 거다"래요… 저, 기타 안고 잤어요…'],
      replies: [
        { say: '진짜 봇치 씨 기타네요', tier: 'great', face: 'shy', answer: '네…! 이제 진짜 제 소리예요… 첫 곡은 {me} 씨한테 들려줄게요…' },
        { say: '아버님 멋지시네요', tier: 'good', face: 'smile', answer: '네… 말수 적은 것도 닮았어요… 편지는 짧은데 따뜻해요…' },
      ],
    },
    {
      id: 'cb-wood',
      when: { mem: 'wood-dream' },
      use: 'wood-dream',
      open: ['단, 단단한 나무 얘기요… 가구점 문 손잡이를 잡았어요…!', '발키리 씨가 기타 목엔 단풍나무가 좋다고 알려 주셨어요…'],
      replies: [
        { say: '대단한 한 걸음이에요', tier: 'great', face: 'wow', answer: '하, 한 걸음…! 아직 문 안엔 못 들어갔지만요… 다음엔 들어갈게요…' },
        { say: '같이 나무 고르러 가요', tier: 'good', face: 'shy', answer: '네…! {me} 씨가 고르고 제가 두드려 볼게요… 소리로 골라요…' },
      ],
    },
    {
      id: 'cb-shell',
      when: { mem: 'shell-ear' },
      use: 'shell-ear',
      open: ['같이 들었던 조개요… 그 소리로 곡을 하나 썼어요…', '처음은 파도 소리, 중간은 {me} 씨 웃음소리예요… 기억으로 쓴 거예요…'],
      replies: [
        { say: '듣고 싶어요', tier: 'great', face: 'shy', answer: '그, 그럼 조개를 귀에 대고 들어 주세요… 그게 공연장이에요…' },
        { say: '제 웃음소리를요?', tier: 'good', face: 'laugh', answer: '네… 박자가 좋아요… 아, 이상한 칭찬이에요…' },
      ],
    },
    {
      id: 'cb-mc',
      when: { mem: 'mc-script' },
      use: 'mc-script',
      open: ['가, 같이 쓴 멘트… 어제 무대에서 했어요…!', '"안녕하세요, 봇치입니다"까지요… 그다음은 기억이 안 나요…'],
      replies: [
        { say: '그게 제일 어려운 거예요', tier: 'great', face: 'wow', answer: ['그, 그쵸…! 첫 줄이 산이었어요…', '…다음 줄도 같이 써 주세요… 이번엔 두 줄이요…'] },
        { say: '박수 나왔어요?', tier: 'good', face: 'laugh', answer: '샹, 샹크스 사장님이요… 혼자서 세 명분 쳐 주셨어요…' },
      ],
    },
    {
      id: 'cb-fan',
      when: { mem: 'fan-letter' },
      use: 'fan-letter',
      open: ['그 이름 없는 팬레터… 두 번째가 왔어요…', '이번엔 "구석 자리에서 듣고 있어요"래요… 구석파 동지예요…'],
      replies: [
        { say: '노래가 닿은 거예요', tier: 'great', face: 'shy', answer: ['다, 닿았다…! 구석에서 구석으로요…', '…다음 공연 땐 구석 쪽으로 한 곡 칠게요… 작게요…'] },
        { say: '답장 붙였어요?', tier: 'good', face: 'think', answer: '부, 붙였어요… "고마워요" 한 줄이요… 사흘 걸렸어요…' },
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
        '허풍 주점 뒤뜰, 빈 술통 옆에 커다란 박스가 하나 놓여 있다.',
        '박스가 조금씩 흔들린다. 안에서 작은 기타 소리가 새어 나온다.',
        '몇 마디 치다 멈추고, 같은 마디를 다시 친다. 몇 번이고.',
        '"…아, 또 여기서 막혔다… 끝을 모르겠어…" 안에서 중얼거린다.',
        '똑똑, 박스를 두드리자 소리가 뚝 멈춘다.',
        '한참 뒤, 덮개가 손가락 하나만큼 열리고 분홍 머리가 반쯤 나온다.',
        '"아, 저, 저는… 봇치라고 해요… 떠돌이 악사… 라고 하기엔…"',
        '그녀의 눈이 내 얼굴과 내 신발 사이를 바쁘게 오간다.',
        '"방, 방금 그 소리… 들으셨어요…? 아직 제목도 끝도 없는 곡이라…"',
        '"잊어 주세요… 제발요… 아, 아니, 조금은 기억하셔도…"',
      ],
      replies: [
        { say: '좋은 소리였어요', tier: 'great', remember: 'praise-melt', face: 'shy', answer: ['조, 좋은…! 첫 만남에 칭찬이라니…', '녹아요… 흐물… 박스 안이라 다행이에요…'] },
        { say: '못 잊을 것 같은데요', tier: 'good', face: 'wow', answer: '그, 그럼… 기억하셔도 돼요… 대신 다른 사람한텐 비밀로…' },
        { say: '거기서 뭐 해요?', tier: 'meh', remember: 'box-ok', face: 'sorry', answer: '사, 살고 있어요… 아니, 연습이요… 반쯤 살아요…' },
      ],
    },
    {
      title: '빈 무대',
      hint: '밤(게임 시각 저녁 아홉 시부터 자정) 허풍 주점에 가 보세요. 손님이 다 가면 봇치가 무대에 서요.',
      need: { days: 3, points: 20, visit: { area: 'tavern', from: 21, to: 24 } },
      scene: [
        '밤이 깊은 허풍 주점. 마지막 손님이 노래를 흥얼대며 나간다.',
        '샹크스 사장님이 의자를 테이블 위에 올리며 무대 쪽을 턱짓한다.',
        '무대 위, 봇치가 검은 기타를 끌어안고 나를 본다.',
        '"오, 오셨어요… 사람 없는 무대가 제일 좋아서요… 관객은 한 분만…"',
        '"사, 사장님은 주방에 계시니까… 관객으로 안 쳐요…"',
        '그녀가 숨을 한 번 들이쉬고, 줄을 튕긴다.',
        '첫 음이 울리는 순간 표정이 바뀐다. 더듬던 사람이 사라진다.',
        '빈 의자들 사이로 소리가 꽉 찬다. 주방의 그릇 소리도 멎었다.',
        '박스 안에서 흘러나오던 그 곡이다. 오늘은 조금 더 멀리 간다.',
        '그리고 같은 마디에서 멈춘다. 아직 끝이 없다.',
        '마지막 음이 사라지자, 봇치가 다시 작아진다.',
        '"…어, 어땠어요…? 아니, 대답은… 천천히 해 주셔도…"',
      ],
      replies: [
        { say: '딴사람 같았어요', tier: 'great', remember: 'empty-stage', face: 'shy', answer: ['기, 기타 잡으면 그래요…', '근데 지금 이 사람도 저예요… 이쪽도 잘 부탁해요… 헤헤…'] },
        { say: '앙코르!', tier: 'good', remember: 'empty-stage', face: 'wow', answer: ['앙, 앙코르…! 처음 들어 봐요…', '주방에서 사장님 웃음소리가… 아, 한 곡 더 할게요…!'] },
        { say: '졸려요…', tier: 'meh', remember: 'empty-stage', face: 'sorry', answer: '프, 프리렌 씨처럼요…? 자장가 재능이 있나 봐요…' },
      ],
    },
    {
      title: '조용한 간식',
      hint: '봇치는 소리 안 나는 간식을 좋아해요. 군밤을 가지고 가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'roastchestnut', take: true } },
      scene: [
        '언덕 공원 벤치 끝자리. 봇치가 가사 공책을 펴 놓고 굳어 있다.',
        '군밤 봉지를 내밀자, 공책 너머로 눈만 빼꼼 나온다.',
        '"구, 군밤…! 바스락 소리가 작아서… 몰래 먹기 좋은 간식이에요…"',
        '그녀가 껍질을 조심조심 깐다. 아주 작은 소리만 난다.',
        '"옛날 밴드 할 때요… 선배들은 다 같이 떠들면서 먹었어요…"',
        '"저는 늘 구석에서 혼자 먹었어요… 누가 보면 목에 걸려서요…"',
        '"그래도… 떠드는 소리가 들리는 그 구석이 좋았어요…"',
        '그녀가 군밤 하나를 반으로 쪼개 내 쪽으로 내민다.',
        '"근데 지금은… 안 걸려요. 이상하네요…"',
        '봇치가 공책에 무언가를 적는다. 그 곡에 처음 붙는 가사다.',
        '"…같이 먹는 군밤은 따뜻하다… 아, 보, 보면 안 돼요…!"',
      ],
      replies: [
        { say: '같이 먹으니 맛있네요', tier: 'great', remember: 'chestnut-gift', face: 'shy', answer: ['네… 같이 먹는 군밤이 더 따뜻해요… 처음 알았어요…', '이 줄은… 안 지울 거예요… 절대로요…'] },
        { say: '내가 까 줄게요', tier: 'good', remember: 'chestnut-gift', face: 'wow', answer: '저, 정말요…? 그럼 저는 노래로 갚을게요… 군밤의 노래요…' },
        { say: '남아서 가져왔어요', tier: 'meh', remember: 'chestnut-gift', face: 'smile', answer: '그, 그래도 저한테 와 주셨잖아요… 그게 기뻐요…' },
      ],
    },
    {
      title: '맨 앞자리',
      hint: '봇치의 공연을 꼭 보러 가겠다고 약속하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'show-promise' },
      scene: [
        '금요일 저녁, 허풍 주점이 사람들로 꽉 찼다.',
        '힘멜이 맨 뒤에서 손을 흔들고, 프리렌은 벌써 눈을 감고 있다.',
        '무대 옆 커튼 뒤, 봇치가 편지 석 장을 쥐고 떨고 있다.',
        '"오, 옛날 밴드 친구들 편지예요… 공연 전에 읽으려고 아껴 뒀어요…"',
        '"드럼 선배는 웃으래요… 베이스 선배는 틀려도 크게 치래요…"',
        '"노래하던 친구는… 맨 앞자리 한 사람만 보래요… 그게 비결이래요…"',
        '조명이 켜지자, 그녀가 맨 앞자리의 나를 찾는다.',
        '눈이 마주친 순간 기타 소리가 객석을 뒤흔든다.',
        '첫 줄을 틀렸는데도 멈추지 않는다. 오히려 더 크게 친다.',
        '샹크스의 웃음이 박자처럼 터지고, 프리렌이 눈을 뜬다.',
        '공연이 끝나고 무대 뒤, 봇치가 박스 위에 털썩 앉는다.',
        '"저, 저… 오늘 벽 안 봤어요… {me} 씨만 보고 쳤어요…"',
      ],
      replies: [
        { say: '다 보였어요. 멋졌어요', tier: 'great', remember: 'stage-eyes', face: 'shy', answer: ['머, 멋졌…! 녹아요… 오늘은 진짜 다 녹아요…', '받아 주세요… 아니, 그냥 옆에 있어 주세요…'] },
        { say: '프리렌 씨도 안 졸았어요', tier: 'good', remember: 'stage-eyes', face: 'wow', answer: '지, 진짜요…? 역사적인 밤이에요… 선배들한테 편지 쓸게요…' },
        { say: '눈이 좀 무서웠어요', tier: 'meh', remember: 'stage-eyes', face: 'sorry', answer: '죄, 죄송해요… 너무 집중해서… 다음엔 웃으면서 볼게요…' },
      ],
    },
    {
      title: '제목 없는 곡',
      hint: '봇치와 아주 가까워지면 그녀가 새 곡을 들려줘요. 그 뒤엔 꽃다발도 받을지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '해 질 무렵 언덕 공원. 봇치가 벤치 끝이 아니라 가운데에 앉아 있다.',
        '"가, 가운데 앉아 봤어요… 다들 보는 자리라… 다리가 떨려요…"',
        '그녀가 무릎 위에 손때 묻은 가사 공책을 올려놓는다.',
        '"박스 안에서 치던 곡, 기억하세요…? 이제 끝이 생겼어요…"',
        '"빈 무대, 군밤, 맨 앞자리… 전부 이 안에 들어 있어요…"',
        '조용한 곡이 시작된다. 박스 속 소리가 아니라, 밖으로 나가는 소리.',
        '늘 막히던 그 마디를, 오늘은 그냥 지나간다.',
        '지나가던 츠나데 할머니가 걸음을 멈췄다가, 조용히 지나간다.',
        '곡이 끝나도 봇치는 고개를 들지 않는다.',
        '"이, 이 곡… 아직 제목이 없어요… {me} 씨 생각하면서 썼거든요…"',
        '"제, 제목을 말하려면… 용기가 조금 더 필요해요…"',
        '"혹시… 꽃 같은 걸 받으면… 그 용기가 생길지도… 아, 아니에요…!"',
        '그녀가 공책으로 얼굴을 가린다. 귀까지 빨갛다.',
      ],
      replies: [
        { say: '제목 기다릴게요', tier: 'great', face: 'shy', answer: ['네… 기다려 주시면… 꼭 말할게요… 무대에서요…', '그날은 박스를 창고에 두고 올게요… 약속이에요…'] },
        { say: '정말 좋은 곡이에요', tier: 'good', face: 'shy', answer: '조, 좋은…! 아, 녹지 말자… 오늘은 버틸 거예요…' },
        { say: '꽃이요?', tier: 'meh', face: 'sorry', answer: '모, 못 들은 걸로 해 주세요…! 박스 들어갈게요…' },
      ],
    },
    {
      title: '둘만의 앙코르',
      hint: '봇치와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '화요일 밤, 허풍 주점. 오늘 박스는 무대 옆이 아니라 창고에 있다.',
        '봇치가 마이크 앞에서 크게 숨을 들이쉰다. 손에는 편지 석 장.',
        '"오, 옛날 밴드 친구들이… 오늘 공연에 편지를 보내 줬어요…"',
        '"다들 똑같은 말을 썼어요… 새 밴드가 생겼네, 축하해…라고요…"',
        '"제, 제 새 밴드는… 관객 한 명이에요… 근데 그 한 명이…"',
        '그녀가 맨 앞자리를 본다. 이번엔 눈을 피하지 않는다.',
        '"이, 이번 곡 제목은… {me} 씨를 위한 노래예요…"',
        '객석이 술렁인다. 힘멜이 휘파람을 불고, 미쿠가 박수를 터뜨린다.',
        '봇치는 숨지 않고 끝까지 친다. 박스에서 시작된 그 곡을.',
        '앙코르가 끝나고, 그녀가 무대에서 내려와 내 소매를 살짝 잡는다.',
        '"바, 박스보다… {me} 씨 옆이 좋아요… 계속이요…"',
        '"반지 같은 거… 받으면 저 진짜 녹아 없어질지도 몰라요… 그래도요…"',
      ],
      replies: [
        { say: '계속 옆에 있을게요', tier: 'great', face: 'shy', answer: ['네…! 앙코르는 평생 할게요… {me} 씨한테만요…', '선배들한테 답장 쓸게요… 밴드 이름은… 둘이 정해요…'] },
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
    '오늘 얘기… 가사 공책에 몰래 적어 둘게요… 보, 보면 안 돼요…',
    '…(박스 덮개 틈으로 손만 내밀어 작게 흔든다)',
    '다음 공연 때… 맨 앞자리 비워 둘게요… 헤헤…',
  ],
};
