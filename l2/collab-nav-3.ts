/// <mls fileReference="_102041_/l2/collab-nav-3.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

/// **collab_i18n_start**
const message_en = {
    loading: 'Loading...',
};
type MessageType = typeof message_en;
const message_pt: MessageType = {
    loading: 'Carregando...',
};
const messages: { [key: string]: MessageType } = { en: message_en, pt: message_pt };
/// **collab_i18n_end**

import { nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

type ICollabServiceState2 = 'foreground' | 'background';
type ICollabServicePosition2 = 'left' | 'right';

interface ICollabServiceNav3 { widget: string; state: ICollabServiceState2; icon: string; tooltip: string; visible: boolean; tags?: string[]; isStatic: boolean; }
interface ICollabServiceKeys { [key: number]: { left: ICollabServiceNav3[]; right: ICollabServiceNav3[]; }; }
interface INav3State { left: Record<string, HTMLElement | any>; right: Record<string, HTMLElement | any>; }

@customElement('collab-nav-3')
export class CollabNav3 extends StateLitElement {

    @property({ attribute: 'data-service' }) dataService: string = '';
    @property({ attribute: 'level' }) level: string = '';
    @property({ attribute: 'status' }) status: string = '';
    @property({ attribute: 'msize' }) msize: string = '';
    @property({ attribute: 'loading' }) loading: string = '';
    @property({ attribute: 'error' }) error: string = '';
    @property({ attribute: 'loadingfeedback' }) loadingfeedback: string = '';

    get position(): ICollabServicePosition2 { return (this.getAttribute('toolbarposition') as ICollabServicePosition2) || 'left'; }

    get actualServices(): ICollabServiceKeys {
        const nav2 = this.previousElementSibling as any;
        return nav2?.actualServices || {};
    }

    private msg: MessageType = messages['en'];

    public args?: Record<string, string>;

    public getActiveInstance(position: 'left' | 'right') {
        const page = this.closest('collab-page');
        if (!page) return undefined;
        const nav3 = page.querySelector(`collab-nav-3[toolbarposition="${position}"`) as CollabNav3;
        if (!nav3) return undefined;
        const serviceAttr = nav3.getAttribute('data-service');
        if (!serviceAttr) return undefined;
        return nav3._state[position][serviceAttr];
    }

    public layout() { this._layout(this.getAttribute('msize')); }

    public async instanceServicesIfNeed(services: string[]) {
        for (const service of services) {
            const [serv, level] = service.split(';');
            if (!this._state[this.position][serv]) {
                const content = this._renderContainer(serv);
                await this._instanceService(serv, content, false, +level);
            }
        }
    }

    private _state: INav3State = { left: {}, right: {} };
    private _lastLevel: number | undefined;
    private _alreadyDefined: boolean = false;
    private _loadings: Record<string, HTMLElement> = {};
    private _errors: Record<string, HTMLElement> = {};

    render() { return nothing; }

    firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        this.msg = messages[this.getMessageKey(messages)] || messages['en'];
        Promise.all(['collab-nav-2'].map(wc => customElements.whenDefined(wc))).then(() => {
            if (this.previousElementSibling) this._alreadyDefined = true;
        });
    }

    updated(changed: Map<string, unknown>) {
        if (changed.has('msize')) {
            this._layout(this.msize);
        }
        if (changed.has('level')) {
            const oldLevel = changed.get('level') as string;
            if (oldLevel !== this.level) this._onLevelChange(+(oldLevel || '0'));
        }
        if (changed.has('status') && this.status === 'enabled') {
            this._init();
        }
        if (changed.has('loading')) {
            if (this.loading === 'true') this._showLoading();
            else if (this.loading === 'false') this._hideLoading();
        }
        if (changed.has('loadingfeedback')) {
            this._changeLoadingMessage(this.loadingfeedback);
        }
        if (changed.has('error')) {
            if (this.error === '') this._hideError();
            else if (this.error) this._showError(this.error);
        }
        if (changed.has('dataService')) {
            const oldService = changed.get('dataService') as string;
            if (this.dataService === oldService && +this.level === this._lastLevel) {
                this._showServiceOnlyArgs(this.dataService);
            } else {
                this._lastLevel = +this.level;
                if (this._alreadyDefined) { this._showService(this.dataService); return; }
                Promise.all(['collab-nav-2'].map(wc => customElements.whenDefined(wc))).then(() => this._showService(this.dataService));
            }
        }
    }

    private _init() {
        if (!this.actualServices) return;
        Object.keys(this.actualServices).forEach(level => {
            if (level !== this.level) return;
            const services: ICollabServiceNav3[] = this.actualServices[+level][this.position];
            services.forEach(service => {
                if (!service) return;
                if (this._state[this.position][service.widget]) return;
                if (service.state === 'background') {
                    const content = this._renderContainer(service.widget);
                    this._instanceService(service.widget, content, false);
                }
            });
        });
    }

    private _showServiceOnlyArgs(service: string) {
        const container = this.querySelector(`collab-nav-3-service[data-service="${service}"]`);
        if (!container) return;
        const el = this._state[this.position][service];
        if (!el) return;
        if (this.args && el instanceof HTMLElement) {
            Object.entries(this.args).forEach(([k, v]) => el.setAttribute(k, v));
            this.args = undefined;
        }
    }

    private async _showService(service: string) {
        this._hideAll();
        if (!service) { this._setAllVisibleFalse(service); return; }
        if (!this._state[this.position][service]) {
            const content = this._renderContainer(service);
            await this._instanceService(service, content, false);
        }
        const container = this.querySelector(`collab-nav-3-service[data-service="${service}"]`) as HTMLElement;
        if (!container) return;
        const el = this._state[this.position][service];
        if (!el) throw new Error(`Instance don't exist on position: ${this.position} service: ${service}`);
        this._setAllVisibleFalse(service);
        if (el instanceof HTMLElement) {
            el.setAttribute('level', this.level);
            el.setAttribute('visible', 'true');
            if (this.args) {
                Object.entries(this.args).forEach(([k, v]) => el.setAttribute(k, v));
                this.args = undefined;
            }
        } else {
            (el as any).level = +this.level;
            (el as any).onServiceClick({});
        }
        container.style.display = 'block';
        container.classList.add('active');
        this.layout();
    }

    private _setAllVisibleFalse(exception: string) {
        Object.keys(this._state[this.position]).forEach(item => {
            if (item === exception) return;
            const el = this._state[this.position][item];
            if (el instanceof HTMLElement && el.getAttribute('visible') !== 'false') el.setAttribute('visible', 'false');
        });
    }

    private _hideAll() {
        (Array.from(this.querySelectorAll('collab-nav-3-service')) as HTMLElement[]).forEach(item => {
            item.style.display = 'none';
            item.classList.remove('active');
        });
    }

    private _renderContainer(service: string): HTMLElement {
        const div = document.createElement('collab-nav-3-service');
        div.setAttribute('data-service', service);
        div.style.display = 'none';
        (div as any)['layout'] = () => this.layout();
        this.appendChild(div);
        return div;
    }

    private async _instanceService(service: string, content: HTMLElement, exec: boolean, level?: number) {
        if (this._isCollabService(service)) await this._instanceCollabService(service, content, exec, level);
        else this._instanceMlsService(service, content, exec, level);
    }

    private async _instanceCollabService(service: string, content: HTMLElement, exec: boolean, level?: number) {

        mls?.actual?.[0]?.setFullName(service);
        const { project, path } = mls?.actual?.[0] || {};
        const tagService = this._convertFileNameToTag(service);
        const script = document.createElement('script');
        script.type = 'module'; script.async = true;
        script.src = `/_${project}_/l2/${path}.js`;
        content.innerHTML = '';
        content.appendChild(script);
        const serviceWc = document.createElement(tagService);
        this._state[this.position][service] = serviceWc;
        if (mls?.setServices) mls.setServices(`${service.substring(1)}_${this.position}`, serviceWc);

        const promises = this._checkTagsAndInstanciate(service);
        const promise: Promise<void> = new Promise((resolve, reject) => {
            script.onload = () => {
                serviceWc.setAttribute('level', level ? String(level) : this.level);
                serviceWc.setAttribute('position', this.position);
                content.appendChild(serviceWc);
                this._createToolbarService(content, serviceWc);
                if (exec && !(serviceWc.getAttribute('visible') === 'true')) serviceWc.setAttribute('visible', String(exec));
                resolve();
            };
            script.onerror = () => {
                this._createToolbarService(content);
                const key = mls?.stor?.getKeyToFiles(project || 0, 2, path || '', '', '.ts');
                const err = `File: ${key} don't exist`;
                reject(new Error(err));
            };
        });
        promises.push(promise);
        await Promise.all(promises);
    }

    private _createToolbarService(content: HTMLElement, instance?: HTMLElement) {
        if (instance) (content as any)['mlsWidget'] = instance;
        let menu: HTMLElement;
        if ((instance as any)?.['menu'] && 'main' in (instance as any)['menu']) {
            if ((instance as any)['menu'].enabled === false) return;
            menu = document.createElement('collab-nav-3-menu');
        } else menu = document.createElement('mls-nav3-100529');
        menu.setAttribute('is-mls2', 'true');
        menu.setAttribute('toolbarposition', this.position);
        if (instance) content.insertBefore(menu, instance);
        else content.appendChild(menu);
    }

    private _instanceMlsService(service: string, content: HTMLElement, exec: boolean, level?: number) {
        const isStatic = this._isStatic(service);
        const l2 = (window as any).l2_html;
        const l4 = (window as any).l4_html;
        const ClassDef = isStatic ? l4?.[service] : l2?.[service];
        if (ClassDef) {
            const instance = new ClassDef(content, level || parseInt(this.level, 10), this.position);
            this._state[this.position][service] = instance;
            if (mls?.setServices) mls.setServices(`${service}_${this.position}`, instance);
            if (exec) instance.onServiceClick?.({});
        }
    }

    private _checkTagsAndInstanciate(service: string): Promise<void>[] {
        const serviceInfo = this.actualServices[+this.level]?.[this.position]?.find((i: ICollabServiceNav3) => i.widget === service);
        if (!serviceInfo?.tags?.length) return [];
        const promises: Promise<void>[] = [];
        Object.keys(this.actualServices[+this.level]).forEach(pos => {
            (this.actualServices as Record<number, any>)[+this.level][pos].forEach((s: ICollabServiceNav3) => {
                for (const tag of serviceInfo.tags || []) {
                    if (s.tags?.includes(tag)) {
                        promises.push(this._instancieTagService(pos, s));
                        break;
                    }
                }
            });
        });
        return promises;
    }

    private async _instancieTagService(pos: string, service: ICollabServiceNav3): Promise<void> {
        const nav3 = document.querySelector(`collab-nav-3[toolbarposition="${pos}"]`) as CollabNav3;
        if (!nav3) return;
        if (!nav3._state[nav3.position][service.widget]) {
            const content = nav3._renderContainer(service.widget);
            await nav3._instanceService(service.widget, content, false);
        }
    }

    private _isStatic(serviceName: string): boolean {
        for (const level of Object.keys(this.actualServices)) {
            for (const s of (this.actualServices[+level]?.[this.position] || [])) {
                if (s.widget === serviceName) return s.isStatic;
            }
        }
        return false;
    }

    private _isCollabService(service: string) { return !service.startsWith('_100529_'); }

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

    private _onLevelChange(lastLevel: number) {
        this._hideAll();
        this._lastLevel = lastLevel;
        if (this.status === 'enabled') this._init();
    }

    private _layout(value: string | undefined | null) {
        if (!value) return;
        const activeService = this.querySelector(`collab-nav-3-service[data-service="${this.getAttribute('data-service')}"]`) as HTMLElement;
        if (!activeService) return;
        const isMls = activeService.getAttribute('ismls') === 'true';
        if (isMls) { this._layoutMls1(value, activeService); return; }
        const [width, height, top, left] = value.split(',');
        if (!width || !height || !top || !left) return;
        const children = Array.from(activeService.children);
        let menu = activeService.querySelector('mls-nav3-100529') || activeService.querySelector('collab-nav-3-menu');
        const mHeightMenu = +(menu?.getAttribute('mheight') || '0');
        const newHeight = +height - mHeightMenu;
        const newTop = +top + mHeightMenu;
        const msize = [width, newHeight.toFixed(2), newTop.toFixed(2), left].join(',');
        const msizeMenu = [width, mHeightMenu, newTop.toFixed(2), left].join(',');
        let service: Element | undefined | null = children.find(c => c.tagName.startsWith('SERVICE-'));
        const isServiceStart = activeService.querySelector('div[data-service="_102041_serviceStart"]') as HTMLElement;
        if (isServiceStart) {
            isServiceStart.style.height = newHeight.toFixed(2) + 'px';
            service = activeService.querySelector('[data-service]');
        }
        if (!service) return;
        service.setAttribute('msize', msize);
        if (menu) { menu.setAttribute('msize', msizeMenu); menu.setAttribute('msize-height', newHeight.toFixed(2)); }
    }

    private _layoutMls1(value: string, activeService: HTMLElement) {
        const [width, height, top, left] = value.split(',');
        if (!width || !height || !top || !left) return;
        this.style.height = height + 'px';
        let mHeigth: string;
        Array.from(activeService.children).forEach(el => {
            const element = el as HTMLElement;
            if (!element.tagName.toLowerCase().startsWith('mls-')) return;
            let newHeight: string = '';
            if (mHeigth) newHeight = (parseFloat(height) - parseFloat(mHeigth)).toString();
            const isVisible = element.style.display !== 'none';
            const elMHeight = isVisible ? element.getAttribute('mheight') : '0';
            const myMHeigth = elMHeight || newHeight;
            const myMTop = elMHeight ? top : (parseFloat(mHeigth || '0') + parseFloat(top)).toString();
            element.setAttribute('msize', `${width},${myMHeigth},${myMTop},${left}`);
            mHeigth = mHeigth ? (parseFloat(mHeigth) + parseFloat(myMHeigth)).toString() : myMHeigth;
        });
    }

    override setAttribute(name: string, value: string) {
        if (name === 'loading' && value === this.getAttribute(name)) {
            if (value === 'false') this._hideLoading();
            else if (value === 'true') this._showLoading();
            return;
        }
        super.setAttribute(name, value);
    }

    private _showLoading() {
        const container = this._getBindService();
        if (!container) return;
        const ds = container.getAttribute('data-service');
        if (!ds) return;
        if (this._loadings[ds]) this._loadings[ds].remove();
        this._loadings[ds] = document.createElement('collab-loading');
        this._loadings[ds].classList.add('toolbar-loading');
        container.appendChild(this._loadings[ds]);
    }

    private _hideLoading() {
        const container = this._getBindService();
        if (!container) return;
        const ds = container.getAttribute('data-service');
        if (!ds) return;
        if (this._loadings[ds]) this._loadings[ds].remove();
        this.removeAttribute('loadingfeedback');
    }

    private _changeLoadingMessage(msg: string) {
        const container = this._getBindService();
        if (!container) return;
        const ds = container.getAttribute('data-service');
        if (!ds) return;

        const span = this._loadings[ds]?.querySelector('span');
        if (span) span.innerHTML = msg || this.msg.loading;
    }

    private _showError(error: string) {
        const container = this._getBindService();
        if (!container) return;
        const ds = container.getAttribute('data-service');
        if (!ds) return;

        if (this._errors[ds]) this._errors[ds].remove();
        this._errors[ds] = document.createElement('div');
        this._errors[ds].classList.add('toolbar-error');
        const text = document.createElement('span');
        text.innerHTML = error;
        const icon = document.createElement('i');
        icon.className = 'fa fa-times';
        icon.onclick = () => this._hideError();
        this._errors[ds].appendChild(text);
        this._errors[ds].appendChild(icon);
        container.appendChild(this._errors[ds]);
    }

    private _hideError() {
        const container = this._getBindService();
        if (!container) return;
        const ds = container.getAttribute('data-service');
        if (!ds) return;
        if (this._errors[ds]) this._errors[ds].remove();
    }

    private _getBindService(): HTMLElement | null {
        const loadingService = (this as any)['serviceBind'];
        return this.querySelector(`collab-nav-3-service[data-service="${loadingService}"]`);
    }
}
