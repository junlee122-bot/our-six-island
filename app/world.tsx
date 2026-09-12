'use client';
import {useEffect,useRef} from 'react';
import {DECOR,FRIENDS,MAYOR,REGIONS,WORLD,ITEMS,NODES,SPOTS,SPAWN,distance,findPath,walkable,type Point,type Save} from './game-data';
import {FACILITIES,INSECTS,PLOTS,ROOMS,ROOM_ENTRY,ROOM_SIZE,COLLECTION,CROPS,cropProgress,isRoom,roomWalkable,type RoomID} from './life-data';
import {GAME_ASSETS,loadArt} from './game-assets';
import {loadSpriteSheet,loadMayorSprite} from './sprite-sheet';
import {canvasPixelRatio,interiorCamera,visibleMapCrop} from './canvas-resolution';
import type {OnlinePlayer} from './multiplayer-protocol';
import type {IslandSession} from './multiplayer-session';
import {loadCharacters,type CharacterRenderer} from './character-renderer';
import {readAppearance,type Motion} from './character-style';
import {SCENERY,MEADOW,drawNature,drawWater} from './island-atmosphere';
export type Target = Point & {id:string;type:'node'|'friend'|'spot'|'decor'|'mayor'|'region'|'door'|'exit'|'service'|'plot'|'insect'|'facility';label:string};
export type WorldApi={go:(t:Target)=>boolean;key:(key:string,down:boolean)=>void;position:()=>Point;pose:()=>Point&{facing:number;motion:Motion};animate:(motion:Motion)=>void;room:()=>RoomID;teleport:(p:Point)=>boolean;snapshot:()=>string|null};
export function roomDoor(room:RoomID):Point{const door=[...SPOTS,...FACILITIES].find(p=>p.id===room);return door?{x:door.x,y:door.y+45,room:'island'}:{...SPAWN,room:'island'};}
export function targets(s:Save,canEditDecor=true,room:RoomID='island'):Target[]{
 if(room!=='island')return [{id:'exit',type:'exit',room,x:550,y:650,label:'문을 열고 밖으로 나가기'},{id:ROOMS[room].action,type:'service',room,x:550,y:335,label:ROOMS[room].label},...(room==='home'&&canEditDecor?s.life.roomPlaced.map(p=>({...p,room,type:'decor' as const,label:'가구 회수하기'})):[])];
 return [...NODES.filter(n=>Date.now()-(s.picked[n.id]||0)>30000).map(n=>({...n,type:'node' as const,label:ITEMS[n.kind].name+' 줍기'})),
 ...FRIENDS.flatMap((f,i)=>i===s.character?[]:[{...f,id:String(i),type:'friend' as const,label:s.names[i]+'와 대화'}]),{...MAYOR,type:'mayor' as const,label:'호현 촌장과 대화'},
 ...REGIONS.map(p=>({...p,type:'region' as const,label:p.name})),
 ...SPOTS.map(p=>({...p,type:p.id==='home'||p.id==='shop'?'door' as const:'spot' as const,label:p.name+(p.id==='home'||p.id==='shop'?' 들어가기':'')})),
 ...FACILITIES.map(p=>({...p,type:p.id==='workshop'||p.id==='museum'?'door' as const:'facility' as const,label:p.name+(p.id==='workshop'||p.id==='museum'?' 들어가기':' 이용하기')})),
 ...PLOTS.map(p=>({...p,type:'plot' as const,label:'텃밭 '+(Number(p.id)+1)+'번 돌보기'})),
 ...INSECTS.filter(p=>Date.now()-(s.life.caughtAt[p.id]||0)>60000).map(p=>({...p,type:'insect' as const,label:(COLLECTION.find(c=>c.id===p.kind)?.name||'곤충')+' 잡기'})),
 ...(canEditDecor?s.placed.map(p=>({...p,type:'decor' as const,label:'장식 회수'})):[])];
}
export default function World({save,paused,zoom,night,placing,onAct,onNear,onPlace,api,onReady,onRegion,onRoom,network,visiting}:{save:Save;paused:boolean;zoom:number;night:boolean;placing:string|null;onAct:(t:Target)=>void;onNear:(t:Target|null)=>void;onPlace:(p:Point)=>void;api:React.RefObject<WorldApi|null>;onReady:(ok:boolean)=>void;onRegion:(id:string|null)=>void;onRoom:(room:RoomID)=>void;network:IslandSession;visiting:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),state=useRef({save,paused,zoom,night,placing,onAct,onNear,onPlace,onReady,onRegion,onRoom,network,visiting});state.current={save,paused,zoom,night,placing,onAct,onNear,onPlace,onReady,onRegion,onRoom,network,visiting};
 useEffect(()=>{
  const c=canvas.current!,ctx=c.getContext('2d')!;let alive=true,frame=0,last=0,clock=0;
  let room:RoomID=state.current.save.position.room??'island';
  const pos={x:state.current.save.position.x,y:state.current.save.position.y},camera={...pos},keys=new Set<string>();
  let path:Point[]=[],destination:Target|null=null,nearId='',regionId:string|null=null,scale=1,ox=0,oy=0,w=0,h=0,moving=false,facing=1,wasPaused=true;
  let motion:Motion='idle',action:Motion='idle',actionUntil=0,characters:CharacterRenderer|undefined,nature:HTMLImageElement|undefined;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');let reduced=preference.matches;const preferenceChanged=()=>{reduced=preference.matches;};preference.addEventListener('change',preferenceChanged);
  const animate=(m:Motion)=>{action=m;actionUntil=Date.now()+(m==='gather'?650:1600);};
  let bg:HTMLImageElement|undefined,sprites:HTMLImageElement|undefined,mayor:HTMLImageElement|undefined,interiors:HTMLImageElement|undefined,furniture:HTMLImageElement|undefined,facilities:HTMLImageElement|undefined;
  Promise.all([loadArt(GAME_ASSETS.map),loadSpriteSheet(),loadMayorSprite(),loadArt(GAME_ASSETS.interiors),loadArt(GAME_ASSETS.furniture),loadArt(GAME_ASSETS.facilities),loadCharacters(),loadArt(GAME_ASSETS.nature)]).then(images=>{
   if(!alive)return;[bg,sprites,mayor,interiors,furniture,facilities,characters,nature]=images;
   document.documentElement.style.setProperty('--wearable-sheet','url("'+GAME_ASSETS.accessories+'")');
   document.documentElement.style.setProperty('--island-map','url("'+bg.src+'")');document.documentElement.style.setProperty('--furniture-sheet','url("'+furniture.src+'")');document.documentElement.style.setProperty('--interior-sheet','url("'+interiors.src+'")');state.current.onReady(true);
  }).catch(()=>{if(alive)state.current.onReady(false);});
  const resize=()=>{const rect=c.getBoundingClientRect();w=rect.width;h=rect.height;const dpr=canvasPixelRatio(w,h,devicePixelRatio||1);c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);ctx.setTransform(c.width/Math.max(1,w),0,0,c.height/Math.max(1,h),0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';};
  const observer=new ResizeObserver(resize);observer.observe(c);resize();
  const teleport=(p:Point)=>{
   const next=isRoom(p.room)?p.room:'island';if(!(next==='island'?walkable(p):roomWalkable(p)))return false;
   room=next;Object.assign(pos,{x:p.x,y:p.y});Object.assign(camera,pos);keys.clear();path=[];destination=null;nearId='';regionId=null;motion='idle';moving=false;actionUntil=0;remotePositions.clear();state.current.onNear(null);state.current.onRoom(room);return true;
  };
  const canWalk=(p:Point)=>room==='island'?walkable(p):roomWalkable(p);
  const go=(t:Target)=>{
   const next=t.room??'island';if(next!==room)teleport(next==='island'?roomDoor(room):{...ROOM_ENTRY,room:next});
   path=room==='island'?findPath(pos,t):canWalk(t)?[{x:t.x,y:t.y}]:[];destination=t;
   if(distance(pos,t)<72){path=[];destination=null;state.current.onAct(t);return true;}return path.length>0;
  };
  const remotePositions=new Map<string,Point>();
  api.current={go,key:(k,down)=>{if(down)keys.add(k);else keys.delete(k)},position:()=>({...pos,room}),pose:()=>({...pos,facing,room,motion:Date.now()<actionUntil?action:state.current.paused?'idle':motion}),animate,room:()=>room,teleport,snapshot:()=>{try{return c.toDataURL('image/png');}catch{return null;}}};
  state.current.onRoom(room);
  const currentTargets=()=>targets(state.current.save,!state.current.visiting,room);
  const keyDown=(e:KeyboardEvent)=>{if((e.target as HTMLElement).matches('input,textarea,select')||state.current.paused)return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','e','shift'].includes(k)){e.preventDefault();keys.add(k);if((k==='e'||k===' ')&&!e.repeat){const t=currentTargets().sort((a,b)=>distance(pos,a)-distance(pos,b))[0];if(t&&distance(pos,t)<86)state.current.onAct(t);}}};
  const keyUp=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase()),blur=()=>{keys.clear();path=[];destination=null;motion='idle';moving=false;actionUntil=0;};window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',blur);
  const click=(e:PointerEvent)=>{if(state.current.paused)return;const rect=c.getBoundingClientRect(),p={x:(e.clientX-rect.left-ox)/scale,y:(e.clientY-rect.top-oy)/scale,room};if(state.current.placing&&!state.current.visiting){if(canWalk(p))state.current.onPlace(p);return;}const t=currentTargets().sort((a,b)=>distance(p,a)-distance(p,b))[0];if(t&&distance(p,t)<56){go(t);return;}destination=null;path=room==='island'?findPath(pos,p):canWalk(p)?[p]:[];};c.addEventListener('pointerdown',click);
  const pill=(text:string,x:number,y:number,color='#fff9e9',fg='#39513f')=>{ctx.font='bold 15px "Malgun Gothic", sans-serif';const size=ctx.measureText(text).width+22;ctx.fillStyle='rgba(44,65,40,.11)';ctx.beginPath();ctx.roundRect(x-size/2,y-15,size,29,13);ctx.fill();ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x-size/2,y-17,size,28,13);ctx.fill();ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,y-3);};
  const drawFurniture=(kind:string,x:number,y:number)=>{
   if(!furniture)return;const i=DECOR.findIndex(d=>d.id===kind);if(i<0)return;const cellW=furniture.naturalWidth/4,cellH=furniture.naturalHeight/4;
   const size=[80,95,95,165,130,145,130,155,140,145,125,155,80,115,140,160][i];ctx.drawImage(furniture,(i%4)*cellW,Math.floor(i/4)*cellH,cellW,cellH,x-size/2,y-size*.82,size,size);
  };
  const drawPerson=(i:number,x:number,y:number,pose:Motion='idle',player=false,remote?:OnlinePlayer)=>{
   ctx.save();ctx.translate(x,y);ctx.fillStyle='rgba(36,75,46,.20)';ctx.beginPath();ctx.ellipse(0,-2,22,8,0,0,Math.PI*2);ctx.fill();
   if(player){ctx.strokeStyle='#fff9dc';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,28,10,0,0,Math.PI*2);ctx.stroke();}
   const st=state.current,a=remote?.appearance??(!player&&st.visiting?st.network.scene.island?.wardrobe?.[i]:undefined)??st.save.wardrobe[i];
   if(characters)characters.draw(ctx,i,readAppearance(a,i),0,0,128,pose,clock+i*.73,player||remote?remote?.facing??facing:1,reduced);
   else if(sprites){const sw=sprites.naturalWidth/3,sh=sprites.naturalHeight/2;ctx.drawImage(sprites,(i%3)*sw,Math.floor(i/3)*sh,sw,sh,-47,-105,94,110);}
   ctx.restore();pill(remote?remote.name+' · 친구':state.current.save.names[i],x,y+22,remote?'#287a94':player?'#406b4c':'#fffaeb',remote||player?'#ffffff':'#435641');
   if(!player&&!remote&&!state.current.save.done.includes(i)){const bob=reduced?0:Math.sin(clock*2+i)*3;ctx.fillStyle='#fbca60';ctx.beginPath();ctx.arc(x+26,y-115+bob,11,0,Math.PI*2);ctx.fill();ctx.fillStyle='#694a24';ctx.font='bold 15px sans-serif';ctx.fillText(state.current.save.accepted.includes(i)?'♥':'!',x+26,y-114+bob);}
  };
  const render=(t:number)=>{
   if(!alive)return;const dt=Math.min((t-last)/1000||.016,.05);last=t;clock+=dt;const st=state.current;
   if(st.paused&&!wasPaused){keys.clear();path=[];destination=null;}wasPaused=st.paused;moving=false;
   if(!st.paused){
    let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));let followingPath=false;
    if(dx||dy){path=[];destination=null;}else if(path.length){followingPath=true;const q=path[0],dist=distance(pos,q);if(dist<8)path.shift();else{dx=(q.x-pos.x)/dist;dy=(q.y-pos.y)/dist;}}
    if(dx||dy){const before={...pos},len=Math.hypot(dx,dy),speed=keys.has('shift')?380:230,stride=followingPath?Math.min(speed*dt,distance(pos,path[0])):speed*dt,nx=pos.x+dx/len*stride,ny=pos.y+dy/len*stride;if(canWalk({x:nx,y:pos.y}))pos.x=nx;if(canWalk({x:pos.x,y:ny}))pos.y=ny;if(dx)facing=dx<0?-1:1;moving=distance(before,pos)>.01;}
    if(destination&&distance(pos,destination)<68){const arrived=destination;destination=null;path=[];st.onAct(arrived);}
    const near=currentTargets().sort((a,b)=>distance(pos,a)-distance(pos,b))[0],id=near&&distance(pos,near)<86?near.type+near.id:'';
    if(id!==nearId){nearId=id;st.onNear(id?near:null);}
    if(room==='island'){const region=REGIONS.find(r=>distance(pos,r)<260)?.id??null;if(region!==regionId){regionId=region;st.onRegion(region);}}
   }
   motion=Date.now()<actionUntil?action:!st.paused&&moving?(keys.has('shift')?'run':'walk'):'idle';
   const outside=room==='island',size=outside?WORLD:ROOM_SIZE;
   scale=(outside?Math.max(w/WORLD.viewportWidth,h/WORLD.viewportHeight):Math.max(w/1550,h/1100))*st.zoom;
   camera.x+=(pos.x-camera.x)*Math.min(1,dt*4);camera.y+=(pos.y-camera.y)*Math.min(1,dt*4);
   if(outside){ox=Math.min(0,Math.max(w-size.width*scale,w/2-camera.x*scale));oy=Math.min(0,Math.max(h-size.height*scale,h*.56-camera.y*scale));}
   else{({ox,oy}=interiorCamera(w,h,scale,camera));}
   ctx.clearRect(0,0,w,h);ctx.fillStyle=outside?'#66bebe':'#c7b293';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
   if(outside&&bg){const crop=visibleMapCrop(w,h,ox,oy,scale,bg.naturalWidth,bg.naturalHeight);if(crop.dw>0&&crop.dh>0)ctx.drawImage(bg,crop.sx,crop.sy,crop.sw,crop.sh,crop.dx,crop.dy,crop.dw,crop.dh);}
   const visible=(p:Point,margin=260)=>p.x>(-ox/scale)-margin&&p.x<(w-ox)/scale+margin&&p.y>(-oy/scale)-margin&&p.y<(h-oy)/scale+margin;
   if(outside){drawWater(ctx,clock,visible,reduced);if(nature)for(const p of MEADOW)if(visible(p))drawNature(ctx,nature,p.cell,p.x,p.y,p.size,reduced?0:Math.sin(clock*1.4+p.phase)*.025);}
   if(!outside&&interiors){const index=ROOMS[room as Exclude<RoomID,'island'>].cell,sw=interiors.naturalWidth/2,sh=interiors.naturalHeight/2;ctx.drawImage(interiors,(index%2)*sw,Math.floor(index/2)*sh,sw,sh,0,0,size.width,size.height);}
   if(path.length){ctx.setLineDash([3,13]);ctx.lineWidth=3;ctx.strokeStyle='rgba(255,255,234,.65)';ctx.beginPath();ctx.moveTo(pos.x,pos.y);path.forEach(q=>ctx.lineTo(q.x,q.y));ctx.stroke();ctx.setLineDash([]);}
   if(outside){
    if(facilities)for(const f of FACILITIES){const sw=facilities.naturalWidth/2,sh=facilities.naturalHeight/2,width=f.id==='garden'?390:330;ctx.drawImage(facilities,(f.cell%2)*sw,Math.floor(f.cell/2)*sh,sw,sh,f.x-width/2,f.y-width*.86,width,width);}
    for(const n of NODES){if(Date.now()-(st.save.picked[n.id]||0)<30000)continue;ctx.font='28px "Segoe UI Emoji"';ctx.textAlign='center';ctx.fillText(ITEMS[n.kind].emoji,n.x,n.y+Math.sin(clock*2+n.x)*2);}
    for(const insect of INSECTS){if(Date.now()-(st.save.life.caughtAt[insect.id]||0)<60000)continue;ctx.font='34px "Segoe UI Emoji"';ctx.fillText(COLLECTION.find(c=>c.id===insect.kind)?.emoji||'🦋',insect.x+Math.sin(clock*2)*8,insect.y+Math.sin(clock*3)*6);}
    for(const p of [...SPOTS,...FACILITIES])pill(p.emoji+' '+p.name+(p.id==='home'||p.id==='shop'||p.id==='workshop'||p.id==='museum'?' ↳':''),p.x,p.y-5);
    for(const plot of PLOTS){const planted=st.save.life.plots[Number(plot.id)],progress=cropProgress(planted);drawFurniture('planter',plot.x,plot.y);ctx.font='32px "Segoe UI Emoji"';ctx.textAlign='center';ctx.fillText(planted.crop?(progress>=1?CROPS[planted.crop].emoji:'🌱'):'＋',plot.x,plot.y-30);pill(planted.crop?(progress>=1?'수확!':Math.floor(progress*100)+'%'+(planted.watered?' 💧':'')):'심기',plot.x,plot.y+9,progress>=1?'#ffe299':'#fff9e9');}
   }else{
    const inside=ROOMS[room as Exclude<RoomID,'island'>];pill(inside.label+' · E',550,310,'#fff4ce');pill('밖으로 나가기 ↓',550,675);
   }
   const online=st.network.scene;
   const remote=online.players.filter(p=>p.id!==online.selfId&&(p.room??'island')===room).map(p=>{let smooth=remotePositions.get(p.id),snap=!smooth||smooth.room!==room||distance(smooth,p)>600;if(snap){smooth={x:p.x,y:p.y,room};remotePositions.set(p.id,smooth!);}else{smooth!.x+=(p.x-smooth!.x)*Math.min(1,dt*12);smooth!.y+=(p.y-smooth!.y)*Math.min(1,dt*12);}return {i:p.character,x:smooth!.x,y:smooth!.y,remote:p,snap};});
   for(const id of remotePositions.keys())if(!online.players.some(p=>p.id===id&&(p.room??'island')===room))remotePositions.delete(id);
   const decor=outside?(st.visiting?online.island?.placed??[]:st.save.placed):room==='home'?(st.visiting?online.island?.roomPlaced??[]:st.save.life.roomPlaced):[];
   type Entity={i:number;x:number;y:number;remote?:OnlinePlayer;snap?:boolean;kind?:string;scenery?:typeof SCENERY[number]};
   const people:Entity[]=[...(outside?FRIENDS.map((f,i)=>({i,x:i===st.save.character?pos.x:f.x,y:i===st.save.character?pos.y:f.y})):[{i:st.save.character,...pos}]),...(outside?[{i:6,x:MAYOR.x,y:MAYOR.y}]:[]),...remote,...decor.map(p=>({i:-1,x:p.x,y:p.y,kind:p.kind})),...(outside?SCENERY.map(p=>({i:-2,x:p.x,y:p.y,scenery:p})):[])];
   people.sort((a,b)=>a.y-b.y).forEach(p=>{
    if(!visible(p))return;
    if(p.scenery){if(nature){const tree=p.scenery;ctx.save();ctx.fillStyle='rgba(28,69,46,.14)';ctx.beginPath();ctx.ellipse(p.x+25,p.y+1,tree.size*.25,tree.size*.08,-.15,0,Math.PI*2);ctx.fill();ctx.restore();drawNature(ctx,nature,tree.cell,tree.x,tree.y,tree.size,reduced?0:Math.sin(clock*.85+tree.phase)*.012);}return;}
    if(p.kind){drawFurniture(p.kind,p.x,p.y);return;}
    if(p.remote){const emote=p.remote.emote&&Date.now()<(p.remote.emoteUntil||0),pose:Motion=emote?(p.remote.emote==='👋'?'wave':'celebrate'):p.snap?'idle':p.remote.motion??'idle';drawPerson(p.i,p.x,p.y,pose,false,p.remote);if(emote)pill(p.remote.emote!,p.x,p.y-145,'#ffffff');}
    else if(p.i<6){const isPlayer=p.i===st.save.character,self=isPlayer?online.players.find(p=>p.id===online.selfId):undefined,emote=self?.emote&&Date.now()<(self.emoteUntil||0);const pose:Motion=emote?(self!.emote==='👋'?'wave':'celebrate'):isPlayer?motion:distance(pos,p)<230&&(clock+p.i*3)%17<1.8?'wave':'idle';drawPerson(p.i,p.x,p.y,pose,isPlayer);if(emote)pill(self!.emote!,pos.x,pos.y-145,'#ffffff');}
    else{if(mayor){const width=mayor.naturalWidth/mayor.naturalHeight*128;ctx.drawImage(mayor,p.x-width/2,p.y-128+Math.sin(clock*2)*2,width,128);}pill('촌장 호현',p.x,p.y+24,'#ffd979','#674823');if(!st.save.mayorMet||(!st.save.explorationReward&&st.save.explored.length===REGIONS.length))pill('!',p.x+30,p.y-125,'#ffd979');}
   });
   if(outside&&nature&&!reduced){for(let i=0;i<5;i++){const x=(clock*29+i*1020)%5200-200,y=300+i*560+Math.sin(clock*.2+i)*70;if(visible({x,y}))drawNature(ctx,nature,7,x,y,65,Math.sin(clock*1.5+i)*.05);}for(let i=0;i<7;i++){const x=1000+i*360+Math.sin(clock*.5+i)*35,y=1780+(i%3)*170+Math.cos(clock*.7+i)*18;if(visible({x,y}))drawNature(ctx,nature,6,x,y,26+Math.abs(Math.sin(clock*8+i))*12);}}
   if(st.placing&&!st.visiting)pill('클릭해서 가구 놓기',pos.x,pos.y-150,'#ffe299');
   ctx.restore();if(outside&&(st.visiting?online.island?.night:st.night)){ctx.fillStyle='rgba(35,37,94,.30)';ctx.fillRect(0,0,w,h);for(let i=0;i<28;i++){ctx.fillStyle='rgba(255,243,144,.6)';ctx.beginPath();ctx.arc((i*97)%w,(i*83)%h,2,0,Math.PI*2);ctx.fill();}}
   frame=requestAnimationFrame(render);
  };frame=requestAnimationFrame(render);
  return()=>{alive=false;cancelAnimationFrame(frame);observer.disconnect();preference.removeEventListener('change',preferenceChanged);window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);c.removeEventListener('pointerdown',click);api.current=null;};
 },[api]);
 return <canvas ref={canvas} className="world" aria-label="여섯섬 게임. 방향키 또는 WASD로 이동하고 E로 상호작용합니다." tabIndex={0}/>;
}
