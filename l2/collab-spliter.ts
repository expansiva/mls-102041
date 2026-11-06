/// <mls fileReference="_102041_/l2/collab-spliter.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

/// **collab_i18n_start**
const message_en = {
    list: 'List',
    detail: 'Detail',
    switchPane: 'Switch panel',
};
type MessageType = typeof message_en;
const message_pt: MessageType = {
    list: 'Lista',
    detail: 'Detalhe',
    switchPane: 'Alternar painel',
};
const message_es: MessageType = {
    list: 'Lista',
    detail: 'Detalle',
    switchPane: 'Cambiar panel',
};
const messages: { [key: string]: MessageType } = { en: message_en, pt: message_pt, es: message_es };
/// **collab_i18n_end**

import { nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { StateLitElement } from '/_102029_/l2/stateLitElement.js';
import {
    layoutSpliter,
    SPLITER_SEPARATOR_PX,
    SPLITER_MOBILE_TOGGLE_PX,
    type SpliterFullscreen,
    type SpliterLayout,
    type SpliterLayoutMode,
    type SpliterPaneId,
} from '/_102041_/l2/collab-spliterLayout.js';

interface ICollabSpliterItem extends HTMLElement { layout: Function; }
interface INav2PaneService { state: string; tooltip: string; }
interface INav2Like {
    actualServices?: Record<number, { left: INav2PaneService[]; right: INav2PaneService[] }>;
}

export class CollabSpliter extends StateLitElement {

    @property({ attribute: 'msize' }) msize: string = '';
    @property({ attribute: 'msplit' }) msplit: string = '';
    @property({ attribute: 'level' }) level: string = '';
    @property({ attribute: 'msplit-fullscreen' }) msplitFullscreen: string = '';
    @property({ attribute: 'fixed', type: Boolean }) fixed: boolean = false;

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
    private _toggleBar?: HTMLElement;

    private readonly _separatorWidth = SPLITER_SEPARATOR_PX;
    private _defaultPanelsWidth = { rightPanel: 0, leftPanel: 0 };
    private _actualPanelsWidth = { rightPanel: 0, leftPanel: 0 };
    private _fullScreenData: string[] = ['', '', '', '', '', '', '', ''];
    private _isDragging = false;
    private _layoutMode: SpliterLayoutMode | '' = '';
    private _mobilePane: SpliterPaneId = 'right';
    private msg: MessageType = messages['en'];

    public setFullScreen(level: number, position: 'left' | 'right' | 'default') {
        this._fullScreenData[level] = position === 'default' ? '' : position;
        this.setAttribute('msplit-fullscreen', this._fullScreenData.join(','));
        this._loadUserPreferenceByLevel(this.getAttribute('msize'));
    }

    render() { return nothing; }

    firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        this.msg = messages[this.getMessageKey(messages)] || messages['en'];
        const [left, right] = Array.from(this.children) as ICollabSpliterItem[];
        if (!left || !right) return;
        this._leftPanel = left;
        this._rightPanel = right;
        this._loadUserPreferenceByLevel('', true);
        this._setMSplitFullScreen();
        this._createToggle();
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
            // durante o drag persiste só no mouseup; mudanças programáticas (load/reset/fullscreen) salvam aqui
            if (!this._isDragging) this._savePreferencesByLevel(this.msplit);
        }
        if (changed.has('fixed') && this._resizerSplitter) this._createSeparator();
    }

    private _createToggle(): HTMLElement {
        if (this._toggleBar) {
            this._refreshToggle();
            return this._toggleBar;
        }
        this._toggleBar = document.createElement('div');
        this._toggleBar.className = 'spliter-mobile-toggle';
        this._toggleBar.setAttribute('role', 'tablist');
        this._toggleBar.setAttribute('aria-label', this.msg.switchPane);
        const leftBtn = document.createElement('button');
        const rightBtn = document.createElement('button');
        leftBtn.type = 'button';
        rightBtn.type = 'button';
        leftBtn.setAttribute('role', 'tab');
        rightBtn.setAttribute('role', 'tab');
        leftBtn.addEventListener('click', () => this._setMobilePane('left'));
        rightBtn.addEventListener('click', () => this._setMobilePane('right'));
        this._toggleBar.append(leftBtn, rightBtn);
        this.insertBefore(this._toggleBar, this.firstChild);
        this._refreshToggle();
        return this._toggleBar;
    }

    private _setMobilePane(pane: SpliterPaneId) {
        if (this._mobilePane === pane && this._layoutMode === 'mobile') return;
        this._mobilePane = pane;
        this._applyPaneLayout();
    }

    private _paneLabel(pane: SpliterPaneId): string {
        const fallback = pane === 'left' ? this.msg.list : this.msg.detail;
        const panel = pane === 'left' ? this._leftPanel : this._rightPanel;
        if (!panel) return fallback;
        const nav2 = panel.querySelector('collab-nav-2') as INav2Like | null;
        const level = +(this.getAttribute('level') || '7');
        const side = nav2?.actualServices?.[level]?.[pane];
        const fg = side?.find(s => s.state === 'foreground');
        const name = (fg?.tooltip || '').trim();
        return name || fallback;
    }

    private _refreshToggle(layout?: SpliterLayout) {
        if (!this._toggleBar) return;
        const level = +(this.getAttribute('level') || '7');
        const fs = this._fullScreenData[level];
        const fullscreenOwnsPane = fs === 'left' || fs === 'right';
        const show = layout ? layout.showToggle : this._layoutMode === 'mobile' && !fullscreenOwnsPane;
        this._toggleBar.hidden = !show;
        const [leftBtn, rightBtn] = Array.from(this._toggleBar.querySelectorAll('button'));
        if (!leftBtn || !rightBtn) return;
        leftBtn.textContent = this._paneLabel('left');
        rightBtn.textContent = this._paneLabel('right');
        const visible = layout?.visiblePane === 'both' ? this._mobilePane : (layout?.visiblePane || this._mobilePane);
        leftBtn.setAttribute('aria-pressed', visible === 'left' ? 'true' : 'false');
        rightBtn.setAttribute('aria-pressed', visible === 'right' ? 'true' : 'false');
        leftBtn.setAttribute('aria-selected', visible === 'left' ? 'true' : 'false');
        rightBtn.setAttribute('aria-selected', visible === 'right' ? 'true' : 'false');
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
            const leftPanel = this._leftPanel;
            const rightPanel = this._rightPanel;
            if (!leftPanel || !rightPanel) return;
            if (this._layoutMode === 'mobile') return;
            if (isMobile && !lastPageX) { lastPageX = event.pageX; return; }

            const movePx = isMobile ? event.pageX - (lastPageX ?? 0) : event.movementX;
            const pxLeft = leftPanel.clientWidth + movePx;
            const pxRight = rightPanel.clientWidth - movePx;
            const { width } = this.msizeObj;
            const wNoSep = width - this._separatorWidth;

            if (pxLeft <= this.minLeftPxPanel && !leftPanel.classList.contains('closed')) {
                this._actualPanelsWidth.rightPanel = width - this._separatorWidth;
                this._actualPanelsWidth.leftPanel = 0;
                leftPanel.classList.add('closed', 'hidden');
                onMouseUp();
            } else if (pxRight <= this.minRightPxPanel && !rightPanel.classList.contains('closed')) {
                this._actualPanelsWidth.leftPanel = width - this._separatorWidth;
                this._actualPanelsWidth.rightPanel = 0;
                rightPanel.classList.add('closed', 'hidden');
                onMouseUp();
            } else if (pxLeft <= wNoSep && pxRight <= wNoSep) {
                this._actualPanelsWidth.leftPanel = pxLeft;
                this._actualPanelsWidth.rightPanel = pxRight;
                leftPanel.classList.remove('hidden');
                rightPanel.classList.remove('hidden');
            }

            if (pxRight > this.minRightPxPanel) rightPanel.classList.remove('closed');
            if (pxLeft > this.minLeftPxPanel) leftPanel.classList.remove('closed');

            // epsilon-guard: só emite msplit (e re-layouta os filhos) quando muda de verdade —
            // perto do mínimo, o round-trip percent↔px oscilava entre 2 strings e travava o updated()
            if (this._setMsplitIfChanged(this._actualPanelsWidth.leftPanel, this._actualPanelsWidth.rightPanel)) {
                if (rightPanel.layout) rightPanel.layout();
                if (leftPanel.layout) leftPanel.layout();
            }
            if (isMobile) lastPageX = event.pageX;
        };

        const touch2Mouse = (ev: TouchEvent) => {
            const mouseEvent = this._convertTouch(ev);
            if (mouseEvent) ev.changedTouches[0].target.dispatchEvent(mouseEvent);
            ev.preventDefault();
        };

        const onMouseUp = () => {
            const leftPanel = this._leftPanel;
            const rightPanel = this._rightPanel;
            if (!leftPanel || !rightPanel) return;
            lastPageX = 0; isMobile = false;
            this._isDragging = false;
            this._toogleIframePointerEvents(true);
            this._savePreferencesByLevel(this.getAttribute('msplit') || '');
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchstart', touch2Mouse, true);
            document.removeEventListener('touchmove', touch2Mouse, true);
            document.removeEventListener('touchend', touch2Mouse, true);
            if ((rightPanel.classList.contains('closed') && this._actualPanelsWidth.rightPanel > 0)
                || (leftPanel.classList.contains('closed') && this._actualPanelsWidth.leftPanel > 0)) {
                this._toogleDefaultWidth();
            }
            if (this._actualPanelsWidth.rightPanel < 1) rightPanel.classList.add('hidden');
            if (this._actualPanelsWidth.leftPanel < 1) leftPanel.classList.add('hidden');
        };

        if (!this.fixed) {
            this._resizerSplitter.onmousedown = (e) => {
                if (this._layoutMode === 'mobile') return;
                isMobile = false;
                this._isDragging = true;
                this._toogleIframePointerEvents(false);
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', onMouseUp);
                e.preventDefault();
            };

            this._resizerSplitter.ontouchstart = (e) => {
                if (this._layoutMode === 'mobile') return;
                e.preventDefault(); isMobile = true; lastPageX = undefined;
                this._isDragging = true;
                this._toogleIframePointerEvents(false);
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', onMouseUp);
                document.addEventListener('touchstart', touch2Mouse, true);
                document.addEventListener('touchmove', touch2Mouse, true);
                document.addEventListener('touchend', touch2Mouse, true);
            };

            this._resizerSplitter.ondblclick = () => {
                const leftPanel = this._leftPanel;
                const rightPanel = this._rightPanel;
                if (!leftPanel || !rightPanel) return;
                const level = +(this.getAttribute('level') || '7');
                if (this._fullScreenData[level]) {
                    this._fullScreenData[level] = '';
                    this._setMSplitFullScreen();
                }
                leftPanel.classList.remove('closed');
                rightPanel.classList.remove('closed');
                this._toogleDefaultWidth();
            };
        } else {
            this._resizerSplitter.onmousedown = null;
            this._resizerSplitter.ontouchstart = null;
            this._resizerSplitter.ondblclick = null;
        }

        this._resizerSplitter.classList.toggle('fixed', this.fixed);

        return this._resizerSplitter;
    }

    private _toogleIframePointerEvents(add: boolean) {
        // chamado 1x por drag (mousedown/mouseup), não mais por mousemove — evita varrer o DOM inteiro a cada movimento
        const val = add ? 'all' : 'none';
        document.querySelectorAll('iframe').forEach(f => (f as HTMLElement).style.pointerEvents = val);
        document.querySelectorAll('*').forEach((el: Element) => {
            if (el.shadowRoot) el.shadowRoot.querySelectorAll('iframe').forEach(f => (f as HTMLElement).style.pointerEvents = val);
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
        this._setMsplitIfChanged(this._defaultPanelsWidth.leftPanel, this._defaultPanelsWidth.rightPanel);
        if (this._rightPanel.layout) this._rightPanel.layout();
        if (this._leftPanel.layout) this._leftPanel.layout();
        this._leftPanel.classList.remove('hidden');
        this._rightPanel.classList.remove('hidden');
    }

    private _updateSizePanelsOnSplitChange(lw: number, rw: number) {
        const { height, top, left } = this.msizeObj;
        const sep = this._layoutMode === 'mobile' ? 0 : this._separatorWidth;
        const level = +(this.getAttribute('level') || '7');
        const fsByLevel = this._fullScreenData[level];
        const newLeft = +left + sep + lw;

        if (fsByLevel === 'left' && rw !== 0) { this._fullScreenData[level] = ''; this._setMSplitFullScreen(); }
        else if (fsByLevel === 'right' && lw !== 0) { this._fullScreenData[level] = ''; this._setMSplitFullScreen(); }

        const fsNow = this._fullScreenData[level];
        const toggle = this._layoutMode === 'mobile' && fsNow !== 'left' && fsNow !== 'right'
            ? SPLITER_MOBILE_TOGGLE_PX
            : 0;
        const panelHeight = Math.max(0, height - toggle);

        if (!this._leftPanel || !this._rightPanel) return;
        this._setMsizeIfChanged(this._leftPanel, `${lw},${panelHeight},${top},0`);
        this._setMsizeIfChanged(this._rightPanel, `${rw},${panelHeight},${top},${newLeft}`);
    }

    private _setMsizeIfChanged(el: HTMLElement, next: string) {
        if (el.getAttribute('msize') === next) return;
        el.setAttribute('msize', next);
    }

    // só emite msplit quando muda >0.5px em algum lado — quebra o ciclo de oscilação na fonte.
    // retorna true se o atributo foi de fato atualizado.
    private _setMsplitIfChanged(l: number, r: number): boolean {
        const cur = this.getAttribute('msplit');
        if (cur) {
            const [cl, cr] = cur.split(',');
            if (Math.abs(parseFloat(cl) - l) < 0.5 && Math.abs(parseFloat(cr) - r) < 0.5) return false;
        }
        this.setAttribute('msplit', `${l.toFixed(2)},${r.toFixed(2)}`);
        return true;
    }

    private _updateSizePanels(msize: string | null) {
        if (!msize || !this._leftPanel) return;
        this._loadUserPreferenceByLevel(msize);
        this.style.height = this.msizeObj.height + 'px';
    }

    private _loadUserPreferenceByLevel(msize?: string | null, beforeRender = false) {
        if (!msize || !this._leftPanel || !this._rightPanel) return;
        if (!msize && !beforeRender) return;
        this._applyPaneLayout();
    }

    private _applyPaneLayout() {
        if (!this._leftPanel || !this._rightPanel) return;
        const { width } = this.msizeObj;
        const level = +(this.getAttribute('level') || '7');
        const rawFs = this._fullScreenData[level] || '';
        const fullscreen: SpliterFullscreen = rawFs === 'left' || rawFs === 'right' ? rawFs : '';

        let percentLeft = this.defaultLeftPanelWidthPercent || 50;
        let percentRight = this.defaultRightPanelWidthPercent || 50;
        if (fullscreen === '') {
            try {
                const usermsplit = localStorage.getItem('user-msplit');
                if (usermsplit) {
                    const data = JSON.parse(usermsplit);
                    if (data[level]) {
                        const [l, r] = data[level].split(',');
                        if (l && r) { percentLeft = parseFloat(l); percentRight = parseFloat(r); }
                    }
                }
            } catch { /* unavailable or corrupted — fall through to defaults */ }
        }

        const layout = layoutSpliter({
            totalWidth: width,
            fullscreen,
            mobilePane: this._mobilePane,
            previousMode: this._layoutMode,
            minLeftPx: this.minLeftPxPanel,
            minRightPx: this.minRightPxPanel,
            percentLeft,
            percentRight,
            useFixedLeft: [3, 4, 5, 6, 7].includes(level),
        });

        if (layout.clearHiddenClosed) {
            this._leftPanel.classList.remove('hidden', 'closed');
            this._rightPanel.classList.remove('hidden', 'closed');
        }

        this._layoutMode = layout.mode;
        this.classList.toggle('mobile-panes', layout.mode === 'mobile');

        if (layout.mode === 'desktop') {
            this._defaultPanelsWidth = { leftPanel: layout.leftPx, rightPanel: layout.rightPx };
        }

        this._actualPanelsWidth = { leftPanel: layout.leftPx, rightPanel: layout.rightPx };
        this._leftPanel.style.width = layout.leftPx + 'px';
        this._rightPanel.style.width = layout.rightPx + 'px';
        if (layout.leftPx < 1) this._leftPanel.classList.add('hidden');
        else this._leftPanel.classList.remove('hidden');
        if (layout.rightPx < 1) this._rightPanel.classList.add('hidden');
        else this._rightPanel.classList.remove('hidden');

        this._updateSizePanelsOnSplitChange(layout.leftPx, layout.rightPx);
        if (this._rightPanel.layout) this._rightPanel.layout();
        if (this._leftPanel.layout) this._leftPanel.layout();
        this._setMsplitIfChanged(layout.leftPx, layout.rightPx);
        this._refreshToggle(layout);
    }

    private _savePreferencesByLevel(msplit: string) {
        if (this._layoutMode === 'mobile') return;
        const level = +(this.getAttribute('level') || '7');
        const fsByLevel = this._fullScreenData[level];
        if (fsByLevel === 'left' || fsByLevel === 'right') return;
        const [wL, wR] = msplit.split(',');
        if (!wL || !wR) return;
        const totalWidth = this.msizeObj.width - this._separatorWidth;
        const lp = ((+wL / totalWidth) * 100).toFixed(2);
        const rp = ((+wR / totalWidth) * 100).toFixed(2);
        if (!lp || !rp) return;
        try {
            const usermsplit = localStorage.getItem('user-msplit');
            const data: string[] = usermsplit ? JSON.parse(usermsplit) : ['', '', '', '', '', '', '', ''];
            data[level] = `${lp},${rp}`;
            localStorage.setItem('user-msplit', JSON.stringify(data));
        } catch { /* private mode or storage full — preferences not persisted */ }
    }

    private _setMSplitFullScreen() {
        this.setAttribute('msplit-fullscreen', this._fullScreenData.join(','));
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('mls:ready', () => customElements.define('collab-spliter', CollabSpliter), { once: true });
}
