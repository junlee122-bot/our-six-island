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
    'learn-ask': '대장간 구경꾼으로 받아 달라고 했어요',
    'falls-forge': '폭포 아래 대장간 물소리가 궁금하다고 했어요',
    'ice-fire': '얼음 땅의 뜨거운 산 이야기를 들었어요',
    'rough-gem': '원석은 안을 봐야 안다고 했어요',
    'build-with': '다음엔 같이 짓자고 했어요',
    'rust-save': '녹슨 낫을 다시 살려 달라고 했어요',
    'striker': '메질꾼을 하겠다고 했어요',
    'night-think': '밤 망치 소리가 멈추는 까닭을 들었어요',
    'bday-heard': '생일 선물 이야기를 들었어요',
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
    {
      id: 'apprentice',
      open: ['제자 받으라고들 한다. 메르시도, 닐라도.', '…남한테 망치 쥐여 주는 건 어렵다. 넌 어떻게 보나.'],
      replies: [
        { say: '나부터 받아 봐', tier: 'great', remember: 'learn-ask', face: 'think', answer: ['…흠. 제자는 아니다. 구경꾼이다.', '구경꾼은 풀무까진 밟아도 된다. 그게 시작이다.'] },
        { say: '편하면 혼자 해도 돼', tier: 'good', face: 'calm', answer: '편하다. 그런데 편한 게 다 맞는 건 아니더군. 흠.' },
        { say: '귀찮잖아, 그냥 둬', tier: 'meh', face: 'sorry', answer: ['귀찮은 건 아니다. 무서운 거다.', '…방금 건 잊어. 망치 소리에 묻혔다.'] },
      ],
    },
    {
      id: 'two-forges',
      open: '폭포 아래 대장간, 산기슭 대장간. 둘 다 내 거다. 불도 둘이다.',
      replies: [
        { say: '폭포 물소리 좋겠다', tier: 'great', remember: 'falls-forge', face: 'smile', answer: ['좋다. 물레방아가 풀무를 돌린다. 박자가 맞는다.', '물소리 듣고 담금질하면 쇠가 맑다. 언제 보여 주지.'] },
        { say: '오가기 힘들지 않아?', tier: 'good', face: 'think', answer: ['힘들다. 그래도 남한테 불 못 맡긴다.', '…불이 날 기다리는 게 싫지 않다. 흠.'] },
        { say: '하나만 하면 되잖아', tier: 'meh', face: 'calm', answer: '하나는 마을 거, 하나는 내 거다. 둘 다 필요하다.' },
      ],
    },
    {
      id: 'ore-price',
      open: '쓰레쉬 그놈. 철광석을 구리 값에 달란다. 등불 흔들면서.',
      replies: [
        { say: '철은 철값이지', tier: 'great', face: 'laugh', answer: '흠. 그 말이다. 다음에 그놈한테 그대로 해 주지.' },
        { say: '흥정도 재미잖아', tier: 'good', face: 'think', answer: ['재미없다. 쇠 값은 쇠가 정한다.', '…그래도 그놈이 안 오면 좀 심심하긴 하다. 흠.'] },
        { say: '좀 깎아 주지 그래', tier: 'meh', face: 'calm', answer: '깎는 건 나무다. 값이 아니다.' },
      ],
    },
    {
      id: 'axe-grumble',
      open: '발키리 도끼날, 또 이 빠졌다. 옹이를 정면으로 친 거다.',
      replies: [
        { say: '고쳐 주며 투덜대지?', tier: 'great', face: 'laugh', answer: ['투덜대는 건 그쪽이다. 나는 고칠 뿐이다.', '…조금은 투덜댄다. 서로 그게 인사다.'] },
        { say: '목수한텐 도끼가 생명이지', tier: 'good', face: 'smile', answer: '안다. 그래서 내가 벼린다. 딴 데 가면 망친다.' },
        { say: '새로 사라고 해', tier: 'meh', face: 'calm', answer: '좋은 도끼는 안 버린다. 사람이랑 같다.' },
      ],
    },
    {
      id: 'arm-wrestle',
      open: '닐라가 팔씨름하잔다. 매일. 망치 든 팔이라고 봐줄 줄 아나.',
      replies: [
        { say: '둘이 하면 누가 이겨?', tier: 'great', face: 'laugh', answer: ['비긴다. 볼리바스가 늘 무승부라더군.', '순경 판정이다. 흠. 나쁘지 않다.'] },
        { say: '한 번 져 줘', tier: 'good', face: 'think', answer: '…져 준 적 있다. 들켜서 더 시끄러워졌다.' },
        { say: '팔 다치면 어떡해', tier: 'meh', face: 'calm', answer: '안 다친다. 메르시 잔소리가 더 아프다.' },
      ],
    },
    {
      id: 'loud-brother',
      open: '천둥 치면 생각나는 녀석이 있다. 번개 쪽. 형제 같은 거다.',
      replies: [
        { say: '형제면 보고 싶겠다', tier: 'great', face: 'shy', answer: ['…흠. 안 보고 싶다. 조용해서 좋다.', '…가끔은. 아주 가끔. 말하지 마라.'] },
        { say: '사이 안 좋아?', tier: 'good', face: 'think', answer: '시끄럽다. 그게 다다. 나쁜 놈은 아니다. 시끄러울 뿐.' },
        { say: '번개 멋있잖아', tier: 'meh', face: 'calm', answer: '번개는 한 번 번쩍하고 끝이다. 불은 오래 간다.' },
      ],
    },
    {
      id: 'home-mountain',
      open: '북쪽 얼음 땅에 산이 있다. 속이 뜨거운 산. 거기서 왔다.',
      replies: [
        { say: '얼음 위에 불이라니', tier: 'great', remember: 'ice-fire', face: 'smile', answer: ['그렇다. 겉은 차고 속은 뜨겁다.', '…산 얘기다. 내 얘기 아니다. 흠.'] },
        { say: '고향 그립지 않아?', tier: 'good', face: 'think', answer: '산은 안 움직인다. 언제 가도 있다. 그래서 안 급하다.' },
        { say: '추운 데 싫어', tier: 'meh', face: 'calm', answer: '그럼 대장간에 있어. 여기가 제일 따뜻하다.' },
      ],
    },
    {
      id: 'beard',
      open: '수염 색 묻지 마. 원래 이 색이다. 불에 그을린 거 아니다.',
      replies: [
        { say: '분홍 수염 좋은데', tier: 'great', face: 'shy', answer: '…흠. 헛기침. 좋다는 놈은 처음이다. 이상한 놈이군.' },
        { say: '관리는 어떻게 해?', tier: 'good', face: 'think', answer: '안 한다. 불 가까이 안 대는 게 관리다.' },
        { say: '탄 줄 알았어', tier: 'meh', face: 'calm', answer: '다들 그런다. 그래서 먼저 말했다.' },
      ],
    },
    {
      id: 'pudding',
      open: '누가 바닐라 푸딩을 두고 갔다. 흐물거린다. 쇠랑 반대다.',
      replies: [
        { say: '군밤이랑 바꿔 먹자', tier: 'great', face: 'laugh', answer: '흠. 거래 됐다. 푸딩은 네가. 군밤은 내가.' },
        { say: '달고 부드러운데', tier: 'good', face: 'think', answer: '부드러운 건 좋다. 남이 먹으면. 난 씹을 게 있어야 한다.' },
        { say: '수박화채는 어때?', tier: 'meh', face: 'sorry', answer: '…그것도 흐물거린다. 둘 다 사양한다.' },
      ],
    },
    {
      id: 'rough-gem',
      open: '보석 원석은 깎기 전엔 돌이다. 다들 그냥 지나친다.',
      replies: [
        { say: '안을 봐야 알지', tier: 'great', remember: 'rough-gem', face: 'smile', answer: ['그래. 겉만 보면 모른다. 사람도.', '…좋은 말 했다. 기억해 두지.'] },
        { say: '깎으면 얼마나 반짝여?', tier: 'good', face: 'think', answer: '깎는 놈 손에 달렸다. 서두르면 깨지고.' },
        { say: '돌은 돌이지', tier: 'meh', face: 'calm', answer: '…흠. 그렇게 보면 그렇다. 아까운 눈이다.' },
      ],
    },
    {
      id: 'self-made',
      open: '이 대장간 기둥, 지붕, 문짝. 다 내가 했다. 남한테 안 맡겼다.',
      replies: [
        { say: '다음엔 나도 끼워 줘', tier: 'great', remember: 'build-with', face: 'shy', answer: ['…흠. 못 박는 건 된다. 비뚤면 다시 박는다.', '…그래. 끼워 주지. 다음에.'] },
        { say: '혼자 다 했다고?', tier: 'good', face: 'think', answer: '다 했다. 오래 걸렸다. 그래도 안 무너졌다.' },
        { say: '목수한테 맡기지', tier: 'meh', face: 'calm', answer: '발키리 말인가. 싸운다. 문짝 각 하나로 반나절.' },
      ],
    },
    {
      id: 'step-up',
      open: '다들 연장을 한 번에 끝까지 올려 달란다. 안 된다. 한 단계씩.',
      replies: [
        { say: '천천히 해야 오래 가지', tier: 'great', face: 'smile', answer: '그렇다. 쇠도 사람도 단계가 있다. 건너뛰면 금 간다.' },
        { say: '다음 단계는 언제야?', tier: 'good', face: 'think', answer: '쓰다 보면 안다. 손에 익으면 가져와.' },
        { say: '빨리 되면 좋잖아', tier: 'meh', face: 'calm', answer: '빨리 된 건 빨리 망가진다. 기다려.' },
      ],
    },
    {
      id: 'thanks-word',
      open: '고맙다는 말. 쇠 두드리는 것보다 어렵다. 넌 쉽게 하더군.',
      replies: [
        { say: '망치 소리로 들었어', tier: 'great', face: 'shy', answer: '…흠. 그럼 됐다. 망치는 거짓말 안 한다.' },
        { say: '한 번 해 봐, 지금', tier: 'good', face: 'sorry', answer: ['…고. …흠. 목에 걸렸다.', '…고맙다. 됐다. 끝.'] },
        { say: '굳이 안 해도 돼', tier: 'meh', face: 'calm', answer: '안 해도 되는 말은 없다. 연습은 하지. 혼자.' },
      ],
    },
    {
      id: 'milk',
      open: '닐라가 우유를 두고 갔다. 우유 통 고쳐 준 값이라나. 흠.',
      replies: [
        { say: '화덕에 데워 마셔', tier: 'great', face: 'smile', answer: '화덕이면 금방이다. …한 잔 줄까. 흠.' },
        { say: '우유 좋아해?', tier: 'good', face: 'shy', answer: '…좋아한다. 뿔이랑 안 어울린다고 하지 마.' },
        { say: '값은 돈으로 받아', tier: 'meh', face: 'calm', answer: '돈보다 우유가 낫다. 닐라 우유는 진하다.' },
      ],
    },
    {
      id: 'rust',
      open: '버려진 낫을 주웠다. 녹투성이다. 다들 끝났다고 했겠지.',
      replies: [
        { say: '다시 살릴 수 있지?', tier: 'great', remember: 'rust-save', face: 'smile', answer: ['살린다. 녹은 겉이다. 속은 아직 쇠다.', '다 되면 보여 주지. 전보다 좋을 거다.'] },
        { say: '누가 버렸을까', tier: 'good', face: 'think', answer: '모른다. 버린 놈보다 쓸 놈이 중요하다.' },
        { say: '새로 만드는 게 빠르잖아', tier: 'meh', face: 'calm', answer: '빠르다. 그런데 이 낫은 이 낫뿐이다.' },
      ],
    },
    {
      id: 'hot-spring',
      open: '온천 공사 관, 내가 벼렸다. 땅속 열은 산 밑 불이랑 친척이다.',
      replies: [
        { say: '다 되면 같이 가자', tier: 'great', face: 'shy', answer: '…흠. 뿔 때문에 수건이 안 맞는다. 그래도 가지.' },
        { say: '땅이 따뜻하구나', tier: 'good', face: 'smile', answer: '땅은 늘 따뜻하다. 위에서 모를 뿐이다.' },
        { say: '뜨거운 물은 싫어', tier: 'meh', face: 'calm', answer: '그럼 발만 담가. 그것도 좋다.' },
      ],
    },
    {
      id: 'tavern',
      open: '주점은 시끄럽다. 그래도 달에 한 번은 간다. 조용한 구석에.',
      replies: [
        { say: '구석에서 같이 마시자', tier: 'great', face: 'smile', answer: '흠. 한 잔이다. 내일 불 지펴야 한다. …두 잔.' },
        { say: '거기서 뭐 마셔?', tier: 'good', face: 'shy', answer: '따뜻한 우유. 웃지 마라.' },
        { say: '시끄러운 데가 재밌는데', tier: 'meh', face: 'calm', answer: '너는 그래라. 난 구석이 좋다.' },
      ],
    },
    {
      id: 'tool-names',
      open: '연장에 이름 붙이는 놈들 있지. 쓸데없다. …내 망치 빼고.',
      replies: [
        { say: '망치 이름이 뭔데?', tier: 'great', face: 'shy', answer: ['…안 알려 준다. 망치랑 나만 안다.', '…흠. 나중에. 아주 나중에.'] },
        { say: '나도 괭이에 이름 있어', tier: 'good', face: 'laugh', answer: '흠. 그럼 그 이름 불러 주면서 써라. 연장도 안다.' },
        { say: '좀 유치하다', tier: 'meh', face: 'calm', answer: '유치하다. 안다. 그래서 말 안 했다.' },
      ],
    },
    {
      id: 'mine-sound',
      open: '광산 깊은 데선 돌이 운다. 무섭다는 놈도 있다. 난 좋다.',
      replies: [
        { say: '돌이 뭐라고 하는데?', tier: 'great', face: 'smile', answer: ['여기 캐라. 저긴 무너진다. 그런 말이다.', '오래 들으면 안다. 난 오래 들었다.'] },
        { say: '나는 좀 무서워', tier: 'good', face: 'calm', answer: '무서우면 내 옆에 붙어. 등불은 내가 든다.' },
        { say: '그냥 바람 소리 아냐?', tier: 'meh', face: 'think', answer: '…바람도 돌을 지나야 운다. 결국 돌이다.' },
      ],
    },
    {
      id: 'striker',
      when: { ch: 4 },
      open: ['대장장이 옆엔 원래 메질꾼이 있다. 큰 망치 드는 사람.', '난 늘 혼자 했다. 둘 몫을. 그래서 오래 걸렸다.'],
      replies: [
        { say: '내가 메질꾼 할게', tier: 'great', remember: 'striker', face: 'shy', answer: ['…흠. 박자 틀리면 내 손 친다. 알고 있나.', '…그래도 해 봐. 둘이 치면 쇠가 빨리 선다.'] },
        { say: '혼자서도 잘했잖아', tier: 'good', face: 'think', answer: '잘했다. 그런데 잘하는 거랑 즐거운 건 다르더군.' },
        { say: '큰 망치는 무거워', tier: 'meh', face: 'calm', answer: '무겁다. 그러니 작은 걸로 시작해. 네 망치로.' },
      ],
    },
    {
      id: 'love-hands',
      when: { love: 'dating' },
      open: '{me}. 손 줘 봐. …굳은살 생겼군. 내 탓이다.',
      replies: [
        { say: '같이 일해서 생긴 거야', tier: 'great', face: 'shy', answer: ['…흠. 같이. 그 말 좋다.', '연고 발라라. 메르시 거. 내가 사 놨다.'] },
        { say: '네 손이 더 거칠어', tier: 'good', face: 'laugh', answer: '내 손은 원래 돌이다. 네 손은 아니다.' },
        { say: '괜찮아, 별거 아냐', tier: 'meh', face: 'sorry', answer: '…별거다. 내 앞에선 그런 말 하지 마.' },
      ],
    },
    {
      id: 'love-night',
      when: { love: 'dating' },
      open: '밤에 망치 소리가 멈추면. 네 생각 하는 중이다. 흠. 알아 둬.',
      replies: [
        { say: '나도 그 소리 기다려', tier: 'great', remember: 'night-think', face: 'shy', answer: ['…그럼 오늘은 늦게까지 두드린다.', '멈추는 데도 있다. 거기서 내 이름 불러.'] },
        { say: '그럼 일은 언제 해?', tier: 'good', face: 'laugh', answer: '흠. 요즘 좀 밀렸다. 네 탓이다. 좋은 쪽으로.' },
        { say: '잠은 자야지', tier: 'meh', face: 'calm', answer: '…잔다. 네 생각 다 하고 나서.' },
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
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '해 좋다. 젖은 광석 말리기 딱이다. {me}, 바위에 펴는 거 거들어.',
      replies: [
        { say: '큰 것부터 펼게', tier: 'great', face: 'smile', answer: ['흠. 순서 안다. 작은 건 바람에 굴러간다.', '…거든 거 잘했다. 이번만 말한다.'] },
        { say: '광석도 볕을 쬐는구나', tier: 'good', face: 'think', answer: '젖은 돌은 불에 넣으면 튄다. 말려야 얌전하다.' },
        { say: '난 그늘에 있을래', tier: 'meh', face: 'calm', answer: '그래라. 볕은 내가 쬔다. 뿔이 따뜻하다.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐리군. 이런 날은 불빛 색이 잘 보인다. 쇠 보기 좋은 날이다.',
      replies: [
        { say: '쇠 색 보는 법 알려 줘', tier: 'great', face: 'smile', answer: ['붉으면 이르다. 주황이면 친다. 하얘지면 늦다.', '…흠. 너무 많이 말했다. 눈으로 배워.'] },
        { say: '해가 없으니 쌀쌀해', tier: 'good', face: 'calm', answer: '그럼 화덕 옆에 서. 구름은 불 못 가린다.' },
        { say: '흐린 날은 우울해', tier: 'meh', face: 'think', answer: '하늘이 흐린 거다. 너까지 흐릴 거 없다.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄이다. 괭이 들고 줄 선 놈들이 문 밖까지다. 흠. 너도 줄 서.',
      replies: [
        { say: '물 떠 놓고 줄 설게', tier: 'great', face: 'smile', answer: '…흠. 물은 화덕 옆에 둬. 줄은 맨 뒤다. 그래도.' },
        { say: '다들 급하구나', tier: 'good', face: 'think', answer: '봄엔 다 급하다. 쇠만 안 급하다. 그래서 줄이다.' },
        { say: '새치기하면 안 돼?', tier: 'meh', face: 'calm', answer: '안 된다. 볼리바스 부른다.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: '여름 대장간은 화산 속이다. {me}, 들어오면 물부터 마셔.',
      replies: [
        { say: '너도 같이 마셔', tier: 'great', face: 'shy', answer: ['…흠. 마신다. 메르시가 시킨 거 아니다.', '네가 내밀어서다. 그뿐이다.'] },
        { say: '안 더워?', tier: 'good', face: 'think', answer: '덥다. 산 밑보단 시원하다. 그래서 견딘다.' },
        { say: '밖에서 얘기하자', tier: 'meh', face: 'calm', answer: '불 두고 못 나간다. 문턱까지만 와.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '장작 철이다. 도끼 갈러 온 놈만 오늘 열둘이다. 흠.',
      replies: [
        { say: '숫돌 물은 내가 갈게', tier: 'great', remember: 'help-hand', face: 'smile', answer: '…된다. 물은 된다. 딱 거기까지다. 흠. 고맙다.' },
        { say: '가을 쇠는 단단하다며', tier: 'good', face: 'think', answer: '단단하다. 바람이 차서 그렇다. 기분 탓 아니다.' },
        { say: '열둘이면 금방이지', tier: 'meh', face: 'calm', answer: '하나 가는 데 한참이다. 금방 아니다.' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter' },
      open: '겨울이다. 다들 불 쬐러 온다. 말은 안 하고. 그게 좋다.',
      replies: [
        { say: '나도 말없이 쬘게', tier: 'great', remember: 'quiet-ok', face: 'smile', answer: '흠. 그래. 불 소리만 듣자. 그걸로 됐다.' },
        { say: '불 쬐는 값은?', tier: 'good', face: 'laugh', answer: '공짜다. 장작 하나 넣고 가면 더 좋고.' },
        { say: '겨울은 너무 길어', tier: 'meh', face: 'calm', answer: '산에선 더 길었다. 여긴 짧은 편이다.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '노을 봐라. 담금질 직전 쇠 색이다. 저 색일 때 넣어야 한다.',
      replies: [
        { say: '지금 넣으면 딱이겠다', tier: 'great', face: 'smile', answer: ['그래. 눈이 생겼군.', '…하늘은 못 넣는다. 아쉽군. 흠.'] },
        { say: '노을 예쁘다', tier: 'good', face: 'calm', answer: '예쁘다. 오래 안 간다. 그래서 본다.' },
        { say: '배고파, 갈게', tier: 'meh', face: 'calm', answer: '가. 밥 먹어. 쇠도 사람도 연료가 있어야 한다.' },
      ],
    },
    {
      id: 'op-bday-news',
      when: { news: 'birthday' },
      open: '오늘 누구 생일이라더군. 흠. 선물 대신 칼 갈아 주겠다고 했다.',
      replies: [
        { say: '그게 제일 좋은 선물이야', tier: 'great', face: 'shy', answer: '…흠. 그런가. 그럼 끝을 좀 더 세운다.' },
        { say: '케이크도 같이 가져가', tier: 'good', face: 'think', answer: '케이크는 흐물거린다. 군밤이면 몰라도.' },
        { say: '생일에 칼은 좀…', tier: 'meh', face: 'sorry', answer: '…그런가. 그럼 숫돌을 준다. 같은 거다.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '혼례 소식 들었나. 반지 틀 주문이 들어왔다. 밤새 했다.',
      replies: [
        { say: '네 반지면 평생 가겠다', tier: 'great', face: 'shy', answer: '…간다. 그렇게 만들었다. 흠. 헛기침이다.' },
        { say: '밤새면 안 피곤해?', tier: 'good', face: 'calm', answer: '피곤하다. 반지는 서두르면 안 된다. 그래서 밤새다.' },
        { say: '난 반지 관심 없어', tier: 'meh', face: 'think', answer: '…흠. 지금은. 쇠도 처음엔 관심 없다.' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '전설의 물고기가 나왔다더군. 바늘이 버텼다는 게 더 대단하다.',
      replies: [
        { say: '그 바늘 네가 벼렸지?', tier: 'great', face: 'laugh', answer: '흠. 아마. 내 바늘은 휘어도 안 끊긴다.' },
        { say: '나도 언젠가 잡을래', tier: 'good', face: 'smile', answer: '그럼 바늘부터 가져와. 전설은 연장에서 시작한다.' },
        { say: '물고기엔 관심 없어', tier: 'meh', face: 'calm', answer: '나도다. 바늘만 관심 있다.' },
      ],
    },
    {
      id: 'op-museum',
      when: { recent: 'museum' },
      open: '박물관 다녀왔나. 옛 연장 진열장 있지. 반은 엉터리로 벼렸다.',
      replies: [
        { say: '네가 다시 벼려 줄래?', tier: 'great', face: 'laugh', answer: ['…유리 안에 든 건 못 만진다. 아쉽다.', '흠. 대신 설명 판에 잔소리를 적어 줄까.'] },
        { say: '그래도 오래 버텼잖아', tier: 'good', face: 'think', answer: '…맞다. 오래 버틴 건 존중한다. 엉터리여도.' },
        { say: '그냥 구경만 했어', tier: 'meh', face: 'calm', answer: '구경도 배움이다. 다음엔 날 끝을 봐.' },
      ],
    },
    {
      id: 'op-bday',
      when: { bday: true },
      open: '{me}. 오늘 생일이라며. 흠. …이거. 열쇠고리다. 설명은 안 한다.',
      replies: [
        { say: '직접 벼린 거야?', tier: 'great', face: 'shy', answer: ['…당연하다. 남이 만든 걸 주겠나.', '잃어버리면 또 만든다. 그러니 괜찮다.'] },
        { say: '고마워, 잘 쓸게', tier: 'good', face: 'smile', answer: '흠. 됐다. 생일 축하한다. 짧게.' },
        { say: '케이크는 없어?', tier: 'meh', face: 'sorry', answer: '…없다. 군밤은 있다. 초는 못 꽂는다.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '{me}. 오늘 얼굴이 잘 달군 쇠 같다. 좋은 일 있었나.',
      replies: [
        { say: '너 만나서 좋아', tier: 'great', face: 'shy', answer: '…흠. 흠. 헛기침 두 번이다. 그런 말 갑자기 하지 마.' },
        { say: '그냥 기분이 좋아', tier: 'good', face: 'smile', answer: '그럼 됐다. 그 기분, 망치질에 좀 나눠 줘.' },
        { say: '비밀이야', tier: 'meh', face: 'think', answer: '흠. 비밀은 지켜. 쇠처럼.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '배 타고 나갔다 왔다며. 닻 봤나. 누가 벼렸는지 엉망이더군.',
      replies: [
        { say: '네가 새로 벼려 줘', tier: 'great', face: 'smile', answer: '흠. 쇠가 많이 든다. 광석 가져오면 한다.' },
        { say: '바다 멋있었어', tier: 'good', face: 'calm', answer: '바다는 모른다. 짠바람에 쇠가 녹슨다. 그것만 안다.' },
        { say: '멀미 났어', tier: 'meh', face: 'sorry', answer: '땅이 낫다. 땅은 안 흔들린다. 거의.' },
      ],
    },
    {
      id: 'op-stockup',
      when: { recent: 'stockUp' },
      open: '네 주식 올랐다더군. 흠. 숫자는 잘 모른다. 쇠 값만 안다.',
      replies: [
        { say: '좋은 광석 사 줄게', tier: 'great', face: 'shy', answer: '…흠. 됐다. 아니, 철이면 받는다. 금은 말고.' },
        { say: '운이 좋았어', tier: 'good', face: 'calm', answer: '운도 받은 거다. 그래도 들뜨지 마. 쇠도 식는다.' },
        { say: '더 사야겠어', tier: 'meh', face: 'think', answer: '…흠. 달군 쇠 계속 두드리면 부러진다. 쉬어 가.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '카지노에서 잃었다며. 흠. 거긴 쇠 대신 운을 두드리는 데다.',
      replies: [
        { say: '이제 안 갈게', tier: 'great', face: 'smile', answer: '그래라. 운은 벼릴 수 없다. 손으로 버는 게 낫다.' },
        { say: '조금만 위로해 줘', tier: 'good', face: 'shy', answer: '…위로는 못 한다. 군밤은 있다. 그게 위로다.' },
        { say: '다음엔 딸 거야', tier: 'meh', face: 'calm', answer: '…흠. 다들 그 말 한다. 그러다 망치까지 판다.' },
      ],
    },
    {
      id: 'op-casino-win',
      when: { recent: 'casinoWin' },
      open: '카지노에서 땄다더군. 흠. 그 돈으로 연장이나 바꿔.',
      replies: [
        { say: '네 대장간에서 바꿀게', tier: 'great', face: 'smile', answer: '흠. 그게 맞는 순서다. 제일 좋게 해 준다.' },
        { say: '한턱낼까?', tier: 'good', face: 'shy', answer: '…우유 한 잔이면 된다. 따뜻한 걸로.' },
        { say: '또 가야겠다', tier: 'meh', face: 'calm', answer: '운은 쇠처럼 안 남는다. 그만해.' },
      ],
    },
    {
      id: 'op-with-nilah',
      when: { with: 'nilah' },
      open: '{other} 옆이라 시끄럽다. 팔씨름 또 하자고 조른다. 흠.',
      replies: [
        { say: '내가 심판 볼게', tier: 'great', face: 'laugh', answer: ['…공정하게 봐라. 볼리바스처럼 무승부 말고.', '흠. 그래도 비기면 비긴 거다.'] },
        { say: '둘이 사이좋네', tier: 'good', face: 'shy', answer: '…시끄러운 이웃이다. 나쁘진 않다.' },
        { say: '난 빠질게', tier: 'meh', face: 'calm', answer: '그래. 구경은 공짜다.' },
      ],
    },
    {
      id: 'op-with-volibas',
      when: { with: 'volibas' },
      open: '{other}. 같이 앉아 있었다. 말은 세 마디 했다. 많이 한 거다.',
      replies: [
        { say: '무슨 세 마디였어?', tier: 'great', face: 'laugh', answer: '날씨. 빵. 됐다. …오늘은 빵 얘기도 했다. 흠.' },
        { say: '편해 보여', tier: 'good', face: 'smile', answer: '편하다. 덩치 큰 놈끼리는 말이 짧다.' },
        { say: '심심하지 않아?', tier: 'meh', face: 'calm', answer: '안 심심하다. 조용한 것도 대화다.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '{other} 일로 신경 쓰인다. 별거 아니다. …망치가 좀 세게 떨어진다.',
      replies: [
        { say: '먼저 말 걸어 봐', tier: 'great', face: 'think', answer: ['…먼저. 그거 제일 어렵다.', '흠. 내일 칼 하나 갈아 들고 가지. 그게 내 말이다.'] },
        { say: '오늘은 쉬어', tier: 'good', face: 'calm', answer: '그래. 화난 망치는 쇠를 망친다. 불 줄인다.' },
        { say: '네가 잘못했네', tier: 'meh', face: 'sorry', answer: '…반은. 반만이다. 흠.' },
      ],
    },
    {
      id: 'op-friend-news',
      when: { friendNews: 'wedding' },
      open: '네 친구 혼례라더군. 흠. 축하 선물로 냄비라도 벼려 줄까.',
      replies: [
        { say: '네가 만들면 최고지', tier: 'great', face: 'shy', answer: '…흠. 그럼 손잡이 두 개 단다. 둘이 드니까.' },
        { say: '같이 축하하러 가자', tier: 'good', face: 'think', answer: '사람 많은 데는 싫다. …잠깐이면 간다.' },
        { say: '꽃이 낫지 않아?', tier: 'meh', face: 'calm', answer: '꽃은 시든다. 냄비는 백 년 간다.' },
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
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-heard' },
      open: ['{me}. 생일 곧이라며. 흠. 아무것도 안 묻는다.', '…손가락 굵기만 하나 재자. 아무 이유 없다.'],
      replies: [
        { say: '뭐 만들려는 거지?', tier: 'great', remember: 'bday-heard', face: 'shy', answer: ['…안 알려 준다. 생일에 안다.', '흠. 기대는 하지 마. 아니, 조금은 해.'] },
        { say: '선물 안 줘도 돼', tier: 'good', remember: 'bday-heard', face: 'think', answer: '안 주는 게 더 어렵다. 망치가 벌써 움직였다.' },
      ],
    },
    {
      id: 'cb-gold',
      when: { mem: 'gold-eye' },
      use: 'gold-eye',
      open: '금 좋다던 {me}. 금 광석 들어왔다. 반짝이는 거 실컷 봐라.',
      replies: [
        { say: '와, 진짜 반짝인다', tier: 'great', face: 'laugh', answer: ['흠. 표정 보니 됐다.', '금은 무르다. 그래서 조심히 다룬다. 너처럼.'] },
        { say: '이걸로 뭘 만들어?', tier: 'good', face: 'think', answer: '아직 모른다. 금이 정한다. 반지는 아니다. …아직은.' },
      ],
    },
    {
      id: 'cb-alone',
      when: { mem: 'alone-ok' },
      use: 'alone-ok',
      open: '혼자 하는 게 멋있다고 했지. …요즘 생각이 좀 바뀌었다.',
      replies: [
        { say: '어떻게 바뀌었는데?', tier: 'great', face: 'shy', answer: ['혼자 하면 빠르다. 같이 하면 멀리 간다.', '…어디서 들은 말이다. 흠. 맞는 말이더군.'] },
        { say: '그래도 멋있어', tier: 'good', face: 'laugh', answer: '흠. 헛기침이다. 그 말은 아직 좋다.' },
      ],
    },
    {
      id: 'cb-age',
      when: { mem: 'no-age' },
      use: 'no-age',
      open: '나이 안 묻는다고 했지. 약속 지켰더군. 흠. 그래서 하나 말해 준다.',
      replies: [
        { say: '안 들어도 괜찮아', tier: 'great', face: 'smile', answer: ['…그래서 말해 주는 거다.', '이 산이 생길 때쯤 왔다. 더는 안 센다.'] },
        { say: '궁금하긴 했어', tier: 'good', face: 'laugh', answer: '…산보다 조금 어리다. 끝. 이게 다다.' },
      ],
    },
    {
      id: 'cb-bellows',
      when: { mem: 'bellows' },
      use: 'bellows',
      open: '풀무 밟았던 거. 박자 좋았다. 오늘도 불이 네 박자를 찾는다.',
      replies: [
        { say: '또 밟을게', tier: 'great', face: 'smile', answer: '흠. 하나, 둘. 그래. 그 박자다. 불이 웃는다.' },
        { say: '불도 기억해?', tier: 'good', face: 'think', answer: '불은 다 기억한다. 누가 숨을 넣어 줬는지.' },
      ],
    },
    {
      id: 'cb-chestnut',
      when: { mem: 'chestnut' },
      use: 'chestnut',
      open: '군밤 나눠 먹은 거. 오늘도 구웠다. 네 몫 따로 뺐다.',
      replies: [
        { say: '이번엔 내가 깔게', tier: 'great', face: 'shy', answer: '…데지 마라. 흠. 손 데면 내가 메르시한테 혼난다.' },
        { say: '큰 걸로 줘', tier: 'good', face: 'laugh', answer: '제일 큰 거 뺐다. 원래 그랬다.' },
      ],
    },
    {
      id: 'cb-quiet',
      when: { mem: 'quiet-ok' },
      use: 'quiet-ok',
      open: '말 없어도 통하면 된다고 했지. …오늘은 그냥 앉아 있자.',
      replies: [
        { say: '응. 불 소리 듣자', tier: 'great', face: 'smile', answer: '…흠. 그래. 이게 제일 좋다.' },
        { say: '한마디만 해 줘', tier: 'good', face: 'shy', answer: '…좋다. 한마디다. 끝.' },
      ],
    },
    {
      id: 'cb-seat',
      when: { mem: 'forge-seat' },
      use: 'forge-seat',
      open: '불 옆 의자. 아무도 안 앉혔다. 앉으려는 놈 있으면 짐 올렸다.',
      replies: [
        { say: '지켜 줬구나', tier: 'great', face: 'shy', answer: '…의자가 주인을 안다. 나는 짐만 올렸다. 흠.' },
        { say: '다른 사람도 앉게 해', tier: 'good', face: 'think', answer: '…의자를 하나 더 짜지. 그건 된다.' },
      ],
    },
    {
      id: 'cb-stone',
      when: { mem: 'mine-dawn' },
      use: 'mine-dawn',
      open: '그 불 먹은 돌. 아직 갖고 있나. 식었으면 말해.',
      replies: [
        { say: '아직 따뜻해', tier: 'great', face: 'wow', answer: ['…그럴 리 없다. 아니, 그럴 수도 있다.', '네가 쥐고 다녀서다. 흠. 그런 돌이다.'] },
        { say: '선반에 잘 뒀어', tier: 'good', face: 'smile', answer: '그래. 돌은 기다린다. 쓸 날이 온다.' },
      ],
    },
    {
      id: 'cb-handle',
      when: { mem: 'handle-fit' },
      use: 'handle-fit',
      open: '그 자루. 손에 물집 안 잡혔나. 보여 줘.',
      replies: [
        { say: '하나도 안 잡혔어', tier: 'great', face: 'laugh', answer: '흠. 당연하다. 네 손 보고 깎았다. …다행이다.' },
        { say: '조금 잡혔어', tier: 'good', face: 'sorry', answer: '…이리 줘. 그 자리만 다시 깎는다. 금방이다.' },
      ],
    },
    {
      id: 'cb-rust',
      when: { mem: 'rust-save' },
      use: 'rust-save',
      open: '그 녹슨 낫. 다 됐다. 봐라. 속은 처음부터 쇠였다.',
      replies: [
        { say: '새것보다 좋다!', tier: 'great', face: 'laugh', answer: ['흠. 그렇게 만들었다.', '버려진 거라도 다시 벼리면 된다. 사람도.'] },
        { say: '누구 줄 거야?', tier: 'good', face: 'think', answer: '…네 밭에 풀 많더군. 가져가.' },
      ],
    },
    {
      id: 'cb-falls',
      when: { mem: 'falls-forge' },
      use: 'falls-forge',
      open: '폭포 대장간 물소리 듣고 싶다 했지. 오늘 담금질한다. 와서 들어.',
      replies: [
        { say: '쉬익 소리 좋다', tier: 'great', face: 'smile', answer: ['그 소리다. 쇠가 숨 고르는 소리.', '…혼자 들을 땐 몰랐다. 좋은 소리군.'] },
        { say: '물방울 튀었어', tier: 'good', face: 'sorry', answer: '…뒤로 반 걸음. 그래. 거기가 네 자리다.' },
      ],
    },
    {
      id: 'cb-build',
      when: { mem: 'build-with' },
      use: 'build-with',
      open: '대장간 처마 고친다. 같이 하자고 했지. …못 들어.',
      replies: [
        { say: '박자 맞춰 박을게', tier: 'great', face: 'smile', answer: ['흠. 비뚤다. 아니, 됐다. 그대로 둬.', '네가 박은 자리는 네 자리다. 표시해 둔다.'] },
        { say: '사다리 잡아 줄게', tier: 'good', face: 'shy', answer: '…그건 혼자 못 한다. 흠. 잡아.' },
      ],
    },
    {
      id: 'cb-striker',
      when: { mem: 'striker' },
      use: 'striker',
      open: '메질꾼 하겠다고 했지. 오늘 큰 쇠 들어온다. 네 망치 가져와.',
      replies: [
        { say: '네 박자에 맞출게', tier: 'great', face: 'laugh', answer: ['…땅. 땅. 흠. 맞는다.', '혼자 할 때보다 쇠가 빨리 선다. 알고 있었다.'] },
        { say: '틀리면 어떡해?', tier: 'good', face: 'calm', answer: '틀리면 다시 친다. 쇠는 몇 번이고 기다린다.' },
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
        '"흠. 괭이 쥐는 손이군. 손목에 힘이 너무 들어갔다."',
        '말하면서도 그의 눈은 벌써 네 허리춤 연장 쪽으로 간다.',
        '"그 괭이. 누가 벼렸나. …아니, 됐다. 엉망이다."',
        '모루 옆 의자는 하나뿐이다. 그가 엎어 둔 물통을 발로 밀어 준다.',
        '"여기선 혼자 일한다. 도와준다는 말은 됐다. 다들 그 말부터 하더군."',
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
        '그는 말없이 앞장선다. 갱도 바닥의 돌을 하나씩 발끝으로 뒤집는다.',
        '"이건 아니다. 이것도. …여기 있군."',
        '그가 검붉은 돌 하나를 집어 든다. 손바닥에서 아직 따뜻하다.',
        '"불을 먹었던 돌이다. 산 밑 냄새가 난다."',
        '"땅속 깊은 불이 가끔 이런 걸 밀어 올린다. 쇠가 조금 섞였다."',
        '그가 돌을 네 손에 올려 준다. 무겁고, 이상하게 따뜻하다.',
        '"원래 혼자 고른다. 옆에 누가 있으면 돌 소리가 안 들린다."',
        '"…오늘은 들렸다. 흠. 넌 시끄럽지 않으니까."',
        '"아무한테나 안 보여 준다. 기억해 둬."',
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
        '모루 옆에 그날 그 검붉은 돌이 놓여 있다. 그새 깨끗이 닦였다.',
        '"그 돌로 망치 머리를 만들 거다. 머리엔 자루가 있어야 한다."',
        '그가 칼을 들고 천천히 깎기 시작한다. 한 번도 서두르지 않는다.',
        '"자루는 손을 닮아야 한다. 남이 깎은 자루는 손에서 논다."',
        '잠시 뒤, 그가 나무 반대쪽 끝을 네 쪽으로 내민다.',
        '"잡아. 흔들리면 결이 튄다. …혼자 할 땐 발로 눌렀다."',
        '네가 꽉 붙잡자 칼질이 한결 곧게 나간다. 그가 눈썹을 조금 올린다.',
        '"흠. 둘이 하니 빠르군. 그런 줄은 알았다. 해 본 적이 없을 뿐."',
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
        '불 먹은 돌에서 녹여 낸 쇳덩이가 집게 끝에서 주황빛으로 빛난다.',
        '"풀무. 네가 밟아. 박자는 내가 망치로 맞춘다."',
        '네가 풀무를 밟을 때마다 불이 숨을 쉬고, 망치가 그 숨에 맞춰 떨어진다.',
        '땅, 땅. 망치 소리가 오래 이어진다. 그는 한 번도 쉬지 않는다.',
        '마지막 한 번 앞에서 그가 멈추고, 작은 망치를 네 손에 쥐여 준다.',
        '"마지막은 주인이 친다. 그게 법이다. …방금 내가 정했다."',
        '네가 내리친 소리는 작고 서툴다. 그래도 쇠가 대답한다.',
        '그가 쇳덩이를 천천히 물에 넣는다. 김이 오르고, 오래 식힌다.',
        '마침내 그가 작은 망치 하나를 네 앞에 놓는다. 자루는 그날 깎은 나무다.',
        '"남 망치는 안 벼렸다. 처음이다. 둘이서 벼린 것도 처음이다."',
        '"그러니 함부로 쓰지 마."',
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
        '벽에는 네 망치가 걸려 있다. 그의 망치 바로 옆이다.',
        '"{me}. 혼자가 편했다. 산처럼 오래 그랬다."',
        '"뭐든 혼자 벼렸다. 남 손이 닿으면 틀어질까 봐."',
        '"그런데 네가 풀무 밟던 날. 쇠가 제일 곱게 섰다."',
        '"요즘 망치질하다 자꾸 문 쪽을 본다. 네가 오나 하고."',
        '그가 헛기침을 한다. 두 번. 불빛이 그의 귀를 붉게 물들인다.',
        '"쇠는 혼자 못 선다. 불이 있어야 하고, 물이 있어야 한다."',
        '"…난 오래 불이기만 했다. 물이 생긴 것 같다. 흠. 이상한 말이군."',
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
        '"그 불 먹은 돌. 네 망치 만들고 조금 남았다. 안 버렸다."',
        '"반지 쇠다. 산 밑 제일 뜨거운 불로 녹일 거다. 안 식게."',
        '"남이 만든 건 못 믿는다. 네 손가락에 맞는 건 내가 안다."',
        '그가 말을 멈추고, 벽에서 네 망치를 내려 네 앞에 놓는다.',
        '"…아니. 정정한다. 이번엔 혼자 안 한다."',
        '"내가 잡고, 네가 친다. 세게 말고, 꾸준히."',
        '작은 고리 위로 두 사람의 망치 소리가 번갈아 울린다. 땅, 땅.',
        '"흠. 박자 맞는다. 처음부터 맞았다. 내가 늦게 안 거다."',
        '"다 되면 네 손에 끼운다. 그때까지 불은 안 꺼진다. 기다려."',
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
    '…아직 있나. 흠. 풀무나 좀 밟든지.',
    '말은 끝났다. 망치는 안 끝났다. 구경은 해도 된다.',
    '군밤 하나 남았다. 가져가. 말 시키지 말고.',
    '흠. 아까 한 말, 망치 소리에 묻혔다고 해 둬.',
    '내일 와라. 불은 켜 둔다.',
  ],
};
