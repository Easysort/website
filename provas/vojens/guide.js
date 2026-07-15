/* Sorting guide for Provas / Vojens Genbrugsplads.
 *
 * API contract (not live yet — falls back to local keyword matching):
 *   POST SORTING_API_URL
 *   body:     { site: "provas-vojens", query: string, language: "da" | "en" }
 *   response: { ok: true, result: { fractionIds: string[], note?: string } }
 * fractionIds must match ids in FRACTIONS below (first id = primary suggestion).
 */

const SORTING_API_URL = 'https://api.easysort.org/v1/sorting-guide';
const API_TIMEOUT_MS = 6000;
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
        guideSubtitle: 'Skriv, hvad du har med, så viser vi dig den rigtige container – og vejen derhen fra indgangen.',
        searchPlaceholder: 'F.eks. sofa, maling, pizzabakke ...',
        searchButton: 'Find container',
        searching: 'Søger ...',
        quickPicksLabel: 'Prøv fx',
        containerLabel: 'Container {num}',
        areaLabel: 'Ved indgangen',
        youSearchedFor: 'Du søgte efter “{query}”',
        alsoMaybe: 'Måske i stedet:',
        offlineNote: 'Vejledende svar – guiden svarede lokalt, da tjenesten ikke kunne nås.',
        noMatch: 'Vi kunne ikke finde et sikkert svar. Spørg personalet på pladsen, eller vælg en fraktion nedenfor.',
        mapLabel: 'Kort over pladsen',
        mapTitle: 'Sådan finder du derhen.',
        mapSubtitle: 'Ruten fra indgangen er markeret med grønt. Tryk på en container for at se ruten.',
        mapCaption: 'Kortet er vejledende. Spørg altid personalet, hvis du er i tvivl.',
        mapEntrance: 'Indgang',
        mapYouAreHere: 'Du er her',
        allFractionsLabel: 'Eller vælg selv',
        allFractionsTitle: 'Alle fraktioner på pladsen.',
        footerSummary: 'Sorteringsguide til Vojens Genbrugsplads, drevet af Provas.',
        footerContactLabel: 'Kontakt:',
        footerBackLink: 'Tilbage til easysort.org',
        quickPicks: ['Sofa', 'Maling', 'Pizzabakke', 'Spejl', 'Cykel', 'Flamingo']
    },
    en: {
        pageTitle: 'Sorting guide – Vojens Recycling Center | Easysort',
        guideKicker: 'Provas · Vojens Recycling Center',
        guideTitle: 'What are you dropping off?',
        guideSubtitle: 'Tell us what you brought, and we will point you to the right container – and the way there from the entrance.',
        searchPlaceholder: 'E.g. sofa, paint, pizza box ...',
        searchButton: 'Find container',
        searching: 'Searching ...',
        quickPicksLabel: 'Try e.g.',
        containerLabel: 'Container {num}',
        areaLabel: 'Near the entrance',
        youSearchedFor: 'You searched for “{query}”',
        alsoMaybe: 'Possibly instead:',
        offlineNote: 'Indicative answer – the guide answered locally because the service could not be reached.',
        noMatch: 'We could not find a confident answer. Ask the staff on site, or pick a fraction below.',
        mapLabel: 'Site map',
        mapTitle: 'How to get there.',
        mapSubtitle: 'The route from the entrance is marked in green. Tap a container to see the route.',
        mapCaption: 'The map is indicative. Always ask the staff if in doubt.',
        mapEntrance: 'Entrance',
        mapYouAreHere: 'You are here',
        allFractionsLabel: 'Or choose yourself',
        allFractionsTitle: 'All fractions on site.',
        footerSummary: 'Sorting guide for Vojens Recycling Center, operated by Provas.',
        footerContactLabel: 'Contact:',
        footerBackLink: 'Back to easysort.org',
        quickPicks: ['Sofa', 'Paint', 'Pizza box', 'Mirror', 'Bicycle', 'Styrofoam']
    }
};

/* ── Fractions: names, instructions, keywords, map position ──
 * pos = center of the container on the schematic map (viewBox 1000x660).
 * num = container number on site (null for areas like the hazardous waste shed). */

