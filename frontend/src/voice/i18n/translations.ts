// Step 10: per-language dictionaries the translate-then-parse step (see
// translate.ts) uses to turn a non-English transcript into the English
// command syntax parseCommand.ts already understands — rather than
// maintaining a separate regex pattern set per language (which Day 3's
// English patterns already show is a lot of surface area for one
// language). Coverage is deliberately scoped to the brief's own command
// vocabulary (add/remove/need/buy/find/bought/clear-checked, numbers,
// units, common grocery nouns) — same honest trade-off Day 3 documented
// for English: instant and offline, but unrecognized words pass through
// untranslated rather than failing outright.
//
// Spanish and French are SVO like English, so simple phrase-then-word
// token substitution (`SvoLanguagePack`) preserves sentence structure and
// just swaps the vocabulary. Hindi is SOV ("मुझे दूध चाहिए" = "to-me milk
// needed", verb last) — substituting words in place would leave the verb
// in the wrong position for parseCommand's English-order regexes, so Hindi
// instead matches whole-sentence templates and rebuilds the equivalent
// English command (`SovLanguagePack`).

export interface SvoLanguagePack {
  kind: 'svo'
  // Longest phrases are tried first; each is a token sequence (already
  // lowercase, no punctuation) mapped to its English replacement.
  phrases: Array<{ from: string[]; to: string }>
  words: Record<string, string>
}

export interface SovLanguagePack {
  kind: 'sov'
  // Matched in order against the whole normalized transcript; the first
  // hit wins. `build` receives the captured object phrase already run
  // through `words` (numbers/units/nouns) and returns the full English
  // command string.
  templates: Array<{ pattern: RegExp; build: (translatedObject: string) => string }>
  words: Record<string, string>
}

export type LanguagePack = SvoLanguagePack | SovLanguagePack

const SPANISH: SvoLanguagePack = {
  kind: 'svo',
  phrases: [
    { from: ['quiero', 'comprar'], to: 'i want to buy' },
    { from: ['ya', 'compré'], to: 'i bought' },
    { from: ['de', 'mi', 'lista'], to: 'from my list' },
    { from: ['como', 'comprado'], to: 'as bought' },
    { from: ['limpiar', 'marcados'], to: 'clear checked items' },
    { from: ['borrar', 'marcados'], to: 'clear checked items' },
    { from: ['menos', 'de'], to: 'under' },
    { from: ['más', 'de'], to: 'over' },
    { from: ['por', 'favor'], to: '' },
  ],
  words: {
    añade: 'add', añadir: 'add', agrega: 'add', agregar: 'add', pon: 'put',
    necesito: 'i need',
    quita: 'remove', quitar: 'remove', elimina: 'remove', eliminar: 'remove',
    borra: 'remove', borrar: 'remove', remueve: 'remove', remover: 'remove',
    marca: 'mark', marcar: 'mark', compré: 'i bought',
    busca: 'find', buscar: 'find', encuentra: 'find', 'encuéntrame': 'find me',
    en: 'on', de: 'of', mi: 'my', mis: 'my', la: 'the', el: 'the', los: 'the', las: 'the', lista: 'list',
    'dólares': 'dollars', 'dólar': 'dollars',
    botella: 'bottle', botellas: 'bottles', docena: 'dozen', docenas: 'dozens',
    paquete: 'pack', paquetes: 'pack', litro: 'l', litros: 'l',
    kilo: 'kg', kilos: 'kg', kilogramo: 'kg', kilogramos: 'kg', gramo: 'g', gramos: 'g',
    uno: 'one', una: 'one', dos: 'two', tres: 'three', cuatro: 'four', cinco: 'five',
    seis: 'six', siete: 'seven', ocho: 'eight', nueve: 'nine', diez: 'ten',
    // Deliberately no grocery-noun translations (leche, huevos, manzana...)
    // — unlike Hindi, Spanish/French item names are meant to stay in their
    // own language in the cart (command *structure* still translates to
    // English so parseCommand can parse it, but the noun itself passes
    // through untouched, same mechanism Hindi already relies on for
    // out-of-vocabulary words). Trade-off: categoryKeywords.ts only knows
    // English keywords, so these items usually land in "Other" rather than
    // being auto-categorized — acceptable since this app's category
    // grouping is a convenience, not a requirement.
  },
}

