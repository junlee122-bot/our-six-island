'use client';
import {useState} from 'react';
import {Check,RotateCcw,Shirt,Sparkles} from 'lucide-react';
import {CharacterAvatar} from './character-avatar';
import {HAIR_COLORS,TOP_COLORS,HATS,GLASSES,defaultAppearance,type Appearance,type Motion} from './character-style';
import type {Save} from './game-data';

export function Wardrobe({save,onApply,onClose}:{save:Save;onApply:(styles:Appearance[])=>void;onClose:()=>void}){
 const [draft,setDraft]=useState(()=>save.wardrobe.map(a=>({...a}))),[selected,setSelected]=useState(save.character),[motion,setMotion]=useState<Motion>('walk');
 const a=draft[selected],change=(patch:Partial<Appearance>)=>setDraft(all=>all.map((old,i)=>i===selected?{...old,...patch}:old));
 const changed=JSON.stringify(draft)!==JSON.stringify(save.wardrobe);
 return <div className="wardrobe"><div className="wardrobe-friends" role="group" aria-label="꾸밀 친구 선택">{save.names.map((name,i)=><button key={i} className={selected===i?'selected':''} onClick={()=>setSelected(i)} aria-pressed={selected===i}><CharacterAvatar id={i} appearance={draft[i]}/><span>{name}{i===save.character?' · 나':''}</span></button>)}</div>
 <div className="wardrobe-layout"><div className="fitting-room"><span className="fitting-label"><Sparkles size={16}/> {save.names[selected]}의 오늘</span><CharacterAvatar id={selected} appearance={a} className="fitting-avatar" motion={motion} animated/><div className="fitting-platform"/><div className="motion-choices" role="group" aria-label="모션 미리보기">{([{id:'idle',name:'서 있기'},{id:'walk',name:'걷기'},{id:'run',name:'달리기'},{id:'wave',name:'인사'}] as {id:Motion;name:string}[]).map(m=><button key={m.id} onClick={()=>setMotion(m.id)} className={motion===m.id?'selected':''} aria-pressed={motion===m.id}>{m.name}</button>)}</div><p>색을 고르고 움직이는 모습을 확인해 보세요.</p></div>
 <div className="wardrobe-options"><fieldset><legend>머리 색</legend><div className="color-options">{HAIR_COLORS.map(c=><button key={c.id} style={{'--swatch':c.hex} as React.CSSProperties} className={a.hair===c.id?'selected':''} onClick={()=>change({hair:c.id})} title={c.name} aria-label={c.name} aria-pressed={a.hair===c.id}>{a.hair===c.id&&<Check size={18}/>}</button>)}</div></fieldset><fieldset><legend><Shirt size={17}/> 옷 색</legend><div className="color-options">{TOP_COLORS.map(c=><button key={c.id} style={{'--swatch':c.hex} as React.CSSProperties} className={a.top===c.id?'selected':''} onClick={()=>change({top:c.id})} title={c.name} aria-label={c.name+' 옷'} aria-pressed={a.top===c.id}>{a.top===c.id&&<Check size={18}/>}</button>)}</div></fieldset>
 <fieldset><legend>모자</legend><div className="wearable-options">{HATS.map(h=><button key={h.id} className={a.hat===h.id?'selected':''} onClick={()=>change({hat:h.id})} aria-pressed={a.hat===h.id}>{h.cell>=0&&<span className="wearable-art" style={{backgroundPosition:`${h.cell%4*100/3}% 0%`}}/>}<span>{h.name}</span></button>)}</div></fieldset>
 <fieldset><legend>안경</legend><div className="wearable-options">{GLASSES.map(g=><button key={g.id} className={a.glasses===g.id?'selected':''} onClick={()=>change({glasses:g.id})} aria-pressed={a.glasses===g.id}>{g.cell>=0&&<span className="wearable-art" style={{backgroundPosition:`${g.cell%4*100/3}% 100%`}}/>}<span>{g.name}</span></button>)}</div></fieldset>
 <button className={'flower-clip '+(a.clip?'selected':'')} onClick={()=>change({clip:!a.clip})} aria-pressed={a.clip}><span className="wearable-art" style={{backgroundPosition:'100% 100%'}}/>꽃 머리핀 {a.clip?'착용 중':'달기'}</button>
 <button className="wardrobe-reset" onClick={()=>change(defaultAppearance(selected))}><RotateCcw size={15}/> {save.names[selected]}의 기본 모습</button></div></div>
 <div className="wardrobe-footer"><p>여섯 친구를 각각 꾸밀 수 있어요. 친구의 섬에는 내 캐릭터의 모습이 전달돼요.</p><div><button className="secondary" onClick={onClose}>취소</button><button className="primary" disabled={!changed} onClick={()=>onApply(draft.map(a=>({...a})))}><Check size={17}/> 이 모습으로 저장</button></div></div></div>;
}
