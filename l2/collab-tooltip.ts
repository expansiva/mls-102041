/// <mls fileReference="_102041_/l2/collab-tooltip.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

import { nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

@customElement('collab-tooltip')
export class CollabTooltip extends StateLitElement {

    private _timeoutId: number | undefined;
    private readonly _isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    private readonly _widthMarginOfError = 10;

    render() { return nothing; }

    firstUpdated() {
        document.body.appendChild(this);
    }

    public tooltip(el: HTMLElement) {
        (el as any)['element'] = el;
        el.addEventListener('mouseover', this._show, false);
        el.addEventListener('mouseleave', this.destroy, false);
    }

    public destroy = () => {
        this.innerHTML = '';
        this.style.top = '0px';
        this.style.left = '0px';
    };

    private _show = (evt: MouseEvent) => {
        this.innerHTML = '';
        const el = (evt.currentTarget as any)['element'] as HTMLElement;
        if (!el) return;

        const title = el.getAttribute('data-tooltip');
        if (!title) return;

        const arrow = document.createElement('div');
        const content = document.createElement('span');
        content.innerHTML = title;

        this.appendChild(arrow);
        this.appendChild(content);

        const position = el.getBoundingClientRect();
        const docWidth = document.body.getBoundingClientRect().width;
        const contentWidth = content.getBoundingClientRect().width;

        if (contentWidth + position.left > docWidth - this._widthMarginOfError) {
            arrow.classList.add('open-to-right');
            this.style.left = (position.left + position.width / 2 - (contentWidth - 30)) + 'px';
            this.style.top = (position.top + 5 + position.height + 3) + 'px';
        } else {
            this.style.top = (position.top + position.height + 3) + 'px';
            this.style.left = (position.left + position.width / 2) + 'px';
        }

        if (this._isMobile) {
            clearTimeout(this._timeoutId);
            this._timeoutId = window.setTimeout(() => this.destroy(), 2000);
        }
    };
}