const FRENCH: SvoLanguagePack = {
  kind: 'svo',
  phrases: [
    { from: ['je', 'veux', 'acheter'], to: 'i want to buy' },
    { from: ["j'ai", 'besoin'], to: 'i need' },
    { from: ["j'ai", 'acheté'], to: 'i bought' },
    { from: ['de', 'ma', 'liste'], to: 'from my list' },
    { from: ['comme', 'acheté'], to: 'as bought' },
    { from: ['effacer', 'les', 'coches'], to: 'clear checked items' },
    { from: ['moins', 'de'], to: 'under' },
    { from: ['plus', 'de'], to: 'over' },
    { from: ["s'il", 'te', 'plaît'], to: '' },
  ],
  words: {
    ajoute: 'add', ajouter: 'add', mets: 'put',
    retire: 'remove', 'enlève': 'remove', supprime: 'remove', supprimer: 'remove',
    marque: 'mark', trouve: 'find', cherche: 'find',
    sur: 'on', de: '', du: '', des: '', ma: 'my', mes: 'my', liste: 'list',
    le: 'the', la: 'the', les: 'the',
    dollars: 'dollars', euros: 'dollars',
    bouteille: 'bottle', bouteilles: 'bottles', douzaine: 'dozen',
    paquet: 'pack', paquets: 'pack', litre: 'l', litres: 'l',
    kilo: 'kg', kilos: 'kg', gramme: 'g', grammes: 'g',
    un: 'one', une: 'one', deux: 'two', trois: 'three', quatre: 'four', cinq: 'five',
    six: 'six', sept: 'seven', huit: 'eight', neuf: 'nine', dix: 'ten',
    // No grocery-noun translations here either — see the matching comment
    // in SPANISH above for why French item names stay in French.
  },
}

