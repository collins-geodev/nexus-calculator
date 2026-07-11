/* ==========================================
   NEXUS CALCULATOR - Smart AI Calculator
   ========================================== */

// ===== STATE MANAGEMENT =====
const state = {
    calculator: {
        currentValue: '0',
        expression: '',
        previousValue: null,
        operator: null,
        waitingForOperand: false,
        memory: 0,
        mode: 'standard',
        angleMode: 'DEG',
        history: [],
        programmerBase: 10,
        programmerValue: 0
    },
    settings: {
        sound: true,
        haptic: true,
        animations: true,
        liveRates: true,
        decimalPlaces: 4,
        voiceLang: 'en-US',
        theme: 'dark'
    },
    currency: {
        from: 'USD',
        to: 'EUR',
        amount: 1,
        rates: null,
        lastUpdate: null,
        presets: []
    },
    metric: {
        category: 'length',
        from: 'm',
        to: 'ft',
        amount: 1,
        presets: []
    },
    ovulation: {
        lastPeriod: null,
        cycleLength: 28,
        periodLength: 5,
        luteal: 14,
        monthsToPredict: 3,
        calStart: 1,
        irregular: false,
        shortest: 26,
        longest: 32,
        result: null,
        presets: []
    },
    loan: {
        amount: 500000,
        currency: 'NGN',
        rate: 15,
        rateType: 'annual',
        term: 24,
        termUnit: 'months',
        loanType: 'amortized',
        frequency: 'monthly',
        startDate: null,
        firstPayment: null,
        downPayment: 0,
        processingFee: 0,
        insurance: 0,
        extraPayment: 0,
        balloon: 0,
        grace: 0,
        compounding: 'monthly',
        result: null,
        presets: []
    },
    tax: {
        country: 'NG',
        year: 2026,
        currency: 'NGN',
        incomeType: 'salary',
        income: 800000,
        period: 'monthly',
        status: 'single',
        startMonth: 1,
        startDay: 1,
        endMonth: 12,
        endDay: 31,
        pension: 0,
        insurance: 0,
        reliefs: 0,
        deductions: 0,
        allowances: 0,
        credits: 0,
        payePaid: 0,
        whtPaid: 0,
        vat: 0,
        brackets: [],
        result: null,
        presets: []
    }
};

