import {DECOR,FRIENDS,SPAWN,WORLD,walkable,type Point,type Save} from './game-data.ts';
import {isRoom,roomWalkable,type PlacedFurniture} from './life-data.ts';

export const MAX_PLAYERS=6;
export const EMOTES=['👋','❤️','🎉','🎣','🌼','✨'] as const;
export type Emote=typeof EMOTES[number];
export type OnlinePlayer=Point & {id:string;name:string;character:number;facing:number;emote?:Emote;emoteUntil?:number};
export type SharedIsland={placed:Save['placed'];roomPlaced?:PlacedFurniture[];night:boolean};
export type ChatLine={id:string;name:string;text:string;system?:boolean};
export type WorldPacket={v:1;type:'world';players:OnlinePlayer[];island:SharedIsland;hostId:string};
export type PosePacket={v:1;type:'poses';players:OnlinePlayer[]};
export const PEER_PREFIX='our-six-island-v1-';
const CODE_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newRoomCode(){const bytes=new Uint8Array(10);crypto.getRandomValues(bytes);return Array.from(bytes,b=>CODE_ALPHABET[b%CODE_ALPHABET.length]).join('');}
export function roomCode(input:string){let text=input.trim();try{if(/^https?:\/\//i.test(text)){const url=new URL(text);text=new URLSearchParams(url.hash.slice(1)).get('room')||'';}}catch{return null}text=text.toUpperCase().replace(/[\s-]/g,'');return /^[A-HJ-NP-Z2-9]{10}$/.test(text)?text:null;}
export function inviteUrl(base:string,code:string){const url=new URL(base);url.hash=new URLSearchParams({room:code}).toString();return url.toString();}
export function cleanText(value:unknown,max:number){return typeof value==='string'?value.replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0,max):'';}
export function validPoint(value:unknown):value is Point{if(!value||typeof value!=='object')return false;const p=value as Point;return Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=WORLD.width&&p.y>=0&&p.y<=WORLD.height;}
export function readPlayer(value:unknown,id?:string):OnlinePlayer|null{
 if(!value||typeof value!=='object')return null;const p=value as OnlinePlayer;
 if(!validPoint(p)||!Number.isInteger(p.character)||p.character<0||p.character>=FRIENDS.length)return null;
 if(p.room!==undefined&&(!isRoom(p.room)||(p.room!=='island'&&!roomWalkable(p))))return null;
 const key=id??p.id;if(typeof key!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(key))return null;
 const name=cleanText(p.name,12)||FRIENDS[p.character].name;
 return {id:key,name,character:p.character,x:p.x,y:p.y,...(p.room?{room:p.room}:{}),facing:p.facing===-1?-1:1,
 ...(EMOTES.includes(p.emote as Emote)&&Number.isFinite(p.emoteUntil)?{emote:p.emote,emoteUntil:Math.min(p.emoteUntil!,Date.now()+5000)}:{})};
}
export function readIsland(value:unknown):SharedIsland|null{
 if(!value||typeof value!=='object')return null;const data=value as SharedIsland;if(!Array.isArray(data.placed)||data.placed.length>50||typeof data.night!=='boolean')return null;
 const placed:Save['placed']=[];const ids=new Set<string>();
 for(const p of data.placed){if(!validPoint(p)||!DECOR.some(d=>d.id===p.kind)||typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(p.id)||ids.has(p.id))return null;ids.add(p.id);placed.push({id:p.id,kind:p.kind,x:p.x,y:p.y});}
 if(data.roomPlaced!==undefined){if(!Array.isArray(data.roomPlaced)||data.roomPlaced.length>30)return null;const inside:PlacedFurniture[]=[];const used=new Set<string>();for(const p of data.roomPlaced){if(!roomWalkable(p)||!DECOR.some(d=>d.id===p.kind)||typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(p.id)||used.has(p.id))return null;used.add(p.id);inside.push({id:p.id,kind:p.kind,x:p.x,y:p.y});}return {placed,roomPlaced:inside,night:data.night};}
 return {placed,night:data.night};
}
export function readPlayers(value:unknown,sentAt?:unknown):OnlinePlayer[]|null{
 if(!Array.isArray(value)||value.length<1||value.length>MAX_PLAYERS)return null;
 const list=value.map(p=>{if(p&&typeof p==='object'&&typeof sentAt==='number'&&Number.isFinite(sentAt)&&Number.isFinite(p.emoteUntil)){p={...p,emoteUntil:Date.now()+Math.max(0,Math.min(4000,p.emoteUntil-sentAt))};}return readPlayer(p);});
 if(list.some(p=>!p))return null;const players=list as OnlinePlayer[];return new Set(players.map(p=>p.id)).size===players.length?players:null;
}
export function visitingSpawn(host:Point){for(const offset of [{x:75,y:45},{x:-75,y:45},{x:0,y:80},{x:0,y:0}]){const p={x:host.x+offset.x,y:host.y+offset.y,...(host.room?{room:host.room}:{})};if(host.room&&host.room!=='island'?roomWalkable(p):walkable(p))return p;}return {...SPAWN};}
export function persistentPosition(home:Point|null,current:Point|undefined,fallback:Point){return {...(home??current??fallback)};}
