import {IslandRoom} from './multiplayer-transport.ts';
import {cleanText,EMOTES,MAX_PLAYERS,PEER_PREFIX,readIsland,readPlayer,readPlayers,roomCode,type OnlinePlayer,type SharedIsland,type ChatLine,type Emote} from './multiplayer-protocol.ts';

type LocalPlayer=Omit<OnlinePlayer,'id'>;
export type SessionView={status:'offline'|'connecting'|'connected'|'error';role:'host'|'guest'|null;room:string;selfId:string;players:OnlinePlayer[];messages:ChatLine[];error:string};
export type OnlineScene={players:OnlinePlayer[];island:SharedIsland|null;selfId:string;visiting:boolean};
type Callbacks={local:()=>LocalPlayer;island:()=>SharedIsland;arrive:(host:OnlinePlayer)=>void;exit:()=>void;diagnostic?:(message:string)=>void};
const emptyView=():SessionView=>({status:'offline',role:null,room:'',selfId:'',players:[],messages:[],error:''});
const emptyScene=():OnlineScene=>({players:[],island:null,selfId:'',visiting:false});
type Wire=Record<string,unknown>;

// Only the host distributes canonical state. Network state stays out of Save.
export class IslandSession {
 view=emptyView();
 scene=emptyScene();
 private callbacks:Callbacks;
 private listeners=new Set<()=>void>();
 private room:IslandRoom|null=null;
 private members=new Map<string,OnlinePlayer>();
 private pending=new Map<string,{nonce:string;time:number}>();
 private generation=0;
 private timer:ReturnType<typeof setInterval>|null=null;
 private deadline:ReturnType<typeof setTimeout>|null=null;
 private lastSeen=new Map<string,number>();
 private chatTimes=new Map<string,number>();
 private emoteTimes=new Map<string,number>();
 private rosterSignature='';
 private poseSignature='';
 private islandSignature='';
 private lastPose=0;
 private lastWorld=0;
 private lastHello=0;
 private lastHostSeen=0;
 private sequence=0;
 private lastSentChat=0;
 private joined=false;
 constructor(callbacks:Callbacks){this.callbacks=callbacks;}
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
 private notify(){for(const listener of this.listeners)listener();}
 private update(patch:Partial<SessionView>){this.view={...this.view,...patch};this.notify();}
 private roster(players:OnlinePlayer[]){this.scene.players=players;this.room?.retain(players.map(p=>p.id));const signature=JSON.stringify(players.map(p=>[p.id,p.name,p.character]));if(signature!==this.rosterSignature){this.rosterSignature=signature;this.update({players});}}
 private sendHost(message:unknown){return this.room?.send(PEER_PREFIX+this.view.room,message)??false;}
 private broadcast(message:unknown){return this.members.size<=1||this.room?.send('*',message)===true;}
 private addChat(line:ChatLine){this.update({messages:[...this.view.messages,line].slice(-60)});}
 private hostChat(name:string,text:string,system=false){const line={id:this.view.selfId+'-'+(++this.sequence),name,text,system};this.addChat(line);this.broadcast({v:1,type:'chat',line});}
 private world(){const island=this.callbacks.island();return readIsland({placed:island.placed.slice(0,50).map((p,i)=>({...p,id:'shared-'+i})),night:island.night})??{placed:[],night:island.night};}
 private worldPacket(){return {v:1,type:'world',hostId:this.view.selfId,players:[...this.members.values()],island:this.world(),sentAt:Date.now()};}
 private stopDeadline(){if(this.deadline)clearTimeout(this.deadline);this.deadline=null;}
 leave(error=''){
  const wasGuest=this.view.role==='guest';++this.generation;this.stopDeadline();if(this.timer)clearInterval(this.timer);this.timer=null;
  const room=this.room;this.room=null;this.members.clear();this.pending.clear();this.lastSeen.clear();this.chatTimes.clear();this.emoteTimes.clear();this.joined=false;
  this.rosterSignature='';this.poseSignature='';this.islandSignature='';this.lastPose=0;this.lastWorld=0;this.lastHello=0;this.lastSentChat=0;
  this.scene=emptyScene();this.view={...emptyView(),status:error?'error':'offline',error};room?.close();if(wasGuest)this.callbacks.exit();this.notify();
 }
 async start(role:'host'|'guest',input=''){
  this.leave();const code=role==='host'?'':roomCode(input);
  if(code===null){this.update({status:'error',error:'초대 링크 또는 10자리 방 코드를 확인해 주세요.'});return;}
  const generation=++this.generation;this.update({status:'connecting',role,room:code});
  this.deadline=setTimeout(()=>{if(generation===this.generation)this.leave('열려 있는 방을 찾지 못했어요. 방 코드와 방장의 접속 상태를 확인하고 다시 참가해 주세요.');},25000);
  try{
   const room=await IslandRoom.create(role==='host',code);
   if(generation!==this.generation){room.close();return;}
   this.room=room;this.scene.selfId=room.id;this.update({selfId:room.id,room:room.code});
   await room.connect((id,data)=>{if(generation!==this.generation)return;if(role==='host')this.receiveGuest(id,data);else this.receiveHost(data);},detail=>{
    if(generation!==this.generation)return;this.callbacks.diagnostic?.(detail);this.leave('실시간 연결이 끊어졌어요. 인터넷 연결을 확인하고 다시 참가해 주세요.');
   });
   if(generation!==this.generation)return;
   if(role==='host'){
    const player=readPlayer(this.callbacks.local(),room.id);if(!player){this.leave('캐릭터 정보를 확인할 수 없어요. 다시 시작해 주세요.');return;}
    this.members.set(room.id,player);this.stopDeadline();this.update({status:'connected'});this.roster([...this.members.values()]);
    this.addChat({id:'welcome',name:'여섯섬',text:'섬을 열었어요. 초대 링크를 친구에게 보내 주세요.',system:true});
   }
   this.startTimer(generation);
  }catch(error){
   if(generation!==this.generation)return;this.callbacks.diagnostic?.(String(error));this.leave('멀티플레이에 연결하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.');
  }
 }
 private removeGuest(id:string){
  const player=this.members.get(id);if(!player||id===this.view.selfId)return;
  this.members.delete(id);this.lastSeen.delete(id);this.chatTimes.delete(id);this.emoteTimes.delete(id);
  this.roster([...this.members.values()]);this.hostChat('여섯섬',player.name+' 님이 섬을 떠났어요.',true);this.broadcast(this.worldPacket());
 }
 private packet(data:unknown):Wire|null{if(!data||typeof data!=='object'||Array.isArray(data))return null;const packet=data as Wire;return packet.v===1&&typeof packet.type==='string'?packet:null;}
 private receiveGuest(id:string,data:unknown){
  const packet=this.packet(data);if(!packet)return;
  if(packet.type==='hello'){
   if(this.members.has(id)){this.room?.send(id,this.worldPacket());return;}
   const player=readPlayer(packet.player,id);if(!player)return;
   if(this.members.size>=MAX_PLAYERS){this.room?.send(id,{v:1,type:'reject',reason:'방이 가득 찼어요. 최대 6명까지 함께할 수 있어요.'});return;}
   // Replayed hellos cannot fill the room: each admission needs a fresh signed answer.
   const existing=this.pending.get(id),challenge=existing&&Date.now()-existing.time<15000?existing:{nonce:crypto.randomUUID(),time:Date.now()};
   const {nonce}=challenge;this.pending.delete(id);this.pending.set(id,challenge);
   if(this.pending.size>16)this.pending.delete(this.pending.keys().next().value!);
   this.room?.send(id,{v:1,type:'challenge',nonce});return;
  }
  if(packet.type==='join'){
   const pending=this.pending.get(id);if(!pending||pending.nonce!==packet.nonce||Date.now()-pending.time>15000||this.members.has(id))return;
   this.pending.delete(id);const player=readPlayer(packet.player,id);if(!player)return;
   if(this.members.size>=MAX_PLAYERS){this.room?.send(id,{v:1,type:'reject',reason:'방이 가득 찼어요. 최대 6명까지 함께할 수 있어요.'});return;}
   this.members.set(id,player);this.lastSeen.set(id,Date.now());this.roster([...this.members.values()]);this.broadcast(this.worldPacket());this.hostChat('여섯섬',player.name+' 님이 놀러 왔어요.',true);return;
  }
  if(!this.members.has(id))return;this.lastSeen.set(id,Date.now());
  if(packet.type==='move'){
   const player=readPlayer(packet.player,id);if(player){const previous=this.members.get(id)!;this.members.set(id,{...player,emote:previous.emote,emoteUntil:previous.emoteUntil});}
  }else if(packet.type==='chat')this.chatFrom(id,packet.text);
  else if(packet.type==='emote')this.emoteFrom(id,packet.emote);
  else if(packet.type==='leave')this.removeGuest(id);
 }
 private receiveHost(data:unknown){
  const packet=this.packet(data);if(!packet)return;
  if(packet.type==='challenge'&&!this.joined){if(typeof packet.nonce==='string'&&/^[a-f0-9-]{36}$/.test(packet.nonce))this.sendHost({v:1,type:'join',nonce:packet.nonce,player:this.callbacks.local()});return;}
  if(packet.type==='closed'){this.leave('방장이 섬을 닫았어요. 내 섬으로 돌아왔습니다.');return;}
  if(packet.type==='reject'){this.leave(cleanText(packet.reason,150)||'이 방에는 참가할 수 없어요.');return;}
  if(packet.type==='world'){
   const players=readPlayers(packet.players,packet.sentAt),island=readIsland(packet.island);
   if(!players||!island||packet.hostId!==PEER_PREFIX+this.view.room)return;
   if(!players.some(p=>p.id===this.view.selfId)){if(this.joined)this.leave('연결이 오래 끊겨 내 섬으로 돌아왔어요. 다시 참가해 주세요.');return;}
   const host=players.find(p=>p.id===packet.hostId);if(!host)return;
   this.lastHostSeen=Date.now();this.scene.island=island;this.scene.visiting=true;this.roster(players);
   if(!this.joined){this.joined=true;this.stopDeadline();this.update({status:'connected'});this.callbacks.arrive(host);}
  }else if(packet.type==='poses'&&this.joined){const players=readPlayers(packet.players,packet.sentAt);if(players){this.lastHostSeen=Date.now();this.roster(players);}}
  else if(packet.type==='chat'&&this.joined){
   const line=packet.line as ChatLine;if(!line||typeof line!=='object')return;
   const text=cleanText(line.text,120),name=cleanText(line.name,12),id=cleanText(line.id,150);
   if(text&&name&&id&&!this.view.messages.some(m=>m.id===id))this.addChat({id,name,text,system:line.system===true});
  }
 }
 private startTimer(generation:number){if(this.timer)clearInterval(this.timer);this.timer=setInterval(()=>{if(generation===this.generation)this.tick();},250);this.tick();}
 private tick(){
  const now=Date.now();const local=readPlayer(this.callbacks.local(),this.view.selfId);if(!local)return;
  if(this.view.role==='host'){
   const previous=this.members.get(local.id);this.members.set(local.id,{...local,emote:previous?.emote,emoteUntil:previous?.emoteUntil});
   for(const [id,time] of this.lastSeen)if(now-time>45000)this.removeGuest(id);
   const players=[...this.members.values()];this.roster(players);const signature=JSON.stringify(players);
   if(signature!==this.poseSignature||now-this.lastPose>2500){if(this.broadcast({v:1,type:'poses',players,sentAt:now})){this.poseSignature=signature;this.lastPose=now;}}
   if(now-this.lastWorld>1000){this.lastWorld=now;const island=this.world(),signature=JSON.stringify(island);if(signature!==this.islandSignature&&this.broadcast({v:1,type:'world',hostId:local.id,players,island,sentAt:now}))this.islandSignature=signature;}
  }else if(!this.joined){
   if(now-this.lastHello>2500){this.lastHello=now;this.sendHost({v:1,type:'hello',player:local});}
  }else{
   if(now-this.lastHostSeen>45000){this.leave('방장의 응답이 없어 내 섬으로 돌아왔어요. 다시 참가해 주세요.');return;}
   const signature=JSON.stringify(local);if(signature!==this.poseSignature||now-this.lastPose>2500){if(this.sendHost({v:1,type:'move',player:local})){this.poseSignature=signature;this.lastPose=now;}}
  }
 }
 private chatFrom(id:string,value:unknown){const text=cleanText(value,100),player=this.members.get(id),now=Date.now();if(!text||!player||now-(this.chatTimes.get(id)||0)<500)return false;this.chatTimes.set(id,now);this.hostChat(player.name,text);return true;}
 sendChat(value:string){
  const text=cleanText(value,100),now=Date.now();if(!text||this.view.status!=='connected'||now-this.lastSentChat<1000)return false;
  const sent=this.view.role==='host'?this.chatFrom(this.view.selfId,text):this.sendHost({v:1,type:'chat',text});if(sent)this.lastSentChat=now;return sent;
 }
 private emoteFrom(id:string,value:unknown){const player=this.members.get(id),now=Date.now();if(!player||!EMOTES.includes(value as Emote)||now-(this.emoteTimes.get(id)||0)<700)return;this.emoteTimes.set(id,now);this.members.set(id,{...player,emote:value as Emote,emoteUntil:now+4000});}
 sendEmote(emote:Emote){if(this.view.status!=='connected')return;if(this.view.role==='host')this.emoteFrom(this.view.selfId,emote);else this.sendHost({v:1,type:'emote',emote});}
}

