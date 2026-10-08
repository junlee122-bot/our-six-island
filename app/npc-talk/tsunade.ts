// 츠나데 — 언덕 텃밭 "할머니". 겉모습은 젊은데 나이 얘기만 나오면 화낸다.
// 호탕하고 잔소리 많은 누님형 반말. 약초와 의술(진맥), 손가락 하나로 튕기는 괴력,
// 도박은 좋아하는데 늘 진다(미스 포츈에게 빚), 주점에선 "딱 한 잔만", 이마의
// 마름모 표식과 젊어 보이는 비결은 비밀, 돼지 톤톤과 잔소리꾼 조수, 한때 마을
// 대표였지만 서류는 질색, 다음 세대에 물려주는 마음. 나세라의 옛 스승, 가붕·럭스
// 남매를 돌본 동네 어른, 메르시와 의술 맞수. 원작 대사는 쓰지 않는다.
import type { NpcTalkBook } from './types.ts';

export const TSUNADE_TALK: NpcTalkBook = {
  npc: 'tsunade',
  memories: {
    'call-sister': '누님이라고 불렀어요',
    'age-secret': '젊음의 비결은 캐묻지 않기로 했어요',
    'one-drink': '딱 한 잔만 같이 하기로 했어요',
    'gamble-stop': '도박 좀 줄이라고 잔소리했어요',
    'luck-charm': '판에 갈 때 행운의 부적이 되어 주기로 했어요',
    'tonton': '돼지 톤톤과 친해졌어요',
    'paperwork': '서류 정리를 대신 도와주기로 했어요',
    'herb-learn': '약초 공부를 배우기로 했어요',
    'kimchi-help': '김장을 돕겠다고 했어요',
    'nasera-past': '나세라의 어린 시절 이야기를 들었어요',
    'strong-arm': '손가락 하나 괴력 시범을 봤어요',
    'pulse': '진맥을 받아 봤어요',
    'dawn-herbs': '새벽 텃밭에서 약초를 함께 캤어요',
    'kimchi-gift': '김치를 선물했어요',
    'seed-pouch': '씨앗 주머니를 물려받았어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 다닌 날을 이야기했어요',
    'bday-plan': '생일에 보약을 달여 준대요',
  },
  talks: [
    {
      id: 'age',
      open: '{me}, 하나만 묻자. 내가 몇 살로 보이냐? 신중하게 대답해라.',
      replies: [
        { say: '누님, 내 또래 같은데?', tier: 'great', remember: 'call-sister', face: 'laugh', answer: '하하하! 그렇지? 역시 넌 눈이 있어. 나물 한 봉지 더 싸 준다!' },
        { say: '나이는 안 물어볼게', tier: 'good', remember: 'age-secret', face: 'smile', answer: '…기특하네. 그 예의 끝까지 지켜라. 약속이다.' },
        { say: '할머니라던데?', tier: 'meh', face: 'sorry', answer: '누, 누가 그래! 이름 대! 손가락 하나로 언덕 너머까지 보내 줄 테니!' },
      ],
    },
    {
      id: 'one-drink',
      open: '오늘 일 끝나면 주점 가자. 딱 한 잔만이야. 진짜 한 잔.',
      replies: [
        { say: '딱 한 잔만이다?', tier: 'great', remember: 'one-drink', face: 'laugh', answer: '그럼! 한 잔이야. …두 잔부터는 내가 세지 말자.' },
        { say: '안주는 내가 살게', tier: 'good', face: 'smile', answer: '오, 통 크네! 해물파전 하나. 그거면 한 잔이 길어진다.' },
        { say: '술 줄이라며', tier: 'meh', face: 'think', answer: '의사가 하는 말이랑 의사가 하는 짓은 다른 거야. 알아 둬.' },
      ],
    },
    {
      id: 'gamble',
      open: '어젯밤 카지노 말이야. …아니다. 묻지 마. 아무 일도 없었어.',
      replies: [
        { say: '또 잃었구나', tier: 'good', face: 'sorry', answer: '…티 나냐? 다음 판은 딴다. 분명히. 아마도.' },
        { say: '그 돈으로 씨앗 사자', tier: 'great', remember: 'gamble-stop', face: 'think', answer: '…너 내 조수랑 똑같은 소리 하네. 그래, 이번 달은 참아 볼게.' },
        { say: '다음엔 나도 데려가', tier: 'meh', remember: 'luck-charm', face: 'laugh', answer: '좋아! 네가 옆에 있으면 운이 올지도. …잃어도 내 탓 하지 마.' },
      ],
    },
    {
      id: 'herbs',
      open: '이 풀 알아? 길가에 흔한데 달이면 기침에 직방이야.',
      replies: [
        { say: '약초 더 가르쳐 줘', tier: 'great', remember: 'herb-learn', face: 'wow', answer: '오! 배우겠다는 녀석은 오랜만이다. 수첩 꺼내. 잔소리 각오하고.' },
        { say: '그냥 잡초 같은데', tier: 'meh', face: 'calm', answer: '잡초라는 풀은 없어. 이름을 모르는 풀이 있을 뿐이지.' },
        { say: '맛은 어때?', tier: 'good', face: 'laugh', answer: '쓰지! 몸에 좋은 건 원래 써. 인생도 그렇고.' },
      ],
    },
    {
      id: 'tonton',
      open: '톤톤 봤어? 우리 집 돼지. 아까부터 네 신발 냄새 맡고 있잖아.',
      replies: [
        { say: '톤톤, 안녕!', tier: 'great', remember: 'tonton', face: 'laugh', answer: '꿀! …봐, 대답했다. 톤톤이 사람한테 대답하는 일 거의 없어.' },
        { say: '옷 입은 돼지네', tier: 'good', face: 'smile', answer: '조수가 입혀 준 거야. 나보다 옷이 많아. 억울하다.' },
        { say: '돼지는 좀…', tier: 'meh', face: 'sorry', answer: '톤톤 앞에서 그런 말 하지 마. 쟤 은근히 상처받아.' },
      ],
    },
    {
      id: 'paper',
      open: '조수가 또 서류 더미를 들고 왔어. 텃밭 대장이 서류는 왜 써야 하냐.',
      replies: [
        { say: '내가 정리 도울게', tier: 'great', remember: 'paperwork', face: 'wow', answer: '진짜? 너 천사냐? 끝나면 약초차 끓여 줄게. 아니, 한 잔 산다!' },
        { say: '마을 대표였잖아', tier: 'good', face: 'think', answer: '그래서 질린 거야. 도장만 수천 번 찍었어. 손목이 아직 기억해.' },
        { say: '그냥 미루자', tier: 'meh', face: 'laugh', answer: '그게 내 특기야! …근데 조수가 울어서 안 돼.' },
      ],
    },
    {
      id: 'finger',
      open: '이 돌 보여? 밭 가운데 박혀서 안 빠져. 비켜 봐. 손가락 하나면 돼.',
      replies: [
        { say: '보여 줘, 누님!', tier: 'great', remember: 'strong-arm', face: 'laugh', answer: '자, 툭! …봐라, 날아갔지? 저 너머 숲까지 갔을 거다. 하하!' },
        { say: '같이 파내자', tier: 'good', face: 'smile', answer: '마음은 고맙다. 근데 그럼 해 진다. 뒤로 물러서.' },
        { say: '다치면 어떡해', tier: 'meh', face: 'think', answer: '의사가 다치면 웃음거리지. 걱정 마. 다쳐도 내가 고친다.' },
      ],
    },
    {
      id: 'nasera',
      open: '나세라 녀석, 어릴 때 규칙 외우느라 밥도 안 먹었어. 내가 떠먹였지.',
      replies: [
        { say: '어린 나세라 얘기 더 해 줘', tier: 'great', remember: 'nasera-past', face: 'laugh', answer: ['울면서도 책은 안 놓더라. 고집은 그때부터야.', '…지금은 나보다 똑똑해. 스승 체면이 말이 아니다.'] },
        { say: '좋은 스승이었네', tier: 'good', face: 'shy', answer: '잔소리만 많았지. 그래도 잘 커 줬어. 그거면 됐어.' },
        { say: '나세라가 싫어하겠다', tier: 'meh', face: 'laugh', answer: '그러니까 재밌지! 나세라한텐 비밀이다.' },
      ],
    },
    {
      id: 'siblings',
      open: '가붕이랑 럭스 남매 알지? 걔들 코 흘릴 때부터 내가 봐 줬어.',
      replies: [
        { say: '그래서 다들 누님 따르는구나', tier: 'great', face: 'shy', answer: '따르긴. 잔소리 피해서 도망 다니지. …그래도 가끔 나물 받으러 와.' },
        { say: '어릴 땐 어땠어?', tier: 'good', answer: '가붕은 지붕에서 뛰어내리고, 럭스는 그걸 말리다 같이 떨어지고.' },
        { say: '그럼 진짜 할머니네', tier: 'meh', face: 'sorry', answer: '…방금 그 말, 못 들은 걸로 해 주마. 딱 한 번이다.' },
      ],
    },
    {
      id: 'pulse',
      open: '{me}, 손목 이리 줘 봐. 얼굴빛이 영 마음에 안 들어.',
      replies: [
        { say: '의사 선생님, 부탁해요', tier: 'great', remember: 'pulse', face: 'smile', answer: '…맥은 괜찮네. 잠이 모자라. 오늘은 일찍 자. 의사 명령이다.' },
        { say: '돈 받는 거 아니지?', tier: 'good', face: 'laugh', answer: '진찰비는 공짜야. 잔소리도 공짜고. 둘 다 듬뿍 준다.' },
        { say: '난 멀쩡해', tier: 'meh', face: 'think', answer: '멀쩡하다는 사람이 제일 위험해. 그 말 들으면 더 보고 싶어진다.' },
      ],
    },
    {
      id: 'kimchi',
      open: '올겨울 김장 인원 모집 중이다. 배추 백 포기. 손 있으면 다 와.',
      replies: [
        { say: '나도 낄게!', tier: 'great', remember: 'kimchi-help', face: 'laugh', answer: '좋다! 고무장갑 챙겨 와. 끝나면 수육에 김치 한 쌈이다.' },
        { say: '백 포기나?', tier: 'good', face: 'wow', answer: '언덕 사람들 다 나눠 먹어야지. 내 손맛은 동네 재산이야.' },
        { say: '사 먹으면 안 돼?', tier: 'meh', face: 'sorry', answer: '…그 말은 언덕에서 하지 마라. 배추들이 들어.' },
      ],
    },
    {
      id: 'mark',
      open: '왜 내 이마를 봐? 이 마름모? …그냥 점이야. 아주 멋있는 점.',
      replies: [
        { say: '안 캐물을게', tier: 'great', remember: 'age-secret', face: 'shy', answer: '…너 참 편한 녀석이다. 언젠가 말해 줄지도. 언젠가.' },
        { say: '진짜 멋있어', tier: 'good', face: 'laugh', answer: '그렇지? 따라 그리는 녀석들도 있었어. 다 지워졌지만.' },
        { say: '그려 넣은 거야?', tier: 'meh', face: 'think', answer: '…비밀이다. 젊음의 비결이랑 같은 서랍에 넣어 뒀어.' },
      ],
    },
    {
      id: 'next-gen',
      when: { ch: 3 },
      open: '{me}, 텃밭은 내 거지만 영원히 내 건 아니야. 언젠가 누가 이어 받겠지.',
      replies: [
        { say: '내가 이어 받을게', tier: 'great', face: 'shy', answer: '…말 쉽게 하지 마. 잔소리 백 년치가 따라온다. 그래도 하겠냐?' },
        { say: '아직 한참 남았어', tier: 'good', face: 'laugh', answer: '그럼! 나 아직 쌩쌩하다. …나이 얘기 아니다!' },
        { say: '나세라 주면 되겠다', tier: 'meh', face: 'think', answer: '그 녀석은 책밭을 갈아야지. 흙밭은 다른 녀석 몫이야.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비다! 물 안 줘도 되는 날은 땡잡은 날이지. 부침개 부칠 건데 먹고 가.',
      replies: [
        { say: '해물 듬뿍 넣어 줘', tier: 'great', face: 'laugh', answer: '욕심 많네! 좋아, 오징어 두 마리 다 넣는다. 딱 한 잔도 곁들이고.' },
        { say: '내가 반죽할게', tier: 'good', answer: '오, 손목 힘 좀 보자. …괜찮네. 우리 조수보다 낫다.' },
        { say: '비 오는데 밭은 괜찮아?', tier: 'meh', face: 'think', answer: '고랑 잘 내 놨어. 걱정은 고맙다만 부침개나 먹어.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈 온다! 김장 날이다! 배추 절일 사람 손 들어!',
      replies: [
        { say: '저요!', tier: 'great', remember: 'kimchi-help', face: 'laugh', answer: '좋다! 소금 들고 와. 허리 아프다고 엄살 부리면 침 놔 준다.' },
        { say: '눈싸움부터 하자', tier: 'good', face: 'wow', answer: '나랑? 각오해라. 눈뭉치가 아니라 대포알이 날아간다.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '일찍 일어났네! 이슬 마르기 전에 캔 약초가 제일 약효가 좋아.',
      replies: [
        { say: '같이 캘게', tier: 'great', remember: 'herb-learn', face: 'smile', answer: '좋다. 뿌리는 남기고 잎만. 내년에도 나게 둬야 해.' },
        { say: '졸려 죽겠어', tier: 'meh', face: 'laugh', answer: '하하! 그럼 이 약초차 마셔. 눈이 번쩍 뜨일 거다. 쓰긴 써.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening', weather: ['sunny', 'cloudy'] },
      open: '노을 보니 목이 칼칼하네. 주점 가서 딱 한 모금만 축일까.',
      replies: [
        { say: '한 모금만이다?', tier: 'great', remember: 'one-drink', face: 'laugh', answer: '그럼! 한 모금이 한 잔 되고 한 잔이 한 병 되는 건 내 탓 아니야.' },
        { say: '오늘은 차로 하자', tier: 'good', face: 'think', answer: '…너도 잔소리꾼이네. 그래, 약초차. 대신 네가 끓여.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다! 오늘은 카지노 대신 노점 뽑기다. 그건 지는 게 아니라 노는 거야.',
      replies: [
        { say: '내가 대신 뽑아 줄게', tier: 'great', remember: 'luck-charm', face: 'wow', answer: '오! 너 손에 운이 붙었을지도. 꽝 나와도 원망 안 한다. 아마.' },
        { say: '뽑기도 도박이야', tier: 'meh', face: 'sorry', answer: '…조수랑 똑같은 소리 하지 마. 축제 날은 봐줘.' },
        { say: '같이 구경 가자', tier: 'good', face: 'smile', answer: '좋지! 군것질은 내가 쏜다. 오늘 아직 안 잃었거든.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '밭일 하고 왔구나. 손 좀 보자. …물집 잡혔네. 이리 와, 약 발라 줄게.',
      replies: [
        { say: '고마워, 누님', tier: 'great', remember: 'call-sister', face: 'shy', answer: '누님 소리 들으니 약이 더 잘 듣겠다. 장갑 끼고 해, 다음엔.' },
        { say: '이 정도는 괜찮아', tier: 'good', face: 'think', answer: '괜찮다가 덧나는 거야. 의사 말 들어. 가만히 있어.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물? 와, 반짝반짝하네! …이런 운은 왜 판에선 안 오냐.',
      replies: [
        { say: '흙이 정직해서 그래', tier: 'great', face: 'laugh', answer: '하하! 맞는 말이다. 흙은 속이지 않아. 패는 속이고.' },
        { say: '누님 텃밭 덕분이야', tier: 'good', face: 'shy', answer: '내 거름 비법 덕이지? 그래, 그런 걸로 하자.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '{fish}, 그게 오늘 잡은 거라고? 기록이라던데! 운 좀 나눠 줘!',
      replies: [
        { say: '손 잡아 줄게', tier: 'great', remember: 'luck-charm', face: 'laugh', answer: '옳지! 운 옮았다! 오늘 밤은… 아니, 오늘 밤도 참는다.' },
        { say: '매운탕 끓이자', tier: 'good', face: 'smile', answer: '좋지! 내 텃밭 고추랑 파 넣으면 끝내준다. 딱 한 잔도.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '{me}, 어깨가 축 처졌네. 이리 앉아. 약초차 한 잔이면 반은 낫는다.',
      replies: [
        { say: '나머지 반은?', tier: 'great', face: 'smile', answer: '내 잔소리 듣고 푹 자면 낫지. 그건 공짜로 듬뿍 준다.' },
        { say: '그냥 좀 피곤해', tier: 'good', answer: '피곤한 건 몸이 하는 말이야. 무시하지 마. 오늘은 일찍 들어가.' },
      ],
    },
    {
      id: 'op-lose',
      when: { recent: 'casinoLose' },
      open: '너도 카지노에서 잃었다며? …하하! 동지다! 위로주 한 잔 하자!',
      replies: [
        { say: '이제 끊을래', tier: 'great', remember: 'gamble-stop', face: 'think', answer: '…장하다. 나보다 낫네. 나도 따라 끊어 볼까. 이번 주만.' },
        { say: '다음엔 딸 거야', tier: 'meh', face: 'laugh', answer: '그 말 내가 몇십 년째 하는 거다. 조심해, 그 길 끝은 빚이야.' },
        { say: '딱 한 잔만이다', tier: 'good', remember: 'one-drink', face: 'smile', answer: '그럼! 진 사람끼리는 한 잔이 딱이지.' },
      ],
    },
    {
      id: 'op-win',
      when: { recent: 'casinoWin' },
      open: '너 카지노에서 땄다며? …조심해. 크게 따면 꼭 뭔가 터지더라.',
      replies: [
        { say: '그럼 누님 빚 갚자', tier: 'great', face: 'wow', answer: '…너 진짜 천사냐? 아니, 안 돼! 그건 내가 갚는다. 언젠가.' },
        { say: '미신이야', tier: 'meh', face: 'think', answer: '내가 딸 때마다 폭풍이 왔어. 미신이라기엔 너무 정확해.' },
      ],
    },
    {
      id: 'op-nasera',
      when: { bond: 'nasera' },
      open: '{other}, 만났냐? 걔 또 밥 거르고 일했지? 얼굴 보면 알아.',
      replies: [
        { say: '나물 갖다줄까?', tier: 'great', remember: 'nasera-past', face: 'smile', answer: '그래 줘. 내가 주면 사양하는데 네가 주면 받을 거야.' },
        { say: '열심히 하더라', tier: 'good', answer: '열심히도 정도껏이지. 스승 닮아서 고집이 세.' },
      ],
    },
    {
      id: 'op-rose',
      when: { bond: 'rose' },
      open: '{other} 만났어? …혹시 내 빚 얘기 했냐? 했지? 표정 보니 했네.',
      replies: [
        { say: '아무 말도 안 했어', tier: 'great', face: 'laugh', answer: '거짓말 못 하는 얼굴이다. 그래도 고맙다. 의리 있네.' },
        { say: '얼마나 빌렸어?', tier: 'meh', face: 'sorry', answer: '…그건 의사로서 말할 수 없어. 환자 비밀이야. 내가 환자다.' },
        { say: '다음 판엔 이겨', tier: 'good', face: 'wow', answer: '그렇지! 그 여자 웃는 얼굴 한 번은 일그러뜨릴 거다.' },
      ],
    },
    {
      id: 'op-siblings',
      when: { bond: 'gabung' },
      open: '가붕 만났지? 걔 아직도 지붕 위 좋아하냐? 어릴 때랑 똑같네.',
      replies: [
        { say: '누님 얘기 하더라', tier: 'great', face: 'shy', answer: '…뭐라고? 잔소리 무섭다고? 하하, 그래도 기억은 하네.' },
        { say: '여전히 시끄러워', tier: 'good', face: 'laugh', answer: '그래야 가붕이지. 조용하면 어디 아픈 거야.' },
      ],
    },
    {
      id: 'op-lux',
      when: { bond: 'lux' },
      open: '럭스 봤어? 그 애 밥은 잘 먹고 다니냐? 늘 남 챙기느라 자기는 굶어.',
      replies: [
        { say: '누님이 챙겨 주자', tier: 'great', face: 'smile', answer: '그래야지. 반찬 싸 놓을 테니 네가 좀 전해 줘.' },
        { say: '잘 먹던데', tier: 'good', answer: '다행이다. 걔 앞에선 내가 걱정한다고 말하지 마.' },
      ],
    },
    {
      id: 'op-mercy',
      when: { bond: 'mercy' },
      open: '{other}, 만났구나. 또 새 치료법 자랑했지? 흥, 약초는 내가 위야.',
      replies: [
        { say: '둘 다 대단해', tier: 'great', face: 'think', answer: '…그건 인정한다. 그 사람 손은 정확해. 본인 앞에선 말 안 하지만.' },
        { say: '누님이 최고지', tier: 'good', face: 'laugh', answer: '그렇지! 다음 의술 겨루기 땐 응원 와라.' },
      ],
    },
    {
      id: 'op-carpenter',
      when: { bond: 'carpenter' },
      open: '{other}, 만났어? 울타리 고쳐 준다더니 망치만 들고 노래 부르고 있더라.',
      replies: [
        { say: '내가 거들게', tier: 'great', face: 'smile', answer: '그래 줘. 대신 노래는 같이 부르지 마. 울타리가 무너진다.' },
        { say: '누님이 튕기면 되잖아', tier: 'good', face: 'laugh', answer: '내가 하면 울타리가 아니라 담장 하나가 날아가.' },
      ],
    },
    {
      id: 'op-haku',
      when: { bond: 'haku' },
      open: '하쿠 만났어? 내가 가르쳐 준 약초 거름 덕에 과일이 달아졌대. 기특해.',
      replies: [
        { say: '누님 비법 나도 알려 줘', tier: 'great', remember: 'herb-learn', face: 'wow', answer: '좋다. 쑥이랑 깻묵이 기본이야. 나머지는 수업료로 막걸리 한 병.' },
        { say: '하쿠 과일 맛있더라', tier: 'good', face: 'smile', answer: '그렇지? 스승 덕이다. 하쿠한텐 내가 그랬다고 말하지 마.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-drink',
      when: { mem: 'one-drink', time: ['evening', 'night'] },
      use: 'one-drink',
      open: '딱 한 잔 하기로 했던 거, 기억하지? 오늘이 그날이다. 한 잔만이야.',
      replies: [
        { say: '정말 한 잔만!', tier: 'great', face: 'laugh', answer: '알았어, 알았어! …한 잔을 아주 큰 잔으로 시킬 거다.' },
        { say: '난 식혜로 할게', tier: 'good', face: 'smile', answer: '그래, 건강한 녀석. 그럼 나도 반 잔만. 진짜로.' },
      ],
    },
    {
      id: 'cb-gamble',
      when: { mem: 'gamble-stop' },
      use: 'gamble-stop',
      open: '너 잔소리 듣고 일주일 카지노 안 갔다. 칭찬해. 지금 당장.',
      replies: [
        { say: '대단해, 누님!', tier: 'great', face: 'shy', answer: '그, 그렇지? 이 돈으로 씨앗 샀어. 텃밭이 판보다 이자가 좋네.' },
        { say: '일주일만?', tier: 'meh', face: 'sorry', answer: '…일주일이 얼마나 긴 줄 알아? 나한텐 백 년이었다.' },
      ],
    },
    {
      id: 'cb-tonton',
      when: { mem: 'tonton' },
      use: 'tonton',
      open: '톤톤이 너 오는 시간만 되면 문 앞에 앉아 있어. 무슨 짓을 한 거야.',
      replies: [
        { say: '간식 좀 줬어', tier: 'good', face: 'laugh', answer: '역시! 쟤 먹는 걸로 사람 고른다. 근데 너 좋아하는 건 진짜야.' },
        { say: '톤톤이랑 친구야', tier: 'great', face: 'smile', answer: '쟤 친구는 나랑 조수뿐이었는데. 셋 됐네. 잘 부탁한다.' },
      ],
    },
    {
      id: 'cb-paper',
      when: { mem: 'paperwork' },
      use: 'paperwork',
      open: '서류 도와준다던 약속, 오늘 지켜 줄 수 있냐? 조수가 문 앞에서 기다린다.',
      replies: [
        { say: '도장은 내가 찍을게', tier: 'great', face: 'laugh', answer: '하하! 살았다! 끝나면 해물파전에 한 잔. 오늘은 내가 쏜다.' },
        { say: '누님도 같이 해', tier: 'good', face: 'sorry', answer: '…알았어, 알았어. 옆에서 도장 뚜껑은 열어 줄게.' },
      ],
    },
    {
      id: 'cb-kimchi',
      when: { mem: 'kimchi-help', season: ['autumn', 'winter'] },
      use: 'kimchi-help',
      open: '김장 돕는다고 했지? 배추 절여 놨다. 오늘 오후 비워 둬.',
      replies: [
        { say: '고무장갑 챙겨 왔어', tier: 'great', face: 'laugh', answer: '준비성 봐라! 첫 김치 한 쌈은 네 입에 넣어 준다.' },
        { say: '허리 괜찮을까', tier: 'good', face: 'think', answer: '끝나고 내가 꾹꾹 눌러 줄게. 아파도 참아.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}라며? 그거랑 잘 맞는 약초가 있나 찾아봤어.',
      replies: [
        { say: '역시 누님이야', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '그래, 그래. 다음에 갖다줄게. 쓰다고 뱉지만 마.' },
        { say: '약초랑 맞을까?', tier: 'good', remember: 'taste-heard', face: 'think', answer: '뭐든 약이 돼. 많이 먹으면 독이고. 그게 비결이야.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 나갔을 때 말이야. 네가 내 걸음 따라오느라 헉헉대더라.',
      replies: [
        { say: '누님이 너무 빨라', tier: 'great', remember: 'outing-talk', face: 'laugh', answer: '하하! 나이 탓이 아니라 체력 탓이다. 다음엔 천천히 걸어 줄게.' },
        { say: '다음에도 가자', tier: 'good', remember: 'outing-talk', face: 'smile', answer: '그래. 다음엔 약초 캐러 가자. 바구니는 네가 들어.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '곧 네 생일이지? 보약 한 첩 달여 줄게. 쓰다고 투정 부리지 마.',
      replies: [
        { say: '꿀 넣어 줘', tier: 'great', remember: 'bday-plan', face: 'laugh', answer: '하하! 응석은. 그래, 생일이니까 꿀 한 숟갈만 봐준다.' },
        { say: '산삼도 넣어?', tier: 'good', remember: 'bday-plan', face: 'wow', answer: '욕심도 많다! 그건 결혼 선물 때나. …방금 건 농담이다.' },
      ],
    },
  ],
  chapters: [
    {
      title: '텃밭 의사',
      hint: '한 번 이야기를 나누면 츠나데가 진맥을 해 줘요.',
      need: { days: 1 },
      scene: [
        '츠나데가 호미를 내려놓고 내 손목을 덥석 잡는다.',
        '"가만있어. …음, 맥은 튼튼한데 밥을 대충 먹네. 딱 보면 알아."',
        '"나 츠나데다. 언덕 텃밭이 내 구역이고, 아픈 데 있으면 나한테 와."',
        '"단, 할머니라고 부르면 진료 거부다. 알겠지?"',
      ],
      replies: [
        { say: '알겠어요, 누님!', tier: 'great', remember: 'call-sister', face: 'laugh', answer: '하하! 말귀 알아듣는 녀석이네. 나물 한 줌 싸 줄게.' },
        { say: '진찰비는요?', tier: 'good', remember: 'pulse', face: 'smile', answer: '공짜다. 대신 잔소리는 평생 따라다닌다.' },
        { say: '그럼 뭐라고 불러요?', tier: 'meh', face: 'think', answer: '누님. 그 외엔 다 틀렸어. 외워.' },
      ],
    },
    {
      title: '새벽 약초밭',
      hint: '새벽(게임 시각 새벽 다섯 시부터 여덟 시) 뒷산 언덕 텃밭에 가 보세요. 약초를 캐러 간대요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 5, to: 8 } },
      scene: [
        '안개 낀 새벽 언덕. 츠나데가 바구니를 끼고 이슬 젖은 풀 사이에 쭈그려 있다.',
        '"왔네! 늦을 줄 알았는데. 이 시간 약초가 제일 약효가 좋아."',
        '"이건 열 내리는 풀, 이건 잠 오는 풀. 저건 독이야. 만지지 마."',
        '톤톤이 코로 흙을 파더니 작은 뿌리 하나를 물고 온다.',
        '"…이 녀석이 나보다 잘 찾는다니까. 비밀이다."',
      ],
      replies: [
        { say: '톤톤, 최고야!', tier: 'great', remember: 'dawn-herbs', face: 'laugh', answer: '꿀! …봐, 좋아한다. 오늘 캔 거 반은 너 줄게.' },
        { say: '독초는 어떻게 구별해?', tier: 'good', remember: 'dawn-herbs', face: 'think', answer: '잎 뒷면을 봐. 털이 있으면 일단 의심해. 공부 많이 해야 돼.' },
        { say: '너무 이르다…', tier: 'meh', remember: 'dawn-herbs', face: 'calm', answer: '젊은 녀석이 왜 그래! …아, 나도 젊다. 둘 다 젊다.' },
      ],
    },
    {
      title: '김치 한 통',
      hint: '츠나데는 김치를 좋아해요. 김치를 가지고 언덕 텃밭에 가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'kimchi', take: true } },
      scene: [
        '김치 통을 내밀자 츠나데가 뚜껑부터 열어 냄새를 맡는다.',
        '"…잘 익었네. 누가 담갔는지 손맛이 좋아."',
        '"옛날엔 내가 동네 김치를 다 담갔어. 마을 대표 시절에도 김장 날만은 좋았지."',
        '"서류는 다 잊어도 이 냄새는 안 잊혀. 신기하지."',
        '그녀가 한 가닥 집어 내 입에 쏙 넣어 준다.',
      ],
      replies: [
        { say: '누님 김치가 더 맛있겠다', tier: 'great', remember: 'kimchi-gift', face: 'shy', answer: '…말은 잘한다. 올겨울엔 너한테 내 비법 다 알려 준다.' },
        { say: '같이 밥 먹자', tier: 'good', remember: 'kimchi-gift', face: 'smile', answer: '좋지! 밥 두 공기 퍼 와. 아니, 세 공기. 톤톤 몫.' },
        { say: '시장에서 샀어', tier: 'meh', remember: 'kimchi-gift', face: 'think', answer: '…그래도 고르는 눈은 있네. 고맙다.' },
      ],
    },
    {
      title: '약초 수첩',
      hint: '츠나데에게 약초를 배우겠다고 하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'herb-learn' },
      scene: [
        '해 질 녘 툇마루. 츠나데가 손때 묻은 수첩을 내 무릎에 툭 올린다.',
        '"내가 평생 모은 약초 기록이야. 나세라한테도 다 안 보여 줬어."',
        '"글씨가 엉망이지? 서류는 싫어도 이건 하루도 안 빼고 썼어."',
        '"…배우겠다고 한 녀석은 오랜만이야. 그래서 너한테 주는 거야."',
      ],
      replies: [
        { say: '하나도 안 빼고 배울게', tier: 'great', face: 'shy', answer: '…그 말 잊지 마. 시험도 본다. 틀리면 꿀밤이야. 손가락으로.' },
        { say: '이걸 나한테?', tier: 'good', face: 'smile', answer: '빌려주는 거야. 다 외우면 그때 진짜 준다.' },
        { say: '글씨를 못 읽겠어', tier: 'meh', face: 'laugh', answer: '하하! 조수도 그래. 내가 읽어 줄게. 옆에 앉아.' },
      ],
    },
    {
      title: '젊음의 비결',
      hint: '츠나데와 아주 가까워지면 그녀가 비밀 하나를 꺼내요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '밤 텃밭. 츠나데가 달빛 아래 이마의 마름모 표식을 손끝으로 만진다.',
        '"젊어 보이는 비결 말이야. …사실 대단한 거 없어."',
        '"늙는 게 무서웠던 거야. 아끼던 사람들이 먼저 떠나서."',
        '"근데 요즘은 좀 달라. 너랑 있으면 나이 같은 건 생각도 안 나."',
        '그녀가 고개를 돌린다. 오늘따라 한 잔도 안 마셨는데 얼굴이 붉다.',
      ],
      replies: [
        { say: '지금 그대로가 좋아', tier: 'great', face: 'shy', answer: '…바보. 꽃다발이라도 들고 와서 그런 말 해. 주점에서 평생 자랑하게.' },
        { say: '내가 오래 곁에 있을게', tier: 'good', face: 'smile', answer: '말했다? 의사 앞에서 한 약속은 처방전이야. 못 물러.' },
        { say: '그래서 몇 살인데?', tier: 'meh', face: 'sorry', answer: '…분위기 다 깨졌다. 손가락 한 번 맞고 갈래?' },
      ],
    },
    {
      title: '물려줄 씨앗',
      hint: '츠나데와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '가을 텃밭. 츠나데가 작은 천 주머니를 내 손에 쥐여 준다.',
        '"내 텃밭 씨앗이야. 대대로 받아 온 거. 다음 사람한테 물려주는 거지."',
        '"평생 누구한테 줄지 몰랐어. 이제 알겠네."',
        '"…같이 심자. 이 밭에서. 내년에도, 그다음 해에도. 나이 얘기는 빼고."',
      ],
      replies: [
        { say: '평생 같이 심자', tier: 'great', remember: 'seed-pouch', face: 'shy', answer: '…그래. 잔소리도 평생이다. 각오했지? 하하, 울긴 누가 울어.' },
        { say: '잘 키울게', tier: 'good', remember: 'seed-pouch', face: 'smile', answer: '키우는 게 아니라 같이 크는 거야. 사람도 밭도.' },
        { say: '주머니가 귀엽다', tier: 'meh', remember: 'seed-pouch', face: 'laugh', answer: '톤톤 옷 남은 천으로 만든 거야. 조수한텐 비밀이다.' },
      ],
    },
  ],
  after: [
    '오늘 얘기는 끝! 밭일 하러 간다. 너도 밥 챙겨 먹어.',
    '또 왔냐? 나물 한 줌 들고 가. 말은 내일 하자.',
    '딱 한 마디만 하자면, 일찍 자라. 의사 명령이다.',
    '어이, 할 말 다 했다니까! …카지노 가는 거 아니다. 산책이다.',
  ],
};
