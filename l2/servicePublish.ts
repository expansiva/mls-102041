/// <mls fileReference="_102041_/l2/servicePublish.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

import { html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ServiceBase, IService, IToolbarContent, IServiceMenu } from '/_102027_/l2/serviceBase.js';
import { getConfigProject } from '/_102027_/l2/libProjectConfig.js';
import { buildIndex } from '/_102041_/l2/buildProject.js';

/// **collab_i18n_start**
const message_en = {
    title: 'Publish',
    tabPublish: 'Publish',
    tabConfig: 'Config',
    selectLanguages: 'Select languages to publish',
    noLanguages: 'No languages configured in this project.',
    loadingLanguages: 'Loading languages...',
    selectAll: 'All',
    clearAll: 'Clear',
    provider: 'Provider',
    amazonS3: 'Amazon S3',
    bucket: 'Bucket',
    region: 'Region',
    accessKeyId: 'Access Key ID',
    secretKey: 'Secret Key',
    endpoint: 'Custom Endpoint (optional)',
    saveConfig: 'Save',
    configSaved: 'Saved!',
    publish: 'Publish',
    publishing: 'Publishing...',
    noLanguagesSelected: 'Select at least one language.',
    missingConfig: 'Fill in all required S3 fields.',
    progress: 'Progress',
    buildingIndex: 'Building index',
    uploading: 'Uploading',
    done: '✓ Done',
    errorPrefix: '✗ Error',
    publishComplete: 'Publish complete',
    version: 'Version',
    copyPrevAssets: 'Copy assets from last publication',
    lookingLastVersion: 'Looking for last published version...',
    foundLastVersion: 'Found last version',
    noLastVersion: 'No previous publication found, skipping assets.',
    copyingAssets: 'Copying assets',
    assetsCopied: 'assets copied',
    updatingLatestJson: 'Updating latest.json',
    latestJsonUpdated: 'latest.json updated',
    uploadingRoot: 'Uploading root',
};
type MessageType = typeof message_en;
const message_pt: MessageType = {
    title: 'Publicar',
    tabPublish: 'Publicar',
    tabConfig: 'Config',
    selectLanguages: 'Selecionar idiomas para publicar',
    noLanguages: 'Nenhum idioma configurado neste projeto.',
    loadingLanguages: 'Carregando idiomas...',
    selectAll: 'Todos',
    clearAll: 'Limpar',
    provider: 'Provedor',
    amazonS3: 'Amazon S3',
    bucket: 'Bucket',
    region: 'Região',
    accessKeyId: 'Access Key ID',
    secretKey: 'Secret Key',
    endpoint: 'Endpoint personalizado (opcional)',
    saveConfig: 'Salvar',
    configSaved: 'Salvo!',
    publish: 'Publicar',
    publishing: 'Publicando...',
    noLanguagesSelected: 'Selecione pelo menos um idioma.',
    missingConfig: 'Preencha todos os campos obrigatórios do S3.',
    progress: 'Progresso',
    buildingIndex: 'Gerando index',
    uploading: 'Enviando',
    done: '✓ Concluído',
    errorPrefix: '✗ Erro',
    publishComplete: 'Publicação concluída',
    version: 'Versão',
    copyPrevAssets: 'Copiar assets da publicação anterior',
    lookingLastVersion: 'Buscando última versão publicada...',
    foundLastVersion: 'Última versão encontrada',
    noLastVersion: 'Nenhuma publicação anterior encontrada, pulando assets.',
    copyingAssets: 'Copiando assets',
    assetsCopied: 'assets copiados',
    updatingLatestJson: 'Atualizando latest.json',
    latestJsonUpdated: 'latest.json atualizado',
    uploadingRoot: 'Enviando raiz',
};
const messages: { [key: string]: MessageType } = { en: message_en, pt: message_pt };
/// **collab_i18n_end**

interface IS3Config {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretKey: string;
    endpoint: string;
}

interface IPublishLog {
    message: string;
    type: 'info' | 'success' | 'error';
}

interface ILatest {
    www: string;
    [key: string]: string;
}

