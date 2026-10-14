const STORAGE_KEY = 'easysort-language';
const CURRENCY_KEY = 'easysort-currency';
const DKK_PER_EUR = 7.46038;
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
 * which is a placeholder. An extra box at a location that already has one
 * costs 5,000 kr. less to set up and 1,000 kr. less per month; the complete
 * add-on is unchanged. Monitoring is priced per camera only, whatever the
 * number of locations. The app's monthly price starts at 4,000 kr. for the
 * first location and falls by 300 kr. for each further location, down to a
 * floor of 2,000 kr. Euros use the ERM II central rate, 7.46038 kr. per euro,
 * rounded to the nearest euro. */
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
                locationMonthly: { first: 4000, step: 300, floor: 2000 },
                complete: { perUnit: 0, perLocation: 6500 },
                setupItems: ['signsA1', 'qrLabels', 'signDesign', 'qrFile', 'siteMap', 'easytrack', 'training', 'precision'],
                completeItems: ['signsA1', 'qrLabels', 'signDesign'],
                basicItems: ['qrFile'],
                operationItems: ['hostingRequests', 'uptimeAlerts', 'reviewGuidance', 'apiDevelopment', 'retraining', 'guideChanges', 'freeImprovements']
            },
            box: {
                unit: 'box',
                hardware: true,
                unitSetup: 23500,
                unitMonthly: 6000,
                extraUnitSetup: 18500,
                extraUnitMonthly: 5000,
                locationSetup: { first: 0, extra: 0 },
                locationMonthly: { first: 0, extra: 0 },
                complete: { perUnit: 6500, perLocation: 0 },
                setupItems: ['boxHardware', 'outdoorScreen', 'banners', 'bannerDesign', 'mountingBox', 'mountingSigns', 'siteMap', 'easytrack', 'training', 'precision'],
                completeItems: ['banners', 'bannerDesign', 'mountingSigns'],
                operationItems: ['hostingRequests', 'dataConnection', 'serverModel', 'uptimeReplace', 'reviewGuidance', 'recognitionUpdates', 'retraining', 'freeModels']
            },
            boxSelf: {
                unit: 'box',
                hardware: true,
                unitSetup: 23500,
                unitMonthly: 4000,
                extraUnitSetup: 18500,
                extraUnitMonthly: 3000,
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
                perSite: false,
                locationSetup: { first: 0, extra: 0 },
                locationMonthly: { first: 0, extra: 0 },
                setupItems: ['reuseCamera', 'reuseModel', 'easytrack', 'precision'],
                operationItems: ['reuseImages', 'hostingOnly', 'serverOperation', 'uptimeReplace', 'reviewImages', 'retraining', 'freeModels']
            },
            container: {
                unit: 'camera',
                hardware: true,
                unitSetup: 10000,
                unitMonthly: 3500,
                perSite: false,
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
            ['Signs and QR labels', '2 A1 signs and 80 QR labels, designed and printed. Worth {kr:6500}.'],
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
            ['Watches the site', 'Movement and items, over 100,000 images a day.'],
            ['You see it in EasyTrack', 'What happens on the site, in one place.'],
            ['We keep it running', 'Hosting, uptime monitoring, and replacement if it fails.'],
            ['Better every month', 'Retraining every month, and new models for free.']
        ],
        container: [
            ['Sits at one container', 'It looks at what is thrown in.'],
            ['Including the difficult items', 'A closer look than the camera that watches the whole site.'],
            ['We keep it running', 'Hosting, uptime monitoring, and replacement if it fails.'],
            ['Better every month', 'Retraining every month, and new models for free.']
        ]
    },
    da: {
        app: [
            ['Skilte og QR-mærker', '2 A1-skilte og 80 QR-mærker med design og print. Værdi {kr:6500}.'],
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
            ['Ser pladsen', 'Bevægelse og emner, over 100.000 billeder om dagen.'],
            ['I ser det i EasyTrack', 'Hvad der sker på pladsen, samlet ét sted.'],
            ['Vi holder den kørende', 'Hosting, overvågning af driftstid og udskiftning, hvis den fejler.'],
            ['Bliver bedre hver måned', 'Gentræning hver måned og gratis nye modeller.']
        ],
        container: [
            ['Sidder ved én container', 'Den kigger på det, der bliver smidt i.'],
            ['Også de svære emner', 'Et nærmere kig end kameraet, der ser hele pladsen.'],
            ['Vi holder den kørende', 'Hosting, overvågning af driftstid og udskiftning, hvis den fejler.'],
            ['Bliver bedre hver måned', 'Gentræning hver måned og gratis nye modeller.']
        ]
    },
    de: {
        app: [
            ['Schilder und QR-Etiketten', '2 A1-Schilder und 80 QR-Etiketten mit Design und Druck. Wert {kr:6500}.'],
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
            ['Sieht den Platz', 'Bewegung und Gegenstände, über 100.000 Bilder pro Tag.'],
            ['Sie sehen es in EasyTrack', 'Was vor Ort passiert, an einem Ort.'],
            ['Wir halten es am Laufen', 'Hosting, Überwachung der Verfügbarkeit und Austausch bei Ausfall.'],
            ['Jeden Monat besser', 'Monatliches Nachtraining und kostenlose neue Modelle.']
        ],
        container: [
            ['Sitzt an einem Container', 'Sie schaut auf das, was hineingeworfen wird.'],
            ['Auch die schwierigen Gegenstände', 'Ein genauerer Blick als die Kamera, die den ganzen Platz sieht.'],
            ['Wir halten es am Laufen', 'Hosting, Überwachung der Verfügbarkeit und Austausch bei Ausfall.'],
            ['Jeden Monat besser', 'Monatliches Nachtraining und kostenlose neue Modelle.']
        ]
    }
};

