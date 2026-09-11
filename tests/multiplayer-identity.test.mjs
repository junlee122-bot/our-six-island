import test from 'node:test';
import assert from 'node:assert/strict';
import {createIdentity,signFrame,FrameVerifier} from '../app/multiplayer-identity.ts';

test('signed host identity is bound to the invitation and frame contents',async()=>{
 const host=await createIdentity(true),guest=await createIdentity(false),impostor=await createIdentity(true);
 const verify=new FrameVerifier(host.code,guest.id,false);
 const real=await signFrame(host,host.code,'*',1,{type:'world'});
 const forged=await signFrame({...impostor,id:host.id},host.code,'*',999,{type:'closed'});
 assert.equal(await verify.read(forged),null);
 assert.equal(await verify.read({...real,body:real.body.replace('world','closed')}),null);
 assert.equal((await verify.read(real)).from,host.id);
 assert.equal(await verify.read(real),null);
 const later=await signFrame(host,host.code,'*',3,{type:'poses'});
 assert.ok(await verify.read(later));
 assert.equal(await verify.read(await signFrame(host,host.code,'*',2,{type:'poses'})),null);
});

test('a guest cannot forge another guest or address another room',async()=>{
 const host=await createIdentity(true),guest=await createIdentity(false),other=await createIdentity(false);
 const verify=new FrameVerifier(host.code,host.id,true);
 assert.equal(await verify.read(await signFrame({...other,id:guest.id},host.code,host.id,99,{type:'hello'})),null);
 assert.equal(await verify.read(await signFrame(guest,other.code,host.id,99,{type:'hello'})),null);
 assert.equal(await verify.read(await signFrame(guest,host.code,'*',99,{type:'hello'})),null);
 assert.ok(await verify.read(await signFrame(guest,host.code,host.id,1,{type:'hello'})));
});

test('concurrent duplicate verification applies each sequence only once',async()=>{
 const host=await createIdentity(true),guest=await createIdentity(false),verify=new FrameVerifier(host.code,guest.id,false);
 const frame=await signFrame(host,host.code,guest.id,1,{type:'world'});
 const results=await Promise.all([verify.read(frame),verify.read(frame)]);
 assert.equal(results.filter(Boolean).length,1);
 const freshGuest=await createIdentity(false);
 assert.notEqual(freshGuest.id,guest.id);
 assert.equal(await new FrameVerifier(host.code,freshGuest.id,false).read(frame),null);
});

test('repeated new visitors do not exhaust the cache or evict active identities',async()=>{
 const host=await createIdentity(true),active=await createIdentity(false),verify=new FrameVerifier(host.code,host.id,true);
 const activeHello=await signFrame(active,host.code,host.id,1,{type:'hello'});
 assert.ok(await verify.read(activeHello));verify.retain([active.id]);
 for(let i=0;i<45;i++){
  const guest=await createIdentity(false);
  assert.ok(await verify.read(await signFrame(guest,host.code,host.id,1,{type:'hello'})));
 }
 assert.equal(await verify.read(activeHello),null);
 assert.ok(await verify.read(await signFrame(active,host.code,host.id,2,{type:'move'})));
});
