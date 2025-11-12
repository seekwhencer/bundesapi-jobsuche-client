import EventEmitter from "./event_emitter.js";

export default class AgeFilter extends EventEmitter {
    constructor(page) {
        super();
        this.page = page;

        this.container = document.querySelector('#age-slider');
        if (typeof this.container === 'string') this.container = document.querySelector(this.container);
        if (!this.container)
            return;

        this.cfg = this.parseConfig();
        this.cfg.end = this.cfg.max;

        this.state = {
            start: this.snap(this.cfg.start),
            end: this.snap(this.cfg.end)
        };

        this.cfg.labelTrack = true;

        //
        this.on('rangechange', () => {
            this.handleStart.innerHTML = this.state.start;
            this.handleEnd.innerHTML = this.state.end;

            this.page.listing.filterQuery.age_from = this.state.start;
            this.page.listing.filterQuery.age_to = this.state.end;
        });

        this.on('render-base', () => {
            const boxes = [];
            for (let i = 0; i < this.max + 1; i++) {
                boxes.push(`<i></i>`);
            }
            this.labelTrack.innerHTML = boxes.join('');
        });

        this.on('rangeinput', () => {
            this.page.listing.filterQuery.age_from = this.state.start;
            this.page.listing.filterQuery.age_to = this.state.end;
        });

    }

    show() {
        this.max = this.page.listing.latestJobAge;
        this.cfg.end = this.max;
        this.state.end = this.max;

        this.renderBase();
        this.bind();
        this.render();
    }

    get min() {
        return this.cfg.min;
    }

    set min(v) {
        this.cfg.min = v;
        //this.value = this.value; // re-apply to snap and clamp
    }

    get max() {
        return this.cfg.max;
    }

    set max(v) {
        this.cfg.max = v;
        //this.value = this.value; // re-apply to snap and clamp
    }


    // ----- public API -----
    get value() {
        return {...this.state};
    }

    set value(v) {
        if (v.start != null) this.state.start = this.snap(v.start);
        if (v.end != null) this.state.end = this.snap(v.end);
        if (this.state.start > this.state.end) [this.state.start, this.state.end] = [this.state.end, this.state.start];
        this.render();
        this.emit('rangechange');
    }

    // ----- internals -----
    parseConfig() {
        const d = this.container.dataset;
        const min = +d.min || 0;
        const max = +d.max || 100;
        const step = +d.step || 1;
        let start = +d.start || min;
        let end = +d.end || max;
        if (start > end) [start, end] = [end, start];
        return {min, max, step, start, end};
    }

    clamp(v, a, b) {
        return Math.min(Math.max(v, a), b);
    }

    snap(v) {
        const {min, max, step} = this.cfg;
        const s = Math.round((v - min) / step);
        return this.clamp(min + s * step, min, max);
    }

    pctForValue(v) {
        return ((v - this.cfg.min) / (this.cfg.max - this.cfg.min)) * 100;
    }

    valueForClientX(x) {
        const rect = this.track.getBoundingClientRect();
        const rel = this.clamp((x - rect.left) / rect.width, 0, 1);
        return this.snap(this.cfg.min + rel * (this.cfg.max - this.cfg.min));
    }

    renderBase() {
        const wrap = this.container;
        wrap.innerHTML = `
      <div class="slider">
        <div class="track"></div>
        <div class="range"></div>
        <button class="handle start" role="slider" aria-label="Start"></button>
        <button class="handle end" role="slider" aria-label="Ende"></button>
      </div>` +
            `${this.cfg.labelTrack ? `<div class="value-label">???</div>` : ''}` +
            //            `${this.cfg.labelTrack ? `<div class="value-label"><div>Start: <span class="val-start"></span></div><div>Ende: <span class="val-end"></span></div></div>` : ''}` +
            ``;

        this.track = wrap.querySelector('.track');
        this.rangeEl = wrap.querySelector('.range');
        this.handleStart = wrap.querySelector('.handle.start');
        this.handleEnd = wrap.querySelector('.handle.end');
        this.labelTrack = wrap.querySelector('.value-label');
        //this.cfg.labelTrack ? this.labelStart = wrap.querySelector('.val-start') : null;
        //this.cfg.labelTrack ? this.labelEnd = wrap.querySelector('.val-end') : null;
        this.emit('render-base');
    }

