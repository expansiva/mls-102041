/// <mls fileReference="_102041_/l2/collab-page.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

import { nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

@customElement('collab-page')
export class CollabPage extends StateLitElement {

    get msizeObj() {
        const rc = { width: 0, height: 0, top: 0, left: 0 };
        const size = this.getAttribute('msize');
        if (!size) return rc;
        const [width, height, top, left] = size.split(',');
        if (!width || !height || !top || !left) return rc;
        return { width: parseFloat(width), height: parseFloat(height), top: parseFloat(top), left: parseFloat(left) };
    }

    public layout() { this._updateSizeAttr(); }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('resize', this._onResize);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('resize', this._onResize);
    }

    firstUpdated(changedProperties?: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        this._setShortCuts();
        setTimeout(() => this._updateSizeAttr(), 500);
        this._updateSizeAttr();
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) this.setAttribute('ismobile', 'true');
    }

    render() { return nothing; }

    private _onResize = () => this._updateSizeAttr();

    private _setBodyHeight() {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight}px`);
    }

    private _updateSizeAttr() {
        this._setBodyHeight();
        this.style.height = `${window.innerHeight}px`;

        const rect = this.getBoundingClientRect();
        const width = this.clientWidth;
        const { height } = rect;
        this.setAttribute('msize', `${width.toFixed(2)},${height.toFixed(2)},0,0`);

        const nav1 = this.querySelector('collab-nav-1') as HTMLElement;
        const notifications = this.querySelector('collab-sticky-notification') as HTMLElement;
        const cons = this.querySelector('collab-console') as HTMLElement;
        const splitter = this.querySelector('collab-spliter') as HTMLElement;
        if (!nav1 || !splitter) return;

        const mheight = +(nav1.getAttribute('mheight') || '0');
        const mheightMessages = +(notifications?.getAttribute('mheight') || '0');
        const mheightConsole = +(cons?.getAttribute('mheight') || '0');
        const newHeight = height - mheight - mheightMessages - mheightConsole;
        const newTop = mheight + mheightMessages;
        splitter.setAttribute('msize', [width.toFixed(2), newHeight.toFixed(2), newTop.toFixed(2), '0'].join(','));
        this.style.height = this.msizeObj.height + 'px';
    }

    private _setShortCuts() {
        const onkeydown = (event: KeyboardEvent) => {
            const numpadMap: Record<number, number> = { 35: 1, 40: 2, 34: 3, 37: 4, 12: 5, 39: 6, 36: 7, 38: 8, 33: 9, 45: 0 };
            const validKeys = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105,
                35, 40, 34, 37, 12, 39, 36, 38, 33, 45, 78];

            const useNumpad = !!numpadMap[event.keyCode];
            const numBase = event.keyCode > 57 ? 96 : 48;
            let num = useNumpad ? numpadMap[event.keyCode] : event.keyCode - numBase;

            if (event.altKey && validKeys.includes(event.keyCode) && !event.ctrlKey && !event.shiftKey && !useNumpad) {
                event.preventDefault();
                event.stopPropagation();
                if (event.keyCode === 78) {
                    const item = this.querySelector('collab-nav-1 nav-1-notification') as HTMLElement;
                    if (item) item.click();
                    return;
                }
                const items = this.querySelectorAll('collab-nav-1 nav-1-item');
                num = 7 - num;
                if (items.length <= 0 || num < 0 || items.length < num) return;
                (items[num] as HTMLElement).click();
            } else if (event.ctrlKey && event.altKey && validKeys.includes(event.keyCode) && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                const items = this.querySelectorAll('collab-nav-2[toolbarposition=left] collab-nav-2-item:not([visible=false])');
                if (items.length <= 0 || items.length < num) return;
                (items[num - 1] as HTMLElement).click();
            } else if (event.shiftKey && event.altKey && validKeys.includes(event.keyCode) && !event.ctrlKey) {
                event.preventDefault();
                event.stopPropagation();
                const items = this.querySelectorAll('collab-nav-2[toolbarposition=right] collab-nav-2-item:not([visible=false])');
                if (items.length <= 0 || items.length < num) return;
                (items[num - 1] as HTMLElement).click();
            } else if (useNumpad && event.altKey && validKeys.includes(event.keyCode)) {
                event.preventDefault();
                event.stopPropagation();
                const items = this.querySelectorAll('collab-nav-2[toolbarposition=right] collab-nav-2-item:not([visible=false])');
                if (items.length <= 0 || items.length < num) return;
                (items[num - 1] as HTMLElement).click();
            }
        };
        document.addEventListener('keydown', onkeydown.bind(this), true);
    }
}
