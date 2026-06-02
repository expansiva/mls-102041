/// <mls fileReference="_102041_/l2/collab-sticky-notification.ts" enhancement="_102041_/l2/enhancementCollab.ts"/>

/// **collab_i18n_start**
const message_en = {
    of: 'of',
    information: 'Information',
    alert: 'Alert',
    error: 'Error',
};
type MessageType = typeof message_en;
const message_pt: MessageType = {
    of: 'de',
    information: 'Informação',
    alert: 'Alerta',
    error: 'Erro',
};
const messages: { [key: string]: MessageType } = { en: message_en, pt: message_pt };
/// **collab_i18n_end**

import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { CollabPage } from '/_102041_/l2/collab-page.js';
import { StateLitElement } from '/_102027_/l2/stateLitElement.js';

type IMessageType = 'information' | 'alert' | 'error';

interface IMessage {
    text: string;
    type: IMessageType;
}

interface IMessageOptions {
    autoClose?: boolean;
    timeToClose?: number;
    clearOnClose: boolean;
}

@customElement('collab-sticky-notification')
export class CollabStickyNotification extends StateLitElement {

    @state() private _messages: IMessage[] = [];
    @state() private _actualIndex: number = 0;
    @state() private _actualMessage: IMessage | undefined;
    @state() private _isOpen: boolean = false;
    @state() private _actualOptions: IMessageOptions = { clearOnClose: true, autoClose: false, timeToClose: 5000 };

    private msg: MessageType = messages['en'];

    private readonly _defaultOptions: IMessageOptions = { clearOnClose: true, autoClose: false, timeToClose: 5000 };

    private get _mlsPage(): CollabPage | null { return this.closest('collab-page'); }

    public add(message: string, typeMsg: IMessageType, options?: IMessageOptions) {
        const newMessage: IMessage = { text: message, type: typeMsg };
        this.setAttribute('mheight', '50');
        this._messages = [newMessage, ...this._messages];
        if (this._messages.length === 100) this._removeMsg(this._messages.length - 1);
        this._actualMessage = newMessage;
        this._actualIndex = 0;
        this._isOpen = true;

        const autoClose = typeMsg === 'information';
        if (options) {
            this._actualOptions = {
                autoClose: 'autoClose' in options ? options.autoClose : autoClose,
                clearOnClose: 'clearOnClose' in options ? options.clearOnClose : this._defaultOptions.clearOnClose,
                timeToClose: 'timeToClose' in options ? options.timeToClose : this._defaultOptions.timeToClose,
            };
            if (this._actualOptions.timeToClose) this._actualOptions = { ...this._actualOptions, autoClose: true };
        } else {
            this._actualOptions = { autoClose, clearOnClose: this._defaultOptions.clearOnClose, timeToClose: this._defaultOptions.timeToClose };
        }

        this._saveLocalStorageMessages(this._messages);
        if (this._actualOptions.autoClose) setTimeout(() => this.close(), this._actualOptions.timeToClose);
        if (this._mlsPage) this._mlsPage.layout();
    }

    public close() {
        this._isOpen = false;
        this.removeAttribute('mheight');
        if (this._actualOptions.clearOnClose) this._removeMsg(this._actualIndex);
        this._actualIndex = 0;
        this._actualMessage = undefined;
        if (this._mlsPage) this._mlsPage.layout();
    }

    public show() {
        const msg = this._getLocalStorageMessages();
        if (!msg || msg.length === 0) return;
        this._messages = msg;
        this._isOpen = true;
        this._actualIndex = 0;
        this._actualMessage = this._messages[0];
        if (this._mlsPage) this._mlsPage.layout();
    }

    updated() {
        this.classList.toggle('open', this._isOpen);
        ['information', 'alert', 'error'].forEach(cls => this.classList.remove(cls));
        if (this._actualMessage) this.classList.add(this._actualMessage.type);
    }

    render() {
        this.msg = messages[this.getMessageKey(messages)] || messages['en'];
        if (!this._isOpen || !this._actualMessage) return html`<div></div>`;
        const iconMap: Record<IMessageType, string> = {
            information: 'fa-circle-info',
            alert: 'fa-triangle-exclamation',
            error: 'fa-circle-exclamation',
        };
        return html`
            <div>
                <i class="icon-type fa ${iconMap[this._actualMessage.type]}"></i>
                <div class="controllers">
                    <i class="fa fa-caret-left" @click=${() => this._onLeftClick()}></i>
                    <span>${this._actualIndex + 1}</span>
                    <span>${this.msg.of}</span>
                    <span>${this._messages.length}</span>
                    <i class="fa fa-caret-right" @click=${() => this._onRightClick()}></i>
                </div>
                <span class="text-message" title="${this._actualMessage.text}">${this._actualMessage.text}</span>
                <i class="close-icon fa fa-times" @click=${() => this.close()}></i>
            </div>
        `;
    }

    private _onLeftClick() {
        if (this._actualIndex < 1) return;
        this._actualIndex -= 1;
        this._actualMessage = this._messages[this._actualIndex];
    }

    private _onRightClick() {
        if (this._actualIndex >= this._messages.length - 1) return;
        this._actualIndex += 1;
        this._actualMessage = this._messages[this._actualIndex];
    }

    private _removeMsg(idx: number) {
        this._messages = this._messages.filter((_, i) => i !== idx);
        this._saveLocalStorageMessages(this._messages);
    }

    private _getLocalStorageMessages(): IMessage[] {
        const ls = localStorage.getItem('collab_sticky_notification');
        if (!ls) return [];
        const parsed = JSON.parse(ls);
        return Array.isArray(parsed) ? parsed : [];
    }

    private _saveLocalStorageMessages(messages: IMessage[]) {
        localStorage.setItem('collab_sticky_notification', JSON.stringify(messages));
    }
}
