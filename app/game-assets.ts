export const GAME_ASSETS={
 map:'/assets/island-hd.webp',
 friends:'/assets/friends-v2.png',
 mayor:'/assets/mayor-hohyeon.png',
 interiors:'/assets/interiors-hd.webp',
 furniture:'/assets/furniture.png',
 facilities:'/assets/facilities.png',
};
export function loadArt(src:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('그림을 불러오지 못했어요'));img.src=src;});}
