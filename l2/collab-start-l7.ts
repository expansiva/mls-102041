/// <mls fileReference="_102041_/l2/collab-start-l7.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';
import '/_102041_/l2/collab-ticker.js';

@customElement('collab-start-l7')
export class CollabStartL7 extends StateLitElement {


    @property({ attribute: 'language' }) language: string = '';
    @property({ attribute: 'mode' }) mode: string = '';
    @property({ attribute: 'msize' }) msize: string = '';

    @state() private _iframeVisible = false;

    get baseUrl() { return this.getAttribute('base'); }

    private get _msizeObj() {
        const rc = { width: 0, height: 0, top: 0, left: 0 };
        if (this.msize) {
            const [width, height, top, left] = this.msize.split(',');
            if (!width || !height || !top || !left) return rc;
            rc.height = Number.parseFloat(height);
            rc.width = Number.parseFloat(width);
            rc.top = Number.parseFloat(top);
            rc.left = Number.parseFloat(left);
        }
        return rc;
    }

    render() {
        return html`
            ${!this._iframeVisible ? html`
                <div id="placeholder" class="collab-codes-start">
                    <div>
                        <div class="section1">
                            <div class="slogan">
                                <div class="opt2">
                                    <div class="l7-icon-div">
                                        <img id="l7_icon"
                                            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSJ0cmFuc3BhcmVudCIgLz4KICA8dGV4dCB4PSIzMCIgeT0iNTYiIGZvbnQtZmFtaWx5PSJWZXJkYW5hIiBmb250LXNpemU9IjcyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzQyODVGNCI+QzwvdGV4dD4KICA8dGV4dCB4PSI0MCIgeT0iNDAiIGZvbnQtZmFtaWx5PSJWZXJkYW5hIiBmb250LXNpemU9IjM4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0VBNDMzNSI+YzwvdGV4dD4KPC9zdmc+Cg=="
                                            height="120" width="120" alt="Ícone Collab Codes">
                                    </div>
                                    <div class="ticker-content"">
                                        <h1>ollab.</h1>
                                        <collab-ticker text="<i>codes</i>" element="h1"></collab-ticker>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ` : nothing}
            <div id="iframe-container" style="display:${this._iframeVisible ? 'block' : 'none'}"></div>
        `;
    }

    firstUpdated(changedProperties: Map<PropertyKey, unknown>) {
        super.firstUpdated(changedProperties);
        this._setEvents();
        if (this.mode) this._loadIframe();
    }

    updated(changed: Map<string, unknown>) {
        super.updated(changed);
        if (changed.has('mode') && changed.get('mode') !== undefined) {
            this._loadIframe();
        }
        if (changed.has('msize') && changed.get('msize') !== undefined) {
            const iframe = this.querySelector('#iframe-container iframe') as HTMLIFrameElement;
            if (iframe) iframe.style.height = this._msizeObj.height + 'px';
        }
    }

    private async _loadIframe() {
        const params = new URLSearchParams(window.location.search);
        const spliter = document.querySelector('collab-spliter');

        if (this.mode === 'default' && params.has('signin')) {
            if (spliter) (spliter as any).setFullScreen(7, 'left');
        } else if (this.mode === 'anonymous') {
            this._setDetailsInitialPlugin('_100554_pluginCollabLogin');
            if (spliter) (spliter as any).setFullScreen(7, 'right');
        }

        const iframeContainer = this.querySelector('#iframe-container') as HTMLElement;
        if (!iframeContainer) return;

        const iframe = document.createElement('iframe');
        iframe.style.border = 'none';
        iframe.style.width = '100%';
        iframe.style.height = this._msizeObj.height + 'px';
        iframe.src = `https://www.collab.codes/landingpage.html`;
        iframe.onload = () => this._onIframeLoaded();

        iframeContainer.appendChild(iframe);
    }

    private _onIframeLoaded() {
        this._iframeVisible = true;
        const iframeContainer = this.querySelector('#iframe-container') as HTMLElement;
        if (iframeContainer) iframeContainer.classList.add('show');
    }

    private _setEvents() {
        window.addEventListener('message', (event) => {
            const { action, type } = event.data;
            if (type !== 'iframeL7') return;

            if (action === 'login') {
                const spliter = document.querySelector('collab-spliter');
                if (this.mode === 'anonymous') {
                    this._setDetailsInitialPlugin('_100554_pluginCollabLogin');
                    if (spliter) (spliter as any).setFullScreen(7, 'right');
                } else {
                    const options = { shortName: 'pluginCollabLogin', project: 100554, htmlText: '' };
                    mls.events.fire(mls.actualLevel as any, 'PluginDetails' as any, JSON.stringify(options), 0);
                    if (spliter) (spliter as any).setFullScreen(7, 'default');
                }
            }

            if (action === 'create-project') {
                const nav1 = document.querySelector('collab-page')?.querySelector('collab-nav-1') as any;
                if (nav1) nav1.openService('_100554_serviceExploreProjects', 'left', 6, { currentScenario: 'add' });
            }

            if (action === 'explore-projects') {
                const nav1 = document.querySelector('collab-page')?.querySelector('collab-nav-1') as any;
                if (nav1) nav1.openService('_100554_serviceExploreProjects', 'left', 6, { currentScenario: 'list' });
            }
        });
    }

    private _loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.type = 'module';
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    private async _setDetailsInitialPlugin(plugin: string) {
        await this._loadScript('/_100554_/l2/pluginCollabLogin.js');
        await Promise.all([
            customElements.whenDefined('collab-nav-2'),
            customElements.whenDefined('collab-nav-3'),
            customElements.whenDefined('plugin-collab-login-100554'),
        ]);
        const page = document.querySelector('collab-page');
        const nav3 = page?.querySelector('collab-nav-3[toolbarposition="right"]') as any;
        const pluginLogin = document.createElement('plugin-collab-login-100554');
        nav3.appendChild(pluginLogin);
    }
}
