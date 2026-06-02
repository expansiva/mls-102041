/// <mls fileReference="_102041_/l2/collab-nav-3-menu.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

/// **collab_i18n_start**
const message_en = {
    about: 'About',
    aboutThisService: 'About this Service',
    reference: 'Reference',
    level: 'Level',
    position: 'Position',
    preview: 'Preview',
};
type MessageType = typeof message_en;
const message_pt: MessageType = {
    about: 'Sobre',
    aboutThisService: 'Sobre este serviço',
    reference: 'Referência',
    level: 'Nível',
    position: 'Posição',
    preview: 'Pré-visualização',
};
const messages: { [key: string]: MessageType } = { en: message_en, pt: message_pt };
/// **collab_i18n_end**

import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import '/_102041_/l2/collab-nav-3-menu-tools-link.js';
import '/_102041_/l2/collab-tooltip.js';
import '/_102041_/l2/collab-nav-3-menu-tools-cycle.js';
import '/_102041_/l2/collab-nav-3-menu-tools-dropdown.js';
import '/_102041_/l2/collab-nav-3-menu-tools-tree-dropdown.js';

import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

type TMode = 'initial' | 'page' | 'editor';

interface IOptions { text: string; icon?: string; class?: string; }
interface IOptionsSubMenu extends IOptions { options: IOptions[]; }
interface IToolsData1 { type: 'dropdown' | 'cycle' | 'link'; selected?: number; onlyMenu?: boolean; options: IOptions[]; icon?: string; class?: string; }
interface IToolsData2 { type: 'tree-dropdown'; selected?: number[]; onlyMenu?: boolean; options: IOptionsSubMenu[]; icon?: string; class?: string; }
type IToolsData = IToolsData1 | IToolsData2;
interface ITabs { type?: 'full' | 'onlyicon'; effect?: string; mode?: 'normal' | 'compact'; group?: string; selected?: number; previous?: number; options: IOptions[]; }
interface IMain { [key: string]: IOptions | string; }
interface ITools { [key: string]: IToolsData; }

export interface IServiceMenu {
    title: IOptions | string;
    main?: IMain;
    tabs?: ITabs;
    tools?: ITools;
    mainDefault?: string;
    lastMain?: string;
    enabled?: boolean;
    onClickTitle?: Function;
    onClickMain?: Function;
    onClickTools?: Function;
    onClickTabs?: Function;
    onClickTabsNavigation?: Function;
    setMode?: Function;
    setTabActive?: Function;
    tabNavigate?: Function;
    tabBack?: Function;
    toggleErrorTab?: Function;
    selectTool?: Function;
    setMenuActive?: Function;
    closeMenu?: Function;
    getLastMode?: Function;
    refresh?: Function;
    updateTitle?: Function;
}

@customElement('collab-nav-3-menu')
export class CollabNav3Menu extends StateLitElement {

    @property({ attribute: 'msize' }) msize: string = '';
    @property({ attribute: 'msize-height' }) msizeHeight: string = '';
    @property({ attribute: 'is-mls2' }) isMls2: string = '';

    @state() private _menuChecked: boolean = false;
    @state() private _lastMode: TMode = 'initial';
    @state() private _activeTitle: IOptions = { text: '', icon: '' };
    @state() private _actionPage: HTMLElement | undefined;
    @state() private _tabSelected: number = 0;
    @state() private _historyTabs: { index: number; element: HTMLElement }[] = [];
    private _resizeTimeout: number = 0;
    @state() private _hiddenEls: Set<string> = new Set();

    private msg: MessageType = messages['en'];

    private _menu: IServiceMenu | undefined = {
    title: 'Example',
    main: {},
    tools: {
      darkLight: {
        type: 'cycle',
        selected: 0,
        options: [
          { text: 'Light', icon: 'f185' },
          { text: 'Dark', icon: 'f186' },
        ]
      },
      languages: {
        type: 'dropdown',
        selected: 0,
        options: []
      },
      watchPreview: {
        type: 'cycle',
        selected: 0,
        options: [
          { text: 'Run', icon: 'f04c' },
          { text: 'Pause', icon: 'f04b' },
        ]
      },
    },
    tabs: {
      group: 'Mode',
      type: 'full',
      selected: 0,
      options: [
        { text: 'Desktop', icon: 'f390' },
        { text: 'Mobile', icon: 'f3cf' },
      ]
    }
  }
    private _isInternalAboutLastOpened: boolean = false;
    private _lastTitle: string = '';

    firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        this.setAttribute('mheight', '40');
        this._initMenu();
    }

    updated(changed: Map<string, unknown>) {
        if (changed.has('msize')) {
            const [width] = this.msize.split(',');
            const ul = this.querySelector('.menu-list') as HTMLElement;
            if (ul) ul.style.width = width + 'px';
            const container = this.querySelector('.container') as HTMLElement;
            if (container) container.classList.toggle('hidden', width === '0');
            if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
            this._resizeTimeout = window.setTimeout(() => this._onResizeWidthChange((+width) - 38), 200);
        }
        if (changed.has('msizeHeight')) {
            const ul = this.querySelector('.menu-list') as HTMLElement;
            if (ul) ul.style.maxHeight = this.msizeHeight + 'px';
        }
        this._registerTooltips();
    }

    render() {
        this.msg = messages[this.getMessageKey(messages)] || messages['en'];
        const menu = this._getMenuOptions();
        if (!menu) return nothing;

        return html`
            <div>
                <div class=${classMap({ container: true, checked: this._menuChecked })}>
                    <label class="menu">
                        <input class="menu-btn" type="checkbox" .checked=${this._menuChecked}
                               @change=${this._onHamburgerChange}>
                        <span class="menu-icon"></span>
                    </label>
                    <div class="content">
                        <ul class=${classMap({ tabs: true, full: menu.tabs?.type === 'full', compact: menu.tabs?.mode === 'compact', 'menu-hidden': this._hiddenEls.has('tabs') })}>
                            ${menu.tabs?.mode === 'compact' ? html`
                                <li class=${classMap({ 'icon-back-button': true, 'back-button-hidden': this._historyTabs.length < 2 })}
                                    @click=${this._onBackClick}>
                                    ${this._iconTpl('f053', '')}
                                </li>
                            ` : nothing}
                            ${(menu.tabs?.options || []).map((item, index) => html`
                                <li data-key="${index}" data-tooltip="${item.text}"
                                    class=${classMap({ active: this._tabSelected === index, iconclose: this._tabSelected !== index })}
                                    @click=${(e: Event) => { e.preventDefault(); this._onTabClick(index); }}>
                                    ${this._iconTpl(item.icon, item.class)}
                                    <span class="tab-title">${item.text}</span>
                                </li>
                            `)}
                        </ul>
                        <div class=${classMap({ title: true, 'menu-hidden': this._hiddenEls.has('title') })}
                             @click=${this._onTitleClick}>
                            ${this._activeTitle.icon ? html`<i class=${this._faClass(this._activeTitle.icon)}>${unsafeHTML('&#x' + this._activeTitle.icon)}</i>` : nothing}
                            ${menu.onClickTitle ? html`<div>${this._activeTitle.text}</div>` : html`<span>${this._activeTitle.text}</span>`}
                        </div>
                        <div class=${classMap({ tools: true, 'menu-hidden': this._hiddenEls.has('tools') })}>
                            ${this._renderTools(menu, false)}
                        </div>
                    </div>
                </div>
                <ul class="menu-list" style="display:${this._menuChecked ? '' : 'none'}">
                    ${this._menuChecked ? this._renderMenuList(menu) : nothing}
                </ul>
                <div class="collab-nav-3-menu-action" style="display:${this._actionPage ? 'block' : 'none'}">
                    ${this._actionPage ? html`${this._actionPage}` : nothing}
                </div>
            </div>
        `;
    }

    private _renderTools(menu: IServiceMenu, onlyMenuMode: boolean) {
        const tools = menu.tools || {};
        return Object.entries(tools).map(([key, tool]) => {
            if (onlyMenuMode && !tool['onlyMenu']) return nothing;
            if (!onlyMenuMode && tool['onlyMenu']) return nothing;
            return this._renderTool(key, tool, onlyMenuMode ? 'menu' : '');
        });
    }

    private _renderTool(key: string, tool: IToolsData, renderType: string) {
        const onClickTools = this._getMenuOptions()?.onClickTools;
        if (tool.type === 'link') return html`
            <collab-nav-3-menu-tools-link key="${key}" rendertype="${renderType}"
                .tool=${tool} .onClickTools=${onClickTools}></collab-nav-3-menu-tools-link>`;
        if (tool.type === 'cycle') return html`
            <collab-nav-3-menu-tools-cycle key="${key}" rendertype="${renderType}"
                selected="${(tool as IToolsData1).selected || 0}"
                .tool=${tool} .onClickTools=${onClickTools}></collab-nav-3-menu-tools-cycle>`;
        if (tool.type === 'dropdown') return html`
            <collab-nav-3-menu-tools-dropdown key="${key}" rendertype="${renderType}"
                selected="${(tool as IToolsData1).selected || 0}"
                icon="${tool.icon || ''}"
                .tool=${tool} .onClickTools=${onClickTools}></collab-nav-3-menu-tools-dropdown>`;
        if (tool.type === 'tree-dropdown') return html`
            <collab-nav-3-menu-tools-tree-dropdown key="${key}" rendertype="${renderType}"
                selected="${((tool as IToolsData2).selected || []).toString()}"
                icon="${tool.icon || ''}"
                .tool=${tool} .onClickTools=${onClickTools}></collab-nav-3-menu-tools-tree-dropdown>`;
        return nothing;
    }

    private _renderMenuList(menu: IServiceMenu) {
        const onClickMain = menu.onClickMain;
        const main = menu.main || {};
        const tools = menu.tools || {};
        const tabs = menu.tabs;

        if (!tabs) return html`${nothing}`

        return html`
            ${Object.entries(main).map(([key, data]) => html`
                <li>
                    <div @click=${(e: Event) => { e.preventDefault(); if (typeof onClickMain === 'function') onClickMain(key); }}>
                        ${typeof data === 'string' ? data : html`
                            ${this._iconTpl((data as IOptions).icon, (data as IOptions).class, 'icon-menu-list')}
                            <span>${(data as IOptions).text}</span>
                        `}
                    </div>
                </li>
            `)}
            ${this.isMls2 === 'true' ? html`
                <li><div @click=${() => this._showAbout()}>${this.msg.about}</div></li>
            ` : nothing}
            ${Object.keys(tools).length > 0 ? html`<li><hr></li>` : nothing}
            ${Object.entries(tools).map(([key, tool]) => html`
                <li>${this._renderTool(key, tool, 'menu')}</li>
            `)}
            ${tabs?.options?.length || 0 > 0 ? html`
                <li><hr></li>
                <li class=${classMap({ 'with-drop': true })}>
                    <div @click=${(e: Event) => { e.preventDefault(); (e.currentTarget as HTMLElement).closest('li')?.classList.toggle('opened'); }}>
                        ${tabs.group || ''}: ${tabs.options[tabs.selected || 0]?.text}
                        <ul class="sub-menu">
                            ${tabs.options.map((item, index) => html`
                                <li data-key="${index}">
                                    <div @click=${(e: Event) => { e.preventDefault(); this._onTabFromMenu(index); }}>
                                        ${this._iconTpl(item.icon, item.class)}
                                        <span class="title">${item.text}</span>
                                    </div>
                                </li>
                            `)}
                        </ul>
                    </div>
                </li>
            ` : nothing}
        `;
    }

    private _onHamburgerChange = (e: Event) => {
        this._menuChecked = (e.target as HTMLInputElement).checked;
        if (!this._menuChecked) {
            this._actionPage = undefined;
            this._lastMode = 'initial';
            if (this._isInternalAboutLastOpened) {
                this._setMenuTitle(this._lastTitle);
                this._isInternalAboutLastOpened = false;
                this._lastTitle = '';
            }
            const menu = this._getMenuOptions();
            if (menu) {
                this._activeTitle = { ...(typeof menu.title === 'string' ? { text: menu.title, icon: '' } : menu.title) };
                if (menu.onClickMain && menu.mainDefault && !this._menuChecked) menu.onClickMain(menu.mainDefault);
                if (menu.tabs !== undefined) this._selectTab(menu.tabs.selected ?? 0);
            }
        }
        this._layoutNav3();
    };

    private _onTabClick(index: number) {
        this._selectTab(index);
        const menu = this._getMenuOptions();
        if (menu?.onClickTabs) menu.onClickTabs(index);
    }

    private _onTabFromMenu(index: number) {
        this._menuChecked = false;
        this._selectTab(index);
        const menu = this._getMenuOptions();
        if (menu?.onClickTabs) menu.onClickTabs(index);
    }

    private _onBackClick = () => {
        if (this._historyTabs.length > 1) {
            const actual = this._historyTabs.pop();
            const prev = this._historyTabs[this._historyTabs.length - 1];
            this._tabSelected = prev.index;
            const menu = this._getMenuOptions();
            if (menu?.tabs) menu.tabs.selected = prev.index;
            const onNav = menu?.onClickTabsNavigation;
            if (onNav && actual) onNav(prev.index, actual.element, prev.element);
        }
    };

    private _onTitleClick = () => {
        const menu = this._getMenuOptions();
        if (menu?.onClickTitle) menu.onClickTitle(this._activeTitle.text);
    };

    private _selectTab(index: number) {
        this._tabSelected = index;
        const menu = this._getMenuOptions();
        if (menu?.tabs) menu.tabs.selected = index;
    }

    private _initMenu() {
        const menu = this._getMenuOptions();
        if (!menu) return;
        menu.setMode = this.setMode.bind(this);
        menu.updateTitle = this._updateTitle.bind(this);
        menu.getLastMode = () => this._lastMode;
        menu.setTabActive = this._setTabActive.bind(this);
        menu.tabNavigate = this._tabNavigateNext.bind(this);
        menu.tabBack = this._onBackClick;
        menu.toggleErrorTab = this._toggleErrorTab.bind(this);
        menu.setMenuActive = this._openMenuMainItem.bind(this);
        menu.selectTool = this._selectButton.bind(this);
        menu.closeMenu = this._closeMenu.bind(this);
        menu.refresh = this._refresh.bind(this);
        if (menu.tabs?.selected !== undefined) this._tabSelected = menu.tabs.selected;
    }

    public setMode(mode: TMode | null, page?: HTMLElement) {
        if (!mode) mode = this._lastMode;
        this._lastMode = mode;
        if (mode === 'initial') {
            this._menuChecked = false;
            const menu = this._getMenuOptions();
            if (menu) this._activeTitle = { ...(typeof menu.title === 'string' ? { text: menu.title, icon: '' } : (menu.title as IOptions)) };
        } else if (mode === 'editor') {
            this._menuChecked = true;
        } else if (mode === 'page') {
            this._actionPage = page;
            this._menuChecked = true;
        }
    }

    private _updateTitle() {
        const menu = this._getMenuOptions();
        if (!menu) return;
        const t = typeof menu.title === 'string' ? { text: menu.title, icon: '' } : (menu.title as IOptions);
        this._activeTitle = { ...t };
    }

    private _setTabActive(index: number) { this._selectTab(index); }

    private _tabNavigateNext(index: number, oldTab: HTMLElement, newTab: HTMLElement) {
        this._selectTab(index);
        this._historyTabs = [...this._historyTabs, { index, element: newTab }];
        const menu = this._getMenuOptions();
        if (menu?.tabs) menu.tabs.previous = index;
        if (menu?.onClickTabsNavigation) menu.onClickTabsNavigation(index, oldTab, newTab);
    }

    private _toggleErrorTab(op: string, show: boolean) {
        const li = this.querySelector(`ul.tabs li[data-key="${op}"]`) as HTMLElement;
        if (!li) return;
        li.querySelector('.icon-error')?.remove();
        li.classList.toggle('has-error', show);
        if (show) {
            const err = document.createElement('span');
            err.className = 'icon-error fa';
            err.innerHTML = '&#x21';
            li.appendChild(err);
        }
    }

    private _openMenuMainItem(option: string) {
        this._menuChecked = true;
        const menu = this._getMenuOptions();
        if (menu?.onClickMain) menu.onClickMain(option);
    }

    private _selectButton(op: string) {
        const tools = this.querySelector('.tools') as HTMLElement;
        const btn = tools?.querySelector(`span[data-key="${op}"]`) as HTMLElement;
        if (btn) btn.click();
    }

    private _closeMenu() { this._menuChecked = false; }

    private _refresh(mode: 'full' | 'tabs' | 'tools' = 'full') { this.requestUpdate(); }

    private _showAbout(): boolean {
        const menu = this._getMenuOptions();

        this._lastTitle = menu ? typeof menu.title === 'string' ? menu.title : (menu.title as IOptions).text : '';
        this._isInternalAboutLastOpened = true;
        const toolbarContentEl = this.closest('collab-nav-3-service');
        const toolbarEl = this.closest('collab-nav-3');
        const serviceName = toolbarContentEl?.getAttribute('data-service') || 'Is Preview';
        const serviceLevel = toolbarEl?.getAttribute('level') || 'Is Preview';
        const servicePosition = toolbarEl?.getAttribute('toolbarposition') || 'Is Preview';
        this._setMenuTitle(`${this.msg.about} ${serviceName}`);
        this._updateTitle();
        const div = document.createElement('div');
        div.innerHTML = `<h3>${this.msg.aboutThisService}</h3><ul><li>${this.msg.reference}: ${serviceName}</li><li>${this.msg.level}: ${serviceLevel}</li><li>${this.msg.position}: ${servicePosition}</li></ul>`;
        this.setMode('page', div);
        return true;
    }

    private _setMenuTitle(title: string) {
        const menu = this._getMenuOptions();
        if (!menu) return;
        if (typeof menu.title === 'string') menu.title = title;
        else (menu.title as IOptions).text = title;
    }

    private _layoutNav3() {
        const nav3 = this.closest('collab-nav-3') as any;
        if (nav3?.layout) nav3.layout();
    }

    private _getMenuOptions(): IServiceMenu | undefined {
        if (this._menu) return this._menu;
        const parent = this.parentElement as HTMLElement;
        if (!parent) return this._defaultMenu();
        const widget = (parent as any)['mlsWidget'] as any;
        if (!widget) return this._defaultMenu();
        const menu = widget['menu'] as IServiceMenu;
        if (!menu || typeof menu !== 'object') return this._defaultMenu();
        if (typeof menu.title === 'string') menu.title = { text: menu.title, icon: '' };
        this._activeTitle = { ...(menu.title as IOptions) };
        this._menu = menu;
        return menu;
    }

    private _defaultMenu(): IServiceMenu {
        if (this._menu) return this._menu;
        const menu: IServiceMenu = {
            title: { text: this.msg.preview, icon: '' },
            main: {},
            tabs: undefined,
            tools: {},
            mainDefault: '',
            lastMain: '',
            onClickMain: undefined, onClickTabs: undefined, onClickTitle: undefined, onClickTools: undefined,
            onClickTabsNavigation: undefined, setMode: undefined, closeMenu: undefined, getLastMode: undefined,
            refresh: undefined, selectTool: undefined, setMenuActive: undefined, setTabActive: undefined,
            tabNavigate: undefined, tabBack: undefined, toggleErrorTab: undefined, updateTitle: undefined,
        };
        this._activeTitle = { text: 'Preview', icon: '' };
        this._menu = menu;
        return menu;
    }

    private _registerTooltips() {
        const tooltipEl = document.querySelector('collab-tooltip') as any;
        if (!tooltipEl?.tooltip) return;
        this.querySelectorAll('li[data-tooltip]').forEach(el => tooltipEl.tooltip(el));
    }

    private _onResizeWidthChange(newWidth: number) {
        const content = this.querySelector('.content') as HTMLElement;
        if (!content) return;
        const totalWidth = content.getBoundingClientRect().width;
        const tabs = this.querySelector('.tabs') as HTMLElement;
        const tools = this.querySelector('.tools') as HTMLElement;
        const title = this.querySelector('.title') as HTMLElement;
        const tabsW = (tabs?.getBoundingClientRect().width || 0) + 10;
        const toolsW = tools?.getBoundingClientRect().width || 0;
        const titleW = title?.getBoundingClientRect().width || 0;
        const margin = 15;
        const total = totalWidth + margin;
        const next = new Set(this._hiddenEls);

        if (total > newWidth) {
            if ((total - titleW) < newWidth) next.add('title');
            else if ((total - titleW - toolsW) < newWidth) { next.add('title'); next.add('tools'); }
            else if ((total - titleW - toolsW - tabsW) < newWidth) { next.add('title'); next.add('tools'); next.add('tabs'); }
        } else if (total < newWidth) {
            if (newWidth >= tabsW && next.has('tabs')) next.delete('tabs');
            if (newWidth >= (toolsW + tabsW) && !next.has('tabs') && next.has('tools')) next.delete('tools');
            if (newWidth >= (toolsW + tabsW + titleW + margin) && next.has('title') && !next.has('tabs') && !next.has('tools')) {
                next.delete('title'); next.delete('tools'); next.delete('tabs');
            }
        }
        this._hiddenEls = next;
    }

    private _iconTpl(str?: string, className?: string, extraClass = '') {
        const cls = [className || '', extraClass].filter(Boolean).join(' ');
        if (!str) return html`<i class="${cls}"></i>`;
        if (str.trim().startsWith('<svg')) return html`<span class="${cls}">${unsafeHTML(str)}</span>`;
        return html`<i class="${this._faClass(str)} ${cls}">${unsafeHTML('&#x' + str)}</i>`;
    }

    private _faClass(unicode: string): string {
        const brands = new Set(['f38b', 'f09a', 'f099', 'f0d5', 'f1a1', 'f17e', 'f1e3', 'f16a', 'f13b']);
        if (unicode?.startsWith('f') && unicode.length === 4 && brands.has(unicode)) return 'fa-brands';
        return 'fa';
    }
}