// ===== MONTHS / DAYS =====
const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];
const WEEKDAYS_SUN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WEEKDAYS_MON = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function daysInMonth(year, month0) {
    return new Date(year, month0 + 1, 0).getDate();
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// ===== COUNTRY TAX PRESETS =====
// Yearly progressive brackets in local currency. Tax laws change — users can edit.
const TAX_PRESETS = {
    NG: {
        name: 'Nigeria',
        currency: 'NGN',
        cra: { base: 200000, percentOfGross: 0.20 }, // Consolidated Relief Allowance
        brackets: [
            { min: 0, max: 300000, rate: 7 },
            { min: 300000, max: 600000, rate: 11 },
            { min: 600000, max: 1100000, rate: 15 },
            { min: 1100000, max: 1600000, rate: 19 },
            { min: 1600000, max: 3200000, rate: 21 },
            { min: 3200000, max: Infinity, rate: 24 }
        ]
    },
    US: {
        name: 'United States',
        currency: 'USD',
        cra: null,
        brackets: [
            { min: 0, max: 11600, rate: 10 },
            { min: 11600, max: 47150, rate: 12 },
            { min: 47150, max: 100525, rate: 22 },
            { min: 100525, max: 191950, rate: 24 },
            { min: 191950, max: 243725, rate: 32 },
            { min: 243725, max: 609350, rate: 35 },
            { min: 609350, max: Infinity, rate: 37 }
        ]
    },
    GB: {
        name: 'United Kingdom',
        currency: 'GBP',
        cra: { base: 12570, percentOfGross: 0 }, // Personal allowance
        brackets: [
            { min: 0, max: 37700, rate: 20 },
            { min: 37700, max: 125140, rate: 40 },
            { min: 125140, max: Infinity, rate: 45 }
        ]
    },
    CA: {
        name: 'Canada (Federal)',
        currency: 'CAD',
        cra: { base: 15705, percentOfGross: 0 },
        brackets: [
            { min: 0, max: 55867, rate: 15 },
            { min: 55867, max: 111733, rate: 20.5 },
            { min: 111733, max: 173205, rate: 26 },
            { min: 173205, max: 246752, rate: 29 },
            { min: 246752, max: Infinity, rate: 33 }
        ]
    },
    ZA: {
        name: 'South Africa',
        currency: 'ZAR',
        cra: { base: 17235, percentOfGross: 0 },
        brackets: [
            { min: 0, max: 237100, rate: 18 },
            { min: 237100, max: 370500, rate: 26 },
            { min: 370500, max: 512800, rate: 31 },
            { min: 512800, max: 673000, rate: 36 },
            { min: 673000, max: 857900, rate: 39 },
            { min: 857900, max: 1817000, rate: 41 },
            { min: 1817000, max: Infinity, rate: 45 }
        ]
    },
    GH: {
        name: 'Ghana',
        currency: 'GHS',
        cra: null,
        brackets: [
            { min: 0, max: 4824, rate: 0 },
            { min: 4824, max: 6444, rate: 5 },
            { min: 6444, max: 8364, rate: 10 },
            { min: 8364, max: 44724, rate: 17.5 },
            { min: 44724, max: 240444, rate: 25 },
            { min: 240444, max: 600000, rate: 30 },
            { min: 600000, max: Infinity, rate: 35 }
        ]
    },
    KE: {
        name: 'Kenya',
        currency: 'KES',
        cra: { base: 28800, percentOfGross: 0 },
        brackets: [
            { min: 0, max: 288000, rate: 10 },
            { min: 288000, max: 388000, rate: 25 },
            { min: 388000, max: 6000000, rate: 30 },
            { min: 6000000, max: 9600000, rate: 32.5 },
            { min: 9600000, max: Infinity, rate: 35 }
        ]
    },
    EU: {
        name: 'EU / Generic Template',
        currency: 'EUR',
        cra: null,
        brackets: [
            { min: 0, max: 10000, rate: 0 },
            { min: 10000, max: 30000, rate: 20 },
            { min: 30000, max: 80000, rate: 30 },
            { min: 80000, max: 250000, rate: 40 },
            { min: 250000, max: Infinity, rate: 45 }
        ]
    },
    CUSTOM: {
        name: 'Custom / Manual',
        currency: 'USD',
        cra: null,
        brackets: [
            { min: 0, max: 50000, rate: 10 },
            { min: 50000, max: Infinity, rate: 20 }
        ]
    }
};

// ===== CURRENCY DATA (60+ currencies) =====
const CURRENCIES = {
    USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸', rate: 1 },
    EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺', rate: 0.92 },
    GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧', rate: 0.79 },
    JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rate: 149.50 },
    CNY: { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', rate: 7.24 },
    AUD: { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rate: 1.53 },
    CAD: { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', rate: 1.36 },
    CHF: { name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', rate: 0.88 },
    HKD: { name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', rate: 7.82 },
    NZD: { name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', rate: 1.65 },
    SEK: { name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', rate: 10.55 },
    NOK: { name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', rate: 10.70 },
    DKK: { name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', rate: 6.85 },
    PLN: { name: 'Polish Złoty', symbol: 'zł', flag: '🇵🇱', rate: 4.02 },
    CZK: { name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', rate: 23.15 },
    HUF: { name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', rate: 358.50 },
    RON: { name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴', rate: 4.58 },
    BGN: { name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬', rate: 1.80 },
    HRK: { name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷', rate: 6.95 },
    ISK: { name: 'Icelandic Króna', symbol: 'kr', flag: '🇮🇸', rate: 139.20 },
    RUB: { name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', rate: 92.50 },
    TRY: { name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', rate: 32.15 },
    UAH: { name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦', rate: 39.80 },
    INR: { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', rate: 83.25 },
    KRW: { name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', rate: 1340.50 },
    SGD: { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rate: 1.34 },
    MYR: { name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', rate: 4.72 },
    THB: { name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', rate: 36.20 },
    IDR: { name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', rate: 15680 },
    PHP: { name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', rate: 56.30 },
    VND: { name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', rate: 24580 },
    TWD: { name: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', rate: 31.45 },
    PKR: { name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', rate: 278.50 },
    BDT: { name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩', rate: 109.80 },
    LKR: { name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰', rate: 318.20 },
    NPR: { name: 'Nepalese Rupee', symbol: '₨', flag: '🇳🇵', rate: 133.40 },
    MMK: { name: 'Myanmar Kyat', symbol: 'K', flag: '🇲🇲', rate: 2100 },
    KHR: { name: 'Cambodian Riel', symbol: '៛', flag: '🇰🇭', rate: 4080 },
    BRL: { name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', rate: 5.05 },
    MXN: { name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', rate: 17.15 },
    ARS: { name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', rate: 855.50 },
    CLP: { name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', rate: 945.20 },
    COP: { name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', rate: 3920 },
    PEN: { name: 'Peruvian Sol', symbol: 'S/', flag: '🇵🇪', rate: 3.72 },
    UYU: { name: 'Uruguayan Peso', symbol: '$U', flag: '🇺🇾', rate: 39.15 },
    VES: { name: 'Venezuelan Bolívar', symbol: 'Bs', flag: '🇻🇪', rate: 36.25 },
    ZAR: { name: 'South African Rand', symbol: 'R', flag: '🇿🇦', rate: 18.65 },
    EGP: { name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬', rate: 47.85 },
    NGN: { name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', rate: 1450 },
    KES: { name: 'Kenyan Shilling', symbol: 'Sh', flag: '🇰🇪', rate: 131.20 },
    GHS: { name: 'Ghanaian Cedi', symbol: '₵', flag: '🇬🇭', rate: 14.80 },
    MAD: { name: 'Moroccan Dirham', symbol: 'DH', flag: '🇲🇦', rate: 9.95 },
    TND: { name: 'Tunisian Dinar', symbol: 'DT', flag: '🇹🇳', rate: 3.12 },
    DZD: { name: 'Algerian Dinar', symbol: 'DA', flag: '🇩🇿', rate: 134.50 },
    ETB: { name: 'Ethiopian Birr', symbol: 'Br', flag: '🇪🇹', rate: 57.25 },
    UGX: { name: 'Ugandan Shilling', symbol: 'Sh', flag: '🇺🇬', rate: 3755 },
    TZS: { name: 'Tanzanian Shilling', symbol: 'Sh', flag: '🇹🇿', rate: 2520 },
    AED: { name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', rate: 3.67 },
    SAR: { name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', rate: 3.75 },
    QAR: { name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦', rate: 3.64 },
    KWD: { name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼', rate: 0.307 },
    BHD: { name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭', rate: 0.376 },
    OMR: { name: 'Omani Rial', symbol: '﷼', flag: '🇴🇲', rate: 0.385 },
    JOD: { name: 'Jordanian Dinar', symbol: 'JD', flag: '🇯🇴', rate: 0.709 },
    LBP: { name: 'Lebanese Pound', symbol: 'ل.ل', flag: '🇱🇧', rate: 89500 },
    ILS: { name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱', rate: 3.72 },
    IRR: { name: 'Iranian Rial', symbol: '﷼', flag: '🇮🇷', rate: 42000 },
    IQD: { name: 'Iraqi Dinar', symbol: 'ع.د', flag: '🇮🇶', rate: 1310 },
    KZT: { name: 'Kazakhstani Tenge', symbol: '₸', flag: '🇰🇿', rate: 448.20 },
    UZS: { name: 'Uzbekistani Som', symbol: 'лв', flag: '🇺🇿', rate: 12650 },
    BTC: { name: 'Bitcoin', symbol: '₿', flag: '₿', rate: 0.0000152 },
    ETH: { name: 'Ethereum', symbol: 'Ξ', flag: 'Ξ', rate: 0.000322 },
    XAU: { name: 'Gold (oz)', symbol: 'Au', flag: '🥇', rate: 0.000484 },
    XAG: { name: 'Silver (oz)', symbol: 'Ag', flag: '🥈', rate: 0.0413 }
};

// ===== METRIC CATEGORIES =====
const METRIC_CATEGORIES = {
    length: {
        name: 'Length',
        icon: '📏',
        units: {
            mm: { name: 'Millimeter', factor: 0.001 },
            cm: { name: 'Centimeter', factor: 0.01 },
            m: { name: 'Meter', factor: 1 },
            km: { name: 'Kilometer', factor: 1000 },
            in: { name: 'Inch', factor: 0.0254 },
            ft: { name: 'Foot', factor: 0.3048 },
            yd: { name: 'Yard', factor: 0.9144 },
            mi: { name: 'Mile', factor: 1609.344 },
            nmi: { name: 'Nautical Mile', factor: 1852 },
            ly: { name: 'Light Year', factor: 9.461e15 },
            au: { name: 'Astronomical Unit', factor: 1.496e11 },
            pc: { name: 'Parsec', factor: 3.086e16 },
            um: { name: 'Micrometer', factor: 1e-6 },
            nm: { name: 'Nanometer', factor: 1e-9 },
            angstrom: { name: 'Ångström', factor: 1e-10 },
            furlong: { name: 'Furlong', factor: 201.168 },
            chain: { name: 'Chain', factor: 20.1168 },
            rod: { name: 'Rod', factor: 5.0292 },
            fathom: { name: 'Fathom', factor: 1.8288 },
            league: { name: 'League', factor: 4828.032 }
        }
    },
    weight: {
        name: 'Weight',
        icon: '⚖️',
        units: {
            mg: { name: 'Milligram', factor: 1e-6 },
            g: { name: 'Gram', factor: 0.001 },
            kg: { name: 'Kilogram', factor: 1 },
            t: { name: 'Metric Ton', factor: 1000 },
            oz: { name: 'Ounce', factor: 0.0283495 },
            lb: { name: 'Pound', factor: 0.453592 },
            st: { name: 'Stone', factor: 6.35029 },
            ton_us: { name: 'US Ton', factor: 907.185 },
            ton_uk: { name: 'UK Ton', factor: 1016.05 },
            carat: { name: 'Carat', factor: 0.0002 },
            grain: { name: 'Grain', factor: 6.479891e-5 },
            dram: { name: 'Dram', factor: 0.00177185 },
            slug: { name: 'Slug', factor: 14.5939 },
            quintal: { name: 'Quintal', factor: 100 },
            troy_oz: { name: 'Troy Ounce', factor: 0.0311035 },
            troy_lb: { name: 'Troy Pound', factor: 0.373242 }
        }
    },
    temperature: {
        name: 'Temperature',
        icon: '🌡️',
        units: {
            C: { name: 'Celsius', factor: 1, special: true },
            F: { name: 'Fahrenheit', factor: 1, special: true },
            K: { name: 'Kelvin', factor: 1, special: true },
            R: { name: 'Rankine', factor: 1, special: true },
            Re: { name: 'Réaumur', factor: 1, special: true }
        }
    },
    volume: {
        name: 'Volume',
        icon: '🧪',
        units: {
            ml: { name: 'Milliliter', factor: 0.001 },
            l: { name: 'Liter', factor: 1 },
            m3: { name: 'Cubic Meter', factor: 1000 },
            cm3: { name: 'Cubic Centimeter', factor: 0.001 },
            mm3: { name: 'Cubic Millimeter', factor: 1e-6 },
            gal_us: { name: 'US Gallon', factor: 3.78541 },
            gal_uk: { name: 'UK Gallon', factor: 4.54609 },
            qt_us: { name: 'US Quart', factor: 0.946353 },
            qt_uk: { name: 'UK Quart', factor: 1.13652 },
            pt_us: { name: 'US Pint', factor: 0.473176 },
            pt_uk: { name: 'UK Pint', factor: 0.568261 },
            cup_us: { name: 'US Cup', factor: 0.236588 },
            cup_uk: { name: 'UK Cup', factor: 0.284131 },
            floz_us: { name: 'US Fluid Oz', factor: 0.0295735 },
            floz_uk: { name: 'UK Fluid Oz', factor: 0.0284131 },
            tbsp_us: { name: 'US Tablespoon', factor: 0.0147868 },
            tsp_us: { name: 'US Teaspoon', factor: 0.00492892 },
            barrel_oil: { name: 'Oil Barrel', factor: 158.987 },
            barrel_us: { name: 'US Barrel', factor: 119.24 },
            cubic_in: { name: 'Cubic Inch', factor: 0.0163871 },
            cubic_ft: { name: 'Cubic Foot', factor: 28.3168 },
            cubic_yd: { name: 'Cubic Yard', factor: 764.555 }
        }
    },
    area: {
        name: 'Area',
        icon: '⬜',
        units: {
            mm2: { name: 'Square Millimeter', factor: 1e-6 },
            cm2: { name: 'Square Centimeter', factor: 1e-4 },
            m2: { name: 'Square Meter', factor: 1 },
            km2: { name: 'Square Kilometer', factor: 1e6 },
            in2: { name: 'Square Inch', factor: 0.00064516 },
            ft2: { name: 'Square Foot', factor: 0.092903 },
            yd2: { name: 'Square Yard', factor: 0.836127 },
            mi2: { name: 'Square Mile', factor: 2.58999e6 },
            hectare: { name: 'Hectare', factor: 10000 },
            acre: { name: 'Acre', factor: 4046.86 },
            are: { name: 'Are', factor: 100 },
            rood: { name: 'Rood', factor: 1011.71 }
        }
    },
    speed: {
        name: 'Speed',
        icon: '🏎️',
        units: {
            ms: { name: 'Meter/Second', factor: 1 },
            kmh: { name: 'Kilometer/Hour', factor: 0.277778 },
            mph: { name: 'Mile/Hour', factor: 0.44704 },
            fps: { name: 'Foot/Second', factor: 0.3048 },
            knot: { name: 'Knot', factor: 0.514444 },
            mach: { name: 'Mach', factor: 343 },
            c: { name: 'Speed of Light', factor: 299792458 },
            kph: { name: 'Kilometer/Hour (alt)', factor: 0.277778 }
        }
    },
    time: {
        name: 'Time',
        icon: '⏱️',
        units: {
            ns: { name: 'Nanosecond', factor: 1e-9 },
            us: { name: 'Microsecond', factor: 1e-6 },
            ms: { name: 'Millisecond', factor: 0.001 },
            s: { name: 'Second', factor: 1 },
            min: { name: 'Minute', factor: 60 },
            h: { name: 'Hour', factor: 3600 },
            d: { name: 'Day', factor: 86400 },
            wk: { name: 'Week', factor: 604800 },
            mo: { name: 'Month', factor: 2628000 },
            yr: { name: 'Year', factor: 31536000 },
            decade: { name: 'Decade', factor: 315360000 },
            century: { name: 'Century', factor: 3153600000 },
            millennium: { name: 'Millennium', factor: 31536000000 }
        }
    },
    energy: {
        name: 'Energy',
        icon: '⚡',
        units: {
            J: { name: 'Joule', factor: 1 },
            kJ: { name: 'Kilojoule', factor: 1000 },
            MJ: { name: 'Megajoule', factor: 1e6 },
            cal: { name: 'Calorie', factor: 4.184 },
            kcal: { name: 'Kilocalorie', factor: 4184 },
            Wh: { name: 'Watt-hour', factor: 3600 },
            kWh: { name: 'Kilowatt-hour', factor: 3.6e6 },
            MWh: { name: 'Megawatt-hour', factor: 3.6e9 },
            BTU: { name: 'BTU', factor: 1055.06 },
            ftlb: { name: 'Foot-pound', factor: 1.35582 },
            eV: { name: 'Electron-volt', factor: 1.602e-19 },
            erg: { name: 'Erg', factor: 1e-7 },
            therm: { name: 'Therm', factor: 1.055e8 }
        }
    },
    pressure: {
        name: 'Pressure',
        icon: '💨',
        units: {
            Pa: { name: 'Pascal', factor: 1 },
            kPa: { name: 'Kilopascal', factor: 1000 },
            MPa: { name: 'Megapascal', factor: 1e6 },
            bar: { name: 'Bar', factor: 100000 },
            mbar: { name: 'Millibar', factor: 100 },
            psi: { name: 'PSI', factor: 6894.76 },
            atm: { name: 'Atmosphere', factor: 101325 },
            mmHg: { name: 'mmHg (Torr)', factor: 133.322 },
            inHg: { name: 'Inches Hg', factor: 3386.39 },
            inH2O: { name: 'Inches H2O', factor: 249.089 }
        }
    },
    data: {
        name: 'Data',
        icon: '💾',
        units: {
            bit: { name: 'Bit', factor: 0.125 },
            B: { name: 'Byte', factor: 1 },
            KB: { name: 'Kilobyte', factor: 1000 },
            MB: { name: 'Megabyte', factor: 1e6 },
            GB: { name: 'Gigabyte', factor: 1e9 },
            TB: { name: 'Terabyte', factor: 1e12 },
            PB: { name: 'Petabyte', factor: 1e15 },
            EB: { name: 'Exabyte', factor: 1e18 },
            KiB: { name: 'Kibibyte', factor: 1024 },
            MiB: { name: 'Mebibyte', factor: 1048576 },
            GiB: { name: 'Gibibyte', factor: 1073741824 },
            TiB: { name: 'Tebibyte', factor: 1.0995e12 }
        }
    },
    angle: {
        name: 'Angle',
        icon: '📐',
        units: {
            deg: { name: 'Degree', factor: 1 },
            rad: { name: 'Radian', factor: 57.2958 },
            grad: { name: 'Gradian', factor: 0.9 },
            turn: { name: 'Turn', factor: 360 },
            arcmin: { name: 'Arcminute', factor: 0.0166667 },
            arcsec: { name: 'Arcsecond', factor: 0.000277778 }
        }
    },
    frequency: {
        name: 'Frequency',
        icon: '📡',
        units: {
            Hz: { name: 'Hertz', factor: 1 },
            kHz: { name: 'Kilohertz', factor: 1000 },
            MHz: { name: 'Megahertz', factor: 1e6 },
            GHz: { name: 'Gigahertz', factor: 1e9 },
            THz: { name: 'Terahertz', factor: 1e12 },
            rpm: { name: 'RPM', factor: 1/60 }
        }
    },
    power: {
        name: 'Power',
        icon: '🔌',
        units: {
            W: { name: 'Watt', factor: 1 },
            kW: { name: 'Kilowatt', factor: 1000 },
            MW: { name: 'Megawatt', factor: 1e6 },
            GW: { name: 'Gigawatt', factor: 1e9 },
            hp: { name: 'Horsepower', factor: 745.7 },
            hp_metric: { name: 'Metric HP', factor: 735.5 },
            BTU_hr: { name: 'BTU/hour', factor: 0.293071 },
            ftlb_s: { name: 'Ft-lb/sec', factor: 1.35582 }
        }
    },
    fuel: {
        name: 'Fuel Economy',
        icon: '⛽',
        units: {
            mpg_us: { name: 'MPG (US)', factor: 1, special: true },
            mpg_uk: { name: 'MPG (UK)', factor: 1, special: true },
            km_l: { name: 'Km/Liter', factor: 1, special: true },
            l_100km: { name: 'L/100km', factor: 1, special: true }
        }
    },
    cooking: {
        name: 'Cooking',
        icon: '🍳',
        units: {
            tsp: { name: 'Teaspoon', factor: 4.92892 },
            tbsp: { name: 'Tablespoon', factor: 14.7868 },
            cup: { name: 'Cup', factor: 236.588 },
            pint: { name: 'Pint', factor: 473.176 },
            quart: { name: 'Quart', factor: 946.353 },
            ml: { name: 'Milliliter', factor: 1 },
            l: { name: 'Liter', factor: 1000 },
            floz: { name: 'Fluid Ounce', factor: 29.5735 },
            dash: { name: 'Dash', factor: 0.616115 },
            pinch: { name: 'Pinch', factor: 0.308058 }
        }
    }
};

// ===== STORAGE =====
const Storage = {
    save(key, data) {
        try {
            localStorage.setItem('nexus_' + key, JSON.stringify(data));
        } catch (e) { console.warn('Storage error:', e); }
    },
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem('nexus_' + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) { return defaultValue; }
    },
    remove(key) {
        try { localStorage.removeItem('nexus_' + key); } catch (e) {}
    },
    clearAll() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('nexus_'));
        keys.forEach(k => localStorage.removeItem(k));
    }
};

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlide 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ===== SOUND FEEDBACK =====
let audioCtx = null;
function playSound(frequency = 440, duration = 50, type = 'sine') {
    if (!state.settings.sound) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration/1000);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration/1000);
    } catch (e) {}
}

function hapticPulse(duration = 10) {
    if (!state.settings.haptic) return;
    if (navigator.vibrate) navigator.vibrate(duration);
}

// ===== CALCULATOR ENGINE =====
const Calculator = {
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        if (!isFinite(num)) return 'Error';
        const abs = Math.abs(num);
        if (abs !== 0 && (abs < 1e-10 || abs >= 1e16)) {
            return num.toExponential(state.settings.decimalPlaces);
        }
        const rounded = parseFloat(num.toPrecision(12));
        const str = rounded.toString();
        if (str.includes('.')) {
            const [intPart, decPart] = str.split('.');
            return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + decPart;
        }
        return str.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    unformat(str) {
        return parseFloat(String(str).replace(/,/g, ''));
    },

    evaluate(expression) {
        try {
            let expr = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-')
                .replace(/,/g, '');

            // Handle factorial
            expr = expr.replace(/(\d+(?:\.\d+)?)!/g, (_, n) => {
                return String(this.factorial(parseFloat(n)));
            });

            // Handle percentage
            expr = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

            // Validate
            if (!/^[\d+\-*/.()\s%Math.PIEeqrtlogsincatabpwxy!\^]+$/.test(expr)) {
                // Use Function for safer eval
            }

            const result = Function('"use strict"; return (' + expr + ')')();
            return result;
        } catch (e) {
            return NaN;
        }
    },

    factorial(n) {
        if (n < 0 || !Number.isInteger(n)) return NaN;
        if (n === 0 || n === 1) return 1;
        if (n > 170) return Infinity;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    },

    applyFunction(value, func) {
        const n = parseFloat(value);
        const rad = state.calculator.angleMode === 'DEG' ? n * Math.PI / 180 : n;
        switch (func) {
            case 'sin': return Math.sin(rad);
            case 'cos': return Math.cos(rad);
            case 'tan': return Math.tan(rad);
            case 'asin': return state.calculator.angleMode === 'DEG' ? Math.asin(n) * 180 / Math.PI : Math.asin(n);
            case 'acos': return state.calculator.angleMode === 'DEG' ? Math.acos(n) * 180 / Math.PI : Math.acos(n);
            case 'atan': return state.calculator.angleMode === 'DEG' ? Math.atan(n) * 180 / Math.PI : Math.atan(n);
            case 'log': return Math.log10(n);
            case 'ln': return Math.log(n);
            case 'sqrt': return Math.sqrt(n);
            case 'cbrt': return Math.cbrt(n);
            case 'exp': return Math.exp(n);
            case 'pow10': return Math.pow(10, n);
            case 'abs': return Math.abs(n);
            default: return n;
        }
    },

    updateDisplay() {
        const display = document.getElementById('display');
        const expression = document.getElementById('expression');
        const memIndicator = document.getElementById('memoryIndicator');

        display.textContent = state.calculator.currentValue;
        expression.textContent = state.calculator.expression;
        memIndicator.textContent = state.calculator.memory !== 0 ? 'M' : '';

        // Update programmer display
        if (state.calculator.mode === 'programmer') {
            this.updateProgrammerDisplay();
        }
    },

    updateProgrammerDisplay() {
        const val = Math.floor(this.unformat(state.calculator.currentValue) || 0);
        document.getElementById('hexDisplay').textContent = val.toString(16).toUpperCase();
        document.getElementById('decDisplay').textContent = val.toString(10);
        document.getElementById('octDisplay').textContent = val.toString(8);
        document.getElementById('binDisplay').textContent = val.toString(2);
    },

    handleAction(action, value = null) {
        hapticPulse();

        switch (action) {
            case 'number':
                if (state.calculator.currentValue === '0' || state.calculator.waitingForOperand) {
                    state.calculator.currentValue = value;
                    state.calculator.waitingForOperand = false;
                } else {
                    const raw = String(state.calculator.currentValue).replace(/,/g, '');
                    const newRaw = raw + value;
                    if (newRaw.length > 16) break;
                    if (newRaw.includes('.')) {
                        const [intPart, decPart] = newRaw.split('.');
                        const intNum = parseFloat(intPart) || 0;
                        state.calculator.currentValue = intNum.toLocaleString('en-US') + '.' + decPart;
                    } else {
                        state.calculator.currentValue = parseFloat(newRaw).toLocaleString('en-US');
                    }
                }
                playSound(600, 30);
                break;

            case 'decimal':
                if (state.calculator.waitingForOperand) {
                    state.calculator.currentValue = '0.';
                    state.calculator.waitingForOperand = false;
                } else if (!String(state.calculator.currentValue).includes('.')) {
                    state.calculator.currentValue = String(state.calculator.currentValue) + '.';
                }
                playSound(500, 30);
                break;

            case 'operator':
                this.handleOperator(value);
                playSound(450, 40);
                break;

            case 'equals':
                this.handleEquals();
                playSound(800, 80);
                break;

            case 'clear':
                state.calculator.currentValue = '0';
                state.calculator.expression = '';
                state.calculator.previousValue = null;
                state.calculator.operator = null;
                state.calculator.waitingForOperand = false;
                playSound(300, 50);
                break;

            case 'clear-entry':
                state.calculator.currentValue = '0';
                playSound(350, 40);
                break;

            case 'backspace':
                const curr = String(state.calculator.currentValue);
                if (curr.length > 1 && curr !== '0') {
                    state.calculator.currentValue = curr.slice(0, -1);
                } else {
                    state.calculator.currentValue = '0';
                }
                playSound(400, 30);
                break;

            case 'negate':
                const n = this.unformat(state.calculator.currentValue);
                state.calculator.currentValue = this.formatNumber(-n);
                break;

            case 'percent':
                const p = this.unformat(state.calculator.currentValue) / 100;
                state.calculator.currentValue = this.formatNumber(p);
                break;

            case 'sqrt':
                const sq = Math.sqrt(this.unformat(state.calculator.currentValue));
                state.calculator.expression = `√(${state.calculator.currentValue})`;
                state.calculator.currentValue = this.formatNumber(sq);
                this.addHistory(state.calculator.expression, state.calculator.currentValue);
                break;

            case 'square':
                const sq2 = Math.pow(this.unformat(state.calculator.currentValue), 2);
                state.calculator.expression = `(${state.calculator.currentValue})²`;
                state.calculator.currentValue = this.formatNumber(sq2);
                this.addHistory(state.calculator.expression, state.calculator.currentValue);
                break;

            case 'reciprocal':
                const rec = 1 / this.unformat(state.calculator.currentValue);
                state.calculator.expression = `1/(${state.calculator.currentValue})`;
                state.calculator.currentValue = this.formatNumber(rec);
                this.addHistory(state.calculator.expression, state.calculator.currentValue);
                break;

            case 'factorial':
                const f = this.factorial(this.unformat(state.calculator.currentValue));
                state.calculator.expression = `${state.calculator.currentValue}!`;
                state.calculator.currentValue = this.formatNumber(f);
                this.addHistory(state.calculator.expression, state.calculator.currentValue);
                break;

            case 'function':
                const fResult = this.applyFunction(this.unformat(state.calculator.currentValue), value);
                state.calculator.expression = `${value}(${state.calculator.currentValue})`;
                state.calculator.currentValue = this.formatNumber(fResult);
                this.addHistory(state.calculator.expression, state.calculator.currentValue);
                break;

            case 'constant':
                state.calculator.currentValue = this.formatNumber(eval(value));
                state.calculator.waitingForOperand = true;
                break;

            case 'power':
                state.calculator.previousValue = this.unformat(state.calculator.currentValue);
                state.calculator.operator = '**';
                state.calculator.expression = `${state.calculator.currentValue}^`;
                state.calculator.waitingForOperand = true;
                break;

            case 'memory-clear':
                state.calculator.memory = 0;
                showToast('Memory cleared', 'info', 1500);
                break;

            case 'memory-recall':
                state.calculator.currentValue = this.formatNumber(state.calculator.memory);
                state.calculator.waitingForOperand = true;
                break;

            case 'memory-store':
                state.calculator.memory = this.unformat(state.calculator.currentValue);
                showToast('Stored in memory', 'success', 1500);
                break;

            case 'memory-add':
                state.calculator.memory += this.unformat(state.calculator.currentValue);
                showToast('Added to memory', 'success', 1500);
                break;

            case 'memory-subtract':
                state.calculator.memory -= this.unformat(state.calculator.currentValue);
                showToast('Subtracted from memory', 'success', 1500);
                break;

            case 'rad-deg':
                state.calculator.angleMode = state.calculator.angleMode === 'DEG' ? 'RAD' : 'DEG';
                document.getElementById('angleMode').textContent = state.calculator.angleMode;
                showToast(`Angle mode: ${state.calculator.angleMode}`, 'info', 1500);
                break;

            case 'paren-open':
                state.calculator.currentValue = state.calculator.currentValue === '0' ? '(' : state.calculator.currentValue + '(';
                break;

            case 'paren-close':
                state.calculator.currentValue = state.calculator.currentValue + ')';
                break;

            case 'parenthesis':
                // Auto paren toggle
                const s = String(state.calculator.currentValue);
                const opens = (s.match(/\(/g) || []).length;
                const closes = (s.match(/\)/g) || []).length;
                if (opens > closes) {
                    state.calculator.currentValue += ')';
                } else {
                    state.calculator.currentValue = s === '0' ? '(' : s + '(';
                }
                break;

            case 'bitwise':
                this.handleBitwise(value);
                break;

            case 'hex':
                if (state.calculator.programmerBase === 16) {
                    if (state.calculator.currentValue === '0') {
                        state.calculator.currentValue = value;
                    } else {
                        state.calculator.currentValue += value;
                    }
                }
                break;
        }

        this.updateDisplay();
    },

    handleOperator(op) {
        const current = this.unformat(state.calculator.currentValue);
        if (state.calculator.previousValue !== null && !state.calculator.waitingForOperand) {
            this.handleEquals(true);
        } else {
            state.calculator.previousValue = current;
        }
        state.calculator.operator = op;
        state.calculator.waitingForOperand = true;
        state.calculator.expression = `${this.formatNumber(state.calculator.previousValue)} ${this.getOpSymbol(op)}`;
    },

    getOpSymbol(op) {
        const map = { '+': '+', '-': '−', '*': '×', '/': '÷', '%': 'mod', '**': '^' };
        return map[op] || op;
    },

    handleEquals(chained = false) {
        if (state.calculator.operator === null || state.calculator.previousValue === null) return;
        const current = this.unformat(state.calculator.currentValue);
        let result;

        switch (state.calculator.operator) {
            case '+': result = state.calculator.previousValue + current; break;
            case '-': result = state.calculator.previousValue - current; break;
            case '*': result = state.calculator.previousValue * current; break;
            case '/':
                if (current === 0) {
                    state.calculator.currentValue = 'Error: Division by zero';
                    document.getElementById('display').classList.add('error');
                    setTimeout(() => document.getElementById('display').classList.remove('error'), 2000);
                    state.calculator.operator = null;
                    state.calculator.previousValue = null;
                    return;
                }
                result = state.calculator.previousValue / current; break;
            case '%': result = state.calculator.previousValue % current; break;
            case '**': result = Math.pow(state.calculator.previousValue, current); break;
        }

        const expr = `${this.formatNumber(state.calculator.previousValue)} ${this.getOpSymbol(state.calculator.operator)} ${this.formatNumber(current)}`;

        if (!chained) {
            this.addHistory(expr, this.formatNumber(result));
            state.calculator.expression = expr + ' =';
        }

        state.calculator.currentValue = this.formatNumber(result);
        state.calculator.previousValue = chained ? result : null;
        state.calculator.operator = chained ? state.calculator.operator : null;
        state.calculator.waitingForOperand = true;
    },

    handleBitwise(op) {
        const current = Math.floor(this.unformat(state.calculator.currentValue));
        if (op === 'NOT') {
            state.calculator.currentValue = String(~current);
            return;
        }
        if (state.calculator.previousValue !== null && !state.calculator.waitingForOperand) {
            // compute
        }
        state.calculator.previousValue = current;
        state.calculator.operator = op;
        state.calculator.waitingForOperand = true;
    },

    addHistory(expression, result) {
        state.calculator.history.unshift({
            expression,
            result,
            timestamp: Date.now()
        });
        if (state.calculator.history.length > 100) state.calculator.history.pop();
        Storage.save('history', state.calculator.history);
        this.renderHistory();
    },

    renderHistory() {
        const list = document.getElementById('historyList');
        if (state.calculator.history.length === 0) {
            list.innerHTML = '<div class="history-empty">No calculations yet</div>';
            return;
        }
        list.innerHTML = state.calculator.history.map((item, i) => `
            <div class="history-item" data-index="${i}">
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">${item.result}</div>
            </div>
        `).join('');

        list.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.index);
                state.calculator.currentValue = state.calculator.history[idx].result;
                state.calculator.waitingForOperand = true;
                this.updateDisplay();
                showToast('Result loaded', 'success', 1200);
            });
        });
    },

    clearHistory() {
        state.calculator.history = [];
        Storage.save('history', []);
        this.renderHistory();
        showToast('History cleared', 'info', 1500);
    }
};

// ===== CURRENCY CONVERTER =====
const Currency = {
    init() {
        this.populateSelects();
        this.renderRates();
        this.renderPresets();
        this.convert();
        this.bindEvents();

        if (state.settings.liveRates) {
            this.fetchLiveRates();
        }
    },

    populateSelects() {
        const fromSel = document.getElementById('currencyFrom');
        const toSel = document.getElementById('currencyTo');
        const options = Object.entries(CURRENCIES).map(([code, data]) =>
            `<option value="${code}">${data.flag} ${code} - ${data.name}</option>`
        ).join('');
        fromSel.innerHTML = options;
        toSel.innerHTML = options;
        fromSel.value = state.currency.from;
        toSel.value = state.currency.to;
    },

    convert() {
        const amount = parseFloat(document.getElementById('currencyFromAmount').value) || 0;
        const from = document.getElementById('currencyFrom').value;
        const to = document.getElementById('currencyTo').value;

        const rates = state.currency.rates || CURRENCIES;
        const fromRate = rates[from]?.rate || CURRENCIES[from].rate;
        const toRate = rates[to]?.rate || CURRENCIES[to].rate;

        const usdAmount = amount / fromRate;
        const result = usdAmount * toRate;

        document.getElementById('currencyToAmount').value = result.toFixed(state.settings.decimalPlaces);

        const rateDisplay = document.getElementById('exchangeRate');
        const singleRate = (1 / fromRate) * toRate;
        rateDisplay.innerHTML = `
            <strong>1 ${from}</strong> = <strong>${singleRate.toFixed(state.settings.decimalPlaces)} ${to}</strong>
            <br>
            <span style="color: var(--text-muted); font-size: 11px;">
                ${CURRENCIES[from].symbol}${amount.toLocaleString()} → ${CURRENCIES[to].symbol}${result.toLocaleString(undefined, {maximumFractionDigits: state.settings.decimalPlaces})}
            </span>
        `;

        state.currency.from = from;
        state.currency.to = to;
        state.currency.amount = amount;
    },

    convertReverse() {
        const amount = parseFloat(document.getElementById('currencyToAmount').value) || 0;
        const from = document.getElementById('currencyFrom').value;
        const to = document.getElementById('currencyTo').value;

        const rates = state.currency.rates || CURRENCIES;
        const fromRate = rates[from]?.rate || CURRENCIES[from].rate;
        const toRate = rates[to]?.rate || CURRENCIES[to].rate;

        const usdAmount = amount / toRate;
        const result = usdAmount * fromRate;

        document.getElementById('currencyFromAmount').value = result.toFixed(state.settings.decimalPlaces);
        this.convert();
    },

    swap() {
        const fromSel = document.getElementById('currencyFrom');
        const toSel = document.getElementById('currencyTo');
        [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
        this.convert();

        // Animate swap
        document.getElementById('currencySwap').style.animation = 'none';
        requestAnimationFrame(() => {
            document.getElementById('currencySwap').style.animation = 'btnPress 0.4s ease';
        });
    },

    renderRates() {
        const grid = document.getElementById('ratesGrid');
        const popular = ['EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'INR', 'KRW', 'CHF', 'SGD', 'MXN', 'BRL'];
        grid.innerHTML = popular.map(code => `
            <div class="rate-card" data-code="${code}">
                <div class="rate-card-top">
                    <span class="rate-flag">${CURRENCIES[code].flag} ${CURRENCIES[code].name}</span>
                    <span class="rate-code">${code}</span>
                </div>
                <div class="rate-value">${CURRENCIES[code].symbol}${CURRENCIES[code].rate.toFixed(4)}</div>
            </div>
        `).join('');

        grid.querySelectorAll('.rate-card').forEach(card => {
            card.addEventListener('click', () => {
                document.getElementById('currencyTo').value = card.dataset.code;
                this.convert();
            });
        });
    },

    savePreset() {
        const preset = {
            id: Date.now(),
            from: state.currency.from,
            to: state.currency.to,
            amount: state.currency.amount,
            name: `${state.currency.amount} ${state.currency.from} → ${state.currency.to}`
        };
        state.currency.presets.unshift(preset);
        if (state.currency.presets.length > 20) state.currency.presets.pop();
        Storage.save('currencyPresets', state.currency.presets);
        this.renderPresets();
        showToast('Preset saved', 'success', 1500);
    },

    renderPresets() {
        const list = document.getElementById('currencyPresets');
        if (state.currency.presets.length === 0) {
            list.innerHTML = '<div class="presets-empty">No presets yet. Save your favorite conversions!</div>';
            return;
        }
        list.innerHTML = state.currency.presets.map(p => `
            <div class="preset-chip" data-id="${p.id}">
                <span>${CURRENCIES[p.from].flag} ${p.name}</span>
                <button class="remove-preset" data-id="${p.id}">×</button>
            </div>
        `).join('');

        list.querySelectorAll('.preset-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-preset')) return;
                const id = parseInt(chip.dataset.id);
                const preset = state.currency.presets.find(p => p.id === id);
                if (preset) {
                    document.getElementById('currencyFrom').value = preset.from;
                    document.getElementById('currencyTo').value = preset.to;
                    document.getElementById('currencyFromAmount').value = preset.amount;
                    this.convert();
                }
            });
        });

        list.querySelectorAll('.remove-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                state.currency.presets = state.currency.presets.filter(p => p.id !== id);
                Storage.save('currencyPresets', state.currency.presets);
                this.renderPresets();
                showToast('Preset removed', 'info', 1200);
            });
        });
    },

    async fetchLiveRates() {
        document.getElementById('rateStatus').textContent = 'Fetching...';
        try {
            const res = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await res.json();
            if (data.rates) {
                state.currency.rates = {};
                Object.entries(data.rates).forEach(([code, rate]) => {
                    if (CURRENCIES[code]) {
                        state.currency.rates[code] = { ...CURRENCIES[code], rate };
                    }
                });
                state.currency.lastUpdate = new Date();
                document.getElementById('rateStatus').textContent = 'Live';
                document.getElementById('rateStatus').style.color = 'var(--accent-success)';
                this.convert();
                this.renderRates();
                showToast('Live rates updated', 'success', 2000);
            }
        } catch (e) {
            document.getElementById('rateStatus').textContent = 'Offline';
            document.getElementById('rateStatus').style.color = 'var(--accent-warning)';
            showToast('Using static rates (offline)', 'warning', 2000);
        }
    },

    bindEvents() {
        document.getElementById('currencyFromAmount').addEventListener('input', () => this.convert());
        document.getElementById('currencyToAmount').addEventListener('input', () => this.convertReverse());
        document.getElementById('currencyFrom').addEventListener('change', () => this.convert());
        document.getElementById('currencyTo').addEventListener('change', () => this.convert());
        document.getElementById('currencySwap').addEventListener('click', () => this.swap());
        document.getElementById('saveCurrencyPreset').addEventListener('click', () => this.savePreset());
        document.getElementById('refreshRatesBtn').addEventListener('click', () => this.fetchLiveRates());

        document.querySelectorAll('#currency-mode .quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('currencyFromAmount').value = btn.dataset.amount;
                this.convert();
            });
        });
    }
};

// ===== METRIC CONVERTER =====
const Metric = {
    init() {
        this.renderCategoryTabs();
        this.populateUnits();
        this.renderPresets();
        this.convert();
        this.bindEvents();
    },

    renderCategoryTabs() {
        const tabs = document.getElementById('categoryTabs');
        tabs.innerHTML = Object.entries(METRIC_CATEGORIES).map(([key, cat]) => `
            <button class="category-tab ${key === state.metric.category ? 'active' : ''}" data-category="${key}">
                <span>${cat.icon}</span>
                <span>${cat.name}</span>
            </button>
        `).join('');

        tabs.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.metric.category = tab.dataset.category;
                this.populateUnits();
                this.convert();
            });
        });
    },

    populateUnits() {
        const category = METRIC_CATEGORIES[state.metric.category];
        const units = Object.entries(category.units);
        const options = units.map(([key, unit]) =>
            `<option value="${key}">${unit.name} (${key})</option>`
        ).join('');

        const fromSel = document.getElementById('metricFrom');
        const toSel = document.getElementById('metricTo');
        fromSel.innerHTML = options;
        toSel.innerHTML = options;

        // Set defaults per category
        const defaults = {
            length: ['m', 'ft'],
            weight: ['kg', 'lb'],
            temperature: ['C', 'F'],
            volume: ['l', 'gal_us'],
            area: ['m2', 'ft2'],
            speed: ['kmh', 'mph'],
            time: ['h', 'min'],
            energy: ['J', 'cal'],
            pressure: ['Pa', 'psi'],
            data: ['MB', 'GB'],
            angle: ['deg', 'rad'],
            frequency: ['Hz', 'kHz'],
            power: ['W', 'hp'],
            fuel: ['mpg_us', 'l_100km'],
            cooking: ['cup', 'ml']
        };
        const [defFrom, defTo] = defaults[state.metric.category] || [units[0][0], units[1]?.[0] || units[0][0]];
        fromSel.value = defFrom;
        toSel.value = defTo;
        state.metric.from = defFrom;
        state.metric.to = defTo;
    },

    convertTemperature(value, from, to) {
        let celsius;
        switch (from) {
            case 'C': celsius = value; break;
            case 'F': celsius = (value - 32) * 5/9; break;
            case 'K': celsius = value - 273.15; break;
            case 'R': celsius = (value - 491.67) * 5/9; break;
            case 'Re': celsius = value * 1.25; break;
        }
        switch (to) {
            case 'C': return celsius;
            case 'F': return celsius * 9/5 + 32;
            case 'K': return celsius + 273.15;
            case 'R': return (celsius + 273.15) * 9/5;
            case 'Re': return celsius * 0.8;
        }
    },

    convertFuel(value, from, to) {
        if (from === to) return value;
        // Convert all to L/100km first
        let l100km;
        switch (from) {
            case 'mpg_us': l100km = 235.215 / value; break;
            case 'mpg_uk': l100km = 282.481 / value; break;
            case 'km_l': l100km = 100 / value; break;
            case 'l_100km': l100km = value; break;
        }
        switch (to) {
            case 'mpg_us': return 235.215 / l100km;
            case 'mpg_uk': return 282.481 / l100km;
            case 'km_l': return 100 / l100km;
            case 'l_100km': return l100km;
        }
    },

    convert() {
        const amount = parseFloat(document.getElementById('metricFromAmount').value) || 0;
        const from = document.getElementById('metricFrom').value;
        const to = document.getElementById('metricTo').value;
        const category = METRIC_CATEGORIES[state.metric.category];

        let result;
        if (state.metric.category === 'temperature') {
            result = this.convertTemperature(amount, from, to);
        } else if (state.metric.category === 'fuel') {
            result = this.convertFuel(amount, from, to);
        } else {
            const fromFactor = category.units[from].factor;
            const toFactor = category.units[to].factor;
            result = (amount * fromFactor) / toFactor;
        }

        document.getElementById('metricToAmount').value = result.toFixed(state.settings.decimalPlaces);

        const formula = document.getElementById('conversionFormula');
        formula.innerHTML = `
            <strong>${amount} ${category.units[from].name}</strong> =
            <strong>${result.toFixed(state.settings.decimalPlaces)} ${category.units[to].name}</strong>
        `;

        state.metric.from = from;
        state.metric.to = to;
        state.metric.amount = amount;

        this.renderAllConversions(amount, from);
    },

    convertReverse() {
        const amount = parseFloat(document.getElementById('metricToAmount').value) || 0;
        const from = document.getElementById('metricFrom').value;
        const to = document.getElementById('metricTo').value;
        const category = METRIC_CATEGORIES[state.metric.category];

        let result;
        if (state.metric.category === 'temperature') {
            result = this.convertTemperature(amount, to, from);
        } else if (state.metric.category === 'fuel') {
            result = this.convertFuel(amount, to, from);
        } else {
            const fromFactor = category.units[from].factor;
            const toFactor = category.units[to].factor;
            result = (amount * toFactor) / fromFactor;
        }

        document.getElementById('metricFromAmount').value = result.toFixed(state.settings.decimalPlaces);
        this.convert();
    },

    swap() {
        const fromSel = document.getElementById('metricFrom');
        const toSel = document.getElementById('metricTo');
        [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
        this.convert();
    },

    renderAllConversions(amount, from) {
        const grid = document.getElementById('conversionsGrid');
        const category = METRIC_CATEGORIES[state.metric.category];
        const units = Object.entries(category.units).filter(([k]) => k !== from);

        grid.innerHTML = units.map(([key, unit]) => {
            let result;
            if (state.metric.category === 'temperature') {
                result = this.convertTemperature(amount, from, key);
            } else if (state.metric.category === 'fuel') {
                result = this.convertFuel(amount, from, key);
            } else {
                const fromFactor = category.units[from].factor;
                const toFactor = unit.factor;
                result = (amount * fromFactor) / toFactor;
            }
            return `
                <div class="conversion-card" data-unit="${key}">
                    <div class="conversion-card-top">
                        <span class="unit-name">${unit.name}</span>
                        <span class="rate-code">${key}</span>
                    </div>
                    <div class="conversion-value">${this.formatResult(result)}</div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.conversion-card').forEach(card => {
            card.addEventListener('click', () => {
                document.getElementById('metricTo').value = card.dataset.unit;
                this.convert();
            });
        });
    },

    formatResult(num) {
        if (!isFinite(num)) return '∞';
        const abs = Math.abs(num);
        if (abs !== 0 && (abs < 1e-4 || abs >= 1e10)) {
            return num.toExponential(3);
        }
        return parseFloat(num.toPrecision(8)).toLocaleString(undefined, {
            maximumFractionDigits: state.settings.decimalPlaces
        });
    },

    savePreset() {
        const preset = {
            id: Date.now(),
            category: state.metric.category,
            from: state.metric.from,
            to: state.metric.to,
            amount: state.metric.amount,
            name: `${state.metric.amount} ${state.metric.from} → ${state.metric.to}`
        };
        state.metric.presets.unshift(preset);
        if (state.metric.presets.length > 20) state.metric.presets.pop();
        Storage.save('metricPresets', state.metric.presets);
        this.renderPresets();
        showToast('Preset saved', 'success', 1500);
    },

    renderPresets() {
        const list = document.getElementById('metricPresets');
        if (state.metric.presets.length === 0) {
            list.innerHTML = '<div class="presets-empty">No presets yet. Save your favorite conversions!</div>';
            return;
        }
        list.innerHTML = state.metric.presets.map(p => `
            <div class="preset-chip" data-id="${p.id}">
                <span>${METRIC_CATEGORIES[p.category].icon} ${p.name}</span>
                <button class="remove-preset" data-id="${p.id}">×</button>
            </div>
        `).join('');

        list.querySelectorAll('.preset-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-preset')) return;
                const id = parseInt(chip.dataset.id);
                const preset = state.metric.presets.find(p => p.id === id);
                if (preset) {
                    state.metric.category = preset.category;
                    this.renderCategoryTabs();
                    this.populateUnits();
                    document.getElementById('metricFrom').value = preset.from;
                    document.getElementById('metricTo').value = preset.to;
                    document.getElementById('metricFromAmount').value = preset.amount;
                    this.convert();
                }
            });
        });

        list.querySelectorAll('.remove-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                state.metric.presets = state.metric.presets.filter(p => p.id !== id);
                Storage.save('metricPresets', state.metric.presets);
                this.renderPresets();
                showToast('Preset removed', 'info', 1200);
            });
        });
    },

    bindEvents() {
        document.getElementById('metricFromAmount').addEventListener('input', () => this.convert());
        document.getElementById('metricToAmount').addEventListener('input', () => this.convertReverse());
        document.getElementById('metricFrom').addEventListener('change', () => this.convert());
        document.getElementById('metricTo').addEventListener('change', () => this.convert());
        document.getElementById('metricSwap').addEventListener('click', () => this.swap());
        document.getElementById('saveMetricPreset').addEventListener('click', () => this.savePreset());
    }
};

// ===== AI ASSISTANT =====
const AI = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const input = document.getElementById('aiInput');
        const send = document.getElementById('aiSend');

        send.addEventListener('click', () => this.processQuery(input.value));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.processQuery(input.value);
        });

        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                input.value = chip.dataset.query;
                this.processQuery(chip.dataset.query);
            });
        });

        document.getElementById('aiVoiceBtn').addEventListener('click', () => {
            Voice.start((transcript) => {
                input.value = transcript;
                this.processQuery(transcript);
            });
        });
    },

    addMessage(role, content, result = null) {
        const chat = document.getElementById('aiChat');
        const msg = document.createElement('div');
        msg.className = `ai-message ai-${role}`;

        const avatar = role === 'user' ? 'You' : 'AI';
        let bubble = `<div class="ai-avatar">${avatar}</div><div class="ai-bubble">${content}`;
        if (result !== null) bubble += `<div class="ai-result">${result}</div>`;
        bubble += '</div>';

        msg.innerHTML = bubble;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    },

    showTyping() {
        const chat = document.getElementById('aiChat');
        const msg = document.createElement('div');
        msg.className = 'ai-message ai-bot';
        msg.id = 'aiTyping';
        msg.innerHTML = `<div class="ai-avatar">AI</div><div class="ai-bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div>`;
        chat.appendChild(msg);
        chat.scrollTop = chat.scrollHeight;
    },

    hideTyping() {
        const typing = document.getElementById('aiTyping');
        if (typing) typing.remove();
    },

    async processQuery(query) {
        if (!query.trim()) return;
        document.getElementById('aiInput').value = '';
        this.addMessage('user', query);
        this.showTyping();

        await new Promise(r => setTimeout(r, 600));
        this.hideTyping();

        const response = this.analyze(query);
        this.addMessage('bot', response.message, response.result);
    },

    analyze(query) {
        const q = query.toLowerCase().trim();

        // Loan calculator
        const loanMatch = q.match(/(?:loan|repayment|mortgage).*?(?:of\s+|for\s+)?[₦$€£¥]?\s*([\d,]+\.?\d*)[a-z]?\s*(?:over|for|across)?\s*(\d+)\s*(month|year|week|day)s?\s*(?:at|@)\s*(\d+\.?\d*)\s*%?/i);
        if (loanMatch) {
            const amount = parseFloat(loanMatch[1].replace(/,/g, ''));
            const term = parseInt(loanMatch[2]);
            const unit = loanMatch[3].toLowerCase() + 's';
            const rate = parseFloat(loanMatch[4]);
            const currency = this.detectCurrencyInQuery(q) || 'NGN';
            const r = Loan.quickCalc(amount, rate, term, unit, currency);
            const sym = CURRENCIES[currency]?.symbol || '';
            return {
                message: `Loan estimate: ${sym}${amount.toLocaleString()} over ${term} ${unit} at ${rate}% annual (amortized).<br>Open the <em>Loan</em> tab for the full schedule and chart.`,
                result: `Monthly: ${sym}${r.payment.toLocaleString(undefined, { maximumFractionDigits: 2 })} | Total interest: ${sym}${r.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })} | Total repayment: ${sym}${r.totalRepayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            };
        }

        // Loan comparison
        const compareMatch = q.match(/compare.*?(\d+)\s*(month|year)s?.*?(?:and|vs|versus)\s*(\d+)\s*(month|year)s?/i);
        if (compareMatch && /loan/.test(q)) {
            const amountMatch = q.match(/[₦$€£¥]?\s*([\d,]+\.?\d*)/);
            const rateMatch = q.match(/(\d+\.?\d*)\s*%/);
            const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 100000;
            const rate = rateMatch ? parseFloat(rateMatch[1]) : 15;
            const t1 = parseInt(compareMatch[1]);
            const u1 = compareMatch[2].toLowerCase() + 's';
            const t2 = parseInt(compareMatch[3]);
            const u2 = compareMatch[4].toLowerCase() + 's';
            const currency = this.detectCurrencyInQuery(q) || 'USD';
            const r1 = Loan.quickCalc(amount, rate, t1, u1, currency);
            const r2 = Loan.quickCalc(amount, rate, t2, u2, currency);
            const sym = CURRENCIES[currency]?.symbol || '';
            return {
                message: `Comparing two loan terms for ${sym}${amount.toLocaleString()} at ${rate}%:`,
                result: `${t1} ${u1}: payment ${sym}${r1.payment.toFixed(2)}, total ${sym}${r1.totalRepayment.toFixed(2)} | ${t2} ${u2}: payment ${sym}${r2.payment.toFixed(2)}, total ${sym}${r2.totalRepayment.toFixed(2)}`
            };
        }

        // Ovulation
        const ovMatch = q.match(/(?:ovulation|fertile|cycle|period).*?(?:start(?:ed)?|on|from)?\s*([a-z]+\s+\d{1,2}(?:,?\s*\d{4})?)/i);
        if (ovMatch && /(?:ovulation|fertile|cycle|period|pregnant)/.test(q)) {
            const cycleMatch = q.match(/cycle\s+(?:is\s+|of\s+)?(\d+)/);
            const dateStr = ovMatch[1];
            const date = this.parseFlexibleDate(dateStr);
            if (date) {
                const cycle = cycleMatch ? parseInt(cycleMatch[1]) : 28;
                const ovulation = new Date(date);
                ovulation.setDate(ovulation.getDate() + (cycle - 14));
                const fertileStart = new Date(ovulation);
                fertileStart.setDate(fertileStart.getDate() - 5);
                const fertileEnd = new Date(ovulation);
                fertileEnd.setDate(fertileEnd.getDate() + 1);
                const nextPeriod = new Date(date);
                nextPeriod.setDate(nextPeriod.getDate() + cycle);
                const fmt = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                return {
                    message: `Based on a ${cycle}-day cycle from last period ${fmt(date)}:<br><em>Disclaimer: estimate only — not medical advice.</em>`,
                    result: `Ovulation: ${fmt(ovulation)} | Fertile window: ${fmt(fertileStart)} → ${fmt(fertileEnd)} | Next period: ${fmt(nextPeriod)}`
                };
            }
        }

        // Tax estimate
        const taxMatch = q.match(/(?:tax|paye).*?(?:if\s+i\s+earn\s+|on\s+|for\s+|of\s+)[₦$€£¥]?\s*([\d,]+\.?\d*)\s*(monthly|yearly|annual|per\s+month|per\s+year|month|year)?/i);
        if (taxMatch && /(?:tax|paye|payable|after\s+tax|net\s+income)/.test(q)) {
            const amount = parseFloat(taxMatch[1].replace(/,/g, ''));
            const periodWord = (taxMatch[2] || 'monthly').toLowerCase();
            const monthly = /month/.test(periodWord);
            const yearly = monthly ? amount * 12 : amount;
            let country = 'NG';
            if (/(united\s*states|usa|us\b|america)/.test(q)) country = 'US';
            else if (/(united\s*kingdom|uk\b|britain)/.test(q)) country = 'GB';
            else if (/canada/.test(q)) country = 'CA';
            else if (/(south\s*africa|sa\b)/.test(q)) country = 'ZA';
            else if (/ghana/.test(q)) country = 'GH';
            else if (/kenya/.test(q)) country = 'KE';
            else if (/nigeria/.test(q)) country = 'NG';
            const r = Tax.quickCalc(yearly, country);
            const sym = CURRENCIES[r.currency]?.symbol || '';
            return {
                message: `Estimate for ${TAX_PRESETS[country].name} on ${sym}${yearly.toLocaleString()} yearly (${monthly ? 'derived from monthly' : 'yearly input'}).<br><em>Disclaimer: estimate only — verify with a tax professional.</em>`,
                result: `Tax: ${sym}${r.tax.toLocaleString(undefined, { maximumFractionDigits: 2 })} | Net: ${sym}${r.net.toLocaleString(undefined, { maximumFractionDigits: 2 })} | Effective: ${r.effective.toFixed(2)}%`
            };
        }

        // Net income / after tax
        if (/(?:net\s*(?:income|pay|salary)|after\s*tax)/.test(q)) {
            const amtMatch = q.match(/[₦$€£¥]?\s*([\d,]+\.?\d*)/);
            if (amtMatch) {
                const amount = parseFloat(amtMatch[1].replace(/,/g, ''));
                const monthly = /month/.test(q);
                const yearly = monthly ? amount * 12 : amount;
                const r = Tax.quickCalc(yearly, 'NG');
                const sym = CURRENCIES[r.currency]?.symbol || '';
                return {
                    message: `Net income calculation (Nigeria preset, edit in Tax tab for other countries):`,
                    result: `Yearly Net: ${sym}${r.net.toLocaleString(undefined, { maximumFractionDigits: 2 })} | Monthly Net: ${sym}${(r.net / 12).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                };
            }
        }

        // Explain how loan/tax was calculated
        if (/(?:explain|how).*?(?:loan|interest)/.test(q)) {
            return {
                message: `<em>Amortized loan formula:</em> Payment = P × r × (1 + r)<sup>n</sup> / ((1 + r)<sup>n</sup> − 1)<br>P = principal · r = periodic interest rate · n = number of payments. Each payment splits between interest (on remaining balance) and principal repayment.`,
                result: null
            };
        }
        if (/(?:explain|how).*?(?:tax|bracket)/.test(q)) {
            return {
                message: `<em>Progressive tax:</em> Each portion of income falls into a bracket and is taxed at that bracket's rate. Open the Tax tab to see each bracket's contribution to your total tax.`,
                result: null
            };
        }

        // Percentage
        const pctMatch = q.match(/(\d+\.?\d*)\s*(?:%|percent)\s*of\s*(\d+\.?\d*)/);
        if (pctMatch) {
            const pct = parseFloat(pctMatch[1]);
            const num = parseFloat(pctMatch[2]);
            const result = (pct / 100) * num;
            return {
                message: `${pct}% of ${num} is calculated as <em>(${pct} ÷ 100) × ${num}</em>`,
                result: result.toLocaleString()
            };
        }

        // Tip calculation
        const tipMatch = q.match(/tip.*?(\d+\.?\d*).*?(?:at|@)\s*(\d+\.?\d*)\s*%?/);
        if (tipMatch) {
            const bill = parseFloat(tipMatch[1]);
            const tipPct = parseFloat(tipMatch[2]);
            const tip = bill * tipPct / 100;
            const total = bill + tip;
            return {
                message: `For a $${bill} bill at ${tipPct}% tip:`,
                result: `Tip: $${tip.toFixed(2)} | Total: $${total.toFixed(2)}`
            };
        }

        // Currency conversion
        const curMatch = q.match(/convert\s+(\d+\.?\d*)\s+(\w+)\s+(?:to|in|into)\s+(\w+)/i);
        if (curMatch) {
            const amount = parseFloat(curMatch[1]);
            const from = this.matchCurrency(curMatch[2]);
            const to = this.matchCurrency(curMatch[3]);
            if (from && to) {
                const usdAmount = amount / CURRENCIES[from].rate;
                const result = usdAmount * CURRENCIES[to].rate;
                return {
                    message: `Converting ${amount} ${CURRENCIES[from].name} to ${CURRENCIES[to].name}`,
                    result: `${CURRENCIES[from].symbol}${amount.toLocaleString()} = ${CURRENCIES[to].symbol}${result.toLocaleString(undefined, {maximumFractionDigits: 4})}`
                };
            }
        }

        // Unit conversion
        const unitMatch = q.match(/(?:how\s+many\s+|convert\s+)?(\d+\.?\d*)\s+(\w+(?:\s?\w+)?)\s+(?:to|in|into|=)\s+(\w+(?:\s?\w+)?)/i);
        if (unitMatch) {
            const amount = parseFloat(unitMatch[1]);
            const fromStr = unitMatch[2].trim();
            const toStr = unitMatch[3].trim();
            const conv = this.tryUnitConversion(amount, fromStr, toStr);
            if (conv) return conv;
        }

        // Average/mean
        const avgMatch = q.match(/(?:average|mean)\s+of\s+([\d,.\s]+)/i);
        if (avgMatch) {
            const nums = avgMatch[1].split(/[,\s]+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
            const avg = nums.reduce((a,b) => a+b, 0) / nums.length;
            return {
                message: `Average of ${nums.join(', ')}`,
                result: `${avg.toFixed(4)} (sum: ${nums.reduce((a,b)=>a+b,0)}, count: ${nums.length})`
            };
        }

        // Sum
        const sumMatch = q.match(/(?:sum|total|add)\s+(?:of\s+)?([\d,.\s+]+)/i);
        if (sumMatch) {
            const nums = sumMatch[1].split(/[,\s+]+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
            const sum = nums.reduce((a,b) => a+b, 0);
            return {
                message: `Sum of ${nums.join(' + ')}`,
                result: sum.toLocaleString()
            };
        }

        // Square root
        const sqrtMatch = q.match(/(?:square\s+root|sqrt|√)\s*(?:of\s+)?(\d+\.?\d*)/);
        if (sqrtMatch) {
            const n = parseFloat(sqrtMatch[1]);
            return {
                message: `Square root of ${n}`,
                result: Math.sqrt(n).toLocaleString()
            };
        }

        // Area of circle
        const circleMatch = q.match(/(?:area\s+of\s+)?circle.*?radius\s*(?:of\s+)?(\d+\.?\d*)/i);
        if (circleMatch) {
            const r = parseFloat(circleMatch[1]);
            const area = Math.PI * r * r;
            const circ = 2 * Math.PI * r;
            return {
                message: `Circle with radius ${r}:<br><em>Area = π × r² = π × ${r}²</em>`,
                result: `Area: ${area.toFixed(4)} | Circumference: ${circ.toFixed(4)}`
            };
        }

        // Area of rectangle
        const rectMatch = q.match(/area.*?rectangle.*?(\d+\.?\d*).*?(?:by|x|×)\s*(\d+\.?\d*)/i);
        if (rectMatch) {
            const w = parseFloat(rectMatch[1]);
            const h = parseFloat(rectMatch[2]);
            return {
                message: `Rectangle area ${w} × ${h}`,
                result: `Area: ${(w*h).toLocaleString()} | Perimeter: ${(2*(w+h))}`
            };
        }

        // Explanations
        if (q.includes('explain') || q.includes('what is')) {
            return this.getExplanation(q);
        }

        // Factorial
        const factMatch = q.match(/(?:factorial\s+of\s+|(\d+)\s*!)/);
        if (factMatch) {
            const n = parseInt(factMatch[1] || q.match(/\d+/)[0]);
            return {
                message: `${n}! = ${n} × ${n-1} × ... × 1`,
                result: Calculator.factorial(n).toLocaleString()
            };
        }

        // Try direct math evaluation
        try {
            const mathQ = q
                .replace(/plus|add|and/g, '+')
                .replace(/minus|subtract|less/g, '-')
                .replace(/times|multiplied\s+by|x/gi, '*')
                .replace(/divided\s+by|over/g, '/')
                .replace(/to\s+the\s+power\s+of|\^/g, '**')
                .replace(/[^\d+\-*/.()%\s]/g, ' ')
                .replace(/\s+/g, '')
                .trim();

            if (mathQ && /^[\d+\-*/.()%]+$/.test(mathQ)) {
                const result = Function('"use strict"; return (' + mathQ + ')')();
                if (!isNaN(result)) {
                    return {
                        message: `Calculating <em>${mathQ}</em>`,
                        result: result.toLocaleString()
                    };
                }
            }
        } catch (e) {}

        return {
            message: `I'm not sure how to answer that. Try one of these:<br>
                <ul>
                    <li>"what is 15% of 200"</li>
                    <li>"convert 100 USD to EUR"</li>
                    <li>"how many km in 10 miles"</li>
                    <li>"average of 10, 20, 30"</li>
                    <li>"area of circle radius 5"</li>
                    <li>"calculate loan repayment for 500000 over 24 months at 18%"</li>
                    <li>"ovulation if my last period started May 5 and cycle is 28 days"</li>
                    <li>"estimate annual tax if I earn 800000 monthly in Nigeria"</li>
                </ul>`,
            result: null
        };
    },

    detectCurrencyInQuery(q) {
        if (q.includes('₦') || /\bnaira\b|\bngn\b/i.test(q)) return 'NGN';
        if (q.includes('$') || /\busd\b|\bdollars?\b/i.test(q)) return 'USD';
        if (q.includes('€') || /\beuros?\b|\beur\b/i.test(q)) return 'EUR';
        if (q.includes('£') || /\bpounds?\b|\bgbp\b/i.test(q)) return 'GBP';
        if (q.includes('¥') || /\byen\b|\byuan\b/i.test(q)) return 'JPY';
        if (/\brupees?\b|\binr\b/i.test(q)) return 'INR';
        if (/\brand\b|\bzar\b/i.test(q)) return 'ZAR';
        if (/\bcedis?\b|\bghs\b/i.test(q)) return 'GHS';
        if (/\bshillings?\b|\bkes\b/i.test(q)) return 'KES';
        return null;
    },

    parseFlexibleDate(str) {
        const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
        const m = str.toLowerCase().match(/([a-z]+)\s+(\d{1,2})(?:,?\s*(\d{4}))?/);
        if (!m) return null;
        const month = months.findIndex(mo => mo.startsWith(m[1].slice(0, 3)));
        if (month < 0) return null;
        const day = parseInt(m[2]);
        const year = m[3] ? parseInt(m[3]) : new Date().getFullYear();
        return new Date(year, month, day);
    },

    matchCurrency(str) {
        const s = str.toUpperCase();
        if (CURRENCIES[s]) return s;
        const map = {
            DOLLARS: 'USD', DOLLAR: 'USD', USD: 'USD',
            EUROS: 'EUR', EURO: 'EUR', EUR: 'EUR',
            POUNDS: 'GBP', POUND: 'GBP', STERLING: 'GBP',
            YEN: 'JPY', YUAN: 'CNY', RMB: 'CNY',
            RUPEES: 'INR', RUPEE: 'INR',
            WON: 'KRW', BITCOIN: 'BTC', BTC: 'BTC',
            ETHEREUM: 'ETH', ETH: 'ETH',
            FRANCS: 'CHF', FRANC: 'CHF',
            RUBLES: 'RUB', RUBLE: 'RUB',
            PESOS: 'MXN', PESO: 'MXN',
            REAL: 'BRL', REAIS: 'BRL',
            RAND: 'ZAR', NAIRA: 'NGN',
            SHEKEL: 'ILS', SHEKELS: 'ILS',
            LIRA: 'TRY', RIYAL: 'SAR',
            DIRHAM: 'AED', BAHT: 'THB',
            RINGGIT: 'MYR', RUPIAH: 'IDR',
            DONG: 'VND', GOLD: 'XAU', SILVER: 'XAG'
        };
        return map[s] || null;
    },

    tryUnitConversion(amount, fromStr, toStr) {
        for (const [catKey, cat] of Object.entries(METRIC_CATEGORIES)) {
            const fromKey = this.matchUnit(fromStr, cat.units);
            const toKey = this.matchUnit(toStr, cat.units);
            if (fromKey && toKey) {
                let result;
                if (catKey === 'temperature') {
                    result = Metric.convertTemperature(amount, fromKey, toKey);
                } else if (catKey === 'fuel') {
                    result = Metric.convertFuel(amount, fromKey, toKey);
                } else {
                    result = (amount * cat.units[fromKey].factor) / cat.units[toKey].factor;
                }
                return {
                    message: `Converting ${amount} ${cat.units[fromKey].name} to ${cat.units[toKey].name}`,
                    result: `${amount} ${fromKey} = ${result.toLocaleString(undefined, {maximumFractionDigits: 6})} ${toKey}`
                };
            }
        }
        return null;
    },

    matchUnit(str, units) {
        const s = str.toLowerCase().replace(/s$/, '');
        for (const [key, unit] of Object.entries(units)) {
            if (key.toLowerCase() === s) return key;
            if (unit.name.toLowerCase() === s) return key;
            if (unit.name.toLowerCase().replace(/s$/, '') === s) return key;
        }
        const aliases = {
            meters: 'm', meter: 'm', metres: 'm', metre: 'm',
            feet: 'ft', foot: 'ft',
            inches: 'in', inch: 'in',
            miles: 'mi', mile: 'mi',
            kilograms: 'kg', kilogram: 'kg', kilos: 'kg', kilo: 'kg',
            pounds: 'lb', pound: 'lb', lbs: 'lb',
            ounces: 'oz', ounce: 'oz',
            celsius: 'C', fahrenheit: 'F', kelvin: 'K',
            liters: 'l', liter: 'l', litres: 'l', litre: 'l',
            gallons: 'gal_us', gallon: 'gal_us',
            kilometers: 'km', kilometer: 'km',
            seconds: 's', second: 's', minutes: 'min', minute: 'min',
            hours: 'h', hour: 'h', days: 'd', day: 'd',
            megabytes: 'MB', gigabytes: 'GB', kilobytes: 'KB'
        };
        if (aliases[s]) return aliases[s];
        return null;
    },

    getExplanation(q) {
        const topics = {
            'quadratic': 'The <em>quadratic formula</em> solves ax² + bx + c = 0:<br>x = (-b ± √(b² - 4ac)) / 2a',
            'pythagorean': 'The <em>Pythagorean theorem</em>: in a right triangle, a² + b² = c², where c is the hypotenuse.',
            'pi': 'π (pi) ≈ 3.14159... is the ratio of a circle\'s circumference to its diameter.',
            'euler': 'Euler\'s number e ≈ 2.71828... is the base of natural logarithms.',
            'prime': 'A <em>prime number</em> is a natural number > 1 divisible only by 1 and itself.',
            'factorial': 'n! (factorial) is the product of all positive integers ≤ n. Example: 5! = 120',
            'logarithm': 'A <em>logarithm</em> is the inverse of exponentiation. log(x) asks: what power of 10 gives x?',
            'derivative': 'A <em>derivative</em> measures the instantaneous rate of change of a function.',
            'integral': 'An <em>integral</em> represents the accumulation (area under a curve) of a function.'
        };
        for (const [key, val] of Object.entries(topics)) {
            if (q.includes(key)) return { message: val, result: null };
        }
        return { message: 'I can explain: quadratic formula, Pythagorean theorem, pi, euler, prime numbers, factorial, logarithm, derivative, integral', result: null };
    }
};

// ===== OVULATION CALCULATOR =====
const Ovulation = {
    init() {
        this.loadFromState();
        this.bindEvents();
        this.renderPresets();
    },

    loadFromState() {
        if (state.ovulation.lastPeriod) document.getElementById('ovLastPeriod').value = state.ovulation.lastPeriod;
        document.getElementById('ovCycleLength').value = state.ovulation.cycleLength;
        document.getElementById('ovPeriodLength').value = state.ovulation.periodLength;
        document.getElementById('ovLuteal').value = state.ovulation.luteal;
        document.getElementById('ovMonths').value = state.ovulation.monthsToPredict;
        document.getElementById('ovCalStart').value = state.ovulation.calStart;
        document.getElementById('ovIrregular').checked = state.ovulation.irregular;
        document.getElementById('ovShortest').value = state.ovulation.shortest;
        document.getElementById('ovLongest').value = state.ovulation.longest;
        this.toggleIrregular();
    },

    bindEvents() {
        document.getElementById('ovCalcBtn').addEventListener('click', () => { hapticPulse(15); this.calculate(); });
        document.getElementById('ovResetBtn').addEventListener('click', () => this.reset());
        document.getElementById('ovCopyBtn').addEventListener('click', () => this.copySummary());
        document.getElementById('ovSaveBtn').addEventListener('click', () => this.save());
        document.getElementById('ovIrregular').addEventListener('change', () => this.toggleIrregular());
    },

    toggleIrregular() {
        const on = document.getElementById('ovIrregular').checked;
        document.getElementById('ovShortest').disabled = !on;
        document.getElementById('ovLongest').disabled = !on;
    },

    readInputs() {
        const lastPeriod = document.getElementById('ovLastPeriod').value;
        const cycleLength = parseInt(document.getElementById('ovCycleLength').value) || 28;
        const periodLength = parseInt(document.getElementById('ovPeriodLength').value) || 5;
        const luteal = parseInt(document.getElementById('ovLuteal').value) || 14;
        const monthsToPredict = parseInt(document.getElementById('ovMonths').value) || 3;
        const calStart = parseInt(document.getElementById('ovCalStart').value) || 0;
        const irregular = document.getElementById('ovIrregular').checked;
        const shortest = parseInt(document.getElementById('ovShortest').value) || 26;
        const longest = parseInt(document.getElementById('ovLongest').value) || 32;
        return { lastPeriod, cycleLength, periodLength, luteal, monthsToPredict, calStart, irregular, shortest, longest };
    },

    validate(i) {
        if (!i.lastPeriod) return 'Please select the first day of your last period.';
        if (i.cycleLength < 21 || i.cycleLength > 45) return 'Cycle length must be between 21 and 45 days.';
        if (i.periodLength < 2 || i.periodLength > 10) return 'Period length must be between 2 and 10 days.';
        if (i.periodLength >= i.cycleLength) return 'Period length cannot exceed cycle length.';
        if (i.luteal < 10 || i.luteal > 16) return 'Luteal phase must be between 10 and 16 days.';
        if (i.irregular && i.shortest >= i.longest) return 'Shortest cycle must be less than longest cycle.';
        return null;
    },

    calculate() {
        const i = this.readInputs();
        const err = this.validate(i);
        if (err) { showToast(err, 'error', 3000); return; }

        Object.assign(state.ovulation, i);

        const baseDate = this.parseLocalDate(i.lastPeriod);
        const cycles = [];
        for (let n = 0; n < i.monthsToPredict; n++) {
            let cycleLen = i.cycleLength;
            if (i.irregular) {
                cycleLen = Math.round((i.shortest + i.longest) / 2);
            }
            const periodStart = new Date(baseDate);
            periodStart.setDate(periodStart.getDate() + n * cycleLen);
            const periodEnd = new Date(periodStart);
            periodEnd.setDate(periodEnd.getDate() + i.periodLength - 1);
            const nextPeriod = new Date(periodStart);
            nextPeriod.setDate(nextPeriod.getDate() + cycleLen);
            const ovulation = new Date(nextPeriod);
            ovulation.setDate(ovulation.getDate() - i.luteal);
            const fertileStart = new Date(ovulation);
            fertileStart.setDate(fertileStart.getDate() - 5);
            const fertileEnd = new Date(ovulation);
            fertileEnd.setDate(fertileEnd.getDate() + 1);
            const peakStart = new Date(ovulation);
            peakStart.setDate(peakStart.getDate() - 2);
            const peakEnd = new Date(ovulation);
            const pregTest = new Date(ovulation);
            pregTest.setDate(pregTest.getDate() + 14);

            cycles.push({
                cycleNumber: n + 1,
                periodStart, periodEnd, nextPeriod,
                ovulation, fertileStart, fertileEnd,
                peakStart, peakEnd, pregTest,
                cycleLen
            });
        }

        state.ovulation.result = cycles;
        this.renderResults(cycles, i);
        playSound(700, 60);
    },

    parseLocalDate(yyyymmdd) {
        const [y, m, d] = yyyymmdd.split('-').map(Number);
        return new Date(y, m - 1, d);
    },

    formatDate(date) {
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    },

    renderResults(cycles, inputs) {
        document.getElementById('ovResults').style.display = '';
        const first = cycles[0];

        document.getElementById('ovOvulationDate').textContent = this.formatDate(first.ovulation);
        document.getElementById('ovFertileWindow').textContent =
            `${this.formatDate(first.fertileStart)} → ${this.formatDate(first.fertileEnd)}`;
        document.getElementById('ovNextPeriod').textContent = this.formatDate(first.nextPeriod);
        document.getElementById('ovPeakDays').textContent =
            `${this.formatDate(first.peakStart)} → ${this.formatDate(first.peakEnd)}`;
        document.getElementById('ovPregTest').textContent = this.formatDate(first.pregTest);
        document.getElementById('ovCycleSummary').textContent =
            `${inputs.cycleLength}-day cycle, ${inputs.periodLength}-day period, ${inputs.luteal}-day luteal`;

        this.renderCalendar(cycles, inputs);
    },

    renderCalendar(cycles, inputs) {
        const wrap = document.getElementById('ovCalendar');
        wrap.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekdays = inputs.calStart === 1 ? WEEKDAYS_MON : WEEKDAYS_SUN;

        cycles.forEach(c => {
            const monthDate = new Date(c.periodStart.getFullYear(), c.periodStart.getMonth(), 1);
            const monthCard = document.createElement('div');
            monthCard.className = 'calendar-month';
            monthCard.innerHTML = `
                <div class="cal-month-header">${MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()} — Cycle ${c.cycleNumber}</div>
                <div class="cal-weekdays">${weekdays.map(d => `<span>${d}</span>`).join('')}</div>
                <div class="cal-grid" id="cal-grid-${c.cycleNumber}"></div>
            `;
            wrap.appendChild(monthCard);

            const grid = monthCard.querySelector('.cal-grid');
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const offset = (firstDay - inputs.calStart + 7) % 7;
            const days = daysInMonth(year, month);

            for (let p = 0; p < offset; p++) {
                grid.insertAdjacentHTML('beforeend', '<span class="cal-day empty"></span>');
            }
            for (let d = 1; d <= days; d++) {
                const cellDate = new Date(year, month, d);
                cellDate.setHours(0, 0, 0, 0);
                const classes = ['cal-day'];
                if (cellDate >= c.periodStart && cellDate <= c.periodEnd) classes.push('period');
                if (cellDate >= c.fertileStart && cellDate <= c.fertileEnd) classes.push('fertile');
                if (cellDate.getTime() === c.ovulation.getTime()) classes.push('ovulation');
                if (cellDate.getTime() === today.getTime()) classes.push('today');
                grid.insertAdjacentHTML('beforeend', `<span class="${classes.join(' ')}">${d}</span>`);
            }
        });
    },

    reset() {
        state.ovulation.lastPeriod = null;
        document.getElementById('ovLastPeriod').value = '';
        document.getElementById('ovCycleLength').value = 28;
        document.getElementById('ovPeriodLength').value = 5;
        document.getElementById('ovLuteal').value = 14;
        document.getElementById('ovMonths').value = 3;
        document.getElementById('ovIrregular').checked = false;
        document.getElementById('ovResults').style.display = 'none';
        this.toggleIrregular();
        showToast('Ovulation calculator reset', 'info', 1500);
    },

    copySummary() {
        if (!state.ovulation.result) { showToast('Calculate first', 'warning', 1500); return; }
        const first = state.ovulation.result[0];
        const text = [
            `Ovulation Calculator Summary`,
            `Ovulation: ${this.formatDate(first.ovulation)}`,
            `Fertile Window: ${this.formatDate(first.fertileStart)} → ${this.formatDate(first.fertileEnd)}`,
            `Next Period: ${this.formatDate(first.nextPeriod)}`,
            `Pregnancy Test: ${this.formatDate(first.pregTest)}`,
            `Cycle: ${state.ovulation.cycleLength} days`
        ].join('\n');
        navigator.clipboard.writeText(text).then(
            () => showToast('Summary copied', 'success', 1500),
            () => showToast('Copy failed', 'error', 1500)
        );
    },

    save() {
        if (!state.ovulation.result) { showToast('Calculate first', 'warning', 1500); return; }
        const preset = {
            id: Date.now(),
            label: `${state.ovulation.cycleLength}d cycle from ${state.ovulation.lastPeriod}`,
            data: {
                lastPeriod: state.ovulation.lastPeriod,
                cycleLength: state.ovulation.cycleLength,
                periodLength: state.ovulation.periodLength,
                luteal: state.ovulation.luteal,
                monthsToPredict: state.ovulation.monthsToPredict,
                calStart: state.ovulation.calStart,
                irregular: state.ovulation.irregular,
                shortest: state.ovulation.shortest,
                longest: state.ovulation.longest
            }
        };
        state.ovulation.presets.unshift(preset);
        if (state.ovulation.presets.length > 20) state.ovulation.presets.pop();
        Storage.save('ovulationPresets', state.ovulation.presets);
        this.renderPresets();
        showToast('Cycle saved', 'success', 1500);
    },

    renderPresets() {
        const list = document.getElementById('ovulationPresets');
        if (!list) return;
        if (state.ovulation.presets.length === 0) {
            list.innerHTML = '<div class="presets-empty">No saved cycles yet</div>';
            return;
        }
        list.innerHTML = state.ovulation.presets.map(p => `
            <div class="preset-chip" data-id="${p.id}">
                <span>${p.label}</span>
                <button class="remove-preset" data-id="${p.id}">×</button>
            </div>
        `).join('');
        list.querySelectorAll('.preset-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-preset')) return;
                const id = parseInt(chip.dataset.id);
                const preset = state.ovulation.presets.find(p => p.id === id);
                if (preset) {
                    Object.assign(state.ovulation, preset.data);
                    this.loadFromState();
                    this.calculate();
                }
            });
        });
        list.querySelectorAll('.remove-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                state.ovulation.presets = state.ovulation.presets.filter(p => p.id !== parseInt(btn.dataset.id));
                Storage.save('ovulationPresets', state.ovulation.presets);
                this.renderPresets();
                showToast('Cycle removed', 'info', 1200);
            });
        });
    }
};

// ===== LOAN CALCULATOR =====
const Loan = {
    init() {
        this.populateCurrency();
        this.loadFromState();
        this.bindEvents();
        this.renderPresets();
    },

    populateCurrency() {
        const sel = document.getElementById('loanCurrency');
        sel.innerHTML = Object.entries(CURRENCIES).map(([code, d]) =>
            `<option value="${code}">${d.flag} ${code} — ${d.name}</option>`
        ).join('');
        sel.value = state.loan.currency;
    },

    loadFromState() {
        const s = state.loan;
        const today = new Date().toISOString().slice(0, 10);
        document.getElementById('loanAmount').value = s.amount;
        document.getElementById('loanCurrency').value = s.currency;
        document.getElementById('loanRate').value = s.rate;
        document.getElementById('loanRateType').value = s.rateType;
        document.getElementById('loanTerm').value = s.term;
        document.getElementById('loanTermUnit').value = s.termUnit;
        document.getElementById('loanType').value = s.loanType;
        document.getElementById('loanFreq').value = s.frequency;
        document.getElementById('loanStartDate').value = s.startDate || today;
        document.getElementById('loanFirstPayment').value = s.firstPayment || this.addMonths(today, 1);
        document.getElementById('loanDown').value = s.downPayment;
        document.getElementById('loanProcFee').value = s.processingFee;
        document.getElementById('loanInsurance').value = s.insurance;
        document.getElementById('loanExtra').value = s.extraPayment;
        document.getElementById('loanBalloon').value = s.balloon;
        document.getElementById('loanGrace').value = s.grace;
        document.getElementById('loanCompound').value = s.compounding;
    },

    addMonths(yyyymmdd, n) {
        const d = new Date(yyyymmdd);
        d.setMonth(d.getMonth() + n);
        return d.toISOString().slice(0, 10);
    },

    bindEvents() {
        document.getElementById('loanCalcBtn').addEventListener('click', () => { hapticPulse(15); this.calculate(); });
        document.getElementById('loanResetBtn').addEventListener('click', () => this.reset());
        document.getElementById('loanCopyBtn').addEventListener('click', () => this.copySummary());
        document.getElementById('loanExportBtn').addEventListener('click', () => this.exportCSV());
        document.getElementById('loanSaveBtn').addEventListener('click', () => this.save());
        document.getElementById('loanScheduleToggle').addEventListener('click', () => {
            const w = document.getElementById('loanScheduleWrap');
            w.classList.toggle('collapsed');
        });
    },

    readInputs() {
        return {
            amount: parseFloat(document.getElementById('loanAmount').value) || 0,
            currency: document.getElementById('loanCurrency').value,
            rate: parseFloat(document.getElementById('loanRate').value) || 0,
            rateType: document.getElementById('loanRateType').value,
            term: parseFloat(document.getElementById('loanTerm').value) || 0,
            termUnit: document.getElementById('loanTermUnit').value,
            loanType: document.getElementById('loanType').value,
            frequency: document.getElementById('loanFreq').value,
            startDate: document.getElementById('loanStartDate').value,
            firstPayment: document.getElementById('loanFirstPayment').value,
            downPayment: parseFloat(document.getElementById('loanDown').value) || 0,
            processingFee: parseFloat(document.getElementById('loanProcFee').value) || 0,
            insurance: parseFloat(document.getElementById('loanInsurance').value) || 0,
            extraPayment: parseFloat(document.getElementById('loanExtra').value) || 0,
            balloon: parseFloat(document.getElementById('loanBalloon').value) || 0,
            grace: parseInt(document.getElementById('loanGrace').value) || 0,
            compounding: document.getElementById('loanCompound').value
        };
    },

    validate(i) {
        if (i.amount <= 0) return 'Loan amount must be greater than zero.';
        if (i.rate < 0) return 'Interest rate cannot be negative.';
        if (i.term <= 0) return 'Loan term must be greater than zero.';
        if (!i.currency) return 'Please select a currency.';
        if (i.startDate && i.firstPayment && new Date(i.firstPayment) < new Date(i.startDate)) {
            return 'First repayment date cannot be before the loan start date.';
        }
        const principal = i.amount - i.downPayment;
        if (i.balloon > principal) return 'Balloon payment cannot exceed the principal.';
        if (i.extraPayment < 0) return 'Extra payment cannot be negative.';
        return null;
    },

    periodsPerYear(freq) {
        return { daily: 365, weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, semiannually: 2, annually: 1 }[freq] || 12;
    },

    termToTotalDays(term, unit) {
        return { days: 1, weeks: 7, months: 30.4375, years: 365.25 }[unit] * term;
    },

    numberOfPayments(i) {
        const totalDays = this.termToTotalDays(i.term, i.termUnit);
        const periodDays = 365 / this.periodsPerYear(i.frequency);
        return Math.max(1, Math.round(totalDays / periodDays));
    },

    annualRate(i) {
        if (i.rateType === 'annual') return i.rate / 100;
        if (i.rateType === 'monthly') return (i.rate / 100) * 12;
        if (i.rateType === 'daily') return (i.rate / 100) * 365;
        return i.rate / 100;
    },

    periodicRate(i) {
        return this.annualRate(i) / this.periodsPerYear(i.frequency);
    },

    addPeriod(date, freq, n = 1) {
        const d = new Date(date);
        switch (freq) {
            case 'daily': d.setDate(d.getDate() + n); break;
            case 'weekly': d.setDate(d.getDate() + 7 * n); break;
            case 'biweekly': d.setDate(d.getDate() + 14 * n); break;
            case 'monthly': d.setMonth(d.getMonth() + n); break;
            case 'quarterly': d.setMonth(d.getMonth() + 3 * n); break;
            case 'semiannually': d.setMonth(d.getMonth() + 6 * n); break;
            case 'annually': d.setFullYear(d.getFullYear() + n); break;
        }
        return d;
    },

    calculate() {
        const i = this.readInputs();
        const err = this.validate(i);
        if (err) { showToast(err, 'error', 3000); return; }

        Object.assign(state.loan, i);
        const principal = i.amount - i.downPayment;
        const n = this.numberOfPayments(i);
        const r = this.periodicRate(i);
        const periods = this.periodsPerYear(i.frequency);
        const annualR = this.annualRate(i);

        let payment = 0;
        let totalInterest = 0;
        let totalPayments = 0;
        let schedule = [];

        if (i.loanType === 'amortized') {
            payment = r === 0 ? principal / n : principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
            let balance = principal;
            let payDate = i.firstPayment ? new Date(i.firstPayment) : (i.startDate ? this.addPeriod(new Date(i.startDate), i.frequency) : new Date());
            for (let k = 1; k <= n; k++) {
                const interest = balance * r;
                let principalPaid = payment - interest;
                let extra = (k > i.grace) ? i.extraPayment : 0;
                let actualPayment = payment + extra;
                if (k === n) {
                    actualPayment = balance + interest;
                    principalPaid = balance;
                    extra = 0;
                }
                principalPaid = Math.min(principalPaid + extra, balance);
                const closingBalance = Math.max(0, balance - principalPaid);
                schedule.push({
                    n: k, date: new Date(payDate),
                    opening: balance, payment: actualPayment,
                    principal: principalPaid, interest, fees: 0,
                    extra, closing: closingBalance
                });
                totalInterest += interest;
                totalPayments += actualPayment;
                balance = closingBalance;
                if (balance <= 0.01) break;
                payDate = this.addPeriod(payDate, i.frequency);
            }
        } else if (i.loanType === 'flat') {
            const years = this.termToTotalDays(i.term, i.termUnit) / 365.25;
            totalInterest = principal * annualR * years;
            payment = (principal + totalInterest) / n;
            let payDate = i.firstPayment ? new Date(i.firstPayment) : new Date();
            let balance = principal;
            const principalPerPay = principal / n;
            const interestPerPay = totalInterest / n;
            for (let k = 1; k <= n; k++) {
                schedule.push({
                    n: k, date: new Date(payDate),
                    opening: balance, payment,
                    principal: principalPerPay, interest: interestPerPay,
                    fees: 0, extra: 0, closing: balance - principalPerPay
                });
                balance -= principalPerPay;
                totalPayments += payment;
                payDate = this.addPeriod(payDate, i.frequency);
            }
        } else if (i.loanType === 'interest-only') {
            payment = principal * r;
            totalInterest = payment * n;
            let payDate = i.firstPayment ? new Date(i.firstPayment) : new Date();
            for (let k = 1; k <= n; k++) {
                const isLast = k === n;
                const finalPayment = isLast ? payment + principal : payment;
                schedule.push({
                    n: k, date: new Date(payDate),
                    opening: principal, payment: finalPayment,
                    principal: isLast ? principal : 0, interest: payment,
                    fees: 0, extra: 0, closing: isLast ? 0 : principal
                });
                totalPayments += finalPayment;
                payDate = this.addPeriod(payDate, i.frequency);
            }
        } else if (i.loanType === 'balloon') {
            const balloon = i.balloon || principal * 0.3;
            const amortizedPart = principal - balloon;
            payment = r === 0 ? amortizedPart / n : amortizedPart * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
            let balance = principal;
            let payDate = i.firstPayment ? new Date(i.firstPayment) : new Date();
            for (let k = 1; k <= n; k++) {
                const interest = balance * r;
                let principalPaid = payment - interest;
                let actualPayment = payment;
                if (k === n) {
                    actualPayment = payment + balloon;
                    principalPaid += balloon;
                }
                const closingBalance = Math.max(0, balance - principalPaid);
                schedule.push({
                    n: k, date: new Date(payDate),
                    opening: balance, payment: actualPayment,
                    principal: principalPaid, interest, fees: 0,
                    extra: 0, closing: closingBalance
                });
                totalInterest += interest;
                totalPayments += actualPayment;
                balance = closingBalance;
                payDate = this.addPeriod(payDate, i.frequency);
            }
        } else if (i.loanType === 'simple') {
            const years = this.termToTotalDays(i.term, i.termUnit) / 365.25;
            totalInterest = principal * annualR * years;
            payment = (principal + totalInterest) / n;
            let payDate = i.firstPayment ? new Date(i.firstPayment) : new Date();
            for (let k = 1; k <= n; k++) {
                schedule.push({
                    n: k, date: new Date(payDate),
                    opening: principal - (principal / n) * (k - 1), payment,
                    principal: principal / n, interest: totalInterest / n,
                    fees: 0, extra: 0, closing: principal - (principal / n) * k
                });
                totalPayments += payment;
                payDate = this.addPeriod(payDate, i.frequency);
            }
        }

        const totalFees = i.processingFee + i.insurance;
        const finalCost = totalPayments + totalFees + i.downPayment;
        const payoffDate = schedule.length ? schedule[schedule.length - 1].date : new Date();
        const effectiveRate = (Math.pow(1 + r, periods) - 1) * 100;

        const result = {
            principal, payment, totalInterest, totalPayments,
            totalFees, finalCost, payoffDate, schedule,
            numPayments: schedule.length, effectiveRate,
            currency: i.currency, frequency: i.frequency
        };
        state.loan.result = result;
        this.renderResults(result, i);
        playSound(700, 60);
    },

    renderResults(r, i) {
        document.getElementById('loanResults').style.display = '';
        const sym = CURRENCIES[i.currency]?.symbol || '';
        const fmt = (v) => sym + (v).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

        document.getElementById('loanRepayment').textContent = fmt(r.payment) + ' / ' + i.frequency;
        document.getElementById('loanTotalInterest').textContent = fmt(r.totalInterest);
        document.getElementById('loanTotalRepayment').textContent = fmt(r.totalPayments);
        document.getElementById('loanFees').textContent = fmt(r.totalFees);
        document.getElementById('loanFinalCost').textContent = fmt(r.finalCost);
        document.getElementById('loanPayoffDate').textContent = r.payoffDate.toLocaleDateString();
        document.getElementById('loanPaymentCount').textContent = r.numPayments;
        document.getElementById('loanEAR').textContent = r.effectiveRate.toFixed(2) + '%';

        this.renderDonut(r);
        this.renderLineChart(r);
        this.renderSchedule(r, i);
    },

    renderDonut(r) {
        const total = r.principal + r.totalInterest;
        const pPct = (r.principal / total) * 100;
        const iPct = 100 - pPct;
        const wrap = document.getElementById('loanDonut');
        wrap.innerHTML = `
            <svg viewBox="0 0 200 200" width="100%" height="200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="var(--accent-primary)" stroke-width="35"
                    stroke-dasharray="${pPct * 5.026} 502.6" transform="rotate(-90 100 100)"/>
                <circle cx="100" cy="100" r="80" fill="none" stroke="var(--accent-secondary)" stroke-width="35"
                    stroke-dasharray="${iPct * 5.026} 502.6" stroke-dashoffset="${-pPct * 5.026}" transform="rotate(-90 100 100)"/>
                <text x="100" y="100" text-anchor="middle" dy=".3em" fill="var(--text-primary)" font-size="14" font-weight="600">Total Cost</text>
            </svg>
            <div class="chart-legend">
                <span class="legend-item"><span class="legend-dot" style="background:var(--accent-primary)"></span>Principal ${pPct.toFixed(1)}%</span>
                <span class="legend-item"><span class="legend-dot" style="background:var(--accent-secondary)"></span>Interest ${iPct.toFixed(1)}%</span>
            </div>
        `;
    },

    renderLineChart(r) {
        const wrap = document.getElementById('loanLineChart');
        const balances = r.schedule.map(s => s.closing);
        if (!balances.length) { wrap.innerHTML = ''; return; }
        const max = r.principal;
        const w = 320, h = 160, pad = 20;
        const points = balances.map((b, idx) => {
            const x = pad + ((idx / Math.max(1, balances.length - 1)) * (w - 2 * pad));
            const y = pad + ((1 - b / max) * (h - 2 * pad));
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        wrap.innerHTML = `
            <svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="none" style="max-height:200px;">
                <polyline fill="none" stroke="var(--accent-primary)" stroke-width="2" points="${points}"/>
                <polyline fill="url(#loanFill)" stroke="none"
                    points="${pad},${h - pad} ${points} ${w - pad},${h - pad}" opacity="0.25"/>
                <defs>
                    <linearGradient id="loanFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.6"/>
                        <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0"/>
                    </linearGradient>
                </defs>
            </svg>
            <div class="chart-meta">Balance reduces over ${balances.length} payments</div>
        `;
    },

    renderSchedule(r, i) {
        const tbl = document.getElementById('loanScheduleTable');
        const sym = CURRENCIES[i.currency]?.symbol || '';
        const fmt = (v) => sym + v.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
        const rows = r.schedule.slice(0, 240).map(s => `
            <tr>
                <td>${s.n}</td>
                <td>${s.date.toLocaleDateString()}</td>
                <td>${fmt(s.opening)}</td>
                <td>${fmt(s.payment)}</td>
                <td>${fmt(s.principal)}</td>
                <td>${fmt(s.interest)}</td>
                <td>${fmt(s.extra)}</td>
                <td>${fmt(s.closing)}</td>
            </tr>
        `).join('');
        tbl.innerHTML = `
            <thead>
                <tr>
                    <th>#</th><th>Date</th><th>Opening</th><th>Payment</th>
                    <th>Principal</th><th>Interest</th><th>Extra</th><th>Closing</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        `;
    },

    exportCSV() {
        if (!state.loan.result) { showToast('Calculate first', 'warning', 1500); return; }
        const r = state.loan.result;
        const header = '#,Date,Opening,Payment,Principal,Interest,Extra,Closing\n';
        const lines = r.schedule.map(s =>
            [s.n, s.date.toISOString().slice(0, 10), s.opening.toFixed(2), s.payment.toFixed(2),
             s.principal.toFixed(2), s.interest.toFixed(2), s.extra.toFixed(2), s.closing.toFixed(2)].join(',')
        ).join('\n');
        const blob = new Blob([header + lines], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loan-schedule-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('CSV downloaded', 'success', 1500);
    },

    copySummary() {
        if (!state.loan.result) { showToast('Calculate first', 'warning', 1500); return; }
        const r = state.loan.result;
        const sym = CURRENCIES[r.currency]?.symbol || '';
        const fmt = (v) => sym + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
        const text = [
            `Loan Summary (${r.currency})`,
            `Principal: ${fmt(r.principal)}`,
            `Repayment: ${fmt(r.payment)} / ${r.frequency}`,
            `Total Interest: ${fmt(r.totalInterest)}`,
            `Total Repayment: ${fmt(r.totalPayments)}`,
            `Final Cost: ${fmt(r.finalCost)}`,
            `Payoff: ${r.payoffDate.toLocaleDateString()}`,
            `Payments: ${r.numPayments}`
        ].join('\n');
        navigator.clipboard.writeText(text).then(
            () => showToast('Summary copied', 'success', 1500),
            () => showToast('Copy failed', 'error', 1500)
        );
    },

    save() {
        if (!state.loan.result) { showToast('Calculate first', 'warning', 1500); return; }
        const i = this.readInputs();
        const preset = {
            id: Date.now(),
            label: `${CURRENCIES[i.currency]?.symbol || ''}${i.amount.toLocaleString()} @ ${i.rate}% for ${i.term} ${i.termUnit}`,
            data: i
        };
        state.loan.presets.unshift(preset);
        if (state.loan.presets.length > 20) state.loan.presets.pop();
        Storage.save('loanPresets', state.loan.presets);
        this.renderPresets();
        showToast('Loan saved', 'success', 1500);
    },

    reset() {
        state.loan.result = null;
        document.getElementById('loanResults').style.display = 'none';
        document.getElementById('loanAmount').value = 500000;
        document.getElementById('loanRate').value = 15;
        document.getElementById('loanTerm').value = 24;
        document.getElementById('loanDown').value = 0;
        document.getElementById('loanExtra').value = 0;
        document.getElementById('loanBalloon').value = 0;
        showToast('Loan calculator reset', 'info', 1500);
    },

    renderPresets() {
        const list = document.getElementById('loanPresets');
        if (!list) return;
        if (state.loan.presets.length === 0) {
            list.innerHTML = '<div class="presets-empty">No saved loans yet</div>';
            return;
        }
        list.innerHTML = state.loan.presets.map(p => `
            <div class="preset-chip" data-id="${p.id}">
                <span>${p.label}</span>
                <button class="remove-preset" data-id="${p.id}">×</button>
            </div>
        `).join('');
        list.querySelectorAll('.preset-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-preset')) return;
                const id = parseInt(chip.dataset.id);
                const preset = state.loan.presets.find(p => p.id === id);
                if (preset) {
                    Object.assign(state.loan, preset.data);
                    this.loadFromState();
                    this.calculate();
                }
            });
        });
        list.querySelectorAll('.remove-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                state.loan.presets = state.loan.presets.filter(p => p.id !== parseInt(btn.dataset.id));
                Storage.save('loanPresets', state.loan.presets);
                this.renderPresets();
                showToast('Loan removed', 'info', 1200);
            });
        });
    },

    // For AI integration
    quickCalc(amount, rate, term, termUnit = 'months', currency = 'NGN') {
        const i = {
            amount, currency, rate, rateType: 'annual',
            term, termUnit, loanType: 'amortized',
            frequency: 'monthly', startDate: null, firstPayment: null,
            downPayment: 0, processingFee: 0, insurance: 0,
            extraPayment: 0, balloon: 0, grace: 0, compounding: 'monthly'
        };
        const principal = amount;
        const n = this.numberOfPayments(i);
        const r = this.periodicRate(i);
        const payment = r === 0 ? principal / n : principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        const totalRepayment = payment * n;
        const totalInterest = totalRepayment - principal;
        return { payment, totalRepayment, totalInterest, n };
    }
};

// ===== TAX CALCULATOR =====
const Tax = {
    init() {
        this.populateCurrency();
        this.populateCountry();
        this.populateDates();
        this.loadFromState();
        this.loadCountryPreset(state.tax.country);
        this.bindEvents();
        this.renderPresets();
    },

    populateCurrency() {
        const sel = document.getElementById('taxCurrency');
        sel.innerHTML = Object.entries(CURRENCIES).map(([code, d]) =>
            `<option value="${code}">${d.flag} ${code} — ${d.name}</option>`
        ).join('');
        sel.value = state.tax.currency;
    },

    populateCountry() {
        const sel = document.getElementById('taxCountry');
        sel.innerHTML = Object.entries(TAX_PRESETS).map(([code, p]) =>
            `<option value="${code}">${p.name}</option>`
        ).join('');
        sel.value = state.tax.country;
    },

    populateDates() {
        const sm = document.getElementById('taxStartMonth');
        const em = document.getElementById('taxEndMonth');
        const sd = document.getElementById('taxStartDay');
        const ed = document.getElementById('taxEndDay');
        sm.innerHTML = MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
        em.innerHTML = MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
        sd.innerHTML = Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
        ed.innerHTML = Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
    },

    loadFromState() {
        const s = state.tax;
        document.getElementById('taxCountry').value = s.country;
        document.getElementById('taxYear').value = s.year;
        document.getElementById('taxCurrency').value = s.currency;
        document.getElementById('taxIncomeType').value = s.incomeType;
        document.getElementById('taxIncome').value = s.income;
        document.getElementById('taxPeriod').value = s.period;
        document.getElementById('taxStatus').value = s.status;
        document.getElementById('taxStartMonth').value = s.startMonth;
        document.getElementById('taxStartDay').value = s.startDay;
        document.getElementById('taxEndMonth').value = s.endMonth;
        document.getElementById('taxEndDay').value = s.endDay;
        document.getElementById('taxPension').value = s.pension;
        document.getElementById('taxInsurance').value = s.insurance;
        document.getElementById('taxReliefs').value = s.reliefs;
        document.getElementById('taxDeductions').value = s.deductions;
        document.getElementById('taxAllowances').value = s.allowances;
        document.getElementById('taxCredits').value = s.credits;
        document.getElementById('taxPayePaid').value = s.payePaid;
        document.getElementById('taxWhtPaid').value = s.whtPaid;
        document.getElementById('taxVat').value = s.vat;
    },

    loadCountryPreset(code) {
        const preset = TAX_PRESETS[code];
        if (!preset) return;
        state.tax.country = code;
        state.tax.currency = preset.currency;
        state.tax.brackets = JSON.parse(JSON.stringify(preset.brackets));
        document.getElementById('taxCurrency').value = preset.currency;
        this.renderBracketsEditor();
    },

    renderBracketsEditor() {
        const wrap = document.getElementById('taxBracketsEditor');
        wrap.innerHTML = state.tax.brackets.map((b, idx) => `
            <div class="bracket-row" data-idx="${idx}">
                <input type="number" class="form-input" data-field="min" value="${b.min}" placeholder="Min">
                <input type="number" class="form-input" data-field="max" value="${b.max === Infinity ? '' : b.max}" placeholder="Max (blank = ∞)">
                <input type="number" class="form-input" data-field="rate" value="${b.rate}" placeholder="Rate %" step="any">
                <button class="remove-bracket" data-idx="${idx}">×</button>
            </div>
        `).join('');
        wrap.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.closest('.bracket-row').dataset.idx);
                const field = e.target.dataset.field;
                let val = e.target.value;
                if (field === 'max' && val === '') val = Infinity;
                else val = parseFloat(val) || 0;
                state.tax.brackets[idx][field] = val;
            });
        });
        wrap.querySelectorAll('.remove-bracket').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.idx);
                state.tax.brackets.splice(idx, 1);
                this.renderBracketsEditor();
            });
        });
    },

    bindEvents() {
        document.getElementById('taxCountry').addEventListener('change', (e) => {
            this.loadCountryPreset(e.target.value);
        });
        document.getElementById('taxCalcBtn').addEventListener('click', () => { hapticPulse(15); this.calculate(); });
        document.getElementById('taxResetBtn').addEventListener('click', () => this.reset());
        document.getElementById('taxCopyBtn').addEventListener('click', () => this.copySummary());
        document.getElementById('taxExportBtn').addEventListener('click', () => this.exportCSV());
        document.getElementById('taxSaveBtn').addEventListener('click', () => this.save());
        document.getElementById('taxAddBracket').addEventListener('click', () => {
            const last = state.tax.brackets[state.tax.brackets.length - 1];
            const min = last ? (last.max === Infinity ? last.min : last.max) : 0;
            state.tax.brackets.push({ min, max: Infinity, rate: 0 });
            this.renderBracketsEditor();
        });
    },

    readInputs() {
        return {
            country: document.getElementById('taxCountry').value,
            year: parseInt(document.getElementById('taxYear').value) || 2026,
            currency: document.getElementById('taxCurrency').value,
            incomeType: document.getElementById('taxIncomeType').value,
            income: parseFloat(document.getElementById('taxIncome').value) || 0,
            period: document.getElementById('taxPeriod').value,
            status: document.getElementById('taxStatus').value,
            startMonth: parseInt(document.getElementById('taxStartMonth').value) || 1,
            startDay: parseInt(document.getElementById('taxStartDay').value) || 1,
            endMonth: parseInt(document.getElementById('taxEndMonth').value) || 12,
            endDay: parseInt(document.getElementById('taxEndDay').value) || 31,
            pension: parseFloat(document.getElementById('taxPension').value) || 0,
            insurance: parseFloat(document.getElementById('taxInsurance').value) || 0,
            reliefs: parseFloat(document.getElementById('taxReliefs').value) || 0,
            deductions: parseFloat(document.getElementById('taxDeductions').value) || 0,
            allowances: parseFloat(document.getElementById('taxAllowances').value) || 0,
            credits: parseFloat(document.getElementById('taxCredits').value) || 0,
            payePaid: parseFloat(document.getElementById('taxPayePaid').value) || 0,
            whtPaid: parseFloat(document.getElementById('taxWhtPaid').value) || 0,
            vat: parseFloat(document.getElementById('taxVat').value) || 0
        };
    },

    validate(i) {
        if (i.income < 0) return 'Gross income must be ≥ 0.';
        if (!i.currency) return 'Please select a currency.';
        if (i.startMonth > i.endMonth || (i.startMonth === i.endMonth && i.startDay > i.endDay)) {
            return 'Start date must be before end date.';
        }
        const startDays = daysInMonth(i.year, i.startMonth - 1);
        const endDays = daysInMonth(i.year, i.endMonth - 1);
        if (i.startDay > startDays) return `Start day exceeds days in ${MONTHS[i.startMonth - 1]} (${startDays}).`;
        if (i.endDay > endDays) return `End day exceeds days in ${MONTHS[i.endMonth - 1]} (${endDays}).`;
        const brackets = state.tax.brackets;
        for (const b of brackets) {
            if (b.rate < 0 || b.rate > 100) return 'Tax rates must be between 0% and 100%.';
        }
        const sorted = [...brackets].sort((a, b) => a.min - b.min);
        for (let k = 1; k < sorted.length; k++) {
            if (sorted[k].min < sorted[k - 1].max && sorted[k - 1].max !== Infinity) {
                return 'Tax brackets must not overlap.';
            }
        }
        return null;
    },

    incomeToYearly(amount, period) {
        return { daily: 365, weekly: 52, monthly: 12, quarterly: 4, yearly: 1 }[period] * amount;
    },

    applyBrackets(taxable, brackets) {
        const sorted = [...brackets].sort((a, b) => a.min - b.min);
        let tax = 0;
        let marginal = 0;
        const breakdown = [];
        for (const b of sorted) {
            const upper = b.max === Infinity ? Infinity : b.max;
            const inBracket = Math.max(0, Math.min(taxable, upper) - b.min);
            if (inBracket > 0) {
                const bTax = inBracket * (b.rate / 100);
                tax += bTax;
                marginal = b.rate;
                breakdown.push({
                    min: b.min, max: b.max, rate: b.rate,
                    amount: inBracket, tax: bTax
                });
            }
            if (taxable <= upper) break;
        }
        return { tax, marginal, breakdown };
    },

    calculate() {
        const i = this.readInputs();
        const err = this.validate(i);
        if (err) { showToast(err, 'error', 3000); return; }
        Object.assign(state.tax, i);

        const yearlyGross = this.incomeToYearly(i.income, i.period);
        const preset = TAX_PRESETS[i.country];
        let cra = 0;
        if (preset && preset.cra) {
            cra = preset.cra.base + yearlyGross * preset.cra.percentOfGross;
        }
        const totalDeductions = i.pension + i.insurance + i.reliefs + i.deductions + i.allowances + cra;
        const taxable = Math.max(0, yearlyGross - totalDeductions);
        const { tax: rawTax, marginal, breakdown } = this.applyBrackets(taxable, state.tax.brackets);
        const taxAfterCredits = Math.max(0, rawTax - i.credits);
        const alreadyPaid = i.payePaid + i.whtPaid;
        const taxPayable = Math.max(0, taxAfterCredits - alreadyPaid);
        const netYearly = yearlyGross - taxAfterCredits - i.pension - i.insurance;
        const effectiveRate = yearlyGross > 0 ? (taxAfterCredits / yearlyGross) * 100 : 0;

        const result = {
            yearlyGross, totalDeductions, taxable,
            rawTax, taxAfterCredits, taxPayable,
            netYearly, effectiveRate, marginal,
            breakdown, cra, currency: i.currency
        };
        state.tax.result = result;
        this.renderResults(result, i);
        playSound(700, 60);
    },

    renderResults(r, i) {
        document.getElementById('taxResults').style.display = '';
        const sym = CURRENCIES[r.currency]?.symbol || '';
        const fmt = (v) => sym + v.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

        document.getElementById('taxPayable').textContent = fmt(r.taxPayable);
        document.getElementById('taxGross').textContent = fmt(r.yearlyGross);
        document.getElementById('taxDedTotal').textContent = fmt(r.totalDeductions);
        document.getElementById('taxTaxable').textContent = fmt(r.taxable);
        document.getElementById('taxNet').textContent = fmt(r.netYearly);
        document.getElementById('taxEffRate').textContent = r.effectiveRate.toFixed(2) + '%';
        document.getElementById('taxMargRate').textContent = r.marginal.toFixed(2) + '%';
        document.getElementById('taxMonthlyNet').textContent = fmt(r.netYearly / 12);
        document.getElementById('taxDaily').textContent = fmt(r.taxAfterCredits / 365);

        this.renderDonut(r);
        this.renderBarChart(r);
        this.renderBreakdownTable(r);
    },

    renderDonut(r) {
        const total = r.yearlyGross || 1;
        const tPct = (r.taxAfterCredits / total) * 100;
        const nPct = 100 - tPct;
        const wrap = document.getElementById('taxDonut');
        wrap.innerHTML = `
            <svg viewBox="0 0 200 200" width="100%" height="200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="var(--accent-success)" stroke-width="35"
                    stroke-dasharray="${nPct * 5.026} 502.6" transform="rotate(-90 100 100)"/>
                <circle cx="100" cy="100" r="80" fill="none" stroke="var(--accent-danger)" stroke-width="35"
                    stroke-dasharray="${tPct * 5.026} 502.6" stroke-dashoffset="${-nPct * 5.026}" transform="rotate(-90 100 100)"/>
                <text x="100" y="100" text-anchor="middle" dy=".3em" fill="var(--text-primary)" font-size="14" font-weight="600">Income</text>
            </svg>
            <div class="chart-legend">
                <span class="legend-item"><span class="legend-dot" style="background:var(--accent-success)"></span>Net ${nPct.toFixed(1)}%</span>
                <span class="legend-item"><span class="legend-dot" style="background:var(--accent-danger)"></span>Tax ${tPct.toFixed(1)}%</span>
            </div>
        `;
    },

    renderBarChart(r) {
        const wrap = document.getElementById('taxBarChart');
        if (!r.breakdown.length) { wrap.innerHTML = '<div class="chart-meta">No tax due in any bracket</div>'; return; }
        const maxTax = Math.max(...r.breakdown.map(b => b.tax));
        wrap.innerHTML = `
            <div class="bar-chart-inner">
                ${r.breakdown.map(b => {
                    const pct = (b.tax / maxTax) * 100;
                    return `
                        <div class="bar-row">
                            <span class="bar-label">${b.rate}% bracket</span>
                            <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                            <span class="bar-value">${(CURRENCIES[r.currency]?.symbol || '')}${b.tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderBreakdownTable(r) {
        const tbl = document.getElementById('taxBreakdownTable');
        const sym = CURRENCIES[r.currency]?.symbol || '';
        const fmt = (v) => sym + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
        const rows = r.breakdown.map(b => `
            <tr>
                <td>${fmt(b.min)} – ${b.max === Infinity ? '∞' : fmt(b.max)}</td>
                <td>${b.rate}%</td>
                <td>${fmt(b.amount)}</td>
                <td>${fmt(b.tax)}</td>
            </tr>
        `).join('');
        tbl.innerHTML = `
            <thead><tr><th>Bracket</th><th>Rate</th><th>Amount in Bracket</th><th>Tax</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="4">No tax due</td></tr>'}</tbody>
        `;
    },

    exportCSV() {
        if (!state.tax.result) { showToast('Calculate first', 'warning', 1500); return; }
        const r = state.tax.result;
        const header = 'BracketMin,BracketMax,Rate%,AmountInBracket,Tax\n';
        const lines = r.breakdown.map(b =>
            [b.min, b.max === Infinity ? 'Infinity' : b.max, b.rate, b.amount.toFixed(2), b.tax.toFixed(2)].join(',')
        ).join('\n');
        const summary = `\n\nSummary\nGross,${r.yearlyGross.toFixed(2)}\nDeductions,${r.totalDeductions.toFixed(2)}\nTaxable,${r.taxable.toFixed(2)}\nTax,${r.taxAfterCredits.toFixed(2)}\nNet,${r.netYearly.toFixed(2)}\nEffective,${r.effectiveRate.toFixed(2)}%\n`;
        const blob = new Blob([header + lines + summary], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-breakdown-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('CSV downloaded', 'success', 1500);
    },

    copySummary() {
        if (!state.tax.result) { showToast('Calculate first', 'warning', 1500); return; }
        const r = state.tax.result;
        const sym = CURRENCIES[r.currency]?.symbol || '';
        const fmt = (v) => sym + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
        const text = [
            `Tax Estimate (${r.currency})`,
            `Gross (yearly): ${fmt(r.yearlyGross)}`,
            `Total Deductions: ${fmt(r.totalDeductions)}`,
            `Taxable: ${fmt(r.taxable)}`,
            `Tax Payable: ${fmt(r.taxPayable)}`,
            `Net Income: ${fmt(r.netYearly)}`,
            `Effective Rate: ${r.effectiveRate.toFixed(2)}%`,
            `Marginal Rate: ${r.marginal.toFixed(2)}%`
        ].join('\n');
        navigator.clipboard.writeText(text).then(
            () => showToast('Summary copied', 'success', 1500),
            () => showToast('Copy failed', 'error', 1500)
        );
    },

    save() {
        if (!state.tax.result) { showToast('Calculate first', 'warning', 1500); return; }
        const i = this.readInputs();
        const preset = {
            id: Date.now(),
            label: `${TAX_PRESETS[i.country]?.name || i.country} • ${CURRENCIES[i.currency]?.symbol || ''}${i.income.toLocaleString()}/${i.period}`,
            data: { ...i, brackets: JSON.parse(JSON.stringify(state.tax.brackets)) }
        };
        state.tax.presets.unshift(preset);
        if (state.tax.presets.length > 20) state.tax.presets.pop();
        Storage.save('taxPresets', state.tax.presets);
        this.renderPresets();
        showToast('Tax estimate saved', 'success', 1500);
    },

    reset() {
        state.tax.result = null;
        document.getElementById('taxResults').style.display = 'none';
        this.loadCountryPreset(state.tax.country);
        showToast('Tax calculator reset', 'info', 1500);
    },

    renderPresets() {
        const list = document.getElementById('taxPresets');
        if (!list) return;
        if (state.tax.presets.length === 0) {
            list.innerHTML = '<div class="presets-empty">No saved estimates yet</div>';
            return;
        }
        list.innerHTML = state.tax.presets.map(p => `
            <div class="preset-chip" data-id="${p.id}">
                <span>${p.label}</span>
                <button class="remove-preset" data-id="${p.id}">×</button>
            </div>
        `).join('');
        list.querySelectorAll('.preset-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-preset')) return;
                const id = parseInt(chip.dataset.id);
                const preset = state.tax.presets.find(p => p.id === id);
                if (preset) {
                    Object.assign(state.tax, preset.data);
                    if (preset.data.brackets) state.tax.brackets = JSON.parse(JSON.stringify(preset.data.brackets));
                    this.loadFromState();
                    this.renderBracketsEditor();
                    this.calculate();
                }
            });
        });
        list.querySelectorAll('.remove-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                state.tax.presets = state.tax.presets.filter(p => p.id !== parseInt(btn.dataset.id));
                Storage.save('taxPresets', state.tax.presets);
                this.renderPresets();
                showToast('Estimate removed', 'info', 1200);
            });
        });
    },

    // For AI integration: quick yearly tax calc with current country brackets
    quickCalc(yearlyIncome, countryCode = 'NG') {
        const preset = TAX_PRESETS[countryCode] || TAX_PRESETS.NG;
        let cra = 0;
        if (preset.cra) cra = preset.cra.base + yearlyIncome * preset.cra.percentOfGross;
        const taxable = Math.max(0, yearlyIncome - cra);
        const { tax, marginal } = this.applyBrackets(taxable, preset.brackets);
        const net = yearlyIncome - tax;
        const effective = yearlyIncome > 0 ? (tax / yearlyIncome) * 100 : 0;
        return { yearlyIncome, taxable, tax, net, effective, marginal, currency: preset.currency };
    }
};

