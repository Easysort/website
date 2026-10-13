const STORAGE_KEY = 'easysort-language';
const PRICES = {
    app: { setup: 15000, monthly: 1500 },
    software: { setup: 20000, monthly: 2500 },
    hardware: { setup: 35000, monthly: 2000 },
    managed: { setup: 45000, monthly: 5500 }
};

const copy = {
    en: {
        pageTitle: 'Configure Sorting Guide — Easysort',
        back: 'Back to demo',
        eyebrow: 'Sorting Guide',
        title: 'Configure your guide.',
        lead: 'Choose the software, hardware, and service level that fits your recycling centers.',
        factAnswer: 'Answer', factAnswerValue: 'about 8 seconds',
        factUse: 'Use', factUseValue: 'phone or fixed station',
        factCatalog: 'Catalog', factCatalogValue: 'adapted to each center',
        factIncluded: 'Included', factIncludedValue: 'setup and launch',
        productNote: 'The same Sorting Guide can start as a web app and later be extended with one or more physical stations.',
        configuration: 'Choose configuration',
        planApp: 'App',
        planAppBody: 'A branded sorting guide for visitors on their own phones. No on-site hardware.',
        planAppIncludes: 'Includes local fraction catalog, updates, and web hosting.',
        planSoftware: 'Web app for your hardware',
        planSoftwareBody: 'Run the guide in a browser on screens, cameras, and computers you install and maintain.',
        planSoftwareIncludes: 'Includes setup assistance, center catalog, software updates, and remote launch support.',
        planHardware: 'Hardware, operated by you',
        planHardwareBody: 'We deliver the complete station. After handover, you control access, maintenance, monitoring, and repairs.',
        planHardwareIncludes: 'Includes screen, camera, lighting, computer, enclosure, installation, and handover.',
        planManaged: 'Fully managed',
        planManagedBody: 'We deliver and operate the station, watch its health, maintain it, investigate issues, and replace failed equipment.',
        planManagedIncludes: 'Includes hardware, installation, monitoring, maintenance, support, and replacement coverage.',
        recommended: 'Recommended',
        quantity: 'Number of recycling centers',
        savingOne: 'Add more centers to see the example volume saving.',
        savingMany: '{percent}% example volume saving applied to {quantity} centers.',
        summary: 'Configuration summary',
        indicative: 'Indicative preview price',
        selected: 'Selected',
        centers: 'Centers',
        setup: 'Example setup',
        monthly: 'Example monthly',
        volumeSaving: 'Example volume saving',
        priceWarning: 'These prices are placeholders for testing the configurator. They are not an offer or quote.',
        contact: 'Your contact details',
        name: 'Name',
        company: 'Organization',
        email: 'Email',
        phone: 'Phone (optional)',
        locations: 'Recycling center name(s)',
        notes: 'Anything we should know? (optional)',
        submit: 'Prepare request',
        submitNote: 'No payment now. This opens a prepared email; after you send it, we contact you about the final configuration, delivery, and payment.',
        privacy: 'Privacy',
        priceLine: 'from {setup} setup · {monthly}/month',
        mailSubject: 'Sorting Guide configuration',
        mailHeading: 'Sorting Guide request',
        mailPlan: 'Configuration',
        mailQuantity: 'Recycling centers',
        mailSetup: 'Indicative setup',
        mailMonthly: 'Indicative monthly',
        mailName: 'Name',
        mailCompany: 'Organization',
        mailEmail: 'Email',
        mailPhone: 'Phone',
        mailLocations: 'Locations',
        mailNotes: 'Notes',
        mailDisclaimer: 'Preview prices only — please confirm final configuration, delivery, and payment.'
    },
    da: {
        pageTitle: 'Konfigurér Sorteringsguide — Easysort',
        back: 'Tilbage til demo',
        eyebrow: 'Sorteringsguide',
        title: 'Konfigurér jeres guide.',
        lead: 'Vælg software, hardware og serviceniveau til jeres genbrugspladser.',
        factAnswer: 'Svar', factAnswerValue: 'cirka 8 sekunder',
        factUse: 'Brug', factUseValue: 'telefon eller fast station',
        factCatalog: 'Katalog', factCatalogValue: 'tilpasset hver plads',
        factIncluded: 'Inkluderet', factIncludedValue: 'opsætning og lancering',
        productNote: 'Den samme Sorteringsguide kan starte som webapp og senere udvides med en eller flere fysiske stationer.',
        configuration: 'Vælg konfiguration',
        planApp: 'App',
        planAppBody: 'En sorteringsguide med jeres udtryk til besøgendes egne telefoner. Ingen hardware på pladsen.',
        planAppIncludes: 'Inkluderer lokalt fraktionskatalog, opdateringer og webhosting.',
        planSoftware: 'Webapp til jeres hardware',
        planSoftwareBody: 'Kør guiden i en browser på skærm, kamera og computer, som I installerer og vedligeholder.',
        planSoftwareIncludes: 'Inkluderer hjælp til opsætning, pladskatalog, softwareopdateringer og fjernsupport ved lancering.',
        planHardware: 'Hardware, drevet af jer',
        planHardwareBody: 'Vi leverer den komplette station. Efter overdragelse styrer I adgang, vedligehold, overblik og reparationer.',
        planHardwareIncludes: 'Inkluderer skærm, kamera, lys, computer, kabinet, installation og overdragelse.',
        planManaged: 'Fuldt serviceret',
        planManagedBody: 'Vi leverer og driver stationen, holder øje med dens tilstand, vedligeholder, undersøger fejl og udskifter defekt udstyr.',
        planManagedIncludes: 'Inkluderer hardware, installation, overvågning, vedligehold, support og udskiftningsdækning.',
        recommended: 'Anbefalet',
        quantity: 'Antal genbrugspladser',
        savingOne: 'Tilføj flere pladser for at se den foreløbige mængderabat.',
        savingMany: '{percent}% foreløbig mængderabat på {quantity} pladser.',
        summary: 'Konfiguration',
        indicative: 'Foreløbig eksempelpris',
        selected: 'Valgt',
        centers: 'Pladser',
        setup: 'Eksempel på opstart',
        monthly: 'Eksempel pr. måned',
        volumeSaving: 'Eksempel på mængderabat',
        priceWarning: 'Priserne er midlertidige pladsholdere til test af konfiguratoren. De er ikke et tilbud.',
        contact: 'Jeres kontaktoplysninger',
        name: 'Navn',
        company: 'Organisation',
        email: 'E-mail',
        phone: 'Telefon (valgfri)',
        locations: 'Navn på genbrugsplads(er)',
        notes: 'Er der andet, vi skal vide? (valgfri)',
        submit: 'Forbered forespørgsel',
        submitNote: 'Ingen betaling nu. Knappen åbner en forberedt mail. Når I sender den, kontakter vi jer om endelig konfiguration, levering og betaling.',
        privacy: 'Privatliv',
        priceLine: 'fra {setup} opstart · {monthly}/md.',
        mailSubject: 'Konfiguration af Sorteringsguide',
        mailHeading: 'Forespørgsel på Sorteringsguide',
        mailPlan: 'Konfiguration',
        mailQuantity: 'Genbrugspladser',
        mailSetup: 'Foreløbig opstart',
        mailMonthly: 'Foreløbig månedlig',
        mailName: 'Navn',
        mailCompany: 'Organisation',
        mailEmail: 'E-mail',
        mailPhone: 'Telefon',
        mailLocations: 'Pladser',
        mailNotes: 'Noter',
        mailDisclaimer: 'Kun eksempelpriser — bekræft venligst endelig konfiguration, levering og betaling.'
    }
};

