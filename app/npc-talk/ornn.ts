// 오른 — 대장장이. 폭포 아래 마을 대장간과 산기슭 대장간을 맡는다. 과묵한 장인의
// 짧고 무뚝뚝한 반말("흠." "됐다." "가져와."). 남이 만든 물건엔 잔소리부터,
// 뭐든 혼자 하려는 고집, 칭찬엔 헛기침. 그래도 맡긴 연장은 누구보다 정성껏
// 벼리고 속은 여리다. 숫양 뿔, 산 밑 불, 산양, 나이는 묻지 말 것. 원작 대사는
// 옮기지 않고 말투와 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const ORNN_TALK: NpcTalkBook = {
  npc: 'ornn',
  memories: {
    'iron-heart': '금보다 철이 좋다고 했어요',
    'gold-eye': '반짝이는 금 광석이 좋다고 했어요',
    'help-hand': '물이라도 떠 오겠다고 했어요',
    'alone-ok': '혼자 해내는 게 멋있다고 했어요',
    'my-hammer': '언젠가 내 망치를 벼려 달라고 부탁했어요',
    'no-age': '나이는 묻지 않기로 했어요',
    'goat-path': '산양 길을 같이 걷기로 했어요',
    'slow-cool': '쇠는 천천히 식혀야 한다고 배웠어요',
    'bellows': '풀무를 밟아 봤어요',
    'chestnut': '화덕 군밤을 나눠 먹었어요',
    'quiet-ok': '말 없어도 통하면 된다고 했어요',
    'burn-care': '데인 손을 치료받으라고 했어요',
    'forge-seat': '불 옆자리를 받았어요',
    'mine-dawn': '새벽 광산에서 불 먹은 돌을 봤어요',
    'handle-fit': '단단한 나무로 망치 자루를 맞췄어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 다닌 날을 이야기했어요',
    'date-talk': '방에서 보낸 날을 이야기했어요',
  },
  talks: [
    {
      id: 'iron-or-gold',
      open: '{me}. 철이냐 금이냐. 하나만 골라.',
      replies: [
        { say: '철. 오래 가니까', tier: 'great', remember: 'iron-heart', answer: '흠. 맞다. 금은 예쁘고, 철은 버틴다. 넌 뭘 아는군.' },
        { say: '금! 반짝이잖아', tier: 'good', remember: 'gold-eye', answer: '솔직하군. 금도 좋다. 무르지만. 장신구는 금으로 한다.' },
        { say: '돌이 더 좋은데', tier: 'meh', face: 'think', answer: '…돌. 흠. 모루 받침은 돌이다. 틀린 말은 아니군.' },
      ],
    },
    {
      id: 'help',
      open: '다들 도와준다고 온다. 됐다고 해도 온다. 너도 그런 쪽이냐.',
      replies: [
        { say: '물만 떠 올게', tier: 'great', remember: 'help-hand', answer: '…물은 된다. 딱 거기까지다. 망치는 만지지 마.' },
        { say: '혼자 하는 거 멋있어', tier: 'good', remember: 'alone-ok', face: 'shy', answer: '흠. 헛기침이다. 멋 때문에 하는 거 아니다.' },
        { say: '망치 줘 봐, 내가 할게', tier: 'meh', face: 'calm', answer: '안 된다. 내 망치는 내 손만 안다. 구경이나 해.' },
      ],
    },
    {
      id: 'my-hammer',
      open: '망치는 남한테 안 맡긴다. 내 건 내가 벼렸다. 넌 망치 있나.',
      replies: [
        { say: '언젠가 네가 벼려 줘', tier: 'great', remember: 'my-hammer', answer: ['…남 망치는 안 벼린다. 원래는.', '흠. 기억해 두지. 언젠가다. 서두르지 마.'] },
        { say: '빌린 거 쓰고 있어', tier: 'good', face: 'think', answer: '빌린 망치는 손에 안 붙는다. 언젠가 네 걸 가져.' },
        { say: '망치는 필요 없어', tier: 'meh', face: 'calm', answer: '필요 없는 놈은 없다. 아직 모르는 것뿐이다.' },
      ],
    },
    {
      id: 'horns',
      open: '뿔 쳐다보는군. 다들 그다음엔 나이를 묻더라.',
      replies: [
        { say: '안 물을게. 약속', tier: 'great', remember: 'no-age', answer: '흠. 좋다. 그 약속은 쇠처럼 지켜.' },
        { say: '뿔 멋있다', tier: 'good', face: 'shy', answer: '…원래 있던 거다. 멋이랑은 상관없다. 흠.' },
        { say: '그래서 몇 살인데?', tier: 'meh', face: 'calm', answer: '…방금 못 들었다. 망치 소리가 커서.' },
      ],
    },
    {
      id: 'goats',
      open: '산양은 남 도움 없이 절벽을 탄다. 넘어지면 혼자 일어나고.',
      replies: [
        { say: '그 길 같이 걸을래?', tier: 'great', remember: 'goat-path', answer: '…산양 길은 조용하다. 말 안 해도 된다. 그럼 가지.' },
        { say: '너랑 닮았네', tier: 'good', face: 'laugh', answer: '흠. 쟤들이 나를 닮은 거다. 내가 먼저 여기 있었다.' },
        { say: '염소 아니야?', tier: 'meh', face: 'think', answer: '…산양이다. 뿔 보면 안다. 다음엔 틀리지 마.' },
      ],
    },
    {
      id: 'quench',
      open: '달군 쇠를 찬물에 확 넣으면 어떻게 되는지 아나.',
      replies: [
        { say: '금이 가지 않아?', tier: 'great', remember: 'slow-cool', answer: '그래. 급하면 깨진다. 천천히 식혀야 단단해진다. 사람도.' },
        { say: '단단해지지!', tier: 'good', answer: '반은 맞다. 단단해지고, 잘못하면 깨진다. 그 사이를 본다.' },
        { say: '김이 많이 나', tier: 'meh', face: 'laugh', answer: '…그건 맞군. 흠. 틀린 말은 아닌데 쓸모가 없다.' },
      ],
    },
    {
      id: 'flowers',
      open: '대장간에 꽃 들고 오는 놈이 있다. 왜 그러는지 모르겠다.',
      replies: [
        { say: '불 옆이면 시들 텐데', tier: 'great', answer: '그 말이다. 꽃이 불쌍하다. 꽃은 밖에 둬라.' },
        { say: '대신 광석 가져올게', tier: 'good', face: 'smile', answer: '흠. 그게 낫다. 철이면 더 낫고.' },
        { say: '꽃 예쁘잖아', tier: 'meh', face: 'calm', answer: '예쁜 건 안다. 여기선 하루도 못 간다. 그게 문제다.' },
      ],
    },
    {
      id: 'bellows',
      open: '풀무다. 밟으면 불이 숨 쉰다. …밟아 볼래. 남한텐 안 시킨다.',
      replies: [
        { say: '박자 맞춰 밟을게', tier: 'great', remember: 'bellows', answer: '흠. 박자 좋다. 불이 좋아한다. 됐다, 그만. 잘했다.' },
        { say: '세게 밟으면 돼?', tier: 'good', face: 'think', answer: '세게 말고 꾸준히. 불은 몰아치면 삐친다.' },
        { say: '다리 아플 것 같아', tier: 'meh', face: 'calm', answer: '그럼 앉아 있어. 불은 내가 돌본다. 원래 그랬다.' },
      ],
    },
    {
      id: 'chestnut',
      open: '화덕 남는 자리에 군밤 굽는다. 불이 아깝다. …먹을 거냐.',
      replies: [
        { say: '응, 반씩 나누자', tier: 'great', remember: 'chestnut', answer: '흠. 큰 쪽 가져가. 껍질은 내가 깐다. 손 데니까.' },
        { say: '군밤 좋아해?', tier: 'good', face: 'smile', answer: '좋아한다. 말 안 했을 뿐이다. 이제 알았군.' },
        { say: '배불러', tier: 'meh', face: 'calm', answer: '그럼 주머니에 넣어 가. 식어도 먹을 만하다.' },
      ],
    },
    {
      id: 'others-work',
      open: '남이 벼린 날을 보면 손이 근질거린다. 엉망이라서.',
      replies: [
        { say: '다시 벼리고 싶지?', tier: 'great', face: 'laugh', answer: '흠. 들켰군. 가져오면 전보다 좋게 돌려준다. 늘 그렇다.' },
        { say: '그래도 쓸 만하던데', tier: 'good', face: 'think', answer: '쓸 만한 거랑 좋은 건 다르다. 그 차이가 내 일이다.' },
        { say: '잔소리 너무 많아', tier: 'meh', face: 'sorry', answer: '…알고 있다. 메르시도 그러더군. 고치진 않는다.' },
      ],
    },
    {
      id: 'quiet',
      open: '말 많은 놈은 피곤하다. 말 없는 놈은 편하다. 넌 어느 쪽이냐.',
      replies: [
        { say: '말 없어도 통하면 돼', tier: 'great', remember: 'quiet-ok', answer: '흠. 볼리바스랑 나도 그렇다. 세 마디면 끝난다.' },
        { say: '난 좀 수다쟁이야', tier: 'good', face: 'smile', answer: '…괜찮다. 네 수다는 모루 소리 정도다. 들을 만하다.' },
        { say: '말 안 하면 답답해', tier: 'meh', face: 'calm', answer: '그럼 망치한테 말 걸어. 대답은 해 준다. 땅, 땅.' },
      ],
    },
    {
      id: 'burn',
      open: '손등? 데인 거다. 별거 아니다. 쳐다보지 마.',
      replies: [
        { say: '메르시한테 꼭 가 봐', tier: 'great', remember: 'burn-care', answer: '…잔소리 듣기 싫은데. 흠. 간다. 네가 그러니까.' },
        { say: '연고 발라 줄게', tier: 'good', face: 'shy', answer: '…됐다. 아니, 한 번만. 살살 해라.' },
        { say: '대장장이면 익숙하겠네', tier: 'meh', face: 'calm', answer: '익숙하다. 아픈 건 아픈 거다. 그건 안 익숙해진다.' },
      ],
    },
    {
      id: 'forge-seat',
      when: { ch: 3 },
      open: '{me}. 불 옆에 의자 하나 놨다. 내가 짰다. 안 삐걱댄다.',
      replies: [
        { say: '내 자리야?', tier: 'great', remember: 'forge-seat', face: 'shy', answer: '…흠. 비어 있으면 불이 허전해한다. 앉든지.' },
        { say: '튼튼해 보인다', tier: 'good', answer: '튼튼하다. 백 년은 간다. 너보다 오래 갈 거다. 아마.' },
        { say: '난 서 있을게', tier: 'meh', face: 'calm', answer: '그래. 의자는 기다린다. 쇠처럼.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: 'rain' },
      open: '비다. 풀무가 습하다. 불이 짜증 낸다. {me}, 문 닫고 들어와.',
      replies: [
        { say: '연장 기름칠 도울게', tier: 'great', answer: '흠. 그건 된다. 얇게 발라. 녹은 비 오는 날 몰래 온다.' },
        { say: '빗소리 좋다', tier: 'good', face: 'smile', answer: '망치 박자랑 맞는다. 오늘은 그거 듣고 두드린다.' },
        { say: '비 싫어', tier: 'meh', face: 'calm', answer: '쇠도 싫어한다. 그래서 불 옆에 있는 거다. 앉아.' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: '천둥이다. 쇠 만지지 마. …꼭 누구 목소리 같군. 흠.',
      replies: [
        { say: '누구 목소리인데?', tier: 'good', face: 'think', answer: '…시끄러운 형제가 하나 있다. 그 얘긴 끝.' },
        { say: '불 옆에 있자', tier: 'great', answer: '그래. 오늘은 망치 쉰다. 불은 조용히 오래 간다. 번개보다.' },
        { say: '천둥 무서워', tier: 'meh', face: 'calm', answer: '무서우면 대장간에 있어. 여기 지붕은 내가 얹었다.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이다. 대장간이 제일 따뜻하다. {me}, 손 녹이고 가.',
      replies: [
        { say: '눈 녹은 물로 담금질해?', tier: 'great', answer: '흠. 어떻게 알았나. 차가운 물이 날을 맑게 한다. 좋은 눈이다.' },
        { say: '손이 꽁꽁 얼었어', tier: 'good', face: 'smile', answer: '불 쪽으로 내밀어. 너무 가까이는 말고. 데인다.' },
        { say: '눈 치우느라 힘들어', tier: 'meh', face: 'calm', answer: '대장간 앞은 쓸어 놨다. 고맙단 말은 필요 없다.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '밤 화덕은 용암 같다. 오래 보면 산 밑 생각이 난다. 흠.',
      replies: [
        { say: '산 밑 얘기 해 줘', tier: 'great', answer: ['뜨겁고 조용한 데다. 땅이 숨 쉬는 소리가 들린다.', '…오래전 얘기다. 이 정도만.'] },
        { say: '같이 불 보고 있을게', tier: 'good', face: 'smile', answer: '흠. 말 안 해도 된다. 불이 대신 떠든다.' },
        { say: '졸려서 갈게', tier: 'meh', face: 'calm', answer: '가. 산길 어둡다. 등불 들고.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '새벽부터 왔군. 불씨는 밤새 지켰다. 풀무 좀 밟아. …농담이다.',
      replies: [
        { say: '진짜 밟을게', tier: 'great', remember: 'bellows', answer: '…흠. 농담이라니까. 그래도 박자 좋다. 됐다.' },
        { say: '새벽 쇠는 어때?', tier: 'good', face: 'think', answer: '제일 정직하다. 아무도 안 깨어 있을 때 쇠도 솔직하다.' },
        { say: '아직 졸려', tier: 'meh', face: 'calm', answer: '그럼 불 옆에서 졸아. 깨워 주진 않는다.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제다. 대장간은 쉰다. 오늘만. 대신 군밤 굽는다.',
      replies: [
        { say: '군밤 같이 팔자!', tier: 'great', answer: '흠. 파는 건 아니다. 그냥 준다. 줄 세우는 건 네가 해.' },
        { say: '북소리 신난다', tier: 'good', face: 'smile', answer: '망치 박자보다 빠르다. 흠. 나쁘지 않다.' },
        { say: '쉬는 날도 있구나', tier: 'meh', face: 'think', answer: '불도 하루는 쉰다. 그래야 내일 더 세게 탄다.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '비린내 난다. {fish} 잡았군. 바늘 무뎌졌으면 가져와.',
      replies: [
        { say: '바늘 좀 봐 줘', tier: 'great', answer: '이리 줘. …끝이 휘었다. 전보다 좋게 해 준다. 기다려.' },
        { say: '화덕에 구워 줄래?', tier: 'good', face: 'smile', answer: '흠. 불은 내가 제일 잘 안다. 소금은 네가 쳐.' },
        { say: '냄새 많이 나?', tier: 'meh', face: 'calm', answer: '많이 난다. 괜찮다. 쇠 냄새보단 낫다.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '광장이 시끄럽다. 네가 큰 놈 잡았다더군. 흠.',
      replies: [
        { say: '낚싯대 덕분이야', tier: 'great', face: 'shy', answer: '…그 낚싯대 내가 손봤지. 흠. 헛기침이다. 잘했다.' },
        { say: '팔이 아직 떨려', tier: 'good', answer: '그만큼 버텼다는 거다. 앉아. 오늘은 쉬어.' },
        { say: '운이었어', tier: 'meh', face: 'think', answer: '운은 벼릴 수 없다. 그래도 받은 건 받은 거다.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '흙 묻었군. 밭일했나. 괭이 날 좀 보자.',
      replies: [
        { say: '여기, 봐 줘', tier: 'great', answer: '흠. 잘 썼다. 날이 고르게 닳았다. 기름칠은 공짜다.' },
        { say: '허리가 아파', tier: 'good', face: 'sorry', answer: '자루가 짧아서 그렇다. 네 키에 맞게 다시 깎아 주지.' },
        { say: '괭이는 멀쩡해', tier: 'meh', face: 'calm', answer: '멀쩡한 거랑 좋은 건 다르다. 다음엔 가져와.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물 나왔다며. 흠. 금은 땅 위에서도 나는군.',
      replies: [
        { say: '광석보다 반짝여?', tier: 'great', face: 'laugh', answer: '…비슷하다. 녹일 순 없지만. 축하한다. 짧게.' },
        { say: '네 괭이 덕분이야', tier: 'good', face: 'shy', answer: '흠. 괭이는 거들 뿐이다. 땅 고른 건 너다.' },
        { say: '그냥 운이야', tier: 'meh', face: 'calm', answer: '정성 들인 땅에 운도 온다. 그게 다다.' },
      ],
    },
    {
      id: 'op-low-mood',
      when: { mood: 'low' },
      open: '{me}. 얼굴에 금이 갔군. 앉아. 말 안 해도 된다.',
      replies: [
        { say: '그냥 옆에 있을게', tier: 'great', face: 'smile', answer: '흠. 그래라. 망치 소리 들으면 속이 좀 풀린다.' },
        { say: '좀 지쳤어', tier: 'good', answer: '금 간 쇠도 다시 녹이면 된다. 너도 그렇다. 오늘은 쉬어.' },
        { say: '괜찮아, 갈게', tier: 'meh', face: 'sorry', answer: '…그래. 군밤 하나 가져가. 따뜻할 때.' },
      ],
    },
    {
      id: 'op-record',
      when: { news: 'record' },
      open: '마을에 새 기록 났다더군. 흠. 기록은 깨라고 있는 거다.',
      replies: [
        { say: '다음엔 내가 깰게', tier: 'great', answer: '흠. 그럼 연장부터 가져와. 기록은 좋은 연장에서 나온다.' },
        { say: '대단하다', tier: 'good', face: 'smile', answer: '대단하다. 나도 쇠 기록 하나 있다. 말은 안 한다.' },
        { say: '난 관심 없어', tier: 'meh', face: 'calm', answer: '그것도 괜찮다. 남 기록보다 네 하루가 중요하다.' },
      ],
    },
    {
      id: 'op-volibas',
      when: { bond: 'volibas' },
      open: '{other} 만났나. 별말 없었지. 원래 그렇다. 나도 그렇고.',
      replies: [
        { say: '둘이 무슨 얘기 해?', tier: 'great', answer: '날씨. 쇠. 됐다. 세 마디면 끝난다. 그래서 편하다.' },
        { say: '덩치가 비슷하네', tier: 'good', face: 'laugh', answer: '흠. 문 지날 때 둘 다 고개 숙인다. 그건 맞다.' },
        { say: '좀 무섭던데', tier: 'meh', face: 'calm', answer: '안 무섭다. 말만 없지. 나처럼.' },
      ],
    },
    {
      id: 'op-carpenter',
      when: { bond: 'carpenter' },
      open: '{other} 봤나. 또 도끼날 투덜댔지. 벼려 준 지 사흘 됐다.',
      replies: [
        { say: '고맙다고 했어', tier: 'great', face: 'shy', answer: '…거짓말. 흠. 아니면 됐고. 다음 날은 더 좋게 해 준다.' },
        { say: '둘이 똑같이 투덜대', tier: 'good', face: 'laugh', answer: '흠. 그 녀석이 먼저다. 나는 대답만 한다.' },
        { say: '날이 무디대', tier: 'meh', face: 'think', answer: '무딘 게 아니다. 나무를 잘못 쳤다. 가져오라고 해.' },
      ],
    },
    {
      id: 'op-thresh',
      when: { bond: 'thresh' },
      open: '{other} 만났군. 광석 값 또 깎자고 하던가.',
      replies: [
        { say: '네 편 들어 줬어', tier: 'great', answer: '흠. 잘했다. 철은 철값이다. 한 푼도 안 깎는다.' },
        { say: '그냥 웃기만 하던데', tier: 'good', face: 'think', answer: '그 웃음이 제일 비싸다. 조심해.' },
        { say: '조금 깎아 줘', tier: 'meh', face: 'calm', answer: '…안 된다. 너라도. 대신 기름칠은 공짜다.' },
      ],
    },
    {
      id: 'op-mercy',
      when: { bond: 'mercy' },
      open: '{other} 만났나. 내 얘기 했지. 연고 안 바른다고.',
      replies: [
        { say: '걱정 많이 하더라', tier: 'great', face: 'sorry', answer: '…흠. 안다. 오늘은 바른다. 진짜다.' },
        { say: '물 한 동이 옆에 두래', tier: 'good', answer: '두고 있다. 여름엔. 겨울엔… 잊는다.' },
        { say: '아무 말 없었어', tier: 'meh', face: 'think', answer: '그럴 리 없다. 그 사람은 늘 내 손부터 본다.' },
      ],
    },
    {
      id: 'op-nilah',
      when: { bond: 'nilah' },
      open: '{other} 봤나. 웃음소리가 모루 소리보다 크다. 흠.',
      replies: [
        { say: '울타리 못 얘기 했어', tier: 'great', answer: '그 녀석 못은 따로 굵게 벼린다. 뭐든 세게 민다.' },
        { say: '같이 있으면 신나', tier: 'good', face: 'smile', answer: '…신나긴 하다. 시끄럽지만. 둘 다 맞다.' },
        { say: '너무 시끄러워', tier: 'meh', face: 'laugh', answer: '흠. 그래도 그 웃음 들으면 망치가 가볍다.' },
      ],
    },
    {
      id: 'op-gabung',
      when: { bond: 'gabung' },
      open: '{other} 등대 등불 갓 고쳐 줬다. 고맙다고 소리를 지르더군.',
      replies: [
        { say: '엄청 기뻐하던데', tier: 'great', face: 'shy', answer: '…귀가 아직 울린다. 흠. 그래도 됐다.' },
        { say: '정의의 불꽃이래', tier: 'good', face: 'laugh', answer: '흠. 불은 불이다. 정의는 모르겠다. 잘 타면 됐다.' },
        { say: '또 고장 낼 것 같아', tier: 'meh', face: 'calm', answer: '그럼 또 고친다. 그게 내 일이다.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-iron',
      when: { mem: 'iron-heart' },
      use: 'iron-heart',
      open: '철이 좋다던 {me}. 오늘 좋은 철 들어왔다. 결 봐라.',
      replies: [
        { say: '결이 곧네', tier: 'great', answer: '흠. 눈이 생겼군. 이건 네 연장에 쓴다. 정했다.' },
        { say: '기억하고 있었어?', tier: 'good', face: 'shy', answer: '…쇠 얘기는 안 잊는다. 그뿐이다.' },
      ],
    },
    {
      id: 'cb-help',
      when: { mem: 'help-hand' },
      use: 'help-hand',
      open: '물 떠 온다던 거. 오늘 물동이 비었다. …부탁한다. 흠.',
      replies: [
        { say: '금방 떠 올게!', tier: 'great', answer: '…고맙다. 남한테 부탁한 거 오랜만이다. 흠.' },
        { say: '부탁도 할 줄 아네', tier: 'good', face: 'laugh', answer: '흠. 한 번이다. 버릇 되진 않는다.' },
      ],
    },
    {
      id: 'cb-goat',
      when: { mem: 'goat-path' },
      use: 'goat-path',
      open: '산양 길 같이 걷기로 했지. 새끼 산양이 태어났다. 보러 갈 거냐.',
      replies: [
        { say: '가자, 지금!', tier: 'great', answer: '흠. 조용히 가. 놀라면 바위로 숨는다. 나처럼.' },
        { say: '귀엽겠다', tier: 'good', face: 'smile', answer: '…귀엽다. 넘어져도 혼자 일어난다. 그게 더 귀엽다.' },
      ],
    },
    {
      id: 'cb-cool',
      when: { mem: 'slow-cool' },
      use: 'slow-cool',
      open: '쇠는 천천히 식힌다고 했지. 오늘 네 얼굴이 좀 달아 보인다.',
      replies: [
        { say: '천천히 식히는 중이야', tier: 'great', face: 'laugh', answer: '흠. 잘 배웠군. 그럼 금 안 간다.' },
        { say: '바빠서 그래', tier: 'good', answer: '바빠도 쉬어 가. 급하면 깨진다. 쇠든 사람이든.' },
      ],
    },
    {
      id: 'cb-burn',
      when: { mem: 'burn-care' },
      use: 'burn-care',
      open: '메르시한테 갔다. 네가 가라고 해서. 잔소리 한 시간 들었다.',
      replies: [
        { say: '잘했어. 손 보여 줘', tier: 'great', face: 'shy', answer: '…다 나았다. 봐라. 흠. 됐지.' },
        { say: '잔소리 들을 만했지', tier: 'good', face: 'laugh', answer: '흠. 반은 맞는 말이었다. 반만.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}. 좋아하는 게 {taste}라며. 수첩 보고 알았다. 흠.',
      replies: [
        { say: '그걸 기억해 줬어?', tier: 'great', remember: 'taste-heard', face: 'shy', answer: '쇠 말고도 기억하는 게 있다. 가끔.' },
        { say: '너도 하나 말해 줘', tier: 'good', remember: 'taste-heard', answer: '철 광석. 단단한 나무. 끝. 다 알잖나.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 다닌 날. 대장간 비운 거 처음이었다. 흠.',
      replies: [
        { say: '또 같이 나가자', tier: 'great', remember: 'outing-talk', answer: '…불 꺼지기 전까지만. 아니, 다시 지피면 된다. 가지.' },
        { say: '불은 괜찮았어?', tier: 'good', remember: 'outing-talk', face: 'laugh', answer: '꺼졌다. 다시 지폈다. 흠. 괜찮았다.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '네 방 선반. 각이 틀렸더군. 말 안 하려 했는데 신경 쓰인다.',
      replies: [
        { say: '다음에 고쳐 줘', tier: 'great', remember: 'date-talk', face: 'shy', answer: '흠. 간다. 연장 들고. …너 보러 가는 거기도 하다.' },
        { say: '내가 짠 건데…', tier: 'good', remember: 'date-talk', face: 'sorry', answer: '…흠. 그럼 괜찮다. 네 손이면 삐뚤어도 된다.' },
      ],
    },
  ],
  chapters: [
    {
      title: '모루 앞의 첫 인사',
      hint: '한 번 이야기를 나누면 오른이 모루 앞에서 고개를 들어요.',
      need: { days: 1 },
      scene: [
        '망치 소리가 멈춘다. 오른이 고개를 든다. 뿔 끝에 불빛이 걸린다.',
        '"…오른이다. 대장장이. 나이는 묻지 마."',
        '그가 네 손을 잠깐 본다. 굳은살을 보는 눈이다.',
        '"연장 가져오면 더 좋게 해 준다. 그게 다다."',
      ],
      replies: [
        { say: '내 연장 부탁할게', tier: 'great', answer: '흠. 가져와. 줄은 서. 남들 다 선다.' },
        { say: '뿔이 멋있어요', tier: 'good', face: 'shy', answer: '…원래 있던 거다. 연장 얘기나 해.' },
        { say: '나이가 궁금한데', tier: 'meh', face: 'calm', answer: '…방금 말했다. 묻지 마.' },
      ],
    },
    {
      title: '새벽 광산의 불 먹은 돌',
      hint: '새벽(게임 시각 오전 다섯 시부터 아홉 시) 광산에 가 보세요. 오른이 돌을 고른대요.',
      need: { days: 3, points: 20, visit: { area: 'mine', from: 5, to: 9 } },
      scene: [
        '광산 입구, 새벽 공기가 차다. 오른이 등불 하나 들고 서 있다.',
        '"왔군. 늦지 않았다. 흠."',
        '그가 검붉은 돌 하나를 집어 든다. 손바닥에서 아직 따뜻하다.',
        '"불을 먹었던 돌이다. 산 밑 냄새가 난다."',
        '"아무한테나 안 보여 준다. 넌 시끄럽지 않으니까."',
      ],
      replies: [
        { say: '따뜻하다. 살아 있는 것 같아', tier: 'great', remember: 'mine-dawn', answer: '…그래. 그렇게 느끼는 놈 드물다. 가져가. 주머니에.' },
        { say: '이걸로 뭘 만들어?', tier: 'good', remember: 'mine-dawn', face: 'think', answer: '아직 모른다. 돌이 말할 때까지 기다린다.' },
        { say: '새벽은 너무 추워', tier: 'meh', remember: 'mine-dawn', face: 'calm', answer: '흠. 등불 가까이 와. 불은 나눠 쓰는 거다.' },
      ],
    },
    {
      title: '단단한 나무 자루',
      hint: '오른이 망치 자루감을 찾고 있어요. 단단한 나무 하나를 가지고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'hardwood', take: true } },
      scene: [
        '단단한 나무를 내밀자 오른이 말없이 결을 쓰다듬는다.',
        '"…좋은 결이다. 어디서 났나. 아니, 됐다."',
        '그가 칼을 들고 천천히 깎기 시작한다. 한 번도 서두르지 않는다.',
        '"자루는 손을 닮아야 한다. 남이 깎은 자루는 손에서 논다."',
        '"오늘은 내 손 말고 네 손을 보고 깎았다. 쥐어 봐."',
      ],
      replies: [
        { say: '손에 딱 맞아', tier: 'great', remember: 'handle-fit', face: 'shy', answer: '…당연하다. 내가 깎았다. 흠. 헛기침이다.' },
        { say: '네 손에 맞춰야지', tier: 'good', remember: 'handle-fit', answer: '내 건 많다. 이건 네 거다. 잔말 말고 받아.' },
        { say: '조금 무거운데', tier: 'meh', remember: 'handle-fit', face: 'think', answer: '무거워야 쇠가 말을 듣는다. 금방 익숙해진다.' },
      ],
    },
    {
      title: '네 망치',
      hint: '오른에게 언젠가 내 망치를 벼려 달라고 부탁해 두면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'my-hammer' },
      scene: [
        '밤 대장간. 오른이 문을 닫고 화덕 불을 끝까지 올린다.',
        '"언젠가 벼려 달라고 했지. 언젠가가 오늘이다."',
        '땅, 땅. 망치 소리가 오래 이어진다. 그는 한 번도 쉬지 않는다.',
        '마침내 그가 작은 망치 하나를 네 앞에 놓는다.',
        '"남 망치는 안 벼렸다. 처음이다. 그러니 함부로 쓰지 마."',
      ],
      replies: [
        { say: '평생 아껴 쓸게', tier: 'great', face: 'shy', answer: '…흠. 평생이면 가끔 가져와. 다시 벼려 줄 테니.' },
        { say: '왜 나한테만?', tier: 'good', face: 'think', answer: '…몰라. 손이 그렇게 했다. 망치는 거짓말 안 한다.' },
        { say: '장식장에 둘게', tier: 'meh', face: 'calm', answer: '망치는 두드려야 산다. 장식은 꽃이나 해.' },
      ],
    },
    {
      title: '꺼지지 않는 불',
      hint: '오른과 아주 가까워지면 그가 화덕 앞에서 오래 말을 고른대요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '손님이 다 간 저녁. 오른이 화덕 불을 줄이지 않고 앉아 있다.',
        '"{me}. 혼자가 편했다. 산처럼 오래 그랬다."',
        '"요즘 망치질하다 자꾸 문 쪽을 본다. 네가 오나 하고."',
        '그가 헛기침을 한다. 두 번. 불빛이 그의 귀를 붉게 물들인다.',
        '"…꽃은 불 옆에서 시든다고 했지. 네가 들고 오면 물부터 떠 놓겠다."',
      ],
      replies: [
        { say: '시들기 전에 줄게', tier: 'great', face: 'shy', answer: '…흠. 그럼 서둘러라. 이번만은 서둘러도 된다.' },
        { say: '꽃 싫다며', tier: 'good', face: 'laugh', answer: '싫다. 네가 주는 건 다르다. 이상하군. 흠.' },
        { say: '오늘은 그냥 갈게', tier: 'meh', face: 'calm', answer: '…그래. 불은 켜 둔다. 언제든.' },
      ],
    },
    {
      title: '두 사람의 모루',
      hint: '오른과 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '대장간 안, 모루 옆에 의자가 둘이다. 하나는 새것이다.',
        '"모루 앞엔 늘 혼자였다. 이제 둘이 앉는다. 그렇게 정했다."',
        '그가 손바닥을 편다. 작은 쇠고리 하나. 아직 다듬지 않았다.',
        '"반지 쇠다. 산 밑 제일 뜨거운 불로 녹일 거다. 안 식게."',
        '"남이 만든 건 못 믿는다. 네 손가락에 맞는 건 내가 안다."',
      ],
      replies: [
        { say: '네가 벼린 거면 좋아', tier: 'great', face: 'shy', answer: '…흠. 헛기침 좀 하자. 오래 걸려도 기다려. 제일 좋게 한다.' },
        { say: '맞을 때까지 고쳐 줘', tier: 'good', face: 'smile', answer: '몇 번이고 다시 벼린다. 그게 내 약속이다.' },
        { say: '아직은 이르지 않아?', tier: 'meh', face: 'calm', answer: '쇠는 천천히 식는다. 기다리지. 불은 안 꺼진다.' },
      ],
    },
  ],
  after: [
    '오늘 말 많이 했다. 이제 일한다.',
    '할 말 다 했다. 연장 무뎌지면 와라.',
    '흠. 또 왔나. 앉든지. 말은 안 한다.',
    '가. 산길 어둡다. 조심해서.',
  ],
};
