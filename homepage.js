/* Homepage and Sorting Guide demo.
 * The demo uses the same classify worker and site catalogs as core/guide.js.
 * It intentionally shows only the waste fraction and recycling center.
 */

const WORKER_URL = document.body.dataset.worker;
const LANGUAGE_STORAGE_KEY = 'easysort-language';
const CURRENCY_STORAGE_KEY = 'easysort-currency';
const DKK_PER_EUR = 7.46038;
const SUPPORTED_LANGUAGES = ['en', 'da', 'de'];
const API_TIMEOUT_MS = 30000;

const SITES = {
    roskilde: { da: 'Roskilde Genbrugsplads', en: 'Roskilde Recycling Center', de: 'Recyclinghof Roskilde', lat: 55.64, lon: 12.08 },
    jyllinge: { da: 'Jyllinge Genbrugsplads', en: 'Jyllinge Recycling Center', de: 'Recyclinghof Jyllinge', lat: 55.75, lon: 12.10 },
    vojens: { da: 'Vojens Genbrugsplads', en: 'Vojens Recycling Center', de: 'Recyclinghof Vojens', lat: 55.25, lon: 9.31 }
};

const translations = {
    en: {
        pageTitle: 'Easysort — Sort waste correctly',
        description: 'Free sorting help for Danish recycling centers and camera systems for waste facilities.',
        navProducts: 'Products',
        navConfigure: 'Configure',
        navContact: 'Contact',
        heroEyebrow: 'Free Sorting Guide',
        heroTitle: 'Sort waste correctly.',
        heroLead: 'Take a photo. We show you what it is and where it goes.',
        cameraLabel: 'Show one item',
        cameraStart: 'Tap to start',
        cameraRequiresHttps: 'Camera requires HTTPS.',
        cameraApiUnsupported: 'This browser has no camera API.',
        cameraAccessDenied: 'Camera access failed. Tap to try again.',
        cameraPermissionDenied: 'Camera permission denied. Allow it, then tap to try again.',
        cameraNotFound: 'No camera found.',
        switchCamera: 'Switch camera',
        analyzeNeedCamera: 'Take photo',
        analyze: 'Take photo',
        analyzing: 'Analyzing…',
        photo: 'Upload',
        itemLabel: 'We think this is',
        fractionLabel: 'Sort it as',
        centerLabel: 'Guide',
        automaticGuide: 'Danish recycling center',
        demoModelNote: 'This web demo uses our smaller general model. Our larger, purpose-trained models deliver higher accuracy.',
        privacyShort: 'Only this photo is sent for analysis.',
        privacyLink: 'Privacy',
        noItem: 'No item in the photo',
        askStaff: 'Ask the staff',
        failed: 'Analysis failed. Try again.',
        productsTitle: 'Our products',
        productGuideTitle: 'Sorting Guide',
        productGuideBody: 'Visitors scan a QR code or use a screen on site, take a photo, and see where it goes.',
        guidePerkOne: 'App: from {kr:15000} + {kr:4000} / month',
        guidePerkTwo: 'Physical box with outdoor screen: {kr:30000} + {kr:6000} / month',
        guidePerkThree: 'Signs, site map, and EasyTrack included',
        productReuseTitle: 'Monitoring Box',
        productReuseBody: 'Reuse monitoring sits over the entrance to a container, a tent, or a room. Container monitoring sits at one container.',
        monitorPerkOne: 'Reuse monitoring: {kr:6000} + {kr:2500} / month for the first camera, then {kr:1800} / month',
        monitorPerkTwo: 'Container monitoring sits at one container: {kr:10000} + {kr:3500} / month per camera',
        monitorPerkThree: 'Faces and license plates blurred immediately',
        configureProduct: 'Configure',
        customTitle: 'Sorting and incineration plants',
        customBody: 'We also build camera systems for sorting plants and waste-to-energy plants. Each system is designed for the plant, so contact us directly.',
        customAction: 'Contact us',
        partnersLabel: 'Developed with teams in the Danish waste sector',
        contactTitle: 'Write or call.',
        contactPromise: 'I reply myself.',
        contactBody: 'Order online. Payment by bank transfer.',
        configureSystem: 'Configure your system'
    },
    da: {
        pageTitle: 'Easysort — Sortér affaldet rigtigt',
        description: 'Gratis sorteringshjælp til danske genbrugspladser og kamerasystemer til affaldsanlæg.',
        navProducts: 'Produkter',
        navConfigure: 'Konfigurér',
        navContact: 'Kontakt',
        heroEyebrow: 'Gratis sorteringsguide',
        heroTitle: 'Sortér affaldet rigtigt.',
        heroLead: 'Tag et billede. Vi viser, hvad det er, og hvor det skal hen.',
        cameraLabel: 'Vis én ting',
        cameraStart: 'Tryk for at starte',
        cameraRequiresHttps: 'Kamera kræver HTTPS.',
        cameraApiUnsupported: 'Denne browser har intet kamera-API.',
        cameraAccessDenied: 'Kameraet kunne ikke åbnes. Tryk for at prøve igen.',
        cameraPermissionDenied: 'Kameratilladelse blev afvist. Giv adgang, og tryk for at prøve igen.',
        cameraNotFound: 'Intet kamera fundet.',
        switchCamera: 'Skift kamera',
        analyzeNeedCamera: 'Tag billede',
        analyze: 'Tag billede',
        analyzing: 'Analyserer…',
        photo: 'Upload',
        itemLabel: 'Vi tror, det er',
        fractionLabel: 'Sortér som',
        centerLabel: 'Guide',
        automaticGuide: 'Dansk genbrugsplads',
        demoModelNote: 'Webdemoen bruger vores mindre, generelle model. Vores større, specialtrænede modeller leverer højere præcision.',
        privacyShort: 'Kun dette billede bliver sendt til analyse.',
        privacyLink: 'Privatliv',
        noItem: 'Ingen ting på billedet',
        askStaff: 'Spørg personalet',
        failed: 'Analysen mislykkedes. Prøv igen.',
        productsTitle: 'Vores produkter',
        productGuideTitle: 'Sorteringsguide',
        productGuideBody: 'Borgeren scanner en QR-kode eller bruger en skærm på pladsen, tager et billede og ser, hvor det skal hen.',
        guidePerkOne: 'App: fra {kr:15000} + {kr:4000} / md.',
        guidePerkTwo: 'Fysisk boks med udendørs skærm: {kr:30000} + {kr:6000} / md.',
        guidePerkThree: 'Skilte, pladskort og EasyTrack er med',
        productReuseTitle: 'Overvågningsboks',
        productReuseBody: 'Genbrugsovervågning sidder over indgangen til en container, et telt eller et rum. Containerovervågning sidder ved én container.',
        monitorPerkOne: 'Genbrugsovervågning: {kr:6000} + {kr:2500} / md. for første kamera, derefter {kr:1800} / md.',
        monitorPerkTwo: 'Containerovervågning sidder ved én container: {kr:10000} + {kr:3500} / md. pr. kamera',
        monitorPerkThree: 'Ansigter og nummerplader sløres med det samme',
        configureProduct: 'Konfigurér',
        customTitle: 'Sorteringsanlæg og forbrændingsanlæg',
        customBody: 'Vi bygger også kamerasystemer til sorteringsanlæg og forbrændingsanlæg. Hvert system tilpasses anlægget, så kontakt os direkte.',
        customAction: 'Kontakt os',
        partnersLabel: 'Udviklet med teams i den danske affaldssektor',
        contactTitle: 'Skriv eller ring.',
        contactPromise: 'Jeg svarer selv.',
        contactBody: 'Bestil online. Betaling ved bankoverførsel.',
        configureSystem: 'Konfigurér jeres system'
    },
    de: {
        pageTitle: 'Easysort — Abfall richtig sortieren',
        description: 'Kostenlose Sortierhilfe für dänische Recyclinghöfe und Kamerasysteme für Abfallanlagen.',
        navProducts: 'Produkte',
        navConfigure: 'Konfigurieren',
        navContact: 'Kontakt',
        heroEyebrow: 'Kostenlose Sortierhilfe',
        heroTitle: 'Abfall richtig sortieren.',
        heroLead: 'Foto aufnehmen. Wir zeigen, was es ist und wohin es gehört.',
        cameraLabel: 'Einen Gegenstand zeigen',
        cameraStart: 'Zum Starten tippen',
        cameraRequiresHttps: 'Die Kamera benötigt HTTPS.',
        cameraApiUnsupported: 'Dieser Browser unterstützt keine Kamera.',
        cameraAccessDenied: 'Kamerazugriff fehlgeschlagen. Zum Wiederholen tippen.',
        cameraPermissionDenied: 'Kamerazugriff wurde abgelehnt. Bitte erlauben und erneut tippen.',
        cameraNotFound: 'Keine Kamera gefunden.',
        switchCamera: 'Kamera wechseln',
        analyzeNeedCamera: 'Foto aufnehmen',
        analyze: 'Foto aufnehmen',
        analyzing: 'Wird analysiert…',
        photo: 'Hochladen',
        itemLabel: 'Wir glauben, das ist',
        fractionLabel: 'Sortieren als',
        centerLabel: 'Leitfaden',
        automaticGuide: 'Dänischer Recyclinghof',
        demoModelNote: 'Diese Webdemo nutzt unser kleineres allgemeines Modell. Unsere größeren, spezialisierten Modelle liefern eine höhere Genauigkeit.',
        privacyShort: 'Nur dieses Foto wird zur Analyse gesendet.',
        privacyLink: 'Datenschutz',
        noItem: 'Kein Gegenstand auf dem Foto',
        askStaff: 'Personal fragen',
        failed: 'Analyse fehlgeschlagen. Bitte erneut versuchen.',
        productsTitle: 'Unsere Produkte',
        productGuideTitle: 'Sortierhilfe',
        productGuideBody: 'Besucher scannen einen QR-Code oder nutzen einen Bildschirm vor Ort, machen ein Foto und sehen, wohin es gehört.',
        guidePerkOne: 'App: ab {kr:15000} + {kr:4000} / Monat',
        guidePerkTwo: 'Physische Box mit Outdoor-Bildschirm: {kr:30000} + {kr:6000} / Monat',
        guidePerkThree: 'Schilder, Lageplan und EasyTrack inklusive',
        productReuseTitle: 'Monitoring Box',
        productReuseBody: 'Wiederverwendungsüberwachung sitzt über dem Eingang zu einem Container, einem Zelt oder einem Raum. Containerüberwachung sitzt an einem Container.',
        monitorPerkOne: 'Wiederverwendungsüberwachung: {kr:6000} + {kr:2500} / Monat für die erste Kamera, danach {kr:1800} / Monat',
        monitorPerkTwo: 'Containerüberwachung sitzt an einem Container: {kr:10000} + {kr:3500} / Monat pro Kamera',
        monitorPerkThree: 'Gesichter und Kennzeichen werden sofort unkenntlich gemacht',
        configureProduct: 'Konfigurieren',
        customTitle: 'Sortier- und Verbrennungsanlagen',
        customBody: 'Wir bauen auch Kamerasysteme für Sortieranlagen und Müllverbrennungsanlagen. Jedes System wird für die Anlage geplant, sprechen Sie uns daher direkt an.',
        customAction: 'Kontakt aufnehmen',
        partnersLabel: 'Mit Teams aus der dänischen Abfallwirtschaft entwickelt',
        contactTitle: 'Schreiben oder anrufen.',
        contactPromise: 'Ich antworte selbst.',
        contactBody: 'Online bestellen. Zahlung per Banküberweisung.',
        configureSystem: 'System konfigurieren'
    }
};