let language = preferredLanguage();
let quantity = 1;

function preferredLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'da' || saved === 'en') return saved;
    return navigator.language && navigator.language.toLowerCase().startsWith('da') ? 'da' : 'en';
}

function t(key, replacements = {}) {
    const value = copy[language][key] || copy.en[key] || key;
    return value.replace(/\{(\w+)\}/g, (_, name) => replacements[name] ?? `{${name}}`);
}

function formatMoney(value) {
    const locale = language === 'da' ? 'da-DK' : 'en-GB';
    return `${new Intl.NumberFormat(locale).format(Math.round(value))} kr.`;
}

function discountFor(count) {
    if (count >= 10) return 0.20;
    if (count >= 5) return 0.15;
    if (count >= 2) return 0.08;
    return 0;
}

function currentPlan() {
    return document.querySelector('input[name="plan"]:checked').value;
}

function planName(plan) {
    const key = {
        app: 'planApp',
        software: 'planSoftware',
        hardware: 'planHardware',
        managed: 'planManaged'
    }[plan];
    return t(key);
}

function totals() {
    const plan = currentPlan();
    const price = PRICES[plan];
    const discount = discountFor(quantity);
    const listSetup = price.setup * quantity;
    const listMonthly = price.monthly * quantity;
    return {
        plan,
        discount,
        saving: (listSetup + listMonthly) * discount,
        setup: listSetup * (1 - discount),
        monthly: listMonthly * (1 - discount)
    };
}