export const HINDI: SovLanguagePack = {
  kind: 'sov',
  // Templates and words below cover BOTH Devanagari script ("जोड़ो") and
  // Hinglish — Hindi spoken/typed in Latin script ("jodo"). Hinglish is
  // extremely common in practice: it's how most Hindi speakers type on a
  // phone, and browser speech recognition set to Hindi will still often
  // transliterate rather than render Devanagari. Same grammar (SOV) either
  // way, just a second script — so this is one romanized template/word set
  // layered onto the existing Devanagari one, tried in the same pass,
  // rather than a second language pack. Transliteration spelling isn't
  // standardized ("hatao" vs "hataao"), so common variants are listed
  // explicitly rather than guessed — the same honest "unmapped phrasing
  // passes through" trade-off as the rest of this file.
  templates: [
    { pattern: /^(?:चेक किए हुए हटाओ|मार्क किए हुए हटाओ|खरीदे हुए हटाओ)$/, build: () => 'clear checked items' },
    { pattern: /^(?:check kiye hue hatao|mark kiye hue hatao|khareede? hue hatao)$/, build: () => 'clear checked items' },
    { pattern: /^मुझे\s+(.+?)\s+चाहिए$/, build: (o) => `i need ${o}` },
    { pattern: /^mujhe\s+(.+?)\s+chahiye$/, build: (o) => `i need ${o}` },
    { pattern: /^(.+?)\s+खरीदना\s+है$/, build: (o) => `i want to buy ${o}` },
    { pattern: /^(.+?)\s+khareedna\s+hai$/, build: (o) => `i want to buy ${o}` },
    { pattern: /^(.+?)\s+खरीद\s+लिया$/, build: (o) => `i bought ${o}` },
    { pattern: /^(.+?)\s+khareed\s+liya$/, build: (o) => `i bought ${o}` },
    { pattern: /^(.+?)\s+खरीदा हुआ मार्क करो$/, build: (o) => `mark ${o} as bought` },
    { pattern: /^(.+?)\s+khareeda hua mark karo$/, build: (o) => `mark ${o} as bought` },
    { pattern: /^(.+?)\s+(?:हटाओ|निकालो|मिटाओ)$/, build: (o) => `remove ${o}` },
    { pattern: /^(.+?)\s+(?:hatao|hataao|nikalo|nikaalo|mitao|mitaao)$/, build: (o) => `remove ${o}` },
    { pattern: /^(.+?)\s+(?:जोड़ो|डालो)$/, build: (o) => `add ${o}` },
    { pattern: /^(.+?)\s+(?:jodo|jod do|dalo|daalo)$/, build: (o) => `add ${o}` },
    { pattern: /^(.+?)\s+(?:ढूंढो|खोजो)$/, build: (o) => `find ${o}` },
    { pattern: /^(.+?)\s+(?:dhoondo|dhundo|khojo)$/, build: (o) => `find ${o}` },
  ],
  words: {
    'एक': 'one', 'दो': 'two', 'तीन': 'three', 'चार': 'four', 'पांच': 'five', 'पाँच': 'five',
    'छह': 'six', 'छः': 'six', 'सात': 'seven', 'आठ': 'eight', 'नौ': 'nine', 'दस': 'ten',
    ek: 'one', do: 'two', teen: 'three', char: 'four', chaar: 'four', paanch: 'five', panch: 'five',
    chhah: 'six', che: 'six', saat: 'seven', aath: 'eight', nau: 'nine', das: 'ten',
    // "आधा दर्जन अंडे" (half a dozen eggs) / "आधा किलो चावल" (half a kg of
    // rice) — same 'half UNIT' shape parseCommand already understands once
    // translated, see extractQuantityAndUnit in parseCommand.ts.
    'आधा': 'half', 'आधी': 'half', aadha: 'half', aadhi: 'half',
    'दर्जन': 'dozen', 'बोतल': 'bottle', 'पैकेट': 'pack', 'लीटर': 'l', 'मिली': 'ml', 'मिलीलीटर': 'ml',
    'किलो': 'kg', 'ग्राम': 'g',
    dozan: 'dozen', darjan: 'dozen', botal: 'bottle', packet: 'pack', litre: 'l', liter: 'l',
    mili: 'ml', millilitre: 'ml', kilo: 'kg', gram: 'g', gramme: 'g',
    'दूध': 'milk', 'अंडे': 'eggs', 'अंडा': 'egg', 'ब्रेड': 'bread', 'रोटी': 'bread',
    'सेब': 'apples', 'केला': 'banana', 'केले': 'bananas', 'पानी': 'water', 'पनीर': 'cheese',
    'टमाटर': 'tomatoes', 'मक्खन': 'butter', 'चावल': 'rice', 'चीनी': 'sugar', 'चाय': 'tea',
    'कॉफी': 'coffee', 'साबुन': 'soap', 'आटा': 'flour',
    doodh: 'milk', ande: 'eggs', anda: 'egg', roti: 'bread', bread: 'bread',
    seb: 'apples', sebh: 'apples', kela: 'banana', kele: 'bananas', paani: 'water', pani: 'water',
    paneer: 'cheese', tamatar: 'tomatoes', makkhan: 'butter', chawal: 'rice', chaawal: 'rice',
    cheeni: 'sugar', chini: 'sugar', chai: 'tea', coffee: 'coffee', sabun: 'soap', aata: 'flour', atta: 'flour',
    // Broader produce/pantry vocabulary, matched against
    // categoryKeywords.ts's produce list so these land in the right
    // category too, not just translate correctly. Deliberately skips
    // grocery words Hindi speakers already commonly say in English
    // (toothpaste, shampoo, chocolate, ghee, batteries...) — those need
    // no dictionary entry since they pass through untranslated and match
    // the catalog's English name directly, same as any English word would.
    'प्याज': 'onion', pyaz: 'onion', 'आलू': 'potato', aloo: 'potato',
    'गाजर': 'carrot', gajar: 'carrot', 'लहसुन': 'garlic', lehsun: 'garlic',
    'अदरक': 'ginger', adrak: 'ginger', 'खीरा': 'cucumber', kheera: 'cucumber', khira: 'cucumber',
    'नींबू': 'lemon', nimbu: 'lemon', 'मिर्च': 'pepper', mirch: 'pepper',
    'शिमला मिर्च': 'bell pepper', 'shimla mirch': 'bell pepper',
    'गोभी': 'cauliflower', gobi: 'cauliflower', 'फूल गोभी': 'cauliflower', 'phool gobi': 'cauliflower',
    'पत्ता गोभी': 'cabbage', 'patta gobi': 'cabbage',
    'मटर': 'peas', matar: 'peas', 'फली': 'beans', phalli: 'beans', 'सेम': 'beans', sem: 'beans',
    'आम': 'mango', aam: 'mango', 'संतरा': 'orange', santra: 'orange',
    'अंगूर': 'grapes', angoor: 'grapes', 'तरबूज': 'watermelon', tarbooz: 'watermelon',
    'पपीता': 'papaya', papita: 'papaya', 'अमरूद': 'guava', amrud: 'guava',
    'अनार': 'pomegranate', anaar: 'pomegranate', 'कद्दू': 'pumpkin', kaddu: 'pumpkin',
    'बैंगन': 'eggplant', baingan: 'eggplant', 'भिंडी': 'okra', bhindi: 'okra',
    'दही': 'yogurt', dahi: 'yogurt',
    'तेल': 'oil', tel: 'oil', 'नमक': 'salt', namak: 'salt',
    'गेहूं': 'wheat', gehu: 'wheat', gehun: 'wheat', 'बेसन': 'gram flour', besan: 'gram flour',
    'मक्का': 'corn', makka: 'corn', 'भुट्टा': 'corn', bhutta: 'corn',
    // Price-filtered search ("5 डॉलर से कम टूथपेस्ट ढूंढो" / "5 dollar se
    // kam toothpaste dhoondo" — literally "5 dollars from-less toothpaste
    // find", Hindi's qualifier follows the number instead of leading it
    // like English "under 5"). 'से'/'se' is a bare postposition marker
    // with no English equivalent, so it's dropped rather than
    // mistranslated; priceFilters.ts has matching "NUMBER under/over"
    // patterns for the resulting word order. "between X and Y" isn't
    // covered — Hindi phrases that idiom with a trailing "के बीच"/"ke
    // beech" rather than a leading connector, which would need its own
    // reordering template; out of scope for now, same "unmapped phrasing
    // passes through" trade-off as everywhere else in this file.
    'से': '', 'कम': 'under', 'ज़्यादा': 'over', 'ज्यादा': 'over', 'अधिक': 'over',
    'डॉलर': 'dollars', 'रुपये': 'dollars', 'रुपए': 'dollars',
    se: '', kam: 'under', zyada: 'over', jyada: 'over', adhik: 'over',
    dollar: 'dollars', rupaye: 'dollars', rupye: 'dollars', rupee: 'dollars', rupees: 'dollars',
    // "मैंने दूध खरीद लिया" / "maine doodh khareed liya" (lit. "I-erg milk
    // bought") — the subject marker naturally precedes the object in this
    // past-tense construction, unlike this file's other "bought" template,
    // so it needs stripping the same way 'से'/'se' does above. Dropped to
    // '' rather than "i", since "i bought" is already supplied by the
    // template's build() — see the खरीद/khareed liya templates.
    'मैंने': '', maine: '',
  },
}

// Keyed by the two-letter language subtag (langCode.slice(0, 2)), so
// 'es-ES'/'es-MX' etc. all resolve to the same pack.
export const LANGUAGE_PACKS: Record<string, LanguagePack> = {
  es: SPANISH,
  fr: FRENCH,
  hi: HINDI,
}
