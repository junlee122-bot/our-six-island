// 메르시 — 산기슭 메르시 의원의 마을 의사. 다정하고 밝은 해요체에 살짝 장난기
// ("의사 선생님 말 들어요~", "처방이에요", "합격이에요"). 무리하는 사람을 그냥
// 못 보고, 진료 중에도 작은 농담을 섞는다. 넘어진 사람 일으키기, 부르면 날아오는
// 수호천사, 옷장 속 날개 옷, 높은 산 고향과 핫초콜릿, 커피와 단 것, 옛 팀 이야기,
// 연구자 기질(아주 작은 약 이야기). 산삼·꽃차·바닐라 푸딩·영지를 좋아하고 벌레와
// 복어는 질색. 츠나데와는 의술 대 약초로 투닥이며 인정하고, 잔나와 건강 칼럼,
// 볼리바스는 순찰하다 다쳐 오는 단골, 오른은 화상 단골, 하쿠는 허브차 거리.
// 이야기 줄기: 남만 돌보던 의사가 자기 피로도 돌봄받는 법을 배운다.
// 원작 대사는 옮기지 않고 말투와 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const MERCY_TALK: NpcTalkBook = {
  npc: 'mercy',
  memories: {
    'rest-promise': '무리하지 않겠다고 약속했어요',
    'rest-checked': '약속을 잘 지키는지 확인받았어요',
    'coffee-fan': '커피를 좋아한다고 했어요',
    'tea-fan': '꽃차가 더 좋다고 했어요',
    'sweet-tooth': '단 걸 좋아한다고 털어놓았어요',
    'mountain-home': '높은 산 고향 이야기를 들었어요',
    'fall-up': '넘어지면 일으켜 달라고 했어요',
    'wing-story': '옷장 속 날개 옷 이야기를 들었어요',
    'checkup-yes': '정기 검진을 받겠다고 했어요',
    'ginseng-hunt': '산삼을 같이 찾아보자고 했어요',
    'bug-help': '벌레는 제가 쫓아 주기로 했어요',
    'night-owl': '밤늦게까지 깨어 있는 편이라고 했어요',
    'old-team': '옛 팀 동료들 이야기를 들었어요',
    'hill-dusk': '뒷산에서 노을을 함께 봤어요',
    'flowertea-cup': '꽃차를 함께 우려 마셨어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 걸었던 날을 이야기했어요',
    'bday-plan': '생일 건강 검진 이야기를 나눴어요',
    'date-talk': '내 방에서 쉬었던 날을 이야기했어요',
    'cocoa-fan': '고향식 핫초콜릿을 마셔 보고 싶다고 했어요',
    'tea:chamomile': '자기 전엔 캐모마일차가 좋다고 했어요',
    'tea:mint': '박하차를 좋아한다고 했어요',
    'tea:ginger': '생강차를 좋아한다고 했어요',
    'cut-hand': '낫질하다 손을 베인 적이 있다고 했어요',
    'mine-scrape': '광산에서 팔을 긁힌 적이 있다고 했어요',
    'warm-milk': '자기 전에 따뜻한 우유를 마신다고 했어요',
    'bed-book': '자기 전에 책을 읽는다고 했어요',
    'water-promise': '물을 자주 마시겠다고 약속했어요',
    'stretch-promise': '아침마다 몸을 풀겠다고 약속했어요',
    'first-aid': '응급처치를 배워 보겠다고 했어요',
    'bell-signal': '급하면 의원 종을 세 번 치기로 했어요',
    'day-off': '쉬는 날을 같이 보내자고 했어요',
    'doc-nap': '메르시의 낮잠을 지켜 주기로 했어요',
    'research-ear': '메르시의 연구 이야기를 들어 줬어요',
  },
  talks: [
    {
      id: 'overwork',
      open: '{me} 씨, 솔직하게요. 요즘 하루에 몇 시간 자요? 의사 선생님이 묻는 거예요~',
      replies: [
        { say: '이제 푹 잘게요. 약속해요', tier: 'great', remember: 'rest-promise', face: 'smile', answer: ['좋아요, 약속이에요! 진료 기록에 적어 둘게요.', '어기면 수액이에요. 반은 농담이고 반은 진심이에요.'] },
        { say: '그럭저럭 자요', tier: 'good', face: 'think', answer: '그럭저럭이면 조금 모자란 거예요. 오늘은 한 시간만 일찍 누워요.' },
        { say: '잠은 사치예요', tier: 'meh', face: 'sorry', answer: '어머, 그건 제일 위험한 말이에요. 쓰러지면 제가 날아가야 하잖아요.' },
      ],
    },
    {
      id: 'coffee-or-tea',
      open: '진료 사이에 한 잔 하려고요. {me} 씨는 커피파예요, 꽃차파예요?',
      replies: [
        { say: '커피죠! 선생님처럼', tier: 'great', remember: 'coffee-fan', face: 'laugh', answer: ['들켰네요. 저 커피 없인 못 일어나요.', '대신 하루 두 잔까지만이에요. 우리 둘 다요.'] },
        { say: '꽃차가 좋아요', tier: 'good', remember: 'tea-fan', answer: '훌륭한 선택이에요. 마음이 차분해지죠. 하쿠 씨 블렌딩이면 최고예요.' },
        { say: '에너지 음료요', tier: 'meh', face: 'sorry', answer: '음… 그건 제 처방 목록에서 빼 두고 싶어요. 물 한 잔부터 마셔요.' },
      ],
    },
    {
      id: 'sweets',
      open: '비밀 하나 말해도 돼요? 점심엔 디저트부터 먹어요. 의사인데요.',
      replies: [
        { say: '저도 그래요! 단 게 최고', tier: 'great', remember: 'sweet-tooth', face: 'laugh', answer: '동지네요! 단 거는 마음의 약이에요. 의사가 보증하니까 믿어요.' },
        { say: '그래도 밥은 먹어요?', tier: 'good', face: 'shy', answer: '먹어요, 먹어요. 순서만 살짝 바꾼 거예요. 진료 기록엔 쓰지 마요.' },
        { say: '의사가 그래도 돼요?', tier: 'meh', face: 'think', answer: '의사도 사람이에요. 대신 {me} 씨는 밥부터 먹어요. 그건 처방이에요.' },
      ],
    },
    {
      id: 'mountain',
      open: '제 고향은 아주 높은 산골이에요. 아침마다 소 방울 소리에 깼어요.',
      replies: [
        { say: '고향 이야기 더 해 줘요', tier: 'great', remember: 'mountain-home', face: 'smile', answer: ['눈 덮인 봉우리가 노을에 분홍색이 돼요. 공기가 아주 차고 맑아요.', '그래서 저는 뒷산이 좋아요. 숨이 깊어지거든요.'] },
        { say: '추웠겠어요', tier: 'good', answer: '추웠죠. 그래서 핫초콜릿을 진하게 타는 법을 일찍 배웠어요. 고향식으로요.' },
        { say: '산은 힘들어서 싫어요', tier: 'meh', face: 'calm', answer: '그럼 산은 제가 오를게요. {me} 씨는 무릎 아끼고요. 그것도 처방이에요.' },
      ],
    },
    {
      id: 'fall-down',
      open: '마을에서 누가 넘어지면 제가 제일 먼저 가요. {me} 씨도 넘어지면 부를 거죠?',
      replies: [
        { say: '네, 꼭 일으켜 주세요', tier: 'great', remember: 'fall-up', face: 'smile', answer: ['맡겨요! 제 손 잡으면 금방 일어나요.', '자, 이렇게요. 그렇죠, 다 나았어요!'] },
        { say: '혼자 일어날게요', tier: 'good', answer: '씩씩해서 좋아요. 그래도 무릎 까졌으면 의원엔 꼭 들러요.' },
        { say: '안 넘어질 건데요', tier: 'meh', face: 'laugh', answer: '다들 그렇게 말하고 넘어져요. 볼리바스 씨가 대표예요.' },
      ],
    },
    {
      id: 'wings',
      open: '옷장 깊숙이 날개 달린 옷이 하나 있어요. 웃지 마요, 진짜예요.',
      replies: [
        { say: '한번 보고 싶어요', tier: 'great', remember: 'wing-story', face: 'shy', answer: ['언젠가요. 옛날엔 그걸 입고 다친 사람한테 날아갔어요.', '지금은 뛰어가요. 무릎엔 그게 더 좋더라고요.'] },
        { say: '수호천사 옷이네요', tier: 'good', face: 'laugh', answer: '그런 별명도 있었어요. 지금은 산기슭 의원 의사예요. 그게 더 좋아요.' },
        { say: '분장 옷이에요?', tier: 'meh', face: 'think', answer: '…진료 도구예요. 아마도요. 그렇게 해 둬요.' },
      ],
    },
    {
      id: 'checkup',
      open: '{me} 씨, 마지막으로 건강 검진 받은 게 언제예요? 기억 안 나죠?',
      replies: [
        { say: '이번 계절에 받을게요', tier: 'great', remember: 'checkup-yes', answer: ['합격이에요! 예약 칸 하나 비워 둘게요.', '끝나면 사탕도 하나 줄게요. 박하맛이에요.'] },
        { say: '선생님이 지금 봐 주세요', tier: 'good', face: 'smile', answer: '자, 맥박… 음, 아주 건강해요. 웃는 얼굴도 정상이고요.' },
        { say: '병원은 무서워요', tier: 'meh', face: 'sorry', answer: '괜찮아요. 주사는 안 놔요. 아마도요. 농담이에요, 반쯤.' },
      ],
    },
    {
      id: 'ginseng',
      open: '깊은 산에 산삼이 숨어 있대요. 저 그거 정말 좋아해요. 찾으면 보물이죠.',
      replies: [
        { say: '같이 찾으러 가요!', tier: 'great', remember: 'ginseng-hunt', face: 'wow', answer: '정말요? 좋아요! 약초 가방 두 개 챙길게요. 독초는 제가 골라내고요.' },
        { say: '영지도 좋대요', tier: 'good', answer: '어머, 아는구나! 영지도 제 단골 약재예요. 차로 달이면 쌉쌀하고 좋아요.' },
        { say: '그냥 풀 아니에요?', tier: 'meh', face: 'calm', answer: '풀이죠. 아주 비싸고 귀한 풀이요. 츠나데 씨 앞에선 그 말 하지 마요.' },
      ],
    },
    {
      id: 'bugs',
      open: '저 의사지만 벌레는 정말 못 봐요. 진료실에 나방이 들어오면 비명 질러요.',
      replies: [
        { say: '제가 쫓아 드릴게요', tier: 'great', remember: 'bug-help', face: 'laugh', answer: ['정말요? 그럼 {me} 씨는 오늘부터 의원 벌레 담당이에요.', '보수는 바닐라 푸딩이에요. 꽤 좋은 조건이죠?'] },
        { say: '저도 무서워요', tier: 'good', face: 'sorry', answer: '그럼 둘이서 의자 위로 올라가요. 그게 제일 안전한 처방이에요.' },
        { say: '귀엽지 않아요?', tier: 'meh', face: 'wow', answer: '…{me} 씨, 그 말은 진찰이 필요해 보여요. 농담이에요. 반은요.' },
      ],
    },
    {
      id: 'night-owl',
      open: '{me} 씨는 아침형이에요, 밤형이에요? 표정 보면 대충 알지만요.',
      replies: [
        { say: '해 뜨면 바로 일어나요', tier: 'great', face: 'smile', answer: '합격이에요! 그 생활 그대로 쭉 가요. 제가 다 부럽네요.' },
        { say: '밤에 더 쌩쌩해요', tier: 'good', remember: 'night-owl', face: 'think', answer: '그럴 줄 알았어요. 그래도 자정 넘기면 안 돼요. 꿀잠 처방이에요.' },
        { say: '잠은 안 자도 돼요', tier: 'meh', face: 'sorry', answer: '그런 사람이 제일 먼저 쓰러져요. 옛 팀에서 많이 봤어요.' },
      ],
    },
    {
      id: 'old-team',
      open: '옛날에 시끄러운 팀에 있었어요. 다들 다쳐 놓고 웃는 사람들이었죠.',
      replies: [
        { say: '그 사람들 얘기 들려줘요', tier: 'great', remember: 'old-team', face: 'smile', answer: ['방패 든 덩치 큰 아저씨는 다쳐도 노래를 불렀어요. 볼리바스 씨랑 똑같죠.', '…그립네요. 지금은 이 마을이 제 팀이에요.'] },
        { say: '선생님이 고생했겠네요', tier: 'good', face: 'laugh', answer: '고생이요? 매일이었죠. 그래서 커피 없인 못 사는 몸이 됐어요.' },
        { say: '옛날 얘기는 지루해요', tier: 'meh', face: 'calm', answer: '그럼 지금 얘기 해요. {me} 씨 오늘 어디 다쳤어요? 그게 더 중요해요.' },
      ],
    },
    {
      id: 'bright-side',
      open: '아픈 사람만 보다 보면 저도 기운이 빠질 때가 있어요. {me} 씨는 그럴 때 어떻게 해요?',
      replies: [
        { say: '선생님 보러 와요', tier: 'great', face: 'shy', answer: '…어머. 그런 처방은 처음 들어요. 효과는 좋을 것 같네요.' },
        { say: '단 거 먹어요', tier: 'good', face: 'laugh', answer: '역시요! 바닐라 푸딩 하나면 세상이 다시 밝아지죠.' },
        { say: '그냥 참아요', tier: 'meh', face: 'sorry', answer: '참는 건 치료가 아니에요. 다음엔 의원 와서 수다라도 떨어요.' },
      ],
    },
    {
      id: 'staff',
      open: '이 지팡이요? 짚고 다니는 거 아니에요. 끝에 불이 들어오는 진료 도구예요.',
      replies: [
        { say: '밤길 왕진용이군요', tier: 'great', face: 'wow', answer: ['정답이에요! 밤 왕진 때 이걸 켜면 산길이 환해져요.', '옛날엔 다친 사람한테 기운을 이어 주는 데 썼어요. 비유예요.'] },
        { say: '마법 지팡이 같아요', tier: 'good', face: 'laugh', answer: '다들 그래요. 한 번 흔들면 다 낫냐고요. 아니에요, 약 먹어요.' },
        { say: '그냥 막대기 같은데요', tier: 'meh', face: 'calm', answer: '…막대기치고는 꽤 비싸요. 오른 씨가 손잡이를 고쳐 줬어요.' },
      ],
    },
    {
      id: 'cocoa',
      open: '고향식 핫초콜릿은 진하고 걸쭉해요. 숟가락이 서요. 거의요.',
      replies: [
        { say: '그거 마셔 보고 싶어요', tier: 'great', remember: 'cocoa-fan', face: 'laugh', answer: ['좋아요! 추운 날 의원에 오면 타 줄게요.', '대신 한 잔만이에요. 두 잔은 저만 마셔요. 의사 특권이에요.'] },
        { say: '숟가락이 서요?', tier: 'good', face: 'shy', answer: '…조금 과장했어요. 기울어져요. 그래도 거의 선 거예요.' },
        { say: '너무 달 것 같아요', tier: 'meh', face: 'think', answer: '그럼 우유를 조금 더 넣어 줄게요. 단맛도 처방은 맞춤이에요.' },
      ],
    },
    {
      id: 'herb-tea',
      open: '하쿠 씨가 허브를 세 가지 새로 대 줬어요. {me} 씨는 어느 차가 좋아요?',
      replies: [
        { say: '캐모마일이요, 잠 잘 오게', tier: 'great', remember: 'tea:chamomile', face: 'smile', answer: ['훌륭해요! 자기 전 한 잔이면 꿀잠이에요.', '진료 기록에 적어 둘게요. 잠 잘 자는 사람, 합격이요.'] },
        { say: '박하차요, 시원하게', tier: 'good', remember: 'tea:mint', face: 'laugh', answer: '머리가 맑아지죠. 점심 먹고 한 잔이면 졸음이 달아나요.' },
        { say: '생강차요, 따끈하게', tier: 'good', remember: 'tea:ginger', face: 'wow', answer: '감기 예방에 최고예요! 꿀 한 숟가락 넣는 걸 잊지 마요.' },
      ],
    },
    {
      id: 'haku-herbs',
      open: '의원 허브는 다 하쿠 씨 손을 거쳐 와요. 그분 말린 잎엔 정성이 보여요.',
      replies: [
        { say: '두 분 다 정성이 대단해요', tier: 'great', face: 'shy', answer: ['어머, 저까지요? 저는 받아서 우리기만 하는걸요.', '…그래도 그 말은 진료실 벽에 붙여 둘게요.'] },
        { say: '저도 허브 따다 줄게요', tier: 'good', face: 'smile', answer: '고마워요! 다만 모르는 풀은 꼭 저한테 먼저 보여 줘요.' },
        { say: '풀은 다 비슷하던데요', tier: 'meh', face: 'sorry', answer: '아니에요, 비슷한 게 제일 무서워요. 독초도 예쁘게 생겼거든요.' },
      ],
    },
    {
      id: 'tsunade-rival',
      open: '츠나데 씨는 약초파, 저는 수액파래요. {me} 씨는 어느 쪽 편이에요?',
      replies: [
        { say: '둘 다 쓰면 되죠', tier: 'great', face: 'laugh', answer: ['정답이에요! 사실 그 사람도 같은 생각이에요.', '앞에선 절대 인정 안 하지만요. 그게 그 사람 매력이에요.'] },
        { say: '선생님 편이요', tier: 'good', face: 'shy', answer: '어머, 고마워요. 근데 츠나데 씨한텐 비밀로 해요. 알면 술 사 달라고 할 거예요.' },
        { say: '저는 그냥 참아요', tier: 'meh', face: 'sorry', answer: '그건 어느 쪽도 아니에요. 그러다 둘한테 동시에 혼나요.' },
      ],
    },
    {
      id: 'janna-column',
      open: '잔나 씨랑 신문에 건강 칼럼을 써요. 이번 주 제목이 안 정해졌어요.',
      replies: [
        { say: '물 마시기 어때요?', tier: 'great', face: 'wow', answer: ['딱이에요! 다들 물을 너무 안 마셔요. {me} 씨도요.', '제목은… 목마르기 전에 한 잔. 어때요, 괜찮죠?'] },
        { say: '선생님 커피 비결이요', tier: 'good', face: 'laugh', answer: '그건 쓰면 안 돼요. 하루 두 잔 넘는 거 들키잖아요.' },
        { say: '칼럼은 길어서 안 읽어요', tier: 'meh', face: 'sorry', answer: '…그럼 짧게 쓸게요. 한 줄로요. 푹 자요. 끝이에요.' },
      ],
    },
    {
      id: 'volibas-patrol',
      open: '볼리바스 씨는 순찰하다 또 넘어졌대요. 그런데 다친 적이 없대요. 매번요.',
      replies: [
        { say: '훈장이라고 하던데요', tier: 'great', face: 'laugh', answer: ['그 훈장, 제가 붕대로 감아 줬어요. 오늘만 두 번째예요.', '그래도 씩씩하게 웃으니까 미워할 수가 없어요.'] },
        { say: '선생님이 고생이네요', tier: 'good', face: 'calm', answer: '괜찮아요. 붕대 감는 손이 빨라졌거든요. 마을 기록일 거예요.' },
        { say: '튼튼하니 괜찮겠죠', tier: 'meh', face: 'think', answer: '튼튼한 사람이 제일 늦게 와요. 그래서 제일 많이 다쳐 있어요.' },
      ],
    },
    {
      id: 'ornn-burns',
      open: '오른 씨한테 화상 연고를 몇 통째 드렸는지 몰라요. 한 통도 안 썼을 거예요.',
      replies: [
        { say: '제가 발라 주라고 할게요', tier: 'great', face: 'smile', answer: ['정말요? 그럼 {me} 씨는 오늘부터 연고 감시관이에요.', '오른 씨는 말은 없어도 부탁은 잘 들어줘요. 아마도요.'] },
        { say: '대장장이는 원래 데죠', tier: 'good', face: 'think', answer: '알아요. 그래도 덜 데이게 할 순 있어요. 장갑이요, 장갑.' },
        { say: '침 바르면 낫는대요', tier: 'meh', face: 'sorry', answer: '그거 오른 씨가 한 말이죠? 절대 따라 하지 마요. 진심이에요.' },
      ],
    },
    {
      id: 'gwen-salon',
      open: '마을 소문은 그웬 씨 미용실이랑 제 의원에 제일 먼저 와요. 신기하죠?',
      replies: [
        { say: '둘 다 앉아서 얘기하니까요', tier: 'great', face: 'laugh', answer: ['맞아요! 의자에 앉으면 다들 속을 털어놔요.', '저는 비밀 지키는 게 직업이지만요. 그웬 씨는… 노력 중이에요.'] },
        { say: '오늘 소문 있어요?', tier: 'good', face: 'shy', answer: '있어도 말 못 해요. 진료 비밀이에요. …힌트만 줄까요? 아니에요.' },
        { say: '소문은 관심 없어요', tier: 'meh', face: 'calm', answer: '그게 제일 건강한 태도예요. 그웬 씨한테도 가르쳐 줘요.' },
      ],
    },
    {
      id: 'shinichi-scene',
      open: '이상하게 사고 난 데 가면 늘 신이치 씨가 먼저 와 있어요. 탐정이라 그런가요?',
      replies: [
        { say: '둘이 좋은 팀이네요', tier: 'great', face: 'smile', answer: ['그쪽은 원인을 찾고 저는 다친 데를 봐요. 잘 맞아요.', '어제는 지붕에서 떨어진 고양이 사건이었어요. 둘 다 무사해요.'] },
        { say: '신이치 씨도 다치나요?', tier: 'good', face: 'think', answer: '뛰어다니다 자주 까져요. 추리하느라 아픈 줄도 몰라요.' },
        { say: '좀 수상하네요', tier: 'meh', face: 'laugh', answer: '그 말 하면 신이치 씨가 좋아할 거예요. 수상한 걸 좋아하거든요.' },
      ],
    },
    {
      id: 'muzan-sun',
      open: '무잔 씨는 늘 차양 밑에만 있어요. 햇볕 좀 쬐라고 하면 웃기만 해요.',
      replies: [
        { say: '저녁 산책은 어때요?', tier: 'great', face: 'wow', answer: ['어머, 좋은 생각이에요! 해 질 무렵이면 나올지도 몰라요.', '처방전 이름은 노을 산책. 받아 줄지는 모르지만요.'] },
        { say: '그분 취향이겠죠', tier: 'good', face: 'calm', answer: '그렇죠. 취향은 존중해요. 대신 비타민은 꼭 챙겨 드릴 거예요.' },
        { say: '그분 좀 무서워요', tier: 'meh', face: 'think', answer: '얼굴이 창백해서 그래요. 진료해 보면 그냥 까다로운 단골이에요.' },
      ],
    },
    {
      id: 'nano-research',
      open: '밤에 진료실에서 아주 작은 약 연구를 해요. 상처에 붙어서 혼자 고치는 약이요.',
      replies: [
        { say: '더 자세히 들려줘요', tier: 'great', remember: 'research-ear', face: 'wow', answer: ['정말요? 눈이 반짝이네요. 저도요!', '아주 작은 일꾼들이 상처를 꿰매는 거예요. 아직은 꿈이지만요.', '…아, 너무 신나서 떠들었네요. 들어 줘서 고마워요.'] },
        { say: '밤에 또 일해요?', tier: 'good', face: 'sorry', answer: '…들켰네요. 연구는 일 아니라고 우기고 싶은데, 안 통하죠?' },
        { say: '어려워서 모르겠어요', tier: 'meh', face: 'laugh', answer: '괜찮아요. 저도 반은 모르고 해요. 그게 연구예요.' },
      ],
    },
    {
      id: 'old-scar',
      open: '{me} 씨, 손등에 그 자국은 어쩌다 생겼어요? 제가 치료한 기억은 없는데요.',
      replies: [
        { say: '낫질하다 베였어요', tier: 'great', remember: 'cut-hand', face: 'sorry', answer: ['어머, 그때 왜 안 왔어요? 다음엔 바로 와요.', '낫은 몸 바깥쪽으로 당기기. 오늘 배운 거예요. 외워요.'] },
        { say: '광산에서 팔도 긁혔어요', tier: 'good', remember: 'mine-scrape', face: 'think', answer: '광산 먼지가 들어가면 덧나요. 이리 와요, 소독부터 해요.' },
        { say: '기억 안 나요', tier: 'meh', face: 'calm', answer: '다친 걸 잊는 사람이 제일 걱정이에요. 그래서 제가 기억할게요.' },
      ],
    },
    {
      id: 'sleep-ritual',
      open: '자기 전에 뭐 해요? 잠드는 습관이 좋으면 반은 건강한 거예요.',
      replies: [
        { say: '따뜻한 우유 마셔요', tier: 'great', remember: 'warm-milk', face: 'smile', answer: ['합격이에요! 목장 우유면 더 좋아요.', '꿀 한 방울이면 꿈도 달아요. 그건 제 학설이에요.'] },
        { say: '책을 조금 읽어요', tier: 'good', remember: 'bed-book', face: 'calm', answer: '좋아요. 다만 너무 재밌는 책은 금지예요. 밤새거든요.' },
        { say: '늦게까지 놀아요', tier: 'meh', face: 'sorry', answer: '그건 습관 말고 버릇이에요. 오늘부터 하나씩 고쳐 봐요.' },
      ],
    },
    {
      id: 'water',
      open: '{me} 씨, 오늘 물 몇 잔 마셨어요? 손가락으로 세 봐요. 솔직하게요.',
      replies: [
        { say: '이제부터 자주 마실게요', tier: 'great', remember: 'water-promise', face: 'laugh', answer: ['약속이에요! 목마르기 전에 한 모금이요.', '다음에 만나면 물병부터 검사할 거예요. 각오해요.'] },
        { say: '두 잔쯤이요', tier: 'good', face: 'think', answer: '반도 안 되네요. 지금 한 잔 마시고 가요. 의원 물은 공짜예요.' },
        { say: '커피도 물 아니에요?', tier: 'meh', face: 'sorry', answer: '…그 말은 저도 하고 싶었어요. 안타깝게도 아니에요.' },
      ],
    },
    {
      id: 'stretch',
      open: '아침에 일어나서 몸 풀어요? 밭일하는 사람은 허리부터 깨워야 해요.',
      replies: [
        { say: '내일부터 꼭 할게요', tier: 'great', remember: 'stretch-promise', face: 'smile', answer: ['좋아요! 팔 위로 쭉, 허리 천천히 옆으로요.', '열 번만 해도 하루가 달라져요. 의사가 보장해요.'] },
        { say: '선생님은 해요?', tier: 'good', face: 'shy', answer: '…가끔요. 왕진 가방 들 때 허리가 알려 줘요. 같이 해요.' },
        { say: '귀찮아요', tier: 'meh', face: 'calm', answer: '귀찮은 게 나중에 아픈 것보단 나아요. 진짜예요.' },
      ],
    },
    {
      id: 'first-aid',
      open: '마을 사람들한테 응급처치를 가르쳐 볼까 해요. {me} 씨 첫 학생 할래요?',
      replies: [
        { say: '네, 배우고 싶어요', tier: 'great', remember: 'first-aid', face: 'wow', answer: ['좋아요! 첫 시간은 붕대 감기예요.', '잘하면 제 조수 자리도 줄게요. 보수는 초콜릿이에요.'] },
        { say: '피는 좀 무서워요', tier: 'good', face: 'sorry', answer: '괜찮아요. 무서운 걸 아는 사람이 더 조심해서 잘해요.' },
        { say: '선생님 부르면 되죠', tier: 'meh', face: 'think', answer: '부르면 가요. 그래도 제가 도착하기 전까지가 제일 중요해요.' },
      ],
    },
    {
      id: 'clinic-bell',
      open: '의원 문 앞에 종이 있죠? 급할 땐 그걸 세 번 쳐요. 그럼 날아가요.',
      replies: [
        { say: '세 번, 꼭 기억할게요', tier: 'great', remember: 'bell-signal', face: 'smile', answer: ['좋아요. 세 번이면 자다가도 일어나요.', '한 번은 택배, 두 번은 볼리바스 씨예요. 세 번은 급한 거고요.'] },
        { say: '장난으로 치면요?', tier: 'meh', face: 'think', answer: '그럼 그날 저녁 진료는 {me} 씨 무릎 검사예요. 길게요.' },
        { say: '선생님 잠은 언제 자요?', tier: 'good', face: 'shy', answer: '…좋은 질문이에요. 종이 안 울리는 밤에요. 요즘은 꽤 많아요.' },
      ],
    },
    {
      id: 'puffer',
      open: '복어 요리를 왜 먹는지 모르겠어요. 의사로서 그 생선은 정말 무서워요.',
      replies: [
        { say: '안 먹을게요, 약속해요', tier: 'great', face: 'laugh', answer: ['고마워요! 이제 한시름 놓았어요.', '낚아도 바로 놓아줘요. 화나면 빵빵해지는 것도 무섭거든요.'] },
        { say: '전문가가 손질하면요?', tier: 'good', face: 'think', answer: '그래도 저는 안 먹어요. {me} 씨가 먹으면 옆에 있을게요. 만약을 위해서요.' },
        { say: '맛있다던데요', tier: 'meh', face: 'sorry', answer: '맛있는 것 중에 위험한 게 제일 많아요. 의원에서 보면 그래요.' },
      ],
    },
    {
      id: 'guardian',
      when: { ch: 3 },
      open: '{me} 씨, 수호천사가 한 사람씩 있다면… 저는 누구 거 하면 좋을까요?',
      replies: [
        { say: '제 거 해 주세요', tier: 'great', face: 'shy', answer: '…그렇게 바로 대답하면 반칙이에요. 진단은 보류할게요. 좋다는 뜻이에요.' },
        { say: '마을 모두의 거요', tier: 'good', face: 'smile', answer: '그렇죠, 그게 맞아요. 그래도 {me} 씨 부르면 제일 먼저 날아갈래요.' },
        { say: '선생님 자신이요', tier: 'meh', face: 'think', answer: '저요? …그건 생각 못 했네요. 의사도 자기 돌보는 건 서툴러요.' },
      ],
    },
    {
      id: 'doctor-tired',
      when: { ch: 4 },
      open: '{me} 씨, 저 요즘 진료실에서 낮잠을 자요. 십오 분이요. 칭찬해 줘요.',
      replies: [
        { say: '잘했어요. 제가 지켜 줄게요', tier: 'great', remember: 'doc-nap', face: 'shy', answer: ['…그럼 그 십오 분 동안 문 앞 좀 지켜 줘요.', '종이 울리면 깨워도 돼요. 아니면 그냥 두고요.'] },
        { say: '삼십 분 자도 돼요', tier: 'good', face: 'laugh', answer: '어머, 의사보다 처방이 후하네요. 생각해 볼게요.' },
        { say: '일하다 자면 안 되죠', tier: 'meh', face: 'sorry', answer: '…그 말, 예전의 저랑 똑같네요. 그래서 고치는 중이에요.' },
      ],
    },
    {
      id: 'day-off',
      when: { love: 'dating' },
      open: '{me} 씨, 다음 쉬는 날 비워 둘래요? 의원 문에 휴진 팻말 걸게요.',
      replies: [
        { say: '하루 종일 같이 쉬어요', tier: 'great', remember: 'day-off', face: 'shy', answer: ['좋아요. 왕진 가방도 커피도 없이요. 아, 커피는 한 잔만요.', '쉬는 법은 {me} 씨가 가르쳐 줘요. 저는 아직 초보예요.'] },
        { say: '뒷산 소풍 어때요?', tier: 'good', remember: 'day-off', face: 'smile', answer: '좋아요! 도시락은 제가 쌀게요. 디저트가 반이겠지만요.' },
        { say: '환자가 오면 어떡해요?', tier: 'meh', face: 'think', answer: '츠나데 씨한테 부탁해 뒀어요. 빚은 지겠지만, 괜찮아요.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: 'rain' },
      open: '비 오는 날엔 무릎 아픈 분들이 많아요. {me} 씨, 젖었으면 수건부터요!',
      replies: [
        { say: '선생님도 감기 조심해요', tier: 'great', face: 'shy', answer: '어머, 의사 걱정을 해 주네요. 고마워요. 핫초콜릿 두 잔 탈게요.' },
        { say: '우산 깜빡했어요', tier: 'good', answer: '그럴 줄 알았어요. 의원 우산 하나 빌려 가요. 돌려주는 건 천천히요.' },
        { say: '비 맞는 거 좋아요', tier: 'meh', face: 'sorry', answer: '낭만은 좋은데 감기는 안 낭만적이에요. 따뜻한 물부터 마셔요.' },
      ],
    },
    {
      id: 'op-storm',
      when: { weather: 'storm' },
      open: '폭풍이에요. 오늘은 의원 문을 열어 둘게요. 다치면 바로 와요, 꼭이요.',
      replies: [
        { say: '선생님도 밖에 나가지 마요', tier: 'great', face: 'shy', answer: ['…부르면 가야 하는데요. 그래도 그 말, 고마워요.', '오늘은 정말 급한 종소리에만 나갈게요. 약속해요.'] },
        { say: '창문은 잘 닫았어요', tier: 'good', face: 'smile', answer: '합격이에요! 오늘 같은 날엔 그게 제일 큰 예방이에요.' },
        { say: '바다 구경 가려고요', tier: 'meh', face: 'sorry', answer: '안 돼요. 의사 명령이에요. 이건 농담 아니에요.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈이에요! 고향 생각나네요. {me} 씨, 미끄러우니까 보폭은 작게요.',
      replies: [
        { say: '고향에도 이렇게 와요?', tier: 'great', remember: 'mountain-home', face: 'smile', answer: '훨씬 깊게요. 창문까지 쌓여요. 그래도 여기 눈이 더 포근해요.' },
        { say: '선생님 팔 잡을게요', tier: 'good', face: 'laugh', answer: '좋아요. 둘이 넘어지면 제가 먼저 일어나서 일으킬게요.' },
        { say: '눈싸움하러 가요', tier: 'meh', face: 'think', answer: '장갑 끼고요! 손 트면 연고 바르러 오기예요.' },
      ],
    },
    {
      id: 'op-sunny',
      when: { weather: 'sunny' },
      open: '해가 좋아요! 이런 날은 벤치에서 커피 한 잔이 최고예요. 오 분만요.',
      replies: [
        { say: '저도 같이 앉을게요', tier: 'great', face: 'laugh', answer: ['좋아요! 햇볕은 공짜 약이에요. 둘이 먹으면 두 배고요.', '…오 분이 십 분 되면 못 본 척해 줘요.'] },
        { say: '모자는 썼어요?', tier: 'good', face: 'shy', answer: '어머, 제 대사를 뺏어 갔네요. 썼어요. 이제 {me} 씨 차례예요.' },
        { say: '더워서 싫어요', tier: 'meh', face: 'calm', answer: '그럼 그늘로 가요. 물 한 병 챙겨 줄게요.' },
      ],
    },
    {
      id: 'op-cloudy',
      when: { weather: 'cloudy' },
      open: '흐린 날엔 기분도 처지죠. 초콜릿 한 조각 처방할게요. 저도 하나요.',
      replies: [
        { say: '반씩 나눠 먹어요', tier: 'great', face: 'shy', answer: '…그럼 반만요. 흐린 날 초콜릿은 나눠야 약효가 나요.' },
        { say: '잔나 씨는 갠대요', tier: 'good', face: 'laugh', answer: '그럼 믿어 볼까요. 틀리면 초콜릿 하나 더 먹는 걸로요.' },
        { say: '저는 흐린 게 좋아요', tier: 'meh', face: 'calm', answer: '그럼 다행이에요. 초콜릿은 제가 먹을게요.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: 'night' },
      open: '이 시간까지 안 자면 어떡해요. 지팡이 불 끄려던 참이었어요.',
      replies: [
        { say: '선생님 얼굴 보고 자려고요', tier: 'great', face: 'shy', answer: '…그런 말 하면 제 맥박이 바빠져요. 얼른 들어가 자요.' },
        { say: '잠이 안 와서요', tier: 'good', remember: 'night-owl', answer: '그럼 꽃차 한 잔 줄게요. 따뜻하게 마시고 바로 누워요. 처방이에요.' },
        { say: '밤샐 거예요', tier: 'meh', face: 'sorry', answer: '안 돼요. 의사 선생님 말 들어요~ 내일 쓰러지면 제가 슬퍼요.' },
      ],
    },
    {
      id: 'op-dawn',
      when: { time: 'dawn' },
      open: '벌써 일어났어요? 잠은 충분히 잤어요? 핫초콜릿 한 잔은 드릴게요.',
      replies: [
        { say: '푹 잤어요!', tier: 'great', answer: '얼굴 보니 합격이에요! 오늘 하루도 그 얼굴로 다녀요.' },
        { say: '조금 덜 잤어요', tier: 'good', face: 'think', answer: '그럼 점심 뒤에 낮잠 십오 분이요. 정확히 십오 분이요.' },
      ],
    },
    {
      id: 'op-evening',
      when: { time: 'evening' },
      open: '하루 고생했어요. 어깨 좀 펴 봐요. 그렇죠. 오늘 어디 쑤신 데 없어요?',
      replies: [
        { say: '선생님 어깨가 더 굳었어요', tier: 'great', face: 'wow', answer: ['어머, 그게 보여요? …오늘 붕대를 좀 많이 감았어요.', '그럼 {me} 씨가 한 번만 주물러 줘요. 아주 살짝요.'] },
        { say: '허리가 좀 뻐근해요', tier: 'good', face: 'think', answer: '따뜻한 물수건 올리고 일찍 자요. 내일 아침이면 나아요.' },
        { say: '아무 데도 안 아파요', tier: 'meh', face: 'calm', answer: '그 말 믿을게요. 오늘만요.' },
      ],
    },
    {
      id: 'op-spring',
      when: { season: 'spring' },
      open: '봄이라 꽃가루 환자가 늘었어요. {me} 씨 코는 괜찮아요? 훌쩍이는데요.',
      replies: [
        { say: '선생님이 봐 주세요', tier: 'great', face: 'smile', answer: ['자, 아 해 봐요. …음, 그냥 봄 감기 기운이에요.', '박하차 한 잔이면 금방 뚫려요. 처방이에요.'] },
        { say: '꽃은 그래도 좋아요', tier: 'good', face: 'laugh', answer: '저도요. 고향 산도 봄엔 꽃밭이에요. 대신 마스크는 써요.' },
        { say: '그냥 참을래요', tier: 'meh', face: 'sorry', answer: '참는 건 치료가 아니라니까요. 이리 와요.' },
      ],
    },
    {
      id: 'op-summer',
      when: { season: 'summer' },
      open: '덥죠? 여름엔 물을 평소보다 두 배요. 더위 먹으면 수액 맞으러 와야 해요.',
      replies: [
        { say: '물병 챙겨 다녀요', tier: 'great', face: 'laugh', answer: '합격이에요! 오늘의 모범 환자예요. 시원한 박하차 줄게요.' },
        { say: '수박으로 대신해요', tier: 'good', face: 'think', answer: '수박도 물이긴 해요. 대신 한 통 다 먹으면 배탈이에요.' },
        { say: '수액 맞아 보고 싶어요', tier: 'meh', face: 'sorry', answer: '…그건 재미로 맞는 게 아니에요. 물이나 마셔요.' },
      ],
    },
    {
      id: 'op-autumn',
      when: { season: 'autumn' },
      open: '환절기예요. 낮엔 덥고 밤엔 추우니까 겉옷 하나는 꼭 챙겨요.',
      replies: [
        { say: '선생님 목도리 빌려줄래요?', tier: 'great', face: 'shy', answer: ['…이거요? 제가 매던 건데요. 그래도 좋다면요.', '감기 걸리면 돌려주지 마요. 그건 의사 명령이에요.'] },
        { say: '사과 먹으면 되죠?', tier: 'good', face: 'laugh', answer: '사과 하나면 의사가 필요 없대요. 저 실직이에요? 그래도 먹어요.' },
        { say: '저는 감기 안 걸려요', tier: 'meh', face: 'calm', answer: '그 말이 감기한테 들리면 꼭 와요. 조심해요.' },
      ],
    },
    {
      id: 'op-winter',
      when: { season: 'winter' },
      open: '겨울엔 감기 환자가 줄을 서요. 손 씻었어요? 목도리는요?',
      replies: [
        { say: '둘 다 했어요!', tier: 'great', face: 'laugh', answer: '완벽한 환자네요. 상으로 고향식 핫초콜릿 한 잔이요.' },
        { say: '목도리를 깜빡했어요', tier: 'good', face: 'sorry', answer: '의원에 남는 거 있어요. 오늘 하루 빌려줄게요.' },
        { say: '손은 나중에 씻을게요', tier: 'meh', face: 'think', answer: '나중은 없어요. 지금 저기 세면대요. 의사 명령이에요.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제예요! 저는 구급 천막 지켜요. 들뜨는 건 좋지만 과식은 금지예요~',
      replies: [
        { say: '천막에 간식 갖다줄게요', tier: 'great', face: 'laugh', answer: '어머, 천사네요! 그럼 저도 초콜릿 반 나눠 줄게요. 다친 사람 먼저지만요.' },
        { say: '선생님도 좀 놀아요', tier: 'good', face: 'shy', answer: '저녁에 교대하면요. 그때 같이 한 바퀴 돌아요.' },
        { say: '오늘은 다 먹을 거예요', tier: 'meh', face: 'sorry', answer: '…소화제 미리 챙겨 둘게요. 배 아프면 바로 와요.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '바다 냄새가 나네요. 오늘 {fish}, 낚았죠? 손에 바늘은 안 찔렸어요?',
      replies: [
        { say: '하나도 안 다쳤어요', tier: 'great', answer: '합격이에요! 낚시는 마음에도 좋아요. 기다리는 동안 맥박이 내려가거든요.' },
        { say: '손가락 살짝 찔렸어요', tier: 'good', face: 'sorry', answer: '자, 이리 줘 봐요. 소독하고 반창고. 다 나았어요!' },
        { say: '혹시 복어였으면요?', tier: 'meh', face: 'wow', answer: '복어는 절대 먹지 마요! 그건 의사로서 진지하게 하는 말이에요.' },
      ],
    },
    {
      id: 'op-puffer',
      when: { fish: ['puffer'] },
      open: '{me} 씨… 그 가방에서 빵빵한 게 보여요. 설마 복어예요?',
      replies: [
        { say: '바로 팔 거예요', tier: 'great', face: 'laugh', answer: ['휴, 다행이에요! 제 맥박이 방금 두 배였어요.', '팔고 나면 손 꼭 씻어요. 의사 부탁이에요.'] },
        { say: '선생님 선물이에요', tier: 'meh', face: 'sorry', answer: '…{me} 씨, 그건 선물이 아니라 진료 거리예요. 넣어 둬요.' },
        { say: '귀엽지 않아요?', tier: 'good', face: 'think', answer: '귀여운 건 인정해요. 먹지만 않으면요. 약속해요.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '마을이 시끌시끌해요! 엄청 큰 놈 낚았다면서요? 허리는 괜찮아요?',
      replies: [
        { say: '허리 멀쩡해요! 기분 최고!', tier: 'great', face: 'laugh', answer: '축하해요! 기분 좋은 날엔 면역력도 올라가요. 진짜예요.' },
        { say: '팔이 좀 떨려요', tier: 'good', face: 'think', answer: '근육이 놀란 거예요. 따뜻한 물에 담그고 오늘은 쉬어요.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '손에 흙이 묻었네요. 밭일했죠? 허리 숙일 땐 무릎부터 굽혔어요?',
      replies: [
        { say: '선생님 말대로 했어요', tier: 'great', answer: '훌륭해요! 그 자세면 허리가 고마워할 거예요. 오늘의 모범 환자예요.' },
        { say: '허리가 뻐근해요', tier: 'good', face: 'sorry', answer: '거봐요. 여기 누워 봐요. 찜질 하나 올려 줄게요.' },
        { say: '그런 거 신경 안 써요', tier: 'meh', face: 'think', answer: '지금은 괜찮죠. 나중에 의원 단골 되는 길이에요. 조심해요.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '금별 작물 거뒀다면서요? 정성 들인 밭은 건강한 사람이 만들어요.',
      replies: [
        { say: '선생님 덕에 건강해서요', tier: 'great', face: 'shy', answer: '어머, 그런 말은 처방전에 붙여 두고 싶네요. 축하해요!' },
        { say: '운이 좋았어요', tier: 'good', answer: '운도 잘 자고 잘 먹는 사람한테 와요. 의학적으로요. 아마도요.' },
      ],
    },
    {
      id: 'op-low-mood',
      when: { mood: 'low' },
      open: '{me} 씨, 얼굴이 많이 지쳐 보여요. 일단 앉아요. 제 손 잡고요.',
      replies: [
        { say: '좀 쉬고 싶어요', tier: 'great', face: 'smile', answer: ['그거면 돼요. 오늘 처방은 휴식이에요.', '꽃차 우려 줄게요. 아무것도 하지 말고 그냥 있어요.'] },
        { say: '괜찮아요, 별일 아니에요', tier: 'good', face: 'think', answer: '별일 아니어도 지친 건 지친 거예요. 오늘은 일찍 들어가요. 약속이에요.' },
        { say: '할 일이 너무 많아요', tier: 'meh', face: 'sorry', answer: '그래서 더 쉬어야 해요. 쓰러지면 할 일이 두 배가 돼요. 진짜예요.' },
      ],
    },
    {
      id: 'op-high-mood',
      when: { mood: 'high' },
      open: '{me} 씨, 오늘 안색 최고예요! 진료할 필요도 없겠어요.',
      replies: [
        { say: '선생님 처방 덕이에요', tier: 'great', face: 'laugh', answer: '그럼 저 오늘 명의 인정이에요? 커피 한 잔으로 자축해야겠네요.' },
        { say: '잘 자고 잘 먹었어요', tier: 'good', answer: '그게 제일 좋은 약이에요. 그 생활 그대로 쭉 가요.' },
      ],
    },
    {
      id: 'op-birthday',
      when: { news: 'birthday' },
      open: '오늘 누구 생일이래요! 케이크는 좋지만 한 조각만이요. 의사 잔소리예요~',
      replies: [
        { say: '선생님 몫도 챙길게요', tier: 'great', face: 'laugh', answer: '들켰네요. 단 건 마음의 약이니까요. 한 조각만, 정말이에요.' },
        { say: '다 같이 축하해요', tier: 'good', face: 'smile', answer: '좋아요. 건강하게 한 살 더 먹는 게 제일 큰 선물이죠.' },
      ],
    },
    {
      id: 'op-my-bday',
      when: { bday: true },
      open: '{me} 씨, 생일 축하해요! 오늘 처방은 케이크 한 조각이에요. 두 조각도 허락할게요.',
      replies: [
        { say: '선생님이랑 먹고 싶어요', tier: 'great', face: 'shy', answer: ['…그럼 진료 끝나고요. 초는 제가 챙길게요.', '소원은 건강하게 해 달라고 빌어요. 의사 추천이에요.'] },
        { say: '두 조각이라니 최고예요', tier: 'good', face: 'laugh', answer: '오늘만이에요! 내일부턴 다시 한 조각이에요.' },
        { say: '나이 먹는 건 싫어요', tier: 'meh', face: 'calm', answer: '건강하게 먹는 나이는 훈장이에요. 볼리바스 씨 말투 같네요.' },
      ],
    },
    {
      id: 'op-friend-bday',
      when: { friendNews: 'birthday' },
      open: '{me} 씨 친구가 오늘 생일이래요. 선물로 비타민 어때요? 농담이에요, 반쯤.',
      replies: [
        { say: '케이크 같이 사러 가요', tier: 'great', face: 'laugh', answer: '좋아요! 과일 많이 올라간 걸로 골라요. 그래야 덜 미안하죠.' },
        { say: '비타민도 나쁘진 않네요', tier: 'good', face: 'wow', answer: '그렇죠? 의사가 주는 선물은 다 이래요. 그래서 인기가 없어요.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '결혼식 소식 들었어요? 저 구급 상자 들고 하객석 맨 뒤에 앉을 거예요.',
      replies: [
        { say: '오늘은 하객만 해요', tier: 'great', face: 'shy', answer: ['…그래도 될까요? 그럼 상자는 의자 밑에 둘게요.', '꽃잎 뿌릴 땐 저도 같이 뿌릴래요.'] },
        { say: '누가 기절할까 봐요?', tier: 'good', face: 'laugh', answer: '신랑이 자주 해요. 긴장해서요. 진짜예요.' },
        { say: '결혼식은 지루해요', tier: 'meh', face: 'calm', answer: '그럼 케이크 나올 때까지만 참아요. 그게 제 비결이에요.' },
      ],
    },
    {
      id: 'op-legend',
      when: { news: 'legend' },
      open: '전설의 물고기 소식 들었어요? 그 사람 맥박 재 보고 싶어요. 엄청 뛰었을 거예요.',
      replies: [
        { say: '저도 언젠가 낚을게요', tier: 'great', face: 'wow', answer: ['좋아요! 그날은 제가 옆에서 맥박 재 줄게요.', '심장이 너무 뛰면 제가 진정시켜 줄게요. 의사니까요.'] },
        { say: '부럽기만 해요', tier: 'good', face: 'smile', answer: '부러운 것도 기운이에요. 그 기운으로 내일 낚시 가요.' },
      ],
    },
    {
      id: 'op-museum',
      when: { news: 'museum' },
      open: '박물관에 새 전시가 생겼대요. 저 옛날 의학 도구 있으면 보러 갈래요.',
      replies: [
        { say: '같이 보러 가요', tier: 'great', face: 'laugh', answer: ['좋아요! 옛날 청진기는 나무로 만들었대요. 신기하죠?', '…저 설명 길어져도 끝까지 들어 줄 거죠?'] },
        { say: '무서운 도구 아니에요?', tier: 'good', face: 'think', answer: '조금요. 그래서 지금 의사가 고마운 거예요. 저 말이에요.' },
      ],
    },
    {
      id: 'op-record',
      when: { news: 'record' },
      open: '마을 기록이 새로 나왔대요! 기록 깬 사람은 어디 다친 데 없나 걱정돼요.',
      replies: [
        { say: '선생님다운 걱정이에요', tier: 'great', face: 'shy', answer: '그렇죠? 축하하고 나서 붕대 들고 가는 게 제 축하 방식이에요.' },
        { say: '다음엔 제가 깰게요', tier: 'good', face: 'laugh', answer: '좋아요. 대신 몸 풀고 깨요. 그게 조건이에요.' },
      ],
    },
    {
      id: 'op-casino-lose',
      when: { recent: 'casinoLose' },
      open: '{me} 씨, 요즘 안색이 좀 창백해요. 혹시 카지노에서 많이 잃었어요?',
      replies: [
        { say: '조금… 이제 쉬려고요', tier: 'great', face: 'smile', answer: ['그 결정이 오늘 제일 좋은 처방이에요.', '꽃차 한 잔 마시고 가요. 마음 맥박부터 내려요.'] },
        { say: '다음엔 딸 거예요', tier: 'meh', face: 'sorry', answer: '그 말이 제일 위험한 증상이에요. 오늘은 집에 가요.' },
        { say: '들켰네요', tier: 'good', face: 'calm', answer: '의사는 다 보여요. 괜찮아요, 잃은 건 다시 벌면 돼요. 몸만 안 잃으면요.' },
      ],
    },
    {
      id: 'op-voyage',
      when: { recent: 'voyage' },
      open: '먼 바다 다녀왔죠? 뱃멀미는 안 했어요? 얼굴이 조금 탔네요.',
      replies: [
        { say: '선생님 생각나서 버텼어요', tier: 'great', face: 'shy', answer: '…그런 처방은 제가 안 냈는데요. 효과가 좋았다니 다행이에요.' },
        { say: '조금 울렁거렸어요', tier: 'good', face: 'think', answer: '생강차 줄게요. 다음엔 먼 수평선을 봐요. 그게 요령이에요.' },
      ],
    },
    {
      id: 'op-stock-down',
      when: { recent: 'stockDown' },
      open: '주식이 떨어졌대요? 그럴 때 혈압도 같이 올라가요. 일단 앉아서 숨 쉬어요.',
      replies: [
        { say: '선생님 보니까 좀 나아요', tier: 'great', face: 'shy', answer: ['…그럼 오늘 진료비는 웃음으로 받을게요.', '숫자는 다시 올라요. 맥박은 지금 내려야 하고요.'] },
        { say: '숨 크게 쉬어 볼게요', tier: 'good', face: 'smile', answer: '좋아요. 들이쉬고… 내쉬고. 그렇죠, 다 나았어요!' },
      ],
    },
    {
      id: 'op-ornn',
      when: { bond: 'ornn' },
      open: '오른 씨 만났죠? 혹시 손에 화상 자국 없었어요? 연고를 또 안 발랐을 거예요.',
      replies: [
        { say: '새 화상이 있던데요', tier: 'great', face: 'sorry', answer: '역시! 오늘 저녁엔 대장간으로 왕진 가야겠어요. 연고 네 통째예요.' },
        { say: '바빠 보이던데요', tier: 'good', face: 'think', answer: '늘 바쁘죠. 그래서 더 걱정이에요. 물이라도 마시라고 전해 줘요.' },
        { say: '잘 모르겠어요', tier: 'meh', answer: '괜찮아요. 제가 직접 볼게요. 숨겨 봐야 다 보여요.' },
      ],
    },
    {
      id: 'op-tsunade',
      when: { bond: 'tsunade' },
      open: '{other} 씨랑 얘기했어요? 또 약초가 수액보다 낫다고 했죠?',
      replies: [
        { say: '둘 다 쓰면 된대요', tier: 'great', face: 'wow', answer: '어머, 그건 제 말인데요! …그 사람도 사실 저랑 같은 생각이에요. 비밀이에요.' },
        { say: '선생님 칭찬하던데요', tier: 'good', face: 'shy', answer: '정말요? 앞에선 절대 안 하면서. 다음엔 제가 먼저 칭찬해야겠네요.' },
        { say: '술 얘기만 했어요', tier: 'meh', face: 'sorry', answer: '…간 수치 걱정되네요. 다음 왕진은 그쪽이에요.' },
      ],
    },
    {
      id: 'op-volibas',
      when: { bond: 'volibas' },
      open: '{other} 씨 봤어요? 어제 순찰하다 넘어져 놓고 멀쩡하다고 했어요.',
      replies: [
        { say: '절뚝거리던데요', tier: 'great', face: 'think', answer: '그럴 줄 알았어요! 오늘 오후엔 붕대 들고 찾아갈게요. 도망가도 날아가요.' },
        { say: '씩씩해 보였어요', tier: 'good', face: 'laugh', answer: '씩씩한 거랑 멀쩡한 건 달라요. 그 사람은 그걸 몰라요.' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '{other} 씨 만났어요? 이번 주 건강 칼럼 같이 쓰는 중이에요. 주제 하나 줄래요?',
      replies: [
        { say: '잠 잘 자는 법이요!', tier: 'great', face: 'laugh', answer: '딱이에요! 마을에 밤샘하는 사람이 너무 많거든요. {me} 씨 이름도 넣을까요?' },
        { say: '단 거 먹어도 되는 날', tier: 'good', face: 'shy', answer: '…그건 제가 쓰고 싶은 거네요. 잔나 씨한테 들키면 웃을 거예요.' },
        { say: '칼럼은 안 읽어요', tier: 'meh', face: 'sorry', answer: '어머. 그럼 제가 직접 읽어 줄게요. 진료 받으러 올 때마다요.' },
      ],
    },
    {
      id: 'op-muzan',
      when: { bond: 'muzan' },
      open: '{other} 씨 봤어요? 차양 밑에만 있잖아요. 햇볕 좀 쬐라고 또 말해야겠어요.',
      replies: [
        { say: '선생님 말은 들을 거예요', tier: 'great', face: 'laugh', answer: '그럼 좋겠네요. 얼굴이 너무 창백해서 진료하고 싶어 손이 근질거려요.' },
        { say: '그분은 밤이 좋대요', tier: 'good', face: 'think', answer: '밤도 좋죠. 그래도 사람은 낮에 걸어야 해요. 의학은 고집이 세요.' },
      ],
    },
    {
      id: 'op-haku',
      when: { bond: 'haku' },
      open: '{other} 씨 만났어요? 이번 허브 꾸러미가 아주 향긋해요. 고맙다고 전해 줘요.',
      replies: [
        { say: '직접 말하면 더 좋아해요', tier: 'great', face: 'shy', answer: ['…그렇겠죠? 그럼 오늘 저녁에 꽃차 들고 갈게요.', '받은 허브로 우린 차예요. 돌고 도는 선물이네요.'] },
        { say: '꼭 전할게요', tier: 'good', face: 'smile', answer: '고마워요. 귤껍질 넣은 차도 맛있었다고요.' },
      ],
    },
    {
      id: 'op-gwen',
      when: { bond: 'gwen' },
      open: '{other} 씨 미용실 다녀왔죠? 머리가 산뜻하네요. 저 소문 들은 거 있어요?',
      replies: [
        { say: '선생님이 요즘 웃는대요', tier: 'great', face: 'shy', answer: ['…그런 소문이요? 누구 때문인지는 비밀이에요.', '그웬 씨한텐 아무 말 하지 마요. 내일 온 마을이 알아요.'] },
        { say: '별 얘기 없었어요', tier: 'good', face: 'laugh', answer: '그게 더 수상해요. 그웬 씨가 조용하면 큰 게 오거든요.' },
      ],
    },
    {
      id: 'op-shinichi',
      when: { bond: 'shinichi' },
      open: '{other} 씨 봤어요? 또 뛰어다니다 무릎 까졌을 텐데, 말은 안 했죠?',
      replies: [
        { say: '바지에 흙이 묻었던데요', tier: 'great', face: 'think', answer: ['역시! {me} 씨도 탐정 다 됐네요.', '증거 확보예요. 저녁에 소독약 들고 가 볼게요.'] },
        { say: '사건 얘기만 했어요', tier: 'good', face: 'laugh', answer: '그 사람은 늘 그래요. 아픈 것보다 수수께끼가 먼저예요.' },
      ],
    },
    {
      id: 'op-with-tsunade',
      when: { with: 'tsunade' },
      open: '아, {me} 씨. 지금 {other} 씨랑 약초 대 수액 토론 중이었어요. 심판 해 줄래요?',
      replies: [
        { say: '둘 다 이겼어요', tier: 'great', face: 'laugh', answer: ['그 판정 좋네요! 츠나데 씨도 웃었어요. 봤죠?', '그럼 이긴 기념으로 둘 다 차 한 잔씩이에요.'] },
        { say: '선생님이 이겼어요', tier: 'good', face: 'shy', answer: '…고마운데, 옆에서 눈빛이 무서워요. 무승부로 해요.' },
        { say: '저는 빠질게요', tier: 'meh', face: 'calm', answer: '현명해요. 이 토론은 십 년째 끝나지 않을 거예요.' },
      ],
    },
    {
      id: 'op-with-janna',
      when: { with: 'janna' },
      open: '{me} 씨! 지금 {other} 씨랑 칼럼 마감 중이에요. 커피는 두 잔째예요. 아직 괜찮아요.',
      replies: [
        { say: '세 번째는 제가 막을게요', tier: 'great', face: 'laugh', answer: ['어머, 감시관이 왔네요. 잔나 씨도 웃어요.', '알았어요. 세 번째는 꽃차로 할게요. 약속해요.'] },
        { say: '마감 힘내요', tier: 'good', face: 'smile', answer: '고마워요! 다 쓰면 {me} 씨한테 제일 먼저 읽어 줄게요.' },
      ],
    },
    {
      id: 'op-sulk',
      when: { sulk: true },
      open: '…오늘 {other} 씨랑 좀 서먹해요. 제가 잔소리를 너무 했나 봐요.',
      replies: [
        { say: '걱정해서 그런 거잖아요', tier: 'great', face: 'shy', answer: ['…그렇게 말해 주니 조금 나아요.', '내일 사과하러 갈게요. 핫초콜릿 한 잔 들고요.'] },
        { say: '내일이면 풀릴 거예요', tier: 'good', face: 'calm', answer: '그렇겠죠. 마음도 상처처럼 하루 자고 나면 덜 아파요.' },
        { say: '잔소리는 줄여요', tier: 'meh', face: 'sorry', answer: '…맞는 말이라 더 아프네요. 노력할게요.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-coffee',
      when: { mem: 'coffee-fan' },
      use: 'coffee-fan',
      open: '커피파 {me} 씨! 오늘 몇 잔째예요? 저는 아직 한 잔이에요. 자랑이에요.',
      replies: [
        { say: '저도 딱 한 잔이요', tier: 'great', face: 'laugh', answer: '둘 다 합격! 그럼 두 번째 잔은 같이 마셔요. 그게 마지막이에요.' },
        { say: '세 잔째예요…', tier: 'good', face: 'sorry', answer: '어머, 오늘은 커피 끝이에요. 대신 꽃차 처방이에요.' },
      ],
    },
    {
      id: 'cb-tea-fan',
      when: { mem: 'tea-fan' },
      use: 'tea-fan',
      open: '꽃차 좋아한다고 했죠? 오늘 새로 들어온 국화 꽃차예요. 첫 잔 드릴게요.',
      replies: [
        { say: '같이 마셔요', tier: 'great', face: 'shy', answer: ['좋아요. 꽃잎 피는 것까지 같이 봐요.', '이렇게 기다리는 시간도 진료에 넣고 싶어요.'] },
        { say: '향이 좋아요', tier: 'good', face: 'smile', answer: '그렇죠? 하쿠 씨 솜씨예요. 저는 물만 끓였어요.' },
      ],
    },
    {
      id: 'cb-sweet',
      when: { mem: 'sweet-tooth' },
      use: 'sweet-tooth',
      open: '단 거 좋아한다던 {me} 씨, 이거요. 바닐라 푸딩 하나 남겨 뒀어요.',
      replies: [
        { say: '반씩 나눠 먹어요', tier: 'great', face: 'shy', answer: '…그럼 반만요. 단 건 둘이 먹으면 반만 살찐대요. 제 학설이에요.' },
        { say: '고마워요, 잘 먹을게요', tier: 'good', answer: '천천히 먹어요. 단 거는 급하게 먹으면 약효가 없어요.' },
      ],
    },
    {
      id: 'cb-mountain',
      when: { mem: 'mountain-home' },
      use: 'mountain-home',
      open: '고향 산 이야기 기억해요? 어젯밤 꿈에 소 방울 소리가 들렸어요.',
      replies: [
        { say: '언젠가 같이 가 봐요', tier: 'great', face: 'shy', answer: '…정말요? 그럼 등산화부터 골라 줄게요. 무릎 보호대도요.' },
        { say: '그리워요?', tier: 'good', face: 'calm', answer: '조금요. 그래도 여기 사람들이 있어서 괜찮아요. {me} 씨도요.' },
      ],
    },
    {
      id: 'cb-fall',
      when: { mem: 'fall-up' },
      use: 'fall-up',
      open: '넘어지면 부르기로 했죠? 요즘 안 넘어졌어요? 무릎 좀 봐요.',
      replies: [
        { say: '한 번 넘어졌는데 버텼어요', tier: 'great', face: 'think', answer: '버티지 말고 부르기로 했잖아요! …그래도 다 나았네요. 합격이에요.' },
        { say: '안 넘어졌어요!', tier: 'good', face: 'laugh', answer: '잘했어요. 그래도 약속은 그대로예요. 부르면 날아가요.' },
      ],
    },
    {
      id: 'cb-checkup',
      when: { mem: 'checkup-yes' },
      use: 'checkup-yes',
      open: '{me} 씨, 검진 받겠다고 했죠? 예약 칸 아직 비워 뒀어요. 도망 금지예요~',
      replies: [
        { say: '지금 받을게요', tier: 'great', face: 'laugh', answer: '좋아요! 맥박 정상, 안색 정상, 웃음 정상. 사탕 받아 가요.' },
        { say: '다음 주에요, 진짜로', tier: 'good', face: 'think', answer: '진짜로요? 진료 기록에 큰 글씨로 적어 둘게요.' },
      ],
    },
    {
      id: 'cb-rest',
      when: { mem: 'rest-promise', noMem: 'rest-checked' },
      open: '{me} 씨, 무리 안 하겠다고 약속했었죠. 진료 기록 펼쳐 볼게요. 지켰어요?',
      replies: [
        { say: '네, 요즘 일찍 자요', tier: 'great', remember: 'rest-checked', face: 'laugh', answer: ['합격이에요! 기록에 꽃 도장 하나 찍어 줄게요.', '…저도 따라 해 볼게요. 의사가 지면 안 되니까요.'] },
        { say: '반쯤 지켰어요', tier: 'good', remember: 'rest-checked', face: 'think', answer: '반이면 시작은 한 거예요. 나머지 반은 이번 주 숙제예요.' },
      ],
    },
    {
      id: 'cb-night',
      when: { mem: 'night-owl' },
      use: 'night-owl',
      open: '밤형 {me} 씨, 어젯밤엔 몇 시에 잤어요? 거짓말하면 눈 밑이 말해 줘요.',
      replies: [
        { say: '자정 전에 잤어요!', tier: 'great', face: 'wow', answer: '어머, 진짜네요! 눈 밑이 맑아요. 오늘의 모범 환자예요.' },
        { say: '…조금 늦었어요', tier: 'good', face: 'sorry', answer: '솔직해서 봐줄게요. 오늘은 캐모마일차 들고 가요.' },
      ],
    },
    {
      id: 'cb-ginseng',
      when: { mem: 'ginseng-hunt' },
      use: 'ginseng-hunt',
      open: '산삼 같이 찾자고 했죠? 숲 깊은 데 잎이 다섯 갈래인 풀을 봤대요.',
      replies: [
        { say: '이번 주에 가요!', tier: 'great', face: 'wow', answer: ['좋아요! 약초 가방 두 개, 물병 두 개, 초콜릿 하나요.', '못 찾아도 괜찮아요. 숲길 산책만으로도 약이에요.'] },
        { say: '독초면 어떡해요?', tier: 'good', face: 'laugh', answer: '그래서 제가 같이 가는 거예요. 독초는 의사 담당이에요.' },
      ],
    },
    {
      id: 'cb-bug',
      when: { mem: 'bug-help' },
      use: 'bug-help',
      open: '{me} 씨! 마침 잘 왔어요. 진료실 창에 나방이 붙었어요. 벌레 담당이잖아요!',
      replies: [
        { say: '맡겨 주세요!', tier: 'great', face: 'laugh', answer: ['영웅이네요! 저는 의자 위에서 응원할게요.', '보수는 약속대로 바닐라 푸딩이에요. 두 개 줄게요.'] },
        { say: '저도 무서운데요…', tier: 'good', face: 'sorry', answer: '그럼 둘이 같이 창문만 열어요. 알아서 나가길 빌어요.' },
      ],
    },
    {
      id: 'cb-wing',
      when: { mem: 'wing-story' },
      use: 'wing-story',
      open: '날개 옷 이야기 기억해요? 어제 옷장 정리하다 깃털 하나가 떨어졌어요.',
      replies: [
        { say: '그 깃털, 갖고 싶어요', tier: 'great', face: 'shy', answer: ['…이거요? 그럼 {me} 씨가 가져요.', '부적이에요. 갖고 있으면 제가 더 빨리 날아가요. 아마도요.'] },
        { say: '옷 고쳐야겠네요', tier: 'good', face: 'smile', answer: '그웬 씨한테 부탁해 볼까요. 바느질도 잘하거든요.' },
      ],
    },
    {
      id: 'cb-oldteam',
      when: { mem: 'old-team' },
      use: 'old-team',
      open: '옛 팀 얘기 들어 줬었죠? 어제 그때 동료한테 편지가 왔어요. 또 다쳤대요.',
      replies: [
        { say: '답장에 처방 적어 줘요', tier: 'great', face: 'laugh', answer: ['그럴 거예요! 첫 줄은 무리 금지, 둘째 줄도 무리 금지요.', '셋째 줄엔 이 마을 이야기를 쓸래요. {me} 씨 이야기도요.'] },
        { say: '보고 싶겠어요', tier: 'good', face: 'calm', answer: '조금요. 그래도 편지가 오니까 괜찮아요. 다들 살아 있어요.' },
      ],
    },
    {
      id: 'cb-hill',
      when: { mem: 'hill-dusk' },
      use: 'hill-dusk',
      open: '뒷산 노을 같이 본 날 기억해요? 그날 이후로 저 힘든 날엔 거기 가요.',
      replies: [
        { say: '그럴 땐 저도 불러요', tier: 'great', face: 'shy', answer: ['…불러도 돼요? 저 부르는 거 잘 못하는데요.', '그럼 연습해 볼게요. {me} 씨부터요.'] },
        { say: '노을 처방 효과 있죠?', tier: 'good', face: 'smile', answer: '최고예요. 커피보다 낫다는 건 비밀이에요.' },
      ],
    },
    {
      id: 'cb-flowertea',
      when: { mem: 'flowertea-cup' },
      use: 'flowertea-cup',
      open: '그때 꽃차 마시다 제가 졸았던 거, 아무한테도 안 말했죠? 그날 개운했어요.',
      replies: [
        { say: '또 졸아도 돼요', tier: 'great', face: 'shy', answer: ['…그런 허락은 처음 받아 봐요.', '그럼 다음엔 주전자 불은 {me} 씨가 봐 줘요.'] },
        { say: '비밀 지켰어요', tier: 'good', face: 'laugh', answer: '고마워요. 의사의 비밀은 의원 밖으로 안 나가야 해요.' },
      ],
    },
    {
      id: 'cb-cocoa',
      when: { mem: 'cocoa-fan' },
      use: 'cocoa-fan',
      open: '고향식 핫초콜릿 마셔 보고 싶다고 했죠? 오늘 냄비 가득 끓였어요. 숟가락은 기울어요.',
      replies: [
        { say: '와, 진짜 진하네요', tier: 'great', face: 'laugh', answer: ['그렇죠? 이게 고향 맛이에요. 눈 오는 날 생각나요.', '한 잔만이에요. 나머지는… 제 거예요.'] },
        { say: '조금 달아요', tier: 'good', face: 'think', answer: '그럼 우유를 조금 더요. 맞춤 처방이에요.' },
      ],
    },
    {
      id: 'cb-chamomile',
      when: { mem: 'tea:chamomile' },
      use: 'tea:chamomile',
      open: '캐모마일 좋아한다고 했죠? 하쿠 씨가 꽃을 잔뜩 줬어요. 한 봉지 싸 뒀어요.',
      replies: [
        { say: '오늘 밤에 마실게요', tier: 'great', face: 'smile', answer: '좋아요. 마시고 바로 누워요. 내일 아침에 눈빛으로 검사할게요.' },
        { say: '선생님도 마셔요', tier: 'good', face: 'shy', answer: '…들켰네요. 저도 한 봉지 챙겨 뒀어요. 같은 시간에 마셔요.' },
      ],
    },
    {
      id: 'cb-mint',
      when: { mem: 'tea:mint' },
      use: 'tea:mint',
      open: '박하차파 {me} 씨! 의원 화분에 박하가 너무 잘 자라요. 좀 뜯어 갈래요?',
      replies: [
        { say: '한 줌만 주세요', tier: 'great', face: 'laugh', answer: '두 줌 가져가요. 박하는 뜯을수록 더 자라요. 저 같아요.' },
        { say: '화분째 주세요', tier: 'good', face: 'wow', answer: '어머, 욕심쟁이! 좋아요, 작은 거 하나 나눠 줄게요.' },
      ],
    },
    {
      id: 'cb-ginger',
      when: { mem: 'tea:ginger' },
      use: 'tea:ginger',
      open: '생강차 좋아한다고 했죠? 감기 철 오기 전에 생강청을 담갔어요. 한 병 가져가요.',
      replies: [
        { say: '꿀도 넣었어요?', tier: 'great', face: 'laugh', answer: ['당연하죠! 꿀 반, 생강 반이에요. 제 비율이에요.', '쓴 약보다 이게 먼저예요. 의사 순서예요.'] },
        { say: '고마워요, 아껴 먹을게요', tier: 'good', face: 'smile', answer: '아끼지 말고 먹어요. 떨어지면 또 담가 줄게요.' },
      ],
    },
    {
      id: 'cb-cut',
      when: { mem: 'cut-hand' },
      use: 'cut-hand',
      open: '{me} 씨, 낫질하다 베였던 손 좀 봐요. …음, 흉도 거의 없네요. 요즘 조심해요?',
      replies: [
        { say: '바깥쪽으로 당겨요', tier: 'great', face: 'laugh', answer: ['제가 가르친 거 기억하네요! 합격이에요.', '이 손은 이제 제가 기억하는 손이에요. 다치면 바로 알아요.'] },
        { say: '장갑도 껴요', tier: 'good', face: 'smile', answer: '더 좋네요. 오른 씨한테도 그 말 좀 해 줘요.' },
      ],
    },
    {
      id: 'cb-scrape',
      when: { mem: 'mine-scrape' },
      use: 'mine-scrape',
      open: '광산에서 긁혔던 팔, 다 나았어요? 오늘도 광산 가면 소매 내리고 가요.',
      replies: [
        { say: '다 나았어요, 선생님 덕에', tier: 'great', face: 'shy', answer: '…그 말이 제일 좋은 진료비예요. 그래도 소매는 내려요.' },
        { say: '또 조금 긁혔어요', tier: 'good', face: 'sorry', answer: '이리 와요. 소독하고 연고 바르고. 그렇죠, 다 나았어요!' },
      ],
    },
    {
      id: 'cb-milk',
      when: { mem: 'warm-milk' },
      use: 'warm-milk',
      open: '자기 전에 따뜻한 우유 마신다고 했죠? 목장에서 좋은 우유 한 병 받아 왔어요.',
      replies: [
        { say: '오늘 밤에 같이 데워요', tier: 'great', face: 'shy', answer: ['…같이요? 그럼 꿀은 제가 넣을게요.', '이 처방은 둘이 지키는 거예요. 일찍 자기요.'] },
        { say: '잘 마실게요', tier: 'good', face: 'smile', answer: '팔팔 끓이지 말고 살짝만 데워요. 그게 요령이에요.' },
      ],
    },
    {
      id: 'cb-book',
      when: { mem: 'bed-book' },
      use: 'bed-book',
      open: '자기 전에 책 읽는다고 했죠? 요즘 뭐 읽어요? 너무 재밌는 거면 압수예요.',
      replies: [
        { say: '지루한 의학책이요', tier: 'great', face: 'laugh', answer: ['어머, 그건 제 책장에 있는 거예요! 잠 잘 오죠?', '…저는 그걸 재밌게 읽어서 밤새요. 비밀이에요.'] },
        { say: '추리 소설이요', tier: 'good', face: 'think', answer: '신이치 씨 추천이죠? 그건 낮에만 읽어요. 범인 궁금해서 못 자요.' },
      ],
    },
    {
      id: 'cb-water',
      when: { mem: 'water-promise' },
      use: 'water-promise',
      open: '물 자주 마시겠다고 약속했죠? 자, 물병 검사예요. 꺼내 봐요.',
      replies: [
        { say: '여기요, 반 남았어요', tier: 'great', face: 'laugh', answer: '합격이에요! 반 마시고 반 남긴 게 딱 좋아요. 꽃 도장 하나요.' },
        { say: '…물병을 잃어버렸어요', tier: 'good', face: 'sorry', answer: '그럼 의원 물병 하나 줄게요. 이름 써 놨으니 잃어버리지 마요.' },
      ],
    },
    {
      id: 'cb-stretch',
      when: { mem: 'stretch-promise' },
      use: 'stretch-promise',
      open: '아침 스트레칭 하기로 했죠? 지금 한번 해 봐요. 팔 위로, 쭉.',
      replies: [
        { say: '쭉… 이렇게요?', tier: 'great', face: 'smile', answer: ['완벽해요! 매일 한 거 맞네요. 몸이 말해 줘요.', '저도 같이 할게요. 쭉. 아, 시원하다.'] },
        { say: '사흘 하고 잊었어요', tier: 'good', face: 'laugh', answer: '사흘이면 잘한 거예요. 오늘부터 다시 사흘씩 해요.' },
      ],
    },
    {
      id: 'cb-firstaid',
      when: { mem: 'first-aid' },
      use: 'first-aid',
      open: '응급처치 배우기로 했죠? 첫 수업이에요. 붕대 들고 제 팔에 감아 봐요.',
      replies: [
        { say: '너무 세게 감았나요?', tier: 'great', face: 'laugh', answer: ['조금요! 손끝이 하얘졌어요. 살짝 풀어요. 그렇죠.', '처음치곤 훌륭해요. 오늘부터 제 조수예요.'] },
        { say: '선생님 팔 가늘어요', tier: 'good', face: 'shy', answer: '…수업 중이에요, {me} 씨. 집중해요. 그래도 고마워요.' },
      ],
    },
    {
      id: 'cb-bell',
      when: { mem: 'bell-signal' },
      use: 'bell-signal',
      open: '의원 종 세 번 약속 기억하죠? 어젯밤엔 종이 한 번도 안 울렸어요. 푹 잤어요.',
      replies: [
        { say: '선생님이 푹 자서 좋아요', tier: 'great', face: 'shy', answer: ['…저 잘 잔 걸로 기뻐해 주는 사람, 처음이에요.', '오늘도 종 안 울리게 다들 조심해 줘요.'] },
        { say: '종소리 듣고 싶었는데', tier: 'good', face: 'laugh', answer: '장난으로 치면 무릎 검사라고 했죠? 아직 유효해요.' },
      ],
    },
    {
      id: 'cb-research',
      when: { mem: 'research-ear' },
      use: 'research-ear',
      open: '아주 작은 약 연구 기억해요? 오늘 처음으로 작은 상처가 하루 만에 아물었어요!',
      replies: [
        { say: '축하해요, 대단해요!', tier: 'great', face: 'wow', answer: ['고마워요! {me} 씨가 제일 먼저 들었어요.', '…그리고 오늘 밤은 연구 안 하고 잘게요. 축하니까요.'] },
        { say: '밤새서 한 거죠?', tier: 'good', face: 'sorry', answer: '…아니라고는 못 하겠네요. 오늘은 일찍 잘게요. 약속해요.' },
      ],
    },
    {
      id: 'cb-nap',
      when: { mem: 'doc-nap' },
      use: 'doc-nap',
      open: '{me} 씨, 낮잠 지켜 준다고 했죠? 지금 십오 분만 문 앞에 있어 줄래요?',
      replies: [
        { say: '삼십 분 지켜 줄게요', tier: 'great', face: 'shy', answer: ['…그럼 삼십 분만요. 종이 울리면 깨워 줘요.', '누가 지켜 주니까 잠이 금방 와요. 신기하네요.'] },
        { say: '푹 자요, 여기 있을게요', tier: 'good', face: 'smile', answer: '고마워요. 일어나면 커피 말고 꽃차 마실게요.' },
      ],
    },
    {
      id: 'cb-dayoff',
      when: { mem: 'day-off' },
      use: 'day-off',
      open: '쉬는 날 같이 보내자고 했죠? 휴진 팻말 만들었어요. 의원 쉽니다, 의사도 쉽니다.',
      replies: [
        { say: '그 팻말 마음에 들어요', tier: 'great', face: 'laugh', answer: ['그렇죠? 오른 씨가 테두리를 둘러 줬어요.', '그럼 그날은 {me} 씨가 제 의사예요. 쉬라고 말해 줘요.'] },
        { say: '진짜 쉴 수 있어요?', tier: 'good', face: 'think', answer: '…노력할게요. 왕진 가방은 옷장에 넣어 잠가 둘게요.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me} 씨 좋아하는 거, {taste}. 맞죠? 진료 기록 구석에 적어 뒀어요.',
      replies: [
        { say: '그런 것도 적어요?', tier: 'great', face: 'shy', remember: 'taste-heard', answer: '좋아하는 게 있으면 회복이 빨라요. 그러니 중요한 기록이에요.' },
        { say: '선생님은 뭐 좋아해요?', tier: 'good', remember: 'taste-heard', answer: '꽃차랑 바닐라 푸딩이요. 그리고 산삼이요. 욕심쟁이죠?' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 걸은 날, 산책 처방 효과 최고였어요. 제가 더 건강해졌어요.',
      replies: [
        { say: '또 같이 걸어요', tier: 'great', face: 'smile', remember: 'outing-talk', answer: '좋아요! 다음엔 뒷산까지요. 물병 두 개 챙길게요.' },
        { say: '선생님 계속 잔소리했잖아요', tier: 'good', face: 'laugh', remember: 'outing-talk', answer: '잔소리 아니고 처방이에요! …조금은 잔소리였어요.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me} 씨, 곧 생일이죠? 선물로 무료 건강 검진 어때요? 농담이에요, 반쯤.',
      replies: [
        { say: '선생님이랑 푸딩이면 돼요', tier: 'great', face: 'shy', remember: 'bday-plan', answer: '…그건 제가 받는 선물 같은데요. 그래도 좋아요. 제일 맛있는 걸로요.' },
        { say: '검진도 좋아요', tier: 'good', face: 'laugh', remember: 'bday-plan', answer: '정말요? 그럼 생일 특별 검진이에요. 끝나면 케이크 한 조각 처방할게요.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '{me} 씨 방에서 쉬던 날요. 저 그날 처음으로 왕진 가방 생각을 안 했어요.',
      replies: [
        { say: '또 놀러 와요, 빈손으로', tier: 'great', face: 'shy', remember: 'date-talk', answer: ['…빈손으로요? 그럼 커피도 안 들고 갈게요.', '대신 {me} 씨가 차 한 잔 우려 줘요. 그게 제 처방이에요.'] },
        { say: '방 환기 합격이었죠?', tier: 'good', face: 'laugh', remember: 'date-talk', answer: '합격이었어요! 그리고 그 방 사람도요. 아주 많이요.' },
      ],
    },
  ],
  chapters: [
    {
      title: '메르시 의원의 첫 진료',
      hint: '한 번 이야기를 나누면 메르시가 진료 기록 첫 장을 펼쳐요.',
      need: { days: 1 },
      scene: [
        '산기슭 의원 문을 열자 커피 향과 소독약 냄새가 섞여 난다.',
        '메르시가 하품을 삼키다 들키고는 머쓱하게 웃는다.',
        '"어서 와요! 밤새 왕진 다녀와서요. 못 본 걸로 해 줘요."',
        '그녀가 새 진료 기록부를 꺼내 첫 장을 펼친다.',
        '"자, 이름 적고… 손목 좀 줘 봐요. 맥박도 볼게요."',
        '"음, 아주 건강하네요! 합격이에요. 사탕 하나 받아요."',
        '창가엔 다 식은 커피잔이 세 개 나란히 놓여 있다.',
        '"아, 그건… 제 거예요. 의사도 가끔 처방을 안 지켜요."',
        '"이 기록부는 {me} 씨 전용이에요. 아플 때만 오라는 뜻은 아니에요."',
        '"안 아파도 와요. 수다도 진료니까요. 의사 선생님 말 들어요~"',
      ],
      replies: [
        { say: '자주 올게요, 선생님', tier: 'great', remember: 'checkup-yes', face: 'smile', answer: ['약속이에요! 다음엔 꽃차 내 둘게요. 단골 환자 특전이에요.', '…그리고 커피잔은 오늘 안에 치울게요. 진짜로요.'] },
        { say: '선생님은 언제 자요?', tier: 'good', face: 'wow', answer: ['어머, 의사한테 그런 걸 묻는 환자는 처음이에요.', '…오늘은 일찍 잘게요. 아마도요. 기록에는 쓰지 마요.'] },
        { say: '저 안 아픈데요', tier: 'meh', face: 'calm', answer: ['그러니까 지금 오는 거예요.', '아프기 전에 오는 사람이 제일 똑똑해요. 진짜예요.'] },
      ],
    },
    {
      title: '뒷산의 분홍 노을',
      hint: '저녁 무렵(게임 시각 오후 다섯 시부터 아홉 시) 뒷산에 올라가 보세요. 메르시가 산책 중이래요.',
      need: { days: 3, points: 20, visit: { area: 'hill', from: 17, to: 21 } },
      scene: [
        '뒷산 꼭대기, 메르시가 왕진 가방을 내려놓고 숨을 깊게 쉰다.',
        '"왔네요! 사실 오늘은 좀 힘든 날이었어요."',
        '"볼리바스 씨 무릎, 오른 씨 화상, 할머니 혈압까지요."',
        '"그런 날엔 여기 올라와요. 공기가 고향 산이랑 닮았거든요."',
        '그녀가 바위에 앉아 신발 끈을 느슨하게 푼다.',
        '"고향에선 노을이 지면 눈 덮인 봉우리가 분홍색이 돼요."',
        '"어릴 땐 그 봉우리까지 날아가는 꿈을 꿨어요. 다친 사람 구하러요."',
        '"…지금 생각하면 그때부터 쉬는 법을 몰랐나 봐요."',
        '하늘이 천천히 분홍빛으로 물든다. 메르시가 조용히 웃는다.',
        '"여기엔 눈은 없지만… 같이 보는 사람이 있으니까 더 좋네요."',
      ],
      replies: [
        { say: '정말 분홍색이에요', tier: 'great', remember: 'hill-dusk', face: 'wow', answer: ['그렇죠? 이 색 보면 피로가 싹 풀려요.', '오늘의 처방은 노을이에요. {me} 씨 몫, 제 몫 하나씩요.'] },
        { say: '선생님도 좀 쉬어요', tier: 'good', remember: 'hill-dusk', face: 'shy', answer: ['…지금 쉬고 있어요. {me} 씨 옆에서요.', '이것도 휴식이에요. 처음 해 보는 종류지만요.'] },
        { say: '산 오르느라 힘들어요', tier: 'meh', remember: 'hill-dusk', face: 'laugh', answer: ['자, 앉아요. 물 마시고요.', '내려갈 땐 보폭 작게, 제 팔 잡고요. 그렇죠.'] },
      ],
    },
    {
      title: '꽃차 한 주전자',
      hint: '메르시가 꽃차를 좋아한대요. 꽃차 하나를 가지고 의원에 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'flowertea', take: true } },
      scene: [
        '꽃차를 내밀자 메르시의 눈이 반짝인다.',
        '"어머, 꽃차예요! 제가 제일 좋아하는 거 어떻게 알았어요?"',
        '진료실 창가에서 주전자에 물을 올린다. 꽃잎이 천천히 핀다.',
        '"옛 팀에선 커피만 마셨어요. 쉴 틈이 없었거든요."',
        '"부르면 날아가고, 고치면 또 부르고. 그게 하루였어요."',
        '"이렇게 기다려야 우러나는 차는, 여기 와서 처음 배웠어요."',
        '차가 우러나는 동안 메르시의 고개가 조금씩 기운다.',
        '잠깐 사이 그녀가 의자에 기댄 채 눈을 감는다.',
        '주전자가 작게 끓는 소리를 낸다. 그녀가 화들짝 깬다.',
        '"어머, 제가 졸았어요? …환자 앞에서 이러면 안 되는데."',
        '"아, {me} 씨는 환자 아니죠. 그럼 조금은 괜찮을까요?"',
      ],
      replies: [
        { say: '기다리는 것도 약이네요', tier: 'great', remember: 'flowertea-cup', face: 'smile', answer: ['맞아요! {me} 씨 오늘 의사 면허 반쯤 줄게요.', '첫 잔은 {me} 씨 거예요. 둘째 잔은… 졸지 않고 마실게요.'] },
        { say: '조금 더 자도 돼요', tier: 'good', remember: 'flowertea-cup', face: 'shy', answer: ['…그런 말 들으니까 진짜 졸리네요.', '딱 차 식을 때까지만요. 그동안 문 좀 봐 줘요.'] },
        { say: '커피가 빠른데요', tier: 'meh', remember: 'flowertea-cup', face: 'laugh', answer: ['빠른 게 늘 좋은 건 아니에요.', '오늘은 천천히 마셔 봐요. 처방이에요. 저한테도요.'] },
      ],
    },
    {
      title: '의사의 약속',
      hint: '메르시에게 무리하지 않겠다고 약속하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'rest-promise' },
      scene: [
        '밤늦은 의원, 진료실 불만 혼자 켜져 있다.',
        '메르시가 붕대를 감다 말고 책상에 이마를 기대고 있다.',
        '"어머, {me} 씨. 이 시간에 웬일이에요? 어디 다쳤어요?"',
        '"저요? 괜찮아요. 오늘 환자가 좀 많았을 뿐이에요."',
        '그녀가 일어나려다 휘청한다. 손이 책상 모서리를 짚는다.',
        '"…괜찮다니까요. 의사가 제일 자기 몸을 몰라요. 그렇죠."',
        '"{me} 씨, 무리 안 하겠다고 약속했었죠. 지키고 있어요?"',
        '"사실 그 약속, 저도 지키기 어려워요."',
        '"다치는 사람이 보이면 몸이 먼저 가요. 날개가 있던 때처럼요."',
        '"그래서 부탁할게요. 제가 무리하면 {me} 씨가 말려 줘요."',
        '"서로의 의사가 되는 거예요. 어때요?"',
      ],
      replies: [
        { say: '좋아요. 서로의 의사예요', tier: 'great', face: 'shy', answer: ['…고마워요. 그럼 첫 처방은 {me} 씨가 내려요.', '…벌써 표정에 쓰여 있네요. 지금 당장 불 끄고 자기. 따를게요.'] },
        { say: '저 잔소리 잘해요', tier: 'good', face: 'laugh', answer: ['기대할게요! 제 잔소리보다 세면 인정해 줄게요.', '…그래도 오늘은 살살 해 줘요. 진짜 지쳤거든요.'] },
        { say: '선생님은 괜찮잖아요', tier: 'meh', face: 'calm', answer: ['그렇게 보이죠. 다들 그렇게 봐요.', '의사가 제일 자기 몸을 몰라요. 그래서 부탁하는 거예요.'] },
      ],
    },
    {
      title: '진단은 보류예요',
      hint: '메르시와 아주 가까워지면 그녀가 미뤄 둔 진단을 털어놓아요. 그 뒤엔 꽃다발도 웃으며 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '늦은 저녁, 불 꺼진 진료실. 메르시가 청진기를 만지작거린다.',
        '책상 위엔 {me} 씨 이름이 적힌 기록부가 펼쳐져 있다.',
        '"요즘 저, 밤 열 시면 진료실 불을 꺼요. 놀랍죠?"',
        '"{me} 씨가 말려 준 뒤로요. 커피도 하루 두 잔만 마셔요."',
        '"그런데 이상한 증상이 하나 생겼어요."',
        '"{me} 씨 목소리만 들리면 맥박이 빨라져요. 제 맥박이요."',
        '그녀가 청진기를 자기 가슴에 대 보고 작게 웃는다.',
        '"봐요, 또 빨라졌어요. 의사니까 원인은 알 것 같아요."',
        '"그래도 진단은 아직 보류할게요. 확실해질 때까지요."',
        '"꽃다발은 처방전에 없지만, 받으면 금방 나을 것 같기도 하고요."',
      ],
      replies: [
        { say: '그 증상, 저도 있어요', tier: 'great', face: 'shy', answer: ['…어머. 그럼 같은 병이네요.', '치료법은 둘이 같이 찾아봐요. 천천히요. 서두르면 덧나요.'] },
        { say: '꽃다발, 기억해 둘게요', tier: 'good', face: 'laugh', answer: ['아, 그건 혼잣말이었어요!', '…그래도 기억해 줘요. 조금은요. 아주 조금은요.'] },
        { say: '과로 아니에요?', tier: 'meh', face: 'calm', answer: ['…그럴지도요. 오늘은 일찍 잘게요.', '그래도 그 진단은 아닌 것 같아요. 의사의 감이에요.'] },
      ],
    },
    {
      title: '당신 전담 수호천사',
      hint: '메르시와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '쉬는 날 아침, 메르시가 옷장에서 하얀 날개 옷을 꺼내 온다.',
        '"보여 주기로 했잖아요. 이걸 입고 많은 사람한테 날아갔어요."',
        '날개 끝 깃털 몇 개가 해져 있다. 그녀가 그 자리를 쓰다듬는다.',
        '"늘 남한테만 날아갔어요. 제가 지칠 땐 아무도 안 불렀고요."',
        '"근데 {me} 씨가 처음으로 저한테 와 줬어요. 진료실 그 밤에요."',
        '"그때 알았어요. 저도 돌봄을 받아도 된다는 거요."',
        '그녀가 날개 옷을 접어 다시 옷장에 넣고, 문을 꼭 닫는다.',
        '"이제 날아갈 곳을 하나로 정하고 싶어요. {me} 씨한테요."',
        '"마을 모두의 의사는 그대로예요. 볼리바스 씨 무릎도요."',
        '"하지만 수호천사는 {me} 씨 전담이에요. 그리고 {me} 씨는…"',
        '"제 전담 의사예요. 쉬라고 말해 주는 단 한 사람이요."',
        '"반지 같은 건 처방전에 없지만… 받으면 평생 낫지 않을 것 같아요."',
      ],
      replies: [
        { say: '평생 제 수호천사 해 줘요', tier: 'great', face: 'shy', answer: ['…약속이에요. 의사 선생님 약속은 절대 안 깨져요.', '대신 {me} 씨도 평생 제 의사 해 줘요. 그렇죠?'] },
        { say: '저도 선생님 지킬게요', tier: 'good', face: 'laugh', answer: ['서로의 의사, 서로의 수호천사네요.', '처방전이 꽉 찼어요. 이제 남은 칸은 하나뿐이에요.'] },
        { say: '아직 실감이 안 나요', tier: 'meh', face: 'smile', answer: ['괜찮아요. 맥박 재 줄게요. 천천히 실감해요.', '저 안 도망가요. 날개는 옷장에 넣었으니까요.'] },
      ],
    },
  ],
  after: [
    '오늘은 여기까지! 쉬는 것도 처방이에요.',
    '또 왔어요? 아픈 데 없으면 물 한 잔 마시고 가요.',
    '누가 부르네요. 날아가 봐야 해요. 무리 금지예요~',
    '안 아파도 와도 돼요. 그래도 오늘은 일찍 자요. 약속이에요.',
    '저 지금 커피 두 잔째예요. 세 잔째 들면 말려 줘요.',
    '다음 환자분 오기 전에 십오 분만 쉴게요. {me} 씨 덕에 배웠어요.',
    '종 세 번이면 날아가요. 한 번이면… 그냥 인사하러 나갈게요.',
  ],
};
