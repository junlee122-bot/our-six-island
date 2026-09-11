import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,SPAWN,walkable} from '../app/game-data.ts';
import {newRoomCode,roomCode,inviteUrl,readPlayer,readPlayers,readIsland,persistentPosition,visitingSpawn} from '../app/multiplayer-protocol.ts';

test('room codes work in links under the GitHub Pages project path',()=>{
 const code=newRoomCode();assert.equal(code.length,10);assert.equal(roomCode(code),code);
 assert.equal(roomCode(code.slice(0,5)+' '+code.slice(5)),code);
 const url=inviteUrl('https://junlee122-bot.github.io/our-six-island/?v=123',code);
 assert.equal(new URL(url).pathname,'/our-six-island/');assert.equal(new URL(url).search,'?v=123');assert.equal(roomCode(url),code);
 assert.equal(roomCode('O0I1 invalid'),null);assert.equal(roomCode('https://example.com/#not-a-room'),null);
});
test('network player identity comes from the connection and invalid coordinates are rejected',()=>{
 const player={id:'forged',character:1,name:' 강재 ',x:SPAWN.x,y:SPAWN.y,facing:-1};
 assert.equal(readPlayer(player,'actual-peer').id,'actual-peer');assert.equal(readPlayer(player).name,'강재');
 for(const x of [NaN,Infinity,-1,4801])assert.equal(readPlayer({...player,x}),null);
 assert.equal(readPlayer({...player,character:7}),null);assert.equal(readPlayers([player,player]),null);
 assert.equal(readPlayers(Array.from({length:7},(_,i)=>({...player,id:`peer-${i}`}))),null);
});
test('received furniture is bounded and copied into a separate display snapshot',()=>{
 const own=freshSave();own.placed=[{id:'my-chair',kind:'chair',x:2400,y:1800}];
 const host={placed:[{id:'host-lamp',kind:'lamp',x:2300,y:1800}],night:true};const display=readIsland(host);
 assert.ok(display);display.placed[0].x=2100;assert.equal(host.placed[0].x,2300);assert.equal(own.placed[0].id,'my-chair');
 assert.equal(readIsland({placed:[{id:'bad',kind:'unknown',x:10,y:10}],night:false}),null);
 assert.equal(readIsland({placed:Array.from({length:51},(_,i)=>({id:`a${i}`,kind:'plant',x:2400,y:1800})),night:false}),null);
});
test('emote duration survives different host and guest device clocks',()=>{
 const hostNow=Date.now()-120000;
 const players=readPlayers([{id:'host',character:0,name:'도원',...SPAWN,facing:1,emote:'👋',emoteUntil:hostNow+4000}],hostNow);
 assert.ok(players[0].emoteUntil>Date.now()+3500);assert.ok(players[0].emoteUntil<=Date.now()+4000);
});
test('visiting never replaces the home position saved by autosave or export',()=>{
 const origin={x:2400,y:1480},visitor={x:4000,y:1400};const saved=persistentPosition(origin,visitor,SPAWN);
 assert.deepEqual(saved,origin);saved.x=1;assert.equal(origin.x,2400);
 assert.deepEqual(persistentPosition(null,visitor,SPAWN),visitor);
 assert.deepEqual(persistentPosition(null,undefined,SPAWN),SPAWN);
 assert.ok(walkable(visitingSpawn(SPAWN)));
});
test('maximum furniture and player snapshot stays below the JSON transport limit',()=>{
 const players=Array.from({length:6},(_,i)=>({id:`peer-${i}`,name:'가'.repeat(12),character:i,x:2400.1234567890123,y:1480.1234567890123,facing:1}));
 const placed=Array.from({length:50},(_,i)=>({id:'a'.repeat(60)+i,kind:'plant',x:2400.1234567890123,y:1800.1234567890123}));
 const data={v:1,type:'world',hostId:'host',players,island:{placed,night:false}};
 assert.ok(readPlayers(players));assert.ok(readIsland(data.island));assert.ok(Buffer.byteLength(JSON.stringify(data))<16300);
});