let language = preferredLanguage();
let currency = preferredCurrency();
let site = 'vojens';
let hasSpecificSite = false;
let stream = null;
let isVideoActive = false;
let isRequestingCamera = false;
let availableCameras = [];
let currentCameraIndex = 0;
let stillBase64 = null;
let placeholderKey = 'cameraStart';
let busy = false;

function preferredLanguage() {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
    const browserLanguage = (navigator.language || '').toLowerCase();
    if (browserLanguage.startsWith('da')) return 'da';
    if (browserLanguage.startsWith('de')) return 'de';
    return 'en';
}

function currencyForLanguage(code) {
    return code === 'de' ? 'EUR' : 'DKK';
}

function preferredCurrency() {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved === 'DKK' || saved === 'EUR') return saved;
    return currencyForLanguage(preferredLanguage());
}

function shownAmount(dkk) {
    const amount = Number(dkk) || 0;
    if (currency !== 'EUR') return Math.round(amount);
    const cents = Math.round((amount / DKK_PER_EUR) * 100);
    return Math.ceil(cents / 5000) * 50;
}

function formatMoney(dkk) {
    const locale = language === 'da' ? 'da-DK' : language === 'de' ? 'de-DE' : 'en-GB';
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(shownAmount(dkk));
    if (currency === 'EUR') return language === 'en' ? `€${formatted}` : `${formatted} €`;
    return `${formatted} kr.`;
}

