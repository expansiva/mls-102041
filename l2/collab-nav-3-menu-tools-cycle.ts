/// <mls fileReference="_102041_/l2/collab-nav-3-menu-tools-cycle.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

/// **collab_i18n_start**
const message_en = {
    actualState: 'Actual state',
    changeTo: 'Change to',
};
type MessageType = typeof message_en;
const message_pt: MessageType = {
    actualState: 'Estado atual',
    changeTo: 'Alterar para',
};
const messages: { [key: string]: MessageType } = { en: message_en, pt: message_pt };
/// **collab_i18n_end**

import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

interface IOptionsToolsCycle {
    text: string;
    icon?: string;
    class?: string;
}

interface IToolsDataCycle {
    type: string;
    selected?: number;
    icon?: string;
    class?: string;
    options: IOptionsToolsCycle[];
}

@customElement('collab-nav-3-menu-tools-cycle')
export class CollabNav3MenuToolsCycle extends StateLitElement {

    @property({ attribute: 'key' }) key: string = '';
    @property({ type: Number, attribute: 'selected' }) selected: number = 0;
    @property({ attribute: 'rendertype' }) renderType: string = '';
    @state() private _menuOpened: boolean = false;

    public onClickTools?: Function;
    public tool?: IToolsDataCycle;

    private msg: MessageType = messages['en'];

    private get _tooltipEl(): any { return document.querySelector('collab-tooltip') as any; }

    firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        if (this.renderType === 'menu') {
            this.classList.add('list');
            this._syncFromToolbar();
        }
    }

    updated() {
        const span = this.querySelector('span[data-tooltip]');
        if (this._tooltipEl?.tooltip && span) this._tooltipEl.tooltip(span);
    }

    render() {
        this.msg = messages[this.getMessageKey(messages)] || messages['en'];
        if (!this.tool) return nothing;
        return this.renderType === 'menu' ? this._renderAsMenu() : this._renderAsTool();
    }

    private _renderAsTool() {
        const option = this.tool?.options[this.selected];
        if (!option) return nothing;
        return html`
            <span data-key="${this.key}" data-tooltip="${option.text}" @click=${this._onToolClick}>
                ${this._iconTpl(option.icon, option.class)}
            </span>
        `;
    }

    private _renderAsMenu() {
        const option = this.tool?.options[this.selected];
        if (!option) return nothing;
        return html`
            <div data-key="${this.key}"
                 class=${classMap({ opened: this._menuOpened })}
                 @click=${this._onMenuHeaderClick}>
                <div class="cycle-list-header">
                    ${this._iconTpl(option.icon, option.class)}
                    <span>${this.key.charAt(0).toUpperCase() + this.key.slice(1).toLowerCase()}</span>
                    <span>: ${option.text}</span>
                </div>
                <ul class="sub-menu">
                    ${this.tool?.options.map((opt, index) => html`
                        <li class=${classMap({ selected: index === this.selected })}
                            @click=${(e: Event) => { e.stopPropagation(); this._onMenuItemClick(index); }}>
                            <div>
                                ${this._iconTpl(opt.icon, opt.class)}
                                <span>${index === this.selected ? this.msg.actualState + ': ' + opt.text : this.msg.changeTo + ': ' + opt.text}</span>
                            </div>
                        </li>
                    `)}
                </ul>
            </div>
        `;
    }

    private _onToolClick = () => {
        if (!this.tool) return;
        const nextIndex = (this.selected + 1) % this.tool.options.length;
        this.selected = nextIndex;
        this.tool.selected = nextIndex;
        if (this._tooltipEl?.destroy) this._tooltipEl.destroy();
        if (typeof this.onClickTools !== 'function') throw new Error('onClickTools not found');
        this.onClickTools(this.key);
    };

    private _onMenuHeaderClick = (e: Event) => {
        this._menuOpened = !this._menuOpened;
    };

    private _onMenuItemClick(index: number) {
        if (!this.tool) return;
        const similar = this._findToolbarCounterpart();
        if (similar) similar.setAttribute('selected', index.toString());
        this.selected = index;
        this._menuOpened = false;
        this.tool.selected = index;
        if (typeof this.onClickTools !== 'function') throw new Error('onClickTools not found');
        this.onClickTools(this.key);
    }

    private _syncFromToolbar() {
        const similar = this._findToolbarCounterpart();
        if (similar) {
            const sel = similar.getAttribute('selected');
            if (sel) this.selected = +sel;
        }
    }

    private _findToolbarCounterpart(): Element | undefined | null {
        return this.closest('collab-nav-3-menu')
            ?.querySelector('.tools')
            ?.querySelector(`collab-nav-3-menu-tools-cycle[key="${this.key}"]`);
    }

    private _iconTpl(str?: string, className?: string) {
        const cls = className || '';
        if (!str) return html`<i class="${cls}"></i>`;
        if (str.trim().startsWith('<svg')) return html`<span class="${cls}">${unsafeHTML(str)}</span>`;
        return html`<i class="fa ${cls}">${unsafeHTML('&#x' + str)}</i>`;
    }
}
