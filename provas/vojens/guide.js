/* Sorting guide for Provas / Vojens Genbrugsplads.
 *
 * Flow: user takes a photo -> API returns fraction id(s) -> the map draws
 * the route from the entrance to that container.
 *
 * Primary API (not live yet):
 *   POST SORTING_API_URL
 *   body:     { site: "provas-vojens", image: <base64 jpeg>, language: "da" | "en" }
 *   response: { ok: true, result: { fractionIds: string[] } }   (primary first)
 *
 * Until it exists we fall back to the existing Easysort Gemini worker.
 */

const SORTING_API_URL = 'https://api.easysort.org/v1/sorting-guide';
const FALLBACK_WORKER_URL = 'https://workers-playground-bitter-term-7fe4.lucas-vilsen.workers.dev/generate';
const API_TIMEOUT_MS = 20000;
const SITE_ID = 'provas-vojens';

const LANGUAGE_STORAGE_KEY = 'easysort-language';
const SUPPORTED_LANGUAGES = ['da', 'en'];
let currentLanguage = 'da';

/* ── Static texts ──────────────────────────────────────────── */

const translations = {
    da: {
        pageTitle: 'Sorteringsguide – Vojens Genbrugsplads | Easysort',
        guideKicker: 'Provas · Vojens Genbrugsplads',
        guideTitle: 'Hvad skal du af med?',
        guideSubtitle: 'Tag et billede af dit affald, så finder vi den rigtige container og viser dig vejen fra indgangen.',
        photoButton: 'Tag et billede af dit affald',
        libraryButton: '… eller vælg et billede fra galleriet',
        analyzing: 'Kigger på billedet ...',
        analyzeFailed: 'Vi kunne ikke analysere billedet. Prøv igen, eller spørg personalet.',
        noMatch: 'Vi er ikke sikre på, hvad det er. Prøv et nyt billede tættere på, eller spørg personalet.',
        resultPill: 'Følg den grønne rute',
        alsoMaybe: 'Andre muligheder:',
        mapCaption: 'Tryk på en container for at se ruten. Kortet er vejledende – spørg personalet, hvis du er i tvivl.',
        mapEntrance: 'Indgang',
        mapStaff: 'Personale',
        mapHall: 'Miljøhal',
        footerSummary: 'Sorteringsguide til Vojens Genbrugsplads, drevet af Provas.',
        footerContactLabel: 'Kontakt:',
        footerBackLink: 'Tilbage til easysort.org'
    },
    en: {
        pageTitle: 'Sorting guide – Vojens Recycling Center | Easysort',
        guideKicker: 'Provas · Vojens Recycling Center',
        guideTitle: 'What are you dropping off?',
        guideSubtitle: 'Take a photo of your waste and we will find the right container and show you the way from the entrance.',
        photoButton: 'Take a photo of your waste',
        libraryButton: '… or pick a photo from your library',
        analyzing: 'Looking at the photo ...',
        analyzeFailed: 'We could not analyze the photo. Try again, or ask the staff.',
        noMatch: 'We are not sure what this is. Try a closer photo, or ask the staff.',
        resultPill: 'Follow the green route',
        alsoMaybe: 'Other options:',
        mapCaption: 'Tap a container to see the route. The map is indicative – ask the staff if in doubt.',
        mapEntrance: 'Entrance',
        mapStaff: 'Staff',
        mapHall: 'Hazardous waste hall',
        footerSummary: 'Sorting guide for Vojens Recycling Center, operated by Provas.',
        footerContactLabel: 'Contact:',
        footerBackLink: 'Back to easysort.org'
    }
};

/* ── Fractions ─────────────────────────────────────────────────
 * Layout digitized from the official Provas map of Vojens Genbrugsplads.
 * Colors follow the Danish waste pictogram system used on the signs.
 * spots: [x, y] tile centers in map coordinates (viewBox 620x900).
 * aisle: x of the driving lane the container is reached from. */

