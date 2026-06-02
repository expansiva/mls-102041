/// <mls fileReference="_102041_/l2/pluginCollabCoreIndex.ts" enhancement="_blank"/>

import { PluginBaseIndex } from '/_102027_/l2/pluginBaseIndex.js';

export class PluginCollabCoreIndex extends PluginBaseIndex {
    public getMenus(): mls.plugin.MenuAction[] {

        return [
            {
                category: 'Services',
                scope: ['l5ServicesLeft'],
                priority: 5,
                auth: ['*'],
                widget: '_102041_servicePublish'
            }
        ]
    }

    public getHooks(): mls.plugin.HookAction[] {
        return [];
    }

    public getServices(): mls.plugin.ServiceAction[] {
        return [];
    }

}

export default new PluginCollabCoreIndex();
