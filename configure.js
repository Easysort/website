const STORAGE_KEY = 'easysort-language';

const PRODUCTS = {
    sorting: {
        image: 'models/sorteringsguide.png',
        titleKey: 'sorting',
        descriptionKey: 'sortingDescription',
        featureKeys: ['sortingFeatureOne', 'sortingFeatureTwo', 'sortingFeatureThree'],
        services: ['app', 'software', 'hardware', 'managed']
    },
    monitoring: {
        image: 'models/teltovervågning.png',
        titleKey: 'monitoring',
        descriptionKey: 'monitoringDescription',
        featureKeys: ['monitoringFeatureOne', 'monitoringFeatureTwo', 'monitoringFeatureThree'],
        services: ['software', 'hardware', 'managed']
    }
};

const SERVICES = {
    sorting: {
        app: { unitSetup: 2000, unitMonthly: 300, locationSetup: 10000, locationMonthly: 1200, label: 'serviceApp', perks: ['localCatalog', 'hosting', 'updates'] },
        software: { unitSetup: 5000, unitMonthly: 500, locationSetup: 15000, locationMonthly: 2000, label: 'serviceSoftware', perks: ['ownHardware', 'setupHelp', 'updates'] },
        hardware: { unitSetup: 30000, unitMonthly: 1000, locationSetup: 5000, locationMonthly: 1000, label: 'serviceHardware', perks: ['completeStation', 'handover', 'customerOperated'] },
        managed: { unitSetup: 40000, unitMonthly: 3500, locationSetup: 5000, locationMonthly: 2000, label: 'serviceManaged', perks: ['completeStation', 'healthMonitoring', 'maintenance'] }
    },
    monitoring: {
        software: { unitSetup: 6000, unitMonthly: 500, locationSetup: 12000, locationMonthly: 1500, label: 'serviceSoftware', perks: ['ownHardware', 'dashboard', 'updates'] },
        hardware: { unitSetup: 23000, unitMonthly: 700, locationSetup: 5000, locationMonthly: 800, label: 'serviceHardware', perks: ['monitoringBox', 'handover', 'customerOperated'] },
        managed: { unitSetup: 32000, unitMonthly: 2800, locationSetup: 6000, locationMonthly: 1700, label: 'serviceManaged', perks: ['monitoringBox', 'healthMonitoring', 'maintenance'] }
    }
};

