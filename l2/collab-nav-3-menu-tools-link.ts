/// <mls fileReference="_102041_/l2/collab-nav-3-menu-tools-link.ts" enhancement="_102020_/l2/enhancementAura.ts"/>

import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

interface IOptionsToolsLink {
    text: string;
    icon?: string;
    class?: string;
}

interface IToolsLinkData {
    icon?: string;
    class?: string;
    options: IOptionsToolsLink[];
}

@customElement('collab-nav-3-menu-tools-link')
export class CollabNav3MenuToolsLink extends StateLitElement {

    @property({ attribute: 'key' }) key: string = '';
    @property({ attribute: 'rendertype' }) renderType: string = '';

    public onClickTools?: Function;
    public tool?: IToolsLinkData;

    private get _tooltipEl(): any { return document.querySelector('collab-tooltip') as any; }

    updated() {
        const span = this.querySelector('span[data-tooltip]');
        if (this._tooltipEl?.tooltip && span) this._tooltipEl.tooltip(span);
    }

    render() {
        if (!this.tool) return nothing;
        const option = this.tool.options[0];
        if (!option) return nothing;
        return this.renderType === 'menu' ? this._renderAsMenu(option) : this._renderAsTool(option);
    }

    private _renderAsTool(option: IOptionsToolsLink) {
        return html`
            <span data-key="${this.key}" data-tooltip="${option.text}" @click=${this._onToolClick}>
                ${this._iconTpl(option.icon, option.class)}
                <i class="icon-link fa-solid fa-arrow-up-right-from-square"></i>
            </span>
        `;
    }

    private _renderAsMenu(option: IOptionsToolsLink) {
        return html`
            <div data-key="${this.key}" @click=${this._onMenuClick}>
                ${this._iconTpl(option.icon, option.class)}
                <span>${option.text.trim()} ...</span>
            </div>
        `;
    }

    private _onToolClick = () => {
        if (typeof this.onClickTools !== 'function') throw new Error('onClickTools not found');
        if (this._tooltipEl?.destroy) this._tooltipEl.destroy();
        this.onClickTools(this.key);
    };

    private _onMenuClick = () => {
        if (typeof this.onClickTools !== 'function') throw new Error('onClickTools not found');
        this.onClickTools(this.key);
    };

    private _iconTpl(str?: string, className?: string) {
        const cls = className || '';
        if (!str) return html`<i class="${cls}"></i>`;
        if (str.trim().startsWith('<svg')) return html`<span class="${cls}">${unsafeHTML(str)}</span>`;
        return html`<i class="fa ${cls}">${unsafeHTML('&#x' + str)}</i>`;
    }
}
