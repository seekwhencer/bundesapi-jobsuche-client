import EventEmitter from './event_emitter.js';

export default class Users extends EventEmitter {
    constructor(page) {
        super();
        this.page = page;

        this.modal = document.querySelector('#user-settings-modal');
        this.element = document.querySelector('#user-settings');
        this.listing = this.element.querySelector('#user-settings-user-listing');

    }
}