const COLORS = {
    navy: '#2d5474', lightblue: '#2e7fb4', teal: '#33b58e', darkgreen: '#20603c',
    darkred: '#8e3049', purple: '#8e3d95', brown: '#77571e', sand: '#b99b62',
    slate: '#46585e', black: '#232323', lightgreen: '#6fb44e', orange: '#e28c2b',
    red: '#d0342c'
};

const AISLE = { left: 115, mid: 285, inner: 400, right: 555 };

const FRACTIONS = [
    { id: 'pap', color: 'sand', aisle: 'left', spots: [[63, 488], [63, 548], [352, 445]],
      name: { da: 'Pap', en: 'Cardboard' },
      instructions: { da: 'Rent og tørt pap. Slå kasserne flade, og fjern flamingo og plastfyld først.', en: 'Clean, dry cardboard. Flatten boxes and remove styrofoam and plastic filling first.' } },
    { id: 'papir', color: 'lightblue', aisle: 'inner', spots: [[352, 496]],
      name: { da: 'Papir', en: 'Paper' },
      instructions: { da: 'Aviser, reklamer og kontorpapir.', en: 'Newspapers, flyers and office paper.' } },
    { id: 'boeger', color: 'lightblue', aisle: 'inner', spots: [[352, 547]],
      name: { da: 'Bøger', en: 'Books' },
      instructions: { da: 'Bøger i alle former – også med stift ryg.', en: 'Books of all kinds – hardcovers too.' } },
    { id: 'glas', color: 'teal', aisle: 'inner', spots: [[352, 343]],
      name: { da: 'Glas', en: 'Glass' },
      instructions: { da: 'Flasker og emballageglas. Tøm dem – skyl gerne.', en: 'Bottles and packaging glass. Empty them – rinse if possible.' } },
    { id: 'fladt-glas', color: 'teal', aisle: 'inner', spots: [[352, 190]],
      name: { da: 'Fladt glas', en: 'Flat glass' },
      instructions: { da: 'Planglas og spejle uden rammer.', en: 'Flat glass and mirrors without frames.' } },
    { id: 'vinduer', color: 'navy', aisle: 'inner', spots: [[352, 241]],
      name: { da: 'Vinduer', en: 'Windows' },
      instructions: { da: 'Hele vinduer med ramme og karm.', en: 'Whole windows with frame and casing.' } },
    { id: 'metal', color: 'slate', aisle: 'mid', spots: [[218, 194], [218, 260]],
      name: { da: 'Metal', en: 'Metal' },
      instructions: { da: 'Alt af metal: rør, gryder, cykler og havemøbler i metal.', en: 'Anything metal: pipes, pots, bicycles and metal garden furniture.' } },
    { id: 'haard-plast', color: 'purple', aisle: 'inner', spots: [[352, 649]],
      name: { da: 'Hård plast', en: 'Hard plastic' },
      instructions: { da: 'Spande, kasser og legetøj uden elektronik. Tøm for indhold.', en: 'Buckets, crates and toys without electronics. Empty of contents.' } },
    { id: 'bloed-plast', color: 'purple', aisle: 'inner', spots: [[352, 598]],
      name: { da: 'Blød plast', en: 'Soft plastic' },
      instructions: { da: 'Ren og tør folie, poser og bobleplast.', en: 'Clean, dry film, bags and bubble wrap.' } },
    { id: 'haard-pvc', color: 'purple', aisle: 'left', spots: [[63, 607]],
      name: { da: 'Hård PVC', en: 'Rigid PVC' },
      instructions: { da: 'Rør, tagrender og kabelbakker af hård PVC.', en: 'Pipes, gutters and cable trays of rigid PVC.' } },
    { id: 'plast-havemoebler', color: 'purple', aisle: 'inner', spots: [[352, 292]],
      name: { da: 'Plast-havemøbler', en: 'Plastic garden furniture' },
      instructions: { da: 'Havemøbler af plast – tømte og uden hynder.', en: 'Plastic garden furniture – emptied and without cushions.' } },
    { id: 'flamingo', color: 'purple', aisle: 'inner', spots: [[352, 394]],
      name: { da: 'Flamingo', en: 'Styrofoam' },
      instructions: { da: 'Ren flamingo (EPS) fra emballage.', en: 'Clean styrofoam (EPS) from packaging.' } },
    { id: 'daek', color: 'purple', aisle: 'left', spots: [[63, 667]],
      name: { da: 'Dæk', en: 'Tyres' },
      instructions: { da: 'Dæk med og uden fælge.', en: 'Tyres with and without rims.' } },
    { id: 'indendoers-trae', color: 'brown', aisle: 'left', spots: [[63, 368], [63, 428], [218, 454]],
      name: { da: 'Indendørs træ', en: 'Indoor wood' },
      instructions: { da: 'Rent træ og møbler af træ. Søm og skruer må gerne sidde i.', en: 'Clean wood and wooden furniture. Nails and screws can stay in.' } },
    { id: 'tryk-impraegneret', color: 'brown', aisle: 'left', spots: [[63, 308], [218, 334]],
      name: { da: 'Trykimprægneret træ', en: 'Pressure-treated wood' },
      instructions: { da: 'Trykimprægneret træ, hegn og terrassebrædder.', en: 'Pressure-treated wood, fencing and decking boards.' } },
    { id: 'paller', color: 'brown', aisle: 'inner', spots: [[445, 386]],
      name: { da: 'Paller', en: 'Pallets' },
      instructions: { da: 'Hele paller og pallerammer.', en: 'Whole pallets and pallet collars.' } },
    { id: 'tagpap', color: 'navy', aisle: 'inner', spots: [[445, 302]],
      name: { da: 'Tagpap', en: 'Roofing felt' },
      instructions: { da: 'Tagpap uden træ og søm i større mængder.', en: 'Roofing felt without large amounts of wood and nails.' } },
    { id: 'mineraluld', color: 'navy', aisle: 'left', spots: [[63, 130]],
      name: { da: 'Mineraluld', en: 'Mineral wool' },
      instructions: { da: 'Isolering som rockwool og glasuld – gerne i lukkede sække.', en: 'Insulation such as rockwool and glass wool – preferably in closed bags.' } },
    { id: 'gips', color: 'navy', aisle: 'left', spots: [[63, 189]],
      name: { da: 'Gips', en: 'Plasterboard' },
      instructions: { da: 'Gipsplader uden fliser og træ. Skruer må gerne sidde i.', en: 'Plasterboard without tiles and wood. Screws can stay in.' } },
    { id: 'polstrede-moebler', color: 'darkred', aisle: 'left', spots: [[63, 249]],
      name: { da: 'Polstrede møbler', en: 'Upholstered furniture' },
      instructions: { da: 'Sofaer, lænestole og andre polstrede møbler.', en: 'Sofas, armchairs and other upholstered furniture.' } },
    { id: 'tekstilaffald', color: 'darkred', aisle: 'inner', spots: [[445, 447]],
      name: { da: 'Tekstilaffald', en: 'Textile waste' },
      instructions: { da: 'Ødelagte tekstiler – rent og tørt i poser.', en: 'Damaged textiles – clean and dry in bags.' } },
    { id: 'sko-toej', color: 'lightgreen', aisle: 'inner', spots: [[445, 532]],
      name: { da: 'Sko & tøj', en: 'Shoes & clothes' },
      instructions: { da: 'Brugbart tøj og sko til genbrug – rent og i poser.', en: 'Usable clothes and shoes for reuse – clean and bagged.' } },
    { id: 'mursten-tegl', color: 'navy', aisle: 'right', spots: [[505, 542]],
      name: { da: 'Mursten & tegl', en: 'Bricks & tiles' },
      instructions: { da: 'Rene mursten og tegl uden puds og beton.', en: 'Clean bricks and roof tiles without plaster and concrete.' } },
    { id: 'beton', color: 'navy', aisle: 'right', spots: [[505, 640]],
      name: { da: 'Beton', en: 'Concrete' },
      instructions: { da: 'Beton og murbrokker uden armering og træ.', en: 'Concrete and rubble without rebar and wood.' } },
    { id: 'sanitet', color: 'navy', aisle: 'right', spots: [[505, 444]],
      name: { da: 'Sanitet', en: 'Sanitary ware' },
      instructions: { da: 'Toiletter, håndvaske og andet porcelæn fra badeværelset.', en: 'Toilets, sinks and other bathroom porcelain.' } },
    { id: 'jord', color: 'darkgreen', aisle: 'right', spots: [[505, 228]],
      name: { da: 'Jord', en: 'Soil' },
      instructions: { da: 'Ren jord uden rødder, sten og byggeaffald.', en: 'Clean soil without roots, stones and construction waste.' } },
    { id: 'kompost', color: 'darkgreen', aisle: 'right', spots: [[505, 342]],
      name: { da: 'Kompost', en: 'Compost' },
      instructions: { da: 'Haveaffald: grene, græs, blade og planter. Tøm sækkene.', en: 'Garden waste: branches, grass, leaves and plants. Empty the bags.' } },
    { id: 'rest-efter-sortering', color: 'black', aisle: 'mid', spots: [[218, 514], [218, 574]],
      name: { da: 'Rest efter sortering', en: 'Residual after sorting' },
      instructions: { da: 'Det, der er tilbage, når alt andet er sorteret fra.', en: 'What is left when everything else has been sorted out.' } },
    { id: 'stor-rest', color: 'black', aisle: 'mid', spots: [[218, 394]],
      name: { da: 'Stor rest efter sortering', en: 'Large residual waste' },
      instructions: { da: 'Store ting, der ikke kan genanvendes, fx madrasser og gulvtæpper.', en: 'Large items that cannot be recycled, e.g. mattresses and carpets.' } },
    { id: 'til-nedgravning', color: 'black', aisle: 'mid', spots: [[218, 641]],
      name: { da: 'Til nedgravning', en: 'For landfill' },
      instructions: { da: 'Ikke-brændbart affald til deponi, fx keramik og porcelæn.', en: 'Non-combustible waste for landfill, e.g. ceramics and porcelain.' } },
    { id: 'genbrug', color: 'lightgreen', aisle: 'inner', spots: [[445, 620]],
      name: { da: 'Direkte genbrug', en: 'Direct reuse' },
      instructions: { da: 'Ting, der stadig kan bruges – stil dem i GenTag-området.', en: 'Things that can still be used – place them in the GenTag area.' } },
    { id: 'elektronik', color: 'orange', aisle: 'bottom', spots: [[562, 744]],
      name: { da: 'Elektronik', en: 'Electronics' },
      instructions: { da: 'Alt med ledning eller batteri: lamper, computere og småt elektronik.', en: 'Anything with a cord or battery: lamps, computers and small electronics.' } },
    { id: 'koeleudstyr', color: 'orange', aisle: 'bottom', spots: [[562, 796]],
      name: { da: 'Køleudstyr', en: 'Cooling appliances' },
      instructions: { da: 'Køleskabe og frysere – stilles hele.', en: 'Fridges and freezers – place them whole.' } },
    { id: 'hvidevarer', color: 'orange', aisle: 'bottom', spots: [[562, 848]],
      name: { da: 'Hårde hvidevarer', en: 'White goods' },
      instructions: { da: 'Vaskemaskiner, komfurer og opvaskemaskiner.', en: 'Washing machines, stoves and dishwashers.' } },
    { id: 'farligt-affald', color: 'red', aisle: 'bottom', spots: [[412, 800]],
      name: { da: 'Farligt affald', en: 'Hazardous waste' },
      instructions: { da: 'Maling, kemikalier, spraydåser, batterier og olie. Afleveres til personalet i miljøhallen.', en: 'Paint, chemicals, spray cans, batteries and oil. Hand it to the staff in the hazardous waste hall.' } }
];

