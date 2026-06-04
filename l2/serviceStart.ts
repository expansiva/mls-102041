/// <mls fileReference="_102041_/l2/serviceStart.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

import { nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ServiceBase, IService, IServiceMenu, IToolbarContent } from '/_102027_/l2/serviceBase.js';

@customElement('service-start-102041')
export class ServiceStart extends ServiceBase {

    public details: IService = {
        icon: '&#xf059',
        state: 'foreground',
        tooltip: 'Start',
        visible: true,
        position: 'left',
        widget: '_102041_serviceStart',
        level: [0, 1, 2, 3, 4, 5, 6, 7],
    };

    public menu: IServiceMenu = {
        title: '',
        main: {
            opAbout: 'About',
        },
        tabs: undefined,
        tools: {},
        onClickMain: (op: string) => {
            if (op === 'opAbout') this._showAbout();
            else if (op === 'opConfig') this._showConfig();
            else if (this.menu.setMode) this.menu.setMode('initial');
        },
        onClickTabs: (index: number) => {
            if (ETabs[index] === 'icCollab') this._showStart();
        },
    };

    private _contentDiv: HTMLDivElement | undefined;
    private _lastLevel: number | undefined;
    private _config: HTMLElement | undefined;

    render() { return nothing; }

    onServiceClick(visible: boolean, _reinit: boolean, _el: IToolbarContent | null) {
        if (!visible) return;
        this._loadService();
    }

    attributeChangedCallback(name: string, oldVal: string, newVal: string) {
        if (name === 'msize' && this._contentDiv) {
            const l7Start = this._contentDiv.querySelector('collab-start-l7-100529');
            if (l7Start) l7Start.setAttribute('msize', newVal);
        }
        super.attributeChangedCallback(name, oldVal, newVal);
    }

    private _showStart() {
        return true;
    }

    private _showAbout(): boolean {
        const div1 = document.createElement('div');
        div1.innerHTML = '<h1>About this Service</h1>'
            + '<h2>Service Name: _100529_service_start</h2>'
            + '<hr>'
            + `<a href="https://multilevelstudio.com/#/l2/_100529_service_start" target="_blank"> Service Source: https://multilevelstudio.com/#/l2/_100529_service_start </a>`
            + `<p>Widget Source in mls2: _100554_mlsStartL${this.level} </p>`
            + '<hr>'
            + '<br>';
        if (this.menu.setMode) this.menu.setMode('page', div1);
        return true;
    }

    private _showConfig() {
        if (!this._config) {
            const scr = document.createElement('script');
            const i2 = `/_${'100554'}_${'collabConfigService'}`;
            scr.type = 'module';
            scr.id = i2.replace('/', '');
            scr.src = i2;

            this._config = document.createElement('div');
            this._config.appendChild(scr);
            const config = document.createElement('collab-config-service-100554');

            scr.onload = () => {
                this._config!.appendChild(config);
            };

            if (this.menu.setMode) this.menu.setMode('page', this._config);
            return true;
        }

        if (this.menu.setMode) this.menu.setMode('page', this._config);
        return true;
    }

    private readonly _listComponentsMLS2: Record<number, { tag: string; widget: string }> = {
        0: { tag: 'collab-start-l0-100554', widget: '_100554_collabStartL0' },
        1: { tag: 'collab-start-l1-100554', widget: '_100554_collabStartL1' },
        2: { tag: 'collab-start-l2-100554', widget: '_100554_collabStartL2' },
        3: { tag: 'collab-start-l3-100554', widget: '_100554_collabStartL3' },
        4: { tag: 'collab-start-l4-100554', widget: '_100554_collabStartL4' },
        5: { tag: 'collab-start-l5-100554', widget: '_100554_collabStartL5' },
        6: { tag: 'collab-start-l6-100554', widget: '_100554_collabStartL6' },
        7: { tag: 'collab-start-l7', widget: '_102041_collab-start-l7' },
    };

    private _loadService() {
        if (!this._contentDiv) {
            this._contentDiv = document.createElement('div');

            for (let i = 0; i <= 7; i++) {
                const divLevel = document.createElement('div');
                divLevel.setAttribute('start-level', i.toString());
                divLevel.style.display = 'none';
                this._contentDiv.appendChild(divLevel);
            }

            this._contentDiv.style.height = '100%';
            this._contentDiv.style.position = 'relative';
            this.appendChild(this._contentDiv);
            this._load();
        } else {
            this._load();
        }

        if (typeof (this as any)['layout'] === 'function') (this as any)['layout']();
    }

    private _load() {
        if (this.menu.tabs !== undefined) this.menu.tabs = undefined;
        if (this.menu.refresh) this.menu.refresh();
        if (this.menu.closeMenu) this.menu.closeMenu();
        if (this.menu.setTabActive) this.menu.setTabActive(ETabs.icCollab);

        if (this._lastLevel === this.level) return;
        this._lastLevel = this.level;

        const divLevel = this._contentDiv!.querySelector(`div[start-level="${this.level}"]`) as HTMLElement;
        if (!divLevel) return;
        divLevel.style.height = '100%';

        if (divLevel.childElementCount > 0) {
            const allDivs = this._contentDiv!.querySelectorAll(':scope>div');
            allDivs.forEach((item) => { (item as HTMLElement).style.display = 'none'; });
            divLevel.style.display = 'block';
            return;
        }

        this._contentDiv!.setAttribute('data-service', '_100529_service_start');
        this._contentDiv!.style.opacity = '0.1';
        this._contentDiv!.style.transition = '400ms';

        const allDivs = this._contentDiv!.querySelectorAll(':scope>div');
        allDivs.forEach((item) => { (item as HTMLElement).style.display = 'none'; });

        if (this.level !== 7) {
            const script = document.createElement('script');
            script.type = 'module';
            script.id = this._listComponentsMLS2[this.level].widget;
            script.src = `/${this._listComponentsMLS2[this.level].widget}`;
            divLevel.appendChild(script);

            script.onload = () => {
                const start = document.createElement(this._listComponentsMLS2[this.level].tag);
                divLevel.appendChild(start);
                divLevel.style.display = 'block';
                this._contentDiv!.style.opacity = '1';
            };

            script.onerror = () => {
                divLevel.innerHTML = `In development: ${this._listComponentsMLS2[this.level].widget}`;
                divLevel.style.display = 'block';
                this._contentDiv!.style.opacity = '1';
            };
        } else {
            const start = document.createElement(this._listComponentsMLS2[this.level].tag);
            divLevel.appendChild(start);
            divLevel.style.display = 'block';
            this._contentDiv!.style.opacity = '1';
            const spliter = document.querySelector('collab-spliter');
            if (spliter) (spliter as any).setFullScreen(7, 'left');
        }
    }
}

enum ETabs {
    icCollab = 0,
    icProduct = 1,
    icSolution = 2,
    icResources = 3,
}
