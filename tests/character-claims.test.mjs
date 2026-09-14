import test from 'node:test';
import assert from 'node:assert/strict';
import {IslandSession} from '../app/multiplayer-session.ts';
import {PEER_PREFIX,readPlayers} from '../app/multiplayer-protocol.ts';
import {freshSave,SPAWN} from '../app/game-data.ts';

const code='ABCDEFGH23',hostId=PEER_PREFIX+code;
const player=(character,id)=>({id,character,name:'친구'+character,...SPAWN,facing:1});
function room(){
 const sent=[],save=freshSave(),session=new IslandSession({local:()=>player(0,hostId),island:()=>({placed:[],night:false}),arrive:()=>{},exit:()=>{}});
 session.view={...session.view,status:'connected',role:'host',room:code,selfId:hostId};
 session.character=0;session.members.set(hostId,player(0,hostId));
 session.room={send:(to,message)=>{sent.push({to,message});return true;},retain:()=>{},close:()=>{}};
 const hello=id=>{session.receiveGuest(id,{v:1,type:'hello',selection:1,player:player(1,id)});return session.pending.get(id)?.nonce;};
 const join=(id,character,nonce=hello(id))=>session.receiveGuest(id,{v:1,type:'join',nonce,player:player(character,id)});
 return {session,sent,hello,join,save};
}
test('host commits one claim atomically and lets the loser retry a different character',()=>{
 const {session,hello,join,sent}=room(),a=hello('guestA'),b=hello('guestB');
 assert.equal(session.members.size,1);join('guestA',1,a);join('guestB',1,b);
 assert.equal(session.members.size,2);assert.equal(session.members.has('guestB'),false);
 assert.match(sent.findLast(p=>p.to==='guestB'&&p.message.error)?.message.error,/먼저 선택/);
 join('guestB',2,b);assert.deepEqual([...session.members.values()].map(p=>p.character),[0,1,2]);
 session.leave();
});
test('expired challenge cannot claim; a fresh hello renews selection without admission',()=>{
 const {session,hello,join}=room(),old=hello('guestA');session.pending.get('guestA').time=Date.now()-16000;
 join('guestA',1,old);assert.equal(session.members.size,1);
 const renewed=hello('guestA');assert.notEqual(renewed,old);join('guestA',1,renewed);assert.equal(session.members.size,2);session.leave();
});
test('move and repeated join cannot change a claimed identity; departure and timeout release it',()=>{
 const {session,hello,join}=room();join('guestA',1);const accepted=session.members.get('guestA');
 session.receiveGuest('guestA',{v:1,type:'move',player:{...accepted,character:0,x:2600}});
 assert.deepEqual(session.members.get('guestA'),accepted);join('guestA',2);assert.equal(session.members.get('guestA').character,1);
 session.receiveGuest('guestA',{v:1,type:'leave'});assert.equal(session.members.has('guestA'),false);
 join('guestB',1,hello('guestB'));session.lastSeen.set('guestB',Date.now()-46000);session.tick();
 assert.equal(session.members.has('guestB'),false);join('guestC',1);assert.equal(session.members.get('guestC').character,1);session.leave();
});
test('six unique characters are the capacity and malformed duplicate rosters are rejected',()=>{
 const {session,join,sent}=room();for(let i=1;i<6;i++)join('guest'+i,i);
 join('overflow',3);assert.equal(session.members.size,6);assert.ok(sent.some(p=>p.to==='overflow'&&p.message.type==='lobby'&&p.message.error));
 const roster=[...session.members.values()];assert.ok(readPlayers(roster));assert.equal(readPlayers([player(1,'a'),player(1,'b')]),null);session.leave();
});