/* ── Routing ───────────────────────────────────────────────────
 * Roads on the schematic map: an entry road from the entrance, a bottom
 * road, and four vertical aisles. Every container hangs off one aisle,
 * so a route is always: entrance -> bottom road -> aisle -> container. */

const ENTRANCE = [240, 858];
const ROAD_TOP = 150;
const ROAD_BOTTOM = 700;

function routeTo(fraction) {
    const [sx, sy] = fraction.spots[0];
    const points = [ENTRANCE, [240, ROAD_BOTTOM]];
    if (fraction.aisle === 'bottom') {
        if (sx !== 240) points.push([sx, ROAD_BOTTOM]);
        points.push([sx, sy]);
        return points;
    }
    const ax = AISLE[fraction.aisle];
    const ay = Math.max(ROAD_TOP + 17, Math.min(ROAD_BOTTOM - 17, sy));
    points.push([ax, ROAD_BOTTOM]);
    points.push([ax, ay]);
    points.push([sx, sy]);
    return points;
}

/* ── i18n helpers ──────────────────────────────────────────── */

function t(key) {
    const dictionary = translations[currentLanguage] || translations.da;
    return dictionary[key] ?? translations.da[key] ?? key;
}

function getPreferredLanguage() {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : 'da';
}

function setLanguage(language) {
    if (!SUPPORTED_LANGUAGES.includes(language) || language === currentLanguage) return;
    currentLanguage = language;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    applyTranslations();
}