const copy = {
    en: {
        pageTitle: 'Configure — Easysort',
        cart: 'Basket',
        addToCart: 'Add to basket',
        cartTitle: 'Your basket',
        toCheckout: 'Check out',
        shopMore: 'Add more products',
        backToCart: 'Back to basket',
        boxesPerSite: '{boxes}, one per location.',
        extraBoxOne: '1 at the lower price',
        extraBoxMany: '{count} at the lower price',
        extraBoxPrice: 'Extra box at the same location: {setup} + {monthly} / month, instead of {fullSetup} + {fullMonthly} / month.',
        boxesMinimum: 'At least one box per location.',
        moreBoxes: 'More boxes per location',
        stepCartOne: 'Basket · 1 line',
        stepCartMany: 'Basket · {count} lines',
        stepCheckout: 'Checkout',
        checkBinding: 'I accept the payment terms',
        checkBindingHint: 'Bank transfer. Unpaid orders are canceled after 5 days.',
        chooseProduct: 'Product',
        mockLabel: 'Fraction',
        mockFraction: 'Cardboard',
        mockContainer: 'Container 4',
        optionFrom: 'From {setup} + {monthly} / month',
        tagline_sorting: 'Visitors show their waste. The guide shows the container and the way there.',
        tagline_monitoring: 'One camera watches the site. One camera sits at a container. You see it in EasyTrack.',
        chooseOption: 'Choose a version',
        quantity: 'Quantity',
        locations: 'Locations',
        sorting: 'Sorting Guide',
        monitoring: 'Monitoring Box',
        option_app_body: 'Visitors scan a QR code, take a photo, and get the route on their phone.',
        option_box_body: 'A screen and camera on site. We run and service it.',
        option_boxSelf_body: 'A screen and camera on site. We analyze the images, you run the box. Fault-finding {hourly} / hour.',
        option_reuse_body: 'Watches the whole site: movement and items, over 100,000 images a day. You see it in EasyTrack.',
        option_container_body: 'Sits at one container and looks at what is thrown in, including the difficult items.',
        name_app: 'App',
        name_box: 'Box with support',
        name_boxSelf: 'Box without support',
        name_reuse: 'Reuse monitoring',
        name_container: 'Container monitoring',
        benefitsTitle: 'What you get',
        allIncluded: 'See everything included ({count})',
        includedSetup: 'Included in setup',
        includedOperation: 'Included in operation',
        excludedHeading: 'Not included, because you have the access',
        unit_box: 'Boxes in total',
        unit_camera: 'Cameras',
        count_box_one: '1 box',
        count_box: '{count} boxes',
        count_camera_one: '1 camera',
        count_camera: '{count} cameras',
        locationCountOne: '1 location',
        locationCount: '{count} locations',
        extraLocationNote: 'Each extra location: {setup} setup and {monthly} / month.',
        nextLocationNote: 'Next location: {setup} setup and {monthly} / month. Then {step} less per location each month.',
        tryRoskilde: 'Try it in Roskilde',
        tryRoskildeHint: 'The live guide. Scan with your phone.',
        signsA1: '2 A1 signs, designed and printed (worth {kr:4000})',
        qrLabels: '80 A4 QR labels for containers and signs (worth {kr:2500})',
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
        remove: 'Remove',
        close: 'Close',
        stepSent: 'Order sent',
        checkoutTitle: 'Place your order',
        paymentTitle: 'Payment',
        paymentSecure: 'All transactions are secure and encrypted.',
        paymentMethod: 'Bank transfer',
        paymentBody: 'After you place the order, you receive a confirmation email with the payment details. Unpaid orders are canceled after 5 days. You receive another email when the payment has arrived, and one when we start.',
        summaryNote: 'Prices excl. VAT. Unpaid orders are canceled after 5 days.',
        contactHeading: 'Where do we send the confirmation?',
        email: 'Work email',
        company: 'Organization',
        phone: 'Phone',
        optionalHint: 'Organization and phone are optional, but help us reply faster.',
        checklistTitle: 'Confirm before you order',
        checkDecision: 'I can approve the purchase',
        checkDecisionHint: 'Or the person who can is part of this order.',
        checkTimeline: 'We want to start within 3 months',
        checkTimelineHint: 'So we can plan delivery and setup.',
        checkInfrastructure: 'There is power on site',
        checkInfrastructureHint: 'Where the box or camera will go.',
        dpaTitle: 'Data processing agreement',
        dpaBody: 'We sign it before we start. It covers every image, and faces and license plates are blurred immediately. Images are kept for at most 30 days and almost always deleted within 24 hours. Selected anonymous images are kept longer to improve accuracy.',
        send: 'Place binding order',
        sending: 'Sending…',
        sendNote: 'Unpaid orders are canceled after 5 days.',
        errorEmail: 'Enter a valid email address.',
        errorChecklist: 'Confirm every point in the checklist.',
        errorSend: 'We could not send your order. ',
        errorSendLink: 'Email it to us instead',
        receiptRef: 'Order {ref}',
        confirmedTitle: 'Thank you. We have your order.',
        receiptLead: 'The order is placed. A confirmation with the payment details is on its way. Unpaid orders are canceled after 5 days.',
        nextTitle: 'What happens now',
        nextOneTitle: 'Confirmation with payment details',
        nextOneBody: 'We send it to {email}.',
        nextTwoTitle: 'Email when the payment arrives',
        nextTwoBody: 'If it has not arrived within 5 days, the order is canceled.',
        nextThreeTitle: 'Email when we start',
        nextThreeBody: 'We sign the data processing agreement and set it up on your site.',
        questions: 'Questions?',
        backHome: 'Back to Easysort',
        privacy: 'Privacy',
        mailSubject: 'Easysort order'
    },
    da: {
        pageTitle: 'Konfigurér — Easysort',
        cart: 'Kurv',
        addToCart: 'Læg i kurv',
        cartTitle: 'Jeres kurv',
        toCheckout: 'Til bestilling',
        shopMore: 'Tilføj flere produkter',
        backToCart: 'Tilbage til kurven',
        boxesPerSite: '{boxes}, én pr. plads.',
        extraBoxOne: '1 til den lavere pris',
        extraBoxMany: '{count} til den lavere pris',
        extraBoxPrice: 'Ekstra boks på samme plads: {setup} + {monthly} / md. i stedet for {fullSetup} + {fullMonthly} / md.',
        boxesMinimum: 'Mindst én boks pr. plads.',
        moreBoxes: 'Flere bokse pr. plads',
        stepCartOne: 'Kurv · 1 linje',
        stepCartMany: 'Kurv · {count} linjer',
        stepCheckout: 'Bestilling',
        checkBinding: 'Jeg accepterer betalingsbetingelserne',
        checkBindingHint: 'Bankoverførsel. Ubetalte ordrer annulleres efter 5 dage.',
        chooseProduct: 'Produkt',
        mockLabel: 'Fraktion',
        mockFraction: 'Pap og karton',
        mockContainer: 'Container 4',
        optionFrom: 'Fra {setup} + {monthly} / md.',
        tagline_sorting: 'Borgeren viser affaldet. Guiden viser containeren og vejen derhen.',
        tagline_monitoring: 'Ét kamera ser pladsen. Ét kamera sidder ved en container. I ser det i EasyTrack.',
        chooseOption: 'Vælg løsning',
        quantity: 'Antal',
        locations: 'Pladser',
        sorting: 'Sorteringsguide',
        monitoring: 'Overvågningsboks',
        option_app_body: 'Borgeren scanner en QR-kode, tager et billede og får ruten på telefonen.',
        option_box_body: 'Skærm og kamera på pladsen. Vi driver og servicerer den.',
        option_boxSelf_body: 'Skærm og kamera på pladsen. Vi analyserer billederne, I driver boksen. Fejlretning {hourly} / time.',
        option_reuse_body: 'Ser hele pladsen: bevægelse og emner, over 100.000 billeder om dagen. I ser det i EasyTrack.',
        option_container_body: 'Sidder ved én container og kigger på det, der bliver smidt i, også de svære emner.',
        name_app: 'App',
        name_box: 'Boks med support',
        name_boxSelf: 'Boks uden support',
        name_reuse: 'Genbrugsovervågning',
        name_container: 'Containerovervågning',
        benefitsTitle: 'Det får I',
        allIncluded: 'Se alt, der er med ({count})',
        includedSetup: 'Med i opsætningen',
        includedOperation: 'Med i driften',
        excludedHeading: 'Ikke med, fordi I har adgangen',
        unit_box: 'Bokse i alt',
        unit_camera: 'Kameraer',
        count_box_one: '1 boks',
        count_box: '{count} bokse',
        count_camera_one: '1 kamera',
        count_camera: '{count} kameraer',
        locationCountOne: '1 plads',
        locationCount: '{count} pladser',
        extraLocationNote: 'Hver ekstra plads: {setup} i opsætning og {monthly} / md.',
        nextLocationNote: 'Næste plads: {setup} i opsætning og {monthly} / md. Derefter {step} mindre pr. plads om måneden.',
        tryRoskilde: 'Prøv den i Roskilde',
        tryRoskildeHint: 'Den rigtige guide. Scan med telefonen.',
        signsA1: '2 A1-skilte med design og print, værdi {kr:4000}',
        qrLabels: '80 A4 QR-mærker til containere og skilte, værdi {kr:2500}',
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
        remove: 'Fjern',
        close: 'Luk',
        stepSent: 'Ordre sendt',
        checkoutTitle: 'Afgiv ordre',
        paymentTitle: 'Betaling',
        paymentSecure: 'Alle transaktioner er sikre og krypterede.',
        paymentMethod: 'Bankoverførsel',
        paymentBody: 'Når I har afgivet ordren, får I en bekræftelse på mail med betalingsoplysningerne. Ubetalte ordrer annulleres efter 5 dage. I får en mail, når betalingen er gået ind, og en mail, når vi går i gang.',
        summaryNote: 'Priser ekskl. moms. Ubetalte ordrer annulleres efter 5 dage.',
        contactHeading: 'Hvor sender vi bekræftelsen?',
        email: 'Arbejdsmail',
        company: 'Organisation',
        phone: 'Telefon',
        optionalHint: 'Organisation og telefon er valgfrie, men hjælper os med at svare hurtigere.',
        checklistTitle: 'Bekræft, før I bestiller',
        checkDecision: 'Jeg kan godkende købet',
        checkDecisionHint: 'Eller den, der kan, er med på denne ordre.',
        checkTimeline: 'Vi vil i gang inden for 3 måneder',
        checkTimelineHint: 'Så vi kan planlægge levering og opsætning.',
        checkInfrastructure: 'Der er strøm på pladsen',
        checkInfrastructureHint: 'Der, hvor boksen eller kameraet skal sidde.',
        dpaTitle: 'Databehandleraftale',
        dpaBody: 'Vi underskriver den, før vi går i gang. Den gælder alle billeder, og ansigter og nummerplader sløres med det samme. Billeder gemmes i højst 30 dage og slettes næsten altid inden for 24 timer. Udvalgte anonyme billeder holdes længere for at øge præcisionen.',
        send: 'Afgiv bindende ordre',
        sending: 'Sender…',
        sendNote: 'Ubetalte ordrer annulleres efter 5 dage.',
        errorEmail: 'Skriv en gyldig e-mailadresse.',
        errorChecklist: 'Bekræft alle punkter på tjeklisten.',
        errorSend: 'Vi kunne ikke sende ordren. ',
        errorSendLink: 'Send den til os på mail i stedet',
        receiptRef: 'Ordre {ref}',
        confirmedTitle: 'Tak. Vi har modtaget jeres ordre.',
        receiptLead: 'Ordren er afgivet. En bekræftelse med betalingsoplysninger er på vej. Ubetalte ordrer annulleres efter 5 dage.',
        nextTitle: 'Det sker nu',
        nextOneTitle: 'Bekræftelse med betalingsoplysninger',
        nextOneBody: 'Vi sender den til {email}.',
        nextTwoTitle: 'Mail, når betalingen er gået ind',
        nextTwoBody: 'Hvis den ikke er gået ind inden for 5 dage, annulleres ordren.',
        nextThreeTitle: 'Mail, når vi går i gang',
        nextThreeBody: 'Vi underskriver databehandleraftalen og sætter løsningen op på pladsen.',
        questions: 'Spørgsmål?',
        backHome: 'Tilbage til Easysort',
        privacy: 'Privatliv',
        mailSubject: 'Easysort ordre'
    },
    de: {
        pageTitle: 'Konfigurieren — Easysort',
        cart: 'Warenkorb',
        addToCart: 'In den Warenkorb',
        cartTitle: 'Ihr Warenkorb',
        toCheckout: 'Zur Kasse',
        shopMore: 'Weitere Produkte hinzufügen',
        backToCart: 'Zurück zum Warenkorb',
        boxesPerSite: '{boxes}, eine pro Standort.',
        extraBoxOne: '1 zum niedrigeren Preis',
        extraBoxMany: '{count} zum niedrigeren Preis',
        extraBoxPrice: 'Weitere Box am selben Standort: {setup} + {monthly} / Monat statt {fullSetup} + {fullMonthly} / Monat.',
        boxesMinimum: 'Mindestens eine Box pro Standort.',
        moreBoxes: 'Mehr Boxen pro Standort',
        stepCartOne: 'Warenkorb · 1 Position',
        stepCartMany: 'Warenkorb · {count} Positionen',
        stepCheckout: 'Kasse',
        checkBinding: 'Ich akzeptiere die Zahlungsbedingungen',
        checkBindingHint: 'Banküberweisung. Unbezahlte Bestellungen werden nach 5 Tagen storniert.',
        chooseProduct: 'Produkt',
        mockLabel: 'Fraktion',
        mockFraction: 'Pappe und Karton',
        mockContainer: 'Container 4',
        optionFrom: 'Ab {setup} + {monthly} / Monat',
        tagline_sorting: 'Besucher zeigen ihren Abfall. Die Sortierhilfe zeigt den Container und den Weg dorthin.',
        tagline_monitoring: 'Eine Kamera sieht den Platz. Eine Kamera sitzt an einem Container. Sie sehen es in EasyTrack.',
        chooseOption: 'Version wählen',
        quantity: 'Anzahl',
        locations: 'Standorte',
        sorting: 'Sortierhilfe',
        monitoring: 'Monitoring Box',
        option_app_body: 'Besucher scannen einen QR-Code, machen ein Foto und sehen den Weg auf dem Handy.',
        option_box_body: 'Bildschirm und Kamera vor Ort. Wir betreiben und warten sie.',
        option_boxSelf_body: 'Bildschirm und Kamera vor Ort. Wir analysieren die Bilder, Sie betreiben die Box. Fehlersuche {hourly} / Stunde.',
        option_reuse_body: 'Sieht den ganzen Platz: Bewegungen und Gegenstände, über 100.000 Bilder pro Tag. Sie sehen es in EasyTrack.',
        option_container_body: 'Sitzt an einem Container und sieht, was hineingeworfen wird, auch die schwierigen Gegenstände.',
        name_app: 'App',
        name_box: 'Box mit Support',
        name_boxSelf: 'Box ohne Support',
        name_reuse: 'Wiederverwendungsüberwachung',
        name_container: 'Containerüberwachung',
        benefitsTitle: 'Das bekommen Sie',
        allIncluded: 'Alle Leistungen ansehen ({count})',
        includedSetup: 'In der Einrichtung enthalten',
        includedOperation: 'Im Betrieb enthalten',
        excludedHeading: 'Nicht enthalten, weil der Zugang bei Ihnen liegt',
        unit_box: 'Boxen insgesamt',
        unit_camera: 'Kameras',
        count_box_one: '1 Box',
        count_box: '{count} Boxen',
        count_camera_one: '1 Kamera',
        count_camera: '{count} Kameras',
        locationCountOne: '1 Standort',
        locationCount: '{count} Standorte',
        extraLocationNote: 'Jeder weitere Standort: {setup} Einrichtung und {monthly} / Monat.',
        nextLocationNote: 'Nächster Standort: {setup} Einrichtung und {monthly} / Monat. Danach {step} weniger pro Standort und Monat.',
        tryRoskilde: 'In Roskilde ausprobieren',
        tryRoskildeHint: 'Die echte Sortierhilfe. Mit dem Handy scannen.',
        signsA1: '2 A1-Schilder mit Design und Druck (Wert {kr:4000})',
        qrLabels: '80 A4-QR-Etiketten für Container und Schilder (Wert {kr:2500})',
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
        remove: 'Entfernen',
        close: 'Schließen',
        stepSent: 'Bestellung gesendet',
        checkoutTitle: 'Bestellung aufgeben',
        paymentTitle: 'Zahlung',
        paymentSecure: 'Alle Transaktionen sind sicher und verschlüsselt.',
        paymentMethod: 'Banküberweisung',
        paymentBody: 'Nach der Bestellung erhalten Sie eine Bestätigung per E-Mail mit den Zahlungsdaten. Unbezahlte Bestellungen werden nach 5 Tagen storniert. Sie erhalten eine E-Mail, wenn die Zahlung eingegangen ist, und eine, wenn wir beginnen.',
        summaryNote: 'Preise zzgl. MwSt. Unbezahlte Bestellungen werden nach 5 Tagen storniert.',
        contactHeading: 'Wohin senden wir die Bestätigung?',
        email: 'Geschäftliche E-Mail',
        company: 'Organisation',
        phone: 'Telefon',
        optionalHint: 'Organisation und Telefon sind optional, helfen uns aber, schneller zu antworten.',
        checklistTitle: 'Vor der Bestellung bestätigen',
        checkDecision: 'Ich kann den Kauf freigeben',
        checkDecisionHint: 'Oder die Person, die es kann, ist an dieser Bestellung beteiligt.',
        checkTimeline: 'Wir möchten innerhalb von 3 Monaten starten',
        checkTimelineHint: 'Damit wir Lieferung und Einrichtung planen können.',
        checkInfrastructure: 'Vor Ort gibt es Strom',
        checkInfrastructureHint: 'Dort, wo Box oder Kamera montiert wird.',
        dpaTitle: 'Auftragsverarbeitungsvertrag',
        dpaBody: 'Wir unterzeichnen ihn vor dem Start. Er gilt für alle Bilder, Gesichter und Kennzeichen werden sofort unkenntlich gemacht. Bilder werden höchstens 30 Tage gespeichert und fast immer innerhalb von 24 Stunden gelöscht. Ausgewählte anonyme Bilder werden länger aufbewahrt, um die Genauigkeit zu verbessern.',
        send: 'Verbindlich bestellen',
        sending: 'Wird gesendet…',
        sendNote: 'Unbezahlte Bestellungen werden nach 5 Tagen storniert.',
        errorEmail: 'Bitte eine gültige E-Mail-Adresse eingeben.',
        errorChecklist: 'Bitte alle Punkte der Checkliste bestätigen.',
        errorSend: 'Die Bestellung konnte nicht gesendet werden. ',
        errorSendLink: 'Stattdessen per E-Mail senden',
        receiptRef: 'Bestellung {ref}',
        confirmedTitle: 'Vielen Dank. Ihre Bestellung ist eingegangen.',
        receiptLead: 'Die Bestellung ist aufgegeben. Eine Bestätigung mit den Zahlungsdaten ist unterwegs. Unbezahlte Bestellungen werden nach 5 Tagen storniert.',
        nextTitle: 'So geht es weiter',
        nextOneTitle: 'Bestätigung mit Zahlungsdaten',
        nextOneBody: 'Wir senden sie an {email}.',
        nextTwoTitle: 'E-Mail, wenn die Zahlung eingeht',
        nextTwoBody: 'Geht sie nicht innerhalb von 5 Tagen ein, wird die Bestellung storniert.',
        nextThreeTitle: 'E-Mail, wenn wir beginnen',
        nextThreeBody: 'Wir unterzeichnen den Auftragsverarbeitungsvertrag und richten die Lösung vor Ort ein.',
        questions: 'Fragen?',
        backHome: 'Zurück zu Easysort',
        privacy: 'Datenschutz',
        mailSubject: 'Easysort Bestellung'
    }
};

