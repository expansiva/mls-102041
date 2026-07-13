/// <mls fileReference="_102041_/l2/buildProject.ts" enhancement="_blank"/>

import { getPath } from '/_102027_/l2/utils.js';
import { convertFileToTag, resolveTagToFile } from '/_102041_/l2/utils.js';
import { getGlobalCss } from '/_102027_/l2/designSystemBase.js'

export function buildIndex(language: string) {
    const index = mls.stor.files['102041_2_index.html'];
    if (!index) throw new Error('No find index page');
    return buildLandingPageByStor(index, language)
}

export async function buildLandingPageByStor(stor: mls.stor.IFileInfo, language: string, theme: string = 'Default') {
    const contentHTML = await stor.getContent() as string;
    let json = await getDependenciesByHtmlFile(stor, contentHTML);
    const js = await buildJs(json, stor);
    const html = prepareHTMLFinal(contentHTML, js, json.globalCss)
    return html;
}

async function prepareHTMLFinal(
    contentHTML: string,
    js: string,
    globalCss: string
): Promise<string> {

    const parser = new DOMParser();

    const doc = parser.parseFromString(
        contentHTML,
        'text/html'
    );

    let head = doc.head;

    if (!head) {
        head = doc.createElement('head');
        doc.documentElement.prepend(head);
    }

    if (globalCss?.trim()) {
        const style = doc.createElement('style');
        style.id = 'build-global-css';
        style.textContent = globalCss;
        head.appendChild(style);
    }

    let body = doc.body;

    if (!body) {
        body = doc.createElement('body');
        doc.documentElement.appendChild(body);
    }

    const script = doc.createElement('script');
    script.type = 'module';
    script.textContent = js;
    body.appendChild(script);

    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;

}

async function buildJs(json: any, stor: mls.stor.IFileInfo) {

    await loadEsbuild();

    const allImports = [
        ...new Set(
            json.importsJs.filter((i: string) => i.startsWith('/'))
        )
    ];

    const externalModules = new Set<string>();

    json.importsMap.forEach((item: string) => {

        const match = item.match(/"([^"]+)":\s*"([^"]+)"/);

        if (!match) return;

        externalModules.add(match[1]);

    });

    const virtualFsPlugin = {
        name: 'virtual-fs',
        setup(build: any) {

            build.onResolve({ filter: /.*/ }, (args: any) => {

                // módulos externos vindos do importMap
                if (
                    externalModules.has(args.path) ||
                    [...externalModules].some(
                        m => args.path.startsWith(m + '/')
                    )
                ) {

                    return {
                        path: args.path,
                        external: true
                    };

                }

                // urls externas
                if (
                    args.path.startsWith('http://') ||
                    args.path.startsWith('https://')
                ) {

                    return {
                        path: args.path,
                        external: true
                    };

                }

                if (
                    (
                        args.path.startsWith('/') ||
                        args.path.startsWith('./') ||
                        args.path.startsWith('../')
                    ) &&
                    !args.importer.startsWith('https://')
                ) {

                    const url = new URL(
                        args.path,
                        'file:' + args.importer
                    );

                    let path = url.pathname;

                    if (!(/_(\d+)_/.test(path))) {

                        const info = getPath(
                            args.importer
                                .replace('/l2/', '')
                                .replace('/', '')
                        );

                        if (!info) {

                            throw new Error(
                                '[virtualFsPlugin] Not found path:' +
                                args.importer
                                    .replace('/l2/', '')
                                    .replace('/', '')
                            );

                        }

                        if (!info.project) {
                            info.project = mls.actualProject as number;
                        }

                        if (
                            path.indexOf(`_${info.project}_`) < 0
                        ) {

                            path = url.pathname.replace(
                                '/',
                                `/_${info.project}_`
                            );

                        }

                    }

                    return {
                        path,
                        namespace: 'virtual'
                    };

                }

                return null;

            });

            build.onLoad(
                {
                    filter: /.*/,
                    namespace: 'virtual'
                },
                async (args: any) => {

                    try {

                        const res = await fetch(args.path);

                        if (!res.ok) {

                            throw new Error(
                                `Error get ${args.path}`
                            );

                        }

                        const text = await res.text();

                        return {
                            contents: text,
                            loader: 'js'
                        };

                    } catch (e: any) {

                        console.info('erro:' + args.path);

                        return {
                            contents: '',
                            loader: 'js',
                            warnings: [
                                {
                                    text: e.message,
                                    notes: [
                                        {
                                            text: 'build-error'
                                        }
                                    ]
                                }
                            ]
                        };

                    }

                }
            );

        }
    };

    const virtualEntryPath = 'virtual-entry.js';

    const globalCss = json.globalCss || '';

    const virtualEntryContent = `

(() => {

    const style = document.createElement('style');
    style.setAttribute('data-build-css', 'global');
    style.textContent = ${JSON.stringify(globalCss)};
    document.head.appendChild(style);

})();

${allImports
            .map(path => `import "${path}";`)
            .join('\n')}

`;

    const result = await esbuild.build({
        stdin: {
            contents: virtualEntryContent,
            resolveDir: '/',
            sourcefile: virtualEntryPath,
            loader: 'js'
        },
        bundle: true,
        minify: false,
        format: 'esm',
        sourcemap: false,
        write: false,
        treeShaking: true,
        plugins: [virtualFsPlugin]
    });

    return result.outputFiles[0].text;

}

