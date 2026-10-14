const STORAGE_KEY = 'easysort-language';
const BASKET_KEY = 'easysort-basket';
const ORDER_URL = document.body.dataset.orderUrl;
const ORDER_TIMEOUT_MS = 15000;
const ORDER_EMAIL = 'lucas@easysort.org';
const INSTALLATION_PER_UNIT = 4500;
const MAX_UNITS = 50;
const MAX_LOCATIONS = 20;
const MAX_LINES = 20;

const PRODUCTS = {
    sorting: {
        image: 'models/sorteringsguide.png',
        defaultOption: 'managed',
        featureKeys: ['sortingFeatureOne', 'sortingFeatureTwo', 'sortingFeatureThree'],
        options: {
            app: { unitSetup: 0, unitMonthly: 0, locationSetup: 5000, locationMonthly: 750, usesUnits: false },
            hardware: { unitSetup: 28000, unitMonthly: 400, locationSetup: 2000, locationMonthly: 500, usesUnits: true, hardware: true },
            managed: { unitSetup: 28000, unitMonthly: 2200, locationSetup: 2000, locationMonthly: 500, usesUnits: true, hardware: true }
        }
    },
    monitoring: {
        image: 'models/teltovervågning.png',
        defaultOption: 'container',
        installation: true,
        featureKeys: ['monitoringFeatureOne', 'monitoringFeatureTwo', 'monitoringFeatureThree'],
        options: {
            container: { unitSetup: 18000, unitMonthly: 1400, locationSetup: 2000, locationMonthly: 500, usesUnits: true, hardware: true },
            reuse: { unitSetup: 22000, unitMonthly: 1900, locationSetup: 2000, locationMonthly: 500, usesUnits: true, hardware: true }
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
        units: 'Units',
        locations: 'Locations',
        sorting: 'Sorting Guide',
        monitoring: 'Monitoring Box',
        sortingDescription: 'Helps visitors sort correctly on their phone or at a fixed station.',
        monitoringDescription: 'A camera box you can mount anywhere on site.',
        sortingFeatureOne: 'Local sorting rules for each site',
        sortingFeatureTwo: 'On visitors’ phones or at a fixed station',
        sortingFeatureThree: 'Add more locations at any time',
        monitoringFeatureOne: 'Watches a container or the reuse area',
        monitoringFeatureTwo: 'One overview across all locations',
        monitoringFeatureThree: 'Installation by Easysort available',
        option_app: 'App',
        option_app_body: 'Visitors use the guide on their own phone.',
        option_hardware: 'Our hardware, without service',
        option_hardware_body: 'We deliver the station. You run and maintain it.',
        option_managed: 'Our hardware, with service',
        option_managed_body: 'We deliver, monitor, maintain, and replace it.',
        option_container: 'Container monitoring',
        option_container_body: 'We watch the container and flag misplaced items.',
        option_reuse: 'Reuse monitoring',
        option_reuse_body: 'Visitor counts, objects, and weight.',
        installation: 'Installation by Easysort',
        installationPrice: '{price} per unit + travel costs (Denmark)',
        installationShort: 'installation',
        travelNote: 'Installation is charged with travel costs on top. Prices shown apply in Denmark.',
        setup: 'One-time',
        monthly: 'Monthly',
        placeholder: 'Placeholder prices, excl. VAT — not an offer.',
        perMonth: '/ month',
        addToBasket: 'Add to basket',
        added: 'Added. Configure another line, or order below.',
        saveMore: 'Add more units to see volume savings.',
        saving: '{percent}% volume saving on {units} units.',
        unitCount: '{count} units',
        unitCountOne: '1 unit',
        locationCount: '{count} locations',
        locationCountOne: '1 location',
        basketTitle: 'Your basket',
        basketLead: 'Mix products, options, and locations. Add as many lines as you need.',
        remove: 'Remove',
        order: 'Order',
        lastStep: 'Last step',
        checkoutTitle: 'Confirm your order.',
        checkoutLead: 'No payment now. We contact you to confirm the final price, delivery, and payment before anything is binding.',
        email: 'Work email',
        name: 'Name (optional)',
        company: 'Organization (optional)',
        checklistTitle: 'Before you send',
        checkDecision: 'I can approve this purchase, or the person who can is part of this request.',
        checkBudget: 'We have budget for the amounts in the basket.',
        checkTimeline: 'We want to start within the next three months.',
        checkInfrastructure: 'We have power and internet where the hardware will go.',
        note: 'Note (optional)',
        send: 'Send order request',
        sending: 'Sending…',
        errorEmail: 'Enter a valid email address.',
        errorChecklist: 'Confirm every point in the checklist.',
        errorSend: 'We could not send your request. ',
        errorSendLink: 'Email it to us instead',
        confirmedEyebrow: 'Request received',
        confirmedTitle: 'Thank you. We have your order.',
        confirmedBody: 'We will contact you at {email} to confirm the final price, delivery, and payment.',
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
        units: 'Enheder',
        locations: 'Lokationer',
        sorting: 'Sorteringsguide',
        monitoring: 'Overvågningsboks',
        sortingDescription: 'Hjælper besøgende med at sortere rigtigt på telefonen eller ved en fast station.',
        monitoringDescription: 'En kameraboks, der kan sættes op overalt på pladsen.',
        sortingFeatureOne: 'Lokale sorteringsregler for hver plads',
        sortingFeatureTwo: 'På de besøgendes telefoner eller ved en fast station',
        sortingFeatureThree: 'Tilføj flere lokationer når som helst',
        monitoringFeatureOne: 'Overvåger en container eller genbrugsområdet',
        monitoringFeatureTwo: 'Ét overblik på tværs af alle lokationer',
        monitoringFeatureThree: 'Opsætning fra Easysort kan tilkøbes',
        option_app: 'App',
        option_app_body: 'Besøgende bruger guiden på deres egen telefon.',
        option_hardware: 'Vores hardware uden service',
        option_hardware_body: 'Vi leverer stationen. I driver og vedligeholder den.',
        option_managed: 'Vores hardware med service',
        option_managed_body: 'Vi leverer, overvåger, vedligeholder og udskifter.',
        option_container: 'Containerovervågning',
        option_container_body: 'Vi overvåger containeren og markerer fejlsorteringer.',
        option_reuse: 'Genbrugsovervågning',
        option_reuse_body: 'Besøgstal, genstande og vægt.',
        installation: 'Opsætning fra Easysort',
        installationPrice: '{price} pr. enhed + transportomkostninger (Danmark)',
        installationShort: 'opsætning',
        travelNote: 'Opsætning faktureres med transportomkostninger oveni. Priserne gælder i Danmark.',
        setup: 'Engangsbeløb',
        monthly: 'Pr. måned',
        placeholder: 'Midlertidige priser ekskl. moms — ikke et tilbud.',
        perMonth: '/ md.',
        addToBasket: 'Læg i kurv',
        added: 'Tilføjet. Sammensæt en linje mere, eller bestil nedenfor.',
        saveMore: 'Tilføj flere enheder for at se mængderabat.',
        saving: '{percent}% mængderabat på {units} enheder.',
        unitCount: '{count} enheder',
        unitCountOne: '1 enhed',
        locationCount: '{count} lokationer',
        locationCountOne: '1 lokation',
        basketTitle: 'Jeres kurv',
        basketLead: 'Kombinér produkter, løsninger og lokationer. Tilføj så mange linjer, I har brug for.',
        remove: 'Fjern',
        order: 'Bestil',
        lastStep: 'Sidste trin',
        checkoutTitle: 'Bekræft jeres ordre.',
        checkoutLead: 'Ingen betaling nu. Vi kontakter jer og bekræfter endelig pris, levering og betaling, før noget er bindende.',
        email: 'Arbejdsmail',
        name: 'Navn (valgfrit)',
        company: 'Organisation (valgfrit)',
        checklistTitle: 'Før I sender',
        checkDecision: 'Jeg kan godkende købet, eller den der kan, er med på denne forespørgsel.',
        checkBudget: 'Vi har budget til beløbene i kurven.',
        checkTimeline: 'Vi vil gerne i gang inden for de næste tre måneder.',
        checkInfrastructure: 'Vi har strøm og internet, hvor hardwaren skal stå.',
        note: 'Note (valgfri)',
        send: 'Send ordreforespørgsel',
        sending: 'Sender…',
        errorEmail: 'Skriv en gyldig e-mailadresse.',
        errorChecklist: 'Bekræft alle punkter på tjeklisten.',
        errorSend: 'Vi kunne ikke sende forespørgslen. ',
        errorSendLink: 'Send den til os på mail i stedet',
        confirmedEyebrow: 'Forespørgsel modtaget',
        confirmedTitle: 'Tak. Vi har modtaget jeres ordre.',
        confirmedBody: 'Vi kontakter jer på {email} og bekræfter endelig pris, levering og betaling.',
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
        units: 'Einheiten',
        locations: 'Standorte',
        sorting: 'Sortierhilfe',
        monitoring: 'Monitoring Box',
        sortingDescription: 'Hilft Besuchern, am Smartphone oder an einer festen Station richtig zu sortieren.',
        monitoringDescription: 'Eine Kamerabox, die überall auf dem Gelände montiert werden kann.',
        sortingFeatureOne: 'Lokale Sortierregeln je Standort',
        sortingFeatureTwo: 'Auf den Smartphones der Besucher oder an einer festen Station',
        sortingFeatureThree: 'Jederzeit weitere Standorte hinzufügen',
        monitoringFeatureOne: 'Überwacht einen Container oder den Wiederverwendungsbereich',
        monitoringFeatureTwo: 'Eine Übersicht über alle Standorte',
        monitoringFeatureThree: 'Installation durch Easysort zubuchbar',
        option_app: 'App',
        option_app_body: 'Besucher nutzen die Sortierhilfe auf dem eigenen Smartphone.',
        option_hardware: 'Unsere Hardware ohne Service',
        option_hardware_body: 'Wir liefern die Station. Sie betreiben und warten sie.',
        option_managed: 'Unsere Hardware mit Service',
        option_managed_body: 'Wir liefern, überwachen, warten und tauschen aus.',
        option_container: 'Containerüberwachung',
        option_container_body: 'Wir überwachen den Container und melden Fehlwürfe.',
        option_reuse: 'Wiederverwendungsüberwachung',
        option_reuse_body: 'Besucherzahlen, Gegenstände und Gewicht.',
        installation: 'Installation durch Easysort',
        installationPrice: '{price} pro Einheit + Reisekosten (Dänemark)',
        installationShort: 'Installation',
        travelNote: 'Die Installation wird zuzüglich Reisekosten berechnet. Die Preise gelten für Dänemark.',
        setup: 'Einmalig',
        monthly: 'Monatlich',
        placeholder: 'Platzhalterpreise zzgl. MwSt. — kein Angebot.',
        perMonth: '/ Monat',
        addToBasket: 'In den Warenkorb',
        added: 'Hinzugefügt. Weitere Position konfigurieren oder unten bestellen.',
        saveMore: 'Mehr Einheiten hinzufügen, um Mengenrabatt zu sehen.',
        saving: '{percent}% Mengenrabatt auf {units} Einheiten.',
        unitCount: '{count} Einheiten',
        unitCountOne: '1 Einheit',
        locationCount: '{count} Standorte',
        locationCountOne: '1 Standort',
        basketTitle: 'Ihr Warenkorb',
        basketLead: 'Produkte, Lösungen und Standorte kombinieren. Beliebig viele Positionen hinzufügen.',
        remove: 'Entfernen',
        order: 'Bestellen',
        lastStep: 'Letzter Schritt',
        checkoutTitle: 'Bestellung bestätigen.',
        checkoutLead: 'Jetzt keine Zahlung. Wir kontaktieren Sie und bestätigen Endpreis, Lieferung und Zahlung, bevor etwas verbindlich ist.',
        email: 'Geschäftliche E-Mail',
        name: 'Name (optional)',
        company: 'Organisation (optional)',
        checklistTitle: 'Vor dem Absenden',
        checkDecision: 'Ich kann diesen Kauf freigeben, oder die Person, die es kann, ist an dieser Anfrage beteiligt.',
        checkBudget: 'Wir haben Budget für die Beträge im Warenkorb.',
        checkTimeline: 'Wir möchten innerhalb der nächsten drei Monate starten.',
        checkInfrastructure: 'Am Standort der Hardware gibt es Strom und Internet.',
        note: 'Notiz (optional)',
        send: 'Bestellanfrage senden',
        sending: 'Wird gesendet…',
        errorEmail: 'Bitte eine gültige E-Mail-Adresse eingeben.',
        errorChecklist: 'Bitte alle Punkte der Checkliste bestätigen.',
        errorSend: 'Die Anfrage konnte nicht gesendet werden. ',
        errorSendLink: 'Stattdessen per E-Mail senden',
        confirmedEyebrow: 'Anfrage erhalten',
        confirmedTitle: 'Vielen Dank. Ihre Bestellung ist eingegangen.',
        confirmedBody: 'Wir kontaktieren Sie unter {email}, um Endpreis, Lieferung und Zahlung zu bestätigen.',
        backHome: 'Zurück zu Easysort',
        privacy: 'Datenschutz',
        mailSubject: 'Easysort Bestellanfrage'
    }
};

let language = preferredLanguage();
let product = requestedProduct();
let option = PRODUCTS[product].defaultOption;
let installation = false;
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

function discountFor(count) {
    if (count >= 10) return 0.20;
    if (count >= 5) return 0.15;
    if (count >= 2) return 0.08;
    return 0;
}

function isValidLine(line) {
    const config = PRODUCTS[line?.product]?.options[line.option];
    return Boolean(config)
        && Number.isInteger(line.units) && line.units >= 0 && line.units <= MAX_UNITS
        && Number.isInteger(line.locations) && line.locations >= 1 && line.locations <= MAX_LOCATIONS;
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

function priceFor(line) {
    const config = PRODUCTS[line.product].options[line.option];
    const lineUnits = config.usesUnits ? line.units : 0;
    const factor = 1 - discountFor(lineUnits);
    const installationCost = line.installation ? INSTALLATION_PER_UNIT * lineUnits : 0;
    return {
        setup: config.unitSetup * lineUnits * factor + config.locationSetup * line.locations + installationCost,
        monthly: config.unitMonthly * lineUnits * factor + config.locationMonthly * line.locations
    };
}

function currentLine() {
    const config = PRODUCTS[product].options[option];
    return {
        product,
        option,
        units: config.usesUnits ? units : 0,
        locations,
        installation: Boolean(PRODUCTS[product].installation && installation)
    };
}

function countLabel(count, one, many) {
    return count === 1 ? t(one) : t(many, { count });
}

function lineSummary(line) {
    const parts = [];
    if (line.units) parts.push(countLabel(line.units, 'unitCountOne', 'unitCount'));
    parts.push(countLabel(line.locations, 'locationCountOne', 'locationCount'));
    if (line.installation) parts.push(t('installationShort'));
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
    return basket.some((line) => PRODUCTS[line.product].options[line.option].hardware);
}

function renderProduct() {
    const selected = PRODUCTS[product];
    document.getElementById('product-image').src = selected.image;
    document.getElementById('product-title').textContent = t(product);
    document.getElementById('product-description').textContent = t(`${product}Description`);
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
        const text = document.createElement('span');
        const name = document.createElement('strong');
        name.textContent = t(`option_${key}`);
        const detail = document.createElement('small');
        detail.textContent = t(`option_${key}_body`);
        text.append(name, detail);

        const price = document.createElement('em');
        const example = priceFor({ product, option: key, units: config.usesUnits ? 1 : 0, locations: 1, installation: false });
        price.textContent = `${formatMoney(example.setup)} + ${formatMoney(example.monthly)} ${t('perMonth')}`;
        body.append(text, price);
        label.append(input, body);
        container.append(label);
    });

    const addon = document.getElementById('installation-addon');
    addon.hidden = !PRODUCTS[product].installation;
    document.getElementById('installation-input').checked = installation;
    document.getElementById('installation-price').textContent = t('installationPrice', { price: formatMoney(INSTALLATION_PER_UNIT) });
}