function applyTranslations() {
    document.documentElement.lang = currentLanguage;
    document.title = t('pageTitle');

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll('[data-language-option]').forEach((button) => {
        const isActive = button.dataset.languageOption === currentLanguage;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    renderMap();
    if (currentResult) showResult(currentResult, { scroll: false });
}

/* ── Image handling ────────────────────────────────────────── */

function fileToBase64Jpeg(file, maxSize = 1024) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
        img.src = url;
    });
}

/* ── API (primary + Gemini worker fallback) ────────────────── */

async function fetchWithTimeout(url, options) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), API_TIMEOUT_MS);
    try {
        return await fetch(url, { ...options, signal: abort.signal });
    } finally {
        clearTimeout(timer);
    }
}

function extractFractionIds(text) {
    const found = [];
    const lower = text.toLowerCase();
    FRACTIONS.forEach((fraction) => {
        const index = lower.indexOf(`"${fraction.id}"`) !== -1 ? lower.indexOf(`"${fraction.id}"`) : lower.indexOf(fraction.id);
        if (index !== -1) found.push({ id: fraction.id, index });
    });
    return found.sort((a, b) => a.index - b.index).map((f) => f.id);
}

async function classifyImage(imageBase64) {
    try {
        const response = await fetchWithTimeout(SORTING_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site: SITE_ID, image: imageBase64, language: currentLanguage })
        });
        const data = await response.json();
        if (response.ok && data.ok === true && Array.isArray(data.result?.fractionIds)) {
            return data.result.fractionIds;
        }
        throw new Error('bad response');
    } catch {
        // Fallback: existing Gemini worker
        const ids = FRACTIONS.map((f) => f.id).join(', ');
        const prompt = `You are a waste sorting assistant at a Danish recycling center (genbrugsplads). ` +
            `Look at the photo and decide which waste fraction the main object belongs to. ` +
            `Answer ONLY with a JSON array of 1-3 fraction ids, most likely first, chosen from: [${ids}]. ` +
            `Example answer: ["pap", "rest-efter-sortering"]`;
        const response = await fetchWithTimeout(FALLBACK_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageBase64, text: prompt })
        });
        const data = await response.json();
        const reply = data?.response || data?.result?.fraction || '';
        return extractFractionIds(String(reply));
    }
}

