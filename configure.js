const STORAGE_KEY = 'easysort-language';
const BASKET_KEY = 'easysort-basket-v2';
const ORDER_URL = document.body.dataset.orderUrl;
const ORDER_TIMEOUT_MS = 15000;
const ORDER_EMAIL = 'lucas@easysort.org';
const MAX_UNITS = 50;
const MAX_LOCATIONS = 20;
const MAX_LINES = 20;

/* Prices from the Easysort offer of 29 September 2026 (DKK, excl. VAT).
 * Location prices: the first location costs `first`, each further one `extra`. */
const PRODUCTS = {
    sorting: {
        image: 'models/sorteringsguide.png',
        defaultOption: 'app',
        options: {
            app: {
                unit: null,
                unitSetup: 0,
                unitMonthly: 0,
                locationSetup: { first: 15000, extra: 9000 },
                locationMonthly: { first: 4000, extra: 1800 },
                setupItems: ['signsA1', 'qrLabels', 'signDesign', 'siteMap', 'easytrack', 'training', 'precision'],
                operationItems: ['hostingRequests', 'uptimeAlerts', 'reviewGuidance', 'apiDevelopment', 'retraining', 'guideChanges', 'freeImprovements']
            },
            box: {
                unit: 'box',
                hardware: true,
                unitSetup: 30000,
                unitMonthly: 6000,
                locationSetup: { first: 0, extra: 0 },
                locationMonthly: { first: 0, extra: 0 },
                setupItems: ['boxHardware', 'outdoorScreen', 'banners', 'bannerDesign', 'mounting', 'siteMap', 'easytrack', 'training', 'precision'],
                operationItems: ['hostingRequests', 'dataConnection', 'serverModel', 'uptimeReplace', 'reviewGuidance', 'recognitionUpdates', 'retraining', 'freeModels']
            }
        }
    },
    monitoring: {
        image: 'models/teltovervågning.png',
        defaultOption: 'reuse',
        options: {
            reuse: {
                unit: 'camera',
                hardware: true,
                unitSetup: 6000,
                unitMonthly: 1800,
                locationSetup: { first: 0, extra: 0 },
                locationMonthly: { first: 1000, extra: 1000 },
                setupItems: ['reuseCamera', 'reuseModel', 'easytrack', 'precision'],
                operationItems: ['reuseImages', 'hostingOnly', 'serverOperation', 'uptimeReplace', 'reviewImages', 'retraining', 'freeModels']
            },
            container: {
                unit: 'camera',
                hardware: true,
                unitSetup: 10000,
                unitMonthly: 3500,
                locationSetup: { first: 0, extra: 0 },
                locationMonthly: { first: 0, extra: 0 },
                setupItems: ['containerCamera', 'containerModel', 'easytrack', 'precision'],
                operationItems: ['containerAnalysis', 'hostingOnly', 'serverOperation', 'uptimeReplace', 'reviewImages', 'retraining', 'freeModels']
            }
        }
    }
};

