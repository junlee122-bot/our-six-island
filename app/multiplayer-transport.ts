import {RealtimeClient,type RealtimeChannel} from '@supabase/realtime-js';
import {createIdentity,FrameVerifier,signFrame,type Identity} from './multiplayer-identity.ts';
import {PEER_PREFIX} from './multiplayer-protocol.ts';

// Frontend publishable key; no database, authentication or privileged API access.
export const REALTIME_URL='wss://ogfpeqeoaznwjbrbedbx.supabase.co/realtime/v1';
export const REALTIME_KEY='sb_publishable_qoHHUYiC5jBUSK3vpYPV2A_LOLiGR7L';
const TOPIC='our-six-island-v2:';
export class IslandRoom {
 readonly id:string;
 readonly code:string;
 private client:RealtimeClient;
 private channel:RealtimeChannel;
 private verifier:FrameVerifier;
 private sequence=0;
 private outgoing=Promise.resolve();
 private incoming=Promise.resolve();
 private closed=false;
 private disposed=false;
 private queued=0;
 private receiving=0;
 private ready=false;
 private connectedOnce=false;
 private identity:Identity;
 private host:boolean;
 private constructor(identity:Identity,host:boolean,code:string,topic=TOPIC,maxBody=24000){
  this.identity=identity;this.host=host;
  this.id=identity.id;this.code=code;
  this.verifier=new FrameVerifier(code,this.id,host,maxBody);
  this.client=new RealtimeClient(REALTIME_URL,{params:{apikey:REALTIME_KEY},heartbeatIntervalMs:20000});
  this.channel=this.client.channel(topic+code,{config:{broadcast:{ack:false,self:false},private:false}});
 }
 static async create(host:boolean,code:string,topic=TOPIC,maxBody=24000){const identity=await createIdentity(host);return new IslandRoom(identity,host,host?identity.code:code,topic,maxBody);}
 retain(ids:string[]){this.verifier.retain(ids);}
 connect(onMessage:(from:string,data:unknown)=>void,onError:(detail:string)=>void){
  return new Promise<void>((resolve,reject)=>{
   this.channel.on('broadcast',{event:'game'},({payload})=>{
    if(this.closed||this.receiving>=64)return;
    ++this.receiving;
    this.incoming=this.incoming.then(async()=>{
     if(this.closed)return;const frame=await this.verifier.read(payload);
     if(frame&&!this.closed)onMessage(frame.from,frame.message);
    }).catch(()=>{}).finally(()=>{--this.receiving;});
   });
   this.channel.subscribe((status,error)=>{
    if(this.closed)return;
    if(status==='SUBSCRIBED'){this.ready=true;this.connectedOnce=true;resolve();}
    else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){
     this.ready=false;const detail=error?.message||status;
     if(this.connectedOnce)onError(detail);else reject(new Error(detail));
    }
   });
  });
 }
 send(to:string,message:unknown){
  if(this.closed||!this.ready||this.queued>=32)return false;
  ++this.queued;const seq=++this.sequence;
  this.outgoing=this.outgoing.then(async()=>{
   if(this.disposed)return;
   const frame=await signFrame(this.identity,this.code,to,seq,message);
   if(this.disposed)return;
   await this.channel.send({type:'broadcast',event:'game',payload:frame});
  }).catch(()=>{}).finally(()=>{--this.queued;});return true;
 }
 close(){
  if(this.closed)return;
  this.send(this.host?'*':PEER_PREFIX+this.code,{v:1,type:this.host?'closed':'leave'});
  this.closed=true;this.ready=false;
  // Give an explicit departure a brief chance to flush. Heartbeats cover tab crashes.
  void Promise.race([this.outgoing,new Promise(r=>setTimeout(r,400))]).then(async()=>{
   this.disposed=true;
   try{await this.client.removeAllChannels();}finally{this.client.disconnect();}
  }).catch(()=>{});
 }
}
