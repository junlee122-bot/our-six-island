// 야니네코 — 청년 자취방의 고양이 귀 대학생. 나른하고 귀찮아하는 반말("…귀찮아",
// "~거든", "~야. 아마.", "꼬리 보지 마"), 표정 없는 단조로운 말투로 귀여움을
// 스스로 깎아 먹는다. 게으른 척하지만 머리가 좋고, 잔나에게 동네 소문을 흘려준다.
// 생선 요리·따뜻한 음료·볕 좋은 자리를 좋아하고, 아침 수업과 비 오는 날의
// 달팽이는 질색. 고양이 버릇(상자, 컵 밀기, 꾹꾹이, 모른 척하다 나타나기),
// 밤 편의점 컵라면. 담배는 불 없이 물고만 있다(멋있게 그리지 않는다).
// 원작 대사는 옮기지 않고 말투와 소재만 빌린다.
import type { NpcTalkBook } from './types.ts';

export const YANINEKO_TALK: NpcTalkBook = {
  npc: 'yanineko',
  memories: {
    'sun-spot': '볕 좋은 비밀 자리를 같이 쓰기로 했어요',
    'fish-lover': '생선은 구이가 최고라고 했어요',
    'warm-drink': '따뜻한 꽃차를 사 주겠다고 했어요',
    'night-owl': '밤이 더 좋다고 했어요',
    'gossip-ok': '소문을 먼저 듣는 사이가 됐어요',
    'gossip-no': '소문보다 본인 이야기가 좋다고 했어요',
    'box-fan': '빈 상자에 같이 들어가 봤어요',
    'thesis': '낮잠 논문 이야기를 들었어요',
    'morning-help': '아침 수업에 깨워 주기로 했어요',
    'cupramen': '밤 편의점 컵라면을 같이 먹기로 했어요',
    'ear-wait': '귀는 허락할 때까지 안 만지기로 했어요',
    'quit-try': '담배를 끊는 걸 응원하기로 했어요',
    'snail-guard': '비 오는 날 달팽이를 치워 주기로 했어요',
    'bench-nap': '광장 벤치에서 같이 볕을 쬐었어요',
    'fish-share': '생선구이를 반씩 나눠 먹었어요',
    'taste-heard': '내 취향을 기억해 줬어요',
    'outing-talk': '함께 걸은 날을 이야기했어요',
    'bday-plan': '생일 생선 이야기를 나눴어요',
    'date-talk': '방 데이트한 날을 이야기했어요',
  },
  talks: [
    {
      id: 'sun-spot',
      open: '{me}, 비밀 하나 알려 줄까. 동네에서 제일 따뜻한 볕 자리. …귀찮지만.',
      replies: [
        { say: '같이 쓰자. 둘만 알기', tier: 'great', remember: 'sun-spot', face: 'shy', answer: ['…둘만. 좋아. 대신 오후 세 시 이후엔 내 자리야.', '아, 반쪽은 줄게. 꼬리 보지 마.'] },
        { say: '어딘데? 궁금해', tier: 'good', remember: 'sun-spot', answer: '빵집 뒤 담벼락 아래. 오후엔 돌이 데워져. 아무한테도 말하지 마.' },
        { say: '볕은 다 똑같지 않아?', tier: 'meh', face: 'calm', answer: '…전혀 안 똑같아. 너 고양이 아니라서 모르는 거야. 불쌍하네.' },
      ],
    },
    {
      id: 'fish-way',
      open: '생선은 구이야, 회야, 탕이야. 이건 중요한 질문이야. 대답 잘해.',
      replies: [
        { say: '당연히 구이지', tier: 'great', remember: 'fish-lover', answer: '…너 좀 아는구나. 껍질 바삭한 거. 그거 하나면 하루가 살아.' },
        { say: '난 회가 좋아', tier: 'good', answer: '회도 좋아. 럭스가 썰어 주는 거면 더 좋고. 공짜라서.' },
        { say: '생선은 별로야', tier: 'meh', face: 'sorry', answer: '…그럼 네 몫은 내가 먹을게. 잘됐네. 서로 이득이야.' },
      ],
    },
    {
      id: 'warm-drink',
      open: '추운 날 따뜻한 거 한 잔 사 주는 사람, 그 사람 편이야. …싸지, 나.',
      replies: [
        { say: '그럼 꽃차 한 잔 살게', tier: 'great', remember: 'warm-drink', face: 'shy', answer: '…진짜? 꽃차는 반칙인데. 오늘부터 너 편이야. 취소 안 돼.' },
        { say: '나도 따뜻한 거 좋아', tier: 'good', answer: '그치. 손 시릴 때 컵 감싸는 게 제일 좋아. 마시는 건 그다음이야.' },
        { say: '난 찬 게 좋던데', tier: 'meh', face: 'calm', answer: '혀가 튼튼하구나. 난 고양이 혀라서 뜨거운 것도 식혀서 마셔.' },
      ],
    },
    {
      id: 'night-or-day',
      open: '너는 낮이 좋아, 밤이 좋아? 난 밤. 눈이 잘 보이거든. 장점은 그거 하나야.',
      replies: [
        { say: '나도 밤이 좋아', tier: 'great', remember: 'night-owl', answer: '…오. 같은 편이네. 밤산책 하다 마주치면 아는 척해 줄게. 가끔.' },
        { say: '낮에 볕 쬐는 것도 좋잖아', tier: 'good', answer: '그건 맞아. 낮엔 자고 밤엔 깨어 있고. 완벽한 하루지.' },
        { say: '밤엔 자야지', tier: 'meh', face: 'calm', answer: '건전하네. 나랑은 안 맞는 말이야. 그래도 잘 자.' },
      ],
    },
    {
      id: 'gossip',
      open: '오늘 들은 소문 있는데. 들을래? 잔나한텐 아직 안 팔았어.',
      replies: [
        { say: '나한테 먼저? 영광이다', tier: 'great', remember: 'gossip-ok', face: 'laugh', answer: ['큰 건 아니고, 빵집 오븐이 오늘 두 번 꺼졌대.', '…이거 잔나한테 팔면 커피 한 잔이야. 너한텐 공짜.'] },
        { say: '남 얘기보다 네 얘기 해', tier: 'good', remember: 'gossip-no', face: 'think', answer: '…나? 할 얘기 없는데. 잤어. 먹었어. 또 잤어. 끝.' },
        { say: '관심 없어', tier: 'meh', face: 'calm', answer: '그래. 그럼 잔나한테 팔러 간다. 손해 본 건 너야.' },
      ],
    },
    {
      id: 'box',
      open: '빈 상자 보면 들어가 보고 싶지 않아? …나만 그래? 이유는 묻지 마.',
      replies: [
        { say: '나도 들어가 볼래', tier: 'great', remember: 'box-fan', face: 'laugh', answer: '…좁은데. 뭐, 너면 괜찮아. 무릎 접어. 이게 상자의 예의야.' },
        { say: '좁지 않아?', tier: 'good', answer: '좁으니까 좋은 거야. 사방이 막혀 있으면 마음이 놓여. 설명은 귀찮아.' },
        { say: '그건 고양이 습관이잖아', tier: 'meh', face: 'calm', answer: '…그래서 뭐. 귀 달린 대학생도 상자는 좋아할 수 있어.' },
      ],
    },
    {
      id: 'thesis',
      open: '내 논문 주제 알아? 낮잠의 효율. 진지해. 제목만 있지만.',
      replies: [
        { say: '결론이 뭔데?', tier: 'great', remember: 'thesis', face: 'think', answer: ['결론은… 볕 아래서 자면 효율이 두 배야.', '근거는 내 경험. 표본은 하나. 교수님은 웃었어.'] },
        { say: '교수님이 허락했어?', tier: 'good', answer: '허락은 안 했는데 거절도 안 했어. 그럼 된 거지. 머리 좋지.' },
        { say: '그게 논문이야?', tier: 'meh', face: 'calm', answer: '…다들 그 말 해. 그래서 아직 제목밖에 없는 거야.' },
      ],
    },
    {
      id: 'morning-class',
      open: '아침 수업 또 빠졌어. 알람은 들었어. 몸이 반대했을 뿐이야.',
      replies: [
        { say: '내일은 내가 깨워 줄게', tier: 'great', remember: 'morning-help', face: 'shy', answer: '…진짜 올 거야? 문 두드리면 한 번은 무시할 거야. 두 번째엔 나갈게.' },
        { say: '오후 수업으로 바꿔', tier: 'good', answer: '그게 정답인데 그 수업이 아침에만 있어. 학교가 날 싫어해.' },
        { say: '그냥 게으른 거 아냐?', tier: 'meh', face: 'calm', answer: '…맞아. 근데 그걸 대놓고 말하는 건 반칙이야.' },
      ],
    },
    {
      id: 'cupramen',
      open: '밤 편의점에 신상 컵라면 나왔대. 이게 요즘 내 인생의 낙이야.',
      replies: [
        { say: '오늘 밤 같이 가자', tier: 'great', remember: 'cupramen', answer: '…좋아. 국물은 내가 먼저. 뜨거우니까 식힐 시간도 줘야 해.' },
        { say: '몸에 안 좋잖아', tier: 'good', face: 'think', answer: '알아. 그래서 생선 얻어먹는 날엔 안 먹어. 균형이야. 나름.' },
        { say: '라면 안 먹어', tier: 'meh', face: 'calm', answer: '부자구나. 자취생한테 라면은 주식이야. 이해 못 해도 돼.' },
      ],
    },
    {
      id: 'desk-cup',
      open: '책상 끝에 컵 있으면 손으로 밀고 싶어져. 이해해? 떨어뜨린 적은 없어. 아직.',
      replies: [
        { say: '떨어지기 전에 내가 치울게', tier: 'great', face: 'laugh', answer: '…똑똑하네. 그게 나랑 사이좋게 지내는 비결이야.' },
        { say: '왜 그러는 거야?', tier: 'good', face: 'think', answer: '몰라. 거기 있으니까. 산이 있어서 오르는 거랑 비슷해.' },
        { say: '그건 좀 민폐야', tier: 'meh', face: 'sorry', answer: '…알아. 그래서 참고 있잖아. 칭찬은 안 해 줘도 돼.' },
      ],
    },
    {
      id: 'snail',
      open: '비 오는 날 길에 달팽이 있잖아. 밟을까 봐 까치발로 걸어. 그게 제일 피곤해.',
      replies: [
        { say: '내가 앞에서 치워 줄게', tier: 'great', remember: 'snail-guard', face: 'shy', answer: '…너 은근 쓸모 있다. 아, 칭찬이야. 잘 안 하는 거야.' },
        { say: '그냥 다른 길로 가', tier: 'good', answer: '다른 길에도 있어. 비 오는 날 동네는 달팽이 거야. 난 집에 있을래.' },
        { say: '달팽이 귀엽지 않아?', tier: 'meh', face: 'calm', answer: '…귀여운 건 인정. 근데 미끈거려. 그게 싫은 거야.' },
      ],
    },
    {
      id: 'ears',
      when: { ch: 2 },
      open: '…뭘 그렇게 봐. 귀? 처음 보는 사람은 만지면 안 돼. 너는… 아직 생각 중.',
      replies: [
        { say: '허락할 때까지 안 만질게', tier: 'great', remember: 'ear-wait', face: 'shy', answer: '…그 말이 제일 귀찮지 않아. 오래 안 걸릴지도. 아마.' },
        { say: '솔직히 만져 보고 싶어', tier: 'good', face: 'laugh', answer: '솔직하네. 솔직한 건 점수 줄게. 만지는 건 아직 안 돼.' },
        { say: '진짜 귀야?', tier: 'meh', face: 'calm', answer: '…진짜야. 지금 너 쪽으로 돌아간 것도 진짜고. 보지 마.' },
      ],
    },
    {
      id: 'unlit',
      when: { ch: 3 },
      open: '요즘 담배에 불 안 붙여. 물고만 있어. 왜인지 알아? …몰라도 돼.',
      replies: [
        { say: '끊는 중이구나. 응원할게', tier: 'great', remember: 'quit-try', face: 'shy', answer: '…들켰네. 귀찮게 응원은. 그래도, 고마워. 진짜로.' },
        { say: '멋있어 보이려고?', tier: 'good', face: 'laugh', answer: '그런 건 기력이 남는 사람이 하는 거야. 난 그냥 입이 심심해서.' },
        { say: '그냥 버려', tier: 'meh', face: 'calm', answer: '…그게 쉬우면 진작 했지. 천천히 할게. 내 속도로.' },
      ],
    },
  ],
  openers: [
    {
      id: 'op-rain',
      when: { weather: ['rain', 'storm'] },
      open: '비다. 꼬리 젖었어. 오늘은 휴강이야. 내가 정했어.',
      replies: [
        { say: '처마 밑으로 같이 가자', tier: 'great', answer: '…응. 항구 창고 처마가 명당이야. 붙어 서. 넓진 않아.' },
        { say: '수건 빌려줄까?', tier: 'good', answer: '꼬리부터 닦을게. 귀는 내가 할 거야. 손대지 마.' },
        { say: '비 오는 날 좋은데', tier: 'meh', face: 'calm', answer: '…너는 꼬리가 없으니까 그런 말을 하지. 부럽다, 진짜로.' },
      ],
    },
    {
      id: 'op-snow',
      when: { weather: 'snow' },
      open: '눈… 발 시려. {me}, 네가 밟은 자리만 따라 밟을 거야. 앞장서.',
      replies: [
        { say: '천천히 걸을게', tier: 'great', answer: '…응. 보폭 줄여. 내 발 작아. 이런 날엔 네가 쓸모 있네.' },
        { say: '업어 줄까?', tier: 'good', face: 'shy', answer: '…그건 너무 귀엽잖아. 소문나. 잔나가 볼 거야. 그냥 걸을게.' },
        { say: '눈사람 만들자!', tier: 'meh', face: 'calm', answer: '만드는 건 귀찮아. 구경은 해 줄게. 코는 내가 떨어뜨릴 거고.' },
      ],
    },
    {
      id: 'op-night',
      when: { time: ['night', 'dawn'] },
      open: '밤이다. 눈이 잘 보여. {me}, 편의점 갈 건데. 우연이야. 같이 갈래?',
      replies: [
        { say: '컵라면은 내가 살게', tier: 'great', remember: 'cupramen', face: 'wow', answer: '…오늘 너 부자야? 두 개 골라도 돼? 이 정도면 사치야.' },
        { say: '같이 걷기만 할게', tier: 'good', answer: '그것도 좋아. 밤길은 내가 앞장설게. 눈 좋거든.' },
        { say: '난 졸려서 잘래', tier: 'meh', face: 'calm', answer: '그래. 잘 자. 나는 이제부터 하루 시작이야.' },
      ],
    },
    {
      id: 'op-festival',
      when: { festival: true },
      open: '축제라 시끄러워. 먹을 거 사서 구석에서 먹을 거야. …너도 올래?',
      replies: [
        { say: '구석 자리 좋아. 같이 가', tier: 'great', answer: '…알았어. 불꽃놀이는 방파제가 최고야. 비밀 자리. 너만 알려 줄게.' },
        { say: '꼬치 하나 사 줄게', tier: 'good', answer: '생선 꼬치면 받을게. 아니면 그냥 고마워만 할게.' },
        { say: '난 무대 앞이 좋아', tier: 'meh', face: 'calm', answer: '귀 아파. 다녀와. 나는 여기서 소리만 들을게.' },
      ],
    },
    {
      id: 'op-fish',
      when: { fish: true },
      open: '…{me}, 생선 냄새. 오늘 {fish}, 그거 잡았지? 코는 못 속여.',
      replies: [
        { say: '한 마리 줄게', tier: 'great', answer: '…진짜? 꼬리 흔들리는 거 보지 마. 오늘 컵라면은 쉰다.' },
        { say: '다음엔 같이 가자', tier: 'good', answer: '좋아. 너는 낚고, 나는 옆에서 자고. 분업이야.' },
        { say: '내가 다 먹을 거야', tier: 'meh', face: 'sorry', answer: '…그래. 냄새는 공짜니까 맡고만 있을게. 슬프다.' },
      ],
    },
    {
      id: 'op-bigfish',
      when: { bigFish: true },
      open: '소문 벌써 돌아. 오늘 엄청 큰 놈 낚았다며? 잔나가 받아 적고 있더라.',
      replies: [
        { say: '네가 퍼뜨렸지?', tier: 'great', face: 'laugh', answer: '…아니야. 반은 맞아. 대신 내 몫 한 토막만. 공정한 거래야.' },
        { say: '운이 좋았어', tier: 'good', answer: '운도 실력이야. 나는 낮잠 자리 찾는 운이 좋고. 너는 그쪽.' },
      ],
    },
    {
      id: 'op-harvest',
      when: { harvest: true },
      open: '흙냄새 나. 오늘 밭일했구나. 부지런하다. 나랑 정반대야.',
      replies: [
        { say: '이랑 사이 흙 따뜻해', tier: 'great', answer: '…알아? 그거 고양이만 아는 건 줄 알았는데. 잠깐 누워 봐도 돼?' },
        { say: '허리 아파 죽겠어', tier: 'good', answer: '이리 앉아. 볕 반쪽 줄게. 꾹꾹 눌러 줄 수도 있어. 습관이야.' },
        { say: '너도 좀 해 봐', tier: 'meh', face: 'calm', answer: '…응원은 할게. 누워서. 그게 내 최선이야.' },
      ],
    },
    {
      id: 'op-gold',
      when: { gold: true },
      open: '반짝… 눈부셔. {me}, 오늘 금별 나왔다며. 실눈 뜨고 보는 중이야.',
      replies: [
        { say: '제일 먼저 보여 주러 왔어', tier: 'great', face: 'shy', answer: '…나한테 먼저? 잔나보다? 이건 소문 안 낼게. 내 거야.' },
        { say: '운이 좋았나 봐', tier: 'good', answer: '정성 들인 사람한테 운도 오는 거야. 난 정성이 없어서 몰라.' },
      ],
    },
    {
      id: 'op-low',
      when: { mood: 'low' },
      open: '표정 안 좋다. 저기 볕 드는 데 같이 앉자. 말은 안 해도 돼.',
      replies: [
        { say: '…응. 잠깐만 앉을게', tier: 'great', face: 'smile', answer: ['…그래. 아무것도 안 해도 돼. 그게 내 전문이야.', '조용하면 볕 소리가 들려. 거짓말 아니야.'] },
        { say: '괜찮아, 별일 아니야', tier: 'good', answer: '그래. 그래도 따뜻한 거 한 잔 마시고 가. 오늘은 내가 살게. 싼 걸로.' },
      ],
    },
    {
      id: 'op-high',
      when: { mood: 'high' },
      open: '…{me}, 오늘 얼굴이 햇볕 같아. 눈부셔. 무슨 좋은 일 있어?',
      replies: [
        { say: '그냥 기분이 좋아', tier: 'great', face: 'smile', answer: '…그런 날이 제일 좋은 날이야. 이유 있는 날보다. 옆에 앉아.' },
        { say: '비밀이야', tier: 'good', face: 'think', answer: '흐음. 비밀이면 소문감인데. 오늘은 안 캘게. 귀찮으니까.' },
        { say: '네가 왜 궁금해?', tier: 'meh', face: 'calm', answer: '…안 궁금해. 그냥 물어봤어. 진짜로.' },
      ],
    },
    {
      id: 'op-wedding',
      when: { news: 'wedding' },
      open: '들었어? 오늘 광장에서 결혼식. 잔나보다 내가 먼저 알았어. 귀가 좋거든.',
      replies: [
        { say: '하객 음식은 뭐였어?', tier: 'great', face: 'laugh', answer: '…역시 너 날 알아. 생선전 있었어. 세 개 먹었어. 축하는 그걸로 했어.' },
        { say: '부럽다…', tier: 'good', face: 'smile', answer: '그래? …나는 아침 결혼식만 아니면 괜찮을 것 같아. 아, 그냥 혼잣말.' },
        { say: '시끄러웠겠다', tier: 'meh', face: 'calm', answer: '응. 귀 접고 지나갔어. 축하는 멀리서 했어.' },
      ],
    },
    {
      id: 'op-janna',
      when: { bond: 'janna' },
      open: '{other}, 만났어? 뭐 물어보지 않았어? 나한테서 들은 거 있냐고.',
      replies: [
        { say: '네 소문 물어보던데', tier: 'great', face: 'wow', answer: '…제보자가 소문이 되면 끝이야. 다음 커피는 두 잔 받아야겠다.' },
        { say: '아무 말도 안 했어', tier: 'good', answer: '잘했어. 너 입 무거운 거 마음에 들어. 기자 앞에선 그게 최고야.' },
        { say: '너 얘기 다 했어', tier: 'meh', face: 'sorry', answer: '…아. 이제 내 낮잠 자리 다 들켰겠다. 이사 가야 하나.' },
      ],
    },
    {
      id: 'op-lux',
      when: { bond: 'lux' },
      open: '{other}, 어시장에 있었지? 오늘 생선 한 토막 남겨 둔다고 했는데. 말 안 했어?',
      replies: [
        { say: '고양이 몫이라던데', tier: 'great', face: 'laugh', answer: '…고양이 취급이야. 근데 생선이면 싫지 않아. 지금 간다.' },
        { say: '바빠 보이던데', tier: 'good', answer: '그럼 좌판 끝나고 갈게. 그 시간엔 꼬리 토막이 남거든.' },
        { say: '생선 다 팔렸던데', tier: 'meh', face: 'sorry', answer: '…거짓말이지? 그렇다고 해 줘. 오늘 저녁이 걸렸어.' },
      ],
    },
    {
      id: 'op-himmel',
      when: { bond: 'himmel' },
      open: '{other}, 또 숨바꼭질 내기하재? 나는 이번에도 자고만 있을 건데.',
      replies: [
        { say: '그래서 매번 이기는 거구나', tier: 'great', face: 'laugh', answer: '…응. 아무도 자는 고양이를 못 찾아. 비법이야. 걔한텐 비밀.' },
        { say: '한 번 져 줘', tier: 'good', answer: '…귀찮은데. 뭐, 생선 걸면 생각해 볼게.' },
        { say: '그냥 이겨 줘서 고마워해', tier: 'meh', face: 'calm', answer: '고마울 일은 아니고. 그냥 졸렸을 뿐이야.' },
      ],
    },
    {
      id: 'op-beatrice',
      when: { bond: 'beatrice' },
      open: '…{other}, 만났어? 도서관에서 나 봤다고 안 했어? 오늘도 쫓겨났거든.',
      replies: [
        { say: '조용히만 자면 되잖아', tier: 'great', face: 'think', answer: '…골골 소리가 문제래. 그건 내 의지가 아니야. 억울해.' },
        { say: '이번 달 몇 번째야?', tier: 'good', face: 'laugh', answer: '세는 거 귀찮아서 안 세. 그쪽은 세더라. 기록 갱신이래.' },
        { say: '도서관은 공부하는 데야', tier: 'meh', face: 'calm', answer: '…알아. 공부하다 잔 거야. 순서는 맞잖아.' },
      ],
    },
    {
      id: 'op-nilah',
      when: { bond: 'nilah' },
      open: '{other}, 또 들길 달리기 하재지? 지는 쪽이 우유 한 통. 나 그거 좀 걸렸어.',
      replies: [
        { say: '이번엔 이길 수 있어', tier: 'great', answer: '…응원 고마워. 나는 지름길로 갈 거야. 들키면 무효지만.' },
        { say: '우유 한 통은 내가 살게', tier: 'good', face: 'wow', answer: '…너 지금 내 편 하는 거지? 데워서 줘. 그럼 영원히 네 편이야.' },
        { say: '넌 못 이겨', tier: 'meh', face: 'sorry', answer: '…알아. 걔 다리가 반칙이야. 그래도 말은 좀 돌려서 해.' },
      ],
    },
  ],
  callbacks: [
    {
      id: 'cb-fish',
      when: { mem: 'fish-lover' },
      use: 'fish-lover',
      open: '구이가 최고라고 했지. 오늘 럭스한테 얻은 거, 한 토막 구워 왔어. 반만.',
      replies: [
        { say: '반이나? 고마워', tier: 'great', face: 'shy', answer: '…반은 큰 거야. 나한테는. 껍질은 내 거고.' },
        { say: '기억하고 있었어?', tier: 'good', answer: '생선 얘기는 안 잊어. 다른 건 다 잊어도.' },
      ],
    },
    {
      id: 'cb-warm',
      when: { mem: 'warm-drink' },
      use: 'warm-drink',
      open: '…{me}, 꽃차 사 준다고 한 거. 잊은 거 아니지? 나는 안 잊었어.',
      replies: [
        { say: '지금 사러 가자', tier: 'great', face: 'laugh', answer: '…좋아. 식혀서 마실 테니까 천천히 걸어도 돼. 같이.' },
        { say: '다음 주에 살게', tier: 'good', answer: '알았어. 그때까지 네 편 유지할게. 이자는 안 붙여.' },
      ],
    },
    {
      id: 'cb-gossip',
      when: { mem: 'gossip-ok' },
      use: 'gossip-ok',
      open: '오늘 소문, 너한테 먼저야. 우리 그렇게 하기로 했잖아. …잔나한텐 비밀.',
      replies: [
        { say: '뭔데? 빨리 말해 줘', tier: 'great', face: 'laugh', answer: '힘멜이 거울 앞에서 인사 연습하더라. …웃지 마. 아, 웃어도 돼.' },
        { say: '착한 소문이면 좋겠다', tier: 'good', answer: '착한 거야. 빵집에서 오늘 덤을 두 개 준대. 가 봐.' },
      ],
    },
    {
      id: 'cb-morning',
      when: { mem: 'morning-help' },
      use: 'morning-help',
      open: '…{me}, 오늘 아침 문 두드린 거 너지. 두 번째에 나갔어. 수업도 갔어.',
      replies: [
        { say: '대단해! 칭찬해 줄게', tier: 'great', face: 'shy', answer: '…칭찬은 짧게. 길면 쑥스러워. 아, 지금 그 정도면 괜찮아.' },
        { say: '수업은 들었어?', tier: 'good', face: 'think', answer: '…출석은 했어. 듣는 건 다음 단계야. 하나씩 해.' },
      ],
    },
    {
      id: 'cb-box',
      when: { mem: 'box-fan' },
      use: 'box-fan',
      open: '그때 상자 같이 들어간 거. 그 상자, 아직 자취방에 있어. 버릴 수가 없어서.',
      replies: [
        { say: '또 들어가자', tier: 'great', face: 'laugh', answer: '…좁다고 투덜거리지 마. 그것도 상자의 맛이야.' },
        { say: '그냥 상자잖아', tier: 'good', answer: '그냥 상자 아니야. 둘이 들어간 상자야. 다르거든.' },
      ],
    },
    {
      id: 'cb-taste',
      when: { mem: '@taste', noMem: 'taste-heard' },
      open: '{me}, 좋아하는 게 {taste}, 그거라며. 소문으로 들었어. 내가 캔 거 아니야.',
      replies: [
        { say: '그것까지 알아?', tier: 'great', face: 'laugh', remember: 'taste-heard', answer: '귀가 좋거든. 네 거는 잔나한테 안 팔았어. 그건 내 거라서.' },
        { say: '너도 좋아해?', tier: 'good', remember: 'taste-heard', answer: '…생선만큼은 아니지만. 네가 좋아하면 좀 좋아질 수도.' },
      ],
    },
    {
      id: 'cb-outing',
      when: { mem: '@outing', noMem: 'outing-talk' },
      open: '저번에 같이 걸은 거. 다리는 아팠는데 덜 귀찮았어. 이상하지.',
      replies: [
        { say: '또 같이 걷자', tier: 'great', face: 'shy', remember: 'outing-talk', answer: '…응. 볕 좋은 데서 쉬어 가는 조건으로. 그건 양보 못 해.' },
        { say: '너 중간에 졸았잖아', tier: 'good', face: 'laugh', remember: 'outing-talk', answer: '눈만 감았어. 귀는 깨어 있었어. 다 들었어. 네 혼잣말도.' },
      ],
    },
    {
      id: 'cb-bday',
      when: { mem: '@bday-soon', noMem: 'bday-plan' },
      open: '{me}, 곧 생일이라며. 소문 들었어. …생선 큰 거 사 줄게. 통장이 허락하면.',
      replies: [
        { say: '마음만으로도 충분해', tier: 'great', face: 'smile', remember: 'bday-plan', answer: '…그럼 마음에 생선 하나 얹을게. 그게 내 방식이야.' },
        { say: '생선구이로 부탁해', tier: 'good', remember: 'bday-plan', answer: '알았어. 럭스한테 미리 말해 둘게. 제일 통통한 걸로.' },
      ],
    },
    {
      id: 'cb-date',
      when: { mem: '@date', noMem: 'date-talk' },
      open: '…너희 방 창가, 볕 잘 들더라. 그날 거기서 잔 거 아니야. 눈만 감은 거야.',
      replies: [
        { say: '또 놀러 와. 창가 비워 둘게', tier: 'great', face: 'shy', remember: 'date-talk', answer: '…응. 꾹꾹이는 덤이야. 이불 조심해.' },
        { say: '코 골던데?', tier: 'good', face: 'laugh', remember: 'date-talk', answer: '골골이야. 코 고는 거랑 달라. 기분 좋을 때 나는 거야. …아.' },
      ],
    },
  ],
  chapters: [
    {
      title: '볕 자리 반쪽',
      hint: '한 번 이야기를 나누면 야니네코가 벤치 반쪽을 내줘요.',
      need: { days: 1 },
      scene: [
        '야니네코가 벤치에 길게 누워 있다. 한쪽 귀만 움찔한다.',
        '"…누구야. 아, {me}. 새로 왔다는 사람."',
        '그녀가 귀찮다는 듯 몸을 반쯤 접는다. 벤치 반쪽이 빈다.',
        '"앉든가. 말은 조금만 하고. 볕이 놀라."',
      ],
      replies: [
        { say: '고마워. 조용히 앉을게', tier: 'great', face: 'smile', answer: '…좋아. 너 첫인상 괜찮다. 소문으로 내 줄게. 좋은 쪽으로.' },
        { say: '볕이 놀란다고?', tier: 'good', face: 'think', answer: '시끄러우면 구름이 와. 내 경험이야. 과학은 아니고.' },
        { say: '서서 있을게', tier: 'meh', face: 'calm', answer: '…그래. 다리 아프면 앉아. 자리는 안 도망가.' },
      ],
    },
    {
      title: '광장 벤치의 오후',
      hint: '오후(게임 시각 낮 한 시부터 다섯 시) 마을 광장에 가 보세요. 벤치 끝이 볕 명당이래요.',
      need: { days: 3, points: 20, visit: { area: 'village', from: 13, to: 17 } },
      scene: [
        '광장 벤치 오른쪽 끝. 야니네코가 눈을 반쯤 감고 앉아 있다.',
        '"왔네. 진짜 올 줄은 몰랐어. 귀찮을 텐데."',
        '"여기가 이 시간에 제일 따뜻해. 해가 시계탑을 넘어오거든."',
        '그녀가 꼬리로 옆자리를 툭툭 친다.',
        '"…같이 쬐면 두 배로 따뜻할까 해서. 실험이야. 논문용."',
      ],
      replies: [
        { say: '실험 결과는 어때?', tier: 'great', remember: 'bench-nap', face: 'shy', answer: '…두 배까진 아니고. 한 배 반. 아니, 그냥 따뜻해. 결론 끝.' },
        { say: '같이 졸자', tier: 'good', remember: 'bench-nap', face: 'smile', answer: '좋아. 먼저 자는 사람이 이기는 거야. …벌써 졌어. 너 빠르다.' },
        { say: '눈부셔서 그늘로 갈래', tier: 'meh', remember: 'bench-nap', face: 'calm', answer: '…그래. 그늘도 나쁘진 않아. 나는 여기 있을게.' },
      ],
    },
    {
      title: '생선구이 반 토막',
      hint: '야니네코가 껍질 바삭한 생선구이 이야기를 했어요. 생선구이 하나를 들고 찾아가 보세요.',
      need: { days: 6, points: 40, bring: { item: 'grilledfish', take: true } },
      scene: [
        '생선구이를 내밀자 야니네코의 귀가 쫑긋 선다. 꼬리가 멋대로 흔들린다.',
        '"…꼬리 보지 마. 이건 반사야."',
        '그녀가 생선을 정확히 반으로 가른다. 껍질 쪽이 조금 더 크다.',
        '"자. 반. 나는 원래 안 나눠. 럭스한테도 안 나눠."',
        '"…근데 혼자 먹으면 맛이 덜하더라. 요즘 알았어."',
      ],
      replies: [
        { say: '껍질 큰 쪽은 네가 먹어', tier: 'great', remember: 'fish-share', face: 'shy', answer: '…너 진짜 날 너무 잘 알아. 무섭다. 고마워. 진짜로.' },
        { say: '같이 먹으니까 맛있다', tier: 'good', remember: 'fish-share', face: 'smile', answer: '그치. 이유는 몰라. 논문 주제 바꿀까 봐.' },
        { say: '난 배불러', tier: 'meh', remember: 'fish-share', face: 'calm', answer: '…그럼 내가 다 먹을게. 아깝잖아. 다음엔 배고플 때 와.' },
      ],
    },
    {
      title: '아무도 모르는 자리',
      hint: '야니네코와 볕 좋은 비밀 자리를 같이 쓰기로 하면 다음 이야기가 열려요.',
      need: { days: 9, points: 60, mem: 'sun-spot' },
      scene: [
        '빵집 뒤 담벼락 아래. 오후의 돌이 따뜻하다.',
        '"여기, 진짜 아무도 몰라. 잔나도. 베아트리스도. 힘멜은 당연히."',
        '"소문 장사하는 고양이가 소문 안 낸 유일한 거야."',
        '그녀가 담벼락에 등을 기대고 눈을 감는다.',
        '"…너한테 알려 준 건 실수 아니야. 일부러야. 알아 둬."',
      ],
      replies: [
        { say: '나도 아무한테도 안 말해', tier: 'great', face: 'shy', answer: '…알아. 그러니까 알려 준 거야. 이제 여긴 둘의 자리야.' },
        { say: '왜 나한테 알려 줬어?', tier: 'good', face: 'think', answer: '…귀찮은 질문이네. 대답은 다음에. 지금은 볕이 아까워.' },
        { say: '좀 좁다', tier: 'meh', face: 'calm', answer: '좁으니까 붙어 앉는 거야. 상자랑 같은 원리. 몰랐어?' },
      ],
    },
    {
      title: '소문이 안 된 이야기',
      hint: '야니네코와 아주 가까워지면 그녀가 소문으로 안 판 이야기를 꺼내요. 그 뒤엔 꽃다발도 받아 줄지 몰라요.',
      need: { days: 13, points: 96 },
      scene: [
        '밤 편의점 앞 의자. 컵라면 두 개에서 김이 오른다.',
        '"{me}. 나 요즘 잔나한테 소문 하나를 안 팔아. 제일 비싼 건데."',
        '"누가 누구를 좋아한다는 소문. …내 거라서 못 팔아."',
        '그녀가 젓가락으로 면만 휘휘 젓는다. 귀가 붉다.',
        '"꽃 같은 건 귀찮은데… 생선 가게 옆 꽃이면, 받을지도 몰라."',
      ],
      replies: [
        { say: '그 소문, 나도 알 것 같아', tier: 'great', face: 'shy', answer: '…알면 됐어. 말로 하는 건 귀찮으니까. 꼬리 보지 마. 진짜로.' },
        { say: '누구 얘긴데?', tier: 'good', face: 'laugh', answer: '…너 머리 나쁜 척하는 거지. 나랑 똑같네. 라면 불어.' },
        { say: '라면 다 먹었어?', tier: 'meh', face: 'calm', answer: '…응. 다 먹었어. 너는 이야기를 안 먹었네. 다음에 다시 줄게.' },
      ],
    },
    {
      title: '평생 볕 자리',
      hint: '야니네코와 연인이 되면 마지막 이야기가 열려요.',
      need: { days: 16, love: 'dating' },
      scene: [
        '아침이다. 야니네코가 먼저 와 있다. 눈은 반쯤 감겨 있지만.',
        '"…놀라지 마. 아침에 일어났어. 너 때문에. 대단하지."',
        '"생각해 봤는데, 제일 좋은 볕 자리는 담벼락 아래가 아니었어."',
        '"네 옆이었어. 그러니까… 평생 쓸 수 있으면 좋겠어."',
        '"반지 같은 건 귀찮은 건데… 네가 주면, 안 귀찮을 것 같아."',
      ],
      replies: [
        { say: '평생 반쪽은 네 거야', tier: 'great', face: 'shy', answer: '…반쪽 말고 다. 아, 반은 너도 써. 꼬리 보지 마. 흔들려.' },
        { say: '아침에 일어난 게 더 놀라워', tier: 'good', face: 'laugh', answer: '…그치. 기적이야. 이걸로 내 사랑 증명 끝이야. 다시는 안 해.' },
        { say: '조금만 더 천천히', tier: 'meh', face: 'smile', answer: '좋아. 천천히가 내 전문이야. 볕은 내일도 들어.' },
      ],
    },
  ],
  after: [
    '오늘 말 많이 했다. 이제 좀 잘게. 깨우지 마.',
    '…또 왔어? 볕 자리 반쪽은 아직 비어 있어.',
    '내일 또 와. 아니면 모레. 아무 때나. 나는 여기 있어.',
    '소문은 내일 줄게. 오늘 거는 다 떨어졌어.',
  ],
};
