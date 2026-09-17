/// <mls fileReference="_102041_/l2/collab-nav-3.test.ts" enhancement="_blank"/>

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('folder services load from the path resolved for the requested widget', () => {
    const source = readFileSync(new URL('./collab-nav-3.ts', import.meta.url), 'utf8');
    assert.match(source, /const info = getPath\(service\)/);
    assert.match(source, /const project = info\?\.project/);
    assert.match(source, /const shortName = info\?\.shortName/);
    assert.match(source, /const folder = info\?\.folder/);
    assert.match(source, /script\.src = `\/_\$\{project\}_\/l2\/\$\{folder/);
    assert.doesNotMatch(source, /const \{ project, path \} = mls\?\.actual\?\.\[0\]/);
});