let language = preferredLanguage();
let currency = preferredCurrency();
let product = requestedProduct();
let option = PRODUCTS[product].defaultOption;
let complete = true;
let locations = 1;
/* Boxes follow locations: one per location, plus any extra the visitor adds. */
let extraBoxes = 0;
let cameras = 1;
let basket = loadBasket();
let step = 'cart';
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

function currencyForLanguage(code) {
    return code === 'de' ? 'EUR' : 'DKK';
}

function preferredCurrency() {
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved === 'DKK' || saved === 'EUR') return saved;
    return currencyForLanguage(preferredLanguage());
}

function requestedProduct() {
    return new URLSearchParams(location.search).get('product') === 'monitoring' ? 'monitoring' : 'sorting';
}

function t(key, replacements = {}) {
    const value = copy[language][key] ?? copy.en[key] ?? key;
    return fillMoney(value.replace(/\{(\w+)\}/g, (_, name) => replacements[name] ?? `{${name}}`));
}

function shownAmount(dkk) {
    const amount = Number(dkk) || 0;
    if (currency !== 'EUR') return Math.round(amount);
    return Math.round(amount / DKK_PER_EUR);
}

function formatAmount(amount) {
    const locale = language === 'da' ? 'da-DK' : language === 'de' ? 'de-DE' : 'en-GB';
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(amount));
    if (currency === 'EUR') return language === 'en' ? `€${formatted}` : `${formatted} €`;
    return `${formatted} kr.`;
}

