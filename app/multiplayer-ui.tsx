'use client';
import {useEffect,useRef,useState} from 'react';
import {Copy,DoorOpen,Link,MessageCircle,Send,Users,Wifi} from 'lucide-react';
import {EMOTES,inviteUrl,roomCode} from './multiplayer-protocol';
import {CharacterAvatar} from './character-avatar';
import type {IslandSession,SessionView} from './multiplayer-session';

export function MultiplayerPanel({session,view,initialCode,onHost,onJoin,onWalk}:{session:IslandSession;view:SessionView;initialCode:string;onHost:()=>void;onJoin:(code:string)=>void;onWalk:()=>void}){
 const [code,setCode]=useState(initialCode),[draft,setDraft]=useState(''),[notice,setNotice]=useState(''),[link,setLink]=useState('');
 const messages=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(view.room)setLink(inviteUrl(window.location.href,view.room));},[view.room]);
 useEffect(()=>{if(initialCode)setCode(initialCode);},[initialCode]);
 useEffect(()=>{messages.current?.scrollTo({top:messages.current.scrollHeight,behavior:'smooth'});},[view.messages.at(-1)?.id]);
 const copy=async()=>{try{await navigator.clipboard.writeText(link);setNotice('초대 링크를 복사했어요. 친구에게 보내 주세요.');}catch{setNotice('아래 초대 링크를 선택해 직접 복사해 주세요.');}};
 const send=(event:React.FormEvent)=>{event.preventDefault();if(session.sendChat(draft)){setDraft('');setNotice('');}else setNotice('잠깐만 기다린 뒤 다시 보내 주세요. 입력한 내용은 그대로 있어요.');};
 if(view.status==='connecting')return <div className="online-connecting"><span className="online-ripple"><Wifi size={34}/></span><strong>{view.role==='host'?'친구를 맞을 준비를 하고 있어요':'친구의 섬으로 가는 중이에요'}</strong><p>잠깐만 기다려 주세요.</p><button className="secondary" onClick={()=>session.leave()}>연결 취소</button></div>;
 if(view.status!=='connected')return <div className="online-lobby">
  <div className="online-welcome"><span>🏝️</span><div><strong>같은 섬, 함께 보내는 하루</strong><p>최대 6명이 함께 걷고, 이야기를 나누고, 낚시를 즐겨요.</p></div></div>
  {view.error&&<p className="online-error" role="alert">{view.error}</p>}
  <button className="primary" onClick={onHost}><DoorOpen size={19}/> 내 섬에 친구 초대하기</button>
  <div className="online-divider"><span>친구에게 초대받았다면</span></div>
  <form className="online-join" onSubmit={e=>{e.preventDefault();if(roomCode(code))onJoin(code);}}><label htmlFor="room-code">방 코드 또는 초대 링크</label><input id="room-code" value={code} onChange={e=>setCode(e.target.value)} maxLength={500} placeholder="예: ABCDE F2345" autoComplete="off" spellCheck={false}/><button className="secondary" disabled={!roomCode(code)} type="submit"><Link size={17}/> 친구 섬으로 놀러 가기</button></form>
  <p className="online-note">방장은 게임 탭을 열어 두세요. 각자의 주머니와 부탁은 개인 진행으로 저장돼요. 친구의 섬에서는 방장이 가구를 꾸밀 수 있어요.</p>
 </div>;
 return <div className="online-room">
  <div className="online-room-heading"><div><span className="online-dot"/> {view.role==='host'?'내 섬이 열려 있어요':'친구의 섬에 놀러 왔어요'}</div><b><Users size={16}/> {view.players.length} / 6</b></div>
  <div className="invite-card"><span>방 코드</span><strong>{view.room.slice(0,5)} {view.room.slice(5)}</strong><button onClick={copy} aria-label="초대 링크 복사"><Copy size={18}/> 초대 링크</button><input value={link} readOnly aria-label="공유할 초대 링크" onFocus={e=>e.target.select()}/></div>
  {notice&&<p className="online-notice" role="status">{notice}</p>}
  <div className="online-members">{view.players.map(p=><div key={p.id} className={p.id===view.selfId?'is-you':''}><CharacterAvatar id={p.character} appearance={p.appearance}/><strong>{p.name}</strong><small>{p.id===view.selfId?'나':p.id.endsWith(view.room)?'방장':'친구'}</small></div>)}</div>
  <div className="online-emotes" aria-label="이모티콘 보내기">{EMOTES.map(emote=><button key={emote} onClick={()=>session.sendEmote(emote)} aria-label={`${emote} 보내기`}>{emote}</button>)}</div>
  <div className="online-chat" ref={messages} role="log" aria-label="친구들과의 채팅" aria-live="polite">{view.messages.length?view.messages.map(line=><p key={line.id} className={line.system?'system-line':''}>{!line.system&&<strong>{line.name}</strong>}<span>{line.text}</span></p>):<p className="system-line">친구들에게 반가운 인사를 건네 보세요.</p>}</div>
  <form className="online-chat-form" onSubmit={send}><MessageCircle size={18}/><input aria-label="채팅 메시지" placeholder="친구에게 한마디…" maxLength={100} value={draft} onChange={e=>setDraft(e.target.value)} autoComplete="off"/><button type="submit" disabled={!draft.trim()} aria-label="메시지 보내기"><Send size={18}/></button></form>
  <button className="primary" onClick={onWalk}>함께 산책하기 <Users size={18}/></button><button className="online-leave" onClick={()=>session.leave()}>{view.role==='host'?'섬 닫고 혼자 놀기':'내 섬으로 돌아가기'}</button>
 </div>;
}
