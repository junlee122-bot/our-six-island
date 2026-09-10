import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,hydrate,requestFor,handIn,buy,FRIENDS,MAYOR,REGIONS,WORLD,NODES,SPOTS,ITEMS,findPath,walkable,visitRegion,claimExploration} from '../app/game-data.ts';
for(let c=0;c<6;c++) test(`character ${c}: all five requests can complete without duplication`,()=>{let s=freshSave(c);s.bag={apple:10,flower:10,wood:10,shell:10,fish:10};for(let i=0;i<6;i++){if(i===c)continue;const q=requestFor(c,i),before=s.bag[q.item];assert.equal(handIn(s,i),null);s.accepted.push(i);const next=handIn(s,i);assert.ok(next);assert.equal(next.bag[q.item],before-q.count);s=next;assert.equal(handIn(s,i),null)}assert.equal(s.done.length,5);assert.equal(s.coins,155);assert.deepEqual(hydrate(JSON.stringify(s)).bag,s.bag);assert.deepEqual(hydrate(JSON.stringify(s)).done,s.done);assert.equal(hydrate(JSON.stringify(s)).character,c)});
test('purchase enforces funds and keeps previous save immutable',()=>{const s=freshSave();const next=buy(s,'plant');assert.equal(next.coins,6);assert.equal(s.coins,30);assert.equal(s.decor.length,0);assert.equal(buy(next,'plant'),null);assert.equal(buy(s,'unknown'),null)});
test('invalid save values are rejected or normalized',()=>{assert.equal(hydrate('{'),null);assert.equal(hydrate('{"version":1,"character":7}'),null);const s=hydrate(JSON.stringify({...freshSave(),coins:-20,bag:{apple:-9},done:[1,1,99,0],names:['']}));assert.equal(s.coins,0);assert.equal(s.bag.apple,0);assert.deepEqual(s.done,[1]);assert.ok(s.names[0])});
test('every resource, friend and destination has a safe route from spawn',()=>{const start=freshSave().position;for(const p of [...NODES,...FRIENDS,...SPOTS]){assert.ok(walkable(p),`target blocked: ${JSON.stringify(p)}`);const route=findPath(start,p);assert.ok(route.length>0,`unreachable: ${JSON.stringify(p)}`);assert.ok(route.every(walkable))}assert.deepEqual(findPath(start,{x:0,y:0}),[])});

test('updates the six temporary names without changing saved progress',()=>{const original={...freshSave(1),names:['체리','모카','구름','소금','밤이','도토'],coins:117,bag:{apple:4,flower:2,wood:3,shell:2,fish:1},done:[0,2]};const restored=hydrate(JSON.stringify(original));assert.deepEqual(restored.names,['도원','강재','민서','승준','민재','재민']);assert.equal(restored.character,1);assert.equal(restored.coins,117);assert.deepEqual(restored.bag,original.bag);assert.deepEqual(restored.done,[0,2]);const custom=hydrate(JSON.stringify({...original,names:['나의 별명','모카','구름','소금','밤이','도토']}));assert.equal(custom.names[0],'나의 별명');assert.equal(custom.names[1],'강재')});

test('old saves migrate positions and furniture once, preserving progress',()=>{
 const old={...freshSave(1),version:1,position:{x:800,y:590},placed:[{id:'kept-chair',kind:'chair',x:600,y:600}],coins:133,done:[0,2],accepted:[0,2,3],hearts:[2,0,5,1,0,0],names:['별명','강재','민서','승준','민재','재민'],picked:{a0:Date.now()-1000}};
 const migrated=hydrate(JSON.stringify(old));assert.equal(migrated.version,2);assert.deepEqual(migrated.position,{x:2400,y:1770});assert.deepEqual(migrated.placed,[{id:'kept-chair',kind:'chair',x:1800,y:1800}]);
 for(const key of ['coins','done','accepted','hearts','names'])assert.deepEqual(migrated[key],old[key]);assert.equal(migrated.picked.a0,old.picked.a0);
 assert.deepEqual(hydrate(JSON.stringify(migrated)),migrated);
});
test('saves round-trip beyond old bounds and safely handle water positions',()=>{
 const s={...freshSave(),position:{x:4020,y:1400},placed:[{id:'beach-chair',kind:'chair',x:2400,y:2400}]};
 assert.deepEqual(hydrate(JSON.stringify(s)).position,s.position);assert.deepEqual(hydrate(JSON.stringify(s)).placed,s.placed);
 const invalid=hydrate(JSON.stringify({...s,position:{x:3740,y:1200},placed:[{id:'water',kind:'chair',x:3740,y:1200}]}));assert.deepEqual(invalid.position,freshSave().position);assert.equal(invalid.placed.length,0);
 const oldWater=hydrate(JSON.stringify({...s,version:1,position:{x:800,y:590},placed:[{id:'old',kind:'chair',x:1000,y:900}]}));assert.equal(oldWater.placed.length,1);assert.ok(walkable(oldWater.placed[0]));
});
test('every expanded region connects to every other region without crossing water',()=>{
 assert.equal(WORLD.width,4800);assert.equal(WORLD.height,3200);
 for(const start of [...REGIONS,MAYOR])for(const target of [...REGIONS,MAYOR]){
  const route=findPath(start,target);assert.ok(route.length,`${start.id} → ${target.id}`);assert.deepEqual(route.at(-1),{x:target.x,y:target.y});
  let previous=start;for(const point of route){for(let i=0;i<=8;i++)assert.ok(walkable({x:previous.x+(point.x-previous.x)*i/8,y:previous.y+(point.y-previous.y)*i/8}),`path cuts water: ${JSON.stringify({previous,point})}`);previous=point;}
 }
});
test('mayor is a male NPC while the six protagonist quests remain unchanged',()=>{
 assert.equal(MAYOR.name,'호현');assert.equal(MAYOR.gender,'male');assert.equal(FRIENDS.length,6);assert.ok(!FRIENDS.some(f=>f.name===MAYOR.name));assert.ok(findPath(freshSave().position,MAYOR).length);assert.equal(handIn(freshSave(),6),null);
});
test('exploration reward requires five valid regions and can only be claimed once',()=>{
 let s=freshSave();assert.equal(visitRegion(s,'unknown'),s);assert.equal(claimExploration(s),null);
 for(const region of REGIONS){s=visitRegion(s,region.id);assert.equal(visitRegion(s,region.id),s)}assert.equal(s.explored.length,5);assert.equal(claimExploration(s),null);
 s={...s,mayorMet:true};const claimed=claimExploration(s);assert.equal(claimed.coins,s.coins+100);assert.equal(claimExploration(claimed),null);assert.equal(claimExploration(hydrate(JSON.stringify(claimed))),null);
 const cleaned=hydrate(JSON.stringify({...s,explored:['village','village','unknown']}));assert.deepEqual(cleaned.explored,['village']);
});
