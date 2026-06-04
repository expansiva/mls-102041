/// <mls fileReference="_102041_/l2/index.ts" enhancement="_blank"/>

import '/_102041_/l2/collab-nav-3-menu.js';
import '/_102041_/l2/collab-nav-3-menu-tools-cycle.js';
import '/_102041_/l2/collab-nav-3-menu-tools-dropdown.js';
import '/_102041_/l2/collab-nav-3-menu-tools-link.js';
import '/_102041_/l2/collab-nav-3-menu-tools-tree-dropdown.js';
import '/_102041_/l2/collab-nav-3-menu-tools-cycle.js';
import '/_102041_/l2/collab-start-l7.js';
import '/_102041_/l2/serviceStart.js';

(() => {

    let versionLib: string;
    let versionMonaco: string;
    const version = '1.2';

    const loadMonaco = (): void => {
        if (!versionMonaco) throw new Error('No monaco version loaded');
        mls['baseMonaco'] = `../../../monaco/${versionMonaco}/vs/`;
        const l1 = document.createElement('link') as HTMLLinkElement;
        l1.rel = 'stylesheet';
        l1.type = 'text/css';
        l1.href = `${mls['baseMonaco']}../monaco.css`;
        document.head.append(l1);

        const l2 = document.createElement('script') as HTMLScriptElement;
        l2.src = `${mls['baseMonaco']}../monaco.js`;
        l2.async = true;
        document.head.append(l2);
    };

    const onMessage = (ev: MessageEvent): any => {
        if (ev.origin !== window.origin) return;
        if (ev.data?.func === 'loadMonaco') loadMonaco();
    };

    const initModoStart = () => {
        const collabNav1 = document.querySelector('collab-nav-1');
        if (!collabNav1) return;
        collabNav1.setAttribute('status', 'start');
    };

    const initModoL7AfterLogin = async (anonymous: boolean, baseProject: number) => {
        await customElements.whenDefined('collab-start-l7');
        const startL7 = document.querySelector('collab-start-l7');
        if (startL7) startL7.setAttribute('mode', anonymous ? 'anonymous' : 'default');
        if (anonymous) {
            const prjDetailsStr = localStorage.getItem('projectDetails');
            if (!prjDetailsStr) localStorage.setItem('projectDetails', JSON.stringify({ project: baseProject }));
        }
    };

    const configure = () => {
        (window as any).originalDefine = customElements.define.bind(customElements);
        customElements.define = (name, constructor, options) => {
            if (!customElements.get(name)) {
                return (window as any).originalDefine(name, constructor, options);
            }
        };
    };

    const afterLoadLibs = async () => {

        if (!window['mls']) return;
        const hasServiceWorkerInstalled = !!navigator.serviceWorker.controller;
        try {
            await mls.stor.cache.installIfNeeded();
        } catch (err: any) {
            console.info('error on install service worker');
        }
        const cookieLoginUser = mls.api.common.getCookie('loginUser');
        let isAnonymous: boolean = false;

        if (!cookieLoginUser || cookieLoginUser === 'anonymous') isAnonymous = true;
        // if (!hasServiceWorkerInstalled) window.location.reload();
        localStorage.setItem('collab_is_anonymous', isAnonymous.toString());
        initModoStart();
        configure();
        window.dispatchEvent(new CustomEvent('mls:ready'));

        const res: any = await mls.api.cbeLogin();
        if (!res) return;

        isAnonymous = false;
        const cookieLoginUserAfterLogin = mls.api.common.getCookie('loginUser');
        if (!cookieLoginUserAfterLogin || cookieLoginUserAfterLogin === 'anonymous') isAnonymous = true;
        initModoL7AfterLogin(isAnonymous, res.baseProject);

        if (res && res.msg === 'ok' && !isAnonymous) {
            const script = document.createElement('script');
            script.type = 'module';
            script.id = 'collabInit';
            script.src = '/_100554_/l2/collabInit.js';
            document.head.appendChild(script);

            script.onload = () => {
                const init = document.createElement('collab-init-100554');
                init.setAttribute('avatarUrl', res.avatar_url);
                init.setAttribute('isAnonymous', isAnonymous.toString());
                init.setAttribute('baseProject', res.baseProject);
                document.body.appendChild(init);
            };

        }

        // put message to load Monaco after print
        window.postMessage({ func: 'loadMonaco' }, window.origin);

    };

    const mlsLoadMain = 'mlsLoadMain';
    const loadMLS = (): void => {
        // load collab lib , ex: mls.xxx
        const loadMain = document.createElement('script') as HTMLScriptElement;
        loadMain.id = mlsLoadMain;
        loadMain.onload = () => { afterLoadLibs(); };
        const src = `../../../libs/${versionLib}/mls.js`;
        loadMain.src = src;
        document.head.append(loadMain);
    };

    const loadNodeJSLibs = async () => {
        // load less, handlebars, showdown and widgetBase.js
        const loadLib = document.createElement('script') as HTMLScriptElement;
        const src = `../../../libs/${versionLib}/mlsLib.min.js`;
        loadLib.src = src;
        loadLib.onload = () => { loadMLS(); };
        document.head.append(loadLib);
    };

    const startLoading = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        versionLib = window['latest'].libs;
        versionMonaco = window['latest'].monaco;
        if (!versionLib) throw new Error('No libs version loaded');
        (window as any).less = { env: 'production', logLevel: 1 };
        window.onmessage = onMessage;
        loadNodeJSLibs();
    };
    startLoading();
})()




