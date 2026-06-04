/// <mls fileReference="_102041_/l2/collab-ticker.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

import { nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

@customElement('collab-ticker')
export class CollabTicker extends StateLitElement {


    @property({ attribute: 'text' }) text: string = 'C';
    @property({ attribute: 'element' }) element: string = 'p';

    render() {
        if (!this.text) return nothing;
        const tag = this.element || 'p';
        return unsafeHTML(`<${tag} style="animation-delay:.3s">${this.text}</${tag}>`);
    }
}