// ===== VOICE COMMANDS =====
const Voice = {
    recognition: null,
    callback: null,

    init() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            console.warn('Speech recognition not supported');
            return false;
        }
        this.recognition = new SR();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = state.settings.voiceLang;

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join('');
            document.getElementById('voiceTranscript').textContent = transcript;

            if (event.results[event.results.length - 1].isFinal) {
                this.stop();
                if (this.callback) {
                    this.callback(transcript);
                } else {
                    this.handleCommand(transcript);
                }
            }
        };

        this.recognition.onerror = (e) => {
            console.warn('Voice error:', e);
            this.stop();
            showToast('Voice recognition error: ' + e.error, 'error');
        };

        this.recognition.onend = () => {
            this.stop();
        };

        return true;
    },

    start(callback = null) {
        if (!this.recognition && !this.init()) {
            showToast('Voice not supported in this browser', 'error');
            return;
        }
        this.callback = callback;
        this.recognition.lang = state.settings.voiceLang;
        document.getElementById('voiceOverlay').classList.add('active');
        document.getElementById('voiceTranscript').textContent = 'Listening...';
        document.getElementById('voiceBtn').classList.add('listening');
        try {
            this.recognition.start();
        } catch (e) {
            console.warn(e);
        }
    },

    stop() {
        try {
            this.recognition && this.recognition.stop();
        } catch (e) {}
        document.getElementById('voiceOverlay').classList.remove('active');
        document.getElementById('voiceBtn').classList.remove('listening');
    },

    handleCommand(transcript) {
        const t = transcript.toLowerCase();

        // Mode switches
        if (t.includes('calculator') || t.includes('calculate')) {
            if (!t.match(/\d/)) {
                switchMode('calculator');
                showToast('Switched to Calculator', 'success');
                return;
            }
        }
        if (t.includes('currency') || t.includes('exchange')) {
            if (!t.match(/\d/)) {
                switchMode('currency');
                return;
            }
        }
        if (t.includes('convert') && t.match(/\d/)) {
            // Go to AI for any conversion
            switchMode('ai');
            document.getElementById('aiInput').value = transcript;
            AI.processQuery(transcript);
            return;
        }
        if (t.includes('metric') || t.includes('unit')) {
            if (!t.match(/\d/)) {
                switchMode('metric');
                return;
            }
        }

        // Clear
        if (t === 'clear' || t.includes('clear screen')) {
            Calculator.handleAction('clear');
            showToast('Cleared', 'info');
            return;
        }

        // Math calculation via AI
        switchMode('ai');
        document.getElementById('aiInput').value = transcript;
        AI.processQuery(transcript);
    }
};