const copy = {
    en: {
        pageTitle: 'Configure — Easysort',
        eyebrow: 'Configure',
        title: 'Build your order.',
        basket: 'Basket',
        chooseProduct: 'Product',
        chooseOption: 'Option',
        quantity: 'Quantity',
        locations: 'Locations',
        sorting: 'Sorting Guide',
        monitoring: 'Monitoring Box',
        option_app: 'App',
        option_app_body: 'Visitors scan a QR code, take a photo, and get the route to the container.',
        option_app_price: '{setup} + {monthly} / month for the first location',
        option_box: 'Physical box',
        option_box_body: 'A screen on site shows where the waste goes.',
        option_box_price: '{setup} + {monthly} / month per box',
        option_reuse: 'Reuse monitoring',
        option_reuse_body: 'A camera on site tracks movement and items. Over 100,000 images a day.',
        option_reuse_price: '{setup} + {monthly} / month per camera, + {location} / month per location',
        option_container: 'Container monitoring',
        option_container_body: 'A camera at the container analyzes complex items in depth.',
        option_container_price: '{setup} + {monthly} / month per camera',
        unit_box: 'Boxes',
        unit_camera: 'Cameras',
        count_box_one: '1 box',
        count_box: '{count} boxes',
        count_camera_one: '1 camera',
        count_camera: '{count} cameras',
        locationCountOne: '1 location',
        locationCount: '{count} locations',
        extraLocationNote: 'Each extra location: {setup} setup and {monthly} / month.',
        includedSetup: 'Included in setup',
        includedOperation: 'Included in operation',
        signsA1: '2 A1 signs, designed and printed (worth 4,000 kr.)',
        qrLabels: '80 A4 QR labels for containers and signs (worth 2,500 kr.)',
        signDesign: 'Design of signs and labels. You can request changes.',
        siteMap: 'Site map, fraction split, and special rules',
        easytrack: 'Setup in and access to EasyTrack',
        training: 'Model training for your fraction split',
        precision: 'Accuracy testing',
        boxHardware: 'Box with computer, internet, and camera',
        outdoorScreen: 'Outdoor screen fitted in the box',
        banners: '2 banners and 1 A1 sign',
        bannerDesign: 'Design of banners and sign, adapted to your design guide',
        mounting: 'We mount the box, signs, and banners on site',
        reuseCamera: 'Camera box for monitoring, mounted on site',
        reuseModel: 'Model deployed and tuned for movement and items',
        containerCamera: 'Camera box mounted at the container',
        containerModel: 'Model deployed and tuned for complex items',
        hostingRequests: 'Unlimited hosting and requests',
        hostingOnly: 'Unlimited hosting',
        uptimeAlerts: 'Uptime and error monitoring',
        uptimeReplace: 'Uptime monitoring, and replacement if it fails',
        reviewGuidance: 'Weekly review of a sample of answers',
        reviewImages: 'Weekly review of a sample of images',
        apiDevelopment: 'API, support, and help with further development',
        retraining: 'Retraining at least every month',
        guideChanges: 'Unlimited changes to the guide',
        freeImprovements: 'Free improvements to the experience and model',
        dataConnection: 'Data connection for the device',
        serverModel: 'The model runs around the clock on our servers',
        recognitionUpdates: 'Unlimited updates to fractions and recognition',
        freeModels: 'Free new models, API, and support',
        reuseImages: 'Over 100,000 images a day, for movement and items',
        serverOperation: 'Data connection and model operation on our servers',
        containerAnalysis: 'In-depth analysis of complex items',
        setup: 'Setup',
        monthly: 'Monthly',
        vatNote: 'Prices excl. VAT.',
        perMonth: '/ month',
        addToBasket: 'Add to basket',
        added: 'Added. Configure another line, or order below.',
        basketTitle: 'Your basket',
        basketLead: 'Mix products, options, and locations. Add as many lines as you need.',
        remove: 'Remove',
        order: 'Order',
        lastStep: 'Last step',
        checkoutTitle: 'Confirm your order.',
        checkoutLead: 'No payment now. We contact you to confirm delivery and payment before anything is binding.',
        dpaTitle: 'Data processing agreement',
        dpaBody: 'We sign it before we start. It covers every image, and faces and license plates are blurred immediately. Images are kept for at most 30 days and almost always deleted within 24 hours. Selected anonymous images are kept longer to improve accuracy.',
        email: 'Work email',
        name: 'Name (optional)',
        company: 'Organization (optional)',
        checklistTitle: 'Before you send',
        checkDecision: 'I can approve this purchase, or the person who can is part of this request.',
        checkBudget: 'We have budget for the amounts in the basket.',
        checkTimeline: 'We want to start within the next three months.',
        checkInfrastructure: 'We have power where the box or camera will go.',
        note: 'Note (optional)',
        send: 'Send order request',
        sending: 'Sending…',
        errorEmail: 'Enter a valid email address.',
        errorChecklist: 'Confirm every point in the checklist.',
        errorSend: 'We could not send your request. ',
        errorSendLink: 'Email it to us instead',
        confirmedEyebrow: 'Request received',
        confirmedTitle: 'Thank you. We have your order.',
        confirmedBody: 'We will contact you at {email} to confirm delivery and payment.',
        backHome: 'Back to Easysort',
        privacy: 'Privacy',
        mailSubject: 'Easysort order request'
    },
    da: {
        pageTitle: 'Konfigurér — Easysort',
        eyebrow: 'Konfigurér',
        title: 'Sammensæt jeres ordre.',
        basket: 'Kurv',
        chooseProduct: 'Produkt',
        chooseOption: 'Løsning',
        quantity: 'Antal',
        locations: 'Pladser',
        sorting: 'Sorteringsguide',
        monitoring: 'Overvågningsboks',
        option_app: 'App',
        option_app_body: 'Borgeren scanner en QR-kode, tager et billede og får ruten til containeren.',
        option_app_price: '{setup} + {monthly} / md. for den første plads',
        option_box: 'Fysisk boks',
        option_box_body: 'En skærm på pladsen viser, hvor affaldet skal hen.',
        option_box_price: '{setup} + {monthly} / md. pr. boks',
        option_reuse: 'Genbrugsovervågning',
        option_reuse_body: 'Et kamera på pladsen følger bevægelse og emner. Over 100.000 billeder om dagen.',
        option_reuse_price: '{setup} + {monthly} / md. pr. kamera, + {location} / md. pr. plads',
        option_container: 'Containerovervågning',
        option_container_body: 'Et kamera ved containeren laver en dybdegående analyse af komplekse emner.',
        option_container_price: '{setup} + {monthly} / md. pr. kamera',
        unit_box: 'Bokse',
        unit_camera: 'Kameraer',
        count_box_one: '1 boks',
        count_box: '{count} bokse',
        count_camera_one: '1 kamera',
        count_camera: '{count} kameraer',
        locationCountOne: '1 plads',
        locationCount: '{count} pladser',
        extraLocationNote: 'Hver ekstra plads: {setup} i opsætning og {monthly} / md.',
        includedSetup: 'Med i opsætningen',
        includedOperation: 'Med i driften',
        signsA1: '2 A1-skilte med design og print, værdi 4.000 kr.',
        qrLabels: '80 A4 QR-mærker til containere og skilte, værdi 2.500 kr.',
        signDesign: 'Design af skilte og mærker. I kan komme med ændringer.',
        siteMap: 'Pladskort, fraktionsdeling og særskilte regler',
        easytrack: 'Opsætning i og adgang til EasyTrack',
        training: 'Træning af modellen til fraktionsdeling',
        precision: 'Test af præcision',
        boxHardware: 'Boks med computer, internet og kamera',
        outdoorScreen: 'Udendørs skærm, sat i boksen',
        banners: '2 bannere og 1 A1-skilt',
        bannerDesign: 'Design af bannere og skilt. I kan rette efter jeres designguide.',
        mounting: 'Vi sætter boks, skilte og bannere op på pladsen',
        reuseCamera: 'Kameraboks til overvågning, sat op på pladsen',
        reuseModel: 'Modellen implementeres og køres ind på bevægelse og emner',
        containerCamera: 'Kameraboks, sat op ved containeren',
        containerModel: 'Modellen implementeres og køres ind på komplekse emner',
        hostingRequests: 'Ubegrænset hosting og ubegrænsede forespørgsler',
        hostingOnly: 'Ubegrænset hosting',
        uptimeAlerts: 'Overvågning af driftstid og fejlmeldinger',
        uptimeReplace: 'Overvågning af driftstid, og udskiftning hvis den fejler',
        reviewGuidance: 'Gennemgang af et udvalg af hver uges vejledninger',
        reviewImages: 'Gennemgang af et udvalg af hver uges billeder',
        apiDevelopment: 'API, support og hjælp til videre udvikling',
        retraining: 'Gentræning mindst hver måned',
        guideChanges: 'Ubegrænsede ændringer til guiden',
        freeImprovements: 'Gratis forbedring af oplevelse og model',
        dataConnection: 'Dataforbindelse til enheden',
        serverModel: 'Modellen kører døgnet rundt på vores servere',
        recognitionUpdates: 'Ubegrænsede opdateringer af fraktioner og genkendelse',
        freeModels: 'Gratis nye modeller, API og support',
        reuseImages: 'Over 100.000 billeder om dagen, for bevægelse og emner',
        serverOperation: 'Dataforbindelse og drift af modellen på vores servere',
        containerAnalysis: 'Dybdegående analyse af komplekse emner',
        setup: 'Opsætning',
        monthly: 'Drift pr. måned',
        vatNote: 'Priser ekskl. moms.',
        perMonth: '/ md.',
        addToBasket: 'Læg i kurv',
        added: 'Tilføjet. Sammensæt en linje mere, eller bestil nedenfor.',
        basketTitle: 'Jeres kurv',
        basketLead: 'Kombinér produkter, løsninger og pladser. Tilføj så mange linjer, I har brug for.',
        remove: 'Fjern',
        order: 'Bestil',
        lastStep: 'Sidste trin',
        checkoutTitle: 'Bekræft jeres ordre.',
        checkoutLead: 'Ingen betaling nu. Vi kontakter jer og bekræfter levering og betaling, før noget er bindende.',
        dpaTitle: 'Databehandleraftale',
        dpaBody: 'Vi underskriver den, før vi går i gang. Den gælder alle billeder, og ansigter og nummerplader sløres med det samme. Billeder gemmes i højst 30 dage og slettes næsten altid inden for 24 timer. Udvalgte anonyme billeder holdes længere for at øge præcisionen.',
        email: 'Arbejdsmail',
        name: 'Navn (valgfrit)',
        company: 'Organisation (valgfrit)',
        checklistTitle: 'Før I sender',
        checkDecision: 'Jeg kan godkende købet, eller den der kan, er med på denne forespørgsel.',
        checkBudget: 'Vi har budget til beløbene i kurven.',
        checkTimeline: 'Vi vil gerne i gang inden for de næste tre måneder.',
        checkInfrastructure: 'Vi har strøm, hvor boksen eller kameraet skal sidde.',
        note: 'Note (valgfri)',
        send: 'Send ordreforespørgsel',
        sending: 'Sender…',
        errorEmail: 'Skriv en gyldig e-mailadresse.',
        errorChecklist: 'Bekræft alle punkter på tjeklisten.',
        errorSend: 'Vi kunne ikke sende forespørgslen. ',
        errorSendLink: 'Send den til os på mail i stedet',
        confirmedEyebrow: 'Forespørgsel modtaget',
        confirmedTitle: 'Tak. Vi har modtaget jeres ordre.',
        confirmedBody: 'Vi kontakter jer på {email} og bekræfter levering og betaling.',
        backHome: 'Tilbage til Easysort',
        privacy: 'Privatliv',
        mailSubject: 'Easysort ordreforespørgsel'
    },
    de: {
        pageTitle: 'Konfigurieren — Easysort',
        eyebrow: 'Konfigurieren',
        title: 'Bestellung zusammenstellen.',
        basket: 'Warenkorb',
        chooseProduct: 'Produkt',
        chooseOption: 'Lösung',
        quantity: 'Anzahl',
        locations: 'Standorte',
        sorting: 'Sortierhilfe',
        monitoring: 'Monitoring Box',
        option_app: 'App',
        option_app_body: 'Besucher scannen einen QR-Code, machen ein Foto und sehen den Weg zum Container.',
        option_app_price: '{setup} + {monthly} / Monat für den ersten Standort',
        option_box: 'Physische Box',
        option_box_body: 'Ein Bildschirm vor Ort zeigt, wohin der Abfall gehört.',
        option_box_price: '{setup} + {monthly} / Monat pro Box',
        option_reuse: 'Wiederverwendungsüberwachung',
        option_reuse_body: 'Eine Kamera vor Ort erfasst Bewegungen und Gegenstände. Über 100.000 Bilder pro Tag.',
        option_reuse_price: '{setup} + {monthly} / Monat pro Kamera, + {location} / Monat pro Standort',
        option_container: 'Containerüberwachung',
        option_container_body: 'Eine Kamera am Container analysiert komplexe Gegenstände im Detail.',
        option_container_price: '{setup} + {monthly} / Monat pro Kamera',
        unit_box: 'Boxen',
        unit_camera: 'Kameras',
        count_box_one: '1 Box',
        count_box: '{count} Boxen',
        count_camera_one: '1 Kamera',
        count_camera: '{count} Kameras',
        locationCountOne: '1 Standort',
        locationCount: '{count} Standorte',
        extraLocationNote: 'Jeder weitere Standort: {setup} Einrichtung und {monthly} / Monat.',
        includedSetup: 'In der Einrichtung enthalten',
        includedOperation: 'Im Betrieb enthalten',
        signsA1: '2 A1-Schilder mit Design und Druck (Wert 4.000 kr.)',
        qrLabels: '80 A4-QR-Etiketten für Container und Schilder (Wert 2.500 kr.)',
        signDesign: 'Design von Schildern und Etiketten. Änderungswünsche sind möglich.',
        siteMap: 'Lageplan, Fraktionsaufteilung und Sonderregeln',
        easytrack: 'Einrichtung und Zugang zu EasyTrack',
        training: 'Training des Modells für Ihre Fraktionsaufteilung',
        precision: 'Genauigkeitstest',
        boxHardware: 'Box mit Computer, Internet und Kamera',
        outdoorScreen: 'Outdoor-Bildschirm in der Box',
        banners: '2 Banner und 1 A1-Schild',
        bannerDesign: 'Design von Bannern und Schild nach Ihrem Designleitfaden',
        mounting: 'Wir montieren Box, Schilder und Banner vor Ort',
        reuseCamera: 'Kamerabox zur Überwachung, vor Ort montiert',
        reuseModel: 'Modell eingerichtet und auf Bewegung und Gegenstände abgestimmt',
        containerCamera: 'Kamerabox, am Container montiert',
        containerModel: 'Modell eingerichtet und auf komplexe Gegenstände abgestimmt',
        hostingRequests: 'Unbegrenztes Hosting und unbegrenzte Anfragen',
        hostingOnly: 'Unbegrenztes Hosting',
        uptimeAlerts: 'Überwachung von Verfügbarkeit und Fehlern',
        uptimeReplace: 'Überwachung der Verfügbarkeit und Austausch bei Ausfall',
        reviewGuidance: 'Wöchentliche Prüfung einer Auswahl von Antworten',
        reviewImages: 'Wöchentliche Prüfung einer Auswahl von Bildern',
        apiDevelopment: 'API, Support und Hilfe bei der Weiterentwicklung',
        retraining: 'Nachtraining mindestens monatlich',
        guideChanges: 'Unbegrenzte Änderungen an der Sortierhilfe',
        freeImprovements: 'Kostenlose Verbesserungen von Nutzung und Modell',
        dataConnection: 'Datenverbindung für das Gerät',
        serverModel: 'Das Modell läuft rund um die Uhr auf unseren Servern',
        recognitionUpdates: 'Unbegrenzte Updates von Fraktionen und Erkennung',
        freeModels: 'Kostenlose neue Modelle, API und Support',
        reuseImages: 'Über 100.000 Bilder pro Tag für Bewegung und Gegenstände',
        serverOperation: 'Datenverbindung und Betrieb des Modells auf unseren Servern',
        containerAnalysis: 'Detaillierte Analyse komplexer Gegenstände',
        setup: 'Einrichtung',
        monthly: 'Betrieb pro Monat',
        vatNote: 'Preise zzgl. MwSt.',
        perMonth: '/ Monat',
        addToBasket: 'In den Warenkorb',
        added: 'Hinzugefügt. Weitere Position konfigurieren oder unten bestellen.',
        basketTitle: 'Ihr Warenkorb',
        basketLead: 'Produkte, Lösungen und Standorte kombinieren. Beliebig viele Positionen hinzufügen.',
        remove: 'Entfernen',
        order: 'Bestellen',
        lastStep: 'Letzter Schritt',
        checkoutTitle: 'Bestellung bestätigen.',
        checkoutLead: 'Jetzt keine Zahlung. Wir kontaktieren Sie und bestätigen Lieferung und Zahlung, bevor etwas verbindlich ist.',
        dpaTitle: 'Auftragsverarbeitungsvertrag',
        dpaBody: 'Wir unterzeichnen ihn vor dem Start. Er gilt für alle Bilder, Gesichter und Kennzeichen werden sofort unkenntlich gemacht. Bilder werden höchstens 30 Tage gespeichert und fast immer innerhalb von 24 Stunden gelöscht. Ausgewählte anonyme Bilder werden länger aufbewahrt, um die Genauigkeit zu verbessern.',
        email: 'Geschäftliche E-Mail',
        name: 'Name (optional)',
        company: 'Organisation (optional)',
        checklistTitle: 'Vor dem Absenden',
        checkDecision: 'Ich kann diesen Kauf freigeben, oder die Person, die es kann, ist an dieser Anfrage beteiligt.',
        checkBudget: 'Wir haben Budget für die Beträge im Warenkorb.',
        checkTimeline: 'Wir möchten innerhalb der nächsten drei Monate starten.',
        checkInfrastructure: 'Wo Box oder Kamera montiert wird, gibt es Strom.',
        note: 'Notiz (optional)',
        send: 'Bestellanfrage senden',
        sending: 'Wird gesendet…',
        errorEmail: 'Bitte eine gültige E-Mail-Adresse eingeben.',
        errorChecklist: 'Bitte alle Punkte der Checkliste bestätigen.',
        errorSend: 'Die Anfrage konnte nicht gesendet werden. ',
        errorSendLink: 'Stattdessen per E-Mail senden',
        confirmedEyebrow: 'Anfrage erhalten',
        confirmedTitle: 'Vielen Dank. Ihre Bestellung ist eingegangen.',
        confirmedBody: 'Wir kontaktieren Sie unter {email}, um Lieferung und Zahlung zu bestätigen.',
        backHome: 'Zurück zu Easysort',
        privacy: 'Datenschutz',
        mailSubject: 'Easysort Bestellanfrage'
    }
};

