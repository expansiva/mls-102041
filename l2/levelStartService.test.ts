/// <mls fileReference="_102041_/l2/levelStartService.test.ts" enhancement="_blank"/>
import assert from 'node:assert/strict';
import test from 'node:test';
import { levelHasStartService } from '/_102041_/l2/utils.js';

test('on.collab.codes: every level keeps the start service', () => {
  for (let level = 0; level <= 7; level += 1) assert.equal(levelHasStartService(level, false), true, String(level));
});

test('client app: no level has the start service (for now — not even in studio mode)', () => {
  for (let level = 0; level <= 7; level += 1) assert.equal(levelHasStartService(level, true), false, String(level));
});

test('the default reads window.collabBoot (the client server injects it; the studio never has it)', () => {
  const holder = globalThis as { collabBoot?: unknown };
  const previous = holder.collabBoot;
  try {
    delete holder.collabBoot;
    assert.equal(levelHasStartService(7), true);
    holder.collabBoot = { projectId: '102047' };
    assert.equal(levelHasStartService(7), false);
  } finally {
    if (previous === undefined) delete holder.collabBoot;
    else holder.collabBoot = previous;
  }
});