// ===== THEMES =====
const Themes = {
    init() {
        const saved = Storage.load('theme', 'dark');
        this.apply(saved);
        state.settings.theme = saved;

        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.apply(theme);
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                Storage.save('theme', theme);
                state.settings.theme = theme;
                showToast(`Theme: ${theme}`, 'info', 1500);
            });
        });

        // Custom theme
        document.getElementById('applyCustomTheme').addEventListener('click', () => {
            const p = document.getElementById('customPrimary').value;
            const s = document.getElementById('customSecondary').value;
            const b = document.getElementById('customBg').value;
            document.documentElement.style.setProperty('--accent-primary', p);
            document.documentElement.style.setProperty('--accent-secondary', s);
            document.documentElement.style.setProperty('--bg-primary', b);
            Storage.save('customTheme', { p, s, b });
            showToast('Custom theme applied', 'success');
        });

        // Load custom theme if exists
        const custom = Storage.load('customTheme');
        if (custom && saved === 'custom') {
            document.documentElement.style.setProperty('--accent-primary', custom.p);
            document.documentElement.style.setProperty('--accent-secondary', custom.s);
            document.documentElement.style.setProperty('--bg-primary', custom.b);
        }
    },

    apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-option').forEach(b => {
            b.classList.toggle('active', b.dataset.theme === theme);
        });
    }
};