let language = preferredLanguage();
let product = requestedProduct();
let option = PRODUCTS[product].defaultOption;
let units = 1;
let locations = 1;
let basket = loadBasket();
let sending = false;

function preferredLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (copy[saved]) return saved;
    const browserLanguage = (navigator.language || '').toLowerCase();
    if (browserLanguage.startsWith('da')) return 'da';
    if (browserLanguage.startsWith('de')) return 'de';
    return 'en';
}

function requestedProduct() {
    return new URLSearchParams(location.search).get('product') === 'monitoring' ? 'monitoring' : 'sorting';
}

function t(key, replacements = {}) {
    const value = copy[language][key] ?? copy.en[key] ?? key;
    return value.replace(/\{(\w+)\}/g, (_, name) => replacements[name] ?? `{${name}}`);
}

function formatMoney(value) {
    const locale = language === 'da' ? 'da-DK' : language === 'de' ? 'de-DE' : 'en-GB';
    return `${new Intl.NumberFormat(locale).format(Math.round(value))} kr.`;
}

function optionConfig(line) {
    return PRODUCTS[line.product]?.options[line.option];
}

function isValidLine(line) {
    const config = optionConfig(line || {});
    if (!config) return false;
    const unitsOk = config.unit
        ? Number.isInteger(line.units) && line.units >= 1 && line.units <= MAX_UNITS
        : line.units === 0;
    return unitsOk && Number.isInteger(line.locations) && line.locations >= 1 && line.locations <= MAX_LOCATIONS;
}

