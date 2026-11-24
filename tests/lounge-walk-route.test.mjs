import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceWalkRoute, walkFrameSeconds } from '../app/lounge-walk-route.ts';
import { defaultBedroom, roomShape, setActiveRoomShape } from '../app/lounge-bedroom-data.ts';
import { canWalk, findWalkPath, roomObstacles, walkStart, walkStep, setWalkObstacles } from '../app/lounge-bedroom-navigation.ts';

const direct = (p, dx, dz) => ({ x:p.x+dx,z:p.z+dz });
const route = [{x:0.25,z:0},{x:0.25,z:0.25},{x:1,z:0.25},{x:1,z:1},{x:3,z:1},{x:3,z:3},{x:6,z:3}];
function replay(fps, seconds = 1, step = direct, path = route, from = {x:0,z:0}) {
  let point=from, remaining=path, previous=1000;
  for(let i=1;i<=fps*seconds;i++) {
    const now=1000+i*1000/fps;
    const next=advanceWalkRoute(point,remaining,5.2*walkFrameSeconds(now,previous),step);
    point=next.point;remaining=next.route;previous=now;
  }
  return {point,route:remaining};
}

test('two-FPS and sixty-FPS click walking cover the same real distance through multiple bends', () => {
  const slow=replay(2),fast=replay(60);
  assert.ok(Math.hypot(slow.point.x-fast.point.x,slow.point.z-fast.point.z)<1e-8);
  assert.ok(Math.abs(slow.point.x-3)<1e-8 && Math.abs(slow.point.z-2.2)<1e-8,'all 5.2 units of the one-second budget were used');
});
test('a waypoint reached partway through a frame does not discard the rest of that frame', () => {
  const next=advanceWalkRoute({x:0,z:0},[{x:.1,z:0},{x:.1,z:.1},{x:2,z:.1}],1,direct);
  assert.deepEqual(next.route,[{x:2,z:.1}]);
  assert.ok(Math.abs(next.point.x-.9)<1e-10);
  assert.ok(Math.abs(next.point.z-.1)<1e-10);
});
test('raw click precision survives a millimetre-rounded stepper without dropping the following route', () => {
  const rounded = (p,dx,dz) => ({x:Math.round((p.x+dx)*1000)/1000,z:Math.round((p.z+dz)*1000)/1000});
  const next=advanceWalkRoute({x:0,z:0},[{x:.1234,z:0},{x:.1234,z:.5678},{x:2,z:.5678}],1,rounded);
  assert.equal(next.route.length,1,'unrepresentable intermediate click coordinates do not cancel the route');
  assert.ok(next.point.x>.4 && Math.abs(next.point.z-.568)<.001);
  const end=advanceWalkRoute({x:0,z:0},[{x:.1234,z:.5678}],2,rounded);
  assert.equal(end.route.length,0);
  assert.ok(Math.hypot(end.point.x-.1234,end.point.z-.5678)<.002);
});
test('long stalls are bounded and paused, first-frame, backwards and nonfinite clocks never move', () => {
  assert.equal(walkFrameSeconds(1500,1000),.5);
  assert.equal(walkFrameSeconds(60_000,1000),.5,'no minute-long catch-up after a stalled tab');
  for(const pair of [[1000,0],[500,1000],[NaN,1000],[1000,Infinity]]) assert.equal(walkFrameSeconds(...pair),0);
  assert.deepEqual(advanceWalkRoute({x:0,z:0},route,0,direct),{point:{x:0,z:0},route});
  assert.deepEqual(advanceWalkRoute({x:0,z:0},route,Infinity,direct),{point:{x:0,z:0},route});
});
test('the real room collision stepper still blocks furniture and coarse walking follows a reachable route', () => {
  const shape=roomShape(0);setActiveRoomShape(shape);
  const room=defaultBedroom(3),obstacles=roomObstacles(room,shape),start=walkStart(shape);
  setWalkObstacles(obstacles);
  try {
    const target={x:4.2,z:-.45},path=findWalkPath(start,target,obstacles,{exact:true});
    assert.ok(path.length);
    const slow=replay(2,4,walkStep,path,start),fast=replay(60,4,walkStep,path,start);
    assert.ok(canWalk(slow.point,obstacles));
    assert.ok(Math.hypot(slow.point.x-target.x,slow.point.z-target.z)<.02);
    assert.ok(Math.hypot(slow.point.x-fast.point.x,slow.point.z-fast.point.z)<.02);
    const blocked=advanceWalkRoute(target,[{x:4.2,z:-2.46}],20,walkStep);
    assert.ok(canWalk(blocked.point,obstacles));
    assert.ok(blocked.point.z>-.73,'the bed stays solid, even with a long budget');
  } finally {setWalkObstacles([]);setActiveRoomShape(roomShape(0));}
});
