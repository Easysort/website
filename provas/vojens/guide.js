/* Sorting guide for Provas / Vojens Genbrugsplads.
 *
 * Flow: live camera (like the easysort.org front page) -> take a photo ->
 * API returns a fraction -> the map draws the route from the entrance to
 * the nearest matching container, respecting one-way roads.
 *
 * The map itself (roads, buildings, fractions, coordinates) is authored in
 * an external editor and loaded from vojens-genbrugsplads.json. This file
 * only knows how to render and route on it.
 *
 * Primary API (not live yet):
 *   POST SORTING_API_URL
 *   body:     { site: "provas-vojens", image: <base64 jpeg>, language: "da" | "en" }
 *   response: { ok: true, result: { fractionKeys: string[] } }   (primary first)
 *
 * Until it exists we fall back to the existing Easysort Gemini worker.
 */

const MAP_URL = 'vojens-genbrugsplads.json?v=20260715';
const SORTING_API_URL = 'https://api.easysort.org/v1/sorting-guide';
const FALLBACK_WORKER_URL = 'https://workers-playground-bitter-term-7fe4.lucas-vilsen.workers.dev/generate';
const API_TIMEOUT_MS = 20000;
const SITE_ID = 'provas-vojens';

const LANGUAGE_STORAGE_KEY = 'easysort-language';
const SUPPORTED_LANGUAGES = ['da', 'en'];
let currentLanguage = 'da';

const COLORS = {
    navy: '#2d5474', lightblue: '#2e7fb4', teal: '#33b58e', darkgreen: '#20603c',
    darkred: '#8e3049', purple: '#8e3d95', brown: '#77571e', sand: '#b99b62',
    slate: '#46585e', black: '#232323', lightgreen: '#6fb44e', orange: '#e28c2b',
    red: '#d0342c'
};

/* ── Static texts ──────────────────────────────────────────── */

const translations = {
    da: {
        pageTitle: 'Sorteringsguide – Vojens Genbrugsplads | Easysort',
        guideKicker: 'Provas · Vojens Genbrugsplads',
        guideTitle: 'Hvad skal du af med?',
        guideSubtitle: 'Tag et billede af dit affald, så finder vi den rigtige container og viser dig vejen fra indgangen.',
        placeholderDefault: 'Giv kameraadgang for at komme i gang',
        analyzeEnableCamera: 'Aktiver kamera for at fortsætte',
        analyzeWaste: 'Analyser affald',
        analyzing: 'Analyserer ...',
        cameraSwitchTitle: 'Skift kamera',
        cameraRequiresHttps: 'Kamera kræver HTTPS. Tryk for at prøve igen.',
        cameraApiUnsupported: 'Kamera understøttes ikke i denne browser.',
        cameraAccessDenied: 'Kameraadgang blev afvist. Tryk for at prøve igen.',
        cameraPermissionDenied: 'Kameratilladelse blev afvist. Giv adgang i browseren og tryk for at prøve igen.',
        cameraNotFound: 'Intet kamera fundet. Tryk for at prøve igen.',
        analyzeFailed: 'Vi kunne ikke analysere billedet. Prøv igen, eller spørg personalet.',
        noMatch: 'Vi er ikke sikre på, hvad det er. Prøv et billede tættere på, eller spørg personalet.',
        resultPill: 'Følg den grønne rute',
        multiSpotNote: 'Findes flere steder – ruten går til den nærmeste.',
        alsoMaybe: 'Andre muligheder:',
        mapCaption: 'Tryk på en container for at se ruten. Kortet er vejledende – spørg personalet, hvis du er i tvivl.',
        mapEntrance: 'Indgang',
        footerSummary: 'Sorteringsguide til Vojens Genbrugsplads, drevet af Provas.',
        footerContactLabel: 'Kontakt:',
        footerBackLink: 'Tilbage til easysort.org'
    },
    en: {
        pageTitle: 'Sorting guide – Vojens Recycling Center | Easysort',
        guideKicker: 'Provas · Vojens Recycling Center',
        guideTitle: 'What are you dropping off?',
        guideSubtitle: 'Take a photo of your waste and we will find the right container and show you the way from the entrance.',
        placeholderDefault: 'Allow camera access to get started',
        analyzeEnableCamera: 'Enable camera to continue',
        analyzeWaste: 'Analyze waste',
        analyzing: 'Analyzing ...',
        cameraSwitchTitle: 'Switch camera',
        cameraRequiresHttps: 'Camera requires HTTPS. Tap to try again.',
        cameraApiUnsupported: 'Camera is not supported in this browser.',
        cameraAccessDenied: 'Camera access was denied. Tap to try again.',
        cameraPermissionDenied: 'Camera permission was denied. Allow access in your browser and tap to try again.',
        cameraNotFound: 'No camera found. Tap to try again.',
        analyzeFailed: 'We could not analyze the photo. Try again, or ask the staff.',
        noMatch: 'We are not sure what this is. Try a closer photo, or ask the staff.',
        resultPill: 'Follow the green route',
        multiSpotNote: 'Available in several places – the route goes to the nearest one.',
        alsoMaybe: 'Other options:',
        mapCaption: 'Tap a container to see the route. The map is indicative – ask the staff if in doubt.',
        mapEntrance: 'Entrance',
        footerSummary: 'Sorting guide for Vojens Recycling Center, operated by Provas.',
        footerContactLabel: 'Contact:',
        footerBackLink: 'Back to easysort.org'
    }
};

