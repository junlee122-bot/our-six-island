// Room codes and the peer-id prefix shared by the lounge (cloud engine, cloud
// room and the P2P transport). The old island protocol (players, island
// state, positions) was removed with island.html / theater.html.
export const PEER_PREFIX='our-six-island-v1-';
export function roomCode(input:string){let text=input.trim();try{if(/^https?:\/\//i.test(text)){const url=new URL(text);text=new URLSearchParams(url.hash.slice(1)).get('room')||'';}}catch{return null}text=text.toUpperCase().replace(/[\s-]/g,'');return /^[A-HJ-NP-Z2-9]{10}$/.test(text)?text:null;}
