import test from 'node:test';
import assert from 'node:assert/strict';
import {events,businesses,filterRecords,calendarCells,monthKey} from '../data.js';
test('event filters intersect month, category and case-insensitive search',()=>{assert.deepEqual(filterRecords(events,{month:'2027-05',category:'Arts',query:'  WALK  '}).map(x=>x.id),['art-walk']);assert.equal(filterRecords(events,{month:'2027-05',category:'Music',query:'market'}).length,0);});
test('business keyword search and category combine without mutating data',()=>{assert.equal(filterRecords(businesses,{query:'coffee',category:'Food & Drink'})[0].id,'corner-cup');assert.equal(filterRecords(businesses,{query:'coffee',category:'Shopping'}).length,0);assert.equal(businesses.length,4);});
test('calendar covers leap year, weekday alignment and whole weeks',()=>{const leap=calendarCells(2028,1);assert.equal(leap.filter(Boolean).length,29);assert.equal(leap.indexOf(1),2);assert.equal(leap.length%7,0);const may=calendarCells(2027,4);assert.equal(may.indexOf(1),6);assert.equal(may.filter(Boolean).length,31);});
test('month navigation supports year boundaries',()=>{const d=new Date(Date.UTC(2027,11,1));d.setUTCMonth(d.getUTCMonth()+1);assert.equal(monthKey(d),'2028-01');});
