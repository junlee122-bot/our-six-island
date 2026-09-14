// Actual Supabase Broadcast integration; all game saves remain in memory.
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import {IslandSession} from '../app/multiplayer-session.ts';
import {freshSave,SPAWN} from '../app/game-data.ts';
import {PEER_PREFIX,visitingSpawn} from '../app/multiplayer-protocol.ts';

globalThis.WebSocket=WebSocket;
const fixtures=[];
const pauses=[];
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const progress=save=>structuredClone({
 character:save.character,coins:save.coins,bag:save.bag,picked:save.picked,
 talked:save.talked,accepted:save.accepted,done:save.done,hearts:save.hearts,
 harvested:save.harvested,fishCaught:save.fishCaught,picnic:save.picnic,
 dayReward:save.dayReward,explored:save.explored,mayorMet:save.mayorMet,
 explorationReward:save.explorationReward,position:save.position,
 // Furniture and wardrobe have their own intentional mutations below.
 life:{...save.life,roomPlaced:[]},
});

function makePlayer(character){
 const save=freshSave(character),position={...SPAWN},index=fixtures.length;
 let returned=0,localCharacter=character;
 // Nonempty progress exposes accidental freshSave/character replacement on join.
 const others=[0,1,2,3,4,5].filter(id=>id!==character);
 save.coins=137+index;save.bag.apple=7;save.bag.wood=4;
 save.accepted=[others[0],others[1]];save.done=[others[0]];
 save.talked=[others[0],others[1]];save.hearts[others[0]]=3;
 save.harvested=8;save.fishCaught=2;save.mayorMet=true;
 const before=progress(save);
 const candidate=id=>({...position,appearance:save.wardrobe[id],facing:1,character:id,name:save.names[id]});
 const session=new IslandSession({
  local:()=>candidate(localCharacter),candidate,
  island:()=>({placed:save.placed,roomPlaced:save.life.roomPlaced,wardrobe:save.wardrobe,night:false}),
  arrive:host=>Object.assign(position,visitingSpawn(host)),
  exit:()=>{returned++;Object.assign(position,save.position);},
  diagnostic:message=>console.error(`Client ${index}: ${message}`),
 });
 const fixture={session,save,position,before,candidate,
  get returned(){return returned;},
  get localCharacter(){return localCharacter;},set localCharacter(value){localCharacter=value;},
 };
 fixtures.push(fixture);return fixture;
}

function diagnostics(){return fixtures.map((f,i)=>`${i}:${f.session.view.status}[${f.session.view.players.map(p=>p.character).join(',')}] ${f.session.view.error}`).join(' | ');}
async function until(check,label,timeout=35000){
 const start=Date.now();
 while(!check()){
  if(Date.now()-start>timeout)throw new Error(`${label}: ${diagnostics()}`);
  await delay(50);
 }
}
function unique(fixture){
 const players=fixture.session.scene.players;
 assert.equal(new Set(players.map(p=>p.character)).size,players.length,'canonical characters must be unique');
 assert.equal(new Set(players.map(p=>p.id)).size,players.length,'canonical player identities must be unique');
}
function self(fixture){return fixture.session.view.players.find(p=>p.id===fixture.session.view.selfId);}
function assertProgress(fixture){assert.deepEqual(progress(fixture.save),fixture.before,'joining as another character must preserve personal character and progress');}
async function enterLobby(fixture,code){
 await fixture.session.start('guest',code);
 await until(()=>fixture.session.view.status==='selecting','guest reached character lobby');
 assert.equal(fixture.session.view.claiming,null);
 assert.equal(fixture.session.scene.visiting,false,'selection must not enter the host island yet');
 assertProgress(fixture);
}
async function claim(fixture,id){
 assert.equal(fixture.session.claimCharacter(id),true,`claim ${id} should be sent`);
 await until(()=>fixture.session.view.status==='connected'&&self(fixture)?.character===id,`character ${id} admitted`);
 unique(fixture);assertProgress(fixture);
}

