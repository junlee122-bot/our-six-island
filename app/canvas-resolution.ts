import { WORLD } from './game-data.ts';
import { ROOM_SIZE } from './life-data.ts';

// Keep the walking area visible between the room header and bottom controls.
export function interiorCamera(width:number,height:number,scale:number,camera:{x:number;y:number}) {
  const top=Math.min(160,height*.22),bottom=height-Math.min(165,height*.28);
  const roomWidth=ROOM_SIZE.width*scale,roomHeight=ROOM_SIZE.height*scale;
  const ox=roomWidth<=width?(width-roomWidth)/2:Math.min(0,Math.max(width-roomWidth,width/2-camera.x*scale));
  const oy=roomHeight<=bottom-top?top+(bottom-top-roomHeight)/2:
    Math.min(top,Math.max(bottom-roomHeight,top+(bottom-top)*.62-camera.y*scale));
  return {ox,oy};
}

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
