import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger, validateLedger } from '../app/lounge-economy.ts';
import { defaultLook } from '../app/lounge-look.ts';
import { ACCOUNT_IDS } from '../app/lounge-roster.ts';
import { portalNetwork } from '../app/lounge-portals.ts';

const NOW=Date.UTC(2026,10,25,4);
let serial=0;
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
async function fixture(t) {
  t.mock.timers.enable({apis:['setTimeout','Date'],now:NOW});
  const member={id:crypto.randomUUID(),actor:3,username:ACCOUNT_IDS[3]};
  let world={schema:1,ledger:newLoungeLedger(),rooms:{},receipts:{}},revision=0;
  const calls=[],key=`__cloudMoveTest${++serial}`;
  const channel={on(){return this;},subscribe(){return this;},async unsubscribe(){}};
  globalThis[key]={
    cloud:{channel:()=>channel,realtime:{async setAuth(){}}},
    cloudCall:(_endpoint,body)=>new Promise((resolve,reject)=>calls.push({command:structuredClone(body.command),resolve,reject,settled:false})),
    AccountError:class extends Error {},setNpcWorld(){},setServerClockOffset(){},
    friendlyError:(e)=>typeof e==='string'?e:e?.message??'error',
    lastRoomKey:(id)=>`test-room-${id}`,recall:()=>null,remember(){},
  };
  const file=new URL('../app/lounge-cloud-room.ts',import.meta.url);
  const stub='data:text/javascript;base64,'+Buffer.from(`export const {cloud,cloudCall,AccountError,setNpcWorld,setServerClockOffset,friendlyError,lastRoomKey,recall,remember}=globalThis.${key};`).toString('base64');
  const {outputText}=ts.transpileModule(await fs.readFile(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  const stubbed=new Set(['./lounge-auth','./lounge-npc-schedule','./lounge/feedback','./lounge-settings','./lounge-turn-timer']);
  const source=outputText.replace(/from\s+(['"])([^'"]+)\1/g,(_all,_quote,specifier)=>`from ${JSON.stringify(stubbed.has(specifier)?stub:new URL(specifier+'.ts',file).href)}`);
  const {CloudRoom}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const room=new CloudRoom({...member,save:null,revision:0,updatedAt:''});
  t.after(()=>{room.dispose();delete globalThis[key];t.mock.timers.reset();});
  async function reply(index) {
    const c=calls[index];assert.ok(c&&!c.settled,`pending call ${index}`);
    const next=cloudTransition(world,member,c.command,await commandHash(c.command),Date.now());
    world=next.state;if(next.changed)revision++;
    validateLedger(world.ledger);c.settled=true;c.resolve({...next.response,revision});await flush();
    return next.response;
  }
  const joining=room.start('host','BEMTADUVLY',defaultLook(3));await flush();
  await reply(0);await flush();await reply(1);assert.equal(await joining,true);
  return {room,calls,reply,get world(){return world;},self:()=>room.snapshot().players.find(p=>p.id===member.id),
    async rejectTransport(index) { const c=calls[index],error=new globalThis[key].AccountError('temporary');error.status=503;c.settled=true;c.reject(error);await flush(); },
    async tick(ms){t.mock.timers.tick(ms);await flush();}};
}

test('a queued movement sends the newest sample after a slow action, with one ordered write at a time',async t=>{
  const h=await fixture(t),pending=h.room.life({kind:'status',text:'산책 중'});await flush();
  await h.room.action({kind:'move',x:55,y:64});await h.tick(500);
  assert.equal(h.calls.length,3,'the movement waits behind the in-flight life write');
  await h.room.action({kind:'move',x:58,y:67});
  await h.reply(2);assert.equal(await pending,true);await flush();
  assert.deepEqual(h.calls[3].command.action,{kind:'move',x:58,y:67},'transmission uses the latest sample, not the sample from 500 ms ago');
  assert.ok(h.calls[3].command.sequence>h.calls[2].command.sequence);
  await h.reply(3);await h.tick(500);
  assert.equal(h.calls.length,4,'coalesced intermediate samples create no extra server writes');
  assert.equal(h.self().x,58);
});

test('older move acknowledgements and refreshes cannot rewind a newer local movement prediction',async t=>{
  const h=await fixture(t);
  await h.room.action({kind:'move',x:55,y:64});await h.tick(500);
  await h.room.action({kind:'move',x:59,y:66});
  await h.reply(2);assert.equal(h.self().x,59);
  const refresh=h.room.refresh();await flush();await h.reply(3);await refresh;
  assert.equal(h.self().x,59,'a read still carrying the older server position does not erase the unsent local sample');
  await h.tick(500);assert.equal(h.calls[4].command.action.x,59);
  await h.reply(4);assert.equal(h.self().x,59);
});

test('retry freezes the first sent body while newer movement stays coalesced for the following ordered request',async t=>{
  const h=await fixture(t);
  await h.room.action({kind:'move',x:55,y:64});await h.tick(500);
  await h.room.action({kind:'move',x:59,y:66});
  await h.rejectTransport(2);
  assert.deepEqual(h.calls[3].command,h.calls[2].command,'retry reuses the exact request id, sequence and position');
  await h.reply(3);assert.equal(h.self().x,59);
  await h.tick(500);assert.equal(h.calls[4].command.action.x,59);
  assert.ok(h.calls[4].command.sequence>h.calls[3].command.sequence);
  await h.reply(4);
});

test('E at a portal flushes the latest pad position before travel and never sends an old-area move afterward',async t=>{
  const h=await fixture(t),pad=portalNetwork('village');
  const village=h.room.area('village');await flush();await h.reply(2);assert.equal(await village,true);
  await h.room.action({kind:'move',...pad});
  const travel=h.room.action({kind:'portal',to:'farm'});await flush();
  assert.equal(h.calls[3].command.action.kind,'move');
  assert.equal(h.calls.length,4,'the portal waits for the final movement response');
  assert.equal(await h.room.action({kind:'move',x:90,y:90}),false,'old scene movement is suppressed while the portal is pending');
  await h.reply(3);await flush();assert.equal(h.calls[4].command.action.kind,'portal');
  const result=await h.reply(4);assert.equal(result.ok,true,result.error);assert.equal(await travel,true);
  assert.equal(h.self().area,'farm');assert.equal(h.self().x,portalNetwork('farm').x);
  await h.tick(1000);assert.equal(h.calls.length,5,'the previous area leaves no delayed timer or queued coordinates');
  await h.room.action({kind:'move',x:52,y:65});await h.tick(500);
  await h.reply(5);assert.equal(h.self().area,'farm');assert.equal(h.self().x,52,'new area movement resumes normally');
});

test('an area transition invalidates an older movement queue slot without breaking monotonic client sequence',async t=>{
  const h=await fixture(t),pending=h.room.life({kind:'status',text:'집에 갈게'});await flush();
  await h.room.action({kind:'move',x:60,y:60});await h.tick(500);
  const enter=h.room.area('home',50,85,3);
  await h.reply(2);await pending;await flush();
  assert.equal(h.calls[3].command.action.kind,'area','the obsolete queued movement is skipped');
  assert.ok(h.calls[3].command.sequence>h.calls[2].command.sequence+1,'skipped queue slots leave harmless sequence gaps');
  const response=await h.reply(3);assert.equal(response.ok,true,response.error);assert.equal(await enter,true);
  await h.tick(1000);assert.equal(h.calls.length,4);assert.equal(h.self().area,'home');
});

test('a refused portal keeps the source position and releases the movement lock without a delayed old move',async t=>{
  const h=await fixture(t),village=h.room.area('village');await flush();await h.reply(2);await village;
  await h.room.action({kind:'move',...portalNetwork('village')});
  const travel=h.room.action({kind:'portal',to:'mine'});await flush();await h.reply(3);await flush();
  assert.equal((await h.reply(4)).ok,false,'the actual server rejects a non-portal destination');
  assert.equal(await travel,false);assert.equal(h.self().area,'village');
  assert.equal(h.self().x,portalNetwork('village').x);
  assert.equal(await h.room.action({kind:'move',x:60,y:65}),true,'failure releases the portal pending guard');
  await h.tick(500);assert.equal(h.calls[5].command.action.kind,'move');await h.reply(5);
  assert.equal(h.self().area,'village');assert.equal(h.self().x,60);
});

test('a server refusal restores authoritative position, and disposing cancels all delayed movement',async t=>{
  const h=await fixture(t),cast=h.room.life({kind:'cast',spot:'river'});await flush();
  const started=await h.reply(2);assert.equal(started.ok,true,started.error);await cast;
  const before={x:h.self().x,y:h.self().y};
  await h.room.action({kind:'move',x:80,y:80});await h.tick(500);
  const denied=await h.reply(3);assert.equal(denied.ok,false,'the actual cloud engine keeps the fishing movement lock');
  assert.deepEqual({x:h.self().x,y:h.self().y},before);
  await h.room.action({kind:'move',x:70,y:70});h.room.dispose();await h.tick(1000);
  assert.equal(h.calls.length,4,'no queued movement survives disposal');
});
