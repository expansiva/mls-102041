/// <mls fileReference="_102041_/l2/collab-nav-2.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

/// **collab_i18n_start**
const message_en = {
    start: 'Start',
};
type MessageType = typeof message_en;
const message_pt: MessageType = {
    start: 'Início',
};
const messages: { [key: string]: MessageType } = { en: message_en, pt: message_pt };
/// **collab_i18n_end**

import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';
import { SERVICE_START_WIDGET } from '/_102041_/l2/utils.js';

type ICollabServicePosition = 'left' | 'right';
type ICollabServiceState = 'foreground' | 'background';
type ICollabServiceClass = 'separator-left' | 'separator-right';

interface ICollabService3 {
    widget: string;
    state: ICollabServiceState;
    icon: string;
    tooltip: string;
    visible: boolean;
    tags?: string[];
    classname?: ICollabServiceClass;
    isStatic?: boolean;
}

interface ICollabServiceData { [key: number]: { left: ICollabService3[]; right: ICollabService3[]; }; }
interface ICollabState { [key: number]: { left: string; right: string; }; }

export class CollabNav2 extends StateLitElement {

    @property({ type: Number, attribute: 'level' }) level: number = 0;
    @property({ attribute: 'status' }) status: string = '';

    get position(): ICollabServicePosition { return (this.getAttribute('toolbarposition') as ICollabServicePosition) || 'left'; }

    public actualServices?: ICollabServiceData;
    public containerItens?: HTMLElement;

    @state() private _services: ICollabService3[] = [];
    @state() private _controllersVisible: boolean = false;
    @state() private _scrollLeft: boolean = false;
    @state() private _scrollRight: boolean = false;

    private _badgesState: Record<string, boolean> = {};
    private _alreadyLoadedServices: boolean = false;
    private _onlyFirstTime: Record<string, boolean> = { left: false, right: false };

    public state_: ICollabState = {
        0: { left: '', right: '' }, 1: { left: '', right: '' }, 2: { left: '', right: '' }, 3: { left: '', right: '' },
        4: { left: '', right: '' }, 5: { left: '', right: '' }, 6: { left: '', right: '' }, 7: { left: '', right: '' },
    };

    private msg: MessageType = messages['en'];

    private readonly _staticService = [SERVICE_START_WIDGET];

    public layout() { this._verifyControllers(); }

    public toogleBadge(show: boolean, path: string, saveState = true) {
        if (saveState) this._badgesState[path] = show;
        const item = this.querySelector(`collab-nav-2-item[data-service="${path}"]`) as HTMLElement;
        if (item) item.classList.toggle('notification', show);
    }

    public async getUserServices(): Promise<ICollabServiceData> {
        const s = await this._getUserServices();
        return JSON.parse(JSON.stringify(s));
    }

    public async addService(service: ICollabService3, level: number, position: ICollabServicePosition) {
        if (!this.actualServices) this.actualServices = await this._getUserServices();
        const already = this.actualServices[level][position].find(s => s.widget === service.widget);
        if (already) throw new Error(`Service ${service.widget} already added`);
        this.actualServices[level][position].push(service);
        this._refreshOppositeNav2(this.actualServices);
        if (this.level === level) { this._services = [...this.actualServices[level][this.position]]; }
    }

    public async removeService(index: number, level: number, position: ICollabServicePosition) {
        if (!this.actualServices) this.actualServices = await this._getUserServices();
        const exists = this.actualServices[level][position][index];
        if (!exists) throw new Error(`Service index ${index} does not exist`);
        this.actualServices[level][position].splice(index, 1);
        this._refreshOppositeNav2(this.actualServices);
        if (this.level === level) { this._services = [...this.actualServices[level][this.position]]; }
    }

    public async moveService(fromIndex: number, toIndex: number, level: number, position: ICollabServicePosition) {
        if (!this.actualServices) this.actualServices = await this._getUserServices();
        const from = this.actualServices[level][position][fromIndex];
        if (!from) throw new Error(`Service from index ${fromIndex} does not exist`);
        const to = this.actualServices[level][position][toIndex];
        if (!to) throw new Error(`Service to index ${toIndex} does not exist`);
        if (fromIndex === toIndex) return;
        this.actualServices[level][position].splice(fromIndex, 1);
        this.actualServices[level][position].splice(toIndex, 0, from);
        this._refreshOppositeNav2(this.actualServices);
        if (this.level === level) { this._services = [...this.actualServices[level][this.position]]; }
    }

    public async updateClassName(index: number, newClass: ICollabServiceClass | undefined, level: number, position: ICollabServicePosition) {
        if (!this.actualServices) this.actualServices = await this._getUserServices();
        const exists = this.actualServices[level][position][index];
        if (!exists) throw new Error(`Service index ${index} does not exist`);
        if (!newClass) delete exists.classname;
        else exists.classname = newClass;
        this._refreshOppositeNav2(this.actualServices);
        if (this.level === level) { this._services = [...this.actualServices[level][this.position]]; }
    }

    firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        this.actualServices = this._staticServices;
        this._services = (this.actualServices[this.level]?.[this.position]) || [];
        this._setEvents();
    }

    async updated(changed: Map<string, unknown>) {
        if (changed.has('level')) {
            await this._renderServiceByLevel();
            await this.updateComplete;
            this._onStatusChanged();
        }
        if (changed.has('status') && this.status === 'start') this._onStatusChanged();
        if (changed.has('status') && this.status === 'enabled') {
            await this._renderAfterEnabled();
            await this.updateComplete;
            this._onStatusChanged();
        }
        this._setShortCuts();
        this._verifyControllers();
    }

    render() {
        this.msg = messages[this.getMessageKey(messages)] || messages['en'];
        return html`
            <div class="collab-nav-2-container">
                <div class="controller left ${classMap({ visible: this._controllersVisible, disabled: !this._scrollLeft })}"
                     @click=${() => this._onControllerClick('left')}>
                    <i class="fa fa-chevron-left"></i>
                </div>
                <div class="collab-nav-2-items" @scroll=${() => this._checkControllersOnScroll()}>
                    ${repeat(this._services, s => s.widget, s => this._renderItem(s))}
                </div>
                <div class="controller right ${classMap({ visible: this._controllersVisible, disabled: !this._scrollRight })}"
                     @click=${() => this._onControllerClick('right')}>
                    <i class="fa fa-chevron-right"></i>
                </div>
            </div>
        `;
    }

    private _renderItem(item: ICollabService3) {
        return html`
            <collab-nav-2-item
                data-service="${item.widget}"
                data-tooltip="${item.tooltip}"
                isstatic="${item.isStatic}"
                visible="${item.visible}"
                class=${classMap({
            notification: !!this._badgesState[item.widget],
            [item.classname || '']: !!item.classname,
            enabled: false,
            disabled: false,
        })}
                style="${item.visible ? '' : 'display:none'}"
                @click=${() => this._onItemClick(item)}>
                <i class="fa">${unsafeHTML(item.icon)}</i>
                <span>${item.tooltip}</span>
            </collab-nav-2-item>
        `;
    }

    private _setEvents() {
        this.containerItens = this.querySelector('.collab-nav-2-items') as HTMLElement;
        window.addEventListener('resize', () => this._verifyControllers());
        if (this.containerItens) this.containerItens.onscroll = () => this._checkControllersOnScroll();
    }

    private _onItemClick(item: ICollabService3) {
        this.state_[this.level][this.position] = item.widget;
        const el = this.querySelector(`collab-nav-2-item[data-service="${item.widget}"]`) as HTMLElement;
        if (el) this._selectItem(el, item.widget);
    }

    private _selectItem(el: HTMLElement, service: string) {
        const lastSelected = this.querySelector('collab-nav-2-item.selected')?.getAttribute('data-service');
        this.querySelectorAll('collab-nav-2-item').forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
        this._verifyControllers();
        this._fireToolbarSelected(service, lastSelected || '');
        this._fireSelectedChangeNav3(service);
        if (mls?.setActualService) mls.setActualService(service);
        if (mls?.setActualPosition) mls.setActualPosition(this.position);
    }

    private _fireToolbarSelected(to: string, from: string) {
        const params = { level: this.level, position: this.position, from, to };
        mls?.events?.fire([this.level as mls.Level], ['ToolBarSelected'], JSON.stringify(params));
    }

    private _fireSelectedChangeNav3(service: string, nav2?: HTMLElement) {
        const nav3 = nav2 ? nav2.nextElementSibling : this.nextElementSibling;
        if (nav3) {
            nav3.setAttribute('level', String(this.level));
            nav3.setAttribute('data-service', service);
        }
    }

    private _onControllerClick(dir: 'left' | 'right') {
        const items = this.querySelector('.collab-nav-2-items') as HTMLElement;
        if (!items) return;
        items.scrollLeft += dir === 'left' ? -80 : 80;
        this._verifyControllers();
    }

    private _verifyControllers() {
        const items = this.querySelector('.collab-nav-2-items') as HTMLElement;
        if (!items) return;
        const { scrollWidth, clientWidth } = items;
        if (clientWidth < 40) { this._controllersVisible = false; return; }
        const eff = this._controllersVisible ? clientWidth + 20 : clientWidth;
        this._controllersVisible = scrollWidth > eff;
        this._checkControllersOnScroll();
    }

    private _checkControllersOnScroll() {
        const items = this.querySelector('.collab-nav-2-items') as HTMLElement;
        if (!items) return;
        this._scrollLeft = items.scrollLeft > 0;
        this._scrollRight = items.clientWidth + items.scrollLeft < items.scrollWidth;
    }

    private _setShortCuts() {
        const items = this.querySelectorAll('collab-nav-2-item:not([visible=false])');
        items.forEach((item: any, index) => {
            const original = item['tooltip'] || item.getAttribute('data-tooltip') || '';
            if (index > 9) { item.setAttribute('data-tooltip', original); return; }
            const newIndex = index === 9 ? 0 : index + 1;
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const shortcut = this.position === 'left'
                ? (isMac ? `⌃+⌥+${newIndex}` : `Ctrl+Alt+${newIndex}`)
                : (isMac ? `⌥+⇧+${newIndex}` : `Alt+Shift+${newIndex}`);
            item.setAttribute('data-tooltip', `${original} (${shortcut})`);
        });
    }

    private async _renderServiceByLevel() {
        if (!this.actualServices) this.actualServices = await this._getUserServices();
        const reasons = this._getReasons();
        const services = this.actualServices[this.level]?.[this.position] || [];
        this._services = [...services];
    }

    private async _renderAfterEnabled() {
        this.actualServices = await this._getUserServices();
        this._setInitialServicesAfterEnabled();
        this._services = [...(this.actualServices[this.level]?.[this.position] || [])];
        await this.updateComplete;
        this._activeLastServiceClicked();
    }

    private _onStatusChanged() {
        const page = document.querySelector('collab-page');
        const nav3 = page?.querySelector(`collab-nav-3[toolbarposition="${this.position}"]`);
        if (nav3) nav3.setAttribute('status', this.status);

        this.querySelectorAll('collab-nav-2-item').forEach((item: any, index) => {
            const isStatic = item.getAttribute('isstatic') === 'true';
            item.classList.remove('enabled', 'disabled');
            if (this.status === 'start' && isStatic && index === 0) {
                item.classList.add('enabled');
                const last = this.state_[this.level][this.position];
                const lastEl = this.querySelector(`collab-nav-2-item[data-service="${last}"]`);
                const isLastStatic = lastEl?.getAttribute('isstatic') === 'true';
                if (!last || isLastStatic) (item as HTMLElement).click();
            } else if (this.status === 'start') {
                item.classList.add('disabled');
            } else if (this.status !== 'null') {
                item.classList.add(this.status);
            }
        });
    }

    private _setInitialServicesAfterEnabled() {
        if (this._onlyFirstTime[this.position]) return;
        const START = SERVICE_START_WIDGET;
        const s: ICollabState = { ...this.state_, 7: { left: '', right: '' } };
        for (const key in this.actualServices) {
            const _key = Number.parseInt(key)
            const svc = this.actualServices[_key];
            if (key === '7') s[key].left = START;
            else if (s[_key].left === '' || s[_key].left === START) s[_key].left = svc.left[1]?.widget || START;
            if (s[_key].right === '') s[_key].right = svc.right[0]?.widget;
        }
        this._onlyFirstTime[this.position] = true;
        this.state_ = s;
    }

    private _activeLastServiceClicked() {
        const last = this.state_[this.level][this.position];
        if (!last) { this._fireSelectedChangeNav3(last); return; }
        const el = this.querySelector(`collab-nav-2-item[data-service="${last}"]`) as HTMLElement;
        const isStaticSelected = el?.getAttribute('isstatic') === 'true' && el?.classList.contains('selected');
        if (el && !isStaticSelected) this._selectItem(el, last);
    }

    private async _getUserServices(): Promise<ICollabServiceData> {
        const nav1 = this.closest('collab-page')?.querySelector('collab-nav-1') as any;
        if (!nav1?.actualServices) return {};
        return nav1.actualServices;
    }

    private _getReasons() {
        const nav1 = this.closest('collab-page')?.querySelector('collab-nav-1') as any;
        return nav1?.reasons || {};
    }

    private _refreshOppositeNav2(services: ICollabServiceData) {
        const op: ICollabServicePosition = this.position === 'left' ? 'right' : 'left';
        const other = document.querySelector(`collab-nav-2[toolbarposition="${op}"]`) as CollabNav2;
        if (other) other.actualServices = services;
    }

    private _staticServices: ICollabServiceData = {
        0: { left: [{ widget: SERVICE_START_WIDGET, state: 'foreground', icon: '&#xf059', tooltip: this.msg.start, isStatic: true, visible: true }], right: [] },
        1: { left: [{ widget: SERVICE_START_WIDGET, state: 'foreground', icon: '&#xf059', tooltip: this.msg.start, isStatic: true, visible: true }], right: [] },
        2: { left: [{ widget: SERVICE_START_WIDGET, state: 'foreground', icon: '&#xf059', tooltip: this.msg.start, isStatic: true, visible: true }], right: [] },
        3: { left: [{ widget: SERVICE_START_WIDGET, state: 'foreground', icon: '&#xf059', tooltip: this.msg.start, isStatic: true, visible: true }], right: [] },
        4: { left: [{ widget: SERVICE_START_WIDGET, state: 'foreground', icon: '&#xf059', tooltip: this.msg.start, isStatic: true, visible: true }], right: [] },
        5: { left: [{ widget: SERVICE_START_WIDGET, state: 'foreground', icon: '&#xf059', tooltip: this.msg.start, isStatic: true, visible: true }], right: [] },
        6: { left: [{ widget: SERVICE_START_WIDGET, state: 'foreground', icon: '&#xf059', tooltip: this.msg.start, isStatic: true, visible: true }], right: [] },
        7: { left: [{ widget: SERVICE_START_WIDGET, state: 'foreground', icon: '&#xf059', tooltip: this.msg.start, isStatic: true, visible: true }], right: [] },
    };
}

window.addEventListener('mls:ready', () => customElements.define('collab-nav-2', CollabNav2), { once: true });
