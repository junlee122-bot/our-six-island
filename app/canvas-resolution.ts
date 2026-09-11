import { WORLD } from './game-data.ts';

export function canvasPixelRatio(width:number,height:number,deviceRatio:number) {
  const safeRatio=Number.isFinite(deviceRatio)?Math.max(1,deviceRatio):1;
  const pixelBudget=16_000_000;
  return Math.min(safeRatio,3,Math.sqrt(pixelBudget/Math.max(1,width*height)));
}

// Match the visible world rectangle to the same rectangle of the full-resolution texture.
export function visibleMapCrop(width:number,height:number,ox:number,oy:number,scale:number,textureWidth:number,textureHeight:number) {
  const left=Math.max(0,-ox/scale),top=Math.max(0,-oy/scale);
  const right=Math.min(WORLD.width,(width-ox)/scale),bottom=Math.min(WORLD.height,(height-oy)/scale);
  return {sx:left/WORLD.width*textureWidth,sy:top/WORLD.height*textureHeight,
    sw:(right-left)/WORLD.width*textureWidth,sh:(bottom-top)/WORLD.height*textureHeight,
    dx:left,dy:top,dw:right-left,dh:bottom-top};
}
