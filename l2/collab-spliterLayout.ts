/// <mls fileReference="_102041_/l2/collab-spliterLayout.ts" enhancement="_blank"/>

export const SPLITER_SEPARATOR_PX = 8;
export const SPLITER_MOBILE_MAX_PX = 768;
export const SPLITER_DESIRED_LEFT_PX = 375;
export const SPLITER_NAV3_MIN_PX = 94;
export const SPLITER_MOBILE_TOGGLE_PX = 32;

export type SpliterPaneId = 'left' | 'right';
export type SpliterLayoutMode = 'mobile' | 'desktop';
export type SpliterFullscreen = '' | 'left' | 'right';

export interface SpliterLayoutInput {
    totalWidth: number;
    fullscreen: SpliterFullscreen;
    mobilePane: SpliterPaneId;
    previousMode: SpliterLayoutMode | '';
    minLeftPx: number;
    minRightPx: number;
    percentLeft: number;
    percentRight: number;
    useFixedLeft: boolean;
}

export interface SpliterLayout {
    mode: SpliterLayoutMode;
    leftPx: number;
    rightPx: number;
    separatorPx: number;
    togglePx: number;
    visiblePane: SpliterPaneId | 'both';
    clearHiddenClosed: boolean;
    showToggle: boolean;
}

function round2(n: number): number {
    return parseFloat(n.toFixed(2));
}

export function layoutSpliter(input: SpliterLayoutInput): SpliterLayout {
    const total = Math.max(0, input.totalWidth);
    const mode: SpliterLayoutMode = total < SPLITER_MOBILE_MAX_PX ? 'mobile' : 'desktop';
    const clearHiddenClosed = input.previousMode !== mode;

    if (mode === 'mobile') {
        const pane: SpliterPaneId = input.fullscreen === 'left' || input.fullscreen === 'right'
            ? input.fullscreen
            : input.mobilePane;
        // Fullscreen de outro código governa o painel: o toggle não aparece e não reserva altura.
        const ownsToggle = input.fullscreen === '';
        return {
            mode,
            leftPx: pane === 'left' ? total : 0,
            rightPx: pane === 'right' ? total : 0,
            separatorPx: 0,
            togglePx: ownsToggle ? SPLITER_MOBILE_TOGGLE_PX : 0,
            visiblePane: pane,
            clearHiddenClosed,
            showToggle: ownsToggle,
        };
    }

    const inner = Math.max(0, total - SPLITER_SEPARATOR_PX);
    const minRight = Math.max(0, input.minRightPx);
    const minLeft = Math.max(0, input.minLeftPx, input.useFixedLeft ? SPLITER_NAV3_MIN_PX : 0);
    const maxLeft = Math.max(0, inner - minRight);

    if (input.fullscreen === 'left') {
        return {
            mode, leftPx: inner, rightPx: 0, separatorPx: SPLITER_SEPARATOR_PX, togglePx: 0,
            visiblePane: 'left', clearHiddenClosed, showToggle: false,
        };
    }
    if (input.fullscreen === 'right') {
        return {
            mode, leftPx: 0, rightPx: inner, separatorPx: SPLITER_SEPARATOR_PX, togglePx: 0,
            visiblePane: 'right', clearHiddenClosed, showToggle: false,
        };
    }

    let left: number;
    if (input.useFixedLeft) {
        left = SPLITER_DESIRED_LEFT_PX;
        if (left > maxLeft) left = maxLeft;
        if (left < minLeft && minLeft <= maxLeft) left = minLeft;
    } else {
        const lp = input.percentLeft || 50;
        left = (inner / 100) * lp;
        if (left > maxLeft) left = maxLeft;
        if (left < minLeft && minLeft <= maxLeft) left = minLeft;
    }
    if (left < 0) left = 0;
    if (left > inner) left = inner;
    const right = Math.max(0, inner - left);

    return {
        mode,
        leftPx: round2(left),
        rightPx: round2(right),
        separatorPx: SPLITER_SEPARATOR_PX,
        togglePx: 0,
        visiblePane: 'both',
        clearHiddenClosed,
        showToggle: false,
    };
}
