import type {Point,Resource,Save} from './game-data.ts';

export type RoomID='island'|'home'|'shop'|'workshop'|'museum';
export const ROOM_IDS:RoomID[]=['island','home','shop','workshop','museum'];
export const ROOM_SIZE={width:1100,height:740};
export const ROOM_ENTRY={x:550,y:610};
export const ROOMS={home:{name:'우리 집',cell:0,action:'home',label:'수납함과 집 꾸미기'},shop:{name:'도토리 상점',cell:1,action:'shop',label:'오늘의 상점 둘러보기'},workshop:{name:'뚝딱 공방',cell:2,action:'craft',label:'작업대에서 가구 만들기'},museum:{name:'여섯섬 박물관',cell:3,action:'museum',label:'수집품 기증하기'}} as const;
export const FACILITIES=[{id:'workshop',name:'뚝딱 공방',emoji:'🔨',x:2070,y:1010,cell:0},{id:'museum',name:'여섯섬 박물관',emoji:'🏛️',x:3360,y:1890,cell:1},{id:'garden',name:'햇살 텃밭',emoji:'🌱',x:1580,y:1980,cell:2},{id:'cafe',name:'노을 카페',emoji:'☕',x:2980,y:2230,cell:3}];
export const PLOTS=Array.from({length:6},(_,i)=>({id:String(i),x:1450+(i%3)*100,y:2050+Math.floor(i/3)*90}));
export const INSECTS=[{id:'butterfly-1',kind:'butterfly',x:1300,y:1860},{id:'butterfly-2',kind:'butterfly',x:1650,y:1790},{id:'beetle-1',kind:'beetle',x:2480,y:830},{id:'dragonfly-1',kind:'dragonfly',x:3220,y:1230}];
export const DECOR=[
 {id:'plant',name:'꽃 화분',emoji:'🪴',price:24},{id:'chair',name:'소풍 의자',emoji:'🪑',price:32},{id:'lamp',name:'별빛 조명',emoji:'🏮',price:40},{id:'tent',name:'작은 텐트',emoji:'⛺',price:60},
 {id:'table',name:'원목 식탁',emoji:'🪵',price:48},{id:'sofa',name:'푹신한 소파',emoji:'🛋️',price:85},{id:'bookshelf',name:'이야기 책장',emoji:'📚',price:70},{id:'bed',name:'포근한 침대',emoji:'🛏️',price:95},
 {id:'rug',name:'체크 피크닉 매트',emoji:'🧶',price:42},{id:'bench',name:'산책길 벤치',emoji:'🪑',price:55},{id:'fence',name:'정원 울타리',emoji:'🪵',price:20},{id:'fountain',name:'작은 분수',emoji:'⛲',price:120},
 {id:'radio',name:'빈티지 라디오',emoji:'📻',price:65},{id:'planter',name:'정원 화단',emoji:'🌷',price:45},{id:'fireplace',name:'따뜻한 벽난로',emoji:'🔥',price:110},{id:'fruit-tree',name:'작은 귤나무',emoji:'🌳',price:80},
];
export const RECIPES=DECOR.map((d,i)=>({...d,wood:[2,3,2,5,4,6,5,6,2,4,1,6,4,3,7,4][i],flower:[1,0,2,1,0,3,0,2,3,1,0,4,1,3,2,2][i],shell:i===2||i===11||i===12?2:0}));
export type Crop='carrot'|'tomato'|'pumpkin';
export const CROPS:Record<Crop,{name:string;emoji:string;seedPrice:number;price:number;seconds:number}>={carrot:{name:'당근',emoji:'🥕',seedPrice:5,price:14,seconds:80},tomato:{name:'토마토',emoji:'🍅',seedPrice:7,price:19,seconds:110},pumpkin:{name:'호박',emoji:'🎃',seedPrice:9,price:25,seconds:140}};
export const MEALS=[{id:'salad',name:'햇살 샐러드',emoji:'🥗',needs:{carrot:1,tomato:1,pumpkin:0},coins:55},{id:'soup',name:'따끈한 호박 수프',emoji:'🍲',needs:{carrot:1,tomato:0,pumpkin:1},coins:68},{id:'basket',name:'여섯섬 도시락',emoji:'🍱',needs:{carrot:1,tomato:1,pumpkin:1},coins:100}];
export const COLLECTION=[
 {id:'apple',name:'섬 사과',emoji:'🍎',category:'자연',note:'햇살 과수원에서 만나는 달콤한 선물.'},
 {id:'flower',name:'들꽃',emoji:'🌼',category:'자연',note:'숲과 마을 사이에 피어난 작은 꽃.'},
 {id:'wood',name:'나뭇가지',emoji:'🪵',category:'자연',note:'공방의 모든 이야기는 여기서 시작돼요.'},
 {id:'shell',name:'바닷조개',emoji:'🐚',category:'자연',note:'노을 해변에 파도가 놓고 간 선물.'},
 {id:'fish',name:'섬 물고기',emoji:'🐟',category:'물고기',note:'반짝 호수에서 처음 낚아 올린 친구.'},
 {id:'crucian',name:'붕어',emoji:'🐟',category:'물고기',note:'호수에서 자주 만날 수 있는 느긋한 물고기.'},
 {id:'carp',name:'잉어',emoji:'🐠',category:'물고기',note:'부두 그늘 아래 숨어 있어요.'},
 {id:'koi',name:'비단잉어',emoji:'🐠',category:'물고기',note:'반짝이는 비늘이 무척 아름다워요.'},
 {id:'bass',name:'농어',emoji:'🐟',category:'물고기',note:'힘차게 헤엄치는 멋진 친구예요.'},
 {id:'butterfly',name:'노랑나비',emoji:'🦋',category:'곤충',note:'과수원과 꽃밭을 찾아보세요.'},
 {id:'beetle',name:'장수풍뎅이',emoji:'🪲',category:'곤충',note:'북쪽 숲의 나무 가까이에 살아요.'},
 {id:'dragonfly',name:'잠자리',emoji:'🦋',category:'곤충',note:'동쪽 호수 주변을 맴돌아요.'},
];
export type PlacedFurniture={id:string;kind:string;x:number;y:number;rotation?:number};
type Plot={crop:Crop|null;plantedAt:number;watered:boolean};
export type LifeSave={roomPlaced:PlacedFurniture[];storage:Record<Resource,number>;seeds:Record<Crop,number>;produce:Record<Crop,number>;plots:Plot[];donated:string[];discovered:string[];specimens:Record<string,number>;caughtAt:Record<string,number>;crafted:number;harvests:number;cooked:number;stamps:string[];houseLevel:number;homeStyle:string;museumReward:boolean};
const resources:Resource[]=['apple','flower','wood','shell','fish'];
export const isRoom=(value:unknown):value is RoomID=>ROOM_IDS.includes(value as RoomID);
export const roomWalkable=(p:Point)=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=130&&p.x<=970&&p.y>=275&&p.y<=660;
export const roomCapacity=(s:Save)=>[0,12,20,30][s.life.houseLevel]||12;
export function freshLife():LifeSave{return {roomPlaced:[],storage:{apple:0,flower:0,wood:0,shell:0,fish:0},seeds:{carrot:3,tomato:2,pumpkin:1},produce:{carrot:0,tomato:0,pumpkin:0},plots:Array.from({length:6},()=>({crop:null,plantedAt:0,watered:false})),donated:[],discovered:[],specimens:Object.fromEntries(COLLECTION.map(c=>[c.id,0])),caughtAt:Object.fromEntries(INSECTS.map(c=>[c.id,0])),crafted:0,harvests:0,cooked:0,stamps:[],houseLevel:1,homeStyle:'linen',museumReward:false};}
export function hydrateLife(value:unknown):LifeSave{
 const d=freshLife();if(!value||typeof value!=='object')return d;const v=value as Partial<LifeSave>;
 const count=(n:unknown,max=999999)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
 for(const k of resources)d.storage[k]=count(v.storage?.[k]);
 for(const k of Object.keys(CROPS) as Crop[]){d.seeds[k]=count(v.seeds?.[k]);d.produce[k]=count(v.produce?.[k]);}
 d.houseLevel=Math.max(1,count(v.houseLevel,3));d.homeStyle=['linen','mint','clay'].includes(v.homeStyle||'')?v.homeStyle!:'linen';
 d.roomPlaced=Array.isArray(v.roomPlaced)?v.roomPlaced.filter(p=>p&&roomWalkable(p)&&DECOR.some(d=>d.id===p.kind)&&typeof p.id==='string').slice(0,[0,12,20,30][d.houseLevel]).map((p,i)=>({id:'inside-'+i,kind:p.kind,x:p.x,y:p.y,rotation:p.rotation===1?1:0})):[];
 d.plots=d.plots.map((p,i)=>{const s=v.plots?.[i];return s&&Object.hasOwn(CROPS,s.crop||'')?{crop:s.crop,plantedAt:count(s.plantedAt,Date.now()),watered:s.watered===true}:p;});
 for(const key of ['donated','discovered'] as const)d[key]=Array.isArray(v[key])?[...new Set(v[key].filter(id=>COLLECTION.some(c=>c.id===id)))]:[];
 for(const c of COLLECTION)d.specimens[c.id]=count(v.specimens?.[c.id]);
 for(const insect of INSECTS)d.caughtAt[insect.id]=count(v.caughtAt?.[insect.id],Date.now());
 for(const key of ['crafted','harvests','cooked'] as const)d[key]=count(v[key]);
 d.stamps=Array.isArray(v.stamps)?[...new Set(v.stamps.filter(s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)))].slice(-31):[];
 d.museumReward=v.museumReward===true;return d;
}
export function discover(s:Save,id:string):Save{return s.life.discovered.includes(id)?s:{...s,life:{...s.life,discovered:[...s.life.discovered,id]}};}
export function craft(s:Save,id:string):Save|null{
 const r=RECIPES.find(r=>r.id===id);if(!r||s.decor.length+s.placed.length>=50||s.bag.wood<r.wood||s.bag.flower<r.flower||s.bag.shell<r.shell)return null;
 return {...s,bag:{...s.bag,wood:s.bag.wood-r.wood,flower:s.bag.flower-r.flower,shell:s.bag.shell-r.shell},decor:[...s.decor,id],life:{...s.life,crafted:s.life.crafted+1}};
}
export function seed(s:Save,index:number,crop:Crop,now=Date.now()):Save|null{
 if(!Number.isInteger(index)||index<0||index>=6||!CROPS[crop]||s.life.plots[index].crop||s.life.seeds[crop]<1)return null;
 return {...s,life:{...s.life,seeds:{...s.life.seeds,[crop]:s.life.seeds[crop]-1},plots:s.life.plots.map((p,i)=>i===index?{crop,plantedAt:now,watered:false}:p)}};
}
export function cropProgress(plot:Plot,now=Date.now()){return !plot.crop?0:Math.max(0,Math.min(1,(now-plot.plantedAt)/(CROPS[plot.crop].seconds*1000*(plot.watered?0.55:1))));}
export function water(s:Save,index:number):Save|null{const plot=s.life.plots[index];if(!plot?.crop||plot.watered)return null;return {...s,life:{...s.life,plots:s.life.plots.map((p,i)=>i===index?{...p,watered:true}:p)}};}
export function harvest(s:Save,index:number,now=Date.now()):Save|null{
 const plot=s.life.plots[index];if(!plot?.crop||cropProgress(plot,now)<1)return null;
 return {...s,life:{...s.life,produce:{...s.life.produce,[plot.crop]:s.life.produce[plot.crop]+2},harvests:s.life.harvests+1,plots:s.life.plots.map((p,i)=>i===index?{crop:null,watered:false,plantedAt:0}:p)}};
}
export function buySeeds(s:Save,crop:Crop):Save|null{const c=CROPS[crop];if(!c||s.coins<c.seedPrice)return null;return {...s,coins:s.coins-c.seedPrice,life:{...s.life,seeds:{...s.life.seeds,[crop]:s.life.seeds[crop]+1}}};}
export function sellProduce(s:Save,crop:Crop):Save|null{if(!CROPS[crop]||s.life.produce[crop]<1)return null;return {...s,coins:s.coins+CROPS[crop].price,life:{...s.life,produce:{...s.life.produce,[crop]:s.life.produce[crop]-1}}};}
export function cook(s:Save,id:string):Save|null{
 const meal=MEALS.find(m=>m.id===id);if(!meal||(Object.keys(CROPS) as Crop[]).some(c=>s.life.produce[c]<meal.needs[c]))return null;
 const produce={...s.life.produce};for(const c of Object.keys(CROPS) as Crop[])produce[c]-=meal.needs[c];
 return {...s,coins:s.coins+meal.coins,life:{...s.life,produce,cooked:s.life.cooked+1}};
}
export function donate(s:Save,id:string):Save|null{
 if(s.life.donated.includes(id)||!COLLECTION.some(c=>c.id===id))return null;
 const source=resources.includes(id as Resource)?'bag':'specimens',quantity=source==='bag'?s.bag[id as Resource]:s.life.specimens[id]||0;if(quantity<1)return null;
 const next=discover(s,id),life={...next.life,donated:[...next.life.donated,id]};
 if(source==='specimens')life.specimens={...life.specimens,[id]:quantity-1};
 return {...next,coins:s.coins+30,bag:source==='bag'?{...s.bag,[id]:quantity-1}:s.bag,life};
}
export function transfer(s:Save,item:Resource,toStorage:boolean,all=false):Save|null{
 if(!resources.includes(item))return null;const quantity=toStorage?s.bag[item]:s.life.storage[item];if(quantity<1)return null;const n=all?quantity:1;
 return {...s,bag:{...s.bag,[item]:s.bag[item]+(toStorage?-n:n)},life:{...s.life,storage:{...s.life.storage,[item]:s.life.storage[item]+(toStorage?n:-n)}}};
}
export function catchInsect(s:Save,id:string,now=Date.now()):Save|null{const insect=INSECTS.find(i=>i.id===id);if(!insect||now-(s.life.caughtAt[id]||0)<60000)return null;const next=discover(s,insect.kind);return {...next,coins:s.coins+5,life:{...next.life,specimens:{...next.life.specimens,[insect.kind]:(next.life.specimens[insect.kind]||0)+1},caughtAt:{...next.life.caughtAt,[id]:now}}};}
export function catchFish(s:Save,random=Math.random()):{save:Save;name:string}{
 const id=['crucian','carp','koi','bass'][Math.max(0,Math.min(3,Math.floor(random*4)))],next=discover(discover(s,'fish'),id);
 return {save:{...next,bag:{...s.bag,fish:s.bag.fish+1},fishCaught:s.fishCaught+1,coins:s.coins+5,life:{...next.life,specimens:{...next.life.specimens,[id]:(next.life.specimens[id]||0)+1}}},name:COLLECTION.find(c=>c.id===id)!.name};
}
export function today(now=new Date()){return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');}
export function dailyGift(s:Save,day=today()):Save|null{return s.life.stamps.includes(day)?null:{...s,coins:s.coins+40,life:{...s.life,stamps:[...s.life.stamps,day].slice(-31)}};}
export function upgradeHome(s:Save):Save|null{const cost=s.life.houseLevel===1?120:240;if(s.life.houseLevel>=3||s.coins<cost||s.bag.wood<8)return null;return {...s,coins:s.coins-cost,bag:{...s.bag,wood:s.bag.wood-8},life:{...s.life,houseLevel:s.life.houseLevel+1}};}
export function placeInside(s:Save,id:string,p:Point):Save|null{const i=s.decor.indexOf(id);if(i<0||!roomWalkable(p)||s.life.roomPlaced.length>=roomCapacity(s)||s.life.roomPlaced.some(f=>Math.hypot(p.x-f.x,p.y-f.y)<55))return null;return {...s,decor:s.decor.filter((_,j)=>i!==j),life:{...s.life,roomPlaced:[...s.life.roomPlaced,{id:crypto.randomUUID(),kind:id,x:p.x,y:p.y}]}};}
export function reclaimInside(s:Save,id:string):Save|null{const p=s.life.roomPlaced.find(p=>p.id===id);if(!p||s.decor.length+s.placed.length>=50)return null;return {...s,decor:[...s.decor,p.kind],life:{...s.life,roomPlaced:s.life.roomPlaced.filter(p=>p.id!==id)}};}

