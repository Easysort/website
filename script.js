let stream = null;
let isVideoActive = false;
let countdownTimer = null;
let currentCameraIndex = 0;
let availableCameras = [];
let isRequestingCamera = false;
let currentLanguage = 'en';
let currentAnalyzeButtonState = 'disabled';
let currentCountdownValue = 0;
let latestResults = null;

// Backend API configuration
const BACKEND_API_URL = 'https://workers-playground-bitter-term-7fe4.lucas-vilsen.workers.dev/generate';
const DEBUG = false; // set true temporarily if you want verbose console logs
const LANGUAGE_STORAGE_KEY = 'easysort-language';
const SUPPORTED_LANGUAGES = ['en', 'da'];

const translations = {
    en: {
        pageTitle: 'Easysort - Intelligent waste detection systems',
        languageSwitcherLabel: 'Language switcher',
        cameraSwitchTitle: 'Switch camera',
        cameraSwitchAria: 'Switch camera',
        headerCta: 'Book discovery call',
        heroKicker: 'Intelligent waste detection systems',
        heroTitle: 'Built for recycling centers and waste plants.',
        heroSubtitle: 'Try the demo, see the projects, and book a discovery call to explore opportunities in your facility.',
        heroPrimaryCta: 'Book a discovery call',
        heroSecondaryCta: 'See current projects',
        demoEyebrow: 'Live demo',
        demoTitle: 'Test the waste classifier',
        demoCopy: 'Use your camera to get a quick classification preview.',
        placeholderDefault: 'Allow camera to try it yourself',
        resultsTitle: 'Analysis Results',
        fractionLabel: 'Fraction:',
        purityLabel: 'Purity:',
        subclassLabel: 'Subclass:',
        consultationLabel: 'Free discovery call with Lucas',
        consultationTitle: "Let's find where the opportunities are.",
        consultationDescription: 'We use the call to understand your facility, point out practical improvement opportunities, and share ideas you can use whether you work with us, someone else, or solve it in-house. If there is a strong match, we also see whether you qualify for a project with us.',
        consultationCta: 'Book a discovery call',
        consultationNote: 'Practical pointers first. Project fit second.',
        partnersLabel: 'Partners',
        partnersTitle: 'Some of the teams we work with.',
        partnersDescription: 'A few partners, pilots, and collaboration environments.',
        projectsLabel: 'Projects',
        projectsTitle: 'Current projects.',
        projectsDescription: 'Two for recycling centers. Two for waste plants.',
        project1Tag: 'Recycling centers',
        project1Title: 'Direct reuse monitoring',
        project1Description: 'Track what gets taken, reused, and visited.',
        project2Tag: 'Recycling centers',
        project2Title: 'Sorting guide',
        project2Description: 'Guide visitors to the right container in seconds.',
        project3Tag: 'Waste plants',
        project3Title: 'Incoming waste inspection',
        project3Description: 'Analyze loads and flag poor sorting with evidence.',
        project4Tag: 'Waste plants',
        project4Title: 'Facility optimization',
        project4Description: 'Monitor weighbridge and plant flow with better control.',
        footerSummary: 'Intelligent waste detection systems for recycling center and waste plants.',
        footerContactLabel: 'Contact:',
        footerReviewLink: 'Book review',
        footerDocsLink: 'Documentation',
        analyzeEnableCamera: 'Enable camera to try demo',
        analyzeWaste: 'Analyze waste',
        analyzing: 'Analyzing...',
        countdownLabel: 'Wait {seconds}s',
        cameraRequiresHttps: 'Camera requires HTTPS. Click to try again.',
        cameraApiUnsupported: 'Camera API not supported in this browser.',
        cameraAccessDenied: 'Camera access denied. Click to try again.',
        cameraPermissionDenied: 'Camera permission denied. Please allow camera access in your browser and click to try again.',
        cameraNotFound: 'No camera found. Please connect a camera and try again.',
        cameraNotSupported: 'Camera not supported in this browser.',
        cameraAccessFailed: 'Camera access failed. Please try again later.',
        aiFailed: 'AI analysis failed. Please try again later.'
    },
    da: {
        pageTitle: 'Easysort - Intelligente systemer til affaldsgenkendelse',
        languageSwitcherLabel: 'Sprogskifter',
        cameraSwitchTitle: 'Skift kamera',
        cameraSwitchAria: 'Skift kamera',
        headerCta: 'Book introduktionsmøde',
        heroKicker: 'Intelligente systemer til affaldsgenkendelse',
        heroTitle: 'Bygget til genbrugspladser og affaldsanlæg.',
        heroSubtitle: 'Prøv demoen, se projekterne, og book et introduktionsmøde for at udforske mulighederne i jeres anlæg.',
        heroPrimaryCta: 'Book introduktionsmøde',
        heroSecondaryCta: 'Se aktuelle projekter',
        demoEyebrow: 'Live demo',
        demoTitle: 'Test affaldsklassificeringen',
        demoCopy: 'Brug dit kamera og få en hurtig klassificering.',
        placeholderDefault: 'Giv kameraadgang for at prøve selv',
        resultsTitle: 'Analyseresultater',
        fractionLabel: 'Fraktion:',
        purityLabel: 'Renhed:',
        subclassLabel: 'Underkategori:',
        consultationLabel: 'Gratis introduktionsmøde med Lucas',
        consultationTitle: 'Lad os finde ud af, hvor mulighederne er.',
        consultationDescription: 'Vi bruger mødet på at forstå jeres anlæg, pege på praktiske forbedringsmuligheder og dele idéer, I kan bruge, uanset om I arbejder med os, en anden leverandør eller løser det internt. Hvis der er et stærkt match, ser vi også på, om I passer til et projekt med os.',
        consultationCta: 'Book introduktionsmøde',
        consultationNote: 'Praktiske input først. Projektmatch bagefter.',
        partnersLabel: 'Partnere',
        partnersTitle: 'Nogle af de teams, vi arbejder med.',
        partnersDescription: 'Et udvalg af partnere, piloter og samarbejdsmiljøer.',
        projectsLabel: 'Projekter',
        projectsTitle: 'Aktuelle projekter.',
        projectsDescription: 'To til genbrugspladser. To til affaldsanlæg.',
        project1Tag: 'Genbrugspladser',
        project1Title: 'Overvågning af direkte genbrug',
        project1Description: 'Følg hvad der bliver taget, genbrugt og besøgt.',
        project2Tag: 'Genbrugspladser',
        project2Title: 'Sorteringsguide',
        project2Description: 'Hjælp besøgende til den rigtige container på få sekunder.',
        project3Tag: 'Affaldsanlæg',
        project3Title: 'Kontrol af indkommende affald',
        project3Description: 'Analyser læs og marker fejlsortering med dokumentation.',
        project4Tag: 'Affaldsanlæg',
        project4Title: 'Optimering af anlæg',
        project4Description: 'Overvåg brovægt og flow i anlægget med bedre kontrol.',
        footerSummary: 'Intelligente systemer til affaldsgenkendelse for genbrugspladser og affaldsanlæg.',
        footerContactLabel: 'Kontakt:',
        footerReviewLink: 'Book gennemgang',
        footerDocsLink: 'Dokumentation',
        analyzeEnableCamera: 'Aktiver kamera for at prøve demoen',
        analyzeWaste: 'Analyser affald',
        analyzing: 'Analyserer...',
        countdownLabel: 'Vent {seconds}s',
        cameraRequiresHttps: 'Kamera kræver HTTPS. Tryk for at prøve igen.',
        cameraApiUnsupported: 'Kamera understøttes ikke i denne browser.',
        cameraAccessDenied: 'Kameraadgang blev afvist. Tryk for at prøve igen.',
        cameraPermissionDenied: 'Kameratilladelse blev afvist. Giv adgang i browseren og tryk for at prøve igen.',
        cameraNotFound: 'Intet kamera fundet. Tilslut et kamera og prøv igen.',
        cameraNotSupported: 'Kamera understøttes ikke i denne browser.',
        cameraAccessFailed: 'Kameraadgang mislykkedes. Prøv igen senere.',
        aiFailed: 'AI-analysen mislykkedes. Prøv igen senere.'
    }
};

