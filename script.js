/* Front-page Sorting Guide demo.
 * Same classify call as the center guides (core/guide.js): one JPEG, a site
 * catalog, and a language. The page shows the waste fraction and the
 * recycling center. It does not draw a map, a route, or a site brand.
 */

const WORKER_URL = document.body.dataset.worker;
const LANGUAGE_STORAGE_KEY = 'easysort-language';
const SUPPORTED_LANGUAGES = ['en', 'da'];
const API_TIMEOUT_MS = 30000;

const SITES = {
    roskilde: { da: 'Roskilde Genbrugsplads', en: 'Roskilde Recycling Center' },
    jyllinge: { da: 'Jyllinge Genbrugsplads', en: 'Jyllinge Recycling Center' },
    vojens: { da: 'Vojens Genbrugsplads', en: 'Vojens Recycling Center' }
};

/* Per recycling center, ex. VAT. */
const OFFERS = {
    app: { setup: 15000, month: 5000 },
    box: { setup: 25000, month: 5000 },
    both: { setup: 35000, month: 8500 }
};

const translations = {
    en: {
        pageTitle: 'Sorting Guide — Easysort',
        title: 'Sorting Guide',
        description: 'Sorting Guide. Point a camera at an item. You get the waste fraction and the recycling center.',
        docs: 'docs',
        lead: 'Point a camera at an item. You get the waste fraction and the recycling center.',
        cameraLabel: 'Camera',
        cameraStart: 'Click to start',
        cameraRequiresHttps: 'Camera requires HTTPS.',
        cameraApiUnsupported: 'This browser has no camera API.',
        cameraAccessDenied: 'Camera access failed. Click to try again.',
        cameraPermissionDenied: 'Camera permission denied. Allow it, then click to try again.',
        cameraNotFound: 'No camera found.',
        switchCamera: 'Switch',
        analyzeNeedCamera: 'Enable camera',
        analyze: 'Analyze',
        analyzing: 'Analyzing…',
        photo: 'Photo',
        fractionLabel: 'Fraction',
        centerLabel: 'Center',
        centersLabel: 'Recycling center',
        privacy: 'The camera stays on your device until you analyze. Then we send that one photo.',
        privacyLink: 'Privacy',
        visionLink: 'Vision',
        specsTitle: 'Specifications',
        specAnswerLabel: 'Answer',
        specAnswer: 'within 8 seconds',
        specUnitLabel: 'Unit',
        specUnit: 'screen, lights, AI, onboard compute, data management',
        specWhereLabel: 'Where',
        specWhere: 'Danish recycling centers',
        specWebLabel: 'Web',
        specWeb: 'this page, free of charge',
        priceTitle: 'Price',
        offerApp: 'App',
        offerAppBody: 'The guide on a phone, for one center.',
        offerBox: 'Box',
        offerBoxBody: 'The unit at the center.',
        offerBoth: 'App + box',
        offerBothBody: 'Phone guide and the unit.',
        order: 'Order',
        priceNote: 'Per recycling center, ex. VAT. We confirm by email before invoicing.',
        orderSubject: 'Sorting Guide',
        orderBodyNote: 'Per recycling center, ex. VAT.',
        noItem: 'No item in the photo',
        askStaff: 'Ask the staff',
        failed: 'Analysis failed. Try again.'
    },
    da: {
        pageTitle: 'Sorteringsguide — Easysort',
        title: 'Sorteringsguide',
        description: 'Sorteringsguide. Peg kameraet mod en ting. Du får affaldsfraktionen og genbrugspladsen.',
        docs: 'docs',
        lead: 'Peg kameraet mod en ting. Du får affaldsfraktionen og genbrugspladsen.',
        cameraLabel: 'Kamera',
        cameraStart: 'Klik for at starte',
        cameraRequiresHttps: 'Kamera kræver HTTPS.',
        cameraApiUnsupported: 'Denne browser har intet kamera-API.',
        cameraAccessDenied: 'Kameraet kunne ikke åbnes. Klik for at prøve igen.',
        cameraPermissionDenied: 'Kameratilladelse blev afvist. Giv adgang, og klik for at prøve igen.',
        cameraNotFound: 'Intet kamera fundet.',
        switchCamera: 'Skift',
        analyzeNeedCamera: 'Tænd kamera',
        analyze: 'Analyser',
        analyzing: 'Analyserer…',
        photo: 'Foto',
        fractionLabel: 'Fraktion',
        centerLabel: 'Genbrugsplads',
        centersLabel: 'Genbrugsplads',
        privacy: 'Kameraet bliver på din enhed, indtil du analyserer. Så sender vi det ene billede.',
        privacyLink: 'Privatliv',
        visionLink: 'Vision',
        specsTitle: 'Specifikationer',
        specAnswerLabel: 'Svar',
        specAnswer: 'inden for 8 sekunder',
        specUnitLabel: 'Enhed',
        specUnit: 'skærm, lys, AI, beregning på enheden, datahåndtering',
        specWhereLabel: 'Hvor',
        specWhere: 'danske genbrugspladser',
        specWebLabel: 'Web',
        specWeb: 'denne side, gratis',
        priceTitle: 'Pris',
        offerApp: 'App',
        offerAppBody: 'Guiden på en telefon, til én plads.',
        offerBox: 'Boks',
        offerBoxBody: 'Enheden på pladsen.',
        offerBoth: 'App + boks',
        offerBothBody: 'Telefon og enhed.',
        order: 'Bestil',
        priceNote: 'Pr. genbrugsplads, ekskl. moms. Vi bekræfter på mail, før der faktureres.',
        orderSubject: 'Sorteringsguide',
        orderBodyNote: 'Pr. genbrugsplads, ekskl. moms.',
        noItem: 'Intet emne på billedet',
        askStaff: 'Spørg personalet',
        failed: 'Analysen mislykkedes. Prøv igen.'
    }
};

