'use client';
import { MAYOR, REGIONS, WORLD, type Point, type Save } from './game-data';

export function MayorAvatar({className=''}:{className?:string}) {
  return <span className={`mayor-avatar ${className}`} role="img" aria-label="빨간 모자와 배낭을 갖춘 남성 촌장 호현" />;
}

export default function IslandMap({save,onRegion,onMayor}:{save:Save;onRegion:(id:string)=>void;onMayor:()=>void}) {
  const point=(p:Point)=>({left:`${p.x/WORLD.width*100}%`,top:`${p.y/WORLD.height*100}%`});
  return <>
    <div className="island-atlas" aria-label="확장된 여섯섬 전체 지도">
      {REGIONS.map(region=><button key={region.id} className={`atlas-pin ${save.explored.includes(region.id)?'visited':''}`} style={point(region)} onClick={()=>onRegion(region.id)} aria-label={`${region.name}으로 걸어가기`}><span>{region.emoji}</span><strong>{region.name}</strong></button>)}
      <button className="atlas-mayor" style={point(MAYOR)} onClick={onMayor} aria-label="호현 촌장에게 걸어가기">호현 촌장</button>
      <span className="atlas-player" style={point(save.position)} title="현재 위치" aria-label="내 현재 위치">나</span>
    </div>
    <p className="map-caption">목적지를 누르면 길을 따라 걸어가요. 방문한 지역 {save.explored.length} / {REGIONS.length}</p>
    <div className="region-list">{REGIONS.map(region=><button key={region.id} onClick={()=>onRegion(region.id)}><span>{region.emoji}</span><div><strong>{region.name}</strong><small>{region.description}</small></div><b>{save.explored.includes(region.id)?'✓':'→'}</b></button>)}</div>
  </>;
}