const localizedResultValues = {
    en: {
        '__ai_unavailable__': 'AI could not run in browser. Try again later or contact us.',
        '__unknown__': 'Unknown',
        '__none__': 'None',
        'food waste': 'Food waste',
        'glass': 'Glass',
        'paper': 'Paper',
        'metal': 'Metal',
        'soft plastics': 'Soft plastics',
        'hard plastics': 'Hard plastics',
        'hazardous waste': 'Hazardous waste',
        'food and drink cartons': 'Food and drink cartons',
        'cardboard': 'Cardboard',
        'textiles': 'Textiles',
        'residual waste': 'Residual waste'
    },
    da: {
        '__ai_unavailable__': 'AI kunne ikke køre i browseren. Prøv igen senere eller kontakt os.',
        '__unknown__': 'Ukendt',
        '__none__': 'Ingen',
        'food waste': 'Madaffald',
        'glass': 'Glas',
        'paper': 'Papir',
        'metal': 'Metal',
        'soft plastics': 'Blød plast',
        'hard plastics': 'Hård plast',
        'hazardous waste': 'Farligt affald',
        'food and drink cartons': 'Mad- og drikkekartoner',
        'cardboard': 'Pap',
        'textiles': 'Tekstiler',
        'residual waste': 'Restaffald'
    }
};

