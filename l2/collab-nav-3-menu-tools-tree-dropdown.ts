/// <mls fileReference="_102041_/l2/collab-nav-3-menu-tools-tree-dropdown.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

interface IOptionsSubMenu {
    text: string;
    icon?: string;
    class?: string;
}

interface IOptionsToolsTreeDropDown {
    text: string;
    icon?: string;
    class?: string;
    options: IOptionsSubMenu[];
}

interface IToolsDataTreeDropDown {
    type: string;
    selected?: number[];
    icon?: string;
    class?: string;
    options: IOptionsToolsTreeDropDown[];
}

@customElement('collab-nav-3-menu-tools-tree-dropdown')
export class CollabNav3MenuToolsTreeDropdown extends StateLitElement {

    @property({ attribute: 'key' }) key: string = '';
    @property({ attribute: 'icon' }) icon: string = '';
    @property({ attribute: 'selected' }) selected: string = '';
    @property({ attribute: 'rendertype' }) renderType: string = '';
    @state() private _dropOpen: boolean = false;
    @state() private _menuOpened: boolean = false;
    @state() private _openedItems: Set<number> = new Set();

    public onClickTools?: Function;
    public tool?: IToolsDataTreeDropDown;

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this._onDocumentClick);
        document.addEventListener('visibilitychange', this._onVisibilityChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this._onDocumentClick);
        document.removeEventListener('visibilitychange', this._onVisibilityChange);
    }

    firstUpdated(changedProperties?: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        if (this.renderType === 'menu') this.classList.add('list');
    }

    render() {
        if (!this.tool) return nothing;
        return this.renderType === 'menu' ? this._renderAsMenu() : this._renderAsTool();
    }

    private _renderAsTool() {
        if (!this.tool?.options) return nothing;
        const iconStr = this.icon && this.icon !== 'undefined' ? this.icon : '';
        return html`
            <span data-key="${this.key}" @click=${this._onHostClick}>
                ${this._iconTpl(iconStr, '', 'icon-menu')}
                <i class="fa-solid fa-caret-down icon-drop"></i>
                <div class="btn-menu ${this._dropOpen ? 'open' : ''}">
                    <ul>
                        <li class="menu-header">${this.key}</li>
                        ${this.tool.options.map((item, index) => {
                            const hasSub = item.options && item.options.length > 0;
                            return html`
                                <li class=${classMap({ 'dropdown-sub-menu': hasSub })}
                                    index="${index}"
                                    @click=${(e: Event) => { if (!hasSub) { e.stopPropagation(); this._onLeafClick(index); } }}>
                                    ${item.icon || item.class
                                        ? html`${this._iconTpl(item.icon, item.class)}<span>${item.text}</span>`
                                        : item.text}
                                    ${hasSub ? html`
                                        <div>
                                            <ul>
                                                ${item.options.map((sub, subIndex) => html`
                                                    <li @click=${(e: Event) => { e.stopPropagation(); this._onSubLeafClick(index, subIndex); }}>
                                                        ${sub.icon || sub.class
                                                            ? html`${this._iconTpl(sub.icon, sub.class)}<span>${sub.text}</span>`
                                                            : sub.text}
                                                    </li>
                                                `)}
                                            </ul>
                                        </div>
                                    ` : nothing}
                                </li>
                            `;
                        })}
                    </ul>
                </div>
            </span>
        `;
    }

    private _renderAsMenu() {
        const iconStr = this.icon && this.icon !== 'undefined' ? this.icon : '';
        return html`
            <div data-key="${this.key}"
                 class=${classMap({ opened: this._menuOpened })}
                 @click=${this._onMenuHeaderClick}>
                <div class="dropdown-list-header">
                    ${this._iconTpl(iconStr, '')}
                    <span>${this.key.charAt(0).toUpperCase() + this.key.slice(1).toLowerCase()}</span>
                </div>
                <ul class="sub-menu">
                    ${this.tool?.options.map((opt, index) => html`
                        <li class=${classMap({ opened: this._openedItems.has(index) })}
                            @click=${(e: Event) => { e.stopPropagation(); this._toggleMenuItem(index); }}>
                            <div>
                                ${this._iconTpl(opt.icon, opt.class)}
                                <span>${opt.text}</span>
                            </div>
                            <ul class="sub-menu-2">
                                ${opt.options.map((sub, subIndex) => html`
                                    <li class="sub-menu-2-item"
                                        @click=${(e: Event) => { e.stopPropagation(); this._onMenuSubItemClick(index, subIndex); }}>
                                        <div>
                                            ${this._iconTpl(sub.icon, sub.class)}
                                            <span>${sub.text}</span>
                                        </div>
                                    </li>
                                `)}
                            </ul>
                        </li>
                    `)}
                </ul>
            </div>
        `;
    }

    private _onHostClick = (e: MouseEvent) => {
        if (this._dropOpen) {
            this._dropOpen = false;
            this.classList.remove('open');
            return;
        }
        this._dropOpen = true;
        this.classList.add('open');
        this.parentElement?.querySelectorAll('.btn-menu').forEach(m => m.classList.remove('open'));
        this.parentElement?.querySelectorAll('collab-nav-3-menu-tools-dropdown').forEach(el => {
            if (el !== this) el.classList.remove('open');
        });
    };

    private _onMenuHeaderClick = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.closest('li.sub-menu-2-item')) return;
        this._menuOpened = !this._menuOpened;
    };

    private _toggleMenuItem(index: number) {
        const next = new Set(this._openedItems);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        this._openedItems = next;
    }

    private _onLeafClick(index: number) {
        if (!this.tool) return;
        this._dropOpen = false;
        this.classList.remove('open');
        this.selected = String(index);
        this.tool.selected = [index];
        if (typeof this.onClickTools !== 'function') throw new Error('onClickTools not found');
        this.onClickTools(this.key);
    }

    private _onSubLeafClick(index: number, subIndex: number) {
        if (!this.tool) return;
        this._dropOpen = false;
        this.classList.remove('open');
        this.selected = [index, subIndex].toString();
        this.tool.selected = [index, subIndex];
        if (typeof this.onClickTools !== 'function') throw new Error('onClickTools not found');
        this.onClickTools(this.key);
    }

    private _onMenuSubItemClick(index: number, subIndex: number) {
        if (!this.tool) return;
        this.selected = [index, subIndex].toString();
        this._menuOpened = false;
        this.tool.selected = [index, subIndex];
        if (typeof this.onClickTools !== 'function') throw new Error('onClickTools not found');
        this.onClickTools(this.key);
    }

    public _closeDropdown() {
        this._dropOpen = false;
        this.classList.remove('open');
    }

    private _onDocumentClick = (e: MouseEvent) => {
        if (!this.contains(e.target as HTMLElement)) this._closeDropdown();
    };

    private _onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') this._closeDropdown();
    };

    private _iconTpl(str?: string, className?: string, extraClass: string = '') {
        const cls = [className || '', extraClass].filter(Boolean).join(' ');
        if (!str) return html`<i class="${cls}"></i>`;
        if (str.trim().startsWith('<svg')) return html`<span class="${cls}">${unsafeHTML(str)}</span>`;
        return html`<i class="fa ${cls}">${unsafeHTML('&#x' + str)}</i>`;
    }
}