const FRACTIONS = [
    { id: 'cardboard', num: 1, pos: [62, 480],
      name: { da: 'Pap', en: 'Cardboard' },
      instructions: { da: 'Rent og tørt pap. Slå kasserne flade, og fjern flamingo og plastfyld først.', en: 'Clean, dry cardboard. Flatten boxes and remove styrofoam and plastic filling first.' },
      keywords: ['pap', 'papkasse', 'karton', 'flyttekasse', 'cardboard', 'box', 'moving box'] },
    { id: 'paper', num: 2, pos: [62, 400],
      name: { da: 'Papir', en: 'Paper' },
      instructions: { da: 'Aviser, reklamer, kontorpapir og bøger uden stift ryg.', en: 'Newspapers, flyers, office paper and paperback books.' },
      keywords: ['papir', 'avis', 'aviser', 'reklamer', 'magasin', 'bog', 'paper', 'newspaper', 'magazine', 'book'] },
    { id: 'glass', num: 3, pos: [62, 320],
      name: { da: 'Glas & flasker', en: 'Glass & bottles' },
      instructions: { da: 'Flasker og emballageglas. Tøm dem – skyl gerne. Ikke spejle eller vinduesglas.', en: 'Bottles and packaging glass. Empty them – rinse if possible. No mirrors or window glass.' },
      keywords: ['glas', 'flaske', 'flasker', 'syltetøjsglas', 'vinflaske', 'glass', 'bottle', 'jar'] },
    { id: 'metal', num: 4, pos: [62, 240],
      name: { da: 'Metal & jern', en: 'Metal & iron' },
      instructions: { da: 'Alt af metal: rør, søm, gryder, cykler og havemøbler i metal.', en: 'Anything metal: pipes, nails, pots, bicycles and metal garden furniture.' },
      keywords: ['metal', 'jern', 'cykel', 'gryde', 'søm', 'rør', 'stål', 'aluminium', 'iron', 'bicycle', 'bike', 'steel', 'pots'] },
    { id: 'hard-plastic', num: 5, pos: [62, 160],
      name: { da: 'Hård plast', en: 'Hard plastic' },
      instructions: { da: 'Havemøbler i plast, spande, kasser og legetøj uden elektronik. Tøm for indhold.', en: 'Plastic garden furniture, buckets, crates and toys without electronics. Empty of contents.' },
      keywords: ['hård plast', 'plast', 'spand', 'plastkasse', 'havemøbler plast', 'legetøj', 'hard plastic', 'plastic', 'bucket', 'crate', 'toys'] },
    { id: 'plastic-film', num: 6, pos: [200, 57],
      name: { da: 'Plastfolie', en: 'Plastic film' },
      instructions: { da: 'Ren og tør blød plast: folie, poser og bobleplast. Ingen madrester.', en: 'Clean, dry soft plastic: film, bags and bubble wrap. No food residue.' },
      keywords: ['folie', 'plastfolie', 'blød plast', 'poser', 'plastpose', 'bobleplast', 'plastic film', 'soft plastic', 'plastic bag', 'bubble wrap'] },
    { id: 'wood', num: 7, pos: [300, 57],
      name: { da: 'Træ', en: 'Wood' },
      instructions: { da: 'Rent træ og møbler af træ. Søm og skruer må gerne sidde i.', en: 'Clean wood and wooden furniture. Nails and screws can stay in.' },
      keywords: ['træ', 'brædder', 'planker', 'træmøbler', 'wood', 'timber', 'planks', 'wooden'] },
    { id: 'impregnated-wood', num: 8, pos: [400, 57],
      name: { da: 'Imprægneret træ', en: 'Impregnated wood' },
      instructions: { da: 'Trykimprægneret træ, hegn og terrassebrædder. Holdes adskilt fra rent træ.', en: 'Pressure-treated wood, fencing and decking boards. Keep separate from clean wood.' },
      keywords: ['imprægneret', 'trykimprægneret', 'hegn', 'terrassebrædder', 'impregnated', 'pressure treated', 'decking', 'fence'] },
    { id: 'garden', num: 9, pos: [500, 57],
      name: { da: 'Haveaffald', en: 'Garden waste' },
      instructions: { da: 'Grene, græs, blade og planter. Tøm sække og tag dem med hjem igen.', en: 'Branches, grass, leaves and plants. Empty the bags and take them back home.' },
      keywords: ['haveaffald', 'grene', 'græs', 'blade', 'planter', 'hæk', 'garden waste', 'branches', 'grass', 'leaves', 'plants', 'hedge'] },
    { id: 'combustible', num: 10, pos: [600, 57],
      name: { da: 'Småt brændbart', en: 'Small combustible' },
      instructions: { da: 'Brændbart affald under 1 meter, fx snavset pap, flamingo og polstrede møbler i mindre dele.', en: 'Combustible waste under 1 metre, e.g. dirty cardboard, styrofoam and upholstered furniture in smaller parts.' },
      keywords: ['brændbart', 'småt brændbart', 'sofa', 'madras', 'pizzabakke', 'flamingo', 'tæppe', 'combustible', 'burnable', 'mattress', 'pizza box', 'styrofoam', 'carpet'] },
    { id: 'landfill', num: 11, pos: [700, 57],
      name: { da: 'Deponi', en: 'Landfill' },
      instructions: { da: 'Ikke-brændbart affald, der ikke kan genanvendes: spejle, keramik, porcelæn og vinduesglas.', en: 'Non-combustible waste that cannot be recycled: mirrors, ceramics, porcelain and window glass.' },
      keywords: ['deponi', 'spejl', 'keramik', 'porcelæn', 'vinduesglas', 'toilet', 'håndvask', 'landfill', 'mirror', 'ceramics', 'porcelain', 'window glass', 'sink'] },
    { id: 'concrete', num: 12, pos: [790, 57],
      name: { da: 'Beton & tegl', en: 'Concrete & bricks' },
      instructions: { da: 'Rene murbrokker, beton, tegl og fliser uden armering og træ.', en: 'Clean rubble, concrete, bricks and tiles without rebar and wood.' },
      keywords: ['beton', 'tegl', 'mursten', 'murbrokker', 'fliser', 'concrete', 'bricks', 'rubble', 'tiles'] },
    { id: 'gypsum', num: 13, pos: [938, 160],
      name: { da: 'Gips', en: 'Plasterboard' },
      instructions: { da: 'Gipsplader uden fliser og træ. Skruer må gerne sidde i.', en: 'Plasterboard without tiles and wood. Screws can stay in.' },
      keywords: ['gips', 'gipsplader', 'plasterboard', 'gypsum', 'drywall'] },
    { id: 'electronics', num: 14, pos: [938, 240],
      name: { da: 'Elektronik', en: 'Electronics' },
      instructions: { da: 'Alt med ledning eller batteri: lamper, computere, mobiler og småt elektronik.', en: 'Anything with a cord or battery: lamps, computers, phones and small electronics.' },
      keywords: ['elektronik', 'computer', 'mobil', 'lampe', 'tv', 'fjernsyn', 'ledning', 'electronics', 'phone', 'laptop', 'lamp', 'cable'] },
    { id: 'white-goods', num: 15, pos: [938, 320],
      name: { da: 'Hvidevarer', en: 'White goods' },
      instructions: { da: 'Køleskabe, frysere, vaskemaskiner og komfurer. Stilles hele ved containeren.', en: 'Fridges, freezers, washing machines and stoves. Place them whole next to the container.' },
      keywords: ['hvidevarer', 'køleskab', 'fryser', 'vaskemaskine', 'komfur', 'opvaskemaskine', 'fridge', 'freezer', 'washing machine', 'stove', 'dishwasher'] },
    { id: 'textiles', num: 16, pos: [938, 400],
      name: { da: 'Tekstiler', en: 'Textiles' },
      instructions: { da: 'Tøj, sko og tekstiler – også i stykker. Afleveres rent og tørt i poser.', en: 'Clothes, shoes and textiles – even damaged. Hand in clean and dry in bags.' },
      keywords: ['tekstil', 'tekstiler', 'tøj', 'sko', 'sengetøj', 'håndklæder', 'textiles', 'clothes', 'shoes', 'bedding', 'towels'] },
    { id: 'hazardous', num: null, pos: [340, 500],
      name: { da: 'Farligt affald', en: 'Hazardous waste' },
      instructions: { da: 'Maling, kemikalier, spraydåser, batterier og olie. Afleveres til personalet i huset ved indgangen.', en: 'Paint, chemicals, spray cans, batteries and oil. Hand it to the staff in the shed near the entrance.' },
      keywords: ['farligt', 'maling', 'kemikalier', 'spraydåse', 'batteri', 'batterier', 'olie', 'gift', 'hazardous', 'paint', 'chemicals', 'spray can', 'battery', 'oil'] },
    { id: 'reuse', num: null, pos: [560, 500],
      name: { da: 'Direkte genbrug', en: 'Direct reuse' },
      instructions: { da: 'Ting, der stadig kan bruges: møbler, service og legetøj. Stil dem i genbrugsområdet ved indgangen.', en: 'Things that can still be used: furniture, tableware and toys. Place them in the reuse area near the entrance.' },
      keywords: ['genbrug', 'direkte genbrug', 'brugbart', 'reuse', 'second hand', 'usable'] }
];