function fillMoney(value) {
    return String(value).replace(/\{kr:(\d+)\}/g, (_, amount) => formatMoney(Number(amount)));
}

function t(key) {
    const value = (translations[language] || translations.en)[key] || translations.en[key] || key;
    return fillMoney(value);
}

function applyRichText(node, value) {
    const parts = value.split('|');
    node.textContent = '';
    parts.forEach((part, index) => {
        if (index) node.append(document.createElement('br'));
        node.append(document.createTextNode(part));
    });
}

function statusKeyFor(value) {
    for (const code of SUPPORTED_LANGUAGES) {
        for (const key of ['noItem', 'askStaff', 'failed']) {
            if (translations[code][key] === value) return key;
        }
    }
    return null;
}

function siteLabel() {
    return hasSpecificSite ? SITES[site][language] : t('automaticGuide');
}

function applyLanguage() {
    document.documentElement.lang = language;
    document.title = t('pageTitle');
    document.querySelector('meta[name="description"]').content = t('description');
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        const value = t(node.dataset.i18n);
        if (value.includes('|')) applyRichText(node, value);
        else node.textContent = value;
    });
    document.querySelectorAll('[data-language-option]').forEach((button) => {
        button.setAttribute('aria-pressed', button.dataset.languageOption === language ? 'true' : 'false');
    });
    document.querySelectorAll('[data-currency-option]').forEach((button) => {
        button.setAttribute('aria-pressed', button.dataset.currencyOption === currency ? 'true' : 'false');
    });
    document.getElementById('camera-status').textContent = t(placeholderKey);
    const fraction = document.getElementById('result-fraction');
    const statusKey = statusKeyFor(fraction.textContent);
    if (statusKey) fraction.textContent = t(statusKey);
    document.getElementById('result-center').textContent = siteLabel();
    updateAnalyzeButton();
}