function renderQuantity() {
    const usesUnits = PRODUCTS[product].options[option].usesUnits;
    document.getElementById('unit-group').hidden = !usesUnits;
    document.getElementById('unit-output').textContent = String(units);
    document.getElementById('location-output').textContent = String(locations);
    document.getElementById('unit-decrease').disabled = units <= locations;
    document.getElementById('unit-increase').disabled = units >= MAX_UNITS;
    document.getElementById('location-decrease').disabled = locations <= 1;
    document.getElementById('location-increase').disabled = locations >= MAX_LOCATIONS;
    const discount = usesUnits ? discountFor(units) : 0;
    const note = document.getElementById('saving-note');
    note.hidden = !usesUnits;
    note.textContent = discount ? t('saving', { percent: Math.round(discount * 100), units }) : t('saveMore');

    const price = priceFor(currentLine());
    document.getElementById('setup-price').textContent = formatMoney(price.setup);
    document.getElementById('monthly-price').textContent = `${formatMoney(price.monthly)} ${t('perMonth')}`;
}

function renderBasket() {
    const section = document.getElementById('basket');
    const link = document.getElementById('basket-link');
    section.hidden = basket.length === 0;
    link.hidden = basket.length === 0;
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
    const notes = [t('placeholder')];
    if (basket.some((line) => line.installation)) notes.push(t('travelNote'));
    document.getElementById('basket-note').textContent = notes.join(' ');

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
    return [
        ...lines,
        '',
        `${t('setup')}: ${formatMoney(totals.setup)}`,
        `${t('monthly')}: ${formatMoney(totals.monthly)} ${t('perMonth')}`,
        '',
        `${t('email')}: ${data.email}`,
        data.name ? `${t('name')}: ${data.name}` : '',
        data.organization ? `${t('company')}: ${data.organization}` : '',
        data.note ? `${t('note')}: ${data.note}` : ''
    ].filter((line, index, all) => line || all[index - 1]).join('\n');
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
    const checks = Array.from(form.querySelectorAll('.checklist input[required]'));
    const missing = checks.find((input) => !input.checked);
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
    const totals = basketTotals();
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
        items: basket.map((line) => ({
            ...line,
            title: lineTitle(line),
            summary: lineSummary(line),
            ...priceFor(line)
        })),
        totals,
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
    const confirmation = document.getElementById('confirmation');
    confirmation.hidden = false;
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

document.getElementById('installation-input').addEventListener('change', (event) => {
    installation = event.target.checked;
    update();
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