const copy = {
    en: {
        pageTitle: 'Configure — Easysort',
        back: 'Back',
        eyebrow: 'Configure',
        title: 'Configure your Easysort system.',
        chooseProduct: 'Product',
        chooseService: 'Service',
        quantity: 'Quantity',
        units: 'Units',
        locations: 'Locations',
        sorting: 'Sorting Guide',
        monitoring: 'Monitoring Box',
        sortingDescription: 'Help visitors sort correctly on a phone or at a fixed station.',
        monitoringDescription: 'Monitor activity or find misplaced items in containers.',
        sortingFeatureOne: 'Local sorting guide for each recycling center',
        sortingFeatureTwo: 'Use on phones, your hardware, or an Easysort station',
        sortingFeatureThree: 'Add more units without creating another system',
        monitoringFeatureOne: 'Choose activity or misplaced-item monitoring',
        monitoringFeatureTwo: 'One overview across units and locations',
        monitoringFeatureThree: 'Optional alerts for events that need action',
        serviceApp: 'App',
        serviceSoftware: 'Use your hardware',
        serviceHardware: 'We supply it; you operate it',
        serviceManaged: 'Fully managed by Easysort',
        localCatalog: 'Local sorting catalog',
        hosting: 'Hosting included',
        updates: 'Software updates',
        ownHardware: 'Your camera and screen',
        setupHelp: 'Setup help',
        completeStation: 'Complete station',
        monitoringBox: 'Camera box included',
        handover: 'Installation and handover',
        customerOperated: 'You control and maintain it',
        dashboard: 'Overview dashboard',
        healthMonitoring: 'Health monitoring',
        maintenance: 'Maintenance and replacement',
        setup: 'Example setup',
        monthly: 'Example monthly',
        placeholder: 'Placeholder prices—not an offer.',
        continue: 'Continue',
        saveMore: 'Add more units to see example volume savings.',
        saving: '{percent}% example unit saving on {units} units across {locations} locations.',
        lastStep: 'Last step',
        contactTitle: 'Where should we contact you?',
        contactLead: 'No payment now. We will confirm the final setup, delivery, and payment with you.',
        name: 'Name',
        company: 'Organization',
        email: 'Email',
        locationsField: 'Location(s)',
        note: 'Note (optional)',
        send: 'Prepare request',
        mailNote: 'Opens a prepared email for you to send.',
        privacy: 'Privacy',
        perMonth: '/ month',
        mailSubject: 'Easysort configuration',
        mailProduct: 'Product',
        mailService: 'Service',
        mailUnits: 'Units',
        mailLocations: 'Locations',
        mailSetup: 'Example setup',
        mailMonthly: 'Example monthly',
        mailDisclaimer: 'Placeholder prices only. Please confirm final configuration, delivery, and payment.'
    },
    da: {
        pageTitle: 'Konfigurér — Easysort',
        back: 'Tilbage',
        eyebrow: 'Konfigurér',
        title: 'Konfigurér jeres Easysort-system.',
        chooseProduct: 'Produkt',
        chooseService: 'Service',
        quantity: 'Antal',
        units: 'Enheder',
        locations: 'Lokationer',
        sorting: 'Sorteringsguide',
        monitoring: 'Overvågningsboks',
        sortingDescription: 'Hjælp besøgende med at sortere korrekt på telefonen eller ved en fast station.',
        monitoringDescription: 'Følg aktivitet, eller find fejlsorterede ting i containere.',
        sortingFeatureOne: 'Lokal sorteringsguide til hver genbrugsplads',
        sortingFeatureTwo: 'Brug på telefoner, jeres hardware eller en Easysort-station',
        sortingFeatureThree: 'Tilføj flere enheder uden at oprette et nyt system',
        monitoringFeatureOne: 'Vælg aktivitet eller overvågning af fejlsorterede ting',
        monitoringFeatureTwo: 'Ét overblik på tværs af enheder og lokationer',
        monitoringFeatureThree: 'Valgfrie advarsler ved hændelser, der kræver handling',
        serviceApp: 'App',
        serviceSoftware: 'Brug jeres hardware',
        serviceHardware: 'Vi leverer; I driver',
        serviceManaged: 'Fuldt serviceret af Easysort',
        localCatalog: 'Lokalt sorteringskatalog',
        hosting: 'Hosting inkluderet',
        updates: 'Softwareopdateringer',
        ownHardware: 'Jeres kamera og skærm',
        setupHelp: 'Hjælp til opsætning',
        completeStation: 'Komplet station',
        monitoringBox: 'Kameraboks inkluderet',
        handover: 'Installation og overdragelse',
        customerOperated: 'I styrer og vedligeholder',
        dashboard: 'Overblik i dashboard',
        healthMonitoring: 'Overvågning af enhedens tilstand',
        maintenance: 'Vedligehold og udskiftning',
        setup: 'Eksempel på opstart',
        monthly: 'Eksempel pr. måned',
        placeholder: 'Midlertidige priser—ikke et tilbud.',
        continue: 'Fortsæt',
        saveMore: 'Tilføj flere enheder for at se en eksempelrabat.',
        saving: '{percent}% eksempelrabat på {units} enheder fordelt på {locations} lokationer.',
        lastStep: 'Sidste trin',
        contactTitle: 'Hvor skal vi kontakte jer?',
        contactLead: 'Ingen betaling nu. Vi bekræfter endelig opsætning, levering og betaling med jer.',
        name: 'Navn',
        company: 'Organisation',
        email: 'E-mail',
        locationsField: 'Lokation(er)',
        note: 'Note (valgfri)',
        send: 'Forbered forespørgsel',
        mailNote: 'Åbner en forberedt mail, som I kan sende.',
        privacy: 'Privatliv',
        perMonth: '/ md.',
        mailSubject: 'Easysort-konfiguration',
        mailProduct: 'Produkt',
        mailService: 'Service',
        mailUnits: 'Enheder',
        mailLocations: 'Lokationer',
        mailSetup: 'Eksempel på opstart',
        mailMonthly: 'Eksempel pr. måned',
        mailDisclaimer: 'Kun midlertidige priser. Bekræft venligst endelig konfiguration, levering og betaling.'
    },
    de: {
        pageTitle: 'Konfigurieren — Easysort',
        back: 'Zurück',
        eyebrow: 'Konfigurieren',
        title: 'Ihr Easysort-System konfigurieren.',
        chooseProduct: 'Produkt',
        chooseService: 'Service',
        quantity: 'Anzahl',
        units: 'Einheiten',
        locations: 'Standorte',
        sorting: 'Sortierhilfe',
        monitoring: 'Monitoring Box',
        sortingDescription: 'Besuchern helfen, am Smartphone oder an einer festen Station richtig zu sortieren.',
        monitoringDescription: 'Aktivität erfassen oder falsch sortierte Gegenstände in Containern finden.',
        sortingFeatureOne: 'Lokale Sortierhilfe für jeden Recyclinghof',
        sortingFeatureTwo: 'Am Smartphone, auf eigener Hardware oder an einer Easysort-Station',
        sortingFeatureThree: 'Weitere Einheiten ohne ein neues System hinzufügen',
        monitoringFeatureOne: 'Aktivitäts- oder Fehlwurfüberwachung auswählen',
        monitoringFeatureTwo: 'Eine Übersicht über Einheiten und Standorte',
        monitoringFeatureThree: 'Optionale Warnungen bei Handlungsbedarf',
        serviceApp: 'App',
        serviceSoftware: 'Eigene Hardware verwenden',
        serviceHardware: 'Wir liefern; Sie betreiben',
        serviceManaged: 'Vollständig von Easysort betreut',
        localCatalog: 'Lokaler Sortierkatalog',
        hosting: 'Hosting inklusive',
        updates: 'Software-Updates',
        ownHardware: 'Ihre Kamera und Ihr Bildschirm',
        setupHelp: 'Hilfe bei der Einrichtung',
        completeStation: 'Komplette Station',
        monitoringBox: 'Kamerabox inklusive',
        handover: 'Installation und Übergabe',
        customerOperated: 'Sie steuern und warten das System',
        dashboard: 'Übersichts-Dashboard',
        healthMonitoring: 'Zustandsüberwachung',
        maintenance: 'Wartung und Austausch',
        setup: 'Beispiel Einrichtung',
        monthly: 'Beispiel monatlich',
        placeholder: 'Platzhalterpreise — kein Angebot.',
        continue: 'Weiter',
        saveMore: 'Weitere Einheiten hinzufügen, um einen Beispielrabatt zu sehen.',
        saving: '{percent}% Beispielrabatt auf {units} Einheiten an {locations} Standorten.',
        lastStep: 'Letzter Schritt',
        contactTitle: 'Wie können wir Sie kontaktieren?',
        contactLead: 'Jetzt keine Zahlung. Wir bestätigen die endgültige Einrichtung, Lieferung und Zahlung mit Ihnen.',
        name: 'Name',
        company: 'Organisation',
        email: 'E-Mail',
        locationsField: 'Standort(e)',
        note: 'Notiz (optional)',
        send: 'Anfrage vorbereiten',
        mailNote: 'Öffnet eine vorbereitete E-Mail zum Versenden.',
        privacy: 'Datenschutz',
        perMonth: '/ Monat',
        mailSubject: 'Easysort-Konfiguration',
        mailProduct: 'Produkt',
        mailService: 'Service',
        mailUnits: 'Einheiten',
        mailLocations: 'Standorte',
        mailSetup: 'Beispiel Einrichtung',
        mailMonthly: 'Beispiel monatlich',
        mailDisclaimer: 'Nur Platzhalterpreise. Bitte endgültige Konfiguration, Lieferung und Zahlung bestätigen.'
    }
};

