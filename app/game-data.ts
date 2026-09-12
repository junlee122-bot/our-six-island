import {readWardrobe,type Appearance} from './character-style.ts';
import {DECOR,freshLife,hydrateLife,isRoom,roomWalkable,type RoomID,type LifeSave} from './life-data.ts';
export {DECOR};
export type Resource = 'apple'|'flower'|'wood'|'shell'|'fish';
export type Point = {x:number;y:number;room?:RoomID};
export const WORLD = {width:4800,height:3200,viewportWidth:1600,viewportHeight:1067};
export const SPAWN:Point = {x:2400,y:1480};
export const ITEMS: Record<Resource,{name:string;emoji:string;price:number}>={apple:{name:'사과',emoji:'🍎',price:4},flower:{name:'들꽃',emoji:'🌼',price:4},wood:{name:'나뭇가지',emoji:'🪵',price:3},shell:{name:'조개',emoji:'🐚',price:6},fish:{name:'물고기',emoji:'🐟',price:12}};
export const FRIENDS=[
 {name:'도원',look:'붉은 단발 · 검정 티',color:'#ebafae',x:1950,y:1695,greeting:'왔구나! 섬이 넓어져서 산책할 곳이 정말 많아졌어.'},
 {name:'강재',look:'어깨 길이 머리 · 둥근 안경',color:'#e4bc8c',x:2775,y:2010,greeting:'남쪽 해변까지 같이 걸어 볼까? 파도 소리가 참 좋아.'},
 {name:'민서',look:'긴 머리 · 크림색 셔츠',color:'#a7c9cd',x:1455,y:1605,greeting:'과수원 근처에 들꽃이 잔뜩 피었어. 소풍 자리에 조금 놓으면 예쁘겠다.'},
 {name:'승준',look:'짧은 검정 머리 · 흰 셔츠',color:'#a7c4df',x:3090,y:1500,greeting:'동쪽 호수에 물고기가 많대. 호현 촌장님이 낚시터도 알려 주셨어!'},
 {name:'민재',look:'가르마 단발 · 안경',color:'#b7b797',x:1980,y:1230,greeting:'북쪽 숲도 가 봤어? 나뭇가지가 많아서 섬 꾸미기에 딱이야.'},
 {name:'재민',look:'갈색 모자 · 검정 티',color:'#d5b095',x:3000,y:1130,greeting:'호현 촌장님이 탐험 수첩을 나눠 주시더라. 섬 한 바퀴 돌아보자!'},
];
export const MAYOR = {id:'hohyeon',name:'호현',role:'촌장',gender:'male' as const,x:2400,y:1170,look:'빨간 모자 · 배낭을 멘 남성 트레이너',greeting:'반가워! 이 마을 촌장 호현이야. 모험에 필요한 건 호기심 하나면 충분해. 넓어진 섬을 한 바퀴 돌아볼래?'};
export const REGIONS=[
 {id:'village',name:'중앙 마을',emoji:'🏡',x:2400,y:1480,description:'우리 집과 상점, 친구들이 모이는 마을이에요.'},
 {id:'orchard',name:'햇살 과수원',emoji:'🍎',x:1050,y:1630,description:'사과와 들꽃이 가득한 서쪽 과수원이에요.'},
 {id:'forest',name:'솔바람 숲',emoji:'🌲',x:2350,y:640,description:'북쪽 숲길에서 나뭇가지를 모아 보세요.'},
 {id:'lake',name:'반짝 호수',emoji:'🎣',x:4020,y:1400,description:'동쪽 부두에서 여유롭게 낚시를 즐겨요.'},
 {id:'beach',name:'노을 해변',emoji:'🐚',x:2400,y:2430,description:'길게 펼쳐진 남쪽 모래사장에서 조개를 찾아요.'},
];
export const REQUESTS:{item:Resource;count:number;title:string;text:string}[]=[
 {item:'apple',count:2,title:'소풍 간식',text:'아삭한 사과 두 개만 부탁해. 다 같이 나눠 먹자!'},
 {item:'flower',count:2,title:'꽃 한 다발',text:'들꽃 두 송이를 모아 줄래? 소풍 자리에 놓고 싶어.'},
 {item:'wood',count:3,title:'작은 식탁',text:'나뭇가지 세 개면 작은 식탁을 만들 수 있겠어.'},
 {item:'shell',count:2,title:'바다의 선물',text:'예쁜 조개 두 개로 우리 소풍 자리를 장식하자.'},
 {item:'fish',count:1,title:'오늘의 요리',text:'물고기 한 마리만 잡아 줄래? 맛있는 요리를 준비할게.'},
];
export type Node = Point & {id:string;kind:Resource};
const nodes=(prefix:string,kind:Resource,points:number[][]):Node[]=>points.map(([x,y],i)=>({x,y,id:`${prefix}${i}`,kind}));
export const NODES:Node[]=[
 ...nodes('a','apple',[[1080,1605],[1275,1650],[1095,1830],[1395,1845]]),
 ...nodes('f','flower',[[1260,2130],[1410,2250],[1050,2205],[1575,2130]]),
 ...nodes('w','wood',[[1740,1590],[2910,1635],[2880,1980],[1950,2100]]),
 ...nodes('s','shell',[[1740,2370],[2145,2450],[2910,2420],[3480,2325]]),
 ...nodes('orchard-a','apple',[[770,1430],[950,1420],[1160,1460],[800,1760],[990,1920],[1460,1440],[610,1690],[1550,1790]]),
 ...nodes('forest-w','wood',[[1890,890],[2110,780],[2330,650],[2520,770],[2750,920],[2500,1040],[2190,1010],[2860,1120]]),
 ...nodes('meadow-f','flower',[[1790,1080],[2010,1040],[2710,1220],[2800,1740],[1600,1810],[2390,2130],[2600,2240],[2890,2190]]),
 ...nodes('beach-s','shell',[[1420,2330],[1820,2410],[2100,2460],[2440,2470],[2730,2440],[3200,2390],[3590,2340],[3800,2250]]),
];
export const SPOTS=[{id:'shop',x:2870,y:1470,name:'도토리 상점',emoji:'🛒'},{id:'fish',x:3780,y:1400,name:'낚시터',emoji:'🎣'},{id:'home',x:1950,y:1500,name:'우리 집',emoji:'🏡'},{id:'picnic',x:2430,y:2080,name:'소풍 자리',emoji:'🧺'}];
export type Save = {wardrobe:Appearance[];life:LifeSave;version:2;character:number;names:string[];coins:number;bag:Record<Resource,number>;picked:Record<string,number>;talked:number[];accepted:number[];done:number[];hearts:number[];decor:string[];placed:{id:string;kind:string;x:number;y:number}[];harvested:number;fishCaught:number;picnic:boolean;dayReward:boolean;position:Point;explored:string[];mayorMet:boolean;explorationReward:boolean};
export function freshSave(character=0):Save{return {wardrobe:readWardrobe(undefined),life:freshLife(),version:2,character,names:FRIENDS.map(f=>f.name),coins:30,bag:{apple:0,flower:0,wood:0,shell:0,fish:0},picked:{},talked:[],accepted:[],done:[],hearts:[0,0,0,0,0,0],decor:[],placed:[],harvested:0,fishCaught:0,picnic:false,dayReward:false,position:{...SPAWN},explored:[],mayorMet:false,explorationReward:false};}
export function requestFor(character:number,npc:number){const ids=FRIENDS.map((_,i)=>i).filter(i=>i!==character);return REQUESTS[ids.indexOf(npc)]??REQUESTS[0];}
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const SHORE = [[815,45],[1068,108],[1195,152],[1310,216],[1400,270],[1460,352],[1470,490],[1430,627],[1340,732],[1170,772],[960,805],[780,827],[620,775],[436,777],[286,742],[166,684],[123,600],[93,516],[67,427],[101,339],[167,256],[306,174],[394,103],[525,87],[661,49]].map(([x,y])=>({x:x*3.125,y:y*3.125}));
export function walkable(p:Point){
 if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;
 let inside=false;
 for(let i=0,j=SHORE.length-1;i<SHORE.length;j=i++){
  const a=SHORE[i],b=SHORE[j];
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 if(!inside)return false;
 const pond=Math.pow((p.x-3740)/510,2)+Math.pow((p.y-1370)/365,2)<1;
 const pier=p.x>=3640&&p.y>=1365&&p.y<=1435;
 return !pond||pier;
}
export function hydrate(raw:string|null):Save|null{
 try{
  if(!raw)return null;const s=JSON.parse(raw);
  if(![1,2].includes(s.version)||!Number.isInteger(s.character)||s.character<0||s.character>=FRIENDS.length)return null;
  const d=freshSave(s.character),legacy=s.version===1;d.life=hydrateLife(s.life);d.wardrobe=readWardrobe(s.wardrobe);
  const finite=(v:unknown,max=999999)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(0,Math.floor(v))):0;
  d.coins=finite(s.coins);for(const k of Object.keys(ITEMS) as Resource[])d.bag[k]=finite(s.bag?.[k]);
  const previousNames=['체리','모카','구름','소금','밤이','도토'];
  d.names=FRIENDS.map((f,i)=>s.names?.[i]===previousNames[i]?f.name:typeof s.names?.[i]==='string'&&s.names[i].trim()?s.names[i].slice(0,12):f.name);
  for(const k of ['talked','accepted','done'] as const)d[k]=Array.isArray(s[k])?[...new Set<number>(s[k].filter((v:unknown)=>Number.isInteger(v)&&Number(v)>=0&&Number(v)<FRIENDS.length&&v!==d.character))]:[];
  d.hearts=FRIENDS.map((_,i)=>finite(s.hearts?.[i],5));
  d.picked=Object.fromEntries(NODES.map(n=>[n.id,finite(s.picked?.[n.id],Date.now())]));
  d.decor=Array.isArray(s.decor)?s.decor.filter((id:string)=>DECOR.some(x=>x.id===id)).slice(0,50):[];
  const migratePoint=(p:Point)=>({x:p.x*(legacy?3:1),y:p.y*(legacy?3:1)});
  if(Array.isArray(s.placed))d.placed=s.placed.flatMap((p:Save['placed'][number],i:number)=>{
   if(!p||!DECOR.some(x=>x.id===p.kind)||typeof p.id!=='string'||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>(legacy?1600:WORLD.width)||p.y>(legacy?1067:WORLD.height))return [];
   const point=migratePoint(p);
   if(!walkable(point)){if(!legacy)return [];point.x=SPAWN.x+(i%5)*45;point.y=SPAWN.y+100+Math.floor(i/5)*45;}
   return [{id:p.id,kind:p.kind,...point}];
  }).slice(0,50-d.decor.length);
  d.harvested=finite(s.harvested);d.fishCaught=finite(s.fishCaught);d.picnic=s.picnic===true;d.dayReward=s.dayReward===true;
  if(s.position&&Number.isFinite(s.position.x)&&Number.isFinite(s.position.y)){const p=migratePoint(s.position);const room=s.position.room;if(!legacy&&isRoom(room)&&room!=='island'&&roomWalkable(p))d.position={...p,room};else if(walkable(p))d.position=p;}
  d.explored=Array.isArray(s.explored)?[...new Set<string>(s.explored.filter((id:unknown)=>REGIONS.some(r=>r.id===id)))]:[];
  d.mayorMet=s.mayorMet===true;d.explorationReward=s.explorationReward===true;
  return d;
 }catch{return null}
}
export function handIn(s:Save,npc:number):Save|null{if(!Number.isInteger(npc)||npc<0||npc>=FRIENDS.length||npc===s.character||s.done.includes(npc)||!s.accepted.includes(npc))return null;const q=requestFor(s.character,npc);if(s.bag[q.item]<q.count)return null;return {...s,coins:s.coins+25,bag:{...s.bag,[q.item]:s.bag[q.item]-q.count},done:[...s.done,npc],hearts:s.hearts.map((h,i)=>i===npc?Math.min(5,h+2):h)};}
export function buy(s:Save,id:string):Save|null{const d=DECOR.find(x=>x.id===id);if(!d||s.coins<d.price||s.decor.length+s.placed.length>=50)return null;return {...s,coins:s.coins-d.price,decor:[...s.decor,id]}}
export function visitRegion(s:Save,id:string):Save{return !REGIONS.some(r=>r.id===id)||s.explored.includes(id)?s:{...s,explored:[...s.explored,id]};}
export function claimExploration(s:Save):Save|null{return s.explorationReward||!s.mayorMet||!REGIONS.every(r=>s.explored.includes(r.id))?null:{...s,coins:s.coins+100,explorationReward:true};}
// A bounded grid covers the entire expanded map. It cannot run out of the old
// 3,000-node budget when walking between opposite ends of the island.
export function findPath(start:Point,target:Point):Point[]{
 if(!walkable(start)||!walkable(target))return [];
 const step=40,cols=Math.ceil(WORLD.width/step)+1,rows=Math.ceil(WORLD.height/step)+1,total=cols*rows;
 const gridPoint=(id:number):Point=>({x:(id%cols)*step,y:Math.floor(id/cols)*step});
 const nearest=(p:Point)=>{const x=Math.round(p.x/step),y=Math.round(p.y/step);let chosen=-1,best=Infinity;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const id=ny*cols+nx,q=gridPoint(id),dist=distance(p,q);if(walkable(q)&&walkable({x:(p.x+q.x)/2,y:(p.y+q.y)/2})&&dist<best){chosen=id;best=dist}}return chosen};
 const begin=nearest(start),end=nearest(target);if(begin<0||end<0)return [];
 const came=new Int32Array(total).fill(-1),queue=new Int32Array(total);came[begin]=begin;queue[0]=begin;let head=0,tail=1;
 while(head<tail){const id=queue[head++];if(id===end)break;const p=gridPoint(id);for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]){
  const q={x:p.x+dx*step,y:p.y+dy*step};if(q.x<0||q.y<0||q.x>WORLD.width||q.y>WORLD.height)continue;
  const next=Math.round(q.y/step)*cols+Math.round(q.x/step);if(came[next]!==-1||!walkable(q)||!walkable({x:(p.x+q.x)/2,y:(p.y+q.y)/2}))continue;
  if(dx&&dy&&(!walkable({x:p.x,y:q.y})||!walkable({x:q.x,y:p.y})))continue;
  came[next]=id;queue[tail++]=next;
 }}
 if(came[end]===-1)return [];
 const path:Point[]=[];for(let id=end;id!==begin;id=came[id])path.push(gridPoint(id));path.reverse();
 const first=gridPoint(begin);if(distance(start,first)>4)path.unshift(first);
 path.push({x:target.x,y:target.y});return path;
}