    render() {
        const ps = this.pctForValue(this.state.start);
        const pe = this.pctForValue(this.state.end);
        this.handleStart.style.left = ps + '%';
        this.handleEnd.style.left = pe + '%';
        this.rangeEl.style.left = ps + '%';
        this.rangeEl.style.width = (pe - ps) + '%';
        //this.cfg.labelTrack ? this.labelStart.textContent = this.state.start : null;
        //this.cfg.labelTrack ? this.labelEnd.textContent = this.state.end : null;
        this.handleStart.setAttribute('aria-valuenow', this.state.start);
        this.handleEnd.setAttribute('aria-valuenow', this.state.end);

        this.handleStart.innerHTML = this.state.start;
        this.handleEnd.innerHTML = this.state.end;

    }

    bind() {
        const hs = this.handleStart, he = this.handleEnd;
        let dragging = null;

        const onPointerMove = (ev) => {
            if (!dragging) return;
            const val = this.valueForClientX(ev.clientX);
            if (dragging === 'start') {
                this.state.start = Math.min(val, this.state.end);
            } else {
                this.state.end = Math.max(val, this.state.start);
            }
            this.render();
            this.emit('rangeinput');
        };

        const startDrag = (handle, which) => (ev) => {
            ev.preventDefault();
            handle.setPointerCapture(ev.pointerId);
            handle.setAttribute('aria-grabbed', 'true');
            dragging = which;
            onPointerMove(ev);
        };
        const stopDrag = (handle) => (ev) => {
            handle.releasePointerCapture(ev.pointerId);
            handle.setAttribute('aria-grabbed', 'false');
            if (dragging) {
                dragging = null;
                this.emit('rangechange');
            }
        };

        hs.addEventListener('pointerdown', startDrag(hs, 'start'));
        he.addEventListener('pointerdown', startDrag(he, 'end'));
        hs.addEventListener('pointerup', stopDrag(hs));
        he.addEventListener('pointerup', stopDrag(he));
        document.addEventListener('pointermove', onPointerMove);

        // click track
        this.track.addEventListener('click', (ev) => {
            const v = this.valueForClientX(ev.clientX);
            const ds = Math.abs(v - this.state.start), de = Math.abs(v - this.state.end);
            if (ds <= de) {
                this.state.start = Math.min(v, this.state.end);
            } else {
                this.state.end = Math.max(v, this.state.start);
            }
            this.render();
            this.emit('rangechange');
        });

        // keyboard
        const onKey = (which) => (e) => {
            const k = e.key;
            const step = this.cfg.step;
            const deltaMap = {ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10};
            if (k === 'Home') {
                if (which === 'start') this.state.start = this.cfg.min; else this.state.end = Math.max(this.state.start, this.cfg.min);
            } else if (k === 'End') {
                if (which === 'start') this.state.start = Math.min(this.state.end, this.cfg.max); else this.state.end = this.cfg.max;
            } else if (k in deltaMap) {
                e.preventDefault();
                const d = deltaMap[k] * step;
                if (which === 'start') {
                    this.state.start = this.snap(this.state.start + d);
                    if (this.state.start > this.state.end) this.state.start = this.state.end;
                } else {
                    this.state.end = this.snap(this.state.end + d);
                    if (this.state.end < this.state.start) this.state.end = this.state.start;
                }
            } else return;
            this.render();
            this.emit('rangechange');
        };
        hs.addEventListener('keydown', onKey('start'));
        he.addEventListener('keydown', onKey('end'));
    }

}