function getPreferredLanguage() {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(savedLanguage)) {
        return savedLanguage;
    }

    return navigator.language && navigator.language.toLowerCase().startsWith('da') ? 'da' : 'en';
}

function t(key, replacements = {}) {
    const dictionary = translations[currentLanguage] || translations.en;
    const fallback = translations.en[key] || key;
    const template = dictionary[key] || fallback;

    return template.replace(/\{(\w+)\}/g, (_, token) => replacements[token] ?? `{${token}}`);
}

function normalizeResultValue(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function localizeResultValue(type, value) {
    if (type === 'purity' && typeof value === 'number' && Number.isFinite(value)) {
        return `${value}/10`;
    }

    const normalized = normalizeResultValue(value);
    if (!normalized) {
        return localizedResultValues[currentLanguage].__unknown__ || value;
    }

    return localizedResultValues[currentLanguage][normalized] || value;
}

function setLanguage(language) {
    if (!SUPPORTED_LANGUAGES.includes(language) || language === currentLanguage) {
        return;
    }

    currentLanguage = language;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    applyTranslations();
}

function applyTranslations() {
    document.documentElement.lang = currentLanguage;
    document.title = t('pageTitle');

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = t('pageTitle');
    }

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.dataset.i18n;
        element.textContent = t(key);
    });

    const languageSwitch = document.querySelector('.language-switch');
    if (languageSwitch) {
        languageSwitch.setAttribute('aria-label', t('languageSwitcherLabel'));
    }

    const switchButton = document.getElementById('camera-switch-btn');
    if (switchButton) {
        switchButton.title = t('cameraSwitchTitle');
        switchButton.setAttribute('aria-label', t('cameraSwitchAria'));
    }

    document.querySelectorAll('[data-language-option]').forEach((button) => {
        const isActive = button.dataset.languageOption === currentLanguage;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    updateAnalyzeButtonState(currentAnalyzeButtonState, currentCountdownValue);

    if (latestResults) {
        showResults(latestResults);
    }
}

function setupLanguageSwitcher() {
    document.querySelectorAll('[data-language-option]').forEach((button) => {
        button.addEventListener('click', () => {
            setLanguage(button.dataset.languageOption);
        });
    });
}

function setPlaceholder(icon, messageKey) {
    const placeholder = document.getElementById('webcam-placeholder');
    const webcamArea = document.getElementById('webcam-area');
    const webcamText = placeholder.querySelector('.webcam-text');
    const webcamIcon = placeholder.querySelector('.webcam-icon');

    webcamIcon.textContent = icon;
    webcamText.textContent = t(messageKey);

    placeholder.style.cursor = 'pointer';
    webcamArea.style.cursor = 'pointer';
    webcamArea.onclick = () => {
        if (!isVideoActive && !isRequestingCamera) {
            requestCameraAccess();
        }
    };
}

function updateAnalyzeButtonState(state, timeLeft = currentCountdownValue) {
    const analyzeButton = document.getElementById('identify-btn');

    currentAnalyzeButtonState = state;
    currentCountdownValue = timeLeft;

    if (state === 'disabled') {
        analyzeButton.disabled = true;
        analyzeButton.textContent = t('analyzeEnableCamera');
        return;
    }

    if (state === 'ready') {
        analyzeButton.disabled = false;
        analyzeButton.textContent = t('analyzeWaste');
        return;
    }

    if (state === 'analyzing') {
        analyzeButton.disabled = true;
        analyzeButton.textContent = t('analyzing');
        return;
    }

    if (state === 'countdown') {
        analyzeButton.disabled = true;
        analyzeButton.textContent = t('countdownLabel', { seconds: timeLeft });
    }
}

function checkSecureContext() {
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) {
        return false;
    }
    return true;
}

async function getAvailableCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
        console.error('Error getting cameras:', error);
        return [];
    }
}

async function switchCamera() {
    if (availableCameras.length <= 1) return;
    
    currentCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
    await requestCameraAccess();
}