/* ── Map & routing ─────────────────────────────────────────────
 * One predefined walking road from the entrance around the site.
 * A route to a container = the road up to the container's nearest
 * point on it, plus a short spur to the container itself. */

const ENTRANCE = [140, 640];
const ROAD = [[140, 640], [140, 140], [860, 140], [860, 600]];

function projectOnSegment(p, a, b) {
    const abx = b[0] - a[0], aby = b[1] - a[1];
    const len2 = abx * abx + aby * aby;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / len2));
    return { point: [a[0] + t * abx, a[1] + t * aby], t };
}

function routeTo(target) {
    let best = { dist: Infinity, segIndex: 0, point: ROAD[0] };
    for (let i = 0; i < ROAD.length - 1; i++) {
        const { point } = projectOnSegment(target, ROAD[i], ROAD[i + 1]);
        const dist = Math.hypot(point[0] - target[0], point[1] - target[1]);
        if (dist < best.dist) {
            best = { dist, segIndex: i, point };
        }
    }
    return [...ROAD.slice(0, best.segIndex + 1), best.point, target];
}

/* ── i18n helpers ──────────────────────────────────────────── */

function t(key, replacements = {}) {
    const dictionary = translations[currentLanguage] || translations.da;
    const template = dictionary[key] ?? translations.da[key] ?? key;
    if (typeof template !== 'string') return template;
    return template.replace(/\{(\w+)\}/g, (_, token) => replacements[token] ?? `{${token}}`);
}

