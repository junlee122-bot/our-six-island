export const ACTORS=['도원','강재','민서','승준','민재','재민','호현'] as const;
export const ACTOR_COLORS=['#d98692','#ccaa7b','#86adb0','#8aaacb','#adad83','#c99773','#b4a0d0'];
export const HAIRS=[{id:'ink',name:'먹빛',hex:'#292b31'},{id:'wine',name:'와인',hex:'#943d50'},{id:'brown',name:'밤색',hex:'#745044'},{id:'honey',name:'꿀빛',hex:'#c39754'},{id:'rose',name:'로즈',hex:'#d07a95'},{id:'blue',name:'블루',hex:'#4e7998'},{id:'silver',name:'은빛',hex:'#b7bcc9'},{id:'forest',name:'숲빛',hex:'#527967'}];
export const CLOTHES=[
 {id:'tee',name:'주인공의 흰 티',slot:'top',cell:0,tag:'일상'},
 {id:'hoodie',name:'느긋한 후드',slot:'top',cell:1,tag:'느긋'},
 {id:'suit',name:'오늘은 면접',slot:'top',cell:2,tag:'진지'},
 {id:'detective',name:'명탐정 코트',slot:'top',cell:3,tag:'추리'},
 {id:'chef',name:'셰프의 등장',slot:'top',cell:4,tag:'요리'},
 {id:'pajamas',name:'아직 꿈속',slot:'top',cell:5,tag:'꿈결'},
 {id:'denim',name:'청춘 데님',slot:'top',cell:6,tag:'모험'},
 {id:'cardigan',name:'빨간 가디건',slot:'top',cell:7,tag:'다정'},
 {id:'trousers',name:'차콜 팬츠',slot:'bottom',cell:8,tag:'단정'},
 {id:'shorts',name:'데님 반바지',slot:'bottom',cell:9,tag:'가벼움'},
 {id:'skirt',name:'플리츠 스커트',slot:'bottom',cell:10,tag:'산뜻'},
 {id:'sleep-pants',name:'파자마 팬츠',slot:'bottom',cell:11,tag:'편안'},
 {id:'sneakers',name:'크림 스니커즈',slot:'shoes',cell:12,tag:'기본'},
 {id:'boots',name:'브라운 부츠',slot:'shoes',cell:13,tag:'든든'},
 {id:'canvas',name:'레드 캔버스',slot:'shoes',cell:14,tag:'발랄'},
 {id:'slippers',name:'노란 슬리퍼',slot:'shoes',cell:15,tag:'느긋'},
] as const;
export type Slot='top'|'bottom'|'shoes';
export type Costume={top:string;bottom:string;shoes:string;hair:string;hat:string;glasses:string;clip:boolean};
export type Pose='idle'|'sway'|'bow'|'cheer';
export const HATS=[{id:'none',name:'벗기',cell:-1},{id:'cap',name:'갈색 캡',cell:0},{id:'straw',name:'밀짚모자',cell:1},{id:'bucket',name:'버킷햇',cell:2},{id:'beanie',name:'비니',cell:3}];
export const GLASSES=[{id:'none',name:'벗기',cell:-1},{id:'round',name:'둥근 안경',cell:4},{id:'silver',name:'은테 안경',cell:5},{id:'sun',name:'선글라스',cell:6}];
export const defaultCostume=(id:number):Costume=>({top:id===6?'denim':id===2?'cardigan':'tee',bottom:id===3||id===4?'trousers':'shorts',shoes:'sneakers',hair:id===0?'wine':'ink',hat:id===5?'cap':'none',glasses:id===1||id===4?'round':id===2?'silver':'none',clip:false});
export function readCostume(value:unknown,id=0):Costume{const base=defaultCostume(id),v=(value&&typeof value==='object'?value:{}) as Partial<Costume>;const slot=(s:Slot)=>CLOTHES.some(c=>c.slot===s&&c.id===v[s])?v[s]!:base[s];return {top:slot('top'),bottom:slot('bottom'),shoes:slot('shoes'),hair:HAIRS.some(c=>c.id===v.hair)?v.hair!:base.hair,hat:HATS.some(c=>c.id===v.hat)?v.hat!:base.hat,glasses:GLASSES.some(c=>c.id===v.glasses)?v.glasses!:base.glasses,clip:v.clip===true};}
export type Episode={id:string;name:string;subtitle:string;label:string;accent:string;intro:string;beats:{question:string;options:[string,string]}[];endings:string[]};
export const EPISODES:Episode[]=[
 {id:'trip',name:'출발 10분 전',subtitle:'가방은 일곱 개. 준비된 사람은…?',label:'우정 소동극',accent:'#eeb557',intro:'호현지방 역 앞. 출발까지 10분, 표는 있는데 친구들이 영 수상하다.',beats:[{question:'한 친구가 가방 대신 커다란 베개를 가져왔다.',options:['일단 이유를 물어본다','나도 기대서 쉬어 본다']},{question:'일곱 번째 가방에서 이상한 소리가 난다.',options:['다 같이 열어 본다','가방에게 직접 말을 건다']},{question:'기차 안내 방송이 시작됐다!',options:['힘을 합쳐 전력 질주','오늘의 단체 포즈부터!']}],endings:['출발은 완벽, 짐은 뒤죽박죽','베개와 함께하는 급행열차','말하는 가방의 첫 여행','역 앞에서 이미 시작된 여행','우리의 목적지는 단체 사진','기차보다 빠른 우정','가방도 친구로 인정합니다','여행 0km, 추억은 만땅']},
 {id:'interview',name:'수상한 면접',subtitle:'여기는 무슨 회사였더라?',label:'즉흥 코미디',accent:'#9fb6e1',intro:'호현지방의 작은 사무실. 면접관도 지원자도 오늘이 첫 출근이다.',beats:[{question:'첫 질문. “본인의 가장 큰 장점은요?”',options:['입은 옷부터 소개한다','솔직하게 배고프다고 한다']},{question:'면접관이 갑자기 자리를 바꾸자고 한다.',options:['내가 면접관을 맡는다','둘이 함께 면접을 본다']},{question:'마지막 과제는 회사 이름 짓기다.',options:['친구들 이름을 합친다','일단 간식부터 먹는다']}],endings:['전원 합격, 사장님은 공석','오늘부터 우리가 회사','최종 면접은 간식 시간','주식회사 대충 잘될 거야','복지 1위: 친구가 동료','일단 출근은 내일부터','면접관도 합격했습니다','호현지방에서 제일 편한 회사']},
 {id:'night',name:'편의점 야간 근무',subtitle:'새벽 두 시, 마지막 손님의 주문.',label:'한밤의 소동',accent:'#bca3d9',intro:'호현지방 골목 편의점. 조용한 야간 근무가 될 줄 알았는데 문이 열렸다.',beats:[{question:'손님이 “추억 한 봉지 주세요”라고 주문했다.',options:['가장 오래된 과자를 찾는다','우리의 첫 만남을 들려준다']},{question:'계산대가 갑자기 노래를 부르기 시작한다.',options:['진지하게 박자를 맞춘다','마이크처럼 영수증을 든다']},{question:'해가 뜬다. 교대 직원도 우리의 친구다.',options:['함께 아침을 먹는다','오늘의 일을 공연으로 만든다']}],endings:['추억은 1+1 행사 중','새벽 두 시의 작은 콘서트','영수증보다 긴 우리 이야기','밤샘 근무, 웃음은 무제한','야식으로 맺어진 우정','골목에서 가장 작은 극장','일곱 명의 첫 아침','어서 오세요, 우리의 편의점']},
];
export type Run={id:string;episode:string;cast:number[];step:number;choices:number[];costumes:Costume[];created:number};
export type RecordEpisode=Run&{ending:string};
export type Look={id:string;actor:number;name:string;costume:Costume};
export type TheaterSave={v:1;selected:number;costumes:Costume[];looks:Look[];records:RecordEpisode[];favorites:string[]};
export const SAVE_KEY='hohyeon-theater-v1';
export const freshTheater=():TheaterSave=>({v:1,selected:6,costumes:ACTORS.map((_,i)=>defaultCostume(i)),looks:[],records:[],favorites:[]});
export const outfitTitle=(c:Costume)=>CLOTHES.find(i=>i.id===c.top)?.name??'오늘의 주인공';
export function readRun(v:unknown):Run|null{if(!v||typeof v!=='object')return null;const r=v as Run;if(typeof r.id!=='string'||r.id.length>80||!EPISODES.some(e=>e.id===r.episode)||!Array.isArray(r.cast)||r.cast.length!==3||new Set(r.cast).size!==3||!r.cast.every(i=>Number.isInteger(i)&&i>=0&&i<7)||!Number.isInteger(r.step)||r.step<0||r.step>3||!Array.isArray(r.choices)||r.choices.length!==r.step||!r.choices.every(i=>i===0||i===1)||!Array.isArray(r.costumes)||r.costumes.length!==7||!Number.isFinite(r.created))return null;return {id:r.id,episode:r.episode,cast:[...r.cast],step:r.step,choices:[...r.choices],costumes:r.costumes.map(readCostume),created:r.created};}
export const endingFor=(run:Run)=>EPISODES.find(e=>e.id===run.episode)!.endings[run.choices.reduce((n,c,i)=>n+c*2**i,0)];
export function loadTheater(raw:string|null):TheaterSave{try{const v=JSON.parse(raw??'null');if(!v||v.v!==1)return freshTheater();return {v:1,selected:Number.isInteger(v.selected)&&v.selected>=0&&v.selected<7?v.selected:6,costumes:ACTORS.map((_,i)=>readCostume(v.costumes?.[i],i)),looks:Array.isArray(v.looks)?v.looks.slice(0,28).filter((l:Look)=>l&&typeof l.id==='string'&&typeof l.name==='string'&&Number.isInteger(l.actor)&&l.actor>=0&&l.actor<7).map((l:Look)=>({...l,name:l.name.slice(0,24),costume:readCostume(l.costume,l.actor)})):[],records:Array.isArray(v.records)?v.records.map(readRun).filter((r:Run|null):r is Run=>!!r&&r.step===3).slice(0,24).map((r:Run)=>({...r,ending:endingFor(r)})):[],favorites:Array.isArray(v.favorites)?v.favorites.filter((id:unknown)=>CLOTHES.some(c=>c.id===id)):[]};}catch{return freshTheater();}}
export function newRun(episode:string,lead:number,costumes:Costume[]):Run{return {id:crypto.randomUUID(),episode,cast:[lead,(lead+1)%7,(lead+3)%7],step:0,choices:[],costumes:costumes.map((c,i)=>readCostume(c,i)),created:Date.now()};}
export function advanceRun(run:Run,choice:number):Run{if(run.step>=3||![0,1].includes(choice))return run;return {...run,step:run.step+1,choices:[...run.choices,choice]};}
export function costumeLine(run:Run){const actor=run.cast[Math.min(2,run.step)],c=run.costumes[actor];const lines:Record<string,string>={tee:'평범하게 시작하려고 했는데, 이미 늦은 것 같아.',hoodie:'잠깐만. 주머니 속에 해결책이 있을지도 몰라.',suit:'자, 침착하게. 오늘만큼은 내가 아주 진지하거든.',detective:'이 장면에는 단서가 있어. 내 코트가 그렇게 말하고 있어.',chef:'무슨 일이든 일단 배부터 채우고 생각하자.',pajamas:'이거 아직 꿈이지? 그렇다면 조금 더 자도 되겠네.',denim:'좋아, 일단 해 보자. 재밌는 일은 늘 갑자기 생기니까.',cardigan:'괜찮아. 우리가 같이 있으면 어떻게든 되겠지.'};return lines[c.top];}
export function resultLine(run:Run){if(!run.step)return '';const c=run.choices[run.step-1],name=ACTORS[run.cast[run.step-1]];const replies=run.episode==='trip'?['베개는 비상용 구름이었다. 모두 잠깐 납득했다.','가방 속에서 휴대폰 알람 일곱 개가 동시에 울렸다.','짐보다 먼저 웃음이 출발했다.']:run.episode==='interview'?['자기소개만으로 벌써 팀이 완성된 느낌이다.','서로 질문하다 보니 점심 메뉴만 정해졌다.','회사 이름보다 중요한 건 함께 일하는 친구였다.']:['추억은 생각보다 바삭하고 조금 달았다.','음치는 없었다. 박자가 일곱 개였을 뿐.','긴 밤이 끝나고 새로운 이야기가 시작됐다.'];return `${name}${c===0?'의 결단':'의 엉뚱한 한마디'}! ${replies[run.step-1]}`;}
