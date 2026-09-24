import test from 'node:test';
import assert from 'node:assert/strict';
import {josa,particle,formatBeom,NAMES,finalConsonant} from '../app/lounge-text.ts';

test('josa picks particles by final consonant',()=>{
 assert.equal(josa('도원','으로/로'),'도원으로');
 assert.equal(josa('체스','은/는'),'체스는');
 assert.equal(josa('바둑','은/는'),'바둑은');
 assert.equal(josa('마을','으로/로'),'마을로'); // ㄹ받침 -> 로
 assert.equal(josa('회관','으로/로'),'회관으로');
 assert.equal(josa('카지노','으로/로'),'카지노로');
 assert.equal(josa('범수','이/가'),'범수가');
 assert.equal(josa('도원','이/가'),'도원이');
 assert.equal(josa('섯다','을/를'),'섯다를');
 assert.equal(josa('고스톱','을/를'),'고스톱을');
 assert.equal(josa('포커','과/와'),'포커와');
 assert.equal(josa('블랙잭','과/와'),'블랙잭과');
 assert.equal(josa('친구','이에요/예요'),'친구예요');
 assert.equal(josa('10,000범','이에요/예요'),'10,000범이에요');
});
test('josa handles digits, latin, and trailing punctuation',()=>{
 assert.equal(josa('3','이/가'),'3이');
 assert.equal(josa('2','이/가'),'2가');
 assert.equal(josa('1','으로/로'),'1로');
 assert.equal(josa('6','으로/로'),'6으로');
 assert.equal(josa('7','을/를'),'7을');
 assert.equal(josa('PC','을/를'),'PC를');
 assert.equal(josa('(도원)','은/는'),'(도원)은');
 assert.equal(finalConsonant(''),-1);
 assert.equal(particle('★','이/가'),'이');
 assert.equal(josa(12,'은/는'),'12는');
});
test('formatBeom and names glossary',()=>{
 assert.equal(formatBeom(12345),'12,345범');
 assert.equal(formatBeom(0),'0범');
 assert.equal(formatBeom(-3000),'-3,000범');
 assert.equal(formatBeom(Number.NaN),'0범');
 assert.equal(NAMES.app,'범타듀 밸리');
 assert.equal(NAMES.hall,'범마을 회관');
 assert.equal(NAMES.casino,'별빛 카지노');
 assert.equal(NAMES.chatVillage,'마을 수다');
});