function loadBasket() {
    try {
        const saved = JSON.parse(localStorage.getItem(BASKET_KEY) || '[]');
        return Array.isArray(saved) ? saved.filter(isValidLine).slice(0, MAX_LINES) : [];
    } catch {
        return [];
    }
}

function saveBasket() {
    localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
}

function tiered(tier, count) {
    return count > 0 ? tier.first + tier.extra * (count - 1) : 0;
}

function priceFor(line) {
    const config = optionConfig(line);
    return {
        setup: config.unitSetup * line.units + tiered(config.locationSetup, line.locations),
        monthly: config.unitMonthly * line.units + tiered(config.locationMonthly, line.locations)
    };
}

function currentLine() {
    const config = PRODUCTS[product].options[option];
    return { product, option, units: config.unit ? units : 0, locations };
}

function countLabel(count, key) {
    return count === 1 ? t(`${key}_one`) : t(key, { count });
}

function lineSummary(line) {
    const config = optionConfig(line);
    const parts = [];
    if (config.unit) parts.push(countLabel(line.units, `count_${config.unit}`));
    parts.push(line.locations === 1 ? t('locationCountOne') : t('locationCount', { count: line.locations }));
    return parts.join(' · ');
}

function lineTitle(line) {
    return `${t(line.product)} · ${t(`option_${line.option}`)}`;
}