function setCurrency(next) {
    if (next !== 'DKK' && next !== 'EUR') return;
    currency = next;
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    applyLanguage();
}

function setLanguage(next) {
    if (!SUPPORTED_LANGUAGES.includes(next) || next === language) return;
    language = next;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    setCurrency(currencyForLanguage(language));
}

function setPlaceholder(key) {
    placeholderKey = key;
    document.getElementById('camera-status').textContent = t(key);
}

function updateAnalyzeButton() {
    const button = document.getElementById('analyze-btn');
    if (busy) {
        button.disabled = true;
        button.textContent = t('analyzing');
        return;
    }
    const ready = isVideoActive || Boolean(stillBase64);
    button.disabled = !ready;
    button.textContent = ready ? t('analyze') : t('analyzeNeedCamera');
}

function setSite(next, specific = true) {
    if (!SITES[next]) return;
    site = next;
    hasSpecificSite = specific;
    document.getElementById('result-center').textContent = siteLabel();
}

function nearestSite(latitude, longitude) {
    let nearest = 'vojens';
    let nearestDistance = Infinity;
    Object.entries(SITES).forEach(([key, candidate]) => {
        const latDistance = latitude - candidate.lat;
        const lonDistance = (longitude - candidate.lon) * Math.cos(latitude * Math.PI / 180);
        const distance = latDistance ** 2 + lonDistance ** 2;
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = key;
        }
    });
    return nearest;
}

