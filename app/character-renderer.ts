import {GAME_ASSETS,loadArt} from './game-assets';
import {HAIR_COLORS,TOP_COLORS,HATS,GLASSES,appearanceKey,dyePixel,motionFrame,motionTransform,readAppearance,removeConnectedBackdrop,type Appearance,type Motion} from './character-style';

type Frame={canvas:HTMLCanvasElement;foot:number;center:number};
export type CharacterRenderer={draw:(ctx:CanvasRenderingContext2D,id:number,appearance:Appearance,x:number,y:number,size:number,motion:Motion,time:number,facing?:number,reduced?:boolean)=>void};
let pending:Promise<CharacterRenderer>|null=null;
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export function loadCharacters():Promise<CharacterRenderer>{
 if(pending)return pending;
 pending=Promise.all([loadArt(GAME_ASSETS.motion),loadArt(GAME_ASSETS.accessories)]).then(([sheet,accessories])=>{
  const cache=new Map<string,Frame[]>(),baseFrames:ImageData[][]=[];
  const cell=256,pad=88;
  // Measured row bounds avoid clipping shoes or borrowing hair from the next row.
  const rows=[[20,241],[264,256],[521,248],[771,258],[1030,259],[1289,247]];
  const eyes=[[108,109,108,108],[351,348,351,348],[608,607,607,608],[861,861,862,861],[1120,1120,1121,1120],[1371,1372,1372,1369]];
  const eyeX=[[159.5,398,633.5,867.5],[157,398.5,635.5,874.5],[158,399.5,637,877.5],[158,403.5,639,876.5],[156,400,639.5,881],[156,400.5,641.5,879]];
  for(let row=0;row<6;row++){baseFrames[row]=[];for(let col=0;col<4;col++){
   const c=document.createElement('canvas');c.width=c.height=cell;const ctx=c.getContext('2d',{willReadFrequently:true})!;
   const sx=sheet.width/1024,sy=sheet.height/1536;
   ctx.drawImage(sheet,(35+col*240)*sx,rows[row][0]*sy,240*sx,rows[row][1]*sy,0,0,cell,cell);const pixels=ctx.getImageData(0,0,cell,cell);removeConnectedBackdrop(pixels.data,cell,cell);baseFrames[row].push(pixels);
  }}
  const accessoryCrops=Array.from({length:8},(_,i)=>{
   const c=document.createElement('canvas');c.width=c.height=cell;const ctx=c.getContext('2d',{willReadFrequently:true})!;
   ctx.drawImage(accessories,(i%4)*accessories.width/4,Math.floor(i/4)*accessories.height/2,accessories.width/4,accessories.height/2,0,0,cell,cell);
   const {data}=ctx.getImageData(0,0,cell,cell);let x0=cell,y0=cell,x1=0,y1=0;
   for(let y=0;y<cell;y++)for(let x=0;x<cell;x++)if(data[(y*cell+x)*4+3]>24){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   return {canvas:c,x:x0,y:y0,w:Math.max(1,x1-x0+1),h:Math.max(1,y1-y0+1)};
  });
  function frames(id:number,input:Appearance){
   const a=readAppearance(input,id),key=appearanceKey(id,a),old=cache.get(key);if(old){cache.delete(key);cache.set(key,old);return old;}
   const hair=rgb(HAIR_COLORS.find(c=>c.id===a.hair)!.hex),top=rgb(TOP_COLORS.find(c=>c.id===a.top)!.hex);
   const result=baseFrames[id].map((original,frame)=>{
    const im=new ImageData(new Uint8ClampedArray(original.data),cell,cell),data=im.data;
    const eyesY=(eyes[id][frame]-rows[id][0])*cell/rows[id][1],eyesX=(eyeX[id][frame]-(35+frame*240))*cell/240;
    let hairLeft=cell,hairRight=0,hairTop=cell,foot=0;
    for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
     const k=(y*cell+x)*4;if(data[k+3]<15)continue;foot=Math.max(foot,y);
     const [r,g,b]=[data[k],data[k+1],data[k+2]];
     if(y<eyesY&&b>Math.max(r,g)*1.18){hairLeft=Math.min(hairLeft,x);hairRight=Math.max(hairRight,x);hairTop=Math.min(hairTop,y);}
     const dyed=dyePixel(r,g,b,hair,top);data[k]=dyed[0];data[k+1]=dyed[1];data[k+2]=dyed[2];
    }
    const c=document.createElement('canvas');c.width=c.height=cell+pad*2;const ctx=c.getContext('2d')!;ctx.putImageData(im,pad,pad);
    const headWidth=hairRight>hairLeft?hairRight-hairLeft:cell*.35;
    const headX=hairRight>hairLeft?(hairLeft+hairRight)/2:cell/2;
    const topY=hairTop<cell?hairTop:cell*.12;
    const add=(index:number,width:number,cx:number,cy:number)=>{const crop=accessoryCrops[index],height=width*crop.h/crop.w;ctx.drawImage(crop.canvas,crop.x,crop.y,crop.w,crop.h,pad+cx-width/2,pad+cy-height/2,width,height);};
    const hat=HATS.find(h=>h.id===a.hat)!.cell,glasses=GLASSES.find(g=>g.id===a.glasses)!.cell;
    if(hat>=0)add(hat,headWidth*(hat===1?1.6:1.18),headX,topY+headWidth*.13);
    if(glasses>=0)add(glasses,headWidth*.76,eyesX,eyesY);
    if(a.clip)add(7,headWidth*.28,headX+headWidth*.38,topY+headWidth*.3);
    return {canvas:c,foot:foot+pad,center:headX+pad};
   });
   cache.set(key,result);if(cache.size>16)cache.delete(cache.keys().next().value!);return result;
  }
  return {draw(ctx:CanvasRenderingContext2D,id:number,appearance:Appearance,x:number,y:number,size:number,motion:Motion,time:number,facing=1,reduced=false){
   const f=frames(Math.max(0,Math.min(5,id)),appearance)[motionFrame(motion,time,reduced)],pose=motionTransform(motion,time,reduced),ratio=size/cell;
   ctx.save();ctx.translate(x,y-pose.lift*size/128);ctx.scale(facing*pose.scaleX,pose.scaleY);ctx.rotate(pose.tilt);
   ctx.drawImage(f.canvas,-f.center*ratio,-f.foot*ratio,f.canvas.width*ratio,f.canvas.height*ratio);ctx.restore();
  }};
 }).catch(error=>{pending=null;throw error;});
 return pending;
}