function containerLabel(fraction) {
    return fraction.num ? t('containerLabel', { num: fraction.num }) : t('areaLabel');
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

    document.getElementById('search-input').placeholder = t('searchPlaceholder');

    document.querySelectorAll('[data-language-option]').forEach((button) => {
        const isActive = button.dataset.languageOption === currentLanguage;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    renderQuickPicks();
    renderFractionGrid();
    renderMap();
    if (currentResult) {
        showResult(currentResult);
    }
}

/* ── API with local fallback ───────────────────────────────── */

function localLookup(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const scored = FRACTIONS
        .map((fraction) => {
            const hit = fraction.keywords.some((kw) => q.includes(kw) || kw.includes(q));
            return hit ? fraction.id : null;
        })
        .filter(Boolean);
    return scored;
}

async function lookupFractions(query) {
    try {
        const abort = new AbortController();
        const timer = setTimeout(() => abort.abort(), API_TIMEOUT_MS);
        const response = await fetch(SORTING_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site: SITE_ID, query, language: currentLanguage }),
            signal: abort.signal
        });
        clearTimeout(timer);
        const data = await response.json();
        if (!response.ok || data.ok !== true || !Array.isArray(data.result?.fractionIds)) {
            throw new Error('bad response');
        }
        return { fractionIds: data.result.fractionIds, note: data.result.note, offline: false };
    } catch {
        return { fractionIds: localLookup(query), offline: true };
    }
}

/* ── Rendering ─────────────────────────────────────────────── */

let currentResult = null;

function renderQuickPicks() {
    const wrap = document.getElementById('quick-picks');
    wrap.innerHTML = '';
    t('quickPicks').forEach((sample) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip';
        chip.textContent = sample;
        chip.addEventListener('click', () => {
            document.getElementById('search-input').value = sample;
            handleSearch(sample);
        });
        wrap.appendChild(chip);
    });
}

