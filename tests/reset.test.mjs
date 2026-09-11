import test from 'node:test';
import assert from 'node:assert/strict';
import {createSavePersistence,SAVE_KEY} from '../app/save-storage.ts';
import {freshSave,hydrate,SPAWN} from '../app/game-data.ts';
import {canvasPixelRatio,visibleMapCrop} from '../app/canvas-resolution.ts';

function fixture(){
 const data=new Map([['unrelated-app','keep me']]);
 const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
 const game=createSavePersistence(()=>storage);
 const old={...freshSave(4),coins:721,bag:{apple:8,flower:9,wood:6,shell:4,fish:2},placed:[{id:'chair',kind:'chair',x:2400,y:2400}],done:[0,1,2,3,5],picnic:true,explored:['village','forest'],mayorMet:true,position:{x:2400,y:2400}};
 storage.setItem(SAVE_KEY,JSON.stringify(old));game.read();return {game,old,data,storage};
}

test('reading saved progress does not modify storage',()=>{
 const {game,old,data}=fixture();const before=data.get(SAVE_KEY);
 assert.equal(game.enabled,true);assert.deepEqual(game.read(),hydrate(before));assert.equal(data.get(SAVE_KEY),before);assert.equal(JSON.parse(before).coins,old.coins);
});
test('reset clears the whole game but leaves unrelated storage intact',()=>{
 const {game,data}=fixture();const clean=game.reset();
 assert.deepEqual(clean,freshSave());assert.deepEqual(clean.position,SPAWN);assert.equal(data.has(SAVE_KEY),false);assert.equal(data.get('unrelated-app'),'keep me');assert.equal(game.enabled,false);
});
test('delayed autosave and pagehide writers cannot resurrect reset progress',()=>{
 const {game,old,data}=fixture();const intervalWriter=()=>game.write(old),pagehideWriter=()=>game.write({...old,position:{x:3000,y:1500}});
 game.reset();assert.equal(intervalWriter(),false);assert.equal(pagehideWriter(),false);assert.equal(data.has(SAVE_KEY),false);assert.equal(game.read(),null);
 game.activate();game.write(freshSave(2));assert.equal(game.read().character,2);assert.equal(game.read().coins,30);
});
test('reset invalidates a pending save import',async()=>{
 const {game,old,data}=fixture();const generation=game.beginImport();
 const readFile=Promise.resolve(JSON.stringify(old));game.reset();const raw=await readFile;
 if(game.isCurrentImport(generation)){game.activate();game.write(hydrate(raw));}
 assert.equal(data.has(SAVE_KEY),false);assert.equal(game.enabled,false);
});
test('failed storage deletion preserves the save and reports failure',()=>{
 const {storage,data,old}=fixture();const game=createSavePersistence(()=>({...storage,removeItem:()=>{throw new Error('storage denied')}}));game.read();
 assert.throws(()=>game.reset(),/storage denied/);assert.equal(game.enabled,true);assert.equal(JSON.parse(data.get(SAVE_KEY)).coins,old.coins);
});
test('canvas uses available display density within its pixel budget',()=>{
 assert.equal(canvasPixelRatio(1440,900,2),2);assert.equal(canvasPixelRatio(1000,600,3),3);
 const ratio=canvasPixelRatio(3840,2160,3);assert.ok(3840*2160*ratio*ratio<=16_000_001);
});
test('visible texture crop tracks the camera without resizing the world',()=>{
 const crop=visibleMapCrop(1600,1000,-1600,-500,1,6144,4096);
 assert.deepEqual(crop,{sx:2048,sy:640,sw:2048,sh:1280,dx:1600,dy:500,dw:1600,dh:1000});
 const edge=visibleMapCrop(1600,1000,-4000,-2500,1,6144,4096);
 assert.equal(edge.dx+edge.dw,4800);assert.equal(edge.dy+edge.dh,3200);assert.equal(edge.sx+edge.sw,6144);assert.equal(edge.sy+edge.sh,4096);
});