const LS_KEY = 'service_publish_s3_config';
const CDN_BASE = 'https://cdn.collab.codes';

@customElement('service-publish-102041')
export class ServicePublish102041 extends ServiceBase {

    public details: IService = {
        icon: '&#xf093',
        state: 'foreground',
        position: 'right',
        tooltip: 'Publish',
        visible: true,
        widget: '_102041_servicePublish',
        level: [5],
    };

    public menu: IServiceMenu = {
        title: 'Publish',
        main: {},
        tools: {},
        tabs: {
            group: 'View',
            type: 'full',
            selected: 0,
            options: [
                { text: 'Publish', icon: 'f093' },
                { text: 'Config', icon: 'f013' },
            ],
        },
        onClickTabs: (index: number) => { this._activeTab = index; },
        onClickMain: (_op: string) => { if (this.menu.setMode) this.menu.setMode('initial'); },
    };

    // ─── reactive state ────────────────────────────────────────────────────────
    @state() private _msg: MessageType = messages['en'];
    @state() private _activeTab: number = 0;
    @state() private _loadingLangs: boolean = false;
    @state() private _languages: string[] = [];
    @state() private _selected: string[] = [];
    @state() private _s3Config: IS3Config = this._loadS3Config();
    @state() private _configSaved: boolean = false;
    @state() private _publishing: boolean = false;
    @state() private _logs: IPublishLog[] = [];
    @state() private _lastVersion: string = '';
    @state() private _copyAssets: boolean = false;

    private _themeObserver: MutationObserver | undefined;

    // ─── lifecycle ─────────────────────────────────────────────────────────────
    connectedCallback() {
        super.connectedCallback();
        this._syncDarkClass();
        this._themeObserver = new MutationObserver(() => this._syncDarkClass());
        this._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._themeObserver?.disconnect();
    }

    onServiceClick(visible: boolean, _reinit: boolean, _el: IToolbarContent | null) {
        if (!visible) return;
        this._msg = messages[this.getMessageKey(messages)] || messages['en'];
        if (this._languages.length === 0) this._loadLanguages();
    }

