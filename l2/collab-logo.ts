/// <mls fileReference="_102041_/l2/collab-logo.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { StateLitElement } from '/_102029_/l2/stateLitElement.js';

@customElement('collab-logo')
export class CollabLogo extends StateLitElement {

    render() {
        return html`
            <div class="logo">
                <div class="letter c1"></div>
                <div class="letter c2"></div>
            </div>
        `;
    }
}