/* ── Map rendering ─────────────────────────────────────────── */

const SVG_NS = 'http://www.w3.org/2000/svg';
let currentResult = null;

function svgEl(tag, attrs = {}, text = null) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (text !== null) el.textContent = text;
    return el;
}

function wrapName(name) {
    if (name.length <= 11) return [name];
    const hyphen = name.indexOf('-');
    if (hyphen > 2 && hyphen < name.length - 3) {
        return [name.slice(0, hyphen + 1), name.slice(hyphen + 1)];
    }
    const words = name.split(' ');
    if (words.length === 1) return [name];
    let first = words[0];
    let i = 1;
    while (i < words.length - 1 && (first + ' ' + words[i]).length <= 12) {
        first += ' ' + words[i];
        i++;
    }
    return [first, words.slice(i).join(' ')];
}

function renderMap(activeFractionId = currentResult?.fractionIds?.[0] ?? null) {
    const svg = document.getElementById('site-map');
    svg.innerHTML = '';

    // Ground
    svg.appendChild(svgEl('rect', { x: 6, y: 6, width: 608, height: 888, rx: 26, class: 'map-ground' }));
    svg.appendChild(svgEl('text', { x: 310, y: 52, class: 'map-site-title' }, 'Vojens Genbrugsplads'));

    // Platform islands (container rows)
    [[36, 100, 54, 592], [191, 164, 54, 511], [325, 164, 54, 511], [418, 275, 54, 372], [478, 200, 54, 465], [518, 718, 88, 168]]
        .forEach(([x, y, w, h]) => svg.appendChild(svgEl('rect', { x, y, width: w, height: h, rx: 14, class: 'map-island' })));

    // Roads: loop + two inner aisles + entry road
    const roads = [
        `M ${AISLE.left} ${ROAD_TOP} H ${AISLE.right} V ${ROAD_BOTTOM} H ${AISLE.left} Z`,
        `M ${AISLE.mid} ${ROAD_TOP} V ${ROAD_BOTTOM}`,
        `M ${AISLE.inner} ${ROAD_TOP} V ${ROAD_BOTTOM}`,
        `M 240 ${ROAD_BOTTOM} V 880`
    ];
    roads.forEach((d) => svg.appendChild(svgEl('path', { d, class: 'map-road' })));
    roads.forEach((d) => svg.appendChild(svgEl('path', { d, class: 'map-road-line' })));

    // Buildings
    const staff = svgEl('g', { class: 'map-building' });
    staff.appendChild(svgEl('rect', { x: 60, y: 762, width: 122, height: 86, rx: 12 }));
    staff.appendChild(svgEl('text', { x: 121, y: 810 }, t('mapStaff')));
    svg.appendChild(staff);

    const hall = svgEl('g', { class: 'map-building' });
    hall.appendChild(svgEl('rect', { x: 320, y: 748, width: 186, height: 100, rx: 12 }));
    hall.appendChild(svgEl('text', { x: 413, y: 775 }, t('mapHall')));
    svg.appendChild(hall);

    // Route
    const activeFraction = FRACTIONS.find((f) => f.id === activeFractionId);
    if (activeFraction) {
        const route = routeTo(activeFraction);
        svg.appendChild(svgEl('polyline', {
            points: route.map((p) => p.join(',')).join(' '),
            class: 'map-route'
        }));
        const [dx, dy] = activeFraction.spots[0];
        svg.appendChild(svgEl('circle', { cx: dx, cy: dy, r: 26, class: 'map-destination-pulse' }));
    }

    // Container tiles
    FRACTIONS.forEach((fraction) => {
        fraction.spots.forEach(([x, y], spotIndex) => {
            const group = svgEl('g', {
                class: `map-tile${fraction.id === activeFractionId ? ' active' : ''}`,
                tabindex: 0,
                role: 'button',
                'aria-label': fraction.name[currentLanguage]
            });
            // generous invisible tap target
            group.appendChild(svgEl('rect', { x: x - 26, y: y - 26, width: 52, height: 52, fill: 'transparent' }));
            group.appendChild(svgEl('rect', {
                x: x - 16, y: y - 16, width: 32, height: 32, rx: 7,
                fill: COLORS[fraction.color], class: 'map-tile-box'
            }));
            if (spotIndex === 0) {
                const lines = wrapName(fraction.name[currentLanguage]);
                lines.forEach((line, li) => {
                    group.appendChild(svgEl('text', {
                        x, y: y + 27 + li * 10, class: 'map-tile-label'
                    }, line));
                });
            }
            const select = () => showResult({ fractionIds: [fraction.id] }, { scroll: false });
            group.addEventListener('click', select);
            group.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    select();
                }
            });
            svg.appendChild(group);
        });
    });

    // Entrance
    const entrance = svgEl('g', { class: 'map-entrance' });
    entrance.appendChild(svgEl('circle', { cx: ENTRANCE[0], cy: ENTRANCE[1], r: 13 }));
    entrance.appendChild(svgEl('path', {
        d: `M ${ENTRANCE[0]} ${ENTRANCE[1] + 6} L ${ENTRANCE[0]} ${ENTRANCE[1] - 6} M ${ENTRANCE[0] - 5} ${ENTRANCE[1] - 1} L ${ENTRANCE[0]} ${ENTRANCE[1] - 6} L ${ENTRANCE[0] + 5} ${ENTRANCE[1] - 1}`,
        class: 'map-entrance-arrow'
    }));
    entrance.appendChild(svgEl('text', { x: ENTRANCE[0] + 22, y: ENTRANCE[1] + 5 }, t('mapEntrance')));
    svg.appendChild(entrance);
}