function basketTotals() {
    return basket.reduce((sum, line) => {
        const price = priceFor(line);
        return { setup: sum.setup + price.setup, monthly: sum.monthly + price.monthly };
    }, { setup: 0, monthly: 0 });
}

function basketNeedsHardware() {
    return basket.some((line) => optionConfig(line).hardware);
}

function optionPriceText(key, config) {
    const setup = config.unit ? config.unitSetup : config.locationSetup.first;
    const monthly = config.unit ? config.unitMonthly : config.locationMonthly.first;
    return t(`option_${key}_price`, {
        setup: formatMoney(setup),
        monthly: formatMoney(monthly),
        location: formatMoney(config.locationMonthly.first)
    });
}

function fillList(id, keys) {
    const list = document.getElementById(id);
    list.textContent = '';
    keys.forEach((key) => {
        const item = document.createElement('li');
        item.textContent = t(key);
        list.append(item);
    });
}

function renderProduct() {
    const config = PRODUCTS[product].options[option];
    document.getElementById('product-image').src = PRODUCTS[product].image;
    document.getElementById('product-title').textContent = `${t(product)} · ${t(`option_${option}`)}`;
    document.getElementById('product-description').textContent = t(`option_${option}_body`);
    fillList('included-setup', config.setupItems);
    fillList('included-operation', config.operationItems);
    document.querySelectorAll('input[name="product"]').forEach((input) => {
        input.checked = input.value === product;
    });
}

