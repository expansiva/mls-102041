/// <mls fileReference="_102041_/l2/collab-nav-1.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

/// **collab_i18n_start**
const message_en = {
    l7Collab: 'L7 - Collab',
    l6Site: 'L6 - Site',
    l5Project: 'L5 - Project',
    l4Business: 'L4 - Business',
    l3Design: 'L3 - Design',
    l2Components: 'L2 - Components',
    l1Backend: 'L1 - Back-End',
    user: 'User',
};
type MessageType = typeof message_en;
const message_pt: MessageType = {
    l7Collab: 'L7 - Collab',
    l6Site: 'L6 - Site',
    l5Project: 'L5 - Projeto',
    l4Business: 'L4 - Negócios',
    l3Design: 'L3 - Design',
    l2Components: 'L2 - Componentes',
    l1Backend: 'L1 - Back-End',
    user: 'Usuário',
};
const messages: { [key: string]: MessageType } = { en: message_en, pt: message_pt };
/// **collab_i18n_end**

import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';


type ToolbarLevelStatus = 'start' | 'anonymous' | 'enabled' | 'disabled';
type INav1Type = 'tab' | 'notification' | 'user';

interface ICollabNav1Level {
    level: number;
    text: string;
    icon: string;
    tooltip: string;
    align?: 'left' | 'right';
    mode: INav1Type;
}

interface IServicesByProjectConfig { services: string[]; }
interface INav1CollabServiceData { [key: number]: { left: any[]; right: any[]; }; }
interface INav1CollabService3 { widget: string; state: string; icon: string; tooltip: string; visible: boolean; tags?: string[]; isStatic?: boolean; customConfiguration?: any; }
interface INav1Service { widget: string; state: string; icon: string; tooltip: string; visible: boolean; position: string; level: number[]; tags?: string[]; classname?: string; isStatic?: boolean; customConfiguration?: any; }

@customElement('collab-nav-1')
export class CollabNav1 extends StateLitElement {

    @property({ attribute: 'tabindexactive' }) tabindexactive: string = '';
    @property({ attribute: 'status' }) status: string = '';

    get tabActive() { return this.tabindexactive ? +this.tabindexactive : -1; }
    get actualLevel(): number { return [7, 6, 5, 4, 3, 2, 1, 0][this.tabActive > -1 ? this.tabActive : 0]; }
    get project() { return +(this.getAttribute('initialproject') || '0'); }

    private msg: MessageType = messages['en'];
    private _currentLang: string = 'en';

    public services: IServicesByProjectConfig = { services: [] };
    public actualServices?: INav1CollabServiceData;
    public reasons: {} = {};

    @state() private _items: ICollabNav1Level[] = this._defaultJson();
    @state() private _statusMap: Record<number, string> = {};
    @state() private _activeIndex: number = -1;
    @state() private _notificationCount: number = 0;
    @state() private _userAvatarSrc: string = '';
    @state() private _userAdditional: { text: string; img?: string } | undefined;

