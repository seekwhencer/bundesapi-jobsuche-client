import EventEmitter from "./event_emitter.js";

export default class SearchesFilter extends EventEmitter {
    constructor(page) {
        super();

        this.page = page;
        this.listing = this.page.listing;
        this.element = document.querySelector('#searches-filter');

        this.searches = new Proxy({}, {
            get: (target, prop, receiver) => {
                return target[prop];
            },

            set: (target, prop, value) => {
                if (target[prop] === value)
                    return true;

                const existing = !!target[prop];
                target[prop] = value;

                if (!existing) {
                    this.emit('create', prop, value);
                    this.emit(prop, value, 'create');
                } else {
                    this.emit('update', prop, value);
                    this.emit(prop, value, 'update');

                }
                return true;
            },

            deleteProperty: (target, prop, receiver) => {
                delete target[prop];
                this.emit('delete', prop);
                this.emit(prop, 'delete');
                return true;
            }
        });

        //this.on('create', (prop, value) => console.log('SEARCH CREATE', prop, value));
        //this.on('update', (prop, value) => console.log('SEARCH UPDATE', prop, value));
        //this.on('delete', (prop, value) => console.log('SEARCH DELETE', prop));

        this.listing.listingFilter.on('search', search => {
            const button = this.element.querySelector(`[data-id="${search.id}"]`);

            if (!button) {
                this.flushButtons({});
                return;
            }
            if (button.dataset.id === search.id) {
                button.classList.add('selected');
            }
        });

        this.load();
    }

    async show() {
        if (this.element.classList.contains('open')) {
            this.element.classList.remove('open');
        } else {
            await this.load();
            this.element.classList.add('open');
        }
    }

    async load() {
        this.flushSearches();
        const res = await fetch('/api/search');
        const searches = await res.json();
        [...searches].forEach(search => this.searches[search.id] = search);

        this.render();
    }

    render() {
        this.element.innerHTML = '';
        Object.keys(this.searches).forEach(id => this.renderButton(this.searches[id]));
    }

    renderButton(search) {
        const button = document.createElement("button");
        button.className = "";
        button.dataset.id = search.id;
        button.innerHTML = `${search.location}${search.radius ? ` (${search.radius}km)` : ''}${search.search ? ` - <strong>${search.search}</strong>` : ''}${search.days ? `, ${search.days} Tage` : ''}`;
        button.onclick = (e) => this.filterBySearch(search, e);
        this.element.appendChild(button);
    }

    flushButtons(button) {
        this.element.querySelectorAll('button').forEach(b => b !== button ? b.classList.remove('selected') : null);
    }

    flushSearches() {
        Object.keys(this.searches).forEach(id => delete this.searches[id]);
    }

    filterBySearch(search, e) {
        const button = e.target;
        this.flushButtons(button);

        this.listing.filterQuery.liked = undefined;
        this.listing.filterQuery.ignored = false;

        search !== this.listing.filterQuery.search ? this.listing.filterQuery.search = search : this.listing.filterQuery.search = false;
    }
}