function updatePrices() {
    Object.entries(PRICES).forEach(([plan, price]) => {
        const node = document.querySelector(`[data-price="${plan}"]`);
        node.textContent = t('priceLine', {
            setup: formatMoney(price.setup),
            monthly: formatMoney(price.monthly)
        });
    });

    const result = totals();
    document.getElementById('quantity-output').textContent = String(quantity);
    document.getElementById('summary-plan').textContent = planName(result.plan);
    document.getElementById('summary-quantity').textContent = String(quantity);
    document.getElementById('summary-setup').textContent = formatMoney(result.setup);
    document.getElementById('summary-monthly').textContent = `${formatMoney(result.monthly)} / ${language === 'da' ? 'md.' : 'month'}`;

    const row = document.querySelector('.discount-row');
    row.hidden = result.discount === 0;
    document.getElementById('summary-discount').textContent = `− ${formatMoney(result.saving)}`;
    document.getElementById('saving-note').textContent = result.discount
        ? t('savingMany', { percent: Math.round(result.discount * 100), quantity })
        : t('savingOne');

    document.getElementById('decrease').disabled = quantity <= 1;
    document.getElementById('increase').disabled = quantity >= 20;
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
    updatePrices();
}

function prepareRequest(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const data = new FormData(event.currentTarget);
    const result = totals();
    const lines = [
        t('mailHeading'),
        '',
        `${t('mailPlan')}: ${planName(result.plan)}`,
        `${t('mailQuantity')}: ${quantity}`,
        `${t('mailSetup')}: ${formatMoney(result.setup)}`,
        `${t('mailMonthly')}: ${formatMoney(result.monthly)}`,
        '',
        `${t('mailName')}: ${data.get('name')}`,
        `${t('mailCompany')}: ${data.get('company')}`,
        `${t('mailEmail')}: ${data.get('email')}`,
        `${t('mailPhone')}: ${data.get('phone') || '—'}`,
        `${t('mailLocations')}: ${data.get('locations')}`,
        `${t('mailNotes')}: ${data.get('notes') || '—'}`,
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

document.querySelectorAll('input[name="plan"]').forEach((input) => {
    input.addEventListener('change', updatePrices);
});
document.getElementById('decrease').addEventListener('click', () => {
    quantity = Math.max(1, quantity - 1);
    updatePrices();
});
document.getElementById('increase').addEventListener('click', () => {
    quantity = Math.min(20, quantity + 1);
    updatePrices();
});
document.getElementById('config-form').addEventListener('submit', prepareRequest);

applyLanguage();
