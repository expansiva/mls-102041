/// <mls fileReference="_102041_/l2/collab-spliter.test.ts" enhancement="_blank"/>
import assert from 'node:assert/strict';
import test from 'node:test';
import { layoutSpliter, SPLITER_DESIRED_LEFT_PX, SPLITER_MOBILE_TOGGLE_PX, SPLITER_SEPARATOR_PX } from '/_102041_/l2/collab-spliterLayout.js';

const base = {
    fullscreen: '' as const,
    mobilePane: 'right' as const,
    previousMode: '' as const,
    minLeftPx: 0,
    minRightPx: 0,
    percentLeft: 50,
    percentRight: 50,
    useFixedLeft: true,
};

test('390: one pane takes the useful width, the other is 0, toggle on', () => {
    const r = layoutSpliter({ ...base, totalWidth: 390 });
    assert.equal(r.mode, 'mobile');
    assert.equal(r.showToggle, true);
    assert.equal(r.togglePx, SPLITER_MOBILE_TOGGLE_PX);
    assert.equal(r.leftPx, 0);
    assert.equal(r.rightPx, 390);
    assert.equal(r.separatorPx, 0);
});

test('390 with fullscreen left: no toggle, left takes the full width', () => {
    const r = layoutSpliter({ ...base, totalWidth: 390, fullscreen: 'left', mobilePane: 'right' });
    assert.equal(r.mode, 'mobile');
    assert.equal(r.showToggle, false);
    assert.equal(r.togglePx, 0);
    assert.equal(r.leftPx, 390);
    assert.equal(r.rightPx, 0);
    assert.equal(r.visiblePane, 'left');
});

test('390: switching mobilePane swaps which side is 0', () => {
    const right = layoutSpliter({ ...base, totalWidth: 390, mobilePane: 'right' });
    const left = layoutSpliter({ ...base, totalWidth: 390, mobilePane: 'left' });
    assert.equal(right.visiblePane, 'right');
    assert.equal(right.leftPx, 0);
    assert.equal(right.rightPx, 390);
    assert.equal(left.visiblePane, 'left');
    assert.equal(left.leftPx, 390);
    assert.equal(left.rightPx, 0);
});

test('1280: left is 375 and the rest goes to the right', () => {
    const r = layoutSpliter({ ...base, totalWidth: 1280, previousMode: 'desktop' });
    assert.equal(r.mode, 'desktop');
    assert.equal(r.showToggle, false);
    assert.equal(r.leftPx, SPLITER_DESIRED_LEFT_PX);
    assert.equal(r.rightPx, 1280 - SPLITER_SEPARATOR_PX - SPLITER_DESIRED_LEFT_PX);
    assert.equal(r.visiblePane, 'both');
});

test('360: no negative widths', () => {
    const r = layoutSpliter({ ...base, totalWidth: 360 });
    assert.ok(r.leftPx >= 0);
    assert.ok(r.rightPx >= 0);
    assert.equal(r.leftPx + r.rightPx, 360);
});

test('resize 1280 to 390 and back clears hidden/closed', () => {
    const toMobile = layoutSpliter({ ...base, totalWidth: 390, previousMode: 'desktop' });
    assert.equal(toMobile.mode, 'mobile');
    assert.equal(toMobile.clearHiddenClosed, true);
    const toDesktop = layoutSpliter({ ...base, totalWidth: 1280, previousMode: 'mobile' });
    assert.equal(toDesktop.mode, 'desktop');
    assert.equal(toDesktop.clearHiddenClosed, true);
    assert.equal(toDesktop.leftPx, SPLITER_DESIRED_LEFT_PX);
});