function renderFractionGrid() {
    const grid = document.getElementById('fraction-grid');
    grid.innerHTML = '';
    FRACTIONS.forEach((fraction) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'fraction-card';
        card.innerHTML = `
            <span class="fraction-num">${fraction.num ?? '★'}</span>
            <span class="fraction-name">${fraction.name[currentLanguage]}</span>
            <span class="fraction-where">${containerLabel(fraction)}</span>
        `;
        card.addEventListener('click', () => {
            showResult({ query: fraction.name[currentLanguage], fractionIds: [fraction.id], offline: false });
            document.getElementById('result-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        grid.appendChild(card);
    });
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
}

function renderMap(activeFractionId = currentResult?.fractionIds?.[0] ?? null) {
    const svg = document.getElementById('site-map');
    svg.innerHTML = '';

    svg.appendChild(svgEl('rect', { x: 8, y: 8, width: 984, height: 644, rx: 26, class: 'map-ground' }));

    const roadPoints = ROAD.map((p) => p.join(',')).join(' ');
    svg.appendChild(svgEl('polyline', { points: roadPoints, class: 'map-road' }));
    svg.appendChild(svgEl('polyline', { points: roadPoints, class: 'map-road-line' }));

    // Route from entrance to the active container
    const activeFraction = FRACTIONS.find((f) => f.id === activeFractionId);
    if (activeFraction) {
        const route = routeTo(activeFraction.pos);
        svg.appendChild(svgEl('polyline', {
            points: route.map((p) => p.join(',')).join(' '),
            class: 'map-route'
        }));
    }

    // Containers
    FRACTIONS.forEach((fraction) => {
        const [x, y] = fraction.pos;
        const isArea = fraction.num === null;
        const w = isArea ? 150 : 96;
        const h = isArea ? 78 : 60;
        const group = svgEl('g', {
            class: `map-container${fraction.id === activeFractionId ? ' active' : ''}`,
            tabindex: 0,
            role: 'button'
        });
        group.appendChild(svgEl('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 12 }));

        const numText = svgEl('text', { x, y: y - (isArea ? 12 : 4), class: 'map-container-num' });
        numText.textContent = fraction.num ?? '★';
        group.appendChild(numText);

        const nameText = svgEl('text', { x, y: y + (isArea ? 14 : 18), class: 'map-container-name' });
        nameText.textContent = fraction.name[currentLanguage];
        group.appendChild(nameText);

        const select = () => {
            showResult({ query: fraction.name[currentLanguage], fractionIds: [fraction.id], offline: false });
        };
        group.addEventListener('click', select);
        group.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                select();
            }
        });
        svg.appendChild(group);
    });

    // Entrance marker
    const entrance = svgEl('g', { class: 'map-entrance' });
    entrance.appendChild(svgEl('circle', { cx: ENTRANCE[0], cy: ENTRANCE[1] - 18, r: 11 }));
    const entranceLabel = svgEl('text', { x: ENTRANCE[0] + 24, y: ENTRANCE[1] - 12 });
    entranceLabel.textContent = `${t('mapEntrance')} · ${t('mapYouAreHere')}`;
    entrance.appendChild(entranceLabel);
    svg.appendChild(entrance);
}

function showResult(result) {
    currentResult = result;
    const card = document.getElementById('result-card');
    const primary = FRACTIONS.find((f) => f.id === result.fractionIds[0]);

    document.getElementById('result-query').textContent = t('youSearchedFor', { query: result.query });

    if (!primary) {
        document.getElementById('result-fraction-name').textContent = '—';
        document.getElementById('result-container').textContent = '';
        document.getElementById('result-instructions').textContent = t('noMatch');
        document.getElementById('result-alternates').hidden = true;
        document.getElementById('result-source').hidden = !result.offline;
        card.hidden = false;
        renderMap(null);
        return;
    }

    document.getElementById('result-fraction-name').textContent = primary.name[currentLanguage];
    document.getElementById('result-container').textContent = containerLabel(primary);
    document.getElementById('result-instructions').textContent = result.note || primary.instructions[currentLanguage];
    document.getElementById('result-source').hidden = !result.offline;

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
        chip.textContent = `${fraction.name[currentLanguage]} · ${containerLabel(fraction)}`;
        chip.addEventListener('click', () => {
            showResult({ ...result, fractionIds: [fraction.id, ...result.fractionIds.filter((id) => id !== fraction.id)] });
        });
        chips.appendChild(chip);
    });

    card.hidden = false;
    renderMap(primary.id);
}

/* ── Search flow ───────────────────────────────────────────── */

async function handleSearch(query) {
    const trimmed = query.trim();
    if (!trimmed) return;

    const button = document.getElementById('search-button');
    button.disabled = true;
    button.textContent = t('searching');

    const result = await lookupFractions(trimmed);
    showResult({ query: trimmed, ...result });
    document.getElementById('map-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

    button.disabled = false;
    button.textContent = t('searchButton');
}

/* ── Init ──────────────────────────────────────────────────── */

document.getElementById('search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    handleSearch(document.getElementById('search-input').value);
});

document.querySelectorAll('[data-language-option]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.languageOption));
});

currentLanguage = getPreferredLanguage();
applyTranslations();