/* ── Map data (loaded from JSON) ───────────────────────────── */

let MAP = null;
let FRACTIONS = [];          // grouped by key, each { key, color, name, instructions, spots }
let FRACTION_BY_KEY = new Map();
let ROADS = [];
let ENTRANCE = null;

function slugify(text) {
    return text.toLowerCase().trim()
        .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function deriveEntrance(roads) {
    let best = null;
    roads.forEach((road) => road.points.forEach((p) => {
        if (!best || p[1] > best[1] || (p[1] === best[1] && p[0] < best[0])) best = p;
    }));
    return best || [0, 0];
}

function buildFractions(rawFractions) {
    const groups = new Map();
    rawFractions.forEach((fr) => {
        const key = slugify(fr.name.da || fr.id);
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                color: fr.color,
                name: { da: fr.name.da, en: fr.name.en || fr.name.da },
                instructions: { da: fr.instructions?.da || '', en: fr.instructions?.en || fr.instructions?.da || '' },
                spots: []
            });
        }
        const group = groups.get(key);
        (fr.spots || []).forEach((spot) => group.spots.push(spot));
    });
    return [...groups.values()];
}

async function loadMap() {
    const response = await fetch(MAP_URL);
    MAP = await response.json();
    ROADS = MAP.roads || [];
    ENTRANCE = Array.isArray(MAP.entrance) ? MAP.entrance
        : (MAP.entrance && typeof MAP.entrance === 'object') ? [MAP.entrance.x, MAP.entrance.y]
        : deriveEntrance(ROADS);
    FRACTIONS = buildFractions(MAP.fractions || []);
    FRACTION_BY_KEY = new Map(FRACTIONS.map((f) => [f.key, f]));

    const svg = document.getElementById('site-map');
    if (MAP.viewBox) svg.setAttribute('viewBox', `0 0 ${MAP.viewBox[0]} ${MAP.viewBox[1]}`);
}

/* ── Routing engine (Dijkstra on the directed road graph) ──── */

function segIntersectionParams(p1, p2, p3, p4) {
    const d1x = p2[0] - p1[0], d1y = p2[1] - p1[1];
    const d2x = p4[0] - p3[0], d2y = p4[1] - p3[1];
    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < 1e-9) return null; // parallel
    const t = ((p3[0] - p1[0]) * d2y - (p3[1] - p1[1]) * d2x) / denom;
    const u = ((p3[0] - p1[0]) * d1y - (p3[1] - p1[1]) * d1x) / denom;
    if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) return null;
    return { t, u };
}

