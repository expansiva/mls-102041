/// <mls fileReference="_102041_/l2/collab-nav-3-menu-tools-dropdown.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { StateLitElement } from '/_102029_/l2/stateLitElement.js';

interface IOptionsToolsDropDown {
    text: string;
    icon?: string;
    class?: string;
}

interface IToolsDataDropDown {
    type: string;
    selected?: number;
    icon?: string;
    class?: string;
    options: IOptionsToolsDropDown[];
}

@customElement('collab-nav-3-menu-tools-dropdown')
export class CollabNav3MenuToolsDropdown extends StateLitElement {

    @property({ attribute: 'key' }) key: string = '';
    @property({ attribute: 'icon' }) icon: string = '';
    @property({ type: Number, attribute: 'selected' }) selected: number = 0;
    @property({ attribute: 'rendertype' }) renderType: string = '';
    @state() private _menuOpened: boolean = false;

    public onClickTools?: Function;
    @property({ attribute: false }) tool?: IToolsDataDropDown;

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

    firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        if (this.renderType === 'menu') {
            this.classList.add('list');
            this._syncFromToolbar();
        }
    }

    render() {
        if (!this.tool) return nothing;
        return this.renderType === 'menu' ? this._renderAsMenu() : this._renderAsTool();
    }

    private _renderAsTool() {
        if (!this.tool?.options) return nothing;

        const useIconAttr = this.icon && this.icon !== 'undefined';
        const iconStr = useIconAttr ? this.icon : this.tool.options[this.selected]?.icon;
        const iconCls = useIconAttr ? '' : (this.tool.options[this.selected]?.class || '');

        return html`
            <span data-key="${this.key}" @click=${this._onHostClick}>
                ${this._iconTpl(iconStr, iconCls, 'icon-menu')}
                <i class="fa-solid fa-caret-down icon-drop"></i>
                <div class="btn-menu">
                    <ul>
                        <li class="menu-header">${this.key}</li>
                        ${this.tool.options.map((item, index) => html`
                            <li class=${classMap({ active: this.selected === index })}
                                index="${index}"
                                @click=${(e: Event) => { e.stopPropagation(); this._onOptionClick(index, item); }}>
                                ${item.icon || item.class
                                    ? html`${this._iconTpl(item.icon, item.class)}<span>${item.text}</span>`
                                    : item.text}
                            </li>
                        `)}
                    </ul>
                </div>
            </span>
        `;
    }

    private _renderAsMenu() {
        const option = this.tool?.options[this.selected];
        return html`
            <div data-key="${this.key}"
                 class=${classMap({ opened: this._menuOpened })}
                 @click=${this._onMenuHeaderClick}>
                <div class="dropdown-list-header">
                    ${option ? this._iconTpl(option.icon, option.class) : nothing}
                    <span>${this.key.charAt(0).toUpperCase() + this.key.slice(1).toLowerCase()}</span>
                    ${option ? html`<span> : ${option.text}</span>` : nothing}
                </div>
                <ul class="sub-menu">
                    ${this.tool?.options.map((opt, index) => html`
                        <li class=${classMap({ selected: index === this.selected })}
                            @click=${(e: Event) => { e.stopPropagation(); this._onMenuItemClick(index); }}>
                            <div>
                                ${this._iconTpl(opt.icon, opt.class)}
                                <span>${opt.text}</span>
                            </div>
                        </li>
                    `)}
                </ul>
            </div>
        `;
    }

    private _getBtnMenu(): HTMLElement | null {
        return this.querySelector('.btn-menu');
    }

    private _onHostClick = (e: MouseEvent) => {
        const divMenu = this._getBtnMenu();
        if (!divMenu) return;

        if (this.classList.contains('open')) {
            divMenu.classList.remove('open');
            this.classList.remove('open');
            return;
        }

        this.classList.add('open');
        this.parentElement?.querySelectorAll('.btn-menu').forEach(m => m.classList.remove('open'));
        this.parentElement?.querySelectorAll('collab-nav-3-menu-tools-dropdown').forEach(el => {
            if (el !== this) (el as CollabNav3MenuToolsDropdown)._closeDropdown();
        });

        if (divMenu.classList.contains('open')) divMenu.classList.remove('open');
        else divMenu.classList.add('open');
    };

    private _onMenuHeaderClick = () => {
        this._menuOpened = !this._menuOpened;
    };

    private _onOptionClick(index: number, item: IOptionsToolsDropDown) {
        if (!this.tool) return;
        this._closeDropdown();
        this.selected = index;
        this.tool.selected = index;
        if (typeof this.onClickTools !== 'function') throw new Error('onClickTools not found');
        this.onClickTools(this.key);
    }

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

    public _closeDropdown() {
        this._getBtnMenu()?.classList.remove('open');
        this.classList.remove('open');
    }

    private _onDocumentClick = (e: MouseEvent) => {
        if (!this.contains(e.target as HTMLElement)) this._closeDropdown();
    };

    private _onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') this._closeDropdown();
    };

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
            ?.querySelector(`collab-nav-3-menu-tools-dropdown[key="${this.key}"]`);
    }

    private _iconTpl(str?: string, className?: string, extraClass: string = '') {
        const cls = [className || '', extraClass].filter(Boolean).join(' ');
        if (!str) return html`<i class="${cls}"></i>`;
        if (str.trim().startsWith('<svg')) return html`<span class="${cls}">${unsafeHTML(str)}</span>`;
        return html`<i class="fa ${cls}">${unsafeHTML('&#x' + str)}</i>`;
    }
}