let language = preferredLanguage();
let product = requestedProduct();
let service = 'managed';
let units = 1;
let locations = 1;

function preferredLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'da' || saved === 'en' || saved === 'de') return saved;
    const browserLanguage = (navigator.language || '').toLowerCase();
    if (browserLanguage.startsWith('da')) return 'da';
    if (browserLanguage.startsWith('de')) return 'de';
    return 'en';
}

function requestedProduct() {
    return new URLSearchParams(location.search).get('product') === 'monitoring' ? 'monitoring' : 'sorting';
}

function t(key, replacements = {}) {
    const value = copy[language][key] || copy.en[key] || key;
    return value.replace(/\{(\w+)\}/g, (_, name) => replacements[name] ?? `{${name}}`);
}

function formatMoney(value) {
    const locale = language === 'da' ? 'da-DK' : language === 'de' ? 'de-DE' : 'en-GB';
    return `${new Intl.NumberFormat(locale).format(Math.round(value))} kr.`;
}

function discount() {
    if (units >= 10) return 0.20;
    if (units >= 5) return 0.15;
    if (units >= 2) return 0.08;
    return 0;
}

function selectedService() {
    return SERVICES[product][service];
}

function totals() {
    const selected = selectedService();
    const factor = 1 - discount();
    return {
        setup: selected.unitSetup * units * factor + selected.locationSetup * locations,
        monthly: selected.unitMonthly * units * factor + selected.locationMonthly * locations
    };
}

