// Actual Supabase Broadcast integration; in-memory saves only.
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import {IslandSession} from '../app/multiplayer-session.ts';
import {freshSave,SPAWN} from '../app/game-data.ts';
import {visitingSpawn} from '../app/multiplayer-protocol.ts';
globalThis.WebSocket=WebSocket;
const sessions=[];
const fixtures=[];
function makePlayer(character){
 const save=freshSave(character),position={...SPAWN},index=sessions.length;let returned=0;
 const session=new IslandSession({local:()=>({...position,facing:1,character,name:save.names[character]}),island:()=>({placed:save.placed,roomPlaced:save.life.roomPlaced,night:false}),arrive:host=>Object.assign(position,visitingSpawn(host)),exit:()=>{returned++;},diagnostic:message=>console.error(`Client ${index}: ${message}`)});
 sessions.push(session);const fixture={session,save,position,get returned(){return returned;}};fixtures.push(fixture);return fixture;
}
async function until(check,label,timeout=35000){const start=Date.now();while(!check()){if(Date.now()-start>timeout||sessions.some(s=>s.view.status==='error'))throw new Error(`${label}: ${sessions.map(s=>s.view.status+':'+s.view.error).join(' | ')}`);await new Promise(r=>setTimeout(r,50));}}
try{
 const host=makePlayer(0),guest=makePlayer(1),friend=makePlayer(1);
 await host.session.start('host');await until(()=>host.session.view.status==='connected','host opened');
 const code=host.session.view.room;await guest.session.start('guest',code);await until(()=>guest.session.view.status==='connected','first guest joined');await friend.session.start('guest',code);
 await until(()=>sessions.every(s=>s.view.status==='connected'&&s.view.players.length===3),'three real peers joined');
 console.log('PASS: host and two guests joined through Supabase Realtime Broadcast.');
 guest.position.x+=110;friend.position.y+=90;
 await until(()=>host.session.scene.players.some(p=>p.id===guest.session.view.selfId&&p.x===guest.position.x)&&friend.session.scene.players.some(p=>p.id===guest.session.view.selfId&&p.x===guest.position.x),'position broadcast');
 assert.notEqual(guest.session.view.selfId,friend.session.view.selfId);
 console.log('PASS: same-character guests move independently and positions reach the other guest.');
 assert.equal(guest.session.sendChat('강재가 놀러 왔어요!'),true);assert.equal(guest.session.sendChat('너무 빠른 두 번째 메시지'),false);await until(()=>sessions.every(s=>s.view.messages.some(m=>m.text==='강재가 놀러 왔어요!')),'chat broadcast');
 friend.session.sendEmote('👋');await until(()=>guest.session.scene.players.some(p=>p.id===friend.session.view.selfId&&p.emote==='👋'),'emote broadcast');
 console.log('PASS: chat and emotes travel between all three peers.');
 host.save.placed.push({id:'host-lamp',kind:'lamp',x:2500,y:1800});
 await until(()=>guest.session.scene.island?.placed[0]?.kind==='lamp'&&friend.session.scene.island?.placed[0]?.kind==='lamp','host furniture update');
 assert.deepEqual(guest.save.placed,[]);assert.deepEqual(friend.save.placed,[]);
 console.log('PASS: host furniture updates do not change guest saves.');
 host.save.life.roomPlaced.push({id:'inside-chair',kind:'chair',x:400,y:400});
 Object.assign(host.position,{x:550,y:550,room:'home'});Object.assign(guest.position,{x:650,y:550,room:'home'});
 await until(()=>friend.session.scene.players.some(p=>p.id===host.session.view.selfId&&p.room==='home')&&guest.session.scene.island?.roomPlaced?.length===1,'indoor location and furniture broadcast');
 assert.deepEqual(guest.save.life.roomPlaced,[]);assert.deepEqual(friend.save.life.roomPlaced,[]);
 console.log('PASS: indoor locations and host room furniture sync without changing guest home saves.');
 const extra=[makePlayer(2),makePlayer(3),makePlayer(4)];
 for(const [index,player] of extra.entries()){
  await player.session.start('guest',code);
  if(index===0){
   // Network fault injection: a join takes longer than the hello retry interval.
   const room=player.session.room,send=room.send.bind(room);
   room.send=(to,message)=>{if(message.type==='join'){setTimeout(()=>send(to,message),3500);return true;}return send(to,message);};
  }
  await until(()=>player.session.view.status==='connected','extra guest joined, including delayed handshake');
 }
 await until(()=>sessions.every(s=>s.view.players.length===6),'six players admitted');
 const overflow=makePlayer(5);await overflow.session.start('guest',code);
 await until(()=>overflow.session.view.status==='error','seventh player rejected');
 assert.match(overflow.session.view.error,/가득/);assert.equal(host.session.view.players.length,6);overflow.session.leave();
 for(const player of extra)player.session.leave();
 await until(()=>host.session.view.players.length===3&&guest.session.view.players.length===3,'extra guests departed');
 console.log('PASS: six-player room admits all six and rejects a seventh without disturbing the room.');
 friend.session.leave();await until(()=>host.session.view.players.length===2&&guest.session.view.players.length===2,'guest departure');
 host.session.leave();await until(()=>guest.session.view.status==='error','host shutdown');
 assert.equal(guest.returned,1);assert.deepEqual(guest.session.scene.players,[]);
 const pending=guest.session.start('host');guest.session.leave();await pending;await new Promise(r=>setTimeout(r,800));assert.equal(guest.session.view.status,'offline');assert.deepEqual(guest.session.scene.players,[]);
 console.log('PASS: guest exit, host shutdown, and cancelled connection clean up the room.');
}catch(error){console.error(error);process.exitCode=1;}finally{for(const session of sessions)session.leave();}