    private _lastActive: number = -1;
    private _levelAlreadyReady: Record<number, boolean> = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false };
    private _servicesDetailsArr: Record<string, any> = {};
    private _cacheInstancePromise: Promise<Cache> | null = null;
    private _cacheKeysPromise: Promise<readonly Request[]> | null = null;
    private readonly _staticService = ['_102041_serviceStart'];

    public openService(service: string, position: 'left' | 'right', level: number, args?: Record<string, string>) {
        return this._openService(service, position, level, args);
    }

    public addNotification(clear: boolean) { this._setNotificationCount(clear); }

    public changeIconToImage(tabIndex: number, src: string, additional?: { text: string; img?: string }) {
        this._userAvatarSrc = src;
        this._userAdditional = additional;
    }

    public async forceInstanceIfNeed(arr: string[]) {
        const page = this.closest('collab-page');
        if (!page) return;
        const navs3 = Array.from(page.querySelectorAll('collab-nav-3'));
        for (const nav3 of navs3) await (nav3 as any)['instanceServicesIfNeed'](arr);
    }

    updated(changed: Map<string, unknown>) {
        if (changed.has('tabindexactive')) {
            const oldVal = changed.get('tabindexactive') as string;
            if (oldVal === '5' && window.mls && mls?.stor?.cache?.['clearObsoleteCache']) {
                mls.stor.cache['clearObsoleteCache']();
            }
            if (this._lastActive !== this.tabActive) this._activeMe(this.tabActive);
        }
        if (changed.has('status')) this._changeStatus();
    }

    render() {
        const lang = this.getMessageKey(messages);
        if (lang !== this._currentLang) {
            this._currentLang = lang;
            this.msg = messages[lang] || messages['en'];
            this._items = this._defaultJson();
        }
        return html`
            <nav class="fa">
                ${this._items.map((item, idx) => {
            const tabI = this._items.slice(0, idx).filter(i => i.mode !== 'notification').length;
            if (item.mode === 'notification') return this._renderNotification(item);
            if (item.mode === 'user') return this._renderUser(item, tabI);
            return this._renderTab(item, tabI);
        })}
            </nav>
        `;
    }

    private _renderTab(item: ICollabNav1Level, tabI: number) {
        const notifOffset = this._items.filter(i => i.mode === 'notification').length;
        const realTabI = tabI - notifOffset >= 0 ? tabI - notifOffset : tabI;
        const shortcut = this._getShortcut(realTabI, this._items.filter(i => i.mode === 'tab').length - 1);
        const statusCls = this._statusMap[realTabI] || '';
        return html`
            <nav-1-item
                level="${item.text}"
                data-tooltip="${item.tooltip} (${shortcut})"
                class=${classMap({ active: this._activeIndex === realTabI, [statusCls]: !!statusCls })}
                @click=${() => this._activeMe(realTabI)}>
                ${unsafeHTML(item.icon)} ${item.text}
            </nav-1-item>
        `;
    }

    private _renderNotification(item: ICollabNav1Level) {
        const shortcut = this._getShortcutLetter('N');
        return html`
            <nav-1-notification
                data-count="${this._notificationCount || nothing}"
                data-tooltip="${item.tooltip} (${shortcut})"
                style="margin-left: auto"
                @click=${() => this.openService('_100554_serviceUser', 'left', 0, { plugin: '_100554_pluginSystemNotification' })}>
                ${unsafeHTML(item.icon)} ${item.text}
            </nav-1-notification>
        `;
    }

    private _renderUser(item: ICollabNav1Level, tabI: number) {
        const shortcut = this._getShortcut(tabI, this._items.length - 1);
        return html`
            <nav-1-item
                level="${item.text}"
                data-tooltip="${item.tooltip} (${shortcut})"
                class="nav-1-user"
                style="font-size:18px; margin-left: auto"
                @click=${(e: MouseEvent) => this._onUserClick(e, tabI)}>
                ${this._userAdditional ? html`
                    <div class="additional-container">
                        ${this._userAdditional.img ? html`<img class="additional-img" src="${this._userAdditional.img}" alt="${this._userAdditional.text}">` : nothing}
                        <span class="additional-text">${this._userAdditional.text}</span>
                    </div>
                ` : nothing}
                ${this._userAvatarSrc
                ? html`<img class="avatar" src="${this._userAvatarSrc}" alt="user avatar">`
                : html`${unsafeHTML(item.icon)} ${item.text}`}
            </nav-1-item>
        `;
    }

    updated_tooltip() {
        const tooltip = document.querySelector('collab-tooltip') as any;
        if (!tooltip?.tooltip) return;
        this.querySelectorAll('nav-1-item, nav-1-notification').forEach(el => tooltip.tooltip(el));
    }

    private _onUserClick(e: MouseEvent, tabI: number) {
        const target = e.target as HTMLElement;
        if (target.closest('.additional-container')) {
            this.openService('_100554_serviceUser', 'left', 0, { plugin: '_100554_pluginSystemLanguage' });
            return;
        }
        if (target.closest('.avatar')) {
            this.openService('_100554_serviceUser', 'left', 0, { plugin: '_100554_pluginSystemUser' });
            return;
        }
        this._activeMe(tabI);
    }

    private _setNotificationCount(clear?: boolean) {
        let count = this._notificationCount;
        if (clear) count = 0;
        else count = count >= 9 ? 9 : count + 1;
        this._notificationCount = count;
    }

    private _openService(service: string, position: 'left' | 'right', level: number, args?: Record<string, string>) {
        const page = this.closest('collab-page');
        if (!page) return;
        const toolbar = page.querySelector(`collab-nav-2[toolbarposition="${position}"]`) as HTMLElement;
        const nav3 = page.querySelector(`collab-nav-3[toolbarposition="${position}"]`) as HTMLElement;
        if (!toolbar) return;
        if (args && nav3) (nav3 as any).args = args;
        if (this.actualLevel !== level) {
            (toolbar as any).state[level][position] = service;
            this._selectLevel(level);
            return;
        }
        const item = toolbar.querySelector(`collab-nav-2-item[data-service="${service}"]`) as HTMLElement;
        if (item) item.click();
    }

    private _selectLevel(level: number) {
        const page = this.closest('collab-page');
        const nav = page?.querySelector('collab-nav-1') as HTMLElement;
        const objIndex: Record<number, number> = { 0: 7, 1: 6, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1, 7: 0 };
        if (!nav) return;
        nav.setAttribute('tabindexactive', String(objIndex[level]));
    }

    private _activeMe(idx: number) {
        const tabItems = this._items.filter(i => i.mode !== 'notification');
        let lastLevel: number = -1;
        const act = this.querySelector('nav-1-item.active');
        if (act) {
            const lvl = act.getAttribute('level');
            if (lvl) lastLevel = +lvl;
        }
        const tabI = this._items.filter(i => i.mode !== 'notification').length - 1;
        if (idx < 0 || idx > tabI) return;
        this._activeIndex = idx;
        this._lastActive = idx;
        this.setAttribute('tabindexactive', String(idx));
        if (window.mls && mls?.setActualLevel) mls.setActualLevel(this.actualLevel as mls.Level);
        this._fireChangeLevel(lastLevel);
    }

    private async _fireChangeLevel(lastLevel: number) {
        await Promise.all(['collab-nav-2', 'collab-nav-3'].map(wc => customElements.whenDefined(wc)));
        const collabPage = document.querySelector('collab-page');
        if (!collabPage) return;
        const nav2s = Array.from(collabPage.querySelectorAll('collab-nav-2'));
        if (nav2s.length < 2) return;
        const [nav2Right, nav2Left] = nav2s;
        const collabSpliter = collabPage.querySelector('collab-spliter');
        collabPage.querySelectorAll('collab-nav-3').forEach(nav3 => nav3.setAttribute('level', String(this.actualLevel)));
        nav2Right.setAttribute('status', 'start'); nav2Left.setAttribute('status', 'start');
        nav2Right.setAttribute('level', String(this.actualLevel)); nav2Left.setAttribute('level', String(this.actualLevel));

        const levelCollab = `l${this.actualLevel}` as 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6' | 'l7';
        mls[levelCollab].init('enterLevel');

        const params = { from: lastLevel, to: this.actualLevel };
        if (this._levelAlreadyReady[this.actualLevel]) {
            await this._prepareServices();
            mls?.events?.fire([this.actualLevel as mls.Level], ['LevelChanged'] as any, JSON.stringify(params));
        } else {
            await this._checkIsAllLoaded(this.actualLevel);
            this._levelAlreadyReady[this.actualLevel] = true;
            await this._prepareServices();
            mls?.events?.fire([this.actualLevel as mls.Level], ['LevelChanged'] as any, JSON.stringify(params));
        }
        nav2Right.setAttribute('status', 'enabled'); nav2Left.setAttribute('status', 'enabled');
        collabSpliter?.setAttribute('level', String(this.actualLevel));
    }

    private async _changeStatus() {
        if (this.status === 'start') {
            await Promise.all(['collab-nav-2', 'collab-nav-3'].map(wc => customElements.whenDefined(wc)));
            const page = document.querySelector('collab-page');
            if (!page) return;
            const nav2sStatus = Array.from(page.querySelectorAll('collab-nav-2'));
            const [nav2Right, nav2Left] = nav2sStatus;
            nav2Right?.setAttribute('status', 'start'); nav2Left?.setAttribute('status', 'start');
        }
        if (this.status === 'anonymous') { await this._changeStatusIfAnonymous(); return; }
        if (this.status === 'enabled' && this.tabActive >= 0) this._activeMe(this.tabActive);

        const tabItems = this._items.filter(i => i.mode !== 'notification');
        const newMap: Record<number, string> = {};
        tabItems.forEach((_, idx) => {
            const isActive = idx === this._activeIndex;
            if (isActive) return;
            if (this.status === 'start' && idx === 0) newMap[idx] = 'enabled';
            else if (this.status === 'start') newMap[idx] = 'disabled';
            else newMap[idx] = this.status;
        });
        this._statusMap = newMap;
    }

    private async _changeStatusIfAnonymous() {
        await mls?.stor?.server?.loadProjectInfoIfNeeded(this.project);
        this._activeMe(this.tabActive);
        const tabLevel7El = this.querySelector('nav-1-item[level="7"]');
        if (tabLevel7El && !tabLevel7El.classList.contains('active')) {
            tabLevel7El.className = 'enabled';
        }
    }

    private async _checkIsAllLoaded(level: number) {
        const levelCollab = `l${level}` as 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6' | 'l7';;
        mls[levelCollab].init('preLoading');
    }

    private async _prepareServices() {
        this.actualServices = await this._getUserServicesPreferences();
    }

    private async _getUserServicesPreferences(): Promise<INav1CollabServiceData> {
        const rc = this._prepareServicesByConfigProject(this.services, []);
        return this._mergeData(rc, this.actualLevel);
    }

    private async _mergeData(data: INav1CollabServiceData, actualLevel: number): Promise<INav1CollabServiceData> {
        const servicesDetails: { details: INav1Service }[] = [];
        const servicesPromises: any[] = [];

        for (const [level, services] of Object.entries(data) as [string, any][]) {
            for (const position of Object.keys(services)) {
                for (const service of services[position]) {

                    mls?.actual?.[0]?.setFullName(service.widget);

                    const { path, project } = mls?.actual?.[0] || {};
                    if (project && path) {
                        const driver = (mls?.l5?.getProjectSettings?.(project) as any)?.projectDriver;

                        if (!this._servicesDetailsArr[service.widget]) {

                            if (this._staticService.includes(service.widget)) {
                                const _det = await this._getDetailsServiceStaticMls1(service.widget);

                                if (_det) {
                                    servicesDetails.push({ details: _det });
                                }
                            }
                            else if (!driver) {
                                const _det = this._getDetailsServiceMls1(service.widget);

                                if (_det) {
                                    servicesDetails.push({ details: _det });
                                }
                            }
                            else {
                                servicesPromises.push(
                                    this._getDetailsServiceCollabInJS3(
                                        level,
                                        position,
                                        project,
                                        path
                                    )
                                );
                            }

                            this._servicesDetailsArr[service.widget] = {};
                        }
                    }

                }
            }
        }

        const results = await Promise.allSettled(servicesPromises);
        results.forEach((r: any) => {
            if (r.status === 'fulfilled') servicesDetails.push(r.value);
            else console.error(r.reason);
        });

        for (const d of servicesDetails) {
            if (!d?.details) continue;
            this._servicesDetailsArr[d.details.widget] = d.details;
        }

        return this._mergeData2(data, actualLevel);
    }

    private _mergeData2(data: INav1CollabServiceData, actualLevel: number): INav1CollabServiceData {
        Object.entries(data).forEach(([level, services]: [string, any]) => {
            Object.keys(services).forEach(position => {
                services[position].forEach((service: INav1CollabService3) => {
                    const d = this._servicesDetailsArr[service.widget] as INav1CollabService3;
                    if (!d || Object.keys(d).length === 0) return;
                    service.icon = d.icon; service.visible = d.visible; service.tooltip = d.tooltip; service.state = d.state;
                    if (d.tags) service.tags = d.tags;
                    if ((d as any).customConfiguration?.[(+level)]) {
                        const cfg = (d as any).customConfiguration[+level];
                        const typeConfig = ('left' in cfg || 'right' in cfg) ? 'byPosition' : 'byPlace';
                        const obj = typeConfig === 'byPlace' ? cfg : cfg[position];
                        if (obj?.show === false) return;
                        if (obj) Object.keys(obj).forEach(key => { (service as Record<string, any>) = obj[key]; });
                    }
                });
            });
        });
        return data;
    }

    private _getDetailsServiceMls1(widget: string): INav1Service | undefined {
        const l2 = (window as any).l2_html;
        if (!l2?.[widget]) return undefined;
        return l2[widget]['service_details'];
    }

     private _convertFileNameToTag(widget: string): string {
        const match = widget.match(/_([0-9]+)_(.*)/);
        if (match) {
            const [, number, rest] = match;
            const converted = rest.replace(/([A-Z])/g, '-$1').toLowerCase();
            widget = `${converted}-${number}`;
        }
        if (widget.startsWith('-')) widget = widget.substring(1);
        return widget;
    }

    private async _getDetailsServiceStaticMls1(widget: string): Promise<INav1Service | undefined> { 
        const tag = this._convertFileNameToTag(widget);
        const _temp: any = document.createElement(tag);
        if(!_temp) return;
        if(!_temp.details) return;
        return _temp.details;
    }

    private async _getCacheInstance(): Promise<Cache> {
        if (!this._cacheInstancePromise) this._cacheInstancePromise = caches.open('mls-v2');
        return this._cacheInstancePromise;
    }

    private async _getCacheKeys(): Promise<readonly Request[]> {
        if (!this._cacheKeysPromise) {
            this._cacheKeysPromise = (async () => { const c = await this._getCacheInstance(); return c.keys(); })();
        }
        return this._cacheKeysPromise;
    }

    private async _getDetailsServiceCollabInJS3(level: string, position: string, project: number, path: string): Promise<{ details: INav1Service | undefined }> {
        const target = `/_${project}_${path}.js`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let response: Response;
        try {
            response = await fetch(target, { signal: controller.signal });
        } catch (err: any) {
            clearTimeout(timeout);
            if (err?.name === 'AbortError') throw new Error(`Request timeout while fetching ${target}`);
            throw new Error(`Network error while fetching ${target}: ${err}`);
        }
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`Failed to fetch ${target}: HTTP ${response.status}`);
        const jsCode = await response.text();
        if (jsCode.trim().startsWith('<')) throw new Error(`Unexpected HTML content from ${target}`);
        const details = await this._getDetailsService2(jsCode);
        return { details };
    }

    private async _getDetailsService2(content: string): Promise<INav1Service | undefined> {
        if (typeof content !== 'string') return undefined;
        const markers = ['this.details =', 'details ='];
        let startMarker: string | undefined, startIndex = -1;
        for (const m of markers) {
            const i = content.indexOf(m);
            if (i !== -1 && (startIndex === -1 || i < startIndex)) { startIndex = i; startMarker = m; }
        }
        if (!startMarker || startIndex === -1) return undefined;
        let open = 0, close = 0, endIndex = -1;
        for (let i = startIndex; i < content.length; i++) {
            if (content[i] === '{') open++;
            if (content[i] === '}') close++;
            if (open !== 0 && open === close) { endIndex = i; break; }
        }
        if (endIndex === -1) return undefined;
        let block = content.substring(startIndex + startMarker.length, endIndex + 1).trim();
        block = block.substring(block.indexOf('{')).trim();
        let result: any;
        try { eval('result = ' + block); } catch { return undefined; }
        return result;
    }

    private _prepareServicesByConfigProject(servicesByConfig: IServicesByProjectConfig, userPreferences: any[]): INav1CollabServiceData {
        const staticStart = { icon: '', isStatic: false, state: 'foreground', tooltip: '', visible: true, widget: '_102041_serviceStart' };
        const _cfg = servicesByConfig || { services: [] };
        const parsedConfig = this._parseJsonServicesByConfig(_cfg);
        const parsedPrefs = this._prepareJSONServiceData(userPreferences);

        Object.entries(parsedConfig).forEach(([key, value]: [string, any]) => {
            const _key = Number.parseInt(key);
            if (value.left.length === 1 && value.left[0] === '*') parsedPrefs[_key].left = [staticStart];
            else if (value.left.length > 0) {
                parsedPrefs[_key].left = [staticStart, ...value.left.map((w: string) => ({ icon: '', isStatic: false, state: 'foreground', tooltip: '', visible: true, widget: w }))];
            }
            if (value.right.length === 1 && value.right[0] === '*') parsedPrefs[_key].right = [];
            else if (value.right.length > 0) {
                parsedPrefs[_key].right = value.right.map((w: string) => ({ icon: '', isStatic: false, state: 'foreground', tooltip: '', visible: true, widget: w }));
            }
        });
        return parsedPrefs;
    }

    private _prepareJSONServiceData(services: any[]): INav1CollabServiceData {
        const obj: INav1CollabServiceData = { 0: { left: [], right: [] }, 1: { left: [], right: [] }, 2: { left: [], right: [] }, 3: { left: [], right: [] }, 4: { left: [], right: [] }, 5: { left: [], right: [] }, 6: { left: [], right: [] }, 7: { left: [], right: [] } };
        if (!services || services.length === 0) return obj;
        services.forEach(s => {
            s.places.forEach((p: any) => {
                const d: INav1CollabService3 = { icon: '', state: p.state, tooltip: '', visible: true, widget: s.widget, isStatic: false };
                while ((obj as any)[p.level][p.position].length <= p.index) (obj as any)[p.level][p.position].push(undefined);
                (obj as any)[p.level][p.position][p.index] = d;
            });
        });
        Object.keys(obj).forEach(l => { Object.keys((obj as any)[l]).forEach(p => { (obj as any)[l][p] = (obj as any)[l][p].filter((i: any) => i !== undefined); }); });
        return obj;
    }

    private _parseJsonServicesByConfig(json: IServicesByProjectConfig): any {
        const rc: any = {};
        if (!json?.services) return rc;
        json.services.forEach((item, index) => {
            rc[index] = { left: [], right: [] };
            if (typeof item === 'string' && item.startsWith('-*')) { rc[index].right = ['*']; rc[index].left = ['*']; return; }
            if (!item) return;
            const [left, right] = item.split(';');
            if (left) rc[index].left = left.split(',');
            if (right) rc[index].right = right.split(',');
        });
        return rc;
    }

    private _getShortcut(index: number, totalItems: number): string {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const i = totalItems - index - 1;
        return isMac ? `⌥+${i}` : `Alt+${i}`;
    }

    private _getShortcutLetter(letter: string): string {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        return isMac ? `⌥+${letter}` : `Alt+${letter}`;
    }

    private _defaultJson(): ICollabNav1Level[] {
        return [
            { level: 7, text: '7', icon: '&#xf015', tooltip: this.msg.l7Collab, mode: 'tab' },
            { level: 6, text: '6', icon: '&#xf007', tooltip: this.msg.l6Site, mode: 'tab' },
            { level: 5, text: '5', icon: '&#xf013', tooltip: this.msg.l5Project, mode: 'tab' },
            { level: 4, text: '4', icon: '&#xf0e8', tooltip: this.msg.l4Business, mode: 'tab' },
            { level: 3, text: '3', icon: '&#xf5ae', tooltip: this.msg.l3Design, mode: 'tab' },
            { level: 2, text: '2', icon: '&#xf1b3', tooltip: this.msg.l2Components, mode: 'tab' },
            { level: 1, text: '1', icon: '&#xf233', tooltip: this.msg.l1Backend, mode: 'tab' },
            { level: 0, text: '', icon: '&#xf2bd', tooltip: this.msg.user, mode: 'user', align: 'right' },
        ];
    }
}