async function getDependenciesByHtmlFile(file: mls.stor.IFileInfo, html: string) {
    const { project, shortName, folder } = file;

    const myImportsMap: string[] = [];
    const myImports: string[] = [];
    const myLinks: { ref: string, rel: string }[] = [];
    const myErrors: { tag: string, error: string }[] = [];

    const myModules = {};
    let tags = extractTagsCustom(html);

    const tag = convertFileToTag({ project, shortName, folder });
    if (!tags.includes(tag)) tags.push(tag);

    await loadMyNeedsToCompile(
        tags,
        myImportsMap,
        myImports,
        myLinks,
        myErrors,
        myModules,
    );

    let globalCss: string | undefined = await getGlobalCss(project, 'Default');

    return {
        importsMap: myImportsMap,
        importsJs: Array.from(new Set(myImports)),
        importsLinks: Array.from(
            new Map(myLinks.map(item => [item.ref, item])).values()
        ),
        globalCss,
        tokens: '',
        errors: myErrors
    }
}

function extractTagsCustom(html: string): string[] {

    const container = document.createElement('div');
    container.innerHTML = html;

    const customTags: Set<string> = new Set();
    const allElements = container.querySelectorAll('*');

    allElements.forEach(element => {
        const tagName = element.tagName.toLowerCase();
        const isCustomTag = tagName.includes('-');
        const isInCodeBlock = element.closest('code') !== null;
        if (
            isCustomTag &&
            !isInCodeBlock
        ) {
            customTags.add(tagName);
        }
    });

    return Array.from(customTags);
}

async function loadMyNeedsToCompile(
    tags: string[],
    myImportsMap: string[],
    myImports: string[],
    myLinks: { ref: string, rel: string }[],
    myErrors: { tag: string, error: string }[],
    myModules: any,
) {

    try {
        if (tags.length <= 0) return;
        const info = resolveTagToFile(tags[0]);
        if (!info) return;
        const lv = mls.actualLevel === 1 ? 1 : 2;
        const key = mls.stor.getKeyToFiles(info.project, lv, info.shortName, info.folder, '.ts');
        const f = mls.stor.files[key];
        const { project, shortName, folder } = info;
        if (!project || !shortName) return;

        const ipath = { project, shortName: shortName, folder: f ? f.folder : folder } as mls.stor.IFileInfoBase;
        const enhacementName = await getEnhancementFromFetch(ipath);
        if (!enhacementName) throw new Error('enhacementName not valid');
        if (enhacementName === '_blank') {
            await getJSBlank(myImports, ipath);
            return;
        }

        if (!myModules[enhacementName]) {

            const info = getPath(enhacementName);
            if (!info) throw new Error('[] Not found path:' + enhacementName);
            const mModule = await mls.l2.enhancement.getEnhancementModule(info);

            myModules[enhacementName] = {
                jsMap: false,
                mModule
            };

        }

        await getJSImporMap(myImportsMap, enhacementName, myModules);
        await getJSImportEnhancement(myImports, enhacementName, myModules);
        await getJS(myImports, enhacementName, ipath, myModules);
        await getLinks(myLinks, enhacementName, ipath, myModules);


    } catch (e: any) {

        if (tags.length <= 0) return;
        myErrors.push({ tag: tags[0], error: e.message })

    } finally {

        tags.shift();
        if (tags.length > 0) {
            await loadMyNeedsToCompile(
                tags,
                myImportsMap,
                myImports,
                myLinks,
                myErrors,
                myModules,
            );
        }

    }

}

