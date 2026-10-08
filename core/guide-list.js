/* On-device trip list for the Roskilde test page.
 *
 * The shared guide still takes the photo and names the container. This file
 * only keeps the list in localStorage and walks the stops. Nothing on the
 * list is sent anywhere.
 */

(function () {
    if (!window.SITE_CONFIG || !window.SITE_CONFIG.features || window.SITE_CONFIG.features.tripList !== true) return;

    const STORAGE_KEY = 'easysort-trip:' + location.pathname;
    const COPY = {
        da: {
            start: 'Start listen',
            add: 'Læg på listen',
            listTitle: 'Din liste',
            listHint: 'Fjern det, der ikke skal med.',
            empty: 'Listen er tom. Scan den første ting.',
            remove: 'Fjern',
            scanMore: 'Scan en mere',
            showRoute: 'Vis ruten',
            here: 'Her skal du af med',
            next: 'Næste sted',
            finish: 'Færdig',
            back: 'Forrige',
            edit: 'Ret listen',
            doneTitle: 'Det var det',
            doneBody: 'Du har været forbi alle stederne.',
            newList: 'Ny liste',
            staff: 'Spørg personalet',
            one: '1 ting',
            many: 'ting',
            seeList: 'Se listen',
            swipe: 'Stryg eller tryk næste'
        },
        en: {
            start: 'Start the list',
            add: 'Add to the list',
            listTitle: 'Your list',
            listHint: 'Remove anything that should not be on it.',
            empty: 'The list is empty. Scan the first thing.',
            remove: 'Remove',
            scanMore: 'Scan another',
            showRoute: 'Show the route',
            here: 'Drop off here',
            next: 'Next stop',
            finish: 'Done',
            back: 'Previous',
            edit: 'Edit the list',
            doneTitle: 'That is everything',
            doneBody: 'You have been to every stop.',
            newList: 'New list',
            staff: 'Ask the staff',
            one: '1 item',
            many: 'items',
            seeList: 'See the list',
            swipe: 'Swipe or tap next'
        }
    };

    let items = load();
    let pending = null;
    let tour = null;
    let screen = 'camera';

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'trip-add';
    addButton.hidden = true;
    document.getElementById('result-card').appendChild(addButton);

    const dock = document.createElement('div');
    dock.className = 'trip-dock';
    dock.hidden = true;
    dock.innerHTML = '<span class="trip-dock-count"></span><button type="button" class="trip-dock-open"></button>';
    document.body.appendChild(dock);

    const listScreen = document.createElement('section');
    listScreen.className = 'trip-screen';
    listScreen.hidden = true;
    listScreen.innerHTML = '<div class="trip-screen-body"><h2></h2><p class="trip-hint"></p><ul class="trip-items"></ul></div><div class="trip-actions"><button type="button" class="trip-secondary" data-act="scan"></button><button type="button" class="trip-primary" data-act="route"></button></div>';
    document.body.appendChild(listScreen);

    const tourScreen = document.createElement('section');
    tourScreen.className = 'trip-tour';
    tourScreen.hidden = true;
    tourScreen.innerHTML = '<p class="trip-progress"></p><h2 class="trip-place"></h2><p class="trip-here"></p><ul class="trip-drop"></ul><p class="trip-swipe"></p><div class="trip-actions"><button type="button" class="trip-secondary" data-act="back"></button><button type="button" class="trip-primary" data-act="next"></button></div><button type="button" class="trip-edit" data-act="edit"></button>';
    document.body.appendChild(tourScreen);

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

    function countLabel() {
        if (items.length === 1) return text('one');
        return items.length + ' ' + text('many');
    }

    function showCamera() {
        screen = 'camera';
        listScreen.hidden = true;
        tourScreen.hidden = true;
        document.body.classList.remove('trip-list', 'trip-routing');
        if (typeof setTripTour === 'function') setTripTour(null);
        paintDock();
    }

    function paintDock() {
        const visible = screen === 'camera' && items.length > 0;
        dock.hidden = !visible;
        document.body.classList.toggle('trip-has-list', visible);
        if (!visible) return;
        dock.querySelector('.trip-dock-count').textContent = countLabel();
        dock.querySelector('.trip-dock-open').textContent = text('seeList');
    }

    function paintAdd() {
        if (!pending) {
            addButton.hidden = true;
            return;
        }
        addButton.hidden = false;
        addButton.textContent = items.length ? text('add') : text('start');
    }

    function fitListScreen() {
        const header = document.getElementById('main-header');
        listScreen.style.top = (header ? header.offsetHeight : 88) + 'px';
    }

    function openList() {
        screen = 'list';
        fitListScreen();
        tour = null;
        if (typeof setTripTour === 'function') setTripTour(null);
        if (typeof hideDetectionBanner === 'function') hideDetectionBanner();
        document.body.classList.add('trip-list');
        document.body.classList.remove('trip-routing');
        listScreen.hidden = false;
        tourScreen.hidden = true;
        dock.hidden = true;
        document.body.classList.remove('trip-has-list');
        listScreen.querySelector('h2').textContent = text('listTitle');
        listScreen.querySelector('.trip-hint').textContent = text('listHint');
        listScreen.querySelector('[data-act="scan"]').textContent = text('scanMore');
        const routeButton = listScreen.querySelector('[data-act="route"]');
        routeButton.textContent = text('showRoute');
        routeButton.disabled = items.length === 0;
        const ul = listScreen.querySelector('.trip-items');
        ul.innerHTML = '';
        if (!items.length) {
            const empty = document.createElement('li');
            empty.className = 'trip-empty';
            empty.textContent = text('empty');
            ul.appendChild(empty);
            return;
        }
        items.forEach((item) => {
            const row = document.createElement('li');
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
                save();
                openList();
            });
            row.appendChild(words);
            row.appendChild(remove);
            ul.appendChild(row);
        });
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
        const pending = groups.slice();
        const stops = [];
        let from = ENTRANCE.slice();
        while (pending.length) {
            let bestAt = 0;
            let best = null;
            pending.forEach((group, index) => {
                const route = routeFor(group, from);
                if (!best || route.cost < best.cost) {
                    best = route;
                    bestAt = index;
                }
            });
            const group = pending.splice(bestAt, 1)[0];
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

    function openTour(index) {
        if (!items.length || typeof MAP === 'undefined' || !MAP || !ENTRANCE) return;
        if (!tour || index == null) tour = buildTour();
        tour.index = Math.max(0, Math.min(index, tour.stops.length));
        screen = tour.index >= tour.stops.length ? 'done' : 'tour';
        document.body.classList.remove('trip-list');
        document.body.classList.add('trip-routing');
        listScreen.hidden = true;
        tourScreen.hidden = false;
        dock.hidden = true;
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
        if (screen === 'done') {
            progress.textContent = '';
            place.textContent = text('doneTitle');
            here.textContent = text('doneBody');
            swipe.textContent = '';
            back.hidden = false;
            back.textContent = text('back');
            next.textContent = text('newList');
            return;
        }
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
        const map = document.getElementById('map-section');
        if (map) map.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    function addPending() {
        if (!pending) return;
        const label = (pending.description || pending.item || '').trim() || placeName({
            mapKey: pending.keys && pending.keys[0]
        });
        items.push({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            label: label,
            mapKey: (pending.keys && pending.keys[0]) || null
        });
        save();
        pending = null;
        paintAdd();
        openList();
    }

    function clearList() {
        items = [];
        tour = null;
        pending = null;
        save();
        paintAdd();
        showCamera();
        if (typeof scanAgain === 'function') scanAgain();
    }

    addButton.addEventListener('click', addPending);
    dock.querySelector('.trip-dock-open').addEventListener('click', openList);

    listScreen.addEventListener('click', (event) => {
        const act = event.target.closest('[data-act]');
        if (!act) return;
        if (act.dataset.act === 'scan') {
            showCamera();
            if (typeof scanAgain === 'function') scanAgain();
        }
        if (act.dataset.act === 'route') openTour(0);
    });

    tourScreen.addEventListener('click', (event) => {
        const act = event.target.closest('[data-act]');
        if (!act || !tour) return;
        if (act.dataset.act === 'edit') openList();
        if (act.dataset.act === 'back') openTour(tour.index - 1);
        if (act.dataset.act === 'next') {
            if (screen === 'done') clearList();
            else openTour(tour.index + 1);
        }
    });

    window.onTripStop = function (index) {
        if (screen === 'tour' || screen === 'done') openTour(index);
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
        if (screen !== 'camera') showCamera();
    });
    document.addEventListener('guide:language', () => {
        if (screen === 'list') openList();
        else if (screen === 'tour' || screen === 'done') openTour(tour ? tour.index : 0);
        else {
            paintAdd();
            paintDock();
        }
    });

    window.addEventListener('resize', () => {
        if (screen === 'list') fitListScreen();
    });
    paintDock();
})();
