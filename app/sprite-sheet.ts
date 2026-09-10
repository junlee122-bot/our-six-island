// Remove a neutral background connected to the image edges. Interior details remain intact.
const pending = new Map<string, Promise<HTMLImageElement>>();
function loadCutout(path:string,variable:string,crop=false){
 let result=pending.get(path);if(result)return result;
 result=new Promise<HTMLImageElement>((resolve,reject)=>{
  const source=new Image();source.onerror=reject;
  source.onload=()=>{try{
   const canvas=document.createElement('canvas');canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
   const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(source,0,0);
   const im=ctx.getImageData(0,0,canvas.width,canvas.height),data=im.data,w=canvas.width,h=canvas.height;
   const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let tail=0;
   const add=(p:number)=>{if(p<0||p>=w*h||seen[p])return;seen[p]=1;const k=p*4,r=data[k],g=data[k+1],b=data[k+2];if(Math.min(r,g,b)>174&&Math.max(r,g,b)-Math.min(r,g,b)<24){data[k+3]=0;queue[tail++]=p}};
   for(let x=0;x<w;x++){add(x);add((h-1)*w+x)}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}
   for(let head=0;head<tail;head++){const p=queue[head],x=p%w;if(x>0)add(p-1);if(x<w-1)add(p+1);add(p-w);add(p+w)}
   ctx.putImageData(im,0,0);let output=canvas;
   if(crop){let left=w,top=h,right=0,bottom=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(data[(y*w+x)*4+3]>0){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}}if(right>=left&&bottom>=top){output=document.createElement('canvas');output.width=right-left+1;output.height=bottom-top+1;output.getContext('2d')!.drawImage(canvas,left,top,output.width,output.height,0,0,output.width,output.height)}}
   const url=output.toDataURL('image/png');document.documentElement.style.setProperty(variable,`url("${url}")`);
   const clean=new Image();clean.onload=()=>resolve(clean);clean.onerror=reject;clean.src=url;
  }catch(error){reject(error)}};source.src=path;
 });pending.set(path,result);return result;
}
export const loadSpriteSheet=()=>loadCutout('/assets/friends-v2.png','--sprite-sheet');
export const loadMayorSprite=()=>loadCutout('/assets/mayor-hohyeon.png','--mayor-sprite',true);