function formatMoney(dkk) {
    return formatAmount(shownAmount(dkk));
}

function fillMoney(value) {
    return String(value).replace(/\{kr:(\d+)\}/g, (_, amount) => formatMoney(Number(amount)));
}

function shownTotals(lines) {
    return lines.reduce((sum, line) => {
        const price = priceFor(line);
        return {
            setup: sum.setup + shownAmount(price.setup),
            monthly: sum.monthly + shownAmount(price.monthly)
        };
    }, { setup: 0, monthly: 0 });
}

function optionConfig(line) {
    return PRODUCTS[line.product]?.options[line.option];
}

function perSite(config) {
    return config.perSite !== false;
}

function isValidLine(line) {
    const config = optionConfig(line || {});
    if (!config) return false;
    const completeOk = config.complete ? typeof line.complete === 'boolean' : line.complete === undefined;
    if (!completeOk || !Number.isInteger(line.units) || !Number.isInteger(line.locations)) return false;
    if (!perSite(config)) return line.locations === 0 && line.units >= 1 && line.units <= MAX_UNITS;
    if (line.locations < 1 || line.locations > MAX_LOCATIONS) return false;
    return config.unit ? line.units >= line.locations && line.units <= MAX_UNITS : line.units === 0;
}

function loadBasket() {
    try {
        const saved = JSON.parse(localStorage.getItem(BASKET_KEY) || '[]');
        if (!Array.isArray(saved)) return [];
        return saved
            .map((line) => {
                const config = optionConfig(line || {});
                if (!config) return line;
                const next = { ...line };
                if (config.complete && next.complete === undefined) next.complete = true;
                if (!perSite(config)) next.locations = 0;
                return next;
            })
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

function marginalMonthly(tier, index) {
    if (!tier.step) return index === 0 ? tier.first : tier.extra;
    return Math.max(tier.floor ?? 0, tier.first - index * tier.step);
}

function tieredMonthly(tier, count) {
    let total = 0;
    for (let index = 0; index < count; index += 1) total += marginalMonthly(tier, index);
    return total;
}

function completePrice(config, line) {
    if (!config.complete || !line.complete) return 0;
    return config.complete.perUnit * line.units + config.complete.perLocation * line.locations;
}

function unitTotals(config, line) {
    const discounted = config.extraUnitSetup != null && line.locations > 0;
    const full = discounted ? Math.min(line.units, line.locations) : line.units;
    const extra = line.units - full;
    return {
        setup: config.unitSetup * full + (config.extraUnitSetup ?? config.unitSetup) * extra,
        monthly: config.unitMonthly * full + (config.extraUnitMonthly ?? config.unitMonthly) * extra
    };
}

function priceFor(line) {
    const config = optionConfig(line);
    const units = unitTotals(config, line);
    return {
        setup: units.setup + tiered(config.locationSetup, line.locations) + completePrice(config, line),
        monthly: units.monthly + tieredMonthly(config.locationMonthly, line.locations)
    };
}

function currentConfig() {
    return PRODUCTS[product].options[option];
}

function lineFor(key, siteCount, extraUnits, cameraCount) {
    const config = PRODUCTS[product].options[key];
    const sites = perSite(config) ? siteCount : 0;
    let unitCount = 0;
    if (config.unit) unitCount = sites ? sites + extraUnits : cameraCount;
    const line = { product, option: key, units: unitCount, locations: sites };
    if (config.complete) line.complete = complete;
    return line;
}

function currentLine() {
    return lineFor(option, locations, extraBoxes, cameras);
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
    if (line.locations) parts.push(line.locations === 1 ? t('locationCountOne') : t('locationCount', { count: line.locations }));
    const extraBoxesOnLine = config.unit === 'box' ? Math.max(0, line.units - line.locations) : 0;
    if (extraBoxesOnLine) parts.push(extraBoxesOnLine === 1 ? t('extraBoxOne') : t('extraBoxMany', { count: extraBoxesOnLine }));
    if (line.complete) parts.push(t('completeTag'));
    return parts.join(' · ');
}

function lineTitle(line) {
    return `${t(line.product)} · ${t(`name_${line.option}`)}`;
}

function monthlyText(value) {
    return `${formatMoney(value)} ${t('perMonth')}`;
}

function priceText(totals) {
    return `${formatMoney(totals.setup)} + ${monthlyText(totals.monthly)}`;
}

function needsHardware(lines) {
    return lines.some((line) => optionConfig(line).hardware);
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

function change(apply) {
    apply();
    update();
}

function renderProduct() {
    const image = document.getElementById('product-image');
    image.src = PRODUCTS[product].image;
    image.hidden = option === 'app';
    document.getElementById('phone-mock').hidden = option !== 'app';
    document.getElementById('try-qr').hidden = option !== 'app';
    document.getElementById('product-name').textContent = t(product);
    document.getElementById('product-tagline').textContent = t(`tagline_${product}`);
    document.querySelectorAll('input[name="product"]').forEach((input) => {
        input.checked = input.value === product;
    });
}

function renderOptions() {
    const container = document.getElementById('option-list');
    container.textContent = '';
    Object.keys(PRODUCTS[product].options).forEach((key) => {
        const label = document.createElement('label');
        label.className = 'option-card';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'option';
        input.value = key;
        input.checked = key === option;
        input.addEventListener('change', () => change(() => { option = key; }));

        const body = document.createElement('span');
        const head = document.createElement('span');
        head.className = 'option-head';
        const name = document.createElement('strong');
        name.textContent = t(`name_${key}`);
        const price = document.createElement('em');
        const from = priceFor(lineFor(key, 1, 0, 1));
        price.textContent = t('optionFrom', { setup: formatMoney(from.setup), monthly: formatMoney(from.monthly) });
        head.append(name, price);
        const detail = document.createElement('small');
        detail.textContent = t(`option_${key}_body`, { hourly: formatMoney(HOURLY_RATE) });
        body.append(head, detail);
        label.append(input, body);
        container.append(label);
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
        span.textContent = fillMoney(body);
        item.append(strong, span);
        list.append(item);
    });
    document.getElementById('all-included-summary').textContent = t('allIncluded', {
        count: setupItems.length + config.operationItems.length
    });
    document.getElementById('operation-heading').textContent = t('includedOperation');
    fillList('included-setup', setupItems);
    fillList('included-operation', config.operationItems);
    document.getElementById('excluded-group').hidden = !config.excludedItems;
    fillList('excluded-items', config.excludedItems || []);
}

function renderQuantity() {
    const config = currentConfig();
    const sites = perSite(config);
    const boxes = sites && config.unit === 'box';
    const line = currentLine();

    document.getElementById('location-group').hidden = !sites;
    document.getElementById('location-output').textContent = String(locations);
    document.getElementById('location-decrease').disabled = locations <= 1;
    document.getElementById('location-increase').disabled = locations >= MAX_LOCATIONS;

    document.getElementById('unit-group').hidden = !config.unit;
    if (config.unit) document.getElementById('unit-label').textContent = t(`unit_${config.unit}`);
    document.getElementById('unit-output').textContent = String(line.units);
    document.getElementById('unit-decrease').disabled = boxes ? extraBoxes <= 0 : cameras <= 1;
    document.getElementById('unit-increase').disabled = line.units >= MAX_UNITS;

    document.getElementById('box-note').hidden = !boxes;
    document.getElementById('box-note-text').textContent = extraBoxes
        ? t('boxesMinimum')
        : t('boxesPerSite', { boxes: countLabel(line.units, 'count_box') });
    const extraNote = document.getElementById('extra-box-note');
    extraNote.hidden = !boxes;
    if (boxes) {
        const full = priceFor(lineFor(option, 1, 0, 1));
        const withExtra = priceFor(lineFor(option, 1, 1, 1));
        extraNote.textContent = t('extraBoxPrice', {
            setup: formatMoney(withExtra.setup - full.setup),
            monthly: formatMoney(withExtra.monthly - full.monthly),
            fullSetup: formatMoney(full.setup),
            fullMonthly: formatMoney(full.monthly)
        });
    }

    const note = document.getElementById('saving-note');
    const extraComplete = config.complete && complete ? config.complete.perLocation : 0;
    if (config.unit === null && config.locationMonthly.step && locations < MAX_LOCATIONS) {
        note.hidden = false;
        note.textContent = t('nextLocationNote', {
            setup: formatMoney(config.locationSetup.extra + extraComplete),
            monthly: formatMoney(marginalMonthly(config.locationMonthly, locations)),
            step: formatMoney(config.locationMonthly.step)
        });
    } else {
        const extra = config.locationSetup.extra || config.locationMonthly.extra;
        note.hidden = config.unit !== null || !extra;
        note.textContent = t('extraLocationNote', {
            setup: formatMoney(config.locationSetup.extra + extraComplete),
            monthly: formatMoney(config.locationMonthly.extra || 0)
        });
    }
}

function lineItem(line, action) {
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
    if (action) item.append(action);
    return item;
}

function renderLines(listId, lines) {
    const list = document.getElementById(listId);
    list.textContent = '';
    lines.forEach((line) => list.append(lineItem(line)));
}

function renderHeaderCart() {
    document.getElementById('cart-link').hidden = basket.length === 0;
    document.getElementById('cart-count').textContent = String(basket.length);
}

function renderBar() {
    const line = currentLine();
    document.getElementById('bar-label').textContent = `${lineTitle(line)} · ${lineSummary(line)}`;
    const price = priceFor(line);
    const setup = document.createElement('span');
    setup.textContent = formatMoney(price.setup);
    const monthly = document.createElement('span');
    monthly.textContent = monthlyText(price.monthly);
    document.getElementById('bar-price').replaceChildren(setup, ' + ', monthly);
    document.getElementById('add-button').disabled = basket.length >= MAX_LINES;
}

function showStep(name) {
    step = name;
    document.getElementById('cart-step').hidden = name !== 'cart';
    document.getElementById('cart-foot').hidden = name !== 'cart';
    document.getElementById('order-step').hidden = name !== 'checkout';
    document.getElementById('order-foot').hidden = name !== 'checkout';
    document.getElementById('receipt-step').hidden = name !== 'receipt';
    renderDialog();
}

function renderCart() {
    document.getElementById('dialog-step').textContent = basket.length === 1
        ? t('stepCartOne')
        : t('stepCartMany', { count: basket.length });
    const list = document.getElementById('cart-lines');
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
            if (!basket.length) dialog.close();
            update();
        });
        list.append(lineItem(line, remove));
    });
    const shown = shownTotals(basket);
    document.getElementById('cart-setup').textContent = formatAmount(shown.setup);
    document.getElementById('cart-monthly').textContent = `${formatAmount(shown.monthly)} ${t('perMonth')}`;
    document.getElementById('cart-total').textContent = `${formatAmount(shown.setup)} + ${formatAmount(shown.monthly)} ${t('perMonth')}`;
}