function renderServices() {
    const container = document.getElementById('service-options');
    if (!PRODUCTS[product].services.includes(service)) service = PRODUCTS[product].services.at(-1);
    container.textContent = '';
    PRODUCTS[product].services.forEach((key) => {
        const selected = SERVICES[product][key];
        const label = document.createElement('label');
        label.className = 'service-option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'service';
        input.value = key;
        input.checked = key === service;
        input.addEventListener('change', () => {
            service = key;
            update();
        });

        const body = document.createElement('span');
        const name = document.createElement('strong');
        name.textContent = t(selected.label);
        const price = document.createElement('em');
        const exampleSetup = selected.unitSetup + selected.locationSetup;
        const exampleMonthly = selected.unitMonthly + selected.locationMonthly;
        price.textContent = `${formatMoney(exampleSetup)} + ${formatMoney(exampleMonthly)} ${t('perMonth')}`;
        body.append(name, price);
        label.append(input, body);
        container.append(label);
    });
}

function renderPerks() {
    const list = document.getElementById('included-list');
    list.textContent = '';
    selectedService().perks.forEach((key) => {
        const item = document.createElement('li');
        item.textContent = t(key);
        list.append(item);
    });
}

function renderProduct() {
    const selected = PRODUCTS[product];
    document.getElementById('product-image').src = selected.image;
    document.getElementById('product-title').textContent = t(selected.titleKey);
    document.getElementById('product-description').textContent = t(selected.descriptionKey);
    const features = document.getElementById('product-features');
    features.textContent = '';
    selected.featureKeys.forEach((key) => {
        const item = document.createElement('li');
        item.textContent = t(key);
        features.append(item);
    });
    document.querySelectorAll('input[name="product"]').forEach((input) => {
        input.checked = input.value === product;
    });
}

function update() {
    renderProduct();
    renderServices();
    renderPerks();
    const price = totals();
    document.getElementById('unit-output').textContent = String(units);
    document.getElementById('location-output').textContent = String(locations);
    document.getElementById('setup-price').textContent = formatMoney(price.setup);
    document.getElementById('monthly-price').textContent = `${formatMoney(price.monthly)} ${t('perMonth')}`;
    document.getElementById('saving-note').textContent = discount()
        ? t('saving', { percent: Math.round(discount() * 100), units, locations })
        : t('saveMore');
    document.getElementById('unit-decrease').disabled = units <= locations;
    document.getElementById('unit-increase').disabled = units === 50;
    document.getElementById('location-decrease').disabled = locations === 1;
    document.getElementById('location-increase').disabled = locations === 20;
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
    update();
}

function prepareMail(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    const price = totals();
    const lines = [
        `${t('mailProduct')}: ${t(PRODUCTS[product].titleKey)}`,
        `${t('mailService')}: ${t(selectedService().label)}`,
        `${t('mailUnits')}: ${units}`,
        `${t('mailLocations')}: ${locations}`,
        `${t('mailSetup')}: ${formatMoney(price.setup)}`,
        `${t('mailMonthly')}: ${formatMoney(price.monthly)}`,
        '',
        `${t('name')}: ${data.get('name')}`,
        `${t('company')}: ${data.get('company')}`,
        `${t('email')}: ${data.get('email')}`,
        `${t('locationsField')}: ${data.get('locations')}`,
        `${t('note')}: ${data.get('note') || '—'}`,
        '',
        t('mailDisclaimer')
    ];
    const subject = `${t('mailSubject')} — ${data.get('company')}`;
    location.href = `mailto:lucas@easysort.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
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
        service = 'managed';
        history.replaceState(null, '', `?product=${product}`);
        update();
    });
});

document.getElementById('unit-decrease').addEventListener('click', () => {
    units = Math.max(locations, units - 1);
    update();
});
document.getElementById('unit-increase').addEventListener('click', () => {
    units = Math.min(50, units + 1);
    update();
});
document.getElementById('location-decrease').addEventListener('click', () => {
    locations = Math.max(1, locations - 1);
    update();
});
document.getElementById('location-increase').addEventListener('click', () => {
    locations = Math.min(20, locations + 1);
    units = Math.max(units, locations);
    update();
});
document.getElementById('continue-button').addEventListener('click', () => {
    const panel = document.getElementById('contact-panel');
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    panel.querySelector('input').focus({ preventScroll: true });
});
document.getElementById('config-form').addEventListener('submit', prepareMail);

applyLanguage();
