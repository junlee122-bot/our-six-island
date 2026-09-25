import test from 'node:test';
import assert from 'node:assert/strict';
import {readSettings,DEFAULT_SETTINGS} from '../app/lounge-settings.ts';

test('settings default to sound on at low volume and tolerate bad storage',()=>{
 assert.deepEqual(readSettings(null),DEFAULT_SETTINGS);
 assert.equal(DEFAULT_SETTINGS.sound,true);
 assert.ok(DEFAULT_SETTINGS.volume>0&&DEFAULT_SETTINGS.volume<0.5);
 assert.deepEqual(readSettings('{not json'),DEFAULT_SETTINGS);
 assert.deepEqual(readSettings('[1,2]').sound,true);
});
test('settings keep valid values and reject invalid ones',()=>{
 const s=readSettings(JSON.stringify({sound:false,volume:0.8,reactionsHidden:true,notifications:'yes',simpleGraphics:true,extra:1}));
 assert.equal(s.sound,false);assert.equal(s.volume,0.8);assert.equal(s.reactionsHidden,true);
 assert.equal(s.notifications,false);assert.equal(s.simpleGraphics,true);assert.equal('extra' in s,false);
 assert.equal(readSettings(JSON.stringify({volume:7})).volume,DEFAULT_SETTINGS.volume);
});
import {needsMigration,qualityProfile} from '../app/lounge-settings.ts';
import {DEFAULT_KEYBINDS} from '../app/lounge-keybinds.ts';

test('version 1 settings migrate: values kept, vibrate dropped, PC options at defaults',()=>{
 const v1=JSON.stringify({sound:false,volume:0.6,reactionsHidden:true,notifications:true,vibrate:true,simpleGraphics:false,music:false,dayNight:false,seasonFx:false});
 assert.equal(needsMigration(v1),true);
 const s=readSettings(v1);
 assert.equal(s.version,2);
 assert.equal(s.sound,false);assert.equal(s.volume,0.6);assert.equal(s.music,false);
 assert.equal(s.reactionsHidden,true);assert.equal(s.notifications,true);
 assert.equal(s.dayNight,false);assert.equal(s.seasonFx,false);
 assert.equal('vibrate' in s,false);
 assert.equal(s.quality,'mid');assert.equal(s.fpsCap,0);assert.equal(s.uiScale,100);assert.equal(s.textScale,100);
 assert.equal(s.musicVolume,1);assert.equal(s.effectsVolume,1);assert.equal(s.uiVolume,1);
 assert.equal(s.attention,true);assert.equal(s.fullscreen,false);
 assert.deepEqual(s.keys,{...DEFAULT_KEYBINDS});
 assert.equal(needsMigration(JSON.stringify(s)),false);
 assert.equal(needsMigration('{not json'),false);
});
test('version 2 settings validate every PC option',()=>{
 const s=readSettings(JSON.stringify({version:2,quality:'high',fpsCap:60,uiScale:125,textScale:115,musicVolume:0.2,effectsVolume:0.5,uiVolume:0,keys:{inventory:'KeyP'}}));
 assert.equal(s.quality,'high');assert.equal(s.fpsCap,60);assert.equal(s.uiScale,125);assert.equal(s.textScale,115);
 assert.equal(s.musicVolume,0.2);assert.equal(s.effectsVolume,0.5);assert.equal(s.uiVolume,0);
 assert.equal(s.keys.inventory,'KeyP');assert.equal(s.keys.map,'KeyM');
 const bad=readSettings(JSON.stringify({quality:'ultra',fpsCap:75,uiScale:300,textScale:'big',musicVolume:2,uiVolume:-1,keys:'x'}));
 assert.equal(bad.quality,'mid');assert.equal(bad.fpsCap,0);assert.equal(bad.uiScale,100);assert.equal(bad.textScale,100);
 assert.equal(bad.musicVolume,1);assert.equal(bad.uiVolume,1);assert.deepEqual(bad.keys,{...DEFAULT_KEYBINDS});
});
test('quality presets map to pixel ratio, shadows and effects',()=>{
 assert.deepEqual(qualityProfile('low'),{pixelRatio:1,shadows:false,effects:false});
 assert.equal(qualityProfile('mid').pixelRatio,1.5);
 assert.deepEqual(qualityProfile('high'),{pixelRatio:2,shadows:true,effects:true});
});