function renderOptions() {
    const container = document.getElementById('option-list');
    container.textContent = '';
    Object.entries(PRODUCTS[product].options).forEach(([key, config]) => {
        const label = document.createElement('label');
        label.className = 'service-option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'option';
        input.value = key;
        input.checked = key === option;
        input.addEventListener('change', () => {
            option = key;
            update();
        });

        const body = document.createElement('span');
        const name = document.createElement('strong');
        name.textContent = t(`option_${key}`);
        const detail = document.createElement('small');
        detail.textContent = t(`option_${key}_body`);
        const price = document.createElement('em');
        price.textContent = optionPriceText(key, config);
        body.append(name, detail, price);
        label.append(input, body);
        container.append(label);
    });
}

function renderQuantity() {
    const config = PRODUCTS[product].options[option];
    document.getElementById('unit-group').hidden = !config.unit;
    if (config.unit) document.getElementById('unit-label').textContent = t(`unit_${config.unit}`);
    document.getElementById('unit-output').textContent = String(units);
    document.getElementById('location-output').textContent = String(locations);
    document.getElementById('unit-decrease').disabled = units <= locations;
    document.getElementById('unit-increase').disabled = units >= MAX_UNITS;
    document.getElementById('location-decrease').disabled = locations <= 1;
    document.getElementById('location-increase').disabled = locations >= MAX_LOCATIONS;

    const note = document.getElementById('saving-note');
    const extra = config.locationSetup.extra || config.locationMonthly.extra;
    note.hidden = config.unit !== null || !extra;
    note.textContent = t('extraLocationNote', {
        setup: formatMoney(config.locationSetup.extra),
        monthly: formatMoney(config.locationMonthly.extra)
    });

    const price = priceFor(currentLine());
    document.getElementById('setup-price').textContent = formatMoney(price.setup);
    document.getElementById('monthly-price').textContent = `${formatMoney(price.monthly)} ${t('perMonth')}`;
}

