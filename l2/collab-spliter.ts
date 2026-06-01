/// <mls fileReference="_102041_/l2/collab-spliter.ts" enhancement="_102020_/l2/enhancementAura.ts"/>

import { nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

interface ICollabSpliterItem extends HTMLElement { layout: Function; }

@customElement('collab-spliter')
export class CollabSpliter extends StateLitElement {

    @property({ attribute: 'msize' }) msize: string = '';
    @property({ attribute: 'msplit' }) msplit: string = '';
    @property({ attribute: 'level' }) level: string = '';
    @property({ attribute: 'msplit-fullscreen' }) msplitFullscreen: string = '';

    get defaultLeftPanelWidthPercent() { return +(this.getAttribute('defaultleft') || '50'); }
    get defaultRightPanelWidthPercent() { return +(this.getAttribute('defaultright') || '50'); }
    get minRightPxPanel() { return +(this.getAttribute('minRightPx') || '0'); }
    get minLeftPxPanel() { return +(this.getAttribute('minLeftPx') || '0'); }

    get msizeObj() {
        const rc = { width: 0, height: 0, top: 0, left: 0 };
        const size = this.getAttribute('msize');
        if (!size) return rc;
        const [w, h, t, l] = size.split(',');
        if (!w || !h || !t || !l) return rc;
        return { width: parseFloat(w), height: parseFloat(h), top: parseFloat(t), left: parseFloat(l) };
    }

    private _leftPanel?: ICollabSpliterItem;
    private _rightPanel?: ICollabSpliterItem;
    private _resizerSplitter?: HTMLElement;

    private readonly _separatorWidth = 8;
    private readonly _defaultPx = 375;
    private _defaultPanelsWidth = { rightPanel: 0, leftPanel: 0 };
    private _actualPanelsWidth = { rightPanel: 0, leftPanel: 0 };
    private _fullScreenData: string[] = ['', '', '', '', '', '', '', ''];

    public setFullScreen(level: number, position: 'left' | 'right' | 'default') {
        this._fullScreenData[level] = position === 'default' ? '' : position;
        this.setAttribute('msplit-fullscreen', this._fullScreenData.join(','));
        this._loadUserPreferenceByLevel(this.getAttribute('msize'));
    }

    render() { return nothing; }

    firstUpdated() {
        const [left, right] = Array.from(this.children) as ICollabSpliterItem[];
        if (!left || !right) return;
        this._leftPanel = left;
        this._rightPanel = right;
        this._loadUserPreferenceByLevel('', true);
        this._setMSplitFullScreen();
        const separator = this._createSeparator();
        this.insertBefore(separator, right);
        this.style.height = this.msizeObj.height + 'px';
    }

    updated(changed: Map<string, unknown>) {
        if (changed.has('msize')) this._updateSizePanels(this.msize);
        if (changed.has('level') && !changed.has('msize')) this._updateSizePanels(this.getAttribute('msize'));
        if (changed.has('msplitFullscreen')) {
            const arr = this.msplitFullscreen.split(',');
            if (arr.length === 8) this._fullScreenData = arr;
            this._loadUserPreferenceByLevel(this.getAttribute('msize'));
        }
        if (changed.has('msplit') && this._leftPanel && this._rightPanel) {
            const [wL, wR] = this.msplit.split(',');
            if (!wL || !wR) return;
            this._leftPanel.style.width = wL + 'px';
            this._rightPanel.style.width = wR + 'px';
            this._updateSizePanelsOnSplitChange(parseFloat(wL), parseFloat(wR));
            this._savePreferencesByLevel(this.msplit);
        }
    }

    private _createSeparator(): HTMLElement {
        if (this._resizerSplitter) this._resizerSplitter.innerHTML = '';
        else this._resizerSplitter = document.createElement('div');
        this._resizerSplitter.classList.add('spliter-separator');
        const inner = document.createElement('div');
        this._resizerSplitter.appendChild(inner);

        let lastPageX: number | undefined = 0;
        let isMobile = false;

        const resize = (event: MouseEvent) => {
            if (!this._leftPanel || !this._rightPanel) return;
            this._toogleIframePointerEvents(false);
            document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');
            if (isMobile && !lastPageX) { lastPageX = event.pageX; return; }

            const movePx = isMobile ? event.pageX - (lastPageX ?? 0) : event.movementX;
            const pxLeft = this._leftPanel.clientWidth + movePx;
            const pxRight = this._rightPanel.clientWidth - movePx;
            const { width } = this.msizeObj;
            const wNoSep = width - this._separatorWidth;

            if (pxLeft <= this.minLeftPxPanel && !this._leftPanel.classList.contains('closed')) {
                this._actualPanelsWidth.rightPanel = width;
                this._actualPanelsWidth.leftPanel = 0;
                this._leftPanel.classList.add('closed', 'hidden');
                onMouseUp();
            } else if (pxRight <= this.minRightPxPanel && !this._rightPanel.classList.contains('closed')) {
                this._actualPanelsWidth.leftPanel = width - this._separatorWidth;
                this._actualPanelsWidth.rightPanel = 0;
                this._rightPanel.classList.add('closed', 'hidden');
                onMouseUp();
            } else if (pxLeft <= wNoSep && pxRight <= wNoSep) {
                this._actualPanelsWidth.leftPanel = pxLeft;
                this._actualPanelsWidth.rightPanel = pxRight;
                this._leftPanel.classList.remove('hidden');
                this._rightPanel.classList.remove('hidden');
            }

            if (pxRight > this.minRightPxPanel) this._rightPanel.classList.remove('closed');
            if (pxLeft > this.minLeftPxPanel) this._leftPanel.classList.remove('closed');

            this.setAttribute('msplit', `${this._actualPanelsWidth.leftPanel.toFixed(2)},${this._actualPanelsWidth.rightPanel.toFixed(2)}`);
            if (this._rightPanel.layout) this._rightPanel.layout();
            if (this._leftPanel.layout) this._leftPanel.layout();
            if (isMobile) lastPageX = event.pageX;
        };

        const touch2Mouse = (ev: TouchEvent) => {
            const mouseEvent = this._convertTouch(ev);
            if (mouseEvent) ev.changedTouches[0].target.dispatchEvent(mouseEvent);
            ev.preventDefault();
        };

        const onMouseUp = () => {
            if (!this._leftPanel || !this._rightPanel) return;
            lastPageX = 0; isMobile = false;
            document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'all');
            this._toogleIframePointerEvents(true);
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchstart', touch2Mouse, true);
            document.removeEventListener('touchmove', touch2Mouse, true);
            document.removeEventListener('touchend', touch2Mouse, true);
            if ((this._rightPanel.classList.contains('closed') && this._actualPanelsWidth.rightPanel > 0)
                || (this._leftPanel.classList.contains('closed') && this._actualPanelsWidth.leftPanel > 0)) {
                this._toogleDefaultWidth();
            }
            if (this._actualPanelsWidth.rightPanel < 1) this._rightPanel.classList.add('hidden');
            if (this._actualPanelsWidth.leftPanel < 1) this._leftPanel.classList.add('hidden');
        };

        this._resizerSplitter.onmousedown = (e) => {
            isMobile = false;
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        };

        this._resizerSplitter.ontouchstart = (e) => {
            e.preventDefault(); isMobile = true; lastPageX = undefined;
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('touchstart', touch2Mouse, true);
            document.addEventListener('touchmove', touch2Mouse, true);
            document.addEventListener('touchend', touch2Mouse, true);
        };

        this._resizerSplitter.ondblclick = () => {
            if (!this._leftPanel || !this._rightPanel) return;
            const level = +(this.getAttribute('level') || '7');
            if (this._fullScreenData[level]) {
                this._fullScreenData[level] = '';
                this._setMSplitFullScreen();
            }
            this._leftPanel.classList.remove('closed');
            this._rightPanel.classList.remove('closed');
            this._toogleDefaultWidth();
        };

        return this._resizerSplitter;
    }

    private _toogleIframePointerEvents(add: boolean) {
        document.querySelectorAll('*').forEach((el: Element) => {
            if (el.shadowRoot) el.shadowRoot.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = add ? 'all' : 'none');
        });
    }

    private _convertTouch(ev: TouchEvent): MouseEvent | undefined {
        const t = ev.changedTouches[0];
        const map: Record<string, string> = { touchstart: 'mousedown', touchend: 'mouseup', touchmove: 'mousemove' };
        const mouseEv = map[ev.type];
        if (!mouseEv) return undefined;
        const e = document.createEvent('MouseEvent');
        e.initMouseEvent(mouseEv, true, true, window, 1, t.screenX, t.screenY, t.clientX, t.clientY, false, false, false, false, 0, null);
        return e;
    }

    private _toogleDefaultWidth() {
        if (!this._leftPanel || !this._rightPanel) return;
        this._leftPanel.style.width = this._defaultPanelsWidth.leftPanel + 'px';
        this._rightPanel.style.width = this._defaultPanelsWidth.rightPanel + 'px';
        this.setAttribute('msplit', `${this._defaultPanelsWidth.leftPanel.toFixed(2)},${this._defaultPanelsWidth.rightPanel.toFixed(2)}`);
        if (this._rightPanel.layout) this._rightPanel.layout();
        if (this._leftPanel.layout) this._leftPanel.layout();
        this._leftPanel.classList.remove('hidden');
        this._rightPanel.classList.remove('hidden');
    }

    private _updateSizePanelsOnSplitChange(lw: number, rw: number) {
        const { height, top, left } = this.msizeObj;
        const newLeft = +left + this._separatorWidth + lw;
        const level = +(this.getAttribute('level') || '7');
        const fsByLevel = this._fullScreenData[level];

        if (fsByLevel === 'left' && rw !== 0) { this._fullScreenData[level] = ''; this._setMSplitFullScreen(); }
        else if (fsByLevel === 'right' && lw !== 0) { this._fullScreenData[level] = ''; this._setMSplitFullScreen(); }

        if (!this._leftPanel || !this._rightPanel) return;
        this._leftPanel.setAttribute('msize', `${lw},${height},${top},0`);
        this._rightPanel.setAttribute('msize', `${rw},${height},${top},${newLeft}`);
    }

    private _setDefaultValues(msize: string) {

        if (!msize || !this._leftPanel || !this._rightPanel) return;
        const level = +(this.getAttribute('level') || '7');
        const currentMsize = this.getAttribute('msize');
        if (!currentMsize) return;
        const [width, , top, leftP] = currentMsize.split(',');
        const totalW = parseFloat(width) - this._separatorWidth;
        const { left, right } = this._getDefaultPxByPercent(totalW);

        let l = left, r = right;
        if ([3, 4, 5, 6, 7].includes(+level)) { const d = left - this._defaultPx; l = this._defaultPx; r = right + d; }

        this._defaultPanelsWidth = { leftPanel: l, rightPanel: r };
        this._actualPanelsWidth = { leftPanel: l, rightPanel: r };
        const newTop = +top;
        const newLeft2 = +leftP + this._separatorWidth + l;
        this._leftPanel.setAttribute('msize', `${l},${this.msizeObj.height},${newTop},0`);
        this._rightPanel.setAttribute('msize', `${r},${this.msizeObj.height},${newTop},${newLeft2}`);
        this._leftPanel.style.width = l + 'px';
        this._rightPanel.style.width = r + 'px';
    }

    private _getDefaultPxByPercent(totalWidth: number): { left: number; right: number } {
        const lp = this.defaultLeftPanelWidthPercent || 50;
        const rp = this.defaultRightPanelWidthPercent || 50;
        return {
            left: parseFloat(((totalWidth / 100) * lp).toFixed(2)),
            right: parseFloat(((totalWidth / 100) * rp).toFixed(2)),
        };
    }

    private _updateSizePanels(msize: string | null) {
        if (!msize || !this._leftPanel) return;
        this._loadUserPreferenceByLevel(msize);
        this.style.height = this.msizeObj.height + 'px';
    }

    private _loadUserPreferenceByLevel(msize?: string | null, beforeRender = false) {
        if (!msize || !this._leftPanel || !this._rightPanel) return;
        if (!msize && !beforeRender) return;
        if (!beforeRender) this._setDefaultValues(msize);

        const level = +(this.getAttribute('level') || '7');
        const fsByLevel = this._fullScreenData[level];
        const usermsplit = localStorage.getItem('user-msplit');
        let leftPx: any, rightPx: any;

        if (fsByLevel === 'left') { leftPx = '100.00'; rightPx = '0.00'; }
        else if (fsByLevel === 'right') { leftPx = '0.00'; rightPx = '100.00'; }
        else if (usermsplit) {
            const data = JSON.parse(usermsplit);
            if (data[level]) { const [l, r] = data[level].split(','); leftPx = l; rightPx = r; }
        }

        if (!leftPx || !rightPx) { leftPx = this.defaultLeftPanelWidthPercent; rightPx = this.defaultRightPanelWidthPercent; }

        const { left, right } = this._getToolbarPxByPercent(leftPx, rightPx);
        this._actualPanelsWidth = { leftPanel: left, rightPanel: right };

        if ([3, 4, 5, 6, 7].includes(+level) && fsByLevel !== 'right' && fsByLevel !== 'left') {
            const d = left - this._defaultPx;
            const nl = this._defaultPx, nr = right + d;
            this._leftPanel.style.width = nl + 'px';
            this._rightPanel.style.width = nr + 'px';
            this._updateSizePanelsOnSplitChange(nl, nr);
            if (nl < 1) this._leftPanel.classList.add('hidden');
            if (nr < 1) this._rightPanel.classList.add('hidden');
            if (this._rightPanel.layout) this._rightPanel.layout();
            if (this._leftPanel.layout) this._leftPanel.layout();
            this.setAttribute('msplit', `${nl},${nr}`);
        } else {
            this._leftPanel.style.width = left + 'px';
            this._rightPanel.style.width = right + 'px';
            this._updateSizePanelsOnSplitChange(left, right);
            if (left < 1) this._leftPanel.classList.add('hidden');
            if (right < 1) this._rightPanel.classList.add('hidden');
            if (this._rightPanel.layout) this._rightPanel.layout();
            if (this._leftPanel.layout) this._leftPanel.layout();
            this.setAttribute('msplit', `${left},${right}`);
        }
    }

    private _getToolbarPxByPercent(leftPercent: number, rightPercent: number): { left: number; right: number } {
        const totalWidth = this.msizeObj.width - this._separatorWidth;
        return {
            left: parseFloat(((totalWidth / 100) * leftPercent).toFixed(2)),
            right: parseFloat(((totalWidth / 100) * rightPercent).toFixed(2)),
        };
    }

    private _savePreferencesByLevel(msplit: string) {
        const level = +(this.getAttribute('level') || '7');
        const fsByLevel = this._fullScreenData[level];
        if (fsByLevel === 'left' || fsByLevel === 'right') return;
        const [wL, wR] = msplit.split(',');
        if (!wL || !wR) return;
        const totalWidth = this.msizeObj.width - this._separatorWidth;
        const lp = ((+wL / totalWidth) * 100).toFixed(2);
        const rp = ((+wR / totalWidth) * 100).toFixed(2);
        if (!lp || !rp) return;
        const usermsplit = localStorage.getItem('user-msplit');
        const data: any[] = usermsplit ? JSON.parse(usermsplit) : ['', '', '', '', '', '', '', ''];
        data[level] = `${lp},${rp}`;
        localStorage.setItem('user-msplit', JSON.stringify(data));
    }

    private _setMSplitFullScreen() {
        this.setAttribute('msplit-fullscreen', this._fullScreenData.join(','));
    }
}
