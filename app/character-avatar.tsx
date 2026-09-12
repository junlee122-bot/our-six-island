'use client';
import {createContext,useContext,useEffect,useRef} from 'react';
import {loadCharacters} from './character-renderer';
import {readWardrobe,type Appearance,type Motion} from './character-style';
export const WardrobeContext=createContext<Appearance[]>(readWardrobe(undefined));
export function CharacterAvatar({id,appearance,className='',style,motion='idle',animated=false}:{id:number;appearance?:Appearance;className?:string;style?:React.CSSProperties;motion?:Motion;animated?:boolean}){
 const wardrobe=useContext(WardrobeContext),canvas=useRef<HTMLCanvasElement>(null),a=appearance??wardrobe[id];
 useEffect(()=>{
  const c=canvas.current;if(!c)return;let alive=true,frame=0,refresh:(()=>void)|undefined;const ctx=c.getContext('2d')!,preference=matchMedia('(prefers-reduced-motion: reduce)');let reduced=preference.matches;
  const preferenceChanged=()=>{reduced=preference.matches;cancelAnimationFrame(frame);refresh?.();};preference.addEventListener('change',preferenceChanged);
  loadCharacters().then(renderer=>{if(!alive)return;const draw=(t:number)=>{if(!alive)return;ctx.clearRect(0,0,c.width,c.height);renderer.draw(ctx,id,a,160,296,240,motion,t/1000,1,reduced);if(animated&&!reduced)frame=requestAnimationFrame(draw);};refresh=()=>draw(0);refresh();}).catch(()=>{});
  return()=>{alive=false;cancelAnimationFrame(frame);preference.removeEventListener('change',preferenceChanged);};
 },[id,a,motion,animated]);
 return <canvas ref={canvas} width={320} height={320} className={'avatar character-canvas '+className} style={style} role="img" aria-label="직접 꾸민 캐릭터"/>;
}
