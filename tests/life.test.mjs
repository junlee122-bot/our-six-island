import test from 'node:test';
import assert from 'node:assert/strict';
import {freshSave,hydrate,findPath,SPAWN,walkable} from '../app/game-data.ts';
import {FACILITIES,PLOTS,INSECTS,RECIPES,ROOM_ENTRY,COLLECTION,craft,seed,water,harvest,cropProgress,cook,transfer,donate,catchFish,catchInsect,dailyGift,upgradeHome,placeInside,reclaimInside,roomCapacity,roomWalkable} from '../app/life-data.ts';
import {readIsland,readPlayer,visitingSpawn,persistentPosition} from '../app/multiplayer-protocol.ts';
import {interiorCamera} from '../app/canvas-resolution.ts';

test('room camera keeps the entrance and every floor corner visible at all supported zoom levels',()=>{
 for(const [width,height] of [[1280,720],[1920,1080],[360,640],[390,844],[844,390]])for(const zoom of [1,1.3,1.8]){
  const scale=Math.max(width/1550,height/1100)*zoom;
  for(const p of [ROOM_ENTRY,{x:130,y:275},{x:970,y:275},{x:130,y:660},{x:970,y:660},{x:550,y:650}]){
   const {ox,oy}=interiorCamera(width,height,scale,p),x=ox+p.x*scale,y=oy+p.y*scale;
   assert.ok(x>20&&x<width-20,`${width}x${height} zoom ${zoom}: horizontal floor visibility`);
   assert.ok(y>Math.min(160,height*.22)&&y<height-Math.min(165,height*.28),`${width}x${height} zoom ${zoom}: floor remains between controls`);
   assert.ok(y-105*scale>0,`${width}x${height} zoom ${zoom}: character head is on screen`);
  }
 }
});