try{
 const host=makePlayer(0),first=makePlayer(3),second=makePlayer(4);
 await host.session.start('host');
 await until(()=>host.session.view.status==='connected','host opened');
 assert.equal(self(host).character,0);
 const code=host.session.view.room;
 await Promise.all([enterLobby(first,code),enterLobby(second,code)]);
 await until(()=>[first,second].every(f=>f.session.view.players.length===1),'both lobbies received host occupancy');
 assert.equal(host.session.view.players.length,1,'waiting guests do not reserve characters');

 // Both calls happen synchronously against the same available roster.
 assert.equal(first.session.claimCharacter(1),true);
 assert.equal(second.session.claimCharacter(1),true);
 await until(()=>[first,second].filter(f=>f.session.view.status==='connected').length===1
  &&[first,second].some(f=>f.session.view.status==='selecting'&&f.session.view.claiming===null&&f.session.view.error),
  'simultaneous claim has one winner and a recoverable loser');
 const winner=[first,second].find(f=>f.session.view.status==='connected');
 const loser=[first,second].find(f=>f!==winner);
 assert.equal(self(winner).character,1);
 assert.equal(host.session.view.players.length,2);
 assert.equal(loser.session.view.players.find(p=>p.character===1)?.id,winner.session.view.selfId);
 assertProgress(first);assertProgress(second);unique(host);
 await claim(loser,2);
 await until(()=>[host,winner,loser].every(f=>f.session.view.players.length===3),'three unique peers admitted');
 assert.deepEqual(host.session.view.players.map(p=>p.character).sort(),[0,1,2]);
 console.log('PASS: live character lobbies and simultaneous claims admit one winner; the loser retries another character without reconnecting.');

 winner.position.x+=110;loser.position.y+=90;
 await until(()=>host.session.scene.players.some(p=>p.id===winner.session.view.selfId&&p.x===winner.position.x)
  &&loser.session.scene.players.some(p=>p.id===winner.session.view.selfId&&p.x===winner.position.x),'position broadcast');
 assert.notEqual(winner.session.view.selfId,loser.session.view.selfId);
 assert.equal(self(winner).character,1);assert.equal(self(loser).character,2);
 console.log('PASS: room characters move independently while their saved home characters remain unchanged.');

 // Block normal local movement temporarily, so it cannot immediately undo a bad
 // server-side character mutation and hide a uniqueness bug from this assertion.
 const attackRoom=winner.session.room,normalSend=attackRoom.send.bind(attackRoom);
 attackRoom.send=(to,message)=>message.type==='move'?true:normalSend(to,message);
 pauses.push(()=>{attackRoom.send=normalSend;});
 try{
  const accepted=winner.candidate(1),markerX=accepted.x+19;
  assert.equal(normalSend(PEER_PREFIX+code,{v:1,type:'move',player:{...accepted,x:markerX}}),true);
  await until(()=>host.session.scene.players.some(p=>p.id===winner.session.view.selfId&&p.x===markerX),'control packet before forged character');
  assert.equal(normalSend(PEER_PREFIX+code,{v:1,type:'move',player:{...accepted,x:markerX+3,character:0,name:'forged host character'}}),true);
  const start=Date.now();
  while(Date.now()-start<1600){
   for(const f of [host,winner,loser])unique(f);
   assert.equal(host.session.scene.players.find(p=>p.id===winner.session.view.selfId)?.character,1);
   await delay(20);
  }
 }finally{attackRoom.send=normalSend;pauses.pop();}

 // The host's admission is pinned too, even if the local callback changes later.
 host.localCharacter=1;host.position.x+=17;
 await until(()=>loser.session.scene.players.some(p=>p.id===host.session.view.selfId&&p.x===host.position.x),'host moved after local callback changed');
 assert.equal(self(host).character,0);
 assert.equal(loser.session.scene.players.find(p=>p.id===host.session.view.selfId).character,0);
 unique(host);host.localCharacter=0;assertProgress(host);
 console.log('PASS: signed guest move payloads and changed host local callbacks cannot take an occupied character.');

 winner.save.wardrobe[1]={hair:'honey',top:'ocean',hat:'straw',glasses:'sun',clip:true};winner.position.motion='run';
 await until(()=>loser.session.scene.players.some(p=>p.id===winner.session.view.selfId&&p.appearance?.hat==='straw'&&p.motion==='run')
  &&host.session.view.players.some(p=>p.id===winner.session.view.selfId&&p.appearance?.hair==='honey'),'claimed character appearance and motion');
 assert.notEqual(loser.save.wardrobe[1].hat,'straw');winner.position.motion='idle';
 await until(()=>host.session.scene.players.some(p=>p.id===winner.session.view.selfId&&p.motion==='idle'),'stopped animation');
 host.save.wardrobe[4].hair='rose';
 await until(()=>winner.session.scene.island?.wardrobe?.[4]?.hair==='rose','host NPC appearance');
 assert.equal(winner.save.wardrobe[4].hair,'ink');
 assertProgress(winner);assertProgress(loser);
 console.log('PASS: customization and run/idle use the claimed avatar; shared NPC styles do not replace personal wardrobe.');

 assert.equal(winner.session.sendChat('강재가 놀러 왔어요!'),true);
 assert.equal(winner.session.sendChat('너무 빠른 두 번째 메시지'),false);
 await until(()=>[host,winner,loser].every(f=>f.session.view.messages.some(m=>m.text==='강재가 놀러 왔어요!')),'chat broadcast');
 loser.session.sendEmote('👋');
 await until(()=>winner.session.scene.players.some(p=>p.id===loser.session.view.selfId&&p.emote==='👋'),'emote broadcast');
 console.log('PASS: chat rate limiting and emotes work between all three peers.');

 host.save.placed.push({id:'host-lamp',kind:'lamp',x:2500,y:1800});
 await until(()=>winner.session.scene.island?.placed[0]?.kind==='lamp'&&loser.session.scene.island?.placed[0]?.kind==='lamp','host furniture update');
 assert.deepEqual(winner.save.placed,[]);assert.deepEqual(loser.save.placed,[]);
 host.save.life.roomPlaced.push({id:'inside-chair',kind:'chair',x:400,y:400});
 Object.assign(host.position,{x:550,y:550,room:'home'});Object.assign(winner.position,{x:650,y:550,room:'home'});
 await until(()=>loser.session.scene.players.some(p=>p.id===host.session.view.selfId&&p.room==='home')
  &&winner.session.scene.island?.roomPlaced?.length===1,'indoor location and furniture broadcast');
 assert.deepEqual(winner.save.life.roomPlaced,[]);assert.deepEqual(loser.save.life.roomPlaced,[]);
 console.log('PASS: indoor locations and host furniture sync without modifying visitor saves.');

 const extra=[makePlayer(0),makePlayer(0),makePlayer(0)];
 for(const [index,player] of extra.entries()){
  await enterLobby(player,code);
  let restore;
  if(index===0){
   // A claim crosses the periodic hello refresh; it must retain a usable challenge.
   const room=player.session.room,send=room.send.bind(room);
   room.send=(to,message)=>{
    if(message.type==='join'){setTimeout(()=>send(to,message),3500);return true;}
    return send(to,message);
   };
   restore=()=>{room.send=send;};pauses.push(restore);
  }
  try{await claim(player,index+3);}finally{if(restore){restore();pauses.pop();}}
 }
 const active=[host,winner,loser,...extra];
 await until(()=>active.every(f=>f.session.view.players.length===6),'all six characters occupied');
 for(const f of active){unique(f);assert.deepEqual(f.session.view.players.map(p=>p.character).sort(),[0,1,2,3,4,5]);assertProgress(f);}
 const overflow=makePlayer(5);await enterLobby(overflow,code);
 await until(()=>overflow.session.view.players.length===6,'full roster shown to seventh client');
 // An occupied choice may be rejected locally, or sent then rejected by the host.
 overflow.session.claimCharacter(1);
 await until(()=>overflow.session.view.status==='selecting'&&overflow.session.view.claiming===null,'full-room claim remains in lobby');
 assert.equal(host.session.view.players.length,6);assertProgress(overflow);
 console.log('PASS: six distinct characters fill the room; a seventh client can wait in the lobby without displacing anyone.');

 winner.session.leave();
 await until(()=>host.session.view.players.length===5&&overflow.session.view.players.length===5
  &&!overflow.session.view.players.some(p=>p.character===1),'departure releases character in waiting lobby');
 assert.equal(winner.returned,1);assertProgress(winner);
 await claim(overflow,1);
 await until(()=>[host,loser,...extra,overflow].every(f=>f.session.view.players.length===6),'released character reclaimed');
 assert.equal(self(overflow).character,1);assert.equal(overflow.save.character,5);assertProgress(overflow);
 for(const f of [host,loser,...extra,overflow])unique(f);
 console.log('PASS: leaving releases the exact character for a waiting client; original saved identities and progress remain intact.');

 for(const player of extra)player.session.leave();
 await until(()=>[host,loser,overflow].every(f=>f.session.view.players.length===3),'extra guests departed');
 host.session.leave();
 await until(()=>[loser,overflow].every(f=>f.session.view.status==='error'),'host shutdown');
 for(const player of [loser,overflow]){
  assert.equal(player.returned,1);assert.deepEqual(player.session.scene.players,[]);assertProgress(player);
 }
 const cancelled=makePlayer(0),pending=cancelled.session.start('host');
 cancelled.session.leave();await pending;await delay(800);
 assert.equal(cancelled.session.view.status,'offline');assert.deepEqual(cancelled.session.scene.players,[]);
 for(const fixture of fixtures)assertProgress(fixture);
 console.log('PASS: host shutdown and cancelled startup clean up sessions without replacing personal saves.');
}catch(error){console.error(error);console.error(diagnostics());process.exitCode=1;}
finally{for(const restore of pauses)restore();for(const fixture of fixtures)fixture.session.leave();}
