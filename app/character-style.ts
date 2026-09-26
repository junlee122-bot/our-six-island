export const HAIR_COLORS=[{id:'wine',name:'도원의 와인',hex:'#963d4e'},{id:'ink',name:'먹빛',hex:'#292e36'},{id:'brown',name:'밤색',hex:'#745044'},{id:'honey',name:'꿀빛',hex:'#c39754'},{id:'rose',name:'로즈',hex:'#d07a95'},{id:'blue',name:'바다색',hex:'#4e7998'},{id:'silver',name:'은빛',hex:'#b7bcc9'},{id:'forest',name:'숲빛',hex:'#527967'}] as const;
export const TOP_COLORS=[{id:'charcoal',name:'차콜',hex:'#323b43'},{id:'cream',name:'크림',hex:'#e9dfc9'},{id:'coral',name:'코랄',hex:'#d97c64'},{id:'ocean',name:'바다',hex:'#4c91aa'},{id:'leaf',name:'풀잎',hex:'#71996a'},{id:'sun',name:'햇살',hex:'#ddb75f'},{id:'lavender',name:'라벤더',hex:'#a291b5'},{id:'berry',name:'베리',hex:'#b55d79'}] as const;
// Hats were removed from the game. `hat` stays in Appearance (always 'none')
// so old saves, old clients and old servers that still send 'cap', 'straw',
// 'bucket' or 'beanie' are read back as bare-headed, and an old
// client that defaults a missing field (재민's cap) sees 'none' instead.
export const HATS=[{id:'none',name:'벗기',cell:-1}] as const;
export const GLASSES=[{id:'none',name:'벗기',cell:-1},{id:'round',name:'둥근 안경',cell:4},{id:'silver',name:'은테 안경',cell:5},{id:'sun',name:'선글라스',cell:6}] as const;
export type Appearance={hair:string;top:string;hat:string;glasses:string;clip:boolean};
export type Motion='idle'|'walk'|'run'|'wave'|'gather'|'celebrate';
export const MOTIONS:Motion[]=['idle','walk','run','wave','gather','celebrate'];
export function defaultAppearance(character:number):Appearance{return {hair:character===0?'wine':'ink',top:character===2||character===3?'cream':'charcoal',hat:'none',glasses:character===1||character===4?'round':character===2?'silver':'none',clip:false};}
export function readAppearance(value:unknown,character=0):Appearance{
 const base=defaultAppearance(character),v=value&&typeof value==='object'?value as Partial<Appearance>:{};
 return {hair:HAIR_COLORS.some(c=>c.id===v.hair)?v.hair!:base.hair,top:TOP_COLORS.some(c=>c.id===v.top)?v.top!:base.top,hat:'none',glasses:GLASSES.some(c=>c.id===v.glasses)?v.glasses!:base.glasses,clip:typeof v.clip==='boolean'?v.clip:base.clip};
}
export function readWardrobe(value:unknown):Appearance[]{return Array.from({length:6},(_,i)=>readAppearance(Array.isArray(value)?value[i]:undefined,i));}
export function appearanceKey(character:number,a:Appearance){return [character,a.hair,a.top,a.hat,a.glasses,Number(a.clip)].join(':');}
export function readMotion(value:unknown):Motion{return MOTIONS.includes(value as Motion)?value as Motion:'idle';}
export function motionFrame(motion:Motion,seconds:number,reduced=false){
 if(reduced)return motion==='wave'||motion==='celebrate'?3:0;
 if(motion==='walk'||motion==='run')return [0,1,0,2][Math.floor(seconds*(motion==='run'?12:7))%4];
 return motion==='wave'||motion==='celebrate'?3:0;
}
export function motionTransform(motion:Motion,seconds:number,reduced=false){
 if(reduced)return {lift:0,tilt:0,scaleX:1,scaleY:1};
 if(motion==='run')return {lift:Math.abs(Math.sin(seconds*19))*5,tilt:Math.sin(seconds*9)*.035,scaleX:1,scaleY:1};
 if(motion==='walk')return {lift:Math.abs(Math.sin(seconds*11))*2,tilt:Math.sin(seconds*6)*.015,scaleX:1,scaleY:1};
 if(motion==='gather')return {lift:0,tilt:.1,scaleX:1.05,scaleY:.82};
 if(motion==='celebrate')return {lift:Math.abs(Math.sin(seconds*8))*13,tilt:Math.sin(seconds*8)*.045,scaleX:1,scaleY:1};
 if(motion==='wave')return {lift:1,tilt:Math.sin(seconds*8)*.035,scaleX:1,scaleY:1};
 return {lift:Math.sin(seconds*2)*.8,tilt:0,scaleX:1,scaleY:1+Math.sin(seconds*2)*.007};
}
// Runtime dye channels preserve skin, outlines, eyes, trousers, and alpha.
export function dyePixel(r:number,g:number,b:number,hair:readonly number[],top:readonly number[]):number[]{
 const hairWeight=Math.max(0,Math.min(1,(b-Math.max(r,g)*1.12)/28));
 const topWeight=Math.max(0,Math.min(1,(Math.min(g,b)-r*1.18)/35))*(g>=b*.9?1:0);
 const dye=hairWeight>topWeight?hair:top,weight=Math.max(hairWeight,topWeight);
 if(!weight)return [r,g,b];
 const light=Math.max(.32,Math.min(1.3,(.21*r+.72*g+.07*b)/(hairWeight>topWeight?85:145)));
 return [r,g,b].map((v,i)=>Math.round(v*(1-weight)+Math.min(255,dye[i]*light)*weight));
}

// Some generated RGB sheets contain a neutral checkerboard. Remove only its
// edge-connected pixels at load time, preserving enclosed whites and colors.
// `maxSpread` is how far from grey (max-min channel) a backdrop pixel may be.
// Art whose warm off-white shoes touch the checkerboard passes a tighter value.
export function removeConnectedBackdrop(data:Uint8ClampedArray,width:number,height:number,maxSpread=26){
 const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let tail=0;
 const visit=(p:number)=>{if(p<0||p>=seen.length||seen[p])return;seen[p]=1;const k=p*4,r=data[k],g=data[k+1],b=data[k+2];
  if(data[k+3]===0||(Math.min(r,g,b)>174&&Math.max(r,g,b)-Math.min(r,g,b)<maxSpread)){data[k+3]=0;queue[tail++]=p;}
 };
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
 for(let head=0;head<tail;head++){const p=queue[head],x=p%width;if(x>0)visit(p-1);if(x<width-1)visit(p+1);visit(p-width);visit(p+width);}
}
