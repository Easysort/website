/* Homepage and Sorting Guide demo.
 * The demo uses the same classify worker and site catalogs as core/guide.js.
 * It intentionally shows only the waste fraction and recycling center.
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

const translations = {
    en: {
        pageTitle: 'Easysort — See waste clearly',
        description: 'Easysort builds intelligent waste detection systems for recycling centers and waste facilities.',
        navProducts: 'Products',
        navDemo: 'Live demo',
        navVision: 'Vision',
        navContact: 'Talk to us',
        heroEyebrow: 'Free Sorting Guide',
        heroTitle: 'Where should this waste go?',
        heroLead: 'Take a photo and get the correct fraction for your Danish recycling center. Free for anyone to use.',
        proofFree: 'Always free',
        proofNoAccount: 'No account',
        proofDanish: 'Made for Danish recycling sites',
        heroProducts: 'Explore our products',
        heroDemo: 'Try the live demo',
        proofOne: 'Built for real facilities',
        proofTwo: 'Live in Denmark',
        proofThree: 'Open technology',
        signalLive: 'Live detection',
        signalAnswer: 'to an answer',
        metricSites: 'local recycling-center catalogs',
        metricSpeed: 'to a sorting answer',
        metricPrice: 'for everyone using the web guide',
        metricLiveValue: 'Live',
        metricLive: 'at Danish recycling centers',
        partnersLabel: 'Developed and tested with teams in the Danish waste sector',
        productsEyebrow: 'Easysort products',
        productsTitle: 'See what else we are building.',
        productsLead: 'The free guide is one part of a larger system for understanding waste, reuse, and facility operations.',
        availableNow: 'Available now',
        productGuideTitle: 'Sorting Guide',
        productGuideBody: 'Show an item to the camera and get the correct local waste fraction in seconds—on a phone or at a dedicated guide station.',
        tryGuide: 'Use for free →',
        viewProduct: 'View product →',
        productReuseTitle: 'Direct reuse',
        productReuseBody: 'Understand visits, movement, and what finds a second life in direct-reuse areas.',
        productControlTitle: 'Incoming waste control',
        productControlBody: 'Review incoming loads and document sorting issues with clear visual evidence.',
        productFacilityTitle: 'Facility overview',
        productFacilityBody: 'Bring cameras and operational signals together for a better view of flow across the facility.',
        demoEyebrow: 'Live Sorting Guide',
        demoTitle: 'Point. Capture.|Know where it goes.',
        demoLead: 'This is the same classification system used by our recycling-center guides. Choose a center, show one item, and get its local waste fraction.',
        stepOne: 'Choose the recycling center',
        stepTwo: 'Show one item to the camera',
        stepThree: 'Get the local waste fraction',
        privacy: 'The camera stays on your device until you analyze. Then we send that one photo.',
        privacyLink: 'Privacy',
        demoLive: 'Live Sorting Guide',
        demoNoInstall: 'Free · no install',
        cameraLabel: 'Show one item',
        cameraStart: 'Tap to use your camera',
        cameraRequiresHttps: 'Camera requires HTTPS.',
        cameraApiUnsupported: 'This browser has no camera API.',
        cameraAccessDenied: 'Camera access failed. Click to try again.',
        cameraPermissionDenied: 'Camera permission denied. Allow it, then click to try again.',
        cameraNotFound: 'No camera found.',
        switchCamera: 'Switch camera',
        analyzeNeedCamera: 'Enable camera',
        analyze: 'Analyze item',
        analyzing: 'Analyzing…',
        photo: 'Choose photo',
        fractionLabel: 'Waste fraction',
        centerLabel: 'Recycling center',
        centersLabel: 'Recycling center',
        chooseCenter: 'Choose your recycling center',
        privacyShort: 'Only the photo you analyze is sent.',
        noItem: 'No item in the photo',
        askStaff: 'Ask the staff',
        failed: 'Analysis failed. Try again.',
        approachEyebrow: 'Built from the ground up',
        approachTitle: 'Waste operations are physical. Our AI is too.',
        approachBody: 'We combine cameras, lighting, onboard compute, software, and facility knowledge. That lets us build systems around the real conditions on site—not around a perfect laboratory image.',
        readVision: 'Read our vision →',
        approachOneTitle: 'Start with the decision',
        approachOneBody: 'Give visitors and operators an answer they can act on.',
        approachTwoTitle: 'Learn from real facilities',
        approachTwoBody: 'Develop with the changing objects, light, weather, and flow found on site.',
        approachThreeTitle: 'Connect the overview',
        approachThreeBody: 'Turn individual detections into useful operational knowledge.',
        contactEyebrow: 'Start a conversation',
        contactTitle: 'What should be easier to see at your facility?',
        contactBody: 'Show us the operation, the difficult decision, or the blind spot. We will tell you honestly where computer vision can help.',
        bookCall: 'Book a conversation',
        footerLine: 'Intelligent waste detection systems.'
    },
    da: {
        pageTitle: 'Easysort — Se affaldet tydeligt',
        description: 'Easysort bygger intelligente systemer til affaldsgenkendelse for genbrugspladser og affaldsanlæg.',
        navProducts: 'Produkter',
        navDemo: 'Live demo',
        navVision: 'Vision',
        navContact: 'Tal med os',
        heroEyebrow: 'Gratis sorteringsguide',
        heroTitle: 'Hvor skal affaldet hen?',
        heroLead: 'Tag et billede, og få den rigtige fraktion til din danske genbrugsplads. Gratis for alle.',
        proofFree: 'Altid gratis',
        proofNoAccount: 'Ingen konto',
        proofDanish: 'Lavet til danske genbrugspladser',
        heroProducts: 'Se vores produkter',
        heroDemo: 'Prøv live demoen',
        proofOne: 'Bygget til virkelige anlæg',
        proofTwo: 'I drift i Danmark',
        proofThree: 'Åben teknologi',
        signalLive: 'Live genkendelse',
        signalAnswer: 'til et svar',
        metricSites: 'lokale kataloger til genbrugspladser',
        metricSpeed: 'til et sorteringssvar',
        metricPrice: 'for alle, der bruger webguiden',
        metricLiveValue: 'I drift',
        metricLive: 'på danske genbrugspladser',
        partnersLabel: 'Udviklet og testet med teams i den danske affaldssektor',
        productsEyebrow: 'Easysorts produkter',
        productsTitle: 'Se hvad vi ellers bygger.',
        productsLead: 'Den gratis guide er én del af et større system til at forstå affald, genbrug og drift.',
        availableNow: 'Tilgængelig nu',
        productGuideTitle: 'Sorteringsguide',
        productGuideBody: 'Vis en ting til kameraet, og få den rigtige lokale affaldsfraktion på få sekunder—på telefonen eller ved en fast guide.',
        tryGuide: 'Brug gratis →',
        viewProduct: 'Se produktet →',
        productReuseTitle: 'Direkte genbrug',
        productReuseBody: 'Forstå besøg, bevægelse og hvad der får et nyt liv i områder til direkte genbrug.',
        productControlTitle: 'Modtagekontrol',
        productControlBody: 'Gennemgå indkommende læs, og dokumentér fejlsortering med tydelig visuel dokumentation.',
        productFacilityTitle: 'Anlægsoverblik',
        productFacilityBody: 'Saml kameraer og driftssignaler for at få et bedre billede af flowet gennem anlægget.',
        demoEyebrow: 'Live sorteringsguide',
        demoTitle: 'Peg. Tag et billede.|Se hvor det skal hen.',
        demoLead: 'Det er det samme klassifikationssystem, som bruges i vores guider på genbrugspladser. Vælg en plads, vis én ting, og få den lokale affaldsfraktion.',
        stepOne: 'Vælg genbrugspladsen',
        stepTwo: 'Vis én ting til kameraet',
        stepThree: 'Få den lokale affaldsfraktion',
        privacy: 'Kameraet bliver på din enhed, indtil du analyserer. Så sender vi det ene billede.',
        privacyLink: 'Privatliv',
        demoLive: 'Live sorteringsguide',
        demoNoInstall: 'Gratis · ingen installation',
        cameraLabel: 'Vis én ting',
        cameraStart: 'Tryk for at bruge kameraet',
        cameraRequiresHttps: 'Kamera kræver HTTPS.',
        cameraApiUnsupported: 'Denne browser har intet kamera-API.',
        cameraAccessDenied: 'Kameraet kunne ikke åbnes. Klik for at prøve igen.',
        cameraPermissionDenied: 'Kameratilladelse blev afvist. Giv adgang, og klik for at prøve igen.',
        cameraNotFound: 'Intet kamera fundet.',
        switchCamera: 'Skift kamera',
        analyzeNeedCamera: 'Tænd kamera',
        analyze: 'Analyser ting',
        analyzing: 'Analyserer…',
        photo: 'Vælg foto',
        fractionLabel: 'Affaldsfraktion',
        centerLabel: 'Genbrugsplads',
        centersLabel: 'Genbrugsplads',
        chooseCenter: 'Vælg din genbrugsplads',
        privacyShort: 'Kun det billede, du analyserer, bliver sendt.',
        noItem: 'Ingen ting på billedet',
        askStaff: 'Spørg personalet',
        failed: 'Analysen mislykkedes. Prøv igen.',
        approachEyebrow: 'Bygget fra bunden',
        approachTitle: 'Affaldsdrift er fysisk. Det er vores AI også.',
        approachBody: 'Vi kombinerer kameraer, lys, beregning på enheden, software og viden om anlægget. Derfor kan vi bygge systemer til de virkelige forhold på pladsen—ikke til et perfekt laboratoriebillede.',
        readVision: 'Læs vores vision →',
        approachOneTitle: 'Start med beslutningen',
        approachOneBody: 'Giv besøgende og drift et svar, de kan handle på.',
        approachTwoTitle: 'Lær af virkelige anlæg',
        approachTwoBody: 'Udvikl med de skiftende ting, lysforhold, vejr og flows, der findes på pladsen.',
        approachThreeTitle: 'Skab det samlede overblik',
        approachThreeBody: 'Gør enkelte registreringer til brugbar viden om driften.',
        contactEyebrow: 'Start en samtale',
        contactTitle: 'Hvad burde være lettere at se på jeres anlæg?',
        contactBody: 'Vis os driften, den svære beslutning eller den blinde vinkel. Vi fortæller ærligt, hvor computer vision kan hjælpe.',
        bookCall: 'Book en samtale',
        footerLine: 'Intelligente systemer til affaldsgenkendelse.'
    }
};

let language = preferredLanguage();
let site = 'roskilde';
let stream = null;
let isVideoActive = false;
let isRequestingCamera = false;
let availableCameras = [];
let currentCameraIndex = 0;
let stillBase64 = null;
let placeholderKey = 'cameraStart';
let busy = false;

function t(key) {
    return translations[language][key] || translations.en[key] || key;
}

function preferredLanguage() {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
    return navigator.language && navigator.language.toLowerCase().startsWith('da') ? 'da' : 'en';
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
    document.getElementById('centers').setAttribute('aria-label', t('centersLabel'));
    document.getElementById('camera-status').textContent = t(placeholderKey);
    const fraction = document.getElementById('result-fraction');
    const statusKey = statusKeyFor(fraction.textContent);
    if (statusKey) fraction.textContent = t(statusKey);
    document.getElementById('result-center').textContent = SITES[site][language];
    updateAnalyzeButton();
}

function setLanguage(next) {
    if (!SUPPORTED_LANGUAGES.includes(next) || next === language) return;
    language = next;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    applyLanguage();
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

function setSite(next) {
    if (!SITES[next]) return;
    site = next;
    document.querySelectorAll('#centers button').forEach((button) => {
        button.setAttribute('aria-pressed', button.dataset.site === site ? 'true' : 'false');
    });
    document.getElementById('result-center').textContent = SITES[site][language];
    document.getElementById('result-fraction').textContent = '—';
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

async function analyze() {
    if (busy) return;
    const image = isVideoActive ? captureFrame() : stillBase64;
    if (!image) return;
    busy = true;
    updateAnalyzeButton();
    try {
        const result = await classify(image);
        document.getElementById('result-fraction').textContent = resultText(result);
        document.getElementById('result-center').textContent = SITES[site][language];
    } catch {
        document.getElementById('result-fraction').textContent = t('failed');
    } finally {
        busy = false;
        if (isVideoActive) document.getElementById('frozen-frame').classList.remove('show');
        updateAnalyzeButton();
    }
}

document.querySelectorAll('[data-language-option]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.languageOption));
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
document.getElementById('centers').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-site]');
    if (button) setSite(button.dataset.site);
});

window.addEventListener('beforeunload', stopCamera);

applyLanguage();
requestCameraAccess();
