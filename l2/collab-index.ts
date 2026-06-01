/// <mls fileReference="_102041_/l2/collab-index.ts" enhancement="_102020_/l2/enhancementAura.ts"/>

import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

import './collab-tooltip';
import './collab-sticky-notification';
import './collab-page';
import './collab-spliter';
import './collab-spliter-item';
import './collab-nav-1';
import './collab-nav-2';
import './collab-nav-3';
import './collab-nav-3-menu';
import './collab-nav-3-menu-tools-link';
import './collab-nav-3-menu-tools-cycle';
import './collab-nav-3-menu-tools-dropdown';
import './collab-nav-3-menu-tools-tree-dropdown';

@customElement('collab-index')
export class CollabIndex extends StateLitElement {

    render() {
        return html`
            <collab-tooltip data-mlsline="25"></collab-tooltip>
            <collab-loading style="display:none;" data-mlsline="30"></collab-loading>
            <collab-page data-mlsline="31">
                <collab-sticky-notification
                    id="collabMessages"
                    data-mlsline="32">
                </collab-sticky-notification>
                <collab-nav-1
                    mheight="30"
                    id="collabNav1"
                    tabindexactive="0"
                    initialproject="100554"
                    data-mlsline="33">
                </collab-nav-1>
                <collab-spliter
                    defaultleft="50"
                    defaultright="50"
                    data-mlsline="34">
                    <collab-spliter-item data-mlsline="35">
                        <collab-nav-2
                            mheight="36"
                            level="7"
                            toolbarposition="left"
                            data-mlsline="36">
                        </collab-nav-2>
                        <collab-nav-3
                            toolbarposition="left"
                            data-mlsline="37">
                        </collab-nav-3>
                    </collab-spliter-item>
                    <collab-spliter-item data-mlsline="38">
                        <collab-nav-2
                            mheight="36"
                            level="7"
                            toolbarposition="right"
                            data-mlsline="39">
                        </collab-nav-2>
                        <collab-nav-3
                            toolbarposition="right"
                            data-mlsline="40">
                        </collab-nav-3>
                    </collab-spliter-item>
                </collab-spliter>
            </collab-page>
        `;
    }
}