let language = 'en';
let site = 'roskilde';
let offer = 'box';
let stream = null;
let isVideoActive = false;
let isRequestingCamera = false;
let availableCameras = [];
let currentCameraIndex = 0;
let stillBase64 = null;
let analyzeState = 'disabled';
let placeholderKey = 'cameraStart';
let busy = false;

function t(key) {
    const dictionary = translations[language] || translations.en;
    return dictionary[key] || translations.en[key] || key;
}

function statusKeyFor(text) {
    for (const code of SUPPORTED_LANGUAGES) {
        for (const key of ['noItem', 'askStaff', 'failed']) {
            if (translations[code][key] === text) return key;
        }
    }
    return null;
}

function preferredLanguage() {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
    return navigator.language && navigator.language.toLowerCase().startsWith('da') ? 'da' : 'en';
}

function formatMoney(amount) {
    const formatted = new Intl.NumberFormat(language === 'da' ? 'da-DK' : 'en-GB').format(amount);
    return `${formatted} kr`;
}

function formatPrice(key) {
    const item = OFFERS[key];
    const setup = formatMoney(item.setup);
    const month = formatMoney(item.month);
    if (language === 'da') return `${setup} opstart + ${month}/md`;
    return `${setup} setup + ${month}/month`;
}

function selectedOffer() {
    const input = document.querySelector('input[name="offer"]:checked');
    return input && OFFERS[input.value] ? input.value : 'box';
}

function updateOrderLink() {
    offer = selectedOffer();
    const price = formatPrice(offer);
    const body = `${t(offer === 'app' ? 'offerApp' : offer === 'both' ? 'offerBoth' : 'offerBox')}\n${price}\n${t('orderBodyNote')}`;
    const href = `mailto:lucas@easysort.org?subject=${encodeURIComponent(t('orderSubject'))}&body=${encodeURIComponent(body)}`;
    document.getElementById('checkout').href = href;
    document.getElementById('checkout-price').textContent = price;
    document.querySelectorAll('[data-price-for]').forEach((node) => {
        node.textContent = formatPrice(node.dataset.priceFor);
    });
}

function renderTitle() {
    const title = document.getElementById('title');
    title.textContent = t('title');
    const dot = document.createElement('span');
    dot.textContent = '.';
    title.append(dot);
}

