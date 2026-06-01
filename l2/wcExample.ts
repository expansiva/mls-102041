/// <mls fileReference="_102041_/l2/wcExample.ts" enhancement="_102027_/l2/enhancementLit.ts"/>

import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

@customElement('wc-example-102041')
export class WcExample102041 extends StateLitElement {

    @property() name: string = 'Somebody';

    render() {
        return html`<p> Hello, ${this.name} !</p>`;
    }
}
