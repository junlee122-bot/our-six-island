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