function renderOrderStep() {
    const totals = shownTotals(basket);
    document.getElementById('dialog-step').textContent = t('stepCheckout');
    renderLines('summary-lines', basket);
    document.getElementById('summary-setup').textContent = formatAmount(totals.setup);
    document.getElementById('summary-monthly').textContent = `${formatAmount(totals.monthly)} ${t('perMonth')}`;
    document.getElementById('send-total').textContent = `${formatAmount(totals.setup)} + ${formatAmount(totals.monthly)} ${t('perMonth')}`;

    const hardware = needsHardware(basket);
    const infrastructure = document.getElementById('infrastructure-check');
    infrastructure.hidden = !hardware;
    infrastructure.querySelector('input').required = hardware;
}

function renderReceipt() {
    document.getElementById('dialog-step').textContent = t('stepSent');
    const ref = document.getElementById('receipt-ref');
    ref.hidden = !receipt.ref;
    ref.textContent = receipt.ref ? t('receiptRef', { ref: receipt.ref }) : '';
    document.getElementById('receipt-lead').textContent = t('receiptLead');
    document.getElementById('next-one-body').textContent = t('nextOneBody', { email: receipt.email });
    renderLines('receipt-lines', receipt.lines);
    const totals = shownTotals(receipt.lines);
    document.getElementById('receipt-setup').textContent = formatAmount(totals.setup);
    document.getElementById('receipt-monthly').textContent = `${formatAmount(totals.monthly)} ${t('perMonth')}`;
}

