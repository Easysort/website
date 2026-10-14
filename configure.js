const STORAGE_KEY = 'easysort-language';
const BASKET_KEY = 'easysort-basket-v2';
const ORDER_URL = document.body.dataset.orderUrl;
const ORDER_TIMEOUT_MS = 15000;
const ORDER_EMAIL = 'lucas@easysort.org';
const MAX_UNITS = 50;
const MAX_LOCATIONS = 20;
const MAX_LINES = 20;

/* Prices from the Easysort offer of 29 September 2026 (DKK, excl. VAT).
 * Location prices: the first location costs `first`, each further one `extra`.
 * The offer prices include signs, banners, and QR labels. They are split out as
 * the "complete" add-on: for the app at the offer's own value (6,500 kr. per
 * location), for the boxes at a placeholder of the same amount, so base plus
 * add-on equals the offer price. The box without support follows the
 * "Sorteringsguide på jeres hardware" offer of 5 October 2026: we host the page
 * and classify the images, but have no access to the device, so fault-finding
 * after setup is billed by the hour. Its setup matches the box with support,
 * which is a placeholder. */
const HOURLY_RATE = 950;
const PRODUCTS = {
    sorting: {
        image: 'models/sorteringsguide.png',
        defaultOption: 'app',
        options: {
            app: {
                unit: null,
                unitSetup: 0,
                unitMonthly: 0,
                locationSetup: { first: 8500, extra: 2500 },
                locationMonthly: { first: 4000, extra: 1800 },
                complete: { perUnit: 0, perLocation: 6500 },
                setupItems: ['signsA1', 'qrLabels', 'signDesign', 'qrFile', 'siteMap', 'easytrack', 'training', 'precision'],
                completeItems: ['signsA1', 'qrLabels', 'signDesign'],
                basicItems: ['qrFile'],
                operationItems: ['hostingRequests', 'uptimeAlerts', 'reviewGuidance', 'apiDevelopment', 'retraining', 'guideChanges', 'freeImprovements']
            },
            box: {
                unit: 'box',
                family: 'box',
                hardware: true,
                unitSetup: 23500,
                unitMonthly: 6000,
                locationSetup: { first: 0, extra: 0 },
                locationMonthly: { first: 0, extra: 0 },
                complete: { perUnit: 6500, perLocation: 0 },
                setupItems: ['boxHardware', 'outdoorScreen', 'banners', 'bannerDesign', 'mountingBox', 'mountingSigns', 'siteMap', 'easytrack', 'training', 'precision'],
                completeItems: ['banners', 'bannerDesign', 'mountingSigns'],
                operationItems: ['hostingRequests', 'dataConnection', 'serverModel', 'uptimeReplace', 'reviewGuidance', 'recognitionUpdates', 'retraining', 'freeModels']
            },
            boxSelf: {
                unit: 'box',
                family: 'box',
                hardware: true,
                unitSetup: 23500,
                unitMonthly: 4000,
                locationSetup: { first: 0, extra: 0 },
                locationMonthly: { first: 0, extra: 0 },
                complete: { perUnit: 6500, perLocation: 0 },
                setupItems: ['boxHardware', 'outdoorScreen', 'banners', 'bannerDesign', 'mountingBox', 'mountingSigns', 'locationConfig', 'siteMap', 'easytrack', 'trainingTested', 'precision'],
                completeItems: ['banners', 'bannerDesign', 'mountingSigns'],
                operationItems: ['hostingClassifications', 'siteMonitoring', 'reviewGuidance', 'siteChanges', 'retraining'],
                excludedItems: ['noAccess', 'selfReplacement', 'selfConnection', 'hourlyDebug']
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

/* Four headline benefits per option: [title, one line]. `<option>_basic`
 * replaces them when the complete add-on is not chosen. */
const BENEFITS = {
    en: {
        app: [
            ['Signs and QR labels', '2 A1 signs and 80 QR labels, designed and printed. Worth 6,500 kr.'],
            ['Made for your site', 'Site map, fraction split, and your special rules.'],
            ['We keep it running', 'Monitoring, weekly review, and retraining every month.'],
            ['Unlimited use', 'Unlimited requests and unlimited changes to the guide.']
        ],
        box: [
            ['A complete box', 'Computer, camera, internet, and an outdoor screen.'],
            ['Set up by us', 'We mount the box, 2 banners, and an A1 sign on site.'],
            ['Made for your site', 'Site map, fraction split, and a model trained for you.'],
            ['Full service', 'We monitor the box, and replace it if it fails. New models are free.']
        ],
        boxSelf: [
            ['A complete box', 'Computer, camera, and an outdoor screen.'],
            ['Set up by us', 'We mount the box, 2 banners, and an A1 sign on site.'],
            ['We analyze the images', 'Hosting, unlimited classifications, and retraining every month.'],
            ['You have the access', 'We cannot reach the box. You handle monitoring, replacement, and service.']
        ],
        app_basic: [
            ['Your own QR code', 'We send the QR code as a file, so you can print and put it up yourselves.'],
            ['Made for your site', 'Site map, fraction split, and your special rules.'],
            ['We keep it running', 'Monitoring, weekly review, and retraining every month.'],
            ['Unlimited use', 'Unlimited requests and unlimited changes to the guide.']
        ],
        box_basic: [
            ['A complete box', 'Computer, camera, internet, and an outdoor screen.'],
            ['Set up by us', 'We mount the box on site.'],
            ['Made for your site', 'Site map, fraction split, and a model trained for you.'],
            ['Full service', 'We monitor the box, and replace it if it fails. New models are free.']
        ],
        boxSelf_basic: [
            ['A complete box', 'Computer, camera, and an outdoor screen.'],
            ['Set up by us', 'We mount the box on site.'],
            ['We analyze the images', 'Hosting, unlimited classifications, and retraining every month.'],
            ['You have the access', 'We cannot reach the box. You handle monitoring, replacement, and service.']
        ],
        reuse: [
            ['Camera box on site', 'Mounted by us and tuned for movement and items.'],
            ['Over 100,000 images a day', 'Movement and items, around the clock.'],
            ['We keep it running', 'Hosting, uptime monitoring, and replacement if it fails.'],
            ['Better every month', 'Retraining every month, and new models for free.']
        ],
        container: [
            ['Camera box at the container', 'Mounted by us and tuned for complex items.'],
            ['In-depth analysis', 'Complex items in the container, analyzed in detail.'],
            ['We keep it running', 'Hosting, uptime monitoring, and replacement if it fails.'],
            ['Better every month', 'Retraining every month, and new models for free.']
        ]
    },
    da: {
        app: [
            ['Skilte og QR-mærker', '2 A1-skilte og 80 QR-mærker med design og print. Værdi 6.500 kr.'],
            ['Tilpasset jeres plads', 'Pladskort, fraktionsdeling og jeres særskilte regler.'],
            ['Vi holder den kørende', 'Overvågning, ugentlig gennemgang og gentræning hver måned.'],
            ['Ubegrænset brug', 'Ubegrænsede forespørgsler og ubegrænsede ændringer til guiden.']
        ],
        box: [
            ['Komplet boks', 'Computer, kamera, internet og udendørs skærm.'],
            ['Sat op af os', 'Vi sætter boks, 2 bannere og et A1-skilt op på pladsen.'],
            ['Tilpasset jeres plads', 'Pladskort, fraktionsdeling og en model trænet til jer.'],
            ['Fuld service', 'Vi overvåger boksen og skifter den ud, hvis den fejler. Nye modeller er gratis.']
        ],
        boxSelf: [
            ['Komplet boks', 'Computer, kamera og udendørs skærm.'],
            ['Sat op af os', 'Vi sætter boks, 2 bannere og et A1-skilt op på pladsen.'],
            ['Vi analyserer billederne', 'Hosting, ubegrænsede klassificeringer og gentræning hver måned.'],
            ['I har adgangen', 'Vi har ikke adgang til boksen. I står for overvågning, udskiftning og service.']
        ],
        app_basic: [
            ['Jeres egen QR-kode', 'Vi sender QR-koden som fil, så I selv kan printe og sætte den op.'],
            ['Tilpasset jeres plads', 'Pladskort, fraktionsdeling og jeres særskilte regler.'],
            ['Vi holder den kørende', 'Overvågning, ugentlig gennemgang og gentræning hver måned.'],
            ['Ubegrænset brug', 'Ubegrænsede forespørgsler og ubegrænsede ændringer til guiden.']
        ],
        box_basic: [
            ['Komplet boks', 'Computer, kamera, internet og udendørs skærm.'],
            ['Sat op af os', 'Vi sætter boksen op på pladsen.'],
            ['Tilpasset jeres plads', 'Pladskort, fraktionsdeling og en model trænet til jer.'],
            ['Fuld service', 'Vi overvåger boksen og skifter den ud, hvis den fejler. Nye modeller er gratis.']
        ],
        boxSelf_basic: [
            ['Komplet boks', 'Computer, kamera og udendørs skærm.'],
            ['Sat op af os', 'Vi sætter boksen op på pladsen.'],
            ['Vi analyserer billederne', 'Hosting, ubegrænsede klassificeringer og gentræning hver måned.'],
            ['I har adgangen', 'Vi har ikke adgang til boksen. I står for overvågning, udskiftning og service.']
        ],
        reuse: [
            ['Kameraboks på pladsen', 'Sat op af os og kørt ind på bevægelse og emner.'],
            ['Over 100.000 billeder om dagen', 'Bevægelse og emner, døgnet rundt.'],
            ['Vi holder den kørende', 'Hosting, overvågning af driftstid og udskiftning, hvis den fejler.'],
            ['Bliver bedre hver måned', 'Gentræning hver måned og gratis nye modeller.']
        ],
        container: [
            ['Kameraboks ved containeren', 'Sat op af os og kørt ind på komplekse emner.'],
            ['Dybdegående analyse', 'Komplekse emner i containeren, analyseret i detaljer.'],
            ['Vi holder den kørende', 'Hosting, overvågning af driftstid og udskiftning, hvis den fejler.'],
            ['Bliver bedre hver måned', 'Gentræning hver måned og gratis nye modeller.']
        ]
    },
    de: {
        app: [
            ['Schilder und QR-Etiketten', '2 A1-Schilder und 80 QR-Etiketten mit Design und Druck. Wert 6.500 kr.'],
            ['Für Ihren Standort gemacht', 'Lageplan, Fraktionsaufteilung und Ihre Sonderregeln.'],
            ['Wir halten es am Laufen', 'Überwachung, wöchentliche Prüfung und monatliches Nachtraining.'],
            ['Unbegrenzte Nutzung', 'Unbegrenzte Anfragen und unbegrenzte Änderungen an der Sortierhilfe.']
        ],
        box: [
            ['Komplette Box', 'Computer, Kamera, Internet und Outdoor-Bildschirm.'],
            ['Von uns montiert', 'Wir montieren Box, 2 Banner und ein A1-Schild vor Ort.'],
            ['Für Ihren Standort gemacht', 'Lageplan, Fraktionsaufteilung und ein für Sie trainiertes Modell.'],
            ['Voller Service', 'Wir überwachen die Box und tauschen sie bei Ausfall aus. Neue Modelle sind kostenlos.']
        ],
        boxSelf: [
            ['Komplette Box', 'Computer, Kamera und Outdoor-Bildschirm.'],
            ['Von uns montiert', 'Wir montieren Box, 2 Banner und ein A1-Schild vor Ort.'],
            ['Wir analysieren die Bilder', 'Hosting, unbegrenzte Klassifizierungen und monatliches Nachtraining.'],
            ['Der Zugang liegt bei Ihnen', 'Wir haben keinen Zugriff auf die Box. Überwachung, Austausch und Service übernehmen Sie.']
        ],
        app_basic: [
            ['Ihr eigener QR-Code', 'Wir senden den QR-Code als Datei, damit Sie ihn selbst drucken und aufhängen können.'],
            ['Für Ihren Standort gemacht', 'Lageplan, Fraktionsaufteilung und Ihre Sonderregeln.'],
            ['Wir halten es am Laufen', 'Überwachung, wöchentliche Prüfung und monatliches Nachtraining.'],
            ['Unbegrenzte Nutzung', 'Unbegrenzte Anfragen und unbegrenzte Änderungen an der Sortierhilfe.']
        ],
        box_basic: [
            ['Komplette Box', 'Computer, Kamera, Internet und Outdoor-Bildschirm.'],
            ['Von uns montiert', 'Wir montieren die Box vor Ort.'],
            ['Für Ihren Standort gemacht', 'Lageplan, Fraktionsaufteilung und ein für Sie trainiertes Modell.'],
            ['Voller Service', 'Wir überwachen die Box und tauschen sie bei Ausfall aus. Neue Modelle sind kostenlos.']
        ],
        boxSelf_basic: [
            ['Komplette Box', 'Computer, Kamera und Outdoor-Bildschirm.'],
            ['Von uns montiert', 'Wir montieren die Box vor Ort.'],
            ['Wir analysieren die Bilder', 'Hosting, unbegrenzte Klassifizierungen und monatliches Nachtraining.'],
            ['Der Zugang liegt bei Ihnen', 'Wir haben keinen Zugriff auf die Box. Überwachung, Austausch und Service übernehmen Sie.']
        ],
        reuse: [
            ['Kamerabox vor Ort', 'Von uns montiert und auf Bewegung und Gegenstände abgestimmt.'],
            ['Über 100.000 Bilder pro Tag', 'Bewegung und Gegenstände, rund um die Uhr.'],
            ['Wir halten es am Laufen', 'Hosting, Überwachung der Verfügbarkeit und Austausch bei Ausfall.'],
            ['Jeden Monat besser', 'Monatliches Nachtraining und kostenlose neue Modelle.']
        ],
        container: [
            ['Kamerabox am Container', 'Von uns montiert und auf komplexe Gegenstände abgestimmt.'],
            ['Detaillierte Analyse', 'Komplexe Gegenstände im Container, im Detail analysiert.'],
            ['Wir halten es am Laufen', 'Hosting, Überwachung der Verfügbarkeit und Austausch bei Ausfall.'],
            ['Jeden Monat besser', 'Monatliches Nachtraining und kostenlose neue Modelle.']
        ]
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
        option_box_price: 'From {setup} per box, with or without support',
        option_boxSelf_body: 'A screen on site shows where the waste goes. We analyze the images, you look after the box.',
        option_reuse: 'Reuse monitoring',
        option_reuse_body: 'A camera on site tracks movement and items. Over 100,000 images a day.',
        option_reuse_price: '{setup} + {monthly} / month per camera, + {location} / month per location',
        option_container: 'Container monitoring',
        option_container_body: 'A camera at the container analyzes complex items in depth.',
        option_container_price: '{setup} + {monthly} / month per camera',
        name_app: 'App',
        name_box: 'Physical box with support',
        name_boxSelf: 'Physical box without support',
        name_reuse: 'Reuse monitoring',
        name_container: 'Container monitoring',
        supportLabel: 'Support',
        withSupport: 'With support',
        withSupportBody: 'We monitor, replace, and service the box.',
        withoutSupport: 'Without support',
        withoutSupportBody: 'We analyze the images, but cannot reach the box. You run it.',
        supportWithPrice: '{setup} + {monthly} / month per box',
        supportWithoutPrice: '{setup} + {monthly} / month per box. Fault-finding {hourly} / hour.',
        benefitsTitle: 'What you get',
        allIncluded: 'See everything included ({count})',
        includedSetup: 'Included in setup',
        includedOperation: 'Included in operation',
        excludedHeading: 'Not included, because you have the access',
        unit_box: 'Boxes',
        unit_camera: 'Cameras',
        count_box_one: '1 box',
        count_box: '{count} boxes',
        count_camera_one: '1 camera',
        count_camera: '{count} cameras',
        locationCountOne: '1 location',
        locationCount: '{count} locations',
        extraLocationNote: 'Each extra location: {setup} setup and {monthly} / month.',
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
        mountingBox: 'We mount the box on site',
        mountingSigns: 'We put up the signs and banners on site',
        qrFile: 'QR code as a file, ready to print',
        addonLabel: 'Add-on',
        complete: 'Complete solution',
        completeBody: 'We make sure visitors know how to use the guide: 2 banners and an A1 sign, designed, printed, and put up.',
        completeAppBody: 'We make sure visitors know how to use the guide: 2 A1 signs and 80 QR labels, designed and printed.',
        completePriceLocation: '+ {price} per location',
        completePriceUnit: '+ {price} per box',
        completeTag: 'Complete solution',
        locationConfig: 'Location setup: where the screen sits on the map, the crop area, and when a person is close enough',
        trainingTested: 'Training for your fractions, tested by us before the guide goes live',
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
        hostingClassifications: 'Hosting and unlimited classifications',
        siteMonitoring: 'Monitoring of the page and the API',
        siteChanges: 'Changes to fractions, containers, and the map',
        noAccess: 'Access to the box. We monitor the API, not the box',
        selfReplacement: 'Replacement if the box fails',
        selfConnection: 'Power, network, and data connection',
        hourlyDebug: 'Fault-finding and development after the first setup, at {hourly} / hour',
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
        close: 'Close',
        stepOrderOne: 'Order · 1 line',
        stepOrderMany: 'Order · {count} lines',
        stepSent: 'Order sent',
        checkoutTitle: 'Confirm your order',
        summaryNote: 'Prices excl. VAT. No payment now.',
        contactHeading: 'How do we reach you?',
        email: 'Work email',
        company: 'Organization',
        phone: 'Phone',
        optionalHint: 'Organization and phone are optional, but help us reply faster.',
        checklistTitle: 'Confirm before you send',
        checkDecision: 'I can approve the purchase',
        checkDecisionHint: 'Or the person who can is part of this request.',
        checkBudget: 'The budget is in place',
        checkBudgetHint: 'For the amounts above.',
        checkTimeline: 'We want to start within 3 months',
        checkTimelineHint: 'So we can plan delivery and setup.',
        checkInfrastructure: 'There is power on site',
        checkInfrastructureHint: 'Where the box or camera will go.',
        dpaTitle: 'Data processing agreement',
        dpaBody: 'We sign it before we start. It covers every image, and faces and license plates are blurred immediately. Images are kept for at most 30 days and almost always deleted within 24 hours. Selected anonymous images are kept longer to improve accuracy.',
        send: 'Send order',
        sending: 'Sending…',
        sendNote: 'Nothing is binding until we have agreed on delivery and payment with you.',
        errorEmail: 'Enter a valid email address.',
        errorChecklist: 'Confirm every point in the checklist.',
        errorSend: 'We could not send your order. ',
        errorSendLink: 'Email it to us instead',
        receiptRef: 'Order {ref}',
        confirmedTitle: 'Thank you. We have your order.',
        receiptLead: 'It went straight to Easysort. There is nothing to pay now.',
        nextTitle: 'What happens now',
        nextOneTitle: 'We contact you',
        nextOneBody: 'We write to {email} to go through the order.',
        nextTwoTitle: 'We agree on the details',
        nextTwoBody: 'Delivery, start date, and payment. Nothing is binding before this.',
        nextThreeTitle: 'We sign and get started',
        nextThreeBody: 'Data processing agreement, then setup on your site.',
        questions: 'Questions?',
        backHome: 'Back to Easysort',
        privacy: 'Privacy',
        mailSubject: 'Easysort order'
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
        option_box_price: 'Fra {setup} pr. boks, med eller uden support',
        option_boxSelf_body: 'En skærm på pladsen viser, hvor affaldet skal hen. Vi analyserer billederne, I passer boksen.',
        option_reuse: 'Genbrugsovervågning',
        option_reuse_body: 'Et kamera på pladsen følger bevægelse og emner. Over 100.000 billeder om dagen.',
        option_reuse_price: '{setup} + {monthly} / md. pr. kamera, + {location} / md. pr. plads',
        option_container: 'Containerovervågning',
        option_container_body: 'Et kamera ved containeren laver en dybdegående analyse af komplekse emner.',
        option_container_price: '{setup} + {monthly} / md. pr. kamera',
        name_app: 'App',
        name_box: 'Fysisk boks med support',
        name_boxSelf: 'Fysisk boks uden support',
        name_reuse: 'Genbrugsovervågning',
        name_container: 'Containerovervågning',
        supportLabel: 'Support',
        withSupport: 'Med support',
        withSupportBody: 'Vi overvåger, udskifter og servicerer boksen.',
        withoutSupport: 'Uden support',
        withoutSupportBody: 'Vi analyserer billederne, men har ikke adgang til boksen. I driver den.',
        supportWithPrice: '{setup} + {monthly} / md. pr. boks',
        supportWithoutPrice: '{setup} + {monthly} / md. pr. boks. Fejlretning {hourly} / time.',
        benefitsTitle: 'Det får I',
        allIncluded: 'Se alt, der er med ({count})',
        includedSetup: 'Med i opsætningen',
        includedOperation: 'Med i driften',
        excludedHeading: 'Ikke med, fordi I har adgangen',
        unit_box: 'Bokse',
        unit_camera: 'Kameraer',
        count_box_one: '1 boks',
        count_box: '{count} bokse',
        count_camera_one: '1 kamera',
        count_camera: '{count} kameraer',
        locationCountOne: '1 plads',
        locationCount: '{count} pladser',
        extraLocationNote: 'Hver ekstra plads: {setup} i opsætning og {monthly} / md.',
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
        mountingBox: 'Vi sætter boksen op på pladsen',
        mountingSigns: 'Vi sætter skilte og bannere op på pladsen',
        qrFile: 'QR-kode som fil, klar til print',
        addonLabel: 'Tilvalg',
        complete: 'Komplet løsning',
        completeBody: 'Vi sikrer, at borgerne ved, hvordan de bruger guiden: 2 bannere og et A1-skilt med design, print og opsætning.',
        completeAppBody: 'Vi sikrer, at borgerne ved, hvordan de bruger guiden: 2 A1-skilte og 80 QR-mærker med design og print.',
        completePriceLocation: '+ {price} pr. plads',
        completePriceUnit: '+ {price} pr. boks',
        completeTag: 'Komplet løsning',
        locationConfig: 'Konfiguration af lokationen: hvor skærmen står på kortet, beskæringsfeltet, og hvornår en person er tæt nok på',
        trainingTested: 'Træning til jeres fraktioner, og test hos os før siden tages i brug',
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
        hostingClassifications: 'Hosting og ubegrænsede klassificeringer',
        siteMonitoring: 'Overvågning af siden og API\'et',
        siteChanges: 'Ændringer af fraktioner, containere og kort',
        noAccess: 'Adgang til boksen. Vi overvåger API\'et, ikke boksen',
        selfReplacement: 'Udskiftning, hvis boksen fejler',
        selfConnection: 'Strøm, net og dataforbindelse',
        hourlyDebug: 'Fejlretning og udvikling efter den første opsætning, {hourly} / time',
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
        close: 'Luk',
        stepOrderOne: 'Ordre · 1 linje',
        stepOrderMany: 'Ordre · {count} linjer',
        stepSent: 'Ordre sendt',
        checkoutTitle: 'Bekræft jeres ordre',
        summaryNote: 'Priser ekskl. moms. Ingen betaling nu.',
        contactHeading: 'Hvordan fanger vi jer?',
        email: 'Arbejdsmail',
        company: 'Organisation',
        phone: 'Telefon',
        optionalHint: 'Organisation og telefon er valgfrie, men hjælper os med at svare hurtigere.',
        checklistTitle: 'Bekræft, før I sender',
        checkDecision: 'Jeg kan godkende købet',
        checkDecisionHint: 'Eller den, der kan, er med på denne ordre.',
        checkBudget: 'Budgettet er på plads',
        checkBudgetHint: 'Til beløbene ovenfor.',
        checkTimeline: 'Vi vil i gang inden for 3 måneder',
        checkTimelineHint: 'Så vi kan planlægge levering og opsætning.',
        checkInfrastructure: 'Der er strøm på pladsen',
        checkInfrastructureHint: 'Der, hvor boksen eller kameraet skal sidde.',
        dpaTitle: 'Databehandleraftale',
        dpaBody: 'Vi underskriver den, før vi går i gang. Den gælder alle billeder, og ansigter og nummerplader sløres med det samme. Billeder gemmes i højst 30 dage og slettes næsten altid inden for 24 timer. Udvalgte anonyme billeder holdes længere for at øge præcisionen.',
        send: 'Send ordre',
        sending: 'Sender…',
        sendNote: 'Intet er bindende, før vi har aftalt levering og betaling med jer.',
        errorEmail: 'Skriv en gyldig e-mailadresse.',
        errorChecklist: 'Bekræft alle punkter på tjeklisten.',
        errorSend: 'Vi kunne ikke sende ordren. ',
        errorSendLink: 'Send den til os på mail i stedet',
        receiptRef: 'Ordre {ref}',
        confirmedTitle: 'Tak. Vi har modtaget jeres ordre.',
        receiptLead: 'Den er sendt direkte til Easysort. Der er intet at betale nu.',
        nextTitle: 'Det sker nu',
        nextOneTitle: 'Vi kontakter jer',
        nextOneBody: 'Vi skriver til {email} og gennemgår ordren med jer.',
        nextTwoTitle: 'Vi aftaler detaljerne',
        nextTwoBody: 'Levering, opstart og betaling. Intet er bindende før da.',
        nextThreeTitle: 'Vi underskriver og går i gang',
        nextThreeBody: 'Databehandleraftale, og derefter opsætning på pladsen.',
        questions: 'Spørgsmål?',
        backHome: 'Tilbage til Easysort',
        privacy: 'Privatliv',
        mailSubject: 'Easysort ordre'
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
        option_box_price: 'Ab {setup} pro Box, mit oder ohne Support',
        option_boxSelf_body: 'Ein Bildschirm vor Ort zeigt, wohin der Abfall gehört. Wir analysieren die Bilder, Sie betreuen die Box.',
        option_reuse: 'Wiederverwendungsüberwachung',
        option_reuse_body: 'Eine Kamera vor Ort erfasst Bewegungen und Gegenstände. Über 100.000 Bilder pro Tag.',
        option_reuse_price: '{setup} + {monthly} / Monat pro Kamera, + {location} / Monat pro Standort',
        option_container: 'Containerüberwachung',
        option_container_body: 'Eine Kamera am Container analysiert komplexe Gegenstände im Detail.',
        option_container_price: '{setup} + {monthly} / Monat pro Kamera',
        name_app: 'App',
        name_box: 'Physische Box mit Support',
        name_boxSelf: 'Physische Box ohne Support',
        name_reuse: 'Wiederverwendungsüberwachung',
        name_container: 'Containerüberwachung',
        supportLabel: 'Support',
        withSupport: 'Mit Support',
        withSupportBody: 'Wir überwachen, tauschen und warten die Box.',
        withoutSupport: 'Ohne Support',
        withoutSupportBody: 'Wir analysieren die Bilder, haben aber keinen Zugriff auf die Box. Sie betreiben sie.',
        supportWithPrice: '{setup} + {monthly} / Monat pro Box',
        supportWithoutPrice: '{setup} + {monthly} / Monat pro Box. Fehlersuche {hourly} / Stunde.',
        benefitsTitle: 'Das bekommen Sie',
        allIncluded: 'Alle Leistungen ansehen ({count})',
        includedSetup: 'In der Einrichtung enthalten',
        includedOperation: 'Im Betrieb enthalten',
        excludedHeading: 'Nicht enthalten, weil der Zugang bei Ihnen liegt',
        unit_box: 'Boxen',
        unit_camera: 'Kameras',
        count_box_one: '1 Box',
        count_box: '{count} Boxen',
        count_camera_one: '1 Kamera',
        count_camera: '{count} Kameras',
        locationCountOne: '1 Standort',
        locationCount: '{count} Standorte',
        extraLocationNote: 'Jeder weitere Standort: {setup} Einrichtung und {monthly} / Monat.',
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
        mountingBox: 'Wir montieren die Box vor Ort',
        mountingSigns: 'Wir bringen Schilder und Banner vor Ort an',
        qrFile: 'QR-Code als Datei, druckfertig',
        addonLabel: 'Zusatzoption',
        complete: 'Komplettlösung',
        completeBody: 'Wir sorgen dafür, dass Besucher wissen, wie sie die Sortierhilfe nutzen: 2 Banner und ein A1-Schild mit Design, Druck und Montage.',
        completeAppBody: 'Wir sorgen dafür, dass Besucher wissen, wie sie die Sortierhilfe nutzen: 2 A1-Schilder und 80 QR-Etiketten mit Design und Druck.',
        completePriceLocation: '+ {price} pro Standort',
        completePriceUnit: '+ {price} pro Box',
        completeTag: 'Komplettlösung',
        locationConfig: 'Konfiguration des Standorts: Position des Bildschirms auf dem Plan, Bildausschnitt und wann eine Person nah genug ist',
        trainingTested: 'Training für Ihre Fraktionen, von uns getestet vor dem Start',
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
        hostingClassifications: 'Hosting und unbegrenzte Klassifizierungen',
        siteMonitoring: 'Überwachung der Seite und der API',
        siteChanges: 'Änderungen an Fraktionen, Containern und Plan',
        noAccess: 'Zugriff auf die Box. Wir überwachen die API, nicht die Box',
        selfReplacement: 'Austausch, wenn die Box ausfällt',
        selfConnection: 'Strom, Netz und Datenverbindung',
        hourlyDebug: 'Fehlersuche und Entwicklung nach der ersten Einrichtung, {hourly} / Stunde',
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
        close: 'Schließen',
        stepOrderOne: 'Bestellung · 1 Position',
        stepOrderMany: 'Bestellung · {count} Positionen',
        stepSent: 'Bestellung gesendet',
        checkoutTitle: 'Bestellung bestätigen',
        summaryNote: 'Preise zzgl. MwSt. Jetzt keine Zahlung.',
        contactHeading: 'Wie erreichen wir Sie?',
        email: 'Geschäftliche E-Mail',
        company: 'Organisation',
        phone: 'Telefon',
        optionalHint: 'Organisation und Telefon sind optional, helfen uns aber, schneller zu antworten.',
        checklistTitle: 'Vor dem Absenden bestätigen',
        checkDecision: 'Ich kann den Kauf freigeben',
        checkDecisionHint: 'Oder die Person, die es kann, ist an dieser Bestellung beteiligt.',
        checkBudget: 'Das Budget steht',
        checkBudgetHint: 'Für die Beträge oben.',
        checkTimeline: 'Wir möchten innerhalb von 3 Monaten starten',
        checkTimelineHint: 'Damit wir Lieferung und Einrichtung planen können.',
        checkInfrastructure: 'Vor Ort gibt es Strom',
        checkInfrastructureHint: 'Dort, wo Box oder Kamera montiert wird.',
        dpaTitle: 'Auftragsverarbeitungsvertrag',
        dpaBody: 'Wir unterzeichnen ihn vor dem Start. Er gilt für alle Bilder, Gesichter und Kennzeichen werden sofort unkenntlich gemacht. Bilder werden höchstens 30 Tage gespeichert und fast immer innerhalb von 24 Stunden gelöscht. Ausgewählte anonyme Bilder werden länger aufbewahrt, um die Genauigkeit zu verbessern.',
        send: 'Bestellung senden',
        sending: 'Wird gesendet…',
        sendNote: 'Nichts ist verbindlich, bevor wir Lieferung und Zahlung mit Ihnen vereinbart haben.',
        errorEmail: 'Bitte eine gültige E-Mail-Adresse eingeben.',
        errorChecklist: 'Bitte alle Punkte der Checkliste bestätigen.',
        errorSend: 'Die Bestellung konnte nicht gesendet werden. ',
        errorSendLink: 'Stattdessen per E-Mail senden',
        receiptRef: 'Bestellung {ref}',
        confirmedTitle: 'Vielen Dank. Ihre Bestellung ist eingegangen.',
        receiptLead: 'Sie ging direkt an Easysort. Jetzt ist nichts zu bezahlen.',
        nextTitle: 'So geht es weiter',
        nextOneTitle: 'Wir melden uns',
        nextOneBody: 'Wir schreiben an {email} und gehen die Bestellung mit Ihnen durch.',
        nextTwoTitle: 'Wir klären die Details',
        nextTwoBody: 'Lieferung, Start und Zahlung. Vorher ist nichts verbindlich.',
        nextThreeTitle: 'Wir unterschreiben und legen los',
        nextThreeBody: 'Auftragsverarbeitungsvertrag, dann Einrichtung vor Ort.',
        questions: 'Fragen?',
        backHome: 'Zurück zu Easysort',
        privacy: 'Datenschutz',
        mailSubject: 'Easysort Bestellung'
    }
};

let language = preferredLanguage();
let product = requestedProduct();
let option = PRODUCTS[product].defaultOption;
let boxOption = 'box';
let complete = true;
let units = 1;
let locations = 1;
let basket = loadBasket();
let sending = false;
let receipt = null;

const dialog = document.getElementById('order-dialog');
const form = document.getElementById('checkout');

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
    const completeOk = config.complete ? typeof line.complete === 'boolean' : line.complete === undefined;
    return unitsOk && completeOk && Number.isInteger(line.locations) && line.locations >= 1 && line.locations <= MAX_LOCATIONS;
}

function loadBasket() {
    try {
        const saved = JSON.parse(localStorage.getItem(BASKET_KEY) || '[]');
        if (!Array.isArray(saved)) return [];
        return saved
            .map((line) => (optionConfig(line || {})?.complete && line.complete === undefined ? { ...line, complete: true } : line))
            .filter(isValidLine)
            .slice(0, MAX_LINES);
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

function completePrice(config, line) {
    if (!config.complete || !line.complete) return 0;
    return config.complete.perUnit * line.units + config.complete.perLocation * line.locations;
}

function priceFor(line) {
    const config = optionConfig(line);
    return {
        setup: config.unitSetup * line.units + tiered(config.locationSetup, line.locations) + completePrice(config, line),
        monthly: config.unitMonthly * line.units + tiered(config.locationMonthly, line.locations)
    };
}

function currentConfig() {
    return PRODUCTS[product].options[option];
}

function currentLine() {
    const config = currentConfig();
    const line = { product, option, units: config.unit ? units : 0, locations };
    if (config.complete) line.complete = complete;
    return line;
}

function setupItemsFor(config, withComplete) {
    return config.setupItems.filter((key) => {
        if (config.completeItems?.includes(key)) return withComplete;
        if (config.basicItems?.includes(key)) return !withComplete;
        return true;
    });
}

function countLabel(count, key) {
    return count === 1 ? t(`${key}_one`) : t(key, { count });
}

function lineSummary(line) {
    const config = optionConfig(line);
    const parts = [];
    if (config.unit) parts.push(countLabel(line.units, `count_${config.unit}`));
    parts.push(line.locations === 1 ? t('locationCountOne') : t('locationCount', { count: line.locations }));
    if (line.complete) parts.push(t('completeTag'));
    return parts.join(' · ');
}

function lineTitle(line) {
    return `${t(line.product)} · ${t(`name_${line.option}`)}`;
}

function totalsFor(lines) {
    return lines.reduce((sum, line) => {
        const price = priceFor(line);
        return { setup: sum.setup + price.setup, monthly: sum.monthly + price.monthly };
    }, { setup: 0, monthly: 0 });
}

function monthlyText(value) {
    return `${formatMoney(value)} ${t('perMonth')}`;
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
        item.textContent = t(key, { hourly: formatMoney(HOURLY_RATE) });
        list.append(item);
    });
}

function renderProduct() {
    document.getElementById('product-image').src = PRODUCTS[product].image;
    document.getElementById('product-title').textContent = `${t(product)} · ${t(`name_${option}`)}`;
    document.getElementById('product-description').textContent = t(`option_${option}_body`);
    document.querySelectorAll('input[name="product"]').forEach((input) => {
        input.checked = input.value === product;
    });
}

function renderOptions() {
    const container = document.getElementById('option-list');
    container.textContent = '';
    const selectedCard = currentConfig().family || option;
    Object.entries(PRODUCTS[product].options).forEach(([key, config]) => {
        if (config.family && config.family !== key) return;

        const label = document.createElement('label');
        label.className = 'service-option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'option';
        input.value = key;
        input.checked = key === selectedCard;
        input.addEventListener('change', () => {
            option = config.family ? boxOption : key;
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

function renderSupport() {
    const isBox = currentConfig().family === 'box';
    document.getElementById('support-choice').hidden = !isBox;
    if (!isBox) return;
    const withSupport = PRODUCTS.sorting.options.box;
    const withoutSupport = PRODUCTS.sorting.options.boxSelf;
    document.getElementById('support-with-price').textContent = t('supportWithPrice', {
        setup: formatMoney(withSupport.unitSetup),
        monthly: formatMoney(withSupport.unitMonthly)
    });
    document.getElementById('support-without-price').textContent = t('supportWithoutPrice', {
        setup: formatMoney(withoutSupport.unitSetup),
        monthly: formatMoney(withoutSupport.unitMonthly),
        hourly: formatMoney(HOURLY_RATE)
    });
    document.querySelectorAll('input[name="support"]').forEach((input) => {
        input.checked = input.value === option;
    });
}

function renderAddon() {
    const config = currentConfig();
    document.getElementById('addon').hidden = !config.complete;
    if (!config.complete) return;
    document.getElementById('complete-input').checked = complete;
    document.getElementById('complete-body').textContent = t(config.unit ? 'completeBody' : 'completeAppBody');
    document.getElementById('complete-price').textContent = config.unit
        ? t('completePriceUnit', { price: formatMoney(config.complete.perUnit) })
        : t('completePriceLocation', { price: formatMoney(config.complete.perLocation) });
}

function renderBenefits() {
    const config = currentConfig();
    const withComplete = Boolean(config.complete) && complete;
    const setupItems = setupItemsFor(config, withComplete);
    const benefitKey = config.complete && !complete ? `${option}_basic` : option;
    document.getElementById('benefits-title').textContent = t('benefitsTitle');
    const list = document.getElementById('benefit-list');
    list.textContent = '';
    (BENEFITS[language][benefitKey] || BENEFITS.en[benefitKey]).forEach(([title, body]) => {
        const item = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = title;
        const span = document.createElement('span');
        span.textContent = body;
        item.append(strong, span);
        list.append(item);
    });
    document.getElementById('all-included-summary').textContent = t('allIncluded', {
        count: setupItems.length + config.operationItems.length
    });
    document.getElementById('operation-heading').textContent = t('includedOperation');
    document.getElementById('excluded-group').hidden = !config.excludedItems;
    fillList('excluded-items', config.excludedItems || []);
    fillList('included-setup', setupItems);
    fillList('included-operation', config.operationItems);
}

function renderQuantity() {
    const config = currentConfig();
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
    const extraComplete = config.complete && complete ? config.complete.perLocation : 0;
    note.textContent = t('extraLocationNote', {
        setup: formatMoney(config.locationSetup.extra + extraComplete),
        monthly: formatMoney(config.locationMonthly.extra)
    });

    const price = priceFor(currentLine());
    document.getElementById('setup-price').textContent = formatMoney(price.setup);
    document.getElementById('monthly-price').textContent = monthlyText(price.monthly);
}

function lineItem(line, removable) {
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
    monthly.textContent = monthlyText(price.monthly);
    amount.append(setup, monthly);

    item.append(text, amount);
    if (removable) item.append(removable);
    return item;
}

function renderLines(listId, lines) {
    const list = document.getElementById(listId);
    list.textContent = '';
    lines.forEach((line) => list.append(lineItem(line)));
}

function renderBasket() {
    document.getElementById('basket').hidden = basket.length === 0;
    document.getElementById('basket-link').hidden = basket.length === 0;
    document.getElementById('basket-count').textContent = String(basket.length);
    document.getElementById('add-button').disabled = basket.length >= MAX_LINES;

    const list = document.getElementById('basket-lines');
    list.textContent = '';
    basket.forEach((line, index) => {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove-line';
        remove.setAttribute('aria-label', `${t('remove')}: ${lineTitle(line)}`);
        remove.textContent = '×';
        remove.addEventListener('click', () => {
            basket.splice(index, 1);
            saveBasket();
            update();
        });
        list.append(lineItem(line, remove));
    });

    const totals = totalsFor(basket);
    document.getElementById('basket-setup').textContent = formatMoney(totals.setup);
    document.getElementById('basket-monthly').textContent = monthlyText(totals.monthly);
}

function renderOrderStep() {
    const totals = totalsFor(basket);
    document.getElementById('dialog-step').textContent = basket.length === 1
        ? t('stepOrderOne')
        : t('stepOrderMany', { count: basket.length });
    renderLines('summary-lines', basket);
    document.getElementById('summary-setup').textContent = formatMoney(totals.setup);
    document.getElementById('summary-monthly').textContent = monthlyText(totals.monthly);
    document.getElementById('send-total').textContent = `${formatMoney(totals.setup)} + ${monthlyText(totals.monthly)}`;

    const needsHardware = basketNeedsHardware();
    const infrastructure = document.getElementById('infrastructure-check');
    infrastructure.hidden = !needsHardware;
    infrastructure.querySelector('input').required = needsHardware;
}

function renderReceipt() {
    document.getElementById('dialog-step').textContent = t('stepSent');
    const ref = document.getElementById('receipt-ref');
    ref.hidden = !receipt.ref;
    ref.textContent = receipt.ref ? t('receiptRef', { ref: receipt.ref }) : '';
    document.getElementById('receipt-lead').textContent = t('receiptLead');
    document.getElementById('next-one-body').textContent = t('nextOneBody', { email: receipt.email });
    renderLines('receipt-lines', receipt.lines);
    const totals = totalsFor(receipt.lines);
    document.getElementById('receipt-setup').textContent = formatMoney(totals.setup);
    document.getElementById('receipt-monthly').textContent = monthlyText(totals.monthly);
}

function update() {
    if (!PRODUCTS[product].options[option]) option = PRODUCTS[product].defaultOption;
    if (currentConfig().family === 'box') boxOption = option;
    renderProduct();
    renderOptions();
    renderSupport();
    renderAddon();
    renderBenefits();
    renderQuantity();
    renderBasket();
    if (dialog.open) {
        if (receipt) renderReceipt();
        else renderOrderStep();
    }
}

function applyLanguage() {
    document.documentElement.lang = language;
    document.title = t('pageTitle');
    document.querySelectorAll('[data-i18n]').forEach((node) => {
        node.textContent = t(node.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-label]').forEach((node) => {
        node.setAttribute('aria-label', t(node.dataset.i18nLabel));
    });
    document.querySelectorAll('[data-language-option]').forEach((button) => {
        button.setAttribute('aria-pressed', button.dataset.languageOption === language ? 'true' : 'false');
    });
    document.getElementById('added-note').textContent = '';
    document.getElementById('form-error').hidden = true;
    update();
}

function orderText(data) {
    const totals = totalsFor(basket);
    const lines = basket.map((line) => {
        const price = priceFor(line);
        return `- ${lineTitle(line)} (${lineSummary(line)}): ${formatMoney(price.setup)} + ${monthlyText(price.monthly)}`;
    });
    const optional = [
        data.organization && `${t('company')}: ${data.organization}`,
        data.phone && `${t('phone')}: ${data.phone}`
    ].filter(Boolean);
    return [
        ...lines,
        '',
        `${t('setup')}: ${formatMoney(totals.setup)}`,
        `${t('monthly')}: ${monthlyText(totals.monthly)}`,
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
    error.scrollIntoView({ block: 'nearest' });
}

function setSending(value) {
    sending = value;
    const button = document.getElementById('send-button');
    button.disabled = value;
    button.querySelector('[data-i18n="send"]').textContent = value ? t('sending') : t('send');
}

function openOrder() {
    if (!basket.length) return;
    receipt = null;
    document.getElementById('order-step').hidden = false;
    document.getElementById('order-foot').hidden = false;
    document.getElementById('receipt-step').hidden = true;
    document.getElementById('form-error').hidden = true;
    renderOrderStep();
    dialog.showModal();
    document.getElementById('order-step').scrollTop = 0;
    form.elements.email.focus({ preventScroll: true });
}

function showReceipt(orderId, email, lines) {
    receipt = { ref: orderId ? String(orderId).replace(/-/g, '').slice(0, 8).toUpperCase() : '', email, lines };
    basket = [];
    saveBasket();
    form.reset();
    update();
    renderReceipt();
    document.getElementById('order-step').hidden = true;
    document.getElementById('order-foot').hidden = true;
    const step = document.getElementById('receipt-step');
    step.hidden = false;
    step.scrollTop = 0;
    step.querySelector('h2').focus();
}

async function submitOrder(event) {
    event.preventDefault();
    if (sending || !basket.length) return;
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
        organization: form.elements.organization.value.trim(),
        phone: form.elements.phone.value.trim()
    };
    const lines = basket.map((line) => ({ ...line }));
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
        items: lines.map((line) => ({ ...line, ...priceFor(line) })),
        totals: totalsFor(lines),
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
        showReceipt(result.orderId, data.email, lines);
    } catch {
        showFormError(t('errorSend'), orderText(data));
    } finally {
        clearTimeout(timer);
        setSending(false);
    }
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

document.querySelectorAll('input[name="support"]').forEach((input) => {
    input.addEventListener('change', () => {
        option = input.value;
        update();
    });
});

document.getElementById('complete-input').addEventListener('change', (event) => {
    complete = event.target.checked;
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
document.getElementById('checkout-button').addEventListener('click', openOrder);
document.getElementById('dialog-close').addEventListener('click', () => {
    if (!sending) dialog.close();
});
dialog.addEventListener('click', (event) => {
    if (event.target === dialog && !sending) dialog.close();
});
dialog.addEventListener('cancel', (event) => {
    if (sending) event.preventDefault();
});
dialog.addEventListener('close', () => {
    if (!receipt) return;
    receipt = null;
    window.scrollTo({ top: 0 });
});
form.addEventListener('submit', submitOrder);

applyLanguage();
