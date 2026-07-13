/// <mls fileReference="_102041_/l2/collab-spliter-item.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

import { nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { StateLitElement } from '/_102029_/l2/stateLitElement.js';
import type { CollabNav3 } from '/_102041_/l2/collab-nav-3.js';
import type { CollabNav2 } from '/_102041_/l2/collab-nav-2.js';


export class CollabSpliterItem extends StateLitElement {

    @property({ attribute: 'msize' }) msize: string = '';

    public layout() {
        const nav3 = this.querySelector('collab-nav-3') as CollabNav3;
        const nav2 = this.querySelector('collab-nav-2') as CollabNav2;
        if (nav3) nav3.layout();
        if (nav2) nav2.layout();
    }

    render() { return nothing; }

    updated(changed: Map<string, unknown>) {
        if (changed.has('msize')) this._setMSizeNav3(this.msize);
    }

    private _setMSizeNav3(msize: string) {
        if (!msize) return;
        const nav2 = this.querySelector('collab-nav-2') as HTMLElement;
        const nav3 = this.querySelector('collab-nav-3') as HTMLElement;
        if (!nav3 || !nav2) return;
        const heightNav2 = +(nav2.getAttribute('mheight') || '0');
        const [width, height, top, left] = msize.split(',');
        const newHeight = (+height) - heightNav2;
        const newTop = (+top) + heightNav2;
        nav3.setAttribute('msize', [width, newHeight.toFixed(2), newTop.toFixed(2), left].join(','));
    }

}

window.addEventListener('mls:ready', () => customElements.define('collab-spliter-item', CollabSpliterItem), { once: true });