async function chooseAutomaticSite() {
    const requested = new URLSearchParams(location.search).get('site');
    if (SITES[requested]) {
        setSite(requested);
        return;
    }
    setSite('vojens', false);
    if (!navigator.permissions || !navigator.geolocation) return;
    try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state !== 'granted') return;
        navigator.geolocation.getCurrentPosition(
            (position) => setSite(nearestSite(position.coords.latitude, position.coords.longitude)),
            () => setSite('vojens', false),
            { enableHighAccuracy: false, maximumAge: 600000, timeout: 3000 }
        );
    } catch {
        setSite('vojens', false);
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
            try { await video.play(); } catch { /* user can click again */ }
            video.classList.add('active');
            placeholder.hidden = true;
            isVideoActive = true;
            updateAnalyzeButton();
        };
    } catch (error) {
        let key = 'cameraAccessDenied';
        if (error.name === 'NotAllowedError') key = 'cameraPermissionDenied';
        else if (error.name === 'NotFoundError') key = 'cameraNotFound';
        isVideoActive = false;
        video.classList.remove('active');
        placeholder.hidden = false;
        switchButton.hidden = true;
        setPlaceholder(key);
        updateAnalyzeButton();
    } finally {
        isRequestingCamera = false;
    }
}

function visibleVideoRect(video) {
    const full = { sx: 0, sy: 0, sw: video.videoWidth, sh: video.videoHeight };
    const box = video.getBoundingClientRect();
    if (!box.width || !box.height) return full;
    const scale = Math.max(box.width / video.videoWidth, box.height / video.videoHeight);
    const sw = box.width / scale;
    const sh = box.height / scale;
    return {
        sx: Math.max(0, (video.videoWidth - sw) / 2),
        sy: Math.max(0, (video.videoHeight - sh) / 2),
        sw: Math.min(video.videoWidth, sw),
        sh: Math.min(video.videoHeight, sh)
    };
}

function captureFrame() {
    const video = document.getElementById('webcam-video');
    if (!video.videoWidth || !video.videoHeight) return null;
    const canvas = document.getElementById('frozen-frame');
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
            document.getElementById('camera-switch-btn').hidden = true;
            stillBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            updateAnalyzeButton();
        };
        image.src = reader.result;
    };
    reader.readAsDataURL(file);
}

async function classify(image) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), API_TIMEOUT_MS);
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: abort.signal,
            body: JSON.stringify({
                image,
                language,
                site,
                source: 'web',
                client: 'home',
                page: location.pathname
            })
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || data.ok !== true || !data.result) throw new Error('bad response');
        return data.result;
    } finally {
        clearTimeout(timer);
    }
}

function resultText(result) {
    const fraction = typeof result.fraction === 'string' ? result.fraction.trim() : '';
    if (fraction) return fraction;
    if (result.noItem === true) return t('noItem');
    return t('askStaff');
}

function itemText(result) {
    const description = typeof result.description === 'string' ? result.description.trim() : '';
    const item = typeof result.item === 'string' ? result.item.trim() : '';
    if (description || item) return description || item;
    if (result.noItem === true) return t('noItem');
    return t('askStaff');
}

async function analyze() {
    if (busy) return;
    const image = isVideoActive ? captureFrame() : stillBase64;
    if (!image) return;
    busy = true;
    document.getElementById('analysis-result').hidden = true;
    updateAnalyzeButton();
    try {
        const result = await classify(image);
        document.getElementById('result-item').textContent = itemText(result);
        document.getElementById('result-fraction').textContent = resultText(result);
        document.getElementById('result-center').textContent = siteLabel();
    } catch {
        document.getElementById('result-item').textContent = t('failed');
        document.getElementById('result-fraction').textContent = t('failed');
    } finally {
        document.getElementById('analysis-result').hidden = false;
        busy = false;
        if (isVideoActive) document.getElementById('frozen-frame').classList.remove('show');
        updateAnalyzeButton();
    }
}

document.querySelectorAll('[data-language-option]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.languageOption));
});

document.querySelectorAll('[data-currency-option]').forEach((button) => {
    button.addEventListener('click', () => setCurrency(button.dataset.currencyOption));
});

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
    usePhoto((event.target.files || [])[0]);
    event.target.value = '';
});
window.addEventListener('beforeunload', stopCamera);

applyLanguage();
chooseAutomaticSite();
requestCameraAccess();
