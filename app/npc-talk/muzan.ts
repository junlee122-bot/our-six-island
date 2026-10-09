// 무잔 — 범마을 증권 지점장. 흰 정장·흰 중절모·검은 망토. 정중한 존댓말에
// 계산과 은근한 자부심이 묻어난다("변동성은 아름답지요", "나이는 영업 비밀").
// 무엇이든 투자로 값을 매기고, 햇볕을 피해 차양 밑에 서며, 변하지 않는 것(금·보석),
// 붉은 동백, 오래 사는 영지를 좋아한다. 해바라기·흔한 돌·달팽이는 질색.
// 섬뜩함은 서늘한 말투와 값을 매기는 눈빛뿐. 위협·해침·원작 대사는 없다.
// 이야기가 흐를수록 플레이어를 "팔지 않을 단 하나의 자산"으로 여기게 된다.
import type { NpcTalkBook } from './types.ts';

export const MUZAN_TALK: NpcTalkBook = {
  npc: 'muzan',
  memories: {
    'split-bet': '예금과 투자를 나눠 담겠다고 했어요',
    'shade-friend': '차양 밑 그늘이 좋다고 했어요',
    'gold-mind': '변하지 않는 것이 좋다고 했어요',
    'blue-hunt': '푸른 동백을 같이 찾아보겠다고 했어요',
    'white-suit': '흰 정장이 제일 어울린다고 했어요',
    'cut-loss': '손절하고 차 한 잔 하는 법을 배웠어요',
    'pocket-watch': '회중시계 태엽 감는 걸 함께 봤어요',
    'camellia-talk': '겨울에도 지지 않는 동백 이야기를 들었어요',
    'priceless': '값을 매길 수 없는 사람이 되겠다고 했어요',
    'unsold': '팔지 않을 자산이 생겼다는 말을 들었어요',
    'lantern-walk': '등불 아래 시장 거리를 함께 걸었어요',
    'red-camellia': '붉은 동백꽃 한 송이를 건넸어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 다닌 날을 이야기했어요',
    'bday-plan': '생일 이야기를 나눴어요',
    'record-night': '오래된 음반이 좋다고 했어요',
    'moon-friend': '변해도 돌아오는 달이 좋다고 했어요',
    'koi-pond': '객장 연못 잉어들 이름을 들었어요',
    'winter-pick': '해가 짧은 겨울을 좋아한다고 했어요',
    parasol: '양산이 흰 정장과 잘 어울린다고 했어요',
    saffron: '사프란 밥을 지어 오겠다고 했어요',
    flawless: '흠 없는 장부는 없다고 말했어요',
    'date-talk': '내 방에서 보낸 저녁 이야기를 했어요',
  },
  talks: [
    {
      id: 'deposit-or-invest',
      open: '{me}, 하나 여쭙지요. 예금입니까, 투자입니까? 대답이 곧 성향입니다.',
      replies: [
        { say: '나눠 담을게요. 반반', tier: 'great', remember: 'split-bet', answer: '훌륭하군요. 분산은 겁이 아니라 품위입니다. 평가를 올려 두지요.' },
        { say: '전부 투자요!', tier: 'good', face: 'think', answer: '용기는 높이 삽니다. 다만 용기에도 손절선은 그어 두시지요.' },
        { say: '저금통이면 충분해요', tier: 'meh', face: 'calm', answer: '나모 씨가 좋아하겠군요. 저는… 조용히 수수료를 아끼겠습니다.' },
      ],
    },
    {
      id: 'sun-or-shade',
      open: '해가 쨍하군요. {me}, 당신은 볕이 좋습니까, 그늘이 좋습니까?',
      replies: [
        { say: '차양 밑 그늘이요', tier: 'great', remember: 'shade-friend', answer: '역시 안목이 있으시군요. 그늘에선 판단이 식지 않습니다.' },
        { say: '적당히 둘 다요', tier: 'good', answer: '균형이군요. 저는 균형을 신뢰합니다. 볕만 빼면 말이지요.' },
        { say: '볕이 최고죠!', tier: 'meh', face: 'calm', answer: '…메르시 선생님과 말이 잘 통하시겠군요. 저는 이쪽에 있겠습니다.' },
      ],
    },
    {
      id: 'age-secret',
      open: '다들 제 나이를 궁금해하더군요. {me}, 당신도 짐작하는 숫자가 있습니까?',
      replies: [
        { say: '영업 비밀이라 안 물을게요', tier: 'great', face: 'smile', answer: '현명하군요. 묻지 않는 손님에게 제일 좋은 차를 내지요.' },
        { say: '서른 즈음이요?', tier: 'good', face: 'shy', answer: '…후한 호가군요. 정정하지 않겠습니다. 그대로 체결하지요.' },
        { say: '폭락장 몇 번 보셨어요?', tier: 'meh', face: 'think', answer: '손가락으로는 모자랍니다. 그 이상은 장부에도 없습니다.' },
      ],
    },
    {
      id: 'unchanging',
      open: '금, 보석, 오래 사는 영지. 저는 값이 변하지 않는 것을 사랑합니다.',
      replies: [
        { say: '저도 변하지 않는 게 좋아요', tier: 'great', remember: 'gold-mind', answer: '드문 취향입니다. 대개는 반짝이는 새것만 쫓지요. 기억해 두겠습니다.' },
        { say: '변하는 것도 재밌지 않아요?', tier: 'good', face: 'think', answer: '변동성은 아름답지요. 남의 것일 때는요. 제 금고 안은 고요해야 합니다.' },
        { say: '해바라기는요?', tier: 'meh', face: 'sorry', answer: '해를 따라 고개를 돌리는 꽃이지요. 지조가 없습니다. 실례지만 사양입니다.' },
      ],
    },
    {
      id: 'blue-camellia',
      open: '어딘가 푸른 동백이 핀다는 소문이 있습니다. 혹시 들어 보셨습니까?',
      replies: [
        { say: '같이 찾아볼게요', tier: 'great', remember: 'blue-hunt', answer: ['…동업 제안이군요. 수익 배분은 나중에 정하지요.', '아니, 정하지 않아도 되겠습니다. 이상하군요.'] },
        { say: '그런 꽃이 정말 있어요?', tier: 'good', face: 'think', answer: '소문만 있는 종목이 가장 비싸지요. 저는 그 소문을 오래 들고 있습니다.' },
        { say: '빨간 게 더 예뻐요', tier: 'meh', face: 'calm', answer: '붉은 동백도 좋아합니다. 다만 그건 이미 가진 꽃이라서요.' },
      ],
    },
    {
      id: 'many-suits',
      open: '정장은 여러 벌입니다. 장터용, 상담용, 산책용. {me}, 어느 쪽이 낫습니까?',
      replies: [
        { say: '지금 흰 정장이 제일이에요', tier: 'great', remember: 'white-suit', face: 'shy', answer: '…다림질한 보람이 있군요. 오늘 주름은 차트에만 두겠습니다.' },
        { say: '망토가 멋져요', tier: 'good', face: 'laugh', answer: '바람막이입니다. 극적인 효과는 덤이고요. 덤도 수익이지요.' },
        { say: '다 똑같아 보여요', tier: 'meh', face: 'calm', answer: '하얀 것은 다 같아 보이지요. 실은 원단 시세가 전부 다릅니다.' },
      ],
    },
    {
      id: 'losing-day',
      open: '하한가를 맞은 날, {me}, 당신은 어떻게 하십니까? 궁금하군요.',
      replies: [
        { say: '손절하고 차 한 잔 마셔요', tier: 'great', remember: 'cut-loss', answer: '정답에 가깝군요. 숫자에 감정을 섞으면 비싸집니다. 차는 제가 내지요.' },
        { say: '버티면 오르겠죠', tier: 'good', face: 'think', answer: '버팀도 전략이지요. 근거가 있다면요. 희망은 근거가 아닙니다.' },
        { say: '울어요', tier: 'meh', face: 'sorry', answer: '…그런 손님께는 차를 드립니다. 위로는 차가 하지요. 저는 장부를 하고요.' },
      ],
    },
    {
      id: 'pocket-watch',
      open: '이 회중시계는 꽤 오래되었습니다. 태엽을 감는 시간이 하루의 쉼이지요.',
      replies: [
        { say: '감는 거 보여 주세요', tier: 'great', remember: 'pocket-watch', answer: ['좋습니다. 천천히, 일정하게. 서두르면 태엽이 상하지요.', '…당신과 보니 시간이 조금 느리게 가는군요.'] },
        { say: '시계가 몇 개예요?', tier: 'good', face: 'smile', answer: '세지 않습니다. 오래된 물건은 개수가 아니라 손때로 세는 겁니다.' },
        { say: '그냥 새로 사세요', tier: 'meh', face: 'calm', answer: '새것은 언제든 삽니다. 오래된 것은 다시 살 수 없지요.' },
      ],
    },
    {
      id: 'snail',
      open: '오늘 객장 앞 계단에 달팽이가 있더군요. 저는 달팽이를 좋아하지 않습니다.',
      replies: [
        { say: '느려서요?', tier: 'great', face: 'think', answer: '정확합니다. 느린데 끈적하게 버티지요. 꼭 물린 종목 같습니다.' },
        { say: '제가 화단으로 옮겨 둘게요', tier: 'good', face: 'smile', answer: '고맙군요. 손은 씻고 오시지요. 대리석 손잡이를 아낍니다.' },
        { say: '귀엽던데요', tier: 'meh', face: 'calm', answer: '취향은 존중합니다. 거래는 하지 않겠지만요.' },
      ],
    },
    {
      id: 'staff-meeting',
      open: '아침 회의에서 직원에게 물었습니다. 왜 그 종목을 놓쳤느냐고. 당신이라면?',
      replies: [
        { say: '다음엔 무엇을 볼지 말할게요', tier: 'great', answer: '…그 대답이면 회의가 일찍 끝났겠군요. 채용하고 싶습니다. 농담 반입니다.' },
        { say: '솔직하게 몰랐다고 해요', tier: 'good', face: 'smile', answer: '정직은 높이 삽니다. 두 번째부터는 값이 떨어지지만요.' },
        { say: '날씨 탓을 할래요', tier: 'meh', face: 'think', answer: '변명이 셋째로 나오면 그 말이 꼭 섞이더군요. 기록해 두지요.' },
      ],
    },
    {
      id: 'appraisal',
      open: '저는 무엇이든 값을 매기는 버릇이 있습니다. {me}, 당신을 매겨 볼까요?',
      replies: [
        { say: '값을 못 매기실걸요', tier: 'great', remember: 'priceless', face: 'wow', answer: '…대담하군요. 그 말이 맞는지 오래 지켜보겠습니다. 장기 관찰입니다.' },
        { say: '비싸게 쳐 주세요', tier: 'good', face: 'laugh', answer: '협상할 줄 아시는군요. 시가보다 조금 높게 적어 두지요.' },
        { say: '부끄러워요, 하지 마세요', tier: 'meh', face: 'calm', answer: '그럼 보류하지요. 보류도 판단입니다.' },
      ],
    },
    {
      id: 'camellia',
      open: '붉은 동백은 한겨울에 핍니다. 그리고 꽃잎이 아니라 송이째 떨어지지요.',
      replies: [
        { say: '지지 않으려는 꽃 같아요', tier: 'great', remember: 'camellia-talk', answer: '바로 그겁니다. 흐트러지지 않는 마지막. 저는 그 품위를 삽니다.' },
        { say: '겨울에 피는 게 신기해요', tier: 'good', face: 'smile', answer: '추울 때 피는 꽃이 귀하지요. 폭락장에서 오르는 종목처럼요.' },
        { say: '꽃은 잘 몰라요', tier: 'meh', face: 'calm', answer: '괜찮습니다. 모르는 종목엔 들어가지 않는 것도 실력이지요.' },
      ],
    },
    {
      id: 'not-for-sale',
      when: { ch: 3 },
      open: '{me}, 제 장부에 처음으로 팔지 않을 항목이 생겼습니다. 무엇인지 아십니까?',
      replies: [
        { say: '…혹시 저예요?', tier: 'great', remember: 'unsold', face: 'shy', answer: '추리가 빠르군요. 신이치 군보다 빠릅니다. 대답은 영업 비밀로 하지요.' },
        { say: '금고 속 금이요?', tier: 'good', face: 'smile', answer: '금은 언제든 팝니다. 값만 맞으면요. 이건 값이 없는 쪽입니다.' },
        { say: '모르겠어요', tier: 'meh', face: 'calm', answer: '그럼 천천히 맞히시지요. 정답 공시는 아직 이릅니다.' },
      ],
    },
    {
      id: 'gramophone',
      open: ['객장 구석의 축음기, 보셨습니까. 장이 끝나면 판을 하나 겁니다.', '{me}, 음악은 무엇을 좋아하십니까?'],
      replies: [
        { say: '오래된 판이 좋아요', tier: 'great', remember: 'record-night', face: 'smile', answer: ['귀가 좋으시군요. 바늘이 지나간 자리마다 시간이 묻어 있지요.', '다음엔 해 진 뒤에 한 장 같이 듣지요. 소리는 낮게.'] },
        { say: '봇치 씨 기타가 좋아요', tier: 'good', face: 'think', answer: '주점 무대 말이군요. 시끄럽지만 박자는 정직하더군요. 인정합니다.' },
        { say: '음악은 잘 안 들어요', tier: 'meh', face: 'calm', answer: '그럼 체결음이라도 들으시지요. 제게는 그것도 음악입니다.' },
      ],
    },
    {
      id: 'pale-face',
      open: '{me}, 제 얼굴을 오래 보시는군요. 혹시 하실 말씀이라도?',
      replies: [
        { say: '정장이 하얘서 그래 보여요', tier: 'great', face: 'laugh', answer: ['…정확한 분석입니다. 대비 효과지요. 그렇게 기록하겠습니다.', '다른 낱말보다 백배 낫군요. 무슨 낱말인지는 말하지 않겠습니다.'] },
        { say: '눈빛이 날카로우세요', tier: 'good', face: 'think', answer: '장중에 붙은 버릇입니다. 손님 앞에선 반쯤 접어 두지요.' },
        { say: '좀 창백하신데요', tier: 'meh', face: 'sorry', answer: ['…그 낱말은 객장 금지어입니다.', '조명 탓입니다. 메르시 선생님께도 말씀드렸지요. 두 번이나.'] },
      ],
    },
    {
      id: 'hanafuda-earring',
      open: ['회관 화투방 앞을 지나다 화투 무늬 귀걸이를 한 손님을 봤습니다.', '이유는 모르겠는데 등이 서늘하더군요. {me}, 이런 적 있습니까?'],
      replies: [
        { say: '예림이 화투방 단골이겠죠', tier: 'great', face: 'think', answer: ['그렇겠지요. 예림이 씨 판은 늘 붐비니까요.', '그런데 왜 저만 모자를 눌러쓰게 됐을까요. 미제로 두지요.'] },
        { say: '귀걸이 예쁘던데요', tier: 'good', face: 'calm', answer: '취향은 존중합니다. 저는 그 무늬 앞에서만 걸음이 빨라지더군요.' },
        { say: '찔리는 거 있으세요?', tier: 'meh', face: 'sorry', answer: '…없습니다. 장부는 깨끗합니다. 질문은 회의 때 제가 하는 겁니다.' },
      ],
    },
    {
      id: 'flawless-portfolio',
      open: '흠 없는 포트폴리오를 찾고 있습니다. 떨어지는 종목이 하나도 없는 장부지요.',
      replies: [
        { say: '그런 건 없지 않을까요', tier: 'great', remember: 'flawless', face: 'think', answer: ['…솔직하군요. 직원들은 다 있다고 하던데.', '당신 같은 분이 회의에 한 명 있으면 좋겠습니다. 진심입니다.'] },
        { say: '찾으면 저도 알려 주세요', tier: 'good', face: 'smile', answer: '공유는 하지 않는 주의입니다만, 당신에게는 첫 줄만 알려 드리지요.' },
        { say: '전부 금에 넣으면요?', tier: 'meh', face: 'calm', answer: '금도 흔들립니다. 덜 흔들릴 뿐이지요. 그래서 좋아하는 거고요.' },
      ],
    },
    {
      id: 'yeongji',
      open: '오래 사는 영지를 아십니까. 그늘진 숲에서 아주 천천히 자라는 버섯이지요.',
      replies: [
        { say: '숲 그늘에서 찾아볼게요', tier: 'great', face: 'smile', answer: ['좋습니다. 해 질 녘에 다녀오시지요. 볕은 영지에게도 별로입니다.', '찾으시면 시세의 곱절로 쳐 드리지요. 저에게도요.'] },
        { say: '차로 달여 드세요?', tier: 'good', face: 'calm', answer: '가끔요. 쓴맛이 오래 남지요. 오래 남는 것은 다 좋습니다.' },
        { say: '버섯은 싫어요', tier: 'meh', face: 'sorry', answer: '그렇군요. 이 이야기는 보류하지요. 영지 쪽에서도 섭섭하겠지만요.' },
      ],
    },
    {
      id: 'parasol',
      open: '이 양산 말입니다. 다들 안색 때문이냐고 묻는데, 멋입니다. 순전히 멋.',
      replies: [
        { say: '흰 정장이랑 한 벌 같아요', tier: 'great', remember: 'parasol', face: 'shy', answer: '…알아봐 주시는군요. 손잡이도 정장 단추와 같은 상아색입니다.' },
        { say: '저도 하나 사고 싶어요', tier: 'good', face: 'smile', answer: '쓰레쉬 씨 잡화점에 있지요. 제 이름을 대고 깎아 달라고 하십시오.' },
        { say: '비 올 때 쓰는 거 아니에요?', tier: 'meh', face: 'calm', answer: '비에는 우산을 씁니다. 양산과 우산은 서로 다른 종목이지요.' },
      ],
    },
    {
      id: 'sector-pick',
      open: '시험을 하나 내지요. {me}, 이 마을에서 한 종목만 산다면 어디입니까?',
      replies: [
        { say: '빵집이요. 줄이 매일 길어요', tier: 'great', face: 'wow', answer: ['…제 산책 수첩과 같은 결론이군요.', '프리렌 씨 빵은 계절도 날씨도 타지 않지요. 귀한 성질입니다.'] },
        { say: '럭스 씨 어시장이요', tier: 'good', face: 'think', answer: '날씨를 타서 출렁이지요. 다만 그 출렁임이 재미입니다. 변동성이지요.' },
        { say: '카지노요', tier: 'meh', face: 'calm', answer: '하우스는 이기지요. 다만 손님이 하우스를 사면 장부가 우스워집니다.' },
      ],
    },
    {
      id: 'rose-rivalry',
      open: '미스 포츈 씨와 이자를 두고 겨룬 지 오래입니다. 그분 창구, 가 보셨습니까?',
      replies: [
        { say: '두 분 다 무서운 큰손이에요', tier: 'great', face: 'laugh', answer: ['칭찬으로 받지요. 그분은 바다를, 저는 장부를 무대로 삼을 뿐입니다.', '큰손이 오면 둘이 손을 잡기도 하지요. 잠깐만요.'] },
        { say: '이자는 여기가 싸요?', tier: 'good', face: 'think', answer: '하루 단위로는요. 그분은 한 번에 크게, 저는 매일 조금씩 받지요.' },
        { say: '아직 못 가 봤어요', tier: 'meh', face: 'calm', answer: '가 보셔도 됩니다. 대신 계약서는 끝까지 읽으십시오. 글씨가 작습니다.' },
      ],
    },
    {
      id: 'janna-paper',
      open: '잔나 씨 신문에 제 사진이 또 실렸습니다. {me}, 보셨습니까?',
      replies: [
        { say: '왼쪽 얼굴이 잘 나왔어요', tier: 'great', face: 'shy', answer: '…제가 부탁한 각도입니다. 잔나 씨가 약속을 지켰군요. 구독을 연장하지요.' },
        { say: '시세 기사가 좋던데요', tier: 'good', face: 'smile', answer: '시세는 정확했지요. 날씨 예보만 조금 더 맞으면 좋겠습니다.' },
        { say: '사진이 좀 하얗던데요', tier: 'meh', face: 'sorry', answer: '인쇄 탓입니다. 잉크를 아꼈겠지요. 다음 호는 진하게 부탁하겠습니다.' },
      ],
    },
    {
      id: 'moon',
      open: '저는 해보다 달이 좋습니다. 차고 기울어도 결국 같은 모양으로 돌아오지요.',
      replies: [
        { say: '변해도 돌아오는 게 좋네요', tier: 'great', remember: 'moon-friend', face: 'think', answer: ['…그렇군요. 변하는 것과 변하지 않는 것 사이에 달이 있었습니다.', '오늘 밤 장부에 적어 두지요. 새 종목 이름으로요.'] },
        { say: '보름달이 제일 예뻐요', tier: 'good', face: 'smile', answer: '가득 찬 것은 아름답지요. 다만 가득 찬 다음엔 기우는 게 시장입니다.' },
        { say: '저는 해가 좋아요', tier: 'meh', face: 'calm', answer: '해에게는 팬이 많지요. 저까지 보탤 필요는 없겠습니다.' },
      ],
    },
    {
      id: 'saffron-rice',
      open: '사프란 밥을 좋아합니다. 금빛 밥이지요. 한 숟갈마다 상한가가 보입니다.',
      replies: [
        { say: '다음에 지어 올게요', tier: 'great', remember: 'saffron', face: 'wow', answer: ['…정말입니까. 장부에 미래 수익으로 적어 두겠습니다.', '사프란은 아끼지 마십시오. 저도 칭찬을 아끼지 않겠습니다.'] },
        { say: '향신료 비싸지 않아요?', tier: 'good', face: 'think', answer: '비싸지요. 비싼 것은 대체로 오래 기억됩니다. 맛도, 손님도.' },
        { say: '그냥 흰밥이 좋아요', tier: 'meh', face: 'calm', answer: '흰 것은 저도 좋아합니다. 정장 이야기지만요.' },
      ],
    },
    {
      id: 'koi-pond',
      open: '객장 뒤뜰에 작은 연못이 있습니다. 비단잉어 몇 마리를 기르지요.',
      replies: [
        { say: '잉어들 이름 있어요?', tier: 'great', remember: 'koi-pond', face: 'laugh', answer: ['있습니다. 우량이, 배당이, 그리고 손절이.', '손절이가 제일 오래 살고 있습니다. 묘한 일이지요.'] },
        { say: '금잉어도 있어요?', tier: 'good', face: 'smile', answer: '한 마리 있지요. 금빛은 물속에서도 바래지 않습니다. 제일 아끼는 놈입니다.' },
        { say: '잉어는 비린내 나요', tier: 'meh', face: 'sorry', answer: '…연못 쪽 창은 닫아 두지요. 손님 기분도 자산이니까요.' },
      ],
    },
    {
      id: 'first-crash',
      open: '처음 본 폭락장이 언제냐고 묻는 손님이 있었습니다. 오래전이라고만 했지요.',
      replies: [
        { say: '그때 뭘 배우셨어요?', tier: 'great', face: 'think', answer: ['남들이 소리칠 때 조용히 앉아 있는 법을요.', '그리고 차를 끓이는 법을. 손이 바쁘면 판단이 덜 흔들리지요.'] },
        { say: '오래전이면 언제쯤이요?', tier: 'good', face: 'smile', answer: '그건 나이와 같은 칸에 든 정보입니다. 영업 비밀이지요.' },
        { say: '무서우셨겠어요', tier: 'meh', face: 'calm', answer: '무섭다기보다 시끄러웠지요. 저는 소음이 더 싫습니다.' },
      ],
    },
    {
      id: 'fav-season',
      open: '{me}, 사계절 중 하나를 고르라면 어느 계절입니까? 저는 이미 정했습니다.',
      replies: [
        { say: '해가 짧은 겨울이요', tier: 'great', remember: 'winter-pick', face: 'laugh', answer: '…같은 답이군요. 장이 끝나기도 전에 산책을 나설 수 있는 계절이지요.' },
        { say: '꽃 피는 봄이요', tier: 'good', face: 'think', answer: '봄은 들뜨지요. 들뜸은 비싸지만, 꽃값만은 정직합니다.' },
        { say: '뜨거운 여름이요', tier: 'meh', face: 'sorry', answer: '해가 지지 않는 계절이군요. 저는 그 석 달을 차양 밑에서 버팁니다.' },
      ],
    },
    {
      id: 'gem-or-gold',
      open: '금과 보석 중 하나만 금고에 남겨야 한다면, {me}, 무엇을 남기겠습니까?',
      replies: [
        { say: '빛을 오래 품는 보석이요', tier: 'great', face: 'wow', answer: ['…좋은 말이군요. 빛을 받아 두었다가 어둠 속에서 내놓는 돌이지요.', '저 같은 밤 산책자에게 꼭 맞는 자산입니다.'] },
        { say: '녹슬지 않는 금이요', tier: 'good', face: 'smile', answer: '금은 배신하지 않지요. 다만 말을 걸어 주지도 않습니다.' },
        { say: '둘 다 팔래요', tier: 'meh', face: 'calm', answer: '현금 선호로군요. 나모 씨 창구로 안내해 드리지요.' },
      ],
    },
    {
      id: 'his-home',
      open: '제 집이 어디냐고들 묻더군요. 신형만 씨는 특히 끈질기게 묻습니다.',
      replies: [
        { say: '볕 안 드는 북향 집이겠죠', tier: 'great', face: 'laugh', answer: ['…부동산 감정보다 정확하군요.', '창이 작고 커튼이 두꺼운 집입니다. 그 이상은 영업 비밀이지요.'] },
        { say: '객장에서 주무세요?', tier: 'good', face: 'think', answer: '가끔 소파에서 밤을 새우긴 합니다. 바다 건너 장이 열리는 밤이면요.' },
        { say: '집 사실 생각은요?', tier: 'meh', face: 'calm', answer: '땅은 도망가지 않지요. 그래서 서두르지 않습니다. 신형만 씨께는 비밀로.' },
      ],
    },
    {
      id: 'staff-praise',
      open: '직원 하나가 오늘 처음으로 장을 맞혔습니다. 칭찬을 해야 할지 고민이군요.',
      replies: [
        { say: '꼭 칭찬해 주세요', tier: 'great', face: 'shy', answer: ['…그러지요. "나쁘지 않군." 이 정도면 되겠습니까.', '아, 좀 더 길게요. 노력하겠습니다. 쉽지 않겠지만요.'] },
        { say: '운이었는지 물어보세요', tier: 'good', face: 'think', answer: '좋은 질문입니다. 근거가 있으면 칭찬, 없으면 차 한 잔이지요.' },
        { say: '월급을 올려 주세요', tier: 'meh', face: 'calm', answer: '…그건 다음 분기 회의 안건으로 미루지요.' },
      ],
    },
    {
      id: 'sunrise-wish',
      when: { love: 'dating' },
      open: '{me}, 요즘 이상한 생각을 합니다. 해 뜨는 걸 당신과 한 번 보고 싶다고.',
      replies: [
        { say: '양산 들고 같이 봐요', tier: 'great', face: 'shy', answer: ['…양산 하나에 두 사람. 그늘이 좁겠군요.', '좁은 그늘도 나쁘지 않겠습니다. 오히려 좋겠군요.'] },
        { say: '무리하지 마세요', tier: 'good', face: 'smile', answer: '배려 고맙습니다. 그럼 동트기 직전까지만. 그 몇 분을 아껴 두지요.' },
        { say: '해 지는 게 낫죠', tier: 'meh', face: 'calm', answer: '그것도 좋지요. 다만 이번엔 제가 먼저 바뀌어 보고 싶었습니다.' },
      ],
    },
    {
      id: 'changing-ok',
      when: { ch: 5 },
      open: '요즘 금고를 열면 금보다 당신이 준 마른 동백이 먼저 보입니다.',
      replies: [
        { say: '시들어도 버리지 마세요', tier: 'great', face: 'shy', answer: ['버리지 않습니다. 시든 꽃에도 그날의 시세가 남아 있으니까요.', '…아니, 시세가 아니라 그날이 남아 있지요.'] },
        { say: '새 꽃 또 드릴게요', tier: 'good', face: 'smile', answer: '그럼 계절마다 한 송이씩. 변하는 금고도 나쁘지 않겠군요.' },
        { say: '금이 더 비싸잖아요', tier: 'meh', face: 'think', answer: '비싸지요. 그런데 요즘은 값이 다가 아니라는 걸 배우는 중입니다.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비가 오는군요. 빗소리는 체결음과 닮았습니다. {me}, 처마 밑으로 오시지요.',
      replies: [
        { say: '망토 끝 좀 빌려도 돼요?', tier: 'great', face: 'shy', answer: '…넉넉합니다. 원래 비를 막으라고 산 망토지요. 극적인 효과는 덤입니다.' },
        { say: '빵집 종목 오르겠네요', tier: 'good', face: 'laugh', answer: '배우셨군요. 비 오는 날 줄이 길어지는 곳을 기억해 두십시오.' },
        { say: '비 싫어요', tier: 'meh', face: 'calm', answer: '그럼 객장에서 쉬다 가시지요. 대리석만 적시지 않으신다면요.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이 거리를 하얗게 덮었군요. 제 정장처럼요. 오늘은 기분이 좋습니다.',
      replies: [
        { say: '정장이랑 잘 어울려요', tier: 'great', remember: 'white-suit', answer: '눈과 같은 색을 고른 보람이 있군요. 오늘은 산책을 길게 하겠습니다.' },
        { say: '손이 시려요', tier: 'good', face: 'smile', answer: '망토 안쪽 주머니에 손난로가 있습니다. 하나 쓰시지요. 이자는 없습니다.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: ['night', 'evening'] },
      open: '해가 졌군요. 이제야 제 시간입니다. {me}, 잠깐 걸으시겠습니까?',
      replies: [
        { say: '좋아요, 등불 따라 걸어요', tier: 'great', answer: '그럼 시장 거리로. 가게마다 매출을 눈으로 세는 게 제 산책입니다.' },
        { say: '시세 얘기는 빼고요', tier: 'good', face: 'laugh', answer: '…노력하지요. 세 걸음에 한 번쯤은 새어 나올 겁니다.' },
        { say: '졸려서 들어갈래요', tier: 'meh', face: 'calm', answer: '밤에는 숫자도 쉬어야지요. 저는 예외지만요. 조심히 가십시오.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '이른 시간이군요. 새벽 공기는 시가보다 정직합니다. 아직 아무도 값을 안 매겼지요.',
      replies: [
        { say: '해 뜨기 전에 들어가세요', tier: 'great', face: 'shy', answer: '…눈치가 빠르시군요. 정장 때문입니다. 정장 때문이에요.' },
        { say: '일찍 일어나셨네요', tier: 'good', answer: '해외 시세를 훑었습니다. 어젯밤 종가도 세 번 확인했지요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제군요. 소음은 질색입니다만, 축제 매출은 아주 좋아합니다.',
      replies: [
        { say: '등불 켜지면 같이 구경해요', tier: 'great', answer: '해가 진 뒤라면 기꺼이. 처마 그늘에서 보는 축제가 제일 우아하지요.' },
        { say: '오늘은 장부 덮으세요', tier: 'good', face: 'think', answer: '반쯤 덮지요. 나머지 반은 내일 배당을 기대하는 데 쓰겠습니다.' },
        { say: '시끄러워서 싫어요', tier: 'meh', face: 'calm', answer: '동감입니다. 다만 그 소음이 마을 가게를 먹여 살리지요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '바다 냄새가 나는군요. 오늘 {fish}, 잡으셨지요? 시세로 치면 어떻습니까?',
      replies: [
        { say: '팔지 않고 먹을 거예요', tier: 'great', face: 'laugh', answer: '실물 보유로군요. 신선할 때 드시지요. 생선은 주가보다 빨리 상합니다.' },
        { say: '어시장에 넘길래요', tier: 'good', answer: '현명합니다. 오늘 어시장 호가가 나쁘지 않더군요.' },
        { say: '그냥 운이었어요', tier: 'meh', face: 'calm', answer: '운도 수익률에 들어갑니다. 다만 반복되지는 않지요.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문이 객장까지 왔습니다. 기록적인 놈을 낚으셨다더군요. 상한가입니다.',
      replies: [
        { say: '자랑하러 왔어요', tier: 'great', face: 'laugh', answer: '자랑할 만합니다. 오늘 마을 소식 일면은 당신이겠군요. 잔나 씨가 바쁘겠습니다.' },
        { say: '운이 좋았어요', tier: 'good', answer: '겸손도 품위입니다. 다만 오늘만큼은 실력이라고 적어 두지요.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '손에 흙이 묻었군요. 밭일을 하셨나 봅니다. 수확은 언제나 숫자로 돌아오지요.',
      replies: [
        { say: '이건 숫자 말고 밥이에요', tier: 'great', face: 'laugh', answer: '…졌습니다. 오늘만은 밥으로 계산하지요. 맛있게 드시길.' },
        { say: '농협 종목 오를까요?', tier: 'good', face: 'think', answer: '가을이면 늘 들뜨지요. 들뜸은 오래가지 않으니 적당히 파십시오.' },
        { say: '허리가 아파요', tier: 'meh', face: 'sorry', answer: '자산은 몸입니다. 오늘은 쉬시지요. 그게 제일 확실한 투자입니다.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물이 나왔다고요? 금빛이라니, 제 취향을 정확히 아시는군요.',
      replies: [
        { say: '보여 드리러 왔어요', tier: 'great', answer: '흠 없군요. 저는 흠 없는 것 앞에서만 말을 잃습니다. …보기 좋습니다.' },
        { say: '팔면 얼마예요?', tier: 'good', face: 'think', answer: '좋은 질문입니다. 다만 좋은 것은 바로 팔지 않는 편이 낫지요.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 안색이 흐리군요. 오늘 장이 나빴습니까, 아니면 하루가 나빴습니까?',
      replies: [
        { say: '그냥 좀 지쳤어요', tier: 'great', face: 'calm', answer: '그럼 앉으시지요. 차를 내리겠습니다. 지친 날의 판단은 보류가 정답입니다.' },
        { say: '괜찮아요, 별일 아니에요', tier: 'good', answer: '그렇다면 다행입니다. 그래도 차는 한 잔 드시고 가시지요. 무료입니다.' },
      ],
    },
    {
      id: 'op-news',
      when: { news: 'record' },
      open: '오늘 마을 소식 보셨습니까. 기록이 하나 깨졌더군요. 저는 기록이 좋습니다.',
      replies: [
        { say: '기록은 변하지 않으니까요', tier: 'great', remember: 'gold-mind', answer: '그렇지요. 한 번 적히면 남습니다. 금처럼요. 당신은 말이 통하는군요.' },
        { say: '저도 언젠가 깰래요', tier: 'good', face: 'smile', answer: '그날의 일면은 제가 먼저 사 두지요. 초판이 오르니까요.' },
        { say: '별 관심 없어요', tier: 'meh', face: 'calm', answer: '관심이 없을 때 사는 게 제일 싸지요. 기억해 두십시오.' },
      ],
    },
    {
      id: 'op-stock-up',
      when: { recent: 'stockUp' },
      open: '요즘 계좌가 붉게 물들었더군요. 오름입니다. {me}, 나쁘지 않습니다.',
      replies: [
        { say: '절반은 익절했어요', tier: 'great', answer: '…훌륭합니다. 오를 때 팔 줄 아는 분은 드뭅니다. 평가를 올리지요.' },
        { say: '더 오를 것 같아요!', tier: 'good', face: 'think', answer: '그럴지도요. 다만 낙관은 비싸게 사는 지름길입니다.' },
        { say: '운이 좋았나 봐요', tier: 'meh', face: 'calm', answer: '운은 다음 장에도 와 주지 않습니다. 원칙은 와 주지요.' },
      ],
    },
    {
      id: 'op-stock-down',
      when: { recent: 'stockDown' },
      open: '최근 장부가 파랗더군요. 내림입니다. {me}, 표정은 괜찮으십니까?',
      replies: [
        { say: '손절하고 다시 볼게요', tier: 'great', remember: 'cut-loss', answer: '결단이 빠르군요. 손실은 숫자일 뿐입니다. 숫자는 다시 쓰면 됩니다.' },
        { say: '물타기 할까요?', tier: 'good', face: 'think', answer: '근거가 있다면요. 희망으로 물을 타면 장부가 젖습니다.' },
        { say: '차 한 잔 주세요…', tier: 'meh', face: 'sorry', answer: '…드리지요. 오늘은 제일 좋은 찻잎으로. 위로는 차가 합니다.' },
      ],
    },
    {
      id: 'op-casino-win',
      when: { recent: 'casinoWin' },
      open: '카지노에서 따셨다지요. 축하합니다. 다만 하우스는 결국 이긴다는 건 아시지요?',
      replies: [
        { say: '그래서 딴 건 저금했어요', tier: 'great', answer: '…감탄했습니다. 이긴 날 일어서는 분은 열에 하나도 없지요.' },
        { say: '오늘은 운이 좋았어요', tier: 'good', face: 'smile', answer: '운은 즐기십시오. 다만 장부에는 운이라고 적어 두시고요.' },
        { say: '내일도 갈 거예요!', tier: 'meh', face: 'think', answer: '미쿠 씨가 반기겠군요. 확률은 반기지 않을 겁니다.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '카지노 앞에서 뵌 얼굴이 어둡더군요. 잃으셨습니까. 확률은 냉정하지요.',
      replies: [
        { say: '수업료라고 생각할게요', tier: 'great', face: 'smile', answer: '좋은 회계입니다. 비싼 수업일수록 오래 기억에 남지요.' },
        { say: '되찾으러 갈 거예요', tier: 'meh', face: 'think', answer: '…그 말을 한 손님들을 많이 압니다. 오늘은 차를 드시고 가시지요.' },
      ],
    },
    {
      id: 'op-mercy',
      when: { bond: 'mercy' },
      open: '메르시 선생님을 만나셨군요. 혹시 제 안색 이야기를 하던가요?',
      replies: [
        { say: '볕 좀 쬐시래요', tier: 'great', face: 'sorry', answer: '…또군요. 창백한 건 객장 조명 탓입니다. 그렇게 전해 주시지요.' },
        { say: '같이 그늘에서 걸어요', tier: 'good', remember: 'shade-friend', answer: '타협안이군요. 그늘과 산책, 둘 다 챙기지요. 선생님께는 비밀로.' },
        { say: '아무 말 없었어요', tier: 'meh', face: 'calm', answer: '그게 더 불안하군요. 다음 진료 때 몰아서 들으려나 봅니다.' },
      ],
    },
    {
      id: 'op-haku',
      when: { bond: 'haku' },
      open: '하쿠 씨 과수원에 다녀오셨습니까. 올해 매출을 물었더니 사과를 주더군요.',
      replies: [
        { say: '그게 하쿠 씨의 대답이에요', tier: 'great', face: 'think', answer: '…그렇군요. 숫자 대신 실물로 답하는 분이었습니다. 단맛은 상한가였고요.' },
        { say: '사과 맛있었어요?', tier: 'good', face: 'smile', answer: '흠 없었습니다. 장부에는 적지 않았지요. 적을 칸이 없더군요.' },
      ],
    },
    {
      id: 'op-nyamo',
      when: { bond: 'nyamo' },
      open: '나모 씨를 보셨군요. 또 예금 금리 자랑을 하던가요? 그분과는 끝이 안 납니다.',
      replies: [
        { say: '둘 다 맞는 말 같아요', tier: 'great', remember: 'split-bet', answer: '…공정한 판정이군요. 나모 씨께는 제가 반 걸음 앞섰다고만 전해 주시지요.' },
        { say: '예금이 마음 편해요', tier: 'good', face: 'calm', answer: '편안함도 수익입니다. 인정하지요. 오늘만입니다.' },
        { say: '금리가 뭐예요?', tier: 'meh', face: 'wow', answer: '…창구로 오시지요. 첫 상담은 무료입니다. 놀랍게도요.' },
      ],
    },
    {
      id: 'op-shinichi',
      when: { bond: 'shinichi' },
      open: '신이치 군이 또 제 나이를 추리하던가요? 회중시계 흠집까지 세던데요.',
      replies: [
        { say: '영업 비밀이라고 해 뒀어요', tier: 'great', face: 'laugh', answer: '완벽한 답변입니다. 사건은 미제로 남기지요. 미제가 제일 오래 갑니다.' },
        { say: '정답이 뭔데요?', tier: 'good', face: 'think', answer: '탐정에게도 안 알려 준 걸 당신께 알려 드리면 공정하지 않지요.' },
        { say: '꽤 그럴듯했어요', tier: 'meh', face: 'sorry', answer: '…그럴듯했다니. 내일부터 시계를 안주머니에 넣겠습니다.' },
      ],
    },
    {
      id: 'op-makima',
      when: { bond: 'makima' },
      open: '마키마 씨와 이야기하셨군요. 그분은 웃으면서 값을 부르지요. 저처럼요.',
      replies: [
        { say: '두 분 다 속을 모르겠어요', tier: 'great', face: 'laugh', answer: '칭찬으로 받겠습니다. 속이 보이는 큰손은 이미 큰손이 아니지요.' },
        { say: '누가 더 무서워요?', tier: 'good', face: 'think', answer: '저는 정중할 뿐입니다. 무섭다는 평가는 시장이 내리는 것이지요.' },
      ],
    },
    {
      id: 'op-realtor',
      when: { bond: 'realtor' },
      open: '신형만 씨가 또 땅 이야기를 하셨지요. 땅은 도망가지 않습니다. 그래서 지루하지요.',
      replies: [
        { say: '집도 주식도 반반이요', tier: 'great', answer: '…현명하군요. 그분과 저 사이에 서 있는 사람이 제일 부자가 되더군요.' },
        { say: '집이 든든하긴 하죠', tier: 'good', face: 'calm', answer: '든든함은 인정합니다. 다만 집은 하루 만에 팔 수 없지요.' },
        { say: '둘 다 어려워요', tier: 'meh', face: 'smile', answer: '그럼 오늘은 주점에서 두 사람 논쟁만 들으시지요. 공짜 강의입니다.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '햇볕이 쨍하군요. {me}, 이쪽 차양 밑으로 오시지요. 대화는 그늘에서 합니다.',
      replies: [
        { say: '양산 같이 써도 돼요?', tier: 'great', remember: 'parasol', face: 'shy', answer: ['…넉넉합니다. 양산은 원래 둘이 쓰라고 큰 걸 샀지요.', '아니, 방금 그 말은 장부에서 지워 주십시오.'] },
        { say: '그늘이 시원하네요', tier: 'good', face: 'smile', answer: '그늘은 공짜인데 수익률이 좋지요. 제가 아는 유일한 무위험 자산입니다.' },
        { say: '볕 좋은데 산책 가요!', tier: 'meh', face: 'sorry', answer: '…해가 지면 기꺼이요. 지금은 정장이 거절합니다. 제가 아니라요.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐린 날이군요. 드물게 낮 산책을 나왔습니다. 오늘은 구름이 제 편이지요.',
      replies: [
        { say: '낮에 뵈니 새로워요', tier: 'great', face: 'laugh', answer: '낮의 무잔은 한정판입니다. 오늘 보신 걸 기념으로 적어 두시지요.' },
        { say: '같이 시장 한 바퀴 돌아요', tier: 'good', face: 'smile', answer: '좋습니다. 구름이 걷히기 전까지만. 걷히면 저는 처마 밑으로 사라지지요.' },
        { say: '흐려서 우울해요', tier: 'meh', face: 'calm', answer: '흐린 날의 시장은 정직합니다. 우울도 조금 정직해지면 견딜 만하지요.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄이군요. 꽃이 피고 지는 속도가 빠릅니다. 꽃집 앞을 지날 때마다 시세가 바뀌지요.',
      replies: [
        { say: '빨리 지니까 더 예뻐요', tier: 'great', face: 'think', answer: ['…그런 계산법도 있군요. 짧게 보유해서 귀한 것.', '오늘 산책 때 꽃집 앞에서 조금 더 오래 서 있어 보지요.'] },
        { say: '씨앗 사러 가요', tier: 'good', face: 'smile', answer: '쓰레쉬 씨 가게가 들뜨겠군요. 들뜸은 오래가지 않으니 오늘 사시지요.' },
        { say: '꽃가루 때문에 힘들어요', tier: 'meh', face: 'sorry', answer: '메르시 선생님 의원으로 가시지요. 저도 가끔 핑계를 대고 그늘에 쉬러 갑니다.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: '여름 해는 정말 길군요. 장이 끝나도 해가 지지 않습니다. 객장에서 기다리는 중이지요.',
      replies: [
        { say: '해 지면 같이 나가요', tier: 'great', face: 'shy', answer: '…약속으로 받지요. 오늘은 회중시계를 평소보다 자주 보겠습니다.' },
        { say: '빙수 사 올까요?', tier: 'good', face: 'laugh', answer: '프리렌 씨 빵집의 팥빙수라면. 그늘로 배달해 주시면 수수료는 면제입니다.' },
        { say: '저는 여름이 좋아요', tier: 'meh', face: 'calm', answer: '그럼 이 계절의 볕은 당신 몫으로 하지요. 저는 그늘 몫을 맡겠습니다.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '가을이군요. 창 너머로 낙엽이 붉게 물드는 걸 봅니다. 하한가 빛깔인데도 곱군요.',
      replies: [
        { say: '지는 것도 예쁠 수 있죠', tier: 'great', face: 'think', answer: ['…올해는 그 말이 조금 덜 이상하게 들리는군요.', '나세라 씨 농협 앞 은행나무도 오늘 저녁에 보러 가지요.'] },
        { say: '수확철이라 바빠요', tier: 'good', face: 'smile', answer: '바쁜 손님은 좋은 손님이지요. 수확은 언제나 숫자로 돌아옵니다.' },
        { say: '낙엽 쓸기 귀찮아요', tier: 'meh', face: 'calm', answer: '객장 앞은 직원들이 씁니다. 회의 시간이 짧아지는 계절이지요.' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter' },
      open: '겨울입니다. 동백이 피는 계절이고, 해가 일찍 지는 계절이지요. 제 계절입니다.',
      replies: [
        { say: '동백 보러 같이 가요', tier: 'great', face: 'shy', answer: '해 진 뒤 꽃집 앞에서. 붉은 것은 넉넉할 테고, 푸른 것은… 늘 그렇듯 소문뿐이겠지요.' },
        { say: '추운데 망토 따뜻해요?', tier: 'good', face: 'laugh', answer: '극적인 효과 외에 보온도 됩니다. 덤의 덤이지요.' },
        { say: '추워서 싫어요', tier: 'meh', face: 'calm', answer: '그럼 객장 난롯가로 오시지요. 대리석은 차갑지만 차는 따뜻합니다.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me}, 오늘이 생일이시라고요. 장부에 오늘 날짜를 굵게 적어 두겠습니다.',
      replies: [
        { say: '선물은 차 한 잔이면 돼요', tier: 'great', face: 'smile', answer: ['욕심이 없으시군요. 그럼 제일 좋은 찻잎으로.', '오늘 하루는 당신이 상한가입니다. 기록으로 남기지요.'] },
        { say: '나이는 영업 비밀이에요', tier: 'good', face: 'laugh', answer: '…제 대사를 가져가셨군요. 오늘만은 저작권료를 받지 않겠습니다.' },
        { say: '생일은 별로예요', tier: 'meh', face: 'calm', answer: '세지 않는 것도 방법이지요. 저는 그쪽 전문가입니다. 축하는 하겠습니다.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '마을에 혼례 소식이 있더군요. 평생 보유 계약이라니, 장기 투자의 정수지요.',
      replies: [
        { say: '장부 말고 축하를 해 줘요', tier: 'great', face: 'sorry', answer: ['…맞습니다. 축하드린다고 전해 주시지요. 진심으로요.', '축의금은 넉넉히 넣겠습니다. 계산은 하지 않고요.'] },
        { say: '부럽지 않으세요?', tier: 'good', face: 'shy', answer: '부러움은 매수 신호라던데요. 오늘은 그 신호를 조용히 무시해 보지요.' },
        { say: '결혼은 위험하죠', tier: 'meh', face: 'think', answer: '위험 없는 수익은 없지요. 다만 그 두 분은 손절을 모르는 얼굴이더군요.' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '전설의 물고기 소식이 돌더군요. 전설은 늘 소문으로 먼저 오지요. 푸른 동백처럼.',
      replies: [
        { say: '소문도 언젠간 실물이 돼요', tier: 'great', remember: 'blue-hunt', face: 'smile', answer: '…오늘은 그 말을 믿어 보지요. 소문 종목을 오래 들고 있는 보람이 있군요.' },
        { say: '럭스 씨가 신났겠어요', tier: 'good', face: 'laugh', answer: '어시장 호가가 들썩이겠군요. 내일 시가가 기대됩니다.' },
        { say: '전설은 다 지어낸 거예요', tier: 'meh', face: 'calm', answer: '지어낸 이야기도 값이 붙으면 시장이 되지요. 그래서 재미있습니다.' },
      ],
    },
    {
      id: 'op-museum',
      when: { recent: 'museum' },
      open: '요즘 박물관에 자주 가신다고요. 오래된 것이 대접받는 곳이지요. 마음에 듭니다.',
      replies: [
        { say: '오래된 시계도 있었어요', tier: 'great', face: 'wow', answer: ['…정말입니까. 제 것보다 오래된 시계라니. 질투가 나는군요.', '해 진 뒤에 문을 열어 준다면 보러 가지요.'] },
        { say: '기증도 했어요', tier: 'good', face: 'smile', answer: '기증이라. 팔지 않고 남기는 쪽을 고르셨군요. 품위 있는 결정입니다.' },
        { say: '그냥 시원해서 가요', tier: 'meh', face: 'laugh', answer: '볕을 피하는 데엔 박물관만 한 곳이 없지요. 저도 압니다. 아주 잘.' },
      ],
    },
    {
      id: 'op-friend-bday',
      when: { friendNews: 'birthday' },
      open: '오늘 생일인 친구분이 있다지요. 선물은 값이 변하지 않는 것으로 고르십시오.',
      replies: [
        { say: '좋아하는 걸로 고를래요', tier: 'great', face: 'think', answer: '…그게 정답이군요. 시세보다 취향. 오늘 회의 때 써먹어야겠습니다.' },
        { say: '금 한 조각 어때요?', tier: 'good', face: 'smile', answer: '제 취향이라면 만점입니다. 친구분 취향인지는 확인하시고요.' },
        { say: '선물 고르기 어려워요', tier: 'meh', face: 'calm', answer: '그럼 차 한 잔 사 드리시지요. 위로는 차가 하고, 축하도 차가 합니다.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me}, 표정이 상한가로군요. 무슨 좋은 일이라도 있었습니까?',
      replies: [
        { say: '그냥 기분 좋은 날이에요', tier: 'great', face: 'laugh', answer: ['근거 없는 상승이군요. 보통은 경계하라고 합니다만.', '오늘은 그대로 보유하시지요. 그런 날도 있어야 합니다.'] },
        { say: '밭이 잘 자라서요', tier: 'good', face: 'smile', answer: '실적이 받쳐 주는 상승이군요. 그건 오래갑니다.' },
        { say: '비밀이에요', tier: 'meh', face: 'think', answer: '내부 정보로군요. 묻지 않겠습니다. 궁금하긴 하지만요.' },
      ],
    },
    {
      id: 'op-fishing',
      when: { recent: 'fishing' },
      open: '요즘 낚시를 자주 하신다고요. 럭스 씨 어시장 장부에 이름이 자주 보이더군요.',
      replies: [
        { say: '밤낚시도 해요', tier: 'great', face: 'smile', answer: '…밤낚시라. 다음엔 제게도 알려 주시지요. 밤바다는 제 시간이니까요.' },
        { say: '손맛이 좋아서요', tier: 'good', face: 'think', answer: '체결의 손맛과 비슷하겠군요. 기다림 끝에 한 번에 오는 것.' },
        { say: '잘 안 잡혀요', tier: 'meh', face: 'calm', answer: '횡보장이군요. 미끼를 바꾸든 자리를 바꾸든, 감정만은 바꾸지 마십시오.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '먼 바다에 다녀오셨다고요. 바다 위엔 볕을 가릴 데가 없지요. 대단하십니다.',
      replies: [
        { say: '밤바다 별이 예뻤어요', tier: 'great', face: 'shy', answer: ['…그 이야기라면 몇 시간이고 듣겠습니다.', '볕 없는 바다라면 저도 한 번쯤은 나가 보고 싶군요.'] },
        { say: '샹크스 씨가 데려갔어요', tier: 'good', face: 'think', answer: '허풍 주점 주인 말이군요. 허풍에도 시세가 있지요. 그분 건 늘 상한가입니다.' },
        { say: '뱃멀미했어요', tier: 'meh', face: 'sorry', answer: '출렁임에 약하시군요. 그럼 주식은 천천히 시작하시지요.' },
      ],
    },
    {
      id: 'op-rose',
      when: { bond: 'rose' },
      open: '미스 포츈 씨를 만나셨군요. 이자 이야기를 하던가요? 제 쪽이 더 정직합니다.',
      replies: [
        { say: '두 분 동업하면 무적이죠', tier: 'great', face: 'laugh', answer: '…큰손 앞에서만 하는 동업이지요. 평소엔 경쟁입니다. 그게 시장이고요.' },
        { say: '계약서 읽으래요', tier: 'good', face: 'smile', answer: '드물게 저와 같은 조언이군요. 그 말만은 믿으셔도 됩니다.' },
        { say: '그분이 더 멋있던데요', tier: 'meh', face: 'sorry', answer: '…멋은 시장이 판단하지요. 저는 조용히 정장 깃을 세우겠습니다.' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '잔나 씨를 만나셨군요. 내일 신문 일면이 무엇인지 흘리던가요?',
      replies: [
        { say: '취재원 보호래요', tier: 'great', face: 'laugh', answer: '그분답군요. 내부 정보를 지키는 기자라니, 높이 삽니다. 예보만 빼고요.' },
        { say: '지점장님 기사 쓴대요', tier: 'good', face: 'shy', answer: '…왼쪽 얼굴로 부탁한다고 전해 주시지요. 조명은 넉넉하게.' },
        { say: '날씨 예보만 들었어요', tier: 'meh', face: 'calm', answer: '그럼 우산을 챙기시지요. 아니면 챙기지 마시든지. 반반입니다.' },
      ],
    },
    {
      id: 'op-lumi',
      when: { bond: 'lumi' },
      open: '미쿠 씨를 보셨군요. 확률 이야기를 하면 노래로 받아치는 분이지요.',
      replies: [
        { say: '노래가 확률보다 세요', tier: 'great', face: 'laugh', answer: ['…반박할 수 없군요. 그분 무대 날은 카지노 매출이 오르니까요.', '확률이 노래에 지는 날도 있다고 장부에 적지요.'] },
        { say: '같이 공연 보러 가요', tier: 'good', face: 'smile', answer: '해 진 뒤 공연이라면. 맨 뒷자리, 조명이 덜 닿는 곳으로 부탁하지요.' },
        { say: '파꽃 얘기만 했어요', tier: 'meh', face: 'think', answer: '파꽃이라. 푸른 동백 정보는 없었군요. 그분 장부엔 노래만 있나 봅니다.' },
      ],
    },
    {
      id: 'op-with-nyamo',
      when: { with: 'nyamo' },
      open: '마침 {other} 씨와 금리 이야기 중이었습니다. 판정이 필요하군요. {me}, 끼어드시지요.',
      replies: [
        { say: '반은 예금, 반은 투자요', tier: 'great', remember: 'split-bet', face: 'laugh', answer: '…무승부로군요. 오늘 판정은 받아들이지요. 차는 제가 사겠습니다.' },
        { say: '예금이 이겼어요', tier: 'good', face: 'sorry', answer: '오늘은 물러나지요. 다만 장기전입니다. 아주 장기전이요.' },
        { say: '둘 다 어려워요', tier: 'meh', face: 'calm', answer: '그럼 둘 다 창구로 오시지요. 상담료는 각자 받겠습니다.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '오늘 {other} 씨와 조금 서먹해졌습니다. 계산이 맞지 않는 대화였지요.',
      replies: [
        { say: '먼저 차 한 잔 권해 봐요', tier: 'great', face: 'think', answer: ['…위로는 차가 하지요. 제가 늘 하던 말인데, 제게 쓸 줄은 몰랐습니다.', '해가 지면 찻잎을 들고 가 보겠습니다.'] },
        { say: '시간이 지나면 풀려요', tier: 'good', face: 'calm', answer: '반등을 기다리는 쪽이군요. 근거가 있다면요. 그분은 뒤끝이 없는 편이지요.' },
        { say: '누가 잘못했어요?', tier: 'meh', face: 'sorry', answer: '장부상으로는 반반입니다. 그게 제일 곤란한 결산이지요.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-shade',
      when: { mem: 'shade-friend' },
      use: 'shade-friend',
      open: '{me}, 그늘이 좋다고 하셨지요. 오늘 차양 밑 자리를 하나 비워 두었습니다.',
      replies: [
        { say: '고마워요, 앉을게요', tier: 'great', face: 'smile', answer: '편히 앉으시지요. 같은 그늘에 있으면 판단도 같이 식습니다.' },
        { say: '기억하고 계셨어요?', tier: 'good', face: 'shy', answer: '손님 성향은 제 장부의 기본입니다. 당신 것은 조금 더 자세하지만요.' },
      ],
    },
    {
      id: 'cb-gold',
      when: { mem: 'gold-mind' },
      use: 'gold-mind',
      open: '변하지 않는 게 좋다던 {me}. 금고 안쪽 칸을 정리하다 그 말이 떠올랐습니다.',
      replies: [
        { say: '지금도 그래요', tier: 'great', answer: '그렇다면 당신도 변하지 않는 쪽이군요. 드물고, 귀한 성질입니다.' },
        { say: '요즘은 조금 변했어요', tier: 'good', face: 'think', answer: '…그럼 다시 평가하지요. 좋은 쪽으로 변했다면 상향입니다.' },
      ],
    },
    {
      id: 'cb-blue',
      when: { mem: 'blue-hunt' },
      use: 'blue-hunt',
      open: '푸른 동백을 같이 찾겠다고 하셨지요. 꽃집에 또 물었습니다. 아직이라더군요.',
      replies: [
        { say: '언젠가 꼭 찾을 거예요', tier: 'great', face: 'smile', answer: '…서두를 이유가 없어졌습니다. 찾는 동안 함께 걷는 것도 수익이니까요.' },
        { say: '숲 쪽도 봐 둘게요', tier: 'good', answer: '정보는 늘 환영입니다. 다만 해 진 뒤에 알려 주시지요.' },
      ],
    },
    {
      id: 'cb-cutloss',
      when: { mem: 'cut-loss' },
      use: 'cut-loss',
      open: '손절하고 차 한 잔. 당신이 한 말입니다. 그 뒤로 직원 회의에서 써먹고 있지요.',
      replies: [
        { say: '저작권료 주세요', tier: 'great', face: 'laugh', answer: '…좋습니다. 오늘 차는 제가 사지요. 수수료는 면제입니다.' },
        { say: '직원분들이 좋아해요?', tier: 'good', answer: '회의가 짧아졌다고 놀라더군요. 당신 탓으로 해 두겠습니다.' },
      ],
    },
    {
      id: 'cb-suit',
      when: { mem: 'white-suit' },
      use: 'white-suit',
      open: '흰 정장이 어울린다고 하셨지요. 오늘 새로 다렸습니다. 우연입니다. 아마도.',
      replies: [
        { say: '오늘도 제일 멋지세요', tier: 'great', face: 'shy', answer: '…평가가 후하군요. 정정하지 않겠습니다. 그대로 체결하지요.' },
        { say: '모자도 새 거예요?', tier: 'good', face: 'smile', answer: '눈썰미가 좋군요. 띠만 바꿨습니다. 붉은 동백 빛으로요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}, 맞지요? 객장 사은품 목록에 넣어 볼까 합니다.',
      replies: [
        { say: '그럼 매일 올게요', tier: 'great', remember: 'taste-heard', face: 'laugh', answer: '그게 사은품의 목적입니다. 단골 확보지요. 당신은 이미 단골이지만요.' },
        { say: '어떻게 아셨어요?', tier: 'good', remember: 'taste-heard', answer: '손님의 취향은 잔고 다음으로 중요한 정보입니다. 당신 것은 첫째고요.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '지난번 함께 다닌 날, 그늘만 골라 걸어 주시더군요. 눈치채고 있었습니다.',
      replies: [
        { say: '또 그늘로 같이 걸어요', tier: 'great', remember: 'outing-talk', face: 'shy', answer: '…좋습니다. 다음 동행은 해 진 뒤로. 제 시간을 전부 비워 두지요.' },
        { say: '저도 더웠거든요', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '핑계도 품위 있게 대시는군요. 마음에 듭니다.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me}, 곧 생일이시지요. 선물은 값이 변하지 않는 것으로 고르는 중입니다.',
      replies: [
        { say: '마음이면 충분해요', tier: 'great', remember: 'bday-plan', face: 'shy', answer: '…마음은 값을 매길 수 없어 곤란합니다. 그래도 준비해 보지요.' },
        { say: '금이면 좋겠어요!', tier: 'good', remember: 'bday-plan', face: 'laugh', answer: '솔직하군요. 금은 배신하지 않지요. 좋은 선택입니다.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '당신 방에서 보낸 저녁 말입니다. 커튼을 미리 닫아 두셨더군요. 눈치챘습니다.',
      replies: [
        { say: '다음에도 닫아 둘게요', tier: 'great', remember: 'date-talk', face: 'shy', answer: ['…고맙습니다. 그 방은 제 장부에서 그늘 지도 맨 위에 있습니다.', '다음엔 축음기 판을 하나 들고 가지요.'] },
        { say: '가구 시세 매기셨죠?', tier: 'good', remember: 'date-talk', face: 'laugh', answer: '들켰군요. 다만 그 방의 값은 가구가 아니라 주인에게서 나오더군요.' },
      ],
    },
    {
      id: 'cb-record',
      when: { mem: 'record-night' },
      use: 'record-night',
      open: '오래된 판이 좋다고 하셨지요. 오늘 밤 축음기에 한 장 걸어 두었습니다.',
      replies: [
        { say: '해 지면 들으러 갈게요', tier: 'great', face: 'smile', answer: ['기다리지요. 바늘은 새로 갈아 두었습니다.', '판은 오래됐고 바늘은 새것. 그 조합이 소리를 제일 곱게 내더군요.'] },
        { say: '무슨 곡이에요?', tier: 'good', face: 'think', answer: '제목은 잊었습니다. 오래된 판은 제목보다 긁힌 자리로 기억하지요.' },
      ],
    },
    {
      id: 'cb-moon',
      when: { mem: 'moon-friend' },
      use: 'moon-friend',
      open: '변해도 돌아오는 달 이야기, 기억하십니까. 오늘 밤 달이 꼭 그렇군요.',
      replies: [
        { say: '같이 달 보러 걸어요', tier: 'great', face: 'shy', answer: '…좋습니다. 오늘 산책 경로는 달이 잘 보이는 쪽으로 바꾸지요.' },
        { say: '오늘은 무슨 달이에요?', tier: 'good', face: 'smile', answer: '기우는 중입니다. 그래도 걱정은 없지요. 돌아올 걸 아니까요.' },
      ],
    },
    {
      id: 'cb-koi',
      when: { mem: 'koi-pond' },
      use: 'koi-pond',
      open: '연못의 손절이 말입니다. 오늘 아침 먹이를 제일 먼저 먹더군요. 기특합니다.',
      replies: [
        { say: '손절이 보러 가도 돼요?', tier: 'great', face: 'laugh', answer: '물론입니다. 해 진 뒤 뒤뜰로 오시지요. 먹이는 제가 준비합니다.' },
        { say: '배당이는요?', tier: 'good', face: 'think', answer: '분기마다 한 번 수면 위로 올라옵니다. 이름값을 하지요.' },
      ],
    },
    {
      id: 'cb-winter',
      when: { mem: 'winter-pick' },
      use: 'winter-pick',
      open: '겨울을 고르셨던 {me}. 해가 짧아지니 산책 시간이 늘었습니다. 같이 걸으시지요.',
      replies: [
        { say: '목도리 하고 나갈게요', tier: 'great', face: 'smile', answer: '현명합니다. 저는 망토가 있으니 바람 쪽에 서지요.' },
        { say: '오늘은 추워서 다음에요', tier: 'good', face: 'calm', answer: '보류도 판단이지요. 겨울은 길고, 저는 기다리는 데 익숙합니다.' },
      ],
    },
    {
      id: 'cb-parasol',
      when: { mem: 'parasol' },
      use: 'parasol',
      open: '양산이 정장과 잘 어울린다고 하셨지요. 그 뒤로 매일 들고 나옵니다. 멋으로요.',
      replies: [
        { say: '역시 멋 때문이었군요', tier: 'great', face: 'laugh', answer: '물론입니다. 다른 이유는 없지요. 메르시 선생님이 뭐라 하든요.' },
        { say: '오늘 양산 새 거네요', tier: 'good', face: 'wow', answer: '…눈썰미가 좋군요. 테두리에 검은 단을 하나 덧댔습니다. 망토와 맞추느라.' },
      ],
    },
    {
      id: 'cb-saffron',
      when: { mem: 'saffron' },
      use: 'saffron',
      open: '사프란 밥, 지어 오겠다고 하셨지요. 장부의 미래 수익 칸이 아직 비어 있습니다.',
      replies: [
        { say: '곧 들고 올게요', tier: 'great', face: 'smile', answer: '기다리지요. 이자는 받지 않겠습니다. 대신 한 숟갈 같이 드시지요.' },
        { say: '잊고 있었어요', tier: 'good', face: 'think', answer: '솔직하군요. 그럼 만기를 연장해 드리지요. 무기한으로요.' },
      ],
    },
    {
      id: 'cb-flawless',
      when: { mem: 'flawless' },
      use: 'flawless',
      open: '흠 없는 장부는 없다던 말, 직원 회의에서 써 봤습니다. 다들 놀라더군요.',
      replies: [
        { say: '회의가 짧아졌어요?', tier: 'great', face: 'laugh', answer: '절반으로요. 다들 숨을 쉬더군요. 당신 공으로 해 두지요.' },
        { say: '지점장님은요?', tier: 'good', face: 'shy', answer: '…저도 조금 숨을 쉬었습니다. 흠이 있어도 장부는 굴러가더군요.' },
      ],
    },
    {
      id: 'cb-priceless',
      when: { mem: 'priceless' },
      use: 'priceless',
      open: '값을 못 매길 거라던 {me}. 장기 관찰 보고를 드리지요. 아직도 못 매겼습니다.',
      replies: [
        { say: '그럼 계속 관찰하세요', tier: 'great', face: 'shy', answer: '그러지요. 관찰 기간은 정하지 않겠습니다. 길수록 좋은 종목이니까요.' },
        { say: '대충 얼마쯤이에요?', tier: 'good', face: 'think', answer: '대충이라는 말은 제 장부에 없습니다. 그래서 더 곤란한 겁니다.' },
      ],
    },
    {
      id: 'cb-lantern',
      when: { mem: 'lantern-walk' },
      use: 'lantern-walk',
      open: '등불 아래 함께 걷던 저녁 이후로, 산책 경로에 빵집 앞을 꼭 넣습니다.',
      replies: [
        { say: '줄 길이 맞히기 또 해요', tier: 'great', face: 'laugh', answer: '좋습니다. 지난번엔 당신이 이겼지요. 오늘은 설욕하겠습니다.' },
        { say: '빵 사 드릴게요', tier: 'good', face: 'smile', answer: '그럼 줄은 제가 서지요. 해만 졌다면 얼마든지.' },
      ],
    },
    {
      id: 'cb-camellia',
      when: { mem: 'red-camellia' },
      use: 'red-camellia',
      open: '주신 동백, 모자 띠에서 내려 장부 사이에 말려 두었습니다. 색이 조금 바랬지요.',
      replies: [
        { say: '바랜 색도 예뻐요', tier: 'great', face: 'shy', answer: ['…그렇군요. 처음 받았을 때와 다른데, 덜 귀하지는 않습니다.', '이런 말을 제가 하게 될 줄은 몰랐습니다.'] },
        { say: '새 꽃 가져올게요', tier: 'good', face: 'smile', answer: '고맙습니다. 다만 이 말린 꽃도 금고에 그대로 두겠습니다.' },
      ],
    },
  ],
  chapters: [
    {
      title: '흰 정장의 첫 상담',
      hint: '한 번 이야기를 나누면 무잔이 창구 뒤에서 상담 장부를 펼쳐요.',
      need: { days: 1 },
      scene: [
        '범마을 증권 객장. 블라인드가 반쯤 내려와 볕이 비스듬히 든다.',
        '흰 중절모를 고쳐 쓴 무잔이 창구 너머로 두꺼운 장부를 펼친다.',
        '"범마을 증권 지점장 무잔입니다. 저는 손님을 잔고로 기억하지요."',
        '볕이 장부 끝에 닿자, 그가 장부를 한 뼘 그늘 쪽으로 끌어당긴다.',
        '"실례. 종이가 바래면 곤란해서요. 다른 이유는 없습니다."',
        '그가 펜 끝으로 빈 칸을 톡톡 두드린다.',
        '"그런데 {me}, 당신은 아직 칸이 비어 있군요. 흥미롭습니다."',
        '"이 장부의 숫자는 매일 바뀌지요. 솔직히 조금 피곤한 일입니다."',
        '"그래서 저는 변하지 않는 것을 모읍니다. 금, 보석, 오래된 시계."',
        '"첫 거래는 늘 기억에 남지요. 손실이든 수익이든."',
      ],
      replies: [
        { say: '좋은 칸으로 채울게요', tier: 'great', face: 'smile', answer: '기대하지요. 장기 보유 후보로 적어 두겠습니다.' },
        { say: '잔고 말고 이름으로 기억해 줘요', tier: 'good', face: 'think', answer: '…드문 요청이군요. 이름 칸을 하나 더 그려 두지요.' },
        { say: '그냥 구경 왔어요', tier: 'meh', face: 'calm', answer: '구경도 시장 조사입니다. 차는 무료입니다.' },
      ],
    },
    {
      title: '등불 아래의 산책',
      hint: '저녁 무렵(게임 시각 오후 다섯 시부터 아홉 시) 시장 거리로 가 보세요. 무잔이 산책 중이래요.',
      need: { days: 3, points: 20, visit: { area: 'market', from: 17, to: 21 } },
      scene: [
        '장이 닫힌 시장 거리. 등불이 하나둘 켜진다.',
        '무잔이 처마 그늘을 따라 천천히 걷고 있다. 망토가 조용히 흔들린다.',
        '"오셨군요. 약속보다 조금 이르군요. 좋은 습관입니다."',
        '"빵집 줄의 길이가 내일의 시세입니다. 보이십니까."',
        '"낮에는 볕이 너무 밝아서요. 이 시간이 제게는 하루의 장입니다."',
        '꽃집 앞에서 그가 걸음을 멈춘다. 닫힌 덧문 틈으로 꽃 냄새가 샌다.',
        '"푸른 동백이 들어오면 알려 달라고 몇 해째 부탁해 두었습니다."',
        '"송이째 지지도 않고, 빛도 바래지 않는 꽃이라더군요. 소문으로는."',
        '"그 꽃 하나면 금고가 완성될 것 같았습니다. 흠 없는 금고가."',
        '그가 다시 걷는다. 이번엔 걸음을 늦춘다. 당신의 보폭에 맞추듯이.',
        '"…오늘은 시세 이야기를 덜 했군요. 이상한 저녁입니다."',
      ],
      replies: [
        { say: '내일도 이 시간에 걸어요', tier: 'great', remember: 'lantern-walk', face: 'shy', answer: '…약속으로 받겠습니다. 제 장부에서 가장 정확한 일정이 되겠군요.' },
        { say: '줄이 긴 가게 맞혀 볼게요', tier: 'good', remember: 'lantern-walk', face: 'laugh', answer: '좋습니다. 틀리면 차를 사시고, 맞히면 제가 사지요.' },
        { say: '다리 아파요', tier: 'meh', remember: 'lantern-walk', answer: '그럼 저 벤치까지만. 쉬는 것도 전략입니다.' },
      ],
    },
    {
      title: '붉은 동백 한 송이',
      hint: '무잔은 송이째 지는 붉은 동백을 좋아해요. 동백꽃 한 송이를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'camellia', take: true } },
      scene: [
        '동백꽃을 내밀자 무잔의 손이 잠깐 멈춘다.',
        '"…붉은 동백이군요. 어떻게 아셨습니까. 제 장부에도 없는 정보인데."',
        '그가 꽃을 모자 띠에 꽂아 본다. 흰 모자 위에서 붉은빛이 선명하다.',
        '꺼진 전광판 유리에 모자를 비춰 보고는, 짧게 고개를 끄덕인다.',
        '"이 꽃은 흐트러지지 않고 송이째 떨어지지요. 저는 그 품위를 삽니다."',
        '"다만 이 꽃도 며칠이면 집니다. 그게 늘 아쉬웠지요."',
        '"그래서 지지 않는 푸른 꽃을 찾았습니다. 붉은 것은 그 사이의 위안이고요."',
        '그런데 그가 꽃잎을 한참 들여다본다. 손끝이 아주 조심스럽다.',
        '"이상하군요. 곧 질 꽃인데, 오늘은 그 점이 더 귀해 보입니다."',
        '"값을 치르려 했는데, 이건 시세가 없군요. 곤란합니다."',
      ],
      replies: [
        { say: '값은 안 받아요. 선물이에요', tier: 'great', remember: 'red-camellia', face: 'shy', answer: '…선물이라. 그럼 계산하지 않겠습니다. 오늘만, 아니 이번만은.' },
        { say: '모자에 잘 어울려요', tier: 'good', remember: 'red-camellia', face: 'smile', answer: '그렇다면 오늘 산책은 이대로 하지요. 다들 쳐다보겠군요.' },
        { say: '시세로 쳐 주세요', tier: 'meh', remember: 'red-camellia', face: 'think', answer: '…시세를 드리지요. 다만 장부엔 선물로 적겠습니다.' },
      ],
    },
    {
      title: '멈추지 않는 시계',
      hint: '무잔이 회중시계 태엽 감는 걸 함께 보면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'pocket-watch' },
      scene: [
        '문 닫은 객장. 전광판이 꺼지고, 무잔이 창가 그늘에 앉아 있다.',
        '구석의 축음기가 낮게 돌고, 손바닥 위에서 낡은 회중시계가 째깍거린다.',
        '"이 시계는 폭락장을 여러 번 같이 넘었습니다. 한 번도 멈춘 적이 없지요."',
        '"변하지 않는 것만 곁에 두었습니다. 사람은 변하니까요. 그게 원칙이었지요."',
        '그가 시계 뒤판을 열어 보인다. 안쪽 톱니들이 저마다 다른 빛이다.',
        '"…고백하자면, 이 톱니는 오른 씨가 지난겨울에 새로 깎아 준 겁니다."',
        '"태엽도 두 번 갈았고, 유리도 바꿨지요. 처음 그대로인 건 거의 없습니다."',
        '"그런데도 저는 이걸 같은 시계라고 부릅니다. 이상하지 않습니까."',
        '"바뀌면서도 계속 가는 것. 어쩌면 그게 변하지 않는다는 뜻일지도요."',
        '그가 시계를 당신 쪽으로 내민다. "감아 보시겠습니까. 천천히."',
      ],
      replies: [
        { say: '천천히, 일정하게 감을게요', tier: 'great', face: 'shy', answer: '…잘하시는군요. 원칙에 예외를 하나 적어 두어야겠습니다.' },
        { say: '망가뜨리면 어떡해요', tier: 'good', face: 'smile', answer: '그럼 같이 고치면 되지요. 혼자 고치는 것보다 오래 걸리겠지만요.' },
        { say: '시계는 잘 몰라요', tier: 'meh', face: 'calm', answer: '괜찮습니다. 제 손 위에 손을 얹으시지요. 감는 건 제가 하겠습니다.' },
      ],
    },
    {
      title: '값을 매길 수 없는 것',
      hint: '무잔과 아주 가까워지면 그가 장부를 덮고 이야기해요. 그 뒤엔 꽃다발 시세도 달라질지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '밤의 객장. 무잔이 상담 장부를 펼쳐 당신 이름이 적힌 칸을 보여 준다.',
        '칸은 여전히 비어 있다. 숫자가 하나도 없다.',
        '"몇 번이나 적으려 했습니다. 그런데 펜이 멈추더군요."',
        '"당신은 올 때마다 조금씩 다릅니다. 봄엔 흙냄새, 여름엔 바다 냄새."',
        '"처음엔 그게 불안했습니다. 변하는 것은 값을 매기기 어려우니까요."',
        '"그런데 요즘은 오늘 당신이 어떤 얼굴로 올지 기다리게 됩니다."',
        '그가 펜을 내려놓고 장부를 덮는다. 아주 천천히.',
        '"{me}, 당신은 제 장부에 적을 수 없는 유일한 자산입니다."',
        '"변동성은 아름답지요. 남의 것이 아닌데도 그렇게 느낀 건 처음입니다."',
        '"요즘은 꽃집 앞에서 푸른 동백보다 꽃다발 시세를 먼저 봅니다."',
        '"…이상하지요. 저도 제가 조금 변한 것 같습니다."',
      ],
      replies: [
        { say: '그 칸은 비워 두세요', tier: 'great', face: 'shy', answer: '…그러지요. 꽃다발이라면, 계산하지 않고 받을 수 있을 것 같습니다.' },
        { say: '비싸게 적어 주세요', tier: 'good', face: 'laugh', answer: '그럴 수 없다는 게 문제입니다. 어떤 숫자도 모자라서요.' },
        { say: '피곤해서 먼저 갈게요', tier: 'meh', face: 'calm', answer: '바래다 드리지요. 이 이야기는 장이 다시 열리면 마저 하겠습니다.' },
      ],
    },
    {
      title: '평생 보유',
      hint: '무잔과 연인이 되면 마지막 이야기가 열려요. 동트기 직전, 그가 오래 찾던 꽃을 함께 보게 될지도 몰라요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '동트기 직전의 시장 거리. 등불이 하나둘 꺼진다.',
        '평소라면 벌써 객장에 들어갔을 무잔이 꽃집 앞에 서 있다.',
        '"해 뜨기 전까지만입니다. 오늘은 그 마지막 몇 분을 보고 싶어서요."',
        '꽃집 처마 밑 화분에 흰 동백 한 그루. 새벽빛이 꽃잎을 파랗게 물들인다.',
        '"…보이십니까. 푸른 동백입니다. 이 시간에만, 아주 잠깐."',
        '"변하지 않는 푸른 꽃을 찾았는데, 변하는 빛 속에 있었군요."',
        '"저는 이 시간을 늘 피해 다녔습니다. 그러니 못 봤던 거지요."',
        '그가 붉은 동백을 꽂은 모자를 벗어 든다. 하늘이 조금씩 밝아진다.',
        '"오래 찾던 푸른 꽃보다 당신을 먼저 찾았습니다. 순서가 바뀌었지요."',
        '"불만은 없습니다. 오히려 계산이 처음으로 깔끔하게 맞습니다."',
        '"{me}, 평생 보유할 종목은 하나면 충분하더군요. 매도는 없습니다."',
        '"계절이 바뀌고 우리도 바뀌겠지요. 그 변동성까지 사겠습니다."',
        '"반지라도 들고 오신다면… 그날은 장을 닫겠습니다. 하루 종일."',
      ],
      replies: [
        { say: '평생 같이 걸어요', tier: 'great', face: 'shy', answer: '…약속입니다. 볕이 드는 날엔 망토를 함께 쓰지요. 한 그늘에 둘이 드는 겁니다.' },
        { say: '장부엔 뭐라고 적어요?', tier: 'good', face: 'laugh', answer: '적지 않습니다. 영업 비밀이니까요. 당신과 저만 아는.' },
        { say: '조금 더 천천히요', tier: 'meh', face: 'smile', answer: '좋습니다. 장기 보유는 서두르지 않는 법이지요.' },
      ],
    },
  ],
  after: [
    '오늘 상담은 여기까지입니다. 과도한 정보는 판단을 흐리지요.',
    '또 오셨군요. 반갑습니다. 차는 늘 같은 맛으로 준비해 두지요.',
    '할 말이 남으셨다면 내일 시가 전에 오십시오. 기다리겠습니다.',
    '해가 지면 다시 걷지요. 그때는 시세 이야기를 줄이겠습니다. 아마도.',
    '아직 계시는군요. 장부는 덮었습니다. 남은 건 사적인 시간이지요.',
    '오늘 대화는 이미 체결되었습니다. 다만 차는 몇 잔이든 무료입니다.',
    '회중시계가 또 당신 쪽을 가리키는군요. 고장은 아닐 겁니다.',
  ],
};