function buildGraph() {
    const raw = [];
    ROADS.forEach((road) => {
        for (let i = 0; i < road.points.length - 1; i++) {
            raw.push({ a: road.points[i], b: road.points[i + 1], oneway: !!road.oneway });
        }
    });

    // Split every segment where another crosses/touches it, so junctions
    // become shared graph nodes.
    const cuts = raw.map(() => [0, 1]);
    for (let i = 0; i < raw.length; i++) {
        for (let j = i + 1; j < raw.length; j++) {
            const hit = segIntersectionParams(raw[i].a, raw[i].b, raw[j].a, raw[j].b);
            if (hit) { cuts[i].push(hit.t); cuts[j].push(hit.u); }
        }
    }

    const nodes = [];
    const edges = [];

    function nodeAt(p) {
        for (let i = 0; i < nodes.length; i++) {
            if (Math.hypot(nodes[i][0] - p[0], nodes[i][1] - p[1]) < 1) return i;
        }
        nodes.push([p[0], p[1]]);
        edges.push([]);
        return nodes.length - 1;
    }

    function addEdge(a, b) {
        if (a === b) return;
        edges[a].push({ to: b, len: Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]) });
    }

    const segments = [];
    raw.forEach((seg, i) => {
        const ts = [...new Set(cuts[i])].sort((x, y) => x - y);
        for (let k = 0; k < ts.length - 1; k++) {
            const pa = [seg.a[0] + (seg.b[0] - seg.a[0]) * ts[k], seg.a[1] + (seg.b[1] - seg.a[1]) * ts[k]];
            const pb = [seg.a[0] + (seg.b[0] - seg.a[0]) * ts[k + 1], seg.a[1] + (seg.b[1] - seg.a[1]) * ts[k + 1]];
            const a = nodeAt(pa);
            const b = nodeAt(pb);
            if (a === b) continue;
            addEdge(a, b);
            if (!seg.oneway) addEdge(b, a);
            segments.push({ a, b, oneway: seg.oneway });
        }
    });

    return { nodes, edges, segments, nodeAt, addEdge };
}

function projectOnSegment(p, a, b) {
    const abx = b[0] - a[0], aby = b[1] - a[1];
    const len2 = abx * abx + aby * aby;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / len2));
    return [a[0] + t * abx, a[1] + t * aby];
}

function dijkstra(g, start) {
    const dist = new Array(g.nodes.length).fill(Infinity);
    const prev = new Array(g.nodes.length).fill(-1);
    const done = new Array(g.nodes.length).fill(false);
    dist[start] = 0;
    for (;;) {
        let u = -1;
        for (let i = 0; i < g.nodes.length; i++) {
            if (!done[i] && dist[i] < (u === -1 ? Infinity : dist[u])) u = i;
        }
        if (u === -1) break;
        done[u] = true;
        g.edges[u].forEach(({ to, len }) => {
            if (dist[u] + len < dist[to]) { dist[to] = dist[u] + len; prev[to] = u; }
        });
    }
    return { dist, prev };
}

/* A container is reached by driving on the roads and then walking a short
 * final approach ("spur") from the nearest road point. We only allow that
 * spur to be short, otherwise a route could cut straight across the site
 * and ignore one-way roads. If nothing is close enough, fall back to the
 * globally nearest access point. */
const MAX_SPUR = 130;

function routeToPoint(target) {
    const g = buildGraph();
    const candidates = [];
    g.segments.forEach(({ a, b, oneway }) => {
        const p = projectOnSegment(target, g.nodes[a], g.nodes[b]);
        const idx = g.nodeAt(p);
        if (idx !== a && idx !== b) {
            g.addEdge(a, idx);
            if (!oneway) g.addEdge(b, idx);
        }
        candidates.push({ idx, spur: Math.hypot(p[0] - target[0], p[1] - target[1]) });
    });

    const start = g.nodeAt(ENTRANCE);
    const { dist, prev } = dijkstra(g, start);

    let best = null;
    let fallback = null;
    candidates.forEach((c) => {
        if (dist[c.idx] === Infinity) return;
        const total = dist[c.idx] + c.spur;
        if (c.spur <= MAX_SPUR && (!best || total < best.total)) best = { ...c, total };
        if (!fallback || total < fallback.total) fallback = { ...c, total };
    });
    const chosen = best || fallback;
    if (!chosen) return { path: [ENTRANCE, target], cost: Infinity };

    const path = [];
    for (let u = chosen.idx; u !== -1; u = prev[u]) path.unshift(g.nodes[u]);
    path.push(target);
    return { path, cost: chosen.total };
}