function renderBasket() {
    document.getElementById('basket').hidden = basket.length === 0;
    document.getElementById('basket-link').hidden = basket.length === 0;
    document.getElementById('basket-count').textContent = String(basket.length);
    document.getElementById('add-button').disabled = basket.length >= MAX_LINES;

    const list = document.getElementById('basket-lines');
    list.textContent = '';
    basket.forEach((line, index) => {
        const price = priceFor(line);
        const item = document.createElement('li');

        const text = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = lineTitle(line);
        const meta = document.createElement('span');
        meta.textContent = lineSummary(line);
        text.append(title, meta);

        const amount = document.createElement('div');
        amount.className = 'line-price';
        const setup = document.createElement('strong');
        setup.textContent = formatMoney(price.setup);
        const monthly = document.createElement('span');
        monthly.textContent = `${formatMoney(price.monthly)} ${t('perMonth')}`;
        amount.append(setup, monthly);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-line';
        remove.setAttribute('aria-label', `${t('remove')}: ${lineTitle(line)}`);
        remove.textContent = '×';
        remove.addEventListener('click', () => {
            basket.splice(index, 1);
            saveBasket();
            if (!basket.length) document.getElementById('checkout').hidden = true;
            update();
        });

        item.append(text, amount, remove);
        list.append(item);
    });

    const totals = basketTotals();
    document.getElementById('basket-setup').textContent = formatMoney(totals.setup);
    document.getElementById('basket-monthly').textContent = `${formatMoney(totals.monthly)} ${t('perMonth')}`;
    document.getElementById('basket-note').textContent = t('vatNote');

    const needsHardware = basketNeedsHardware();
    const infrastructure = document.getElementById('infrastructure-check');
    infrastructure.hidden = !needsHardware;
    infrastructure.querySelector('input').required = needsHardware;
}

function update() {
    if (!PRODUCTS[product].options[option]) option = PRODUCTS[product].defaultOption;
    renderProduct();
    renderOptions();
    renderQuantity();
    renderBasket();
}

function applyLanguage() {
    document.documentElement.lang = language;
    document.title = t('pageTitle');
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-language-option]').forEach((button) => {
        button.setAttribute('aria-pressed', button.dataset.languageOption === language ? 'true' : 'false');
    });
    document.getElementById('added-note').textContent = '';
    document.getElementById('form-error').hidden = true;
    if (!document.getElementById('confirmation').hidden) {
        document.getElementById('confirmed-body').textContent = t('confirmedBody', { email: document.getElementById('checkout').elements.email.value.trim() });
    }
    update();
}

function orderText(data) {
    const totals = basketTotals();
    const lines = basket.map((line) => {
        const price = priceFor(line);
        return `- ${lineTitle(line)} (${lineSummary(line)}): ${formatMoney(price.setup)} + ${formatMoney(price.monthly)} ${t('perMonth')}`;
    });
    const optional = [
        data.name && `${t('name')}: ${data.name}`,
        data.organization && `${t('company')}: ${data.organization}`,
        data.note && `${t('note')}: ${data.note}`
    ].filter(Boolean);
    return [
        ...lines,
        '',
        `${t('setup')}: ${formatMoney(totals.setup)}`,
        `${t('monthly')}: ${formatMoney(totals.monthly)} ${t('perMonth')}`,
        '',
        `${t('email')}: ${data.email}`,
        ...optional
    ].join('\n');
}

