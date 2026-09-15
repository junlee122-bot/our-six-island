import {PEER_PREFIX} from './multiplayer-protocol.ts';

const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const encoder=new TextEncoder();
const algorithm={name:'ECDSA',namedCurve:'P-256'};
const signing={name:'ECDSA',hash:'SHA-256'};
const base64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const unbase64=(value:string)=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
type PublicKey={x:string;y:string};
export type SignedFrame={body:string;signature:string;key:PublicKey};
type Body={v:1;room:string;from:string;to:string;seq:number;message:unknown};
export type Identity={id:string;code:string;key:PublicKey;privateKey:CryptoKey};

async function fingerprint(key:PublicKey){
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(`P-256:${key.x}:${key.y}`)));
 return {id:'islander-'+base64(digest),code:Array.from(digest.slice(0,10),b=>alphabet[b%32]).join('')};
}
export async function createIdentity(host:boolean):Promise<Identity>{
 const pair=await crypto.subtle.generateKey(algorithm,false,['sign','verify']);
 const exported=await crypto.subtle.exportKey('jwk',pair.publicKey),key={x:exported.x!,y:exported.y!};
 const hash=await fingerprint(key);
 return {...hash,id:host?PEER_PREFIX+hash.code:hash.id,key,privateKey:pair.privateKey};
}
export async function signFrame(identity:Identity,room:string,to:string,seq:number,message:unknown):Promise<SignedFrame>{
 const body=JSON.stringify({v:1,room,from:identity.id,to,seq,message});
 const signature=await crypto.subtle.sign(signing,identity.privateKey,encoder.encode(body));
 return {body,signature:base64(new Uint8Array(signature)),key:identity.key};
}

// Broadcast sender fields are untrusted. Bind identities to the signing key,
// bind the host to the invitation, and commit sequence numbers only after verify.
export class FrameVerifier {
 private peers=new Map<string,{key:CryptoKey;fingerprint:string;seq:number}>();
 private active=new Set<string>();
 private room:string;
 private selfId:string;
 private host:boolean;
 private maxBody:number;
 constructor(room:string,selfId:string,host:boolean,maxBody=24000){this.room=room;this.selfId=selfId;this.host=host;this.maxBody=maxBody;}
 retain(ids:string[]){this.active=new Set(ids);}
 async read(value:unknown):Promise<Body|null>{
  try{
   const frame=value as SignedFrame;
   if(!frame||typeof frame.body!=='string'||frame.body.length>this.maxBody||typeof frame.signature!=='string'||frame.signature.length!==86||!frame.key||typeof frame.key.x!=='string'||typeof frame.key.y!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(frame.key.x)||!/^[A-Za-z0-9_-]{43}$/.test(frame.key.y))return null;
   const body=JSON.parse(frame.body) as Body;
   if(!body||body.v!==1||body.room!==this.room||typeof body.from!=='string'||body.from===this.selfId||(body.to!==this.selfId&&body.to!=='*')||!Number.isSafeInteger(body.seq)||body.seq<1)return null;
   const hostId=PEER_PREFIX+this.room;
   if(this.host?(body.from===hostId||body.to!==this.selfId):body.from!==hostId)return null;
   const keyString=`${frame.key.x}:${frame.key.y}`;
   let peer=this.peers.get(body.from);
   if(peer&&(peer.fingerprint!==keyString||body.seq<=peer.seq))return null;
   if(!peer){
    const type=(body.message as {type?:unknown}|null)?.type;
    if(this.host&&type!=='hello'&&type!=='join')return null;
    const hash=await fingerprint(frame.key);
    if(this.host?body.from!==hash.id:hash.code!==this.room)return null;
    const key=await crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',...frame.key},algorithm,false,['verify']);
    peer={key,fingerprint:keyString,seq:0};
   }
   if(!await crypto.subtle.verify(signing,peer.key,unbase64(frame.signature),encoder.encode(frame.body)))return null;
   const latest=this.peers.get(body.from);
   if(latest&&(latest.fingerprint!==keyString||body.seq<=latest.seq))return null;
   peer.seq=body.seq;this.peers.delete(body.from);this.peers.set(body.from,peer);
   // Keep active players pinned. Evicted visitors must answer a fresh host challenge.
   if(this.peers.size>32){for(const id of this.peers.keys()){if(!this.active.has(id)){this.peers.delete(id);break;}}}
   return body;
  }catch{return null;}
 }
}