/* Route to the nearest of a fraction's (possibly several) spots. */
function routeToFraction(fraction) {
    let best = null;
    fraction.spots.forEach((spot) => {
        const route = routeToPoint(spot);
        if (!best || route.cost < best.cost) best = { ...route, spot };
    });
    return best || { path: [ENTRANCE], cost: Infinity, spot: fraction.spots[0] };
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

    const switchButton = document.getElementById('camera-switch-btn');
    switchButton.title = t('cameraSwitchTitle');
    switchButton.setAttribute('aria-label', t('cameraSwitchTitle'));

    document.querySelectorAll('[data-language-option]').forEach((button) => {
        const isActive = button.dataset.languageOption === currentLanguage;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    updateAnalyzeButton(currentAnalyzeState);
    if (currentPlaceholderKey) setPlaceholder(currentPlaceholderIcon, currentPlaceholderKey);
    if (MAP) renderMap();
    if (currentResult) showResult(currentResult, { scroll: false });
}

/* ── Camera (same behavior as the front page demo) ─────────── */

let stream = null;
let isVideoActive = false;
let isRequestingCamera = false;
let availableCameras = [];
let currentCameraIndex = 0;
let currentAnalyzeState = 'disabled';
let currentPlaceholderIcon = '📷';
let currentPlaceholderKey = 'placeholderDefault';

function setPlaceholder(icon, messageKey) {
    currentPlaceholderIcon = icon;
    currentPlaceholderKey = messageKey;
    const placeholder = document.getElementById('webcam-placeholder');
    placeholder.querySelector('.webcam-icon').textContent = icon;
    placeholder.querySelector('.webcam-text').textContent = t(messageKey);

    const webcamArea = document.getElementById('webcam-area');
    webcamArea.style.cursor = 'pointer';
    webcamArea.onclick = () => {
        if (!isVideoActive && !isRequestingCamera) requestCameraAccess();
    };
}

function updateAnalyzeButton(state) {
    currentAnalyzeState = state;
    const button = document.getElementById('identify-btn');
    if (state === 'disabled') {
        button.disabled = true;
        button.textContent = t('analyzeEnableCamera');
    } else if (state === 'ready') {
        button.disabled = false;
        button.textContent = t('analyzeWaste');
    } else if (state === 'analyzing') {
        button.disabled = true;
        button.textContent = t('analyzing');
    }
}

async function getAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((device) => device.kind === 'videoinput');
    } catch {
        return [];
    }
}

async function requestCameraAccess() {
    const isSecure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
    if (!isSecure) { setPlaceholder('🚫', 'cameraRequiresHttps'); return; }
    if (isRequestingCamera) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPlaceholder('🚫', 'cameraApiUnsupported');
        return;
    }

    isRequestingCamera = true;
    const video = document.getElementById('webcam-video');
    const placeholder = document.getElementById('webcam-placeholder');
    const switchButton = document.getElementById('camera-switch-btn');

    try {
        if (stream) stream.getTracks().forEach((track) => track.stop());

        let constraints;
        if (availableCameras.length > 0 && availableCameras[currentCameraIndex]) {
            constraints = { video: { deviceId: { exact: availableCameras[currentCameraIndex].deviceId } } };
        } else {
            constraints = { video: { facingMode: { ideal: 'environment' } } };
        }

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        availableCameras = await getAvailableCameras();
        if (currentCameraIndex >= availableCameras.length) currentCameraIndex = 0;
        switchButton.style.display = availableCameras.length > 1 ? 'flex' : 'none';

        video.srcObject = stream;
        video.onloadedmetadata = async () => {
            try { await video.play(); } catch { /* autoplay quirks */ }
            video.classList.add('active');
            placeholder.classList.add('hidden');
            const webcamArea = document.getElementById('webcam-area');
            webcamArea.onclick = null;
            webcamArea.style.cursor = 'default';
            isVideoActive = true;
            updateAnalyzeButton('ready');
        };
    } catch (error) {
        let messageKey = 'cameraAccessDenied';
        if (error.name === 'NotAllowedError') messageKey = 'cameraPermissionDenied';
        else if (error.name === 'NotFoundError') messageKey = 'cameraNotFound';
        isVideoActive = false;
        video.classList.remove('active');
        placeholder.classList.remove('hidden');
        switchButton.style.display = 'none';
        updateAnalyzeButton('disabled');
        setPlaceholder('🚫', messageKey);
    } finally {
        isRequestingCamera = false;
    }
}

