/* On-device trip list for the Roskilde list page.
 *
 * The first result still shows the map, with one button: "Start en liste".
 * After that the camera stays up. Each analysis is added by itself, the map
 * stays hidden, and the visitor removes items or starts over until they are
 * done. Nothing on the list is sent anywhere.
 */

(function () {
    if (!window.SITE_CONFIG || !window.SITE_CONFIG.features || window.SITE_CONFIG.features.tripList !== true) return;

    const STORAGE_KEY = 'easysort-trip:' + location.pathname;
    const COPY = {
        da: {
            oneThing: 'Én ting',
            manyThings: 'Flere ting',
            things: 'ting',
            start: 'Start en liste',
            added: 'Lagt på listen:',
            keepGoing: 'Peg på den næste ting og tryk analyser.',
            clear: 'Start forfra',
            clearConfirm: 'Slet listen?',
            finishScanning: 'Færdig',
            remove: 'Fjern',
            here: 'Her skal du af med',
            next: 'Næste sted',
            finish: 'Færdig',
            back: 'Forrige',
            edit: 'Ret listen',
            doneTitle: 'Det var det',
            doneBody: 'Listen er klaret. Her er hvor tingene skulle hen.',
            again: 'Se ruten igen',
            newList: 'Ny liste',
            staff: 'Spørg personalet',
            swipe: 'Stryg eller tryk næste'
        },
        en: {
            oneThing: 'One thing',
            manyThings: 'Several things',
            things: 'things',
            start: 'Start a list',
            added: 'Added:',
            keepGoing: 'Point at the next thing and tap Analyze.',
            clear: 'Start over',
            clearConfirm: 'Delete the list?',
            finishScanning: 'Done',
            remove: 'Remove',
            here: 'Drop off here',
            next: 'Next stop',
            finish: 'Done',
            back: 'Previous',
            edit: 'Edit the list',
            doneTitle: 'That is everything',
            doneBody: 'The list is done. Here is where it went.',
            again: 'See the route again',
            newList: 'New list',
            staff: 'Ask the staff',
            swipe: 'Swipe or tap next'
        }
    };

    let items = load();
    let multiple = false;
    let pending = null;
    let tour = null;
    let screen = 'camera';
    let lastAdded = '';
    let lastId = '';
    let clearArmed = false;
    let clearTimer = null;

    const modeSwitch = document.createElement('div');
    modeSwitch.className = 'trip-mode';
    modeSwitch.setAttribute('role', 'group');
    modeSwitch.innerHTML = '<button type="button" data-mode="single"></button><button type="button" data-mode="many"></button>';
    const analyzeButton = document.getElementById('identify-btn');
    analyzeButton.parentNode.insertBefore(modeSwitch, analyzeButton);

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'trip-add';
    addButton.hidden = true;
    document.getElementById('result-card').appendChild(addButton);

    const collectPanel = document.createElement('section');
    collectPanel.className = 'trip-collect';
    collectPanel.hidden = true;
    collectPanel.innerHTML = '<p class="trip-status"></p><ul class="trip-items"></ul><div class="trip-actions"><button type="button" class="trip-secondary" data-act="clear"></button><button type="button" class="trip-primary" data-act="route"></button></div>';
    document.querySelector('.guide-hero').appendChild(collectPanel);

    const tourScreen = document.createElement('section');
    tourScreen.className = 'trip-tour';
    tourScreen.hidden = true;
    tourScreen.innerHTML = '<div class="trip-tour-body"><p class="trip-progress"></p><h2 class="trip-place"></h2><p class="trip-here"></p><ul class="trip-drop"></ul><p class="trip-swipe"></p></div><div class="trip-actions"><button type="button" class="trip-secondary" data-act="back"></button><button type="button" class="trip-primary" data-act="next"></button></div><button type="button" class="trip-edit" data-act="edit"></button>';
    document.body.appendChild(tourScreen);

    const doneScreen = document.createElement('section');
    doneScreen.className = 'trip-done';
    doneScreen.hidden = true;
    doneScreen.innerHTML = '<div class="trip-done-scroll"><h2></h2><p class="trip-done-body"></p><ul class="trip-recap"></ul></div><div class="trip-done-actions"><button type="button" class="trip-secondary" data-act="again"></button><button type="button" class="trip-primary" data-act="new"></button><button type="button" class="trip-edit" data-act="edit"></button></div>';
    document.body.appendChild(doneScreen);

    function text(key) {
        const lang = document.documentElement.lang === 'en' ? 'en' : 'da';
        return COPY[lang][key];
    }

    function load() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.label === 'string') : [];
        } catch {
            return [];
        }
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            /* Private mode can refuse storage. The list still works this visit. */
        }
    }

    function placeName(item) {
        if (item.mapKey && typeof FRACTION_BY_KEY !== 'undefined' && FRACTION_BY_KEY.has(item.mapKey)) {
            const name = FRACTION_BY_KEY.get(item.mapKey).name;
            const lang = document.documentElement.lang === 'en' ? 'en' : 'da';
            return name[lang] || name.da;
        }
        return text('staff');
    }

    function labelFor(payload) {
        const label = ((payload && (payload.description || payload.item)) || '').trim();
        if (label) return label;
        return placeName({ mapKey: payload && payload.keys && payload.keys[0] });
    }

    function showCamera() {
        screen = 'camera';
        collectPanel.hidden = true;
        tourScreen.hidden = true;
        doneScreen.hidden = true;
        document.body.classList.remove('trip-collecting', 'trip-routing', 'trip-finished');
        if (typeof setTripTour === 'function') setTripTour(null);
    }

    /* Keep the header short while collecting or walking, and remember how tall
     * it is so the camera and the map start below it. */
    function placeChrome() {
        const header = document.getElementById('main-header');
        const headerHeight = header ? header.offsetHeight : 0;
        document.documentElement.style.setProperty('--trip-header-h', headerHeight + 'px');
        if (screen === 'tour' && !tourScreen.hidden) {
            document.documentElement.style.setProperty('--trip-sheet-h', tourScreen.offsetHeight + 'px');
        }
    }

    /* The live camera sits under the header. The newest row, with Fjern, is
     * directly under the analyze button. */
    function focusCamera() {
        if (typeof scanAgain === 'function' && typeof MAP !== 'undefined' && MAP) scanAgain({ scroll: false });
        placeChrome();
        const card = document.querySelector('.camera-card');
        if (!card) return;
        const header = document.getElementById('main-header');
        const headerHeight = header ? header.offsetHeight : 0;
        const top = card.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
        window.scrollTo({ top: Math.max(top, 0), behavior: 'auto' });
    }

    function paintMode() {
        const one = modeSwitch.querySelector('[data-mode="single"]');
        const many = modeSwitch.querySelector('[data-mode="many"]');
        one.textContent = text('oneThing');
        many.textContent = text('manyThings');
        one.classList.toggle('is-on', !multiple);
        many.classList.toggle('is-on', multiple);
        one.setAttribute('aria-pressed', String(!multiple));
        many.setAttribute('aria-pressed', String(multiple));
        modeSwitch.setAttribute('aria-label', text('oneThing') + ' / ' + text('manyThings'));
    }

    function paintAdd() {
        const show = screen === 'camera' && pending;
        addButton.hidden = !show;
        if (show) addButton.textContent = text('start');
    }

    function disarmClear() {
        clearArmed = false;
        clearTimeout(clearTimer);
        clearTimer = null;
    }

    function paintCollect() {
        collectPanel.querySelector('.trip-status').textContent = lastAdded
            ? text('added') + ' ' + lastAdded
            : text('keepGoing');
        const clearButton = collectPanel.querySelector('[data-act="clear"]');
        if (!clearArmed) clearButton.textContent = text('clear');
        const routeButton = collectPanel.querySelector('[data-act="route"]');
        routeButton.textContent = text('finishScanning');
        routeButton.disabled = items.length === 0;
        const ul = collectPanel.querySelector('.trip-items');
        ul.innerHTML = '';
        items.slice().reverse().forEach((item) => {
            const row = document.createElement('li');
            if (item.id === lastId) row.className = 'trip-just-added';
            const words = document.createElement('div');
            const name = document.createElement('strong');
            name.textContent = item.label;
            const where = document.createElement('span');
            where.textContent = placeName(item);
            words.appendChild(name);
            words.appendChild(where);
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'trip-remove';
            remove.textContent = text('remove');
            remove.addEventListener('click', () => {
                items = items.filter((entry) => entry.id !== item.id);
                if (item.id === lastId) {
                    lastId = '';
                    lastAdded = '';
                }
                save();
                if (!items.length) clearList();
                else paintCollect();
            });
            row.appendChild(words);
            row.appendChild(remove);
            ul.appendChild(row);
        });
    }

    function enterCollecting() {
        screen = 'collect';
        tour = null;
        disarmClear();
        if (typeof setTripTour === 'function') setTripTour(null);
        document.body.classList.remove('trip-routing', 'trip-finished');
        document.body.classList.add('trip-collecting');
        tourScreen.hidden = true;
        doneScreen.hidden = true;
        collectPanel.hidden = false;
        paintAdd();
        paintCollect();
        placeChrome();
    }

    function addMany(payloads) {
        const batch = payloads.filter(Boolean);
        if (!batch.length) return;
        batch.slice().reverse().forEach(addPayload);
        if (batch.length > 1) lastAdded = batch.length + ' ' + text('things');
    }

    function addPayload(payload) {
        const item = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            label: labelFor(payload),
            mapKey: (payload.keys && payload.keys[0]) || null
        };
        items.push(item);
        lastAdded = item.label;
        lastId = item.id;
        save();
        return item;
    }

    function staffPoint() {
        const staff = typeof MAP !== 'undefined' && MAP && MAP.staff;
        if (!staff || typeof staff.x !== 'number') return null;
        return [staff.x + (staff.width || 0) / 2, staff.y + (staff.height || 0) / 2];
    }

    function routeFor(group, from) {
        if (group.mapKey && FRACTION_BY_KEY.has(group.mapKey)) {
            return routeToFraction(FRACTION_BY_KEY.get(group.mapKey), from);
        }
        const point = staffPoint() || from;
        return routeToPoint(point, null, from);
    }

    function buildTour() {
        const groups = [];
        const indexByKey = new Map();
        items.forEach((item) => {
            const key = item.mapKey || '';
            if (!indexByKey.has(key)) {
                indexByKey.set(key, groups.length);
                groups.push({ mapKey: item.mapKey || null, items: [] });
            }
            groups[indexByKey.get(key)].items.push(item);
        });
        const pendingGroups = groups.slice();
        const stops = [];
        let from = ENTRANCE.slice();
        while (pendingGroups.length) {
            let bestAt = 0;
            let best = null;
            pendingGroups.forEach((group, index) => {
                const route = routeFor(group, from);
                if (!best || route.cost < best.cost) {
                    best = route;
                    bestAt = index;
                }
            });
            const group = pendingGroups.splice(bestAt, 1)[0];
            stops.push({
                mapKey: group.mapKey,
                items: group.items,
                spot: best.spot,
                path: best.path
            });
            from = best.spot || from;
        }
        return { stops: stops, index: 0 };
    }

    function openDone() {
        screen = 'done';
        document.body.classList.remove('trip-collecting', 'trip-routing');
        document.body.classList.add('trip-finished');
        collectPanel.hidden = true;
        tourScreen.hidden = true;
        doneScreen.hidden = false;
        if (typeof setTripTour === 'function') setTripTour(null);
        doneScreen.querySelector('h2').textContent = text('doneTitle');
        doneScreen.querySelector('.trip-done-body').textContent = text('doneBody');
        doneScreen.querySelector('[data-act="again"]').textContent = text('again');
        doneScreen.querySelector('[data-act="new"]').textContent = text('newList');
        doneScreen.querySelector('[data-act="edit"]').textContent = text('edit');
        const ul = doneScreen.querySelector('.trip-recap');
        ul.innerHTML = '';
        (tour ? tour.stops : []).forEach((stop, index) => {
            const row = document.createElement('li');
            const where = document.createElement('strong');
            where.textContent = (index + 1) + '. ' + (stop.mapKey ? placeName(stop.items[0]) : text('staff'));
            const what = document.createElement('span');
            what.textContent = stop.items.map((item) => item.label).join(', ');
            row.appendChild(where);
            row.appendChild(what);
            ul.appendChild(row);
        });
        placeChrome();
    }

    function openTour(index) {
        if (!items.length || typeof MAP === 'undefined' || !MAP || !ENTRANCE) return;
        if (!tour || index == null) tour = buildTour();
        tour.index = Math.max(0, Math.min(index, tour.stops.length));
        if (tour.index >= tour.stops.length) {
            openDone();
            return;
        }
        screen = 'tour';
        document.body.classList.remove('trip-collecting', 'trip-finished');
        document.body.classList.add('trip-routing');
        collectPanel.hidden = true;
        doneScreen.hidden = true;
        tourScreen.hidden = false;
        setTripTour(tour);
        const progress = tourScreen.querySelector('.trip-progress');
        const place = tourScreen.querySelector('.trip-place');
        const here = tourScreen.querySelector('.trip-here');
        const drop = tourScreen.querySelector('.trip-drop');
        const swipe = tourScreen.querySelector('.trip-swipe');
        const back = tourScreen.querySelector('[data-act="back"]');
        const next = tourScreen.querySelector('[data-act="next"]');
        const edit = tourScreen.querySelector('[data-act="edit"]');
        drop.innerHTML = '';
        edit.textContent = text('edit');
        const stop = tour.stops[tour.index];
        progress.textContent = (tour.index + 1) + ' / ' + tour.stops.length;
        place.textContent = stop.mapKey ? placeName(stop.items[0]) : text('staff');
        here.textContent = text('here');
        stop.items.forEach((item) => {
            const li = document.createElement('li');
            li.textContent = item.label;
            drop.appendChild(li);
        });
        swipe.textContent = text('swipe');
        back.hidden = tour.index === 0;
        back.textContent = text('back');
        next.textContent = tour.index === tour.stops.length - 1 ? text('finish') : text('next');
        placeChrome();
    }

    function clearList() {
        items = [];
        tour = null;
        pending = null;
        lastAdded = '';
        lastId = '';
        disarmClear();
        save();
        paintAdd();
        showCamera();
        if (typeof scanAgain === 'function') scanAgain();
    }

    modeSwitch.addEventListener('click', (event) => {
        const choice = event.target.closest('[data-mode]');
        if (!choice) return;
        multiple = choice.dataset.mode === 'many';
        paintMode();
    });

    addButton.addEventListener('click', () => {
        if (!pending) return;
        addPayload(pending);
        pending = null;
        enterCollecting();
        focusCamera();
    });

    collectPanel.addEventListener('click', (event) => {
        const act = event.target.closest('[data-act]');
        if (!act) return;
        if (act.dataset.act === 'clear') {
            if (!clearArmed) {
                clearArmed = true;
                act.textContent = text('clearConfirm');
                clearTimer = setTimeout(() => {
                    clearArmed = false;
                    act.textContent = text('clear');
                }, 2500);
                return;
            }
            clearList();
        }
        if (act.dataset.act === 'route') openTour(0);
    });

    tourScreen.addEventListener('click', (event) => {
        const act = event.target.closest('[data-act]');
        if (!act || !tour) return;
        if (act.dataset.act === 'edit') {
            enterCollecting();
            focusCamera();
        }
        if (act.dataset.act === 'back') openTour(tour.index - 1);
        if (act.dataset.act === 'next') openTour(tour.index + 1);
    });

    doneScreen.addEventListener('click', (event) => {
        const act = event.target.closest('[data-act]');
        if (!act) return;
        if (act.dataset.act === 'again') openTour(0);
        if (act.dataset.act === 'new') clearList();
        if (act.dataset.act === 'edit') {
            enterCollecting();
            focusCamera();
        }
    });

    window.onTripStop = function (index) {
        if (screen === 'tour' || screen === 'done') openTour(index);
    };

    /* While the list is open, a new photo is added and the camera stays.
     * Returning true tells the guide not to open the map. */
    window.tripWantsMultiple = function () {
        return multiple;
    };

    window.tripHandleClassification = function (payload) {
        if (payload && payload.multi && Array.isArray(payload.items) && payload.items.length) {
            addMany(payload.items);
            if (screen !== 'collect') enterCollecting();
            else paintCollect();
            focusCamera();
            return true;
        }
        if (screen !== 'collect') return false;
        addPayload(payload);
        paintCollect();
        focusCamera();
        return true;
    };

    let swipe = null;
    function watchSwipe(target) {
        target.addEventListener('touchstart', (event) => {
            if (screen !== 'tour') return;
            const touch = event.changedTouches[0];
            swipe = { x: touch.clientX, y: touch.clientY };
        }, { passive: true });
        target.addEventListener('touchend', (event) => {
            if (!swipe || screen !== 'tour' || !tour) return;
            const touch = event.changedTouches[0];
            const dx = touch.clientX - swipe.x;
            const dy = touch.clientY - swipe.y;
            swipe = null;
            if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
            if (dx < 0) openTour(tour.index + 1);
            else if (tour.index > 0) openTour(tour.index - 1);
        }, { passive: true });
    }
    watchSwipe(tourScreen);
    watchSwipe(document.getElementById('site-map'));

    document.addEventListener('guide:shown', () => {
        pending = null;
        paintAdd();
    });
    document.addEventListener('guide:classified', (event) => {
        pending = event.detail;
        paintAdd();
    });
    document.addEventListener('guide:language', () => {
        paintMode();
        if (screen === 'collect') paintCollect();
        else if (screen === 'done') openDone();
        else if (screen === 'tour') openTour(tour ? tour.index : 0);
        else paintAdd();
        placeChrome();
    });

    window.addEventListener('resize', placeChrome);

    paintMode();
    placeChrome();

    if (items.length) {
        enterCollecting();
        focusCamera();
    }
})();
