import {FRIENDS,NODES,SPOTS,REGIONS,WORLD,walkable,distance,type Point} from './game-data';
import {FACILITIES,PLOTS,INSECTS} from './life-data';
export type Scenery=Point&{cell:number;size:number;phase:number};
const reserved=[...FRIENDS,...NODES,...SPOTS,...REGIONS,...FACILITIES,...PLOTS,...INSECTS];
const safe=(p:Point,radius:number)=>walkable(p)&&reserved.every(q=>distance(p,q)>radius);
const trees:Scenery[]=[];
for(let i=0;i<38;i++){const p={x:470+(i*457)%3730,y:430+(i*293)%1810};if(safe(p,160))trees.push({...p,cell:i%3===0?1:0,size:210+(i%4)*22,phase:i*1.7});}
const ground:Scenery[]=[];
for(let i=0;i<100;i++){const p={x:400+(i*379)%3950,y:400+(i*239)%1860};if(safe(p,85))ground.push({...p,cell:i%12===0?4:i%4===0?2:3,size:i%4===0?95:55,phase:i});}
for(const [x,y] of [[1220,2350],[1530,2410],[3060,2450],[3610,2180],[4250,1660],[4410,1140]])if(safe({x,y},85))ground.push({x,y,cell:5,size:125,phase:0});
export const SCENERY=trees;
export const MEADOW=ground;
const water:Point[]=[];
for(let y=100;y<WORLD.height;y+=160)for(let x=120;x<WORLD.width;x+=210){const p={x:x+(y%83),y};if(!walkable(p)&&!walkable({x:p.x-80,y})&&!walkable({x:p.x+80,y}))water.push(p);}
export const WATER_GLINTS=water;
export function drawNature(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement,cell:number,x:number,y:number,size:number,sway=0){
 const sw=atlas.naturalWidth/4,sh=atlas.naturalHeight/2;
 ctx.save();ctx.translate(x,y);ctx.rotate(cell===4||cell===5?0:sway);ctx.drawImage(atlas,(cell%4)*sw+4,Math.floor(cell/4)*sh+4,sw-8,sh-8,-size/2,-size*.86,size,size);ctx.restore();
}
export function drawWater(ctx:CanvasRenderingContext2D,time:number,visible:(p:Point,margin?:number)=>boolean,reduced:boolean){
 ctx.save();ctx.lineCap='round';
 for(let i=0;i<WATER_GLINTS.length;i++){const p=WATER_GLINTS[i];if(!visible(p,90))continue;const phase=reduced?.4:(time*.21+i*.37)%1;
  ctx.globalAlpha=Math.sin(phase*Math.PI)*.25;ctx.strokeStyle='#fff9d9';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+phase*19,18+phase*45,4+phase*4,0,.08,Math.PI-.08);ctx.stroke();
 }
 ctx.restore();
}