// ===== MODE SWITCHING =====
function switchMode(mode) {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.mode-tab[data-mode="${mode}"]`).classList.add('active');

    document.querySelectorAll('.mode-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${mode}-mode`).classList.add('active');
}

// ===== KEYBOARD SUPPORT =====
function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        // Don't capture when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        // Voice shortcut
        if (e.ctrlKey && e.code === 'Space') {
            e.preventDefault();
            Voice.start();
            return;
        }

        // Only process for calculator mode
        if (!document.getElementById('calculator-mode').classList.contains('active')) return;

        const key = e.key;
        if (/^[0-9]$/.test(key)) {
            Calculator.handleAction('number', key);
            animateButton(`[data-action="number"][data-value="${key}"]`);
        } else if (key === '.') {
            Calculator.handleAction('decimal');
            animateButton('[data-action="decimal"]');
        } else if (['+', '-', '*', '/'].includes(key)) {
            Calculator.handleAction('operator', key);
            animateButton(`[data-action="operator"][data-value="${key}"]`);
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            Calculator.handleAction('equals');
            animateButton('[data-action="equals"]');
        } else if (key === 'Backspace') {
            Calculator.handleAction('backspace');
            animateButton('[data-action="backspace"]');
        } else if (key === 'Escape') {
            Calculator.handleAction('clear');
            animateButton('[data-action="clear"]');
        } else if (key === '%') {
            Calculator.handleAction('percent');
        }
    });
}

