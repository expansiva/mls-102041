/// <mls fileReference="_102041_/l2/collab-loading.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

@customElement('collab-loading')
export class CollabLoading extends StateLitElement {

    render() {
        return html`
            <div class="loading">
                <span>Loading...</span>
            </div>
        `;
    }
}