async function requestCameraAccess() {
    if (!checkSecureContext()) {
        setPlaceholder('🚫', 'cameraRequiresHttps');
        return;
    }

    if (isRequestingCamera) {
        return;
    }

    const video = document.getElementById('webcam-video');
    const placeholder = document.getElementById('webcam-placeholder');
    const switchButton = document.getElementById('camera-switch-btn');
    const switchIcon = document.getElementById('camera-switch-icon');
    const webcamArea = document.getElementById('webcam-area');

    isRequestingCamera = true;

    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('cameraApiUnsupported');
        }
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        let constraints;
        if (availableCameras.length > 0 && availableCameras[currentCameraIndex]) {
            constraints = {
                video: {
                    deviceId: { exact: availableCameras[currentCameraIndex].deviceId }
                }
            };
        } else {
            constraints = { video: true };
        }
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        availableCameras = await getAvailableCameras();
        if (currentCameraIndex >= availableCameras.length) {
            currentCameraIndex = 0;
        }
        
        const showSwitch = availableCameras.length > 1;
        switchButton.style.display = showSwitch ? 'block' : 'none';
        switchIcon.style.display = showSwitch ? 'block' : 'none';
        
        video.srcObject = stream;
        video.muted = true;
        video.style.transform = 'scaleX(1)';
        
        video.onloadedmetadata = async () => {
            try {
                await video.play();
            } catch (playError) {
                if (DEBUG) console.error('Video play error:', playError);
            }
            
            video.classList.add('active');
            placeholder.classList.add('hidden');
            webcamArea.onclick = null;
            webcamArea.style.cursor = 'default';
            
            isVideoActive = true;
            updateAnalyzeButtonState('ready');
            applyVideoOrientation(video);
        };
        
    } catch (error) {
        let errorMessageKey = 'cameraAccessDenied';
        
        if (error.name === 'NotAllowedError') {
            errorMessageKey = 'cameraPermissionDenied';
        } else if (error.name === 'NotFoundError') {
            errorMessageKey = 'cameraNotFound';
        } else if (error.name === 'NotSupportedError') {
            errorMessageKey = 'cameraNotSupported';
        } else if (error.message === 'cameraApiUnsupported') {
            errorMessageKey = 'cameraApiUnsupported';
        } else if (error.name === 'OverconstrainedError') {
            if (DEBUG) console.log('Camera constraint error, trying fallback...');
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                availableCameras = await getAvailableCameras();
                video.srcObject = stream;
                video.muted = true;
                video.onloadedmetadata = async () => {
                    try {
                        await video.play();
                    } catch (playError) {
                        if (DEBUG) console.error('Video play error:', playError);
                    }
                    
                    video.classList.add('active');
                    placeholder.classList.add('hidden');
                    webcamArea.onclick = null;
                    webcamArea.style.cursor = 'default';
                    isVideoActive = true;
                    updateAnalyzeButtonState('ready');
                    const showSwitch = availableCameras.length > 1;
                    switchButton.style.display = showSwitch ? 'block' : 'none';
                    switchIcon.style.display = showSwitch ? 'block' : 'none';
                    applyVideoOrientation(video);
                };
                return;
            } catch (fallbackError) {
                errorMessageKey = 'cameraAccessFailed';
            }
        }
        
        isVideoActive = false;
        video.classList.remove('active');
        placeholder.classList.remove('hidden');
        updateAnalyzeButtonState('disabled');
        switchButton.style.display = 'none';
        switchIcon.style.display = 'none';
        setPlaceholder('🚫', errorMessageKey);
    } finally {
        isRequestingCamera = false;
    }
}

// New function to handle video orientation properly
function applyVideoOrientation(video) {
    const videoTrack = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
    if (!videoTrack) return;
    
    const capabilities = typeof videoTrack.getCapabilities === 'function' ? videoTrack.getCapabilities() : {};
    
    let isFrontCamera = false;
    
    if (capabilities.facingMode && capabilities.facingMode.includes('user')) {
        isFrontCamera = true;
    } else if (capabilities.facingMode && capabilities.facingMode.includes('environment')) {
        isFrontCamera = false;
    } else if (availableCameras.length > 1) {
        isFrontCamera = currentCameraIndex === 1;
    } else if (availableCameras[currentCameraIndex] && availableCameras[currentCameraIndex].label) {
        const label = availableCameras[currentCameraIndex].label.toLowerCase();
        isFrontCamera = label.includes('front') || label.includes('user') || label.includes('selfie') ||
                       label.includes('webcam') || label.includes('built-in') || label.includes('integrated');
    }
    
    if (isFrontCamera) {
        video.style.transform = 'scaleX(-1)';
        if (DEBUG) console.log('Applied front camera mirroring');
    } else {
        video.style.transform = 'scaleX(1)';
        if (DEBUG) console.log('Applied back camera normal orientation');
    }
    
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('autoplay', 'true');
    video.setAttribute('muted', 'true');
}