/* ── Result card ───────────────────────────────────────────── */

function showResult(result, { scroll = true } = {}) {
    currentResult = result;
    const card = document.getElementById('result-card');
    const primary = FRACTIONS.find((f) => f.id === result.fractionIds[0]);
    if (!primary) return;

    document.getElementById('result-fraction-name').textContent = primary.name[currentLanguage];
    document.getElementById('result-instructions').textContent = primary.instructions[currentLanguage];

    const alternates = result.fractionIds.slice(1)
        .map((id) => FRACTIONS.find((f) => f.id === id))
        .filter(Boolean);
    const alternatesWrap = document.getElementById('result-alternates');
    alternatesWrap.hidden = alternates.length === 0;
    const chips = document.getElementById('alternates-chips');
    chips.innerHTML = '';
    alternates.forEach((fraction) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = fraction.name[currentLanguage];
        chip.addEventListener('click', () => {
            showResult({ fractionIds: [fraction.id, ...result.fractionIds.filter((id) => id !== fraction.id)] }, { scroll: false });
        });
        chips.appendChild(chip);
    });

    card.hidden = false;
    renderMap(primary.id);
    if (scroll) {
        document.getElementById('map-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/* ── Photo flow ────────────────────────────────────────────── */

function setStatus(message, isError = false) {
    const status = document.getElementById('photo-status');
    status.textContent = message;
    status.classList.toggle('error', isError);
}

async function handleFile(file) {
    if (!file) return;

    const preview = document.getElementById('photo-preview');
    const previewImage = document.getElementById('preview-image');
    previewImage.src = URL.createObjectURL(file);
    preview.hidden = false;

    const photoButton = document.getElementById('photo-button');
    photoButton.disabled = true;
    setStatus(t('analyzing'));

    try {
        const imageBase64 = await fileToBase64Jpeg(file);
        const fractionIds = await classifyImage(imageBase64);
        const valid = fractionIds.filter((id) => FRACTIONS.some((f) => f.id === id));
        if (valid.length === 0) {
            setStatus(t('noMatch'), true);
        } else {
            setStatus('');
            showResult({ fractionIds: valid });
        }
    } catch {
        setStatus(t('analyzeFailed'), true);
    } finally {
        photoButton.disabled = false;
    }
}

/* ── Init ──────────────────────────────────────────────────── */

document.getElementById('photo-button').addEventListener('click', () => {
    document.getElementById('camera-input').click();
});
document.getElementById('library-button').addEventListener('click', () => {
    document.getElementById('library-input').click();
});
['camera-input', 'library-input'].forEach((id) => {
    document.getElementById(id).addEventListener('change', (event) => {
        handleFile(event.target.files[0]);
        event.target.value = '';
    });
});

document.querySelectorAll('[data-language-option]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.languageOption));
});

currentLanguage = getPreferredLanguage();
applyTranslations();
