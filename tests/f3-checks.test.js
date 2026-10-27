import test from 'node:test';
import assert from 'node:assert/strict';
import {nextF3Index} from '../js/f3-check-summary.js';
test('F3: primeiro slide pendente',()=>{assert.equal(nextF3Index({},[{id:'s1'}]),0);});
