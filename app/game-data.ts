export type Resource = 'apple'|'flower'|'wood'|'shell'|'fish';
export type Point = {x:number;y:number};
export const ITEMS: Record<Resource,{name:string;emoji:string;price:number}>={apple:{name:'사과',emoji:'🍎',price:4},flower:{name:'들꽃',emoji:'🌼',price:4},wood:{name:'나뭇가지',emoji:'🪵',price:3},shell:{name:'조개',emoji:'🐚',price:6},fish:{name:'물고기',emoji:'🐟',price:12}};
export const FRIENDS=[
 {name:'도원',look:'붉은 단발 · 검정 티',color:'#ebafae',x:650,y:565,greeting:'왔구나! 우리 여섯이 모이니까 여기가 진짜 우리 섬 같아.'},
 {name:'강재',look:'어깨 길이 머리 · 둥근 안경',color:'#e4bc8c',x:925,y:670,greeting:'오늘은 천천히 걸어 보자. 파도 소리도 꽤 괜찮거든.'},
 {name:'민서',look:'긴 머리 · 크림색 셔츠',color:'#a7c9cd',x:485,y:535,greeting:'길가에 핀 꽃 봤어? 소풍 자리에 조금 놓으면 예쁘겠다.'},
 {name:'승준',look:'짧은 검정 머리 · 흰 셔츠',color:'#a7c4df',x:1030,y:500,greeting:'서두를 일은 없어. 오늘 할 일은 즐겁게 노는 거니까!'},
 {name:'민재',look:'가르마 단발 · 안경',color:'#b7b797',x:660,y:410,greeting:'우리가 좋아하는 것들로 이 섬을 채워 가자.'},
 {name:'재민',look:'갈색 모자 · 검정 티',color:'#d5b095',x:1110,y:380,greeting:'여섯 명이 다 모이면 소풍 가자. 내가 자리는 봐 뒀어!'},
];
export const REQUESTS:{item:Resource;count:number;title:string;text:string}[]=[
 {item:'apple',count:2,title:'소풍 간식',text:'아삭한 사과 두 개만 부탁해. 다 같이 나눠 먹자!'},
 {item:'flower',count:2,title:'꽃 한 다발',text:'들꽃 두 송이를 모아 줄래? 소풍 자리에 놓고 싶어.'},
 {item:'wood',count:3,title:'작은 식탁',text:'나뭇가지 세 개면 작은 식탁을 만들 수 있겠어.'},
 {item:'shell',count:2,title:'바다의 선물',text:'예쁜 조개 두 개로 우리 소풍 자리를 장식하자.'},
 {item:'fish',count:1,title:'오늘의 요리',text:'물고기 한 마리만 잡아 줄래? 맛있는 요리를 준비할게.'},
];
export const DECOR=[{id:'plant',name:'꽃 화분',emoji:'🪴',price:24},{id:'chair',name:'소풍 의자',emoji:'🪑',price:32},{id:'lamp',name:'별빛 조명',emoji:'🏮',price:40},{id:'tent',name:'작은 텐트',emoji:'⛺',price:60}];
export type Node = Point & {id:string;kind:Resource};
export const NODES:Node[]=[
 ...[[360,535],[425,550],[365,610],[465,615]].map(([x,y],i)=>({x,y,id:`a${i}`,kind:'apple' as Resource})),
 ...[[420,710],[470,750],[350,735],[525,710]].map(([x,y],i)=>({x,y,id:`f${i}`,kind:'flower' as Resource})),
 ...[[580,530],[970,545],[960,660],[650,700]].map(([x,y],i)=>({x,y,id:`w${i}`,kind:'wood' as Resource})),
 ...[[580,845],[715,895],[970,840],[1160,775]].map(([x,y],i)=>({x,y,id:`s${i}`,kind:'shell' as Resource})),
];
export const SPOTS=[{id:'shop',x:1250,y:380,name:'도토리 상점',emoji:'🛒'},{id:'fish',x:1375,y:625,name:'낚시터',emoji:'🎣'},{id:'home',x:515,y:350,name:'우리 집',emoji:'🏡'},{id:'picnic',x:810,y:770,name:'소풍 자리',emoji:'🧺'}];
export type Save = {version:1;character:number;names:string[];coins:number;bag:Record<Resource,number>;picked:Record<string,number>;talked:number[];accepted:number[];done:number[];hearts:number[];decor:string[];placed:{id:string;kind:string;x:number;y:number}[];harvested:number;fishCaught:number;picnic:boolean;dayReward:boolean;position:Point};
export function freshSave(character=0):Save{return {version:1,character,names:FRIENDS.map(f=>f.name),coins:30,bag:{apple:0,flower:0,wood:0,shell:0,fish:0},picked:{},talked:[],accepted:[],done:[],hearts:[0,0,0,0,0,0],decor:[],placed:[],harvested:0,fishCaught:0,picnic:false,dayReward:false,position:{x:800,y:590}};}
export function requestFor(character:number,npc:number){const ids=FRIENDS.map((_,i)=>i).filter(i=>i!==character);return REQUESTS[ids.indexOf(npc)]??REQUESTS[0];}
export function hydrate(raw:string|null):Save|null{try{if(!raw)return null;const s=JSON.parse(raw);if(s.version!==1||!Number.isInteger(s.character)||s.character<0||s.character>5)return null;const d=freshSave(s.character);const finite=(v:unknown,max=999999)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;d.coins=finite(s.coins);for(const k of Object.keys(ITEMS) as Resource[])d.bag[k]=finite(s.bag?.[k]);const previousNames=['체리','모카','구름','소금','밤이','도토'];d.names=FRIENDS.map((f,i)=>s.names?.[i]===previousNames[i]?f.name:typeof s.names?.[i]==='string'&&s.names[i].trim()?s.names[i].slice(0,12):f.name);for(const k of ['talked','accepted','done'] as const)d[k]=Array.isArray(s[k])?[...new Set<number>(s[k].filter((v:unknown)=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<6&&v!==d.character))]:[];d.hearts=FRIENDS.map((_,i)=>finite(s.hearts?.[i],5));d.picked=Object.fromEntries(NODES.map(n=>[n.id,finite(s.picked?.[n.id],Date.now())]));d.decor=Array.isArray(s.decor)?s.decor.filter((id:string)=>DECOR.some(x=>x.id===id)).slice(0,50):[];d.placed=Array.isArray(s.placed)?s.placed.filter((p:Save['placed'][number])=>p&&DECOR.some(x=>x.id===p.kind)&&typeof p.id==='string'&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1600&&p.y>=0&&p.y<=1067).slice(0,50):[];d.harvested=finite(s.harvested);d.fishCaught=finite(s.fishCaught);d.picnic=s.picnic===true;d.dayReward=s.dayReward===true;if(s.position&&Number.isFinite(s.position.x)&&Number.isFinite(s.position.y)&&s.position.x>300&&s.position.x<1400&&s.position.y>300&&s.position.y<920&&walkable(s.position))d.position=s.position;return d;}catch{return null}}
export function handIn(s:Save,npc:number):Save|null{if(npc===s.character||s.done.includes(npc)||!s.accepted.includes(npc))return null;const q=requestFor(s.character,npc);if(s.bag[q.item]<q.count)return null;return {...s,coins:s.coins+25,bag:{...s.bag,[q.item]:s.bag[q.item]-q.count},done:[...s.done,npc],hearts:s.hearts.map((h,i)=>i===npc?Math.min(5,h+2):h)};}
export function buy(s:Save,id:string):Save|null{const d=DECOR.find(x=>x.id===id);if(!d||s.coins<d.price||s.decor.length+s.placed.length>=50)return null;return {...s,coins:s.coins-d.price,decor:[...s.decor,id]}}
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function walkable(p:Point){if(Math.pow((p.x-800)/670,2)+Math.pow((p.y-545)/390,2)>1)return false;if(p.y<325)return false;const pond=Math.pow((p.x-1200)/175,2)+Math.pow((p.y-615)/115,2)<1;const pier=p.x>=1280&&p.y>=590&&p.y<=645;return !pond||pier;}
export function findPath(start:Point,target:Point):Point[]{const step=25,key=(x:number,y:number)=>`${x},${y}`;const end={x:Math.round(target.x/step),y:Math.round(target.y/step)},begin={x:Math.round(start.x/step),y:Math.round(start.y/step)};if(!walkable({x:end.x*step,y:end.y*step}))return [];const queue=[begin],came=new Map<string,Point>(),seen=new Set([key(begin.x,begin.y)]);let found=false;for(let n=0;n<queue.length&&n<3000;n++){const p=queue[n];if(p.x===end.x&&p.y===end.y){found=true;break;}for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]){const q={x:p.x+dx,y:p.y+dy},k=key(q.x,q.y);if(seen.has(k)||!walkable({x:q.x*step,y:q.y*step}))continue;if(dx&&dy&&(!walkable({x:p.x*step,y:q.y*step})||!walkable({x:q.x*step,y:p.y*step})))continue;seen.add(k);came.set(k,p);queue.push(q);}}if(!found)return [];const path:Point[]=[];let p=end;while(p.x!==begin.x||p.y!==begin.y){path.unshift({x:p.x*step,y:p.y*step});const prev=came.get(key(p.x,p.y));if(!prev)break;p=prev;}return path;}


