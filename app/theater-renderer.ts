import {THEATER_ASSETS} from './theater-assets';
import {CLOTHES,HAIRS,HATS,GLASSES,readCostume,type Costume,type Pose} from './theater-data';
import {removeConnectedBackdrop} from './character-style';
type Cut={canvas:HTMLCanvasElement;x:number;y:number;w:number;h:number};
export type TheaterArt={actor:(ctx:CanvasRenderingContext2D,id:number,costume:Costume,x:number,foot:number,size:number,pose?:Pose,time?:number,reduced?:boolean)=>void;item:(ctx:CanvasRenderingContext2D,cell:number,w:number,h:number,accessory?:boolean)=>void;backdrop:HTMLImageElement};
let pending:Promise<TheaterArt>|null=null;
const canvas=(w:number,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const load=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('그림을 불러오지 못했어요. 다시 시도해 주세요.'));im.src=src;});
function clean(c:HTMLCanvasElement){const ctx=c.getContext('2d',{willReadFrequently:true})!,p=ctx.getImageData(0,0,c.width,c.height);let alpha=false;for(let k=3;k<p.data.length;k+=4)if(p.data[k]===0){alpha=true;break;}if(!alpha){removeConnectedBackdrop(p.data,c.width,c.height);ctx.putImageData(p,0,0);}return c;}
function keepPieces(c:HTMLCanvasElement,count:number){const ctx=c.getContext('2d')!,p=ctx.getImageData(0,0,c.width,c.height),size=c.width*c.height,labels=new Int32Array(size),queue=new Int32Array(size),areas:{id:number;area:number}[]=[];let label=0;for(let start=0;start<size;start++){if(labels[start]||p.data[start*4+3]<128)continue;label++;let n=1;queue[0]=start;labels[start]=label;for(let j=0;j<n;j++){const q=queue[j],x=q%c.width;const visit=(k:number)=>{if(k<0||k>=size||labels[k]||p.data[k*4+3]<128)return;labels[k]=label;queue[n++]=k;};if(x>0)visit(q-1);if(x<c.width-1)visit(q+1);visit(q-c.width);visit(q+c.width);}areas.push({id:label,area:n});}const kept=new Set(areas.sort((a,b)=>b.area-a.area).slice(0,count).map(a=>a.id));for(let q=0;q<size;q++){const x=q%c.width;if(kept.has(labels[q])||p.data[q*4+3]<128&&(x>0&&kept.has(labels[q-1])||x<c.width-1&&kept.has(labels[q+1])||kept.has(labels[q-c.width])||kept.has(labels[q+c.width])))continue;p.data[q*4+3]=0;}ctx.putImageData(p,0,0);return c;}
function bounds(c:HTMLCanvasElement):Cut{const {data}=c.getContext('2d')!.getImageData(0,0,c.width,c.height);let x=c.width,y=c.height,x1=0,y1=0;for(let i=0;i<data.length;i+=4)if(data[i+3]>30){const px=i/4%c.width,py=Math.floor(i/4/c.width);x=Math.min(x,px);y=Math.min(y,py);x1=Math.max(x1,px);y1=Math.max(y1,py);}return {canvas:c,x,y,w:Math.max(1,x1-x+1),h:Math.max(1,y1-y+1)};}
function cut(im:HTMLImageElement,cols:number,rows:number,i:number,pieces=0){const w=Math.floor(im.width/cols),h=Math.floor(im.height/rows),c=canvas(w,h);c.getContext('2d')!.drawImage(im,(i%cols)*im.width/cols,Math.floor(i/cols)*im.height/rows,im.width/cols,im.height/rows,0,0,w,h);clean(c);return bounds(pieces?keepPieces(c,pieces):c);}
function put(ctx:CanvasRenderingContext2D,c:Cut,x:number,y:number,w:number,h:number){ctx.drawImage(c.canvas,c.x,c.y,c.w,c.h,x,y,w,h);}
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export function loadTheaterArt():Promise<TheaterArt>{if(pending)return pending;pending=Promise.all([load(THEATER_ASSETS.friends),load(THEATER_ASSETS.accessories),load(THEATER_ASSETS.jaeminCap),load(THEATER_ASSETS.hohyeon),load(THEATER_ASSETS.wardrobe),load(THEATER_ASSETS.backstage)]).then<TheaterArt>(([friends,accessories,cap,hohyeon,wardrobe,backdrop])=>{
 const rows=[[20,241],[264,256],[521,248],[771,258],[1030,259],[1289,247]],eyeYs=[108,351,608,861,1120,1371],source:HTMLCanvasElement[]=[],heads:{c:HTMLCanvasElement;cx:number;eye:number;chin:number;hairTop:number;width:number}[]=[];
 for(let id=0;id<6;id++){const c=canvas(256);c.getContext('2d')!.drawImage(friends,35,rows[id][0],240,rows[id][1],0,0,256,256);source.push(clean(c));}
 // Normalize the seventh friend's new head onto the same paper-doll proportions.
 const hc=canvas(hohyeon.width,hohyeon.height);hc.getContext('2d')!.drawImage(hohyeon,0,0);const hb=bounds(keepPieces(clean(hc),1));const hframe=canvas(256),hw=hb.w/hb.h*256;put(hframe.getContext('2d')!,hb,(256-hw)/2,0,hw,256);source.push(hframe);
 for(let id=0;id<7;id++){const c=source[id],ctx=c.getContext('2d')!,p=ctx.getImageData(0,0,256,256),eye=id<6?(eyeYs[id]-rows[id][0])*256/rows[id][1]:59;let x0=256,x1=0,y0=256;
  for(let y=0;y<eye;y++)for(let x=0;x<256;x++){const k=(y*256+x)*4,[r,g,b,a]=p.data.slice(k,k+4);if(a>20&&b>Math.max(r,g)*1.18){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);}}
  const width=x1>x0?x1-x0:120,cx=x1>x0?(x1+x0)/2:128,chin=id===6?93:eye+width*.29;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){const k=(y*256+x)*4,[r,g,b]=p.data.slice(k,k+3);if(y>chin&&!(b>Math.max(r,g)*1.18)||y>eye+width*.15&&g>r*1.3&&g>b*.9)p.data[k+3]=0;}
  const head=canvas(256);head.getContext('2d')!.putImageData(p,0,0);heads.push({c:head,cx,eye,chin,hairTop:y0,width});
 }
 // Keep the painted neck, arms and legs, then dress the doll in separate garments.
 const limbs=canvas(256),lctx=limbs.getContext('2d')!,lp=source[5].getContext('2d')!.getImageData(0,0,256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const k=(y*256+x)*4,[r,g,b]=lp.data.slice(k,k+3);if(y<heads[5].chin-4||y>201||!(r>125&&r-g>28&&g-b>12))lp.data[k+3]=0;}lctx.putImageData(lp,0,0);
 const garments=Array.from({length:16},(_,i)=>cut(wardrobe,4,4,i,i<12?1:2)),extras=Array.from({length:8},(_,i)=>cut(accessories,4,2,i)),jaemin=cut(cap,1,1,0),cache=new Map<string,HTMLCanvasElement>();
 function compose(id:number,input:Costume){const a=readCostume(input,id),key=JSON.stringify([id,a]);if(cache.has(key))return cache.get(key)!;const c=canvas(384,352),ctx=c.getContext('2d')!;ctx.translate(64,62);
  const head=heads[id],hcopy=canvas(256),hctx=hcopy.getContext('2d')!,hp=head.c.getContext('2d')!.getImageData(0,0,256,256),tint=rgb(HAIRS.find(h=>h.id===a.hair)!.hex);
  for(let k=0;k<hp.data.length;k+=4){const [r,g,b]=hp.data.slice(k,k+3);if(b>Math.max(r,g)*1.12){const weight=Math.min(1,(b-Math.max(r,g)*1.12)/28),light=Math.max(.3,Math.min(1.4,(r*.21+g*.72+b*.07)/85));for(let j=0;j<3;j++)hp.data[k+j]=Math.round(hp.data[k+j]*(1-weight)+Math.min(255,tint[j]*light)*weight);}}
  hctx.putImageData(hp,0,0);const scale=143/head.width,dx=128-head.cx*scale,dy=83-head.eye*scale,chin=head.chin*scale+dy,top=head.hairTop*scale+dy;
  ctx.drawImage(hcopy,dx,dy,256*scale,256*scale);ctx.drawImage(limbs,0,0);
  // Continuous ankle geometry keeps every independently drawn lower garment and shoe joined.
  for(const x of [99,140]){const skin=ctx.createLinearGradient(x,0,x+18,0);skin.addColorStop(0,'#dc996e');skin.addColorStop(.45,'#ffd3a6');skin.addColorStop(1,'#e8aa7b');ctx.fillStyle=skin;ctx.beginPath();ctx.roundRect(x,199,18,45,7);ctx.fill();ctx.fillStyle='#f4ece0';ctx.fillRect(x,226,18,17);}
  const lower=CLOTHES.find(i=>i.id===a.bottom)!,shirt=CLOTHES.find(i=>i.id===a.top)!,shoes=CLOTHES.find(i=>i.id===a.shoes)!;
  put(ctx,garments[lower.cell],a.bottom==='skirt'?73:82,182,a.bottom==='skirt'?110:92,a.bottom==='shorts'?32:a.bottom==='skirt'?41:54);
  put(ctx,garments[shoes.cell],81,232,94,27);
  const width=a.top==='hoodie'?124:a.top==='detective'?119:114;put(ctx,garments[shirt.cell],128-width/2,118,width,77);
  // Restore the face in front of collars while long hair remains behind clothing.
  ctx.save();ctx.beginPath();ctx.rect(0,-60,256,chin+62);ctx.clip();ctx.drawImage(hcopy,dx,dy,256*scale,256*scale);ctx.restore();
  const overlay=(cut:Cut,w:number,x:number,y:number)=>put(ctx,cut,x-w/2,y-w*cut.h/cut.w/2,w,w*cut.h/cut.w);
  const hat=HATS.find(h=>h.id===a.hat)!.cell;if(hat>=0){const piece=id===5&&hat===0?jaemin:extras[hat],w=143*(hat===1?1.55:1.03),h=w*piece.h/piece.w;overlay(piece,w,128,top-14+h/2);}
  const glasses=GLASSES.find(g=>g.id===a.glasses)!.cell;if(glasses>=0)overlay(extras[glasses],106,128,83);if(a.clip)overlay(extras[7],36,179,top+40);
  cache.set(key,c);if(cache.size>96)cache.delete(cache.keys().next().value!);return c;
 }
 return {backdrop,item(ctx,cell,w,h,accessory=false){const items=accessory?extras:garments,item=items[Math.max(0,Math.min(items.length-1,cell))],s=Math.min((w-14)/item.w,(h-14)/item.h);put(ctx,item,(w-item.w*s)/2,(h-item.h*s)/2,item.w*s,item.h*s);},actor(ctx,id,costume,x,foot,size,pose='idle',time=0,reduced=false){const c=compose(Math.max(0,Math.min(6,id)),costume),s=size/256,t=reduced?0:time;ctx.save();ctx.translate(x,foot);if(pose==='cheer')ctx.translate(0,-Math.abs(Math.sin(t*7))*size*.055);if(pose==='sway')ctx.rotate(Math.sin(t*3)*.055);if(pose==='bow')ctx.scale(1,1-Math.max(0,Math.sin(t*2.5))*.15);if(!reduced)ctx.scale(1,1+Math.sin(t*2)*.003);ctx.drawImage(c,-192*s,-321*s,c.width*s,c.height*s);ctx.restore();}};
 }).catch(error=>{pending=null;throw error;});return pending;}
