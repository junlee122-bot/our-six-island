import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultAppearance,readAppearance,readWardrobe,dyePixel,removeConnectedBackdrop,motionFrame,motionTransform} from '../app/character-style.ts';

test('untrusted customization and motion are bounded and never copy arbitrary payloads',()=>{
 const bad={hair:'url(https://example.com)',top:'<script>',hat:{},glasses:17,clip:'yes',extra:'private'};
 assert.deepEqual(readAppearance(bad,1),defaultAppearance(1));
 const defaults=readWardrobe(null);defaults[1].hair='rose';assert.equal(readWardrobe(null)[1].hair===defaults[1].hair,false);
});
test('animation alternates real step frames and reduced motion suppresses movement',()=>{
 assert.deepEqual(new Set(Array.from({length:40},(_,i)=>motionFrame('walk',i/20))),new Set([0,1,2]));
 assert.notEqual(motionFrame('walk',.12),motionFrame('run',.12));assert.equal(motionFrame('wave',1),3);
 for(const m of ['idle','walk','run','gather','wave','celebrate'])assert.deepEqual(motionTransform(m,2,true),{lift:0,tilt:0,scaleX:1,scaleY:1});
 assert.ok(motionTransform('gather',0).scaleY<1);assert.ok(motionTransform('celebrate',.2).lift>0);
});
test('dye changes hair and cloth while keeping skin and neutral details unchanged',()=>{
 const hair=[150,61,78],top=[233,223,201];
 for(const color of [[230,170,135],[30,30,30],[220,220,220]])assert.deepEqual(dyePixel(...color,hair,top),color);
 assert.notDeepEqual(dyePixel(49,84,172,hair,top),[49,84,172]);assert.notDeepEqual(dyePixel(32,179,173,hair,top),[32,179,173]);
 assert.ok(dyePixel(49,84,172,hair,top)[0]>dyePixel(49,84,172,hair,top)[2]);
});
test('runtime backdrop removal clears connected checkerboard and preserves enclosed whites',()=>{
 const w=7,data=new Uint8ClampedArray(w*w*4);for(let i=0;i<w*w;i++)data.set([i%2?205:253,i%2?205:253,i%2?205:253,255],i*4);
 for(let y=2;y<=4;y++)for(let x=2;x<=4;x++)data.set(x===3&&y===3?[255,255,255,255]:[40,60,80,255],(y*w+x)*4);
 removeConnectedBackdrop(data,w,w);assert.equal(data[3],0);assert.equal(data[(3*w+3)*4+3],255);assert.equal(data[(2*w+2)*4+3],255);
});