function applyLanguage() {
    document.documentElement.lang = language;
    document.title = t('pageTitle');
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', t('description'));
    renderTitle();
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-language-option]').forEach((button) => {
        const selected = button.dataset.languageOption === language;
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    document.getElementById('centers').setAttribute('aria-label', t('centersLabel'));
    document.getElementById('camera-status').textContent = t(placeholderKey);
    const fractionNode = document.getElementById('result-fraction');
    const statusKey = statusKeyFor(fractionNode.textContent);
    if (statusKey) fractionNode.textContent = t(statusKey);
    document.getElementById('result-center').textContent = SITES[site][language];
    updateAnalyzeButton(analyzeState);
    updateOrderLink();
}

function setLanguage(next) {
    if (!SUPPORTED_LANGUAGES.includes(next) || next === language) return;
    language = next;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    applyLanguage();
}

function setPlaceholder(messageKey) {
    placeholderKey = messageKey;
    document.getElementById('camera-status').textContent = t(messageKey);
}

function updateAnalyzeButton(state) {
    analyzeState = state;
    const button = document.getElementById('analyze-btn');
    if (state === 'analyzing') {
        button.disabled = true;
        button.textContent = t('analyzing');
        return;
    }
    const ready = isVideoActive || Boolean(stillBase64);
    button.disabled = !ready;
    button.textContent = ready ? t('analyze') : t('analyzeNeedCamera');
    analyzeState = ready ? 'ready' : 'disabled';
}

function setSite(next) {
    if (!SITES[next]) return;
    site = next;
    document.querySelectorAll('#centers button').forEach((button) => {
        button.setAttribute('aria-pressed', button.dataset.site === site ? 'true' : 'false');
    });
    document.getElementById('result-center').textContent = SITES[site][language];
    document.getElementById('result-fraction').textContent = '—';
}

function showFraction(text) {
    document.getElementById('result-fraction').textContent = text;
    document.getElementById('result-center').textContent = SITES[site][language];
}

async function getAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((device) => device.kind === 'videoinput');
    } catch {
        return [];
    }
}

function stopCamera() {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    isVideoActive = false;
    const video = document.getElementById('webcam-video');
    video.classList.remove('active');
    video.srcObject = null;
}

async function requestCameraAccess() {
    const secure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
    if (!secure) {
        setPlaceholder('cameraRequiresHttps');
        return;
    }
    if (isRequestingCamera) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPlaceholder('cameraApiUnsupported');
        return;
    }

    isRequestingCamera = true;
    const video = document.getElementById('webcam-video');
    const placeholder = document.getElementById('webcam-placeholder');
    const switchButton = document.getElementById('camera-switch-btn');
    stillBase64 = null;
    document.getElementById('frozen-frame').classList.remove('show');

    try {
        if (stream) stream.getTracks().forEach((track) => track.stop());
        const known = availableCameras[currentCameraIndex];
        const constraints = known
            ? { video: { deviceId: { exact: known.deviceId } }, audio: false }
            : { video: { facingMode: { ideal: 'environment' } }, audio: false };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        availableCameras = await getAvailableCameras();
        if (currentCameraIndex >= availableCameras.length) currentCameraIndex = 0;
        switchButton.hidden = availableCameras.length < 2;
        video.srcObject = stream;
        video.onloadedmetadata = async () => {
            try { await video.play(); } catch { /* autoplay can reject without a gesture */ }
            video.classList.add('active');
            placeholder.hidden = true;
            isVideoActive = true;
            updateAnalyzeButton('ready');
        };
    } catch (error) {
        let messageKey = 'cameraAccessDenied';
        if (error.name === 'NotAllowedError') messageKey = 'cameraPermissionDenied';
        else if (error.name === 'NotFoundError') messageKey = 'cameraNotFound';
        isVideoActive = false;
        video.classList.remove('active');
        placeholder.hidden = false;
        switchButton.hidden = true;
        updateAnalyzeButton('disabled');
        setPlaceholder(messageKey);
    } finally {
        isRequestingCamera = false;
    }
}

