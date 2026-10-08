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
    'legend-sucker': '전설의 봉이라는 별명을 들었어요',
    'necklace-tale': '목걸이를 물려준 이야기를 들었어요',
    'writer-friend': '글 쓰던 옛 동료 이야기를 들었어요',
    'loud-kid': '시끄럽던 꼬마와의 내기 이야기를 들었어요',
    'bottle-hunt': '숨긴 술병 소동에서 조수 편을 들었어요',
    'mercy-duel': '메르시와 함께 치료하면 좋겠다고 했어요',
    'debt-plan': '빚을 배추로 조금씩 갚자고 했어요',
    'tavern-tab': '주점 외상 장부를 확인하러 가기로 했어요',
    'grandpa-tree': '할아버지가 심은 언덕 나무 이야기를 들었어요',
    'mayor-why': '마을 대표를 맡게 된 사연을 들었어요',
    'small-bet': '내일 날씨로 약과 내기를 했어요',
    'spring-walk': '봄에 나물 캐러 같이 가기로 했어요',
    'summer-aid': '여름 더위 먹은 사람 돌보기를 거들기로 했어요',
    'seed-wise': '씨앗을 남겨 두는 마음을 알아줬어요',
    'date-talk': '내 방 화분에 약초 거름을 챙겨 줬어요',
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
    {
      id: 'nickname',
      open: ['{me}, 카지노 사람들이 나를 뭐라고 부르는지 알아?', '전설의 봉. …웃지 마라. 웃으면 손가락이다.'],
      replies: [
        { say: '전설은 아무나 못 되지', tier: 'great', remember: 'legend-sucker', face: 'laugh', answer: ['하하! 그렇지? 전설은 전설이야!', '봉이든 뭐든 앞에 전설이 붙으면 된 거다. 너 말 잘한다.'] },
        { say: '봉이 무슨 뜻인데?', tier: 'good', face: 'think', answer: ['하도 잃어서 내가 오면 다들 반긴다는 뜻이야.', '…설명하니까 더 처량하네. 그만 묻자.'] },
        { say: '푸하하하!', tier: 'meh', face: 'sorry', answer: '…웃었지? 웃었어. 이마 대. 딱 한 대만 튕긴다.' },
      ],
    },
    {
      id: 'necklace',
      open: ['목을 왜 자꾸 만지냐고? 습관이야. 거기 목걸이가 있었거든.', '할아버지한테 받은 거였어. 지금은 다른 녀석 목에 걸려 있지.'],
      replies: [
        { say: '누구한테 줬어?', tier: 'great', remember: 'necklace-tale', face: 'shy', answer: ['시끄럽던 꼬마. 나랑 내기해서 이긴 녀석이야.', '이긴 값으로 준 건 아니고… 그냥 걸어 주고 싶었어.', '그 녀석 목에서 반짝이는 걸 보면 마음이 놓이더라.'] },
        { say: '아깝지 않았어?', tier: 'good', face: 'think', answer: ['아깝지. 그래서 준 거야.', '아까운 걸 줘야 물려주는 거지. 남는 걸 주는 건 그냥 나눔이고.'] },
        { say: '새로 사면 되지', tier: 'meh', face: 'calm', answer: '…그런 물건이 아니야. 뭐, 너는 아직 모를 수도 있지.' },
      ],
    },
    {
      id: 'writer-friend',
      open: ['옛날에 글 쓰던 동료가 있었어. 엉터리 연애 소설만 써 대던 녀석.', '주점에서 그 녀석 책 펼친 사람을 보면 아직도 웃음이 나.'],
      replies: [
        { say: '어떤 사람이었어?', tier: 'great', remember: 'writer-friend', face: 'smile', answer: ['허풍쟁이에 넉살 좋고, 내 꿀밤에 수십 번은 나가떨어졌지.', '그래도 제자 하나는 끝내주게 키웠어. 그건 인정해.', '…요즘 같은 밤엔 그 녀석 허풍이 좀 듣고 싶네.'] },
        { say: '그 책 재밌어?', tier: 'good', face: 'laugh', answer: '읽어도 되는데 나한테 감상은 말하지 마. 얼굴 화끈거려.' },
        { say: '연애 소설은 별로야', tier: 'meh', face: 'think', answer: '나도 그 녀석한테 그렇게 말했어. 그래도 끝까지 다 읽었지. 비밀이다.' },
      ],
    },
    {
      id: 'loud-kid',
      open: ['예전에 시끄럽던 꼬마랑 내기를 한 적이 있어.', '"일주일 안에 연을 산꼭대기 위까지 띄우면 네가 이긴다." 그런 내기.'],
      replies: [
        { say: '꼬마가 이겼지?', tier: 'great', remember: 'loud-kid', face: 'laugh', answer: ['…어떻게 알았어? 그래, 이겼어. 손바닥이 실에 다 까졌는데도.', '평생 진 내기 중에 제일 기분 좋게 진 판이야.'] },
        { say: '일부러 져 준 거지?', tier: 'good', face: 'shy', answer: '그럴 리가. 나는 늘 진심으로 걸고 진심으로 져.' },
        { say: '애랑 내기를 해?', tier: 'meh', face: 'sorry', answer: '어른은 아이랑 내기하면 안 된다는 법 있냐! …있나? 조수한테 묻지 마.' },
      ],
    },
    {
      id: 'bottle-hunt',
      open: '조수가 내 술병을 또 숨겼어. {me}, 혹시 어디 있는지 못 봤냐?',
      replies: [
        { say: '난 조수 편이야', tier: 'great', remember: 'bottle-hunt', face: 'sorry', answer: ['…너까지? 이 동네엔 내 편이 하나도 없구나.', '좋아, 오늘은 약초차다. 아주 쓴 걸로. 너도 같이 마셔.'] },
        { say: '톤톤이 알 것 같은데', tier: 'good', face: 'wow', answer: ['톤톤! 이리 와! …꿀? 꿀꿀? 김장독 뒤라고?', '하하, 역시 우리 돼지야. 조수한텐 비밀이다.'] },
        { say: '같이 찾아 줄게', tier: 'meh', face: 'laugh', answer: '그래! …아니, 됐다. 그러다 조수 만나면 둘 다 혼나.' },
      ],
    },
    {
      id: 'mercy-rival',
      open: ['산기슭 메르시 의원 가 봤어? 반짝반짝한 기계가 잔뜩이더라.', '나는 손끝이랑 풀뿌리로 하는데. …흥, 누가 나은지 보자고.'],
      replies: [
        { say: '둘이 같이 하면 최고지', tier: 'great', remember: 'mercy-duel', face: 'think', answer: ['…같이? 그 사람이랑 나랑?', '하긴 지난 감기 돌 때 그 사람 처방이랑 내 약초차, 같이 쓰니 빨리 낫더라.', '본인한텐 말하지 마. 맞수는 맞수다워야지.'] },
        { say: '누님 손이 더 정확해', tier: 'good', face: 'laugh', answer: '그렇지! 그 말 의원 앞에서 크게 해 줘. …아니, 하지 마. 싸움 난다.' },
        { say: '기계가 더 빠르잖아', tier: 'meh', face: 'sorry', answer: '빠르다고 다 좋은 게 아니야. 맥은 기다려 줘야 들려.' },
      ],
    },
    {
      id: 'rose-debt',
      open: ['미스 포츈이 또 장부를 흔들고 갔어. 줄이 줄지를 않네.', '이자가 붙는다나. 바다 건너 온 사람은 셈도 짜.'],
      replies: [
        { say: '조금씩 같이 갚자', tier: 'great', remember: 'debt-plan', face: 'shy', answer: ['…같이? 네 돈으로 갚을 생각은 없어. 마음만 받을게.', '대신 오늘부터 밭에서 난 걸로 조금씩 갚는다. 배추로.'] },
        { say: '배추로 갚아 봐', tier: 'good', face: 'laugh', answer: '…그거 좋다! 그 여자 김치 좋아하거든. 한번 들이밀어 보지.' },
        { say: '다음 판에서 따면 돼', tier: 'meh', face: 'sorry', answer: '그 말 하다가 장부가 두 권이 됐어. 그 길로는 안 간다.' },
      ],
    },
    {
      id: 'tavern-tab',
      open: '샹크스네 주점 외상 장부에 내 이름이 제일 길대. 그 녀석 허풍이야.',
      replies: [
        { say: '그럼 확인하러 가자', tier: 'great', remember: 'tavern-tab', face: 'laugh', answer: ['좋아! 가서 허풍이면 한 잔 얻어먹는다.', '…허풍이 아니면? 그땐 딱 한 잔만 하고 도망친다.'] },
        { say: '딱 한 잔씩만 마셨다며', tier: 'good', face: 'sorry', answer: '한 잔씩만 마셨어! 한 잔씩 여러 번 마셨을 뿐이지.' },
        { say: '외상은 안 좋아', tier: 'meh', face: 'think', answer: '알아, 알아. 의사도 아는 걸 못 지킨다. 그래서 사람인 거야.' },
      ],
    },
    {
      id: 'frieren-age',
      open: ['빵집 프리렌 알지? 그 사람 앞에 서면 기분이 참 좋아.', '천 년 넘게 살았다잖아. 그 옆에선 나도 갓난아기야.'],
      replies: [
        { say: '누님은 영원한 아가씨', tier: 'great', face: 'laugh', answer: ['하하하! 그래, 그 말이 듣고 싶었어!', '케이크 하나 사 줄게. 아니, 두 개. 프리렌네서.'] },
        { say: '비교 대상이 틀렸어', tier: 'good', face: 'think', answer: '…그런가? 그래도 그 집 가면 마음이 놓여. 나이 얘기가 없거든.' },
        { say: '그래도 할머니잖아', tier: 'meh', face: 'sorry', answer: '방금 그 말, 이 호미로 돌려줄 거다. 빨리 도망가.' },
      ],
    },
    {
      id: 'miku-chips',
      open: ['어제 미쿠가 칩을 안 바꿔 주더라.', '"오늘은 그만하세요" 하고 웃는데, 그 얼굴은 못 이기겠어.'],
      replies: [
        { say: '미쿠가 누님 걱정한 거야', tier: 'great', face: 'shy', answer: ['…알아. 그 아이 눈이 그렇게 말하더라.', '그래서 그냥 나왔어. 밤길에 별 보면서. 나쁘지 않았어.'] },
        { say: '잘됐네', tier: 'good', face: 'laugh', answer: '잘되긴! …뭐, 지갑은 잘됐지. 지갑만.' },
        { say: '다른 탁자로 가지', tier: 'meh', face: 'think', answer: '그것도 해 봤어. 거기 딜러도 미쿠 눈치를 보더라.' },
      ],
    },
    {
      id: 'library-book',
      open: ['언덕 도서관 베아트리스한테 약초 책을 빌렸는데 반납일이 지났어.', '그 사서 눈초리가 무섭다니까. 우리 조수보다 무서워.'],
      replies: [
        { say: '같이 반납하러 가자', tier: 'great', face: 'smile', answer: ['…같이 가 줄래? 좋다. 네가 앞에 서.', '빈손은 안 되니 약과라도 하나 들고 가자. 단 거 좋아하더라.'] },
        { say: '누님도 무서운 게 있네', tier: 'good', face: 'laugh', answer: '있지. 사서랑 조수랑 서류 더미. 셋 다 종이 냄새가 나. 이상하지.' },
        { say: '그냥 계속 빌려', tier: 'meh', face: 'sorry', answer: '그러다 출입 금지 당하면 네가 책 빌려다 줄 거냐?' },
      ],
    },
    {
      id: 'grandpa-tree',
      open: ['언덕 위 저 큰 나무들 보이지? 우리 할아버지가 심은 거야.', '마을이 처음 생길 때 나무부터 심었대. 그늘이 있어야 사람이 모인다고.'],
      replies: [
        { say: '그 그늘 아래 텃밭이구나', tier: 'great', remember: 'grandpa-tree', face: 'shy', answer: ['그래. 할아버지 그늘에서 내가 밭을 매고 있지.', '언젠가 내 밭 그늘에서도 누가 쉬겠지. 그럼 된 거야.'] },
        { say: '할아버지도 장사였어?', tier: 'good', face: 'laugh', answer: ['그럼! 나무를 맨손으로 옮겼다더라. 그리고 노름도 좋아했지.', '…핏줄이 무섭다.'] },
        { say: '나무가 엄청 오래됐네', tier: 'meh', face: 'think', answer: '오래된 건 나무야. 손녀는 안 오래됐다. 명심해.' },
      ],
    },
    {
      id: 'snail',
      open: '달팽이 녀석들이 밤새 상추를 갉아 먹었어. 잎마다 구멍이 숭숭이야.',
      replies: [
        { say: '밤에 같이 지키자', tier: 'great', face: 'laugh', answer: ['좋다! 등불 들고 보초다. 딱 한 잔도 챙기고.', '…아니, 보초 설 땐 안 마신다. 의사의 양심이야.'] },
        { say: '달걀 껍데기를 뿌려 봐', tier: 'good', face: 'wow', answer: '오, 그거 아는 녀석이네! 부숴서 둘러 놓으면 못 넘어오지.' },
        { say: '손가락으로 튕겨', tier: 'meh', face: 'sorry', answer: '달팽이를? 그건 너무하지. 살살 집어서 숲으로 보내 줄 거다.' },
      ],
    },
    {
      id: 'mayor-days',
      open: ['내가 마을 대표였던 시절 얘기 들었냐? 그땐 큰 모자를 쓰고 다녔어.', '그 모자만 쓰면 도장 찍으라는 소리만 들리더라.'],
      replies: [
        { say: '왜 대표를 맡았어?', tier: 'great', remember: 'mayor-why', face: 'calm', answer: ['처음엔 싫다고 도망 다녔어. 그 자리 꿈꾸던 사람들이 먼저 멀리 갔거든.', '근데 누가 내 앞에서 꿈을 아주 크게 말하더라. 그 바람에 맡았지.', '…덕분에 이 동네가 지금 이렇게 북적이는 거야.'] },
        { say: '그 모자 아직 있어?', tier: 'good', face: 'laugh', answer: '톤톤 잠자리 됐어. 쟤가 제일 잘 써.' },
        { say: '또 하면 되겠다', tier: 'meh', face: 'sorry', answer: '말도 안 돼! 서류 소리만 들어도 두드러기 난다.' },
      ],
    },
    {
      id: 'small-bet',
      open: '{me}, 나랑 내기 하나 할래? 내일 비가 오나 안 오나. 진 사람이 약과 사기.',
      replies: [
        { say: '좋아, 난 맑음!', tier: 'great', remember: 'small-bet', face: 'laugh', answer: ['좋다! 그럼 난 비다. …잠깐, 내가 고르면 늘 지던데.', '무르기 없다! 이번엔 진짜 이길 것 같아.'] },
        { say: '누님 반대로 걸게', tier: 'good', face: 'think', answer: '…영리하네. 내 반대로 걸면 늘 딴다는 소문이 있더라. 억울하다.' },
        { say: '내기는 안 할래', tier: 'meh', face: 'calm', answer: '그래, 그게 맞아. 의사로선 칭찬한다. 도박꾼으로선 섭섭하고.' },
      ],
    },
    {
      id: 'hangover',
      open: ['아침마다 주점 사람들이 내 텃밭 앞에 줄을 서. 해장 약 달라고.', '콩나물이랑 북엇국 비법을 아는 사람이 나뿐이거든.'],
      replies: [
        { say: '누님도 마셨으면서', tier: 'great', face: 'laugh', answer: ['…그러니까 효과는 내가 제일 잘 알지! 직접 시험한 약이야.', '의사는 몸으로 배우는 거다. 하하.'] },
        { say: '비법 알려 줘', tier: 'good', face: 'smile', answer: '콩나물은 뚜껑 열지 말고, 북어는 두들겨서. 나머진 정성이다.' },
        { say: '안 마시면 되잖아', tier: 'meh', face: 'sorry', answer: '그 말 조수가 하루에 열 번 해. 귀에 굳은살 박였다.' },
      ],
    },
    {
      id: 'spring-greens',
      open: ['봄이 오면 언덕에 쑥이랑 냉이가 지천이야. 보약이 땅에서 올라오는 거지.', '가붕네 남매 어릴 땐 나물 캐러 데려가면 반은 먹고 왔어.'],
      replies: [
        { say: '봄 되면 같이 캐러 가자', tier: 'great', remember: 'spring-walk', face: 'smile', answer: ['좋다! 바구니 두 개 챙겨. 하나는 톤톤 몫.', '쑥은 어린 잎만. 봄을 통째로 뜯어 가면 안 되니까.'] },
        { say: '쑥국 좋아해', tier: 'good', face: 'laugh', answer: '입맛이 제대로네! 된장 풀고 쑥 한 줌. 그게 봄이지.' },
        { say: '나물은 다 똑같아 보여', tier: 'meh', face: 'think', answer: '그러다 독초 무친다. 봄에 나랑 꼭 한 번 나가 보자.' },
      ],
    },
    {
      id: 'summer-heat',
      open: ['한여름엔 더위 먹은 사람들이 텃밭 그늘로 실려 와.', '오이냉국 한 사발에 이마엔 찬 수건. 그게 내 처방이야.'],
      replies: [
        { say: '나도 일손 거들게', tier: 'great', remember: 'summer-aid', face: 'wow', answer: ['오! 지원자다! 잔소리꾼 하나 더 생기면 내가 피곤한데.', '…좋아. 수건 짜는 법부터 가르쳐 주지.'] },
        { say: '오이냉국 맛있겠다', tier: 'good', face: 'laugh', answer: '한 사발 떠 줄까? 식초 쪼끔, 얼음 듬뿍. 그게 요령이다.' },
        { say: '여름은 그냥 버텨야지', tier: 'meh', face: 'think', answer: '버티다 쓰러지면 내가 업고 와야 해. 무겁다고 원망 말고.' },
      ],
    },
    {
      id: 'seed-saving',
      open: ['가을엔 제일 잘 여문 놈을 안 먹고 남겨 둬. 씨 받으려고.', '제일 맛있어 보이는 걸 참는 거. 그게 제일 어려워.'],
      replies: [
        { say: '내년을 위해 참는 거구나', tier: 'great', remember: 'seed-wise', face: 'smile', answer: ['그래. 내년 밭은 내 것만이 아니니까.', '…너라면 그 말 할 줄 알았어. 그런 녀석한테 씨앗을 맡기는 거야.'] },
        { say: '판돈도 그렇게 아껴', tier: 'good', face: 'sorry', answer: '…아프다. 정곡이야. 씨앗은 참는데 판돈은 왜 못 참는지.' },
        { say: '그냥 사서 심어', tier: 'meh', face: 'think', answer: '산 씨는 이 언덕 바람을 몰라. 여기서 받은 씨가 여기서 잘 커.' },
      ],
    },
    {
      id: 'night-call',
      open: ['한밤중에 문 두드리는 소리가 나면 나는 바로 일어나.', '열나는 아이, 배 아픈 어부… 약상자는 늘 문 옆에 둬.'],
      replies: [
        { say: '누님 정말 의사구나', tier: 'great', face: 'shy', answer: ['…놀고 마시고 지는 건 다 맞는데, 그건 진짜야.', '그거 하나는 평생 안 빠뜨렸어. 앞으로도.'] },
        { say: '피곤하지 않아?', tier: 'good', face: 'calm', answer: '피곤하지. 근데 낫는 얼굴 보면 잠이 다 깨. 술보다 좋아.' },
        { say: '밤엔 자야지', tier: 'meh', face: 'think', answer: '아픈 건 시간을 안 봐. 그러니 나도 안 봐.' },
      ],
    },
    {
      id: 'love-forehead',
      when: { love: 'any' },
      open: '{me}, 이마 대 봐. …아니, 튕기려는 거 아니야. 열 좀 재 보려고.',
      replies: [
        { say: '누님 손 따뜻하다', tier: 'great', face: 'shy', answer: ['…열은 없네. 근데 얼굴은 왜 빨개.', '아, 내 얼굴 말하는 거 아니다! 네 얼굴이다!'] },
        { say: '튕길 것 같아 무서워', tier: 'good', face: 'laugh', answer: '하하! 너한텐 반의반 힘만 쓴다. 특별 대우야.' },
        { say: '난 멀쩡해', tier: 'meh', face: 'calm', answer: '알아. 그냥 핑계였어. …못 들은 걸로 해.' },
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
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: ['봄바람 분다! 쑥 올라오는 냄새 나지?', '톤톤이 벌써 언덕에 코를 박고 안 나와.'],
      replies: [
        { say: '쑥떡 해 먹자', tier: 'great', face: 'laugh', answer: ['좋다! 쑥은 내가 캐고 떡메는 네가 쳐.', '…아니, 떡메는 내가 쳐야겠다. 네 팔로는 해 지겠어.'] },
        { say: '꽃가루에 재채기 나', tier: 'good', face: 'think', answer: '이리 와. 도라지 달인 물 한 잔이면 코가 뻥 뚫린다.' },
        { say: '봄은 졸려', tier: 'meh', face: 'calm', answer: '봄잠은 약이야. 대신 밭일 끝내고 자.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer', time: 'day' },
      open: '덥다, 더워! 이럴 땐 수박에 딱 한 잔… 아니, 수박만. 수박만이야.',
      replies: [
        { say: '수박은 내가 쪼갤게', tier: 'good', face: 'smile', answer: '칼 줘? 나는 손날로 하는데. …알았어, 칼 써.' },
        { say: '누님 손가락으로 쪼개 줘', tier: 'great', face: 'laugh', answer: ['자, 툭! …봐, 반듯하게 갈라졌지?', '이 기술로 마을 대표까지 했다. 농담이다.'] },
        { say: '그 한 잔 뭐야', tier: 'meh', face: 'sorry', answer: '못 들었지? 못 들은 거다. 수박이나 먹어.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: ['가을이다. 고추 말리고, 씨 받고, 김장 배추 심고.', '바빠 죽겠는데 카지노는 왜 이렇게 가고 싶냐.'],
      replies: [
        { say: '고추 같이 널자', tier: 'great', face: 'smile', answer: ['좋아. 꼭지 위로, 겹치지 않게.', '…너 손이 빠르네. 판 대신 고추 널 때 운이 오는 녀석이야.'] },
        { say: '바쁠 때가 좋은 거야', tier: 'good', face: 'think', answer: '그 말 맞아. 한가하면 내가 사고를 쳐.' },
        { say: '잠깐만 다녀와', tier: 'meh', face: 'sorry', answer: '…유혹하지 마! 조수 귀는 언덕 끝까지 들려.' },
      ],
    },
    {
      id: 'op-winter-night',
      when: { season: 'winter', time: ['evening', 'night'] },
      open: ['겨울밤엔 아랫목에 앉아 약초 썰기가 최고야.', '대추 썰고 생강 썰고… {me}, 같이 할래?'],
      replies: [
        { say: '칼 줘, 썰게', tier: 'great', face: 'smile', answer: ['그래. 대추는 씨 빼고, 생강은 얇게.', '…다 썰면 대추차다. 오늘은 그게 딱 한 잔이야.'] },
        { say: '아랫목만 차지할게', tier: 'good', face: 'laugh', answer: '하하! 톤톤이랑 자리 싸움 해야 할 거다.' },
        { say: '추워서 나가기 싫어', tier: 'meh', face: 'calm', answer: '그럼 여기 있어. 아무것도 안 해도 돼. 그냥 있어.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night', weather: ['sunny', 'cloudy'] },
      open: '이 시간에 돌아다녀? …나? 나는 카지노 가는 거 아니야. 산책이야.',
      replies: [
        { say: '같이 산책하자', tier: 'great', face: 'sorry', answer: ['…그래, 산책. 진짜 산책.', '카지노 앞은 빠른 걸음으로 지나가자. 눈 감고.'] },
        { say: '카지노 쪽 길인데?', tier: 'meh', face: 'think', answer: '길이 그쪽으로 났을 뿐이야. 내 발이 아니라 길 탓이다.' },
        { say: '조수한테 말할까?', tier: 'good', face: 'wow', answer: '그건 안 돼! …알았어, 알았어. 집으로 간다.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny', time: ['dawn', 'day'] },
      open: '볕 좋다! 약초 널기 딱이야. {me}, 소쿠리 좀 들어 줘.',
      replies: [
        { say: '내가 다 들게', tier: 'great', face: 'laugh', answer: '오, 힘 좀 쓰네! 그래도 내가 한 손으로 드는 게 더 많다.' },
        { say: '어디다 널어?', tier: 'good', face: 'smile', answer: '처마 밑, 바람 드는 데. 볕에 너무 바짝 말리면 약효가 날아가.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: ['흐리네. 이런 날은 판운도 흐려.', '그러니까 오늘 카지노는 쉰다. 내 의지가 아니라 날씨 탓이야.'],
      replies: [
        { say: '날씨가 고맙네', tier: 'great', face: 'laugh', answer: '하하! 너도 조수 편이구나. 그래, 날씨한테 고맙다고 해 둬.' },
        { say: '맑으면 가는 거야?', tier: 'good', face: 'think', answer: '…그건 그날 하늘이 정하는 거다.' },
        { say: '흐린 날이 기회래', tier: 'meh', face: 'sorry', answer: '누가 그래! 그런 말 하는 사람이 제일 많이 잃어.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: ['생일이라며! 이리 와. 미역국 끓여 놨어. 소고기 듬뿍.', '…나이는 안 묻는다. 서로 그게 예의야.'],
      replies: [
        { say: '누님이 최고야', tier: 'great', face: 'shy', answer: ['그, 그렇지? 다 먹으면 보약도 한 사발이다.', '생일엔 아픈 데 없이 웃기만 해. 의사 명령이다.'] },
        { say: '몇 살인지 맞혀 봐', tier: 'meh', face: 'think', answer: '안 맞힌다! 나이 얘기는 서로 안 하기로 했잖아.' },
        { say: '미역국 두 그릇!', tier: 'good', face: 'laugh', answer: '좋다! 세 그릇까지 봐준다. 오늘만이야.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: ['마을에 혼례 소식 들었어? 좋은 날이다!', '축하주는 딱 한 잔만… 세 잔이면 축하가 세 배라서 괜찮아.'],
      replies: [
        { say: '한 잔이면 충분해', tier: 'great', face: 'sorry', answer: '…알았어. 한 잔. 대신 아주 정성껏 마실 거다.' },
        { say: '누님 혼례 때도 부를게', tier: 'good', face: 'shy', answer: '내, 내 혼례 얘기가 왜 나와! 축하주나 받아!' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '전설 물고기 소식 들었냐? 전설은 저렇게 낚는 거구나. 나는 전설의 봉인데.',
      replies: [
        { say: '누님도 전설이잖아', tier: 'great', face: 'laugh', answer: '하하! 그래, 종류가 좀 다를 뿐이지. 전설은 전설이다!' },
        { say: '낚시도 운이야', tier: 'good', face: 'think', answer: '그럼 내 운은 다 바다에 가 있나 보다. 판에는 하나도 없어.' },
      ],
    },
    {
      id: 'op-friend-bday',
      when: { friendNews: 'birthday' },
      open: '네 친구 생일이라며? 빈손으로 가지 마라. 약과라도 싸 줄게.',
      replies: [
        { say: '고마워, 누님', tier: 'great', face: 'smile', answer: '고맙긴. 친구 생일 챙기는 녀석은 나도 챙겨 줘야지.' },
        { say: '약초차도 줄래?', tier: 'good', face: 'laugh', answer: '그건 생일엔 너무 쓰다. 약과에 꿀 한 숟갈 더 얹어 줄게.' },
      ],
    },
    {
      id: 'op-with-captain',
      when: { with: 'captain' },
      open: ['{other}, 이 녀석이 내 외상 장부를 또 들고 다녀.', '{me}, 좀 말려. 언덕까지 따라왔어.'],
      replies: [
        { say: '오늘 내가 한 잔 살게', tier: 'great', face: 'laugh', answer: ['오! 들었지? 장부는 덮어! 오늘은 {me} 차례다.', '…딱 한 잔이야. 내가 아니라 {me} 지갑 생각해서.'] },
        { say: '장부 좀 봐도 돼?', tier: 'meh', face: 'sorry', answer: '보지 마! 그 장부는 의사의 비밀문서야.' },
        { say: '두 사람 친하네', tier: 'good', face: 'smile', answer: '친하긴! 술친구는 친구랑 달라. …뭐, 비슷하긴 하지.' },
      ],
    },
    {
      id: 'op-with-rose',
      when: { with: 'rose' },
      open: '하필 {other} 옆에서 만나냐. …{me}, 빚 얘기 나오기 전에 화제 바꿔.',
      replies: [
        { say: '오늘 날씨 좋네요!', tier: 'great', face: 'laugh', answer: ['그래, 날씨! 날씨 좋다! 아주 좋다!', '…저 여자 웃는 거 봐. 다 알고 웃는 거야.'] },
        { say: '빚이 얼마였더라?', tier: 'meh', face: 'sorry', answer: '너 일부러 그러지! 손가락 대기 중이다.' },
        { say: '두 분 사이좋아 보여요', tier: 'good', face: 'think', answer: '…좋긴. 근데 아플 때 제일 먼저 약 달라고 오는 건 저 여자야.' },
      ],
    },
    {
      id: 'op-with-mercy',
      when: { with: 'mercy' },
      open: '{other}, 마침 잘 왔다. {me} 맥 좀 같이 짚어 보자. 누가 맞나 보게.',
      replies: [
        { say: '두 분 다 맞을 거예요', tier: 'great', face: 'think', answer: ['…그래, 둘 다 맞았네. 잠 모자라고 물 덜 마시고.', '이번 판은 무승부다. 다음엔 안 진다.'] },
        { say: '누님 손을 믿어요', tier: 'good', face: 'laugh', answer: '들었지? 들었냐고! …흥, 의원 기계도 가끔은 쓸 만하지만.' },
        { say: '난 아픈 데 없어', tier: 'meh', face: 'calm', answer: '그걸 확인하려고 짚는 거야. 손목 내.' },
      ],
    },
    {
      id: 'op-with-frieren',
      when: { with: 'frieren' },
      open: '{other} 옆에 있으니 내가 아주 젊어진 기분이다. 좋아, 아주 좋아.',
      replies: [
        { say: '누님 동안이에요', tier: 'great', face: 'laugh', answer: '그렇지! 오늘 빵은 내가 산다. 둘 다 골라!' },
        { say: '비교하면 안 되죠', tier: 'meh', face: 'sorry', answer: '…알아. 그래도 잠깐만 기분 내자. 잠깐만.' },
        { say: '둘 다 오래 사세요', tier: 'good', face: 'shy', answer: '오래 사는 건 저 사람 몫이고, 나는 건강하게 살 거다.' },
      ],
    },
    {
      id: 'op-with-lumi',
      when: { with: 'lumi' },
      open: '{other} 앞에서 카지노 얘기는 하지 마. 오늘은 칩 대신 차 마시러 왔어.',
      replies: [
        { say: '약초차 한 잔 어때요', tier: 'great', face: 'smile', answer: '좋지. 이 아이 늘 밤새 일하잖아. 피로 푸는 걸로 내가 우려 줄게.' },
        { say: '오늘은 칩 안 바꿔요?', tier: 'meh', face: 'sorry', answer: '안 바꾼다니까! …아직은.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: ['{other} 녀석이랑 좀 서먹해.', '…내가 먼저 사과할까? 나이 많은 쪽이 먼저… 아니야! 나이 얘기 아니야!'],
      replies: [
        { say: '나물 들고 가 봐', tier: 'great', face: 'think', answer: ['…그래, 말보다 반찬이 빠르지.', '언덕 사람들은 원래 그렇게 화해해. 고맙다.'] },
        { say: '시간이 해결해 줄 거야', tier: 'good', face: 'calm', answer: '시간은 약이긴 한데 느린 약이야. 그래도 기다려 보지.' },
        { say: '내기로 정하자', tier: 'meh', face: 'sorry', answer: '…내가 지면 더 서먹해진다. 안 돼.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '{fish}, 잡았네! 그거 매운탕 끓이면 보약이야. 고추는 내가 댄다.',
      replies: [
        { say: '같이 끓여 먹자', tier: 'great', face: 'laugh', answer: ['좋다! 무는 내 텃밭 거, 미나리도 한 줌.', '…국물에 딱 한 잔이 빠질 수 없지.'] },
        { say: '생선도 약이 돼?', tier: 'good', face: 'think', answer: '제철 생선은 다 약이야. 기름이 몸을 데워 줘.' },
      ],
    },
    {
      id: 'op-stockdown',
      when: { recent: 'stockDown' },
      open: '주식에서 잃었다며? 나는 판에서 잃고 너는 표에서 잃고. 같이 약초차나 마시자.',
      replies: [
        { say: '동지네, 누님', tier: 'great', face: 'laugh', answer: ['하하! 동지다! 잃은 사람끼리는 위로가 제일 잘 통해.', '…그래도 너는 곧 오를 거야. 나는 몰라도.'] },
        { say: '다시 오를 거야', tier: 'good', face: 'smile', answer: '그 마음이면 됐다. 밭도 한 해 망치면 다음 해가 있어.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '먼바다 다녀왔다며? 멀미는 안 했어? 얼굴이 좀 허옇다.',
      replies: [
        { say: '생강차 주세요', tier: 'great', face: 'smile', answer: '말 안 해도 끓여 놨다. 꿀 한 숟갈 넣었어. 쭉 마셔.' },
        { say: '하나도 안 했어', tier: 'meh', face: 'think', answer: '멀쩡하다는 사람 얼굴이 이래? 혀 내밀어 봐.' },
        { say: '바다 진짜 넓더라', tier: 'good', face: 'wow', answer: '그렇지? 넓은 걸 보고 오면 사람이 좀 커져. 너도 그래 보여.' },
      ],
    },
    {
      id: 'op-mood-high',
      when: { mood: 'high' },
      open: '오늘 얼굴 좋다! 혈색이 아주 그만이야. 의사가 보증한다.',
      replies: [
        { say: '누님 잔소리 덕이야', tier: 'great', face: 'shy', answer: '…그렇지? 잔소리도 약이라니까. 앞으로도 꼬박꼬박 먹어.' },
        { say: '잠을 푹 잤어', tier: 'good', face: 'smile', answer: '잘했다. 그게 제일 좋은 약이야. 나도 따라 해야 하는데.' },
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
    {
      id: 'cb-nickname',
      when: { mem: 'legend-sucker' },
      use: 'legend-sucker',
      open: ['전설의 봉 얘기 기억하지? 들어 봐. 어제 드디어 한 판 땄다!', '…작은 판이지만. 아주 작은 판.'],
      replies: [
        { say: '전설이 깨졌다!', tier: 'great', face: 'laugh', answer: ['하하! 그렇지? 이제 전설의 봉이 아니라 그냥 전설이다!', '…근데 따고 나니 괜히 불안해. 오늘 우박 오면 내 탓이다.'] },
        { say: '그 돈 어쨌어?', tier: 'good', face: 'think', answer: '씨앗 샀지. 따면 씨앗, 잃으면 술. 그게 내 규칙이야.' },
        { say: '또 잃기 전에 그만해', tier: 'meh', face: 'sorry', answer: '…알아. 조수가 벌써 내 지갑을 가져갔어.' },
      ],
    },
    {
      id: 'cb-necklace',
      when: { mem: 'necklace-tale' },
      use: 'necklace-tale',
      open: ['목걸이 얘기 했던 거 기억해? 그 꼬마한테서 편지가 왔어.', '아직도 걸고 다닌대. 하루도 안 빼고.'],
      replies: [
        { say: '누님 마음이 닿았네', tier: 'great', face: 'shy', answer: ['…닿았나 보다. 글씨는 여전히 엉망이던데.', '편지 끝에 "할머니 술 줄이세요" 라고 썼어. 할머니라니! …그래도 좋다.'] },
        { say: '답장 쓸 거야?', tier: 'good', face: 'smile', answer: '써야지. 서류는 싫어도 편지는 써. 네가 우체국까지 같이 가 줘.' },
      ],
    },
    {
      id: 'cb-writer',
      when: { mem: 'writer-friend' },
      use: 'writer-friend',
      open: ['글 쓰던 동료 얘기 했잖아. 도서관에서 그 녀석 책을 찾았어.', '베아트리스가 수상한 눈으로 보면서 빌려주더라.'],
      replies: [
        { say: '같이 읽어 볼까?', tier: 'great', face: 'shy', answer: ['…좋아. 근데 소리 내서 읽지는 마. 창피해.', '책 안에 내 얘기도 있더라. 힘센 누님이라고. 허풍쟁이 녀석.'] },
        { say: '그분 보고 싶겠다', tier: 'good', face: 'calm', answer: ['…조금. 아주 조금.', '그 녀석은 웃는 얼굴로 기억해 주는 걸 좋아했어. 그러니 웃자.'] },
        { say: '수상한 책이었구나', tier: 'meh', face: 'laugh', answer: '하하! 그 녀석 책은 다 수상해. 표지만 봐도 알아.' },
      ],
    },
    {
      id: 'cb-loudkid',
      when: { mem: 'loud-kid' },
      use: 'loud-kid',
      open: ['시끄럽던 꼬마 얘기 했지? 요즘 그 녀석 생각나면 너를 보게 돼.', '포기를 모르는 데가 좀 닮았어.'],
      replies: [
        { say: '칭찬으로 들을게', tier: 'great', face: 'smile', answer: ['칭찬이야. 내가 아는 최고의 칭찬.', '그 녀석 덕에 내가 다시 걸어 볼 마음이 났거든. 너도 그래.'] },
        { say: '나도 시끄러워?', tier: 'good', face: 'laugh', answer: '그 녀석 반의반도 안 돼. 걘 언덕 너머까지 들렸어.' },
      ],
    },
    {
      id: 'cb-bet',
      when: { mem: 'small-bet' },
      use: 'small-bet',
      open: ['지난번 내기 기억하지? …내가 졌어. 역시나.', '자, 약과. 무르기 없다고 한 건 나니까.'],
      replies: [
        { say: '반씩 나눠 먹자', tier: 'great', face: 'shy', answer: ['…진 사람한테 반을 주는 녀석은 처음 본다.', '그래, 같이 먹자. 지고도 기분 좋은 판이네.'] },
        { say: '또 내기할래?', tier: 'meh', face: 'sorry', answer: '…안 해. 너한테는 안 해. 손해 보는 판이야.' },
        { say: '잘 먹을게, 누님', tier: 'good', face: 'laugh', answer: '그래. 다음엔 꼭 이긴다. 그때는 네가 약과 두 개다.' },
      ],
    },
    {
      id: 'cb-tab',
      when: { mem: 'tavern-tab' },
      use: 'tavern-tab',
      open: ['외상 장부 확인하러 갔던 거 말이야… 샹크스 말이 맞더라.', '내 이름이 제일 길어. 두 장 넘어가.'],
      replies: [
        { say: '이번 달은 같이 갚자', tier: 'great', face: 'shy', answer: ['…넌 왜 자꾸 같이 하자고 하냐.', '그래. 해장국으로 갚기로 했다. 샹크스네 손님들 다 내 단골이니까.'] },
        { say: '두 장이나?', tier: 'good', face: 'sorry', answer: '…글씨가 커서 그래. 장부 탓이다.' },
      ],
    },
    {
      id: 'cb-pulse',
      when: { mem: 'pulse' },
      use: 'pulse',
      open: '전에 진맥했던 거, 그 뒤로 잠은 잘 자? 손목 다시 줘 봐.',
      replies: [
        { say: '일찍 자고 있어', tier: 'great', face: 'smile', answer: ['…맥이 훨씬 고르네. 잘했다.', '의사 말 듣는 환자는 오랜만이다. 상으로 대추 한 줌.'] },
        { say: '사실 좀 늦게 자', tier: 'good', face: 'think', answer: '정직해서 봐준다. 자기 전에 이 약초차 한 잔. 꼭.' },
        { say: '다 나았어', tier: 'meh', face: 'calm', answer: '그건 내가 정해. 맥은 거짓말 안 하거든.' },
      ],
    },
    {
      id: 'cb-mercy',
      when: { mem: 'mercy-duel' },
      use: 'mercy-duel',
      open: ['메르시랑 같이 하면 최고라던 네 말… 진짜 같이 해 봤다.', '어부 아저씨 허리. 그 사람이 기계로 보고 내가 침이랑 찜질.'],
      replies: [
        { say: '그래서 나았어?', tier: 'great', face: 'wow', answer: ['다음 날 배 타러 나갔대! 둘이 같이 하니 빠르더라.', '…메르시한텐 말하지 마. 내가 고맙다고 한 거.'] },
        { say: '누가 더 잘했어?', tier: 'good', face: 'laugh', answer: '당연히 나지! …라고 하고 싶은데, 반반이다. 반반.' },
      ],
    },
    {
      id: 'cb-debt',
      when: { mem: 'debt-plan' },
      use: 'debt-plan',
      open: ['배추로 갚기 작전, 미스 포츈이 받아 줬어!', '김치 한 통에 이자 한 달. 그 여자 젓가락이 멈추질 않더라.'],
      replies: [
        { say: '작전 성공이네', tier: 'great', face: 'laugh', answer: ['그렇지! 판에선 져도 김치로는 이긴다.', '올겨울 김장은 더 크게 담근다. 빚 갚을 통까지.'] },
        { say: '원금은?', tier: 'meh', face: 'sorry', answer: '…원금 얘기는 내년 김장 때 하자.' },
      ],
    },
    {
      id: 'cb-strong',
      when: { mem: 'strong-arm' },
      use: 'strong-arm',
      open: ['내 손가락 시범 기억하지? 그때 튕긴 돌 말이야.', '하쿠네 과수원 울타리 밑에서 찾았대. 거기까지 갔더라.'],
      replies: [
        { say: '역시 누님 힘!', tier: 'great', face: 'laugh', answer: ['하하! 그렇지? 하쿠가 그 돌로 디딤돌 놨대.', '내 힘이 과수원에 길을 만들었네. 좋은 데 썼다.'] },
        { say: '하쿠 놀랐겠다', tier: 'good', face: 'sorry', answer: '…놀랐다더라. 사과 들고 가야겠다. 그 집엔 사과가 넘치지만.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: ['저번에 네 방에 갔을 때 말이야. 화분 하나가 시들했어.', '그래서 약초 거름 조금 싸 왔다. …핑계 아니다.'],
      replies: [
        { say: '또 놀러 와 줘', tier: 'great', remember: 'date-talk', face: 'shy', answer: ['…화분 보러 가는 거다. 화분.', '딱 한 번만. 아니, 화분이 다 나을 때까지.'] },
        { say: '거름 고마워', tier: 'good', remember: 'date-talk', face: 'smile', answer: '물은 사흘에 한 번. 너도 밥은 하루 세 번. 둘 다 지켜.' },
      ],
    },
  ],
  chapters: [
    {
      title: '텃밭 의사',
      hint: '한 번 이야기를 나누면 츠나데가 진맥을 해 줘요.',
      need: { days: 1 },
      scene: [
        '언덕 텃밭 고랑 사이. 호미를 쥔 여자가 허리를 펴다 나를 본다.',
        '옷 입은 돼지 한 마리가 그녀 발치에서 내 신발 냄새를 킁킁 맡는다.',
        '"새 얼굴이네. 거기 고랑 밟지 말고, 옆길로 이리 와 봐."',
        '그녀가 흙 묻은 손을 앞치마에 털더니 내 손목을 덥석 잡는다.',
        '손끝이 맥 위에 가만히 얹힌다. 바람 소리만 남고 텃밭이 조용해진다.',
        '"…맥은 튼튼한데 밥을 대충 먹네. 잠도 모자라고. 딱 보면 알아."',
        '"나 츠나데다. 언덕 텃밭이 내 구역이고, 이 녀석은 돼지 톤톤."',
        '톤톤이 대답하듯 꿀, 하고 짧게 운다.',
        '"아픈 데 있으면 나한테 와. 진찰비는 안 받아. 잔소리는 듬뿍 주고."',
        '그녀가 이마의 작은 마름모 표식 아래로 눈을 가늘게 뜬다.',
        '"단, 할머니라고 부르면 진료 거부다. 알겠지?"',
      ],
      replies: [
        { say: '알겠어요, 누님!', tier: 'great', remember: 'call-sister', face: 'laugh', answer: ['하하! 말귀 알아듣는 녀석이네.', '나물 한 줌 싸 줄게. 데쳐서 참기름 한 방울. 그게 오늘 처방이다.'] },
        { say: '진찰비는요?', tier: 'good', remember: 'pulse', face: 'smile', answer: ['공짜다. 대신 잔소리는 평생 따라다닌다.', '…그게 진찰비보다 비쌀 수도 있지만.'] },
        { say: '그럼 뭐라고 불러요?', tier: 'meh', face: 'think', answer: '누님. 그 외엔 다 틀렸어. 외워.' },
      ],
    },
    {
      title: '새벽 약초밭',
      hint: '새벽(게임 시각 새벽 다섯 시부터 여덟 시) 뒷산 언덕 텃밭에 가 보세요. 약초를 캐러 간대요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 5, to: 8 } },
      scene: [
        '안개 낀 새벽 뒷산. 이슬 젖은 풀이 발목을 차갑게 적신다.',
        '츠나데가 바구니를 끼고 쭈그려 앉아 있다. 톤톤은 벌써 흙투성이다.',
        '"왔네! 늦을 줄 알았는데. 이 시간 약초가 제일 약효가 좋아."',
        '그녀가 풀잎 하나를 따서 내 코끝에 댄다. 쌉싸름한 냄새가 훅 올라온다.',
        '"이건 열 내리는 풀, 이건 잠 오는 풀. 저건 독이야. 만지지 마."',
        '"이 산에서 처음 약초를 가르쳐 준 건 우리 할아버지였어."',
        '"저 큰 나무들도 할아버지가 심었지. 나는 그 그늘에서 배웠고."',
        '안개 너머로 오래된 나무들이 어깨를 맞댄 채 서 있다.',
        '톤톤이 코로 흙을 파더니 작은 뿌리 하나를 물고 온다.',
        '"…이 녀석이 나보다 잘 찾는다니까. 조수한테는 비밀이다."',
        '해가 산마루를 넘자, 그녀가 바구니 반을 덜어 내 쪽으로 민다.',
      ],
      replies: [
        { say: '톤톤, 최고야!', tier: 'great', remember: 'dawn-herbs', face: 'laugh', answer: ['꿀! …봐, 좋아한다.', '오늘 캔 거 반은 너 줄게. 말려서 겨울에 차로 마셔.'] },
        { say: '독초는 어떻게 구별해?', tier: 'good', remember: 'dawn-herbs', face: 'think', answer: ['잎 뒷면을 봐. 털이 있으면 일단 의심해.', '그래도 모르겠으면 나한테 들고 와. 그게 제일 확실해.'] },
        { say: '너무 이르다…', tier: 'meh', remember: 'dawn-herbs', face: 'calm', answer: '젊은 녀석이 왜 그래! …아, 나도 젊다. 둘 다 젊다.' },
      ],
    },
    {
      title: '김치 한 통',
      hint: '츠나데는 김치를 좋아해요. 김치를 가지고 언덕 텃밭에 가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'kimchi', take: true } },
      scene: [
        '김치 통을 내밀자 츠나데가 호미를 내려놓고 뚜껑부터 연다.',
        '시큼하고 깊은 냄새가 언덕 바람에 번진다. 톤톤이 코를 벌름거린다.',
        '"…잘 익었네. 누가 담갔는지 손맛이 좋아."',
        '그녀가 툇마루에 앉아 김치 통을 무릎에 안는다.',
        '"옛날, 마을 대표 시절에도 김장 날만은 좋았어."',
        '"서류 더미 다 밀어 두고, 온 동네가 마당에 모여 배추를 절였지."',
        '"잔소리꾼 조수는 소금 재고, 시끄럽던 꼬마는 고춧가루를 뒤집어쓰고."',
        '"글 쓰던 동료 녀석은 일은 안 하고 수육만 집어 먹었어."',
        '그녀가 웃다가 잠깐 먼 산을 본다. 웃음이 조금 늦게 사그라든다.',
        '"…서류는 다 잊어도 이 냄새는 안 잊혀. 신기하지."',
        '그녀가 한 가닥 집어 내 입에 쏙 넣어 준다. 손끝이 따뜻하다.',
      ],
      replies: [
        { say: '누님 김치가 더 맛있겠다', tier: 'great', remember: 'kimchi-gift', face: 'shy', answer: ['…말은 잘한다.', '올겨울엔 너한테 내 비법 다 알려 준다. 그 마당 김장, 다시 한번 해 보자.'] },
        { say: '같이 밥 먹자', tier: 'good', remember: 'kimchi-gift', face: 'smile', answer: '좋지! 밥 두 공기 퍼 와. 아니, 세 공기. 톤톤 몫.' },
        { say: '시장에서 샀어', tier: 'meh', remember: 'kimchi-gift', face: 'think', answer: '…그래도 고르는 눈은 있네. 고맙다.' },
      ],
    },
    {
      title: '약초 수첩',
      hint: '츠나데에게 약초를 배우겠다고 하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'herb-learn' },
      scene: [
        '해 질 녘 툇마루. 약초 말리는 냄새가 처마 밑에 고여 있다.',
        '츠나데가 손때 묻은 수첩을 내 무릎에 툭 올린다.',
        '겉장은 해지고, 군데군데 찻물 자국과 흙 자국이 번져 있다.',
        '"내가 평생 모은 약초 기록이야. 나세라한테도 다 안 보여 줬어."',
        '"그 녀석은 규칙을 배웠고, 하쿠는 거름을 배웠지. 이건 아직 아무도."',
        '수첩을 넘기자 삐뚤빼뚤한 글씨 옆에 웬 돼지 낙서가 있다.',
        '"…그건 조수가 그린 거야. 톤톤이 처음 우리 집에 온 날."',
        '"서류는 질색인데 이건 하루도 안 빼고 썼어. 이상하지?"',
        '"누가 아팠던 날, 누가 나은 날. 다 여기 있어."',
        '그녀가 마지막 빈 장을 손끝으로 천천히 쓸어 본다.',
        '"…배우겠다고 한 녀석은 오랜만이야. 그래서 너한테 주는 거야."',
      ],
      replies: [
        { say: '하나도 안 빼고 배울게', tier: 'great', face: 'shy', answer: ['…그 말 잊지 마. 시험도 본다.', '틀리면 꿀밤이야. 손가락으로. 아주 살살.'] },
        { say: '이걸 나한테?', tier: 'good', face: 'smile', answer: ['빌려주는 거야. 다 외우면 그때 진짜 준다.', '빈 장엔 네 글씨로 채워. 그래야 이어지는 거니까.'] },
        { say: '글씨를 못 읽겠어', tier: 'meh', face: 'laugh', answer: '하하! 조수도 그래. 내가 읽어 줄게. 옆에 앉아.' },
      ],
    },
    {
      title: '젊음의 비결',
      hint: '츠나데와 아주 가까워지면 그녀가 비밀 하나를 꺼내요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '밤 텃밭. 달빛이 배추 잎 위에 하얗게 내려앉았다.',
        '츠나데가 고랑 끝에 앉아 이마의 마름모 표식을 손끝으로 만진다.',
        '오늘은 술병도 없다. 톤톤만 그녀 무릎에 머리를 묻고 잠들어 있다.',
        '"젊어 보이는 비결 말이야. …사실 대단한 거 없어."',
        '"늙는 게 무서웠던 거야. 아끼던 사람들이 하나둘 먼저 떠나서."',
        '"동생도, 그 사람도. 목걸이를 걸어 준 사람마다 멀리 가더라."',
        '"그래서 한동안 아무것도 안 물려줬어. 판에서 돈만 잃고 다녔지."',
        '"근데 시끄럽던 꼬마는 그 목걸이를 받고도 씩씩하게 잘 살더라."',
        '그녀가 웃는다. 달빛 아래 그 웃음이 오늘따라 앳되다.',
        '"요즘은 좀 달라. 너랑 있으면 나이 같은 건 생각도 안 나."',
        '그녀가 고개를 돌린다. 한 잔도 안 마셨는데 귀까지 붉다.',
      ],
      replies: [
        { say: '지금 그대로가 좋아', tier: 'great', face: 'shy', answer: ['…바보.', '꽃다발이라도 들고 와서 그런 말 해. 주점에서 평생 자랑하게.'] },
        { say: '내가 오래 곁에 있을게', tier: 'good', face: 'smile', answer: ['말했다? 의사 앞에서 한 약속은 처방전이야.', '못 물러. 평생 복용이다.'] },
        { say: '그래서 몇 살인데?', tier: 'meh', face: 'sorry', answer: '…분위기 다 깨졌다. 손가락 한 번 맞고 갈래?' },
      ],
    },
    {
      title: '물려줄 씨앗',
      hint: '츠나데와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '늦가을 텃밭. 마지막 배추를 거둔 고랑이 가지런히 비어 있다.',
        '츠나데가 작은 천 주머니를 내 손바닥에 올리고 두 손으로 감싼다.',
        '주머니 속에서 씨앗들이 사르르 구르는 소리가 난다.',
        '"내 텃밭 씨앗이야. 할아버지가 받고, 내가 받고, 이제 네 차례."',
        '"평생 누구한테 줄지 몰랐어. 줬다가 또 잃을까 봐 겁도 났고."',
        '"근데 씨앗은 묻어야 나는 거더라. 쥐고만 있으면 그냥 돌이야."',
        '"목걸이는 꼬마한테, 수첩은 너한테. 그리고 이것도 너한테."',
        '멀리서 톤톤이 꿀꿀대고, 조수가 또 땡땡이냐며 그녀를 부른다.',
        '츠나데는 못 들은 척 내 손을 더 꼭 쥔다.',
        '"…같이 심자. 이 밭에서. 내년에도, 그다음 해에도."',
        '"내가 할머니가 돼도. …아니, 그건 아니고. 나이 얘기는 빼고."',
      ],
      replies: [
        { say: '평생 같이 심자', tier: 'great', remember: 'seed-pouch', face: 'shy', answer: ['…그래. 잔소리도 평생이다. 각오했지?', '하하, 울긴 누가 울어. 흙먼지가 들어간 거야.'] },
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
    '톤톤이 너 가는 길 배웅하겠대. 꿀, 한 번 해 주고 가.',
    '오늘 잔소리는 다 썼다. 내일 치는 새로 담가 둘게.',
    '손 좀 씻고 다녀. 의사가 두 번 말하게 하지 마라.',
  ],
};