function renderDialog() {
    if (step === 'receipt') renderReceipt();
    else if (step === 'checkout') renderOrderStep();
    else renderCart();
}

function update() {
    if (!PRODUCTS[product].options[option]) option = PRODUCTS[product].defaultOption;
    renderProduct();
    renderOptions();
    renderBenefits();
    renderAddon();
    renderQuantity();
    renderBar();
    renderHeaderCart();
    if (dialog.open) renderDialog();
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
    document.querySelectorAll('[data-currency-option]').forEach((button) => {
        button.setAttribute('aria-pressed', button.dataset.currencyOption === currency ? 'true' : 'false');
    });
    document.getElementById('form-error').hidden = true;
    update();
}

function orderText(data, lines) {
    const totals = shownTotals(lines);
    const items = lines.map((line) => `- ${lineTitle(line)} (${lineSummary(line)}): ${priceText(priceFor(line))}`);
    const optional = [
        data.organization && `${t('company')}: ${data.organization}`,
        data.phone && `${t('phone')}: ${data.phone}`
    ].filter(Boolean);
    return [
        ...items,
        '',
        `${t('setup')}: ${formatAmount(totals.setup)}`,
        `${t('monthly')}: ${formatAmount(totals.monthly)} ${t('perMonth')}`,
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

function openCart() {
    if (!basket.length) return;
    receipt = null;
    document.getElementById('form-error').hidden = true;
    showStep('cart');
    if (!dialog.open) dialog.showModal();
    document.getElementById('cart-step').scrollTop = 0;
    document.getElementById('to-checkout').focus();
}

function openCheckout() {
    if (!basket.length) return;
    showStep('checkout');
    document.getElementById('order-step').scrollTop = 0;
    form.elements.email.focus({ preventScroll: true });
}

function showReceipt(orderId, email, lines) {
    receipt = { ref: orderId ? String(orderId).replace(/-/g, '').slice(0, 8).toUpperCase() : '', email, lines };
    basket = [];
    saveBasket();
    form.reset();
    showStep('receipt');
    update();
    const receiptStep = document.getElementById('receipt-step');
    receiptStep.scrollTop = 0;
    receiptStep.querySelector('h2').focus();
}

async function submitOrder(event) {
    event.preventDefault();
    const lines = basket.map((line) => ({ ...line }));
    if (sending || step !== 'checkout' || !lines.length) return;
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
    const payload = {
        ...data,
        website: form.elements.website.value,
        language,
        page: location.pathname,
        checklist: {
            decisionMaker: form.elements.decisionMaker.checked,
            timeline: form.elements.timeline.checked,
            infrastructure: needsHardware(lines) ? form.elements.infrastructure.checked : null,
            binding: form.elements.binding.checked
        },
        items: lines.map((line) => {
            const price = priceFor(line);
            return { ...line, setup: shownAmount(price.setup), monthly: shownAmount(price.monthly) };
        }),
        totals: shownTotals(lines),
        currency
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
        showFormError(t('errorSend'), orderText(data, lines));
    } finally {
        clearTimeout(timer);
        setSending(false);
    }
}

function setCurrency(next) {
    if (next !== 'DKK' && next !== 'EUR') return;
    currency = next;
    localStorage.setItem(CURRENCY_KEY, currency);
    applyLanguage();
}

document.querySelectorAll('[data-language-option]').forEach((button) => {
    button.addEventListener('click', () => {
        language = button.dataset.languageOption;
        localStorage.setItem(STORAGE_KEY, language);
        setCurrency(currencyForLanguage(language));
    });
});

document.querySelectorAll('[data-currency-option]').forEach((button) => {
    button.addEventListener('click', () => setCurrency(button.dataset.currencyOption));
});

document.querySelectorAll('input[name="product"]').forEach((input) => {
    input.addEventListener('change', () => change(() => {
        product = input.value;
        option = PRODUCTS[product].defaultOption;
        history.replaceState(null, '', `?product=${product}`);
    }));
});

document.getElementById('complete-input').addEventListener('change', (event) => {
    change(() => { complete = event.target.checked; });
});
document.getElementById('location-decrease').addEventListener('click', () => {
    change(() => { locations = Math.max(1, locations - 1); });
});
document.getElementById('location-increase').addEventListener('click', () => {
    change(() => {
        locations = Math.min(MAX_LOCATIONS, locations + 1);
        extraBoxes = Math.min(extraBoxes, MAX_UNITS - locations);
    });
});
document.getElementById('unit-decrease').addEventListener('click', () => {
    change(() => {
        if (perSite(currentConfig())) extraBoxes = Math.max(0, extraBoxes - 1);
        else cameras = Math.max(1, cameras - 1);
    });
});
document.getElementById('unit-increase').addEventListener('click', () => {
    change(() => {
        if (perSite(currentConfig())) extraBoxes = Math.min(MAX_UNITS - locations, extraBoxes + 1);
        else cameras = Math.min(MAX_UNITS, cameras + 1);
    });
});
document.getElementById('add-button').addEventListener('click', () => {
    if (basket.length >= MAX_LINES) return;
    basket.push(currentLine());
    saveBasket();
    update();
    openCart();
});
document.getElementById('cart-link').addEventListener('click', openCart);
document.getElementById('to-checkout').addEventListener('click', openCheckout);
document.getElementById('back-to-cart').addEventListener('click', () => {
    showStep('cart');
    document.getElementById('to-checkout').focus();
});
document.getElementById('shop-more').addEventListener('click', () => dialog.close());
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
    step = 'cart';
    window.scrollTo({ top: 0 });
});
form.addEventListener('submit', submitOrder);

applyLanguage();