function visibleVideoRect(video) {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const full = { sx: 0, sy: 0, sw: vw, sh: vh };
    const box = video.getBoundingClientRect();
    if (!box.width || !box.height) return full;
    const fit = getComputedStyle(video).objectFit;
    if (fit === 'contain' || fit === 'scale-down' || fit === 'none') return full;
    const scale = Math.max(box.width / vw, box.height / vh);
    const sw = box.width / scale;
    const sh = box.height / scale;
    return {
        sx: Math.max(0, (vw - sw) / 2),
        sy: Math.max(0, (vh - sh) / 2),
        sw: Math.min(vw, sw),
        sh: Math.min(vh, sh)
    };
}

function captureFrame() {
    const video = document.getElementById('webcam-video');
    const canvas = document.getElementById('frozen-frame');
    if (!video.videoWidth || !video.videoHeight) return null;
    const source = visibleVideoRect(video);
    const scale = Math.min(1, 1024 / Math.max(source.sw, source.sh));
    canvas.width = Math.max(1, Math.round(source.sw * scale));
    canvas.height = Math.max(1, Math.round(source.sh * scale));
    canvas.getContext('2d').drawImage(
        video,
        source.sx, source.sy, source.sw, source.sh,
        0, 0, canvas.width, canvas.height
    );
    canvas.classList.add('show');
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}

function usePhoto(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const image = new Image();
        image.onload = () => {
            stopCamera();
            const canvas = document.getElementById('frozen-frame');
            const scale = Math.min(1, 1024 / Math.max(image.width, image.height));
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            canvas.classList.add('show');
            document.getElementById('webcam-placeholder').hidden = true;
            stillBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            document.getElementById('camera-switch-btn').hidden = true;
            updateAnalyzeButton('ready');
        };
        image.alt = '';
        image.src = reader.result;
    };
    reader.readAsDataURL(file);
}

async function classify(imageBase64) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), API_TIMEOUT_MS);
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: abort.signal,
            body: JSON.stringify({
                image: imageBase64,
                language,
                site,
                source: 'web',
                client: 'home',
                page: location.pathname
            })
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || data.ok !== true || !data.result) {
            throw new Error('bad response');
        }
        return data.result;
    } finally {
        clearTimeout(timer);
    }
}

function fractionText(result) {
    const fraction = typeof result.fraction === 'string' ? result.fraction.trim() : '';
    if (fraction) return fraction;
    if (result.noItem === true) return t('noItem');
    return t('askStaff');
}

async function analyze() {
    if (busy) return;
    const image = isVideoActive ? captureFrame() : stillBase64;
    if (!image) {
        updateAnalyzeButton('disabled');
        return;
    }
    busy = true;
    updateAnalyzeButton('analyzing');
    try {
        const result = await classify(image);
        showFraction(fractionText(result));
    } catch {
        showFraction(t('failed'));
    } finally {
        busy = false;
        if (isVideoActive) document.getElementById('frozen-frame').classList.remove('show');
        updateAnalyzeButton('ready');
    }
}

document.getElementById('webcam-area').addEventListener('click', (event) => {
    if (event.target.closest('#camera-switch-btn')) return;
    if (!isVideoActive && !isRequestingCamera) requestCameraAccess();
});

document.getElementById('camera-switch-btn').addEventListener('click', async (event) => {
    event.stopPropagation();
    if (availableCameras.length < 2) return;
    currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
    await requestCameraAccess();
});

document.getElementById('analyze-btn').addEventListener('click', analyze);
document.getElementById('photo-btn').addEventListener('click', () => {
    document.getElementById('photo-input').click();
});
document.getElementById('photo-input').addEventListener('change', (event) => {
    const [file] = event.target.files || [];
    usePhoto(file);
    event.target.value = '';
});

document.getElementById('centers').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-site]');
    if (button) setSite(button.dataset.site);
});

document.querySelectorAll('[data-language-option]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.languageOption));
});

document.querySelector('.order').addEventListener('submit', (event) => event.preventDefault());
document.querySelectorAll('input[name="offer"]').forEach((input) => {
    input.addEventListener('change', updateOrderLink);
});

window.addEventListener('beforeunload', stopCamera);

language = preferredLanguage();
applyLanguage();
requestCameraAccess();
