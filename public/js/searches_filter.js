export default class SearchesFilter {
    constructor(page) {
        this.page = page;
        this.listing = this.page.listing;
        this.openFilterBtn = document.querySelector('#open-searches-filter');
        this.openFilterBtn.addEventListener('click', () => this.show());
        this.element = document.querySelector('#searches-filter');
    }

    async show() {
        if (this.element.classList.contains('open')) {
            this.element.classList.remove('open');
            this.element.innerHTML = '';
        } else {
            await this.load();
            this.element.classList.add('open');
        }
    }

    async load() {
        const res = await fetch('/api/search');
        this.searches = await res.json();
        this.render();
    }

    render() {
        this.searches.forEach(search => this.renderButton(search));
    }

    renderButton(search) {
        const button = document.createElement("button");
        button.className = "";
        button.innerHTML = `${search.location}${search.radius ? ` (${search.radius}km)` : ''}${search.search ? ` - ${search.search}` : ''}${search.days ? `, ${search.days} Tage` : ''}`;
        button.onclick = (e) => this.filterBySearch(search, e);
        this.element.appendChild(button);
    }

    flushButtons(button) {
        this.element.querySelectorAll('button').forEach(b => b !== button ? b.classList.remove('selected') : null);
    }

    filterBySearch(search, e) {
        const button = e.target;
        this.flushButtons(button);

        if (button.classList.contains('selected')) {
            button.classList.remove('selected');
            this.listing.filterBySearch(false);
        } else {
            button.classList.add('selected');
            this.listing.filterBySearch(search);
        }
    }
}