async function getEnhancementFromFetch(file: { project: number, shortName: string, folder: string }) {

    const url = getImportUrl(file as mls.stor.IFileInfoBase);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const txt = await response.text();
    const lines = txt.replace(/\r\n/g, '\n').split('\n');
    const mlsLine = lines.find(line => line.trim().startsWith('/// <mls '));;

    if (!mlsLine) {
        throw new Error(`Not found tag 'mls' in ${url}`);
    }

    const enhancementMatch = mlsLine.match(/enhancement="([^"]+)"/);
    if (!enhancementMatch) {
        throw new Error('Not found attr "enhancement" in ' + url);
    }

    return enhancementMatch[1];

}

function getImportUrl(info: mls.stor.IFileInfoBase): string {
    let url = `/_${info.project}_/l2/${info.shortName}`;
    if (info.folder) {
        url = `/_${info.project}_/l2/${info.folder}/${info.shortName}`
    }
    return url;
}

async function getJSImportEnhancement(myImports: string[], enhacementName: string, myModules: any) {

    if (!myModules[enhacementName]) throw new Error('Enhacement not found ');
    const mmodule = myModules[enhacementName].mModule as mls.l2.enhancement.IEnhancementInstance;

    if (!mmodule || !mmodule.requires) return;
    const aRequire = mmodule.requires;

    aRequire.forEach((i) => {
        if (i.type !== 'import') return;
        myImports.push(i.ref);
    });

}
async function getJSImporMap(myImportsMap: string[], enhacementName: string, myModules: any) {

    if (!myModules[enhacementName]) throw new Error('Enhacement not found ');

    if (myModules[enhacementName].jsMap) return;
    myModules[enhacementName].jsMap = true;
    const mmodule = myModules[enhacementName].mModule as mls.l2.enhancement.IEnhancementInstance;

    if (!mmodule || !mmodule.requires) return;
    const aRequire = mmodule.requires;

    aRequire.forEach((i) => {
        if (i.type !== 'cdn') return;
        myImportsMap.push(`"${i.name}": "${i.ref}"`);
    });

}

async function getJSBlank(myImports: string[], mfile: mls.stor.IFileInfoBase) {
    let key = getImportUrl(mfile);
    if (myImports.includes(key)) return;
    myImports.push(key);
}

async function getJS(myImports: string[], enhacementName: string, mfile: mls.stor.IFileInfoBase, myModules: any) {
    if (!myModules[enhacementName]) throw new Error('Enhacement not found ');
    let key = getImportUrl(mfile);
    if (myImports.includes(key)) return;
    myImports.push(key);
}

async function getLinks(myLinks: { ref: string, rel: string }[], enhacementName: string, mfile: mls.stor.IFileInfoBase, myModules: any) {
    if (!myModules[enhacementName]) throw new Error('Enhacement not found ');

    const mmodule = myModules[enhacementName].mModule as mls.l2.enhancement.IEnhancementInstance;
    if (!mmodule || !mmodule.requires) return;
    const aRequire = mmodule.requires;

    aRequire.forEach((i: any) => {
        if (i.type !== 'link') return;
        myLinks.push({ rel: i.args, ref: i.ref });
    });
}


var esbuild: any;
async function loadEsbuild() {

    if ((mls as any).esbuild) {
        esbuild = (mls as any).esbuild;
    } else if (!(mls as any).esbuildInLoad) await initializeEsBuild();

}

async function initializeEsBuild() {

    (mls as any).esbuildInLoad = true;
    const url = 'https://unpkg.com/esbuild-wasm@0.14.54/esm/browser.min.js';
    if (!esbuild) {
        esbuild = await import(url);
        await esbuild.initialize({
            wasmURL: "https://unpkg.com/esbuild-wasm@0.14.54/esbuild.wasm"
        });
        (mls as any).esbuild = esbuild;
        (mls as any).esbuildInLoad = false

    }

}

interface ILanguage {
    language: string,
    name: string,
    path: string
}