    private _syncDarkClass() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
    }

    render() {
        this._msg = messages[this.getMessageKey(messages)] || messages['en'];
        return html`
            <div class="flex flex-col gap-4 p-4 h-full overflow-auto text-sm text-gray-800 dark:text-gray-100">
                ${this._activeTab === 0 ? this._renderPublishTab() : this._renderConfigTab()}
            </div>
        `;
    }

    // ─── publish tab ───────────────────────────────────────────────────────────
    private _renderPublishTab() {
        const m = this._msg;
        const sectionTitle = 'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1';
        return html`
            <!-- Languages -->
            <div class="flex flex-col gap-2">
                <p class=${sectionTitle}>${m.selectLanguages}</p>

                ${this._loadingLangs ? html`
                    <p class="text-gray-400 dark:text-gray-500 text-xs italic py-2">${m.loadingLanguages}</p>
                ` : this._languages.length === 0 ? html`
                    <p class="text-gray-400 dark:text-gray-500 text-xs italic py-2">${m.noLanguages}</p>
                ` : html`
                    <div class="flex gap-2 mb-1">
                        <button class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded cursor-pointer transition-colors"
                            @click=${() => { this._selected = [...this._languages]; }}>
                            ${m.selectAll}
                        </button>
                        <button class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded cursor-pointer transition-colors"
                            @click=${() => { this._selected = []; }}>
                            ${m.clearAll}
                        </button>
                    </div>
                    <div class="flex flex-col gap-0.5">
                        ${this._languages.map(lang => html`
                            <label class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                                <input type="checkbox"
                                    class="accent-blue-600 w-4 h-4"
                                    .checked=${this._selected.includes(lang)}
                                    @change=${(e: Event) => this._toggleLang(lang, (e.target as HTMLInputElement).checked)}>
                                <span class="font-mono text-gray-700 dark:text-gray-200">${lang}</span>
                            </label>
                        `)}
                    </div>
                `}
            </div>

            <!-- Copy assets option -->
            <label class="flex items-center gap-2.5 px-2 py-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <input type="checkbox"
                    class="accent-blue-600 w-4 h-4 shrink-0"
                    .checked=${this._copyAssets}
                    @change=${(e: Event) => { this._copyAssets = (e.target as HTMLInputElement).checked; }}>
                <span class="text-gray-700 dark:text-gray-200 text-xs leading-snug">${this._msg.copyPrevAssets}</span>
            </label>

            <!-- Publish action -->
            <div>
                <button
                    class="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    ?disabled=${this._publishing || this._loadingLangs || this._selected.length === 0}
                    @click=${this._publish}>
                    ${this._publishing
                ? html`<span class="inline-flex items-center justify-center gap-2">
                            <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            ${m.publishing}
                          </span>`
                : m.publish}
                </button>
            </div>

            <!-- Progress log -->
            ${this._logs.length > 0 ? html`
                <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">${m.progress}</p>
                        ${this._lastVersion ? html`
                            <span class="text-xs font-mono bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded">
                                ${m.version}: ${this._lastVersion}
                            </span>
                        ` : nothing}
                    </div>
                    <div class="bg-gray-950 dark:bg-black rounded-lg p-3 max-h-52 overflow-y-auto font-mono text-xs flex flex-col gap-0.5 border border-gray-800">
                        ${this._logs.map(log => html`
                            <div class=${log.type === 'success' ? 'text-green-400'
                        : log.type === 'error' ? 'text-red-400'
                            : 'text-gray-300'}>
                                ${log.message}
                            </div>
                        `)}
                    </div>
                </div>
            ` : nothing}
        `;
    }

    // ─── config tab ────────────────────────────────────────────────────────────
    private _renderConfigTab() {
        const m = this._msg;
        const c = this._s3Config;
        const sectionTitle = 'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 pb-1';
        const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500 transition-colors';
        const labelCls = 'text-xs font-medium text-gray-600 dark:text-gray-300';
        const fieldCls = 'flex flex-col gap-1';
        return html`
            <!-- Provider -->
            <div class="flex flex-col gap-2">
                <p class=${sectionTitle}>${m.provider}</p>
                <div class=${fieldCls}>
                    <label class=${labelCls}>${m.provider}</label>
                    <select disabled class="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed">
                        <option>${m.amazonS3}</option>
                    </select>
                </div>
            </div>

            <!-- S3 fields -->
            <div class="flex flex-col gap-3">
                <p class=${sectionTitle}>${m.amazonS3}</p>

                <div class=${fieldCls}>
                    <label class=${labelCls}>${m.bucket} <span class="text-red-500 dark:text-red-400">*</span></label>
                    <input type="text" class=${inputCls} .value=${c.bucket} placeholder="my-bucket"
                        @input=${(e: InputEvent) => this._patchConfig('bucket', (e.target as HTMLInputElement).value)}>
                </div>

                <div class=${fieldCls}>
                    <label class=${labelCls}>${m.region} <span class="text-red-500 dark:text-red-400">*</span></label>
                    <input type="text" class=${inputCls} .value=${c.region} placeholder="us-east-1"
                        @input=${(e: InputEvent) => this._patchConfig('region', (e.target as HTMLInputElement).value)}>
                </div>

                <div class=${fieldCls}>
                    <label class=${labelCls}>${m.accessKeyId} <span class="text-red-500 dark:text-red-400">*</span></label>
                    <input type="text" class=${inputCls} .value=${c.accessKeyId} placeholder="AKIA..."
                        @input=${(e: InputEvent) => this._patchConfig('accessKeyId', (e.target as HTMLInputElement).value)}>
                </div>

                <div class=${fieldCls}>
                    <label class=${labelCls}>${m.secretKey} <span class="text-red-500 dark:text-red-400">*</span></label>
                    <input type="password" class=${inputCls} .value=${c.secretKey} placeholder="••••••••"
                        @input=${(e: InputEvent) => this._patchConfig('secretKey', (e.target as HTMLInputElement).value)}>
                </div>

                <div class=${fieldCls}>
                    <label class=${labelCls}>${m.endpoint}</label>
                    <input type="text" class=${inputCls} .value=${c.endpoint} placeholder="https://s3.example.com"
                        @input=${(e: InputEvent) => this._patchConfig('endpoint', (e.target as HTMLInputElement).value)}>
                </div>

                <button
                    class="w-full px-4 py-2 font-medium rounded transition-colors ${this._configSaved
                ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'}"
                    @click=${this._saveConfig}>
                    ${this._configSaved ? m.configSaved : m.saveConfig}
                </button>
            </div>
        `;
    }

    // ─── language helpers ──────────────────────────────────────────────────────
    private async _loadLanguages() {
        this._loadingLangs = true;
        try {
            const projectId = mls.actualProject;
            if (!projectId) { this._loadingLangs = false; return; }
            const config = await getConfigProject(projectId);
            this._languages = config?.languages?.map((i) => i.language as string) ?? [];
        } catch {
            this._languages = [];
        }
        this._loadingLangs = false;
    }

    private _toggleLang(lang: string, checked: boolean) {
        this._selected = checked
            ? [...this._selected.filter(l => l !== lang), lang]
            : this._selected.filter(l => l !== lang);
    }

    // ─── config helpers ────────────────────────────────────────────────────────
    private _loadS3Config(): IS3Config {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) return { bucket: '', region: '', accessKeyId: '', secretKey: '', endpoint: '', ...JSON.parse(raw) };
        } catch { /* */ }
        return { bucket: '', region: '', accessKeyId: '', secretKey: '', endpoint: '' };
    }

    private _patchConfig(key: keyof IS3Config, value: string) {
        this._s3Config = { ...this._s3Config, [key]: value };
        this._configSaved = false;
    }

    private _saveConfig = () => {
        localStorage.setItem(LS_KEY, JSON.stringify(this._s3Config));
        this._configSaved = true;
        setTimeout(() => { this._configSaved = false; }, 2000);
    };

    private _validateConfig(): boolean {
        const c = this._s3Config;
        return !!(c.bucket && c.region && c.accessKeyId && c.secretKey);
    }

    // ─── publish ───────────────────────────────────────────────────────────────
    private _publish = async () => {
        const m = this._msg;
        if (this._selected.length === 0) { this._addLog(m.noLanguagesSelected, 'error'); return; }
        if (!this._validateConfig()) { this._addLog(m.missingConfig, 'error'); return; }

        this._publishing = true;
        this._logs = [];

        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const version = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        this._lastVersion = version;

        // ── optional: find last version for asset copy ──────────────────────────
        let lastVersion: string | null = null;
        if (this._copyAssets) {
            this._addLog(m.lookingLastVersion, 'info');
            try {
                lastVersion = await this._findLastVersion();
                if (lastVersion) this._addLog(`${m.foundLastVersion}: ${lastVersion}`, 'info');
                else this._addLog(m.noLastVersion, 'info');
            } catch (err: any) {
                this._addLog(`${m.errorPrefix}: ${err?.message ?? String(err)}`, 'error');
            }
        }

        // ── publish each language ────────────────────────────────────────────────
        for (const lang of this._selected) {
            try {
                this._addLog(`${m.buildingIndex}: ${lang}...`, 'info');
                let indexHtml = await buildIndex(lang);

                const baseHref = `${CDN_BASE}/www/${version}/${lang}/`;
                indexHtml = indexHtml.replace(
                    /<base\s+href="[^"]*"\s*\/?>/i,
                    `<base href="${baseHref}">`
                );

                const s3Key = `www/${version}/${lang}/index.html`;
                this._addLog(`${m.uploading}: ${s3Key}`, 'info');
                await this._uploadToS3(s3Key, indexHtml);

                if (lang === this._selected[0]) {
                    this._addLog(`${m.uploadingRoot}: index.html`, 'info');
                    await this._uploadToS3('index.html', indexHtml);
                }

                this._addLog(`${m.done} — ${lang}`, 'success');

                // ── copy assets from previous publication ────────────────────────
                if (this._copyAssets && lastVersion && lastVersion !== version) {
                    await this._copyAssetsForLang(lastVersion, version, lang);
                }
            } catch (err: any) {
                this._addLog(`${m.errorPrefix} [${lang}]: ${err?.message ?? String(err)}`, 'error');
            }
        }

        try {
            await this._updateLatestJson(version);
        } catch (err: any) {
            this._addLog(`${m.errorPrefix} [latest.json]: ${err?.message ?? String(err)}`, 'error');
        }

        this._addLog(m.publishComplete, 'success');
        this._publishing = false;
    };

    private _addLog(message: string, type: IPublishLog['type']) {
        this._logs = [...this._logs, { message, type }];
    }

    // ─── assets copy ───────────────────────────────────────────────────────────

    /** Lists top-level datetime folders under www/ and returns the latest one. */
    private async _findLastVersion(): Promise<string | null> {
        const prefixes = await this._s3ListPrefixes('www/');
        const versions = prefixes
            .map(p => p.replace('www/', '').replace(/\/$/, ''))
            .filter(v => /^\d{14}$/.test(v))
            .sort()
            .reverse();
        return versions[0] ?? null;
    }

    /** Copies the entire l3/ folder from lastVersion to newVersion for one language. */
    private async _copyAssetsForLang(lastVersion: string, newVersion: string, lang: string): Promise<void> {
        const m = this._msg;
        const srcPrefix = `www/${lastVersion}/${lang}/l3/`;
        const keys = await this._s3ListKeys(srcPrefix);
        this._addLog(`  ${m.copyingAssets} ${lang}/l3/: ${keys.length} ${m.assetsCopied}`, 'info');
        for (const srcKey of keys) {
            const dstKey = `www/${newVersion}/${lang}/l3/${srcKey.slice(srcPrefix.length)}`;
            await this._s3CopyObject(srcKey, dstKey);
        }
    }

    /** ListObjectsV2 with delimiter — returns CommonPrefixes (i.e. sub-folders). */
    private async _s3ListPrefixes(prefix: string): Promise<string[]> {
        const xml = await this._s3GetXml({ 'list-type': '2', prefix, delimiter: '/' });
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        return Array.from(doc.querySelectorAll('CommonPrefixes > Prefix'))
            .map(el => el.textContent ?? '').filter(Boolean);
    }

    /** ListObjectsV2 without delimiter — returns all object keys under prefix, paginated. */
    private async _s3ListKeys(prefix: string): Promise<string[]> {
        const keys: string[] = [];
        let token = '';
        do {
            const params: Record<string, string> = { 'list-type': '2', prefix };
            if (token) params['continuation-token'] = token;
            const xml = await this._s3GetXml(params);
            const doc = new DOMParser().parseFromString(xml, 'application/xml');
            Array.from(doc.querySelectorAll('Contents > Key'))
                .forEach(el => { if (el.textContent) keys.push(el.textContent); });
            token = doc.querySelector('NextContinuationToken')?.textContent ?? '';
        } while (token);
        return keys;
    }

    /** S3 server-side CopyObject — no data transfer through the browser. */
    private async _s3CopyObject(srcKey: string, dstKey: string): Promise<void> {
        const cfg = this._s3Config;
        const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        const enc = new TextEncoder();
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
        const amzDate = `${dateStamp}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

        const { host, url, canonicalUri } = this._s3Addr(dstKey);
        const copySource = encodeURIComponent(`/${cfg.bucket}/${srcKey}`);
        const canonicalHeaders =
            `host:${host}\n` +
            `x-amz-content-sha256:${EMPTY_HASH}\n` +
            `x-amz-copy-source:${copySource}\n` +
            `x-amz-date:${amzDate}\n`;
        const signedHeaders = 'host;x-amz-content-sha256;x-amz-copy-source;x-amz-date';
        const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${EMPTY_HASH}`;

        const credScope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
        const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credScope}\n${await this._sha256Hex(canonicalRequest)}`;
        const sigKey = await this._getSignatureKey(cfg.secretKey, dateStamp, cfg.region, 's3');
        const sig = this._toHex(await this._hmacSHA256(sigKey, enc.encode(stringToSign).buffer as ArrayBuffer));
        const auth = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;

        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'x-amz-content-sha256': EMPTY_HASH,
                'x-amz-copy-source': copySource,
                'x-amz-date': amzDate,
                'Authorization': auth,
            },
        });
        if (!res.ok) throw new Error(`CopyObject failed ${res.status}: ${await res.text().catch(() => res.statusText)}`);
    }

    /** S3 GET request (ListObjectsV2) — returns raw XML. */
    private async _s3GetXml(queryParams: Record<string, string>): Promise<string> {
        const cfg = this._s3Config;
        const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        const enc = new TextEncoder();
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
        const amzDate = `${dateStamp}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

        const canonicalQS = Object.entries(queryParams)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
        const { host, url, canonicalUri } = this._s3ListAddr(canonicalQS);

        const canonicalHeaders =
            `host:${host}\n` +
            `x-amz-content-sha256:${EMPTY_HASH}\n` +
            `x-amz-date:${amzDate}\n`;
        const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
        const canonicalRequest = `GET\n${canonicalUri}\n${canonicalQS}\n${canonicalHeaders}\n${signedHeaders}\n${EMPTY_HASH}`;

        const credScope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
        const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credScope}\n${await this._sha256Hex(canonicalRequest)}`;
        const sigKey = await this._getSignatureKey(cfg.secretKey, dateStamp, cfg.region, 's3');
        const sig = this._toHex(await this._hmacSHA256(sigKey, enc.encode(stringToSign).buffer as ArrayBuffer));
        const auth = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'x-amz-content-sha256': EMPTY_HASH,
                'x-amz-date': amzDate,
                'Authorization': auth,
            },
        });
        if (!res.ok) throw new Error(`ListObjects failed ${res.status}: ${await res.text().catch(() => res.statusText)}`);
        return res.text();
    }

    // ─── latest.json ───────────────────────────────────────────────────────────
    private async _updateLatestJson(version: string): Promise<void> {
        const m = this._msg;
        this._addLog(m.updatingLatestJson, 'info');
        const raw = await this._s3GetObject('latest.json');
        let latest: ILatest;
        if (raw) {
            try { latest = JSON.parse(raw); } catch { latest = { www: '' }; }
            latest.www = version;
        } else {
            latest = { www: version };
        }
        await this._uploadToS3('latest.json', JSON.stringify(latest), 'application/json');
        this._addLog(m.latestJsonUpdated, 'success');
    }

    /** S3 GET for a specific key — returns text content or null if not found. */
    private async _s3GetObject(s3Key: string): Promise<string | null> {
        const cfg = this._s3Config;
        const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        const enc = new TextEncoder();
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
        const amzDate = `${dateStamp}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

        const { host, url, canonicalUri } = this._s3Addr(s3Key);
        const canonicalHeaders =
            `host:${host}\n` +
            `x-amz-content-sha256:${EMPTY_HASH}\n` +
            `x-amz-date:${amzDate}\n`;
        const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
        const canonicalRequest = `GET\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${EMPTY_HASH}`;

        const credScope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
        const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credScope}\n${await this._sha256Hex(canonicalRequest)}`;
        const sigKey = await this._getSignatureKey(cfg.secretKey, dateStamp, cfg.region, 's3');
        const sig = this._toHex(await this._hmacSHA256(sigKey, enc.encode(stringToSign).buffer as ArrayBuffer));
        const auth = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'x-amz-content-sha256': EMPTY_HASH,
                'x-amz-date': amzDate,
                'Authorization': auth,
            },
        });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`GetObject failed ${res.status}: ${await res.text().catch(() => res.statusText)}`);
        return res.text();
    }

    // ─── S3 upload (AWS Signature V4) ──────────────────────────────────────────
    private async _uploadToS3(s3Key: string, content: string, contentType = 'text/html; charset=utf-8'): Promise<void> {
        const cfg = this._s3Config;
        const enc = new TextEncoder();

        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
        const amzDate = `${dateStamp}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

        const { host, url, canonicalUri } = this._s3Addr(s3Key);
        const payloadHash = await this._sha256Hex(content);

        const canonicalHeaders =
            `content-type:${contentType}\n` +
            `host:${host}\n` +
            `x-amz-content-sha256:${payloadHash}\n` +
            `x-amz-date:${amzDate}\n`;
        const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
        const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

        const credentialScope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
        const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await this._sha256Hex(canonicalRequest)}`;

        const signingKey = await this._getSignatureKey(cfg.secretKey, dateStamp, cfg.region, 's3');
        const signature = this._toHex(await this._hmacSHA256(signingKey, enc.encode(stringToSign).buffer as ArrayBuffer));
        const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
                'x-amz-content-sha256': payloadHash,
                'x-amz-date': amzDate,
                'Authorization': authorization,
            },
            body: content,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => response.statusText);
            throw new Error(`HTTP ${response.status}: ${text}`);
        }
    }

    // ─── S3 address helper ─────────────────────────────────────────────────────
    /** Returns host, object URL and canonical URI for a given key.
     *  Uses path-style when bucket contains dots (wildcard cert incompatible). */
    private _s3Addr(key: string): { host: string; url: string; canonicalUri: string } {
        const cfg = this._s3Config;
        const encodedKey = key.split('/').map(encodeURIComponent).join('/');
        if (cfg.endpoint) {
            const host = new URL(cfg.endpoint).host;
            return { host, url: `${cfg.endpoint.replace(/\/$/, '')}/${cfg.bucket}/${key}`, canonicalUri: `/${encodedKey}` };
        }
        if (cfg.bucket.includes('.')) {
            const host = `s3.${cfg.region}.amazonaws.com`;
            return { host, url: `https://${host}/${cfg.bucket}/${key}`, canonicalUri: `/${cfg.bucket}/${encodedKey}` };
        }
        const host = `${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
        return { host, url: `https://${host}/${key}`, canonicalUri: `/${encodedKey}` };
    }

    /** Returns host, list URL and canonical URI for ListObjectsV2. */
    private _s3ListAddr(canonicalQS: string): { host: string; url: string; canonicalUri: string } {
        const cfg = this._s3Config;
        if (cfg.endpoint) {
            const host = new URL(cfg.endpoint).host;
            return { host, url: `${cfg.endpoint.replace(/\/$/, '')}/${cfg.bucket}/?${canonicalQS}`, canonicalUri: '/' };
        }
        if (cfg.bucket.includes('.')) {
            const host = `s3.${cfg.region}.amazonaws.com`;
            return { host, url: `https://${host}/${cfg.bucket}/?${canonicalQS}`, canonicalUri: `/${cfg.bucket}/` };
        }
        const host = `${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
        return { host, url: `https://${host}/?${canonicalQS}`, canonicalUri: '/' };
    }

    // ─── crypto helpers ────────────────────────────────────────────────────────
    private async _hmacSHA256(key: ArrayBuffer, data: ArrayBuffer): Promise<ArrayBuffer> {
        const cryptoKey = await (crypto.subtle.importKey as any)(
            'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        return (crypto.subtle.sign as any)('HMAC', cryptoKey, data);
    }

    private async _getSignatureKey(secret: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
        const enc = new TextEncoder();
        const buf = (s: string) => enc.encode(s).buffer as ArrayBuffer;
        const kDate = await this._hmacSHA256(buf(`AWS4${secret}`), buf(date));
        const kRegion = await this._hmacSHA256(kDate, buf(region));
        const kService = await this._hmacSHA256(kRegion, buf(service));
        return this._hmacSHA256(kService, buf('aws4_request'));
    }

    private async _sha256Hex(data: string): Promise<string> {
        const buf = new TextEncoder().encode(data).buffer as ArrayBuffer;
        const hash = await (crypto.subtle.digest as any)('SHA-256', buf);
        return this._toHex(hash);
    }

    private _toHex(buf: ArrayBuffer): string {
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
}