async function switchCamera() {
    if (availableCameras.length <= 1) return;
    currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
    await requestCameraAccess();
}

function captureFrame() {
    const video = document.getElementById('webcam-video');
    const canvas = document.getElementById('frozen-frame');
    if (!video.videoWidth || !video.videoHeight) return null;

    const maxSize = 1024;
    const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}

function showFrozenFrame() { document.getElementById('frozen-frame').classList.add('show'); }
function hideFrozenFrame() { document.getElementById('frozen-frame').classList.remove('show'); }

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

function extractFractionKeys(text) {
    const found = [];
    const lower = text.toLowerCase();
    FRACTIONS.forEach((fraction) => {
        const index = lower.indexOf(fraction.key);
        if (index !== -1) found.push({ key: fraction.key, index });
    });
    return found.sort((a, b) => a.index - b.index).map((f) => f.key);
}

async function classifyImage(imageBase64) {
    try {
        const response = await fetchWithTimeout(SORTING_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site: SITE_ID, image: imageBase64, language: currentLanguage })
        });
        const data = await response.json();
        if (response.ok && data.ok === true && Array.isArray(data.result?.fractionKeys)) {
            return data.result.fractionKeys;
        }
        throw new Error('bad response');
    } catch {
        // Fallback: existing Gemini worker
        const options = FRACTIONS.map((f) => `${f.key} (${f.name.da})`).join(', ');
        const prompt = `You are a waste sorting assistant at a Danish recycling center (genbrugsplads). ` +
            `Look at the photo and decide which waste fraction the main object belongs to. ` +
            `Answer ONLY with a JSON array of 1-3 fraction keys, most likely first, chosen from these options: [${options}]. ` +
            `Use the key (the part before the parenthesis). Example answer: ["pap", "rest-efter-sortering"]`;
        const response = await fetchWithTimeout(FALLBACK_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageBase64, text: prompt })
        });
        const data = await response.json();
        const reply = data?.response || '';
        return extractFractionKeys(String(reply));
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

function renderBox(box, className) {
    const g = svgEl('g', { class: className });
    g.appendChild(svgEl('rect', { x: box.x, y: box.y, width: box.width, height: box.height, rx: 12 }));
    const label = (box.label && (box.label[currentLanguage] || box.label.da)) || '';
    if (label) {
        g.appendChild(svgEl('text', { x: box.x + box.width / 2, y: box.y + 26 }, label));
    }
    return g;
}

