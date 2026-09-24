import test from 'node:test';
import assert from 'node:assert/strict';
import {inviteChips,inviteEndReason,secondsLeft} from '../app/lounge/invite-text.ts';

const players=[{id:'a',actor:0},{id:'b',actor:3},{id:'c',actor:6}];
const invite=(p={})=>({id:'i',game:'seotda',from:'a',invited:['b','c'],accepted:['a'],declined:[],status:'waiting',expires:0,matchId:null,required:3,stake:10000,...p});

test('invite chips show accepted, declined and waiting friends',()=>{
 const chips=inviteChips(invite({accepted:['a','b'],declined:['c']}),players,'a');
 assert.deepEqual(chips.map(c=>[c.name,c.state]),[['나','accepted'],['승준','accepted'],['호현','declined']]);
});
test('cancel reason names the friend who declined',()=>{
 const prev=invite(),next=invite({declined:['b'],status:'cancelled'});
 assert.equal(inviteEndReason(prev,next,players,players,'a'),'승준이 다음에 하기로 해서 섯다 인원이 모자라요.');
 const nextC=invite({declined:['c'],status:'cancelled'});
 assert.equal(inviteEndReason(prev,nextC,players,players,'a'),'호현이 다음에 하기로 해서 섯다 인원이 모자라요.');
 const nextD=invite({declined:['b'],status:'cancelled',from:'c',invited:['a','b'],accepted:['c']});
 assert.equal(inviteEndReason(invite({from:'c',invited:['a','b'],accepted:['c']}),nextD,[{id:'a',actor:1},...players.slice(1)],[{id:'a',actor:1},...players.slice(1)],'a'),'승준이 다음에 하기로 해서 섯다 인원이 모자라요.');
});
test('cancel reason for departures, sender cancel and expiry',()=>{
 const prev=invite({accepted:['a','b']}),next=invite({accepted:['a','b'],status:'cancelled'});
 assert.equal(inviteEndReason(prev,next,players.filter(p=>p.id!=='b'),players,'a'),'승준이 마을을 떠나서 섯다 초대가 취소됐어요.');
 assert.equal(inviteEndReason(invite(),invite({status:'cancelled'}),players,players,'b'),'도원이 섯다 초대를 취소했어요.');
 assert.equal(inviteEndReason(invite(),invite({status:'cancelled'}),players,players,'a'),'섯다 초대를 취소했어요.');
 assert.match(inviteEndReason(invite(),invite({status:'expired'}),players,players,'a'),/시간이 지났어요/);
});
test('seconds left uses server clock offset',()=>{
 assert.equal(secondsLeft(100000,10000,0),90);
 assert.equal(secondsLeft(100000,10000,5000),85);
 assert.equal(secondsLeft(100000,200000,0),0);
});