test('older saves gain life features without losing personal progress or scaling twice',()=>{
 const old={...freshSave(1),coins:432,position:{x:2300,y:1800},life:undefined};
 const loaded=hydrate(JSON.stringify(old));assert.equal(loaded.coins,432);assert.deepEqual(loaded.position,old.position);assert.equal(loaded.life.plots.length,6);assert.equal(loaded.life.seeds.carrot,3);
 assert.deepEqual(hydrate(JSON.stringify(loaded)),loaded);
});
test('every new facility, plot and insect connects to the existing island paths',()=>{
 for(const target of [...FACILITIES,...PLOTS,...INSECTS]){assert.ok(walkable(target),target.id);assert.ok(findPath(SPAWN,target).length,target.id);}
 assert.ok(roomWalkable(ROOM_ENTRY));assert.ok(roomWalkable({x:550,y:650}));
});
test('all sixteen recipes charge every material atomically and preserve prior saves',()=>{
 for(const r of RECIPES){const s=freshSave();s.bag={apple:0,flower:r.flower,wood:r.wood,shell:r.shell,fish:0};const original=JSON.stringify(s);const next=craft(s,r.id);
  assert.ok(next,r.id);assert.equal(next.bag.wood,0);assert.equal(next.bag.flower,0);assert.equal(next.bag.shell,0);assert.equal(next.decor.at(-1),r.id);assert.equal(JSON.stringify(s),original);
  s.bag.wood=0;assert.equal(craft(s,r.id),null);
 }
 const full=freshSave();full.decor=Array(50).fill('plant');full.bag.wood=100;full.bag.flower=100;assert.equal(craft(full,'plant'),null);
});
test('watering accelerates persistent crops and each plot can be harvested once',()=>{
 const now=Date.now()-120000,s=freshSave(),planted=seed(s,0,'carrot',now);assert.equal(s.life.seeds.carrot,3);assert.equal(planted.life.seeds.carrot,2);assert.equal(seed(planted,0,'tomato',now),null);
 const wet=water(planted,0);assert.equal(water(wet,0),null);assert.ok(cropProgress(wet.life.plots[0],now+44000)>=1);assert.ok(cropProgress(planted.life.plots[0],now+44000)<1);
 const restored=hydrate(JSON.stringify(wet));assert.equal(restored.life.plots[0].plantedAt,now);
 const picked=harvest(restored,0);assert.equal(picked.life.produce.carrot,2);assert.equal(harvest(picked,0),null);assert.equal(picked.life.harvests,1);
});
test('cooking and storage preserve quantities and reject insufficient inventory',()=>{
 const s=freshSave();s.bag.wood=23;const stored=transfer(s,'wood',true,true);assert.equal(stored.bag.wood,0);assert.equal(stored.life.storage.wood,23);assert.equal(transfer(stored,'wood',true,true),null);
 const taken=transfer(stored,'wood',false,true);assert.equal(taken.bag.wood,23);assert.equal(taken.life.storage.wood,0);
 s.life.produce={carrot:1,tomato:1,pumpkin:0};const prepared=cook(s,'salad');assert.equal(prepared.coins,s.coins+55);assert.equal(prepared.life.produce.carrot,0);assert.equal(cook(prepared,'salad'),null);assert.equal(s.life.produce.carrot,1);
});
test('all specimens can be discovered and donated only once',()=>{
 let s=freshSave();for(const resource of Object.keys(s.bag))s.bag[resource]=1;
 for(const c of COLLECTION)s.life.specimens[c.id]=1;
 for(const c of COLLECTION){const previous=s.coins,next=donate(s,c.id);assert.ok(next,c.id);assert.equal(next.coins,previous+30);assert.equal(donate(next,c.id),null);s=next;}
 assert.equal(s.life.donated.length,12);assert.equal(s.life.discovered.length,12);
});
test('fishing yields four species and insect collection has a real cooldown',()=>{
 let s=freshSave();for(let i=0;i<4;i++)s=catchFish(s,i/4).save;assert.equal(s.bag.fish,4);assert.equal(s.life.discovered.length,5);
 const now=Date.now();s=catchInsect(s,'butterfly-1',now);assert.equal(s.life.specimens.butterfly,1);assert.equal(catchInsect(s,'butterfly-1',now+1000),null);assert.ok(catchInsect(s,'butterfly-1',now+60001));
});
test('daily gifts and room upgrades are charged and awarded once',()=>{
 const s=freshSave(),gift=dailyGift(s,'2026-09-11');assert.equal(gift.coins,70);assert.equal(dailyGift(gift,'2026-09-11'),null);assert.ok(dailyGift(gift,'2026-09-12'));
 s.coins=1000;s.bag.wood=20;const upgraded=upgradeHome(s);assert.equal(upgraded.coins,880);assert.equal(upgraded.bag.wood,12);assert.equal(roomCapacity(upgraded),20);assert.equal(s.life.houseLevel,1);
});
test('indoor furniture and saved room survive load, reclaim and guest return',()=>{
 const s=freshSave();s.decor=['chair','lamp'];s.position={...ROOM_ENTRY,room:'home'};const placed=placeInside(s,'chair',{x:350,y:420});assert.ok(placed);assert.equal(placed.decor.length,1);assert.equal(placeInside(placed,'lamp',{x:360,y:420}),null);
 const loaded=hydrate(JSON.stringify(placed));assert.equal(loaded.position.room,'home');assert.equal(loaded.life.roomPlaced.length,1);assert.equal(loaded.placed.length,0);
 const reclaimed=reclaimInside(loaded,loaded.life.roomPlaced[0].id);assert.equal(reclaimed.life.roomPlaced.length,0);assert.equal(reclaimed.decor.length,2);
 const home={x:450,y:500,room:'home'},guest={x:600,y:550,room:'museum'};assert.deepEqual(persistentPosition(home,guest,SPAWN),home);
 assert.equal(visitingSpawn(guest).room,'museum');assert.ok(roomWalkable(visitingSpawn(guest)));
});
test('network validation preserves indoor rooms and only copies shared furniture',()=>{
 const player=readPlayer({id:'a',name:'강재',character:1,x:500,y:550,room:'museum'});assert.equal(player.room,'museum');assert.equal(readPlayer({...player,room:'unknown'}),null);assert.equal(readPlayer({...player,y:1}),null);
 const shared={placed:[],roomPlaced:[{id:'chair',kind:'chair',x:300,y:400}],night:false},copy=readIsland(shared);assert.ok(copy);copy.roomPlaced[0].x=350;assert.equal(shared.roomPlaced[0].x,300);
 assert.equal(readIsland({...shared,roomPlaced:[null]}),null);assert.equal(readIsland({...shared,roomPlaced:Array(31).fill(shared.roomPlaced[0])}),null);
});