function renderMap(activeKey = currentResult?.keys?.[0] ?? null) {
    const svg = document.getElementById('site-map');
    svg.innerHTML = '';
    const [vw, vh] = MAP.viewBox || [620, 900];

    svg.appendChild(svgEl('rect', { x: 6, y: 6, width: vw - 12, height: vh - 12, rx: 26, class: 'map-ground' }));
    if (MAP.siteName) {
        svg.appendChild(svgEl('text', { x: vw / 2, y: 52, class: 'map-site-title' }, MAP.siteName));
    }

    (MAP.islands || []).forEach((island) =>
        svg.appendChild(svgEl('rect', { x: island.x, y: island.y, width: island.width, height: island.height, rx: 14, class: 'map-island' })));

    if (MAP.staff) svg.appendChild(renderBox(MAP.staff, 'map-building'));
    (MAP.buildings || []).forEach((b) => svg.appendChild(renderBox(b, 'map-building')));

    // Roads
    ROADS.forEach((road) => {
        const points = road.points.map((p) => p.join(',')).join(' ');
        svg.appendChild(svgEl('polyline', { points, class: 'map-road' }));
        svg.appendChild(svgEl('polyline', { points, class: 'map-road-line' }));
    });

    // One-way arrows
    ROADS.filter((road) => road.oneway).forEach((road) => {
        for (let i = 0; i < road.points.length - 1; i++) {
            const [a, b] = [road.points[i], road.points[i + 1]];
            const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
            [0.33, 0.66].forEach((f) => {
                const x = a[0] + (b[0] - a[0]) * f;
                const y = a[1] + (b[1] - a[1]) * f;
                svg.appendChild(svgEl('path', {
                    d: 'M -5 -4 L 4 0 L -5 4',
                    class: 'map-oneway-arrow',
                    transform: `translate(${x} ${y}) rotate(${angle})`
                }));
            });
        }
    });

    // Route to the active fraction (nearest spot)
    const activeFraction = activeKey ? FRACTION_BY_KEY.get(activeKey) : null;
    let destinationSpot = null;
    if (activeFraction) {
        const route = routeToFraction(activeFraction);
        destinationSpot = route.spot;
        svg.appendChild(svgEl('polyline', {
            points: route.path.map((p) => p.join(',')).join(' '),
            class: 'map-route'
        }));
        svg.appendChild(svgEl('circle', { cx: route.spot[0], cy: route.spot[1], r: 26, class: 'map-destination-pulse' }));
    }

    // Container tiles
    FRACTIONS.forEach((fraction) => {
        const isActive = fraction.key === activeKey;
        fraction.spots.forEach(([x, y]) => {
            const isDestination = destinationSpot && x === destinationSpot[0] && y === destinationSpot[1];
            const group = svgEl('g', {
                class: `map-tile${isActive ? ' active' : ''}${isDestination ? ' destination' : ''}`,
                tabindex: 0,
                role: 'button',
                'aria-label': fraction.name[currentLanguage]
            });
            group.appendChild(svgEl('rect', { x: x - 26, y: y - 26, width: 52, height: 52, fill: 'transparent' }));
            group.appendChild(svgEl('rect', {
                x: x - 16, y: y - 16, width: 32, height: 32, rx: 7,
                fill: COLORS[fraction.color] || '#888', class: 'map-tile-box'
            }));
            wrapName(fraction.name[currentLanguage]).forEach((line, li) => {
                group.appendChild(svgEl('text', { x, y: y + 27 + li * 10, class: 'map-tile-label' }, line));
            });
            const select = () => showResult({ keys: [fraction.key] }, { scroll: false });
            group.addEventListener('click', select);
            group.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
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
    const primary = FRACTION_BY_KEY.get(result.keys[0]);
    if (!primary) return;

    document.getElementById('result-fraction-name').textContent = primary.name[currentLanguage];

    const base = primary.instructions[currentLanguage] || '';
    const note = primary.spots.length > 1 ? (base ? ' ' : '') + t('multiSpotNote') : '';
    document.getElementById('result-instructions').textContent = base + note;

    const alternates = result.keys.slice(1)
        .map((key) => FRACTION_BY_KEY.get(key))
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
            showResult({ keys: [fraction.key, ...result.keys.filter((key) => key !== fraction.key)] }, { scroll: false });
        });
        chips.appendChild(chip);
    });

    card.hidden = false;
    renderMap(primary.key);
    if (scroll) {
        document.getElementById('map-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/* ── Analyze flow ──────────────────────────────────────────── */

function setStatus(message, isError = false) {
    const status = document.getElementById('photo-status');
    status.textContent = message;
    status.classList.toggle('error', isError);
}

document.getElementById('identify-btn').addEventListener('click', async () => {
    if (!isVideoActive) return;
    const imageBase64 = captureFrame();
    if (!imageBase64) return;

    showFrozenFrame();
    updateAnalyzeButton('analyzing');
    setStatus('');

    try {
        const keys = await classifyImage(imageBase64);
        const valid = keys.filter((key) => FRACTION_BY_KEY.has(key));
        if (valid.length === 0) {
            setStatus(t('noMatch'), true);
        } else {
            showResult({ keys: valid });
        }
    } catch {
        setStatus(t('analyzeFailed'), true);
    } finally {
        hideFrozenFrame();
        updateAnalyzeButton('ready');
    }
});

/* ── Init ──────────────────────────────────────────────────── */

document.getElementById('camera-switch-btn').addEventListener('click', switchCamera);

document.querySelectorAll('[data-language-option]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.languageOption));
});

window.addEventListener('beforeunload', () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
});

currentLanguage = getPreferredLanguage();
setPlaceholder('📷', 'placeholderDefault');
updateAnalyzeButton('disabled');

loadMap()
    .then(() => { applyTranslations(); })
    .catch((error) => { console.error('Failed to load map', error); });

requestCameraAccess();