function showFormError(message, mailtoBody) {
    const error = document.getElementById('form-error');
    error.textContent = message;
    if (mailtoBody) {
        const link = document.createElement('a');
        link.href = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(t('mailSubject'))}&body=${encodeURIComponent(mailtoBody)}`;
        link.textContent = t('errorSendLink');
        error.append(link, '.');
    }
    error.hidden = false;
}

function setSending(value) {
    sending = value;
    const button = document.getElementById('send-button');
    button.disabled = value;
    button.querySelector('span').textContent = value ? t('sending') : t('send');
}

async function submitOrder(event) {
    event.preventDefault();
    if (sending || !basket.length) return;
    const form = event.currentTarget;
    document.getElementById('form-error').hidden = true;

    const emailInput = form.elements.email;
    if (!emailInput.checkValidity() || !emailInput.value.trim()) {
        showFormError(t('errorEmail'));
        emailInput.focus();
        return;
    }
    const missing = Array.from(form.querySelectorAll('.checklist input[required]')).find((input) => !input.checked);
    if (missing) {
        showFormError(t('errorChecklist'));
        missing.focus();
        return;
    }

    const data = {
        email: emailInput.value.trim(),
        name: form.elements.name.value.trim(),
        organization: form.elements.organization.value.trim(),
        note: form.elements.note.value.trim()
    };
    const payload = {
        ...data,
        website: form.elements.website.value,
        language,
        page: location.pathname,
        checklist: {
            decisionMaker: form.elements.decisionMaker.checked,
            budget: form.elements.budget.checked,
            timeline: form.elements.timeline.checked,
            infrastructure: basketNeedsHardware() ? form.elements.infrastructure.checked : null
        },
        items: basket.map((line) => ({ ...line, ...priceFor(line) })),
        totals: basketTotals(),
        currency: 'DKK'
    };

    setSending(true);
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), ORDER_TIMEOUT_MS);
    try {
        const response = await fetch(ORDER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: abort.signal
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result || result.ok !== true) throw new Error('order failed');
        showConfirmation(data.email);
    } catch {
        showFormError(t('errorSend'), orderText(data));
    } finally {
        clearTimeout(timer);
        setSending(false);
    }
}

function showConfirmation(email) {
    basket = [];
    saveBasket();
    document.querySelector('.intro').hidden = true;
    document.querySelector('.config-grid').hidden = true;
    document.getElementById('basket').hidden = true;
    document.getElementById('checkout').hidden = true;
    document.getElementById('basket-link').hidden = true;
    document.getElementById('confirmed-body').textContent = t('confirmedBody', { email });
    document.getElementById('confirmation').hidden = false;
    window.scrollTo({ top: 0 });
}

document.querySelectorAll('[data-language-option]').forEach((button) => {
    button.addEventListener('click', () => {
        language = button.dataset.languageOption;
        localStorage.setItem(STORAGE_KEY, language);
        applyLanguage();
    });
});

document.querySelectorAll('input[name="product"]').forEach((input) => {
    input.addEventListener('change', () => {
        product = input.value;
        option = PRODUCTS[product].defaultOption;
        history.replaceState(null, '', `?product=${product}`);
        update();
    });
});

document.getElementById('unit-decrease').addEventListener('click', () => {
    units = Math.max(locations, units - 1);
    update();
});
document.getElementById('unit-increase').addEventListener('click', () => {
    units = Math.min(MAX_UNITS, units + 1);
    update();
});
document.getElementById('location-decrease').addEventListener('click', () => {
    locations = Math.max(1, locations - 1);
    update();
});
document.getElementById('location-increase').addEventListener('click', () => {
    locations = Math.min(MAX_LOCATIONS, locations + 1);
    units = Math.max(units, locations);
    update();
});
document.getElementById('add-button').addEventListener('click', () => {
    if (basket.length >= MAX_LINES) return;
    basket.push(currentLine());
    saveBasket();
    update();
    document.getElementById('added-note').textContent = t('added');
});
document.getElementById('checkout-button').addEventListener('click', () => {
    const checkout = document.getElementById('checkout');
    checkout.hidden = false;
    checkout.scrollIntoView({ behavior: 'smooth', block: 'start' });
    checkout.elements.email.focus({ preventScroll: true });
});
document.getElementById('checkout').addEventListener('submit', submitOrder);

applyLanguage();