function animateButton(selector) {
    const btn = document.querySelector(`#${state.calculator.mode}-calc ${selector}, .standard-calc.active ${selector}, .scientific-calc.active ${selector}`);
    if (btn) {
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 200);
    }
}

// ===== INITIALIZATION =====
const SETTINGS_VERSION = 2;

function init() {
    // Load saved state
    state.calculator.history = Storage.load('history', []);
    state.currency.presets = Storage.load('currencyPresets', []);
    state.metric.presets = Storage.load('metricPresets', []);
    state.ovulation.presets = Storage.load('ovulationPresets', []);
    state.loan.presets = Storage.load('loanPresets', []);
    state.tax.presets = Storage.load('taxPresets', []);
    const savedSettings = Storage.load('settings');
    if (savedSettings) {
        if ((savedSettings.settingsVersion || 0) >= SETTINGS_VERSION) {
            Object.assign(state.settings, savedSettings);
        } else {
            // v2 migration: force the four toggles ON, preserve other prefs
            Object.assign(state.settings, savedSettings, {
                sound: true,
                haptic: true,
                animations: true,
                liveRates: true,
                settingsVersion: SETTINGS_VERSION
            });
            Storage.save('settings', state.settings);
        }
    } else {
        state.settings.settingsVersion = SETTINGS_VERSION;
    }

    // Apply settings to UI
    document.getElementById('soundToggle').checked = state.settings.sound;
    document.getElementById('hapticToggle').checked = state.settings.haptic;
    document.getElementById('animToggle').checked = state.settings.animations;
    document.getElementById('liveRatesToggle').checked = state.settings.liveRates;
    document.getElementById('decimalPlaces').value = state.settings.decimalPlaces;
    document.getElementById('voiceLang').value = state.settings.voiceLang;

    if (!state.settings.animations) document.body.classList.add('no-anim');

    // Init modules
    Themes.init();
    Currency.init();
    Metric.init();
    AI.init();
    Ovulation.init();
    Loan.init();
    Tax.init();
    Voice.init();
    Calculator.renderHistory();
    Calculator.updateDisplay();
    initKeyboard();

    // Mode tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', () => switchMode(tab.dataset.mode));
    });

    // Calc buttons
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const value = btn.dataset.value;
            Calculator.handleAction(action, value);
            btn.classList.add('pressed');
            setTimeout(() => btn.classList.remove('pressed'), 200);
        });
    });

    // Calc mode toggle
    document.querySelectorAll('.toggle-btn[data-calc-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn[data-calc-mode]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.calculator.mode = btn.dataset.calcMode;
            document.querySelectorAll('.calc-buttons').forEach(c => c.classList.remove('active'));
            document.getElementById(`${state.calculator.mode}-calc`).classList.add('active');
            Calculator.updateDisplay();
        });
    });

    // Prog base
    document.querySelectorAll('.prog-base').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.prog-base').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.calculator.programmerBase = parseInt(btn.dataset.base);

            // Enable/disable hex buttons
            document.querySelectorAll('.hex-btn').forEach(b => {
                b.disabled = state.calculator.programmerBase !== 16;
            });
        });
    });

    // Header buttons
    document.getElementById('voiceBtn').addEventListener('click', () => Voice.start());
    document.getElementById('historyBtn').addEventListener('click', () => {
        document.getElementById('historyPanel').classList.toggle('hidden');
    });
    document.getElementById('themeBtn').addEventListener('click', () => {
        document.getElementById('themePanel').classList.toggle('open');
        document.getElementById('settingsPanel').classList.remove('open');
    });
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.toggle('open');
        document.getElementById('themePanel').classList.remove('open');
    });
    document.getElementById('closeThemePanel').addEventListener('click', () => {
        document.getElementById('themePanel').classList.remove('open');
    });
    document.getElementById('closeSettingsPanel').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.remove('open');
    });
    document.getElementById('clearHistoryBtn').addEventListener('click', () => Calculator.clearHistory());
    document.getElementById('cancelVoice').addEventListener('click', () => Voice.stop());

    // Settings
    document.getElementById('soundToggle').addEventListener('change', (e) => {
        state.settings.sound = e.target.checked;
        Storage.save('settings', state.settings);
    });
    document.getElementById('hapticToggle').addEventListener('change', (e) => {
        state.settings.haptic = e.target.checked;
        Storage.save('settings', state.settings);
    });
    document.getElementById('animToggle').addEventListener('change', (e) => {
        state.settings.animations = e.target.checked;
        document.body.classList.toggle('no-anim', !e.target.checked);
        Storage.save('settings', state.settings);
    });
    document.getElementById('liveRatesToggle').addEventListener('change', (e) => {
        state.settings.liveRates = e.target.checked;
        Storage.save('settings', state.settings);
        if (e.target.checked) Currency.fetchLiveRates();
    });
    document.getElementById('decimalPlaces').addEventListener('change', (e) => {
        state.settings.decimalPlaces = parseInt(e.target.value);
        Storage.save('settings', state.settings);
        Currency.convert();
        Metric.convert();
    });
    document.getElementById('voiceLang').addEventListener('change', (e) => {
        state.settings.voiceLang = e.target.value;
        Storage.save('settings', state.settings);
    });

    document.getElementById('resetAllBtn').addEventListener('click', () => {
        if (confirm('Reset all settings, history, and presets? This cannot be undone.')) {
            Storage.clearAll();
            location.reload();
        }
    });

    // Open About section from footer
    const openAboutBtn = document.getElementById('openAboutBtn');
    if (openAboutBtn) {
        openAboutBtn.addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.add('open');
            document.getElementById('themePanel').classList.remove('open');
            setTimeout(() => {
                const aboutSection = document.querySelector('.about-section');
                if (aboutSection) aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 350);
        });
    }

    // Close panels on outside click
    document.addEventListener('click', (e) => {
        const themePanel = document.getElementById('themePanel');
        const settingsPanel = document.getElementById('settingsPanel');
        if (themePanel.classList.contains('open') &&
            !themePanel.contains(e.target) &&
            !document.getElementById('themeBtn').contains(e.target)) {
            themePanel.classList.remove('open');
        }
        if (settingsPanel.classList.contains('open') &&
            !settingsPanel.contains(e.target) &&
            !document.getElementById('settingsBtn').contains(e.target)) {
            settingsPanel.classList.remove('open');
        }
    });

    // Welcome toast
    setTimeout(() => {
        showToast('Welcome to Nexus Calculator! Press Ctrl+Space for voice.', 'info', 4000);
    }, 500);
}

// Start the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