function initializeCameraPrompt() {
    updateAnalyzeButtonState('disabled');
    setPlaceholder('📷', 'placeholderDefault');
}

currentLanguage = getPreferredLanguage();
setupLanguageSwitcher();
applyTranslations();
initializeCameraPrompt();
requestCameraAccess();

function captureFrame() {
    const video = document.getElementById('webcam-video');
    const canvas = document.getElementById('frozen-frame');
    
    if (!video.videoWidth || !video.videoHeight) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Return base64 encoded image without the data URL prefix
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    return dataURL.split(',')[1]; // Remove "data:image/jpeg;base64," prefix
}

function showFrozenFrame() {
    const video = document.getElementById('webcam-video');
    const canvas = document.getElementById('frozen-frame');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    
    // Apply the same transform as the video
    const videoTransform = window.getComputedStyle(video).transform;
    if (videoTransform && videoTransform !== 'none') {
        canvas.style.transform = videoTransform;
    }
    
    context.drawImage(video, 0, 0);
    
    canvas.classList.add('show');
}

function hideFrozenFrame() {
    const canvas = document.getElementById('frozen-frame');
    canvas.classList.remove('show');
}

async function analyzeImage(imageBase64) {
    try {
        const response = await fetch(BACKEND_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: imageBase64
            })
        });


        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const id = data && typeof data.id === 'string' ? data.id : 'backend_error';
            const message = data && typeof data.message === 'string' ? data.message : `Backend error: ${response.status}`;
            if (DEBUG) console.error('Backend error:', { status: response.status, id, message });
            throw new Error('AI analysis failed. Please try again later.');
        }

        if (!data || data.ok !== true || !data.result) {
            if (DEBUG) console.error('Unexpected backend response:', { status: response.status, data });
            throw new Error('AI analysis failed. Please try again later.');
        }

        return data.result;
        
    } catch (error) {
        if (DEBUG) console.error('Analyze error:', error);
        throw new Error('AI analysis failed. Please try again later.');
    }
}

function showResults(results) {
    const resultsArea = document.getElementById('results-area');
    const fractionElement = document.getElementById('result-fraction');
    const purityElement = document.getElementById('result-purity');
    const subclassElement = document.getElementById('result-subclass');

    latestResults = results;
    fractionElement.textContent = localizeResultValue('fraction', results.fraction);
    purityElement.textContent = localizeResultValue('purity', results.purity);
    subclassElement.textContent = localizeResultValue('subfraction', results.subfraction);
    
    resultsArea.classList.add('show');
}

function hideResults() {
    const resultsArea = document.getElementById('results-area');
    resultsArea.classList.remove('show');
}

function startCountdown(button) {
    let timeLeft = 10;
    button.classList.add('countdown');
    
    const updateButton = () => {
        updateAnalyzeButtonState('countdown', timeLeft);
        timeLeft--;
        
        if (timeLeft === 0) {
            hideFrozenFrame();
            hideResults();
        }
        
        if (timeLeft < 0) {
            button.classList.remove('countdown');
            updateAnalyzeButtonState('ready', 0);
            clearInterval(countdownTimer);
        }
    };
    
    updateButton();
    countdownTimer = setInterval(updateButton, 1000);
}

// Analyze button functionality
document.getElementById('identify-btn').addEventListener('click', async function() {
    if (isVideoActive) {
        const imageBase64 = captureFrame();
        showFrozenFrame();
        
        updateAnalyzeButtonState('analyzing');
        
        try {
            const results = await analyzeImage(imageBase64);
            showResults(results);
            
        } catch (error) {
            showResults({
                fraction: '__ai_unavailable__',
                purity: '__none__',
                subfraction: '__none__'
            });
        }
        
        startCountdown(this);
    }
});

// Camera switch button functionality with improved mobile support
document.getElementById('camera-switch-btn').addEventListener('click', switchCamera);

// Add touch event support for better mobile interaction
document.getElementById('camera-switch-btn').addEventListener('touchstart', function(e) {
    e.preventDefault(); // Prevent double-tap zoom on mobile
    this.style.transform = 'scale(0.95)';
});

document.getElementById('camera-switch-btn').addEventListener('touchend', function(e) {
    e.preventDefault();
    this.style.transform = 'scale(1)';
    switchCamera();
});

window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
});
